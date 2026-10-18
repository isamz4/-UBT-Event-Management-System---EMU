/* API-ready synchronous mock facade. All state writes pass through commit() and audit(). */
E15.now = () => new Date().toISOString();
E15.localNow = () =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date())
    .replace(" ", "T");
E15.fail = (en, ar) => {
  throw new Error(L(en, ar));
};
E15.actor = () => ({
  name: sessionStorage.getItem("emuEmail") || "Demo user",
  role: role(),
  department: sessionStorage.getItem("emuDepartment") || "IT",
});
E15.allowed = action => E15.auth?.can(action) || false;
E15.guard = (action) => {
  if (!E15.allowed(action))
    E15.fail(
      "This action is not available for this demo role.",
      "هذا الإجراء غير متاح لهذا الدور التجريبي.",
    );
};
E15.audit = (action, entity, before, after, reason = "") => {
  state.log ??= [];
  state.log.unshift({
    id: newId(),
    action,
    entity,
    reference: E15.auditReference(entity, before, after),
    time: E15.now(),
    actor: E15.actor(/^Request (Approved|Rejected|Under Review)$/.test(action)?"reviewEvent":/^Change (Approved|Declined)$/.test(action)?"reviewChange":/^Calendar publication (Approved|Rejected)$/.test(action)?"reviewPublication":undefined),
    before: before ? structuredClone(before) : null,
    after: after ? structuredClone(after) : null,
    reason,
  });
};
E15.commit = () => {
  if (!save())
    E15.fail(
      "Storage was not saved. Review the storage notice.",
      "لم تُحفظ البيانات. راجع تنبيه التخزين.",
    );
};
E15.transaction = (fn) => {
  if (!storageCurrent() || storageProblem)
    E15.fail("Resolve the storage notice first.", "عالج تنبيه التخزين أولًا.");
  const before = structuredClone(state);
  try {
    const result = fn();
    E15.commit();
    return result;
  } catch (error) {
    state = before;
    throw error;
  }
};
E15.entity = (collection, id) => {
  const row = state[collection]?.find((x) => String(x.id) === String(id));
  if (!row) E15.fail("Record not found.", "السجل غير موجود.");
  return row;
};
E15.readiness = (id) => {
  const tasks = state.tasks.filter((x) => x.eventId === id),
    approvals = state.approvals.filter((x) => x.eventId === id),
    ops = state.operations.filter((x) => x.eventId === id);
  const reservations = state.reservations.filter((r) => r.eventId === id);
  const total =
    tasks.length + approvals.length + ops.length + reservations.length;
  return total
    ? Math.round(
        ((tasks.filter((x) => x.status === "Done").length +
          approvals.filter((x) => x.status === "Approved").length +
          ops.filter((x) =>
            x.severity === "High"
              ? x.resolved
              : x.status === "Done" || x.resolved,
          ).length +
          reservations.filter((x) => x.status === "Confirmed").length) /
          total) *
          100,
      )
    : 0;
};
// Allocate inside the synchronous shared-store transaction, never while saving a draft.
E15.reference = (eventDate) => {
  if (!validDate(eventDate))
    E15.fail("A valid event date is required for a reference.", "يلزم تاريخ فعالية صحيح لإصدار المرجع.");
  const [year, month, day] = eventDate.split("-");
  const prefix = `EMU${day}${month}${year.slice(2)}-`;
  state.referenceCounters ??= {};
  const used = new Set([
    ...state.requests.map(r => r.reference),
    ...state.events.map(e => e.reference),
    ...(state.log || []).map(l => l.reference),
  ].filter(Boolean));
  let last = Number.isSafeInteger(state.referenceCounters[prefix])
    ? Math.max(0, state.referenceCounters[prefix]) : 0;
  for (const ref of used) {
    if (ref.startsWith(prefix) && /^\d{3}$/.test(ref.slice(prefix.length)))
      last = Math.max(last, Number(ref.slice(prefix.length)));
  }
  let reference;
  do {
    last++;
    if (last > 999)
      E15.fail("The event-date reference sequence is exhausted (999). Contact EMU.", "اكتمل تسلسل مراجع تاريخ الفعالية (999). تواصل مع الوحدة.");
    reference = prefix + String(last).padStart(3, "0");
  } while (used.has(reference));
  state.referenceCounters[prefix] = last;
  return reference;
};
// Preserve issued references, including earlier demo formats. Backfill only submitted
// legacy requests with a known event date; drafts do not reserve a number.
E15.ensureReferences = () => {
  for (const r of state.requests) {
    if (!r.reference && r.workflowStatus !== "Draft" && validDate(r.details?.date || r.date))
      r.reference = E15.reference(r.details?.date || r.date);
    if (r.reference && r.eventId) {
      const e = state.events.find(e => e.id === r.eventId);
      if (e && !e.reference) e.reference = r.reference;
    }
  }
};
E15.auditReference = (entity, before, after) => {
  if (after?.reference || before?.reference) return after?.reference || before.reference;
  const [kind, ...parts] = String(entity || "").split(":");
  const collection = { request: "requests", event: "events", approval: "approvals",
    change: "changeRequests", task: "tasks", registration: "registrations" }[kind] || kind;
  const row = state[collection]?.find?.(r => String(r.id) === parts.join(":"));
  const eventId = after?.eventId ?? before?.eventId ?? row?.eventId;
  return row?.reference || state.events.find(e => e.id === eventId)?.reference || "";
};
E15.canReadRequest = r => E15.auth?.read("requests",r) || false;
E15.request = {
  save(details, id, submit = false) {
    E15.guard("request");
    return E15.transaction(() => {
      const before = id ? structuredClone(E15.entity("requests", id)) : null;
      if (before && !["Draft", "Rejected"].includes(before.workflowStatus))
        E15.fail(
          "Only drafts or rejected requests can be edited.",
          "يمكن تعديل المسودات أو الطلبات المرفوضة فقط.",
        );
      if (before && !E15.canReadRequest(before))
        E15.fail("Not your request.", "هذا الطلب لا يخصك.");
      if (submit) E15.validateRequest(details);
      const r = before
        ? E15.entity("requests", id)
        : {
            id: newId(),
            ownerEmail: E15.actor().name,
            submitted: "",
            decisions: [],
          };
      if (submit && !r.reference) r.reference = E15.reference(details.date);
      if (submit && !r.submitted) r.submitted = todayISO();
      Object.assign(r, {
        details: structuredClone(details),
        titleEn: details.titleEn || "",
        titleAr: details.titleAr || "",
        requester: details.department || details.requester || "",
        date: details.date || "",
        campus: details.campus || "Corniche",
        workflowStatus: submit ? "Submitted" : "Draft",
        status: submit ? "Pending" : "Draft",
      });
      if (!before) state.requests.unshift(r);
      E15.audit(
        submit ? "Request submitted" : "Draft saved",
        "request:" + r.id,
        before,
        r,
      );
      return r;
    });
  },
  review(id, decision, reason) {
    E15.guard("reviewEvent");
    return E15.transaction(() => {
      const r = E15.entity("requests", id),
        before = structuredClone(r);
      if (!["Submitted", "Under Review"].includes(r.workflowStatus))
        E15.fail(
          "Request must be submitted for review.",
          "يجب تقديم الطلب للمراجعة.",
        );
      if (!["Under Review", "Approved", "Rejected"].includes(decision))
        E15.fail("Invalid decision.", "قرار غير صحيح.");
      if (!reason?.trim())
        E15.fail("A decision reason is required.", "سبب القرار مطلوب.");
      r.workflowStatus = decision;
      r.status =
        decision === "Approved"
          ? "Approved"
          : decision === "Rejected"
            ? "Declined"
            : "Pending";
      r.decisions ??= [];
      r.decisions.push({
        decision,
        reason,
        actor: E15.actor("reviewEvent"),
        time: E15.now(),
      });
      if (decision === "Approved" && !r.eventId) E15.materialize(r);
      E15.audit("Request " + decision, "request:" + r.id, before, r, reason);
      return r;
    });
  },
};
E15.validateRequest = (d) => {
  const required = [
    "requester",
    "email",
    "phone",
    "department",
    "primaryOwner",
    "titleAr",
    "titleEn",
    "category",
    "organizingUnit",
    "date",
    "startTime",
    "endTime",
    "campus",
    "audience",
  ];
  for (const k of required)
    if (!String(d[k] || "").trim())
      E15.fail(
        "Complete all required requester and event fields.",
        "أكمل بيانات مقدم الطلب والفعالية المطلوبة.",
      );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))
    E15.fail("Enter a valid email.", "أدخل بريدًا صحيحًا.");
  if (
    !validDate(d.date) ||
    d.endTime <= d.startTime ||
    (d.setupTime && d.setupTime > d.startTime) ||
    (d.breakdownTime && d.breakdownTime < d.endTime)
  )
    E15.fail(
      "Check the event, setup and breakdown times.",
      "تحقق من التاريخ ووقت البداية والنهاية والتجهيز والتفكيك.",
    );
  if (!Number.isFinite(+d.expectedAttendance) || +d.expectedAttendance < 1)
    E15.fail(
      "Expected attendance must be positive.",
      "الحضور المتوقع يجب أن يكون موجبًا.",
    );
  if (!d.venues?.length)
    E15.fail("Select at least one venue.", "اختر موقعًا واحدًا على الأقل.");
  if (!d.acknowledged)
    E15.fail(
      "Accept the regulations before submission.",
      "يجب الموافقة على اللوائح قبل التقديم.",
    );
  for (const v of d.venues) {
    const venue = state.settings.venues.find(
      (x) => String(x.id) === String(v.venueId),
    );
    if (!venue || v.seating < 0 || v.tables < 0)
      E15.fail("Check venue requirements.", "تحقق من متطلبات الموقع.");
    if (+v.seating > venue.capacity)
      E15.fail(
        "Seating exceeds venue capacity.",
        "عدد المقاعد يتجاوز سعة الموقع.",
      );
  }
  for (const w of d.workshops || [])
    if (!w.name || +w.capacity < 1 || !validDate(w.date))
      E15.fail(
        "Complete workshop name, date and capacity.",
        "أكمل اسم الورشة وتاريخها وسعتها.",
      );
  for(const guest of d.guests||[])if(guest.partnerId&&!state.partners.some(p=>p.id===+guest.partnerId))E15.fail('Guest partner ID does not exist.','معرف الشريك في الضيوف غير موجود.');

};
E15.interval = (date, start, end) => [
  Date.parse(date + "T" + start + ":00+03:00"),
  Date.parse(date + "T" + end + ":00+03:00"),
];
E15.conflicts = (r) =>
  state.reservations.filter(
    (x) =>
      x.id !== r.id &&
      String(x.venueId) === String(r.venueId) &&
      x.status !== "Rejected" &&
      x.status !== "Cancelled" &&
      r.status !== "Rejected" &&
      r.status !== "Cancelled" &&
      (() => {
        const a = E15.interval(
            r.date,
            r.setupTime || r.startTime,
            r.breakdownTime || r.endTime,
          ),
          b = E15.interval(
            x.date,
            x.setupTime || x.startTime,
            x.breakdownTime || x.endTime,
          );
        return a[0] < b[1] && b[0] < a[1];
      })(),
  );
