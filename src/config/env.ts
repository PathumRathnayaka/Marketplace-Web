const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

if (!apiBaseUrl) {
  throw new Error('Missing required environment variable: VITE_API_BASE_URL');
}

export const env = {
  apiBaseUrl,
};
