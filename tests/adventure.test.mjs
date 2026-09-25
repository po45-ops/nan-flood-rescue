import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

function fixture(saved={}) {
 const memory=new Map([['nan-adventure-save-v1',JSON.stringify(saved)]]);
 const sandbox={window:{THREE},performance:{now:()=>100},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},console,setTimeout,clearTimeout,devicePixelRatio:1};
 vm.createContext(sandbox);
 for(const file of ['adventure.js','adventure-play.js','zone3-scene.js'])vm.runInContext(readFileSync(new URL('../public/game/'+file,import.meta.url),'utf8'),sandbox);
 vm.runInContext('window.enhanceNanPlay(NanAdventureGame);window.enhanceNanScene(NanAdventureGame);window.TestGame=NanAdventureGame',sandbox);
 const game=Object.create(sandbox.window.TestGame.prototype),els=new Map();
 game.q=s=>{if(!els.has(s)){const classes=new Set();els.set(s,{textContent:'08:00',style:{},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle:k=>classes.has(k)?classes.delete(k):classes.add(k)},focus(){}})}return els.get(s)};
 Object.assign(game,{state:game.loadState(),options:{},keys:{},mobile:{x:0,y:0},scene:new THREE.Scene(),player:new THREE.Group(),vehicle:new THREE.Group(),root:{querySelectorAll:()=>[],classList:{toggle(){}}},cameraYaw:0,buildMeshes:[],interactables:[],pickups:[],labels:[],surveyMarkers:[],obstacles:[],eventSpeed:1,lastFloodSave:-1,lastFloodUI:-1,buildSelected:'sandbag',floodPlanes:[],rain:{material:{}},river:{scale:new THREE.Vector3(1,1,1),position:new THREE.Vector3()},refreshUI(){},modal(html){this.lastModal=html},closeModal(){},toast(text){this.lastToast=text},updateMiniDot(){},updateBuildPreview(){},addTextSprite(){},rand:()=>.5});
 game.player.position.set(-31,.05,-18);
 return {game,memory};
}

test('existing saved progress is retained and new pickup field migrates',()=>{const {game}=fixture({budget:43,checkedStation:true,inventory:{pump:2},builds:[{id:'warning',x:0,z:3}]});assert.equal(game.state.budget,43);assert.equal(game.state.checkedStation,true);assert.equal(game.state.builds.length,1);assert.equal(game.state.pickedItems.length,0)});

test('station inspection awards knowledge only once',()=>{const {game}=fixture();game.inspectStation();const xp=game.state.xp;game.inspectStation();assert.equal(game.state.checkedStation,true);assert.equal(game.state.xp,xp);assert.equal(xp,10)});

test('purchases reserve enough budget for mandatory equipment and refund unused goods',()=>{const {game}=fixture({budget:35});game.buyItem('retention');assert.equal(game.state.budget,35);game.buyItem('pump');assert.equal(game.state.budget,15);assert.equal(game.available('pump'),1);game.buyItem('sandbag');assert.equal(game.state.budget,5);game.refundItem('pump');assert.equal(game.state.budget,25);assert.equal(game.available('pump'),0)});

test('cannot start flood before completing mandatory preparation',()=>{const {game}=fixture();game.startEvent();assert.equal(game.state.phase,'prepare');assert.match(game.lastToast,/ตรวจสถานี/)});

