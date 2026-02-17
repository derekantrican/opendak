import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import { ThemeProvider } from '@emotion/react';
import { LinearProgress, Typography, createTheme } from '@mui/material';
import { SettingsContext } from './context/SettingsContext';
import { createDefaultSettings, migrateOldSettings } from './models/settingsSchema';
import { safeParseJSON } from './utils/jsonUtils';
import WidgetRenderer from './components/WidgetRenderer';
import SettingsPanel from './components/SettingsPanel';

const darkTheme = createTheme({
  palette: { mode: 'dark' },
});

const DATA_REFRESH_INTERVAL = 60 * 5; // seconds

function App() {
  const [settings, setSettings] = useState(null);
  const [dateTime, setDateTime] = useState(new Date());
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [timeSinceDataRefresh, setTimeSinceDataRefresh] = useState(0);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const bgUrlRef = useRef(null); // tracks current blob URL for cleanup

  // Load settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(migrateOldSettings(parsed));
      } catch {
        setSettings(createDefaultSettings());
      }
    } else {
      setSettings(createDefaultSettings());
    }
  }, []);

  // Persist settings to localStorage on change
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('settings', JSON.stringify(newSettings));
  }, []);

  // Background image fetching
  const fetchBackground = useCallback(async () => {
    const s = settingsRef.current;
    if (!s?.global?.backgroundSubreddit) return;

    try {
      const subreddit = s.global.backgroundSubreddit;
      const corsProxy = s.global?.corsProxy;
      const redditUrl = `https://www.reddit.com/r/${subreddit}/hot/.json?limit=50`;
      const response = await fetch(
        corsProxy?.url ? corsProxy.url + redditUrl : redditUrl,
        corsProxy?.url ? { headers: safeParseJSON(corsProxy.headers) } : {},
      );
      const data = await response.json();

      const landscapePosts = data.data.children.filter(
        p => !p.data.is_self &&
          p.data.thumbnail !== 'default' &&
          !p.data.stickied &&
          p.data.preview?.images?.[0]?.source?.width > p.data.preview?.images?.[0]?.source?.height
      );

      if (landscapePosts.length > 0) {
        const randomPost = landscapePosts[Math.floor(Math.random() * landscapePosts.length)];
        const preview = randomPost.data.preview?.images?.[0];

        // Pick a preview resolution that's close to the screen size (avoids loading 6000x4000 images)
        let imageUrl = randomPost.data.url;
        if (preview?.resolutions?.length > 0) {
          const screenWidth = window.screen.width * (window.devicePixelRatio || 1);
          // Pick the smallest resolution that covers the screen width, or the largest available
          const suitable = preview.resolutions.find(r => r.width >= screenWidth)
            || preview.resolutions[preview.resolutions.length - 1];
          imageUrl = suitable.url.replace(/&amp;/g, '&');
        }

        // Download as blob and use object URL so we can explicitly free memory
        try {
          const imgResponse = await fetch(imageUrl);
          const blob = await imgResponse.blob();

          // Revoke the previous blob URL to free memory
          if (bgUrlRef.current) {
            URL.revokeObjectURL(bgUrlRef.current);
          }

          const blobUrl = URL.createObjectURL(blob);
          bgUrlRef.current = blobUrl;
          setBackgroundImage(blobUrl);
        }
        catch {
          // If blob fetch fails, fall back to direct URL (won't auto-free but still works)
          setBackgroundImage(imageUrl);
        }
      }
    } catch (err) {
      console.error('Failed to fetch background:', err);
    }
  }, []);

  // Main timer: updates clock every second, triggers data refresh every 5 minutes
  useEffect(() => {
    if (!settings) return;

    const interval = setInterval(() => {
      setDateTime(new Date());

      setTimeSinceDataRefresh(prev => {
        if (prev >= DATA_REFRESH_INTERVAL) {
          // Trigger a refresh signal — widgets will react to this
          setRefreshSignal(s => s + 1);
          fetchBackground();
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [settings, fetchBackground]);

  // Initial data load
  useEffect(() => {
    if (!settings) return;
    fetchBackground();
    setRefreshSignal(s => s + 1);
  }, [settings, fetchBackground]);

  if (!settings) return null;

  const hasWidgets = settings.widgets && settings.widgets.length > 0;

  return (
    <ThemeProvider theme={darkTheme}>
      <SettingsContext.Provider value={{ settings, setSettings: handleSettingsChange, dateTime, refreshSignal }}>
        <div style={{
          position: 'relative',
          height: 'calc(100% - 2px)',
          width: '100%',
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundBlendMode: 'darken',
          transition: settings.global.backgroundTransition ? 'background-image 5s' : undefined,
          textShadow: 'black 2px 2px',
        }}>
          {hasWidgets ? (
            <WidgetRenderer widgets={settings.widgets} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h5" sx={{
                opacity: 0.8,
                textAlign: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '12px 24px',
                borderRadius: '8px',
              }}>
                Welcome to OpenDak, the open-source dashboard!<br/>
                Click the ⚙️ icon (top-right) to add widgets
              </Typography>
            </div>
          )}
        </div>

        <LinearProgress
          sx={{ height: 2 }}
          variant="determinate"
          color="inherit"
          value={(timeSinceDataRefresh / DATA_REFRESH_INTERVAL) * 100}
        />

        <SettingsPanel settings={settings} onSettingsChange={handleSettingsChange} />
      </SettingsContext.Provider>
    </ThemeProvider>
  );
}

export default App;
