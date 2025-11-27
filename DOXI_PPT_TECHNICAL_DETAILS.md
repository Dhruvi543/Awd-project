# DOXI Project - Technical Details for PPT
## Complete Information: Technology, Tools, Database, Users, Frontend, Backend

---

## 1. PROJECT DEFINITION

### What is DOXI?

**DOXI (Digital Online eXperience Interface)** is a comprehensive **Healthcare Management System** - a web-based platform that digitizes and streamlines the entire healthcare appointment booking process.

### Project Overview:

DOXI is a **MERN Stack** web application that connects three primary user types:
- **Patients** - End users who need healthcare services
- **Doctors** - Healthcare providers who offer consultations
- **Administrators** - System managers who oversee the platform

### Core Purpose:

To eliminate the traditional, fragmented approach to healthcare appointments by providing:
- **Centralized Booking System** - One platform for all appointment needs
- **Real-time Management** - Instant updates and notifications
- **Transparent Reviews** - Patient feedback and doctor ratings
- **Smart Scheduling** - Automated availability and leave management
- **Secure Access** - Role-based authentication and authorization

### Problem Statement:

Traditional healthcare appointment systems face challenges:
- Manual booking processes are time-consuming
- Patients struggle to find available doctors
- Doctors face scheduling conflicts and administrative burden
- Lack of transparency in doctor ratings and reviews
- Fragmented systems across different healthcare facilities

### Solution:

DOXI provides a unified digital platform that:
- ✅ Enables 24/7 online appointment booking
- ✅ Automates schedule management for doctors
- ✅ Provides comprehensive search and filtering
- ✅ Facilitates transparent doctor-patient interactions
- ✅ Offers real-time notifications and updates
- ✅ Ensures secure, role-based access control

---

## 2. TECHNOLOGY USED

### Frontend Technologies:

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework for building interactive user interfaces |
| **React DOM** | 18.2.0 | React rendering library for web |
| **Vite** | 5.0.0 | Modern build tool and development server |
| **React Router DOM** | 6.20.0 | Client-side routing and navigation |
| **Redux** | 5.0.0 | State management library |
| **Redux-Saga** | 1.2.3 | Middleware for handling side effects and async operations |
| **Axios** | 1.6.0 | HTTP client for API requests |
| **Tailwind CSS** | 3.3.0 | Utility-first CSS framework for styling |
| **Material-UI (MUI)** | 5.15.0 | React component library for UI elements |
| **@emotion/react** | 11.11.0 | CSS-in-JS library (required by MUI) |
| **@emotion/styled** | 11.11.0 | Styled components library (required by MUI) |
| **Lodash** | 4.17.21 | JavaScript utility library |
| **Zod** | 3.22.0 | Schema validation library for forms |

### Backend Technologies:

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ (LTS) | JavaScript runtime environment |
| **Express.js** | 4.18.2 | Web application framework for Node.js |
| **MongoDB** | Latest | NoSQL database for data storage |
| **Mongoose** | 8.0.3 | MongoDB object modeling library (ODM) |
| **JSON Web Token (JWT)** | 9.0.2 | Authentication and authorization tokens |
| **bcryptjs** | 2.4.3 | Password hashing library for security |
| **Zod** | 3.22.4 | Schema validation for request validation |
| **Cookie Parser** | 1.4.6 | Parse HTTP cookies |
| **CORS** | 2.8.5 | Cross-Origin Resource Sharing middleware |
| **Helmet** | 7.1.0 | Security middleware for HTTP headers |
| **Express Rate Limit** | 7.1.5 | Rate limiting middleware for API protection |
| **Express Mongo Sanitize** | 2.2.0 | Data sanitization to prevent NoSQL injection |
| **Express XSS Sanitizer** | 2.0.1 | XSS attack prevention |
| **Morgan** | 1.10.0 | HTTP request logger middleware |
| **Compression** | 1.8.1 | Response compression middleware |
| **Day.js** | 1.11.10 | Date manipulation library |
| **Nodemailer** | 6.9.7 | Email sending library |
| **UUID** | 9.0.1 | Unique identifier generation |
| **Dotenv** | 16.3.1 | Environment variable management |

