# API Documentation & cURL Collection

This document contains cURL commands for testing **Admin Provider**, **Admin Category**, **Category & Subcategory Videos**, **Rate Card Images & Videos**, and **Cloudinary Upload** APIs in `quvo-backend`.

> **Note**:
> - Base URL: `http://localhost:8000`
> - `videos` (Category, Subcategory, RateCard) and `images` (RateCard) columns are defined as `Json` in Prisma schema, allowing arrays of URLs or JSON objects to store multiple images and videos.

---

## 1. Category & Subcategory APIs (with `videos` JSON column and Cloudinary uploads)

### **Create Root Category with Icon & Videos JSON**
`POST /admin/categories` or `POST /categories`
```bash
curl -X POST http://localhost:8000/admin/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AC Repair & Services",
    "description": "Air conditioner repair and maintenance",
    "icon": "https://res.cloudinary.com/demo/image/upload/sample.png",
    "videos": [
      "https://res.cloudinary.com/demo/video/upload/ac_demo1.mp4",
      "https://res.cloudinary.com/demo/video/upload/ac_demo2.mp4"
    ],
    "sortOrder": 1
  }'
```

### **Create Subcategory with Videos**
`POST /admin/categories/:parentId/subcategories` or `POST /categories/:parentId/subcategories`
```bash
curl -X POST http://localhost:8000/admin/categories/<PARENT_CATEGORY_ID>/subcategories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Split AC Service",
    "description": "Servicing for split air conditioners",
    "videos": [
      "https://res.cloudinary.com/demo/video/upload/split_ac_guide.mp4"
    ],
    "sortOrder": 1
  }'
```

### **Update Category / Subcategory (Update Videos or Icon)**
`PATCH /admin/categories/:id` or `PATCH /categories/:id`
```bash
curl -X PATCH http://localhost:8000/admin/categories/<CATEGORY_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AC Repair & Deep Service",
    "videos": [
      "https://res.cloudinary.com/demo/video/upload/new_ac_video.mp4"
    ]
  }'
```

---

## 2. Rate Card APIs (with `images` and `videos` JSON columns + `providerId` Relation)

### **Create Rate Card with Images & Videos JSON**
`POST /rate-cards`
```bash
curl -X POST http://localhost:8000/rate-cards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Split AC Service",
    "categoryId": "<CATEGORY_ID>",
    "subcategoryId": "<SUBCATEGORY_ID>",
    "providerId": "<PROVIDER_ID>",
    "price": 499.00,
    "strikePrice": 699.00,
    "images": [
      "https://res.cloudinary.com/demo/image/upload/ratecard_img1.jpg",
      "https://res.cloudinary.com/demo/image/upload/ratecard_img2.jpg"
    ],
    "videos": [
      "https://res.cloudinary.com/demo/video/upload/ratecard_video1.mp4"
    ],
    "weight": 1,
    "recommended": true,
    "bestDeal": false,
    "active": true,
    "serviceType": "b2c"
  }'
```

### **Update Rate Card Images & Videos**
`PATCH /rate-cards/:id`
```bash
curl -X PATCH http://localhost:8000/rate-cards/<RATE_CARD_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "price": 549.00,
    "images": [
      "https://res.cloudinary.com/demo/image/upload/updated_img.jpg"
    ],
    "videos": [
      "https://res.cloudinary.com/demo/video/upload/updated_video.mp4"
    ]
  }'
```

### **Get All Rate Cards (Includes Populated `provider` & `images`/`videos`)**
`GET /rate-cards`
```bash
curl -X GET http://localhost:8000/rate-cards
```

### **Get Rate Cards by Category**
`GET /rate-cards/by-category/:categoryId`
```bash
curl -X GET "http://localhost:8000/rate-cards/by-category/<CATEGORY_ID>?subcategoryId=<SUBCATEGORY_ID>"
```

---

## 3. Admin Provider APIs (`/admin/providers`)

### **Create Provider**
`POST /admin/providers`
```bash
curl -X POST http://localhost:8000/admin/providers \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john.provider@example.com",
    "mobile": "+919876543210",
    "gender": "male",
    "birth_date": "1990-05-15T00:00:00.000Z",
    "address": "123 Main Street, Mumbai",
    "isActive": true
  }'
```

### **Get All Providers**
`GET /admin/providers`
```bash
curl -X GET http://localhost:8000/admin/providers
```

### **Get Single Provider**
`GET /admin/providers/:id`
```bash
curl -X GET http://localhost:8000/admin/providers/<PROVIDER_ID>
```

### **Update Provider**
`PATCH /admin/providers/:id`
```bash
curl -X PATCH http://localhost:8000/admin/providers/<PROVIDER_ID> \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Johnathan Doe",
    "mobile": "+919876543299",
    "address": "456 New Colony, Mumbai"
  }'
```

### **Delete Provider**
`DELETE /admin/providers/:id`
```bash
curl -X DELETE http://localhost:8000/admin/providers/<PROVIDER_ID>
```
