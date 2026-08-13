from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_system():
    print("[TEST] Running full-stack integration test suite...")

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
    print(f"[OK] 4. Product Details API: OK (Product ID: {tulip_id}, Stock: {initial_stock})")

    # 5. Order Creation
    order_payload = {
        "items": [{"product_id": tulip_id, "quantity": 2}],
        "shipping_name": "Test Customer",
        "shipping_email": "customer@example.com",
        "shipping_phone": "+91 98765 43210",
        "shipping_address": "Flat 101, Test Street",
        "shipping_city": "Mumbai",
        "shipping_state": "Maharashtra",
        "shipping_pincode": "400001",
        "notes": "Testing order"
    }
    res = client.post("/api/orders", json=order_payload)
    assert res.status_code == 200, f"Order creation failed: {res.text}"
    order = res.json()
    order_id = order["id"]
    effective_price = prod.get("sale_price") if prod.get("sale_price") is not None else prod["price"]
    assert order["subtotal"] == effective_price * 2
    print(f"[OK] 5. Order Creation: OK (Order #{order['order_number']}, Total: INR {order['total']})")

    # 6. Razorpay Order Generation
    res = client.post("/api/payments/create-order", json={"order_id": order_id, "amount": order["total"]})
    assert res.status_code == 200
    rzp_data = res.json()
    assert "razorpay_order_id" in rzp_data
    rzp_order_id = rzp_data["razorpay_order_id"]
    print(f"[OK] 6. Razorpay Order Creation: OK (Razorpay Order ID: {rzp_order_id})")

    # 7. Razorpay Payment Verification & Transactional Stock Decrement
    verify_payload = {
        "razorpay_order_id": rzp_order_id,
        "razorpay_payment_id": "pay_test_payment_123",
        "razorpay_signature": "signature_demo_valid",
        "order_id": order_id
    }
    res = client.post("/api/payments/verify", json=verify_payload)
    assert res.status_code == 200, f"Payment verify failed: {res.text}"
    verify_res = res.json()
    assert verify_res["success"] is True
    assert verify_res["order"]["payment_status"] == "paid"
    print("[OK] 7. Payment Verification: OK (Order status updated to 'paid')")

    # 8. Check that inventory was decremented by 2
    res = client.get(f"/api/products/{tulip_id}")
    updated_prod = res.json()
    assert updated_prod["stock_quantity"] == initial_stock - 2
    print(f"[OK] 8. Transactional Inventory Update: OK (Stock reduced from {initial_stock} -> {updated_prod['stock_quantity']})")

    # 9. Custom Order Submission
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
    print(f"[OK] 9. Custom Order Request: OK (Request #{custom_order['request_id']})")

    # 10. Admin Inventory Management
    res = client.get("/api/admin/inventory", headers={"Authorization": "Bearer demo-admin-token"})
    assert res.status_code == 200
    inv = res.json()
    assert len(inv) >= 6
    print(f"[OK] 10. Admin Inventory Listing: OK ({len(inv)} items managed)")

    # 11. Admin Stock Adjustment
    res = client.post(f"/api/admin/inventory/{tulip_id}/adjust", json={"delta": 5, "reason": "Restocked new batch"}, headers={"Authorization": "Bearer demo-admin-token"})
    assert res.status_code == 200
    assert res.json()["stock_quantity"] == updated_prod["stock_quantity"] + 5
    print(f"[OK] 11. Admin Stock Adjustment: OK (New stock: {res.json()['stock_quantity']})")

    # 12. Admin Dashboard Metrics
    res = client.get("/api/admin/dashboard", headers={"Authorization": "Bearer demo-admin-token"})
    assert res.status_code == 200
    metrics = res.json()
    assert "total_revenue" in metrics
    assert "revenue_trend" in metrics
    print("[OK] 12. Admin Dashboard Metrics: OK")

    # 13. Admin Store Settings
    res = client.get("/api/admin/settings")
    assert res.status_code == 200
    settings = res.json()
    assert settings["currency"] == "INR"
    assert settings["currency_symbol"] == "₹"
    print("[OK] 13. Admin Settings: OK (INR / Rs)")

    print("\n>>> ALL 13 CRITICAL E-COMMERCE INTEGRATION TESTS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_full_system()
