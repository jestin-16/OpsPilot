package com.opspilot.connector;

import com.opspilot.security.credential.CredentialMasker;

/** Outcome of {@link IntegrationConnector#testConnection}. Messages are masked so they are safe to return and log. */
public record ConnectionResult(boolean ok, String message) {

    public static ConnectionResult success(String message) {
        return new ConnectionResult(true, message);
    }

    public static ConnectionResult failure(String message) {
        return new ConnectionResult(false, CredentialMasker.mask(message));
    }
}
