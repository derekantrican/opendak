import { Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';

export default function WebpageWidget({ config }) {
  const { refreshSignal } = useSettings();

  if (!config.url) {
    return <Typography color="text.secondary">No URL configured</Typography>;
  }

  return (
    <iframe
      key={refreshSignal}
      src={config.url}
      title={config.title || 'Webpage'}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
      }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      loading="lazy"
    />
  );
}
