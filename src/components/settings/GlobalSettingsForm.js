import { FormControl, InputLabel, MenuItem, Select, Switch, TextField, Typography } from '@mui/material';
import { isValidJSON } from '../../utils/jsonUtils';

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

  const backgroundSource = globalSettings.backgroundSource || 'reddit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Typography variant="h6">Global Settings</Typography>

      <FormControl size="small" fullWidth>
        <InputLabel id="background-source-label">Background Image Source</InputLabel>
        <Select
          labelId="background-source-label"
          label="Background Image Source"
          value={backgroundSource}
          onChange={(e) => handleChange('backgroundSource', e.target.value)}
        >
          <MenuItem value="reddit">Reddit</MenuItem>
          <MenuItem value="lemmy">Lemmy (lemmy.ml)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label={backgroundSource === 'lemmy' ? 'Background Community' : 'Background Subreddit'}
        value={globalSettings.backgroundSubreddit || ''}
        onChange={(e) => handleChange('backgroundSubreddit', e.target.value)}
        size="small"
        helperText={backgroundSource === 'lemmy'
          ? 'e.g. earthporn — a community on lemmy.ml'
          : 'e.g. EarthPorn, NaturePorn, SkyPorn'}
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
        value={typeof globalSettings.corsProxy?.headers === 'object'
          ? JSON.stringify(globalSettings.corsProxy.headers, null, 2)
          : (globalSettings.corsProxy?.headers ?? '')}
        onChange={(e) => handleCorsChange('headers', e.target.value)}
        size="small"
        multiline
        minRows={2}
        error={!isValidJSON(typeof globalSettings.corsProxy?.headers === 'object'
          ? JSON.stringify(globalSettings.corsProxy.headers)
          : globalSettings.corsProxy?.headers)}
        helperText={!isValidJSON(typeof globalSettings.corsProxy?.headers === 'object'
          ? JSON.stringify(globalSettings.corsProxy.headers)
          : globalSettings.corsProxy?.headers)
          ? 'Invalid JSON — headers will be ignored'
          : 'e.g. {"x-api-key": "abc123"}'}
        fullWidth
      />
    </div>
  );
}
