# DOXI PPT - Quick Reference Card
## One-Page Summary for Quick Preparation

---

## 1. PROJECT PROFILE
- **Name:** DOXI (Digital Online eXperience Interface)
- **Type:** Healthcare Management System (Web Application)
- **Stack:** MERN (MongoDB, Express, React, Node.js)
- **Tech:** React 18, Vite, Tailwind CSS, Material-UI, Redux, JWT, MongoDB

---

## 2. PROJECT INTRODUCTION
**What:** Healthcare platform connecting Patients, Doctors, and Administrators
**Problem:** Fragmented, time-consuming appointment systems
**Solution:** Centralized platform for booking, management, and analytics
**Key Features:** Multi-role system, real-time appointments, doctor discovery, reviews, notifications

---

## 3. PROJECT OBJECTIVE
1. Digital transformation of healthcare booking
2. Efficiency & automation
3. Enhanced user experience
4. Centralized data management
5. Transparency through reviews

---

## 4. SCOPE

**Patients:** Register, Search Doctors, Book Appointments, View History, Rate/Review, Notifications
**Doctors:** Register, Set Availability, Manage Appointments, Add Prescriptions, View Reviews, Dashboard
**Admins:** Manage Doctors/Patients, View Analytics, Approve/Reject Doctors, System Statistics

**Out of Scope:** Video consultation, Payment gateway, Mobile apps, EHR

---

## 5. ENVIRONMENT

**Frontend:** Node.js 18+, React 18.2, Vite 5, Tailwind CSS 3.3, Material-UI 5.15, Redux 5
**Backend:** Node.js 18+, Express 4.18, MongoDB (Mongoose 8.0), JWT, Zod
**Database:** MongoDB (Local/Atlas)
**Tools:** VS Code, Git, Postman

---

## 6. USE CASE DIAGRAM

**Actors:** Patient, Doctor, Administrator

**Patient Use Cases:**
- Register/Login, Search Doctors, View Profile, Book Appointment, View Appointments, Cancel, Rate/Review, Notifications, Profile Management

**Doctor Use Cases:**
- Register/Login, Update Profile, Set Availability, Set Leave, View Requests, Confirm/Reject/Complete Appointment, Add Prescription, View Reviews, Notifications, Dashboard

**Admin Use Cases:**
- Admin Login, Dashboard Analytics, Manage Doctors (CRUD), Approve/Reject, Manage Patients, View All Appointments/Reviews, System Stats, Settings

---

## 7. DATABASE DESIGN

**6 Main Collections:**
1. **Users** - All user types (patient, doctor, admin) with role-based fields
2. **Appointments** - Patient-Doctor appointments with status, dates, prescription
3. **Reviews** - Patient reviews for doctors (rating 1-5, comments)
4. **Availability** - Doctor schedules (weekly patterns + leave dates)
5. **Notifications** - Real-time notifications for all users
6. **Settings** - System configuration

**Relationships:** One-to-Many (User → Appointments, Reviews, Notifications, Availability)

---

## 8. SCREENSHOTS (15 Recommended)

1. Landing Page
2. Patient Registration
3. Doctor Registration
4. Patient Dashboard
5. Find Doctor (Search)
6. Book Appointment
7. Doctor Dashboard
8. Doctor Availability
9. Doctor Appointments
10. Admin Dashboard
11. Admin - Manage Doctors
12. Admin - Manage Patients
13. Reviews & Ratings
14. Notifications
15. Mobile Responsive View

---

## 9. TEST CASES (20 Key Tests)

**Functional:**
- Patient/Doctor Registration
- Login Authentication
- Search Doctors
- Book Appointment
- Prevent Sunday/Leave Booking
- Confirm/Reject/Complete Appointment
- Rate & Review
- Set Availability/Leave
- Admin Approve/Reject Doctor

**Validation:**
- Email (.com only)
- License Number (XX/YYYY/XXXXX)
- Years of Experience (0-50, no negatives/decimals)

**Security:**
- Role-Based Access Control (RBAC)

---

## KEY STATISTICS

- **Total Files:** 144
- **Total Folders:** 61
- **Frontend Files:** 73
- **Backend Files:** 30
- **Collections:** 6
- **User Roles:** 3 (Patient, Doctor, Admin)
- **Appointment Statuses:** 4 (Pending, Confirmed, Completed, Cancelled)

---

## PRESENTATION TIPS

- **Time:** 15-20 minutes + 5 min Q&A
- **Slides:** 20-25 slides
- **Color:** Blue primary (#2563EB)
- **Font:** 12-14pt minimum
- **Practice:** Rehearse 2-3 times

---

## QUICK CHECKLIST

- [ ] Screenshots ready
- [ ] Use Case Diagram created
- [ ] Database schema diagram
- [ ] Test cases documented
- [ ] PPT created
- [ ] Rehearsed
- [ ] Backup ready

