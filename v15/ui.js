/* Shared bilingual UI components and schema-driven local forms. */
const V14 = {
  render,
  wirePage,
  init,
  login,
  shell,
  head,
  role,
  canEdit,
  requestModal,
  eventModal,
  taskModal,
  approvalModal,
  accessPage,
  logPage,
  partnersPage,
  partnerModal,
  followModal,
  dashboard,
  icon,
  save,
};
E15.labels = {
  "Not Requested": "لم يُطلب",
  "Needs Review": "بحاجة لمراجعة",
  "Withdrawn": "مسحوب",
  "Requested": "مطلوب",
  "Invalidated by approved event change": "أُلغي الاعتماد بسبب تعديل معتمد للفعالية",
  "Record created": "إنشاء سجل",
  "Record updated": "تحديث سجل",
  "Record deleted": "حذف سجل",
  "Draft saved": "حفظ مسودة",
  "Request submitted": "تقديم طلب",
  "Request Approved": "اعتماد طلب",
  "Request Rejected": "رفض طلب",
  "Request Under Review": "بدء مراجعة طلب",
  "Settings updated": "تحديث الإعدادات",
  "Attendee registered": "تسجيل مشارك",
  "Attendee checked in": "تسجيل حضور",
  "Partners linked": "ربط الشركاء",
  "Change requested": "طلب تعديل",
  "Change Approved": "اعتماد تعديل",
  "Change Declined": "رفض تعديل",
  "Dataset restored": "استعادة البيانات",
  partners: "الشركاء",
  Draft: "مسودة",
  Submitted: "مقدم",
  "Under Review": "قيد المراجعة",
  Approved: "معتمد",
  Rejected: "مرفوض",
  Preparation: "التحضير",
  "Event Day": "يوم الفعالية",
  "Post-Event Reporting": "التقرير الختامي",
  Closed: "مغلق",
  "Event Requester": "مقدم طلب",
  "Supporting Department": "إدارة مساندة",
  "Management Viewer": "مشاهد إداري",
  Assigned: "مُسند",
  Completed: "مكتمل",
  Cancelled: "ملغى",
  Conflict: "تعارض",
  Normal: "عادي",
  High: "عالٍ",
  Resolved: "محلول",
  Open: "مفتوح",
  "Draft policy": "سياسة مقترحة",
  Academic: "أكاديمية",
  Community: "مجتمعية",
  Cultural: "ثقافية",
  Health: "صحية",
  Career: "مهنية",
  "Major / External": "كبرى / خارجية",
  IT: "تقنية المعلومات",
  Security: "الأمن",
  Finance: "المالية",
  "Main Auditorium": "القاعة الرئيسية",
  "Mini Auditorium": "القاعة المصغرة",
  "Abu Milha Auditorium (1ST11)": "قاعة أبو ملحة (1ST11)",
  GR46: "GR46",
  Lobby: "البهو",
  "Open Area": "ساحة مفتوحة",
  "Workshop Rooms": "قاعات الورش",
  Classrooms: "قاعات دراسية",
  Other: "أخرى",
  Male: "ذكور",
  Female: "إناث",
  Both: "كلاهما",
  Pending: "معلق",
  Purchased: "تم الشراء",
  "University Community Only": "منسوبو الجامعة فقط",
  "Public Only": "الجمهور فقط",
  "Open to Public + University Community": "الجمهور ومنسوبو الجامعة",
  Theater: "مسرحي",
  Classroom: "صفوف",
  "Round tables": "طاولات مستديرة",
  Yes: "نعم",
  No: "لا",
  Poster: "ملصق",
  "Instagram Post": "منشور إنستغرام",
  "Instagram Story": "قصة إنستغرام",
  "WhatsApp Announcement": "إعلان واتساب",
  "Digital Screens": "شاشات رقمية",
  "Booth Signage": "لوحات الأركان",
  Invitation: "دعوة",
  "University Pop-up Booths": "الأركان الجامعية",
  "University Booths": "الأركان الجامعية",
  "External Booths": "أركان الجهات الخارجية",
  Participation: "مشاركة",
  Speaker: "متحدث",
  Volunteer: "متطوع",
  Attendance: "حضور",
  Venue: "الموقع",
  "IT/AV": "التقنية والصوتيات",
  Screens: "الشاشات",
  Booths: "الأركان",
  Hospitality: "الضيافة",
  Guests: "الضيوف",
  Volunteers: "المتطوعون",
  Registration: "التسجيل",
  Media: "الإعلام",
  Safety: "السلامة",
  "Pending approval": "بانتظار الاعتماد",
  Proposed: "مقترح",
  General: "عام",
  "Not specified": "غير محدد",
};
E15.t = (en, ar) =>
  ar ? L(en, ar) : lang === "ar" ? E15.labels[en] || tr(en) : en === "University Pop-up Booths" ? "University Booths" : en;
