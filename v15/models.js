/* V15 schemas, approved public catalog and sanitized scenario. Private imports remain local. */
window.EMU15 = {
  version: 15,
  roles: [
    "System Administrator",
    "EMU Director",
    "EMU Staff",
    "Authorized Event Requester",
    "Supporting Department",
    "Management Viewer",
  ],
};
const E15 = window.EMU15;
// Public catalog and private local overlay are deliberately separate models.
E15.partnerPrivateFields = ["phone","email","contactPerson","notes","notesHistory","history","relationshipStatus","sponsorshipStatus","status","nextFollowup"];
E15.capturePrivatePartners = () => {
  state.partnerPrivateData ??= {};
  for (const p of state.partners || []) {
    const details = Object.fromEntries(E15.partnerPrivateFields.filter(k => p[k] != null && p[k] !== "" && (!Array.isArray(p[k]) || p[k].length)).map(k => [k, structuredClone(p[k])]));
    if (p.publicRecord === false && p.name) details.privateName = p.name;
    if (Object.keys(details).length) {state.partnerPrivateData[p.id] = details;p.privateAvailable = true;}
    else {delete state.partnerPrivateData[p.id];p.privateAvailable = false;}
  }
};
E15.initializePartners = () => {
  state.publicPartners = SEED.partners.filter(p=>p.publicRecord).map(p=>({id:p.id,name:p.name,category:p.catAr,activity:p.actAr,previousParticipation:p.previousParticipation}));
  state.partnerPrivateData ??= {};
  if (state.partnerCatalogVersion !== 1) {
    const existing=state.partners || [];
    state.partners = SEED.partners.map(source => {
      const old=existing.find(p=>p.id===source.id), row=structuredClone(source);
      const privateLoaded=state.privatePartnersLoaded || (old && (old.phone || (old.email && !old.email.endsWith("@example.invalid"))));
      if (privateLoaded && old) {
        for(const key of E15.partnerPrivateFields)if(old[key]!=null)row[key]=structuredClone(old[key]);
        if(!source.publicRecord&&old.name)row.name=old.name;
      }
      row.history ??= [];return row;
    });
    // Preserve privately created local identities without publishing them into the catalog.
    for(const old of existing)if(!state.partners.some(p=>p.id===old.id))state.partners.push(old);
    state.partnerCatalogVersion=1;
  }
  for(const p of state.partners)p.history ??= [];
  E15.capturePrivatePartners();
};

