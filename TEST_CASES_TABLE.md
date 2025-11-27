# DOXI - Important Test Cases for PPT
## Table Format for Presentation

---

## **Test Cases Table**

| **Test Case Name** | **Precondition** | **Test Steps** | **Expected Result** |
|-------------------|------------------|---------------|---------------------|
| **Appointment Booking Flow** | Patient logged in, Doctor available and approved | 1. Navigate to Find Doctor page<br>2. Search and select a doctor<br>3. Click "Book Appointment"<br>4. Select date (not Sunday, not leave date)<br>5. Select available time slot<br>6. Click "Book Appointment" | Appointment request created with status "pending", notification sent to doctor, patient sees confirmation message |
| **Appointment Booking Restrictions (Sunday & Leave Dates)** | Patient logged in, Doctor has set leave dates | 1. Navigate to Book Appointment page<br>2. Try to select Sunday date<br>3. Try to select doctor's leave date | Sunday dates are disabled/grayed out in calendar, Leave dates are disabled/grayed out, Error message displayed if user tries to book |
| **Doctor Approval Workflow** | Admin logged in, Doctor registration pending | 1. Navigate to Admin Dashboard<br>2. Go to "Manage Doctors"<br>3. Find pending doctor registration<br>4. Review doctor details<br>5. Click "Approve" button | Doctor status changed to "approved", Doctor can now login, Notification sent to doctor, Doctor appears in patient's search results |
| **Role-Based Access Control (RBAC)** | Different users logged in (Patient, Doctor, Admin) | 1. Patient tries to access /admin/dashboard<br>2. Doctor tries to access /admin/dashboard<br>3. Admin accesses /admin/dashboard<br>4. Patient tries to access /doctor/appointments | Patient redirected to Unauthorized page (403), Doctor redirected to Unauthorized page (403), Admin successfully accesses dashboard, Patient cannot access doctor routes |

---

## **Test Case Details (Expanded)**

### **TC-001: Appointment Booking Flow**
**Priority:** High  
**Type:** Functional Test  
**Module:** Appointment Management  
**Description:** Tests the complete end-to-end appointment booking process from patient perspective

**Detailed Steps:**
1. Patient logs into the system
2. Navigates to "Find Doctor" page
3. Searches for a doctor by name or specialization
4. Views doctor profile with ratings and availability
5. Clicks "Book Appointment" button
6. Calendar opens showing available dates (Sundays and leave dates disabled)
7. Selects a valid date
8. Selects an available time slot
9. Clicks "Book Appointment" to confirm
10. System creates appointment with status "pending"

**Expected Results:**
- ✅ Appointment created successfully
- ✅ Status set to "pending"
- ✅ Notification sent to doctor
- ✅ Patient sees success message
- ✅ Appointment appears in patient's appointment list

---

### **TC-002: Appointment Booking Restrictions**
**Priority:** High  
**Type:** Business Logic Test  
**Module:** Appointment Validation  
**Description:** Validates that appointments cannot be booked on Sundays or doctor leave dates

**Business Rules:**
- No appointments allowed on Sundays
- No appointments allowed on doctor's leave dates
- Calendar should visually disable these dates

**Test Scenarios:**
1. **Sunday Restriction:**
   - Navigate to booking calendar
   - All Sunday dates should be disabled/grayed out
   - Clicking Sunday should show error or be prevented

2. **Leave Date Restriction:**
   - Doctor sets leave dates (e.g., Dec 25-27)
   - Patient tries to book on Dec 26
   - Date should be disabled in calendar
   - Error message: "Doctor is on leave on this date"

**Expected Results:**
- ✅ Sunday dates disabled in calendar
- ✅ Leave dates disabled in calendar
- ✅ Appropriate error messages displayed
- ✅ Booking prevented for restricted dates

---

### **TC-003: Doctor Approval Workflow**
**Priority:** High  
**Type:** Workflow Test  
**Module:** Admin Management  
**Description:** Tests the complete doctor registration approval process

**Workflow:**
1. Doctor registers with license number (format: XX/YYYY/XXXXX)
2. Doctor account created with `isApproved: false`
3. Admin reviews doctor registration
4. Admin approves/rejects doctor

**Test Steps:**
1. Admin logs into admin panel
2. Navigates to "Manage Doctors" section
3. Views list of pending doctors
4. Clicks on a pending doctor to view details
5. Reviews doctor information (license, specialization, experience)
6. Clicks "Approve" button
7. Confirms approval action

**Expected Results:**
- ✅ Doctor status updated to `isApproved: true`
- ✅ `approvedAt` timestamp set
- ✅ `approvedBy` set to admin user ID
- ✅ Notification sent to doctor
- ✅ Doctor can now login to system
- ✅ Doctor appears in patient search results

---

### **TC-004: Role-Based Access Control**
**Priority:** Critical  
**Type:** Security Test  
**Module:** Authentication & Authorization  
**Description:** Validates that users can only access routes permitted for their role

**Access Matrix:**

| User Role | Allowed Routes | Restricted Routes |
|-----------|---------------|-------------------|
| **Patient** | /patient/*, /find-doctor, /book-appointment | /admin/*, /doctor/* |
| **Doctor** | /doctor/*, /doctor/appointments, /doctor/availability | /admin/*, /patient/* (some) |
| **Admin** | /admin/*, /admin/dashboard, /admin/doctors | /patient/*, /doctor/* (some) |

**Test Scenarios:**

1. **Patient Access Test:**
   - Patient logged in
   - Tries to access `/admin/dashboard`
   - Expected: Redirected to `/unauthorized` or 403 page

2. **Doctor Access Test:**
   - Doctor logged in
   - Tries to access `/admin/doctors`
   - Expected: Redirected to `/unauthorized` or 403 page

3. **Admin Access Test:**
   - Admin logged in
   - Accesses `/admin/dashboard`
   - Expected: Successfully loads admin dashboard

4. **Cross-Role Protection:**
   - Patient tries to access `/doctor/appointments`
   - Expected: Access denied, redirected

**Expected Results:**
- ✅ Unauthorized access attempts blocked
- ✅ Users redirected to appropriate error page
- ✅ No sensitive data exposed to unauthorized users
- ✅ JWT token validated for role-based access
- ✅ Middleware correctly enforces RBAC rules

---

## **Test Summary Statistics**

| **Category** | **Count** |
|-------------|-----------|
| **Total Test Cases** | 4 |
| **Functional Tests** | 2 |
| **Business Logic Tests** | 1 |
| **Security Tests** | 1 |
| **Priority: High** | 3 |
| **Priority: Critical** | 1 |

---

## **Notes for PPT Presentation**

1. **TC-001** demonstrates the **core functionality** of the application
2. **TC-002** showcases **unique business rules** (Sunday/Leave restrictions)
3. **TC-003** shows **multi-role interaction** (Admin-Doctor workflow)
4. **TC-004** validates **security implementation** (RBAC)

**Presentation Tips:**
- Use this table format directly in PPT
- Add screenshots for each test case
- Show actual vs expected results
- Highlight the business logic in TC-002
- Emphasize security in TC-004

---