E15.referenceHTML = (ref) => ref
  ? `<bdi class="event-reference" dir="ltr">${esc(ref)}</bdi>` : "";
E15.eventLabel = (e) => eventName(e) + (e.reference ? " · " + e.reference : "");
E15.btn = (text, action, id = "", style = "secondary") => {
  const permissions = {
    "new-request": "request",
    "review-request": "reviewEvent",
    register: "register",
    checkin: "edit",
    "change-new": "change",
    "edit-report": "report",
    "guest-new": "edit",
    "link-partners": "edit",
    publication: "edit",
    "publication-review": "reviewPublication",
    "publication-withdraw": "edit",
    "settings-edit": "settings",
    "dataset-export": "settings",
    "new-approval": "approval",
    "record-new":
      {
        tasks: "task",
        reservations: "reservation",
        operations: "operation",
        users: "users",
      }[id] || "edit",
  };
  if (permissions[action] && !E15.allowed(permissions[action])) return "";
  if (["workspace", "workspace-modal"].includes(action)) {
    const event = state.events.find(e => String(e.id) === String(id));
    if (event?.reference) text += E15.referenceHTML(event.reference);
  }
  return `<button class="btn ${style}" type="button" data-v15="${action}" data-id="${esc(id)}">${text}</button>`;
};
E15.badge = (s) =>
  `<span class="pill v15-status ${esc(String(s || "Unknown").replaceAll(" ", "-"))}">${esc(s ? E15.t(s) : L("Not specified", "غير محدد"))}</span>`;
E15.empty = (text) =>
  `<div class="empty">${icon("events")}<b>${text || L("No records yet. Add the first record to get started.", "لا توجد سجلات بعد. أضف أول سجل للبدء.")}</b></div>`;
E15.eventSelect = (selected = "", approved = false) =>
  `<label class="filter-field" for="moduleEvent">${L("Event", "الفعالية")}<select id="moduleEvent"><option value="">${L("All events", "جميع الفعاليات")}</option>${state.events
    .filter((e) => !approved || E15.isApproved(e))
    .map(
      (e) =>
        `<option value="${e.id}" ${String(selected) === String(e.id) ? "selected" : ""}>${esc(E15.eventLabel(e))}</option>`,
    )
    .join("")}</select></label>`;
E15.filter = {};
E15.workspaceTab = "overview";
E15.activeEvent = null;
E15.eventRows = (collection, eventId = E15.filter[page]?.eventId) =>
  state[collection].filter((r) => !eventId || r.eventId === +eventId);
E15.toolbar = (extra = "") =>
  `<div class="v15-toolbar"><label class="filter-field" for="moduleSearch">${L("Search", "بحث")}<input id="moduleSearch" type="search" value="${esc(E15.filter[page]?.search || "")}" placeholder="${L("Search records…", "ابحث في السجلات…")}"></label>${E15.eventSelect(E15.filter[page]?.eventId || "")}${extra}</div>`;
