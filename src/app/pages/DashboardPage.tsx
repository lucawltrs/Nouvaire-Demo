import { Card } from '../../components/ui/Card';
import { FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export function DashboardPage() {

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#06b6d4] via-[#22d3ee] to-[#3b82f6]">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-400">Welcome to Wolters Solutions Admin Panel</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Posts</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-cyan-400">
            <TrendingUp size={16} className="mr-1" />
            <span>All content</span>
          </div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-400">Live content</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Drafts</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-yellow-400">In progress</div>
        </Card>

        <Card glow className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">All Tags</p>
              <p className="text-3xl font-bold text-gray-100 mt-2">0</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-400">Categories</div>
        </Card>
      </div>
    </div>
  );
}
