package com.opspilot.security.credential;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class LocalDevelopmentCredentialProviderTest {

    private LocalDevelopmentCredentialProvider provider;

    @BeforeEach
    void setUp() {
        provider = new LocalDevelopmentCredentialProvider();
    }

    @Test
    void testSupports() {
        assertTrue(provider.supports(LocalDevelopmentCredentialProvider.TYPE_ENV));
        assertTrue(provider.supports(LocalDevelopmentCredentialProvider.TYPE_MEM));
        assertFalse(provider.supports("AWS_SECRETS_MANAGER"));
    }

    @Test
    void testInMemoryStoreReadWriteDelete() {
        CredentialReference ref = new CredentialReference("my-db-pass", LocalDevelopmentCredentialProvider.TYPE_MEM);
        
        // Write
        assertTrue(provider.storeCredential(ref, "secret123"));
        
        // Read
        assertEquals("secret123", provider.getCredential(ref));
        
        // Delete
        assertTrue(provider.deleteCredential(ref));
        
        // Read after delete
        assertNull(provider.getCredential(ref));
    }

    @Test
    void testEnvStoreRead() {
        // We assume PATH exists in almost all environments
        CredentialReference ref = new CredentialReference("PATH", LocalDevelopmentCredentialProvider.TYPE_ENV);
        assertNotNull(provider.getCredential(ref));
    }

    @Test
    void testEnvStoreWriteThrowsException() {
        CredentialReference ref = new CredentialReference("DUMMY_VAR", LocalDevelopmentCredentialProvider.TYPE_ENV);
        assertThrows(UnsupportedOperationException.class, () -> provider.storeCredential(ref, "value"));
    }

    @Test
    void testEnvStoreDeleteThrowsException() {
        CredentialReference ref = new CredentialReference("DUMMY_VAR", LocalDevelopmentCredentialProvider.TYPE_ENV);
        assertThrows(UnsupportedOperationException.class, () -> provider.deleteCredential(ref));
    }
}
