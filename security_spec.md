# Firestore Security Specification - Telehealth Management System

This specification outlines the data invariants, threat model, and corresponding rulesets designed to prevent unauthorized spoofing, privilege escalation, or resource poisoning in the Telehealth App.

## 1. Data Invariants

- **User Profiles (`users/{userId}`)**:
  - Only the authenticated owner may write or update their profile details (`request.auth.uid == userId`).
  - Users are forbidden from self-promoted escalation of roles (e.g., changing their `role` to `staff` or `admin`).
  - Medical staff / Admin may inspect profiles to verify Health Insurance Cards.

- **Appointments (`appointments/{appointmentId}`)**:
  - Patients can create and read their own appointments.
  - Patients are of role `patient` and the `patientId` must match their UID.
  - Staff and Administrators can read all appointments, modify the appointment `status`, assign a `queueNumber`, and insert a `staffNote`.
  - Once an appointment's status reaches a terminal state (e.g. `已完成`, `已取消`), it is locked against further client modification (Terminal State Locking).

- **Departments & Doctors (`departments/{id}`, `doctors/{id}`)**:
  - Anyone can read the list of departments and doctors to complete their booking.
  - Only authorized clinic administrators (`admin` or `staff`) can write, modify, or delete them.

---

## 2. The "Dirty Dozen" Threat Payloads

The following payloads represent illegal or malicious attempts to bypass state logic or security boundaries. These must be rejected with `PERMISSION_DENIED`:

1. **Identity Spoofing**: Patient `user_A` trying to create or modify `users/user_B`.
2. **Admin Privilege Escalation**: Patient `user_A` setting `"role": "admin"` in their own profile document.
3. **Impersonate Patient in Appointments**: Patient `user_A` booking an appointment with `patientId: "user_B"`.
4. **Illegal State Modification by Patient**: Patient updating slot status directly to `已完成` or `已確認` without staff authorization.
5. **Unauthorized Queue Manipulation**: Patient altering their own `queueNumber` to skip the line.
6. **Malicious Administrative Injection**: Normal patient executing write operations to `doctors/{docId}` or `departments/{deptId}` collections.
7. **Terminal State Sabotage**: Patient or staff attempting to update details of an appointment that is already marked as `已完成` or `已取消`.
8. **Shadow Field Injection**: Writing an appointment with unauthorized fields (e.g., `isVip: true` or `discount: 100`).
9. **Falsified Timestamp**: Submitting a client-controlled `createdAt` timestamp instead of relying on the Firestore server timestamp (`request.time`).
10. **Resource Exhaustion Attack (ID Poisoning)**: Submitting junk strings of 1MB as a document ID.
11. **Unauthorized PII Access**: Unauthenticated guests reading details from `users/{userId}` database.
12. **PII Bulk Harvesting**: Patient trying to list/query the entire `users` collection.

---

## 3. Security Rules Draft (firestore.rules)

Our rules will reject all of the above payloads. (See `/firestore.rules`).