### Technology Stack Summary:

**Full Stack:** MERN Stack
- **M** - MongoDB (Database)
- **E** - Express.js (Backend Framework)
- **R** - React (Frontend Framework)
- **N** - Node.js (Runtime Environment)

**Architecture Pattern:**
- **Frontend:** Component-based architecture with Redux for state management
- **Backend:** RESTful API with MVC (Model-View-Controller) pattern
- **Database:** NoSQL document-based database (MongoDB)

---

## 3. TOOLS USED

### Development Tools:

| Tool | Purpose |
|------|---------|
| **VS Code / WebStorm** | Code editor and IDE for development |
| **Git** | Version control system for code management |
| **Node.js** | Runtime environment for JavaScript |
| **npm** | Package manager for installing dependencies |
| **Postman / Thunder Client** | API testing and debugging tool |
| **Chrome DevTools** | Browser developer tools for debugging |
| **ESLint** | Code linting and quality checking |
| **Prettier** | Code formatting tool |
| **Nodemon** | Development tool for auto-restarting server |

### Build & Deployment Tools:

| Tool | Purpose |
|------|---------|
| **Vite** | Fast build tool and development server |
| **Autoprefixer** | CSS post-processor for browser compatibility |
| **PostCSS** | CSS transformation tool |

### Design & Documentation Tools:

| Tool | Purpose |
|------|---------|
| **Draw.io / Lucidchart** | For creating UML diagrams (Use Case, ER diagrams) |
| **Microsoft PowerPoint / Google Slides** | For presentation creation |
| **Figma / Adobe XD** | UI/UX design (if used) |

### Database Tools:

| Tool | Purpose |
|------|---------|
| **MongoDB Compass** | GUI for MongoDB database management |
| **MongoDB Atlas** | Cloud database hosting (optional) |
| **Mongoose** | ODM for MongoDB schema definition |

### Testing Tools:

| Tool | Purpose |
|------|---------|
| **Browser DevTools** | Frontend testing and debugging |
| **Postman** | API endpoint testing |
| **Manual Testing** | User acceptance testing |

---

## 4. DATABASE

### Database Type:
**MongoDB** - NoSQL Document Database

### Database Structure:

#### **Collection 1: Users**
**Purpose:** Stores all user accounts (Patients, Doctors, Administrators)

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  name: String (required),
  email: String (required, unique, lowercase),
  password: String (hashed, required, minlength: 6),
  role: String (enum: 'patient', 'doctor', 'admin', default: 'patient'),
  firstName: String,
  lastName: String,
  gender: String (enum: 'male', 'female', 'other'),
  phone: String,
  // Doctor-specific fields:
  specialization: String,
  experience: String (0-50 years),
  qualification: String,
  location: String,
  licenseNo: String (format: XX/YYYY/XXXXX),
  clinicHospitalType: String (enum: 'clinic', 'hospital'),
  clinicHospitalName: String,
  isApproved: Boolean (default: false for doctors),
  approvedAt: Date,
  approvedBy: ObjectId (ref: User),
  rejectionReason: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `email` (unique index)
- `role` (for role-based queries)

---

#### **Collection 2: Appointments**
**Purpose:** Stores all appointment bookings between patients and doctors

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  patient: ObjectId (ref: User, required),
  doctor: ObjectId (ref: User, required),
  appointmentDate: Date (required),
  startTime: String (required, format: "HH:mm"),
  endTime: String (required, format: "HH:mm"),
  status: String (enum: 'pending', 'confirmed', 'completed', 'cancelled', default: 'pending'),
  consultationNotes: String,
  prescription: String,
  rejectionReason: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `patient` (for patient appointment queries)
- `doctor` (for doctor appointment queries)
- `appointmentDate` (for date-based queries)
- `status` (for status filtering)

---

#### **Collection 3: Reviews**
**Purpose:** Stores patient reviews and ratings for doctors

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  patient: ObjectId (ref: User, required),
  doctor: ObjectId (ref: User, required),
  appointment: ObjectId (ref: Appointment, optional),
  rating: Number (required, min: 1, max: 5),
  comment: String (maxlength: 500),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `doctor` (for doctor review queries)
