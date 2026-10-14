package com.opspilot.connector;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/** Minimal in-process HTTP server for connector tests. */
public class FakeServer implements AutoCloseable {

    @FunctionalInterface
    public interface Handler {
        void handle(HttpExchange ex) throws IOException;
    }

    private final HttpServer server;
    private final Map<String, Handler> routes = new ConcurrentHashMap<>();
    public final List<String> requests = new CopyOnWriteArrayList<>();
    public final List<String> authHeaders = new CopyOnWriteArrayList<>();

    public FakeServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", ex -> {
            requests.add(ex.getRequestURI().toString());
            String auth = ex.getRequestHeaders().getFirst("Authorization");
            if (auth != null) authHeaders.add(auth);
            Handler h = routes.get(ex.getRequestURI().getPath());
            if (h == null) {
                reply(ex, 404, "text/plain", "not found");
            } else {
                h.handle(ex);
            }
        });
        server.start();
    }

    public String url() {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    public FakeServer json(String path, String body) {
        routes.put(path, ex -> reply(ex, 200, "application/json", body));
        return this;
    }

    public FakeServer text(String path, String body) {
        routes.put(path, ex -> reply(ex, 200, "text/plain", body));
        return this;
    }

    public FakeServer bytes(String path, byte[] body) {
        routes.put(path, ex -> {
            ex.sendResponseHeaders(200, body.length);
            try (OutputStream os = ex.getResponseBody()) {
                os.write(body);
            }
        });
        return this;
    }

    public FakeServer status(String path, int code) {
        routes.put(path, ex -> reply(ex, code, "text/plain", "denied: secret-in-body"));
        return this;
    }

    public FakeServer on(String path, Handler h) {
        routes.put(path, h);
        return this;
    }

    private static void reply(HttpExchange ex, int code, String type, String body) throws IOException {
        byte[] b = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", type);
        ex.sendResponseHeaders(code, b.length);
        try (OutputStream os = ex.getResponseBody()) {
            os.write(b);
        }
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
