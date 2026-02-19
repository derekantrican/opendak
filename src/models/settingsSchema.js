import { v4 as uuidv4 } from 'uuid';

export const WIDGET_TYPES = {
  CLOCK: 'clock',
  WEATHER: 'weather',
  CALENDAR: 'calendar',
  GENERIC: 'generic',
  WEBPAGE: 'webpage',
  FEED: 'feed',
};

export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
};

export const fontSizeMap = {
  small: '1rem',
  medium: '1.5rem',
  large: '3rem',
};

// ---------- Config field definitions for the settings form ----------

const baseFields = [
  { key: 'title', label: 'Title', type: 'text', placeholder: 'Optional title shown above widget' },
  { key: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'right'], default: 'left' },
  { key: 'backgroundColor', label: 'Background Color', type: 'text', placeholder: 'e.g. rgba(134,122,122,0.36) or #867A7A5C' },
  { key: 'fontSize', label: 'Font Size', type: 'select', options: ['small', 'medium', 'large'], default: 'medium' },
  { key: 'x', label: 'Position X', type: 'text', placeholder: "pixels, %, 'center', or 'right:0'" },
  { key: 'y', label: 'Position Y', type: 'text', placeholder: "pixels, %, 'center', or 'bottom:0'" },
  { key: 'width', label: 'Width', type: 'text', placeholder: 'pixels or % (e.g. 300 or 25%)' },
  { key: 'height', label: 'Height', type: 'text', placeholder: 'pixels or % (e.g. 200 or 35%)' },
];

const clockFields = [
  { key: 'timezone', label: 'Timezone', type: 'text', placeholder: "'local' or IANA zone (e.g. America/New_York)", default: 'local' },
  { key: 'format', label: 'Time Format', type: 'select', options: ['24h', '12h'], default: '24h' },
  { key: 'showSeconds', label: 'Show Seconds', type: 'checkbox', default: false },
  { key: 'showDate', label: 'Show Date', type: 'checkbox', default: true },
];

const weatherFields = [
  { key: 'provider', label: 'Weather Provider', type: 'select', options: ['openmeteo', 'openweathermap'], default: 'openmeteo' },
  { key: 'lat', label: 'Latitude', type: 'text', placeholder: 'e.g. 40.7128' },
  { key: 'lon', label: 'Longitude', type: 'text', placeholder: 'e.g. -74.0060' },
  { key: 'appid', label: 'OpenWeather API Key', type: 'text', placeholder: 'Your OpenWeatherMap API key', visibleWhen: { provider: 'openweathermap' } },
  { key: 'units', label: 'Units', type: 'select', options: ['imperial', 'metric'], default: 'imperial' },
  { key: 'forecastDays', label: 'Forecast Days', type: 'text', placeholder: 'Number of days (e.g. 4)', default: '4' },
];

const calendarFields = [
  { key: 'calendars', label: 'Calendars', type: 'calendar-list', default: [] },
];

const genericFields = [
  { key: 'requestUrl', label: 'Request URL', type: 'text', placeholder: 'https://api.example.com/data' },
  { key: 'requestHeaders', label: 'Request Headers (JSON)', type: 'textarea', placeholder: '{"Authorization": "Bearer xxx"}', default: '{}' },
  { key: 'dataSelector', label: 'Data Selector (JSONPath)', type: 'text', placeholder: 'e.g. $.items[?(@.type=="video")]' },
  { key: 'displaySelector', label: 'Display Selector', type: 'text', placeholder: 'Property name to show (e.g. title)' },
  { key: 'maxItems', label: 'Max Items', type: 'text', placeholder: 'Limit results (e.g. 5)' },
];

const webpageFields = [
  { key: 'url', label: 'URL', type: 'text', placeholder: 'https://example.com' },
];

const feedFields = [
  { key: 'feedUrl', label: 'Feed URL', type: 'text', placeholder: 'https://example.com/rss.xml' },
  { key: 'maxItems', label: 'Max Items', type: 'text', placeholder: 'Number of stories to rotate (e.g. 10)', default: '10' },
  { key: 'displayTime', label: 'Item Display Time (seconds)', type: 'text', placeholder: 'Seconds per item (e.g. 15)', default: '15' },
  { key: 'maxTitleChars', label: 'Max Title Characters', type: 'text', placeholder: 'e.g. 80 (blank = no limit)' },
  { key: 'maxDescChars', label: 'Max Description Characters', type: 'text', placeholder: 'e.g. 120 (blank = no limit)' },
];

export const widgetTypeConfig = {
  [WIDGET_TYPES.CLOCK]: {
    label: 'Clock',
    description: 'Display a clock with configurable timezone, 12/24h format, and optional date.',
    fields: clockFields,
  },
  [WIDGET_TYPES.WEATHER]: {
    label: 'Weather',
    description: 'Show current conditions and a multi-day forecast using Open-Meteo or OpenWeatherMap.',
    fields: weatherFields,
  },
  [WIDGET_TYPES.CALENDAR]: {
    label: 'Calendar',
    description: 'Display upcoming events from one or more iCal calendar feeds.',
    fields: calendarFields,
  },
  [WIDGET_TYPES.GENERIC]: {
    label: 'Generic',
    description: 'Fetch JSON from any API and display selected fields using JSONPath selectors.',
    fields: genericFields,
  },
  [WIDGET_TYPES.WEBPAGE]: {
    label: 'Webpage',
    description: 'Embed any webpage in an iframe. The page reloads on each data refresh interval. (Note: some sites may block embedding in iframes and will not render in this widget)',
    fields: webpageFields,
  },
  [WIDGET_TYPES.FEED]: {
    label: 'Feed',
    description: 'Rotating feed viewer — cycles through items from an RSS/Atom feed with fade transitions and a progress bar. Useful for news, blogs, podcasts, etc.',
    fields: feedFields,
  },
};

export const getBaseFields = () => baseFields;

export const getFieldsForType = (type) => {
  return widgetTypeConfig[type]?.fields ?? [];
};

export const getDescriptionForType = (type) => {
  return widgetTypeConfig[type]?.description ?? '';
};

// ---------- Default settings ----------

export const createDefaultSettings = () => ({
  global: {
    backgroundSubreddit: 'EarthPorn',
    backgroundTransition: true,
    corsProxy: {
      url: '',
      headers: {},
    },
  },
  widgets: [],
});

export const createWidget = (type) => {
  const defaults = {};
  const fields = [...baseFields, ...getFieldsForType(type)];
  for (const field of fields) {
    if (field.default !== undefined) {
      defaults[field.key] = field.default;
    }
  }

  return {
    id: uuidv4(),
    type,
    ...defaults,
  };
};

// ---------- Migration: convert old settings to new format ----------

export const migrateOldSettings = (oldSettings) => {
  // If already in new format, return as-is
  if (oldSettings.global && oldSettings.widgets) {
    return oldSettings;
  }

  const newSettings = createDefaultSettings();

  // Migrate background
  if (oldSettings.backgroundImageSrc) {
    // Extract subreddit name from URL like "https://www.reddit.com/r/EarthPorn/hot.json?limit=50"
    const match = oldSettings.backgroundImageSrc.match(/\/r\/(\w+)\//);
    if (match) {
      newSettings.global.backgroundSubreddit = match[1];
    }
  }

  // Migrate CORS proxy
  if (oldSettings.corsProxySettings) {
    newSettings.global.corsProxy = {
      url: oldSettings.corsProxySettings.url || '',
      headers: oldSettings.corsProxySettings.headers || {},
    };
  }

  return newSettings;
};
