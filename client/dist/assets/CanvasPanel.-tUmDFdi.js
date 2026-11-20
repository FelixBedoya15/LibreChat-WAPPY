const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor.Bmb2Uika.js","./react-core.DnLkJYlj.js","./markdown_highlight.Cj_heSZW.js","./validation.CXYwsuSc.js","./math-katex.D41sMH58.js","./math-katex.sdXCKFqw.css","./locales-core.odB_8JGc.js","./i18n.CdklldLM.js"])))=>i.map(i=>d[i]);
import{r as l,j as e,a as Ot,R as wa,c as ja}from"./react-core.DnLkJYlj.js";import{de as Oa,aK as rt,cb as We,dR as vt,cy as st,dD as Nt,e$ as Da,hN as Ia,aI as dt,bD as Yt,dk as La,h1 as Na,em as Sa,cA as bt,fz as ka,cC as Ma,dT as Fa,gZ as Jt,fU as _t,cE as Qt,cQ as ut,cR as Ca,bz as ct,d0 as pt,fX as _a,dy as Dt,cK as Ea,hh as Xt,hi as Aa,dx as gt,cO as Ta,ct as Ba,gy as Ga,fr as ea,cw as oa,b4 as ia,eJ as la,ek as na,fO as da,hO as Pt,gR as Kt,gb as Bt,cM as Ua,dN as Ha,dw as ca,g9 as Ra,cd as It,e8 as Va,gt as qa,cL as Wa,bP as Zt,cI as Ya,hP as Ja,cT as zt,ca as ta,dv as Qa,ck as pa,gI as Xa,dZ as xa,db as ma,dz as fa,dP as ua,cu as Ka,dE as Za,cF as er,bQ as ba,bR as ga,bO as tr,fV as Gt,dG as ar,g6 as St,co as Ut,g2 as rr,eF as sr,cl as or,g5 as ir,c5 as ha,hj as lr,cY as nr,di as dr}from"./vendor.Bmb2Uika.js";import{o as wt,d6 as pe,s as ht,c as cr,a0 as Pa,p as za,b6 as kt,U as ya,aC as Ct}from"./index.B55zKZjr.js";import{L as pr}from"./LiveEditor.9S7xqYSG.js";import{r as xr,a as mr,p as fr,b as ur,c as br,d as gr,e as hr,f as yr,g as vr,h as wr,i as jr,j as Nr,k as Sr,P as kr}from"./canvas-templates.CmL4TXkY.js";import{_ as Cr}from"./locales-core.odB_8JGc.js";import Er from"./MoodAnalyticsDashboard.DnGUPMCP.js";import"./utilities.CCKZG3yh.js";import{a as mt}from"./http-client.5vvjwtVK.js";import{E as Ar,R as Tr}from"./ExportDropdown.WN2Rinpf.js";import{a as Rr}from"./routing.CpqY7sNF.js";import{h as Pr}from"./tanstack-vendor.yxhpB5Wv.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./radix-ui.CnucjFQO.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.CmSqjpHv.js";import"./animations.DJM2gwad.js";import"./virtualization.BpdrwjkH.js";import"./headlessui.CYV6IAnv.js";import"./framer-motion.D9C6fIPM.js";import"./i18n.CdklldLM.js";import"./date-utils.D18hejP2.js";import"./forms.DRVLrJdX.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.D0PgUh5P.js";import"./SignaturePad.B2Pe9I1B.js";import"./CollapsibleReportBox.CJHDhMw6.js";import"./useAutoLoadReport.LaCCV9J7.js";import"./SGSSTHeroHeader.CIyu7mcv.js";const aa=({onClose:s,onImportTable:y,onImportChart:i,onImportBullets:O,onImportMedia:C,activeFileType:p,initialTab:$="media"})=>{var et,Ke,tt;const{token:d}=wt(),[S,j]=l.useState([]),[k,H]=l.useState(!0),[Pe,le]=l.useState(""),[Q,_]=l.useState($),[W,Oe]=l.useState([]),[ke,je]=l.useState(!1),[me,F]=l.useState("all"),[z,be]=l.useState(""),[Ee,Ne]=l.useState(""),[ge,ve]=l.useState(!1),[re,te]=l.useState([]),[f,M]=l.useState({startRow:0,startCol:0,endRow:2,endCol:2}),[R,fe]=l.useState("bar"),[X,se]=l.useState("Gráfico Importado"),[He,Te]=l.useState(0),[Ye,Ie]=l.useState(1),[Ve,_e]=l.useState([]),[Le,Me]=l.useState([]),[qe,he]=l.useState(!1),[ne,ae]=l.useState([]),[xe,N]=l.useState("Resumen de Política");l.useEffect(()=>{I(),D()},[]);const D=async()=>{je(!0);try{const v={};d&&(v.Authorization=`Bearer ${d}`);const w=await fetch("/api/googleflow/media-library",{headers:v});if(w.ok){const ie=await w.json();Oe(Array.isArray(ie.items)?ie.items:[])}}catch(v){console.error("Error loading Flow & NotebookLM media library:",v)}finally{je(!1)}},ye=v=>{let w="";if(v.mediaType==="video")w=`<figure style="margin:24px 0; text-align:center; background:#090d16; padding:16px; border-radius:16px; border:1px solid rgba(168,85,247,0.3);"><video src="${v.publicUrl}" controls playsinline preload="metadata" style="width:100%; max-height:460px; border-radius:12px; background:#000;"></video><figcaption style="margin:8px 0 0; font-size:11px; color:#cbd5e1; font-weight:600;">🎬 ${v.label} · <a href="${v.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf; text-decoration:underline;">Descargar MP4</a></figcaption></figure>`;else if(v.mediaType==="audio")w=`<div style="margin:20px 0; padding:16px 20px; border-radius:14px; background:#f0fdfa; border:1px solid #99f6e4;"><div style="margin:0 0 8px; font-size:13px; color:#0f766e; font-weight:700;">🎙️ ${v.label}</div><audio src="${v.publicUrl}" controls preload="metadata" style="width:100%; display:block;"></audio><div style="margin-top:8px; font-size:11px;"><a href="${v.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488; font-weight:700; text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;else if(v.mediaType==="document"){const ie=v.textPreview?`<pre style="margin:12px 0 0; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; color:#1e293b; white-space:pre-wrap; max-height:360px; overflow-y:auto;">${v.textPreview.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`:"";w=`<div style="margin:20px 0; padding:16px 20px; background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid #0d9488; border-radius:12px;"><div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;"><strong style="color:#0f172a; font-size:13px;">📄 ${v.label}</strong><a href="${v.publicUrl}" download target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:6px 12px; background:#0d9488; color:#ffffff; font-weight:700; font-size:11px; border-radius:8px; text-decoration:none;">⬇ Descargar Recurso</a></div>${ie}</div>`}else w=`<figure style="margin:24px 0; text-align:center; background:#f8fafc; padding:16px; border-radius:14px; border:1px solid #e2e8f0;"><img src="${v.publicUrl}" alt="${v.label}" style="max-width:100%; height:auto; border-radius:10px; box-shadow:0 4px 20px rgba(15,23,42,0.08); display:block; margin:0 auto;" /><figcaption style="margin:10px 0 0; font-size:12px; color:#475569; font-style:italic; font-weight:600;">✨ ${v.label}</figcaption></figure>`;C?(C(v,w),s()):y&&(y(w),s())},I=async()=>{H(!0),le("");try{const v=await fetch("/api/sgsst/canvas/history");if(!v.ok)throw new Error("Error al conectar con el servidor.");const ie=(await v.json()).conversations||[];j(ie);const q=ie.filter(x=>x.fileType==="excel"),r=ie.filter(x=>x.fileType==="text");Q==="excel"&&q.length>0?Fe(q[0].conversationId,q[0].title,"excel"):Q==="text"&&r.length>0&&Fe(r[0].conversationId,r[0].title,"text")}catch(v){le("No se pudo cargar el historial de lienzos."),console.error(v)}finally{H(!1)}},Be=v=>{if(_(v),v==="media"){D();return}te([]),_e([]),be(""),Me([]),ae([]);const w=S.filter(ie=>ie.fileType===(v==="excel"?"excel":"text"));w.length>0&&Fe(w[0].conversationId,w[0].title,v)},Fe=async(v,w,ie)=>{var q;ve(!0),be(v),Ne(w),te([]),_e([]),Me([]),ae([]);try{const r=await fetch(`/api/sgsst/canvas/${v}`);if(!r.ok)throw new Error("Error al cargar documento.");const x=await r.json();if(ie==="excel"){let g=[];if(Array.isArray(x.content))g=x.content;else if(typeof x.content=="string")try{const h=JSON.parse(x.content);Array.isArray(h)&&(g=h)}catch{}if(g.length>0){te(g),se(w);const h=Math.min(g.length-1,6),E=Math.min((g[0]||[]).length-1,4);if(M({startRow:0,startCol:0,endRow:h>=0?h:0,endCol:E>=0?E:0}),g[0]&&g[0].length>1){Te(0);for(let t=1;t<g[0].length;t++){let a=!1;for(let n=1;n<g.length;n++){const o=(q=g[n])==null?void 0:q[t],u=(o!=null?String(o):"").replace(/[^0-9.\-]/g,"");if(u&&!isNaN(parseFloat(u))){a=!0;break}}if(a){Ie(t);break}}}}}else{const g=x.content||"",h=document.createElement("div");h.innerHTML=g;const E=Array.from(h.querySelectorAll("p, li, h2, h3, h1")).map(t=>{var a;return((a=t.textContent)==null?void 0:a.trim())||""}).filter(t=>t.length>12);_e(E.length>0?E:["No se detectó suficiente texto estructurado en este documento."]),N(w)}}catch(r){console.error("Error loading bridge doc:",r)}finally{ve(!1)}},Ge=()=>{var t,a;if(re.length===0||!y)return;const{startRow:v,startCol:w,endRow:ie,endCol:q}=f,r=Math.min(v,ie),x=Math.max(v,ie),g=Math.min(w,q),h=Math.max(w,q);let E=`<div class="imported-excel-table" style="overflow-x:auto; margin:20px 0; border:1px solid rgba(13,148,136,0.2); border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); background:#ffffff; font-family:'Outfit', sans-serif;">`;E+='<table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">',E+='<thead><tr style="background:linear-gradient(135deg, #0f766e, #0d9488); color:#ffffff;">';for(let n=g;n<=h;n++){const o=((t=re[r])==null?void 0:t[n])||"";E+=`<th style="padding:12px 16px; font-weight:700; border-bottom:3px solid #0f766e; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">${o}</th>`}E+='</tr></thead><tbody style="color:#334155;">';for(let n=r+1;n<=x;n++){const o=n%2===0?"rgba(20,184,166,0.03)":"#ffffff";E+=`<tr style="background:${o}; border-bottom:1px solid rgba(226,232,240,0.8); transition:all 0.2s;">`;for(let m=g;m<=h;m++){const u=(a=re[n])==null?void 0:a[m],b=u!=null?String(u):"",Se=!isNaN(parseFloat(b.replace(/[^0-9.\-]/g,"")))&&b.includes("$")||b.length<10?"right":"left";E+=`<td style="padding:10px 16px; text-align:${Se}; font-weight:500;">${b}</td>`}E+="</tr>"}E+="</tbody></table></div>",y(E),s()},Re=()=>{var x,g;if(re.length===0||!i)return;const{startRow:v,endRow:w}=f,ie=Math.min(v,w),q=Math.max(v,w),r=[];for(let h=ie+1;h<=q;h++){const E=(x=re[h])==null?void 0:x[He],t=E!=null?String(E):`Fila ${h}`,a=(g=re[h])==null?void 0:g[Ye],n=a!=null?String(a):"0",o=parseFloat(n.replace(/[^0-9.\-]/g,"")),m=isNaN(o)?0:o;r.push({label:t,val:m})}r.length>0&&(i({type:R,data:r,title:X}),s())},ze=v=>{Le.includes(v)?Me(Le.filter(w=>w!==v)):Me([...Le,v])},Qe=()=>{Le.length!==0&&(he(!0),setTimeout(()=>{const v=Le.map(ie=>Ve[ie]),w=[];v.forEach(ie=>{const q=ie.split(/[.!?]+/).map(r=>r.trim()).filter(r=>r.length>15);q.length>0&&q.slice(0,2).forEach(r=>{if(w.length<5){const x=r.charAt(0).toUpperCase()+r.slice(1);w.push(x)}})}),w.length===0&&(w.push("Establecer el compromiso de la alta dirección en SST."),w.push("Implementar canales eficaces de reporte y evaluación."),w.push("Garantizar recursos para el plan anual de capacitaciones.")),ae(w),he(!1)},1200))},Xe=()=>{ne.length===0||!O||(O(xe,ne),s())},at=S.filter(v=>v.fileType==="excel"),ot=S.filter(v=>v.fileType==="text");return e.jsxs("div",{className:"absolute right-0 top-0 bottom-0 z-[500] w-[360px] sm:w-[420px] bg-slate-950/80 backdrop-blur-xl border-l border-teal-500/20 shadow-2xl flex flex-col animate-slide-in-right text-slate-100 font-sans",children:[e.jsxs("div",{className:"p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-teal-950/30 to-slate-950",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400",children:e.jsx(Oa,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-bold text-sm text-white tracking-wide",children:"Puente de Lienzos"}),e.jsx("p",{className:"text-[10.5px] text-teal-400 font-medium",children:"Interconexión SST Inteligente"})]})]}),e.jsx("button",{onClick:s,className:"p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",children:e.jsx(rt,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"px-3 py-2.5 bg-slate-950/50 border-b border-slate-900 flex gap-1.5",children:[e.jsxs("button",{onClick:()=>Be("media"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 ${Q==="media"?"bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(We,{className:"h-3.5 w-3.5 text-purple-400"}),"Flow & NotebookLM"]}),e.jsxs("button",{onClick:()=>Be("excel"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${Q==="excel"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(vt,{className:"h-3.5 w-3.5"}),"Excel"]}),e.jsxs("button",{onClick:()=>Be("text"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${Q==="text"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(st,{className:"h-3.5 w-3.5"}),"Word"]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[Q==="media"&&e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("div",{className:"flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex-1",children:["all","flow","notebooklm","antigravity"].map(v=>e.jsx("button",{onClick:()=>F(v),className:`flex-1 py-1 px-1.5 rounded-md text-[9.5px] font-bold transition-all ${me===v?"bg-purple-500/20 text-purple-300 border border-purple-500/40":"text-slate-400 hover:text-slate-200"}`,children:v==="all"?"Todos":v==="flow"?"Flow":v==="notebooklm"?"NotebookLM":"Antigravity"},v))}),e.jsx("button",{onClick:D,disabled:ke,className:"p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 transition-all",title:"Actualizar biblioteca multimedia (30 días)",children:e.jsx(Nt,{className:`h-3.5 w-3.5 ${ke?"animate-spin text-purple-400":""}`})})]}),e.jsxs("div",{className:"px-2.5 py-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-[10px] text-purple-200",children:[e.jsx("span",{children:"💾 Almacenados en tu servidor WAPPY"}),e.jsx("span",{className:"font-bold text-purple-400",children:"Retención: 30 días"})]}),ke?e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(Nt,{className:"h-6 w-6 text-purple-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Cargando recursos de Flow y NotebookLM..."})]}):(()=>{const v=W.filter(w=>me==="all"||w.source===me);return v.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-10 px-5 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl",children:[e.jsx(Da,{className:"h-7 w-7 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-bold text-slate-300 mb-1",children:"No hay recursos descargados aún"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Genera una imagen o video con Google Flow o una infografía/podcast con NotebookLM y aparecerá aquí automáticamente durante 30 días."})]}):e.jsx("div",{className:"space-y-3",children:v.map(w=>e.jsxs("div",{className:"bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-xl overflow-hidden transition-all shadow-md",children:[w.mediaType==="image"&&e.jsxs("div",{className:"relative h-36 w-full bg-slate-950 overflow-hidden",children:[e.jsx("img",{src:w.publicUrl,alt:w.label,className:"w-full h-full object-cover",loading:"lazy"}),e.jsx("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-purple-300 border border-purple-500/30",children:w.source==="flow"?"✨ Flow Imagen":"📊 NotebookLM"}),e.jsxs("span",{className:"absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30",children:["⏳ ",w.daysRemaining,"d"]})]}),w.mediaType==="video"&&e.jsxs("div",{className:"relative bg-black",children:[e.jsx("video",{src:w.publicUrl,controls:!0,playsInline:!0,preload:"metadata",className:"w-full max-h-40 object-contain"}),e.jsxs("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-cyan-300 border border-cyan-500/30 pointer-events-none",children:["🎬 ",w.source==="flow"?"Veo 3.1 Lite":"NotebookLM Video"]})]}),w.mediaType==="audio"&&e.jsxs("div",{className:"p-3 bg-slate-950 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-[10px] font-bold text-teal-300 flex items-center gap-1",children:[e.jsx(Ia,{className:"h-3.5 w-3.5"})," ",w.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",w.daysRemaining,"d"]})]}),e.jsx("audio",{src:w.publicUrl,controls:!0,className:"w-full h-8"})]}),w.mediaType==="document"&&e.jsxs("div",{className:"p-3 bg-slate-950/90 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsxs("span",{className:"text-[10px] font-bold text-amber-300 flex items-center gap-1",children:[e.jsx(st,{className:"h-3.5 w-3.5"})," ",w.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",w.daysRemaining,"d"]})]}),w.textPreview&&e.jsxs("p",{className:"text-[10px] text-slate-400 line-clamp-3 font-mono bg-slate-900/80 p-2 rounded border border-slate-800",children:[w.textPreview.slice(0,180),"..."]})]}),e.jsxs("div",{className:"p-3 flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-xs font-bold text-white truncate",title:w.label,children:w.label}),e.jsxs("p",{className:"text-[10px] text-slate-400 truncate font-mono",children:[w.filename," • ",(w.sizeBytes/1024).toFixed(0)," KB"]})]}),e.jsxs("button",{onClick:()=>ye(w),className:"shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all cursor-pointer",children:[e.jsx(dt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Insertar"})]})]})]},w.filename))})})()]}),Q!=="media"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5",children:"Seleccionar origen del historial"}),e.jsxs("div",{className:"relative",children:[e.jsxs("select",{value:z,onChange:v=>{const w=S.find(ie=>ie.conversationId===v.target.value);w&&(Q==="excel"||Q==="text")&&Fe(w.conversationId,w.title,Q)},className:"w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-teal-500/50 appearance-none pr-8 cursor-pointer",children:[e.jsx("option",{value:"",disabled:!0,children:"Selecciona un archivo..."}),Q==="excel"?at.map(v=>e.jsx("option",{value:v.conversationId,children:v.title},v.conversationId)):ot.map(v=>e.jsx("option",{value:v.conversationId,children:v.title},v.conversationId))]}),e.jsx("div",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800",children:e.jsx(Yt,{className:"h-3.5 w-3.5 rotate-90"})})]})]}),Q!=="media"&&ge&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(Nt,{className:"h-6 w-6 text-teal-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Analizando celdas y estructuras..."})]}),Q!=="media"&&!z&&!ge&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl",children:[e.jsx(La,{className:"h-6 w-6 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-semibold text-slate-400 mb-1",children:"Sin archivos disponibles"}),e.jsx("p",{className:"text-[10px] text-slate-500",children:"Aún no se ha guardado ningún lienzo de este tipo en la empresa."})]}),Q==="excel"&&z&&!ge&&re.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900/90 rounded-xl p-3.5 space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Rango de Celdas de Excel"}),e.jsxs("span",{className:"text-[10px] font-semibold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300",children:[String.fromCharCode(65+f.startCol),"$",f.startRow+1," : ",String.fromCharCode(65+f.endCol),"$",f.endRow+1]})]}),e.jsx("div",{className:"overflow-x-auto pb-1.5",children:e.jsxs("table",{className:"mx-auto border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"w-6 h-5 bg-slate-950 text-[9px] text-slate-500 font-bold border border-slate-900 text-center"}),(et=re[0])==null?void 0:et.slice(0,6).map((v,w)=>e.jsx("th",{className:"w-10 h-5 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:String.fromCharCode(65+w)},w))]})}),e.jsx("tbody",{children:re.slice(0,7).map((v,w)=>e.jsxs("tr",{children:[e.jsx("td",{className:"w-6 h-6 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:w+1}),v.slice(0,6).map((ie,q)=>{const r=w>=Math.min(f.startRow,f.endRow)&&w<=Math.max(f.startRow,f.endRow)&&q>=Math.min(f.startCol,f.endCol)&&q<=Math.max(f.startCol,f.endCol);return e.jsx("td",{onClick:()=>{f.startRow===w&&f.startCol===q?M({startRow:w,startCol:q,endRow:w,endCol:q}):M({...f,endRow:w,endCol:q})},className:`w-10 h-6 border border-slate-900/60 text-[9.5px] p-1 text-center truncate cursor-pointer transition-all duration-150 ${r?"bg-teal-500/25 border-teal-500/60 text-white font-bold":"bg-slate-900/90 text-slate-400 hover:bg-slate-800"}`,title:ie,children:ie||""},q)})]},w))})]})}),e.jsx("p",{className:"text-[10px] text-slate-500 text-center",children:"Haz clic en cualquier celda para definir el límite del rango a importar."})]}),e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(Na,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Importar Rango como Tabla HTML"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Inserta una tabla limpia con bordes redondeados y tipografía SST integrada."})]})]}),e.jsxs("button",{onClick:Ge,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/20 text-white transition-all",children:[e.jsx(dt,{className:"h-3.5 w-3.5"}),"Inyectar Tabla Elegante"]})]}),p==="presentation"&&i&&e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(Sa,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Generar Gráfico SVG Interactivo"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Convierte el rango seleccionado en un gráfico vectorial adaptado al tema."})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje X (Etiquetas)"}),e.jsx("select",{value:He,onChange:v=>Te(parseInt(v.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(Ke=re[0])==null?void 0:Ke.map((v,w)=>e.jsx("option",{value:w,children:v||`Columna ${String.fromCharCode(65+w)}`},w))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje Y (Valores)"}),e.jsx("select",{value:Ye,onChange:v=>Ie(parseInt(v.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(tt=re[0])==null?void 0:tt.map((v,w)=>e.jsx("option",{value:w,children:v||`Columna ${String.fromCharCode(65+w)}`},w))})]})]}),e.jsx("div",{className:"grid grid-cols-3 gap-2",children:["bar","line","pie"].map(v=>e.jsx("button",{onClick:()=>fe(v),className:`py-1.5 text-[10.5px] font-semibold border rounded-lg capitalize transition-all ${R===v?"bg-teal-500/15 border-teal-500/60 text-teal-300":"border-slate-800 text-slate-400 hover:text-slate-300"}`,children:v==="bar"?"Barras":v==="line"?"Líneas":"Torta"},v))}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Título del Gráfico"}),e.jsx("input",{type:"text",value:X,onChange:v=>se(v.target.value),className:"w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("button",{onClick:Re,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg text-white transition-all",children:[e.jsx(dt,{className:"h-3.5 w-3.5"}),"Insertar Gráfico de Neón"]})]})]})]}),Q==="text"&&z&&!ge&&Ve.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-3",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Secciones Disponibles del Documento"}),e.jsx("div",{className:"space-y-2 max-h-[180px] overflow-y-auto pr-1",children:Ve.map((v,w)=>{const ie=Le.includes(w);return e.jsx("div",{onClick:()=>ze(w),className:`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all ${ie?"bg-teal-500/10 border-teal-500/40 text-teal-200":"bg-slate-900/70 border-slate-850 text-slate-400 hover:border-slate-800"}`,children:e.jsx("p",{className:"line-clamp-3",children:v})},w)})}),e.jsx("p",{className:"text-[9.5px] text-slate-500",children:"Selecciona los párrafos clave que deseas sintetizar en las diapositivas."})]}),e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 space-y-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(We,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Sintetizador de Viñetas IA"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Analiza y destila párrafos largos en puntos clave listos para presentaciones."})]})]}),Le.length===0?e.jsx("div",{className:"text-center py-4 bg-slate-950/40 border border-slate-900 rounded-lg",children:e.jsx("p",{className:"text-[10px] text-slate-500 font-semibold",children:"Selecciona al menos un párrafo arriba para comenzar."})}):e.jsx("button",{onClick:Qe,disabled:qe,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-all",children:qe?e.jsxs(e.Fragment,{children:[e.jsx(Nt,{className:"h-3.5 w-3.5 animate-spin"}),"Sintetizando ideas clave..."]}):e.jsxs(e.Fragment,{children:[e.jsx(We,{className:"h-3.5 w-3.5 text-teal-300"}),"Sintetizar en Viñetas"]})}),ne.length>0&&e.jsxs("div",{className:"mt-3.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 animate-fade-in",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase mb-1",children:"Título de Diapositiva a Crear"}),e.jsx("input",{type:"text",value:xe,onChange:v=>N(v.target.value),className:"w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase",children:"Puntos Clave Extraídos"}),e.jsx("ul",{className:"list-disc pl-4 text-[10.5px] text-slate-300 space-y-1",children:ne.map((v,w)=>e.jsx("li",{children:v},w))})]}),e.jsxs("button",{onClick:Xe,className:"w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-bold rounded-lg text-white transition-all",children:[e.jsx(dt,{className:"h-3.5 w-3.5"}),"Inyectar como Nueva Diapositiva"]})]})]})]})]})]})},$t=`
<div style="margin-top:60px; page-break-inside:avoid;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">RESPONSABLE SST</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
      </td>
    </tr>
  </table>
</div>`,zr=[{id:"politica_sst",title:"Política de SST",description:"Compromisos oficiales y alta dirección (Decreto 1072)",icon:e.jsx(st,{className:"h-4 w-4 text-teal-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #0ea5e9 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.15), 0 8px 10px -6px rgba(13, 148, 136, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0f766e, #0ea5e9); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              POLÍTICA INTEGRADA DE SEGURIDAD Y SALUD EN EL TRABAJO
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              SISTEMA DE GESTIÓN DE LA SEGURIDAD Y SALUD EN EL TRABAJO (SG-SST)
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              Conforme al Decreto 1072 de 2015 de la República de Colombia
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-POL-001 | V.04
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #0f766e, #0d9488); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  INFORMACIÓN RESUMIDA DE LA ENTIDAD
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Empresa:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-weight: 600; color: #0f766e; width: 25%;">{{empresa_nombre}}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">NIT:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 25%;">{{empresa_nit}}</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Representante:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;">{{representante_legal}}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Fecha Aprobación:</td>
                <td style="padding: 8px 12px;">\${new Date().toLocaleDateString('es-ES')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. DECLARACIÓN GENERAL DE COMPROMISO</h3>
        <p style="text-align: justify; font-size: 13.5px; color: #334155; margin-bottom: 16px;">
          En <strong>{{empresa_nombre}}</strong>, empresa dedicada a la actividad comercial de <em>{{actividad_economica}}</em>, asumimos con el más alto nivel de responsabilidad y compromiso la protección de la integridad física, mental y social de la totalidad de nuestros colaboradores. Esta política es de cobertura universal, cobijando a todos los trabajadores vinculados mediante contratos de trabajo (independientemente de su forma o duración), contratistas, subcontractaristas, proveedores, personal en misión y demás partes interesadas que presten servicios o permanezcan en los centros de trabajo de la organización.
        </p>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. OBJETIVOS ESTRATÉGICOS DEL SG-SST</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para dar cumplimiento a nuestra visión preventiva, la alta dirección se compromete a liderar y financiar el logro de los siguientes objetivos fundamentales:</p>
        <ul style="padding-left: 20px; margin-bottom: 24px; list-style-type: square; font-size: 13px; color: #334155;">
          <li style="margin-bottom: 10px;">
            <strong>Identificar, evaluar y valorar de forma continua los peligros y riesgos</strong> existentes en todas las plazas de trabajo a través del uso y actualización de la metodología IPEVR (Matriz de Peligros), aplicando jerarquías de control (Eliminación, Sustitución, Controles de Ingeniería, Administrativos y EPP).
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Proteger la seguridad y salud de todos los trabajadores</strong> previniendo activamente incidentes, accidentes laborales y enfermedades profesionales a través de campañas continuas de autocuidado, pausas activas y fomento de estilos de vida saludables.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Garantizar el estricto cumplimiento de la normatividad legal vigente aplicable</strong> en materia de Riesgos Laborales en el territorio colombiano (Decreto 1072 de 2015, Resolución 0312 de 2019, Ley 1562 de 2012, Ley 2466 de 2025) y demás regulaciones nacionales o internacionales suscritas.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>Promover el mejoramiento continuo del SG-SST</strong>, destinando los recursos financieros, humanos, tecnológicos y de infraestructura necesarios y suficientes para asegurar el óptimo funcionamiento del sistema y la ejecución del Plan de Trabajo Anual.
          </li>
        </ul>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. SUB-POLÍTICAS CORPORATIVAS DE CUMPLIMIENTO</h3>
        
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 6px 0; color: #15803d; font-size: 14px; font-weight: 700;">A. Prevención de Alcohol, Drogas y Sustancias Psicoactivas</h4>
          <p style="margin: 0; font-size: 12.5px; color: #166534; text-align: justify; line-height: 1.5;">
            Queda terminantemente prohibido para todos los colaboradores laborar en estado de embriaguez o bajo el efecto de sustancias alucinógenas y psicoactivas. Asimismo, todas las sedes de la organización son declaradas <strong>"Espacios 100% Libres de Humo de Tabaco y Emisiones de Sistemas Electrónicos de Vapeo"</strong> en cumplimiento de la Ley 1335 de 2009. La empresa realiza pruebas preventivas y formales de control.
          </p>
        </div>

        <div style="background-color: #f0fbfb; border-left: 4px solid #0d9488; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 6px 0; color: #0f766e; font-size: 14px; font-weight: 700;">B. Prevención de Acoso Laboral y Convivencia Laboral Digna</h4>
          <p style="margin: 0; font-size: 12.5px; color: #115e59; text-align: justify; line-height: 1.5;">
            En congruencia con las Leyes 1010 de 2006 y 2365 de 2024, nos comprometemos a promover un ambiente de trabajo fundamentado en el respeto mutuo, la equidad de género, la dignidad humana y el blindaje total contra el acoso laboral o el hostigamiento sexual. El Comité de Convivencia Laboral operará de forma transparente, confidencial y expedita para resolver y prevenir cualquier indicio de violencia o discriminación.
          </p>
        </div>

        <h3 style="color: #0f766e; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">4. FIRMAS Y DIVULGACIÓN</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">
          Esta política será publicada en cartelera digital y física, se integrará en el proceso de inducción de todo personal y será revisada de forma obligatoria mínimo una (1) vez al año por la alta dirección en coordinación con el COPASST y el responsable del SG-SST.
        </p>

        ${$t}
      </div>
    `.trim()},{id:"copasst",title:"Acta del COPASST",description:"Constitución oficial de delegados y actas de comités",icon:e.jsx(ka,{className:"h-4 w-4 text-emerald-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.15), 0 8px 10px -6px rgba(13, 148, 136, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0d9488, #0f766e); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              ACTA DE CONSTITUCIÓN Y APERTURA DEL COMITÉ PARITARIO DE SST
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              COPASST - Período Legal de Operación Vigente
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              En cumplimiento con la Resolución 2013 de 1986 y Decreto 1072 de 2015
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-FOR-002 | V.05
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #0d9488, #0f766e); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  DATOS GENERALES DEL COMITÉ Y LA SESIÓN
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Razón Social Empresa:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-weight: 600; width: 25%;">\${'{{empresa_nombre}}'}</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">NIT / Cédula Jurídica:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 25%;">\${'{{empresa_nit}}'}</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Ciudad de Reunión:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Bogotá D.C.</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Lugar / Oficina:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Sala de Juntas Principal / Teams</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Fecha y Hora:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;">\${new Date().toLocaleDateString('es-ES')} | 09:00 AM</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Número de Acta:</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0d9488;">ACTA No. 001</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Agenda del Día -->
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 8px 0; color: #0f766e; font-size: 14.5px; font-weight: 700; text-transform: uppercase;">AGENDA DEL DÍA (ORDEN DEL DÍA)</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #115e59; line-height: 1.5;">
            <li style="margin-bottom: 4px;">Verificación de Asistencia y Quórum legal.</li>
            <li style="margin-bottom: 4px;">Instalación oficial del Comité por parte del Representante Legal de \${'{{empresa_nombre}}'}.</li>
            <li style="margin-bottom: 4px;">Designación oficial de cargos de Presidente y Secretario del Comité.</li>
            <li style="margin-bottom: 4px;">Definición del Cronograma Anual de Reuniones Ordinarias Mensuales.</li>
            <li style="margin-bottom: 4px;">Establecimiento del Plan de Acción Inmediato y compromisos de inspección en SST.</li>
            <li style="margin-bottom: 4px;">Cierre de la Sesión y firma del Acta.</li>
          </ol>
        </div>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. MATRIZ DE DELEGADOS CONSTITUIDOS</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">En concordancia con los decretos y resoluciones aplicables según el tamaño de planta de la empresa, los siguientes delegados han sido elegidos (por designación directa del empleador y elección democrática por votación de los trabajadores):</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 50%;">REPRESENTANTES POR PARTE DEL EMPLEADOR</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 50%;">REPRESENTANTES POR PARTE DE LOS TRABAJADORES</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">1. PRINCIPAL DESIGNADO (PRESIDENTE):</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Juan Carlos Pérez</div>
                <div style="margin-bottom: 8px;"><strong>Cédula:</strong> C.C. 80.123.456</div>
                
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">2. SUPLENTE DESIGNADO:</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Andrea González</div>
                <div><strong>Cédula:</strong> C.C. 52.987.654</div>
              </td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; vertical-align: top;">
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">1. PRINCIPAL ELEGIDO (SECRETARIO):</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Laura María Restrepo</div>
                <div style="margin-bottom: 8px;"><strong>Cédula:</strong> C.C. 1.018.654.321</div>
                
                <div style="font-weight: 700; color: #0d9488; margin-bottom: 4px;">2. SUPLENTE ELEGIDO:</div>
                <div style="margin-bottom: 2px;"><strong>Nombre:</strong> Javier Alexander Silva</div>
                <div><strong>Cédula:</strong> C.C. 79.456.789</div>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. PLAN DE ACCIÓN INMEDIATO (COMPROMISOS)</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para iniciar el cumplimiento legal y garantizar las mejores prácticas de SST en \${'{{empresa_nombre}}'}, los miembros del COPASST asumen el siguiente plan de trabajo prioritario para el primer mes de operaciones:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #0d9488; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Actividad Planeada</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 30%; color: #ffffff;">Responsable Designado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 20%; color: #ffffff;">Fecha Límite</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center; color: #ffffff;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Planificación del Cronograma Anual de Inspecciones de Seguridad Locativas</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Juan C. Pérez (Presidente)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Siguiente Sesión</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">En Curso</span>
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Revisión conjunta del reporte de accidentes e incidentes de trabajo del mes anterior</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Laura Restrepo (Secretaria)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Inmediato</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">Pendiente</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Diseño y difusión de infografía sobre reportes rápidos de actos y condiciones inseguras</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Todos los Miembros</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">15 Días</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">
                <span style="background-color: #fef3c7; color: #d97706; padding: 3px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;">Planificado</span>
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0d9488; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DEBERES GENERALES DEL COPASST</h3>
        <p style="font-size: 13px; color: #334155; text-align: justify; margin-bottom: 24px;">
          Este comité se compromete a sesionar ordinariamente de forma mensual y extraordinaria en casos de accidentes graves. Sus funciones principales comprenden la proposición de medidas higiénicas y de control preventivo, acompañamiento en investigaciones de accidentes, realización de inspecciones de seguridad, y ser puente activo de comunicación fluida y respetuosa entre la alta dirección y los colaboradores de la organización.
        </p>

        ${$t}
      </div>
    `.trim()},{id:"guia_induccion",title:"Guía de Inducción",description:"Onboarding y normas de prevención para nuevos ingresos",icon:e.jsx(Ma,{className:"h-4 w-4 text-sky-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #0c4a6e 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.15), 0 8px 10px -6px rgba(2, 132, 199, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #0284c7, #0369a1); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              REGISTRO DE INDUCCIÓN Y ENTRENAMIENTO EN SST
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              Proceso de Onboarding, Seguridad y Salud en el Trabajo
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              SG-SST Obligatorio - Conforme al Decreto 1072 de 2015
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-REG-003 | V.03
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #0284c7, #0369a1); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  DATOS GENERALES DEL TRABAJADOR EN INDUCCIÓN
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Nombre del Colaborador:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-weight: 600; color: #0284c7; width: 25%;">[Escribir Nombre Completo]</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Cédula de Ciudadanía:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 25%;">[Ingresar N° C.C.]</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Cargo / Puesto:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">[Cargo Designado]</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Área / Departamento:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">[Área Operativa]</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Facilitador / Líder SST:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;">[Nombre del Facilitador]</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Fecha de Inducción:</td>
                <td style="padding: 8px 12px;">\${new Date().toLocaleDateString('es-ES')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mensaje de bienvenida -->
        <p style="font-size: 13.5px; text-align: justify; margin-bottom: 20px;">
          <strong>¡Estimado Colaborador!</strong> En <strong>\${'{{empresa_nombre}}'}</strong> la seguridad de cada persona es lo primero. Esta guía de inducción es un instrumento institucional para darte a conocer los fundamentos de prevención del SG-SST, tus responsabilidades y los mecanismos para preservar tu bienestar integral en tu puesto de trabajo.
        </p>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. MODULOS EXHAUSTIVOS DE FORMACIÓN PREVENTIVA</h3>
        
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo I: Conceptos Fundamentales en SST (Ley 1562 de 2012)</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Definición y diferenciación técnica y legal de <strong>Accidente de Trabajo</strong> (suceso repentino que cause lesión por causa o con ocasión del trabajo), <strong>Incidente Laboral</strong> (casi-accidente, suceso con potencial de lesión), y <strong>Enfermedad Laboral</strong> (patología contraída como resultado de la exposición a factores de riesgo inherentes a la actividad).
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo II: Deberes Legales del Trabajador (Decreto 1072)</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Compromiso estricto con los 6 deberes fundamentales: procurar el autocuidado integral de la salud, suministrar información del estado de salud veraz, cumplir las normas e instrucciones de SST, reportar oportunamente peligros y riesgos, participar en capacitaciones y reportar todo incidente de forma inmediata (máximo 24 horas).
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo III: Identificación de Peligros Específicos del Cargo</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Revisión y contextualización de la Matriz de Peligros (IPEVR) del puesto de trabajo asignado. Identificación de riesgos ergonómicos, locativos, biológicos, eléctricos, mecánicos o psicosociales y las medidas de control adoptadas por la compañía.
          </p>
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo IV: Plan de Emergencias y Rutas de Evacuación</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Instrucción en señalización fotoluminiscente, identificación del Punto de Encuentro (Parque Principal / Zona Verde Norte), conformación de brigadas de emergencia (Primeros auxilios, control de incendios y evacuación) y comportamiento ante emergencias.
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <h4 style="margin: 0 0 4px 0; color: #0369a1; font-size: 14px; font-weight: 700;">Módulo V: Políticas Preventivas de Convivencia</h4>
          <p style="margin: 0; font-size: 13px; color: #475569; text-align: justify;">
            Comprensión de la política de espacios 100% libres de humo y prevención de adicciones, y directrices de protección de la dignidad laboral a cargo del Comité de Convivencia Laboral.
          </p>
        </div>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. LISTA DE COMPROBACIÓN DE ENTREGABLES Y EPP</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se deja constancia del entrenamiento y la entrega formal de los siguientes recursos preventivos al colaborador:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <thead>
            <tr style="background-color: #0284c7; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Aspecto / Entregable Ocupacional</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center; color: #ffffff;">Entregado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #ffffff;">Detalle / Observación</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Manual de Funciones y Riesgos del Puesto</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Explicación y firma del anexo de riesgos.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Elementos de Protección Personal (EPP)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Kit básico (Monogafas, protectores auditivos, guantes).</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Folletos y Ruta de Evacuación Física</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Recorrido físico de las instalaciones y botiquines.</td>
            </tr>
          </tbody>
        </table>

        <h3 style="color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. DECLARACIÓN Y COMPROMISO DE AUTOCUIDADO</h3>
        <p style="font-size: 13px; text-align: justify; color: #334155; margin-bottom: 24px;">
          Certifico mediante mi firma que he recibido de manera clara, didáctica y exhaustiva la inducción en Seguridad y Salud en el Trabajo, reconozco los riesgos de mi puesto y me comprometo a cumplir cabalmente con todas las normas de seguridad del SG-SST dispuestas por <strong>\${'{{empresa_nombre}}'}</strong>, cuidando activamente de mi salud y de la integridad de mis compañeros.
        </p>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #0284c7; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0f9ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#0284c7;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">TRABAJADOR INDUCIDO</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Huella y Firma</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #0284c7; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0f9ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#0284c7;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">FACILITADOR / RESPONSABLE SST</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma y Sello</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `.trim()},{id:"inspeccion_planeada",title:"Inspección de Seguridad",description:"Lista de chequeo para orden, aseo e instalaciones",icon:e.jsx(Fa,{className:"h-4 w-4 text-indigo-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 50%, #1e1b4b 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #4f46e5, #3730a3); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              FORMATO DE INSPECCIÓN PLANEADA DE SEGURIDAD, ORDEN Y ASEO
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              Inspección Periódica a Instalaciones Físicas y Puestos de Trabajo
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              SG-SST de \${'{{empresa_nombre}}'} - Decreto 1072 de 2015
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-FOR-004 | V.05
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #4f46e5, #3730a3); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  INFORMACIÓN DEL REGISTRO E INSPECTOR
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Nombre del Inspector:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-weight: 600; width: 25%;">[Nombre del Evaluador / COPASST]</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Fecha de Inspección:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; width: 25%;">\${new Date().toLocaleDateString('es-ES')}</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Área / Planta Evaluada:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0; font-weight: 600; color: #4f46e5;">[Área Oficinas y Producción]</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Frecuencia Planificada:</td>
                <td style="padding: 8px 12px;">Mensual Obligatoria</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Lista de Chequeo Categorizada -->
        <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. LISTA DE CHEQUEO APLICADA</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se realiza la valoración sistemática en los centros de trabajo puntuando el cumplimiento de seguridad:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #e2e8f0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <thead>
            <tr style="background-color: #4f46e5; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff;">Criterio / Elemento a Inspeccionar</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 12%; text-align: center; color: #ffffff;">Calificación</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 38%; color: #ffffff;">Descripción de Hallazgo / Condición Detectada</th>
            </tr>
          </thead>
          <tbody>
            <!-- A. Emergencias -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">A. EQUIPOS DE EMERGENCIA Y SEÑALIZACIÓN</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">1. Extintores portátiles vigentes, cargados y totalmente despejados.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Inspección de presión correcta. Señalizados.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">2. Rutas de evacuación y salidas de emergencia sin bloqueos físicos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Pasillos despejados y demarcación visible.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">3. Botiquines dotados con insumos de primeros auxilios vigentes.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626;">NO</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Falta gasa estéril y suero en botiquín de Recepción.</td>
            </tr>
            
            <!-- B. Locativas -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">B. CONDICIONES LOCATIVAS E INSTALACIONES</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">4. Pisos limpios, secos y completamente libres de obstáculos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Cumple con el programa corporativo 5S (Orden).</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">5. Cables eléctricos encauzados y protegidos en canaletas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #dc2626;">NO</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Cables expuestos debajo del escritorio de Contabilidad.</td>
            </tr>
            
            <!-- C. Ergonomia -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">C. ERGONOMÍA Y PUESTOS DE TRABAJO</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">6. Sillas ergonómicas regulables en altura y espaldar.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Sillas en buen estado. Se recomiendan descansapiés.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">7. Pantallas a la altura de los ojos y teclado con portamuñecas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Dotación de soportes elevadores completada.</td>
            </tr>

            <!-- D. EPP -->
            <tr style="background-color: #f5f3ff;">
              <td colspan="3" style="padding: 6px 10px; font-weight: bold; color: #4338ca; border: 1px solid #e2e8f0;">D. ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">8. Uso constante y obligatorio de EPP según el área.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Operadores de planta portan botas de seguridad y casco.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; padding-left: 20px;">9. EPP almacenados higiénicamente y reemplazados por desgaste.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #16a34a;">SÍ</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Casilleros individuales de almacenamiento limpios.</td>
            </tr>
          </tbody>
        </table>

        <!-- Registro y Plan de Acción de Hallazgos -->
        <h3 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. SEGUIMIENTO DE HALLAZGOS Y ACCIONES CORRECTIVAS</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Para todo aspecto calificado con "NO" cumple, se formaliza su plan de mitigación a continuación:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #4f46e5; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 35%;">Hallazgo Detectado</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 35%;">Acción Correctiva Sugerida</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 18%;">Responsable</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #ffffff; width: 12%; text-align: center;">Plazo</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Desabastecimiento de gasa estéril y suero en botiquín Piso 1.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Comprar y reponer insumos médicos vencidos del botiquín.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Líder SST</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: bold;">5 Días</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Cables sueltos sin canalizar en oficina Contabilidad (Piso 2).</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Canalizar e instalar canaletas plásticas protectoras de piso.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #475569;">Mantenimiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #dc2626; font-weight: bold;">8 Días</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #4f46e5; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f5f3ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#4f46e5;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">INSPECTOR / EVALUADOR</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Líder SST o COPASST</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #4f46e5; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f5f3ff; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#4f46e5;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">VISTO BUENO DIRECCIÓN</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Representante Legal / Gerencia</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `.trim()},{id:"analisis_riesgo_ats",title:"Análisis de Riesgo (ATS)",description:"Control de peligros and autorizaciones por tarea",icon:e.jsx(Jt,{className:"h-4 w-4 text-orange-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #7c2d12 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(234, 88, 12, 0.15), 0 8px 10px -6px rgba(234, 88, 12, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #ea580c, #c2410c); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              ANÁLISIS DE TRABAJO SEGURO (ATS)
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              Permiso de Trabajo Ocupacional y Gestión Preventiva de Peligros
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              Obligatorio para Tareas Especiales en \${'{{empresa_nombre}}'}
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-FOR-005 | V.06
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #ea580c, #c2410c); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  DESCRIPCIÓN DE LA TAREA Y RECURSOS
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; width: 25%;">Actividad a Realizar:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; font-weight: 600; color: #ea580c; width: 75%;" colspan="3">Trabajos de Mantenimiento Eléctrico en Alturas</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Ubicación / Área:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">Subestación Eléctrica Principal - Piso 2</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155;">Fecha del Trabajo:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">\${new Date().toLocaleDateString('es-ES')}</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">EPP Específico:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #e2e8f0;">Casco dieléctrico, guantes dieléctricos, arnés, eslinga doble.</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #f8fafc; border-right: 1px solid #e2e8f0; color: #334155;">Equipos / Herramientas:</td>
                <td style="padding: 8px 12px;">Medidor de tensión certificado, herramientas aisladas de 1000V.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Checklist de Permisos de Alto Riesgo -->
        <div style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 8px 0; color: #c2410c; font-size: 14px; font-weight: 700; text-transform: uppercase;">CHECKLIST DE VERIFICACIÓN DE TAREAS DE ALTO RIESGO (SÍ / NO)</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #7c2d12;">
            <tr>
              <td style="padding: 4px 0; font-weight: bold; width: 45%;">[SÍ] Trabajos en Alturas (H &gt; 2.0m)</td>
              <td style="padding: 4px 0; font-weight: bold; width: 5%;">|</td>
              <td style="padding: 4px 0; font-weight: bold; width: 45%;">[NO] Espacios Confinados</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;">[SÍ] Trabajos en Caliente (Soldadura/Chispas)</td>
              <td style="padding: 4px 0; font-weight: bold;">|</td>
              <td style="padding: 4px 0; font-weight: bold;">[SÍ] Bloqueo y Etiquetado de Energía (LOTO)</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-weight: bold;" colspan="3">[NO] Izaje Crítico de Cargas Pesadas</td>
            </tr>
          </table>
        </div>

        <!-- Secuencia de Operación Detallada (6 Pasos) -->
        <h3 style="color: #ea580c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. ANÁLISIS DE PASOS DE LA TAREA Y CONTROLES</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se desglosa la secuencia operativa analizando peligros y estableciendo barreras de contención específicas:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 11.5px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #ea580c; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; color: #ffffff;">Paso Secuencial</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 38%; color: #ffffff;">Peligros Potenciales / Riesgos</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 37%; color: #ffffff;">Medida de Control / Barrera de Seguridad</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">1. Delimitación y Señalización</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Ingreso de personal no autorizado, caídas, golpes.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de cinta de demarcación, conos reflexivos y letrero de "Trabajos en Alturas".</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">2. Inspección Preoperacional</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Falla estructural o dieléctrica de herramientas, lesiones corporales.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Diligenciamiento de preoperacional de arnés, escaleras e inspección visual de herramientas de 1000V.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">3. Bloqueo de Energía (LOTO)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Electrocución directa por arco eléctrico, descargas residuales.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Aplicar candado y tarjeta personal de bloqueo en el breaker principal. Confirmar ausencia de tensión.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">4. Ascenso y Posicionamiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Caída a diferente nivel, trauma por suspensión o impacto.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de eslinga de doble terminal en Y conectada a puntos de anclaje certificados. Mantener tres puntos de apoyo.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">5. Ejecución del Mantenimiento</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Quemaduras, choque eléctrico, caídas de herramientas.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Uso de guantes dieléctricos sobre protector de cuero, amarrar herramientas para evitar su caída, monitoreo continuo.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #ea580c;">6. Orden y Cierre de Área</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Locativos, caídas de nivel, residuos peligrosos dispersos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Retirar bloqueos de energías, recolectar herramientas, limpiar residuos y notificar el cierre del área.</td>
            </tr>
          </tbody>
        </table>

        <!-- Log de Ejecutores -->
        <h3 style="color: #ea580c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. REGISTRO DE TRABAJADORES EJECUTORES DEL TRABAJO</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Los firmantes declaran que comprenden a cabalidad los peligros del trabajo y las medidas de control establecidas:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 10px; border: 1px solid #e2e8f0;">Nombre Completo del Operario</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">Cédula de Ciudadanía</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%;">Firma de Compromiso</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 15%; text-align: center;">Hora Ingreso</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">1. [Escribir Nombre]</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">C.C. _______________</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic; color: #94a3b8; text-align: center;">Firmar al ingresar</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">_______</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">2. [Escribir Nombre]</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">C.C. _______________</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-style: italic; color: #94a3b8; text-align: center;">Firmar al ingresar</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">_______</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:60px; page-break-inside:avoid;">
          <table style="width:100%; border-collapse:collapse;">
            <tr>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #ea580c; min-height:80px; display:flex; align-items:center; justify-content:center; background:#fff7ed; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#ea580c;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">SUPERVISOR DE LA TAREA</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma de Aprobación</p>
              </td>
              <td style="width:4%;"></td>
              <td style="width:48%; text-align:center; padding:8px;">
                <div class="signature-placeholder" style="border-bottom:2px solid #ea580c; min-height:80px; display:flex; align-items:center; justify-content:center; background:#fff7ed; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                  <span style="font-size:11px; opacity:0.6; color:#ea580c;">Clic para firmar</span>
                </div>
                <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">COORDINADOR DE ALTURAS / SST</p>
                <p style="font-size:11px; margin:0; color:#64748b;">Firma Emisor de Permiso</p>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `.trim()},{id:"rit_tradicional",title:"RIT - Modelo Tradicional",description:"Reglamento Interno de Trabajo con enfoque legal estricto y de autoridad",icon:e.jsx(_t,{className:"h-4 w-4 text-slate-500"}),html:xr},{id:"rit_humanista",title:"RIT - Modelo Humanista",description:"Reglamento de convivencia enfocado en bio-individualidad, salud mental y bienestar",icon:e.jsx(Qt,{className:"h-4 w-4 text-rose-500"}),html:mr},{id:"plan_emergencias",title:"Plan de Emergencias",description:"Plan de prevención, preparación y respuesta ante emergencias (Decreto 1072)",icon:e.jsx(ut,{className:"h-4 w-4 text-red-500"}),html:`
      <div style="font-family: sans-serif; color: #334155; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px;">
        <!-- Contenedor del Encabezado Premium Tipo Banner (Imagen 4) -->
        <div style="background: linear-gradient(135deg, #be123c 0%, #9f1239 50%, #4c0519 100%); padding: 18px 24px; border-radius: 20px; margin-bottom: 20px; box-shadow: 0 10px 25px -5px rgba(190, 18, 60, 0.15), 0 8px 10px -6px rgba(190, 18, 60, 0.15); font-family: sans-serif; display: flex; align-items: center; gap: 20px; box-sizing: border-box; width: 100%; border: none; outline: none; page-break-inside: avoid;">
          <!-- Logo -->
          <div style="background-color: #ffffff; padding: 8px; border-radius: 14px; width: 56px; height: 56px; min-width: 56px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.2); box-sizing: border-box; overflow: hidden;">
            <div style="width: 40px; height: 40px; display: inline-flex; justify-content: center; align-items: center; background: linear-gradient(135deg, #be123c, #9f1239); border-radius: 8px; color: #ffffff; font-weight: 900; font-size: 14px;">
              WP
            </div>
          </div>
          
          <!-- Título y Subtítulos -->
          <div style="flex-grow: 1; min-width: 0; text-align: left;">
            <h1 style="margin: 0; font-size: 16px; font-weight: 850; color: #ffffff; text-transform: uppercase; line-height: 1.25; letter-spacing: 0.5px; text-shadow: 0 1px 2px rgba(0,0,0,0.15);">
              PLAN DE PREVENCIÓN, PREPARACIÓN Y RESPUESTA ANTE EMERGENCIAS
            </h1>
            <p style="margin: 4px 0 0; font-size: 9px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 0.75px;">
              Estructura de Brigadas y Protocolos Operativos Normalizados (PON)
            </p>
            <p style="margin: 2px 0 0; font-size: 8px; color: rgba(255,255,255,0.75); font-style: italic; font-weight: 500;">
              SG-SST de \${'{{empresa_nombre}}'} - Conforme al Decreto 1072 de 2015
            </p>
          </div>
          
          <!-- Badge Pill -->
          <div style="background-color: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 9999px; padding: 6px 16px; white-space: nowrap; box-sizing: border-box; align-self: center; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
              CÓDIGO: SST-PLN-006 | V.05
            </span>
          </div>
        </div>

        <!-- Tabla Resumen de la Entidad (Estilizada y Limpia) -->
        <div style="margin-bottom: 24px; font-family: sans-serif; overflow-x: auto; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
          <table style="width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #fca5a5; background-color: #ffffff;">
            <thead>
              <tr>
                <th colspan="4" style="background: linear-gradient(90deg, #be123c, #9f1239); color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; text-align: center; border: none;">
                  PUNTOS DE RESPUESTA CRÍTICA DE EMERGENCIA
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #fff5f5; border-bottom: 1px solid #fca5a5; border-right: 1px solid #fca5a5; color: #9f1239; width: 25%;">Punto de Encuentro:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #fca5a5; border-right: 1px solid #fca5a5; font-weight: 600; width: 25%;">Zona Verde Norte / Parque Central</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #fff5f5; border-bottom: 1px solid #fca5a5; border-right: 1px solid #fca5a5; color: #9f1239; width: 25%;">Jefe de Emergencias:</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #fca5a5; width: 25%;">Coordinador SST / Gerente Operativo</td>
              </tr>
              <tr style="font-size: 11px; color: #1e293b;">
                <td style="padding: 8px 12px; font-weight: bold; background-color: #fff5f5; border-right: 1px solid #fca5a5; color: #9f1239;">Línea de Bomberos:</td>
                <td style="padding: 8px 12px; border-right: 1px solid #fca5a5; font-weight: 600; color: #be123c;">119 / (601) 822-4444</td>
                <td style="padding: 8px 12px; font-weight: bold; background-color: #fff5f5; border-right: 1px solid #fca5a5; color: #9f1239;">Línea de ARL (Urgencias):</td>
                <td style="padding: 8px 12px;">01 8000 111 111</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Roles del Comité de Emergencias -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">1. ESTRUCTURA ORGANIZATIVA DEL COMITÉ</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">La brigada y el comité operativo de \${'{{empresa_nombre}}'} están coordinados bajo la siguiente cadena de mando:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <thead>
            <tr style="background-color: #be123c; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 30%; color: #ffffff;">Rol del Comité</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #ffffff;">Responsabilidad Principal</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 25%; color: #ffffff;">Miembro Designado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Director de Emergencias</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Tomar decisiones estratégicas y ordenar la evacuación total de instalaciones.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Gerente General</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada de Evacuación</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Guiar la salida ordenada del personal por rutas de evacuación y hacer el conteo físico.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Diana Morales / Oscar Torres</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada de Primeros Auxilios</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Brindar soporte y primeros auxilios básicos en la zona de clasificación de lesionados.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Liceth Ruiz / Dr. Andrés Gómez</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #be123c;">Brigada Contra Incendios</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0;">Afrontar conatos de incendio mediante uso de extintores y controlar servicios públicos.</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Carlos Ochoa / José Pérez</td>
            </tr>
          </tbody>
        </table>

        <!-- Protocolos Operativos Normalizados (PON) -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">2. PROTOCOLOS OPERATIVOS NORMALIZADOS (PON)</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Instrucciones preestablecidas de reacción y manejo para las contingencias más probables en la empresa:</p>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">A. Protocolo Operativo en caso de Conato de Incendio</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Valorar la magnitud del fuego:</strong> Si es menor (conato), proceda al ataque rápido; si es incontrolable, evacúe.</li>
            <li><strong>Alertar:</strong> Active el sistema manual de alarmas de emergencia y avise al líder de brigada.</li>
            <li><strong>Atacar el conato:</strong> Retire el pasador del extintor más cercano tipo ABC o CO2 y dirija la descarga a la base de la llama en forma de abanico.</li>
            <li><strong>Evacuar ordenadamente:</strong> Si el conato progresa, cierre puertas de escape sin llave y evacúe inmediatamente por la ruta.</li>
          </ol>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">B. Protocolo Operativo en caso de Sismo / Movimiento Telúrico</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Conservar la calma:</strong> No grite, evite generar pánico o salir corriendo en pleno sismo.</li>
            <li><strong>Buscar Refugio:</strong> Ubíquese bajo un mueble resistente (mesa/escritorio) o en columnas de la estructura. Aléjese de archivadores, ventanas y vidrios.</li>
            <li><strong>No use ascensores:</strong> Bajo ninguna circunstancia utilice elevadores durante la contingencia sísmica.</li>
            <li><strong>Evacuación Post-Sismo:</strong> Una vez finalizado el movimiento sísmico, proceda de forma ordenada a evacuar hacia el Punto de Encuentro.</li>
          </ol>
        </div>

        <div style="background-color: #fff1f2; border-left: 4px solid #be123c; padding: 14px; border-radius: 0 8px 8px 0; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h4 style="margin: 0 0 4px 0; color: #9f1239; font-size: 13.5px; font-weight: 700;">C. Protocolo en caso de Accidente Ocupacional Grave o Trauma</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12.5px; color: #881337; line-height: 1.5;">
            <li><strong>Proteger el área (Método PAS):</strong> Asegure el área de trabajo para evitar que usted o terceros sufran otra lesión.</li>
            <li><strong>Avisar de Inmediato:</strong> Notifique al líder de brigada de primeros auxilios y reporte a Urgencias de la ARL.</li>
            <li><strong>Socorrer:</strong> Brinde únicamente valoración primaria si cuenta con entrenamiento. No mueva al lesionado si se sospecha de fractura cervical.</li>
            <li><strong>Traslado:</strong> Coordine el traslado seguro en ambulancia certificada del lesionado al centro clínico de convenio de la ARL.</li>
          </ol>
        </div>

        <!-- Inventario de Recursos -->
        <h3 style="color: #be123c; border-bottom: 2px solid #fee2e2; padding-bottom: 6px; font-size: 16px; font-weight: 700; margin-top: 24px;">3. INVENTARIO DE RECURSOS DE RESPUESTA</h3>
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Se cuenta con los siguientes equipos activos de protección en las instalaciones corporativas:</p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11.5px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #fdf2f8; color: #9f1239; font-weight: 700; text-align: left;">
              <th style="padding: 10px; border: 1px solid #e2e8f0; color: #9f1239;">Equipo de Emergencia</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 20%; text-align: center; color: #9f1239;">Cantidad Activa</th>
              <th style="padding: 10px; border: 1px solid #e2e8f0; width: 45%; color: #9f1239;">Detalle / Ubicación Física</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Extintores Portátiles Multipropósito (ABC 10 lbs)</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">6 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Distribuidos por pasillos, subestación y bodegas.</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Botiquines Reglamentarios Tipo A</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">2 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Ubicados en Recepción y Planta de Producción.</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: 600;">Camillas Rígidas de Rescate Plásticas</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold;">2 Unidades</td>
              <td style="padding: 10px; border: 1px solid #e2e8f0; color: #64748b;">Instaladas en pared, con inmovilizador cervical y arnés de sujeción.</td>
            </tr>
          </tbody>
        </table>

        ${$t}
      </div>
    `.trim()},{id:"politica_desconexion",title:"Pol. Desconexión Laboral",description:"Regulación del descanso y salud digital (Ley 2191 de 2022)",icon:e.jsx(_t,{className:"h-4 w-4 text-indigo-500"}),html:fr},{id:"politica_acoso_laboral",title:"Pol. Acoso Laboral",description:"Prevención de acoso y convivencia armónica (Ley 1010)",icon:e.jsx(ut,{className:"h-4 w-4 text-emerald-500"}),html:ur},{id:"protocolo_acoso_laboral",title:"Prot. Acoso Laboral",description:"Ruta de quejas y mediación del Comité de Convivencia",icon:e.jsx(Jt,{className:"h-4 w-4 text-teal-500"}),html:br},{id:"politica_acoso_sexual",title:"Pol. Acoso Sexual",description:"Prevención y tolerancia cero frente a agresión sexual (Ley 2365)",icon:e.jsx(ut,{className:"h-4 w-4 text-rose-500"}),html:gr},{id:"protocolo_acoso_sexual",title:"Prot. Acoso Sexual",description:"Ruta de atención urgente y medidas cautelares (Ley 2365)",icon:e.jsx(Ca,{className:"h-4 w-4 text-purple-500"}),html:hr},{id:"politica_genero",title:"Pol. Equidad de Género",description:"Plan de igualdad de oportunidades y brecha salarial cero",icon:e.jsx(Qt,{className:"h-4 w-4 text-blue-500"}),html:yr},{id:"contrato_indefinido",title:"Contrato Término Indefinido",description:"Contrato de trabajo estándar sin límite de tiempo vinculante",icon:e.jsx(st,{className:"h-4 w-4 text-slate-500"}),html:vr},{id:"contrato_definido",title:"Contrato Término Fijo",description:"Contrato laboral con fecha de vencimiento y prórrogas",icon:e.jsx(st,{className:"h-4 w-4 text-blue-800"}),html:wr},{id:"contrato_servicios",title:"Prestación de Servicios",description:"Contrato civil/comercial independiente con autonomía técnica",icon:e.jsx(st,{className:"h-4 w-4 text-teal-600"}),html:jr},{id:"contrato_obra_labor",title:"Contrato de Obra o Labor",description:"Contrato laboral condicionado al fin de un proyecto u obra",icon:e.jsx(st,{className:"h-4 w-4 text-orange-700"}),html:Nr},{id:"procedimiento_sancionatorio",title:"Procedimiento Sancionatorio",description:"Debido proceso disciplinario, descargos y apelación (C-593/14 y Ley 2466 de 2025)",icon:e.jsx(_t,{className:"h-4 w-4 text-slate-700"}),html:Sr}],$r=[{id:"inlay_signatures",title:"Bloque de Firmas SST",description:"Inyectar firmas de Líder SST y Representante de Trabajadores",icon:e.jsx(ka,{className:"h-4.5 w-4.5 text-teal-600 dark:text-teal-400"}),html:`
      <div style="margin-top:50px; page-break-inside:avoid; font-family: sans-serif;">
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <td style="width:48%; text-align:center; padding:8px;">
              <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
              </div>
              <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">LÍDER / COORD. SST</p>
              <p style="font-size:11px; margin:0; color:#64748b;">Firma y Cédula</p>
            </td>
            <td style="width:4%;"></td>
            <td style="width:48%; text-align:center; padding:8px;">
              <div class="signature-placeholder" style="border-bottom:2px solid #0f766e; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
                <span style="font-size:11px; opacity:0.6; color:#0f766e;">Clic para firmar</span>
              </div>
              <p style="font-size:12px; font-weight:bold; margin:4px 0 2px; color:#334155;">REPRESENTANTE DE TRABAJADORES</p>
              <p style="font-size:11px; margin:0; color:#64748b;">Firma y Cédula</p>
            </td>
          </tr>
        </table>
      </div>
    `.trim()},{id:"inlay_alert_card",title:"Banderola de Alerta",description:"Inyectar un recuadro llamativo de advertencia de peligro",icon:e.jsx(Ca,{className:"h-4.5 w-4.5 text-amber-500"}),html:`
      <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 16px; border-radius: 0 12px 12px 0; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; color: #b45309; font-size: 15px; font-weight: 700;">🚨 ALERTA DE RIESGO DETECTADO</h4>
        <p style="margin: 0; color: #78350f; font-size: 13px;">Se ha identificado una condición subestándar en las instalaciones físicas. Tome medidas de contención de inmediato y proceda con el aislamiento y señalización del área.</p>
      </div>
    `.trim()},{id:"inlay_action_table",title:"Tabla Plan de Acción",description:"Inyectar tabla estilizada para el seguimiento de actividades",icon:e.jsx(Jt,{className:"h-4.5 w-4.5 text-indigo-500"}),html:`
      <div style="overflow-x: auto; margin: 20px 0; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); font-family: sans-serif;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #0f766e; color: #ffffff; font-weight: 700; text-align: left;">
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; color: #ffffff;">Acción Preventiva / Correctiva</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 25%; color: #ffffff;">Responsable</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 20%; color: #ffffff;">Fecha Límite</th>
              <th style="padding: 12px; border-bottom: 2px solid #0f766e; width: 15%; text-align: center; color: #ffffff;">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px; font-weight: 600;">Comprar y reponer insumos vencidos de botiquines</td>
              <td style="padding: 12px; color: #475569;">Coordinador de Compras</td>
              <td style="padding: 12px; color: #475569;">2026-05-30</td>
              <td style="padding: 12px; text-align: center;"><span style="background-color: #fef3c7; color: #d97706; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">Pendiente</span></td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0; background-color: #f8fafc;">
              <td style="padding: 12px; font-weight: 600;">Realizar simulacro de evacuación anual</td>
              <td style="padding: 12px; color: #475569;">Brigada de Emergencia</td>
              <td style="padding: 12px; color: #475569;">2026-06-15</td>
              <td style="padding: 12px; text-align: center;"><span style="background-color: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">Planificado</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `.trim()}],Or=({initialContent:s,onUpdate:y,onApplyTemplate:i,reportSourceData:O,isMaximized:C})=>{const{token:p}=wt(),$=l.useRef(null),d=l.useRef(null),[S,j]=l.useState(!1),[k,H]=l.useState("templates"),[Pe,le]=l.useState(!1),[Q,_]=l.useState(!1),W=F=>{var re;const z=((re=$.current)==null?void 0:re.getHTML())||s||"";let be="";const Ee=z.indexOf('<div style="background: linear-gradient');if(Ee!==-1){let te=z.match(/<\/table>\s*<\/div>/i);if(te||(te=z.match(/<\/table>/i)),te){const f=z.indexOf(te[0],Ee);f!==-1&&(be=z.substring(Ee,f+te[0].length))}}else{const te=z.indexOf('<div style="overflow-x: auto;');if(te!==-1){let f=z.match(/<\/table>\s*<\/div>/i)||z.match(/<\/table>/i);if(f){const M=z.indexOf(f[0],te);M!==-1&&(be=z.substring(te,M+f[0].length))}}}let Ne="";const ge=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div class="signature-placeholder'];for(const te of ge){const f=z.lastIndexOf(te);if(f!==-1){Ne=z.substring(f);break}}let ve="";return be&&(ve+=be+`

`),ve+=F,Ne?ve+=`

`+Ne:ve+=`

`+$t,ve},Oe=async F=>{var Ee,Ne;const z=(Ee=F.target.files)==null?void 0:Ee[0];if(!z)return;const be=new FormData;be.append("file",z);try{_(!0);const ge=await fetch("/api/live/documents/extract",{method:"POST",headers:{Authorization:`Bearer ${p}`},body:be});if(!ge.ok){const f=await ge.json().catch(()=>({}));throw new Error(f.error||`Error del servidor (${ge.status})`)}const ve=await ge.json();let re="";if(ve.html?re=ve.html:ve.text&&(re=ve.text.split(`

`).filter(f=>f.trim()).map(f=>`<p>${f.trim().replace(/\n/g,"<br/>")}</p>`).join(`
`)),!re)throw new Error("No se pudo extraer ningún texto del documento cargado.");const te=W(re);(Ne=$.current)==null||Ne.setHTML(te),y(te)}catch(ge){console.error("[CanvasTextEditor] Upload error:",ge),alert(ge.message||"Error al subir el archivo")}finally{_(!1),F.target.value=""}},ke=F=>{var z,be;$.current&&((be=(z=$.current).insertHTML)==null||be.call(z,F))};l.useEffect(()=>{if(s&&$.current){const F=$.current.getHTML(),z=be=>be.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,"").trim();z(s)!==z(F)&&$.current.setHTML(s)}},[s]);const je=(F,z)=>{window.confirm(`¿Deseas reemplazar el contenido actual por el formato "${z}"? Se perderán las modificaciones no guardadas.`)&&$.current&&($.current.setHTML(F),i?i(F,z):y(F))},me=F=>{$.current&&$.current.insertHTML(F)};return e.jsxs("div",{className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[S&&e.jsx("div",{className:`${C?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>j(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${C?"sm:relative sm:z-0":"shadow-2xl"} ${S?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(bt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Normativa SST"})]}),e.jsx("button",{onClick:()=>j(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex p-1.5 bg-surface-primary/60 border-b border-border-medium/60 shrink-0 gap-1",children:[e.jsx("button",{onClick:()=>H("templates"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${k==="templates"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold border border-teal-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"15 Plantillas SST"}),e.jsx("button",{onClick:()=>H("inlays"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${k==="inlays"?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs font-extrabold border border-emerald-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"Bloques Rápidos"})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:k==="templates"?e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Formatos y Políticas Oficiales"}),zr.map(F=>e.jsxs("button",{onClick:()=>{je(F.html,F.title),C||j(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:F.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:F.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:F.description})]})]},F.id))]}):e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Inyectores en el Cursor"}),$r.map(F=>e.jsxs("button",{onClick:()=>{me(F.html),C||j(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:F.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-emerald-600 transition-colors",children:F.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:F.description})]})]},F.id))]})})]}),e.jsxs("div",{className:"flex-1 h-full overflow-hidden relative flex flex-col",children:[e.jsx("input",{type:"file",ref:d,className:"hidden",accept:".docx,.doc",onChange:Oe}),e.jsx("div",{className:"flex-1 overflow-hidden relative",children:e.jsx(pr,{ref:$,initialContent:s,onUpdate:y,reportType:"general",paperMode:!0,hideFullscreen:!1,reportSourceData:O,hideToolbarWhenCollapsed:!1,onToggleTemplates:()=>j(F=>!F),isTemplatesOpen:S,onUploadDocument:()=>{var F;return(F=d.current)==null?void 0:F.click()},isUploadingDocument:Q,onOpenAiBridge:()=>le(!0)})})]}),Pe&&e.jsx(aa,{onClose:()=>le(!1),onImportTable:ke,onImportMedia:(F,z)=>ke(z),activeFileType:"text",initialTab:"media"})]})};function Et(s){const y=s.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);if(!y)return null;const i=y[1],O=y[2];let C=0;for(let $=0;$<i.length;$++)C=C*26+(i.charCodeAt($)-64);return C=C-1,{row:parseInt(O,10)-1,col:C}}function Ht(s,y,i,O=new Set){var S;const C=`${s},${y}`;if(O.has(C))return 0;O.add(C);const p=(S=i[s])==null?void 0:S[y],$=p!=null?String(p):"";if($.startsWith("=")){const j=yt($,i,O),k=parseFloat(j);return O.delete(C),isNaN(k)?0:k}O.delete(C);const d=parseFloat($);return isNaN(d)?0:d}function yt(s,y,i=new Set){const O=s!=null?String(s):"";if(!O||!O.startsWith("="))return O;const C=s.toUpperCase().trim(),p=C.match(/^=(SUM|SUMA|AVERAGE|PROMEDIO|MAX|MIN|COUNT|CONTAR)\((.+?)\)$/);if(p){const S=p[1],k=p[2].split(/[,;]/),H=[];for(const Pe of k){const le=Pe.trim(),Q=le.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);if(Q){const _=Et(Q[1]),W=Et(Q[2]);if(_&&W){const Oe=Math.min(_.row,W.row),ke=Math.max(_.row,W.row),je=Math.min(_.col,W.col),me=Math.max(_.col,W.col);for(let F=Oe;F<=ke;F++)for(let z=je;z<=me;z++)H.push(Ht(F,z,y,i))}}else{const _=Et(le);if(_)H.push(Ht(_.row,_.col,y,i));else{const W=parseFloat(le);isNaN(W)||H.push(W)}}}if(S==="SUM"||S==="SUMA"){const Pe=H.reduce((le,Q)=>le+Q,0);return(Math.round(Pe*1e4)/1e4).toString()}else if(S==="AVERAGE"||S==="PROMEDIO"){if(H.length===0)return"0";const le=H.reduce((Q,_)=>Q+_,0)/H.length;return(Math.round(le*1e4)/1e4).toString()}else{if(S==="MAX")return H.length===0?"0":Math.max(...H).toString();if(S==="MIN")return H.length===0?"0":Math.min(...H).toString();if(S==="COUNT"||S==="CONTAR")return H.length.toString()}}let $=C.slice(1);$=$.replace(/([A-Z]+[0-9]+)/g,S=>{const j=Et(S);return j?Ht(j.row,j.col,y,i).toString():S});const d=$.replace(/[^0-9+\-*/().\s]/g,"");try{const S=new Function(`return (${d})`)();return typeof S=="number"&&!isNaN(S)?(Math.round(S*1e4)/1e4).toString():"0"}catch{return"0"}}function Vt(s){let y="",i=s;for(;i>=0;)y=String.fromCharCode(i%26+65)+y,i=Math.floor(i/26)-1;return y}const Dr=({initialContent:s,onUpdate:y,title:i,onRegisterDownload:O,isMaximized:C=!1})=>{var ie,q;const[p,$]=l.useState({"Hoja 1":[["","",""],["","",""],["","",""]]}),[d,S]=l.useState("Hoja 1"),j=p[d]||[["","",""],["","",""],["","",""]],[k,H]=l.useState(null),[Pe,le]=l.useState(""),Q=l.useRef(null),_=l.useRef(null),[W,Oe]=l.useState(!1),[ke,je]=l.useState(!1),[me,F]=l.useState(!1);l.useEffect(()=>{const r=()=>{Oe(!!document.fullscreenElement)};return document.addEventListener("fullscreenchange",r),()=>document.removeEventListener("fullscreenchange",r)},[]);const z=async()=>{const r=_.current;if(document.fullscreenElement)try{document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen()}catch(x){console.error("Exit fullscreen failed:",x)}else try{r!=null&&r.requestFullscreen?await r.requestFullscreen():r.webkitRequestFullscreen&&await r.webkitRequestFullscreen()}catch(x){console.error("Fullscreen request failed:",x)}},[be,Ee]=l.useState(!1),[Ne,ge]=l.useState("bar"),[ve,re]=l.useState(0),[te,f]=l.useState(1),[M,R]=l.useState(null),[fe,X]=l.useState({x:0,y:0}),[se,He]=l.useState(!1),[Te,Ye]=l.useState("sum"),Ie=(()=>{let r=0;return Array.isArray(j)&&j.forEach(x=>{Array.isArray(x)&&x.length>r&&(r=x.length)}),r||3})(),Ve=(()=>{let r=0,x=0;if(Array.isArray(j)){const g=Math.min(10,j.length);for(let h=0;h<g;h++){const t=(j[h]||[]).filter(a=>a&&String(a).trim()!=="").length;t>x&&(x=t,r=h)}}return r})(),_e=j[Ve]||[],Le=Array.from({length:Ie}).map((r,x)=>{const g=_e[x]?String(_e[x]).trim():"";return{index:x,label:g||`Columna ${Vt(x)}`}}),Me=Array.isArray(j)?j.slice(Ve+1).filter(r=>Array.isArray(r)&&r.some(x=>x!=null&&String(x).trim()!=="")):[],qe={};Me.forEach((r,x)=>{const g=r[ve],h=g!=null?String(g):"",t=(h.startsWith("=")?yt(h,j):h).trim()||`Fila ${x+1+Ve+1}`,a=t.toUpperCase();if(a.includes("TOTAL")||a.includes("CÁLCULO")||a.includes("PROMEDIO")||a.includes("SUMA")||a.includes("CONCEPTO"))return;const n=r[te],o=n!=null?String(n):"",m=o.startsWith("=")?yt(o,j):o,u=parseFloat(String(m||"").replace(/[^0-9.\-]/g,"")),b=isNaN(u)?0:u;qe[t]||(qe[t]=[]),qe[t].push(b)});const he=Object.keys(qe).map(r=>{const x=qe[r];let g=0;return Te==="sum"?g=x.reduce((h,E)=>h+E,0):Te==="avg"?g=x.reduce((h,E)=>h+E,0)/x.length:Te==="count"&&(g=x.length),{label:r,val:Math.round(g*100)/100,count:x.length}}).filter(r=>r.label&&(r.val>0||Te==="count")),ne=he.length,ae=he.map(r=>r.val),xe=ae.reduce((r,x)=>r+x,0),N=ne>0?xe/ne:0,D=ne>0?Math.max(...ae):0,ye=ne>0?Math.min(...ae):0,I=ae.indexOf(D),Be=ae.indexOf(ye),Fe=I!==-1?he[I].label:"---",Ge=Be!==-1?he[Be].label:"---";l.useEffect(()=>{var r;if(j&&j[0]&&j[0].length>1)for(let x=1;x<j[0].length;x++){let g=!1;for(let h=1;h<j.length;h++){const E=(r=j[h])==null?void 0:r[x],a=(E!=null?String(E):"").replace(/[^0-9.\-]/g,"");if(a&&!isNaN(parseFloat(a))){g=!0;break}}if(g){f(x);break}}},[j]);const Re=r=>{const x={...p,[d]:r};$(x);const g=Object.keys(x),h=g.length>1||g[0]!=="Hoja 1";y(JSON.stringify(h?x:r))};l.useEffect(()=>{const r=g=>{if(!Array.isArray(g))return null;if(g.length===0)return[["","",""],["","",""],["","",""]];if(g.every(h=>Array.isArray(h)))return g.map(h=>h.map(E=>E==null?"":String(E)));if(g.every(h=>h&&typeof h=="object"&&!Array.isArray(h))){const h=Array.from(new Set(g.flatMap(E=>Object.keys(E))));if(h.length>0)return[h,...g.map(E=>h.map(t=>E[t]===null||E[t]===void 0?"":String(E[t])))]}return null},x=g=>{if(!g)return!1;const h=r(g);if(h)return $({"Hoja 1":h}),S("Hoja 1"),!0;if(typeof g=="object"&&!Array.isArray(g)){const E=g.sheets||g.rows||g.data;if(E)return x(E);const t=Object.keys(g);if(t.length>0){const a={};let n=!0;for(const o of t){const m=r(g[o]);if(!m){n=!1;break}a[o]=m}if(n)return $(a),a[d]||S(t[0]),!0}}return!1};if(s)if(typeof s!="string"){if(x(s))return}else{const g=s.trim().replace(/^```(?:json|csv)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim();try{const h=JSON.parse(g);if(x(h))return}catch(h){const E=g.indexOf("["),t=g.lastIndexOf("]");if(E!==-1&&t>E)try{const a=JSON.parse(g.slice(E,t+1));if(x(a))return}catch{}console.warn("Failed to parse excel content JSON, using fallback",h)}}$(g=>{var t,a,n,o;const h=Object.keys(g);return!g||h.length===0||h.length===1&&(((t=g["Hoja 1"])==null?void 0:t.length)<=1||((a=g["Hoja 1"])==null?void 0:a.length)===3&&((o=(n=g["Hoja 1"])==null?void 0:n[0])==null?void 0:o.every(m=>m==="")))?{"Hoja 1":[["Indicador","Meta","Resultado","Cumplimiento"],["Capacitaciones Realizadas","12","10","83.3%"],["Simulacros de Emergencia","2","2","100%"],["Inspecciones de Seguridad","24","18","75%"]]}:g})},[s]);const ze=(r,x,g)=>{const h=j.map((E,t)=>E.map((a,n)=>t===r&&n===x?g:a));Re(h)},Qe=(r,x)=>{var g;H({row:r,col:x}),le(((g=j[r])==null?void 0:g[x])||"")},Xe=r=>{const x=r.target.value;le(x),k&&ze(k.row,k.col,x)},at=()=>{var h;const r=((h=j[0])==null?void 0:h.length)||3,x=Array(r).fill(""),g=[...j,x];Re(g)},ot=()=>{if(j.length<=1)return;const r=j.slice(0,-1);Re(r),H(null)},et=()=>{const r=j.map(x=>[...x,""]);Re(r)},Ke=()=>{var x;if(((x=j[0])==null?void 0:x.length)<=1)return;const r=j.map(g=>g.slice(0,-1));Re(r),H(null)},tt=async()=>{var E;const r=new Ga.Workbook,x=r.addWorksheet("Reporte Canvas");x.views=[{showGridLines:!0}],j.forEach((t,a)=>{const n=x.getRow(a+1);t.forEach((o,m)=>{const u=n.getCell(m+1);if(o&&String(o).startsWith("=")){const b=String(o).slice(1).trim().toUpperCase();u.value={formula:b}}else{const b=Number(o);o!==""&&!isNaN(b)?u.value=b:u.value=o}u.border={top:{style:"thin",color:{argb:"FFD1D5DB"}},left:{style:"thin",color:{argb:"FFD1D5DB"}},bottom:{style:"thin",color:{argb:"FFD1D5DB"}},right:{style:"thin",color:{argb:"FFD1D5DB"}}},a===0?(u.font={name:"Segoe UI",bold:!0,color:{argb:"FFFFFFFF"},size:11},u.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0D9488"}},u.alignment={vertical:"middle",horizontal:"center"}):(u.font={name:"Segoe UI",size:10},u.alignment={vertical:"middle",horizontal:"left"},a%2===0&&(u.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF9FAFB"}}))})}),(E=x.columns)==null||E.forEach(t=>{var n;let a=0;(n=t.eachCell)==null||n.call(t,{includeEmpty:!0},o=>{const m=o.value?String(o.value):"";m.length>a&&(a=m.length)}),t.width=Math.max(a+4,12)});const g=await r.xlsx.writeBuffer(),h=new Blob([g],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});ea.saveAs(h,`${i}.xlsx`)},v=()=>{if(!j||j.length===0)return;let r=`<table style="width: 100%; max-width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1f2937; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">`;r+='<thead style="background-color: #0d9488; color: #ffffff; text-align: left; font-weight: bold;"><tr>',j[0].forEach(x=>{r+=`<th style="padding: 12px 16px; border-bottom: 2px solid #0f766e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${x||""}</th>`}),r+="</tr></thead>",r+="<tbody>",j.slice(1).forEach((x,g)=>{const h=g%2===0?"#ffffff":"#f9fafb";r+=`<tr style="background-color: ${h}; border-bottom: 1px solid #e5e7eb;">`,x.forEach(E=>{const t=E&&String(E).startsWith("=")?yt(String(E),j):E;r+=`<td style="padding: 10px 16px; vertical-align: middle;">${t||""}</td>`}),r+="</tr>"}),r+="</tbody></table>",navigator.clipboard.writeText(r).then(()=>{He(!0),setTimeout(()=>He(!1),2500)}).catch(x=>{console.error("No se pudo copiar el HTML al portapapeles:",x)})},w=(r,x,g)=>{let h=x,E=g;if(r.key==="ArrowUp")r.preventDefault(),h=Math.max(0,x-1);else if(r.key==="ArrowDown")r.preventDefault(),h=Math.min(j.length-1,x+1);else if(r.key==="ArrowLeft"){const t=r.currentTarget;if(t.selectionStart===0&&t.selectionEnd===0)r.preventDefault(),E=Math.max(0,g-1);else return}else if(r.key==="ArrowRight"){const t=r.currentTarget;if(t.selectionStart===t.value.length&&t.selectionEnd===t.value.length)r.preventDefault(),E=Math.min(j[0].length-1,g+1);else return}else if(r.key==="Enter")r.preventDefault(),h=Math.min(j.length-1,x+1);else if(r.key==="Tab")r.preventDefault(),r.shiftKey?E=Math.max(0,g-1):E=Math.min(j[0].length-1,g+1);else return;(h!==x||E!==g)&&(H({row:h,col:E}),le(j[h][E]||""),setTimeout(()=>{const t=document.getElementById(`cell-${h}-${E}`);t&&(t.focus(),t.select())},10))};return l.useEffect(()=>{O&&O(tt)},[O,j,i]),e.jsxs("div",{ref:_,className:"flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex flex-col gap-2 p-3 border-b border-border-medium bg-surface-secondary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold h-8 w-12 rounded-lg border border-teal-500/20",children:k?`${Vt(k.col)}${k.row+1}`:"---"}),e.jsxs("div",{className:"flex-1 relative flex items-center",children:[e.jsxs("span",{className:"absolute left-2.5 text-text-tertiary font-serif text-sm select-none",children:["ƒ",e.jsx("sub",{children:"x"})]}),e.jsx("input",{type:"text",value:Pe,onChange:Xe,disabled:!k,placeholder:k?"Introduce datos o fórmula...":"Selecciona una celda para editar",className:"w-full h-8 pl-8 pr-3 text-xs bg-surface-primary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsx(pe,{onClick:at,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Agregar Fila",title:"Añadir nueva fila al final",variant:"emerald",size:"sm"}),e.jsx(pe,{onClick:ot,disabled:j.length<=1,icon:e.jsx(pt,{className:"h-4 w-4"}),label:"Quitar Fila",title:"Eliminar fila seleccionada o última fila",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium"}),e.jsx(pe,{onClick:et,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Agregar Columna",title:"Añadir nueva columna a la derecha",variant:"emerald",size:"sm"}),e.jsx(pe,{onClick:Ke,disabled:((ie=j[0])==null?void 0:ie.length)<=1,icon:e.jsx(pt,{className:"h-4 w-4"}),label:"Quitar Columna",title:"Eliminar columna seleccionada o última columna",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium hidden sm:block"}),e.jsxs("div",{className:"relative",children:[e.jsx(pe,{onClick:()=>{je(r=>!r),F(!1)},icon:e.jsx(bt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Cargar matrices y presupuestos SG-SST con fórmulas automáticas",variant:"amber",size:"sm",isActive:ke}),ke&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Matrices y Hojas de Cálculo SG-SST"}),e.jsxs("button",{onClick:()=>{Re([["Proceso / Área","Peligro (GTC-45)","Clasificación","ND","NE","NP (ND*NE)","NC","NR (NP*NC)","Control de Ingeniería / Medio"],["Operaciones / Planta","Levantamiento manual de cargas","Biomecánico","6","4","=D2*E2","25","=F2*G2","Ayudas mecánicas hidráulicas"],["Mantenimiento","Trabajos en alturas > 2.0m","Condiciones de Seguridad","6","3","=D3*E3","60","=F3*G3","Línea de vida certificada Res. 4272"],["Producción","Ruido continuo > 85 dBA","Físico","2","4","=D4*E4","25","=F4*G4","Encapsulamiento acústico en fuente"],["Administración","Carga mental y pantallas PVD","Psicosocial","2","3","=D5*E5","10","=F5*G5","Pausas activas y ajuste ergonómico"],["PROMEDIO / MÁXIMO RIESGO","-","-","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=MAX(G2:G5)","=MAX(H2:H5)","Intervención Prioritaria"]]),je(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Matriz de Peligros GTC-45"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Cálculo automático de NP (ND*NE) y Nivel de Riesgo NR"})]}),e.jsxs("button",{onClick:()=>{Re([["Rubro SG-SST (Dec. 1072)","Presupuesto Asignado ($)","Ejecutado Q1 ($)","Ejecutado Q2 ($)","Total Ejecutado ($)","Saldo Disponible ($)"],["Medicina Preventiva y EMO","4500000","1200000","1800000","=C2+D2","=B2-E2"],["Elementos de Protección EPP","6800000","2500000","2900000","=C3+D3","=B3-E3"],["Capacitación y Brigadas","3200000","900000","1400000","=C4+D4","=B4-E4"],["Mediciones Higiénicas","5000000","0","3500000","=C5+D5","=B5-E5"],["TOTAL PRESUPUESTO SST","=SUMA(B2:B5)","=SUMA(C2:C5)","=SUMA(D2:D5)","=SUMA(E2:E5)","=SUMA(F2:F5)"]]),je(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Presupuesto Anual SG-SST"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Control de ejecución trimestral y saldo disponible"})]}),e.jsxs("button",{onClick:()=>{Re([["Indicador Resolución 0312/2019","Meta (%)","Enero","Febrero","Marzo","Promedio Trimestral"],["Frecuencia de Accidentalidad","0","0","1","0","=PROMEDIO(C2:E2)"],["Severidad de Accidentalidad","0","0","3","0","=PROMEDIO(C3:E3)"],["Cumplimiento Plan de Trabajo","95","90","94","98","=PROMEDIO(C4:E4)"],["Cobertura Inducción SST","100","100","100","100","=PROMEDIO(C5:E5)"]]),je(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Indicadores Resolución 0312"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Frecuencia, severidad y cumplimiento trimestral"})]})]})]}),e.jsxs("div",{className:"relative",children:[e.jsx(pe,{onClick:()=>{F(r=>!r),je(!1)},icon:e.jsx(_a,{className:"h-4 w-4"}),label:"Insertar Fórmula",title:"Insertar fórmula automática en la celda activa (=SUMA, =PROMEDIO, =MAX, =MIN)",variant:"purple",size:"sm",isActive:me}),me&&e.jsxs("div",{className:"absolute left-0 mt-2 w-60 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Fórmulas en Celda Activa"}),[{fn:"=SUMA(B2:B5)",desc:"Suma de rango vertical"},{fn:"=PROMEDIO(B2:B5)",desc:"Promedio aritmético"},{fn:"=MAX(B2:B5)",desc:"Valor máximo del rango"},{fn:"=MIN(B2:B5)",desc:"Valor mínimo del rango"},{fn:"=CONTAR(B2:B5)",desc:"Conteo de registros"}].map(r=>e.jsxs("button",{onClick:()=>{const x=(k==null?void 0:k.row)??j.length-1,g=(k==null?void 0:k.col)??1;ze(x,g,r.fn),le(r.fn),F(!1)},className:"w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-500/10 transition-colors flex items-center justify-between cursor-pointer",children:[e.jsx("span",{className:"text-xs font-mono font-bold text-purple-600 dark:text-purple-400",children:r.fn}),e.jsx("span",{className:"text-[10px] text-text-tertiary",children:r.desc})]},r.fn))]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(pe,{onClick:v,icon:e.jsx(Dt,{className:"h-4 w-4"}),label:"Copiar Tabla",title:"Copiar tabla formateada para pegar en un Documento o Informe",variant:"fuchsia",size:"sm"}),e.jsx(pe,{onClick:()=>Ee(!be),icon:e.jsx(Ea,{className:"h-4 w-4"}),label:"Analizar y Graficar",title:"Abrir centro de análisis estadístico y gráficos interactivos",variant:"orange",size:"sm",isActive:be}),C&&e.jsx(pe,{onClick:z,icon:W?e.jsx(Xt,{className:"h-4 w-4"}):e.jsx(Aa,{className:"h-4 w-4"}),label:W?"Salir":"Pantalla Completa",title:W?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"}),e.jsx(pe,{onClick:tt,icon:e.jsx(gt,{className:"h-4 w-4"}),label:"Descargar Hoja",title:"Descargar hoja de cálculo con formato corporativo",variant:"green",size:"sm"})]})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden relative",children:[e.jsxs("div",{className:"flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-secondary/40",children:[e.jsx("div",{className:"flex-1 overflow-auto p-4",ref:Q,children:e.jsx("div",{className:"inline-block min-w-full align-middle border border-border-medium rounded-xl shadow-sm overflow-hidden bg-surface-primary",children:e.jsxs("table",{className:"min-w-full border-collapse text-left font-sans text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-surface-secondary select-none",children:[e.jsx("th",{className:"w-10 border-r border-b border-border-medium text-center font-mono font-bold text-text-tertiary p-1.5"}),(q=j[0])==null?void 0:q.map((r,x)=>e.jsx("th",{className:"border-r border-b border-border-medium text-center font-mono font-bold text-text-secondary px-3 py-1.5 min-w-[120px]",children:Vt(x)},x))]})}),e.jsx("tbody",{children:j.map((r,x)=>e.jsxs("tr",{className:"hover:bg-surface-hover/30 transition-colors",children:[e.jsx("td",{className:"border-r border-b border-border-medium text-center font-mono font-bold bg-surface-secondary text-text-tertiary select-none p-1.5",children:x+1}),r.map((g,h)=>{const E=(k==null?void 0:k.row)===x&&(k==null?void 0:k.col)===h,t=E?g:yt(g,j);return e.jsx("td",{onClick:()=>Qe(x,h),className:`border-r border-b border-border-medium px-3 py-2 cursor-pointer transition-all ${E?"bg-teal-500/10 outline outline-2 outline-teal-500 z-10":"hover:bg-teal-500/5"}`,children:e.jsx("input",{id:`cell-${x}-${h}`,type:"text",value:t,onFocus:()=>Qe(x,h),onKeyDown:a=>w(a,x,h),onChange:a=>{ze(x,h,a.target.value),le(a.target.value)},className:"w-full bg-transparent border-none outline-none text-text-primary cursor-pointer focus:cursor-text"})},h)})]},x))})]})})}),e.jsxs("div",{className:"flex items-center justify-between border-t border-border-medium bg-surface-secondary px-4 py-2 mt-auto select-none",children:[e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] pr-2 scrollbar-none",children:Object.keys(p).map(r=>{const x=d===r;return e.jsxs("button",{onClick:()=>{S(r),H(null)},className:`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${x?"bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold shadow-sm":"bg-transparent border border-transparent text-text-secondary hover:text-text-primary"}`,children:[e.jsx(vt,{className:`h-3.5 w-3.5 ${x?"text-teal-500":"text-text-secondary"}`}),e.jsx("span",{children:r})]},r)})}),e.jsxs("div",{className:"flex items-center gap-2",children:[ne>0&&e.jsxs("div",{className:"hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl border border-teal-500/20 bg-teal-500/5 text-[10px] font-mono font-bold text-text-secondary",children:[e.jsxs("span",{children:["Suma: ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400",children:xe.toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Prom: ",e.jsx("strong",{className:"text-emerald-600 dark:text-emerald-400",children:(Math.round(N*100)/100).toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Filas: ",e.jsx("strong",{children:j.length})]})]}),e.jsx(pe,{onClick:()=>{const r=`Hoja ${Object.keys(p).length+1}`,x={...p,[r]:[["","",""],["","",""],["","",""]]};$(x),S(r),H(null),y(JSON.stringify(x))},icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Nueva Hoja",title:"Añadir nueva pestaña de cálculo",variant:"emerald",size:"sm"}),Object.keys(p).length>1&&e.jsx(pe,{onClick:()=>{const r=Object.keys(p),x=r.indexOf(d),g={...p};delete g[d];const h=r[x-1]||r[x+1]||Object.keys(g)[0];$(g),S(h),H(null);const E=Object.keys(g),t=E.length>1||E[0]!=="Hoja 1";y(JSON.stringify(t?g:g[h]))},icon:e.jsx(pt,{className:"h-4 w-4"}),label:"Eliminar Hoja",title:"Eliminar pestaña actual",variant:"danger",size:"sm"})]})]})]}),be&&Ot.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 font-sans",children:[e.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:()=>Ee(!1)}),e.jsxs("div",{className:"relative w-full max-w-5xl h-[85vh] bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-[14px]",children:e.jsx(Ta,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("h2",{className:"font-bold text-xl text-text-primary tracking-tight flex items-center gap-1.5",children:["Análisis de Datos ",e.jsx(We,{className:"h-4 w-4 text-amber-500 animate-pulse"})]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 font-medium",children:"Análisis estadístico, indicadores en tiempo real y gráficos interactivos"})]})]}),e.jsx("button",{onClick:()=>Ee(!1),className:"p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer",children:e.jsx(rt,{className:"w-5 h-5 text-text-secondary"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 bg-surface-primary grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0",children:[e.jsxs("div",{className:"lg:col-span-4 flex flex-col space-y-4 max-h-full overflow-y-auto pr-1",children:[e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3.5 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Dimensiones de Gráfico"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje X (Etiqueta)"}),e.jsx("select",{value:ve,onChange:r=>re(parseInt(r.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Le.map(r=>e.jsx("option",{value:r.index,children:r.label},r.index))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje Y (Valor)"}),e.jsx("select",{value:te,onChange:r=>f(parseInt(r.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Le.map(r=>e.jsx("option",{value:r.index,children:r.label},r.index))})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Operación de Análisis"}),e.jsx("div",{className:"flex bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["sum","avg","count"].map(r=>e.jsx("button",{onClick:()=>Ye(r),className:`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${Te===r?"bg-teal-600 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:r==="sum"?"Suma":r==="avg"?"Promedio":"Frecuencia"},r))})]}),e.jsx("div",{className:"flex bg-surface-secondary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["bar","line","area","pie"].map(r=>e.jsx("button",{onClick:()=>ge(r),className:`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${Ne===r?"bg-teal-500 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:r==="bar"?"Barras":r==="line"?"Líneas":r==="area"?"Área":"Torta"},r))}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Indicadores del Eje Y"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Total Suma"}),e.jsx("span",{className:"text-sm font-bold text-text-primary mt-1 font-mono",children:xe.toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Promedio"}),e.jsx("span",{className:"text-sm font-bold text-teal-600 mt-1 font-mono",children:(Math.round(N*100)/100).toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Límites Máx/Mín"}),e.jsxs("span",{className:"text-[9px] bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded-full font-mono font-semibold",children:["Regs: ",ne]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-medium/30",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Máx: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:Fe})]}),e.jsx("span",{className:"text-xs font-bold text-green-600 font-mono",children:D.toLocaleString()})]}),e.jsxs("div",{className:"border-l border-border-medium/30 pl-2",children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Mín: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:Ge})]}),e.jsx("span",{className:"text-xs font-bold text-red-500 font-mono",children:ye.toLocaleString()})]})]})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm flex flex-col min-h-[160px]",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Tabla de Distribución"}),e.jsx("div",{className:"flex-1 overflow-y-auto border border-border-medium rounded-xl bg-surface-primary shadow-sm max-h-[180px]",children:e.jsxs("table",{className:"w-full text-left font-sans text-[11px] border-collapse",children:[e.jsx("thead",{className:"bg-surface-secondary sticky top-0 font-bold text-text-secondary select-none border-b border-border-medium z-10",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2",children:"Categoría"}),e.jsx("th",{className:"p-2 text-right",children:"Valor"}),e.jsx("th",{className:"p-2 text-right",children:"% Part."})]})}),e.jsx("tbody",{children:he.map((r,x)=>{const g=xe>0?r.val/xe*100:0;return e.jsxs("tr",{className:"border-b border-border-medium hover:bg-surface-hover/20",children:[e.jsx("td",{className:"p-2 font-medium text-text-primary max-w-[120px] truncate",title:r.label,children:r.label}),e.jsx("td",{className:"p-2 text-right font-mono text-text-secondary",children:r.val.toLocaleString()}),e.jsxs("td",{className:"p-2 text-right font-mono text-teal-600 font-semibold",children:[Math.round(g),"%"]})]},x)})})]})})]}),e.jsxs("button",{onClick:v,className:"w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-bold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer",children:[e.jsx(Dt,{className:"h-4 w-4"}),"Copiar Tabla como HTML Premium"]})]}),e.jsx("div",{className:"lg:col-span-8 bg-surface-secondary/40 border border-border-light rounded-2xl p-5 flex flex-col items-center justify-center min-h-[350px] relative shadow-sm overflow-hidden",children:ne===0?e.jsxs("div",{className:"text-center py-8 text-text-tertiary",children:[e.jsx(Ba,{className:"h-8 w-8 mx-auto mb-2 text-text-tertiary/50"}),e.jsx("p",{className:"text-xs",children:"No hay datos válidos para graficar con la operación seleccionada."})]}):e.jsxs("svg",{width:"100%",height:"100%",viewBox:"0 0 500 280",className:"overflow-visible w-full max-h-[380px]",onMouseLeave:()=>R(null),children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"barGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#10b981"}),e.jsx("stop",{offset:"100%",stopColor:"#3b82f6"})]}),e.jsxs("linearGradient",{id:"lineGradient",x1:"0",y1:"0",x2:"1",y2:"0",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6"}),e.jsx("stop",{offset:"100%",stopColor:"#ec4899"})]}),e.jsxs("linearGradient",{id:"areaGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6",stopOpacity:"0.4"}),e.jsx("stop",{offset:"100%",stopColor:"#8b5cf6",stopOpacity:"0.0"})]}),e.jsx("filter",{id:"shadow",x:"-10%",y:"-10%",width:"120%",height:"120%",children:e.jsx("feDropShadow",{dx:"0",dy:"4",stdDeviation:"4",floodOpacity:"0.1"})})]}),Ne==="bar"&&(()=>{const E=Math.min(36,430/ne*.7),t=430/ne;return he.map((a,n)=>{const o=D>0?a.val/D*220:0,m=45+n*t+(t-E)/2,u=235-o,b=M===n;return e.jsxs("g",{children:[e.jsx("rect",{x:m,y:u,width:E,height:Math.max(2,o),fill:"url(#barGradient)",rx:"4",className:"transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-500",style:{transformOrigin:`${m+E/2}px ${u+o}px`,opacity:M===null||b?1:.6,filter:b?"url(#shadow)":"none",transform:b?"scale(1.05)":"scale(1)"},onMouseEnter:P=>{R(n),X({x:P.clientX,y:P.clientY})},onMouseMove:P=>{X({x:P.clientX,y:P.clientY})}}),ne<=15&&e.jsx("text",{x:m+E/2,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:a.label.length>9?`${a.label.slice(0,8)}.`:a.label})]},n)})})(),(Ne==="line"||Ne==="area")&&(()=>{const E=ne>1?430/(ne-1):430,t=he.map((o,m)=>{const u=45+m*E,b=235-(D>0?o.val/D*220:0);return{x:u,y:b}});let a="";if(t.length>0){a=`M ${t[0].x} ${t[0].y}`;for(let o=1;o<t.length;o++){const m=t[o-1],u=t[o],b=m.x+E/3,P=m.y,Se=u.x-E/3,ue=u.y;a+=` C ${b} ${P}, ${Se} ${ue}, ${u.x} ${u.y}`}}const n=t.length>0?`${a} L ${t[t.length-1].x} 235 L ${t[0].x} 235 Z`:"";return e.jsxs("g",{children:[Ne==="area"&&t.length>0&&e.jsx("path",{d:n,fill:"url(#areaGradient)",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.length>0&&e.jsx("path",{d:a,fill:"none",stroke:"url(#lineGradient)",strokeWidth:"3.5",strokeLinecap:"round",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.map((o,m)=>{const u=M===m;return e.jsx("circle",{cx:o.x,cy:o.y,r:u?6:4,fill:u?"#ec4899":"#8b5cf6",stroke:"white",strokeWidth:"1.5",className:"transition-all duration-150 cursor-pointer shadow-sm",style:{filter:u?"url(#shadow)":"none"},onMouseEnter:b=>{R(m),X({x:b.clientX,y:b.clientY})},onMouseMove:b=>{X({x:b.clientX,y:b.clientY})}},m)}),ne<=15&&t.map((o,m)=>e.jsx("text",{x:o.x,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:he[m].label.length>9?`${he[m].label.slice(0,8)}.`:he[m].label},`lbl-${m}`))]})})(),Ne==="pie"&&(()=>{let h=0;return he.map((E,t)=>{if(xe===0)return null;const n=E.val/xe*360,o=240+100*Math.cos((h-90)*Math.PI/180),m=125+100*Math.sin((h-90)*Math.PI/180);h+=n;const u=240+100*Math.cos((h-90)*Math.PI/180),b=125+100*Math.sin((h-90)*Math.PI/180),P=n>180?1:0,Se=`
                            M 240 125
                            L ${o} ${m}
                            A 100 100 0 ${P} 1 ${u} ${b}
                            Z
                          `,ue=["#0d9488","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#14b8a6"],$e=ue[t%ue.length],c=M===t,A=h-n/2-90,T=c?8:0,U=`translate(${T*Math.cos(A*Math.PI/180)}px, ${T*Math.sin(A*Math.PI/180)}px)`;return e.jsx("path",{d:Se,fill:$e,stroke:"white",strokeWidth:"1.5",className:"transition-all duration-300 cursor-pointer animate-in fade-in duration-500",style:{transform:U,opacity:M===null||c?1:.7,filter:c?"url(#shadow)":"none"},onMouseEnter:G=>{R(t),X({x:G.clientX,y:G.clientY})},onMouseMove:G=>{X({x:G.clientX,y:G.clientY})}},t)})})()]})})]})]})]}),document.body)]}),M!==null&&be&&he[M]&&e.jsxs("div",{className:"fixed z-[99999999] pointer-events-none backdrop-blur-md bg-surface-primary/95 border border-border-medium rounded-xl p-2.5 shadow-xl text-xs font-sans text-text-primary flex flex-col gap-1",style:{left:fe.x+15,top:fe.y-10},children:[e.jsx("span",{className:"font-bold text-text-secondary",children:he[M].label}),e.jsxs("span",{className:"text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold",children:["Valor: ",he[M].val.toLocaleString()]})]}),se&&e.jsxs("div",{className:"fixed bottom-5 right-5 z-[99999] bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans",children:[e.jsx(We,{className:"h-4 w-4 text-emerald-300 animate-spin"}),e.jsx("span",{className:"text-xs font-bold",children:"¡Tabla HTML copiada al portapapeles con éxito!"})]})]})};function L(s){return s?String(s).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim():""}function Ir(s){if(!s||typeof s!="string")return null;try{const C=JSON.parse(s);if(Array.isArray(C))return C;if(C&&Array.isArray(C.slides))return C.slides;if(C&&Array.isArray(C.presentation))return C.presentation;if(C&&Array.isArray(C.deck))return C.deck}catch{}const y=s.indexOf("["),i=s.lastIndexOf("]");if(y===-1||i===-1||y>i)return null;const O=s.slice(y,i+1);try{const C=JSON.parse(O);if(Array.isArray(C))return C}catch{try{let p=O.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(?:^|\s)\/\/.*$/gm,"");p=p.replace(/,\s*\]/g,"]").replace(/,\s*\}/g,"}");const $=JSON.parse(p);if(Array.isArray($))return $}catch(p){console.error("Failed both standard and cleaned JSON extraction for slides:",p)}}return null}function qt(s,y){var j;const i=s&&typeof s=="object"&&!Array.isArray(s)?s:{title:String(s||`Diapositiva ${y+1}`)},O=Array.isArray(i==null?void 0:i.bullets)?i.bullets.map(k=>String(k||"").trim()).filter(Boolean):typeof(i==null?void 0:i.content)=="string"&&i.content.trim()?i.content.split(/\n|•|-/).map(k=>k.trim()).filter(Boolean):["Indicador clave de gestión SG-SST","Control operativo verificado en campo"];let C=i==null?void 0:i.chartConfig;if(C&&typeof C=="object"){let k=Array.isArray(C.data)?C.data:[];k.length===0&&Array.isArray(C.labels)&&Array.isArray(C.datasets)&&Array.isArray((j=C.datasets[0])==null?void 0:j.data)&&(k=C.labels.map((H,Pe)=>({label:String(H??""),val:Number(C.datasets[0].data[Pe]||0)}))),C={type:C.type==="doughnut"?"pie":C.type||"bar",title:String(C.title||(i==null?void 0:i.title)||"Análisis Cuantitativo"),data:k,labels:C.labels,datasets:C.datasets}}else C=void 0;const p=Array.isArray(i==null?void 0:i.kpis)?i.kpis:Array.isArray(i==null?void 0:i.metrics)?i.metrics:void 0,$=p?p.filter(k=>k&&typeof k=="object").map(k=>({label:String(k.label??""),value:String(k.value??""),delta:k.delta!=null?String(k.delta):void 0,trend:k.trend,description:k.description!=null?String(k.description):void 0})):void 0,d=Array.isArray(i==null?void 0:i.columns)?i.columns.filter(k=>k&&typeof k=="object").map(k=>({title:String(k.title??""),badge:k.badge!=null?String(k.badge):void 0,theme:k.theme,items:Array.isArray(k.items)?k.items.map(H=>String(H??"")):typeof k.items=="string"&&k.items.trim()?[k.items.trim()]:[]})):void 0,S=Array.isArray(i==null?void 0:i.steps)?i.steps.filter(k=>k&&typeof k=="object").map((k,H)=>({phase:String(k.phase??`PASO 0${H+1}`),title:String(k.title??""),detail:String(k.detail??k.description??"")})):void 0;return{title:String((i==null?void 0:i.title)||`Diapositiva ${y+1}`),subtitle:String((i==null?void 0:i.subtitle)||""),kicker:String((i==null?void 0:i.kicker)||(i==null?void 0:i.badge)||""),bullets:O.length>0?O:["Punto estratégico"],theme:(i==null?void 0:i.theme)||(y===0?"wappy-dark":"cobalt"),layout:(i==null?void 0:i.layout)||(y===0?"title":"bullets"),imageUrl:String((i==null?void 0:i.imageUrl)||""),tableHtml:String((i==null?void 0:i.tableHtml)||""),chartConfig:C,kpis:$,columns:d,steps:S,quote:String((i==null?void 0:i.quote)||""),citation:String((i==null?void 0:i.citation)||(i==null?void 0:i.normativeRef)||""),takeaway:String((i==null?void 0:i.takeaway)||""),speakerNotes:String((i==null?void 0:i.speakerNotes)||"")}}const Je={"wappy-dark":{label:"WAPPY Dark Tech",bg:"bg-gradient-to-br from-[#080d02] via-[#0e1705] to-[#071614]",text:"text-white",subtext:"text-slate-300",accent:"text-[#c7f303]",accentBg:"bg-[#c7f303]/15 border-[#c7f303]/40 text-[#c7f303]",border:"border-[#c7f303]/30",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0B1304",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"C7F303",pptCardBg:"15220A",pptCardBorder:"2D4A18"},"wappy-cream":{label:"WAPPY Editorial Cream",bg:"bg-gradient-to-br from-[#faf9f5] via-[#f4f2ea] to-[#e9e5d8]",text:"text-[#0e1300]",subtext:"text-slate-600",accent:"text-[#0d9488]",accentBg:"bg-teal-500/10 border-teal-500/30 text-teal-800",border:"border-teal-600/25",cardBg:"bg-white/85 border-slate-300/80 shadow-sm",isLight:!0,pptBg:"F6F5EF",pptText:"0E1300",pptSubtext:"475569",pptAccent:"0D9488",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"corporate-light":{label:"McKinsey Light",bg:"bg-gradient-to-br from-white via-slate-50 to-blue-50/60",text:"text-slate-900",subtext:"text-slate-600",accent:"text-blue-700",accentBg:"bg-blue-600/10 border-blue-600/30 text-blue-800",border:"border-blue-500/25",cardBg:"bg-white/90 border-slate-200 shadow-sm",isLight:!0,pptBg:"F8FAFC",pptText:"0F172A",pptSubtext:"475569",pptAccent:"1D4ED8",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"emerald-sst":{label:"Esmeralda SG-SST",bg:"bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-950",text:"text-white",subtext:"text-emerald-100/80",accent:"text-teal-300",accentBg:"bg-teal-400/15 border-teal-400/35 text-teal-300",border:"border-teal-500/35",cardBg:"bg-white/[0.06] border-teal-400/20",isLight:!1,pptBg:"042F2E",pptText:"FFFFFF",pptSubtext:"CCFBF1",pptAccent:"2DD4BF",pptCardBg:"064E3B",pptCardBorder:"0F766E"},cobalt:{label:"Cobalto Ejecutivo",bg:"bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950",text:"text-white",subtext:"text-blue-100/80",accent:"text-cyan-400",accentBg:"bg-cyan-500/15 border-cyan-500/35 text-cyan-300",border:"border-blue-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0F172A",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"38BDF8",pptCardBg:"1E293B",pptCardBorder:"334155"},forest:{label:"Bosque Bio-SST",bg:"bg-gradient-to-br from-emerald-950 via-green-950 to-slate-900",text:"text-white",subtext:"text-emerald-100/80",accent:"text-emerald-400",accentBg:"bg-emerald-500/15 border-emerald-500/35 text-emerald-300",border:"border-emerald-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"064E3B",pptText:"FFFFFF",pptSubtext:"D1FAE5",pptAccent:"34D399",pptCardBg:"065F46",pptCardBorder:"059669"},sunset:{label:"Ámbar Alerta",bg:"bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950",text:"text-white",subtext:"text-rose-100/80",accent:"text-amber-400",accentBg:"bg-amber-500/15 border-amber-500/35 text-amber-300",border:"border-rose-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"451A03",pptText:"FFFFFF",pptSubtext:"FDE68A",pptAccent:"FBBF24",pptCardBg:"78350F",pptCardBorder:"B45309"},charcoal:{label:"Carbón Minimal",bg:"bg-gradient-to-br from-zinc-900 via-neutral-900 to-black",text:"text-white",subtext:"text-zinc-300",accent:"text-teal-400",accentBg:"bg-teal-500/15 border-teal-500/35 text-teal-300",border:"border-zinc-700",cardBg:"bg-white/[0.05] border-white/10",isLight:!1,pptBg:"18181B",pptText:"FFFFFF",pptSubtext:"D4D4D8",pptAccent:"2DD4BF",pptCardBg:"27272A",pptCardBorder:"3F3F46"}},va=[{key:"title",label:"Portada",desc:"Lámina principal de apertura"},{key:"kpi-grid",label:"Tarjetas KPI",desc:"Métricas e indicadores clave"},{key:"columns",label:"Comparativa",desc:"2 o 3 columnas ejecutivas"},{key:"timeline",label:"Hoja de Ruta",desc:"Fases o Ciclo PHVA"},{key:"bullets",label:"Puntos Clave",desc:"Tarjetas de síntesis ejecutiva"},{key:"table",label:"Matriz / Tabla",desc:"Tabla técnica estructurada"},{key:"chart",label:"Gráfico Datos",desc:"Visualización estadística"},{key:"quote",label:"Cita Legal",desc:"Fundamento normativo SST"},{key:"split",label:"Split Imagen",desc:"Evidencia visual + análisis"},{key:"media",label:"Full Media",desc:"Fondo visual inmersivo"}],Wt=[{id:"rendicion-alta-direccion",name:"Rendición de Cuentas Alta Dirección (Dec. 1072)",category:"Gerencial",slides:[{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora Continua",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Revisión integral del Sistema de Gestión de Seguridad y Salud en el Trabajo","Cumplimiento de Estándares Mínimos Resolución 0312 de 2019"],takeaway:"Presentación oficial para aprobación y firma de la Alta Dirección.",speakerNotes:"Dar la bienvenida al comité directivo y presentar el balance anual del SG-SST."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Cumplimiento Estándares 0312: 94.5% (Nivel Aceptable)","ejecución del Plan de Trabajo Anual: 92% de actividades cerradas","Índice de Frecuencia ATEL: Reducción del 35% frente al periodo anterior","Cobertura de Capacitación y Entrenamiento: 100% del personal operativo"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La inversión en prevención en la fuente redujo los días perdidos por incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",subtitle:"Comparativa de cierre de brechas críticas identificadas en la Matriz GTC-45",kicker:"GESTIÓN DE PELIGROS Y RIESGOS",layout:"columns",theme:"emerald-sst",bullets:["Sustitución de manipulación manual de cargas por ayudas mecánicas","Digitalización de permisos de trabajo de alto riesgo en WAPPY"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas en bodega.","Registros en papel sin trazabilidad en tiempo real para trabajo en alturas.","Fatiga postural reportada en el 38% de los cargos operativos."]},{title:"Intervención Ejecutada (Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Implementación de estibadores hidráulicos y mesas niveladoras ergonómicas.","Control digital de listas de chequeo y permisos en WAPPY IA.","Programa de vigilancia epidemiológica osteomuscular con cobertura 100%."]}],takeaway:"El 100% de los peligros Nivel I fueron intervenidos con medidas de ingeniería y administrativas."},{title:"Evolución trimestral del cumplimiento normativo vs accidentalidad",subtitle:"Tendencia histórica verificada por el COPASST y la ARL",kicker:"ANALÍTICA DE TENDENCIAS",layout:"chart",theme:"cobalt",bullets:["Crecimiento sostenido en el cierre de hallazgos ACPM durante los 4 trimestres.","Correlación directa entre capacitación práctica y cero accidentes en Q4."],chartConfig:{type:"bar",title:"% Cumplimiento del Cronograma SG-SST por Trimestre",data:[{label:"Trimestre 1",val:78},{label:"Trimestre 2",val:85},{label:"Trimestre 3",val:91},{label:"Trimestre 4",val:95}]},takeaway:"Meta para el próximo ciclo: sostener el cumplimiento por encima del 96% mensual."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo Fiscal",subtitle:"Prioridades aprobadas para presupuesto y recursos técnicos",kicker:"PLAN DE MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Q1: Actualización de matriz legal, medición higiénica de iluminación y ruido","Q2: Aplicación de Batería de Riesgo Psicosocial y talleres de liderazgo","Q3: Simulacro general de emergencias y auditoría interna cruzada","Q4: Evaluación de eficacia de SVE y revisión por la Alta Dirección"],steps:[{phase:"FASE 1 · PLANEAR (Q1)",title:"Diagnóstico e Higiene Industrial",detail:"Actualización GTC-45, matriz legal y mediciones ambientales con ARL."},{phase:"FASE 2 · HACER (Q2)",title:"Intervención Psicosocial y Biomecánica",detail:"Ejecución de SVE, pausas activas dirigidas y formación de brigadistas."},{phase:"FASE 3 · VERIFICAR (Q3)",title:"Auditoría Interna e Inspecciones",detail:"Verificación de cumplimiento Decreto 1072 y simulacro de evacuación."},{phase:"FASE 4 · ACTUAR (Q4)",title:"Cierre de ACPM y Certificación",detail:"Cierre del 100% de acciones correctivas y reporte al Ministerio/ARL."}],takeaway:"Presupuesto requerido: asignación del 100% de recursos para controles prioritarios."},{title:"Responsabilidad legal indelegable de la Alta Dirección en la prevención",kicker:"FUNDAMENTO JURÍDICO",layout:"quote",theme:"wappy-dark",quote:"El empleador está obligado a la protección de la seguridad y la salud de los trabajadores, acorde con lo establecido en la normatividad vigente, asegurando la asignación de recursos financieros, técnicos y el personal necesario.",citation:"Decreto Único Reglamentario 1072 de 2015 — Artículo 2.2.4.6.8 (Obligaciones de los Empleadores)",bullets:["Prevención de culpa patronal (Art. 216 del Código Sustantivo del Trabajo).","Blindaje jurídico ante inspecciones del Ministerio del Trabajo."],takeaway:"La firma del acta de revisión gerencial formaliza el compromiso institucional."}]},{id:"induccion-sgsst",name:"Inducción y Reinducción Corporativa SG-SST",category:"Capacitación",slides:[{title:"Inducción General al Sistema de Gestión SG-SST",subtitle:"Política de Seguridad, Derechos, Deberes, Peligros Prioritarios y Actuación ante Emergencias",kicker:"BIENVENIDA Y CULTURA DE AUTOCUIDADO",layout:"title",theme:"emerald-sst",bullets:["Conoce los riesgos de tu cargo y cómo protegemos tu vida todos los días"],takeaway:"En nuestra empresa ninguna meta operativa está por encima de tu seguridad."},{title:"Nuestros 4 Pilares de Cultura Preventiva y Cero Daño",kicker:"POLÍTICA INTEGRAL SG-SST",layout:"kpi-grid",theme:"wappy-cream",bullets:["Meta Cero Accidentes Graves o Mortales","100% Reporte de Condiciones Inseguras","Comités Activos: COPASST y Convivencia Laboral","Cobertura ARL desde el primer día de ingreso"],kpis:[{label:"Meta Siniestralidad",value:"0 ATEL",delta:"Prioridad Vida",trend:"up",description:"Todo accidente es 100% prevenible"},{label:"Comités Paritarios",value:"2 Comités",delta:"COPASST + CCL",trend:"neutral",description:"Canales de participación activa"},{label:"Protección ARL",value:"100%",delta:"Cobertura 24/7 laboral",trend:"up",description:"Asistencia médica y económica"},{label:"Reporte Preventivo",value:"< 5 min",delta:"Vía WAPPY IA",trend:"up",description:"Reporta actos y condiciones inseguras"}],takeaway:"Tu participación activa es el motor del Sistema de Gestión."},{title:"Derechos y Responsabilidades Legales del Trabajador",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.10",layout:"columns",theme:"corporate-light",bullets:["Equilibrio entre garantías laborales y deberes de autocuidado"],columns:[{title:"Tus Derechos en SST",badge:"Garantías del Empleador",theme:"info",items:["Recibir elementos de protección personal (EPP) certificados y sin costo.","Capacitación continua y ambientes de trabajo seguros y saludables.","Atención médica oportuna a través de la ARL ante cualquier incidente."]},{title:"Tus Deberes Legales (Art. 2.2.4.6.10)",badge:"Cumplimiento Obligatorio",theme:"success",items:["Procurar el cuidado integral de tu salud y suministrar información clara.","Cumplir las normas, reglamentos e instrucciones del SG-SST.","Informar inmediatamente todo accidente, incidente o condición peligrosa."]}],takeaway:"El autocuidado es un deber legal y ético con tu familia y tus compañeros."},{title:"Protocolo de Actuación en Caso de Accidente o Emergencia",kicker:"RUTA DE RESPUESTA INMEDIATA",layout:"timeline",theme:"wappy-dark",bullets:["Pasos inmediatos ante cualquier evento en el lugar de trabajo"],steps:[{phase:"PASO 1 · ALERTA INMEDIATA",title:"Detén la labor y avisa a tu jefe inmediato",detail:"Todo evento, por leve que parezca, debe reportarse el mismo día."},{phase:"PASO 2 · PRIMEROS AUXILIOS",title:"Activación de la Brigada de Emergencia",detail:"Valoración primaria en sitio y estabilización sin mover al lesionado grave."},{phase:"PASO 3 · REPORTE ARL",title:"Línea de atención ARL y traslado médico",detail:"Radicación del FURAT dentro de las 48 horas hábiles legales."},{phase:"PASO 4 · INVESTIGACIÓN",title:"Lecciones aprendidas (Res. 1401 de 2007)",detail:"Identificación de causas raíz para evitar que vuelva a ocurrir."}],takeaway:"Recuerda: Nunca ocultes un incidente; reportarlo a tiempo salva vidas."}]},{id:"investigacion-atel",name:"Informe de Investigación de Accidente (Res. 1401/2007)",category:"Operativo",slides:[{title:"Investigación Técnica de Accidente de Trabajo y Lecciones Aprendidas",subtitle:"Metodología de Árbol de Causas, Factores Personales/Del Trabajo y Plan de Acción Correctiva",kicker:"RESOLUCIÓN 1401 DE 2007 · DECRETO 1072 DE 2015",layout:"title",theme:"sunset",bullets:["Análisis técnico del equipo investigador y representante del COPASST"],takeaway:"Investigamos para encontrar causas y prevenir repeticiones, nunca para buscar culpables."},{title:"Análisis Causal: Causas Inmediatas vs. Causas Básicas (NTC 3701)",kicker:"DIAGNÓSTICO DE CAUSA RAÍZ",layout:"columns",theme:"wappy-dark",bullets:["Desglose técnico según metodología NTC 3701 y los 5 Porqués"],columns:[{title:"Causas Inmediatas (Síntomas)",badge:"Actos y Condiciones Subestándar",theme:"danger",items:["Condición subestándar: Superficie húmeda sin señalización preventiva en pasillo B.","Acto subestándar: Desplazamiento rápido manipulando carga que obstruía visibilidad.","Uso de calzado con desgaste en labrado antideslizante."]},{title:"Causas Básicas (Raíz Estructural)",badge:"Factores del Trabajo y Personales",theme:"warning",items:["Factor del trabajo: Ausencia de estándar de orden y aseo durante limpieza en turno.","Supervisión insuficiente en la inspección preoperacional de calzado EPP.","Falta de demarcación de vías peatonales segregadas."]}],takeaway:"Atacar únicamente la causa inmediata deja latente el 80% del riesgo de repetición."},{title:"Plan de Acción Correctiva y Preventiva (ACPM) de Cumplimiento Estricto",kicker:"JERARQUÍA DE CONTROLES",layout:"table",theme:"wappy-cream",bullets:["Medidas de ingeniería, administrativas y en el trabajador"],tableHtml:`<table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#0d9488; color:#ffffff;">
              <th style="padding:10px; text-align:left;">Tipo Control</th>
              <th style="padding:10px; text-align:left;">Medida de Intervención</th>
              <th style="padding:10px; text-align:left;">Responsable</th>
              <th style="padding:10px; text-align:left;">Fecha Límite</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background:#ffffff; color:#0f172a; border-bottom:1px solid #cbd5e1;">
              <td style="padding:10px; font-weight:bold;">Ingeniería (Fuente)</td>
              <td style="padding:10px;">Aplicación de recubrimiento epóxico antideslizante y drenaje</td>
              <td style="padding:10px;">Jefe de Mantenimiento</td>
              <td style="padding:10px;">15 Días</td>
            </tr>
            <tr style="background:#f8fafc; color:#0f172a; border-bottom:1px solid #cbd5e1;">
              <td style="padding:10px; font-weight:bold;">Administrativo (Medio)</td>
              <td style="padding:10px;">Protocolo de bloqueo de pasillo durante lavado y señalización</td>
              <td style="padding:10px;">Coordinador SST</td>
              <td style="padding:10px;">Inmediato</td>
            </tr>
            <tr style="background:#ffffff; color:#0f172a;">
              <td style="padding:10px; font-weight:bold;">Individuo</td>
              <td style="padding:10px;">Reposición de botas con suela certificada y divulgación de lección</td>
              <td style="padding:10px;">Supervisor de Área</td>
              <td style="padding:10px;">5 Días</td>
            </tr>
          </tbody>
        </table>`,takeaway:"Verificación de eficacia programada a los 30 días con cierre documental en WAPPY."}]}],At=({value:s,onChange:y,placeholder:i="",className:O="",tagName:C="div"})=>{const p=l.useRef(null);l.useEffect(()=>{p.current&&p.current.innerHTML!==s&&(p.current.innerHTML=s||"")},[s]);const $=()=>{p.current&&y(p.current.innerHTML)},d=()=>{p.current&&y(p.current.innerHTML)},S=C;return e.jsx(S,{ref:p,contentEditable:!0,suppressContentEditableWarning:!0,onInput:$,onBlur:d,className:`outline-none focus:ring-1 focus:ring-teal-500/40 rounded px-1 transition-all ${O} relative empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 empty:before:pointer-events-none empty:before:absolute`,"data-placeholder":i,style:{minWidth:"40px"}})},Lr=({initialContent:s,onUpdate:y,title:i,isMaximized:O=!1,onRegisterDownload:C})=>{const[p,$]=l.useState([]),[d,S]=l.useState(0),[j,k]=l.useState(!1),[H,Pe]=l.useState(!0),[le,Q]=l.useState(!1),[_,W]=l.useState(!1),[Oe,ke]=l.useState(!1),[je,me]=l.useState(!1),[F,z]=l.useState(!1),[be,Ee]=l.useState({x:0,y:0}),[Ne,ge]=l.useState(!1),[ve,re]=l.useState(!1),[te,f]=l.useState("upload"),[M,R]=l.useState(""),[fe,X]=l.useState(null),[se,He]=l.useState(null),[Te,Ye]=l.useState(!1),Ie=l.useRef(null),Ve=l.useRef(null),_e=l.useRef(!1),Le=async()=>{X(null),_e.current=!0;try{const t=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720,facingMode:"user"}});if(!_e.current){t.getTracks().forEach(a=>a.stop());return}Ve.current=t,He(t),Ie.current&&(Ie.current.srcObject=t)}catch(t){console.error("Error accessing camera:",t),X("No se pudo acceder a la cámara. Por favor verifica los permisos.")}},Me=()=>{_e.current=!1,Ve.current&&(Ve.current.getTracks().forEach(t=>t.stop()),Ve.current=null),se&&(se.getTracks().forEach(t=>t.stop()),He(null))};l.useEffect(()=>(ve&&te==="camera"?Le():Me(),()=>{Me()}),[ve,te]);const qe=()=>{if(Ie.current){const t=Ie.current,a=document.createElement("canvas");a.width=t.videoWidth||640,a.height=t.videoHeight||480;const n=a.getContext("2d");if(n){n.translate(a.width,0),n.scale(-1,1),n.drawImage(t,0,0,a.width,a.height);const o=a.toDataURL("image/jpeg",.85);he(o)}}},he=t=>{const a=p[d],n=(a==null?void 0:a.layout)||"bullets";let o=n;(n==="title"||n==="bullets")&&(o="split"),D(d,{imageUrl:t,layout:o}),re(!1),Me()},ne=t=>{var n;const a=(n=t.target.files)==null?void 0:n[0];if(a){const o=new FileReader;o.onload=m=>{var u;(u=m.target)!=null&&u.result&&he(m.target.result)},o.readAsDataURL(a)}},ae=t=>{t.preventDefault(),Ye(!0)},xe=()=>{Ye(!1)},N=t=>{var n;t.preventDefault(),Ye(!1);const a=(n=t.dataTransfer.files)==null?void 0:n[0];if(a&&a.type.startsWith("image/")){const o=new FileReader;o.onload=m=>{var u;(u=m.target)!=null&&u.result&&he(m.target.result)},o.readAsDataURL(a)}};l.useEffect(()=>{if(s){if(Array.isArray(s)&&s.length>0){$(s.map((t,a)=>qt(t,a)));return}if(typeof s=="object"&&s!==null){const t=s.slides||s.presentation||s.deck;if(Array.isArray(t)&&t.length>0){$(t.map((a,n)=>qt(a,n)));return}}if(typeof s=="string"){const t=Ir(s);if(t&&Array.isArray(t)&&t.length>0){$(t.map((a,n)=>qt(a,n)));return}}}$(Wt[0].slides)},[s]),l.useEffect(()=>{if(!je)return;const t=a=>{a.key==="ArrowRight"||a.key===" "?(a.preventDefault(),S(n=>Math.min(p.length-1,n+1))):a.key==="ArrowLeft"?(a.preventDefault(),S(n=>Math.max(0,n-1))):a.key==="Escape"&&(a.preventDefault(),me(!1),z(!1))};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[je,p.length]);const D=(t,a)=>{const n=p.map((o,m)=>m===t?{...o,...a}:o);$(n),y(JSON.stringify(n))},ye=()=>{var o;const t=((o=p[d])==null?void 0:o.theme)||"wappy-dark",a={title:"Nuevo Hallazgo o Estrategia Clave",subtitle:"Subtítulo ejecutivo de contexto normativo o técnico",kicker:"ESTRATEGIA SG-SST",bullets:["Primer indicador o acción prioritaria verificable en campo.","Segunda medida de control de ingeniería o administrativa.","Impacto proyectado en la reducción de riesgos laborales."],theme:t,layout:"bullets",takeaway:"Conclusión ejecutiva: priorizar la intervención en la fuente."},n=[...p];n.splice(d+1,0,a),$(n),S(d+1),y(JSON.stringify(n))},I=()=>{const t=p[d];if(!t)return;const a=JSON.parse(JSON.stringify(t));a.title=`${L(a.title)} (Copia)`;const n=[...p];n.splice(d+1,0,a),$(n),S(d+1),y(JSON.stringify(n))},Be=t=>{const a=t==="up"?d-1:d+1;if(a<0||a>=p.length)return;const n=[...p],[o]=n.splice(d,1);n.splice(a,0,o),$(n),S(a),y(JSON.stringify(n))},Fe=()=>{if(p.length<=1)return;const t=p.filter((a,n)=>n!==d);$(t),S(Math.max(0,d-1)),y(JSON.stringify(t))},Ge=(t,a)=>{const n=p[d];if(!n)return;const o=n.bullets.map((m,u)=>u===t?a:m);D(d,{bullets:o})},Re=()=>{const t=p[d];t&&D(d,{bullets:[...t.bullets,"Nuevo punto estratégico"]})},ze=t=>{const a=p[d];if(!a||a.bullets.length<=1)return;const n=a.bullets.filter((o,m)=>m!==t);D(d,{bullets:n})},Qe=t=>{const a=Wt.find(o=>o.id===t);if(!a)return;const n=JSON.parse(JSON.stringify(a.slides));$(n),S(0),Q(!1),y(JSON.stringify(n))},Xe=()=>{const t=p[d];t&&(ke(!0),setTimeout(()=>{const a=["kpi-grid","columns","timeline","quote","bullets"],n=a.indexOf(t.layout||"bullets"),o=a[(n+1)%a.length],m={layout:o,kicker:t.kicker||"INSIGHT EJECUTIVO SG-SST",takeaway:t.takeaway||"El control preventivo en la fuente garantiza el cumplimiento del Decreto 1072 de 2015."};if(o==="kpi-grid"&&(!t.kpis||t.kpis.length===0))m.kpis=t.bullets.slice(0,4).map((u,b)=>{var ue,$e;const P=L(u),Se=P.split(":");return{label:((ue=Se[0])==null?void 0:ue.slice(0,28))||`Indicador Clave ${b+1}`,value:(($e=Se[1])==null?void 0:$e.trim().slice(0,12))||`${92+b*2}%`,delta:"Meta cumplida",trend:"up",description:P.slice(0,70)}});else if(o==="columns"&&(!t.columns||t.columns.length===0)){const u=Math.ceil(t.bullets.length/2);m.columns=[{title:"Diagnóstico y Peligros",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,u).map(L)},{title:"Plan de Intervención SST",badge:"Control Efectivo",theme:"success",items:t.bullets.slice(u).map(L)}]}else o==="timeline"&&(!t.steps||t.steps.length===0)?m.steps=t.bullets.slice(0,4).map((u,b)=>({phase:`FASE 0${b+1} · PHVA`,title:L(u).slice(0,45),detail:L(u)})):o==="quote"&&!t.quote&&(m.quote=L(t.bullets[0]||t.title),m.citation="Decreto Único Reglamentario 1072 de 2015 · Resolución 0312 de 2019");D(d,m),ke(!1)},250))},at=t=>{D(d,{layout:"table",tableHtml:t})},ot=t=>{D(d,{layout:"chart",chartConfig:t})},et=(t,a)=>{var m;const n={title:t,bullets:a,theme:((m=p[d])==null?void 0:m.theme)||"wappy-dark",layout:"bullets"},o=[...p,n];$(o),S(o.length-1),y(JSON.stringify(o))},Ke=async()=>{if(!_){W(!0);try{const t=await Cr(()=>import("./vendor.Bmb2Uika.js").then(m=>m.hQ),__vite__mapDeps([0,1,2,3,4,5,6,7]),import.meta.url),a=t.default||t,n=new a;n.layout="LAYOUT_16x9",n.author="WAPPY IA — Suite Ejecutiva SG-SST",n.company="WAPPY Club",n.subject=i||"Presentación Ejecutiva SG-SST",n.title=i||"Presentación WAPPY",p.forEach((m,u)=>{var T,U;const b=Je[m.theme||"wappy-dark"]||Je["wappy-dark"],P=n.addSlide();P.background={color:b.pptBg};const Se=L(m.title)||`Diapositiva ${u+1}`,ue=L(m.subtitle||""),$e=L(m.kicker||"").toUpperCase(),c=L(m.takeaway||""),A=m.layout||"bullets";if(P.addShape(n.ShapeType.rect,{x:0,y:0,w:10,h:.08,fill:{color:b.pptAccent},line:{color:b.pptAccent,width:0}}),P.addText(`${L(i)}  |  LÁMINA ${String(u+1).padStart(2,"0")} DE ${String(p.length).padStart(2,"0")}`,{x:.6,y:.2,w:8.8,h:.25,fontSize:8.5,bold:!0,color:b.pptSubtext,fontFace:"Arial"}),A==="title")$e&&P.addText($e,{x:.8,y:1.35,w:8.4,h:.35,fontSize:11,bold:!0,color:b.pptAccent,align:"center",fontFace:"Arial"}),P.addText(Se,{x:.8,y:1.8,w:8.4,h:1.6,fontSize:30,bold:!0,color:b.pptText,align:"center",valign:"middle",fontFace:"Arial"}),(ue||((T=m.bullets)==null?void 0:T.length)>0)&&P.addText(ue||L(m.bullets[0]||""),{x:1.2,y:3.55,w:7.6,h:.9,fontSize:14,color:b.pptSubtext,align:"center",fontFace:"Arial"});else{$e&&P.addText($e,{x:.6,y:.5,w:8.8,h:.25,fontSize:9.5,bold:!0,color:b.pptAccent,fontFace:"Arial"}),P.addText(Se,{x:.6,y:$e?.75:.55,w:8.8,h:.75,fontSize:20,bold:!0,color:b.pptText,valign:"top",fontFace:"Arial"}),ue&&P.addText(ue,{x:.6,y:1.48,w:8.8,h:.32,fontSize:11,color:b.pptSubtext,fontFace:"Arial"});const G=ue?1.9:1.6;if(A==="kpi-grid"){const Z=(m.kpis&&m.kpis.length>0?m.kpis:m.bullets.slice(0,4).map((Y,Ae)=>({label:`Indicador ${Ae+1}`,value:`${90+Ae*2}%`,delta:"Verificado",description:L(Y)}))).slice(0,4),J=(Z.length<=2,2),ee=4.25,oe=Z.length<=2?2.5:1.35;Z.forEach((Y,Ae)=>{const de=Ae%J,ce=Math.floor(Ae/J),K=.6+de*(ee+.3),B=G+ce*(oe+.22);P.addShape(n.ShapeType.roundRect,{x:K,y:B,w:ee,h:oe,fill:{color:b.pptCardBg},line:{color:b.pptCardBorder,width:1},rectRadius:.08}),P.addText(L(Y.value),{x:K+.2,y:B+.12,w:2.3,h:.5,fontSize:22,bold:!0,color:b.pptAccent,fontFace:"Arial"}),Y.delta&&P.addText(L(Y.delta),{x:K+2.4,y:B+.18,w:1.65,h:.32,fontSize:9,bold:!0,color:b.pptSubtext,align:"right",fontFace:"Arial"}),P.addText(L(Y.label),{x:K+.2,y:B+.62,w:ee-.4,h:.3,fontSize:11,bold:!0,color:b.pptText,fontFace:"Arial"}),Y.description&&P.addText(L(Y.description),{x:K+.2,y:B+.9,w:ee-.4,h:.38,fontSize:9,color:b.pptSubtext,fontFace:"Arial"})})}else if(A==="columns"){const V=m.columns&&m.columns.length>0?m.columns:[{title:"Situación Identificada",badge:"Diagnóstico",items:m.bullets.slice(0,Math.ceil(m.bullets.length/2))},{title:"Plan de Control SST",badge:"Intervención",items:m.bullets.slice(Math.ceil(m.bullets.length/2))}],Z=Math.min(V.length,3),J=(8.8-(Z-1)*.3)/Z;V.slice(0,Z).forEach((ee,oe)=>{const Y=.6+oe*(J+.3);P.addShape(n.ShapeType.roundRect,{x:Y,y:G,w:J,h:2.9,fill:{color:b.pptCardBg},line:{color:b.pptCardBorder,width:1},rectRadius:.08}),P.addText(L(ee.title),{x:Y+.2,y:G+.15,w:J-.4,h:.4,fontSize:13,bold:!0,color:b.pptAccent,fontFace:"Arial"});const Ae=(ee.items||[]).map(de=>({text:L(de),options:{bullet:!0,breakLine:!0,fontSize:10.5,color:b.pptText}}));Ae.length>0&&P.addText(Ae,{x:Y+.2,y:G+.65,w:J-.4,h:2.1,valign:"top",fontFace:"Arial",paraSpaceAfter:6})})}else if(A==="timeline"){const V=m.steps&&m.steps.length>0?m.steps:m.bullets.slice(0,4).map((ee,oe)=>({phase:`FASE 0${oe+1}`,title:L(ee).slice(0,42),detail:L(ee)})),Z=Math.min(V.length,4),J=(8.8-(Z-1)*.2)/Z;V.slice(0,Z).forEach((ee,oe)=>{const Y=.6+oe*(J+.2);P.addShape(n.ShapeType.roundRect,{x:Y,y:G,w:J,h:2.85,fill:{color:b.pptCardBg},line:{color:b.pptCardBorder,width:1},rectRadius:.08}),P.addText(L(ee.phase||`PASO ${oe+1}`),{x:Y+.15,y:G+.15,w:J-.3,h:.3,fontSize:9,bold:!0,color:b.pptAccent,fontFace:"Arial"}),P.addText(L(ee.title),{x:Y+.15,y:G+.5,w:J-.3,h:.65,fontSize:11.5,bold:!0,color:b.pptText,fontFace:"Arial"}),P.addText(L(ee.detail),{x:Y+.15,y:G+1.2,w:J-.3,h:1.5,fontSize:9.5,color:b.pptSubtext,valign:"top",fontFace:"Arial"})})}else if(A==="table"&&m.tableHtml){const Z=new DOMParser().parseFromString(m.tableHtml,"text/html"),ee=Array.from(Z.querySelectorAll("tr")).map((oe,Y)=>Array.from(oe.querySelectorAll("th, td")).map(de=>({text:L(de.textContent||""),options:{bold:Y===0||de.tagName.toLowerCase()==="th",fill:Y===0?b.pptAccent:b.pptCardBg,color:Y===0?"0E1300":b.pptText,fontSize:9.5,margin:[4,6,4,6]}}))).filter(oe=>oe.length>0);ee.length>0&&P.addTable(ee,{x:.6,y:G,w:8.8,border:{type:"solid",pt:.75,color:b.pptCardBorder},fontFace:"Arial"})}else if(A==="chart"&&((U=m.chartConfig)!=null&&U.data)&&m.chartConfig.data.length>0){const V=m.chartConfig.data,Z=[[{text:"Categoría / Indicador",options:{bold:!0,fill:b.pptAccent,color:"0E1300",fontSize:10}},{text:"Valor Medido",options:{bold:!0,fill:b.pptAccent,color:"0E1300",fontSize:10}}],...V.map(ee=>[{text:L(ee.label),options:{fill:b.pptCardBg,color:b.pptText,fontSize:10}},{text:String(ee.val),options:{bold:!0,fill:b.pptCardBg,color:b.pptAccent,fontSize:10}}])];P.addTable(Z,{x:.6,y:G,w:4.3,border:{type:"solid",pt:.75,color:b.pptCardBorder},fontFace:"Arial"});const J=m.bullets.map(ee=>({text:L(ee),options:{bullet:!0,breakLine:!0,fontSize:11,color:b.pptText}}));J.length>0&&P.addText(J,{x:5.2,y:G,w:4.2,h:2.7,valign:"top",fontFace:"Arial",paraSpaceAfter:8})}else if(A==="quote")P.addShape(n.ShapeType.roundRect,{x:.6,y:G,w:8.8,h:2.8,fill:{color:b.pptCardBg},line:{color:b.pptAccent,width:1.5},rectRadius:.08}),P.addText(`“${L(m.quote||m.bullets[0]||m.title)}”`,{x:.9,y:G+.25,w:8.2,h:1.6,fontSize:15,italic:!0,bold:!0,color:b.pptText,valign:"middle",fontFace:"Arial"}),m.citation&&P.addText(`— ${L(m.citation)}`,{x:.9,y:G+2,w:8.2,h:.5,fontSize:11,bold:!0,color:b.pptAccent,fontFace:"Arial"});else{const V=m.bullets.map(Z=>({text:L(Z),options:{bullet:!0,breakLine:!0,fontSize:13,color:b.pptText}}));P.addShape(n.ShapeType.roundRect,{x:.6,y:G,w:8.8,h:2.85,fill:{color:b.pptCardBg},line:{color:b.pptCardBorder,width:1},rectRadius:.08}),V.length>0&&P.addText(V,{x:.85,y:G+.2,w:8.3,h:2.45,valign:"top",fontFace:"Arial",paraSpaceAfter:10})}}c&&(P.addShape(n.ShapeType.roundRect,{x:.6,y:4.92,w:8.8,h:.45,fill:{color:b.pptCardBg},line:{color:b.pptAccent,width:.75},rectRadius:.05}),P.addText(`CONCLUSIÓN CLAVE: ${c}`,{x:.8,y:4.95,w:8.4,h:.38,fontSize:9.5,bold:!0,color:b.pptAccent,valign:"middle",fontFace:"Arial"})),m.speakerNotes&&P.addNotes(L(m.speakerNotes))});const o=(i||"Presentacion_Ejecutiva_WAPPY").replace(/[/\\?%*:|"<>]/g,"_").trim();await n.writeFile({fileName:`${o}.pptx`})}catch(t){console.error("Error generating PPTX:",t)}finally{W(!1)}}},tt=()=>{const t=p.map((o,m)=>{var $e,c;const u=Je[o.theme||"wappy-dark"]||Je["wappy-dark"],b=L(o.kicker||""),P=L(o.subtitle||""),Se=L(o.takeaway||"");let ue="";return o.layout==="kpi-grid"?ue=`<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:20px;">
            ${(o.kpis&&o.kpis.length>0?o.kpis:o.bullets.slice(0,4).map((T,U)=>({label:`Indicador ${U+1}`,value:`${92+U}%`,delta:"Verificado",description:L(T)}))).map(T=>`<div style="background:#${u.pptCardBg}; border:1px solid #${u.pptCardBorder}; border-radius:16px; padding:20px;">
                <div style="font-size:34px; font-weight:800; color:#${u.pptAccent};">${L(T.value)}</div>
                <div style="font-size:16px; font-weight:700; margin-top:6px;">${L(T.label)}</div>
                <div style="font-size:13px; opacity:0.8; margin-top:4px;">${L(T.description||T.delta||"")}</div>
              </div>`).join("")}
          </div>`:o.layout==="columns"&&(($e=o.columns)!=null&&$e.length)?ue=`<div style="display:grid; grid-template-columns:repeat(${Math.min(o.columns.length,3)},1fr); gap:20px; margin-top:20px;">
            ${o.columns.map(A=>`<div style="background:#${u.pptCardBg}; border:1px solid #${u.pptCardBorder}; border-radius:16px; padding:20px;">
                <h3 style="margin:0 0 12px 0; color:#${u.pptAccent}; font-size:18px;">${L(A.title)}</h3>
                <ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.6;">
                  ${(A.items||[]).map(T=>`<li>${L(T)}</li>`).join("")}
                </ul>
              </div>`).join("")}
          </div>`:o.layout==="timeline"&&((c=o.steps)!=null&&c.length)?ue=`<div style="display:grid; grid-template-columns:repeat(${Math.min(o.steps.length,4)},1fr); gap:14px; margin-top:20px;">
            ${o.steps.map(A=>`<div style="background:#${u.pptCardBg}; border:1px solid #${u.pptCardBorder}; border-radius:16px; padding:18px;">
                <div style="font-size:11px; font-weight:800; color:#${u.pptAccent};">${L(A.phase)}</div>
                <div style="font-size:16px; font-weight:700; margin:8px 0;">${L(A.title)}</div>
                <div style="font-size:13px; opacity:0.85;">${L(A.detail)}</div>
              </div>`).join("")}
          </div>`:o.layout==="table"&&o.tableHtml?ue=`<div style="margin-top:20px; background:#${u.pptCardBg}; padding:16px; border-radius:14px;">${o.tableHtml}</div>`:o.layout==="quote"?ue=`<div style="margin-top:24px; background:#${u.pptCardBg}; border-left:5px solid #${u.pptAccent}; padding:28px; border-radius:16px;">
            <div style="font-size:24px; font-style:italic; font-weight:700; line-height:1.45;">“${L(o.quote||o.bullets[0]||"")}”</div>
            <div style="margin-top:14px; font-size:14px; font-weight:700; color:#${u.pptAccent};">${L(o.citation||"")}</div>
          </div>`:ue=`<ul style="font-size:20px; line-height:1.65; margin:20px 0 0 0; padding-left:24px;">
            ${o.bullets.map(A=>`<li style="margin-bottom:14px;">${A}</li>`).join("")}
          </ul>`,`
          <div class="slide-page" style="page-break-after:always; width:100%; height:100vh; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; padding:48px 60px; background:#${u.pptBg}; color:#${u.pptText};">
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.65; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
              <span>${L(i)}</span>
              <span>Lámina ${m+1} / ${p.length}</span>
            </div>
            <div style="my:auto;">
              ${b?`<div style="font-size:12px; font-weight:800; color:#${u.pptAccent}; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">${b}</div>`:""}
              <h1 style="font-size:34px; line-height:1.2; margin:0; font-family:'Outfit','Inter',sans-serif; font-weight:800;">${o.title}</h1>
              ${P?`<p style="font-size:16px; opacity:0.8; margin:8px 0 0 0;">${P}</p>`:""}
              ${ue}
            </div>
            <div style="border-top:1px solid rgba(148,163,184,0.25); padding-top:12px; display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#${u.pptAccent}; font-weight:700;">${Se?`Síntesis: ${Se}`:"WAPPY IA · Suite Ejecutiva SG-SST"}</span>
              <span style="opacity:0.6;">Formato 16:9</span>
            </div>
          </div>
        `}).join(""),a=`<!DOCTYPE html><html><head><title>${L(i)}</title><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet"><style>body{margin:0;padding:0;font-family:'Inter',sans-serif;}@media print{.slide-page{height:100vh;page-break-after:always!important;}@page{size:landscape;margin:0;}}</style></head><body>${t}<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body></html>`,n=window.open("","_blank");n&&(n.document.open(),n.document.write(a),n.document.close())};l.useEffect(()=>{C&&C(Ke)},[C,p,i]);const v=(t,a=!1)=>{var oe;let n=Array.isArray(t==null?void 0:t.data)?t.data:[];if(n.length===0&&Array.isArray(t==null?void 0:t.labels)&&Array.isArray(t==null?void 0:t.datasets)&&((oe=t.datasets[0])!=null&&oe.data)&&(n=t.labels.map((Y,Ae)=>({label:String(Y),val:Number(t.datasets[0].data[Ae]||0)}))),!t||n.length===0)return e.jsx("div",{className:"flex flex-col items-center justify-center h-44 border border-white/10 rounded-xl bg-black/20 text-white/50 text-xs",children:e.jsx("span",{children:"No hay datos de gráfico configurados."})});const o=t.type==="doughnut"?"pie":t.type||"bar",m=t.title||"",u=500,b=220,P=48,Se=26,ue=36,$e=36,c=u-P-Se,A=b-ue-$e,T=n.map(Y=>Number(Y.val)||0),U=Math.max(...T,1),G=Math.min(...T,0),V=U-G||1,Z=a?"#334155":"#cbd5e1",J=a?"#0f172a":"#ffffff";if(o==="pie"){let Y=T.reduce((we,Ce)=>we+Ce,0);Y===0&&(Y=1);let Ae=0;const de=u/2-70,ce=b/2+10,K=65,B=["#14b8a6","#10b981","#06b6d4","#f59e0b","#8b5cf6","#f43f5e"];return e.jsxs("svg",{viewBox:`0 0 ${u} ${b}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("text",{x:u/2,y:22,textAnchor:"middle",fill:J,className:"text-xs font-bold",children:m}),e.jsx("g",{children:n.map((we,Ce)=>{const De=(Number(we.val)||0)/Y*360,ra=de+K*Math.cos((Ae-90)*Math.PI/180),it=ce+K*Math.sin((Ae-90)*Math.PI/180);Ae+=De;const Mt=de+K*Math.cos((Ae-90)*Math.PI/180),Ft=ce+K*Math.sin((Ae-90)*Math.PI/180),Ue=De>180?1:0,Ze=`M ${de} ${ce} L ${ra} ${it} A ${K} ${K} 0 ${Ue} 1 ${Mt} ${Ft} Z`,lt=B[Ce%B.length];return e.jsx("path",{d:Ze,fill:lt,opacity:"0.9"},Ce)})}),e.jsx("g",{transform:`translate(${u-175}, ${ue+6})`,children:n.slice(0,6).map((we,Ce)=>e.jsxs("g",{transform:`translate(0, ${Ce*22})`,children:[e.jsx("rect",{width:11,height:11,rx:3,fill:B[Ce%B.length]}),e.jsxs("text",{x:18,y:9.5,fill:Z,className:"text-[10px] font-semibold",children:[String(we.label).slice(0,16)," (",we.val,")"]})]},Ce))})]})}const ee=Y=>{const Ae=(Y-G)/V;return b-$e-Ae*A};return e.jsxs("svg",{viewBox:`0 0 ${u} ${b}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"wappyBarGrad",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#14b8a6",stopOpacity:"0.95"}),e.jsx("stop",{offset:"100%",stopColor:"#0d9488",stopOpacity:"0.35"})]})}),e.jsx("text",{x:u/2,y:20,textAnchor:"middle",fill:J,className:"text-xs font-bold",children:m}),[0,.5,1].map((Y,Ae)=>{const de=G+Y*V,ce=ee(de);return e.jsxs("g",{children:[e.jsx("line",{x1:P,y1:ce,x2:u-Se,y2:ce,stroke:a?"#cbd5e1":"#334155",strokeWidth:"0.7",strokeDasharray:"4 4"}),e.jsx("text",{x:P-6,y:ce+3,textAnchor:"end",fill:Z,className:"text-[9px] font-semibold",children:de.toFixed(0)})]},Ae)}),n.map((Y,Ae)=>{const de=P+Ae/n.length*c+c/n.length*.15,ce=c/n.length*.7,K=ee(Number(Y.val)||0),B=Math.max(b-$e-K,2);return e.jsxs("g",{children:[e.jsx("rect",{x:de,y:K,width:ce,height:B,rx:5,fill:"url(#wappyBarGrad)"}),e.jsx("text",{x:de+ce/2,y:K-5,textAnchor:"middle",fill:J,className:"text-[9px] font-bold",children:Y.val}),e.jsx("text",{x:de+ce/2,y:b-$e+15,textAnchor:"middle",fill:Z,className:"text-[9px] font-semibold",children:String(Y.label).slice(0,12)})]},Ae)})]})},w=(t,a,n)=>e.jsxs("div",{className:"space-y-1.5 mb-3 shrink-0",children:[(t.kicker||!n)&&e.jsx("div",{className:"flex items-center gap-2",children:e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${a.accentBg}`,children:[e.jsx(Wa,{className:"h-3 w-3 shrink-0"}),n?e.jsx("span",{children:t.kicker||"GESTIÓN ESTRATÉGICA SG-SST"}):e.jsx("input",{type:"text",value:L(t.kicker||""),onChange:o=>D(d,{kicker:o.target.value}),placeholder:"CATEGORÍA / NORMA (EJ. DECRETO 1072)",className:"bg-transparent border-none outline-none text-[10px] font-extrabold uppercase tracking-wider w-56 placeholder:opacity-50"})]})}),n?e.jsx("h2",{className:`text-2xl md:text-4xl font-extrabold tracking-tight leading-tight ${a.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(At,{value:t.title,onChange:o=>D(d,{title:o}),className:`w-full bg-transparent border-none outline-none font-extrabold text-lg sm:text-2xl md:text-3xl leading-tight ${a.text}`,placeholder:"Escribe el titular ejecutivo de la diapositiva...",tagName:"h2"},`title-${d}`),(t.subtitle||!n)&&e.jsx("div",{children:n?t.subtitle&&e.jsx("p",{className:`text-sm md:text-lg ${a.subtext}`,children:t.subtitle}):e.jsx("input",{type:"text",value:L(t.subtitle||""),onChange:o=>D(d,{subtitle:o.target.value}),placeholder:"Añadir subtítulo o contexto ejecutivo (opcional)...",className:`w-full bg-transparent border-none outline-none text-xs sm:text-sm ${a.subtext} placeholder:opacity-40`})})]}),ie=(t,a=!1)=>{const n=t.layout||"bullets",o=Je[t.theme||"wappy-dark"]||Je["wappy-dark"];switch(n){case"title":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center items-center text-center my-auto px-4 py-2 space-y-4",children:[e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${o.accentBg}`,children:[e.jsx(We,{className:"h-3.5 w-3.5"}),t.kicker||"SISTEMA DE GESTIÓN SG-SST · WAPPY IA"]}),a?e.jsx("h1",{className:`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl ${o.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(At,{value:t.title,onChange:m=>D(d,{title:m}),className:`w-full bg-transparent border-none outline-none font-extrabold text-2xl sm:text-4xl text-center leading-tight ${o.text}`,placeholder:"Título de Portada Ejecutiva...",tagName:"h1"},`title-cover-${d}`),e.jsx("p",{className:`text-xs sm:text-base max-w-2xl font-medium ${o.subtext}`,children:t.subtitle||L(t.bullets[0]||"")}),e.jsx("div",{className:"h-1 w-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-lime-400 rounded-full opacity-90"})]});case"kpi-grid":{const m=t.kpis&&t.kpis.length>0?t.kpis:t.bullets.slice(0,4).map((u,b)=>{var ue,$e;const P=L(u),Se=P.split(":");return{label:((ue=Se[0])==null?void 0:ue.slice(0,28))||`Indicador Clave 0${b+1}`,value:(($e=Se[1])==null?void 0:$e.trim().slice(0,12))||`${92+b*2}%`,delta:"Meta cumplida",trend:"up",description:P}});return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),e.jsx("div",{className:"grid grid-cols-2 gap-2.5 sm:gap-3.5 my-auto",children:m.slice(0,4).map((u,b)=>e.jsxs("div",{className:`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between backdrop-blur-md transition-all ${o.cardBg}`,children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("span",{className:`text-xl sm:text-3xl font-black tracking-tight ${o.accent}`,children:u.value}),u.delta&&e.jsxs("span",{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border ${o.accentBg}`,children:[u.trend==="down"?e.jsx(qa,{className:"h-3 w-3"}):e.jsx(Ta,{className:"h-3 w-3"}),u.delta]})]}),e.jsxs("div",{className:"mt-2",children:[e.jsx("div",{className:`text-xs sm:text-sm font-extrabold ${o.text}`,children:u.label}),u.description&&e.jsx("p",{className:`text-[10px] sm:text-xs mt-0.5 line-clamp-2 ${o.subtext}`,children:u.description})]})]},b))})]})}case"columns":{const m=Math.ceil(t.bullets.length/2),u=t.columns&&t.columns.length>0?t.columns:[{title:"Diagnóstico / Estado Inicial",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,m)},{title:"Controles / Intervención SST",badge:"Plan de Acción",theme:"success",items:t.bullets.slice(m)}];return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),e.jsx("div",{className:`grid grid-cols-1 ${u.length>=3?"sm:grid-cols-3":"sm:grid-cols-2"} gap-3 my-auto`,children:u.slice(0,3).map((b,P)=>e.jsxs("div",{className:`rounded-2xl border p-3.5 sm:p-4 flex flex-col gap-2.5 backdrop-blur-md ${o.cardBg}`,children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 border-b border-current/10 pb-2",children:[e.jsx("h3",{className:`text-xs sm:text-base font-extrabold ${o.accent}`,children:b.title}),b.badge&&e.jsx("span",{className:`px-2 py-0.5 rounded-md text-[9px] font-bold border ${o.accentBg}`,children:b.badge})]}),e.jsx("ul",{className:`space-y-1.5 text-[11px] sm:text-xs font-medium ${o.text}`,children:(b.items||[]).map((Se,ue)=>e.jsxs("li",{className:"flex items-start gap-2 leading-relaxed",children:[e.jsx(It,{className:`h-3.5 w-3.5 mt-0.5 shrink-0 ${o.accent}`}),e.jsx("span",{children:L(Se)})]},ue))})]},P))})]})}case"timeline":{const m=t.steps&&t.steps.length>0?t.steps:t.bullets.slice(0,4).map((u,b)=>({phase:`FASE 0${b+1}`,title:L(u).slice(0,36),detail:L(u)}));return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto",children:m.slice(0,4).map((u,b)=>e.jsxs("div",{className:`rounded-2xl border p-3 flex flex-col justify-between relative backdrop-blur-md ${o.cardBg}`,children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx("span",{className:`text-[9px] font-black uppercase tracking-wider ${o.accent}`,children:u.phase||`PASO 0${b+1}`}),e.jsxs("span",{className:"h-5 w-5 rounded-lg bg-teal-500/20 text-teal-400 text-[10px] font-black flex items-center justify-center",children:["0",b+1]})]}),e.jsx("h4",{className:`text-xs sm:text-sm font-extrabold leading-snug ${o.text}`,children:u.title})]}),e.jsx("p",{className:`text-[10px] sm:text-xs mt-2 leading-relaxed line-clamp-3 ${o.subtext}`,children:u.detail})]},b))})]})}case"quote":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center my-auto w-full",children:[w(t,o,a),e.jsxs("div",{className:`rounded-2xl border-l-4 p-5 sm:p-6 backdrop-blur-md space-y-3 ${o.cardBg} ${o.border}`,children:[e.jsx(Va,{className:`h-7 w-7 opacity-60 ${o.accent}`}),e.jsxs("blockquote",{className:`text-sm sm:text-xl font-bold italic leading-relaxed ${o.text}`,children:["“",L(t.quote||t.bullets[0]||t.title),"”"]}),e.jsxs("div",{className:`text-xs sm:text-sm font-extrabold ${o.accent}`,children:["— ",t.citation||"Decreto Único Reglamentario 1072 de 2015 · Ministerio del Trabajo"]})]})]});case"split":return e.jsxs("div",{className:"flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center my-auto w-full",children:[e.jsx("div",{onClick:()=>!a&&re(!0),className:`relative group rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 shadow-lg bg-black/25 flex items-center justify-center ${a?"":"cursor-pointer hover:border-teal-500/50 transition-colors"}`,children:t.imageUrl?e.jsx("img",{src:t.imageUrl,alt:"",className:"w-full h-full object-cover transition-all duration-500 group-hover:scale-105"}):e.jsxs("div",{className:"flex flex-col items-center justify-center text-white/40 text-xs gap-2 p-4 text-center",children:[e.jsx(Bt,{className:"h-8 w-8 text-teal-400/70"}),e.jsx("span",{children:"Haz clic para agregar evidencia fotográfica o imagen"})]})}),e.jsxs("div",{className:"space-y-3",children:[w(t,o,a),e.jsx("ul",{className:`space-y-2 text-xs sm:text-sm font-medium ${o.text}`,children:t.bullets.map((m,u)=>e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(It,{className:`h-4 w-4 mt-0.5 shrink-0 ${o.accent}`}),e.jsx(At,{value:m,onChange:b=>Ge(u,b),className:"flex-1"},`split-b-${d}-${u}`)]},u))})]})]});case"media":return e.jsxs("div",{onClick:()=>!a&&re(!0),className:"relative flex-1 flex flex-col justify-end p-5 sm:p-8 bg-cover bg-center rounded-2xl overflow-hidden my-1",style:{backgroundImage:t.imageUrl?`url("${t.imageUrl}")`:'url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop")'},children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent pointer-events-none"}),e.jsxs("div",{onClick:m=>m.stopPropagation(),className:"relative z-10 w-full max-w-2xl bg-slate-950/65 border border-white/15 p-4 sm:p-6 rounded-2xl backdrop-blur-md space-y-2",children:[e.jsx("h2",{className:"text-lg sm:text-2xl font-extrabold text-white",children:L(t.title)}),e.jsx("ul",{className:"space-y-1 text-xs sm:text-sm text-slate-200 list-disc pl-4",children:t.bullets.slice(0,3).map((m,u)=>e.jsx("li",{children:L(m)},u))})]})]});case"table":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),t.tableHtml?e.jsx("div",{className:`max-h-[14rem] overflow-y-auto border rounded-xl p-3 scrollbar-thin ${o.cardBg}`,dangerouslySetInnerHTML:{__html:t.tableHtml}}):e.jsxs("div",{className:"flex flex-col items-center justify-center h-40 border border-dashed border-teal-500/30 rounded-xl bg-teal-500/5 text-xs text-center gap-2 p-4",children:[e.jsx(Na,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:o.text,children:'Usa "Conectar Lienzos" para importar un rango de Excel o aplica una plantilla SST.'})]})]});case"chart":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),e.jsx("div",{className:`flex-1 flex items-center justify-center p-3 rounded-2xl border min-h-[180px] ${o.cardBg}`,children:t.chartConfig?v(t.chartConfig,o.isLight):e.jsxs("div",{className:"flex flex-col items-center justify-center text-xs text-center gap-2 p-4",children:[e.jsx(Sa,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:o.text,children:'Importa un gráfico desde Hoja de Cálculo con "Conectar Lienzos".'})]})})]});case"bullets":default:return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[w(t,o,a),e.jsx("div",{className:"grid grid-cols-1 gap-2 my-auto max-h-[14rem] overflow-y-auto pr-1 scrollbar-thin",children:t.bullets.map((m,u)=>e.jsxs("div",{className:`flex items-start gap-3 rounded-xl border p-2.5 sm:p-3 backdrop-blur-sm transition-all ${o.cardBg}`,children:[e.jsxs("span",{className:`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black border ${o.accentBg}`,children:["0",u+1]}),a?e.jsx("div",{className:`text-sm sm:text-lg font-medium leading-relaxed ${o.text}`,dangerouslySetInnerHTML:{__html:m}}):e.jsx(At,{value:m,onChange:b=>Ge(u,b),className:`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${o.text}`,placeholder:"Escribe el punto clave..."},`bullet-${d}-${u}`)]},u))})]})}},q=p[d]||p[0],r=q&&Je[q.theme||"wappy-dark"]||Je["wappy-dark"],x=t=>{const a=t.currentTarget.getBoundingClientRect(),n=t.clientX-a.left;n>a.width*.7?S(o=>Math.min(p.length-1,o+1)):n<a.width*.3&&S(o=>Math.max(0,o-1))},g=t=>{F&&Ee({x:t.clientX,y:t.clientY})},h=()=>{if(!je||!q)return null;const t=Je[q.theme||"wappy-dark"]||Je["wappy-dark"];return Ot.createPortal(e.jsxs("div",{className:`fixed inset-0 z-[99999999] flex flex-col justify-between p-8 md:p-14 select-none ${F?"cursor-none":"cursor-default"} ${t.bg} animate-in fade-in duration-300`,onMouseMove:g,onClick:x,children:[F&&e.jsxs("div",{className:"pointer-events-none fixed z-[99999999] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out",style:{left:be.x,top:be.y},children:[e.jsx("div",{className:"absolute inset-0 w-8 h-8 -m-4 rounded-full bg-rose-500/30 blur-md animate-pulse"}),e.jsx("div",{className:"absolute inset-0 w-3 h-3 -m-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]"})]}),e.jsxs("div",{className:"flex items-center justify-between border-b border-current/10 pb-3 z-10",children:[e.jsxs("span",{className:`text-xs font-mono font-bold tracking-widest uppercase ${t.subtext}`,children:["Lámina ",String(d+1).padStart(2,"0")," / ",String(p.length).padStart(2,"0")]}),e.jsx("span",{className:`text-sm font-extrabold truncate max-w-md ${t.accent}`,children:i})]}),e.jsxs("div",{className:"my-auto max-w-6xl mx-auto w-full z-10 py-6 flex flex-col justify-center min-h-[65vh]",children:[ie(q,!0),q.takeaway&&e.jsxs("div",{className:`mt-6 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 ${t.accentBg}`,children:[e.jsx(We,{className:"h-4 w-4 shrink-0"}),e.jsxs("span",{children:["Síntesis Ejecutiva: ",L(q.takeaway)]})]})]}),e.jsxs("div",{className:"relative z-20 mx-auto bg-slate-900/85 border border-white/15 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between w-full max-w-xl",onClick:a=>a.stopPropagation(),children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>S(a=>Math.max(0,a-1)),disabled:d===0,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(la,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-bold text-white px-2",children:[d+1," / ",p.length]}),e.jsx("button",{onClick:()=>S(a=>Math.min(p.length-1,a+1)),disabled:d===p.length-1,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(Yt,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{onClick:Ke,className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30 cursor-pointer",children:[e.jsx(gt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Descargar"})]}),e.jsxs("button",{onClick:()=>z(!F),className:`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${F?"bg-rose-500/25 border-rose-500/50 text-rose-300":"bg-white/5 border-white/10 text-slate-300"}`,children:[e.jsx(Ua,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Láser"})]}),e.jsxs("button",{onClick:()=>{me(!1),z(!1)},className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-xl cursor-pointer",children:[e.jsx(Ha,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})]}),document.body)},E=()=>!ve||!q?null:Ot.createPortal(e.jsx("div",{className:"fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200",children:e.jsxs("div",{className:"relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pb-3.5",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Bt,{className:"h-5 w-5 text-teal-400"}),e.jsx("h3",{className:"text-base font-extrabold text-white",children:"Agregar Evidencia o Imagen"})]}),e.jsx("button",{onClick:()=>{re(!1),Me()},className:"p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer",children:e.jsx(rt,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"flex bg-slate-950/80 border border-white/10 p-1 rounded-2xl gap-1",children:["upload","camera","url"].map(t=>e.jsxs("button",{onClick:()=>f(t),className:`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${te===t?"bg-teal-500/20 border border-teal-500/40 text-teal-300":"text-slate-400 hover:text-white"}`,children:[t==="upload"?e.jsx(ca,{className:"h-3.5 w-3.5"}):t==="camera"?e.jsx(Ra,{className:"h-3.5 w-3.5"}):e.jsx(da,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:t==="upload"?"Cargar PC":t==="camera"?"Cámara":"Enlace URL"})]},t))}),e.jsxs("div",{className:"min-h-[190px] flex flex-col justify-center",children:[te==="upload"&&e.jsxs("div",{onDragOver:ae,onDragLeave:xe,onDrop:N,className:`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl gap-3 text-center ${Te?"border-teal-400 bg-teal-500/10":"border-white/15"}`,children:[e.jsx(ca,{className:"h-7 w-7 text-teal-400"}),e.jsx("p",{className:"text-xs font-bold text-slate-200",children:"Arrastra una imagen aquí o selecciona desde tu equipo"}),e.jsxs("label",{className:"px-4 py-2 text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 rounded-xl cursor-pointer",children:["Seleccionar Imagen",e.jsx("input",{type:"file",accept:"image/*",onChange:ne,className:"hidden"})]})]}),te==="camera"&&e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[fe?e.jsx("div",{className:"text-xs text-rose-400 font-semibold p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full text-center",children:fe}):e.jsx("div",{className:"relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10",children:e.jsx("video",{ref:Ie,autoPlay:!0,playsInline:!0,className:"w-full h-full object-cover scale-x-[-1]"})}),e.jsx("button",{onClick:qe,disabled:!!fe||!se,className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer disabled:opacity-40",children:"Capturar Fotografía"})]}),te==="url"&&e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("input",{type:"text",value:M,onChange:t=>R(t.target.value),placeholder:"https://ejemplo.com/evidencia.png",className:"w-full h-10 px-3 text-xs bg-slate-950 border border-white/15 rounded-xl outline-none focus:border-teal-500 text-white"}),e.jsx("button",{onClick:()=>M.trim()&&he(M.trim()),className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer",children:"Insertar Imagen"})]})]})]})}),document.body);return e.jsxs("div",{className:"flex h-full bg-surface-primary text-text-primary overflow-hidden relative",children:[O&&e.jsxs("div",{className:`hidden sm:flex flex-shrink-0 border-r border-border-medium bg-surface-secondary flex-col justify-between transition-all duration-300 ${H?"w-56 md:w-64":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"flex items-center justify-between px-1",children:[e.jsxs("span",{className:"text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider",children:["Láminas (",p.length,")"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{onClick:()=>Be("up"),disabled:d===0,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Subir diapositiva",children:e.jsx(oa,{className:"h-3.5 w-3.5"})}),e.jsx("button",{onClick:()=>Be("down"),disabled:d===p.length-1,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Bajar diapositiva",children:e.jsx(ia,{className:"h-3.5 w-3.5"})})]})]}),p.map((t,a)=>{const n=Je[t.theme||"wappy-dark"]||Je["wappy-dark"],o=a===d;return e.jsx("button",{onClick:()=>S(a),className:`w-full text-left rounded-xl border p-2 transition-all relative overflow-hidden group cursor-pointer ${o?"border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5 shadow-sm":"border-border-medium hover:border-teal-500/40 bg-surface-primary"}`,children:e.jsxs("div",{className:`h-16 w-full rounded-lg ${n.bg} p-2 flex flex-col justify-between overflow-hidden border border-white/10`,children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:`text-[8px] font-black uppercase ${n.accent}`,children:["0",a+1," · ",t.layout||"bullets"]})}),e.jsx("div",{className:`text-[9px] font-bold ${n.text} line-clamp-2 leading-tight`,children:L(t.title)})]})},a)})]}),e.jsxs("div",{className:"p-3 border-t border-border-medium bg-surface-primary flex items-center justify-center gap-2 shrink-0",children:[e.jsx(pe,{onClick:ye,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(pe,{onClick:I,icon:e.jsx(Dt,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(pe,{onClick:Fe,disabled:p.length<=1,icon:e.jsx(pt,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 overflow-hidden",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-primary shrink-0 z-30",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1 bg-surface-secondary border border-border-medium rounded-xl p-0.5",children:[e.jsx("button",{onClick:()=>S(t=>Math.max(0,t-1)),disabled:d===0,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Diapositiva anterior",children:e.jsx(la,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-extrabold px-2 text-text-primary select-none",children:[d+1," / ",p.length]}),e.jsx("button",{onClick:()=>S(t=>Math.min(p.length-1,t+1)),disabled:d===p.length-1,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Siguiente diapositiva",children:e.jsx(Yt,{className:"h-4 w-4"})})]}),e.jsx(pe,{onClick:ye,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(pe,{onClick:I,icon:e.jsx(Dt,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(pe,{onClick:Fe,disabled:p.length<=1,icon:e.jsx(pt,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"}),e.jsxs("div",{className:"relative",children:[e.jsx(pe,{onClick:()=>Q(t=>!t),icon:e.jsx(bt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Plantillas Ejecutivas SG-SST",variant:"amber",size:"sm",isActive:le}),le&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Presentaciones Ejecutivas SG-SST"}),Wt.map(t=>e.jsxs("button",{onClick:()=>Qe(t.id),className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:t.name}),e.jsxs("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:[t.category," · ",t.slides.length," diapositivas ejecutivas"]})]},t.id))]})]}),e.jsx(pe,{onClick:Xe,disabled:Oe,icon:e.jsx(We,{className:`h-4 w-4 ${Oe?"animate-spin":""}`}),label:"Transformar Diseño",title:"Transformar estructura visual automáticamente (KPIs / Columnas / PHVA / Cita)",variant:"purple",size:"sm"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(pe,{onClick:()=>k(t=>!t),icon:e.jsx(na,{className:"h-4 w-4"}),label:j?"Ocultar Diseño":"Diseño y Tema",title:"Abrir u ocultar el panel de estructuras, temas y notas",variant:"orange",size:"sm",isActive:j}),e.jsx(pe,{onClick:()=>ge(!0),icon:e.jsx(da,{className:"h-4 w-4"}),label:"Conectar Recursos",title:"Conectar con Hoja de Cálculo, Documento o Galería Google Flow",variant:"teal",size:"sm"}),e.jsx(pe,{onClick:()=>me(!0),icon:e.jsx(Pt,{className:"h-4 w-4"}),label:"Presentar",title:"Iniciar Presentación Pantalla Completa",variant:"cyan",size:"sm"}),e.jsx(pe,{onClick:Ke,disabled:_,icon:e.jsx(gt,{className:`h-4 w-4 ${_?"animate-bounce":""}`}),label:_?"Generando...":"Descargar Presentación",title:"Descargar presentación editable",variant:"green",size:"sm"}),e.jsx(pe,{onClick:tt,icon:e.jsx(Kt,{className:"h-4 w-4"}),label:"Imprimir",title:"Imprimir presentación en formato horizontal 16:9",variant:"neutral",size:"sm"})]})]}),q?e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 scrollbar-thin",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[!O&&e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin",children:p.map((t,a)=>{const n=a===d;return e.jsxs("button",{onClick:()=>S(a),className:`shrink-0 px-2.5 py-1 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${n?"bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 font-extrabold shadow-xs":"bg-surface-primary border-border-medium text-text-secondary hover:border-teal-500/30"}`,children:[e.jsxs("span",{className:"text-[10px] font-mono font-black opacity-75",children:["0",a+1]}),e.jsx("span",{className:"text-[11px] truncate max-w-[100px]",children:L(t.title)})]},a)})}),e.jsx("div",{className:"flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none ml-auto",children:va.map(t=>{const a=(q.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>D(d,{layout:t.key}),className:`shrink-0 py-1 px-2 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${a?"border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium bg-surface-primary hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:`aspect-[16/9] w-full rounded-2xl shadow-xl border ${r.bg} ${r.border} p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all`,children:[e.jsx("div",{className:"absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"flex items-center justify-between z-10 border-b border-current/10 pb-2",children:[e.jsxs("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase ${r.subtext}`,children:["LÁMINA ",String(d+1).padStart(2,"0")," / ",String(p.length).padStart(2,"0")," · ",r.label]}),e.jsx("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase truncate max-w-[220px] ${r.subtext}`,children:i})]}),e.jsx("div",{className:"my-auto w-full flex-1 flex flex-col justify-center z-10 py-2 relative overflow-hidden",children:ie(q,!1)}),e.jsxs("div",{className:"flex items-center justify-between gap-2 z-10 border-t border-current/10 pt-2.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-1 min-w-0",children:[e.jsx(We,{className:`h-3.5 w-3.5 shrink-0 ${r.accent}`}),e.jsx("input",{type:"text",value:L(q.takeaway||""),onChange:t=>D(d,{takeaway:t.target.value}),placeholder:"Añadir conclusión ejecutiva inferior (Takeaway)...",className:`w-full bg-transparent border-none outline-none text-[10px] sm:text-xs font-bold truncate ${r.accent} placeholder:opacity-50`})]}),e.jsx("span",{className:`text-[10px] font-semibold shrink-0 opacity-60 ${r.subtext}`,children:"WAPPY Canvas 2.0"})]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-3 sm:p-4 shadow-sm space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5",children:[e.jsx(na,{className:"h-4 w-4 text-teal-500"}),"Diseño Ejecutivo, Tema y Contenido de la Lámina"]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(pe,{onClick:()=>re(!0),icon:e.jsx(Bt,{className:"h-4 w-4"}),label:"Evidencia / Imagen",title:"Agregar fotografía o evidencia visual a la diapositiva",variant:"blue",size:"sm"}),e.jsx(pe,{onClick:Re,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Añadir Punto",title:"Añadir nuevo punto clave a la diapositiva",variant:"emerald",size:"sm"}),e.jsx(pe,{onClick:()=>k(!j),icon:j?e.jsx(oa,{className:"h-4 w-4"}):e.jsx(ia,{className:"h-4 w-4"}),label:j?"Contraer Panel":"Expandir Panel",title:j?"Contraer opciones avanzadas":"Expandir opciones de temas, puntos y notas",variant:"neutral",size:"sm",isActive:j})]})]}),j&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 border-t border-border-light",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Estructura Visual (10 Estructuras Ejecutivas)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-5 gap-1.5",children:va.map(t=>{const a=(q.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>D(d,{layout:t.key}),className:`py-1.5 px-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer text-center ${a?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:"space-y-2 pt-1",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:"text-[11px] font-bold text-text-secondary uppercase",children:["Puntos Clave de la Diapositiva (",q.bullets.length,")"]})}),e.jsx("div",{className:"space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin",children:q.bullets.map((t,a)=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-[10px] font-mono font-bold text-teal-500 w-4",children:["0",a+1]}),e.jsx("input",{type:"text",value:L(t),onChange:n=>Ge(a,n.target.value),className:"flex-1 h-8 px-2.5 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 text-text-primary"}),e.jsx("button",{onClick:()=>ze(a),disabled:q.bullets.length<=1,className:"p-1.5 text-text-tertiary hover:text-rose-500 disabled:opacity-30 cursor-pointer",title:"Eliminar punto",children:e.jsx(pt,{className:"h-3.5 w-3.5"})})]},a))})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Paleta y Atmósfera (8 Temas Corporativos)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:Object.keys(Je).map(t=>{const a=Je[t],n=(q.theme||"wappy-dark")===t;return e.jsxs("button",{onClick:()=>D(d,{theme:t}),className:`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${n?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,children:[e.jsx("div",{className:`h-3.5 w-3.5 rounded-md shrink-0 ${a.bg} border border-current/20`}),e.jsx("span",{className:"truncate",children:a.label})]},t)})})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("label",{className:"text-[11px] font-bold text-text-secondary uppercase flex items-center gap-1",children:[e.jsx(st,{className:"h-3 w-3 text-teal-500"}),"Notas del Orador (Guion de Exposición)"]}),e.jsx("textarea",{rows:2,value:L(q.speakerNotes||""),onChange:t=>D(d,{speakerNotes:t.target.value}),placeholder:"Escribe aquí tus apuntes de exposición para esta diapositiva...",className:"w-full p-2.5 text-xs bg-surface-secondary border border-border-medium rounded-xl outline-none focus:border-teal-500 text-text-primary resize-none"})]})]})]})]})]}):e.jsx("div",{className:"flex-1 flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-text-tertiary font-medium",children:"Cargando presentación..."})})]}),h(),E(),Ne&&e.jsx(aa,{onClose:()=>ge(!1),onImportTable:at,onImportChart:ot,onImportBullets:et,onImportMedia:t=>{he(t.publicUrl)},activeFileType:"presentation",initialTab:"media"})]})},Mr=(s,y)=>{switch(s){case"Cpu":return e.jsx(xa,{className:`h-4 w-4 ${y}`});case"Layers":return e.jsx(bt,{className:`h-4 w-4 ${y}`});case"Plus":return e.jsx(ct,{className:`h-4 w-4 ${y}`});case"Eye":return e.jsx(ta,{className:`h-4 w-4 ${y}`});case"Sparkles":return e.jsx(We,{className:`h-4 w-4 ${y}`});default:return e.jsx(xa,{className:`h-4 w-4 ${y}`})}};function $a(s){if(!s||typeof s!="string")return"";let y=s.trim();return y=y.replace(/<thinking>[\s\S]*?<\/thinking>/gi,"").trim(),y=y.replace(/^```(?:html|xml)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim(),y}function Tt(s,y=!1){if(!s)return"";let i=$a(s);i=i.replace(/<style id="__wappy_standalone_design_system__">[\s\S]*?<\/style>\s*/gi,"").replace(/<script id="__wappy_modal_guard__">[\s\S]*?<\/script>\s*/gi,""),i=i.replace(/(<svg[^>]*>[\s\S]*?<path[^>]*?)fill="currentColor"/gi,'$1fill="rgba(255,255,255,0.25)"');const O=/<html[^>]*>/i.test(i),C=/<head[^>]*>/i.test(i),p=/bg-\[#0b0f19\]|dark|slate-900|slate-950|gradient-banner/i.test(i),$=`
<script>
(function() {
  // 1. Shims resilientes para librerías comunes (Lucide, Chart.js)
  // No sobreescribimos window.tailwind antes de tiempo para no sabotear el motor JIT de Tailwind CDN
  if (typeof window.lucide === 'undefined') {
    window.lucide = {
      createIcons: function() {
        try {
          if (document.querySelectorAll) {
            var iconEls = document.querySelectorAll('[data-lucide], i[class*="lucide-"]');
          }
        } catch(e) {}
      }
    };
  }
  if (typeof window.Chart === 'undefined') {
    window.Chart = function() {
      return {
        destroy: function() {},
        update: function() {},
        resize: function() {},
        data: { datasets: [] }
      };
    };
  }

  // 2. Polyfill seguro y robusto para localStorage / sessionStorage en iframe sandboxed y visores locales
  var _createMockStorage = function() {
    var _memStore = {};
    return {
      getItem: function(k) { return Object.prototype.hasOwnProperty.call(_memStore, k) ? _memStore[k] : null; },
      setItem: function(k, v) { _memStore[k] = String(v); },
      removeItem: function(k) { delete _memStore[k]; },
      clear: function() { _memStore = {}; },
      key: function(i) { return Object.keys(_memStore)[i] || null; },
      get length() { return Object.keys(_memStore).length; }
    };
  };

  try {
    var _testK = '__wappy_test__';
    window.localStorage.setItem(_testK, _testK);
    window.localStorage.removeItem(_testK);
  } catch (e) {
    try {
      var _mockLocal = _createMockStorage();
      Object.defineProperty(window, 'localStorage', {
        value: _mockLocal,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.localStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  try {
    var _sKey = '__wappy_stest__';
    window.sessionStorage.setItem(_sKey, _sKey);
    window.sessionStorage.removeItem(_sKey);
  } catch (e) {
    try {
      var _mockSession = _createMockStorage();
      Object.defineProperty(window, 'sessionStorage', {
        value: _mockSession,
        configurable: true,
        writable: true
      });
    } catch (errDef) {
      try { window.sessionStorage = _createMockStorage(); } catch (errAssign) {}
    }
  }

  // 3. Polyfill seguro para history.pushState / history.replaceState
  try {
    var _origPush = window.history.pushState;
    window.history.pushState = function() {
      try {
        if (_origPush) return _origPush.apply(window.history, arguments);
      } catch (err) {}
    };
    var _origReplace = window.history.replaceState;
    window.history.replaceState = function() {
      try {
        if (_origReplace) return _origReplace.apply(window.history, arguments);
      } catch (err) {}
    };
  } catch (e) {}

  // 4. Manejador global de excepciones para evitar que un error no capturado congele la interfaz
  window.addEventListener('error', function(e) {
    console.warn('[Canvas Sandbox Script Warning]:', e.message, 'en', e.filename, ':', e.lineno);
  });
  window.addEventListener('unhandledrejection', function(e) {
    console.warn('[Canvas Sandbox Unhandled Rejection]:', e.reason);
  });

  // 5. Disparador de eventos de resize, iconos y readiness para reactivar scripts interactivos
  function _autoHideInitialBlockingModals() {
    try {
      // 1) Asegurar que todo elemento fijo o modal con la clase .hidden tenga display: none !important
      var hiddenEls = document.querySelectorAll('.hidden');
      hiddenEls.forEach(function(el) {
        if (el.classList.contains('fixed') || (el.id && el.id.toLowerCase().indexOf('modal') !== -1)) {
          el.classList.remove('flex', 'block', 'grid');
          el.style.setProperty('display', 'none', 'important');
        }
      });

      // 2) Ocultar cualquier modal de asistente, diagnóstico o ayuda que esté tapando la pantalla al iniciar
      var overlays = document.querySelectorAll('.fixed.inset-0, [id*="modal"], [id*="assistant"], [id*="asistente"]');
      overlays.forEach(function(el) {
        var text = (el.innerText || '').toLowerCase();
        var id = (el.id || '').toLowerCase();
        if (
          id === 'modalia' ||
          id.indexOf('modal') !== -1 ||
          id.indexOf('assistant') !== -1 ||
          id.indexOf('asistente') !== -1 ||
          id.indexOf('help') !== -1 ||
          id.indexOf('info') !== -1 ||
          text.indexOf('asistente virtual') !== -1 ||
          text.indexOf('diagnóstico automático') !== -1 ||
          text.indexOf('causas frecuentes') !== -1 ||
          text.indexOf('información importante') !== -1 ||
          text.indexOf('cumplimiento legal') !== -1 ||
          text.indexOf('wappy ai copilot') !== -1
        ) {
          if (el.id !== 'wappy-ai-floating-btn' && el.id !== 'wappy-ai-floating-trigger') {
            _closeModalElement(el);
          }
        }
      });
    } catch (e) {}
  }

  function _kickstartApp() {
    try {
      _autoHideInitialBlockingModals();
      if (typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
      window.dispatchEvent(new Event('resize'));
    } catch (e) {}
  }

  // 6. Manejador Universal de Cierre y Apertura de Modales y Drawers (Evita recuadros bloqueados o sin función de cierre)
  function _closeModalElement(modalEl) {
    if (!modalEl) return;
    try {
      modalEl.classList.add('hidden');
      modalEl.classList.remove('flex', 'block', 'grid', 'open', 'active', 'show');
      modalEl.style.setProperty('display', 'none', 'important');
      modalEl.setAttribute('aria-hidden', 'true');
      // Si es un drawer lateral que usa translate-x-full
      if (modalEl.id === 'ai-drawer' || modalEl.className.indexOf('right-0') !== -1) {
        modalEl.classList.add('translate-x-full');
      }
    } catch (e) {}
  }

  function _openModalElement(modalEl) {
    if (!modalEl) return;
    try {
      modalEl.style.removeProperty('display');
      modalEl.classList.remove('hidden', 'translate-x-full');
      if (!modalEl.classList.contains('flex') && !modalEl.classList.contains('block') && !modalEl.classList.contains('grid')) {
        modalEl.classList.add('flex');
      }
      modalEl.setAttribute('aria-hidden', 'false');
    } catch (e) {}
  }

  // Interceptar classList.remove('hidden') para limpiar cualquier display:none inline previo cuando el usuario sí quiera abrir un modal
  try {
    var _origClassListRemove = DOMTokenList.prototype.remove;
    DOMTokenList.prototype.remove = function() {
      var res = _origClassListRemove.apply(this, arguments);
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] === 'hidden' || arguments[i] === 'translate-x-full') {
          try {
            var hiddenFixed = document.querySelectorAll('[style*="display: none"]');
            hiddenFixed.forEach(function(el) {
              if (!el.classList.contains('hidden')) {
                el.style.removeProperty('display');
              }
            });
          } catch (err) {}
          break;
        }
      }
      return res;
    };
  } catch (e) {}

  // Funciones globales de respaldo por si el HTML generado las invoca pero olvidó definirlas
  var _fallbackCloseFns = [
    'closeModal', 'closeAssistant', 'closeAiModal', 'closeLegalModal',
    'closeImportantInfoModal', 'cerrarModal', 'cerrarModalIA', 'cerrarAsistente', 'hideModal',
    'dismissModal', 'toggleModal', 'closeSyncModal', 'ejecutarSincronizacion', 'syncCanvas'
  ];
  _fallbackCloseFns.forEach(function(fnName) {
    if (typeof window[fnName] !== 'function') {
      window[fnName] = function() {
        var overlays = document.querySelectorAll('.fixed.inset-0, [id*="modal"], [id*="assistant"], [id*="asistente"], [id*="dialog"], [role="dialog"]');
        overlays.forEach(function(el) { _closeModalElement(el); });
      };
    }
  });

  // Delegación global de clics para botones de cerrar (✕, X, Cerrar, Entendido), botón flotante de Asistente IA y clic en el fondo oscuro (backdrop)
  document.addEventListener('click', function(e) {
    try {
      var target = e.target;
      if (!target || typeof target.closest !== 'function') return;

      // A) Clic directo en el backdrop oscuro (div.fixed.inset-0) fuera de la tarjeta del modal
      if (
        target.classList &&
        target.classList.contains('fixed') &&
        target.classList.contains('inset-0') &&
        target.children.length > 0
      ) {
        _closeModalElement(target);
        return;
      }

      // B) Clic en el botón flotante #wappy-ai-floating-btn si no tiene handler propio
      var floatingBtn = target.closest('#wappy-ai-floating-btn, #wappy-ai-floating-trigger');
      if (floatingBtn && !floatingBtn.getAttribute('onclick')) {
        var drawer = document.querySelector('#wappy-ai-chat-drawer, #ai-drawer, [id*="assistant-modal"], [id*="ai-modal"], [id*="asistente"]');
        if (drawer) {
          if (drawer.classList.contains('hidden') || drawer.classList.contains('translate-x-full')) {
            _openModalElement(drawer);
          } else {
            _closeModalElement(drawer);
          }
          return;
        }
      }

      // C) Clic en un botón de cierre dentro de cualquier modal/overlay fijo
      var btn = target.closest('button, [role="button"], a, .cursor-pointer');
      if (!btn) return;

      var modalContainer = btn.closest('.fixed.inset-0, [id*="modal"], [id*="dialog"], [id*="assistant"], [id*="asistente"], [role="dialog"], #wappy-ai-chat-drawer, #ai-drawer');
      if (!modalContainer) return;

      var rawText = (btn.innerText || btn.textContent || '').trim();
      var cleanText = rawText.toLowerCase();
      var ariaLabel = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
      var onclickAttr = (btn.getAttribute('onclick') || '').toLowerCase();
      var hasXIcon = btn.querySelector('[data-lucide="x"], .lucide-x, svg line[x1="18"][y1="6"], svg path[d*="M18 6"], svg path[d*="6 18"], svg path[d*="M6 18"], svg path[d*="18 6"]');

      var isCloseAction =
        cleanText === 'x' ||
        cleanText === '✕' ||
        cleanText === '✖' ||
        cleanText === '×' ||
        cleanText === 'cerrar' ||
        cleanText === 'entendido' ||
        cleanText === 'ocultar' ||
        cleanText === 'salir' ||
        cleanText === 'aceptar' ||
        cleanText === 'continuar' ||
        ariaLabel.indexOf('cerrar') !== -1 ||
        ariaLabel.indexOf('close') !== -1 ||
        onclickAttr.indexOf('close') !== -1 ||
        onclickAttr.indexOf('cerrar') !== -1 ||
        onclickAttr.indexOf('hide') !== -1 ||
        onclickAttr.indexOf('dismiss') !== -1 ||
        onclickAttr.indexOf('sincronizar') !== -1 ||
        cleanText.indexOf('ejecutar sincronización') !== -1 ||
        Boolean(hasXIcon && cleanText.length <= 2);

      if (isCloseAction) {
        setTimeout(function() {
          _closeModalElement(modalContainer);
        }, 10);
      }
    } catch (err) {}
  }, true);

  // Cerrar cualquier modal abierto con la tecla Escape
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      var overlays = document.querySelectorAll('.fixed.inset-0:not(.hidden), [id*="modal"]:not(.hidden), [id*="assistant"]:not(.hidden), [id*="asistente"]:not(.hidden), [role="dialog"]:not(.hidden)');
      overlays.forEach(function(el) { _closeModalElement(el); });
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _kickstartApp);
  } else {
    setTimeout(_kickstartApp, 50);
    setTimeout(_kickstartApp, 250);
    setTimeout(_kickstartApp, 600);
  }
})();
<\/script>
`,d=`
<style id="__wappy_standalone_design_system__">
  /* ── 1. Reset Móvil y Tipografía de Sistema ── */
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    overflow-x: hidden !important;
    max-width: 100vw;
    -webkit-text-size-adjust: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    line-height: 1.5;
    background-color: ${p?"#0b0f19":"#ffffff"} !important;
    color: ${p?"#f8fafc":"#1e293b"} !important;
  }

  img, canvas, svg, video {
    max-width: 100%;
  }

  /* ── 2. Banner Superior WAPPY (Degradado Esmeralda/Cyan & Banner Institucional) ── */
  .gradient-banner {
    background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%) !important;
    color: #ffffff !important;
    position: relative !important;
    overflow: hidden !important;
    border-radius: 1.5rem !important;
    padding: 1.5rem !important;
    margin-bottom: 1.5rem !important;
    box-shadow: 0 10px 25px -5px rgba(13, 148, 136, 0.35) !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
  }
  @media (min-width: 768px) {
    .gradient-banner {
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 2rem !important;
    }
  }
  .gradient-banner h1 {
    font-size: clamp(1.2rem, 4vw, 1.85rem) !important;
    font-weight: 900 !important;
    margin: 0 !important;
    line-height: 1.2 !important;
    color: #ffffff !important;
    letter-spacing: -0.02em !important;
  }
  .gradient-banner h2 {
    font-size: clamp(0.75rem, 2.5vw, 0.875rem) !important;
    font-weight: 700 !important;
    margin: 0.25rem 0 0 0 !important;
    color: #ccfbf1 !important;
    letter-spacing: 0.05em !important;
  }
  .gradient-banner p {
    font-size: 0.75rem !important;
    margin: 0.25rem 0 0 0 !important;
    color: #a5f3fc !important;
  }

  /* Banner Oficial Institucional de Informes (wappy-standard-header-banner) */
  .wappy-standard-header-banner {
    box-sizing: border-box !important;
    width: 100% !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 20px !important;
  }
  .wappy-header-logo-container {
    flex-shrink: 0 !important;
    order: 1 !important;
  }
  .wappy-header-title-box {
    flex-grow: 1 !important;
    min-width: 0 !important;
    order: 2 !important;
  }
  .wappy-header-badge-container {
    flex-shrink: 0 !important;
    order: 3 !important;
  }

  @media (max-width: 640px) {
    .wappy-standard-header-banner {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      grid-template-areas:
        "logo . badge"
        "title title title" !important;
      gap: 12px 10px !important;
      padding: 14px 16px !important;
      border-radius: 16px !important;
      align-items: center !important;
    }
    .wappy-header-logo-container {
      grid-area: logo !important;
      width: 46px !important;
      height: 46px !important;
      min-width: 46px !important;
      padding: 6px !important;
      border-radius: 12px !important;
    }
    .wappy-header-logo-container img {
      max-height: 32px !important;
      max-width: 70px !important;
    }
    .wappy-header-badge-container {
      grid-area: badge !important;
      justify-self: end !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
    }
    .wappy-header-badge-container span {
      font-size: 8px !important;
      letter-spacing: 0.3px !important;
    }
    .wappy-header-title-box {
      grid-area: title !important;
      width: 100% !important;
      min-width: 0 !important;
      margin-top: 4px !important;
    }
    .wappy-header-title-box h1 {
      font-size: 13.5px !important;
      line-height: 1.3 !important;
      word-break: break-word !important;
      overflow-wrap: break-word !important;
    }

    /* Tablas Corporativas Adaptativas en Celular */
    .wappy-entity-table, .wappy-worker-table {
      display: block !important;
      width: 100% !important;
      table-layout: auto !important;
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    .wappy-entity-table thead, .wappy-entity-table tbody,
    .wappy-worker-table thead, .wappy-worker-table tbody {
      display: block !important;
      width: 100% !important;
    }
    .wappy-entity-table thead tr, .wappy-worker-table thead tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-entity-table thead th, .wappy-worker-table thead th {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 8px 12px !important;
      font-size: 10px !important;
      text-align: center !important;
      white-space: normal !important;
      word-break: normal !important;
      line-height: 1.35 !important;
    }
    .wappy-entity-table tbody tr {
      display: grid !important;
      grid-template-columns: 105px 1fr !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody tr {
      display: grid !important;
      grid-template-columns: 125px 1fr !important;
      width: 100% !important;
      box-sizing: border-box !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody tr:last-child,
    .wappy-worker-table tbody tr:last-child {
      border-bottom: none !important;
    }
    .wappy-entity-table tbody td,
    .wappy-worker-table tbody td {
      display: block !important;
      box-sizing: border-box !important;
      padding: 6px 10px !important;
      font-size: 10.5px !important;
      line-height: 1.3 !important;
      width: auto !important;
      word-break: break-word !important;
      border: none !important;
    }
    .wappy-entity-table tbody td:nth-child(1) {
      font-weight: 700 !important;
      background-color: #f8fafc !important;
      color: #334155 !important;
      border-right: 1px solid #e2e8f0 !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(1) {
      font-weight: 700 !important;
      background-color: #f0fdfa !important;
      color: #0f766e !important;
      border-right: 1px solid #ccfbf1 !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(2) {
      background-color: #ffffff !important;
      border-bottom: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(2) {
      background-color: #ffffff !important;
      border-bottom: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(3) {
      font-weight: 700 !important;
      background-color: #f8fafc !important;
      color: #334155 !important;
      border-right: 1px solid #e2e8f0 !important;
    }
    .wappy-worker-table tbody td:nth-child(3) {
      font-weight: 700 !important;
      background-color: #f0fdfa !important;
      color: #0f766e !important;
      border-right: 1px solid #ccfbf1 !important;
    }
    .wappy-entity-table tbody td:nth-child(4),
    .wappy-worker-table tbody td:nth-child(4) {
      background-color: #ffffff !important;
    }
    .wappy-entity-table tbody td[colspan="3"],
    .wappy-worker-table tbody td[colspan="3"] {
      grid-column: 2 / -1 !important;
      border-bottom: none !important;
    }
    .wappy-entity-table tbody tr:has(td[colspan="3"]) td:nth-child(1),
    .wappy-worker-table tbody tr:has(td[colspan="3"]) td:nth-child(1) {
      border-bottom: none !important;
    }
    
    /* Bloques de Firmas Adaptativas */
    .wappy-signature-table, .wappy-signature-table tbody, .wappy-signature-table tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-signature-table td {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 12px 6px !important;
    }
    .wappy-committee-table, .wappy-committee-table tbody, .wappy-committee-table tr {
      display: block !important;
      width: 100% !important;
    }
    .wappy-committee-table td {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 6px 0 !important;
    }
  }

  /* ── 3. Tarjetas, Paneles y Contenedores ── */
  .bg-slate-900\\/60, .glass-card, [class*="bg-slate-900"], [class*="bg-slate-950"] {
    background-color: ${p?"rgba(15, 23, 42, 0.75)":"#ffffff"} !important;
    border: 1px solid ${p?"rgba(51, 65, 85, 0.7)":"#e2e8f0"} !important;
    border-radius: 1rem !important;
    padding: 1.25rem !important;
    margin-bottom: 1.25rem !important;
    color: ${p?"#f8fafc":"#1e293b"} !important;
  }

  /* ── 4. Tablas Técnicas Responsivas ── */
  .overflow-x-auto {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch !important;
    width: 100% !important;
    max-width: 100% !important;
  }
  table:not(.wappy-entity-table):not(.wappy-worker-table):not(.wappy-signature-table):not(.wappy-committee-table) {
    width: 100% !important;
    border-collapse: collapse !important;
    font-size: 0.875rem !important;
    text-align: left !important;
  }
  th:not(.wappy-entity-table th):not(.wappy-worker-table th) {
    background-color: ${p?"rgba(30, 41, 59, 0.85)":"#f1f5f9"} !important;
    color: ${p?"#94a3b8":"#475569"} !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 0.75rem 1rem !important;
    border-bottom: 2px solid ${p?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
  }
  td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid ${p?"rgba(51, 65, 85, 0.4)":"#e2e8f0"} !important;
    color: ${p?"#e2e8f0":"#1e293b"} !important;
  }
  @media (max-width: 640px) {
    th:not(.wappy-entity-table th):not(.wappy-worker-table th),
    td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
      padding: 0.5rem 0.6rem !important;
      font-size: 0.75rem !important;
    }
  }

  /* ── 5. Controles de Formulario Móviles (Evitar aspecto crudo de iOS/Safari) ── */
  select, input[type="text"], input[type="number"], input[type="date"], input[type="email"], textarea {
    font-family: inherit !important;
    border: 1px solid ${p?"#334155":"#cbd5e1"} !important;
    border-radius: 0.625rem !important;
    padding: 0.55rem 0.85rem !important;
    outline: none !important;
    background-color: ${p?"#1e293b":"#ffffff"} !important;
    color: ${p?"#f8fafc":"#0f172a"} !important;
    font-size: 0.875rem !important;
    max-width: 100% !important;
    transition: border-color 0.2s ease-in-out !important;
  }
  select:focus, input:focus, textarea:focus {
    border-color: #0d9488 !important;
    box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.25) !important;
  }

  /* ── 6. Botones Principales ── */
  button, [type="button"], [type="reset"], [type="submit"] {
    font-family: inherit !important;
    border-radius: 0.625rem !important;
    padding: 0.5rem 1rem !important;
    font-weight: 700 !important;
    font-size: 0.8125rem !important;
    cursor: pointer !important;
    border: 1px solid ${p?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
    background-color: ${p?"#1e293b":"#f1f5f9"} !important;
    color: ${p?"#f8fafc":"#0f172a"} !important;
    transition: all 0.2s ease-in-out !important;
  }
  button:active, [type="button"]:active {
    transform: scale(0.97) !important;
  }

  /* ── 7. Utilidades Base (Respetando estrictamente .hidden sobre .flex / .block / .grid) ── */
  .overflow-hidden { overflow: hidden !important; }
  .absolute { position: absolute !important; }
  .relative { position: relative !important; }
  .flex:not(.hidden) { display: flex !important; }
  .items-center { align-items: center !important; }
  .justify-between { justify-content: space-between !important; }
  .gap-2 { gap: 0.5rem !important; }
  .gap-4 { gap: 1rem !important; }
  .hidden,
  [hidden],
  .hidden.flex,
  .hidden.block,
  .hidden.grid,
  .hidden.inline-flex,
  .hidden.inline-block {
    display: none !important;
  }

  /* ── 8. SVGs de Fondo Protegidos ── */
  .gradient-banner svg,
  .opacity-10 svg,
  svg[viewBox="0 0 200 200"] {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0.15 !important;
    fill: rgba(255, 255, 255, 0.25) !important;
    color: rgba(255, 255, 255, 0.25) !important;
    pointer-events: none !important;
  }
</style>
`,S=y?`
<script src="https://cdn.tailwindcss.com"><\/script>
<script src="https://unpkg.com/lucide@latest"><\/script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
<script>
  if (window.tailwind) {
    tailwind.config = { darkMode: 'class' };
  }
<\/script>
`:`
<script src="/assets/tailwind-cdn.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://cdn.tailwindcss.com'; document.head.appendChild(s);"><\/script>
<script src="/assets/lucide.min.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://unpkg.com/lucide@latest'; document.head.appendChild(s);"><\/script>
<script src="/assets/chart.min.js" onerror="this.onerror=null; var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/chart.js'; document.head.appendChild(s);"><\/script>
<script>
  if (window.tailwind) {
    tailwind.config = { darkMode: 'class' };
  }
<\/script>
`,k=/<meta[^>]+name=["']viewport["']/i.test(i)?"":`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
`;return O?C?i=i.replace(/<head[^>]*>/i,H=>`${H}
${k}${S}${$}
${d}`):i=i.replace(/<html[^>]*>/i,H=>`${H}
<head>
${k}${S}${$}
${d}
</head>`):i=`<!DOCTYPE html>
<html lang="es" ${p?'class="dark"':""}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${S}
  ${$}
  ${d}
</head>
<body class="${p?"bg-[#0b0f19] text-slate-100":"bg-slate-50 text-slate-900"}">
  ${i}
</body>
</html>`,i}const Fr=({initialContent:s,onUpdate:y,title:i,isMaximized:O=!1,onRegisterDownload:C})=>{const{user:p}=wt(),$=(p==null?void 0:p.role)==="ADMIN"||(p==null?void 0:p.role)==="USER_PRO"||(p==null?void 0:p.role)==="USER_IPEVAR"||(p==null?void 0:p.role)==="IPEVAR",[d,S]=l.useState(""),[j,k]=l.useState(O?"split":"preview"),[H,Pe]=l.useState(!1),[le,Q]=l.useState(0),_=l.useRef(null),W=l.useRef(null),Oe=l.useRef(null),[ke,je]=Zt(ht.canvasMaximized),[me,F]=l.useState(!1),[z,be]=l.useState(!1),Ee=f=>{const M=d||"";let R="";/<\/body>/i.test(M)?R=M.replace(/<\/body>/i,`
${f}
</body>`):R=`${M}
${f}`,S(R),y(R),Q(fe=>fe+1)};l.useEffect(()=>{const f=()=>{document.fullscreenElement||F(!1)};return document.addEventListener("fullscreenchange",f),document.addEventListener("webkitfullscreenchange",f),()=>{document.removeEventListener("fullscreenchange",f),document.removeEventListener("webkitfullscreenchange",f)}},[]),l.useEffect(()=>{const f=M=>{M.key==="Escape"&&me&&F(!1)};return window.addEventListener("keydown",f),()=>window.removeEventListener("keydown",f)},[me]);const Ne=async()=>{const f=!me;F(f),f&&je(!0);const M=Oe.current||W.current;if(f)try{M!=null&&M.requestFullscreen?await M.requestFullscreen():M.webkitRequestFullscreen&&await M.webkitRequestFullscreen()}catch{}else try{document.fullscreenElement&&(document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen())}catch{}};l.useEffect(()=>{const f=()=>{const M=window.innerWidth<640;(!O||M)&&j==="split"&&k("preview")};return f(),window.addEventListener("resize",f),()=>window.removeEventListener("resize",f)},[O,j]),l.useEffect(()=>{S(s?$a(s):`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <!-- Tailwind CSS CDN for premium utility styling -->
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: .9; transform: scale(0.99); }
    }
  </style>
</head>
<body class="p-6 sm:p-12">
  <div class="max-w-xl text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
      <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
      Prototipo de Código WAPPY
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-6">
      Bienvenido al sandbox interactivo de prototipos en HTML. Inserta componentes premium de SST desde la barra lateral izquierda y observa cómo cobran vida en tiempo real en la vista previa.
    </p>
    <div class="inline-flex gap-2">
      <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
      <span class="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Listo para Inyectar</span>
    </div>
  </div>
</body>
</html>`)},[s]);const ge=f=>{const M=f.target.value;S(M),y(M)},ve=l.useCallback(async()=>{try{const f=d||s||"";if(!f)return;const M=Tt(f,!0),R=(i||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),fe=R.endsWith(".html")?R:`${R}.html`,X=new Blob([M],{type:"text/html;charset=utf-8"});if(typeof navigator<"u"&&navigator.canShare&&typeof File<"u")try{const se=new File([X],fe,{type:"text/html"});if(navigator.canShare({files:[se]})){await navigator.share({files:[se],title:i||"Aplicativo SST"});return}}catch(se){if((se==null?void 0:se.name)==="AbortError")return;console.warn("Native share failed, falling back to saveAs:",se)}ea.saveAs(X,fe)}catch(f){console.error("Error al descargar HTML:",f);try{const R=Tt(d||s||"",!0),fe=(i||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),X=fe.endsWith(".html")?fe:`${fe}.html`,se=new Blob([R],{type:"text/html;charset=utf-8"}),He=URL.createObjectURL(se),Te=document.createElement("a");Te.href=He,Te.download=X,Te.target="_blank",document.body.appendChild(Te),Te.click(),setTimeout(()=>{try{document.body.removeChild(Te),URL.revokeObjectURL(He)}catch{}},5e3)}catch(M){console.error("Fallback download failed:",M)}}},[d,s,i]),re=()=>{const f=Tt(d,!0),M=new Blob([f],{type:"text/html;charset=utf-8"}),R=URL.createObjectURL(M);window.open(R,"_blank")},te=wa.useMemo(()=>Tt(d),[d]);return l.useEffect(()=>{C&&C(ve)},[C,d,i]),e.jsxs("div",{ref:W,className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[H&&e.jsx("div",{className:`${O?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>Pe(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${O?"sm:relative sm:z-0":"shadow-2xl"} ${H?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(bt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Aplicativos SST"})]}),e.jsx("button",{onClick:()=>Pe(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-1 flex items-center gap-1",children:[e.jsx(We,{className:"h-3 w-3 text-amber-500"}),"Simuladores y Calculadoras SST"]}),e.jsx("div",{className:"space-y-2.5",children:kr.map(f=>e.jsxs("button",{onClick:()=>{if(!$){alert("Este aplicativo premium es exclusivo para usuarios Pro de Wappy. Por favor actualice su suscripción.");return}d&&d.trim()!==""&&!d.includes("Prototipo de Código WAPPY")&&!d.includes("Prototipo Interactivo WAPPY")&&!window.confirm(`¿Deseas reemplazar el código actual por el aplicativo "${f.title}"? Se perderán las modificaciones no guardadas.`)||(S(f.code),y(f.code),O||Pe(!1))},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:Mr(f.iconType,f.color)}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:f.title}),$?e.jsx("span",{className:"text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity",children:"+ Insertar"}):e.jsxs("span",{className:"flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0",children:[e.jsx(Ya,{className:"h-2 w-2"}),"PRO"]})]}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:f.description})]})]},f.id))})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-secondary flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(pe,{onClick:()=>Pe(f=>!f),icon:e.jsx(bt,{className:"h-4 w-4"}),label:"Biblioteca SST",title:"Abrir simuladores, calculadoras y componentes interactivos SST",variant:"amber",size:"sm",isActive:H}),e.jsxs("div",{className:"flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-xs",children:[O&&e.jsxs("button",{onClick:()=>k("split"),className:`hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${j==="split"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(Ja,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Dividido"})]}),e.jsxs("button",{onClick:()=>k("code"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${j==="code"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(zt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Código"})]}),e.jsxs("button",{onClick:()=>k("preview"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${j==="preview"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(ta,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Vista Previa"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(pe,{onClick:()=>be(!0),icon:e.jsx(We,{className:"h-4 w-4"}),label:"Conectar Recursos IA",title:"Insertar imágenes, videos o infografías de Google Flow y NotebookLM",variant:"purple",size:"sm"}),(j==="preview"||j==="split")&&e.jsxs(e.Fragment,{children:[e.jsx(pe,{onClick:()=>Q(f=>f+1),icon:e.jsx(Qa,{className:"h-4 w-4"}),label:"Recargar Vista",title:"Recargar vista previa interactiva",variant:"cyan",size:"sm"}),e.jsx(pe,{onClick:re,icon:e.jsx(pa,{className:"h-4 w-4"}),label:"Abrir en Pestaña",title:"Abrir aplicativo en una pestaña nueva del navegador",variant:"fuchsia",size:"sm"}),e.jsx(pe,{onClick:Ne,icon:me?e.jsx(Xt,{className:"h-4 w-4"}):e.jsx(Aa,{className:"h-4 w-4"}),label:me?"Salir":"Pantalla Completa",title:me?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"})]}),e.jsx(pe,{onClick:ve,icon:e.jsx(gt,{className:"h-4 w-4"}),label:"Descargar Aplicativo",title:"Descargar aplicativo interactivo autocontenido",variant:"green",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden",children:[(j==="split"||j==="code")&&e.jsxs("div",{className:"flex-1 h-full relative border-r border-border-medium",children:[e.jsx("textarea",{ref:_,value:d,onChange:ge,className:"w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto scrollbar-thin",spellCheck:"false",placeholder:"Introduce tu código HTML/CSS/JS aquí..."}),e.jsxs("div",{className:"absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow select-none",children:[e.jsx(Xa,{className:"h-3 w-3 text-emerald-400 animate-pulse"}),e.jsx("span",{children:"Auto-refreshing"})]})]}),(j==="split"||j==="preview")&&e.jsx("div",{ref:Oe,className:cr("flex-1 h-full min-h-0 min-w-0 bg-white relative flex flex-col overflow-hidden",me&&"invisible"),children:e.jsx("iframe",{title:"Canvas Live View",className:"w-full h-full flex-1 border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:te},le)})]}),me&&typeof document<"u"&&Ot.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[99999999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden animate-in fade-in duration-150",children:[e.jsxs("div",{className:"shrink-0 flex items-center justify-between px-3 py-2 bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-md pt-[max(0.5rem,env(safe-area-inset-top))]",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0 pr-2",children:[e.jsx("span",{className:"h-2 w-2 rounded-full bg-teal-400 shrink-0 animate-pulse"}),e.jsx("span",{className:"text-xs font-bold truncate text-slate-200 max-w-[160px] sm:max-w-[400px]",children:i||"Informe Técnico SST"}),e.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono hidden sm:inline-block",children:"Pantalla Completa"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsxs("button",{type:"button",onClick:re,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Abrir en pestaña nueva",children:[e.jsx(pa,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Pestaña"})]}),e.jsxs("button",{type:"button",onClick:ve,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Descargar documento HTML",children:[e.jsx(gt,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Descargar"})]}),e.jsxs("button",{type:"button",onClick:Ne,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-teal-500/30",title:"Salir de pantalla completa",children:[e.jsx(Xt,{className:"h-3.5 w-3.5"}),e.jsx("span",{className:"text-[11px]",children:"Salir"})]})]})]}),e.jsx("div",{className:"flex-1 w-full h-full min-h-0 bg-white relative",children:e.jsx("iframe",{title:"Canvas Live View Fullscreen",className:"w-full h-full border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:te},`fullscreen-${le}`)})]}),document.body),z&&e.jsx(aa,{onClose:()=>be(!1),onImportTable:Ee,onImportMedia:(f,M)=>Ee(M),activeFileType:"html",initialTab:"media"})]})]})};function _r({isMaximized:s}){var He,Te,Ye,Ie,Ve,_e,Le,Me,qe,he,ne,ae,xe;const{token:y,user:i}=wt(),{showToast:O}=Pa(),{ask:C}=za(),[p,$]=l.useState(null),[d,S]=l.useState(null),[j,k]=l.useState(!0),[H,Pe]=l.useState(30),[le,Q]=l.useState(null),[_,W]=l.useState(null),[Oe,ke]=l.useState(!1),[je,me]=l.useState(null),[F,z]=l.useState(null),be=s===void 0||s===!0,Ee=async N=>{try{k(!0);const D=await mt.get("/api/sgsst/company-info",{headers:{Authorization:`Bearer ${y}`}});$(D.data);const ye=await mt.get(`/api/sgsst/reporte-actos/estadisticas?dias=${N}`,{headers:{Authorization:`Bearer ${y}`}});S(ye.data)}catch(D){console.error("Error fetching actes & conditions dashboard data:",D),O({message:"Error al cargar datos del panel de analítica.",status:"error"})}finally{k(!1)}};l.useEffect(()=>{y&&Ee(H)},[y,H]);const Ne=l.useMemo(()=>{const N=(p==null?void 0:p._id)||(i==null?void 0:i.id)||(i==null?void 0:i._id);return N?`${window.location.origin}/sgsst-public/reportar/${N}`:""},[i,p]),ge=l.useMemo(()=>Ne?`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(Ne)}&color=ea580c&bgcolor=ffffff&margin=10`:"",[Ne]),ve=async N=>{try{me(N);const D=await mt.get(`/api/sgsst/reporte-actos/inbox/${N}`,{headers:{Authorization:`Bearer ${y}`}});D.data.report?(W(D.data.report),ke(!0)):O({message:"No se encontraron los detalles del reporte.",status:"error"})}catch(D){console.error("Error fetching report details:",D),O({message:"Error al cargar los detalles del reporte.",status:"error"})}finally{me(null)}},re=async N=>{try{let D=N;(!N.data||!N.data.descripcion)&&(me(N.id),D=(await mt.get(`/api/sgsst/reporte-actos/inbox/${N.id}`,{headers:{Authorization:`Bearer ${y}`}})).data.report);const{trabajador:ye,data:I,createdAt:Be}=D,Fe=new Date(Be||I.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),Ge=I!=null&&I.foto1?`/api/sgsst/reporte-actos/public/media/${N.id}/foto1`:null,Re=I!=null&&I.foto2?`/api/sgsst/reporte-actos/public/media/${N.id}/foto2`:null,ze=I!=null&&I.foto3?`/api/sgsst/reporte-actos/public/media/${N.id}/foto3`:null,Qe=I!=null&&I.video?`/api/sgsst/reporte-actos/public/media/${N.id}/video`:null,Xe=`Por favor analiza el siguiente reporte de acto o condición insegura recibido en el buzón público y elabora el formato técnico en el Canvas:

- **Colaborador:** ${(ye==null?void 0:ye.nombre)||"Anónimo"} (${(ye==null?void 0:ye.cargo)||"No especificado"})
- **Cédula:** ${(ye==null?void 0:ye.cedula)||"N/A"}
- **Fecha y Hora:** ${Fe}
- **Ubicación:** ${(I==null?void 0:I.ubicacion)||"Sin ubicación"}
- **Descripción del Peligro/Hallazgo:** ${(I==null?void 0:I.descripcion)||"No proporcionada"}

### Evidencia Multimedia Adjunta:
${Ge?`![Evidencia 1](${Ge})
${I!=null&&I.foto1Desc?`*Detalle:* ${I.foto1Desc}`:""}
`:""}${Re?`![Evidencia 2](${Re})
${I!=null&&I.foto2Desc?`*Detalle:* ${I.foto2Desc}`:""}
`:""}${ze?`![Evidencia 3](${ze})
${I!=null&&I.foto3Desc?`*Detalle:* ${I.foto3Desc}`:""}
`:""}${Qe?`
<video src="${Qe}" controls style="max-width: 100%; border-radius: 8px; margin-top: 8px;"></video>
`:""}
Por favor, clasifícalo adecuadamente, identifica peligros según GTC 45, analiza las causas básicas e inmediatas, define controles siguiendo la jerarquía y genera el reporte técnico interactivo.`;C({text:Xe},{overrideFiles:[Ge&&{file_id:`${N.id}_foto1`,filepath:Ge,type:"image/png",filename:"foto1.png",height:512,width:512},Re&&{file_id:`${N.id}_foto2`,filepath:Re,type:"image/png",filename:"foto2.png",height:512,width:512},ze&&{file_id:`${N.id}_foto3`,filepath:ze,type:"image/png",filename:"foto3.png",height:512,width:512},Qe&&{file_id:`${N.id}_video`,filepath:Qe,type:"video/mp4",filename:"video.mp4"}].filter(Boolean)}),O({message:"Reporte enviado al chat con éxito para análisis.",status:"success"}),ke(!1)}catch(D){console.error("Error sending report to chat:",D),O({message:"Error al enviar el reporte al chat.",status:"error"})}finally{me(null)}},te=async N=>{try{Q(N),(await mt.post("/api/sgsst/reporte-actos/inbox/mark-processed",{reportId:N},{headers:{Authorization:`Bearer ${y}`}})).data.success&&(O({message:"Reporte marcado como procesado con éxito.",status:"success"}),Ee(H))}catch(D){console.error("Error marking report as processed:",D),O({message:"Error al actualizar el estado del reporte.",status:"error"})}finally{Q(null)}},f=async N=>{if(window.confirm("¿Estás seguro de descartar este reporte? Se eliminará del buzón."))try{Q(N),(await mt.post("/api/sgsst/reporte-actos/inbox/dismiss",{reportId:N},{headers:{Authorization:`Bearer ${y}`}})).data.success&&(O({message:"Reporte descartado correctamente.",status:"success"}),Ee(H))}catch(D){console.error("Error dismissing report:",D),O({message:"Error al descartar el reporte.",status:"error"})}finally{Q(null)}},M=()=>{var D;const N=window.open("","_blank");N&&(N.document.write(`
      <html>
        <head>
          <title>Portal de Reporte de Actos y Condiciones - ${(p==null?void 0:p.companyName)||"Wappy"}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Outfit', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #fcfcfc;
              color: #1f2937;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .poster-card {
              width: 100%;
              max-width: 650px;
              background: white;
              border: 4px solid #ea580c;
              border-radius: 36px;
              padding: 60px 45px;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
              text-align: center;
              box-sizing: border-box;
              position: relative;
            }
            .logo-placeholder {
              font-size: 26px;
              font-weight: 800;
              color: #ea580c;
              margin-bottom: 20px;
              letter-spacing: 1px;
            }
            h1 {
              font-size: 40px;
              font-weight: 800;
              margin: 0 0 12px 0;
              color: #111827;
              letter-spacing: -1px;
              line-height: 1.1;
            }
            h2 {
              font-size: 22px;
              font-weight: 600;
              color: #d97706;
              margin: 0 0 35px 0;
            }
            .desc {
              font-size: 16px;
              color: #4b5563;
              line-height: 1.6;
              margin-bottom: 45px;
              padding: 0 15px;
            }
            .qr-wrapper {
              display: inline-block;
              padding: 24px;
              background: #fff7ed;
              border-radius: 28px;
              border: 2px dashed #ffedd5;
              margin-bottom: 35px;
              box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            }
            .qr-img {
              width: 240px;
              height: 240px;
              display: block;
            }
            .tagline {
              font-size: 17px;
              font-weight: 800;
              color: #c2410c;
              margin-bottom: 25px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer {
              font-size: 12px;
              color: #9ca3af;
              margin-top: 45px;
              border-top: 1px solid #f3f4f6;
              padding-top: 25px;
            }
            @media print {
              body { background: white; }
              .poster-card {
                border: none;
                box-shadow: none;
                padding: 20px;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="poster-card">
            <div class="logo-placeholder">${((D=p==null?void 0:p.companyName)==null?void 0:D.toUpperCase())||"MI EMPRESA"}</div>
            <h1>¿Detectaste un peligro?</h1>
            <h2>Reporte Público de Actos y Condiciones Inseguras</h2>
            <p class="desc">
              Tu seguridad es nuestro compromiso. Si observas un acto inseguro de un compañero, una herramienta dañada, cables expuestos o pisos resbalosos en nuestras instalaciones, repórtalo escaneando este código QR. Puedes adjuntar fotos y es totalmente confidencial. ¡Nos ayuda a prevenir accidentes de trabajo!
            </p>
            <div class="qr-wrapper">
              <img class="qr-img" src="${ge}" alt="QR code" />
            </div>
            <div class="tagline">¡Reportar a tiempo salva vidas!</div>
            <div class="footer">
              Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) · Resolución 0312 de 2019
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          <\/script>
        </body>
      </html>
    `),N.document.close())};if(j&&!d)return e.jsxs("div",{className:"min-h-[60vh] flex flex-col items-center justify-center text-center p-8 text-text-secondary animate-fadeIn",children:[e.jsx(ma,{className:"w-12 h-12 text-orange-500 animate-spin mb-4"}),e.jsx("h3",{className:"font-bold text-lg text-text-primary",children:"Cargando Analítica de Actos y Condiciones..."}),e.jsx("p",{className:"text-sm text-text-secondary mt-1",children:"Sincronizando reportes del buzón público"})]});const R={totalReportesBuzon:(d==null?void 0:d.totalReportesBuzon)??0,periodoDias:(d==null?void 0:d.periodoDias)??H,pendientes:(d==null?void 0:d.pendientes)??0,procesados:(d==null?void 0:d.procesados)??0,finalizadosPdf:(d==null?void 0:d.finalizadosPdf)??0,preliminarClasificacion:{actos:((He=d==null?void 0:d.preliminarClasificacion)==null?void 0:He.actos)??0,condiciones:((Te=d==null?void 0:d.preliminarClasificacion)==null?void 0:Te.condiciones)??0,mixto_no_clasificado:((Ye=d==null?void 0:d.preliminarClasificacion)==null?void 0:Ye.mixto_no_clasificado)??0},areasFrecuentes:Array.isArray(d==null?void 0:d.areasFrecuentes)?d.areasFrecuentes:[],reportesRecientes:Array.isArray(d==null?void 0:d.reportesRecientes)?d.reportesRecientes:[]},fe=R.totalReportesBuzon>0?(R.preliminarClasificacion.actos/R.totalReportesBuzon*100).toFixed(1):"0",X=R.totalReportesBuzon>0?(R.preliminarClasificacion.condiciones/R.totalReportesBuzon*100).toFixed(1):"0",se=R.totalReportesBuzon>0?(R.preliminarClasificacion.mixto_no_clasificado/R.totalReportesBuzon*100).toFixed(1):"0";return be?e.jsxs("div",{className:"space-y-6 animate-fadeIn text-text-primary pb-6",children:[e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[e.jsxs("div",{className:"relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950 via-orange-900 to-amber-950 p-6 text-white shadow-md",children:[e.jsx("div",{className:"absolute inset-0 opacity-10",children:e.jsx("div",{className:"absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-400 blur-3xl -mr-20 -mt-20"})}),e.jsxs("div",{className:"relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-bold text-orange-300 tracking-wider uppercase",children:[e.jsx(We,{className:"w-4 h-4"}),"Módulo de Gestión de Actos y Condiciones Inseguras"]}),e.jsx("h2",{className:"text-2xl font-black tracking-tight text-white",children:"Analítica Predictiva ACI"}),e.jsx("p",{className:"text-xs text-orange-100/80",children:"Estadísticas y gestión activa de reportes del portal de trabajadores."})]}),e.jsx("div",{className:"inline-flex bg-orange-950/50 border border-orange-700/50 rounded-xl p-1 gap-1 self-start sm:self-center",children:[7,30,90].map(N=>e.jsxs("button",{onClick:()=>Pe(N),className:`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${H===N?"bg-orange-600 text-white shadow-sm":"text-orange-200 hover:text-white hover:bg-orange-850/50"}`,children:[N," Días"]},N))})]})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(Ka,{className:"w-10 h-10 text-orange-500"})}),e.jsx("p",{className:"text-[10px] font-black text-text-secondary uppercase tracking-wider",children:"Reportes Buzón"}),e.jsx("h3",{className:"text-3xl font-black text-text-primary tracking-tight",children:R.totalReportesBuzon}),e.jsxs("p",{className:"text-[10px] text-text-secondary/70 font-semibold",children:["En los últimos ",H," días"]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(Za,{className:"w-10 h-10 text-amber-500"})}),e.jsx("p",{className:"text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider",children:"Pendientes"}),e.jsx("h3",{className:"text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight",children:R.pendientes}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-amber-500 h-full",style:{width:`${R.totalReportesBuzon>0?R.pendientes/R.totalReportesBuzon*100:0}%`}})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Por clasificar/gestionar"})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(It,{className:"w-10 h-10 text-emerald-500"})}),e.jsx("p",{className:"text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider",children:"Procesados"}),e.jsx("h3",{className:"text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight",children:R.procesados}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-emerald-500 h-full",style:{width:`${R.totalReportesBuzon>0?R.procesados/R.totalReportesBuzon*100:0}%`}})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Revisados en sistema"})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(st,{className:"w-10 h-10 text-blue-500"})}),e.jsx("p",{className:"text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider",children:"PDF Finalizados"}),e.jsx("h3",{className:"text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight",children:R.finalizadosPdf}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-blue-500 h-full w-full"})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Documentos firmados"})]})]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1",children:e.jsx(fa,{className:"w-6 h-6"})}),e.jsx("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider",children:"Buzón de Reportes QR"}),e.jsx("p",{className:"text-[11px] text-text-secondary px-4 leading-relaxed",children:"Imprime el cartel con el código QR y colócalo en carteleras de la empresa para recibir reportes de tus colaboradores."})]}),ge?e.jsx("div",{className:"bg-white p-4 rounded-2xl border border-border-light shadow-md my-4",children:e.jsx("img",{src:ge,alt:"QR Code",className:"w-36 h-36"})}):e.jsx("div",{className:"w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4",children:"Generando..."}),e.jsxs("button",{onClick:M,className:"w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all",children:[e.jsx(Kt,{className:"w-4 h-4"}),"Imprimir Cartel QR"]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"md:col-span-1 space-y-6",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(Ea,{className:"w-4 h-4 text-orange-500"}),"Tipología de Peligro (Preliminar)"]}),e.jsxs("div",{className:"space-y-4 pt-2",children:[e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Actos Inseguros"}),e.jsxs("span",{className:"text-orange-600 dark:text-orange-400 font-bold",children:[R.preliminarClasificacion.actos," (",fe,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-orange-500 h-full rounded-full",style:{width:`${fe}%`}})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Condiciones Inseguras"}),e.jsxs("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:[R.preliminarClasificacion.condiciones," (",X,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-amber-500 h-full rounded-full",style:{width:`${X}%`}})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Mixtos / Por definir"}),e.jsxs("span",{className:"text-purple-600 dark:text-purple-400 font-bold",children:[R.preliminarClasificacion.mixto_no_clasificado," (",se,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-purple-500 h-full rounded-full",style:{width:`${se}%`}})})]})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 leading-relaxed",children:"* Clasificación preliminar basada en palabras clave descriptivas. Llama al Asistente de ACI para elaborar el ATS final."})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(ua,{className:"w-4 h-4 text-blue-500"}),"Ubicaciones más Reportadas"]}),R.areasFrecuentes.length>0?e.jsx("div",{className:"space-y-3 pt-2",children:R.areasFrecuentes.slice(0,6).map((N,D)=>{const ye=R.totalReportesBuzon>0?(N.count/R.totalReportesBuzon*100).toFixed(0):"0";return e.jsxs("div",{className:"flex items-center justify-between text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-2 w-2 rounded-full bg-blue-500"}),e.jsx("span",{className:"font-semibold text-text-primary",children:N.name})]}),e.jsxs("span",{className:"font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md",children:[N.count," (",ye,"%)"]})]},D)})}):e.jsx("div",{className:"text-center py-8 text-xs text-text-secondary",children:"No hay áreas registradas en el buzón."})]})]}),e.jsxs("div",{className:"md:col-span-2 bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm flex flex-col",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-border-light pb-3",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(ut,{className:"w-4 h-4 text-orange-500 animate-pulse"}),"Buzón de Reportes Públicos Recibidos"]}),e.jsxs("span",{className:"text-xs font-semibold text-text-secondary bg-surface-secondary px-2 py-1 rounded-md",children:[R.reportesRecientes.length," Registrados"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto space-y-4 max-h-[500px] scrollbar-thin pr-1 pt-2",children:R.reportesRecientes.length>0?R.reportesRecientes.map(N=>e.jsxs("div",{className:`p-4 bg-surface-secondary border rounded-xl space-y-3 text-xs transition-all ${N.status==="processed"?"border-border-light opacity-80":"border-orange-500/20 shadow-sm hover:border-orange-500/40"}`,children:[e.jsxs("div",{className:"flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-wider",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(er,{className:"w-3.5 h-3.5 text-text-tertiary"}),new Date(N.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})]}),e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${N.status==="processed"?"bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400":"bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"}`,children:N.status==="processed"?"Procesado":"Pendiente"})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsxs("span",{className:"font-bold text-text-primary",children:["Colaborador: ",N.trabajador," (",N.cargo,")"]}),e.jsxs("span",{className:"text-[10px] text-text-secondary bg-surface-primary border border-border-light px-2 py-0.5 rounded-md font-semibold",children:["📍 ",N.ubicacion]})]}),e.jsx("p",{className:"text-text-primary leading-relaxed bg-surface-primary/50 p-2.5 rounded-lg border border-border-light/50",children:N.descripcion})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1 border-t border-border-light/50",children:[e.jsxs("div",{className:"flex gap-2",children:[N.hasFoto&&e.jsx("span",{className:"bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-md",children:"📷 Con Foto"}),N.hasVideo&&e.jsx("span",{className:"bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-md",children:"🎥 Con Video"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{disabled:je!==null||le!==null,onClick:()=>ve(N.id),className:"bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[je===N.id?e.jsx(ma,{className:"w-3.5 h-3.5 animate-spin"}):e.jsx(ta,{className:"w-3.5 h-3.5"}),"Abrir"]}),e.jsxs("button",{disabled:je!==null||le!==null,onClick:()=>re(N),className:"bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50 shadow-sm",children:[e.jsx(We,{className:"w-3.5 h-3.5"}),"Analizar"]}),N.status!=="processed"&&e.jsxs("button",{disabled:le!==null,onClick:()=>te(N.id),className:"bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[e.jsx(dt,{className:"w-3.5 h-3.5"}),"Marcar Procesado"]}),e.jsxs("button",{disabled:le!==null,onClick:()=>f(N.id),className:"bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[e.jsx(pt,{className:"w-3.5 h-3.5"}),"Descartar"]})]})]})]},N.id)):e.jsxs("div",{className:"text-center py-16 text-xs text-text-secondary h-full flex flex-col items-center justify-center space-y-2",children:[e.jsx(It,{className:"w-8 h-8 text-emerald-500"}),e.jsx("p",{className:"font-bold text-text-primary",children:"¡Buzón al día!"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:"No hay reportes de trabajadores pendientes en este periodo."})]})})]})]}),Oe&&_&&e.jsx("div",{className:"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn",children:e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-border-light bg-gradient-to-r from-orange-500/5 to-amber-500/5",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"p-2 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl",children:e.jsx(ut,{className:"w-5 h-5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-black text-text-primary uppercase tracking-wider",children:"Detalle del Reporte Recibido"}),e.jsxs("p",{className:"text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5",children:["📍 ",((Ie=_.data)==null?void 0:Ie.ubicacion)||"Ubicación General"]})]})]}),e.jsx("button",{onClick:()=>{ke(!1),W(null)},className:"p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all",children:e.jsx(rt,{className:"w-5 h-5"})})]}),e.jsxs("div",{className:"p-6 overflow-y-auto space-y-6 scrollbar-thin text-xs text-text-primary",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-secondary/50 border border-border-light/50 p-4 rounded-2xl",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Reportante"}),e.jsx("p",{className:"font-extrabold text-sm text-text-primary",children:((Ve=_.trabajador)==null?void 0:Ve.nombre)||"Anónimo"}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Cargo: ",e.jsx("span",{className:"font-semibold",children:((_e=_.trabajador)==null?void 0:_e.cargo)||"No especificado"})]}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Cédula: ",e.jsx("span",{className:"font-semibold",children:((Le=_.trabajador)==null?void 0:Le.cedula)||"N/A"})]})]}),e.jsxs("div",{className:"space-y-2 border-t md:border-t-0 md:border-l border-border-light/50 pt-2 md:pt-0 md:pl-4",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Detalles de Registro"}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Fecha y Hora: ",e.jsx("span",{className:"font-semibold",children:new Date(_.createdAt).toLocaleString("es-CO")})]}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Estado:",e.jsx("span",{className:`ml-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${_.status==="processed"?"bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400":"bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"}`,children:_.status==="processed"?"Procesado":"Pendiente"})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Descripción del Peligro / Hallazgo"}),e.jsx("div",{className:"p-4 bg-orange-500/5 dark:bg-orange-500/10 border-l-4 border-orange-500 rounded-r-2xl leading-relaxed text-sm",children:((Me=_.data)==null?void 0:Me.descripcion)||"No se proporcionó descripción."})]}),(((qe=_.data)==null?void 0:qe.foto1)||((he=_.data)==null?void 0:he.foto2)||((ne=_.data)==null?void 0:ne.foto3)||((ae=_.data)==null?void 0:ae.video))&&e.jsxs("div",{className:"space-y-3 pt-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Evidencia Multimedia Adjunta"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4",children:["foto1","foto2","foto3"].map((N,D)=>{var Be,Fe;const ye=(Be=_.data)==null?void 0:Be[N],I=((Fe=_.data)==null?void 0:Fe[`${N}Desc`])||"Sin descripción adicional";return ye?e.jsxs("div",{className:"group relative border border-border-light rounded-2xl overflow-hidden bg-surface-secondary shadow-sm hover:shadow-md transition-all",children:[e.jsxs("div",{className:"aspect-square w-full cursor-zoom-in relative overflow-hidden bg-black flex items-center justify-center",onClick:()=>z(ye),children:[e.jsx("img",{src:ye,alt:`Evidencia ${D+1}`,className:"w-full h-full object-cover group-hover:scale-105 transition-all duration-300"}),e.jsx("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase transition-all",children:"🔍 Agrandar"})]}),e.jsxs("div",{className:"p-2.5 text-[10px] text-text-secondary line-clamp-2",children:[e.jsxs("strong",{className:"text-text-primary block text-[11px] mb-0.5",children:["Imagen ",D+1]}),I]})]},N):null})}),((xe=_.data)==null?void 0:xe.video)&&e.jsxs("div",{className:"border border-border-light rounded-2xl p-4 bg-surface-secondary space-y-2",children:[e.jsxs("p",{className:"text-[11px] font-bold text-text-primary flex items-center gap-1.5",children:[e.jsx(Ra,{className:"w-4 h-4 text-purple-500"}),"Video Evidencia Corto (Movimiento y Entorno)"]}),e.jsx("video",{src:_.data.video,controls:!0,className:"w-full rounded-xl border border-border-light shadow-inner max-h-[300px] bg-black"})]})]})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 p-6 border-t border-border-light bg-surface-secondary",children:[e.jsx("button",{onClick:()=>{ke(!1),W(null)},className:"bg-surface-primary hover:bg-surface-hover border border-border-medium text-text-primary font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm",children:"Cerrar"}),_.status!=="processed"&&e.jsxs("button",{disabled:le!==null,onClick:async()=>{await te(_.id),W(N=>N?{...N,status:"processed"}:null)},className:"bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm",children:[e.jsx(dt,{className:"w-4 h-4"}),"Marcar Procesado"]}),e.jsxs("button",{disabled:je!==null,onClick:()=>re(_),className:"bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm",children:[e.jsx(We,{className:"w-4 h-4"}),"Analizar en Chat"]})]})]})}),F&&e.jsxs("div",{className:"fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn",onClick:()=>z(null),children:[e.jsx("button",{className:"absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all",onClick:()=>z(null),children:e.jsx(rt,{className:"w-6 h-6"})}),e.jsx("img",{src:F,alt:"Evidencia Ampliada",className:"max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-fadeIn"})]})]}):e.jsxs("div",{className:"space-y-6 animate-fadeIn text-text-primary pb-6",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1",children:e.jsx(fa,{className:"w-6 h-6"})}),e.jsx("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider",children:"Buzón de Reportes QR"}),e.jsx("p",{className:"text-[11px] text-text-secondary px-4 leading-relaxed",children:"Imprime este código QR y colócalo en carteleras de la empresa para que los colaboradores envíen reportes desde sus celulares."})]}),ge?e.jsx("div",{className:"bg-white p-4 rounded-2xl border border-border-light shadow-md my-4",children:e.jsx("img",{src:ge,alt:"QR Code",className:"w-36 h-36"})}):e.jsx("div",{className:"w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4",children:"Generando..."}),e.jsxs("button",{onClick:M,className:"w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all",children:[e.jsx(Kt,{className:"w-4 h-4"}),"Imprimir Cartel QR"]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(ua,{className:"w-4 h-4 text-blue-500"}),"Áreas de Riesgo Frecuente"]}),R.areasFrecuentes.length>0?e.jsx("div",{className:"space-y-3 pt-2",children:R.areasFrecuentes.slice(0,5).map((N,D)=>{const ye=R.totalReportesBuzon>0?(N.count/R.totalReportesBuzon*100).toFixed(0):"0";return e.jsxs("div",{className:"flex items-center justify-between text-xs",children:[e.jsx("span",{className:"font-semibold text-text-primary",children:N.name}),e.jsxs("span",{className:"font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md",children:[N.count," reportes (",ye,"%)"]})]},D)})}):e.jsx("div",{className:"text-center py-8 text-xs text-text-secondary",children:"No hay áreas frecuentes registradas en este periodo."})]})]})}const Br=new Set(["text","excel","presentation","html","animo","actos_condiciones"]),ft=s=>{if(s==null)return"";if(typeof s=="string")return s;if(typeof s=="object")try{return JSON.stringify(s)}catch{return""}return String(s)},Lt=(s,y="text")=>{if(!s)return y;if(Array.isArray(s))return s.length===0?y:Array.isArray(s[0])?"excel":typeof s[0]=="object"&&s[0]!==null?"title"in s[0]||"bullets"in s[0]||"layout"in s[0]?"presentation":"excel":y;if(typeof s=="object"){if(s.estadoAnimo||s.totalMuestras)return"animo";if(s.preliminarClasificacion||s.totalReportesBuzon)return"actos_condiciones";if(Array.isArray(s.slides)||Array.isArray(s.presentation))return"presentation";if(Array.isArray(s.rows)||Array.isArray(s.data))return"excel";const i=Object.keys(s);return i.length>0&&i.every(O=>Array.isArray(s[O]))?"excel":y}if(typeof s=="string"){const i=s.trim(),O=i.toLowerCase();if(O.includes("<!doctype html")||O.includes("<html"))return"html";if(i.startsWith("[")&&i.endsWith("]"))try{const C=JSON.parse(i);return Lt(C,y)}catch{}else if(i.startsWith("{")&&i.endsWith("}"))try{const C=JSON.parse(i);if(C&&typeof C=="object")return Lt(C,y)}catch{}}return y},Rt=(s,y)=>{const O=ft(y).trim().toLowerCase();return s==="html"||O.includes("<!doctype html")||O.includes("<html")?"html":typeof s=="string"&&Br.has(s)?s:Lt(y,"text")},Gr=`
<div style="margin-top:60px; page-break-inside:avoid;">
  <table style="width:100%; border-collapse:collapse;">
    <tr>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px;">RESPONSABLE SST</p>
        <p style="font-size:11px; margin:0; color:#555;">Firma y Sello</p>
      </td>
      <td style="width:4%;"></td>
      <td style="width:48%; text-align:center; padding:8px;">
        <div class="signature-placeholder" style="border-bottom:2px solid #333; min-height:80px; display:flex; align-items:center; justify-content:center; background:#f9f9f9; cursor:pointer; border-radius:8px 8px 0 0; margin-bottom:4px; transition:all 0.3s ease;">
          <span style="font-size:11px; opacity:0.6;">Clic para firmar</span>
        </div>
        <p style="font-size:12px; font-weight:bold; margin:4px 0 2px;">REPRESENTANTE LEGAL</p>
        <p style="font-size:11px; margin:0; color:#555;">Firma y Sello</p>
      </td>
    </tr>
  </table>
</div>`;function nt(s){return typeof s!="string"||!s?String(s??""):s.includes("signature-placeholder")||s.includes("RESPONSABLE SST")||/responsable\s+(sg-)?sst/i.test(s)||/representante\s+legal/i.test(s)||/firmas?\s+y\s+responsabilidades/i.test(s)||/evaluador\s+t[eé]cnico/i.test(s)||/firma:?\s*_{3,}/i.test(s)||s.includes("Licencia No.")?s:s+Gr}const Ur=1e8,Hr=({version:s,title:y,onRename:i,onDelete:O})=>{const[C,p]=l.useState(!1),[$,d]=l.useState({}),[S,j]=l.useState(!1),k=l.useRef(null),H=l.useRef(null),Pe=()=>{if(!k.current)return;const _=k.current.getBoundingClientRect();d({position:"fixed",top:_.bottom+4,right:window.innerWidth-_.right,zIndex:Ur})};l.useEffect(()=>{if(!C)return;const _=W=>{var ke,je;const Oe=W.target;!((ke=k.current)!=null&&ke.contains(Oe))&&!((je=H.current)!=null&&je.contains(Oe))&&p(!1)};return document.addEventListener("mousedown",_),()=>document.removeEventListener("mousedown",_)},[C]);const le=async _=>{_.stopPropagation(),p(!1),window.confirm(`¿Eliminar la versión ${s} del historial?
Esta acción no se puede deshacer.`)&&(j(!0),await O(),j(!1))},Q=C?e.jsxs("div",{ref:H,style:$,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[e.jsxs("button",{onClick:_=>{_.stopPropagation();const W=prompt("Nuevo nombre para esta versión:",y);W&&W!==y&&i(W),p(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[e.jsx(nr,{className:"h-3 w-3 text-teal-600"})," Renombrar"]}),e.jsxs("button",{onClick:le,disabled:S,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[e.jsx(dr,{className:"h-3.5 w-3.5"})," Eliminar"]})]}):null;return e.jsxs(e.Fragment,{children:[e.jsx("button",{ref:k,onClick:_=>{_.stopPropagation(),Pe(),p(W=>!W)},className:"shrink-0 rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:e.jsx(lr,{className:"h-4 w-4 text-text-secondary"})}),ja.createPortal(Q,document.body)]})},Vr=2500,qr=1e4,Ss=({conversationId:s,embeddedInTenshiHero:y=!1,onCloseOverride:i,onSelectConversationOverride:O,isEmbeddedVisible:C=!0,onSessionStateChange:p})=>{const{showToast:$}=Pa(),{token:d,user:S}=wt(),j=(S==null?void 0:S.role)==="ADMIN"||(S==null?void 0:S.role)==="USER_PRO"||(S==null?void 0:S.role)==="USER_IPEVAR"||(S==null?void 0:S.role)==="IPEVAR",[k,H]=l.useState(!1),[Pe,le]=l.useState(""),[Q,_]=l.useState(""),[W,Oe]=Zt(ht.canvasMaximized),ke=ba(ht.isCanvasActive),je=ba(kt(s??"new")),me=l.useCallback(()=>{if(Oe(!1),y){ke(!1),i==null||i();return}ke(!1),je(c=>c!=null&&c.tools?{...c,tools:c.tools.filter(A=>A!=="canvas"&&A!=="consultar_analitica_psicosocial"&&A!=="consultar_analitica_actos_condiciones")}:c)},[y,i,ke,Oe,je]),F=ga(ht.isSubmittingFamily(0)),[z,be]=Zt(ht.streamingCanvasState),Ee=l.useRef(z!=null&&z.content?Date.now():0),Ne=l.useRef(p);Ne.current=p;const ge=l.useCallback((c,A)=>{const T=(A||"").trim();if(T&&T!=="Archivo sin título")return T;if(typeof c=="string"&&c.length>0){const U=c.match(/<title[^>]*>([\s\S]*?)<\/title>/i);if(U!=null&&U[1]){const V=U[1].replace(/<[^>]+>/g,"").trim();if(V&&V!=="Plantilla Informativa SST")return V.slice(0,90)}const G=c.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);if(G!=null&&G[1]){const V=G[1].replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();if(V)return V.slice(0,90)}}return T||"Documento SG-SST"},[]),ve=wa.useMemo(()=>z?Rt(z.fileType,z.content):"text",[z]),re=ft(z==null?void 0:z.content),te=z?ge(re,z.title):"Archivo sin título",[f,M]=l.useState(ve),[R,fe]=l.useState(re),[X,se]=l.useState(te),[He,Te]=l.useState(1),[Ye,Ie]=l.useState([]),[Ve,_e]=l.useState(!1),[Le,Me]=l.useState(!1),[qe,he]=l.useState(!1),ne=!!R||f!=="text"&&f!=="actos_condiciones"&&f!=="animo"||f==="actos_condiciones"||f==="animo";l.useEffect(()=>{var c;(c=Ne.current)==null||c.call(Ne,ne,X)},[ne,X]);const ae=l.useRef(re),xe=l.useRef(ve),N=l.useRef(te),D=l.useRef(null),ye=l.useRef(!1),I=l.useRef(null),Be=l.useRef(!1),Fe=l.useRef(null),Ge=l.useRef(ve),Re=l.useRef(te);l.useEffect(()=>{f!=="animo"&&f!=="actos_condiciones"&&(Ge.current=f)},[f]),l.useEffect(()=>{f!=="animo"&&f!=="actos_condiciones"&&(Re.current=X)},[X,f]);const ze=c=>{Fe.current&&clearTimeout(Fe.current),Be.current=!0,Fe.current=setTimeout(()=>{Be.current=!1,Fe.current=null},c)},Qe=l.useRef(!1),Xe=l.useRef(null),at=Rr(),[ot,et]=l.useState(!1),Ke=Pr(),tt=za(),v=tt==null?void 0:tt.setConversation,w=tr(({snapshot:c,set:A})=>async T=>{const U=s||"new",G=await c.getPromise(kt(U));G&&A(kt(T),G)},[s]),q=ga(kt(s??"new"));l.useEffect(()=>{const c=(q==null?void 0:q.tools)??[];c.includes("consultar_analitica_psicosocial")?(M("animo"),se("Termómetro Psicosocial")):c.includes("consultar_analitica_actos_condiciones")?(M("actos_condiciones"),se("Analítica de Actos y Condiciones")):(Ge.current&&M(Ge.current),Re.current&&Re.current!=="Archivo sin título"&&se(Re.current))},[q]),l.useEffect(()=>{ae.current=R},[R]),l.useEffect(()=>{xe.current=f},[f]),l.useEffect(()=>{N.current=X},[X]),l.useEffect(()=>{const c=()=>{if(I.current){const A=s;A&&A!=="new"&&fetch(`/api/sgsst/canvas/${A}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({content:xe.current==="text"?nt(ae.current):ae.current,title:N.current,fileType:xe.current,isManual:!0}),keepalive:!0})}};return window.addEventListener("beforeunload",c),()=>{if(window.removeEventListener("beforeunload",c),I.current){clearTimeout(I.current),I.current=null;const A=s;A&&A!=="new"&&fetch(`/api/sgsst/canvas/${A}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({content:xe.current==="text"?nt(ae.current):ae.current,title:N.current,fileType:xe.current,isManual:!0})}).catch(T=>console.error("[CanvasPanel] Save on exit error:",T))}}},[s,d]);const r=l.useCallback(c=>{if(typeof c!="string"||!c)return String(c??"");const A=(de,ce,K)=>{const B=`<${K}`,we=`</${K}>`;let Ce=0,De=ce;for(;De<de.length;)if(de.slice(De,De+B.length).toLowerCase()===B)Ce++,De+=B.length;else if(de.slice(De,De+we.length).toLowerCase()===we){if(Ce--,Ce===0)return De+we.length;De+=we.length}else De++;return-1},T=(de,ce="")=>{const K=String(de||"").trim().replace(/^https?:\/\/(?:app\.)?wappy\.club(?=\/(?:images|api\/notebooklm\/download)\/)/i,""),B=K.toLowerCase(),we=String(ce||"").replace(/<[^>]+>/g,"").replace(/"/g,"&quot;").trim();if(B.includes("_audio_")||B.includes("_podcast_")||B.includes("type=audio")||B.includes("type=podcast")||/\.(mp3|wav|m4a|ogg)(?:$|\?)/i.test(B))return`<div style="margin:22px 0;padding:18px 22px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;box-shadow:0 4px 14px rgba(13,148,136,0.08);"><div style="font-weight:700;color:#0f766e;font-size:14px;margin-bottom:10px;">🎙️ ${we||"Podcast / Audio Explicativo"}</div><audio controls preload="metadata" src="${K}" style="width:100%;display:block;"></audio><div style="margin-top:10px;font-size:12px;"><a href="${K}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488;font-weight:700;text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;if(B.includes("_vid_")||B.includes("_video_")||B.includes("type=video")||B.includes("type=cinematic_video")||/\.(mp4|webm|mov)(?:$|\?)/i.test(B))return`<figure style="margin:24px 0;text-align:center;background:#0f172a;padding:18px;border-radius:14px;border:1px solid #334155;box-shadow:0 8px 24px rgba(15,23,42,0.18);"><video controls playsinline preload="metadata" src="${K}" style="max-width:100%;max-height:480px;border-radius:10px;background:#000;display:block;margin:0 auto;"></video><figcaption style="margin-top:10px;font-size:12px;color:#cbd5e1;font-weight:600;">🎬 ${we||"Video Explicativo"} · <a href="${K}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf;text-decoration:underline;">⬇ Descargar Video MP4</a></figcaption></figure>`;if(B.includes("_quiz_")||B.includes("_flashcards_")||B.includes("_mindmap_")||B.includes("_table_")||B.includes("_slides_")||B.includes("_report_")||B.includes("type=quiz")||B.includes("type=flashcards")||B.includes("type=mind_map")||B.includes("type=data_table")||B.includes("type=slide_deck")||B.includes("type=report")||/\.(pdf|pptx|csv|md|markdown|json|docx|xlsx)(?:$|\?)/i.test(B))return`<div style="margin:18px 0;padding:16px 20px;background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0d9488;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="font-weight:700;color:#0f172a;font-size:13px;">📄 ${we||"Recurso / Documento Descargable"}</div><a href="${K}" download target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;background:#0d9488;color:#ffffff;font-weight:700;font-size:12px;border-radius:8px;text-decoration:none;">⬇ Descargar Recurso</a></div>`;const Ce=we||"Infografía / Recurso Visual Oficial";return`<figure style="margin:24px 0;text-align:center;background:#f8fafc;padding:16px;border-radius:14px;border:1px solid #e2e8f0;"><img src="${K}" alt="${Ce}" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,0.08);display:block;margin:0 auto;" /><figcaption style="margin-top:10px;font-size:12px;color:#475569;font-style:italic;font-weight:600;">${Ce}</figcaption></figure>`},U=de=>de&&de.replace(/<p>\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*<\/p>/gi,(ce,K,B)=>T(B,K)).replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(ce,K,B)=>T(B,K)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(ce,K,B)=>T(B,K)).replace(/<p>\s*<em>\s*(<strong>[^<]+<\/strong>[\s\S]*?)<\/em>([^<*]+)\*([\s\S]*?)<\/p>/gi,(ce,K,B,we)=>`<ul><li>${K}<em>${B.trim()}</em>${we}</li></ul>`).replace(/\*\*([^*\n<]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n<]+)\\*\\*","g"),"<strong>$1</strong>").replace(/<\/strong>\*/g,"</strong>").replace(/<\/em>\*/g,"</em>");if(c.trim().startsWith("<")&&!c.includes("#")&&!c.includes("**")&&!c.includes("---"))return U(c);let G="",V=c,Z="",J=0;for(;J<c.length;){const ce=c.substring(J).search(/\S/);if(ce===-1)break;const K=J+ce,B=c.substring(K);if(B.startsWith("<!--")){const we=B.indexOf("-->");if(we!==-1){J=K+we+3;continue}}else if(B.startsWith("<div")||B.startsWith("<table")||B.startsWith("<style")){const we=B.startsWith("<div")?"div":B.startsWith("<table")?"table":"style",Ce=A(c,K,we);if(Ce!==-1){J=Ce;continue}}break}J>0&&(G=c.substring(0,J),V=c.substring(J));const ee=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div style="page-break-inside: avoid;','<div class="signature-placeholder'];let oe=-1;for(const de of ee){const ce=V.lastIndexOf(de);ce!==-1&&(oe===-1||ce<oe)&&(oe=ce)}oe!==-1&&(Z=V.substring(oe),V=V.substring(0,oe));const Ae=V.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>)/i).map(de=>{if(de.trim().startsWith("<"))return de;let ce=de;const K=/((?:^|\n)\|[^\n]+\|[^\n]*\n\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n(?:\|[^\n]+\|[^\n]*(?:\n|$))+)/g;ce=ce.replace(K,we=>{const Ce=we.trim().split(`
`).map(Ue=>Ue.trim());if(Ce.length<2)return we;const De=Ce[0].split("|").map(Ue=>Ue.trim()).filter((Ue,Ze,lt)=>Ze>0&&Ze<lt.length-1),it=Ce[1].split("|").map(Ue=>Ue.trim()).filter((Ue,Ze,lt)=>Ze>0&&Ze<lt.length-1).map(Ue=>Ue.startsWith(":")&&Ue.endsWith(":")?"center":Ue.endsWith(":")?"right":Ue.startsWith(":")?"left":""),Mt=De.map((Ue,Ze)=>`<th${it[Ze]?` align="${it[Ze]}"`:""} style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: ${it[Ze]||"left"};">${Ue}</th>`).join(""),Ft=Ce.slice(2).map(Ue=>`<tr>${Ue.split("|").map(jt=>jt.trim()).filter((jt,xt,sa)=>xt>0&&xt<sa.length-1).map((jt,xt)=>`<td${it[xt]?` align="${it[xt]}"`:""} style="border: 1px solid #ddd; padding: 8px; text-align: ${it[xt]||"left"};">${jt}</td>`).join("")}</tr>`).join("");return`<div style="overflow-x:auto; margin: 15px 0;"><table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;"><thead><tr>${Mt}</tr></thead><tbody>${Ft}</tbody></table></div>`.replace(/\n/g,"")}),ce=ce.replace(/([^\s\d#])(\d+\.\s+)/g,`$1

$2`).replace(/(\d+\.\s+[A-ZÁÉÍÓÚÑ]{2,})([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g,`$1

$2`);const B=ce.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(we,Ce,De)=>T(De,Ce)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(we,Ce,De)=>T(De,Ce)).replace(/^#{6}\s+(.+)$/gm,"<h6>$1</h6>").replace(/^#{5}\s+(.+)$/gm,"<h5>$1</h5>").replace(/^#{4}\s+(.+)$/gm,"<h4>$1</h4>").replace(/^#{3}\s+(.+)$/gm,"<h3>$1</h3>").replace(/^#{2}\s+(.+)$/gm,"<h2>$1</h2>").replace(/^#{1}\s+(.+)$/gm,"<h1>$1</h1>").replace(/^---+$/gm,"<hr/>").replace(/^\s*[-*]\s+(.+)$/gm,"<li>$1</li>").replace(/(<li>.*<\/li>\n?)+/g,we=>`<ul>${we}</ul>`).replace(/^\s*\d+\.\s+(.+)$/gm,"<li>$1</li>").replace(/\*\*([^*\n]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*\\*","g"),"<strong>$1</strong>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*(?!\\*)","g"),"<em>$1</em>").replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br/>").replace(/^(?!<)(.+)$/gm,"<p>$1</p>").replace(/<p><\/p>/g,"").replace(/<p>(<h[1-6]>)/g,"$1").replace(/(<\/h[1-6]>)<\/p>/g,"$1").replace(/<p>(<ul>)/g,"$1").replace(/(<\/ul>)<\/p>/g,"$1").replace(/<p>(<figure[\s>])/g,"$1").replace(/(<\/figure>)<\/p>/g,"$1").replace(/<p>(<div[\s>])/g,"$1").replace(/(<\/div>)<\/p>/g,"$1").replace(/<p>(<hr\/>)<\/p>/g,"$1");return U(B)}).join("");return U(G+Ae+Z)},[]);l.useEffect(()=>{if(z){const c=ft(z.content),A=Rt(z.fileType,z.content),T=ge(c,z.title),U=A==="text"?r(c):c;Ee.current=Date.now(),fe(U),ae.current=U,M(A),xe.current=A,Ge.current=A,se(T),N.current=T,Re.current=T}},[z,r,ge]);const x=l.useCallback(async(c=!1)=>{if(!(!s||s==="new")&&!ye.current)try{c&&_e(!0);const A=await fetch(`/api/sgsst/canvas/${s}`,{headers:{Authorization:`Bearer ${d}`}});if(!A.ok){console.warn(`[CanvasPanel] fetch failed: ${A.status} for convoId=${s}`);return}const T=await A.json(),U=T.updatedAt||null;if(!U&&!T.content&&(ae.current||z!=null&&z.content)||Ee.current>0&&U&&new Date(U).getTime()<Ee.current&&ae.current)return;if(c||U!==D.current){D.current=U;const G=(q==null?void 0:q.tools)??[],V=G.includes("consultar_analitica_psicosocial"),Z=G.includes("consultar_analitica_actos_condiciones"),J=Rt(T.fileType,T.content);Ge.current=J,Re.current=T.title||"Archivo sin título",M(V?"animo":Z?"actos_condiciones":J),se(V?"Termómetro Psicosocial":Z?"Analítica de Actos y Condiciones":T.title||"Archivo sin título"),Te(T.version||1),Ie(Array.isArray(T.history)?T.history:[]);const ee=ft(T.content);let oe=J==="text"?r(ee):ee;J==="text"&&(oe=nt(oe)),(c||JSON.stringify(ae.current)!==JSON.stringify(oe))&&(c||ze(1500),fe(oe))}}catch(A){console.error("[CanvasPanel] Fetch error:",A)}finally{c&&_e(!1)}},[s,d,r,q,z]);l.useEffect(()=>{x(!0)},[s,x]),l.useEffect(()=>{if(!s||s==="new"||y&&!C)return;const c=setInterval(()=>{x(!1)},Vr);return()=>clearInterval(c)},[s,x,F,y,C]),l.useEffect(()=>{if(Qe.current===!0&&F===!1&&s&&s!=="new"){const c=setTimeout(()=>{D.current=null,x(!0)},600);return()=>clearTimeout(c)}Qe.current=F},[F,x,s]);const g=async(c,A,T)=>{const U=ha();I.current&&clearTimeout(I.current),ze(2500),await w(U),M(c),fe(A),se(T),xe.current=c,ae.current=A,N.current=T,!y&&v&&v(G=>({...G,conversationId:U})),await h(U,!1,!0),Ke.invalidateQueries([Ct.messages,U]),Ke.invalidateQueries([Ct.allConversations]),y||at(`/c/${U}`,{replace:!0})},h=l.useCallback(async(c,A=!1,T=!1)=>{const U=c||s;if(!(!U||U==="new")){ye.current=!0,Me(!0);try{const V=await(await fetch(`/api/sgsst/canvas/${U}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({content:xe.current==="text"?nt(ae.current):ae.current,title:N.current,fileType:xe.current,isManual:A})})).json();if(V.success){if(ze(2e3),V.content!==void 0){const Z=typeof ae.current=="string"&&ae.current.includes("wappy-standard-header-banner")&&!ae.current.includes("{{empresa_");ae.current=V.content,(T||xe.current==="text"&&typeof V.content=="string"&&V.content.includes("wappy-standard-header-banner")&&!Z)&&fe(V.content)}Te(V.version),Ie(V.history||[]),D.current=V.updatedAt,$({status:"success",message:"¡Cambios guardados con éxito!"})}}catch(G){console.error("[CanvasPanel] Save error:",G),$({status:"error",message:"Error al guardar los cambios."})}finally{ye.current=!1,Me(!1)}}},[s,d]),E=l.useCallback(()=>{I.current&&clearTimeout(I.current),I.current=setTimeout(()=>{h(void 0,!0)},qr)},[h]),t=c=>{const A=xe.current==="text"?nt(c):c;ae.current=A,!Be.current&&E()},a=c=>{se(c),N.current=c,h()},n=async(c,A)=>{I.current&&clearTimeout(I.current),ze(2e3);const T=xe.current==="text"?nt(c):c;if(fe(T),se(A),ae.current=T,N.current=A,!s||s==="new"){const U=ha();await w(U),!y&&v&&v(G=>({...G,conversationId:U})),await h(U,!1,!0),Ke.invalidateQueries([Ct.messages,U]),Ke.invalidateQueries([Ct.allConversations]),y||at(`/c/${U}`,{replace:!0})}else await h(void 0,!1,!0)},o=async()=>{if(window.confirm("¿Deseas volver a la selección de lienzos? Los cambios no guardados en la versión actual podrían perderse.")){Me(!0);try{I.current&&clearTimeout(I.current),ze(1500);const A=await(await fetch(`/api/sgsst/canvas/${s}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({content:"",title:"Archivo sin título",fileType:"text"})})).json();A.success&&(fe(""),M("text"),se("Archivo sin título"),Te(1),Ie([]),D.current=A.updatedAt,Xe.current=null,y&&(Ee.current=0,be(null)))}catch(c){console.error("[CanvasPanel] Reset error:",c)}finally{Me(!1)}}},m=()=>{const[c,A]=l.useState(!1),[T,U]=l.useState(X),G=l.useRef(null);l.useEffect(()=>{U(X)},[X]),l.useEffect(()=>{c&&setTimeout(()=>{var Y;return(Y=G.current)==null?void 0:Y.select()},50)},[c]);const V=()=>{const Y=(T??"").trim();Y&&a(Y),A(!1)},Z=()=>{switch(f){case"excel":return e.jsx(vt,{className:"h-5 w-5"});case"presentation":return e.jsx(Pt,{className:"h-5 w-5"});case"html":return e.jsx(zt,{className:"h-5 w-5"});case"animo":return e.jsx(Qt,{className:"h-5 w-5"});case"actos_condiciones":return e.jsx(ut,{className:"h-5 w-5"});default:return e.jsx(Gt,{className:"h-5 w-5"})}},ee=(()=>{switch(f){case"excel":return{bg:"bg-emerald-500/10",border:"border-emerald-500/20",text:"text-emerald-600 dark:text-emerald-400",grad:"from-emerald-500/40 via-emerald-300/20"};case"presentation":return{bg:"bg-amber-500/10",border:"border-amber-500/20",text:"text-amber-600 dark:text-amber-400",grad:"from-amber-500/40 via-amber-300/20"};case"html":return{bg:"bg-blue-500/10",border:"border-blue-500/20",text:"text-blue-600 dark:text-blue-400",grad:"from-blue-500/40 via-blue-300/20"};case"animo":return{bg:"bg-red-500/10",border:"border-red-500/20",text:"text-red-600 dark:text-red-400",grad:"from-red-500/40 via-red-300/20"};case"actos_condiciones":return{bg:"bg-orange-500/10",border:"border-orange-500/20",text:"text-orange-600 dark:text-orange-400",grad:"from-orange-500/40 via-orange-300/20"};default:return{bg:"bg-teal-500/10",border:"border-teal-500/20",text:"text-teal-600 dark:text-teal-400",grad:"from-teal-500/40 via-teal-300/20"}}})(),oe=!!(y&&!W);return e.jsxs("div",{className:oe?"w-full shrink-0 px-3 pb-1.5 pt-2.5":"w-full shrink-0 px-4 pb-2 pt-4",children:[e.jsxs("div",{className:"group flex min-w-0 items-center gap-2.5 sm:gap-3",children:[ne&&e.jsx("button",{onClick:o,className:`flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary text-text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-surface-hover ${oe?"h-8 w-8":"h-10 w-10"}`,"aria-label":"Volver a la selección de lienzos",title:"Volver a la selección de lienzos",children:e.jsx(or,{className:oe?"h-4 w-4":"h-5 w-5"})}),e.jsx("div",{className:`flex shrink-0 items-center justify-center rounded-xl border shadow-sm ${oe?"h-8 w-8":"h-10 w-10"} ${ee.bg} ${ee.border} ${ee.text}`,children:Z()}),c?e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("input",{ref:G,value:T,onChange:Y=>U(Y.target.value),onKeyDown:Y=>{Y.key==="Enter"&&V(),Y.key==="Escape"&&A(!1)},className:`min-w-0 flex-1 border-b-2 bg-transparent py-0.5 font-bold text-text-primary outline-none ${oe?"text-sm sm:text-base":"text-xl"} ${ee.border.replace("/20","")}`,autoFocus:!0}),e.jsx("button",{onClick:V,className:"rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20","aria-label":"Confirmar",children:e.jsx(dt,{className:"h-4 w-4"})}),e.jsx("button",{onClick:()=>A(!1),className:"rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover","aria-label":"Cancelar",children:e.jsx(rt,{className:"h-4 w-4"})})]}):e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("h2",{className:`truncate font-bold leading-tight text-text-primary ${oe?"text-sm sm:text-base":"text-xl"}`,children:X}),f!=="animo"&&e.jsx("button",{onClick:()=>A(!0),className:`rounded-lg p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:${ee.text.split(" ")[0]} ${ee.bg.replace("/10","/5")} shrink-0 transition-all`,"aria-label":"Renombrar documento",children:e.jsx(ir,{className:"h-3.5 w-3.5"})})]})]}),e.jsx("div",{className:`${oe?"mt-2":"mt-3"} h-px bg-gradient-to-r ${ee.grad} to-transparent`})]})},u=async c=>{I.current&&clearTimeout(I.current),ze(1500),_e(!0);try{const A=await fetch(`/api/sgsst/canvas/${s}/versions/${c.version}/restore`,{method:"POST",headers:{Authorization:`Bearer ${d}`}});if(A.ok){const T=await A.json(),U=ft(T.content),G=Rt(T.fileType,T.content),V=T.title||"Archivo sin título";M(G),xe.current=G,fe(U),ae.current=U,se(V),N.current=V,Te(T.version||1),Ie(Array.isArray(T.history)?T.history:[]),D.current=T.updatedAt||null,he(!1),$({status:"success",message:"¡Versión restaurada con éxito!"})}}catch(A){console.error("[Restore Version] Error:",A),$({status:"error",message:"Error al restaurar la versión."})}finally{_e(!1)}},b=()=>{const c=typeof R=="string"&&(R.includes("<!DOCTYPE html")||R.includes("<html")||R.includes("<body"));switch(f==="html"||c?"html":f){case"excel":return e.jsx(Dr,{initialContent:R,onUpdate:t,title:X,isMaximized:W,onRegisterDownload:T=>{Xe.current=T}});case"presentation":return e.jsx(Lr,{initialContent:R,onUpdate:t,title:X,isMaximized:W,onRegisterDownload:T=>{Xe.current=T}});case"html":return e.jsx(Fr,{initialContent:R,onUpdate:t,title:X,isMaximized:W,onRegisterDownload:T=>{Xe.current=T}});case"animo":{const T=(S==null?void 0:S.role)==="USER";return e.jsxs("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:[e.jsx("div",{className:`flex-1 overflow-y-auto p-6 ${T?"pointer-events-none select-none blur-[8px] filter":""}`,children:e.jsx(Er,{isMaximized:W})}),T&&e.jsx("div",{className:"absolute inset-0 z-50 flex items-center justify-center bg-black/10 p-4 backdrop-blur-[2px] sm:p-6 md:p-8",children:e.jsx(ya,{isPopup:!0,title:"Analítica Psicosocial Exclusiva",description:"El Termómetro Psicosocial es una herramienta exclusiva de los planes de pago. Adquiere o actualiza tu plan para ver el diagnóstico cuantitativo, estresores principales y recomendaciones de la IA.",plan:"USER"})})]})}case"actos_condiciones":return e.jsx("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:e.jsx("div",{className:"flex-1 overflow-y-auto p-6",children:e.jsx(_r,{isMaximized:W})})});default:return e.jsx(Or,{initialContent:R,onUpdate:t,onApplyTemplate:n,isMaximized:W})}};if(Ve&&!R)return e.jsxs("div",{className:"flex h-full w-full flex-col items-center justify-center bg-surface-primary p-8",children:[e.jsx("div",{className:"mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal-500"}),e.jsx("p",{className:"text-sm font-semibold text-text-secondary",children:"Cargando espacio de trabajo Canvas..."})]});const P=!!(y&&!W),Se=P?"h-8 min-w-[32px] px-2 sm:h-9 sm:min-w-[36px] sm:px-2.5":"h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3",ue=e.jsxs("div",{className:`flex h-full w-full flex-col overflow-hidden bg-surface-primary text-text-primary ${W?"fixed inset-0 z-[9990] m-0 h-screen w-screen rounded-none shadow-2xl pt-[max(env(safe-area-inset-top),2.5rem)] sm:pt-0":P?"relative":"relative pt-[max(env(safe-area-inset-top),1.5rem)] sm:pt-0"}`,children:[e.jsxs("div",{className:`relative z-[300] flex w-full max-w-full shrink-0 items-center justify-between gap-1.5 overflow-visible border-b border-border-light bg-surface-secondary ${P?"px-2.5 sm:px-3 py-1.5":"px-3 sm:px-4 py-2 sm:py-0"}`,style:{minHeight:P?"3.1rem":"3.75rem"},children:[!P&&e.jsxs("button",{onClick:me,className:"flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700 font-bold text-xs shrink-0 active:scale-95 mr-1","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:[e.jsx(rt,{className:"h-4 w-4"}),e.jsx("span",{children:"Cerrar"})]}),e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 overflow-hidden",children:[e.jsx("div",{className:`hidden ${P?"lg:flex":"sm:flex"} h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-xs`,children:e.jsx(Gt,{className:"h-4 w-4"})}),e.jsxs("div",{className:"min-w-0 flex-1 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("h2",{className:"truncate text-xs sm:text-sm font-extrabold text-text-primary",children:"Canvas"}),e.jsx("span",{className:"hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",children:"2.0"})]}),e.jsxs("div",{className:"flex min-w-0 items-center gap-1.5",children:[e.jsx("span",{className:`h-1.5 w-1.5 shrink-0 rounded-full ${F?"animate-pulse bg-teal-500":"bg-green-500"}`}),e.jsx("span",{className:"truncate text-[11px] sm:text-xs text-text-secondary",children:ne?(X==null?void 0:X.trim())||"Documento SG-SST":"Nuevo espacio Canvas"}),Le&&e.jsx("span",{className:"shrink-0 text-[10px] italic text-text-tertiary",children:"Guardando..."})]})]})]}),e.jsxs("div",{className:`flex shrink-0 flex-nowrap items-center ${P?"gap-1":"gap-1.5 sm:gap-2"} overflow-visible py-0.5`,children:[ne&&f!=="animo"&&f!=="actos_condiciones"&&e.jsxs("button",{onClick:async c=>{c.preventDefault(),c.stopPropagation(),await h(void 0,!0)},disabled:Le,className:`group flex ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Guardar cambios",title:"Guardar cambios",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:Le?e.jsx("div",{className:"h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"}):e.jsx(ar,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:Le?"Guardando...":"Guardar"})})]}),ne&&f==="text"&&e.jsx(Ar,{content:R,fileName:X}),ne&&f!=="text"&&f!=="animo"&&f!=="actos_condiciones"&&e.jsxs("button",{onClick:async c=>{if(c.preventDefault(),c.stopPropagation(),Xe.current)Xe.current();else if(R){const A=ft(R),T=(X||"archivo").replace(/[/\\?%*:|"<>]/g,"_").trim(),U=f==="html"||A.includes("<html")||A.includes("<!DOCTYPE"),G=U?"html":f==="excel"?"json":"txt",V=new Blob([A],{type:U?"text/html;charset=utf-8":"text/plain;charset=utf-8"});ea.saveAs(V,`${T}.${G}`)}(S==null?void 0:S.role)==="USER"&&fetch("/api/files/register-download",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`}}).catch(A=>console.error("Download register error:",A))},className:`group flex ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Descargar archivo",title:f==="presentation"?"Descargar presentación ejecutiva":f==="excel"?"Descargar hoja de cálculo":"Descargar aplicativo interactivo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(gt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:f==="presentation"?"Descargar Presentación":f==="excel"?"Descargar Hoja":"Descargar Aplicativo"})})]}),ne&&f!=="animo"&&f!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>et(!ot),className:`hidden sm:flex group ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${ot?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Historial de reportes",title:"Historial de reportes",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(St,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Historial"})})]}),ne&&f!=="animo"&&f!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>he(!qe),className:`hidden sm:flex group ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${qe?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Versiones de documento",title:"Versiones de documento",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(Ut,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Versiones"})})]}),e.jsxs("button",{onClick:()=>Oe(c=>!c),className:`${y?"flex":"hidden sm:flex"} group ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":W?"Reducir panel":"Expandir panel",title:W?"Contraer a vista con Tenshi":"Expandir a pantalla completa",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:W?e.jsx(rr,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"}):e.jsx(sr,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:W?"Contraer":"Expandir"})})]}),e.jsxs("button",{onClick:me,className:`${P?"flex":"hidden sm:flex"} group ${Se} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":P?"Volver al chat":"Cerrar lienzo",title:P?"Volver al chat":"Cerrar lienzo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(rt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:P?"Volver al chat":"Cerrar"})})]})]})]}),e.jsx(Tr,{onSelectReport:c=>{et(!1),y?(Ee.current=0,D.current=null,be(null),O==null||O(c)):at(`/c/${c}`)},isOpen:ot,toggleOpen:()=>et(c=>!c),historyEndpoint:s&&s!=="new"?`/api/sgsst/canvas/history?conversationId=${s}`:"/api/sgsst/canvas/history",tags:[],refreshTrigger:He}),e.jsxs("div",{className:"relative flex flex-1 flex-col overflow-hidden",children:[ne?e.jsxs(e.Fragment,{children:[e.jsx(m,{}),e.jsx("div",{className:"relative flex h-full flex-1 flex-col overflow-hidden",children:b()})]}):e.jsxs("div",{className:`relative flex-1 overflow-y-auto ${P?"px-3 py-4 sm:px-5 sm:py-6":"px-4 py-6 sm:px-8 sm:py-10"}`,children:[e.jsx("div",{className:"pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"}),e.jsx("div",{className:"pointer-events-none absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"}),e.jsxs("div",{className:"relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6 text-center",children:[e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsxs("div",{className:"relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-transparent text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10",children:[e.jsx(We,{className:"h-8 w-8 animate-pulse"}),e.jsx("span",{className:"absolute -right-1.5 -top-1.5 flex h-5 items-center rounded-md border border-teal-500/40 bg-surface-primary px-1.5 text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 shadow-xs",children:"PRO"})]}),e.jsx("span",{className:"inline-flex items-center gap-1.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300",children:"WAPPY CANVAS STUDIO 2.0 · SUITE EJECUTIVA SG-SST"})]}),e.jsxs("div",{className:"space-y-2 max-w-xl",children:[e.jsx("h3",{className:"text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary",children:"El lienzo está listo"}),e.jsx("p",{className:"text-xs sm:text-sm leading-relaxed text-text-secondary",children:"Crea documentos normativos, matrices de cálculo, presentaciones ejecutivas y aplicativos interactivos en tiempo real."})]}),e.jsxs("div",{className:`grid w-full grid-cols-1 ${P?"lg:grid-cols-2":"sm:grid-cols-2"} gap-3.5 pt-2`,children:[e.jsxs("button",{onClick:()=>{const c=nt(`
<div style="font-family: 'Inter', Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <h2 style="font-size: 15px; font-weight: 800; color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin-top: 8px;">1. OBJETIVO Y ALCANCE NORMATIVO</h2>
  <p style="font-size: 13px; text-align: justify;">Establecer los lineamientos técnicos, administrativos y legales del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST) conforme al Decreto Único Reglamentario 1072 de 2015 y los Estándares Mínimos de la Resolución 0312 de 2019, aplicables a todos los centros de trabajo, trabajadores directos, contratistas y partes interesadas de la organización.</p>
  <h2 style="font-size: 15px; font-weight: 800; color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 4px; margin-top: 20px;">2. LINEAMIENTOS Y CONTROLES OPERATIVOS</h2>
  <table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px;">
    <thead>
      <tr>
        <th style="background: #0f766e; color: #ffffff; padding: 9px 12px; text-align: left;">Fase PHVA</th>
        <th style="background: #0f766e; color: #ffffff; padding: 9px 12px; text-align: left;">Actividad Estratégica</th>
        <th style="background: #0f766e; color: #ffffff; padding: 9px 12px; text-align: left;">Evidencia / Entregable</th>
        <th style="background: #0f766e; color: #ffffff; padding: 9px 12px; text-align: center;">Estado</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">PLANEAR</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Identificación de peligros y valoración GTC-45</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Matriz IPEVR actualizada y socializada</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">Cumplido</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">HACER</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Vigilancia epidemiológica y exámenes ocupacionales</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Profesiograma y certificados de aptitud</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">En ejecución</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">VERIFICAR</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Auditoría interna e inspección gerencial</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Informe de hallazgos COPASST</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #d97706; font-weight: bold;">Programado</td>
      </tr>
    </tbody>
  </table>
</div>`);!s||s==="new"?g("text",c,"Informe Técnico SG-SST"):(I.current&&clearTimeout(I.current),ze(1500),M("text"),fe(c),se("Informe Técnico SG-SST"),xe.current="text",ae.current=c,N.current="Informe Técnico SG-SST",h(void 0,!1,!0))},className:"group relative flex flex-col justify-between rounded-2xl border border-teal-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-teal-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(Gt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"NORMATIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors",children:"Documento Corporativo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Políticas, actas COPASST, procedimientos, matrices legales e informes con firma digital."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"15 Plantillas SST"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Firma Digital"})]})]}),e.jsxs("button",{onClick:()=>{const c=JSON.stringify([["Indicador SG-SST (Res. 0312)","Meta Anual (%)","Q1 (%)","Q2 (%)","Q3 (%)","Q4 (%)","Promedio Real"],["Ejecución Plan Anual de Trabajo","95","88","92","95","98","=PROMEDIO(C2:F2)"],["Cumplimiento Cronograma Capacitación","90","85","90","92","96","=PROMEDIO(C3:F3)"],["Cierre de Acciones ACPM","100","80","88","94","100","=PROMEDIO(C4:F4)"],["Cobertura Exámenes Ocupacionales","100","95","100","100","100","=PROMEDIO(C5:F5)"],["PROMEDIO CONSOLIDADO","=PROMEDIO(B2:B5)","=PROMEDIO(C2:C5)","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=PROMEDIO(G2:G5)"]]);!s||s==="new"?g("excel",c,"Tablero Indicadores SG-SST"):(I.current&&clearTimeout(I.current),ze(1500),M("excel"),fe(c),se("Tablero Indicadores SG-SST"),xe.current="excel",ae.current=c,N.current="Tablero Indicadores SG-SST",h())},className:"group relative flex flex-col justify-between rounded-2xl border border-emerald-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(vt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300",children:"ANALÍTICO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors",children:"Hoja de Cálculo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Matrices GTC-45, presupuestos, indicadores Res. 0312, fórmulas en vivo y analítica gráfica."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Fórmulas + Gráficos"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Multi-Hoja"})]})]}),e.jsxs("button",{onClick:()=>{const c=JSON.stringify([{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Cumplimiento de Estándares Mínimos Resolución 0312 de 2019","Gestión de Peligros Prioritarios y Vigilancia Epidemiológica"],takeaway:"Presentación oficial para aprobación de la Alta Dirección."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Estándares Res. 0312: 94.5% (Nivel Aceptable)","Plan Anual de Trabajo: 92% ejecutado","Reducción de accidentalidad ATEL: -35%","Cobertura de exámenes médicos: 100%"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La intervención en la fuente redujo los días de incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",kicker:"MATRIZ DE PELIGROS GTC-45",layout:"columns",theme:"emerald-sst",bullets:["Comparativa de estado inicial vs intervención ejecutada"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas.","Permisos de trabajo en alturas diligenciados en papel."]},{title:"Estado Actual (Control Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Ayudas mecánicas hidráulicas instaladas en bodega central.","Trazabilidad digital en tiempo real mediante WAPPY IA."]}],takeaway:"100% de los peligros críticos intervenidos con controles efectivos."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo",kicker:"MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Planificación trimestral verificable"],steps:[{phase:"FASE 01 · PLANEAR",title:"Diagnóstico e Higiene",detail:"Actualización GTC-45 y mediciones ambientales."},{phase:"FASE 02 · HACER",title:"Intervención SVE",detail:"Batería psicosocial y escuela de liderazgo."},{phase:"FASE 03 · VERIFICAR",title:"Auditoría e Inspección",detail:"Simulacro anual y auditoría Decreto 1072."},{phase:"FASE 04 · ACTUAR",title:"Cierre de ACPM",detail:"Cierre del 100% de hallazgos y revisión gerencial."}],takeaway:"Compromiso gerencial con la mejora continua del SG-SST."}]);!s||s==="new"?g("presentation",c,"Presentación Ejecutiva SG-SST"):(I.current&&clearTimeout(I.current),ze(1500),M("presentation"),fe(c),se("Presentación Ejecutiva SG-SST"),xe.current="presentation",ae.current=c,N.current="Presentación Ejecutiva SG-SST",h())},className:"group relative flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(Pt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"EJECUTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors",children:"Presentación Ejecutiva"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"10 estructuras visuales (KPIs, columnas, ruta PHVA, tablas, gráficos) para Alta Dirección."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"10 Estructuras"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"8 Temas Pro"})]})]}),e.jsxs("button",{onClick:()=>{const c=`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plantilla Informativa SST</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    body {
      background: linear-gradient(135deg, #0f172a 0%, #020617 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
  </style>
</head>
<body class="p-6 sm:p-12">
  <div class="max-w-xl text-center bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-500">
    <div class="w-16 h-16 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
      <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
      </svg>
    </div>
    <h1 class="text-2xl font-black bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3">
      Prototipo Interactivo WAPPY
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-6">
      Bienvenido al estudio interactivo de aplicativos SST. Inserta calculadoras, simuladores y tableros en vivo desde la Biblioteca SST superior.
    </p>
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25">
      <span class="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
      <span class="text-[10px] text-teal-400 font-bold uppercase tracking-widest">Listo para Inyectar</span>
    </div>
  </div>
</body>
</html>`;!s||s==="new"?g("html",c,"Prototipo Interactivo"):(I.current&&clearTimeout(I.current),ze(1500),M("html"),fe(c),se("Prototipo Interactivo"),xe.current="html",ae.current=c,N.current="Prototipo Interactivo",h())},className:"group relative flex flex-col justify-between rounded-2xl border border-blue-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(zt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300",children:"INTERACTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",children:"Prototipo Interactivo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Calculadoras SST, simuladores, tableros interactivos y aplicativos autocontenidos."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Vista en Vivo"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Componentes SST"})]})]})]}),e.jsx("div",{className:"flex w-full pt-1",children:e.jsxs("button",{onClick:()=>et(!0),className:"flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-xs sm:text-sm font-extrabold text-orange-700 dark:text-orange-300 shadow-xs transition-all duration-300 hover:bg-orange-500/20 sm:hover:scale-[1.01] active:scale-95 cursor-pointer",children:[e.jsx(St,{className:"h-4 w-4"}),e.jsx("span",{children:"Explorar el Historial de Documentos Canvas"})]})})]})]}),qe&&e.jsxs("div",{className:"fixed inset-0 z-[999999] flex items-center justify-center",children:[e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm",onClick:()=>he(!1)}),e.jsxs("div",{className:"relative flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in zoom-in-95",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-border-light bg-surface-secondary px-6 py-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm",children:e.jsx(St,{className:"h-5 w-5"})}),e.jsx("h2",{className:"text-lg font-bold text-text-primary",children:"Versiones"})]}),e.jsxs("p",{className:"mt-1 text-sm text-text-secondary",children:["Historial de versiones de ",X]})]}),e.jsx("button",{onClick:()=>he(!1),className:"rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary",children:e.jsx(rt,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto bg-surface-primary p-6",children:[!j&&e.jsxs("div",{onClick:()=>window.location.href="/planes",className:"mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 transition-all duration-300 hover:scale-[1.01] hover:bg-amber-500/15 dark:text-amber-300",children:[e.jsx(We,{className:"mt-0.5 h-5 w-5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400"}),e.jsxs("div",{className:"flex-1 text-sm",children:[e.jsx("span",{className:"font-bold",children:"Límite del Plan Gratuito:"})," Solo conservamos las últimas 5 versiones en este chat. Pásate a Pro para mantener un registro de hasta 20 versiones.",e.jsx("span",{className:"ml-2 font-bold underline transition-colors hover:text-amber-900 dark:hover:text-amber-100",children:"¡Subir de nivel ahora!"})]})]}),Ye.length===0?e.jsxs("div",{className:"flex h-full flex-col items-center justify-center gap-4 text-center",children:[e.jsx("div",{className:"flex h-16 w-16 items-center justify-center rounded-full border border-border-light bg-surface-secondary",children:e.jsx(St,{className:"h-8 w-8 text-text-tertiary"})}),e.jsx("p",{className:"font-medium text-text-secondary",children:"No hay versiones previas guardadas aún."})]}):e.jsx("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",children:Ye.map((c,A)=>{const T=c.version===He,U=c.fileType||Lt(c.content)||f||"text",G=()=>{switch(U){case"excel":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",children:[e.jsx(vt,{className:"h-3 w-3 text-emerald-500"}),"Hoja de Cálculo (Excel)"]});case"presentation":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",children:[e.jsx(Pt,{className:"h-3 w-3 text-amber-500"}),"Presentación (Slides)"]});case"html":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-purple-500/20 bg-purple-50 px-2 py-0.5 text-[9.5px] font-bold text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",children:[e.jsx(zt,{className:"h-3 w-3 text-purple-500"}),"Prototipo HTML / Código"]});default:return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-sky-500/20 bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",children:[e.jsx(st,{className:"h-3 w-3 text-sky-500"}),"Documento de Texto (Word)"]})}},V=!j&&A<Ye.length-5;return e.jsxs("div",{className:`flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${T?"border-teal-500 bg-teal-50 dark:bg-teal-900/10":V?"border-dashed border-gray-300 bg-gray-50/50 opacity-60 hover:opacity-85 dark:border-gray-800 dark:bg-gray-900/5":"border-border-medium bg-surface-secondary hover:border-teal-500/50"}`,children:[e.jsxs("div",{className:"mb-3 flex items-center justify-between border-b border-border-light pb-2",children:[e.jsxs("div",{className:"flex min-w-0 flex-1 flex-col",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"shrink-0 font-bold text-text-primary",children:["Versión ",c.version]}),T&&e.jsx("span",{className:"shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",children:"Actual"})]}),e.jsx("span",{className:"truncate text-xs text-text-tertiary",children:new Date(c.updatedAt).toLocaleString("es-ES")}),G()]}),V?e.jsx("span",{className:"shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500",children:"🔒 PRO"}):e.jsx(Hr,{version:c.version,title:c.title||X,onRename:async Z=>{try{const J=await fetch(`/api/sgsst/canvas/${s}/versions/${c.version}/rename`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${d}`},body:JSON.stringify({title:Z})});if(J.ok){const ee=await J.json();Ie(ee.history||[]),T&&(se(Z),N.current=Z)}}catch(J){console.error("[Version History Rename] Error:",J)}},onDelete:async()=>{try{const Z=await fetch(`/api/sgsst/canvas/${s}/versions/${c.version}`,{method:"DELETE",headers:{Authorization:`Bearer ${d}`}});if(Z.ok){const J=await Z.json();Ie(J.history||[])}}catch(Z){console.error("[Version History Delete] Error:",Z)}}})]}),e.jsxs("div",{className:"mb-4 line-clamp-3 flex-1 text-sm italic text-text-secondary opacity-80",children:['"',c.title||X,'"']}),V?e.jsxs("button",{onClick:()=>{window.location.href="/planes"},className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:hover:bg-amber-900/20",children:[e.jsx(Ut,{className:"h-4 w-4 text-amber-500"}),"Restaurar 🔒 PRO"]}):e.jsxs("button",{onClick:()=>u(c),disabled:T,className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-primary py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-teal-900/20",children:[e.jsx(Ut,{className:"h-4 w-4"}),"Restaurar"]})]},A)})})]})]})]}),(!y||W)&&e.jsx("button",{onClick:me,className:"fixed bottom-6 right-6 z-[99999999] flex sm:hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-900/90 dark:bg-zinc-800/95 text-white shadow-2xl active:scale-90 border border-slate-400/30 backdrop-blur-md focus:outline-none","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:e.jsx(rt,{className:"h-5 w-5"})})]})]}),$e=W?ja.createPortal(ue,document.body):ue;return e.jsxs(e.Fragment,{children:[$e,k&&e.jsx("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:e.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[e.jsx("button",{onClick:()=>H(!1),className:"absolute -top-10 right-0 z-50 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300",children:"Cerrar ✕"}),e.jsx(ya,{title:Pe,description:Q,plan:(S==null?void 0:S.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]})};export{Ss as default};
