/* Final binding: reuse V14 brand/components and replace workflow entry points. */
const V15_NAV = [
  ["dashboard", "Dashboard", "لوحة التحكم"],
  ["events", "All Events", "جميع الفعاليات"],
  ["calendar", "Annual Calendar", "التقويم السنوي"],
  ["requests", "Event Requests", "طلبات الفعاليات"],
  ["tasks", "Tasks & Approvals", "المهام والموافقات"],
  ["venues", "Venue Reservations", "حجوزات المواقع"],
  ["attendance", "Attendance & QR", "الحضور وQR"],
  ["volunteers", "Volunteers Management", "إدارة المتطوعين"],
  ["partners", "Sponsors & Partners", "الرعاة والشركاء"],
  ["changes", "Change Requests", "طلبات التعديل"],
  ["postreports", "Post-Event Reports", "التقارير الختامية"],
  ["insights", "Executive Insights", "المؤشرات التنفيذية"],
  ["operations", "Operations & Alerts", "التشغيل والتنبيهات"],
  ["access", "Users & Access", "المستخدمون والصلاحيات"],
  ["log", "Activity Log", "سجل العمليات"],
  ["settings", "System Settings", "إعدادات النظام"],
];
const V14_TR = tr;
tr = function (value) {
  return lang === "ar" ? E15.labels[value] || V14_TR(value) : value;
};
newId = function () {
  let id = Date.now();
  const used = new Set(
    Object.values(state)
      .filter(Array.isArray)
      .flatMap((rows) => rows.map((row) => row?.id)),
  );
  while (used.has(id)) id++;
  return id;
};
nav.splice(0, nav.length, ...V15_NAV);
role = () => E15.auth.role();
canEdit = () => E15.allowed("edit");
isAdmin = () => E15.allowed("users");
login = function () {
  return V14.login()
    .replaceAll("V14", "V15")
    .replace(
      /<select id="loginRole">[\s\S]*?<\/select>/,
      `<select id="loginRole">${E15.roles.map((r) => `<option value="${r}">${esc(E15.t(r))}</option>`).join("")}</select>`,
    );
};
shell = function () {
  return V14.shell()
    .replaceAll("V14", "V15")
    .replace(
      /<b id="roleLabel">[\s\S]*?<\/b>/,
      `<b id="roleLabel">${esc(E15.t(role()))}</b>`,
    );
};
head = function (...args) {
  return V14.head(...args).replaceAll("/ V14", "/ V15");
};
icon = function (name) {
  return V14.icon(
    {
      venues: "calendar",
      attendance: "access",
      volunteers: "partners",
      changes: "requests",
      postreports: "reports",
      insights: "reports",
      operations: "tasks",
      settings: "access",
      workspace: "events",
    }[name] || name,
  );
};
requestModal = function (id) {
  try {
    return E15.openWizard(id);
  } catch (error) {
    E15.handleError(error);
  }
};
eventModal = function (id) {
  if (!id) return requestModal();
  closeModal();
  E15.activeEvent = +id;
  E15.workspaceTab = "overview";
  render("workspace");
};
taskModal = function (id) {
  E15.openRecord("tasks", id);
};
approvalModal = function (id) {
  E15.handlers.approval(id);
};
partnerModal = function (id) {
  if (!canEdit()) return deny();
  const before = id
    ? structuredClone(state.partners.find((p) => p.id === id))
    : null;
  V14.partnerModal(id);
  const original = $("#psave").onclick;
  $("#psave").onclick = () => {
    const count = state.log?.length || 0;
    original();
    if ((state.log?.length || 0) > count) {
      const after = state.partners.find(
        (p) => p.id === (id || state.partners[0].id),
      );
      state.log[0].before = before;
      state.log[0].after = structuredClone(after);
      state.log[0].entity = "partner:" + after.id;
      state.log[0].actor = E15.actor();
      save();
    }
  };
  const person = state.partners.find((p) => p.id === id);
  if (person) {
    const extra = document.createElement("section");
    extra.innerHTML = `<div class="form-grid">${F && E15.input(F("nextFollowup", "Next follow-up", "المتابعة القادمة", "date"), person.nextFollowup || "", "partner-")}${E15.input(F("lastContact", "Last contact", "آخر تواصل", "date"), person.history?.[0]?.date || "", "partner-")}</div><p>${L("Linked events", "الفعاليات المرتبطة")}: ${
      state.events
        .filter((e) => e.partners.includes(id))
        .map((e) => esc(eventName(e)))
        .join(" · ") || "—"
    }</p>`;
    $("#modalBody .modal-actions").before(extra);
    $("#partner-lastContact").readOnly = true;
    const handler = $("#psave").onclick;
    $("#psave").onclick = () => {
      const next = $("#partner-nextFollowup").value;
      handler();
      if ($("#modal").classList.contains("hidden")) {
        person.nextFollowup = next;
        save();
      }
    };
  }
};
const V14_CALENDAR = calendarHTML;
calendarHTML = function () {
  const saved = state.events;
  try {
    if (page === "calendar") {
      const q = normalizeSearch(E15.filter.calendar?.search || ""),
        camp = E15.filter.calendar?.campus || "All",
        category = E15.filter.calendar?.category || "All";
      state.events = saved.filter(
        (e) =>
          (!q || normalizeSearch(e.titleEn + " " + e.titleAr + " " + (e.reference || "")).includes(q)) &&
          (camp === "All" || e.campus === camp || e.campus === "Both") &&
          (category === "All" || e.category === category),
      );
    }
    return V14_CALENDAR();
  } finally {
    state.events = saved;
  }
};
E15.modules = {
  dashboard: E15.commandDashboard,
  events: () => {
    let html = eventsPage();
    if (E15.chartFilter) {
      const { type, value } = E15.chartFilter,
        rows = state.events.filter((e) =>
          type === "month"
            ? e.date?.startsWith(value)
            : type === "campus"
              ? e.campus === value
              : orgName(e) === value,
        );
      html =
        E15.title(
          "All Events",
          "جميع الفعاليات",
          null,
          null,
          E15.btn(L("Clear chart filter", "مسح فلتر الرسم"), "clear-chart"),
        ) + eventTable(rows);
    }
    return html;
  },
  calendar: E15.annualPage,
  requests: E15.requestsPage,
  tasks: E15.tasksPage,
  venues: E15.venuePage,
  attendance: E15.attendancePage,
  volunteers: E15.volunteerPage,
  partners: () =>
    V14.partnersPage().replace(
      '</div><div class="card">',
      `</div><div class="card"><div class="section-title"><span>${state.privatePartnersLoaded ? L("PRIVATE browser dataset loaded · ", "حُمّلت البيانات الخاصة في المتصفح · ") : ""}${L("Approved public catalog · optional private local import", "سجل عام معتمد · استيراد خاص محلي اختياري")}</span>${canEdit() ? E15.btn(L("Import CSV", "استيراد CSV"), "partner-import") : ""}</div>`,
    ),
  changes: E15.changesPage,
  postreports: E15.postReportsPage,
  insights: E15.insightsPage,
  operations: E15.operationsPage,
  access: E15.accessPage,
  log: E15.logPage,
  settings: E15.settingsPage,
  workspace: E15.workspace,
};
render = function (p = page) {
  const previous = page,
    active = document.activeElement,
    id = active?.id,
    selection =
      active && "selectionStart" in active ? active.selectionStart : null;
  page = E15.modules[p] ? p : "dashboard";
  const content = $("#content");
  if (!content) return;
  content.setAttribute("aria-busy", "true");
  content.innerHTML = printBranding() + E15.modules[page]();
  content.setAttribute("aria-busy", "false");
  V14.wirePage();
  decorate(content);
  E15.bind(content);
  E15.bindModule();
  document.querySelectorAll(".nav button").forEach((b) => {
    const selected =
      b.dataset.page === (page === "workspace" ? "events" : page);
    b.classList.toggle("active", selected);
    if (selected) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  if (previous === page && id && document.getElementById(id)) {
    const el = document.getElementById(id);
    el.focus();
    if (selection !== null)
      try {
        el.setSelectionRange(selection, selection);
      } catch {}
  }
};
E15.bindModule = () => {
  document.querySelectorAll("[data-kpi]").forEach(
    (b) =>
      (b.onclick = () => {
        const key = b.dataset.kpi;
        if (["registered", "attended", "noshow", "attRate"].includes(key)) {
          $("#content table")?.scrollIntoView();
          return;
        }
        if (page === "partners") return navigateKpi(key);
        if (page === "insights") {
          if (key === "volunteers") return render("volunteers");
          if (key === "attendance") return render("attendance");
          if (key === "partners") return render("partners");
          return render("events");
        }
        const map = {
          events: "events",
          today: "events",
          week: "events",
          month: "events",
          upcoming: "events",
          requests: "requests",
          approvals: "tasks",
          tasks: "tasks",
          changes: "changes",
          partners: "partners",
          operations: "operations",
          readiness: "insights",
        };
        E15.eventDateFilter = ["today", "week", "month", "upcoming"].includes(
          key,
        )
          ? key
          : null;
        render(map[key] || "events");
      }),
  );
  for (const [id, key] of [
    ["annualYear", "year"],
    ["annualMode", "mode"],
    ["annualCampus", "campus"],
    ["annualCategory", "category"],
  ])
    if (document.getElementById(id))
      document.getElementById(id).onchange = (e) => {
        E15.filter.calendar ??= {};
        E15.filter.calendar[key] = e.target.value;
        if (key === "year") calendarYear = +e.target.value;
        render("calendar");
      };
  if ($("#venueDay"))
    $("#venueDay").onchange = (e) => {
      E15.venueDay = e.target.value;
      render("venues");
    };
  for (const [id, key] of [
    ["insightPeriod", "period"],
    ["insightYear", "year"],
    ["insightMonth", "month"],
    ["insightQuarter", "quarter"],
  ])
    if (document.getElementById(id))
      document.getElementById(id).onchange = (e) => {
        E15.filter.insights ??= {};
        E15.filter.insights[key] =
          key === "month"
            ? String(e.target.value).padStart(2, "0")
            : e.target.value;
        render("insights");
      };
  if ($("#demoRoleSwitch"))
    $("#demoRoleSwitch").onchange = (e) => {
      sessionStorage.setItem("emuRole", e.target.value);
      init();
    };
  if ($("#demoDepartment"))
    $("#demoDepartment").onchange = (e) =>
      sessionStorage.setItem(
        "emuDepartment",
        E15.departments[e.target.selectedIndex],
      );
  if ($("#datasetImport"))
    $("#datasetImport").onchange = async (e) => {
      try {
        E15.guard("settings");
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024)
          throw Error(L("JSON limit is 5 MB.", "حد JSON خمسة ميجابايت."));
        const candidate = JSON.parse(await file.text());
        // Explicit local restore can migrate a V14 backup without publishing its private contents.
        for (const collection of E15.resources) candidate[collection] ??= [];
        candidate.settings ??= structuredClone(E15.defaultSettings);
        E15.validateSnapshot(candidate);
        if (
          !confirm(
            L(
              "Replace the local V15 dataset? Export a backup first.",
              "استبدال بيانات V15 المحلية؟ صدّر نسخة احتياطية أولًا.",
            ),
          )
        )
          return;
        const before = state;
        E15.transaction(() => {
          state = candidate;
          E15.initialize();
          E15.audit("Dataset restored", "dataset", null, { schemaVersion: 15 });
        });
        init();
      } catch (error) {
        E15.handleError(error);
      }
    };
};
E15.validateSnapshot = (s) => {
  for (const k of [
    "events",
    "partners",
    "tasks",
    "requests",
    "approvals",
    ...E15.resources,
  ]) {
    if (
      !Array.isArray(s[k]) ||
      s[k].some(
        (r) =>
          !r ||
          typeof r !== "object" ||
          !["number", "string"].includes(typeof r.id),
      ) ||
      new Set(s[k].map((r) => String(r.id))).size !== s[k].length
    )
      E15.fail(
        "Invalid dataset structure or duplicate IDs.",
        "بنية البيانات غير صحيحة أو المعرفات مكررة.",
      );
  }
  for (const e of s.events)
    if (
      !Array.isArray(e.partners) ||
      e.partners.some((id) => !s.partners.some((p) => p.id === id))
    )
      E15.fail(
        "Invalid event/partner references.",
        "روابط الفعاليات والشركاء غير صحيحة.",
      );
  for (const key of [
    "tasks",
    "approvals",
    "reservations",
    "registrations",
    "volunteers",
    "changes",
    "operations",
    "postReports",
    "designs",
    "expenses",
  ])
    for (const r of s[key])
      if (!s.events.some((e) => e.id === r.eventId))
        E15.fail(
          "An event-linked record is orphaned.",
          "يوجد سجل مرتبط بفعالية غير موجودة.",
        );
  if (!s.settings?.venues || !s.settings?.workflow)
    E15.fail("Settings missing.", "الإعدادات غير موجودة.");
};
init = function () {
  E15.initialize();
  E15.ensureReferences();
  persistLang();
  $("#app").innerHTML =
    sessionStorage.getItem("emuLogin") === "1" ? shell() : login();
  if ($("#loginForm")) {
    $("#loginEmail").required = true;
    $("#loginRole").value = "EMU Director";
    $("#loginEmail").value = "director@example.invalid";
    $("#loginRole").onchange = () => {$("#loginEmail").value = state.users.find(u=>u.role===$("#loginRole").value && u.status==="Active")?.email || "";};
    $("#loginForm").onsubmit = (e) => {
      e.preventDefault();
      if (!$("#loginForm").reportValidity()) return;
      const r = $("#loginRole").value;
      if (!E15.roles.includes(r)) return;
      sessionStorage.setItem("emuLogin", "1");
      sessionStorage.setItem("emuRole", r);
      sessionStorage.setItem("emuEmail", $("#loginEmail").value.trim().toLowerCase());
      if (!E15.auth.user()) {sessionStorage.removeItem("emuLogin");let error=$("#loginAccessError");if(!error){error=document.createElement("p");error.id="loginAccessError";error.setAttribute("role","alert");$("#loginForm").prepend(error);}error.textContent=L("Choose an active demo identity or a Director-authorized account.", "اختر هوية تجريبية نشطة أو حسابًا معتمدًا من المدير.");return;}
      init();
    };
    $("#loginLang").onclick = () => {
      lang = lang === "ar" ? "en" : "ar";
      init();
    };
    decorate($("#app"));
    if (new URLSearchParams(location.search).has("register"))
      {$("#loginRole").value = "Authorized Event Requester";$("#loginRole").onchange();}
    showStorageNotice();
    return;
  }
  $("#langBtn").onclick = () => {
    lang = lang === "ar" ? "en" : "ar";
    init();
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
  };
  const qrEvent = new URLSearchParams(location.search).get("register");
  if (qrEvent && state.events.some(e => String(e.id) === qrEvent && E15.isApproved(e))) {
    E15.filter.attendance = {eventId: qrEvent};
    page = "attendance";
  }
  render(page);
  if (qrEvent && !state.events.some(e => String(e.id) === qrEvent && E15.isApproved(e)))
    $("#content").innerHTML = E15.empty(L("This QR event is unavailable in this browser. Use the matching local event backup or the shared seeded demo event. No other event has been selected.", "فعالية QR غير متاحة في هذا المتصفح. استخدم نسخة بيانات الفعالية المطابقة أو الفعالية التجريبية المشتركة. لم تُحدد فعالية بديلة."));
  setNav(false);
  showStorageNotice();
};
E15.ensureReferences();
E15.handlers["legacy-workspace"] = (id) => {
  const event = E15.transaction(() => {
    E15.guard("reviewEvent");
    const r = E15.entity("requests", id);
    if (r.workflowStatus !== "Approved")
      E15.fail("Request is not approved.", "الطلب غير معتمد.");
    if (r.eventId) return E15.entity("events", r.eventId);
    const e = E15.materialize(r);
    E15.audit("Legacy approved workspace created", "request:" + id, null, e);
    return e;
  });
  closeModal();
  E15.handlers.workspace(event.id);
};
E15.handlers["clear-chart"] = () => {
  E15.chartFilter = null;
  E15.eventDateFilter = null;
  render("events");
};
E15.eventsOriginal = eventsPage;
eventsPage = function () {
  const original = state.events;
  try {
    if (E15.eventDateFilter) {
      const f = E15.eventDateFilter;
      state.events = original.filter((e) =>
        f === "today"
          ? e.date === todayISO()
          : f === "week"
            ? e.date >= weekRange()[0] && e.date <= weekRange()[1]
            : f === "month"
              ? e.date?.startsWith(todayISO().slice(0, 7))
              : e.date >= todayISO(),
      );
    }
    return (
      E15.eventsOriginal() +
      (E15.eventDateFilter
        ? E15.btn(L("Clear date filter", "مسح فلتر التاريخ"), "clear-chart")
        : "")
    );
  } finally {
    state.events = original;
  }
};
E15.handlers["settings-venue-new"] = () => E15.venueConfig();
E15.handlers["settings-venue-edit"] = (id) => E15.venueConfig(+id);
E15.venueConfig = (id) => {
  const old = state.settings.venues.find((v) => v.id === id);
  E15.form(
    L("Venue configuration", "إعداد الموقع"),
    [
      F("name", "Venue name", "اسم الموقع", "text", [], true),
      F("campus", "Campus", "الحرم", "select", [
        "Corniche",
        "North Obhur",
        "Both",
      ]),
      F("capacity", "Capacity", "السعة", "number", [], true, { min: 1 }),
      F("equipment", "Equipment", "التجهيزات", "textarea"),
    ],
    old || {},
    (v) =>
      E15.transaction(() => {
        E15.guard("settings");
        const before = old ? structuredClone(old) : null;
        if (old) Object.assign(old, v);
        else state.settings.venues.push({ id: newId(), ...v });
        E15.audit(
          "Venue configured",
          "venue:" + (old?.id || state.settings.venues.at(-1).id),
          before,
          v,
        );
      }),
  );
};
E15.partnerImport = null;
E15.handlers["partner-import"] = () => {
  E15.guard("edit");
  E15.requirePrivateOrigin();
  openModal(
    L("CSV import preview", "معاينة استيراد CSV"),
    `<p class="inline-notice">${L("Local browser data only. Private contacts must never be copied into public source or screenshots. Phone numbers are never used to merge identities.", "بيانات المتصفح المحلية فقط. لا تنقل جهات الاتصال الخاصة إلى المصدر أو اللقطات العامة. لا يُستخدم الهاتف لدمج الهويات.")}</p><section class="card"><label for="privatePartnerBaseline">${L("1. Load private partner backup (preserves original ID 12 and follow-ups)", "١. تحميل النسخة الخاصة للشركاء لحفظ السجل 12 والمتابعات")}</label><input id="privatePartnerBaseline" type="file" accept=".json"><p id="privatePartnerState">${L("Use your private partner-only backup before the approved CSV. It is never included in public source.", "استخدم النسخة الخاصة للشركاء قبل CSV المعتمد. لا تُضمّن في المصدر العام.")}</p></section><label for="partnerCSV">${L("Choose the eight-column UTF-8 CSV", "اختر CSV بثمانية أعمدة وUTF-8")}</label><input id="partnerCSV" type="file" accept=".csv"><div id="importPreview"></div><div class="modal-actions">${E15.btn(L("Close", "إغلاق"), "close")}<button id="applyPartnerCSV" class="btn primary" disabled>${L("Confirm and apply", "تأكيد وتطبيق")}</button></div>`,
  );
  E15.bind($("#modal"));
  $("#privatePartnerBaseline").onchange = async ev => {
    try {
      const file = ev.target.files[0];
      if (!file || file.size > 2 * 1024 * 1024) throw Error(L("Private backup limit: 2 MB.", "حد النسخة الخاصة: ٢ ميجابايت."));
      const snapshot = JSON.parse(await file.text());
      E15.loadPrivatePartners(snapshot, false);
      if (!confirm(L("Load these 21 private partners into this browser only? Existing follow-ups and event links will be preserved.", "تحميل الشركاء الخاصين الـ٢١ في هذا المتصفح فقط مع حفظ المتابعات وروابط الفعاليات؟"))) return;
      E15.loadPrivatePartners(snapshot, true);
      E15.partnerImport = null;
      $("#applyPartnerCSV").disabled = true;
      $("#partnerCSV").value = "";
      $("#importPreview").textContent = "";
      $("#privatePartnerState").textContent = L("21 private partners loaded. Now choose the approved CSV, review, then confirm. Close this dialog to view the records.", "حُمّل ٢١ شريكًا خاصًا. اختر CSV المعتمد ثم راجع وأكّد. أغلق النافذة لعرض السجلات.");
    } catch (error) { showErrors([error.message]); }
  };
  $("#partnerCSV").onchange = async (ev) => {
    try {
      const file = ev.target.files[0];
      if (file.size > 1024 * 1024)
        throw Error(L("CSV limit: 1 MB.", "حد CSV ميجابايت واحد."));
      const buffer = await file.arrayBuffer(),
        text = new TextDecoder("utf-8", { fatal: true }).decode(buffer),
        workbook = XLSX.read(text, { type: "string", raw: true }),
        rows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]],
          { header: 1, defval: "" },
        );
      const digest = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
      ]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      E15.partnerImport = E15.previewPartnerCSV(rows, digest);
      const p = E15.partnerImport;
      $("#importPreview").innerHTML =
        `<div class="summary-strip">${L("New", "جديد")}: ${p.rows.filter((r) => !r.id).length} · ${L("Matched updates", "تحديث مطابق")}: ${p.rows.filter((r) => r.id && !r.unchanged).length} · ${L("Unchanged", "دون تغيير")}: ${p.rows.filter((r) => r.unchanged).length} · ${L("Errors", "أخطاء")}: ${p.errors.length}</div>${p.errors.map((e) => `<p class="inline-notice">${esc(e)}</p>`).join("")}${E15.table(
          [L("Name", "الاسم"), L("Match / Warning", "المطابقة / التنبيه")],
          p.rows.map((r) => [
            esc(r.values.name),
            (r.id?"ID "+r.id:L("New identity","هوية جديدة"))+(r.warning?" · "+esc(r.warning):""),
          ]),
        )}`;
      $("#applyPartnerCSV").disabled = !!p.errors.length;
      E15.bind($("#importPreview"));
    } catch (error) {
      showErrors([error.message]);
    }
  };
  $("#applyPartnerCSV").onclick = () => {
    try {
      if (!E15.partnerImport || E15.partnerImport.errors.length) return;
      if (
        !confirm(
          L(
            "Apply this preview to local browser records only?",
            "تطبيق هذه المعاينة على سجلات المتصفح المحلية فقط؟",
          ),
        )
      )
        return;
      E15.transaction(() => {
        E15.guard("partners");
        for (const row of E15.partnerImport.rows) {
          if (row.unchanged) continue;
          const p = row.id
            ? state.partners.find((p) => p.id === row.id)
            : {
                id: newId(),
                history: [],
                relationshipStatus: null,
                sponsorshipStatus: null,
                notes: "",phone:"",email:"",contactPerson:"",
              };
          const before = structuredClone(p);
          for (const [key, value] of Object.entries(row.values))
            if (
              value !== "" ||
              !["phone", "email", "contactPerson", "notes"].includes(key)
            )
              p[key] = value;
          if (
            row.values.notes &&
            before.notes &&
            !before.notes.split("\n\n").includes(row.values.notes)
          ) {
            p.notes = before.notes + "\n\n" + row.values.notes;
            p.notesHistory = [
              ...(p.notesHistory || []),
              { text: before.notes, source: "before-import" },
            ];
          }
          if (
            !row.values.notes ||
            before.notes?.split("\n\n").includes(row.values.notes)
          )
            p.notes = before.notes || row.values.notes;
          if (!row.id) state.partners.push(p);
          E15.audit("Partner imported", "partner:" + p.id, before, p);
        }
      });
      closeModal();
      render("partners");
      toast(L("Import applied locally", "طُبق الاستيراد محليًا"));
    } catch (error) {
      showErrors([error.message]);
    }
  };
};
E15.previewPartnerCSV = (rows, digest) => {
  const plan = { rows: [], errors: [] },
    approved =
      digest ===
      "4d9b54b5f50eb2dcd18f635d198ffadd2ad9a499a039ee6af4dc282580c7597e",
    ids = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ],
    seen = new Set();
  const arabic=['الجهة / الشخص','التصنيف الموحد','نوع النشاط / المشاركة المحتملة','رقم التواصل (دولي)','اسم مسؤول التواصل','البريد الإلكتروني','حالة المشاركة السابقة','ملاحظات للفعاليات القادمة'];
  if (approved && (!state.privatePartnersLoaded || rows.length !== 21))
    plan.errors.push(L("Load the 21-record private partner backup first; the approved CSV must contain exactly 20 data rows. This preserves original ID 12 and histories.", "حمّل النسخة الخاصة ذات ٢١ سجلًا أولًا؛ يجب أن يحتوي CSV المعتمد على ٢٠ صف بيانات لحفظ السجل 12 والمتابعات."));
  const english=['Partner','Category','Activity','Phone','Contact Person','Email','Previous Participation','Notes'];
  if(rows[0]?.length===8&&!rows[0].every((v,i)=>[arabic[i],english[i]].some(h=>normalizeSearch(h)===normalizeSearch(String(v)))))plan.errors.push(L('Column headers or order do not match the approved schema.','عناوين الأعمدة أو ترتيبها لا تطابق المخطط المعتمد.'));
  if (rows[0]?.length !== 8)
    plan.errors.push(L("Expected eight columns.", "يلزم ثمانية أعمدة."));
  for (const [i, row] of rows.slice(1).entries()) {
    if (row.every((v) => !String(v).trim())) continue;
    if (row.length !== 8 || !row[0] || !row[1]) {
      plan.errors.push(L("Invalid row ", "صف غير صحيح ") + (i + 2));
      continue;
    }
    const name = String(row[0]),
      key = normalizeSearch(name);
    if (seen.has(key)) {
      plan.errors.push(
        L("Duplicate name on row ", "اسم مكرر في السطر ") + (i + 2),
      );
      continue;
    }
    seen.add(key);
    const matches = state.partners.filter(
      (p) => normalizeSearch(p.name) === key,
    );
    let p = approved
      ? state.partners.find((p) => p.id === ids[i])
      : matches.length === 1
        ? matches[0]
        : null;
    if (matches.length > 1)
      plan.errors.push(
        L("Ambiguous name on row ", "اسم ملتبس في السطر ") + (i + 2),
      );
    const phoneSource = String(row[3] || ""), emailSource = String(row[5] || "");
    const phone = phoneSource
        .trim()
        .replace(/[\s()-]/g, "")
        .replace(/^00/, "+"),
      email = String(row[5] || "").trim();
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone))
      plan.errors.push(
        L("Invalid phone on row ", "رقم غير صحيح في السطر ") + (i + 2),
      );
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      plan.errors.push(
        L("Invalid email on row ", "بريد غير صحيح في السطر ") + (i + 2),
      );
    const values = {
      name,
      catAr: String(row[1]),
      catEn: p?.catAr === row[1] ? p.catEn : "",
      actAr: String(row[2]),
      actEn: p?.actAr === row[2] ? p.actEn : "",
      phone: phoneSource,
      email: emailSource,
      contactPerson: String(row[4]),
      previousParticipation: String(row[6]),
      notes: String(row[7]),
    };
    const warning =
      phone &&
      state.partners.some(
        (x) => x.id !== p?.id && String(x.phone||"").replace(/[\s()-]/g, "") === phone,
      )
        ? L(
            "Shared phone: records stay separate.",
            "رقم مشترك: تبقى السجلات منفصلة.",
          )
        : "";
    plan.rows.push({
      id: p?.id,
      values,
      warning,
      unchanged:
        p && Object.entries(values).every(([k, v]) => {
          if (["phone", "email", "contactPerson", "notes"].includes(k) && v === "") return true;
          if (k === "notes" && p.notes?.split("\n\n").includes(v)) return true;
          return (p[k] || "") === v;
        }),
    });
  }
  return plan;
};
const V14_EVENT_ROW = eventRow,
  V14_EVENT_TABLE = eventTable;
