export const getApiBase = (overrideBase) => {
  if (overrideBase) return overrideBase;
  if (process.env.REACT_APP_API_HOST) return process.env.REACT_APP_API_HOST;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

export const apiFetch = (path, options = {}, overrideBase) => {
  const base = getApiBase(overrideBase);
  return fetch(`${base}${path}`, options);
};
