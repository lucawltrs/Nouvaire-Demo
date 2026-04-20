import { getConfig } from '../config';

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${getConfig().API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error('Netzwerkfehler beim Senden des Codes.');
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
  password_confirmation: string
): Promise<string> {
  const response = await fetch(`${getConfig().API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, password, password_confirmation }),
  });

  if (!response.ok) {
    let message = 'Fehler beim Zurücksetzen des Passworts.';
    try {
      const data = await response.json();
      if (response.status === 422 && data.errors) {
        message = (Object.values(data.errors) as string[][]).flat().join(' ');
      } else if (data.message) {
        message = data.message;
      }
    } catch {}
    if (response.status === 400 && message === 'Fehler beim Zurücksetzen des Passworts.') {
      message = 'Ungültiger oder abgelaufener Code.';
    }
    throw new Error(message);
  }

  const data = await response.json();
  const newToken: string = data.data?.token ?? data.token;
  if (!newToken) throw new Error('Kein Token in der Antwort.');
  return newToken;
}
