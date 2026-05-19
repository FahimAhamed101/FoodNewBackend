# 💰 Admin to Provider Payout System — সম্পূর্ণ গাইড

## ✅ কী তৈরি করা হয়েছে:

1. ✅ **adminPayout.service.ts** — Payout logic
2. ✅ **adminPayout.controller.ts** — API handlers
3. ✅ **adminPayout.routes.ts** — API routes
4. ✅ **app.ts updated** — Routes connected

---

## 🎯 System Overview:

```
Donor টাকা দেয় → Admin account এ জমা হয়
    ↓
User free meal order করে
    ↓
Database এ record: Provider কে $5.49 দিতে হবে (payoutStatus: pending)
    ↓
Admin payout process করে
    ↓
Provider এর account এ টাকা যায় (payoutStatus: settled)
```

---

## 📍 5টা Main API:

### **1. GET /api/v1/admin/payouts/pending**
**কাজ:** কোন provider দের কত টাকা দিতে হবে দেখায়

**Query Parameters:**
```
?minAmount=50          // Min $50 pending থাকলে দেখাবে
&providerId=xxx        // Specific provider
&page=1
&limit=20
```

**Response:**
```json
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
        "stripeConnectedAccountId": "acct_xxx"
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    },
    "totalPendingAmount": 1250.75
  }
}
```

---

### **2. POST /api/v1/admin/payouts/process/:providerId**
**কাজ:** Stripe দিয়ে automatic টাকা পাঠায়

**Requirements:**
- ✅ Provider এর Stripe Connected Account থাকতে হবে
- ✅ Admin authentication লাগবে

**Example:**
```bash
POST /api/v1/admin/payouts/process/65abc123...
Headers: {
  "Authorization": "Bearer <admin_token>"
}
```

**Response:**
```json
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
```

**কী হয়:**
1. ✅ Pending payments খুঁজে বের করে
2. ✅ Total amount calculate করে
3. ✅ Stripe Transfer API call করে
4. ✅ Provider এর Stripe account এ টাকা যায়
5. ✅ Database এ payoutStatus = 'settled' করে
6. ✅ stripeTransferId save করে

---

### **3. POST /api/v1/admin/payouts/mark-settled/:providerId**
**কাজ:** Manual payment mark করে (bank transfer, cash, etc.)

**Body:**
```json
{
  "reference": "BANK_REF_20240517_001",
  "notes": "Paid via bank transfer to account ending 1234"
}
```

**Response:**
```json
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

**Use Case:**
- Bank transfer করলে
- Cash payment করলে
- Check দিলে
- অন্য কোনো method এ payment করলে

---

### **4. GET /api/v1/admin/payouts/history**
**কাজ:** Past payout history দেখায়

**Query Parameters:**
```
?providerId=xxx        // Specific provider
&startDate=2024-01-01
&endDate=2024-12-31
&page=1
&limit=20
```

**Response:**
```json
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

---

### **5. GET /api/v1/admin/payouts/provider/:providerId**
**কাজ:** Specific provider এর payout details দেখায়

**Response:**
```json
{
  "success": true,
  "data": {
    "provider": {
      "id": "65abc123...",
      "name": "Pizza Palace",
      "email": "pizza@example.com",
      "stripeConnectedAccountId": "acct_xxx",
      "hasStripeAccount": true
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

---

## 🔄 Complete Flow Example:

### **Scenario: Pizza Palace কে টাকা দেওয়া**

#### **Step 1: Check Pending Amount**
```bash
GET /api/v1/admin/payouts/pending?providerId=PIZZA_PALACE_ID

Response:
- Pending: $274.50
- Orders: 50
```

#### **Step 2: Check Provider Details**
```bash
GET /api/v1/admin/payouts/provider/PIZZA_PALACE_ID

Response:
- Has Stripe Account: Yes ✅
- Stripe Account ID: acct_xxx
```

#### **Step 3: Process Payout (Stripe)**
```bash
POST /api/v1/admin/payouts/process/PIZZA_PALACE_ID

Result:
✅ $274.50 transferred to Pizza Palace
✅ 50 orders marked as settled
✅ Transfer ID: tr_1234567890
```

#### **Alternative Step 3: Manual Payment**
```bash
POST /api/v1/admin/payouts/mark-settled/PIZZA_PALACE_ID
Body: {
  "reference": "BANK_20240517_001",
  "notes": "Bank transfer completed"
}

