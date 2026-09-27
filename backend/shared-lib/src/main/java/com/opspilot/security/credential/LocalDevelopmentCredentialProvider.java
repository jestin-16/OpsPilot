package com.opspilot.security.credential;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A safe local development provider.
 * Supports storeType "LOCAL_ENV" for resolving environment variables (read-only),
 * and "LOCAL_MEM" for an in-memory secure map for runtime development (read-write).
 * 
 * In production, an AWS Secrets Manager or HashiCorp Vault provider should be registered.
 */
@Component
public class LocalDevelopmentCredentialProvider implements CredentialProvider {

    public static final String TYPE_ENV = "LOCAL_ENV";
    public static final String TYPE_MEM = "LOCAL_MEM";

    private final Map<String, String> memoryStore = new ConcurrentHashMap<>();

    @Override
    public boolean supports(String storeType) {
        return TYPE_ENV.equalsIgnoreCase(storeType) || TYPE_MEM.equalsIgnoreCase(storeType);
    }

    @Override
    public String getCredential(CredentialReference reference) {
        if (reference == null || reference.getReferenceId() == null) {
            return null;
        }

        if (TYPE_ENV.equalsIgnoreCase(reference.getStoreType())) {
            return System.getenv(reference.getReferenceId());
        }

        if (TYPE_MEM.equalsIgnoreCase(reference.getStoreType())) {
            return memoryStore.get(reference.getReferenceId());
        }

        return null;
    }

    @Override
    public boolean storeCredential(CredentialReference reference, String credential) {
        if (TYPE_ENV.equalsIgnoreCase(reference.getStoreType())) {
            throw new UnsupportedOperationException("Cannot write to environment variables at runtime");
        }

        if (TYPE_MEM.equalsIgnoreCase(reference.getStoreType())) {
            memoryStore.put(reference.getReferenceId(), credential);
            return true;
        }

        return false;
    }

    @Override
    public boolean deleteCredential(CredentialReference reference) {
        if (TYPE_ENV.equalsIgnoreCase(reference.getStoreType())) {
            throw new UnsupportedOperationException("Cannot delete environment variables at runtime");
        }

        if (TYPE_MEM.equalsIgnoreCase(reference.getStoreType())) {
            return memoryStore.remove(reference.getReferenceId()) != null;
        }

        return false;
    }
}
