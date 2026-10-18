/* Fourteen persisted request steps. Repeatable sections have no fixed entry limit. */
const F = E15.field;
E15.wizardSteps = [
  [
    "Requester",
    "مقدم الطلب",
    [
      F("requester", "Requester name", "اسم مقدم الطلب", "text", [], true),
      F("email", "Email", "البريد الإلكتروني", "email", [], true),
      F("phone", "Phone", "الهاتف", "tel", [], true),
      F(
        "department",
        "Department / College",
        "الإدارة / الكلية",
        "text",
        [],
        true,
      ),
      F(
        "primaryOwner",
        "Primary event owner",
        "المسؤول الأساسي",
        "text",
        [],
        true,
      ),
      F("alternateOwner", "Alternate owner", "المسؤول البديل"),
    ],
  ],
  [
    "Event details",
    "تفاصيل الفعالية",
    [
      F("titleAr", "Arabic title", "العنوان العربي", "text", [], true),
      F("titleEn", "English title", "العنوان الإنجليزي", "text", [], true),
      F("descriptionAr", "Arabic description", "الوصف العربي", "textarea"),
      F("descriptionEn", "English description", "الوصف الإنجليزي", "textarea"),
      F(
        "category",
        "Category",
        "التصنيف",
        "select",
        E15.defaultSettings.categories,
        true,
      ),
      F("organizingUnit", "Organizing unit", "الجهة المنظمة", "text", [], true),
      F("date", "Event date", "تاريخ الفعالية", "date", [], true),
      F("startTime", "Start time", "وقت البداية", "time", [], true),
      F("endTime", "End time", "وقت النهاية", "time", [], true),
      F("setupTime", "Setup time", "وقت التجهيز", "time"),
      F("breakdownTime", "Breakdown time", "وقت التفكيك", "time"),
      F(
        "campus",
        "Campus",
        "الحرم",
        "select",
        ["Corniche", "North Obhur", "Both"],
        true,
      ),
      F(
        "expectedAttendance",
        "Expected attendance",
        "الحضور المتوقع",
        "number",
        [],
        true,
        { min: 1 },
      ),
      F(
        "audience",
        "Target audience",
        "الجمهور المستهدف",
        "select",
        [
          "University Community Only",
          "Public Only",
          "Open to Public + University Community",
        ],
        true,
      ),
    ],
  ],
  [
    "Venues",
    "المواقع",
    [],
    {
      key: "venues",
      fields: [
        F("venueId", "Venue", "الموقع", "select", [], true),
        F("seating", "Seating", "المقاعد", "number", [], true, { min: 0 }),
        F("tables", "Tables", "الطاولات", "number", [], false, { min: 0 }),
        F("layout", "Layout", "التوزيع", "select", [
          "Theater",
          "Classroom",
          "Round tables",
        ]),
        F("stage", "Stage", "منصة", "checkbox"),
        F("podium", "Podium", "منصة إلقاء", "checkbox"),
        F("equipment", "Equipment", "التجهيزات", "textarea"),
        F("notes", "Notes", "ملاحظات", "textarea"),
      ],
    },
  ],
  [
    "Workshops & Activities",
    "الورش والأنشطة",
    [],
    {
      key: "workshops",
      fields: [
        F("name", "Name", "الاسم", "text", [], true),
        F("description", "Description", "الوصف", "textarea"),
        F("date", "Date", "التاريخ", "date", [], true),
        F("time", "Time", "الوقت", "time"),
        F("venue", "Venue", "الموقع"),
        F("capacity", "Capacity", "السعة", "number", [], true, { min: 1 }),
        F("equipment", "Equipment", "التجهيزات"),
        F("owner", "Owner", "المسؤول"),
        F(
          "registration",
          "Registration requirements",
          "متطلبات التسجيل",
          "textarea",
        ),
      ],
    },
  ],
  [
    "Booths",
    "الأركان",
    [],
    {
      key: "booths",
      fields: [
        F("type", "Booth type", "نوع الركن", "select", [
          "University Booths",
          "External Booths",
        ]),
        F("quantity", "Quantity", "العدد", "number", [], true, { min: 1 }),
        F("organizations", "Organizations", "الجهات"),
        F("dimensions", "Dimensions", "الأبعاد"),
        F("signage", "Signage", "اللوحات"),
        F("electricity", "Electricity", "الكهرباء", "checkbox"),
        F("installation", "Installation", "التركيب"),
        F("access", "Access requirements", "متطلبات الدخول"),
        F("security", "Security requirements", "متطلبات الأمن"),
      ],
    },
  ],
  [
    "Volunteers",
    "المتطوعون",
    [
      F("volunteerQuantity", "Quantity", "العدد", "number", [], false, {
        min: 0,
      }),
      F("volunteerGender", "Allocation", "التوزيع", "select", [
        "Both",
        "Male",
        "Female",
      ]),
      F("volunteerTasks", "Tasks", "المهام", "textarea"),
      F("volunteerLocation", "Location", "الموقع"),
      F("volunteerShifts", "Shifts", "الفترات"),
      F(
        "volunteerHours",
        "Estimated hours",
        "الساعات المتوقعة",
        "number",
        [],
        false,
        { min: 0 },
      ),
    ],
  ],
  [
    "Design & Media",
    "التصميم والإعلام",
    [],
    {
      key: "media",
      fields: [
        F("type", "Request type", "نوع الطلب", "select", [
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
        F("dimensions", "Dimensions", "الأبعاد"),
        F("deadline", "Deadline", "الموعد النهائي", "date"),
        F("approvedLogos", "Approved logos", "الشعارات المعتمدة", "checkbox"),
        F("screenCampus", "Screen campus", "حرم الشاشات", "select", [
          "Corniche",
          "North Obhur",
          "Both",
        ]),
        F("displayStart", "Display start", "بداية العرض", "date"),
        F("displayEnd", "Display end", "نهاية العرض", "date"),
      ],
    },
  ],
  [
    "Hospitality & Giveaways",
    "الضيافة والهدايا",
    [
      F("hospitalityType", "Hospitality type", "نوع الضيافة"),
      F("hospitalityQuantity", "Quantity", "العدد", "number", [], false, {
        min: 0,
      }),
      F("hospitalityTiming", "Timing", "التوقيت"),
      F("beneficiaries", "Beneficiaries", "المستفيدون"),
      F("universityGiveaways", "University giveaways", "هدايا الجامعة"),
      F("externalGiveaways", "External giveaways", "هدايا خارجية"),
      F("supplier", "Supplier / Provider", "المورد"),
      F(
        "hostResponsibility",
        "Event host responsibility",
        "مسؤولية مستضيف الفعالية",
        "textarea",
      ),
    ],
  ],
  [
    "Budget & Procurement",
    "الميزانية والمشتريات",
    [
      F(
        "budget",
        "Estimated budget (SAR)",
        "الميزانية التقديرية (ريال)",
        "number",
        [],
        false,
        { min: 0 },
      ),
      F("budgetOwner", "Budget owner", "مسؤول الميزانية"),
      F("sponsorship", "Sponsorship", "الرعاية"),
      F("purchases", "Purchases", "المشتريات", "textarea"),
      F(
        "financeRequired",
        "Finance approval requested",
        "طلب اعتماد المالية",
        "checkbox",
      ),
    ],
  ],
  [
    "Music & Performances",
    "الموسيقى والعروض",
    [
      F("performanceType", "Type", "النوع"),
      F(
        "performerCount",
        "Performer count",
        "عدد المؤدين",
        "number",
        [],
        false,
        { min: 0 },
      ),
      F("duration", "Duration", "المدة"),
      F("rehearsal", "Rehearsal", "البروفة"),
      F("performanceEquipment", "Equipment", "التجهيزات"),
      F("performanceBudget", "Budget", "الميزانية", "number", [], false, {
        min: 0,
      }),
    ],
  ],
  [
    "Guests & Speakers",
    "الضيوف والمتحدثون",
    [],
    {
      key: "guests",
      fields: [
        F("name", "Name", "الاسم", "text", [], true),
        F("type", "Type", "النوع", "select", ["Guests", "Speaker", "partners"]),
        F("partnerId", "Partner ID (optional)", "معرف الشريك (اختياري)"),
        F("session", "Session", "الجلسة"),
        F("arrival", "Arrival information", "معلومات الوصول"),
        F(
          "restricted",
          "Restricted sensitive information — demo access",
          "معلومات حساسة مقيدة — صلاحية تجريبية",
          "textarea",
        ),
      ],
    },
  ],
  [
    "Certificates",
    "الشهادات",
    [],
    {
      key: "certificates",
      fields: [
        F("type", "Certificate type", "نوع الشهادة", "select", [
          "Participation",
          "Speaker",
          "Volunteer",
          "Attendance",
        ]),
        F("issuer", "Issuer", "جهة الإصدار"),
        F("quantity", "Quantity", "العدد", "number", [], false, { min: 1 }),
        F("nameAr", "Arabic name", "الاسم العربي", "text", [], true),
        F("nameEn", "English name", "الاسم الإنجليزي"),
      ],
    },
  ],
  ["Attachments", "المرفقات", []],
  [
    "Regulations & Acknowledgment",
    "اللوائح والإقرار",
    [
      F(
        "acknowledged",
        "I accept the event regulations and confirm the supplied information.",
        "أوافق على لوائح الفعاليات وأقر بصحة المعلومات.",
        "checkbox",
        [],
        true,
      ),
    ],
  ],
];
E15.wizard = { step: 0, details: {}, id: null };
E15.openWizard = (id) => {
  E15.guard("request");
  const r = id ? E15.entity("requests", id) : null;
  if (r && !["Draft", "Rejected"].includes(r.workflowStatus))
    return E15.reviewRequest(id);
  E15.wizard = {
    id: r?.id || null,
    step: 0,
    details: structuredClone(
      r?.details || {
        category: state.settings.categories[0],
        campus: "Corniche",
        audience: "University Community Only",
      },
    ),
  };
  E15.drawWizard();
};
E15.wizardCapture = () => {
  const w = E15.wizard,
    step = E15.wizardSteps[w.step];
  Object.assign(w.details, E15.collect(step[2], $("#modalBody")));
};
E15.drawWizard = () => {
  const w = E15.wizard,
    step = E15.wizardSteps[w.step],
    repeat = step[3];
  if (w.step === 1)
    step[2].find((f) => f.key === "category").options =
      state.settings.categories;
  const repeatRows = repeat ? w.details[repeat.key] || [] : [];
  openModal(
    L("Event Request", "طلب فعالية") + ` · ${w.step + 1}/14`,
    `<div class="wizard-progress" role="progressbar" aria-label="${L("Request progress","تقدم الطلب")}" aria-valuemin="0" aria-valuemax="14" aria-valuenow="${w.step+1}"><div style="width:${((w.step + 1) / 14) * 100}%"></div></div><div class="wizard-heading"><span class="eyebrow">${L("REQUEST WORKSPACE", "مساحة الطلب")}</span><h3>${L(step[0], step[1])}</h3><p>${L("Drafts stay in this browser. Submission does not imply approval.", "المسودات محفوظة محليًا. تقديم الطلب لا يعني اعتماده.")}</p></div>${w.step === 0 && !w.id ? E15.btn(L("Fill a sanitized demo request", "تعبئة طلب تجريبي منقح"), "wizard-demo") : ""}<div class="wizard-chips">${E15.wizardSteps.map((s, i) => `<button type="button" data-step="${i}" aria-label="${i+1}. ${L(s[0],s[1])}" class="${w.step === i ? "active" : ""}">${i + 1}<span>${L(...s)}</span></button>`).join("")}</div>${w.step === 13 ? `<div class="policy-card"><b>${L("Proposed policies — pending approval", "سياسات مقترحة — بانتظار الاعتماد")}</b><p dir="auto">${esc(state.settings.regulations)}</p><p>${L(`Standard requests: ${state.settings.policies.standardDays} days; major/external: ${state.settings.policies.majorDays} days. Marketing before publication; Finance before purchases.`, `الطلبات العادية: ${state.settings.policies.standardDays} يومًا؛ الكبرى والخارجية: ${state.settings.policies.majorDays} يومًا. اعتماد التسويق قبل النشر والمالية قبل الشراء.`)}</p></div>` : ""}<div class="form-grid">${step[2].map((f) => E15.input(f, w.details[f.key], "w-")).join("")}</div>${repeat ? `<div class="repeat-section">${E15.btn(L("Add entry", "إضافة عنصر"), "wizard-add", repeat.key, "primary")}${repeatRows.length ? repeatRows.map((r, i) => `<div class="repeat-card"><b dir="auto">${esc(r.name || r.nameAr || E15.t(r.type) || state.settings.venues.find((v) => String(v.id) === String(r.venueId))?.name || L("Entry", "عنصر"))}</b><span>${esc(r.description || r.contentAr || r.layout || "")}</span><div>${E15.btn(L("Edit", "تعديل"), "wizard-edit", i)}${E15.btn(L("Remove", "إزالة"), "wizard-remove", i, "danger")}</div></div>`).join("") : E15.empty(L("Add entries only when needed. Venues require at least one entry.", "أضف العناصر عند الحاجة. يلزم اختيار موقع واحد على الأقل."))}</div>` : ""}${[6, 8, 10, 12].includes(w.step) ? `<section class="attachment-section"><label for="wizardFiles">${L("Reference / supporting files (5 MB each)", "ملفات مرجعية / داعمة (5 ميجابايت لكل ملف)")}</label><input id="wizardFiles" type="file" multiple>${E15.filesUI(w.details.attachments || [])}</section>` : ""}${w.step === 11 ? `<label class="attachment-section">${L("Import certificate names from Excel or CSV (Arabic Name / English Name)", "استيراد أسماء الشهادات من Excel أو CSV (Arabic Name / English Name)")}${E15.btn(L("Download Excel template", "تنزيل قالب Excel"), "certificate-template")}<input id="certificateImport" type="file" accept=".xlsx,.xls,.csv"></label>` : ""}<div class="modal-actions">${w.step ? E15.btn(L("Previous", "السابق"), "wizard-prev") : ""}${E15.btn(L("Save Draft", "حفظ مسودة"), "wizard-draft")}${w.step < 13 ? E15.btn(L("Next", "التالي"), "wizard-next", "", "primary") : E15.btn(L("Submit Request", "تقديم الطلب"), "wizard-submit", "", "primary")}</div>`,
  );
  E15.bind($("#modal"));
  $("#modal")
    .querySelectorAll("[data-step]")
    .forEach(
      (b) =>
        (b.onclick = () => {
          E15.wizardCapture();
          w.step = +b.dataset.step;
          E15.drawWizard();
        }),
    );
  if (w.step === 5 && $("#w-volunteerQuantity")) {
    const update = () => {
      for (const key of [
        "volunteerGender",
        "volunteerTasks",
        "volunteerLocation",
        "volunteerShifts",
        "volunteerHours",
      ])
        $("#w-" + key).closest(".field").hidden = !(
          +$("#w-volunteerQuantity").value > 0
        );
    };
    $("#w-volunteerQuantity").oninput = update;
    update();
  }
  if ($("#wizardFiles"))
    $("#wizardFiles").onchange = async (e) => {
      try {
        w.details.attachments = [
          ...(w.details.attachments || []),
          ...(await E15.upload(e.target)),
        ];
        E15.wizardCapture();
        E15.drawWizard();
      } catch (error) {
        showErrors([error.message]);
      }
    };
  if ($("#certificateImport"))
    $("#certificateImport").onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024)
          throw Error(
            L("Excel import limit: 1 MB.", "حد ملف Excel ميجابايت واحد."),
          );
        const wb = XLSX.read(await file.arrayBuffer(), {
          type: "array",
          sheetRows: 1001,
        });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (rows.length > 1000)
          throw Error(L("Limit: 1000 names.", "الحد 1000 اسم."));
        w.details.certificates ??= [];
        for (const row of rows) {
          const nameAr = String(
            row["Arabic Name"] || row["الاسم العربي"] || "",
          ).trim();
          if (!nameAr)
            throw Error(
              L("Every row requires Arabic Name.", "كل صف يتطلب الاسم العربي."),
            );
          w.details.certificates.push({
            type: "Participation",
            nameAr,
            nameEn: String(row["English Name"] || row["الاسم الإنجليزي"] || ""),
            quantity: 1,
            issuer: "EMU",
          });
        }
        E15.drawWizard();
        toast(L("Names imported", "تم استيراد الأسماء"));
      } catch (error) {
        showErrors([error.message]);
      }
    };
};
E15.repeatForm = (index = null) => {
  E15.wizardCapture();
  const step = E15.wizardSteps[E15.wizard.step],
    repeat = step[3],
    row = index === null ? {} : E15.wizard.details[repeat.key][index];
  const fields = structuredClone(repeat.fields);
  if (repeat.key === "venues")
    fields[0].options = state.settings.venues.map((v) => ({
      value: v.id,
      label: E15.t(v.name) + " · " + v.capacity,
    }));
  openModal(
    L("Add / edit entry", "إضافة / تعديل عنصر"),
    `<div class="form-grid">${fields.map((f) => E15.input(f, row[f.key], "repeat-")).join("")}</div><div class="modal-actions">${E15.btn(L("Cancel", "إلغاء"), "wizard-back")}<button class="btn primary" id="repeatSave">${L("Save entry", "حفظ العنصر")}</button></div>`,
  );
  E15.bind($("#modal"));
  const typeInput = $("#repeat-type");
  if (typeInput) {
    const conditional = () => {
      for (const key of ["screenCampus", "displayStart", "displayEnd"]) {
        const el = $("#repeat-" + key);
        if (el)
          el.closest(".field").hidden = typeInput.value !== "Digital Screens";
      }
    };
    typeInput.onchange = conditional;
    conditional();
  }
  $("#repeatSave").onclick = () => {
    if (!E15.validForm($("#modalForm"))) return;
    const values = E15.collect(fields, $("#modalForm"));
    E15.wizard.details[repeat.key] ??= [];
    if (index === null) E15.wizard.details[repeat.key].push(values);
    else E15.wizard.details[repeat.key][index] = values;
    E15.drawWizard();
  };
};
Object.assign(E15.handlers, {
  "wizard-next": () => {
    if (!E15.validForm($("#modalForm"))) return;
    E15.wizardCapture();
    if (E15.wizard.step === 2 && !E15.wizard.details.venues?.length)
      return showErrors([L("Add a venue.", "أضف موقعًا.")]);
    E15.wizard.step++;
    E15.drawWizard();
  },
  "wizard-prev": () => {
    E15.wizardCapture();
    E15.wizard.step--;
    E15.drawWizard();
  },
  "wizard-draft": () => {
    E15.wizardCapture();
    const r = E15.request.save(E15.wizard.details, E15.wizard.id, false);
    E15.wizard.id = r.id;
    toast(r.reference ? L("Draft saved: ", "حُفظت المسودة: ") + r.reference : L("Draft saved. Reference assigned on submission.", "حُفظت المسودة. يصدر المرجع عند التقديم."));
  },
  "wizard-submit": () => {
    E15.wizardCapture();
    const r = E15.request.save(E15.wizard.details, E15.wizard.id, true);
    closeModal();
    render("requests");
    toast(L("Submitted for review: ", "تم التقديم للمراجعة: ") + r.reference);
  },
  "wizard-add": () => E15.repeatForm(),
  "wizard-edit": (id) => E15.repeatForm(+id),
  "wizard-remove": (id) => {
    E15.wizardCapture();
    E15.wizard.details[E15.wizardSteps[E15.wizard.step][3].key].splice(+id, 1);
    E15.drawWizard();
  },
  "wizard-back": () => E15.drawWizard(),
});