Result:
✅ $274.50 marked as paid
✅ 50 orders marked as settled
✅ Reference saved
```

---

## 💡 Two Payment Methods:

### **Method 1: Stripe Transfer (Automatic)** ⭐ Recommended

**Pros:**
- ✅ Automatic
- ✅ Fast (instant)
- ✅ Secure
- ✅ Trackable
- ✅ No manual work

**Cons:**
- ❌ Provider must have Stripe Connected Account
- ❌ Stripe fees apply

**Setup Required:**
```typescript
// Provider onboarding এ Stripe Connect add করতে হবে
// (এটা আলাদা feature, পরে implement করা যাবে)
```

---

### **Method 2: Manual Payment** 

**Pros:**
- ✅ Any payment method (bank, cash, check)
- ✅ No Stripe account needed
- ✅ Flexible

**Cons:**
- ❌ Manual work
- ❌ Slower
- ❌ Need to track reference manually

**Use Cases:**
- Bank transfer
- Cash payment
- Check payment
- PayPal, Venmo, etc.

---

## 🎯 Database Changes:

### **Payment Model (Already Exists):**
```typescript
{
  payoutStatus: 'pending' | 'settled',
  stripeTransferId: string,  // Stores transfer ID or manual reference
  netAmount: number,         // Amount provider gets
}
```

**No schema changes needed!** ✅

---

## 🧪 Testing:

### **Test 1: Get Pending Payouts**
```bash
GET /api/v1/admin/payouts/pending
Authorization: Bearer <admin_token>

Expected: List of providers with pending amounts
```

### **Test 2: Process Stripe Payout**
```bash
POST /api/v1/admin/payouts/process/PROVIDER_ID
Authorization: Bearer <admin_token>

Expected:
- If has Stripe account: Success ✅
- If no Stripe account: Error "NO_STRIPE_ACCOUNT"
```

### **Test 3: Manual Payout**
```bash
POST /api/v1/admin/payouts/mark-settled/PROVIDER_ID
Authorization: Bearer <admin_token>
Body: {
  "reference": "TEST_REF_001",
  "notes": "Test payment"
}

Expected: Success ✅
```

### **Test 4: Payout History**
```bash
GET /api/v1/admin/payouts/history
Authorization: Bearer <admin_token>

Expected: List of past payouts
```

---

## 📊 Admin Dashboard Integration:

### **Pending Payouts Widget:**
```javascript
// Frontend code example
const response = await fetch('/api/v1/admin/payouts/pending?minAmount=50');
const data = await response.json();

// Show:
// - Total pending: $1,250.75
// - Providers: 10
// - List of providers with amounts
```

### **Payout Button:**
```javascript
// For each provider:
<button onClick={() => processPayout(providerId)}>
  Pay ${pendingAmount}
</button>

async function processPayout(providerId) {
  const response = await fetch(`/api/v1/admin/payouts/process/${providerId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });
  
  if (response.ok) {
    alert('Payment successful!');
  }
}
```

---

## ⚠️ Important Notes:

### **1. Stripe Connected Account:**
```
Provider must complete Stripe Connect onboarding first
→ This is a separate feature (not implemented yet)
→ For now, use manual payment method
```

### **2. Security:**
```
✅ Only admins can access these APIs
✅ requireRole([UserRole.ADMIN]) middleware
✅ Authentication required
```

### **3. Idempotency:**
```
✅ Can't process same payout twice
✅ Checks payoutStatus before processing
✅ Safe to retry on error
```

---

## 🚀 Next Steps:

### **Phase 1: Use Manual Payment** (Now)
```
1. Admin checks pending payouts
2. Admin transfers money via bank
3. Admin marks as settled with reference
```

### **Phase 2: Add Stripe Connect** (Future)
```
1. Provider completes Stripe onboarding
2. Gets Stripe Connected Account ID
3. Admin can use automatic payout
```

### **Phase 3: Automation** (Future)
```
1. Cron job runs weekly
2. Auto-processes payouts > $100
3. Sends email notifications
```

---

## ✅ Summary:

| Feature | Status |
|---------|--------|
| **Pending payouts API** | ✅ Done |
| **Stripe payout API** | ✅ Done |
| **Manual payout API** | ✅ Done |
| **Payout history API** | ✅ Done |
| **Provider details API** | ✅ Done |
| **Routes configured** | ✅ Done |
| **Admin authentication** | ✅ Done |
| **Stripe Connect** | ❌ Not yet (future) |

---

## 🎉 Result:

**তোমার Admin Panel এখন Provider দের টাকা দিতে পারবে!** 🚀

**2 Ways:**
1. ✅ **Automatic** — Stripe Transfer (if provider has Stripe account)
2. ✅ **Manual** — Mark as paid with reference (bank transfer, etc.)

---

**কোনো প্রশ্ন থাকলে জিজ্ঞেস করো!** 😊

---

*তারিখ: ১৭ মে, ২০২৬*  
*Status: ✅ সম্পূর্ণ*