- `patient` (for patient review queries)
- `rating` (for rating-based queries)

---

#### **Collection 4: Availability**
**Purpose:** Stores doctor availability schedules and leave dates

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  doctor: ObjectId (ref: User, required),
  type: String (enum: 'schedule', 'leave', required),
  // For weekly schedule:
  dayOfWeek: Number (0-6, where 0=Sunday, 6=Saturday),
  startTime: String (format: "HH:mm"),
  endTime: String (format: "HH:mm"),
  // For leave dates:
  startDate: Date,
  endDate: Date,
  reason: String,
  isActive: Boolean (default: true),
  appointmentDuration: Number (15-240 minutes),
  consultationType: String (enum: 'in-person', 'online', 'both', default: 'both'),
  maxAppointments: Number (min: 1),
  notes: String (maxlength: 500),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `doctor` (for doctor availability queries)
- `type` (for filtering schedules vs leaves)
- `dayOfWeek` (for weekly schedule queries)

---

#### **Collection 5: Notifications**
**Purpose:** Stores real-time notifications for all users

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  user: ObjectId (ref: User, required),
  type: String (enum: [
    'patient_registered',
    'doctor_registered',
    'appointment_booked',
    'appointment_request',
    'appointment_cancelled',
    'appointment_confirmed',
    'appointment_rejected',
    'appointment_updated',
    'appointment_deleted',
    'appointment_completed',
    'doctor_approved',
    'doctor_rejected',
    'system'
  ], default: 'system'),
  message: String (required),
  isRead: Boolean (default: false),
  link: String,
  relatedUser: ObjectId (ref: User),
  relatedAppointment: ObjectId (ref: Appointment),
  rejectionReason: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `user` (for user notification queries)
- `isRead` (for unread notification queries)
- `type` (for notification type filtering)

---

#### **Collection 6: Settings** (if exists)
**Purpose:** Stores system-wide configuration settings

**Schema Fields:**
```javascript
{
  _id: ObjectId (Auto-generated),
  key: String (unique, required),
  value: Mixed (any data type),
  description: String,
  updatedAt: Date (auto)
}
```

---

### Database Relationships:

1. **User → Appointments:** One-to-Many
   - One user (patient/doctor) can have multiple appointments

2. **User → Reviews:** One-to-Many
   - One user (patient) can give multiple reviews
   - One user (doctor) can receive multiple reviews

3. **User → Availability:** One-to-Many
   - One doctor can have multiple availability entries

4. **User → Notifications:** One-to-Many
   - One user can have multiple notifications

5. **Appointment → Review:** One-to-One (Optional)
   - One appointment can have one review (optional)

6. **Appointment → Notification:** One-to-Many
   - One appointment can trigger multiple notifications

### Database Statistics:

- **Total Collections:** 6 main collections
- **Total Relationships:** 6 primary relationships
- **Database Type:** NoSQL (Document-based)
- **Connection:** MongoDB (Local or Atlas Cloud)

---

## 5. USERS (USER ROLES & FEATURES)

### User Types:

DOXI supports **3 primary user roles**, each with distinct features and permissions:

---

### **1. PATIENT (End User)**

**Registration:**
- Register with name, email, password
- Email validation (only .com extension allowed)
- Automatic account activation (no approval needed)

**Authentication:**
- Login with email and password
- JWT-based session management
- Secure password hashing

**Features:**
- ✅ **Search Doctors**
  - Search by doctor name
  - Filter by specialization
  - Filter by location
  - View doctor ratings and reviews

- ✅ **View Doctor Profile**
  - Doctor information (name, specialization, experience)
  - Qualifications and license number
  - Ratings and reviews from other patients
  - Availability schedule

- ✅ **Book Appointment**
  - Select doctor
  - Choose date (Sundays and leave dates disabled)
  - Select time slot
  - Submit appointment request

- ✅ **View Appointments**
  - View all appointments (pending, confirmed, completed, cancelled)
  - Filter by status
  - View appointment details (date, time, doctor, status)

