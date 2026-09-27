import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import vm from 'node:vm';
globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(data=>{this.result=data;this.onloadend?.();}).catch(e=>this.onerror?.(e));}
 readAsDataURL(blob){blob.arrayBuffer().then(data=>{this.result='data:'+blob.type+';base64,'+Buffer.from(data).toString('base64');this.onloadend?.();}).catch(e=>this.onerror?.(e));}
};
const sandbox={window:{THREE,nanMergeGeometries:mergeGeometries}};vm.runInNewContext(readFileSync(new URL('../public/game/characters.js',import.meta.url),'utf8'),sandbox);
const kit=sandbox.window.NanCharacters,folder=new URL('../public/game/assets/characters/',import.meta.url);mkdirSync(folder,{recursive:true});
for(let i=0;i<kit.roles.length;i++){
 const model=kit.create(i,{animate:false});model.updateMatrixWorld(true);
 const glb=await new GLTFExporter().parseAsync(model,{binary:true,animations:model.animations});
 writeFileSync(new URL(kit.roles[i].id+'.glb',folder),Buffer.from(glb));console.log(kit.roles[i].id+': '+glb.byteLength+' bytes, '+model.animations.length+' animations');
}
