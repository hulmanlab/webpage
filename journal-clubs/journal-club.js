// Journal club page behaviour (no front matter, so Jekyll copies this file as is):
//   1. "Add to calendar" buttons on upcoming sessions
//   2. "Subscribe" buttons for the whole feed
//   3. Calendar view (FullCalendar) with a details pop-up
// Session data comes from <script id="jc-data"> (generated from _data/journal_club.yaml).

(function () {
  "use strict";

  const TZ = "Europe/Copenhagen";
  const dataEl = document.getElementById("jc-data");
  if (!dataEl) return;

  let sessions = [];
  try {
    sessions = JSON.parse(dataEl.textContent);
  } catch (err) {
    console.error("journal club: could not read session data", err);
    return;
  }

  // normalise: date as YYYY-MM-DD string
  sessions.forEach((s) => (s.date = String(s.date).slice(0, 10)));
  const byUid = Object.fromEntries(sessions.map((s) => [s.date, s]));

  // ---------- helpers ----------

  const esc = (str) =>
    String(str == null ? "" : str).replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
    );

  const wallFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // wall-clock time in Copenhagen, expressed as if it were UTC (ms)
  function wallAsUtc(ms) {
    const p = {};
    wallFmt.formatToParts(new Date(ms)).forEach((x) => (p[x.type] = x.value));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  }

  // Copenhagen date + time -> real instant (ms since epoch), handles summer/winter time
  function copenhagenInstant(dateStr, timeStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const [hh, mm] = timeStr.split(":").map(Number);
    const target = Date.UTC(y, m - 1, d, hh, mm);
    let t = target;
    for (let i = 0; i < 2; i++) t = t - (wallAsUtc(t) - target);
    return t;
  }

  const icsStamp = (ms) =>
    new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const icsEscape = (s) =>
    String(s == null ? "" : s)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n");

  function timesOf(s) {
    if (!s.start) return null;
    const start = copenhagenInstant(s.date, s.start);
    const end = s.end ? copenhagenInstant(s.date, s.end) : start + 60 * 60 * 1000;
    return { start, end };
  }

  const titleOf = (s) => "Journal Club: " + s.title;
  const articleOf = (s) => `${s.authors} ${s.title}, ${s.journal}.`;
  const descriptionOf = (s) =>
    `Article: ${articleOf(s)}\n${s.url || ""}\n\nPlease read the article before joining.`;

  function eventIcs(s) {
    const t = timesOf(s);
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hulman Lab//MLCP Journal Club//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      // same UID as the subscribe feed, so a downloaded event is not duplicated
      `UID:${s.date}-mlcp-journal-club@hulmanlab.org`,
      `DTSTAMP:${icsStamp(Date.now())}`,
      `DTSTART:${icsStamp(t.start)}`,
      `DTEND:${icsStamp(t.end)}`,
      `SUMMARY:${icsEscape(titleOf(s))}`,
      s.location ? `LOCATION:${icsEscape(s.location)}` : null,
      `DESCRIPTION:${icsEscape(descriptionOf(s))}`,
      s.url ? `URL:${s.url}` : null,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
  }

  function downloadIcs(s) {
    const blob = new Blob([eventIcs(s)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `mlcp-journal-club-${s.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function googleUrl(s) {
    const t = timesOf(s);
    const q = new URLSearchParams({
      action: "TEMPLATE",
      text: titleOf(s),
      dates: `${icsStamp(t.start)}/${icsStamp(t.end)}`,
      details: descriptionOf(s),
      location: s.location || "",
    });
    return "https://calendar.google.com/calendar/render?" + q.toString();
  }

  function outlookUrl(s) {
    const t = timesOf(s);
    const q = new URLSearchParams({
      path: "/calendar/action/compose",
      rru: "addevent",
      subject: titleOf(s),
      startdt: new Date(t.start).toISOString(),
      enddt: new Date(t.end).toISOString(),
      body: descriptionOf(s),
      location: s.location || "",
    });
    return "https://outlook.office.com/calendar/0/deeplink/compose?" + q.toString();
  }

  const btn = (icon, label, attrs) =>
    `<a class="button" data-style="bare" ${attrs}><i class="icon ${icon}"></i><span>${label}</span></a>`;

  // fills `el` with "Add to calendar" buttons for session `s`
  function addCalendarButtons(el, s) {
    if (!s || !s.start) return;
    el.innerHTML =
      `<span class="jc-add-label"><i class="icon fa-solid fa-calendar-plus"></i> Add to calendar:</span>` +
      btn("fa-solid fa-file-arrow-down", ".ics", 'href="#" data-ics') +
      btn("fa-brands fa-google", "Google", `href="${esc(googleUrl(s))}" target="_blank" rel="noopener"`) +
      btn("fa-brands fa-microsoft", "Outlook", `href="${esc(outlookUrl(s))}" target="_blank" rel="noopener"`);
    el.querySelector("[data-ics]").addEventListener("click", (ev) => {
      ev.preventDefault();
      downloadIcs(s);
    });
  }

  // ---------- 1. buttons on upcoming session cards ----------

  document.querySelectorAll(".jc-session").forEach((card) => {
    const s = byUid[card.dataset.uid];
    const slot = card.querySelector(".jc-add");
    if (s && slot) addCalendarButtons(slot, s);
  });

  // ---------- 2. subscribe buttons ----------

  const sub = document.querySelector(".jc-subscribe");
  if (sub) {
    const feed = new URL(sub.dataset.feed, window.location.href).href;
    const webcal = feed.replace(/^https?:/, "webcal:");
    const name = "MLCP Journal Club";
    const googleSub = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
    const outlookSub =
      "https://outlook.office.com/calendar/0/addfromweb?url=" +
      encodeURIComponent(feed) +
      "&name=" +
      encodeURIComponent(name);
    const holder = sub.querySelector(".jc-sub-buttons");
    holder.innerHTML =
      `<a class="button" href="${esc(webcal)}"><i class="icon fa-brands fa-apple"></i><span>Apple / Outlook desktop</span></a>` +
      `<a class="button" href="${esc(googleSub)}" target="_blank" rel="noopener"><i class="icon fa-brands fa-google"></i><span>Google</span></a>` +
      `<a class="button" href="${esc(outlookSub)}" target="_blank" rel="noopener"><i class="icon fa-brands fa-microsoft"></i><span>Outlook web</span></a>` +
      `<a class="button" data-style="bare" href="${esc(feed)}" data-copy><i class="icon fa-regular fa-copy"></i><span>Copy link</span></a>`;
    const copy = holder.querySelector("[data-copy]");
    copy.addEventListener("click", (ev) => {
      ev.preventDefault();
      const label = copy.querySelector("span");
      const done = () => {
        label.textContent = "Copied!";
        setTimeout(() => (label.textContent = "Copy link"), 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(feed).then(done, () => window.prompt("Copy this link:", feed));
      } else {
        window.prompt("Copy this link:", feed);
      }
    });
  }

  // ---------- 3. calendar view ----------

  const calEl = document.getElementById("jc-calendar");
  const dialog = document.getElementById("jc-dialog");

  function showDetails(s) {
    const when = new Date(s.date + "T12:00:00").toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    dialog.innerHTML =
      `<form method="dialog" class="jc-dialog-close"><button aria-label="Close">&times;</button></form>` +
      `<h4>${esc(s.title)}</h4>` +
      `<p class="jc-when"><i class="icon fa-regular fa-calendar"></i> <strong>${esc(when)}</strong>` +
      (s.start ? ` &middot; ${esc(s.start)}${s.end ? "&ndash;" + esc(s.end) : ""}` : "") +
      `</p>` +
      (s.location ? `<p class="jc-where"><i class="icon fa-solid fa-location-dot"></i> ${esc(s.location)}</p>` : "") +
      `<p class="jc-article"><strong>Article:</strong> ${esc(s.authors)} <em>${esc(s.title)}</em>, ${esc(s.journal)}. ` +
      (s.url ? `<a href="${esc(s.url)}">Link</a>` : "") +
      `</p>` +
      (s.note ? `<p class="jc-note">${esc(s.note)}</p>` : "") +
      `<div class="jc-actions">` +
      (s.signup_url
        ? `<a class="button" href="${esc(s.signup_url)}"><i class="icon fa-solid fa-pen-to-square"></i><span>Sign up</span></a>`
        : "") +
      `<span class="jc-add"></span></div>`;
    addCalendarButtons(dialog.querySelector(".jc-add"), s);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  if (dialog) {
    // click on the dark backdrop closes the dialog
    dialog.addEventListener("click", (ev) => {
      if (ev.target === dialog) dialog.close();
    });
  }

  function initCalendar() {
    if (!calEl || !window.FullCalendar) return;
    const events = sessions.map((s) => ({
      id: s.date,
      // short title for the narrow month grid; the full title is in the pop-up and list view
      title: s.authors,
      extendedProps: { full: s.title },
      start: s.start ? `${s.date}T${s.start}:00` : s.date,
      end: s.start && s.end ? `${s.date}T${s.end}:00` : undefined,
      allDay: !s.start,
    }));
    const calendar = new FullCalendar.Calendar(calEl, {
      initialView: "dayGridMonth",
      // sessions are shown at their Copenhagen wall-clock time for every visitor
      timeZone: "local",
      firstDay: 1,
      height: "auto",
      fixedWeekCount: false,
      displayEventEnd: false,
      eventDisplay: "block",
      allDayText: "", // sessions without a time are not really "all-day"
      views: {
        listYear: {
          eventContent: (arg) => ({
            html: `${esc(arg.event.title)} &ndash; <em>${esc(arg.event.extendedProps.full)}</em>`,
          }),
        },
      },
      eventTimeFormat: { hour: "2-digit", minute: "2-digit", hour12: false },
      headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,listYear" },
      buttonText: { today: "Today", month: "Month", listYear: "List" },
      events,
      eventClick(info) {
        info.jsEvent.preventDefault();
        const s = byUid[info.event.id];
        if (s) showDetails(s);
      },
    });
    calendar.render();

    // open on the month of the next upcoming session (or latest session if none)
    const today = new Date().toISOString().slice(0, 10);
    const next = sessions
      .map((s) => s.date)
      .filter((d) => d >= today)
      .sort()[0];
    if (next) calendar.gotoDate(next);
  }

  // FullCalendar is loaded with `defer` before this script, so it is normally ready
  if (window.FullCalendar) initCalendar();
  else window.addEventListener("load", initCalendar);
})();
