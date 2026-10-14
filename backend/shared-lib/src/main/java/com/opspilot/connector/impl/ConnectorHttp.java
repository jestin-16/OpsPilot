package com.opspilot.connector.impl;

import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509ExtendedTrustManager;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.Socket;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.time.Duration;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.function.BooleanSupplier;
import java.util.function.Consumer;

/** Small JDK-HttpClient helpers shared by the connectors. */
public final class ConnectorHttp {

    public static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(5);
    public static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(15);

    private ConnectorHttp() {
    }

    /** Non-2xx response. The body is deliberately not kept: it can echo credentials. */
    public static class HttpStatusException extends IOException {
        private final int status;

        public HttpStatusException(int status, String uri) {
            super("HTTP " + status + " from " + uri);
            this.status = status;
        }

        public int status() {
            return status;
        }
    }

    @FunctionalInterface
    public interface StreamDecoder<T> {
        void decode(InputStream in, Consumer<T> out, BooleanSupplier cancelled) throws IOException;
    }

    /** Accepts only http(s) URLs and refuses link-local targets (cloud metadata endpoints). */
    public static URI validate(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("A URL is required");
        }
        URI uri;
        try {
            uri = URI.create(url.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid URL");
        }
        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https")) || uri.getHost() == null) {
            throw new IllegalArgumentException("Only http:// and https:// URLs are supported");
        }
        try {
            for (InetAddress a : InetAddress.getAllByName(uri.getHost())) {
                if (a.isLinkLocalAddress()) {
                    throw new IllegalArgumentException("Link-local addresses are not allowed");
                }
            }
        } catch (java.net.UnknownHostException e) {
            // Unresolvable hosts fail later with a clearer connection error.
        }
        return uri;
    }

    public static HttpClient client(boolean insecureTls, String caPem) {
        HttpClient.Builder b = HttpClient.newBuilder().connectTimeout(CONNECT_TIMEOUT).followRedirects(HttpClient.Redirect.NEVER);
        try {
            if (insecureTls) {
                SSLContext ctx = SSLContext.getInstance("TLS");
                ctx.init(null, new TrustManager[]{new TrustAll()}, null);
                b.sslContext(ctx);
            } else if (caPem != null && !caPem.isBlank()) {
                KeyStore ks = KeyStore.getInstance(KeyStore.getDefaultType());
                ks.load(null, null);
                Collection<? extends Certificate> certs = CertificateFactory.getInstance("X.509")
                        .generateCertificates(new ByteArrayInputStream(caPem.getBytes(StandardCharsets.UTF_8)));
                int i = 0;
                for (Certificate c : certs) {
                    ks.setCertificateEntry("ca-" + i++, c);
                }
                TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
                tmf.init(ks);
                SSLContext ctx = SSLContext.getInstance("TLS");
                ctx.init(null, tmf.getTrustManagers(), null);
                b.sslContext(ctx);
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid TLS settings");
        }
        return b.build();
    }

    private static HttpRequest.Builder request(URI uri, Map<String, String> headers, Duration timeout) {
        HttpRequest.Builder r = HttpRequest.newBuilder(uri).GET();
        if (timeout != null) {
            r.timeout(timeout);
        }
        headers.forEach(r::header);
        return r;
    }

    public static String get(HttpClient client, URI uri, Map<String, String> headers) throws IOException {
        try {
            HttpResponse<String> res = client.send(request(uri, headers, REQUEST_TIMEOUT).build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() / 100 != 2) {
                throw new HttpStatusException(res.statusCode(), uri.getScheme() + "://" + uri.getAuthority() + uri.getPath());
            }
            return res.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted");
        }
    }

    public static InputStream open(HttpClient client, URI uri, Map<String, String> headers) throws IOException {
        try {
            HttpResponse<InputStream> res = client.send(request(uri, headers, null).build(), HttpResponse.BodyHandlers.ofInputStream());
            if (res.statusCode() / 100 != 2) {
                res.body().close();
                throw new HttpStatusException(res.statusCode(), uri.getScheme() + "://" + uri.getAuthority() + uri.getPath());
            }
            return res.body();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Interrupted");
        }
    }

    /** Bridges a blocking stream read to a Flux; cancelling the subscription closes the stream. */
    public static <T> Flux<T> fromStream(Callable<InputStream> opener, StreamDecoder<T> decoder) {
        return Flux.<T>create(sink -> {
            Schedulers.boundedElastic().schedule(() -> {
                InputStream in = null;
                try {
                    in = opener.call();
                    final InputStream opened = in;
                    sink.onDispose(() -> {
                        try {
                            opened.close();
                        } catch (IOException ignored) {
                            // closing to unblock the reader
                        }
                    });
                    decoder.decode(in, sink::next, sink::isCancelled);
                    sink.complete();
                } catch (Exception e) {
                    if (!sink.isCancelled()) {
                        sink.error(e);
                    }
                } finally {
                    if (in != null) {
                        try {
                            in.close();
                        } catch (IOException ignored) {
                            // best effort
                        }
                    }
                }
            });
        });
    }

    private static final class TrustAll extends X509ExtendedTrustManager {
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType, Socket socket) { }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType, Socket socket) { }
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType, SSLEngine engine) { }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType, SSLEngine engine) { }
        @Override public void checkClientTrusted(X509Certificate[] chain, String authType) { }
        @Override public void checkServerTrusted(X509Certificate[] chain, String authType) { }
        @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
    }
}
