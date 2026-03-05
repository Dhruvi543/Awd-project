# DOXI PPT - Quick Summary
## All Information in One Place

---

## PROJECT DEFINITION

**DOXI (Digital Online eXperience Interface)** is a **Healthcare Management System** - a web-based platform that connects Patients, Doctors, and Administrators for appointment booking and management.

**Purpose:** Digital transformation of healthcare appointment booking with centralized platform, real-time management, and transparent reviews.

---

## TECHNOLOGY USED

### Frontend:
- React 18.2.0
- Vite 5.0.0
- Tailwind CSS 3.3.0
- Material-UI 5.15.0
- Redux 5.0.0
- Redux-Saga 1.2.3
- React Router DOM 6.20.0
- Axios 1.6.0
- Zod 3.22.0

### Backend:
- Node.js 18+
- Express.js 4.18.2
- MongoDB (Mongoose 8.0.3)
- JWT 9.0.2
- bcryptjs 2.4.3
- Zod 3.22.4
- Helmet, CORS, Rate Limiting

### Stack: **MERN** (MongoDB, Express, React, Node.js)

---

## TOOLS USED

### Development:
- VS Code / WebStorm
- Git
- Node.js & npm
- Postman / Thunder Client
- Chrome DevTools

### Build:
- Vite
- Autoprefixer
- PostCSS

### Database:
- MongoDB Compass
- MongoDB Atlas (optional)

### Design:
- Draw.io / Lucidchart (for diagrams)

---

## DATABASE

**Type:** MongoDB (NoSQL)

**Collections (6):**
1. **Users** - All user accounts (Patient, Doctor, Admin)
2. **Appointments** - Appointment bookings
3. **Reviews** - Patient reviews and ratings
4. **Availability** - Doctor schedules and leave dates
5. **Notifications** - Real-time notifications
6. **Settings** - System configuration

**Relationships:** One-to-Many (User → Appointments, Reviews, Notifications, Availability)

---

## USERS (3 ROLES)

### 1. PATIENT
- Register, Login
- Search Doctors
- Book Appointments
- View Appointments
- Cancel Appointments
- Rate & Review Doctors
- View Notifications
- Profile Management

### 2. DOCTOR
- Register (Pending Approval)
- Login (After Approval)
- Set Availability Schedule
- Set Leave Dates
- Manage Appointments (Confirm/Reject/Complete)
- Add Prescriptions
- View Reviews
- View Notifications
- Dashboard Statistics

### 3. ADMINISTRATOR
- Admin Login
- Dashboard Analytics
- Manage Doctors (Approve/Reject/CRUD)
- Manage Patients (View/Update/Delete)
- View All Appointments
- View All Reviews
- System Statistics

---

## FRONTEND

**Framework:** React 18.2.0
**Build Tool:** Vite 5.0
**Routing:** React Router DOM 6.20.0
**State:** Redux 5.0 + Redux-Saga 1.2.3
**Styling:** Tailwind CSS 3.3.0 + Material-UI 5.15.0
**HTTP:** Axios 1.6.0

**Structure:**
- Components (30+ reusable components)
- Pages (20+ page components)
- Contexts (Auth, Theme)
- API Service Layer
- Routes (25+ protected/public routes)

**Features:**
- Responsive Design (Mobile-first)
- Dark Mode Support
- Form Validation
- JWT Authentication
- Role-Based Access Control

---

## BACKEND

**Framework:** Express.js 4.18.2
**Runtime:** Node.js 18+
**Database:** MongoDB (Mongoose 8.0.3)
**Pattern:** MVC (Model-View-Controller)
**API:** RESTful API

**Structure:**
- Models (6 database models)
- Controllers (7 business logic controllers)
- Routes (7 API route files)
- Middleware (Auth, RBAC, Error Handling)
- Security (Helmet, CORS, Rate Limiting)

**Features:**
- JWT Authentication
- Role-Based Access Control (RBAC)
- Data Validation (Zod)
- Security (Password Hashing, XSS Prevention)
- Error Handling
- Business Logic (Appointment Validation, Notifications)

**API Endpoints:**
- Authentication: `/api/auth/*`
- Users: `/api/user/*`
- Appointments: `/api/appointments/*`
- Doctors: `/api/doctors/*`
- Admin: `/api/admin/*`
- Reviews: `/api/reviews/*`
- Notifications: `/api/notifications/*`

---

## KEY STATISTICS

- **Total Files:** 144 files
- **Total Folders:** 61 folders
- **Frontend Files:** 73 files
- **Backend Files:** 30 files
- **Database Collections:** 6
- **User Roles:** 3 (Patient, Doctor, Admin)
- **Appointment Statuses:** 4 (Pending, Confirmed, Completed, Cancelled)

---

## FOR PPT SLIDES

### Slide 1: Project Definition
- DOXI = Healthcare Management System
- MERN Stack Web Application
- Connects Patients, Doctors, Administrators

### Slide 2: Technology Used
- Frontend: React, Vite, Tailwind, MUI, Redux
- Backend: Node.js, Express, MongoDB, JWT
- Stack: MERN

### Slide 3: Tools Used
- Development: VS Code, Git, Postman
- Build: Vite
- Database: MongoDB Compass

### Slide 4: Database
- MongoDB (NoSQL)
- 6 Collections: Users, Appointments, Reviews, Availability, Notifications, Settings

### Slide 5: Users
- 3 Roles: Patient, Doctor, Administrator
- Each with distinct features and permissions

### Slide 6: Frontend
- React 18.2.0
- 30+ Components, 20+ Pages
- Responsive, Dark Mode, Form Validation

### Slide 7: Backend
- Express.js 4.18.2
- RESTful API
- JWT Authentication, RBAC, Security

---

**Use `DOXI_PPT_TECHNICAL_DETAILS.md` for detailed information!**





