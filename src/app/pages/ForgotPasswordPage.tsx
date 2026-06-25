import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { IconArrowLeft, IconCircleCheck } from '@tabler/icons-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { OtpInput } from '../../components/ui/OtpInput';
import { forgotPassword, resetPassword } from '../../lib/auth/authApi';
import { useAuthStore } from '../../lib/auth/useAuthStore';

type Step = 'email' | 'reset' | 'success';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loginWithToken = useAuthStore((state) => state.loginWithToken);
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setStep('reset');
    } catch {
      setError('Fehler beim Senden des Codes. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError('Bitte gib den vollständigen 6-stelligen Code ein.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const token = await resetPassword(email, otp, password, passwordConfirmation);
      await loginWithToken(token);
      setStep('success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Zurücksetzen.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4">
      <div className="flex-1 w-full max-w-md flex flex-col items-center justify-center py-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center">
            <img src="/assets/logo-crown.png" alt="Logo" className="w-24 h-24 sm:w-32 sm:h-32 object-contain" />
          </div>
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-foreground">Nouvaire.io</h1>
        </div>

        <Card glow className="p-6 sm:p-8 w-full">
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Passwort vergessen</h2>
                <p className="text-sm text-muted-foreground">
                  Gib deine E-Mail-Adresse ein. Wir senden dir einen 6-stelligen Code.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="E-Mail"
                type="email"
                placeholder="deine@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Code senden
              </Button>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <IconArrowLeft size={14} />
                  Zurück zum Login
                </Link>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Neues Passwort setzen</h2>
                <p className="text-sm text-muted-foreground">
                  Code wurde an <span className="text-foreground font-medium">{email}</span> gesendet.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <p className="block text-sm font-medium text-foreground mb-3">6-stelliger Code</p>
                <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
              </div>

              <Input
                label="Neues Passwort"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Passwort bestätigen"
                type="password"
                placeholder="••••••••"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={otp.length < 6}>
                Passwort zurücksetzen
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setError(''); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Anderen Code anfordern
                </button>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                <IconCircleCheck size={28} className="text-green-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Passwort geändert!</h2>
                <p className="text-sm text-muted-foreground">Du wirst automatisch eingeloggt…</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
