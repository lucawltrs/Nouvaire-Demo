import { Settings, Users, Shield, Building2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/auth/useAuthStore';

export function SettingsPage() {
  const { user, team } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Settings</h1>
        <p className="mt-1 text-sm text-gray-400">Manage your team and account configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Info */}
        <Card className="p-6 border border-slate-600">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Building2 size={18} className="text-brand-primary" />
            </div>
            <h2 className="text-base font-semibold text-gray-100">Team</h2>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <dt className="text-sm text-gray-400">Team Name</dt>
              <dd className="text-sm font-medium text-gray-100">{team?.team_name ?? '—'}</dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <Link
              to="/settings/members"
              className="group flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-brand-primary/50 hover:bg-slate-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-colors">
                  <Users size={16} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">User Management</p>
                  <p className="text-xs text-gray-400">View and manage team members</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-brand-primary transition-colors" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <Link
              to="/settings/accounts"
              className="group flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-brand-primary/50 hover:bg-slate-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/20 transition-colors">
                  <Users size={16} className="text-brand-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-100">Account Management</p>
                  <p className="text-xs text-gray-400">View and manage team accounts</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-brand-primary transition-colors" />
            </Link>
          </div>
        </Card>

        {/* Account Info */}
        <Card className="p-6 border border-slate-600">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Users size={18} className="text-brand-primary" />
            </div>
            <h2 className="text-base font-semibold text-gray-100">Your Account</h2>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <dt className="text-sm text-gray-400">Name</dt>
              <dd className="text-sm font-medium text-gray-100">{user?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-700">
              <dt className="text-sm text-gray-400">Email</dt>
              <dd className="text-sm text-gray-300">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-gray-400">Role</dt>
              <dd>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                  <Shield size={11} />
                  {team?.role ?? 'admin'}
                </span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="p-6 border border-red-900/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-red-900/20 flex items-center justify-center">
            <Settings size={18} className="text-red-500" />
          </div>
          <h2 className="text-base font-semibold text-gray-100">Danger Zone</h2>
        </div>
        <p className="text-sm text-gray-400">Destructive actions will appear here.</p>
      </Card>
    </div>
  );
}
