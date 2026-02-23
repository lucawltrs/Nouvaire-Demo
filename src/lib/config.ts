declare global {
  interface Window {
    APP_CONFIG?: {
      API_URL?: string;
    };
  }
}

export function getConfig() {
  return {
    API_URL: window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || 'https://api.wolters-solutions.de/api',
  };
}