- ✅ **Cancel Appointment**
  - Cancel pending or confirmed appointments
  - View cancellation confirmation

- ✅ **Rate & Review Doctors**
  - Rate doctor (1-5 stars)
  - Write review comment (max 500 characters)
  - View own reviews

- ✅ **View Notifications**
  - Real-time notifications for:
    - Appointment confirmations
    - Appointment rejections
    - Appointment cancellations
    - Appointment completions (with prescription)

- ✅ **Profile Management**
  - Update personal information
  - Change password
  - Update settings

- ✅ **Dashboard**
  - View appointment statistics
  - Upcoming appointments
  - Recent activity

---

### **2. DOCTOR (Healthcare Provider)**

**Registration:**
- Register with comprehensive information:
  - Personal details (name, email, password)
  - Professional details (specialization, experience, qualification)
  - License number (format: XX/YYYY/XXXXX)
  - Location and clinic/hospital information
- Email validation (only .com extension allowed)
- License number validation (regex pattern)
- Years of experience validation (0-50, numbers only)
- **Pending Admin Approval** - Cannot login until approved

**Authentication:**
- Login with email and password (only after approval)
- JWT-based session management
- Secure password hashing

**Features:**
- ✅ **Profile Management**
  - Update personal information
  - Update professional details
  - Update license number
  - Update clinic/hospital information

- ✅ **Set Availability Schedule**
  - Set weekly schedule (Monday to Saturday)
  - Define time slots (start time, end time)
  - Set appointment duration (15-240 minutes)
  - Set consultation type (in-person, online, both)
  - Set maximum appointments per day

- ✅ **Set Leave Dates**
  - Block specific dates (leave periods)
  - Set start date and end date
  - Add reason for leave
  - Sundays automatically blocked

- ✅ **View Appointment Requests**
  - View all appointment requests
  - Filter by status (pending, confirmed, completed, cancelled)
  - View patient information
  - View appointment date and time

- ✅ **Confirm Appointment**
  - Accept appointment requests
  - Notification sent to patient

- ✅ **Reject Appointment**
  - Reject appointment requests
  - Add rejection reason
  - Notification sent to patient

- ✅ **Complete Appointment**
  - Mark appointment as completed
  - Add consultation notes
  - Add prescription details
  - Notification sent to patient (with prescription)

- ✅ **View Reviews**
  - View all patient reviews
  - See ratings (1-5 stars)
  - Read review comments
  - View average rating

- ✅ **View Notifications**
  - Real-time notifications for:
    - New appointment requests
    - Appointment cancellations
    - Patient reviews
    - Admin approvals/rejections

- ✅ **Dashboard**
  - View appointment statistics
  - Today's schedule
  - Upcoming appointments
  - Recent reviews

- ✅ **Calendar View**
  - Visual calendar of all appointments
  - Monthly/weekly view

---

### **3. ADMINISTRATOR (System Manager)**

**Authentication:**
- Separate admin login page
- Admin credentials (pre-created)
- JWT-based session management

**Features:**
- ✅ **Dashboard Analytics**
  - Total patients count
  - Total doctors count
  - Total appointments count
  - Pending doctor approvals
  - System statistics and charts

- ✅ **Manage Doctors**
  - View all doctors (approved, pending, rejected)
  - Filter and search doctors
  - **Approve Doctor Registration**
    - Review doctor information
    - Approve doctor account
    - Doctor can login after approval
  - **Reject Doctor Registration**
    - Reject doctor account
    - Add rejection reason
    - Notification sent to doctor
  - **Create Doctor** (Manual)
    - Add new doctor account
    - Set all doctor information
  - **Update Doctor**
    - Edit doctor information
    - Update license number
    - Update approval status
  - **Delete Doctor**
    - Remove doctor account

- ✅ **Manage Patients**
  - View all patients
  - Filter and search patients
  - **Update Patient**
    - Edit patient information
  - **Delete Patient**
    - Remove patient account

- ✅ **View All Appointments**
  - View all appointments across system
  - Filter by status, date, doctor, patient
  - View appointment details

- ✅ **View All Reviews**
  - View all patient reviews
  - Filter by doctor, rating
  - View review details

