package com.opspilot.connector.impl;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.function.BiConsumer;
import java.util.function.BooleanSupplier;

/**
 * Decodes Docker's log stream. Containers without a TTY use a multiplexed format: an 8-byte header
 * (stream type, 3 zero bytes, big-endian payload length) before each frame. TTY containers send plain text.
 */
public final class DockerLogDecoder {

    private DockerLogDecoder() {
    }

    /** @param out receives (streamName, line) where streamName is "stdout" or "stderr". */
    public static void decode(InputStream in, boolean tty, BiConsumer<String, String> out, BooleanSupplier cancelled) throws IOException {
        if (tty) {
            BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
            String line;
            while (!cancelled.getAsBoolean() && (line = r.readLine()) != null) {
                out.accept("stdout", line);
            }
            return;
        }
        DataInputStream data = new DataInputStream(in);
        ByteArrayOutputStream pendingOut = new ByteArrayOutputStream();
        ByteArrayOutputStream pendingErr = new ByteArrayOutputStream();
        byte[] header = new byte[8];
        while (!cancelled.getAsBoolean()) {
            try {
                data.readFully(header);
            } catch (EOFException eof) {
                break;
            }
            int type = header[0];
            int length = ((header[4] & 0xFF) << 24) | ((header[5] & 0xFF) << 16) | ((header[6] & 0xFF) << 8) | (header[7] & 0xFF);
            if (length < 0 || length > 16 * 1024 * 1024) {
                throw new IOException("Corrupt Docker log frame");
            }
            byte[] payload = new byte[length];
            data.readFully(payload);
            boolean err = type == 2;
            ByteArrayOutputStream pending = err ? pendingErr : pendingOut;
            pending.write(payload);
            flushLines(pending, err ? "stderr" : "stdout", out);
        }
        flushRemainder(pendingOut, "stdout", out);
        flushRemainder(pendingErr, "stderr", out);
    }

    private static void flushLines(ByteArrayOutputStream pending, String stream, BiConsumer<String, String> out) {
        byte[] bytes = pending.toByteArray();
        int start = 0;
        for (int i = 0; i < bytes.length; i++) {
            if (bytes[i] == '\n') {
                int end = (i > start && bytes[i - 1] == '\r') ? i - 1 : i;
                out.accept(stream, new String(bytes, start, end - start, StandardCharsets.UTF_8));
                start = i + 1;
            }
        }
        pending.reset();
        if (start < bytes.length) {
            pending.write(bytes, start, bytes.length - start);
        }
    }

    private static void flushRemainder(ByteArrayOutputStream pending, String stream, BiConsumer<String, String> out) {
        if (pending.size() > 0) {
            out.accept(stream, pending.toString(StandardCharsets.UTF_8));
            pending.reset();
        }
    }
}
