# 💬 Admin ↔ Customer Chat System - Complete Guide

## ✅ হ্যাঁ! Admin to Customer Chat আছে!

---

## 🎯 Admin Dashboard এর জন্য Chat Routes:

### **1. Get All Customer Conversations (Admin Inbox)**
```
GET /api/v1/chat/admin/customer-conversations
```

**Description:** Admin এর সব customer conversations দেখায়

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}"
}
```

**Query Parameters:**
- `limit` (optional): Number of conversations (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "6a0c0a133f...",
        "customer": {
          "id": "65customer123...",
          "email": "customer@example.com",
          "role": "CUSTOMER",
          "profile": {
            "fullName": "John Doe",
            "profilePicture": "https://..."
          }
        },
        "lastMessage": {
          "content": "I need help with my order",
          "createdAt": "2024-05-19T10:30:00Z"
        },
        "unreadCount": 2,
        "status": "ACTIVE",
        "createdAt": "2024-05-19T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "hasMore": true
    }
  }
}
```

---

### **2. Get All Customers List**
```
GET /api/v1/chat/admin/customers
```

**Description:** সব customers এর list (নতুন conversation start করার জন্য)

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}"
}
```

**Query Parameters:**
- `search` (optional): Search by name or email
- `limit` (optional): Number of results (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "65customer123...",
        "email": "customer@example.com",
        "fullName": "John Doe",
        "profilePicture": "https://...",
        "hasExistingConversation": true,
        "conversationId": "6a0c0a133f..."
      },
      {
        "id": "65customer456...",
        "email": "jane@example.com",
        "fullName": "Jane Smith",
        "profilePicture": "https://...",
        "hasExistingConversation": false,
        "conversationId": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "hasMore": true
    }
  }
}
```

---

### **3. Start Conversation with Customer**
```
POST /api/v1/chat/admin/start-conversation
```

**Description:** Admin একটা customer এর সাথে conversation start করে (অথবা existing conversation open করে)

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
  "customerId": "65customer123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "6a0c0a133f...",
    "customerId": "65customer123...",
    "adminId": "65admin123...",
    "status": "ACTIVE",
    "customer": {
      "id": "65customer123...",
      "email": "customer@example.com",
      "role": "CUSTOMER",
      "profile": {
        "fullName": "John Doe",
        "profilePicture": "https://..."
      }
    },
    "admin": {
      "id": "65admin123...",
      "email": "admin@example.com",
      "role": "ADMIN",
      "profile": {
        "fullName": "Admin User",
        "profilePicture": "https://..."
      }
    },
    "messages": [],
    "_count": {
      "messages": 0
    },
    "unreadCount": 0,
    "createdAt": "2024-05-19T10:00:00Z"
  }
}
```

---

### **4. Get Conversation Messages**
```
GET /api/v1/chat/conversations/:conversationId/messages
```

**Description:** একটা conversation এর সব messages

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}"
}
```

**Query Parameters:**
- `limit` (optional): Messages per page (default: 20)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "65msg123...",
        "conversationId": "6a0c0a133f...",
        "senderId": "65customer123...",
        "type": "TEXT",
        "content": "I need help with my order",
        "attachmentUrl": null,
        "isRead": true,
        "createdAt": "2024-05-19T10:30:00Z",
        "sender": {
          "id": "65customer123...",
          "email": "customer@example.com",
          "role": "CUSTOMER",
          "profile": {
            "fullName": "John Doe",
            "profilePicture": "https://..."
          }
        }
      }
    ],
    "cursor": null,
    "hasMore": false
  }
}
```

---

### **5. Send Message to Customer**
```
POST /api/v1/chat/message/admin-to-customer
```

**Description:** Admin customer কে message পাঠায়

**Headers:**
```json
{
  "Authorization": "Bearer {{admin_token}}",
  "Content-Type": "application/json"
}
```

**Request Body (Text Only):**
```json
{
  "receiverId": "65customer123...",
  "text": "Hello! How can I help you today?"
}
```

**Request Body (With Image - Form Data):**
```
receiverId: 65customer123...
text: Please check this image
image: [file upload]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "65msg456...",
    "status": "pending",
    "imageUrl": "https://cloudinary.com/...",
    "text": "Hello! How can I help you today?",
    "createdAt": "2024-05-19T10:35:00Z"
  }
}
```

---

### **6. Mark Conversation as Read**
```
PATCH /api/v1/chat/conversations/:conversationId/read
```

**Description:** Conversation এর সব messages read mark করে

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
  "message": "Marked as read"
}
```

---

## 🔧 403 Forbidden Error Fix:

### **Error:**
```
GET /api/v1/chat/conversations/6a0c0a133f...
Status: 403 Forbidden
```

