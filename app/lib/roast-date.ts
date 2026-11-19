// Morrow roasts once a week, on Monday, in Melbourne. The next roast date is the
// coming Monday (today, if today is Monday) in the roastery's timezone. Merchants
// can override it with a `custom.next_roast_date` shop metafield (type: date),
// for example around public holidays.

export const ROASTERY_TIME_ZONE = "Australia/Melbourne";
const ROAST_WEEKDAY = 1; // Monday
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's calendar date in the roastery's timezone, as YYYY-MM-DD. */
function roasteryToday(now: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ROASTERY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getNextRoastDate(now: Date, override?: string | null): string {
  const today = roasteryToday(now);
  if (override && ISO_DATE.test(override) && override >= today) return override;

  // Do the weekday arithmetic on the calendar date at UTC midnight so the
  // server's own timezone can't shift it.
  const date = new Date(`${today}T00:00:00Z`);
  const daysUntilRoast = (ROAST_WEEKDAY - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + daysUntilRoast);
  return date.toISOString().slice(0, 10);
}

/** "Monday 23 Nov" — formatted from a YYYY-MM-DD date without timezone drift. */
export function formatRoastDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
