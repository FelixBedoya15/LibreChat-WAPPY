import{r as s,R as De,dx as Wt,dy as Bt,dz as Ut,dA as qt,dB as Gt,dC as Jt,dD as Yt,b$ as Xt,dE as Kt,dF as at,dG as st,dH as it,cq as lt,dI as Oe,cW as mt,cn as Vt,dJ as ct,dK as dt,j as t,a as Pe,bl as de,bB as we,dL as Qt,dM as Zt,dN as er,c4 as ut,c1 as tr,g as bt,bx as rr,bn as pt,dO as nr,cu as or,dP as ar}from"./vendor.D1H3KcbA.js";import{b as ft,u as xt,c as sr,aK as ht}from"./ambassadors-module.CNmmZZwa.js";import"./utilities.BjsdvwEO.js";import{b as ir}from"./sgsst-modules.YUxuXomW.js";import{a as lr}from"./framer-motion.BsAOeBpL.js";import{a as ve}from"./http-client.Dy2B3wi_.js";function Te(f){if(!f||typeof f!="string"||!f.includes("<table")||typeof window>"u"||typeof DOMParser>"u")return f;try{const M=new DOMParser().parseFromString(f,"text/html"),O=M.querySelectorAll("table");let k=!1;if(O.forEach(p=>{var P;const j=p.parentElement;if(j&&(j.classList.contains("table-responsive")||j.classList.contains("table-container")||j.classList.contains("table-wrapper")||j.classList.contains("custom-table-scroll")))j&&(j.classList.contains("custom-table-scroll")||(j.classList.add("custom-table-scroll"),k=!0),p.style.display="table",p.style.width="100%");else{k=!0;const z=M.createElement("div");z.className="table-responsive custom-table-scroll",z.setAttribute("style","width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px 0; border-radius: 10px; border: 1px solid #e2e8f0; box-sizing: border-box;"),p.style.margin="0",p.style.border="none",p.style.borderRadius="0",p.style.width="100%",p.style.display="table",p.style.tableLayout="auto",(P=p.parentNode)==null||P.insertBefore(z,p),z.appendChild(p)}}),k)return M.body.innerHTML}catch(I){console.error("[LiveEditor] wrapTablesInResponsiveContainer error:",I)}return f}const cr=s.forwardRef(({initialContent:f,onUpdate:I,onChange:M,onSave:O,onHistory:k,reportType:p="general",reportSourceData:j,paperMode:C=!0,hideFullscreen:P=!1,hideToolbarWhenCollapsed:z=!1,isGenerating:_,isEditable:ne=!0,readOnly:Z=!1,placeholder:J,editorId:ue},g)=>{var rt,nt,ot;const m=ft(),{token:T}=xt(),i=s.useRef(null),b=I||M,L=s.useRef(b);s.useEffect(()=>{L.current=b},[b]);const u=s.useCallback(e=>{var n;const r=typeof e=="string"?e:((n=i.current)==null?void 0:n.innerHTML)||"";if(typeof L.current=="function")try{L.current(r)}catch(o){console.warn("[LiveEditor] Error in onUpdate callback:",o)}},[]),B=s.useRef(null),ee=s.useRef(null),[pe,R]=s.useState(f),[h,A]=s.useState({}),[F,H]=s.useState(!1),[gt,ye]=s.useState(!1),[D,ke]=s.useState(null),[_e,wt]=s.useState({top:0,left:0}),[y,oe]=s.useState(null),[Fe,vt]=s.useState({top:0,left:0}),[Y,Le]=s.useState(null),[He,yt]=s.useState({top:0,left:0}),[te,je]=s.useState(null),[$e,kt]=s.useState({top:0,left:0}),[U,me]=s.useState(null),[X,We]=s.useState(""),[Re,ae]=s.useState(null),[be,Ae]=s.useState(""),[Be,jt]=s.useState(""),[Me,Ue]=s.useState(!1),[$,fe]=s.useState(!1),[qe,Ct]=s.useState(3),[Ge,Je]=s.useState(null);De.useEffect(()=>{const e=r=>{var n;(n=r.detail)!=null&&n.message&&(Je({message:r.detail.message,status:r.detail.status,severity:r.detail.severity}),setTimeout(()=>Je(null),3500))};return window.addEventListener("add-toast",e),()=>window.removeEventListener("add-toast",e)},[]);const xe=s.useRef(null);s.useEffect(()=>($?window.dispatchEvent(new CustomEvent("live-editor-fullscreen-enter")):window.dispatchEvent(new CustomEvent("live-editor-fullscreen-exit")),()=>{$&&window.dispatchEvent(new CustomEvent("live-editor-fullscreen-exit"))}),[$]);const[se,he]=s.useState(!1),[pr,Ce]=s.useState({}),[ie,Nt]=s.useState(null),ge=s.useRef(null),Ye=s.useRef(null);s.useEffect(()=>{const e=()=>{Nt(document.fullscreenElement||document.getElementById("root")||document.body)};return e(),document.addEventListener("fullscreenchange",e),()=>document.removeEventListener("fullscreenchange",e)},[]),s.useEffect(()=>{const e=localStorage.getItem("wappy_signatures");let r={};if(e)try{r=JSON.parse(e)}catch{}else{const n=localStorage.getItem("sgsst_signatures");if(n)try{const o=JSON.parse(n);o&&typeof o=="object"&&Object.keys(o).forEach(a=>{var l;(l=o[a])!=null&&l.url&&(r[a]=o[a].url)})}catch{}}A(r),T&&fetch("/api/sgsst/signatures",{headers:{Authorization:`Bearer ${T}`}}).then(n=>n.json()).then(n=>{n.signatures&&Object.keys(n.signatures).length>0&&A(o=>{const a={...o,...n.signatures};return localStorage.setItem("wappy_signatures",JSON.stringify(a)),a})}).catch(n=>console.error("Error fetching signatures for sync:",n))},[T]),s.useEffect(()=>{const e=n=>{n.target.closest("[data-ai-bubble]")||setTimeout(()=>{var w;const a=window.getSelection();if(!a||a.isCollapsed||!a.toString().trim()){se||ae(null),Ce({status:"collapsed_or_empty"});return}const l=a.toString().trim(),d=a.getRangeAt(0);try{const c=i.current,E=d.commonAncestorContainer;if(!((c==null?void 0:c.contains(a.anchorNode))||(c==null?void 0:c.contains(a.focusNode))||(c==null?void 0:c.contains(E))||E&&E.contains&&E.contains(c))){se||ae(null),Ce({status:"not_in_editor",focusNode:(w=a.focusNode)==null?void 0:w.nodeName});return}ge.current=d.cloneRange(),jt(l);const q=d.getBoundingClientRect();let G=q.left+q.width/2,re=q.bottom+12;G=Math.max(80,Math.min(G,window.innerWidth-80)),re=Math.max(20,Math.min(re,window.innerHeight-80)),Ce({status:"success",fixedX:Math.round(G),fixedY:Math.round(re),textLen:l.length}),ae({x:G,y:re}),he(!1),Ae("")}catch(c){Ce({status:"error",msg:c==null?void 0:c.message}),console.error("[LiveEditor] Selection error:",c)}},50)},r=i.current;return r==null||r.addEventListener("mouseup",e),document.addEventListener("mouseup",e),()=>{r==null||r.removeEventListener("mouseup",e),document.removeEventListener("mouseup",e)}},[se]),s.useEffect(()=>{se&&setTimeout(()=>{var e;return(e=Ye.current)==null?void 0:e.focus()},50)},[se]);const Xe=async()=>{var e;if(!(!be.trim()||!ge.current||!Be)){Ue(!0);try{const r=((e=i.current)==null?void 0:e.innerText)||"",n=await fetch("/api/live/ai-edit-text",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${T}`},body:JSON.stringify({selectedText:Be,instruction:be,fullReportText:r,reportSourceData:j??null})}),o=await n.json();if(!n.ok)throw new Error(o.error||"Error al editar");const a=window.getSelection();a&&ge.current&&(a.removeAllRanges(),a.addRange(ge.current),document.execCommand("insertText",!1,o.editedText)),ae(null),he(!1),Ae(""),ge.current=null,u()}catch(r){alert(`Error IA: ${r.message}`)}finally{Ue(!1)}}},St=async()=>{if($){try{document.exitFullscreen?await document.exitFullscreen():document.webkitExitFullscreen&&await document.webkitExitFullscreen()}catch{}fe(!1)}else try{const e=xe.current;e&&(e.requestFullscreen?await e.requestFullscreen():e.webkitRequestFullscreen&&await e.webkitRequestFullscreen(),fe(!0))}catch{fe(!0)}};s.useEffect(()=>{const e=()=>{document.fullscreenElement||document.webkitFullscreenElement||fe(!1)};return document.addEventListener("fullscreenchange",e),document.addEventListener("webkitfullscreenchange",e),()=>{document.removeEventListener("fullscreenchange",e),document.removeEventListener("webkitfullscreenchange",e)}},[]),s.useEffect(()=>{if($){document.body.style.overflow="hidden";const e=r=>{r.key==="Escape"&&fe(!1)};return window.addEventListener("keydown",e),()=>{document.body.style.overflow="auto",window.removeEventListener("keydown",e)}}document.body.style.overflow="auto"},[$]),s.useEffect(()=>{try{Object.keys(h).length>0&&localStorage.setItem("wappy_signatures",JSON.stringify(h))}catch{console.warn("Storage quota exceeded for signatures.");const r=Object.entries(h);if(r.length>5){const n=Object.fromEntries(r.slice(r.length-5));A(n)}}},[h]),s.useEffect(()=>{if(!i.current||Object.keys(h).length===0)return;let e=!1;const r=Array.from(i.current.querySelectorAll('.signature-placeholder:not([data-skip-auto="true"])')),n=o=>{if(!o)return null;if(o=o.toUpperCase().trim(),h[o])return h[o];for(const a of Object.keys(h))if(o.includes(a)||a.includes(o))return h[a];return null};if(r.length>0&&(r.forEach(o=>{var l;const a=o.nextElementSibling;if(a){const d=((l=a.textContent)==null?void 0:l.trim().toUpperCase())||"",w=n(d);if(d&&w){const c=document.createElement("img");c.src=w,c.className="wappy-auto-signature",c.style.maxHeight="100px",c.style.display="block",c.style.margin="10px auto",c.alt=`Firma de ${d}`,o.replaceWith(c),e=!0}}}),e)){const o=i.current.innerHTML;R(o),u(o)}},[h,pe,u]),s.useImperativeHandle(g,()=>({setHTML:e=>{if(i.current){K.current=!0;const r=e.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),n=Te(r);i.current.innerHTML=n,R(n),setTimeout(()=>{K.current=!1},50)}},insertHTML:e=>{if(!i.current)return;const r=Te(e);i.current.focus();const n=window.getSelection();if(n&&n.rangeCount>0){const a=n.getRangeAt(0);if(i.current.contains(a.commonAncestorContainer)){a.deleteContents();const l=document.createElement("div");l.innerHTML=r;const d=document.createDocumentFragment();let w,c;for(;w=l.firstChild;)c=d.appendChild(w);if(a.insertNode(d),c){const W=document.createRange();W.setStartAfter(c),W.collapse(!0),n.removeAllRanges(),n.addRange(W)}const E=i.current.innerHTML;R(E),u(E);return}}i.current.innerHTML+=r;const o=i.current.innerHTML;R(o),u(o)},getHTML:()=>i.current?i.current.innerHTML:""}));const le=s.useRef(!1),K=s.useRef(!1),Et=s.useCallback(()=>{if(!i.current)return!1;const e=i.current.querySelectorAll("table");let r=!1;return e.forEach(n=>{const o=n.parentElement;if(!(o&&(o.classList.contains("table-responsive")||o.classList.contains("table-container")||o.classList.contains("table-wrapper")||o.classList.contains("custom-table-scroll")))&&o){r=!0;const l=document.createElement("div");l.className="table-responsive custom-table-scroll",l.setAttribute("style","width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px 0; border-radius: 10px; border: 1px solid #e2e8f0; box-sizing: border-box;"),n.style.margin="0",n.style.border="none",n.style.borderRadius="0",n.style.width="100%",n.style.tableLayout="auto",n.style.display="table",o.insertBefore(l,n),l.appendChild(n)}else o&&!o.classList.contains("custom-table-scroll")&&o.classList.add("custom-table-scroll")}),r},[]);s.useEffect(()=>{const e=i.current;if(!e)return;const r=n=>{const a=n.target.closest(".table-responsive, .table-container, .table-wrapper, .custom-table-scroll");if(!a)return;const l=a.scrollWidth-a.clientWidth;if(l>2&&Math.abs(n.deltaY)>Math.abs(n.deltaX)){const d=n.deltaY>0&&a.scrollLeft<l-1,w=n.deltaY<0&&a.scrollLeft>1;(d||w)&&(n.preventDefault(),a.scrollLeft+=n.deltaY)}};return e.addEventListener("wheel",r,{passive:!1}),()=>{e.removeEventListener("wheel",r)}},[]),s.useEffect(()=>{if(f&&i.current){const e=f.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),r=Te(e),n=i.current.innerHTML.trim();!n||!le.current?(K.current=!0,i.current.innerHTML=r,R(r),le.current=!0,setTimeout(()=>{K.current=!1},50)):n!==r.trim()&&!K.current&&(K.current=!0,i.current.innerHTML=r,R(r),setTimeout(()=>{K.current=!1},50))}},[f]),s.useEffect(()=>{if(!le.current&&i.current&&f){const e=f.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,""),r=Te(e);i.current.innerHTML=r,le.current=!0}else!le.current&&i.current&&(le.current=!0);if(i.current){const e=new MutationObserver(()=>{var n;if(K.current)return;Et();const r=((n=i.current)==null?void 0:n.innerHTML)||"";R(r),u(r)});return e.observe(i.current,{childList:!0,subtree:!0,characterData:!0,attributes:!0,attributeFilter:["style","class","src","width","height"]}),()=>e.disconnect()}},[]);const It=e=>{const r=e.currentTarget.innerHTML;R(r),u(r)},Ke=(e,r=void 0)=>{var n;document.execCommand(e,!1,r),(n=i.current)==null||n.focus()},Tt=e=>{var n;const r=(n=e.target.files)==null?void 0:n[0];if(r){const o=new FileReader;o.onload=a=>{var d;const l=(d=a.target)==null?void 0:d.result;Ke("insertImage",l)},o.readAsDataURL(r)}e.target.value=""},ze=async e=>{if(T)try{await fetch("/api/sgsst/signatures",{method:"POST",headers:{Authorization:`Bearer ${T}`,"Content-Type":"application/json"},body:JSON.stringify({signatures:e})})}catch(r){console.error("Error saving signatures to backend:",r)}},Lt=e=>{var n;const r=(n=e.target.files)==null?void 0:n[0];if(r){const o=new FileReader;o.onload=a=>{var E,W,q;const l=(E=a.target)==null?void 0:E.result;let d=X;(!d||d==="DESCONOCIDO")&&(d=((W=prompt("¿A qué nombre o rol pertenece esta firma?"))==null?void 0:W.trim().toUpperCase())||`Firma ${Object.keys(h).length+1}`);const w={...h,[d]:l};A(w),localStorage.setItem("wappy_signatures",JSON.stringify(w)),ze(w);const c=document.createElement("img");if(c.src=l,c.style.maxHeight="100px",c.style.display="block",c.style.margin="10px auto",c.alt=`Firma ${d}`,U&&((q=i.current)!=null&&q.contains(U)))U.replaceWith(c);else{const G=`<img src="${l}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${d}" />`;document.execCommand("insertHTML",!1,G)}u(),me(null),H(!1),ye(!1)},o.readAsDataURL(r)}e.target.value=""},Ve=(e,r)=>{var o;const n=document.createElement("img");if(n.src=e,n.style.maxHeight="100px",n.style.display="block",n.style.margin="10px auto",n.alt=`Firma ${r}`,U&&((o=i.current)!=null&&o.contains(U)))U.replaceWith(n);else{const a=`<img src="${e}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${r}" />`;document.execCommand("insertHTML",!1,a)}u(),me(null),H(!1)},Rt=e=>{var a,l;let r=X;(!r||r==="DESCONOCIDO")&&(r=((a=prompt("¿A qué nombre o rol pertenece esta firma?"))==null?void 0:a.trim().toUpperCase())||`Firma ${Object.keys(h).length+1}`);const n={...h,[r]:e};A(n),localStorage.setItem("wappy_signatures",JSON.stringify(n)),ze(n);const o=document.createElement("img");if(o.src=e,o.style.maxHeight="100px",o.style.display="block",o.style.margin="10px auto",o.alt=`Firma ${r}`,U&&((l=i.current)!=null&&l.contains(U)))U.replaceWith(o);else{const d=`<img src="${e}" style="max-height:100px;display:block;margin:10px auto;" alt="Firma ${r}" />`;document.execCommand("insertHTML",!1,d)}u(),me(null),H(!1),ye(!1)},At=e=>{A(r=>{const n={...r};return delete n[e],localStorage.setItem("wappy_signatures",JSON.stringify(n)),ze(n),n})};s.useEffect(()=>{const e=o=>{var l,d,w,c,E,W,q,G,re;const a=o.target;if(a.tagName==="IMG"&&((l=i.current)!=null&&l.contains(a))){const x=a;r(),x.setAttribute("data-selected","true"),ke(x);const v=x.getBoundingClientRect();wt({top:v.top-58,left:v.left})}else if((a.closest(".signature-placeholder")||(d=a.innerText)!=null&&d.includes("FIRMADO DIGITALMENTE"))&&((w=i.current)!=null&&w.contains(a))){if(a.closest(".signature-placeholder")||a.closest("div")||a.parentElement){o.preventDefault();const v=a.closest(".signature-placeholder");if(v&&((c=i.current)!=null&&c.contains(v))){let S="DESCONOCIDO";const Q=v.nextElementSibling;Q&&(S=((E=Q.textContent)==null?void 0:E.trim().toUpperCase())||"DESCONOCIDO"),We(S),me(v),H(!0)}}}else if(a.closest("td, th")&&((W=i.current)!=null&&W.contains(a))){const x=a.closest("td, th"),v=x.querySelector(".signature-placeholder");if(v){o.preventDefault();let S="DESCONOCIDO";const Q=v.nextElementSibling;Q&&(S=((q=Q.textContent)==null?void 0:q.trim().toUpperCase())||"DESCONOCIDO"),We(S),me(v),H(!0)}else{r(),x.setAttribute("data-selected","true"),oe(x);const S=x.getBoundingClientRect(),Q=xe.current.getBoundingClientRect();vt({top:S.top-Q.top-50,left:S.left-Q.left})}}else if(a.closest('.progress-bar-container, [style*="width:"]')&&((G=i.current)!=null&&G.contains(a))){const x=a.closest("div");if(x.style.width||x.classList.contains("progress-bar")){r(),x.setAttribute("data-selected","true"),Le(x);const v=x.getBoundingClientRect(),S=xe.current.getBoundingClientRect();yt({top:v.top-S.top-60,left:v.left-S.left})}}else if(a.closest(".diagram-node")&&((re=i.current)!=null&&re.contains(a))){const x=a.closest(".diagram-node");r(),x.setAttribute("data-selected","true"),je(x);const v=x.getBoundingClientRect(),S=xe.current.getBoundingClientRect();kt({top:v.top-S.top-50,left:v.left-S.left})}else!!a.closest('.image-toolbar, .table-toolbar, .graphic-toolbar, .diagram-toolbar, .signature-modal, [data-ai-bubble="true"]')||r()},r=()=>{var o;(o=i.current)==null||o.querySelectorAll("img, td, th, div, span, .diagram-node").forEach(a=>a.removeAttribute("data-selected")),ke(null),oe(null),Le(null),je(null)},n=i.current;return n&&n.addEventListener("click",e),()=>{n&&n.removeEventListener("click",e)}},[]);const V=e=>{D&&(Object.assign(D.style,e),u())},Ne=e=>{D&&V(e==="center"?{display:"block",margin:"10px auto",float:"none"}:e==="left"?{display:"inline-block",margin:"0 15px 10px 0",float:"left"}:e==="right"?{display:"inline-block",margin:"0 0 10px 15px",float:"right"}:{display:"inline-block",margin:"0",float:"none",position:"static"})},Qe=e=>{D&&V(e==="front"?{position:"relative",zIndex:"10"}:e==="back"?{position:"relative",zIndex:"-1"}:{position:"static",zIndex:"0"})},Se=e=>{if(!D)return;V({width:e==="sm"?"150px":e==="md"?"300px":e==="lg"?"500px":"100%",height:"auto"})},Mt=()=>{if(D){if(D.alt&&D.alt.startsWith("Firma")){const e=document.createElement("div");e.className="signature-placeholder",e.setAttribute("data-skip-auto","true"),e.style.cssText="border-bottom: 2px solid #333; width: 100%; min-height: 80px; display: flex; align-items: center; justify-content: center; background-color: #f9f9f9; cursor: pointer; border-radius: 8px 8px 0 0; transition: all 0.3s ease;",e.innerHTML='<span style="font-size: 11px; opacity: 0.6;">Clic para firmar</span>',D.replaceWith(e)}else D.remove();ke(null),u()}},Ze=e=>{if(!y)return;const r=y.parentElement,o=r.parentElement.insertRow(e==="above"?r.rowIndex:r.rowIndex+1);for(let a=0;a<r.cells.length;a++){const l=o.insertCell(a);l.innerHTML="&nbsp;"}u()},zt=e=>{if(!y)return;const r=y.closest("table"),o=y.cellIndex+1;for(let a=0;a<r.rows.length;a++){const d=r.rows[a].insertCell(o);d.innerHTML="&nbsp;"}u()},Dt=()=>{if(!y)return;const e=y.parentElement,r=e.closest("table");r.rows.length>1&&(r.deleteRow(e.rowIndex),oe(null),u())},Ot=()=>{if(!y)return;const e=y.closest("table"),r=y.cellIndex;if(e.rows[0].cells.length>1){for(let n=0;n<e.rows.length;n++)e.rows[n].deleteCell(r);oe(null),u()}},Pt=()=>{if(!y)return;const e=y.closest("table");e==null||e.remove(),oe(null),u()},et=e=>{if(!y)return;const r=y.cellIndex,o=y.closest("table").rows[0].cells[r],a=o.offsetWidth,l=e==="wider"?a+20:Math.max(20,a-20);o.style.width=`${l}px`,o.style.minWidth=`${l}px`,u()},Ee=(e,r)=>{if(!Y)return;const n=Y.querySelector("div")||Y;r&&(n.style.backgroundColor=r),n.style.width=`${e}%`,n.innerText=`${e}%`,u()},ce=(e,r)=>{if(!te)return;te.style.backgroundColor=e,te.style.color=r,te.querySelectorAll("span").forEach(o=>{o.style.color=r}),u()},_t=()=>{te&&(te.remove(),je(null),u())},tt=e=>{var n;const r=e==="up"?Math.min(qe+1,7):Math.max(qe-1,1);Ct(r),(n=i.current)==null||n.focus(),document.execCommand("fontSize",!1,String(r)),u()},Ft=()=>tt("up"),Ht=()=>tt("down"),N=({icon:e,command:r,value:n,label:o,onClick:a})=>t.jsxs(lr.button,{whileTap:{scale:.95},onClick:a||(()=>r&&Ke(r,n)),className:"border-border-medium/50 group relative flex h-7.5 w-7.5 sm:h-8 sm:w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-surface-primary text-text-primary shadow-xs outline-none transition-all duration-200 hover:border-teal-400 hover:bg-surface-hover active:scale-95",type:"button","aria-label":o,children:[t.jsx(e,{size:15,className:"sm:h-4 sm:w-4"}),t.jsx("div",{className:"pointer-events-none absolute left-1/2 top-full z-[110] mt-1.5 hidden max-w-0 -translate-x-1/2 items-center overflow-hidden whitespace-nowrap rounded-md border border-teal-500/50 bg-teal-600 px-2 py-0.5 text-white opacity-0 shadow-xl transition-all duration-300 ease-in-out group-hover:max-w-[150px] group-hover:opacity-100 sm:flex",children:t.jsx("span",{className:"text-[9px] font-bold uppercase tracking-wider",children:o})})]}),Ie=[{id:"fontsize",buttons:[{icon:Wt,label:"Aumentar texto",onClick:Ft},{icon:Bt,label:"Reducir texto",onClick:Ht}]},{id:"format",buttons:[{icon:Ut,command:"bold",label:m("com_ui_bold")},{icon:qt,command:"italic",label:m("com_ui_italic")},{icon:Gt,command:"underline",label:m("com_ui_underline")}]},{id:"headings",buttons:[{icon:Jt,command:"formatBlock",value:"H1",label:m("com_ui_heading_1")},{icon:Yt,command:"formatBlock",value:"H2",label:m("com_ui_heading_2")}]},{id:"lists",buttons:[{icon:Xt,command:"insertUnorderedList",label:m("com_ui_bullet_list")},{icon:Kt,command:"insertOrderedList",label:m("com_ui_numbered_list")}]},{id:"align",buttons:[{icon:at,command:"justifyLeft",label:m("com_ui_align_left")},{icon:st,command:"justifyCenter",label:m("com_ui_align_center")},{icon:it,command:"justifyRight",label:m("com_ui_align_right")}]},{id:"media",buttons:[{icon:lt,label:"Imagen",onClick:()=>{var e;return(e=B.current)==null?void 0:e.click()}},{icon:Oe,label:"Firma",onClick:()=>H(!0)}]},{id:"save",buttons:[...k?[{icon:mt,label:m("com_ui_history")||"Historial",onClick:k}]:[],...O?[{icon:Vt,label:m("com_ui_save_report")||"Guardar Informe",onClick:O}]:[],...P?[]:[{icon:$?ct:dt,label:$?"Salir Pantalla Completa":"Pantalla Completa",onClick:St}]]}].filter(e=>e.buttons.length>0);De.useMemo(()=>{const e=[];let r=[],n=0;return Ie.forEach(o=>{n+o.buttons.length>5&&r.length>0?(e.push(r),r=[o],n=o.buttons.length):(r.push(o),n+=o.buttons.length)}),r.length>0&&e.push(r),e},[Ie]);const $t=()=>t.jsx("div",{className:"hidden sm:block bg-border-medium/60 mx-0.5 h-4 w-px self-center"});return t.jsxs("div",{ref:xe,className:`relative flex flex-col ${$?"fixed inset-0 z-[99999] bg-surface-secondary":"h-full min-h-[500px] w-full rounded-xl bg-surface-secondary"} font-sans transition-all duration-300`,children:[Ge&&t.jsx("div",{className:"pointer-events-none absolute left-1/2 top-16 z-[99999999] -translate-x-1/2 transform",children:t.jsxs("div",{className:"flex items-center gap-3 rounded-xl border border-teal-500/30 bg-[#0d0d0d] px-5 py-3 text-sm font-semibold text-teal-400 shadow-2xl duration-300 animate-in fade-in slide-in-from-top-6",children:[t.jsx("svg",{className:"h-5 w-5 flex-shrink-0",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2.5,d:"M5 13l4 4L19 7"})}),Ge.message]})}),(!z||$)&&t.jsx("div",{className:"bg-surface-secondary/80 group/toolbar sticky top-0 z-50 flex flex-col items-center border-b border-border-medium p-1.5 sm:p-2 backdrop-blur-sm transition-all duration-300",children:t.jsx("div",{className:"flex flex-wrap items-center justify-center gap-1 sm:gap-1.5",children:Ie.map((e,r)=>t.jsxs(De.Fragment,{children:[t.jsx("div",{className:"flex items-center gap-1",children:e.buttons.map((n,o)=>t.jsx(N,{...n},o))}),r<Ie.length-1&&t.jsx($t,{})]},e.id))})}),t.jsx("input",{type:"file",ref:B,className:"hidden",accept:"image/*",onChange:Tt}),t.jsx("input",{type:"file",ref:ee,className:"hidden",accept:"image/*",onChange:Lt}),F&&ie&&Pe.createPortal(t.jsx("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center bg-black/50 p-4",onClick:()=>H(!1),children:t.jsxs("div",{className:"w-full max-w-md overflow-hidden rounded-2xl border border-border-medium bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in",onClick:e=>e.stopPropagation(),children:[t.jsxs("div",{className:"flex items-center justify-between border-b border-border-light bg-surface-secondary p-4",children:[t.jsx("h3",{className:"text-sm font-bold uppercase text-text-primary",children:X&&X!=="DESCONOCIDO"?`Insertar Firma: ${X}`:"Firmas Digitales"}),t.jsx("button",{onClick:()=>H(!1),className:"text-text-tertiary hover:text-text-primary",children:t.jsx(de,{className:"h-5 w-5"})})]}),t.jsx("div",{className:"max-h-[60vh] overflow-y-auto p-4",children:Object.keys(h).length===0?t.jsxs("div",{className:"py-8 text-center text-text-tertiary",children:[t.jsx(Oe,{className:"mx-auto mb-2 h-12 w-12 opacity-20"}),t.jsx("p",{children:"No hay firmas guardadas"})]}):t.jsx("div",{className:"grid grid-cols-2 gap-3",children:Object.entries(h).map(([e,r])=>t.jsxs("div",{className:"group relative flex cursor-pointer flex-col items-center justify-between rounded-lg border border-border-light bg-white p-3 transition-all hover:border-blue-500",children:[t.jsx("img",{src:r,alt:e,className:"mb-2 max-h-16 w-auto flex-grow object-contain",onClick:()=>Ve(r,e)}),t.jsx("div",{className:"w-full break-words px-1 text-center text-[10px] font-bold uppercase leading-none tracking-tight text-slate-700",onClick:()=>Ve(r,e),children:e}),t.jsx("button",{onClick:n=>{n.stopPropagation(),At(e)},className:"absolute -right-2 -top-2 z-10 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100",children:t.jsx(we,{className:"h-3 w-3"})})]},e))})}),t.jsxs("div",{className:"flex flex-col gap-2 border-t border-border-light bg-surface-secondary p-4 sm:flex-row",children:[t.jsxs("button",{onClick:()=>{var e;return(e=ee.current)==null?void 0:e.click()},className:"flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700",children:[t.jsx(lt,{size:16})," Cargar Archivo"]}),t.jsxs("button",{onClick:()=>{H(!1),ye(!0)},className:"flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700",children:[t.jsx(Oe,{size:16})," Dibujar en Pantalla"]}),t.jsx("button",{onClick:()=>H(!1),className:"rounded-lg bg-border-light px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border-medium sm:flex-none",children:"Cerrar"})]})]})}),ie),t.jsx(ir,{isOpen:gt,onClose:()=>ye(!1),onSave:Rt,title:X&&X!=="DESCONOCIDO"?`Firma: ${X}`:"Dibujar Nueva Firma"}),D&&ie&&Pe.createPortal(t.jsxs("div",{className:"image-toolbar flex flex-wrap items-center gap-1.5 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{position:"fixed",top:`${Math.max(10,Math.min(_e.top,window.innerHeight-80))}px`,left:`${Math.max(10,Math.min(_e.left,window.innerWidth-380))}px`,zIndex:9999999,maxWidth:"360px"},onPointerDown:e=>{e.stopPropagation()},onClick:e=>{e.stopPropagation()},children:[t.jsxs("div",{className:"mr-0.5 flex gap-1 border-r border-border-light pr-1.5",children:[t.jsx("button",{onClick:e=>{e.stopPropagation(),Se("sm")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Pequeño",children:"S"}),t.jsx("button",{onClick:e=>{e.stopPropagation(),Se("md")},className:"rounded border border-transparent px-2 py-1 text-xs font-bold hover:border-border-medium hover:bg-surface-hover",title:"Mediano",children:"M"}),t.jsx("button",{onClick:e=>{e.stopPropagation(),Se("lg")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Grande",children:"L"}),t.jsx("button",{onClick:e=>{e.stopPropagation(),Se("full")},className:"rounded border border-transparent px-2 py-1 text-xs font-medium hover:border-border-medium hover:bg-surface-hover",title:"Ancho Total",children:"W"})]}),t.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[t.jsx(N,{icon:at,onClick:()=>Ne("left"),label:"Alinear Izquierda / Envolver"}),t.jsx(N,{icon:st,onClick:()=>Ne("center"),label:"Centrar"}),t.jsx(N,{icon:it,onClick:()=>Ne("right"),label:"Alinear Derecha / Envolver"}),t.jsx(N,{icon:Qt,onClick:()=>Ne("none"),label:"Restablecer (En línea)"})]}),t.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[t.jsx(N,{icon:Zt,onClick:()=>Qe("front"),label:"Traer al frente"}),t.jsx(N,{icon:er,onClick:()=>Qe("back"),label:"Enviar al fondo"})]}),t.jsx("button",{onClick:e=>{e.preventDefault(),e.stopPropagation(),Mt()},className:"rounded p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20",title:"Eliminar imagen / firma",children:t.jsx(we,{className:"h-4 w-4"})}),t.jsx("button",{onClick:e=>{e.preventDefault(),e.stopPropagation(),ke(null)},className:"rounded p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover",title:"Cerrar",children:t.jsx(de,{className:"h-4 w-4"})})]}),ie),y&&t.jsxs("div",{className:"table-toolbar absolute z-[80] flex flex-wrap items-center gap-1 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{top:`${Math.max(10,Fe.top)}px`,left:`${Math.max(10,Math.min(Fe.left,(((rt=i.current)==null?void 0:rt.clientWidth)||0)-400))}px`},children:[t.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[t.jsx(N,{icon:ut,onClick:()=>Ze("above"),label:"Fila Arriba"}),t.jsx(N,{icon:ut,onClick:()=>Ze("below"),label:"Fila Abajo"}),t.jsx(N,{icon:we,onClick:Dt,label:"Eliminar Fila"})]}),t.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[t.jsx(N,{icon:tr,onClick:()=>zt(),label:"Columna Derecha"}),t.jsx(N,{icon:we,onClick:Ot,label:"Eliminar Columna"})]}),t.jsxs("div",{className:"mr-0.5 flex gap-0.5 border-r border-border-light pr-1.5",children:[t.jsx(N,{icon:dt,onClick:()=>et("wider"),label:"Más Ancho"}),t.jsx(N,{icon:ct,onClick:()=>et("narrower"),label:"Menos Ancho"})]}),t.jsx("button",{onClick:Pt,className:"rounded p-1 px-2 text-xs font-bold text-red-500 hover:bg-red-50",title:"Eliminar Tabla",children:"TABLA"}),t.jsx("button",{onClick:()=>oe(null),className:"rounded p-1 text-text-tertiary hover:bg-surface-hover",children:t.jsx(de,{className:"h-4 w-4"})})]}),Y&&t.jsxs("div",{className:"graphic-toolbar absolute z-[80] flex items-center gap-2 rounded-lg border border-border-medium bg-surface-primary p-2 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1 dark:bg-zinc-800",style:{top:`${Math.max(10,He.top)}px`,left:`${Math.max(10,Math.min(He.left,(((nt=i.current)==null?void 0:nt.clientWidth)||0)-300))}px`},children:[t.jsx("input",{type:"range",min:"0",max:"100",defaultValue:parseInt(Y.style.width)||0,onChange:e=>Ee(parseInt(e.target.value)),className:"w-24 accent-blue-600"}),t.jsxs("div",{className:"flex gap-1",children:[t.jsx("button",{onClick:()=>Ee(parseInt(Y.style.width),"#22c55e"),className:"h-5 w-5 rounded-full border border-white/20 bg-green-500",title:"Verde"}),t.jsx("button",{onClick:()=>Ee(parseInt(Y.style.width),"#eab308"),className:"h-5 w-5 rounded-full border border-white/20 bg-yellow-500",title:"Amarillo"}),t.jsx("button",{onClick:()=>Ee(parseInt(Y.style.width),"#ef4444"),className:"h-5 w-5 rounded-full border border-white/20 bg-red-500",title:"Rojo"})]}),t.jsx("button",{onClick:()=>Le(null),className:"rounded p-1 text-text-tertiary hover:bg-surface-hover",children:t.jsx(de,{className:"h-4 w-4"})})]}),te&&t.jsxs("div",{className:"diagram-toolbar absolute z-[80] flex items-center gap-1.5 rounded-lg border border-border-medium bg-surface-primary p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1",style:{top:`${Math.max(10,$e.top)}px`,left:`${Math.max(10,Math.min($e.left,(((ot=i.current)==null?void 0:ot.clientWidth)||0)-300))}px`},children:[t.jsxs("div",{className:"mr-0.5 flex gap-1 border-r border-border-light pr-1.5",children:[t.jsx("span",{className:"mr-1 self-center text-[10px] font-bold uppercase text-text-tertiary",children:"Fondo:"}),t.jsx("button",{onClick:()=>ce("#f8fafc","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-[#f8fafc]",title:"Gris Claro"}),t.jsx("button",{onClick:()=>ce("#fef08a","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-yellow-200",title:"Amarillo"}),t.jsx("button",{onClick:()=>ce("#fed7aa","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-orange-200",title:"Naranja"}),t.jsx("button",{onClick:()=>ce("#fca5a5","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-red-300",title:"Rojo Claro"}),t.jsx("button",{onClick:()=>ce("#bbf7d0","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-green-200",title:"Verde Claro"}),t.jsx("button",{onClick:()=>ce("#e2e8f0","#111111"),className:"h-5 w-5 rounded-full border border-gray-300 bg-slate-200",title:"Gris"})]}),t.jsx("button",{onClick:_t,className:"rounded p-1.5 text-red-500 transition-colors hover:bg-red-50",title:"Eliminar figura",children:t.jsx(we,{className:"h-4 w-4"})}),t.jsx("button",{onClick:()=>je(null),className:"rounded p-1.5 text-text-tertiary transition-colors hover:bg-surface-hover",children:t.jsx(de,{className:"h-4 w-4"})})]}),t.jsx("div",{className:`relative flex flex-1 flex-col overflow-y-auto overflow-x-auto w-full min-w-0 transition-colors ${C?"bg-slate-100/70 dark:bg-zinc-950/40 p-2 sm:p-5":"p-2"}`,children:t.jsx("div",{ref:i,className:`prose outline-none transition-all live-editor-content w-full min-w-0 ${C?"paper-mode max-w-4xl mx-auto":"flex-1 p-3 sm:p-6 max-w-none dark:prose-invert"} ${p==="checklist"?"checklist-mode":""}`,contentEditable:!0,onInput:It,suppressContentEditableWarning:!0,style:{minHeight:C?"600px":"100%",maxWidth:C?"860px":"100%"}})}),t.jsx("style",{children:`
                .live-editor-content h1 {
                    color: #004d99;
                    text-align: center;
                    margin-bottom: 6px;
                    font-size: 1.5em;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 6px;
                }
                .live-editor-content h2 {
                    color: #004d99;
                    border-bottom: 2px solid #004d99;
                    padding-bottom: 4px;
                    font-size: 1.25em;
                    margin-top: 14px;
                    margin-bottom: 6px;
                }
                .live-editor-content h3 {
                    color: #333;
                    font-size: 1.1em;
                    margin-top: 10px;
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
            `}),Re&&ie&&Pe.createPortal(t.jsx("div",{"data-ai-bubble":"true",className:"ai-edit-bubble",style:{position:"fixed",left:Re.x,top:Re.y,zIndex:9999999},children:se?t.jsxs("div",{"data-ai-bubble":"true",style:{background:"#ffffff",borderRadius:"12px",padding:"12px",boxShadow:"0 10px 30px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:"8px",minWidth:"260px"},children:[t.jsx("textarea",{ref:Ye,"data-ai-bubble":"true",value:be,onChange:e=>Ae(e.target.value),placeholder:"¿Qué deseas cambiar o agregar?",style:{width:"100%",minHeight:"60px",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"8px",fontSize:"0.85em",resize:"none",outline:"none",color:"#1e293b"},onKeyDown:e=>{e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),Xe()),e.key==="Escape"&&(ae(null),he(!1))}}),t.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"8px"},children:[t.jsxs("button",{"data-ai-bubble":"true",onClick:()=>{ae(null),he(!1)},style:{background:"transparent",border:"none",fontSize:"0.8em",color:"#64748b",cursor:"pointer"},children:[" ","Cancelar"," "]}),t.jsx("button",{"data-ai-bubble":"true",onClick:Xe,disabled:Me||!be.trim(),style:{background:"#4f46e5",color:"#fff",border:"none",borderRadius:"6px",padding:"4px 12px",fontSize:"0.8em",fontWeight:600,cursor:"pointer",opacity:Me||!be.trim()?.5:1},children:Me?"Procesando...":"✨ Aplicar"})]})]}):t.jsx("button",{"data-ai-bubble":"true",onClick:()=>he(!0),style:{display:"flex",alignItems:"center",gap:"6px",background:"linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",color:"#fff",border:"none",borderRadius:"20px",padding:"6px 14px",fontSize:"0.78em",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",letterSpacing:"0.3px",boxShadow:"0 4px 12px rgba(99,102,241,0.35)"},children:"✨ Editar con IA"})}),ie)]})});cr.displayName="LiveEditor";const dr=1e8,ur=({title:f,onRename:I,onDelete:M,isPro:O})=>{const[k,p]=s.useState(!1),[j,C]=s.useState({}),[P,z]=s.useState(!1),_=s.useRef(null),ne=s.useRef(null),Z=()=>{if(!_.current)return;const g=_.current.getBoundingClientRect();C({position:"fixed",top:g.bottom+4,right:window.innerWidth-g.right,zIndex:dr})};s.useEffect(()=>{if(!k)return;const g=m=>{var i,b;const T=m.target;!((i=_.current)!=null&&i.contains(T))&&!((b=ne.current)!=null&&b.contains(T))&&p(!1)};return document.addEventListener("mousedown",g),()=>document.removeEventListener("mousedown",g)},[k]);const J=async g=>{if(g.stopPropagation(),p(!1),O===!1){alert("La opción de eliminar reportes es exclusiva del Plan Pro. Para generar múltiples reportes, adquiere Premium.");return}window.confirm(`¿Eliminar "${f}" del historial?
Esta acción no borra la conversación.`)&&(z(!0),await M(),z(!1))},ue=k?t.jsxs("div",{ref:ne,style:j,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[t.jsxs("button",{onClick:g=>{g.stopPropagation();const m=prompt("Nuevo nombre:",f);m&&m!==f&&I(m),p(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[t.jsx(or,{className:"h-3 w-3"})," Renombrar"]}),t.jsxs("button",{onClick:J,disabled:P,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[P?t.jsx(ht,{className:"h-3 w-3"}):t.jsx(ar,{className:"h-3 w-3"})," Eliminar"]})]}):null;return t.jsxs(t.Fragment,{children:[t.jsx("button",{ref:_,onClick:g=>{g.stopPropagation(),Z(),p(m=>!m)},className:"rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:t.jsx(nr,{className:"h-4 w-4 text-text-secondary"})}),bt.createPortal(ue,document.body)]})},wr=({onSelectReport:f,isOpen:I,toggleOpen:M,refreshTrigger:O,tags:k=["report"],historyEndpoint:p})=>{const{isAuthenticated:j,user:C,token:P}=xt(),z=(C==null?void 0:C.role)==="ADMIN"||(C==null?void 0:C.role)==="USER_PRO",_=ft(),[ne,Z]=s.useState([]),[J,ue]=s.useState(!1),[g,m]=s.useState(null),T=Array.isArray(k)&&k.length>0?k.join(","):"report",i=s.useCallback(async()=>{const b=P||localStorage.getItem("token");if(!j&&!b)return;ue(!0),m(null);const L=new AbortController,u=setTimeout(()=>L.abort(),1e4);try{const ee=T.split(",").filter(Boolean).map(A=>`tags=${encodeURIComponent(A)}`).join("&");let pe=p||"/api/sgsst/diagnostico/report-history";ee&&(pe+=`${pe.includes("?")?"&":"?"}${ee}`);const R=await fetch(pe,{headers:b?{Authorization:`Bearer ${b}`}:{},cache:"no-store",signal:L.signal});if(!R.ok){let A="Error al cargar el historial";try{const F=await R.json();F!=null&&F.details?A=F.details:F!=null&&F.error&&(A=F.error)}catch{}m(A),Z([]);return}const h=await R.json();Z(h.conversations||[])}catch(B){(B==null?void 0:B.name)==="AbortError"?m("La consulta tardó demasiado. Pulsa Actualizar para reintentar."):m("Error de red al cargar el historial"),Z([])}finally{clearTimeout(u),ue(!1)}},[j,P,T,p]);return s.useEffect(()=>{I?i():(Z([]),m(null))},[I,i]),s.useEffect(()=>{if(O&&O>0&&I){const b=setTimeout(i,600);return()=>clearTimeout(b)}},[O,I,i]),I?bt.createPortal(t.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6",children:[t.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:M}),t.jsxs("div",{className:"relative flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in-95",children:[t.jsxs("div",{className:"bg-surface-secondary/30 flex items-center justify-between border-b border-border-light px-6 py-5",children:[t.jsxs("div",{className:"flex items-center gap-3",children:[t.jsx("div",{className:"rounded-[14px] bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30",children:t.jsx(mt,{className:"h-5 w-5"})}),t.jsxs("div",{children:[t.jsx("h2",{className:"text-xl font-bold tracking-tight text-text-primary",children:_("com_ui_history")}),t.jsx("p",{className:"mt-0.5 text-xs font-medium text-text-secondary",children:"Historial de reportes de esta empresa"})]})]}),t.jsxs("div",{className:"flex flex-col items-end gap-2",children:[t.jsx("button",{onClick:M,className:"rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",children:t.jsx(de,{className:"h-5 w-5 text-text-secondary"})}),t.jsxs("button",{onClick:i,className:"flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary hover:text-blue-600",children:[t.jsx(rr,{className:sr("h-3.5 w-3.5",J&&"animate-spin")}),"Actualizar"]})]})]}),t.jsxs("div",{className:"max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-4",children:[J&&t.jsx("div",{className:"flex justify-center p-8",children:t.jsx(ht,{})}),!J&&g&&t.jsxs("div",{className:"flex h-32 flex-col items-center justify-center gap-2 text-sm text-red-500",children:[t.jsx("p",{children:g}),t.jsx("button",{onClick:i,className:"text-xs underline",children:"Reintentar"})]}),!J&&!g&&ne.length===0&&t.jsxs("div",{className:"flex h-40 flex-col items-center justify-center gap-2 text-sm text-text-secondary",children:[t.jsx(pt,{className:"mb-2 h-8 w-8 opacity-50"}),t.jsx("p",{children:_("com_ui_no_reports")})]}),!J&&ne.map(b=>t.jsxs("div",{className:"group relative",children:[t.jsx("button",{onClick:()=>{f(b.conversationId),M()},className:"w-full rounded-2xl border border-transparent bg-surface-primary p-4 pr-10 text-left shadow-sm transition-colors hover:border-black/5 hover:bg-surface-secondary",children:t.jsxs("div",{className:"flex items-start gap-4",children:[t.jsx("div",{className:"mt-0.5 rounded-xl border border-border-light bg-surface-tertiary p-2 text-[#0d9488] shadow-sm",children:t.jsx(pt,{className:"h-5 w-5",strokeWidth:1.5})}),t.jsxs("div",{className:"min-w-0 flex-1",children:[t.jsx("h3",{className:"truncate text-[15px] font-bold tracking-tight text-text-primary",children:b.title||_("com_ui_untitled_report")}),t.jsx("p",{className:"mt-1 text-[13px] font-medium text-text-secondary",children:new Date(b.updatedAt).toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"})})]})]})}),t.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",children:t.jsx(ur,{title:b.title||_("com_ui_report"),isPro:z,onRename:async L=>{try{p&&p.includes("/canvas/")&&await ve.post(`/api/sgsst/canvas/${b.conversationId}/rename`,{title:L}),await ve.post("/api/convos/update",{arg:{conversationId:b.conversationId,title:L}}),i()}catch(u){console.error(u)}},onDelete:async()=>{try{p&&p.includes("/canvas/")&&await ve.delete(`/api/sgsst/canvas/${b.conversationId}`);const B=((await ve.get(`/api/convos/${b.conversationId}`)).data.tags||[]).filter(ee=>!k.includes(ee));await ve.post("/api/convos/update",{arg:{conversationId:b.conversationId,tags:B}}),i()}catch(L){console.error(L)}}})})]},b.conversationId))]}),t.jsx("div",{className:"from-surface-secondary/50 h-2 bg-gradient-to-t to-transparent"})]})]}),document.body):null};export{cr as L,wr as R};
