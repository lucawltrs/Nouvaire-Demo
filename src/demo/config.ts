/**
 * Central demo-mode switch. Every mock/real module switch in the codebase
 * reads ONLY this flag — never re-derive it from env vars elsewhere.
 *
 * Defaults to `true` because this is a dedicated demo repository. Can be
 * disabled via VITE_DEMO_MODE=false for local testing against a real backend.
 */
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE !== 'false';
