const EMU_ASSET_BASE = new URL(
  "assets/branding/",
  document.querySelector('script[src$="app.js"]').src,
);
let storageProblem = false,
  storageConflict = false;
const storage = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      storageProblem = true;
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      storageProblem = true;
      return false;
    }
  },
};
function loadState() {
  const raw = storage.get("emuV15");
  if (!raw) return structuredClone(SEED);
  try {
    const value = JSON.parse(raw);
    for (const key of [
      "events",
      "tasks",
      "requests",
      "approvals",
      "partners",
    ]) {
      if (
        !Array.isArray(value[key]) ||
        value[key].some(
          (x) =>
            !x ||
            typeof x !== "object" ||
            Array.isArray(x) ||
            !["string", "number"].includes(typeof x.id),
        )
      )
        throw Error("schema");
    }
    for (const key of [
      "events",
      "tasks",
      "requests",
      "approvals",
      "partners",
    ]) {
      if (
        new Set(value[key].map((x) => String(x.id))).size !== value[key].length
      )
        throw Error("duplicate identifiers");
    }
    for (const e of value.events) {
      if (
        !Number.isFinite(e.progress) ||
        e.progress < 0 ||
        e.progress > 100 ||
        !Array.isArray(e.partners) ||
        e.partners.some((id) => !Number.isSafeInteger(id)) ||
        !validDate(e.date, true) ||
        ![e.titleEn, e.titleAr, e.orgEn, e.orgAr, e.campus, e.status].every(
          (x) => x == null || typeof x === "string",
        )
      )
        throw Error("event");
    }
    for (const key of ["events", "tasks", "approvals", "partners"])
      if (value[key].some((x) => !Number.isSafeInteger(x.id)))
        throw Error("id");
    for (const t of value.tasks)
      if (!value.events.some((e) => e.id === t.eventId))
        throw Error("task reference");
    for (const a of value.approvals)
      if (!value.events.some((e) => e.id === a.eventId))
        throw Error("approval reference");
    for (const partner of value.partners)
      if (partner.history != null && !Array.isArray(partner.history))
        throw Error("history");
    for (const partner of value.partners) {
      if (
        partner.relationshipStatus != null &&
        !["Active", "Potential", "Inactive", "On Hold"].includes(
          partner.relationshipStatus,
        )
      )
        throw Error("relationship status");
      if (
        partner.sponsorshipStatus != null &&
        ![
          "Not Contacted",
          "Contacted",
          "Negotiating",
          "Confirmed",
          "Declined",
        ].includes(partner.sponsorshipStatus)
      )
        throw Error("sponsorship status");
      if (
        partner.notesHistory != null &&
        (!Array.isArray(partner.notesHistory) ||
          partner.notesHistory.some((n) => !n || typeof n.text !== "string"))
      )
        throw Error("notes history");
    }
    const stringFields = {
      events: [
        "titleEn",
        "titleAr",
        "date",
        "time",
        "campus",
        "orgEn",
        "orgAr",
        "status",
      ],
      tasks: ["titleEn", "titleAr", "dept", "status", "priority", "due"],
      requests: [
        "titleEn",
        "titleAr",
        "requester",
        "date",
        "campus",
        "status",
        "submitted",
      ],
      approvals: ["dept", "status", "note"],
      partners: [
        "name",
        "catEn",
        "catAr",
        "actEn",
        "actAr",
        "phone",
        "email",
        "status",
        "notes",
        "contactPerson",
        "previousParticipation",
        "relationshipStatus",
        "sponsorshipStatus",
      ],
    };
    for (const [key, fields] of Object.entries(stringFields))
      for (const item of value[key])
        for (const field of fields)
          if (item[field] != null && typeof item[field] !== "string")
            throw Error("field type");
    for (const partner of value.partners)
      for (const history of partner.history || [])
        if (
          !history ||
          typeof history !== "object" ||
          !["date", "channel", "note"].every(
            (k) => typeof history[k] === "string",
          )
        )
          throw Error("history record");
    value.log = Array.isArray(value.log)
      ? value.log.filter(
          (x) =>
            x && typeof x.action === "string" && typeof x.time === "string",
        )
      : [];
    return value;
  } catch {
    storageProblem = true;
    return structuredClone(SEED);
  }
}
let state = loadState();
let persistedSnapshot = storage.get("emuV15");
let lang = storage.get("emuLang") === "en" ? "en" : "ar",
  page = "dashboard",
  dashFilter = "all";
const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[m],
    );
const L = (en, ar) => (lang === "ar" ? ar : en);
function role() {
  const r = sessionStorage.getItem("emuRole");
  return sessionStorage.getItem("emuLogin") === "1" &&
    ["EMU Admin", "EMU Staff", "Viewer"].includes(r)
    ? r
    : "Viewer";
}
function canEdit() {
  return (
    sessionStorage.getItem("emuLogin") === "1" &&
    ["EMU Admin", "EMU Staff"].includes(role())
  );
}
function isAdmin() {
  return role() === "EMU Admin";
}
function deny() {
  toast(
    L(
      "View-only access: this action requires EMU Staff or Admin.",
      "صلاحية عرض فقط: هذا الإجراء يتطلب موظف EMU أو مدير النظام.",
    ),
  );
}
function save() {
  if (storageProblem) {
    showStorageNotice();
    toast(
      L(
        "Changes are temporary until storage is recovered.",
        "التغييرات مؤقتة حتى استعادة التخزين.",
      ),
    );
    return false;
  }
  if (!storageCurrent()) return false;
  const serialized = JSON.stringify(state);
  const ok = storage.set("emuV15", serialized);
  if (ok) persistedSnapshot = serialized;
  else showStorageNotice();
  return ok;
}
function toast(x) {
  if (storageProblem || storageConflict)
    x = L(
      "Changes are temporary; review the storage notice.",
      "التغييرات مؤقتة؛ راجع تنبيه التخزين.",
    );
  let t = $("#toast");
  t.textContent = x;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}
