import { useCallback, useEffect, useRef, useState } from 'react';
import { LinearProgress, Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { fontSizeMap } from '../../models/settingsSchema';

function truncate(text, max) {
  if (!text) 
    return '';
  if (!max) 
    return text;
  const limit = parseInt(max, 10);
  if (isNaN(limit) || text.length <= limit) 
    return text;
  return text.slice(0, limit) + '…';
}

function stripHtml(html) {
  if (!html) 
    return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function parseRss(xmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  // Try RSS 2.0
  let items = Array.from(doc.querySelectorAll('item'));
  if (items.length > 0) {
    return items.map(item => ({
      title: item.querySelector('title')?.textContent || '',
      description: stripHtml(item.querySelector('description')?.textContent || ''),
      link: item.querySelector('link')?.textContent || '',
    }));
  }

  // Try Atom
  items = Array.from(doc.querySelectorAll('entry'));
  return items.map(entry => ({
    title: entry.querySelector('title')?.textContent || '',
    description: stripHtml(
      entry.querySelector('summary')?.textContent ||
      entry.querySelector('content')?.textContent || ''
    ),
    link: entry.querySelector('link')?.getAttribute('href') || '',
  }));
}

export default function FeedWidget({ config }) {
  const { refreshSignal, settings } = useSettings();
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const displayTime = Math.max(parseInt(config.displayTime, 10) || 15, 1);
  const maxItems = parseInt(config.maxItems, 10) || 10;
  const contentFontSize = fontSizeMap[config.fontSize] || fontSizeMap.medium;

  // Fetch feed
  const fetchFeed = useCallback(async () => {
    if (!config.feedUrl) 
      return;

    try {
      let fetchUrl = config.feedUrl;
      let headers = {};
      const corsProxy = settings?.global?.corsProxy;
      if (corsProxy?.url) {
        fetchUrl = corsProxy.url + config.feedUrl;
        try {
          headers = typeof corsProxy.headers === 'string'
            ? JSON.parse(corsProxy.headers)
            : (corsProxy.headers || {});
        }
        catch { /* ignore */ }
      }

      const response = await fetch(fetchUrl, { headers });
      if (!response.ok) {
        setError(`HTTP ${response.status}`);
        return;
      }

      const text = await response.text();
      const parsed = parseRss(text);
      const limited = parsed.slice(0, maxItems);

      if (limited.length > 0) {
        setItems(limited);
        setCurrentIndex(0);
        setProgress(0);
        setError(null);
      }
      else {
        setError('No items found in feed');
      }
    }
    catch (err) {
      setError(err.message);
    }
  }, [config.feedUrl, maxItems, settings?.global?.corsProxy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch on mount and on refresh signal
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed, refreshSignal]);

  // Rotation timer
  useEffect(() => {
    if (items.length <= 1) 
      return;

    // Progress bar updates
    const progressInterval = 50; // ms
    const totalTicks = (displayTime * 1000) / progressInterval;
    let tick = 0;

    progressRef.current = setInterval(() => {
      tick++;
      setProgress((tick / totalTicks) * 100);
    }, progressInterval);

    // Item rotation
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % items.length);
        setFading(false);
        tick = 0;
        setProgress(0);
      }, 400); // fade-out duration
    }, displayTime * 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(progressRef.current);
    };
  }, [items, displayTime]);

  if (!config.feedUrl) {
    return <Typography color="text.secondary">No feed URL configured</Typography>;
  }

  if (error && items.length === 0) {
    return <Typography color="error">{error}</Typography>;
  }

  if (items.length === 0) {
    return <Typography color="text.secondary">Loading feed…</Typography>;
  }

  const item = items[currentIndex];
  const title = truncate(item.title, config.maxTitleChars);
  const description = truncate(item.description, config.maxDescChars);

  return (
    <div style={{ fontSize: contentFontSize, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.4s ease-in-out',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          component="div"
          sx={{
            fontSize: '1.1em',
            fontWeight: 500,
            mb: 0.5,
            flexShrink: 0,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            component="div"
            sx={{
              fontSize: '0.8em',
              color: 'text.secondary',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>
        )}
      </div>

      {items.length > 1 && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            mt: 1.5,
            height: 3,
            borderRadius: 1,
            backgroundColor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              transition: 'none',
              backgroundColor: 'rgba(255,255,255,0.4)',
            },
          }}
        />
      )}

      <Typography
        component="div"
        sx={{ fontSize: '0.6em', color: 'text.secondary', mt: 0.5, textAlign: 'right' }}
      >
        {currentIndex + 1} / {items.length}
      </Typography>
    </div>
  );
}
