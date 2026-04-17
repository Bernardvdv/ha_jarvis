// custom:room-card — Jarvis Edition
// Part of the Jarvis Dashboard for Home Assistant
// https://github.com/YOUR_GITHUB/jarvis-dashboard-ha
//
// Config options:
//   name: string
//   icon: mdi:icon
//   climate_entity: climate.YOUR_ROOM_TRV
//   temp_sensor: sensor.YOUR_ROOM_TEMP (optional, falls back to climate attribute)
//   secondary_climate: climate.YOUR_SECONDARY (optional, e.g. study_heater)
//   lights:
//     - entity: light.YOUR_LIGHT
//       name: Ceiling
//       icon: mdi:ceiling-light
//       pair: true   # collapse multiple into one toggle
//   plugs:
//     - entity: switch.YOUR_SWITCH
//       name: Printer
//       icon: mdi:printer-3d

class RoomCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._hass=null; this._config=null; this._lastKey=null; this._t=null;
    this._panel=null; this._f=0; this._raf=null;
  }
  setConfig(c){this._config=c;}
  set hass(h){
    this._hass=h;
    if(this._t)return;
    this._t=setTimeout(()=>{this._t=null;this._tick();},80);
  }
  connectedCallback(){this._animate();}
  disconnectedCallback(){cancelAnimationFrame(this._raf);}

  _key(){
    const h=this._hass,c=this._config;if(!h||!c)return'';
    const ids=[c.climate_entity,c.temp_sensor,c.secondary_climate,
      ...(c.lights||[]).map(l=>l.entity),...(c.plugs||[]).map(p=>p.entity)].filter(Boolean);
    return ids.map(id=>{const s=h.states[id];return(s?.state||'')+(s?.attributes?.brightness||'')+(s?.attributes?.effect||'');}).join('|');
  }

  _tick(){
    const k=this._key();
    if(k!==this._lastKey||!this.shadowRoot.innerHTML){this._lastKey=k;this._render();}
    else if(this._panel){this._refreshPanel();}
  }

  _animate(){
    cancelAnimationFrame(this._raf);
    const isAndroid=/Android/i.test(navigator.userAgent);
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      const f=++this._f,sr=this.shadowRoot;if(!sr)return;
      sr.querySelectorAll('.ds').forEach((d,i)=>{d.style.opacity=(0.3+0.35*Math.sin(f*0.05+i*0.9)).toFixed(2);});
      if(isAndroid)return;
      sr.querySelectorAll('.cb').forEach((cb,i)=>{cb.style.borderColor='rgba(0,190,255,'+(0.15+0.2*Math.sin(f*0.04+i*1.57)).toFixed(2)+')';});
    };
    this._raf=requestAnimationFrame(tick);
  }

  _svc(d,s,data){this._hass.callService(d,s,data);}
  _fire(e){this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:e}}));}
  _D(){return'\u00b0';}

  _caps(eid){
    const st=this._hass?.states[eid];if(!st)return{};
    const modes=st.attributes.supported_color_modes||[];
    return{
      brightness:modes.some(m=>['brightness','color_temp','hs','rgb','rgbw','rgbww','xy'].includes(m)),
      colorTemp:modes.some(m=>m==='color_temp'),
      rgb:modes.some(m=>['hs','rgb','rgbw','rgbww','xy'].includes(m)),
      effects:(st.attributes.effect_list||[]).filter(e=>e&&e.trim()),
      minK:st.attributes.min_color_temp_kelvin||2000,
      maxK:st.attributes.max_color_temp_kelvin||6500,
    };
  }

  _openPanel(eid){this._panel=eid;this._buildPanel();}
  _closePanel(){this._panel=null;this.shadowRoot.getElementById('lp')?.remove();}
  _refreshPanel(){if(this._panel)this._buildPanel();}

  _buildPanel(){
    this.shadowRoot.getElementById('lp')?.remove();
    const h=this._hass,eid=this._panel;if(!eid||!h)return;
    const st=h.states[eid];if(!st)return;
    const caps=this._caps(eid);
    const on=st.state==='on';
    const bri=Math.round((st.attributes.brightness||0)/2.55);
    const kRaw=st.attributes.color_temp_kelvin;
    const kPct=kRaw?Math.round(((kRaw-caps.minK)/(caps.maxK-caps.minK))*100):50;
    const rgb=st.attributes.rgb_color||[255,255,255];
    const curEffect=st.attributes.effect||'';
    const cfgLight=this._config.lights?.find(l=>l.entity===eid);
    const lightName=(cfgLight?.name||st.attributes.friendly_name||eid).toUpperCase();
    const lightIcon=cfgLight?.icon||'mdi:lightbulb';

    const SWATCHES=[
      {hex:'#ffffff',label:'White'},{hex:'#ffe4b5',label:'Warm'},{hex:'#ffb347',label:'Amber'},
      {hex:'#ff4444',label:'Red'},{hex:'#ff69b4',label:'Pink'},{hex:'#cc44ff',label:'Purple'},
      {hex:'#4488ff',label:'Blue'},{hex:'#00ccff',label:'Cyan'},{hex:'#44ff88',label:'Green'},
    ];
    const swActive=(hex)=>{
      const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b2=parseInt(hex.slice(5,7),16);
      return rgb&&Math.abs(r-rgb[0])<30&&Math.abs(g-rgb[1])<30&&Math.abs(b2-rgb[2])<30;
    };

    const el=document.createElement('div');
    el.id='lp';
    el.style.cssText='position:fixed;inset:0;z-index:800;display:flex;align-items:flex-end;justify-content:center;font-family:Share Tech Mono,monospace;';
    el.innerHTML=`
<div id="lpbg" style="position:absolute;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(2px);"></div>
<div style="position:relative;z-index:1;width:100%;max-width:640px;background:#010d1a;border:1px solid rgba(0,190,255,.25);border-bottom:none;border-radius:14px 14px 0 0;padding:0 0 6px;">
  <div style="display:flex;align-items:center;gap:10px;padding:12px 16px 10px;border-bottom:1px solid rgba(0,190,255,.12);">
    <div style="width:36px;height:36px;border-radius:9px;background:${on?'rgba(0,190,255,.18)':'rgba(255,255,255,.05)'};border:1px solid ${on?'rgba(0,190,255,.3)':'rgba(255,255,255,.08)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <ha-icon icon="${lightIcon}" style="--mdc-icon-size:18px;color:${on?'rgb(0,210,255)':'rgba(255,255,255,.3)'};"></ha-icon>
    </div>
    <div style="flex:1;">
      <div style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;color:white;letter-spacing:1.5px;">${lightName}</div>
      <div style="font-size:9px;color:rgba(0,190,255,.45);letter-spacing:1px;margin-top:1px;">${on?'ON':'OFF'} &bull; ${caps.brightness?bri+'% BRIGHTNESS':''}</div>
    </div>
    <button id="lptog" style="padding:6px 14px;border-radius:6px;border:1px solid ${on?'rgba(0,190,255,.4)':'rgba(255,255,255,.15)'};background:${on?'rgba(0,190,255,.18)':'rgba(255,255,255,.06)'};cursor:pointer;color:${on?'rgb(0,220,255)':'rgba(255,255,255,.5)'};font-family:Orbitron,monospace;font-size:9px;font-weight:700;letter-spacing:1px;">POWER</button>
    <button id="lpcl" style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);cursor:pointer;color:rgba(255,255,255,.4);font-size:14px;display:flex;align-items:center;justify-content:center;">&#10005;</button>
  </div>
  <div style="padding:12px 16px;display:flex;flex-direction:column;gap:10px;">
    ${caps.brightness?`<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:9px;color:rgba(0,190,255,.4);letter-spacing:1.5px;width:70px;flex-shrink:0;text-transform:uppercase;">Brightness</span><input id="sl-bri" type="range" min="1" max="100" value="${bri}" style="flex:1;height:3px;accent-color:rgb(0,190,255);cursor:pointer;"><span id="val-bri" style="font-size:10px;color:rgba(255,255,255,.6);width:34px;text-align:right;font-family:Orbitron,monospace;">${bri}%</span></div>`:''}
    ${caps.colorTemp?`<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:9px;color:rgba(0,190,255,.4);letter-spacing:1.5px;width:70px;flex-shrink:0;text-transform:uppercase;">Warmth</span><input id="sl-ct" type="range" min="0" max="100" value="${kPct}" style="flex:1;height:3px;accent-color:rgb(255,160,60);cursor:pointer;"><span id="val-ct" style="font-size:10px;color:rgba(255,255,255,.6);width:34px;text-align:right;font-family:Orbitron,monospace;">${kRaw?Math.round(kRaw/100)+'k':'—'}</span></div>`:''}
    ${caps.rgb?`<div style="display:flex;align-items:center;gap:10px;"><span style="font-size:9px;color:rgba(0,190,255,.4);letter-spacing:1.5px;width:70px;flex-shrink:0;text-transform:uppercase;">Colour</span><div style="display:flex;gap:6px;flex-wrap:wrap;">${SWATCHES.map(sw=>`<div class="sw" data-col="${sw.hex}" title="${sw.label}" style="width:26px;height:26px;border-radius:50%;background:${sw.hex};border:2px solid ${swActive(sw.hex)?'white':'rgba(255,255,255,.15)'};cursor:pointer;flex-shrink:0;"></div>`).join('')}</div></div>`:''}
    ${caps.effects.length?`<div><div style="font-size:9px;color:rgba(0,190,255,.4);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px;">Effects</div><div style="display:flex;flex-wrap:wrap;gap:5px;max-height:100px;overflow-y:auto;">${caps.effects.map(fx=>`<div class="fx" data-fx="${fx}" style="padding:3px 9px;border-radius:6px;font-size:9px;letter-spacing:.5px;cursor:pointer;border:1px solid ${fx===curEffect?'rgba(0,190,255,.5)':'rgba(0,190,255,.15)'};background:${fx===curEffect?'rgba(0,190,255,.2)':'rgba(0,30,80,.4)'};color:${fx===curEffect?'rgb(0,220,255)':'rgba(0,190,255,.55)'};">${fx}</div>`).join('')}</div></div>`:''}
  </div>
</div>`;

    this.shadowRoot.appendChild(el);
    el.querySelector('#lpbg').addEventListener('click',()=>this._closePanel());
    el.querySelector('#lpcl').addEventListener('click',()=>this._closePanel());
    el.querySelector('#lptog').addEventListener('click',e=>{e.stopPropagation();this._svc('light',on?'turn_off':'turn_on',{entity_id:eid});setTimeout(()=>this._buildPanel(),350);});
    const slBri=el.querySelector('#sl-bri');
    if(slBri){
      slBri.addEventListener('input',e=>{el.querySelector('#val-bri').textContent=e.target.value+'%';});
      slBri.addEventListener('change',e=>{this._svc('light','turn_on',{entity_id:eid,brightness_pct:parseInt(e.target.value)});});
    }
    const slCt=el.querySelector('#sl-ct');
    if(slCt){
      slCt.addEventListener('input',e=>{const k=Math.round(caps.minK+(caps.maxK-caps.minK)*parseInt(e.target.value)/100);el.querySelector('#val-ct').textContent=Math.round(k/100)+'k';});
      slCt.addEventListener('change',e=>{const k=Math.round(caps.minK+(caps.maxK-caps.minK)*parseInt(e.target.value)/100);this._svc('light','turn_on',{entity_id:eid,color_temp_kelvin:k});});
    }
    el.querySelectorAll('.sw').forEach(sw=>{
      sw.addEventListener('click',e=>{e.stopPropagation();const hex=sw.dataset.col;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b2=parseInt(hex.slice(5,7),16);this._svc('light','turn_on',{entity_id:eid,rgb_color:[r,g,b2]});el.querySelectorAll('.sw').forEach(s=>s.style.borderColor='rgba(255,255,255,.15)');sw.style.borderColor='white';});
    });
    el.querySelectorAll('.fx').forEach(fx=>{
      fx.addEventListener('click',e=>{e.stopPropagation();this._svc('light','turn_on',{entity_id:eid,effect:fx.dataset.fx});el.querySelectorAll('.fx').forEach(f=>{f.style.background='rgba(0,30,80,.4)';f.style.borderColor='rgba(0,190,255,.15)';f.style.color='rgba(0,190,255,.55)';});fx.style.background='rgba(0,190,255,.2)';fx.style.borderColor='rgba(0,190,255,.5)';fx.style.color='rgb(0,220,255)';});
    });
  }

  _render(){
    const h=this._hass,c=this._config;if(!h||!c)return;
    const D=this._D();
    const clSt=c.climate_entity?h.states[c.climate_entity]:null;
    const heating=clSt?.state==='heat';
    const tempRaw=c.temp_sensor?h.states[c.temp_sensor]?.state:clSt?.attributes?.current_temperature;
    const temp=(tempRaw!=null&&tempRaw!=='unavailable')?parseFloat(tempRaw).toFixed(1):null;
    const tgt=clSt?.attributes?.temperature??null;
    const tMin=clSt?.attributes?.min_temp??5;
    const tMax=clSt?.attributes?.max_temp??30;
    const cl2St=c.secondary_climate?h.states[c.secondary_climate]:null;
    const heat2=cl2St?.state==='heat';
    const lights=c.lights||[];
    const plugs=c.plugs||[];
    const lightsOn=lights.filter(l=>h.states[l.entity]?.state==='on').length;
    const pairMap={};
    lights.forEach(l=>{if(l.pair){const k=l.icon||l.name;(pairMap[k]=pairMap[k]||[]).push(l);}});
    const pairedE=new Set(Object.values(pairMap).filter(a=>a.length>1).flat().map(l=>l.entity));
    const pairGroups=Object.values(pairMap).filter(a=>a.length>1);
    const controls=[
      ...lights.filter(l=>!pairedE.has(l.entity)).map(l=>({kind:'light',...l})),
      ...pairGroups.map(g=>({kind:'pair',items:g,icon:g[0].icon,name:g[0].name})),
      ...plugs.map(p=>({kind:'plug',...p})),
    ];
    const hCol=heating?'rgb(255,120,50)':'rgba(0,190,255,.3)';
    const h2Col=heat2?'rgb(255,120,50)':'rgba(0,190,255,.3)';
    const lCol=lightsOn>0?'rgb(255,210,60)':'rgba(0,190,255,.3)';
    const ctrlHTML=controls.map(ctrl=>{
      if(ctrl.kind==='pair'){const anyOn=ctrl.items.some(l=>h.states[l.entity]?.state==='on');return`<button class="cb2${anyOn?' on':''}" data-action="pair" data-entities='${JSON.stringify(ctrl.items.map(l=>l.entity))}' data-on="${anyOn}"><ha-icon icon="${ctrl.icon||'mdi:lightbulb'}"></ha-icon><span>${ctrl.name||''}</span></button>`;}
      const st=h.states[ctrl.entity];const domain=ctrl.entity?.split('.')[0]||'';const isOn=['on','playing','heat','locked'].includes(st?.state);const isLight=domain==='light';const isPress=domain==='button'||domain==='input_button';const bri=isLight&&isOn&&st?.attributes?.brightness?Math.round(st.attributes.brightness/2.55):null;
      return`<button class="cb2${isOn?' on':''}" data-action="${isPress?'press':isLight?'ltap':'toggle'}" data-entity="${ctrl.entity}" data-domain="${domain}"><ha-icon icon="${ctrl.icon||'mdi:circle'}"></ha-icon><span>${ctrl.name||''}</span>${bri!==null?`<span class="bri">${bri}%</span>`:''}</button>`;
    }).join('');

    this.shadowRoot.innerHTML=`<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:host{display:block;height:100%}
.card{width:100%;height:100%;min-height:160px;background:#010d1a;border:1px solid rgba(0,190,255,.12);border-radius:12px;display:flex;flex-direction:column;overflow:hidden;position:relative;font-family:'Share Tech Mono',monospace;color:white;}
.gbg{position:absolute;inset:0;background:#010d1a;background-image:radial-gradient(circle,rgba(0,190,255,.14) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;z-index:0;border-radius:12px;}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,transparent 30%,rgba(1,8,20,.7) 100%);pointer-events:none;z-index:1;border-radius:12px;}
.cb{position:absolute;width:14px;height:14px;z-index:8;border-style:solid;border-color:rgba(0,190,255,.25);}
.cb.tl{top:7px;left:7px;border-width:2px 0 0 2px}.cb.tr{top:7px;right:7px;border-width:2px 2px 0 0}.cb.bl{bottom:7px;left:7px;border-width:0 0 2px 2px}.cb.br{bottom:7px;right:7px;border-width:0 2px 2px 0}
.inn{position:relative;z-index:5;display:flex;flex-direction:column;height:100%;}
.hdr{display:flex;align-items:center;gap:8px;padding:10px 12px 8px;border-bottom:1px solid rgba(0,190,255,.1);flex-shrink:0;}
.ri{width:34px;height:34px;border-radius:9px;background:rgba(0,60,140,.22);border:1px solid rgba(0,170,255,.18);display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;}
.ri ha-icon{--mdc-icon-size:18px;color:rgba(0,200,255,.8);pointer-events:none;}
.hi{flex:1;min-width:0;}
.rn{font-family:'Orbitron',monospace;font-size:10px;font-weight:700;color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:1px;}
.pills{display:flex;gap:4px;margin-top:3px;flex-wrap:wrap;}
.pill{display:flex;align-items:center;gap:2px;padding:2px 6px;border-radius:6px;cursor:pointer;border:1px solid;transition:all .15s;}
.pill ha-icon{--mdc-icon-size:9px;pointer-events:none;}
.pill span{font-size:8px;font-weight:700;letter-spacing:.5px;}
.trv{display:flex;align-items:center;gap:6px;padding:7px 12px;border-bottom:1px solid rgba(0,190,255,.08);flex-shrink:0;background:rgba(0,0,0,.15);}
.trv-cur{font-family:'Orbitron',monospace;font-size:16px;font-weight:900;color:${heating?'rgb(255,120,50)':'rgb(0,200,255)'};line-height:1;min-width:48px;}
.trv-arr{font-size:10px;color:rgba(0,190,255,.3);margin:0 1px;}
.trv-tgt{font-size:11px;color:rgba(255,255,255,.5);font-family:'Share Tech Mono',monospace;flex:1;}
.trv-tgt b{color:rgba(255,255,255,.8);}
.trv-btn{width:24px;height:24px;border-radius:6px;background:rgba(0,60,140,.3);border:1px solid rgba(0,190,255,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;}
.trv-btn:active{background:rgba(0,190,255,.25);}
.trv-btn ha-icon{--mdc-icon-size:12px;color:rgba(0,200,255,.7);pointer-events:none;}
.trv-pwr{width:28px;height:28px;border-radius:8px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;background:${heating?'rgba(255,100,40,.25)':'rgba(0,60,140,.3)'};border:1px solid ${heating?'rgba(255,100,40,.45)':'rgba(0,190,255,.18)'};transition:all .2s;}
.trv-pwr:active{opacity:.7;}
.trv-pwr ha-icon{--mdc-icon-size:14px;color:${heating?'rgb(255,120,50)':'rgba(0,200,255,.6)'};pointer-events:none;}
.btns{flex:1;display:flex;flex-wrap:wrap;align-content:flex-start;gap:5px;padding:8px 10px;overflow:hidden;}
.cb2{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:10px 5px 7px;border-radius:8px;border:1px solid rgba(0,190,255,.12);background:rgba(0,40,120,.18);cursor:pointer;flex:1;min-width:52px;max-width:78px;min-height:62px;transition:background .15s,border-color .15s;position:relative;}
.cb2:active{opacity:.7;transform:scale(.94);}
.cb2.on{background:rgba(0,100,220,.22);border-color:rgba(0,190,255,.38);}
.cb2 ha-icon{--mdc-icon-size:22px;color:rgba(0,190,255,.35);pointer-events:none;}
.cb2.on ha-icon{color:rgb(0,210,255);}
.cb2 span{font-size:8px;font-weight:600;color:rgba(0,190,255,.35);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;text-align:center;letter-spacing:.3px;}
.cb2.on span{color:rgba(0,220,255,.8);}
.bri{font-size:7px;color:rgba(255,210,60,.7)!important;pointer-events:none;}
.ds{font-size:9px;}
</style>
<div class="card">
  <div class="gbg"></div><div class="vig"></div>
  <div class="cb tl"></div><div class="cb tr"></div><div class="cb bl"></div><div class="cb br"></div>
  <div class="inn">
    <div class="hdr">
      <div class="ri" id="ri"><ha-icon icon="${c.icon||'mdi:home'}"></ha-icon></div>
      <div class="hi">
        <div class="rn">${c.name||'Room'}</div>
        <div class="pills">
          ${lights.length?`<div class="pill" style="background:${lightsOn>0?'rgba(255,210,60,.1)':'rgba(0,60,140,.18)'};border-color:${lCol};cursor:default;"><ha-icon icon="mdi:lightbulb-group" style="color:${lCol};"></ha-icon><span style="color:${lCol};">${lightsOn}/${lights.length}</span></div>`:''}
          ${c.secondary_climate?`<div class="pill" id="h2p" style="background:${heat2?'rgba(255,100,40,.18)':'rgba(0,60,140,.18)'};border-color:${h2Col};"><ha-icon icon="mdi:${heat2?'radiator':'radiator-off'}" style="color:${h2Col};"></ha-icon><span style="color:${h2Col};">H2</span></div>`:''}
        </div>
      </div>
    </div>
    ${c.climate_entity?`<div class="trv"><span class="trv-cur">${temp!=null?temp+D:'—'}</span><span class="trv-arr">&#8594;</span><span class="trv-tgt"><b>${tgt!=null?tgt+D:'—'}</b></span><button class="trv-btn" id="tdn"><ha-icon icon="mdi:minus"></ha-icon></button><button class="trv-btn" id="tup"><ha-icon icon="mdi:plus"></ha-icon></button><button class="trv-pwr" id="tpwr"><ha-icon icon="mdi:${heating?'radiator':'radiator-off'}"></ha-icon></button></div>`:''}
    ${controls.length?`<div class="btns" id="btns">${ctrlHTML}</div>`:''}
  </div>
</div>`;

    const sr=this.shadowRoot;
    sr.getElementById('ri')?.addEventListener('click',e=>{e.stopPropagation();if(c.climate_entity)this._fire(c.climate_entity);});
    sr.getElementById('h2p')?.addEventListener('click',e=>{e.stopPropagation();const s=h.states[c.secondary_climate]?.state;this._svc('climate','set_hvac_mode',{entity_id:c.secondary_climate,hvac_mode:s==='heat'?'off':'heat'});});
    if(c.climate_entity){
      const adj=d=>{const cur=this._hass.states[c.climate_entity]?.attributes?.temperature;if(cur==null)return;const next=Math.min(tMax,Math.max(tMin,Math.round((parseFloat(cur)+d)*2)/2));this._svc('climate','set_temperature',{entity_id:c.climate_entity,temperature:next});};
      sr.getElementById('tup')?.addEventListener('click',e=>{e.stopPropagation();adj(0.5);});
      sr.getElementById('tdn')?.addEventListener('click',e=>{e.stopPropagation();adj(-0.5);});
      sr.getElementById('tpwr')?.addEventListener('click',e=>{e.stopPropagation();const s=this._hass.states[c.climate_entity]?.state;this._svc('climate','set_hvac_mode',{entity_id:c.climate_entity,hvac_mode:s==='heat'?'off':'heat'});});
    }
    sr.getElementById('btns')?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-action]');if(!btn)return;
      e.stopPropagation();
      const act=btn.dataset.action,eid=btn.dataset.entity,dom=btn.dataset.domain;
      if(act==='ltap'){const caps=this._caps(eid);if(caps.brightness||caps.effects.length){this._openPanel(eid);}else{const s=this._hass.states[eid];this._svc('light',s?.state==='on'?'turn_off':'turn_on',{entity_id:eid});}}
      else if(act==='pair'){const ents=JSON.parse(btn.dataset.entities);const anyOn=btn.dataset.on==='true';ents.forEach(e2=>this._svc('light',anyOn?'turn_off':'turn_on',{entity_id:e2}));}
      else if(act==='toggle'){const sdom=['light','switch','fan','input_boolean','media_player'].includes(dom)?dom:'homeassistant';if(dom==='media_player'){this._svc('media_player','toggle',{entity_id:eid});}else{this._svc(sdom,'toggle',{entity_id:eid});}}
      else if(act==='press'){this._svc(dom,'press',{entity_id:eid});}
    });
    if(this._panel)this._buildPanel();
  }
  getCardSize(){return 4;}
}
if(!customElements.get('room-card'))customElements.define('room-card',RoomCard);
