/* Five authored, articulated character models. Geometry is inspired by the supplied
   concept renders; this is not an automatic image-to-3D reconstruction. */
(function(global){
 'use strict';
 const T=global.THREE;
 const roles=[
  {id:'engineer',name:'วิศวกรน้อย',shirt:0xe9852e,pants:0x253b50,pack:0x344649,hat:null,tool:'tablet',action:'อ่านแบบและแท็บเล็ต'},
  {id:'scientist',name:'นักวิทยาศาสตร์น้อย',shirt:0x3b78af,pants:0x273d54,pack:0x344452,hat:null,girl:true,tool:'sample',action:'ตรวจตัวอย่างน้ำ'},
  {id:'geographer',name:'นักภูมิศาสตร์น้อย',shirt:0xc7b896,pants:0x6d7455,pack:0x495e43,hat:'field',tool:'map',action:'อ่านแผนที่'},
  {id:'conservationist',name:'นักอนุรักษ์น้อย',shirt:0x4e6646,pants:0xa1936d,pack:0x465b43,hat:'field',girl:true,tool:'binoculars',action:'สำรวจธรรมชาติ'},
  {id:'rescue',name:'ทีมกู้ภัยน้อย',shirt:0x263e60,pants:0x233b58,pack:0x30485c,hat:'cap',tool:'radio',action:'ใช้วิทยุสื่อสาร'}
 ];
 const materials=new Map(),sphere=new T.SphereGeometry(1,24,16);
 function material(color,metal=false){const key=color+':'+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.34:.79,metalness:metal?.35:0}));return materials.get(key)}
 function mesh(parent,geometry,color,pos=[0,0,0],scale=null,metal=false){const o=new T.Mesh(geometry,material(color,metal));o.position.fromArray(pos);if(scale)o.scale.fromArray(scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 function oval(parent,color,pos,scale){return mesh(parent,sphere,color,pos,scale)}
 function round(parent,w,h,d,color,pos,r=.08){
  const s=new T.Shape(),x=-w/2,y=-h/2,k=Math.min(r,w*.4,h*.4);
  s.moveTo(x+k,y);s.lineTo(x+w-k,y);s.quadraticCurveTo(x+w,y,x+w,y+k);s.lineTo(x+w,y+h-k);s.quadraticCurveTo(x+w,y+h,x+w-k,y+h);s.lineTo(x+k,y+h);s.quadraticCurveTo(x,y+h,x,y+h-k);s.lineTo(x,y+k);s.quadraticCurveTo(x,y,x+k,y);
  const g=new T.ExtrudeGeometry(s,{depth:Math.max(.005,d-.04),bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:2,steps:1,curveSegments:6});g.translate(0,0,-d/2+.02);return mesh(parent,g,color,pos);
 }
 function tube(parent,r,len,color,pos){return mesh(parent,new T.CapsuleGeometry(r,len,6,16),color,pos)}
 function cylinder(parent,r,len,color,pos){return mesh(parent,new T.CylinderGeometry(r,r,len,20),color,pos)}
 function line(parent,points,r,color){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,6,false),color)}
 function joint(parent,name,pos,nodes){const b=new T.Bone();b.name=name;b.position.fromArray(pos);parent.add(b);nodes[name]=b;return b}
 function clips(nodes,role){
  const make=(name,duration)=>{
   const times=[],samples={},ys=[];for(const key of Object.keys(nodes))samples[key]=[];
   for(let i=0;i<=48;i++){
    const time=duration*i/48,p=2*Math.PI*i/48,s=Math.sin(p),c=Math.cos(p);times.push(time);
    const r={Hips:[0,0,0],Spine:[0,0,0],Head:[0,0,0],LeftShoulder:[0,0,-.10],RightShoulder:[0,0,.10],LeftElbow:[-.08,0,0],RightElbow:[-.08,0,0],LeftHip:[0,0,0],RightHip:[0,0,0],LeftKnee:[0,0,0],RightKnee:[0,0,0],LeftAnkle:[0,0,0],RightAnkle:[0,0,0]};let y=1.45;
    if(name==='idle'){y+=.008*s;r.Spine=[.018*s,.015*s,.012*c];r.Head=[.015*c,.035*s,0];r.LeftShoulder[0]=.025*s;r.RightShoulder[0]=-.025*s;}
    if(name==='walk'||name==='run'){
     const run=name==='run',swing=run?.85:.52;y+=(run?.07:.025)*(1-Math.cos(p*2));r.Spine=[run?.11:.03,0,.045*s];
     r.LeftHip=[s*swing,0,0];r.RightHip=[-s*swing,0,0];r.LeftKnee=[Math.max(0,-s)*(run?1.15:.65),0,0];r.RightKnee=[Math.max(0,s)*(run?1.15:.65),0,0];
     r.LeftAnkle=[-.15*s,0,0];r.RightAnkle=[.15*s,0,0];r.LeftShoulder=[-s*swing*.75,0,-.12];r.RightShoulder=[s*swing*.75,0,.12];r.LeftElbow=[run?-.9:-.20,0,0];r.RightElbow=[run?-.9:-.20,0,0];
    }
    if(name==='wave'){r.RightShoulder=[-.15,0,2.25+.12*s];r.RightElbow=[-.35,0,.4*s];r.Head=[0,.08*s,-.04];r.Spine=[0,0,-.04];}
    if(name==='action'){
     r.RightShoulder=[-1.1+.04*s,0,.12];r.RightElbow=[-.75+.04*s,0,0];r.Head=[.15,.04*s,0];
     if(role.tool==='map'||role.tool==='tablet'||role.tool==='binoculars'){r.LeftShoulder=[-1.05,0,-.10];r.LeftElbow=[-.7,0,0];}
     if(role.tool==='binoculars'){r.LeftShoulder[0]=r.RightShoulder[0]=-1.55;r.LeftElbow[0]=r.RightElbow[0]=-.95;r.Head[0]=-.04;}
     if(role.tool==='radio'){r.RightShoulder[0]=-1.5;r.RightElbow[0]=-1.1;r.Head[1]=.07;}
     if(role.id==='engineer'){r.LeftShoulder=[-.75,0,.62];r.LeftElbow=[-1.05,0,0];r.RightShoulder=[-.75+.025*s,0,-.27];r.RightElbow=[-1.02+.025*s,0,0];r.Head=[.23,.025*s,0];}
    }
    ys.push(0,y,0);
    for(const [key,node] of Object.entries(nodes)){const q=new T.Quaternion().setFromEuler(new T.Euler(...(r[key]||[0,0,0])));samples[key].push(q.x,q.y,q.z,q.w);}
   }
   const tracks=Object.entries(samples).map(([key,values])=>new T.QuaternionKeyframeTrack(key+'.quaternion',times,values));tracks.push(new T.VectorKeyframeTrack('Hips.position',times,ys));return new T.AnimationClip(name,duration,tracks);
  };
  return [make('idle',3),make('walk',.95),make('run',.62),make('wave',2),make('action',2.4)];
 }

 function createEngineer({animate=true}={}){
  const role=roles[0],g=new T.Group(),nodes={},skin=0xe5b18b,hair=0x30251f;
  g.name='Nan_engineer';g.userData={role:'engineer',authoring:'Skinned engineer revision 2',legs:[],arms:[]};
  const hips=joint(g,'Hips',[0,1.45,0],nodes),spine=joint(hips,'Spine',[0,0,0],nodes);
  const profile=[[.25,-.08],[.32,.05],[.34,.40],[.40,.86],[.37,1.02],[.19,1.16]].map(v=>new T.Vector2(...v));
  mesh(spine,new T.LatheGeometry(profile,40),role.shirt,[0,0,0],[1,1,.78]);
  oval(hips,role.pants,[0,-.07,0],[.34,.24,.26]);round(spine,.63,.075,.43,0x353b3c,[0,0,.025],.025);round(spine,.10,.07,.025,0xb9b4a2,[0,0,.26],.01);
  cylinder(spine,.12,.23,skin,[0,1.15,0]);
  const head=joint(spine,'Head',[0,1.40,0],nodes);
  const face=new T.SphereGeometry(1,48,32),pos=face.attributes.position;
  for(let i=0;i<pos.count;i++){const y=pos.getY(i),jaw=y<-.18?1-(-y-.18)*.24:1;pos.setXYZ(i,pos.getX(i)*.40*jaw,y*.49+.13,pos.getZ(i)*.35*(y<-.1?.96:1));}face.computeVertexNormals();mesh(head,face,skin);
  for(const side of [-1,1]){
   oval(head,skin,[side*.386,.12,-.012],[.078,.108,.055]);oval(head,0xca9176,[side*.420,.12,.018],[.024,.054,.025]);
   oval(head,0xfff8e8,[side*.15,.19,.311],[.088,.106,.028]);oval(head,0x6d492d,[side*.15,.184,.337],[.048,.070,.016]);oval(head,0x221d1b,[side*.15,.184,.351],[.026,.046,.009]);oval(head,0xfffaf2,[side*.139,.208,.36],[.012,.015,.005]);
   line(head,[[side*.08,.338,.30],[side*.15,.35,.318],[side*.225,.328,.29]],.017,hair);
  }
  oval(head,0xdfa280,[0,.074,.339],[.046,.065,.063]);line(head,[[-.087,-.064,.314],[0,-.080,.337],[.087,-.058,.313]],.010,0x965f4f);
  // A fitted scalp with a varying hairline, plus tapered directional locks.
  const hp=[],hi=[],hu=[],rings=18,sectors=48;
  for(let j=0;j<=rings;j++)for(let i=0;i<=sectors;i++){
   const phi=i/sectors*Math.PI*2,front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi)),theta=j/rings*(1.60-.48*front+.30*back);
   hp.push(-Math.cos(phi)*Math.sin(theta)*.418,.13+Math.cos(theta)*.515,Math.sin(phi)*Math.sin(theta)*.368);hu.push(i/sectors,j/rings);
   if(j<rings&&i<sectors){const a=j*(sectors+1)+i,b=a+sectors+1;hi.push(a,b,a+1,b,b+1,a+1);}
  }
  const scalp=new T.BufferGeometry();scalp.setAttribute('position',new T.Float32BufferAttribute(hp,3));scalp.setAttribute('uv',new T.Float32BufferAttribute(hu,2));scalp.setIndex(hi);scalp.computeVertexNormals();mesh(head,scalp,hair);
  function lock(points,width,color){
   const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),v=[],idx=[],uv=[];
   for(let j=0;j<=18;j++){const t=j/18,c=curve.getPoint(t),tangent=curve.getTangent(t),normal=new T.Vector3(0,0,1).cross(tangent).normalize(),depth=tangent.clone().cross(normal).normalize(),r=width*Math.pow(Math.sin(Math.PI*Math.max(.02,Math.min(.98,t))),.55);
    for(let i=0;i<=8;i++){const a=i/8*Math.PI*2,p=c.clone().addScaledVector(normal,Math.cos(a)*r).addScaledVector(depth,Math.sin(a)*r*.40);v.push(...p.toArray());uv.push(i/8,t);if(j<18&&i<8){const n=j*9+i;idx.push(n,n+9,n+1,n+9,n+10,n+1);}}
   }const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();mesh(head,geo,color);
  }
  for(let i=0;i<9;i++){
   const points=[],phi=.62+i*.19;
   for(let j=0;j<=8;j++){const theta=.20+j*.108,angle=phi-.12*(1-j/8);points.push([-Math.cos(angle)*Math.sin(theta)*.424,.13+Math.cos(theta)*.521,Math.sin(angle)*Math.sin(theta)*.374]);}
   line(head,points,.005,i%2?0x46342a:0x211a17);
  }
  lock([[-.24,.47,.19],[-.15,.49,.30],[-.015,.40,.355],[.075,.31,.351]],.031,0x382920);
  lock([[-.12,.55,.18],[-.02,.52,.30],[.13,.40,.354],[.20,.32,.321]],.029,hair);
  for(const side of [-1,1])lock([[side*.24,.52,-.17],[side*.36,.40,-.09],[side*.38,.20,.02],[side*.35,.07,.02]],.047,hair);
  const wrists={},skinned=[];
  function limb(parent,child,length,radii,materials,split=.58){
   const vertices=[],uv=[],indices=[],skinIndex=[],weights=[],radial=20,count=36;
   for(let j=0;j<=count;j++){const t=j/count,y=-length*t,k=t*(radii.length-1),a=Math.min(radii.length-2,Math.floor(k)),f=k-a,r=T.MathUtils.lerp(radii[a],radii[a+1],f),blend=T.MathUtils.smoothstep(t,split-.14,split+.14);
    for(let i=0;i<=radial;i++){const p=i/radial*Math.PI*2;vertices.push(Math.cos(p)*r,y,Math.sin(p)*r*.88);uv.push(i/radial,t);skinIndex.push(0,1,0,0);weights.push(1-blend,blend,0,0);if(j<count&&i<radial){const n=j*(radial+1)+i;indices.push(n,n+1,n+radial+1,n+1,n+radial+2,n+radial+1);}}
   }
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geo.setIndex(indices);geo.computeVertexNormals();
   const splitIndex=Math.round(count*.61)*radial*6;if(materials.length===1)geo.addGroup(0,indices.length,0);else{geo.addGroup(0,splitIndex,0);geo.addGroup(splitIndex,indices.length-splitIndex,1);}
   const m=new T.SkinnedMesh(geo,materials.map(c=>material(c)));m.castShadow=true;m.receiveShadow=true;parent.add(m);skinned.push([m,parent,child]);
  }
  for(const [side,name] of [[-1,'Left'],[1,'Right']]){
   const shoulder=joint(spine,name+'Shoulder',[side*.40,.97,0],nodes),elbow=joint(shoulder,name+'Elbow',[0,-.51,0],nodes);
   oval(shoulder,role.shirt,[0,-.035,0],[.147,.16,.130]);
   limb(shoulder,elbow,.98,[.12,.16,.145,.118,.123,.108,.078],[role.shirt,skin],.51/.98);
   const cuff=cylinder(elbow,.132,.095,0xd46e26,[0,-.066,0]);
   const hand=new T.Group();hand.name=name+'Hand';hand.position.set(0,-.48,0);elbow.add(hand);wrists[name]=hand;
   oval(hand,skin,[0,-.064,.015],[.080,.115,.065]);oval(hand,skin,[-side*.072,-.056,.047],[.037,.067,.032]);
   for(let f=0;f<4;f++){const finger=tube(hand,.018,.067-f*.004,skin,[-.053+f*.034,-.145,.029]);finger.rotation.x=-.15;}
   const thigh=joint(hips,name+'Hip',[side*.19,-.08,0],nodes),knee=joint(thigh,name+'Knee',[0,-.59,0],nodes);
   limb(thigh,knee,1.16,[.163,.174,.157,.131,.135,.118,.105],[role.pants],.59/1.16);
   round(thigh,.19,.22,.042,0x2e4355,[side*.085,-.26,.132],.02);
   const ankle=joint(knee,name+'Ankle',[0,-.57,0],nodes);
   oval(ankle,0x55463b,[0,-.025,.065],[.13,.135,.23]);oval(ankle,0x323c40,[0,-.117,.076],[.145,.043,.248]);oval(ankle,0x3d403c,[0,-.063,.22],[.128,.08,.102]);
   for(let l=0;l<4;l++)line(ankle,[[-.075,.020-l*.019,.13+l*.015],[.075,.020-l*.019,.13+l*.015]],.008,0xb39970);
  }
  // Close-fitting vest rather than two thick chest slabs.
  for(const side of [-1,1]){
   round(spine,.255,.77,.065,0xe4812c,[side*.166,.52,.273],.035);round(spine,.255,.055,.018,0xd7dccf,[side*.166,.74,.321],.006);round(spine,.255,.055,.018,0xd7dccf,[side*.166,.28,.321],.006);
   round(spine,.195,.17,.033,0xbd6224,[side*.166,.46,.323],.025);line(spine,[[side*.08,.57,.345],[side*.25,.57,.345]],.006,0xf0ad66);
   line(spine,[[side*.25,.14,.28],[side*.30,.55,.29],[side*.31,.96,.16],[side*.29,1.02,-.17],[side*.27,.74,-.32]],.032,0x374349);
   round(spine,.085,.055,.025,0xabb0a3,[side*.30,.70,.331],.008);
  }
  round(spine,.035,.70,.021,0x424747,[0,.52,.325],.007);
  round(spine,.56,.74,.29,0x354647,[0,.55,-.39],.10);round(spine,.43,.32,.10,0x435052,[0,.30,-.57],.06);
  line(spine,[[-.19,.46,-.631],[0,.47,-.637],[.19,.46,-.631]],.009,0x9caa9c);
  cylinder(spine,.067,.32,0x758b8d,[.34,.37,-.35]);cylinder(spine,.049,.055,0x344e53,[.34,.56,-.35]);
  const tape=cylinder(spine,.080,.045,0xeab845,[-.34,-.015,.19]);tape.rotation.x=Math.PI/2;
  const tool=new T.Group();tool.name='RoleTool';wrists.Right.add(tool);tool.position.set(-.035,-.045,.071);tool.rotation.x=-.18;
  round(tool,.29,.40,.045,0x283d47,[0,-.07,.027],.025);round(tool,.235,.315,.009,0x79aebb,[0,-.055,.056],.008);
  for(let i=0;i<4;i++)round(tool,.16-i*.015,.009,.008,0xe2eee1,[0,.045-i*.045,.068],.003);
  g.updateMatrixWorld(true);
  for(const [m,a,b] of skinned){const skeleton=new T.Skeleton([a,b]);m.bind(skeleton,m.matrixWorld);}
  g.animations=clips(nodes,role);
  if(animate){const mixer=new T.AnimationMixer(g),actions=Object.fromEntries(g.animations.map(c=>[c.name,mixer.clipAction(c)]));let current;
   Object.defineProperty(g,'characterAnimator',{value:{mixer,update(dt,name='idle'){const next=actions[name]||actions.idle;if(next!==current){next.reset().fadeIn(.18).play();current?.fadeOut(.18);current=next;}mixer.update(Math.min(dt,.08));},stop(){mixer.stopAllAction();mixer.uncacheRoot(g);}}});g.characterAnimator.update(0);
  }
  return g;
 }

 function create(index=0,{animate=true}={}){
  if(Number(index)===0)return createEngineer({animate});
  const role=roles[Math.max(0,Math.min(4,Number(index)||0))],g=new T.Group(),nodes={},skin=0xe6ae88,hair=0x30241f;
  g.name='Nan_'+role.id;g.userData={role:role.id,authoring:'Articulated concept model',legs:[],arms:[]};
  const hips=joint(g,'Hips',[0,1.45,0],nodes),spine=joint(hips,'Spine',[0,0,0],nodes);
  const profile=[[.27,0],[.36,.12],[.40,.48],[.49,.9],[.44,1.14],[.24,1.28]].map(p=>new T.Vector2(...p));
  const torso=mesh(spine,new T.LatheGeometry(profile,28),role.shirt);torso.scale.z=.78;
  oval(spine,role.pants,[0,.02,0],[.39,.19,.29]);round(spine,.73,.10,.52,0x303c41,[0,.06,0],.04);round(spine,.11,.08,.04,0xb4b6a7,[0,.06,.29],.025);
  cylinder(spine,.145,.25,skin,[0,1.31,0]);
  for(const side of [-1,1]){
   const collar=round(spine,.17,.23,.07,role.shirt,[side*.14,1.15,.28],.03);collar.rotation.z=side*.37;
   for(let i=0;i<4;i++)oval(spine,0xe7dbbc,[side*.025,.24+i*.22,.33],[.018,.018,.013]);
  }
  const head=joint(spine,'Head',[0,1.57,0],nodes);oval(head,skin,[0,.15,0],[.48,.58,.44]);
  mesh(head,new T.SphereGeometry(.505,28,18,0,Math.PI*2,0,Math.PI*.56),hair,[0,.33,-.025]);
  for(let i=0;i<8;i++){const tuft=oval(head,hair,[(i-3.5)*.105,.57-Math.abs(i-2)*.018,.22],[.13,.19,.14]);tuft.rotation.z=(i-3)*.18;}
  for(const side of [-1,1]){
   oval(head,skin,[side*.46,.15,0],[.10,.135,.07]);oval(head,0xc9876c,[side*.497,.15,.012],[.027,.07,.042]);
   oval(head,0xfff9ee,[side*.18,.22,.397],[.12,.145,.047]);oval(head,0x69482c,[side*.18,.21,.439],[.066,.091,.026]);oval(head,0x201d1c,[side*.18,.21,.462],[.034,.060,.015]);oval(head,0xffffff,[side*.163,.25,.476],[.020,.028,.011]);
   const brow=round(head,.19,.043,.04,hair,[side*.18,.414,.40],.02);brow.rotation.z=-side*.10;
   oval(head,0xe0a084,[side*.25,-.005,.365],[.075,.042,.015]);
  }
  oval(head,0xd99a79,[0,.10,.43],[.069,.09,.105]);line(head,[[-.105,-.07,.414],[0,-.10,.442],[.105,-.07,.414]],.015,0x935b4a);
  if(role.girl){
   oval(head,hair,[.05,.37,-.48],[.21,.24,.20]);for(let i=0;i<6;i++){const lock=oval(head,hair,[.08+Math.sin(i*.7)*.09,.17-i*.15,-.56+i*.025],[.19-i*.015,.19,.15]);lock.rotation.x=-.2;}oval(head,0x35534a,[.04,.32,-.50],[.22,.05,.20]);
  }
  if(role.hat==='field'){
   const shade=role.girl?0x687557:0xa79973;mesh(head,new T.SphereGeometry(.545,28,16,0,Math.PI*2,0,Math.PI*.48),shade,[0,.62,-.01]).scale.y=.55;oval(head,shade,[0,.58,.035],[.77,.057,.65]);
   const band=cylinder(head,.55,.085,0x514c36,[0,.62,0]);line(head,[[-.52,.55,0],[-.43,-.1,.02],[0,-.25,.13],[.43,-.1,.02],[.52,.55,0]],.015,0x817451);
  }
  if(role.hat==='cap'){
   mesh(head,new T.SphereGeometry(.535,26,16,0,Math.PI*2,0,Math.PI*.51),0x24517e,[0,.62,-.02]).scale.y=.62;oval(head,0x285b8d,[0,.58,.34],[.52,.04,.45]);oval(head,0xf1be63,[0,.79,.425],[.105,.10,.025]);
  }
  if(role.id==='scientist'){
   for(const side of [-1,1]){
    const lens=round(head,.32,.30,.025,0xc2e0e9,[side*.18,.22,.486],.07);lens.material=new T.MeshPhysicalMaterial({color:0xe3f1ef,transparent:true,opacity:.21,roughness:.16,metalness:0,depthWrite:false});
    const rim=mesh(head,new T.TorusGeometry(.155,.017,6,28),0xc9d9df,[side*.18,.22,.50]);rim.scale.set(1,.9,1);
   }line(head,[[-.44,.27,.23],[-.35,.28,.48],[0,.27,.52],[.35,.28,.48],[.44,.27,.23]],.014,0xabbfc7);
  }
  const wrists={};
  for(const [side,name] of [[-1,'Left'],[1,'Right']]){
   const sleeve=role.id==='scientist'?0xf0eee2:role.shirt;
   const shoulder=joint(spine,name+'Shoulder',[side*.52,1.0,0],nodes);oval(shoulder,sleeve,[0,-.08,0],[.22,.27,.22]);tube(shoulder,.16,.23,sleeve,[0,-.26,0]);
   const elbow=joint(shoulder,name+'Elbow',[0,-.5,0],nodes);oval(elbow,sleeve,[0,0,0],[.145,.16,.145]);tube(elbow,.13,.24,sleeve,[0,-.23,0]);round(elbow,.24,.07,.23,0x354959,[0,-.4,0],.03);
   const wrist=new T.Group();wrist.name=name+'Hand';wrist.position.set(0,-.45,0);elbow.add(wrist);oval(wrist,skin,[0,-.09,.025],[.125,.17,.12]);oval(wrist,skin,[-side*.11,-.07,.085],[.052,.085,.053]);wrists[name]=wrist;
   for(let finger=0;finger<3;finger++)line(wrist,[[(-.065+finger*.06),-.15,.12],[(-.065+finger*.06),-.20,.10]],.008,0xbe8666);
   const thigh=joint(hips,name+'Hip',[side*.23,-.01,0],nodes);tube(thigh,.185,.29,role.pants,[0,-.30,0]);round(thigh,.20,.22,.07,role.pants,[side*.10,-.32,.135],.03);
   const knee=joint(thigh,name+'Knee',[0,-.62,0],nodes);oval(knee,role.pants,[0,0,0],[.16,.20,.16]);tube(knee,.16,.28,role.pants,[0,-.30,0]);
   const ankle=joint(knee,name+'Ankle',[0,-.62,0],nodes);oval(ankle,0x344349,[0,-.04,.10],[.20,.15,.32]);oval(ankle,0x1d2c33,[0,-.13,.12],[.215,.075,.34]);
   for(let i=0;i<3;i++)round(ankle,.23,.024,.025,0x9b9377,[0,.045-i*.03,.265],.012);
   if(role.id==='rescue'){
    cylinder(knee,.173,.065,0xe6d85f,[0,-.43,0]);cylinder(knee,.173,.065,0xe6d85f,[0,-.53,0]);cylinder(ankle,.19,.27,0x253335,[0,.055,0]);
   }
  }
  // Backpacks, shoulder straps and pockets are geometry, visible from every angle.
  for(const side of [-1,1]){
   line(spine,[[side*.33,.10,-.15],[side*.37,.62,-.33],[side*.35,1.05,-.22],[side*.32,1.16,.08],[side*.31,.84,.31],[side*.32,.20,.28]],.055,0x344143);
   round(spine,.14,.07,.04,0xb4b8a8,[side*.30,.64,.373],.02);
  }
  round(spine,.72,.86,.42,role.pack,[0,.63,-.44],.13);round(spine,.57,.40,.16,role.pack,[0,.40,-.69],.07);round(spine,.55,.26,.14,role.pack,[0,.87,-.67],.06);
  line(spine,[[-.26,.83,-.765],[0,.85,-.774],[.26,.83,-.765]],.013,0xb3b79a);round(spine,.13,.18,.04,0x697968,[0,.60,-.787],.025);
  cylinder(spine,.085,.42,0x839798,[.46,.43,-.43]);cylinder(spine,.065,.065,0x3d504e,[.46,.68,-.43]);
  if(role.id==='engineer'||role.id==='rescue'){
   for(const side of [-1,1]){
    round(spine,.39,.92,.16,0xe77d24,[side*.20,.66,.31],.07);round(spine,.34,.07,.04,0xe6e3b9,[side*.20,.85,.417],.015);round(spine,.34,.07,.04,0xe6e3b9,[side*.20,.32,.417],.015);
    round(spine,.25,.22,.075,0xc56625,[side*.20,.50,.435],.035);round(spine,.27,.065,.08,0xefad5d,[side*.20,.63,.44],.025);
   }round(spine,.08,.68,.065,0x293c40,[0,.67,.415],.02);
   if(role.id==='rescue')for(const y of [.42,.80]){round(spine,.86,.08,.035,0x25323b,[0,y,.47],.015);round(spine,.16,.13,.055,0x424e52,[0,y,.50],.02);}
   if(role.id==='engineer'){cylinder(spine,.12,.06,0xe9b541,[-.43,.08,.17]).rotation.x=Math.PI/2;round(spine,.21,.25,.12,0x3a474b,[-.43,-.06,.16],.03);}
  }
  if(role.id==='scientist'){
   for(const side of [-1,1]){
    round(spine,.38,1.22,.14,0xf0eee2,[side*.24,.60,.33],.06);round(spine,.23,.25,.08,0xdcded6,[side*.24,.36,.422],.025);
    const lapel=round(spine,.15,.44,.055,0xfaf6e9,[side*.15,1.00,.45],.02);lapel.rotation.z=side*.3;
   }
  }
  if(role.id==='conservationist'){oval(spine,0xc2c695,[-.49,.95,.03],[.024,.11,.10]);line(spine,[[-.52,.89,.12],[-.52,.94,.10],[-.52,1.00,.05]],.009,0x536743);}
  const prop=new T.Group();prop.name='RoleTool';wrists.Right.add(prop);prop.position.set(0,-.13,.11);
  if(role.tool==='tablet'){
   const tablet=round(prop,.43,.59,.065,0x2b3e4b,[0,0,.08],.045);round(prop,.35,.47,.017,0x7eb8c8,[0,.015,.12],.02);for(let i=0;i<3;i++)round(prop,.22-i*.04,.018,.018,0xdef0d7,[0,.14-i*.08,.14],.008);prop.rotation.x=-.30;
  }else if(role.tool==='sample'){
   const vial=cylinder(prop,.075,.29,0x85d5e7,[0,.06,.09]);vial.material=new T.MeshPhysicalMaterial({color:0xbce8e7,roughness:.15,transparent:true,opacity:.75});cylinder(prop,.073,.16,0x3b9bc9,[0,.015,.09]);cylinder(prop,.084,.055,0x347da8,[0,.235,.09]);
  }else if(role.tool==='map'){
   round(prop,.56,.43,.02,0xd6cea2,[-.10,0,.12],.005);for(let i=0;i<6;i++)line(prop,[[-.35,.14-i*.055,.138],[-.15,.17-i*.055,.14],[.03,.10-i*.055,.14],[.13,.12-i*.055,.14]],.005,i%2?0x9ea56d:0x789daa);prop.rotation.x=-.25;
  }else if(role.tool==='binoculars'){
   for(const x of [-.10,.10]){const barrel=cylinder(prop,.09,.29,0x263b39,[x,.04,.16]);barrel.rotation.x=Math.PI/2;const lens=cylinder(prop,.085,.02,0x669eaf,[x,.04,.32]);lens.rotation.x=Math.PI/2;}round(prop,.19,.08,.12,0x344641,[0,.04,.15],.02);
  }else{
   round(prop,.16,.30,.10,0x283940,[0,.06,.10],.02);round(prop,.115,.08,.015,0x82b7b1,[0,.12,.161],.01);cylinder(prop,.013,.29,0x26383e,[.052,.34,.10]);for(let i=0;i<3;i++)round(prop,.095,.008,.012,0x667b7a,[0,.03-i*.03,.16],.004);
  }
  // Batch rigid parts within each joint to reduce draw calls without changing motion.
  if(global.nanMergeGeometries){
   const parents=[];g.traverse(n=>{if(!n.isMesh)parents.push(n)});
   for(const parent of parents){
    const batches=new Map();
    for(const part of parent.children){if(!part.isMesh||Array.isArray(part.material))continue;const parts=batches.get(part.material)||[];parts.push(part);batches.set(part.material,parts);}
    for(const [material,parts] of batches){
     if(parts.length<2)continue;
     const geometries=parts.map(part=>{part.updateMatrix();return (part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone()).applyMatrix4(part.matrix)});
     const geometry=global.nanMergeGeometries(geometries);geometries.forEach(x=>x.dispose());if(!geometry)continue;
     const combined=new T.Mesh(geometry,material);combined.castShadow=true;combined.receiveShadow=true;
     parts.forEach(part=>parent.remove(part));parent.add(combined);
    }
   }
  }
  g.animations=clips(nodes,role);
  if(animate){
   const mixer=new T.AnimationMixer(g),actions=Object.fromEntries(g.animations.map(c=>[c.name,mixer.clipAction(c)]));let current=null;
   Object.defineProperty(g,'characterAnimator',{value:{update(dt,name='idle'){const next=actions[name]||actions.idle;if(next!==current){next.reset().fadeIn(.18).play();if(current)current.fadeOut(.18);current=next;}mixer.update(Math.min(dt,.08));},stop(){mixer.stopAllAction();mixer.uncacheRoot(g);},mixer}});
   g.characterAnimator.update(0,'idle');
  }
  return g;
 }
 function install(Game){
  const p=Game.prototype;
  p.makeAvatar=function(color,opts={}){const npcColors=[0x3f8ac2,0xb66f3b,0x8d62a8,0x68a05c,0xe25c3d],npcRoles=[1,2,1,3,4],i=npcColors.indexOf(color);return create(opts.vest?this.role:(npcRoles[i]??0));};
  const move=p.updatePlayer;p.updatePlayer=function(dt){const before=this.player.position.clone();move.call(this,dt);this.characterMotion=this.player.position.distanceToSquared(before)>.00001?((this.keys.ShiftLeft||this.keys.ShiftRight||this.inVehicle)?'run':'walk'):'idle';};
  const visual=p.updateSceneVisuals;p.updateSceneVisuals=function(dt=0){visual?.call(this,dt);if(this.paused())return;this.characterActionTime=Math.max(0,(this.characterActionTime||0)-dt);for(const child of this.scene.children){if(!child.characterAnimator)continue;const name=child===this.player?(this.inVehicle?'idle':this.characterMotion==='idle'&&this.characterActionTime>0?'action':this.characterMotion||'idle'):(this.nearest?.object===child?'wave':'idle');child.characterAnimator.update(dt,name);}};
  const action=p.doAction;p.doAction=function(act){action.call(this,act);if(act==='interact')this.characterActionTime=2.4;};
  const destroy=p.destroy;p.destroy=function(){for(const child of this.scene?.children||[])child.characterAnimator?.stop();destroy.call(this);};
 }
 global.NanCharacters={roles,create,install};
})(window);
