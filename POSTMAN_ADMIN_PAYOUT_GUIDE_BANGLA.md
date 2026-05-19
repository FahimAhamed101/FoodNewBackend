# 📮 Admin Payout System — Postman Testing Guide

## 📁 File Location:
```
postmanfile/postman_admin_payout_complete.json
```

---

## 🚀 Quick Start:

### **Step 1: Import করো**
```
1. Postman খোলো
2. Import → File → Select: postman_admin_payout_complete.json
3. Collection "Admin Payout System - Complete" দেখবে
```

### **Step 2: Variables Setup**
```
Collection Variables (auto-configured):
- baseUrl: http://localhost:5000
- adminToken: (auto-saved after login)
- providerId: (auto-saved after getting pending payouts)
```

### **Step 3: Server চালাও**
```bash
npm run dev
# Server should run on http://localhost:5000
```

---

## 📋 9টা API — Step by Step Testing:

### **1️⃣ Admin Login**
```
POST {{baseUrl}}/api/v1/auth/login

Body:
{
  "email": "admin@example.com",
  "password": "admin123"
}

✅ Success Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "role": "admin"
    }
  }
}

🔄 Auto-saves: adminToken variable
```

**কী হয়:**
- Admin login করে
- Token পায়
- Postman automatically token save করে
- পরের সব request এ এই token use হবে

---

### **2️⃣ Get Pending Payouts (All)**
```
GET {{baseUrl}}/api/v1/admin/payouts/pending
Headers: Authorization: Bearer {{adminToken}}

✅ Success Response:
{
  "success": true,
  "data": {
    "providers": [
      {
        "providerId": "65abc123...",
        "providerName": "Pizza Palace",
        "providerEmail": "pizza@example.com",
        "pendingAmount": 274.50,
        "pendingOrdersCount": 50,
        "stripeConnectedAccountId": null
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    },
    "totalPendingAmount": 1250.75
  }
}

🔄 Auto-saves: providerId (first provider)
```

**কী দেখবে:**
- কোন provider দের কত টাকা দিতে হবে
- Total pending amount
- কতগুলো orders pending
- Stripe account আছে কিনা

---

### **3️⃣ Get Pending Payouts (With Filters)**
```
GET {{baseUrl}}/api/v1/admin/payouts/pending?minAmount=50&page=1&limit=10
Headers: Authorization: Bearer {{adminToken}}

Query Parameters:
- minAmount: 50 (minimum $50 pending)
- page: 1
- limit: 10
```

**Use Case:**
- শুধু যাদের $50+ pending তাদের দেখতে চাও
- Pagination করতে চাও

---

### **4️⃣ Get Provider Payout Details**
```
GET {{baseUrl}}/api/v1/admin/payouts/provider/{{providerId}}
Headers: Authorization: Bearer {{adminToken}}

✅ Success Response:
{
  "success": true,
  "data": {
    "provider": {
      "id": "65abc123...",
      "name": "Pizza Palace",
      "email": "pizza@example.com",
      "stripeConnectedAccountId": null,
      "hasStripeAccount": false
    },
    "pending": {
      "amount": 274.50,
      "ordersCount": 50
    },
    "history": {
      "totalPaidOut": 1250.00,
      "totalPayouts": 5
    }
  }
}
```

**কী দেখবে:**
- Provider এর complete payout info
- Pending amount
- Past payout history
- Stripe account status

---

### **5️⃣ Process Stripe Payout** ⭐
```
POST {{baseUrl}}/api/v1/admin/payouts/process/{{providerId}}
Headers: Authorization: Bearer {{adminToken}}
Body: (empty)

✅ Success Response:
{
  "success": true,
  "message": "Successfully transferred $274.50 to Pizza Palace",
  "data": {
    "transferId": "tr_1234567890",
    "amount": 274.50,
    "ordersCount": 50,
    "provider": {
      "id": "65abc123...",
      "name": "Pizza Palace"
    }
  }
}

❌ Error (No Stripe Account):
{
  "success": false,
  "message": "Provider has not connected their Stripe account...",
  "errorCode": "NO_STRIPE_ACCOUNT"
}
```

**কী হয়:**
- Stripe Transfer API call করে
- Provider এর Stripe account এ টাকা যায়
- Database এ payoutStatus = 'settled' হয়
- Transfer ID save হয়

