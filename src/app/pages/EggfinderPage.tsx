import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Package, Tractor, Plus, TrendingUp, Users } from 'lucide-react';

export function EggfinderPage() {
  const totalProducers = 24;
  const totalProducts = 158;
  const activeProducers = 22;

  const recentActivity = [
    { id: 1, type: 'producer', name: 'Bio-Hof Schmidt', date: '2026-02-22', action: 'added' },
    { id: 2, type: 'product', name: 'Freilandeier Large', date: '2026-02-22', action: 'updated' },
    { id: 3, type: 'producer', name: 'Geflügelhof Müller', date: '2026-02-21', action: 'updated' },
    { id: 4, type: 'product', name: 'Bio-Eier Medium', date: '2026-02-20', action: 'added' },
    { id: 5, type: 'product', name: 'Bodenhaltung XL', date: '2026-02-20', action: 'updated' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">
            Eggfinder Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Manage your producers and products</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Producers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center">
              <Tractor className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-brand-500">
            <TrendingUp size={16} className="mr-1" />
            <span>All registered</span>
          </div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Producers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeProducers}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">Currently active</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">All products</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card glow className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/producers">
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-brand-primary hover:bg-brand-hover text-white rounded-lg transition-all shadow-md hover:shadow-lg">
              <Plus size={20} />
              <span className="font-medium">Add New Producer</span>
            </button>
          </Link>
          <Link to="/products">
            <button className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
              <Plus size={20} />
              <span className="font-medium">Add New Product</span>
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Link to="/producers">
            <Button variant="secondary" className="w-full">
              <Tractor size={18} className="mr-2" />
              View All Producers
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="secondary" className="w-full">
              <Package size={18} className="mr-2" />
              View All Products
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card glow className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-border hover:border-brand-500 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  activity.type === 'producer'
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-purple-50 text-purple-600'
                }`}>
                  {activity.type === 'producer' ? (
                    <Tractor size={20} />
                  ) : (
                    <Package size={20} />
                  )}
                </div>
                <div>
                  <h3 className="text-gray-900 font-medium">{activity.name}</h3>
                  <p className="text-sm text-gray-600">
                    {activity.action === 'added' ? 'Added' : 'Updated'} • {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-medium ${
                activity.type === 'producer'
                  ? 'bg-brand-100 text-brand-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
