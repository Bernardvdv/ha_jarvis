class JarvisCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._h = null; this._c = null; this._ok = false;
    this._raf = null; this._f = 0; this._ti = null; this._open = null;
  }
  setConfig(c) { this._c = c || {}; }
  set hass(h) { this._h = h; if (!this._ok) { this._ok = true; this._build(); } else { this._up(); } }
  connectedCallback() { this._go(); }
  disconnectedCallback() { cancelAnimationFrame(this._raf); clearInterval(this._ti); }
  _mi(e) { this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: e } })); }
  _nav(u) { history.pushState(null, '', u); this.dispatchEvent(new CustomEvent('location-changed', { bubbles: true, composed: true })); }

  _go() {
    cancelAnimationFrame(this._raf);
    // Detect Android to skip animations that cause GPU compositor artifacts
    // in Fully Kiosk Browser hardware acceleration mode
    const isAndroid = /Android/i.test(navigator.userAgent);
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      const f = ++this._f, sr = this.shadowRoot;
      if (!sr) return;

      // SVG ring rotations - safe everywhere (pure SVG transform, no layer promotion)
      const r1 = sr.getElementById('r1'), r2 = sr.getElementById('r2'), r3 = sr.getElementById('r3');
      if (r1) r1.setAttribute('transform', 'rotate(' + (f * 0.2) + ' 80 80)');
      if (r2) r2.setAttribute('transform', 'rotate(' + (-f * 0.13) + ' 80 80)');
      if (r3) r3.setAttribute('transform', 'rotate(' + (f * 0.07) + ' 80 80)');

      // Safe opacity animation on non-positioned inline elements
      sr.querySelectorAll('.ds').forEach((d, i) => {
        d.style.opacity = (0.35 + 0.35 * Math.sin(f * 0.05 + i * 0.8)).toFixed(2);
      });

      // Skip all remaining animations on Android - they cause white GPU layer artifacts
      // in Fully Kiosk Browser hardware acceleration mode
      if (isAndroid) return;

      // Desktop-only: scan line (style.top on positioned element = GPU layer split on Android)
      const sl = sr.getElementById('sl');
      if (sl) sl.style.top = ((f * 0.55) % 100) + '%';

      // Desktop-only: energy pulse opacity
      const ep = sr.getElementById('ep');
      if (ep) ep.style.opacity = (0.4 + 0.45 * Math.abs(Math.sin(f * 0.07))).toFixed(2);

      // Desktop-only: corner bracket border-color animation
      sr.querySelectorAll('.cb').forEach((cb, i) => {
        const o = 0.2 + 0.25 * Math.sin(f * 0.04 + i * 1.57);
        cb.style.borderColor = 'rgba(0,190,255,' + o.toFixed(2) + ')';
      });

      // Desktop-only: floating particles (style.top changes = GPU artifact on Android)
      sr.querySelectorAll('.pt').forEach((p, i) => {
        const y = parseFloat(p.dataset.y || (Math.random() * 100));
        const ny = (y - (0.15 + (i * 7 % 10) * 0.03) + 100) % 100;
        p.dataset.y = ny;
        p.style.top = ny + '%';
        p.style.opacity = (0.05 + 0.08 * Math.abs(Math.sin(f * 0.03 + i * 1.2))).toFixed(2);
      });

      // Desktop-only: waveform bars (height changes = layout thrash on Android GPU)
      sr.querySelectorAll('.wb').forEach((b, i) => {
        const h2 = 20 + 60 * Math.abs(Math.sin(f * 0.09 + i * 0.45));
        b.style.height = h2.toFixed(0) + '%';
        b.style.opacity = (0.3 + 0.45 * Math.abs(Math.sin(f * 0.07 + i * 0.5))).toFixed(2);
      });
    };
    this._raf = requestAnimationFrame(tick);
  }

  _wx(s) {
    const m = { 'clear-day': 'sunny', 'clear-night': 'clear-night', 'cloudy': 'cloudy', 'fog': 'fog', 'hail': 'hail', 'lightning': 'lightning', 'lightning-rainy': 'lightning-rainy', 'partlycloudy': 'partly-cloudy', 'rainy': 'rainy', 'snowy': 'snowy', 'windy': 'windy' };
    return 'mdi:weather-' + (m[s] || 'cloudy');
  }

  _arc(v, mx, r, col, id) {
    const c = 2 * Math.PI * r, d = mx > 0 ? Math.min(1, v / mx) * c : 0;
    // Android fix: removed filter:drop-shadow from SVG circles
    return '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>' +
      '<circle id="' + id + '" cx="80" cy="80" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7"' +
      ' stroke-dasharray="' + d.toFixed(1) + ' ' + (c - d).toFixed(1) + '" stroke-linecap="round"' +
      ' transform="rotate(-90 80 80)" style="transition:stroke-dasharray .7s"/>';
  }

  _hb(v, col, id) {
    const p = Math.min(100, Math.max(0, v));
    const bc = p > 80 ? '#f44' : col;
    // Android fix: removed box-shadow from progress bars
    return '<div class="hbt"><div class="hbf" id="' + id + '" style="width:' + p + '%;background:' + bc + '"></div></div>';
  }

  _pts() {
    let h = '';
    for (let i = 0; i < 18; i++) {
      const x = (i * 37 + 11) % 100;
      const y = (i * 23 + 7) % 100;
      const sz = 1 + (i % 2);
      h += '<div class="pt" style="left:' + x + '%;top:' + y + '%;width:' + sz + 'px;height:' + sz + 'px" data-y="' + y + '"></div>';
    }
    return h;
  }

  _build() {
    const h = this._h, c = this._c;
    if (!h || !c) return;
    const wx = h.states[c.weather || 'weather.forecast_home'];
    const wxs = wx ? wx.state : 'cloudy';
    const wxt = wx ? wx.attributes.temperature : null;
    const wxh = wx ? wx.attributes.humidity : null;
    const wxw = wx ? wx.attributes.wind_speed : null;
    const lon = (c.lights || []).filter(id => h.states[id] && h.states[id].state === 'on').length;
    const lt = (c.lights || []).length || 20;
    const hon = (c.climates || []).filter(id => h.states[id] && h.states[id].state === 'heat').length;
    const ht = (c.climates || []).length || 8;
    const lk = h.states[c.lock] && h.states[c.lock].state === 'locked';
    const ot = c.outside_temp && h.states[c.outside_temp] ? parseFloat(h.states[c.outside_temp].state) : null;
    const wash = c.washing_machine && h.states[c.washing_machine] && h.states[c.washing_machine].state === 'on';
    const dryer = c.dryer && h.states[c.dryer] && h.states[c.dryer].state === 'on';
    const now = new Date();
    const ts = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dstr = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    const hr = now.getHours();
    const gr = hr < 12 ? 'GOOD MORNING' : hr < 17 ? 'GOOD AFTERNOON' : hr < 21 ? 'GOOD EVENING' : 'GOOD NIGHT';
    const pve = c.proxmox || [];
    const eD = c.energy_demand && h.states[c.energy_demand] ? parseFloat(h.states[c.energy_demand].state) : null;
    const eK = c.energy_today && h.states[c.energy_today] ? parseFloat(h.states[c.energy_today].state) : null;
    const eC = c.energy_cost && h.states[c.energy_cost] ? parseFloat(h.states[c.energy_cost].state) : null;
    const eR = c.energy_rate && h.states[c.energy_rate] ? parseFloat(h.states[c.energy_rate].state) : null;
    const eF = c.fossil_fuel && h.states[c.fossil_fuel] ? parseFloat(h.states[c.fossil_fuel].state) : null;

    const navDefs = c.navbar || [
      { icon: 'mdi:home', url: '/dashboard-playground/0' },
      { icon: 'mdi:view-dashboard', url: '/dashboard-playground/overview' },
      { icon: 'mdi:security', url: '/dashboard-playground/security' },
      { icon: 'mdi:car', url: '/dashboard-playground/puma' },
      { icon: 'mdi:music', url: '/dashboard-playground/music-assisant' },
      { icon: 'mdi:battery-30-bluetooth', url: '/dashboard-playground/battery-status' },
      { icon: 'mdi:robot', url: '/dashboard-playground/jarvis' }
    ];
    const cur = window.location.pathname;
    const navHTML = navDefs.map(r => {
      const act = cur === r.url || cur.startsWith(r.url + '/') ? ' act' : '';
      return '<div class="nbb' + act + '" data-u="' + r.url + '"><ha-icon icon="' + r.icon + '"></ha-icon></div>';
    }).join('');

    const chk = [
      { l: 'HEATING', v: hon > 0 ? hon + '/' + ht + ' ON' : 'STANDBY', ok: true },
      { l: 'SECURITY', v: lk ? 'ARMED' : 'OPEN', ok: lk },
      { l: 'WASHING', v: wash ? 'RUNNING' : 'IDLE', ok: !wash },
      { l: 'DRYER', v: dryer ? 'RUNNING' : 'IDLE', ok: !dryer },
      { l: 'NETWORK', v: 'ONLINE', ok: true },
      { l: 'HA CORE', v: 'NOMINAL', ok: true },
      { l: 'ZIGBEE', v: 'ACTIVE', ok: true },
      { l: 'AUTO', v: 'ACTIVE', ok: true }
    ];
    const chkHTML = chk.map(s => {
      const col = s.ok ? '#0f8' : '#f44';
      const vc = s.ok ? '#0f8' : '#fc2';
      return '<div class="hcr"><div class="hcd" style="background:' + col + '"></div><span class="hcl">' + s.l + '</span><span class="hcv" style="color:' + vc + '">' + s.v + '</span></div>';
    }).join('');

    const str = [
      { l: 'HEATING', v: hon ? hon + '/' + ht + ' ACTIVE' : 'STANDBY', c: hon ? '#f55' : '#0f8' },
      { l: 'LIGHTING', v: lon + '/' + lt + ' ON', c: lon ? '#fc2' : 'rgba(255,255,255,.25)' },
      { l: 'SECURITY', v: lk ? 'PERIMETER SECURE' : 'DOOR OPEN', c: lk ? '#0f8' : '#f33' },
      { l: 'WASHING', v: wash ? 'CYCLE RUNNING' : 'IDLE', c: wash ? '#6df' : 'rgba(255,255,255,.25)' },
      { l: 'DRYER', v: dryer ? 'RUNNING' : 'IDLE', c: dryer ? '#6df' : 'rgba(255,255,255,.25)' },
      { l: 'ZIGBEE', v: 'MESH ACTIVE', c: 'rgba(0,200,255,.6)' },
      { l: 'HA CORE', v: 'ALL SYSTEMS GO', c: '#0f8' },
      { l: 'NETWORK', v: 'CONNECTED', c: 'rgba(0,200,255,.6)' }
    ];
    const strHTML = str.map(s => {
      return '<div class="stri"><div class="strd ds" style="background:' + s.c + '"></div><span class="strl">' + s.l + '</span><span class="strv" style="color:' + s.c + '">' + s.v + '</span></div>';
    }).join('');

    const pveHTML = pve.length ? pve.map((p, i) => {
      const cpu = parseFloat(h.states[p.cpu] ? h.states[p.cpu].state : 0);
      const mem = parseFloat(h.states[p.mem] ? h.states[p.mem].state : 0);
      const st = p.status ? (h.states[p.status] ? h.states[p.status].state : 'online') : 'online';
      const mu = p.mem_used ? parseFloat(h.states[p.mem_used] ? h.states[p.mem_used].state : 0).toFixed(1) : '--';
      const mm = p.mem_max ? parseFloat(h.states[p.mem_max] ? h.states[p.mem_max].state : 0).toFixed(1) : '--';
      const up = p.uptime ? Math.round(parseFloat(h.states[p.uptime] ? h.states[p.uptime].state : 0)) : null;
      const ok = st === 'online';
      const sc = ok ? '#0f8' : '#f44';
      return '<div class="pvb">' +
        '<div class="pvh"><span class="pvn">' + p.name + '</span><span class="ds" style="color:' + sc + '">' + (ok ? '&#9679; ONLINE' : '&#9679; OFFLINE') + '</span></div>' +
        '<div class="pvr"><span class="pvl">CPU</span>' + this._hb(cpu, '#4af', 'pc' + i) + '<span class="pvv">' + cpu.toFixed(0) + '%</span></div>' +
        '<div class="pvr"><span class="pvl">MEM</span>' + this._hb(mem, '#a4f', 'pm' + i) + '<span class="pvv">' + mem.toFixed(0) + '%</span></div>' +
        '<div class="pvx">' + mu + '/' + mm + ' GiB' + (up !== null ? ' &bull; UP ' + up + 'h' : '') + '</div>' +
        '</div>';
    }).join('<hr class="pvd"/>') : '<div class="ds" style="color:rgba(0,180,255,.3)">No hosts configured</div>';

    const wvBars = Array(16).fill(0).map((_, i) => '<div class="wb" style="height:' + (20 + Math.random() * 40).toFixed(0) + '%;opacity:.4"></div>').join('');
    const fosColor = eF !== null && eF < 50 ? '#0f8' : '#f84';
    const fosBarColor = eF !== null && eF < 50 ? '#0f8' : '#f63';
    const chipOut = ot !== null ? '<div class="ch"><div class="cv" id="c-out">' + Math.round(ot) + '&deg;</div><div class="cl">Outside</div></div>' : '';
    const chipWash = wash ? '<div class="ch"><div class="cv" style="color:#6df;font-size:13px">WASH</div><div class="cl">On</div></div>' : '';
    const chipDry = dryer ? '<div class="ch"><div class="cv" style="color:#6df;font-size:13px">DRY</div><div class="cl">On</div></div>' : '';
    const sbWash = wash ? '<div class="sbi warn"><div class="sbd"></div><span class="sbt" style="color:rgba(100,220,255,.8)">WASHING ON</span></div>' : '';
    const sbDry = dryer ? '<div class="sbi warn"><div class="sbd"></div><span class="sbt" style="color:rgba(100,220,255,.8)">DRYER ON</span></div>' : '';
    const wxHumHTML = wxh !== null ? '<div class="wst"><ha-icon icon="mdi:water-percent"></ha-icon><span id="wx-h">' + wxh + '%</span></div>' : '';
    const wxWindHTML = wxw !== null ? '<div class="wst"><ha-icon icon="mdi:weather-windy"></ha-icon><span id="wx-w">' + Math.round(wxw) + ' km/h</span></div>' : '';

    this.shadowRoot.innerHTML = `<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:host{display:block;width:100%;height:100%}
.j{width:100%;height:100%;background:#010d1a;position:relative;overflow:hidden;color:white;font-family:'Share Tech Mono',monospace;display:flex;flex-direction:column;}
.gbg{position:absolute;inset:0;background:#010d1a;background-image:radial-gradient(circle,rgba(0,190,255,.14) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;z-index:0;}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 35%,rgba(1,12,26,.1) 15%,rgba(1,8,20,.6) 100%);pointer-events:none;z-index:1;}
#ag{position:absolute;bottom:0;left:0;right:0;height:220px;background:linear-gradient(to top,rgba(0,140,255,.1),transparent);pointer-events:none;z-index:1;opacity:.9;}
#sl{position:absolute;left:0;right:0;height:2px;z-index:10;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(0,230,255,.7) 50%,transparent);mix-blend-mode:screen;will-change:top;}
.pt{position:absolute;border-radius:50%;background:rgba(0,190,255,.5);pointer-events:none;z-index:2;}
.cb{position:absolute;width:20px;height:20px;z-index:8;border-style:solid;transition:border-color .4s;}
.cb.tl{top:10px;left:10px;border-width:2px 0 0 2px}.cb.tr{top:10px;right:10px;border-width:2px 2px 0 0}.cb.bl{bottom:10px;left:10px;border-width:0 0 2px 2px}.cb.br{bottom:10px;right:10px;border-width:0 2px 2px 0}
.inn{position:relative;z-index:5;display:flex;flex-direction:column;height:100%;}
.top{display:grid;grid-template-columns:2.2fr 1fr 1fr 1fr;border-bottom:1px solid rgba(0,190,255,.12);padding:12px 20px;gap:14px;align-items:center;flex-shrink:0;}
.pc{display:flex;flex-direction:column;gap:4px;}
.gr{font-size:11px;color:rgba(0,210,255,.55);letter-spacing:4px;}
.ck{font-family:'Orbitron',monospace;font-size:52px;font-weight:900;color:white;letter-spacing:5px;line-height:1;}
.dl{font-size:11px;color:rgba(0,190,255,.4);letter-spacing:2px;margin-top:2px;}
.chips{display:flex;gap:7px;margin-top:8px;flex-wrap:wrap;align-items:center;}
.ch{display:flex;flex-direction:column;align-items:center;padding:6px 12px;background:rgba(0,60,140,.22);border:1px solid rgba(0,170,255,.15);border-radius:8px;min-width:60px;gap:2px;}
.cv{font-family:'Orbitron',monospace;font-size:20px;font-weight:700;color:white;line-height:1;}
.cl{font-size:8px;color:rgba(0,190,255,.5);letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
.sd{width:11px;height:11px;border-radius:50%;background:#0f8;animation:glo 2s infinite;align-self:center;}
@keyframes glo{0%,100%{opacity:1}50%{opacity:.3}}
.pw,.pr,.ph{display:flex;flex-direction:column;gap:5px;border-left:1px solid rgba(0,190,255,.1);padding-left:16px;}
.pl{font-size:9px;color:rgba(0,210,255,.35);letter-spacing:3px;text-transform:uppercase;margin-bottom:3px;}
.wm{display:flex;align-items:center;gap:12px;}
.wi ha-icon{--mdc-icon-size:50px;color:rgba(0,220,255,.85);}
.wt{font-family:'Orbitron',monospace;font-size:40px;font-weight:900;color:white;line-height:1;}
.ws{font-size:12px;color:rgba(0,210,255,.55);text-transform:uppercase;letter-spacing:2px;margin-top:3px;}
.wss{display:flex;gap:12px;margin-top:4px;flex-wrap:wrap;}
.wst{display:flex;align-items:center;gap:5px;font-size:11px;color:rgba(0,190,255,.55);}
.wst ha-icon{--mdc-icon-size:14px;}
.rsvg{width:145px;height:145px;overflow:visible;display:block;}
.hcr{display:flex;align-items:center;gap:7px;padding:3px 0;}
.hcd{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.hcl{font-size:11px;flex:1;color:rgba(0,200,255,.45);letter-spacing:.5px;}
.hcv{font-size:11px;font-weight:700;}
.mid{display:grid;grid-template-columns:1.2fr 1fr 1fr;flex:1;min-height:0;overflow:hidden;border-bottom:1px solid rgba(0,190,255,.1);}
.peng,.ppve,.pstr{padding:12px 16px;overflow:hidden;display:flex;flex-direction:column;gap:9px;}
.peng{border-right:1px solid rgba(0,190,255,.1);}
.ppve{border-right:1px solid rgba(0,190,255,.1);}
.emain{display:flex;align-items:center;gap:14px;}
.epow{font-family:'Orbitron',monospace;font-size:44px;font-weight:900;color:#0f8;line-height:1;}
.eunit{font-size:11px;color:rgba(0,255,136,.6);margin-top:4px;letter-spacing:2px;}
.epulse{display:flex;flex-direction:column;justify-content:center;gap:3px;}
.epbar{height:5px;border-radius:2px;background:rgba(0,255,136,.35);margin:1px 0;}
#wv{display:flex;align-items:flex-end;gap:3px;height:38px;flex-shrink:0;}
.wb{width:5px;border-radius:3px 3px 0 0;background:rgba(0,200,255,.55);min-height:10%;}
.estats{display:grid;grid-template-columns:1fr 1fr;gap:7px;flex:1;}
.est{background:rgba(0,50,120,.2);border:1px solid rgba(0,190,255,.1);border-radius:4px;padding:9px 11px;display:flex;flex-direction:column;gap:3px;}
.esv{font-family:'Orbitron',monospace;font-size:19px;font-weight:700;color:white;line-height:1;}
.esl{font-size:8px;color:rgba(0,190,255,.42);letter-spacing:1.5px;text-transform:uppercase;margin-top:3px;}
.fbar{height:5px;border-radius:0;background:rgba(255,255,255,.07);overflow:hidden;margin-top:5px;}
.ffill{height:100%;border-radius:0;transition:width .7s;}
.pvb{display:flex;flex-direction:column;gap:5px;padding:5px 0;}
.pvh{display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;}
.pvn{font-size:13px;color:rgba(0,220,255,.8);letter-spacing:1.5px;text-transform:uppercase;font-weight:700;}
.pvr{display:flex;align-items:center;gap:7px;}
.pvl{font-size:11px;color:rgba(0,190,255,.5);width:30px;flex-shrink:0;letter-spacing:1px;}
.hbt{flex:1;height:7px;background:rgba(255,255,255,.07);border-radius:0;overflow:hidden;}
.hbf{height:100%;border-radius:0;transition:width .5s;}
.pvv{font-size:11px;font-weight:700;width:40px;text-align:right;color:rgba(255,255,255,.65);}
.pvx{font-size:10px;color:rgba(0,190,255,.38);margin-top:3px;}
.pvd{border:none;border-top:1px solid rgba(0,190,255,.1);margin:5px 0;}
.stri{display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:3px;background:rgba(0,40,120,.2);border:1px solid rgba(0,190,255,.1);}
.strd{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.strl{font-size:12px;color:rgba(0,200,255,.45);flex:1;letter-spacing:.8px;}
.strv{font-size:12px;font-weight:700;letter-spacing:.5px;}
.ds{font-size:11px;}
.evr{padding:6px 20px;border-top:1px solid rgba(0,190,255,.09);display:flex;gap:8px;flex-wrap:wrap;align-items:center;flex-shrink:0;}
.evp{display:flex;align-items:center;gap:5px;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.12);border-radius:7px;padding:4px 11px;}
.evd{font-size:10px;color:rgba(0,210,255,.7);font-weight:700;white-space:nowrap;}
.evn{font-size:12px;color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px;}
.sbar{display:flex;align-items:stretch;border-top:1px solid rgba(0,190,255,.1);position:relative;flex-shrink:0;}
.sbi{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:9px 6px;font-size:11px;letter-spacing:.8px;cursor:pointer;border-right:1px solid rgba(0,190,255,.07);transition:background .15s;}
.sbi:hover{background:rgba(0,190,255,.08)}.sbi:last-of-type{border-right:none}
.sbd{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.sbt{color:rgba(0,200,255,.5);}
.sbi.ok .sbd{background:#0f8}.sbi.warn .sbd{background:#fc2;animation:glo 1s infinite}.sbi.alert .sbd{background:#f33;animation:glo .5s infinite}
.sbend{padding:9px 14px;font-size:9px;color:rgba(0,130,210,.4);letter-spacing:2px;display:flex;align-items:center;white-space:nowrap;}
.dd{position:absolute;bottom:100%;left:0;right:0;background:rgba(1,10,24,.98);border:1px solid rgba(0,190,255,.2);border-radius:12px 12px 0 0;padding:10px;z-index:50;display:flex;flex-wrap:wrap;gap:6px;}
.ddc{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;background:rgba(0,60,140,.25);border:1px solid rgba(0,190,255,.15);cursor:pointer;font-size:12px;color:rgba(255,255,255,.8);font-weight:600;transition:background .15s;}
.ddc:hover{background:rgba(0,190,255,.15)}.ddd{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.navbar{display:flex;align-items:center;justify-content:center;gap:10px;padding:9px 18px;border-top:1px solid rgba(0,190,255,.12);background:rgba(1,8,20,.7);flex-shrink:0;}
.nbb{width:44px;height:44px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.15);transition:all .15s;}
.nbb:hover{background:rgba(0,130,255,.22);border-color:rgba(0,210,255,.35)}
.nbb.act{background:rgba(0,190,255,.2);border-color:rgba(0,210,255,.4);}
.nbb ha-icon{--mdc-icon-size:22px;color:rgba(0,200,255,.6);pointer-events:none;}.nbb.act ha-icon{color:rgba(0,230,255,.95);}
</style>
<div class="j">
  <div class="gbg"></div><div class="vig"></div><div id="ag"></div><div id="sl"></div>
  ${this._pts()}
  <div class="cb tl"></div><div class="cb tr"></div><div class="cb bl"></div><div class="cb br"></div>
  <div class="inn">
    <div class="top">
      <div class="pc">
        <div class="gr">${gr} &mdash; JARVIS HOME INTELLIGENCE SYSTEM</div>
        <div class="ck" id="clk">${ts}</div>
        <div class="dl" id="dtl">${dstr}</div>
        <div class="chips">
          ${chipOut}
          <div class="ch"><div class="cv" id="c-heat" style="color:${hon ? '#f74' : 'rgba(255,255,255,.3)'}">${hon}</div><div class="cl">Heating</div></div>
          <div class="ch"><div class="cv" id="c-lights" style="color:${lon ? '#fc2' : 'rgba(255,255,255,.3)'}">${lon}</div><div class="cl">Lights</div></div>
          <div class="ch"><div class="cv" id="c-lock" style="color:${lk ? '#0f8' : '#f44'};font-size:13px">${lk ? 'SAFE' : 'OPEN'}</div><div class="cl">Door</div></div>
          ${chipWash}${chipDry}
          <div class="sd" title="All Systems Nominal"></div>
        </div>
      </div>
      <div class="pw">
        <div class="pl">// WEATHER</div>
        <div class="wm">
          <div class="wi"><ha-icon icon="${this._wx(wxs)}"></ha-icon></div>
          <div>
            <div class="wt" id="wx-t">${wxt !== null ? Math.round(wxt) + '&deg;' : '--'}</div>
            <div class="ws" id="wx-s">${wxs.replace(/-/g, ' ')}</div>
          </div>
        </div>
        <div class="wss">${wxHumHTML}${wxWindHTML}</div>
      </div>
      <div class="pr">
        <div class="pl" style="text-align:center">// STATUS RINGS</div>
        <svg class="rsvg" viewBox="0 0 160 160">
          <g id="r3"><circle cx="80" cy="80" r="74" fill="none" stroke="rgba(0,190,255,.04)" stroke-width="1" stroke-dasharray="1 18"/></g>
          <g id="r1"><circle cx="80" cy="80" r="72" fill="none" stroke="rgba(0,190,255,.06)" stroke-width="1" stroke-dasharray="4 10"/></g>
          <g id="r2"><circle cx="80" cy="80" r="66" fill="none" stroke="rgba(0,190,255,.04)" stroke-width="1" stroke-dasharray="2 14"/></g>
          ${this._arc(hon, ht, 52, '#f55', 'ah')}
          ${this._arc(lon, lt, 40, '#fc2', 'al')}
          ${this._arc(lk ? 1 : 0, 1, 28, lk ? '#0f8' : '#f33', 'as')}
          <text id="ra" x="80" y="74" text-anchor="middle" font-size="16" font-weight="900" fill="white" font-family="monospace">--</text>
          <text x="80" y="90" text-anchor="middle" font-size="9" fill="rgba(0,190,255,.4)" font-family="monospace" letter-spacing="1">AVG TEMP</text>
        </svg>
      </div>
      <div class="ph">
        <div class="pl">// HEALTH CHECKS</div>
        ${chkHTML}
      </div>
    </div>
    <div class="mid">
      <div class="peng">
        <div class="pl">// ENERGY GRID</div>
        <div class="emain">
          <div>
            <div class="epow" id="e-dem">${eD !== null ? eD.toFixed(0) : '--'}</div>
            <div class="eunit">WATTS LIVE</div>
          </div>
          <div class="epulse" id="ep">
            ${Array(6).fill(0).map((_, i) => '<div class="epbar" style="width:' + (20 + i * 16) + 'px;opacity:' + (0.3 + i * 0.13) + '"></div>').join('')}
          </div>
        </div>
        <div id="wv">${wvBars}</div>
        <div class="estats">
          <div class="est"><div class="esv" id="e-kwh">${eK !== null ? eK.toFixed(2) : '--'}</div><div class="esl">kWh Today</div></div>
          <div class="est"><div class="esv" id="e-cost" style="color:#fc2">${eC !== null ? '&pound;' + eC.toFixed(2) : '--'}</div><div class="esl">Cost Today</div></div>
          <div class="est"><div class="esv" id="e-rate" style="color:rgba(0,210,255,.9)">${eR !== null ? eR.toFixed(2) + 'p' : '--'}</div><div class="esl">Rate / kWh</div></div>
          <div class="est">
            <div class="esv" id="e-fos" style="color:${fosColor}">${eF !== null ? eF.toFixed(0) + '%' : '--'}</div>
            <div class="esl">Fossil Fuel</div>
            <div class="fbar"><div class="ffill" id="ffl" style="width:${eF || 0}%;background:${fosBarColor}"></div></div>
          </div>
        </div>
      </div>
      <div class="ppve">
        <div class="pl">// PROXMOX MONITOR</div>
        ${pveHTML}
      </div>
      <div class="pstr">
        <div class="pl">// LIVE SYSTEM STATUS</div>
        ${strHTML}
      </div>
    </div>
    <div class="evr" id="evr">
      <span class="pl" style="flex-shrink:0;margin-bottom:0">// UPCOMING:</span>
      <span class="ds" style="color:rgba(0,190,255,.35)">Loading...</span>
    </div>
    <div class="sbar" id="sbar">
      <div class="sbi ${lon ? 'warn' : 'ok'}" id="sbl" data-type="lights"><div class="sbd"></div><span class="sbt" id="sblt">${lon ? lon + ' LIGHTS ON' : 'LIGHTS OFF'}</span></div>
      <div class="sbi ${hon ? 'warn' : 'ok'}" id="sbh" data-type="heat"><div class="sbd"></div><span class="sbt" id="sbht">${hon ? hon + ' HEATING' : 'HEATING OFF'}</span></div>
      <div class="sbi ${lk ? 'ok' : 'alert'}" id="sbk" data-type="lock"><div class="sbd"></div><span class="sbt" id="sbkt">${lk ? 'DOOR SECURED' : 'DOOR OPEN'}</span></div>
      ${sbWash}${sbDry}
      <div class="sbend">JARVIS &middot; v4.5 &middot; NORTHAMPTON HQ &middot; NOMINAL</div>
    </div>
    <div class="navbar" id="nb">${navHTML}</div>
  </div>
</div>`;

    clearInterval(this._ti);
    this._ti = setInterval(() => {
      const cl = this.shadowRoot.getElementById('clk');
      if (!cl || !cl.isConnected) { clearInterval(this._ti); return; }
      const n = new Date();
      cl.textContent = n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.shadowRoot.getElementById('dtl').textContent = n.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
    }, 1000);

    this.shadowRoot.getElementById('sbar').addEventListener('click', e => {
      const it = e.target.closest('.sbi');
      if (!it || !it.dataset.type) return;
      const tp = it.dataset.type;
      e.stopPropagation();
      if (this._open === tp) { this._open = null; this._cdd(); return; }
      this._open = tp;
      this._odd(tp);
    });
    document.addEventListener('click', () => { this._open = null; this._cdd(); }, { once: true, passive: true });
    this.shadowRoot.getElementById('nb').addEventListener('click', e => {
      const b = e.target.closest('.nbb');
      if (b) this._nav(b.dataset.u);
    });
    this._go();
    this._evs();
    this._up();
  }

  _cdd() { const d = this.shadowRoot.getElementById('dd'); if (d) d.remove(); }

  _odd(tp) {
    this._cdd();
    const h = this._h, c = this._c;
    const lk = h.states[c.lock] && h.states[c.lock].state === 'locked';
    let it = [];
    if (tp === 'lights') it = (c.lights || []).filter(id => h.states[id] && h.states[id].state === 'on').map(id => ({ l: (h.states[id].attributes.friendly_name || id.split('.')[1].replace(/_/g, ' ')), col: '#fc2', e: id }));
    else if (tp === 'heat') it = (c.climates || []).filter(id => h.states[id] && h.states[id].state === 'heat').map(id => ({ l: (h.states[id].attributes.friendly_name || id.split('.')[1].replace(/_/g, ' ')), col: '#f55', e: id }));
    else if (tp === 'lock') { it = [{ l: lk ? 'Front door secured' : 'Front door OPEN', col: lk ? '#0f8' : '#f33', e: c.lock }]; }
    if (!it.length) it = [{ l: 'None active', col: 'rgba(255,255,255,.3)', e: null }];
    const dd = document.createElement('div');
    dd.id = 'dd'; dd.className = 'dd';
    dd.innerHTML = it.map(x => '<div class="ddc" data-e="' + (x.e || '') + '"><div class="ddd" style="background:' + x.col + '"></div>' + x.l + '</div>').join('');
    dd.querySelectorAll('.ddc').forEach(ch => {
      ch.addEventListener('click', e => { e.stopPropagation(); if (ch.dataset.e) this._mi(ch.dataset.e); this._cdd(); });
    });
    this.shadowRoot.getElementById('sbar').appendChild(dd);
  }

  async _evs() {
    const sr = this.shadowRoot, el = sr.getElementById('evr');
    if (!el) return;
    try {
      const cals = this._c.calendars || [this._c.calendar || 'calendar.home'];
      const n = new Date(), y = n.getFullYear(), m = n.getMonth();
      const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
      const res = await Promise.all(cals.filter(Boolean).map(cal => this._h.callApi('GET', 'calendars/' + cal + '?start=' + n.toISOString() + '&end=' + end).then(r => r || []).catch(() => [])));
      const evs = res.flat().sort((a, b) => new Date(a.start.dateTime || a.start.date) - new Date(b.start.dateTime || b.start.date)).filter(e2 => new Date(e2.start.dateTime || e2.start.date) >= n).slice(0, 5);
      if (!evs.length) { el.innerHTML = '<span class="pl" style="flex-shrink:0;margin-bottom:0">// UPCOMING:</span><span class="ds" style="color:rgba(0,190,255,.35)">No upcoming events</span>'; return; }
      el.innerHTML = '<span class="pl" style="flex-shrink:0;margin-bottom:0">// UPCOMING:</span>' + evs.map(ev => {
        const s = ev.start.dateTime ? new Date(ev.start.dateTime) : new Date(ev.start.date);
        const t = !ev.start.dateTime ? 'ALL DAY' : s.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        return '<div class="evp"><span class="evd">' + s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + t + '</span><span class="evn">' + (ev.summary || 'Event') + '</span></div>';
      }).join('');
    } catch { el.innerHTML = '<span class="pl">// UPCOMING:</span><span class="ds" style="color:rgba(0,190,255,.3)">Unavailable</span>'; }
  }

  _ua(id, v, mx, r) {
    const el = this.shadowRoot.getElementById(id);
    if (!el) return;
    const c = 2 * Math.PI * r, d = mx > 0 ? Math.min(1, v / mx) * c : 0;
    el.setAttribute('stroke-dasharray', d.toFixed(1) + ' ' + (c - d).toFixed(1));
  }

  _up() {
    const sr = this.shadowRoot, h = this._h, c = this._c;
    if (!sr || !h || !c) return;
    const lon = (c.lights || []).filter(id => h.states[id] && h.states[id].state === 'on').length;
    const lt = (c.lights || []).length || 20;
    const hon = (c.climates || []).filter(id => h.states[id] && h.states[id].state === 'heat').length;
    const ht = (c.climates || []).length || 8;
    const lk = h.states[c.lock] && h.states[c.lock].state === 'locked';
    const ot = c.outside_temp && h.states[c.outside_temp] ? parseFloat(h.states[c.outside_temp].state) : null;
    const wx = h.states[c.weather || 'weather.forecast_home'];
    const tt = (c.climates || []).map(id => parseFloat(h.states[id] && h.states[id].attributes ? h.states[id].attributes.current_temperature || 0 : 0)).filter(v => v > 1);
    const avg = tt.length ? (tt.reduce((a, b) => a + b) / tt.length).toFixed(1) : '--';
    const eD = c.energy_demand && h.states[c.energy_demand] ? parseFloat(h.states[c.energy_demand].state) : null;
    const eK = c.energy_today && h.states[c.energy_today] ? parseFloat(h.states[c.energy_today].state) : null;
    const eC = c.energy_cost && h.states[c.energy_cost] ? parseFloat(h.states[c.energy_cost].state) : null;
    const eR = c.energy_rate && h.states[c.energy_rate] ? parseFloat(h.states[c.energy_rate].state) : null;
    const eF = c.fossil_fuel && h.states[c.fossil_fuel] ? parseFloat(h.states[c.fossil_fuel].state) : null;
    const s = (id, v) => { const el = sr.getElementById(id); if (el && v != null) el.textContent = v; };
    const si = (id, v) => { const el = sr.getElementById(id); if (el && v != null) el.innerHTML = v; };
    const ss = (id, p, v) => { const el = sr.getElementById(id); if (el) el.style[p] = v; };
    s('ra', avg !== '--' ? avg + 'd' : '--');
    if (ot !== null) si('c-out', Math.round(ot) + '&deg;');
    si('c-heat', '' + hon); ss('c-heat', 'color', hon ? '#f74' : 'rgba(255,255,255,.3)');
    si('c-lights', '' + lon); ss('c-lights', 'color', lon ? '#fc2' : 'rgba(255,255,255,.3)');
    si('c-lock', lk ? 'SAFE' : 'OPEN'); ss('c-lock', 'color', lk ? '#0f8' : '#f44');
    if (wx) {
      const wt = wx.attributes.temperature;
      if (wt != null) si('wx-t', Math.round(wt) + '&deg;');
      s('wx-s', (wx.state || '').replace(/-/g, ' '));
      if (wx.attributes.humidity) s('wx-h', wx.attributes.humidity + '%');
      if (wx.attributes.wind_speed) s('wx-w', Math.round(wx.attributes.wind_speed) + ' km/h');
    }
    if (eD != null) s('e-dem', eD.toFixed(0));
    if (eK != null) s('e-kwh', eK.toFixed(2));
    if (eC != null) si('e-cost', '&pound;' + eC.toFixed(2));
    if (eR != null) s('e-rate', eR.toFixed(2) + 'p');
    if (eF != null) {
      s('e-fos', eF.toFixed(0) + '%');
      const ff = sr.getElementById('ffl');
      if (ff) { ff.style.width = eF + '%'; ff.style.background = eF < 50 ? '#0f8' : '#f63'; }
    }
    const ub = (id, tid, txt, cls) => { const el = sr.getElementById(id); if (el) el.className = 'sbi ' + cls; const tel = sr.getElementById(tid); if (tel) tel.textContent = txt; };
    ub('sbl', 'sblt', lon ? lon + ' LIGHTS ON' : 'LIGHTS OFF', lon ? 'warn' : 'ok');
    ub('sbh', 'sbht', hon ? hon + ' HEATING' : 'HEATING OFF', hon ? 'warn' : 'ok');
    ub('sbk', 'sbkt', lk ? 'DOOR SECURED' : 'DOOR OPEN', lk ? 'ok' : 'alert');
    this._ua('ah', hon, ht, 52); this._ua('al', lon, lt, 40); this._ua('as', lk ? 1 : 0, 1, 28);
    (c.proxmox || []).forEach((p, i) => {
      const cpu = p.cpu && h.states[p.cpu] ? parseFloat(h.states[p.cpu].state) : 0;
      const mem = p.mem && h.states[p.mem] ? parseFloat(h.states[p.mem].state) : 0;
      const cb = sr.getElementById('pc' + i), mb = sr.getElementById('pm' + i);
      if (cb) { cb.style.width = Math.min(100, cpu).toFixed(0) + '%'; cb.style.background = cpu > 80 ? '#f44' : '#4af'; }
      if (mb) { mb.style.width = Math.min(100, mem).toFixed(0) + '%'; mb.style.background = mem > 80 ? '#f44' : '#a4f'; }
    });
  }

  getCardSize() { return 12; }
}
if (!customElements.get('jarvis-card')) customElements.define('jarvis-card', JarvisCard);
