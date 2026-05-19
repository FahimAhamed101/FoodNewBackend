# 💳 Stripe Test Payment Guide - 4242 4242 4242 4242

## 🎯 Complete Testing Flow

---

## 📋 Prerequisites:

1. ✅ Stripe account setup করা আছে
2. ✅ Stripe API keys `.env` file এ আছে
3. ✅ Server running আছে
4. ✅ Postman/Frontend ready

---

## 🔑 Stripe Test Cards:

### **Success Card:**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### **Other Test Cards:**
```
Decline Card: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Expired Card: 4000 0000 0000 0069
Processing Error: 4000 0000 0000 0119
```

---

## 🚀 Complete Payment Testing Flow:

---

## **STEP 1: Donor Makes Donation** 💰

### **1.1 Create Payment Intent**
```bash
POST {{baseUrl}}/api/v1/stripe/create-payment-intent

Headers:
{
  "Authorization": "Bearer {{donor_token}}",
  "Content-Type": "application/json"
}

Body:
{
  "amount": 70.00,
  "numberOfMeals": 10,
  "currency": "usd"
}

Response:
{
  "success": true,
  "data": {
    "clientSecret": "pi_xxx_secret_yyy",
    "paymentIntentId": "pi_1234567890",
    "amount": 70.00,
    "currency": "usd"
  }
}
```

**Save:** `clientSecret` এবং `paymentIntentId`

---

### **1.2 Confirm Payment with Test Card**

#### **Option A: Using Stripe.js (Frontend)**
```javascript
const stripe = Stripe('pk_test_YOUR_PUBLISHABLE_KEY');

const result = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2025,
      cvc: '123'
    },
    billing_details: {
      name: 'Test Donor',
      email: 'donor@test.com'
    }
  }
});

if (result.error) {
  console.error(result.error.message);
} else {
  console.log('Payment successful!', result.paymentIntent);
}
```

#### **Option B: Using Stripe API Directly (Backend Test)**
```bash
curl https://api.stripe.com/v1/payment_intents/{{paymentIntentId}}/confirm \
  -u sk_test_YOUR_SECRET_KEY: \
  -d payment_method=pm_card_visa
```

#### **Option C: Using Stripe CLI (Local Testing)**
```bash
stripe payment_intents confirm {{paymentIntentId}} \
  --payment-method=pm_card_visa
```

---

### **1.3 Webhook Receives Payment Success**

Stripe automatically sends webhook to:
```
POST {{baseUrl}}/api/v1/stripe/webhook
```

**Webhook Event:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 7000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": {
        "donorUserId": "65donor123...",
        "numberOfMeals": "10"
      }
    }
  }
}
```

**Backend automatically:**
1. ✅ Creates Order (type: 'donation')
2. ✅ Creates Payment record
3. ✅ Generates 10 MealTokens
4. ✅ Sends notification to donor

---

### **1.4 Verify Donation Created**
```bash
GET {{baseUrl}}/api/v1/donation/my-donations

Headers:
{
  "Authorization": "Bearer {{donor_token}}"
}

Response:
{
  "success": true,
  "data": {
    "donations": [
      {
        "orderId": "65order123...",
        "amount": 70.00,
        "numberOfMeals": 10,
        "tokensGenerated": 10,
        "tokensClaimed": 0,
        "tokensUsed": 0,
        "status": "completed",
        "createdAt": "2024-05-19T10:00:00Z"
      }
    ]
  }
}
```

---

## **STEP 2: Check Meal Tokens Generated** 🎟️

```bash
GET {{baseUrl}}/api/v1/donation/tokens

Headers:
{
  "Authorization": "Bearer {{donor_token}}"
}

Response:
{
  "success": true,
  "data": {
    "tokens": [
      {
        "tokenId": "65token001...",
        "status": "available",
        "claimedBy": null,
        "claimedAt": null
      },
      {
        "tokenId": "65token002...",
        "status": "available",
        "claimedBy": null,
        "claimedAt": null
      }
      // ... 8 more tokens
    ],
    "summary": {
      "total": 10,
      "available": 10,
      "claimed": 0,
      "used": 0
    }
  }
}
```

---

## **STEP 3: User Claims Free Meal Token** 🎁

```bash
POST {{baseUrl}}/api/v1/donation/claim/{{tokenId}}

Headers:
{
  "Authorization": "Bearer {{user_token}}"
}

Response:
{
  "success": true,
  "message": "Free meal claimed successfully! Place your order now.",
  "data": {
    "token": {
      "tokenId": "65token001...",
      "status": "claimed",
      "claimedBy": "65user123...",
      "claimedAt": "2024-05-19T11:00:00Z"
    }
  }
}
```

---

## **STEP 4: User Places Free Meal Order** 🍕

```bash
POST {{baseUrl}}/api/v1/donation/place-free-order

Headers:
{
  "Authorization": "Bearer {{user_token}}",
  "Content-Type": "application/json"
}

Body:
{
  "tokenId": "65token001...",
  "providerId": "65provider123...",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}

Response:
{
  "success": true,
  "message": "Free meal order placed successfully!",
  "data": {
    "order": {
      "orderId": "65order456...",
      "type": "free_meal",
      "providerId": "65provider123...",
      "customerId": "65user123...",
      "totalAmount": 0,
      "pricePerMeal": 5.99,
      "status": "pending",
      "deliveryAddress": { ... }
    }
  }
}
```

---

## **STEP 5: Check Provider Pending Payout** 💵

```bash
GET {{baseUrl}}/api/v1/admin/payouts/pending?providerId={{providerId}}

Headers:
{
  "Authorization": "Bearer {{admin_token}}"
}

