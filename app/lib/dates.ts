// Dates read in the roastery's timezone (Melbourne), Australian format.
export const articleDateFormat = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "long",
  timeZone: "Australia/Melbourne",
});
