from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from app.config import settings
from app.schemas.schemas import (
    AdminDashboardMetrics,
    AdminDashboardOverviewResponse,
    OperationalAlert,
    AdminSettings,
    AdminSettingsUpdate,
    AdminLoginPayload,
    AdminAnalyticsResponse,
    AnalyticsTimelineItem,
    AnalyticsCategoryItem,
    AnalyticsTopProduct,
)
from app.database import store, supabase_client
from app.utils.security import require_admin, create_admin_session_token

router = APIRouter(prefix="/admin", tags=["Admin System"])

# ==========================================
# 1. Admin Authentication & Session Boundary
# ==========================================
@router.post("/login")
async def admin_login(
    payload: AdminLoginPayload,
    response: Response
):
    """
    Validates admin credentials, generates HMAC-SHA256 admin_session token,
    and sets HttpOnly 7-day secure cookie.
    """
    email_clean = payload.email.strip().lower()
    expected_email = settings.ADMIN_EMAIL.strip().lower()

    if email_clean != expected_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    # Password validation: against ADMIN_SECRET or ADMIN_PASSWORD_HASH
    is_valid_password = False
    if settings.ADMIN_PASSWORD_HASH:
        # If bcrypt hash configured
        try:
            import hmac
            is_valid_password = hmac.compare_digest(payload.password, settings.ADMIN_PASSWORD_HASH)
        except Exception:
            is_valid_password = False
    
    if not is_valid_password and settings.ADMIN_SECRET:
        import hmac
        is_valid_password = hmac.compare_digest(payload.password, settings.ADMIN_SECRET)

    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )

    # Generate 7-day HMAC-SHA256 admin session token
    token = create_admin_session_token(email=expected_email)

    # Set HttpOnly, SameSite=Lax, Secure cookie
    response.set_cookie(
        key="admin_session",
        value=token,
        max_age=604800,  # 7 days
        httponly=True,
        secure=(settings.ENVIRONMENT == "production"),
        samesite="lax",
        path="/"
    )

    admin_profile = {
        "id": "admin-user-id-001",
        "email": expected_email,
        "full_name": "AaaS Master Artisan",
        "role": "admin"
    }

    return {
        "success": True,
        "token": token,
        "user": admin_profile
    }

@router.post("/logout")
async def admin_logout(response: Response):
    """
    Immediately invalidates and clears the admin_session cookie.
    """
    response.delete_cookie(
        key="admin_session",
        path="/",
        samesite="lax",
        secure=(settings.ENVIRONMENT == "production")
    )
    return {
        "success": True,
        "message": "Admin session invalidated and logged out successfully"
    }

@router.get("/me")
async def get_admin_me(admin_user: dict = Depends(require_admin)):
    """
    Returns current authenticated admin profile.
    """
    return {
        "authenticated": True,
        "user": admin_user
    }

# ==========================================
# 2. Admin Dashboard Operational Metrics & Settings
# ==========================================
@router.get("/dashboard", response_model=AdminDashboardOverviewResponse)
async def get_admin_dashboard_metrics(admin_user: dict = Depends(require_admin)):
    """
    Computes real-time operational overview: orders count, paid revenue,
    payment health (paid, pending, failed, expired), low stock alerts, and recent orders.
    """
    all_orders = list(store.orders.values())
    total_orders = len(all_orders)
    paid_orders = sum(1 for o in all_orders if o.get("payment_status") == "paid")
    pending_orders = sum(1 for o in all_orders if o.get("payment_status") == "pending")
    failed_payments = sum(1 for o in all_orders if o.get("payment_status") == "failed")
    expired_payments = sum(1 for o in all_orders if o.get("payment_status") == "expired")
    
    # Revenue is derived solely from qualifying paid orders
    total_revenue = round(
        sum(float(o.get("total_amount") or o.get("total", 0.0)) for o in all_orders if o.get("payment_status") == "paid"),
        2
    )

    products = list(store.products.values())
    total_products = len(products)
    low_stock_count = sum(1 for p in products if p.get("stock_quantity", 0) <= p.get("low_stock_threshold", 3))

    sorted_orders = sorted(all_orders, key=lambda x: x.get("created_at", ""), reverse=True)
    recent_orders = [
        dict(o, items=store.order_items.get(o["id"], []))
        for o in sorted_orders[:8]
    ]

    alerts = []
    if low_stock_count > 0:
        alerts.append({
            "type": "warning",
            "title": f"Low Inventory Alert: {low_stock_count} item{'s' if low_stock_count > 1 else ''}",
            "description": "Handcrafted creations running low in stock; consider restocking yarn batches.",
            "action_link": "/admin/inventory"
        })
    if failed_payments > 0:
        alerts.append({
            "type": "danger",
            "title": f"Failed Payment Gateways: {failed_payments} order{'s' if failed_payments > 1 else ''}",
            "description": "Transactions failed at payment provider; inspect orders for recovery.",
            "action_link": "/admin/orders"
        })
    if pending_orders > 0:
        alerts.append({
            "type": "info",
            "title": f"Orders Awaiting Action: {pending_orders} pending",
            "description": "Incoming patron orders awaiting payment confirmation or fulfillment dispatch.",
            "action_link": "/admin/orders"
        })

    return {
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "pending_orders": pending_orders,
        "failed_payments": failed_payments,
        "expired_payments": expired_payments,
        "total_revenue": total_revenue,
        "low_stock_count": low_stock_count,
        "total_products": total_products,
        "recent_orders": recent_orders,
        "payment_health": {
            "paid": paid_orders,
            "pending": pending_orders,
            "failed": failed_payments,
            "expired": expired_payments,
        },
        "operational_alerts": alerts,
        "custom_order_count": len(store.custom_orders),
        "pending_reviews_count": sum(1 for r in store.reviews.values() if not r.get("is_approved", False)),
    }

