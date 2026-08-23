import { getConfig } from '../lib/config';
import { DEMO_MODE } from './config';

/**
 * Leak-Schutz: patches window.fetch so that, in DEMO_MODE, any request that
 * would actually leave the browser towards the real backend/4Based API is
 * blocked and loudly reported instead of silently going out.
 *
 * This is a safety net, not the primary mechanism — the primary mechanism is
 * swapping every `*Api` module for its mock counterpart (see each module's
 * `DEMO_MODE ? mock : real` switch). If this guard ever fires, it means a
 * call site was missed and is bypassing the mock layer.
 */
export function installNetworkGuard(): void {
  if (!DEMO_MODE) return;
  if (typeof window === 'undefined' || !window.fetch) return;

  const realApiHost = safeHost(getConfig().API_URL);
  const originalFetch = window.fetch.bind(window);

  window.fetch = (...args: Parameters<typeof fetch>) => {
    const input = args[0];
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const host = safeHost(url);

    const isRealBackendCall =
      (realApiHost && host === realApiHost) ||
      /\/(auth|4based|push|teams|work-sessions|members|cloud)\//.test(url) ||
      url.includes('/api/');

    if (isRealBackendCall) {
      const message = `[DEMO_MODE] Blockierter Netzwerk-Call an "${url}" — eine Aufrufstelle nutzt offenbar noch die echte API statt des Mock-Layers.`;
      console.error(message, new Error('Aufruf-Stack').stack);
      return Promise.reject(new Error(message));
    }

    return originalFetch(...args);
  };
}

function safeHost(url: string): string | null {
  try {
    return new URL(url, window.location.origin).host;
  } catch {
    return null;
  }
}
