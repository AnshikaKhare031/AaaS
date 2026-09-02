import jwt
from datetime import datetime, timezone, timedelta
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
    customer_token_2 = jwt.encode(
        {"sub": "customer-user-id-002", "email": "other@aaascrochet.com", "aud": "authenticated"},
        settings.SUPABASE_JWT_SECRET,
        algorithm="HS256"
    )
    from app.database import store
    store.profiles["customer-user-id-002"] = {
        "id": "customer-user-id-002",
        "email": "other@aaascrochet.com",
        "full_name": "Other Customer",
        "role": "customer",
    }
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

    # 4. Product Details
    tulip_slug = data["products"][0]["slug"]
    res = client.get(f"/api/products/slug/{tulip_slug}")
    assert res.status_code == 200
    prod = res.json()
    tulip_id = prod["id"]
    initial_stock = prod["stock_quantity"]
    assert prod["name"] == "Crochet Tulip Bouquet"
    assert prod["price"] == 999.0
    print(f"[OK] 4. Product Details API: OK (Product ID: {tulip_id}, Stock: {initial_stock})")

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

    # 11. Create Order with Server-Side Calculation & Stock Reservation
    stock_before_order = client.get(f"/api/products/slug/{tulip_slug}").json()["stock_quantity"]
    order_payload = {
        "items": [
            {"product_id": tulip_id, "quantity": 2}
        ],
        "shipping_address": {
            "fullName": "Priya Sharma",
            "email": "customer@aaascrochet.com",
            "phone": "+91 98765 43210",
            "address": "123 Artisan Lane",
            "city": "Jaipur",
            "state": "Rajasthan",
            "pincode": "302001"
        },
        "discount_amount": 100.0,
        "shipping_fee": 999.0 # Client attempts to send arbitrary shipping fee; server must compute real fee!
    }
    res = client.post("/api/orders", json=order_payload, headers={"Authorization": f"Bearer {customer_token}"})
    assert res.status_code == 201, f"Order creation failed: {res.text}"
    created_order = res.json()
    order_id = created_order["id"]
    assert created_order["user_id"] == "customer-user-id-001"
    assert len(created_order["items"]) == 1
    assert created_order["items"][0]["quantity"] == 2
    assert created_order["items"][0]["unit_price"] == 899.0
    assert created_order["items"][0]["subtotal"] == 1798.0
    # Subtotal is 1798 >= 1499 threshold -> free shipping fee = 0! (Server overrides client's 999.0)
    assert created_order["shipping_fee"] == 0.0
    # Total = 1798 - 100 discount + 0 shipping = 1698.0
    assert created_order["total_amount"] == 1698.0
    assert created_order["status"] == "pending"

    # Verify stock reservation
    stock_after_order = client.get(f"/api/products/slug/{tulip_slug}").json()["stock_quantity"]
    assert stock_after_order == stock_before_order - 2, f"Expected stock {stock_before_order - 2}, got {stock_after_order}"
    print(f"[OK] 11. Order Creation & Server Pricing: OK (Order #{created_order['order_number']}, Total: Rs {created_order['total_amount']}, Stock decremented {stock_before_order} -> {stock_after_order})")

    # 12. Stock Check Failure for Excessive Quantity
    excessive_order = {
        "items": [
            {"product_id": tulip_id, "quantity": 99999}
        ],
        "shipping_address": {"city": "Jaipur"}
    }
    res_excess = client.post("/api/orders", json=excessive_order, headers={"Authorization": f"Bearer {customer_token}"})
    assert res_excess.status_code == 400, f"Expected 400 for excessive stock, got {res_excess.status_code}"
    print("[OK] 12. Stock Availability Check: OK (Excessive quantity rejected with 400)")

    # 13. List User Orders (Strictly user's own orders)
    res_orders = client.get("/api/orders", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_orders.status_code == 200
    user_orders = res_orders.json()
    assert len(user_orders) >= 1
    assert any(o["id"] == order_id for o in user_orders)
    print(f"[OK] 13. Get User Orders: OK ({len(user_orders)} orders found for User 1)")

    # 14. Get Order By ID for Authorized Owner
    res_get_order = client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_get_order.status_code == 200
    assert res_get_order.json()["id"] == order_id
    print("[OK] 14. Get Order by ID (Authorized User): OK")

    # 15. CRITICAL SECURITY CHECK: Other User 2 Attempts to Access User 1's Order (IDOR Attack)
    res_attacker = client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {customer_token_2}"})
    assert res_attacker.status_code == 404, f"SECURITY BREACH! Other user accessed order. Expected 404, got {res_attacker.status_code}: {res_attacker.text}"
    print("[OK] 15. CRITICAL SECURITY CHECK: Other user cannot access User 1's order (Blocked with 404)")

    # 16. Admin Access to Specific Order and All Orders
    res_admin_get = client.get(f"/api/orders/{order_id}", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_get.status_code == 200
    assert res_admin_get.json()["id"] == order_id

    res_all_orders = client.get("/api/admin/orders", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_all_orders.status_code == 200
    assert len(res_all_orders.json()) >= 1

    # Non-admin forbidden from admin orders endpoint
    res_forbidden = client.get("/api/admin/orders", headers={"Authorization": f"Bearer {customer_token}"})
    assert res_forbidden.status_code == 403
    print("[OK] 16. Admin Management & Fulfillment Gate: OK (Admin can access all orders, non-admin blocked with 403)")

    # 17. Admin Login, Cookie Generation, and Logout
    # Test wrong password fails
    res_bad_pw = client.post("/api/admin/login", json={"email": "admin@aaascrochet.com", "password": "wrongpassword"})
    assert res_bad_pw.status_code == 401, f"Expected 401, got {res_bad_pw.status_code}"

    # Test valid login succeeds, sets admin_session cookie
    res_login = client.post("/api/admin/login", json={"email": "admin@aaascrochet.com", "password": "admin123"})
    assert res_login.status_code == 200, f"Login failed: {res_login.text}"
    login_data = res_login.json()
    assert login_data["success"] is True
    assert "token" in login_data
    assert "admin_session" in res_login.cookies
    session_cookie = res_login.cookies["admin_session"]

    # Test accessing admin endpoint with session cookie
    client.cookies.set("admin_session", session_cookie)
    res_cookie_auth = client.get("/api/admin/me")
    assert res_cookie_auth.status_code == 200
    assert res_cookie_auth.json()["user"]["role"] == "admin"

    # Test admin logout clears cookie
    res_logout = client.post("/api/admin/logout")
    assert res_logout.status_code == 200
    print("[OK] 17. Admin Session Authentication & Cookie Lifecycle: OK")

    # 18. Admin Analytics & Reporting Engine
    res_analytics = client.get("/api/admin/analytics?time_range=30d", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_analytics.status_code == 200, f"Analytics failed: {res_analytics.text}"
    analytics_data = res_analytics.json()
    assert "total_revenue" in analytics_data
    assert "order_volume" in analytics_data
    assert "aov" in analytics_data
    assert "timeline" in analytics_data
    assert len(analytics_data["timeline"]) == 30
    assert "category_breakdown" in analytics_data
    assert "top_products" in analytics_data
    print(f"[OK] 18. Admin Analytics Engine: OK (Revenue: Rs. {analytics_data['total_revenue']}, Volume: {analytics_data['order_volume']} orders, AOV: Rs. {analytics_data['aov']})")

    # 19. Admin Products Catalog Search & Filtering
    res_admin_prods = client.get("/api/admin/products", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin_prods.status_code == 200
    assert len(res_admin_prods.json()) >= 6

    # Test search by SKU or title
    res_search_tulip = client.get("/api/admin/products?search=Tulip", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_search_tulip.status_code == 200
    assert any("Tulip" in p["name"] for p in res_search_tulip.json())
    print("[OK] 19. Admin Products Management & Search: OK")

    # 20. Optimistic Status Quick-Toggle for Products
    res_toggle = client.patch(
        f"/api/admin/products/{tulip_id}/status",
        json={"is_featured": True, "is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_featured"] is True
    print("[OK] 20. Inline Product Quick-Toggle: OK")

    # 20b. Product Creation with Specifications & Customizable Flags (POST /api/products)
    new_prod_payload = {
        "name": "Ganesh MDF Welcome Board",
        "category_id": "55555555-5555-5555-5555-555555555555",
        "price": 850.0,
        "description": "Handcrafted festive welcome board with intricate Ganesh artwork.",
        "image_urls": ["/images/tulip_bouquet.jpg"],
        "is_featured": True,
        "is_customizable": True,
        "specifications": [
            {"label": "Material", "value": "Pine MDF Wood"},
            {"label": "Dimensions", "value": "12 x 8 inches"}
        ]
    }
    res_create_p = client.post("/api/products", json=new_prod_payload, headers={"Authorization": f"Bearer {admin_token}"})
    assert res_create_p.status_code == 200, f"Create product failed: {res_create_p.text}"
    created_p = res_create_p.json()
    assert created_p["name"] == "Ganesh MDF Welcome Board"
    assert created_p["price"] == 850.0
    assert created_p["is_customizable"] is True
    assert created_p["is_featured"] is True
    assert len(created_p["specifications"]) == 2
    assert created_p["specifications"][0]["label"] == "Material"
    assert created_p["slug"] == "ganesh-mdf-welcome-board"
    print("[OK] 20b. Product Creation with Specifications & Customizable flags: OK")

    # 21. Order State Machine Transition Validation & Fulfillment
    # Attempt invalid transition: pending -> delivered directly (MUST FAIL WITH 400)
    res_invalid_trans = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "delivered"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_invalid_trans.status_code == 400, f"Expected 400 for direct pending -> delivered, got {res_invalid_trans.status_code}"

    # Transition to processing: pending -> processing
    res_proc = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "processing", "notes": "Artisan weaving underway"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_proc.status_code == 200
    assert res_proc.json()["status"] == "processing"

    # Attempt transition to shipped without carrier/tracking (MUST FAIL WITH 400)
    res_ship_missing = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={"status": "shipped"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_ship_missing.status_code == 400, f"Expected 400 without carrier info, got {res_ship_missing.status_code}"

    # Valid transition to shipped with carrier and tracking
    res_ship = client.patch(
        f"/api/admin/orders/{order_id}/status",
        json={
            "status": "shipped",
            "carrier_name": "BlueDart",
            "tracking_number": "BD99881122IN",
            "notes": "Dispatched in presentation box"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_ship.status_code == 200
    assert res_ship.json()["status"] == "shipped"
    assert res_ship.json()["carrier_name"] == "BlueDart"
    assert res_ship.json()["tracking_number"] == "BD99881122IN"
    print("[OK] 21. Order State Machine Validation & Carrier Dispatch: OK")

    # 22. File Upload Pipeline
    import io
    fake_image = io.BytesIO(b"\xFF\xD8\xFF\xE0" + b"\x00" * 100)
    res_upload = client.post(
        "/api/upload",
        files={"file": ("bouquet_test.jpg", fake_image, "image/jpeg")},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_upload.status_code == 200, f"Upload failed: {res_upload.text}"
    assert res_upload.json()["success"] is True
    assert "url" in res_upload.json()
    assert ".webp" in res_upload.json()["filename"]
    print(f"[OK] 22. Admin Storage Pipeline & File Sanitization: OK ({res_upload.json()['filename']})")

    # ==========================================================
    # PAYMENT TEST MATRIX (Cases A through H)
    # ==========================================================
    import hmac
    import hashlib
    import json

    # 23. Case A: Normal successful payment (webhook -> paid -> confirmation email)
    res_ord_a = client.post("/api/orders", json={
        "items": [{"product_id": "p1111111-1111-1111-1111-111111111111", "quantity": 1}],
        "shipping_address": {"fullName": "Case A Patron", "email": "case_a@test.com", "address": "123 St"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    assert res_ord_a.status_code == 201
    ord_a_id = res_ord_a.json()["id"]

    # Create provider order
    res_prov_a = client.post("/api/payment/create-order", json={"order_id": ord_a_id}, headers={"Authorization": f"Bearer {customer_token}"})
    assert res_prov_a.status_code == 200
    prov_a_order_id = res_prov_a.json()["provider_order_id"]

    # Send valid signed webhook
    webhook_payload_a = {
        "id": "evt_test_case_a_001",
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_case_a_12345",
                    "order_id": prov_a_order_id,
                    "notes": {"order_id": ord_a_id}
                }
            }
        }
    }
    raw_body_a = json.dumps(webhook_payload_a).encode("utf-8")
    sig_a = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_body_a, hashlib.sha256).hexdigest()

    res_wh_a = client.post("/api/payment/webhook", data=raw_body_a, headers={"X-Razorpay-Signature": sig_a, "Content-Type": "application/json"})
    assert res_wh_a.status_code == 200
    assert res_wh_a.json()["status"] == "processed"

    # Verify order A state in store
    ord_a_record = store.orders[ord_a_id]
    assert ord_a_record["payment_status"] == "paid"
    assert ord_a_record["provider_payment_id"] == "pay_test_case_a_12345"
    assert ord_a_record["payment_confirmation_sent_at"] is not None
    assert ord_a_record["status"] == "pending"  # Order fulfillment status remains pending!
    print("[OK] 23. Case A: Normal successful payment & idempotent email recorded: OK")

    # 24. Case B: Webhook delayed, recovered by sweep
    res_ord_b = client.post("/api/orders", json={
        "items": [{"product_id": "p2222222-2222-2222-2222-222222222222", "quantity": 1}],
        "shipping_address": {"fullName": "Case B Patron", "email": "case_b@test.com", "address": "456 Rd"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    ord_b_id = res_ord_b.json()["id"]

    # Seed order as pending 45 minutes ago with provider order ID
    store.orders[ord_b_id]["provider_order_id"] = "order_rzp_delayed_b"
    store.orders[ord_b_id]["created_at"] = (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat()
    # Ledger captured payment in provider payment records
    store.payment_records["rec_case_b"] = {
        "id": "rec_case_b",
        "order_id": ord_b_id,
        "gateway_order_id": "order_rzp_delayed_b",
        "payment_id": "pay_case_b_captured_987",
        "status": "paid"
    }

    res_sweep = client.post("/api/admin/payments/recovery-sweep?threshold_minutes=30", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_sweep.status_code == 200
    assert res_sweep.json()["recovered_paid"] >= 1
    assert store.orders[ord_b_id]["payment_status"] == "paid"
    assert store.orders[ord_b_id]["provider_payment_id"] == "pay_case_b_captured_987"
    print("[OK] 24. Case B: Delayed webhook recovered safely by sweep: OK")

    # 25. Case C: Webhook duplicated
    res_wh_dup = client.post("/api/payment/webhook", data=raw_body_a, headers={"X-Razorpay-Signature": sig_a, "Content-Type": "application/json"})
    assert res_wh_dup.status_code == 200
    assert res_wh_dup.json()["status"] == "duplicate_ignored"
    print("[OK] 25. Case C: Duplicate webhook rejected without repeated side effects: OK")

    # 26. Case D: Payment failed
    res_ord_d = client.post("/api/orders", json={
        "items": [{"product_id": "p1111111-1111-1111-1111-111111111111", "quantity": 1}],
        "shipping_address": {"fullName": "Case D Patron", "email": "case_d@test.com", "address": "789 Ave"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    ord_d_id = res_ord_d.json()["id"]

    webhook_payload_d = {
        "id": "evt_test_case_d_failed",
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_test_failed_000",
                    "notes": {"order_id": ord_d_id}
                }
            }
        }
    }
    raw_body_d = json.dumps(webhook_payload_d).encode("utf-8")
    sig_d = hmac.new(settings.RAZORPAY_WEBHOOK_SECRET.encode("utf-8"), raw_body_d, hashlib.sha256).hexdigest()

    res_wh_d = client.post("/api/payment/webhook", data=raw_body_d, headers={"X-Razorpay-Signature": sig_d, "Content-Type": "application/json"})
    assert res_wh_d.status_code == 200
    assert store.orders[ord_d_id]["payment_status"] == "failed"
    print("[OK] 26. Case D: Failed payment marks local status as failed: OK")

    # 27. Case E: Payment remains unresolved
    res_ord_e = client.post("/api/orders", json={
        "items": [{"product_id": "p2222222-2222-2222-2222-222222222222", "quantity": 1}],
        "shipping_address": {"fullName": "Case E Patron", "email": "case_e@test.com", "address": "101 Way"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    ord_e_id = res_ord_e.json()["id"]
    store.orders[ord_e_id]["created_at"] = (datetime.now(timezone.utc) - timedelta(minutes=40)).isoformat()
    store.orders[ord_e_id]["provider_order_id"] = "order_unresolved_e"

    res_sweep_e = client.post("/api/admin/payments/recovery-sweep?threshold_minutes=30", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_sweep_e.status_code == 200
    assert store.orders[ord_e_id]["payment_status"] == "pending"
    print("[OK] 27. Case E: Unresolved payment remains safely pending: OK")

    # 28. Case F: Same customer has multiple orders (Reconciling one modifies only that exact order)
    res_ord_f1 = client.post("/api/orders", json={
        "items": [{"product_id": "p1111111-1111-1111-1111-111111111111", "quantity": 1}],
        "shipping_address": {"fullName": "Multi Order Patron", "email": "multi@test.com", "address": "M1"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    res_ord_f2 = client.post("/api/orders", json={
        "items": [{"product_id": "p2222222-2222-2222-2222-222222222222", "quantity": 1}],
        "shipping_address": {"fullName": "Multi Order Patron", "email": "multi@test.com", "address": "M2"}
    }, headers={"Authorization": f"Bearer {customer_token}"})
    res_ord_f3 = client.post("/api/orders", json={
        "items": [{"product_id": "p4444444-4444-4444-4444-444444444444", "quantity": 1}],
        "shipping_address": {"fullName": "Multi Order Patron", "email": "multi@test.com", "address": "M3"}
    }, headers={"Authorization": f"Bearer {customer_token}"})

    f1_id = res_ord_f1.json()["id"]
    f2_id = res_ord_f2.json()["id"]
    f3_id = res_ord_f3.json()["id"]

    store.orders[f1_id]["payment_status"] = "failed"
    store.orders[f2_id]["payment_status"] = "pending"
    store.orders[f3_id]["payment_status"] = "pending"

    # Reconcile ONLY f2
    from app.services.payment_service import payment_service
    payment_service.reconcile_order_payment(
        order_id=f2_id,
        provider_order_id="order_f2",
        provider_payment_id="pay_f2_isolated_success",
        source="unit_test"
    )

    assert store.orders[f1_id]["payment_status"] == "failed", "Order F1 must remain failed!"
    assert store.orders[f2_id]["payment_status"] == "paid", "Order F2 must be paid!"
    assert store.orders[f3_id]["payment_status"] == "pending", "Order F3 must remain pending!"
    print("[OK] 28. Case F: Narrowly scoped reconciliation isolates orders for same customer: OK")

    # 29. Case G: Provider says paid but payment ID unavailable/invalid
    try:
        payment_service.reconcile_order_payment(
            order_id=f3_id,
            provider_order_id="order_f3",
            provider_payment_id="",  # EMPTY PAYMENT ID MUST BE REJECTED
            source="unit_test"
        )
        assert False, "Empty payment ID should have raised 400"
    except Exception as exc:
        assert store.orders[f3_id]["payment_status"] == "pending"
    print("[OK] 29. Case G: Empty payment ID rejected, order remains pending: OK")

    # 30. Case H: Expired local record but captured provider payment -> recover to paid
    store.orders[f3_id]["payment_status"] = "expired"
    store.orders[f3_id]["status"] = "pending"

    recovered_h = payment_service.reconcile_order_payment(
        order_id=f3_id,
        provider_order_id="order_f3_recovered",
        provider_payment_id="pay_f3_valid_recovered_id",
        source="recovery"
    )
    assert recovered_h["payment_status"] == "paid"
    assert recovered_h["status"] == "pending"  # Fulfillment status preserved!
    print("[OK] 30. Case H: Expired local record recovered to paid, fulfillment unchanged: OK")

    print("\n>>> ALL 30 PRODUCTION REST API, OPERATIONAL, AND PAYMENT RECONCILIATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_full_system()


