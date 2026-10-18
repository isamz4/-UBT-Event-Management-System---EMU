/* Every module has live data, creation/editing, filters and linked event navigation. */
E15.schemas = {
  tasks: [
    F("titleAr", "Arabic task", "المهمة بالعربية", "text", [], true),
    F("titleEn", "English task", "المهمة بالإنجليزية"),
    F("dept", "Department", "الإدارة", "select", E15.departments, true),
    F("owner", "Owner", "المسؤول", "text", [], true),
    F("due", "Deadline", "الموعد النهائي", "date", [], true),
    F("priority", "Priority", "الأولوية", "select", ["High", "Medium", "Low"]),
    F("status", "Status", "الحالة", "select", ["Pending", "Done"]),
    F("notes", "Notes", "ملاحظات", "textarea"),
  ],
  reservations: [
    F("venueId", "Venue", "الموقع", "select", [], true),
    F("date", "Date", "التاريخ", "date", [], true),
    F("setupTime", "Setup from", "بداية التجهيز", "time", [], true),
    F("startTime", "Start", "البداية", "time", [], true),
    F("endTime", "End", "النهاية", "time", [], true),
    F("breakdownTime", "Breakdown until", "نهاية التفكيك", "time", [], true),
    F("status", "Reservation status", "حالة الحجز", "select", [
      "Pending",
      "Confirmed",
      "Cancelled",
    ]),
    F("equipment", "Equipment", "التجهيزات", "textarea"),
    F("notes", "Notes", "ملاحظات", "textarea"),
  ],
  volunteers: [
    F("name", "Volunteer name", "اسم المتطوع", "text", [], true),
    F("gender", "Allocation", "التوزيع", "select", ["Male", "Female", "Both"]),
    F("shift", "Shift", "الفترة", "text", [], true),
    F("location", "Location", "الموقع"),
    F("tasks", "Tasks", "المهام", "textarea"),
    F("status", "Participation status", "حالة المشاركة", "select", [
      "Assigned",
      "Completed",
      "Cancelled",
    ]),
    F("hours", "Recorded hours", "الساعات المسجلة", "number", [], true, {
      min: 0,
    }),
    F(
      "approvedHours",
      "Approved hours (Admin)",
      "الساعات المعتمدة (المدير)",
      "number",
      [],
      false,
      { min: 0 },
    ),
  ],
  operations: [
    F("item", "Checklist / incident", "الفحص / البلاغ", "select", [
      "Venue",
      "IT/AV",
      "Screens",
      "Booths",
      "Hospitality",
      "Guests",
      "Volunteers",
      "Registration",
      "Media",
      "Safety",
    ]),
    F("owner", "Responsible person", "المسؤول", "text", [], true),
    F("status", "Readiness", "الجاهزية", "select", ["Pending", "Done"]),
    F("severity", "Severity", "الخطورة", "select", ["Normal", "High"]),
    F(
      "notes",
      "Incident / resolution notes",
      "تفاصيل البلاغ / الحل",
      "textarea",
    ),
    F("resolved", "Resolved", "تم الحل", "checkbox"),
  ],
  expenses: [
    F("item", "Purchase / expense", "البند", "text", [], true),
    F("amount", "Amount (SAR)", "المبلغ (ريال)", "number", [], true, {
      min: 0,
    }),
    F("supplier", "Supplier", "المورد"),
    F("status", "Status", "الحالة", "select", [
      "Draft",
      "Pending approval",
      "Purchased",
    ]),
    F("notes", "Supporting notes", "ملاحظات داعمة", "textarea"),
  ],
  designs: [
    F("type", "Type", "النوع", "select", [
      "Poster",
      "Instagram Post",
      "Instagram Story",
      "WhatsApp Announcement",
      "Digital Screens",
      "Booth Signage",
      "Invitation",
      "Other",
    ]),
    F("contentAr", "Arabic content", "المحتوى العربي", "textarea"),
    F("contentEn", "English content", "المحتوى الإنجليزي", "textarea"),
    F("deadline", "Deadline", "الموعد النهائي", "date"),
    F("dimensions", "Dimensions", "الأبعاد"),
    F("screenCampus", "Screen campus", "حرم الشاشات", "select", [
      "Corniche",
      "North Obhur",
      "Both",
    ]),
    F("displayStart", "Display start", "بداية العرض", "date"),
    F("displayEnd", "Display end", "نهاية العرض", "date"),
    F("status", "Design status", "حالة التصميم", "select", [
      "Draft",
      "Submitted",
      "Approved",
    ]),
    F(
      "published",
      "Publish after Marketing approval",
      "النشر بعد اعتماد التسويق",
      "checkbox",
    ),
  ],
  users: [
    F("name", "Name", "الاسم", "text", [], true),
    F("email", "Email", "البريد الإلكتروني", "email", [], true),
    F("role", "Demo role", "الدور التجريبي", "select", E15.roles, true),
    F("department", "Department", "الإدارة", "select", E15.departments),
    F("status", "Status", "الحالة", "select", ["Active", "Inactive"]),
  ],
  postReports: [
    F(
      "status",
      "Report status",
      "حالة التقرير",
      "select",
      ["Draft", "Completed"],
      true,
    ),
    F(
      "achievements",
      "Achievements (Arabic)",
      "الإنجازات بالعربية",
      "textarea",
      [],
      true,
    ),
    F(
      "achievementsEn",
      "Achievements (English)",
      "الإنجازات بالإنجليزية",
      "textarea",
    ),
    F("challenges", "Challenges", "التحديات", "textarea", [], true),
    F("recommendations", "Recommendations", "التوصيات", "textarea", [], true),
    F("satisfaction", "Satisfaction (1–5)", "الرضا (1–5)", "number", [], true, {
      min: 1,
      max: 5,
    }),
    F(
      "summaryEn",
      "Formal English narrative",
      "ملخص رسمي بالإنجليزية",
      "textarea",
    ),
  ],
};
E15.openRecord = (collection, id = null, eventId = null) => {
  const existing = id ? E15.entity(collection, +id) : {},
    schema = structuredClone(E15.schemas[collection]);
  if (!schema) return;
  if(collection==="volunteers"&&!E15.allowed("hours"))schema.find(f=>f.key==="approvedHours").readonly=true;
  const fields =
    collection === "users"
      ? schema
      : [
          F(
            "eventId",
            "Linked event",
            "الفعالية المرتبطة",
            "select",
            E15.formEventOptions(),
            true,
          ),
          ...schema,
        ];
  if (collection === "reservations")
    fields.find((f) => f.key === "venueId").options = state.settings.venues.map(
      (v) => ({ value: v.id, label: E15.t(v.name) + " · " + v.capacity }),
    );
  let files = structuredClone(existing.attachments || []);
  E15.form(
    L("Create / edit record", "إنشاء / تعديل سجل"),
    fields,
    {
      ...existing,
      eventId:
        existing.eventId || eventId || E15.activeEvent || state.events[0]?.id,
    },
    (values) => {
      if (values.eventId) values.eventId = +values.eventId;
      if (values.venueId) values.venueId = +values.venueId;
      E15.record.save(collection, { ...values, attachments: files }, id);
    },
    `<div class="attachment-section"><label for="recordFiles">${L("Attachments / photos (local files)", "مرفقات / صور (ملفات محلية)")}</label><input id="recordFiles" type="file" multiple>${E15.filesUI(files)}</div>`,
  );
  $("#recordFiles").onchange = async (e) => {
    try {
      files.push(...(await E15.upload(e.target)));
      toast(L("Files attached", "أُرفقت الملفات"));
    } catch (error) {
      showErrors([error.message]);
    }
  };
};
E15.recordActions = (collection, row) =>
  `${E15.btn(L("Open event", "فتح الفعالية"), "workspace", row.eventId || "")}${E15.allowed(collection === "tasks" ? "task" : collection === "reservations" ? "reservation" : collection === "operations" ? "operation" : collection === "users" ? "users" : "edit") ? E15.btn(L("Edit", "تعديل"), "record-edit", collection + ":" + row.id) + E15.btn(L("Delete", "حذف"), "record-delete", collection + ":" + row.id, "danger") : ""}`;