eventRow = (e) => V14_EVENT_ROW({ ...e, progress: E15.readiness(e.id) })
  .replace('</b><span>', '</b>' + E15.referenceHTML(e.reference) + '<span>');
eventTable = (rows) =>
  rows.reduce((html, e) => html.replace(`<span class="mini">#${e.id}</span>`, E15.referenceHTML(e.reference)),
    V14_EVENT_TABLE(rows.map((e) => ({ ...e, progress: E15.readiness(e.id) }))));
calendarHTML = function () {
  const week = +(state.settings.calendar.weekStart || 0),
    first = (new Date(calendarYear, calendarMonth, 1).getDay() - week + 7) % 7,
    days = new Date(calendarYear, calendarMonth + 1, 0).getDate(),
    prefix = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}`;
  const q = normalizeSearch(E15.filter.calendar?.search || ""),
    camp = E15.filter.calendar?.campus || "All",
    category = E15.filter.calendar?.category || "All";
  const events = state.events.filter(
    (e) =>
      page !== "calendar" ||
      ((!q || normalizeSearch(e.titleEn + " " + e.titleAr + " " + (e.reference || "")).includes(q)) &&
        (camp === "All" || e.campus === camp || e.campus === "Both") &&
        (category === "All" || e.category === category)),
  );
  const cells = Array.from({ length: first }, () => "<div></div>");
  for (let day = 1; day <= days; day++) {
    const date = prefix + "-" + String(day).padStart(2, "0");
    cells.push(
      `<div class="day ${date === todayISO() ? "today" : ""}"><b>${day}</b>${events
        .filter((e) => e.date === date)
        .map(
          (e) =>
            `<button class="dot" data-open-event="${e.id}" title="${esc(eventName(e) + " · " + (e.reference || ""))}" aria-label="${esc(eventName(e) + " · " + (e.reference || ""))}">${esc(eventName(e))}${E15.referenceHTML(e.reference)}</button>`,
        )
        .join("")}</div>`,
    );
  }
  return `<div class="calendar-toolbar"><button class="btn secondary" data-month="-1" aria-label="${L("Previous month", "الشهر السابق")}">${lang === "ar" ? "→" : "←"}</button><h3>${monthLabel()}</h3><button class="btn secondary" data-month="1" aria-label="${L("Next month", "الشهر التالي")}">${lang === "ar" ? "←" : "→"}</button><button class="btn secondary" data-calendar-today>${L("Today", "اليوم")}</button></div><div class="calendar">${Array.from({ length: 7 }, (_, i) => `<div class="cal-head">${new Intl.DateTimeFormat(locale(), { weekday: "short" }).format(new Date(2026, 0, 4 + ((i + week) % 7)))}</div>`).join("")}${cells.join("")}</div><div class="mobile-agenda">${
    events
      .filter((e) => e.date?.startsWith(prefix))
      .map(
        (e) =>
          `<button class="agenda-item" data-open-event="${e.id}"><small>${fmt(e.date)}</small><b dir="auto">${esc(eventName(e))}</b>${E15.referenceHTML(e.reference)}${E15.badge(e.lifecycle)}</button>`,
      )
      .join("") ||
    E15.empty(
      L("No scheduled events this month.", "لا توجد فعاليات مجدولة هذا الشهر."),
    )
  }</div>`;
};
E15.photoGallery = async (report) => {
  if (!report) return;
  const target = $("#formalReport");
  if (!target) return;
  const gallery = document.createElement("div");
  gallery.className = "photo-gallery";
  for (const file of report.attachments || [])
    if (/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      const blob = await E15.files.get(file.id);
      if (blob && target.isConnected) {
        const img = document.createElement("img");
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.alt = file.name;
        img.onload = () => URL.revokeObjectURL(url);
        gallery.append(img);
      }
    }
  if (target.isConnected) target.append(gallery);
};
const V15_OPEN_REPORT = E15.openReport;
E15.openReport = (id) => {
  V15_OPEN_REPORT(id);
  E15.photoGallery(state.postReports.find((r) => r.eventId === id));
};
// Reload the initially rendered dashboard after the final component overrides.


const V14_EVENT_NAME = eventName;
eventName = (e) =>
  e?.sourceRequestId ? translated(e, "title") : V14_EVENT_NAME(e);

const V14_SET_MONTH = setMonth;
setMonth = (delta) => {
  const date = new Date(calendarYear, calendarMonth + delta, 1);
  calendarYear = date.getFullYear();
  calendarMonth = date.getMonth();
  if (page === "calendar") {
    E15.filter.calendar ??= {};
    E15.filter.calendar.year = String(calendarYear);
  }
  render(page);
  document.querySelector(`[data-month="${delta}"]`)?.focus();
};
E15.calendarRows = () => {
  const f = E15.filter.calendar || {},
    q = normalizeSearch(f.search || "");
  return state.events.filter(
    (e) =>
      (!e.date || e.date.startsWith(f.year || String(calendarYear))) &&
      (!q || normalizeSearch(e.titleEn + " " + e.titleAr + " " + (e.reference || "")).includes(q)) &&
      (!f.campus ||
        f.campus === "All" ||
        e.campus === f.campus ||
        e.campus === "Both") &&
      (!f.category || f.category === "All" || e.category === f.category),
  );
};
/* Promise-based integration boundary: applications team can replace these methods with HTTP adapters. */
E15.api = {
  async list(collection) {
    return structuredClone(state[collection] || []);
  },
  async get(collection, id) {
    return structuredClone(E15.entity(collection, id));
  },
  async save(collection, values, id) {
    return E15.record.save(collection, values, id);
  },
  async remove(collection, id) {
    return E15.record.remove(collection, id);
  },
  async saveRequest(details, id, submit) {
    return E15.request.save(details, id, submit);
  },
  async reviewRequest(id, decision, reason) {
    return E15.request.review(id, decision, reason);
  },
  async requestPublication(id) { return E15.publication.request(id); },
  async reviewPublication(id, decision, reason) { return E15.publication.review(id, decision, reason); },
  async withdrawPublication(id) { return E15.publication.withdraw(id); },
  async requestChange(id, field, proposed, reason, impact) {
    return E15.change.request(id, field, proposed, reason, impact);
  },
  async reviewChange(id, approved, reason) {
    return E15.change.review(id, approved, reason);
  },
  async register(eventId, values) {
    return E15.attendance.register(eventId, values);
  },
  async checkin(id) {
    return E15.attendance.checkin(id);
  },
  async upload(file) {
    return E15.files.put(file);
  },
  async download(id) {
    return E15.files.get(id);
  },
};
E15.handlers["event-delete"] = (id) => {
  if (
    confirm(
      L(
        "Delete this planning event and its linked operational records?",
        "حذف سجل التخطيط وسجلات التشغيل المرتبطة به؟",
      ),
    )
  ) {
    E15.record.remove("events", +id);
    render("events");
  }
};
Object.assign(E15.labels, {
  "V15 demo initialized": "تهيئة بيانات العرض التجريبية",
  "Venue conflict": "تعارض موقع",
});

const V15_CHANGE_FORM = E15.handlers["change-new"];
E15.handlers["change-new"] = (id) => {
  V15_CHANGE_FORM(id);
  const update = () => {
    const event = state.events.find((e) => e.id === +$("#f-eventId").value),
      key = $("#f-field").value;
    let input = $("#f-proposed");
    if (key === "campus") {
      const select = document.createElement("select");
      select.id = input.id;
      select.dataset.field = "proposed";
      select.required = true;
      select.innerHTML = ["Corniche", "North Obhur", "Both"]
        .map((c) => `<option value="${c}">${tr(c)}</option>`)
        .join("");
      input.replaceWith(select);
    } else {
      if (input.tagName === "SELECT") {
        const next = document.createElement("input");
        next.id = input.id;
        next.dataset.field = "proposed";
        next.required = true;
        input.replaceWith(next);
        input = next;
      }
      input.type =
        key === "date"
          ? "date"
          : ["startTime", "endTime"].includes(key)
            ? "time"
            : key === "expectedAttendance"
              ? "number"
              : "text";
      if (key === "expectedAttendance") input.min = 1;
    }
    let old = $("#changeOldValue");
    if (!old) {
      old = document.createElement("p");
      old.id = "changeOldValue";
      old.className = "inline-notice";
      $("#modalBody .modal-actions").before(old);
    }
    old.textContent =
      L("Current value: ", "القيمة الحالية: ") + String(event?.[key] ?? "—");
  };
  $("#f-field").onchange = update;
  $("#f-eventId").onchange = update;
  update();
};

E15.handlers["reset-demo"] = () => {
  E15.guard("settings");
  if (
    !confirm(
      L(
        "Replace this browser’s V15 data with sanitized demo records? Export a backup first. V14 is unaffected.",
        "استبدال بيانات V15 في هذا المتصفح ببيانات تجريبية منقحة؟ صدّر نسخة احتياطية أولًا. لن تتغير V14.",
      ),
    )
  )
    return;
  E15.transaction(() => {
    state = structuredClone(SEED);
    E15.initialize();
    E15.ensureReferences();
    E15.audit("Demo reset", "dataset", null, { version: 15 });
  });
  page = "dashboard";
  init();
};
const V15_BIND_MODULE=E15.bindModule;
E15.bindModule=()=>{V15_BIND_MODULE();const tabs=document.querySelector('[role="tablist"]');if(tabs)tabs.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const items=[...tabs.querySelectorAll('[role="tab"]')],index=items.indexOf(document.activeElement);let next=e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowRight'?(lang==='ar'?-1:1):(lang==='ar'?1:-1))+items.length)%items.length;const key=items[next].dataset.id;E15.workspaceTab=key;render('workspace');document.querySelector(`[role="tab"][data-id="${key}"]`)?.focus()};const today=document.querySelector('[data-calendar-today]');if(today&&page==='calendar')today.onclick=()=>{const parts=todayISO().split('-');calendarYear=+parts[0];calendarMonth=+parts[1]-1;E15.filter.calendar??={};E15.filter.calendar.year=String(calendarYear);render('calendar')};};

E15.installAccess();
E15.installCalendar();
init();
