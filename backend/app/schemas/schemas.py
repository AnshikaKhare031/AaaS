from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# Category Schemas
# ==========================================
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    display_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

class Category(CategoryBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# Product Image Schemas
# ==========================================
class ProductImage(BaseModel):
    id: Optional[str] = None
    product_id: Optional[str] = None
    image_url: str
    alt_text: Optional[str] = None
    display_order: int = 0

# ==========================================
# Product Schemas
# ==========================================
class ProductBase(BaseModel):
    name: str
    slug: Optional[str] = None
    category_id: Optional[str] = None
    description: str
    price: float = Field(..., ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    stock_quantity: int = Field(0, ge=0)
    inventory_count: Optional[int] = Field(None, ge=0)
    low_stock_threshold: int = Field(3, ge=0)
    sku: Optional[str] = None
    material: Optional[str] = "100% Premium Milk Cotton Yarn"
    care_instructions: Optional[str] = "Spot clean gently with cold water. Air dry flat."
    shipping_information: Optional[str] = "Dispatched in 2-4 business days."
    tags: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_customizable: bool = False
    is_bestseller: bool = False
    is_new: bool = False
    image: Optional[str] = None
    image_url: Optional[str] = None
    product_image: Optional[str] = None
    specifications: Optional[List[Dict[str, str]]] = None

class ProductCreate(ProductBase):
    image_urls: Optional[List[str]] = None
    images: Optional[Any] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    inventory_count: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    sku: Optional[str] = None
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    shipping_information: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_customizable: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    is_new: Optional[bool] = None
    image_urls: Optional[List[str]] = None
    images: Optional[Any] = None
    image: Optional[str] = None
    image_url: Optional[str] = None
    product_image: Optional[str] = None
    specifications: Optional[List[Dict[str, str]]] = None

class Product(ProductBase):
    id: str
    category: Optional[Category] = None
    images: List[ProductImage] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[Product]
    total: int
    page: int
    total_pages: int

# ==========================================
# Inventory Schemas
# ==========================================
class StockUpdatePayload(BaseModel):
    stock_quantity: int = Field(..., ge=0)

class StockAdjustPayload(BaseModel):
    delta: int
    reason: Optional[str] = None

# ==========================================
# Cart Schemas
# ==========================================
class AddToCartPayload(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1)

class UpdateCartItemPayload(BaseModel):
    quantity: int = Field(..., ge=1)

class CartItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    product_id: str
    product: Product
    quantity: int
    created_at: Optional[str] = None

# ==========================================
# Wishlist Schemas
# ==========================================
class WishlistPayload(BaseModel):
    product_id: str

class WishlistItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    product_id: str
    product: Product
    created_at: Optional[str] = None


# ==========================================
# Custom Order Schemas
# ==========================================
class CustomOrderCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    product_type: str
    category: Optional[str] = None
    color_preference: Optional[str] = None
    size_dimensions: Optional[str] = None
    quantity: int = Field(1, ge=1)
    budget: Optional[float] = None
    description: str
    images: Optional[List[str]] = []

class CustomOrder(BaseModel):
    id: str
    request_id: str
    user_id: Optional[str] = None
    name: str
    email: str
    phone: str
    product_type: str
    category: Optional[str] = None
    color_preference: Optional[str] = None
    size_dimensions: Optional[str] = None
    quantity: int
    budget: Optional[float] = None
    description: str
    images: List[str] = []
    status: str
    admin_notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class CustomOrderStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

# ==========================================
# Review Schemas
# ==========================================
class ReviewCreate(BaseModel):
    product_id: str
    customer_name: str
    rating: int = Field(..., ge=1, le=5)
    comment: str

class Review(BaseModel):
    id: str
    product_id: str
    user_id: Optional[str] = None
    order_id: Optional[str] = None
    customer_name: str
    rating: int
    comment: str
    is_approved: bool
    created_at: Optional[str] = None

class ReviewStatusUpdate(BaseModel):
    is_approved: bool

# ==========================================
# Admin Settings & Dashboard Schemas
# ==========================================
class AdminSettings(BaseModel):
    id: Optional[str] = "default"
    store_name: str = "AaaS - Handmade Crochet"
    store_email: str = "hello@aaascrochet.com"
    store_phone: str = "+91 98765 43210"
    fixed_shipping_fee: float = 99.0
    free_shipping_threshold: float = 1499.0
    enable_free_shipping: bool = True
    low_stock_threshold: int = 3
    currency: str = "INR"
    currency_symbol: str = "₹"
    instagram_url: str = "https://instagram.com/aaas_crochet"
    is_store_open: bool = True

class AdminSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    store_email: Optional[str] = None
    store_phone: Optional[str] = None
    fixed_shipping_fee: Optional[float] = None
    free_shipping_threshold: Optional[float] = None
    enable_free_shipping: Optional[bool] = None
    low_stock_threshold: Optional[int] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    instagram_url: Optional[str] = None
    is_store_open: Optional[bool] = None

class AdminDashboardMetrics(BaseModel):
    total_products: int
    low_stock_count: int
    total_customers: int
    custom_order_count: int
    pending_reviews_count: int

# ==========================================
# Order & Payment Enums
# ==========================================
class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"
    REFUNDED = "refunded"

# ==========================================
# Order Item Schemas
# ==========================================
class OrderItemBase(BaseModel):
    product_id: str
    product_name: str
    product_image: Optional[str] = None
    unit_price: float = Field(..., ge=0)
    quantity: int = Field(..., gt=0)
    subtotal: float = Field(..., ge=0)

class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., gt=0)

class OrderItemResponse(OrderItemBase):
    id: str
    order_id: Optional[str] = None
    price: Optional[float] = None
    total: Optional[float] = None

    class Config:
        from_attributes = True

# ==========================================
# Order Schemas
# ==========================================
class OrderBase(BaseModel):
    shipping_address: Any
    discount_amount: Optional[float] = 0.0
    shipping_fee: Optional[float] = 0.0
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]
    shipping_address: Any
    discount_amount: Optional[float] = 0.0
    shipping_fee: Optional[float] = 0.0

