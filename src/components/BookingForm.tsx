/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, User, HeartPulse, UserCheck, AlertTriangle, FileText, Check, FileCheck } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Department, Doctor, UserProfile, Appointment, AppointmentStatus } from '../types';

interface BookingFormProps {
  currentUser: UserProfile | null;
  onAppointmentCreated: () => void;
  setActiveTab: (tab: string) => void;
}

const AVAILABLE_SLOTS = [
  '09:00 - 09:30',
  '09:30 - 10:00',
  '10:00 - 10:30',
  '10:30 - 11:00',
  '14:00 - 14:30',
  '14:30 - 15:00',
  '15:00 - 15:30',
  '15:30 - 16:00',
  '19:00 - 19:30',
  '19:30 - 20:00'
];

export default function BookingForm({ currentUser, onAppointmentCreated, setActiveTab }: BookingFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  // Selection states
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  // Flow & layout states
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  // Pre-load specialties and rosters
  useEffect(() => {
    async function initCatalog() {
      try {
        const depts = await dbService.getDepartments();
        const docs = await dbService.getDoctors();
        setDepartments(depts);
        setDoctors(docs);
        if (depts.length > 0) {
          // Select first department by default
          setSelectedDept(depts[0].name);
        }
      } catch (err) {
        console.error('Failed to load clinic rosters', err);
      }
    }
    initCatalog();
  }, []);

  // Filter doctors list whenever selected specialty department changes
  useEffect(() => {
    if (selectedDept) {
      const filtered = doctors.filter(doc => doc.department === selectedDept && doc.isAvailable);
      setFilteredDoctors(filtered);
      if (filtered.length > 0) {
        setSelectedDocId(filtered[0].doctorId);
      } else {
        setSelectedDocId('');
      }
    }
  }, [selectedDept, doctors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!currentUser) {
      setErrorNotice('請先登入系統後再試。');
      return;
    }
    if (!selectedDept) {
      setErrorNotice('請選擇看診科別。');
      return;
    }
    if (!selectedDocId) {
      setErrorNotice('此科別目前無值班醫師。');
      return;
    }
    if (!selectedDate) {
      setErrorNotice('請選擇預約日期。');
      return;
    }
    if (!selectedSlot) {
      setErrorNotice('請選擇看診時段。');
      return;
    }
    if (!chiefComplaint.trim()) {
      setErrorNotice('請填寫病患簡短主訴（不舒服的地方），方便醫師準備。');
      return;
    }

    setLoading(true);

    const matchDoc = doctors.find(d => d.doctorId === selectedDocId);
    const appointmentId = 'appt_' + Math.random().toString(36).substring(2, 11);

    const newAppointment: Appointment = {
      appointmentId,
      patientId: currentUser.uid,
      patientName: currentUser.name || '病患',
      patientBirthday: currentUser.birthday,
      patientNhiNumber: currentUser.nhiNumber,
      patientNhiPhotoUrl: currentUser.nhiPhotoUrl,
      department: selectedDept,
      doctorId: selectedDocId,
      doctorName: matchDoc?.name || '主治醫師',
      date: selectedDate,
      timeSlot: selectedSlot,
      chiefComplaint,
      isFirstVisit,
      status: '待確認',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await dbService.saveAppointment(newAppointment);
      setCreatedAppointment({ ...newAppointment, queueNumber: undefined }); // updated by database service
      onAppointmentCreated();
    } catch (err: any) {
      setErrorNotice('掛號預約失敗，請檢視防範規則：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleCreatedReceiptClose = () => {
    // Navigate to see booking states
    setCreatedAppointment(null);
    setActiveTab('patient-history');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Alert if Patient hasn't updated NHI database yet */}
      {!currentUser?.nhiNumber && !createdAppointment && (
        <div className="mb-6 rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sky-800 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-sky-600 flex-shrink-0" />
          <div className="text-sm">
            <h4 className="font-extrabold text-sky-900">檢測到健保身分尚未建檔！</h4>
            <p className="text-xs text-sky-700 mt-0.5 leading-normal">
              為配合衛福部特約健保視訊診療辦法，建議您優先完成健保 IC 卡影像比對與基本申報資料登記，避免看診時無法確認身分而造成退件，謝謝您的配合。
              <span className="font-semibold block mt-1">
                可以優先前往「健保 IC 卡拍照建檔」快速完成登記。
              </span>
            </p>
            <button
              onClick={() => setActiveTab('patient-register')}
              className="mt-2 text-xs font-bold text-emerald-600 bg-white hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 cursor-pointer shadow-sm transition-all"
            >
              一秒前往拍照 ➔
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION RECEIPT CARD */}
      {createdAppointment ? (
        <div className="rounded-3xl border-2 border-emerald-100 bg-white p-6 sm:p-8 shadow-xl text-center transition-all animate-fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50 mb-4">
            <Check className="h-7 w-7" />
          </div>

          <h2 className="text-2xl font-black text-slate-900">預約遠距看診掛號成功！</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto leading-normal">
            您的門診預約單已順利送往陽光醫療中心。請於預定看診時段，登入系統於掛號狀態頁點按視訊待命。
          </p>

          {/* Detailed Printable Clinical Receipt */}
          <div className="my-6 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/30 p-5 text-left text-sm max-w-md mx-auto shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-12 -translate-y-5 rotate-45 bg-emerald-500 px-12 py-1.5 text-center text-white scale-[0.8] text-[10px] uppercase font-bold tracking-widest">
              待確認
            </div>
            
            <div className="text-center font-mono text-[11px] text-slate-400 tracking-widest border-b border-dashed border-slate-200 pb-3 mb-4 flex items-center justify-center gap-1">
              <FileCheck className="h-3.5 w-3.5 text-slate-400" />
              CLINICAL BOOKING SLIP
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">掛號病患</span>
                <span className="font-bold text-slate-800">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">身分證件號</span>
                <span className="font-mono text-slate-800 text-xs">
                  {currentUser?.nhiNumber ? `健保卡 ${currentUser.nhiNumber}` : '無（未建立照片身分）'}
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">門診科別</span>
                <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-xs">{createdAppointment.department}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">主治醫師</span>
                <span className="font-bold text-slate-800">{createdAppointment.doctorName}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">預定日期</span>
                <span className="font-bold text-slate-800 font-sans">{createdAppointment.date}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">預估時段</span>
                <span className="font-sans font-bold text-emerald-700">{createdAppointment.timeSlot}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">看診性質</span>
                <span className="text-xs font-semibold text-slate-700">
                  {createdAppointment.isFirstVisit ? '🔰 初診使用者' : '🏥 常規複診者'}
                </span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-slate-500">病主訢求 (Chief Complaint)</span>
                <p className="text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-600 italic leading-relaxed">
                  "{createdAppointment.chiefComplaint}"
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleCreatedReceiptClose}
              className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold px-8 py-2.5 rounded-xl text-sm transition-all"
            >
              確認收受，前往查看就診狀態 ➔
            </button>
          </div>
        </div>
      ) : (
        /* MAIN BOOKING SELECTION INTERFACE */
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-lg">
          <h2 className="text-2xl font-black text-slate-900 mb-2">預約遠距看診掛號</h2>
          <p className="text-sm text-slate-500 mb-8 font-sans">
            陽光視訊門診提供跨科系會診。選取科系、合適醫師及看診時分，即可完成雲端掛號。
          </p>

          <div className="space-y-6">
            {/* Step 1: Specialty & Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <HeartPulse className="h-4 w-4 text-emerald-500" />
                  就診科系 (Department)
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {departments.map(dept => (
                    <option key={dept.departmentId} value={dept.name}>
                      {dept.name} ── {dept.description.slice(0, 10)}...
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-emerald-500" />
                  值班醫師 (Physician)
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={filteredDoctors.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 cursor-pointer"
                >
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map(doc => (
                      <option key={doc.doctorId} value={doc.doctorId}>
                        {doc.name} (臨床主治)
                      </option>
                    ))
                  ) : (
                    <option value="">目前週時段無值班醫師</option>
                  )}
                </select>
              </div>
            </div>

            {/* Step 2: Date and Slot */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-500" />
                  門診日期 (Date)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={getTodayDateString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  看診預估時段 (Time Slot)
                </label>
                <select
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">-- 請選擇期望看診時分 --</option>
                  {AVAILABLE_SLOTS.map(slot => (
                    <option key={slot} value={slot}>
                      {slot} (常規診次)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Visit type selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                看診類別確認
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex-1 select-none">
                  <input
                    type="radio"
                    name="visitType"
                    checked={!isFirstVisit}
                    onChange={() => setIsFirstVisit(false)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">常規複診</div>
                    <div className="text-[10px] text-slate-400">曾在此看展或備份過病史</div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex-1 select-none">
                  <input
                    type="radio"
                    name="visitType"
                    checked={isFirstVisit}
                    onChange={() => setIsFirstVisit(true)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800">🔰 初診建檔</div>
                    <div className="text-[10px] text-slate-400">第一次預約視問診，配合資料核對</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Step 4: Chief Complaint */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                就診主訴求 / 生理徵狀敘述 (Chief Complaint)
              </label>
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="請輸入您不適之處或希望回診開立藥物品項（例如：鼻塞、頭痛。慢性高血壓回診開藥...）"
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>

            {errorNotice && (
              <div className="rounded-xl bg-orange-50 p-4 text-sm text-orange-600 flex items-center gap-2 border border-orange-100">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold px-10 py-3.5 rounded-xl shadow-md transition-all transform hover:-translate-y-0.5 text-sm"
              >
                {loading ? '掛號呈報中...' : '送出預約掛號'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