- ✅ **View Availability**
  - View all doctor availability schedules
  - View leave dates

- ✅ **View Notifications**
  - System-wide notifications
  - User activity notifications

- ✅ **Settings Management**
  - Update system settings
  - Manage platform configuration

---

### User Role Summary:

| Feature | Patient | Doctor | Admin |
|---------|---------|--------|-------|
| Register | ✅ | ✅ (Pending Approval) | ❌ (Pre-created) |
| Login | ✅ | ✅ (After Approval) | ✅ |
| Search Doctors | ✅ | ❌ | ❌ |
| Book Appointment | ✅ | ❌ | ❌ |
| Manage Appointments | ✅ (Own) | ✅ (Own) | ✅ (All) |
| Set Availability | ❌ | ✅ | ❌ |
| Rate/Review | ✅ | ❌ | ❌ |
| View Reviews | ✅ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| Approve Doctors | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ✅ (Own) | ✅ (All) |

---

## 6. FRONTEND

### Frontend Architecture:

**Framework:** React 18.2.0 (Component-based architecture)
**Build Tool:** Vite 5.0 (Fast development and build)
**Routing:** React Router DOM 6.20.0 (Client-side routing)

### Frontend Structure:

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   │   ├── DoctorRegisterForm.jsx
│   │   │   └── PatientRegisterForm.jsx
│   │   ├── layout/          # Layout components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── DoctorLayout.jsx
│   │   │   ├── PatientLayout.jsx
│   │   │   ├── AuthLayout.jsx
│   │   │   └── Layout.jsx
│   │   ├── forms/           # Form components
│   │   ├── feedback/        # Feedback components (Toast, Loader)
│   │   └── navigation/      # Navigation components
│   ├── pages/               # Page components
│   │   ├── Admin/           # Admin pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Doctors.jsx
│   │   │   ├── Patients.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Analytics.jsx
│   │   │   └── Settings.jsx
│   │   ├── Doctor/          # Doctor pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Availability.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Notifications.jsx
│   │   ├── Patient/         # Patient pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FindDoctor.jsx
│   │   │   ├── BookAppointment.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── Reviews.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Notifications.jsx
│   │   ├── auth/            # Authentication pages
│   │   │   └── Auth.jsx
│   │   ├── Common/          # Common pages
│   │   │   ├── Doctors.jsx
│   │   │   ├── DoctorDetails.jsx
│   │   │   ├── NotFound.jsx
│   │   │   └── Unauthorized.jsx
│   │   └── LandingPage.jsx  # Landing page
│   ├── contexts/            # React Context providers
│   │   ├── AuthContext.jsx  # Authentication context
│   │   └── ThemeContext.jsx # Theme (dark/light mode) context
│   ├── api/                 # API service layer
│   │   └── apiService.js    # Axios instance and API calls
│   ├── common/              # Common utilities
│   │   ├── enums/           # Enumeration constants
│   │   │   └── enumConstant.js
│   │   └── cssClassesUtility/
│   ├── assets/              # Static assets
│   │   ├── images/          # Image files
│   │   ├── scss/            # SCSS stylesheets
│   │   └── svg/             # SVG icons
│   ├── App.jsx              # Main app component with routing
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

### Frontend Technologies Details:

#### **1. React 18.2.0**
- **Purpose:** UI framework for building interactive components
- **Features Used:**
  - Functional components with hooks
  - useState, useEffect, useContext hooks
  - Component composition
  - Props and state management

#### **2. Vite 5.0**
- **Purpose:** Modern build tool and development server
- **Features:**
  - Fast Hot Module Replacement (HMR)
  - Optimized production builds
  - ES modules support
  - Fast development server

#### **3. React Router DOM 6.20.0**
- **Purpose:** Client-side routing and navigation
- **Features:**
  - Route protection (ProtectedRoute component)
  - Public routes (PublicRoute component)
  - URL parameters
  - Navigation guards

#### **4. Redux 5.0 & Redux-Saga 1.2.3**
- **Purpose:** State management for complex application state
- **Features:**
  - Centralized state store
  - Action creators and reducers
  - Saga middleware for async operations
  - State persistence

