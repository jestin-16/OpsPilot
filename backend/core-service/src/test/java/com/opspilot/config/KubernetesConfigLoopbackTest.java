package com.opspilot.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** A host kubeconfig (https://127.0.0.1:6443) must be reachable from inside a container. */
class KubernetesConfigLoopbackTest {

    @Test
    void loopbackAddressesPointAtTheConfiguredHost() {
        assertEquals("https://kubernetes:6443", KubernetesConfig.rewriteLoopback("https://127.0.0.1:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443", KubernetesConfig.rewriteLoopback("https://localhost:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443", KubernetesConfig.rewriteLoopback("https://[::1]:6443", "kubernetes"));
        assertEquals("https://kubernetes:6443/k8s/clusters/c-1", KubernetesConfig.rewriteLoopback("https://127.0.0.1:6443/k8s/clusters/c-1", "kubernetes"));
    }

    @Test
    void realClusterAddressesAreNeverChanged() {
        assertEquals("https://ABC.gr7.us-east-1.eks.amazonaws.com", KubernetesConfig.rewriteLoopback("https://ABC.gr7.us-east-1.eks.amazonaws.com", "kubernetes"));
        assertEquals("https://10.0.0.1:6443", KubernetesConfig.rewriteLoopback("https://10.0.0.1:6443", "kubernetes"));
    }

    @Test
    void offWhenNoHostIsConfigured() {
        assertEquals("https://127.0.0.1:6443", KubernetesConfig.rewriteLoopback("https://127.0.0.1:6443", ""));
        assertEquals("https://127.0.0.1:6443", KubernetesConfig.rewriteLoopback("https://127.0.0.1:6443", null));
        assertEquals(null, KubernetesConfig.rewriteLoopback(null, "kubernetes"));
    }
}
