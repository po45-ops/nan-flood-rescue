// Phaser renders the rain and moving rescue boat cue. No coordinates here represent historical observations.
window.FloodAnimation={game:null,start(parent){
 if(!window.Phaser||!document.getElementById(parent))return;
 this.stop();const host=document.getElementById(parent),width=host.clientWidth||640,height=host.clientHeight||450;
 let drops=[];
 const scene={create(){this.g=this.add.graphics();for(let i=0;i<44;i++)drops.push({x:Math.random()*width,y:Math.random()*height,speed:2+Math.random()*3});this.boat=this.add.text(20,height*.72,'🚤',{fontSize:'28px'});},update(){this.g.clear();this.g.lineStyle(2,0xb8e9f5,.52);for(const d of drops){d.x-=1;d.y+=d.speed;if(d.y>height){d.y=0;d.x=Math.random()*width}this.g.lineBetween(d.x,d.y,d.x-5,d.y+12)}this.boat.x=Math.min(width-45,this.boat.x+1.2)}};
 this.game=new Phaser.Game({type:Phaser.CANVAS,parent,width,height,transparent:true,scene,scale:{mode:Phaser.Scale.RESIZE}});
},stop(){if(this.game){this.game.destroy(true);this.game=null}}};