E15.genericPage = (collection, en, ar) => {
  const rows = E15.filtered(E15.eventRows(collection));
  const columns = {
    tasks: [
      L("Task / Owner", "المهمة / المسؤول"),
      L("Department / Due", "الإدارة / الاستحقاق"),
    ],
    reservations: [
      L("Venue / Capacity", "الموقع / السعة"),
      L("Date / occupied window", "التاريخ / فترة الإشغال"),
    ],
    volunteers: [
      L("Volunteer / Shift", "المتطوع / الفترة"),
      L("Hours / Approved", "الساعات / المعتمدة"),
    ],
    operations: [
      L("Check / Incident", "الفحص / البلاغ"),
      L("Responsible / Severity", "المسؤول / الخطورة"),
    ],
    postReports: [
      L("Event report", "تقرير الفعالية"),
      L("Satisfaction / Achievements", "الرضا / الإنجازات"),
    ],
  };
  const rowsHTML = rows.map((r) => {
    let a, b;
    if (collection === "tasks") {
      a = `<b dir="auto">${esc(translated(r, "title"))}</b><span class="mini">${esc(r.owner || "—")}</span>`;
      b =
        esc(E15.t(r.dept)) +
        " · " +
        fmt(r.due) +
        (r.status !== "Done" && r.due < todayISO()
          ? `<span class="pill Declined">${L("Overdue", "متأخرة")}</span>`
          : "");
    }
    if (collection === "reservations") {
      const v = state.settings.venues.find(
        (v) => String(v.id) === String(r.venueId),
      );
      a = esc(E15.t(v?.name || "Other")) + " · " + (v?.capacity || "—");
      b =
        fmt(r.date) +
        `<bdi class="mini">${r.setupTime || r.startTime} — ${r.breakdownTime || r.endTime}</bdi>`;
    }
    if (collection === "volunteers") {
      a =
        esc(r.name) +
        '<span class="mini">' +
        esc(r.shift) +
        " · " +
        E15.t(r.gender) +
        "</span>";
      b = (r.hours || 0) + " / " + (r.approvedHours || 0);
    }
    if (collection === "operations") {
      a =
        E15.t(r.item) + '<span class="mini">' + esc(r.notes || "") + "</span>";
      b = esc(r.owner) + " · " + E15.t(r.severity);
    }
    if (collection === "postReports") {
      a = E15.eventName(r.eventId);
      b = (r.satisfaction || "—") + "/5 · " + esc(r.achievements || "");
    }
    return [
      a,
      E15.btn(esc(E15.eventName(r.eventId)), "workspace", r.eventId),
      b,
      E15.badge(r.status || (r.resolved ? "Resolved" : "Draft")),
      E15.recordActions(collection, r),
    ];
  });
  const addAction = E15.allowed(
    collection === "tasks"
      ? "task"
      : collection === "reservations"
        ? "reservation"
        : collection === "operations"
          ? "operation"
          : "edit",
  )
    ? E15.btn(L("Add record", "إضافة سجل"), "record-new", collection, "primary")
    : "";
  return (
    E15.title(en, ar, null, null, addAction) +
    E15.toolbar() +
    E15.table(
      [
        columns[collection][0],
        L("Event", "الفعالية"),
        columns[collection][1],
        L("Status", "الحالة"),
        L("Actions", "الإجراءات"),
      ],
      rowsHTML,
    )
  );
};
E15.requestsPage = () => {
  const rows = E15.filtered(state.requests.filter(E15.canReadRequest));
  return (
    E15.title(
      "Event Requests",
      "طلبات الفعاليات",
      "Fourteen steps. One immutable reference. An explicit approval decision.",
      "أربع عشرة خطوة، ومرجع ثابت، وقرار اعتماد واضح.",
      E15.allowed("request")
        ? E15.btn(L("New request", "طلب جديد"), "new-request", "", "primary")
        : "",
    ) +
    `<div class="v15-toolbar"><input id="moduleSearch" value="${esc(E15.filter[page]?.search || "")}" aria-label="${L("Search requests", "بحث الطلبات")}" placeholder="${L("Search reference, title or requester…", "ابحث بالمرجع أو العنوان أو مقدم الطلب…")}"></div>` +
    E15.table(
      [
        L("Reference / Event", "المرجع / الفعالية"),
        L("Requester", "مقدم الطلب"),
        L("Date", "التاريخ"),
        L("Workflow", "الحالة"),
        L("Actions", "الإجراءات"),
      ],
      rows.map((r) => [
        `<bdi>${esc(r.reference || L("Assigned on submission", "يصدر عند التقديم"))}</bdi><b class="mini" dir="auto">${esc(translated(r, "title") || L("Untitled draft", "مسودة بلا عنوان"))}</b>`,
        esc(r.requester),
        fmt(r.date),
        E15.badge(r.workflowStatus),
        E15.btn(L("Open", "فتح"), "request", r.id) +
          (r.eventId
            ? E15.btn(
                L("Event workspace", "مساحة الفعالية"),
                "workspace",
                r.eventId,
              )
            : ""),
      ]),
    )
  );
};
E15.reviewRequest = (id) => {
  const r = E15.entity("requests", id);
  if (!E15.canReadRequest(r)) return deny();
  openModal(
    L("Request review", "مراجعة الطلب") + " · " + (r.reference || r.id),
    `<div class="review-status">${E15.badge(r.workflowStatus)} <b dir="auto">${esc(translated(r, "title"))}</b></div>${E15.describeRequest(r.details)}<div class="decision-history">${(r.decisions || []).map((d) => `<div class="timeline"><b>${E15.t(d.decision)}</b><span>${esc(d.reason)} · ${esc(d.actor?.name || "")} · ${esc(E15.t(d.actor?.approvalAuthority || ""))} · ${fmt(d.time?.slice(0, 10))}</span></div>`).join("")}</div><div class="modal-actions">${E15.allowed("request") && ["Draft", "Rejected"].includes(r.workflowStatus) ? E15.btn(L("Edit draft", "تعديل المسودة"), "edit-request", r.id) : ""}${E15.allowed("reviewEvent") && ["Submitted", "Under Review"].includes(r.workflowStatus) ? E15.btn(L("Review decision", "قرار المراجعة"), "review-request", r.id, "primary") : ""}${r.eventId ? E15.btn(L("Open event workspace", "فتح مساحة الفعالية"), "workspace-modal", r.eventId, "primary") : r.workflowStatus === "Approved" && E15.allowed("reviewEvent") ? E15.btn(L("Create approved workspace", "إنشاء المساحة المعتمدة"), "legacy-workspace", r.id, "primary") : ""}${E15.btn(L("Close", "إغلاق"), "close")}</div>`,
  );
  E15.bind($("#modal"));
};
E15.describeRequest = (d) =>
  `<div class="request-summary">${Object.entries(d || {})
    .filter(
      ([k]) => k !== "guests" || E15.allowed("partners"),
    )
    .map(([k, v]) => {
      const f = E15.wizardSteps.flatMap((s) => s[2]).find((f) => f.key === k),
        repeat = E15.wizardSteps.find((s) => s[3]?.key === k);
      const label = f
        ? L(f.en, f.ar)
        : repeat
          ? L(repeat[0], repeat[1])
          : k === "attachments"
            ? L("Attachments", "المرفقات")
            : k;
      return `<section><h4>${esc(label)}</h4>${
        Array.isArray(v)
          ? k === "attachments"
            ? E15.filesUI(v)
            : v
                .map(
                  (entry) =>
                    `<div class="summary-entry">${Object.entries(entry)
                      .filter(
                        ([key]) =>
                          key !== "restricted" ||
                          E15.allowed("partners"),
                      )
                      .map(([key, value]) => {
                        const rf = repeat?.[3].fields.find(
                          (f) => f.key === key,
                        );
                        return `<div><span>${esc(rf ? L(rf.en, rf.ar) : key)}</span><b dir="auto">${esc(typeof value === "boolean" ? E15.t(value ? "Yes" : "No") : key === "venueId" ? E15.t(state.settings.venues.find((x) => String(x.id) === String(value))?.name || "Other") : value)}</b></div>`;
                      })
                      .join("")}</div>`,
                )
                .join("") || `<p>${L("Not requested", "غير مطلوب")}</p>`
          : `<p dir="auto">${esc(typeof v === "boolean" ? E15.t(v ? "Yes" : "No") : v)}</p>`
      }</section>`;
    })
    .join("")}</div>`;

E15.tasksPage = () =>
  E15.genericPage("tasks", "Tasks & Approvals", "المهام والموافقات") +
  `<section class="card"><div class="section-title"><h3>${L("Department approvals", "موافقات الإدارات")}</h3>${E15.allowed("approval") ? E15.btn(L("Request approval", "طلب موافقة"), "new-approval") : ""}</div>${E15.table(
    [
      L("Event", "الفعالية"),
      L("Department", "الإدارة"),
      L("Status / Reason", "الحالة / السبب"),
      L("History / Decision", "السجل / القرار"),
    ],
    E15.filtered(E15.eventRows("approvals")).map((a) => [
      E15.btn(esc(E15.eventName(a.eventId)), "workspace", a.eventId),
      esc(E15.t(a.dept)),
      E15.badge(a.status) + '<span class="mini">' + esc(a.note) + "</span>",
      `${(a.history || []).map((h) => `<small>${E15.t(h.status)} · ${esc(h.reason)}</small>`).join("<br>")}${E15.allowed("approval") ? E15.btn(L("Decision", "قرار"), "approval", a.id) : ""}`,
    ]),
  )}</section><section class="card"><h3>${L("Separate public calendar approvals", "اعتمادات مستقلة لنشر التقويم العام")}</h3>${E15.table(
    [L("Event", "الفعالية"), L("Publication status", "حالة اعتماد النشر"), L("Decision", "القرار")],
    state.events.filter(e => e.calendarPublication?.status !== "Not Requested").map(e => [
      E15.btn(esc(eventName(e)), "workspace", e.id), E15.badge(e.calendarPublication.status),
      E15.allowed("reviewPublication") && e.calendarPublication.status === "Pending" ? E15.btn(L("Review publication", "مراجعة اعتماد النشر"), "publication-review", e.id) : "—"
    ]))}</section>`;
E15.venuePage = () =>
  E15.genericPage("reservations", "Venue Reservations", "حجوزات المواقع") +
  `<section class="card"><h3>${L("Venue calendar · selected date", "تقويم المواقع · التاريخ المختار")}</h3><label>${L("Date", "التاريخ")}<input type="date" id="venueDay" value="${E15.venueDay || todayISO()}"></label>${E15.table(
    [
      L("Venue", "الموقع"),
      L("Capacity / Equipment", "السعة / التجهيزات"),
      L("Reservations", "الحجوزات"),
    ],
    state.settings.venues.map((v) => [
      E15.t(v.name),
      v.capacity + " · " + esc(v.equipment || ""),
      state.reservations
        .filter(
          (r) =>
            String(r.venueId) === String(v.id) &&
            r.date === (E15.venueDay || todayISO()),
        )
        .map(
          (r) =>
            `<div>${E15.badge(r.status)} <bdi>${r.setupTime || r.startTime}–${r.breakdownTime || r.endTime}</bdi> ${esc(E15.eventName(r.eventId))}</div>`,
        )
        .join("") || L("Available", "متاح"),
    ]),
  )}</section>`;
E15.attendancePage = () => {
  const eventId = +(
      E15.filter[page]?.eventId ||
      E15.activeEvent ||
      state.events.find(E15.isApproved)?.id
    ),
    e = state.events.find((x) => x.id === eventId);
  if (!e) return E15.title("Attendance & QR", "الحضور وQR") + E15.empty();
  const rows = state.registrations.filter((r) => r.eventId === eventId),
    att = rows.filter((r) => r.checkedIn).length;
  return (
    E15.title(
      "Attendance & QR Check-in",
      "الحضور وتسجيل الدخول بـ QR",
      "Local registration and mock identity verification. No SSO is connected.",
      "تسجيل محلي وتحقق هوية تجريبي؛ لا يوجد اتصال بالدخول الموحد.",
      E15.btn(
        L("Register attendee", "تسجيل مشارك"),
        "register",
        eventId,
        "primary",
      ),
    ) +
    `<div class="v15-toolbar">${E15.eventSelect(eventId, true)}${E15.allowed("edit") ? E15.btn(L("Configure windows", "ضبط الفترات"), "attendance-windows", eventId) : ""}${E15.btn(L("CSV export", "تصدير CSV"), "attendance-export", eventId)}</div><div class="grid kpis">${kpi("registered", L("Registered", "المسجلون"), rows.length, L("This event", "هذه الفعالية"))}${kpi("attended", L("Checked in", "الحاضرون"), att, L("Mock verified", "تحقق تجريبي"))}${kpi("noshow", L("No-shows", "المتغيبون"), e.checkinClose && E15.localNow() > e.checkinClose ? rows.length - att : 0, L("Final after check-in closes", "نهائي بعد إغلاق فترة الحضور"))}${kpi("attRate", L("Attendance rate", "نسبة الحضور"), Math.round((att / Math.max(1, rows.length)) * 100) + "%", L("Current rate", "النسبة الحالية"))}</div><div class="grid dash-grid"><div class="card qr-panel"><h3>${esc(eventName(e))}</h3>${E15.referenceHTML(e.reference)}${E15.qr(e)}<p>${L("Scan to open this event registration on the same reachable preview host.", "امسح الرمز لفتح تسجيل هذه الفعالية على مضيف المعاينة المتاح.")}</p>${E15.btn(L("Print QR", "طباعة QR"), "qr-print", eventId)}${E15.btn(L("Download PNG", "تنزيل PNG"), "qr-png", eventId)}${E15.btn(L("Download SVG", "تنزيل SVG"), "qr-download", eventId)}<a class="btn secondary" href="${esc(E15.registrationURL(e))}">${L("Open registration/check-in page", "فتح صفحة التسجيل والحضور")}</a><small>${L("Mock identity verification. A reachable production URL requires backend deployment.", "تحقق تجريبي. الرابط العام الفعلي يحتاج نشرًا وربطًا خلفيًا.")}</small></div><div class="card"><h3>${L("Registration and check-in windows", "فترات التسجيل والحضور")}</h3><p><bdi>${esc(e.registrationOpen || "—")} → ${esc(e.registrationClose || "—")}</bdi></p><p><bdi>${esc(e.checkinOpen || "—")} → ${esc(e.checkinClose || "—")}</bdi></p></div></div>${E15.table(
      [
        L("Name", "الاسم"),
        L("Email / Identity", "البريد / الهوية"),
        L("Attendance", "الحضور"),
        L("Action", "الإجراء"),
      ],
      rows.map((a) => [
        esc(a.name),
        esc(a.email) +
          '<small class="mini">' +
          L("Mock verified", "تحقق تجريبي") +
          "</small>",
        E15.badge(a.checkedIn ? "Completed" : "Pending"),
        !a.checkedIn && E15.allowed("edit")
          ? E15.btn(L("Check in", "تسجيل الحضور"), "checkin", a.id)
          : esc(a.checkedAt || "—"),
      ]),
    )}`
  );
};
E15.registrationURL = e => {
  if (!E15.isApproved(e)) E15.fail("Approve the event before generating QR.", "اعتمد الفعالية قبل إنشاء QR.");
  const url = new URL(location.pathname, location.origin);
  url.searchParams.set("register", String(e.id));
  return url.href;
};
E15.qrCode = e => {
  const code = qrcode(0, "M");
  code.addData(E15.registrationURL(e));
  code.make();
  return code;
};
E15.qrSVG = e => E15.qrCode(e).createSvgTag({cellSize: 4, margin: 16, scalable: true});
E15.qrPNG = e => {
  const qr = E15.qrCode(e), modules = qr.getModuleCount(), scale = 10, quiet = 4;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = (modules + quiet * 2) * scale;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#000000";
  for (let row=0; row<modules; row++) for (let col=0; col<modules; col++)
    if(qr.isDark(row,col)) context.fillRect((col+quiet)*scale,(row+quiet)*scale,scale,scale);
  return canvas.toDataURL("image/png");
};
E15.qr = (e) =>
  E15.isApproved(e)
    ? `<div class="qr-code" aria-label="${L("Event registration QR", "رمز تسجيل الفعالية")}">${E15.qrSVG(e)}</div>`
    : E15.empty(
        L(
          "Approve the event before registration.",
          "اعتمد الفعالية قبل التسجيل.",
        ),
      );