Response:
{
  "success": true,
  "data": {
    "providers": [
      {
        "providerId": "65provider123...",
        "providerName": "Pizza Palace",
        "providerEmail": "pizza@example.com",
        "pendingAmount": 5.49,
        "pendingOrdersCount": 1,
        "stripeConnectedAccountId": null
      }
    ],
    "totalPendingAmount": 5.49
  }
}
```

**Calculation:**
```
Food Price: $5.99
Platform Fee: $0.50
Provider Gets: $5.99 - $0.50 = $5.49 ✅
```

---

## **STEP 6: Admin Pays Provider (Manual)** 💸

```bash
POST {{baseUrl}}/api/v1/admin/payouts/mark-settled/{{providerId}}

Headers:
{
  "Authorization": "Bearer {{admin_token}}",
  "Content-Type": "application/json"
}

Body:
{
  "reference": "BANK_REF_20240519_001",
  "notes": "Bank transfer completed for 1 free meal order"
}

Response:
{
  "success": true,
  "message": "Manually marked $5.49 as paid to Pizza Palace",
  "data": {
    "reference": "BANK_REF_20240519_001",
    "amount": 5.49,
    "ordersCount": 1,
    "notes": "Bank transfer completed for 1 free meal order",
    "provider": {
      "id": "65provider123...",
      "name": "Pizza Palace"
    }
  }
}
```

---

## **STEP 7: Verify Payout History** 📊

```bash
GET {{baseUrl}}/api/v1/admin/payouts/history?providerId={{providerId}}

Headers:
{
  "Authorization": "Bearer {{admin_token}}"
}

Response:
{
  "success": true,
  "data": {
    "payouts": [
      {
        "providerId": "65provider123...",
        "providerName": "Pizza Palace",
        "amount": 5.49,
        "ordersCount": 1,
        "reference": "BANK_REF_20240519_001",
        "payoutDate": "2024-05-19T12:00:00Z"
      }
    ],
    "summary": {
      "totalPaidOut": 5.49,
      "totalPayouts": 1
    }
  }
}
```

---

## 🧪 Complete Postman Collection:

### **Collection Structure:**

```
Stripe Test Payment Flow
├── 1. Donation
│   ├── Create Payment Intent
│   ├── Get My Donations
│   └── Get My Tokens
├── 2. Claim & Order
│   ├── Claim Token
│   └── Place Free Order
└── 3. Admin Payout
    ├── Get Pending Payouts
    ├── Mark as Settled
    └── Get Payout History
```

---

## 📝 Postman Environment Variables:

```json
{
  "baseUrl": "http://localhost:5000",
  "donor_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "providerId": "65provider123...",
  "tokenId": "65token001...",
  "clientSecret": "pi_xxx_secret_yyy"
}
```

---

## 🎯 Testing Scenarios:

### **Scenario 1: Successful Payment**
```
Card: 4242 4242 4242 4242
Expected: ✅ Payment succeeds
Expected: ✅ 10 tokens generated
Expected: ✅ Donor receives notification
```

### **Scenario 2: Declined Card**
```
Card: 4000 0000 0000 0002
Expected: ❌ Payment fails
Expected: ❌ No tokens generated
Expected: ❌ Error message shown
```

### **Scenario 3: Insufficient Funds**
```
Card: 4000 0000 0000 9995
Expected: ❌ Payment fails
Expected: ❌ Error: "Insufficient funds"
```

---

## 🔄 Money Flow Summary:

```
1. Donor pays $70.00 (10 meals × $7.00)
   ↓
2. Stripe processes payment
   ↓
3. Admin receives $70.00
   ↓
4. 10 tokens generated
   ↓
5. User claims token & orders
   ↓
6. Provider delivers meal
   ↓
7. Provider gets $5.49 per meal
   ↓
8. Admin keeps $0.50 platform fee
```

**Per Meal Breakdown:**
```
Food Price:    $5.99
Platform Fee:  $0.50
Tax:           $0.51
Total:         $7.00

Provider Gets: $5.49 ✅
Platform Gets: $0.50 ✅
```

---

## ⚠️ Important Notes:

### **1. Test Mode:**
```
✅ Use test API keys (sk_test_...)
✅ Use test cards (4242...)
✅ No real money charged
✅ Webhooks work in test mode
```

### **2. Webhook Testing:**
```
Option A: Use Stripe CLI
stripe listen --forward-to localhost:5000/api/v1/stripe/webhook

Option B: Use ngrok
ngrok http 5000
→ Add webhook URL in Stripe Dashboard
```

### **3. Payment Intent Lifecycle:**
```
created → processing → succeeded
         ↓
      canceled / failed
```

---

## 🚀 Quick Test Commands:

### **1. Create Donation:**
```bash
curl -X POST http://localhost:5000/api/v1/stripe/create-payment-intent \
  -H "Authorization: Bearer {{donor_token}}" \
  -H "Content-Type: application/json" \
  -d '{"amount": 70, "numberOfMeals": 10, "currency": "usd"}'
```

### **2. Simulate Webhook (Test):**
```bash
stripe trigger payment_intent.succeeded
```

### **3. Check Tokens:**
```bash
curl http://localhost:5000/api/v1/donation/tokens \
  -H "Authorization: Bearer {{donor_token}}"
```

---

## ✅ Success Checklist:

- [ ] Payment Intent created
- [ ] Test card payment successful
- [ ] Webhook received
- [ ] Order created (type: donation)
- [ ] Payment record saved
- [ ] 10 tokens generated
- [ ] User can claim token
- [ ] User can place free order
- [ ] Provider pending payout shows $5.49
- [ ] Admin can mark as settled
- [ ] Payout history updated

---

## 🎉 Result:

**Complete donation → claim → order → payout flow tested!** 🚀

---

**কোনো প্রশ্ন থাকলে জিজ্ঞেস করো!** 😊

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Complete Testing Guide*