#### **5. Axios 1.6.0**
- **Purpose:** HTTP client for API communication
- **Features:**
  - Request/response interceptors
  - Automatic token injection
  - Error handling
  - Request/response transformation

#### **6. Tailwind CSS 3.3.0**
- **Purpose:** Utility-first CSS framework
- **Features:**
  - Responsive design utilities
  - Dark mode support
  - Custom color palette
  - Utility classes for rapid UI development

#### **7. Material-UI (MUI) 5.15.0**
- **Purpose:** Pre-built React component library
- **Components Used:**
  - Buttons, Cards, Tables
  - Forms, Inputs, Selects
  - Icons, Typography
  - Dialogs, Modals

#### **8. Zod 3.22.0**
- **Purpose:** Schema validation for forms
- **Features:**
  - Form validation
  - Type-safe validation
  - Error messages

### Frontend Features:

1. **Responsive Design**
   - Mobile-first approach
   - Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
   - Responsive layouts for all screen sizes

2. **Dark Mode Support**
   - Theme context for dark/light mode
   - User preference-based theme switching
   - Consistent theming across components

3. **Form Validation**
   - Real-time validation
   - Email validation (.com only)
   - License number validation (XX/YYYY/XXXXX)
   - Years of experience validation (0-50, numbers only)
   - Password strength validation

4. **Authentication**
   - JWT token management
   - Protected routes
   - Role-based route access
   - Automatic token refresh

5. **State Management**
   - Redux for global state
   - Context API for theme and auth
   - Local state for component-specific data

6. **API Integration**
   - Centralized API service
   - Request/response interceptors
   - Error handling
   - Loading states

7. **User Experience**
   - Loading indicators
   - Toast notifications
   - Error messages
   - Success confirmations
   - Smooth transitions

### Frontend Statistics:

- **Total Files:** 73 source files
- **Components:** 30+ reusable components
- **Pages:** 20+ page components
- **Routes:** 25+ protected and public routes

---

## 7. BACKEND

### Backend Architecture:

**Framework:** Express.js 4.18.2 (Node.js web framework)
**Runtime:** Node.js 18+ (JavaScript runtime)
**Pattern:** MVC (Model-View-Controller) pattern
**API Type:** RESTful API

### Backend Structure:

```
backend/
├── src/
│   ├── models/              # Database models (Mongoose schemas)
│   │   ├── User.js          # User model (Patient, Doctor, Admin)
│   │   ├── Appointment.js   # Appointment model
│   │   ├── Review.js        # Review model
│   │   ├── Availability.js  # Availability model
│   │   ├── Notification.js  # Notification model
│   │   └── Setting.js       # Setting model (if exists)
│   ├── controllers/         # Business logic controllers
│   │   ├── auth.controller.js      # Authentication logic
│   │   ├── user.controller.js      # User profile management
│   │   ├── appointment.controller.js # Appointment management
│   │   ├── doctor.controller.js    # Doctor-specific operations
│   │   ├── admin.controller.js     # Admin operations
│   │   ├── review.controller.js    # Review management
│   │   └── notification.controller.js # Notification management
│   ├── routes/              # API route definitions
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── appointment.routes.js
│   │   ├── doctor.routes.js
│   │   ├── admin.routes.js
│   │   ├── review.routes.js
│   │   └── notification.routes.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # JWT authentication middleware
│   │   ├── rbac.js          # Role-based access control
│   │   ├── error.js         # Error handling middleware
│   │   └── apiLogger.js     # API request logging
│   ├── config/              # Configuration files
│   │   ├── db.js            # Database connection
│   │   └── env.js           # Environment variables
│   ├── utils/               # Utility functions
│   │   └── asyncHandler.js  # Async error handler wrapper
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point
├── package.json             # Dependencies and scripts
└── .env                     # Environment variables
```

### Backend Technologies Details:

#### **1. Node.js 18+**
- **Purpose:** JavaScript runtime environment
- **Features:**
  - Server-side JavaScript execution
  - Event-driven, non-blocking I/O
  - NPM package management

