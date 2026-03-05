# DOXI - Login Credentials for Presentation

## 🔐 Admin Login

**URL:** http://localhost:5173/admin-login

**Credentials:**
- **Email:** `admin123@doxi.com`
- **Password:** `admin123`

---

## 👤 Patient Login

**URL:** http://localhost:5173/login

**Test Patients:**
1. **Email:** `patient1@doxi.com` | **Password:** `patient123`
2. **Email:** `patient2@doxi.com` | **Password:** `patient123`
3. **Email:** `patient3@doxi.com` | **Password:** `patient123`

---

## 👨‍⚕️ Doctor Login

**URL:** http://localhost:5173/login

**Note:** Doctors need admin approval before they can login.

**Test Doctors (if approved):**
1. **Email:** `doctor1@doxi.com` | **Password:** `doctor123`
2. **Email:** `doctor2@doxi.com` | **Password:** `doctor123`
3. **Email:** `doctor3@doxi.com` | **Password:** `doctor123`

---

## 🚀 Quick Start Commands

### Start Backend:
```bash
cd backend
npm run dev
```
**Backend runs on:** http://localhost:5001

### Start Frontend:
```bash
cd frontend
npm run dev
```
**Frontend runs on:** http://localhost:5173

---

## ✅ Verification Checklist

- [x] Admin login working
- [x] Patient login working
- [x] Backend API responding on port 5001
- [x] Frontend proxy configured correctly
- [x] All authentication responses include `success` field
- [x] Password reset for admin completed

---

## 🔧 If Login Fails

1. **Check if servers are running:**
   - Backend: http://localhost:5001/health
   - Frontend: http://localhost:5173

2. **Reset admin password:**
   ```bash
   cd backend
   node createAdmin.js
   ```

3. **Check browser console** for any errors

4. **Verify API proxy** in `frontend/vite.config.js` points to port 5001

---

**Last Updated:** November 17, 2025
**Status:** ✅ All systems operational




