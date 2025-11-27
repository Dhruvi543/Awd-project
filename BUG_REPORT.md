# DOXI Bug Report & QA Findings

**Date:** 2025-11-26
**Tester:** Antigravity

---

## 🔴 Critical Issues
*(Issues that crash the app, block core functionality, or cause data loss)*

- None found so far.

## 🟠 High Severity
*(Major functionality broken, significant UI distortions)*

- None found so far.

## 🟡 Medium Severity
*(Minor functional issues, noticeable UI glitches, missing validations)*

### 1. Doctor Registration Form Focus Issues
- **Severity:** Medium
- **Location:** `/register` (Doctor Role)
- **Steps to Reproduce:**
  1. Select "Doctor" role.
  2. Fill out the form.
  3. Attempt to focus on Password/Confirm Password fields using keyboard navigation or specific element selectors.
- **Expected Result:** Fields should be easily focusable.
- **Actual Result:** Automated tools had difficulty focusing on these fields, suggesting potential accessibility or DOM structure issues.
- **Notes:** Required manual intervention (re-entering data) to complete registration.

## � Low Severity
*(Typos, alignment issues, minor cosmetic problems)*

### 2. Console Warnings
- **Severity:** Low
- **Location:** All Pages
- **Details:** React Router future flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) and autocomplete attribute warnings on the registration page.

---

## 📝 Detailed Findings

### 1. Patient Registration
- **Status:** ✅ Pass
- **Notes:** Registration successful, auto-login to dashboard worked perfectly.

### 2. Doctor Registration
- **Status:** ✅ Pass
- **Notes:** Registration successful, correctly showed "Account Pending Approval" message.

---

## 💡 Suggested Improvements
*(UX enhancements, performance optimizations, code quality)*

- **Accessibility:** Improve form field accessibility to ensure screen readers and keyboard navigation work smoothly (related to the focus issue).
- **Console Cleanup:** Address React Router warnings to keep the console clean.
