package com.opspilot.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.CodedInputStream;
import org.springframework.stereotype.Component;
import org.xerial.snappy.Snappy;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Decodes Loki push payloads exactly as agents send them:
 * <ul>
 *   <li>protobuf + snappy block ({@code application/x-protobuf}) - what Grafana Alloy / Promtail send;</li>
 *   <li>JSON ({@code application/json}) - what Fluent Bit, curl and others send.</li>
 * </ul>
 * Client labels are parsed only so the enforcer can read a container hint; they are never forwarded.
 */
@Component
public class LokiPushParser {

    /** A stream as sent by the client: untrusted labels plus its lines (timestamp in ns, line text). */
    public record RawLine(long tsNanos, String line) {
    }

    public record RawStream(Map<String, String> labels, List<RawLine> lines) {
    }

    public static class PushFormatException extends RuntimeException {
        public PushFormatException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    private final ObjectMapper mapper;

    public LokiPushParser(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    public List<RawStream> parse(byte[] body, String contentType, int maxDecodedBytes) {
        try {
            if (contentType != null && contentType.toLowerCase().contains("json")) {
                return parseJson(body);
            }
            return parseProtobuf(body, maxDecodedBytes);
        } catch (PushFormatException e) {
            throw e;
        } catch (Exception e) {
            throw new PushFormatException("Malformed push payload", e);
        }
    }

    // ---- JSON ----------------------------------------------------------------------------------------------

    List<RawStream> parseJson(byte[] body) throws IOException {
        JsonNode root = mapper.readTree(body);
        List<RawStream> out = new ArrayList<>();
        for (JsonNode s : root.path("streams")) {
            Map<String, String> labels = new LinkedHashMap<>();
            Iterator<Map.Entry<String, JsonNode>> it = s.path("stream").fields();
            while (it.hasNext()) {
                Map.Entry<String, JsonNode> e = it.next();
                labels.put(e.getKey(), e.getValue().asText());
            }
            List<RawLine> lines = new ArrayList<>();
            for (JsonNode v : s.path("values")) {
                if (!v.isArray() || v.size() < 2) continue;
                try {
                    lines.add(new RawLine(Long.parseLong(v.get(0).asText()), v.get(1).asText()));
                } catch (NumberFormatException e) {
                    // skip entries with an unparsable timestamp
                }
            }
            out.add(new RawStream(labels, lines));
        }
        return out;
    }

    // ---- protobuf + snappy ---------------------------------------------------------------------------------

    List<RawStream> parseProtobuf(byte[] compressed, int maxDecodedBytes) throws IOException {
        if (Snappy.uncompressedLength(compressed) > maxDecodedBytes) {
            throw new PushFormatException("Decoded payload too large", null);
        }
        byte[] raw = Snappy.uncompress(compressed);
        CodedInputStream in = CodedInputStream.newInstance(raw);
        List<RawStream> out = new ArrayList<>();
        while (!in.isAtEnd()) {
            int tag = in.readTag();
            if (tag == 0) break;
            if (tag >>> 3 == 1 && (tag & 7) == 2) { // PushRequest.streams
                int len = in.readRawVarint32();
                int limit = in.pushLimit(len);
                out.add(readStream(in));
                in.popLimit(limit);
            } else {
                in.skipField(tag);
            }
        }
        return out;
    }

    private RawStream readStream(CodedInputStream in) throws IOException {
        Map<String, String> labels = new LinkedHashMap<>();
        List<RawLine> lines = new ArrayList<>();
        while (!in.isAtEnd()) {
            int tag = in.readTag();
            if (tag == 0) break;
            int field = tag >>> 3;
            if (field == 1 && (tag & 7) == 2) {
                labels = parseLabelString(in.readStringRequireUtf8());
            } else if (field == 2 && (tag & 7) == 2) {
                int len = in.readRawVarint32();
                int limit = in.pushLimit(len);
                lines.add(readEntry(in));
                in.popLimit(limit);
            } else {
                in.skipField(tag);
            }
        }
        return new RawStream(labels, lines);
    }

    private RawLine readEntry(CodedInputStream in) throws IOException {
        long seconds = 0;
        long nanos = 0;
        String line = "";
        while (!in.isAtEnd()) {
            int tag = in.readTag();
            if (tag == 0) break;
            int field = tag >>> 3;
            if (field == 1 && (tag & 7) == 2) { // google.protobuf.Timestamp
                int len = in.readRawVarint32();
                int limit = in.pushLimit(len);
                while (!in.isAtEnd()) {
                    int t = in.readTag();
                    if (t == 0) break;
                    if (t >>> 3 == 1 && (t & 7) == 0) seconds = in.readInt64();
                    else if (t >>> 3 == 2 && (t & 7) == 0) nanos = in.readInt32();
                    else in.skipField(t);
                }
                in.popLimit(limit);
            } else if (field == 2 && (tag & 7) == 2) {
                line = in.readStringRequireUtf8();
            } else {
                in.skipField(tag); // structured metadata is intentionally ignored
            }
        }
        return new RawLine(seconds * 1_000_000_000L + nanos, line);
    }

    /** Parses a Prometheus-style label set such as {@code {a="b", c="d\"e"}}. Malformed input yields what was parsed so far. */
    static Map<String, String> parseLabelString(String s) {
        Map<String, String> out = new LinkedHashMap<>();
        if (s == null) return out;
        int i = 0;
        int n = s.length();
        while (i < n && s.charAt(i) != '{') i++;
        i++;
        while (i < n) {
            while (i < n && (s.charAt(i) == ' ' || s.charAt(i) == ',')) i++;
            if (i >= n || s.charAt(i) == '}') break;
            int keyStart = i;
            while (i < n && s.charAt(i) != '=' && s.charAt(i) != '}') i++;
            if (i >= n || s.charAt(i) != '=') break;
            String key = s.substring(keyStart, i).trim();
            i++;
            if (i >= n || s.charAt(i) != '"') break;
            i++;
            StringBuilder val = new StringBuilder();
            while (i < n && s.charAt(i) != '"') {
                char c = s.charAt(i);
                if (c == '\\' && i + 1 < n) {
                    char nx = s.charAt(i + 1);
                    val.append(nx == 'n' ? '\n' : nx == 't' ? '\t' : nx);
                    i += 2;
                } else {
                    val.append(c);
                    i++;
                }
            }
            i++; // closing quote
            if (!key.isEmpty()) out.put(key, val.toString());
        }
        return out;
    }
}
