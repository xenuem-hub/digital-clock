// Force US Eastern time
const TIME_ZONE = "America/New_York";

// true for 24-hour (13:29). false for 12-hour (1:29).
const USE_24H = true;

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function partsInTZ(date, timeZone) {
  const opts = timeZone
    ? {
        timeZone,
        year: "numeric", month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        weekday: "short",
        hourCycle: "h23"
      }
    : {
        year: "numeric", month: "numeric", day: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        weekday: "short",
        hourCycle: "h23"
      };

  const dtf = new Intl.DateTimeFormat("en-US", opts);
  const p = dtf.formatToParts(date);

  const get = (type) => p.find(x => x.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")), // 1-12
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday")
  };
}

// Find a Date instant whose formatted TZ date equals Y-M-D (weekday alignment)
function findInstantForTZDate(year, month1to12, day, timeZone) {
  let dt = new Date(Date.UTC(year, month1to12 - 1, day, 12, 0, 0));
  const targetKey = year * 10000 + month1to12 * 100 + day;

  for (let i = 0; i < 48; i++) {
    const p = partsInTZ(dt, timeZone);
    const key = p.year * 10000 + p.month * 100 + p.day;
    if (key === targetKey) return dt;

    if (key < targetKey) dt = new Date(dt.getTime() + 60 * 60 * 1000);
    else dt = new Date(dt.getTime() - 60 * 60 * 1000);
  }
  return dt;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// ---------- DIGITAL TIME + BLINKING COLON ----------
function updateDigitalTime() {
  const now = new Date();
  const p = partsInTZ(now, TIME_ZONE);

  let hour = p.hour;
  const minute = p.minute;
  const second = p.second;

  if (!USE_24H) {
    const h = hour % 12;
    hour = (h === 0) ? 12 : h;
  }

  const hourText = USE_24H ? pad2(hour) : String(hour);

  const hourEl = document.getElementById("hourText");
  const minEl = document.getElementById("minuteText");
  const colonEl = document.getElementById("colonText");

  if (hourEl) hourEl.textContent = hourText;
  if (minEl) minEl.textContent = pad2(minute);

  // Blink: visible on even seconds, hidden on odd seconds
  if (colonEl) colonEl.style.opacity = (second % 2 === 0) ? "1" : "0";
}

updateDigitalTime();
setInterval(updateDigitalTime, 250);

// ---------- CALENDAR ----------
function renderCalendar() {
  const monthTitle = document.getElementById("monthTitle");
  const calGrid = document.getElementById("calGrid");
  if (!monthTitle || !calGrid) return;

  const now = new Date();
  const today = partsInTZ(now, TIME_ZONE);

  const year = today.year;
  const month1to12 = today.month;
  const monthIndex = month1to12 - 1;

  const monthName = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE || undefined,
    month: "long"
  }).format(now);

  monthTitle.textContent = monthName.toUpperCase();

  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const firstInstant = TIME_ZONE
    ? findInstantForTZDate(year, month1to12, 1, TIME_ZONE)
    : new Date(year, monthIndex, 1);

  const firstWk = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE || undefined,
    weekday: "short"
  }).format(firstInstant);

  const startDow = WEEKDAY_INDEX[firstWk] ?? 0;

  calGrid.innerHTML = "";

  for (let i = 0; i < 42; i++) {
    const dayNum = i - startDow + 1;

    const cell = document.createElement("div");
    cell.className = "dayCell";

    if (dayNum < 1 || dayNum > daysInMonth) {
      cell.classList.add("blank");
      cell.textContent = "";
    } else {
      cell.textContent = String(dayNum);
      if (dayNum === today.day) cell.classList.add("today");
    }

    calGrid.appendChild(cell);
  }
}

renderCalendar();
