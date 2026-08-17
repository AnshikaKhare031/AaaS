import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.config import settings

client = TestClient(app)

def test_full_system():
    print("[TEST] Running boutique integration test suite with real JWT verification...")

    # Generate real signed Supabase JWT tokens for testing
    admin_token = jwt.encode(
        {"sub": "admin-user-id-001", "email": "admin@aaascrochet.com", "aud": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )
    customer_token = jwt.encode(
        {"sub": "customer-user-id-001", "email": "customer@aaascrochet.com", "aud": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )
    forged_token = jwt.encode(
        {"sub": "hacker-user", "email": "hacker@evil.com", "aud": "authenticated"},
        "wrong-secret-key-12345",
        algorithm="HS256"
    )

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[OK] 1. Health Check: OK")

    # 2. Categories
    res = client.get("/api/categories")
    assert res.status_code == 200
    categories = res.json()
    assert len(categories) >= 4
    category_slugs = [c["slug"] for c in categories]
    assert "crochet-flowers-bouquets" in category_slugs
    assert "accessories" in category_slugs
    assert "handbags" in category_slugs
    assert "custom-orders" in category_slugs
    print("[OK] 2. Categories API: OK (Found 4 core categories)")

    # 3. Products List & Search & Filter
    res = client.get("/api/products?search=tulip")
    assert res.status_code == 200
    data = res.json()
    assert len(data["products"]) >= 1
    assert "Tulip" in data["products"][0]["name"]
    print("[OK] 3. Products Search: OK (Found Tulip bouquet)")

    # 4. Product Details & Amazon ASIN
    tulip_slug = data["products"][0]["slug"]
    res = client.get(f"/api/products/slug/{tulip_slug}")
    assert res.status_code == 200
    prod = res.json()
    tulip_id = prod["id"]
    initial_stock = prod["stock_quantity"]
    assert "amazon_asin" in prod
    assert prod["amazon_asin"] == "B0C9TULIP1"
    print(f"[OK] 4. Product Details API: OK (Product ID: {tulip_id}, ASIN: {prod['amazon_asin']}, Stock: {initial_stock})")

    # 5. Custom Order Submission
    custom_payload = {
        "name": "Priya Patel",
        "email": "priya@example.com",
        "phone": "+91 91234 56789",
        "product_type": "Bespoke Bridal Bouquet",
        "category": "Crochet Flowers & Bouquets",
        "color_preference": "Ivory and Sage Green",
        "size_dimensions": "Medium bouquet (12 stems)",
        "quantity": 1,
        "budget": 2500,
        "description": "A bridal bouquet for an intimate winter wedding with blush roses and lavender sprigs."
    }
    res = client.post("/api/custom-orders", json=custom_payload)
    assert res.status_code == 200, f"Custom order failed: {res.text}"
    custom_order = res.json()
    assert custom_order["status"] == "new"
    print(f"[OK] 5. Custom Order Request: OK (Request #{custom_order['request_id']})")

    # 6. Security Checks: Unauthorized / Forbidden / Forged tokens
    res_no_auth = client.get("/api/admin/dashboard")
    assert res_no_auth.status_code == 401, f"Expected 401 without auth, got {res_no_auth.status_code}"

    res_forged = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {forged_token}"})
    assert res_forged.status_code == 401, f"Expected 401 with forged token, got {res_forged.status_code}"

    res_customer = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_customer.status_code == 403, f"Expected 403 with customer token, got {res_customer.status_code}"
    print("[OK] 6. Security Gate: 401 for missing/forged token, 403 for non-admin token verified")

    # 7. Admin Inventory Management with valid admin JWT
    res = client.get("/api/admin/inventory", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    inv = res.json()
    assert len(inv) >= 6
    print(f"[OK] 7. Admin Inventory Listing: OK ({len(inv)} items managed)")

    # 8. Admin Stock Adjustment with valid admin JWT
    res = client.post(
        f"/api/admin/inventory/{tulip_id}/adjust",
        json={"delta": 5, "reason": "Restocked new batch"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res.status_code == 200
    assert res.json()["stock_quantity"] == initial_stock + 5
    print(f"[OK] 8. Admin Stock Adjustment: OK (New stock: {res.json()['stock_quantity']})")

    # 9. Admin Dashboard Metrics (Catalog, Stock, Custom Orders, Reviews)
    res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    metrics = res.json()
    assert "total_products" in metrics
    assert "low_stock_count" in metrics
    assert "custom_order_count" in metrics
    assert "pending_reviews_count" in metrics
    assert metrics["total_products"] >= 6
    print(f"[OK] 9. Admin Dashboard Metrics: OK (Products: {metrics['total_products']}, Low stock: {metrics['low_stock_count']}, Custom: {metrics['custom_order_count']})")

    # 10. Admin Store Settings
    res = client.get("/api/admin/settings")
    assert res.status_code == 200
    settings_data = res.json()
    assert settings_data["currency"] == "INR"
    assert settings_data["currency_symbol"] == "₹"
    print("[OK] 10. Admin Settings: OK (INR / Rs)")

    print("\n>>> ALL AUTH & INTEGRATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_full_system()
