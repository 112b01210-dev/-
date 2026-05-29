/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Appointment, AppointmentStatus } from '../types';
import { 
  Users, 
  Clock, 
  CheckSquare, 
  Activity, 
  Search, 
  Eye, 
  UserCheck, 
  ChevronRight, 
  X, 
  AlertCircle, 
  RefreshCw,
  Plus,
  Minus,
  MessageSquare,
  Sparkles
} from 'lucide-react';

export default function BackofficeDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Active detail modal
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Editing draft states inside detail modal
  const [draftStatus, setDraftStatus] = useState<AppointmentStatus>('待確認');
  const [draftQueue, setDraftQueue] = useState<number>(1);
  const [draftNote, setDraftNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await dbService.getAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Error loading backoffice appointments', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectPatient = (appt: Appointment) => {
    setSelectedAppt(appt);
    setDraftStatus(appt.status);
    setDraftQueue(appt.queueNumber || 1);
    setDraftNote(appt.staffNote || '');
  };

  const handleUpdateDetails = async () => {
    if (!selectedAppt) return;
    setIsUpdating(true);
    try {
      await dbService.updateAppointmentStatus(
        selectedAppt.appointmentId,
        draftStatus,
        draftQueue,
        draftNote
      );
      // Update local state without fully redrawing loader
      const updatedList = appointments.map(a => {
        if (a.appointmentId === selectedAppt.appointmentId) {
          return {
            ...a,
            status: draftStatus,
            queueNumber: draftQueue,
            staffNote: draftNote,
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });
      setAppointments(updatedList);
      
      // Update the active card preview state as well
      setSelectedAppt({
        ...selectedAppt,
        status: draftStatus,
        queueNumber: draftQueue,
        staffNote: draftNote,
        updatedAt: new Date().toISOString()
      });

      alert('病患看診狀態及備註已同步更新並寫入系統。');
    } catch (err) {
      alert('更新資料出錯：' + err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper stats definitions
  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === '待確認').length,
    active: appointments.filter(a => a.status === '候診中' || a.status === '看診中').length,
    completed: appointments.filter(a => a.status === '已完成').length,
  };

  // Filters application
  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = a.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.appointmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (a.patientNhiNumber && a.patientNhiNumber.includes(searchQuery));
    const matchesDept = selectedDeptFilter === 'ALL' || a.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || a.status === selectedStatusFilter;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Extract list of unique departments for filter dropdown
  const uniqueDepts = Array.from(new Set(appointments.map(a => a.department)));

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case '待確認':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '已確認':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case '候診中':
        return 'bg-sky-50 text-sky-700 border-sky-200 font-bold';
      case '看診中':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black animate-pulse';
      case '已完成':
        return 'bg-slate-50 text-slate-500 border-slate-200';
      case '已取消':
        return 'bg-rose-50 text-rose-500 border-rose-100';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Clinician Desk Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">今日掛號與遠距診療控制 desk</h2>
          <p className="text-sm text-slate-500 mt-1">
            供線上醫護與前台行政團隊即時審查健保拍照並安排叫號、更新看診狀態至線上。
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="cursor-pointer font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 shadow-sm transition-all border border-sky-500 max-w-xs md:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          重載本日最新預約掛號資料
        </button>
      </div>

      {/* METRIC CARD PANELS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm/50 flex items-center gap-4">
          <div className="rounded-xl bg-slate-50 text-slate-500 h-10 w-10 flex items-center justify-center border border-slate-100 flex-shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">今日掛號總量</div>
            <div className="text-2xl font-black text-slate-900 font-sans mt-0.5">{stats.total}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm/50 flex items-center gap-4">
          <div className="rounded-xl bg-amber-50 text-amber-600 h-10 w-10 flex items-center justify-center border border-amber-100 flex-shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">待確認身分</div>
            <div className="text-2xl font-black text-amber-600 font-sans mt-0.5">{stats.pending}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm/50 flex items-center gap-4">
          <div className="rounded-xl bg-sky-50 text-sky-600 h-10 w-10 flex items-center justify-center border border-sky-100 flex-shrink-0">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">視訊中 / 候診</div>
            <div className="text-2xl font-black text-sky-600 font-sans mt-0.5">{stats.active}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm/50 flex items-center gap-4">
          <div className="rounded-xl bg-emerald-50 text-emerald-600 h-10 w-10 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <CheckSquare className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">本日已看診數</div>
            <div className="text-2xl font-black text-emerald-600 font-sans mt-0.5">{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS TOOLBAR */}
      <div className="rounded-2xl bg-slate-100/60 border border-slate-200/50 p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋患者大名、健保卡號或病歷號..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="text-xs text-slate-500 font-semibold">篩選條件：</div>
          
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">全部科系</option>
            {uniqueDepts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs focus:border-sky-500 focus:outline-none cursor-pointer"
          >
            <option value="ALL">全部看診狀態</option>
            <option value="待確認">待確認</option>
            <option value="已確認">已確認</option>
            <option value="候診中">候診中</option>
            <option value="看診中">看診中</option>
            <option value="已完成">已完成</option>
            <option value="已取消">已取消</option>
          </select>
        </div>
      </div>

      {/* CLINICAL QUEUE GRID AND DETAIL SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left clinical list (2/3 width on wide screen) */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 text-center bg-white border border-slate-100 rounded-3xl">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-r-transparent"></div>
              <p className="mt-2 text-sm text-slate-400 font-medium">資料安全串聯中...</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <h3 className="text-base font-bold text-slate-700">無符合當前條件的掛號預約</h3>
              <p className="text-xs text-slate-400 mt-1">您可以重設過濾條件或重整網路試試看。</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-150 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-150">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">序/序號</th>
                      <th className="px-6 py-4">病患資料</th>
                      <th className="px-6 py-4">主約科系</th>
                      <th className="px-6 py-4">就診時分</th>
                      <th className="px-6 py-4 text-center">健保相片</th>
                      <th className="px-6 py-4">狀態</th>
                      <th className="px-6 py-4 text-right">管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredAppointments.map((appt) => (
                      <tr 
                        key={appt.appointmentId} 
                        className={`hover:bg-slate-50/70 transition-colors cursor-pointer ${
                          selectedAppt?.appointmentId === appt.appointmentId ? 'bg-sky-50/45' : ''
                        }`}
                        onClick={() => handleInspectPatient(appt)}
                      >
                        {/* Queue Number */}
                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-slate-400">
                          {appt.queueNumber ? (
                            <span className="bg-slate-100 text-slate-700 h-6 w-6 inline-flex items-center justify-center rounded-full text-[10px]">
                              {appt.queueNumber}
                            </span>
                          ) : '未置'}
                        </td>

                        {/* Patient Profile info snippet */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900">{appt.patientName}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-sans tracking-wide">
                            {appt.isFirstVisit ? '🔰 初診' : '🏥 複診'} | {appt.patientBirthday || '未建生日'}
                          </div>
                        </td>

                        {/* Department & doctor */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{appt.department}</div>
                          <div className="text-[10px] text-slate-400 font-sans">{appt.doctorName}</div>
                        </td>

                        {/* Date slot */}
                        <td className="px-6 py-4 whitespace-nowrap font-sans">
                          <div className="font-bold text-slate-800">{appt.date}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{appt.timeSlot}</div>
                        </td>

                        {/* NHI card thumbnail check */}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {appt.patientNhiPhotoUrl ? (
                            <span className="bg-green-50 text-green-700 border border-green-200/50 px-2 py-1 rounded text-[10px] font-bold shadow-sm inline-block">
                              📷 已拍照
                            </span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 border border-slate-200/50 px-2 py-1 rounded text-[10px] inline-block">
                              🚫 未建檔
                            </span>
                          )}
                        </td>

                        {/* State capsule */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getStatusBadge(appt.status)}`}>
                            {appt.status}
                          </span>
                        </td>

                        {/* Click indicator */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectPatient(appt);
                            }}
                            className="cursor-pointer text-sky-600 hover:text-sky-700 hover:underline inline-flex items-center gap-0.5 font-bold"
                          >
                            開立
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Audit drawer/panel (1/3 width) */}
        <div className="lg:col-span-1">
          {selectedAppt ? (
            <div className="rounded-3xl border border-sky-200 bg-white p-6 shadow-md shadow-sky-50 sticky top-24 transition-all animate-scale-up">
              
              {/* Drawer header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-5">
                <div>
                  <h3 className="font-black text-lg text-slate-900">病照預估與審度大卡</h3>
                  <p className="text-[10px] font-mono text-slate-400">PATIENT ID: #{selectedAppt.appointmentId.toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setSelectedAppt(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Core NHI visual proof */}
              <div className="space-y-5">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 text-slate-500">
                    📷 健保申報卡相片
                  </div>
                  {selectedAppt.patientNhiPhotoUrl ? (
                    <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-inner group">
                      <img
                        src={selectedAppt.patientNhiPhotoUrl}
                        alt="Captured NHI card"
                        className="w-full h-auto aspect-[1.586/1] object-cover hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/20 backdrop-brightness-95 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-slate-250 bg-slate-50 p-6 text-center text-slate-400">
                      <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-1" />
                      <p className="text-xs">病患註冊時尚未提供相機附圖</p>
                      <p className="text-[10px] text-slate-400/85 mt-0.5">請於看診視訊時要求病人口述校對身份證</p>
                    </div>
                  )}
                </div>

                {/* Text fields list */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">姓名大名：</span>
                    <strong className="text-slate-800">{selectedAppt.patientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">出生日期：</span>
                    <strong className="text-slate-800 font-sans">{selectedAppt.patientBirthday || '無登錄'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">健保卡號：</span>
                    <strong className="text-emerald-700 font-mono font-bold">{selectedAppt.patientNhiNumber || '無登錄'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">就診性質：</span>
                    <span className="font-semibold text-slate-800">
                      {selectedAppt.isFirstVisit ? '🔰 臨床初診' : '🏥 常規複診者'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-200 mx-2" />
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-slate-400">患者主訴求 (Complaint)：</span>
                    <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-600 italic leading-relaxed">
                      "{selectedAppt.chiefComplaint}"
                    </p>
                  </div>
                </div>

                {/* EDITING INTERFACE CONTROLS */}
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  
                  {/* Status dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      1. 修改看診狀態
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['待確認', '已確認', '候診中', '看診中', '已完成', '已取消'] as AppointmentStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setDraftStatus(st)}
                          className={`cursor-pointer text-[10px] font-bold py-1.5 px-1 rounded-lg border transition-all text-center ${
                            draftStatus === st
                              ? 'bg-sky-500 text-white border-sky-500 shadow-sm font-extrabold'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Set Sequence queueNumber */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between items-center">
                      <span>2. 設定今日看診順序號</span>
                      <span className="font-mono text-slate-400 text-[10px]">Queue placement</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDraftQueue(prev => Math.max(1, prev - 1))}
                        className="cursor-pointer h-9 w-9 border border-slate-350 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100"
                      >
                        <Minus className="h-4 w-4 text-slate-500" />
                      </button>
                      
                      <input
                        type="number"
                        value={draftQueue}
                        onChange={(e) => setDraftQueue(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-9 font-sans font-bold text-center w-20 rounded-lg border border-slate-350 text-slate-800"
                      />

                      <button
                        type="button"
                        onClick={() => setDraftQueue(prev => prev + 1)}
                        className="cursor-pointer h-9 w-9 border border-slate-350 rounded-lg flex items-center justify-center bg-slate-50 hover:bg-slate-100"
                      >
                        <Plus className="h-4 w-4 text-slate-500" />
                      </button>

                      <span className="text-[10px] text-slate-400 max-w-[120px] leading-tight">建議按候診報到順序遞增</span>
                    </div>
                  </div>

                  {/* Clinical staff memo staffNote */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 flex justify-between items-center">
                      <span>3. 醫護與前台診療備註</span>
                      <span className="text-[10px] text-slate-400">Patient Note</span>
                    </label>
                    <textarea
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="這裡可以輸入對病患健保卡的查驗狀態、視訊候診狀況、或者看診後的處方資訊註記。患者端可以直接看到此訊息。"
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  {/* Submit updates */}
                  <button
                    type="button"
                    onClick={handleUpdateDetails}
                    disabled={isUpdating}
                    className="cursor-pointer w-full bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white font-extrabold py-3 rounded-xl shadow-md text-xs transition-colors flex items-center justify-center gap-1"
                  >
                    {isUpdating ? '存入中...' : '確認將變動寫入病歷檔'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center text-slate-400 sticky top-24">
              <Eye className="mx-auto h-12 w-12 text-slate-300 mb-2" />
              <h4 className="font-bold text-slate-700 text-sm">尚未選取病照大卡</h4>
              <p className="text-xs text-slate-400 mt-1">選取左側掛號名單中的任何一位患者，即可進入卡面校對、順序排序與狀態開立管理。</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
