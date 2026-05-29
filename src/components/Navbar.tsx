/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HeartPulse, User, Users, Shield, LogOut, LayoutDashboard, Calendar } from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  currentUser: UserProfile | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navbar({
  currentRole,
  onChangeRole,
  currentUser,
  activeTab,
  setActiveTab,
  onLogout
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm/50 backdrop-blur-md">
      {/* Visual Role Switcher for Clinical Integration Testing */}
      <div className="bg-gradient-to-r from-emerald-600 to-sky-600 px-4 py-1.5 text-center text-xs font-semibold text-white shadow-inner flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-300"></span>
          <span>系統整合與身分快切 (整合測試階段)：</span>
        </div>
        <div className="flex items-center justify-center gap-2 mx-auto sm:mx-0">
          <button
            onClick={() => onChangeRole('patient')}
            className={`cursor-pointer rounded-full px-3 py-0.5 text-xs transition-all ${
              currentRole === 'patient'
                ? 'bg-white text-emerald-700 font-bold shadow-sm'
                : 'bg-emerald-700/40 text-emerald-100 hover:bg-emerald-700/70'
            }`}
          >
            病人端 (Patient)
          </button>
          <button
            onClick={() => onChangeRole('staff')}
            className={`cursor-pointer rounded-full px-3 py-0.5 text-xs transition-all ${
              currentRole === 'staff'
                ? 'bg-white text-sky-700 font-bold shadow-sm'
                : 'bg-sky-700/40 text-sky-100 hover:bg-sky-700/70'
            }`}
          >
            醫護端 (Medical Staff)
          </button>
          <button
            onClick={() => onChangeRole('admin')}
            className={`cursor-pointer rounded-full px-3 py-0.5 text-xs transition-all ${
              currentRole === 'admin'
                ? 'bg-white text-slate-800 font-bold shadow-sm'
                : 'bg-slate-700/40 text-slate-100 hover:bg-slate-700/70'
            }`}
          >
            管理員 (Admin)
          </button>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100">
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 md:text-lg">
              陽光遠距醫療系統
            </h1>
            <p className="text-[10px] font-mono leading-none text-slate-400">
              SUNSHINE TELEHEALTH PORTAL
            </p>
          </div>
        </div>

        {/* Modular Tabs depending on the current active role */}
        <nav className="hidden md:flex items-center gap-1">
          {currentRole === 'patient' && (
            <>
              <button
                onClick={() => setActiveTab('patient-register')}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-5 text-sm font-medium transition-colors ${
                  activeTab === 'patient-register'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                健保卡建檔註冊
              </button>
              <button
                onClick={() => setActiveTab('patient-booking')}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-5 text-sm font-medium transition-colors ${
                  activeTab === 'patient-booking'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                遠距掛號
              </button>
              <button
                onClick={() => setActiveTab('patient-history')}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-5 text-sm font-medium transition-colors ${
                  activeTab === 'patient-history'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                我的掛號狀態
              </button>
            </>
          )}

          {currentRole === 'staff' && (
            <button
              onClick={() => setActiveTab('staff-dashboard')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-5 text-sm font-medium transition-all ${
                activeTab === 'staff-dashboard'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              今日掛號與看診板
            </button>
          )}

          {currentRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin-panel')}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-5 text-sm font-medium transition-all ${
                activeTab === 'admin-panel'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Shield className="h-4 w-4" />
              問診時段與醫師管理
            </button>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="hidden text-right lg:block">
              <div className="text-xs font-semibold text-slate-700">
                {currentUser?.name || '醫療賓客'}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                {currentRole === 'patient' && '掛號病人'}
                {currentRole === 'staff' && '主治醫護端'}
                {currentRole === 'admin' && '最高管理員'}
              </div>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-2 ring-slate-100">
              {currentRole === 'patient' && <User className="h-4 w-4 text-emerald-600" />}
              {currentRole === 'staff' && <Users className="h-4 w-4 text-sky-600" />}
              {currentRole === 'admin' && <Shield className="h-4 w-4 text-purple-600" />}
            </div>
          </div>

          <button
            onClick={onLogout}
            title="安全登出"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation menu if viewport is smaller */}
      <div className="flex md:hidden border-t border-slate-100 bg-slate-50/80 px-4 py-2 justify-around gap-1 font-sans text-xs">
        {currentRole === 'patient' && (
          <>
            <button
              onClick={() => setActiveTab('patient-register')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'patient-register' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              拍照建檔
            </button>
            <button
              onClick={() => setActiveTab('patient-booking')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'patient-booking' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              遠距掛號
            </button>
            <button
              onClick={() => setActiveTab('patient-history')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'patient-history' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              掛號狀態
            </button>
          </>
        )}

        {currentRole === 'staff' && (
          <button
            onClick={() => setActiveTab('staff-dashboard')}
            className={`w-full text-center py-2 rounded-md font-medium transition-all ${
              activeTab === 'staff-dashboard'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            今日掛號與看診板 💻
          </button>
        )}

        {currentRole === 'admin' && (
          <button
            onClick={() => setActiveTab('admin-panel')}
            className={`w-full text-center py-2 rounded-md font-medium transition-all ${
              activeTab === 'admin-panel'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            門診時段與醫師管理 ⚙️
          </button>
        )}
      </div>
    </header>
  );
}
