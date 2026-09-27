package com.opspilot.security.credential;

public interface CredentialProvider {
    
    /**
     * Determines whether this provider handles the specific store type.
     */
    boolean supports(String storeType);

    /**
     * Retrieves the raw credential secret based on the reference.
     */
    String getCredential(CredentialReference reference);

    /**
     * Stores a credential and updates the reference if necessary.
     * Returns true if successful.
     */
    boolean storeCredential(CredentialReference reference, String credential);

    /**
     * Deletes the credential from the backend store.
     */
    boolean deleteCredential(CredentialReference reference);
}
