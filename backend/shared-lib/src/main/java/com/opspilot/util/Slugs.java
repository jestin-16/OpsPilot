package com.opspilot.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

public final class Slugs {

    private static final int MAX_LENGTH = 100;

    private Slugs() {
    }

    /** Lower-case, hyphen-separated, ASCII-only slug; "project" when nothing usable remains. */
    public static String slugify(String input) {
        if (input == null) {
            return "project";
        }
        String ascii = Normalizer.normalize(input, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = ascii.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (slug.length() > MAX_LENGTH) {
            slug = slug.substring(0, MAX_LENGTH).replaceAll("-+$", "");
        }
        return slug.isEmpty() ? "project" : slug;
    }

    /** Appends -2, -3, ... until {@code exists} reports the candidate as free. */
    public static String unique(String base, Predicate<String> exists) {
        String candidate = base;
        int n = 2;
        while (exists.test(candidate)) {
            candidate = base + "-" + n++;
        }
        return candidate;
    }
}
