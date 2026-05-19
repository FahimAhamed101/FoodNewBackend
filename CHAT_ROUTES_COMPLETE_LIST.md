# 💬 Chat Message Routes - Complete List

## 📍 Base URL: `/api/v1/chat`

---

## 🔐 Authentication Required: All routes need Bearer token

---

## 📋 Route Categories:

### **1. General Conversation Routes** (All Roles)
### **2. Send Message Routes** (Role-specific)
### **3. Admin ↔ Customer Routes** (Admin & Customer only)

---

## 1️⃣ GENERAL CONVERSATION ROUTES

### **1.1 Get All Conversations (Inbox)**
```
GET /api/v1/chat/conversations
```

**Description:** Get all conversations for logged-in user (inbox)

**Query Parameters:**
- `limit` (optional): Number of conversations (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "65abc123...",
        "customerId": "65def456...",
        "providerId": "65ghi789...",
        "adminId": null,
        "status": "ACTIVE",
        "lastMessageAt": "2024-05-19T10:30:00Z",
        "customer": {
          "id": "65def456...",
          "email": "customer@example.com",
          "role": "CUSTOMER",
          "profile": {
            "fullName": "John Doe",
            "profilePicture": "https://...",
            "companyName": null
          }
        },
        "provider": {
          "id": "65ghi789...",
          "email": "provider@example.com",
          "role": "PROVIDER",
          "profile": {
            "fullName": "Pizza Palace",
            "profilePicture": "https://...",
            "companyName": null
          }
        },
        "counterpart": { ... },
        "messages": [],
        "_count": {
          "messages": 15
        },
        "lastMessage": {
          "content": "Hello!",
          "createdAt": "2024-05-19T10:30:00Z"
        },
        "unreadCount": 3
      }
    ],
    "cursor": null,
    "hasMore": false
  }
}
```

---

### **1.2 Get Single Conversation**
```
GET /api/v1/chat/conversations/:conversationId
```

**Description:** Get details of a specific conversation

**Response:** Same format as conversation object above

---

### **1.3 Get Conversation Messages**
```
GET /api/v1/chat/conversations/:conversationId/messages
```

**Description:** Get paginated messages from a conversation

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
        "conversationId": "65abc123...",
        "senderId": "65def456...",
        "type": "TEXT",
        "content": "Hello, how are you?",
        "attachmentUrl": null,
        "isRead": true,
        "readAt": "2024-05-19T10:35:00Z",
        "deletedAt": null,
        "createdAt": "2024-05-19T10:30:00Z",
        "updatedAt": "2024-05-19T10:35:00Z",
        "sender": {
          "id": "65def456...",
          "email": "user@example.com",
          "role": "CUSTOMER",
          "profile": {
            "fullName": "John Doe",
            "profilePicture": "https://..."
          }
        }
      }
    ],
    "cursor": null,
    "hasMore": true
  }
}
```

---

### **1.4 Start Conversation (Customer ↔ Provider)**
```
POST /api/v1/chat/conversations
```

**Description:** Start a new conversation between customer and provider

**Request Body:**
```json
{
  "providerId": "65ghi789..."
}
```

**Response:** Returns conversation object (same as 1.2)

---

### **1.5 Mark Conversation as Read**
```
PATCH /api/v1/chat/conversations/:conversationId/read
```

**Description:** Mark all messages in conversation as read

**Response:**
```json
{
  "success": true,
  "message": "Marked as read"
}
```

---

### **1.6 Archive/Unarchive Conversation**
```
PATCH /api/v1/chat/conversations/:conversationId/archive
```

**Description:** Archive or unarchive a conversation

**Request Body:**
```json
{
  "status": "ARCHIVED"  // or "ACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "65abc123...",
    "status": "ARCHIVED",
    "updatedAt": "2024-05-19T10:40:00Z"
  }
}
```

---

## 2️⃣ SEND MESSAGE ROUTES

### **2.1 Customer → Provider Message**
```
POST /api/v1/chat/message/customer-to-provider
```

**Description:** Send message from customer to provider

