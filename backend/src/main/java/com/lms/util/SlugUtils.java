package com.lms.util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_ASCII   = Pattern.compile("[^\\p{ASCII}]");
    private static final Pattern NON_WORD    = Pattern.compile("[^\\w\\s-]");
    private static final Pattern WHITESPACE  = Pattern.compile("[\\s]+");
    private static final Pattern MULTI_DASH  = Pattern.compile("-{2,}");
    private static final Pattern EDGE_DASHES = Pattern.compile("^-+|-+$");

    private SlugUtils() {}

    /**
     * Converts an arbitrary string (including Vietnamese) into a URL-friendly slug.
     * Example: "Lập Trình Java Cơ Bản" → "lap-trinh-java-co-ban"
     */
    public static String toSlug(String text) {
        if (text == null || text.isBlank()) return "";

        // NFD decomposition removes combining diacritical marks
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD);
        String ascii      = NON_ASCII.matcher(normalized).replaceAll("");
        String lower      = ascii.toLowerCase();
        String clean      = NON_WORD.matcher(lower).replaceAll("");
        String dashed     = WHITESPACE.matcher(clean).replaceAll("-");
        String collapsed  = MULTI_DASH.matcher(dashed).replaceAll("-");
        return EDGE_DASHES.matcher(collapsed).replaceAll("");
    }
}
