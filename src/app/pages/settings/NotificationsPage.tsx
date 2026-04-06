import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ToastContainer, toast } from '../../../lib/toast';
import {
  notificationsApi,
} from '../../../modules/shared/services/notificationsApi';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [workSessionsEnabled, setWorkSessionsEnabled] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationsApi.get();
      setWebhookUrl(data.discord_webhook_url ?? '');
      setWorkSessionsEnabled(data.work_sessions_enabled);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
      setError('Failed to load notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await notificationsApi.update({
        discord_webhook_url: webhookUrl.trim() || null,
        work_sessions_enabled: workSessionsEnabled,
      });
      toast.success('Notification settings saved');
    } catch (err) {
      console.error('Failed to save notification settings:', err);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100">Notifications</h1>
          <p className="mt-1 text-sm text-gray-400">Configure Discord notifications for your team</p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <Card className="p-6 border border-slate-600 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <Bell size={18} className="text-brand-primary" />
            </div>
            <h2 className="text-base font-semibold text-gray-100">Discord Integration</h2>
          </div>

          <div className="space-y-6">
            {/* Webhook URL */}
            <Input
              label="Discord Webhook URL"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />

            {/* Work Sessions Toggle */}
            <div className="flex items-center justify-between py-4 border-t border-slate-700">
              <div>
                <p className="text-sm font-medium text-gray-100">Work Session Notifications</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Send a Discord message when a work session starts or ends
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={workSessionsEnabled}
                onClick={() => setWorkSessionsEnabled((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  workSessionsEnabled ? 'bg-brand-primary' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    workSessionsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Save */}
            <div className="pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