**Request Body (Form-data or JSON):**
```json
{
  "receiverId": "65ghi789...",
  "text": "Hello, I have a question"
}
```

**With Image (Form-data):**
```
receiverId: 65ghi789...
text: Check this image
image: [file upload]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "65msg123...",
    "status": "pending",
    "imageUrl": "https://cloudinary.com/...",
    "text": "Hello, I have a question",
    "createdAt": "2024-05-19T10:30:00Z"
  }
}
```

---

### **2.2 Provider → Admin Message**
```
POST /api/v1/chat/message/provider-to-admin
```

**Description:** Send message from provider to admin

**Request Body:**
```json
{
  "receiverId": "65admin123...",  // Optional, auto-resolves if not provided
  "text": "I need help with my account"
}
```

**Note:** If `receiverId` is not provided, system automatically finds the primary admin.

---

### **2.3 Customer → Admin Message**
```
POST /api/v1/chat/message/customer-to-admin
```

**Description:** Send message from customer to admin

**Request Body:**
```json
{
  "receiverId": "65admin123...",  // Optional, auto-resolves if not provided
  "text": "I have a complaint"
}
```

**Note:** If `receiverId` is not provided, system automatically finds the primary admin.

---

### **2.4 Admin → Customer Message**
```
POST /api/v1/chat/message/admin-to-customer
```

**Description:** Send message from admin to customer

**Request Body:**
```json
{
  "receiverId": "65customer123...",
  "text": "How can I help you?"
}
```

---

## 3️⃣ ADMIN ↔ CUSTOMER DEDICATED ROUTES

### **3.1 Admin: Get All Customer Conversations**
```
GET /api/v1/chat/admin/customer-conversations
```

**Description:** Admin sees all conversations with customers (filtered inbox)

**Access:** Admin only

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
        "id": "65abc123...",
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
          "content": "I need help",
          "createdAt": "2024-05-19T10:30:00Z"
        },
        "unreadCount": 2,
        "status": "ACTIVE"
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

### **3.2 Admin: Get All Customers List**
```
GET /api/v1/chat/admin/customers
```

**Description:** Get list of all customers (for starting new conversations)

**Access:** Admin only

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
        "conversationId": "65abc123..."
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

### **3.3 Admin: Start Conversation with Customer**
```
POST /api/v1/chat/admin/start-conversation
```

**Description:** Admin starts or opens existing conversation with a customer

**Access:** Admin only

**Request Body:**
```json
{
  "customerId": "65customer123..."
}
```

**Response:** Returns conversation object

---

### **3.4 Customer: Start Conversation with Admin**
```
POST /api/v1/chat/customer/start-admin-conversation
```

**Description:** Customer starts or opens existing conversation with admin

**Access:** Customer only

**Request Body:** Empty (auto-resolves admin)

**Response:** Returns conversation object

---

## 📊 Complete Route Summary Table

| Method | Route | Description | Access |
|--------|-------|-------------|--------|
| GET | `/api/v1/chat/conversations` | Get all conversations | All |
| POST | `/api/v1/chat/conversations` | Start customer-provider chat | Customer |
| GET | `/api/v1/chat/conversations/:id` | Get single conversation | All |
| GET | `/api/v1/chat/conversations/:id/messages` | Get messages | All |
| PATCH | `/api/v1/chat/conversations/:id/read` | Mark as read | All |
| PATCH | `/api/v1/chat/conversations/:id/archive` | Archive conversation | All |
| POST | `/api/v1/chat/message/customer-to-provider` | Send message | Customer |
| POST | `/api/v1/chat/message/provider-to-admin` | Send message | Provider |
| POST | `/api/v1/chat/message/customer-to-admin` | Send message | Customer |
| POST | `/api/v1/chat/message/admin-to-customer` | Send message | Admin |
| GET | `/api/v1/chat/admin/customer-conversations` | Get customer chats | Admin |
| GET | `/api/v1/chat/admin/customers` | Get customers list | Admin |
| POST | `/api/v1/chat/admin/start-conversation` | Start admin-customer chat | Admin |
| POST | `/api/v1/chat/customer/start-admin-conversation` | Start customer-admin chat | Customer |