function pill(x) {
  return `<span class="pill ${esc(x)}">${esc(tr(x))}</span>`;
}
function eventName(e) {
  return e
    ? e.titleEn || e.titleAr || L("Untitled event", "فعالية بلا اسم")
    : "";
}
function orgName(e) {
  return translated(e, "org");
}
function byId(id) {
  return state.events.find((e) => e.id == id);
}
function fmt(d) {
  if (!validDate(d)) return tr("TBD");
  return new Intl.DateTimeFormat(locale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d + "T12:00:00"));
}
function persistLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  storage.set("emuLang", lang);
}
function filteredUpcoming() {
  let today = todayISO(),
    arr = state.events.filter((e) => e.date && e.date >= today);
  if (dashFilter === "today") arr = arr.filter((e) => e.date === today);
  if (dashFilter === "week")
    arr = arr.filter(
      (e) => e.date >= weekRange()[0] && e.date <= weekRange()[1],
    );
  if (dashFilter === "month")
    arr = arr.filter((e) => e.date.startsWith(todayISO().slice(0, 7)));
  if (dashFilter === "corniche")
    arr = arr.filter((e) => ["Corniche", "Both"].includes(e.campus));
  if (dashFilter === "north")
    arr = arr.filter((e) => ["North Obhur", "Both"].includes(e.campus));
  return arr.sort((a, b) => a.date.localeCompare(b.date));
}
function eventsPage() {
  let q = normalizeSearch(window.eq || ""),
    st = window.est || "All",
    camp = window.ecamp || "All";
  let arr = state.events
    .filter(
      (e) =>
        (!q ||
          normalizeSearch(
            [e.titleEn, e.titleAr, e.orgEn, e.orgAr, e.campus, e.reference || ""].join(" "),
          ).includes(q)) &&
        (!window.eventMonthFilter ||
          e.date?.startsWith(window.eventMonthFilter)) &&
        (st === "All" || e.status === st) &&
        (camp === "All" ||
          e.campus === camp ||
          (["Corniche", "North Obhur"].includes(camp) && e.campus === "Both")),
    )
    .sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));
  return (
    head(
      L("All Events", "جميع الفعاليات"),
      L(
        "Create, edit, track and manage every event from one place.",
        "إنشاء وتعديل ومتابعة وإدارة جميع الفعاليات من مكان واحد.",
      ),
      canEdit()
        ? `<button class="btn primary" id="addEvent">+ ${L("New Event", "فعالية جديدة")}</button>`
        : "",
    ) +
    `<div class="card">${window.eventMonthFilter ? `<p class="inline-notice">${L("Month: ", "الشهر: ") + esc(window.eventMonthFilter)} · ${L("Use Clear to view all events.", "اختر مسح لعرض جميع الفعاليات.")}</p>` : ""}<div class="filters"><input id="eventSearch" value="${esc(window.eq || "")}" placeholder="${L("Search events...", "ابحث عن فعالية...")}"><select id="eventStatus"><option>All</option><option>Confirmed</option><option>Planned</option><option>TBD</option></select><select id="eventCampus"><option>All</option><option>Corniche</option><option>North Obhur</option><option>Both</option><option>TBD</option></select><button class="btn secondary" id="clearEventFilters">${L("Clear", "مسح")}</button></div>${eventTable(arr)}</div>`
  );
}
function eventTable(arr) {
  return `<div class="table-wrap"><table><thead><tr><th>${L("Event", "الفعالية")}</th><th>${L("Date", "التاريخ")}</th><th>${L("Campus", "الموقع")}</th><th>${L("Organizer", "الجهة")}</th><th>${L("Status", "الحالة")}</th><th>${L("Readiness", "الجاهزية")}</th></tr></thead><tbody>${arr.map((e) => `<tr data-id="${e.id}" data-open-event="${e.id}"><td><b>${esc(eventName(e))}</b><span class="mini">#${e.id}</span></td><td>${fmt(e.date)}<span class="mini">${esc(e.time || "")}</span></td><td>${esc(tr(e.campus))}</td><td>${esc(orgName(e))}</td><td>${pill(e.status)}</td><td><b>${e.progress}%</b><div class="progress"><i style="width:${e.progress}%"></i></div></td></tr>`).join("")}</tbody></table></div>`;
}
function calendarPage() {
  return (
    head(
      L("Events Calendar", "تقويم الفعاليات"),
      L(
        "Interactive monthly calendar linked to event records.",
        "تقويم شهري متفاعل مرتبط بملفات الفعاليات.",
      ),
      canEdit()
        ? `<button class="btn primary" id="calAdd">+ ${L("Add Event", "إضافة فعالية")}</button>`
        : "",
    ) + `<div class="card calendar-page">${calendarHTML()}</div>`
  );
}
function requestsPage() {
  return (
    head(
      L("Event Requests", "طلبات الفعاليات"),
      L(
        "Review requests and convert approved requests into managed events.",
        "مراجعة الطلبات وتحويل الطلبات المعتمدة إلى فعاليات مُدارة.",
      ),
      canEdit()
        ? `<button class="btn primary" id="newReq">+ ${L("New Request", "طلب جديد")}</button>`
        : "",
    ) + `<div class="card">${requestTable()}</div>`
  );
}
function requestTable() {
  return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>${L("Event", "الفعالية")}</th><th>${L("Requester", "مقدم الطلب")}</th><th>${L("Date", "التاريخ")}</th><th>${L("Campus", "الموقع")}</th><th>${L("Status", "الحالة")}</th></tr></thead><tbody>${state.requests.map((r) => `<tr data-id="${esc(r.id)}" data-request="${esc(r.id)}"><td><b>${esc(r.id)}</b></td><td>${esc(translated(r, "title"))}</td><td>${esc(r.requester)}</td><td>${fmt(r.date)}</td><td>${esc(tr(r.campus))}</td><td>${pill(r.status)}</td></tr>`).join("")}</tbody></table></div>`;
}
function tasksPage() {
  let pending = state.tasks.filter((t) => t.status !== "Done").length,
    aps = state.approvals.filter((a) => a.status === "Pending").length;
  return (
    head(
      L("Tasks & Approvals", "المهام والموافقات"),
      L(
        "Operational tasks and cross-department approvals linked to each event.",
        "المهام التشغيلية والموافقات بين الإدارات مرتبطة بكل فعالية.",
      ),
      canEdit()
        ? `<button class="btn primary" id="addTask">+ ${L("New Task", "مهمة جديدة")}</button>`
        : "",
    ) +
    `<div class="grid kpis" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">${kpi("taskPending", L("Open Tasks", "مهام مفتوحة"), pending, L("Action required", "تحتاج إجراء"))}${kpi("approvalPending", L("Pending Approvals", "موافقات معلقة"), aps, L("Awaiting departments", "بانتظار الإدارات"))}${kpi("done", L("Completed Tasks", "مهام مكتملة"), state.tasks.filter((t) => t.status === "Done").length, L("Completed", "مكتملة"))}</div><div class="tabs"><button class="active" data-task-tab="tasks">${L("Tasks", "المهام")}</button><button data-task-tab="approvals">${L("Approvals", "الموافقات")}</button></div><div id="taskArea">${tasksTable()}</div>`
  );
}
function tasksTable() {
  return `<div class="card"><div class="table-wrap"><table><thead><tr><th>${L("Task", "المهمة")}</th><th>${L("Event", "الفعالية")}</th><th>${L("Department", "الإدارة")}</th><th>${L("Due", "الاستحقاق")}</th><th>${L("Priority", "الأولوية")}</th><th>${L("Status", "الحالة")}</th></tr></thead><tbody>${state.tasks
    .filter(
      (t) =>
        taskFilter === "all" ||
        (taskFilter === "done" ? t.status === "Done" : t.status !== "Done"),
    )
    .map(
      (t) =>
        `<tr data-id="${t.id}" data-task="${t.id}"><td><b>${esc(translated(t, "title"))}</b></td><td>${esc(eventName(byId(t.eventId)) || "—")}</td><td>${esc(tr(t.dept))}</td><td>${fmt(t.due)}</td><td>${esc(tr(t.priority))}</td><td>${pill(t.status)}</td></tr>`,
    )
    .join("")}</tbody></table></div></div>`;
}
function approvalsTable() {
  return `<div class="card"><div class="table-wrap"><table><thead><tr><th>${L("Event", "الفعالية")}</th><th>${L("Department", "الإدارة")}</th><th>${L("Note", "الملاحظة")}</th><th>${L("Status", "الحالة")}</th></tr></thead><tbody>${state.approvals
    .filter(
      (a) =>
        taskFilter === "all" ||
        (taskFilter === "done"
          ? a.status === "Approved"
          : a.status === "Pending"),
    )
    .map(
      (a) =>
        `<tr data-id="${a.id}" data-approval="${a.id}"><td>${esc(eventName(byId(a.eventId)))}</td><td>${esc(tr(a.dept))}</td><td>${esc(a.note)}</td><td>${pill(a.status)}</td></tr>`,
    )
    .join("")}</tbody></table></div></div>`;
}
function partnerName(p) {
  return p.name || L("Public name not approved · ID " + p.id, "اسم غير معتمد للنشر · رقم " + p.id);
}
function partnerRelationship(p) {
  return p.relationshipStatus || "";
}
function partnerSponsorship(p) {
  return p.sponsorshipStatus || "";
}
function partnersPage() {
  const q = normalizeSearch(window.pq || ""),
    st = window.pst || "All",
    sp = window.partnerSponsorshipFilter || "All";
  const arr = state.partners.filter(
    (p) =>
      (!q ||
        normalizeSearch(
          [
            partnerName(p),
            p.id,
            p.contactPerson,
            p.catEn,
            p.catAr,
            p.actEn,
            p.actAr,
            p.phone,
            p.email,
            p.previousParticipation,
            p.notes,
          ].join(" "),
        ).includes(q)) &&
      (st === "All" || partnerRelationship(p) === st) &&
      (sp === "All" || partnerSponsorship(p) === sp) &&
      (!window.followOnly || p.history?.length) &&
      (typeof window.partnerCategory !== "string" || window.partnerCategory === "All" || p.catAr === window.partnerCategory) &&
      (typeof window.partnerParticipation !== "string" || window.partnerParticipation === "All" || p.previousParticipation === window.partnerParticipation) &&
      (!window.publicPartnersOnly || p.publicRecord),
  );
  const publicMode = !state.partners.some(p=>p.privateAvailable);
  return (
    head(
      L("Sponsors & Partners", "الرعاة والشركاء"),
      L(
        "Approved public records load automatically. Private contact information is not bundled.",
        "تُحمّل السجلات العامة المعتمدة تلقائيًا. معلومات التواصل الخاصة غير مضمّنة.",
      ),
      canEdit()
        ? `<button class="btn primary" id="addPartner">+ ${L("Add Partner", "إضافة جهة")}</button>`
        : "",
    ) +
    (publicMode ? `<div class="grid kpis"><div class="card kpi"><span>${L("Approved public partners", "الشركاء المعتمدون للنشر")}</span><b>${state.partners.filter(p=>p.publicRecord).length}</b></div><div class="card kpi"><span>${L("Public categories", "التصنيفات العامة")}</span><b>${new Set(state.partners.filter(p=>p.catAr).map(p=>p.catAr)).size}</b></div><div class="card kpi"><span>${L("Linked events", "الفعاليات المرتبطة")}</span><b>${state.events.filter(e=>e.partners.length).length}</b></div><div class="card kpi"><span>${L("Reserved private IDs", "المعرفات الخاصة المحجوزة")}</span><b>${state.partners.filter(p=>!p.publicRecord).length}</b></div></div>` :
    `<div class="grid kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">${kpi("pall", L("Total Contacts", "إجمالي الجهات"), state.partners.length, L("20 approved public records + reserved ID 12", "٢٠ سجلًا عامًا معتمدًا + المعرف 12 المحجوز"))}${kpi("pactive", L("Active Partners", "شركاء نشطون"), state.partners.filter((p) => partnerRelationship(p) === "Active").length, L("Current relationship", "العلاقة الحالية"))}${kpi("ppotential", L("Potential", "جهات محتملة"), state.partners.filter((p) => partnerRelationship(p) === "Potential").length, L("Current relationship", "العلاقة الحالية"))}${kpi(
      "pfollow",
      L("Follow-ups", "المتابعات"),
      state.partners.reduce((n, p) => n + (p.history?.length || 0), 0),
      L("Recorded contacts", "تواصلات مسجلة"),
    )}</div>`) + `<div class="card">${window.followOnly ? `<p class="inline-notice">${L("Showing contacts with follow-ups. Choose All relationships to reset.", "عرض الجهات التي لديها متابعات. اختر كل العلاقات لإعادة التعيين.")}</p>` : ""}<div class="filters partner-filters"><input id="partnerSearch" value="${esc(window.pq || "")}" placeholder="${L("Search name, contact person or activity…", "ابحث بالجهة أو مسؤول التواصل أو النشاط…")}"><label class="filter-field" for="partnerCategory">${L("Category", "التصنيف")}<select id="partnerCategory"><option value="All">${L("All categories", "كل التصنيفات")}</option>${[...new Set(state.partners.map(p=>p.catAr).filter(Boolean))].map(v=>`<option value="${esc(v)}" ${window.partnerCategory===v?"selected":""}>${esc(v)}</option>`).join("")}</select></label><label class="filter-field" for="partnerParticipation">${L("Previous participation", "المشاركة السابقة")}<select id="partnerParticipation"><option value="All">${L("All source values", "كل قيم المصدر")}</option>${[...new Set(state.partners.map(p=>p.previousParticipation).filter(Boolean))].map(v=>`<option value="${esc(v)}" ${window.partnerParticipation===v?"selected":""}>${esc(v)}</option>`).join("")}</select></label><label class="filter-field" for="partnerStatus">${L("Relationship Status", "حالة العلاقة")}<select id="partnerStatus" aria-label="${L("Relationship status", "حالة العلاقة")}">${["All", "Active", "Potential", "Inactive", "On Hold"].map((x) => `<option value="${x}">${esc(tr(x))}</option>`).join("")}</select></label><label class="filter-field" for="partnerSponsorStatus">${L("Sponsorship Status", "حالة الرعاية")}<select id="partnerSponsorStatus" aria-label="${L("Sponsorship status", "حالة الرعاية")}">${["All", "Not Contacted", "Contacted", "Negotiating", "Confirmed", "Declined"].map((x) => `<option value="${x}">${esc(tr(x))}</option>`).join("")}</select></label><button class="btn secondary" id="exportPartners">${L("Export CSV", "تصدير CSV")}</button></div><div class="table-wrap"><table class="partner-table"><thead><tr>${[L("Partner", "الجهة"), L("Category / Activity", "التصنيف / النشاط"), L("Contact Person", "مسؤول التواصل"), L("Contact", "التواصل"), L("Previous Participation", "المشاركة السابقة"), L("Relationship Status", "حالة العلاقة"), L("Sponsorship Status", "حالة الرعاية"), L("Notes", "ملاحظات")].map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${arr.map((p) => `<tr data-id="${p.id}" data-partner="${p.id}"><td><b dir="auto">${esc(partnerName(p))}</b></td><td>${esc(translated(p, "cat"))}<span class="mini">${esc(translated(p, "act"))}</span></td><td>${esc(p.contactPerson || L("Private · backend pending", "خاص · بانتظار الربط الخلفي"))}</td><td><bdi>${esc(p.phone || p.email || L("Private · backend pending", "خاص · بانتظار الربط الخلفي"))}</bdi></td><td>${esc(p.previousParticipation || tr(""))}</td><td>${pill(partnerRelationship(p))}</td><td>${pill(partnerSponsorship(p))}</td><td>${esc(p.notes || L("Private · backend pending", "خاص · بانتظار الربط الخلفي"))}</td></tr>`).join("")}</tbody></table></div></div>`
  );
}
function reportsPage() {
  let months = {};
  state.events.forEach((e) => {
    if (e.date) {
      let k = e.date.slice(0, 7);
      months[k] = (months[k] || 0) + 1;
    }
  });
  let vals = Object.entries(months).sort().slice(-6),
    max = Math.max(1, ...vals.map((x) => x[1]));
  return (
    head(
      L("Reports & Insights", "التقارير والمؤشرات"),
      L(
        "Live summaries calculated from the same event data.",
        "ملخصات مباشرة محسوبة من نفس بيانات الفعاليات.",
      ),
      `<button class="btn secondary" id="printReport">${L("Print / Save PDF", "طباعة / حفظ PDF")}</button>`,
    ) +
    `<div class="report-branding">${emuLogo()}<div><b>${L("Events Management Unit", "وحدة إدارة الفعاليات")}</b><small>${L("Reports & Insights", "التقارير والمؤشرات")}</small></div></div><div class="grid kpis" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px">${kpi("r1", L("Total Events", "إجمالي الفعاليات"), state.events.length, L("Current database", "قاعدة البيانات"))}${kpi("r2", L("Confirmed", "مؤكدة"), state.events.filter((e) => e.status === "Confirmed").length, L("Scheduled", "مجدولة"))}${kpi("r3", L("Avg. Readiness", "متوسط الجاهزية"), Math.round(state.events.reduce((a, e) => a + e.progress, 0) / Math.max(1, state.events.length)) + "%", L("Across events", "جميع الفعاليات"))}${kpi("r4", L("Partners", "الشركاء"), state.partners.length, L("Reference database", "قاعدة المرجع"))}</div><div class="grid dash-grid"><div class="card"><h3>${L("Events by Month", "الفعاليات حسب الشهر")}</h3><div class="bar-chart">${vals.map(([m, v]) => `<button class="bar" data-report-month="${m}" aria-label="${esc(L("View events in ", "عرض فعاليات ") + m + ": " + v)}"><b>${v}</b><i style="height:${Math.round((v / max) * 120)}px"></i><span>${new Intl.DateTimeFormat(locale(), { month: "short", year: "numeric" }).format(new Date(m + "-01T12:00:00"))}</span></button>`).join("")}</div></div><div class="card"><h3>${L("Status Breakdown", "توزيع الحالات")}</h3>${["Confirmed", "Planned", "TBD"].map((st) => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)"><span>${pill(st)}</span><b>${state.events.filter((e) => e.status === st).length}</b></div>`).join("")}</div></div>`
  );
}
function accessPage() {
  if (!isAdmin())
    return head(
      L("Access Restricted", "الوصول غير مسموح"),
      L(
        "Only EMU Admin can manage users and permissions.",
        "إدارة المستخدمين والصلاحيات متاحة لمدير النظام فقط.",
      ),
    );
  return (
    head(
      L("Users & Access", "المستخدمون والصلاحيات"),
      L(
        "Role-based access model for the production system.",
        "نموذج صلاحيات حسب الدور للنظام النهائي.",
      ),
    ) +
    `<div class="grid profile-grid"><div class="card"><h3>EMU Admin</h3><p class="muted">${L("Full access: events, requests, approvals, partners, reports and users.", "صلاحية كاملة للفعاليات والطلبات والموافقات والشركاء والتقارير والمستخدمين.")}</p></div><div class="card"><h3>EMU Staff</h3><p class="muted">${L("Create and manage operational records without user administration.", "إنشاء وإدارة السجلات التشغيلية دون إدارة المستخدمين.")}</p></div><div class="card"><h3>Viewer</h3><p class="muted">${L("Read-only management view.", "عرض فقط للإدارة.")}</p></div></div>`
  );
}
function taskModal(id) {
  if (!canEdit()) {
    deny();
    return;
  }
  let t = state.tasks.find((x) => x.id == id);
  openModal(
    L("Task", "المهمة"),
    `<div class="form-grid">${field(L("Task (English)", "المهمة بالإنجليزية"), "te", t?.titleEn || "")}${field(L("Task (Arabic)", "المهمة بالعربية"), "ta", t?.titleAr || "")}<div class="field"><label>${L("Event", "الفعالية")}</label><select id="tev">${state.events.map((e) => `<option value="${e.id}" ${t?.eventId === e.id ? "selected" : ""}>${esc(eventName(e))}</option>`).join("")}</select></div>${selectField(L("Department", "الإدارة"), "td", ["EMU", "IT / AV", "Marketing", "Facilities", "PR", "Student Affairs"], t?.dept || "EMU")}${field(L("Due Date", "تاريخ الاستحقاق"), "tdu", t?.due || "", "date")}${selectField(L("Priority", "الأولوية"), "tp", ["High", "Medium", "Low"], t?.priority || "Medium")}${selectField(L("Status", "الحالة"), "ts", ["Pending", "Done"], t?.status || "Pending")}</div><div class="modal-actions"><button class="btn secondary" id="tc">${L("Cancel", "إلغاء")}</button><button class="btn primary" id="tsv">${L("Save", "حفظ")}</button></div>`,
  );
  $("#tc").onclick = closeModal;
  $("#tsv").onclick = () => {
    let obj = {
      id: t?.id || newId(),
      eventId: +$("#tev").value,
      titleEn: $("#te").value.trim(),
      titleAr: $("#ta").value.trim(),
      dept: $("#td").value,
      due: $("#tdu").value,
      priority: $("#tp").value,
      status: $("#ts").value,
    };
    if (t) Object.assign(t, obj);
    else state.tasks.push(obj);
    state.events.forEach(
      (e) =>
        (e.tasks = state.tasks
          .filter((t) => t.eventId === e.id)
          .map((t) => t.id)),
    );
    addLog(
      (t ? "Updated task: " : "Created task: ") + (obj.titleEn || obj.titleAr),
    );
    save();
    closeModal();
    render("tasks");
    toast(L("Task saved", "تم حفظ المهمة"));
  };
}
function approvalModal(id) {
  if (!canEdit()) {
    deny();
    return;
  }
  let a = state.approvals.find((x) => x.id == id);
  openModal(
    L("Approval", "الموافقة"),
    `<div class="form-grid"><div class="field span2"><label>${L("Event", "الفعالية")}</label><input value="${esc(eventName(byId(a.eventId)))}" disabled></div>${selectField(L("Status", "الحالة"), "as", ["Pending", "Approved", "Declined"], a.status)}<div class="field span2"><label>${L("Note", "الملاحظة")}</label><textarea id="an">${esc(a.note || "")}</textarea></div></div><div class="modal-actions"><button class="btn secondary" id="ac">${L("Cancel", "إلغاء")}</button><button class="btn primary" id="asv">${L("Save", "حفظ")}</button></div>`,
  );
  $("#ac").onclick = closeModal;
  $("#asv").onclick = () => {
    a.status = $("#as").value;
    a.note = $("#an").value.trim();
    addLog("Updated approval: " + a.dept + " / " + a.status);
    save();
    closeModal();
    render("tasks");
    toast(L("Approval updated", "تم تحديث الموافقة"));
  };
}
function partnerModal(id) {
  if (!canEdit()) {
    deny();
    return;
  }
  const p = state.partners.find((x) => x.id == id);
  openModal(
    p ? L("Partner Profile", "ملف الشريك") : L("Add Partner", "إضافة جهة"),
    `<div class="form-grid">${field(L("Partner / Contact", "الجهة / الشخص"), "pn", p?.name || "")}${field(L("Contact Person", "مسؤول التواصل"), "pcontact", p?.contactPerson || "")}${field(L("Category (English)", "التصنيف بالإنجليزية"), "pce", p?.catEn || "")}${field(L("Category (Arabic)", "التصنيف بالعربية"), "pca", p?.catAr || "")}${field(L("Activity (English)", "النشاط بالإنجليزية"), "pae", p?.actEn || "")}${field(L("Activity (Arabic)", "النشاط بالعربية"), "paa", p?.actAr || "")}${field(L("Phone / Contact", "رقم التواصل"), "pp", p?.phone || "")}${field(L("Email", "البريد الإلكتروني"), "pe", p?.email || "", "email")}${field(L("Previous Participation (source)", "المشاركة السابقة (المصدر)"), "pprevious", p?.previousParticipation || "")}${selectField(L("Relationship Status", "حالة العلاقة"), "ps", ["", "Active", "Potential", "Inactive", "On Hold"], partnerRelationship(p || {}))}${selectField(L("Sponsorship Status", "حالة الرعاية"), "psponsor", ["", "Not Contacted", "Contacted", "Negotiating", "Confirmed", "Declined"], partnerSponsorship(p || {}))}<div class="field span2"><label for="pnotes">${L("Notes", "ملاحظات")}</label><textarea id="pnotes">${esc(p?.notes || "")}</textarea></div></div>${p?.notesHistory?.length ? `<details class="notes-history"><summary>${L("Preserved historical notes", "الملاحظات التاريخية المحفوظة")} (${p.notesHistory.length})</summary>${p.notesHistory.map((n) => `<p dir="auto">${esc(n.text)}</p>`).join("")}</details>` : ""}${p ? `<div class="card" style="margin-top:12px"><div class="section-title"><h3>${L("Contact History", "سجل التواصل")}</h3><button class="btn secondary" id="addFollow">+ ${L("Follow-up", "متابعة")}</button></div>${p.history?.length ? p.history.map((h) => `<div class="timeline"><b>${fmt(h.date)} · ${esc(tr(h.channel))}</b><span dir="auto">${esc(h.note)}</span></div>`).join("") : `<div class="empty">${L("No contact history yet", "لا يوجد سجل تواصل حتى الآن")}</div>`}</div>` : ""}<div class="modal-actions"><button class="btn secondary" id="pcancel">${L("Cancel", "إلغاء")}</button><button class="btn primary" id="psave">${L("Save", "حفظ")}</button></div>`,
  );
  if (p?.previousParticipation) $("#pprevious").readOnly = true;
  const partnerInputs = Object.fromEntries(["pn","pcontact","pce","pca","pae","paa","pp","pe","pnotes"].map(id=>[id,$("#"+id).value]));
  const partnerValue = (id,key) => p && $("#"+id).value === partnerInputs[id] ? p[key] || "" : $("#"+id).value;

  $("#pcancel").onclick = closeModal;
  bindSave("psave", "partner", () => {
    const notes = partnerValue("pnotes", "notes"),
      notesHistory = structuredClone(p?.notesHistory || []);
    if (
      p?.notes &&
      p.notes !== notes &&
      !notesHistory.some((n) => n.text === p.notes)
    )
      notesHistory.push({
        text: p.notes,
        source: "before-manual-edit",
        time: new Date().toISOString(),
      });
    const obj = {
      id: p?.id || newId(),
      name: partnerValue("pn", "name"),
      contactPerson: partnerValue("pcontact", "contactPerson"),
      previousParticipation: $("#pprevious").value,
      catEn: partnerValue("pce", "catEn"),
      catAr: partnerValue("pca", "catAr"),
      actEn: partnerValue("pae", "actEn"),
      actAr: partnerValue("paa", "actAr"),
      phone: partnerValue("pp", "phone"),
      email: partnerValue("pe", "email"),
      relationshipStatus: $("#ps").value || null,
      sponsorshipStatus: $("#psponsor").value || null,
      notes,
      notesHistory,
      history: p?.history || [],
    };
    if (p) Object.assign(p, obj);
    else state.partners.unshift(obj);
    addLog((p ? "Updated partner: " : "Added partner: ") + obj.name);
    save();
    closeModal();
    render("partners");
    toast(L("Partner saved", "تم حفظ الجهة"));
  });
  if (p) $("#addFollow").onclick = () => followModal(p.id);
}
function followModal(id) {
  if (!canEdit()) {
    deny();
    return;
  }
  let p = state.partners.find((x) => x.id == id);
  openModal(
    L("Add Follow-up", "إضافة متابعة"),
    `<div class="form-grid">${field(L("Date", "التاريخ"), "fd", todayISO(), "date")}${selectField(L("Channel", "طريقة التواصل"), "fc", ["WhatsApp", "Call", "Email", "Meeting"], "WhatsApp")}<div class="field span2"><label>${L("Notes", "الملاحظات")}</label><textarea id="fn"></textarea></div></div><div class="modal-actions"><button class="btn secondary" id="fcan">${L("Cancel", "إلغاء")}</button><button class="btn primary" id="fsav">${L("Save", "حفظ")}</button></div>`,
  );
  $("#fcan").onclick = () => partnerModal(id);
  $("#fsav").onclick = () => {
    p.history = p.history || [];
    p.history.unshift({
      date: $("#fd").value,
      channel: $("#fc").value,
      note: $("#fn").value.trim(),
    });
    // A follow-up is evidence of communication, not a current relationship or sponsorship decision.
    addLog("Partner follow-up: " + p.name);
    save();
    partnerModal(id);
    toast(L("Follow-up saved", "تم حفظ المتابعة"));
  };
}

function locale() {
  return lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB";
}
function todayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function validDate(value, optional = false) {
  if (!value) return optional;
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(Date.parse(value)) &&
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value
  );
}
function weekRange() {
  let d = new Date(todayISO() + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const start = d.toISOString().slice(0, 10);
  d.setUTCDate(d.getUTCDate() + 6);
  return [start, d.toISOString().slice(0, 10)];
}
function translated(record, prefix) {
  return record
    ? (lang === "ar"
        ? record[prefix + "Ar"] || record[prefix + "En"]
        : record[prefix + "En"] || record[prefix + "Ar"]) || "—"
    : "—";
}
function tr(value) {
  const words = {
    "": "غير محدد",
    Inactive: "غير نشط",
    "On Hold": "معلق مؤقتًا",
    "Not Contacted": "لم يتم التواصل",
    Negotiating: "قيد التفاوض",
    All: "الكل",
    Confirmed: "مؤكدة",
    Planned: "مخططة",
    TBD: "يحدد لاحقًا",
    Pending: "معلقة",
    Approved: "معتمدة",
    Conditional: "معتمدة بشروط",
    Declined: "مرفوضة",
    Done: "مكتملة",
    Active: "نشط",
    Potential: "محتمل",
    Contacted: "تم التواصل",
    Corniche: "الكورنيش",
    "North Obhur": "أبحر الشمالية",
    Both: "كلا الحرمين",
    High: "عالية",
    Medium: "متوسطة",
    Low: "منخفضة",
    EMU: "وحدة إدارة الفعاليات",
    "IT / AV": "تقنية المعلومات والصوتيات",
    Marketing: "التسويق",
    Facilities: "المرافق",
    PR: "العلاقات العامة",
    "Student Affairs": "شؤون الطلاب",
    "EMU Admin": "مدير النظام",
    "EMU Staff": "موظف الوحدة",
    Viewer: "مشاهد",
    WhatsApp: "واتساب",
    Call: "اتصال",
    Email: "بريد إلكتروني",
    Meeting: "اجتماع",
  };
  return lang === "ar" ? words[value] || value : value;
}
function icon(name) {
  const paths = {
    dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    events:
      "M8 3v4 M16 3v4 M3 10h18 M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2",
    calendar:
      "M8 3v4 M16 3v4 M3 10h18 M5 5h14v16H3V5z M7 14h3 M14 14h3 M7 17h3",
    requests: "M7 3h10l3 3v15H4V3z M8 9h8 M8 13h8 M8 17h5",
    tasks: "M9 5h12 M9 12h12 M9 19h12 M3 5l1 1 2-3 M3 12l1 1 2-3 M3 19l1 1 2-3",
    partners:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 4a4 4 0 0 1 0 7 M22 21v-2a4 4 0 0 0-3-4",
    reports: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
    access: "M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7z M8 12l3 3 5-6",
    log: "M3 12a9 9 0 1 0 3-7 M3 3v5h5 M12 7v5l3 2",
    spark: "M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z",
    plus: "M12 5v14 M5 12h14",
    arrow: "M5 12h14 M14 7l5 5-5 5",
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.events}"/></svg>`;
}
function monthLabel() {
  return new Intl.DateTimeFormat(locale(), {
    month: "long",
    year: "numeric",
  }).format(new Date(calendarYear, calendarMonth, 1));
}
function setMonth(delta) {
  const date = new Date(calendarYear, calendarMonth + delta, 1);
  calendarYear = date.getFullYear();
  calendarMonth = date.getMonth();
  render(page);
  document.querySelector(`[data-month="${delta}"]`)?.focus();
}
function emuLogo(tone = "navy", extraClass = "") {
  const file = tone === "white" ? "EMU Logo.png" : "EMU Logo BLUE.png";
  return `<img class="emu-logo emu-logo--${tone} ${extraClass}" src="${esc(new URL(file, EMU_ASSET_BASE).href)}" width="2249" height="1140" alt="${L("Events Management Unit (EMU)", "وحدة إدارة الفعاليات (EMU)")}">`;
}
function printBranding() {
  return `<div class="print-branding">${emuLogo()}<div><b>${L("Events Management Unit", "وحدة إدارة الفعاليات")}</b><span>${L("University of Business and Technology", "جامعة الأعمال والتكنولوجيا")}</span></div><img src="ubt-logo.png" alt="UBT"></div>`;
}
function login() {
  return `<div class="login"><div class="login-card"><div class="brand-row"><img src="ubt-logo.png" alt="UBT">${emuLogo()}</div><span class="eyebrow">EMU · V14</span><h1>${L("Event Management System", "نظام إدارة الفعاليات")}</h1><p class="muted">${L("One connected workspace for exceptional university events.", "مساحة عمل موحدة لفعاليات جامعية استثنائية.")}</p><form id="loginForm">${field(L("University email", "البريد الجامعي"), "loginEmail", "", "email")}${selectField(L("Demo role", "دور العرض التجريبي"), "loginRole", ["EMU Admin", "EMU Staff", "Viewer"], "EMU Admin")}<p class="demo-note">${L("Demonstration access · no real authentication", "دخول تجريبي · دون مصادقة حقيقية")}</p><button class="btn primary" id="signIn" type="submit">${L("Enter workspace", "الدخول إلى مساحة العمل")}${icon("arrow")}</button></form><button class="btn secondary" id="loginLang">${lang === "ar" ? "English" : "العربية"}</button></div></div>`;
}
function shell() {
  return `<div class="shell"><aside class="sidebar" id="side" aria-label="${L("Main navigation", "التنقل الرئيسي")}"><button class="side-brand home-brand" id="emuHome" aria-label="${L("Dashboard", "لوحة التحكم")}">${emuLogo("white")}<div class="brand-system-title"><b>${L("Event Management System", "نظام إدارة الفعاليات")}</b><span>${L("University of Business and Technology", "جامعة الأعمال والتكنولوجيا")}</span></div></button><div class="nav-caption">${L("WORKSPACE", "مساحة العمل")}</div><nav class="nav">${nav
    .filter((n) => isAdmin() || n[0] !== "access")
    .map(
      (n) =>
        `<button data-page="${n[0]}" ${page === n[0] ? 'aria-current="page"' : ""}>${icon(n[0])}<span>${L(n[1], n[2])}</span></button>`,
    )
    .join(
      "",
    )}</nav><div class="sidebar-footer"><span class="live-dot"></span>${L("EMU workspace", "مساحة عمل الوحدة")}<small>V14 · ${L("Development", "نسخة التطوير")}</small></div></aside><button class="nav-backdrop" id="navBackdrop" aria-label="${L("Close navigation", "إغلاق القائمة")}" hidden></button><main class="main"><header class="topbar"><div class="top-actions"><button class="btn secondary mobile-menu" id="menuBtn" aria-label="${L("Open navigation", "فتح القائمة")}" aria-controls="side" aria-expanded="false">☰</button><img src="ubt-logo.png" alt="UBT"><span class="topbar-divider"></span><span class="header-emu-brand">${emuLogo()}</span></div><div class="top-actions"><button class="btn secondary" id="langBtn" lang="${lang === "ar" ? "en" : "ar"}">${lang === "ar" ? "English" : "العربية"}</button><span class="user-label"><span class="avatar">EMU</span><b id="roleLabel">${esc(tr(role()))}</b></span><button class="btn secondary" id="logout">${L("Logout", "خروج")}</button></div></header><div class="content" id="content" tabindex="-1"></div><footer class="workspace-footer">EMU · ${L("University of Business and Technology", "جامعة الأعمال والتكنولوجيا")}<span>V14</span></footer></main></div>`;
}
function head(title, sub, actions = "") {
  return `<div class="page-head"><div><div class="eyebrow">${L("EMU WORKSPACE", "وحدة إدارة الفعاليات")} <span> / V14</span></div><h1>${title}</h1><div class="muted">${sub}</div></div><div class="actions">${actions}</div></div>`;
}
function kpi(action, title, num, sub) {
  const map = {
    today: "calendar",
    week: "calendar",
    upcoming: "events",
    requests: "requests",
    approvals: "access",
    tbd: "calendar",
    taskPending: "tasks",
    approvalPending: "access",
    done: "tasks",
    pall: "partners",
    pactive: "partners",
    ppotential: "partners",
    pfollow: "log",
    r1: "events",
    r2: "events",
    r3: "reports",
    r4: "partners",
  };
  return `<button class="card kpi" data-kpi="${action}" type="button"><span class="kpi-top"><span>${title}</span><span class="kpi-icon">${icon(map[action])}</span></span><b>${num}</b><span class="kpi-sub">${sub}${icon("arrow")}</span></button>`;
}
function eventRow(e) {
  const date = validDate(e.date) ? new Date(e.date + "T12:00:00") : null;
  return `<div class="event-item"><div class="datebox"><b>${date ? new Intl.DateTimeFormat(locale(), { day: "numeric" }).format(date) : "—"}</b><span>${date ? new Intl.DateTimeFormat(locale(), { month: "short" }).format(date) : tr("TBD")}</span></div><div class="copy"><b dir="auto">${esc(eventName(e))}</b><span>${esc(tr(e.campus))} · ${esc(orgName(e))}${e.time ? " · <bdi>" + esc(e.time) + "</bdi>" : ""}</span></div><div>${pill(e.status)}</div><div class="prog"><span class="mini">${e.progress}% ${L("ready", "جاهزية")}</span><div class="progress" role="meter" aria-label="${L("Readiness", "الجاهزية")}" aria-valuenow="${e.progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${e.progress}%"></i></div></div><button class="btn secondary" data-open-event="${e.id}" aria-label="${esc(L("Open ", "فتح ") + eventName(e))}">${L("Open", "فتح")}</button></div>`;
}
function dashboard() {
  const today = todayISO(),
    up = filteredUpcoming(),
    next = state.events
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
  const pendingTasks = state.tasks.filter((t) => t.status !== "Done"),
    pendingAp = state.approvals.filter((a) => a.status === "Pending"),
    pendingReq = state.requests.filter((r) => r.status === "Pending");
  const overdue = pendingTasks.filter((t) => t.due && t.due < today),
    ready = Math.round(
      state.events.reduce((n, e) => n + e.progress, 0) /
        Math.max(1, state.events.length),
    );
  const days = next
    ? Math.max(
        0,
        Math.round((Date.parse(next.date) - Date.parse(today)) / 86400000),
      )
    : 0;
  const attention = [
    ...overdue.slice(0, 2).map((t) => ({
      title: translated(t, "title"),
      sub: tr(t.dept) + " · " + fmt(t.due),
      target: "tasks",
    })),
    ...pendingAp.slice(0, 2).map((a) => ({
      title: L("Approval awaiting review", "موافقة بانتظار المراجعة"),
      sub: tr(a.dept) + " · " + eventName(byId(a.eventId)),
      target: "tasks",
    })),
  ];
  return (
    head(
      L("Control Center", "مركز التحكم"),
      L(
        "A clear view of every event. A confident next step.",
        "رؤية واضحة لكل فعالية، وخطوة واثقة نحو إنجازها.",
      ),
      `<span class="date-chip">${icon("calendar")}${fmt(today)}</span>${canEdit() ? `<button class="btn primary" id="quickEvent">${icon("plus")}${L("New Event", "فعالية جديدة")}</button>` : ""}`,
    ) +
    `<div class="hero"><div><span class="hero-emu-brand">${emuLogo("white")}</span><small>${L("UP NEXT · UNIVERSITY EVENTS", "قريبًا · فعاليات الجامعة")}</small><h2 dir="auto">${next ? esc(eventName(next)) : L("Your next great event starts here", "فعاليتكم القادمة تبدأ من هنا")}</h2><p>${next ? `${fmt(next.date)} · ${esc(tr(next.campus))} · ${esc(orgName(next))}` : L("Plan, coordinate and deliver in one workspace.", "خطط ونسّق وأنجز من مساحة عمل واحدة.")}</p></div><div class="count"><b>${next ? days : "—"}</b><span>${L("days to go", "أيام متبقية")}</span></div>${next ? `<button class="btn secondary" data-open-event="${next.id}">${L("View event", "عرض الفعالية")}${icon("arrow")}</button>` : ""}</div>` +
    `<div class="grid kpis">${kpi("today", L("Today's Events", "فعاليات اليوم"), state.events.filter((e) => e.date === today).length, L("Explore today", "استعرض اليوم"))}${kpi("week", L("This Week", "هذا الأسبوع"), state.events.filter((e) => e.date >= weekRange()[0] && e.date <= weekRange()[1]).length, L("Weekly agenda", "جدول الأسبوع"))}${kpi("upcoming", L("Upcoming", "القادمة"), state.events.filter((e) => e.date && e.date >= today).length, L("On the horizon", "على جدول الجامعة"))}${kpi("requests", L("Pending Requests", "طلبات معلقة"), pendingReq.length, L("Review requests", "مراجعة الطلبات"))}${kpi("approvals", L("Pending Approvals", "موافقات معلقة"), pendingAp.length, L("Review decisions", "مراجعة القرارات"))}${kpi("tbd", L("To Schedule", "بانتظار الجدولة"), state.events.filter((e) => !e.date).length, L("Set a date", "تحديد الموعد"))}</div>` +
    `<section class="intelligence card"><div class="intelligence-icon">${icon("spark")}</div><div><span class="eyebrow">${L("EMU INTELLIGENCE", "رؤى وحدة إدارة الفعاليات")}</span><h3>${L("Your operational briefing", "موجزك التنفيذي")}</h3><p>${L(`${pendingTasks.length} open tasks, ${overdue.length} overdue, and ${pendingAp.length} approvals awaiting a decision. Average event readiness is ${ready}%.`, `${pendingTasks.length} مهام مفتوحة، منها ${overdue.length} متأخرة، و${pendingAp.length} موافقات بانتظار القرار. متوسط جاهزية الفعاليات ${ready}٪.`)}</p><small>${L("Calculated from local records · no AI service", "محسوب من السجلات المحلية · دون خدمة ذكاء اصطناعي")}</small></div><button class="btn secondary" data-page="tasks">${L("Review priorities", "مراجعة الأولويات")}</button></section>` +
    `<div class="grid dash-grid"><section class="card"><div class="section-title"><div><span class="eyebrow">${L("EVENT TIMELINE", "مسار الفعاليات")}</span><h3>${L("Upcoming Events", "الفعاليات القادمة")}</h3></div><button class="btn secondary" data-page="events">${L("View All", "عرض الكل")}</button></div><div class="tabs">${[
      ["all", "All", "الكل"],
      ["today", "Today", "اليوم"],
      ["week", "This Week", "هذا الأسبوع"],
      ["month", "This Month", "هذا الشهر"],
      ["corniche", "Corniche", "الكورنيش"],
      ["north", "North Obhur", "أبحر الشمالية"],
    ]
      .map(
        (x) =>
          `<button data-dash-filter="${x[0]}" aria-pressed="${dashFilter === x[0]}" class="${dashFilter === x[0] ? "active" : ""}">${L(x[1], x[2])}</button>`,
      )
      .join(
        "",
      )}</div><div class="event-list">${up.length ? up.slice(0, 8).map(eventRow).join("") : `<div class="empty">${icon("calendar")}${L("No events match this filter.", "لا توجد فعاليات مطابقة للفلتر.")}</div>`}</div></section><section class="card attention-card"><div class="section-title"><h3>${L("Needs Attention", "يحتاج متابعة")}</h3><span class="number-badge">${attention.length}</span></div><div class="attention">${attention.map((a) => `<button class="alert" data-page="${a.target}"><b dir="auto">${esc(a.title)}</b><span dir="auto">${esc(a.sub)}</span></button>`).join("") || `<div class="empty">${L("All caught up", "لا توجد عناصر معلقة")}</div>`}</div><button class="btn secondary full-width" data-page="tasks">${L("Open Tasks & Approvals", "فتح المهام والموافقات")}</button><div class="quick-actions"><span class="eyebrow">${L("QUICK ACTIONS", "إجراءات سريعة")}</span>${canEdit() ? `<button class="btn secondary" id="quickRequest">${icon("requests")}${L("New request", "طلب جديد")}</button>` : ""}<button class="btn secondary" data-page="calendar">${icon("calendar")}${L("Open calendar", "فتح التقويم")}</button></div></section></div>` +
    `<div class="grid dash-grid dashboard-bottom"><section class="card"><div class="section-title"><h3>${L("Event Readiness", "جاهزية الفعاليات")}</h3><button class="btn secondary" data-page="reports">${L("Full report", "التقرير الكامل")}</button></div>${readinessChart()}<div class="readiness-list">${state.events
      .filter((e) => e.date >= today)
      .slice(0, 4)
      .map(
        (e) =>
          `<button data-open-event="${e.id}" class="readiness-row"><b dir="auto">${esc(eventName(e))}</b><span>${e.progress}%</span><div class="progress"><i style="width:${e.progress}%"></i></div></button>`,
      )
      .join(
        "",
      )}</div></section><section class="card"><div class="section-title"><h3>${L("Calendar", "التقويم")}</h3><button class="btn secondary" data-page="calendar">${L("Full calendar", "التقويم الكامل")}</button></div>${calendarHTML()}</section></div>`
  );
}
function readinessChart() {
  const average = Math.round(
    state.events.reduce((n, e) => n + e.progress, 0) /
      Math.max(1, state.events.length),
  );
  return `<button class="readiness-chart" data-page="reports" aria-label="${L("Average readiness", "متوسط الجاهزية")} ${average}%"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="48" class="ring-track"/><circle cx="60" cy="60" r="48" class="ring-value" stroke-dasharray="${average * 3.016} 301.6"/></svg><span><b>${average}%</b><small>${L("Overall readiness", "الجاهزية الإجمالية")}</small></span></button>`;
}
function calendarHTML() {
  const first = new Date(calendarYear, calendarMonth, 1).getDay(),
    days = new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    prefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`;
  let cells = [];
  for (let i = 0; i < first; i++)
    cells.push('<div class="calendar-blank"></div>');
  for (let d = 1; d <= days; d++) {
    const ds = prefix + "-" + String(d).padStart(2, "0"),
      events = state.events.filter((e) => e.date === ds);
    cells.push(
      `<div class="day ${ds === todayISO() ? "today" : ""}"><b>${d}</b>${events.map((e) => `<button class="dot" data-open-event="${e.id}" title="${esc(eventName(e))}" aria-label="${esc(eventName(e) + " · " + fmt(ds))}" dir="auto">${esc(eventName(e))}</button>`).join("")}</div>`,
    );
  }
  const events = state.events
    .filter((e) => e.date?.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
  return `<div class="calendar-toolbar"><button class="btn secondary" data-month="-1" aria-label="${L("Previous month", "الشهر السابق")}">${lang === "ar" ? "→" : "←"}</button><h3 aria-live="polite">${monthLabel()}</h3><button class="btn secondary" data-month="1" aria-label="${L("Next month", "الشهر التالي")}">${lang === "ar" ? "←" : "→"}</button><button class="btn secondary" data-calendar-today>${L("Today", "اليوم")}</button></div><div class="calendar">${Array.from({ length: 7 }, (_, i) => `<div class="cal-head">${new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(new Date(2026, 0, 4 + i))}</div>`).join("")}${cells.join("")}</div><div class="mobile-agenda"><span class="eyebrow">${L("MONTHLY AGENDA", "جدول الشهر")}</span>${events.map((e) => `<button class="agenda-item" data-open-event="${e.id}"><span>${fmt(e.date)}</span><b dir="auto">${esc(eventName(e))}</b>${pill(e.status)}</button>`).join("") || `<div class="empty">${L("No events scheduled this month.", "لا توجد فعاليات مجدولة هذا الشهر.")}</div>`}</div>`;
}
function field(label, id, value = "", type = "text", span = "") {
  return `<div class="field ${span}"><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}" ${["date", "time", "email", "number", "tel"].includes(type) ? 'dir="ltr"' : 'dir="auto"'}></div>`;
}
function selectField(label, id, opts, value, span = "") {
  return `<div class="field ${span}"><label for="${id}">${label}</label><select id="${id}">${opts.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${esc(tr(o))}</option>`).join("")}</select></div>`;
}
function openModal(title, body) {
  const modal = $("#modal");
  if (modal.classList.contains("hidden")) {
    modalOpener = document.activeElement;
    modalOpenerId = modalOpener?.id;
    modalOpenerPage = modalOpener?.getAttribute("data-page");
  }
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML =
    `<form id="modalForm" novalidate><p class="modal-kicker">${L("EVENT MANAGEMENT UNIT", "وحدة إدارة الفعاليات")}</p><div id="formErrors" role="alert" tabindex="-1" hidden></div>${body}</form>`;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  $("#app").inert = true;
  $("#closeModal").setAttribute(
    "aria-label",
    L("Close dialog", "إغلاق النافذة"),
  );
  decorate($("#modalBody"));
  $("#modalForm").onsubmit = (e) => {
    e.preventDefault();
    $("#modalBody .btn.primary")?.click();
  };
  $("#modalBody")
    .querySelectorAll("button")
    .forEach((b) => (b.type = "button"));
  document.querySelector(".modal-card").scrollTop = 0;
  document.querySelector(".modal-card").focus();
}
function closeModal() {
  if ($("#modal").classList.contains("hidden")) return;
  $("#modal").classList.add("hidden");
  $("#app").inert = false;
  document.body.classList.remove("modal-open");
  const target = modalOpener?.isConnected
    ? modalOpener
    : (modalOpenerId ? document.getElementById(modalOpenerId) : null) ||
      document.querySelector(`.nav [data-page="${modalOpenerPage || page}"]`) ||
      $("#content");
  target?.focus();
}
function showErrors(errors) {
  const el = $("#formErrors");
  el.hidden = false;
  el.innerHTML =
    "<b>" +
    L("Please review the following:", "يرجى مراجعة ما يلي:") +
    "</b><ul>" +
    errors.map((e) => "<li>" + esc(e) + "</li>").join("") +
    "</ul>";
  el.focus();
}
function validateModal(kind) {
  const errors = [],
    value = (id) => document.getElementById(id)?.value.trim() || "";
  const required = (id, label) => {
    if (!value(id))
      errors.push(L(label + " is required.", "حقل " + label + " مطلوب."));
  };
  const pair = (a, b) => {
    if (!value(a) && !value(b))
      errors.push(
        L(
          "Enter a title in at least one language.",
          "أدخل عنوانًا بلغة واحدة على الأقل.",
        ),
      );
  };
  if (kind === "event") {
    pair("ee", "ea");
    if (!value("ed") && value("es") !== "TBD")
      errors.push(
        L(
          "Choose a date, or use the TBD status.",
          "حدد تاريخًا، أو اختر حالة يحدد لاحقًا.",
        ),
      );
    const n = Number(value("ep"));
    if (!value("ep") || !Number.isFinite(n) || n < 0 || n > 100)
      errors.push(
        L(
          "Readiness must be between 0 and 100.",
          "يجب أن تكون الجاهزية بين 0 و100.",
        ),
      );
  }
  if (kind === "request") {
    pair("re", "ra");
    required("rid", L("Request ID", "رقم الطلب"));
    required("rr", L("Requester", "مقدم الطلب"));
    required("rd", L("Event date", "تاريخ الفعالية"));
    if (
      state.requests.some((r) => r.id === value("rid") && r !== activeRequest)
    )
      errors.push(L("Request ID already exists.", "رقم الطلب مستخدم مسبقًا."));
  }
  if (kind === "task") {
    pair("te", "ta");
    required("tdu", L("Due date", "تاريخ الاستحقاق"));
    if (!state.events.some((e) => String(e.id) === value("tev")))
      errors.push(L("Select an existing event.", "اختر فعالية موجودة."));
  }
  if (kind === "partner") {
    required("pn", L("Partner name", "اسم الجهة"));
    if (
      !["", "Active", "Potential", "Inactive", "On Hold"].includes(value("ps"))
    )
      errors.push(
        L("Choose a valid relationship status.", "اختر حالة علاقة صحيحة."),
      );
    if (
      ![
        "",
        "Not Contacted",
        "Contacted",
        "Negotiating",
        "Confirmed",
        "Declined",
      ].includes(value("psponsor"))
    )
      errors.push(
        L("Choose a valid sponsorship status.", "اختر حالة رعاية صحيحة."),
      );
  }
  if (kind === "follow") {
    required("fd", L("Date", "التاريخ"));
    required("fn", L("Follow-up note", "ملاحظة المتابعة"));
  }
  for (const input of $("#modalForm").querySelectorAll(
    "input,select,textarea",
  )) {
    input.setCustomValidity("");
    if (input.type === "date" && input.value && !validDate(input.value))
      errors.push(L("Enter a valid date.", "أدخل تاريخًا صحيحًا."));
    if (!input.checkValidity())
      errors.push(
        input.type === "email"
          ? L("Enter a valid email address.", "أدخل بريدًا إلكترونيًا صحيحًا.")
          : L("Check the highlighted field.", "تحقق من قيمة الحقل."),
      );
  }
  if (errors.length) {
    showErrors([...new Set(errors)]);
    return false;
  }
  $("#formErrors").hidden = true;
  return true;
}
function bindSave(id, kind, handler) {
  const b = document.getElementById(id);
  if (!b) return;
  b.onclick = () => {
    if (!storageCurrent()) return;
    if (!canEdit()) {
      deny();
      return;
    }
    if (!validateModal(kind)) return;
    handler();
  };
}
function eventModal(id) {
  const e = id ? byId(id) : null;
  if (id && !e) return;
  if (!e && !canEdit()) {
    deny();
    return;
  }
  const editing = canEdit();
  openModal(
    e ? L("Event Details", "تفاصيل الفعالية") : L("New Event", "فعالية جديدة"),
    `<div class="form-section-title">${icon("events")}<div><b>${L("Event essentials", "بيانات الفعالية")}</b><small>${L("Keep official names exactly as provided.", "احتفظ بالأسماء الرسمية كما وردت في المصدر.")}</small></div>${!editing ? `<span class="pill">${L("Read only", "للعرض فقط")}</span>` : ""}</div><div class="form-grid">${field(L("Official primary title", "الاسم الرسمي الأساسي"), "ee", e?.titleEn || "")}${field(L("Official second-language title (optional)", "الاسم الرسمي باللغة الثانية (اختياري)"), "ea", e?.titleAr || "")}${field(L("Date", "التاريخ"), "ed", e?.date || "", "date")}${field(L("Time", "الوقت"), "et", e?.time || "", "time")}${selectField(L("Campus", "الحرم الجامعي"), "ec", ["Corniche", "North Obhur", "Both", "TBD"], e?.campus || "Corniche")}${selectField(L("Status", "الحالة"), "es", ["Confirmed", "Planned", "TBD"], e?.status || "Planned")}${field(L("Organizer (English)", "الجهة المنظمة بالإنجليزية"), "eo", e?.orgEn || "")}${field(L("Organizer (Arabic)", "الجهة المنظمة بالعربية"), "eoa", e?.orgAr || "")}${field(L("Readiness %", "الجاهزية ٪"), "ep", e?.progress ?? 0, "number")}</div><section class="partner-selector" aria-labelledby="partnerSelectorTitle"><div class="section-title"><div><h3 id="partnerSelectorTitle">${L("Linked Partners", "الشركاء المرتبطون")}</h3><p class="muted">${L("Bring the right partners into this event.", "اختر الجهات المشاركة في هذه الفعالية.")}</p></div><span id="selectedCount" class="selection-count" role="status"></span></div><label class="search-label" for="linkedPartnerSearch">${L("Search partners in Arabic or English", "ابحث عن الشركاء بالعربية أو الإنجليزية")}</label><input type="search" id="linkedPartnerSearch" placeholder="${L("Name, category or activity…", "الاسم أو التصنيف أو النشاط…")}"><div class="partner-options" id="partnerOptions"></div><div class="empty" id="partnerNoResults" hidden>${L("No matching partners. Try another search.", "لا توجد جهات مطابقة. جرّب بحثًا آخر.")}</div></section><div class="modal-actions">${e && editing ? `<button class="btn danger" id="deleteEvent">${L("Delete Event", "حذف الفعالية")}</button>` : ""}<button class="btn secondary" id="cancelEvent">${editing ? L("Cancel", "إلغاء") : L("Close", "إغلاق")}</button>${editing ? `<button class="btn primary" id="saveEvent">${L("Save Event", "حفظ الفعالية")}</button>` : ""}</div>`,
  );
  $("#ee").setAttribute("aria-describedby", "eventTitleHint");
  $("#ea").setAttribute("aria-describedby", "eventTitleHint");
  document.querySelector(".form-section-title small").id = "eventTitleHint";
  $("#ep").min = 0;
  $("#ep").max = 100;
  const selected = new Set(e?.partners || []);
  $("#partnerOptions").innerHTML = state.partners
    .map(
      (p) =>
        `<label class="partner-option ${selected.has(p.id) ? "selected" : ""}"><input type="checkbox" data-partner-check="${p.id}" ${selected.has(p.id) ? "checked" : ""} ${!editing ? "disabled" : ""}><span class="partner-option-copy"><b dir="auto">${esc(partnerName(p))}</b><small dir="auto">${esc(translated(p, "cat"))} · ${esc(translated(p, "act"))}</small></span><span class="partner-checkmark" aria-hidden="true">✓</span></label>`,
    )
    .join("");
  const count = () => {
    $("#selectedCount").textContent = L(
      `${selected.size} selected`,
      `${selected.size} جهات محددة`,
    );
  };
  count();
  $("#partnerOptions").onchange = (ev) => {
    const cb = ev.target;
    if (!editing || !cb.matches("[data-partner-check]")) return;
    const id = +cb.dataset.partnerCheck;
    cb.checked ? selected.add(id) : selected.delete(id);
    cb.closest("label").classList.toggle("selected", cb.checked);
    count();
  };
  $("#linkedPartnerSearch").oninput = (ev) => {
    const q = normalizeSearch(ev.target.value);
    let visible = 0;
    $("#partnerOptions")
      .querySelectorAll("label")
      .forEach((label, i) => {
        const p = state.partners[i];
        const match = normalizeSearch(
          [p.name, p.catEn, p.catAr, p.actEn, p.actAr].join(" "),
        ).includes(q);
        label.hidden = !match;
        if (match) visible++;
      });
    $("#partnerNoResults").hidden = visible > 0;
  };
  if (!editing)
    $("#modalForm")
      .querySelectorAll(".form-grid input,.form-grid select")
      .forEach((input) => (input.disabled = true));
  $("#cancelEvent").onclick = closeModal;
  bindSave("saveEvent", "event", () => {
    const obj = {
      id: e?.id || newId(),
      titleEn: $("#ee").value.trim(),
      titleAr: $("#ea").value.trim(),
      date: $("#ed").value,
      time: $("#et").value,
      campus: $("#ec").value,
      status: $("#es").value,
      orgEn: $("#eo").value.trim(),
      orgAr: $("#eoa").value.trim(),
      progress: Number($("#ep").value),
      partners: [...selected],
      tasks: state.tasks.filter((t) => t.eventId === e?.id).map((t) => t.id),
    };
    if (e) Object.assign(e, obj);
    else state.events.push(obj);
    addLog((e ? "Updated event: " : "Created event: ") + eventName(obj));
    save();
    closeModal();
    render(page);
    restoreFocus();
    toast(L("Event saved", "تم حفظ الفعالية"));
  });
  if ($("#deleteEvent"))
    $("#deleteEvent").onclick = () => {
      if (!storageCurrent()) return;
      if (!canEdit()) {
        deny();
        return;
      }
      if (
        !window.confirm(
          L(
            "Delete this event and its linked tasks and approvals? This cannot be undone.",
            "هل تريد حذف هذه الفعالية ومهامها وموافقاتها؟ لا يمكن التراجع عن هذا الإجراء.",
          ),
        )
      )
        return;
      state.events = state.events.filter((x) => x.id !== e.id);
      state.tasks = state.tasks.filter((x) => x.eventId !== e.id);
      state.approvals = state.approvals.filter((x) => x.eventId !== e.id);
      state.requests.forEach((r) => {
        if (r.eventId === e.id) r.eventId = null;
      });
      addLog("Deleted event: " + eventName(e));
      save();
      closeModal();
      render("events");
      restoreFocus();
      toast(L("Event deleted", "تم حذف الفعالية"));
    };
}
function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .trim();
}
function newId() {
  let id = Date.now();
  const ids = new Set(
    [
      ...state.events,
      ...state.tasks,
      ...state.approvals,
      ...state.partners,
    ].map((x) => x.id),
  );
  while (ids.has(id)) id++;
  return id;
}
function restoreFocus() {
  (modalOpenerId ? document.getElementById(modalOpenerId) : null)?.focus();
  if (document.activeElement === document.body)
    document.querySelector(`.nav [data-page="${page}"]`)?.focus();
}
function requestModal(id) {
  if (!canEdit()) {
    deny();
    return;
  }
  const r = state.requests.find((x) => x.id === id);
  activeRequest = r;
  const linked =
    r &&
    (state.events.find((e) => e.id === r.eventId) ||
      state.events.find((e) => e.sourceRequestId === r.id));
  openModal(
    L("Event Request", "طلب فعالية"),
    `<div class="form-grid">${field(L("Request ID", "رقم الطلب"), "rid", r?.id || "ER-" + todayISO().slice(0, 4) + "-" + newId())}${field(L("Requester", "مقدم الطلب"), "rr", r?.requester || "")}${field(L("Official primary title", "الاسم الرسمي الأساسي"), "re", r?.titleEn || "")}${field(L("Official second-language title (optional)", "الاسم الرسمي باللغة الثانية (اختياري)"), "ra", r?.titleAr || "")}${field(L("Event date", "تاريخ الفعالية"), "rd", r?.date || "", "date")}${selectField(L("Campus", "الحرم الجامعي"), "rc", ["Corniche", "North Obhur", "Both"], r?.campus || "Corniche")}${selectField(L("Status", "الحالة"), "rs", ["Pending", "Approved", "Conditional", "Declined"], r?.status || "Pending")}</div>${linked ? `<p class="inline-notice">${L("Already linked to an event.", "هذا الطلب مرتبط بفعالية بالفعل.")}</p>` : ""}<div class="modal-actions"><button class="btn secondary" id="rqCancel">${L("Cancel", "إلغاء")}</button>${r ? `<button class="btn secondary" id="convertReq">${linked ? L("Open linked event", "فتح الفعالية المرتبطة") : L("Convert to Event", "تحويل إلى فعالية")}</button>` : ""}<button class="btn primary" id="rqSave">${L("Save", "حفظ")}</button></div>`,
  );
  if (r) $("#rid").readOnly = true;
  $("#rqCancel").onclick = closeModal;
  const values = () => ({
    id: $("#rid").value.trim(),
    requester: $("#rr").value.trim(),
    titleEn: $("#re").value.trim(),
    titleAr: $("#ra").value.trim(),
    date: $("#rd").value,
    campus: $("#rc").value,
    status: $("#rs").value,
    submitted: r?.submitted || todayISO(),
  });
  bindSave("rqSave", "request", () => {
    const obj = values();
    if (r) Object.assign(r, obj);
    else state.requests.unshift(obj);
    addLog((r ? "Updated request: " : "Created request: ") + obj.id);
    save();
    closeModal();
    render("requests");
    restoreFocus();
    toast(L("Request saved", "تم حفظ الطلب"));
  });
  if (r)
    $("#convertReq").onclick = () => {
      if (!storageCurrent()) return;
      if (!canEdit()) {
        deny();
        return;
      }
      const existing = state.events.find(
        (e) => e.id === r.eventId || e.sourceRequestId === r.id,
      );
      if (existing) {
        eventModal(existing.id);
        return;
      }
      if (!validateModal("request")) return;
      const obj = values();
      if (!["Approved", "Conditional"].includes(obj.status)) {
        showErrors([
          L(
            "Approve or conditionally approve the request first.",
            "اعتمد الطلب أو اعتمده بشروط أولًا.",
          ),
        ]);
        return;
      }
      Object.assign(r, obj);
      const event = {
        id: newId(),
        sourceRequestId: r.id,
        titleEn: r.titleEn,
        titleAr: r.titleAr,
        date: r.date,
        time: "",
        campus: r.campus,
        orgEn: r.requester,
        orgAr: r.requester,
        status: "Planned",
        progress: 10,
        partners: [],
        tasks: [],
      };
      state.events.push(event);
      r.eventId = event.id;
      addLog("Converted request to event: " + r.id);
      save();
      closeModal();
      render("events");
      restoreFocus();
      toast(L("Event created from request", "تم إنشاء فعالية من الطلب"));
    };
}
function decorate(root) {
  root.querySelectorAll("option").forEach((o) => {
    const value = o.value;
    o.value = value;
    if (o.textContent === value) o.textContent = tr(value);
  });
  root.querySelectorAll(".field").forEach((field, i) => {
    const label = field.querySelector("label"),
      input = field.querySelector("input:not([type=checkbox]),select,textarea");
    if (label && input) {
      if (!input.id) input.id = "field-" + page + "-" + i;
      label.htmlFor = input.id;
    }
    if (
      input &&
      ["email", "tel", "date", "time", "number"].includes(input.type)
    )
      input.dir = "ltr";
  });
  root.querySelectorAll("textarea").forEach((e) => (e.dir = "auto"));
  root.querySelectorAll("table").forEach((table) => {
    const headers = [...table.querySelectorAll("thead th")];
    headers.forEach((h) => {
      h.scope = "col";
      if (h.textContent === "ID") h.textContent = L("ID", "الرقم");
    });
    table.querySelectorAll("tbody tr").forEach((row) => {
      [...row.children].forEach((cell, i) => {
        cell.dataset.label = headers[i]?.textContent || "";
        cell.dir = "auto";
      });
      if (row.matches("[data-id]")) {
        row.tabIndex = 0;
        row.setAttribute("role", "button");
        row.setAttribute(
          "aria-label",
          L("Open record: ", "فتح السجل: ") +
            row.innerText.trim().replace(/\s+/g, " "),
        );
        row.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            row.click();
          }
        };
      }
    });
    if (!table.querySelector("tbody tr")) {
      const row = table.querySelector("tbody").insertRow();
      const cell = row.insertCell();
      cell.colSpan = headers.length;
      cell.className = "empty";
      cell.textContent = L(
        "No records match. Try another search or filter.",
        "لا توجد سجلات مطابقة. جرّب بحثًا أو فلترًا آخر.",
      );
    }
  });
  const labels = {
    eventSearch: L("Search events", "بحث الفعاليات"),
    eventStatus: L("Filter by status", "فلترة حسب الحالة"),
    eventCampus: L("Filter by campus", "فلترة حسب الحرم"),
    partnerSearch: L("Search partners", "بحث الشركاء"),
    partnerStatus: L("Filter relationships", "فلترة العلاقات"),
  };
  for (const [id, label] of Object.entries(labels))
    root.querySelector("#" + id)?.setAttribute("aria-label", label);
  root
    .querySelectorAll(".profile-grid h3")
    .forEach((h) => (h.textContent = tr(h.textContent)));
  root.querySelectorAll(".bar").forEach((bar) => {
    bar.tabIndex = 0;
    bar.setAttribute("aria-label", bar.innerText.replace(/\s+/g, " "));
    bar.title = bar.getAttribute("aria-label");
  });
}
function render(p = page) {
  const active = document.activeElement,
    focusId = active?.id,
    selection =
      active && "selectionStart" in active
        ? [active.selectionStart, active.selectionEnd]
        : null;
  page = p;
  const content = $("#content");
  if (!content) return;
  const map = {
    dashboard,
    events: eventsPage,
    calendar: calendarPage,
    requests: requestsPage,
    tasks: tasksPage,
    partners: partnersPage,
    reports: reportsPage,
    access: accessPage,
    log: logPage,
  };
  content.innerHTML = printBranding() + (map[page] || dashboard)();
  document.querySelectorAll(".nav button").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === page);
    if (b.dataset.page === page) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  wirePage();
  decorate(content);
  if (focusId && document.getElementById(focusId)) {
    const target = document.getElementById(focusId);
    target.focus();
    if (selection && typeof selection[0] === "number")
      try {
        target.setSelectionRange(...selection);
      } catch {}
  } else if (
    active &&
    !active.isConnected &&
    $("#modal").classList.contains("hidden")
  )
    restoreFocus();
}
function wirePage() {
  document.querySelectorAll("[data-page]").forEach(
    (b) =>
      (b.onclick = () => {
        setNav(false);
        render(b.dataset.page);
        $("#content")?.focus();
      }),
  );
  document.querySelectorAll("[data-open-event]").forEach(
    (b) =>
      (b.onclick = (ev) => {
        ev.stopPropagation();
        if (b.dataset.openEvent) eventModal(+b.dataset.openEvent);
      }),
  );
  document.querySelectorAll("[data-dash-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        dashFilter = b.dataset.dashFilter;
        render("dashboard");
        document.querySelector(`[data-dash-filter="${dashFilter}"]`)?.focus();
      }),
  );
  document
    .querySelectorAll("[data-kpi]")
    .forEach((b) => (b.onclick = () => navigateKpi(b.dataset.kpi)));
  for (const id of ["quickEvent", "addEvent", "calAdd"])
    if (document.getElementById(id))
      document.getElementById(id).onclick = () => eventModal();
  if ($("#quickRequest")) $("#quickRequest").onclick = () => requestModal();
  if ($("#eventSearch"))
    $("#eventSearch").oninput = (e) => {
      window.eq = e.target.value;
      render("events");
    };
  if ($("#eventStatus")) {
    $("#eventStatus").value = window.est || "All";
    $("#eventStatus").onchange = (e) => {
      window.est = e.target.value;
      render("events");
    };
  }
  if ($("#eventCampus")) {
    $("#eventCampus").value = window.ecamp || "All";
    $("#eventCampus").onchange = (e) => {
      window.ecamp = e.target.value;
      render("events");
    };
  }
  if ($("#clearEventFilters"))
    $("#clearEventFilters").onclick = () => {
      window.eq = "";
      window.est = "All";
      window.ecamp = "All";
      window.eventMonthFilter = null;
      render("events");
    };
  if ($("#newReq")) $("#newReq").onclick = () => requestModal();
  document
    .querySelectorAll("[data-request]")
    .forEach((r) => (r.onclick = () => requestModal(r.dataset.request)));
  if ($("#addTask")) $("#addTask").onclick = () => taskModal();
  document
    .querySelectorAll("[data-task]")
    .forEach((r) => (r.onclick = () => taskModal(+r.dataset.task)));
  document
    .querySelectorAll("[data-approval]")
    .forEach((r) => (r.onclick = () => approvalModal(+r.dataset.approval)));
  document.querySelectorAll("[data-task-tab]").forEach((b) => {
    b.classList.toggle("active", b.dataset.taskTab === taskTab);
    b.setAttribute("aria-pressed", String(b.dataset.taskTab === taskTab));
    b.onclick = () => {
      taskTab = b.dataset.taskTab;
      taskFilter = "all";
      render("tasks");
    };
  });
  if ($("#taskArea")) {
    $("#taskArea").innerHTML =
      `<div class="task-filters"><label for="taskFilter">${L("Show", "عرض")}</label><select id="taskFilter"><option value="all">${L("All records", "جميع السجلات")}</option><option value="pending">${L("Open / pending", "مفتوحة / معلقة")}</option><option value="done">${L("Completed / approved", "مكتملة / معتمدة")}</option></select></div>` +
      (taskTab === "approvals" ? approvalsTable() : tasksTable());
    $("#taskFilter").value = taskFilter;
    $("#taskFilter").onchange = (e) => {
      taskFilter = e.target.value;
      render("tasks");
    };
    document
      .querySelectorAll("[data-task]")
      .forEach((r) => (r.onclick = () => taskModal(+r.dataset.task)));
    document
      .querySelectorAll("[data-approval]")
      .forEach((r) => (r.onclick = () => approvalModal(+r.dataset.approval)));
  }
  if ($("#addPartner")) $("#addPartner").onclick = () => partnerModal();
  document
    .querySelectorAll("[data-partner]")
    .forEach((r) => (r.onclick = () => partnerModal(+r.dataset.partner)));
  if ($("#partnerSearch"))
    $("#partnerSearch").oninput = (e) => {
      window.pq = e.target.value;
      render("partners");
    };
  if ($("#partnerStatus")) {
    $("#partnerStatus").value = window.pst || "All";
    $("#partnerStatus").onchange = (e) => {
      window.pst = e.target.value;
      window.followOnly = false;
      render("partners");
    };
  }
  if ($("#partnerSponsorStatus")) {
    $("#partnerSponsorStatus").value = window.partnerSponsorshipFilter || "All";
    $("#partnerSponsorStatus").onchange = (e) => {
      window.partnerSponsorshipFilter = e.target.value;
      render("partners");
    };
  }
  if ($("#exportPartners")) {
    $("#exportPartners").onclick = exportPartners;
    $("#exportPartners").textContent = L(
      "Export all contacts (CSV)",
      "تصدير جميع الجهات (CSV)",
    );
  }
  if ($("#printReport")) $("#printReport").onclick = () => window.print();
  document.querySelectorAll("[data-report-month]").forEach(
    (b) =>
      (b.onclick = () => {
        window.eq = "";
        window.est = "All";
        window.ecamp = "All";
        window.eventMonthFilter = b.dataset.reportMonth;
        render("events");
      }),
  );
  document
    .querySelectorAll("[data-month]")
    .forEach((b) => (b.onclick = () => setMonth(+b.dataset.month)));
  document.querySelectorAll("[data-calendar-today]").forEach(
    (b) =>
      (b.onclick = () => {
        const d = todayISO().split("-");
        calendarYear = +d[0];
        calendarMonth = +d[1] - 1;
        render(page);
      }),
  );
}
function navigateKpi(action) {
  if (["today", "week", "upcoming"].includes(action)) {
    dashFilter = action === "upcoming" ? "all" : action;
    render("dashboard");
    document
      .querySelector(".event-list")
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  if (action === "requests") {
    render("requests");
    return;
  }
  if (
    ["approvals", "approvalPending", "taskPending", "done"].includes(action)
  ) {
    taskTab = action.includes("pproval") ? "approvals" : "tasks";
    taskFilter = action === "done" ? "done" : "pending";
    render("tasks");
    return;
  }
  if (["tbd", "r1", "r2", "r3"].includes(action)) {
    window.eq = "";
    window.ecamp = "All";
    window.eventMonthFilter = null;
    window.est =
      action === "tbd" ? "TBD" : action === "r2" ? "Confirmed" : "All";
    render("events");
    return;
  }
  if (["pall", "pactive", "ppotential", "pfollow", "r4"].includes(action)) {
    window.pq = "";
    window.partnerSponsorshipFilter = "All";
    window.pst =
      action === "pactive"
        ? "Active"
        : action === "ppotential"
          ? "Potential"
          : "All";
    window.followOnly = action === "pfollow";
    render("partners");
  }
}
function setNav(open) {
  const side = $("#side");
  if (!side) return;
  side.classList.toggle("open", open);
  $("#menuBtn")?.setAttribute("aria-expanded", String(open));
  $("#navBackdrop").hidden = !open;
  if (matchMedia("(max-width:780px)").matches) {
    side.inert = !open;
    document.querySelector(".main").inert = open;
    document.body.classList.toggle("nav-open", open);
  } else {
    side.inert = false;
    document.querySelector(".main").inert = false;
  }
  if (open) side.querySelector("button")?.focus();
}
function init() {
  persistLang();
  $("#app").innerHTML =
    sessionStorage.getItem("emuLogin") === "1" ? shell() : login();
  if ($("#loginForm")) {
    $("#loginEmail").required = true;
    $("#loginForm").onsubmit = (e) => {
      e.preventDefault();
      if (!$("#loginForm").reportValidity()) return;
      const r = $("#loginRole").value;
      if (!["EMU Admin", "EMU Staff", "Viewer"].includes(r)) return;
      sessionStorage.setItem("emuLogin", "1");
      sessionStorage.setItem("emuRole", r);
      init();
    };
    $("#loginLang").onclick = () => {
      lang = lang === "ar" ? "en" : "ar";
      init();
      $("#loginLang").focus();
    };
    decorate($("#app"));
    showStorageNotice();
    return;
  }
  $("#langBtn").onclick = () => {
    lang = lang === "ar" ? "en" : "ar";
    init();
    $("#langBtn").focus();
  };
  $("#logout").onclick = () => {
    closeModal();
    sessionStorage.removeItem("emuLogin");
    sessionStorage.removeItem("emuRole");
    page = "dashboard";
    init();
  };
  $("#menuBtn").onclick = () => setNav(!$("#side").classList.contains("open"));
  $("#navBackdrop").onclick = () => {
    setNav(false);
    $("#menuBtn").focus();
  };
  $("#emuHome").onclick = () => {
    setNav(false);
    render("dashboard");
    $("#content").focus();
  };
  render(page);
  setNav(false);
  showStorageNotice();
}
function addLog(action) {
  state.log = state.log || [];
  state.log.unshift({ action, time: new Date().toISOString(), role: role() });
}
function logPage() {
  const prefixes = {
    "Updated event: ": ["Updated event: ", "تحديث فعالية: "],
    "Created event: ": ["Created event: ", "إنشاء فعالية: "],
    "Deleted event: ": ["Deleted event: ", "حذف فعالية: "],
    "Updated request: ": ["Updated request: ", "تحديث طلب: "],
    "Created request: ": ["Created request: ", "إنشاء طلب: "],
    "Converted request to event: ": [
      "Converted request to event: ",
      "تحويل طلب إلى فعالية: ",
    ],
    "Updated task: ": ["Updated task: ", "تحديث مهمة: "],
    "Created task: ": ["Created task: ", "إنشاء مهمة: "],
    "Updated partner: ": ["Updated partner: ", "تحديث جهة: "],
    "Added partner: ": ["Added partner: ", "إضافة جهة: "],
    "Partner follow-up: ": ["Partner follow-up: ", "متابعة جهة: "],
    "Updated approval: ": ["Updated approval: ", "تحديث موافقة: "],
  };
  return (
    head(
      L("Activity Log", "سجل العمليات"),
      L(
        "Local changes recorded in this browser.",
        "التغييرات المحلية المسجلة في هذا المتصفح.",
      ),
    ) +
    `<div class="card">${
      state.log?.length
        ? state.log
            .map((x) => {
              const prefix = Object.keys(prefixes).find((p) =>
                String(x.action).startsWith(p),
              );
              const detail = String(x.action).slice(prefix?.length || 0);
              const localizedDetail =
                prefix === "Updated approval: "
                  ? detail.split(" / ").map(tr).join(" / ")
                  : detail;
              const action = prefix
                ? L(...prefixes[prefix]) + localizedDetail
                : x.action;
              const date = new Date(x.time);
              return `<div class="timeline"><b dir="auto">${esc(action)}</b><span>${isNaN(date) ? esc(x.time) : new Intl.DateTimeFormat(locale(), { dateStyle: "medium", timeStyle: "short" }).format(date)}${x.role ? " · " + esc(tr(x.role)) : ""}</span></div>`;
            })
            .join("")
        : `<div class="empty">${L("Your actions will appear here.", "ستظهر العمليات التي تنفذها هنا.")}</div>`
    }</div>`
  );
}
function exportPartners() {
  const headers =
    lang === "ar"
      ? [
          "الجهة",
          "مسؤول التواصل",
          "التصنيف",
          "النشاط",
          "الهاتف",
          "البريد الإلكتروني",
          "المشاركة السابقة",
          "حالة العلاقة",
          "حالة الرعاية",
          "ملاحظات",
        ]
      : [
          "Partner",
          "Contact Person",
          "Category",
          "Activity",
          "Phone",
          "Email",
          "Previous Participation",
          "Relationship Status",
          "Sponsorship Status",
          "Notes",
        ];
  const rows = [
    headers,
    ...state.partners.map((p) => [
      p.name,
      p.contactPerson || "",
      translated(p, "cat"),
      translated(p, "act"),
      p.phone || "",
      p.email || "",
      p.previousParticipation,
      tr(partnerRelationship(p)),
      tr(partnerSponsorship(p)),
      p.notes,
    ]),
  ];
  const safe = (v) => {
    let text = String(v || "");
    if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const csv = "\uFEFF" + rows.map((r) => r.map(safe).join(",")).join("\r\n"),
    a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  a.download = "UBT_EMU_Partners.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function showStorageNotice() {
  const notice = $("#storageNotice");
  notice.hidden = !storageProblem && !storageConflict;
  if (notice.hidden) return;
  notice.innerHTML = `<div>${storageConflict ? `<p><b>${L("Data changed in another tab. Retry reading before making further changes.", "تغيرت البيانات في تبويب آخر. أعد القراءة قبل إجراء المزيد من التغييرات.")}</b></p>` : ""}<b>${L("Local storage needs attention", "التخزين المحلي يحتاج إلى مراجعة")}</b><p>${L("Stored data could not be read or saved. Original storage is untouched; this session uses temporary records. Export the original before replacing it.", "تعذرت قراءة البيانات أو حفظها. لم تُستبدل البيانات الأصلية؛ تستخدم الجلسة سجلات مؤقتة. صدّر الأصل قبل استبداله.")}</p></div><button class="btn secondary" id="downloadRecovery">${L("Export original data", "تصدير البيانات الأصلية")}</button><button class="btn secondary" id="retryStorage">${L("Retry reading", "إعادة القراءة")}</button><button class="btn danger" id="resetStorage">${L("Replace with current records", "استبدال بالسجلات الحالية")}</button>`;
  $("#downloadRecovery").onclick = () => {
    const raw = storage.get("emuV15");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([raw ?? ""], { type: "text/plain" }));
    a.download = "EMU-original-storage.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("#retryStorage").onclick = () => {
    storageProblem = false;
    storageConflict = false;
    state = loadState();
    persistedSnapshot = storage.get("emuV15");
    closeModal();
    init();
  };
  $("#resetStorage").onclick = () => {
    if (
      !confirm(
        L(
          "Replace stored data with the current temporary records? Export the original first.",
          "هل تريد استبدال البيانات المخزنة بالسجلات المؤقتة الحالية؟ صدّر الأصل أولًا.",
        ),
      )
    )
      return;
    storageProblem = false;
    storageConflict = false;
    persistedSnapshot = storage.get("emuV15");
    save();
    showStorageNotice();
  };
}

function storageCurrent() {
  if (storageProblem) return true;
  if (storage.get("emuV15") !== persistedSnapshot) {
    storageConflict = true;
    showStorageNotice();
    toast(
      L(
        "Read the latest records before saving.",
        "أعد قراءة أحدث السجلات قبل الحفظ.",
      ),
    );
    return false;
  }
  return true;
}

const nav = [
  ["dashboard", "Dashboard", "لوحة التحكم"],
  ["events", "All Events", "جميع الفعاليات"],
  ["calendar", "Events Calendar", "تقويم الفعاليات"],
  ["requests", "Event Requests", "طلبات الفعاليات"],
  ["tasks", "Tasks & Approvals", "المهام والموافقات"],
  ["partners", "Sponsors & Partners", "الرعاة والشركاء"],
  ["reports", "Reports & Insights", "التقارير والمؤشرات"],
  ["access", "Users & Access", "المستخدمون والصلاحيات"],
  ["log", "Activity Log", "سجل العمليات"],
];
let calendarYear = Number(todayISO().slice(0, 4)),
  calendarMonth = Number(todayISO().slice(5, 7)) - 1;
let modalOpener = null,
  modalOpenerId = null,
  modalOpenerPage = null,
  activeRequest = null,
  taskTab = "tasks",
  taskFilter = "all";
$("#closeModal").onclick = closeModal;
$("#modal").onclick = (e) => {
  if (e.target.id === "modal") closeModal();
};
$("#modal").addEventListener(
  "click",
  (e) => {
    const button = e.target.closest("button");
    const kinds = {
      tsv: "task",
      psave: "partner",
      fsav: "follow",
      asv: "approval",
    };
    if (button && kinds[button.id]) {
      if (!storageCurrent() || !canEdit() || !validateModal(kinds[button.id])) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!canEdit()) deny();
      }
    }
  },
  true,
);
document.addEventListener("keydown", (e) => {
  const modalOpen = !$("#modal").classList.contains("hidden");
  const navOpen =
    $("#side")?.classList.contains("open") &&
    matchMedia("(max-width:780px)").matches;
  if (e.key === "Escape") {
    if (modalOpen) {
      e.preventDefault();
      closeModal();
    } else if (navOpen) {
      setNav(false);
      $("#menuBtn").focus();
    }
    return;
  }
  if (e.key !== "Tab" || (!modalOpen && !navOpen)) return;
  const root = modalOpen ? $("#modal") : $("#side");
  const focusable = [
    ...root.querySelectorAll(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
    ),
  ].filter((el) => el.getClientRects().length && !el.closest("[hidden]"));
  const first = focusable[0],
    last = focusable.at(-1);
  if (!first) return;
  if (
    e.shiftKey &&
    (document.activeElement === first ||
      !focusable.includes(document.activeElement))
  ) {
    e.preventDefault();
    last.focus();
  } else if (
    !e.shiftKey &&
    (document.activeElement === last ||
      !focusable.includes(document.activeElement))
  ) {
    e.preventDefault();
    first.focus();
  }
});
matchMedia("(max-width:780px)").addEventListener("change", () => setNav(false));
if (!document.documentElement.hasAttribute("data-v15")) init();
