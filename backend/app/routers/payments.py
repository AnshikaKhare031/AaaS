from fastapi import APIRouter, Depends, HTTPException, Request, Header, Query, status
from typing import Optional
from app.schemas.schemas import (
    PaymentCreateOrderRequest,
    PaymentCreateOrderResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
    PaymentRecoverySweepResponse,
)
from app.services.payment_service import payment_service
from app.utils.security import get_current_user_required, require_admin

router = APIRouter(tags=["Payments"])

@router.post("/payment/create-order", response_model=PaymentCreateOrderResponse)
@router.post("/payment/create-order/", response_model=PaymentCreateOrderResponse, include_in_schema=False)
async def create_provider_order_endpoint(
    req: PaymentCreateOrderRequest,
    current_user: dict = Depends(get_current_user_required)
):
    """
    Creates a Razorpay provider order corresponding to the local order.
    """
    return payment_service.create_provider_order(
        order_id=req.order_id,
        user_id=current_user["id"]
    )

@router.post("/payment/verify", response_model=PaymentVerifyResponse)
@router.post("/payment/verify/", response_model=PaymentVerifyResponse, include_in_schema=False)
async def verify_payment_endpoint(
    req: PaymentVerifyRequest,
    current_user: Optional[dict] = Depends(get_current_user_required)
):
    """
    Cryptographically verifies the Razorpay signature and reconciles the exact order to 'paid'.
    Never marks an order paid merely because the browser reports success.
    """
    is_valid = payment_service.verify_payment_signature(
        order_id=req.order_id,
        provider_order_id=req.razorpay_order_id,
        provider_payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment verification failed: Invalid cryptographic payment signature."
        )

    reconciled = payment_service.reconcile_order_payment(
        order_id=req.order_id,
        provider_order_id=req.razorpay_order_id,
        provider_payment_id=req.razorpay_payment_id,
        source="verification_route"
    )

    return {
        "success": True,
        "message": "Payment verified and order successfully confirmed.",
        "payment_status": reconciled.get("payment_status", "paid"),
        "order_id": reconciled["id"],
        "order_number": reconciled.get("order_number", "")
    }

@router.post("/payment/webhook")
@router.post("/payment/webhook/", include_in_schema=False)
async def payment_webhook_endpoint(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None, alias="X-Razorpay-Signature")
):
    """
    Webhook endpoint for Razorpay asynchronous payment events.
    Verifies HMAC signature, deduplicates duplicate deliveries, and reconciles payment state.
    """
    raw_body = await request.body()
    return payment_service.process_webhook(
        raw_body=raw_body,
        signature_header=x_razorpay_signature
    )

@router.post("/admin/payments/recovery-sweep", response_model=PaymentRecoverySweepResponse)
@router.post("/admin/payments/recovery-sweep/", response_model=PaymentRecoverySweepResponse, include_in_schema=False)
async def payment_recovery_sweep_endpoint(
    threshold_minutes: int = Query(30, ge=1, le=1440),
    admin_user: dict = Depends(require_admin)
):
    """
    Admin-only operational recovery sweep for stale pending payments.
    Recovers captured payments missing webhooks and transitions uncompleted checkouts to expired.
    """
    return payment_service.run_recovery_sweep(stale_threshold_minutes=threshold_minutes)