E15.volunteerPage = () =>
  E15.genericPage("volunteers", "Volunteers Management", "إدارة المتطوعين") +
  `<section class="card"><h3>${L("Volunteer summary", "ملخص المتطوعين")}</h3><div class="summary-strip"><b>${E15.eventRows("volunteers").length} ${L("assignments", "تكليفات")}</b><span>${E15.eventRows("volunteers").reduce((n, v) => n + (+v.approvedHours || 0), 0)} ${L("approved hours", "ساعة معتمدة")}</span>${E15.btn(L("Export summary", "تصدير الملخص"), "volunteer-export")}</div></section>`;
E15.changesPage = () =>
  E15.title(
    "Change Requests",
    "طلبات التعديل",
    "Approved events lock critical fields. Only manager-approved changes apply.",
    "الحقول الأساسية للفعاليات المعتمدة مقفلة. لا يُطبق التعديل قبل اعتماد المدير.",
    E15.allowed("change")
      ? E15.btn(L("Request a change", "طلب تعديل"), "change-new", "", "primary")
      : "",
  ) +
  E15.toolbar() +
  E15.table(
    [
      L("Event / Field", "الفعالية / الحقل"),
      L("Old → Proposed", "القديم ← المقترح"),
      L("Reason / Impact", "السبب / الأثر"),
      L("Status", "الحالة"),
      L("Decision", "القرار"),
    ],
    E15.filtered(E15.eventRows("changes")).map((c) => [
      E15.eventName(c.eventId) + " · " + esc(E15.fieldLabel(c.field)),
      `<del>${esc(c.oldValue)}</del> → <b>${esc(c.proposedValue)}</b>`,
      esc(c.reason) + '<small class="mini">' + esc(c.impact || "") + "</small>",
      E15.badge(c.status),
      c.status === "Pending" && E15.allowed("reviewChange")
        ? E15.btn(L("Review", "مراجعة"), "change-review", c.id)
        : esc(c.decisionReason || "—") + `<small>${esc(c.reviewedBy?.name || "")} · ${esc(E15.t(c.reviewedBy?.approvalAuthority || ""))}</small>`,
    ]),
  );
E15.fieldLabel = (key) =>
  ({
    date: L("Date", "التاريخ"),
    startTime: L("Start time", "وقت البداية"),
    endTime: L("End time", "وقت النهاية"),
    campus: L("Campus", "الحرم"),
    expectedAttendance: L("Expected attendance", "الحضور المتوقع"),
    titleAr: L("Arabic title", "العنوان العربي"),
    titleEn: L("English title", "العنوان الإنجليزي"),
  })[key] || key;
E15.operationsPage = () =>
  E15.genericPage("operations", "Operations & Alerts", "التشغيل والتنبيهات") +
  `<section class="card"><h3>${L("Operational alerts", "التنبيهات التشغيلية")}</h3>${E15.table(
    [L("Event", "الفعالية"), L("Alert", "التنبيه"), L("Action", "الإجراء")],
    state.events.flatMap((e) => {
      const alerts = [];
      if (
        state.tasks.some(
          (t) =>
            t.eventId === e.id && t.status !== "Done" && t.due < todayISO(),
        )
      )
        alerts.push(L("Overdue tasks", "مهام متأخرة"));
      if (
        state.reservations.some(
          (r) =>
            r.eventId === e.id && ["Conflict", "Pending"].includes(r.status),
        )
      )
        alerts.push(L("Venue confirmation needed", "الحجز يحتاج تأكيدًا"));
      if (
        state.operations.some(
          (o) => o.eventId === e.id && o.severity === "High" && !o.resolved,
        )
      )
        alerts.push(
          L("Unresolved high-severity incident", "بلاغ عالي الخطورة غير محلول"),
        );
      return alerts.map((a) => [
        esc(eventName(e)),
        a,
        E15.btn(L("Open workspace", "فتح المساحة"), "workspace", e.id),
      ]);
    }),
  )}</section>`;
E15.reportTotals = (id) => ({
  registered: state.registrations.filter((r) => r.eventId === id).length,
  attendance: state.registrations.filter((r) => r.eventId === id && r.checkedIn)
    .length,
  partners: E15.entity("events", id).partners.length,
  volunteers: state.volunteers.filter((v) => v.eventId === id).length,
  hours: state.volunteers
    .filter((v) => v.eventId === id)
    .reduce((n, v) => n + (+v.approvedHours || 0), 0),
  expenses: state.expenses
    .filter((x) => x.eventId === id)
    .filter((x) => x.status === "Purchased")
    .reduce((n, x) => n + (+x.amount || 0), 0),
});
E15.postReportsPage = () =>
  E15.genericPage(
    "postReports",
    "Post-Event Reports",
    "تقارير ما بعد الفعالية",
  ) +
  `<section class="card"><h3>${L("Generate a linked report", "إعداد تقرير مرتبط")}</h3>${E15.table(
    [
      L("Event", "الفعالية"),
      L("Lifecycle", "المرحلة"),
      L("Report / Print", "التقرير / الطباعة"),
    ],
    state.events
      .filter(E15.isApproved)
      .map((e) => [
        esc(eventName(e)) + E15.referenceHTML(e.reference),
        E15.badge(e.lifecycle),
        E15.btn(L("Open report", "فتح التقرير"), "report", e.id),
      ]),
  )}</section>`;