test('full mission runs from preparation through damage survey and learning results',()=>{
 const {game}=fixture();game.inspectStation();game.buyItem('pump');game.buyItem('sandbag');
 for(const [id,x,z] of [['pump',-2,8],['sandbag',-2,4]]){game.pendingBuild={id,x,z};game.fieldGame={hits:3};game.finishBuild()}
 assert.equal(game.state.builds.length,2);assert.equal(game.state.budget,70);game.startEvent();assert.equal(game.state.phase,'flood');
 game.state.inventory.toolkit=1;game.updateFlood(70);assert.equal(game.state.dynamic.pumpFailure,true);game.togglePump(game.state.builds[0]);assert.equal(game.state.dynamic.pumpFixed,true);
 game.updateFlood(70);assert.equal(game.state.dynamic.schoolRequest,true);game.evacuateSchool();assert.equal(game.state.dynamic.schoolEvacuated,true);
 game.updateFlood(70);assert.equal(game.state.phase,'survey');assert.equal(game.surveyMarkers.length,3);
 for(const [id,name] of [['school','โรงเรียน'],['road','ถนน'],['farm','เกษตร']])game.collectSurvey(id,name,{visible:true});
 assert.equal(game.state.phase,'complete');assert.equal(game.state.result.survey.length,3);assert.equal(game.state.result.budget,70);assert.equal(game.state.result.schoolEvacuated,true);assert.ok(game.state.result.safety>60);
 game.replay();assert.equal(game.state.phase,'prepare');assert.equal(game.state.survey.length,0);assert.equal(game.state.builds.length,2);assert.equal(game.q('[data-ui="timeline"]').classList.contains('show'),false);
});

test('collected supplies do not respawn on reload',()=>{const {game,memory}=fixture();game.addPickup('toolkit','ชุดเครื่องมือ',-23,23,0xaa7700);game.nearestPickup=game.pickups[0];game.pickup();assert.equal(game.available('toolkit'),1);game.pickup();assert.equal(game.available('toolkit'),1);const second=fixture(JSON.parse(memory.get('nan-adventure-save-v1'))).game;second.addPickup('toolkit','ชุดเครื่องมือ',-23,23,0xaa7700);assert.equal(second.pickups[0].picked,true);assert.equal(second.pickups[0].object.visible,false)});

test('building interaction uses reachable outer wall, while collisions block the interior',()=>{const {game}=fixture();const building=game.addBuilding(-30,21,17,11,0xaa7700,'ศูนย์อุปกรณ์','');assert.equal(game.distanceToInteractable({object:building},{x:-30,z:28}),1.5);assert.equal(game.blocked({x:-30,z:21}),true);assert.equal(game.blocked({x:-30,z:28}),false)});

test('navigation crosses the river at a bridge and can reach the station',()=>{const {game}=fixture();game.addBuilding(-34,-27,15,10,0,'','');game.addBuilding(22,27,8,7,0,'','');game.addBuilding(34,-17,18,11,0,'','');const route=game.findRoute({x:22,z:32});assert.ok(route&&route.length>10);assert.ok(route.some(v=>Math.abs(v.x-9)<5&&[-16,30].some(z=>Math.abs(v.z-z)<3)));assert.ok(route.every(v=>!game.blocked(v)));game.route=route;for(let i=0;i<4000&&game.route.length;i++)game.updatePlayer(.03);assert.equal(game.route.length,0);assert.ok(Math.hypot(game.player.position.x-22,game.player.position.z-32)<3)});

test('open dialogs pause movement and pointer joystick tracks pointer IDs',()=>{const {game}=fixture();game.q('[data-ui="modal"]').classList.add('open');game.keys.KeyW=true;const before=game.player.position.clone();game.updatePlayer(1);assert.ok(game.player.position.equals(before));const handlers={};game.q=s=>s.includes('joystick')?{addEventListener:(k,fn)=>handlers[k]=fn,setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:100,height:100})}:{style:{}};game.paused=()=>false;game.bindJoystick();handlers.pointerdown({pointerId:8,clientX:80,clientY:50});assert.equal(game.mobile.x,1);handlers.pointerup();assert.equal(game.mobile.x,0);assert.equal(game.mobile.y,0)});

test('reclaiming a placed measure restores usable inventory before simulation',()=>{const {game}=fixture({builds:[{id:'pump',x:-3,z:3}],budget:0});game.openInventory=()=>{};game.reclaimBuild(0);assert.equal(game.state.builds.length,0);assert.equal(game.available('pump'),1);game.refundItem('pump');assert.equal(game.state.budget,20)});
