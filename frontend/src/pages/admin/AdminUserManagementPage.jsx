import React from 'react';
import { ShieldCheck, UserCheck, Users, Building } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AdminUserManagementPage = () => {
  const { t } = useTranslation();

  const users = [
    { id: 1, name: 'State Land Acquisition Administrator', email: 'admin@bhoomisetu.gov.in', role: 'admin', dept: 'Revenue & Disaster Management' },
    { id: 2, name: 'Shri Ashok Patra (OAS)', email: 'officer.patra@bhoomisetu.gov.in', role: 'land_acquisition_officer', dept: 'Khurda Collectorate' },
    { id: 3, name: 'Smt. Sunita Mishra', email: 'surveyor.mishra@bhoomisetu.gov.in', role: 'survey_officer', dept: 'Directorate of Land Records & Surveys' },
    { id: 4, name: 'Shri Debasis Jena', email: 'comp.jena@bhoomisetu.gov.in', role: 'compensation_officer', dept: 'Finance & Accounts Division' },
    { id: 5, name: 'Project Director (NHAI Odisha)', email: 'nhai.odisha@bhoomisetu.gov.in', role: 'project_authority', dept: 'National Highways Authority' },
    { id: 6, name: 'Bikram Keshari Das', email: 'landowner.das@gmail.com', role: 'landowner', dept: 'Citizen (Pipili)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-govblue-700" />
            <span>{t('nav.admin')}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Role-Based Access Control (RBAC), officer credentials, and department provisioning.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User Name</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className="bg-govblue-50 text-govblue-700 border border-govblue-100 px-2.5 py-1 rounded-md font-bold text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{u.dept}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