E15.table = (headers, rows) =>
  rows.length
    ? `<div class="table-wrap"><table class="v15-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((cells) => `<tr>${cells.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
    : E15.empty();
E15.filtered = (rows) => {
  const q = normalizeSearch(E15.filter[page]?.search || "");
  return rows.filter(
    (r) => !q || normalizeSearch(JSON.stringify(r)).includes(q),
  );
};
E15.title = (en, ar, descEn, descAr, actions = "") =>
  head(
    L(en, ar),
    L(
      descEn || "Connected frontend workspace · local demonstration data",
      descAr || "مساحة عمل مترابطة · بيانات تجريبية محلية",
    ),
    actions,
  );
E15.eventName = (id) =>
  eventName(state.events.find((e) => e.id === +id)) || "—";
E15.field = (
  key,
  en,
  ar,
  type = "text",
  options = [],
  required = false,
  extra = {},
) => ({ key, en, ar, type, options, required, ...extra });
E15.input = (f, value, idPrefix = "f-") => {
  const id = idPrefix + f.key,
    label = L(f.en, f.ar),
    v = value ?? f.default ?? "";
  let input;
  const props = `id="${id}" data-field="${f.key}" ${f.required ? "required" : ""} ${f.min !== undefined ? 'min="' + f.min + '"' : ""} ${f.max !== undefined ? 'max="' + f.max + '"' : ""} ${f.readonly ? "readonly" : ""}`;
  if (f.type === "select")
    input = `<select ${props}>${f.options
      .map((o) => {
        const val = typeof o === "object" ? o.value : o,
          txt = typeof o === "object" ? o.label : E15.t(o);
        return `<option value="${esc(val)}" ${String(v) === String(val) ? "selected" : ""}>${esc(txt)}</option>`;
      })
      .join("")}</select>`;
  else if (f.type === "textarea")
    input = `<textarea ${props} dir="auto">${esc(v)}</textarea>`;
  else if (f.type === "checkbox")
    input = `<input ${props} type="checkbox" ${v ? "checked" : ""}>`;
  else if (f.type === "file") input = `<input ${props} type="file" multiple>`;
  else
    input = `<input ${props} type="${f.type}" value="${esc(v)}" ${["email", "tel", "date", "time", "datetime-local", "number"].includes(f.type) ? 'dir="ltr"' : 'dir="auto"'}>`;
  return `<div class="field ${f.wide ? "span2" : ""}"><label for="${id}">${label}${f.required ? ' <span class="required-mark">*</span>' : ""}</label>${input}${f.help ? `<small class="muted">${L(...f.help)}</small>` : ""}</div>`;
};
E15.collect = (fields, root = document) => {
  const out = {};
  for (const f of fields) {
    const e = root.querySelector('[data-field="' + f.key + '"]');
    if (e)
      out[f.key] =
        f.type === "checkbox"
          ? e.checked
          : f.type === "number"
            ? e.value === ""
              ? ""
              : Number(e.value)
            : e.value;
  }
  return out;
};
E15.validForm = (root) => {
  for (const el of root.querySelectorAll("input,select,textarea"))
    if (!el.checkValidity()) {
      el.reportValidity();
      el.focus();
      return false;
    }
  return true;
};
E15.form = (title, fields, values, onSave, footer = "") => {
  openModal(
    title,
    `<div class="form-grid">${fields.map((f) => E15.input(f, values?.[f.key])).join("")}</div>${footer}<div class="modal-actions">${E15.btn(L("Cancel", "إلغاء"), "close")}<button class="btn primary" id="v15Save">${L("Save", "حفظ")}</button></div>`,
  );
  $("#v15Save").onclick = async () => {
    if (!E15.validForm($("#modalForm"))) return;
    try {
      await onSave(E15.collect(fields, $("#modalForm")));
      closeModal();
      render(page);
      toast(L("Saved", "تم الحفظ"));
    } catch (error) {
      showErrors([error.message]);
    }
  };
  E15.bind($("#modal"));
};
E15.download = (name, data, mime = "application/json") => {
  const blob = new Blob(
      [
        typeof data === "string" ||
        data instanceof ArrayBuffer ||
        ArrayBuffer.isView(data) ||
        data instanceof Blob
          ? data
          : JSON.stringify(data, null, 2),
      ],
      { type: mime },
    ),
    a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
E15.csv = (name, rows) => {
  const safe = (v) => {
    let s = String(v ?? "");
    if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  E15.download(
    name,
    "\uFEFF" + rows.map((r) => r.map(safe).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
  );
};
E15.xlsx = (name, rows) => {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "EMU");
  XLSX.writeFile(book, name);
};
E15.filesUI = (files = []) =>
  `<div class="file-list">${files.map((f) => E15.btn(esc(f.name), "file", f.id)).join("") || `<span class="muted">${L("No attachments", "لا توجد مرفقات")}</span>`}</div>`;
E15.upload = async (input) => {
  const files = [];
  for (const f of input.files) files.push(await E15.files.put(f));
  return files;
};
E15.handleError = (error) => {
  if (!$("#modal").classList.contains("hidden")) showErrors([error.message]);
  else toast(error.message);
};
E15.bind = (root) => {
  root.querySelectorAll("[data-v15]").forEach(
    (b) =>
      (b.onclick = async (e) => {
        e.preventDefault();
        try {
          await E15.action(b.dataset.v15, b.dataset.id, b);
        } catch (error) {
          E15.handleError(error);
        }
      }),
  );
  if (root.querySelector("#moduleSearch"))
    $("#moduleSearch").oninput = (e) => {
      const pos = e.target.selectionStart;
      E15.filter[page] ??= {};
      E15.filter[page].search = e.target.value;
      render(page);
      $("#moduleSearch").focus();
      $("#moduleSearch").setSelectionRange(pos, pos);
    };
  if (root.querySelector("#moduleEvent"))
    $("#moduleEvent").onchange = (e) => {
      E15.filter[page] ??= {};
      E15.filter[page].eventId = e.target.value;
      render(page);
    };
  root.querySelectorAll("table").forEach((t) => {
    const headers = [...t.querySelectorAll("th")];
    t.querySelectorAll("tbody tr").forEach((r) =>
      [...r.cells].forEach(
        (c, i) => (c.dataset.label = headers[i]?.textContent || ""),
      ),
    );
  });
};
E15.handlers = {
  close: () => closeModal(),
  file: async (id) => {
    const file = await E15.files.get(id);
    if (!file)
      E15.fail(
        "This file is unavailable in this browser.",
        "هذا الملف غير متاح في هذا المتصفح.",
      );
    E15.download(file.name, await file.arrayBuffer(), file.type);
  },
  print: () => window.print(),
};
E15.action = async (name, id, button) => {
  if (E15.handlers[name]) return E15.handlers[name](id, button);
  E15.fail("Unknown action.", "إجراء غير معروف.");
};
E15.formEventOptions = () =>
  state.events.map((e) => ({ value: e.id, label: E15.eventLabel(e) }));
E15.askDecision = (title, callback) =>
  E15.form(
    title,
    [
      E15.field(
        "decision",
        "Decision",
        "القرار",
        "select",
        ["Approved", "Rejected"],
        true,
      ),
      E15.field(
        "reason",
        "Decision reason",
        "سبب القرار",
        "textarea",
        [],
        true,
      ),
    ],
    {},
    (v) => callback(v),
  );

Object.assign(E15.labels, {
  "Venue configured": "إعداد موقع",
  "Partners linked": "ربط الشركاء",
  "Partner imported": "استيراد شريك",
  "Guest added": "إضافة ضيف",
  "Publication flag changed": "تغيير علامة النشر",
  "Lifecycle Preparation": "بدء التحضير",
  "Lifecycle Event Day": "بدء يوم الفعالية",
  "Lifecycle Post-Event Reporting": "بدء التقرير الختامي",
  "Lifecycle Closed": "إغلاق الفعالية",
  "Department approval Approved": "اعتماد إدارة",
  "Department approval Declined": "رفض إدارة",
  "Legacy approved workspace created": "إنشاء مساحة لطلب سابق معتمد",
});
