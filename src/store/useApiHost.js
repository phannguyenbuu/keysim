import React, { createContext, useContext, useState } from 'react';

// Tạo context
const ApiHostContext = createContext();

// Provider component
export function ApiHostProvider({ children }) {
  const [host, setHost] = useState(process.env.REACT_APP_API_HOST || 'http://localhost:5050');


  return (
    <ApiHostContext.Provider value={{ host, setHost }}>
      {children}
    </ApiHostContext.Provider>
  );
}

// Hook custom để dùng trong component con
export function useApiHost() {
  const context = useContext(ApiHostContext);
  if (!context) {
    throw new Error('useApiHost must be used within an ApiHostProvider');
  }
  return context; // Trả về { host, setHost }
}
