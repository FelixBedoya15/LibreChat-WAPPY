const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./vendor.CzLQ0fq0.js","./react-core.DnLkJYlj.js","./markdown_highlight.Cj_heSZW.js","./validation.CXYwsuSc.js","./math-katex.D41sMH58.js","./math-katex.sdXCKFqw.css","./locales-core.odB_8JGc.js","./i18n.CdklldLM.js"])))=>i.map(i=>d[i]);
import{r as n,j as e,a as Et,R as na,c as da}from"./react-core.DnLkJYlj.js";import{dj as ka,ch as tt,cb as _e,dZ as ft,cA as Ze,dL as ut,f8 as Ca,hZ as Ea,dE as pt,dJ as _t,dq as Aa,hb as ca,ev as pa,cC as dt,fI as xa,cE as Ta,d$ as Pa,h7 as Ft,g1 as Rt,cG as Bt,cS as Nt,cT as ma,d0 as rt,d4 as nt,g4 as Ra,dF as At,cM as za,hr as Gt,hs as fa,dD as ct,cQ as ua,cu as Oa,gI as Da,fA as Vt,cx as Jt,cy as Yt,eS as Xt,et as Qt,fX as Kt,h_ as St,g$ as Ia,gl as zt,cO as $a,dV as La,dC as Zt,gj as Ma,cd as ea,eh as _a,gD as Fa,cN as Ba,bP as Ht,cK as Ga,h$ as Ha,cW as kt,ca as ba,dB as Ua,cl as ta,gS as Va,e5 as aa,bQ as ra,bR as oa,bO as qa,g2 as Ot,dO as Wa,gg as bt,cp as Dt,gc as Ja,eO as Ya,cm as Xa,gf as Qa,c5 as sa,ht as Ka,c$ as Za,dn as er}from"./vendor.CzLQ0fq0.js";import{o as Pt,d6 as de,s as xt,c as tr,a0 as ar,b6 as gt,p as rr,U as ia,aC as ht}from"./index.CXeNaGoR.js";import{L as or}from"./LiveEditor.S84DYMVt.js";import{r as sr,a as ir,p as lr,b as nr,c as dr,d as cr,e as pr,f as xr,g as mr,h as fr,i as ur,j as br,k as gr,P as hr}from"./canvas-templates.CmL4TXkY.js";import{_ as yr}from"./locales-core.odB_8JGc.js";import vr from"./MoodAnalyticsDashboard.CSWknkyZ.js";import wr from"./ActosCondicionesAnalyticsDashboard.C6RmxUWS.js";import{E as jr,R as Nr}from"./ExportDropdown.M5yLbesk.js";import{a as Sr}from"./routing.CpqY7sNF.js";import{h as kr}from"./tanstack-vendor.DJw85t3b.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";import"./radix-ui.ZYJ8tYH7.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.DDRRMIXX.js";import"./animations.CB6mjIs8.js";import"./virtualization.DpDH72SI.js";import"./headlessui.DXEBwfTB.js";import"./framer-motion.Do3f2MG_.js";import"./i18n.CdklldLM.js";import"./http-client.CBcqubEr.js";import"./utilities.CCKZG3yh.js";import"./date-utils.D18hejP2.js";import"./forms.DRVLrJdX.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CUhcbvHc.js";import"./SignaturePad.DGr6rkXg.js";import"./CollapsibleReportBox.Db84Veun.js";import"./useAutoLoadReport.1wb3a9vH.js";import"./SGSSTHeroHeader.D_2zNgH5.js";const qt=({onClose:a,onImportTable:u,onImportChart:r,onImportBullets:g,onImportMedia:f,activeFileType:d,initialTab:C="media"})=>{var Je,He,Ye;const{token:h}=Pt(),[E,w]=n.useState([]),[S,$]=n.useState(!0),[ie,Q]=n.useState(""),[U,V]=n.useState(C),[O,G]=n.useState([]),[xe,ge]=n.useState(!1),[ee,D]=n.useState("all"),[z,q]=n.useState(""),[W,ae]=n.useState(""),[me,ce]=n.useState(!1),[J,K]=n.useState([]),[m,L]=n.useState({startRow:0,startCol:0,endRow:2,endCol:2}),[Y,he]=n.useState("bar"),[X,le]=n.useState("Gráfico Importado"),[Ie,Se]=n.useState(0),[Fe,Ae]=n.useState(1),[$e,Oe]=n.useState([]),[Te,Re]=n.useState([]),[Le,we]=n.useState(!1),[fe,re]=n.useState([]),[be,ke]=n.useState("Resumen de Política");n.useEffect(()=>{ue(),oe()},[]);const oe=async()=>{ge(!0);try{const N={};h&&(N.Authorization=`Bearer ${h}`);const k=await fetch("/api/googleflow/media-library",{headers:N});if(k.ok){const se=await k.json();G(Array.isArray(se.items)?se.items:[])}}catch(N){console.error("Error loading Flow & NotebookLM media library:",N)}finally{ge(!1)}},We=N=>{let k="";if(N.mediaType==="video")k=`<figure style="margin:24px 0; text-align:center; background:#090d16; padding:16px; border-radius:16px; border:1px solid rgba(168,85,247,0.3);"><video src="${N.publicUrl}" controls playsinline preload="metadata" style="width:100%; max-height:460px; border-radius:12px; background:#000;"></video><figcaption style="margin:8px 0 0; font-size:11px; color:#cbd5e1; font-weight:600;">🎬 ${N.label} · <a href="${N.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf; text-decoration:underline;">Descargar MP4</a></figcaption></figure>`;else if(N.mediaType==="audio")k=`<div style="margin:20px 0; padding:16px 20px; border-radius:14px; background:#f0fdfa; border:1px solid #99f6e4;"><div style="margin:0 0 8px; font-size:13px; color:#0f766e; font-weight:700;">🎙️ ${N.label}</div><audio src="${N.publicUrl}" controls preload="metadata" style="width:100%; display:block;"></audio><div style="margin-top:8px; font-size:11px;"><a href="${N.publicUrl}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488; font-weight:700; text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;else if(N.mediaType==="document"){const se=N.textPreview?`<pre style="margin:12px 0 0; padding:12px; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:12px; color:#1e293b; white-space:pre-wrap; max-height:360px; overflow-y:auto;">${N.textPreview.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`:"";k=`<div style="margin:20px 0; padding:16px 20px; background:#f8fafc; border:1px solid #cbd5e1; border-left:4px solid #0d9488; border-radius:12px;"><div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;"><strong style="color:#0f172a; font-size:13px;">📄 ${N.label}</strong><a href="${N.publicUrl}" download target="_blank" rel="noopener noreferrer" style="display:inline-block; padding:6px 12px; background:#0d9488; color:#ffffff; font-weight:700; font-size:11px; border-radius:8px; text-decoration:none;">⬇ Descargar Recurso</a></div>${se}</div>`}else k=`<figure style="margin:24px 0; text-align:center; background:#f8fafc; padding:16px; border-radius:14px; border:1px solid #e2e8f0;"><img src="${N.publicUrl}" alt="${N.label}" style="max-width:100%; height:auto; border-radius:10px; box-shadow:0 4px 20px rgba(15,23,42,0.08); display:block; margin:0 auto;" /><figcaption style="margin:10px 0 0; font-size:12px; color:#475569; font-style:italic; font-weight:600;">✨ ${N.label}</figcaption></figure>`;f?(f(N,k),a()):u&&(u(k),a())},ue=async()=>{$(!0),Q("");try{const N=await fetch("/api/sgsst/canvas/history");if(!N.ok)throw new Error("Error al conectar con el servidor.");const se=(await N.json()).conversations||[];w(se);const _=se.filter(c=>c.fileType==="excel"),s=se.filter(c=>c.fileType==="text");U==="excel"&&_.length>0?Me(_[0].conversationId,_[0].title,"excel"):U==="text"&&s.length>0&&Me(s[0].conversationId,s[0].title,"text")}catch(N){Q("No se pudo cargar el historial de lienzos."),console.error(N)}finally{$(!1)}},Be=N=>{if(V(N),N==="media"){oe();return}K([]),Oe([]),q(""),Re([]),re([]);const k=E.filter(se=>se.fileType===(N==="excel"?"excel":"text"));k.length>0&&Me(k[0].conversationId,k[0].title,N)},Me=async(N,k,se)=>{var _;ce(!0),q(N),ae(k),K([]),Oe([]),Re([]),re([]);try{const s=await fetch(`/api/sgsst/canvas/${N}`);if(!s.ok)throw new Error("Error al cargar documento.");const c=await s.json();if(se==="excel"){let v=[];if(Array.isArray(c.content))v=c.content;else if(typeof c.content=="string")try{const j=JSON.parse(c.content);Array.isArray(j)&&(v=j)}catch{}if(v.length>0){K(v),le(k);const j=Math.min(v.length-1,6),A=Math.min((v[0]||[]).length-1,4);if(L({startRow:0,startCol:0,endRow:j>=0?j:0,endCol:A>=0?A:0}),v[0]&&v[0].length>1){Se(0);for(let t=1;t<v[0].length;t++){let o=!1;for(let l=1;l<v.length;l++){const i=(_=v[l])==null?void 0:_[t],b=(i!=null?String(i):"").replace(/[^0-9.\-]/g,"");if(b&&!isNaN(parseFloat(b))){o=!0;break}}if(o){Ae(t);break}}}}}else{const v=c.content||"",j=document.createElement("div");j.innerHTML=v;const A=Array.from(j.querySelectorAll("p, li, h2, h3, h1")).map(t=>{var o;return((o=t.textContent)==null?void 0:o.trim())||""}).filter(t=>t.length>12);Oe(A.length>0?A:["No se detectó suficiente texto estructurado en este documento."]),ke(k)}}catch(s){console.error("Error loading bridge doc:",s)}finally{ce(!1)}},Ge=()=>{var t,o;if(J.length===0||!u)return;const{startRow:N,startCol:k,endRow:se,endCol:_}=m,s=Math.min(N,se),c=Math.max(N,se),v=Math.min(k,_),j=Math.max(k,_);let A=`<div class="imported-excel-table" style="overflow-x:auto; margin:20px 0; border:1px solid rgba(13,148,136,0.2); border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); background:#ffffff; font-family:'Outfit', sans-serif;">`;A+='<table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">',A+='<thead><tr style="background:linear-gradient(135deg, #0f766e, #0d9488); color:#ffffff;">';for(let l=v;l<=j;l++){const i=((t=J[s])==null?void 0:t[l])||"";A+=`<th style="padding:12px 16px; font-weight:700; border-bottom:3px solid #0f766e; text-transform:uppercase; font-size:11px; letter-spacing:0.5px;">${i}</th>`}A+='</tr></thead><tbody style="color:#334155;">';for(let l=s+1;l<=c;l++){const i=l%2===0?"rgba(20,184,166,0.03)":"#ffffff";A+=`<tr style="background:${i}; border-bottom:1px solid rgba(226,232,240,0.8); transition:all 0.2s;">`;for(let p=v;p<=j;p++){const b=(o=J[l])==null?void 0:o[p],y=b!=null?String(b):"",ye=!isNaN(parseFloat(y.replace(/[^0-9.\-]/g,"")))&&y.includes("$")||y.length<10?"right":"left";A+=`<td style="padding:10px 16px; text-align:${ye}; font-weight:500;">${y}</td>`}A+="</tr>"}A+="</tbody></table></div>",u(A),a()},Ce=()=>{var c,v;if(J.length===0||!r)return;const{startRow:N,endRow:k}=m,se=Math.min(N,k),_=Math.max(N,k),s=[];for(let j=se+1;j<=_;j++){const A=(c=J[j])==null?void 0:c[Ie],t=A!=null?String(A):`Fila ${j}`,o=(v=J[j])==null?void 0:v[Fe],l=o!=null?String(o):"0",i=parseFloat(l.replace(/[^0-9.\-]/g,"")),p=isNaN(i)?0:i;s.push({label:t,val:p})}s.length>0&&(r({type:Y,data:s,title:X}),a())},Ee=N=>{Te.includes(N)?Re(Te.filter(k=>k!==N)):Re([...Te,N])},Xe=()=>{Te.length!==0&&(we(!0),setTimeout(()=>{const N=Te.map(se=>$e[se]),k=[];N.forEach(se=>{const _=se.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>15);_.length>0&&_.slice(0,2).forEach(s=>{if(k.length<5){const c=s.charAt(0).toUpperCase()+s.slice(1);k.push(c)}})}),k.length===0&&(k.push("Establecer el compromiso de la alta dirección en SST."),k.push("Implementar canales eficaces de reporte y evaluación."),k.push("Garantizar recursos para el plan anual de capacitaciones.")),re(k),we(!1)},1200))},Ve=()=>{fe.length===0||!g||(g(be,fe),a())},Qe=E.filter(N=>N.fileType==="excel"),Ke=E.filter(N=>N.fileType==="text");return e.jsxs("div",{className:"absolute right-0 top-0 bottom-0 z-[500] w-[360px] sm:w-[420px] bg-slate-950/80 backdrop-blur-xl border-l border-teal-500/20 shadow-2xl flex flex-col animate-slide-in-right text-slate-100 font-sans",children:[e.jsxs("div",{className:"p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-teal-950/30 to-slate-950",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400",children:e.jsx(ka,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-bold text-sm text-white tracking-wide",children:"Puente de Lienzos"}),e.jsx("p",{className:"text-[10.5px] text-teal-400 font-medium",children:"Interconexión SST Inteligente"})]})]}),e.jsx("button",{onClick:a,className:"p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",children:e.jsx(tt,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"px-3 py-2.5 bg-slate-950/50 border-b border-slate-900 flex gap-1.5",children:[e.jsxs("button",{onClick:()=>Be("media"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-300 ${U==="media"?"bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(_e,{className:"h-3.5 w-3.5 text-purple-400"}),"Flow & NotebookLM"]}),e.jsxs("button",{onClick:()=>Be("excel"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${U==="excel"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(ft,{className:"h-3.5 w-3.5"}),"Excel"]}),e.jsxs("button",{onClick:()=>Be("text"),className:`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[11px] font-semibold tracking-wide transition-all duration-300 ${U==="text"?"bg-teal-500/15 border border-teal-500/40 text-teal-300":"bg-transparent border border-transparent text-slate-400 hover:text-slate-200"}`,children:[e.jsx(Ze,{className:"h-3.5 w-3.5"}),"Word"]})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:[U==="media"&&e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("div",{className:"flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-1 flex-1",children:["all","flow","notebooklm","antigravity"].map(N=>e.jsx("button",{onClick:()=>D(N),className:`flex-1 py-1 px-1.5 rounded-md text-[9.5px] font-bold transition-all ${ee===N?"bg-purple-500/20 text-purple-300 border border-purple-500/40":"text-slate-400 hover:text-slate-200"}`,children:N==="all"?"Todos":N==="flow"?"Flow":N==="notebooklm"?"NotebookLM":"Antigravity"},N))}),e.jsx("button",{onClick:oe,disabled:xe,className:"p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 transition-all",title:"Actualizar biblioteca multimedia (30 días)",children:e.jsx(ut,{className:`h-3.5 w-3.5 ${xe?"animate-spin text-purple-400":""}`})})]}),e.jsxs("div",{className:"px-2.5 py-1.5 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-[10px] text-purple-200",children:[e.jsx("span",{children:"💾 Almacenados en tu servidor WAPPY"}),e.jsx("span",{className:"font-bold text-purple-400",children:"Retención: 30 días"})]}),xe?e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(ut,{className:"h-6 w-6 text-purple-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Cargando recursos de Flow y NotebookLM..."})]}):(()=>{const N=O.filter(k=>ee==="all"||k.source===ee);return N.length===0?e.jsxs("div",{className:"flex flex-col items-center justify-center py-10 px-5 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-xl",children:[e.jsx(Ca,{className:"h-7 w-7 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-bold text-slate-300 mb-1",children:"No hay recursos descargados aún"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Genera una imagen o video con Google Flow o una infografía/podcast con NotebookLM y aparecerá aquí automáticamente durante 30 días."})]}):e.jsx("div",{className:"space-y-3",children:N.map(k=>e.jsxs("div",{className:"bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-xl overflow-hidden transition-all shadow-md",children:[k.mediaType==="image"&&e.jsxs("div",{className:"relative h-36 w-full bg-slate-950 overflow-hidden",children:[e.jsx("img",{src:k.publicUrl,alt:k.label,className:"w-full h-full object-cover",loading:"lazy"}),e.jsx("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-purple-300 border border-purple-500/30",children:k.source==="flow"?"✨ Flow Imagen":"📊 NotebookLM"}),e.jsxs("span",{className:"absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950/80 text-emerald-300 border border-emerald-500/30",children:["⏳ ",k.daysRemaining,"d"]})]}),k.mediaType==="video"&&e.jsxs("div",{className:"relative bg-black",children:[e.jsx("video",{src:k.publicUrl,controls:!0,playsInline:!0,preload:"metadata",className:"w-full max-h-40 object-contain"}),e.jsxs("span",{className:"absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-950/80 text-cyan-300 border border-cyan-500/30 pointer-events-none",children:["🎬 ",k.source==="flow"?"Veo 3.1 Lite":"NotebookLM Video"]})]}),k.mediaType==="audio"&&e.jsxs("div",{className:"p-3 bg-slate-950 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-2",children:[e.jsxs("span",{className:"text-[10px] font-bold text-teal-300 flex items-center gap-1",children:[e.jsx(Ea,{className:"h-3.5 w-3.5"})," ",k.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",k.daysRemaining,"d"]})]}),e.jsx("audio",{src:k.publicUrl,controls:!0,className:"w-full h-8"})]}),k.mediaType==="document"&&e.jsxs("div",{className:"p-3 bg-slate-950/90 border-b border-slate-800/80",children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsxs("span",{className:"text-[10px] font-bold text-amber-300 flex items-center gap-1",children:[e.jsx(Ze,{className:"h-3.5 w-3.5"})," ",k.label]}),e.jsxs("span",{className:"text-[9px] text-emerald-400 font-bold",children:["⏳ ",k.daysRemaining,"d"]})]}),k.textPreview&&e.jsxs("p",{className:"text-[10px] text-slate-400 line-clamp-3 font-mono bg-slate-900/80 p-2 rounded border border-slate-800",children:[k.textPreview.slice(0,180),"..."]})]}),e.jsxs("div",{className:"p-3 flex items-center justify-between gap-2",children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("p",{className:"text-xs font-bold text-white truncate",title:k.label,children:k.label}),e.jsxs("p",{className:"text-[10px] text-slate-400 truncate font-mono",children:[k.filename," • ",(k.sizeBytes/1024).toFixed(0)," KB"]})]}),e.jsxs("button",{onClick:()=>We(k),className:"shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-[11px] font-bold text-white shadow-sm transition-all cursor-pointer",children:[e.jsx(pt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Insertar"})]})]})]},k.filename))})})()]}),U!=="media"&&e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5",children:"Seleccionar origen del historial"}),e.jsxs("div",{className:"relative",children:[e.jsxs("select",{value:z,onChange:N=>{const k=E.find(se=>se.conversationId===N.target.value);k&&(U==="excel"||U==="text")&&Me(k.conversationId,k.title,U)},className:"w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 py-2.5 px-3 rounded-lg focus:outline-none focus:border-teal-500/50 appearance-none pr-8 cursor-pointer",children:[e.jsx("option",{value:"",disabled:!0,children:"Selecciona un archivo..."}),U==="excel"?Qe.map(N=>e.jsx("option",{value:N.conversationId,children:N.title},N.conversationId)):Ke.map(N=>e.jsx("option",{value:N.conversationId,children:N.title},N.conversationId))]}),e.jsx("div",{className:"pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800",children:e.jsx(_t,{className:"h-3.5 w-3.5 rotate-90"})})]})]}),U!=="media"&&me&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 space-y-3 bg-slate-900/20 border border-slate-900/50 rounded-xl",children:[e.jsx(ut,{className:"h-6 w-6 text-teal-400 animate-spin"}),e.jsx("p",{className:"text-xs text-slate-400",children:"Analizando celdas y estructuras..."})]}),U!=="media"&&!z&&!me&&e.jsxs("div",{className:"flex flex-col items-center justify-center py-12 px-6 text-center bg-slate-900/10 border border-dashed border-slate-850 rounded-xl",children:[e.jsx(Aa,{className:"h-6 w-6 text-slate-500 mb-2"}),e.jsx("p",{className:"text-xs font-semibold text-slate-400 mb-1",children:"Sin archivos disponibles"}),e.jsx("p",{className:"text-[10px] text-slate-500",children:"Aún no se ha guardado ningún lienzo de este tipo en la empresa."})]}),U==="excel"&&z&&!me&&J.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900/90 rounded-xl p-3.5 space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Rango de Celdas de Excel"}),e.jsxs("span",{className:"text-[10px] font-semibold bg-teal-500/10 border border-teal-500/30 px-2 py-0.5 rounded text-teal-300",children:[String.fromCharCode(65+m.startCol),"$",m.startRow+1," : ",String.fromCharCode(65+m.endCol),"$",m.endRow+1]})]}),e.jsx("div",{className:"overflow-x-auto pb-1.5",children:e.jsxs("table",{className:"mx-auto border-collapse",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"w-6 h-5 bg-slate-950 text-[9px] text-slate-500 font-bold border border-slate-900 text-center"}),(Je=J[0])==null?void 0:Je.slice(0,6).map((N,k)=>e.jsx("th",{className:"w-10 h-5 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:String.fromCharCode(65+k)},k))]})}),e.jsx("tbody",{children:J.slice(0,7).map((N,k)=>e.jsxs("tr",{children:[e.jsx("td",{className:"w-6 h-6 bg-slate-950 text-[9px] text-slate-400 font-bold border border-slate-900 text-center",children:k+1}),N.slice(0,6).map((se,_)=>{const s=k>=Math.min(m.startRow,m.endRow)&&k<=Math.max(m.startRow,m.endRow)&&_>=Math.min(m.startCol,m.endCol)&&_<=Math.max(m.startCol,m.endCol);return e.jsx("td",{onClick:()=>{m.startRow===k&&m.startCol===_?L({startRow:k,startCol:_,endRow:k,endCol:_}):L({...m,endRow:k,endCol:_})},className:`w-10 h-6 border border-slate-900/60 text-[9.5px] p-1 text-center truncate cursor-pointer transition-all duration-150 ${s?"bg-teal-500/25 border-teal-500/60 text-white font-bold":"bg-slate-900/90 text-slate-400 hover:bg-slate-800"}`,title:se,children:se||""},_)})]},k))})]})}),e.jsx("p",{className:"text-[10px] text-slate-500 text-center",children:"Haz clic en cualquier celda para definir el límite del rango a importar."})]}),e.jsxs("div",{className:"space-y-3.5",children:[e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(ca,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Importar Rango como Tabla HTML"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Inserta una tabla limpia con bordes redondeados y tipografía SST integrada."})]})]}),e.jsxs("button",{onClick:Ge,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg shadow-teal-900/20 text-white transition-all",children:[e.jsx(pt,{className:"h-3.5 w-3.5"}),"Inyectar Tabla Elegante"]})]}),d==="presentation"&&r&&e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col gap-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(pa,{className:"h-4.5 w-4.5"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Generar Gráfico SVG Interactivo"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Convierte el rango seleccionado en un gráfico vectorial adaptado al tema."})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje X (Etiquetas)"}),e.jsx("select",{value:Ie,onChange:N=>Se(parseInt(N.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(He=J[0])==null?void 0:He.map((N,k)=>e.jsx("option",{value:k,children:N||`Columna ${String.fromCharCode(65+k)}`},k))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Eje Y (Valores)"}),e.jsx("select",{value:Fe,onChange:N=>Ae(parseInt(N.target.value)),className:"w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200",children:(Ye=J[0])==null?void 0:Ye.map((N,k)=>e.jsx("option",{value:k,children:N||`Columna ${String.fromCharCode(65+k)}`},k))})]})]}),e.jsx("div",{className:"grid grid-cols-3 gap-2",children:["bar","line","pie"].map(N=>e.jsx("button",{onClick:()=>he(N),className:`py-1.5 text-[10.5px] font-semibold border rounded-lg capitalize transition-all ${Y===N?"bg-teal-500/15 border-teal-500/60 text-teal-300":"border-slate-800 text-slate-400 hover:text-slate-300"}`,children:N==="bar"?"Barras":N==="line"?"Líneas":"Torta"},N))}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-slate-400 mb-1",children:"Título del Gráfico"}),e.jsx("input",{type:"text",value:X,onChange:N=>le(N.target.value),className:"w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("button",{onClick:Ce,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-xs font-semibold rounded-lg shadow-lg text-white transition-all",children:[e.jsx(pt,{className:"h-3.5 w-3.5"}),"Insertar Gráfico de Neón"]})]})]})]}),U==="text"&&z&&!me&&$e.length>0&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 space-y-3",children:[e.jsx("h4",{className:"text-[10px] font-bold text-teal-400 uppercase tracking-widest",children:"Secciones Disponibles del Documento"}),e.jsx("div",{className:"space-y-2 max-h-[180px] overflow-y-auto pr-1",children:$e.map((N,k)=>{const se=Te.includes(k);return e.jsx("div",{onClick:()=>Ee(k),className:`p-2.5 rounded-lg border text-[11px] cursor-pointer transition-all ${se?"bg-teal-500/10 border-teal-500/40 text-teal-200":"bg-slate-900/70 border-slate-850 text-slate-400 hover:border-slate-800"}`,children:e.jsx("p",{className:"line-clamp-3",children:N})},k)})}),e.jsx("p",{className:"text-[9.5px] text-slate-500",children:"Selecciona los párrafos clave que deseas sintetizar en las diapositivas."})]}),e.jsxs("div",{className:"bg-slate-900/20 border border-slate-900 rounded-xl p-4 space-y-3.5",children:[e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:"p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5",children:e.jsx(_e,{className:"h-4.5 w-4.5 animate-pulse"})}),e.jsxs("div",{children:[e.jsx("h5",{className:"text-xs font-bold text-white",children:"Sintetizador de Viñetas IA"}),e.jsx("p",{className:"text-[10.5px] text-slate-400",children:"Analiza y destila párrafos largos en puntos clave listos para presentaciones."})]})]}),Te.length===0?e.jsx("div",{className:"text-center py-4 bg-slate-950/40 border border-slate-900 rounded-lg",children:e.jsx("p",{className:"text-[10px] text-slate-500 font-semibold",children:"Selecciona al menos un párrafo arriba para comenzar."})}):e.jsx("button",{onClick:Xe,disabled:Le,className:"w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:opacity-50 text-xs font-semibold rounded-lg text-white transition-all",children:Le?e.jsxs(e.Fragment,{children:[e.jsx(ut,{className:"h-3.5 w-3.5 animate-spin"}),"Sintetizando ideas clave..."]}):e.jsxs(e.Fragment,{children:[e.jsx(_e,{className:"h-3.5 w-3.5 text-teal-300"}),"Sintetizar en Viñetas"]})}),fe.length>0&&e.jsxs("div",{className:"mt-3.5 p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-3 animate-fade-in",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase mb-1",children:"Título de Diapositiva a Crear"}),e.jsx("input",{type:"text",value:be,onChange:N=>ke(N.target.value),className:"w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 py-1.5 px-2.5 rounded focus:outline-none focus:border-teal-500/30"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"block text-[9px] text-teal-400 font-bold uppercase",children:"Puntos Clave Extraídos"}),e.jsx("ul",{className:"list-disc pl-4 text-[10.5px] text-slate-300 space-y-1",children:fe.map((N,k)=>e.jsx("li",{children:N},k))})]}),e.jsxs("button",{onClick:Ve,className:"w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-xs font-bold rounded-lg text-white transition-all",children:[e.jsx(pt,{className:"h-3.5 w-3.5"}),"Inyectar como Nueva Diapositiva"]})]})]})]})]})]})},Ct=`
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
</div>`,Cr=[{id:"politica_sst",title:"Política de SST",description:"Compromisos oficiales y alta dirección (Decreto 1072)",icon:e.jsx(Ze,{className:"h-4 w-4 text-teal-500"}),html:`
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

        ${Ct}
      </div>
    `.trim()},{id:"copasst",title:"Acta del COPASST",description:"Constitución oficial de delegados y actas de comités",icon:e.jsx(xa,{className:"h-4 w-4 text-emerald-500"}),html:`
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

        ${Ct}
      </div>
    `.trim()},{id:"guia_induccion",title:"Guía de Inducción",description:"Onboarding y normas de prevención para nuevos ingresos",icon:e.jsx(Ta,{className:"h-4 w-4 text-sky-500"}),html:`
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
    `.trim()},{id:"inspeccion_planeada",title:"Inspección de Seguridad",description:"Lista de chequeo para orden, aseo e instalaciones",icon:e.jsx(Pa,{className:"h-4 w-4 text-indigo-500"}),html:`
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
    `.trim()},{id:"analisis_riesgo_ats",title:"Análisis de Riesgo (ATS)",description:"Control de peligros and autorizaciones por tarea",icon:e.jsx(Ft,{className:"h-4 w-4 text-orange-500"}),html:`
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
    `.trim()},{id:"rit_tradicional",title:"RIT - Modelo Tradicional",description:"Reglamento Interno de Trabajo con enfoque legal estricto y de autoridad",icon:e.jsx(Rt,{className:"h-4 w-4 text-slate-500"}),html:sr},{id:"rit_humanista",title:"RIT - Modelo Humanista",description:"Reglamento de convivencia enfocado en bio-individualidad, salud mental y bienestar",icon:e.jsx(Bt,{className:"h-4 w-4 text-rose-500"}),html:ir},{id:"plan_emergencias",title:"Plan de Emergencias",description:"Plan de prevención, preparación y respuesta ante emergencias (Decreto 1072)",icon:e.jsx(Nt,{className:"h-4 w-4 text-red-500"}),html:`
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

        ${Ct}
      </div>
    `.trim()},{id:"politica_desconexion",title:"Pol. Desconexión Laboral",description:"Regulación del descanso y salud digital (Ley 2191 de 2022)",icon:e.jsx(Rt,{className:"h-4 w-4 text-indigo-500"}),html:lr},{id:"politica_acoso_laboral",title:"Pol. Acoso Laboral",description:"Prevención de acoso y convivencia armónica (Ley 1010)",icon:e.jsx(Nt,{className:"h-4 w-4 text-emerald-500"}),html:nr},{id:"protocolo_acoso_laboral",title:"Prot. Acoso Laboral",description:"Ruta de quejas y mediación del Comité de Convivencia",icon:e.jsx(Ft,{className:"h-4 w-4 text-teal-500"}),html:dr},{id:"politica_acoso_sexual",title:"Pol. Acoso Sexual",description:"Prevención y tolerancia cero frente a agresión sexual (Ley 2365)",icon:e.jsx(Nt,{className:"h-4 w-4 text-rose-500"}),html:cr},{id:"protocolo_acoso_sexual",title:"Prot. Acoso Sexual",description:"Ruta de atención urgente y medidas cautelares (Ley 2365)",icon:e.jsx(ma,{className:"h-4 w-4 text-purple-500"}),html:pr},{id:"politica_genero",title:"Pol. Equidad de Género",description:"Plan de igualdad de oportunidades y brecha salarial cero",icon:e.jsx(Bt,{className:"h-4 w-4 text-blue-500"}),html:xr},{id:"contrato_indefinido",title:"Contrato Término Indefinido",description:"Contrato de trabajo estándar sin límite de tiempo vinculante",icon:e.jsx(Ze,{className:"h-4 w-4 text-slate-500"}),html:mr},{id:"contrato_definido",title:"Contrato Término Fijo",description:"Contrato laboral con fecha de vencimiento y prórrogas",icon:e.jsx(Ze,{className:"h-4 w-4 text-blue-800"}),html:fr},{id:"contrato_servicios",title:"Prestación de Servicios",description:"Contrato civil/comercial independiente con autonomía técnica",icon:e.jsx(Ze,{className:"h-4 w-4 text-teal-600"}),html:ur},{id:"contrato_obra_labor",title:"Contrato de Obra o Labor",description:"Contrato laboral condicionado al fin de un proyecto u obra",icon:e.jsx(Ze,{className:"h-4 w-4 text-orange-700"}),html:br},{id:"procedimiento_sancionatorio",title:"Procedimiento Sancionatorio",description:"Debido proceso disciplinario, descargos y apelación (C-593/14 y Ley 2466 de 2025)",icon:e.jsx(Rt,{className:"h-4 w-4 text-slate-700"}),html:gr}],Er=[{id:"inlay_signatures",title:"Bloque de Firmas SST",description:"Inyectar firmas de Líder SST y Representante de Trabajadores",icon:e.jsx(xa,{className:"h-4.5 w-4.5 text-teal-600 dark:text-teal-400"}),html:`
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
    `.trim()},{id:"inlay_alert_card",title:"Banderola de Alerta",description:"Inyectar un recuadro llamativo de advertencia de peligro",icon:e.jsx(ma,{className:"h-4.5 w-4.5 text-amber-500"}),html:`
      <div style="background-color: #fffbeb; border-left: 5px solid #f59e0b; padding: 16px; border-radius: 0 12px 12px 0; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: sans-serif;">
        <h4 style="margin: 0 0 4px 0; color: #b45309; font-size: 15px; font-weight: 700;">🚨 ALERTA DE RIESGO DETECTADO</h4>
        <p style="margin: 0; color: #78350f; font-size: 13px;">Se ha identificado una condición subestándar en las instalaciones físicas. Tome medidas de contención de inmediato y proceda con el aislamiento y señalización del área.</p>
      </div>
    `.trim()},{id:"inlay_action_table",title:"Tabla Plan de Acción",description:"Inyectar tabla estilizada para el seguimiento de actividades",icon:e.jsx(Ft,{className:"h-4.5 w-4.5 text-indigo-500"}),html:`
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
    `.trim()}],Ar=({initialContent:a,onUpdate:u,onApplyTemplate:r,reportSourceData:g,isMaximized:f})=>{const{token:d}=Pt(),C=n.useRef(null),h=n.useRef(null),[E,w]=n.useState(!1),[S,$]=n.useState("templates"),[ie,Q]=n.useState(!1),[U,V]=n.useState(!1),O=D=>{var J;const z=((J=C.current)==null?void 0:J.getHTML())||a||"";let q="";const W=z.indexOf('<div style="background: linear-gradient');if(W!==-1){let K=z.match(/<\/table>\s*<\/div>/i);if(K||(K=z.match(/<\/table>/i)),K){const m=z.indexOf(K[0],W);m!==-1&&(q=z.substring(W,m+K[0].length))}}else{const K=z.indexOf('<div style="overflow-x: auto;');if(K!==-1){let m=z.match(/<\/table>\s*<\/div>/i)||z.match(/<\/table>/i);if(m){const L=z.indexOf(m[0],K);L!==-1&&(q=z.substring(K,L+m[0].length))}}}let ae="";const me=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div class="signature-placeholder'];for(const K of me){const m=z.lastIndexOf(K);if(m!==-1){ae=z.substring(m);break}}let ce="";return q&&(ce+=q+`

`),ce+=D,ae?ce+=`

`+ae:ce+=`

`+Ct,ce},G=async D=>{var W,ae;const z=(W=D.target.files)==null?void 0:W[0];if(!z)return;const q=new FormData;q.append("file",z);try{V(!0);const me=await fetch("/api/live/documents/extract",{method:"POST",headers:{Authorization:`Bearer ${d}`},body:q});if(!me.ok){const m=await me.json().catch(()=>({}));throw new Error(m.error||`Error del servidor (${me.status})`)}const ce=await me.json();let J="";if(ce.html?J=ce.html:ce.text&&(J=ce.text.split(`

`).filter(m=>m.trim()).map(m=>`<p>${m.trim().replace(/\n/g,"<br/>")}</p>`).join(`
`)),!J)throw new Error("No se pudo extraer ningún texto del documento cargado.");const K=O(J);(ae=C.current)==null||ae.setHTML(K),u(K)}catch(me){console.error("[CanvasTextEditor] Upload error:",me),alert(me.message||"Error al subir el archivo")}finally{V(!1),D.target.value=""}},xe=D=>{var z,q;C.current&&((q=(z=C.current).insertHTML)==null||q.call(z,D))};n.useEffect(()=>{if(a&&C.current){const D=C.current.getHTML(),z=q=>q.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,"").trim();z(a)!==z(D)&&C.current.setHTML(a)}},[a]);const ge=(D,z)=>{window.confirm(`¿Deseas reemplazar el contenido actual por el formato "${z}"? Se perderán las modificaciones no guardadas.`)&&C.current&&(C.current.setHTML(D),r?r(D,z):u(D))},ee=D=>{C.current&&C.current.insertHTML(D)};return e.jsxs("div",{className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[E&&e.jsx("div",{className:`${f?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>w(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${f?"sm:relative sm:z-0":"shadow-2xl"} ${E?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(dt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Normativa SST"})]}),e.jsx("button",{onClick:()=>w(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex p-1.5 bg-surface-primary/60 border-b border-border-medium/60 shrink-0 gap-1",children:[e.jsx("button",{onClick:()=>$("templates"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${S==="templates"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs font-extrabold border border-teal-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"15 Plantillas SST"}),e.jsx("button",{onClick:()=>$("inlays"),className:`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${S==="inlays"?"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-xs font-extrabold border border-emerald-500/30":"text-text-secondary hover:bg-surface-hover"}`,children:"Bloques Rápidos"})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:S==="templates"?e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Formatos y Políticas Oficiales"}),Cr.map(D=>e.jsxs("button",{onClick:()=>{ge(D.html,D.title),f||w(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:D.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:D.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:D.description})]})]},D.id))]}):e.jsxs("div",{className:"space-y-2.5",children:[e.jsx("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1",children:"Inyectores en el Cursor"}),Er.map(D=>e.jsxs("button",{onClick:()=>{ee(D.html),f||w(!1)},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-emerald-500/40 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:D.icon}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-emerald-600 transition-colors",children:D.title}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:D.description})]})]},D.id))]})})]}),e.jsxs("div",{className:"flex-1 h-full overflow-hidden relative flex flex-col",children:[e.jsx("input",{type:"file",ref:h,className:"hidden",accept:".docx,.doc",onChange:G}),e.jsx("div",{className:"flex-1 overflow-hidden relative",children:e.jsx(or,{ref:C,initialContent:a,onUpdate:u,reportType:"general",paperMode:!0,hideFullscreen:!1,reportSourceData:g,hideToolbarWhenCollapsed:!1,onToggleTemplates:()=>w(D=>!D),isTemplatesOpen:E,onUploadDocument:()=>{var D;return(D=h.current)==null?void 0:D.click()},isUploadingDocument:U,onOpenAiBridge:()=>Q(!0)})})]}),ie&&e.jsx(qt,{onClose:()=>Q(!1),onImportTable:xe,onImportMedia:(D,z)=>xe(z),activeFileType:"text",initialTab:"media"})]})};function yt(a){const u=a.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);if(!u)return null;const r=u[1],g=u[2];let f=0;for(let C=0;C<r.length;C++)f=f*26+(r.charCodeAt(C)-64);return f=f-1,{row:parseInt(g,10)-1,col:f}}function It(a,u,r,g=new Set){var E;const f=`${a},${u}`;if(g.has(f))return 0;g.add(f);const d=(E=r[a])==null?void 0:E[u],C=d!=null?String(d):"";if(C.startsWith("=")){const w=mt(C,r,g),S=parseFloat(w);return g.delete(f),isNaN(S)?0:S}g.delete(f);const h=parseFloat(C);return isNaN(h)?0:h}function mt(a,u,r=new Set){const g=a!=null?String(a):"";if(!g||!g.startsWith("="))return g;const f=a.toUpperCase().trim(),d=f.match(/^=(SUM|SUMA|AVERAGE|PROMEDIO|MAX|MIN|COUNT|CONTAR)\((.+?)\)$/);if(d){const E=d[1],S=d[2].split(/[,;]/),$=[];for(const ie of S){const Q=ie.trim(),U=Q.match(/^([A-Z]+[0-9]+):([A-Z]+[0-9]+)$/);if(U){const V=yt(U[1]),O=yt(U[2]);if(V&&O){const G=Math.min(V.row,O.row),xe=Math.max(V.row,O.row),ge=Math.min(V.col,O.col),ee=Math.max(V.col,O.col);for(let D=G;D<=xe;D++)for(let z=ge;z<=ee;z++)$.push(It(D,z,u,r))}}else{const V=yt(Q);if(V)$.push(It(V.row,V.col,u,r));else{const O=parseFloat(Q);isNaN(O)||$.push(O)}}}if(E==="SUM"||E==="SUMA"){const ie=$.reduce((Q,U)=>Q+U,0);return(Math.round(ie*1e4)/1e4).toString()}else if(E==="AVERAGE"||E==="PROMEDIO"){if($.length===0)return"0";const Q=$.reduce((U,V)=>U+V,0)/$.length;return(Math.round(Q*1e4)/1e4).toString()}else{if(E==="MAX")return $.length===0?"0":Math.max(...$).toString();if(E==="MIN")return $.length===0?"0":Math.min(...$).toString();if(E==="COUNT"||E==="CONTAR")return $.length.toString()}}let C=f.slice(1);C=C.replace(/([A-Z]+[0-9]+)/g,E=>{const w=yt(E);return w?It(w.row,w.col,u,r).toString():E});const h=C.replace(/[^0-9+\-*/().\s]/g,"");try{const E=new Function(`return (${h})`)();return typeof E=="number"&&!isNaN(E)?(Math.round(E*1e4)/1e4).toString():"0"}catch{return"0"}}function $t(a){let u="",r=a;for(;r>=0;)u=String.fromCharCode(r%26+65)+u,r=Math.floor(r/26)-1;return u}const Tr=({initialContent:a,onUpdate:u,title:r,onRegisterDownload:g,isMaximized:f=!1})=>{var se,_;const[d,C]=n.useState({"Hoja 1":[["","",""],["","",""],["","",""]]}),[h,E]=n.useState("Hoja 1"),w=d[h]||[["","",""],["","",""],["","",""]],[S,$]=n.useState(null),[ie,Q]=n.useState(""),U=n.useRef(null),V=n.useRef(null),[O,G]=n.useState(!1),[xe,ge]=n.useState(!1),[ee,D]=n.useState(!1);n.useEffect(()=>{const s=()=>{G(!!document.fullscreenElement)};return document.addEventListener("fullscreenchange",s),()=>document.removeEventListener("fullscreenchange",s)},[]);const z=async()=>{const s=V.current;if(document.fullscreenElement)try{document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen()}catch(c){console.error("Exit fullscreen failed:",c)}else try{s!=null&&s.requestFullscreen?await s.requestFullscreen():s.webkitRequestFullscreen&&await s.webkitRequestFullscreen()}catch(c){console.error("Fullscreen request failed:",c)}},[q,W]=n.useState(!1),[ae,me]=n.useState("bar"),[ce,J]=n.useState(0),[K,m]=n.useState(1),[L,Y]=n.useState(null),[he,X]=n.useState({x:0,y:0}),[le,Ie]=n.useState(!1),[Se,Fe]=n.useState("sum"),Ae=(()=>{let s=0;return Array.isArray(w)&&w.forEach(c=>{Array.isArray(c)&&c.length>s&&(s=c.length)}),s||3})(),$e=(()=>{let s=0,c=0;if(Array.isArray(w)){const v=Math.min(10,w.length);for(let j=0;j<v;j++){const t=(w[j]||[]).filter(o=>o&&String(o).trim()!=="").length;t>c&&(c=t,s=j)}}return s})(),Oe=w[$e]||[],Te=Array.from({length:Ae}).map((s,c)=>{const v=Oe[c]?String(Oe[c]).trim():"";return{index:c,label:v||`Columna ${$t(c)}`}}),Re=Array.isArray(w)?w.slice($e+1).filter(s=>Array.isArray(s)&&s.some(c=>c!=null&&String(c).trim()!=="")):[],Le={};Re.forEach((s,c)=>{const v=s[ce],j=v!=null?String(v):"",t=(j.startsWith("=")?mt(j,w):j).trim()||`Fila ${c+1+$e+1}`,o=t.toUpperCase();if(o.includes("TOTAL")||o.includes("CÁLCULO")||o.includes("PROMEDIO")||o.includes("SUMA")||o.includes("CONCEPTO"))return;const l=s[K],i=l!=null?String(l):"",p=i.startsWith("=")?mt(i,w):i,b=parseFloat(String(p||"").replace(/[^0-9.\-]/g,"")),y=isNaN(b)?0:b;Le[t]||(Le[t]=[]),Le[t].push(y)});const we=Object.keys(Le).map(s=>{const c=Le[s];let v=0;return Se==="sum"?v=c.reduce((j,A)=>j+A,0):Se==="avg"?v=c.reduce((j,A)=>j+A,0)/c.length:Se==="count"&&(v=c.length),{label:s,val:Math.round(v*100)/100,count:c.length}}).filter(s=>s.label&&(s.val>0||Se==="count")),fe=we.length,re=we.map(s=>s.val),be=re.reduce((s,c)=>s+c,0),ke=fe>0?be/fe:0,oe=fe>0?Math.max(...re):0,We=fe>0?Math.min(...re):0,ue=re.indexOf(oe),Be=re.indexOf(We),Me=ue!==-1?we[ue].label:"---",Ge=Be!==-1?we[Be].label:"---";n.useEffect(()=>{var s;if(w&&w[0]&&w[0].length>1)for(let c=1;c<w[0].length;c++){let v=!1;for(let j=1;j<w.length;j++){const A=(s=w[j])==null?void 0:s[c],o=(A!=null?String(A):"").replace(/[^0-9.\-]/g,"");if(o&&!isNaN(parseFloat(o))){v=!0;break}}if(v){m(c);break}}},[w]);const Ce=s=>{const c={...d,[h]:s};C(c);const v=Object.keys(c),j=v.length>1||v[0]!=="Hoja 1";u(JSON.stringify(j?c:s))};n.useEffect(()=>{const s=v=>{if(!Array.isArray(v))return null;if(v.length===0)return[["","",""],["","",""],["","",""]];if(v.every(j=>Array.isArray(j)))return v.map(j=>j.map(A=>A==null?"":String(A)));if(v.every(j=>j&&typeof j=="object"&&!Array.isArray(j))){const j=Array.from(new Set(v.flatMap(A=>Object.keys(A))));if(j.length>0)return[j,...v.map(A=>j.map(t=>A[t]===null||A[t]===void 0?"":String(A[t])))]}return null},c=v=>{if(!v)return!1;const j=s(v);if(j)return C({"Hoja 1":j}),E("Hoja 1"),!0;if(typeof v=="object"&&!Array.isArray(v)){const A=v.sheets||v.rows||v.data;if(A)return c(A);const t=Object.keys(v);if(t.length>0){const o={};let l=!0;for(const i of t){const p=s(v[i]);if(!p){l=!1;break}o[i]=p}if(l)return C(o),o[h]||E(t[0]),!0}}return!1};if(a)if(typeof a!="string"){if(c(a))return}else{const v=a.trim().replace(/^```(?:json|csv)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim();try{const j=JSON.parse(v);if(c(j))return}catch(j){const A=v.indexOf("["),t=v.lastIndexOf("]");if(A!==-1&&t>A)try{const o=JSON.parse(v.slice(A,t+1));if(c(o))return}catch{}console.warn("Failed to parse excel content JSON, using fallback",j)}}C(v=>{var t,o,l,i;const j=Object.keys(v);return!v||j.length===0||j.length===1&&(((t=v["Hoja 1"])==null?void 0:t.length)<=1||((o=v["Hoja 1"])==null?void 0:o.length)===3&&((i=(l=v["Hoja 1"])==null?void 0:l[0])==null?void 0:i.every(p=>p==="")))?{"Hoja 1":[["Indicador","Meta","Resultado","Cumplimiento"],["Capacitaciones Realizadas","12","10","83.3%"],["Simulacros de Emergencia","2","2","100%"],["Inspecciones de Seguridad","24","18","75%"]]}:v})},[a]);const Ee=(s,c,v)=>{const j=w.map((A,t)=>A.map((o,l)=>t===s&&l===c?v:o));Ce(j)},Xe=(s,c)=>{var v;$({row:s,col:c}),Q(((v=w[s])==null?void 0:v[c])||"")},Ve=s=>{const c=s.target.value;Q(c),S&&Ee(S.row,S.col,c)},Qe=()=>{var j;const s=((j=w[0])==null?void 0:j.length)||3,c=Array(s).fill(""),v=[...w,c];Ce(v)},Ke=()=>{if(w.length<=1)return;const s=w.slice(0,-1);Ce(s),$(null)},Je=()=>{const s=w.map(c=>[...c,""]);Ce(s)},He=()=>{var c;if(((c=w[0])==null?void 0:c.length)<=1)return;const s=w.map(v=>v.slice(0,-1));Ce(s),$(null)},Ye=async()=>{var A;const s=new Da.Workbook,c=s.addWorksheet("Reporte Canvas");c.views=[{showGridLines:!0}],w.forEach((t,o)=>{const l=c.getRow(o+1);t.forEach((i,p)=>{const b=l.getCell(p+1);if(i&&String(i).startsWith("=")){const y=String(i).slice(1).trim().toUpperCase();b.value={formula:y}}else{const y=Number(i);i!==""&&!isNaN(y)?b.value=y:b.value=i}b.border={top:{style:"thin",color:{argb:"FFD1D5DB"}},left:{style:"thin",color:{argb:"FFD1D5DB"}},bottom:{style:"thin",color:{argb:"FFD1D5DB"}},right:{style:"thin",color:{argb:"FFD1D5DB"}}},o===0?(b.font={name:"Segoe UI",bold:!0,color:{argb:"FFFFFFFF"},size:11},b.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF0D9488"}},b.alignment={vertical:"middle",horizontal:"center"}):(b.font={name:"Segoe UI",size:10},b.alignment={vertical:"middle",horizontal:"left"},o%2===0&&(b.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF9FAFB"}}))})}),(A=c.columns)==null||A.forEach(t=>{var l;let o=0;(l=t.eachCell)==null||l.call(t,{includeEmpty:!0},i=>{const p=i.value?String(i.value):"";p.length>o&&(o=p.length)}),t.width=Math.max(o+4,12)});const v=await s.xlsx.writeBuffer(),j=new Blob([v],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});Vt.saveAs(j,`${r}.xlsx`)},N=()=>{if(!w||w.length===0)return;let s=`<table style="width: 100%; max-width: 100%; border-collapse: collapse; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1f2937; margin: 16px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">`;s+='<thead style="background-color: #0d9488; color: #ffffff; text-align: left; font-weight: bold;"><tr>',w[0].forEach(c=>{s+=`<th style="padding: 12px 16px; border-bottom: 2px solid #0f766e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;">${c||""}</th>`}),s+="</tr></thead>",s+="<tbody>",w.slice(1).forEach((c,v)=>{const j=v%2===0?"#ffffff":"#f9fafb";s+=`<tr style="background-color: ${j}; border-bottom: 1px solid #e5e7eb;">`,c.forEach(A=>{const t=A&&String(A).startsWith("=")?mt(String(A),w):A;s+=`<td style="padding: 10px 16px; vertical-align: middle;">${t||""}</td>`}),s+="</tr>"}),s+="</tbody></table>",navigator.clipboard.writeText(s).then(()=>{Ie(!0),setTimeout(()=>Ie(!1),2500)}).catch(c=>{console.error("No se pudo copiar el HTML al portapapeles:",c)})},k=(s,c,v)=>{let j=c,A=v;if(s.key==="ArrowUp")s.preventDefault(),j=Math.max(0,c-1);else if(s.key==="ArrowDown")s.preventDefault(),j=Math.min(w.length-1,c+1);else if(s.key==="ArrowLeft"){const t=s.currentTarget;if(t.selectionStart===0&&t.selectionEnd===0)s.preventDefault(),A=Math.max(0,v-1);else return}else if(s.key==="ArrowRight"){const t=s.currentTarget;if(t.selectionStart===t.value.length&&t.selectionEnd===t.value.length)s.preventDefault(),A=Math.min(w[0].length-1,v+1);else return}else if(s.key==="Enter")s.preventDefault(),j=Math.min(w.length-1,c+1);else if(s.key==="Tab")s.preventDefault(),s.shiftKey?A=Math.max(0,v-1):A=Math.min(w[0].length-1,v+1);else return;(j!==c||A!==v)&&($({row:j,col:A}),Q(w[j][A]||""),setTimeout(()=>{const t=document.getElementById(`cell-${j}-${A}`);t&&(t.focus(),t.select())},10))};return n.useEffect(()=>{g&&g(Ye)},[g,w,r]),e.jsxs("div",{ref:V,className:"flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex flex-col gap-2 p-3 border-b border-border-medium bg-surface-secondary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex items-center justify-center bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold h-8 w-12 rounded-lg border border-teal-500/20",children:S?`${$t(S.col)}${S.row+1}`:"---"}),e.jsxs("div",{className:"flex-1 relative flex items-center",children:[e.jsxs("span",{className:"absolute left-2.5 text-text-tertiary font-serif text-sm select-none",children:["ƒ",e.jsx("sub",{children:"x"})]}),e.jsx("input",{type:"text",value:ie,onChange:Ve,disabled:!S,placeholder:S?"Introduce datos o fórmula...":"Selecciona una celda para editar",className:"w-full h-8 pl-8 pr-3 text-xs bg-surface-primary border border-border-medium rounded-lg outline-none focus:border-teal-500 transition-colors"})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsx(de,{onClick:Qe,icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Agregar Fila",title:"Añadir nueva fila al final",variant:"emerald",size:"sm"}),e.jsx(de,{onClick:Ke,disabled:w.length<=1,icon:e.jsx(nt,{className:"h-4 w-4"}),label:"Quitar Fila",title:"Eliminar fila seleccionada o última fila",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium"}),e.jsx(de,{onClick:Je,icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Agregar Columna",title:"Añadir nueva columna a la derecha",variant:"emerald",size:"sm"}),e.jsx(de,{onClick:He,disabled:((se=w[0])==null?void 0:se.length)<=1,icon:e.jsx(nt,{className:"h-4 w-4"}),label:"Quitar Columna",title:"Eliminar columna seleccionada o última columna",variant:"danger",size:"sm"}),e.jsx("div",{className:"h-5 w-px bg-border-medium hidden sm:block"}),e.jsxs("div",{className:"relative",children:[e.jsx(de,{onClick:()=>{ge(s=>!s),D(!1)},icon:e.jsx(dt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Cargar matrices y presupuestos SG-SST con fórmulas automáticas",variant:"amber",size:"sm",isActive:xe}),xe&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Matrices y Hojas de Cálculo SG-SST"}),e.jsxs("button",{onClick:()=>{Ce([["Proceso / Área","Peligro (GTC-45)","Clasificación","ND","NE","NP (ND*NE)","NC","NR (NP*NC)","Control de Ingeniería / Medio"],["Operaciones / Planta","Levantamiento manual de cargas","Biomecánico","6","4","=D2*E2","25","=F2*G2","Ayudas mecánicas hidráulicas"],["Mantenimiento","Trabajos en alturas > 2.0m","Condiciones de Seguridad","6","3","=D3*E3","60","=F3*G3","Línea de vida certificada Res. 4272"],["Producción","Ruido continuo > 85 dBA","Físico","2","4","=D4*E4","25","=F4*G4","Encapsulamiento acústico en fuente"],["Administración","Carga mental y pantallas PVD","Psicosocial","2","3","=D5*E5","10","=F5*G5","Pausas activas y ajuste ergonómico"],["PROMEDIO / MÁXIMO RIESGO","-","-","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=MAX(G2:G5)","=MAX(H2:H5)","Intervención Prioritaria"]]),ge(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Matriz de Peligros GTC-45"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Cálculo automático de NP (ND*NE) y Nivel de Riesgo NR"})]}),e.jsxs("button",{onClick:()=>{Ce([["Rubro SG-SST (Dec. 1072)","Presupuesto Asignado ($)","Ejecutado Q1 ($)","Ejecutado Q2 ($)","Total Ejecutado ($)","Saldo Disponible ($)"],["Medicina Preventiva y EMO","4500000","1200000","1800000","=C2+D2","=B2-E2"],["Elementos de Protección EPP","6800000","2500000","2900000","=C3+D3","=B3-E3"],["Capacitación y Brigadas","3200000","900000","1400000","=C4+D4","=B4-E4"],["Mediciones Higiénicas","5000000","0","3500000","=C5+D5","=B5-E5"],["TOTAL PRESUPUESTO SST","=SUMA(B2:B5)","=SUMA(C2:C5)","=SUMA(D2:D5)","=SUMA(E2:E5)","=SUMA(F2:F5)"]]),ge(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Presupuesto Anual SG-SST"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Control de ejecución trimestral y saldo disponible"})]}),e.jsxs("button",{onClick:()=>{Ce([["Indicador Resolución 0312/2019","Meta (%)","Enero","Febrero","Marzo","Promedio Trimestral"],["Frecuencia de Accidentalidad","0","0","1","0","=PROMEDIO(C2:E2)"],["Severidad de Accidentalidad","0","0","3","0","=PROMEDIO(C3:E3)"],["Cumplimiento Plan de Trabajo","95","90","94","98","=PROMEDIO(C4:E4)"],["Cobertura Inducción SST","100","100","100","100","=PROMEDIO(C5:E5)"]]),ge(!1)},className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:"Indicadores Resolución 0312"}),e.jsx("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:"Frecuencia, severidad y cumplimiento trimestral"})]})]})]}),e.jsxs("div",{className:"relative",children:[e.jsx(de,{onClick:()=>{D(s=>!s),ge(!1)},icon:e.jsx(Ra,{className:"h-4 w-4"}),label:"Insertar Fórmula",title:"Insertar fórmula automática en la celda activa (=SUMA, =PROMEDIO, =MAX, =MIN)",variant:"purple",size:"sm",isActive:ee}),ee&&e.jsxs("div",{className:"absolute left-0 mt-2 w-60 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Fórmulas en Celda Activa"}),[{fn:"=SUMA(B2:B5)",desc:"Suma de rango vertical"},{fn:"=PROMEDIO(B2:B5)",desc:"Promedio aritmético"},{fn:"=MAX(B2:B5)",desc:"Valor máximo del rango"},{fn:"=MIN(B2:B5)",desc:"Valor mínimo del rango"},{fn:"=CONTAR(B2:B5)",desc:"Conteo de registros"}].map(s=>e.jsxs("button",{onClick:()=>{const c=(S==null?void 0:S.row)??w.length-1,v=(S==null?void 0:S.col)??1;Ee(c,v,s.fn),Q(s.fn),D(!1)},className:"w-full text-left px-3 py-1.5 rounded-xl hover:bg-purple-500/10 transition-colors flex items-center justify-between cursor-pointer",children:[e.jsx("span",{className:"text-xs font-mono font-bold text-purple-600 dark:text-purple-400",children:s.fn}),e.jsx("span",{className:"text-[10px] text-text-tertiary",children:s.desc})]},s.fn))]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(de,{onClick:N,icon:e.jsx(At,{className:"h-4 w-4"}),label:"Copiar Tabla",title:"Copiar tabla formateada para pegar en un Documento o Informe",variant:"fuchsia",size:"sm"}),e.jsx(de,{onClick:()=>W(!q),icon:e.jsx(za,{className:"h-4 w-4"}),label:"Analizar y Graficar",title:"Abrir centro de análisis estadístico y gráficos interactivos",variant:"orange",size:"sm",isActive:q}),f&&e.jsx(de,{onClick:z,icon:O?e.jsx(Gt,{className:"h-4 w-4"}):e.jsx(fa,{className:"h-4 w-4"}),label:O?"Salir":"Pantalla Completa",title:O?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"}),e.jsx(de,{onClick:Ye,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Descargar Hoja",title:"Descargar hoja de cálculo con formato corporativo",variant:"green",size:"sm"})]})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden relative",children:[e.jsxs("div",{className:"flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-secondary/40",children:[e.jsx("div",{className:"flex-1 overflow-auto p-4",ref:U,children:e.jsx("div",{className:"inline-block min-w-full align-middle border border-border-medium rounded-xl shadow-sm overflow-hidden bg-surface-primary",children:e.jsxs("table",{className:"min-w-full border-collapse text-left font-sans text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-surface-secondary select-none",children:[e.jsx("th",{className:"w-10 border-r border-b border-border-medium text-center font-mono font-bold text-text-tertiary p-1.5"}),(_=w[0])==null?void 0:_.map((s,c)=>e.jsx("th",{className:"border-r border-b border-border-medium text-center font-mono font-bold text-text-secondary px-3 py-1.5 min-w-[120px]",children:$t(c)},c))]})}),e.jsx("tbody",{children:w.map((s,c)=>e.jsxs("tr",{className:"hover:bg-surface-hover/30 transition-colors",children:[e.jsx("td",{className:"border-r border-b border-border-medium text-center font-mono font-bold bg-surface-secondary text-text-tertiary select-none p-1.5",children:c+1}),s.map((v,j)=>{const A=(S==null?void 0:S.row)===c&&(S==null?void 0:S.col)===j,t=A?v:mt(v,w);return e.jsx("td",{onClick:()=>Xe(c,j),className:`border-r border-b border-border-medium px-3 py-2 cursor-pointer transition-all ${A?"bg-teal-500/10 outline outline-2 outline-teal-500 z-10":"hover:bg-teal-500/5"}`,children:e.jsx("input",{id:`cell-${c}-${j}`,type:"text",value:t,onFocus:()=>Xe(c,j),onKeyDown:o=>k(o,c,j),onChange:o=>{Ee(c,j,o.target.value),Q(o.target.value)},className:"w-full bg-transparent border-none outline-none text-text-primary cursor-pointer focus:cursor-text"})},j)})]},c))})]})})}),e.jsxs("div",{className:"flex items-center justify-between border-t border-border-medium bg-surface-secondary px-4 py-2 mt-auto select-none",children:[e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto py-1 max-w-[80%] pr-2 scrollbar-none",children:Object.keys(d).map(s=>{const c=h===s;return e.jsxs("button",{onClick:()=>{E(s),$(null)},className:`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 cursor-pointer ${c?"bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-bold shadow-sm":"bg-transparent border border-transparent text-text-secondary hover:text-text-primary"}`,children:[e.jsx(ft,{className:`h-3.5 w-3.5 ${c?"text-teal-500":"text-text-secondary"}`}),e.jsx("span",{children:s})]},s)})}),e.jsxs("div",{className:"flex items-center gap-2",children:[fe>0&&e.jsxs("div",{className:"hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl border border-teal-500/20 bg-teal-500/5 text-[10px] font-mono font-bold text-text-secondary",children:[e.jsxs("span",{children:["Suma: ",e.jsx("strong",{className:"text-teal-600 dark:text-teal-400",children:be.toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Prom: ",e.jsx("strong",{className:"text-emerald-600 dark:text-emerald-400",children:(Math.round(ke*100)/100).toLocaleString()})]}),e.jsx("span",{className:"opacity-30",children:"|"}),e.jsxs("span",{children:["Filas: ",e.jsx("strong",{children:w.length})]})]}),e.jsx(de,{onClick:()=>{const s=`Hoja ${Object.keys(d).length+1}`,c={...d,[s]:[["","",""],["","",""],["","",""]]};C(c),E(s),$(null),u(JSON.stringify(c))},icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Nueva Hoja",title:"Añadir nueva pestaña de cálculo",variant:"emerald",size:"sm"}),Object.keys(d).length>1&&e.jsx(de,{onClick:()=>{const s=Object.keys(d),c=s.indexOf(h),v={...d};delete v[h];const j=s[c-1]||s[c+1]||Object.keys(v)[0];C(v),E(j),$(null);const A=Object.keys(v),t=A.length>1||A[0]!=="Hoja 1";u(JSON.stringify(t?v:v[j]))},icon:e.jsx(nt,{className:"h-4 w-4"}),label:"Eliminar Hoja",title:"Eliminar pestaña actual",variant:"danger",size:"sm"})]})]})]}),q&&Et.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6 font-sans",children:[e.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:()=>W(!1)}),e.jsxs("div",{className:"relative w-full max-w-5xl h-[85vh] bg-surface-primary border border-border-light rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:"flex items-center justify-between px-6 py-5 border-b border-border-light bg-surface-secondary/30",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"p-2.5 bg-teal-100 dark:bg-teal-900/30 text-teal-600 rounded-[14px]",children:e.jsx(ua,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsxs("h2",{className:"font-bold text-xl text-text-primary tracking-tight flex items-center gap-1.5",children:["Análisis de Datos ",e.jsx(_e,{className:"h-4 w-4 text-amber-500 animate-pulse"})]}),e.jsx("p",{className:"text-xs text-text-secondary mt-0.5 font-medium",children:"Análisis estadístico, indicadores en tiempo real y gráficos interactivos"})]})]}),e.jsx("button",{onClick:()=>W(!1),className:"p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer",children:e.jsx(tt,{className:"w-5 h-5 text-text-secondary"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 bg-surface-primary grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0",children:[e.jsxs("div",{className:"lg:col-span-4 flex flex-col space-y-4 max-h-full overflow-y-auto pr-1",children:[e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3.5 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Dimensiones de Gráfico"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje X (Etiqueta)"}),e.jsx("select",{value:ce,onChange:s=>J(parseInt(s.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Te.map(s=>e.jsx("option",{value:s.index,children:s.label},s.index))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1",children:"Eje Y (Valor)"}),e.jsx("select",{value:K,onChange:s=>m(parseInt(s.target.value)),className:"w-full text-xs bg-surface-primary border border-border-medium rounded-lg p-2 outline-none focus:border-teal-500 transition-colors cursor-pointer",children:Te.map(s=>e.jsx("option",{value:s.index,children:s.label},s.index))})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Operación de Análisis"}),e.jsx("div",{className:"flex bg-surface-primary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["sum","avg","count"].map(s=>e.jsx("button",{onClick:()=>Fe(s),className:`flex-1 text-center py-1.5 text-[10px] font-bold rounded-lg uppercase transition-all cursor-pointer ${Se===s?"bg-teal-600 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:s==="sum"?"Suma":s==="avg"?"Promedio":"Frecuencia"},s))})]}),e.jsx("div",{className:"flex bg-surface-secondary border border-border-medium rounded-xl p-1 shadow-sm shrink-0",children:["bar","line","area","pie"].map(s=>e.jsx("button",{onClick:()=>me(s),className:`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${ae===s?"bg-teal-500 text-white shadow-sm":"text-text-secondary hover:bg-surface-hover"}`,children:s==="bar"?"Barras":s==="line"?"Líneas":s==="area"?"Área":"Torta"},s))}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Indicadores del Eje Y"}),e.jsxs("div",{className:"grid grid-cols-2 gap-2.5",children:[e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Total Suma"}),e.jsx("span",{className:"text-sm font-bold text-text-primary mt-1 font-mono",children:be.toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Promedio"}),e.jsx("span",{className:"text-sm font-bold text-teal-600 mt-1 font-mono",children:(Math.round(ke*100)/100).toLocaleString()})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-xl p-3 shadow-sm flex flex-col justify-between col-span-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-[9px] text-text-tertiary font-bold uppercase tracking-wide",children:"Límites Máx/Mín"}),e.jsxs("span",{className:"text-[9px] bg-teal-500/10 text-teal-600 px-1.5 py-0.5 rounded-full font-mono font-semibold",children:["Regs: ",fe]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border-medium/30",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Máx: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:Me})]}),e.jsx("span",{className:"text-xs font-bold text-green-600 font-mono",children:oe.toLocaleString()})]}),e.jsxs("div",{className:"border-l border-border-medium/30 pl-2",children:[e.jsxs("span",{className:"text-[9px] text-text-tertiary block",children:["Mín: ",e.jsx("strong",{className:"text-text-secondary truncate block max-w-[80px]",children:Ge})]}),e.jsx("span",{className:"text-xs font-bold text-red-500 font-mono",children:We.toLocaleString()})]})]})]})]})]}),e.jsxs("div",{className:"bg-surface-secondary/40 border border-border-light rounded-2xl p-4 space-y-3 shadow-sm flex flex-col min-h-[160px]",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary tracking-tight block",children:"Tabla de Distribución"}),e.jsx("div",{className:"flex-1 overflow-y-auto border border-border-medium rounded-xl bg-surface-primary shadow-sm max-h-[180px]",children:e.jsxs("table",{className:"w-full text-left font-sans text-[11px] border-collapse",children:[e.jsx("thead",{className:"bg-surface-secondary sticky top-0 font-bold text-text-secondary select-none border-b border-border-medium z-10",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-2",children:"Categoría"}),e.jsx("th",{className:"p-2 text-right",children:"Valor"}),e.jsx("th",{className:"p-2 text-right",children:"% Part."})]})}),e.jsx("tbody",{children:we.map((s,c)=>{const v=be>0?s.val/be*100:0;return e.jsxs("tr",{className:"border-b border-border-medium hover:bg-surface-hover/20",children:[e.jsx("td",{className:"p-2 font-medium text-text-primary max-w-[120px] truncate",title:s.label,children:s.label}),e.jsx("td",{className:"p-2 text-right font-mono text-text-secondary",children:s.val.toLocaleString()}),e.jsxs("td",{className:"p-2 text-right font-mono text-teal-600 font-semibold",children:[Math.round(v),"%"]})]},c)})})]})})]}),e.jsxs("button",{onClick:N,className:"w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 font-bold text-xs tracking-wide uppercase transition-all shadow-sm cursor-pointer",children:[e.jsx(At,{className:"h-4 w-4"}),"Copiar Tabla como HTML Premium"]})]}),e.jsx("div",{className:"lg:col-span-8 bg-surface-secondary/40 border border-border-light rounded-2xl p-5 flex flex-col items-center justify-center min-h-[350px] relative shadow-sm overflow-hidden",children:fe===0?e.jsxs("div",{className:"text-center py-8 text-text-tertiary",children:[e.jsx(Oa,{className:"h-8 w-8 mx-auto mb-2 text-text-tertiary/50"}),e.jsx("p",{className:"text-xs",children:"No hay datos válidos para graficar con la operación seleccionada."})]}):e.jsxs("svg",{width:"100%",height:"100%",viewBox:"0 0 500 280",className:"overflow-visible w-full max-h-[380px]",onMouseLeave:()=>Y(null),children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"barGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#10b981"}),e.jsx("stop",{offset:"100%",stopColor:"#3b82f6"})]}),e.jsxs("linearGradient",{id:"lineGradient",x1:"0",y1:"0",x2:"1",y2:"0",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6"}),e.jsx("stop",{offset:"100%",stopColor:"#ec4899"})]}),e.jsxs("linearGradient",{id:"areaGradient",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#8b5cf6",stopOpacity:"0.4"}),e.jsx("stop",{offset:"100%",stopColor:"#8b5cf6",stopOpacity:"0.0"})]}),e.jsx("filter",{id:"shadow",x:"-10%",y:"-10%",width:"120%",height:"120%",children:e.jsx("feDropShadow",{dx:"0",dy:"4",stdDeviation:"4",floodOpacity:"0.1"})})]}),ae==="bar"&&(()=>{const A=Math.min(36,430/fe*.7),t=430/fe;return we.map((o,l)=>{const i=oe>0?o.val/oe*220:0,p=45+l*t+(t-A)/2,b=235-i,y=L===l;return e.jsxs("g",{children:[e.jsx("rect",{x:p,y:b,width:A,height:Math.max(2,i),fill:"url(#barGradient)",rx:"4",className:"transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-500",style:{transformOrigin:`${p+A/2}px ${b+i}px`,opacity:L===null||y?1:.6,filter:y?"url(#shadow)":"none",transform:y?"scale(1.05)":"scale(1)"},onMouseEnter:R=>{Y(l),X({x:R.clientX,y:R.clientY})},onMouseMove:R=>{X({x:R.clientX,y:R.clientY})}}),fe<=15&&e.jsx("text",{x:p+A/2,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:o.label.length>9?`${o.label.slice(0,8)}.`:o.label})]},l)})})(),(ae==="line"||ae==="area")&&(()=>{const A=fe>1?430/(fe-1):430,t=we.map((i,p)=>{const b=45+p*A,y=235-(oe>0?i.val/oe*220:0);return{x:b,y}});let o="";if(t.length>0){o=`M ${t[0].x} ${t[0].y}`;for(let i=1;i<t.length;i++){const p=t[i-1],b=t[i],y=p.x+A/3,R=p.y,ye=b.x-A/3,pe=b.y;o+=` C ${y} ${R}, ${ye} ${pe}, ${b.x} ${b.y}`}}const l=t.length>0?`${o} L ${t[t.length-1].x} 235 L ${t[0].x} 235 Z`:"";return e.jsxs("g",{children:[ae==="area"&&t.length>0&&e.jsx("path",{d:l,fill:"url(#areaGradient)",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.length>0&&e.jsx("path",{d:o,fill:"none",stroke:"url(#lineGradient)",strokeWidth:"3.5",strokeLinecap:"round",className:"transition-all duration-500 animate-in fade-in duration-500"}),t.map((i,p)=>{const b=L===p;return e.jsx("circle",{cx:i.x,cy:i.y,r:b?6:4,fill:b?"#ec4899":"#8b5cf6",stroke:"white",strokeWidth:"1.5",className:"transition-all duration-150 cursor-pointer shadow-sm",style:{filter:b?"url(#shadow)":"none"},onMouseEnter:y=>{Y(p),X({x:y.clientX,y:y.clientY})},onMouseMove:y=>{X({x:y.clientX,y:y.clientY})}},p)}),fe<=15&&t.map((i,p)=>e.jsx("text",{x:i.x,y:251,textAnchor:"middle",fill:"currentColor",className:"text-[9px] font-mono text-text-tertiary select-none",children:we[p].label.length>9?`${we[p].label.slice(0,8)}.`:we[p].label},`lbl-${p}`))]})})(),ae==="pie"&&(()=>{let j=0;return we.map((A,t)=>{if(be===0)return null;const l=A.val/be*360,i=240+100*Math.cos((j-90)*Math.PI/180),p=125+100*Math.sin((j-90)*Math.PI/180);j+=l;const b=240+100*Math.cos((j-90)*Math.PI/180),y=125+100*Math.sin((j-90)*Math.PI/180),R=l>180?1:0,ye=`
                            M 240 125
                            L ${i} ${p}
                            A 100 100 0 ${R} 1 ${b} ${y}
                            Z
                          `,pe=["#0d9488","#06b6d4","#3b82f6","#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#14b8a6"],Ne=pe[t%pe.length],x=L===t,T=j-l/2-90,P=x?8:0,F=`translate(${P*Math.cos(T*Math.PI/180)}px, ${P*Math.sin(T*Math.PI/180)}px)`;return e.jsx("path",{d:ye,fill:Ne,stroke:"white",strokeWidth:"1.5",className:"transition-all duration-300 cursor-pointer animate-in fade-in duration-500",style:{transform:F,opacity:L===null||x?1:.7,filter:x?"url(#shadow)":"none"},onMouseEnter:M=>{Y(t),X({x:M.clientX,y:M.clientY})},onMouseMove:M=>{X({x:M.clientX,y:M.clientY})}},t)})})()]})})]})]})]}),document.body)]}),L!==null&&q&&we[L]&&e.jsxs("div",{className:"fixed z-[99999999] pointer-events-none backdrop-blur-md bg-surface-primary/95 border border-border-medium rounded-xl p-2.5 shadow-xl text-xs font-sans text-text-primary flex flex-col gap-1",style:{left:he.x+15,top:he.y-10},children:[e.jsx("span",{className:"font-bold text-text-secondary",children:we[L].label}),e.jsxs("span",{className:"text-teal-600 dark:text-teal-400 font-mono text-sm font-semibold",children:["Valor: ",we[L].val.toLocaleString()]})]}),le&&e.jsxs("div",{className:"fixed bottom-5 right-5 z-[99999] bg-emerald-600 text-white rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2.5 border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans",children:[e.jsx(_e,{className:"h-4 w-4 text-emerald-300 animate-spin"}),e.jsx("span",{className:"text-xs font-bold",children:"¡Tabla HTML copiada al portapapeles con éxito!"})]})]})};function I(a){return a?String(a).replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim():""}function Pr(a){if(!a||typeof a!="string")return null;try{const f=JSON.parse(a);if(Array.isArray(f))return f;if(f&&Array.isArray(f.slides))return f.slides;if(f&&Array.isArray(f.presentation))return f.presentation;if(f&&Array.isArray(f.deck))return f.deck}catch{}const u=a.indexOf("["),r=a.lastIndexOf("]");if(u===-1||r===-1||u>r)return null;const g=a.slice(u,r+1);try{const f=JSON.parse(g);if(Array.isArray(f))return f}catch{try{let d=g.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(?:^|\s)\/\/.*$/gm,"");d=d.replace(/,\s*\]/g,"]").replace(/,\s*\}/g,"}");const C=JSON.parse(d);if(Array.isArray(C))return C}catch(d){console.error("Failed both standard and cleaned JSON extraction for slides:",d)}}return null}function Lt(a,u){var w;const r=a&&typeof a=="object"&&!Array.isArray(a)?a:{title:String(a||`Diapositiva ${u+1}`)},g=Array.isArray(r==null?void 0:r.bullets)?r.bullets.map(S=>String(S||"").trim()).filter(Boolean):typeof(r==null?void 0:r.content)=="string"&&r.content.trim()?r.content.split(/\n|•|-/).map(S=>S.trim()).filter(Boolean):["Indicador clave de gestión SG-SST","Control operativo verificado en campo"];let f=r==null?void 0:r.chartConfig;if(f&&typeof f=="object"){let S=Array.isArray(f.data)?f.data:[];S.length===0&&Array.isArray(f.labels)&&Array.isArray(f.datasets)&&Array.isArray((w=f.datasets[0])==null?void 0:w.data)&&(S=f.labels.map(($,ie)=>({label:String($??""),val:Number(f.datasets[0].data[ie]||0)}))),f={type:f.type==="doughnut"?"pie":f.type||"bar",title:String(f.title||(r==null?void 0:r.title)||"Análisis Cuantitativo"),data:S,labels:f.labels,datasets:f.datasets}}else f=void 0;const d=Array.isArray(r==null?void 0:r.kpis)?r.kpis:Array.isArray(r==null?void 0:r.metrics)?r.metrics:void 0,C=d?d.filter(S=>S&&typeof S=="object").map(S=>({label:String(S.label??""),value:String(S.value??""),delta:S.delta!=null?String(S.delta):void 0,trend:S.trend,description:S.description!=null?String(S.description):void 0})):void 0,h=Array.isArray(r==null?void 0:r.columns)?r.columns.filter(S=>S&&typeof S=="object").map(S=>({title:String(S.title??""),badge:S.badge!=null?String(S.badge):void 0,theme:S.theme,items:Array.isArray(S.items)?S.items.map($=>String($??"")):typeof S.items=="string"&&S.items.trim()?[S.items.trim()]:[]})):void 0,E=Array.isArray(r==null?void 0:r.steps)?r.steps.filter(S=>S&&typeof S=="object").map((S,$)=>({phase:String(S.phase??`PASO 0${$+1}`),title:String(S.title??""),detail:String(S.detail??S.description??"")})):void 0;return{title:String((r==null?void 0:r.title)||`Diapositiva ${u+1}`),subtitle:String((r==null?void 0:r.subtitle)||""),kicker:String((r==null?void 0:r.kicker)||(r==null?void 0:r.badge)||""),bullets:g.length>0?g:["Punto estratégico"],theme:(r==null?void 0:r.theme)||(u===0?"wappy-dark":"cobalt"),layout:(r==null?void 0:r.layout)||(u===0?"title":"bullets"),imageUrl:String((r==null?void 0:r.imageUrl)||""),tableHtml:String((r==null?void 0:r.tableHtml)||""),chartConfig:f,kpis:C,columns:h,steps:E,quote:String((r==null?void 0:r.quote)||""),citation:String((r==null?void 0:r.citation)||(r==null?void 0:r.normativeRef)||""),takeaway:String((r==null?void 0:r.takeaway)||""),speakerNotes:String((r==null?void 0:r.speakerNotes)||"")}}const De={"wappy-dark":{label:"WAPPY Dark Tech",bg:"bg-gradient-to-br from-[#080d02] via-[#0e1705] to-[#071614]",text:"text-white",subtext:"text-slate-300",accent:"text-[#c7f303]",accentBg:"bg-[#c7f303]/15 border-[#c7f303]/40 text-[#c7f303]",border:"border-[#c7f303]/30",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0B1304",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"C7F303",pptCardBg:"15220A",pptCardBorder:"2D4A18"},"wappy-cream":{label:"WAPPY Editorial Cream",bg:"bg-gradient-to-br from-[#faf9f5] via-[#f4f2ea] to-[#e9e5d8]",text:"text-[#0e1300]",subtext:"text-slate-600",accent:"text-[#0d9488]",accentBg:"bg-teal-500/10 border-teal-500/30 text-teal-800",border:"border-teal-600/25",cardBg:"bg-white/85 border-slate-300/80 shadow-sm",isLight:!0,pptBg:"F6F5EF",pptText:"0E1300",pptSubtext:"475569",pptAccent:"0D9488",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"corporate-light":{label:"McKinsey Light",bg:"bg-gradient-to-br from-white via-slate-50 to-blue-50/60",text:"text-slate-900",subtext:"text-slate-600",accent:"text-blue-700",accentBg:"bg-blue-600/10 border-blue-600/30 text-blue-800",border:"border-blue-500/25",cardBg:"bg-white/90 border-slate-200 shadow-sm",isLight:!0,pptBg:"F8FAFC",pptText:"0F172A",pptSubtext:"475569",pptAccent:"1D4ED8",pptCardBg:"FFFFFF",pptCardBorder:"CBD5E1"},"emerald-sst":{label:"Esmeralda SG-SST",bg:"bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-950",text:"text-white",subtext:"text-emerald-100/80",accent:"text-teal-300",accentBg:"bg-teal-400/15 border-teal-400/35 text-teal-300",border:"border-teal-500/35",cardBg:"bg-white/[0.06] border-teal-400/20",isLight:!1,pptBg:"042F2E",pptText:"FFFFFF",pptSubtext:"CCFBF1",pptAccent:"2DD4BF",pptCardBg:"064E3B",pptCardBorder:"0F766E"},cobalt:{label:"Cobalto Ejecutivo",bg:"bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950",text:"text-white",subtext:"text-blue-100/80",accent:"text-cyan-400",accentBg:"bg-cyan-500/15 border-cyan-500/35 text-cyan-300",border:"border-blue-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"0F172A",pptText:"FFFFFF",pptSubtext:"CBD5E1",pptAccent:"38BDF8",pptCardBg:"1E293B",pptCardBorder:"334155"},forest:{label:"Bosque Bio-SST",bg:"bg-gradient-to-br from-emerald-950 via-green-950 to-slate-900",text:"text-white",subtext:"text-emerald-100/80",accent:"text-emerald-400",accentBg:"bg-emerald-500/15 border-emerald-500/35 text-emerald-300",border:"border-emerald-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"064E3B",pptText:"FFFFFF",pptSubtext:"D1FAE5",pptAccent:"34D399",pptCardBg:"065F46",pptCardBorder:"059669"},sunset:{label:"Ámbar Alerta",bg:"bg-gradient-to-br from-amber-950 via-rose-950 to-slate-950",text:"text-white",subtext:"text-rose-100/80",accent:"text-amber-400",accentBg:"bg-amber-500/15 border-amber-500/35 text-amber-300",border:"border-rose-500/35",cardBg:"bg-white/[0.06] border-white/10",isLight:!1,pptBg:"451A03",pptText:"FFFFFF",pptSubtext:"FDE68A",pptAccent:"FBBF24",pptCardBg:"78350F",pptCardBorder:"B45309"},charcoal:{label:"Carbón Minimal",bg:"bg-gradient-to-br from-zinc-900 via-neutral-900 to-black",text:"text-white",subtext:"text-zinc-300",accent:"text-teal-400",accentBg:"bg-teal-500/15 border-teal-500/35 text-teal-300",border:"border-zinc-700",cardBg:"bg-white/[0.05] border-white/10",isLight:!1,pptBg:"18181B",pptText:"FFFFFF",pptSubtext:"D4D4D8",pptAccent:"2DD4BF",pptCardBg:"27272A",pptCardBorder:"3F3F46"}},la=[{key:"title",label:"Portada",desc:"Lámina principal de apertura"},{key:"kpi-grid",label:"Tarjetas KPI",desc:"Métricas e indicadores clave"},{key:"columns",label:"Comparativa",desc:"2 o 3 columnas ejecutivas"},{key:"timeline",label:"Hoja de Ruta",desc:"Fases o Ciclo PHVA"},{key:"bullets",label:"Puntos Clave",desc:"Tarjetas de síntesis ejecutiva"},{key:"table",label:"Matriz / Tabla",desc:"Tabla técnica estructurada"},{key:"chart",label:"Gráfico Datos",desc:"Visualización estadística"},{key:"quote",label:"Cita Legal",desc:"Fundamento normativo SST"},{key:"split",label:"Split Imagen",desc:"Evidencia visual + análisis"},{key:"media",label:"Full Media",desc:"Fondo visual inmersivo"}],Mt=[{id:"rendicion-alta-direccion",name:"Rendición de Cuentas Alta Dirección (Dec. 1072)",category:"Gerencial",slides:[{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora Continua",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Revisión integral del Sistema de Gestión de Seguridad y Salud en el Trabajo","Cumplimiento de Estándares Mínimos Resolución 0312 de 2019"],takeaway:"Presentación oficial para aprobación y firma de la Alta Dirección.",speakerNotes:"Dar la bienvenida al comité directivo y presentar el balance anual del SG-SST."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Cumplimiento Estándares 0312: 94.5% (Nivel Aceptable)","ejecución del Plan de Trabajo Anual: 92% de actividades cerradas","Índice de Frecuencia ATEL: Reducción del 35% frente al periodo anterior","Cobertura de Capacitación y Entrenamiento: 100% del personal operativo"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La inversión en prevención en la fuente redujo los días perdidos por incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",subtitle:"Comparativa de cierre de brechas críticas identificadas en la Matriz GTC-45",kicker:"GESTIÓN DE PELIGROS Y RIESGOS",layout:"columns",theme:"emerald-sst",bullets:["Sustitución de manipulación manual de cargas por ayudas mecánicas","Digitalización de permisos de trabajo de alto riesgo en WAPPY"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas en bodega.","Registros en papel sin trazabilidad en tiempo real para trabajo en alturas.","Fatiga postural reportada en el 38% de los cargos operativos."]},{title:"Intervención Ejecutada (Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Implementación de estibadores hidráulicos y mesas niveladoras ergonómicas.","Control digital de listas de chequeo y permisos en WAPPY IA.","Programa de vigilancia epidemiológica osteomuscular con cobertura 100%."]}],takeaway:"El 100% de los peligros Nivel I fueron intervenidos con medidas de ingeniería y administrativas."},{title:"Evolución trimestral del cumplimiento normativo vs accidentalidad",subtitle:"Tendencia histórica verificada por el COPASST y la ARL",kicker:"ANALÍTICA DE TENDENCIAS",layout:"chart",theme:"cobalt",bullets:["Crecimiento sostenido en el cierre de hallazgos ACPM durante los 4 trimestres.","Correlación directa entre capacitación práctica y cero accidentes en Q4."],chartConfig:{type:"bar",title:"% Cumplimiento del Cronograma SG-SST por Trimestre",data:[{label:"Trimestre 1",val:78},{label:"Trimestre 2",val:85},{label:"Trimestre 3",val:91},{label:"Trimestre 4",val:95}]},takeaway:"Meta para el próximo ciclo: sostener el cumplimiento por encima del 96% mensual."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo Fiscal",subtitle:"Prioridades aprobadas para presupuesto y recursos técnicos",kicker:"PLAN DE MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Q1: Actualización de matriz legal, medición higiénica de iluminación y ruido","Q2: Aplicación de Batería de Riesgo Psicosocial y talleres de liderazgo","Q3: Simulacro general de emergencias y auditoría interna cruzada","Q4: Evaluación de eficacia de SVE y revisión por la Alta Dirección"],steps:[{phase:"FASE 1 · PLANEAR (Q1)",title:"Diagnóstico e Higiene Industrial",detail:"Actualización GTC-45, matriz legal y mediciones ambientales con ARL."},{phase:"FASE 2 · HACER (Q2)",title:"Intervención Psicosocial y Biomecánica",detail:"Ejecución de SVE, pausas activas dirigidas y formación de brigadistas."},{phase:"FASE 3 · VERIFICAR (Q3)",title:"Auditoría Interna e Inspecciones",detail:"Verificación de cumplimiento Decreto 1072 y simulacro de evacuación."},{phase:"FASE 4 · ACTUAR (Q4)",title:"Cierre de ACPM y Certificación",detail:"Cierre del 100% de acciones correctivas y reporte al Ministerio/ARL."}],takeaway:"Presupuesto requerido: asignación del 100% de recursos para controles prioritarios."},{title:"Responsabilidad legal indelegable de la Alta Dirección en la prevención",kicker:"FUNDAMENTO JURÍDICO",layout:"quote",theme:"wappy-dark",quote:"El empleador está obligado a la protección de la seguridad y la salud de los trabajadores, acorde con lo establecido en la normatividad vigente, asegurando la asignación de recursos financieros, técnicos y el personal necesario.",citation:"Decreto Único Reglamentario 1072 de 2015 — Artículo 2.2.4.6.8 (Obligaciones de los Empleadores)",bullets:["Prevención de culpa patronal (Art. 216 del Código Sustantivo del Trabajo).","Blindaje jurídico ante inspecciones del Ministerio del Trabajo."],takeaway:"La firma del acta de revisión gerencial formaliza el compromiso institucional."}]},{id:"induccion-sgsst",name:"Inducción y Reinducción Corporativa SG-SST",category:"Capacitación",slides:[{title:"Inducción General al Sistema de Gestión SG-SST",subtitle:"Política de Seguridad, Derechos, Deberes, Peligros Prioritarios y Actuación ante Emergencias",kicker:"BIENVENIDA Y CULTURA DE AUTOCUIDADO",layout:"title",theme:"emerald-sst",bullets:["Conoce los riesgos de tu cargo y cómo protegemos tu vida todos los días"],takeaway:"En nuestra empresa ninguna meta operativa está por encima de tu seguridad."},{title:"Nuestros 4 Pilares de Cultura Preventiva y Cero Daño",kicker:"POLÍTICA INTEGRAL SG-SST",layout:"kpi-grid",theme:"wappy-cream",bullets:["Meta Cero Accidentes Graves o Mortales","100% Reporte de Condiciones Inseguras","Comités Activos: COPASST y Convivencia Laboral","Cobertura ARL desde el primer día de ingreso"],kpis:[{label:"Meta Siniestralidad",value:"0 ATEL",delta:"Prioridad Vida",trend:"up",description:"Todo accidente es 100% prevenible"},{label:"Comités Paritarios",value:"2 Comités",delta:"COPASST + CCL",trend:"neutral",description:"Canales de participación activa"},{label:"Protección ARL",value:"100%",delta:"Cobertura 24/7 laboral",trend:"up",description:"Asistencia médica y económica"},{label:"Reporte Preventivo",value:"< 5 min",delta:"Vía WAPPY IA",trend:"up",description:"Reporta actos y condiciones inseguras"}],takeaway:"Tu participación activa es el motor del Sistema de Gestión."},{title:"Derechos y Responsabilidades Legales del Trabajador",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.10",layout:"columns",theme:"corporate-light",bullets:["Equilibrio entre garantías laborales y deberes de autocuidado"],columns:[{title:"Tus Derechos en SST",badge:"Garantías del Empleador",theme:"info",items:["Recibir elementos de protección personal (EPP) certificados y sin costo.","Capacitación continua y ambientes de trabajo seguros y saludables.","Atención médica oportuna a través de la ARL ante cualquier incidente."]},{title:"Tus Deberes Legales (Art. 2.2.4.6.10)",badge:"Cumplimiento Obligatorio",theme:"success",items:["Procurar el cuidado integral de tu salud y suministrar información clara.","Cumplir las normas, reglamentos e instrucciones del SG-SST.","Informar inmediatamente todo accidente, incidente o condición peligrosa."]}],takeaway:"El autocuidado es un deber legal y ético con tu familia y tus compañeros."},{title:"Protocolo de Actuación en Caso de Accidente o Emergencia",kicker:"RUTA DE RESPUESTA INMEDIATA",layout:"timeline",theme:"wappy-dark",bullets:["Pasos inmediatos ante cualquier evento en el lugar de trabajo"],steps:[{phase:"PASO 1 · ALERTA INMEDIATA",title:"Detén la labor y avisa a tu jefe inmediato",detail:"Todo evento, por leve que parezca, debe reportarse el mismo día."},{phase:"PASO 2 · PRIMEROS AUXILIOS",title:"Activación de la Brigada de Emergencia",detail:"Valoración primaria en sitio y estabilización sin mover al lesionado grave."},{phase:"PASO 3 · REPORTE ARL",title:"Línea de atención ARL y traslado médico",detail:"Radicación del FURAT dentro de las 48 horas hábiles legales."},{phase:"PASO 4 · INVESTIGACIÓN",title:"Lecciones aprendidas (Res. 1401 de 2007)",detail:"Identificación de causas raíz para evitar que vuelva a ocurrir."}],takeaway:"Recuerda: Nunca ocultes un incidente; reportarlo a tiempo salva vidas."}]},{id:"investigacion-atel",name:"Informe de Investigación de Accidente (Res. 1401/2007)",category:"Operativo",slides:[{title:"Investigación Técnica de Accidente de Trabajo y Lecciones Aprendidas",subtitle:"Metodología de Árbol de Causas, Factores Personales/Del Trabajo y Plan de Acción Correctiva",kicker:"RESOLUCIÓN 1401 DE 2007 · DECRETO 1072 DE 2015",layout:"title",theme:"sunset",bullets:["Análisis técnico del equipo investigador y representante del COPASST"],takeaway:"Investigamos para encontrar causas y prevenir repeticiones, nunca para buscar culpables."},{title:"Análisis Causal: Causas Inmediatas vs. Causas Básicas (NTC 3701)",kicker:"DIAGNÓSTICO DE CAUSA RAÍZ",layout:"columns",theme:"wappy-dark",bullets:["Desglose técnico según metodología NTC 3701 y los 5 Porqués"],columns:[{title:"Causas Inmediatas (Síntomas)",badge:"Actos y Condiciones Subestándar",theme:"danger",items:["Condición subestándar: Superficie húmeda sin señalización preventiva en pasillo B.","Acto subestándar: Desplazamiento rápido manipulando carga que obstruía visibilidad.","Uso de calzado con desgaste en labrado antideslizante."]},{title:"Causas Básicas (Raíz Estructural)",badge:"Factores del Trabajo y Personales",theme:"warning",items:["Factor del trabajo: Ausencia de estándar de orden y aseo durante limpieza en turno.","Supervisión insuficiente en la inspección preoperacional de calzado EPP.","Falta de demarcación de vías peatonales segregadas."]}],takeaway:"Atacar únicamente la causa inmediata deja latente el 80% del riesgo de repetición."},{title:"Plan de Acción Correctiva y Preventiva (ACPM) de Cumplimiento Estricto",kicker:"JERARQUÍA DE CONTROLES",layout:"table",theme:"wappy-cream",bullets:["Medidas de ingeniería, administrativas y en el trabajador"],tableHtml:`<table style="width:100%; border-collapse:collapse; font-size:13px;">
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
        </table>`,takeaway:"Verificación de eficacia programada a los 30 días con cierre documental en WAPPY."}]}],vt=({value:a,onChange:u,placeholder:r="",className:g="",tagName:f="div"})=>{const d=n.useRef(null);n.useEffect(()=>{d.current&&d.current.innerHTML!==a&&(d.current.innerHTML=a||"")},[a]);const C=()=>{d.current&&u(d.current.innerHTML)},h=()=>{d.current&&u(d.current.innerHTML)},E=f;return e.jsx(E,{ref:d,contentEditable:!0,suppressContentEditableWarning:!0,onInput:C,onBlur:h,className:`outline-none focus:ring-1 focus:ring-teal-500/40 rounded px-1 transition-all ${g} relative empty:before:content-[attr(data-placeholder)] empty:before:opacity-40 empty:before:pointer-events-none empty:before:absolute`,"data-placeholder":r,style:{minWidth:"40px"}})},Rr=({initialContent:a,onUpdate:u,title:r,isMaximized:g=!1,onRegisterDownload:f})=>{const[d,C]=n.useState([]),[h,E]=n.useState(0),[w,S]=n.useState(!1),[$,ie]=n.useState(!0),[Q,U]=n.useState(!1),[V,O]=n.useState(!1),[G,xe]=n.useState(!1),[ge,ee]=n.useState(!1),[D,z]=n.useState(!1),[q,W]=n.useState({x:0,y:0}),[ae,me]=n.useState(!1),[ce,J]=n.useState(!1),[K,m]=n.useState("upload"),[L,Y]=n.useState(""),[he,X]=n.useState(null),[le,Ie]=n.useState(null),[Se,Fe]=n.useState(!1),Ae=n.useRef(null),$e=n.useRef(null),Oe=n.useRef(!1),Te=async()=>{X(null),Oe.current=!0;try{const t=await navigator.mediaDevices.getUserMedia({video:{width:1280,height:720,facingMode:"user"}});if(!Oe.current){t.getTracks().forEach(o=>o.stop());return}$e.current=t,Ie(t),Ae.current&&(Ae.current.srcObject=t)}catch(t){console.error("Error accessing camera:",t),X("No se pudo acceder a la cámara. Por favor verifica los permisos.")}},Re=()=>{Oe.current=!1,$e.current&&($e.current.getTracks().forEach(t=>t.stop()),$e.current=null),le&&(le.getTracks().forEach(t=>t.stop()),Ie(null))};n.useEffect(()=>(ce&&K==="camera"?Te():Re(),()=>{Re()}),[ce,K]);const Le=()=>{if(Ae.current){const t=Ae.current,o=document.createElement("canvas");o.width=t.videoWidth||640,o.height=t.videoHeight||480;const l=o.getContext("2d");if(l){l.translate(o.width,0),l.scale(-1,1),l.drawImage(t,0,0,o.width,o.height);const i=o.toDataURL("image/jpeg",.85);we(i)}}},we=t=>{const o=d[h],l=(o==null?void 0:o.layout)||"bullets";let i=l;(l==="title"||l==="bullets")&&(i="split"),oe(h,{imageUrl:t,layout:i}),J(!1),Re()},fe=t=>{var l;const o=(l=t.target.files)==null?void 0:l[0];if(o){const i=new FileReader;i.onload=p=>{var b;(b=p.target)!=null&&b.result&&we(p.target.result)},i.readAsDataURL(o)}},re=t=>{t.preventDefault(),Fe(!0)},be=()=>{Fe(!1)},ke=t=>{var l;t.preventDefault(),Fe(!1);const o=(l=t.dataTransfer.files)==null?void 0:l[0];if(o&&o.type.startsWith("image/")){const i=new FileReader;i.onload=p=>{var b;(b=p.target)!=null&&b.result&&we(p.target.result)},i.readAsDataURL(o)}};n.useEffect(()=>{if(a){if(Array.isArray(a)&&a.length>0){C(a.map((t,o)=>Lt(t,o)));return}if(typeof a=="object"&&a!==null){const t=a.slides||a.presentation||a.deck;if(Array.isArray(t)&&t.length>0){C(t.map((o,l)=>Lt(o,l)));return}}if(typeof a=="string"){const t=Pr(a);if(t&&Array.isArray(t)&&t.length>0){C(t.map((o,l)=>Lt(o,l)));return}}}C(Mt[0].slides)},[a]),n.useEffect(()=>{if(!ge)return;const t=o=>{o.key==="ArrowRight"||o.key===" "?(o.preventDefault(),E(l=>Math.min(d.length-1,l+1))):o.key==="ArrowLeft"?(o.preventDefault(),E(l=>Math.max(0,l-1))):o.key==="Escape"&&(o.preventDefault(),ee(!1),z(!1))};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[ge,d.length]);const oe=(t,o)=>{const l=d.map((i,p)=>p===t?{...i,...o}:i);C(l),u(JSON.stringify(l))},We=()=>{var i;const t=((i=d[h])==null?void 0:i.theme)||"wappy-dark",o={title:"Nuevo Hallazgo o Estrategia Clave",subtitle:"Subtítulo ejecutivo de contexto normativo o técnico",kicker:"ESTRATEGIA SG-SST",bullets:["Primer indicador o acción prioritaria verificable en campo.","Segunda medida de control de ingeniería o administrativa.","Impacto proyectado en la reducción de riesgos laborales."],theme:t,layout:"bullets",takeaway:"Conclusión ejecutiva: priorizar la intervención en la fuente."},l=[...d];l.splice(h+1,0,o),C(l),E(h+1),u(JSON.stringify(l))},ue=()=>{const t=d[h];if(!t)return;const o=JSON.parse(JSON.stringify(t));o.title=`${I(o.title)} (Copia)`;const l=[...d];l.splice(h+1,0,o),C(l),E(h+1),u(JSON.stringify(l))},Be=t=>{const o=t==="up"?h-1:h+1;if(o<0||o>=d.length)return;const l=[...d],[i]=l.splice(h,1);l.splice(o,0,i),C(l),E(o),u(JSON.stringify(l))},Me=()=>{if(d.length<=1)return;const t=d.filter((o,l)=>l!==h);C(t),E(Math.max(0,h-1)),u(JSON.stringify(t))},Ge=(t,o)=>{const l=d[h];if(!l)return;const i=l.bullets.map((p,b)=>b===t?o:p);oe(h,{bullets:i})},Ce=()=>{const t=d[h];t&&oe(h,{bullets:[...t.bullets,"Nuevo punto estratégico"]})},Ee=t=>{const o=d[h];if(!o||o.bullets.length<=1)return;const l=o.bullets.filter((i,p)=>p!==t);oe(h,{bullets:l})},Xe=t=>{const o=Mt.find(i=>i.id===t);if(!o)return;const l=JSON.parse(JSON.stringify(o.slides));C(l),E(0),U(!1),u(JSON.stringify(l))},Ve=()=>{const t=d[h];t&&(xe(!0),setTimeout(()=>{const o=["kpi-grid","columns","timeline","quote","bullets"],l=o.indexOf(t.layout||"bullets"),i=o[(l+1)%o.length],p={layout:i,kicker:t.kicker||"INSIGHT EJECUTIVO SG-SST",takeaway:t.takeaway||"El control preventivo en la fuente garantiza el cumplimiento del Decreto 1072 de 2015."};if(i==="kpi-grid"&&(!t.kpis||t.kpis.length===0))p.kpis=t.bullets.slice(0,4).map((b,y)=>{var pe,Ne;const R=I(b),ye=R.split(":");return{label:((pe=ye[0])==null?void 0:pe.slice(0,28))||`Indicador Clave ${y+1}`,value:((Ne=ye[1])==null?void 0:Ne.trim().slice(0,12))||`${92+y*2}%`,delta:"Meta cumplida",trend:"up",description:R.slice(0,70)}});else if(i==="columns"&&(!t.columns||t.columns.length===0)){const b=Math.ceil(t.bullets.length/2);p.columns=[{title:"Diagnóstico y Peligros",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,b).map(I)},{title:"Plan de Intervención SST",badge:"Control Efectivo",theme:"success",items:t.bullets.slice(b).map(I)}]}else i==="timeline"&&(!t.steps||t.steps.length===0)?p.steps=t.bullets.slice(0,4).map((b,y)=>({phase:`FASE 0${y+1} · PHVA`,title:I(b).slice(0,45),detail:I(b)})):i==="quote"&&!t.quote&&(p.quote=I(t.bullets[0]||t.title),p.citation="Decreto Único Reglamentario 1072 de 2015 · Resolución 0312 de 2019");oe(h,p),xe(!1)},250))},Qe=t=>{oe(h,{layout:"table",tableHtml:t})},Ke=t=>{oe(h,{layout:"chart",chartConfig:t})},Je=(t,o)=>{var p;const l={title:t,bullets:o,theme:((p=d[h])==null?void 0:p.theme)||"wappy-dark",layout:"bullets"},i=[...d,l];C(i),E(i.length-1),u(JSON.stringify(i))},He=async()=>{if(!V){O(!0);try{const t=await yr(()=>import("./vendor.CzLQ0fq0.js").then(p=>p.i0),__vite__mapDeps([0,1,2,3,4,5,6,7]),import.meta.url),o=t.default||t,l=new o;l.layout="LAYOUT_16x9",l.author="WAPPY IA — Suite Ejecutiva SG-SST",l.company="WAPPY Club",l.subject=r||"Presentación Ejecutiva SG-SST",l.title=r||"Presentación WAPPY",d.forEach((p,b)=>{var P,F;const y=De[p.theme||"wappy-dark"]||De["wappy-dark"],R=l.addSlide();R.background={color:y.pptBg};const ye=I(p.title)||`Diapositiva ${b+1}`,pe=I(p.subtitle||""),Ne=I(p.kicker||"").toUpperCase(),x=I(p.takeaway||""),T=p.layout||"bullets";if(R.addShape(l.ShapeType.rect,{x:0,y:0,w:10,h:.08,fill:{color:y.pptAccent},line:{color:y.pptAccent,width:0}}),R.addText(`${I(r)}  |  LÁMINA ${String(b+1).padStart(2,"0")} DE ${String(d.length).padStart(2,"0")}`,{x:.6,y:.2,w:8.8,h:.25,fontSize:8.5,bold:!0,color:y.pptSubtext,fontFace:"Arial"}),T==="title")Ne&&R.addText(Ne,{x:.8,y:1.35,w:8.4,h:.35,fontSize:11,bold:!0,color:y.pptAccent,align:"center",fontFace:"Arial"}),R.addText(ye,{x:.8,y:1.8,w:8.4,h:1.6,fontSize:30,bold:!0,color:y.pptText,align:"center",valign:"middle",fontFace:"Arial"}),(pe||((P=p.bullets)==null?void 0:P.length)>0)&&R.addText(pe||I(p.bullets[0]||""),{x:1.2,y:3.55,w:7.6,h:.9,fontSize:14,color:y.pptSubtext,align:"center",fontFace:"Arial"});else{Ne&&R.addText(Ne,{x:.6,y:.5,w:8.8,h:.25,fontSize:9.5,bold:!0,color:y.pptAccent,fontFace:"Arial"}),R.addText(ye,{x:.6,y:Ne?.75:.55,w:8.8,h:.75,fontSize:20,bold:!0,color:y.pptText,valign:"top",fontFace:"Arial"}),pe&&R.addText(pe,{x:.6,y:1.48,w:8.8,h:.32,fontSize:11,color:y.pptSubtext,fontFace:"Arial"});const M=pe?1.9:1.6;if(T==="kpi-grid"){const te=(p.kpis&&p.kpis.length>0?p.kpis:p.bullets.slice(0,4).map((B,je)=>({label:`Indicador ${je+1}`,value:`${90+je*2}%`,delta:"Verificado",description:I(B)}))).slice(0,4),ne=(te.length<=2,2),Z=4.25,ve=te.length<=2?2.5:1.35;te.forEach((B,je)=>{const Pe=je%ne,Ue=Math.floor(je/ne),ze=.6+Pe*(Z+.3),qe=M+Ue*(ve+.22);R.addShape(l.ShapeType.roundRect,{x:ze,y:qe,w:Z,h:ve,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),R.addText(I(B.value),{x:ze+.2,y:qe+.12,w:2.3,h:.5,fontSize:22,bold:!0,color:y.pptAccent,fontFace:"Arial"}),B.delta&&R.addText(I(B.delta),{x:ze+2.4,y:qe+.18,w:1.65,h:.32,fontSize:9,bold:!0,color:y.pptSubtext,align:"right",fontFace:"Arial"}),R.addText(I(B.label),{x:ze+.2,y:qe+.62,w:Z-.4,h:.3,fontSize:11,bold:!0,color:y.pptText,fontFace:"Arial"}),B.description&&R.addText(I(B.description),{x:ze+.2,y:qe+.9,w:Z-.4,h:.38,fontSize:9,color:y.pptSubtext,fontFace:"Arial"})})}else if(T==="columns"){const H=p.columns&&p.columns.length>0?p.columns:[{title:"Situación Identificada",badge:"Diagnóstico",items:p.bullets.slice(0,Math.ceil(p.bullets.length/2))},{title:"Plan de Control SST",badge:"Intervención",items:p.bullets.slice(Math.ceil(p.bullets.length/2))}],te=Math.min(H.length,3),ne=(8.8-(te-1)*.3)/te;H.slice(0,te).forEach((Z,ve)=>{const B=.6+ve*(ne+.3);R.addShape(l.ShapeType.roundRect,{x:B,y:M,w:ne,h:2.9,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),R.addText(I(Z.title),{x:B+.2,y:M+.15,w:ne-.4,h:.4,fontSize:13,bold:!0,color:y.pptAccent,fontFace:"Arial"});const je=(Z.items||[]).map(Pe=>({text:I(Pe),options:{bullet:!0,breakLine:!0,fontSize:10.5,color:y.pptText}}));je.length>0&&R.addText(je,{x:B+.2,y:M+.65,w:ne-.4,h:2.1,valign:"top",fontFace:"Arial",paraSpaceAfter:6})})}else if(T==="timeline"){const H=p.steps&&p.steps.length>0?p.steps:p.bullets.slice(0,4).map((Z,ve)=>({phase:`FASE 0${ve+1}`,title:I(Z).slice(0,42),detail:I(Z)})),te=Math.min(H.length,4),ne=(8.8-(te-1)*.2)/te;H.slice(0,te).forEach((Z,ve)=>{const B=.6+ve*(ne+.2);R.addShape(l.ShapeType.roundRect,{x:B,y:M,w:ne,h:2.85,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),R.addText(I(Z.phase||`PASO ${ve+1}`),{x:B+.15,y:M+.15,w:ne-.3,h:.3,fontSize:9,bold:!0,color:y.pptAccent,fontFace:"Arial"}),R.addText(I(Z.title),{x:B+.15,y:M+.5,w:ne-.3,h:.65,fontSize:11.5,bold:!0,color:y.pptText,fontFace:"Arial"}),R.addText(I(Z.detail),{x:B+.15,y:M+1.2,w:ne-.3,h:1.5,fontSize:9.5,color:y.pptSubtext,valign:"top",fontFace:"Arial"})})}else if(T==="table"&&p.tableHtml){const te=new DOMParser().parseFromString(p.tableHtml,"text/html"),Z=Array.from(te.querySelectorAll("tr")).map((ve,B)=>Array.from(ve.querySelectorAll("th, td")).map(Pe=>({text:I(Pe.textContent||""),options:{bold:B===0||Pe.tagName.toLowerCase()==="th",fill:B===0?y.pptAccent:y.pptCardBg,color:B===0?"0E1300":y.pptText,fontSize:9.5,margin:[4,6,4,6]}}))).filter(ve=>ve.length>0);Z.length>0&&R.addTable(Z,{x:.6,y:M,w:8.8,border:{type:"solid",pt:.75,color:y.pptCardBorder},fontFace:"Arial"})}else if(T==="chart"&&((F=p.chartConfig)!=null&&F.data)&&p.chartConfig.data.length>0){const H=p.chartConfig.data,te=[[{text:"Categoría / Indicador",options:{bold:!0,fill:y.pptAccent,color:"0E1300",fontSize:10}},{text:"Valor Medido",options:{bold:!0,fill:y.pptAccent,color:"0E1300",fontSize:10}}],...H.map(Z=>[{text:I(Z.label),options:{fill:y.pptCardBg,color:y.pptText,fontSize:10}},{text:String(Z.val),options:{bold:!0,fill:y.pptCardBg,color:y.pptAccent,fontSize:10}}])];R.addTable(te,{x:.6,y:M,w:4.3,border:{type:"solid",pt:.75,color:y.pptCardBorder},fontFace:"Arial"});const ne=p.bullets.map(Z=>({text:I(Z),options:{bullet:!0,breakLine:!0,fontSize:11,color:y.pptText}}));ne.length>0&&R.addText(ne,{x:5.2,y:M,w:4.2,h:2.7,valign:"top",fontFace:"Arial",paraSpaceAfter:8})}else if(T==="quote")R.addShape(l.ShapeType.roundRect,{x:.6,y:M,w:8.8,h:2.8,fill:{color:y.pptCardBg},line:{color:y.pptAccent,width:1.5},rectRadius:.08}),R.addText(`“${I(p.quote||p.bullets[0]||p.title)}”`,{x:.9,y:M+.25,w:8.2,h:1.6,fontSize:15,italic:!0,bold:!0,color:y.pptText,valign:"middle",fontFace:"Arial"}),p.citation&&R.addText(`— ${I(p.citation)}`,{x:.9,y:M+2,w:8.2,h:.5,fontSize:11,bold:!0,color:y.pptAccent,fontFace:"Arial"});else{const H=p.bullets.map(te=>({text:I(te),options:{bullet:!0,breakLine:!0,fontSize:13,color:y.pptText}}));R.addShape(l.ShapeType.roundRect,{x:.6,y:M,w:8.8,h:2.85,fill:{color:y.pptCardBg},line:{color:y.pptCardBorder,width:1},rectRadius:.08}),H.length>0&&R.addText(H,{x:.85,y:M+.2,w:8.3,h:2.45,valign:"top",fontFace:"Arial",paraSpaceAfter:10})}}x&&(R.addShape(l.ShapeType.roundRect,{x:.6,y:4.92,w:8.8,h:.45,fill:{color:y.pptCardBg},line:{color:y.pptAccent,width:.75},rectRadius:.05}),R.addText(`CONCLUSIÓN CLAVE: ${x}`,{x:.8,y:4.95,w:8.4,h:.38,fontSize:9.5,bold:!0,color:y.pptAccent,valign:"middle",fontFace:"Arial"})),p.speakerNotes&&R.addNotes(I(p.speakerNotes))});const i=(r||"Presentacion_Ejecutiva_WAPPY").replace(/[/\\?%*:|"<>]/g,"_").trim();await l.writeFile({fileName:`${i}.pptx`})}catch(t){console.error("Error generating PPTX:",t)}finally{O(!1)}}},Ye=()=>{const t=d.map((i,p)=>{var Ne,x;const b=De[i.theme||"wappy-dark"]||De["wappy-dark"],y=I(i.kicker||""),R=I(i.subtitle||""),ye=I(i.takeaway||"");let pe="";return i.layout==="kpi-grid"?pe=`<div style="display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:20px;">
            ${(i.kpis&&i.kpis.length>0?i.kpis:i.bullets.slice(0,4).map((P,F)=>({label:`Indicador ${F+1}`,value:`${92+F}%`,delta:"Verificado",description:I(P)}))).map(P=>`<div style="background:#${b.pptCardBg}; border:1px solid #${b.pptCardBorder}; border-radius:16px; padding:20px;">
                <div style="font-size:34px; font-weight:800; color:#${b.pptAccent};">${I(P.value)}</div>
                <div style="font-size:16px; font-weight:700; margin-top:6px;">${I(P.label)}</div>
                <div style="font-size:13px; opacity:0.8; margin-top:4px;">${I(P.description||P.delta||"")}</div>
              </div>`).join("")}
          </div>`:i.layout==="columns"&&((Ne=i.columns)!=null&&Ne.length)?pe=`<div style="display:grid; grid-template-columns:repeat(${Math.min(i.columns.length,3)},1fr); gap:20px; margin-top:20px;">
            ${i.columns.map(T=>`<div style="background:#${b.pptCardBg}; border:1px solid #${b.pptCardBorder}; border-radius:16px; padding:20px;">
                <h3 style="margin:0 0 12px 0; color:#${b.pptAccent}; font-size:18px;">${I(T.title)}</h3>
                <ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.6;">
                  ${(T.items||[]).map(P=>`<li>${I(P)}</li>`).join("")}
                </ul>
              </div>`).join("")}
          </div>`:i.layout==="timeline"&&((x=i.steps)!=null&&x.length)?pe=`<div style="display:grid; grid-template-columns:repeat(${Math.min(i.steps.length,4)},1fr); gap:14px; margin-top:20px;">
            ${i.steps.map(T=>`<div style="background:#${b.pptCardBg}; border:1px solid #${b.pptCardBorder}; border-radius:16px; padding:18px;">
                <div style="font-size:11px; font-weight:800; color:#${b.pptAccent};">${I(T.phase)}</div>
                <div style="font-size:16px; font-weight:700; margin:8px 0;">${I(T.title)}</div>
                <div style="font-size:13px; opacity:0.85;">${I(T.detail)}</div>
              </div>`).join("")}
          </div>`:i.layout==="table"&&i.tableHtml?pe=`<div style="margin-top:20px; background:#${b.pptCardBg}; padding:16px; border-radius:14px;">${i.tableHtml}</div>`:i.layout==="quote"?pe=`<div style="margin-top:24px; background:#${b.pptCardBg}; border-left:5px solid #${b.pptAccent}; padding:28px; border-radius:16px;">
            <div style="font-size:24px; font-style:italic; font-weight:700; line-height:1.45;">“${I(i.quote||i.bullets[0]||"")}”</div>
            <div style="margin-top:14px; font-size:14px; font-weight:700; color:#${b.pptAccent};">${I(i.citation||"")}</div>
          </div>`:pe=`<ul style="font-size:20px; line-height:1.65; margin:20px 0 0 0; padding-left:24px;">
            ${i.bullets.map(T=>`<li style="margin-bottom:14px;">${T}</li>`).join("")}
          </ul>`,`
          <div class="slide-page" style="page-break-after:always; width:100%; height:100vh; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box; padding:48px 60px; background:#${b.pptBg}; color:#${b.pptText};">
            <div style="display:flex; justify-content:space-between; font-size:12px; opacity:0.65; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;">
              <span>${I(r)}</span>
              <span>Lámina ${p+1} / ${d.length}</span>
            </div>
            <div style="my:auto;">
              ${y?`<div style="font-size:12px; font-weight:800; color:#${b.pptAccent}; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:8px;">${y}</div>`:""}
              <h1 style="font-size:34px; line-height:1.2; margin:0; font-family:'Outfit','Inter',sans-serif; font-weight:800;">${i.title}</h1>
              ${R?`<p style="font-size:16px; opacity:0.8; margin:8px 0 0 0;">${R}</p>`:""}
              ${pe}
            </div>
            <div style="border-top:1px solid rgba(148,163,184,0.25); padding-top:12px; display:flex; justify-content:space-between; font-size:12px;">
              <span style="color:#${b.pptAccent}; font-weight:700;">${ye?`Síntesis: ${ye}`:"WAPPY IA · Suite Ejecutiva SG-SST"}</span>
              <span style="opacity:0.6;">Formato 16:9</span>
            </div>
          </div>
        `}).join(""),o=`<!DOCTYPE html><html><head><title>${I(r)}</title><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@700;800&display=swap" rel="stylesheet"><style>body{margin:0;padding:0;font-family:'Inter',sans-serif;}@media print{.slide-page{height:100vh;page-break-after:always!important;}@page{size:landscape;margin:0;}}</style></head><body>${t}<script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body></html>`,l=window.open("","_blank");l&&(l.document.open(),l.document.write(o),l.document.close())};n.useEffect(()=>{f&&f(He)},[f,d,r]);const N=(t,o=!1)=>{var ve;let l=Array.isArray(t==null?void 0:t.data)?t.data:[];if(l.length===0&&Array.isArray(t==null?void 0:t.labels)&&Array.isArray(t==null?void 0:t.datasets)&&((ve=t.datasets[0])!=null&&ve.data)&&(l=t.labels.map((B,je)=>({label:String(B),val:Number(t.datasets[0].data[je]||0)}))),!t||l.length===0)return e.jsx("div",{className:"flex flex-col items-center justify-center h-44 border border-white/10 rounded-xl bg-black/20 text-white/50 text-xs",children:e.jsx("span",{children:"No hay datos de gráfico configurados."})});const i=t.type==="doughnut"?"pie":t.type||"bar",p=t.title||"",b=500,y=220,R=48,ye=26,pe=36,Ne=36,x=b-R-ye,T=y-pe-Ne,P=l.map(B=>Number(B.val)||0),F=Math.max(...P,1),M=Math.min(...P,0),H=F-M||1,te=o?"#334155":"#cbd5e1",ne=o?"#0f172a":"#ffffff";if(i==="pie"){let B=P.reduce((st,et)=>st+et,0);B===0&&(B=1);let je=0;const Pe=b/2-70,Ue=y/2+10,ze=65,qe=["#14b8a6","#10b981","#06b6d4","#f59e0b","#8b5cf6","#f43f5e"];return e.jsxs("svg",{viewBox:`0 0 ${b} ${y}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("text",{x:b/2,y:22,textAnchor:"middle",fill:ne,className:"text-xs font-bold",children:p}),e.jsx("g",{children:l.map((st,et)=>{const Wt=(Number(st.val)||0)/B*360,ha=Pe+ze*Math.cos((je-90)*Math.PI/180),ya=Ue+ze*Math.sin((je-90)*Math.PI/180);je+=Wt;const va=Pe+ze*Math.cos((je-90)*Math.PI/180),wa=Ue+ze*Math.sin((je-90)*Math.PI/180),ja=Wt>180?1:0,Na=`M ${Pe} ${Ue} L ${ha} ${ya} A ${ze} ${ze} 0 ${ja} 1 ${va} ${wa} Z`,Sa=qe[et%qe.length];return e.jsx("path",{d:Na,fill:Sa,opacity:"0.9"},et)})}),e.jsx("g",{transform:`translate(${b-175}, ${pe+6})`,children:l.slice(0,6).map((st,et)=>e.jsxs("g",{transform:`translate(0, ${et*22})`,children:[e.jsx("rect",{width:11,height:11,rx:3,fill:qe[et%qe.length]}),e.jsxs("text",{x:18,y:9.5,fill:te,className:"text-[10px] font-semibold",children:[String(st.label).slice(0,16)," (",st.val,")"]})]},et))})]})}const Z=B=>{const je=(B-M)/H;return y-Ne-je*T};return e.jsxs("svg",{viewBox:`0 0 ${b} ${y}`,className:"w-full h-full max-h-56 font-sans select-none",children:[e.jsx("defs",{children:e.jsxs("linearGradient",{id:"wappyBarGrad",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"0%",stopColor:"#14b8a6",stopOpacity:"0.95"}),e.jsx("stop",{offset:"100%",stopColor:"#0d9488",stopOpacity:"0.35"})]})}),e.jsx("text",{x:b/2,y:20,textAnchor:"middle",fill:ne,className:"text-xs font-bold",children:p}),[0,.5,1].map((B,je)=>{const Pe=M+B*H,Ue=Z(Pe);return e.jsxs("g",{children:[e.jsx("line",{x1:R,y1:Ue,x2:b-ye,y2:Ue,stroke:o?"#cbd5e1":"#334155",strokeWidth:"0.7",strokeDasharray:"4 4"}),e.jsx("text",{x:R-6,y:Ue+3,textAnchor:"end",fill:te,className:"text-[9px] font-semibold",children:Pe.toFixed(0)})]},je)}),l.map((B,je)=>{const Pe=R+je/l.length*x+x/l.length*.15,Ue=x/l.length*.7,ze=Z(Number(B.val)||0),qe=Math.max(y-Ne-ze,2);return e.jsxs("g",{children:[e.jsx("rect",{x:Pe,y:ze,width:Ue,height:qe,rx:5,fill:"url(#wappyBarGrad)"}),e.jsx("text",{x:Pe+Ue/2,y:ze-5,textAnchor:"middle",fill:ne,className:"text-[9px] font-bold",children:B.val}),e.jsx("text",{x:Pe+Ue/2,y:y-Ne+15,textAnchor:"middle",fill:te,className:"text-[9px] font-semibold",children:String(B.label).slice(0,12)})]},je)})]})},k=(t,o,l)=>e.jsxs("div",{className:"space-y-1.5 mb-3 shrink-0",children:[(t.kicker||!l)&&e.jsx("div",{className:"flex items-center gap-2",children:e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-extrabold uppercase tracking-wider ${o.accentBg}`,children:[e.jsx(Ba,{className:"h-3 w-3 shrink-0"}),l?e.jsx("span",{children:t.kicker||"GESTIÓN ESTRATÉGICA SG-SST"}):e.jsx("input",{type:"text",value:I(t.kicker||""),onChange:i=>oe(h,{kicker:i.target.value}),placeholder:"CATEGORÍA / NORMA (EJ. DECRETO 1072)",className:"bg-transparent border-none outline-none text-[10px] font-extrabold uppercase tracking-wider w-56 placeholder:opacity-50"})]})}),l?e.jsx("h2",{className:`text-2xl md:text-4xl font-extrabold tracking-tight leading-tight ${o.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(vt,{value:t.title,onChange:i=>oe(h,{title:i}),className:`w-full bg-transparent border-none outline-none font-extrabold text-lg sm:text-2xl md:text-3xl leading-tight ${o.text}`,placeholder:"Escribe el titular ejecutivo de la diapositiva...",tagName:"h2"},`title-${h}`),(t.subtitle||!l)&&e.jsx("div",{children:l?t.subtitle&&e.jsx("p",{className:`text-sm md:text-lg ${o.subtext}`,children:t.subtitle}):e.jsx("input",{type:"text",value:I(t.subtitle||""),onChange:i=>oe(h,{subtitle:i.target.value}),placeholder:"Añadir subtítulo o contexto ejecutivo (opcional)...",className:`w-full bg-transparent border-none outline-none text-xs sm:text-sm ${o.subtext} placeholder:opacity-40`})})]}),se=(t,o=!1)=>{const l=t.layout||"bullets",i=De[t.theme||"wappy-dark"]||De["wappy-dark"];switch(l){case"title":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center items-center text-center my-auto px-4 py-2 space-y-4",children:[e.jsxs("span",{className:`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-[10px] sm:text-xs font-extrabold uppercase tracking-widest ${i.accentBg}`,children:[e.jsx(_e,{className:"h-3.5 w-3.5"}),t.kicker||"SISTEMA DE GESTIÓN SG-SST · WAPPY IA"]}),o?e.jsx("h1",{className:`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl ${i.text}`,dangerouslySetInnerHTML:{__html:t.title}}):e.jsx(vt,{value:t.title,onChange:p=>oe(h,{title:p}),className:`w-full bg-transparent border-none outline-none font-extrabold text-2xl sm:text-4xl text-center leading-tight ${i.text}`,placeholder:"Título de Portada Ejecutiva...",tagName:"h1"},`title-cover-${h}`),e.jsx("p",{className:`text-xs sm:text-base max-w-2xl font-medium ${i.subtext}`,children:t.subtitle||I(t.bullets[0]||"")}),e.jsx("div",{className:"h-1 w-24 bg-gradient-to-r from-teal-400 via-emerald-400 to-lime-400 rounded-full opacity-90"})]});case"kpi-grid":{const p=t.kpis&&t.kpis.length>0?t.kpis:t.bullets.slice(0,4).map((b,y)=>{var pe,Ne;const R=I(b),ye=R.split(":");return{label:((pe=ye[0])==null?void 0:pe.slice(0,28))||`Indicador Clave 0${y+1}`,value:((Ne=ye[1])==null?void 0:Ne.trim().slice(0,12))||`${92+y*2}%`,delta:"Meta cumplida",trend:"up",description:R}});return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),e.jsx("div",{className:"grid grid-cols-2 gap-2.5 sm:gap-3.5 my-auto",children:p.slice(0,4).map((b,y)=>e.jsxs("div",{className:`rounded-2xl border p-3 sm:p-4 flex flex-col justify-between backdrop-blur-md transition-all ${i.cardBg}`,children:[e.jsxs("div",{className:"flex items-start justify-between gap-2",children:[e.jsx("span",{className:`text-xl sm:text-3xl font-black tracking-tight ${i.accent}`,children:b.value}),b.delta&&e.jsxs("span",{className:`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border ${i.accentBg}`,children:[b.trend==="down"?e.jsx(Fa,{className:"h-3 w-3"}):e.jsx(ua,{className:"h-3 w-3"}),b.delta]})]}),e.jsxs("div",{className:"mt-2",children:[e.jsx("div",{className:`text-xs sm:text-sm font-extrabold ${i.text}`,children:b.label}),b.description&&e.jsx("p",{className:`text-[10px] sm:text-xs mt-0.5 line-clamp-2 ${i.subtext}`,children:b.description})]})]},y))})]})}case"columns":{const p=Math.ceil(t.bullets.length/2),b=t.columns&&t.columns.length>0?t.columns:[{title:"Diagnóstico / Estado Inicial",badge:"Línea Base",theme:"warning",items:t.bullets.slice(0,p)},{title:"Controles / Intervención SST",badge:"Plan de Acción",theme:"success",items:t.bullets.slice(p)}];return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),e.jsx("div",{className:`grid grid-cols-1 ${b.length>=3?"sm:grid-cols-3":"sm:grid-cols-2"} gap-3 my-auto`,children:b.slice(0,3).map((y,R)=>e.jsxs("div",{className:`rounded-2xl border p-3.5 sm:p-4 flex flex-col gap-2.5 backdrop-blur-md ${i.cardBg}`,children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 border-b border-current/10 pb-2",children:[e.jsx("h3",{className:`text-xs sm:text-base font-extrabold ${i.accent}`,children:y.title}),y.badge&&e.jsx("span",{className:`px-2 py-0.5 rounded-md text-[9px] font-bold border ${i.accentBg}`,children:y.badge})]}),e.jsx("ul",{className:`space-y-1.5 text-[11px] sm:text-xs font-medium ${i.text}`,children:(y.items||[]).map((ye,pe)=>e.jsxs("li",{className:"flex items-start gap-2 leading-relaxed",children:[e.jsx(ea,{className:`h-3.5 w-3.5 mt-0.5 shrink-0 ${i.accent}`}),e.jsx("span",{children:I(ye)})]},pe))})]},R))})]})}case"timeline":{const p=t.steps&&t.steps.length>0?t.steps:t.bullets.slice(0,4).map((b,y)=>({phase:`FASE 0${y+1}`,title:I(b).slice(0,36),detail:I(b)}));return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-auto",children:p.slice(0,4).map((b,y)=>e.jsxs("div",{className:`rounded-2xl border p-3 flex flex-col justify-between relative backdrop-blur-md ${i.cardBg}`,children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center justify-between mb-1.5",children:[e.jsx("span",{className:`text-[9px] font-black uppercase tracking-wider ${i.accent}`,children:b.phase||`PASO 0${y+1}`}),e.jsxs("span",{className:"h-5 w-5 rounded-lg bg-teal-500/20 text-teal-400 text-[10px] font-black flex items-center justify-center",children:["0",y+1]})]}),e.jsx("h4",{className:`text-xs sm:text-sm font-extrabold leading-snug ${i.text}`,children:b.title})]}),e.jsx("p",{className:`text-[10px] sm:text-xs mt-2 leading-relaxed line-clamp-3 ${i.subtext}`,children:b.detail})]},y))})]})}case"quote":return e.jsxs("div",{className:"flex-1 flex flex-col justify-center my-auto w-full",children:[k(t,i,o),e.jsxs("div",{className:`rounded-2xl border-l-4 p-5 sm:p-6 backdrop-blur-md space-y-3 ${i.cardBg} ${i.border}`,children:[e.jsx(_a,{className:`h-7 w-7 opacity-60 ${i.accent}`}),e.jsxs("blockquote",{className:`text-sm sm:text-xl font-bold italic leading-relaxed ${i.text}`,children:["“",I(t.quote||t.bullets[0]||t.title),"”"]}),e.jsxs("div",{className:`text-xs sm:text-sm font-extrabold ${i.accent}`,children:["— ",t.citation||"Decreto Único Reglamentario 1072 de 2015 · Ministerio del Trabajo"]})]})]});case"split":return e.jsxs("div",{className:"flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 items-center my-auto w-full",children:[e.jsx("div",{onClick:()=>!o&&J(!0),className:`relative group rounded-2xl overflow-hidden aspect-[4/3] border border-white/15 shadow-lg bg-black/25 flex items-center justify-center ${o?"":"cursor-pointer hover:border-teal-500/50 transition-colors"}`,children:t.imageUrl?e.jsx("img",{src:t.imageUrl,alt:"",className:"w-full h-full object-cover transition-all duration-500 group-hover:scale-105"}):e.jsxs("div",{className:"flex flex-col items-center justify-center text-white/40 text-xs gap-2 p-4 text-center",children:[e.jsx(zt,{className:"h-8 w-8 text-teal-400/70"}),e.jsx("span",{children:"Haz clic para agregar evidencia fotográfica o imagen"})]})}),e.jsxs("div",{className:"space-y-3",children:[k(t,i,o),e.jsx("ul",{className:`space-y-2 text-xs sm:text-sm font-medium ${i.text}`,children:t.bullets.map((p,b)=>e.jsxs("li",{className:"flex items-start gap-2",children:[e.jsx(ea,{className:`h-4 w-4 mt-0.5 shrink-0 ${i.accent}`}),e.jsx(vt,{value:p,onChange:y=>Ge(b,y),className:"flex-1"},`split-b-${h}-${b}`)]},b))})]})]});case"media":return e.jsxs("div",{onClick:()=>!o&&J(!0),className:"relative flex-1 flex flex-col justify-end p-5 sm:p-8 bg-cover bg-center rounded-2xl overflow-hidden my-1",style:{backgroundImage:t.imageUrl?`url("${t.imageUrl}")`:'url("https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200&auto=format&fit=crop")'},children:[e.jsx("div",{className:"absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent pointer-events-none"}),e.jsxs("div",{onClick:p=>p.stopPropagation(),className:"relative z-10 w-full max-w-2xl bg-slate-950/65 border border-white/15 p-4 sm:p-6 rounded-2xl backdrop-blur-md space-y-2",children:[e.jsx("h2",{className:"text-lg sm:text-2xl font-extrabold text-white",children:I(t.title)}),e.jsx("ul",{className:"space-y-1 text-xs sm:text-sm text-slate-200 list-disc pl-4",children:t.bullets.slice(0,3).map((p,b)=>e.jsx("li",{children:I(p)},b))})]})]});case"table":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),t.tableHtml?e.jsx("div",{className:`max-h-[14rem] overflow-y-auto border rounded-xl p-3 scrollbar-thin ${i.cardBg}`,dangerouslySetInnerHTML:{__html:t.tableHtml}}):e.jsxs("div",{className:"flex flex-col items-center justify-center h-40 border border-dashed border-teal-500/30 rounded-xl bg-teal-500/5 text-xs text-center gap-2 p-4",children:[e.jsx(ca,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:i.text,children:'Usa "Conectar Lienzos" para importar un rango de Excel o aplica una plantilla SST.'})]})]});case"chart":return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),e.jsx("div",{className:`flex-1 flex items-center justify-center p-3 rounded-2xl border min-h-[180px] ${i.cardBg}`,children:t.chartConfig?N(t.chartConfig,i.isLight):e.jsxs("div",{className:"flex flex-col items-center justify-center text-xs text-center gap-2 p-4",children:[e.jsx(pa,{className:"h-8 w-8 text-teal-400"}),e.jsx("span",{className:i.text,children:'Importa un gráfico desde Hoja de Cálculo con "Conectar Lienzos".'})]})})]});case"bullets":default:return e.jsxs("div",{className:"flex-1 flex flex-col justify-between my-auto w-full",children:[k(t,i,o),e.jsx("div",{className:"grid grid-cols-1 gap-2 my-auto max-h-[14rem] overflow-y-auto pr-1 scrollbar-thin",children:t.bullets.map((p,b)=>e.jsxs("div",{className:`flex items-start gap-3 rounded-xl border p-2.5 sm:p-3 backdrop-blur-sm transition-all ${i.cardBg}`,children:[e.jsxs("span",{className:`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-black border ${i.accentBg}`,children:["0",b+1]}),o?e.jsx("div",{className:`text-sm sm:text-lg font-medium leading-relaxed ${i.text}`,dangerouslySetInnerHTML:{__html:p}}):e.jsx(vt,{value:p,onChange:y=>Ge(b,y),className:`flex-1 text-xs sm:text-sm font-medium leading-relaxed ${i.text}`,placeholder:"Escribe el punto clave..."},`bullet-${h}-${b}`)]},b))})]})}},_=d[h]||d[0],s=_&&De[_.theme||"wappy-dark"]||De["wappy-dark"],c=t=>{const o=t.currentTarget.getBoundingClientRect(),l=t.clientX-o.left;l>o.width*.7?E(i=>Math.min(d.length-1,i+1)):l<o.width*.3&&E(i=>Math.max(0,i-1))},v=t=>{D&&W({x:t.clientX,y:t.clientY})},j=()=>{if(!ge||!_)return null;const t=De[_.theme||"wappy-dark"]||De["wappy-dark"];return Et.createPortal(e.jsxs("div",{className:`fixed inset-0 z-[99999999] flex flex-col justify-between p-8 md:p-14 select-none ${D?"cursor-none":"cursor-default"} ${t.bg} animate-in fade-in duration-300`,onMouseMove:v,onClick:c,children:[D&&e.jsxs("div",{className:"pointer-events-none fixed z-[99999999] -translate-x-1/2 -translate-y-1/2 transition-all duration-75 ease-out",style:{left:q.x,top:q.y},children:[e.jsx("div",{className:"absolute inset-0 w-8 h-8 -m-4 rounded-full bg-rose-500/30 blur-md animate-pulse"}),e.jsx("div",{className:"absolute inset-0 w-3 h-3 -m-1.5 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]"})]}),e.jsxs("div",{className:"flex items-center justify-between border-b border-current/10 pb-3 z-10",children:[e.jsxs("span",{className:`text-xs font-mono font-bold tracking-widest uppercase ${t.subtext}`,children:["Lámina ",String(h+1).padStart(2,"0")," / ",String(d.length).padStart(2,"0")]}),e.jsx("span",{className:`text-sm font-extrabold truncate max-w-md ${t.accent}`,children:r})]}),e.jsxs("div",{className:"my-auto max-w-6xl mx-auto w-full z-10 py-6 flex flex-col justify-center min-h-[65vh]",children:[se(_,!0),_.takeaway&&e.jsxs("div",{className:`mt-6 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 ${t.accentBg}`,children:[e.jsx(_e,{className:"h-4 w-4 shrink-0"}),e.jsxs("span",{children:["Síntesis Ejecutiva: ",I(_.takeaway)]})]})]}),e.jsxs("div",{className:"relative z-20 mx-auto bg-slate-900/85 border border-white/15 p-3 rounded-2xl backdrop-blur-md shadow-2xl flex items-center justify-between w-full max-w-xl",onClick:o=>o.stopPropagation(),children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{onClick:()=>E(o=>Math.max(0,o-1)),disabled:h===0,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(Xt,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-bold text-white px-2",children:[h+1," / ",d.length]}),e.jsx("button",{onClick:()=>E(o=>Math.min(d.length-1,o+1)),disabled:h===d.length-1,className:"p-2 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/15 disabled:opacity-30 cursor-pointer",children:e.jsx(_t,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("button",{onClick:He,className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30 cursor-pointer",children:[e.jsx(ct,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Descargar"})]}),e.jsxs("button",{onClick:()=>z(!D),className:`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border cursor-pointer ${D?"bg-rose-500/25 border-rose-500/50 text-rose-300":"bg-white/5 border-white/10 text-slate-300"}`,children:[e.jsx($a,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Láser"})]}),e.jsxs("button",{onClick:()=>{ee(!1),z(!1)},className:"flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-xl cursor-pointer",children:[e.jsx(La,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Salir"})]})]})]})]}),document.body)},A=()=>!ce||!_?null:Et.createPortal(e.jsx("div",{className:"fixed inset-0 z-[99999999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200",children:e.jsxs("div",{className:"relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-white/10 pb-3.5",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(zt,{className:"h-5 w-5 text-teal-400"}),e.jsx("h3",{className:"text-base font-extrabold text-white",children:"Agregar Evidencia o Imagen"})]}),e.jsx("button",{onClick:()=>{J(!1),Re()},className:"p-1.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer",children:e.jsx(tt,{className:"h-4 w-4"})})]}),e.jsx("div",{className:"flex bg-slate-950/80 border border-white/10 p-1 rounded-2xl gap-1",children:["upload","camera","url"].map(t=>e.jsxs("button",{onClick:()=>m(t),className:`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${K===t?"bg-teal-500/20 border border-teal-500/40 text-teal-300":"text-slate-400 hover:text-white"}`,children:[t==="upload"?e.jsx(Zt,{className:"h-3.5 w-3.5"}):t==="camera"?e.jsx(Ma,{className:"h-3.5 w-3.5"}):e.jsx(Kt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:t==="upload"?"Cargar PC":t==="camera"?"Cámara":"Enlace URL"})]},t))}),e.jsxs("div",{className:"min-h-[190px] flex flex-col justify-center",children:[K==="upload"&&e.jsxs("div",{onDragOver:re,onDragLeave:be,onDrop:ke,className:`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl gap-3 text-center ${Se?"border-teal-400 bg-teal-500/10":"border-white/15"}`,children:[e.jsx(Zt,{className:"h-7 w-7 text-teal-400"}),e.jsx("p",{className:"text-xs font-bold text-slate-200",children:"Arrastra una imagen aquí o selecciona desde tu equipo"}),e.jsxs("label",{className:"px-4 py-2 text-xs font-bold bg-teal-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 rounded-xl cursor-pointer",children:["Seleccionar Imagen",e.jsx("input",{type:"file",accept:"image/*",onChange:fe,className:"hidden"})]})]}),K==="camera"&&e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[he?e.jsx("div",{className:"text-xs text-rose-400 font-semibold p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl w-full text-center",children:he}):e.jsx("div",{className:"relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-white/10",children:e.jsx("video",{ref:Ae,autoPlay:!0,playsInline:!0,className:"w-full h-full object-cover scale-x-[-1]"})}),e.jsx("button",{onClick:Le,disabled:!!he||!le,className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer disabled:opacity-40",children:"Capturar Fotografía"})]}),K==="url"&&e.jsxs("div",{className:"flex flex-col gap-3",children:[e.jsx("input",{type:"text",value:L,onChange:t=>Y(t.target.value),placeholder:"https://ejemplo.com/evidencia.png",className:"w-full h-10 px-3 text-xs bg-slate-950 border border-white/15 rounded-xl outline-none focus:border-teal-500 text-white"}),e.jsx("button",{onClick:()=>L.trim()&&we(L.trim()),className:"w-full py-2.5 px-4 text-xs font-extrabold bg-teal-500/20 border border-teal-500/40 text-teal-300 rounded-xl cursor-pointer",children:"Insertar Imagen"})]})]})]})}),document.body);return e.jsxs("div",{className:"flex h-full bg-surface-primary text-text-primary overflow-hidden relative",children:[g&&e.jsxs("div",{className:`hidden sm:flex flex-shrink-0 border-r border-border-medium bg-surface-secondary flex-col justify-between transition-all duration-300 ${$?"w-56 md:w-64":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"flex items-center justify-between px-1",children:[e.jsxs("span",{className:"text-[11px] font-extrabold text-text-tertiary uppercase tracking-wider",children:["Láminas (",d.length,")"]}),e.jsxs("div",{className:"flex items-center gap-1",children:[e.jsx("button",{onClick:()=>Be("up"),disabled:h===0,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Subir diapositiva",children:e.jsx(Jt,{className:"h-3.5 w-3.5"})}),e.jsx("button",{onClick:()=>Be("down"),disabled:h===d.length-1,className:"p-1 rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-secondary cursor-pointer",title:"Bajar diapositiva",children:e.jsx(Yt,{className:"h-3.5 w-3.5"})})]})]}),d.map((t,o)=>{const l=De[t.theme||"wappy-dark"]||De["wappy-dark"],i=o===h;return e.jsx("button",{onClick:()=>E(o),className:`w-full text-left rounded-xl border p-2 transition-all relative overflow-hidden group cursor-pointer ${i?"border-teal-500 ring-2 ring-teal-500/20 bg-teal-500/5 shadow-sm":"border-border-medium hover:border-teal-500/40 bg-surface-primary"}`,children:e.jsxs("div",{className:`h-16 w-full rounded-lg ${l.bg} p-2 flex flex-col justify-between overflow-hidden border border-white/10`,children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:`text-[8px] font-black uppercase ${l.accent}`,children:["0",o+1," · ",t.layout||"bullets"]})}),e.jsx("div",{className:`text-[9px] font-bold ${l.text} line-clamp-2 leading-tight`,children:I(t.title)})]})},o)})]}),e.jsxs("div",{className:"p-3 border-t border-border-medium bg-surface-primary flex items-center justify-center gap-2 shrink-0",children:[e.jsx(de,{onClick:We,icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(de,{onClick:ue,icon:e.jsx(At,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(de,{onClick:Me,disabled:d.length<=1,icon:e.jsx(nt,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col bg-surface-secondary/30 overflow-hidden",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-primary shrink-0 z-30",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1 bg-surface-secondary border border-border-medium rounded-xl p-0.5",children:[e.jsx("button",{onClick:()=>E(t=>Math.max(0,t-1)),disabled:h===0,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Diapositiva anterior",children:e.jsx(Xt,{className:"h-4 w-4"})}),e.jsxs("span",{className:"text-xs font-extrabold px-2 text-text-primary select-none",children:[h+1," / ",d.length]}),e.jsx("button",{onClick:()=>E(t=>Math.min(d.length-1,t+1)),disabled:h===d.length-1,className:"h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-hover disabled:opacity-30 text-text-primary cursor-pointer",title:"Siguiente diapositiva",children:e.jsx(_t,{className:"h-4 w-4"})})]}),e.jsx(de,{onClick:We,icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Nueva Lámina",title:"Añadir nueva diapositiva",variant:"emerald",size:"sm"}),e.jsx(de,{onClick:ue,icon:e.jsx(At,{className:"h-4 w-4"}),label:"Duplicar",title:"Duplicar diapositiva actual",variant:"teal",size:"sm"}),e.jsx(de,{onClick:Me,disabled:d.length<=1,icon:e.jsx(nt,{className:"h-4 w-4"}),label:"Eliminar",title:"Eliminar diapositiva actual",variant:"danger",size:"sm"}),e.jsxs("div",{className:"relative",children:[e.jsx(de,{onClick:()=>U(t=>!t),icon:e.jsx(dt,{className:"h-4 w-4"}),label:"Plantillas SST",title:"Plantillas Ejecutivas SG-SST",variant:"amber",size:"sm",isActive:Q}),Q&&e.jsxs("div",{className:"absolute left-0 mt-2 w-72 rounded-2xl border border-border-medium bg-surface-primary shadow-2xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150",children:[e.jsx("div",{className:"px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-text-tertiary",children:"Presentaciones Ejecutivas SG-SST"}),Mt.map(t=>e.jsxs("button",{onClick:()=>Xe(t.id),className:"w-full text-left px-3 py-2 rounded-xl hover:bg-teal-500/10 transition-colors flex flex-col gap-0.5 cursor-pointer",children:[e.jsx("span",{className:"text-xs font-bold text-text-primary",children:t.name}),e.jsxs("span",{className:"text-[10px] text-teal-600 dark:text-teal-400 font-semibold",children:[t.category," · ",t.slides.length," diapositivas ejecutivas"]})]},t.id))]})]}),e.jsx(de,{onClick:Ve,disabled:G,icon:e.jsx(_e,{className:`h-4 w-4 ${G?"animate-spin":""}`}),label:"Transformar Diseño",title:"Transformar estructura visual automáticamente (KPIs / Columnas / PHVA / Cita)",variant:"purple",size:"sm"})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(de,{onClick:()=>S(t=>!t),icon:e.jsx(Qt,{className:"h-4 w-4"}),label:w?"Ocultar Diseño":"Diseño y Tema",title:"Abrir u ocultar el panel de estructuras, temas y notas",variant:"orange",size:"sm",isActive:w}),e.jsx(de,{onClick:()=>me(!0),icon:e.jsx(Kt,{className:"h-4 w-4"}),label:"Conectar Recursos",title:"Conectar con Hoja de Cálculo, Documento o Galería Google Flow",variant:"teal",size:"sm"}),e.jsx(de,{onClick:()=>ee(!0),icon:e.jsx(St,{className:"h-4 w-4"}),label:"Presentar",title:"Iniciar Presentación Pantalla Completa",variant:"cyan",size:"sm"}),e.jsx(de,{onClick:He,disabled:V,icon:e.jsx(ct,{className:`h-4 w-4 ${V?"animate-bounce":""}`}),label:V?"Generando...":"Descargar Presentación",title:"Descargar presentación editable",variant:"green",size:"sm"}),e.jsx(de,{onClick:Ye,icon:e.jsx(Ia,{className:"h-4 w-4"}),label:"Imprimir",title:"Imprimir presentación en formato horizontal 16:9",variant:"neutral",size:"sm"})]})]}),_?e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 scrollbar-thin",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2",children:[!g&&e.jsx("div",{className:"flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin",children:d.map((t,o)=>{const l=o===h;return e.jsxs("button",{onClick:()=>E(o),className:`shrink-0 px-2.5 py-1 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${l?"bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 font-extrabold shadow-xs":"bg-surface-primary border-border-medium text-text-secondary hover:border-teal-500/30"}`,children:[e.jsxs("span",{className:"text-[10px] font-mono font-black opacity-75",children:["0",o+1]}),e.jsx("span",{className:"text-[11px] truncate max-w-[100px]",children:I(t.title)})]},o)})}),e.jsx("div",{className:"flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none ml-auto",children:la.map(t=>{const o=(_.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>oe(h,{layout:t.key}),className:`shrink-0 py-1 px-2 text-[10px] font-bold border rounded-lg transition-all cursor-pointer ${o?"border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium bg-surface-primary hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:`aspect-[16/9] w-full rounded-2xl shadow-xl border ${s.bg} ${s.border} p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden transition-all`,children:[e.jsx("div",{className:"absolute -top-16 -right-16 w-56 h-56 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsx("div",{className:"absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"}),e.jsxs("div",{className:"flex items-center justify-between z-10 border-b border-current/10 pb-2",children:[e.jsxs("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase ${s.subtext}`,children:["LÁMINA ",String(h+1).padStart(2,"0")," / ",String(d.length).padStart(2,"0")," · ",s.label]}),e.jsx("span",{className:`text-[10px] font-mono font-bold tracking-widest uppercase truncate max-w-[220px] ${s.subtext}`,children:r})]}),e.jsx("div",{className:"my-auto w-full flex-1 flex flex-col justify-center z-10 py-2 relative overflow-hidden",children:se(_,!1)}),e.jsxs("div",{className:"flex items-center justify-between gap-2 z-10 border-t border-current/10 pt-2.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 flex-1 min-w-0",children:[e.jsx(_e,{className:`h-3.5 w-3.5 shrink-0 ${s.accent}`}),e.jsx("input",{type:"text",value:I(_.takeaway||""),onChange:t=>oe(h,{takeaway:t.target.value}),placeholder:"Añadir conclusión ejecutiva inferior (Takeaway)...",className:`w-full bg-transparent border-none outline-none text-[10px] sm:text-xs font-bold truncate ${s.accent} placeholder:opacity-50`})]}),e.jsx("span",{className:`text-[10px] font-semibold shrink-0 opacity-60 ${s.subtext}`,children:"WAPPY Canvas 2.0"})]})]}),e.jsxs("div",{className:"bg-surface-primary border border-border-medium rounded-2xl p-3 sm:p-4 shadow-sm space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsxs("span",{className:"text-xs font-extrabold text-text-primary uppercase tracking-wider flex items-center gap-1.5",children:[e.jsx(Qt,{className:"h-4 w-4 text-teal-500"}),"Diseño Ejecutivo, Tema y Contenido de la Lámina"]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(de,{onClick:()=>J(!0),icon:e.jsx(zt,{className:"h-4 w-4"}),label:"Evidencia / Imagen",title:"Agregar fotografía o evidencia visual a la diapositiva",variant:"blue",size:"sm"}),e.jsx(de,{onClick:Ce,icon:e.jsx(rt,{className:"h-4 w-4"}),label:"Añadir Punto",title:"Añadir nuevo punto clave a la diapositiva",variant:"emerald",size:"sm"}),e.jsx(de,{onClick:()=>S(!w),icon:w?e.jsx(Jt,{className:"h-4 w-4"}):e.jsx(Yt,{className:"h-4 w-4"}),label:w?"Contraer Panel":"Expandir Panel",title:w?"Contraer opciones avanzadas":"Expandir opciones de temas, puntos y notas",variant:"neutral",size:"sm",isActive:w})]})]}),w&&e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 border-t border-border-light",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Estructura Visual (10 Estructuras Ejecutivas)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-5 gap-1.5",children:la.map(t=>{const o=(_.layout||"bullets")===t.key;return e.jsx("button",{onClick:()=>oe(h,{layout:t.key}),className:`py-1.5 px-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer text-center ${o?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 shadow-xs":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,title:t.desc,children:t.label},t.key)})})]}),e.jsxs("div",{className:"space-y-2 pt-1",children:[e.jsx("div",{className:"flex items-center justify-between",children:e.jsxs("span",{className:"text-[11px] font-bold text-text-secondary uppercase",children:["Puntos Clave de la Diapositiva (",_.bullets.length,")"]})}),e.jsx("div",{className:"space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin",children:_.bullets.map((t,o)=>e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-[10px] font-mono font-bold text-teal-500 w-4",children:["0",o+1]}),e.jsx("input",{type:"text",value:I(t),onChange:l=>Ge(o,l.target.value),className:"flex-1 h-8 px-2.5 text-xs bg-surface-secondary border border-border-medium rounded-lg outline-none focus:border-teal-500 text-text-primary"}),e.jsx("button",{onClick:()=>Ee(o),disabled:_.bullets.length<=1,className:"p-1.5 text-text-tertiary hover:text-rose-500 disabled:opacity-30 cursor-pointer",title:"Eliminar punto",children:e.jsx(nt,{className:"h-3.5 w-3.5"})})]},o))})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-text-secondary uppercase block mb-1.5",children:"Paleta y Atmósfera (8 Temas Corporativos)"}),e.jsx("div",{className:"grid grid-cols-2 sm:grid-cols-4 gap-1.5",children:Object.keys(De).map(t=>{const o=De[t],l=(_.theme||"wappy-dark")===t;return e.jsxs("button",{onClick:()=>oe(h,{theme:t}),className:`flex items-center gap-1.5 p-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${l?"border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/20":"border-border-medium hover:bg-surface-hover text-text-secondary"}`,children:[e.jsx("div",{className:`h-3.5 w-3.5 rounded-md shrink-0 ${o.bg} border border-current/20`}),e.jsx("span",{className:"truncate",children:o.label})]},t)})})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("label",{className:"text-[11px] font-bold text-text-secondary uppercase flex items-center gap-1",children:[e.jsx(Ze,{className:"h-3 w-3 text-teal-500"}),"Notas del Orador (Guion de Exposición)"]}),e.jsx("textarea",{rows:2,value:I(_.speakerNotes||""),onChange:t=>oe(h,{speakerNotes:t.target.value}),placeholder:"Escribe aquí tus apuntes de exposición para esta diapositiva...",className:"w-full p-2.5 text-xs bg-surface-secondary border border-border-medium rounded-xl outline-none focus:border-teal-500 text-text-primary resize-none"})]})]})]})]})]}):e.jsx("div",{className:"flex-1 flex items-center justify-center",children:e.jsx("span",{className:"text-sm text-text-tertiary font-medium",children:"Cargando presentación..."})})]}),j(),A(),ae&&e.jsx(qt,{onClose:()=>me(!1),onImportTable:Qe,onImportChart:Ke,onImportBullets:Je,onImportMedia:t=>{we(t.publicUrl)},activeFileType:"presentation",initialTab:"media"})]})},zr=(a,u)=>{switch(a){case"Cpu":return e.jsx(aa,{className:`h-4 w-4 ${u}`});case"Layers":return e.jsx(dt,{className:`h-4 w-4 ${u}`});case"Plus":return e.jsx(rt,{className:`h-4 w-4 ${u}`});case"Eye":return e.jsx(ba,{className:`h-4 w-4 ${u}`});case"Sparkles":return e.jsx(_e,{className:`h-4 w-4 ${u}`});default:return e.jsx(aa,{className:`h-4 w-4 ${u}`})}};function ga(a){if(!a||typeof a!="string")return"";let u=a.trim();return u=u.replace(/<thinking>[\s\S]*?<\/thinking>/gi,"").trim(),u=u.replace(/^```(?:html|xml)?\s*\n?([\s\S]*?)\n?```$/i,"$1").trim(),u}function wt(a,u=!1){if(!a)return"";let r=ga(a);r=r.replace(/<style id="__wappy_standalone_design_system__">[\s\S]*?<\/style>\s*/gi,"").replace(/<script id="__wappy_modal_guard__">[\s\S]*?<\/script>\s*/gi,""),r=r.replace(/(<svg[^>]*>[\s\S]*?<path[^>]*?)fill="currentColor"/gi,'$1fill="rgba(255,255,255,0.25)"');const g=/<html[^>]*>/i.test(r),f=/<head[^>]*>/i.test(r),d=/bg-\[#0b0f19\]|dark|slate-900|slate-950|gradient-banner/i.test(r),C=`
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
`,h=`
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
    background-color: ${d?"#0b0f19":"#ffffff"} !important;
    color: ${d?"#f8fafc":"#1e293b"} !important;
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
    background-color: ${d?"rgba(15, 23, 42, 0.75)":"#ffffff"} !important;
    border: 1px solid ${d?"rgba(51, 65, 85, 0.7)":"#e2e8f0"} !important;
    border-radius: 1rem !important;
    padding: 1.25rem !important;
    margin-bottom: 1.25rem !important;
    color: ${d?"#f8fafc":"#1e293b"} !important;
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
    background-color: ${d?"rgba(30, 41, 59, 0.85)":"#f1f5f9"} !important;
    color: ${d?"#94a3b8":"#475569"} !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    font-size: 0.75rem !important;
    letter-spacing: 0.05em !important;
    padding: 0.75rem 1rem !important;
    border-bottom: 2px solid ${d?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
  }
  td:not(.wappy-entity-table td):not(.wappy-worker-table td):not(.wappy-signature-table td):not(.wappy-committee-table td) {
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid ${d?"rgba(51, 65, 85, 0.4)":"#e2e8f0"} !important;
    color: ${d?"#e2e8f0":"#1e293b"} !important;
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
    border: 1px solid ${d?"#334155":"#cbd5e1"} !important;
    border-radius: 0.625rem !important;
    padding: 0.55rem 0.85rem !important;
    outline: none !important;
    background-color: ${d?"#1e293b":"#ffffff"} !important;
    color: ${d?"#f8fafc":"#0f172a"} !important;
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
    border: 1px solid ${d?"rgba(51, 65, 85, 0.8)":"#cbd5e1"} !important;
    background-color: ${d?"#1e293b":"#f1f5f9"} !important;
    color: ${d?"#f8fafc":"#0f172a"} !important;
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
`,E=u?`
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
`,S=/<meta[^>]+name=["']viewport["']/i.test(r)?"":`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
`;return g?f?r=r.replace(/<head[^>]*>/i,$=>`${$}
${S}${E}${C}
${h}`):r=r.replace(/<html[^>]*>/i,$=>`${$}
<head>
${S}${E}${C}
${h}
</head>`):r=`<!DOCTYPE html>
<html lang="es" ${d?'class="dark"':""}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  ${E}
  ${C}
  ${h}
</head>
<body class="${d?"bg-[#0b0f19] text-slate-100":"bg-slate-50 text-slate-900"}">
  ${r}
</body>
</html>`,r}const Or=({initialContent:a,onUpdate:u,title:r,isMaximized:g=!1,onRegisterDownload:f})=>{const{user:d}=Pt(),C=(d==null?void 0:d.role)==="ADMIN"||(d==null?void 0:d.role)==="USER_PRO"||(d==null?void 0:d.role)==="USER_IPEVAR"||(d==null?void 0:d.role)==="IPEVAR",[h,E]=n.useState(""),[w,S]=n.useState(g?"split":"preview"),[$,ie]=n.useState(!1),[Q,U]=n.useState(0),V=n.useRef(null),O=n.useRef(null),G=n.useRef(null),[xe,ge]=Ht(xt.canvasMaximized),[ee,D]=n.useState(!1),[z,q]=n.useState(!1),W=m=>{const L=h||"";let Y="";/<\/body>/i.test(L)?Y=L.replace(/<\/body>/i,`
${m}
</body>`):Y=`${L}
${m}`,E(Y),u(Y),U(he=>he+1)};n.useEffect(()=>{const m=()=>{document.fullscreenElement||D(!1)};return document.addEventListener("fullscreenchange",m),document.addEventListener("webkitfullscreenchange",m),()=>{document.removeEventListener("fullscreenchange",m),document.removeEventListener("webkitfullscreenchange",m)}},[]),n.useEffect(()=>{const m=L=>{L.key==="Escape"&&ee&&D(!1)};return window.addEventListener("keydown",m),()=>window.removeEventListener("keydown",m)},[ee]);const ae=async()=>{const m=!ee;D(m),m&&ge(!0);const L=G.current||O.current;if(m)try{L!=null&&L.requestFullscreen?await L.requestFullscreen():L.webkitRequestFullscreen&&await L.webkitRequestFullscreen()}catch{}else try{document.fullscreenElement&&(document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen())}catch{}};n.useEffect(()=>{const m=()=>{const L=window.innerWidth<640;(!g||L)&&w==="split"&&S("preview")};return m(),window.addEventListener("resize",m),()=>window.removeEventListener("resize",m)},[g,w]),n.useEffect(()=>{E(a?ga(a):`<!DOCTYPE html>
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
</html>`)},[a]);const me=m=>{const L=m.target.value;E(L),u(L)},ce=n.useCallback(async()=>{try{const m=h||a||"";if(!m)return;const L=wt(m,!0),Y=(r||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),he=Y.endsWith(".html")?Y:`${Y}.html`,X=new Blob([L],{type:"text/html;charset=utf-8"});if(typeof navigator<"u"&&navigator.canShare&&typeof File<"u")try{const le=new File([X],he,{type:"text/html"});if(navigator.canShare({files:[le]})){await navigator.share({files:[le],title:r||"Aplicativo SST"});return}}catch(le){if((le==null?void 0:le.name)==="AbortError")return;console.warn("Native share failed, falling back to saveAs:",le)}Vt.saveAs(X,he)}catch(m){console.error("Error al descargar HTML:",m);try{const Y=wt(h||a||"",!0),he=(r||"aplicativo-sst").replace(/[/\\?%*:|"<>]/g,"_").trim(),X=he.endsWith(".html")?he:`${he}.html`,le=new Blob([Y],{type:"text/html;charset=utf-8"}),Ie=URL.createObjectURL(le),Se=document.createElement("a");Se.href=Ie,Se.download=X,Se.target="_blank",document.body.appendChild(Se),Se.click(),setTimeout(()=>{try{document.body.removeChild(Se),URL.revokeObjectURL(Ie)}catch{}},5e3)}catch(L){console.error("Fallback download failed:",L)}}},[h,a,r]),J=()=>{const m=wt(h,!0),L=new Blob([m],{type:"text/html;charset=utf-8"}),Y=URL.createObjectURL(L);window.open(Y,"_blank")},K=na.useMemo(()=>wt(h),[h]);return n.useEffect(()=>{f&&f(ce)},[f,h,r]),e.jsxs("div",{ref:O,className:"flex-1 h-full flex overflow-hidden relative bg-surface-primary border border-border-medium rounded-2xl shadow-sm",children:[$&&e.jsx("div",{className:`${g?"sm:hidden":""} absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[440] transition-opacity duration-300 animate-in fade-in`,onClick:()=>ie(!1)}),e.jsxs("div",{className:`flex-shrink-0 border-r border-border-medium bg-surface-secondary flex flex-col transition-all duration-300 absolute inset-y-0 left-0 z-[450] ${g?"sm:relative sm:z-0":"shadow-2xl"} ${$?"w-[280px] sm:w-[320px]":"w-0 overflow-hidden border-r-0"}`,children:[e.jsxs("div",{className:"p-3.5 border-b border-border-medium flex items-center justify-between shrink-0 bg-surface-primary",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(dt,{className:"h-4 w-4 text-teal-600 animate-pulse"}),e.jsx("span",{className:"text-xs font-extrabold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent",children:"Biblioteca Aplicativos SST"})]}),e.jsx("button",{onClick:()=>ie(!1),className:"px-2 py-0.5 rounded-lg text-[10px] font-bold bg-surface-secondary hover:bg-surface-hover text-text-secondary cursor-pointer",children:"Cerrar"})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin",children:[e.jsxs("div",{className:"text-[10px] font-bold text-text-tertiary uppercase tracking-wider px-1 mb-1 flex items-center gap-1",children:[e.jsx(_e,{className:"h-3 w-3 text-amber-500"}),"Simuladores y Calculadoras SST"]}),e.jsx("div",{className:"space-y-2.5",children:hr.map(m=>e.jsxs("button",{onClick:()=>{if(!C){alert("Este aplicativo premium es exclusivo para usuarios Pro de Wappy. Por favor actualice su suscripción.");return}h&&h.trim()!==""&&!h.includes("Prototipo de Código WAPPY")&&!h.includes("Prototipo Interactivo WAPPY")&&!window.confirm(`¿Deseas reemplazar el código actual por el aplicativo "${m.title}"? Se perderán las modificaciones no guardadas.`)||(E(m.code),u(m.code),g||ie(!1))},className:"w-full text-left rounded-xl border border-border-medium/60 p-3 bg-surface-primary hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-500/5 transition-all duration-300 group flex items-start gap-2.5 cursor-pointer animate-in fade-in duration-200",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg bg-surface-secondary flex items-center justify-center border border-border-medium/40 shrink-0 group-hover:scale-105 transition-transform",children:zr(m.iconType,m.color)}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("h4",{className:"text-xs font-bold text-text-primary group-hover:text-teal-600 transition-colors",children:m.title}),C?e.jsx("span",{className:"text-[8px] font-bold text-teal-500 bg-teal-500/5 px-1 py-0.2 rounded border border-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity",children:"+ Insertar"}):e.jsxs("span",{className:"flex items-center gap-1 text-[8px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0",children:[e.jsx(Ga,{className:"h-2 w-2"}),"PRO"]})]}),e.jsx("p",{className:"text-[10px] text-text-tertiary mt-1 leading-snug line-clamp-2",children:m.description})]})]},m.id))})]})]}),e.jsxs("div",{className:"flex-1 flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2 px-3 py-2 border-b border-border-medium bg-surface-secondary flex-wrap",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(de,{onClick:()=>ie(m=>!m),icon:e.jsx(dt,{className:"h-4 w-4"}),label:"Biblioteca SST",title:"Abrir simuladores, calculadoras y componentes interactivos SST",variant:"amber",size:"sm",isActive:$}),e.jsxs("div",{className:"flex items-center gap-1 bg-surface-primary border border-border-medium rounded-xl p-1 shadow-xs",children:[g&&e.jsxs("button",{onClick:()=>S("split"),className:`hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${w==="split"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(Ha,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Dividido"})]}),e.jsxs("button",{onClick:()=>S("code"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${w==="code"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(kt,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Código"})]}),e.jsxs("button",{onClick:()=>S("preview"),className:`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-300 cursor-pointer ${w==="preview"?"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-extrabold":"text-text-secondary hover:bg-surface-hover"}`,children:[e.jsx(ba,{className:"h-3.5 w-3.5"}),e.jsx("span",{children:"Vista Previa"})]})]})]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(de,{onClick:()=>q(!0),icon:e.jsx(_e,{className:"h-4 w-4"}),label:"Conectar Recursos IA",title:"Insertar imágenes, videos o infografías de Google Flow y NotebookLM",variant:"purple",size:"sm"}),(w==="preview"||w==="split")&&e.jsxs(e.Fragment,{children:[e.jsx(de,{onClick:()=>U(m=>m+1),icon:e.jsx(Ua,{className:"h-4 w-4"}),label:"Recargar Vista",title:"Recargar vista previa interactiva",variant:"cyan",size:"sm"}),e.jsx(de,{onClick:J,icon:e.jsx(ta,{className:"h-4 w-4"}),label:"Abrir en Pestaña",title:"Abrir aplicativo en una pestaña nueva del navegador",variant:"fuchsia",size:"sm"}),e.jsx(de,{onClick:ae,icon:ee?e.jsx(Gt,{className:"h-4 w-4"}):e.jsx(fa,{className:"h-4 w-4"}),label:ee?"Salir":"Pantalla Completa",title:ee?"Salir Pantalla Completa":"Pantalla Completa",variant:"neutral",size:"sm"})]}),e.jsx(de,{onClick:ce,icon:e.jsx(ct,{className:"h-4 w-4"}),label:"Descargar Aplicativo",title:"Descargar aplicativo interactivo autocontenido",variant:"green",size:"sm"})]})]}),e.jsxs("div",{className:"flex-1 flex overflow-hidden",children:[(w==="split"||w==="code")&&e.jsxs("div",{className:"flex-1 h-full relative border-r border-border-medium",children:[e.jsx("textarea",{ref:V,value:h,onChange:me,className:"w-full h-full p-4 font-mono text-xs bg-slate-950 text-slate-200 resize-none outline-none leading-relaxed overflow-auto scrollbar-thin",spellCheck:"false",placeholder:"Introduce tu código HTML/CSS/JS aquí..."}),e.jsxs("div",{className:"absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-400 rounded-lg shadow select-none",children:[e.jsx(Va,{className:"h-3 w-3 text-emerald-400 animate-pulse"}),e.jsx("span",{children:"Auto-refreshing"})]})]}),(w==="split"||w==="preview")&&e.jsx("div",{ref:G,className:tr("flex-1 h-full min-h-0 min-w-0 bg-white relative flex flex-col overflow-hidden",ee&&"invisible"),children:e.jsx("iframe",{title:"Canvas Live View",className:"w-full h-full flex-1 border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:K},Q)})]}),ee&&typeof document<"u"&&Et.createPortal(e.jsxs("div",{className:"fixed inset-0 z-[99999999] w-full h-[100dvh] bg-white flex flex-col overflow-hidden animate-in fade-in duration-150",children:[e.jsxs("div",{className:"shrink-0 flex items-center justify-between px-3 py-2 bg-slate-900/95 text-white backdrop-blur-md border-b border-slate-800 shadow-md pt-[max(0.5rem,env(safe-area-inset-top))]",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0 pr-2",children:[e.jsx("span",{className:"h-2 w-2 rounded-full bg-teal-400 shrink-0 animate-pulse"}),e.jsx("span",{className:"text-xs font-bold truncate text-slate-200 max-w-[160px] sm:max-w-[400px]",children:r||"Informe Técnico SST"}),e.jsx("span",{className:"text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono hidden sm:inline-block",children:"Pantalla Completa"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 shrink-0",children:[e.jsxs("button",{type:"button",onClick:J,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Abrir en pestaña nueva",children:[e.jsx(ta,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Pestaña"})]}),e.jsxs("button",{type:"button",onClick:ce,className:"px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 active:scale-95 border border-slate-700",title:"Descargar documento HTML",children:[e.jsx(ct,{className:"h-3.5 w-3.5 text-teal-400"}),e.jsx("span",{className:"hidden sm:inline text-[11px] font-semibold",children:"Descargar"})]}),e.jsxs("button",{type:"button",onClick:ae,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-teal-500/30",title:"Salir de pantalla completa",children:[e.jsx(Gt,{className:"h-3.5 w-3.5"}),e.jsx("span",{className:"text-[11px]",children:"Salir"})]})]})]}),e.jsx("div",{className:"flex-1 w-full h-full min-h-0 bg-white relative",children:e.jsx("iframe",{title:"Canvas Live View Fullscreen",className:"w-full h-full border-none bg-white min-h-0 min-w-0",sandbox:"allow-scripts allow-modals allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-downloads allow-pointer-lock",allow:"fullscreen; presentation; clipboard-read; clipboard-write; autoplay",srcDoc:K},`fullscreen-${Q}`)})]}),document.body),z&&e.jsx(qt,{onClose:()=>q(!1),onImportTable:W,onImportMedia:(m,L)=>W(L),activeFileType:"html",initialTab:"media"})]})]})},Dr=(a,u,r)=>{const g=`<${r}`,f=`</${r}>`;let d=0,C=u;for(;C<a.length;)if(a.slice(C,C+g.length).toLowerCase()===g)d++,C+=g.length;else if(a.slice(C,C+f.length).toLowerCase()===f){if(d--,d===0)return C+f.length;C+=f.length}else C++;return-1},ot=(a,u="")=>{const r=String(a||"").trim().replace(/^https?:\/\/(?:app\.)?wappy\.club(?=\/(?:images|api\/notebooklm\/download)\/)/i,""),g=r.toLowerCase(),f=String(u||"").replace(/<[^>]+>/g,"").replace(/"/g,"&quot;").trim();if(g.includes("_audio_")||g.includes("_podcast_")||g.includes("type=audio")||g.includes("type=podcast")||/\.(mp3|wav|m4a|ogg)(?:$|\?)/i.test(g))return`<div style="margin:22px 0;padding:18px 22px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;box-shadow:0 4px 14px rgba(13,148,136,0.08);"><div style="font-weight:700;color:#0f766e;font-size:14px;margin-bottom:10px;">🎙️ ${f||"Podcast / Audio Explicativo"}</div><audio controls preload="metadata" src="${r}" style="width:100%;display:block;"></audio><div style="margin-top:10px;font-size:12px;"><a href="${r}" download target="_blank" rel="noopener noreferrer" style="color:#0d9488;font-weight:700;text-decoration:underline;">⬇ Descargar Audio / Podcast</a></div></div>`;if(g.includes("_vid_")||g.includes("_video_")||g.includes("type=video")||g.includes("type=cinematic_video")||/\.(mp4|webm|mov)(?:$|\?)/i.test(g))return`<figure style="margin:24px 0;text-align:center;background:#0f172a;padding:18px;border-radius:14px;border:1px solid #334155;box-shadow:0 8px 24px rgba(15,23,42,0.18);"><video controls playsinline preload="metadata" src="${r}" style="max-width:100%;max-height:480px;border-radius:10px;background:#000;display:block;margin:0 auto;"></video><figcaption style="margin-top:10px;font-size:12px;color:#cbd5e1;font-weight:600;">🎬 ${f||"Video Explicativo"} · <a href="${r}" download target="_blank" rel="noopener noreferrer" style="color:#2dd4bf;text-decoration:underline;">⬇ Descargar Video MP4</a></figcaption></figure>`;if(g.includes("_quiz_")||g.includes("_flashcards_")||g.includes("_mindmap_")||g.includes("_table_")||g.includes("_slides_")||g.includes("_report_")||g.includes("type=quiz")||g.includes("type=flashcards")||g.includes("type=mind_map")||g.includes("type=data_table")||g.includes("type=slide_deck")||g.includes("type=report")||/\.(pdf|pptx|csv|md|markdown|json|docx|xlsx)(?:$|\?)/i.test(g))return`<div style="margin:18px 0;padding:16px 20px;background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid #0d9488;border-radius:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="font-weight:700;color:#0f172a;font-size:13px;">📄 ${f||"Recurso / Documento Descargable"}</div><a href="${r}" download target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:8px 14px;background:#0d9488;color:#ffffff;font-weight:700;font-size:12px;border-radius:8px;text-decoration:none;">⬇ Descargar Recurso</a></div>`;const d=f||"Infografía / Recurso Visual Oficial";return`<figure style="margin:24px 0;text-align:center;background:#f8fafc;padding:16px;border-radius:14px;border:1px solid #e2e8f0;"><img src="${r}" alt="${d}" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,0.08);display:block;margin:0 auto;" /><figcaption style="margin-top:10px;font-size:12px;color:#475569;font-style:italic;font-weight:600;">${d}</figcaption></figure>`},Ut=a=>a&&a.replace(/<p>\s*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)\s*<\/p>/gi,(u,r,g)=>ot(g,r)).replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(u,r,g)=>ot(g,r)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(u,r,g)=>ot(g,r)).replace(/<p>\s*<em>\s*(<strong>[^<]+<\/strong>[\s\S]*?)<\/em>([^<*]+)\*([\s\S]*?)<\/p>/gi,(u,r,g,f)=>`<ul><li>${r}<em>${g.trim()}</em>${f}</li></ul>`).replace(/\*\*([^*\n<]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n<]+)\\*\\*","g"),"<strong>$1</strong>").replace(/<\/strong>\*/g,"</strong>").replace(/<\/em>\*/g,"</em>"),it=a=>a?a.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,(g,f,d)=>ot(d,f)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\(((?:https?:\\/\\/(?:app\\.)?wappy\\.club)?\\/(?:images\\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\\s]+|api\\/notebooklm\\/download\\/[^)\\s]+))\\)`,"gi"),(g,f,d)=>ot(d,f)).replace(new RegExp(`(?<![!">'=])\\[([^\\]]+)\\]\\((https?:\\/\\/[^)\\s]+)\\)`,"gi"),'<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#004d99;text-decoration:underline;">$1</a>').split(/(<[^>]+>)/g).map(g=>!g||g.startsWith("<")?g:g.replace(/`([^`\n]+)`/g,'<code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:0.9em;color:#0f172a;">$1</code>').replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>").replace(/\*\*([^*\n]+)\*(?!\*)/g,"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*\\*","g"),"<strong>$1</strong>").replace(new RegExp("(?<!\\*)\\*([^*\\n]+)\\*(?!\\*)","g"),"<em>$1</em>")).join(""):"",Ir=a=>{const r=a.replace(/\r\n?/g,`
`).split(`
`),g=[];for(const f of r){const d=f.trim();if(!d||/^#{1,6}\s/.test(d)||d.startsWith("<")||d.startsWith("|")||d.startsWith(">")||d.startsWith("![")){g.push(f);continue}let C=f;C=C.replace(/(\d+\.\s+[A-ZÁÉÍÓÚÑ]{2,})([A-ZÁÉÍÓÚÑ][a-záéíóúñ]{2,})/g,`$1

$2`),C=C.replace(new RegExp('(?<!\\d)(?<!\\b(?:Art|Res|Dec|Cap|Sec|Num|Nro|Inc|Lit|Par|No)\\.)([a-záéíóúñ)\\]»”".,;:])(\\d+\\.\\s+[A-ZÁÉÍÓÚÑ]{2,}(?![A-Za-zÁÉÍÓÚÑáéíóúñ]))',"g"),(h,E,w,S,$)=>E==="."&&S>0&&/\d/.test($[S-1])?h:`${E}

${w}`),g.push(C)}return g.join(`
`)},$r=a=>{const u=[],r=O=>{const G=`@@CANVAS_MD_BLOCK_${u.length}@@`;return u.push(O),`

${G}

`};let g=a.replace(/\r\n?/g,`
`);const f=/((?:^|\n)\|[^\n]+\|[^\n]*\n\|[ \t]*:?-+:?[ \t]*\|[^\n]*\n(?:\|[^\n]+\|[^\n]*(?:\n|$))+)/g;g=g.replace(f,O=>{const G=O.trim().split(`
`).map(W=>W.trim());if(G.length<2)return O;const xe=G[0].split("|").map(W=>W.trim()).filter((W,ae,me)=>ae>0&&ae<me.length-1),ee=G[1].split("|").map(W=>W.trim()).filter((W,ae,me)=>ae>0&&ae<me.length-1).map(W=>W.startsWith(":")&&W.endsWith(":")?"center":W.endsWith(":")?"right":W.startsWith(":")?"left":""),D=xe.map((W,ae)=>`<th${ee[ae]?` align="${ee[ae]}"`:""} style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; font-weight: bold; text-align: ${ee[ae]||"left"};">${it(W)}</th>`).join(""),z=G.slice(2).map(W=>`<tr>${W.split("|").map(ce=>ce.trim()).filter((ce,J,K)=>J>0&&J<K.length-1).map((ce,J)=>`<td${ee[J]?` align="${ee[J]}"`:""} style="border: 1px solid #ddd; padding: 8px; text-align: ${ee[J]||"left"};">${it(ce)}</td>`).join("")}</tr>`).join(""),q=`<div style="overflow-x:auto; margin: 15px 0;"><table style="border-collapse: collapse; width: 100%; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;"><thead><tr>${D}</tr></thead><tbody>${z}</tbody></table></div>`.replace(/\n/g,"");return r(q)}),g=g.replace(/^[ \t]*!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)[ \t]*$/gm,(O,G,xe)=>r(ot(xe,G))).replace(/^[ \t]*\[([^\]]+)\]\(((?:https?:\/\/(?:app\.)?wappy\.club)?\/(?:images\/(?:flow_|nlm_|antigravity_|ag_|sst_)[^)\s]+|api\/notebooklm\/download\/[^)\s]+))\)[ \t]*$/gim,(O,G,xe)=>r(ot(xe,G))),g=Ir(g);const d=g.split(`
`),C=[];let h=[],E=[],w=null,S=1,$=[];const ie=()=>{if(h.length===0)return;const O=h.map(G=>it(G)).join("<br/>");C.push(`<p>${O}</p>`),h=[]},Q=()=>{if(E.length===0)return;const O=E.map(G=>it(G)).join("<br/>");C.push(`<blockquote style="border-left: 3px solid #004d99; padding: 6px 12px; margin: 10px 0; background: #f8fafc; color: #334155; font-style: italic;">${O}</blockquote>`),E=[]},U=()=>{if(!w||$.length===0){w=null,$=[],S=1;return}const O=$.map(G=>`<li>${it(G)}</li>`).join("");if(w==="ol"){const G=S!==1?` start="${S}"`:"";C.push(`<ol${G}>${O}</ol>`)}else C.push(`<ul>${O}</ul>`);w=null,$=[],S=1},V=()=>{ie(),Q(),U()};for(const O of d){const G=O.trim();if(!G){V();continue}const xe=G.match(/^@@CANVAS_MD_BLOCK_(\d+)@@$/);if(xe){V();const q=Number(xe[1]);u[q]!==void 0&&C.push(u[q]);continue}if(/^(?:---+|\*\*\*+|___+)$/.test(G)){V(),C.push("<hr/>");continue}const ge=G.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);if(ge){V();const q=ge[1].length,W=it(ge[2].trim());C.push(`<h${q}>${W}</h${q}>`);continue}const ee=O.match(/^\s*[-*•]\s+(.+)$/);if(ee){ie(),Q(),w!=="ul"&&(U(),w="ul"),$.push(ee[1].trim());continue}const D=O.match(/^\s*(\d+)\.\s+(.+)$/);if(D){ie(),Q();const q=parseInt(D[1],10);w!=="ol"&&(U(),w="ol",S=Number.isFinite(q)&&q>0?q:1),$.push(D[2].trim());continue}const z=O.match(/^\s*>\s?(.*)$/);if(z){ie(),U(),E.push(z[1].trim());continue}if(/^<(?:div|table|figure|hr|h[1-6]|ul|ol|blockquote|section|article|header|footer|p)[\s>/]/i.test(G)){V(),C.push(G);continue}U(),Q(),h.push(G)}return V(),Ut(C.join(`
`))};function Lr(a){if(typeof a!="string"||!a)return String(a??"");if(a.trim().startsWith("<")&&!a.includes("#")&&!a.includes("**")&&!a.includes("---"))return Ut(a);let u="",r=a,g="",f=0;for(;f<a.length;){const S=a.substring(f).search(/\S/);if(S===-1)break;const $=f+S,ie=a.substring($);if(ie.startsWith("<!--")){const Q=ie.indexOf("-->");if(Q!==-1){f=$+Q+3;continue}}else if(ie.startsWith("<div")||ie.startsWith("<table")||ie.startsWith("<style")){const Q=ie.startsWith("<div")?"div":ie.startsWith("<table")?"table":"style",U=Dr(a,$,Q);if(U!==-1){f=U;continue}}break}f>0&&(u=a.substring(0,f),r=a.substring(f));const d=['<div style="margin-top: 60px;','<div style="margin-top:60px;','<div style="margin-top: 50px;','<div style="margin-top:50px;','<div style="page-break-inside:avoid;','<div style="page-break-inside: avoid;','<div class="signature-placeholder'];let C=-1;for(const w of d){const S=r.lastIndexOf(w);S!==-1&&(C===-1||S<C)&&(C=S)}C!==-1&&(g=r.substring(C),r=r.substring(0,C));const E=r.split(/(<div[\s\S]*?<\/div>|<table[\s\S]*?<\/table>|<figure[\s\S]*?<\/figure>)/i).map(w=>w?w.trim().startsWith("<")?w:$r(w):"").join("");return Ut(u+E+g)}const Mr=new Set(["text","excel","presentation","html","animo","actos_condiciones"]),lt=a=>{if(a==null)return"";if(typeof a=="string")return a;if(typeof a=="object")try{return JSON.stringify(a)}catch{return""}return String(a)},Tt=(a,u="text")=>{if(!a)return u;if(Array.isArray(a))return a.length===0?u:Array.isArray(a[0])?"excel":typeof a[0]=="object"&&a[0]!==null?"title"in a[0]||"bullets"in a[0]||"layout"in a[0]?"presentation":"excel":u;if(typeof a=="object"){if(a.estadoAnimo||a.totalMuestras)return"animo";if(a.preliminarClasificacion||a.totalReportesBuzon)return"actos_condiciones";if(Array.isArray(a.slides)||Array.isArray(a.presentation))return"presentation";if(Array.isArray(a.rows)||Array.isArray(a.data))return"excel";const r=Object.keys(a);return r.length>0&&r.every(g=>Array.isArray(a[g]))?"excel":u}if(typeof a=="string"){const r=a.trim(),g=r.toLowerCase();if(g.includes("<!doctype html")||g.includes("<html"))return"html";if(r.startsWith("[")&&r.endsWith("]"))try{const f=JSON.parse(r);return Tt(f,u)}catch{}else if(r.startsWith("{")&&r.endsWith("}"))try{const f=JSON.parse(r);if(f&&typeof f=="object")return Tt(f,u)}catch{}}return u},jt=(a,u)=>{const g=lt(u).trim().toLowerCase();return a==="html"||g.includes("<!doctype html")||g.includes("<html")?"html":typeof a=="string"&&Mr.has(a)?a:Tt(u,"text")},_r=`
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
</div>`;function at(a){return typeof a!="string"||!a?String(a??""):a.includes("signature-placeholder")||a.includes("RESPONSABLE SST")||/responsable\s+(sg-)?sst/i.test(a)||/representante\s+legal/i.test(a)||/firmas?\s+y\s+responsabilidades/i.test(a)||/evaluador\s+t[eé]cnico/i.test(a)||/firma:?\s*_{3,}/i.test(a)||a.includes("Licencia No.")?a:a+_r}const Fr=1e8,Br=({version:a,title:u,onRename:r,onDelete:g})=>{const[f,d]=n.useState(!1),[C,h]=n.useState({}),[E,w]=n.useState(!1),S=n.useRef(null),$=n.useRef(null),ie=()=>{if(!S.current)return;const V=S.current.getBoundingClientRect();h({position:"fixed",top:V.bottom+4,right:window.innerWidth-V.right,zIndex:Fr})};n.useEffect(()=>{if(!f)return;const V=O=>{var xe,ge;const G=O.target;!((xe=S.current)!=null&&xe.contains(G))&&!((ge=$.current)!=null&&ge.contains(G))&&d(!1)};return document.addEventListener("mousedown",V),()=>document.removeEventListener("mousedown",V)},[f]);const Q=async V=>{V.stopPropagation(),d(!1),window.confirm(`¿Eliminar la versión ${a} del historial?
Esta acción no se puede deshacer.`)&&(w(!0),await g(),w(!1))},U=f?e.jsxs("div",{ref:$,style:C,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[e.jsxs("button",{onClick:V=>{V.stopPropagation();const O=prompt("Nuevo nombre para esta versión:",u);O&&O!==u&&r(O),d(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[e.jsx(Za,{className:"h-3 w-3 text-teal-600"})," Renombrar"]}),e.jsxs("button",{onClick:Q,disabled:E,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[e.jsx(er,{className:"h-3.5 w-3.5"})," Eliminar"]})]}):null;return e.jsxs(e.Fragment,{children:[e.jsx("button",{ref:S,onClick:V=>{V.stopPropagation(),ie(),d(O=>!O)},className:"shrink-0 rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:e.jsx(Ka,{className:"h-4 w-4 text-text-secondary"})}),da.createPortal(U,document.body)]})},Gr=2500,Hr=1e4,No=({conversationId:a,embeddedInTenshiHero:u=!1,onCloseOverride:r,onSelectConversationOverride:g,isEmbeddedVisible:f=!0,onSessionStateChange:d})=>{const{showToast:C}=ar(),{token:h,user:E}=Pt(),w=(E==null?void 0:E.role)==="ADMIN"||(E==null?void 0:E.role)==="USER_PRO"||(E==null?void 0:E.role)==="USER_IPEVAR"||(E==null?void 0:E.role)==="IPEVAR",[S,$]=n.useState(!1),[ie,Q]=n.useState(""),[U,V]=n.useState(""),[O,G]=Ht(xt.canvasMaximized),xe=ra(xt.isCanvasActive),ge=ra(gt(a??"new")),ee=n.useCallback(()=>{if(G(!1),u){xe(!1),r==null||r();return}xe(!1),ge(x=>x!=null&&x.tools?{...x,tools:x.tools.filter(T=>T!=="canvas"&&T!=="consultar_analitica_psicosocial"&&T!=="consultar_analitica_actos_condiciones")}:x)},[u,r,xe,G,ge]),D=oa(xt.isSubmittingFamily(0)),[z,q]=Ht(xt.streamingCanvasState),W=n.useRef(z!=null&&z.content?Date.now():0),ae=n.useRef(d);ae.current=d;const me=n.useCallback((x,T)=>{const P=(T||"").trim();if(P&&P!=="Archivo sin título")return P;if(typeof x=="string"&&x.length>0){const F=x.match(/<title[^>]*>([\s\S]*?)<\/title>/i);if(F!=null&&F[1]){const H=F[1].replace(/<[^>]+>/g,"").trim();if(H&&H!=="Plantilla Informativa SST")return H.slice(0,90)}const M=x.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);if(M!=null&&M[1]){const H=M[1].replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim();if(H)return H.slice(0,90)}}return P||"Documento SG-SST"},[]),ce=na.useMemo(()=>z?jt(z.fileType,z.content):"text",[z]),J=lt(z==null?void 0:z.content),K=z?me(J,z.title):"Archivo sin título",[m,L]=n.useState(ce),[Y,he]=n.useState(J),[X,le]=n.useState(K),[Ie,Se]=n.useState(1),[Fe,Ae]=n.useState([]),[$e,Oe]=n.useState(!1),[Te,Re]=n.useState(!1),[Le,we]=n.useState(!1),fe=!!Y||m!=="text"&&m!=="actos_condiciones"&&m!=="animo"||m==="actos_condiciones"||m==="animo";n.useEffect(()=>{var x;(x=ae.current)==null||x.call(ae,fe,X)},[fe,X]);const re=n.useRef(J),be=n.useRef(ce),ke=n.useRef(K),oe=n.useRef(null),We=n.useRef(!1),ue=n.useRef(null),Be=n.useRef(!1),Me=n.useRef(null),Ge=n.useRef(ce),Ce=n.useRef(K);n.useEffect(()=>{m!=="animo"&&m!=="actos_condiciones"&&(Ge.current=m)},[m]),n.useEffect(()=>{m!=="animo"&&m!=="actos_condiciones"&&(Ce.current=X)},[X,m]);const Ee=x=>{Me.current&&clearTimeout(Me.current),Be.current=!0,Me.current=setTimeout(()=>{Be.current=!1,Me.current=null},x)},Xe=n.useRef(!1),Ve=n.useRef(null),Qe=Sr(),[Ke,Je]=n.useState(!1),He=kr(),Ye=rr(),N=Ye==null?void 0:Ye.setConversation,k=qa(({snapshot:x,set:T})=>async P=>{const F=a||"new",M=await x.getPromise(gt(F));M&&T(gt(P),M)},[a]),_=oa(gt(a??"new"));n.useEffect(()=>{const x=(_==null?void 0:_.tools)??[];x.includes("consultar_analitica_psicosocial")?(L("animo"),le("Termómetro Psicosocial")):x.includes("consultar_analitica_actos_condiciones")?(L("actos_condiciones"),le("Analítica de Actos y Condiciones")):(Ge.current&&L(Ge.current),Ce.current&&Ce.current!=="Archivo sin título"&&le(Ce.current))},[_]),n.useEffect(()=>{re.current=Y},[Y]),n.useEffect(()=>{be.current=m},[m]),n.useEffect(()=>{ke.current=X},[X]),n.useEffect(()=>{const x=()=>{if(ue.current){const T=a;T&&T!=="new"&&fetch(`/api/sgsst/canvas/${T}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`},body:JSON.stringify({content:be.current==="text"?at(re.current):re.current,title:ke.current,fileType:be.current,isManual:!0}),keepalive:!0})}};return window.addEventListener("beforeunload",x),()=>{if(window.removeEventListener("beforeunload",x),ue.current){clearTimeout(ue.current),ue.current=null;const T=a;T&&T!=="new"&&fetch(`/api/sgsst/canvas/${T}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`},body:JSON.stringify({content:be.current==="text"?at(re.current):re.current,title:ke.current,fileType:be.current,isManual:!0})}).catch(P=>console.error("[CanvasPanel] Save on exit error:",P))}}},[a,h]);const s=n.useCallback(x=>Lr(x),[]);n.useEffect(()=>{if(z){const x=lt(z.content),T=jt(z.fileType,z.content),P=me(x,z.title),F=T==="text"?s(x):x;W.current=Date.now(),he(F),re.current=F,L(T),be.current=T,Ge.current=T,le(P),ke.current=P,Ce.current=P}},[z,s,me]);const c=n.useCallback(async(x=!1)=>{if(!(!a||a==="new")&&!We.current)try{x&&Oe(!0);const T=await fetch(`/api/sgsst/canvas/${a}`,{headers:{Authorization:`Bearer ${h}`}});if(!T.ok){console.warn(`[CanvasPanel] fetch failed: ${T.status} for convoId=${a}`);return}const P=await T.json(),F=P.updatedAt||null;if(!F&&!P.content&&(re.current||z!=null&&z.content)||W.current>0&&F&&new Date(F).getTime()<W.current&&re.current)return;if(x||F!==oe.current){oe.current=F;const M=(_==null?void 0:_.tools)??[],H=M.includes("consultar_analitica_psicosocial"),te=M.includes("consultar_analitica_actos_condiciones"),ne=jt(P.fileType,P.content);Ge.current=ne,Ce.current=P.title||"Archivo sin título",L(H?"animo":te?"actos_condiciones":ne),le(H?"Termómetro Psicosocial":te?"Analítica de Actos y Condiciones":P.title||"Archivo sin título"),Se(P.version||1),Ae(Array.isArray(P.history)?P.history:[]);const Z=lt(P.content);let ve=ne==="text"?s(Z):Z;ne==="text"&&(ve=at(ve)),(x||JSON.stringify(re.current)!==JSON.stringify(ve))&&(x||Ee(1500),he(ve))}}catch(T){console.error("[CanvasPanel] Fetch error:",T)}finally{x&&Oe(!1)}},[a,h,s,_,z]);n.useEffect(()=>{c(!0)},[a,c]),n.useEffect(()=>{if(!a||a==="new"||u&&!f)return;const x=setInterval(()=>{c(!1)},Gr);return()=>clearInterval(x)},[a,c,D,u,f]),n.useEffect(()=>{if(Xe.current===!0&&D===!1&&a&&a!=="new"){const x=setTimeout(()=>{oe.current=null,c(!0)},600);return()=>clearTimeout(x)}Xe.current=D},[D,c,a]);const v=async(x,T,P)=>{const F=sa();ue.current&&clearTimeout(ue.current),Ee(2500),await k(F),L(x),he(T),le(P),be.current=x,re.current=T,ke.current=P,!u&&N&&N(M=>({...M,conversationId:F})),await j(F,!1,!0),He.invalidateQueries([ht.messages,F]),He.invalidateQueries([ht.allConversations]),u||Qe(`/c/${F}`,{replace:!0})},j=n.useCallback(async(x,T=!1,P=!1)=>{const F=x||a;if(!(!F||F==="new")){We.current=!0,Re(!0);try{const H=await(await fetch(`/api/sgsst/canvas/${F}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`},body:JSON.stringify({content:be.current==="text"?at(re.current):re.current,title:ke.current,fileType:be.current,isManual:T})})).json();if(H.success){if(Ee(2e3),H.content!==void 0){const te=typeof re.current=="string"&&re.current.includes("wappy-standard-header-banner")&&!re.current.includes("{{empresa_");re.current=H.content,(P||be.current==="text"&&typeof H.content=="string"&&H.content.includes("wappy-standard-header-banner")&&!te)&&he(H.content)}Se(H.version),Ae(H.history||[]),oe.current=H.updatedAt,C({status:"success",message:"¡Cambios guardados con éxito!"})}}catch(M){console.error("[CanvasPanel] Save error:",M),C({status:"error",message:"Error al guardar los cambios."})}finally{We.current=!1,Re(!1)}}},[a,h]),A=n.useCallback(()=>{ue.current&&clearTimeout(ue.current),ue.current=setTimeout(()=>{j(void 0,!0)},Hr)},[j]),t=x=>{const T=be.current==="text"?at(x):x;re.current=T,!Be.current&&A()},o=x=>{le(x),ke.current=x,j()},l=async(x,T)=>{ue.current&&clearTimeout(ue.current),Ee(2e3);const P=be.current==="text"?at(x):x;if(he(P),le(T),re.current=P,ke.current=T,!a||a==="new"){const F=sa();await k(F),!u&&N&&N(M=>({...M,conversationId:F})),await j(F,!1,!0),He.invalidateQueries([ht.messages,F]),He.invalidateQueries([ht.allConversations]),u||Qe(`/c/${F}`,{replace:!0})}else await j(void 0,!1,!0)},i=async()=>{if(window.confirm("¿Deseas volver a la selección de lienzos? Los cambios no guardados en la versión actual podrían perderse.")){Re(!0);try{ue.current&&clearTimeout(ue.current),Ee(1500);const T=await(await fetch(`/api/sgsst/canvas/${a}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`},body:JSON.stringify({content:"",title:"Archivo sin título",fileType:"text"})})).json();T.success&&(he(""),L("text"),le("Archivo sin título"),Se(1),Ae([]),oe.current=T.updatedAt,Ve.current=null,u&&(W.current=0,q(null)))}catch(x){console.error("[CanvasPanel] Reset error:",x)}finally{Re(!1)}}},p=()=>{const[x,T]=n.useState(!1),[P,F]=n.useState(X),M=n.useRef(null);n.useEffect(()=>{F(X)},[X]),n.useEffect(()=>{x&&setTimeout(()=>{var B;return(B=M.current)==null?void 0:B.select()},50)},[x]);const H=()=>{const B=(P??"").trim();B&&o(B),T(!1)},te=()=>{switch(m){case"excel":return e.jsx(ft,{className:"h-5 w-5"});case"presentation":return e.jsx(St,{className:"h-5 w-5"});case"html":return e.jsx(kt,{className:"h-5 w-5"});case"animo":return e.jsx(Bt,{className:"h-5 w-5"});case"actos_condiciones":return e.jsx(Nt,{className:"h-5 w-5"});default:return e.jsx(Ot,{className:"h-5 w-5"})}},Z=(()=>{switch(m){case"excel":return{bg:"bg-emerald-500/10",border:"border-emerald-500/20",text:"text-emerald-600 dark:text-emerald-400",grad:"from-emerald-500/40 via-emerald-300/20"};case"presentation":return{bg:"bg-amber-500/10",border:"border-amber-500/20",text:"text-amber-600 dark:text-amber-400",grad:"from-amber-500/40 via-amber-300/20"};case"html":return{bg:"bg-blue-500/10",border:"border-blue-500/20",text:"text-blue-600 dark:text-blue-400",grad:"from-blue-500/40 via-blue-300/20"};case"animo":return{bg:"bg-red-500/10",border:"border-red-500/20",text:"text-red-600 dark:text-red-400",grad:"from-red-500/40 via-red-300/20"};case"actos_condiciones":return{bg:"bg-orange-500/10",border:"border-orange-500/20",text:"text-orange-600 dark:text-orange-400",grad:"from-orange-500/40 via-orange-300/20"};default:return{bg:"bg-teal-500/10",border:"border-teal-500/20",text:"text-teal-600 dark:text-teal-400",grad:"from-teal-500/40 via-teal-300/20"}}})(),ve=!!(u&&!O);return e.jsxs("div",{className:ve?"w-full shrink-0 px-3 pb-1.5 pt-2.5":"w-full shrink-0 px-4 pb-2 pt-4",children:[e.jsxs("div",{className:"group flex min-w-0 items-center gap-2.5 sm:gap-3",children:[fe&&e.jsx("button",{onClick:i,className:`flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border-medium bg-surface-primary text-text-primary shadow-sm transition-all duration-300 hover:scale-105 hover:bg-surface-hover ${ve?"h-8 w-8":"h-10 w-10"}`,"aria-label":"Volver a la selección de lienzos",title:"Volver a la selección de lienzos",children:e.jsx(Xa,{className:ve?"h-4 w-4":"h-5 w-5"})}),e.jsx("div",{className:`flex shrink-0 items-center justify-center rounded-xl border shadow-sm ${ve?"h-8 w-8":"h-10 w-10"} ${Z.bg} ${Z.border} ${Z.text}`,children:te()}),x?e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("input",{ref:M,value:P,onChange:B=>F(B.target.value),onKeyDown:B=>{B.key==="Enter"&&H(),B.key==="Escape"&&T(!1)},className:`min-w-0 flex-1 border-b-2 bg-transparent py-0.5 font-bold text-text-primary outline-none ${ve?"text-sm sm:text-base":"text-xl"} ${Z.border.replace("/20","")}`,autoFocus:!0}),e.jsx("button",{onClick:H,className:"rounded-lg p-1.5 text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20","aria-label":"Confirmar",children:e.jsx(pt,{className:"h-4 w-4"})}),e.jsx("button",{onClick:()=>T(!1),className:"rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover","aria-label":"Cancelar",children:e.jsx(tt,{className:"h-4 w-4"})})]}):e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2",children:[e.jsx("h2",{className:`truncate font-bold leading-tight text-text-primary ${ve?"text-sm sm:text-base":"text-xl"}`,children:X}),m!=="animo"&&e.jsx("button",{onClick:()=>T(!0),className:`rounded-lg p-1.5 text-text-tertiary opacity-0 group-hover:opacity-100 hover:${Z.text.split(" ")[0]} ${Z.bg.replace("/10","/5")} shrink-0 transition-all`,"aria-label":"Renombrar documento",children:e.jsx(Qa,{className:"h-3.5 w-3.5"})})]})]}),e.jsx("div",{className:`${ve?"mt-2":"mt-3"} h-px bg-gradient-to-r ${Z.grad} to-transparent`})]})},b=async x=>{ue.current&&clearTimeout(ue.current),Ee(1500),Oe(!0);try{const T=await fetch(`/api/sgsst/canvas/${a}/versions/${x.version}/restore`,{method:"POST",headers:{Authorization:`Bearer ${h}`}});if(T.ok){const P=await T.json(),F=lt(P.content),M=jt(P.fileType,P.content),H=P.title||"Archivo sin título";L(M),be.current=M,he(F),re.current=F,le(H),ke.current=H,Se(P.version||1),Ae(Array.isArray(P.history)?P.history:[]),oe.current=P.updatedAt||null,we(!1),C({status:"success",message:"¡Versión restaurada con éxito!"})}}catch(T){console.error("[Restore Version] Error:",T),C({status:"error",message:"Error al restaurar la versión."})}finally{Oe(!1)}},y=()=>{const x=typeof Y=="string"&&(Y.includes("<!DOCTYPE html")||Y.includes("<html")||Y.includes("<body"));switch(m==="html"||x?"html":m){case"excel":return e.jsx(Tr,{initialContent:Y,onUpdate:t,title:X,isMaximized:O,onRegisterDownload:P=>{Ve.current=P}});case"presentation":return e.jsx(Rr,{initialContent:Y,onUpdate:t,title:X,isMaximized:O,onRegisterDownload:P=>{Ve.current=P}});case"html":return e.jsx(Or,{initialContent:Y,onUpdate:t,title:X,isMaximized:O,onRegisterDownload:P=>{Ve.current=P}});case"animo":{const P=(E==null?void 0:E.role)==="USER";return e.jsxs("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:[e.jsx("div",{className:`flex-1 overflow-y-auto p-6 ${P?"pointer-events-none select-none blur-[8px] filter":""}`,children:e.jsx(vr,{isMaximized:O})}),P&&e.jsx("div",{className:"absolute inset-0 z-50 flex items-center justify-center bg-black/10 p-4 backdrop-blur-[2px] sm:p-6 md:p-8",children:e.jsx(ia,{isPopup:!0,title:"Analítica Psicosocial Exclusiva",description:"El Termómetro Psicosocial es una herramienta exclusiva de los planes de pago. Adquiere o actualiza tu plan para ver el diagnóstico cuantitativo, estresores principales y recomendaciones de la IA.",plan:"USER"})})]})}case"actos_condiciones":return e.jsx("div",{className:"relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-secondary",children:e.jsx("div",{className:"flex-1 overflow-y-auto p-6",children:e.jsx(wr,{isMaximized:O})})});default:return e.jsx(Ar,{initialContent:Y,onUpdate:t,onApplyTemplate:l,isMaximized:O})}};if($e&&!Y)return e.jsxs("div",{className:"flex h-full w-full flex-col items-center justify-center bg-surface-primary p-8",children:[e.jsx("div",{className:"mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal-500"}),e.jsx("p",{className:"text-sm font-semibold text-text-secondary",children:"Cargando espacio de trabajo Canvas..."})]});const R=!!(u&&!O),ye=R?"h-8 min-w-[32px] px-2 sm:h-9 sm:min-w-[36px] sm:px-2.5":"h-9 min-w-[36px] sm:h-10 sm:min-w-[40px] px-2.5 sm:px-3",pe=e.jsxs("div",{className:`flex h-full w-full flex-col overflow-hidden bg-surface-primary text-text-primary ${O?"fixed inset-0 z-[9990] m-0 h-screen w-screen rounded-none shadow-2xl pt-[max(env(safe-area-inset-top),2.5rem)] sm:pt-0":R?"relative":"relative pt-[max(env(safe-area-inset-top),1.5rem)] sm:pt-0"}`,children:[e.jsxs("div",{className:`relative z-[300] flex w-full max-w-full shrink-0 items-center justify-between gap-1.5 overflow-visible border-b border-border-light bg-surface-secondary ${R?"px-2.5 sm:px-3 py-1.5":"px-3 sm:px-4 py-2 sm:py-0"}`,style:{minHeight:R?"3.1rem":"3.75rem"},children:[!R&&e.jsxs("button",{onClick:ee,className:"flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-500/10 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700 font-bold text-xs shrink-0 active:scale-95 mr-1","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:[e.jsx(tt,{className:"h-4 w-4"}),e.jsx("span",{children:"Cerrar"})]}),e.jsxs("div",{className:"flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 overflow-hidden",children:[e.jsx("div",{className:`hidden ${R?"lg:flex":"sm:flex"} h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 shadow-xs`,children:e.jsx(Ot,{className:"h-4 w-4"})}),e.jsxs("div",{className:"min-w-0 flex-1 overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("h2",{className:"truncate text-xs sm:text-sm font-extrabold text-text-primary",children:"Canvas"}),e.jsx("span",{className:"hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",children:"2.0"})]}),e.jsxs("div",{className:"flex min-w-0 items-center gap-1.5",children:[e.jsx("span",{className:`h-1.5 w-1.5 shrink-0 rounded-full ${D?"animate-pulse bg-teal-500":"bg-green-500"}`}),e.jsx("span",{className:"truncate text-[11px] sm:text-xs text-text-secondary",children:fe?(X==null?void 0:X.trim())||"Documento SG-SST":"Nuevo espacio Canvas"}),Te&&e.jsx("span",{className:"shrink-0 text-[10px] italic text-text-tertiary",children:"Guardando..."})]})]})]}),e.jsxs("div",{className:`flex shrink-0 flex-nowrap items-center ${R?"gap-1":"gap-1.5 sm:gap-2"} overflow-visible py-0.5`,children:[fe&&m!=="animo"&&m!=="actos_condiciones"&&e.jsxs("button",{onClick:async x=>{x.preventDefault(),x.stopPropagation(),await j(void 0,!0)},disabled:Te,className:`group flex ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Guardar cambios",title:"Guardar cambios",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:Te?e.jsx("div",{className:"h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin rounded-full border-b-2 border-t-2 border-current"}):e.jsx(Wa,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:Te?"Guardando...":"Guardar"})})]}),fe&&m==="text"&&e.jsx(jr,{content:Y,fileName:X}),fe&&m!=="text"&&m!=="animo"&&m!=="actos_condiciones"&&e.jsxs("button",{onClick:async x=>{if(x.preventDefault(),x.stopPropagation(),Ve.current)Ve.current();else if(Y){const T=lt(Y),P=(X||"archivo").replace(/[/\\?%*:|"<>]/g,"_").trim(),F=m==="html"||T.includes("<html")||T.includes("<!DOCTYPE"),M=F?"html":m==="excel"?"json":"txt",H=new Blob([T],{type:F?"text/html;charset=utf-8":"text/plain;charset=utf-8"});Vt.saveAs(H,`${P}.${M}`)}(E==null?void 0:E.role)==="USER"&&fetch("/api/files/register-download",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`}}).catch(T=>console.error("Download register error:",T))},className:`group flex ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`,"aria-label":"Descargar archivo",title:m==="presentation"?"Descargar presentación ejecutiva":m==="excel"?"Descargar hoja de cálculo":"Descargar aplicativo interactivo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(ct,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:m==="presentation"?"Descargar Presentación":m==="excel"?"Descargar Hoja":"Descargar Aplicativo"})})]}),fe&&m!=="animo"&&m!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>Je(!Ke),className:`hidden sm:flex group ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${Ke?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Historial de reportes",title:"Historial de reportes",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(bt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Historial"})})]}),fe&&m!=="animo"&&m!=="actos_condiciones"&&e.jsxs("button",{onClick:()=>we(!Le),className:`hidden sm:flex group ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${Le?"bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300 ring-1 ring-orange-500/30":"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20"}`,"aria-label":"Versiones de documento",title:"Versiones de documento",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(Dt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Versiones"})})]}),e.jsxs("button",{onClick:()=>G(x=>!x),className:`${u?"flex":"hidden sm:flex"} group ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":O?"Reducir panel":"Expandir panel",title:O?"Contraer a vista con Tenshi":"Expandir a pantalla completa",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:O?e.jsx(Ja,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"}):e.jsx(Ya,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:O?"Contraer":"Expandir"})})]}),e.jsxs("button",{onClick:ee,className:`${R?"flex":"hidden sm:flex"} group ${ye} flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-500/30 shadow-xs outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95`,"aria-label":R?"Volver al chat":"Cerrar lienzo",title:R?"Volver al chat":"Cerrar lienzo",children:[e.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:e.jsx(tt,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),e.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:e.jsx("span",{className:"text-xs font-bold tracking-wide",children:R?"Volver al chat":"Cerrar"})})]})]})]}),e.jsx(Nr,{onSelectReport:x=>{Je(!1),u?(W.current=0,oe.current=null,q(null),g==null||g(x)):Qe(`/c/${x}`)},isOpen:Ke,toggleOpen:()=>Je(x=>!x),historyEndpoint:a&&a!=="new"?`/api/sgsst/canvas/history?conversationId=${a}`:"/api/sgsst/canvas/history",tags:[],refreshTrigger:Ie}),e.jsxs("div",{className:"relative flex flex-1 flex-col overflow-hidden",children:[fe?e.jsxs(e.Fragment,{children:[e.jsx(p,{}),e.jsx("div",{className:"relative flex h-full flex-1 flex-col overflow-hidden",children:y()})]}):e.jsxs("div",{className:`relative flex-1 overflow-y-auto ${R?"px-3 py-4 sm:px-5 sm:py-6":"px-4 py-6 sm:px-8 sm:py-10"}`,children:[e.jsx("div",{className:"pointer-events-none absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"}),e.jsx("div",{className:"pointer-events-none absolute bottom-10 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"}),e.jsxs("div",{className:"relative z-10 mx-auto flex max-w-2xl flex-col items-center justify-center space-y-6 text-center",children:[e.jsxs("div",{className:"flex flex-col items-center gap-3",children:[e.jsxs("div",{className:"relative flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-transparent text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/10",children:[e.jsx(_e,{className:"h-8 w-8 animate-pulse"}),e.jsx("span",{className:"absolute -right-1.5 -top-1.5 flex h-5 items-center rounded-md border border-teal-500/40 bg-surface-primary px-1.5 text-[9px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 shadow-xs",children:"PRO"})]}),e.jsx("span",{className:"inline-flex items-center gap-1.5 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-300",children:"WAPPY CANVAS STUDIO 2.0 · SUITE EJECUTIVA SG-SST"})]}),e.jsxs("div",{className:"space-y-2 max-w-xl",children:[e.jsx("h3",{className:"text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary",children:"El lienzo está listo"}),e.jsx("p",{className:"text-xs sm:text-sm leading-relaxed text-text-secondary",children:"Crea documentos normativos, matrices de cálculo, presentaciones ejecutivas y aplicativos interactivos en tiempo real."})]}),e.jsxs("div",{className:`grid w-full grid-cols-1 ${R?"lg:grid-cols-2":"sm:grid-cols-2"} gap-3.5 pt-2`,children:[e.jsxs("button",{onClick:()=>{const x=at(`
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
</div>`);!a||a==="new"?v("text",x,"Informe Técnico SG-SST"):(ue.current&&clearTimeout(ue.current),Ee(1500),L("text"),he(x),le("Informe Técnico SG-SST"),be.current="text",re.current=x,ke.current="Informe Técnico SG-SST",j(void 0,!1,!0))},className:"group relative flex flex-col justify-between rounded-2xl border border-teal-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-500/50 hover:bg-teal-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(Ot,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-teal-700 dark:text-teal-300",children:"NORMATIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors",children:"Documento Corporativo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Políticas, actas COPASST, procedimientos, matrices legales e informes con firma digital."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"15 Plantillas SST"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Firma Digital"})]})]}),e.jsxs("button",{onClick:()=>{const x=JSON.stringify([["Indicador SG-SST (Res. 0312)","Meta Anual (%)","Q1 (%)","Q2 (%)","Q3 (%)","Q4 (%)","Promedio Real"],["Ejecución Plan Anual de Trabajo","95","88","92","95","98","=PROMEDIO(C2:F2)"],["Cumplimiento Cronograma Capacitación","90","85","90","92","96","=PROMEDIO(C3:F3)"],["Cierre de Acciones ACPM","100","80","88","94","100","=PROMEDIO(C4:F4)"],["Cobertura Exámenes Ocupacionales","100","95","100","100","100","=PROMEDIO(C5:F5)"],["PROMEDIO CONSOLIDADO","=PROMEDIO(B2:B5)","=PROMEDIO(C2:C5)","=PROMEDIO(D2:D5)","=PROMEDIO(E2:E5)","=PROMEDIO(F2:F5)","=PROMEDIO(G2:G5)"]]);!a||a==="new"?v("excel",x,"Tablero Indicadores SG-SST"):(ue.current&&clearTimeout(ue.current),Ee(1500),L("excel"),he(x),le("Tablero Indicadores SG-SST"),be.current="excel",re.current=x,ke.current="Tablero Indicadores SG-SST",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-emerald-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(ft,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300",children:"ANALÍTICO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors",children:"Hoja de Cálculo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Matrices GTC-45, presupuestos, indicadores Res. 0312, fórmulas en vivo y analítica gráfica."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Fórmulas + Gráficos"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Multi-Hoja"})]})]}),e.jsxs("button",{onClick:()=>{const x=JSON.stringify([{title:"Informe Ejecutivo de Rendición de Cuentas SG-SST",subtitle:"Evaluación del Desempeño, Indicadores de Siniestralidad y Plan Maestro de Mejora",kicker:"DECRETO 1072 DE 2015 · ART. 2.2.4.6.31",layout:"title",theme:"wappy-dark",bullets:["Cumplimiento de Estándares Mínimos Resolución 0312 de 2019","Gestión de Peligros Prioritarios y Vigilancia Epidemiológica"],takeaway:"Presentación oficial para aprobación de la Alta Dirección."},{title:"El cumplimiento global del SG-SST alcanzó el 94.5%, superando la meta anual",subtitle:"Balance cuantitativo de los cuatro indicadores rectores del sistema",kicker:"TABLERO DE CONTROL GERENCIAL",layout:"kpi-grid",theme:"wappy-dark",bullets:["Estándares Res. 0312: 94.5% (Nivel Aceptable)","Plan Anual de Trabajo: 92% ejecutado","Reducción de accidentalidad ATEL: -35%","Cobertura de exámenes médicos: 100%"],kpis:[{label:"Estándares Res. 0312",value:"94.5%",delta:"+14.5% vs año ant.",trend:"up",description:"Calificación Aceptable (>85%)"},{label:"Plan Anual SST",value:"92.0%",delta:"46 de 50 actividades",trend:"up",description:"Ejecución presupuestal del 96%"},{label:"Siniestralidad ATEL",value:"-35%",delta:"0 accidentes graves",trend:"down",description:"Reducción sostenida en planta"},{label:"Cobertura EMO",value:"100%",delta:"Res. 1843 de 2025",trend:"up",description:"Profesiograma y SVE al día"}],takeaway:"La intervención en la fuente redujo los días de incapacidad en un 41%."},{title:"Transición de controles reactivos hacia controles de ingeniería en la fuente",kicker:"MATRIZ DE PELIGROS GTC-45",layout:"columns",theme:"emerald-sst",bullets:["Comparativa de estado inicial vs intervención ejecutada"],columns:[{title:"Estado Inicial (Riesgo Crítico)",badge:"Nivel I — NR 600",theme:"danger",items:["Manipulación manual de cargas >25 kg sin ayudas mecánicas.","Permisos de trabajo en alturas diligenciados en papel."]},{title:"Estado Actual (Control Ingeniería)",badge:"Nivel III — NR 80",theme:"success",items:["Ayudas mecánicas hidráulicas instaladas en bodega central.","Trazabilidad digital en tiempo real mediante WAPPY IA."]}],takeaway:"100% de los peligros críticos intervenidos con controles efectivos."},{title:"Hoja de Ruta Estratégica PHVA para el Próximo Periodo",kicker:"MEJORA CONTINUA",layout:"timeline",theme:"wappy-cream",bullets:["Planificación trimestral verificable"],steps:[{phase:"FASE 01 · PLANEAR",title:"Diagnóstico e Higiene",detail:"Actualización GTC-45 y mediciones ambientales."},{phase:"FASE 02 · HACER",title:"Intervención SVE",detail:"Batería psicosocial y escuela de liderazgo."},{phase:"FASE 03 · VERIFICAR",title:"Auditoría e Inspección",detail:"Simulacro anual y auditoría Decreto 1072."},{phase:"FASE 04 · ACTUAR",title:"Cierre de ACPM",detail:"Cierre del 100% de hallazgos y revisión gerencial."}],takeaway:"Compromiso gerencial con la mejora continua del SG-SST."}]);!a||a==="new"?v("presentation",x,"Presentación Ejecutiva SG-SST"):(ue.current&&clearTimeout(ue.current),Ee(1500),L("presentation"),he(x),le("Presentación Ejecutiva SG-SST"),be.current="presentation",re.current=x,ke.current="Presentación Ejecutiva SG-SST",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-500/50 hover:bg-amber-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(St,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300",children:"EJECUTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors",children:"Presentación Ejecutiva"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"10 estructuras visuales (KPIs, columnas, ruta PHVA, tablas, gráficos) para Alta Dirección."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"10 Estructuras"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"8 Temas Pro"})]})]}),e.jsxs("button",{onClick:()=>{const x=`<!DOCTYPE html>
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
</html>`;!a||a==="new"?v("html",x,"Prototipo Interactivo"):(ue.current&&clearTimeout(ue.current),Ee(1500),L("html"),he(x),le("Prototipo Interactivo"),be.current="html",re.current=x,ke.current="Prototipo Interactivo",j())},className:"group relative flex flex-col justify-between rounded-2xl border border-blue-500/25 bg-surface-secondary/80 p-4 text-left shadow-xs backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-500/50 hover:bg-blue-500/[0.06] hover:shadow-md cursor-pointer",children:[e.jsxs("div",{className:"flex w-full items-start justify-between gap-2",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3",children:e.jsx(kt,{className:"h-5 w-5"})}),e.jsx("span",{className:"rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300",children:"INTERACTIVO"})]}),e.jsxs("div",{className:"mt-3 space-y-1",children:[e.jsx("div",{className:"text-sm font-extrabold text-text-primary group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors",children:"Prototipo Interactivo"}),e.jsx("p",{className:"text-[11px] leading-snug text-text-secondary",children:"Calculadoras SST, simuladores, tableros interactivos y aplicativos autocontenidos."})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap gap-1 border-t border-border-light pt-2.5",children:[e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Vista en Vivo"}),e.jsx("span",{className:"rounded-md bg-surface-primary px-2 py-0.5 text-[9px] font-semibold text-text-tertiary",children:"Componentes SST"})]})]})]}),e.jsx("div",{className:"flex w-full pt-1",children:e.jsxs("button",{onClick:()=>Je(!0),className:"flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-3 text-xs sm:text-sm font-extrabold text-orange-700 dark:text-orange-300 shadow-xs transition-all duration-300 hover:bg-orange-500/20 sm:hover:scale-[1.01] active:scale-95 cursor-pointer",children:[e.jsx(bt,{className:"h-4 w-4"}),e.jsx("span",{children:"Explorar el Historial de Documentos Canvas"})]})})]})]}),Le&&e.jsxs("div",{className:"fixed inset-0 z-[999999] flex items-center justify-center",children:[e.jsx("div",{className:"absolute inset-0 bg-black/60 backdrop-blur-sm",onClick:()=>we(!1)}),e.jsxs("div",{className:"relative flex h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in zoom-in-95",children:[e.jsxs("div",{className:"flex items-center justify-between border-b border-border-light bg-surface-secondary px-6 py-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/20 bg-teal-500/10 text-teal-600 shadow-sm",children:e.jsx(bt,{className:"h-5 w-5"})}),e.jsx("h2",{className:"text-lg font-bold text-text-primary",children:"Versiones"})]}),e.jsxs("p",{className:"mt-1 text-sm text-text-secondary",children:["Historial de versiones de ",X]})]}),e.jsx("button",{onClick:()=>we(!1),className:"rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary",children:e.jsx(tt,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto bg-surface-primary p-6",children:[!w&&e.jsxs("div",{onClick:()=>window.location.href="/planes",className:"mb-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-800 transition-all duration-300 hover:scale-[1.01] hover:bg-amber-500/15 dark:text-amber-300",children:[e.jsx(_e,{className:"mt-0.5 h-5 w-5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400"}),e.jsxs("div",{className:"flex-1 text-sm",children:[e.jsx("span",{className:"font-bold",children:"Límite del Plan Gratuito:"})," Solo conservamos las últimas 5 versiones en este chat. Pásate a Pro para mantener un registro de hasta 20 versiones.",e.jsx("span",{className:"ml-2 font-bold underline transition-colors hover:text-amber-900 dark:hover:text-amber-100",children:"¡Subir de nivel ahora!"})]})]}),Fe.length===0?e.jsxs("div",{className:"flex h-full flex-col items-center justify-center gap-4 text-center",children:[e.jsx("div",{className:"flex h-16 w-16 items-center justify-center rounded-full border border-border-light bg-surface-secondary",children:e.jsx(bt,{className:"h-8 w-8 text-text-tertiary"})}),e.jsx("p",{className:"font-medium text-text-secondary",children:"No hay versiones previas guardadas aún."})]}):e.jsx("div",{className:"grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",children:Fe.map((x,T)=>{const P=x.version===Ie,F=x.fileType||Tt(x.content)||m||"text",M=()=>{switch(F){case"excel":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",children:[e.jsx(ft,{className:"h-3 w-3 text-emerald-500"}),"Hoja de Cálculo (Excel)"]});case"presentation":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 text-[9.5px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",children:[e.jsx(St,{className:"h-3 w-3 text-amber-500"}),"Presentación (Slides)"]});case"html":return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-purple-500/20 bg-purple-50 px-2 py-0.5 text-[9.5px] font-bold text-purple-600 dark:bg-purple-950/30 dark:text-purple-400",children:[e.jsx(kt,{className:"h-3 w-3 text-purple-500"}),"Prototipo HTML / Código"]});default:return e.jsxs("span",{className:"mt-1.5 flex w-fit items-center gap-1 rounded-full border border-sky-500/20 bg-sky-50 px-2 py-0.5 text-[9.5px] font-bold text-sky-600 dark:bg-sky-950/30 dark:text-sky-400",children:[e.jsx(Ze,{className:"h-3 w-3 text-sky-500"}),"Documento de Texto (Word)"]})}},H=!w&&T<Fe.length-5;return e.jsxs("div",{className:`flex flex-col rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${P?"border-teal-500 bg-teal-50 dark:bg-teal-900/10":H?"border-dashed border-gray-300 bg-gray-50/50 opacity-60 hover:opacity-85 dark:border-gray-800 dark:bg-gray-900/5":"border-border-medium bg-surface-secondary hover:border-teal-500/50"}`,children:[e.jsxs("div",{className:"mb-3 flex items-center justify-between border-b border-border-light pb-2",children:[e.jsxs("div",{className:"flex min-w-0 flex-1 flex-col",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"shrink-0 font-bold text-text-primary",children:["Versión ",x.version]}),P&&e.jsx("span",{className:"shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",children:"Actual"})]}),e.jsx("span",{className:"truncate text-xs text-text-tertiary",children:new Date(x.updatedAt).toLocaleString("es-ES")}),M()]}),H?e.jsx("span",{className:"shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-500",children:"🔒 PRO"}):e.jsx(Br,{version:x.version,title:x.title||X,onRename:async te=>{try{const ne=await fetch(`/api/sgsst/canvas/${a}/versions/${x.version}/rename`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${h}`},body:JSON.stringify({title:te})});if(ne.ok){const Z=await ne.json();Ae(Z.history||[]),P&&(le(te),ke.current=te)}}catch(ne){console.error("[Version History Rename] Error:",ne)}},onDelete:async()=>{try{const te=await fetch(`/api/sgsst/canvas/${a}/versions/${x.version}`,{method:"DELETE",headers:{Authorization:`Bearer ${h}`}});if(te.ok){const ne=await te.json();Ae(ne.history||[])}}catch(te){console.error("[Version History Delete] Error:",te)}}})]}),e.jsxs("div",{className:"mb-4 line-clamp-3 flex-1 text-sm italic text-text-secondary opacity-80",children:['"',x.title||X,'"']}),H?e.jsxs("button",{onClick:()=>{window.location.href="/planes"},className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 py-2 text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-500/10 dark:hover:bg-amber-900/20",children:[e.jsx(Dt,{className:"h-4 w-4 text-amber-500"}),"Restaurar 🔒 PRO"]}):e.jsxs("button",{onClick:()=>b(x),disabled:P,className:"mt-auto flex w-full items-center justify-center gap-2 rounded-lg border border-border-light bg-surface-primary py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-teal-50 hover:text-teal-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-teal-900/20",children:[e.jsx(Dt,{className:"h-4 w-4"}),"Restaurar"]})]},T)})})]})]})]}),(!u||O)&&e.jsx("button",{onClick:ee,className:"fixed bottom-6 right-6 z-[99999999] flex sm:hidden h-11 w-11 items-center justify-center rounded-xl bg-slate-900/90 dark:bg-zinc-800/95 text-white shadow-2xl active:scale-90 border border-slate-400/30 backdrop-blur-md focus:outline-none","aria-label":"Cerrar lienzo",title:"Cerrar lienzo",children:e.jsx(tt,{className:"h-5 w-5"})})]})]}),Ne=O?da.createPortal(pe,document.body):pe;return e.jsxs(e.Fragment,{children:[Ne,S&&e.jsx("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:e.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[e.jsx("button",{onClick:()=>$(!1),className:"absolute -top-10 right-0 z-50 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300",children:"Cerrar ✕"}),e.jsx(ia,{title:ie,description:U,plan:(E==null?void 0:E.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]})};export{No as default};
