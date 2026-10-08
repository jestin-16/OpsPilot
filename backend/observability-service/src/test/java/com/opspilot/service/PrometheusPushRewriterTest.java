package com.opspilot.service;

import org.junit.jupiter.api.Test;
import org.xerial.snappy.Snappy;
import com.google.protobuf.CodedOutputStream;
import java.io.ByteArrayOutputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class PrometheusPushRewriterTest {

    private final PrometheusPushRewriter rewriter = new PrometheusPushRewriter();

    @Test
    void testRewriteLabels() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        CodedOutputStream out = CodedOutputStream.newInstance(baos);
        
        ByteArrayOutputStream tsBaos = new ByteArrayOutputStream();
        CodedOutputStream tsOut = CodedOutputStream.newInstance(tsBaos);
        
        // Write some client labels out of order, with duplicates and mixed cases
        writeLabel(tsOut, "job", "old-job");
        writeLabel(tsOut, "Project", "client-project");
        writeLabel(tsOut, "SOURCE", "client-source");
        writeLabel(tsOut, "job", "new-job"); // duplicate
        writeLabel(tsOut, "__name__", "my_metric");
        writeLabel(tsOut, "empty_val", "");
        writeLabel(tsOut, "alpha", "first");
        
        byte[] sample = new byte[]{ 0, 1, 2, 3 };
        tsOut.writeTag(2, 2);
        tsOut.writeUInt32NoTag(sample.length);
        tsOut.writeRawBytes(sample);
        tsOut.flush();
        byte[] tsBytes = tsBaos.toByteArray();
        
        out.writeTag(1, 2);
        out.writeUInt32NoTag(tsBytes.length);
        out.writeRawBytes(tsBytes);
        out.flush();
        
        byte[] snappy = Snappy.compress(baos.toByteArray());
        
        int[] stats = new int[2];
        byte[] rewrittenSnappy = rewriter.rewrite(snappy, Map.of("project", "server-project", "environment", "prod", "source", "server-source"), 1024, stats);
        
        assertNotNull(rewrittenSnappy);
        assertEquals(1, stats[0]);
        assertEquals(1, stats[1]);
        
        byte[] rewritten = Snappy.uncompress(rewrittenSnappy);
        String decoded = new String(rewritten);
        
        assertFalse(decoded.contains("client-project"));
        assertFalse(decoded.contains("client-source"));
        assertFalse(decoded.contains("old-job"));
        
        assertTrue(decoded.contains("server-project"));
        assertTrue(decoded.contains("server-source"));
        assertTrue(decoded.contains("prod"));
        assertTrue(decoded.contains("new-job"));
        assertTrue(decoded.contains("__name__"));
        assertTrue(decoded.contains("my_metric"));
        assertTrue(decoded.contains("empty_val"));
        assertTrue(decoded.contains("alpha"));
    }
    
    private void writeLabel(CodedOutputStream tsOut, String name, String value) throws Exception {
        tsOut.writeTag(1, 2);
        int lSize = CodedOutputStream.computeStringSize(1, name) + CodedOutputStream.computeStringSize(2, value);
        tsOut.writeUInt32NoTag(lSize);
        tsOut.writeString(1, name);
        tsOut.writeString(2, value);
    }
    
    @Test
    void testMalformedProtobuf() {
        assertThrows(PrometheusPushRewriter.RewriteException.class, () -> {
            rewriter.rewrite(Snappy.compress(new byte[]{1, 2, 3}), Map.of(), 1024, new int[2]);
        });
    }

    @Test
    void testOversized() throws Exception {
        byte[] large = new byte[2048];
        byte[] snappy = Snappy.compress(large);
        assertThrows(PrometheusPushRewriter.RewriteException.class, () -> {
            rewriter.rewrite(snappy, Map.of(), 1024, new int[2]);
        });
    }
}
