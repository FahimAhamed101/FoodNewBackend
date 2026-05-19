# 🔧 Admin Customer Chat — Bug Fix

## ❌ Error যেটা ছিল:

```
Cast to ObjectId failed for value "{ '$in': [...] }" at path "participants"
```

**Endpoint:** `GET /api/v1/chat/admin/customers`

---

## 🐛 Problem:

`getCustomersForChat()` function এ MongoDB query ভুল ছিল:

```typescript
// ❌ WRONG — $all এর ভেতরে $in দেওয়া যায় না
const existingRooms = await ChatRoom.find({
    participants: { $all: [adminObjectId, { $in: customerIds }] }
}).select('participants').lean();
```

MongoDB `$all` operator এর ভেতরে `$in` operator support করে না।

---

## ✅ Solution:

Query simplify করা হয়েছে:

```typescript
// ✅ CORRECT — শুধু admin যেসব room এ আছে সেগুলো fetch করো
const existingRooms = await ChatRoom.find({
    participants: adminObjectId
}).select('participants').lean();
```

**Logic:**
1. Admin যেসব room এ participant আছে সব rooms fetch করো
2. Loop করে check করো কোন customers এর সাথে conversation আছে
3. `hasExistingConversation` flag set করো

---

## 🧪 Test করো:

### Postman:
```http
GET {{baseUrl}}/chat/admin/customers?search=&page=1&limit=20
Authorization: Bearer <ADMIN_TOKEN>
```

### Expected Response:
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "customer_id",
        "fullName": "Customer Name",
        "email": "customer@example.com",
        "profilePicture": "url_or_null",
        "hasExistingConversation": true,
        "createdAt": "2026-01-15T08:00:00Z"
      }
    ],
    "total": 20,
    "page": 1,
    "limit": 20,
    "hasMore": false
  }
}
```

---

## 📝 Changes Made:

**File:** `src/controllers/chat.controller.ts`

**Function:** `getCustomersForChat()`

**Lines changed:**
```diff
- const existingRooms = await ChatRoom.find({
-     participants: { $all: [adminObjectId, { $in: customerIds }] }
- }).select('participants').lean();

+ const existingRooms = await ChatRoom.find({
+     participants: adminObjectId
+ }).select('participants').lean();
```

**Also removed duplicate variable:**
```diff
- const customerIds2 = customers.map((c: any) => new Types.ObjectId(c._id));
- const profiles = await Profile.find({ userId: { $in: customerIds2 } })

+ const profiles = await Profile.find({ userId: { $in: customerIds } })
```

---

## ✅ Fixed!

এখন endpoint ঠিকমতো কাজ করবে। Admin সব customers list দেখতে পারবে এবং search করতে পারবে। 🚀