E15.departments = [
  "IT",
  "Marketing",
  "Facilities",
  "Security",
  "Finance",
  "Student Affairs",
  "EMU",
];
E15.stages = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Preparation",
  "Event Day",
  "Post-Event Reporting",
  "Closed",
];
E15.resources = [
  "reservations",
  "registrations",
  "volunteers",
  "changes",
  "operations",
  "postReports",
  "designs",
  "expenses",
  "users",
];
E15.venueNames = [
  "Main Auditorium",
  "Mini Auditorium",
  "Abu Milha Auditorium (1ST11)",
  "GR46",
  "Lobby",
  "Open Area",
  "Workshop Rooms",
  "Classrooms",
  "Other",
];
E15.defaultSettings = {
  departments: [...E15.departments],
  venues: E15.venueNames.map((name, i) => ({
    id: i + 1,
    name,
    capacity: [500, 150, 200, 60, 300, 1000, 30, 40, 50][i],
    equipment: "AV / Screens",
    campus: i % 2 ? "North Obhur" : "Corniche",
  })),
  categories: [
    "Academic",
    "Community",
    "Cultural",
    "Health",
    "Career",
    "Major / External",
  ],
  workflow: E15.departments,
  giveaways: ["University gifts", "Certificates", "External giveaways"],
  regulations:
    "Respect university safety, accessibility and branding requirements. / الالتزام بالسلامة وإتاحة الوصول وهوية الجامعة.",
  notifications: { tasks: true, approvals: true, followups: true },
  calendar: { year: 2026, weekStart: 0 },
  policies: {
    standardDays: 14,
    majorDays: 21,
    setupDays: 7,
    guestMediaDays: 5,
    reportDays: 3,
  },
  policyStatus: "Proposed — pending institutional approval",
};
E15.initialize = function () {
  E15.initializePartners();
  for (const key of E15.resources)
    if (!Array.isArray(state[key])) {
      if (state[key] !== undefined) storageProblem = true;
      state[key] = [];
    }
  for (const key of E15.resources)
    if (
      state[key].some(
        (r) =>
          !r ||
          typeof r !== "object" ||
          !["string", "number"].includes(typeof r.id),
      ) ||
      new Set(state[key].map((r) => r.id)).size !== state[key].length
    ) {
      storageProblem = true;
      state[key] = [];
    }
  if (!state.settings || typeof state.settings !== "object")
    state.settings = structuredClone(E15.defaultSettings);
  if (
    !["departments", "venues", "categories", "workflow", "giveaways"].every(
      (k) => Array.isArray(state.settings[k]),
    ) ||
    !state.settings.calendar ||
    !state.settings.policies ||
    !state.settings.notifications
  ) {
    storageProblem = true;
    state.settings = structuredClone(E15.defaultSettings);
  }
  if (!state.referenceCounters || typeof state.referenceCounters !== "object" || Array.isArray(state.referenceCounters))
    state.referenceCounters = {};
  for (const r of state.requests) {
    r.workflowStatus ??=
      {
        Approved: "Approved",
        Conditional: "Under Review",
        Pending: "Submitted",
        Declined: "Rejected",
      }[r.status] || "Draft";
    r.details ??= {
      titleEn: r.titleEn,
      titleAr: r.titleAr,
      date: r.date,
      campus: r.campus,
      requester: r.requester,
    };
  }
  for (const e of state.events) {
    e.lifecycle ??= e.status === "Confirmed" ? "Preparation" : "Draft";
    e.published ??= false;
    if (!e.calendarPublication) {
      e.calendarPublication = {status: "Not Requested", history: [], previousDemoFlag: !!e.published};
      // Prior flags were not dedicated publication decisions; require explicit review.
      e.published = false;
    }
    e.reference ??= "LEGACY-" + e.id;
    e.startTime ??= e.time || "";
    e.endTime ??= "";
    e.attachments ??= [];
    e.category ??= "Academic";
  }
  if (!state.v15Seeded) {
    const id = 15001,
      today = todayISO();
    state.events.push({
      id,
      reference: "EMU-DEMO-15001",
      titleEn: "EMU Frontend Demonstration",
      titleAr: "عرض منظومة الفعاليات التجريبي",
      date: today,
      time: "09:00",
      startTime: "09:00",
      endTime: "23:59",
      campus: "Corniche",
      orgEn: "EMU",
      orgAr: "وحدة إدارة الفعاليات",
      status: "Confirmed",
      lifecycle: "Preparation",
      progress: 0,
      partners: [2, 4],
      tasks: [],
      category: "Academic",
      expectedAttendance: 40,
      budget: 1000,
      published: false,
      attachments: [],
      registrationOpen: today + "T00:00",
      registrationClose: today + "T23:59",
      checkinOpen: today + "T00:00",
      checkinClose: today + "T23:59",
    });
    state.approvals.push(
      ...E15.departments.map((dept, i) => ({
        id: 15100 + i,
        eventId: id,
        dept,
        status: "Pending",
        note: "",
        history: [],
      })),
    );
    state.tasks.push({
      id: 15201,
      eventId: id,
      titleEn: "Confirm demonstration venue",
      titleAr: "تأكيد قاعة العرض التجريبي",
      dept: "Facilities",
      owner: "Demo coordinator",
      due: today,
      status: "Pending",
      priority: "High",
      notes: "",
      attachments: [],
    });
    state.registrations.push({
      id: 15301,
      eventId: id,
      name: "مشارك تجريبي / Demo Attendee",
      email: "attendee@example.invalid",
      token: "EMU-DEMO-ATTENDEE",
      checkedIn: false,
      identity: "Mock verified",
    });
    state.volunteers.push({
      id: 15401,
      eventId: id,
      name: "متطوع تجريبي / Demo Volunteer",
      gender: "Male",
      shift: "09:00–12:00",
      location: "Lobby",
      tasks: "Registration",
      hours: 3,
      approvedHours: 0,
      status: "Assigned",
    });
    state.operations.push({
      id: 15501,
      eventId: id,
      item: "Venue",
      owner: "Demo coordinator",
      status: "Pending",
      severity: "Normal",
      notes: "Confirm accessible entrance",
      resolved: false,
    });
    state.users = [
      {
        id: 15601,
        name: "Demo administrator",
        email: "admin@example.invalid",
        role: "EMU Admin",
        department: "EMU",
        status: "Active",
      },
    ];
    state.reservations.push({
      id: 15701,
      eventId: id,
      venueId: 1,
      date: today,
      startTime: "09:00",
      endTime: "17:00",
      setupTime: "08:00",
      breakdownTime: "18:00",
      status: "Pending",
      equipment: "Demo AV / Screen",
      notes: "Fictional reservation for frontend demonstration",
    });
    state.designs.push({
      id: 15801,
      eventId: id,
      type: "Poster",
      contentAr: "إعلان عرض المنظومة التجريبي",
      contentEn: "Frontend demonstration announcement",
      deadline: today,
      status: "Draft",
      published: false,
    });
    state.expenses.push({
      id: 15901,
      eventId: id,
      item: "Demo signage",
      amount: 250,
      supplier: "Demo supplier",
      status: "Pending approval",
      notes: "Fictional expense",
    });
    state.changes.push({
      id: 16001,
      eventId: 108,
      field: "campus",
      oldValue: "Corniche",
      proposedValue: "North Obhur",
      reason: "Demo accessibility review",
      impact: "Venue review required",
      status: "Pending",
      time: new Date().toISOString(),
      requester: { name: "demo@example.invalid", role: "EMU Staff" },
    });
    state.postReports.push({
      id: 16101,
      eventId: id,
      status: "Draft",
      achievements: "نموذج إنجازات تجريبي، يحتاج التحديث بعد الفعالية.",
      achievementsEn: "Fictional draft achievements; update after the event.",
      challenges: "Demo coordination challenges",
      recommendations: "Review the final checklist",
      satisfaction: 4,
      attachments: [],
    });
    for (const [i, item] of [
      "IT/AV",
      "Screens",
      "Booths",
      "Hospitality",
      "Guests",
      "Volunteers",
      "Registration",
      "Media",
      "Safety",
    ].entries())
      state.operations.push({
        id: 16200 + i,
        eventId: id,
        item,
        owner: "Demo coordinator",
        status: i < 4 ? "Done" : "Pending",
        severity: item === "Safety" ? "High" : "Normal",
        resolved: i < 4,
        notes: "Fictional event-day checklist",
      });
    state.log ??= [];
    state.log.unshift({
      id: 16301,
      action: "V15 demo initialized",
      entity: "dataset",
      time: new Date().toISOString(),
      actor: { name: "demo@example.invalid", role: "EMU Admin" },
      before: null,
      after: { version: 15 },
      reason: "Sanitized local demonstration",
    });
    state.v15Seeded = true;
  }
  state.schemaVersion = 15;
};
const baseIdGenerator = newId;
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
const persistPartnerState = save;
save = function () { E15.capturePrivatePartners(); return persistPartnerState(); };
E15.initialize();
