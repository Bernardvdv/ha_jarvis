// custom:overview-card — Jarvis Edition
// Full-screen panel card containing all room cards + control strip + fixed navbar
// Used as a panel view to avoid HA sections layout conflicts
// Config: rooms[] (room-card configs), controls[] (control-card configs)
// See README.md for full config reference

class OverviewCard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._hass=null;this._config=null;this._built=false;this._t=null;}
  setConfig(c){this._config=c||{};}
  set hass(h){this._hass=h;if(!this._built){this._built=true;this._build();}else{if(this._t)return;this._t=setTimeout(()=>{this._t=null;this._up();},120);}}
  getCardSize(){return 20;}
  connectedCallback(){this._sizeToViewport();}
  _sizeToViewport(){
    const j=this.shadowRoot?.querySelector('.ov');if(j)j.style.height=window.innerHeight+'px';
    if(!this._ro){this._ro=new ResizeObserver(()=>{const j2=this.shadowRoot?.querySelector('.ov');if(j2)j2.style.height=window.innerHeight+'px';});this._ro.observe(document.documentElement);}
  }
  _nav(){
    const routes=this._config.navbar||[
      {icon:'mdi:home',url:'/dashboard-jarvis/0'},
      {icon:'mdi:view-dashboard',url:'/dashboard-jarvis/overview'},
      {icon:'mdi:security',url:'/dashboard-jarvis/security'},
      {icon:'mdi:car',url:'/dashboard-jarvis/vehicle'},
      {icon:'mdi:music',url:'/dashboard-jarvis/music'},
      {icon:'mdi:battery-30-bluetooth',url:'/dashboard-jarvis/battery'},
      {icon:'mdi:robot',url:'/dashboard-jarvis/jarvis'},
    ];
    const cur=window.location.pathname;
    return routes.map(r=>`<div class="nbb${cur===r.url||cur.startsWith(r.url+'/')?' act':''}" data-u="${r.url}"><ha-icon icon="${r.icon}"></ha-icon></div>`).join('');
  }
  _build(){
    const c=this._config;
    const rooms=c.rooms||[];const controls=c.controls||[];
    const roomSlots=rooms.map((_,i)=>`<div class="rslot" id="rs${i}"></div>`).join('');
    const ctrlSlots=controls.map((_,i)=>`<div class="cslot" id="cs${i}"></div>`).join('');
    this.shadowRoot.innerHTML=`<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}:host{display:block;width:100%;}
.ov{width:100%;background:#010d1a;display:flex;flex-direction:column;overflow:hidden;gap:6px;padding:6px 6px 70px 6px;}
.room-grid{flex:1;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(2,1fr);gap:6px;min-height:0;}
.rslot{min-height:0;overflow:hidden;}
.ctrl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;height:90px;flex-shrink:0;}
.cslot{min-height:0;}
.navbar{position:fixed;bottom:0;left:0;right:0;z-index:9999;display:flex;align-items:center;justify-content:center;gap:10px;padding:9px 18px 12px;background:rgba(1,8,20,.97);border-top:1px solid rgba(0,190,255,.2);}
.nbb{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.15);transition:all .15s;}
.nbb:hover{background:rgba(0,130,255,.22);border-color:rgba(0,210,255,.35);}.nbb.act{background:rgba(0,190,255,.2);border-color:rgba(0,210,255,.4);}
.nbb ha-icon{--mdc-icon-size:22px;color:rgba(0,200,255,.6);pointer-events:none;}.nbb.act ha-icon{color:rgba(0,230,255,.95);}
</style>
<div class="ov"><div class="room-grid" id="rg">${roomSlots}</div><div class="ctrl-grid" id="cg">${ctrlSlots}</div></div>
<div class="navbar" id="nb">${this._nav()}</div>`;
    this.shadowRoot.getElementById('nb').addEventListener('click',e=>{const b=e.target.closest('.nbb');if(b&&b.dataset.u){history.pushState(null,'',b.dataset.u);this.dispatchEvent(new CustomEvent('location-changed',{bubbles:true,composed:true}));}});
    rooms.forEach((cfg,i)=>{const slot=this.shadowRoot.getElementById('rs'+i);if(!slot)return;if(customElements.get('room-card')){const rc=document.createElement('room-card');rc.setConfig(cfg);if(this._hass)rc.hass=this._hass;rc.style.cssText='display:block;height:100%;';slot.style.cssText='height:100%;';slot.appendChild(rc);}});
    controls.forEach((cfg,i)=>{const slot=this.shadowRoot.getElementById('cs'+i);if(!slot)return;if(customElements.get('control-card')){const rc=document.createElement('control-card');rc.setConfig(cfg);if(this._hass)rc.hass=this._hass;rc.style.cssText='display:block;height:100%;';slot.style.cssText='height:100%;';slot.appendChild(rc);}});
    this._sizeToViewport();
  }
  _up(){if(!this._hass)return;this.shadowRoot.querySelectorAll('room-card').forEach(rc=>{rc.hass=this._hass;});this.shadowRoot.querySelectorAll('control-card').forEach(cc=>{cc.hass=this._hass;});}
}
if(!customElements.get('overview-card'))customElements.define('overview-card',OverviewCard);
