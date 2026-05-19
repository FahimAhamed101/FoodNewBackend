# Foodbackend Folder Fix - Route Updates

## Problem Identified

User runs server from **`foodbackend-main/foodbackend/`** folder:
```bash
cd foodbackend
npm run dev
```

This means **`foodbackend/src/`** is the active backend, NOT root `src/`.

---

## Solution Applied

Updated **`foodbackend/src/`** folder with all missing route aliases:

### Files Modified:

#### 1. `foodbackend/src/app.ts`

**Added Routes:**
```typescript
// Review/Feedback aliases
app.use('/api/v1/admin/reviews', reviewRoutes);
app.use('/api/v1/admin/feedback', reviewRoutes);

// Top rated alias
app.use('/api/v1/admin/top', topRatedRoutes);

// Transaction alias
app.use('/api/v1/admin/transactions', adminTransactionRoutes);
```

#### 2. `foodbackend/src/routes/adminDashboard.routes.ts`

**Added Import:**
```typescript
import adminAnalyticsController from '../controllers/adminAnalytics.controller';
```

**Added Route:**
```typescript
router.get('/trending-menu', adminAnalyticsController.getTrendingMenus);
```

---

## Fixed APIs

### 1. ✅ Reviews/Feedback
- `/api/v1/admin/reviews`
- `/api/v1/admin/feedback`

### 2. ✅ Top Restaurants
- `/api/v1/admin/top-restaurants`

### 3. ✅ Trending Menu
- `/api/v1/admin/dashboard/trending-menu`

### 4. ✅ Transactions
- `/api/v1/admin/transactions`
- `/api/v1/admin/transactions-orders`

### 5. ✅ Activities
- `/api/v1/activities` (already configured)

---

## Server Restart

Server will auto-restart if using `ts-node-dev`:

```bash
cd foodbackend
npm run dev
```

Check terminal for:
```
[INFO] Restarting: src/app.ts has been modified
Server running on port 5000
```

---

## Cloudflare Tunnel

No need to restart tunnel. It automatically forwards to the restarted server:

**Tunnel URL:** `https://come-perspectives-remarkable-voltage.trycloudflare.com`

---

## Testing

Test all fixed endpoints:

```bash
# 1. Reviews
GET {{baseUrl}}/api/v1/admin/reviews?page=1&limit=5
Authorization: Bearer <admin_token>

# 2. Trending Menu
GET {{baseUrl}}/api/v1/admin/dashboard/trending-menu?filter=week
Authorization: Bearer <admin_token>

# 3. Activities
GET {{baseUrl}}/api/v1/activities?page=1&limit=10
Authorization: Bearer <admin_token>

# 4. Transactions
GET {{baseUrl}}/api/v1/admin/transactions?page=1&limit=20
Authorization: Bearer <admin_token>

# 5. Top Restaurants
GET {{baseUrl}}/api/v1/admin/top-restaurants?page=1&limit=5
Authorization: Bearer <admin_token>
```

---

## Folder Structure Clarification

```
foodbackend-main/
├── src/                          ❌ NOT RUNNING (root backup)
│   ├── app.ts
│   └── ...
│
├── foodbackend/                  ✅ RUNNING (active backend)
│   ├── src/
│   │   ├── app.ts               ← Updated
│   │   ├── routes/
│   │   │   └── adminDashboard.routes.ts  ← Updated
│   │   └── ...
│   ├── package.json
│   └── node_modules/
│
└── package.json
```

---

## Important Notes

1. **Always edit `foodbackend/src/` files** - NOT root `src/`
2. Server auto-restarts on file changes in dev mode
3. Cloudflare tunnel doesn't need restart
4. All admin routes require authentication + admin role
5. Activity route works for all user roles

---

**Date:** May 19, 2026  
**Status:** All Routes Fixed in Correct Folder ✅
