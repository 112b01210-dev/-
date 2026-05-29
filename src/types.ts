/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'patient' | 'staff' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  birthday?: string;
  nhiNumber?: string;
  nhiPhotoUrl?: string; // Base64 dataURL in demo or mock storage URL
  role: UserRole;
  createdAt: string;
}

export type AppointmentStatus = '待確認' | '已確認' | '候診中' | '看診中' | '已完成' | '已取消';

export interface Appointment {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientBirthday?: string;
  patientNhiNumber?: string;
  patientNhiPhotoUrl?: string;
  department: string;
  doctorId: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  chiefComplaint: string;
  isFirstVisit: boolean;
  status: AppointmentStatus;
  queueNumber?: number;
  staffNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  doctorId: string;
  name: string;
  department: string; // matches Department.name or departmentId
  isAvailable: boolean;
}

export interface Department {
  departmentId: string;
  name: string;
  description: string;
}

export interface ClinicTimeSlot {
  slotId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., "09:00 - 09:30"
  capacity: number;
  registered: number;
}
