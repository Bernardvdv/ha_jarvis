// custom:battery-overview-card — Jarvis Edition
// Full-screen panel card showing all device batteries grouped by category
// Config: columns (int), groups[]{name, items[]{name, entity}}
// See README.md for full config reference

class BatteryOverviewCard extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._hass=null; this._built=false; this._f=0; this._raf=null; }
  setConfig(c) { this._config=c; }
  set hass(h) { this._hass=h; if(!this._built){this._built=true;this._build();}else{this._up();} }
  connectedCallback(){this._go();}
  disconnectedCallback(){cancelAnimationFrame(this._raf);}
  getCardSize(){return 10;}

  _go(){
    cancelAnimationFrame(this._raf);
    const isAndroid=/Android/i.test(navigator.userAgent);
    const tick=()=>{
      this._raf=requestAnimationFrame(tick);
      const f=++this._f,sr=this.shadowRoot;if(!sr)return;
      sr.querySelectorAll('.ds').forEach((d,i)=>{d.style.opacity=(0.3+0.35*Math.sin(f*0.05+i*0.9)).toFixed(2);});
      sr.querySelectorAll('.rring').forEach((r,i)=>{r.setAttribute('transform','rotate('+(f*(i%2===0?0.12:-0.08))+' 42 42)');});
      if(isAndroid)return;
      const sl=sr.getElementById('sl');if(sl)sl.style.top=((f*0.4)%100)+'%';
      sr.querySelectorAll('.cb').forEach((cb,i)=>{cb.style.borderColor='rgba(0,190,255,'+(0.2+0.25*Math.sin(f*0.04+i*1.57)).toFixed(2)+')';});
    };
    this._raf=requestAnimationFrame(tick);
  }

  _col(v){if(v===null||v===undefined||isNaN(v))return'rgba(100,150,255,.35)';if(v<=15)return'#f33';if(v<=30)return'#f84';if(v<=50)return'#fc2';return'#0f8';}

  _arc(pct){
    const v=pct===null||isNaN(pct)?0:pct;
    const r=34,circ=2*Math.PI*r,fill=Math.min(1,v/100)*circ,col=this._col(pct);
    return '<circle cx="42" cy="42" r="'+r+'" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="5"/>'+
      '<circle class="rring" cx="42" cy="42" r="34" fill="none" stroke="rgba(0,190,255,.04)" stroke-width="1" stroke-dasharray="3 9"/>'+
      '<circle cx="42" cy="42" r="'+r+'" fill="none" stroke="'+col+'" stroke-width="5" stroke-dasharray="'+fill.toFixed(1)+' '+(circ-fill).toFixed(1)+'" stroke-linecap="round" transform="rotate(-90 42 42)" style="transition:stroke-dasharray .6s"/>';
  }

  _nav(){
    const navDefs=this._config.navbar||[
      {icon:'mdi:home',url:'/dashboard-jarvis/0'},
      {icon:'mdi:view-dashboard',url:'/dashboard-jarvis/overview'},
      {icon:'mdi:security',url:'/dashboard-jarvis/security'},
      {icon:'mdi:car',url:'/dashboard-jarvis/vehicle'},
      {icon:'mdi:music',url:'/dashboard-jarvis/music'},
      {icon:'mdi:battery-30-bluetooth',url:'/dashboard-jarvis/battery'},
      {icon:'mdi:robot',url:'/dashboard-jarvis/jarvis'},
    ];
    const cur=window.location.pathname;
    return navDefs.map(r=>'<div class="nbb'+(cur===r.url||cur.startsWith(r.url+'/')?' act':'')+'\" data-u="'+r.url+'"><ha-icon icon="'+r.icon+'"></ha-icon></div>').join('');
  }

  _build(){
    const h=this._hass,c=this._config;if(!h||!c)return;
    const groups=c.groups||[],cols=c.columns||5;
    const now=new Date();
    const dstr=now.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).toUpperCase();
    const allVals=groups.flatMap(g=>(g.items||[]).map(i=>{const s=h.states[i.entity];return s?parseFloat(s.state):null;})).filter(v=>v!==null&&!isNaN(v));
    const totalLow=allVals.filter(v=>v<=30).length;
    const totalCrit=allVals.filter(v=>v<=15).length;
    const overallAvg=allVals.length?(allVals.reduce((a,b)=>a+b)/allVals.length).toFixed(0):'-';

    const groupsHTML=groups.map(g=>{
      const items=g.items||[];
      const vals=items.map(i=>{const s=h.states[i.entity];return s?parseFloat(s.state):null;}).filter(v=>v!==null&&!isNaN(v));
      const avg=vals.length?(vals.reduce((a,b)=>a+b)/vals.length).toFixed(0):'-';
      const low=vals.filter(v=>v<=30).length;
      const itemsHTML=items.map(item=>{
        const state=h.states[item.entity];const v=state?parseFloat(state.state):null;const col=this._col(v);const vStr=v!==null&&!isNaN(v)?Math.round(v):'--';
        return '<div class="bitem"><svg viewBox="0 0 84 84" class="barc">'+this._arc(v)+'<text x="42" y="38" text-anchor="middle" font-size="14" font-weight="900" fill="'+col+'" font-family="Orbitron,monospace">'+vStr+'</text><text x="42" y="50" text-anchor="middle" font-size="8" fill="rgba(255,255,255,.3)" font-family="monospace">'+(vStr!=='--'?'%':'')+'</text></svg><div class="bname ds">'+item.name+'</div></div>';
      }).join('');
      return '<div class="grp"><div class="grph"><span class="grpn">// '+g.name.toUpperCase()+'</span><span class="grps ds">AVG <b style="color:#0f8">'+avg+'%</b>'+(low>0?' &nbsp; LOW <b style="color:#f33">'+low+'</b>':'')+'</span></div><div class="bitems" style="grid-template-columns:repeat('+cols+',1fr)">'+itemsHTML+'</div></div>';
    }).join('');

    this.shadowRoot.innerHTML=`<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&display=swap');
*{box-sizing:border-box;margin:0;padding:0}:host{display:block;width:100%;height:100%}
.j{width:100%;height:100%;background:#010d1a;position:relative;overflow:hidden;color:white;font-family:'Share Tech Mono',monospace;display:flex;flex-direction:column;}
.gbg{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(0,190,255,.11) 1px,transparent 1px);background-size:36px 36px;pointer-events:none;z-index:0;}
.vig{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,rgba(1,12,26,.05) 15%,rgba(1,8,20,.7) 100%);pointer-events:none;z-index:1;}
#ag{position:absolute;bottom:0;left:0;right:0;height:140px;background:linear-gradient(to top,rgba(0,140,255,.1),transparent);pointer-events:none;z-index:1;}
#sl{position:absolute;left:0;right:0;height:2px;z-index:10;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(0,230,255,.9) 50%,transparent);opacity:.8;}
.cb{position:absolute;width:16px;height:16px;z-index:8;border-style:solid;transition:border-color .4s;}
.cb.tl{top:8px;left:8px;border-width:2px 0 0 2px}.cb.tr{top:8px;right:8px;border-width:2px 2px 0 0}.cb.bl{bottom:8px;left:8px;border-width:0 0 2px 2px}.cb.br{bottom:8px;right:8px;border-width:0 2px 2px 0}
.inn{position:relative;z-index:5;display:flex;flex-direction:column;height:100%;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding:8px 18px;border-bottom:1px solid rgba(0,190,255,.12);flex-shrink:0;}
.htitle{display:flex;flex-direction:column;gap:2px;}.hgr{font-size:9px;color:rgba(0,210,255,.5);letter-spacing:3px;}.htxt{font-family:'Orbitron',monospace;font-size:18px;font-weight:900;color:white;letter-spacing:3px;}.hdate{font-size:8px;color:rgba(0,190,255,.35);letter-spacing:1.5px;}
.hstats{display:flex;gap:10px;align-items:center;}.hstat{display:flex;flex-direction:column;align-items:center;padding:5px 12px;background:rgba(0,60,140,.2);border:1px solid rgba(0,170,255,.15);border-radius:6px;gap:1px;}.hsv{font-family:'Orbitron',monospace;font-size:18px;font-weight:900;line-height:1;}.hsl{font-size:7px;color:rgba(0,190,255,.45);letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;}
.sd{width:9px;height:9px;border-radius:50%;background:#0f8;animation:glo 2s infinite;align-self:center;}@keyframes glo{0%,100%{opacity:1}50%{opacity:.3}}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 14px;display:flex;flex-direction:column;gap:10px;}.scroll::-webkit-scrollbar{width:3px;}.scroll::-webkit-scrollbar-thumb{background:rgba(0,180,255,.2);border-radius:2px;}
.grp{display:flex;flex-direction:column;gap:6px;}.grph{display:flex;align-items:center;justify-content:space-between;padding:0 2px 2px;}.grpn{font-size:8px;color:rgba(0,210,255,.35);letter-spacing:2.5px;}.grps{font-size:10px;color:rgba(255,255,255,.45);}
.bitems{display:grid;gap:7px;}.bitem{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 4px;background:rgba(0,50,120,.18);border:1px solid rgba(0,190,255,.1);border-radius:5px;}.barc{width:58px;height:58px;flex-shrink:0;}.bname{font-size:8px;color:rgba(0,200,255,.45);text-align:center;letter-spacing:.3px;line-height:1.3;}.ds{font-size:9px;}
.sbar{display:flex;align-items:stretch;border-top:1px solid rgba(0,190,255,.1);flex-shrink:0;}.sbi{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 4px;font-size:9px;letter-spacing:.5px;border-right:1px solid rgba(0,190,255,.07);}.sbi:last-child{border-right:none}.sbd{width:6px;height:6px;border-radius:50%;flex-shrink:0;}.sbt{color:rgba(0,200,255,.45);}.sbend{padding:6px 12px;font-size:8px;color:rgba(0,130,210,.35);letter-spacing:1.5px;display:flex;align-items:center;white-space:nowrap;}
.navbar{display:flex;align-items:center;justify-content:center;gap:8px;padding:7px 16px;border-top:1px solid rgba(0,190,255,.12);background:rgba(1,8,20,.7);flex-shrink:0;}.nbb{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;background:rgba(0,60,140,.2);border:1px solid rgba(0,190,255,.13);transition:all .15s;}.nbb:hover{background:rgba(0,130,255,.2);border-color:rgba(0,210,255,.35)}.nbb.act{background:rgba(0,190,255,.2);border-color:rgba(0,210,255,.4);}.nbb ha-icon{--mdc-icon-size:20px;color:rgba(0,200,255,.6);pointer-events:none;}.nbb.act ha-icon{color:rgba(0,230,255,.95);}
</style>
<div class="j">
  <div class="gbg"></div><div class="vig"></div><div id="ag"></div><div id="sl"></div>
  <div class="cb tl"></div><div class="cb tr"></div><div class="cb bl"></div><div class="cb br"></div>
  <div class="inn">
    <div class="hdr">
      <div class="htitle"><div class="hgr">JARVIS HOME INTELLIGENCE SYSTEM</div><div class="htxt">// BATTERY STATUS</div><div class="hdate">${dstr}</div></div>
      <div class="hstats">
        <div class="hstat"><div class="hsv" style="color:#0f8">${overallAvg}%</div><div class="hsl">Fleet Avg</div></div>
        <div class="hstat"><div class="hsv" style="color:${totalLow>0?'#fc2':'#0f8'}">${totalLow}</div><div class="hsl">Low &lt;30%</div></div>
        <div class="hstat"><div class="hsv" style="color:${totalCrit>0?'#f33':'#0f8'}">${totalCrit}</div><div class="hsl">Critical</div></div>
        <div class="sd"></div>
      </div>
    </div>
    <div class="scroll">${groupsHTML}</div>
    <div class="sbar">
      <div class="sbi"><div class="sbd" style="background:#0f8"></div><span class="sbt">${allVals.filter(v=>v>50).length} GOOD</span></div>
      <div class="sbi"><div class="sbd" style="background:#fc2"></div><span class="sbt">${allVals.filter(v=>v>30&&v<=50).length} MEDIUM</span></div>
      <div class="sbi"><div class="sbd" style="background:#f84"></div><span class="sbt">${allVals.filter(v=>v>15&&v<=30).length} LOW</span></div>
      <div class="sbi"><div class="sbd" style="background:#f33;${totalCrit>0?'animation:glo .8s infinite':''}"></div><span class="sbt" style="color:${totalCrit>0?'#f33':'rgba(0,200,255,.45)'}">${totalCrit} CRITICAL</span></div>
      <div class="sbend">JARVIS &middot; ${allVals.length} DEVICES</div>
    </div>
    <div class="navbar" id="nb">${this._nav()}</div>
  </div>
</div>`;
    this.shadowRoot.getElementById('nb').addEventListener('click',e=>{const b=e.target.closest('.nbb');if(b){history.pushState(null,'',b.dataset.u);this.dispatchEvent(new CustomEvent('location-changed',{bubbles:true,composed:true}));}});
    this._go();
  }
  _up(){}
}
if(!customElements.get('battery-overview-card'))customElements.define('battery-overview-card',BatteryOverviewCard);
