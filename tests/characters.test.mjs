import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
const scope={window:{THREE,nanMergeGeometries:mergeGeometries}};vm.createContext(scope);
vm.runInContext(readFileSync(new URL('../public/game/characters.js',import.meta.url),'utf8'),scope);
for(let i=0;i<5;i++)test(`role ${i}: exported model and every motion animate real joints`,async()=>{
 const kit=scope.window.NanCharacters,model=kit.create(i);
 const bytes=readFileSync(new URL(`../public/game/assets/characters/${kit.roles[i].id}.glb`,import.meta.url));
 assert.equal(bytes.toString('utf8',0,4),'glTF');
 const loaded=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 assert.deepEqual(loaded.animations.map(c=>c.name),['idle','walk','run','wave','action']);
 assert.ok(loaded.scene.getObjectByName('RoleTool'));
 const mixer=new THREE.AnimationMixer(loaded.scene);
 for(const clip of loaded.animations){
  mixer.stopAllAction();mixer.clipAction(clip).reset().play();mixer.update(.15);
  const joints=[];loaded.scene.traverse(n=>{if(['Head','Spine','RightElbow','RightShoulder','RightKnee'].includes(n.name))joints.push([n,n.quaternion.clone()])});
  mixer.update(.22);
  assert.ok(joints.some(([n,q])=>q.angleTo(n.quaternion)>1e-5),clip.name);
  loaded.scene.traverse(n=>assert.ok(n.position.toArray().concat(n.quaternion.toArray()).every(Number.isFinite)));
 }
 for(const motion of ['idle','walk','run','wave','action'])model.characterAnimator.update(.04,motion);
 model.characterAnimator.stop();
});
