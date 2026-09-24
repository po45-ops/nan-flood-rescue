const THREE=window.THREE;

const ITEMS={
 radio:{name:'วิทยุสื่อสาร',icon:'📻',category:'สื่อสาร'},
 toolkit:{name:'ชุดเครื่องมือ',icon:'🧰',category:'ซ่อมบำรุง'},
 firstaid:{name:'ชุดปฐมพยาบาล',icon:'🩹',category:'กู้ภัย'},
 sandbag:{name:'กระสอบทราย',icon:'🧱',category:'วิศวกรรม',cost:10,small:true},
 pump:{name:'เครื่องสูบน้ำ',icon:'⚙️',category:'วิศวกรรม',cost:20,large:true},
 warning:{name:'ระบบเตือนภัย',icon:'📣',category:'การจัดการคน',cost:15,small:true},
 checkdam:{name:'ชุดฝายชะลอน้ำ',icon:'🪵',category:'ธรรมชาติ',cost:18,large:true},
 retention:{name:'พื้นที่รับน้ำ',icon:'🌾',category:'ธรรมชาติ',cost:18,large:true},
 forest:{name:'กล้าไม้ฟื้นฟูป่า',icon:'🌱',category:'ธรรมชาติ',cost:12,small:true}
};

const ROLE_COLORS=[0xf18a2d,0x63bde7,0xd6ad64,0x4f9b66,0xf17738];
const ROLE_NAMES=['วิศวกรน้อย','นักวิทยาศาสตร์น้อย','นักภูมิศาสตร์น้อย','นักอนุรักษ์น้อย','ทีมกู้ภัยน้อย'];

function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function lerp(a,b,t){return a+(b-a)*t}
function fmt(n){return Math.round(n).toLocaleString('th-TH')}
function mat(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:.82,metalness:.04,...opts})}
function mesh(geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);return m}
function box(w,h,d,color,x=0,y=h/2,z=0){return mesh(new THREE.BoxGeometry(w,h,d),mat(color),x,y,z)}
function cyl(r,h,color,x=0,y=h/2,z=0,segments=12){return mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(color),x,y,z)}

class NanAdventureGame{
 constructor(host,options={}){
  this.host=host;this.options=options;this.role=Number(options.role)||0;this.playerName=options.player||'นักเรียน';
  this.keys={};this.mobile={x:0,y:0};this.cameraYaw=.58;this.cameraPitch=.48;this.cameraDistance=12;this.dragging=false;this.pointer={x:0,y:0};
  this.interactables=[];this.pickups=[];this.labels=[];this.buildMeshes=[];this.surveyMarkers=[];this.nearest=null;this.nearestPickup=null;this.inVehicle=false;this.running=true;this.buildMode=false;this.buildSelected='sandbag';this.preview=null;this.fieldGame=null;this.eventSpeed=1;this.lastFloodSave=-1;this.lastFloodUI=-1;
  this.state=this.loadState();
  this.renderUI();this.initThree();this.buildWorld();this.bindInput();this.refreshUI();this.animate();
 }

 loadState(){
  const blank={budget:100,timeMinutes:0,trust:30,xp:0,level:1,phase:'prepare',inventory:{radio:0,toolkit:0,firstaid:0,sandbag:0,warning:0,forest:0},cargo:{pump:0,checkdam:0,retention:0},checkedStation:false,talkedVillage:false,talkedNPC:[],visitedEquipment:false,builds:[],eventTime:0,dynamic:{pumpFailure:false,pumpFixed:false,schoolRequest:false,schoolEvacuated:false,roadCut:false},survey:[],notebook:[],discoveries:[],result:null};
  try{const saved=JSON.parse(localStorage.getItem('nan-adventure-save-v1')||'{}');return {...blank,...saved,inventory:{...blank.inventory,...saved.inventory},cargo:{...blank.cargo,...saved.cargo},dynamic:{...blank.dynamic,...saved.dynamic},talkedNPC:saved.talkedNPC||[]}}catch{return blank}
 }
 save(){localStorage.setItem('nan-adventure-save-v1',JSON.stringify(this.state))}

 renderUI(){
  this.host.innerHTML=`<div class="adventure-root">
   <canvas class="adventure-canvas" aria-label="โลกเกมสามมิติ ชุมชนริมแม่น้ำน่าน"></canvas>
   <div class="adv-top">
    <button class="adv-logo" data-act="exit"><span class="wave">≋</span><span><b>NAN FLOOD RESCUE</b><small>ชุมชนริมแม่น้ำน่าน • กลับหน้าหลัก</small></span></button>
    <div class="adv-profile"><span class="adv-avatar avatar-${this.role}"></span><span><b>${this.escape(this.playerName)}</b><small>${ROLE_NAMES[this.role]} • Lv.<span data-ui="level">1</span></small></span></div>
    <div class="adv-stat"><b data-ui="budget">100</b><small>งบเกม</small></div>
    <div class="adv-stat"><b data-ui="time">08:00</b><small>เวลาโลก</small></div>
    <div class="adv-weather"><strong data-ui="weatherIcon">🌦️</strong><span><b data-ui="weather">ฝนตั้งเค้า</b><small data-ui="water">ระดับน้ำ: เฝ้าระวัง</small></span></div>
   </div>
   <aside class="adv-quest-panel"><span class="adv-zone-chip">⌖ ZONE 3 • เขตเมืองน่าน</span><h2>⛰️ ภารกิจหลัก</h2><small>จัดการน้ำผ่านการสำรวจและลงมือทำ</small><div data-ui="quests"></div><div data-ui="startEvent"></div><div class="adv-trust"><span><b>ความร่วมมือชุมชน</b><strong data-ui="trust">30</strong></span><i><em data-ui="trustBar" style="width:30%"></em></i></div></aside>
   <div class="adv-minimap"><h3>แผนที่ย่อ</h3><div class="mini-world"><span class="mini-label" style="left:8%;top:23%">ศูนย์ฯ</span><span class="mini-label" style="left:60%;top:25%">โรงเรียน</span><span class="mini-label" style="left:61%;top:72%">ชุมชน</span><i class="mini-dot" data-ui="miniDot"></i></div></div>
   <div class="adv-layer-note">ฉาก 3D เพื่อการเรียนรู้ • ไม่ใช่แผนที่มาตราส่วนจริง</div>
   <div class="adv-context" data-ui="context"><kbd data-ui="contextKey">E</kbd><span data-ui="contextText">โต้ตอบ</span></div>
   <div class="adv-mode" data-ui="mode"></div>
   <div class="adv-buildbar" data-ui="buildbar">${['sandbag','pump','warning','checkdam','retention','forest'].map(id=>`<button class="build-choice ${id==='sandbag'?'active':''}" data-build="${id}"><span>${ITEMS[id].icon}</span><span><b>${ITEMS[id].name}</b><small data-count="${id}">มี 0</small></span></button>`).join('')}<button class="build-exit" data-act="buildExit">ออก<br>Build</button></div>
   <div class="adv-timeline" data-ui="timeline"><div class="timeline-top"><span><b>SIMULATION TIME</b> <span data-ui="eventClock">T-24</span></span><div class="timeline-speeds">${[1,2,4].map(v=>`<button data-speed="${v}" class="${v===1?'active':''}">${v}x</button>`).join('')}</div></div><div class="timeline-track"><i data-ui="eventProgress"></i></div><div class="timeline-labels"><span>T-24</span><span>T-12</span><span>T0</span><span>T+6</span><span>T+12</span></div></div>
   <div class="adv-joystick" data-ui="joystick"><div class="adv-stick" data-ui="stick"></div></div>
   <div class="adv-bottom"><div class="adv-quick">${['radio','toolkit','sandbag','firstaid'].map((id,i)=>`<button class="quick-slot ${i===0?'active':''}" data-quick="${id}"><small>${i+1}</small><b>${ITEMS[id].icon}</b><em data-quick-count="${id}">0</em></button>`).join('')}</div><div class="adv-actions"><button class="adv-round" data-act="inventory"><b>🎒</b><small>กระเป๋า</small></button><button class="adv-round" data-act="map"><b>🗺️</b><small>แผนที่</small></button><button class="adv-round" data-act="build"><b>🔨</b><small>สร้าง</small></button><button class="adv-round primary" data-act="interact"><b>✋</b><small>โต้ตอบ</small></button></div></div>
   <div class="adv-modal-back" data-ui="modal"><div class="adv-modal" data-ui="modalBody"></div></div>
  </div>`;
  this.root=this.host.querySelector('.adventure-root');this.canvas=this.host.querySelector('.adventure-canvas');
 }

