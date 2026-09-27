package com.opspilot.security.credential;

public class CredentialReference {
    private String referenceId;
    private String storeType;

    public CredentialReference() {}

    public CredentialReference(String referenceId, String storeType) {
        this.referenceId = referenceId;
        this.storeType = storeType;
    }

    public String getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(String referenceId) {
        this.referenceId = referenceId;
    }

    public String getStoreType() {
        return storeType;
    }

    public void setStoreType(String storeType) {
        this.storeType = storeType;
    }
    
    @Override
    public String toString() {
        // Safe toString, doesn't leak secrets
        return "CredentialReference{storeType='" + storeType + "', referenceId='" + referenceId + "'}";
    }
}
