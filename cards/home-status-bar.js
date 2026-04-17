// custom:home-status-bar — Jarvis Edition
// Status pill bar showing active lights, heating rooms, lock/car status, appliances
// Tap a pill to expand a dropdown list of which entities are active
// Config: lights[], climates[], lock, car_lock, car_fuel, alarm, printer, robovac, dryer

class HomeStatusBar extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._hass=null;this._config=null;this._t=null;this._lastKey=null;this._open=null;}
  setConfig(c){this._config=c;}
  set hass(h){this._hass=h;if(this._t)return;this._t=setTimeout(()=>{this._t=null;const c=this._config;if(!c)return;const watched=[c.lock,c.car_lock,c.car_fuel,c.alarm,c.printer,c.robovac,c.dryer,...(c.lights||[]),...(c.climates||[])].filter(Boolean);const key=watched.map(id=>this._hass.states[id]?.state??'').join('|');if(key!==this._lastKey){this._lastKey=key;this._render();}},80);}
  _name(id){return this._hass.states[id]?.attributes?.friendly_name??id.split('.')[1].replace(/_/g,' ');}
  _fireMoreInfo(entityId){this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId}}));}
  _render(){
    const h=this._hass,c=this._config;if(!h||!c)return;
    const lightsOnList=(c.lights||[]).filter(id=>h.states[id]?.state==='on');const lightsOn=lightsOnList.length;
    const heatingList=(c.climates||[]).filter(id=>h.states[id]?.state==='heat');const heatingRooms=heatingList.length;const totalRooms=(c.climates||[]).length;
    const locked=h.states[c.lock]?.state==='locked';const carLocked=h.states[c.car_lock]?.state==='locked';
    const fuel=c.car_fuel?parseInt(h.states[c.car_fuel]?.state??'0')||0:null;const fuelLow=fuel!==null&&fuel<20;
    const printerOn=c.printer&&h.states[c.printer]?.state==='on';const dryerOn=c.dryer&&h.states[c.dryer]?.state==='on';const vacCleaning=c.robovac&&h.states[c.robovac]?.state==='cleaning';
    const pillDefs=[
      {id:'lights',show:lightsOn>0,icon:'mdi:lightbulb-group',label:`${lightsOn} light${lightsOn!==1?'s':''} on`,col:'rgb(255,210,60)',entity:null,items:lightsOnList.map(id=>({name:this._name(id),icon:'mdi:lightbulb',col:'rgb(255,210,60)',entity:id}))},
      {id:'heating',show:heatingRooms>0,icon:'mdi:radiator',label:`${heatingRooms}/${totalRooms} heating`,col:'rgb(255,90,50)',entity:c.climates?.[0],items:heatingList.map(id=>({name:this._name(id),icon:'mdi:radiator',col:'rgb(255,90,50)',entity:id}))},
      {id:'lock',show:!locked,icon:'mdi:lock-open',label:'Door unlocked',col:'rgb(255,80,80)',entity:c.lock,items:[{name:'Front door is UNLOCKED',icon:'mdi:lock-open',col:'rgb(255,80,80)',entity:c.lock}]},
      {id:'carlock',show:c.car_lock&&!carLocked,icon:'mdi:car',label:'Car unlocked',col:'rgb(255,160,0)',entity:c.car_lock,items:[{name:'Car is UNLOCKED',icon:'mdi:car',col:'rgb(255,160,0)',entity:c.car_lock}]},
      {id:'fuel',show:fuelLow,icon:'mdi:gas-station',label:`Fuel ${fuel}%`,col:'rgb(255,160,0)',entity:c.car_fuel,items:[{name:`${fuel}% remaining`,icon:'mdi:gas-station',col:'rgb(255,160,0)',entity:c.car_fuel}]},
      {id:'dryer',show:dryerOn,icon:'mdi:tumble-dryer',label:'Dryer running',col:'rgb(100,200,255)',entity:c.dryer,items:[{name:'Tumble dryer running',icon:'mdi:tumble-dryer',col:'rgb(100,200,255)',entity:c.dryer}]},
      {id:'printer',show:printerOn,icon:'mdi:printer-3d',label:'Printing',col:'rgb(120,180,255)',entity:c.printer,items:[{name:'3D Printer is on',icon:'mdi:printer-3d',col:'rgb(120,180,255)',entity:c.printer}]},
      {id:'vac',show:vacCleaning,icon:'mdi:robot-vacuum',label:'Robovac cleaning',col:'rgb(100,220,180)',entity:c.robovac,items:[{name:'Robovac cleaning',icon:'mdi:robot-vacuum',col:'rgb(100,220,180)',entity:c.robovac}]},
    ].filter(p=>p.show);
    const allClear=pillDefs.length===0;
    const renderDropdown=(p)=>{if(this._open!==p.id)return'';return`<div class="drop">${p.items.map(it=>`<div class="di" data-entity="${it.entity||''}"><ha-icon icon="${it.icon}" style="color:${it.col}"></ha-icon><span>${it.name}</span></div>`).join('')}</div>`;};
    const html=allClear?`<div class="pill a" style="--pc:rgb(50,215,110)"><ha-icon icon="mdi:check-circle"></ha-icon><span>All clear</span></div>`:pillDefs.map(p=>`<div class="pw" data-id="${p.id}"><div class="pill a" style="--pc:${p.col}" data-id="${p.id}"><ha-icon icon="${p.icon}"></ha-icon><span>${p.label}</span><ha-icon icon="mdi:chevron-${this._open===p.id?'up':'down'}" class="chv"></ha-icon></div>${renderDropdown(p)}</div>`).join('');
    this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box;margin:0;padding:0}:host{display:block}.bar{display:flex;flex-wrap:wrap;gap:6px;padding:6px 0}.pw{position:relative;display:flex;flex-direction:column}.pill{display:flex;align-items:center;gap:5px;padding:5px 10px 5px 8px;border-radius:20px;border:none;background:color-mix(in srgb,var(--pc) 18%,transparent);cursor:pointer;user-select:none;}.pill ha-icon{--mdc-icon-size:14px;color:var(--pc);flex-shrink:0;pointer-events:none}.pill .chv{--mdc-icon-size:11px;color:color-mix(in srgb,var(--pc) 60%,white);margin-left:1px}.pill span{font-size:11px;font-weight:700;color:rgba(255,255,255,.9);white-space:nowrap;pointer-events:none}.drop{position:absolute;top:calc(100% + 6px);left:0;z-index:999;min-width:180px;background:rgba(12,18,30,.96);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:6px;box-shadow:0 8px 32px rgba(0,0,0,.7);}.di{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;cursor:pointer;}.di:hover{background:rgba(255,255,255,.08)}.di ha-icon{--mdc-icon-size:14px;flex-shrink:0;pointer-events:none}.di span{font-size:11px;font-weight:600;color:rgba(255,255,255,.75);white-space:nowrap;pointer-events:none}</style><div class="bar" id="bar">${html}</div>`;
    const bar=this.shadowRoot.getElementById('bar');if(!bar)return;
    bar.addEventListener('click',e=>{const di=e.target.closest('.di');if(di){e.stopPropagation();const eid=di.dataset.entity;if(eid)this._fireMoreInfo(eid);this._open=null;this._render();return;}const pw=e.target.closest('.pw');if(!pw){this._open=null;this._render();return;}const id=pw.dataset.id;this._open=this._open===id?null:id;this._render();e.stopPropagation();});
    const close=e=>{if(!this.shadowRoot.contains(e.target)){this._open=null;this._render();document.removeEventListener('click',close);}};
    if(this._open)setTimeout(()=>document.addEventListener('click',close),0);
  }
  getCardSize(){return 1;}
}
customElements.define('home-status-bar',HomeStatusBar);
