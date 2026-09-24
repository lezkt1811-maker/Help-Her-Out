const KEY = "helpHerOutTasksV1";

let photoData = [];
let activeFilter = "All";


const demoTasks = [

{
 id:"t1",
 title:"Help move a dresser upstairs",
 category:"Moving",
 payment:65,
 duration:1.5,
 area:"Riverside",
 distance:3.4,
 date:"Saturday",
 description:"Need help getting one solid wood dresser from my garage to a second-floor bedroom.",
 physical:"Stairs and moderate lifting.",
 verified:true,
 completed:8,
 buddy:true,
 leadPay:50,
 buddyPay:15
},

{
 id:"t2",
 title:"Organize garage shelves",
 category:"Household",
 payment:75,
 duration:3,
 area:"Parkville",
 distance:5.1,
 date:"Sunday",
 description:"Help sort storage bins, label shelves and move lighter household items.",
 physical:"Standing and light lifting.",
 verified:true,
 completed:12,
 buddy:false
},

{
 id:"t3",
 title:"Yard cleanup",
 category:"Outdoors",
 payment:90,
 duration:3,
 area:"Gladstone",
 distance:7.2,
 date:"This Week",
 description:"Leaves, branches and general backyard cleanup. Rake and bags provided.",
 physical:"Outdoor work and bending.",
 verified:true,
 completed:5,
 buddy:true,
 leadPay:70,
 buddyPay:20
},

{
 id:"t4",
 title:"Marketplace pickup",
 category:"Errands",
 payment:40,
 duration:1,
 area:"North Kansas City",
 distance:8.4,
 date:"Today",
 description:"Help pick up a small shelving unit and bring it back to my apartment.",
 physical:"Fits in SUV.",
 verified:false,
 completed:1,
 buddy:true,
 leadPay:30,
 buddyPay:10
},

{
 id:"t5",
 title:"Set up Wi-Fi and printer",
 category:"Tech",
 payment:45,
 duration:1.5,
 area:"Liberty",
 distance:11.2,
 date:"This Week",
 description:"New router is installed. Need help reconnecting television and wireless printer.",
 physical:"No heavy lifting.",
 verified:true,
 completed:17,
 buddy:false
},

{
 id:"t6",
 title:"Kitchen cabinet cleaning",
 category:"Cleaning",
 payment:80,
 duration:3,
 area:"Zona Rosa",
 distance:4.3,
 date:"Saturday",
 description:"Deep clean inside and outside kitchen cabinets. Cleaning supplies provided.",
 physical:"Some reaching and standing.",
 verified:true,
 completed:6,
 buddy:false
},

{
 id:"t7",
 title:"Help pack apartment",
 category:"Moving",
 payment:110,
 duration:4,
 area:"Kansas City Northland",
 distance:6.8,
 date:"Sunday",
 description:"Packing books, kitchen items and clothes into boxes before moving.",
 physical:"Mostly light items.",
 verified:true,
 completed:10,
 buddy:true,
 leadPay:85,
 buddyPay:25
},

{
 id:"t8",
 title:"Cat check-ins",
 category:"Pets",
 payment:35,
 duration:1,
 area:"Lake Waukomis",
 distance:2.9,
 date:"This Week",
 description:"Feed two cats, refresh water and scoop litter while I am away.",
 physical:"No special requirements.",
 verified:true,
 completed:21,
 buddy:false
}

];


// Demo tasks are a shared module-level template; always hand out fresh
// per-object copies so marking one requested/completed can't leak back
// into the template (and reappear after a "reset demo data").
function cloneDemoTasks(){
 return demoTasks.map(t=>({...t}));
}


function loadTasks(){

 const saved = localStorage.getItem(KEY);

 if(saved){
   return JSON.parse(saved);
 }

 const fresh = cloneDemoTasks();

 localStorage.setItem(KEY,JSON.stringify(fresh));

 return fresh;
}


let tasks = [];


