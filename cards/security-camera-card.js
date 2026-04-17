// custom:security-camera-card — Jarvis Edition
// Full-screen panel view card showing camera feeds + security sensor status
//
// Config:
//   cameras:
//     - name: Garage
//       icon: mdi:garage
//       entity: camera.YOUR_CAMERA
//   locks:
//     - entity: lock.YOUR_FRONT_DOOR
//       label: Front Door
//     - entity: lock.YOUR_CAR_LOCK
//       label: Car
//   sensors:
//     - entity: binary_sensor.YOUR_CONTACT_SENSOR
//       label: Contact SB
//       type: contact   # contact | motion | glass | garage
//   navbar:            # optional, defaults to standard routes
//     - icon: mdi:home
//       url: /dashboard-jarvis/0

class SecurityCameraCard extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._h=null;this._c=null;this._built=false;this._f=0;this._raf=null;this._ro=null;}
  setConfig(c){this._c=c||{};}
  set hass(h){this._h=h;if(!this._built){this._built=true;this._build();}else{this._up();}}
  connectedCallback(){this._animate();this._fitToView();}
  disconnectedCallback(){cancelAnimationFrame(this._raf);if(this._ro)this._ro.disconnect();}
  getCardSize(){return 10;}

  _fitToView(){
    const setH=()=>{const j=this.shadowRoot&&this.shadowRoot.querySelector('.j');if(j)j.style.height=window.innerHeight+'px';};
    setH();
    if(this._ro)this._ro.disconnect();
    this._ro=new ResizeObserver(setH);
    this._ro.observe(document.documentElement);
  }

  _thumbUrl(entity){
    const s=this._h&&this._h.states[entity];if(!s)return null;
    const tok=s.attributes&&s.attributes.access_token;
    return tok?'/api/camera_proxy/'+entity+'?token='+tok:null;
  }

  _animate(){
    cancelAnimationFrame(this._raf);
    const isAndroid=/Android/i.test(navigator.userAgent);
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      const f=++this._f,sr=this.shadowRoot;if(!sr)return;
      sr.querySelectorAll('.ds').forEach((d,i)=>{d.style.opacity=(0.3+0.35*Math.sin(f*0.05+i*0.9)).toFixed(2);});
      if(isAndroid)return;
      const sl=sr.getElementById('sl');if(sl)sl.style.top=((f*0.4)%100)+'%';
      sr.querySelectorAll('.corner').forEach((cb,i)=>{cb.style.borderColor='rgba(0,190,255,'+(0.2+0.25*Math.sin(f*0.04+i*1.57)).toFixed(2)+')';});
    };
    this._raf=requestAnimationFrame(tick);
  }

  _openModal(cam){
    const old=this.shadowRoot.getElementById('modal');if(old)old.remove();
    const url=this._thumbUrl(cam.entity);
    const modal=document.createElement('div');
    modal.id='modal';modal.style.cssText='position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML='<div id="mbg" style="position:absolute;inset:0;background:rgba(0,0,0,.9)"></div><div style="position:relative;width:90vw;max-width:900px;background:#010d1a;border:1px solid rgba(0,190,255,.3);z-index:1;display:flex;flex-direction:column;"><div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;border-bottom:1px solid rgba(0,190,255,.12);"><div style="display:flex;align-items:center;gap:8px;"><ha-icon icon="'+(cam.icon||'mdi:cctv')+'" style="--mdc-icon-size:16px;color:rgba(0,190,255,.7)"></ha-icon><span style="font-family:Orbitron,monospace;font-size:13px;font-weight:700;color:white;letter-spacing:2px;">'+cam.name.toUpperCase()+'</span></div><div id="mcl" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:rgba(0,190,255,.6);font-size:16px;border:1px solid rgba(0,190,255,.2);">&#10005;</div></div><div style="position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden;">'+(url?'<img src="'+url+'" style="width:100%;height:100%;object-fit:contain;display:block;" loading="lazy"/>':`<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(0,190,255,.3);flex-direction:column;gap:8px;"><ha-icon icon="mdi:cctv-off" style="--mdc-icon-size:48px"></ha-icon><span style="font-size:11px;letter-spacing:2px;">NO FEED</span></div>`)+'</div><div style="padding:6px 14px;font-size:9px;color:rgba(0,190,255,.3);letter-spacing:1.5px;text-align:center;border-top:1px solid rgba(0,190,255,.08);font-family:Share Tech Mono,monospace;">'+cam.name.toUpperCase()+' &middot; LAST SNAPSHOT &middot; TAP OUTSIDE TO CLOSE</div></div>';
    this.shadowRoot.appendChild(modal);
    modal.querySelector('#mcl').addEventListener('click',()=>modal.remove());
    modal.querySelector('#mbg').addEventListener('click',()=>modal.remove());
  }

  _stateRow(label,val,ok,eid){
    const col=ok?'#0f8':'#f33';
    return '<div class="sr'+(eid?' cl':'')+'"'+(eid?' data-e="'+eid+'"':'')+'>'+
      '<div class="sd" style="background:'+col+'"></div><span class="sl">'+label+'</span><span class="sv" style="color:'+col+'">'+val+'</span></div>';
  }

  _navHTML(){
    const defs=this._c.navbar||[
      {icon:'mdi:home',url:'/dashboard-jarvis/0'},
      {icon:'mdi:view-dashboard',url:'/dashboard-jarvis/overview'},
      {icon:'mdi:security',url:'/dashboard-jarvis/security'},
      {icon:'mdi:car',url:'/dashboard-jarvis/vehicle'},
      {icon:'mdi:music',url:'/dashboard-jarvis/music'},
      {icon:'mdi:battery-30-bluetooth',url:'/dashboard-jarvis/battery'},
      {icon:'mdi:robot',url:'/dashboard-jarvis/jarvis'},
    ];
    const cur=window.location.pathname;
    return defs.map(r=>'<div class="nb'+(cur===r.url||cur.startsWith(r.url+'/')?' act':'')+'\" data-u="'+r.url+'"><ha-icon icon="'+r.icon+'"></ha-icon></div>').join('');
  }

  _build(){
    const h=this._h,c=this._c;if(!h||!c)return;
    const cameras=c.cameras||[];
    const locks=c.locks||[];
    const sensors=c.sensors||[];
    const dstr=new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();

    // Compute overall security status from configured locks + sensors
    const allLocked=locks.every(l=>(h.states[l.entity]||{state:'unknown'}).state==='locked');
    const allClosed=sensors.filter(s=>s.type==='contact'||s.type==='glass'||s.type==='garage').every(s=>(h.states[s.entity]||{state:'unknown'}).state!=='on');
    const overall=allLocked&&allClosed;

    const camsHTML=cameras.map((cam,i)=>{
      const url=this._thumbUrl(cam.entity);const st=h.states[cam.entity];const ok=st&&st.state!=='unavailable';
      return '<div class="cam" data-cam="'+i+'"><div class="cf">'+(url?'<img class="ct" src="'+url+'" alt="'+cam.name+'" loading="lazy"/>':`<div class="cnf"><ha-icon icon="mdi:cctv-off" style="--mdc-icon-size:20px;color:rgba(0,190,255,.2)"></ha-icon></div>`)+'<div class="co"><span class="cl2 ds" style="color:'+(ok?'#f33':'rgba(255,80,80,.4)')+'">&#9679; '+(ok?'LIVE':'OFFLINE')+'</span><span class="cex ds">TAP</span></div></div><div class="cn"><ha-icon icon="'+(cam.icon||'mdi:cctv')+'" style="--mdc-icon-size:9px;color:rgba(0,190,255,.45)"></ha-icon><span class="ds">'+cam.name.toUpperCase()+'</span></div></div>';
    }).join('');

    const lockRows=locks.map(l=>{const s=(h.states[l.entity]||{state:'unknown'}).state;return this._stateRow(l.label||'Lock',s==='locked'?'LOCKED':'OPEN',s==='locked',l.entity);}).join('');
    const sensorRows=sensors.map(s=>{const st=(h.states[s.entity]||{state:'unknown'}).state;const closed=st!=='on';return this._stateRow(s.label||'Sensor',closed?'CLOSED':'OPEN',closed,s.entity);}).join('');
    const cameraRows=cameras.map(cam=>{const s=h.states[cam.entity];return this._stateRow(cam.name,s&&s.state!=='unavailable'?'LIVE':'OFFLINE',s&&s.state!=='unavailable',null);}).join('');

    // First lock for header display
    const lk1=locks[0];const lk1s=lk1?(h.states[lk1.entity]||{state:'unknown'}).state:'unknown';
    const lk2=locks[1];const lk2s=lk2?(h.states[lk2.entity]||{state:'unknown'}).state:'unknown';

    this.shadowRoot.innerHTML=`<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}:host{display:block;width:100%;height:100vh}
.j{width:100%;height:100vh;background:#010d1a;color:white;font-family:'Share Tech Mono',monospace;display:flex;flex-direction:column;overflow:hidden;position:relative;}
.gbg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,190,255,.08) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;z-index:0;}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,transparent 20%,rgba(1,8,20,.65) 100%);pointer-events:none;z-index:1;}
#sl{position:absolute;left:0;right:0;height:2px;z-index:10;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(0,230,255,.8) 50%,transparent);}
.corner{position:absolute;width:12px;height:12px;z-index:8;border-style:solid;transition:border-color .4s;}
.corner.tl{top:6px;left:6px;border-width:2px 0 0 2px}.corner.tr{top:6px;right:6px;border-width:2px 2px 0 0}.corner.bl{bottom:6px;left:6px;border-width:0 0 2px 2px}.corner.br{bottom:6px;right:6px;border-width:0 2px 2px 0}
.inn{position:relative;z-index:5;display:flex;flex-direction:column;height:100%;overflow:hidden;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:5px 14px;border-bottom:1px solid rgba(0,190,255,.12);flex-shrink:0;min-height:46px;}
.htitle{display:flex;flex-direction:column;gap:1px;}.hgr{font-size:7px;color:rgba(0,210,255,.5);letter-spacing:3px;}.htxt{font-family:'Orbitron',monospace;font-size:14px;font-weight:900;color:white;letter-spacing:2px;}.hdate{font-size:6px;color:rgba(0,190,255,.35);letter-spacing:1px;}
.hright{display:flex;align-items:center;gap:6px;}
.hstat{display:flex;flex-direction:column;align-items:center;padding:3px 8px;background:rgba(0,60,140,.2);border:1px solid rgba(0,170,255,.14);border-radius:4px;}
.hsv{font-family:'Orbitron',monospace;font-size:11px;font-weight:900;}.hsl{font-size:6px;color:rgba(0,190,255,.4);letter-spacing:1px;text-transform:uppercase;margin-top:1px;}
.ov{display:flex;flex-direction:column;align-items:center;padding:3px 10px;border-radius:4px;border:1px solid;}.ovtxt{font-family:'Orbitron',monospace;font-size:10px;font-weight:900;letter-spacing:1px;}.ovlbl{font-size:6px;letter-spacing:1.5px;margin-top:1px;}
.glo{width:7px;height:7px;border-radius:50%;background:#0f8;animation:glo 2s infinite;align-self:center;}@keyframes glo{0%,100%{opacity:1}50%{opacity:.3}}
.body{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
.camrow{display:grid;grid-template-columns:repeat(${Math.min(cameras.length,3)},1fr);gap:6px;padding:8px 10px;flex-shrink:0;}
.cam{display:flex;flex-direction:column;gap:2px;cursor:pointer;}.cam:hover .cf{border-color:rgba(0,220,255,.4);}.cam:hover .cex{opacity:1!important;}
.cf{position:relative;background:rgba(0,20,40,.7);border:1px solid rgba(0,190,255,.15);overflow:hidden;aspect-ratio:16/9;}
.ct{width:100%;height:100%;object-fit:cover;display:block;}.cnf{width:100%;height:100%;display:flex;align-items:center;justify-content:center;}
.co{position:absolute;top:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:3px 5px;pointer-events:none;}
.cl2{font-size:7px;letter-spacing:1px;}.cex{font-size:7px;color:rgba(0,210,255,.6);letter-spacing:1px;opacity:0;transition:opacity .2s;}
.cn{display:flex;align-items:center;gap:3px;padding:0 1px;}.ds{font-size:8px;}
.statpanel{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 10px;display:grid;grid-template-columns:1fr 1fr;gap:3px;align-content:start;}
.statpanel::-webkit-scrollbar{width:2px;}.statpanel::-webkit-scrollbar-thumb{background:rgba(0,190,255,.2);}
.spl{font-size:7px;color:rgba(0,210,255,.3);letter-spacing:2px;text-transform:uppercase;padding:2px 4px;grid-column:1/-1;}
.sr{display:flex;align-items:center;gap:4px;padding:3px 6px;background:rgba(0,40,120,.15);border:1px solid rgba(0,190,255,.07);}
.sr.cl{cursor:pointer;transition:background .15s;}.sr.cl:hover{background:rgba(0,60,160,.22);}
.sd{width:5px;height:5px;border-radius:50%;flex-shrink:0;}.sl{font-size:9px;color:rgba(0,200,255,.38);flex:1;}.sv{font-size:9px;font-weight:700;}
.sdiv{height:1px;background:rgba(0,190,255,.06);grid-column:1/-1;}
.sbar{display:flex;align-items:stretch;border-top:1px solid rgba(0,190,255,.1);flex-shrink:0;height:28px;}
.sbi{flex:1;display:flex;align-items:center;justify-content:center;gap:3px;padding:3px;font-size:8px;letter-spacing:.4px;border-right:1px solid rgba(0,190,255,.06);}
.sbi:last-child{border-right:none}.sbd{width:4px;height:4px;border-radius:50%;flex-shrink:0;}.sbt{color:rgba(0,200,255,.38);}
.sbend{padding:3px 8px;font-size:7px;color:rgba(0,130,210,.3);letter-spacing:1px;display:flex;align-items:center;white-space:nowrap;}
.navbar{display:flex;align-items:center;justify-content:center;gap:6px;padding:5px 12px;border-top:1px solid rgba(0,190,255,.12);background:rgba(1,8,20,.7);flex-shrink:0;height:46px;}
.nb{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.12);transition:all .15s;}
.nb:hover{background:rgba(0,130,255,.2);border-color:rgba(0,210,255,.3)}.nb.act{background:rgba(0,190,255,.2);border-color:rgba(0,210,255,.38);}
.nb ha-icon{--mdc-icon-size:18px;color:rgba(0,200,255,.55);pointer-events:none;}.nb.act ha-icon{color:rgba(0,230,255,.9);}
</style>
<div class="j">
  <div class="gbg"></div><div class="vig"></div><div id="sl"></div>
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div class="inn">
    <div class="hdr">
      <div class="htitle"><div class="hgr">JARVIS HOME INTELLIGENCE SYSTEM</div><div class="htxt">// SECURITY &amp; SURVEILLANCE</div><div class="hdate">${dstr}</div></div>
      <div class="hright">
        ${lk1?`<div class="hstat"><div class="hsv" id="lk1v" style="color:${lk1s==='locked'?'#0f8':'#f33'}">${lk1s==='locked'?'LOCKED':'OPEN'}</div><div class="hsl">${lk1.label||'Lock 1'}</div></div>`:''}
        ${lk2?`<div class="hstat"><div class="hsv" id="lk2v" style="color:${lk2s==='locked'?'#0f8':'#f33'}">${lk2s==='locked'?'LOCKED':'OPEN'}</div><div class="hsl">${lk2.label||'Lock 2'}</div></div>`:''}
        <div class="ov" id="ovbox" style="background:${overall?'rgba(0,80,40,.3)':'rgba(80,0,0,.3)'};border-color:${overall?'rgba(0,255,136,.2)':'rgba(255,50,50,.3)'}">
          <div class="ovtxt" id="ovtxt" style="color:${overall?'#0f8':'#f33'}">${overall?'SECURE':'ALERT'}</div>
          <div class="ovlbl" style="color:${overall?'rgba(0,255,136,.4)':'rgba(255,80,80,.4)'}">Perimeter</div>
        </div>
        <div class="glo"></div>
      </div>
    </div>
    <div class="body">
      <div class="camrow" id="camrow">${camsHTML}</div>
      <div class="statpanel">
        ${locks.length?`<div class="spl">// LOCKS</div>${lockRows}<div class="sdiv"></div>`:''}
        ${sensors.length?`<div class="spl">// SENSORS</div>${sensorRows}<div class="sdiv"></div>`:''}
        ${cameras.length?`<div class="spl">// CAMERAS</div>${cameraRows}`:''}
      </div>
    </div>
    <div class="sbar">
      ${lk1?`<div class="sbi"><div class="sbd" id="sb1d" style="background:${lk1s==='locked'?'#0f8':'#f33'}"></div><span id="sb1t" class="sbt">${(lk1.label||'LOCK').toUpperCase()} ${lk1s==='locked'?'SECURED':'OPEN'}</span></div>`:''}
      <div class="sbi"><div class="sbd" style="background:#4af"></div><span class="sbt">${cameras.length} CAMERAS &middot; STATIC</span></div>
      <div class="sbend">JARVIS &middot; SECURITY</div>
    </div>
    <div class="navbar" id="nav">${this._navHTML()}</div>
  </div>
</div>`;

    this.shadowRoot.getElementById('camrow').addEventListener('click',e=>{const cam=e.target.closest('.cam');if(cam&&c.cameras[parseInt(cam.dataset.cam)])this._openModal(c.cameras[parseInt(cam.dataset.cam)]);});
    this.shadowRoot.querySelectorAll('.cl').forEach(el=>{el.addEventListener('click',()=>{const eid=el.dataset.e;if(eid)this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:eid}}));});});
    this.shadowRoot.getElementById('nav').addEventListener('click',e=>{const b=e.target.closest('.nb');if(b){history.pushState(null,'',b.dataset.u);this.dispatchEvent(new CustomEvent('location-changed',{bubbles:true,composed:true}));}});
    this._animate();this._fitToView();this._up();
  }

  _up(){
    const h=this._h,c=this._c,sr=this.shadowRoot;if(!h||!sr)return;
    const locks=c.locks||[];const sensors=c.sensors||[];
    const allLocked=locks.every(l=>(h.states[l.entity]||{state:'unknown'}).state==='locked');
    const allClosed=sensors.filter(s=>s.type==='contact'||s.type==='glass'||s.type==='garage').every(s=>(h.states[s.entity]||{state:'unknown'}).state!=='on');
    const overall=allLocked&&allClosed;
    const se=(id,t)=>{const el=sr.getElementById(id);if(el)el.textContent=t;};
    const sc=(id,p,v)=>{const el=sr.getElementById(id);if(el)el.style[p]=v;};
    se('ovtxt',overall?'SECURE':'ALERT');sc('ovtxt','color',overall?'#0f8':'#f33');
    sc('ovbox','background',overall?'rgba(0,80,40,.3)':'rgba(80,0,0,.3)');
    sc('ovbox','borderColor',overall?'rgba(0,255,136,.2)':'rgba(255,50,50,.3)');
    const lk1=locks[0];if(lk1){const s=(h.states[lk1.entity]||{state:'unknown'}).state;se('lk1v',s==='locked'?'LOCKED':'OPEN');sc('lk1v','color',s==='locked'?'#0f8':'#f33');se('sb1t',(lk1.label||'LOCK').toUpperCase()+' '+(s==='locked'?'SECURED':'OPEN'));sc('sb1d','background',s==='locked'?'#0f8':'#f33');}
    const lk2=locks[1];if(lk2){const s=(h.states[lk2.entity]||{state:'unknown'}).state;se('lk2v',s==='locked'?'LOCKED':'OPEN');sc('lk2v','color',s==='locked'?'#0f8':'#f33');}
  }
}
if(!customElements.get('security-camera-card'))customElements.define('security-camera-card',SecurityCameraCard);
