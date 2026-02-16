import { useEffect, useState } from 'react';
import { Divider, Typography } from '@mui/material';
import { useSettings } from '../../context/SettingsContext';
import { compareDateOnly } from '../../utils/dateUtils';
import { parseCalendarData, getCalendarEventsForDisplay } from '../../utils/calendarUtils';
import { safeParseJSON } from '../../utils/jsonUtils';

function CalendarEvent({ event }) {
  const hourCycle = 'h23';

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: 6, backgroundColor: event.color, margin: 5 }} />
      <div style={{ display: 'flex', flexDirection: 'column', margin: 5 }}>
        <div style={{ display: 'flex' }}>
          <Typography style={{ fontWeight: 'bold' }}>
            {event.instanceStart.toLocaleTimeString('en-US', { hourCycle, timeStyle: 'short' })}
          </Typography>
          <Typography>
            &nbsp;-&nbsp;{event.instanceEnd.toLocaleTimeString('en-US', { hourCycle, timeStyle: 'short' })}
          </Typography>
        </div>
        <Typography style={{ fontWeight: 'bold' }}>{event.summary}</Typography>
        {event.location ? <Typography>in {event.location}</Typography> : null}
      </div>
    </div>
  );
}

export default function CalendarWidget({ config }) {
  const { refreshSignal, settings } = useSettings();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [headerDate, setHeaderDate] = useState(new Date());
  const [error, setError] = useState(null);

  const calendars = config.calendars || [];

  useEffect(() => {
    if (calendars.length === 0) return;

    const fetchCalendars = async () => {
      try {
        const corsProxy = settings?.global?.corsProxy || { url: '', headers: {} };
        const proxyHeaders = safeParseJSON(corsProxy.headers);
        const calendarsData = [];

        for (const cal of calendars) {
          try {
            const response = await fetch(corsProxy.url + cal.url, {
              headers: proxyHeaders,
            });

            if (response.ok) {
              const icalData = await response.text();
              const parsed = parseCalendarData(icalData, cal.color);
              calendarsData.push(parsed);
            }
          } catch (calErr) {
            console.error('Failed to fetch/parse calendar:', calErr);
          }
        }

        if (calendarsData.length === 0) {
          setCalendarEvents([]);
          return;
        }

        const { events, headerDate: hd } = getCalendarEventsForDisplay(calendarsData, new Date());
        setCalendarEvents(events);
        setHeaderDate(hd);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCalendars();
  }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return <Typography color="error">Calendar error: {error}</Typography>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'end' }}>
        <Typography variant="h3" sx={{ marginBottom: '8px' }}>
          {headerDate.getDate()}
        </Typography>
        <Typography variant="h5" sx={{ marginBottom: '10px', marginLeft: '10px' }}>
          {compareDateOnly(headerDate, new Date()) === 0 ? 'Today' : 'Tomorrow'}
        </Typography>
      </div>
      <Divider sx={{ marginBottom: '8px' }} />
      <div>
        {calendarEvents.map((event, index) => (
          <CalendarEvent key={`${event.uid}-${index}`} event={event} />
        ))}
      </div>
    </div>
  );
}
