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
        // Create a dummy WriteRequest with one TimeSeries and one Label
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        CodedOutputStream out = CodedOutputStream.newInstance(baos);
        
        // TimeSeries
        ByteArrayOutputStream tsBaos = new ByteArrayOutputStream();
        CodedOutputStream tsOut = CodedOutputStream.newInstance(tsBaos);
        
        // Label: "project" -> "client-project"
        tsOut.writeTag(1, 2);
        int lSize = CodedOutputStream.computeStringSize(1, "project") + CodedOutputStream.computeStringSize(2, "client-project");
        tsOut.writeUInt32NoTag(lSize);
        tsOut.writeString(1, "project");
        tsOut.writeString(2, "client-project");
        
        // Sample
        byte[] sample = new byte[]{ 0, 1, 2, 3 }; // Dummy sample
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
        
        // Inject label "project" -> "server-project", "env" -> "prod"
        int[] stats = new int[2];
        byte[] rewrittenSnappy = rewriter.rewrite(snappy, Map.of("project", "server-project", "env", "prod"), 1024, stats);
        
        assertNotNull(rewrittenSnappy);
        assertEquals(1, stats[0]);
        assertEquals(1, stats[1]);
        
        // Ensure that the original "client-project" is replaced
        byte[] rewritten = Snappy.uncompress(rewrittenSnappy);
        String decoded = new String(rewritten);
        assertFalse(decoded.contains("client-project"));
        assertTrue(decoded.contains("server-project"));
        assertTrue(decoded.contains("env"));
        assertTrue(decoded.contains("prod"));
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
