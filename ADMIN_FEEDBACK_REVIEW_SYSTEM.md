# ⭐ Admin Feedback/Review System - Complete Guide

## ✅ Review/Feedback System আছে!

---

## 📍 Admin Feedback/Review Routes:

### **Base URLs:**
```
/api/v1/reviews          (Original)
/api/v1/admin/feedback   (Alias for admin dashboard)
```

Both work the same!

---

## 🎯 Admin Routes:

### **1. Get All Reviews (Admin)**
```
GET /api/v1/admin/feedback/all
GET /api/v1/reviews/all
```

**Description:** Admin সব reviews দেখতে পারবে

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}"
}
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `rating` (optional): Filter by rating (1-5)
- `providerId` (optional): Filter by provider
- `customerId` (optional): Filter by customer
- `sortBy` (optional): Sort field (createdAt, rating)
- `sortOrder` (optional): asc or desc

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "65review123...",
        "rating": 5,
        "comment": "Excellent food and service!",
        "customerId": "65customer123...",
        "providerId": "65provider123...",
        "orderId": "65order123...",
        "customerName": "John Doe",
        "providerName": "Pizza Palace",
        "reply": null,
        "createdAt": "2024-05-19T10:00:00Z",
        "updatedAt": "2024-05-19T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    },
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 150,
      "ratingDistribution": {
        "5": 80,
        "4": 40,
        "3": 20,
        "2": 7,
        "1": 3
      }
    }
  }
}
```

---

### **2. Get Provider Reviews**
```
GET /api/v1/admin/feedback/provider/:providerId
GET /api/v1/reviews/provider/:providerId
```

**Description:** Specific provider এর সব reviews

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `rating` (optional): Filter by rating

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {...},
    "stats": {
      "averageRating": 4.7,
      "totalReviews": 45,
      "ratingDistribution": {
        "5": 30,
        "4": 10,
        "3": 3,
        "2": 1,
        "1": 1
      }
    }
  }
}
```

---

### **3. Get Provider Rating Stats**
```
GET /api/v1/admin/feedback/stats/:providerId
GET /api/v1/reviews/stats/:providerId
```

**Description:** Provider এর rating statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "averageRating": 4.7,
    "totalReviews": 45,
    "ratingDistribution": {
      "5": 30,
      "4": 10,
      "3": 3,
      "2": 1,
      "1": 1
    },
    "recentReviews": [
      {
        "id": "65review123...",
        "rating": 5,
        "comment": "Great!",
        "customerName": "John Doe",
        "createdAt": "2024-05-19T10:00:00Z"
      }
    ]
  }
}
```

---

### **4. Get Single Review**
```
GET /api/v1/admin/feedback/:reviewId
GET /api/v1/reviews/:reviewId
```

**Description:** Specific review এর details

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "65review123...",
      "rating": 5,
      "comment": "Excellent food and service!",
      "customerId": "65customer123...",
      "providerId": "65provider123...",
      "orderId": "65order123...",
      "customer": {
        "id": "65customer123...",
        "name": "John Doe",
        "email": "john@example.com",
        "profilePicture": "https://..."
      },
      "provider": {
        "id": "65provider123...",
        "name": "Pizza Palace",
        "email": "pizza@example.com"
      },
      "order": {
        "id": "65order123...",
        "totalAmount": 25.99,
        "createdAt": "2024-05-19T09:00:00Z"
      },
      "reply": {
        "text": "Thank you for your feedback!",
        "repliedBy": "65provider123...",
        "repliedAt": "2024-05-19T11:00:00Z"
      },
      "createdAt": "2024-05-19T10:00:00Z",
      "updatedAt": "2024-05-19T11:00:00Z"
    }
  }
}
```

---

### **5. Delete Review (Admin)**
```
DELETE /api/v1/admin/feedback/:reviewId
DELETE /api/v1/reviews/:reviewId
```

**Description:** Admin inappropriate review delete করতে পারবে

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### **6. Reply to Review (Admin)**
```
POST /api/v1/admin/feedback/:reviewId/reply
POST /api/v1/reviews/:reviewId/reply
```

