import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      setError('Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
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
          <h1 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-100">Nouvaire.io</h1>
        </div>

        <Card glow className="p-6 sm:p-8 w-full">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="admin@nouvaire.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>

          </form>
        </Card>
      </div>
      
    </div>
  );
}
