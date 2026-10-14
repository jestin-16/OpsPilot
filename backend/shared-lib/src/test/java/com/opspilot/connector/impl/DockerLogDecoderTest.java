package com.opspilot.connector.impl;

import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

public class DockerLogDecoderTest {

    public static byte[] frame(int stream, String payload) {
        byte[] p = payload.getBytes(StandardCharsets.UTF_8);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.write(stream);
        out.write(0);
        out.write(0);
        out.write(0);
        out.write(p.length >>> 24);
        out.write(p.length >>> 16);
        out.write(p.length >>> 8);
        out.write(p.length);
        out.writeBytes(p);
        return out.toByteArray();
    }

    private static List<String> decode(byte[] bytes, boolean tty) throws IOException {
        List<String> lines = new ArrayList<>();
        DockerLogDecoder.decode(new ByteArrayInputStream(bytes), tty, (s, l) -> lines.add(s + ":" + l), () -> false);
        return lines;
    }

    @Test
    void decodesMultiplexedFramesAndStreams() throws IOException {
        ByteArrayOutputStream in = new ByteArrayOutputStream();
        in.writeBytes(frame(1, "out one\nout two\n"));
        in.writeBytes(frame(2, "err one\r\n"));
        assertEquals(List.of("stdout:out one", "stdout:out two", "stderr:err one"), decode(in.toByteArray(), false));
    }

    @Test
    void joinsLinesSplitAcrossFramesAndFlushesTrailingText() throws IOException {
        ByteArrayOutputStream in = new ByteArrayOutputStream();
        in.writeBytes(frame(1, "hel"));
        in.writeBytes(frame(1, "lo\nwor"));
        in.writeBytes(frame(1, "ld"));
        assertEquals(List.of("stdout:hello", "stdout:world"), decode(in.toByteArray(), false));
    }

    @Test
    void ttyStreamIsPlainText() throws IOException {
        assertEquals(List.of("stdout:a", "stdout:b"), decode("a\nb\n".getBytes(StandardCharsets.UTF_8), true));
    }

    @Test
    void rejectsCorruptLength() {
        byte[] bad = {1, 0, 0, 0, 0x7f, 0, 0, 0};
        assertThrows(IOException.class, () -> decode(bad, false));
    }
}
