'use client';
import {useEffect,useRef} from 'react';
export default function Home(){const frame=useRef(null);useEffect(()=>{const onMessage=e=>{if(e.origin!==location.origin)return;if(e.data?.type==='nan-rescue-title')document.title=e.data.title};window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage)},[]);return <iframe ref={frame} title="NAN FLOOD RESCUE เกมจำลองเมืองน่าน" src="/game/index.html" style={{border:0,width:'100%',height:'100dvh',display:'block'}}/>}
