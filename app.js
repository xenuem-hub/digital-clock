// Force US Eastern time
const TIME_ZONE = "America/New_York";

// true for 24-hour (14:40). false for 12-hour (2:40).
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

/* --------- AUTO-FIT TIME TEXT (prevents cropping/overlap) --------- */
function fitTimeToBox() {
  const box = document.getElementById("timeBox");
  const t = document.getElementById("timeText");
  if (!box || !t) return;

  let max = 460;
  let min = 80;

  const targetW = box.clientWidth * 0.98;
  const targetH = box.clientHeight * 0.92;

  for (let i = 0; i < 16; i++) {
    const mid = (min + max) / 2;
    t.style.fontSize = `${mid}px`;

    const rect = t.getBoundingClientRect();
    const ok = (rect.width <= targetW) && (rect.hei
