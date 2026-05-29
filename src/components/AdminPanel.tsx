/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';
import { Department, Doctor } from '../types';
import { 
  Plus, 
  Trash2, 
  Shield, 
  HeartPulse, 
  Users, 
  Clock, 
  AlertCircle, 
  Check, 
  ToggleLeft, 
  ToggleRight 
} from 'lucide-react';

export default function AdminPanel() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  // New department form draft
  const [newDeptId, setNewDeptId] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');

  // New doctor form draft
  const [newDocId, setNewDocId] = useState('');
  const [newDocName, setNewDocName] = useState('');
  const [newDocDeptName, setNewDocDeptName] = useState('');

  // Notifications
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    loadAdminCatalog();
  }, []);

  const loadAdminCatalog = async () => {
    setLoading(true);
    try {
      const depts = await dbService.getDepartments();
      const docs = await dbService.getDoctors();
      setDepartments(depts);
      setDoctors(docs);
      if (depts.length > 0) {
        setNewDocDeptName(depts[0].name);
      }
    } catch (err) {
      console.error('Error loading administrative lists', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (!newDeptName.trim()) {
      setErrorText('科別名稱判定為空。');
      return;
    }

    const deptId = 'dept_' + (newDeptId.trim() || Math.random().toString(36).substring(2, 7));
    const newDept: Department = {
      departmentId: deptId,
      name: newDeptName.trim(),
      description: newDeptDesc.trim() || '常規門診醫療服務。'
    };

    try {
      await dbService.saveDepartment(newDept);
      setNewDeptId('');
      setNewDeptName('');
      setNewDeptDesc('');
      loadAdminCatalog();
    } catch (err: any) {
      setErrorText('存儲科別發生故障：' + err.message);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm('您確定要永久移除此就診科別嗎？對應的預約時段及醫師可能受到影響。')) return;
    try {
      await dbService.deleteDepartment(id);
      loadAdminCatalog();
    } catch (err) {
      alert('刪除科別故障：' + err);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    if (!newDocName.trim()) {
      setErrorText('醫師姓名判定為空。');
      return;
    }
    if (!newDocDeptName) {
      setErrorText('請選取一個關聯科系。');
      return;
    }

    const docId = 'doc_' + (newDocId.trim() || Math.random().toString(36).substring(2, 7));
    const newDoctor: Doctor = {
      doctorId: docId,
      name: newDocName.trim(),
      department: newDocDeptName,
      isAvailable: true
    };

    try {
      await dbService.saveDoctor(newDoctor);
      setNewDocId('');
      setNewDocName('');
      loadAdminCatalog();
    } catch (err: any) {
      setErrorText('存儲醫師陣容發生故障：' + err.message);
    }
  };

  const handleToggleDocAvailability = async (doctor: Doctor) => {
    const updated = { ...doctor, isAvailable: !doctor.isAvailable };
    try {
      await dbService.saveDoctor(updated);
      loadAdminCatalog();
    } catch (err) {
      alert('切換職班狀態故障：' + err);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!window.confirm('您確定要永久移除此醫師值班檔案嗎？')) return;
    try {
      await dbService.deleteDoctor(id);
      loadAdminCatalog();
    } catch (err) {
      alert('細項檔案移除出錯：' + err);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 font-sans">
      
      {/* Admin Title Banner */}
      <div className="flex items-center gap-3.5 border-b border-purple-100 pb-5 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm flex-shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">門診配置與資源規劃控制台</h2>
          <p className="text-xs text-slate-500 mt-0.5">供醫院管理層進行科別建檔、主治醫師值班指派、以及視訊時段規則排程設定。</p>
        </div>
      </div>

      {errorText && (
        <div className="mb-6 rounded-xl bg-purple-50 border border-purple-100 p-4 text-purple-800 flex items-start gap-2.5 text-xs">
          <AlertCircle className="h-4.5 w-4.5 text-purple-600 mt-0.5 flex-shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-400 font-medium">讀取管理者配置中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* LEFT CHIP: Specialty Department Management */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-purple-500" />
                看診院區科系管理
              </h3>
              <p className="text-xs text-slate-400 mb-5">新增或移除視訊診療院所對外開設的名單科別。</p>

              {/* Add department form */}
              <form onSubmit={handleAddDept} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/50 mb-5 text-xs">
                <div className="font-extrabold text-slate-700 mb-1">新增醫療科別</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">科別代碼(英數/可選)</label>
                    <input
                      type="text"
                      value={newDeptId}
                      onChange={(e) => setNewDeptId(e.target.value)}
                      placeholder="例如：dept_ortho"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">科別中文姓名</label>
                    <input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="例如：骨科"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">看診範疇與導引描述</label>
                  <input
                    type="text"
                    value={newDeptDesc}
                    onChange={(e) => setNewDeptDesc(e.target.value)}
                    placeholder="例如：提供骨關節炎、肌肉拉傷門診視訊諮詢。"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    確認新增科別
                  </button>
                </div>
              </form>

              {/* Department List catalog */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">現有科別清冊 ({departments.length})</div>
                {departments.map(dept => (
                  <div key={dept.departmentId} className="flex items-start justify-between p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900">{dept.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">{dept.description}</p>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteDept(dept.departmentId)}
                      title="移除科系"
                      className="cursor-pointer p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* RIGHT CHIP: Attending Doctors roster management */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-150 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                主治醫師值班指派
              </h3>
              <p className="text-xs text-slate-400 mb-5">建立醫院視訊診主治名簿，並設定掛號可用狀態。</p>

              {/* Add doctor form */}
              <form onSubmit={handleAddDoctor} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/50 mb-5 text-xs">
                <div className="font-extrabold text-slate-700 mb-1">新增值班醫師</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">醫師執照代號(可選)</label>
                    <input
                      type="text"
                      value={newDocId}
                      onChange={(e) => setNewDocId(e.target.value)}
                      placeholder="例如：doc_wang"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">醫師姓名</label>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="例如：王曉東 醫師"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">歸屬視訊科系分部</label>
                  <select
                    value={newDocDeptName}
                    onChange={(e) => setNewDocDeptName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-purple-500 focus:outline-none"
                  >
                    {departments.map(dept => (
                      <option key={dept.departmentId} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    指派醫師名簿
                  </button>
                </div>
              </form>

              {/* Attending Doctors roster grids */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-1">執照值勤醫師名錄 ({doctors.length})</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctors.map(doc => (
                    <div 
                      key={doc.doctorId}
                      className={`p-3.5 border rounded-2xl flex items-center justify-between text-xs transition-all ${
                        doc.isAvailable 
                          ? 'bg-white border-slate-150 shadow-sm' 
                          : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800">{doc.name}</h4>
                        <div className="text-[10px] bg-slate-100 font-bold text-slate-500 px-2 py-0.5 rounded inline-block">
                          {doc.department}
                        </div>
                        <div className="text-[10px] font-sans">
                          {doc.isAvailable ? (
                            <span className="text-green-600 flex items-center gap-0.5 font-bold">● 可供視訊掛號</span>
                          ) : (
                            <span className="text-slate-400">休診暫停</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 leading-none">
                        <button
                          type="button"
                          onClick={() => handleToggleDocAvailability(doc)}
                          title={doc.isAvailable ? '設為休診' : '設為看診中'}
                          className="cursor-pointer p-0.5 text-slate-400 hover:text-purple-600 transition-colors"
                        >
                          {doc.isAvailable ? (
                            <ToggleRight className="h-7 w-7 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="h-7 w-7 text-slate-350" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteDoctor(doc.doctorId)}
                          title="移出調度名冊"
                          className="cursor-pointer p-1 rounded hover:bg-red-50 text-slate-400 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

    </div>
  );
}
