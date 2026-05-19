# 🔄 Cloudflare Tunnel Restart Guide

## 🎯 সমস্যা:

Cloudflare tunnel এ 404 error আসছে কিন্তু local server এ route কাজ করছে।

**কারণ:** Tunnel restart করতে হবে নতুন routes load করার জন্য।

---

## 📋 Step-by-Step Restart Process:

---

### **STEP 1: Current Tunnel Stop করো**

#### **Windows PowerShell/CMD:**
```powershell
# যেখানে cloudflared চলছে সেই terminal এ যাও
# তারপর Ctrl + C press করো
```

অথবা

```powershell
# Process kill করো
taskkill /F /IM cloudflared.exe
```

---

### **STEP 2: Server Running আছে কিনা Check করো**

#### **Postman Request:**
```
GET http://localhost:5000/health

Expected Response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-05-19T...",
  "environment": "development"
}
```

---

### **STEP 3: Cloudflare Tunnel Start করো**

#### **Command:**
```bash
cloudflared tunnel --url http://localhost:5000
```

#### **Expected Output:**
```
2024-05-19T15:00:00Z INF Thank you for trying Cloudflare Tunnel...
2024-05-19T15:00:01Z INF Requesting new quick Tunnel on trycloudflare.com...
2024-05-19T15:00:02Z INF +--------------------------------------------------------------------------------------------+
2024-05-19T15:00:02Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2024-05-19T15:00:02Z INF |  https://consistent-css-diagnostic-attempting.trycloudflare.com                            |
2024-05-19T15:00:02Z INF +--------------------------------------------------------------------------------------------+
```

**Note:** URL same থাকতে পারে অথবা নতুন URL generate হতে পারে।

---

### **STEP 4: Test Tunnel with Postman**

#### **Request 1: Health Check**
```
GET https://consistent-css-diagnostic-attempting.trycloudflare.com/health

Expected Response:
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-05-19T...",
  "environment": "development"
}
```

---

#### **Request 2: Admin Restaurants (Without Auth)**
```
GET https://consistent-css-diagnostic-attempting.trycloudflare.com/api/v1/admin/restaurants?state=all

Expected Response:
{
  "success": false,
  "errorCode": "AUTH_ERROR",
  "message": "You are not logged in! Please log in to get access."
}
```

**✅ এটা correct response! 404 না, AUTH_ERROR আসবে।**

---

#### **Request 3: Admin Restaurants (With Auth)**
```
GET https://consistent-css-diagnostic-attempting.trycloudflare.com/api/v1/admin/restaurants?state=all

Headers:
{
  "Authorization": "Bearer {{admin_token}}"
}

Expected Response:
{
  "success": true,
  "data": {
    "restaurants": [...],
    "pagination": {...}
  }
}
```

---

## 📦 Postman Collection: Cloudflare Tunnel Test

### **Collection Structure:**

```json
{
  "info": {
    "name": "Cloudflare Tunnel Test",
    "description": "Test Cloudflare tunnel connectivity"
  },
  "item": [
    {
      "name": "1. Health Check - Local",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/health"
      }
    },
    {
      "name": "2. Health Check - Tunnel",
      "request": {
        "method": "GET",
        "url": "{{tunnelUrl}}/health"
      }
    },
    {
      "name": "3. Admin Restaurants - No Auth",
      "request": {
        "method": "GET",
        "url": "{{tunnelUrl}}/api/v1/admin/restaurants?state=all"
      }
    },
    {
      "name": "4. Admin Restaurants - With Auth",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{tunnelUrl}}/api/v1/admin/restaurants?state=all"
      }
    },
    {
      "name": "5. Support Tickets - Tunnel",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{admin_token}}"
          }
        ],
        "url": "{{tunnelUrl}}/api/v1/support/admin/tickets?status=Open"
      }
    }
  ]
}
```

---

## 🔧 Postman Environment Variables:

```json
{
  "name": "Cloudflare Tunnel",
  "values": [
    {
      "key": "tunnelUrl",
      "value": "https://consistent-css-diagnostic-attempting.trycloudflare.com",
      "enabled": true
    },
    {
      "key": "localUrl",
      "value": "http://localhost:5000",
      "enabled": true
    },
    {
      "key": "admin_token",
      "value": "YOUR_ADMIN_TOKEN_HERE",
      "enabled": true
    }
  ]
}
```

---

## 🎯 Testing Checklist:

### **Before Tunnel Restart:**
- [ ] Local server running (port 5000)
- [ ] Local health check works
- [ ] Local routes work (with auth error)

### **After Tunnel Restart:**
- [ ] Tunnel started successfully
- [ ] New tunnel URL copied
- [ ] Tunnel health check works
- [ ] Tunnel routes work (with auth error, not 404)

---

## ⚠️ Common Issues:

### **Issue 1: Port Already in Use**
```bash
Error: listen tcp :5000: bind: address already in use

Solution:
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or restart server
npm run dev
```

---

### **Issue 2: Tunnel URL Changed**
```
Old: https://consistent-css-diagnostic-attempting.trycloudflare.com
New: https://different-url-here.trycloudflare.com

Solution:
1. Copy new URL
2. Update Postman environment variable
3. Update frontend baseUrl
```

---

### **Issue 3: Still Getting 404**
```
Possible Causes:
1. Tunnel not pointing to correct port
2. Server not running
3. Route path wrong in frontend

Solution:
1. Check tunnel command: cloudflared tunnel --url http://localhost:5000
2. Check server: curl http://localhost:5000/health
3. Check route: curl http://localhost:5000/api/v1/admin/restaurants
```

---

## 🚀 Quick Commands:

### **Windows:**
```powershell
# Stop tunnel
taskkill /F /IM cloudflared.exe

# Check server
curl http://localhost:5000/health

# Start tunnel
cloudflared tunnel --url http://localhost:5000

# Test tunnel
curl https://YOUR-TUNNEL-URL.trycloudflare.com/health
```

---

### **Linux/Mac:**
```bash
# Stop tunnel
pkill cloudflared

# Check server
curl http://localhost:5000/health

# Start tunnel
cloudflared tunnel --url http://localhost:5000

# Test tunnel
curl https://YOUR-TUNNEL-URL.trycloudflare.com/health
```

---

## 📊 Expected Results:

| Test | Local | Tunnel | Status |
|------|-------|--------|--------|
| Health Check | ✅ 200 | ✅ 200 | Working |
| Admin Restaurants (No Auth) | ✅ 401 | ✅ 401 | Working |
| Admin Restaurants (With Auth) | ✅ 200 | ✅ 200 | Working |
| Support Tickets | ✅ 401 | ✅ 401 | Working |

**Note:** 401 = AUTH_ERROR (correct behavior)

---

## 🎉 Success Indicators:

### **✅ Tunnel Working:**
```json
{
  "success": false,
  "errorCode": "AUTH_ERROR",
  "message": "You are not logged in!"
}
```

### **❌ Tunnel Not Working:**
```json
{
  "success": false,
  "message": "Route /api/v1/admin/restaurants not found",
  "errorCode": "ROUTE_NOT_FOUND"
}
```

---

## 📝 Summary:

1. ✅ Stop current tunnel (Ctrl + C)
2. ✅ Check local server (http://localhost:5000/health)
3. ✅ Start new tunnel (cloudflared tunnel --url http://localhost:5000)
4. ✅ Copy tunnel URL
5. ✅ Test with Postman
6. ✅ Update frontend if URL changed

---

**Tunnel restart করার পর সব route কাজ করবে!** 🚀

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ Complete Guide*
