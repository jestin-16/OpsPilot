package com.opspilot;

import com.google.protobuf.CodedOutputStream;
import org.xerial.snappy.Snappy;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class SendPrometheusPayload {

    public static void main(String[] args) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        CodedOutputStream out = CodedOutputStream.newInstance(baos);

        ByteArrayOutputStream tsBaos = new ByteArrayOutputStream();
        CodedOutputStream tsOut = CodedOutputStream.newInstance(tsBaos);

        writeLabel(tsOut, "__name__", "my_test_metric");
        writeLabel(tsOut, "job", "my_test_job");
        writeLabel(tsOut, "project", "hacker-project"); // should be overwritten
        writeLabel(tsOut, "source", "hacker-source"); // should be overwritten

        byte[] sample = new byte[16];
        // timestamp (int64) and value (float64)
        // Let's just put something valid or let prometheus parse it?
        // Prometheus sample is double value, int64 timestamp
        // Actually, sample has 1: double value, 2: int64 timestamp
        ByteArrayOutputStream sBaos = new ByteArrayOutputStream();
        CodedOutputStream sOut = CodedOutputStream.newInstance(sBaos);
        sOut.writeDouble(1, 42.0);
        sOut.writeInt64(2, System.currentTimeMillis());
        sOut.flush();
        byte[] sBytes = sBaos.toByteArray();
        
        tsOut.writeTag(2, 2);
        tsOut.writeUInt32NoTag(sBytes.length);
        tsOut.writeRawBytes(sBytes);

        tsOut.flush();
        byte[] tsBytes = tsBaos.toByteArray();

        out.writeTag(1, 2);
        out.writeUInt32NoTag(tsBytes.length);
        out.writeRawBytes(tsBytes);
        out.flush();

        byte[] snappy = Snappy.compress(baos.toByteArray());

        java.nio.file.Files.write(java.nio.file.Paths.get("payload.snappy"), snappy);
        System.out.println("Wrote payload.snappy");
    }

    private static void writeLabel(CodedOutputStream tsOut, String name, String value) throws Exception {
        tsOut.writeTag(1, 2);
        int lSize = CodedOutputStream.computeStringSize(1, name) + CodedOutputStream.computeStringSize(2, value);
        tsOut.writeUInt32NoTag(lSize);
        tsOut.writeString(1, name);
        tsOut.writeString(2, value);
    }
}
