/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, UserX, AlertCircle, FileText, CheckCircle2, User, ChevronRight, Check } from 'lucide-react';
import { dbService } from '../services/dbService';
import { Appointment, UserProfile, AppointmentStatus } from '../types';

interface BookingListProps {
  currentUser: UserProfile | null;
}

export default function BookingList({ currentUser }: BookingListProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoSlot, setActiveVideoSlot] = useState<Appointment | null>(null);
  const [consultationCompleted, setConsultationCompleted] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await dbService.getAppointments(currentUser.uid);
      setAppointments(data);
    } catch (err) {
      console.error("Error loading patient appointment history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('您確定要取消此項遠距醫療預約嗎？')) return;
    try {
      await dbService.updateAppointmentStatus(id, '已取消');
      // Refresh feed
      fetchData();
    } catch (err) {
      alert('取消掛號出錯：' + err);
    }
  };

  const startConsultationVideo = (appt: Appointment) => {
    setActiveVideoSlot(appt);
    setConsultationCompleted(false);
  };

  const completeMockConsultation = () => {
    setConsultationCompleted(true);
    setTimeout(() => {
      setActiveVideoSlot(null);
      fetchData();
    }, 2000);
  };

  // Helper mapping for colorful badges
  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case '待確認':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200/60', text: '待確認', badge: 'bg-amber-400' };
      case '已確認':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/60', text: '已確約', badge: 'bg-indigo-400' };
      case '候診中':
        return { bg: 'bg-sky-50 text-sky-700 border-sky-200/60 font-semibold animate-pulse', text: '候診中', badge: 'bg-sky-500' };
      case '看診中':
        return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-100 font-extrabold animate-pulse', text: '正在看診', badge: 'bg-emerald-500' };
      case '已完成':
        return { bg: 'bg-slate-50 text-slate-500 border-slate-200/60', text: '看診已結束', badge: 'bg-slate-400' };
      case '已取消':
        return { bg: 'bg-rose-50 text-rose-500 border-rose-100', text: '已撤銷', badge: 'bg-rose-400' };
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent"></div>
        <p className="mt-2 text-sm text-slate-400 font-medium">讀取您的就診歷程中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900">我的掛號看診歷程</h2>
          <p className="text-sm text-slate-400">以下為您在陽光醫療中心申報並成立的預約歷程狀態。</p>
        </div>
        <button
          onClick={fetchData}
          className="cursor-pointer text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg border border-slate-200"
        >
          <Clock className="h-3 w-3" />
          重讀更新狀態
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-700">尚未建立任何預約單</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            您在本系統中尚無遠距門診掛號紀錄。您可以點選排程掛號切換至掛號預約。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => {
            const chip = getStatusStyle(appt.status);
            return (
              <div 
                key={appt.appointmentId}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
                  appt.status === '看診中' ? 'border-emerald-300 ring-2 ring-emerald-50' : 'border-slate-100'
                }`}
              >
                <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  {/* Left core details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-sans text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
                        編號 #{appt.appointmentId.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${chip.bg}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${chip.badge}`} />
                        {chip.text}
                      </span>
                      
                      {appt.status === '候診中' && appt.queueNumber && (
                        <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2 py-0.5 rounded-full">
                          候診序號 {appt.queueNumber} 號
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-950 flex items-baseline gap-2">
                      {appt.department}
                      <span className="text-sm font-medium text-slate-500">{appt.doctorName}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-sans">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                        {appt.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-300" />
                        {appt.timeSlot}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 text-xs text-slate-500 leading-relaxed font-sans mt-2">
                      <span className="font-semibold text-slate-700">主訴描述：</span>"{appt.chiefComplaint}"
                    </div>

                    {appt.staffNote && (
                      <div className="mt-2 rounded-lg bg-sky-50/70 border border-sky-100 p-2 text-xs text-sky-800 leading-normal">
                        <span className="font-extrabold text-sky-900 block mb-0.5">醫護門診註記 🩺</span>
                        {appt.staffNote}
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex flex-row sm:flex-col items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 justify-end">
                    
                    {/* Live clinic portal simulator */}
                    {appt.status === '看診中' && (
                      <button
                        onClick={() => startConsultationVideo(appt)}
                        className="cursor-pointer flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-md shrink-0 text-xs flex items-center gap-1.5 animate-bounce-slow"
                      >
                        <Video className="h-4 w-4" />
                        🎥 進入線上看診間
                      </button>
                    )}

                    {appt.status === '候診中' && (
                      <div className="text-right text-xs text-sky-600 font-semibold bg-sky-50 px-3 py-2 rounded-xl border border-sky-100 w-full sm:w-auto">
                        <p>醫護已查照健保證件</p>
                        <p className="text-[10px] text-sky-500 font-normal">請保持網頁開啟在線上等候叫號</p>
                      </div>
                    )}

                    {/* Deletion / cancellation criteria */}
                    {(appt.status === '待確認' || appt.status === '已確認') && (
                      <button
                        onClick={() => handleCancel(appt.appointmentId)}
                        className="cursor-pointer text-slate-500 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl px-4 py-2 text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      >
                        <UserX className="h-3.5 w-3.5" />
                        取消掛號
                      </button>
                    )}

                    {appt.status === '已完成' && (
                      <div className="text-slate-400 text-xs flex items-center gap-1 font-bold bg-slate-100 border border-slate-200/60 px-3 py-1.5 rounded-xl">
                        <Check className="h-3.5 w-3.5 text-slate-400" />
                        看診結束 (健保已核付)
                      </div>
                    )}

                    {appt.status === '已取消' && (
                      <div className="text-slate-400 text-xs italic">
                        預約已註銷
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FULL-SCREEN IMMERSIVE REMOTE VIDEO CONSULTATION MODAL SIMULATOR */}
      {activeVideoSlot && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950 flex flex-col justify-between p-4 font-sans animate-fade-in text-white">
          
          {/* Top Video Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
              <h3 className="font-extrabold text-sm tracking-wide">
                陽光遠距視訊診療診間 ── {activeVideoSlot.department}
              </h3>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-400">
              主治醫師：{activeVideoSlot.doctorName}
            </div>
          </div>

          {/* Video Grid content */}
          <div className="flex-1 my-4 grid grid-cols-1 md:grid-cols-2 gap-4 relative overflow-hidden">
            
            {/* Box A: Remote Doctor view stream */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center shadow-inner">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=600"
                alt="Doctor Feed"
                className="absolute inset-0 h-full w-full object-cover brightness-95 opacity-90"
              />
              <div className="absolute top-3 left-3 bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur rounded-lg">
                🔴 醫師端診席 (Dr. Feed)
              </div>
              <div className="absolute bottom-3 right-3 bg-slate-950/90 text-xs p-3 rounded-xl border border-slate-800 backdrop-blur max-w-xs space-y-1">
                <p className="font-bold text-teal-400">{activeVideoSlot.doctorName}</p>
                <p className="text-[10px] text-slate-300">「您好！看得到健保卡資料，我現在幫您檢視喉嚨，請靠近相機鏡頭張開嘴巴說『啊』...」</p>
              </div>
            </div>

            {/* Box B: Local Patient view stream */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 flex items-center justify-center shadow-inner">
              {currentUser?.nhiPhotoUrl ? (
                <img 
                  src={currentUser.nhiPhotoUrl}
                  alt="Patient Capture Preview"
                  className="absolute inset-0 h-full w-full object-cover grayscale-[20%]"
                />
              ) : (
                <div className="text-center px-4">
                  <User className="h-14 w-14 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-xs">患者本地端相機畫面 (無健保卡對照照片)</p>
                </div>
              )}
              <div className="absolute top-3 left-3 bg-slate-900/80 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white backdrop-blur rounded-lg">
                🎥 患者本地端 (Patient Feed)
              </div>
              
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-3 py-1.5 border border-slate-800 rounded-lg text-xs flex items-center gap-1.5">
                <span className="font-bold text-slate-200">患者姓名：{activeVideoSlot.patientName}</span>
              </div>
            </div>

          </div>

          {/* Bottom Video Controls */}
          {consultationCompleted ? (
            <div className="bg-slate-900 rounded-2xl p-6 text-center max-w-md mx-auto border border-emerald-500 animate-scale-up">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400 mb-2 animate-bounce" />
              <h4 className="font-extrabold text-base text-white">看診階段已順利結束！</h4>
              <p className="text-xs text-slate-400 mt-1">
                主治醫師已開立處方箋並上傳健保網。系統正在引導您結帳取藥資訊...
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-2">
              <div className="text-xs text-slate-400 hidden sm:block">
                <span>連線狀態：</span>
                <span className="text-emerald-400 font-bold">1080p 極致順暢 (24ms)</span>
              </div>

              <div className="flex items-center gap-4 mx-auto sm:mx-0">
                <button
                  onClick={completeMockConsultation}
                  className="cursor-pointer bg-red-600 hover:bg-red-700 text-white font-extrabold px-12 py-3 rounded-full text-xs tracking-wider transition-all shadow-md transform active:scale-95"
                >
                  🔴 掛斷視訊診席並結束看診
                </button>
              </div>

              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                診療計時：03:45 / 30:00
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