const filterNames = [
 "All",
 "Near Me",
 "Highest Pay",
 "Today",
 "Moving",
 "Household",
 "Cleaning",
 "Outdoors",
 "Errands",
 "Tech",
 "Pets"
];


// Pure: does not mutate `list`, safe to unit test in isolation.
function filterTasks(list,filterName){

 let arr = [...list];

 if(filterName==="Near Me"){
   arr.sort((a,b)=>a.distance-b.distance);
 }

 else if(filterName==="Highest Pay"){
   arr.sort((a,b)=>b.payment-a.payment);
 }

 else if(filterName==="Today"){
   arr = arr.filter(x=>x.date==="Today");
 }

 else if(filterName!=="All"){
   arr = arr.filter(x=>x.category===filterName);
 }

 return arr;

}


// Pure: mirrors the buddy-pay split used when a poster requires a first-visit buddy.
// Clamped to `payment` so leadPay can never go negative for payments under the
// form's $10 minimum.
function computeBuddyPay(payment,buddyRequired){

 const buddyPay = buddyRequired
   ? Math.min(payment,Math.max(10,Math.round(payment*.22)))
   : 0;

 return {
   buddyPay,
   leadPay:payment-buddyPay
 };

}


// Pure: groups a task list into what "this user" posted, requested, or is
// buddying on, for the Profile page's My Activity card.
function computeActivity(taskList){

 return {
   posted:taskList.filter(t=>t.id.startsWith("user_")),
   requested:taskList.filter(t=>t.requested),
   buddying:taskList.filter(t=>t.buddyRequested)
 };

}


const checkinSteps = [
 { id:"ciHeading", label:"Heading there", toastMessage:"Heading there status saved" },
 { id:"ciArrived", label:"Arrived", toastMessage:"Arrival saved" },
 { id:"ciBuddy", label:"Buddy checked in", toastMessage:"Buddy check-in saved" },
 { id:"ciStarted", label:"Task started", toastMessage:"Task started" },
 { id:"ciCompleted", label:"Task completed", toastMessage:"Task completed" }
];


// Pure: a check-in step only ever moves forward, and clicking an earlier
// step again should not un-complete a later one.
function nextCheckinStep(currentStep,clickedIndex){
 return Math.max(currentStep,clickedIndex);
}


// Pure: human-readable status line for the current check-in step.
function checkinStatusLabel(step){
 return step<0 ? "Not started" : checkinSteps[step].label;
}


// Pure: "today + 2 days" as YYYY-MM-DD, used to prefill the post-task date field.
function computeDefaultDateISO(now=new Date()){

 const d = new Date(now);

 d.setDate(d.getDate()+2);

 return d.toISOString().slice(0,10);

}


function renderFilters(){

 const wrap = document.getElementById("filters");

 wrap.innerHTML = filterNames.map(x => `
   <button
     class="filter ${activeFilter===x ? "active" : ""}"
     onclick="setFilter('${x}')">
     ${x}
   </button>
 `).join("");

}


function setFilter(name){

 activeFilter = name;

 renderFilters();

 renderTasks();

}


function renderTasks(){

 const arr = filterTasks(tasks,activeFilter);


 document.getElementById("taskList").innerHTML =
 arr.length
 ?
 arr.map(taskCard).join("")
 :
 `<div class="card"><div class="desc">No tasks found in this category yet.</div></div>`;

 document.getElementById("statOpen").textContent = tasks.length;

 renderMyActivity();

}


function renderMyActivity(){

 const el = document.getElementById("myActivity");

 if(!el) return;


 const { posted, requested, buddying } = computeActivity(tasks);


 const rows = [
   ...posted.map(t=>activityRow("POSTED","",t)),
   ...requested.map(t=>activityRow("REQUESTED","",t)),
   ...buddying.map(t=>activityRow("BUDDY","buddy",t))
 ];


 el.innerHTML = rows.length
   ? rows.join("")
   : `<p class="desc">No activity yet. Post a task or request one from Find Work.</p>`;

}


