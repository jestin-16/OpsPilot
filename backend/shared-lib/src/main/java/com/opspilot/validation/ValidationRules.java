package com.opspilot.validation;

/** Formats shared by the HTTP request validators. */
public final class ValidationRules {
    private ValidationRules() {}

    public static final String PERSON_NAME = "^\\p{L}[\\p{L}\\p{M} .’'\\-]*$";
    public static final String RESOURCE_NAME = "^[\\p{L}\\p{N}][\\p{L}\\p{M}\\p{N} ._()'’\\-]*$";
    public static final String EMAIL = "^(?!\\.)(?![^@]*\\.\\.)[A-Za-z0-9_'+.\\-]*[A-Za-z0-9_+\\-]@(?:[A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$";
    public static final String REPOSITORY_URL = "(?i)^$|https?://(?:www\\.)?(?:github\\.com|gitlab\\.com)/[A-Za-z0-9_.\\-]+/[A-Za-z0-9_.\\-]+(?:/[^\\s\\\\#]*)?(?:\\?[^\\s\\\\#]*)?$";
    public static final String MULTILINE_TEXT = "^[^\\p{Cc}\\r\\n\\t]*(?:[\\r\\n\\t][^\\p{Cc}\\r\\n\\t]*)*$";
    public static final String PASSWORD = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$";
}