### **কারণ:**

1. ❌ Admin একটা conversation access করছে যেটা তার নয়
2. ❌ Conversation টা Customer ↔ Provider এর (Admin এর না)
3. ❌ Wrong conversation ID

### **Solution:**

#### **Option 1: Use Admin Customer Conversations API**
```
GET /api/v1/chat/admin/customer-conversations
```

এটা শুধু admin এর customer conversations দেখাবে।

#### **Option 2: Check Conversation Participants**

Admin শুধু সেই conversations access করতে পারবে যেখানে:
- ✅ Admin participant হিসেবে আছে
- ✅ Other participant হলো Customer (not Provider)

---

## 🎯 Admin Dashboard Implementation:

### **Step 1: Get Customer Conversations**
```javascript
const getCustomerChats = async () => {
  const response = await fetch(
    `${baseUrl}/api/v1/chat/admin/customer-conversations?page=1&limit=20`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  return data.data.conversations;
};
```

---

### **Step 2: Start New Conversation**
```javascript
const startChatWithCustomer = async (customerId) => {
  const response = await fetch(
    `${baseUrl}/api/v1/chat/admin/start-conversation`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ customerId })
    }
  );
  
  const data = await response.json();
  return data.data; // Returns conversation object
};
```

---

### **Step 3: Get Messages**
```javascript
const getMessages = async (conversationId) => {
  const response = await fetch(
    `${baseUrl}/api/v1/chat/conversations/${conversationId}/messages?page=1&limit=50`,
    {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    }
  );
  
  const data = await response.json();
  return data.data.messages;
};
```

---

### **Step 4: Send Message**
```javascript
const sendMessage = async (receiverId, text) => {
  const response = await fetch(
    `${baseUrl}/api/v1/chat/message/admin-to-customer`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiverId,
        text
      })
    }
  );
  
  const data = await response.json();
  return data.data;
};
```

---

## 📋 Complete Admin Chat Flow:

```
1. Admin Dashboard loads
   ↓
2. GET /api/v1/chat/admin/customer-conversations
   → Shows list of customer chats
   ↓
3. Admin clicks on a customer
   ↓
4. GET /api/v1/chat/conversations/:conversationId/messages
   → Shows chat history
   ↓
5. Admin types message
   ↓
6. POST /api/v1/chat/message/admin-to-customer
   → Sends message
   ↓
7. Customer receives notification
   ↓
8. Customer replies
   ↓
9. Admin sees new message (via Socket.IO or polling)
```

---

## 🧪 Postman Testing:

### **Test 1: Get Customer Conversations**
```
GET {{baseUrl}}/api/v1/chat/admin/customer-conversations
Authorization: Bearer {{admin_token}}

Expected: List of customer conversations
```

### **Test 2: Get Customers List**
```
GET {{baseUrl}}/api/v1/chat/admin/customers?search=john
Authorization: Bearer {{admin_token}}

Expected: List of customers matching "john"
```

### **Test 3: Start Conversation**
```
POST {{baseUrl}}/api/v1/chat/admin/start-conversation
Authorization: Bearer {{admin_token}}
Body: {
  "customerId": "65customer123..."
}

Expected: Conversation object
```

### **Test 4: Send Message**
```
POST {{baseUrl}}/api/v1/chat/message/admin-to-customer
Authorization: Bearer {{admin_token}}
Body: {
  "receiverId": "65customer123...",
  "text": "Hello! How can I help you?"
}

Expected: Message sent successfully
```

---

## ⚠️ Important Notes:

### **1. Admin Can Only Access:**
- ✅ Admin ↔ Customer conversations
- ✅ Admin ↔ Provider conversations
- ❌ Customer ↔ Provider conversations (403 Forbidden)

### **2. Conversation ID:**
- Use conversation IDs from `/admin/customer-conversations` API
- Don't use random conversation IDs
- Check if admin is participant before accessing

### **3. Real-time Updates:**
- Use Socket.IO for real-time messages
- Or implement polling every 5-10 seconds
- Mark messages as read when viewed

---

## ✅ Summary:

| Feature | API Endpoint | Status |
|---------|--------------|--------|
| Get Customer Chats | `/chat/admin/customer-conversations` | ✅ Working |
| Get Customers List | `/chat/admin/customers` | ✅ Working |
| Start Conversation | `/chat/admin/start-conversation` | ✅ Working |
| Get Messages | `/chat/conversations/:id/messages` | ✅ Working |
| Send Message | `/chat/message/admin-to-customer` | ✅ Working |
| Mark as Read | `/chat/conversations/:id/read` | ✅ Working |

---

**Admin to Customer chat system সম্পূর্ণ আছে এবং কাজ করছে!** 💬✅

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Complete*
