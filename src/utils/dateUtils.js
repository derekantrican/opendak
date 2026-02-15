export const convertTZ = (date, tzString) => {
  if (tzString === 'local') return date;
  return new Date(
    (typeof date === 'string' ? new Date(date) : date).toLocaleString('en-US', { timeZone: tzString })
  );
};

export const compareDateOnly = (date1, date2) => {
  const d1 = new Date(date1.getTime());
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2.getTime());
  d2.setHours(0, 0, 0, 0);
  return compareDates(d1, d2);
};

export const compareDates = (date1, date2) => {
  const t1 = date1.getTime();
  const t2 = date2.getTime();
  if (t1 < t2) return -1;
  if (t1 === t2) return 0;
  return 1;
};
