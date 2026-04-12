import { ReactNode, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { LayoutDashboard, LogOut, ChevronDown, MessagesSquare, BarChart3, Users, Settings, Menu, X, Cloud, UserCircle, Square } from 'lucide-react';
import { useWorkSessionStore } from '../../modules/work-sessions/store/useWorkSessionStore';
import { WorkSessionModal } from '../../modules/work-sessions/components/WorkSessionModal';
import { putEndWorkSession } from '../../modules/work-sessions/services/workSession.api';
import { unreadCountStore } from '../../lib/unreadCountStore';
import { dashboardApi } from '../../modules/dashboard/services/dashboard.api';

const APP_TITLE = 'Nouvaire';

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const playNotificationSound = () => {
  try {
    const ctx = new AudioContext();

    const playTone = (freq: number, startAt: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startAt);
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(peakGain, startAt + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
      osc.start(startAt);
      osc.stop(startAt + duration);
    };

    playTone(880, ctx.currentTime, 0.35, 0.28);
    playTone(1175, ctx.currentTime + 0.18, 0.45, 0.22);

    setTimeout(() => ctx.close(), 800);
  } catch {
    // AudioContext not available
  }
};

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  path: string;
  label: string;
  icon?: any;
  children?: { path: string; label: string }[];
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, team, token, logout } = useAuthStore();
  const { init: initWorkSession, syncWithServer, active, startedAt, sessionId, endSession } = useWorkSessionStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // User profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Session end state
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Elapsed timer
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) { setElapsed(0); return; }
    const calc = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
        setSessionError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  // ── Global unread-chat badge ────────────────────────────────────────────────
  const unreadChats = useSyncExternalStore(unreadCountStore.subscribe, unreadCountStore.get);
  const prevUnreadRef = useRef<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await dashboardApi.getDashboard(30);
        const total = data.data.reduce((sum, acc) => sum + (acc.kpis.unread_chats ?? 0), 0);
        unreadCountStore.set(total);
      } catch {
        // ignore
      }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (prevUnreadRef.current !== null && unreadChats > prevUnreadRef.current) {
      playNotificationSound();
    }
    prevUnreadRef.current = unreadChats;
    document.title = unreadChats > 0 ? `(${unreadChats}) | ${APP_TITLE}` : APP_TITLE;
  }, [unreadChats]);
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    initWorkSession();
    syncWithServer();
    const id = setInterval(syncWithServer, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [initWorkSession, syncWithServer]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleEndSession = async () => {
    if (!token || !sessionId) return;
    setSessionLoading(true);
    setSessionError(null);
    try {
      await putEndWorkSession(sessionId, new Date().toISOString(), token);
      endSession();
      setProfileOpen(false);
    } catch {
      setSessionError('Schicht konnte nicht beendet werden.');
    } finally {
      setSessionLoading(false);
    }
  };

  const isAdmin = team?.role === 'admin';

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/accounts', label: 'Accounts', icon: Users },
    { path: '/inbox', label: 'Inbox', icon: MessagesSquare },
    { path: '/cloud', label: 'Cloud', icon: Cloud },
    { path: '/performance', label: 'Performance', icon: BarChart3 },
    ...(isAdmin ? [{ path: '/settings', label: 'Settings', icon: Settings }] : []),
  ];

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <nav className="bg-sidebar border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 shrink-0">
              <img src="/assets/logo-free.png" alt="Nouvaire Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              <span className="text-xl sm:text-2xl font-bold text-gray-100">Nouvaire</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <div className="flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.children
                    ? item.children.some(child =>
                        location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                      )
                    : location.pathname === item.path ||
                      (item.path !== '/' && item.path !== '#' && location.pathname.startsWith(item.path));
                  const isOpen = openDropdown === item.path;

                  if (item.children) {
                    return (
                      <div
                        key={item.path}
                        className="relative"
                        onMouseEnter={() => setOpenDropdown(item.path)}
                        onMouseLeave={() => setOpenDropdown(null)}
                      >
                        <button
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            isActive
                              ? 'bg-brand-primary hover:bg-brand-hover text-white shadow-md'
                              : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                          }`}
                        >
                          {Icon && <Icon size={18} />}
                          <span className="font-medium">{item.label}</span>
                          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="absolute top-full left-0 mt-1 min-w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 whitespace-nowrap">
                            {item.children.map((child) => {
                              const isChildActive = location.pathname === child.path;
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className={`block px-4 py-2 transition-all ${
                                    isChildActive
                                      ? 'bg-brand-primary hover:bg-brand-hover text-white'
                                      : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-brand-primary hover:bg-brand-hover text-white shadow-md'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-slate-700'
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Desktop User Widget */}
            <div className="hidden lg:flex items-center shrink-0">
              <div ref={profileRef} className="relative">
                <button
                  onClick={() => { setProfileOpen((o) => !o); setSessionError(null); }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-700 transition-all group ${profileOpen ? 'bg-slate-700' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    active
                      ? 'ring-2 ring-brand-primary ring-offset-1 ring-offset-[#1e293b] bg-brand-primary/15'
                      : 'bg-slate-600 group-hover:bg-slate-500'
                  }`}>
                    {active && (
                      <span className="absolute w-2 h-2 rounded-full bg-brand-primary animate-ping opacity-60" />
                    )}
                    <span className="text-xs font-semibold text-gray-300 relative z-10">
                      {user?.name?.charAt(0).toUpperCase() ?? '?'}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="text-left">
                    {active ? (
                      <>
                        <p className="text-xs text-brand-primary leading-none mb-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse inline-block" />
                          Aktive Schicht
                        </p>
                        <p className="text-sm font-semibold text-gray-100 leading-none font-mono tracking-wide">
                          {formatElapsed(elapsed)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 leading-none mb-0.5">Signed in as</p>
                        <p className="text-sm font-medium text-gray-100 leading-none">{user?.name ?? user?.email}</p>
                      </>
                    )}
                  </div>

                  <ChevronDown size={14} className={`text-gray-500 transition-transform ml-1 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs font-medium text-gray-100 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                    </div>

                    <div className="p-2 space-y-0.5">
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-gray-100 hover:bg-slate-700 transition-colors"
                      >
                        <UserCircle size={15} />
                        Mein Profil
                      </Link>

                      {active && (
                        <button
                          onClick={handleEndSession}
                          disabled={sessionLoading}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-60"
                        >
                          {sessionLoading
                            ? <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                            : <Square size={15} />
                          }
                          Schicht beenden
                        </button>
                      )}

                      {sessionError && (
                        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mx-0">
                          {sessionError}
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border p-2">
                      <button
                        onClick={() => { handleLogout(); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-colors"
                      >
                        <LogOut size={15} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              {/* Compact session indicator for mobile */}
              {active && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                  {formatElapsed(elapsed)}
                </div>
              )}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-border py-4">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.children
                    ? item.children.some(child =>
                        location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                      )
                    : location.pathname === item.path ||
                      (item.path !== '/' && item.path !== '#' && location.pathname.startsWith(item.path));

                  if (item.children) {
                    return (
                      <div key={item.path}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === item.path ? null : item.path)}
                          className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-brand-primary text-white'
                              : 'text-gray-400 hover:bg-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {Icon && <Icon size={18} />}
                            <span className="font-medium">{item.label}</span>
                          </div>
                          <ChevronDown size={16} className={`transition-transform ${openDropdown === item.path ? 'rotate-180' : ''}`} />
                        </button>

                        {openDropdown === item.path && (
                          <div className="ml-4 mt-2 space-y-1">
                            {item.children.map((child) => {
                              const isChildActive = location.pathname === child.path;
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={`block px-4 py-2 rounded-lg transition-all ${
                                    isChildActive
                                      ? 'bg-brand-primary text-white'
                                      : 'text-gray-400 hover:bg-slate-700'
                                  }`}
                                >
                                  {child.label}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-400 hover:bg-slate-700'
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}

                {/* Mobile User Section */}
                <div className="pt-4 mt-4 border-t border-border space-y-1">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${active ? 'ring-2 ring-brand-primary bg-brand-primary/15' : 'bg-slate-600'}`}>
                      <span className="text-xs font-semibold text-gray-300">
                        {user?.name?.charAt(0).toUpperCase() ?? '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <UserCircle size={16} className="text-gray-500 shrink-0" />
                  </Link>

                  {active && (
                    <button
                      onClick={handleEndSession}
                      disabled={sessionLoading}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-60"
                    >
                      {sessionLoading
                        ? <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Square size={18} />
                      }
                      <span className="font-medium">Schicht beenden</span>
                    </button>
                  )}

                  <button
                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:bg-slate-700 transition-all"
                  >
                    <LogOut size={18} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <WorkSessionModal />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
        {children}
      </main>

      <footer className="mt-auto border-t border-border bg-sidebar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Developed by{' '}
            <a
              href="https://wolters-solutions.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-primary hover:text-brand-hover transition-colors font-medium"
            >
              Wolters Solutions
            </a>
          </p>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600 text-[11px] font-mono text-gray-400 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
            v{__APP_VERSION__}
          </span>
        </div>
      </footer>
    </div>
  );
}
