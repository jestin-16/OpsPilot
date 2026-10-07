package com.opspilot.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.protobuf.CodedOutputStream;
import com.opspilot.service.LokiPushParser.PushFormatException;
import com.opspilot.service.LokiPushParser.RawStream;
import org.junit.jupiter.api.Test;
import org.xerial.snappy.Snappy;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LokiPushParserTest {

    private final LokiPushParser parser = new LokiPushParser(new ObjectMapper());

    /** Encodes a logproto.PushRequest by hand (same wire format Alloy/Promtail produce), then snappy-compresses it. */
    private byte[] protobufSnappy(String labels, long seconds, int nanos, String line) throws Exception {
        ByteArrayOutputStream ts = new ByteArrayOutputStream();
        CodedOutputStream tsOut = CodedOutputStream.newInstance(ts);
        tsOut.writeInt64(1, seconds);
        tsOut.writeInt32(2, nanos);
        tsOut.flush();

        ByteArrayOutputStream entry = new ByteArrayOutputStream();
        CodedOutputStream eOut = CodedOutputStream.newInstance(entry);
        eOut.writeByteArray(1, ts.toByteArray());
        eOut.writeString(2, line);
        eOut.flush();

        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        CodedOutputStream sOut = CodedOutputStream.newInstance(stream);
        sOut.writeString(1, labels);
        sOut.writeByteArray(2, entry.toByteArray());
        sOut.flush();

        ByteArrayOutputStream req = new ByteArrayOutputStream();
        CodedOutputStream rOut = CodedOutputStream.newInstance(req);
        rOut.writeByteArray(1, stream.toByteArray());
        rOut.flush();
        return Snappy.compress(req.toByteArray());
    }

    @Test
    void parsesProtobufSnappyAsSentByAlloy() throws Exception {
        byte[] body = protobufSnappy("{container=\"web\", job=\"docker\"}", 1_790_000_000L, 123, "hello world");

        List<RawStream> out = parser.parse(body, "application/x-protobuf", 1 << 20);

        assertEquals(1, out.size());
        assertEquals("web", out.get(0).labels().get("container"));
        assertEquals("docker", out.get(0).labels().get("job"));
        assertEquals(1, out.get(0).lines().size());
        assertEquals(1_790_000_000L * 1_000_000_000L + 123, out.get(0).lines().get(0).tsNanos());
        assertEquals("hello world", out.get(0).lines().get(0).line());
    }

    @Test
    void parsesJsonPush() {
        String json = "{\"streams\":[{\"stream\":{\"container\":\"api\"},\"values\":[[\"1790000000000000001\",\"line one\"],[\"1790000000000000002\",\"line two\",{\"k\":\"v\"}]]}]}";

        List<RawStream> out = parser.parse(json.getBytes(StandardCharsets.UTF_8), "application/json", 1 << 20);

        assertEquals(1, out.size());
        assertEquals(Map.of("container", "api"), out.get(0).labels());
        assertEquals(2, out.get(0).lines().size());
        assertEquals("line two", out.get(0).lines().get(1).line());
    }

    @Test
    void jsonEntriesWithBadTimestampAreSkipped() {
        String json = "{\"streams\":[{\"stream\":{},\"values\":[[\"nope\",\"x\"],[\"5\",\"y\"]]}]}";
        List<RawStream> out = parser.parse(json.getBytes(StandardCharsets.UTF_8), "application/json", 1 << 20);
        assertEquals(1, out.get(0).lines().size());
        assertEquals("y", out.get(0).lines().get(0).line());
    }

    @Test
    void garbageIsRejectedAsMalformed() {
        assertThrows(PushFormatException.class, () -> parser.parse("not snappy".getBytes(), "application/x-protobuf", 1 << 20));
        assertThrows(PushFormatException.class, () -> parser.parse("{broken".getBytes(), "application/json", 1 << 20));
    }

    @Test
    void oversizedDecodedPayloadIsRejected() throws Exception {
        byte[] body = protobufSnappy("{container=\"web\"}", 1, 0, "x".repeat(10_000));
        assertThrows(PushFormatException.class, () -> parser.parse(body, "application/x-protobuf", 100));
    }

    @Test
    void labelStringParsingHandlesEscapesAndMalformedInput() {
        Map<String, String> m = LokiPushParser.parseLabelString("{a=\"b\", c=\"d\\\"e\", f=\"g\"}");
        assertEquals("b", m.get("a"));
        assertEquals("d\"e", m.get("c"));
        assertEquals("g", m.get("f"));
        assertTrue(LokiPushParser.parseLabelString("garbage").isEmpty());
        assertTrue(LokiPushParser.parseLabelString(null).isEmpty());
        assertEquals("1", LokiPushParser.parseLabelString("{ok=\"1\", broken").get("ok"));
    }
}
