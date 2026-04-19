# MongoDB Database Schema Design - DOXI Healthcare Platform

This document outlines the database structure for the DOXI system, including collection schemas, data types, and relationships.

## 1. Users Collection
Primary collection for all users (Patients, Doctors, and Administrators).

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique user identifier | `64f1a2b3c9e...` |
| `name` | String | Yes | Full name of the user | `"Dr. Rahul Patel"` |
| `email` | String | Yes | Unique, lowercase email address | `"rahul@doxi.com"` |
| `password` | String | Yes | Bcrypt hashed password | `"$2a$12$K..."` |
| `role` | String | Yes | Role: `patient`, `doctor`, or `admin` | `"doctor"` |
| `phone` | String | No | Contact mobile number | `"9876543210"` |
| `gender` | String | No | `male`, `female`, or `other` | `"male"` |
| `isApproved` | Boolean | Yes | Approval status (auto-true for patients/admin) | `true` |
| `specialization` | String | No | Doctor's medical specialization | `"Cardiologist"` |
| `experience` | String | No | Years of medical experience | `"12 Years"` |
| `bookingFee` | Number | No | Total fee charged to the patient | `800` |
| `googleId` | String | No | Unique identifier for Google OAuth | `"10923847..."` |
| `isDeleted` | Boolean | Yes | Soft delete flag | `false` |
| `createdAt` | Date | Yes | Timestamp of account creation | `2024-04-19T...` |
| `updatedAt` | Date | Yes | Timestamp of last profile update | `2024-04-19T...` |

---

## 2. Doctors Collection
Auxiliary collection for extended doctor professional info.

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique record identifier | `64f2b3c4d5e...` |
| `user` | ObjectId | Yes | Reference to the `Users` collection | `64f1a2b3c9e...` |
| `bio` | String | No | Professional biography/summary | `"Expert in heart surgery..."` |
| `qualification` | String | No | Academic degrees (MBBS, MD, etc.) | `"MBBS, MD (Cardio)"` |
| `licenseNo` | String | No | Medical registration/license number | `"MCI-12345"` |
| `clinicHospitalName`| String | No | Name of the primary workplace | `"City Heart Clinic"` |
| `createdAt` | Date | Yes | Record creation timestamp | `2024-04-19T...` |
| `updatedAt` | Date | Yes | Last update timestamp | `2024-04-19T...` |

---

## 3. Appointments Collection
Manages booking lifecycle and payments.

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique appointment ID | `64f3c4d5e6f...` |
| `patient` | ObjectId | Yes | Reference to `Users` (Patient) | `64f1a2b3c9a...` |
| `doctor` | ObjectId | Yes | Reference to `Users` (Doctor) | `64f1a2b3c9e...` |
| `appointmentDate` | Date | Yes | Date of the scheduled visit | `2024-05-10` |
| `startTime` | String | Yes | Starting time slot | `"10:30 AM"` |
| `endTime` | String | Yes | Ending time slot | `"11:00 AM"` |
| `status` | String | Yes | `pending`, `confirmed`, `completed`, `cancelled` | `"confirmed"` |
| `paymentStatus` | String | Yes | `pending`, `completed`, `failed`, `refunded` | `"completed"` |
| `totalFee` | Number | Yes | Total fee at point of booking | `800` |
| `onlineAmount` | Number | Yes | Amount paid online (Platform Fee) | `160` |
| `clinicAmount` | Number | Yes | Remaining amount to pay at clinic | `640` |
| `razorpayOrderId` | String | No | Razorpay order reference | `"order_Np...2"` |
| `createdAt` | Date | Yes | Booking timestamp | `2024-04-19T...` |
| `updatedAt` | Date | Yes | Last status change timestamp | `2024-04-19T...` |

---

## 4. Availability Collection
Doctor schedules and leaves.

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique availability ID | `64f4d5e6f7g...` |
| `doctor` | ObjectId | Yes | Reference to `Users` (Doctor) | `64f1a2b3c9e...` |
| `type` | String | Yes | `schedule` or `leave` | `"schedule"` |
| `dayOfWeek` | Number | No | Day of week (0-6) | `1` |
| `startTime` | String | No | Shift start | `"09:00"` |
| `endTime` | String | No | Shift end | `"17:00"` |
| `startDate` | Date | No | Specific date for leave | `2024-12-25` |
| `appointmentDuration`| Number | No | Slot length (minutes) | `30` |
| `isActive` | Boolean | Yes | Entry status | `true` |
| `createdAt` | Date | Yes | Creation timestamp | `2024-04-19T...` |

---

## 5. Reviews Collection
Patient feedback for doctors.

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique review ID | `64f5e6f7g8h...` |
| `patient` | ObjectId | Yes | Reference to `Users` (Patient) | `64f1a2b3c9a...` |
| `doctor` | ObjectId | Yes | Reference to `Users` (Doctor) | `64f1a2b3c9e...` |
| `appointment` | ObjectId | No | Associated `Appointment` ID | `64f3c4d5e6f...` |
| `rating` | Number | Yes | Rating (1-5) | `5` |
| `comment` | String | No | Feedback text | `"Great experience!"` |
| `createdAt` | Date | Yes | Creation timestamp | `2024-04-19T...` |

---

## 6. Notifications Collection
System alerts and messages.

| Field Name | Data Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Yes | Unique notification ID | `64f6g7h8i9j...` |
| `user` | ObjectId | Yes | Recipient user | `64f1a2b3c9a...` |
| `type` | String | Yes | Category | `"appointment_booked"` |
| `message` | String | Yes | Alert text | `"New booking received"` |
| `isRead` | Boolean | Yes | Read status | `false` |
| `createdAt` | Date | Yes | Sent timestamp | `2024-04-19T...` |

---

## Relationship Diagram (Simplified)
- **Users** is the central collection.
- **Doctors** references **Users** (`_id`).
- **Appointments** references **Users** (as both `patient` and `doctor`).
- **Availability** references **Users** (`doctor`).
- **Reviews** references **Users** (`patient` and `doctor`) and **Appointments**.
- **Notifications** references **Users** (`user`).

## General Configuration
- **Soft Delete**: Many collections use `isDeleted` with a pre-find hook to filter out inactive records.
- **Timestamps**: Automatically managed by Mongoose to track data lifecycle.
