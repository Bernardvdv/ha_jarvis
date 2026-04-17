// custom:jarvis-navbar — Fixed-position Jarvis navigation bar
// Renders as position:fixed at bottom of viewport — use once per dashboard page
// Config: routes[] (optional, defaults to standard Jarvis Dashboard routes)
//   routes:
//     - icon: mdi:home
//       url: /dashboard-jarvis/0

class JarvisNavbar extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});}
  setConfig(c){this._config=c||{};}
  set hass(h){this._hass=h;if(!this._built){this._built=true;this._build();}}
  getCardSize(){return 1;}
  _build(){
    const defs=this._config.routes||[
      {icon:'mdi:home',url:'/dashboard-jarvis/0'},
      {icon:'mdi:view-dashboard',url:'/dashboard-jarvis/overview'},
      {icon:'mdi:security',url:'/dashboard-jarvis/security'},
      {icon:'mdi:car',url:'/dashboard-jarvis/vehicle'},
      {icon:'mdi:music',url:'/dashboard-jarvis/music'},
      {icon:'mdi:battery-30-bluetooth',url:'/dashboard-jarvis/battery'},
      {icon:'mdi:robot',url:'/dashboard-jarvis/jarvis'},
    ];
    const cur=window.location.pathname;
    const btns=defs.map(r=>`<div class="nbb${cur===r.url||cur.startsWith(r.url+'/')?' act':''}" data-u="${r.url}"><ha-icon icon="${r.icon}"></ha-icon></div>`).join('');
    this.shadowRoot.innerHTML=`<style>*{box-sizing:border-box;margin:0;padding:0}:host{display:block;width:100%;height:0;}.navbar{position:fixed;bottom:0;left:0;right:0;z-index:9000;display:flex;align-items:center;justify-content:center;gap:10px;padding:9px 18px 12px;background:rgba(1,8,20,.97);border-top:1px solid rgba(0,190,255,.2);}.nbb{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.15);transition:all .15s;}.nbb:hover{background:rgba(0,130,255,.22);border-color:rgba(0,210,255,.35);}.nbb.act{background:rgba(0,190,255,.2);border-color:rgba(0,210,255,.4);}.nbb ha-icon{--mdc-icon-size:22px;color:rgba(0,200,255,.6);pointer-events:none;}.nbb.act ha-icon{color:rgba(0,230,255,.95);}</style><div class="navbar" id="nb">${btns}</div>`;
    this.shadowRoot.getElementById('nb').addEventListener('click',e=>{const b=e.target.closest('.nbb');if(b&&b.dataset.u){history.pushState(null,'',b.dataset.u);this.dispatchEvent(new CustomEvent('location-changed',{bubbles:true,composed:true}));}});
  }
}
if(!customElements.get('jarvis-navbar'))customElements.define('jarvis-navbar',JarvisNavbar);
