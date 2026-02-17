import ICAL from 'ical.js';
import { compareDateOnly, compareDates } from './dateUtils';

const recursOn = (event, precomputedExdates, date) => {
  const recur = event.component.getFirstProperty('rrule').getFirstValue();
  const iterator = recur.iterator(event.startDate);

  for (let next = iterator.next(); next; next = iterator.next()) {
    if (precomputedExdates.find(d => compareDateOnly(d, date) === 0)) {
      return false;
    }

    const compareResult = compareDateOnly(next.toJSDate(), date);
    if (compareResult === 0) 
      return true;

    if (compareResult === 1) 
      return false;
  }

  return false;
};

export const getEventsForDate = (events, exDateMap, date) => {
  return events.filter(e => {
    const status = e.component.getFirstPropertyValue('status');
    if (status && status.toString().toLowerCase() === 'cancelled') {
      return false;
    }

    if (e.isRecurring()) {
      if (recursOn(e, exDateMap[e.uid] ?? [], date)) {
        const eventStart = e.startDate.toJSDate();
        e.instanceStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), eventStart.getHours(), eventStart.getMinutes());
        const duration = e.endDate.toJSDate().getTime() - eventStart.getTime();
        e.instanceEnd = new Date(e.instanceStart.getTime() + duration);

        return true;
      }

      return false;
    }

    e.instanceStart = e.startDate.toJSDate();
    e.instanceEnd = e.endDate.toJSDate();

    return compareDateOnly(e.startDate.toJSDate(), date) === 0;
  });
};

export const parseCalendarData = (icalData, calendarColor) => {
  const component = new ICAL.Component(ICAL.parse(icalData));

  // Register timezones
  for (const tz of component.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(tz);
  }

  const events = component.getAllSubcomponents('vevent').map(e => new ICAL.Event(e));

  const exDateMap = {};
  for (const event of events) {
    event.endDate ??= event.startDate;
    event.color = calendarColor;

    let exdates;
    if (event.isRecurring()) {
      exdates = event.component.getAllProperties('exdate').flatMap(d =>
        d.getValues().map(exdate => new Date(exdate))
      );

      if (exdates.length === 0) 
        continue;
    } 
    else if (event.isRecurrenceException()) {
      exdates = [event.component.getFirstPropertyValue('recurrence-id').toJSDate()];
    }
    else {
      continue;
    }

    exDateMap[event.uid] = (exDateMap[event.uid] ?? []).concat(exdates);
  }

  return { events, exDateMap };
};

export const getCalendarEventsForDisplay = (calendarsData, dateTime) => {
  if (!calendarsData || calendarsData.length === 0) {
    return { events: [], headerDate: new Date() };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  for (const cal of calendarsData) {
    if (!cal.events || !cal.exDateMap)
      continue;

    cal.eventsForToday = getEventsForDate(cal.events, cal.exDateMap, today)
      .filter(e => e.instanceEnd > dateTime);
  }

  let eventsToShow = calendarsData.flatMap(c => c.eventsForToday || []);
  let headerDate = today;

  if (eventsToShow.length === 0) {
    headerDate = tomorrow;
    for (const cal of calendarsData) {
      if (!cal.events || !cal.exDateMap) 
        continue;
      
      cal.eventsForTomorrow = getEventsForDate(cal.events, cal.exDateMap, tomorrow);
    }

    eventsToShow = calendarsData.flatMap(c => c.eventsForTomorrow || []);
  }

  eventsToShow.sort((a, b) => compareDates(a.instanceStart, b.instanceStart));
  
  return { events: eventsToShow, headerDate };
};
