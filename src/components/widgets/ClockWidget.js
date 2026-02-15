import { Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { convertTZ } from '../../utils/dateUtils';
import { fontSizeMap } from '../../models/settingsSchema';

export default function ClockWidget({ config }) {
  const { dateTime } = useSettings();

  const tz = config.timezone || 'local';
  const displayTime = convertTZ(dateTime, tz);
  const is24h = config.format !== '12h';
  const hourCycle = is24h ? 'h23' : 'h12';
  const contentFontSize = fontSizeMap[config.fontSize] || fontSizeMap.medium;

  return (
    <div style={{ fontSize: contentFontSize }}>
      <Typography component="div" sx={{ fontSize: '3.2em', fontWeight: 300, letterSpacing: '-2px' }}>
        {displayTime.toLocaleTimeString('en-US', { hourCycle, timeStyle: 'short' })}
        {config.showSeconds && (
          <Typography
            component="span"
            sx={{ fontSize: '.4em', fontWeight: 400, letterSpacing: '-2px', paddingLeft: '5px', top: '-1em', position: 'relative' }}
          >
            {displayTime.getSeconds().toLocaleString('en-US', { minimumIntegerDigits: 2 })}
          </Typography>
        )}
      </Typography>
      {config.showDate && (
        <Typography component="div" sx={{ fontSize: 'inherit' }}>
          {displayTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Typography>
      )}
    </div>
  );
}
