import ICAL from "ical.js";
import { normalizeColor } from "../utils/colorUtils";
import { addDays, setTime } from "../utils/dateUtils";

export async function loadCalendarEvents(calendars) {
  const allEvents = [];

  for (const cal of calendars) {
    console.log("Loading calendar:", cal.name, cal.url);

    const fixedUrl = cal.url.replace(/^webcal:/i, "https:");
    const proxyUrl = `/ics?url=${encodeURIComponent(fixedUrl)}`;

    const res = await fetch(proxyUrl);

    console.log("Calendar response:", res.status, res.ok);

    if (!res.ok) {
      throw new Error(`Calendar failed: ${res.status}`);
    }

    const text = await res.text();
    console.log("ICS text preview:", text.slice(0, 120));

    const jcal = ICAL.parse(text);
    const comp = new ICAL.Component(jcal);
    const vevents = comp.getAllSubcomponents("vevent");

    console.log("Number of VEVENTs:", vevents.length);

    const parsed = vevents.map((vevent) => {
      const event = new ICAL.Event(vevent);

      return {
        title: event.summary || "Untitled",
        start: event.startDate.toJSDate(),
        calendarName: cal.name,
        color: normalizeColor(cal.color)
      };
    });

    allEvents.push(...parsed);
  }

  return allEvents;
}

export function makeDemoEvents() {
  const now = new Date();

  return [
    {
      title: "GIS Team Meeting",
      start: setTime(now, 9, 0),
      calendarName: "Demo Work",
      color: "#29ffc6"
    },
    {
      title: "Patch Window Review",
      start: setTime(now, 14, 30),
      calendarName: "Demo Work",
      color: "#29ffc6"
    },
    {
      title: "Lunch",
      start: setTime(addDays(now, 1), 11, 30),
      calendarName: "Demo Home",
      color: "#54ff28"
    },
    {
      title: "Calendar Widget Polish",
      start: setTime(addDays(now, 3), 15, 0),
      calendarName: "Demo Work",
      color: "#29ffc6"
    }
  ];
}