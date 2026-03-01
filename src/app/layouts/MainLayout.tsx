import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { LayoutDashboard, LogOut, CircleUser, ChevronDown } from 'lucide-react';

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
  const { user, logout } = useAuthStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { 
      path: '/eggfinder', 
      label: 'Eggfinder',
      children: [
        { path: '/eggfinder', label: 'Dashboard' },
        { path: '/products', label: 'Produkte' },
        { path: '/categories', label: 'Kategorien' },
        { path: '/producers', label: 'Produzenten' },
      ]
    },
    { path: '/projects', label: 'Projekte', icon: CircleUser },
  ];

  return (
    <div className="min-h-screen bg-page">
      <nav className="bg-sidebar border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-3">
                <img src="/assets/logo.svg" alt="4based CRM Logo" className="w-12 h-12 object-contain" />
                <span className="text-2xl font-bold text-gray-900">CRM</span>
              </Link>

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
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {Icon && <Icon size={18} />}
                          <span className="font-medium">{item.label}</span>
                          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="absolute top-full left-0 mt-1 min-w-full bg-white border border-border rounded-lg shadow-lg overflow-hidden z-50 whitespace-nowrap">
                            {item.children.map((child) => {
                              const isChildActive = location.pathname === child.path;
                              return (
                                <Link
                                  key={child.path}
                                  to={child.path}
                                  className={`block px-4 py-2 transition-all ${
                                    isChildActive
                                      ? 'bg-brand-primary hover:bg-brand-hover text-white'
                                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {Icon && <Icon size={18} />}
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
