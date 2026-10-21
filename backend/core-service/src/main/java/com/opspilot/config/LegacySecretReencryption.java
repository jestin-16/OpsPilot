package com.opspilot.config;

import com.opspilot.converter.EncryptionConverter;
import com.opspilot.converter.SecretEncryptionConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * One-off, idempotent startup migration: re-encrypts stored secrets that are not protected by the configured
 * OPSPILOT_ENCRYPTION_KEY. That covers plaintext values, values under the dev key older releases fell back
 * to, and log-source credentials under the AES/ECB key that used to be hardcoded. Both of those keys are in
 * the public repository, so until a value is rewritten it is effectively unencrypted.
 */
@Component
public class LegacySecretReencryption implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacySecretReencryption.class);

    /** TEXT columns written through SecretEncryptionConverter: table, id column, secret column. */
    static final List<String[]> TEXT_COLUMNS = List.of(
            new String[]{"integrations", "id", "credential_reference"},
            new String[]{"pipeline_sources", "id", "access_token"},
            new String[]{"pipeline_sources", "id", "api_token"},
            new String[]{"pipeline_sources", "id", "webhook_secret"});

    private final JdbcTemplate jdbc;

    public LegacySecretReencryption(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(ApplicationArguments args) {
        int rewritten = 0;
        for (String[] c : TEXT_COLUMNS) {
            rewritten += reencryptText(c[0], c[1], c[2]);
        }
        rewritten += reencryptLogSourceAuth();
        if (rewritten > 0) {
            log.warn("Re-encrypted {} stored secret(s) that were plaintext or under a published key", rewritten);
        }
    }

    private int reencryptText(String table, String idColumn, String column) {
        List<Object[]> updates = new ArrayList<>();
        jdbc.query("SELECT " + idColumn + ", " + column + " FROM " + table
                + " WHERE " + column + " IS NOT NULL AND " + column + " <> ''", rs -> {
            String stored = rs.getString(2);
            if (SecretEncryptionConverter.needsReencryption(stored)) {
                String plaintext = SecretEncryptionConverter.decrypt(stored);
                updates.add(new Object[]{SecretEncryptionConverter.encrypt(plaintext), rs.getObject(1)});
            }
        });
        for (Object[] u : updates) {
            jdbc.update("UPDATE " + table + " SET " + column + " = ? WHERE " + idColumn + " = ?", u);
        }
        return updates.size();
    }

    private int reencryptLogSourceAuth() {
        EncryptionConverter converter = new EncryptionConverter();
        List<Object[]> updates = new ArrayList<>();
        jdbc.query("SELECT source_id, CAST(auth_config AS TEXT) FROM log_sources WHERE auth_config IS NOT NULL", rs -> {
            String stored = rs.getString(2);
            if (EncryptionConverter.needsReencryption(stored)) {
                String plaintext = converter.convertToEntityAttribute(stored);
                updates.add(new Object[]{converter.convertToDatabaseColumn(plaintext), rs.getObject(1)});
            }
        });
        for (Object[] u : updates) {
            jdbc.update("UPDATE log_sources SET auth_config = CAST(? AS jsonb) WHERE source_id = ?", u);
        }
        return updates.size();
    }
}
