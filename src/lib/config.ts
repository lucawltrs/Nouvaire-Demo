declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL?: string;
      FOURBASED_BEARER_TOKEN?: string;
    };
  }
}

export function getConfig() {
  return {
    API_URL: window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || 'https://api.wolters-solutions.de/api',
    FOURBASED_BEARER_TOKEN:
      window.APP_CONFIG?.FOURBASED_BEARER_TOKEN ||
      import.meta.env.VITE_FOURBASED_BEARER_TOKEN ||
      '',
  };
}