@router.get("/settings", response_model=AdminSettings)
async def get_store_settings():
    if supabase_client:
        try:
            res = supabase_client.table("admin_settings").select("*").single().execute()
            if res.data:
                return res.data
        except Exception:
            pass

    return store.settings

@router.put("/settings", response_model=AdminSettings)
async def update_store_settings(
    settings_in: AdminSettingsUpdate,
    admin_user: dict = Depends(require_admin)
):
    data = settings_in.model_dump(exclude_unset=True)
    for k, v in data.items():
        store.settings[k] = v
    store.settings["updated_at"] = datetime.now(timezone.utc).isoformat()

    if supabase_client:
        try:
            supabase_client.table("admin_settings").update(store.settings).eq("id", store.settings.get("id")).execute()
        except Exception as e:
            print(f"Supabase settings update error: {e}")

    return store.settings

# ==========================================
# 3. Analytics & Reporting Engine
# ==========================================
@router.get("/analytics", response_model=AdminAnalyticsResponse)
async def get_admin_analytics(
    time_range: str = Query("30d", pattern="^(7d|30d|90d|ytd)$"),
    admin_user: dict = Depends(require_admin)
):
    """
    Computes time-series revenue, volume, AOV, percentage trends, category contributions,
    and top performing products over 7d, 30d, 90d, or ytd.
    """
    now = datetime.now(timezone.utc)
    if time_range == "7d":
        days = 7
    elif time_range == "30d":
        days = 30
    elif time_range == "90d":
        days = 90
    else:  # ytd
        start_of_year = datetime(now.year, 1, 1, tzinfo=timezone.utc)
        days = max(1, (now - start_of_year).days)

    curr_start = now - timedelta(days=days)
    prev_start = curr_start - timedelta(days=days)

    all_orders = list(store.orders.values())

    # Filter orders into current and preceding periods
    curr_orders = []
    prev_orders = []

    for o in all_orders:
        if o.get("status") == "cancelled":
            continue

        created_str = o.get("created_at")
        if not created_str:
            continue

        try:
            # Handle ISO string with or without Z/offset
            created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
        except Exception:
            created_dt = now

        if curr_start <= created_dt <= now:
            curr_orders.append(o)
        elif prev_start <= created_dt < curr_start:
            prev_orders.append(o)

    curr_paid_orders = [o for o in curr_orders if o.get("payment_status") == "paid"]
    prev_paid_orders = [o for o in prev_orders if o.get("payment_status") == "paid"]

    curr_rev = round(sum(float(o.get("total_amount") or o.get("total", 0.0)) for o in curr_paid_orders), 2)
    prev_rev = round(sum(float(o.get("total_amount") or o.get("total", 0.0)) for o in prev_paid_orders), 2)

    curr_vol = len(curr_orders)
    prev_vol = len(prev_orders)

    curr_aov = round(curr_rev / len(curr_paid_orders), 2) if len(curr_paid_orders) > 0 else 0.0
    prev_aov = round(prev_rev / len(prev_paid_orders), 2) if len(prev_paid_orders) > 0 else 0.0

    def calc_pct_change(curr: float, prev: float) -> float:
        if prev > 0:
            return round(((curr - prev) / prev) * 100, 1)
        return 100.0 if curr > 0 else 0.0

    rev_change = calc_pct_change(curr_rev, prev_rev)
    vol_change = calc_pct_change(float(curr_vol), float(prev_vol))
    aov_change = calc_pct_change(curr_aov, prev_aov)

    # 1. Generate Daily Time-Series (Revenue only from qualifying paid orders)
    timeline_dict = {}
    for d in range(days):
        day_date = (curr_start + timedelta(days=d)).strftime("%Y-%m-%d")
        timeline_dict[day_date] = {"revenue": 0.0, "orders": 0}

    for o in curr_orders:
        created_str = o.get("created_at")
        try:
            day_str = datetime.fromisoformat(created_str.replace("Z", "+00:00")).strftime("%Y-%m-%d")
        except Exception:
            day_str = now.strftime("%Y-%m-%d")

        if day_str in timeline_dict:
            if o.get("payment_status") == "paid":
                timeline_dict[day_str]["revenue"] += float(o.get("total_amount") or o.get("total", 0.0))
            timeline_dict[day_str]["orders"] += 1

    timeline: List[AnalyticsTimelineItem] = [
        AnalyticsTimelineItem(
            date=d,
            revenue=round(val["revenue"], 2),
            orders=val["orders"]
        )
        for d, val in sorted(timeline_dict.items())
    ]

    # Payment Health Breakdown
    payment_health = {
        "paid": sum(1 for o in curr_orders if o.get("payment_status") == "paid"),
        "pending": sum(1 for o in curr_orders if o.get("payment_status") == "pending"),
        "failed": sum(1 for o in curr_orders if o.get("payment_status") == "failed"),
        "expired": sum(1 for o in curr_orders if o.get("payment_status") == "expired"),
    }

    # 2. Category Contribution Breakdown
    category_rev: Dict[str, Dict[str, Any]] = {}
    total_cat_rev = 0.0

    for o in curr_orders:
        items = o.get("items") or store.order_items.get(o["id"], [])
        for item in items:
            prod_id = item.get("product_id")
            prod = store.products.get(prod_id, {})
            cat_name = prod.get("category_name") or prod.get("category") or "Bouquets & Flowers"
            if isinstance(cat_name, dict):
                cat_name = cat_name.get("name", "Crochet Art")
            
            sub = float(item.get("subtotal", 0.0))
            if cat_name not in category_rev:
                category_rev[cat_name] = {"revenue": 0.0, "count": 0}
            category_rev[cat_name]["revenue"] += sub
            category_rev[cat_name]["count"] += int(item.get("quantity", 1))
            total_cat_rev += sub

    category_breakdown: List[AnalyticsCategoryItem] = []
    if total_cat_rev > 0:
        for cat_name, data in category_rev.items():
            pct = round((data["revenue"] / total_cat_rev) * 100, 1)
            category_breakdown.append(AnalyticsCategoryItem(
                category=cat_name,
                revenue=round(data["revenue"], 2),
                percentage=pct,
                orders_count=data["count"]
            ))
    else:
        # Provide default structured categories if no current orders yet
        category_breakdown = [
            AnalyticsCategoryItem(category="Crochet Flowers & Bouquets", revenue=0.0, percentage=45.0, orders_count=0),
            AnalyticsCategoryItem(category="Handbags & Clutches", revenue=0.0, percentage=35.0, orders_count=0),
            AnalyticsCategoryItem(category="Artisan Accessories", revenue=0.0, percentage=20.0, orders_count=0),
        ]

    # 3. Top-Performing Products
    prod_sales: Dict[str, Dict[str, Any]] = {}
    for o in curr_orders:
        items = o.get("items") or store.order_items.get(o["id"], [])
        for item in items:
            p_id = item.get("product_id")
            if not p_id:
                continue
            if p_id not in prod_sales:
                prod_sales[p_id] = {
                    "name": item.get("product_name", "Handmade Creation"),
                    "image": item.get("product_image"),
                    "units": 0,
                    "revenue": 0.0
                }
            prod_sales[p_id]["units"] += int(item.get("quantity", 1))
            prod_sales[p_id]["revenue"] += float(item.get("subtotal", 0.0))

    top_products_list: List[AnalyticsTopProduct] = []
    for p_id, data in sorted(prod_sales.items(), key=lambda x: x[1]["revenue"], reverse=True)[:5]:
        top_products_list.append(AnalyticsTopProduct(
            id=p_id,
            name=data["name"],
            image=data["image"],
            units_sold=data["units"],
            revenue=round(data["revenue"], 2)
        ))

    # If no sales yet, seed with top catalog items for visual completeness
    if not top_products_list:
        for p in list(store.products.values())[:4]:
            top_products_list.append(AnalyticsTopProduct(
                id=p.get("id"),
                name=p.get("name"),
                image=p.get("images", [{}])[0].get("image_url") if p.get("images") else None,
                units_sold=0,
                revenue=0.0
            ))

    return AdminAnalyticsResponse(
        time_range=time_range,
        total_revenue=curr_rev,
        order_volume=curr_vol,
        aov=curr_aov,
        revenue_change_pct=rev_change,
        order_volume_change_pct=vol_change,
        aov_change_pct=aov_change,
        timeline=timeline,
        category_breakdown=category_breakdown,
        top_products=top_products_list,
        payment_health=payment_health
    )
