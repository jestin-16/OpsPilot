package com.opspilot.util;

import java.net.Inet6Address;
import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;

/**
 * For features that fetch an arbitrary, user-supplied URL (uptime probes): only http(s) URLs whose host
 * resolves exclusively to public internet addresses. Refusing loopback, private, link-local and similar
 * ranges stops the server being used to reach its own network or a cloud metadata endpoint.
 * Integrations use ConnectorHttp.validate instead, because they legitimately target private hosts.
 */
public final class PublicUrls {

    private PublicUrls() {
    }

    public static URI requirePublic(String url) {
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
        InetAddress[] addresses;
        try {
            addresses = InetAddress.getAllByName(uri.getHost());
        } catch (UnknownHostException e) {
            throw new IllegalArgumentException("Host not found: " + uri.getHost());
        }
        for (InetAddress address : addresses) {
            if (!isPublic(address)) {
                throw new IllegalArgumentException("Only public internet addresses can be probed");
            }
        }
        return uri;
    }

    static boolean isPublic(InetAddress a) {
        if (a.isAnyLocalAddress() || a.isLoopbackAddress() || a.isLinkLocalAddress()
                || a.isSiteLocalAddress() || a.isMulticastAddress()) {
            return false;
        }
        byte[] b = a.getAddress();
        if (a instanceof Inet6Address) {
            return (b[0] & 0xFE) != 0xFC; // fc00::/7 unique local
        }
        int first = b[0] & 0xFF;
        int second = b[1] & 0xFF;
        return first != 0                                    // 0.0.0.0/8
                && !(first == 100 && second >= 64 && second < 128) // 100.64.0.0/10 carrier-grade NAT
                && !(first == 198 && (second == 18 || second == 19)); // 198.18.0.0/15 benchmarking
    }
}
