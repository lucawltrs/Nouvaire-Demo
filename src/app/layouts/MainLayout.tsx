import { ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { IconLayoutDashboard, IconLogout, IconMessage, IconUsers, IconSettings, IconCloud, IconUserCircle, IconSquare, IconSend, IconMenu2, IconChevronDown, IconSun, IconMoon } from '@tabler/icons-react';
import { NotificationsProvider } from '../../contexts/NotificationsContext';
import { NotificationBell } from '../../components/NotificationBell';
import { PushNotificationBanner } from '../../components/PushNotificationBanner';
import { useWorkSessionStore } from '../../modules/work-sessions/store/useWorkSessionStore';
import { WorkSessionModal } from '../../modules/work-sessions/components/WorkSessionModal';
import { putEndWorkSession } from '../../modules/work-sessions/services/workSession.api';
import { unreadCountStore } from '../../lib/unreadCountStore';
import { dashboardApi } from '../../modules/dashboard/services/dashboard.api';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet';

const APP_TITLE = 'Nouvaire';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface MainLayoutProps { children: ReactNode }

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// ── Sidebar Nav ────────────────────────────────────────────────────────────

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { team } = useAuthStore();
  const isAdmin = team?.role === 'admin';

  const navItems: NavItem[] = [
    { path: '/',              label: 'Dashboard',     icon: IconLayoutDashboard },
    { path: '/accounts',      label: 'Accounts',      icon: IconUsers },
    { path: '/inbox',         label: 'Inbox',         icon: IconMessage },
    { path: '/cloud',         label: 'Cloud',         icon: IconCloud },
    { path: '/mass-messages', label: 'Mass Messages', icon: IconSend },
    ...(isAdmin ? [{ path: '/settings', label: 'Settings', icon: IconSettings } as NavItem] : []),
  ];

  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.path === '/'
            ? location.pathname === '/'
            : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-brand/15 text-brand'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
            )}
          >
            <span className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150',
              isActive ? 'bg-brand/20' : ''
            )}>
              <Icon size={17} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ── Theme Toggle ───────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  );
}

// ── Sidebar Content ────────────────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 shrink-0">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <img src="/assets/logo-free.png" alt="Nouvaire" className="h-8 w-auto object-contain" />
          <span className="text-white font-bold text-xl tracking-tight">Nouvaire</span>
        </Link>
      </div>

      <Separator className="bg-slate-800 shrink-0" />

      <SidebarNav onNavigate={onNavigate} />

      {/* Version */}
      <div className="px-4 py-4 border-t border-slate-800 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full bg-brand" />
          v{__APP_VERSION__}
        </span>
      </div>
    </div>
  );
}

// ── Main Layout ────────────────────────────────────────────────────────────

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const { init: initWorkSession, syncWithServer, active, startedAt, sessionId, endSession } = useWorkSessionStore();
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!active || !startedAt) { setElapsed(0); return; }
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const unreadChats = useSyncExternalStore(unreadCountStore.subscribe, unreadCountStore.get);

  useEffect(() => {
    const poll = async () => {
      if (Date.now() - unreadCountStore.getUpdatedAt() < 25_000) return;
      try {
        const data = await dashboardApi.getDashboard(30);
        const total = data.data.reduce((sum, acc) => sum + (acc.kpis.unread_chats ?? 0), 0);
        unreadCountStore.set(total);
      } catch { /* ignore */ }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.title = unreadChats > 0 ? `(${unreadChats}) | ${APP_TITLE}` : APP_TITLE;
  }, [unreadChats]);

  useEffect(() => {
    initWorkSession();
    syncWithServer();
    const id = setInterval(syncWithServer, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [initWorkSession, syncWithServer]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleEndSession = async () => {
    if (!token || !sessionId) return;
    setSessionLoading(true);
    setSessionError(null);
    try {
      await putEndWorkSession(sessionId, new Date().toISOString(), token);
      endSession();
    } catch {
      setSessionError('Schicht konnte nicht beendet werden.');
    } finally {
      setSessionLoading(false);
    }
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <NotificationsProvider>
      <div className="flex h-screen overflow-hidden bg-background">

        {/* ── Desktop Sidebar ──────────────────────────────── */}
        <aside className="hidden lg:flex w-64 flex-col shrink-0">
          <SidebarContent />
        </aside>

        {/* ── Main Content ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header */}
          <header className="h-14 bg-card border-b border-border flex items-center px-4 sm:px-6 justify-between shrink-0 z-10">

            {/* Left: mobile hamburger */}
            <div className="flex items-center">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <button className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <IconMenu2 size={18} />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 border-slate-800">
                  <SidebarContent onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-1.5">
              {active && (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand/10 border border-brand/20 text-brand text-xs font-mono mr-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  {formatElapsed(elapsed)}
                </div>
              )}

              <ThemeToggle />
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors ml-0.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn(
                        'text-xs font-semibold',
                        active ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'
                      )}>
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                      {user?.name ?? user?.email}
                    </span>
                    <IconChevronDown size={14} className="text-muted-foreground hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer">
                      <IconUserCircle size={15} />
                      Mein Profil
                    </Link>
                  </DropdownMenuItem>

                  {active && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleEndSession}
                        disabled={sessionLoading}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <IconSquare size={15} className="shrink-0" />
                        {sessionLoading ? 'Beende Schicht…' : 'Schicht beenden'}
                      </DropdownMenuItem>
                      {sessionError && (
                        <div className="px-2 py-1">
                          <p className="text-xs text-destructive">{sessionError}</p>
                        </div>
                      )}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <IconLogout size={15} />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>

      <WorkSessionModal />
      <PushNotificationBanner />
    </NotificationsProvider>
  );
}
