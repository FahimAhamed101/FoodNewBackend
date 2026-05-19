# 🔧 Google Login Frontend Fix

## ❌ সমস্যা:

Frontend থেকে wrong route call করছে:
```javascript
// ❌ Wrong Route
POST /api/auth/google

// Error Response:
{
  "success": false,
  "message": "Route /api/auth/google not found",
  "errorCode": "ROUTE_NOT_FOUND"
}
```

---

## ✅ সঠিক Route:

Backend এ Google login route হলো:
```javascript
// ✅ Correct Route
POST /api/v1/oauth/google
```

---

## 🔄 Frontend Code Fix:

### **Before (Wrong):**
```javascript
// ❌ Wrong
const response = await fetch('http://localhost:5000/api/auth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idToken: googleIdToken
  })
});
```

### **After (Correct):**
```javascript
// ✅ Correct
const response = await fetch('http://localhost:5000/api/v1/oauth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    idToken: googleIdToken
  })
});
```

---

## 📍 Complete Google OAuth Flow:

### **Step 1: Google Login**
```javascript
POST /api/v1/oauth/google

Request Body:
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjY4YTk4..."
}

Response (Success):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userId": "65abc123...",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "sessionId": "65def456..."
  }
}

Response (Step-up Required):
{
  "success": true,
  "requiresStepUp": true,
  "message": "OTP sent to your email for verification",
  "data": {
    "tempToken": "temp_abc123...",
    "email": "user@example.com"
  }
}
```

---

### **Step 2: Verify Step-up OTP (if required)**
```javascript
POST /api/v1/oauth/google/verify-stepup

Request Body:
{
  "tempToken": "temp_abc123...",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    },
    "sessionId": "..."
  }
}
```

---

### **Step 3: Refresh Token (when access token expires)**
```javascript
POST /api/v1/oauth/refresh

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..."
  }
}
```

---

## 🎯 Complete Frontend Implementation:

### **React/React Native Example:**

```javascript
// Google Login Function
const handleGoogleLogin = async (googleIdToken) => {
  try {
    const response = await fetch('http://localhost:5000/api/v1/oauth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken: googleIdToken
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Check if step-up is required
    if (data.requiresStepUp) {
      // Show OTP input screen
      setTempToken(data.data.tempToken);
      setShowOtpScreen(true);
      Alert.alert('Verification Required', data.message);
      return;
    }

    // Login successful
    const { accessToken, refreshToken } = data.data.tokens;
    const { user } = data.data;

    // Save tokens
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    // Navigate to home screen
    navigation.navigate('Home');

  } catch (error) {
    console.error('Google Login Error:', error);
    Alert.alert('Login Failed', error.message);
  }
};

// Verify Step-up OTP
const handleVerifyOtp = async (otp) => {
  try {
    const response = await fetch('http://localhost:5000/api/v1/oauth/google/verify-stepup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tempToken: tempToken,
        otp: otp
      })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    // Login successful
    const { accessToken, refreshToken } = data.data.tokens;
    const { user } = data.data;

    // Save tokens
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));

    // Navigate to home screen
    navigation.navigate('Home');

  } catch (error) {
    console.error('OTP Verification Error:', error);
    Alert.alert('Verification Failed', error.message);
  }
};

// Refresh Token Function
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    const response = await fetch('http://localhost:5000/api/v1/oauth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    const data = await response.json();

    if (!data.success) {
      // Refresh token expired, logout user
      await handleLogout();
      return null;
    }

    // Save new tokens
    await AsyncStorage.setItem('accessToken', data.data.accessToken);
    await AsyncStorage.setItem('refreshToken', data.data.refreshToken);

    return data.data.accessToken;

  } catch (error) {
    console.error('Token Refresh Error:', error);
    await handleLogout();
    return null;
  }
};
```

---

## 🔐 Using Access Token in API Calls:

```javascript
// Example: Get user profile
const getUserProfile = async () => {
  try {
    let accessToken = await AsyncStorage.getItem('accessToken');

    const response = await fetch('http://localhost:5000/api/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    // If token expired, refresh and retry
    if (response.status === 401) {
      accessToken = await refreshAccessToken();
      
      if (!accessToken) {
        // Logout user
        return;
      }

      // Retry with new token
      const retryResponse = await fetch('http://localhost:5000/api/v1/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await retryResponse.json();
      return data;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Get Profile Error:', error);
  }
};
```

---

## 📋 All OAuth Routes:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/oauth/google` | Google login |
| POST | `/api/v1/oauth/google/verify-stepup` | Verify OTP |
| POST | `/api/v1/oauth/refresh` | Refresh token |
| GET | `/api/v1/oauth/sessions` | Get all sessions |
| DELETE | `/api/v1/oauth/sessions/:sessionId` | Revoke session |
| DELETE | `/api/v1/oauth/sessions` | Logout all devices |

---

## ⚠️ Important Notes:

### **1. Base URL:**
```javascript
// Development
const BASE_URL = 'http://localhost:5000';

// Production
const BASE_URL = 'https://your-api.com';

// Use environment variable
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
```

### **2. Route Pattern:**
```
✅ Correct: /api/v1/oauth/google
❌ Wrong: /api/auth/google
❌ Wrong: /api/oauth/google
❌ Wrong: /oauth/google
```

### **3. Token Storage:**
```javascript
// ✅ Secure storage (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Secure storage (React Web)
// Use httpOnly cookies or secure localStorage
```

### **4. Error Handling:**
```javascript
// Always check response status
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message);
}
```

---

## 🧪 Testing:

### **Test 1: Google Login**
```bash
curl -X POST http://localhost:5000/api/v1/oauth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_GOOGLE_ID_TOKEN"
  }'
```

### **Test 2: Refresh Token**
```bash
curl -X POST http://localhost:5000/api/v1/oauth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## ✅ Summary:

**Frontend এ change করতে হবে:**

1. ✅ Route change করো: `/api/auth/google` → `/api/v1/oauth/google`
2. ✅ Base URL ঠিক করো: `http://localhost:5000`
3. ✅ Step-up OTP handling add করো
4. ✅ Refresh token logic implement করো
5. ✅ Token storage secure করো

---

**এখন Google login কাজ করবে!** 🎉

---

*তারিখ: ১৯ মে, ২০২৬*  
*Status: ✅ সম্পূর্ণ*