function activityRow(label,badgeClass,t){

 return `
   <div class="meta" style="justify-content:space-between;align-items:center">
     <span>${safe(t.title)}</span>
     <span class="badge ${badgeClass}">${label}</span>
   </div>
 `;

}


function taskCard(t){

 const hourly = Math.round(t.payment/t.duration);

 return `

 <div class="card">

   <div class="task-top">

     <div>

       <h3>${safe(t.title)}</h3>

       <div class="meta">

         <span class="badge">
           ${safe(t.category)}
         </span>

         <span class="badge">
           📍 ${safe(t.area)}
         </span>

         <span class="badge">
           ${t.distance} mi
         </span>

         ${
           t.verified
           ?
           `<span class="badge verified">✓ ID VERIFIED</span>`
           :
           `<span class="badge">ID UNVERIFIED</span>`
         }

         ${
           t.buddy
           ?
           `<span class="badge buddy">👯 BUDDY VISIT</span>`
           :
           ""
         }

       </div>

     </div>

     <div class="pay">
       $${t.payment}
     </div>

   </div>

   <div class="desc">
     ${safe(t.description)}
   </div>

   <div class="meta">

     <span class="badge">
       ⏱ ${t.duration} hr
     </span>

     <span class="badge">
       ≈ $${hourly}/hr
     </span>

     <span class="badge">
       ${t.date}
     </span>

   </div>

   <div class="task-actions">

     <button class="btn primary"
             onclick="openTask('${t.id}')">
       VIEW TASK
     </button>

     ${
       t.buddy
       ?
         (t.buddyRequested
           ? `<button class="btn secondary" disabled>✓ BUDDY REQUESTED</button>`
           : `<button class="btn secondary"
                      onclick="buddyRequest('${t.id}')">
                JOIN AS BUDDY
              </button>`)
       :
         (t.requested
           ? `<button class="btn secondary" disabled>✓ REQUESTED</button>`
           : `<button class="btn secondary"
                      onclick="requestTask('${t.id}')">
                REQUEST TASK
              </button>`)
     }

   </div>

 </div>

 `;

}


function openTask(id){

 const t = tasks.find(x=>x.id===id);

 if(!t) return;


 document.getElementById("modalTitle").textContent = t.title;


 let buddyBlock = "";

 if(t.buddy){

   buddyBlock = `

   <div class="card">

     <h3>👯 First Visit Buddy</h3>

     <div class="meta">
       <span class="badge buddy">BUDDY REQUIRED</span>
     </div>

     <p class="desc">
       Two paid taskers attend this first visit.
     </p>

     <hr>

     <div style="display:flex;justify-content:space-between">
       <span>Lead Tasker</span>
       <span class="money">$${t.leadPay}</span>
     </div>

     <div style="display:flex;justify-content:space-between;margin-top:8px">
       <span>Safety Buddy</span>
       <span class="money">$${t.buddyPay}</span>
     </div>

   </div>

   `;

 }


 document.getElementById("modalContent").innerHTML = `

 <div class="pay" style="font-size:31px">
   $${t.payment}
 </div>

 <div class="meta">

   <span class="badge">
     ${safe(t.category)}
   </span>

   <span class="badge">
     📍 ${safe(t.area)}
   </span>

   <span class="badge">
     ${t.distance} miles away
   </span>

 </div>


 <div class="card">

   <h3>Task Details</h3>

   <p class="desc">
     ${safe(t.description)}
   </p>

   <p class="desc">
     <strong>Physical requirements:</strong><br>
     ${safe(t.physical)}
   </p>

 </div>


 <div class="card">

   <h3>Client Profile</h3>

   <div class="meta">

     ${
       t.verified
       ?
       `<span class="badge verified">✓ ID VERIFIED</span>`
       :
       `<span class="badge">ID UNVERIFIED</span>`
     }

     <span class="badge">
       ${t.completed} completed tasks
     </span>

   </div>

   <p class="desc">
     96% of taskers would work with this client again.
   </p>

 </div>


 ${buddyBlock}


 <div class="card">

   <h3>📷 Task Area Photos</h3>

   ${
     t.photos && t.photos.length
     ?
     `<div class="photo-previews">
        ${t.photos.map(src=>`<img src="${src}">`).join("")}
      </div>`
     :
     `<p class="desc">
        Task posters can upload previews showing the room,
        furniture, boxes, yard or other work area before you accept.
      </p>`
   }

 </div>


 ${
   t.requested
   ?
   `<button class="btn primary" disabled>✓ REQUEST SENT</button>`
   :
   `<button class="btn primary"
            onclick="requestTask('${t.id}')">
      REQUEST THIS TASK
    </button>`
 }


 ${
   t.buddy
   ?
     (t.buddyRequested
       ? `<button class="btn secondary" style="margin-top:8px" disabled>✓ BUDDY REQUEST SENT</button>`
       : `<button class="btn secondary"
                  style="margin-top:8px"
                  onclick="buddyRequest('${t.id}')">
            JOIN AS SAFETY BUDDY
          </button>`)
   :
   ""
 }


 <button class="btn danger"
         style="margin-top:8px"
         onclick="toast('Report saved locally')">
   REPORT TASK
 </button>

 `;


 document.getElementById("taskModal").classList.add("open");

}


