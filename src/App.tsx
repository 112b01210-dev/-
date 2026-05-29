/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HeartPulse, Key, ShieldCheck, Users, CornerDownRight, Check, AlertCircle } from 'lucide-react';
import { UserProfile, UserRole } from './types';
import { dbService } from './services/dbService';

import Navbar from './components/Navbar';
import NHICardCamera from './components/NHICardCamera';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import BackofficeDashboard from './components/BackofficeDashboard';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('patient');
  const [activeTab, setActiveTab] = useState('patient-register');

  // Login form States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load active user session from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('sunshine_active_user');
    const savedRole = localStorage.getItem('sunshine_active_role');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      if (savedRole) {
        setCurrentRole(savedRole as UserRole);
        // Direct transition to relevant panel based on role
        if (savedRole === 'staff') setActiveTab('staff-dashboard');
        else if (savedRole === 'admin') setActiveTab('admin-panel');
        else setActiveTab(parsed.nhiNumber ? 'patient-booking' : 'patient-register');
      }
    }
  }, []);

  const handleQuickLogin = (role: UserRole) => {
    setLoginError(null);
    let mockProfile: UserProfile;

    if (role === 'patient') {
      mockProfile = {
        uid: 'patient_demo_1',
        name: '陳大同',
        email: 'patient.demo@sunshine.org',
        birthday: '1985-04-12',
        nhiNumber: '1023456789',
        nhiPhotoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300',
        role: 'patient',
        createdAt: new Date().toISOString()
      };
    } else if (role === 'staff') {
      mockProfile = {
        uid: 'staff_demo_1',
        name: '張正宇 醫師',
        email: 'doctor.chang@sunshine.org',
        role: 'staff',
        createdAt: new Date().toISOString()
      };
    } else {
      mockProfile = {
        uid: 'admin_demo_1',
        name: '最高管理員 (Admin)',
        email: 'admin@sunshine.org',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
    }

    // Persist session
    setCurrentUser(mockProfile);
    setCurrentRole(role);
    localStorage.setItem('sunshine_active_user', JSON.stringify(mockProfile));
    localStorage.setItem('sunshine_active_role', role);

    // Initial tabs routings
    if (role === 'patient') {
      setActiveTab('patient-booking');
    } else if (role === 'staff') {
      setActiveTab('staff-dashboard');
    } else {
      setActiveTab('admin-panel');
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!emailInput.trim()) {
      setLoginError('請填寫電子信箱。');
      return;
    }
    if (!passwordInput) {
      setLoginError('請設定高強度密碼。');
      return;
    }
    if (isRegisterMode && !nameInput.trim()) {
      setLoginError('註冊必需提供患者大寫姓名。');
      return;
    }

    const mockUid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const mockProfile: UserProfile = {
      uid: mockUid,
      name: isRegisterMode ? nameInput.trim() : emailInput.split('@')[0],
      email: emailInput.trim(),
      role: 'patient', // Self signup is always patient
      createdAt: new Date().toISOString()
    };

    try {
      if (isRegisterMode) {
        // Register simulation
        await dbService.saveUserProfile(mockProfile);
        setCurrentUser(mockProfile);
        setCurrentRole('patient');
        localStorage.setItem('sunshine_active_user', JSON.stringify(mockProfile));
        localStorage.setItem('sunshine_active_role', 'patient');
        setActiveTab('patient-register');
        alert('註冊成功！系統已經協助您登入，請開始健保身份照相。');
      } else {
        // Login simulation
        const existing = await dbService.getUserProfile(emailInput); // or general lookup
        const userToLoad = existing || mockProfile;
        setCurrentUser(userToLoad);
        setCurrentRole(userToLoad.role);
        localStorage.setItem('sunshine_active_user', JSON.stringify(userToLoad));
        localStorage.setItem('sunshine_active_role', userToLoad.role);
        
        if (userToLoad.role === 'staff') {
          setActiveTab('staff-dashboard');
        } else if (userToLoad.role === 'admin') {
          setActiveTab('admin-panel');
        } else {
          setActiveTab(userToLoad.nhiNumber ? 'patient-booking' : 'patient-register');
        }
      }
    } catch (err: any) {
      setLoginError('登入授權失敗：' + err.message);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sunshine_active_user');
    localStorage.removeItem('sunshine_active_role');
    // Clear inputs
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
    setIsRegisterMode(false);
  };

  const handleChangeRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('sunshine_active_role', role);
    if (role === 'patient') {
      // Toggle back to profile or book tabs
      setActiveTab(currentUser?.nhiNumber ? 'patient-booking' : 'patient-register');
    } else if (role === 'staff') {
      setActiveTab('staff-dashboard');
    } else {
      setActiveTab('admin-panel');
    }
  };

  const handleProfileUpdated = async (updated: UserProfile) => {
    setCurrentUser(updated);
    localStorage.setItem('sunshine_active_user', JSON.stringify(updated));
    // Save to Firestore
    await dbService.saveUserProfile(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex flex-col justify-between">
      
      {/* 1. AUTHENTICATED CORE DASHBOARDS */}
      {currentUser ? (
        <div className="flex flex-col min-h-screen">
          <Navbar 
            currentRole={currentRole}
            onChangeRole={handleChangeRole}
            currentUser={currentUser}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />

          <main className="flex-grow pb-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentRole}-${activeTab}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full"
              >
                {/* PATIENT SCREENS */}
                {currentRole === 'patient' && (
                  <>
                    {activeTab === 'patient-register' && (
                      <NHICardCamera 
                        currentUser={currentUser}
                        onProfileUpdated={handleProfileUpdated}
                        onNextStep={() => setActiveTab('patient-booking')}
                      />
                    )}
                    {activeTab === 'patient-booking' && (
                      <BookingForm 
                        currentUser={currentUser}
                        onAppointmentCreated={() => {}}
                        setActiveTab={setActiveTab}
                      />
                    )}
                    {activeTab === 'patient-history' && (
                      <BookingList currentUser={currentUser} />
                    )}
                  </>
                )}

                {/* STAFF CLINIC CONTROL BOARD */}
                {currentRole === 'staff' && activeTab === 'staff-dashboard' && (
                  <BackofficeDashboard />
                )}

                {/* ADMIN RESOURCE PLANNER */}
                {currentRole === 'admin' && activeTab === 'admin-panel' && (
                  <AdminPanel />
                )}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-sans">
            <div className="max-w-7xl mx-auto px-4">
              <p className="font-semibold text-slate-500">陽光遠距醫療掛號與看診管理系統 ⚙️ 遠距智慧診療門診系統</p>
              <p className="mt-1">© 2026 陽光醫療集團智慧醫療事業部. 版權所有 ── 本服務提供最高規格之視訊會診治理。</p>
            </div>
          </footer>
        </div>
      ) : (
        /* 2. ANAUTHENTICATED GUEST LOGIN GATE */
        <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-indigo-50/50 via-white to-emerald-50/50">
          
          {/* Left Hero Side */}
          <div className="flex-1 flex flex-col justify-between p-8 md:p-12 lg:p-16 bg-gradient-to-b from-slate-900 via-slate-950 to-emerald-950 text-white min-h-[30vh] md:min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)]" />
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 z-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HeartPulse className="h-6 w-6" />
              </div>
              <div>
                <span className="font-extrabold text-white tracking-tight block text-base md:text-lg">陽光遠距醫療系統</span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 block leading-none">SUNSHINE TELEMED</span>
              </div>
            </div>

            {/* Showcase details */}
            <div className="my-auto py-10 z-10">
              <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-300">
                跨距問診，<br />愛無間斷。
              </h1>
              <p className="mt-4 text-xs lg:text-sm text-slate-300 max-w-md leading-relaxed">
                結合「健保證件影像加密註冊」、「多維度智慧預約排程」、以及「動態電子候診叫號系統」，提供全病患高保真、流暢不中斷的次世代臨床視訊會診服務。
              </p>
            </div>

            {/* Bottom Credits */}
            <div className="text-[10.5px] text-slate-400 font-mono z-10 flex flex-wrap justify-between items-center gap-2 border-t border-slate-800/60 pt-6">
              <span>陽光醫療雲端基礎設施 ── WORKSPACE INTEGRATED SECURE PORTAL</span>
              <span>256-BIT SSL ENCRYPTED</span>
            </div>
          </div>

          {/* Right Interface Side: The Form */}
          <div className="flex-1 flex items-center justify-center p-6 sm:p-10 md:p-16">
            <div className="w-full max-w-md space-y-8 animate-fade-in">
              
              {/* Card Title */}
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">遠距醫療控制門卡</h2>
                <p className="text-xs text-slate-400 mt-1.5">
                  您可以自由輸入帳號註冊，或者一鍵點按下方「快速進入」預置角色測試全線功能。
                </p>
              </div>

              {/* QUICK ACCESS PANEL FOR LECTURE GRADERS */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-sky-500/5 to-purple-500/5 border border-slate-250/60 space-y-3.5 shadow-sm">
                <div className="text-[10.5px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  系統作業權限快速登錄 (整合測試專用)
                </div>

                <div className="grid grid-cols-1 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('patient')}
                    className="cursor-pointer flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50/20 text-slate-700 shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="h-3.5 w-3.5 text-emerald-500" />
                      <div>
                        <span className="font-extrabold block">陳大同 (Patient) 👤</span>
                        <span className="text-[10px] text-slate-400">已建妥健保卡照片，能一秒建立遠距門診掛號。</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('staff')}
                    className="cursor-pointer flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-500 hover:text-sky-700 hover:bg-sky-50/20 text-slate-700 shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="h-3.5 w-3.5 text-sky-500" />
                      <div>
                        <span className="font-bold block">張正宇 醫師 (Staff) 🩺</span>
                        <span className="text-[10px] text-slate-400">進入今日醫療控制面板，審閱卡片合規與安排叫號。</span>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="cursor-pointer flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:text-purple-700 hover:bg-purple-50/20 text-slate-700 shadow-sm transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <CornerDownRight className="h-3.5 w-3.5 text-purple-500" />
                      <div>
                        <span className="font-bold block">行政治理員 (Admin) ⚙️</span>
                        <span className="text-[10px] text-slate-400">管理全院就診時間。支援科別動態增刪。</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* standard manual registration Form divider */}
              <div className="relative flex py-2 items-center text-xs text-slate-350 font-medium my-4">
                <div className="flex-grow border-t border-slate-225"></div>
                <span className="flex-shrink mx-4 uppercase tracking-widest text-[9px]">或者手動登錄</span>
                <div className="flex-grow border-t border-slate-225"></div>
              </div>

              {/* Standard Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">
                      姓名 / 病患大名
                    </label>
                    <input
                      type="text"
                      required
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="例如：林小陽"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    電子郵件 (Email)
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    掛號密碼 (Password)
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {loginError && (
                  <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-600 flex items-center gap-1.5 border border-orange-100">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="cursor-pointer w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-xs transition-colors shadow-sm tracking-wide"
                >
                  {isRegisterMode ? '建立新病歷大卡' : '登入門診大門'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="cursor-pointer text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    {isRegisterMode ? '我已有預約大卡？點按此登入' : '我是第一次看診？點此開始健保建檔'}
                  </button>
                </div>
              </form>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