E15.createReservations = (event, venues) => {
  for (const v of venues) {
    const r = {
      ...v,
      id: newId(),
      eventId: event.id,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      setupTime: event.setupTime || event.startTime,
      breakdownTime: event.breakdownTime || event.endTime,
      status: "Pending",
    };
    if (E15.conflicts(r).length) r.status = "Conflict";
    state.reservations.push(r);
  }
};
E15.record = {
  save(collection, values, id) {
    const actions = {
      tasks: "task",
      approvals: "approval",
      reservations: "reservation",
      registrations: "register",
      volunteers: "volunteer",
      changes: "change",
      operations: "operation",
      postReports: "report",
      designs: "media",
      expenses: "expense",
      users: "users",
    };
    E15.guard(actions[collection] || "edit");
    if (!["events", ...Object.keys(actions)].includes(collection))
      E15.fail("Unsupported collection.", "نوع السجل غير مدعوم.");
    return E15.transaction(() => {
      if (collection === "registrations" || collection === "changes")
        E15.fail("Use the dedicated registration/check-in or change workflow.", "استخدم مسار التسجيل والحضور أو طلب التعديل المخصص.");
      const old = id ? E15.entity(collection, id) : null,
        before = old ? structuredClone(old) : null;
      if ("id" in values || "reference" in values)
        E15.fail(
          "Identifiers and references are immutable.",
          "المعرفات والمراجع ثابتة.",
        );
      const combined = { ...old, ...values };
      if (!["events", "users"].includes(collection) && !combined.eventId)
        E15.fail("A linked event is required.", "الفعالية المرتبطة مطلوبة.");
      for (const field of E15.schemas?.[collection] || []) {
        const val = combined[field.key];
        if (
          field.required &&
          (val === undefined || val === null || String(val).trim() === "")
        )
          E15.fail(
            "Complete required record fields.",
            "أكمل حقول السجل المطلوبة.",
          );
        if (field.type === "number" && val !== undefined && val !== "") {
          if (
            !Number.isFinite(+val) ||
            (field.min !== undefined && +val < field.min) ||
            (field.max !== undefined && +val > field.max)
          )
            E15.fail(
              "A numeric field is outside its allowed range.",
              "قيمة عددية خارج النطاق المسموح.",
            );
        }
        if (field.type === "date" && val && !validDate(val))
          E15.fail("Invalid date.", "تاريخ غير صحيح.");
        if (
          field.type === "email" &&
          val &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
        )
          E15.fail("Invalid email.", "بريد غير صحيح.");
      }
      if (
        collection === "approvals" &&
        values.status &&
        values.status !== "Pending" &&
        values.status !== old?.status
      )
        E15.fail(
          "Use the decision action and supply a reason.",
          "استخدم إجراء القرار مع ذكر السبب.",
        );
      const event = combined.eventId
        ? E15.entity("events", +combined.eventId)
        : null;
      if (collection === "events" &&
          ["published", "calendarPublication", "lifecycle", "sourceRequestId"].some(k => k in values))
        E15.fail("Use the dedicated approval/lifecycle workflow.", "استخدم مسار الاعتماد أو دورة الفعالية المخصص.");
      if (collection === "events" && old && E15.isApproved(old) &&
          Object.keys(values).some(k =>
            !["partners", "guests", "attachments", "registrationOpen", "registrationClose", "checkinOpen", "checkinClose"].includes(k) &&
            JSON.stringify(values[k]) !== JSON.stringify(old[k])))
        E15.fail("Approved event fields require a change request.", "حقول الفعالية المعتمدة تتطلب طلب تعديل.");
      if (
        role() === "Supporting Department" &&
        ["tasks", "approvals"].includes(collection) &&
        (old?.dept || values.dept) !== E15.actor().department
      )
        E15.fail(
          "Only your assigned department can update this record.",
          "يمكنك تحديث سجلات إدارتك فقط.",
        );
      if (collection === "reservations") {
        const venue = state.settings.venues.find(
          (v) => String(v.id) === String(values.venueId),
        );
        if (
          !venue ||
          !validDate(values.date) ||
          values.endTime <= values.startTime ||
          values.setupTime > values.startTime ||
          values.breakdownTime < values.endTime
        )
          E15.fail(
            "Check venue, date and timing.",
            "تحقق من الموقع والتاريخ والأوقات.",
          );
        if (E15.conflicts({ ...values, id }).length)
          E15.fail(
            "Venue conflict including setup/breakdown window.",
            "يوجد تعارض في حجز الموقع يشمل التجهيز والتفكيك.",
          );
        if (
          values.status === "Confirmed" &&
          (!E15.isApproved(event) ||
            !state.approvals.some(
              (a) =>
                a.eventId === event.id &&
                a.dept === "Facilities" &&
                a.status === "Approved",
            ))
        )
          E15.fail(
            "Event and Facilities approval are required.",
            "يلزم اعتماد الفعالية وإدارة المرافق.",
          );
      }
      if (
        collection === "postReports" &&
        state.postReports.some(
          (r) => r.eventId === values.eventId && r.id !== id,
        )
      )
        E15.fail(
          "This event already has a report. Edit the existing report.",
          "للفعالية تقرير قائم؛ عدّل التقرير الحالي.",
        );
      if (
        collection === "expenses" &&
        values.status === "Purchased" &&
        !state.approvals.some(
          (a) =>
            a.eventId === event.id &&
            a.dept === "Finance" &&
            a.status === "Approved",
        )
      )
        E15.fail(
          "Finance approval is required before purchases.",
          "يلزم اعتماد المالية قبل الشراء.",
        );
      if (collection === "volunteers" && "approvedHours" in values && +values.approvedHours !== +(old?.approvedHours||0)) {
        E15.guard("hours");
        if (+combined.approvedHours > +combined.hours)
          E15.fail(
            "Approved hours cannot exceed recorded hours.",
            "الساعات المعتمدة لا تتجاوز الساعات المسجلة.",
          );
      }
      if (
        collection === "designs" &&
        values.published &&
        !state.approvals.some(
          (a) =>
            a.eventId === event.id &&
            a.dept === "Marketing" &&
            a.status === "Approved",
        )
      )
        E15.fail(
          "Marketing approval required before publication.",
          "يلزم اعتماد التسويق قبل النشر.",
        );
      const row = old || { id: newId() };
      Object.assign(row, values);
      if (collection === "events") row.calendarPublication ??= {status: "Not Requested", history: []};
      if (!old) state[collection].push(row);
      if (collection === "tasks")
        for (const e of state.events)
          e.tasks = state.tasks
            .filter((t) => t.eventId === e.id)
            .map((t) => t.id);
      E15.audit(
        old ? "Record updated" : "Record created",
        collection + ":" + row.id,
        before,
        row,
      );
      return row;
    });
  },
  remove(collection, id) {
    E15.guard("edit");
    return E15.transaction(() => {
      const row = E15.entity(collection, id);
      if (collection === "registrations" && row.checkedIn)
        E15.fail(
          "Checked-in attendees must be retained.",
          "يجب الاحتفاظ بسجلات الحضور المسجلة.",
        );
      if (collection === "events") {
        if (E15.isApproved(row))
          E15.fail(
            "Approved events cannot be deleted.",
            "لا يمكن حذف الفعاليات المعتمدة.",
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
          state[key] = state[key].filter((r) => r.eventId !== row.id);
        for (const r of state.requests)
          if (r.eventId === row.id) r.eventId = null;
      }
      state[collection] = state[collection].filter((x) => x.id !== row.id);
      E15.audit("Record deleted", collection + ":" + id, row, null);
    });
  },
};
E15.isApproved = (e) =>
  e &&
  [
    "Approved",
    "Preparation",
    "Event Day",
    "Post-Event Reporting",
    "Closed",
  ].includes(e.lifecycle);
E15.approval = (id, status, reason) => {
  E15.guard("approval");
  return E15.transaction(() => {
    const a = E15.entity("approvals", id);
    if (role() === "Supporting Department" && a.dept !== E15.actor().department)
      E15.fail("Not your department.", "هذه الموافقة ليست لإدارتك.");
    if (!["Approved", "Declined", "Pending"].includes(status))
      E15.fail("Invalid approval status.", "حالة موافقة غير صحيحة.");
    if (!reason.trim())
      E15.fail("Decision reason required.", "سبب القرار مطلوب.");
    const before = structuredClone(a);
    a.status = status;
    a.note = reason;
    a.history ??= [];
    a.history.push({ status, reason, actor: E15.actor(), time: E15.now() });
    E15.audit(
      "Department approval " + status,
      "approval:" + id,
      before,
      a,
      reason,
    );
  });
};
E15.stage = (id, next) => {
  E15.guard(next === "Closed" ? "close" : "edit");
  return E15.transaction(() => {
    const e = E15.entity("events", id),
      before = structuredClone(e),
      allowed = {
        Approved: "Preparation",
        Preparation: "Event Day",
        "Event Day": "Post-Event Reporting",
        "Post-Event Reporting": "Closed",
      };
    if (allowed[e.lifecycle] !== next)
      E15.fail(
        "Use the next lifecycle stage.",
        "استخدم المرحلة التالية في دورة الفعالية.",
      );
    if (
      next === "Event Day" &&
      (E15.readiness(id) < 100 ||
        !validDate(e.date) ||
        !e.startTime ||
        !e.endTime)
    )
      E15.fail(
        "Complete tasks, approvals and operational checks first.",
        "أكمل المهام والموافقات وقائمة التشغيل أولًا.",
      );
    if (next === "Closed") {
      const report = state.postReports.find((r) => r.eventId === id);
      if (
        !report ||
        report.status !== "Completed" ||
        E15.readiness(id) < 100 ||
        !report.achievements ||
        !report.challenges ||
        !report.recommendations ||
        !report.satisfaction ||
        state.operations.some(
          (o) =>
            o.eventId === id &&
            (o.severity === "High"
              ? !o.resolved
              : !o.resolved && o.status !== "Done"),
        )
      )
        E15.fail(
          "Complete the required report and all operational checks before closing.",
          "أكمل التقرير المطلوب وجميع فحوص التشغيل قبل الإغلاق.",
        );
    }
    e.lifecycle = next;
    E15.audit("Lifecycle " + next, "event:" + id, before, e);
  });
};
E15.change = {
  request(id, field, proposed, reason, impact) {
    E15.guard("change");
    return E15.transaction(() => {
      const e = E15.entity("events", id);
      if (
        !E15.isApproved(e) ||
        ![
          "date",
          "startTime",
          "endTime",
          "campus",
          "expectedAttendance",
          "titleAr",
          "titleEn",
        ].includes(field) ||
        !reason.trim() ||
        !String(proposed).trim()
      )
        E15.fail(
          "Choose an approved event, critical field and reason.",
          "اختر فعالية معتمدة وحقلًا أساسيًا وسببًا.",
        );
      const row = {
        id: newId(),
        eventId: id,
        field,
        oldValue: e[field],
        proposedValue: proposed,
        reason,
        impact,
        status: "Pending",
        requester: E15.actor(),
        time: E15.now(),
      };
      state.changes.push(row);
      E15.audit("Change requested", "change:" + row.id, null, row);
      return row;
    });
  },
  review(id, approved, reason) {
    E15.guard("reviewChange");
    return E15.transaction(() => {
      const c = E15.entity("changes", id),
        e = E15.entity("events", c.eventId),
        before = structuredClone(c);
      if (c.status !== "Pending" || !reason.trim())
        E15.fail(
          "A pending change and decision reason are required.",
          "يلزم طلب تعديل معلق وسبب القرار.",
        );
      if (approved) {
        if (String(e[c.field]) !== String(c.oldValue))
          E15.fail(
            "The original value changed; submit a fresh change request.",
            "تغيرت القيمة الأصلية؛ قدّم طلب تعديل جديدًا.",
          );
        const candidate = {
          ...e,
          [c.field]:
            c.field === "expectedAttendance"
              ? +c.proposedValue
              : c.proposedValue,
        };
        if (
          c.field === "campus" &&
          !["Corniche", "North Obhur", "Both"].includes(candidate.campus)
        )
          E15.fail("Select a valid campus.", "اختر حرمًا صحيحًا.");
        if (
          ["startTime", "endTime"].includes(c.field) &&
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.proposedValue)
        )
          E15.fail("Use a valid time.", "أدخل وقتًا صحيحًا.");
        if (
          (c.field === "date" && !validDate(candidate.date)) ||
          (candidate.endTime &&
            candidate.startTime &&
            candidate.endTime <= candidate.startTime) ||
          (c.field === "expectedAttendance" && candidate.expectedAttendance < 1)
        )
          E15.fail(
            "Invalid proposed schedule or attendance.",
            "الموعد أو الحضور المقترح غير صحيح.",
          );
        for (const r of state.reservations.filter((r) => r.eventId === e.id)) {
          const changed = {
            ...r,
            date: candidate.date,
            startTime: candidate.startTime,
            endTime: candidate.endTime,
            setupTime: r.setupTime || candidate.startTime,
            breakdownTime: r.breakdownTime || candidate.endTime,
          };
          if (
            changed.setupTime > changed.startTime ||
            changed.breakdownTime < changed.endTime
          )
            E15.fail(
              "The proposed time exceeds reserved setup/breakdown windows. Review the reservation first.",
              "الوقت المقترح يتجاوز فترة الحجز؛ راجع التجهيز والتفكيك أولًا.",
            );
          if (E15.conflicts(changed).length)
            E15.fail(
              "The approved change would create a venue conflict.",
              "التعديل سيؤدي إلى تعارض مواقع.",
            );
        }
        Object.assign(e, candidate);
        if (["Pending", "Approved"].includes(e.calendarPublication?.status)) {
          e.calendarPublication.history.push({action: "Invalidated by approved event change", changeId: c.id,
            actor: E15.actor(), time: E15.now(), reason});
          e.calendarPublication.status = "Needs Review";
          e.published = false;
        }
        for (const r of state.reservations.filter((r) => r.eventId === e.id))
          Object.assign(r, {
            date: e.date,
            startTime: e.startTime,
            endTime: e.endTime,
            setupTime: r.setupTime || e.startTime,
            breakdownTime: r.breakdownTime || e.endTime,
            status: "Pending",
          });
        if (c.field === "date") {
          e.registrationOpen =
            e.registrationClose =
            e.checkinOpen =
            e.checkinClose =
              "";
        }
      }
      c.status = approved ? "Approved" : "Declined";
      c.decisionReason = reason;
      c.reviewedBy = E15.actor("reviewChange");
      E15.audit("Change " + c.status, "change:" + id, before, c, reason);
    });
  },
};
E15.attendance = {
  register(id, values) {
    E15.guard("register");
    return E15.transaction(() => {
      const e = E15.entity("events", id),
        now = E15.localNow();
      if (
        !E15.isApproved(e) ||
        !e.registrationOpen ||
        now < e.registrationOpen ||
        now > e.registrationClose
      )
        E15.fail(
          "Registration is outside its configured window.",
          "التسجيل خارج الفترة المحددة.",
        );
      if (
        !values.name.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
      )
        E15.fail(
          "Name and valid email required.",
          "الاسم والبريد الصحيح مطلوبان.",
        );
      if (
        state.registrations.some(
          (a) =>
            a.eventId === id &&
            a.email.trim().toLowerCase() === values.email.trim().toLowerCase(),
        )
      )
        E15.fail(
          "Already registered for this event.",
          "مسجل مسبقًا لهذه الفعالية.",
        );
      if (
        state.registrations.filter((a) => a.eventId === id).length >=
        (e.expectedAttendance || Infinity)
      )
        E15.fail("Event capacity reached.", "اكتملت السعة.");
      const row = {
        id: newId(),
        eventId: id,
        ...values,
        email: values.email.trim().toLowerCase(),
        token: crypto.randomUUID(),
        identity: "Mock verified",
        checkedIn: false,
      };
      state.registrations.push(row);
      E15.audit("Attendee registered", "registration:" + row.id, null, row);
      return row;
    });
  },
  checkin(id) {
    E15.guard("edit");
    return E15.transaction(() => {
      const a = E15.entity("registrations", id),
        e = E15.entity("events", a.eventId),
        now = E15.localNow();
      if (a.checkedIn)
        E15.fail("Duplicate check-in blocked.", "مُنع تسجيل الحضور المكرر.");
      if (!e.checkinOpen || now < e.checkinOpen || now > e.checkinClose)
        E15.fail(
          "Check-in is outside its window.",
          "تسجيل الحضور خارج الفترة المحددة.",
        );
      const before = structuredClone(a);
      a.checkedIn = true;
      a.checkedAt = E15.now();
      E15.audit("Attendee checked in", "registration:" + id, before, a);
    });
  },
};
E15.files = {
  db() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open("emu-v15-files", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  async put(file) {
    if (file.size > 5 * 1024 * 1024)
      E15.fail("File limit is 5 MB.", "الحد الأقصى للملف 5 ميجابايت.");
    const db = await this.db(),
      id = crypto.randomUUID();
    await new Promise((res, rej) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(file, id);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
    return { id, name: file.name, type: file.type, size: file.size };
  },
  async get(id) {
    const db = await this.db();
    const file = await new Promise((res, rej) => {
      const r = db.transaction("files").objectStore("files").get(id);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    db.close();
    return file;
  },
};

E15.materialize = (r) => {
  const d = {
    startTime: "",
    endTime: "",
    organizingUnit: r.requester,
    ...r.details,
  };
  const event = {
    id: newId(),
    reference: r.reference,
    sourceRequestId: r.id,
    titleEn: d.titleEn || "",
    titleAr: d.titleAr || "",
    date: d.date,
    time: d.startTime,
    startTime: d.startTime,
    endTime: d.endTime,
    setupTime: d.setupTime,
    breakdownTime: d.breakdownTime,
    campus: d.campus,
    orgEn: d.organizingUnit || d.department,
    orgAr: d.organizingUnit || d.department,
    status: "Confirmed",
    lifecycle: "Approved",
    progress: 0,
    category: d.category,
    expectedAttendance: +d.expectedAttendance || 0,
    partners: [...new Set((d.guests||[]).filter(g=>g.partnerId).map(g=>+g.partnerId))],
    tasks: [],
    published: false,
    calendarPublication: {status: "Not Requested", history: []},
    attachments: structuredClone(d.attachments || []),
  };
  state.events.push(event);
  r.eventId = event.id;
  for (const dept of state.settings.workflow)
    state.approvals.push({
      id: newId(),
      eventId: event.id,
      dept,
      status: "Pending",
      note: "",
      history: [],
    });
  E15.createReservations(event, d.venues || []);
  for (const item of [
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
  ])
    state.operations.push({
      id: newId(),
      eventId: event.id,
      item,
      owner: d.primaryOwner || r.requester,
      status: "Pending",
      severity: "Normal",
      notes: "",
      resolved: false,
    });
  for (const media of d.media || [])
    state.designs.push({
      ...media,
      id: newId(),
      eventId: event.id,
      status: "Draft",
      published: false,
    });
  return E15.entity("events", r.eventId);
};

// Event approval never grants calendar publication. This is a separate local approval.
E15.publication = {
  request(id) {
    E15.guard("edit");
    return E15.transaction(() => {
      const e = E15.entity("events", id), before = structuredClone(e);
      if (!E15.isApproved(e)) E15.fail("Approve the event before requesting publication.", "اعتمد الفعالية قبل طلب النشر.");
      if (["Pending", "Approved"].includes(e.calendarPublication.status))
        E15.fail("A publication request is already pending or approved.", "طلب النشر معلق أو معتمد بالفعل.");
      e.calendarPublication.status = "Pending";
      e.calendarPublication.history.push({action: "Requested", actor: E15.actor(), time: E15.now()});
      e.published = false;
      E15.audit("Calendar publication requested", "event:" + id, before, e);
    });
  },
  review(id, decision, reason) {
    E15.guard("reviewPublication");
    return E15.transaction(() => {
      const e = E15.entity("events", id), before = structuredClone(e);
      if (e.calendarPublication.status !== "Pending" || !["Approved", "Rejected"].includes(decision) || !reason?.trim())
        E15.fail("A pending publication request, decision and reason are required.", "يلزم طلب نشر معلق وقرار وسبب.");
      if (decision === "Approved" && (!E15.isApproved(e) || !state.approvals.some(a =>
          a.eventId === id && a.dept === "Marketing" && a.status === "Approved")))
        E15.fail("Event and Marketing approval are prerequisites, not publication approval.", "اعتماد الفعالية والتسويق متطلبات مسبقة، ولا يمثلان اعتماد النشر.");
      e.calendarPublication.status = decision;
      e.calendarPublication.history.push({action: decision, reason: reason.trim(), actor: E15.actor("reviewPublication"), time: E15.now()});
      e.published = decision === "Approved";
      E15.audit("Calendar publication " + decision, "event:" + id, before, e, reason);
    });
  },
  withdraw(id) {
    E15.guard("edit");
    return E15.transaction(() => {
      const e = E15.entity("events", id), before = structuredClone(e);
      if (!["Pending", "Approved"].includes(e.calendarPublication.status))
        E15.fail("No active publication to withdraw.", "لا يوجد نشر نشط لسحبه.");
      e.calendarPublication.status = "Withdrawn";
      e.calendarPublication.history.push({action: "Withdrawn", actor: E15.actor(), time: E15.now()});
      e.published = false;
      E15.audit("Calendar publication withdrawn", "event:" + id, before, e);
    });
  },
};

// Private browser-only partner backup. No private values are present in source.
E15.privateOrigin = () => /^(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
E15.requirePrivateOrigin = () => {
  if (!E15.privateOrigin()) E15.fail("Load private partners only in a downloaded localhost/private-LAN preview.", "حمّل الشركاء الخاصين في نسخة محلية أو شبكة خاصة فقط.");
};
E15.loadPrivatePartners = (snapshot, apply = false) => {
  E15.guard("edit");
  E15.requirePrivateOrigin();
  const rows = snapshot?.partners;
  if (!Array.isArray(rows) || rows.length !== 21 || new Set(rows.map(p=>p.id)).size !== 21 ||
      !rows.every(p => Number.isInteger(p.id) && p.id >= 1 && p.id <= 21 &&
        ["name","catAr","actAr","phone","email","notes"].every(k=>typeof p[k] === "string") &&
        Array.isArray(p.history) && p.history.every(h => h && ["date","channel","note"].every(k=>typeof h[k] === "string")) &&
        [null,undefined,"Active","Potential","Inactive","On Hold"].includes(p.relationshipStatus) &&
        [null,undefined,"Not Contacted","Contacted","Negotiating","Confirmed","Declined"].includes(p.sponsorshipStatus)) || !rows.some(p=>p.id===12))
    E15.fail("Expected a valid private backup with partner IDs 1–21 and histories.", "يلزم ملف خاص صحيح بمعرفات الشركاء 1–21 وسجلات المتابعة.");
  if (state.events.some(e => e.partners.some(id => !rows.some(p=>p.id===id))))
    E15.fail("The backup would break event-partner relationships.", "ستؤدي النسخة إلى قطع روابط الشركاء بالفعاليات.");
  if (!apply) return {count: rows.length, retainedID: 12};
  return E15.transaction(() => {
    state.partners = rows.map(source => {
      const row = {...structuredClone(source), publicRecord:SEED.partners.find(p=>p.id===source.id)?.publicRecord ?? false}, current = state.partners.find(p=>p.id===row.id);
      // Retain locally added follow-ups/notes when reloading a private presentation backup.
      row.history = [...new Map([...(row.history||[]), ...(current && (current.privateAvailable || state.privatePartnersLoaded) ? current.history || [] : [])].map(h=>[JSON.stringify(h),h])).values()];
      if (current && (current.privateAvailable || state.privatePartnersLoaded) && current.notes && !row.notes.includes(current.notes))
        row.notes += (row.notes ? "\n\n" : "") + current.notes;
      return row;
    });
    state.privatePartnersLoaded = true;
    E15.audit("Private partners loaded locally", "partners", null, {count: rows.length});
    return {count: rows.length};
  });
};
