// Keep consistent with your prior version: force US Eastern.
const TIME_ZONE = "America/New_York";

// Match your sample image (17:56). Set to false if you want 12-hour time.
const USE_24H = true;

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function partsInTZ(date, timeZone) {
  const opts = timeZone
    ? { timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23" }
    : { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short", hourCycle: "h23" };

  const dtf = new Intl.DateTimeFormat("en-US", opts);
  const p = dtf.formatToParts(date);

  const get = (type) => p.find(x => x.type === type)?.value;
  return {
    year: Number(get("year")),
    month: Number(get("month")),     // 1-12
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday")          // "Mon", etc
  };
}

// Find a Date instant whose formatted TZ date equals Y-M-D (for correct weekday alignment).
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

// ---------- DIGITAL RING TICKS (rounded-rect perimeter) ----------
function buildRingTicks() {
  const path = document.getElementById("ringPath");
  const g = document.getElementById("ringTicks");
  if (!path || !g) return;

  g.innerHTML = "";

  const total = path.getTotalLength();

  // 60 ticks around the perimeter, like a “minute ring”
  const tickCount = 60;

  // Tick lengths in SVG units
  const minorLen = 7;
  const majorLen = 11;

  for (let i = 0; i < tickCount; i++) {
    const isMajor = (i % 5 === 0);

    const len = isMajor ? majorLen : minorLen;
    const s = (i / tickCount) * total;

    // point and a nearby point to estimate tangent direction
    const p1 = path.getPointAtLength(s);
    const p2 = path.getPointAtLength((s + 0.5) % total);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    // normal vector (perpendicular to tangent)
    const mag = Math.hypot(dx, dy) || 1;
    const nx = -dy / mag;
    const ny = dx / mag;

    // We want ticks pointing inward. Determine inward direction by sampling a point slightly inward.
    // For a closed shape, inward is toward the center (130,90) roughly.
    const cx = 130, cy = 90;
    const toCenterX = cx - p1.x;
    const toCenterY = cy - p1.y;
    const dot = (nx * toCenterX + ny * toCenterY);
    const inwardSign = dot >= 0 ? 1 : -1;

    const x1 = p1.x;
    const y1 = p1.y;
    const x2 = p1.x + inwardSign * nx * len;
    const y2 = p1.y + inwardSign * ny * len;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1.toFixed(2));
    line.setAttribute("y1", y1.toFixed(2));
    line.setAttribute("x2", x2.toFixed(2));
    line.setAttribute("y2", y2.toFixed(2));
    line.setAttribute("class", isMajor ? "rTick major" : "rTick");

    g.appendChild(line);
  }
}

buildRingTicks();
window.addEventListener("resize", buildRingTicks);

// ---------- DIGITAL TIME ----------
function updateDigitalTime() {
  const now = new Date();
  const p = partsInTZ(now, TIME_ZONE);

  let hour = p.hour;
  let minute = p.minute;

  if (!USE_24H) {
    // Convert 0..23 -> 1..12
    const h = hour % 12;
    hour = (h === 0) ? 12 : h;
  }

  const txt = `${pad2(hour)}:${pad2(minute)}`;
  const el = document.getElementById("timeText");
  if (el) el.textContent = txt;
}

updateDigitalTime();
setInterval(updateDigitalTime, 250);

// ---------- CALENDAR (same logic as your fixed version) ----------
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