E15.openReport = (id) => {
  const e = E15.entity("events", +id),
    r = state.postReports.find((x) => x.eventId === e.id),
    n = E15.reportTotals(e.id),
    request =
      state.requests.find((r) => r.id === e.sourceRequestId)?.details || {};
  openModal(
    L("Post-Event Report", "التقرير الختامي"),
    `<article class="formal-report" id="formalReport">${printBranding().replace("print-branding", "report-identity")}<h2 dir="auto">${esc(eventName(e))}</h2>${E15.badge(r?.status||"Draft")}<p>${esc(e.reference)} · ${fmt(e.date)} · ${esc(tr(e.campus))}</p><div class="report-metrics">${Object.entries(
      n,
    )
      .map(
        ([key, value]) =>
          `<div><span>${{ registered: L("Registrations", "التسجيلات"), attendance: L("Attendance", "الحضور"), partners: L("Partners", "الشركاء"), volunteers: L("Volunteers", "المتطوعون"), hours: L("Volunteer hours", "ساعات التطوع"), expenses: L("Expenses SAR", "المصروفات ريال") }[key]}</span><b>${value}</b></div>`,
      )
      .join(
        "",
      )}</div><p>${L("Workshops", "الورش")}: ${request.workshops?.length || 0} · ${L("Booths", "الأركان")}: ${(request.booths || []).reduce((n, b) => n + (+b.quantity || 0), 0)}</p>${r ? `<section><h3>${L("Achievements", "الإنجازات")}</h3><p dir="auto">${esc(lang === "en" ? r.achievementsEn || r.achievements : r.achievements)}</p><h3>${L("Challenges", "التحديات")}</h3><p dir="auto">${esc(r.challenges)}</p><h3>${L("Recommendations", "التوصيات")}</h3><p dir="auto">${esc(r.recommendations)}</p><p>${L("Satisfaction", "الرضا")}: ${r.satisfaction}/5</p></section><section lang="en" dir="ltr"><h3>Formal English Report</h3><p>${esc(r.summaryEn || `${r.status==="Completed"?"The event":"Draft report for the event"} "${e.titleEn || e.titleAr}" ${r.status==="Completed"?"took place on":"is scheduled for"} ${e.date}. It recorded ${n.attendance} attendees from ${n.registered} registrations, with ${n.volunteers} volunteers contributing ${n.hours} approved hours. Recorded expenditure: SAR ${n.expenses}.`)}</p></section>${E15.filesUI(r.attachments || [])}` : `<p class="inline-notice">${L("Complete the required report before closing this event.", "أكمل التقرير المطلوب قبل إغلاق الفعالية.")}</p>`}</article><div class="modal-actions">${E15.allowed("report") ? E15.btn(L("Edit report", "تعديل التقرير"), "edit-report", e.id, "primary") : ""}${E15.btn(L("Print / Save PDF", "طباعة / حفظ PDF"), "report-print")}${E15.btn(L("Close", "إغلاق"), "close")}</div>`,
  );
  E15.bind($("#modal"));
};
E15.insightsPage = () => {
  const period = E15.filter.insights?.period || "year",
    year = E15.filter.insights?.year || todayISO().slice(0, 4),
    month = E15.filter.insights?.month || todayISO().slice(5, 7),
    quarter =
      E15.filter.insights?.quarter ||
      String(Math.ceil(+todayISO().slice(5, 7) / 3));
  const events = state.events.filter(
    (e) =>
      e.date?.startsWith(year) &&
      (period === "year" ||
        (period === "month" && e.date.slice(5, 7) === month) ||
        (period === "quarter" &&
          Math.ceil(+e.date.slice(5, 7) / 3) === +quarter)),
  );
  E15.insightEvents = events;
  const ids = new Set(events.map((e) => e.id));
  const counts = Object.fromEntries(
    ["registrations", "volunteers", "expenses", "postReports"].map((key) => [
      key,
      state[key].filter((x) => ids.has(x.eventId)),
    ]),
  );
  const months = {},
    campus = {},
    org = {};
  events.forEach((e) => {
    months[e.date.slice(0, 7)] = (months[e.date.slice(0, 7)] || 0) + 1;
    campus[e.campus] = (campus[e.campus] || 0) + 1;
    const key = orgName(e);
    org[key] = (org[key] || 0) + 1;
  });
  return (
    E15.title(
      "Executive Insights",
      "المؤشرات التنفيذية",
      null,
      null,
      E15.btn(L("Excel export", "تصدير Excel"), "insights-export") +
        E15.btn(L("Print / PDF", "طباعة / PDF"), "print"),
    ) +
    `<div class="v15-toolbar"><label>${L("Period", "الفترة")}<select id="insightPeriod">${["year", "quarter", "month"].map((v) => `<option value="${v}" ${v === period ? "selected" : ""}>${{ year: L("Year", "سنة"), quarter: L("Quarter", "ربع"), month: L("Month", "شهر") }[v]}</option>`).join("")}</select></label><label>${L("Year", "السنة")}<input id="insightYear" type="number" value="${year}" min="2020" max="2100"></label><label>${L("Month", "الشهر")}<input id="insightMonth" type="number" value="${+month}" min="1" max="12"></label><label>${L("Quarter", "الربع")}<input id="insightQuarter" type="number" value="${quarter}" min="1" max="4"></label></div><div class="grid kpis">${kpi("events", L("Events", "الفعاليات"), events.length, L("Filtered period", "الفترة المختارة"))}${kpi("attendance", L("Attendance", "الحضور"), counts.registrations.filter((r) => r.checkedIn).length, L("Checked in", "مسجل الحضور"))}${kpi("volunteers", L("Volunteers", "المتطوعون"), counts.volunteers.length, L("Assignments", "تكليفات"))}${kpi(
      "budget",
      L("Expenses", "المصروفات"),
      counts.expenses
        .filter((e) => e.status === "Purchased")
        .reduce((n, e) => n + (+e.amount || 0), 0),
      L("SAR", "ريال"),
    )}${kpi("satisfaction", L("Satisfaction", "الرضا"), counts.postReports.length ? (counts.postReports.reduce((n, r) => n + (+r.satisfaction || 0), 0) / counts.postReports.length).toFixed(1) + "/5" : "—", L("Report scores", "تقييمات التقارير"))}${kpi("partners", L("Linked partners", "شركاء مرتبطون"), new Set(events.flatMap((e) => e.partners)).size, L("Unique partners", "جهات فريدة"))}</div><section class="card"><h3>${L("Budget planning and procurement", "الميزانيات والتوريد")}</h3><div class="summary-strip"><b>${L("Estimated budgets", "الميزانيات التقديرية")}: ${events.reduce((n, e) => n + (+state.requests.find((r) => r.id === e.sourceRequestId)?.details?.budget || +e.budget || 0), 0)} SAR</b><span>${L("Pending procurement", "مشتريات بانتظار الاعتماد")}: ${counts.expenses.filter((x) => x.status !== "Purchased").reduce((n, x) => n + (+x.amount || 0), 0)} SAR</span><span>${L("Purchased costs", "تكاليف المشتريات")}: ${counts.expenses.filter((x) => x.status === "Purchased").reduce((n, x) => n + (+x.amount || 0), 0)} SAR</span></div></section><div class="grid v15-charts">${E15.chart(L("Events by month", "الفعاليات حسب الشهر"), months, "month")}${E15.chart(L("Events by campus", "الفعاليات حسب الحرم"), campus, "campus")}${E15.chart(L("Events by organizer", "الفعاليات حسب الجهة"), org, "organizer")}</div><section class="card"><h3>${L("Department performance & compliance", "أداء الإدارات والامتثال")}</h3>${E15.table(
      [
        L("Department", "الإدارة"),
        L("Completed tasks", "المهام المكتملة"),
        L("Approved / Total", "المعتمد / الإجمالي"),
      ],
      state.settings.departments.map((d) => [
        E15.t(d),
        state.tasks.filter(
          (t) => ids.has(t.eventId) && t.dept === d && t.status === "Done",
        ).length,
        state.approvals.filter(
          (a) => ids.has(a.eventId) && a.dept === d && a.status === "Approved",
        ).length +
          " / " +
          state.approvals.filter((a) => ids.has(a.eventId) && a.dept === d)
            .length,
      ]),
    )}</section>`
  );
};
E15.chart = (title, values, type) => {
  const max = Math.max(1, ...Object.values(values));
  return `<section class="card"><h3>${title}</h3><div class="horizontal-chart">${
    Object.entries(values)
      .map(
        ([key, n]) =>
          `<button data-v15="chart" data-id="${esc(type + "|" + key)}"><span dir="auto">${esc(E15.t(key))}</span><b>${n}</b><i style="width:${(n / max) * 100}%"></i></button>`,
      )
      .join("") || E15.empty()
  }</div></section>`;
};
E15.annualPage = () => {
  const q = normalizeSearch(E15.filter.calendar?.search || ""),
    camp = E15.filter.calendar?.campus || "All",
    year = E15.filter.calendar?.year || String(calendarYear),
    mode = E15.filter.calendar?.mode || "month",
    category = E15.filter.calendar?.category || "All";
  const rows = state.events.filter(
    (e) =>
      (!e.date || e.date.startsWith(year)) &&
      (!q || normalizeSearch([e.titleEn, e.titleAr].join(" ")).includes(q)) &&
      (camp === "All" || e.campus === camp || e.campus === "Both") &&
      (category === "All" || e.category === category),
  );
  return (
    E15.title(
      "Annual Calendar",
      "التقويم السنوي",
      "Source names and dates preserved. Internal approval is separate from public publication.",
      "الأسماء والتواريخ كما وردت. الاعتماد الداخلي مستقل عن النشر العام.",
      E15.btn(L("CSV", "CSV"), "calendar-csv") +
        E15.btn(L("JSON", "JSON"), "calendar-json"),
    ) +
    `<div class="v15-toolbar"><input id="moduleSearch" type="search" value="${esc(E15.filter.calendar?.search || "")}" aria-label="${L("Search calendar", "بحث التقويم")}" placeholder="${L("Search official titles", "ابحث بالأسماء الرسمية")}"><select id="annualYear" aria-label="${L("Year", "السنة")}">${[
      ...new Set(["2026", "2027", year]),
    ]
      .sort()
      .map((y) => `<option ${year === y ? "selected" : ""}>${y}</option>`)
      .join(
        "",
      )}</select><select id="annualMode" aria-label="${L("View", "العرض")}"><option value="month" ${mode === "month" ? "selected" : ""}>${L("Month", "شهر")}</option><option value="list" ${mode === "list" ? "selected" : ""}>${L("List", "قائمة")}</option></select><select id="annualCampus" aria-label="${L("Campus", "الحرم")}">${["All", "Corniche", "North Obhur", "Both"].map((c) => `<option value="${c}" ${camp === c ? "selected" : ""}>${tr(c)}</option>`).join("")}</select><select id="annualCategory" aria-label="${L("Category", "التصنيف")}">${["All", ...state.settings.categories].map((c) => `<option value="${c}" ${category === c ? "selected" : ""}>${E15.t(c)}</option>`).join("")}</select></div>${
      mode === "month"
        ? `<section class="card">${calendarHTML()}</section>`
        : E15.table(
            [
              L("Event", "الفعالية"),
              L("Date", "التاريخ"),
              L("Campus", "الحرم"),
              L("Lifecycle / Publication", "المرحلة / النشر"),
            ],
            rows.map((e) => [
              E15.btn(esc(eventName(e)), "workspace", e.id),
              fmt(e.date),
              tr(e.campus),
              E15.badge(e.lifecycle) +
                " · " +
                L(
                  e.published ? "Published" : "Not published",
                  e.published ? "منشور" : "غير منشور",
                ) + " · " + E15.badge(e.calendarPublication?.status || "Not Requested"),
            ]),
          )
    }<section class="card"><h3>${L("Unscheduled / TBD events", "فعاليات دون موعد")}</h3>${
      rows
        .filter((e) => !e.date)
        .map((e) => E15.btn(esc(eventName(e)), "workspace", e.id))
        .join("") ||
      E15.empty(L("No unscheduled events.", "لا توجد فعاليات دون موعد."))
    }</section>`
  );
};
E15.accessPage = () =>
  E15.title(
    "Users & Access",
    "المستخدمون والصلاحيات",
    "Role-aware demo interfaces. Production authorization belongs to the backend.",
    "واجهات تجريبية حسب الدور. التفويض الحقيقي مسؤولية النظام الخلفي.",
    E15.allowed("users")
      ? E15.btn(
          L("Add demo user", "إضافة مستخدم تجريبي"),
          "record-new",
          "users",
          "primary",
        )
      : "",
  ) +
  `<section class="card"><label for="demoRoleSwitch">${L("Switch demonstration role", "تبديل الدور التجريبي")}</label><select id="demoRoleSwitch">${E15.roles.map((r) => `<option value="${r}" ${r === role() ? "selected" : ""}>${E15.t(r)}</option>`).join("")}</select><label for="demoDepartment">${L("Supporting department", "الإدارة المساندة")}</label><select id="demoDepartment">${E15.departments.map((d) => `<option ${d === E15.actor().department ? "selected" : ""}>${E15.t(d)}</option>`).join("")}</select><p class="inline-notice">${L("Identity and permissions are simulated locally. Role switching is for demonstration only.", "الهوية والصلاحيات محاكاة محلية. تبديل الأدوار للعرض فقط.")}</p></section>` +
  E15.table(
    [
      L("Name", "الاسم"),
      L("Email", "البريد"),
      L("Role / Department", "الدور / الإدارة"),
      L("Status", "الحالة"),
      L("Actions", "الإجراءات"),
    ],
    state.users.map((u) => [
      esc(u.name),
      esc(u.email),
      E15.t(u.role) + " · " + E15.t(u.department),
      E15.badge(u.status),
      E15.allowed("users")
        ? E15.btn(L("Edit", "تعديل"), "record-edit", "users:" + u.id)
        : "—",
    ]),
  );
