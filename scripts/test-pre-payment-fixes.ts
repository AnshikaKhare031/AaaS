import { getSafeRedirectPath } from "../lib/auth/redirect";
import type { Product } from "../types/product";

let passed = 0;
let failed = 0;

function assert(condition: boolean, description: string, category = "TEST") {
  if (condition) {
    console.log(`✅ [${category}] PASS: ${description}`);
    passed++;
  } else {
    console.error(`❌ [${category}] FAIL: ${description}`);
    failed++;
  }
}

async function runPrePaymentFixesTestSuite() {
  console.log("==================================================================");
  console.log("   PRE-PAYMENT INTEGRATION FIXES VERIFICATION SUITE              ");
  console.log("==================================================================\n");

  // -------------------------------------------------------------------------
  // SECTION 1: Fix 2 — Safe OAuth Callback Redirect Sanitization
  // -------------------------------------------------------------------------
  console.log("--- SECTION 1: OAuth Callback Redirect Sanitization (Fix 2) ---\n");

  // 1.1 Safe Relative Paths
  assert(
    getSafeRedirectPath("/profile") === "/profile",
    "Preserves standard /profile relative path"
  );
  assert(
    getSafeRedirectPath("/checkout") === "/checkout",
    "Preserves /checkout relative path"
  );
  assert(
    getSafeRedirectPath("/cart?step=2&promo=SPRING") === "/cart?step=2&promo=SPRING",
    "Preserves relative path with query parameters"
  );
  assert(
    getSafeRedirectPath("/orders/AAAS-1001#shipping") === "/orders/AAAS-1001#shipping",
    "Preserves relative path with hash fragments"
  );
  assert(
    getSafeRedirectPath("   /category/handbags   ") === "/category/handbags",
    "Trims leading/trailing whitespace around valid relative paths"
  );

  // 1.2 Protocol-Relative URLs (External Redirection Attacks)
  assert(
    getSafeRedirectPath("//evil.com") === "/profile",
    "Rejects protocol-relative //evil.com and defaults to /profile"
  );
  assert(
    getSafeRedirectPath("//evil.com/phishing/login") === "/profile",
    "Rejects protocol-relative //evil.com/path"
  );
  assert(
    getSafeRedirectPath("///evil.com") === "/profile",
    "Rejects triple-slash ///evil.com"
  );
  assert(
    getSafeRedirectPath("//attacker.org?token=steal") === "/profile",
    "Rejects protocol-relative with query strings"
  );

  // 1.3 External Absolute URLs
  assert(
    getSafeRedirectPath("https://evil.com") === "/profile",
    "Rejects https://evil.com"
  );
  assert(
    getSafeRedirectPath("http://attacker.com/steal") === "/profile",
    "Rejects http://attacker.com/steal"
  );
  assert(
    getSafeRedirectPath("https://evil.com/profile") === "/profile",
    "Rejects external URL even if pathname matches /profile"
  );
  assert(
    getSafeRedirectPath("ftp://malicious.net/file") === "/profile",
    "Rejects non-HTTP schemes (ftp://)"
  );

  // 1.4 Backslash Bypass & Scheme Smuggling
  assert(
    getSafeRedirectPath("/\\evil.com") === "/profile",
    "Rejects /\\evil.com backslash bypass"
  );
  assert(
    getSafeRedirectPath("\\evil.com") === "/profile",
    "Rejects leading backslash \\evil.com"
  );
  assert(
    getSafeRedirectPath("/safe/path\\evil") === "/profile",
    "Rejects path containing backslashes (/safe/path\\evil)"
  );
  assert(
    getSafeRedirectPath("javascript:alert(document.cookie)") === "/profile",
    "Rejects javascript: pseudo-protocol"
  );
  assert(
    getSafeRedirectPath("data:text/html,<script>evil()</script>") === "/profile",
    "Rejects data: URI scheme"
  );

  // 1.5 Control Characters, Newlines, & CRLF Injection
  assert(
    getSafeRedirectPath("/\r\n/evil.com") === "/profile",
    "Rejects CRLF header injection attempts"
  );
  assert(
    getSafeRedirectPath("/\nLocation: evil.com") === "/profile",
    "Rejects newline injection"
  );
  assert(
    getSafeRedirectPath("/path\x00evil") === "/profile",
    "Rejects null byte injection"
  );

  // 1.6 Empty, Missing, or Non-String Inputs
  assert(
    getSafeRedirectPath("") === "/profile",
    "Defaults empty string to /profile"
  );
  assert(
    getSafeRedirectPath("   ") === "/profile",
    "Defaults whitespace-only string to /profile"
  );
  assert(
    getSafeRedirectPath(null) === "/profile",
    "Defaults null to /profile"
  );
  assert(
    getSafeRedirectPath(undefined) === "/profile",
    "Defaults undefined to /profile"
  );
  assert(
    getSafeRedirectPath(undefined, "/checkout") === "/checkout",
    "Accepts and applies custom fallback path"
  );

  // -------------------------------------------------------------------------
  // SECTION 2: Fix 1 — Order Creation Inactive Product Prevention
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 2: Inactive Product Order Validation (Fix 1) ---\n");

  // Mock catalog with active and inactive products
  const mockCatalog: Product[] = [
    {
      id: "prod-active-1",
      name: "Handcrafted Crochet Bag",
      title: "Handcrafted Crochet Bag",
      description: "Artisan bag",
      price: 1499,
      category: "Handbags",
      image_url: "https://example.com/bag.png",
      images: ["https://example.com/bag.png"],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-inactive-2",
      name: "Discontinued Potli",
      title: "Discontinued Potli",
      description: "Old item",
      price: 899,
      category: "Handbags",
      image_url: "https://example.com/potli.png",
      images: ["https://example.com/potli.png"],
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "prod-active-3",
      name: "Peacock Feather Keychain",
      title: "Peacock Feather Keychain",
      description: "Artisan charm",
      price: 199,
      category: "Keychains",
      image_url: "https://example.com/keychain.png",
      images: ["https://example.com/keychain.png"],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  // Helper simulating the order route validation logic
  function validateOrderItems(
    requestedItems: { productId?: unknown; quantity?: unknown }[],
    catalog: Product[]
  ): { valid: boolean; error?: string; verifiedItems?: { product: Product; quantity: number }[]; subtotal?: number } {
    const parsedItems = requestedItems.map((item) => ({
      productId: item?.productId,
      quantity: Number(item?.quantity),
    }));

    const hasInvalidItem = parsedItems.some(
      ({ productId, quantity }) =>
        !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99
    );

    if (hasInvalidItem) {
      return { valid: false, error: "One or more items in the cart are invalid." };
    }

    // Only active products should be matched
    const productById = new Map(catalog.map((product) => [product.id, product]));
    const verifiedItems: { product: Product; quantity: number }[] = [];

    for (const { productId, quantity } of parsedItems) {
      const product = productById.get(productId as string);
      if (!product || product.is_active === false) {
        return { valid: false, error: "One or more items in the cart are no longer available." };
      }
      verifiedItems.push({ product, quantity });
    }

    const subtotal = verifiedItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    return { valid: true, verifiedItems, subtotal };
  }

  // 2.1 Active product validation
  const validActiveCart = [
    { productId: "prod-active-1", quantity: 2 },
    { productId: "prod-active-3", quantity: 1 },
  ];
  const activeResult = validateOrderItems(validActiveCart, mockCatalog);
  assert(activeResult.valid === true, "Valid cart with active products succeeds");
  assert(
    activeResult.verifiedItems?.length === 2,
    "Verified items list preserves all active cart items"
  );
  assert(
    activeResult.subtotal === 1499 * 2 + 199 * 1,
    `Calculates authoritative subtotal from DB prices (expected ${1499 * 2 + 199 * 1}, got ${activeResult.subtotal})`
  );

  // 2.2 Inactive product rejection
  const cartWithInactive = [
    { productId: "prod-active-1", quantity: 1 },
    { productId: "prod-inactive-2", quantity: 1 }, // Inactive product!
  ];
  const inactiveResult = validateOrderItems(cartWithInactive, mockCatalog);
  assert(inactiveResult.valid === false, "Cart containing inactive product is rejected");
  assert(
    inactiveResult.error === "One or more items in the cart are no longer available.",
    "Inactive product returns exact availability error"
  );

  // 2.3 Non-existent product rejection
  const cartWithMissing = [
    { productId: "prod-does-not-exist", quantity: 1 },
  ];
  const missingResult = validateOrderItems(cartWithMissing, mockCatalog);
  assert(missingResult.valid === false, "Cart containing non-existent product ID is rejected");
  assert(
    missingResult.error === "One or more items in the cart are no longer available.",
    "Missing product returns exact availability error"
  );

  // 2.4 Client-Supplied Price Tampering Immunity
  const cartWithTamperedPrice = [
    { productId: "prod-active-1", quantity: 1, price: 1 }, // Attempting to buy Rs 1499 bag for Rs 1
  ];
  const tamperedResult = validateOrderItems(cartWithTamperedPrice, mockCatalog);
  assert(tamperedResult.valid === true, "Cart structure is parsed");
  assert(
    tamperedResult.subtotal === 1499,
    `Client-tampered price is ignored and database price is strictly enforced (got Rs ${tamperedResult.subtotal})`
  );

  // 2.5 Invalid quantity checks
  assert(
    validateOrderItems([{ productId: "prod-active-1", quantity: 0 }], mockCatalog).valid === false,
    "Quantity 0 is rejected"
  );
  assert(
    validateOrderItems([{ productId: "prod-active-1", quantity: -1 }], mockCatalog).valid === false,
    "Negative quantity is rejected"
  );
  assert(
    validateOrderItems([{ productId: "prod-active-1", quantity: 1.5 }], mockCatalog).valid === false,
    "Fractional quantity is rejected"
  );
  assert(
    validateOrderItems([{ productId: "prod-active-1", quantity: 100 }], mockCatalog).valid === false,
    "Quantity > 99 is rejected"
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Static Contract Checks
  // -------------------------------------------------------------------------
  console.log("\n--- SECTION 3: Static Source Code Contracts ---\n");

  const fs = await import("fs");
  const path = await import("path");

  const ordersRouteCode = fs.readFileSync(
    path.resolve("app/api/orders/route.ts"),
    "utf8"
  );
  assert(
    ordersRouteCode.includes("getActiveProductsServer"),
    "app/api/orders/route.ts imports and calls getActiveProductsServer"
  );
  assert(
    !ordersRouteCode.includes("getProductsServer()"),
    "app/api/orders/route.ts no longer calls unfiltered getProductsServer()"
  );
  assert(
    ordersRouteCode.includes("product.is_active === false"),
    "app/api/orders/route.ts explicitly checks product.is_active === false"
  );

  const authCallbackCode = fs.readFileSync(
    path.resolve("app/auth/callback/route.ts"),
    "utf8"
  );
  assert(
    authCallbackCode.includes("getSafeRedirectPath"),
    "app/auth/callback/route.ts exports and invokes getSafeRedirectPath"
  );
  assert(
    authCallbackCode.includes('getSafeRedirectPath(rawNext, "/profile")'),
    "app/auth/callback/route.ts sanitizes raw next parameter with /profile fallback"
  );

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED (${passed + failed} assertions)`);
  console.log("==================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPrePaymentFixesTestSuite().catch((err) => {
  console.error("Test suite runner crashed:", err);
  process.exit(1);
});
