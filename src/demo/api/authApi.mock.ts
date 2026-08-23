import { fakeLatency } from '../utils';

/**
 * Demo password-reset flow: never sends a real email or validates a real
 * code. Any 6-digit code is accepted so the "Passwort ändern" flow in
 * MyProfilePage can be demoed end-to-end without a backend.
 */
export async function forgotPassword(email: string): Promise<void> {
  await fakeLatency();
  void email;
}

export async function resetPassword(
  email: string,
  token: string,
  password: string,
  password_confirmation: string,
): Promise<string> {
  await fakeLatency();
  void email;
  void password;
  void password_confirmation;
  if (token.length < 6) throw new Error('Ungültiger oder abgelaufener Code.');
  return 'demo-auth-token';
}
