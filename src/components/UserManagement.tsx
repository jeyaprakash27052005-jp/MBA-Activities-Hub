import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Shield, 
  GraduationCap, 
  Mail, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  X,
  AlertCircle
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { createSystemUser, updateSystemUser, deleteSystemUser } from '../services/userService';

interface UserManagementProps {
  users: UserProfile[];
}

export const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
  const { role, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newDepartment, setNewDepartment] = useState('MBA General');
  const [newBatch, setNewBatch] = useState('MBA Class of 2026');
  const [saving, setSaving] = useState(false);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.batch && u.batch.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      alert('Name and Email are required.');
      return;
    }

    setSaving(true);
    try {
      const uid = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await createSystemUser({
        uid,
        displayName: newName,
        email: newEmail,
        role: newRole,
        department: newDepartment,
        batch: newBatch,
        status: 'active',
      });
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
    } catch (err) {
      alert('Failed to create user in Firestore: ' + err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async (user: UserProfile, updatedRole: UserRole) => {
    try {
      await updateSystemUser(user.uid, { role: updatedRole });
    } catch (err) {
      alert('Failed to update user role: ' + err);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateSystemUser(user.uid, { status: newStatus });
    } catch (err) {
      alert('Failed to toggle status: ' + err);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (confirm(`Are you sure you want to remove user "${user.displayName}" from the directory?`)) {
      try {
        await deleteSystemUser(user.uid);
      } catch (err) {
        alert('Failed to delete user: ' + err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>MBA User & Role Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage MBA students, faculty members, and system administrators stored in Firebase Firestore.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, department, or cohort batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
        >
          <option value="all">All Roles ({users.length})</option>
          <option value="admin">Administrators</option>
          <option value="faculty">Faculty</option>
          <option value="student">MBA Students</option>
        </select>
      </div>

      {/* User Directory Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Department & Batch</th>
                <th className="px-5 py-3.5">System Role</th>
                <th className="px-5 py-3.5">Account Status</th>
                {isAdmin && <th className="px-5 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-750 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                        {user.displayName ? user.displayName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{user.displayName}</span>
                          {user.email === 'jeyaprakash27052005@gmail.com' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {user.department || 'MBA Department'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user.batch || 'Class of 2026'}
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                      >
                        <option value="admin">Admin</option>
                        <option value="faculty">Faculty</option>
                        <option value="student">Student</option>
                      </select>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : user.role === 'faculty'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => isAdmin && handleToggleStatus(user)}
                      disabled={!isAdmin}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>

                  {isAdmin && (
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    No users matching criteria found in Firestore.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add MBA Directory Member
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@mba.edu"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="faculty">Faculty</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Batch / Cohort
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class of 2026"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Department / Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marketing & Digital Commerce"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Save to Firestore'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
