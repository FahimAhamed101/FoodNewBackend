# 🔧 Support Ticket Endpoint Fix

## ❌ তোমার Error:

```
Route /api/v1/api/v1/support/admin/tickets not found
```

**সমস্যা:** `/api/v1` দুইবার আছে!

---

## 🎯 কারণ:

### **Postman Variable:**
```
{{baseUrl}} = http://localhost:5000/api/v1
```

### **তুমি লিখেছো:**
```
{{baseUrl}}/api/v1/support/admin/tickets
```

### **Final URL হয়েছে:**
```
http://localhost:5000/api/v1/api/v1/support/admin/tickets ❌
```

---

## ✅ সঠিক Endpoint:

### **Backend Route Configuration:**
```typescript
// app.ts
app.use('/api/v1/support-tickets', supportTicketRoutes);

// supportTicket.routes.ts
router.get('/admin/tickets', supportTicketController.getAdminTickets);
```

### **Complete URL:**
```
GET /api/v1/support-tickets/admin/tickets
```

---

## 🔧 Postman Fix:

### **Option 1: Change URL (Recommended)**

**Before:**
```
{{baseUrl}}/api/v1/support/admin/tickets ❌
```

**After:**
```
{{baseUrl}}/support-tickets/admin/tickets ✅
```

---

### **Option 2: Change baseUrl Variable**

**If you want to use `/support/admin/tickets`:**

Change `baseUrl` to:
```
{{baseUrl}} = http://localhost:5000
```

Then use:
```
{{baseUrl}}/api/v1/support-tickets/admin/tickets
```

---

## 📍 All Support Ticket Routes:

### **Base Path:** `/api/v1/support-tickets`

### **1. Create Ticket (User)**
```
POST /api/v1/support-tickets/tickets
```

**Request Body:**
```json
{
  "subject": "Payment Issue",
  "description": "I cannot complete my payment",
  "priority": "High",
  "category": "payment"
}
```

---

### **2. Get My Tickets (User)**
```
GET /api/v1/support-tickets/my-tickets
```

**Query Parameters:**
- `status` (optional): Open, In Progress, Resolved, Closed
- `priority` (optional): Low, Medium, High, Urgent

---

### **3. Get Single Ticket (User)**
```
GET /api/v1/support-tickets/tickets/:id
```

---

### **4. Get All Tickets (Admin)** ⭐
```
GET /api/v1/support-tickets/admin/tickets
```

**Query Parameters:**
- `status` (optional): Open, In Progress, Resolved, Closed
- `priority` (optional): Low, Medium, High, Urgent
- `page` (optional): Page number
- `limit` (optional): Items per page

**Postman URL:**
```
{{baseUrl}}/support-tickets/admin/tickets?status=Open&priority=Medium
```

---

### **5. Update Ticket (Admin)**
```
PATCH /api/v1/support-tickets/admin/tickets/:id
```

**Request Body:**
```json
{
  "status": "In Progress",
  "priority": "High",
  "adminNotes": "Working on this issue"
}
```

---

## 🧪 Postman Collection Fix:

### **Update Your Request:**

1. Open Postman
2. Go to "Admin - Get All Tickets" request
3. Change URL from:
   ```
   {{baseUrl}}/api/v1/support/admin/tickets
   ```
   To:
   ```
   {{baseUrl}}/support-tickets/admin/tickets
   ```
4. Save
5. Test again ✅

---

## 📋 Complete Postman URLs:

```
# User Routes
POST   {{baseUrl}}/support-tickets/tickets
GET    {{baseUrl}}/support-tickets/my-tickets
GET    {{baseUrl}}/support-tickets/tickets/:id

# Admin Routes
GET    {{baseUrl}}/support-tickets/admin/tickets
PATCH  {{baseUrl}}/support-tickets/admin/tickets/:id
```

---

## ✅ Correct Request Example:

```bash
GET http://localhost:5000/api/v1/support-tickets/admin/tickets?status=Open&priority=Medium

Headers:
{
  "Authorization": "Bearer {{admin_token}}"
}

Response:
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "65ticket123...",
        "subject": "Payment Issue",
        "description": "Cannot complete payment",
        "status": "Open",
        "priority": "Medium",
        "category": "payment",
        "userId": "65user123...",
        "createdAt": "2024-05-19T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    }
  }
}
```

---

## 🎯 Summary:

| Wrong URL | Correct URL |
|-----------|-------------|
| `{{baseUrl}}/api/v1/support/admin/tickets` ❌ | `{{baseUrl}}/support-tickets/admin/tickets` ✅ |
| `{{baseUrl}}/api/v1/support/my-tickets` ❌ | `{{baseUrl}}/support-tickets/my-tickets` ✅ |
| `{{baseUrl}}/api/v1/support/tickets` ❌ | `{{baseUrl}}/support-tickets/tickets` ✅ |

---

**Postman এ URL change করো - কাজ করবে!** ✅

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Fixed*