class OrderResponse(BaseModel):
    id: str
    order_number: str
    user_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    items: List[OrderItemResponse] = []
    shipping_address: Any
    subtotal: Optional[float] = 0.0
    discount_amount: float = 0.0
    shipping_fee: float = 0.0
    total_amount: float
    status: OrderStatus
    payment_status: Optional[PaymentStatus] = PaymentStatus.PENDING
    payment_method: Optional[str] = "razorpay"
    payment_id: Optional[str] = None
    provider_order_id: Optional[str] = None
    provider_payment_id: Optional[str] = None
    payment_confirmation_sent_at: Optional[str] = None
    carrier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# Payment Record Schemas
# ==========================================
class PaymentRecordResponse(BaseModel):
    id: str
    order_id: str
    payment_gateway: str = "Razorpay"
    gateway_order_id: Optional[str] = None
    payment_id: Optional[str] = None
    amount: float = Field(..., ge=0)
    currency: str = "INR"
    status: PaymentStatus = PaymentStatus.PENDING
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# Admin Operations & Analytics Schemas
# ==========================================
class AdminLoginPayload(BaseModel):
    email: EmailStr
    password: str

class OrderStatusUpdatePayload(BaseModel):
    status: OrderStatus
    carrier_name: Optional[str] = None
    tracking_number: Optional[str] = None
    notes: Optional[str] = None

class ProductQuickStatusUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None

class AnalyticsTimelineItem(BaseModel):
    date: str
    revenue: float
    orders: int

class AnalyticsCategoryItem(BaseModel):
    category: str
    revenue: float
    percentage: float
    orders_count: int

class AnalyticsTopProduct(BaseModel):
    id: str
    name: str
    image: Optional[str] = None
    units_sold: int
    revenue: float

class AdminAnalyticsResponse(BaseModel):
    time_range: str
    total_revenue: float
    order_volume: int
    aov: float
    revenue_change_pct: float
    order_volume_change_pct: float
    aov_change_pct: float
    timeline: List[AnalyticsTimelineItem]
    category_breakdown: List[AnalyticsCategoryItem]
    top_products: List[AnalyticsTopProduct]
    payment_health: Optional[Dict[str, int]] = None

# ==========================================
# Payment & Reconciliation Schemas
# ==========================================
class PaymentCreateOrderRequest(BaseModel):
    order_id: str

class PaymentCreateOrderResponse(BaseModel):
    order_id: str
    provider_order_id: str
    amount: float
    currency: str = "INR"
    key_id: str

class PaymentVerifyRequest(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentVerifyResponse(BaseModel):
    success: bool
    message: str
    payment_status: PaymentStatus
    order_id: str
    order_number: str

class PaymentRecoveryItem(BaseModel):
    order_id: str
    order_number: str
    previous_payment_status: str
    new_payment_status: str
    provider_payment_id: Optional[str] = None
    reason: str

class PaymentRecoverySweepResponse(BaseModel):
    scanned_count: int
    recovered_paid: int
    marked_failed_or_expired: int
    unchanged: int
    details: List[PaymentRecoveryItem] = []

# ==========================================
# Admin Operational Dashboard Overview
# ==========================================
class OperationalAlert(BaseModel):
    type: str
    title: str
    description: str
    action_link: Optional[str] = None

class AdminDashboardOverviewResponse(BaseModel):
    total_orders: int
    paid_orders: int
    pending_orders: int
    failed_payments: int
    expired_payments: int
    total_revenue: float
    low_stock_count: int
    total_products: int
    recent_orders: List[OrderResponse]
    payment_health: Dict[str, int]
    operational_alerts: List[OperationalAlert]
    custom_order_count: Optional[int] = 0
    pending_reviews_count: Optional[int] = 0



