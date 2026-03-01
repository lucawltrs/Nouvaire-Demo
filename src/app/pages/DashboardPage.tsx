import { Card } from '../../components/ui/Card';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function DashboardPage() {

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600">Welcome to 4CRM Systems</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-brand-primary flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-brand-500">
            <TrendingUp size={16} className="mr-1" />
            <span>All content</span>
          </div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600">Live content</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Drafts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-yellow-600">In progress</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">All Tags</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600">Categories</div>
        </Card>
      </div>
    </div>
  );
}
