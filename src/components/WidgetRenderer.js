import React from 'react';
import { Typography } from '@mui/material';
import { WIDGET_TYPES } from '../models/settingsSchema';
import WidgetShell from './WidgetShell';
import ClockWidget from './widgets/ClockWidget';
import WeatherWidget from './widgets/WeatherWidget';
import CalendarWidget from './widgets/CalendarWidget';
import GenericWidget from './widgets/GenericWidget';
import WebpageWidget from './widgets/WebpageWidget';
import FeedWidget from './widgets/FeedWidget';

const widgetComponentMap = {
  [WIDGET_TYPES.CLOCK]: ClockWidget,
  [WIDGET_TYPES.WEATHER]: WeatherWidget,
  [WIDGET_TYPES.CALENDAR]: CalendarWidget,
  [WIDGET_TYPES.GENERIC]: GenericWidget,
  [WIDGET_TYPES.WEBPAGE]: WebpageWidget,
  [WIDGET_TYPES.FEED]: FeedWidget,
};

class WidgetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Typography color="error" variant="body2">
          Widget error: {this.state.error?.message || 'Unknown error'}
        </Typography>
      );
    }
    return this.props.children;
  }
}

export default function WidgetRenderer({ widgets }) {
  if (!widgets || widgets.length === 0) 
    return null;

  return (
    <>
      {widgets.map(widget => {
        const Component = widgetComponentMap[widget.type];
        if (!Component) {
          return (
            <WidgetShell key={widget.id} config={widget}>
              <Typography color="error">Unknown widget type: {widget.type}</Typography>
            </WidgetShell>
          );
        }

        return (
          <WidgetErrorBoundary key={widget.id}>
            <WidgetShell config={widget}>
              <Component config={widget} />
            </WidgetShell>
          </WidgetErrorBoundary>
        );
      })}
    </>
  );
}
