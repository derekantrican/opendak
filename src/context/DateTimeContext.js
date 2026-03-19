import { createContext, useContext, useEffect, useState } from 'react';

const DateTimeContext = createContext(new Date());

/**
 * Provider that ticks every second, updating `dateTime`.
 * Only components that consume this context will re-render each second.
 */
export function DateTimeProvider({ children }) {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DateTimeContext.Provider value={dateTime}>
      {children}
    </DateTimeContext.Provider>
  );
}

export const useDateTime = () => useContext(DateTimeContext);
