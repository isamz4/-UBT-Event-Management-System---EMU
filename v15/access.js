/* Centralized FRONTEND DEMO authorization. Production enforcement belongs to the API. */
E15.accessPolicy = {
  roles: E15.roles,
  approvalPermissions: {reviewEvent:["Event requests","طلبات الفعاليات"],reviewChange:["Event changes","طلبات التعديل"],reviewPublication:["Calendar publication","نشر التقويم"]},
  staffPermissions: {task:["Tasks","المهام"],reservation:["Venues","المواقع"],volunteer:["Volunteers","المتطوعون"],attendance:["Attendance","الحضور"],partners:["Confidential partners","الشركاء السريون"],report:["Reports","التقارير"],operation:["Operations","التشغيل"],media:["Media","الإعلام"],expense:["Expenses","المصروفات"]},
  grants: {
    "System Administrator":["technical"],
    "EMU Director":["business","edit","request","register","change","task","approval","reservation","volunteer","attendance","partners","report","operation","media","expense","settings","users","delegate","close","hours","reviewEvent","reviewChange","reviewPublication","insights","intelligence","log","dataExport","shareReport"],
    "EMU Staff":["business","edit","request","register","change","task","approval","reservation","volunteer","attendance","partners","report","operation","media","expense","insights","intelligence","log"],
    "Authorized Event Requester":["request","register","change"],
    "Supporting Department":["task","approval"],
    "Management Viewer":["insights","intelligence"]
  },
  routes: {
    dashboard:["System Administrator","EMU Director","EMU Staff","Authorized Event Requester","Supporting Department","Management Viewer"],
    events:["EMU Director","EMU Staff","Authorized Event Requester","Supporting Department","Management Viewer"],
    workspace:["EMU Director","EMU Staff","Authorized Event Requester","Supporting Department","Management Viewer"],
    calendar:["EMU Director","EMU Staff","Authorized Event Requester","Supporting Department","Management Viewer"],
    requests:["EMU Director","EMU Staff","Authorized Event Requester"],tasks:["EMU Director","EMU Staff","Supporting Department"],
    venues:["EMU Director","EMU Staff"],attendance:["EMU Director","EMU Staff","Authorized Event Requester"],volunteers:["EMU Director","EMU Staff"],
    partners:["EMU Director","EMU Staff"],changes:["EMU Director","EMU Staff","Authorized Event Requester"],postreports:["EMU Director","EMU Staff","Management Viewer"],
    insights:["EMU Director","EMU Staff","Management Viewer"],operations:["EMU Director","EMU Staff"],
    access:["System Administrator","EMU Director","EMU Staff","Authorized Event Requester","Supporting Department","Management Viewer"],
    log:["EMU Director","EMU Staff"],settings:["System Administrator","EMU Director"]
  },
  actionPermissions: {"new-request":"request","edit-request":"request","review-request":"reviewEvent","legacy-workspace":"reviewEvent","change-new":"change","change-review":"reviewChange",publication:"edit","publication-review":"reviewPublication","publication-withdraw":"edit","partner-import":"partners",partner:"partners","link-partners":"partners","volunteer-export":"volunteer","edit-report":"report","attendance-windows":"attendance","attendance-export":"attendance",checkin:"attendance",register:"register","insights-export":"insights",intelligence:"intelligence","brief-export":"intelligence","dataset-export":"dataExport","reset-demo":"dataExport","settings-edit":"settings","new-approval":"approval","guest-new":"edit"}
};
E15.auth = {
  role(){return sessionStorage.getItem("emuLogin")==="1" && E15.roles.includes(sessionStorage.getItem("emuRole")) ? sessionStorage.getItem("emuRole") : "Unknown";},
  user(){const email=(sessionStorage.getItem("emuEmail")||"").toLowerCase();let users=state.users;
    const snapshot=storage.get("emuV15");if(snapshot&&snapshot!==persistedSnapshot){try{if(this.remoteSnapshot!==snapshot){this.remoteUsers=JSON.parse(snapshot).users;this.remoteSnapshot=snapshot;}if(Array.isArray(this.remoteUsers))users=this.remoteUsers;}catch{return null;}}
    return users.find(u=>u.email?.toLowerCase()===email && u.role===this.role() && u.status==="Active") || null;},
  delegationActive(grant){return !!(grant?.enabled && (!grant.expiresAt || (grant.expiresAt.length===10 ? grant.expiresAt>=todayISO() : Date.parse(grant.expiresAt)>Date.now())));},
  can(action){
    const u=this.user();if(!u)return false;
    if(u.role==="EMU Staff" && action in E15.accessPolicy.approvalPermissions)return this.delegationActive(u.delegations?.[action]);
    if(!E15.accessPolicy.grants[u.role]?.includes(action))return false;
    if(u.role==="Authorized Event Requester" && ["request","change"].includes(action))return u.requestAuthorized===true;
    if(u.role==="EMU Staff" && action in E15.accessPolicy.staffPermissions)return u.operationalPermissions?.[action]!==false;
    return true;
  },
  route(route){const u=this.user();return !!u && !!E15.accessPolicy.routes[route]?.includes(u.role) && (route!=="partners" || this.can("partners"));},
  owns(e){const u=this.user();return !!u && state.requests.some(r=>r.id===e.sourceRequestId && r.ownerEmail?.toLowerCase()===u.email.toLowerCase());},
  event(e){const u=this.user();if(!u||!e)return false;if(this.can("business"))return true;
    if(u.role==="Authorized Event Requester")return this.owns(e) || (e.published===true && e.calendarPublication?.status==="Approved");
    if(u.role==="Management Viewer")return E15.isApproved(e);
    if(u.role==="Supporting Department")return state.tasks.some(t=>t.eventId===e.id&&t.dept===u.department)||state.approvals.some(a=>a.eventId===e.id&&a.dept===u.department);
    return false;
  },
  read(collection,row){const u=this.user();if(!u||!row)return false;
    if(collection==="partners")return this.can("partners");
    if(collection==="users")return this.can("users")||u.role==="System Administrator"||row.id===u.id;
    if(collection==="log")return this.can("log");
    if(collection==="requests")return this.can("business") || (u.role==="Authorized Event Requester"&&row.ownerEmail?.toLowerCase()===u.email.toLowerCase());
    if(collection==="events")return this.event(row);
    const e=state.events.find(e=>e.id===row.eventId);if(!this.event(e))return false;
    if(this.can("business"))return true;
    if(u.role==="Supporting Department")return (["tasks","approvals"].includes(collection)&&row.dept===u.department)||collection==="reservations";
    if(u.role==="Authorized Event Requester")return collection==="changes"&&this.owns(e);
    if(u.role==="Management Viewer")return collection==="postReports"&&row.status==="Completed"&&row.managementAuthorized===true;
    return false;
  },
  requireRead(collection,row){if(!this.read(collection,row))E15.fail("Access denied for this identity or record.","الوصول غير مسموح لهذه الهوية أو لهذا السجل.");},
  change(e){return this.can("change")&&(this.can("business")||this.owns(e));},
  file(id){if(this.can("business"))return true;const role=this.role(), collections=role==="Supporting Department"?["tasks","approvals"]:role==="Authorized Event Requester"?["requests"]:role==="Management Viewer"?["postReports"]:[];const contains=value=>value&&typeof value==="object"&&(String(value.id)===String(id)||Object.values(value).some(v=>Array.isArray(v)?v.some(contains):typeof v==="object"&&contains(v)));return collections.some(key=>state[key].some(row=>this.read(key,row)&&contains(row.attachments||row.details?.attachments)));},
  actor(permission){const u=this.user();const delegated=u?.role==="EMU Staff"&&permission in E15.accessPolicy.approvalPermissions;
    return {id:u?.id,name:u?.email||sessionStorage.getItem("emuEmail")||"Demo user",displayName:u?.name||"Demo user",role:this.role(),department:u?.department||"",approvalAuthority:permission?(delegated?"Delegated EMU Staff":"EMU Director"):undefined,permission,delegatedBy:delegated?u.delegations?.[permission]?.grantedBy:undefined};
  },
  initialize(){
    if(Array.isArray(state.settings?.departments))E15.departments.splice(0,E15.departments.length,...state.settings.departments);
    const aliases={"EMU Admin":"System Administrator","Event Requester":"Authorized Event Requester","Viewer":"Management Viewer"};
    for(const u of state.users)u.role=aliases[u.role]||u.role;
    const demo=[
      [700001,"System Administrator","Applications demo","system@example.invalid","Applications"],
      [700002,"EMU Director","EMU Director demo","director@example.invalid","EMU"],
      [700003,"EMU Staff","EMU Staff demo","staff@example.invalid","EMU"],
      [700004,"EMU Staff","Delegated EMU Staff demo","delegated@example.invalid","EMU"],
      [700005,"Authorized Event Requester","Authorized requester demo","requester@example.invalid","College of Business"],
      [700006,"Supporting Department","IT department demo","support@example.invalid","IT"],
      [700007,"Management Viewer","Management viewer demo","viewer@example.invalid","Management"]
    ];
    if(!state.accessSeeded){for(const [id,role,name,email,department]of demo){if(!state.users.some(u=>u.email===email))state.users.push({id,role,name,email,department,status:"Active",requestAuthorized:role==="Authorized Event Requester",delegations:email==="delegated@example.invalid"?{reviewEvent:{enabled:true,grantedBy:700002,grantedAt:E15.now(),expiresAt:""}}:{},demo:true});}state.accessSeeded=true;}
    E15.demoIdentities=demo.map(x=>x[0]);
  },
  saveUser(values,id){E15.guard("users");return E15.transaction(()=>{
    const old=id?state.users.find(u=>String(u.id)===String(id)):null;if(id&&!old)E15.fail("User not found.","المستخدم غير موجود.");
    const v={...old,...Object.fromEntries(Object.entries(values).filter(([k])=>["name","email","role","department","status","requestAuthorized"].includes(k)))};
    if(!E15.roles.includes(v.role)||!["Active","Inactive"].includes(v.status)||!v.name?.trim()||!v.department?.trim()||!/^\S+@\S+\.\S+$/.test(v.email||""))E15.fail("Complete a valid user identity, department and status.","أكمل بيانات هوية صحيحة والإدارة والحالة.");
    if(v.role==="Supporting Department"&&!state.settings.departments.includes(v.department))E15.fail("Choose an approved supporting department from System Settings.","اختر إدارة مساندة معتمدة من إعدادات النظام.");
    if(state.users.some(u=>u.id!==old?.id&&u.email.toLowerCase()===v.email.toLowerCase()))E15.fail("Email already exists.","البريد مستخدم بالفعل.");
    if(old?.role==="EMU Director"&&(v.role!=="EMU Director"||v.status!=="Active")&&!state.users.some(u=>u.id!==old.id&&u.role==="EMU Director"&&u.status==="Active"))E15.fail("Retain at least one active Director.","يجب إبقاء مدير نشط واحد على الأقل.");
    const before=old?structuredClone(old):null;const row=old||{id:newId(),delegations:{}};Object.assign(row,v);row.email=row.email.toLowerCase();if(row.role!=="EMU Staff")row.delegations={};if(row.role!=="Authorized Event Requester")row.requestAuthorized=false;if(!old)state.users.push(row);
    E15.audit("User / requester authorization changed","users:"+row.id,before,row);return row;
  });},
  delegate(id,permission,enabled,expiresAt=""){
    E15.guard("delegate");return E15.transaction(()=>{const u=state.users.find(u=>String(u.id)===String(id));if(!u||u.role!=="EMU Staff"||!(permission in E15.accessPolicy.approvalPermissions))E15.fail("Delegate only named approval permissions to EMU Staff.","التفويض لصلاحيات الاعتماد المحددة ولموظفي الوحدة فقط.");
      if(expiresAt&&(!validDate(expiresAt)||expiresAt<todayISO()))E15.fail("Choose a current or future expiration date.","اختر تاريخ انتهاء حاليًا أو مستقبليًا.");
      const before=structuredClone(u);u.delegations??={};u.delegations[permission]={enabled:!!enabled,expiresAt,grantedBy:this.user().id,grantedAt:E15.now()};E15.audit(enabled?"Delegation granted":"Delegation revoked","users:"+u.id,before,u,permission);return u;
    });
  },
  staffPermission(id,key,enabled){E15.guard("delegate");return E15.transaction(()=>{const u=state.users.find(u=>String(u.id)===String(id));if(u?.role!=="EMU Staff"||!(key in E15.accessPolicy.staffPermissions))E15.fail("Select an EMU staff permission.","اختر صلاحية لموظف الوحدة.");const before=structuredClone(u);u.operationalPermissions??={};u.operationalPermissions[key]=!!enabled;E15.audit("Staff permission changed","users:"+u.id,before,u,key);});},
  switchIdentity(id){const next=state.users.find(u=>String(u.id)===String(id)&&u.status==="Active"&&E15.demoIdentities.includes(u.id));if(!next)E15.fail("Demo identity unavailable.","الهوية التجريبية غير متاحة.");
    const before=this.actor();E15.transaction(()=>E15.audit("Role Preview identity changed","users:"+next.id,before,{id:next.id,role:next.role,email:next.email}));
    closeModal();sessionStorage.setItem("emuLogin","1");sessionStorage.setItem("emuRole",next.role);sessionStorage.setItem("emuEmail",next.email);sessionStorage.removeItem("emuDepartment");E15.filter={};E15.chartFilter=null;E15.accessStatus="All";E15.accessRole="All";window.eq="";window.est="All";window.ecamp="All";window.pq="";window.pst="All";window.partnerSponsorshipFilter="All";window.partnerCategory="All";window.partnerParticipation="All";window.publicPartnersOnly=false;window.followOnly=false;E15.activeEvent=null;page="dashboard";init();
  }
};
E15.allowed=action=>E15.auth.can(action);
E15.actor=permission=>E15.auth.actor(permission);
E15.canReadRequest=r=>E15.auth.read("requests",r);
E15.auth.initialize();
E15.projectState = () => {
  const raw=state, projected=structuredClone(raw), u=E15.auth.user();
  for(const [collection,rows]of Object.entries(raw))if(Array.isArray(rows))projected[collection]=rows.filter(r=>E15.auth.read(collection,r)).map(r=>structuredClone(r));
  if(!E15.allowed("partners")){
    for(const e of projected.events){e.partners=[];e.guests=[];delete e.restricted;delete e.notes;delete e.attachments;}
    for(const r of projected.requests){if(r.details){delete r.details.guests;delete r.details.partners;delete r.details.sponsors;} }
    projected.log=[];
    projected.partnerPrivateData={};
  }
  if(!E15.allowed("business")){
    const visible=new Set(projected.events.map(e=>e.id));
    // Anonymous rows support consistent aggregate metrics without exposing identities.
    projected.registrations=raw.registrations.filter(r=>visible.has(r.eventId)).map(r=>({id:r.id,eventId:r.eventId,checkedIn:r.checkedIn}));
    projected.expenses=raw.expenses.filter(r=>visible.has(r.eventId)).map(r=>({id:r.id,eventId:r.eventId,status:r.status,amount:r.amount}));
    projected.volunteers=raw.volunteers.filter(r=>visible.has(r.eventId)).map(r=>({id:r.id,eventId:r.eventId,hours:r.hours,approvedHours:r.approvedHours}));
    if(u?.role==="Management Viewer"){
      const sourceIDs=new Set(projected.events.map(e=>e.sourceRequestId));
      projected.requests=raw.requests.filter(r=>sourceIDs.has(r.id)).map(r=>({id:r.id,details:{budget:+r.details?.budget||0,workshops:(r.details?.workshops||[]).map(()=>({})),booths:(r.details?.booths||[]).map(b=>({quantity:+b.quantity||0}))}}));
    }
    projected.users=projected.users.map(r=>{const v={id:r.id,name:r.name,email:r.email,role:r.role,department:r.department,status:r.status};if(r.id===u?.id){v.delegations=u.delegations;v.requestAuthorized=u.requestAuthorized;}return v;});
  }
  return projected;
};
E15.withView = fn => {if(E15.viewSource)return fn();const raw=state, previous=E15.viewSource;const filtered=E15.projectState();try{E15.viewSource=raw;state=filtered;return fn();}finally{state=raw;E15.viewSource=previous;}};
E15.requireRoute = route => {if(!E15.auth.route(route))E15.fail("Access denied: this module is unavailable for your identity.","الوصول مرفوض: هذه الوحدة غير متاحة لهويتك.");};
E15.denied = () => `<section class="card empty"><h2>${L("Access denied","الوصول غير مسموح")}</h2><p>${L("Your active identity cannot access this module or record. Use Role Preview to explore a different demo identity.","الهوية الحالية لا تملك صلاحية الوصول لهذه الوحدة أو السجل. استخدم معاينة الصلاحيات لتجربة هوية أخرى.")}</p></section>`;
E15.permissionBadges = u => Object.entries(E15.accessPolicy.approvalPermissions).map(([key,title])=>`<span class="pill ${E15.auth.delegationActive(u.delegations?.[key])?"ok":""}">${L(...title)}: ${E15.auth.delegationActive(u.delegations?.[key])?L("Delegated","مفوّض"):L("Not delegated","غير مفوّض")}${u.delegations?.[key]?.expiresAt?" · "+esc(u.delegations[key].expiresAt):""}</span>`).join(" ");
E15.rolePreview = () => {
  openModal(L("Role Preview","معاينة الصلاحيات"),`<section class="inline-notice"><b>${L("FRONTEND DEMONSTRATION FEATURE","ميزة عرض تجريبي للواجهة فقط")}</b><p>${L("Switching a demo identity is not authentication or a production privilege grant. Every switch is logged.","تبديل الهوية التجريبية ليس مصادقة أو منح صلاحيات إنتاجية. يُسجّل كل تبديل في سجل العمليات.")}</p></section><div class="role-preview-grid">${state.users.filter(u=>E15.demoIdentities.includes(u.id)).map(u=>`<button class="role-preview-card ${E15.auth.user()?.id===u.id?"selected":""}" data-preview-id="${u.id}" ${u.status!=="Active"?"disabled":""}><span>${icon(u.role==="EMU Director"?"dashboard":"access")}</span><b>${esc(u.id===700004?L("Delegated EMU Staff","موظف وحدة مفوّض"):E15.t(u.role))}</b><small>${esc(u.email)}</small><small>${esc(E15.t(u.department))}</small>${u.role==="EMU Staff"?E15.permissionBadges(u):""}</button>`).join("")}</div>`);
  document.querySelectorAll("[data-preview-id]").forEach(b=>b.onclick=()=>E15.auth.switchIdentity(+b.dataset.previewId));
};
E15.userDetails = id => {
  const u=state.users.find(u=>String(u.id)===String(id));E15.auth.requireRead("users",u);
  const manager=E15.allowed("users");
  if(!manager){openModal(L("Identity profile","ملف الهوية"),`<h3>${esc(u.name)}</h3><p>${esc(E15.t(u.role))} · ${esc(E15.t(u.department))}</p>${u.role==="EMU Staff"?E15.permissionBadges(u):""}<p>${L("Permissions are managed by the EMU Director.","يدير مدير الوحدة الصلاحيات.")}</p>`);return;}
  E15.form(L("User & requester authorization","المستخدم واعتماد مقدم الطلب"),[
    F("name","Name","الاسم","text",[],true),F("email","Email","البريد","email",[],true),F("role","Role","الدور","select",E15.roles,true),
    F("department","College / Department","الكلية / الإدارة","text",[],true),F("status","Status","الحالة","select",["Active","Inactive"],true),F("requestAuthorized","Authorize request submission","اعتماد تقديم الطلبات","checkbox")
  ],u,v=>E15.auth.saveUser(v,u.id));
  const extra=document.createElement("section");extra.className="access-delegations";
  extra.innerHTML=`<h3>${L("Independent staff approval delegation","تفويض اعتمادات الموظف بشكل مستقل")}</h3><p>${L("Only the EMU Director can grant or revoke. Target must be EMU Staff. Save identity changes before configuring a newly assigned staff role.","يمنح المدير أو يلغي التفويض لموظفي الوحدة فقط. احفظ تغيير الدور أولًا قبل تفويض الموظف الجديد.")}</p>${u.role==="EMU Staff"?Object.entries(E15.accessPolicy.approvalPermissions).map(([key,title])=>`<div class="delegation-row"><label><input type="checkbox" data-grant="${key}" ${E15.auth.delegationActive(u.delegations?.[key])?"checked":""}>${L(...title)}</label><label>${L("Expiration (optional)","الانتهاء (اختياري)")}<input type="date" data-expiry="${key}" value="${esc(u.delegations?.[key]?.expiresAt||"")}"></label><button type="button" class="btn secondary" data-save-grant="${key}">${L("Apply delegation","تطبيق التفويض")}</button></div>`).join("")+`<h3>${L("Individual operational permissions","صلاحيات التشغيل الفردية")}</h3>`+Object.entries(E15.accessPolicy.staffPermissions).map(([key,title])=>`<label class="permission-toggle"><input type="checkbox" data-staff-permission="${key}" ${u.operationalPermissions?.[key]!==false?"checked":""}>${L(...title)}</label>`).join(""):E15.empty(L("Delegation is available only for EMU Staff.","التفويض متاح لموظفي الوحدة فقط."))}<h3>${L("User audit history","سجل تغييرات المستخدم")}</h3>${state.log.filter(l=>l.entity==="users:"+u.id).slice(0,12).map(l=>`<p>${esc(l.action)} · ${esc(l.actor?.name||"")} · <bdi>${esc(l.time)}</bdi></p>`).join("")||E15.empty()}`;
  $("#modalBody .modal-actions").before(extra);
  extra.querySelectorAll("[data-save-grant]").forEach(b=>b.onclick=()=>{try{const key=b.dataset.saveGrant;E15.auth.delegate(u.id,key,extra.querySelector(`[data-grant="${key}"]`).checked,extra.querySelector(`[data-expiry="${key}"]`).value);toast(L("Delegation updated immediately","حُدّث التفويض فورًا"));}catch(e){showErrors([e.message]);}});
  extra.querySelectorAll("[data-staff-permission]").forEach(b=>b.onchange=()=>{try{E15.auth.staffPermission(u.id,b.dataset.staffPermission,b.checked);toast(L("Permission updated","حُدّثت الصلاحية"));}catch(e){showErrors([e.message]);}});
};
E15.accessPageSecure = () => {
  const u=E15.auth.user(), manager=E15.allowed("users"), technical=E15.allowed("technical");
  const directory=manager||technical;let rows=directory?state.users:[u];
  rows=E15.filtered(rows).filter(x=>(!E15.accessStatus||E15.accessStatus==="All"||x.status===E15.accessStatus)&&(!E15.accessRole||E15.accessRole==="All"||x.role===E15.accessRole));
  return E15.title("Users & Access","المستخدمون والصلاحيات",L("Director-managed operational authority. Technical administration is separate.","إدارة الصلاحيات التشغيلية للمدير، والإدارة التقنية منفصلة."),null,manager?E15.btn(L("Add authorized user","إضافة مستخدم معتمد"),"access-add"):"")+
    `<section class="card access-summary"><div><span class="eyebrow">${L("ACTIVE DEMO IDENTITY","الهوية التجريبية الحالية")}</span><h3>${esc(E15.t(u.role))}</h3><p>${esc(u.name)} · ${esc(E15.t(u.department))}</p>${u.role==="EMU Staff"?E15.permissionBadges(u):""}</div><button class="btn primary" id="accessPreview">${L("Role Preview","معاينة الصلاحيات")}</button></section><p class="inline-notice">${L("Frontend role simulation only. Production authorization must be enforced by the university backend.","محاكاة صلاحيات للواجهة فقط. يجب أن يفرض النظام الخلفي للجامعة الصلاحيات الفعلية.")}</p>`+
    `<div class="v15-toolbar"><input id="moduleSearch" aria-label="${L("Search users","بحث المستخدمين")}" placeholder="${L("Search name, email or department","ابحث بالاسم أو البريد أو الإدارة")}" value="${esc(E15.filter.access?.search||"")}"><select id="accessStatus" aria-label="${L("Status filter","فلترة الحالة")}">${["All","Active","Inactive"].map(x=>`<option value="${x}" ${x===E15.accessStatus?"selected":""}>${E15.t(x)}</option>`).join("")}</select><select id="accessRole" aria-label="${L("Role filter","فلترة الدور")}">${["All",...E15.roles].map(x=>`<option value="${x}" ${x===E15.accessRole?"selected":""}>${E15.t(x)}</option>`).join("")}</select></div>`+
    E15.table([L("User / Email","المستخدم / البريد"),L("Role / Department","الدور / الإدارة"),L("Status / Authorization","الحالة / الاعتماد"),L("Delegation","التفويض"),L("Details","التفاصيل")],rows.map(x=>[
      `<b>${esc(x.name)}</b><small>${esc(x.email)}</small>`,`${esc(E15.t(x.role))}<small>${esc(E15.t(x.department))}</small>`,E15.badge(x.status)+(x.role==="Authorized Event Requester"?`<small>${x.requestAuthorized?L("Submission authorized","تقديم الطلبات معتمد"):L("Submission revoked","سُحب اعتماد التقديم")}</small>`:""),x.role==="EMU Staff"&&(manager||x.id===u.id)?E15.permissionBadges(x):"—",manager||x.id===u.id?E15.btn(L("Details / Permissions","التفاصيل / الصلاحيات"),"access-user",x.id):L("Technical directory only","دليل تقني فقط")]))+
    (manager?`<section class="card"><h3>${L("Authorized requester registry","سجل مقدمي الطلبات المعتمدين")}</h3><p>${L("Only specifically listed, active individuals with submission authorization may create or submit requests. Deactivation blocks access; revoking submission keeps own history readable.","يقدم الطلبات أفراد محددون ونشطون ومعتمدون فقط. التعطيل يمنع الوصول، وسحب اعتماد التقديم يبقي سجل الطلبات الشخصية متاحًا للقراءة.")}</p></section>`:"");
};
E15.technicalPage = () => E15.title("Technical Configuration","الإعدادات التقنية",L("Applications Department handoff — no EMU business authority","تسليم إدارة التطبيقات دون صلاحيات الأعمال للوحدة"))+`<section class="card"><h3>${L("Integration readiness","جاهزية التكامل")}</h3><p>SSO · API · Database · HTTPS</p><p>${L("Pending university backend integration. No API keys or production secrets are stored in this frontend. Business datasets, sponsor imports and full backups are unavailable to this role.","بانتظار تكامل النظام الخلفي للجامعة. لا تُخزّن مفاتيح أو أسرار إنتاجية في الواجهة. لا تتاح بيانات الأعمال أو استيراد الشركاء أو النسخ الشاملة لهذا الدور.")}</p><label for="mockApiPath">${L("Mock API relative path","مسار API تجريبي نسبي")}</label><input id="mockApiPath" value="${esc(state.technicalConfig?.apiPath||"/api/v1")}"><button class="btn primary" id="saveTechnical">${L("Save demo configuration","حفظ الإعداد التجريبي")}</button></section>`;
E15.installAccess = () => {
  Object.assign(E15.labels,{"Applications":"إدارة التطبيقات","College of Business":"كلية إدارة الأعمال","Management":"الإدارة","Delegated EMU Staff":"موظف وحدة مفوّض","System Administrator":"مسؤول النظام","EMU Director":"مدير وحدة إدارة الفعاليات","Authorized Event Requester":"مقدم طلب فعالية معتمد","Delegated":"مفوّض","Not delegated":"غير مفوّض"});
  const entity=E15.entity;E15.entity=(collection,id)=>{const row=entity(collection,id);E15.auth.requireRead(collection,row);return row;};
  const saveRecord=E15.record.save;E15.record.save=(collection,values,id)=>{
    if(collection==="users")return E15.auth.saveUser(values,id);
    if(id)E15.auth.requireRead(collection,entity(collection,id));
    const candidate={...(id?entity(collection,id):{}),...values};
    if(candidate.eventId)E15.auth.requireRead("events",entity("events",candidate.eventId));
    if(E15.auth.role()==="Supporting Department" && (!["tasks","approvals"].includes(collection)||candidate.dept!==E15.auth.user()?.department))E15.fail("Only your assigned department records are editable.","تعديل سجلات إدارتك المكلفة فقط.");
    if(collection==="postReports"&&"managementAuthorized" in values&&values.managementAuthorized!==(id?entity(collection,id).managementAuthorized:false))E15.guard("shareReport");
    if(collection==="events"&&"partners" in values)E15.guard("partners");
    if(collection==="approvals" && ((id&&values.status&&values.status!==entity(collection,id).status)||(!id&&values.status&&values.status!=="Pending")))E15.fail("Use the department decision workflow.","استخدم مسار قرار الإدارة.");
    return saveRecord(collection,values,id);
  };
  const remove=E15.record.remove;E15.record.remove=(collection,id)=>{if(collection==="users")E15.fail("Deactivate users through Director authorization.","عطّل المستخدم عبر اعتماد المدير.");E15.auth.requireRead(collection,entity(collection,id));return remove(collection,id);};
  const change=E15.change.request;E15.change.request=(id,...args)=>{if(!E15.auth.change(entity("events",id)))E15.fail("Only your own approved events may be changed.","يمكن طلب تعديل فعالياتك المعتمدة فقط.");return change(id,...args);};
  const register=E15.attendance.register;E15.attendance.register=(id,values)=>{E15.auth.requireRead("events",entity("events",id));return register(id,values);};
  const checkin=E15.attendance.checkin;E15.attendance.checkin=id=>{E15.guard("attendance");return checkin(id);};
  const loadPrivate=E15.loadPrivatePartners;E15.loadPrivatePartners=(...args)=>{E15.guard("partners");return loadPrivate(...args);};
  const previewCSV=E15.previewPartnerCSV;E15.previewPartnerCSV=(...args)=>{E15.guard("partners");return previewCSV(...args);};
  const getFile=E15.files.get;E15.files.get=async id=>{if(!E15.auth.file(id))E15.fail("File access denied.","الوصول للملف غير مسموح.");return getFile.call(E15.files,id);};
  const putFile=E15.files.put;E15.files.put=async file=>{if(!["request","task","report","edit"].some(a=>E15.allowed(a)))E15.fail("File upload denied.","رفع الملفات غير مسموح.");return putFile.call(E15.files,file);};
  const oldPartner=partnerModal;partnerModal=id=>{E15.guard("partners");const result=oldPartner(id);for(const field of ["pcontact","pp","pe","pnotes"]){const input=$("#"+field);if(input&&!input.value)input.placeholder=L("Private information · backend integration pending", "معلومات خاصة · بانتظار الربط الخلفي");}const save=$("#psave").onclick;$("#psave").onclick=()=>{E15.guard("partners");return save();};return result;};
  const oldExportPartners=exportPartners;exportPartners=()=>{E15.guard("partners");return oldExportPartners();};
  const oldFollow=followModal;followModal=id=>{E15.guard("partners");const result=oldFollow(id);const save=$("#fsav").onclick;$("#fsav").onclick=()=>{E15.guard("partners");return save();};return result;};
  const openWizard=E15.openWizard;E15.openWizard=(id)=>{E15.guard("request");if(id)E15.auth.requireRead("requests",entity("requests",id));return openWizard(id);};
  const openRecord=E15.openRecord;E15.openRecord=(collection,id)=>{const action={tasks:"task",approvals:"approval",reservations:"reservation",volunteers:"volunteer",operations:"operation",postReports:"report",users:"users",designs:"media",expenses:"expense"}[collection]||"edit";E15.guard(action);if(id)E15.auth.requireRead(collection,entity(collection,id));const result=openRecord(collection,id);if(collection==="postReports"&&!E15.allowed("shareReport")&&$("#f-managementAuthorized"))$("#f-managementAuthorized").disabled=true;return result;};
  const oldReport=E15.openReport;E15.openReport=id=>{
    E15.requireRoute("postreports");E15.auth.requireRead("events",entity("events",id));
    if(!E15.allowed("business")&&!state.postReports.some(r=>r.eventId===id&&E15.auth.read("postReports",r)))E15.fail("No management-authorized completed report is available.","لا يوجد تقرير مكتمل معتمد للإدارة.");
    return E15.withView(()=>oldReport(id));
  };
  const oldReview=E15.reviewRequest;E15.reviewRequest=id=>{E15.auth.requireRead("requests",entity("requests",id));return E15.withView(()=>oldReview(id));};
  const oldReadiness=E15.readiness;E15.readiness=id=>{const raw=state;try{if(E15.viewSource)state=E15.viewSource;return oldReadiness(id);}finally{state=raw;}};
  const oldTotals=E15.reportTotals;E15.reportTotals=id=>{const raw=state;try{if(E15.viewSource)state=E15.viewSource;return oldTotals(id);}finally{state=raw;}};
  const dashboard=E15.modules.dashboard;
  E15.modules.dashboard=()=>{
    const r=E15.auth.role();
    if(r==="System Administrator")return E15.title("Technical Dashboard","لوحة التحكم التقنية")+E15.technicalPage();
    if(r==="Authorized Event Requester")return E15.title("My Event Requests","طلبات فعالياتي",null,null,E15.allowed("request")?E15.btn(L("Create request","إنشاء طلب"),"new-request"):"")+`<div class="grid kpis">${["Draft","Submitted","Approved"].map(s=>kpi("requests",E15.t(s),state.requests.filter(r=>r.workflowStatus===s).length,L("Own requests only","طلباتك الشخصية فقط"))).join("")}</div>`+E15.requestsPage();
    if(r==="Supporting Department")return E15.title("Department Workspace","مساحة عمل الإدارة",E15.auth.user()?.department)+E15.tasksPage();
    if(r==="Management Viewer")return E15.title("Executive Dashboard","لوحة التحكم التنفيذية",L("Read-only approved summaries and authorized management reports","ملخصات معتمدة وتقارير إدارية مصرح بها للقراءة فقط"))+`<div class="grid kpis">${kpi("events",L("Approved events","الفعاليات المعتمدة"),state.events.length,L("Read-only summaries","ملخصات للقراءة"))}${kpi("events",L("Checked in","الحضور الفعلي"),state.registrations.filter(r=>r.checkedIn).length,L("Approved event totals","إجمالي الفعاليات المعتمدة"))}${kpi("events",L("Authorized reports","التقارير المصرح بها"),state.postReports.length,L("Completed and shared","مكتملة ومصرح بها"))}</div><section class="card">${E15.btn(L("Executive Insights","المؤشرات التنفيذية"),"open-module","insights")}${E15.btn(L("EMU Intelligence","ملخص الوحدة الذكي"),"intelligence")}${E15.btn(L("Published calendar","التقويم المنشور"),"open-module","calendar")}${state.events.map(eventRow).join("")||E15.empty()}</section>`;
    const html=dashboard();return r==="EMU Director"?html.replace(L("Command Center","مركز التحكم"),L("Executive Dashboard","لوحة التحكم التنفيذية")):html;
  };
  const calendar=E15.modules.calendar;E15.modules.calendar=()=>{const events=state.events;try{if(["Management Viewer","Authorized Event Requester"].includes(E15.auth.role()))state.events=events.filter(e=>e.published&&e.calendarPublication?.status==="Approved");return calendar();}finally{state.events=events;}};
  const calendarRows=E15.calendarRows;E15.calendarRows=()=>calendarRows().filter(e=>!["Management Viewer","Authorized Event Requester"].includes(E15.auth.role())||(e.published&&e.calendarPublication?.status==="Approved"));
  const reports=E15.modules.postreports;E15.modules.postreports=()=>E15.auth.role()==="Management Viewer"?E15.title("Authorized Management Reports","التقارير الإدارية المصرح بها")+E15.table([L("Event","الفعالية"),L("Status","الحالة"),L("Report","التقرير")],state.postReports.map(r=>[esc(E15.eventName(r.eventId)),E15.badge(r.status),E15.btn(L("Open report","فتح التقرير"),"report",r.eventId)])):reports();
  const intelligence=E15.brief;E15.brief=()=>E15.auth.role()==="Management Viewer"?{summary:L(`${state.events.length} approved events; ${state.registrations.filter(r=>r.checkedIn).length} checked-in attendees; ${state.postReports.length} authorized completed reports.`,`${state.events.length} فعالية معتمدة؛ ${state.registrations.filter(r=>r.checkedIn).length} حاضرًا؛ ${state.postReports.length} تقريرًا مكتملًا مصرحًا به.`),priorities:[]}:intelligence();
  E15.modules.access=E15.accessPageSecure;
  const settings=E15.modules.settings;E15.modules.settings=()=>E15.allowed("technical")?E15.technicalPage():settings();
  const attendance=E15.modules.attendance;E15.modules.attendance=()=>{
    if(E15.auth.role()!=="Authorized Event Requester")return attendance();
    const e=state.events.find(e=>String(e.id)===String(E15.filter.attendance?.eventId))||state.events.find(E15.isApproved);
    if(!e)return E15.empty(L("No own or published approved event available.","لا توجد فعالية معتمدة تخصك أو منشورة."));
    const n=E15.reportTotals(e.id);return E15.title("Event Registration","التسجيل في الفعالية")+`<section class="card"><h3>${esc(eventName(e))}</h3>${E15.referenceHTML(e.reference)}<p>${L("Registered","المسجلون")}: ${n.registered} · ${L("Checked in","الحاضرون")}: ${n.attendance}</p>${E15.btn(L("Register","التسجيل"),"register",e.id)}<p>${L("Check-in is recorded by EMU staff. Identity is simulated.","يسجل موظف الوحدة الحضور. الهوية محاكاة تجريبية.")}</p></section>`;
  };
  const btn=E15.btn;E15.btn=(text,action,id="",style)=>{
    const permission=E15.accessPolicy.actionPermissions[action];if(permission&&!E15.allowed(permission))return "";
    if(action==="open-module"&&!E15.auth.route(id))return "";
    if(action==="event-module"&&!E15.auth.route(String(id).split("|")[1]))return "";
    return btn(text,action,id,style);
  };
  for(const [action,original]of Object.entries(E15.handlers))E15.handlers[action]=(...args)=>{
    const permission=E15.accessPolicy.actionPermissions[action];if(permission)E15.guard(permission);
    if(["workspace","workspace-modal","attendance-windows","register","qr-png","qr-download","qr-print","event-edit","partner","link-partners"].includes(action))E15.auth.requireRead(action==="partner"?"partners":"events",entity(action==="partner"?"partners":"events",args[0]));
    if(action==="file"&&!E15.auth.file(args[0]))E15.fail("File access denied.","الوصول للملف غير مسموح.");
    if(["dataset-export","reset-demo"].includes(action))E15.guard("dataExport");
    const reads=["calendar-csv","calendar-json","insights-export","brief-export","volunteer-export","attendance-export","intelligence"];
    if(reads.includes(action))return E15.withView(()=>original(...args));
    return original(...args);
  };
  const intel=E15.openIntelligence;E15.openIntelligence=(...args)=>{E15.guard("intelligence");return E15.withView(()=>{if(E15.auth.role()==="Management Viewer")return openModal(L("EMU Intelligence summary","ملخص الوحدة الذكي"),`<section class="card"><p>${esc(E15.brief().summary)}</p><small>${L("Read-only rule-based summary of authorized data.","ملخص بالقواعد للبيانات المصرح بها للقراءة فقط.")}</small></section>`);return intel(...args);});};
  for(const [key,module]of Object.entries(E15.modules))E15.modules[key]=()=>{E15.requireRoute(key);return E15.withView(()=>module());};
  const rawRender=render;render=(p=page)=>{
    if(!E15.auth.route(p) || (p==="workspace"&&!E15.auth.event(state.events.find(e=>e.id===E15.activeEvent)))){page=p;const content=$("#content");if(content)content.innerHTML=E15.denied();return;}
    if(p==="workspace"&&!E15.allowed("business")){
      const allowedTabs=E15.auth.role()==="Supporting Department"?["overview","schedule","tasks"]:E15.auth.role()==="Authorized Event Requester"?["overview","original","schedule","changes"]:["overview","schedule","report"];
      if(!allowedTabs.includes(E15.workspaceTab))E15.workspaceTab="overview";
    }
    E15.withView(()=>rawRender(p));
    if(p==="workspace"&&!E15.allowed("business"))document.querySelectorAll('[role="tab"]').forEach(b=>{const allowed=E15.auth.role()==="Supporting Department"?["overview","schedule","tasks"]:E15.auth.role()==="Authorized Event Requester"?["overview","original","schedule","changes"]:["overview","schedule","report"];if(!allowed.includes(b.dataset.id))b.remove();});
    E15.bindAccess();
  };
  const rawShell=shell;shell=()=>{const full=[...nav];try{nav.splice(0,nav.length,...full.filter(n=>E15.auth.route(n[0])));return rawShell().replace('<button class="btn secondary" id="logout">',`<button class="btn secondary" id="rolePreviewBtn">${L("Role Preview","معاينة الصلاحيات")}</button><button class="btn secondary" id="logout">`);}finally{nav.splice(0,nav.length,...full);}};
  const rawInit=init;init=()=>{E15.auth.initialize();rawInit();E15.bindAccess();};
  E15.api.list=async collection=>{if(!Array.isArray(state[collection]))return [];return E15.withView(()=>structuredClone(state[collection].filter(r=>E15.auth.read(collection,r))));};
  E15.api.get=async(collection,id)=>{E15.auth.requireRead(collection,entity(collection,id));return E15.withView(()=>structuredClone(state[collection].find(r=>String(r.id)===String(id))));};
  E15.api.delegate=async(...args)=>E15.auth.delegate(...args);
  E15.api.saveUser=async(...args)=>E15.auth.saveUser(...args);
  window.addEventListener("storage",event=>{if(event.key==="emuV15"&&sessionStorage.getItem("emuLogin")==="1"){closeModal();init();}});
  E15.schemas.postReports.push(F("managementAuthorized","Authorize management report viewing","اعتماد إتاحة التقرير للإدارة","checkbox"));
};
E15.bindAccess = () => {
  for(const [id,key] of [["partnerCategory","partnerCategory"],["partnerParticipation","partnerParticipation"]])if($("#"+id))$("#"+id).onchange=e=>{window[key]=e.target.value;render("partners");};
  for(const id of ["rolePreviewBtn","accessPreview"])if($("#"+id))$("#"+id).onclick=()=>E15.rolePreview();
  for(const [id,key]of [["accessStatus","accessStatus"],["accessRole","accessRole"]])if($("#"+id))$("#"+id).onchange=e=>{E15[key]=e.target.value;render("access");};
  document.querySelectorAll('[data-v15="access-user"]').forEach(b=>b.onclick=()=>E15.userDetails(b.dataset.id));
  document.querySelectorAll('[data-v15="access-add"]').forEach(b=>b.onclick=()=>{E15.guard("users");E15.form(L("Add authorized user","إضافة مستخدم معتمد"),[F("name","Name","الاسم","text",[],true),F("email","Email","البريد","email",[],true),F("role","Role","الدور","select",E15.roles,true),F("department","College / Department","الكلية / الإدارة","text",[],true),F("status","Status","الحالة","select",["Active","Inactive"],true),F("requestAuthorized","Authorize submission","اعتماد تقديم الطلبات","checkbox")],{status:"Active",role:"Authorized Event Requester",requestAuthorized:true},v=>E15.auth.saveUser(v));});
  if($("#saveTechnical"))$("#saveTechnical").onclick=()=>{E15.guard("technical");const path=$("#mockApiPath").value;if(!/^\/[a-zA-Z0-9/_-]*$/.test(path)){showErrors([L("Use a relative path only.","استخدم مسارًا نسبيًا فقط.")]);return;}E15.transaction(()=>{const before=state.technicalConfig;state.technicalConfig={apiPath:path};E15.audit("Technical configuration changed","technicalConfig",before,state.technicalConfig);});toast(L("Demo configuration saved","حُفظ الإعداد التجريبي"));};
};
