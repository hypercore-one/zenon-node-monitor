// API Configuration
const config = {
  // The API URL will be determined based on how the frontend is being accessed
  getApiUrl: () => {
    // Always use the same hostname as the frontend, just different port
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000`;
  }
};

export default config; 