import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import (
    RazorpayOrderCreate,
    RazorpayOrderResponse,
    PaymentVerifyPayload,
    PaymentVerifyResponse
)
from app.database import store, supabase_client
from app.services.razorpay_service import razorpay_service
from app.services.inventory_service import inventory_service

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/create-order", response_model=RazorpayOrderResponse)
async def create_razorpay_order_endpoint(payload: RazorpayOrderCreate):
    """
    Creates a Razorpay order from the FastAPI backend and returns the official order_id and key.
    """
    order = store.orders.get(payload.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{payload.order_id}' not found."
        )

    # Use authoritative total from order record
    amount = float(order.get("total", payload.amount))
    rzp_data = razorpay_service.create_order(payload.order_id, amount)

    # Save payment record in created status
    payment_id = str(uuid.uuid4())
    payment_record = {
        "id": payment_id,
        "order_id": payload.order_id,
        "razorpay_order_id": rzp_data["razorpay_order_id"],
        "amount": amount,
        "currency": "INR",
        "status": "created",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    store.payments[payment_id] = payment_record

    if supabase_client:
        try:
            supabase_client.table("payments").insert(payment_record).execute()
        except Exception as e:
            print(f"Supabase payment insert error: {e}")

    return {
        "razorpay_order_id": rzp_data["razorpay_order_id"],
        "amount": rzp_data["amount"],
        "currency": rzp_data["currency"],
        "key_id": rzp_data["key_id"],
    }

@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment_endpoint(payload: PaymentVerifyPayload):
    """
    Server-side cryptographic verification of Razorpay payment signature.
    Upon successful verification, updates order status and reduces inventory safely.
    """
    order = store.orders.get(payload.order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found for verification."
        )

    # 1. Cryptographic signature check
    is_valid, message = razorpay_service.verify_payment_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature
    )

    if not is_valid:
        # Mark payment failed
        if supabase_client:
            try:
                supabase_client.table("orders").update({
                    "payment_status": "failed"
                }).eq("id", payload.order_id).execute()
            except Exception:
                pass
        order["payment_status"] = "failed"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment verification failed: {message}"
        )

    # 2. Transactionally update Order and Payment
    now_str = datetime.now(timezone.utc).isoformat()
    order["payment_status"] = "paid"
    order["order_status"] = "confirmed"
    order["updated_at"] = now_str

    # 3. Transactionally decrement inventory
    order_items = order.get("items", [])
    inventory_service.reduce_stock_for_order(order_items)

    # 4. Update Supabase if connected
    if supabase_client:
        try:
            supabase_client.table("orders").update({
                "payment_status": "paid",
                "order_status": "confirmed",
                "updated_at": now_str
            }).eq("id", payload.order_id).execute()

            supabase_client.table("payments").insert({
                "id": str(uuid.uuid4()),
                "order_id": payload.order_id,
                "razorpay_order_id": payload.razorpay_order_id,
                "razorpay_payment_id": payload.razorpay_payment_id,
                "razorpay_signature": payload.razorpay_signature,
                "amount": order.get("total", 0),
                "currency": "INR",
                "status": "captured",
                "created_at": now_str
            }).execute()
        except Exception as e:
            print(f"Supabase payment update error: {e}")

    return {
        "success": True,
        "message": "Payment verified and order confirmed successfully ♡",
        "order": order
    }