---

## 🎯 Message Types

```typescript
type MessageType = 'TEXT' | 'IMAGE' | 'MIXED';

// TEXT: Only text content
// IMAGE: Only image attachment
// MIXED: Both text and image
```

---

## 🔐 Role-Based Access Control

### **Customer Can:**
- ✅ Chat with Providers
- ✅ Chat with Admin
- ❌ Cannot chat with other Customers

### **Provider Can:**
- ✅ Chat with Admin only
- ❌ Cannot chat with Customers directly
- ❌ Cannot chat with other Providers

### **Admin Can:**
- ✅ Chat with Customers
- ✅ Chat with Providers
- ✅ View all conversations

---

## 📝 Request Examples

### **Example 1: Customer sends message to Provider**
```javascript
const response = await fetch('http://localhost:5000/api/v1/chat/message/customer-to-provider', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <customer_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    receiverId: '65provider123...',
    text: 'What are your opening hours?'
  })
});
```

---

### **Example 2: Provider sends message to Admin**
```javascript
const response = await fetch('http://localhost:5000/api/v1/chat/message/provider-to-admin', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <provider_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // receiverId is optional, auto-resolves to admin
    text: 'I need help with payment setup'
  })
});
```

---

### **Example 3: Send message with image**
```javascript
const formData = new FormData();
formData.append('receiverId', '65provider123...');
formData.append('text', 'Check this image');
formData.append('image', imageFile);

const response = await fetch('http://localhost:5000/api/v1/chat/message/customer-to-provider', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <customer_token>'
    // Don't set Content-Type, browser will set it with boundary
  },
  body: formData
});
```

---

### **Example 4: Admin gets all customer conversations**
```javascript
const response = await fetch('http://localhost:5000/api/v1/chat/admin/customer-conversations?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin_token>',
    'Content-Type': 'application/json'
  }
});
```

---

### **Example 5: Customer starts conversation with Admin**
```javascript
const response = await fetch('http://localhost:5000/api/v1/chat/customer/start-admin-conversation', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <customer_token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})  // Empty body, auto-resolves admin
});
```

---

## ⚠️ Important Notes

### **1. Image Upload:**
- Max file size: 5MB
- Supported formats: JPG, PNG, GIF
- Stored in Cloudinary
- Use `multipart/form-data` for image uploads

### **2. Auto-resolve Admin:**
- Provider → Admin: `receiverId` optional
- Customer → Admin: `receiverId` optional
- System finds the primary (oldest) admin automatically

### **3. Provider Restrictions:**
- Providers can ONLY chat with Admin
- Cannot access customer conversations
- All provider messages go to admin

### **4. Pagination:**
- Default limit: 20 items
- Use `page` and `limit` query parameters
- Check `hasMore` in response for more data

### **5. Real-time Updates:**
- Use Socket.IO for real-time message delivery
- Socket events: `new_message`, `message_read`, etc.

---

## 🧪 Testing with Postman

### **Collection Structure:**
```
Chat API
├── 1. General Conversations
│   ├── Get All Conversations
│   ├── Get Single Conversation
│   ├── Get Messages
│   ├── Start Conversation
│   ├── Mark as Read
│   └── Archive Conversation
├── 2. Send Messages
│   ├── Customer → Provider
│   ├── Provider → Admin
│   ├── Customer → Admin
│   └── Admin → Customer
└── 3. Admin-Customer
    ├── Get Customer Conversations
    ├── Get Customers List
    ├── Admin Start Conversation
    └── Customer Start Admin Chat
```

---

## ✅ Summary

**Total Routes: 14**

- ✅ 6 General conversation routes
- ✅ 4 Send message routes
- ✅ 4 Admin-customer dedicated routes

**Features:**
- ✅ Text + Image messaging
- ✅ Role-based access control
- ✅ Auto-resolve admin
- ✅ Pagination support
- ✅ Read receipts
- ✅ Archive conversations
- ✅ Unread count tracking

---

**Chat system ready to use!** 💬🚀

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ সম্পূর্ণ*