#### **2. Express.js 4.18.2**
- **Purpose:** Web application framework
- **Features:**
  - RESTful API endpoints
  - Middleware support
  - Route handling
  - Request/response handling

#### **3. MongoDB & Mongoose 8.0.3**
- **Purpose:** Database and ODM (Object Data Modeling)
- **Features:**
  - Schema definition
  - Data validation
  - Relationship management
  - Query building

#### **4. JSON Web Token (JWT) 9.0.2**
- **Purpose:** Authentication and authorization
- **Features:**
  - Token generation
  - Token verification
  - Cookie-based storage
  - Header-based storage

#### **5. bcryptjs 2.4.3**
- **Purpose:** Password hashing
- **Features:**
  - Secure password encryption
  - Salt rounds (12)
  - Password comparison

#### **6. Zod 3.22.4**
- **Purpose:** Request validation
- **Features:**
  - Schema validation
  - Type checking
  - Error messages

#### **7. Security Middleware:**
- **Helmet 7.1.0:** HTTP security headers
- **CORS 2.8.5:** Cross-origin resource sharing
- **Express Rate Limit 7.1.5:** API rate limiting
- **Express Mongo Sanitize 2.2.0:** NoSQL injection prevention
- **Express XSS Sanitizer 2.0.1:** XSS attack prevention

#### **8. Other Middleware:**
- **Morgan 1.10.0:** HTTP request logging
- **Compression 1.8.1:** Response compression
- **Cookie Parser 1.4.6:** Cookie parsing

### Backend API Endpoints:

#### **Authentication Routes:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/admin-login` - Admin login

#### **User Routes:**
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `PUT /api/user/password` - Change password

#### **Appointment Routes:**
- `POST /api/appointments` - Book appointment
- `GET /api/appointments` - Get appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

#### **Doctor Routes:**
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/:id/availability` - Get doctor availability

#### **Admin Routes:**
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/doctors` - Get all doctors
- `POST /api/admin/doctors` - Create doctor
- `PUT /api/admin/doctors/:id` - Update doctor
- `DELETE /api/admin/doctors/:id` - Delete doctor
- `PUT /api/admin/doctors/:id/approve` - Approve doctor
- `PUT /api/admin/doctors/:id/reject` - Reject doctor
- `GET /api/admin/patients` - Get all patients
- `PUT /api/admin/patients/:id` - Update patient
- `DELETE /api/admin/patients/:id` - Delete patient

#### **Review Routes:**
- `POST /api/reviews` - Create review
- `GET /api/reviews` - Get reviews
- `GET /api/reviews/doctor/:doctorId` - Get doctor reviews

#### **Notification Routes:**
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read

### Backend Features:

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (RBAC)
   - Secure password hashing
   - Token validation middleware

2. **Data Validation**
   - Zod schema validation
   - Email validation (.com only)
   - License number validation (XX/YYYY/XXXXX)
   - Input sanitization

3. **Security**
   - Helmet for security headers
   - CORS configuration
   - Rate limiting
   - XSS and NoSQL injection prevention
   - Password encryption

4. **Error Handling**
   - Centralized error handling
   - Custom error messages
   - Error logging

5. **Business Logic**
   - Appointment booking validation
   - Sunday and leave date blocking
   - Doctor approval workflow
   - Notification generation

6. **Database Operations**
   - CRUD operations
   - Data relationships
   - Query optimization
   - Indexing

### Backend Statistics:

- **Total Files:** 30 source files
- **Controllers:** 7 controllers
- **Routes:** 7 route files
- **Models:** 6 database models
- **Middleware:** 4 custom middleware

---

## SUMMARY

### Technology Stack:
- **Frontend:** React, Vite, Tailwind CSS, Material-UI, Redux, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT
- **Tools:** VS Code, Git, Postman, MongoDB Compass
- **Database:** MongoDB (6 collections)

### User Roles:
- **Patient:** Search, book, review, manage appointments
- **Doctor:** Set availability, manage appointments, add prescriptions
- **Admin:** Manage users, approve doctors, view analytics

### Project Definition:
Healthcare Management System - MERN stack web application for appointment booking and management

---

**This document contains all the information you need for your PPT presentation!**




