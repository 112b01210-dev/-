/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db, isUsingMock, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Appointment, Doctor, Department, ClinicTimeSlot, AppointmentStatus } from '../types';

// Pre-populated high-fidelity default clinical data for class demonstrations
const DEFAULT_DEPARTMENTS: Department[] = [
  { departmentId: 'dept_fm', name: '家醫科', description: '提供全家人的基礎醫療服務、慢性病諮詢與一般感冒診斷。' },
  { departmentId: 'dept_peds', name: '小兒科', description: '針對新生兒、幼兒及青少年之一般疾病與疫苗預設看診。' },
  { departmentId: 'dept_ent', name: '耳鼻喉科', description: '專治耳、鼻、喉之急性發炎、過敏性鼻炎與聽力評估。' },
  { departmentId: 'dept_im', name: '內科', description: '心血管、內分泌、胃腸肝膽照護與一般內科症狀。' },
  { departmentId: 'dept_derm', name: '皮膚科', description: '溼疹、蕁麻疹、青春痘、皮膚過敏與視訊外觀診斷。' },
];

const DEFAULT_DOCTORS: Doctor[] = [
  { doctorId: 'doc_lin', name: '林曉明 醫師', department: '家醫科', isAvailable: true },
  { doctorId: 'doc_chen', name: '陳美麗 醫師', department: '小兒科', isAvailable: true },
  { doctorId: 'doc_chang', name: '張正宇 醫師', department: '耳鼻喉科', isAvailable: true },
  { doctorId: 'doc_hsu', name: '許自強 醫師', department: '內科', isAvailable: true },
  { doctorId: 'doc_huang', name: '黃瓊慧 醫師', department: '皮膚科', isAvailable: true },
];

// Pre-populated test appointments for immediate hospital backoffice visibility in classrooms
const CURRENT_DATE = new Date().toISOString().split('T')[0];

