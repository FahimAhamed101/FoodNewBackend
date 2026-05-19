# 📦 Postman Admin Feedback Collection - Setup Guide

## 📍 File Location:
```
postmanfile/postman_admin_feedback_complete.json
```

---

## 🚀 Import করো:

### **Step 1: Open Postman**

### **Step 2: Import Collection**
1. Click **Import** button (top left)
2. Select **File** tab
3. Choose `postmanfile/postman_admin_feedback_complete.json`
4. Click **Import**

---

## ⚙️ Environment Variables Setup:

### **Variables:**
```json
{
  "baseUrl": "http://localhost:5000",
  "admin_token": "YOUR_ADMIN_TOKEN_HERE",
  "providerId": "PROVIDER_ID_HERE",
  "reviewId": "REVIEW_ID_HERE",
  "foodId": "FOOD_ID_HERE"
}
```

### **How to Set:**
1. Click **Environments** (left sidebar)
2. Create **New Environment** → Name: "Admin Feedback"
3. Add variables:
   - `baseUrl`: `http://localhost:5000`
   - `admin_token`: Your admin JWT token
   - `providerId`: A provider ID from database
   - `reviewId`: A review ID from database
   - `foodId`: A food ID from database
4. Click **Save**
5. Select environment from dropdown (top right)

---

## 📋 Collection Structure:

```
Admin Feedback/Review System
├── 1. Get All Reviews (Admin)
├── 2. Get Provider Reviews
├── 3. Get Provider Rating Stats
├── 4. Get Single Review Details
├── 5. Reply to Review (Admin)
├── 6. Delete Review (Admin)
├── 7. Get Reviews by Rating
├── 8. Get Recent Reviews
├── 9. Get Food Reviews
└── 10. Get Provider Reviews (Public)
```

---

## 🧪 Testing Flow:

### **Test 1: Get All Reviews**
```
Request: 1. Get All Reviews (Admin)
Expected: List of all reviews with pagination
Status: 200 OK
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    },
    "stats": {
      "averageRating": 4.5,
      "totalReviews": 150
    }
  }
}
```

---

### **Test 2: Get Provider Reviews**
```
Request: 2. Get Provider Reviews
Variables: Set {{providerId}}
Expected: Reviews for specific provider
Status: 200 OK
```

---

### **Test 3: Get Rating Stats**
```
Request: 3. Get Provider Rating Stats
Variables: Set {{providerId}}
Expected: Rating statistics
Status: 200 OK
```

**Response Example:**
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
    }
  }
}
```

---

### **Test 4: Reply to Review**
```
Request: 5. Reply to Review (Admin)
Variables: Set {{reviewId}}
Body: {
  "replyText": "Thank you for your feedback!"
}
Expected: Reply added successfully
Status: 200 OK
```

---

### **Test 5: Delete Review**
```
Request: 6. Delete Review (Admin)
Variables: Set {{reviewId}}
Expected: Review deleted
Status: 200 OK
```

---

## 🎯 Common Use Cases:

### **Use Case 1: Find Low-Rated Reviews**
```
Request: 7. Get Reviews by Rating
Query: ?rating=1&page=1&limit=20
Purpose: Find 1-star reviews that need attention
```

### **Use Case 2: Monitor Recent Feedback**
```
Request: 8. Get Recent Reviews
Query: ?sortBy=createdAt&sortOrder=desc&limit=10
Purpose: See latest customer feedback
```

### **Use Case 3: Provider Performance**
```
Request: 2. Get Provider Reviews
Request: 3. Get Provider Rating Stats
Purpose: Evaluate provider performance
```

### **Use Case 4: Moderate Reviews**
```
Request: 4. Get Single Review Details
Request: 6. Delete Review (if inappropriate)
Purpose: Content moderation
```

---

## 📊 Query Parameters Guide:

### **Pagination:**
```
?page=1&limit=20
```

### **Filter by Rating:**
```
?rating=5          // 5-star reviews
?rating=1          // 1-star reviews
```

### **Filter by Provider:**
```
?providerId=65abc123...
```

### **Sorting:**
```
?sortBy=createdAt&sortOrder=desc    // Newest first
?sortBy=rating&sortOrder=asc        // Lowest rating first
```

### **Combined Filters:**
```
?rating=1&providerId=65abc123...&page=1&limit=10
```

---

## 🔐 Authentication:

### **Admin Token Required:**
```
Authorization: Bearer {{admin_token}}
```

### **Get Admin Token:**
1. Login as admin
2. Copy JWT token from response
3. Set in Postman environment variable

---

## ⚠️ Common Errors:

### **Error 1: 401 Unauthorized**
```json
{
  "success": false,
  "errorCode": "AUTH_ERROR",
  "message": "You are not logged in!"
}
```
**Solution:** Set valid `admin_token` in environment

---

### **Error 2: 403 Forbidden**
```json
{
  "success": false,
  "errorCode": "ROLE_ERROR",
  "message": "You do not have permission"
}
```
**Solution:** Ensure token is for ADMIN role

---

### **Error 3: 404 Not Found**
```json
{
  "success": false,
  "errorCode": "NOT_FOUND",
  "message": "Review not found"
}
```
**Solution:** Check `reviewId` is valid

---

## 🎨 Response Format:

### **Success Response:**
```json
{
  "success": true,
  "message": "...",
  "data": {
    // Response data
  }
}
```

### **Error Response:**
```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "Error message",
  "status": "fail"
}
```

---

## 📝 Testing Checklist:

- [ ] Import collection
- [ ] Set environment variables
- [ ] Get admin token
- [ ] Test: Get all reviews
- [ ] Test: Get provider reviews
- [ ] Test: Get rating stats
- [ ] Test: Reply to review
- [ ] Test: Delete review
- [ ] Test: Filter by rating
- [ ] Test: Sort by date

---

## 🚀 Quick Start Commands:

### **1. Get All Reviews:**
```
GET {{baseUrl}}/api/v1/admin/feedback/all?page=1&limit=20
```

### **2. Get Provider Stats:**
```
GET {{baseUrl}}/api/v1/admin/feedback/stats/{{providerId}}
```

### **3. Reply to Review:**
```
POST {{baseUrl}}/api/v1/admin/feedback/{{reviewId}}/reply
Body: { "replyText": "Thank you!" }
```

### **4. Delete Review:**
```
DELETE {{baseUrl}}/api/v1/admin/feedback/{{reviewId}}
```

---

## ✅ Summary:

| Request | Method | Auth | Purpose |
|---------|--------|------|---------|
| Get All Reviews | GET | Admin | View all reviews |
| Get Provider Reviews | GET | Admin | Provider-specific |
| Get Rating Stats | GET | Admin | Statistics |
| Get Single Review | GET | Admin | Details |
| Reply to Review | POST | Admin | Add reply |
| Delete Review | DELETE | Admin | Remove review |
| Filter by Rating | GET | Admin | Find specific ratings |
| Recent Reviews | GET | Admin | Latest feedback |

---

**Postman collection ready to use!** 📦✅

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Complete*
