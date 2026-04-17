// custom:control-card — Jarvis Edition
// entity_type: thermostat | lock | spare
// For thermostat: entity, name, icon, temp_sensor (optional)
// For lock: entity, name, icon
class ControlCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  setConfig(c) { this._config = c; }
  set hass(h) { this._hass = h; this._render(); }
  _render() {
    const c = this._config, h = this._hass;
    if (!h || !c) return;
    const D = '\u00b0';
    if (c.entity_type === 'spare') {
      this.shadowRoot.innerHTML = `<style>*{box-sizing:border-box;margin:0;padding:0}:host{display:block;height:100%}.card{background:#010d1a;border:1px solid rgba(0,190,255,.1);border-radius:10px;height:100%;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:8px;position:relative;overflow:hidden;}.gbg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,190,255,.1) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;}ha-icon{--mdc-icon-size:18px;color:rgba(0,190,255,.15);pointer-events:none;position:relative;z-index:1;}span{font-size:9px;font-weight:600;color:rgba(0,190,255,.15);text-transform:uppercase;letter-spacing:.6px;font-family:'Share Tech Mono',monospace;position:relative;z-index:1;}</style><div class="card"><div class="gbg"></div><ha-icon icon="${c.icon||'mdi:plus-circle-outline'}"></ha-icon><span>Spare</span></div>`;
      return;
    }
    if (c.entity_type === 'thermostat') {
      const st = h.states[c.entity];
      const heating = st?.state === 'heat';
      const tRaw = c.temp_sensor ? h.states[c.temp_sensor]?.state : st?.attributes?.current_temperature;
      const cur = (tRaw && tRaw !== 'unavailable') ? parseFloat(tRaw).toFixed(1) : '\u2014';
      const tgt = st?.attributes?.temperature ?? '\u2014';
      const mn = st?.attributes?.min_temp ?? 5, mx = st?.attributes?.max_temp ?? 30;
      const allRooms = Object.entries(h.states).filter(([id,s])=>id.startsWith('climate.')&&id.endsWith('_trv')&&s.state==='heat').length;
      const totalRooms = Object.entries(h.states).filter(([id])=>id.startsWith('climate.')&&id.endsWith('_trv')).length;
      const accentCol = heating ? 'rgb(255,100,50)' : 'rgb(0,200,255)';
      const accentBg  = heating ? 'rgba(255,100,50,.15)' : 'rgba(0,190,255,.12)';
      const borderCol = heating ? 'rgba(255,100,50,.3)'  : 'rgba(0,190,255,.15)';
      this.shadowRoot.innerHTML = `<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');*{box-sizing:border-box;margin:0;padding:0}:host{display:block;height:100%}.card{background:#010d1a;border:1px solid ${borderCol};border-radius:10px;padding:10px 12px;display:flex;flex-direction:row;align-items:center;gap:10px;height:100%;position:relative;overflow:hidden;}.gbg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,190,255,.1) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;}.icon-col{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;position:relative;z-index:1;}.icon-wrap{width:38px;height:38px;border-radius:10px;background:${accentBg};border:1px solid ${borderCol};display:flex;align-items:center;justify-content:center;}.icon-wrap ha-icon{--mdc-icon-size:20px;color:${accentCol};pointer-events:none;}.heat-btn{width:28px;height:28px;border-radius:7px;border:1px solid ${borderCol};cursor:pointer;display:flex;align-items:center;justify-content:center;background:${accentBg};}.heat-btn ha-icon{--mdc-icon-size:13px;color:${accentCol};pointer-events:none;}.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;position:relative;z-index:1;}.name{font-size:8px;font-weight:700;color:rgba(0,190,255,.4);text-transform:uppercase;letter-spacing:1px;font-family:'Share Tech Mono',monospace;}.cur-temp{font-family:'Orbitron',monospace;font-size:22px;font-weight:900;color:white;line-height:1;letter-spacing:-1px;}.cur-unit{font-size:10px;font-weight:400;opacity:.5;}.rooms{font-size:9px;color:rgba(0,190,255,.4);margin-top:1px;font-family:'Share Tech Mono',monospace;}.rooms b{color:${accentCol};}.right-col{display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;position:relative;z-index:1;}.tgt{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;color:${accentCol};text-align:center;}.adj{width:24px;height:24px;border-radius:6px;background:rgba(0,60,140,.3);border:1px solid rgba(0,190,255,.18);cursor:pointer;display:flex;align-items:center;justify-content:center;}.adj ha-icon{--mdc-icon-size:12px;color:rgba(0,200,255,.7);pointer-events:none;}.tgt-label{font-size:8px;color:rgba(0,190,255,.3);letter-spacing:.5px;font-family:'Share Tech Mono',monospace;}</style><div class="card"><div class="gbg"></div><div class="icon-col"><div class="icon-wrap"><ha-icon icon="${c.icon||'mdi:radiator'}"></ha-icon></div><button class="heat-btn" id="heat-btn"><ha-icon icon="mdi:power"></ha-icon></button></div><div class="info"><div class="name">${c.name||'Heating'}</div><div class="cur-temp">${cur}<span class="cur-unit"> ${D}C</span></div><div class="rooms"><b>${allRooms}</b>/${totalRooms} rooms</div></div><div class="right-col"><button class="adj" id="tup"><ha-icon icon="mdi:plus"></ha-icon></button><div class="tgt">${tgt}${D}</div><button class="adj" id="tdn"><ha-icon icon="mdi:minus"></ha-icon></button><div class="tgt-label">target</div></div></div>`;
      const adj = d => { const cur2 = this._hass.states[c.entity]?.attributes?.temperature; if (cur2 == null) return; const next = Math.min(mx, Math.max(mn, Math.round((parseFloat(cur2)+d)*2)/2)); this._hass.callService('climate','set_temperature',{entity_id:c.entity,temperature:next}); };
      this.shadowRoot.getElementById('tup').addEventListener('click',e=>{e.stopPropagation();adj(0.5);});
      this.shadowRoot.getElementById('tdn').addEventListener('click',e=>{e.stopPropagation();adj(-0.5);});
      this.shadowRoot.getElementById('heat-btn').addEventListener('click',e=>{e.stopPropagation();const s=this._hass.states[c.entity]?.state;this._hass.callService('climate','set_hvac_mode',{entity_id:c.entity,hvac_mode:s==='heat'?'off':'heat'});});
      return;
    }
    if (c.entity_type === 'lock') {
      const st = h.states[c.entity]; const state = st?.state ?? 'unknown'; const locked = state === 'locked';
      const col = locked ? 'rgb(0,210,130)' : 'rgb(255,90,90)'; const bgCol = locked ? 'rgba(0,210,130,.15)' : 'rgba(255,90,90,.15)'; const border = locked ? 'rgba(0,210,130,.25)' : 'rgba(255,90,90,.2)';
      this.shadowRoot.innerHTML = `<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');*{box-sizing:border-box;margin:0;padding:0}:host{display:block;height:100%}.card{background:#010d1a;border:1px solid ${border};border-radius:10px;padding:10px 12px;display:flex;flex-direction:row;align-items:center;gap:10px;height:100%;position:relative;overflow:hidden;}.gbg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,190,255,.1) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;}.icon-wrap{width:38px;height:38px;border-radius:10px;background:${bgCol};border:1px solid ${border};flex-shrink:0;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}.icon-wrap ha-icon{--mdc-icon-size:20px;color:${col};pointer-events:none;}.info{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;position:relative;z-index:1;}.name{font-size:8px;font-weight:700;color:rgba(0,190,255,.4);text-transform:uppercase;letter-spacing:1px;font-family:'Share Tech Mono',monospace;}.state{font-family:'Orbitron',monospace;font-size:18px;font-weight:800;color:${col};line-height:1;}.sub{font-size:9px;color:rgba(0,190,255,.35);font-family:'Share Tech Mono',monospace;}.lock-btn{width:38px;height:38px;border-radius:10px;border:1px solid ${border};cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:${bgCol};position:relative;z-index:1;}.lock-btn ha-icon{--mdc-icon-size:18px;color:${col};pointer-events:none;}</style><div class="card"><div class="gbg"></div><div class="icon-wrap"><ha-icon icon="${locked?'mdi:lock':'mdi:lock-open'}"></ha-icon></div><div class="info"><div class="name">${c.name||'Front Door'}</div><div class="state">${locked?'Locked':'Unlocked'}</div><div class="sub">${locked?'Tap to unlock':'Tap to lock'}</div></div><button class="lock-btn" id="lock-btn"><ha-icon icon="${locked?'mdi:lock-open-variant':'mdi:lock'}"></ha-icon></button></div>`;
      this.shadowRoot.getElementById('lock-btn').addEventListener('click',e=>{e.stopPropagation();const s=this._hass.states[c.entity]?.state;this._hass.callService('lock',s==='locked'?'unlock':'lock',{entity_id:c.entity});});
    }
  }
  getCardSize() { return 1; }
}
customElements.define('control-card', ControlCard);
