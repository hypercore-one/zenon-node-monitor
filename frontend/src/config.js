// API Configuration
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  /^10\./.test(window.location.hostname) ||
  /^192\.168\./.test(window.location.hostname);

const config = {
  // The API URL will be determined based on how the frontend is being accessed
  getApiUrl: () => {
    if (isLocal) {
      // Use the current hostname for local development
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    } else {
      // Production: use same origin, no port
      return `${window.location.origin}`;
    }
  },
  getWsUrl: () => {
    if (isLocal) {
      // Use the current hostname for local development
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.hostname}:3000/ws`;
    } else {
      // Use wss and same host, no port
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${window.location.host}/ws`;
    }
  }
};

export default config; 