E15.logPage = () => {
  const rows = E15.filtered(state.log || []);
  return (
    E15.title("Activity Log", "سجل العمليات") +
    `<div class="v15-toolbar"><input id="moduleSearch" aria-label="${L("Search activity", "بحث السجل")}" value="${esc(E15.filter.log?.search || "")}" placeholder="${L("User, action, entity or reason…", "المستخدم أو الإجراء أو السجل أو السبب…")}"></div>` +
    E15.table(
      [
        L("Timestamp / User", "الوقت / المستخدم"),
        L("Action / Entity", "الإجراء / الكيان"),
        L("Reason", "السبب"),
        L("Changes", "التغييرات"),
      ],
      rows.map((l) => [
        `${esc(l.time)}<small class="mini">${esc(l.actor?.name || l.role || "Demo user")}</small><small>${esc(E15.t(l.actor?.role || ""))} ${esc(E15.t(l.actor?.approvalAuthority || ""))}</small>`,
        `${esc(E15.t(l.action))}<small class="mini">${esc(l.entity || "—")}</small>${E15.referenceHTML(l.reference || E15.auditReference(l.entity, l.before, l.after))}`,
        esc(l.reason || "—"),
        l.before || l.after
          ? `<details><summary>${L("Before / After", "قبل / بعد")}</summary><pre dir="auto">${esc(JSON.stringify({ before: l.before, after: l.after }, (key, value) => (key === "restricted" && !E15.allowed("partners") ? L("Restricted", "مقيد") : value), 2))}</pre></details>`
          : "—",
      ]),
    )
  );
};
E15.settingsPage = () =>
  E15.title(
    "System Settings",
    "إعدادات النظام",
    "Configurable local settings. Policy examples are proposals pending approval.",
    "إعدادات محلية قابلة للتعديل. أمثلة السياسات مقترحات بانتظار الاعتماد.",
    E15.allowed("settings")
      ? E15.btn(
          L("Edit settings", "تعديل الإعدادات"),
          "settings-edit",
          "",
          "primary",
        )
      : "",
  ) +
  `<div class="grid v15-charts"><section class="card"><h3>${L("Departments & Workflow", "الإدارات ومسار الاعتماد")}</h3>${state.settings.departments.map((x) => E15.t(x)).join(" · ")}<p>${state.settings.workflow.map((x) => E15.t(x)).join(" · ")}</p></section><section class="card"><h3>${L("Venues & Categories", "المواقع والتصنيفات")}</h3><p>${state.settings.venues.map((v) => `<div class="repeat-card"><b>${E15.t(v.name)} · ${v.capacity}</b>${E15.allowed("settings") ? E15.btn(L("Edit", "تعديل"), "settings-venue-edit", v.id) : ""}</div>`).join("")}${E15.allowed("settings") ? E15.btn(L("Add venue", "إضافة موقع"), "settings-venue-new") : ""}</p><p>${state.settings.categories.map((x) => E15.t(x)).join(" · ")}</p></section><section class="card"><h3>${L("Regulations & Giveaways", "اللوائح والهدايا")}</h3><p dir="auto">${esc(state.settings.regulations)}</p>${state.settings.giveaways.map((x) => esc(x)).join(" · ")}</section><section class="card"><h3>${L("Proposed policies — pending approval", "سياسات مقترحة — بانتظار الاعتماد")}</h3>${Object.entries(
    state.settings.policies,
  )
    .map(
      ([k, v]) =>
        `<p>${{ standardDays: L("Standard request", "طلب عادي"), majorDays: L("Major/external", "كبير / خارجي"), setupDays: L("Setup requirements", "متطلبات التجهيز"), guestMediaDays: L("Guests/media", "ضيوف / إعلام"), reportDays: L("Post-event report", "التقرير الختامي") }[k] || k}: ${v} ${L("days", "أيام")}</p>`,
    )
    .join(
      "",
    )}<p>${L("Marketing approval before publishing; Finance before purchases.", "اعتماد التسويق قبل النشر، والمالية قبل الشراء.")}</p></section></div><section class="card"><h3>${L("Local data handoff", "تسليم البيانات المحلية")}</h3><p>${L("Exports may include data you enter. Keep private files outside public assets.", "قد تحتوي الصادرات على بيانات تدخلها. احتفظ بالملفات الخاصة خارج الأصول العامة.")}</p>${E15.allowed("settings") ? E15.btn(L("Reset sanitized demo", "إعادة ضبط العرض التجريبي"), "reset-demo") + E15.btn(L("Export development JSON", "تصدير JSON التطوير"), "dataset-export") + `<label class="attachment-section">${L("Restore approved local JSON backup", "استعادة نسخة JSON محلية معتمدة")}<input type="file" id="datasetImport" accept=".json"></label>` : ""}</section>`;
