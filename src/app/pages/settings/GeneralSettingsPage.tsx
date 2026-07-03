import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconBell, IconSettings, IconAlertCircle } from '@tabler/icons-react';
import { Card } from '../../../components/ui/Card';
import { PageLoader } from '../../../components/ui/PageLoader';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ToastContainer, toast } from '../../../lib/toast';
import { settingsApi } from '../../../modules/shared/services/settingsApi';
import { PushNotificationToggle } from '../../../components/PushNotificationToggle';

export function GeneralSettingsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState('');
  const [workSessionsEnabled, setWorkSessionsEnabled] = useState(false);
  const [unreadMessagesEnabled, setUnreadMessagesEnabled] = useState(false);
  const [unreadThresholdMinutes, setUnreadThresholdMinutes] = useState(60);
  const [chatterPercentage, setChatterPercentage] = useState(0);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await settingsApi.get();
      setWebhookUrl(data.discord_webhook_url ?? '');
      setWorkSessionsEnabled(data.work_sessions_enabled);
      setUnreadMessagesEnabled(data.unread_messages_enabled);
      setUnreadThresholdMinutes(data.unread_messages_threshold_minutes ?? 60);
      setChatterPercentage(data.chatter_percentage ?? 0);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings. Please try again.');
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
      await settingsApi.update({
        discord_webhook_url: webhookUrl.trim() || null,
        work_sessions_enabled: workSessionsEnabled,
        unread_messages_enabled: unreadMessagesEnabled,
        unread_messages_threshold_minutes: unreadThresholdMinutes,
        chatter_percentage: chatterPercentage,
      });
      toast.success('Settings saved');
    } catch (err) {
      console.error('Failed to save settings:', err);
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
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <IconArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">General Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure your team settings and notification behavior.</p>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <IconAlertCircle size={18} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Notifications Card */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <IconBell size={18} className="text-brand" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
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
              <div className="flex items-center justify-between py-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Work Session Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send a Discord message when a work session starts or ends
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={workSessionsEnabled}
                  onClick={() => setWorkSessionsEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background ${
                    workSessionsEnabled ? 'bg-brand' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                      workSessionsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Unread Messages Toggle */}
              <div className="flex items-center justify-between py-4 border-t border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">Unread Message Notifications</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Send a Discord message when there are unread messages past the threshold
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={unreadMessagesEnabled}
                  onClick={() => setUnreadMessagesEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background ${
                    unreadMessagesEnabled ? 'bg-brand' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                      unreadMessagesEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Unread Messages Threshold */}
              {unreadMessagesEnabled && (
                <div className="pb-2">
                  <Input
                    label="Unread Message Threshold (minutes)"
                    type="number"
                    placeholder="60"
                    value={String(unreadThresholdMinutes)}
                    onChange={(e) => {
                      const val = Math.min(10080, Math.max(1, Number(e.target.value)));
                      setUnreadThresholdMinutes(val);
                    }}
                    min={1}
                    max={10080}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Min: 1 minute · Max: 10080 minutes (1 week)
                  </p>
                </div>
              )}

              {/* Push Notifications */}
              <div className="py-4 border-t border-border">
                <PushNotificationToggle />
              </div>
            </div>
          </Card>

          {/* IconSettings Card */}
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <IconSettings size={18} className="text-brand" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Chatter Percentage */}
              <div>
                <Input
                  label="Chatter Percentage"
                  type="number"
                  placeholder="0.00"
                  value={String(chatterPercentage)}
                  onChange={(e) => {
                    const parsed = Number(e.target.value);
                    const val = Number.isNaN(parsed)
                      ? 0
                      : Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
                    setChatterPercentage(val);
                  }}
                  step={0.01}
                  min={0}
                  max={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional percentage value from 0.00 to 100.00.
                </p>
              </div>
            </div>
          </Card>
          </div>

          {/* Save */}
          <div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