function closeTask(){

 document.getElementById("taskModal").classList.remove("open");

}


function modalBackground(e){

 if(e.target.id==="taskModal"){
   closeTask();
 }

}


function requestTask(id){

 const t = tasks.find(x=>x.id===id);

 if(!t) return;

 if(!t.requested){
   t.requested = true;
   localStorage.setItem(KEY,JSON.stringify(tasks));
   renderTasks();
 }

 toast(`Request sent for ${t.title}`);

 closeTask();

}


function buddyRequest(id){

 const t = tasks.find(x=>x.id===id);

 if(!t) return;

 if(!t.buddyRequested){
   t.buddyRequested = true;
   localStorage.setItem(KEY,JSON.stringify(tasks));
   renderTasks();
 }

 toast(`Buddy request sent for ${t.title}`);

 closeTask();

}


function go(name){

 document.querySelectorAll(".view").forEach(v=>{
   v.classList.remove("active");
 });

 document.getElementById(name).classList.add("active");


 document.querySelectorAll(".nav button").forEach(b=>{
   b.classList.toggle("active",b.dataset.view===name);
 });


 window.scrollTo({
   top:0,
   behavior:"smooth"
 });

}


function verifyID(){

 localStorage.setItem("hho_verified","yes");

 showVerification();

 toast("Prototype ID verification enabled");

}


function showVerification(){

 const badge = document.getElementById("idBadge");

 if(localStorage.getItem("hho_verified")==="yes"){

   badge.textContent="✓ ID VERIFIED";

   badge.classList.add("verified");

 }

}


function saveTrusted(){

 const name=document.getElementById("trustedName").value.trim();

 const phone=document.getElementById("trustedPhone").value.trim();


 localStorage.setItem(
   "hho_trusted",
   JSON.stringify({name,phone})
 );


 toast("Trusted contact saved");

}


function loadTrusted(){

 const x=JSON.parse(
   localStorage.getItem("hho_trusted") || "null"
 );


 if(x){

   document.getElementById("trustedName").value=x.name || "";

   document.getElementById("trustedPhone").value=x.phone || "";

 }

}


const CHECKIN_KEY = "hho_checkin";


function getCheckinStep(){

 const raw = localStorage.getItem(CHECKIN_KEY);

 return raw===null ? -1 : Number(raw);

}


function setCheckinStep(index){

 const next = nextCheckinStep(getCheckinStep(),index);

 localStorage.setItem(CHECKIN_KEY,String(next));

 renderCheckin();

 toast(checkinSteps[index].toastMessage);

}


