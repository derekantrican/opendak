import { Typography } from '@mui/material';

// If a value is a bare number (e.g. "200" or 200), append "px"
function cssUnit(val) {
  if (val == null || val === '') return undefined;
  const s = String(val);
  return /^\d+(\.\d+)?$/.test(s) ? s + 'px' : s;
}

export default function WidgetShell({ config, children }) {
  const {
    title,
    textAlign,
    backgroundColor,
    x,
    y,
    width,
    height,
  } = config;

  // Support both top/left and bottom/right anchoring
  // e.g. y: "bottom:0px" puts the widget at the bottom
  const positionStyle = {
    position: 'absolute',
    width: cssUnit(width),
    height: cssUnit(height),
    textAlign: textAlign || 'left',
  };

  // Handle x positioning
  let translateX = '';
  if (x === 'center') {
    positionStyle.left = '50%';
    translateX = '-50%';
  } else if (x && String(x).startsWith('right:')) {
    positionStyle.right = cssUnit(String(x).slice(6));
  } else {
    positionStyle.left = cssUnit(x);
  }

  // Handle y positioning
  let translateY = '';
  if (y === 'center') {
    positionStyle.top = '50%';
    translateY = '-50%';
  } else if (y && String(y).startsWith('bottom:')) {
    positionStyle.bottom = cssUnit(String(y).slice(7));
  } else {
    positionStyle.top = cssUnit(y);
  }

  // Apply transform if centering on either axis
  if (translateX || translateY) {
    positionStyle.transform = `translate(${translateX || '0'}, ${translateY || '0'})`;
  }

  // Normalize backgroundColor: support rgba() and 8-digit hex (#RRGGBBAA)
  let bg = backgroundColor;
  if (bg && /^[0-9a-fA-F]{8}$/.test(bg)) {
    bg = '#' + bg;
  }

  const bgStyle = bg
    ? { backgroundColor: bg, borderRadius: '0.3em', padding: '10px' }
    : {};

  return (
    <div style={{ ...positionStyle, ...bgStyle }}>
      {title && (
        <Typography variant="h5" sx={{ marginBottom: '8px' }}>{title}</Typography>
      )}
      {children}
    </div>
  );
}