E15.workspaceTabs = [
  ["overview", "Overview", "نظرة عامة"],
  ["original", "Original Request", "الطلب الأصلي"],
  ["schedule", "Schedule & Venues", "الجدول والمواقع"],
  ["tasks", "Tasks & Approvals", "المهام والموافقات"],
  ["guests", "Guests & Partners", "الضيوف والشركاء"],
  ["volunteers", "Volunteers", "المتطوعون"],
  ["budget", "Budget", "الميزانية"],
  ["media", "Designs & Media", "التصاميم والإعلام"],
  ["attendance", "Attendance", "الحضور"],
  ["changes", "Change Requests", "طلبات التعديل"],
  ["report", "Post-Event Report", "التقرير الختامي"],
];
E15.workspace = () => {
  const e = state.events.find((x) => x.id === E15.activeEvent);
  if (!e) return E15.empty();
  const request = state.requests.find((r) => r.id === e.sourceRequestId),
    d = request?.details || {},
    next = {
      Approved: "Preparation",
      Preparation: "Event Day",
      "Event Day": "Post-Event Reporting",
      "Post-Event Reporting": "Closed",
    }[e.lifecycle];
  let body = "";
  const linked = (collection, columns) =>
    E15.table(
      [L("Record", "السجل"), L("Status", "الحالة"), L("Actions", "الإجراءات")],
      state[collection]
        .filter((r) => r.eventId === e.id)
        .map((r) => [
          columns(r),
          E15.badge(r.status || "Draft"),
          E15.recordActions(collection, r),
        ]),
    );
  switch (E15.workspaceTab) {
    case "overview":
      body = `<div class="workspace-overview"><div class="card"><h3>${L("One event. One source of truth.", "فعالية واحدة، وسجل مركزي واحد.")}</h3><dl>${[
        [L("Reference", "المرجع"), e.reference],
        [L("Date", "التاريخ"), fmt(e.date)],
        [L("Time", "الوقت"), (e.startTime || "—") + " – " + (e.endTime || "—")],
        [L("Campus", "الحرم"), tr(e.campus)],
        [L("Readiness", "الجاهزية"), E15.readiness(e.id) + "%"],
        [L("Owner", "المسؤول"), d.primaryOwner || orgName(e)],
      ]
        .map(
          ([k, v]) => `<div><dt>${k}</dt><dd dir="auto">${esc(v)}</dd></div>`,
        )
        .join(
          "",
        )}</dl><div class="progress"><i style="width:${E15.readiness(e.id)}%"></i></div></div><div class="card"><h3>${L("Lifecycle & controls", "دورة الفعالية والتحكم")}</h3><div class="lifecycle">${E15.stages.map((s) => `<span class="${s === e.lifecycle ? "current" : ""}">${E15.t(s)}</span>`).join("")}</div><p class="inline-notice">${E15.isApproved(e) ? L("Critical fields are locked. Submit a change request for date, time, campus, titles or expected attendance.", "الحقول الأساسية مقفلة. قدّم طلب تعديل للتاريخ والوقت والحرم والعناوين والحضور المتوقع.") : L("This is a planning record. An approved request creates an approved event workspace.", "هذا سجل تخطيط. اعتماد الطلب ينشئ مساحة فعالية معتمدة.")}</p>${E15.allowed("edit") ? E15.btn(E15.isApproved(e) ? L("Request change", "طلب تعديل") : L("Edit planning event", "تعديل التخطيط"), E15.isApproved(e) ? "change-new" : "event-edit", e.id) : ""}${e.lifecycle === "Draft" && E15.allowed("edit") ? E15.btn(L("Delete planning event", "حذف سجل التخطيط"), "event-delete", e.id, "danger") : ""}${next && E15.allowed(next === "Closed" ? "close" : "edit") ? E15.btn(E15.t(next), "stage", e.id + "|" + next, "primary") : ""}${E15.publicationUI(e)}</div></div>`;
      break;
    case "original":
      body = `<div class="card">${request ? `<h3><bdi>${esc(request.reference)}</bdi></h3>${E15.describeRequest(d)}` : E15.empty(L("Legacy calendar record: no original request was supplied. New approved requests are linked here automatically.", "سجل تقويم سابق: لا يوجد طلب أصلي مرفق. ترتبط الطلبات الجديدة المعتمدة هنا تلقائيًا."))}</div>`;
      break;
    case "schedule":
      body = `<section class="card"><div class="section-title"><h3>${L("Schedule & venue reservations", "الجدول وحجوزات المواقع")}</h3>${E15.allowed("reservation") ? E15.btn(L("Reserve venue", "حجز موقع"), "record-new", "reservations") : ""}</div>${linked("reservations", (r) => E15.t(state.settings.venues.find((v) => String(v.id) === String(r.venueId))?.name || "Other") + " · " + fmt(r.date) + " · " + r.startTime + "–" + r.endTime)}<h3>${L("Workshops & Activities", "الورش والأنشطة")}</h3>${E15.describeRequest({ workshops: d.workshops || [] })}</section>`;
      break;
    case "tasks":
      body = `<section class="card"><div class="section-title"><h3>${L("Linked tasks", "المهام المرتبطة")}</h3>${E15.allowed("task") ? E15.btn(L("Assign task", "إسناد مهمة"), "record-new", "tasks") : ""}</div>${linked("tasks", (t) => esc(translated(t, "title")) + " · " + esc(t.owner || ""))}<h3>${L("Department approvals", "موافقات الإدارات")}</h3>${E15.table(
        [
          L("Department", "الإدارة"),
          L("Status", "الحالة"),
          L("Reason / Decision", "السبب / القرار"),
        ],
        state.approvals
          .filter((a) => a.eventId === e.id)
          .map((a) => [
            E15.t(a.dept),
            E15.badge(a.status),
            esc(a.note || "") +
              (E15.allowed("approval")
                ? E15.btn(L("Decision", "قرار"), "approval", a.id)
                : ""),
          ]),
      )}</section>`;
      break;
    case "guests":
      body = `<section class="card"><div class="section-title"><h3>${L("Linked partners", "الشركاء المرتبطون")}</h3>${E15.allowed("edit") ? E15.btn(L("Manage selection", "إدارة الاختيار"), "link-partners", e.id) : ""}</div>${
        e.partners
          .map((id) => {
            const p = state.partners.find((p) => p.id === id);
            return p
              ? `<div class="repeat-card"><b dir="auto">${esc(partnerName(p))}</b>${E15.btn(L("Profile", "الملف"), "partner", p.id)}</div>`
              : "";
          })
          .join("") || E15.empty()
      }<h3>${L("Guests & speakers", "الضيوف والمتحدثون")}</h3>${E15.allowed("edit") ? E15.btn(L("Add guest / session", "إضافة ضيف / جلسة"), "guest-new", e.id) : ""}${E15.table(
        [
          L("Name / Type", "الاسم / النوع"),
          L("Session / Arrival", "الجلسة / الوصول"),
          L("Restricted information", "معلومات مقيدة"),
        ],
        [...(d.guests || []), ...(e.guests || [])].map((g) => [
          esc(g.name) + " · " + E15.t(g.type),
          esc(g.session || "") + " · " + esc(g.arrival || ""),
          E15.allowed("partners")
            ? esc(g.restricted || "—")
            : L("Restricted demo view", "عرض تجريبي مقيد"),
        ]),
      )}</section>`;
      break;
    case "volunteers":
      body = `<section class="card"><h3>${L("Volunteer requirements", "متطلبات المتطوعين")}</h3><p>${d.volunteerQuantity || 0} · ${esc(d.volunteerTasks || "")} · ${esc(d.volunteerShifts || "")}</p>${E15.allowed("volunteer") ? E15.btn(L("Assign volunteer", "إسناد متطوع"), "record-new", "volunteers") : ""}${linked("volunteers", (v) => esc(v.name) + " · " + v.hours + " / " + v.approvedHours + " " + L("hours", "ساعة"))}</section>`;
      break;
    case "budget":
      body = `<section class="card"><div class="section-title"><h3>${L("Budget & Procurement", "الميزانية والمشتريات")}</h3>${E15.allowed("expense") ? E15.btn(L("Add expense", "إضافة مصروف"), "record-new", "expenses") : ""}</div><p>${L("Requested budget", "الميزانية المطلوبة")}: ${d.budget || 0} SAR · ${esc(d.budgetOwner || "")}</p><p>${L("Recorded expenses", "المصروفات المسجلة")}: ${E15.reportTotals(e.id).expenses} SAR</p>${linked("expenses", (x) => esc(x.item) + " · " + x.amount + " SAR")}<p class="inline-notice">${L("Finance approval is enforced before the Purchased status.", "يلزم اعتماد المالية قبل حالة تم الشراء.")}</p></section>`;
      break;
    case "media":
      body = `<section class="card"><div class="section-title"><h3>${L("Designs & Media", "التصاميم والإعلام")}</h3>${E15.allowed("media") ? E15.btn(L("New media request", "طلب إعلامي"), "record-new", "designs") : ""}</div>${linked("designs", (x) => E15.t(x.type) + " · " + esc(x.contentAr || x.contentEn || "") + " · " + L(x.published ? "Published" : "Unpublished", x.published ? "منشور" : "غير منشور"))}<p class="inline-notice">${L("Marketing approval is required before the publication flag can be enabled.", "اعتماد التسويق مطلوب قبل تفعيل علامة النشر.")}</p>${E15.filesUI(d.attachments || e.attachments || [])}</section>`;
      break;
    case "attendance": {
      const n = E15.reportTotals(e.id);
      body = `<section class="card qr-panel"><h3>${L("Attendance", "الحضور")}: ${n.attendance} / ${n.registered}</h3>${E15.qr(e)}${E15.btn(L("Manage attendance", "إدارة الحضور"), "event-module", e.id + "|attendance")}</section>`;
      break;
    }
    case "changes":
      body = `<section class="card"><div class="section-title"><h3>${L("Change history", "سجل التعديلات")}</h3>${E15.allowed("change") ? E15.btn(L("Request change", "طلب تعديل"), "change-new", e.id) : ""}</div>${E15.table(
        [
          L("Field", "الحقل"),
          L("Before / Proposed", "قبل / المقترح"),
          L("Status / Decision", "الحالة / القرار"),
        ],
        state.changes
          .filter((c) => c.eventId === e.id)
          .map((c) => [
            E15.fieldLabel(c.field),
            esc(c.oldValue) + " → " + esc(c.proposedValue),
            E15.badge(c.status) + " · " + esc(c.decisionReason || c.reason),
          ]),
      )}</section>`;
      break;
    case "report":
      body = `<section class="card"><h3>${L("Post-event reporting & closure", "التقرير الختامي والإغلاق")}</h3><p>${L("Attendance, partners, volunteer hours, expenses and source request sections are prefilled.", "يُعبّأ الحضور والشركاء وساعات التطوع والمصروفات وأقسام الطلب تلقائيًا.")}</p>${E15.btn(L("Open report", "فتح التقرير"), "report", e.id, "primary")}${next === "Closed" && E15.allowed("close") ? E15.btn(L("Close event", "إغلاق الفعالية"), "stage", e.id + "|Closed") : ""}</section>`;
      break;
  }
  return (
    E15.title(
      eventName(e),
      eventName(e),
      L("Central event workspace", "مساحة الفعالية المركزية") +
        " · " +
        e.reference,
      L("Central event workspace", "مساحة الفعالية المركزية") +
        " · " +
        e.reference,
      E15.badge(e.lifecycle),
    ) +
    `<div class="workspace-tabs" role="tablist">${E15.workspaceTabs.map(([key, en, ar]) => `<button role="tab" aria-controls="workspacePanel" aria-selected="${E15.workspaceTab === key}" data-v15="workspace-tab" data-id="${key}" class="${E15.workspaceTab === key ? "active" : ""}">${L(en, ar)}</button>`).join("")}</div><div role="tabpanel" id="workspacePanel" tabindex="0">${body}</div>`
  );
};
E15.commandDashboard = () => {
  const events = state.events,
    today = todayISO(),
    brief = E15.brief(),
    counts = [
      ["events", "Total Events", "إجمالي الفعاليات", events.length],
      [
        "today",
        "Today's Events",
        "فعاليات اليوم",
        events.filter((e) => e.date === today).length,
      ],
      [
        "week",
        "This Week",
        "هذا الأسبوع",
        events.filter(
          (e) => e.date >= weekRange()[0] && e.date <= weekRange()[1],
        ).length,
      ],
      [
        "month",
        "This Month",
        "هذا الشهر",
        events.filter((e) => e.date?.startsWith(today.slice(0, 7))).length,
      ],
      [
        "upcoming",
        "Upcoming",
        "القادمة",
        events.filter((e) => e.date >= today).length,
      ],
      [
        "requests",
        "Pending Requests",
        "طلبات معلقة",
        state.requests.filter((r) =>
          ["Submitted", "Under Review"].includes(r.workflowStatus),
        ).length,
      ],
      [
        "approvals",
        "Pending Approvals",
        "موافقات معلقة",
        state.approvals.filter((a) => a.status === "Pending").length,
      ],
      [
        "tasks",
        "Overdue Tasks",
        "مهام متأخرة",
        state.tasks.filter((t) => t.status !== "Done" && t.due < today).length,
      ],
      [
        "changes",
        "Pending Changes",
        "تعديلات معلقة",
        state.changes.filter((c) => c.status === "Pending").length,
      ],
      [
        "partners",
        "Active Partners",
        "شركاء نشطون",
        state.partners.filter((p) => partnerRelationship(p) === "Active")
          .length,
      ],
      [
        "operations",
        "Operational Alerts",
        "تنبيهات التشغيل",
        state.operations.filter((o) => !o.resolved && o.status !== "Done")
          .length,
      ],
      [
        "readiness",
        "Event Readiness",
        "جاهزية الفعاليات",
        Math.round(
          events.reduce((n, e) => n + E15.readiness(e.id), 0) /
            Math.max(1, events.length),
        ) + "%",
      ],
    ];
  const base = V14.dashboard();
  const baseParts = base.split('<div class="grid kpis">');
  const hero = baseParts[0];
  const tail =
    baseParts.length > 1
      ? baseParts[1].slice(baseParts[1].indexOf("</div>") + 6)
      : "";
  const upcoming = filteredUpcoming();
  const months = {},
    campuses = {},
    organizers = {};
  events.forEach((e) => {
    if (e.date)
      months[e.date.slice(0, 7)] = (months[e.date.slice(0, 7)] || 0) + 1;
    campuses[e.campus] = (campuses[e.campus] || 0) + 1;
    organizers[orgName(e)] = (organizers[orgName(e)] || 0) + 1;
  });
  return (
    hero +
    `<div class="grid kpis command-kpis">${counts.map(([key, en, ar, n]) => kpi(key, L(en, ar), n, L("Open linked records", "عرض السجلات المرتبطة"))).join("")}</div><section class="card intelligence"><div class="intelligence-icon">${icon("spark")}</div><div><span class="eyebrow">EMU INTELLIGENCE · ${L("RULE-BASED", "تحليل بالقواعد")}</span><h3>${L("Executive brief", "الموجز التنفيذي")}</h3><p>${esc(brief.summary)}</p><small>${L("Calculated locally. No connected generative AI.", "محسوب محليًا. لا توجد خدمة ذكاء اصطناعي توليدي متصلة.")}</small></div>${E15.btn(L("Open intelligence", "فتح الرؤى"), "intelligence")}</section><div class="grid dash-grid"><section class="card"><div class="section-title"><h3>${L("Upcoming events timeline", "مسار الفعاليات القادمة")}</h3>${E15.btn(L("New request", "طلب جديد"), "new-request", "", "primary")}</div><div class="tabs">${[
      ["all", "All", "الكل"],
      ["today", "Today", "اليوم"],
      ["week", "This Week", "هذا الأسبوع"],
      ["month", "This Month", "هذا الشهر"],
      ["corniche", "Corniche", "الكورنيش"],
      ["north", "North Obhur", "أبحر الشمالية"],
    ]
      .map(
        (x) =>
          `<button data-dash-filter="${x[0]}" class="${dashFilter === x[0] ? "active" : ""}">${L(x[1], x[2])}</button>`,
      )
      .join(
        "",
      )}</div>${upcoming.map(eventRow).join("") || E15.empty()}</section><section class="card"><h3>${L("Needs Attention", "يحتاج متابعة")}</h3>${brief.priorities.map((p) => `<button class="alert" data-v15="open-module" data-id="${p.page}"><b>${p.title}</b><span>${p.detail}</span></button>`).join("") || E15.empty(L("No current risks.", "لا توجد مخاطر حالية."))}<div class="quick-actions"><span class="eyebrow">${L("QUICK ACTIONS", "إجراءات سريعة")}</span>${E15.btn(L("New request", "طلب جديد"), "new-request")}${E15.btn(L("Venue calendar", "تقويم المواقع"), "open-module", "venues")}${E15.btn(L("Attendance", "الحضور"), "open-module", "attendance")}${E15.btn(L("Reports", "التقارير"), "open-module", "postreports")}</div></section></div><div class="grid v15-charts">${E15.chart(L("Events by month", "الفعاليات حسب الشهر"), months, "month")}${E15.chart(L("Events by campus", "الفعاليات حسب الحرم"), campuses, "campus")}${E15.chart(L("Events by organizer", "الفعاليات حسب الجهة"), organizers, "organizer")}</div><div class="grid dash-grid"><section class="card"><h3>${L("Interactive calendar", "التقويم التفاعلي")}</h3>${calendarHTML()}</section><section class="card"><h3>${L("Recent activity", "النشاط الأخير")}</h3>${
      (state.log || [])
        .slice(0, 5)
        .map(
          (l) =>
            `<div class="timeline"><b>${esc(E15.t(l.action))}</b><span>${esc(l.actor?.name || "Demo user")} · ${esc(l.time)}</span></div>`,
        )
        .join("") ||
      E15.empty(
        L("Your next action will appear here.", "سيظهر إجراءك التالي هنا."),
      )
    }</section></div>`
  );
};
E15.brief = () => {
  const overdue = state.tasks.filter(
      (t) => t.status !== "Done" && t.due < todayISO(),
    ).length,
    pending = state.approvals.filter((a) => a.status === "Pending").length,
    conflicts = state.reservations.filter(
      (r) => r.status === "Conflict",
    ).length,
    changes = state.changes.filter((c) => c.status === "Pending").length;
  const priorities = [];
  if (overdue && state.settings.notifications.tasks)
    priorities.push({
      page: "tasks",
      title: L("Resolve overdue tasks", "معالجة المهام المتأخرة"),
      detail: L(
        `${overdue} overdue tasks need owners and action.`,
        `${overdue} مهام متأخرة تحتاج متابعة ومسؤولًا.`,
      ),
    });
  if (pending && state.settings.notifications.approvals)
    priorities.push({
      page: "tasks",
      title: L("Review pending approvals", "مراجعة الموافقات المعلقة"),
      detail: L(
        `${pending} decisions are outstanding.`,
        `${pending} قرارات بانتظار الإدارات.`,
      ),
    });
  if (conflicts)
    priorities.push({
      page: "venues",
      title: L("Resolve venue conflicts", "معالجة تعارض المواقع"),
      detail: String(conflicts),
    });
  if (changes)
    priorities.push({
      page: "changes",
      title: L("Review proposed changes", "مراجعة التعديلات المقترحة"),
      detail: String(changes),
    });
  return {
    summary: L(
      `${state.events.length} events, ${overdue} overdue tasks, ${pending} pending approvals, and ${conflicts} venue conflicts. Prioritize blocked events before publication.`,
      `${state.events.length} فعاليات، و${overdue} مهام متأخرة، و${pending} موافقات معلقة، و${conflicts} تعارضات مواقع. أولوية العمل للفعاليات المتعثرة قبل النشر.`,
    ),
    priorities,
  };
};
E15.openIntelligence = () => {
  const brief = E15.brief(),
    recommend = state.partners
      .filter((p) => partnerRelationship(p) === "Active")
      .slice(0, 4);
  openModal(
    L("EMU Intelligence", "رؤى وحدة إدارة الفعاليات"),
    `<span class="pill">${L("Local rules · No connected generative AI", "قواعد محلية · دون اتصال بذكاء توليدي")}</span><h3>${L("Executive brief", "الموجز التنفيذي")}</h3><p>${brief.summary}</p>${brief.priorities.map((p) => `<div class="alert"><b>${p.title}</b><span>${p.detail}</span></div>`).join("")}<h3>${L("Partner suggestions", "ترشيحات الشركاء")}</h3><p>${L("Based only on explicitly Active relationships, not a suitability guarantee.", "استنادًا إلى حالة العلاقة النشطة الصريحة فقط، وليس ضمانًا للملاءمة.")}</p>${recommend.map((p) => `<p dir="auto">${esc(partnerName(p))} · ${esc(translated(p, "cat"))}</p>`).join("")}<label for="askEmu">${L("Ask EMU — rule-based prototype", "اسأل EMU — نموذج بالقواعد")}</label><input id="askEmu" placeholder="${L("Try: tasks, approvals, readiness, partners", "جرّب: المهام، الموافقات، الجاهزية، الشركاء")}"><button class="btn secondary" id="askEmuBtn">${L("Analyze local data", "تحليل البيانات المحلية")}</button><p id="askEmuAnswer" role="status"></p><label for="draftBrief">${L("Editable report draft", "مسودة تقرير قابلة للتحرير")}</label><textarea id="draftBrief">${esc(brief.summary)}</textarea><div class="modal-actions">${E15.btn(L("Download draft", "تنزيل المسودة"), "brief-export")}${E15.btn(L("Close", "إغلاق"), "close")}</div>`,
  );
  E15.bind($("#modal"));
  $("#askEmuBtn").onclick = () => {
    const q = normalizeSearch($("#askEmu").value);
    $("#askEmuAnswer").textContent = /partner|شرك/.test(q)
      ? recommend.map((p) => p.name).join(" · ")
      : brief.summary;
  };
};
Object.assign(E15.handlers, {
  "new-request": () => E15.openWizard(),
  request: (id) => {
    const r = E15.entity("requests", id);
    return ["Draft", "Rejected"].includes(r.workflowStatus) &&
      E15.allowed("request")
      ? E15.openWizard(id)
      : E15.reviewRequest(id);
  },
  "edit-request": (id) => E15.openWizard(id),
  "review-request": (id) =>
    E15.form(
      L("Manager review", "مراجعة المدير"),
      [
        F(
          "decision",
          "Decision",
          "القرار",
          "select",
          ["Under Review", "Approved", "Rejected"],
          true,
        ),
        F("reason", "Reason", "السبب", "textarea", [], true),
      ],
      {},
      (v) => E15.request.review(id, v.decision, v.reason),
    ),
  workspace: (id) => {
    E15.activeEvent = +id;
    E15.workspaceTab = "overview";
    render("workspace");
  },
  "workspace-modal": (id) => {
    closeModal();
    E15.handlers.workspace(id);
  },
  "workspace-tab": (id) => {
    E15.workspaceTab = id;
    render("workspace");
  },
  "record-new": (collection) =>
    E15.openRecord(collection, null, E15.activeEvent),
  "record-edit": (key) => {
    const [collection, id] = key.split(":");
    E15.openRecord(collection, +id);
  },
  "record-delete": (key) => {
    const [collection, id] = key.split(":");
    if (confirm(L("Delete this record?", "حذف هذا السجل؟"))) {
      E15.record.remove(collection, +id);
      render(page);
    }
  },
  "new-approval": () =>
    E15.form(
      L("Department approval request", "طلب موافقة إدارة"),
      [
        F(
          "eventId",
          "Event",
          "الفعالية",
          "select",
          E15.formEventOptions(),
          true,
        ),
        F("dept", "Department", "الإدارة", "select", E15.departments, true),
      ],
      {},
      (v) =>
        E15.record.save("approvals", {
          eventId: +v.eventId,
          dept: v.dept,
          status: "Pending",
          note: "",
          history: [],
        }),
    ),
  approval: (id) =>
    E15.askDecision(L("Department decision", "قرار الإدارة"), (v) =>
      E15.approval(
        +id,
        v.decision === "Rejected" ? "Declined" : v.decision,
        v.reason,
      ),
    ),
  stage: (key) => {
    const [id, next] = key.split("|");
    if (
      confirm(
        L("Move to the next lifecycle stage?", "الانتقال إلى المرحلة التالية؟"),
      )
    ) {
      E15.stage(+id, next);
      render(page);
    }
  },
  "event-edit": (id) => {
    const e = E15.entity("events", +id);
    if (E15.isApproved(e))
      return E15.fail("Submit a change request.", "قدّم طلب تعديل.");
    E15.form(
      L("Planning event", "تخطيط الفعالية"),
      [
        F("titleAr", "Arabic title", "العنوان العربي"),
        F("titleEn", "English title", "العنوان الإنجليزي"),
        F("date", "Date", "التاريخ", "date"),
        F("startTime", "Start", "البداية", "time"),
        F("endTime", "End", "النهاية", "time"),
        F("campus", "Campus", "الحرم", "select", [
          "Corniche",
          "North Obhur",
          "Both",
        ]),
      ],
      e,
      (v) => E15.record.save("events", v, +id),
    );
  },
  "change-new": (id) =>
    E15.form(
      L("Request a critical change", "طلب تعديل أساسي"),
      [
        F(
          "eventId",
          "Event",
          "الفعالية",
          "select",
          state.events
            .filter(E15.isApproved)
            .map((e) => ({ value: e.id, label: eventName(e) })),
          true,
        ),
        F(
          "field",
          "Critical field",
          "الحقل الأساسي",
          "select",
          [
            "date",
            "startTime",
            "endTime",
            "campus",
            "expectedAttendance",
            "titleAr",
            "titleEn",
          ].map((key) => ({ value: key, label: E15.fieldLabel(key) })),
          true,
        ),
        F("proposed", "Proposed value", "القيمة المقترحة", "text", [], true),
        F("reason", "Reason", "السبب", "textarea", [], true),
        F("impact", "Impact", "الأثر", "textarea"),
      ],
      { eventId: id || E15.activeEvent || "" },
      (v) =>
        E15.change.request(+v.eventId, v.field, v.proposed, v.reason, v.impact),
    ),
  "change-review": (id) =>
    E15.askDecision(L("Manager change review", "مراجعة التعديل"), (v) =>
      E15.change.review(+id, v.decision === "Approved", v.reason),
    ),
  register: (id) =>
    E15.form(
      L("Register attendee · mock identity", "تسجيل مشارك · هوية تجريبية"),
      [
        F("name", "Name", "الاسم", "text", [], true),
        F("email", "Email", "البريد الإلكتروني", "email", [], true),
      ],
      { email: E15.actor().name.includes("@") ? E15.actor().name : "" },
      (v) => {
        E15.attendance.register(+id, v);
      },
    ),
  checkin: (id) => {
    E15.attendance.checkin(+id);
    render(page);
    toast(L("Attendance recorded", "تم تسجيل الحضور"));
  },
  "attendance-windows": (id) => {
    const e = E15.entity("events", +id);
    E15.form(
      L("Registration and check-in windows", "فترات التسجيل والحضور"),
      [
        "registrationOpen",
        "registrationClose",
        "checkinOpen",
        "checkinClose",
      ].map((key, i) =>
        F(
          key,
          [
            "Registration opens",
            "Registration closes",
            "Check-in opens",
            "Check-in closes",
          ][i],
          ["بداية التسجيل", "نهاية التسجيل", "بداية الحضور", "نهاية الحضور"][i],
          "datetime-local",
          [],
          true,
        ),
      ),
      e,
      (v) => {
        if (
          v.registrationClose <= v.registrationOpen ||
          v.checkinClose <= v.checkinOpen
        )
          E15.fail(
            "Window end must follow start.",
            "نهاية الفترة يجب أن تلي بدايتها.",
          );
        E15.record.save("events", v, +id);
      },
    );
  },
  "attendance-export": (id) =>
    E15.csv("EMU-attendance.csv", [
      [L("Reference", "المرجع"), L("Name", "الاسم"), L("Email", "البريد"), L("Attendance", "الحضور")],
      ...state.registrations
        .filter((a) => a.eventId === +id)
        .map((a) => [
          E15.entity("events", +id).reference || "",
          a.name,
          a.email,
          a.checkedIn ? E15.t("Completed") : E15.t("Pending"),
        ]),
    ]),
  "qr-png": (id) => {
    const e = E15.entity("events", +id), a = document.createElement("a");
    a.href = E15.qrPNG(e); a.download = (e.reference || "EMU-" + e.id) + "-registration.png";
    a.click();
  },
  "qr-download": (id) =>
    E15.download(
      "EMU-" + id + "-registration.svg",
      E15.qrSVG(E15.entity("events", +id)),
      "image/svg+xml",
    ),
  "qr-print": (id) => {
    openModal(
      L("Event QR", "رمز الفعالية"),
      `<div class="qr-panel formal-report"><h2>${esc(E15.eventName(id))}</h2>${E15.referenceHTML(E15.entity("events", +id).reference)}${E15.qr(E15.entity("events", +id))}</div><div class="modal-actions">${E15.btn(L("Print", "طباعة"), "report-print")}${E15.btn(L("Close", "إغلاق"), "close")}</div>`,
    );
    E15.bind($("#modal"));
  },
  "volunteer-export": () =>
    E15.xlsx(
      "EMU-volunteers.xlsx",
      E15.eventRows("volunteers").map((v) => ({
        Event: E15.eventName(v.eventId),
        Name: v.name,
        Gender: v.gender,
        Shift: v.shift,
        Hours: v.hours,
        ApprovedHours: v.approvedHours,
        Status: v.status,
      })),
    ),
  report: (id) => E15.openReport(+id),
  "edit-report": (id) => {
    const r = state.postReports.find((r) => r.eventId === +id);
    E15.openRecord("postReports", r?.id, +id);
  },
  "report-print": () => {
    document.body.classList.add("printing-dialog");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-dialog"), 1000);
  },
  "insights-export": () =>
    E15.xlsx(
      "EMU-executive-insights.xlsx",
      (E15.insightEvents || state.events).map((e) => ({
        Reference: e.reference,
        Event: eventName(e),
        Date: e.date,
        Campus: e.campus,
        ...E15.reportTotals(e.id),
        Readiness: E15.readiness(e.id),
      })),
    ),
  chart: (key) => {
    const [type, value] = key.split("|");
    E15.chartFilter = { type, value };
    render("events");
  },
  "calendar-csv": () =>
    E15.csv("EMU-annual-calendar.csv", [
      ["Reference", "Event", "Date", "Campus", "Lifecycle", "Published"],
      ...E15.calendarRows().map((e) => [
        e.reference,
        eventName(e),
        e.date,
        e.campus,
        e.lifecycle,
        e.published,
      ]),
    ]),
  "calendar-json": () =>
    E15.download("EMU-annual-calendar.json", E15.calendarRows()),
  "open-module": (id) => render(id),
  "event-module": (key) => {
    const [id, module] = key.split("|");
    E15.filter[module] ??= {};
    E15.filter[module].eventId = id;
    render(module);
  },
  intelligence: () => E15.openIntelligence(),
  "brief-export": () =>
    E15.download(
      "EMU-executive-brief.txt",
      $("#draftBrief").value,
      "text/plain;charset=utf-8",
    ),
  partner: (id) => {
    if (!canEdit()) return deny();
    partnerModal(+id);
  },
  "link-partners": (id) => {
    const e = E15.entity("events", +id);
    E15.form(
      L("Linked partners", "الشركاء المرتبطون"),
      [],
      {},
      () =>
        E15.transaction(() => {
          E15.guard("edit");
          const before = structuredClone(e);
          e.partners = [
            ...$("#modalBody").querySelectorAll("[data-link]:checked"),
          ].map((c) => +c.dataset.link);
          E15.audit("Partners linked", "event:" + id, before, e);
        }),
      `<label for="workspacePartnerSearch">${L("Search partners", "بحث الشركاء")}</label><input id="workspacePartnerSearch" type="search"><div class="partner-options">${state.partners.map((p) => `<label class="partner-option"><input type="checkbox" data-link="${p.id}" ${e.partners.includes(p.id) ? "checked" : ""}><span dir="auto">${esc(partnerName(p))}</span></label>`).join("")}</div>`,
    );
    $("#workspacePartnerSearch").oninput = (ev) => {
      const q = normalizeSearch(ev.target.value);
      document
        .querySelectorAll("[data-link]")
        .forEach(
          (c) =>
            (c.closest("label").hidden = !normalizeSearch(
              state.partners.find((p) => p.id === +c.dataset.link).name,
            ).includes(q)),
        );
    };
  },
  "guest-new": (id) =>
    E15.form(
      L("Guest / speaker", "ضيف / متحدث"),
      E15.wizardSteps[10][3].fields,
      {},
      (v) =>
        E15.transaction(() => {
          E15.guard("edit");
          const e = E15.entity("events", +id);
          e.guests ??= [];
          e.guests.push(v);
          E15.audit("Guest added", "event:" + id, null, v);
        }),
    ),
  publication: (id) => { E15.publication.request(+id); render(page); },
  "publication-review": (id) => E15.askDecision(
    L("Separate calendar publication decision", "قرار مستقل لنشر التقويم"),
    (v) => { E15.publication.review(+id, v.decision, v.reason); render(page); }),
  "publication-withdraw": (id) => { E15.publication.withdraw(+id); render(page); },
  "dataset-export": () => {
    E15.guard("settings");
    E15.download("EMU-V15-local-development.private.json", state);
  },
  "settings-edit": () => E15.editSettings(),
});
E15.calendarRows = () =>
  state.events.filter(
    (e) =>
      !e.date ||
      e.date.startsWith(E15.filter.calendar?.year || String(calendarYear)),
  );