 initThree(){
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x92c9df);this.scene.fog=new THREE.FogExp2(0x91b8c8,.009);
  this.camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,350);
  this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setSize(innerWidth,innerHeight,false);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
  this.scene.add(new THREE.HemisphereLight(0xdff4ff,0x486840,2.4));const sun=new THREE.DirectionalLight(0xfff1d3,2.1);sun.position.set(-35,55,-20);this.scene.add(sun);
  this.clock=new THREE.Clock();this.raycaster=new THREE.Raycaster();this.ndc=new THREE.Vector2();
 }

 buildWorld(){
  const ground=mesh(new THREE.PlaneGeometry(170,145,1,1),mat(0x477a45),0,0,0);ground.rotation.x=-Math.PI/2;ground.name='ground';this.scene.add(ground);this.ground=ground;
  const terrain=mesh(new THREE.PlaneGeometry(170,145,24,20),mat(0x4d7b48),0,-.18,0);terrain.rotation.x=-Math.PI/2;const p=terrain.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,(Math.sin(x*.12)+Math.cos(y*.1))*.2)}terrain.geometry.computeVertexNormals();this.scene.add(terrain);
  this.addMountainRing();this.addRiver();this.addRoads();
  this.command=this.addBuilding(-34,-27,15,10,0x214f65,'ศูนย์บัญชาการ','🏢');
  this.equipment=this.addBuilding(-30,21,17,11,0xb87327,'ศูนย์อุปกรณ์','🧰');
  this.school=this.addBuilding(34,-17,18,11,0xe1c47c,'โรงเรียนบ้านน้ำ','🏫');
  this.station=this.addBuilding(22,27,8,7,0x4e8da8,'สถานีวัดน้ำ','📡');
  this.hospital=this.addBuilding(35,22,13,9,0xe7e9e6,'โรงพยาบาล','✚');
  this.addVillage(26,5);this.addFarm(-22,40);this.addBridge(-16);this.addBridge(30);
  for(let i=0;i<45;i++){const x=-72+Math.random()*144,z=-60+Math.random()*120;if(Math.abs(x-7)>11&&this.distanceToBuildings(x,z)>8)this.addTree(x,z,.7+Math.random()*.6)}
  this.player=this.makeAvatar(ROLE_COLORS[this.role]);this.player.position.set(-31,.05,-18);this.scene.add(this.player);
  this.vehicle=this.makeVehicle();this.vehicle.position.set(-20,.05,-23);this.scene.add(this.vehicle);
  this.addNPC('เจ้าหน้าที่น้ำ','👷',0x3f8ac2,20,22,'ข้อมูลสถานีกำลังขาดช่วง ช่วยตรวจเซนเซอร์ที่สถานีวัดน้ำให้หน่อย',()=>{this.state.checkedStation=true;this.note('เจ้าหน้าที่น้ำรายงานว่าข้อมูลสถานีขาดช่วง');this.addTrust(4)});
  this.addNPC('ผู้ใหญ่บ้าน','🧑‍🌾',0xb66f3b,27,3,'ชุมชนกังวลเรื่องทางอพยพ ถ้าเธอฟังข้อมูลพื้นที่ก่อนวางแผน ทุกคนจะช่วยงานมากขึ้น',()=>{this.state.talkedVillage=true;this.addTrust(7)});
  this.addNPC('ครูประจำโรงเรียน','👩‍🏫',0x8d62a8,34,-10,'โรงเรียนมีเด็กและผู้สูงอายุอยู่ด้วย หากน้ำสูงขึ้น เราต้องการรถไปศูนย์พักพิง',()=>{if(this.state.dynamic.schoolRequest)this.evacuateSchool();else this.addTrust(2)});
  this.addNPC('เกษตรกร','🧑‍🌾',0x68a05c,-22,34,'พื้นที่รับน้ำอาจช่วยเมือง แต่ขอให้ดูผลต่อแปลงเกษตรด้วย เราช่วยแนะนำจุดต่ำได้',()=>{this.state.discoveries=this.unique([...this.state.discoveries,'พื้นที่รับน้ำเกษตร']);this.addTrust(4)});
  this.addNPC('เจ้าหน้าที่กู้ภัย','🧑‍🚒',0xe25c3d,-27,-20,'ฉันเตรียมรถไว้ให้ กด E ใกล้รถเพื่อขึ้นรถ ของชิ้นใหญ่จะขนด้วยรถคันนี้',()=>{this.state.inventory.firstaid=Math.max(1,this.state.inventory.firstaid);this.addTrust(3)});
  this.addInteractable(this.station,'station','ตรวจสอบสถานีวัดน้ำ','E',()=>this.inspectStation());
  this.addInteractable(this.equipment,'equipment','เข้าศูนย์อุปกรณ์','E',()=>this.openShop());
  this.addInteractable(this.vehicle,'vehicle','ขึ้นรถขนอุปกรณ์','E',()=>this.toggleVehicle());
  this.addPickup('radio','วิทยุสื่อสาร',-27,-13,0x2b5369);
  this.addPickup('toolkit','ชุดเครื่องมือซ่อม',-23,23,0xdc8d35);
  this.addPickup('sandbag','กระสอบทราย',-35,27,0xc9aa74);
  this.addFloodZones();this.addRain();this.restoreBuilds();if(this.state.phase==='flood'){this.rain.material.opacity=.78;this.q('[data-ui="timeline"]').classList.add('show');this.q('[data-ui="weather"]').textContent='ฝนตกหนัก';this.q('[data-ui="weatherIcon"]').textContent='🌧️'}if(['survey','complete'].includes(this.state.phase)){this.rain.material.opacity=.12;this.spawnSurveyPoints()}
 }

 addMountainRing(){
  const g=new THREE.ConeGeometry(18,30,5);for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=83+Math.random()*12;const m=mesh(g,mat(i%2?0x395e49:0x446d52),Math.cos(a)*r,12,Math.sin(a)*r);m.scale.set(1+Math.random(),.8+Math.random()*.5,1+Math.random());m.rotation.y=Math.random()*Math.PI;this.scene.add(m)}
 }
 addRiver(){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(4,.05,-73),new THREE.Vector3(12,.05,-40),new THREE.Vector3(7,.05,-8),new THREE.Vector3(14,.05,23),new THREE.Vector3(8,.05,72)]);const geo=new THREE.TubeGeometry(curve,80,5.2,12,false);const river=mesh(geo,mat(0x2d92b8,{transparent:true,opacity:.9,roughness:.25}));river.name='river';this.scene.add(river);this.river=river;this.riverCurve=curve;
  const banks=new THREE.TubeGeometry(curve,80,6.4,12,false);const bank=mesh(banks,mat(0xb99c68));bank.renderOrder=-1;this.scene.add(bank);this.scene.remove(river);this.scene.add(bank);this.scene.add(river);
  for(let i=0;i<12;i++){const t=(i+.4)/12,p=curve.getPoint(t),tan=curve.getTangent(t);this.addTextSprite('→',p.x,.5,p.z,20,0xbcefff,Math.atan2(tan.x,tan.z))}
 }
 addRoads(){for(const [x,z,w,d,rot] of [[-8,-18,115,6,.08],[-18,22,90,5,-.13],[29,2,5,70,0]]){const road=box(w,.18,d,0x6b6e6b,x,.08,z);road.rotation.y=rot;this.scene.add(road)}}
 addBridge(z){const bridge=box(21,.55,6,0x9d8663,9,.45,z);this.scene.add(bridge);for(const x of [0,18])this.scene.add(cyl(.7,3,0x756047,x,1.5,z))}
 addBuilding(x,z,w,d,color,label,icon){const g=new THREE.Group();const body=box(w,5,d,color,0,2.5,0);const roof=mesh(new THREE.ConeGeometry(Math.max(w,d)*.72,3,4),mat(0x70412f),0,6.3,0);roof.rotation.y=Math.PI/4;g.add(body,roof);for(const dx of [-w*.25,w*.25])g.add(box(1.6,1.5,.15,0xbde8f4,dx,3,-d/2-.08));g.position.set(x,0,z);this.scene.add(g);this.addTextSprite(`${icon} ${label}`,x,8,z,13);return g}
 addVillage(x,z){for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=10+(i%2)*4;this.addBuilding(x+Math.cos(a)*r,z+Math.sin(a)*r,6,5,[0xd49b64,0xc97b5b,0xd4b472][i%3],'',i===0?'🏠':'')}}
 addFarm(x,z){for(let i=0;i<6;i++){const f=box(10,.08,7,i%2?0x7aa654:0x9ab95d,x+(i%3)*11-11,.04,z+Math.floor(i/3)*8);this.scene.add(f)}this.addTextSprite('🌾 พื้นที่เกษตร',x,2,z,13)}
 addTree(x,z,s=1){const g=new THREE.Group();g.add(cyl(.35*s,2.8*s,0x755035,0,1.4*s,0,7));const crown=mesh(new THREE.ConeGeometry(1.6*s,4*s,7),mat(0x2d6d42),0,4*s,0);g.add(crown);g.position.set(x,0,z);this.scene.add(g)}
 distanceToBuildings(x,z){return Math.min(...[[-34,-27],[-30,21],[34,-17],[22,27],[35,22],[26,5]].map(([a,b])=>Math.hypot(x-a,z-b)))}

 makeAvatar(color){const g=new THREE.Group();const body=box(1.15,2.2,.75,color,0,1.8,0);const head=mesh(new THREE.SphereGeometry(.55,16,12),mat(0xf0bf92),0,3.35,0);const hair=mesh(new THREE.SphereGeometry(.58,12,8,0,Math.PI*2,0,Math.PI*.55),mat(0x2b211e),0,3.52,0);g.add(body,head,hair);for(const side of [-1,1]){const arm=box(.3,1.7,.3,color,side*.78,1.9,0);arm.rotation.z=side*.08;g.add(arm);const leg=box(.38,1.6,.45,0x24364b,side*.32,.8,0);g.add(leg)}g.userData.legs=g.children.slice(-2);return g}
 makeNPC(color){const g=this.makeAvatar(color);g.scale.set(.86,.86,.86);return g}
 makeVehicle(){const g=new THREE.Group();g.add(box(4.5,1.3,2.4,0xe56f25,0,1,0),box(2.2,1.3,2.2,0xf18a32,-.7,2,0));for(const x of [-1.5,1.5])for(const z of [-1.2,1.2]){const w=mesh(new THREE.CylinderGeometry(.52,.52,.35,12),mat(0x22252a),x,.65,z);w.rotation.x=Math.PI/2;g.add(w)}this.addTextSprite('🚙 รถขนอุปกรณ์',-20,4,-23,11);return g}
 addNPC(name,icon,color,x,z,message,onTalk){const n=this.makeNPC(color);n.position.set(x,0,z);this.scene.add(n);this.addTextSprite(`${icon} ${name}`,x,4.7,z,11);this.addInteractable(n,'npc',`พูดคุยกับ ${name}`,'E',()=>this.dialog(name,icon,message,onTalk));return n}
 addInteractable(object,type,prompt,key,action){this.interactables.push({object,type,prompt,key,action})}
 addPickup(id,name,x,z,color){const p=box(1.1,.8,1.1,color,x,.55,z);p.rotation.y=.4;p.userData.pickup=id;this.scene.add(p);this.addTextSprite(`✦ ${name}`,x,1.9,z,9);this.pickups.push({object:p,id,name,picked:false})}
 addTextSprite(text,x,y,z,size=12,color=0xffffff){if(!text.trim())return;const c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.font=`700 ${size*2}px Tahoma`;const w=Math.ceil(ctx.measureText(text).width+24);c.width=w;c.height=size*3.2;ctx.font=`700 ${size*2}px Tahoma`;ctx.fillStyle='rgba(6,24,38,.82)';ctx.beginPath();if(ctx.roundRect)ctx.roundRect(0,0,w,c.height,10);else ctx.rect(0,0,w,c.height);ctx.fill();ctx.fillStyle='#'+color.toString(16).padStart(6,'0');ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,c.height/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.position.set(x,y,z);s.scale.set(w/45,c.height/45,1);this.scene.add(s);this.labels.push(s);return s}
 addFloodZones(){this.floodPlanes=[];for(const [x,z,w,d] of [[24,5,38,42],[-20,38,38,24],[4,-8,22,30]]){const p=mesh(new THREE.PlaneGeometry(w,d),mat(0x2f9ed2,{transparent:true,opacity:0,depthWrite:false}),x,.12,z);p.rotation.x=-Math.PI/2;this.scene.add(p);this.floodPlanes.push(p)}}
 addRain(){const count=450,geo=new THREE.BufferGeometry(),a=new Float32Array(count*3);for(let i=0;i<count;i++){a[i*3]=-70+Math.random()*140;a[i*3+1]=10+Math.random()*45;a[i*3+2]=-60+Math.random()*120}geo.setAttribute('position',new THREE.BufferAttribute(a,3));this.rain=mesh(geo,new THREE.PointsMaterial({color:0xc1edff,size:.12,transparent:true,opacity:0}));this.rain=new THREE.Points(geo,this.rain.material);this.scene.add(this.rain)}

 restoreBuilds(){for(const b of this.state.builds){const o=this.createBuildObject(b.id,b.x,b.z);this.scene.add(o);this.buildMeshes.push({object:o,...b});if(b.id==='pump')this.addInteractable(o,'pump',b.active?'ปิดเครื่องสูบน้ำ':'เปิดเครื่องสูบน้ำ','E',()=>this.togglePump(b,o))}}
 createBuildObject(id,x,z){const g=new THREE.Group();if(id==='sandbag'){for(let i=0;i<5;i++)g.add(box(1.25,.5,.65,0xd2b487,(i-2)*1.05,.28,0))}else if(id==='pump'){g.add(cyl(1.1,1.5,0xe5862c),cyl(.28,3,0x444b50,1.2,.55,0));g.children[1].rotation.z=Math.PI/2}else if(id==='warning'){g.add(cyl(.25,4,0x6e7378),box(1.8,1.4,.7,0xe8a929,0,3.8,0))}else if(id==='checkdam'){for(let i=0;i<5;i++)g.add(cyl(.35,4,0x795437,(i-2)*.65,.45,0));g.rotation.z=Math.PI/2}else if(id==='retention'){const p=mesh(new THREE.CylinderGeometry(4.6,4.6,.15,24),mat(0x397e9c,{transparent:true,opacity:.75}),0,.08,0);g.add(p)}else{for(let i=0;i<6;i++){const t=new THREE.Group();t.add(cyl(.18,1.3,0x704930,0,.65,0),mesh(new THREE.ConeGeometry(.75,1.8,7),mat(0x3a8e4e),0,1.7,0));t.position.set((i%3-1)*1.6,0,(Math.floor(i/3)-.5)*1.7);g.add(t)}}g.position.set(x,.04,z);g.userData.build=id;return g}

 bindInput(){
  this.onKeyDown=e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;this.keys[e.code]=true;if(e.repeat)return;if(e.code==='KeyE')this.interact();if(e.code==='KeyF')this.pickup();if(e.code==='KeyI')this.openInventory();if(e.code==='KeyM')this.openMap();if(e.code==='KeyB')this.toggleBuild();if(e.code==='KeyQ')this.toggleQuest();if(e.code==='Tab'){e.preventDefault();this.openSituation()}if(e.code==='Escape')this.escapeAction();if(/^Digit[1-4]$/.test(e.code))this.selectQuick(Number(e.code.slice(-1))-1)};
  this.onKeyUp=e=>{this.keys[e.code]=false};addEventListener('keydown',this.onKeyDown);addEventListener('keyup',this.onKeyUp);
  this.onResize=()=>{const w=this.root.clientWidth||innerWidth,h=this.root.clientHeight||innerHeight;this.camera.aspect=w/h;this.camera.updateProjectionMatrix();this.renderer.setSize(w,h,false)};addEventListener('resize',this.onResize);this.onResize();
  this.canvas.addEventListener('pointerdown',e=>{if(this.buildMode){this.tryPlaceBuild();return}this.dragging=true;this.dragStart={x:e.clientX,y:e.clientY}});
  this.canvas.addEventListener('pointermove',e=>{this.pointer.x=e.clientX;this.pointer.y=e.clientY;if(this.dragging&&!this.buildMode){const dx=e.clientX-this.dragStart.x,dy=e.clientY-this.dragStart.y;this.cameraYaw-=dx*.006;this.cameraPitch=clamp(this.cameraPitch+dy*.004,.18,1.02);this.dragStart={x:e.clientX,y:e.clientY}}});
  this.canvas.addEventListener('pointerup',()=>this.dragging=false);this.canvas.addEventListener('pointercancel',()=>this.dragging=false);this.canvas.addEventListener('wheel',e=>{this.cameraDistance=clamp(this.cameraDistance+e.deltaY*.012,7,19)},{passive:true});
  this.root.addEventListener('click',e=>{const act=e.target.closest('[data-act]')?.dataset.act;if(act)this.doAction(act);const build=e.target.closest('[data-build]')?.dataset.build;if(build)this.selectBuild(build);const speed=e.target.closest('[data-speed]')?.dataset.speed;if(speed)this.setSpeed(Number(speed));const buy=e.target.closest('[data-buy]')?.dataset.buy;if(buy)this.buyItem(buy);const dialog=e.target.closest('[data-dialog]')?.dataset.dialog;if(dialog)this.handleDialog(dialog)});
  this.bindJoystick();
 }
 bindJoystick(){const base=this.q('[data-ui="joystick"]'),stick=this.q('[data-ui="stick"]');let active=false,id=null;const move=e=>{if(!active)return;const p=[...e.changedTouches||[e]].find(t=>id===null||t.identifier===id);if(!p)return;const r=base.getBoundingClientRect(),dx=p.clientX-(r.left+r.width/2),dy=p.clientY-(r.top+r.height/2),len=Math.hypot(dx,dy)||1,max=r.width*.32,k=Math.min(max,len)/len;this.mobile.x=dx*k/max;this.mobile.y=dy*k/max;stick.style.transform=`translate(${dx*k}px,${dy*k}px)`};const end=e=>{active=false;id=null;this.mobile.x=this.mobile.y=0;stick.style.transform=''};base.addEventListener('pointerdown',e=>{active=true;id=e.pointerId;base.setPointerCapture(id);move(e)});base.addEventListener('pointermove',move);base.addEventListener('pointerup',end);base.addEventListener('pointercancel',end)}

 animate(){if(!this.running)return;this.raf=requestAnimationFrame(()=>this.animate());const dt=Math.min(.045,this.clock.getDelta());this.updatePlayer(dt);this.updateCamera(dt);this.updateContext();this.updateWorld(dt);this.renderer.render(this.scene,this.camera)}
 updatePlayer(dt){
  let x=(this.keys.KeyD?1:0)-(this.keys.KeyA?1:0)+this.mobile.x;let z=(this.keys.KeyS?1:0)-(this.keys.KeyW?1:0)+this.mobile.y;const len=Math.hypot(x,z);if(len>.08){x/=Math.max(1,len);z/=Math.max(1,len);const forward=new THREE.Vector3(-Math.sin(this.cameraYaw),0,-Math.cos(this.cameraYaw)),right=new THREE.Vector3(Math.cos(this.cameraYaw),0,-Math.sin(this.cameraYaw));const d=forward.multiplyScalar(-z).add(right.multiplyScalar(x)).normalize();const speed=this.inVehicle?15:(this.keys.ShiftLeft||this.keys.ShiftRight?9:5.5)*(this.carrying()?0.7:1);const target=this.controlled().position.clone().addScaledVector(d,speed*dt);target.x=clamp(target.x,-68,68);target.z=clamp(target.z,-58,58);if(!this.blocked(target))this.controlled().position.copy(target);this.controlled().rotation.y=Math.atan2(d.x,d.z);if(!this.inVehicle){const phase=performance.now()*.012;this.player.userData.legs?.forEach((leg,i)=>leg.rotation.x=Math.sin(phase+(i*Math.PI))*.45)}}else if(!this.inVehicle)this.player.userData.legs?.forEach(leg=>leg.rotation.x*=.82);
  if(this.inVehicle)this.player.position.copy(this.vehicle.position).add(new THREE.Vector3(0,1.7,0));this.updateMiniDot();this.updateBuildPreview();
 }
 controlled(){return this.inVehicle?this.vehicle:this.player}
 carrying(){return this.state.inventory.sandbag>0&&this.buildSelected==='sandbag'}
 blocked(p){const riverBlocked=Math.abs(p.x-9)<5.7&&!([-20,-12].includes(Math.round(p.z/4)*4)||Math.abs(p.z+16)<4||Math.abs(p.z-30)<4);return !this.inVehicle&&riverBlocked}
 updateCamera(dt){const target=this.controlled().position.clone().add(new THREE.Vector3(0,this.inVehicle?2.3:2.5,0));const horiz=Math.cos(this.cameraPitch)*this.cameraDistance;const desired=target.clone().add(new THREE.Vector3(Math.sin(this.cameraYaw)*horiz,Math.sin(this.cameraPitch)*this.cameraDistance,Math.cos(this.cameraYaw)*horiz));this.camera.position.lerp(desired,1-Math.pow(.002,dt));this.camera.lookAt(target)}
 updateContext(){
  const pos=this.controlled().position;let best=null,dist=Infinity;for(const i of this.interactables){if(!i.object.visible)continue;const d=i.object.position.distanceTo(pos);if(d<dist){dist=d;best=i}}this.nearest=dist<5.2?best:null;
  let pick=null,pd=Infinity;for(const p of this.pickups){if(p.picked)continue;const d=p.object.position.distanceTo(pos);if(d<pd){pd=d;pick=p}}this.nearestPickup=pd<4?pick:null;
  const box=this.q('[data-ui="context"]');if(this.buildMode){box.classList.remove('show');return}if(this.nearestPickup){box.classList.add('show');this.q('[data-ui="contextKey"]').textContent='F';this.q('[data-ui="contextText"]').textContent=`หยิบ ${this.nearestPickup.name}`;return}if(this.nearest){box.classList.add('show');this.q('[data-ui="contextKey"]').textContent=this.nearest.key;this.q('[data-ui="contextText"]').textContent=this.nearest.prompt}else box.classList.remove('show')
 }
 updateWorld(dt){
  this.state.timeMinutes+=dt*(this.state.phase==='flood'?this.eventSpeed*5:.18);if(this.state.phase==='flood')this.updateFlood(dt);this.updateClock();
  const a=this.rain.geometry.attributes.position.array;for(let i=0;i<a.length/3;i++){a[i*3+1]-=dt*(12+this.eventSpeed*4);if(a[i*3+1]<0)a[i*3+1]=35+Math.random()*20}this.rain.geometry.attributes.position.needsUpdate=true;
  if(this.fieldGame){this.fieldGame.pos=(Math.sin(performance.now()*.006)+1)/2;const marker=this.q('[data-ui="fieldMarker"]');if(marker)marker.style.left=`calc(${this.fieldGame.pos*100}% - 12px)`}
 }
 updateClock(){const total=8*60+this.state.timeMinutes,h=Math.floor(total/60)%24,m=Math.floor(total%60);this.q('[data-ui="time"]').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
 updateMiniDot(){const p=this.controlled().position,d=this.q('[data-ui="miniDot"]');d.style.left=`${clamp((p.x+70)/140*100,4,96)}%`;d.style.top=`${clamp((p.z+60)/120*100,8,94)}%`}

 interact(){if(this.buildMode){this.tryPlaceBuild();return}if(this.nearest)this.nearest.action();else this.toast('ยังไม่มีสิ่งที่โต้ตอบได้ใกล้ตัว')}
 pickup(){const p=this.nearestPickup;if(!p){this.toast('เดินเข้าใกล้อุปกรณ์ก่อนหยิบ');return}p.picked=true;p.object.visible=false;this.state.inventory[p.id]=(this.state.inventory[p.id]||0)+1;this.state.xp+=5;this.note(`เก็บ ${p.name} จากพื้นที่`);this.save();this.refreshUI();this.toast(`เก็บ ${p.name} แล้ว`)}
 toggleVehicle(){this.inVehicle=!this.inVehicle;this.player.visible=!this.inVehicle;this.nearest.prompt=this.inVehicle?'ลงจากรถ':'ขึ้นรถขนอุปกรณ์';this.toast(this.inVehicle?'ขึ้นรถแล้ว • WASD เพื่อขับ':'ลงจากรถแล้ว')}
 inspectStation(){
  this.state.checkedStation=true;this.state.discoveries=this.unique([...this.state.discoveries,'สถานีวัดน้ำ']);this.state.xp+=10;this.note('ตรวจสถานี: แนวโน้มระดับน้ำเพิ่มขึ้น (ข้อมูลจำลองเพื่อการเรียนรู้)');this.save();this.refreshUI();
  this.modal(`<div class="dialog-speaker"><span class="dialog-face">📡</span><span><b>สถานีวัดน้ำ • จุดเรียนรู้</b><small>SIMULATION CONTEXT</small></span></div><h2>แนวโน้มระดับน้ำกำลังเพิ่ม</h2><p>เซนเซอร์ส่งข้อมูลไม่ต่อเนื่อง เธอพบว่าน้ำจากพื้นที่ต้นน้ำกำลังเคลื่อนลงสู่เมือง ค่านี้เป็นบริบทจำลอง ไม่ใช่ค่าตรวจวัดจริง</p><div class="result-grid"><div class="result-card"><b>เหนือ → ใต้</b><small>ทิศทางการไหล</small></div><div class="result-card"><b>เพิ่มขึ้น</b><small>แนวโน้มจำลอง</small></div><div class="result-card"><b>6 ชม.</b><small>เวลาเตรียมเมือง</small></div></div><div class="adv-buttons"><button class="adv-button green" data-dialog="stationDone">บันทึกลงสมุดภาคสนาม</button></div>`)
 }
 dialog(name,icon,message,onTalk){const first=!this.state.talkedNPC.includes(name),repeatSchool=name==='ครูประจำโรงเรียน'&&this.state.dynamic.schoolRequest&&!this.state.dynamic.schoolEvacuated;if(first){this.state.talkedNPC.push(name);onTalk?.()}else if(repeatSchool)onTalk?.();this.save();this.refreshUI();this.modal(`<div class="dialog-speaker"><span class="dialog-face">${icon}</span><span><b>${name}</b><small>ชุมชนริมแม่น้ำน่าน</small></span></div><p>${message}</p><div class="adv-buttons"><button class="adv-button primary" data-dialog="close">รับทราบและลงมือทำ</button></div>`)}
 evacuateSchool(){if(this.state.dynamic.schoolEvacuated){this.toast('โรงเรียนอพยพเรียบร้อยแล้ว');return}this.state.dynamic.schoolEvacuated=true;this.state.xp+=18;this.addTrust(12);this.note('อพยพโรงเรียนไปศูนย์พักพิงสำเร็จ');this.save();this.refreshUI();this.toast('ช่วยอพยพโรงเรียนสำเร็จ +18 XP')}

 openShop(){this.state.visitedEquipment=true;this.save();this.refreshUI();const cards=['sandbag','pump','warning','checkdam','retention','forest'].map(id=>{const i=ITEMS[id],count=(i.large?this.state.cargo:this.state.inventory)[id]||0;return `<div class="shop-card"><span>${i.icon}</span><b>${i.name}</b><small>${i.category} • ${i.large?'ของใหญ่ ขนด้วยรถ':'ของเล็ก เข้ากระเป๋า'}</small><small>มี ${count} • ${i.cost} หน่วย</small><button data-buy="${id}" ${this.state.budget<i.cost?'disabled':''}>${i.large?'สั่งขนส่ง':'เบิกอุปกรณ์'}</button></div>`}).join('');this.modal(`<div class="dialog-speaker"><span class="dialog-face">🧰</span><span><b>ศูนย์อุปกรณ์และจัดการภัยพิบัติ</b><small>Stock สำหรับภารกิจนี้</small></span></div><p>เลือกเฉพาะสิ่งจำเป็น งบ เวลา รถ และแรงงานมีจำกัด ของชิ้นใหญ่จะอยู่ในช่องบรรทุกของรถ</p><div class="shop-grid">${cards}</div><div class="adv-buttons"><button class="adv-button" data-dialog="close">กลับสู่โลกเกม</button></div>`)}
 buyItem(id){const i=ITEMS[id];if(!i||this.state.budget<i.cost)return;this.state.budget-=i.cost;const store=i.large?this.state.cargo:this.state.inventory;store[id]=(store[id]||0)+1;this.state.xp+=3;this.save();this.refreshUI();this.openShop()}
 openInventory(){const all=Object.keys(ITEMS).filter(id=>(this.state.inventory[id]||this.state.cargo[id])>0);const cards=all.map(id=>`<div class="inv-card"><span>${ITEMS[id].icon}</span><b>${ITEMS[id].name}</b><small>${ITEMS[id].large?'ช่องบรรทุก':'กระเป๋า'} • ${(this.state.inventory[id]||this.state.cargo[id])}</small></div>`).join('')||'<p>ยังไม่มีอุปกรณ์ เดินสำรวจหรือไปศูนย์อุปกรณ์</p>';this.modal(`<h2>🎒 กระเป๋าและช่องบรรทุก</h2><p>ของเล็กอยู่กับตัวละคร ของใหญ่ต้องขนด้วยรถและใช้ใน Build Mode</p><div class="inventory-grid">${cards}</div><div class="adv-buttons"><button class="adv-button" data-dialog="close">ปิดกระเป๋า</button></div>`)}
 openMap(){this.modal(`<h2>🗺️ แผนที่ภารกิจ</h2><p>โลกต้นแบบแบ่งเป็นศูนย์บัญชาการ ศูนย์อุปกรณ์ สถานีวัดน้ำ โรงเรียน ชุมชน พื้นที่เกษตร ลำน้ำ ถนน และสะพาน จุดที่ค้นพบจะเพิ่มลงสมุดภาคสนาม</p><div class="result-grid"><div class="result-card"><b>ต้นน้ำ</b><small>น้ำกำลังเคลื่อนลงมา</small></div><div class="result-card"><b>เมือง</b><small>พื้นที่ชุมชนและโรงเรียน</small></div><div class="result-card"><b>ปลายน้ำ</b><small>รับผลจากการตัดสินใจด้านบน</small></div></div><p><span class="simulation-tag">ผลจากแบบจำลองเพื่อการเรียนรู้</span></p><div class="adv-buttons"><button class="adv-button" data-dialog="close">ปิดแผนที่</button></div>`)}
 openSituation(){this.modal(`<h2>🌧️ ข้อมูลสถานการณ์</h2><p><b>Historical Fact:</b> ภารกิจอิงรายงานพื้นที่น้ำท่วมจากภาพดาวเทียมวันที่ 25 กรกฎาคม 2568 ในเมืองน่าน ภูเพียง และเวียงสา รวมประมาณ 22,032 ไร่</p><p><b>Simulation Time:</b> ${this.eventLabel()} • การไหล ระดับน้ำ ความเสียหาย และผลของมาตรการในโลก 3D เป็นผลจำลองเพื่อการเรียนรู้</p><div class="adv-buttons"><button class="adv-button" data-dialog="close">กลับไปเล่น</button></div>`)}
 toggleQuest(){this.q('.adv-quest-panel').hidden=!this.q('.adv-quest-panel').hidden}

 toggleBuild(force){if(this.state.phase==='survey'){this.toast('ช่วงสำรวจความเสียหาย ไม่สามารถสร้างเพิ่มได้');return}this.buildMode=force===undefined?!this.buildMode:force;this.q('[data-ui="buildbar"]').classList.toggle('open',this.buildMode);this.q('[data-ui="mode"]').classList.toggle('show',this.buildMode);if(this.buildMode){this.createPreview();this.toast('Build Mode • เลือกมาตรการ แล้วคลิกพื้นที่เพื่อวาง')}else this.removePreview()}
 selectBuild(id){this.buildSelected=id;this.root.querySelectorAll('[data-build]').forEach(b=>b.classList.toggle('active',b.dataset.build===id));this.createPreview()}
 createPreview(){this.removePreview();this.preview=this.createBuildObject(this.buildSelected,0,0);this.preview.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.55}});this.scene.add(this.preview)}
 removePreview(){if(this.preview){this.scene.remove(this.preview);this.preview=null}}
 updateBuildPreview(){if(!this.buildMode||!this.preview)return;const p=this.player.position.clone(),d=new THREE.Vector3(Math.sin(this.player.rotation.y),0,Math.cos(this.player.rotation.y));const target=p.addScaledVector(d,5);this.preview.position.set(target.x,.06,target.z);const valid=this.buildValid(target,this.buildSelected);this.preview.traverse(o=>{if(o.material)o.material.color.set(valid?0x4fe07d:0xef4f4f)});const mode=this.q('[data-ui="mode"]');mode.textContent=valid?'BUILD MODE • สีเขียว: วางได้':'BUILD MODE • สีแดง: วางไม่ได้';mode.classList.toggle('buildable',valid);mode.classList.toggle('blocked',!valid)}
 buildValid(p,id){const nearRiver=Math.abs(p.x-9)<14;const farFromBuildings=this.distanceToBuildings(p.x,p.z)>7;if(!farFromBuildings)return false;if(id==='pump')return nearRiver&&Math.abs(p.x-9)>5.5;if(id==='checkdam')return Math.abs(p.x-9)<8;if(id==='retention')return p.z>25&&p.x<0;return Math.abs(p.x-9)>6}
 available(id){return (ITEMS[id].large?this.state.cargo[id]:this.state.inventory[id])||0}
 tryPlaceBuild(){if(!this.buildMode||!this.preview)return;const id=this.buildSelected,p=this.preview.position.clone();if(!this.available(id)){this.toast(`ยังไม่มี ${ITEMS[id].name} • ไปศูนย์อุปกรณ์ก่อน`);return}if(!this.buildValid(p,id)){this.toast('จุดนี้ไม่เหมาะ ลองดูระยะจากแม่น้ำ ถนน และอาคาร');return}this.pendingBuild={id,x:p.x,z:p.z};this.startFieldGame()}
 startFieldGame(){this.fieldGame={pos:0,hits:0};this.modal(`<h2>🔧 งานภาคสนาม: ${ITEMS[this.pendingBuild.id].name}</h2><p>กด “ยึดชิ้นส่วน” เมื่อจุดสีเหลืองอยู่ในช่วงสีเขียว ทำสำเร็จ 3 ครั้งเพื่อประกอบและติดตั้ง</p><div class="field-game"><div class="field-track"><i class="field-zone"></i><i class="field-marker" data-ui="fieldMarker"></i></div><div class="field-status" data-ui="fieldStatus">ความคืบหน้า 0 / 3</div><button class="adv-button green" data-dialog="fieldHit">ยึดชิ้นส่วน</button></div><p>งานนี้ใช้เวลา วัสดุ และแรงงานในโลกเกม</p>`)}
 hitField(){if(!this.fieldGame)return;if(this.fieldGame.pos>=.42&&this.fieldGame.pos<=.60){this.fieldGame.hits++;const s=this.q('[data-ui="fieldStatus"]');if(s)s.textContent=`ความคืบหน้า ${this.fieldGame.hits} / 3`;if(this.fieldGame.hits>=3)this.finishBuild()}else{this.fieldGame.hits=Math.max(0,this.fieldGame.hits-1);const s=this.q('[data-ui="fieldStatus"]');if(s)s.textContent=`จังหวะคลาดเคลื่อน • ความคืบหน้า ${this.fieldGame.hits} / 3`}}
 finishBuild(){const b={...this.pendingBuild,active:false};const store=ITEMS[b.id].large?this.state.cargo:this.state.inventory;store[b.id]--;this.state.builds.push(b);this.state.timeMinutes+=15;this.state.xp+=12;const o=this.createBuildObject(b.id,b.x,b.z);this.scene.add(o);this.buildMeshes.push({object:o,...b});if(b.id==='pump')this.addInteractable(o,'pump','เปิดเครื่องสูบน้ำ','E',()=>this.togglePump(b,o));this.fieldGame=null;this.pendingBuild=null;this.closeModal();this.save();this.refreshUI();this.toast(`ติดตั้ง ${ITEMS[b.id].name} สำเร็จ +12 XP`)}
 togglePump(b){if(this.state.dynamic.pumpFailure&&!this.state.dynamic.pumpFixed){if(!this.state.inventory.toolkit){this.toast('ต้องมีชุดเครื่องมือซ่อม');return}this.state.dynamic.pumpFixed=true;this.state.xp+=15;this.addTrust(6);this.note('ซ่อมเครื่องสูบน้ำระหว่างเหตุฉุกเฉินสำเร็จ');this.toast('ซ่อมเครื่องสูบน้ำสำเร็จ +15 XP')}b.active=!b.active;this.save();this.refreshUI();this.toast(b.active?'เปิดเครื่องสูบน้ำแล้ว':'ปิดเครื่องสูบน้ำแล้ว')}

 startEvent(){if(this.state.phase==='flood')return;this.state.phase='flood';this.state.eventTime=0;this.rain.material.opacity=.78;this.q('[data-ui="timeline"]').classList.add('show');this.q('[data-ui="weather"]').textContent='ฝนตกหนัก';this.q('[data-ui="weatherIcon"]').textContent='🌧️';this.note('เริ่ม Flood Simulation');this.save();this.refreshUI();this.toast('START EVENT • ผู้เล่นยังเดิน ขับรถ และช่วยชุมชนได้')}
 setSpeed(v){this.eventSpeed=v;this.root.querySelectorAll('[data-speed]').forEach(b=>b.classList.toggle('active',Number(b.dataset.speed)===v))}
 updateFlood(dt){
  this.state.eventTime=clamp(this.state.eventTime+dt*this.eventSpeed*2.1,0,100);const t=this.state.eventTime;const mitigation=this.mitigation();const visual=clamp((t-22)/70,0,1)*(1-mitigation*.0035);this.river.scale.set(1+visual*.18,1+visual*.18,1+visual*.18);this.river.position.y=visual*.65;this.floodPlanes.forEach((p,i)=>{p.material.opacity=clamp(visual*(.58-i*.06),0,.52);p.scale.setScalar(.35+visual*.8)});this.q('[data-ui="eventProgress"]').style.width=`${t}%`;this.q('[data-ui="eventClock"]').textContent=this.eventLabel();this.q('[data-ui="water"]').textContent=t<45?'ระดับน้ำ: เพิ่มขึ้น':t<80?'ระดับน้ำ: ฉุกเฉิน':'ระดับน้ำ: เริ่มลด';
  if(t>34&&!this.state.dynamic.pumpFailure){this.state.dynamic.pumpFailure=true;this.dynamicEvent('เครื่องสูบน้ำขัดข้อง','เครื่องสูบน้ำในพื้นที่ชุมชนหยุดทำงาน ใช้ชุดเครื่องมือซ่อมและกด E ใกล้เครื่องสูบน้ำ')}
  if(t>61&&!this.state.dynamic.schoolRequest){this.state.dynamic.schoolRequest=true;this.dynamicEvent('โรงเรียนขอรถอพยพ','ครูแจ้งว่าน้ำบนถนนกำลังสูงขึ้น ไปที่โรงเรียนและกด E เพื่อช่วยอพยพ')}
  if(t>76&&!this.state.dynamic.roadCut){this.state.dynamic.roadCut=true;this.note('ถนนเลียบแม่น้ำถูกตัด ต้องใช้สะพานด้านเหนือ');this.toast('⚠ ถนนเลียบแม่น้ำถูกตัด • เปลี่ยนเส้นทาง')}
  if(t>=100){this.endEvent();return}const saveBucket=Math.floor(t/5),uiBucket=Math.floor(t*2);if(saveBucket!==this.lastFloodSave){this.lastFloodSave=saveBucket;this.save()}if(uiBucket!==this.lastFloodUI){this.lastFloodUI=uiBucket;this.refreshUI(false)}
 }
 dynamicEvent(title,text){this.save();this.refreshUI();this.modal(`<div class="event-banner"><b>⚠ EMERGENCY QUEST</b><small>เหตุการณ์สัมพันธ์กับสถานการณ์น้ำที่กำลังเพิ่ม</small></div><h2>${title}</h2><p>${text}</p><div class="adv-buttons"><button class="adv-button danger" data-dialog="close">รับภารกิจฉุกเฉิน</button></div>`)}
 endEvent(){this.state.phase='survey';this.rain.material.opacity=.12;this.q('[data-ui="timeline"]').classList.remove('show');this.spawnSurveyPoints();this.note('น้ำเริ่มลด เข้าสู่ DAMAGE SURVEY');this.save();this.refreshUI();this.modal(`<h2>📷 น้ำเริ่มลดแล้ว</h2><p>ภารกิจยังไม่จบ เดินสำรวจโรงเรียน ถนน และพื้นที่เกษตร เก็บหลักฐานลง Field Notebook แล้วจึงดูผลลัพธ์</p><div class="adv-buttons"><button class="adv-button primary" data-dialog="close">เริ่มสำรวจความเสียหาย</button></div>`)}
 spawnSurveyPoints(){if(this.surveySpawned)return;this.surveySpawned=true;const points=[['school','โรงเรียน',34,-11],['road','ถนนเลียบแม่น้ำ',2,-2],['farm','พื้นที่เกษตร',-22,35]];for(const [id,name,x,z] of points){const marker=cyl(.7,2.5,0xf0a326,x,1.25,z);marker.visible=!this.state.survey.includes(id);this.scene.add(marker);this.addTextSprite(`📷 สำรวจ ${name}`,x,4,z,11);const entry={object:marker,type:'survey',prompt:`บันทึกความเสียหาย: ${name}`,key:'E',action:()=>this.collectSurvey(id,name,marker)};this.interactables.push(entry);this.surveyMarkers.push({marker,entry})}}
 collectSurvey(id,name,marker){if(this.state.survey.includes(id)){this.toast('เก็บข้อมูลจุดนี้แล้ว');return}this.state.survey.push(id);marker.visible=false;this.state.xp+=8;this.note(`สำรวจความเสียหาย: ${name}`);this.save();this.refreshUI();this.toast(`บันทึก ${name} ลง Field Notebook`);if(this.state.survey.length>=3)this.showResult()}
 showResult(){const mitigation=this.mitigation(),emergency=(this.state.dynamic.pumpFixed?12:0)+(this.state.dynamic.schoolEvacuated?16:0),trust=this.state.trust;const risk=clamp(Math.round(78-mitigation-emergency-trust*.12),12,92),safety=clamp(Math.round(42+mitigation*.7+emergency+trust*.25),15,96);const result={risk,safety,school:this.state.dynamic.schoolEvacuated?92:55,road:Math.max(20,100-risk),environment:clamp(55+this.state.builds.filter(b=>['forest','retention','checkdam'].includes(b.id)).length*9,20,95),budget:this.state.budget,trust:this.state.trust,xp:this.state.xp,survey:[...this.state.survey],notebook:[...this.state.notebook],pumpFixed:this.state.dynamic.pumpFixed,schoolEvacuated:this.state.dynamic.schoolEvacuated,actions:this.state.builds.map(b=>({id:b.id,place:'ชุมชนริมแม่น้ำน่าน',lat:18.787+b.z*.0003,lng:100.776+b.x*.0003})),modelVersion:'adventure-prototype-v1'};this.state.result=result;this.state.phase='complete';this.save();this.refreshUI();this.modal(`<span class="simulation-tag">ผลจากแบบจำลองเพื่อการเรียนรู้</span><h2>ภารกิจชุมชนริมแม่น้ำน่านสำเร็จ</h2><p>ผลนี้คำนวณจากพื้นที่ที่สำรวจ ตำแหน่งมาตรการ ลำดับการทำงาน งบ เวลา และการตอบสนองเหตุฉุกเฉิน ไม่ใช่ผลทางวิศวกรรมของเหตุการณ์จริง</p><div class="result-grid"><div class="result-card"><b>${100-risk}%</b><small>การลดความเสี่ยงในเกม</small></div><div class="result-card"><b>${safety}%</b><small>ความปลอดภัยชุมชน</small></div><div class="result-card"><b>${this.state.trust}</b><small>Community Trust</small></div><div class="result-card"><b>${this.state.xp} XP</b><small>สำรวจและลงมือทำ</small></div><div class="result-card"><b>${this.state.builds.length}</b><small>มาตรการที่ติดตั้ง</small></div><div class="result-card"><b>${this.state.budget}</b><small>งบเกมคงเหลือ</small></div></div><div class="adv-buttons"><button class="adv-button" data-dialog="notebook">เปิด Field Notebook</button><button class="adv-button" data-dialog="replay">ปรับแผนแล้วลองใหม่</button><button class="adv-button green" data-dialog="complete">ไปหน้ารายงานการเรียนรู้</button></div>`)}
 mitigation(){const weights={sandbag:7,pump:11,warning:8,checkdam:9,retention:12,forest:8};return this.state.builds.reduce((n,b)=>n+(weights[b.id]||0)+(b.id==='pump'&&b.active?4:0),0)}
 eventLabel(){const t=this.state.eventTime;return t<33?`T-${Math.max(1,Math.round(24-t*.36))}`:t<66?`T${Math.round((t-33)*.18)}`:`T+${Math.round(6+(t-66)*.18)}`}

 refreshUI(full=true){
  this.state.level=1+Math.floor(this.state.xp/50);this.q('[data-ui="budget"]').textContent=this.state.budget;this.q('[data-ui="level"]').textContent=this.state.level;this.q('[data-ui="trust"]').textContent=this.state.trust;this.q('[data-ui="trustBar"]').style.width=`${this.state.trust}%`;
  for(const id of Object.keys(ITEMS)){const n=(ITEMS[id].large?this.state.cargo[id]:this.state.inventory[id])||0;this.root.querySelectorAll(`[data-count="${id}"]`).forEach(e=>e.textContent=`มี ${n}`);this.root.querySelectorAll(`[data-quick-count="${id}"]`).forEach(e=>e.textContent=n)}
  if(!full)return;const quests=this.questData();this.q('[data-ui="quests"]').innerHTML=quests.map(q=>`<div class="adv-quest ${q.done?'done':q.active?'active':''}"><span class="adv-quest-icon">${q.done?'✓':q.icon}</span><span><b>${q.title}</b><small>${q.text}</small></span></div>`).join('');
  const ids=this.state.builds.map(b=>b.id),canStart=this.state.checkedStation&&ids.includes('sandbag')&&ids.includes('pump')&&this.state.phase==='prepare';this.q('[data-ui="startEvent"]').innerHTML=this.state.phase==='complete'?`<button class="adv-button green" data-act="showResult" style="width:100%;margin-top:8px">🏆 ดูผลภารกิจ</button>`:canStart?`<button class="adv-button primary" data-act="startEvent" style="width:100%;margin-top:8px">▶ START EVENT</button>`:'';
 }
 questData(){
  if(this.state.phase==='complete')return[{icon:'🏆',title:'ภารกิจสำเร็จ',text:'เปิดรายงานหรือปรับแผนเพื่อเล่นใหม่',done:true,active:true}];
  if(this.state.phase==='survey')return[{icon:'📷',title:'สำรวจความเสียหาย',text:`โรงเรียน ถนน พื้นที่เกษตร ${this.state.survey.length}/3`,done:this.state.survey.length>=3,active:true}];
  if(this.state.phase==='flood'){const q=[{icon:'🌊',title:'รับมือขณะน้ำเพิ่ม',text:'เดิน ขับรถ เปิดเครื่องสูบน้ำ และช่วย NPC',active:true}];if(this.state.dynamic.pumpFailure)q.push({icon:'🔧',title:'ซ่อมเครื่องสูบน้ำ',text:this.state.dynamic.pumpFixed?'ซ่อมแล้ว':'ใช้ Toolkit ใกล้เครื่องสูบน้ำ',done:this.state.dynamic.pumpFixed,active:!this.state.dynamic.pumpFixed});if(this.state.dynamic.schoolRequest)q.push({icon:'🏫',title:'อพยพโรงเรียน',text:this.state.dynamic.schoolEvacuated?'อพยพแล้ว':'ไปพบครูที่โรงเรียน',done:this.state.dynamic.schoolEvacuated,active:!this.state.dynamic.schoolEvacuated});return q}
  const ids=this.state.builds.map(b=>b.id),coreReady=ids.includes('sandbag')&&ids.includes('pump');return[{icon:'📡',title:'ตรวจสถานีวัดน้ำ',text:'เดินหรือขับรถไปตรวจข้อมูล',done:this.state.checkedStation,active:!this.state.checkedStation},{icon:'🧰',title:'เตรียมอุปกรณ์',text:'ไปศูนย์อุปกรณ์และเลือกทรัพยากร',done:this.state.visitedEquipment,active:this.state.checkedStation&&!this.state.visitedEquipment},{icon:'🔨',title:'วางกระสอบทรายและเครื่องสูบน้ำ',text:`กระสอบทราย ${ids.includes('sandbag')?'✓':'○'} • เครื่องสูบน้ำ ${ids.includes('pump')?'✓':'○'}`,done:coreReady,active:this.state.visitedEquipment&&!coreReady},{icon:'▶',title:'เริ่มเหตุการณ์น้ำหลาก',text:'กด START EVENT เมื่อพร้อม',done:false,active:this.state.checkedStation&&coreReady}]
 }

 doAction(act){if(act==='exit')this.exit();else if(act==='reset')this.options.onReset?.();else if(act==='inventory')this.openInventory();else if(act==='map')this.openMap();else if(act==='build')this.toggleBuild();else if(act==='buildExit')this.toggleBuild(false);else if(act==='interact')this.nearestPickup?this.pickup():this.interact();else if(act==='startEvent')this.startEvent();else if(act==='showResult')this.showResult()}
 handleDialog(action){if(action==='close'||action==='stationDone')this.closeModal();else if(action==='fieldHit')this.hitField();else if(action==='notebook')this.openNotebook();else if(action==='complete')this.complete();else if(action==='replay')this.replay()}
 selectQuick(i){this.root.querySelectorAll('[data-quick]').forEach((b,n)=>b.classList.toggle('active',n===i));const ids=['radio','toolkit','sandbag','firstaid'];this.toast(`เลือก ${ITEMS[ids[i]].name}`)}
 openNotebook(){const notes=this.state.notebook.map(n=>`<div class="survey-entry"><span>${n.text}</span><small>${n.time}</small></div>`).join('');this.modal(`<h2>📓 Field Notebook</h2><p>หลักฐานเกิดจากสิ่งที่ผู้เล่นตรวจ พบ และลงมือทำในโลกเกม</p><div class="survey-list">${notes||'<p>ยังไม่มีบันทึก</p>'}</div><div class="adv-buttons"><button class="adv-button" data-dialog="close">ปิดสมุด</button></div>`)}
 replay(){this.state.phase='prepare';this.state.eventTime=0;this.state.dynamic={pumpFailure:false,pumpFixed:false,schoolRequest:false,schoolEvacuated:false,roadCut:false};this.state.survey=[];this.state.result=null;this.state.timeMinutes=0;this.lastFloodSave=-1;this.lastFloodUI=-1;this.rain.material.opacity=0;this.floodPlanes.forEach(p=>p.material.opacity=0);this.river.position.y=0;this.river.scale.setScalar(1);for(const s of this.surveyMarkers){this.scene.remove(s.marker);this.interactables=this.interactables.filter(i=>i!==s.entry)}this.surveyMarkers=[];this.surveySpawned=false;this.closeModal();this.save();this.refreshUI();this.toast('เริ่มรอบใหม่ โดยคงอุปกรณ์และมาตรการเดิมไว้')}
 complete(){const result=this.state.result;this.closeModal();this.options.onComplete?.(result)}
 exit(){this.options.onExit?.()}
 escapeAction(){if(this.q('[data-ui="modal"]').classList.contains('open'))this.closeModal();else if(this.buildMode)this.toggleBuild(false);else this.modal(`<h2>หยุดเกมชั่วคราว</h2><p>ความคืบหน้าบันทึกไว้ในอุปกรณ์นี้แล้ว</p><div class="adv-buttons"><button class="adv-button" data-dialog="close">เล่นต่อ</button><button class="adv-button" data-act="exit">กลับหน้าหลัก</button><button class="adv-button danger" data-act="reset">เริ่มโลกเกมใหม่</button></div>`)}
 modal(html){this.q('[data-ui="modalBody"]').innerHTML=`<button class="adv-modal-close" data-dialog="close">×</button>${html}`;this.q('[data-ui="modal"]').classList.add('open')}
 closeModal(){this.q('[data-ui="modal"]').classList.remove('open');if(this.fieldGame&&this.fieldGame.hits<3){this.fieldGame=null;this.pendingBuild=null}}
 toast(text){let t=this.root.querySelector('.adv-toast');if(!t){t=document.createElement('div');t.className='adv-context show adv-toast';t.style.bottom='92px';this.root.append(t)}t.innerHTML=`<span>${text}</span>`;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.remove(),2500)}
 note(text){this.state.notebook.push({text,time:this.q('[data-ui="time"]')?.textContent||'08:00'});this.state.notebook=this.state.notebook.slice(-30)}
 addTrust(n){this.state.trust=clamp(this.state.trust+n,0,100)}
 unique(a){return [...new Set(a)]}
 q(s){return this.root.querySelector(s)}
 escape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

 destroy(){this.running=false;cancelAnimationFrame(this.raf);removeEventListener('keydown',this.onKeyDown);removeEventListener('keyup',this.onKeyUp);removeEventListener('resize',this.onResize);this.renderer?.dispose();this.host.innerHTML=''}
}

window.NanAdventure={
 instance:null,
 mount(host,options){this.unmount();this.instance=new NanAdventureGame(host,options);return this.instance},
 unmount(){if(this.instance){this.instance.destroy();this.instance=null}}
};
