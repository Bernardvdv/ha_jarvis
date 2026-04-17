// custom:room-calendar — Jarvis Edition
// Calendar widget with month view + upcoming events list
// Config: entity (calendar entity ID) or entities[] for multiple calendars

class RoomCalendar extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._hass=null;this._config=null;this._events=[];this._view='month';this._cursor=new Date();this._cursor.setDate(1);this._fetching=false;}
  setConfig(c){this._config=c;}
  set hass(h){this._hass=h;if(!this._fetching)this._fetch();}
  async _fetch(){
    this._fetching=true;const y=this._cursor.getFullYear(),m=this._cursor.getMonth();
    const start=new Date(y,m,1).toISOString(),end=new Date(y,m+1,0,23,59,59).toISOString();
    try{const ents=(this._config.entities||[this._config.entity]).filter(Boolean);const res=await Promise.all(ents.map(id=>this._hass.callApi('GET',`calendars/${id}?start=${start}&end=${end}`).then(r=>r||[]).catch(()=>[])));this._events=res.flat().sort((a,b)=>new Date(a.start.dateTime||a.start.date)-new Date(b.start.dateTime||b.start.date));}catch(e){this._events=[];}
    this._fetching=false;this._render();
  }
  _render(){
    const y=this._cursor.getFullYear(),m=this._cursor.getMonth();const today=new Date();today.setHours(0,0,0,0);const mn=this._cursor.toLocaleString('default',{month:'long',year:'numeric'});const first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),pivot=(first+6)%7;
    const ebd={};this._events.forEach(ev=>{const d=(ev.start.dateTime||ev.start.date).slice(0,10);if(!ebd[d])ebd[d]=[];ebd[d].push(ev);});
    const up=this._events.filter(ev=>new Date(ev.start.dateTime||ev.start.date)>=today).slice(0,8);
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let cells='';for(let i=0;i<pivot;i++)cells+='<div class="cc e"></div>';
    for(let d=1;d<=dim;d++){const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,iT=new Date(y,m,d).getTime()===today.getTime(),evs=ebd[ds]||[];cells+=`<div class="cc${iT?' t':''}${evs.length?' h':''}"><span class="dn">${d}</span>${evs.slice(0,3).map(()=>'<span class="dt"></span>').join('')}</div>`;}
    const ag=up.map(ev=>{const s=ev.start.dateTime?new Date(ev.start.dateTime):new Date(ev.start.date),ad=!ev.start.dateTime,dl=s.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'}),tl=ad?'All day':s.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});return`<div class="ar"><div class="ad">${dl}</div><div class="at">${tl}</div><div class="as">${ev.summary||'Event'}</div></div>`;}).join('');
    this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box;margin:0;padding:0}:host{display:block}.card{background:rgba(0,0,0,0.38);border-radius:18px;padding:14px;color:white;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 4px 24px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,0.09)}.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.ct{font-size:14px;font-weight:700;letter-spacing:.3px}.cn{display:flex;align-items:center;gap:4px}.nb{background:rgba(255,255,255,.08);border:none;border-radius:50%;width:26px;height:26px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white}.nb ha-icon{--mdc-icon-size:14px;pointer-events:none}.vt{display:flex;gap:4px}.vb{background:rgba(255,255,255,.08);border:none;border-radius:8px;padding:3px 8px;font-size:10px;color:rgba(255,255,255,.5);cursor:pointer;font-weight:600;letter-spacing:.3px}.vb.ac{background:rgba(100,160,255,.25);color:rgba(130,190,255,.9)}.dr{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:4px}.dw{font-size:9px;font-weight:700;color:rgba(255,255,255,.3);text-align:center;letter-spacing:.4px;text-transform:uppercase}.cg{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}.cc{min-height:32px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:3px 2px}.cc.h{background:rgba(255,255,255,.06)}.cc.t{background:rgba(100,160,255,.22)}.cc.t .dn{color:rgb(130,190,255);font-weight:800}.cc.e{background:none}.dn{font-size:11px;font-weight:500;color:rgba(255,255,255,.45)}.cc.h .dn{color:rgba(255,255,255,.85)}.dt{display:inline-block;width:4px;height:4px;border-radius:50%;background:rgba(100,180,255,.7);margin:1px}.as2{margin-top:10px;border-top:1px solid rgba(255,255,255,.07);padding-top:8px}.ae{font-size:11px;color:rgba(255,255,255,.25);text-align:center;padding:8px 0}.ar{display:grid;grid-template-columns:80px 50px 1fr;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);align-items:center}.ar:last-child{border-bottom:none}.ad{font-size:10px;font-weight:600;color:rgba(100,180,255,.8)}.at{font-size:10px;color:rgba(255,255,255,.35)}.as{font-size:11px;font-weight:600;color:rgba(255,255,255,.75);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
<div class="card">
<div class="ch"><span class="ct">${mn}</span><div class="cn"><div class="vt"><button class="vb${this._view==='month'?' ac':''}" id="vm">Month</button><button class="vb${this._view==='agenda'?' ac':''}" id="va">List</button></div><button class="nb" id="np"><ha-icon icon="mdi:chevron-left"></ha-icon></button><button class="nb" id="nn"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div></div>
${this._view==='month'?`<div class="dr">${days.map(d=>`<div class="dw">${d}</div>`).join('')}</div><div class="cg">${cells}</div><div class="as2">${up.length?ag:'<div class="ae">No upcoming events</div>'}</div>`:`<div class="as2" style="margin-top:0;border-top:none;padding-top:0">${up.length?ag:'<div class="ae">No upcoming events</div>'}</div>`}
</div>`;
    this.shadowRoot.getElementById('np').addEventListener('click',()=>{this._cursor.setMonth(this._cursor.getMonth()-1);this._fetch();});
    this.shadowRoot.getElementById('nn').addEventListener('click',()=>{this._cursor.setMonth(this._cursor.getMonth()+1);this._fetch();});
    this.shadowRoot.getElementById('vm').addEventListener('click',()=>{this._view='month';this._render();});
    this.shadowRoot.getElementById('va').addEventListener('click',()=>{this._view='agenda';this._render();});
  }
  getCardSize(){return 5;}
}
customElements.define('room-calendar',RoomCalendar);
