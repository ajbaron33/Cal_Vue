import ICAL from "ical.js";
import { useEffect, useState } from "react";
import "./App.css";

const DEFAULT_CALENDARS = [
  { name: "Demo Work", url: "", color: "#29ffc6" },
  { name: "Demo Home", url: "", color: "#54ff28" }
];

function App() {
  const [cursor, setCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendars, setCalendars] = useState(loadSavedCalendars());
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState("Demo mode");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    const saved = loadSavedCalendars();
    setCalendars(saved);

    const activeCalendars = saved.filter((cal) => cal.url?.trim());

    if (activeCalendars.length === 0) {
      setEvents(makeDemoEvents());
      setStatus("Demo mode — no ICS calendars saved");
      return;
    }

    try {
      const allEvents = [];

      for (const cal of activeCalendars) {
        console.log("Loading calendar:", cal.name, cal.url);

        const fixedUrl = cal.url.replace(/^webcal:/i, "https:");
        const proxyUrl = `http://localhost:3030/ics?url=${encodeURIComponent(fixedUrl)}`;
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

      setEvents(allEvents);
      setStatus(`Loaded ${allEvents.length} events`);
    } catch (err) {
      console.error("Calendar load failed:", err);
      setEvents(makeDemoEvents());
      setStatus("Could not load ICS — showing demo events");
    }
  }

  const days = buildMonth(cursor);
  const today = new Date();

  const selectedEvents = events
    .filter((event) => sameDay(event.start, selectedDate))
    .sort((a, b) => a.start - b.start);

  const nextEvents = events
    .filter((event) => afterToday(event.start, today))
    .sort((a, b) => a.start - b.start)
    .slice(0, 4);

  return (
    <main className="shell">
      <section className="calendarPanel">
        <header className="topBar">
          <button onClick={() => setCursor(addMonths(cursor, -1))}>‹</button>
          <h1>
            {cursor.toLocaleString("default", {
              month: "long",
              year: "numeric"
            })}
          </h1>
          <button onClick={() => setCursor(addMonths(cursor, 1))}>›</button>
        </header>

        <div className="weekdays">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid">
          {days.map((day, index) => {
            const dayEvents = events.filter((event) =>
              sameDay(event.start, day.date)
            );

            return (
              <div
                key={index}
                className={[
                  "day",
                  !day.currentMonth ? "muted" : "",
                  sameDay(day.date, today) ? "today" : "",
                  sameDay(day.date, selectedDate) ? "selected" : ""
                ].join(" ")}
                onClick={() => setSelectedDate(new Date(day.date))}
              >
                <div className="dayNum">{day.date.getDate()}</div>

                <div className="dots">
                  {dayEvents.slice(0, 4).map((event, i) => (
                    <span
                      key={i}
                      style={{
                        background: event.color,
                        boxShadow: `0 0 8px ${event.color}`
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="agendaPanel">
        <div className="agendaHeader">
          <div>
            <div className="eyebrow">CalVue</div>
            <h2>
              {selectedDate.toLocaleDateString("default", {
                weekday: "long",
                month: "long",
                day: "numeric"
              })}
            </h2>
            <p className="status">{status}</p>
          </div>

          <button
            className="settingsBtn"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙
          </button>
        </div>

        {showSettings ? (
          <CalendarSettings
            calendars={calendars}
            onSave={() => {
              setShowSettings(false);
              loadEvents();
            }}
          />
        ) : (
          <>
            <div className="agendaList">
              {selectedEvents.length === 0 ? (
                <div className="emptyState">No events this day</div>
              ) : (
                selectedEvents.map((event, index) => (
                  <EventCard event={event} key={index} />
                ))
              )}
            </div>

            <div className="nextBlock">
              <div className="sectionLabel">Next</div>
              {nextEvents.map((event, index) => (
                <EventCard event={event} compact key={index} />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function EventCard({ event, compact = false }) {
  return (
    <article
      className={compact ? "eventCard compact" : "eventCard"}
      style={{ borderLeftColor: event.color }}
    >
      <div className="eventDate">
        {event.start.toLocaleDateString("default", {
          weekday: "short",
          month: "short",
          day: "numeric"
        })}
      </div>
      <div className="eventTitle">{event.title}</div>
      <div className="eventMeta">
        <span>
          {event.start.toLocaleTimeString("default", {
            hour: "numeric",
            minute: "2-digit"
          })}
        </span>
        <span style={{ color: event.color }}>{event.calendarName}</span>
      </div>
    </article>
  );
}

function CalendarSettings({ calendars, onSave }) {
  const [items, setItems] = useState(calendars);

  function update(index, field, value) {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  }

  function addCalendar() {
    setItems([
      ...items,
      {
        name: "New Calendar",
        url: "",
        color: "#29ffc6"
      }
    ]);
  }

  function removeCalendar(index) {
    setItems(items.filter((_, i) => i !== index));
  }

  function save() {
    const cleaned = items.map((item) => ({
      name: item.name?.trim() || "Untitled Calendar",
      url: item.url?.trim() || "",
      color: item.color?.trim() || "#29ffc6"
    }));

    localStorage.setItem("cal_vue_calendars", JSON.stringify(cleaned));
    onSave();
  }

  return (
    <div className="settingsPanel">
      {items.map((cal, index) => (
        <div className="calendarConfig" key={index}>
          <input
            value={cal.name}
            onChange={(e) => update(index, "name", e.target.value)}
            placeholder="Calendar name"
          />

          <input
            value={cal.url}
            onChange={(e) => update(index, "url", e.target.value)}
            placeholder="ICS URL"
          />

          <div className="colorRow">
            <input
              type="color"
              value={toHex(cal.color)}
              onChange={(e) => update(index, "color", e.target.value)}
            />

            <input
              value={cal.color}
              onChange={(e) => update(index, "color", e.target.value)}
              placeholder="#29ffc6 or rgb(41,255,198)"
            />

            <button onClick={() => removeCalendar(index)}>×</button>
          </div>
        </div>
      ))}

      <div className="settingsActions">
        <button onClick={addCalendar}>Add Calendar</button>
        <button onClick={save}>Save</button>
      </div>
    </div>
  );
}

function loadSavedCalendars() {
  try {
    const saved = localStorage.getItem("cal_vue_calendars");
    return saved ? JSON.parse(saved) : DEFAULT_CALENDARS;
  } catch {
    return DEFAULT_CALENDARS;
  }
}

function makeDemoEvents() {
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

function buildMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    return {
      date: d,
      currentMonth: d.getMonth() === month
    };
  });
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function afterToday(a, b) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aa > bb;
}

function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

function setTime(date, hour, minute) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function normalizeColor(value) {
  if (!value) return "#29ffc6";
  return value.trim();
}

function toHex(value) {
  if (!value) return "#29ffc6";
  if (value.startsWith("#")) return value;

  const match = value.match(/\d+/g);
  if (!match || match.length < 3) return "#29ffc6";

  return (
    "#" +
    match
      .slice(0, 3)
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

export default App;