**⚠️ Requirements:**
- Provider এর Stripe Connected Account থাকতে হবে
- যদি না থাকে, manual payout use করো (#6)

---

### **6️⃣ Mark Payout as Settled (Manual)** ⭐
```
POST {{baseUrl}}/api/v1/admin/payouts/mark-settled/{{providerId}}
Headers: Authorization: Bearer {{adminToken}}

Body:
{
  "reference": "BANK_REF_20240517_001",
  "notes": "Paid via bank transfer to account ending 1234"
}

✅ Success Response:
{
  "success": true,
  "message": "Manually marked $274.50 as paid to Pizza Palace",
  "data": {
    "reference": "BANK_REF_20240517_001",
    "amount": 274.50,
    "ordersCount": 50,
    "notes": "Paid via bank transfer...",
    "provider": {
      "id": "65abc123...",
      "name": "Pizza Palace"
    }
  }
}
```

**কী হয়:**
- Database এ payoutStatus = 'settled' হয়
- Reference number save হয়
- Notes save হয়

**Use Cases:**
- Bank transfer করলে
- Cash payment করলে
- Check দিলে
- PayPal, Venmo, etc. use করলে

---

### **7️⃣ Get Payout History (All)**
```
GET {{baseUrl}}/api/v1/admin/payouts/history
Headers: Authorization: Bearer {{adminToken}}

✅ Success Response:
{
  "success": true,
  "data": {
    "payouts": [
      {
        "providerId": "65abc123...",
        "providerName": "Pizza Palace",
        "amount": 274.50,
        "ordersCount": 50,
        "reference": "tr_1234567890",
        "payoutDate": "2024-05-17T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    },
    "summary": {
      "totalPaidOut": 5420.75,
      "totalPayouts": 25
    }
  }
}
```

**কী দেখবে:**
- সব past payouts
- Total paid out amount
- Total payouts count

---

### **8️⃣ Get Payout History (Filtered)**
```
GET {{baseUrl}}/api/v1/admin/payouts/history?providerId={{providerId}}&startDate=2024-01-01&endDate=2024-12-31

Query Parameters:
- providerId: Specific provider
- startDate: 2024-01-01
- endDate: 2024-12-31
- page: 1
- limit: 20
```

**Use Case:**
- Specific provider এর history দেখতে চাও
- Date range filter করতে চাও

---

### **9️⃣ Get Pending Payouts (Specific Provider)**
```
GET {{baseUrl}}/api/v1/admin/payouts/pending?providerId={{providerId}}
Headers: Authorization: Bearer {{adminToken}}
```

**Use Case:**
- শুধু একটা provider এর pending amount দেখতে চাও

---

## 🎯 Complete Testing Flow:

### **Scenario: Pizza Palace কে টাকা দেওয়া**

```
Step 1: Admin Login ✅
→ Token saved

Step 2: Get Pending Payouts ✅
→ Pizza Palace: $274.50 pending
→ Provider ID saved

Step 3: Get Provider Details ✅
→ Has Stripe Account: No ❌
→ Use manual payout

Step 4: Mark as Settled (Manual) ✅
→ Reference: BANK_REF_001
→ Notes: Bank transfer completed
→ Success! ✅

Step 5: Get Payout History ✅
→ Shows Pizza Palace payment
→ Amount: $274.50
→ Reference: BANK_REF_001
```

---

## 🔄 Auto-Save Variables:

Postman automatically saves these:

### **After Login (#1):**
```javascript
pm.collectionVariables.set('adminToken', response.data.token);
```

### **After Get Pending Payouts (#2):**
```javascript
pm.collectionVariables.set('providerId', firstProvider.providerId);
```

**এর ফলে:**
- তোমাকে manually token copy করতে হবে না
- তোমাকে manually provider ID copy করতে হবে না
- সব request automatically এগুলো use করবে

---

## 📊 Response Examples:

### **Success Response:**
```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

### **Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE"
}
```

### **Common Error Codes:**
- `NO_STRIPE_ACCOUNT` — Provider has no Stripe account
- `NO_PENDING_PAYOUTS` — No pending payouts
- `PROVIDER_NOT_FOUND` — Provider not found
- `REFERENCE_REQUIRED` — Payment reference required
- `STRIPE_TRANSFER_FAILED` — Stripe transfer failed

---

## 🧪 Testing Checklist:

- [ ] **1. Admin Login** — Token saved?
- [ ] **2. Get Pending Payouts** — Shows providers?
- [ ] **3. Get Provider Details** — Shows correct info?
- [ ] **4. Process Stripe Payout** — Works or shows NO_STRIPE_ACCOUNT?
- [ ] **5. Manual Payout** — Marks as settled?
- [ ] **6. Get History** — Shows past payouts?
- [ ] **7. Filters** — Work correctly?

---

## 💡 Tips:

### **Tip 1: Check Variables**
```
Collection → Variables tab
→ adminToken should have value
→ providerId should have value
```

### **Tip 2: Console Logs**
```
Tests tab এ console.log আছে
Postman Console (Ctrl+Alt+C) খুলে দেখো
```

### **Tip 3: Manual Testing**
```
যদি Stripe account না থাকে:
→ Use manual payout (#6)
→ Reference number দাও
→ Notes add করো
```

### **Tip 4: Error Handling**
```
যদি error আসে:
→ Check adminToken আছে কিনা
→ Check server running আছে কিনা
→ Check providerId valid কিনা
```

---

## 🎯 Quick Commands:

### **Import Collection:**
```bash
# Postman এ:
Import → File → postman_admin_payout_complete.json
```

### **Start Server:**
```bash
npm run dev
```

### **Check Server:**
```bash
curl http://localhost:5000/health
```

---

## ✅ Summary:

| API | Method | Auth | Auto-Save |
|-----|--------|------|-----------|
| Admin Login | POST | No | ✅ Token |
| Pending Payouts | GET | Yes | ✅ Provider ID |
| Provider Details | GET | Yes | No |
| Stripe Payout | POST | Yes | No |
| Manual Payout | POST | Yes | No |
| Payout History | GET | Yes | No |

---

## 🎉 Ready to Test!

1. ✅ Import collection
2. ✅ Start server
3. ✅ Run "Admin Login"
4. ✅ Run "Get Pending Payouts"
5. ✅ Run "Manual Payout"
6. ✅ Check "Payout History"

**All Done!** 🚀

---

**কোনো সমস্যা হলে জিজ্ঞেস করো!** 😊

---

*তারিখ: ১৭ মে, ২০২৬*  
*Status: ✅ সম্পূর্ণ*
