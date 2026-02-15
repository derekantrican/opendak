import { createContext, useContext } from 'react';

export const SettingsContext = createContext({
  settings: null,
  setSettings: () => {},
  dateTime: new Date(),
  refreshSignal: 0,
});

export const useSettings = () => useContext(SettingsContext);
