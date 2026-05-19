# 🔧 Legal Documents Route Fix

## ❌ সমস্যা:

Frontend call করছে:
```
GET /api/v1/admin/legal/documents?page=1&limit=10
```

কিন্তু Backend এ configured ছিল:
```
/api/v1/admin/legal-documents
```

**Result:** Route not found error

---

## ✅ Fix করা হয়েছে:

### **app.ts এ Change:**

**Before:**
```typescript
app.use('/api/v1/admin/legal-documents', adminLegalDocumentRoutes);
```

**After:**
```typescript
app.use('/api/v1/admin/legal', adminLegalDocumentRoutes);
```

---

## 📍 Correct Routes:

### **Base Path:** `/api/v1/admin/legal`

### **1. Get All Documents**
```
GET /api/v1/admin/legal/documents?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "65doc123...",
        "title": "Terms of Service",
        "type": "terms",
        "content": "...",
        "version": "1.0",
        "isActive": true,
        "createdAt": "2024-05-19T10:00:00Z",
        "updatedAt": "2024-05-19T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### **2. Create Document**
```
POST /api/v1/admin/legal/documents
```

**Request Body:**
```json
{
  "title": "Privacy Policy",
  "type": "privacy",
  "content": "This is our privacy policy...",
  "version": "1.0",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Legal document created successfully",
  "data": {
    "document": {
      "id": "65doc456...",
      "title": "Privacy Policy",
      "type": "privacy",
      "content": "This is our privacy policy...",
      "version": "1.0",
      "isActive": true,
      "createdAt": "2024-05-19T10:00:00Z"
    }
  }
}
```

---

### **3. Update Document**
```
PATCH /api/v1/admin/legal/documents/:id
```

**Request Body:**
```json
{
  "title": "Updated Privacy Policy",
  "content": "Updated content...",
  "version": "1.1",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Legal document updated successfully",
  "data": {
    "document": {
      "id": "65doc456...",
      "title": "Updated Privacy Policy",
      "version": "1.1",
      "updatedAt": "2024-05-19T11:00:00Z"
    }
  }
}
```

---

### **4. Delete Document**
```
DELETE /api/v1/admin/legal/documents/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Legal document deleted successfully"
}
```

---

## 🔐 Authentication:

All routes require:
- ✅ Admin authentication
- ✅ Bearer token in header

**Example:**
```bash
GET /api/v1/admin/legal/documents
Headers: {
  "Authorization": "Bearer {{admin_token}}"
}
```

---

## 📋 Document Types:

```typescript
type DocumentType = 
  | 'terms'           // Terms of Service
  | 'privacy'         // Privacy Policy
  | 'refund'          // Refund Policy
  | 'cookie'          // Cookie Policy
  | 'disclaimer'      // Disclaimer
  | 'other';          // Other legal documents
```

---

## 🧪 Testing:

### **Test 1: Get Documents**
```bash
curl "http://localhost:5000/api/v1/admin/legal/documents?page=1&limit=10" \
  -H "Authorization: Bearer {{admin_token}}"
```

### **Test 2: Create Document**
```bash
curl -X POST http://localhost:5000/api/v1/admin/legal/documents \
  -H "Authorization: Bearer {{admin_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Terms of Service",
    "type": "terms",
    "content": "Our terms...",
    "version": "1.0",
    "isActive": true
  }'
```

### **Test 3: Update Document**
```bash
curl -X PATCH http://localhost:5000/api/v1/admin/legal/documents/{{documentId}} \
  -H "Authorization: Bearer {{admin_token}}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Terms",
    "version": "1.1"
  }'
```

### **Test 4: Delete Document**
```bash
curl -X DELETE http://localhost:5000/api/v1/admin/legal/documents/{{documentId}} \
  -H "Authorization: Bearer {{admin_token}}"
```

---

## 📊 Route Summary:

| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| GET | `/api/v1/admin/legal/documents` | Get all documents | Admin |
| POST | `/api/v1/admin/legal/documents` | Create document | Admin |
| PATCH | `/api/v1/admin/legal/documents/:id` | Update document | Admin |
| DELETE | `/api/v1/admin/legal/documents/:id` | Delete document | Admin |

---

## ✅ Status:

- ✅ Route path fixed
- ✅ Server restarted
- ✅ Route working (returns auth error as expected)
- ✅ Frontend can now access the API

---

## 🎯 Frontend Update (if needed):

যদি frontend এ hardcoded URL থাকে, তাহলে check করো:

**Correct URL:**
```javascript
const response = await fetch(
  'http://localhost:5000/api/v1/admin/legal/documents?page=1&limit=10',
  {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  }
);
```

---

**Route এখন কাজ করবে!** ✅

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Fixed*
