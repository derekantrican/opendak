import { Switch, TextField, Typography } from '@mui/material';

export default function GlobalSettingsForm({ globalSettings, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...globalSettings, [field]: value });
  };

  const handleCorsChange = (field, value) => {
    onChange({
      ...globalSettings,
      corsProxy: { ...globalSettings.corsProxy, [field]: value },
    });
  };

  const handleCorsHeadersChange = (value) => {
    try {
      const parsed = JSON.parse(value);
      handleCorsChange('headers', parsed);
    } catch {
      // Let the user keep typing — only update if valid JSON
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Typography variant="h6">Global Settings</Typography>

      <TextField
        label="Background Subreddit"
        value={globalSettings.backgroundSubreddit || ''}
        onChange={(e) => handleChange('backgroundSubreddit', e.target.value)}
        size="small"
        helperText="e.g. EarthPorn, NaturePorn, SkyPorn"
        fullWidth
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="body2">Background Transition (disable on GPU-sensitive devices like raspberry pi)</Typography>
        <Switch
          checked={!!globalSettings.backgroundTransition}
          onChange={(e) => handleChange('backgroundTransition', e.target.checked)}
          size="small"
        />
      </div>

      <Typography variant="subtitle2" sx={{ mt: 1 }}>CORS Proxy</Typography>

      <TextField
        label="Proxy URL"
        value={globalSettings.corsProxy?.url || ''}
        onChange={(e) => handleCorsChange('url', e.target.value)}
        size="small"
        helperText="URL prefix for proxied requests"
        fullWidth
      />

      <TextField
        label="Proxy Headers (JSON)"
        value={JSON.stringify(globalSettings.corsProxy?.headers || {}, null, 2)}
        onChange={(e) => handleCorsHeadersChange(e.target.value)}
        size="small"
        multiline
        minRows={2}
        helperText='e.g. {"x-api-key": "abc123"}'
        fullWidth
      />
    </div>
  );
}
