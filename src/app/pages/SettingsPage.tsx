import { IconSettings, IconUsers, IconShield, IconBuilding, IconChevronRight, IconStack2 } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/auth/useAuthStore';

export function SettingsPage() {
  const { user, team } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your team and account configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team IconInfoCircle */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
              <IconBuilding size={18} className="text-brand" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Team</h2>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <dt className="text-sm text-muted-foreground">Team Name</dt>
              <dd className="text-sm font-medium text-foreground">{team?.team_name ?? '—'}</dd>
            </div>
          </dl>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              to="/settings/members"
              className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 hover:bg-accent transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                  <IconUsers size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">User Management</p>
                  <p className="text-xs text-muted-foreground">View and manage team chatters</p>
                </div>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground group-hover:text-brand transition-colors" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              to="/settings/accounts"
              className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 hover:bg-accent transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                  <IconUsers size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Account Management</p>
                  <p className="text-xs text-muted-foreground">View and manage team accounts</p>
                </div>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground group-hover:text-brand transition-colors" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              to="/settings/groups"
              className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 hover:bg-accent transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                  <IconStack2 size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Groups</p>
                  <p className="text-xs text-muted-foreground">View and manage team groups</p>
                </div>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground group-hover:text-brand transition-colors" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <Link
              to="/settings/notifications"
              className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-brand/40 hover:bg-accent transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0 group-hover:bg-brand/20 transition-colors">
                  <IconSettings size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Settings</p>
                  <p className="text-xs text-muted-foreground">Configure notifications and team settings</p>
                </div>
              </div>
              <IconChevronRight size={16} className="text-muted-foreground group-hover:text-brand transition-colors" />
            </Link>
          </div>
        </Card>

        {/* Account IconInfoCircle */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
              <IconUsers size={18} className="text-brand" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Your Account</h2>
          </div>

          <dl className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="text-sm font-medium text-foreground">{user?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="text-sm text-foreground">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted-foreground">Role</dt>
              <dd>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand border border-brand/20">
                  <IconShield size={11} />
                  {team?.role ?? 'admin'}
                </span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
