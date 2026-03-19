import { createContext, useContext } from 'react';

export const SettingsContext = createContext({
  settings: null,
  setSettings: () => {},
  refreshSignal: 0,
});

export const useSettings = () => useContext(SettingsContext);
