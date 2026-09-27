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
 if(i===0){
  const skins=[];loaded.scene.traverse(n=>{if(n.isSkinnedMesh)skins.push(n)});assert.equal(new Set(skins.map(m=>m.skeleton.bones[0].uuid)).size,4);
  for(const mesh of skins){
   const weights=mesh.geometry.attributes.skinWeight;
   let blend=-1;
   for(let v=0;v<weights.count;v++){
    assert.ok(Math.abs(weights.getX(v)+weights.getY(v)-1)<1e-5);
    if(weights.getX(v)>.3&&weights.getX(v)<.7)blend=v;
   }
   assert.ok(blend>=0,'joint must have blended skin weights');
   loaded.scene.updateMatrixWorld(true);mesh.skeleton.update();
   const vertex=new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,blend);
   const before=mesh.applyBoneTransform(blend,vertex.clone());
   mesh.skeleton.bones[1].rotation.x=.65;loaded.scene.updateMatrixWorld(true);mesh.skeleton.update();
   const after=mesh.applyBoneTransform(blend,vertex.clone());assert.ok(before.distanceTo(after)>.001,'joint vertices deform');
   mesh.skeleton.bones[1].rotation.set(0,0,0);
  }
 }
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
