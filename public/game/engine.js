// Educational risk index in game units. These baselines are invented for play and never historical data.
window.SimulationEngine={compute(actions,budget,measures){
  const zones={nan:74,phu:68,wiang:79};
  let safety=35,environment=55;
  for(const a of actions){
    const m=measures.find(x=>x.id===a.id);if(!m)continue;
    const lat=Number(a.lat)||18.79,lng=Number(a.lng)||100.78;
    const zone=lat<18.68?'wiang':lng>100.82?'phu':'nan';
    if(a.id==='warning'){safety+=17;continue}
    if(a.id==='evacuate'){safety+=23;continue}
    if(a.id==='shelter'){safety+=19;continue}
    if(a.id==='forest'){
      zones.nan-=5;zones.phu-=4;zones.wiang-=5;environment+=9;continue;
    }
    if(a.id==='retention'){
      zones[zone]-=10;
      if(zone==='nan')zones.wiang-=4;
      environment+=6;continue;
    }
    if(a.id==='levee'){
      zones[zone]-=13;
      if(zone==='nan')zones.wiang+=8;
      if(zone==='phu')zones.wiang+=5;
      environment-=7;continue;
    }
    zones[zone]-=m.risk;
    safety+=m.safety;
  }
  for(const key of Object.keys(zones))zones[key]=Math.max(8,Math.min(96,Math.round(zones[key])));
  const risk=Math.round((zones.nan+zones.phu+zones.wiang)/3);
  safety=Math.max(5,Math.min(97,safety));
  return {risk,districtRisks:zones,safety,school:Math.max(10,Math.min(95,safety+7)),road:Math.max(10,Math.min(95,100-risk+5)),environment:Math.max(15,Math.min(95,environment)),actions:actions.map(x=>({...x})),budget};
}};
