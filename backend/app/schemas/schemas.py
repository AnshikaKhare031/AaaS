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
    slug: str
    category_id: Optional[str] = None
    description: str
    price: float = Field(..., ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    stock_quantity: int = Field(0, ge=0)
    low_stock_threshold: int = Field(3, ge=0)
    material: Optional[str] = "100% Premium Milk Cotton Yarn"
    care_instructions: Optional[str] = "Spot clean gently with cold water. Air dry flat."
    shipping_information: Optional[str] = "Dispatched in 2-4 business days."
    tags: List[str] = []
    is_active: bool = True
    is_featured: bool = False
    is_bestseller: bool = False
    is_new: bool = False

class ProductCreate(ProductBase):
    image_urls: Optional[List[str]] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    sale_price: Optional[float] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    material: Optional[str] = None
    care_instructions: Optional[str] = None
    shipping_information: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    is_new: Optional[bool] = None
    image_urls: Optional[List[str]] = None

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
# Order Schemas
# ==========================================
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(..., ge=1)

class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    shipping_name: str
    shipping_email: EmailStr
    shipping_phone: str
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_pincode: str
    shipping_country: str = "India"
    notes: Optional[str] = None

class OrderItem(BaseModel):
    id: str
    order_id: str
    product_id: Optional[str] = None
    product_name: str
    product_image: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

class Order(BaseModel):
    id: str
    user_id: Optional[str] = None
    order_number: str
    subtotal: float
    shipping_fee: float
    total: float
    currency: str = "INR"
    payment_status: str
    order_status: str
    shipping_name: str
    shipping_email: str
    shipping_phone: str
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_pincode: str
    shipping_country: str = "India"
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItem] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str
    tracking_number: Optional[str] = None

# ==========================================
# Razorpay Payment Schemas
# ==========================================
class RazorpayOrderCreate(BaseModel):
    order_id: str
    amount: float

class RazorpayOrderResponse(BaseModel):
    razorpay_order_id: str
    amount: int  # in paise
    currency: str
    key_id: str

class PaymentVerifyPayload(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

class PaymentVerifyResponse(BaseModel):
    success: bool
    message: str
    order: Optional[Order] = None

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

class RevenueTrendItem(BaseModel):
    date: str
    amount: float

class AdminDashboardMetrics(BaseModel):
    total_revenue: float
    total_orders: int
    pending_orders: int
    completed_orders: int
    total_products: int
    low_stock_count: int
    total_customers: int
    custom_order_count: int
    recent_orders: List[Order] = []
    revenue_trend: List[RevenueTrendItem] = []
