package com.opspilot.util;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SlugsTest {

    @Test
    void slugifyNormalizesNames() {
        assertEquals("my-cool-app", Slugs.slugify("  My Cool_App!! "));
        assertEquals("cafe", Slugs.slugify("Café"));
    }

    @Test
    void slugifyFallsBackWhenNothingUsable() {
        assertEquals("project", Slugs.slugify("!!!"));
        assertEquals("project", Slugs.slugify(null));
    }

    @Test
    void uniqueAppendsCounterOnCollision() {
        Set<String> taken = Set.of("app", "app-2");
        assertEquals("app-3", Slugs.unique("app", taken::contains));
        assertEquals("other", Slugs.unique("other", taken::contains));
    }
}