E15.editSettings = () => {
  const s = state.settings;
  E15.form(
    L("Local system settings", "إعدادات النظام المحلية"),
    [
      F(
        "departments",
        "Departments (one per line)",
        "الإدارات (كل إدارة بسطر)",
        "textarea",
        [],
        true,
      ),
      F(
        "categories",
        "Categories (one per line)",
        "التصنيفات (كل تصنيف بسطر)",
        "textarea",
        [],
        true,
      ),
      F(
        "workflow",
        "Approval departments (one per line)",
        "إدارات الاعتماد (كل إدارة بسطر)",
        "textarea",
        [],
        true,
      ),
      F(
        "giveaways",
        "Giveaway options (one per line)",
        "خيارات الهدايا (كل خيار بسطر)",
        "textarea",
      ),
      F("regulations", "Regulations", "اللوائح", "textarea", [], true),
      F(
        "standardDays",
        "Standard request lead days",
        "مهلة الطلب العادي",
        "number",
        [],
        true,
        { min: 0 },
      ),
      F(
        "majorDays",
        "Major request lead days",
        "مهلة الطلب الكبير",
        "number",
        [],
        true,
        { min: 0 },
      ),
      F("setupDays", "Setup lead days", "مهلة التجهيز", "number", [], true, {
        min: 0,
      }),
      F(
        "guestMediaDays",
        "Guests/media lead days",
        "مهلة الضيوف والإعلام",
        "number",
        [],
        true,
        { min: 0 },
      ),
      F("reportDays", "Report due days", "مهلة التقرير", "number", [], true, {
        min: 0,
      }),
      F(
        "notifyTasks",
        "Task notifications (local)",
        "تنبيهات المهام (محلية)",
        "checkbox",
      ),
      F(
        "notifyApprovals",
        "Approval notifications (local)",
        "تنبيهات الموافقات (محلية)",
        "checkbox",
      ),
      F(
        "calendarYear",
        "Default calendar year",
        "سنة التقويم الافتراضية",
        "number",
        [],
        true,
        { min: 2026, max: 2100 },
      ),
      F("weekStart", "Calendar week start", "بداية أسبوع التقويم", "select", [
        { value: 0, label: L("Sunday", "الأحد") },
        { value: 1, label: L("Monday", "الاثنين") },
      ]),
    ],
    {
      departments: s.departments.join("\n"),
      categories: s.categories.join("\n"),
      workflow: s.workflow.join("\n"),
      giveaways: s.giveaways.join("\n"),
      regulations: s.regulations,
      venues: JSON.stringify(s.venues, null, 2),
      ...s.policies,
      notifyTasks: s.notifications.tasks,
      notifyApprovals: s.notifications.approvals,
      calendarYear: s.calendar.year,
      weekStart: s.calendar.weekStart,
    },
    (v) =>
      E15.transaction(() => {
        E15.guard("settings");
        const venues = state.settings.venues;
        if (
          !Array.isArray(venues) ||
          !venues.length ||
          venues.some(
            (x) => !Number.isSafeInteger(x.id) || !x.name || !(+x.capacity > 0),
          ) ||
          new Set(venues.map((x) => x.id)).size !== venues.length
        )
          E15.fail(
            "Check venue IDs and capacities.",
            "تحقق من معرفات المواقع وسعاتها.",
          );
        if (
          state.reservations.some(
            (r) => !venues.some((v) => String(v.id) === String(r.venueId)),
          )
        )
          E15.fail(
            "Cannot remove a venue used by reservations.",
            "لا يمكن إزالة موقع مرتبط بحجوزات.",
          );
        const before = structuredClone(s);
        const list = (k) => [
          ...new Set(
            v[k]
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
          ),
        ];
        Object.assign(s, {
          departments: list("departments"),
          categories: list("categories"),
          workflow: list("workflow"),
          giveaways: list("giveaways"),
          regulations: v.regulations,
          venues,
          policies: Object.fromEntries(
            [
              "standardDays",
              "majorDays",
              "setupDays",
              "guestMediaDays",
              "reportDays",
            ].map((k) => [k, +v[k]]),
          ),
          notifications: {
            ...s.notifications,
            tasks: v.notifyTasks,
            approvals: v.notifyApprovals,
          },
          calendar: { year: +v.calendarYear, weekStart: +v.weekStart },
        });
        calendarYear = +v.calendarYear;
        E15.audit("Settings updated", "settings", before, s);
      }),
  );
};

