import { Typography } from '@mui/material';

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
    width: width || undefined,
    height: height || undefined,
    textAlign: textAlign || 'left',
  };

  // Handle x positioning
  let translateX = '';
  if (x === 'center') {
    positionStyle.left = '50%';
    translateX = '-50%';
  } else if (x && x.startsWith('right:')) {
    positionStyle.right = x.slice(6);
  } else {
    positionStyle.left = x || undefined;
  }

  // Handle y positioning
  let translateY = '';
  if (y === 'center') {
    positionStyle.top = '50%';
    translateY = '-50%';
  } else if (y && y.startsWith('bottom:')) {
    positionStyle.bottom = y.slice(7);
  } else {
    positionStyle.top = y || undefined;
  }

  // Apply transform if centering on either axis
  if (translateX || translateY) {
    positionStyle.transform = `translate(${translateX || '0'}, ${translateY || '0'})`;
  }

  const bgStyle = backgroundColor
    ? { backgroundColor, borderRadius: '0.3em', padding: '10px' }
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
