import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { LayoutDashboard, LogOut, ChevronDown, MessagesSquare, BarChart3, Users, Settings, Menu, X, Cloud } from 'lucide-react';
import { useWorkSessionStore } from '../../modules/work-sessions/store/useWorkSessionStore';
import { WorkSessionModal } from '../../modules/work-sessions/components/WorkSessionModal';
import { WorkSessionTimer } from '../../modules/work-sessions/components/WorkSessionTimer';

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
  const { user, team, logout } = useAuthStore();
  const { init: initWorkSession } = useWorkSessionStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    initWorkSession();
  }, [initWorkSession]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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

            {/* Desktop User Info */}
            <div className="hidden lg:flex items-center gap-4 shrink-0">
              <WorkSessionTimer />
              <div className="text-right">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-sm font-medium text-gray-100">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-all"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <WorkSessionTimer />
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

                {/* Mobile User Info & Logout */}
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-gray-100 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
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
