import os
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone, timedelta
from app.config import settings

# Attempt to initialize Supabase client if credentials exist
supabase_client = None
if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
    try:
        from supabase import create_client, Client
        supabase_client: Optional[Client] = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        print("Connected to Supabase PostgreSQL service successfully.")
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}. Using local store.")
        supabase_client = None


class InMemoryStore:
    """
    High-performance in-memory database store with seed data.
    Used for local sandbox/testing and graceful fallback when Supabase is not yet configured.
    """
    def __init__(self):
        self.categories: Dict[str, dict] = {}
        self.products: Dict[str, dict] = {}
        self.product_images: Dict[str, list] = {}
        self.cart_items: Dict[str, list] = {}
        self.wishlist_items: Dict[str, list] = {}
        self.custom_orders: Dict[str, dict] = {}
        self.reviews: Dict[str, dict] = {}
        self.orders: Dict[str, dict] = {}
        self.order_items: Dict[str, list] = {}
        self.payment_records: Dict[str, dict] = {}
        self.webhook_events: Dict[str, dict] = {}
        self.profiles: Dict[str, dict] = {
            "admin-user-id-001": {
                "id": "admin-user-id-001",
                "email": "admin@aaascrochet.com",
                "full_name": "AaaS Master Artisan",
                "role": "admin",
            },
            "customer-user-id-001": {
                "id": "customer-user-id-001",
                "email": "customer@aaascrochet.com",
                "full_name": "Priya Sharma",
                "role": "customer",
            },
        }
        self.settings: dict = {
            "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "store_name": "AaaS - Handmade Crochet",
            "store_email": "hello@aaascrochet.com",
            "store_phone": "+91 98765 43210",
            "fixed_shipping_fee": 99.0,
            "free_shipping_threshold": 1499.0,
            "enable_free_shipping": True,
            "low_stock_threshold": 3,
            "currency": "INR",
            "currency_symbol": "₹",
            "instagram_url": "https://instagram.com/aaas_crochet",
            "is_store_open": True,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.seed_defaults()

    def seed_defaults(self):
        # 1. Seed Categories
        cats = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "name": "Crochet Flowers & Bouquets",
                "slug": "crochet-flowers-bouquets",
                "description": "Everlasting handcrafted botanical stems, bouquets and floral arrangements made with soft cotton yarn.",
                "image_url": "/images/tulip_bouquet.jpg",
                "is_active": True,
                "display_order": 1,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "name": "Handbags",
                "slug": "handbags",
                "description": "Chic artisan totes, crossbody bags, and mini clutches handcrafted with chunky textured yarn.",
                "image_url": "/images/mini_handbag.jpg",
                "is_active": True,
                "display_order": 2,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "name": "Accessories",
                "slug": "accessories",
                "description": "Delicate everyday crochet accessories: keychains, scrunchies, coasters, floral clips, and pouches.",
                "image_url": "/images/flower_coaster.jpg",
                "is_active": True,
                "display_order": 3,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "name": "Custom Orders",
                "slug": "custom-orders",
                "description": "Personalized bespoke crochet creations tailored to your chosen palette, size, and design vision.",
                "image_url": "/images/custom_banner.jpg",
                "is_active": True,
                "display_order": 4,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "55555555-5555-5555-5555-555555555555",
                "name": "MDF Board Art",
                "slug": "mdf-board-art",
                "description": "Handcrafted MDF welcome boards, festive nameplates, and decorative wall art.",
                "image_url": "/images/tulip_bouquet.jpg",
                "is_active": True,
                "display_order": 5,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "66666666-6666-6666-6666-666666666666",
                "name": "Pouches",
                "slug": "pouches",
                "description": "Handcrafted textured pouches, makeup bags, and artisan coin organizers.",
                "image_url": "/images/mini_handbag.jpg",
                "is_active": True,
                "display_order": 6,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "77777777-7777-7777-7777-777777777777",
                "name": "Magnets",
                "slug": "magnets",
                "description": "Artisan handmade fridge magnets and miniature handcrafted keepsakes.",
                "image_url": "/images/flower_coaster.jpg",
                "is_active": True,
                "display_order": 7,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "88888888-8888-8888-8888-888888888888",
                "name": "Rakhis",
                "slug": "rakhis",
                "description": "Traditional and modern slow-crafted artisan rakhis and ceremonial threads.",
                "image_url": "/images/tulip_bouquet.jpg",
                "is_active": True,
                "display_order": 8,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        for c in cats:
            self.categories[c["id"]] = c

        # 2. Seed Products
        prods = [
            {
                "id": "p1111111-1111-1111-1111-111111111111",
                "category_id": "11111111-1111-1111-1111-111111111111",
                "name": "Crochet Tulip Bouquet",
                "slug": "crochet-tulip-bouquet",
                "description": "An enchanting bouquet of handcrafted crochet tulips in delicate shades of soft blush, warm ivory, and gentle peach. Each bloom is individually crocheted from premium milk cotton yarn with flexible wire-reinforced stems, wrapped in eco-conscious kraft paper with an antique gold ribbon tie. A timeless gift that never withers.",
                "price": 999.0,
                "sale_price": 899.0,
                "stock_quantity": 12,
                "low_stock_threshold": 3,
                "material": "100% Premium Milk Cotton Yarn, Floral Craft Wire, Kraft Wrap, Satin Ribbon",
                "care_instructions": "Keep away from direct moisture. Gently dust with a soft brush or hairdryer on cool setting. Re-shape petals gently with clean hands.",
                "shipping_information": "Ships in a sturdy protective presentation gift box within 2-3 business days across India.",
                "tags": ["tulips", "bouquet", "flowers", "gift", "bestseller"],
                "is_active": True,
                "is_featured": True,
                "is_bestseller": True,
                "is_new": True,
                "images": [
                    {"image_url": "/images/tulip_bouquet.jpg", "alt_text": "Handmade Crochet Tulip Bouquet in Pastel Tones", "display_order": 1},
                    {"image_url": "/images/hero_lifestyle.jpg", "alt_text": "Crochet Bouquet Lifestyle Editorial", "display_order": 2}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "p2222222-2222-2222-2222-222222222222",
                "category_id": "22222222-2222-2222-2222-222222222222",
                "name": "Crochet Mini Handbag",
                "slug": "crochet-mini-handbag",
                "description": "Crafted for modern elegance, this chunky-knit artisan handbag features a warm ivory and taupe weave, sturdy structured bamboo top handles, and a soft cotton interior. Perfectly sized to hold your essentials—phone, keys, compact wallet, and lip balm—while adding a warm, handcrafted statement to any outfit.",
                "price": 1499.0,
                "sale_price": 1299.0,
                "stock_quantity": 8,
                "low_stock_threshold": 2,
                "material": "Organic Chunky Cotton Yarn, Natural Bamboo Ring Handles, Magnetic Snap Clasp",
                "care_instructions": "Spot clean with mild detergent and cold damp cloth. Air dry flat. Do not submerge bamboo handles in water.",
                "shipping_information": "Comes with a protective breathable cotton dustbag. Dispatched in 2-4 business days.",
                "tags": ["handbag", "tote", "bamboo", "luxury", "chic"],
                "is_active": True,
                "is_featured": True,
                "is_bestseller": True,
                "is_new": True,
                "images": [
                    {"image_url": "/images/mini_handbag.jpg", "alt_text": "Handmade Chunky Knit Crochet Handbag with Bamboo Handles", "display_order": 1},
                    {"image_url": "/images/hero_lifestyle.jpg", "alt_text": "Crochet Handbag Lifestyle Shot", "display_order": 2}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "p3333333-3333-3333-3333-333333333333",
                "category_id": "11111111-1111-1111-1111-111111111111",
                "name": "Crochet Daisy Bouquet",
                "slug": "crochet-daisy-bouquet",
                "description": "A cheerful yet elegant arrangement of bright white crochet daisies with golden textured sunburst centers and delicate sage green foliage. Lovingly tied with an organic linen ribbon, this bouquet brings warm, sunny craftsmanship into any room.",
                "price": 999.0,
                "sale_price": None,
                "stock_quantity": 15,
                "low_stock_threshold": 3,
                "material": "100% Soft Cotton Blend, Bendable Stem Wire, Natural Linen Tie",
                "care_instructions": "Dust gently with soft cloth. Avoid soaking. Stems can be bent to fit various vase heights.",
                "shipping_information": "Delivered in gift-ready aesthetic packaging with a personalized handwritten note card.",
                "tags": ["daisy", "flowers", "sage", "gift", "nature"],
                "is_active": True,
                "is_featured": True,
                "is_bestseller": False,
                "is_new": True,
                "images": [
                    {"image_url": "/images/daisy_bouquet.jpg", "alt_text": "Handcrafted Crochet Daisy and Wildflower Bouquet", "display_order": 1},
                    {"image_url": "/images/artisan_hands.jpg", "alt_text": "Crochet Craftsmanship in Progress", "display_order": 2}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "p4444444-4444-4444-4444-444444444444",
                "category_id": "33333333-3333-3333-3333-333333333333",
                "name": "Crochet Flower Coaster Set",
                "slug": "crochet-flower-coaster",
                "description": "Set of 4 artisan botanical coasters handcrafted in harmonious tones of sage green, ivory cream, and warm taupe. Thick, heat-resistant, and absorbent, these coasters protect your tabletops while bringing warmth and organic beauty to your coffee and tea rituals.",
                "price": 250.0,
                "sale_price": 299.0,
                "stock_quantity": 25,
                "low_stock_threshold": 5,
                "material": "100% Natural Absorbent Milk Cotton Yarn",
                "care_instructions": "Hand wash in cold water with gentle soap. Lay flat on towel to dry. Warm iron over cloth if needed.",
                "shipping_information": "Packaged neatly with craft paper belly-band. Dispatched within 24-48 hours.",
                "tags": ["coasters", "home decor", "accessories", "tableware", "botanical"],
                "is_active": True,
                "is_featured": False,
                "is_bestseller": True,
                "is_new": False,
                "images": [
                    {"image_url": "/images/flower_coaster.jpg", "alt_text": "Set of 4 Handmade Floral Blossom Coasters", "display_order": 1}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "p5555555-5555-5555-5555-555555555555",
                "category_id": "33333333-3333-3333-3333-333333333333",
                "name": "Crochet Keychain & Charm Set",
                "slug": "crochet-keychain-charm-set",
                "description": "An adorable trio of mini handcrafted accessories: a sweet crochet strawberry charm, a soft peach keyring, and a delicate floral scrunchie. Finished with durable antique gold metal lobster clasps to clip effortlessly onto bags, keys, or pouches.",
                "price": 199.0,
                "sale_price": 249.0,
                "stock_quantity": 30,
                "low_stock_threshold": 5,
                "material": "Mercerized Cotton Thread, Hypoallergenic Polyester Fill, Antique Gold Alloy Hardware",
                "care_instructions": "Wipe hardware with dry microfiber cloth. Spot clean crochet surface gently.",
                "shipping_information": "Ships in a cute pillow box with AaaS gold wax seal aesthetic.",
                "tags": ["keychain", "accessories", "charms", "strawberry", "scrunchie"],
                "is_active": True,
                "is_featured": False,
                "is_bestseller": True,
                "is_new": True,
                "images": [
                    {"image_url": "/images/keychain_charms.jpg", "alt_text": "Handmade Mini Crochet Accessories & Keychains", "display_order": 1}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "p6666666-6666-6666-6666-666666666666",
                "category_id": "44444444-4444-4444-4444-444444444444",
                "name": "Bespoke Personalized Crochet Piece",
                "slug": "bespoke-custom-crochet-piece",
                "description": "Have a dream crochet design in mind? Collaborate directly with our master artisan to create custom bridal bouquets, heirloom baby blankets, bespoke color-matched handbags, or unique decor pieces. Price starts as a base deposit and adjusts according to your requirements.",
                "price": 1499.0,
                "sale_price": None,
                "stock_quantity": 99,
                "low_stock_threshold": 5,
                "material": "Custom Selected Premium Organic Yarns (Cotton, Bamboo, or Merino Wool)",
                "care_instructions": "Detailed custom care guide provided with each bespoke finished order.",
                "shipping_information": "Made-to-order craft timeline: 7 to 14 days handcrafted production + standard dispatch.",
                "tags": ["custom", "bespoke", "personalized", "artisan", "special"],
                "is_active": True,
                "is_featured": True,
                "is_bestseller": False,
                "is_new": True,
                "images": [
                    {"image_url": "/images/custom_banner.jpg", "alt_text": "Bespoke Custom Order Flatlay & Yarn Skeins", "display_order": 1}
                ],
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        for p in prods:
            self.products[p["id"]] = p

        # 3. Seed Reviews
        revs = [
            {
                "id": "r1",
                "product_id": "p1111111-1111-1111-1111-111111111111",
                "customer_name": "Ananya S.",
                "rating": 5,
                "comment": "The tulip bouquet is beyond breathtaking! The stitches are so uniform and delicate. It looks so elegant on my bedside console.",
                "is_approved": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "r2",
                "product_id": "p1111111-1111-1111-1111-111111111111",
                "customer_name": "Meera Kapoor",
                "rating": 5,
                "comment": "Ordered this for my sister’s anniversary. She literally cried happy tears. The packaging with the gold ribbon was perfection.",
                "is_approved": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "r3",
                "product_id": "p2222222-2222-2222-2222-222222222222",
                "customer_name": "Rhea Sharma",
                "rating": 5,
                "comment": "Such a luxury piece! The bamboo handles and chunky knit texture feel very high-end. I get compliments everywhere I go.",
                "is_approved": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
            {
                "id": "r4",
                "product_id": "p4444444-4444-4444-4444-444444444444",
                "customer_name": "Pooja V.",
                "rating": 5,
                "comment": "Thick, absorbent and so pretty! These coasters transformed my morning tea ritual. Highly recommend!",
                "is_approved": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            },
        ]
        for r in revs:
            self.reviews[r["id"]] = r

        # 4. Seed Orders & Order Items
        now = datetime.now(timezone.utc)
        seed_orders_data = [
            {
                "id": "ord-seed-001",
                "order_number": "ORD-10821",
                "user_id": "customer-user-id-001",
                "customer_name": "Priya Patel",
                "customer_email": "priya.patel@example.com",
                "customer_phone": "+91 98765 43210",
                "shipping_address": {
                    "fullName": "Priya Patel",
                    "email": "priya.patel@example.com",
                    "phone": "+91 98765 43210",
                    "address": "402 Lavender Enclave, Linking Road",
                    "city": "Mumbai",
                    "state": "Maharashtra",
                    "pincode": "400050"
                },
                "subtotal": 1798.0,
                "discount_amount": 100.0,
                "shipping_fee": 0.0,
                "total_amount": 1698.0,
                "status": "delivered",
                "payment_status": "paid",
                "payment_method": "razorpay",
                "payment_id": "pay_Rz918237190",
                "provider_order_id": "order_Rz918237190_seed1",
                "provider_payment_id": "pay_Rz918237190",
                "payment_confirmation_sent_at": (now - timedelta(days=14)).isoformat(),
                "carrier_name": "BlueDart",
                "tracking_number": "BD901823184IN",
                "notes": "Delivered in handcrafted gift wrap with satin ribbon.",
                "created_at": (now - timedelta(days=14)).isoformat(),
                "updated_at": (now - timedelta(days=11)).isoformat(),
                "items": [
                    {
                        "id": "item-seed-001",
                        "order_id": "ord-seed-001",
                        "product_id": "p1111111-1111-1111-1111-111111111111",
                        "product_name": "Crochet Tulip Bouquet",
                        "product_image": "/images/tulip_bouquet.jpg",
                        "unit_price": 899.0,
                        "price": 899.0,
                        "quantity": 2,
                        "subtotal": 1798.0,
                        "total": 1798.0
                    }
                ]
            },
            {
                "id": "ord-seed-002",
                "order_number": "ORD-10822",
                "user_id": "customer-user-id-002",
                "customer_name": "Ananya Sharma",
                "customer_email": "ananya.s@example.com",
                "customer_phone": "+91 91234 56789",
                "shipping_address": {
                    "fullName": "Ananya Sharma",
                    "email": "ananya.s@example.com",
                    "phone": "+91 91234 56789",
                    "address": "12 Lotus Lane, Indiranagar",
                    "city": "Bengaluru",
                    "state": "Karnataka",
                    "pincode": "560038"
                },
                "subtotal": 1499.0,
                "discount_amount": 0.0,
                "shipping_fee": 0.0,
                "total_amount": 1499.0,
                "status": "shipped",
                "payment_status": "paid",
                "payment_method": "upi",
                "payment_id": "upi_9812470129",
                "provider_order_id": "order_Rz871290412_seed2",
                "provider_payment_id": "pay_Rz871290412",
                "payment_confirmation_sent_at": (now - timedelta(days=4)).isoformat(),
                "carrier_name": "Delhivery",
                "tracking_number": "DEL872190412",
                "notes": "In transit to Bengaluru fulfillment hub.",
                "created_at": (now - timedelta(days=4)).isoformat(),
                "updated_at": (now - timedelta(days=2)).isoformat(),
                "items": [
                    {
                        "id": "item-seed-002",
                        "order_id": "ord-seed-002",
                        "product_id": "p2222222-2222-2222-2222-222222222222",
                        "product_name": "Crochet Mini Handbag",
                        "product_image": "/images/mini_handbag.jpg",
                        "unit_price": 1499.0,
                        "price": 1499.0,
                        "quantity": 1,
                        "subtotal": 1499.0,
                        "total": 1499.0
                    }
                ]
            },
            {
                "id": "ord-seed-003",
                "order_number": "ORD-10823",
                "user_id": "customer-user-id-001",
                "customer_name": "Pooja Verma",
                "customer_email": "pooja.v@example.com",
                "customer_phone": "+91 99887 76655",
                "shipping_address": {
                    "fullName": "Pooja Verma",
                    "email": "pooja.v@example.com",
                    "phone": "+91 99887 76655",
                    "address": "78 Civil Lines, Near Rose Garden",
                    "city": "Jaipur",
                    "state": "Rajasthan",
                    "pincode": "302006"
                },
                "subtotal": 498.0,
                "discount_amount": 0.0,
                "shipping_fee": 99.0,
                "total_amount": 597.0,
                "status": "processing",
                "payment_status": "paid",
                "payment_method": "cod",
                "payment_id": None,
                "provider_order_id": None,
                "provider_payment_id": None,
                "payment_confirmation_sent_at": (now - timedelta(days=1)).isoformat(),
                "carrier_name": None,
                "tracking_number": None,
                "notes": "Handmade coasters being finished and inspected.",
                "created_at": (now - timedelta(days=1)).isoformat(),
                "updated_at": now.isoformat(),
                "items": [
                    {
                        "id": "item-seed-003",
                        "order_id": "ord-seed-003",
                        "product_id": "p4444444-4444-4444-4444-444444444444",
                        "product_name": "Crochet Flower Coaster Set",
                        "product_image": "/images/flower_coaster.jpg",
                        "unit_price": 249.0,
                        "price": 249.0,
                        "quantity": 2,
                        "subtotal": 498.0,
                        "total": 498.0
                    }
                ]
            },
            {
                "id": "ord-seed-004",
                "order_number": "ORD-10824",
                "user_id": "customer-user-id-003",
                "customer_name": "Meera Joshi",
                "customer_email": "meera.j@example.com",
                "customer_phone": "+91 98112 23344",
                "shipping_address": {
                    "fullName": "Meera Joshi",
                    "email": "meera.j@example.com",
                    "phone": "+91 98112 23344",
                    "address": "15 Green Park Extn",
                    "city": "New Delhi",
                    "state": "Delhi",
                    "pincode": "110016"
                },
                "subtotal": 1299.0,
                "discount_amount": 0.0,
                "shipping_fee": 0.0,
                "total_amount": 1299.0,
                "status": "pending",
                "payment_status": "pending",
                "payment_method": "razorpay",
                "payment_id": None,
                "provider_order_id": "order_Rz_pending_seed4",
                "provider_payment_id": None,
                "payment_confirmation_sent_at": None,
                "carrier_name": None,
                "tracking_number": None,
                "notes": "Customer initiated checkout via Razorpay.",
                "created_at": (now - timedelta(hours=2)).isoformat(),
                "updated_at": (now - timedelta(hours=2)).isoformat(),
                "items": [
                    {
                        "id": "item-seed-004",
                        "order_id": "ord-seed-004",
                        "product_id": "p3333333-3333-3333-3333-333333333333",
                        "product_name": "Crochet Sunflower Pot",
                        "product_image": "/images/sunflower_pot.jpg",
                        "unit_price": 1299.0,
                        "price": 1299.0,
                        "quantity": 1,
                        "subtotal": 1299.0,
                        "total": 1299.0
                    }
                ]
            }
        ]

        for ord_data in seed_orders_data:
            items = ord_data.pop("items")
            self.orders[ord_data["id"]] = ord_data
            self.order_items[ord_data["id"]] = items

# Global store singleton
store = InMemoryStore()