function renderCheckin(){

 const step = getCheckinStep();


 checkinSteps.forEach((s,i)=>{

   const btn = document.getElementById(s.id);

   if(!btn) return;

   btn.classList.toggle("done",i<=step);

 });


 const statusEl = document.getElementById("checkinStatus");

 if(statusEl){
   statusEl.textContent = "Status: "+checkinStatusLabel(step);
 }

}


function resetCheckin(){

 localStorage.removeItem(CHECKIN_KEY);

 renderCheckin();

}


function leaveNow(){

 toast("Appointment ended. Move to a safe location.");

 resetCheckin();

 setTimeout(()=>{

   if(confirm(
     "Do you want to call emergency services?\n\nPress OK to open the phone dialer."
   )){

     location.href="tel:911";

   }

 },600);

}


function resetDemo(){

 if(!confirm("Reset all Help Her Out prototype data?")){
   return;
 }


 localStorage.removeItem(KEY);

 localStorage.removeItem("hho_verified");

 localStorage.removeItem("hho_trusted");

 localStorage.removeItem(CHECKIN_KEY);


 tasks=cloneDemoTasks();

 localStorage.setItem(KEY,JSON.stringify(tasks));


 renderTasks();

 showVerification();

 renderCheckin();

 toast("Demo reset");

}


function safe(value=""){

 return String(value).replace(
   /[&<>"']/g,
   c=>({
     "&":"&amp;",
     "<":"&lt;",
     ">":"&gt;",
     '"':"&quot;",
     "'":"&#039;"
   })[c]
 );

}


let toastTimer;


function toast(message){

 const el=document.getElementById("toast");

 el.textContent=message;

 el.classList.add("show");


 clearTimeout(toastTimer);


 toastTimer=setTimeout(()=>{
   el.classList.remove("show");
 },2200);

}


function setDefaultDate(){

 document.getElementById("date").value = computeDefaultDateISO();

}


function initApp(){

 tasks = loadTasks();


 document.getElementById("photos").addEventListener("change",e=>{

   const files = [...e.target.files].slice(0,5);

   photoData = [];

   const wrap = document.getElementById("photoPreview");

   wrap.innerHTML = "";

   files.forEach(file=>{

     const reader = new FileReader();

     reader.onload = ev=>{

       photoData.push(ev.target.result);

       const img = document.createElement("img");

       img.src = ev.target.result;

       wrap.appendChild(img);

     };

     reader.readAsDataURL(file);

   });

 });


 document.getElementById("postForm").addEventListener("submit",e=>{

   e.preventDefault();


   const payment = Number(document.getElementById("payment").value);

   const duration = Number(document.getElementById("duration").value);

   const buddy = document.getElementById("buddyRequired").checked;


   const {buddyPay,leadPay} = computeBuddyPay(payment,buddy);


   const task = {

     id:"user_"+Date.now(),

     title:document.getElementById("title").value.trim(),

     category:document.getElementById("category").value,

     payment,

     duration,

     area:document.getElementById("area").value.trim(),

     distance:2.5,

     date:document.getElementById("date").value,

     description:document.getElementById("description").value.trim(),

     physical:document.getElementById("physical").value.trim() || "Not specified",

     verified:true,

     completed:4,

     buddy,

     leadPay,

     buddyPay,

     photos:photoData

   };


   tasks.unshift(task);

   localStorage.setItem(KEY,JSON.stringify(tasks));


   e.target.reset();

   document.getElementById("photoPreview").innerHTML="";

   photoData=[];


   renderTasks();

   go("work");

   toast("Paid task posted");

 });


 renderFilters();

 renderTasks();

 showVerification();

 loadTrusted();

 setDefaultDate();

 renderCheckin();

}


if(typeof document !== "undefined" && document.getElementById("postForm")){
 initApp();
}


if(typeof module !== "undefined" && module.exports){

 module.exports = {
   safe,
   computeBuddyPay,
   filterTasks,
   computeDefaultDateISO,
   computeActivity,
   nextCheckinStep,
   checkinStatusLabel,
   checkinSteps,
   demoTasks,
   filterNames
 };

}