E15.handlers["wizard-demo"] = () => {
  const date = new Date(todayISO() + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + 30);
  const day = date.toISOString().slice(0, 10);
  Object.assign(E15.wizard.details, {
    requester: "منسق تجريبي / Demo Coordinator",
    email: "requester@example.invalid",
    phone: "+19995550123",
    department: "EMU",
    primaryOwner: "Demo Event Owner",
    alternateOwner: "Demo Alternate",
    titleAr: "ملتقى الابتكار التجريبي",
    titleEn: "Demonstration Innovation Forum",
    descriptionAr: "طلب تجريبي متكامل للعرض أمام الإدارة.",
    descriptionEn:
      "Sanitized demonstration request for the director walkthrough.",
    category: "Academic",
    organizingUnit: "EMU",
    date: day,
    startTime: "10:00",
    endTime: "12:00",
    setupTime: "09:00",
    breakdownTime: "13:00",
    campus: "Corniche",
    expectedAttendance: 40,
    audience: "University Community Only",
    venues: [
      {
        venueId: String(state.settings.venues[0].id),
        seating: 40,
        tables: 4,
        layout: "Theater",
        stage: true,
        podium: true,
        equipment: "Screen / AV",
        notes: "Demo accessible layout",
      },
    ],
    workshops: [
      {
        name: "ورشة تجريبية / Demo Workshop",
        description: "Hands-on session",
        date: day,
        time: "10:30",
        venue: state.settings.venues[0].name,
        capacity: 20,
        equipment: "Screen",
        owner: "Demo Facilitator",
        registration: "Pre-registration",
      },
    ],
    booths: [
      {
        type: "University Booths",
        quantity: 2,
        organizations: "Demo College",
        dimensions: "2 × 2 m",
        electricity: true,
      },
    ],
    volunteerQuantity: 4,
    volunteerGender: "Both",
    volunteerTasks: "Registration / Guest support",
    volunteerLocation: "Lobby",
    volunteerShifts: "09:00–13:00",
    volunteerHours: 4,
    media: [
      {
        type: "Poster",
        contentAr: "دعوة للملتقى التجريبي",
        contentEn: "Invitation to the demonstration forum",
        deadline: day,
        dimensions: "A3",
        approvedLogos: true,
      },
    ],
    hospitalityType: "Water / Coffee",
    hospitalityQuantity: 40,
    hospitalityTiming: "10:00",
    beneficiaries: "Attendees",
    universityGiveaways: "Demo university gifts",
    supplier: "Demo provider",
    hostResponsibility: "EMU coordinator",
    budget: 1000,
    budgetOwner: "Demo budget owner",
    financeRequired: true,
    guests: [
      {
        name: "متحدث تجريبي / Demo Speaker",
        type: "Speaker",
        session: "Innovation session",
        arrival: "09:30",
        restricted: "Fictional information only",
      },
    ],
    certificates: [
      {
        type: "Participation",
        issuer: "EMU",
        quantity: 1,
        nameAr: "مشارك تجريبي",
        nameEn: "Demo Participant",
      },
    ],
    acknowledged: false,
  });
  E15.drawWizard();
};
E15.handlers["certificate-template"] = () =>
  E15.xlsx("EMU-certificate-template.xlsx", [
    { "Arabic Name": "مشارك تجريبي", "English Name": "Demo Participant" },
  ]);