E15.publicationUI = (e) => {
  const p = e.calendarPublication || {status: "Not Requested", history: []};
  return `<section class="publication-review"><h4>${L("Public calendar approval", "اعتماد نشر التقويم العام")}</h4>
    ${E15.badge(p.status)}
    ${E15.allowed("edit") && !["Pending", "Approved"].includes(p.status) ? E15.btn(L("Request calendar publication", "طلب اعتماد نشر التقويم"), "publication", e.id) : ""}
    ${E15.allowed("reviewPublication") && p.status === "Pending" ? E15.btn(L("Review publication", "مراجعة اعتماد النشر"), "publication-review", e.id) : ""}
    ${E15.allowed("edit") && ["Pending", "Approved"].includes(p.status) ? E15.btn(L("Withdraw publication", "سحب النشر"), "publication-withdraw", e.id) : ""}
    <small>${L("Separate local approval; no website is published. Event and Marketing approvals do not automatically approve publication.", "اعتماد محلي مستقل؛ لا يحدث نشر فعلي. اعتماد الفعالية والتسويق لا يعتمدان النشر تلقائيًا.")}</small>
    ${p.history.map(h => `<p>${esc(E15.t(h.action))} · ${esc(h.reason || "")} · ${esc(h.actor?.name || "")} · ${esc(E15.t(h.actor?.approvalAuthority || ""))} · <bdi>${esc(h.time)}</bdi></p>`).join("")}</section>`;
};
