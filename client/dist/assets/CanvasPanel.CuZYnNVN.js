const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor.CzLQ0fq0.js","./react-core.DnLkJYlj.js","./markdown_highlight.Cj_heSZW.js","./validation.CXYwsuSc.js","./math-katex.D41sMH58.js","./math-katex.sdXCKFqw.css","./locales-core.odB_8JGc.js","./i18n.CdklldLM.js"])))=>i.map(i=>d[i]);
import{r as l,j as e,a as Tt,R as fa,c as ua}from"./react-core.DnLkJYlj.js";import{dj as Oa,ch as Ke,cb as Fe,dZ as bt,cA as Ze,dL as ht,f8 as Da,hZ as Ia,dE as rt,dJ as Bt,dq as La,hb as ba,ev as ga,cC as xt,fI as ha,cE as Ma,d$ as _a,h7 as Gt,g1 as $t,cG as Ut,cS as pt,cT as ya,d0 as st,d4 as ot,g4 as Fa,dF as Rt,cM as va,hr as Ht,hs as wa,dD as mt,cQ as ja,cu as Ba,gI as Ga,fA as Jt,cx as Kt,cy as Zt,eS as ea,et as ta,fX as aa,h_ as Ct,g$ as Vt,gl as Ot,cO as Ua,dV as Ha,dC as ra,gj as Na,cd as zt,eh as Va,gD as qa,cN as Wa,bP as qt,cK as Ja,h$ as Ya,cW as At,ca as Yt,dB as Qa,cl as sa,gS as Xa,e5 as oa,dg as ia,dG as la,dX as na,cv as Ka,dM as Za,cH as er,bQ as da,bR as ca,bO as tr,g2 as Dt,dO as ar,gg as yt,cp as It,gc as rr,eO as sr,cm as or,gf as ir,c5 as pa,ht as lr,c$ as nr,dn as dr}from"./vendor.CzLQ0fq0.js";import{o as gt,fV as be,s as ft,c as cr,a0 as Sa,p as ka,b6 as vt,U as xa,aC as wt}from"./index.DboC91ND.js";import{L as pr}from"./LiveEditor.DxGJ7XmS.js";import{r as xr,a as mr,p as fr,b as ur,c as br,d as gr,e as hr,f as yr,g as vr,h as wr,i as jr,j as Nr,k as Sr,P as kr}from"./canvas-templates.CmL4TXkY.js";import{_ as Cr}from"./locales-core.odB_8JGc.js";import Ar from"./MoodAnalyticsDashboard.DyZVtX_a.js";import"./utilities.CCKZG3yh.js";import{a as nt}from"./http-client.CBcqubEr.js";import{E as Er,R as Tr}from"./ExportDropdown.CxXMOMAP.js";import{a as Rr}from"./routing.CpqY7sNF.js";import{h as zr}from"./tanstack-vendor.DJw85t3b.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./radix-ui.ZYJ8tYH7.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DDRRMIXX.js";import"./animations.CB6mjIs8.js";import"./virtualization.DpDH72SI.js";import"./headlessui.DXEBwfTB.js";import"./framer-motion.Do3f2MG_.js";import"./i18n.CdklldLM.js";import"./date-utils.D18hejP2.js";import"./forms.DRVLrJdX.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CUhcbvHc.js";import"./SignaturePad.DGr6rkXg.js";import"./CollapsibleReportBox.CD3SOuA8.js";import"./useAutoLoadReport.CUsMSE6f.js";import"./SGSSTHeroHeader.CdYLpi8c.js";const Qt=({onClose:a,onImportTable:m,onImportChart:r,onImportBullets:f,onImportMedia:g,activeFileType:n,initialTab:k="media"})=>{var Ye,qe,Qe;const{token:c}=gt(),[A,v]=l.useState([]),[N,I]=l.useState(!0),[de,X]=l.useState(""),[q,M]=l.useState(k),[D,W]=l.useState([]),[ce,me]=l.useState(!1),[ee,L]=l.useState("all"),[P,Z]=l.useState(""),[Q,re]=l.useState(""),[ie,pe]=l.useState(!1),[K,ae]=l.useState([]),[b,G]=l.useState({startRow:0,startCol:0,endRow:2,endCol:2}),[$,he]=l.useState("bar"),[te,le]=l.useState("Gráfico Importado"),[Ie,Se]=l.useState(0),[Be,Te]=l.useState(1),[Le,$e]=l.useState([]),[Re,ze]=l.useState([]),[Me,ve]=l.useState(!1),[fe,se]=l.useState([]),[ge,E]=l.useState("Resumen de Política");l.useEffect(()=>{F(),_()},[]);const _=async()=>{me(!0);try{const S={};c&&(S.Authorization=`Bearer ${c}`);const C=await fetch("/api/googleflow/media-library",{headers:S});if(C.ok){const xe=await C.json();W(Array.isArray(xe.items)?xe.items:[])}}catch(S){console.error("Error loading Flow & NotebookLM media library:",S)}finally{me(!1)}},we=S=>{let C="";if(S.mediaType==="video")C=`<figure style="margin:24px 0; text-align:center; background:#090d16; padding:16px; border-radius:16px; border:1px solid rgba(168,85,247,0.3);"><video src="${S.publicUrl}" controls playsinline preload="metadata" style="width:100%; max-height:460px; border-radius:12px; background:#000;"></video><figcaption style="margin:8px 0 0; font-size:11px; color:#cbd5e1; font-weight:600;">🎬 ${S.label} · <a href="${S.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf; text-decoration:underline;">Descargar MP4</a></figcaption></figure>`;else if(S.mediaType==="audio")C=`<div style="margin:20px 0; padding:16px 20px; border-radius:14px; background:#f0fdfa; border:1px solid #99f6e4;"><div style="margin:0 0 8px; font-size:13px; color:#0f766e; font-weight:700;">🎙️ ${S.label}</div><audio src="${S.publicUrl}" controls preload="metadata" style="width:100%; display:block;"></audio><div style="margin-top:8px; font-size:11px;"><a href="${S.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488; font-weight:700; text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;else if(S.mediaType==="document"){const xe=S.textPreview?`<pre style="margin:12px 0 0; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; color:#1e293b; white-space:pre-wrap; max-height:360px; overflow-y:auto;">${S.textPreview.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`:"";C=`<div style="margin:20px 0; padding:16px 20px; background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid #0d9488; border-radius:12px;"><div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;"><strong style="color:#0f172a; font-size:13px;">📄 ${S.label}</strong><a href="${S.publicUrl}" download target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:6px 12px; background:#0d9488; color:#ffffff; font-weight:700; font-size:11px; border-radius:8px; text-decoration:none;">⬇ Descargar Recurso</a></div>${xe}</div>`}else C=`<figure style="margin:24px 0; text-align:center; background:#f8fafc; padding:16px; border-radius:14px; border:1px solid #e2e8f0;"><img src="${S.publicUrl}" alt="${S.label}" style="max-width:100%; height:auto; border-radius:10px; box-shadow:0 4px 20px rgba(15,23,42,0.08); display:block; margin:0 auto;" /><figcaption style="margin:10px 0 0; font-size:12px; color:#475569; font-style:italic; font-weight:600;">✨ ${S.label}</figcaption></figure>`;g?(g(S,C),a()):m&&(m(C),a())},F=async()=>{I(!0),X("");try{const S=await fetch("/api/sgsst/canvas/history");if(!S.ok)throw new Error("Error al conectar con el servidor.");const xe=(await S.json()).conversations||[];v(xe);const H=xe.filter(p=>p.fileType==="excel"),o=xe.filter(p=>p.fileType==="text");q==="excel"&&H.length>0?Pe(H[0].conversationId,H[0].title,"excel"):q==="text"&&o.length>0&&Pe(o[0].conversationId,o[0].title,"text")}catch(S){X("No se pudo cargar el historial de lienzos."),console.error(S)}finally{I(!1)}},Oe=S=>{if(M(S),S==="media"){_();return}ae([]),$e([]),Z(""),ze([]),se([]);const C=A.filter(xe=>xe.fileType===(S==="excel"?"excel":"text"));C.length>0&&Pe(C[0].conversationId,C[0].title,S)},Pe=async(S,C,xe)=>{var H;pe(!0),Z(S),re(C),ae([]),$e([]),ze([]),se([]);try{const o=await fetch(`/api/sgsst/canvas/${S}`);if(!o.ok)throw new Error("Error al cargar documento.");const p=await o.json();if(xe==="excel"){let w=[];if(Array.isArray(p.content))w=p.content;else if(typeof p.content=="string")try{const j=JSON.parse(p.content);Array.isArray(j)&&(w=j)}catch{}if(w.length>0){ae(w),le(C);const j=Math.min(w.length-1,6),T=Math.min((w[0]||[]).length-1,4);if(G({startRow:0,startCol:0,endRow:j>=0?j:0,endCol:T>=0?T:0}),w[0]&&w[0].length>1){Se(0);for(let t=1;t<w[0].length;t++){let s=!1;for(let d=1;d<w.length;d++){const i=(H=w[d])==null?void 0:H[t],h=(i!=null?String(i):"").replace(/[^0-9.\-]/g,"");if(h&&!isNaN(parseFloat(h))){s=!0;break}}if(s){Te(t);break}}}}}else{const w=p.content||"",j=document.createElement("div");j.innerHTML=w;const T=Array.from(j.querySelectorAll("p, li, h2, h3, h1")).map(t=>{var s;return((s=t.textContent)==null?void 0:s.trim())||""}).filter(t=>t.length>12);$e(T.length>0?T:["No se detectó suficiente texto estructurado en este documento."]),E(C)}}catch(o){console.error("Error loading bridge doc:",o)}finally{pe(!1)}},De=()=>{var t,s;if(K.length===0||!m)return;const{startRow:S,startCol:C,endRow:xe,endCol:H}=b,o=Math.min(S,xe),p=Math.max(S,xe),w=Math.min(C,H),j=Math.max(C,H);let T=`<div class="imported-excel-table" style="overflow-x:auto; margin:20px 0; border:1px solid rgba(13,148,136,0.2); border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); background:#ffffff; font-family:'Outfit', sans-serif;">`;T+='<table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">',T+='<thead><tr style="background:linear-gradient(135deg, #0f766e, #0d9488); color:#ffffff;">';for(let d=w;d<=j;d++){const i=((t=K[o])==null?void 0:t[d])||"";T+=`<th style="padding:12px 16px; font-weight:700; border-bottom:3px solid #0f766e; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">${i}</th>`}T+='</tr></thead><tbody style="color:#334155;">';for(let d=o+1;d<=p;d++){const i=d%2===0?"rgba(20,184,166,0.03)":"#ffffff";T+=`<tr style="background:${i}; border-bottom:1px solid rgba(226,232,240,0.8); transition:all 0.2s;">`;for(let x=w;x<=j;x++){const h=(s=K[d])==null?void 0:s[x],y=h!=null?String(h):"",je=!isNaN(parseFloat(y.replace(/[^0-9.\-]/g,"")))&&y.includes("$")||y.length<10?"right":"left";T+=`<td style="padding:10px 16px; text-align:${je}; font-weight:500;">${y}</td>`}T+="</tr>"}T+="</tbody></table></div>",m(T),a()},ke=()=>{var p,w;if(K.length===0||!r)return;const{startRow:S,endRow:C}=b,xe=Math.min(S,C),H=Math.max(S,C),o=[];for(let j=xe+1;j<=H;j++){const T=(p=K[j])==null?void 0:p[Ie],t=T!=null?String(T):`Fila ${j}`,s=(w=K[j])==null?void 0:w[Be],d=s!=null?String(s):"0",i=parseFloat(d.replace(/[^0-9.\-]/g,"")),x=isNaN(i)?0:i;o.push({label:t,val:x})}o.length>0&&(r({type:$,data:o,title:te}),a())},Ae=S=>{Re.includes(S)?ze(Re.filter(C=>C!==S)):ze([...Re,S])},He=()=>{Re.length!==0&&(ve(!0),setTimeout(()=>{const S=Re.map(xe=>Le[xe]),C=[];S.forEach(xe=>{const H=xe.split(/[.!?]+/).map(o=>o.trim()).filter(o=>o.length>15);H.length>0&&H.slice(0,2).forEach(o=>{if(C.length<5){const p=o.charAt(0).toUpperCase()+o.slice(1);C.push(p)}})}),C.length===0&&(C.push("Establecer el compromiso de la alta dirección en SST."),C.push("Implementar canales eficaces de reporte y evaluación."),C.push("Garantizar recursos para el plan anual de capacitaciones.")),se(C),ve(!1)},1200))},Ve=()=>{fe.length===0||!f||(f(ge,fe),a())},Xe=A.filter(S=>S.fileType==="excel"),et=A.filter(S=>S.fileType==="text");return e.jsxs("div",{className:"absolute right-0 top-0 bottom-0 z-[500] w-[360px] sm:w-[420px] bg-slate-950/80 backdrop-blur-xl border-l border-teal-500/20 shadow-2xl flex flex-col animate-slide-in-right text-slate-100 font-sans",children:[e.jsxs("div",{className:"p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-teal-950/30 to-slate-950",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400",children:e.jsx(Oa,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-bold text-sm text-white tracking-wide",children:"Puente de Lienzos"}),e.jsx("p",{className:"text-[10.5px] text-teal-400 font-medium",children:"Interconexión SST Inteligente"})]})]}),e.jsx("button",{onClick:a,className:"p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",children:e.jsx(Ke,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"px-3 py-2.5 bg-slate-950/50 border-b border-slate-900 flex gap-1.5",children:[e.jsxs("button",{onClick:()=>Oe("media"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 ${q==="media"?"bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(Fe,{className:"h-3.5 w-3.5 text-purple-400"}),"Flow & NotebookLM"]}),e.jsxs("button",{onClick:()=>Oe("excel"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${q==="excel"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(bt,{className:"h-3.5 w-3.5"}),"Excel"]}),e.jsxs("button",{onClick:()=>Oe("text"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${q==="text"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(Ze,{className:"h-3.5 w-3.5"}),"Word"]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[q==="media"&&e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("div",{className:"flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex-1",children:["all","flow","notebooklm","antigravity"].map(S=>e.jsx("button",{onClick:()=>L(S),className:`flex-1 py-1 px-1.5 rounded-md text-[9.5px] font-bold transition-all ${ee===S?"bg-purple-500/20 text-purple-300 border border-purple-500/40":"text-slate-400 hover:text-slate-200"}`,children:S==="all"?"Todos":S==="flow"?"Flow":S==="notebooklm"?"NotebookLM":"Antigravity"},S))}),e.jsx("button",{onClick:_,disabled:ce,className:"p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 transition-all",title:"Actualizar biblioteca multimedia (30 días)",children:e.jsx(ht,{className:`h-3.5 w-3.5 ${ce?"animate-spin text-purple-400":""}`})})]}),e.jsxs("div",{className:"px-2.5 py-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-[10px] text-purple-200",children:[e.jsx("span",{children:"💾 Almacenados en tu servidor WAPPY"}),e.jsx("span",{className:"font-bold text-purple-400",children:"Retención: 30 días"})]}),ce?e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(ht,{className:"h-6 w-6 text-purple-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Cargando recursos de Flow y NotebookLM..."})]}):(()=>{const S=D.filter(C=>ee==="all"||C.source===ee);return S.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-10 px-5 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl",children:[e.jsx(Da,{className:"h-7 w-7 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-bold text-slate-300 mb-1",children:"No hay recursos descargados aún"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Genera una imagen o video con Google Flow o una infografía/podcast con NotebookLM y aparecerá aquí automáticamente durante 30 días."})]}):e.jsx("div",{className:"space-y-3",children:S.map(C=>e.jsxs("div",{className:"bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-xl overflow-hidden transition-all shadow-md",children:[C.mediaType==="image"&&e.jsxs("div",{className:"relative h-36 w-full bg-slate-950 overflow-hidden",children:[e.jsx("img",{src:C.publicUrl,alt:C.label,className:"w-full h-full object-cover",loading:"lazy"}),e.jsx("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-purple-300 border border-purple-500/30",children:C.source==="flow"?"✨ Flow Imagen":"📊 NotebookLM"}),e.jsxs("span",{className:"absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30",children:["⏳ ",C.daysRemaining,"d"]})]}),C.mediaType==="video"&&e.jsxs("div",{className:"relative bg-black",children:[e.jsx("video",{src:C.publicUrl,controls:!0,playsInline:!0,preload:"metadata",className:"w-full max-h-40 object-contain"}),e.jsxs("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-cyan-300 border border-cyan-500/30 pointer-events-none",children:["🎬 ",C.source==="flow"?"Veo 3.1 Lite":"NotebookLM Video"]})]}),C.mediaType==="audio"&&e.jsxs("div",{className:"p-3 bg-slate-950 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-[10px] font-bold text-teal-300 flex items-center gap-1",children:[e.jsx(Ia,{className:"h-3.5 w-3.5"})," ",C.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",C.daysRemaining,"d"]})]}),e.jsx("audio",{src:C.publicUrl,controls:!0,className:"w-full h-8"})]}),C.mediaType==="document"&&e.jsxs("div",{className:"p-3 bg-slate-950/90 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsxs("span",{className:"text-[10px] font-bold text-amber-300 flex items-center gap-1",children:[e.jsx(Ze,{className:"h-3.5 w-3.5"})," ",C.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",C.daysRemaining,"d"]})]}),C.textPreview&&e.jsxs("p",{className:"text-[10px] text-slate-400 line-clamp-3 font-mono bg-slate-900/80 p-2 rounded border border-slate-800",children:[C.textPreview.slice(0,180),"..."]})]}),e.jsxs("div",{className:"p-3 flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-xs font-bold text-white truncate",title:C.label,children:C.label}),e.jsxs("p",{className:"text-[10px] text-slate-400 truncate font-mono",children:[C.filename," • ",(C.sizeBytes/1024).toFixed(0)," KB"]})]}),e.jsxs("button",{onClick:()=>we(C),className:"shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all cursor-pointer",children:[e.jsx(rt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Insertar"})]})]})]},C.filename))})})()]}),q!=="media"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5",children:"Seleccionar origen del historial"}),e.jsxs("div",{className:"relative",children:[e.jsxs("select",{value:P,onChange:S=>{const C=A.find(xe=>xe.conversationId===S.target.value);C&&(q==="excel"||q==="text")&&Pe(C.conversationId,C.title,q)},className:"w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-teal-500/50 appearance-none pr-8 cursor-pointer",children:[e.jsx("option",{value:"",disabled:!0,children:"Selecciona un archivo..."}),q==="excel"?Xe.map(S=>e.jsx("option",{value:S.conversationId,children:S.title},S.conversationId)):et.map(S=>e.jsx("option",{value:S.conversationId,children:S.title},S.conversationId))]}),e.jsx("div",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800",children:e.jsx(Bt,{className:"h-3.5 w-3.5 rotate-90"})})]})]}),q!=="media"&&ie&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(ht,{className:"h-6 w-6 text-teal-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Analizando celdas y estructuras..."})]}),q!=="media"&&!P&&!ie&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl",children:[e.jsx(La,{className:"h-6 w-6 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-semibold text-slate-400 mb-1",children:"Sin archivos disponibles"}),e.jsx("p",{className:"text-[10px] text-slate-500",children:"Aún no se ha guardado ningún lienzo de este tipo en la empresa."})]}),q==="excel"&&P&&!ie&&K.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900/90 rounded-xl p-3.5 space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Rango de Celdas de Excel"}),e.jsxs("span",{className:"text-[10px] font-semibold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300",children:[String.fromCharCode(65+b.startCol),"$",b.startRow+1," : ",String.fromCharCode(65+b.endCol),"$",b.endRow+1]})]}),e.jsx("div",{className:"overflow-x-auto pb-1.5",children:e.jsxs("table",{className:"mx-auto border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"w-6 h-5 bg-slate-950 text-[9px] text-slate-500 font-bold border border-slate-900 text-center"}),(Ye=K[0])==null?void 0:Ye.slice(0,6).map((S,C)=>e.jsx("th",{className:"w-10 h-5 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:String.fromCharCode(65+C)},C))]})}),e.jsx("tbody",{children:K.slice(0,7).map((S,C)=>e.jsxs("tr",{children:[e.jsx("td",{className:"w-6 h-6 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:C+1}),S.slice(0,6).map((xe,H)=>{const o=C>=Math.min(b.startRow,b.endRow)&&C<=Math.max(b.startRow,b.endRow)&&H>=Math.min(b.startCol,b.endCol)&&H<=Math.max(b.startCol,b.endCol);return e.jsx("td",{onClick:()=>{b.startRow===C&&b.startCol===H?G({startRow:C,startCol:H,endRow:C,endCol:H}):G({...b,endRow:C,endCol:H})},className:`w-10 h-6 border border-slate-900/60 text-[9.5px] p-1 text-center truncate cursor-pointer transition-all duration-150 ${o?"bg-teal-500/25 border-teal-500/60 text-white font-bold":"bg-slate-900/90 text-slate-400 hover:bg-slate-800"}`,title:xe,children:xe||""},H)})]},C))})]})}),e.jsx("p",{className:"text-[10px] text-slate-500 text-center",children:"Haz clic en cualquier celda para definir el límite del rango a importar."})]}),e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(ba,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Importar Rango como Tabla HTML"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Inserta una tabla limpia con bordes redondeados y tipografía SST integrada."})]})]}),e.jsxs("button",{onClick:De,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/20 text-white transition-all",children:[e.jsx(rt,{className:"h-3.5 w-3.5"}),"Inyectar Tabla Elegante"]})]}),n==="presentation"&&r&&e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(ga,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Generar Gráfico SVG Interactivo"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Convierte el rango seleccionado en un gráfico vectorial adaptado al tema."})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje X (Etiquetas)"}),e.jsx("select",{value:Ie,onChange:S=>Se(parseInt(S.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(qe=K[0])==null?void 0:qe.map((S,C)=>e.jsx("option",{value:C,children:S||`Columna ${String.fromCharCode(65+C)}`},C))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje Y (Valores)"}),e.jsx("select",{value:Be,onChange:S=>Te(parseInt(S.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(Qe=K[0])==null?void 0:Qe.map((S,C)=>e.jsx("option",{value:C,children:S||`Columna ${String.fromCharCode(65+C)}`},C))})]})]}),e.jsx("div",{className:"grid grid-cols-3 gap-2",children:["bar","line","pie"].map(S=>e.jsx("button",{onClick:()=>he(S),className:`py-1.5 text-[10.5px] font-semibold border rounded-lg capitalize transition-all ${$===S?"bg-teal-500/15 border-teal-500/60 text-teal-300":"border-slate-800 text-slate-400 hover:text-slate-300"}`,children:S==="bar"?"Barras":S==="line"?"Líneas":"Torta"},S))}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Título del Gráfico"}),e.jsx("input",{type:"text",value:te,onChange:S=>le(S.target.value),className:"w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("button",{onClick:ke,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg text-white transition-all",children:[e.jsx(rt,{className:"h-3.5 w-3.5"}),"Insertar Gráfico de Neón"]})]})]})]}),q==="text"&&P&&!ie&&Le.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-3",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Secciones Disponibles del Documento"}),e.jsx("div",{className:"space-y-2 max-h-[180px] overflow-y-auto pr-1",children:Le.map((S,C)=>{const xe=Re.includes(C);return e.jsx("div",{onClick:()=>Ae(C),className:`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all ${xe?"bg-teal-500/10 border-teal-500/40 text-teal-200":"bg-slate-900/70 border-slate-850 text-slate-400 hover:border-slate-800"}`,children:e.jsx("p",{className:"line-clamp-3",children:S})},C)})}),e.jsx("p",{className:"text-[9.5px] text-slate-500",children:"Selecciona los párrafos clave que deseas sintetizar en las diapositivas."})]}),e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 space-y-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(Fe,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Sintetizador de Viñetas IA"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Analiza y destila párrafos largos en puntos clave listos para presentaciones."})]})]}),Re.length===0?e.jsx("div",{className:"text-center py-4 bg-slate-950/40 border border-slate-900 rounded-lg",children:e.jsx("p",{className:"text-[10px] text-slate-500 font-semibold",children:"Selecciona al menos un párrafo arriba para comenzar."})}):e.jsx("button",{onClick:He,disabled:Me,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-all",children:Me?e.jsxs(e.Fragment,{children:[e.jsx(ht,{className:"h-3.5 w-3.5 animate-spin"}),"Sintetizando ideas clave..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Fe,{className:"h-3.5 w-3.5 text-teal-300"}),"Sintetizar en Viñetas"]})}),fe.length>0&&e.jsxs("div",{className:"mt-3.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 animate-fade-in",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase mb-1",children:"Título de Diapositiva a Crear"}),e.jsx("input",{type:"text",value:ge,onChange:S=>E(S.target.value),className:"w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase",children:"Puntos Clave Extraídos"}),e.jsx("ul",{className:"list-disc pl-4 text-[10.5px] text-slate-300 space-y-1",children:fe.map((S,C)=>e.jsx("li",{children:S},C))})]}),e.jsxs("button",{onClick:Ve,className:"w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-bold rounded-lg text-white transition-all",children:[e.jsx(rt,{className:"h-3.5 w-3.5"}),"Inyectar como Nueva Diapositiva"]})]})]})]})]})]})},Et=`
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
</div>`,Pr=[{id:"politica_sst",title:"Política de SST",description:"Compromisos oficiales y alta dirección (Decreto 1072)",icon:e.jsx(Ze,{className:"h-4 w-4 text-teal-500"}),html:`
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

        ${Et}
      </div>
    `.trim()},{id:"copasst",title:"Acta del COPASST",description:"Constitución oficial de delegados y actas de comités",icon:e.jsx(ha,{className:"h-4 w-4 text-emerald-500"}),html:`
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

        ${Et}
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
    `.trim()},{id:"inspeccion_planeada",title:"Inspección de Seguridad",description:"Lista de chequeo para orden, aseo e instalaciones",icon:e.jsx(_a,{className:"h-4 w-4 text-indigo-500"}),html:`
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
    `.trim()},{id:"analisis_riesgo_ats",title:"Análisis de Riesgo (ATS)",description:"Control de peligros and autorizaciones por tarea",icon:e.jsx(Gt,{className:"h-4 w-4 text-orange-500"}),html:`
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
    `.trim()},{id:"rit_tradicional",title:"RIT - Modelo Tradicional",description:"Reglamento Interno de Trabajo con enfoque legal estricto y de autoridad",icon:e.jsx($t,{className:"h-4 w-4 text-slate-500"}),html:xr},{id:"rit_humanista",title:"RIT - Modelo Humanista",description:"Reglamento de convivencia enfocado en bio-individualidad, salud mental y bienestar",icon:e.jsx(Ut,{className:"h-4 w-4 text-rose-500"}),html:mr},{id:"plan_emergencias",title:"Plan de Emergencias",description:"Plan de prevención, preparación y respuesta ante emergencias (Decreto 1072)",icon:e.jsx(pt,{className:"h-4 w-4 text-red-500"}),html:`
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

        ${Et}
      </div>
    `.trim()},{id:"politica_desconexion",title:"Pol. Desconexión Laboral",description:"Regulación del descanso y salud digital (Ley 2191 de 2022)",icon:e.jsx($t,{className:"h-4 w-4 text-indigo-500"}),html:fr},{id:"politica_acoso_laboral",title:"Pol. Acoso Laboral",description:"Prevención de acoso y convivencia armónica (Ley 1010)",icon:e.jsx(pt,{className:"h-4 w-4 text-emerald-500"}),html:ur},{id:"protocolo_acoso_laboral",title:"Prot. Acoso Laboral",description:"Ruta de quejas y mediación del Comité de Convivencia",icon:e.jsx(Gt,{className:"h-4 w-4 text-teal-500"}),html:br},{id:"politica_acoso_sexual",title:"Pol. Acoso Sexual",description:"Prevención y tolerancia cero frente a agresión sexual (Ley 2365)",icon:e.jsx(pt,{className:"h-4 w-4 text-rose-500"}),html:gr},{id:"protocolo_acoso_sexual",title:"Prot. Acoso Sexual",description:"Ruta de atención urgente y medidas cautelares (Ley 2365)",icon:e.jsx(ya,{className:"h-4 w-4 text-purple-500"}),html:hr},{id:"politica_genero",title:"Pol. Equidad de Género",description:"Plan de igualdad de oportunidades y brecha salarial cero",icon:e.jsx(Ut,{className:"h-4 w-4 text-blue-500"}),html:yr},{id:"contrato_indefinido",title:"Contrato Término Indefinido",description:"Contrato de trabajo estándar sin límite de tiempo vinculante",icon:e.jsx(Ze,{className:"h-4 w-4 text-slate-500"}),html:vr},{id:"contrato_definido",title:"Contrato Término Fijo",description:"Contrato laboral con fecha de vencimiento y prórrogas",icon:e.jsx(Ze,{className:"h-4 w-4 text-blue-800"}),html:wr},{id:"contrato_servicios",title:"Prestación de Servicios",description:"Contrato civil/comercial independiente con autonomía técnica",icon:e.jsx(Ze,{className:"h-4 w-4 text-teal-600"}),html:jr},{id:"contrato_obra_labor",title:"Contrato de Obra o Labor",description:"Contrato laboral condicionado al fin de un proyecto u obra",icon:e.jsx(Ze,{className:"h-4 w-4 text-orange-700"}),html:Nr},{id:"procedimiento_sancionatorio",title:"Procedimiento Sancionatorio",description:"Debido proceso disciplinario, descargos y apelación (C-593/14 y Ley 2466 de 2025)",icon:e.jsx($t,{className:"h-4 w-4 text-slate-700"}),html:Sr}],$r=[{id:"inlay_signatures",title:"Bloque de Firmas SST",description:"Inyectar firmas de Líder SST y Representante de Trabajadores",icon:e.jsx(ha,{className:"h-4.5 w-4.5 text-teal-600 dark:text-teal-400"}),html:`
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
    `.trim()},{id:"inlay_alert_card",title:"Banderola de Alerta",description:"Inyectar un recuadro llamativo de advertencia de peligro",icon:e.jsx(ya,{className:"h-4.5 w-4.5 text-amber-500"}),html:`
      <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 16px; border-radius: 0 12px 12px 0; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; color: #b45309; font-size: 15px; font-weight: 700;">🚨 ALERTA DE RIESGO DETECTADO</h4>
        <p style="margin: 0; color: #78350f; font-size: 13px;">Se ha identificado una condición subestándar en las instalaciones físicas. Tome medidas de contención de inmediato y proceda con el aislamiento y señalización del área.</p>
      </div>
    `.trim()},{id:"inlay_action_table",title:"Tabla Plan de Acción",description:"Inyectar tabla estilizada para el seguimiento de actividades",icon:e.jsx(Gt,{className:"h-4.5 w-4.5 text-indigo-500"}),html:`
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
    `.trim()}],Or=({initialContent:a,onUpdate:m,onApplyTemplate:r,reportSourceData:f,isMaximized:g})=>{const{token:n}=gt(),k=l.useRef(null),c=l.useRef(null),[A,v]=l.useState(!1),[N,I]=l.useState("templates"),[de,X]=l.useState(!1),[q,M]=l.useState(!1),D=L=>{var K;const P=((K=k.current)==null?void 0:K.getHTML())||a||"";let Z="";const Q=P.indexOf('<div style="background: linear-gradient');if(Q!==-1){let ae=P.match(/<\/table>\s*<\/div>/i);if(ae||(ae=P.match(/<\/table>/i)),ae){const b=P.indexOf(ae[0],Q);b!==-1&&(Z=P.substring(Q,b+ae[0].length))}}else{const ae=P.indexOf('<div style="overflow-x: auto;');if(ae!==-1){let b=P.match(/<\/table>\s*<\/div>/i)||P.match(/<\/table>/i);if(b){const G=P.indexOf(b[0],ae);G!==-1&&(Z=P.substring(ae,G+b[0].length))}}}let re="";const ie=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div class="signature-placeholder'];for(const ae of ie){const b=P.lastIndexOf(ae);if(b!==-1){re=P.substring(b);break}}let pe="";return Z&&(pe+=Z+`

`),pe+=L,re?pe+=`

`+re:pe+=`

`+Et,pe},W=async L=>{var Q,re;const P=(Q=L.target.files)==null?void 0:Q[0];if(!P)return;const Z=new FormData;Z.append("file",P);try{M(!0);const ie=await fetch("/api/live/documents/extract",{method:"POST",headers:{Authorization:`Bearer ${n}`},body:Z});if(!ie.ok){const b=await ie.json().catch(()=>({}));throw new Error(b.error||`Error del servidor (${ie.status})`)}const pe=await ie.json();let K="";if(pe.html?K=pe.html:pe.text&&(K=pe.text.split(`

`).filter(b=>b.trim()).map(b=>`<p>${b.trim().replace(/\n/g,"<br/>")}</p>`).join(`
`)),!K)throw new Error("No se pudo extraer ningún texto del documento cargado.");const ae=D(K);(re=k.current)==null||re.setHTML(ae),m(ae)}catch(ie){console.error("[CanvasTextEditor] Upload error:",ie),alert(ie.message||"Error al subir el archivo")}finally{M(!1),L.target.value=""}},ce=L=>{var P,Z;k.current&&((Z=(P=k.current).insertHTML)==null||Z.call(P,L))};l.useEffect(()=>{if(a&&k.current){const L=k.current.getHTML(),P=Z=>Z.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,"").trim();P(a)!==P(L)&&k.current.setHTML(a)}},[a]);const me=(L,P)=>{window.confirm(`¿Deseas reemplazar el contenido actual por el formato "${P}"? Se perderán las modificaciones no guardadas.`)&&k.current&&(k.current.setHTML(L),r?r(L,P):m(L))},ee=L=>{k.current&&k.current.insertHTML(L)};return e.jsxs("div",{className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[A&&e.jsx("div",{className:`${g?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>v(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${g?"sm:relative sm:z-0":"shadow-2xl"} ${A?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(xt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Normativa SST"})]}),e.jsx("button",{onClick:()=>v(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex p-1.5 bg-surface-primary/60 border-b border-border-medium/60 shrink-0 gap-1",children:[e.jsx("button",{onClick:()=>I("templates"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${N==="templates"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold border border-teal-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"15 Plantillas SST"}),e.jsx("button",{onClick:()=>I("inlays"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${N==="inlays"?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs font-extrabold border border-emerald-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"Bloques Rápidos"})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:N==="templates"?e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Formatos y Políticas Oficiales"}),Pr.map(L=>e.jsxs("button",{onClick:()=>{me(L.html,L.title),g||v(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:L.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:L.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:L.description})]})]},L.id))]}):e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Inyectores en el Cursor"}),$r.map(L=>e.jsxs("button",{onClick:()=>{ee(L.html),g||v(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:L.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-emerald-600 transition-colors",children:L.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:L.description})]})]},L.id))]})})]}),e.jsxs("div",{className:"flex-1 h-full overflow-hidden relative flex flex-col",children:[e.jsx("input",{type:"file",ref:c,className:"hidden",accept:".docx,.doc",onChange:W}),e.jsx("div",{className:"flex-1 overflow-hidden relative",children:e.jsx(pr,{ref:k,initialContent:a,onUpdate:m,reportType:"general",paperMode:!0,hideFullscreen:!1,reportSourceData:f,hideToolbarWhenCollapsed:!1,onToggleTemplates:()=>v(L=>!L),isTemplatesOpen:A,onUploadDocument:()=>{var L;return(L=c.current)==null?void 0:L.click()},isUploadingDocument:q,onOpenAiBridge:()=>X(!0)})})]}),de&&e.jsx(Qt,{onClose:()=>X(!1),onImportTable:ce,onImportMedia:(L,P)=>ce(P),activeFileType:"text",initialTab:"media"})]})};function jt(a){const m=a.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);if(!m)return null;const r=m[1],f=m[2];let g=0;for(let k=0;k<r.length;k++)g=g*26+(r.charCodeAt(k)-64);return g=g-1,{row:parseInt(f,10)-1,col:g}}function Lt(a,m,r,f=new Set){var A;const g=`${a},${m}`;if(f.has(g))return 0;f.add(g);const n=(A=r[a])==null?void 0:A[m],k=n!=null?String(n):"";if(k.startsWith("=")){const v=ut(k,r,f),N=parseFloat(v);return f.delete(g),isNaN(N)?0:N}f.delete(g);const c=parseFloat(k);return isNaN(c)?0:c}function ut(a,m,r=new Set){const f=a!=null?String(a):"";if(!f||!f.startsWith("="))return f;const g=a.toUpperCase().trim(),n=g.match(/^=(SUM|SUMA|AVERAGE|PROMEDIO|MAX|MIN|COUNT|CONTAR)\((.+?)\)$/);if(n){const A=n[1],N=n[2].split(/[,;]/),I=[];for(const de of N){const X=de.trim(),q=X.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);if(q){const M=jt(q[1]),D=jt(q[2]);if(M&&D){const W=Math.min(M.row,D.row),ce=Math.max(M.row,D.row),me=Math.min(M.col,D.col),ee=Math.max(M.col,D.col);for(let L=W;L<=ce;L++)for(let P=me;P<=ee;P++)I.push(Lt(L,P,m,r))}}else{const M=jt(X);if(M)I.push(Lt(M.row,M.col,m,r));else{const D=parseFloat(X);isNaN(D)||I.push(D)}}}if(A==="SUM"||A==="SUMA"){const de=I.reduce((X,q)=>X+q,0);return(Math.round(de*1e4)/1e4).toString()}else if(A==="AVERAGE"||A==="PROMEDIO"){if(I.length===0)return"0";const X=I.reduce((q,M)=>q+M,0)/I.length;return(Math.round(X*1e4)/1e4).toString()}else{if(A==="MAX")return I.length===0?"0":Math.max(...I).toString();if(A==="MIN")return I.length===0?"0":Math.min(...I).toString();if(A==="COUNT"||A==="CONTAR")return I.length.toString()}}let k=g.slice(1);k=k.replace(/([A-Z]+[0-9]+)/g,A=>{const v=jt(A);return v?Lt(v.row,v.col,m,r).toString():A});const c=k.replace(/[^0-9+\-*/().\s]/g,"");try{const A=new Function(`return (${c})`)();return typeof A=="number"&&!isNaN(A)?(Math.round(A*1e4)/1e4).toString():"0"}catch{return"0"}}function Mt(a){let m="",r=a;for(;r>=0;)m=String.fromCharCode(r%26+65)+m,r=Math.floor(r/26)-1;return m}const Dr=({initialContent:a,onUpdate:m,title:r,onRegisterDownload:f,isMaximized:g=!1})=>{var xe,H;const[n,k]=l.useState({"Hoja 1":[["","",""],["","",""],["","",""]]}),[c,A]=l.useState("Hoja 1"),v=n[c]||[["","",""],["","",""],["","",""]],[N,I]=l.useState(null),[de,X]=l.useState(""),q=l.useRef(null),M=l.useRef(null),[D,W]=l.useState(!1),[ce,me]=l.useState(!1),[ee,L]=l.useState(!1);l.useEffect(()=>{const o=()=>{W(!!document.fullscreenElement)};return document.addEventListener("fullscreenchange",o),()=>document.removeEventListener("fullscreenchange",o)},[]);const P=async()=>{const o=M.current;if(document.fullscreenElement)try{document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen()}catch(p){console.error("Exit fullscreen failed:",p)}else try{o!=null&&o.requestFullscreen?await o.requestFullscreen():o.webkitRequestFullscreen&&await o.webkitRequestFullscreen()}catch(p){console.error("Fullscreen request failed:",p)}},[Z,Q]=l.useState(!1),[re,ie]=l.useState("bar"),[pe,K]=l.useState(0),[ae,b]=l.useState(1),[G,$]=l.useState(null),[he,te]=l.useState({x:0,y:0}),[le,Ie]=l.useState(!1),[Se,Be]=l.useState("sum"),Te=(()=>{let o=0;return Array.isArray(v)&&v.forEach(p=>{Array.isArray(p)&&p.length>o&&(o=p.length)}),o||3})(),Le=(()=>{let o=0,p=0;if(Array.isArray(v)){const w=Math.min(10,v.length);for(let j=0;j<w;j++){const t=(v[j]||[]).filter(s=>s&&String(s).trim()!=="").length;t>p&&(p=t,o=j)}}return o})(),$e=v[Le]||[],Re=Array.from({length:Te}).map((o,p)=>{const w=$e[p]?String($e[p]).trim():"";return{index:p,label:w||`Columna ${Mt(p)}`}}),ze=Array.isArray(v)?v.slice(Le+1).filter(o=>Array.isArray(o)&&o.some(p=>p!=null&&String(p).trim()!=="")):[],Me={};ze.forEach((o,p)=>{const w=o[pe],j=w!=null?String(w):"",t=(j.startsWith("=")?ut(j,v):j).trim()||`Fila ${p+1+Le+1}`,s=t.toUpperCase();if(s.includes("TOTAL")||s.includes("CÁLCULO")||s.includes("PROMEDIO")||s.includes("SUMA")||s.includes("CONCEPTO"))return;const d=o[ae],i=d!=null?String(d):"",x=i.startsWith("=")?ut(i,v):i,h=parseFloat(String(x||"").replace(/[^0-9.\-]/g,"")),y=isNaN(h)?0:h;Me[t]||(Me[t]=[]),Me[t].push(y)});const ve=Object.keys(Me).map(o=>{const p=Me[o];let w=0;return Se==="sum"?w=p.reduce((j,T)=>j+T,0):Se==="avg"?w=p.reduce((j,T)=>j+T,0)/p.length:Se==="count"&&(w=p.length),{label:o,val:Math.round(w*100)/100,count:p.length}}).filter(o=>o.label&&(o.val>0||Se==="count")),fe=ve.length,se=ve.map(o=>o.val),ge=se.reduce((o,p)=>o+p,0),E=fe>0?ge/fe:0,_=fe>0?Math.max(...se):0,we=fe>0?Math.min(...se):0,F=se.indexOf(_),Oe=se.indexOf(we),Pe=F!==-1?ve[F].label:"---",De=Oe!==-1?ve[Oe].label:"---";l.useEffect(()=>{var o;if(v&&v[0]&&v[0].length>1)for(let p=1;p<v[0].length;p++){let w=!1;for(let j=1;j<v.length;j++){const T=(o=v[j])==null?void 0:o[p],s=(T!=null?String(T):"").replace(/[^0-9.\-]/g,"");if(s&&!isNaN(parseFloat(s))){w=!0;break}}if(w){b(p);break}}},[v]);const ke=o=>{const p={...n,[c]:o};k(p);const w=Object.keys(p),j=w.length>1||w[0]!=="Hoja 1";m(JSON.stringify(j?p:o))};l.useEffect(()=>{const o=w=>{if(!Array.isArray(w))return null;if(w.length===0)return[["","",""],["","",""],["","",""]];if(w.every(j=>Array.isArray(j)))return w.map(j=>j.map(T=>T==null?"":String(T)));if(w.every(j=>j&&typeof j=="object"&&!Array.isArray(j))){const j=Array.from(new Set(w.flatMap(T=>Object.keys(T))));if(j.length>0)return[j,...w.map(T=>j.map(t=>T[t]===null||T[t]===void 0?"":String(T[t])))]}return null},p=w=>{if(!w)return!1;const j=o(w);if(j)return k({"Hoja 1":j}),A("Hoja 1"),!0;if(typeof w=="object"&&!Array.isArray(w)){const T=w.sheets||w.rows||w.data;if(T)return p(T);const t=Object.keys(w);if(t.length>0){const s={};let d=!0;for(const i of t){const x=o(w[i]);if(!x){d=!1;break}s[i]=x}if(d)return k(s),s[c]||A(t[0]),!0}}return!1};if(a)if(typeof a!="string"){if(p(a))return}else{const w=a.trim().replace(/^```(?:json|csv)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim();try{const j=JSON.parse(w);if(p(j))return}catch(j){const T=w.indexOf("["),t=w.lastIndexOf("]");if(T!==-1&&t>T)try{const s=JSON.parse(w.slice(T,t+1));if(p(s))return}catch{}console.warn("Failed to parse excel content JSON, using fallback",j)}}k(w=>{var t,s,d,i;const j=Object.keys(w);return!w||j.length===0||j.length===1&&(((t=w["Hoja 1"])==null?void 0:t.length)<=1||((s=w["Hoja 1"])==null?void 0:s.length)===3&&((i=(d=w["Hoja 1"])==null?void 0:d[0])==null?void 0:i.every(x=>x==="")))?{"Hoja 1":[["Indicador","Meta","Resultado","Cumplimiento"],["Capacitaciones Realizadas","12","10","83.3%"],["Simulacros de Emergencia","2","2","100%"],["Inspecciones de Seguridad","24","18","75%"]]}:w})},[a]);const Ae=(o,p,w)=>{const j=v.map((T,t)=>T.map((s,d)=>t===o&&d===p?w:s));ke(j)},He=(o,p)=>{var w;I({row:o,col:p}),X(((w=v[o])==null?void 0:w[p])||"")},Ve=o=>{const p=o.target.value;X(p),N&&Ae(N.row,N.col,p)},Xe=()=>{var j;const o=((j=v[0])==null?void 0:j.length)||3,p=Array(o).fill(""),w=[...v,p];ke(w)},et=()=>{if(v.length<=1)return;const o=v.slice(0,-1);ke(o),I(null)},Ye=()=>{const o=v.map(p=>[...p,""]);ke(o)},qe=()=>{var p;if(((p=v[0])==null?void 0:p.length)<=1)return;const o=v.map(w=>w.slice(0,-1));ke(o),I(null)},Qe=async()=>{var T;const o=new Ga.Workbook,p=o.addWorksheet("Reporte Canvas");p.views=[{showGridLines:!0}],v.forEach((t,s)=>{const d=p.getRow(s+1);t.forEach((i,x)=>{const h=d.getCell(x+1);if(i&&String(i).startsWith("=")){const y=String(i).slice(1).trim().toUpperCase();h.value={formula:y}}else{const y=Number(i);i!==""&&!isNaN(y)?h.value=y:h.value=i}h.border={top:{style:"thin",color:{argb:"FFD1D5DB"}},left:{style:"thin",color:{argb:"FFD1D5DB"}},bottom:{style:"thin",color:{argb:"FFD1D5DB"}},right:{style:"thin",color:{argb:"FFD1D5DB"}}},s===0?(h.font={name:"Segoe UI",bold:!0,color:{argb:"FFFFFFFF"},size:11},h.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0D9488"}},h.alignment={vertical:"middle",horizontal:"center"}):(h.font={name:"Segoe UI",size:10},h.alignment={vertical:"middle",horizontal:"left"},s%2===0&&(h.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF9FAFB"}}))})}),(T=p.columns)==null||T.forEach(t=>{var d;let s=0;(d=t.eachCell)==null||d.call(t,{includeEmpty:!0},i=>{const x=i.value?String(i.value):"";x.length>s&&(s=x.length)}),t.width=Math.max(s+4,12)});const w=await o.xlsx.writeBuffer(),j=new Blob([w],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});Jt.saveAs(j,`${r}.xlsx`)},S=()=>{if(!v||v.length===0)return;let o=`<table style="width: 100%; max-width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1f2937; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">`;o+='<thead style="background-color: #0d9488; color: #ffffff; text-align: left; font-weight: bold;"><tr>',v[0].forEach(p=>{o+=`<th style="padding: 12px 16px; border-bottom: 2px solid #0f766e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${p||""}</th>`}),o+="</tr></thead>",o+="<tbody>",v.slice(1).forEach((p,w)=>{const j=w%2===0?"#ffffff":"#f9fafb";o+=`<tr style="background-color: ${j}; border-bottom: 1px solid #e5e7eb;">`,p.forEach(T=>{const t=T&&String(T).startsWith("=")?ut(String(T),v):T;o+=`<td style="padding: 10px 16px; vertical-align: middle;">${t||""}</td>`}),o+="</tr>"}),o+="</tbody></table>",navigator.clipboard.writeText(o).then(()=>{Ie(!0),setTimeout(()=>Ie(!1),2500)}).catch(p=>{console.error("No se pudo copiar el HTML al portapapeles:",p)})},C=(o,p,w)=>{let j=p,T=w;if(o.key==="ArrowUp")o.preventDefault(),j=Math.max(0,p-1);else if(o.key==="ArrowDown")o.preventDefault(),j=Math.min(v.length-1,p+1);else if(o.key==="ArrowLeft"){const t=o.currentTarget;if(t.selectionStart===0&&t.selectionEnd===0)o.preventDefault(),T=Math.max(0,w-1);else return}else if(o.key==="ArrowRight"){const t=o.currentTarget;if(t.selectionStart===t.value.length&&t.selectionEnd===t.value.length)o.preventDefault(),T=Math.min(v[0].length-1,w+1);else return}else if(o.key==="Enter")o.preventDefault(),j=Math.min(v.length-1,p+1);else if(o.key==="Tab")o.preventDefault(),o.shiftKey?T=Math.max(0,w-1):T=Math.min(v[0].length-1,w+1);else return;(j!==p||T!==w)&&(I({row:j,col:T}),X(v[j][T]||""),setTimeout(()=>{const t=document.getElementById(`cell-${j}-${T}`);t&&(t.focus(),t.select())},10))};return l.useEffect(()=>{f&&f(Qe)},[f,v,r]),e.jsxs("div",{ref:M,className:"flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex flex-col gap-2 p-3 border-b border-border-medium bg-surface-secondary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold h-8 w-12 rounded-lg border border-teal-500/20",children:N?`${Mt(N.col)}${N.row+1}`:"---"}),e.jsxs("div",{className:"flex-1 relative flex items-center",children:[e.jsxs("span",{className:"absolute left-2.5 text-text-tertiary font-serif text-sm select-none",children:["ƒ",e.jsx("sub",{children:"x"})]}),e.jsx("input",{type:"text",value:de,onChange:Ve,disabled:!N,placeholder:N?"Introduce datos o fórmula...":"Selecciona una celda para editar",className:"w-full h-8 pl-8 pr-3 text-xs bg-surface-primary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsx(be,{onClick:Xe,icon:e.jsx(st,{className:"h-4 w-4"}),label:"Agregar Fila",title:"Añadir nueva fila al final",variant:"emerald",size:"sm"}),e.jsx(be,{onClick:et,disabled:v.length<=1,icon:e.jsx(ot,{className:"h-4 w-4"}),label:"Quitar Fila",title:"Eliminar fila seleccionada o última fila",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium"}),e.jsx(be,{onClick:Ye,icon:e.jsx(st,{className:"h-4 w-4"}),label:"Agregar Columna",title:"Añadir nueva columna a la derecha",variant:"emerald",size:"sm"}),e.jsx(be,{onClick:qe,disabled:((xe=v[0])==null?void 0:xe.length)<=1,icon:e.jsx(ot,{className:"h-4 w-4"}),label:"Quitar Columna",title:"Eliminar columna seleccionada o última columna",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium hidden sm:block"}),e.jsxs("div",{className:"relative",children:[e.jsx(be,{onClick:()=>{me(o=>!o),L(!1)},icon:e.jsx(xt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Cargar matrices y presupuestos SG-SST con fórmulas automáticas",variant:"amber",size:"sm",isActive:ce}),ce&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Matrices y Hojas de Cálculo SG-SST"}),e.jsxs("button",{onClick:()=>{ke([["Proceso / Área","Peligro (GTC-45)","Clasificación","ND","NE","NP (ND*NE)","NC","NR (NP*NC)","Control de Ingeniería / Medio"],["Operaciones / Planta","Levantamiento manual de cargas","Biomecánico","6","4","=D2*E2","25","=F2*G2","Ayudas mecánicas hidráulicas"],["Mantenimiento","Trabajos en alturas > 2.0m","Condiciones de Seguridad","6","3","=D3*E3","60","=F3*G3","Línea de vida certificada Res. 4272"],["Producción","Ruido continuo > 85 dBA","Físico","2","4","=D4*E4","25","=F4*G4","Encapsulamiento acústico en fuente"],["Administración","Carga mental y pantallas PVD","Psicosocial","2","3","=D5*E5","10","=F5*G5","Pausas activas y ajuste ergonómico"],["PROMEDIO / MÁXIMO RIESGO","-","-","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=MAX(G2:G5)","=MAX(H2:H5)","Intervención Prioritaria"]]),me(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Matriz de Peligros GTC-45"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Cálculo automático de NP (ND*NE) y Nivel de Riesgo NR"})]}),e.jsxs("button",{onClick:()=>{ke([["Rubro SG-SST (Dec. 1072)","Presupuesto Asignado ($)","Ejecutado Q1 ($)","Ejecutado Q2 ($)","Total Ejecutado ($)","Saldo Disponible ($)"],["Medicina Preventiva y EMO","4500000","1200000","1800000","=C2+D2","=B2-E2"],["Elementos de Protección EPP","6800000","2500000","2900000","=C3+D3","=B3-E3"],["Capacitación y Brigadas","3200000","900000","1400000","=C4+D4","=B4-E4"],["Mediciones Higiénicas","5000000","0","3500000","=C5+D5","=B5-E5"],["TOTAL PRESUPUESTO SST","=SUMA(B2:B5)","=SUMA(C2:C5)","=SUMA(D2:D5)","=SUMA(E2:E5)","=SUMA(F2:F5)"]]),me(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Presupuesto Anual SG-SST"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Control de ejecución trimestral y saldo disponible"})]}),e.jsxs("button",{onClick:()=>{ke([["Indicador Resolución 0312/2019","Meta (%)","Enero","Febrero","Marzo","Promedio Trimestral"],["Frecuencia de Accidentalidad","0","0","1","0","=PROMEDIO(C2:E2)"],["Severidad de Accidentalidad","0","0","3","0","=PROMEDIO(C3:E3)"],["Cumplimiento Plan de Trabajo","95","90","94","98","=PROMEDIO(C4:E4)"],["Cobertura Inducción SST","100","100","100","100","=PROMEDIO(C5:E5)"]]),me(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Indicadores Resolución 0312"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Frecuencia, severidad y cumplimiento trimestral"})]})]})]}),e.jsxs("div",{className:"relative",children:[e.jsx(be,{onClick:()=>{L(o=>!o),me(!1)},icon:e.jsx(Fa,{className:"h-4 w-4"}),label:"Insertar Fórmula",title:"Insertar fórmula automática en la celda activa (=SUMA, =PROMEDIO, =MAX, =MIN)",variant:"purple",size:"sm",isActive:ee}),ee&&e.jsxs("div",{className:"absolute left-0 mt-2 w-60 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Fórmulas en Celda Activa"}),[{fn:"=SUMA(B2:B5)",desc:"Suma de rango vertical"},{fn:"=PROMEDIO(B2:B5)",desc:"Promedio aritmético"},{fn:"=MAX(B2:B5)",desc:"Valor máximo del rango"},{fn:"=MIN(B2:B5)",desc:"Valor mínimo del rango"},{fn:"=CONTAR(B2:B5)",desc:"Conteo de registros"}].map(o=>e.jsxs("button",{onClick:()=>{const p=(N==null?void 0:N.row)??v.length-1,w=(N==null?void 0:N.col)??1;Ae(p,w,o.fn),X(o.fn),L(!1)},className:"w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-500/10 transition-colors flex items-center justify-between cursor-pointer",children:[e.jsx("span",{className:"text-xs font-mono font-bold text-purple-600 dark:text-purple-400",children:o.fn}),e.jsx("span",{className:"text-[10px] text-text-tertiary",children:o.desc})]},o.fn))]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(be,{onClick:S,icon:e.jsx(Rt,{className:"h-4 w-4"}),label:"Copiar Tabla",title:"Copiar tabla formateada para pegar en un Documento o Informe",variant:"fuchsia",size:"sm"}),e.jsx(be,{onClick:()=>Q(!Z),icon:e.jsx(va,{className:"h-4 w-4"}),label:"Analizar y Graficar",title:"Abrir centro de análisis estadístico y gráficos interactivos",variant:"orange",size:"sm",isActive:Z}),g&&e.jsx(be,{onClick:P,icon:D?e.jsx(Ht,{className:"h-4 w-4"}):e.jsx(wa,{className:"h-4 w-4"}),label:D?"Salir":"Pantalla Completa",title:D?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"}),e.jsx(be,{onClick:Qe,icon:e.jsx(mt,{className:"h-4 w-4"}),label:"Descargar Hoja",title:"Descargar hoja de cálculo con formato corporativo",variant:"green",size:"sm"})]})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden relative",children:[e.jsxs("div",{className:"flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-secondary/40",children:[e.jsx("div",{className:"flex-1 overflow-auto p-4",ref:q,children:e.jsx("div",{className:"inline-block min-w-full align-middle border border-border-medium rounded-xl shadow-sm overflow-hidden bg-surface-primary",children:e.jsxs("table",{className:"min-w-full border-collapse text-left font-sans text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-surface-secondary select-none",children:[e.jsx("th",{className:"w-10 border-r border-b border-border-medium text-center font-mono font-bold text-text-tertiary p-1.5"}),(H=v[0])==null?void 0:H.map((o,p)=>e.jsx("th",{className:"border-r border-b border-border-medium text-center font-mono font-bold text-text-secondary px-3 py-1.5 min-w-[120px]",children:Mt(p)},p))]})}),e.jsx("tbody",{children:v.map((o,p)=>e.jsxs("tr",{className:"hover:bg-surface-hover/30 transition-colors",children:[e.jsx("td",{className:"border-r border-b border-border-medium text-center font-mono font-bold bg-surface-secondary text-text-tertiary select-none p-1.5",children:p+1}),o.map((w,j)=>{const T=(N==null?void 0:N.row)===p&&(N==null?void 0:N.col)===j,t=T?w:ut(w,v);return e.jsx("td",{onClick:()=>He(p,j),className:`border-r border-b border-border-medium px-3 py-2 cursor-pointer transition-all ${T?"bg-teal-500/10 outline outline-2 outline-teal-500 z-10":"hover:bg-teal-500/5"}`,children:e.jsx("input",{id:`cell-${p}-${j}`,type:"text",value:t,onFocus:()=>He(p,j),onKeyDown:s=>C(s,p,j),onChange:s=>{Ae(p,j,s.target.value),X(s.target.value)},className:"w-full bg-transparent border-none outline-none text-text-primary cursor-pointer focus:cursor-text"})},j)})]},p))})]})})}),e.jsxs("div",{className:"flex items-center justify-between border-t border-border-medium bg-surface-secondary px-4 py-2 mt-auto select-none",children:[e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] pr-2 scrollbar-none",children:Object.keys(n).map(o=>{const p=c===o;return e.jsxs("button",{onClick:()=>{A(o),I(null)},className:`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${p?"bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold shadow-sm":"bg-transparent border border-transparent text-text-secondary hover:text-text-primary"}`,children:[e.jsx(bt,{className:`h-3.5 w-3.5 ${p?"text-teal-500":"text-text-secondary"}`}),e.jsx("span",{children:o})]},o)})}),e.jsxs("div",{className:"flex items-center gap-2",children:[fe>0&&e.jsxs("div",{className:"hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl border border-teal-500/20 bg-teal-500/5 text-[10px] font-mono font-bold text-text-secondary",children:[e.jsxs("span",{children:["Suma: ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400",children:ge.toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Prom: ",e.jsx("strong",{className:"text-emerald-600 dark:text-emerald-400",children:(Math.round(E*100)/100).toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Filas: ",e.jsx("strong",{children:v.length})]})]}),e.jsx(be,{onClick:()=>{const o=`Hoja ${Object.keys(n).length+1}`,p={...n,[o]:[["","",""],["","",""],["","",""]]};k(p),A(o),I(null),m(JSON.stringify(p))},icon:e.jsx(st,{className:"h-4 w-4"}),label:"Nueva Hoja",title:"Añadir nueva pestaña de cálculo",variant:"emerald",size:"sm"}),Object.keys(n).length>1&&e.jsx(be,{onClick:()=>{const o=Object.keys(n),p=o.indexOf(c),w={...n};delete w[c];const j=o[p-1]||o[p+1]||Object.keys(w)[0];k(w),A(j),I(null);const T=Object.keys(w),t=T.length>1||T[0]!=="Hoja 1";m(JSON.stringify(t?w:w[j]))},icon:e.jsx(ot,{className:"h-4 w-4"}),label:"Eliminar Hoja",title:"Eliminar pestaña actual",variant:"danger",size:"sm"})]})]})]}),Z&&Tt.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 font-sans",children:[e.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:()=>Q(!1)}),e.jsxs("div",{className:"relative w-full max-w-5xl h-[85vh] bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-[14px]",children:e.jsx(ja,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("h2",{className:"font-bold text-xl text-text-primary tracking-tight flex items-center gap-1.5",children:["Análisis de Datos ",e.jsx(Fe,{className:"h-4 w-4 text-amber-500 animate-pulse"})]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 font-medium",children:"Análisis estadístico, indicadores en tiempo real y gráficos interactivos"})]})]}),e.jsx("button",{onClick:()=>Q(!1),className:"p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer",children:e.jsx(Ke,{className:"w-5 h-5 text-text-secondary"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 bg-surface-primary grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0",children:[e.jsxs("div",{className:"lg:col-span-4 flex flex-col space-y-4 max-h-full overflow-y-auto pr-1",children:[e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3.5 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Dimensiones de Gráfico"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje X (Etiqueta)"}),e.jsx("select",{value:pe,onChange:o=>K(parseInt(o.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Re.map(o=>e.jsx("option",{value:o.index,children:o.label},o.index))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje Y (Valor)"}),e.jsx("select",{value:ae,onChange:o=>b(parseInt(o.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Re.map(o=>e.jsx("option",{value:o.index,children:o.label},o.index))})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Operación de Análisis"}),e.jsx("div",{className:"flex bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["sum","avg","count"].map(o=>e.jsx("button",{onClick:()=>Be(o),className:`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${Se===o?"bg-teal-600 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:o==="sum"?"Suma":o==="avg"?"Promedio":"Frecuencia"},o))})]}),e.jsx("div",{className:"flex bg-surface-secondary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["bar","line","area","pie"].map(o=>e.jsx("button",{onClick:()=>ie(o),className:`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${re===o?"bg-teal-500 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:o==="bar"?"Barras":o==="line"?"Líneas":o==="area"?"Área":"Torta"},o))}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Indicadores del Eje Y"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Total Suma"}),e.jsx("span",{className:"text-sm font-bold text-text-primary mt-1 font-mono",children:ge.toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Promedio"}),e.jsx("span",{className:"text-sm font-bold text-teal-600 mt-1 font-mono",children:(Math.round(E*100)/100).toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Límites Máx/Mín"}),e.jsxs("span",{className:"text-[9px] bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded-full font-mono font-semibold",children:["Regs: ",fe]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-medium/30",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Máx: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:Pe})]}),e.jsx("span",{className:"text-xs font-bold text-green-600 font-mono",children:_.toLocaleString()})]}),e.jsxs("div",{className:"border-l border-border-medium/30 pl-2",children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Mín: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:De})]}),e.jsx("span",{className:"text-xs font-bold text-red-500 font-mono",children:we.toLocaleString()})]})]})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm flex flex-col min-h-[160px]",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Tabla de Distribución"}),e.jsx("div",{className:"flex-1 overflow-y-auto border border-border-medium rounded-xl bg-surface-primary shadow-sm max-h-[180px]",children:e.jsxs("table",{className:"w-full text-left font-sans text-[11px] border-collapse",children:[e.jsx("thead",{className:"bg-surface-secondary sticky top-0 font-bold text-text-secondary select-none border-b border-border-medium z-10",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2",children:"Categoría"}),e.jsx("th",{className:"p-2 text-right",children:"Valor"}),e.jsx("th",{className:"p-2 text-right",children:"% Part."})]})}),e.jsx("tbody",{children:ve.map((o,p)=>{const w=ge>0?o.val/ge*100:0;return e.jsxs("tr",{className:"border-b border-border-medium hover:bg-surface-hover/20",children:[e.jsx("td",{className:"p-2 font-medium text-text-primary max-w-[120px] truncate",title:o.label,children:o.label}),e.jsx("td",{className:"p-2 text-right font-mono text-text-secondary",children:o.val.toLocaleString()}),e.jsxs("td",{className:"p-2 text-right font-mono text-teal-600 font-semibold",children:[Math.round(w),"%"]})]},p)})})]})})]}),e.jsxs("button",{onClick:S,className:"w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-bold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer",children:[e.jsx(Rt,{className:"h-4 w-4"}),"Copiar Tabla como HTML Premium"]})]}),e.jsx("div",{className:"lg:col-span-8 bg-surface-secondary/40 border border-border-light rounded-2xl p-5 flex flex-col items-center justify-center min-h-[350px] relative shadow-sm overflow-hidden",children:fe===0?e.jsxs("div",{className:"text-center py-8 text-text-tertiary",children:[e.jsx(Ba,{className:"h-8 w-8 mx-auto mb-2 text-text-tertiary/50"}),e.jsx("p",{className:"text-xs",children:"No hay datos válidos para graficar con la operación seleccionada."})]}):e.jsxs("svg",{width:"100%",height:"100%",viewBox:"0 0 500 280",className:"overflow-visible w-full max-h-[380px]",onMouseLeave:()=>$(null),children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"barGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#10b981"}),e.jsx("stop",{offset:"100%",stopColor:"#3b82f6"})]}),e.jsxs("linearGradient",{id:"lineGradient",x1:"0",y1:"0",x2:"1",y2:"0",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6"}),e.jsx("stop",{offset:"100%",stopColor:"#ec4899"})]}),e.jsxs("linearGradient",{id:"areaGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6",stopOpacity:"0.4"}),e.jsx("stop",{offset:"100%",stopColor:"#8b5cf6",stopOpacity:"0.0"})]}),e.jsx("filter",{id:"shadow",x:"-10%",y:"-10%",width:"120%",height:"120%",children:e.jsx("feDropShadow",{dx:"0",dy:"4",stdDeviation:"4",floodOpacity:"0.1"})})]}),re==="bar"&&(()=>{const T=Math.min(36,430/fe*.7),t=430/fe;return ve.map((s,d)=>{const i=_>0?s.val/_*220:0,x=45+d*t+(t-T)/2,h=235-i,y=G===d;return e.jsxs("g",{children:[e.jsx("rect",{x,y:h,width:T,height:Math.max(2,i),fill:"url(#barGradient)",rx:"4",className:"transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-500",style:{transformOrigin:`${x+T/2}px ${h+i}px`,opacity:G===null||y?1:.6,filter:y?"url(#shadow)":"none",transform:y?"scale(1.05)":"scale(1)"},onMouseEnter:O=>{$(d),te({x:O.clientX,y:O.clientY})},onMouseMove:O=>{te({x:O.clientX,y:O.clientY})}}),fe<=15&&e.jsx("text",{x:x+T/2,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:s.label.length>9?`${s.label.slice(0,8)}.`:s.label})]},d)})})(),(re==="line"||re==="area")&&(()=>{const T=fe>1?430/(fe-1):430,t=ve.map((i,x)=>{const h=45+x*T,y=235-(_>0?i.val/_*220:0);return{x:h,y}});let s="";if(t.length>0){s=`M ${t[0].x} ${t[0].y}`;for(let i=1;i<t.length;i++){const x=t[i-1],h=t[i],y=x.x+T/3,O=x.y,je=h.x-T/3,ye=h.y;s+=` C ${y} ${O}, ${je} ${ye}, ${h.x} ${h.y}`}}const d=t.length>0?`${s} L ${t[t.length-1].x} 235 L ${t[0].x} 235 Z`:"";return e.jsxs("g",{children:[re==="area"&&t.length>0&&e.jsx("path",{d,fill:"url(#areaGradient)",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.length>0&&e.jsx("path",{d:s,fill:"none",stroke:"url(#lineGradient)",strokeWidth:"3.5",strokeLinecap:"round",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.map((i,x)=>{const h=G===x;return e.jsx("circle",{cx:i.x,cy:i.y,r:h?6:4,fill:h?"#ec4899":"#8b5cf6",stroke:"white",strokeWidth:"1.5",className:"transition-all duration-150 cursor-pointer shadow-sm",style:{filter:h?"url(#shadow)":"none"},onMouseEnter:y=>{$(x),te({x:y.clientX,y:y.clientY})},onMouseMove:y=>{te({x:y.clientX,y:y.clientY})}},x)}),fe<=15&&t.map((i,x)=>e.jsx("text",{x:i.x,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:ve[x].label.length>9?`${ve[x].label.slice(0,8)}.`:ve[x].label},`lbl-${x}`))]})})(),re==="pie"&&(()=>{let j=0;return ve.map((T,t)=>{if(ge===0)return null;const d=T.val/ge*360,i=240+100*Math.cos((j-90)*Math.PI/180),x=125+100*Math.sin((j-90)*Math.PI/180);j+=d;const h=240+100*Math.cos((j-90)*Math.PI/180),y=125+100*Math.sin((j-90)*Math.PI/180),O=d>180?1:0,je=`
                            M 240 125
                            L ${i} ${x}
                            A 100 100 0 ${O} 1 ${h} ${y}
                            Z
                          `,ye=["#0d9488","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#14b8a6"],Ee=ye[t%ye.length],u=G===t,R=j-d/2-90,z=u?8:0,V=`translate(${z*Math.cos(R*Math.PI/180)}px, ${z*Math.sin(R*Math.PI/180)}px)`;return e.jsx("path",{d:je,fill:Ee,stroke:"white",strokeWidth:"1.5",className:"transition-all duration-300 cursor-pointer animate-in fade-in duration-500",style:{transform:V,opacity:G===null||u?1:.7,filter:u?"url(#shadow)":"none"},onMouseEnter:U=>{$(t),te({x:U.clientX,y:U.clientY})},onMouseMove:U=>{te({x:U.clientX,y:U.clientY})}},t)})})()]})})]})]})]}),document.body)]}),G!==null&&Z&&ve[G]&&e.jsxs("div",{className:"fixed z-[99999999] pointer-events-none backdrop-blur-md bg-surface-primary/95 border border-border-medium rounded-xl p-2.5 shadow-xl text-xs font-sans text-text-primary flex flex-col gap-1",style:{left:he.x+15,top:he.y-10},children:[e.jsx("span",{className:"font-bold text-text-secondary",children:ve[G].label}),e.jsxs("span",{className:"text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold",children:["Valor: ",ve[G].val.toLocaleString()]})]}),le&&e.jsxs("div",{className:"fixed bottom-5 right-5 z-[99999] bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans",children:[e.jsx(Fe,{className:"h-4 w-4 text-emerald-300 animate-spin"}),e.jsx("span",{className:"text-xs font-bold",children:"¡Tabla HTML copiada al portapapeles con éxito!"})]})]})};function B(a){return a?String(a).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim():""}function Ir(a){if(!a||typeof a!="string")return null;try{const g=JSON.parse(a);if(Array.isArray(g))return g;if(g&&Array.isArray(g.slides))return g.slides;if(g&&Array.isArray(g.presentation))return g.presentation;if(g&&Array.isArray(g.deck))return g.deck}catch{}const m=a.indexOf("["),r=a.lastIndexOf("]");if(m===-1||r===-1||m>r)return null;const f=a.slice(m,r+1);try{const g=JSON.parse(f);if(Array.isArray(g))return g}catch{try{let n=f.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(?:^|\s)\/\/.*$/gm,"");n=n.replace(/,\s*\]/g,"]").replace(/,\s*\}/g,"}");const k=JSON.parse(n);if(Array.isArray(k))return k}catch(n){console.error("Failed both standard and cleaned JSON extraction for slides:",n)}}return null}function _t(a,m){var v;const r=a&&typeof a=="object"&&!Array.isArray(a)?a:{title:String(a||`Diapositiva ${m+1}`)},f=Array.isArray(r==null?void 0:r.bullets)?r.bullets.map(N=>String(N||"").trim()).filter(Boolean):typeof(r==null?void 0:r.content)=="string"&&r.content.trim()?r.content.split(/\n|•|-/).map(N=>N.trim()).filter(Boolean):["Indicador clave de gestión SG-SST","Control operativo verificado en campo"];let g=r==null?void 0:r.chartConfig;if(g&&typeof g=="object"){let N=Array.isArray(g.data)?g.data:[];N.length===0&&Array.isArray(g.labels)&&Array.isArray(g.datasets)&&Array.isArray((v=g.datasets[0])==null?void 0:v.data)&&(N=g.labels.map((I,de)=>({label:String(I??""),val:Number(g.datasets[0].data[de]||0)}))),g={type:g.type==="doughnut"?"pie":g.type||"bar",title:String(g.title||(r==null?void 0:r.title)||"Análisis Cuantitativo"),data:N,labels:g.labels,datasets:g.datasets}}else g=void 0;const n=Array.isArray(r==null?void 0:r.kpis)?r.kpis:Array.isArray(r==null?void 0:r.metrics)?r.metrics:void 0,k=n?n.filter(N=>N&&typeof N=="object").map(N=>({label:String(N.label??""),value:String(N.value??""),delta:N.delta!=null?String(N.delta):void 0,trend:N.trend,description:N.description!=null?String(N.description):void 0})):void 0,c=Array.isArray(r==null?void 0:r.columns)?r.columns.filter(N=>N&&typeof N=="object").map(N=>({title:String(N.title??""),badge:N.badge!=null?String(N.badge):void 0,theme:N.theme,items:Array.isArray(N.items)?N.items.map(I=>String(I??"")):typeof N.items=="string"&&N.items.trim()?[N.items.trim()]:[]})):void 0,A=Array.isArray(r==null?void 0:r.steps)?r.steps.filter(N=>N&&typeof N=="object").map((N,I)=>({phase:String(N.phase??`PASO 0${I+1}`),title:String(N.title??""),detail:String(N.detail??N.description??"")})):void 0;return{title:String((r==null?void 0:r.title)||`Diapositiva ${m+1}`),subtitle:String((r==null?void 0:r.subtitle)||""),kicker:String((r==null?void 0:r.kicker)||(r==null?void 0:r.badge)||""),bullets:f.length>0?f:["Punto estratégico"],theme:(r==null?void 0:r.theme)||(m===0?"wappy-dark":"cobalt"),layout:(r==null?void 0:r.layout)||(m===0?"title":"bullets"),imageUrl:String((r==null?void 0:r.imageUrl)||""),tableHtml:String((r==null?void 0:r.tableHtml)||""),chartConfig:g,kpis:k,columns:c,steps:A,quote:String((r==null?void 0:r.quote)||""),citation:String((r==null?void 0:r.citation)||(r==null?void 0:r.normativeRef)||""),takeaway:String((r==null?void 0:r.takeaway)||""),speakerNotes:String((r==null?void 0:r.speakerNotes)||"")}}const Ue={"wappy-dark":{label:"WAPPY Dark Tech",bg:"bg-gradient-to-br from-[#080d02] via-[#0e1705] to-[#071614]",text:"text-white",subtext:"text-slate-300",accent:"text-[#c7f303]",accentBg:"bg-[#c7f303]/15 border-[#c7f303]/40 text-[#c7f303]",border:"border-[#c7f303]/30",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0B1304",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"C7F303",pptCardBg:"15220A",pptCardBorder:"2D4A18"},"wappy-cream":{label:"WAPPY Editorial Cream",bg:"bg-gradient-to-br from-[#faf9f5] via-[#f4f2ea] to-[#e9e5d8]",text:"text-[#0e1300]",subtext:"text-slate-600",accent:"text-[#0d9488]",accentBg:"bg-teal-500/10 border-teal-500/30 text-teal-800",border:"border-teal-600/25",cardBg:"bg-white/85 border-slate-300/80 shadow-sm",isLight:!0,pptBg:"F6F5EF",pptText:"0E1300",pptSubtext:"475569",pptAccent:"0D9488",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"corporate-light":{label:"McKinsey Light",bg:"bg-gradient-to-br from-white via-slate-50 to-blue-50/60",text:"text-slate-900",subtext:"text-slate-600",accent:"text-blue-700",accentBg:"bg-blue-600/10 border-blue-600/30 text-blue-800",border:"border-blue-500/25",cardBg:"bg-white/90 border-slate-200 shadow-sm",isLight:!0,pptBg:"F8FAFC",pptText:"0F172A",pptSubtext:"475569",pptAccent:"1D4ED8",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"emerald-sst":{label:"Esmeralda SG-SST",bg:"bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-950",text:"text-white",subtext:"text-emerald-100/80",accent:"text-teal-300",accentBg:"bg-teal-400/15 border-teal-400/35 text-teal-300",border:"border-teal-500/35",cardBg:"bg-white/[0.06] border-teal-400/20",isLight:!1,pptBg:"042F2E",pptText:"FFFFFF",pptSubtext:"CCFBF1",pptAccent:"2DD4BF",pptCardBg:"064E3B",pptCardBorder:"0F766E"},cobalt:{label:"Cobalto Ejecutivo",bg:"bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950",text:"text-white",subtext:"text-blue-100/80",accent:"text-cyan-400",accentBg:"bg-cyan-500/15 border-cyan-500/35 text-cyan-300",border:"border-blue-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0F172A",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"38BDF8",pptCardBg:"1E293B",pptCardBorder:"334155"},forest:{label:"Bosque Bio-SST",bg:"bg-gradient-to-br from-emerald-950 via-green-950 to-slate-900",text:"text-white",subtext:"text-emerald-100/80",accent:"text-emerald-400",accentBg:"bg-emerald-500/15 border-emerald-500/35 text-emerald-300",border:"border-emerald-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"064E3B",pptText:"FFFFFF",pptSubtext:"D1FAE5",pptAccent:"34D399",pptCardBg:"065F46",pptCardBorder:"059669"},sunset:{label:"Ámbar Alerta",bg:"bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950",text:"text-white",subtext:"text-rose-100/80",accent:"text-amber-400",accentBg:"bg-amber-500/15 border-amber-500/35 text-amber-300",border:"border-rose-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"451A03",pptText:"FFFFFF",pptSubtext:"FDE68A",pptAccent:"FBBF24",pptCardBg:"78350F",pptCardBorder:"B45309"},charcoal:{label:"Carbón Minimal",bg:"bg-gradient-to-br from-zinc-900 via-neutral-900 to-black",text:"text-white",subtext:"text-zinc-300",accent:"text-teal-400",accentBg:"bg-teal-500/15 border-teal-500/35 text-teal-300",border:"border-zinc-700",cardBg:"bg-white/[0.05] border-white/10",isLight:!1,pptBg:"18181B",pptText:"FFFFFF",pptSubtext:"D4D4D8",pptAccent:"2DD4BF",pptCardBg:"27272A",pptCardBorder:"3F3F46"}},ma=[{key:"title",label:"Portada",desc:"Lámina principal de apertura"},{key:"kpi-grid",label:"Tarjetas KPI",desc:"Métricas e indicadores clave"},{key:"columns",label:"Comparativa",desc:"2 o 3 columnas ejecutivas"},{key:"timeline",label:"Hoja de Ruta",desc:"Fases o Ciclo PHVA"},{key:"bullets",label:"Puntos Clave",desc:"Tarjetas de síntesis ejecutiva"},{key:"table",label:"Matriz / Tabla",desc:"Tabla técnica estructurada"},{key:"chart",label:"Gráfico Datos",desc:"Visualización estadística"},{key:"quote",label:"Cita Legal",desc:"Fundamento normativo SST"},{key:"split",label:"Split Imagen",desc:"Evidencia visual + análisis"},{key:"media",label:"Full Media",desc:"Fondo visual inmersivo"}],Ft=[{id:"rendicion-alta-direccion",name:"Rendición de Cuentas Alta Dirección (Dec. 1072)",category:"Gerencial",slides:[{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora Continua",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Revisión integral del Sistema de Gestión de Seguridad y Salud en el Trabajo","Cumplimiento de Estándares Mínimos Resolución 0312 de 2019"],takeaway:"Presentación oficial para aprobación y firma de la Alta Dirección.",speakerNotes:"Dar la bienvenida al comité directivo y presentar el balance anual del SG-SST."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Cumplimiento Estándares 0312: 94.5% (Nivel Aceptable)","ejecución del Plan de Trabajo Anual: 92% de actividades cerradas","Índice de Frecuencia ATEL: Reducción del 35% frente al periodo anterior","Cobertura de Capacitación y Entrenamiento: 100% del personal operativo"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La inversión en prevención en la fuente redujo los días perdidos por incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",subtitle:"Comparativa de cierre de brechas críticas identificadas en la Matriz GTC-45",kicker:"GESTIÓN DE PELIGROS Y RIESGOS",layout:"columns",theme:"emerald-sst",bullets:["Sustitución de manipulación manual de cargas por ayudas mecánicas","Digitalización de permisos de trabajo de alto riesgo en WAPPY"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas en bodega.","Registros en papel sin trazabilidad en tiempo real para trabajo en alturas.","Fatiga postural reportada en el 38% de los cargos operativos."]},{title:"Intervención Ejecutada (Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Implementación de estibadores hidráulicos y mesas niveladoras ergonómicas.","Control digital de listas de chequeo y permisos en WAPPY IA.","Programa de vigilancia epidemiológica osteomuscular con cobertura 100%."]}],takeaway:"El 100% de los peligros Nivel I fueron intervenidos con medidas de ingeniería y administrativas."},{title:"Evolución trimestral del cumplimiento normativo vs accidentalidad",subtitle:"Tendencia histórica verificada por el COPASST y la ARL",kicker:"ANALÍTICA DE TENDENCIAS",layout:"chart",theme:"cobalt",bullets:["Crecimiento sostenido en el cierre de hallazgos ACPM durante los 4 trimestres.","Correlación directa entre capacitación práctica y cero accidentes en Q4."],chartConfig:{type:"bar",title:"% Cumplimiento del Cronograma SG-SST por Trimestre",data:[{label:"Trimestre 1",val:78},{label:"Trimestre 2",val:85},{label:"Trimestre 3",val:91},{label:"Trimestre 4",val:95}]},takeaway:"Meta para el próximo ciclo: sostener el cumplimiento por encima del 96% mensual."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo Fiscal",subtitle:"Prioridades aprobadas para presupuesto y recursos técnicos",kicker:"PLAN DE MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Q1: Actualización de matriz legal, medición higiénica de iluminación y ruido","Q2: Aplicación de Batería de Riesgo Psicosocial y talleres de liderazgo","Q3: Simulacro general de emergencias y auditoría interna cruzada","Q4: Evaluación de eficacia de SVE y revisión por la Alta Dirección"],steps:[{phase:"FASE 1 · PLANEAR (Q1)",title:"Diagnóstico e Higiene Industrial",detail:"Actualización GTC-45, matriz legal y mediciones ambientales con ARL."},{phase:"FASE 2 · HACER (Q2)",title:"Intervención Psicosocial y Biomecánica",detail:"Ejecución de SVE, pausas activas dirigidas y formación de brigadistas."},{phase:"FASE 3 · VERIFICAR (Q3)",title:"Auditoría Interna e Inspecciones",detail:"Verificación de cumplimiento Decreto 1072 y simulacro de evacuación."},{phase:"FASE 4 · ACTUAR (Q4)",title:"Cierre de ACPM y Certificación",detail:"Cierre del 100% de acciones correctivas y reporte al Ministerio/ARL."}],takeaway:"Presupuesto requerido: asignación del 100% de recursos para controles prioritarios."},{title:"Responsabilidad legal indelegable de la Alta Dirección en la prevención",kicker:"FUNDAMENTO JURÍDICO",layout:"quote",theme:"wappy-dark",quote:"El empleador está obligado a la protección de la seguridad y la salud de los trabajadores, acorde con lo establecido en la normatividad vigente, asegurando la asignación de recursos financieros, técnicos y el personal necesario.",citation:"Decreto Único Reglamentario 1072 de 2015 — Artículo 2.2.4.6.8 (Obligaciones de los Empleadores)",bullets:["Prevención de culpa patronal (Art. 216 del Código Sustantivo del Trabajo).","Blindaje jurídico ante inspecciones del Ministerio del Trabajo."],takeaway:"La firma del acta de revisión gerencial formaliza el compromiso institucional."}]},{id:"induccion-sgsst",name:"Inducción y Reinducción Corporativa SG-SST",category:"Capacitación",slides:[{title:"Inducción General al Sistema de Gestión SG-SST",subtitle:"Política de Seguridad, Derechos, Deberes, Peligros Prioritarios y Actuación ante Emergencias",kicker:"BIENVENIDA Y CULTURA DE AUTOCUIDADO",layout:"title",theme:"emerald-sst",bullets:["Conoce los riesgos de tu cargo y cómo protegemos tu vida todos los días"],takeaway:"En nuestra empresa ninguna meta operativa está por encima de tu seguridad."},{title:"Nuestros 4 Pilares de Cultura Preventiva y Cero Daño",kicker:"POLÍTICA INTEGRAL SG-SST",layout:"kpi-grid",theme:"wappy-cream",bullets:["Meta Cero Accidentes Graves o Mortales","100% Reporte de Condiciones Inseguras","Comités Activos: COPASST y Convivencia Laboral","Cobertura ARL desde el primer día de ingreso"],kpis:[{label:"Meta Siniestralidad",value:"0 ATEL",delta:"Prioridad Vida",trend:"up",description:"Todo accidente es 100% prevenible"},{label:"Comités Paritarios",value:"2 Comités",delta:"COPASST + CCL",trend:"neutral",description:"Canales de participación activa"},{label:"Protección ARL",value:"100%",delta:"Cobertura 24/7 laboral",trend:"up",description:"Asistencia médica y económica"},{label:"Reporte Preventivo",value:"< 5 min",delta:"Vía WAPPY IA",trend:"up",description:"Reporta actos y condiciones inseguras"}],takeaway:"Tu participación activa es el motor del Sistema de Gestión."},{title:"Derechos y Responsabilidades Legales del Trabajador",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.10",layout:"columns",theme:"corporate-light",bullets:["Equilibrio entre garantías laborales y deberes de autocuidado"],columns:[{title:"Tus Derechos en SST",badge:"Garantías del Empleador",theme:"info",items:["Recibir elementos de protección personal (EPP) certificados y sin costo.","Capacitación continua y ambientes de trabajo seguros y saludables.","Atención médica oportuna a través de la ARL ante cualquier incidente."]},{title:"Tus Deberes Legales (Art. 2.2.4.6.10)",badge:"Cumplimiento Obligatorio",theme:"success",items:["Procurar el cuidado integral de tu salud y suministrar información clara.","Cumplir las normas, reglamentos e instrucciones del SG-SST.","Informar inmediatamente todo accidente, incidente o condición peligrosa."]}],takeaway:"El autocuidado es un deber legal y ético con tu familia y tus compañeros."},{title:"Protocolo de Actuación en Caso de Accidente o Emergencia",kicker:"RUTA DE RESPUESTA INMEDIATA",layout:"timeline",theme:"wappy-dark",bullets:["Pasos inmediatos ante cualquier evento en el lugar de trabajo"],steps:[{phase:"PASO 1 · ALERTA INMEDIATA",title:"Detén la labor y avisa a tu jefe inmediato",detail:"Todo evento, por leve que parezca, debe reportarse el mismo día."},{phase:"PASO 2 · PRIMEROS AUXILIOS",title:"Activación de la Brigada de Emergencia",detail:"Valoración primaria en sitio y estabilización sin mover al lesionado grave."},{phase:"PASO 3 · REPORTE ARL",title:"Línea de atención ARL y traslado médico",detail:"Radicación del FURAT dentro de las 48 horas hábiles legales."},{phase:"PASO 4 · INVESTIGACIÓN",title:"Lecciones aprendidas (Res. 1401 de 2007)",detail:"Identificación de causas raíz para evitar que vuelva a ocurrir."}],takeaway:"Recuerda: Nunca ocultes un incidente; reportarlo a tiempo salva vidas."}]},{id:"investigacion-atel",name:"Informe de Investigación de Accidente (Res. 1401/2007)",category:"Operativo",slides:[{title:"Investigación Técnica de Accidente de Trabajo y Lecciones Aprendidas",subtitle:"Metodología de Árbol de Causas, Factores Personales/Del Trabajo y Plan de Acción Correctiva",kicker:"RESOLUCIÓN 1401 DE 2007 · DECRETO 1072 DE 2015",layout:"title",theme:"sunset",bullets:["Análisis técnico del equipo investigador y representante del COPASST"],takeaway:"Investigamos para encontrar causas y prevenir repeticiones, nunca para buscar culpables."},{title:"Análisis Causal: Causas Inmediatas vs. Causas Básicas (NTC 3701)",kicker:"DIAGNÓSTICO DE CAUSA RAÍZ",layout:"columns",theme:"wappy-dark",bullets:["Desglose técnico según metodología NTC 3701 y los 5 Porqués"],columns:[{title:"Causas Inmediatas (Síntomas)",badge:"Actos y Condiciones Subestándar",theme:"danger",items:["Condición subestándar: Superficie húmeda sin señalización preventiva en pasillo B.","Acto subestándar: Desplazamiento rápido manipulando carga que obstruía visibilidad.","Uso de calzado con desgaste en labrado antideslizante."]},{title:"Causas Básicas (Raíz Estructural)",badge:"Factores del Trabajo y Personales",theme:"warning",items:["Factor del trabajo: Ausencia de estándar de orden y aseo durante limpieza en turno.","Supervisión insuficiente en la inspección preoperacional de calzado EPP.","Falta de demarcación de vías peatonales segregadas."]}],takeaway:"Atacar únicamente la causa inmediata deja latente el 80% del riesgo de repetición."},{title:"Plan de Acción Correctiva y Preventiva (ACPM) de Cumplimiento Estricto",kicker:"JERARQUÍA DE CONTROLES",layout:"table",theme:"wappy-cream",bullets:["Medidas de ingeniería, administrativas y en el trabajador"],tableHtml:`<table style="width:100%; border-collapse:collapse; font-size:13px;">
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
        </table>`,takeaway:"Verificación de eficacia programada a los 30 días con cierre documental en WAPPY."}]}],Nt=({value:a,onChange:m,placeholder:r="",className:f="",tagName:g="div"})=>{const n=l.useRef(null);l.useEffect(()=>{n.current&&n.current.innerHTML!==a&&(n.current.innerHTML=a||"")},[a]);const k=()=>{n.current&&m(n.current.innerHTML)},c=()=>{n.current&&m(n.current.innerHTML)},A=g;return e.jsx(A,{ref:n,contentEditable:!0,suppressContentEditableWarning:!0,onInput:k,onBlur:c,className:`outline-none focus:ring-1 focus:ring-teal-500/40 rounded px-1 transition-all ${f} relative empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 empty:before:pointer-events-none empty:before:absolute`,"data-placeholder":r,style:{minWidth:"40px"}})},Lr=({initialContent:a,onUpdate:m,title:r,isMaximized:f=!1,onRegisterDownload:g})=>{const[n,k]=l.useState([]),[c,A]=l.useState(0),[v,N]=l.useState(!1),[I,de]=l.useState(!0),[X,q]=l.useState(!1),[M,D]=l.useState(!1),[W,ce]=l.useState(!1),[me,ee]=l.useState(!1),[L,P]=l.useState(!1),[Z,Q]=l.useState({x:0,y:0}),[re,ie]=l.useState(!1),[pe,K]=l.useState(!1),[ae,b]=l.useState("upload"),[G,$]=l.useState(""),[he,te]=l.useState(null),[le,Ie]=l.useState(null),[Se,Be]=l.useState(!1),Te=l.useRef(null),Le=l.useRef(null),$e=l.useRef(!1),Re=async()=>{te(null),$e.current=!0;try{const t=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720,facingMode:"user"}});if(!$e.current){t.getTracks().forEach(s=>s.stop());return}Le.current=t,Ie(t),Te.current&&(Te.current.srcObject=t)}catch(t){console.error("Error accessing camera:",t),te("No se pudo acceder a la cámara. Por favor verifica los permisos.")}},ze=()=>{$e.current=!1,Le.current&&(Le.current.getTracks().forEach(t=>t.stop()),Le.current=null),le&&(le.getTracks().forEach(t=>t.stop()),Ie(null))};l.useEffect(()=>(pe&&ae==="camera"?Re():ze(),()=>{ze()}),[pe,ae]);const Me=()=>{if(Te.current){const t=Te.current,s=document.createElement("canvas");s.width=t.videoWidth||640,s.height=t.videoHeight||480;const d=s.getContext("2d");if(d){d.translate(s.width,0),d.scale(-1,1),d.drawImage(t,0,0,s.width,s.height);const i=s.toDataURL("image/jpeg",.85);ve(i)}}},ve=t=>{const s=n[c],d=(s==null?void 0:s.layout)||"bullets";let i=d;(d==="title"||d==="bullets")&&(i="split"),_(c,{imageUrl:t,layout:i}),K(!1),ze()},fe=t=>{var d;const s=(d=t.target.files)==null?void 0:d[0];if(s){const i=new FileReader;i.onload=x=>{var h;(h=x.target)!=null&&h.result&&ve(x.target.result)},i.readAsDataURL(s)}},se=t=>{t.preventDefault(),Be(!0)},ge=()=>{Be(!1)},E=t=>{var d;t.preventDefault(),Be(!1);const s=(d=t.dataTransfer.files)==null?void 0:d[0];if(s&&s.type.startsWith("image/")){const i=new FileReader;i.onload=x=>{var h;(h=x.target)!=null&&h.result&&ve(x.target.result)},i.readAsDataURL(s)}};l.useEffect(()=>{if(a){if(Array.isArray(a)&&a.length>0){k(a.map((t,s)=>_t(t,s)));return}if(typeof a=="object"&&a!==null){const t=a.slides||a.presentation||a.deck;if(Array.isArray(t)&&t.length>0){k(t.map((s,d)=>_t(s,d)));return}}if(typeof a=="string"){const t=Ir(a);if(t&&Array.isArray(t)&&t.length>0){k(t.map((s,d)=>_t(s,d)));return}}}k(Ft[0].slides)},[a]),l.useEffect(()=>{if(!me)return;const t=s=>{s.key==="ArrowRight"||s.key===" "?(s.preventDefault(),A(d=>Math.min(n.length-1,d+1))):s.key==="ArrowLeft"?(s.preventDefault(),A(d=>Math.max(0,d-1))):s.key==="Escape"&&(s.preventDefault(),ee(!1),P(!1))};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[me,n.length]);const _=(t,s)=>{const d=n.map((i,x)=>x===t?{...i,...s}:i);k(d),m(JSON.stringify(d))},we=()=>{var i;const t=((i=n[c])==null?void 0:i.theme)||"wappy-dark",s={title:"Nuevo Hallazgo o Estrategia Clave",subtitle:"Subtítulo ejecutivo de contexto normativo o técnico",kicker:"ESTRATEGIA SG-SST",bullets:["Primer indicador o acción prioritaria verificable en campo.","Segunda medida de control de ingeniería o administrativa.","Impacto proyectado en la reducción de riesgos laborales."],theme:t,layout:"bullets",takeaway:"Conclusión ejecutiva: priorizar la intervención en la fuente."},d=[...n];d.splice(c+1,0,s),k(d),A(c+1),m(JSON.stringify(d))},F=()=>{const t=n[c];if(!t)return;const s=JSON.parse(JSON.stringify(t));s.title=`${B(s.title)} (Copia)`;const d=[...n];d.splice(c+1,0,s),k(d),A(c+1),m(JSON.stringify(d))},Oe=t=>{const s=t==="up"?c-1:c+1;if(s<0||s>=n.length)return;const d=[...n],[i]=d.splice(c,1);d.splice(s,0,i),k(d),A(s),m(JSON.stringify(d))},Pe=()=>{if(n.length<=1)return;const t=n.filter((s,d)=>d!==c);k(t),A(Math.max(0,c-1)),m(JSON.stringify(t))},De=(t,s)=>{const d=n[c];if(!d)return;const i=d.bullets.map((x,h)=>h===t?s:x);_(c,{bullets:i})},ke=()=>{const t=n[c];t&&_(c,{bullets:[...t.bullets,"Nuevo punto estratégico"]})},Ae=t=>{const s=n[c];if(!s||s.bullets.length<=1)return;const d=s.bullets.filter((i,x)=>x!==t);_(c,{bullets:d})},He=t=>{const s=Ft.find(i=>i.id===t);if(!s)return;const d=JSON.parse(JSON.stringify(s.slides));k(d),A(0),q(!1),m(JSON.stringify(d))},Ve=()=>{const t=n[c];t&&(ce(!0),setTimeout(()=>{const s=["kpi-grid","columns","timeline","quote","bullets"],d=s.indexOf(t.layout||"bullets"),i=s[(d+1)%s.length],x={layout:i,kicker:t.kicker||"INSIGHT EJECUTIVO SG-SST",takeaway:t.takeaway||"El control preventivo en la fuente garantiza el cumplimiento del Decreto 1072 de 2015."};if(i==="kpi-grid"&&(!t.kpis||t.kpis.length===0))x.kpis=t.bullets.slice(0,4).map((h,y)=>{var ye,Ee;const O=B(h),je=O.split(":");return{label:((ye=je[0])==null?void 0:ye.slice(0,28))||`Indicador Clave ${y+1}`,value:((Ee=je[1])==null?void 0:Ee.trim().slice(0,12))||`${92+y*2}%`,delta:"Meta cumplida",trend:"up",description:O.slice(0,70)}});else if(i==="columns"&&(!t.columns||t.columns.length===0)){const h=Math.ceil(t.bullets.length/2);x.columns=[{title:"Diagnóstico y Peligros",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,h).map(B)},{title:"Plan de Intervención SST",badge:"Control Efectivo",theme:"success",items:t.bullets.slice(h).map(B)}]}else i==="timeline"&&(!t.steps||t.steps.length===0)?x.steps=t.bullets.slice(0,4).map((h,y)=>({phase:`FASE 0${y+1} · PHVA`,title:B(h).slice(0,45),detail:B(h)})):i==="quote"&&!t.quote&&(x.quote=B(t.bullets[0]||t.title),x.citation="Decreto Único Reglamentario 1072 de 2015 · Resolución 0312 de 2019");_(c,x),ce(!1)},250))},Xe=t=>{_(c,{layout:"table",tableHtml:t})},et=t=>{_(c,{layout:"chart",chartConfig:t})},Ye=(t,s)=>{var x;const d={title:t,bullets:s,theme:((x=n[c])==null?void 0:x.theme)||"wappy-dark",layout:"bullets"},i=[...n,d];k(i),A(i.length-1),m(JSON.stringify(i))},qe=async()=>{if(!M){D(!0);try{const t=await Cr(()=>import("./vendor.CzLQ0fq0.js").then(x=>x.i0),__vite__mapDeps([0,1,2,3,4,5,6,7]),import.meta.url),s=t.default||t,d=new s;d.layout="LAYOUT_16x9",d.author="WAPPY IA — Suite Ejecutiva SG-SST",d.company="WAPPY Club",d.subject=r||"Presentación Ejecutiva SG-SST",d.title=r||"Presentación WAPPY",n.forEach((x,h)=>{var z,V;const y=Ue[x.theme||"wappy-dark"]||Ue["wappy-dark"],O=d.addSlide();O.background={color:y.pptBg};const je=B(x.title)||`Diapositiva ${h+1}`,ye=B(x.subtitle||""),Ee=B(x.kicker||"").toUpperCase(),u=B(x.takeaway||""),R=x.layout||"bullets";if(O.addShape(d.ShapeType.rect,{x:0,y:0,w:10,h:.08,fill:{color:y.pptAccent},line:{color:y.pptAccent,width:0}}),O.addText(`${B(r)}  |  LÁMINA ${String(h+1).padStart(2,"0")} DE ${String(n.length).padStart(2,"0")}`,{x:.6,y:.2,w:8.8,h:.25,fontSize:8.5,bold:!0,color:y.pptSubtext,fontFace:"Arial"}),R==="title")Ee&&O.addText(Ee,{x:.8,y:1.35,w:8.4,h:.35,fontSize:11,bold:!0,color:y.pptAccent,align:"center",fontFace:"Arial"}),O.addText(je,{x:.8,y:1.8,w:8.4,h:1.6,fontSize:30,bold:!0,color:y.pptText,align:"center",valign:"middle",fontFace:"Arial"}),(ye||((z=x.bullets)==null?void 0:z.length)>0)&&O.addText(ye||B(x.bullets[0]||""),{x:1.2,y:3.55,w:7.6,h:.9,fontSize:14,color:y.pptSubtext,align:"center",fontFace:"Arial"});else{Ee&&O.addText(Ee,{x:.6,y:.5,w:8.8,h:.25,fontSize:9.5,bold:!0,color:y.pptAccent,fontFace:"Arial"}),O.addText(je,{x:.6,y:Ee?.75:.55,w:8.8,h:.75,fontSize:20,bold:!0,color:y.pptText,valign:"top",fontFace:"Arial"}),ye&&O.addText(ye,{x:.6,y:1.48,w:8.8,h:.32,fontSize:11,color:y.pptSubtext,fontFace:"Arial"});const U=ye?1.9:1.6;if(R==="kpi-grid"){const ne=(x.kpis&&x.kpis.length>0?x.kpis:x.bullets.slice(0,4).map((J,Ce)=>({label:`Indicador ${Ce+1}`,value:`${90+Ce*2}%`,delta:"Verificado",description:B(J)}))).slice(0,4),ue=(ne.length<=2,2),oe=4.25,Ne=ne.length<=2?2.5:1.35;ne.forEach((J,Ce)=>{const _e=Ce%ue,We=Math.floor(Ce/ue),Ge=.6+_e*(oe+.3),Je=U+We*(Ne+.22);O.addShape(d.ShapeType.roundRect,{x:Ge,y:Je,w:oe,h:Ne,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),O.addText(B(J.value),{x:Ge+.2,y:Je+.12,w:2.3,h:.5,fontSize:22,bold:!0,color:y.pptAccent,fontFace:"Arial"}),J.delta&&O.addText(B(J.delta),{x:Ge+2.4,y:Je+.18,w:1.65,h:.32,fontSize:9,bold:!0,color:y.pptSubtext,align:"right",fontFace:"Arial"}),O.addText(B(J.label),{x:Ge+.2,y:Je+.62,w:oe-.4,h:.3,fontSize:11,bold:!0,color:y.pptText,fontFace:"Arial"}),J.description&&O.addText(B(J.description),{x:Ge+.2,y:Je+.9,w:oe-.4,h:.38,fontSize:9,color:y.pptSubtext,fontFace:"Arial"})})}else if(R==="columns"){const Y=x.columns&&x.columns.length>0?x.columns:[{title:"Situación Identificada",badge:"Diagnóstico",items:x.bullets.slice(0,Math.ceil(x.bullets.length/2))},{title:"Plan de Control SST",badge:"Intervención",items:x.bullets.slice(Math.ceil(x.bullets.length/2))}],ne=Math.min(Y.length,3),ue=(8.8-(ne-1)*.3)/ne;Y.slice(0,ne).forEach((oe,Ne)=>{const J=.6+Ne*(ue+.3);O.addShape(d.ShapeType.roundRect,{x:J,y:U,w:ue,h:2.9,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),O.addText(B(oe.title),{x:J+.2,y:U+.15,w:ue-.4,h:.4,fontSize:13,bold:!0,color:y.pptAccent,fontFace:"Arial"});const Ce=(oe.items||[]).map(_e=>({text:B(_e),options:{bullet:!0,breakLine:!0,fontSize:10.5,color:y.pptText}}));Ce.length>0&&O.addText(Ce,{x:J+.2,y:U+.65,w:ue-.4,h:2.1,valign:"top",fontFace:"Arial",paraSpaceAfter:6})})}else if(R==="timeline"){const Y=x.steps&&x.steps.length>0?x.steps:x.bullets.slice(0,4).map((oe,Ne)=>({phase:`FASE 0${Ne+1}`,title:B(oe).slice(0,42),detail:B(oe)})),ne=Math.min(Y.length,4),ue=(8.8-(ne-1)*.2)/ne;Y.slice(0,ne).forEach((oe,Ne)=>{const J=.6+Ne*(ue+.2);O.addShape(d.ShapeType.roundRect,{x:J,y:U,w:ue,h:2.85,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),O.addText(B(oe.phase||`PASO ${Ne+1}`),{x:J+.15,y:U+.15,w:ue-.3,h:.3,fontSize:9,bold:!0,color:y.pptAccent,fontFace:"Arial"}),O.addText(B(oe.title),{x:J+.15,y:U+.5,w:ue-.3,h:.65,fontSize:11.5,bold:!0,color:y.pptText,fontFace:"Arial"}),O.addText(B(oe.detail),{x:J+.15,y:U+1.2,w:ue-.3,h:1.5,fontSize:9.5,color:y.pptSubtext,valign:"top",fontFace:"Arial"})})}else if(R==="table"&&x.tableHtml){const ne=new DOMParser().parseFromString(x.tableHtml,"text/html"),oe=Array.from(ne.querySelectorAll("tr")).map((Ne,J)=>Array.from(Ne.querySelectorAll("th, td")).map(_e=>({text:B(_e.textContent||""),options:{bold:J===0||_e.tagName.toLowerCase()==="th",fill:J===0?y.pptAccent:y.pptCardBg,color:J===0?"0E1300":y.pptText,fontSize:9.5,margin:[4,6,4,6]}}))).filter(Ne=>Ne.length>0);oe.length>0&&O.addTable(oe,{x:.6,y:U,w:8.8,border:{type:"solid",pt:.75,color:y.pptCardBorder},fontFace:"Arial"})}else if(R==="chart"&&((V=x.chartConfig)!=null&&V.data)&&x.chartConfig.data.length>0){const Y=x.chartConfig.data,ne=[[{text:"Categoría / Indicador",options:{bold:!0,fill:y.pptAccent,color:"0E1300",fontSize:10}},{text:"Valor Medido",options:{bold:!0,fill:y.pptAccent,color:"0E1300",fontSize:10}}],...Y.map(oe=>[{text:B(oe.label),options:{fill:y.pptCardBg,color:y.pptText,fontSize:10}},{text:String(oe.val),options:{bold:!0,fill:y.pptCardBg,color:y.pptAccent,fontSize:10}}])];O.addTable(ne,{x:.6,y:U,w:4.3,border:{type:"solid",pt:.75,color:y.pptCardBorder},fontFace:"Arial"});const ue=x.bullets.map(oe=>({text:B(oe),options:{bullet:!0,breakLine:!0,fontSize:11,color:y.pptText}}));ue.length>0&&O.addText(ue,{x:5.2,y:U,w:4.2,h:2.7,valign:"top",fontFace:"Arial",paraSpaceAfter:8})}else if(R==="quote")O.addShape(d.ShapeType.roundRect,{x:.6,y:U,w:8.8,h:2.8,fill:{color:y.pptCardBg},line:{color:y.pptAccent,width:1.5},rectRadius:.08}),O.addText(`“${B(x.quote||x.bullets[0]||x.title)}”`,{x:.9,y:U+.25,w:8.2,h:1.6,fontSize:15,italic:!0,bold:!0,color:y.pptText,valign:"middle",fontFace:"Arial"}),x.citation&&O.addText(`— ${B(x.citation)}`,{x:.9,y:U+2,w:8.2,h:.5,fontSize:11,bold:!0,color:y.pptAccent,fontFace:"Arial"});else{const Y=x.bullets.map(ne=>({text:B(ne),options:{bullet:!0,breakLine:!0,fontSize:13,color:y.pptText}}));O.addShape(d.ShapeType.roundRect,{x:.6,y:U,w:8.8,h:2.85,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),Y.length>0&&O.addText(Y,{x:.85,y:U+.2,w:8.3,h:2.45,valign:"top",fontFace:"Arial",paraSpaceAfter:10})}}u&&(O.addShape(d.ShapeType.roundRect,{x:.6,y:4.92,w:8.8,h:.45,fill:{color:y.pptCardBg},line:{color:y.pptAccent,width:.75},rectRadius:.05}),O.addText(`CONCLUSIÓN CLAVE: ${u}`,{x:.8,y:4.95,w:8.4,h:.38,fontSize:9.5,bold:!0,color:y.pptAccent,valign:"middle",fontFace:"Arial"})),x.speakerNotes&&O.addNotes(B(x.speakerNotes))});const i=(r||"Presentacion_Ejecutiva_WAPPY").replace(/[/\\?%*:|"<>]/g,"_").trim();await d.writeFile({fileName:`${i}.pptx`})}catch(t){console.error("Error generating PPTX:",t)}finally{D(!1)}}},Qe=()=>{const t=n.map((i,x)=>{var Ee,u;const h=Ue[i.theme||"wappy-dark"]||Ue["wappy-dark"],y=B(i.kicker||""),O=B(i.subtitle||""),je=B(i.takeaway||"");let ye="";return i.layout==="kpi-grid"?ye=`<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:20px;">
            ${(i.kpis&&i.kpis.length>0?i.kpis:i.bullets.slice(0,4).map((z,V)=>({label:`Indicador ${V+1}`,value:`${92+V}%`,delta:"Verificado",description:B(z)}))).map(z=>`<div style="background:#${h.pptCardBg}; border:1px solid #${h.pptCardBorder}; border-radius:16px; padding:20px;">
                <div style="font-size:34px; font-weight:800; color:#${h.pptAccent};">${B(z.value)}</div>
                <div style="font-size:16px; font-weight:700; margin-top:6px;">${B(z.label)}</div>
                <div style="font-size:13px; opacity:0.8; margin-top:4px;">${B(z.description||z.delta||"")}</div>
              </div>`).join("")}
          </div>`:i.layout==="columns"&&((Ee=i.columns)!=null&&Ee.length)?ye=`<div style="display:grid; grid-template-columns:repeat(${Math.min(i.columns.length,3)},1fr); gap:20px; margin-top:20px;">
            ${i.columns.map(R=>`<div style="background:#${h.pptCardBg}; border:1px solid #${h.pptCardBorder}; border-radius:16px; padding:20px;">
                <h3 style="margin:0 0 12px 0; color:#${h.pptAccent}; font-size:18px;">${B(R.title)}</h3>
                <ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.6;">
                  ${(R.items||[]).map(z=>`<li>${B(z)}</li>`).join("")}
                </ul>
              </div>`).join("")}
          </div>`:i.layout==="timeline"&&((u=i.steps)!=null&&u.length)?ye=`<div style="display:grid; grid-template-columns:repeat(${Math.min(i.steps.length,4)},1fr); gap:14px; margin-top:20px;">
            ${i.steps.map(R=>`<div style="background:#${h.pptCardBg}; border:1px solid #${h.pptCardBorder}; border-radius:16px; padding:18px;">
                <div style="font-size:11px; font-weight:800; color:#${h.pptAccent};">${B(R.phase)}</div>
                <div style="font-size:16px; font-weight:700; margin:8px 0;">${B(R.title)}</div>
                <div style="font-size:13px; opacity:0.85;">${B(R.detail)}</div>
              </div>`).join("")}
          </div>`:i.layout==="table"&&i.tableHtml?ye=`<div style="margin-top:20px; background:#${h.pptCardBg}; padding:16px; border-radius:14px;">${i.tableHtml}</div>`:i.layout==="quote"?ye=`<div style="margin-top:24px; background:#${h.pptCardBg}; border-left:5px solid #${h.pptAccent}; padding:28px; border-radius:16px;">
            <div style="font-size:24px; font-style:italic; font-weight:700; line-height:1.45;">“${B(i.quote||i.bullets[0]||"")}”</div>
            <div style="margin-top:14px; font-size:14px; font-weight:700; color:#${h.pptAccent};">${B(i.citation||"")}</div>
          </div>`:ye=`<ul style="font-size:20px; line-height:1.65; margin:20px 0 0 0; padding-left:24px;">
            ${i.bullets.map(R=>`<li style="margin-bottom:14px;">${R}</li>`).join("")}
          </ul>`,`
          <div class="slide-page" style="page-break-after:always; width:100%; height:100vh; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; padding:48px 60px; background:#${h.pptBg}; color:#${h.pptText};">
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.65; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
              <span>${B(r)}</span>
              <span>Lámina ${x+1} / ${n.length}</span>
            </div>
            <div style="my:auto;">
              ${y?`<div style="font-size:12px; font-weight:800; color:#${h.pptAccent}; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">${y}</div>`:""}
              <h1 style="font-size:34px; line-height:1.2; margin:0; font-family:'Outfit','Inter',sans-serif; font-weight:800;">${i.title}</h1>
              ${O?`<p style="font-size:16px; opacity:0.8; margin:8px 0 0 0;">${O}</p>`:""}
              ${ye}
            </div>
            <div style="border-top:1px solid rgba(148,163,184,0.25); padding-top:12px; display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#${h.pptAccent}; font-weight:700;">${je?`Síntesis: ${je}`:"WAPPY IA · Suite Ejecutiva SG-SST"}</span>
              <span style="opacity:0.6;">Formato 16:9</span>
            </div>
          </div>
        `}).join(""),s=`<!DOCTYPE html><html><head><title>${B(r)}</title><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet"><style>body{margin:0;padding:0;font-family:'Inter',sans-serif;}@media print{.slide-page{height:100vh;page-break-after:always!important;}@page{size:landscape;margin:0;}}</style></head><body>${t}<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body></html>`,d=window.open("","_blank");d&&(d.document.open(),d.document.write(s),d.document.close())};l.useEffect(()=>{g&&g(qe)},[g,n,r]);const S=(t,s=!1)=>{var Ne;let d=Array.isArray(t==null?void 0:t.data)?t.data:[];if(d.length===0&&Array.isArray(t==null?void 0:t.labels)&&Array.isArray(t==null?void 0:t.datasets)&&((Ne=t.datasets[0])!=null&&Ne.data)&&(d=t.labels.map((J,Ce)=>({label:String(J),val:Number(t.datasets[0].data[Ce]||0)}))),!t||d.length===0)return e.jsx("div",{className:"flex flex-col items-center justify-center h-44 border border-white/10 rounded-xl bg-black/20 text-white/50 text-xs",children:e.jsx("span",{children:"No hay datos de gráfico configurados."})});const i=t.type==="doughnut"?"pie":t.type||"bar",x=t.title||"",h=500,y=220,O=48,je=26,ye=36,Ee=36,u=h-O-je,R=y-ye-Ee,z=d.map(J=>Number(J.val)||0),V=Math.max(...z,1),U=Math.min(...z,0),Y=V-U||1,ne=s?"#334155":"#cbd5e1",ue=s?"#0f172a":"#ffffff";if(i==="pie"){let J=z.reduce((lt,tt)=>lt+tt,0);J===0&&(J=1);let Ce=0;const _e=h/2-70,We=y/2+10,Ge=65,Je=["#14b8a6","#10b981","#06b6d4","#f59e0b","#8b5cf6","#f43f5e"];return e.jsxs("svg",{viewBox:`0 0 ${h} ${y}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("text",{x:h/2,y:22,textAnchor:"middle",fill:ue,className:"text-xs font-bold",children:x}),e.jsx("g",{children:d.map((lt,tt)=>{const Xt=(Number(lt.val)||0)/J*360,Aa=_e+Ge*Math.cos((Ce-90)*Math.PI/180),Ea=We+Ge*Math.sin((Ce-90)*Math.PI/180);Ce+=Xt;const Ta=_e+Ge*Math.cos((Ce-90)*Math.PI/180),Ra=We+Ge*Math.sin((Ce-90)*Math.PI/180),za=Xt>180?1:0,Pa=`M ${_e} ${We} L ${Aa} ${Ea} A ${Ge} ${Ge} 0 ${za} 1 ${Ta} ${Ra} Z`,$a=Je[tt%Je.length];return e.jsx("path",{d:Pa,fill:$a,opacity:"0.9"},tt)})}),e.jsx("g",{transform:`translate(${h-175}, ${ye+6})`,children:d.slice(0,6).map((lt,tt)=>e.jsxs("g",{transform:`translate(0, ${tt*22})`,children:[e.jsx("rect",{width:11,height:11,rx:3,fill:Je[tt%Je.length]}),e.jsxs("text",{x:18,y:9.5,fill:ne,className:"text-[10px] font-semibold",children:[String(lt.label).slice(0,16)," (",lt.val,")"]})]},tt))})]})}const oe=J=>{const Ce=(J-U)/Y;return y-Ee-Ce*R};return e.jsxs("svg",{viewBox:`0 0 ${h} ${y}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"wappyBarGrad",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#14b8a6",stopOpacity:"0.95"}),e.jsx("stop",{offset:"100%",stopColor:"#0d9488",stopOpacity:"0.35"})]})}),e.jsx("text",{x:h/2,y:20,textAnchor:"middle",fill:ue,className:"text-xs font-bold",children:x}),[0,.5,1].map((J,Ce)=>{const _e=U+J*Y,We=oe(_e);return e.jsxs("g",{children:[e.jsx("line",{x1:O,y1:We,x2:h-je,y2:We,stroke:s?"#cbd5e1":"#334155",strokeWidth:"0.7",strokeDasharray:"4 4"}),e.jsx("text",{x:O-6,y:We+3,textAnchor:"end",fill:ne,className:"text-[9px] font-semibold",children:_e.toFixed(0)})]},Ce)}),d.map((J,Ce)=>{const _e=O+Ce/d.length*u+u/d.length*.15,We=u/d.length*.7,Ge=oe(Number(J.val)||0),Je=Math.max(y-Ee-Ge,2);return e.jsxs("g",{children:[e.jsx("rect",{x:_e,y:Ge,width:We,height:Je,rx:5,fill:"url(#wappyBarGrad)"}),e.jsx("text",{x:_e+We/2,y:Ge-5,textAnchor:"middle",fill:ue,className:"text-[9px] font-bold",children:J.val}),e.jsx("text",{x:_e+We/2,y:y-Ee+15,textAnchor:"middle",fill:ne,className:"text-[9px] font-semibold",children:String(J.label).slice(0,12)})]},Ce)})]})},C=(t,s,d)=>e.jsxs("div",{className:"space-y-1.5 mb-3 shrink-0",children:[(t.kicker||!d)&&e.jsx("div",{className:"flex items-center gap-2",children:e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${s.accentBg}`,children:[e.jsx(Wa,{className:"h-3 w-3 shrink-0"}),d?e.jsx("span",{children:t.kicker||"GESTIÓN ESTRATÉGICA SG-SST"}):e.jsx("input",{type:"text",value:B(t.kicker||""),onChange:i=>_(c,{kicker:i.target.value}),placeholder:"CATEGORÍA / NORMA (EJ. DECRETO 1072)",className:"bg-transparent border-none outline-none text-[10px] font-extrabold uppercase tracking-wider w-56 placeholder:opacity-50"})]})}),d?e.jsx("h2",{className:`text-2xl md:text-4xl font-extrabold tracking-tight leading-tight ${s.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(Nt,{value:t.title,onChange:i=>_(c,{title:i}),className:`w-full bg-transparent border-none outline-none font-extrabold text-lg sm:text-2xl md:text-3xl leading-tight ${s.text}`,placeholder:"Escribe el titular ejecutivo de la diapositiva...",tagName:"h2"},`title-${c}`),(t.subtitle||!d)&&e.jsx("div",{children:d?t.subtitle&&e.jsx("p",{className:`text-sm md:text-lg ${s.subtext}`,children:t.subtitle}):e.jsx("input",{type:"text",value:B(t.subtitle||""),onChange:i=>_(c,{subtitle:i.target.value}),placeholder:"Añadir subtítulo o contexto ejecutivo (opcional)...",className:`w-full bg-transparent border-none outline-none text-xs sm:text-sm ${s.subtext} placeholder:opacity-40`})})]}),xe=(t,s=!1)=>{const d=t.layout||"bullets",i=Ue[t.theme||"wappy-dark"]||Ue["wappy-dark"];switch(d){case"title":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center items-center text-center my-auto px-4 py-2 space-y-4",children:[e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${i.accentBg}`,children:[e.jsx(Fe,{className:"h-3.5 w-3.5"}),t.kicker||"SISTEMA DE GESTIÓN SG-SST · WAPPY IA"]}),s?e.jsx("h1",{className:`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl ${i.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(Nt,{value:t.title,onChange:x=>_(c,{title:x}),className:`w-full bg-transparent border-none outline-none font-extrabold text-2xl sm:text-4xl text-center leading-tight ${i.text}`,placeholder:"Título de Portada Ejecutiva...",tagName:"h1"},`title-cover-${c}`),e.jsx("p",{className:`text-xs sm:text-base max-w-2xl font-medium ${i.subtext}`,children:t.subtitle||B(t.bullets[0]||"")}),e.jsx("div",{className:"h-1 w-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-lime-400 rounded-full opacity-90"})]});case"kpi-grid":{const x=t.kpis&&t.kpis.length>0?t.kpis:t.bullets.slice(0,4).map((h,y)=>{var ye,Ee;const O=B(h),je=O.split(":");return{label:((ye=je[0])==null?void 0:ye.slice(0,28))||`Indicador Clave 0${y+1}`,value:((Ee=je[1])==null?void 0:Ee.trim().slice(0,12))||`${92+y*2}%`,delta:"Meta cumplida",trend:"up",description:O}});return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),e.jsx("div",{className:"grid grid-cols-2 gap-2.5 sm:gap-3.5 my-auto",children:x.slice(0,4).map((h,y)=>e.jsxs("div",{className:`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between backdrop-blur-md transition-all ${i.cardBg}`,children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("span",{className:`text-xl sm:text-3xl font-black tracking-tight ${i.accent}`,children:h.value}),h.delta&&e.jsxs("span",{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border ${i.accentBg}`,children:[h.trend==="down"?e.jsx(qa,{className:"h-3 w-3"}):e.jsx(ja,{className:"h-3 w-3"}),h.delta]})]}),e.jsxs("div",{className:"mt-2",children:[e.jsx("div",{className:`text-xs sm:text-sm font-extrabold ${i.text}`,children:h.label}),h.description&&e.jsx("p",{className:`text-[10px] sm:text-xs mt-0.5 line-clamp-2 ${i.subtext}`,children:h.description})]})]},y))})]})}case"columns":{const x=Math.ceil(t.bullets.length/2),h=t.columns&&t.columns.length>0?t.columns:[{title:"Diagnóstico / Estado Inicial",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,x)},{title:"Controles / Intervención SST",badge:"Plan de Acción",theme:"success",items:t.bullets.slice(x)}];return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),e.jsx("div",{className:`grid grid-cols-1 ${h.length>=3?"sm:grid-cols-3":"sm:grid-cols-2"} gap-3 my-auto`,children:h.slice(0,3).map((y,O)=>e.jsxs("div",{className:`rounded-2xl border p-3.5 sm:p-4 flex flex-col gap-2.5 backdrop-blur-md ${i.cardBg}`,children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 border-b border-current/10 pb-2",children:[e.jsx("h3",{className:`text-xs sm:text-base font-extrabold ${i.accent}`,children:y.title}),y.badge&&e.jsx("span",{className:`px-2 py-0.5 rounded-md text-[9px] font-bold border ${i.accentBg}`,children:y.badge})]}),e.jsx("ul",{className:`space-y-1.5 text-[11px] sm:text-xs font-medium ${i.text}`,children:(y.items||[]).map((je,ye)=>e.jsxs("li",{className:"flex items-start gap-2 leading-relaxed",children:[e.jsx(zt,{className:`h-3.5 w-3.5 mt-0.5 shrink-0 ${i.accent}`}),e.jsx("span",{children:B(je)})]},ye))})]},O))})]})}case"timeline":{const x=t.steps&&t.steps.length>0?t.steps:t.bullets.slice(0,4).map((h,y)=>({phase:`FASE 0${y+1}`,title:B(h).slice(0,36),detail:B(h)}));return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto",children:x.slice(0,4).map((h,y)=>e.jsxs("div",{className:`rounded-2xl border p-3 flex flex-col justify-between relative backdrop-blur-md ${i.cardBg}`,children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx("span",{className:`text-[9px] font-black uppercase tracking-wider ${i.accent}`,children:h.phase||`PASO 0${y+1}`}),e.jsxs("span",{className:"h-5 w-5 rounded-lg bg-teal-500/20 text-teal-400 text-[10px] font-black flex items-center justify-center",children:["0",y+1]})]}),e.jsx("h4",{className:`text-xs sm:text-sm font-extrabold leading-snug ${i.text}`,children:h.title})]}),e.jsx("p",{className:`text-[10px] sm:text-xs mt-2 leading-relaxed line-clamp-3 ${i.subtext}`,children:h.detail})]},y))})]})}case"quote":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center my-auto w-full",children:[C(t,i,s),e.jsxs("div",{className:`rounded-2xl border-l-4 p-5 sm:p-6 backdrop-blur-md space-y-3 ${i.cardBg} ${i.border}`,children:[e.jsx(Va,{className:`h-7 w-7 opacity-60 ${i.accent}`}),e.jsxs("blockquote",{className:`text-sm sm:text-xl font-bold italic leading-relaxed ${i.text}`,children:["“",B(t.quote||t.bullets[0]||t.title),"”"]}),e.jsxs("div",{className:`text-xs sm:text-sm font-extrabold ${i.accent}`,children:["— ",t.citation||"Decreto Único Reglamentario 1072 de 2015 · Ministerio del Trabajo"]})]})]});case"split":return e.jsxs("div",{className:"flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center my-auto w-full",children:[e.jsx("div",{onClick:()=>!s&&K(!0),className:`relative group rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 shadow-lg bg-black/25 flex items-center justify-center ${s?"":"cursor-pointer hover:border-teal-500/50 transition-colors"}`,children:t.imageUrl?e.jsx("img",{src:t.imageUrl,alt:"",className:"w-full h-full object-cover transition-all duration-500 group-hover:scale-105"}):e.jsxs("div",{className:"flex flex-col items-center justify-center text-white/40 text-xs gap-2 p-4 text-center",children:[e.jsx(Ot,{className:"h-8 w-8 text-teal-400/70"}),e.jsx("span",{children:"Haz clic para agregar evidencia fotográfica o imagen"})]})}),e.jsxs("div",{className:"space-y-3",children:[C(t,i,s),e.jsx("ul",{className:`space-y-2 text-xs sm:text-sm font-medium ${i.text}`,children:t.bullets.map((x,h)=>e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(zt,{className:`h-4 w-4 mt-0.5 shrink-0 ${i.accent}`}),e.jsx(Nt,{value:x,onChange:y=>De(h,y),className:"flex-1"},`split-b-${c}-${h}`)]},h))})]})]});case"media":return e.jsxs("div",{onClick:()=>!s&&K(!0),className:"relative flex-1 flex flex-col justify-end p-5 sm:p-8 bg-cover bg-center rounded-2xl overflow-hidden my-1",style:{backgroundImage:t.imageUrl?`url("${t.imageUrl}")`:'url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop")'},children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent pointer-events-none"}),e.jsxs("div",{onClick:x=>x.stopPropagation(),className:"relative z-10 w-full max-w-2xl bg-slate-950/65 border border-white/15 p-4 sm:p-6 rounded-2xl backdrop-blur-md space-y-2",children:[e.jsx("h2",{className:"text-lg sm:text-2xl font-extrabold text-white",children:B(t.title)}),e.jsx("ul",{className:"space-y-1 text-xs sm:text-sm text-slate-200 list-disc pl-4",children:t.bullets.slice(0,3).map((x,h)=>e.jsx("li",{children:B(x)},h))})]})]});case"table":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),t.tableHtml?e.jsx("div",{className:`max-h-[14rem] overflow-y-auto border rounded-xl p-3 scrollbar-thin ${i.cardBg}`,dangerouslySetInnerHTML:{__html:t.tableHtml}}):e.jsxs("div",{className:"flex flex-col items-center justify-center h-40 border border-dashed border-teal-500/30 rounded-xl bg-teal-500/5 text-xs text-center gap-2 p-4",children:[e.jsx(ba,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:i.text,children:'Usa "Conectar Lienzos" para importar un rango de Excel o aplica una plantilla SST.'})]})]});case"chart":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),e.jsx("div",{className:`flex-1 flex items-center justify-center p-3 rounded-2xl border min-h-[180px] ${i.cardBg}`,children:t.chartConfig?S(t.chartConfig,i.isLight):e.jsxs("div",{className:"flex flex-col items-center justify-center text-xs text-center gap-2 p-4",children:[e.jsx(ga,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:i.text,children:'Importa un gráfico desde Hoja de Cálculo con "Conectar Lienzos".'})]})})]});case"bullets":default:return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[C(t,i,s),e.jsx("div",{className:"grid grid-cols-1 gap-2 my-auto max-h-[14rem] overflow-y-auto pr-1 scrollbar-thin",children:t.bullets.map((x,h)=>e.jsxs("div",{className:`flex items-start gap-3 rounded-xl border p-2.5 sm:p-3 backdrop-blur-sm transition-all ${i.cardBg}`,children:[e.jsxs("span",{className:`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black border ${i.accentBg}`,children:["0",h+1]}),s?e.jsx("div",{className:`text-sm sm:text-lg font-medium leading-relaxed ${i.text}`,dangerouslySetInnerHTML:{__html:x}}):e.jsx(Nt,{value:x,onChange:y=>De(h,y),className:`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${i.text}`,placeholder:"Escribe el punto clave..."},`bullet-${c}-${h}`)]},h))})]})}},H=n[c]||n[0],o=H&&Ue[H.theme||"wappy-dark"]||Ue["wappy-dark"],p=t=>{const s=t.currentTarget.getBoundingClientRect(),d=t.clientX-s.left;d>s.width*.7?A(i=>Math.min(n.length-1,i+1)):d<s.width*.3&&A(i=>Math.max(0,i-1))},w=t=>{L&&Q({x:t.clientX,y:t.clientY})},j=()=>{if(!me||!H)return null;const t=Ue[H.theme||"wappy-dark"]||Ue["wappy-dark"];return Tt.createPortal(e.jsxs("div",{className:`fixed inset-0 z-[99999999] flex flex-col justify-between p-8 md:p-14 select-none ${L?"cursor-none":"cursor-default"} ${t.bg} animate-in fade-in duration-300`,onMouseMove:w,onClick:p,children:[L&&e.jsxs("div",{className:"pointer-events-none fixed z-[99999999] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out",style:{left:Z.x,top:Z.y},children:[e.jsx("div",{className:"absolute inset-0 w-8 h-8 -m-4 rounded-full bg-rose-500/30 blur-md animate-pulse"}),e.jsx("div",{className:"absolute inset-0 w-3 h-3 -m-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]"})]}),e.jsxs("div",{className:"flex items-center justify-between border-b border-current/10 pb-3 z-10",children:[e.jsxs("span",{className:`text-xs font-mono font-bold tracking-widest uppercase ${t.subtext}`,children:["Lámina ",String(c+1).padStart(2,"0")," / ",String(n.length).padStart(2,"0")]}),e.jsx("span",{className:`text-sm font-extrabold truncate max-w-md ${t.accent}`,children:r})]}),e.jsxs("div",{className:"my-auto max-w-6xl mx-auto w-full z-10 py-6 flex flex-col justify-center min-h-[65vh]",children:[xe(H,!0),H.takeaway&&e.jsxs("div",{className:`mt-6 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 ${t.accentBg}`,children:[e.jsx(Fe,{className:"h-4 w-4 shrink-0"}),e.jsxs("span",{children:["Síntesis Ejecutiva: ",B(H.takeaway)]})]})]}),e.jsxs("div",{className:"relative z-20 mx-auto bg-slate-900/85 border border-white/15 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between w-full max-w-xl",onClick:s=>s.stopPropagation(),children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>A(s=>Math.max(0,s-1)),disabled:c===0,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(ea,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-bold text-white px-2",children:[c+1," / ",n.length]}),e.jsx("button",{onClick:()=>A(s=>Math.min(n.length-1,s+1)),disabled:c===n.length-1,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(Bt,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{onClick:qe,className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30 cursor-pointer",children:[e.jsx(mt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Descargar"})]}),e.jsxs("button",{onClick:()=>P(!L),className:`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${L?"bg-rose-500/25 border-rose-500/50 text-rose-300":"bg-white/5 border-white/10 text-slate-300"}`,children:[e.jsx(Ua,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Láser"})]}),e.jsxs("button",{onClick:()=>{ee(!1),P(!1)},className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-xl cursor-pointer",children:[e.jsx(Ha,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})]}),document.body)},T=()=>!pe||!H?null:Tt.createPortal(e.jsx("div",{className:"fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200",children:e.jsxs("div",{className:"relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pb-3.5",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Ot,{className:"h-5 w-5 text-teal-400"}),e.jsx("h3",{className:"text-base font-extrabold text-white",children:"Agregar Evidencia o Imagen"})]}),e.jsx("button",{onClick:()=>{K(!1),ze()},className:"p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer",children:e.jsx(Ke,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"flex bg-slate-950/80 border border-white/10 p-1 rounded-2xl gap-1",children:["upload","camera","url"].map(t=>e.jsxs("button",{onClick:()=>b(t),className:`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${ae===t?"bg-teal-500/20 border border-teal-500/40 text-teal-300":"text-slate-400 hover:text-white"}`,children:[t==="upload"?e.jsx(ra,{className:"h-3.5 w-3.5"}):t==="camera"?e.jsx(Na,{className:"h-3.5 w-3.5"}):e.jsx(aa,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:t==="upload"?"Cargar PC":t==="camera"?"Cámara":"Enlace URL"})]},t))}),e.jsxs("div",{className:"min-h-[190px] flex flex-col justify-center",children:[ae==="upload"&&e.jsxs("div",{onDragOver:se,onDragLeave:ge,onDrop:E,className:`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl gap-3 text-center ${Se?"border-teal-400 bg-teal-500/10":"border-white/15"}`,children:[e.jsx(ra,{className:"h-7 w-7 text-teal-400"}),e.jsx("p",{className:"text-xs font-bold text-slate-200",children:"Arrastra una imagen aquí o selecciona desde tu equipo"}),e.jsxs("label",{className:"px-4 py-2 text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 rounded-xl cursor-pointer",children:["Seleccionar Imagen",e.jsx("input",{type:"file",accept:"image/*",onChange:fe,className:"hidden"})]})]}),ae==="camera"&&e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[he?e.jsx("div",{className:"text-xs text-rose-400 font-semibold p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full text-center",children:he}):e.jsx("div",{className:"relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10",children:e.jsx("video",{ref:Te,autoPlay:!0,playsInline:!0,className:"w-full h-full object-cover scale-x-[-1]"})}),e.jsx("button",{onClick:Me,disabled:!!he||!le,className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer disabled:opacity-40",children:"Capturar Fotografía"})]}),ae==="url"&&e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("input",{type:"text",value:G,onChange:t=>$(t.target.value),placeholder:"https://ejemplo.com/evidencia.png",className:"w-full h-10 px-3 text-xs bg-slate-950 border border-white/15 rounded-xl outline-none focus:border-teal-500 text-white"}),e.jsx("button",{onClick:()=>G.trim()&&ve(G.trim()),className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer",children:"Insertar Imagen"})]})]})]})}),document.body);return e.jsxs("div",{className:"flex h-full bg-surface-primary text-text-primary overflow-hidden relative",children:[f&&e.jsxs("div",{className:`hidden sm:flex flex-shrink-0 border-r border-border-medium bg-surface-secondary flex-col justify-between transition-all duration-300 ${I?"w-56 md:w-64":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"flex items-center justify-between px-1",children:[e.jsxs("span",{className:"text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider",children:["Láminas (",n.length,")"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{onClick:()=>Oe("up"),disabled:c===0,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Subir diapositiva",children:e.jsx(Kt,{className:"h-3.5 w-3.5"})}),e.jsx("button",{onClick:()=>Oe("down"),disabled:c===n.length-1,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Bajar diapositiva",children:e.jsx(Zt,{className:"h-3.5 w-3.5"})})]})]}),n.map((t,s)=>{const d=Ue[t.theme||"wappy-dark"]||Ue["wappy-dark"],i=s===c;return e.jsx("button",{onClick:()=>A(s),className:`w-full text-left rounded-xl border p-2 transition-all relative overflow-hidden group cursor-pointer ${i?"border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5 shadow-sm":"border-border-medium hover:border-teal-500/40 bg-surface-primary"}`,children:e.jsxs("div",{className:`h-16 w-full rounded-lg ${d.bg} p-2 flex flex-col justify-between overflow-hidden border border-white/10`,children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:`text-[8px] font-black uppercase ${d.accent}`,children:["0",s+1," · ",t.layout||"bullets"]})}),e.jsx("div",{className:`text-[9px] font-bold ${d.text} line-clamp-2 leading-tight`,children:B(t.title)})]})},s)})]}),e.jsxs("div",{className:"p-3 border-t border-border-medium bg-surface-primary flex items-center justify-center gap-2 shrink-0",children:[e.jsx(be,{onClick:we,icon:e.jsx(st,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(be,{onClick:F,icon:e.jsx(Rt,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(be,{onClick:Pe,disabled:n.length<=1,icon:e.jsx(ot,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 overflow-hidden",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-primary shrink-0 z-30",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1 bg-surface-secondary border border-border-medium rounded-xl p-0.5",children:[e.jsx("button",{onClick:()=>A(t=>Math.max(0,t-1)),disabled:c===0,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Diapositiva anterior",children:e.jsx(ea,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-extrabold px-2 text-text-primary select-none",children:[c+1," / ",n.length]}),e.jsx("button",{onClick:()=>A(t=>Math.min(n.length-1,t+1)),disabled:c===n.length-1,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Siguiente diapositiva",children:e.jsx(Bt,{className:"h-4 w-4"})})]}),e.jsx(be,{onClick:we,icon:e.jsx(st,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(be,{onClick:F,icon:e.jsx(Rt,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(be,{onClick:Pe,disabled:n.length<=1,icon:e.jsx(ot,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"}),e.jsxs("div",{className:"relative",children:[e.jsx(be,{onClick:()=>q(t=>!t),icon:e.jsx(xt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Plantillas Ejecutivas SG-SST",variant:"amber",size:"sm",isActive:X}),X&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Presentaciones Ejecutivas SG-SST"}),Ft.map(t=>e.jsxs("button",{onClick:()=>He(t.id),className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:t.name}),e.jsxs("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:[t.category," · ",t.slides.length," diapositivas ejecutivas"]})]},t.id))]})]}),e.jsx(be,{onClick:Ve,disabled:W,icon:e.jsx(Fe,{className:`h-4 w-4 ${W?"animate-spin":""}`}),label:"Transformar Diseño",title:"Transformar estructura visual automáticamente (KPIs / Columnas / PHVA / Cita)",variant:"purple",size:"sm"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(be,{onClick:()=>N(t=>!t),icon:e.jsx(ta,{className:"h-4 w-4"}),label:v?"Ocultar Diseño":"Diseño y Tema",title:"Abrir u ocultar el panel de estructuras, temas y notas",variant:"orange",size:"sm",isActive:v}),e.jsx(be,{onClick:()=>ie(!0),icon:e.jsx(aa,{className:"h-4 w-4"}),label:"Conectar Recursos",title:"Conectar con Hoja de Cálculo, Documento o Galería Google Flow",variant:"teal",size:"sm"}),e.jsx(be,{onClick:()=>ee(!0),icon:e.jsx(Ct,{className:"h-4 w-4"}),label:"Presentar",title:"Iniciar Presentación Pantalla Completa",variant:"cyan",size:"sm"}),e.jsx(be,{onClick:qe,disabled:M,icon:e.jsx(mt,{className:`h-4 w-4 ${M?"animate-bounce":""}`}),label:M?"Generando...":"Descargar Presentación",title:"Descargar presentación editable",variant:"green",size:"sm"}),e.jsx(be,{onClick:Qe,icon:e.jsx(Vt,{className:"h-4 w-4"}),label:"Imprimir",title:"Imprimir presentación en formato horizontal 16:9",variant:"neutral",size:"sm"})]})]}),H?e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 scrollbar-thin",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[!f&&e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin",children:n.map((t,s)=>{const d=s===c;return e.jsxs("button",{onClick:()=>A(s),className:`shrink-0 px-2.5 py-1 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${d?"bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 font-extrabold shadow-xs":"bg-surface-primary border-border-medium text-text-secondary hover:border-teal-500/30"}`,children:[e.jsxs("span",{className:"text-[10px] font-mono font-black opacity-75",children:["0",s+1]}),e.jsx("span",{className:"text-[11px] truncate max-w-[100px]",children:B(t.title)})]},s)})}),e.jsx("div",{className:"flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none ml-auto",children:ma.map(t=>{const s=(H.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>_(c,{layout:t.key}),className:`shrink-0 py-1 px-2 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${s?"border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium bg-surface-primary hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:`aspect-[16/9] w-full rounded-2xl shadow-xl border ${o.bg} ${o.border} p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all`,children:[e.jsx("div",{className:"absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"flex items-center justify-between z-10 border-b border-current/10 pb-2",children:[e.jsxs("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase ${o.subtext}`,children:["LÁMINA ",String(c+1).padStart(2,"0")," / ",String(n.length).padStart(2,"0")," · ",o.label]}),e.jsx("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase truncate max-w-[220px] ${o.subtext}`,children:r})]}),e.jsx("div",{className:"my-auto w-full flex-1 flex flex-col justify-center z-10 py-2 relative overflow-hidden",children:xe(H,!1)}),e.jsxs("div",{className:"flex items-center justify-between gap-2 z-10 border-t border-current/10 pt-2.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-1 min-w-0",children:[e.jsx(Fe,{className:`h-3.5 w-3.5 shrink-0 ${o.accent}`}),e.jsx("input",{type:"text",value:B(H.takeaway||""),onChange:t=>_(c,{takeaway:t.target.value}),placeholder:"Añadir conclusión ejecutiva inferior (Takeaway)...",className:`w-full bg-transparent border-none outline-none text-[10px] sm:text-xs font-bold truncate ${o.accent} placeholder:opacity-50`})]}),e.jsx("span",{className:`text-[10px] font-semibold shrink-0 opacity-60 ${o.subtext}`,children:"WAPPY Canvas 2.0"})]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-3 sm:p-4 shadow-sm space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5",children:[e.jsx(ta,{className:"h-4 w-4 text-teal-500"}),"Diseño Ejecutivo, Tema y Contenido de la Lámina"]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(be,{onClick:()=>K(!0),icon:e.jsx(Ot,{className:"h-4 w-4"}),label:"Evidencia / Imagen",title:"Agregar fotografía o evidencia visual a la diapositiva",variant:"blue",size:"sm"}),e.jsx(be,{onClick:ke,icon:e.jsx(st,{className:"h-4 w-4"}),label:"Añadir Punto",title:"Añadir nuevo punto clave a la diapositiva",variant:"emerald",size:"sm"}),e.jsx(be,{onClick:()=>N(!v),icon:v?e.jsx(Kt,{className:"h-4 w-4"}):e.jsx(Zt,{className:"h-4 w-4"}),label:v?"Contraer Panel":"Expandir Panel",title:v?"Contraer opciones avanzadas":"Expandir opciones de temas, puntos y notas",variant:"neutral",size:"sm",isActive:v})]})]}),v&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 border-t border-border-light",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Estructura Visual (10 Estructuras Ejecutivas)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-5 gap-1.5",children:ma.map(t=>{const s=(H.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>_(c,{layout:t.key}),className:`py-1.5 px-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer text-center ${s?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:"space-y-2 pt-1",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:"text-[11px] font-bold text-text-secondary uppercase",children:["Puntos Clave de la Diapositiva (",H.bullets.length,")"]})}),e.jsx("div",{className:"space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin",children:H.bullets.map((t,s)=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-[10px] font-mono font-bold text-teal-500 w-4",children:["0",s+1]}),e.jsx("input",{type:"text",value:B(t),onChange:d=>De(s,d.target.value),className:"flex-1 h-8 px-2.5 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 text-text-primary"}),e.jsx("button",{onClick:()=>Ae(s),disabled:H.bullets.length<=1,className:"p-1.5 text-text-tertiary hover:text-rose-500 disabled:opacity-30 cursor-pointer",title:"Eliminar punto",children:e.jsx(ot,{className:"h-3.5 w-3.5"})})]},s))})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Paleta y Atmósfera (8 Temas Corporativos)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:Object.keys(Ue).map(t=>{const s=Ue[t],d=(H.theme||"wappy-dark")===t;return e.jsxs("button",{onClick:()=>_(c,{theme:t}),className:`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${d?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,children:[e.jsx("div",{className:`h-3.5 w-3.5 rounded-md shrink-0 ${s.bg} border border-current/20`}),e.jsx("span",{className:"truncate",children:s.label})]},t)})})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("label",{className:"text-[11px] font-bold text-text-secondary uppercase flex items-center gap-1",children:[e.jsx(Ze,{className:"h-3 w-3 text-teal-500"}),"Notas del Orador (Guion de Exposición)"]}),e.jsx("textarea",{rows:2,value:B(H.speakerNotes||""),onChange:t=>_(c,{speakerNotes:t.target.value}),placeholder:"Escribe aquí tus apuntes de exposición para esta diapositiva...",className:"w-full p-2.5 text-xs bg-surface-secondary border border-border-medium rounded-xl outline-none focus:border-teal-500 text-text-primary resize-none"})]})]})]})]})]}):e.jsx("div",{className:"flex-1 flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-text-tertiary font-medium",children:"Cargando presentación..."})})]}),j(),T(),re&&e.jsx(Qt,{onClose:()=>ie(!1),onImportTable:Xe,onImportChart:et,onImportBullets:Ye,onImportMedia:t=>{ve(t.publicUrl)},activeFileType:"presentation",initialTab:"media"})]})},Mr=(a,m)=>{switch(a){case"Cpu":return e.jsx(oa,{className:`h-4 w-4 ${m}`});case"Layers":return e.jsx(xt,{className:`h-4 w-4 ${m}`});case"Plus":return e.jsx(st,{className:`h-4 w-4 ${m}`});case"Eye":return e.jsx(Yt,{className:`h-4 w-4 ${m}`});case"Sparkles":return e.jsx(Fe,{className:`h-4 w-4 ${m}`});default:return e.jsx(oa,{className:`h-4 w-4 ${m}`})}};function Ca(a){if(!a||typeof a!="string")return"";let m=a.trim();return m=m.replace(/<thinking>[\s\S]*?<\/thinking>/gi,"").trim(),m=m.replace(/^```(?:html|xml)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim(),m}function St(a,m=!1){if(!a)return"";let r=Ca(a);r=r.replace(/<style id="__wappy_standalone_design_system__">[\s\S]*?<\/style>\s*/gi,"").replace(/<script id="__wappy_modal_guard__">[\s\S]*?<\/script>\s*/gi,""),r=r.replace(/(<svg[^>]*>[\s\S]*?<path[^>]*?)fill="currentColor"/gi,'$1fill="rgba(255,255,255,0.25)"');const f=/<html[^>]*>/i.test(r),g=/<head[^>]*>/i.test(r),n=/bg-\[#0b0f19\]|dark|slate-900|slate-950|gradient-banner/i.test(r),k=`
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
`,c=`
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
    background-color: ${n?"#0b0f19":"#ffffff"} !important;
    color: ${n?"#f8fafc":"#1e293b"} !important;
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
    background-color: ${n?"rgba(15, 23, 42, 0.75)":"#ffffff"} !important;
    border: 1px solid ${n?"rgba(51, 65, 85, 0.7)":"#e2e8f0"} !important;
    border-radius: 1rem !important;
    padding: 1.25rem !important;
    margin-bottom: 1.25rem !important;
    color: ${n?"#f8fafc":"#1e293b"} !important;
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
    background-color: ${n?"rgba(30, 41, 59, 0.85)":"#f1f5f9"} !important;
    color: ${n?"#94a3b8":"#475569"} !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 0.75rem 1rem !important;
    border-bottom: 2px solid ${n?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
  }
  td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid ${n?"rgba(51, 65, 85, 0.4)":"#e2e8f0"} !important;
    color: ${n?"#e2e8f0":"#1e293b"} !important;
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
    border: 1px solid ${n?"#334155":"#cbd5e1"} !important;
    border-radius: 0.625rem !important;
    padding: 0.55rem 0.85rem !important;
    outline: none !important;
    background-color: ${n?"#1e293b":"#ffffff"} !important;
    color: ${n?"#f8fafc":"#0f172a"} !important;
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
    border: 1px solid ${n?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
    background-color: ${n?"#1e293b":"#f1f5f9"} !important;
    color: ${n?"#f8fafc":"#0f172a"} !important;
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
`,A=m?`
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
`,N=/<meta[^>]+name=["']viewport["']/i.test(r)?"":`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
`;return f?g?r=r.replace(/<head[^>]*>/i,I=>`${I}
${N}${A}${k}
${c}`):r=r.replace(/<html[^>]*>/i,I=>`${I}
<head>
${N}${A}${k}
${c}
</head>`):r=`<!DOCTYPE html>
<html lang="es" ${n?'class="dark"':""}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${A}
  ${k}
  ${c}
</head>
<body class="${n?"bg-[#0b0f19] text-slate-100":"bg-slate-50 text-slate-900"}">
  ${r}
</body>
</html>`,r}const _r=({initialContent:a,onUpdate:m,title:r,isMaximized:f=!1,onRegisterDownload:g})=>{const{user:n}=gt(),k=(n==null?void 0:n.role)==="ADMIN"||(n==null?void 0:n.role)==="USER_PRO"||(n==null?void 0:n.role)==="USER_IPEVAR"||(n==null?void 0:n.role)==="IPEVAR",[c,A]=l.useState(""),[v,N]=l.useState(f?"split":"preview"),[I,de]=l.useState(!1),[X,q]=l.useState(0),M=l.useRef(null),D=l.useRef(null),W=l.useRef(null),[ce,me]=qt(ft.canvasMaximized),[ee,L]=l.useState(!1),[P,Z]=l.useState(!1),Q=b=>{const G=c||"";let $="";/<\/body>/i.test(G)?$=G.replace(/<\/body>/i,`
${b}
</body>`):$=`${G}
${b}`,A($),m($),q(he=>he+1)};l.useEffect(()=>{const b=()=>{document.fullscreenElement||L(!1)};return document.addEventListener("fullscreenchange",b),document.addEventListener("webkitfullscreenchange",b),()=>{document.removeEventListener("fullscreenchange",b),document.removeEventListener("webkitfullscreenchange",b)}},[]),l.useEffect(()=>{const b=G=>{G.key==="Escape"&&ee&&L(!1)};return window.addEventListener("keydown",b),()=>window.removeEventListener("keydown",b)},[ee]);const re=async()=>{const b=!ee;L(b),b&&me(!0);const G=W.current||D.current;if(b)try{G!=null&&G.requestFullscreen?await G.requestFullscreen():G.webkitRequestFullscreen&&await G.webkitRequestFullscreen()}catch{}else try{document.fullscreenElement&&(document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen())}catch{}};l.useEffect(()=>{const b=()=>{const G=window.innerWidth<640;(!f||G)&&v==="split"&&N("preview")};return b(),window.addEventListener("resize",b),()=>window.removeEventListener("resize",b)},[f,v]),l.useEffect(()=>{A(a?Ca(a):`<!DOCTYPE html>
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
</html>`)},[a]);const ie=b=>{const G=b.target.value;A(G),m(G)},pe=l.useCallback(async()=>{try{const b=c||a||"";if(!b)return;const G=St(b,!0),$=(r||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),he=$.endsWith(".html")?$:`${$}.html`,te=new Blob([G],{type:"text/html;charset=utf-8"});if(typeof navigator<"u"&&navigator.canShare&&typeof File<"u")try{const le=new File([te],he,{type:"text/html"});if(navigator.canShare({files:[le]})){await navigator.share({files:[le],title:r||"Aplicativo SST"});return}}catch(le){if((le==null?void 0:le.name)==="AbortError")return;console.warn("Native share failed, falling back to saveAs:",le)}Jt.saveAs(te,he)}catch(b){console.error("Error al descargar HTML:",b);try{const $=St(c||a||"",!0),he=(r||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),te=he.endsWith(".html")?he:`${he}.html`,le=new Blob([$],{type:"text/html;charset=utf-8"}),Ie=URL.createObjectURL(le),Se=document.createElement("a");Se.href=Ie,Se.download=te,Se.target="_blank",document.body.appendChild(Se),Se.click(),setTimeout(()=>{try{document.body.removeChild(Se),URL.revokeObjectURL(Ie)}catch{}},5e3)}catch(G){console.error("Fallback download failed:",G)}}},[c,a,r]),K=()=>{const b=St(c,!0),G=new Blob([b],{type:"text/html;charset=utf-8"}),$=URL.createObjectURL(G);window.open($,"_blank")},ae=fa.useMemo(()=>St(c),[c]);return l.useEffect(()=>{g&&g(pe)},[g,c,r]),e.jsxs("div",{ref:D,className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[I&&e.jsx("div",{className:`${f?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>de(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${f?"sm:relative sm:z-0":"shadow-2xl"} ${I?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(xt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Aplicativos SST"})]}),e.jsx("button",{onClick:()=>de(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-1 flex items-center gap-1",children:[e.jsx(Fe,{className:"h-3 w-3 text-amber-500"}),"Simuladores y Calculadoras SST"]}),e.jsx("div",{className:"space-y-2.5",children:kr.map(b=>e.jsxs("button",{onClick:()=>{if(!k){alert("Este aplicativo premium es exclusivo para usuarios Pro de Wappy. Por favor actualice su suscripción.");return}c&&c.trim()!==""&&!c.includes("Prototipo de Código WAPPY")&&!c.includes("Prototipo Interactivo WAPPY")&&!window.confirm(`¿Deseas reemplazar el código actual por el aplicativo "${b.title}"? Se perderán las modificaciones no guardadas.`)||(A(b.code),m(b.code),f||de(!1))},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:Mr(b.iconType,b.color)}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:b.title}),k?e.jsx("span",{className:"text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity",children:"+ Insertar"}):e.jsxs("span",{className:"flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0",children:[e.jsx(Ja,{className:"h-2 w-2"}),"PRO"]})]}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:b.description})]})]},b.id))})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-secondary flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(be,{onClick:()=>de(b=>!b),icon:e.jsx(xt,{className:"h-4 w-4"}),label:"Biblioteca SST",title:"Abrir simuladores, calculadoras y componentes interactivos SST",variant:"amber",size:"sm",isActive:I}),e.jsxs("div",{className:"flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-xs",children:[f&&e.jsxs("button",{onClick:()=>N("split"),className:`hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${v==="split"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(Ya,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Dividido"})]}),e.jsxs("button",{onClick:()=>N("code"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${v==="code"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(At,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Código"})]}),e.jsxs("button",{onClick:()=>N("preview"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${v==="preview"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(Yt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Vista Previa"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(be,{onClick:()=>Z(!0),icon:e.jsx(Fe,{className:"h-4 w-4"}),label:"Conectar Recursos IA",title:"Insertar imágenes, videos o infografías de Google Flow y NotebookLM",variant:"purple",size:"sm"}),(v==="preview"||v==="split")&&e.jsxs(e.Fragment,{children:[e.jsx(be,{onClick:()=>q(b=>b+1),icon:e.jsx(Qa,{className:"h-4 w-4"}),label:"Recargar Vista",title:"Recargar vista previa interactiva",variant:"cyan",size:"sm"}),e.jsx(be,{onClick:K,icon:e.jsx(sa,{className:"h-4 w-4"}),label:"Abrir en Pestaña",title:"Abrir aplicativo en una pestaña nueva del navegador",variant:"fuchsia",size:"sm"}),e.jsx(be,{onClick:re,icon:ee?e.jsx(Ht,{className:"h-4 w-4"}):e.jsx(wa,{className:"h-4 w-4"}),label:ee?"Salir":"Pantalla Completa",title:ee?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"})]}),e.jsx(be,{onClick:pe,icon:e.jsx(mt,{className:"h-4 w-4"}),label:"Descargar Aplicativo",title:"Descargar aplicativo interactivo autocontenido",variant:"green",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden",children:[(v==="split"||v==="code")&&e.jsxs("div",{className:"flex-1 h-full relative border-r border-border-medium",children:[e.jsx("textarea",{ref:M,value:c,onChange:ie,className:"w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto scrollbar-thin",spellCheck:"false",placeholder:"Introduce tu código HTML/CSS/JS aquí..."}),e.jsxs("div",{className:"absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow select-none",children:[e.jsx(Xa,{className:"h-3 w-3 text-emerald-400 animate-pulse"}),e.jsx("span",{children:"Auto-refreshing"})]})]}),(v==="split"||v==="preview")&&e.jsx("div",{ref:W,className:cr("flex-1 h-full min-h-0 min-w-0 bg-white relative flex flex-col overflow-hidden",ee&&"invisible"),children:e.jsx("iframe",{title:"Canvas Live View",className:"w-full h-full flex-1 border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:ae},X)})]}),ee&&typeof document<"u"&&Tt.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[99999999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden animate-in fade-in duration-150",children:[e.jsxs("div",{className:"shrink-0 flex items-center justify-between px-3 py-2 bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-md pt-[max(0.5rem,env(safe-area-inset-top))]",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0 pr-2",children:[e.jsx("span",{className:"h-2 w-2 rounded-full bg-teal-400 shrink-0 animate-pulse"}),e.jsx("span",{className:"text-xs font-bold truncate text-slate-200 max-w-[160px] sm:max-w-[400px]",children:r||"Informe Técnico SST"}),e.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono hidden sm:inline-block",children:"Pantalla Completa"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsxs("button",{type:"button",onClick:K,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Abrir en pestaña nueva",children:[e.jsx(sa,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Pestaña"})]}),e.jsxs("button",{type:"button",onClick:pe,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Descargar documento HTML",children:[e.jsx(mt,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Descargar"})]}),e.jsxs("button",{type:"button",onClick:re,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-teal-500/30",title:"Salir de pantalla completa",children:[e.jsx(Ht,{className:"h-3.5 w-3.5"}),e.jsx("span",{className:"text-[11px]",children:"Salir"})]})]})]}),e.jsx("div",{className:"flex-1 w-full h-full min-h-0 bg-white relative",children:e.jsx("iframe",{title:"Canvas Live View Fullscreen",className:"w-full h-full border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:ae},`fullscreen-${X}`)})]}),document.body),P&&e.jsx(Qt,{onClose:()=>Z(!1),onImportTable:Q,onImportMedia:(b,G)=>Q(G),activeFileType:"html",initialTab:"media"})]})]})},Fr=(a,m,r)=>{const f=`<${r}`,g=`</${r}>`;let n=0,k=m;for(;k<a.length;)if(a.slice(k,k+f.length).toLowerCase()===f)n++,k+=f.length;else if(a.slice(k,k+g.length).toLowerCase()===g){if(n--,n===0)return k+g.length;k+=g.length}else k++;return-1},it=(a,m="")=>{const r=String(a||"").trim().replace(/^https?:\/\/(?:app\.)?wappy\.club(?=\/(?:images|api\/notebooklm\/download)\/)/i,""),f=r.toLowerCase(),g=String(m||"").replace(/<[^>]+>/g,"").replace(/"/g,"&quot;").trim();if(f.includes("_audio_")||f.includes("_podcast_")||f.includes("type=audio")||f.includes("type=podcast")||/\.(mp3|wav|m4a|ogg)(?:$|\?)/i.test(f))return`<div style="margin:22px 0;padding:18px 22px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;box-shadow:0 4px 14px rgba(13,148,136,0.08);"><div style="font-weight:700;color:#0f766e;font-size:14px;margin-bottom:10px;">🎙️ ${g||"Podcast / Audio Explicativo"}</div><audio controls preload="metadata" src="${r}" style="width:100%;display:block;"></audio><div style="margin-top:10px;font-size:12px;"><a href="${r}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488;font-weight:700;text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;if(f.includes("_vid_")||f.includes("_video_")||f.includes("type=video")||f.includes("type=cinematic_video")||/\.(mp4|webm|mov)(?:$|\?)/i.test(f))return`<figure style="margin:24px 0;text-align:center;background:#0f172a;padding:18px;border-radius:14px;border:1px solid #334155;box-shadow:0 8px 24px rgba(15,23,42,0.18);"><video controls playsinline preload="metadata" src="${r}" style="max-width:100%;max-height:480px;border-radius:10px;background:#000;display:block;margin:0 auto;"></video><figcaption style="margin-top:10px;font-size:12px;color:#cbd5e1;font-weight:600;">🎬 ${g||"Video Explicativo"} · <a href="${r}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf;text-decoration:underline;">⬇ Descargar Video MP4</a></figcaption></figure>`;if(f.includes("_quiz_")||f.includes("_flashcards_")||f.includes("_mindmap_")||f.includes("_table_")||f.includes("_slides_")||f.includes("_report_")||f.includes("type=quiz")||f.includes("type=flashcards")||f.includes("type=mind_map")||f.includes("type=data_table")||f.includes("type=slide_deck")||f.includes("type=report")||/\.(pdf|pptx|csv|md|markdown|json|docx|xlsx)(?:$|\?)/i.test(f))return`<div style="margin:18px 0;padding:16px 20px;background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0d9488;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="font-weight:700;color:#0f172a;font-size:13px;">📄 ${g||"Recurso / Documento Descargable"}</div><a href="${r}" download target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;background:#0d9488;color:#ffffff;font-weight:700;font-size:12px;border-radius:8px;text-decoration:none;">⬇ Descargar Recurso</a></div>`;const n=g||"Infografía / Recurso Visual Oficial";return`<figure style="margin:24px 0;text-align:center;background:#f8fafc;padding:16px;border-radius:14px;border:1px solid #e2e8f0;"><img src="${r}" alt="${n}" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,0.08);display:block;margin:0 auto;" /><figcaption style="margin-top:10px;font-size:12px;color:#475569;font-style:italic;font-weight:600;">${n}</figcaption></figure>`},Wt=a=>a&&a.replace(/<p>\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*<\/p>/gi,(m,r,f)=>it(f,r)).replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(m,r,f)=>it(f,r)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(m,r,f)=>it(f,r)).replace(/<p>\s*<em>\s*(<strong>[^<]+<\/strong>[\s\S]*?)<\/em>([^<*]+)\*([\s\S]*?)<\/p>/gi,(m,r,f,g)=>`<ul><li>${r}<em>${f.trim()}</em>${g}</li></ul>`).replace(/\*\*([^*\n<]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n<]+)\\*\\*","g"),"<strong>$1</strong>").replace(/<\/strong>\*/g,"</strong>").replace(/<\/em>\*/g,"</em>"),dt=a=>a?a.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(f,g,n)=>it(n,g)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(f,g,n)=>it(n,g)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)`,"gi"),'<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#004d99;text-decoration:underline;">$1</a>').split(/(<[^>]+>)/g).map(f=>!f||f.startsWith("<")?f:f.replace(/`([^`\n]+)`/g,'<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:0.9em;color:#0f172a;">$1</code>').replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/\*\*([^*\n]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*\\*","g"),"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*(?!\\*)","g"),"<em>$1</em>")).join(""):"",Br=a=>{const r=a.replace(/\r\n?/g,`
`).split(`
`),f=[];for(const g of r){const n=g.trim();if(!n||/^#{1,6}\s/.test(n)||n.startsWith("<")||n.startsWith("|")||n.startsWith(">")||n.startsWith("![")){f.push(g);continue}let k=g;k=k.replace(/(\d+\.\s+[A-ZÁÉÍÓÚÑ]{2,})([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g,`$1

$2`),k=k.replace(new RegExp('(?<!\\d)(?<!\\b(?:Art|Res|Dec|Cap|Sec|Num|Nro|Inc|Lit|Par|No)\\.)([a-záéíóúñ)\\]»”".,;:])(\\d+\\.\\s+[A-ZÁÉÍÓÚÑ]{2,}(?![A-Za-zÁÉÍÓÚÑáéíóúñ]))',"g"),(c,A,v,N,I)=>A==="."&&N>0&&/\d/.test(I[N-1])?c:`${A}

${v}`),f.push(k)}return f.join(`
`)},Gr=a=>{const m=[],r=D=>{const W=`@@CANVAS_MD_BLOCK_${m.length}@@`;return m.push(D),`

${W}

`};let f=a.replace(/\r\n?/g,`
`);const g=/((?:^|\n)\|[^\n]+\|[^\n]*\n\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n(?:\|[^\n]+\|[^\n]*(?:\n|$))+)/g;f=f.replace(g,D=>{const W=D.trim().split(`
`).map(Q=>Q.trim());if(W.length<2)return D;const ce=W[0].split("|").map(Q=>Q.trim()).filter((Q,re,ie)=>re>0&&re<ie.length-1),ee=W[1].split("|").map(Q=>Q.trim()).filter((Q,re,ie)=>re>0&&re<ie.length-1).map(Q=>Q.startsWith(":")&&Q.endsWith(":")?"center":Q.endsWith(":")?"right":Q.startsWith(":")?"left":""),L=ce.map((Q,re)=>`<th${ee[re]?` align="${ee[re]}"`:""} style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: ${ee[re]||"left"};">${dt(Q)}</th>`).join(""),P=W.slice(2).map(Q=>`<tr>${Q.split("|").map(pe=>pe.trim()).filter((pe,K,ae)=>K>0&&K<ae.length-1).map((pe,K)=>`<td${ee[K]?` align="${ee[K]}"`:""} style="border: 1px solid #ddd; padding: 8px; text-align: ${ee[K]||"left"};">${dt(pe)}</td>`).join("")}</tr>`).join(""),Z=`<div style="overflow-x:auto; margin: 15px 0;"><table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;"><thead><tr>${L}</tr></thead><tbody>${P}</tbody></table></div>`.replace(/\n/g,"");return r(Z)}),f=f.replace(/^[ \t]*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)[ \t]*$/gm,(D,W,ce)=>r(it(ce,W))).replace(/^[ \t]*\[([^\]]+)\]\(((?:https?:\/\/(?:app\.)?wappy\.club)?\/(?:images\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\s]+|api\/notebooklm\/download\/[^)\s]+))\)[ \t]*$/gim,(D,W,ce)=>r(it(ce,W))),f=Br(f);const n=f.split(`
`),k=[];let c=[],A=[],v=null,N=1,I=[];const de=()=>{if(c.length===0)return;const D=c.map(W=>dt(W)).join("<br/>");k.push(`<p>${D}</p>`),c=[]},X=()=>{if(A.length===0)return;const D=A.map(W=>dt(W)).join("<br/>");k.push(`<blockquote style="border-left: 3px solid #004d99; padding: 6px 12px; margin: 10px 0; background: #f8fafc; color: #334155; font-style: italic;">${D}</blockquote>`),A=[]},q=()=>{if(!v||I.length===0){v=null,I=[],N=1;return}const D=I.map(W=>`<li>${dt(W)}</li>`).join("");if(v==="ol"){const W=N!==1?` start="${N}"`:"";k.push(`<ol${W}>${D}</ol>`)}else k.push(`<ul>${D}</ul>`);v=null,I=[],N=1},M=()=>{de(),X(),q()};for(const D of n){const W=D.trim();if(!W){M();continue}const ce=W.match(/^@@CANVAS_MD_BLOCK_(\d+)@@$/);if(ce){M();const Z=Number(ce[1]);m[Z]!==void 0&&k.push(m[Z]);continue}if(/^(?:---+|\*\*\*+|___+)$/.test(W)){M(),k.push("<hr/>");continue}const me=W.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);if(me){M();const Z=me[1].length,Q=dt(me[2].trim());k.push(`<h${Z}>${Q}</h${Z}>`);continue}const ee=D.match(/^\s*[-*•]\s+(.+)$/);if(ee){de(),X(),v!=="ul"&&(q(),v="ul"),I.push(ee[1].trim());continue}const L=D.match(/^\s*(\d+)\.\s+(.+)$/);if(L){de(),X();const Z=parseInt(L[1],10);v!=="ol"&&(q(),v="ol",N=Number.isFinite(Z)&&Z>0?Z:1),I.push(L[2].trim());continue}const P=D.match(/^\s*>\s?(.*)$/);if(P){de(),q(),A.push(P[1].trim());continue}if(/^<(?:div|table|figure|hr|h[1-6]|ul|ol|blockquote|section|article|header|footer|p)[\s>/]/i.test(W)){M(),k.push(W);continue}q(),X(),c.push(W)}return M(),Wt(k.join(`
`))};function Ur(a){if(typeof a!="string"||!a)return String(a??"");if(a.trim().startsWith("<")&&!a.includes("#")&&!a.includes("**")&&!a.includes("---"))return Wt(a);let m="",r=a,f="",g=0;for(;g<a.length;){const N=a.substring(g).search(/\S/);if(N===-1)break;const I=g+N,de=a.substring(I);if(de.startsWith("<!--")){const X=de.indexOf("-->");if(X!==-1){g=I+X+3;continue}}else if(de.startsWith("<div")||de.startsWith("<table")||de.startsWith("<style")){const X=de.startsWith("<div")?"div":de.startsWith("<table")?"table":"style",q=Fr(a,I,X);if(q!==-1){g=q;continue}}break}g>0&&(m=a.substring(0,g),r=a.substring(g));const n=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div style="page-break-inside: avoid;','<div class="signature-placeholder'];let k=-1;for(const v of n){const N=r.lastIndexOf(v);N!==-1&&(k===-1||N<k)&&(k=N)}k!==-1&&(f=r.substring(k),r=r.substring(0,k));const A=r.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>|<figure[\s\S]*?<\/figure>)/i).map(v=>v?v.trim().startsWith("<")?v:Gr(v):"").join("");return Wt(m+A+f)}function Hr({isMaximized:a}){var Ie,Se,Be,Te,Le,$e,Re,ze,Me,ve,fe,se,ge;const{token:m,user:r}=gt(),{showToast:f}=Sa(),{ask:g}=ka(),[n,k]=l.useState(null),[c,A]=l.useState(null),[v,N]=l.useState(!0),[I,de]=l.useState(30),[X,q]=l.useState(null),[M,D]=l.useState(null),[W,ce]=l.useState(!1),[me,ee]=l.useState(null),[L,P]=l.useState(null),Z=a===void 0||a===!0,Q=async E=>{try{N(!0);const _=await nt.get("/api/sgsst/company-info",{headers:{Authorization:`Bearer ${m}`}});k(_.data);const we=await nt.get(`/api/sgsst/reporte-actos/estadisticas?dias=${E}`,{headers:{Authorization:`Bearer ${m}`}});A(we.data)}catch(_){console.error("Error fetching actes & conditions dashboard data:",_),f({message:"Error al cargar datos del panel de analítica.",status:"error"})}finally{N(!1)}};l.useEffect(()=>{m&&Q(I)},[m,I]);const re=l.useMemo(()=>{const E=(n==null?void 0:n._id)||(r==null?void 0:r.id)||(r==null?void 0:r._id);return E?`${window.location.origin}/sgsst-public/reportar/${E}`:""},[r,n]),ie=l.useMemo(()=>re?`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(re)}&color=ea580c&bgcolor=ffffff&margin=10`:"",[re]),pe=async E=>{try{ee(E);const _=await nt.get(`/api/sgsst/reporte-actos/inbox/${E}`,{headers:{Authorization:`Bearer ${m}`}});_.data.report?(D(_.data.report),ce(!0)):f({message:"No se encontraron los detalles del reporte.",status:"error"})}catch(_){console.error("Error fetching report details:",_),f({message:"Error al cargar los detalles del reporte.",status:"error"})}finally{ee(null)}},K=async E=>{try{let _=E;(!E.data||!E.data.descripcion)&&(ee(E.id),_=(await nt.get(`/api/sgsst/reporte-actos/inbox/${E.id}`,{headers:{Authorization:`Bearer ${m}`}})).data.report);const{trabajador:we,data:F,createdAt:Oe}=_,Pe=new Date(Oe||F.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"}),De=F!=null&&F.foto1?`/api/sgsst/reporte-actos/public/media/${E.id}/foto1`:null,ke=F!=null&&F.foto2?`/api/sgsst/reporte-actos/public/media/${E.id}/foto2`:null,Ae=F!=null&&F.foto3?`/api/sgsst/reporte-actos/public/media/${E.id}/foto3`:null,He=F!=null&&F.video?`/api/sgsst/reporte-actos/public/media/${E.id}/video`:null,Ve=`Por favor analiza el siguiente reporte de acto o condición insegura recibido en el buzón público y elabora el formato técnico en el Canvas:

- **Colaborador:** ${(we==null?void 0:we.nombre)||"Anónimo"} (${(we==null?void 0:we.cargo)||"No especificado"})
- **Cédula:** ${(we==null?void 0:we.cedula)||"N/A"}
- **Fecha y Hora:** ${Pe}
- **Ubicación:** ${(F==null?void 0:F.ubicacion)||"Sin ubicación"}
- **Descripción del Peligro/Hallazgo:** ${(F==null?void 0:F.descripcion)||"No proporcionada"}

### Evidencia Multimedia Adjunta:
${De?`![Evidencia 1](${De})
${F!=null&&F.foto1Desc?`*Detalle:* ${F.foto1Desc}`:""}
`:""}${ke?`![Evidencia 2](${ke})
${F!=null&&F.foto2Desc?`*Detalle:* ${F.foto2Desc}`:""}
`:""}${Ae?`![Evidencia 3](${Ae})
${F!=null&&F.foto3Desc?`*Detalle:* ${F.foto3Desc}`:""}
`:""}${He?`
<video src="${He}" controls style="max-width: 100%; border-radius: 8px; margin-top: 8px;"></video>
`:""}
Por favor, clasifícalo adecuadamente, identifica peligros según GTC 45, analiza las causas básicas e inmediatas, define controles siguiendo la jerarquía y genera el reporte técnico interactivo.`;g({text:Ve},{overrideFiles:[De&&{file_id:`${E.id}_foto1`,filepath:De,type:"image/png",filename:"foto1.png",height:512,width:512},ke&&{file_id:`${E.id}_foto2`,filepath:ke,type:"image/png",filename:"foto2.png",height:512,width:512},Ae&&{file_id:`${E.id}_foto3`,filepath:Ae,type:"image/png",filename:"foto3.png",height:512,width:512},He&&{file_id:`${E.id}_video`,filepath:He,type:"video/mp4",filename:"video.mp4"}].filter(Boolean)}),f({message:"Reporte enviado al chat con éxito para análisis.",status:"success"}),ce(!1)}catch(_){console.error("Error sending report to chat:",_),f({message:"Error al enviar el reporte al chat.",status:"error"})}finally{ee(null)}},ae=async E=>{try{q(E),(await nt.post("/api/sgsst/reporte-actos/inbox/mark-processed",{reportId:E},{headers:{Authorization:`Bearer ${m}`}})).data.success&&(f({message:"Reporte marcado como procesado con éxito.",status:"success"}),Q(I))}catch(_){console.error("Error marking report as processed:",_),f({message:"Error al actualizar el estado del reporte.",status:"error"})}finally{q(null)}},b=async E=>{if(window.confirm("¿Estás seguro de descartar este reporte? Se eliminará del buzón."))try{q(E),(await nt.post("/api/sgsst/reporte-actos/inbox/dismiss",{reportId:E},{headers:{Authorization:`Bearer ${m}`}})).data.success&&(f({message:"Reporte descartado correctamente.",status:"success"}),Q(I))}catch(_){console.error("Error dismissing report:",_),f({message:"Error al descartar el reporte.",status:"error"})}finally{q(null)}},G=()=>{var _;const E=window.open("","_blank");E&&(E.document.write(`
      <html>
        <head>
          <title>Portal de Reporte de Actos y Condiciones - ${(n==null?void 0:n.companyName)||"Wappy"}</title>
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
            <div class="logo-placeholder">${((_=n==null?void 0:n.companyName)==null?void 0:_.toUpperCase())||"MI EMPRESA"}</div>
            <h1>¿Detectaste un peligro?</h1>
            <h2>Reporte Público de Actos y Condiciones Inseguras</h2>
            <p class="desc">
              Tu seguridad es nuestro compromiso. Si observas un acto inseguro de un compañero, una herramienta dañada, cables expuestos o pisos resbalosos en nuestras instalaciones, repórtalo escaneando este código QR. Puedes adjuntar fotos y es totalmente confidencial. ¡Nos ayuda a prevenir accidentes de trabajo!
            </p>
            <div class="qr-wrapper">
              <img class="qr-img" src="${ie}" alt="QR code" />
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
    `),E.document.close())};if(v&&!c)return e.jsxs("div",{className:"min-h-[60vh] flex flex-col items-center justify-center text-center p-8 text-text-secondary animate-fadeIn",children:[e.jsx(ia,{className:"w-12 h-12 text-orange-500 animate-spin mb-4"}),e.jsx("h3",{className:"font-bold text-lg text-text-primary",children:"Cargando Analítica de Actos y Condiciones..."}),e.jsx("p",{className:"text-sm text-text-secondary mt-1",children:"Sincronizando reportes del buzón público"})]});const $={totalReportesBuzon:(c==null?void 0:c.totalReportesBuzon)??0,periodoDias:(c==null?void 0:c.periodoDias)??I,pendientes:(c==null?void 0:c.pendientes)??0,procesados:(c==null?void 0:c.procesados)??0,finalizadosPdf:(c==null?void 0:c.finalizadosPdf)??0,preliminarClasificacion:{actos:((Ie=c==null?void 0:c.preliminarClasificacion)==null?void 0:Ie.actos)??0,condiciones:((Se=c==null?void 0:c.preliminarClasificacion)==null?void 0:Se.condiciones)??0,mixto_no_clasificado:((Be=c==null?void 0:c.preliminarClasificacion)==null?void 0:Be.mixto_no_clasificado)??0},areasFrecuentes:Array.isArray(c==null?void 0:c.areasFrecuentes)?c.areasFrecuentes:[],reportesRecientes:Array.isArray(c==null?void 0:c.reportesRecientes)?c.reportesRecientes:[]},he=$.totalReportesBuzon>0?($.preliminarClasificacion.actos/$.totalReportesBuzon*100).toFixed(1):"0",te=$.totalReportesBuzon>0?($.preliminarClasificacion.condiciones/$.totalReportesBuzon*100).toFixed(1):"0",le=$.totalReportesBuzon>0?($.preliminarClasificacion.mixto_no_clasificado/$.totalReportesBuzon*100).toFixed(1):"0";return Z?e.jsxs("div",{className:"space-y-6 animate-fadeIn text-text-primary pb-6",children:[e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"lg:col-span-2 space-y-6",children:[e.jsxs("div",{className:"relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950 via-orange-900 to-amber-950 p-6 text-white shadow-md",children:[e.jsx("div",{className:"absolute inset-0 opacity-10",children:e.jsx("div",{className:"absolute top-0 right-0 w-80 h-80 rounded-full bg-orange-400 blur-3xl -mr-20 -mt-20"})}),e.jsxs("div",{className:"relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs font-bold text-orange-300 tracking-wider uppercase",children:[e.jsx(Fe,{className:"w-4 h-4"}),"Módulo de Gestión de Actos y Condiciones Inseguras"]}),e.jsx("h2",{className:"text-2xl font-black tracking-tight text-white",children:"Analítica Predictiva ACI"}),e.jsx("p",{className:"text-xs text-orange-100/80",children:"Estadísticas y gestión activa de reportes del portal de trabajadores."})]}),e.jsx("div",{className:"inline-flex bg-orange-950/50 border border-orange-700/50 rounded-xl p-1 gap-1 self-start sm:self-center",children:[7,30,90].map(E=>e.jsxs("button",{onClick:()=>de(E),className:`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${I===E?"bg-orange-600 text-white shadow-sm":"text-orange-200 hover:text-white hover:bg-orange-850/50"}`,children:[E," Días"]},E))})]})]}),e.jsxs("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-4",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(Ka,{className:"w-10 h-10 text-orange-500"})}),e.jsx("p",{className:"text-[10px] font-black text-text-secondary uppercase tracking-wider",children:"Reportes Buzón"}),e.jsx("h3",{className:"text-3xl font-black text-text-primary tracking-tight",children:$.totalReportesBuzon}),e.jsxs("p",{className:"text-[10px] text-text-secondary/70 font-semibold",children:["En los últimos ",I," días"]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(Za,{className:"w-10 h-10 text-amber-500"})}),e.jsx("p",{className:"text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider",children:"Pendientes"}),e.jsx("h3",{className:"text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight",children:$.pendientes}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-amber-500 h-full",style:{width:`${$.totalReportesBuzon>0?$.pendientes/$.totalReportesBuzon*100:0}%`}})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Por clasificar/gestionar"})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(zt,{className:"w-10 h-10 text-emerald-500"})}),e.jsx("p",{className:"text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider",children:"Procesados"}),e.jsx("h3",{className:"text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight",children:$.procesados}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-emerald-500 h-full",style:{width:`${$.totalReportesBuzon>0?$.procesados/$.totalReportesBuzon*100:0}%`}})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Revisados en sistema"})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-sm",children:[e.jsx("div",{className:"absolute top-0 right-0 p-3 opacity-10",children:e.jsx(Ze,{className:"w-10 h-10 text-blue-500"})}),e.jsx("p",{className:"text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider",children:"PDF Finalizados"}),e.jsx("h3",{className:"text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight",children:$.finalizadosPdf}),e.jsx("div",{className:"w-full bg-border-light dark:bg-gray-800 h-1.5 rounded-full overflow-hidden",children:e.jsx("div",{className:"bg-blue-500 h-full w-full"})}),e.jsx("p",{className:"text-[10px] text-text-secondary font-bold",children:"Documentos firmados"})]})]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1",children:e.jsx(la,{className:"w-6 h-6"})}),e.jsx("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider",children:"Buzón de Reportes QR"}),e.jsx("p",{className:"text-[11px] text-text-secondary px-4 leading-relaxed",children:"Imprime el cartel con el código QR y colócalo en carteleras de la empresa para recibir reportes de tus colaboradores."})]}),ie?e.jsx("div",{className:"bg-white p-4 rounded-2xl border border-border-light shadow-md my-4",children:e.jsx("img",{src:ie,alt:"QR Code",className:"w-36 h-36"})}):e.jsx("div",{className:"w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4",children:"Generando..."}),e.jsxs("button",{onClick:G,className:"w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all",children:[e.jsx(Vt,{className:"w-4 h-4"}),"Imprimir Cartel QR"]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"md:col-span-1 space-y-6",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(va,{className:"w-4 h-4 text-orange-500"}),"Tipología de Peligro (Preliminar)"]}),e.jsxs("div",{className:"space-y-4 pt-2",children:[e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Actos Inseguros"}),e.jsxs("span",{className:"text-orange-600 dark:text-orange-400 font-bold",children:[$.preliminarClasificacion.actos," (",he,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-orange-500 h-full rounded-full",style:{width:`${he}%`}})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Condiciones Inseguras"}),e.jsxs("span",{className:"text-amber-600 dark:text-amber-400 font-bold",children:[$.preliminarClasificacion.condiciones," (",te,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-amber-500 h-full rounded-full",style:{width:`${te}%`}})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between text-xs font-semibold",children:[e.jsx("span",{className:"text-text-primary",children:"Mixtos / Por definir"}),e.jsxs("span",{className:"text-purple-600 dark:text-purple-400 font-bold",children:[$.preliminarClasificacion.mixto_no_clasificado," (",le,"%)"]})]}),e.jsx("div",{className:"w-full bg-surface-secondary h-2 rounded-full overflow-hidden border border-border-light",children:e.jsx("div",{className:"bg-purple-500 h-full rounded-full",style:{width:`${le}%`}})})]})]}),e.jsx("p",{className:"text-[10px] text-text-secondary mt-2 leading-relaxed",children:"* Clasificación preliminar basada en palabras clave descriptivas. Llama al Asistente de ACI para elaborar el ATS final."})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(na,{className:"w-4 h-4 text-blue-500"}),"Ubicaciones más Reportadas"]}),$.areasFrecuentes.length>0?e.jsx("div",{className:"space-y-3 pt-2",children:$.areasFrecuentes.slice(0,6).map((E,_)=>{const we=$.totalReportesBuzon>0?(E.count/$.totalReportesBuzon*100).toFixed(0):"0";return e.jsxs("div",{className:"flex items-center justify-between text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"h-2 w-2 rounded-full bg-blue-500"}),e.jsx("span",{className:"font-semibold text-text-primary",children:E.name})]}),e.jsxs("span",{className:"font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md",children:[E.count," (",we,"%)"]})]},_)})}):e.jsx("div",{className:"text-center py-8 text-xs text-text-secondary",children:"No hay áreas registradas en el buzón."})]})]}),e.jsxs("div",{className:"md:col-span-2 bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm flex flex-col",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-border-light pb-3",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(pt,{className:"w-4 h-4 text-orange-500 animate-pulse"}),"Buzón de Reportes Públicos Recibidos"]}),e.jsxs("span",{className:"text-xs font-semibold text-text-secondary bg-surface-secondary px-2 py-1 rounded-md",children:[$.reportesRecientes.length," Registrados"]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto space-y-4 max-h-[500px] scrollbar-thin pr-1 pt-2",children:$.reportesRecientes.length>0?$.reportesRecientes.map(E=>e.jsxs("div",{className:`p-4 bg-surface-secondary border rounded-xl space-y-3 text-xs transition-all ${E.status==="processed"?"border-border-light opacity-80":"border-orange-500/20 shadow-sm hover:border-orange-500/40"}`,children:[e.jsxs("div",{className:"flex items-center justify-between text-[10px] text-text-secondary font-bold uppercase tracking-wider",children:[e.jsxs("span",{className:"flex items-center gap-1.5",children:[e.jsx(er,{className:"w-3.5 h-3.5 text-text-tertiary"}),new Date(E.fecha).toLocaleDateString("es-CO",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})]}),e.jsx("div",{className:"flex items-center gap-2",children:e.jsx("span",{className:`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${E.status==="processed"?"bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400":"bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"}`,children:E.status==="processed"?"Procesado":"Pendiente"})})]}),e.jsxs("div",{className:"space-y-1.5",children:[e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsxs("span",{className:"font-bold text-text-primary",children:["Colaborador: ",E.trabajador," (",E.cargo,")"]}),e.jsxs("span",{className:"text-[10px] text-text-secondary bg-surface-primary border border-border-light px-2 py-0.5 rounded-md font-semibold",children:["📍 ",E.ubicacion]})]}),e.jsx("p",{className:"text-text-primary leading-relaxed bg-surface-primary/50 p-2.5 rounded-lg border border-border-light/50",children:E.descripcion})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1 border-t border-border-light/50",children:[e.jsxs("div",{className:"flex gap-2",children:[E.hasFoto&&e.jsx("span",{className:"bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded-md",children:"📷 Con Foto"}),E.hasVideo&&e.jsx("span",{className:"bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 text-[9px] font-bold px-2 py-0.5 rounded-md",children:"🎥 Con Video"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{disabled:me!==null||X!==null,onClick:()=>pe(E.id),className:"bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/20 dark:hover:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[me===E.id?e.jsx(ia,{className:"w-3.5 h-3.5 animate-spin"}):e.jsx(Yt,{className:"w-3.5 h-3.5"}),"Abrir"]}),e.jsxs("button",{disabled:me!==null||X!==null,onClick:()=>K(E),className:"bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50 shadow-sm",children:[e.jsx(Fe,{className:"w-3.5 h-3.5"}),"Analizar"]}),E.status!=="processed"&&e.jsxs("button",{disabled:X!==null,onClick:()=>ae(E.id),className:"bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[e.jsx(rt,{className:"w-3.5 h-3.5"}),"Marcar Procesado"]}),e.jsxs("button",{disabled:X!==null,onClick:()=>b(E.id),className:"bg-red-100 hover:bg-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition-all disabled:opacity-50",children:[e.jsx(ot,{className:"w-3.5 h-3.5"}),"Descartar"]})]})]})]},E.id)):e.jsxs("div",{className:"text-center py-16 text-xs text-text-secondary h-full flex flex-col items-center justify-center space-y-2",children:[e.jsx(zt,{className:"w-8 h-8 text-emerald-500"}),e.jsx("p",{className:"font-bold text-text-primary",children:"¡Buzón al día!"}),e.jsx("p",{className:"text-[11px] text-text-secondary",children:"No hay reportes de trabajadores pendientes en este periodo."})]})})]})]}),W&&M&&e.jsx("div",{className:"fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn",children:e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-border-light bg-gradient-to-r from-orange-500/5 to-amber-500/5",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"p-2 bg-orange-100 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 rounded-xl",children:e.jsx(pt,{className:"w-5 h-5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-sm font-black text-text-primary uppercase tracking-wider",children:"Detalle del Reporte Recibido"}),e.jsxs("p",{className:"text-[10px] text-text-secondary font-bold uppercase tracking-wider mt-0.5",children:["📍 ",((Te=M.data)==null?void 0:Te.ubicacion)||"Ubicación General"]})]})]}),e.jsx("button",{onClick:()=>{ce(!1),D(null)},className:"p-2 rounded-xl text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-all",children:e.jsx(Ke,{className:"w-5 h-5"})})]}),e.jsxs("div",{className:"p-6 overflow-y-auto space-y-6 scrollbar-thin text-xs text-text-primary",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-secondary/50 border border-border-light/50 p-4 rounded-2xl",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Reportante"}),e.jsx("p",{className:"font-extrabold text-sm text-text-primary",children:((Le=M.trabajador)==null?void 0:Le.nombre)||"Anónimo"}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Cargo: ",e.jsx("span",{className:"font-semibold",children:(($e=M.trabajador)==null?void 0:$e.cargo)||"No especificado"})]}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Cédula: ",e.jsx("span",{className:"font-semibold",children:((Re=M.trabajador)==null?void 0:Re.cedula)||"N/A"})]})]}),e.jsxs("div",{className:"space-y-2 border-t md:border-t-0 md:border-l border-border-light/50 pt-2 md:pt-0 md:pl-4",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Detalles de Registro"}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Fecha y Hora: ",e.jsx("span",{className:"font-semibold",children:new Date(M.createdAt).toLocaleString("es-CO")})]}),e.jsxs("p",{className:"text-text-secondary text-[11px]",children:["Estado:",e.jsx("span",{className:`ml-1 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${M.status==="processed"?"bg-emerald-50 border-emerald-250 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400":"bg-amber-50 border-amber-250 text-amber-600 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400"}`,children:M.status==="processed"?"Procesado":"Pendiente"})]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Descripción del Peligro / Hallazgo"}),e.jsx("div",{className:"p-4 bg-orange-500/5 dark:bg-orange-500/10 border-l-4 border-orange-500 rounded-r-2xl leading-relaxed text-sm",children:((ze=M.data)==null?void 0:ze.descripcion)||"No se proporcionó descripción."})]}),(((Me=M.data)==null?void 0:Me.foto1)||((ve=M.data)==null?void 0:ve.foto2)||((fe=M.data)==null?void 0:fe.foto3)||((se=M.data)==null?void 0:se.video))&&e.jsxs("div",{className:"space-y-3 pt-2",children:[e.jsx("p",{className:"text-[10px] font-bold text-text-secondary uppercase tracking-wider",children:"Evidencia Multimedia Adjunta"}),e.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4",children:["foto1","foto2","foto3"].map((E,_)=>{var Oe,Pe;const we=(Oe=M.data)==null?void 0:Oe[E],F=((Pe=M.data)==null?void 0:Pe[`${E}Desc`])||"Sin descripción adicional";return we?e.jsxs("div",{className:"group relative border border-border-light rounded-2xl overflow-hidden bg-surface-secondary shadow-sm hover:shadow-md transition-all",children:[e.jsxs("div",{className:"aspect-square w-full cursor-zoom-in relative overflow-hidden bg-black flex items-center justify-center",onClick:()=>P(we),children:[e.jsx("img",{src:we,alt:`Evidencia ${_+1}`,className:"w-full h-full object-cover group-hover:scale-105 transition-all duration-300"}),e.jsx("div",{className:"absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold uppercase transition-all",children:"🔍 Agrandar"})]}),e.jsxs("div",{className:"p-2.5 text-[10px] text-text-secondary line-clamp-2",children:[e.jsxs("strong",{className:"text-text-primary block text-[11px] mb-0.5",children:["Imagen ",_+1]}),F]})]},E):null})}),((ge=M.data)==null?void 0:ge.video)&&e.jsxs("div",{className:"border border-border-light rounded-2xl p-4 bg-surface-secondary space-y-2",children:[e.jsxs("p",{className:"text-[11px] font-bold text-text-primary flex items-center gap-1.5",children:[e.jsx(Na,{className:"w-4 h-4 text-purple-500"}),"Video Evidencia Corto (Movimiento y Entorno)"]}),e.jsx("video",{src:M.data.video,controls:!0,className:"w-full rounded-xl border border-border-light shadow-inner max-h-[300px] bg-black"})]})]})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 p-6 border-t border-border-light bg-surface-secondary",children:[e.jsx("button",{onClick:()=>{ce(!1),D(null)},className:"bg-surface-primary hover:bg-surface-hover border border-border-medium text-text-primary font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm",children:"Cerrar"}),M.status!=="processed"&&e.jsxs("button",{disabled:X!==null,onClick:async()=>{await ae(M.id),D(E=>E?{...E,status:"processed"}:null)},className:"bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm",children:[e.jsx(rt,{className:"w-4 h-4"}),"Marcar Procesado"]}),e.jsxs("button",{disabled:me!==null,onClick:()=>K(M),className:"bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm",children:[e.jsx(Fe,{className:"w-4 h-4"}),"Analizar en Chat"]})]})]})}),L&&e.jsxs("div",{className:"fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn",onClick:()=>P(null),children:[e.jsx("button",{className:"absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all",onClick:()=>P(null),children:e.jsx(Ke,{className:"w-6 h-6"})}),e.jsx("img",{src:L,alt:"Evidencia Ampliada",className:"max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-fadeIn"})]})]}):e.jsxs("div",{className:"space-y-6 animate-fadeIn text-text-primary pb-6",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("div",{className:"inline-flex p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-2xl mb-1",children:e.jsx(la,{className:"w-6 h-6"})}),e.jsx("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider",children:"Buzón de Reportes QR"}),e.jsx("p",{className:"text-[11px] text-text-secondary px-4 leading-relaxed",children:"Imprime este código QR y colócalo en carteleras de la empresa para que los colaboradores envíen reportes desde sus celulares."})]}),ie?e.jsx("div",{className:"bg-white p-4 rounded-2xl border border-border-light shadow-md my-4",children:e.jsx("img",{src:ie,alt:"QR Code",className:"w-36 h-36"})}):e.jsx("div",{className:"w-36 h-36 rounded-2xl bg-surface-secondary border border-border-light flex items-center justify-center text-xs text-text-secondary my-4",children:"Generando..."}),e.jsxs("button",{onClick:G,className:"w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm flex items-center justify-center gap-2 transition-all",children:[e.jsx(Vt,{className:"w-4 h-4"}),"Imprimir Cartel QR"]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-6 space-y-4 shadow-sm",children:[e.jsxs("h3",{className:"text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2",children:[e.jsx(na,{className:"w-4 h-4 text-blue-500"}),"Áreas de Riesgo Frecuente"]}),$.areasFrecuentes.length>0?e.jsx("div",{className:"space-y-3 pt-2",children:$.areasFrecuentes.slice(0,5).map((E,_)=>{const we=$.totalReportesBuzon>0?(E.count/$.totalReportesBuzon*100).toFixed(0):"0";return e.jsxs("div",{className:"flex items-center justify-between text-xs",children:[e.jsx("span",{className:"font-semibold text-text-primary",children:E.name}),e.jsxs("span",{className:"font-bold text-text-secondary bg-surface-secondary px-2 py-0.5 rounded-md",children:[E.count," reportes (",we,"%)"]})]},_)})}):e.jsx("div",{className:"text-center py-8 text-xs text-text-secondary",children:"No hay áreas frecuentes registradas en este periodo."})]})]})}const Vr=new Set(["text","excel","presentation","html","animo","actos_condiciones"]),ct=a=>{if(a==null)return"";if(typeof a=="string")return a;if(typeof a=="object")try{return JSON.stringify(a)}catch{return""}return String(a)},Pt=(a,m="text")=>{if(!a)return m;if(Array.isArray(a))return a.length===0?m:Array.isArray(a[0])?"excel":typeof a[0]=="object"&&a[0]!==null?"title"in a[0]||"bullets"in a[0]||"layout"in a[0]?"presentation":"excel":m;if(typeof a=="object"){if(a.estadoAnimo||a.totalMuestras)return"animo";if(a.preliminarClasificacion||a.totalReportesBuzon)return"actos_condiciones";if(Array.isArray(a.slides)||Array.isArray(a.presentation))return"presentation";if(Array.isArray(a.rows)||Array.isArray(a.data))return"excel";const r=Object.keys(a);return r.length>0&&r.every(f=>Array.isArray(a[f]))?"excel":m}if(typeof a=="string"){const r=a.trim(),f=r.toLowerCase();if(f.includes("<!doctype html")||f.includes("<html"))return"html";if(r.startsWith("[")&&r.endsWith("]"))try{const g=JSON.parse(r);return Pt(g,m)}catch{}else if(r.startsWith("{")&&r.endsWith("}"))try{const g=JSON.parse(r);if(g&&typeof g=="object")return Pt(g,m)}catch{}}return m},kt=(a,m)=>{const f=ct(m).trim().toLowerCase();return a==="html"||f.includes("<!doctype html")||f.includes("<html")?"html":typeof a=="string"&&Vr.has(a)?a:Pt(m,"text")},qr=`
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
</div>`;function at(a){return typeof a!="string"||!a?String(a??""):a.includes("signature-placeholder")||a.includes("RESPONSABLE SST")||/responsable\s+(sg-)?sst/i.test(a)||/representante\s+legal/i.test(a)||/firmas?\s+y\s+responsabilidades/i.test(a)||/evaluador\s+t[eé]cnico/i.test(a)||/firma:?\s*_{3,}/i.test(a)||a.includes("Licencia No.")?a:a+qr}const Wr=1e8,Jr=({version:a,title:m,onRename:r,onDelete:f})=>{const[g,n]=l.useState(!1),[k,c]=l.useState({}),[A,v]=l.useState(!1),N=l.useRef(null),I=l.useRef(null),de=()=>{if(!N.current)return;const M=N.current.getBoundingClientRect();c({position:"fixed",top:M.bottom+4,right:window.innerWidth-M.right,zIndex:Wr})};l.useEffect(()=>{if(!g)return;const M=D=>{var ce,me;const W=D.target;!((ce=N.current)!=null&&ce.contains(W))&&!((me=I.current)!=null&&me.contains(W))&&n(!1)};return document.addEventListener("mousedown",M),()=>document.removeEventListener("mousedown",M)},[g]);const X=async M=>{M.stopPropagation(),n(!1),window.confirm(`¿Eliminar la versión ${a} del historial?
Esta acción no se puede deshacer.`)&&(v(!0),await f(),v(!1))},q=g?e.jsxs("div",{ref:I,style:k,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[e.jsxs("button",{onClick:M=>{M.stopPropagation();const D=prompt("Nuevo nombre para esta versión:",m);D&&D!==m&&r(D),n(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[e.jsx(nr,{className:"h-3 w-3 text-teal-600"})," Renombrar"]}),e.jsxs("button",{onClick:X,disabled:A,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[e.jsx(dr,{className:"h-3.5 w-3.5"})," Eliminar"]})]}):null;return e.jsxs(e.Fragment,{children:[e.jsx("button",{ref:N,onClick:M=>{M.stopPropagation(),de(),n(D=>!D)},className:"shrink-0 rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:e.jsx(lr,{className:"h-4 w-4 text-text-secondary"})}),ua.createPortal(q,document.body)]})},Yr=2500,Qr=1e4,Es=({conversationId:a,embeddedInTenshiHero:m=!1,onCloseOverride:r,onSelectConversationOverride:f,isEmbeddedVisible:g=!0,onSessionStateChange:n})=>{const{showToast:k}=Sa(),{token:c,user:A}=gt(),v=(A==null?void 0:A.role)==="ADMIN"||(A==null?void 0:A.role)==="USER_PRO"||(A==null?void 0:A.role)==="USER_IPEVAR"||(A==null?void 0:A.role)==="IPEVAR",[N,I]=l.useState(!1),[de,X]=l.useState(""),[q,M]=l.useState(""),[D,W]=qt(ft.canvasMaximized),ce=da(ft.isCanvasActive),me=da(vt(a??"new")),ee=l.useCallback(()=>{if(W(!1),m){ce(!1),r==null||r();return}ce(!1),me(u=>u!=null&&u.tools?{...u,tools:u.tools.filter(R=>R!=="canvas"&&R!=="consultar_analitica_psicosocial"&&R!=="consultar_analitica_actos_condiciones")}:u)},[m,r,ce,W,me]),L=ca(ft.isSubmittingFamily(0)),[P,Z]=qt(ft.streamingCanvasState),Q=l.useRef(P!=null&&P.content?Date.now():0),re=l.useRef(n);re.current=n;const ie=l.useCallback((u,R)=>{const z=(R||"").trim();if(z&&z!=="Archivo sin título")return z;if(typeof u=="string"&&u.length>0){const V=u.match(/<title[^>]*>([\s\S]*?)<\/title>/i);if(V!=null&&V[1]){const Y=V[1].replace(/<[^>]+>/g,"").trim();if(Y&&Y!=="Plantilla Informativa SST")return Y.slice(0,90)}const U=u.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);if(U!=null&&U[1]){const Y=U[1].replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();if(Y)return Y.slice(0,90)}}return z||"Documento SG-SST"},[]),pe=fa.useMemo(()=>P?kt(P.fileType,P.content):"text",[P]),K=ct(P==null?void 0:P.content),ae=P?ie(K,P.title):"Archivo sin título",[b,G]=l.useState(pe),[$,he]=l.useState(K),[te,le]=l.useState(ae),[Ie,Se]=l.useState(1),[Be,Te]=l.useState([]),[Le,$e]=l.useState(!1),[Re,ze]=l.useState(!1),[Me,ve]=l.useState(!1),fe=!!$||b!=="text"&&b!=="actos_condiciones"&&b!=="animo"||b==="actos_condiciones"||b==="animo";l.useEffect(()=>{var u;(u=re.current)==null||u.call(re,fe,te)},[fe,te]);const se=l.useRef(K),ge=l.useRef(pe),E=l.useRef(ae),_=l.useRef(null),we=l.useRef(!1),F=l.useRef(null),Oe=l.useRef(!1),Pe=l.useRef(null),De=l.useRef(pe),ke=l.useRef(ae);l.useEffect(()=>{b!=="animo"&&b!=="actos_condiciones"&&(De.current=b)},[b]),l.useEffect(()=>{b!=="animo"&&b!=="actos_condiciones"&&(ke.current=te)},[te,b]);const Ae=u=>{Pe.current&&clearTimeout(Pe.current),Oe.current=!0,Pe.current=setTimeout(()=>{Oe.current=!1,Pe.current=null},u)},He=l.useRef(!1),Ve=l.useRef(null),Xe=Rr(),[et,Ye]=l.useState(!1),qe=zr(),Qe=ka(),S=Qe==null?void 0:Qe.setConversation,C=tr(({snapshot:u,set:R})=>async z=>{const V=a||"new",U=await u.getPromise(vt(V));U&&R(vt(z),U)},[a]),H=ca(vt(a??"new"));l.useEffect(()=>{const u=(H==null?void 0:H.tools)??[];u.includes("consultar_analitica_psicosocial")?(G("animo"),le("Termómetro Psicosocial")):u.includes("consultar_analitica_actos_condiciones")?(G("actos_condiciones"),le("Analítica de Actos y Condiciones")):(De.current&&G(De.current),ke.current&&ke.current!=="Archivo sin título"&&le(ke.current))},[H]),l.useEffect(()=>{se.current=$},[$]),l.useEffect(()=>{ge.current=b},[b]),l.useEffect(()=>{E.current=te},[te]),l.useEffect(()=>{const u=()=>{if(F.current){const R=a;R&&R!=="new"&&fetch(`/api/sgsst/canvas/${R}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({content:ge.current==="text"?at(se.current):se.current,title:E.current,fileType:ge.current,isManual:!0}),keepalive:!0})}};return window.addEventListener("beforeunload",u),()=>{if(window.removeEventListener("beforeunload",u),F.current){clearTimeout(F.current),F.current=null;const R=a;R&&R!=="new"&&fetch(`/api/sgsst/canvas/${R}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({content:ge.current==="text"?at(se.current):se.current,title:E.current,fileType:ge.current,isManual:!0})}).catch(z=>console.error("[CanvasPanel] Save on exit error:",z))}}},[a,c]);const o=l.useCallback(u=>Ur(u),[]);l.useEffect(()=>{if(P){const u=ct(P.content),R=kt(P.fileType,P.content),z=ie(u,P.title),V=R==="text"?o(u):u;Q.current=Date.now(),he(V),se.current=V,G(R),ge.current=R,De.current=R,le(z),E.current=z,ke.current=z}},[P,o,ie]);const p=l.useCallback(async(u=!1)=>{if(!(!a||a==="new")&&!we.current)try{u&&$e(!0);const R=await fetch(`/api/sgsst/canvas/${a}`,{headers:{Authorization:`Bearer ${c}`}});if(!R.ok){console.warn(`[CanvasPanel] fetch failed: ${R.status} for convoId=${a}`);return}const z=await R.json(),V=z.updatedAt||null;if(!V&&!z.content&&(se.current||P!=null&&P.content)||Q.current>0&&V&&new Date(V).getTime()<Q.current&&se.current)return;if(u||V!==_.current){_.current=V;const U=(H==null?void 0:H.tools)??[],Y=U.includes("consultar_analitica_psicosocial"),ne=U.includes("consultar_analitica_actos_condiciones"),ue=kt(z.fileType,z.content);De.current=ue,ke.current=z.title||"Archivo sin título",G(Y?"animo":ne?"actos_condiciones":ue),le(Y?"Termómetro Psicosocial":ne?"Analítica de Actos y Condiciones":z.title||"Archivo sin título"),Se(z.version||1),Te(Array.isArray(z.history)?z.history:[]);const oe=ct(z.content);let Ne=ue==="text"?o(oe):oe;ue==="text"&&(Ne=at(Ne)),(u||JSON.stringify(se.current)!==JSON.stringify(Ne))&&(u||Ae(1500),he(Ne))}}catch(R){console.error("[CanvasPanel] Fetch error:",R)}finally{u&&$e(!1)}},[a,c,o,H,P]);l.useEffect(()=>{p(!0)},[a,p]),l.useEffect(()=>{if(!a||a==="new"||m&&!g)return;const u=setInterval(()=>{p(!1)},Yr);return()=>clearInterval(u)},[a,p,L,m,g]),l.useEffect(()=>{if(He.current===!0&&L===!1&&a&&a!=="new"){const u=setTimeout(()=>{_.current=null,p(!0)},600);return()=>clearTimeout(u)}He.current=L},[L,p,a]);const w=async(u,R,z)=>{const V=pa();F.current&&clearTimeout(F.current),Ae(2500),await C(V),G(u),he(R),le(z),ge.current=u,se.current=R,E.current=z,!m&&S&&S(U=>({...U,conversationId:V})),await j(V,!1,!0),qe.invalidateQueries([wt.messages,V]),qe.invalidateQueries([wt.allConversations]),m||Xe(`/c/${V}`,{replace:!0})},j=l.useCallback(async(u,R=!1,z=!1)=>{const V=u||a;if(!(!V||V==="new")){we.current=!0,ze(!0);try{const Y=await(await fetch(`/api/sgsst/canvas/${V}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({content:ge.current==="text"?at(se.current):se.current,title:E.current,fileType:ge.current,isManual:R})})).json();if(Y.success){if(Ae(2e3),Y.content!==void 0){const ne=typeof se.current=="string"&&se.current.includes("wappy-standard-header-banner")&&!se.current.includes("{{empresa_");se.current=Y.content,(z||ge.current==="text"&&typeof Y.content=="string"&&Y.content.includes("wappy-standard-header-banner")&&!ne)&&he(Y.content)}Se(Y.version),Te(Y.history||[]),_.current=Y.updatedAt,k({status:"success",message:"¡Cambios guardados con éxito!"})}}catch(U){console.error("[CanvasPanel] Save error:",U),k({status:"error",message:"Error al guardar los cambios."})}finally{we.current=!1,ze(!1)}}},[a,c]),T=l.useCallback(()=>{F.current&&clearTimeout(F.current),F.current=setTimeout(()=>{j(void 0,!0)},Qr)},[j]),t=u=>{const R=ge.current==="text"?at(u):u;se.current=R,!Oe.current&&T()},s=u=>{le(u),E.current=u,j()},d=async(u,R)=>{F.current&&clearTimeout(F.current),Ae(2e3);const z=ge.current==="text"?at(u):u;if(he(z),le(R),se.current=z,E.current=R,!a||a==="new"){const V=pa();await C(V),!m&&S&&S(U=>({...U,conversationId:V})),await j(V,!1,!0),qe.invalidateQueries([wt.messages,V]),qe.invalidateQueries([wt.allConversations]),m||Xe(`/c/${V}`,{replace:!0})}else await j(void 0,!1,!0)},i=async()=>{if(window.confirm("¿Deseas volver a la selección de lienzos? Los cambios no guardados en la versión actual podrían perderse.")){ze(!0);try{F.current&&clearTimeout(F.current),Ae(1500);const R=await(await fetch(`/api/sgsst/canvas/${a}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({content:"",title:"Archivo sin título",fileType:"text"})})).json();R.success&&(he(""),G("text"),le("Archivo sin título"),Se(1),Te([]),_.current=R.updatedAt,Ve.current=null,m&&(Q.current=0,Z(null)))}catch(u){console.error("[CanvasPanel] Reset error:",u)}finally{ze(!1)}}},x=()=>{const[u,R]=l.useState(!1),[z,V]=l.useState(te),U=l.useRef(null);l.useEffect(()=>{V(te)},[te]),l.useEffect(()=>{u&&setTimeout(()=>{var J;return(J=U.current)==null?void 0:J.select()},50)},[u]);const Y=()=>{const J=(z??"").trim();J&&s(J),R(!1)},ne=()=>{switch(b){case"excel":return e.jsx(bt,{className:"h-5 w-5"});case"presentation":return e.jsx(Ct,{className:"h-5 w-5"});case"html":return e.jsx(At,{className:"h-5 w-5"});case"animo":return e.jsx(Ut,{className:"h-5 w-5"});case"actos_condiciones":return e.jsx(pt,{className:"h-5 w-5"});default:return e.jsx(Dt,{className:"h-5 w-5"})}},oe=(()=>{switch(b){case"excel":return{bg:"bg-emerald-500/10",border:"border-emerald-500/20",text:"text-emerald-600 dark:text-emerald-400",grad:"from-emerald-500/40 via-emerald-300/20"};case"presentation":return{bg:"bg-amber-500/10",border:"border-amber-500/20",text:"text-amber-600 dark:text-amber-400",grad:"from-amber-500/40 via-amber-300/20"};case"html":return{bg:"bg-blue-500/10",border:"border-blue-500/20",text:"text-blue-600 dark:text-blue-400",grad:"from-blue-500/40 via-blue-300/20"};case"animo":return{bg:"bg-red-500/10",border:"border-red-500/20",text:"text-red-600 dark:text-red-400",grad:"from-red-500/40 via-red-300/20"};case"actos_condiciones":return{bg:"bg-orange-500/10",border:"border-orange-500/20",text:"text-orange-600 dark:text-orange-400",grad:"from-orange-500/40 via-orange-300/20"};default:return{bg:"bg-teal-500/10",border:"border-teal-500/20",text:"text-teal-600 dark:text-teal-400",grad:"from-teal-500/40 via-teal-300/20"}}})(),Ne=!!(m&&!D);return e.jsxs("div",{className:Ne?"w-full shrink-0 px-3 pb-1.5 pt-2.5":"w-full shrink-0 px-4 pb-2 pt-4",children:[e.jsxs("div",{className:"group flex min-w-0 items-center gap-2.5 sm:gap-3",children:[fe&&e.jsx("button",{onClick:i,className:`flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary text-text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-surface-hover ${Ne?"h-8 w-8":"h-10 w-10"}`,"aria-label":"Volver a la selección de lienzos",title:"Volver a la selección de lienzos",children:e.jsx(or,{className:Ne?"h-4 w-4":"h-5 w-5"})}),e.jsx("div",{className:`flex shrink-0 items-center justify-center rounded-xl border shadow-sm ${Ne?"h-8 w-8":"h-10 w-10"} ${oe.bg} ${oe.border} ${oe.text}`,children:ne()}),u?e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("input",{ref:U,value:z,onChange:J=>V(J.target.value),onKeyDown:J=>{J.key==="Enter"&&Y(),J.key==="Escape"&&R(!1)},className:`min-w-0 flex-1 border-b-2 bg-transparent py-0.5 font-bold text-text-primary outline-none ${Ne?"text-sm sm:text-base":"text-xl"} ${oe.border.replace("/20","")}`,autoFocus:!0}),e.jsx("button",{onClick:Y,className:"rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20","aria-label":"Confirmar",children:e.jsx(rt,{className:"h-4 w-4"})}),e.jsx("button",{onClick:()=>R(!1),className:"rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover","aria-label":"Cancelar",children:e.jsx(Ke,{className:"h-4 w-4"})})]}):e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("h2",{className:`truncate font-bold leading-tight text-text-primary ${Ne?"text-sm sm:text-base":"text-xl"}`,children:te}),b!=="animo"&&e.jsx("button",{onClick:()=>R(!0),className:`rounded-lg p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:${oe.text.split(" ")[0]} ${oe.bg.replace("/10","/5")} shrink-0 transition-all`,"aria-label":"Renombrar documento",children:e.jsx(ir,{className:"h-3.5 w-3.5"})})]})]}),e.jsx("div",{className:`${Ne?"mt-2":"mt-3"} h-px bg-gradient-to-r ${oe.grad} to-transparent`})]})},h=async u=>{F.current&&clearTimeout(F.current),Ae(1500),$e(!0);try{const R=await fetch(`/api/sgsst/canvas/${a}/versions/${u.version}/restore`,{method:"POST",headers:{Authorization:`Bearer ${c}`}});if(R.ok){const z=await R.json(),V=ct(z.content),U=kt(z.fileType,z.content),Y=z.title||"Archivo sin título";G(U),ge.current=U,he(V),se.current=V,le(Y),E.current=Y,Se(z.version||1),Te(Array.isArray(z.history)?z.history:[]),_.current=z.updatedAt||null,ve(!1),k({status:"success",message:"¡Versión restaurada con éxito!"})}}catch(R){console.error("[Restore Version] Error:",R),k({status:"error",message:"Error al restaurar la versión."})}finally{$e(!1)}},y=()=>{const u=typeof $=="string"&&($.includes("<!DOCTYPE html")||$.includes("<html")||$.includes("<body"));switch(b==="html"||u?"html":b){case"excel":return e.jsx(Dr,{initialContent:$,onUpdate:t,title:te,isMaximized:D,onRegisterDownload:z=>{Ve.current=z}});case"presentation":return e.jsx(Lr,{initialContent:$,onUpdate:t,title:te,isMaximized:D,onRegisterDownload:z=>{Ve.current=z}});case"html":return e.jsx(_r,{initialContent:$,onUpdate:t,title:te,isMaximized:D,onRegisterDownload:z=>{Ve.current=z}});case"animo":{const z=(A==null?void 0:A.role)==="USER";return e.jsxs("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:[e.jsx("div",{className:`flex-1 overflow-y-auto p-6 ${z?"pointer-events-none select-none blur-[8px] filter":""}`,children:e.jsx(Ar,{isMaximized:D})}),z&&e.jsx("div",{className:"absolute inset-0 z-50 flex items-center justify-center bg-black/10 p-4 backdrop-blur-[2px] sm:p-6 md:p-8",children:e.jsx(xa,{isPopup:!0,title:"Analítica Psicosocial Exclusiva",description:"El Termómetro Psicosocial es una herramienta exclusiva de los planes de pago. Adquiere o actualiza tu plan para ver el diagnóstico cuantitativo, estresores principales y recomendaciones de la IA.",plan:"USER"})})]})}case"actos_condiciones":return e.jsx("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:e.jsx("div",{className:"flex-1 overflow-y-auto p-6",children:e.jsx(Hr,{isMaximized:D})})});default:return e.jsx(Or,{initialContent:$,onUpdate:t,onApplyTemplate:d,isMaximized:D})}};if(Le&&!$)return e.jsxs("div",{className:"flex h-full w-full flex-col items-center justify-center bg-surface-primary p-8",children:[e.jsx("div",{className:"mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal-500"}),e.jsx("p",{className:"text-sm font-semibold text-text-secondary",children:"Cargando espacio de trabajo Canvas..."})]});const O=!!(m&&!D),je=O?"h-8 min-w-[32px] px-2 sm:h-9 sm:min-w-[36px] sm:px-2.5":"h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3",ye=e.jsxs("div",{className:`flex h-full w-full flex-col overflow-hidden bg-surface-primary text-text-primary ${D?"fixed inset-0 z-[9990] m-0 h-screen w-screen rounded-none shadow-2xl pt-[max(env(safe-area-inset-top),2.5rem)] sm:pt-0":O?"relative":"relative pt-[max(env(safe-area-inset-top),1.5rem)] sm:pt-0"}`,children:[e.jsxs("div",{className:`relative z-[300] flex w-full max-w-full shrink-0 items-center justify-between gap-1.5 overflow-visible border-b border-border-light bg-surface-secondary ${O?"px-2.5 sm:px-3 py-1.5":"px-3 sm:px-4 py-2 sm:py-0"}`,style:{minHeight:O?"3.1rem":"3.75rem"},children:[!O&&e.jsxs("button",{onClick:ee,className:"flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700 font-bold text-xs shrink-0 active:scale-95 mr-1","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:[e.jsx(Ke,{className:"h-4 w-4"}),e.jsx("span",{children:"Cerrar"})]}),e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 overflow-hidden",children:[e.jsx("div",{className:`hidden ${O?"lg:flex":"sm:flex"} h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-xs`,children:e.jsx(Dt,{className:"h-4 w-4"})}),e.jsxs("div",{className:"min-w-0 flex-1 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("h2",{className:"truncate text-xs sm:text-sm font-extrabold text-text-primary",children:"Canvas"}),e.jsx("span",{className:"hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",children:"2.0"})]}),e.jsxs("div",{className:"flex min-w-0 items-center gap-1.5",children:[e.jsx("span",{className:`h-1.5 w-1.5 shrink-0 rounded-full ${L?"animate-pulse bg-teal-500":"bg-green-500"}`}),e.jsx("span",{className:"truncate text-[11px] sm:text-xs text-text-secondary",children:fe?(te==null?void 0:te.trim())||"Documento SG-SST":"Nuevo espacio Canvas"}),Re&&e.jsx("span",{className:"shrink-0 text-[10px] italic text-text-tertiary",children:"Guardando..."})]})]})]}),e.jsxs("div",{className:`flex shrink-0 flex-nowrap items-center ${O?"gap-1":"gap-1.5 sm:gap-2"} overflow-visible py-0.5`,children:[fe&&b!=="animo"&&b!=="actos_condiciones"&&e.jsxs("button",{onClick:async u=>{u.preventDefault(),u.stopPropagation(),await j(void 0,!0)},disabled:Re,className:`group flex ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Guardar cambios",title:"Guardar cambios",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:Re?e.jsx("div",{className:"h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"}):e.jsx(ar,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:Re?"Guardando...":"Guardar"})})]}),fe&&b==="text"&&e.jsx(Er,{content:$,fileName:te}),fe&&b!=="text"&&b!=="animo"&&b!=="actos_condiciones"&&e.jsxs("button",{onClick:async u=>{if(u.preventDefault(),u.stopPropagation(),Ve.current)Ve.current();else if($){const R=ct($),z=(te||"archivo").replace(/[/\\?%*:|"<>]/g,"_").trim(),V=b==="html"||R.includes("<html")||R.includes("<!DOCTYPE"),U=V?"html":b==="excel"?"json":"txt",Y=new Blob([R],{type:V?"text/html;charset=utf-8":"text/plain;charset=utf-8"});Jt.saveAs(Y,`${z}.${U}`)}(A==null?void 0:A.role)==="USER"&&fetch("/api/files/register-download",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`}}).catch(R=>console.error("Download register error:",R))},className:`group flex ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Descargar archivo",title:b==="presentation"?"Descargar presentación ejecutiva":b==="excel"?"Descargar hoja de cálculo":"Descargar aplicativo interactivo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(mt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:b==="presentation"?"Descargar Presentación":b==="excel"?"Descargar Hoja":"Descargar Aplicativo"})})]}),fe&&b!=="animo"&&b!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>Ye(!et),className:`hidden sm:flex group ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${et?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Historial de reportes",title:"Historial de reportes",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(yt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Historial"})})]}),fe&&b!=="animo"&&b!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>ve(!Me),className:`hidden sm:flex group ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${Me?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Versiones de documento",title:"Versiones de documento",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(It,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Versiones"})})]}),e.jsxs("button",{onClick:()=>W(u=>!u),className:`${m?"flex":"hidden sm:flex"} group ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":D?"Reducir panel":"Expandir panel",title:D?"Contraer a vista con Tenshi":"Expandir a pantalla completa",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:D?e.jsx(rr,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"}):e.jsx(sr,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:D?"Contraer":"Expandir"})})]}),e.jsxs("button",{onClick:ee,className:`${O?"flex":"hidden sm:flex"} group ${je} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":O?"Volver al chat":"Cerrar lienzo",title:O?"Volver al chat":"Cerrar lienzo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(Ke,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:O?"Volver al chat":"Cerrar"})})]})]})]}),e.jsx(Tr,{onSelectReport:u=>{Ye(!1),m?(Q.current=0,_.current=null,Z(null),f==null||f(u)):Xe(`/c/${u}`)},isOpen:et,toggleOpen:()=>Ye(u=>!u),historyEndpoint:a&&a!=="new"?`/api/sgsst/canvas/history?conversationId=${a}`:"/api/sgsst/canvas/history",tags:[],refreshTrigger:Ie}),e.jsxs("div",{className:"relative flex flex-1 flex-col overflow-hidden",children:[fe?e.jsxs(e.Fragment,{children:[e.jsx(x,{}),e.jsx("div",{className:"relative flex h-full flex-1 flex-col overflow-hidden",children:y()})]}):e.jsxs("div",{className:`relative flex-1 overflow-y-auto ${O?"px-3 py-4 sm:px-5 sm:py-6":"px-4 py-6 sm:px-8 sm:py-10"}`,children:[e.jsx("div",{className:"pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"}),e.jsx("div",{className:"pointer-events-none absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"}),e.jsxs("div",{className:"relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6 text-center",children:[e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsxs("div",{className:"relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-transparent text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10",children:[e.jsx(Fe,{className:"h-8 w-8 animate-pulse"}),e.jsx("span",{className:"absolute -right-1.5 -top-1.5 flex h-5 items-center rounded-md border border-teal-500/40 bg-surface-primary px-1.5 text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 shadow-xs",children:"PRO"})]}),e.jsx("span",{className:"inline-flex items-center gap-1.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300",children:"WAPPY CANVAS STUDIO 2.0 · SUITE EJECUTIVA SG-SST"})]}),e.jsxs("div",{className:"space-y-2 max-w-xl",children:[e.jsx("h3",{className:"text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary",children:"El lienzo está listo"}),e.jsx("p",{className:"text-xs sm:text-sm leading-relaxed text-text-secondary",children:"Crea documentos normativos, matrices de cálculo, presentaciones ejecutivas y aplicativos interactivos en tiempo real."})]}),e.jsxs("div",{className:`grid w-full grid-cols-1 ${O?"lg:grid-cols-2":"sm:grid-cols-2"} gap-3.5 pt-2`,children:[e.jsxs("button",{onClick:()=>{const u=at(`
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
</div>`);!a||a==="new"?w("text",u,"Informe Técnico SG-SST"):(F.current&&clearTimeout(F.current),Ae(1500),G("text"),he(u),le("Informe Técnico SG-SST"),ge.current="text",se.current=u,E.current="Informe Técnico SG-SST",j(void 0,!1,!0))},className:"group relative flex flex-col justify-between rounded-2xl border border-teal-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-teal-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(Dt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"NORMATIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors",children:"Documento Corporativo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Políticas, actas COPASST, procedimientos, matrices legales e informes con firma digital."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"15 Plantillas SST"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Firma Digital"})]})]}),e.jsxs("button",{onClick:()=>{const u=JSON.stringify([["Indicador SG-SST (Res. 0312)","Meta Anual (%)","Q1 (%)","Q2 (%)","Q3 (%)","Q4 (%)","Promedio Real"],["Ejecución Plan Anual de Trabajo","95","88","92","95","98","=PROMEDIO(C2:F2)"],["Cumplimiento Cronograma Capacitación","90","85","90","92","96","=PROMEDIO(C3:F3)"],["Cierre de Acciones ACPM","100","80","88","94","100","=PROMEDIO(C4:F4)"],["Cobertura Exámenes Ocupacionales","100","95","100","100","100","=PROMEDIO(C5:F5)"],["PROMEDIO CONSOLIDADO","=PROMEDIO(B2:B5)","=PROMEDIO(C2:C5)","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=PROMEDIO(G2:G5)"]]);!a||a==="new"?w("excel",u,"Tablero Indicadores SG-SST"):(F.current&&clearTimeout(F.current),Ae(1500),G("excel"),he(u),le("Tablero Indicadores SG-SST"),ge.current="excel",se.current=u,E.current="Tablero Indicadores SG-SST",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-emerald-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(bt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300",children:"ANALÍTICO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors",children:"Hoja de Cálculo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Matrices GTC-45, presupuestos, indicadores Res. 0312, fórmulas en vivo y analítica gráfica."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Fórmulas + Gráficos"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Multi-Hoja"})]})]}),e.jsxs("button",{onClick:()=>{const u=JSON.stringify([{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Cumplimiento de Estándares Mínimos Resolución 0312 de 2019","Gestión de Peligros Prioritarios y Vigilancia Epidemiológica"],takeaway:"Presentación oficial para aprobación de la Alta Dirección."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Estándares Res. 0312: 94.5% (Nivel Aceptable)","Plan Anual de Trabajo: 92% ejecutado","Reducción de accidentalidad ATEL: -35%","Cobertura de exámenes médicos: 100%"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La intervención en la fuente redujo los días de incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",kicker:"MATRIZ DE PELIGROS GTC-45",layout:"columns",theme:"emerald-sst",bullets:["Comparativa de estado inicial vs intervención ejecutada"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas.","Permisos de trabajo en alturas diligenciados en papel."]},{title:"Estado Actual (Control Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Ayudas mecánicas hidráulicas instaladas en bodega central.","Trazabilidad digital en tiempo real mediante WAPPY IA."]}],takeaway:"100% de los peligros críticos intervenidos con controles efectivos."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo",kicker:"MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Planificación trimestral verificable"],steps:[{phase:"FASE 01 · PLANEAR",title:"Diagnóstico e Higiene",detail:"Actualización GTC-45 y mediciones ambientales."},{phase:"FASE 02 · HACER",title:"Intervención SVE",detail:"Batería psicosocial y escuela de liderazgo."},{phase:"FASE 03 · VERIFICAR",title:"Auditoría e Inspección",detail:"Simulacro anual y auditoría Decreto 1072."},{phase:"FASE 04 · ACTUAR",title:"Cierre de ACPM",detail:"Cierre del 100% de hallazgos y revisión gerencial."}],takeaway:"Compromiso gerencial con la mejora continua del SG-SST."}]);!a||a==="new"?w("presentation",u,"Presentación Ejecutiva SG-SST"):(F.current&&clearTimeout(F.current),Ae(1500),G("presentation"),he(u),le("Presentación Ejecutiva SG-SST"),ge.current="presentation",se.current=u,E.current="Presentación Ejecutiva SG-SST",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(Ct,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"EJECUTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors",children:"Presentación Ejecutiva"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"10 estructuras visuales (KPIs, columnas, ruta PHVA, tablas, gráficos) para Alta Dirección."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"10 Estructuras"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"8 Temas Pro"})]})]}),e.jsxs("button",{onClick:()=>{const u=`<!DOCTYPE html>
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
</html>`;!a||a==="new"?w("html",u,"Prototipo Interactivo"):(F.current&&clearTimeout(F.current),Ae(1500),G("html"),he(u),le("Prototipo Interactivo"),ge.current="html",se.current=u,E.current="Prototipo Interactivo",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-blue-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(At,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300",children:"INTERACTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",children:"Prototipo Interactivo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Calculadoras SST, simuladores, tableros interactivos y aplicativos autocontenidos."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Vista en Vivo"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Componentes SST"})]})]})]}),e.jsx("div",{className:"flex w-full pt-1",children:e.jsxs("button",{onClick:()=>Ye(!0),className:"flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-xs sm:text-sm font-extrabold text-orange-700 dark:text-orange-300 shadow-xs transition-all duration-300 hover:bg-orange-500/20 sm:hover:scale-[1.01] active:scale-95 cursor-pointer",children:[e.jsx(yt,{className:"h-4 w-4"}),e.jsx("span",{children:"Explorar el Historial de Documentos Canvas"})]})})]})]}),Me&&e.jsxs("div",{className:"fixed inset-0 z-[999999] flex items-center justify-center",children:[e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm",onClick:()=>ve(!1)}),e.jsxs("div",{className:"relative flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in zoom-in-95",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-border-light bg-surface-secondary px-6 py-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm",children:e.jsx(yt,{className:"h-5 w-5"})}),e.jsx("h2",{className:"text-lg font-bold text-text-primary",children:"Versiones"})]}),e.jsxs("p",{className:"mt-1 text-sm text-text-secondary",children:["Historial de versiones de ",te]})]}),e.jsx("button",{onClick:()=>ve(!1),className:"rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary",children:e.jsx(Ke,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto bg-surface-primary p-6",children:[!v&&e.jsxs("div",{onClick:()=>window.location.href="/planes",className:"mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 transition-all duration-300 hover:scale-[1.01] hover:bg-amber-500/15 dark:text-amber-300",children:[e.jsx(Fe,{className:"mt-0.5 h-5 w-5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400"}),e.jsxs("div",{className:"flex-1 text-sm",children:[e.jsx("span",{className:"font-bold",children:"Límite del Plan Gratuito:"})," Solo conservamos las últimas 5 versiones en este chat. Pásate a Pro para mantener un registro de hasta 20 versiones.",e.jsx("span",{className:"ml-2 font-bold underline transition-colors hover:text-amber-900 dark:hover:text-amber-100",children:"¡Subir de nivel ahora!"})]})]}),Be.length===0?e.jsxs("div",{className:"flex h-full flex-col items-center justify-center gap-4 text-center",children:[e.jsx("div",{className:"flex h-16 w-16 items-center justify-center rounded-full border border-border-light bg-surface-secondary",children:e.jsx(yt,{className:"h-8 w-8 text-text-tertiary"})}),e.jsx("p",{className:"font-medium text-text-secondary",children:"No hay versiones previas guardadas aún."})]}):e.jsx("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",children:Be.map((u,R)=>{const z=u.version===Ie,V=u.fileType||Pt(u.content)||b||"text",U=()=>{switch(V){case"excel":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",children:[e.jsx(bt,{className:"h-3 w-3 text-emerald-500"}),"Hoja de Cálculo (Excel)"]});case"presentation":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",children:[e.jsx(Ct,{className:"h-3 w-3 text-amber-500"}),"Presentación (Slides)"]});case"html":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-purple-500/20 bg-purple-50 px-2 py-0.5 text-[9.5px] font-bold text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",children:[e.jsx(At,{className:"h-3 w-3 text-purple-500"}),"Prototipo HTML / Código"]});default:return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-sky-500/20 bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",children:[e.jsx(Ze,{className:"h-3 w-3 text-sky-500"}),"Documento de Texto (Word)"]})}},Y=!v&&R<Be.length-5;return e.jsxs("div",{className:`flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${z?"border-teal-500 bg-teal-50 dark:bg-teal-900/10":Y?"border-dashed border-gray-300 bg-gray-50/50 opacity-60 hover:opacity-85 dark:border-gray-800 dark:bg-gray-900/5":"border-border-medium bg-surface-secondary hover:border-teal-500/50"}`,children:[e.jsxs("div",{className:"mb-3 flex items-center justify-between border-b border-border-light pb-2",children:[e.jsxs("div",{className:"flex min-w-0 flex-1 flex-col",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"shrink-0 font-bold text-text-primary",children:["Versión ",u.version]}),z&&e.jsx("span",{className:"shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",children:"Actual"})]}),e.jsx("span",{className:"truncate text-xs text-text-tertiary",children:new Date(u.updatedAt).toLocaleString("es-ES")}),U()]}),Y?e.jsx("span",{className:"shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500",children:"🔒 PRO"}):e.jsx(Jr,{version:u.version,title:u.title||te,onRename:async ne=>{try{const ue=await fetch(`/api/sgsst/canvas/${a}/versions/${u.version}/rename`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${c}`},body:JSON.stringify({title:ne})});if(ue.ok){const oe=await ue.json();Te(oe.history||[]),z&&(le(ne),E.current=ne)}}catch(ue){console.error("[Version History Rename] Error:",ue)}},onDelete:async()=>{try{const ne=await fetch(`/api/sgsst/canvas/${a}/versions/${u.version}`,{method:"DELETE",headers:{Authorization:`Bearer ${c}`}});if(ne.ok){const ue=await ne.json();Te(ue.history||[])}}catch(ne){console.error("[Version History Delete] Error:",ne)}}})]}),e.jsxs("div",{className:"mb-4 line-clamp-3 flex-1 text-sm italic text-text-secondary opacity-80",children:['"',u.title||te,'"']}),Y?e.jsxs("button",{onClick:()=>{window.location.href="/planes"},className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:hover:bg-amber-900/20",children:[e.jsx(It,{className:"h-4 w-4 text-amber-500"}),"Restaurar 🔒 PRO"]}):e.jsxs("button",{onClick:()=>h(u),disabled:z,className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-primary py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-teal-900/20",children:[e.jsx(It,{className:"h-4 w-4"}),"Restaurar"]})]},R)})})]})]})]}),(!m||D)&&e.jsx("button",{onClick:ee,className:"fixed bottom-6 right-6 z-[99999999] flex sm:hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-900/90 dark:bg-zinc-800/95 text-white shadow-2xl active:scale-90 border border-slate-400/30 backdrop-blur-md focus:outline-none","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:e.jsx(Ke,{className:"h-5 w-5"})})]})]}),Ee=D?ua.createPortal(ye,document.body):ye;return e.jsxs(e.Fragment,{children:[Ee,N&&e.jsx("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:e.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[e.jsx("button",{onClick:()=>I(!1),className:"absolute -top-10 right-0 z-50 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300",children:"Cerrar ✕"}),e.jsx(xa,{title:de,description:q,plan:(A==null?void 0:A.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]})};export{Es as default};
