package com.opspilot.service;

import com.google.protobuf.CodedInputStream;
import com.google.protobuf.CodedOutputStream;
import org.springframework.stereotype.Component;
import org.xerial.snappy.Snappy;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Component
public class PrometheusPushRewriter {

    public static class RewriteException extends RuntimeException {
        public RewriteException(String message, Throwable cause) {
            super(message, cause);
        }
    }


    public byte[] rewrite(byte[] snappyCompressed, Map<String, String> injectedLabels, int maxDecodedBytes, int[] stats) {
        try {
            int uncompressedLength = Snappy.uncompressedLength(snappyCompressed);
            if (uncompressedLength > maxDecodedBytes) {
                throw new RewriteException("Decoded payload too large: " + uncompressedLength, null);
            }
            byte[] raw = Snappy.uncompress(snappyCompressed);
            CodedInputStream in = CodedInputStream.newInstance(raw);
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            CodedOutputStream out = CodedOutputStream.newInstance(baos);

            int seriesCount = 0;
            int samplesCount = 0;

            while (!in.isAtEnd()) {
                int tag = in.readTag();
                if (tag == 0) break;
                if (tag >>> 3 == 1 && (tag & 7) == 2) { // WriteRequest.timeseries
                    seriesCount++;
                    int len = in.readRawVarint32();
                    int limit = in.pushLimit(len);
                    
                    ByteArrayOutputStream tsBaos = new ByteArrayOutputStream();
                    CodedOutputStream tsOut = CodedOutputStream.newInstance(tsBaos);
                    
                    Map<String, String> sortedLabels = new TreeMap<>();
                    List<byte[]> samples = new ArrayList<>();
                    
                    while (!in.isAtEnd()) {
                        int tsTag = in.readTag();
                        if (tsTag == 0) break;
                        if (tsTag >>> 3 == 1 && (tsTag & 7) == 2) { // TimeSeries.labels
                            int lLen = in.readRawVarint32();
                            int lLimit = in.pushLimit(lLen);
                            String name = ""; 
                            String value = "";
                            while (!in.isAtEnd()) {
                                int lTag = in.readTag();
                                if (lTag == 0) break;
                                if (lTag >>> 3 == 1) name = in.readStringRequireUtf8();
                                else if (lTag >>> 3 == 2) value = in.readStringRequireUtf8();
                                else in.skipField(lTag);
                            }
                            
                            String lowerName = name.toLowerCase();
                            if (lowerName.equals("project") || lowerName.equals("environment") || lowerName.equals("source")) {
                                // ignore client-supplied protected labels case-insensitively
                            } else {
                                sortedLabels.put(name, value);
                            }
                            
                            in.popLimit(lLimit);
                        } else if (tsTag >>> 3 == 2 && (tsTag & 7) == 2) { // TimeSeries.samples
                            samplesCount++;
                            int sLen = in.readRawVarint32();
                            byte[] sampleBytes = in.readRawBytes(sLen);
                            samples.add(sampleBytes);
                        } else {
                            in.skipField(tsTag);
                        }
                    }
                    in.popLimit(limit);
                    
                    // Add injected labels
                    for (Map.Entry<String, String> e : injectedLabels.entrySet()) {
                        sortedLabels.put(e.getKey(), e.getValue());
                    }
                    
                    for (Map.Entry<String, String> l : sortedLabels.entrySet()) {
                        tsOut.writeTag(1, 2);
                        int lSize = CodedOutputStream.computeStringSize(1, l.getKey()) + CodedOutputStream.computeStringSize(2, l.getValue());
                        tsOut.writeUInt32NoTag(lSize);
                        tsOut.writeString(1, l.getKey());
                        tsOut.writeString(2, l.getValue());
                    }
                    for (byte[] s : samples) {
                        tsOut.writeTag(2, 2);
                        tsOut.writeUInt32NoTag(s.length);
                        tsOut.writeRawBytes(s);
                    }
                    tsOut.flush();
                    byte[] tsBytes = tsBaos.toByteArray();
                    
                    out.writeTag(1, 2);
                    out.writeUInt32NoTag(tsBytes.length);
                    out.writeRawBytes(tsBytes);
                } else {
                    in.skipField(tag);
                }
            }
            out.flush();
            if (stats != null && stats.length >= 2) {
                stats[0] = seriesCount;
                stats[1] = samplesCount;
            }
            return Snappy.compress(baos.toByteArray());
        } catch (IOException e) {
            throw new RewriteException("Malformed protobuf payload", e);
        }
    }
}
