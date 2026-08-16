# API Documentation & cURL Collection

This document contains cURL commands for testing the **Admin Provider**, **Admin Category**, and **Rate Card** APIs in `quvo-backend`.

> **Note**:
> - Replace `http://localhost:8000` with your actual server base URL.
> - Replace `YOUR_ACCESS_TOKEN` with your JWT access token.
> - Replace UUID placeholders (`<PROVIDER_ID>`, `<CATEGORY_ID>`, `<SUBCATEGORY_ID>`, `<RATE_CARD_ID>`) with actual UUIDs returned by the API.

---

## 1. Rate Card APIs (Updated with Provider Relation)

Now when you create or query a RateCard, `providerId` is validated against the `Provider` table, and rate card details return the nested `provider` object:
```json
{
  "category": { "id": "...", "name": "AC Repair", "slug": "ac-repair" },
  "subcategory": { "id": "...", "name": "Split AC", "slug": "split-ac" },
  "provider": { "id": "...", "full_name": "John Doe", "mobile": "+919876543210", "email": "john.provider@example.com" }
}
```

### **Create Rate Card with Provider Relation**
`POST /rate-cards`
```bash
curl -X POST http://localhost:8000/rate-cards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Standard Split AC Service",
    "categoryId": "<CATEGORY_ID>",
    "subcategoryId": "<SUBCATEGORY_ID>",
    "providerId": "<PROVIDER_ID>",
    "price": 499.00,
    "strikePrice": 699.00,
    "weight": 1,
    "recommended": true,
    "bestDeal": false,
    "active": true,
    "serviceType": "b2c"
  }'
```

### **Get All Rate Cards (Filtered by Provider)**
`GET /rate-cards?providerId=`
```bash
curl -X GET "http://localhost:8000/rate-cards?providerId=<PROVIDER_ID>"
```

### **Get Rate Cards by Category & Subcategory (Includes Provider Relation)**
`GET /rate-cards/by-category/:categoryId?subcategoryId=`
```bash
curl -X GET "http://localhost:8000/rate-cards/by-category/<CATEGORY_ID>?subcategoryId=<SUBCATEGORY_ID>"
```

### **Get Single Rate Card (Includes Provider Relation)**
`GET /rate-cards/:id`
```bash
curl -X GET http://localhost:8000/rate-cards/<RATE_CARD_ID>
```

### **Update Rate Card**
`PATCH /rate-cards/:id`
```bash
curl -X PATCH http://localhost:8000/rate-cards/<RATE_CARD_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "providerId": "<PROVIDER_ID>",
    "price": 549.00,
    "strikePrice": 749.00,
    "recommended": true
  }'
```

### **Delete Rate Card**
`DELETE /rate-cards/:id`
```bash
curl -X DELETE http://localhost:8000/rate-cards/<RATE_CARD_ID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 2. Admin Provider APIs (`/admin/providers`)

### **Create Provider**
`POST /admin/providers`
```bash
curl -X POST http://localhost:8000/admin/providers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
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
curl -X GET http://localhost:8000/admin/providers \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Get Single Provider by ID**
`GET /admin/providers/:id`
```bash
curl -X GET http://localhost:8000/admin/providers/<PROVIDER_ID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Update Provider**
`PATCH /admin/providers/:id`
```bash
curl -X PATCH http://localhost:8000/admin/providers/<PROVIDER_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "full_name": "Johnathan Doe",
    "mobile": "+919876543299",
    "address": "456 New Colony, Mumbai"
  }'
```

### **Deactivate Provider (Soft Delete)**
`DELETE /admin/providers/:id`
```bash
curl -X DELETE http://localhost:8000/admin/providers/<PROVIDER_ID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 3. Admin Category APIs (`/admin/categories`)

### **Create Root Category**
`POST /admin/categories`
```bash
curl -X POST http://localhost:8000/admin/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "AC Repair & Services",
    "description": "Air conditioner repair, installation, and uninstallation",
    "icon": "ac-icon.svg",
    "sortOrder": 1
  }'
```

### **Create Subcategory under Parent**
`POST /admin/categories/:parentId/subcategories`
```bash
curl -X POST http://localhost:8000/admin/categories/<PARENT_CATEGORY_ID>/subcategories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Split AC Service",
    "description": "Servicing for split air conditioners",
    "icon": "split-ac-icon.svg",
    "sortOrder": 1
  }'
```

### **Get All Categories**
`GET /admin/categories`
```bash
curl -X GET http://localhost:8000/admin/categories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Get Single Category by ID**
`GET /admin/categories/:id`
```bash
curl -X GET http://localhost:8000/admin/categories/<CATEGORY_ID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Get Subcategories of Parent**
`GET /admin/categories/:id/subcategories`
```bash
curl -X GET http://localhost:8000/admin/categories/<PARENT_CATEGORY_ID>/subcategories \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### **Update Category**
`PATCH /admin/categories/:id`
```bash
curl -X PATCH http://localhost:8000/admin/categories/<CATEGORY_ID> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "AC Repair & Deep Service",
    "sortOrder": 2,
    "isActive": true
  }'
```

### **Deactivate Category (Soft Delete)**
`DELETE /admin/categories/:id`
```bash
curl -X DELETE http://localhost:8000/admin/categories/<CATEGORY_ID> \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```
