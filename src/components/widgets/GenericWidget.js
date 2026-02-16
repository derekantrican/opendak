import { useEffect, useState } from 'react';
import { Typography } from '@mui/material';
import { JSONPath } from 'jsonpath-plus';
import { useSettings } from '../../context/SettingsContext';
import { safeParseJSON } from '../../utils/jsonUtils';

export default function GenericWidget({ config }) {
  const { refreshSignal, settings } = useSettings();
  const [displayData, setDisplayData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!config.requestUrl) return;

    const fetchData = async () => {
      try {
        let headers = {};
        if (config.requestHeaders) {
          try {
            headers = typeof config.requestHeaders === 'string'
              ? JSON.parse(config.requestHeaders)
              : config.requestHeaders;
          } catch {
            // Invalid JSON — ignore headers
          }
        }

        let fetchUrl = config.requestUrl;
        const corsProxy = settings?.global?.corsProxy;
        if (corsProxy?.url) {
          fetchUrl = corsProxy.url + config.requestUrl;
          headers = { ...headers, ...safeParseJSON(corsProxy.headers) };
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
          setError(`HTTP ${response.status}`);
          return;
        }

        const json = await response.json();

        // Apply data selector (JSONPath)
        let selected = json;
        if (config.dataSelector) {
          const results = JSONPath({ path: config.dataSelector, json });
          // If JSONPath returned a single primitive value, unwrap it
          if (results.length === 1 && (typeof results[0] !== 'object' || results[0] === null)) {
            selected = results[0];
          } else {
            selected = results;
          }
        }

        // Apply max items if the result is an array
        if (Array.isArray(selected) && config.maxItems) {
          selected = selected.slice(0, parseInt(config.maxItems, 10));
        }

        // Apply display selector if the result is an array of objects
        if (Array.isArray(selected) && config.displaySelector) {
          selected = selected.map(item => {
            if (typeof item === 'object' && item !== null) {
              // Support nested paths with JSONPath or simple property access
              if (config.displaySelector.startsWith('$')) {
                const result = JSONPath({ path: config.displaySelector, json: item });
                return result.length > 0 ? result[0] : item;
              }
              return item[config.displaySelector] ?? item;
            }
            return item;
          });
        }

        setDisplayData(selected);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [refreshSignal, config.requestUrl, config.requestHeaders, config.dataSelector, config.displaySelector, config.maxItems]);

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  if (displayData === null) {
    return <Typography>Loading...</Typography>;
  }

  // Scalar value (number, string)
  if (!Array.isArray(displayData)) {
    return (
      <div>
        <Typography variant="h4">{String(displayData)}</Typography>
      </div>
    );
  }

  // Array of items
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {displayData.map((item, index) => (
        <Typography key={index} variant="h5" sx={{ whiteSpace: 'pre-wrap' }}>
          • {String(item)}
        </Typography>
      ))}
    </div>
  );
}
