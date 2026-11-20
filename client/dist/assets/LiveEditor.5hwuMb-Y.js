import{r as l,R as Re,j as r,a as Me}from"./react-core.DnLkJYlj.js";import{hf as Gt,hg as Jt,hh as Yt,hi as Xt,hj as Kt,hk as Vt,hl as Qt,h8 as Zt,hm as er,hn as st,ho as lt,hp as ct,cC as tr,gT as rr,hq as or,f8 as dt,fI as Ae,dC as nr,cb as ar,gg as ir,dO as pt,hr as ze,hs as ut,ch as V,d4 as le,dy as sr,dk as lr,dl as cr,d0 as mt,dJ as dr}from"./vendor.CzLQ0fq0.js";import{u as pr,o as ur,aU as E,aT as ce,fY as ve,f$ as mr,fX as bt}from"./index.BP7M2qve.js";import"./utilities.CCKZG3yh.js";import{S as br}from"./SignaturePad.DGr6rkXg.js";import{a as fr}from"./framer-motion.Do3f2MG_.js";function de(k){if(!k||typeof k!="string")return k;let I=k;if(I.includes("![")&&I.includes("](")&&(I=I.replace(/(?:<p>\s*)?!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)(?:\s*<\/p>)?/gi,(Q,L,W)=>{const A=String(W||"").replace(/^https?:\/\/(?:app\.)?wappy\.club(?=\/images\/)/i,""),f=String(L||"Infografía / Recurso Visual Oficial").replace(/"/g,"&quot;");return`<figure style="margin:24px 0;text-align:center;background:#f8fafc;padding:16px;border-radius:14px;border:1px solid #e2e8f0;"><img src="${A}" alt="${f}" style="max-width:100%;height:auto;border-radius:10px;box-shadow:0 4px 20px rgba(15,23,42,0.08);display:block;margin:0 auto;" /><figcaption style="margin-top:10px;font-size:12px;color:#475569;font-style:italic;font-weight:600;">${f}</figcaption></figure>`})),!I.includes("<table")||typeof window>"u"||typeof DOMParser>"u")return I;try{const L=new DOMParser().parseFromString(I,"text/html"),W=L.querySelectorAll("table");let A=!1;if(W.forEach(f=>{var Z;const S=f.parentElement;if(S&&(S.classList.contains("table-responsive")||S.classList.contains("table-container")||S.classList.contains("table-wrapper")||S.classList.contains("custom-table-scroll")))S&&(S.classList.contains("custom-table-scroll")||(S.classList.add("custom-table-scroll"),A=!0),f.style.display="table",f.style.width="100%");else{A=!0;const B=L.createElement("div");B.className="table-responsive custom-table-scroll",B.setAttribute("style","width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px 0; border-radius: 10px; border: 1px solid #e2e8f0; box-sizing: border-box;"),f.style.margin="0",f.style.border="none",f.style.borderRadius="0",f.style.width="100%",f.style.display="table",f.style.tableLayout="auto",(Z=f.parentNode)==null||Z.insertBefore(B,f),B.appendChild(f)}}),A)return L.body.innerHTML}catch(Q){console.error("[LiveEditor] wrapTablesInResponsiveContainer error:",Q)}return k}const xr=l.forwardRef(({initialContent:k,onUpdate:I,onChange:Q,onSave:L,onHistory:W,onToggleTemplates:A,isTemplatesOpen:f=!1,onUploadDocument:S,isUploadingDocument:Oe=!1,onOpenAiBridge:Z,reportType:B="general",reportSourceData:ft,paperMode:pe=!0,hideFullscreen:xt=!1,hideToolbarWhenCollapsed:gt=!1,isGenerating:gr,isEditable:hr=!0,readOnly:wr=!1,placeholder:vr,editorId:yr},ht)=>{var nt,at,it;const ee=pr(),{token:U}=ur(),s=l.useRef(null),ye=I||Q,ke=l.useRef(ye);l.useEffect(()=>{ke.current=ye},[ye]);const p=l.useCallback(e=>{var o;const t=typeof e=="string"?e:((o=s.current)==null?void 0:o.innerHTML)||"";if(typeof ke.current=="function")try{ke.current(t)}catch(n){console.warn("[LiveEditor] Error in onUpdate callback:",n)}},[]),De=l.useRef(null),He=l.useRef(null),[wt,N]=l.useState(k),[h,te]=l.useState({}),[vt,R]=l.useState(!1),[yt,ue]=l.useState(!1),[T,me]=l.useState(null),[_e,kt]=l.useState({top:0,left:0}),[g,q]=l.useState(null),[Pe,Ct]=l.useState({top:0,left:0}),[z,Ce]=l.useState(null),[$e,jt]=l.useState({top:0,left:0}),[P,be]=l.useState(null),[Fe,Et]=l.useState({top:0,left:0}),[M,re]=l.useState(null),[O,We]=l.useState(""),[je,G]=l.useState(null),[oe,Ee]=l.useState(""),[Be,St]=l.useState(""),[Se,Ue]=l.useState(!1),[C,ne]=l.useState(!1),[qe,Nt]=l.useState(3),[Ge,Je]=l.useState(null);Re.useEffect(()=>{const e=t=>{var o;(o=t.detail)!=null&&o.message&&(Je({message:t.detail.message,status:t.detail.status,severity:t.detail.severity}),setTimeout(()=>Je(null),3500))};return window.addEventListener("add-toast",e),()=>window.removeEventListener("add-toast",e)},[]);const ae=l.useRef(null);l.useEffect(()=>(C?window.dispatchEvent(new CustomEvent("live-editor-fullscreen-enter")):window.dispatchEvent(new CustomEvent("live-editor-fullscreen-exit")),()=>{C&&window.dispatchEvent(new CustomEvent("live-editor-fullscreen-exit"))}),[C]);const[J,ie]=l.useState(!1),[kr,fe]=l.useState({}),[Y,Tt]=l.useState(null),se=l.useRef(null),Ye=l.useRef(null);l.useEffect(()=>{const e=()=>{Tt(document.fullscreenElement||document.getElementById("root")||document.body)};return e(),document.addEventListener("fullscreenchange",e),()=>document.removeEventListener("fullscreenchange",e)},[]);const Ne=l.useRef(E("wappy_active_company_id")||"default"),Xe=l.useRef(!1),Ke=l.useRef(0),Te=()=>`wappy_signatures_${E("wappy_active_company_id")||"default"}`;l.useEffect(()=>{let e=null;const t=()=>{const n=E("wappy_active_company_id")||"default",a=`wappy_signatures_${n}`;Ne.current=n;const c=n!=="default"?E(a):E(a)||E("wappy_signatures");let d={};if(c)try{const u=JSON.parse(c);u&&typeof u=="object"&&(d=u)}catch{}else if(n==="default"){const u=E("sgsst_signatures");if(u)try{const i=JSON.parse(u);i&&typeof i=="object"&&Object.keys(i).forEach(b=>{var j;(j=i[b])!=null&&j.url&&(d[b]=i[b].url)})}catch{}}if(Xe.current=!0,te(d),U){const u=++Ke.current;fetch(`/api/sgsst/signatures?companyId=${encodeURIComponent(n)}`,{headers:{Authorization:`Bearer ${U}`}}).then(i=>i.json()).then(i=>{const b=E("wappy_active_company_id")||"default";u!==Ke.current||b!==n||i!=null&&i.companyId&&n!=="default"&&String(i.companyId)!==n||i!=null&&i.signatures&&typeof i.signatures=="object"&&Object.keys(i.signatures).length>0&&te(j=>({...Ne.current===n?j:{},...i.signatures}))}).catch(i=>console.error("Error fetching signatures for sync:",i))}},o=()=>{e&&clearTimeout(e),e=setTimeout(t,80)};return t(),window.addEventListener("wappy-company-changed",o),window.addEventListener("wappy-empresa-cambiada",o),()=>{e&&clearTimeout(e),window.removeEventListener("wappy-company-changed",o),window.removeEventListener("wappy-empresa-cambiada",o)}},[U]),l.useEffect(()=>{const e=o=>{o.target.closest("[data-ai-bubble]")||setTimeout(()=>{var u;const a=window.getSelection();if(!a||a.isCollapsed||!a.toString().trim()){J||G(null),fe({status:"collapsed_or_empty"});return}const c=a.toString().trim(),d=a.getRangeAt(0);try{const i=s.current,b=d.commonAncestorContainer;if(!((i==null?void 0:i.contains(a.anchorNode))||(i==null?void 0:i.contains(a.focusNode))||(i==null?void 0:i.contains(b))||b&&b.contains&&b.contains(i))){J||G(null),fe({status:"not_in_editor",focusNode:(u=a.focusNode)==null?void 0:u.nodeName});return}se.current=d.cloneRange(),St(c);const K=d.getBoundingClientRect();let $=K.left+K.width/2,F=K.bottom+12;$=Math.max(80,Math.min($,window.innerWidth-80)),F=Math.max(20,Math.min(F,window.innerHeight-80)),fe({status:"success",fixedX:Math.round($),fixedY:Math.round(F),textLen:c.length}),G({x:$,y:F}),ie(!1),Ee("")}catch(i){fe({status:"error",msg:i==null?void 0:i.message}),console.error("[LiveEditor] Selection error:",i)}},50)},t=s.current;return t==null||t.addEventListener("mouseup",e),document.addEventListener("mouseup",e),()=>{t==null||t.removeEventListener("mouseup",e),document.removeEventListener("mouseup",e)}},[J]),l.useEffect(()=>{J&&setTimeout(()=>{var e;return(e=Ye.current)==null?void 0:e.focus()},50)},[J]);const Ve=async()=>{var e;if(!(!oe.trim()||!se.current||!Be)){Ue(!0);try{const t=((e=s.current)==null?void 0:e.innerText)||"",o=await fetch("/api/live/ai-edit-text",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${U}`},body:JSON.stringify({selectedText:Be,instruction:oe,fullReportText:t,reportSourceData:ft??null})}),n=await o.json();if(!o.ok)throw new Error(n.error||"Error al editar");const a=window.getSelection();a&&se.current&&(a.removeAllRanges(),a.addRange(se.current),document.execCommand("insertText",!1,n.editedText)),G(null),ie(!1),Ee(""),se.current=null,p()}catch(t){alert(`Error IA: ${t.message}`)}finally{Ue(!1)}}},Ie=async()=>{if(C){try{document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen()}catch{}ne(!1)}else try{const e=ae.current;e&&(e.requestFullscreen?await e.requestFullscreen():e.webkitRequestFullscreen&&await e.webkitRequestFullscreen(),ne(!0))}catch{ne(!0)}};l.useEffect(()=>{const e=()=>{document.fullscreenElement||document.webkitFullscreenElement||ne(!1)};return document.addEventListener("fullscreenchange",e),document.addEventListener("webkitfullscreenchange",e),()=>{document.removeEventListener("fullscreenchange",e),document.removeEventListener("webkitfullscreenchange",e)}},[]),l.useEffect(()=>{if(C){document.body.style.overflow="hidden";const e=t=>{t.key==="Escape"&&ne(!1)};return window.addEventListener("keydown",e),()=>{document.body.style.overflow="auto",window.removeEventListener("keydown",e)}}document.body.style.overflow="auto"},[C]),l.useEffect(()=>{if(!Xe.current)return;const t=`wappy_signatures_${Ne.current||E("wappy_active_company_id")||"default"}`;ce(t,JSON.stringify(ve(h)))},[h]),l.useEffect(()=>{if(!s.current||Object.keys(h).length===0)return;let e=!1;const t=Array.from(s.current.querySelectorAll('.signature-placeholder:not([data-skip-auto="true"])')),o=n=>{if(!n)return null;if(n=n.toUpperCase().trim(),h[n])return h[n];for(const a of Object.keys(h))if(n.includes(a)||a.includes(n))return h[a];return null};if(t.length>0&&(t.forEach(n=>{var c;const a=n.nextElementSibling;if(a){const d=((c=a.textContent)==null?void 0:c.trim().toUpperCase())||"",u=o(d);if(d&&u){const i=document.createElement("img");i.src=u,i.className="wappy-auto-signature",i.style.maxHeight="100px",i.style.display="block",i.style.margin="10px auto",i.alt=`Firma de ${d}`,n.replaceWith(i),e=!0}}}),e)){const n=s.current.innerHTML;N(n),p(n)}},[h,wt,p]),l.useImperativeHandle(ht,()=>({setHTML:e=>{if(s.current){w.current=!0;const o=(typeof e=="string"?e:"").replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),n=de(o);if(s.current.innerHTML=n,N(n),p(n),typeof window<"u")if(n.trim().length>0){window.dispatchEvent(new CustomEvent("wappy-live-editor-content-set",{detail:{html:n}}));try{const a=window.__wappyActiveSgsstReportTag,c=E("wappy_active_company_id")||"default";if(a&&n.length<=26e4){const d=`wappy_sgsst_report_${c}_${a}`,u=E(d),i=u?JSON.parse(u):{};ce(d,JSON.stringify({...i,content:n,companyId:c,tag:a,updatedAt:Date.now()}))}}catch{}}else window.dispatchEvent(new CustomEvent("wappy-live-editor-content-set",{detail:{html:"",clear:!0}}));setTimeout(()=>{w.current=!1},50)}},insertHTML:e=>{if(!s.current)return;const t=de(e);s.current.focus();const o=window.getSelection();if(o&&o.rangeCount>0){const a=o.getRangeAt(0);if(s.current.contains(a.commonAncestorContainer)){a.deleteContents();const c=document.createElement("div");c.innerHTML=t;const d=document.createDocumentFragment();let u,i;for(;u=c.firstChild;)i=d.appendChild(u);if(a.insertNode(d),i){const j=document.createRange();j.setStartAfter(i),j.collapse(!0),o.removeAllRanges(),o.addRange(j)}const b=s.current.innerHTML;N(b),p(b);return}}s.current.innerHTML+=t;const n=s.current.innerHTML;N(n),p(n)},getHTML:()=>s.current?s.current.innerHTML:""}));const D=l.useRef(!1),w=l.useRef(!1),It=l.useCallback(()=>{if(!s.current)return!1;const e=s.current.querySelectorAll("table");let t=!1;return e.forEach(o=>{const n=o.parentElement;if(!(n&&(n.classList.contains("table-responsive")||n.classList.contains("table-container")||n.classList.contains("table-wrapper")||n.classList.contains("custom-table-scroll")))&&n){t=!0;const c=document.createElement("div");c.className="table-responsive custom-table-scroll",c.setAttribute("style","width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px 0; border-radius: 10px; border: 1px solid #e2e8f0; box-sizing: border-box;"),o.style.margin="0",o.style.border="none",o.style.borderRadius="0",o.style.width="100%",o.style.tableLayout="auto",o.style.display="table",n.insertBefore(c,o),c.appendChild(o)}else n&&!n.classList.contains("custom-table-scroll")&&n.classList.add("custom-table-scroll")}),t},[]);l.useEffect(()=>{const e=s.current;if(!e)return;const t=o=>{const a=o.target.closest(".table-responsive, .table-container, .table-wrapper, .custom-table-scroll");if(!a)return;const c=a.scrollWidth-a.clientWidth;if(c>2&&Math.abs(o.deltaY)>Math.abs(o.deltaX)){const d=o.deltaY>0&&a.scrollLeft<c-1,u=o.deltaY<0&&a.scrollLeft>1;(d||u)&&(o.preventDefault(),a.scrollLeft+=o.deltaY)}};return e.addEventListener("wheel",t,{passive:!1}),()=>{e.removeEventListener("wheel",t)}},[]),l.useEffect(()=>{if(s.current)if(k){const e=k.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),t=de(e),o=s.current.innerHTML.trim();!o||!D.current?(w.current=!0,s.current.innerHTML=t,N(t),p(t),D.current=!0,typeof window<"u"&&t.trim().length>0&&window.dispatchEvent(new CustomEvent("wappy-live-editor-content-set",{detail:{html:t}})),setTimeout(()=>{w.current=!1},50)):o!==t.trim()&&!w.current&&(w.current=!0,s.current.innerHTML=t,N(t),p(t),typeof window<"u"&&t.trim().length>0&&window.dispatchEvent(new CustomEvent("wappy-live-editor-content-set",{detail:{html:t}})),setTimeout(()=>{w.current=!1},50))}else k===""&&D.current&&!w.current&&s.current.innerHTML.trim()&&(w.current=!0,s.current.innerHTML="",N(""),p(""),setTimeout(()=>{w.current=!1},50))},[k,p]),l.useEffect(()=>{const e=t=>{const o=t==null?void 0:t.detail;if(!o||!s.current)return;if(o.clear){w.current=!0,s.current.innerHTML="",N(""),p(""),setTimeout(()=>{w.current=!1},50);return}const n=typeof o.html=="string"?o.html:"";if(!n.trim())return;const a=n.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),c=de(a);s.current.innerHTML.trim()!==c.trim()?(w.current=!0,s.current.innerHTML=c,N(c),p(c),D.current=!0,setTimeout(()=>{w.current=!1},50)):p(c)};return window.addEventListener("wappy-hydrate-live-editor",e),()=>window.removeEventListener("wappy-hydrate-live-editor",e)},[p]),l.useEffect(()=>{if(!D.current&&s.current&&k){const e=k.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),t=de(e);s.current.innerHTML=t,D.current=!0}else!D.current&&s.current&&(D.current=!0);if(s.current){const e=new MutationObserver(()=>{var o;if(w.current)return;It();const t=((o=s.current)==null?void 0:o.innerHTML)||"";N(t),p(t)});return e.observe(s.current,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["style","class","src","width","height"]}),()=>e.disconnect()}},[]);const Lt=e=>{const t=e.currentTarget.innerHTML;N(t),p(t)},Qe=(e,t=void 0)=>{var o;document.execCommand(e,!1,t),(o=s.current)==null||o.focus()},Rt=async e=>{var o;const t=(o=e.target.files)==null?void 0:o[0];if(e.target.value="",t)try{const n=await mr(t);n&&Qe("insertImage",n)}catch(n){console.error("Error compressing uploaded image:",n)}},Le=async e=>{if(!U)return;const t=E("wappy_active_company_id")||"default";try{await fetch("/api/sgsst/signatures",{method:"POST",headers:{Authorization:`Bearer ${U}`,"Content-Type":"application/json"},body:JSON.stringify({signatures:e,companyId:t})})}catch(o){console.error("Error saving signatures to backend:",o)}},Mt=async e=>{var o,n,a;const t=(o=e.target.files)==null?void 0:o[0];if(e.target.value="",t)try{const c=await bt(t);let d=O;(!d||d==="DESCONOCIDO")&&(d=((n=prompt("¿A qué nombre o rol pertenece esta firma?"))==null?void 0:n.trim().toUpperCase())||`Firma ${Object.keys(h).length+1}`);const u={...h,[d]:c};te(u),ce(Te(),JSON.stringify(ve(u))),Le(u);const i=document.createElement("img");if(i.src=c,i.style.maxHeight="100px",i.style.display="block",i.style.margin="10px auto",i.alt=`Firma ${d}`,M&&((a=s.current)!=null&&a.contains(M)))M.replaceWith(i);else{const b=`<img src="${c}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${d}" />`;document.execCommand("insertHTML",!1,b)}p(),re(null),R(!1),ue(!1)}catch(c){console.error("Error compressing uploaded signature:",c)}},Ze=(e,t)=>{var n;const o=document.createElement("img");if(o.src=e,o.style.maxHeight="100px",o.style.display="block",o.style.margin="10px auto",o.alt=`Firma ${t}`,M&&((n=s.current)!=null&&n.contains(M)))M.replaceWith(o);else{const a=`<img src="${e}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${t}" />`;document.execCommand("insertHTML",!1,a)}p(),re(null),R(!1)},At=async e=>{var c,d;const t=await bt(e);let o=O;(!o||o==="DESCONOCIDO")&&(o=((c=prompt("¿A qué nombre o rol pertenece esta firma?"))==null?void 0:c.trim().toUpperCase())||`Firma ${Object.keys(h).length+1}`);const n={...h,[o]:t};te(n),ce(Te(),JSON.stringify(ve(n))),Le(n);const a=document.createElement("img");if(a.src=t,a.style.maxHeight="100px",a.style.display="block",a.style.margin="10px auto",a.alt=`Firma ${o}`,M&&((d=s.current)!=null&&d.contains(M)))M.replaceWith(a);else{const u=`<img src="${t}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${o}" />`;document.execCommand("insertHTML",!1,u)}p(),re(null),R(!1),ue(!1)},zt=e=>{const t={...h};delete t[e],te(t),ce(Te(),JSON.stringify(ve(t))),Le(t)};l.useEffect(()=>{const e=n=>{var c,d,u,i,b,j,K,$,F;const a=n.target;if(a.tagName==="IMG"&&((c=s.current)!=null&&c.contains(a))){const m=a;t(),m.setAttribute("data-selected","true"),me(m);const x=m.getBoundingClientRect();kt({top:x.top-58,left:x.left})}else if((a.closest(".signature-placeholder")||(d=a.innerText)!=null&&d.includes("FIRMADO DIGITALMENTE"))&&((u=s.current)!=null&&u.contains(a))){if(a.closest(".signature-placeholder")||a.closest("div")||a.parentElement){n.preventDefault();const x=a.closest(".signature-placeholder");if(x&&((i=s.current)!=null&&i.contains(x))){let y="DESCONOCIDO";const _=x.nextElementSibling;_&&(y=((b=_.textContent)==null?void 0:b.trim().toUpperCase())||"DESCONOCIDO"),We(y),re(x),R(!0)}}}else if(a.closest("td, th")&&((j=s.current)!=null&&j.contains(a))){const m=a.closest("td, th"),x=m.querySelector(".signature-placeholder");if(x){n.preventDefault();let y="DESCONOCIDO";const _=x.nextElementSibling;_&&(y=((K=_.textContent)==null?void 0:K.trim().toUpperCase())||"DESCONOCIDO"),We(y),re(x),R(!0)}else{t(),m.setAttribute("data-selected","true"),q(m);const y=m.getBoundingClientRect(),_=ae.current.getBoundingClientRect();Ct({top:y.top-_.top-50,left:y.left-_.left})}}else if(a.closest('.progress-bar-container, [style*="width:"]')&&(($=s.current)!=null&&$.contains(a))){const m=a.closest("div");if(m.style.width||m.classList.contains("progress-bar")){t(),m.setAttribute("data-selected","true"),Ce(m);const x=m.getBoundingClientRect(),y=ae.current.getBoundingClientRect();jt({top:x.top-y.top-60,left:x.left-y.left})}}else if(a.closest(".diagram-node")&&((F=s.current)!=null&&F.contains(a))){const m=a.closest(".diagram-node");t(),m.setAttribute("data-selected","true"),be(m);const x=m.getBoundingClientRect(),y=ae.current.getBoundingClientRect();Et({top:x.top-y.top-50,left:x.left-y.left})}else!!a.closest('.image-toolbar, .table-toolbar, .graphic-toolbar, .diagram-toolbar, .signature-modal, [data-ai-bubble="true"]')||t()},t=()=>{var n;(n=s.current)==null||n.querySelectorAll("img, td, th, div, span, .diagram-node").forEach(a=>a.removeAttribute("data-selected")),me(null),q(null),Ce(null),be(null)},o=s.current;return o&&o.addEventListener("click",e),()=>{o&&o.removeEventListener("click",e)}},[]);const H=e=>{T&&(Object.assign(T.style,e),p())},xe=e=>{T&&H(e==="center"?{display:"block",margin:"10px auto",float:"none"}:e==="left"?{display:"inline-block",margin:"0 15px 10px 0",float:"left"}:e==="right"?{display:"inline-block",margin:"0 0 10px 15px",float:"right"}:{display:"inline-block",margin:"0",float:"none",position:"static"})},et=e=>{T&&H(e==="front"?{position:"relative",zIndex:"10"}:e==="back"?{position:"relative",zIndex:"-1"}:{position:"static",zIndex:"0"})},ge=e=>{if(!T)return;H({width:e==="sm"?"150px":e==="md"?"300px":e==="lg"?"500px":"100%",height:"auto"})},Ot=()=>{if(T){if(T.alt&&T.alt.startsWith("Firma")){const e=document.createElement("div");e.className="signature-placeholder",e.setAttribute("data-skip-auto","true"),e.style.cssText="border-bottom: 2px solid #333; width: 100%; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;",e.innerHTML='<span style="font-size: 11px; opacity: 0.6;">Clic para firmar</span>',T.replaceWith(e)}else T.remove();me(null),p()}},tt=e=>{if(!g)return;const t=g.parentElement,n=t.parentElement.insertRow(e==="above"?t.rowIndex:t.rowIndex+1);for(let a=0;a<t.cells.length;a++){const c=n.insertCell(a);c.innerHTML="&nbsp;"}p()},Dt=e=>{if(!g)return;const t=g.closest("table"),n=g.cellIndex+1;for(let a=0;a<t.rows.length;a++){const d=t.rows[a].insertCell(n);d.innerHTML="&nbsp;"}p()},Ht=()=>{if(!g)return;const e=g.parentElement,t=e.closest("table");t.rows.length>1&&(t.deleteRow(e.rowIndex),q(null),p())},_t=()=>{if(!g)return;const e=g.closest("table"),t=g.cellIndex;if(e.rows[0].cells.length>1){for(let o=0;o<e.rows.length;o++)e.rows[o].deleteCell(t);q(null),p()}},Pt=()=>{if(!g)return;const e=g.closest("table");e==null||e.remove(),q(null),p()},rt=e=>{if(!g)return;const t=g.cellIndex,n=g.closest("table").rows[0].cells[t],a=n.offsetWidth,c=e==="wider"?a+20:Math.max(20,a-20);n.style.width=`${c}px`,n.style.minWidth=`${c}px`,p()},he=(e,t)=>{if(!z)return;const o=z.querySelector("div")||z;t&&(o.style.backgroundColor=t),o.style.width=`${e}%`,o.innerText=`${e}%`,p()},X=(e,t)=>{if(!P)return;P.style.backgroundColor=e,P.style.color=t,P.querySelectorAll("span").forEach(n=>{n.style.color=t}),p()},$t=()=>{P&&(P.remove(),be(null),p())},ot=e=>{var o;const t=e==="up"?Math.min(qe+1,7):Math.max(qe-1,1);Nt(t),(o=s.current)==null||o.focus(),document.execCommand("fontSize",!1,String(t)),p()},Ft=()=>ot("up"),Wt=()=>ot("down"),Bt=()=>{var t;(t=s.current)==null||t.focus(),document.execCommand("insertHTML",!1,`
        <div class="table-responsive" style="margin: 14px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr>
                <th style="background-color: #0f766e; color: white; padding: 9px 12px; text-align: left;">Ítem / Requisito</th>
                <th style="background-color: #0f766e; color: white; padding: 9px 12px; text-align: left;">Descripción Técnica / Evidencia</th>
                <th style="background-color: #0f766e; color: white; padding: 9px 12px; text-align: left;">Responsable</th>
                <th style="background-color: #0f766e; color: white; padding: 9px 12px; text-align: center;">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">01</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Describir control o hallazgo verificable</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Responsable SG-SST</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #059669; font-weight: bold;">Cumplido</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">02</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">Seguimiento e inspección periódica</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">COPASST / Brigada</td>
                <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #d97706; font-weight: bold;">En Proceso</td>
              </tr>
            </tbody>
          </table>
        </div><p><br/></p>`),p()},Ut=()=>{var t;(t=s.current)==null||t.focus(),document.execCommand("insertHTML",!1,`
        <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 12px 16px; border-radius: 0 8px 8px 0; margin: 14px 0; color: #134e4a; font-size: 12.5px;">
          <strong>Nota Normativa SG-SST:</strong> Escribe aquí la directriz técnica, artículo del Decreto 1072 de 2015 o recomendación prioritaria.
        </div><p><br/></p>`),p()},v=({icon:e,command:t,value:o,label:n,onClick:a,accentClass:c})=>r.jsxs(fr.button,{whileTap:{scale:.95},onClick:a||(()=>t&&Qe(t,o)),className:`group relative flex h-8 min-w-[32px] px-2 shrink-0 cursor-pointer items-center justify-center rounded-xl border outline-none transition-all duration-300 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 ${c||"border-border-medium/60 bg-surface-primary text-text-primary hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 shadow-xs"}`,type:"button","aria-label":n,title:n,children:[r.jsx(e,{size:15,className:"sm:h-4 sm:w-4 shrink-0"}),r.jsx("div",{className:"hidden sm:flex items-center max-w-0 overflow-hidden opacity-0 group-hover:max-w-[160px] group-hover:opacity-100 group-hover:ml-1.5 transition-all duration-300 ease-in-out whitespace-nowrap",children:r.jsx("span",{className:"text-[11px] font-bold tracking-wide",children:n})})]}),we=[{id:"fontsize",buttons:[{icon:Gt,label:"Aumentar",onClick:Ft},{icon:Jt,label:"Reducir",onClick:Wt}]},{id:"format",buttons:[{icon:Yt,command:"bold",label:ee("com_ui_bold")||"Negrita"},{icon:Xt,command:"italic",label:ee("com_ui_italic")||"Cursiva"},{icon:Kt,command:"underline",label:ee("com_ui_underline")||"Subrayado"}]},{id:"headings",buttons:[{icon:Vt,command:"formatBlock",value:"H1",label:"Título 1"},{icon:Qt,command:"formatBlock",value:"H2",label:"Título 2"}]},{id:"lists",buttons:[{icon:Zt,command:"insertUnorderedList",label:"Viñetas"},{icon:er,command:"insertOrderedList",label:"Numeración"}]},{id:"align",buttons:[{icon:st,command:"justifyLeft",label:"Izquierda"},{icon:lt,command:"justifyCenter",label:"Centrar"},{icon:ct,command:"justifyRight",label:"Derecha"}]},{id:"media",buttons:[...A?[{icon:tr,label:"Plantillas SST",onClick:A,accentClass:f?"bg-teal-500/20 border-teal-500/50 text-teal-800 dark:text-teal-200 shadow-xs":"bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs"}]:[],{icon:rr,label:"Tabla SST",onClick:Bt,accentClass:"bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shadow-xs"},{icon:or,label:"Nota Legal",onClick:Ut,accentClass:"bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 shadow-xs"},{icon:dt,label:"Imagen",onClick:()=>{var e;return(e=De.current)==null?void 0:e.click()},accentClass:"bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 shadow-xs"},{icon:Ae,label:"Firmar",onClick:()=>R(!0),accentClass:"bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300 hover:bg-fuchsia-500/20 shadow-xs"},...S?[{icon:nr,label:Oe?"Importando...":"Importar",onClick:S,accentClass:"bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 shadow-xs"}]:[],...Z?[{icon:ar,label:"Recursos IA",onClick:Z,accentClass:"bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 shadow-xs"}]:[]]},{id:"save",buttons:[...W?[{icon:ir,label:ee("com_ui_history")||"Historial",onClick:W,accentClass:"bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300 hover:bg-orange-500/20 shadow-xs"}]:[],...L?[{icon:pt,label:ee("com_ui_save_report")||"Guardar",onClick:L,accentClass:"bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20 shadow-xs"}]:[],...xt?[]:[{icon:C?ze:ut,label:C?"Salir":"Expandir",onClick:Ie,accentClass:"bg-slate-500/10 dark:bg-zinc-800/80 border-slate-300/60 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-500/20 shadow-xs"}]]}].filter(e=>e.buttons.length>0);Re.useMemo(()=>{const e=[];let t=[],o=0;return we.forEach(n=>{o+n.buttons.length>5&&t.length>0?(e.push(t),t=[n],o=n.buttons.length):(t.push(n),o+=n.buttons.length)}),t.length>0&&e.push(t),e},[we]);const qt=()=>r.jsx("div",{className:"hidden sm:block bg-border-medium/60 mx-0.5 h-4 w-px self-center"});return r.jsxs("div",{ref:ae,className:`relative flex flex-col ${C?"fixed inset-0 z-[99999] bg-surface-secondary":"h-full min-h-[500px] w-full rounded-xl bg-surface-secondary"} font-sans transition-all duration-300`,children:[C&&r.jsxs("div",{className:"flex items-center justify-between px-3 py-2 border-b border-border-medium bg-surface-primary/95 backdrop-blur-md shrink-0 z-50",children:[r.jsxs("button",{type:"button",onClick:Ie,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover border border-border-medium text-xs font-bold text-text-primary transition-all active:scale-95",children:[r.jsx(ze,{className:"h-3.5 w-3.5 text-teal-600 dark:text-teal-400"}),r.jsx("span",{children:"Salir"})]}),r.jsx("span",{className:"text-xs font-bold text-text-primary uppercase tracking-wider truncate max-w-[200px] sm:max-w-none",children:"Editor de Documentos"}),r.jsx("div",{className:"flex items-center gap-1.5",children:L&&r.jsxs("button",{type:"button",onClick:L,className:"flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95",children:[r.jsx(pt,{className:"h-3.5 w-3.5"}),r.jsx("span",{children:"Guardar"})]})})]}),Ge&&r.jsx("div",{className:"pointer-events-none absolute left-1/2 top-16 z-[99999999] -translate-x-1/2 transform",children:r.jsxs("div",{className:"flex items-center gap-3 rounded-xl border border-teal-500/30 bg-[#0d0d0d] px-5 py-3 text-sm font-semibold text-teal-400 shadow-2xl duration-300 animate-in fade-in slide-in-from-top-6",children:[r.jsx("svg",{className:"h-5 w-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:r.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2.5,d:"M5 13l4 4L19 7"})}),Ge.message]})}),(!gt||C)&&r.jsx("div",{className:"bg-surface-secondary/80 group/toolbar sticky top-0 z-50 flex flex-col items-center border-b border-border-medium p-1 sm:p-2 backdrop-blur-sm transition-all duration-300 w-full overflow-hidden",children:r.jsx("div",{className:"flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5 px-1 sm:flex-wrap sm:justify-center",children:we.map((e,t)=>r.jsxs(Re.Fragment,{children:[r.jsx("div",{className:"flex items-center gap-0.5 sm:gap-1 shrink-0",children:e.buttons.map((o,n)=>r.jsx(v,{...o},n))}),t<we.length-1&&r.jsx(qt,{})]},e.id))})}),r.jsx("input",{type:"file",ref:De,className:"hidden",accept:"image/*",onChange:Rt}),r.jsx("input",{type:"file",ref:He,className:"hidden",accept:"image/*",onChange:Mt}),vt&&Y&&Me.createPortal(r.jsx("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50 p-4",onClick:()=>R(!1),children:r.jsxs("div",{className:"w-full max-w-md overflow-hidden rounded-2xl border border-border-medium bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in",onClick:e=>e.stopPropagation(),children:[r.jsxs("div",{className:"flex items-center justify-between border-b border-border-light bg-surface-secondary p-4",children:[r.jsx("h3",{className:"text-sm font-bold uppercase text-text-primary",children:O&&O!=="DESCONOCIDO"?`Insertar Firma: ${O}`:"Firmas Digitales"}),r.jsx("button",{onClick:()=>R(!1),className:"text-text-tertiary hover:text-text-primary",children:r.jsx(V,{className:"h-5 w-5"})})]}),r.jsx("div",{className:"max-h-[60vh] overflow-y-auto p-4",children:Object.keys(h).length===0?r.jsxs("div",{className:"py-8 text-center text-text-tertiary",children:[r.jsx(Ae,{className:"mx-auto mb-2 h-12 w-12 opacity-20"}),r.jsx("p",{children:"No hay firmas guardadas"})]}):r.jsx("div",{className:"grid grid-cols-2 gap-3",children:Object.entries(h).map(([e,t])=>r.jsxs("div",{className:"group relative flex cursor-pointer flex-col items-center justify-between rounded-lg border border-border-light bg-white p-3 transition-all hover:border-blue-500",children:[r.jsx("img",{src:t,alt:e,className:"mb-2 max-h-16 w-auto flex-grow object-contain",onClick:()=>Ze(t,e)}),r.jsx("div",{className:"w-full break-words px-1 text-center text-[10px] font-bold uppercase leading-none tracking-tight text-slate-700",onClick:()=>Ze(t,e),children:e}),r.jsx("button",{onClick:o=>{o.stopPropagation(),zt(e)},className:"absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100",children:r.jsx(le,{className:"h-3 w-3"})})]},e))})}),r.jsxs("div",{className:"flex flex-col gap-2 border-t border-border-light bg-surface-secondary p-4 sm:flex-row",children:[r.jsxs("button",{onClick:()=>{var e;return(e=He.current)==null?void 0:e.click()},className:"flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",children:[r.jsx(dt,{size:16})," Cargar Archivo"]}),r.jsxs("button",{onClick:()=>{R(!1),ue(!0)},className:"flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700",children:[r.jsx(Ae,{size:16})," Dibujar en Pantalla"]}),r.jsx("button",{onClick:()=>R(!1),className:"rounded-lg bg-border-light px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border-medium sm:flex-none",children:"Cerrar"})]})]})}),Y),r.jsx(br,{isOpen:yt,onClose:()=>ue(!1),onSave:At,title:O&&O!=="DESCONOCIDO"?`Firma: ${O}`:"Dibujar Nueva Firma"}),T&&Y&&Me.createPortal(r.jsxs("div",{className:"image-toolbar flex flex-wrap items-center gap-1.5 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{position:"fixed",top:`${Math.max(10,Math.min(_e.top,window.innerHeight-80))}px`,left:`${Math.max(10,Math.min(_e.left,window.innerWidth-380))}px`,zIndex:9999999,maxWidth:"360px"},onPointerDown:e=>{e.stopPropagation()},onClick:e=>{e.stopPropagation()},children:[r.jsxs("div",{className:"mr-0.5 flex gap-1 border-r border-border-light pr-1.5",children:[r.jsx("button",{onClick:e=>{e.stopPropagation(),ge("sm")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Pequeño",children:"S"}),r.jsx("button",{onClick:e=>{e.stopPropagation(),ge("md")},className:"rounded border border-transparent px-2 py-1 text-xs font-bold hover:border-border-medium hover:bg-surface-hover",title:"Mediano",children:"M"}),r.jsx("button",{onClick:e=>{e.stopPropagation(),ge("lg")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Grande",children:"L"}),r.jsx("button",{onClick:e=>{e.stopPropagation(),ge("full")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Ancho Total",children:"W"})]}),r.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[r.jsx(v,{icon:st,onClick:()=>xe("left"),label:"Alinear Izquierda / Envolver"}),r.jsx(v,{icon:lt,onClick:()=>xe("center"),label:"Centrar"}),r.jsx(v,{icon:ct,onClick:()=>xe("right"),label:"Alinear Derecha / Envolver"}),r.jsx(v,{icon:sr,onClick:()=>xe("none"),label:"Restablecer (En línea)"})]}),r.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[r.jsx(v,{icon:lr,onClick:()=>et("front"),label:"Traer al frente"}),r.jsx(v,{icon:cr,onClick:()=>et("back"),label:"Enviar al fondo"})]}),r.jsx("button",{onClick:e=>{e.preventDefault(),e.stopPropagation(),Ot()},className:"rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20",title:"Eliminar imagen / firma",children:r.jsx(le,{className:"h-4 w-4"})}),r.jsx("button",{onClick:e=>{e.preventDefault(),e.stopPropagation(),me(null)},className:"rounded p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover",title:"Cerrar",children:r.jsx(V,{className:"h-4 w-4"})})]}),Y),g&&r.jsxs("div",{className:"table-toolbar absolute z-[80] flex flex-wrap items-center gap-1 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{top:`${Math.max(10,Pe.top)}px`,left:`${Math.max(10,Math.min(Pe.left,(((nt=s.current)==null?void 0:nt.clientWidth)||0)-400))}px`},children:[r.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[r.jsx(v,{icon:mt,onClick:()=>tt("above"),label:"Fila Arriba"}),r.jsx(v,{icon:mt,onClick:()=>tt("below"),label:"Fila Abajo"}),r.jsx(v,{icon:le,onClick:Ht,label:"Eliminar Fila"})]}),r.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[r.jsx(v,{icon:dr,onClick:()=>Dt(),label:"Columna Derecha"}),r.jsx(v,{icon:le,onClick:_t,label:"Eliminar Columna"})]}),r.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[r.jsx(v,{icon:ut,onClick:()=>rt("wider"),label:"Más Ancho"}),r.jsx(v,{icon:ze,onClick:()=>rt("narrower"),label:"Menos Ancho"})]}),r.jsx("button",{onClick:Pt,className:"rounded p-1 px-2 text-xs font-bold text-red-500 hover:bg-red-50",title:"Eliminar Tabla",children:"TABLA"}),r.jsx("button",{onClick:()=>q(null),className:"rounded p-1 text-text-tertiary hover:bg-surface-hover",children:r.jsx(V,{className:"h-4 w-4"})})]}),z&&r.jsxs("div",{className:"graphic-toolbar absolute z-[80] flex items-center gap-2 rounded-lg border border-border-medium bg-surface-primary p-2 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{top:`${Math.max(10,$e.top)}px`,left:`${Math.max(10,Math.min($e.left,(((at=s.current)==null?void 0:at.clientWidth)||0)-300))}px`},children:[r.jsx("input",{type:"range",min:"0",max:"100",defaultValue:parseInt(z.style.width)||0,onChange:e=>he(parseInt(e.target.value)),className:"w-24 accent-blue-600"}),r.jsxs("div",{className:"flex gap-1",children:[r.jsx("button",{onClick:()=>he(parseInt(z.style.width),"#22c55e"),className:"h-5 w-5 rounded-full border border-white/20 bg-green-500",title:"Verde"}),r.jsx("button",{onClick:()=>he(parseInt(z.style.width),"#eab308"),className:"h-5 w-5 rounded-full border border-white/20 bg-yellow-500",title:"Amarillo"}),r.jsx("button",{onClick:()=>he(parseInt(z.style.width),"#ef4444"),className:"h-5 w-5 rounded-full border border-white/20 bg-red-500",title:"Rojo"})]}),r.jsx("button",{onClick:()=>Ce(null),className:"rounded p-1 text-text-tertiary hover:bg-surface-hover",children:r.jsx(V,{className:"h-4 w-4"})})]}),P&&r.jsxs("div",{className:"diagram-toolbar absolute z-[80] flex items-center gap-1.5 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1",style:{top:`${Math.max(10,Fe.top)}px`,left:`${Math.max(10,Math.min(Fe.left,(((it=s.current)==null?void 0:it.clientWidth)||0)-300))}px`},children:[r.jsxs("div",{className:"mr-0.5 flex gap-1 border-r border-border-light pr-1.5",children:[r.jsx("span",{className:"mr-1 self-center text-[10px] font-bold uppercase text-text-tertiary",children:"Fondo:"}),r.jsx("button",{onClick:()=>X("#f8fafc","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-[#f8fafc]",title:"Gris Claro"}),r.jsx("button",{onClick:()=>X("#fef08a","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-yellow-200",title:"Amarillo"}),r.jsx("button",{onClick:()=>X("#fed7aa","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-orange-200",title:"Naranja"}),r.jsx("button",{onClick:()=>X("#fca5a5","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-red-300",title:"Rojo Claro"}),r.jsx("button",{onClick:()=>X("#bbf7d0","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-green-200",title:"Verde Claro"}),r.jsx("button",{onClick:()=>X("#e2e8f0","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-slate-200",title:"Gris"})]}),r.jsx("button",{onClick:$t,className:"rounded p-1.5 text-red-500 transition-colors hover:bg-red-50",title:"Eliminar figura",children:r.jsx(le,{className:"h-4 w-4"})}),r.jsx("button",{onClick:()=>be(null),className:"rounded p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover",children:r.jsx(V,{className:"h-4 w-4"})})]}),r.jsx("div",{className:`relative flex flex-1 flex-col overflow-y-auto overflow-x-auto w-full min-w-0 transition-colors ${pe?"bg-slate-100/70 dark:bg-zinc-950/40 p-2 sm:p-5":"p-2"}`,children:r.jsx("div",{ref:s,className:`prose outline-none transition-all live-editor-content w-full min-w-0 ${pe?"paper-mode max-w-4xl mx-auto":"flex-1 p-3 sm:p-6 max-w-none dark:prose-invert"} ${B==="checklist"?"checklist-mode":""}`,contentEditable:!0,onInput:Lt,suppressContentEditableWarning:!0,style:{minHeight:pe?"600px":"100%",maxWidth:pe?"860px":"100%"}})}),r.jsx("style",{children:`
                .live-editor-content h1,
                .live-editor-content h2,
                .live-editor-content h3,
                .live-editor-content h4,
                .live-editor-content h5,
                .live-editor-content h6 {
                    word-break: keep-all !important;
                    overflow-wrap: normal !important;
                    hyphens: none !important;
                    white-space: normal !important;
                }
                .live-editor-content h1 {
                    color: #004d99;
                    text-align: center;
                    margin-top: 4px;
                    margin-bottom: 10px;
                    font-size: 1.48em;
                    font-weight: 800;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 6px;
                }
                .live-editor-content h2 {
                    color: #004d99;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 4px;
                    font-size: 1.24em;
                    font-weight: 700;
                    margin-top: 18px;
                    margin-bottom: 8px;
                }
                .live-editor-content h3 {
                    color: #0c4a6e;
                    font-size: 1.08em;
                    font-weight: 700;
                    margin-top: 14px;
                    margin-bottom: 6px;
                    line-height: 1.35;
                }
                .live-editor-content h3:not([style]) {
                    border-left: 3px solid #004d99;
                    padding-left: 9px;
                }
                .live-editor-content h4 {
                    color: #1e3a5f;
                    font-size: 0.98em;
                    font-weight: 700;
                    margin-top: 10px;
                    margin-bottom: 4px;
                    line-height: 1.35;
                }
                .live-editor-content ul {
                    list-style-type: disc;
                    padding-left: 1.5rem;
                    margin-top: 6px;
                    margin-bottom: 10px;
                }
                .live-editor-content ol {
                    list-style-type: decimal;
                    padding-left: 1.5rem;
                    margin-top: 6px;
                    margin-bottom: 10px;
                }
                .live-editor-content li {
                    display: list-item;
                    margin-bottom: 4px;
                    line-height: 1.55;
                }
                .live-editor-content ul ul {
                    list-style-type: circle;
                    margin-top: 4px;
                    margin-bottom: 4px;
                }
                .live-editor-content ol ol {
                    list-style-type: lower-alpha;
                    margin-top: 4px;
                    margin-bottom: 4px;
                }
                /* Recuadros internos y tarjetas de sección: contener siempre el desbordamiento horizontal */
                .live-editor-content div {
                    box-sizing: border-box;
                    max-width: 100%;
                }
                .live-editor-content div[style*="border"],
                .live-editor-content div[style*="padding"],
                .live-editor-content .seccion-card,
                .live-editor-content .report-section {
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    overflow-x: auto !important;
                }
                .live-editor-content .table-responsive,
                .live-editor-content .table-container,
                .live-editor-content .table-wrapper,
                .live-editor-content .custom-table-scroll {
                    width: 100% !important;
                    max-width: 100% !important;
                    overflow-x: auto !important;
                    -webkit-overflow-scrolling: touch !important;
                    margin: 16px 0 !important;
                    border-radius: 10px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-sizing: border-box !important;
                    display: block !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: #0d9488 #f1f5f9 !important;
                }
                .live-editor-content .table-responsive::-webkit-scrollbar,
                .live-editor-content .table-container::-webkit-scrollbar,
                .live-editor-content .table-wrapper::-webkit-scrollbar,
                .live-editor-content .custom-table-scroll::-webkit-scrollbar {
                    height: 10px !important;
                    width: 10px !important;
                    display: block !important;
                    appearance: none !important;
                    -webkit-appearance: none !important;
                }
                .live-editor-content .table-responsive::-webkit-scrollbar-track,
                .live-editor-content .table-container::-webkit-scrollbar-track,
                .live-editor-content .table-wrapper::-webkit-scrollbar-track,
                .live-editor-content .custom-table-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9 !important;
                    border-radius: 8px !important;
                    border: 1px solid #e2e8f0 !important;
                }
                .live-editor-content .table-responsive::-webkit-scrollbar-thumb,
                .live-editor-content .table-container::-webkit-scrollbar-thumb,
                .live-editor-content .table-wrapper::-webkit-scrollbar-thumb,
                .live-editor-content .custom-table-scroll::-webkit-scrollbar-thumb {
                    background: #0d9488 !important;
                    border-radius: 8px !important;
                    border: 2px solid #f1f5f9 !important;
                    cursor: grab !important;
                }
                .live-editor-content .table-responsive::-webkit-scrollbar-thumb:hover,
                .live-editor-content .table-container::-webkit-scrollbar-thumb:hover,
                .live-editor-content .table-wrapper::-webkit-scrollbar-thumb:hover,
                .live-editor-content .custom-table-scroll::-webkit-scrollbar-thumb:hover {
                    background: #0f766e !important;
                }
                .live-editor-content table {
                    width: 100% !important;
                    max-width: none !important;
                    border-collapse: collapse !important;
                    border-spacing: 0 !important;
                    margin: 12px 0;
                    font-size: 0.85em;
                    border-radius: 10px;
                    border: 1px solid #e2e8f0;
                    table-layout: auto !important;
                    word-break: normal !important;
                    box-sizing: border-box !important;
                    display: table !important;
                }
                .live-editor-content .table-responsive table,
                .live-editor-content .table-container table,
                .live-editor-content .table-wrapper table,
                .live-editor-content .custom-table-scroll table {
                    margin: 0 !important;
                    border: none !important;
                    border-radius: 0 !important;
                    width: 100% !important;
                    min-width: 100% !important;
                    max-width: none !important;
                    display: table !important;
                    table-layout: auto !important;
                }
                /* Salvaguarda: las tablas SIEMPRE preservan display: table */
                .live-editor-content > table,
                .live-editor-content div:not(.table-responsive):not(.table-container):not(.table-wrapper):not(.custom-table-scroll) > table {
                    display: table !important;
                    width: 100% !important;
                    max-width: none !important;
                }
                .live-editor-content table th {
                    background-color: #004d99;
                    color: white;
                    padding: 9px 12px;
                    text-align: left;
                    font-weight: 600;
                    border-bottom: 1px solid #ddd;
                    border-right: 1px solid rgba(255,255,255,0.15);
                    white-space: normal !important;
                    word-break: normal !important;
                    letter-spacing: 0.01em;
                    min-width: 110px;
                }
                /* Specific column widths for SGSST Reports */
                .checklist-mode table th:nth-child(1) { width: 38px; min-width: 38px; } /* # - Narrowest possible */
                .checklist-mode table th:nth-child(2) { width: 14%; } /* Requisito / Estándar */
                .checklist-mode table th:nth-child(3) { width: 44%; } /* Hallazgo (Evidencia) */
                .checklist-mode table th:nth-child(4) { width: 10%; } /* Tipo */
                .checklist-mode table th:nth-child(5) { width: 15%; } /* Responsable - Wider */

                .live-editor-content table th:last-child {
                    border-right: none;
                }
                .live-editor-content table td {
                    padding: 8px 12px;
                    border-bottom: 1px solid #e2e8f0;
                    border-right: 1px solid #f1f5f9;
                    vertical-align: top;
                    word-wrap: break-word !important;
                    overflow-wrap: break-word !important;
                    word-break: normal !important;
                    line-height: 1.45;
                    min-width: 110px;
                }
                /* Solo centrar y no romper en celdas numéricas de checklists o centradas explícitamente */
                .checklist-mode table td:first-child,
                .live-editor-content table td[style*="text-align:center"],
                .live-editor-content table td[style*="text-align: center"],
                .live-editor-content table td[align="center"] {
                    white-space: nowrap;
                    text-align: center;
                }
                .live-editor-content table td:last-child {
                    border-right: none;
                }
                .live-editor-content table tr:last-child td {
                    border-bottom: none;
                }
                .live-editor-content table tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                .live-editor-content table tr:hover {
                    background-color: #f1f5f9;
                }
                .live-editor-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    border: 1px solid #ddd;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    user-select: none;
                    -webkit-user-drag: none;
                }
                .live-editor-content img:hover {
                    outline: 2px solid #3b82f6;
                    outline-offset: 4px;
                }
                .live-editor-content img[data-selected="true"],
                .live-editor-content td[data-selected="true"],
                .live-editor-content th[data-selected="true"],
                .live-editor-content div[data-selected="true"] {
                    outline: 3px solid #3b82f6 !important;
                    outline-offset: -3px;
                    box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.2);
                }
                .live-editor-content td[data-selected="true"],
                .live-editor-content th[data-selected="true"],
                .live-editor-content div.diagram-node[data-selected="true"] {
                    background-color: rgba(59, 130, 246, 0.05) !important;
                }
                .image-toolbar, .table-toolbar, .graphic-toolbar, .diagram-toolbar {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    backdrop-filter: blur(8px);
                }
                .signature-modal {
                    backdrop-filter: blur(4px);
                }
                .signature-placeholder {
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 5;
                    pointer-events: auto !important;
                    user-select: none;
                }
                .signature-placeholder * {
                    pointer-events: none; /* Make children non-blocking for click */
                }
                .signature-placeholder:hover {
                    background: rgba(0,77,153,0.1) !important;
                    border-color: #004d99 !important;
                    transform: scale(1.02);
                    box-shadow: 0 4px 12px rgba(0,77,153,0.15);
                }
                
                /* Paper Mode specific */
                .live-editor-content.paper-mode {
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                    padding: 24px 28px !important;
                    min-height: 600px;
                    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04);
                    border-radius: 12px;
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    width: 100% !important;
                    box-sizing: border-box !important;
                    overflow-x: auto !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: #0d9488 #f1f5f9 !important;
                }
                @media (max-width: 640px) {
                    .live-editor-content.paper-mode {
                        padding: 14px 12px !important;
                        border-radius: 8px;
                    }
                }
                .dark .live-editor-content.paper-mode {
                    background-color: #ffffff !important;
                    color: #1e293b !important;
                }
                
                /* AI Edit Bubble */
                .ai-edit-bubble {
                    position: fixed;
                    z-index: 9999999;
                }
                @keyframes aiBubblePop {
                    from { opacity: 0; transform: translateX(-50%) scale(0.9) translateY(4px); }
                    to   { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
                }

                .live-editor-fullscreen {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    bottom: 0 !important;
                    right: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    z-index: 999999 !important;
                    background: #fff !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }
                .dark .live-editor-fullscreen {
                    background: #18181b !important;
                }
                .live-editor-fullscreen .live-editor-content {
                    flex: 1;
                    height: calc(100vh - 80px) !important;
                    padding: 8px 12px !important;
                }
                .live-editor-fullscreen .live-editor-content > * {
                    max-width: 100% !important;
                }
                @media (min-width: 640px) {
                    .live-editor-fullscreen .live-editor-content {
                        padding: 24px 40px !important;
                    }
                    .live-editor-fullscreen .live-editor-content > * {
                        max-width: 1000px !important;
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                }
            `}),je&&Y&&Me.createPortal(r.jsx("div",{"data-ai-bubble":"true",className:"ai-edit-bubble",style:{position:"fixed",left:je.x,top:je.y,zIndex:9999999},children:J?r.jsxs("div",{"data-ai-bubble":"true",style:{background:"#ffffff",borderRadius:"12px",padding:"12px",boxShadow:"0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:"8px",minWidth:"260px"},children:[r.jsx("textarea",{ref:Ye,"data-ai-bubble":"true",value:oe,onChange:e=>Ee(e.target.value),placeholder:"¿Qué deseas cambiar o agregar?",style:{width:"100%",minHeight:"60px",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"8px",fontSize:"0.85em",resize:"none",outline:"none",color:"#1e293b"},onKeyDown:e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),Ve()),e.key==="Escape"&&(G(null),ie(!1))}}),r.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"8px"},children:[r.jsxs("button",{"data-ai-bubble":"true",onClick:()=>{G(null),ie(!1)},style:{background:"transparent",border:"none",fontSize:"0.8em",color:"#64748b",cursor:"pointer"},children:[" ","Cancelar"," "]}),r.jsx("button",{"data-ai-bubble":"true",onClick:Ve,disabled:Se||!oe.trim(),style:{background:"#4f46e5",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"0.8em",fontWeight:600,cursor:"pointer",opacity:Se||!oe.trim()?.5:1},children:Se?"Procesando...":"✨ Aplicar"})]})]}):r.jsx("button",{"data-ai-bubble":"true",onClick:()=>ie(!0),style:{display:"flex",alignItems:"center",gap:"6px",background:"linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",color:"#fff",border:"none",borderRadius:"20px",padding:"6px 14px",fontSize:"0.78em",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.3px",boxShadow:"0 4px 12px rgba(99,102,241,0.35)"},children:"✨ Editar con IA"})}),Y),C&&r.jsx("button",{type:"button",onClick:Ie,title:"Salir de Pantalla Completa",className:"fixed bottom-6 right-6 z-[99999999] flex sm:hidden h-12 w-12 items-center justify-center rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl active:scale-90 border-2 border-white/40 transition-transform duration-200",children:r.jsx(V,{className:"h-6 w-6 stroke-[2.5]"})})]})});xr.displayName="LiveEditor";export{xr as L};
