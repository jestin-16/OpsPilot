package com.opspilot.util;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.net.InetAddress;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicUrlsTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "http://127.0.0.1/", "http://localhost:5432/", "http://10.0.0.5/", "http://172.16.3.4/",
            "http://192.168.1.1/admin", "http://169.254.169.254/latest/meta-data/", "http://0.0.0.0/",
            "http://100.64.0.1/", "http://[::1]/", "http://[fd00::1]/", "http://[fe80::1]/",
    })
    void refusesInternalTargets(String url) {
        assertThrows(IllegalArgumentException.class, () -> PublicUrls.requirePublic(url));
    }

    @ParameterizedTest
    @ValueSource(strings = {"ftp://example.com/", "file:///etc/passwd", "gopher://example.com/", "example.com", ""})
    void refusesNonHttpUrls(String url) {
        assertThrows(IllegalArgumentException.class, () -> PublicUrls.requirePublic(url));
    }

    @ParameterizedTest
    @ValueSource(strings = {"8.8.8.8", "1.1.1.1", "93.184.215.14", "2606:4700:4700::1111"})
    void treatsPublicAddressesAsPublic(String ip) throws Exception {
        assertTrue(PublicUrls.isPublic(InetAddress.getByName(ip)));
    }

    @ParameterizedTest
    @ValueSource(strings = {"10.1.2.3", "172.31.255.255", "192.168.0.10", "127.0.0.2", "169.254.1.1", "100.127.0.1", "198.18.0.1", "fc00::1"})
    void treatsInternalAddressesAsInternal(String ip) throws Exception {
        assertFalse(PublicUrls.isPublic(InetAddress.getByName(ip)));
    }
}
