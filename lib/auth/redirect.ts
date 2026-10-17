/**
 * Validates and sanitizes a redirect target to ensure it is a safe relative path.
 * Strictly prevents open redirect vulnerabilities, external domain redirection,
 * protocol-relative URLs (e.g. //evil.com), control character injections, and scheme smuggling.
 */
export function getSafeRedirectPath(target: string | null | undefined, fallback: string = "/profile"): string {
  if (!target || typeof target !== "string") {
    return fallback;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must begin with a single '/'
  // Must NOT begin with '//' (protocol-relative URL)
  // Must NOT begin with '/\' or contain '\' (prevent browser backslash normalization)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) {
    return fallback;
  }

  // Reject control characters or newlines
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // Verify using URL parser against a dummy fixed origin to ensure:
  // 1. It parses cleanly
  // 2. The origin does not change (no scheme/host override)
  // 3. Pathname strictly begins with / and not //
  try {
    const dummyOrigin = "https://safe-local-origin.internal";
    const parsed = new URL(trimmed, dummyOrigin);

    if (parsed.origin !== dummyOrigin) {
      return fallback;
    }

    if (!parsed.pathname.startsWith("/") || parsed.pathname.startsWith("//")) {
      return fallback;
    }

    // Reconstruct sanitized relative path including pathname, search, and hash
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
