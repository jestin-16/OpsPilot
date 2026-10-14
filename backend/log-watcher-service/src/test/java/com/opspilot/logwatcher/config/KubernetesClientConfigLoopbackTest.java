package com.opspilot.logwatcher.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** A host kubeconfig (https://127.0.0.1:6443) must be reachable from inside a container. */
class KubernetesClientConfigLoopbackTest {

    @Test
    void loopbackAddressesPointAtTheConfiguredHost() {
        assertEquals("https://kubernetes:6443", KubernetesClientConfig.rewriteLoopback("https://127.0.0.1:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443", KubernetesClientConfig.rewriteLoopback("https://localhost:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443", KubernetesClientConfig.rewriteLoopback("https://[::1]:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443/k8s/clusters/c-1", KubernetesClientConfig.rewriteLoopback("https://127.0.0.1:6443/k8s/clusters/c-1", "kubernetes"));
    }

    @Test
    void realClusterAddressesAreNeverChanged() {
        assertEquals("https://ABC.gr7.us-east-1.eks.amazonaws.com", KubernetesClientConfig.rewriteLoopback("https://ABC.gr7.us-east-1.eks.amazonaws.com", "kubernetes"));
        assertEquals("https://10.0.0.1:6443", KubernetesClientConfig.rewriteLoopback("https://10.0.0.1:6443", "kubernetes"));
    }

    @Test
    void offWhenNoHostIsConfigured() {
        assertEquals("https://127.0.0.1:6443", KubernetesClientConfig.rewriteLoopback("https://127.0.0.1:6443", ""));
        assertEquals("https://127.0.0.1:6443", KubernetesClientConfig.rewriteLoopback("https://127.0.0.1:6443", null));
        assertEquals(null, KubernetesClientConfig.rewriteLoopback(null, "kubernetes"));
    }
}