**Description:** Admin review এ reply করতে পারবে

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "replyText": "Thank you for your feedback! We appreciate your support."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "review": {
      "id": "65review123...",
      "reply": {
        "text": "Thank you for your feedback!",
        "repliedBy": "65admin123...",
        "repliedAt": "2024-05-19T11:00:00Z"
      }
    }
  }
}
```

---

## 🎯 Frontend Implementation:

### **Get All Reviews for Admin Dashboard:**
```javascript
const getAllReviews = async (filters = {}) => {
  const { page = 1, limit = 20, rating, providerId } = filters;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(rating && { rating: rating.toString() }),
    ...(providerId && { providerId })
  });
  
  const response = await fetch(
    `${baseUrl}/api/v1/admin/feedback/all?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  return data.data;
};
```

---

### **Get Provider Reviews:**
```javascript
const getProviderReviews = async (providerId, page = 1) => {
  const response = await fetch(
    `${baseUrl}/api/v1/admin/feedback/provider/${providerId}?page=${page}&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  return data.data;
};
```

---

### **Delete Review:**
```javascript
const deleteReview = async (reviewId) => {
  const response = await fetch(
    `${baseUrl}/api/v1/admin/feedback/${reviewId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  return data;
};
```

---

### **Reply to Review:**
```javascript
const replyToReview = async (reviewId, replyText) => {
  const response = await fetch(
    `${baseUrl}/api/v1/admin/feedback/${reviewId}/reply`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ replyText })
    }
  );
  
  const data = await response.json();
  return data;
};
```

---

## 📊 Admin Dashboard Features:

### **1. Reviews Overview:**
```
- Total Reviews: 150
- Average Rating: 4.5 ⭐
- 5 Star: 80 (53%)
- 4 Star: 40 (27%)
- 3 Star: 20 (13%)
- 2 Star: 7 (5%)
- 1 Star: 3 (2%)
```

### **2. Recent Reviews:**
```
- Show last 10 reviews
- Filter by rating
- Filter by provider
- Search by customer name
```

### **3. Provider Performance:**
```
- Top rated providers
- Providers with low ratings
- Providers needing attention
```

### **4. Review Management:**
```
- View all reviews
- Delete inappropriate reviews
- Reply to reviews on behalf of provider
- Flag reviews for moderation
```

---

## 🧪 Postman Testing:

### **Test 1: Get All Reviews**
```
GET {{baseUrl}}/api/v1/admin/feedback/all?page=1&limit=10
Authorization: Bearer {{admin_token}}

Expected: List of all reviews
```

### **Test 2: Get Provider Reviews**
```
GET {{baseUrl}}/api/v1/admin/feedback/provider/{{providerId}}?page=1&limit=10
Authorization: Bearer {{admin_token}}

Expected: Provider's reviews
```

### **Test 3: Get Rating Stats**
```
GET {{baseUrl}}/api/v1/admin/feedback/stats/{{providerId}}
Authorization: Bearer {{admin_token}}

Expected: Rating statistics
```

### **Test 4: Delete Review**
```
DELETE {{baseUrl}}/api/v1/admin/feedback/{{reviewId}}
Authorization: Bearer {{admin_token}}

Expected: Review deleted
```

### **Test 5: Reply to Review**
```
POST {{baseUrl}}/api/v1/admin/feedback/{{reviewId}}/reply
Authorization: Bearer {{admin_token}}
Body: {
  "replyText": "Thank you for your feedback!"
}

Expected: Reply added
```

---

## 📋 Complete Route Summary:

| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| GET | `/admin/feedback/all` | Get all reviews | Admin |
| GET | `/admin/feedback/provider/:id` | Get provider reviews | Public |
| GET | `/admin/feedback/stats/:id` | Get rating stats | Public |
| GET | `/admin/feedback/:id` | Get single review | Auth |
| DELETE | `/admin/feedback/:id` | Delete review | Admin/Customer |
| POST | `/admin/feedback/:id/reply` | Reply to review | Admin/Provider |

---

## ⚠️ Important Notes:

### **1. Rating System:**
- Rating: 1-5 stars
- Comment: Optional text
- Reply: Provider/Admin can reply once

### **2. Permissions:**
- Customer: Can create, update, delete own reviews
- Provider: Can reply to reviews
- Admin: Can view all, delete any, reply to any

### **3. Review Validation:**
- Customer must have completed order
- One review per order
- Rating required (1-5)
- Comment optional

---

## ✅ Summary:

| Feature | Status |
|---------|--------|
| Get All Reviews | ✅ Working |
| Get Provider Reviews | ✅ Working |
| Get Rating Stats | ✅ Working |
| Delete Review | ✅ Working |
| Reply to Review | ✅ Working |
| Filter by Rating | ✅ Working |
| Pagination | ✅ Working |

---

**Admin Feedback/Review system সম্পূর্ণ আছে এবং কাজ করছে!** ⭐✅

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Complete*