const createDemoAppointments = (): Appointment[] => [
  {
    appointmentId: 'appt_demo_1',
    patientId: 'patient_demo_1',
    patientName: '陳大同',
    patientBirthday: '1985-04-12',
    patientNhiNumber: '1023456789',
    patientNhiPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
    department: '家醫科',
    doctorId: 'doc_lin',
    doctorName: '林曉明 醫師',
    date: CURRENT_DATE,
    timeSlot: '09:00 - 09:30',
    chiefComplaint: '咳嗽已持續三天，喉嚨痛且微燒。希望視訊開藥並評估。',
    isFirstVisit: false,
    status: '候診中',
    queueNumber: 1,
    staffNote: '病人健保卡照片清晰，資料相符。線上等候中。',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    appointmentId: 'appt_demo_2',
    patientId: 'patient_demo_2',
    patientName: '李小美',
    patientBirthday: '2019-08-23',
    patientNhiNumber: '2987654321',
    patientNhiPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300',
    department: '小兒科',
    doctorId: 'doc_chen',
    doctorName: '陳美麗 醫師',
    date: CURRENT_DATE,
    timeSlot: '09:30 - 10:00',
    chiefComplaint: '肚子痛、輕微腹瀉兩次。活動力正常，無發燒。',
    isFirstVisit: true,
    status: '待確認',
    queueNumber: 2,
    staffNote: '初診看診，父母親陪同，需查驗健保卡正本。',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    appointmentId: 'appt_demo_3',
    patientId: 'patient_demo_3',
    patientName: '王建國',
    patientBirthday: '1956-11-05',
    patientNhiNumber: '1112223334',
    patientNhiPhotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
    department: '耳鼻喉科',
    doctorId: 'doc_chang',
    doctorName: '張正宇 醫師',
    date: CURRENT_DATE,
    timeSlot: '10:00 - 10:30',
    chiefComplaint: '慢性過敏回診，最近流鼻水症狀變嚴重，希望加開抗組織胺。',
    isFirstVisit: false,
    status: '已確認',
    queueNumber: 3,
    staffNote: '慢性定額回診，健保卡OK。',
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize localStorage if it is empty to guarantee demonstration data out-of-the-box
const initLocalStore = () => {
  if (!localStorage.getItem('sunshine_departments')) {
    localStorage.setItem('sunshine_departments', JSON.stringify(DEFAULT_DEPARTMENTS));
  }
  if (!localStorage.getItem('sunshine_doctors')) {
    localStorage.setItem('sunshine_doctors', JSON.stringify(DEFAULT_DOCTORS));
  }
  if (!localStorage.getItem('sunshine_appointments')) {
    localStorage.setItem('sunshine_appointments', JSON.stringify(createDemoAppointments()));
  }
};

initLocalStore();

export const dbService = {
  // ==================== USER PROFILES ====================

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isUsingMock || !db) {
      const usersRaw = localStorage.getItem('sunshine_profiles');
      const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];
      return users.find(u => u.uid === uid) || null;
    }

    const path = `users/${uid}`;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return null;
    }
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isUsingMock || !db) {
      const usersRaw = localStorage.getItem('sunshine_profiles');
      const users: UserProfile[] = usersRaw ? JSON.parse(usersRaw) : [];
      const index = users.findIndex(u => u.uid === profile.uid);
      if (index >= 0) {
        users[index] = { ...users[index], ...profile };
      } else {
        users.push(profile);
      }
      localStorage.setItem('sunshine_profiles', JSON.stringify(users));
      return;
    }

    const path = `users/${profile.uid}`;
    try {
      const docRef = doc(db, 'users', profile.uid);
      await setDoc(docRef, {
        ...profile,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // ==================== DEPARTMENTS ====================

  async getDepartments(): Promise<Department[]> {
    if (isUsingMock || !db) {
      const raw = localStorage.getItem('sunshine_departments');
      return raw ? JSON.parse(raw) : DEFAULT_DEPARTMENTS;
    }

    const path = 'departments';
    try {
      const colRef = collection(db, 'departments');
      const querySnap = await getDocs(colRef);
      const list: Department[] = [];
      querySnap.forEach(snap => {
        list.push(snap.data() as Department);
      });
      // Fallback in case firestore is connected but empty
      if (list.length === 0) {
        for (const dept of DEFAULT_DEPARTMENTS) {
          await setDoc(doc(db, 'departments', dept.departmentId), dept);
        }
        return DEFAULT_DEPARTMENTS;
      }
      return list;
    } catch (err) {
      console.warn('Firestore departments fetch failed, using local fallback.', err);
      const raw = localStorage.getItem('sunshine_departments');
      return raw ? JSON.parse(raw) : DEFAULT_DEPARTMENTS;
    }
  },

  async saveDepartment(dept: Department): Promise<void> {
    const raw = localStorage.getItem('sunshine_departments');
    const depts: Department[] = raw ? JSON.parse(raw) : [...DEFAULT_DEPARTMENTS];
    const index = depts.findIndex(d => d.departmentId === dept.departmentId);
    if (index >= 0) {
      depts[index] = dept;
    } else {
      depts.push(dept);
    }
    localStorage.setItem('sunshine_departments', JSON.stringify(depts));

    if (isUsingMock || !db) return;
    const path = `departments/${dept.departmentId}`;
    try {
      await setDoc(doc(db, 'departments', dept.departmentId), dept);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteDepartment(id: string): Promise<void> {
    const raw = localStorage.getItem('sunshine_departments');
    if (raw) {
      const depts: Department[] = JSON.parse(raw);
      const filtered = depts.filter(d => d.departmentId !== id);
      localStorage.setItem('sunshine_departments', JSON.stringify(filtered));
    }

    if (isUsingMock || !db) return;
    const path = `departments/${id}`;
    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // ==================== DOCTORS ====================

  async getDoctors(): Promise<Doctor[]> {
    if (isUsingMock || !db) {
      const raw = localStorage.getItem('sunshine_doctors');
      return raw ? JSON.parse(raw) : DEFAULT_DOCTORS;
    }

    const path = 'doctors';
    try {
      const colRef = collection(db, 'doctors');
      const querySnap = await getDocs(colRef);
      const list: Doctor[] = [];
      querySnap.forEach(snap => {
        list.push(snap.data() as Doctor);
      });
      // Fallback in case firestore is connected but empty
      if (list.length === 0) {
        for (const docObj of DEFAULT_DOCTORS) {
          await setDoc(doc(db, 'doctors', docObj.doctorId), docObj);
        }
        return DEFAULT_DOCTORS;
      }
      return list;
    } catch (err) {
      console.warn('Firestore doctors fetch failed, using local fallback.', err);
      const raw = localStorage.getItem('sunshine_doctors');
      return raw ? JSON.parse(raw) : DEFAULT_DOCTORS;
    }
  },

  async saveDoctor(doctor: Doctor): Promise<void> {
    const raw = localStorage.getItem('sunshine_doctors');
    const docsList: Doctor[] = raw ? JSON.parse(raw) : [...DEFAULT_DOCTORS];
    const index = docsList.findIndex(d => d.doctorId === doctor.doctorId);
    if (index >= 0) {
      docsList[index] = doctor;
    } else {
      docsList.push(doctor);
    }
    localStorage.setItem('sunshine_doctors', JSON.stringify(docsList));

    if (isUsingMock || !db) return;
    const path = `doctors/${doctor.doctorId}`;
    try {
      await setDoc(doc(db, 'doctors', doctor.doctorId), doctor);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteDoctor(id: string): Promise<void> {
    const raw = localStorage.getItem('sunshine_doctors');
    if (raw) {
      const docsList: Doctor[] = JSON.parse(raw);
      const filtered = docsList.filter(d => d.doctorId !== id);
      localStorage.setItem('sunshine_doctors', JSON.stringify(filtered));
    }

    if (isUsingMock || !db) return;
    const path = `doctors/${id}`;
    try {
      await deleteDoc(doc(db, 'doctors', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // ==================== APPOINTMENTS ====================

  async getAppointments(patientId?: string): Promise<Appointment[]> {
    if (isUsingMock || !db) {
      const raw = localStorage.getItem('sunshine_appointments');
      const all: Appointment[] = raw ? JSON.parse(raw) : [];
      let filtered = all;
      if (patientId) {
        filtered = all.filter(a => a.patientId === patientId);
      }
      // Sort by queueNumber ascending, or date/createdAt
      return filtered.sort((a, b) => {
        // First sort by date descending, then queueNumber ascending, then createdAt descending
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        if (a.queueNumber && b.queueNumber) {
          return a.queueNumber - b.queueNumber;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    const path = 'appointments';
    try {
      const colRef = collection(db, 'appointments');
      let q;
      if (patientId) {
        q = query(colRef, where('patientId', '==', patientId));
      } else {
        q = query(colRef, orderBy('date', 'desc'));
      }
      
      const querySnap = await getDocs(q);
      const list: Appointment[] = [];
      querySnap.forEach(snap => {
        list.push(snap.data() as Appointment);
      });
      return list;
    } catch (err) {
      console.warn('Firestore appointments query failed, using local fallback.', err);
      const raw = localStorage.getItem('sunshine_appointments');
      const all: Appointment[] = raw ? JSON.parse(raw) : [];
      if (patientId) {
        return all.filter(a => a.patientId === patientId);
      }
      return all;
    }
  },

  async saveAppointment(appt: Appointment): Promise<void> {
    // Determine queue number first locally
    const raw = localStorage.getItem('sunshine_appointments');
    const appts: Appointment[] = raw ? JSON.parse(raw) : [];
    
    // Calculate new queue number for the specific doctor and date
    const sameClinic = appts.filter(a => a.doctorId === appt.doctorId && a.date === appt.date);
    const assignedQueue = sameClinic.length + 1;
    appt.queueNumber = assignedQueue;

    appts.push(appt);
    localStorage.setItem('sunshine_appointments', JSON.stringify(appts));

    if (isUsingMock || !db) return;
    const path = `appointments/${appt.appointmentId}`;
    try {
      await setDoc(doc(db, 'appointments', appt.appointmentId), {
        ...appt,
        queueNumber: assignedQueue,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async updateAppointmentStatus(
    id: string, 
    status: AppointmentStatus, 
    queueNumber?: number, 
    staffNote?: string
  ): Promise<void> {
    const raw = localStorage.getItem('sunshine_appointments');
    const appts: Appointment[] = raw ? JSON.parse(raw) : [];
    const index = appts.findIndex(a => a.appointmentId === id);
    if (index >= 0) {
      appts[index].status = status;
      if (queueNumber !== undefined) appts[index].queueNumber = queueNumber;
      if (staffNote !== undefined) appts[index].staffNote = staffNote;
      appts[index].updatedAt = new Date().toISOString();
      localStorage.setItem('sunshine_appointments', JSON.stringify(appts));
    }

    if (isUsingMock || !db) return;
    const path = `appointments/${id}`;
    try {
      const updates: any = {
        status,
        updatedAt: Timestamp.now()
      };
      if (queueNumber !== undefined) updates.queueNumber = queueNumber;
      if (staffNote !== undefined) updates.staffNote = staffNote;
      
      await updateDoc(doc(db, 'appointments', id), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
};
