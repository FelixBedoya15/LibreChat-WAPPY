import{r as f,c as ee,j as r}from"./react-core.DnLkJYlj.js";import{gg as me,ch as be,dL as pe,cA as Y,ht as ue,c$ as fe,dn as ge,dD as Q,d6 as he,fJ as re,cy as xe}from"./vendor.CzLQ0fq0.js";import{o as ae,u as we,c as ie,_ as se,a0 as ye,U as oe,aU as ke,aT as ve}from"./index.BmMWyCzY.js";import"./utilities.CCKZG3yh.js";import{a as F}from"./http-client.CBcqubEr.js";import{f as Ae}from"./routing.CpqY7sNF.js";const je=1e8,Ee=({title:g,onRename:k,onDelete:U,isPro:L})=>{const[S,x]=f.useState(!1),[M,m]=f.useState({}),[V,O]=f.useState(!1),P=f.useRef(null),q=f.useRef(null),N=()=>{if(!P.current)return;const h=P.current.getBoundingClientRect();m({position:"fixed",top:h.bottom+4,right:window.innerWidth-h.right,zIndex:je})};f.useEffect(()=>{if(!S)return;const h=d=>{var v,b;const B=d.target;!((v=P.current)!=null&&v.contains(B))&&!((b=q.current)!=null&&b.contains(B))&&x(!1)};return document.addEventListener("mousedown",h),()=>document.removeEventListener("mousedown",h)},[S]);const $=async h=>{if(h.stopPropagation(),x(!1),L===!1){alert("La opción de eliminar reportes es exclusiva del Plan Pro. Para generar múltiples reportes, adquiere Premium.");return}window.confirm(`¿Eliminar "${g}" del historial?
Esta acción no borra la conversación.`)&&(O(!0),await U(),O(!1))},G=S?r.jsxs("div",{ref:q,style:M,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[r.jsxs("button",{onClick:h=>{h.stopPropagation();const d=prompt("Nuevo nombre:",g);d&&d!==g&&k(d),x(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[r.jsx(fe,{className:"h-3 w-3"})," Renombrar"]}),r.jsxs("button",{onClick:$,disabled:V,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[V?r.jsx(se,{className:"h-3 w-3"}):r.jsx(ge,{className:"h-3 w-3"})," Eliminar"]})]}):null;return r.jsxs(r.Fragment,{children:[r.jsx("button",{ref:P,onClick:h=>{h.stopPropagation(),N(),x(d=>!d)},className:"rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:r.jsx(ue,{className:"h-4 w-4 text-text-secondary"})}),ee.createPortal(G,document.body)]})},Ie=({onSelectReport:g,isOpen:k,toggleOpen:U,refreshTrigger:L,tags:S=["report"],historyEndpoint:x})=>{const{isAuthenticated:M,user:m,token:V}=ae(),O=(m==null?void 0:m.role)==="ADMIN"||(m==null?void 0:m.role)==="USER_PRO"||(m==null?void 0:m.role)==="USER_IPEVAR"||(m==null?void 0:m.role)==="IPEVAR",P=we(),[q,N]=f.useState([]),[$,G]=f.useState(!1),[h,d]=f.useState(null),B=Array.isArray(S)&&S.length>0?S.join(","):"report",v=f.useCallback(async()=>{const b=V||localStorage.getItem("token");if(!M&&!b)return;G(!0),d(null);const z=new AbortController,R=setTimeout(()=>z.abort(),1e4);try{const H=B.split(",").filter(Boolean).map(T=>`tags=${encodeURIComponent(T)}`).join("&");let Z=x||"/api/sgsst/diagnostico/report-history";H&&(Z+=`${Z.includes("?")?"&":"?"}${H}`);const W=await fetch(Z,{headers:b?{Authorization:`Bearer ${b}`}:{},cache:"no-store",signal:z.signal});if(!W.ok){let T="Error al cargar el historial";try{const A=await W.json();A!=null&&A.details?T=A.details:A!=null&&A.error&&(T=A.error)}catch{}d(T),N([]);return}const J=await W.json();N(J.conversations||[])}catch(I){(I==null?void 0:I.name)==="AbortError"?d("La consulta tardó demasiado. Pulsa Actualizar para reintentar."):d("Error de red al cargar el historial"),N([])}finally{clearTimeout(R),G(!1)}},[M,V,B,x]);return f.useEffect(()=>{k?v():(N([]),d(null))},[k,v]),f.useEffect(()=>{if(L&&L>0&&k){const b=setTimeout(v,600);return()=>clearTimeout(b)}},[L,k,v]),k?ee.createPortal(r.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6",children:[r.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:U}),r.jsxs("div",{className:"relative flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in-95",children:[r.jsxs("div",{className:"bg-surface-secondary/30 flex items-center justify-between border-b border-border-light px-6 py-5",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"rounded-[14px] bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30",children:r.jsx(me,{className:"h-5 w-5"})}),r.jsxs("div",{children:[r.jsx("h2",{className:"text-xl font-bold tracking-tight text-text-primary",children:P("com_ui_history")}),r.jsx("p",{className:"mt-0.5 text-xs font-medium text-text-secondary",children:"Historial de reportes de esta empresa"})]})]}),r.jsxs("div",{className:"flex flex-col items-end gap-2",children:[r.jsx("button",{onClick:U,className:"rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",children:r.jsx(be,{className:"h-5 w-5 text-text-secondary"})}),r.jsxs("button",{onClick:v,className:"flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary hover:text-blue-600",children:[r.jsx(pe,{className:ie("h-3.5 w-3.5",$&&"animate-spin")}),"Actualizar"]})]})]}),r.jsxs("div",{className:"max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-4",children:[$&&r.jsx("div",{className:"flex justify-center p-8",children:r.jsx(se,{})}),!$&&h&&r.jsxs("div",{className:"flex h-32 flex-col items-center justify-center gap-2 text-sm text-red-500",children:[r.jsx("p",{children:h}),r.jsx("button",{onClick:v,className:"text-xs underline",children:"Reintentar"})]}),!$&&!h&&q.length===0&&r.jsxs("div",{className:"flex h-40 flex-col items-center justify-center gap-2 text-sm text-text-secondary",children:[r.jsx(Y,{className:"mb-2 h-8 w-8 opacity-50"}),r.jsx("p",{children:P("com_ui_no_reports")})]}),!$&&q.map(b=>r.jsxs("div",{className:"group relative",children:[r.jsx("button",{onClick:()=>{g(b.conversationId),U()},className:"w-full rounded-2xl border border-transparent bg-surface-primary p-4 pr-10 text-left shadow-sm transition-colors hover:border-black/5 hover:bg-surface-secondary",children:r.jsxs("div",{className:"flex items-start gap-4",children:[r.jsx("div",{className:"mt-0.5 rounded-xl border border-border-light bg-surface-tertiary p-2 text-[#0d9488] shadow-sm",children:r.jsx(Y,{className:"h-5 w-5",strokeWidth:1.5})}),r.jsxs("div",{className:"min-w-0 flex-1",children:[r.jsx("h3",{className:"truncate text-[15px] font-bold tracking-tight text-text-primary",children:b.title||P("com_ui_untitled_report")}),r.jsx("p",{className:"mt-1 text-[13px] font-medium text-text-secondary",children:new Date(b.updatedAt).toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"})})]})]})}),r.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",children:r.jsx(Ee,{title:b.title||P("com_ui_report"),isPro:O,onRename:async z=>{try{x&&x.includes("/canvas/")&&await F.post(`/api/sgsst/canvas/${b.conversationId}/rename`,{title:z}),await F.post("/api/convos/update",{arg:{conversationId:b.conversationId,title:z}}),v()}catch(R){console.error(R)}},onDelete:async()=>{try{x&&x.includes("/canvas/")&&await F.delete(`/api/sgsst/canvas/${b.conversationId}`);const I=((await F.get(`/api/convos/${b.conversationId}`)).data.tags||[]).filter(H=>!S.includes(H));await F.post("/api/convos/update",{arg:{conversationId:b.conversationId,tags:I}}),v()}catch(z){console.error(z)}}})})]},b.conversationId))]}),r.jsx("div",{className:"from-surface-secondary/50 h-2 bg-gradient-to-t to-transparent"})]})]}),document.body):null},He=({content:g,fileName:k,reportType:U="general",onExportExcel:L,onDownloadTemplate:S,onlyExcel:x})=>{const[M,m]=f.useState(!1),[V,O]=f.useState(!1),[P,q]=f.useState({top:0,right:0}),N=f.useRef(null),$=f.useRef(null),{showToast:G}=ye(),{token:h,user:d}=ae(),{conversationId:B,id:v}=Ae(),b=(d==null?void 0:d.role)==="ADMIN"||(d==null?void 0:d.role)==="USER_PRO"||(d==null?void 0:d.role)==="USER_IPEVAR"||(d==null?void 0:d.role)==="IPEVAR"||!!(d!=null&&d.isSubUser),[z,R]=f.useState(!1),[I,H]=f.useState(""),[Z,W]=f.useState(""),J=async l=>{var o,n;if(!d||d.role!=="USER"){l();return}try{await F.post("/api/files/register-download",{},{headers:{Authorization:`Bearer ${h}`}}),l()}catch(c){console.error("Download limit check failed:",c);const D=d.role==="USER_IPEVAR"||d.role==="IPEVAR",j=((n=(o=c.response)==null?void 0:o.data)==null?void 0:n.message)||(D?"Has alcanzado tu límite de 6 descargas diarias en el plan Wappy Vital. Adquiere el plan Wappy Pro para realizar descargas ilimitadas.":"Has alcanzado tu límite de 1 descarga diaria en el plan Gratis. Adquiere el plan Wappy Vital para realizar descargas ilimitadas.");H("Límite de Descargas Excedido"),W(j),R(!0),m(!1)}},T=()=>{if(N.current){const l=N.current.getBoundingClientRect();q({top:l.bottom+8,right:window.innerWidth-l.right})}};if(f.useEffect(()=>{if(!M)return;const l=c=>{var j,w;const D=c.target;!((j=N.current)!=null&&j.contains(D))&&!((w=$.current)!=null&&w.contains(D))&&m(!1)},o=()=>T(),n=()=>T();return document.addEventListener("mousedown",l),window.addEventListener("scroll",o,!0),window.addEventListener("resize",n),()=>{document.removeEventListener("mousedown",l),window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",n)}},[M]),x&&L&&!S)return r.jsxs(r.Fragment,{children:[r.jsxs("button",{onClick:l=>{if(l.preventDefault(),l.stopPropagation(),!b){H("Exportación Premium Bloqueada"),W("La exportación de matrices a Excel está reservada exclusivamente para cuentas PREMIUM del Plan Pro."),R(!0);return}L()},className:"group flex h-7 min-w-[28px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2 text-green-700 dark:text-green-300 shadow-xs outline-none transition-all duration-300 ease-in-out hover:bg-green-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:min-w-[32px] sm:px-2.5",children:[r.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:r.jsx(Q,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),r.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:r.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Exportar Excel"})})]}),z&&r.jsx("div",{className:"fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:r.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[r.jsx("button",{onClick:()=>R(!1),className:"absolute -top-10 right-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300 z-50",children:"Cerrar ✕"}),r.jsx(oe,{title:I,description:Z,plan:(d==null?void 0:d.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]});const A=()=>g.trim().toLowerCase().startsWith("<!doctype")||g.trim().toLowerCase().startsWith("<html")?g:`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${k}</title>
    <style>
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
        }
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
            .report-wrapper { padding: 0 !important; max-width: 100% !important; width: 100% !important; border: none !important; box-shadow: none !important; }
            .report-container { max-width: 100% !important; width: 100% !important; box-shadow: none !important; }
            @page { margin: 1cm; size: A4 portrait; }
            .table-responsive {
                overflow: visible !important;
                width: 100% !important;
                border: none !important;
                margin: 10px 0 !important;
            }
            table {
                page-break-inside: auto !important;
                table-layout: fixed !important;
                width: 100% !important;
                min-width: 0 !important;
                font-size: 7.5pt !important;
            }
            tr { page-break-inside: avoid !important; }
            th, td {
                white-space: normal !important;
                word-break: break-word !important;
                overflow-wrap: break-word !important;
                padding: 4px 4px !important;
                font-size: 7.5pt !important;
            }
            h1, h2, h3, h4 { page-break-after: avoid; }
        }
        html, body {
            margin: 0;
            padding: 0;
            background: #fff !important;
            color: #222;
        }
        body {
            font-family: 'Segoe UI', Arial, Roboto, sans-serif;
            line-height: 1.6;
            min-height: 100vh;
        }
        .report-wrapper {
            max-width: 950px;
            margin: 0 auto;
            padding: 40px 30px;
            background: #fff;
            box-sizing: border-box;
        }
        @media screen and (max-width: 600px) {
            .report-wrapper { padding: 15px 10px; }
        }
        h1 { color: #004d99; text-align: center; margin-bottom: 8px; font-size: 1.65em; font-weight: 800; border-bottom: 2px solid #004d99; padding-bottom: 6px; }
        h2 { color: #004d99; border-bottom: 2px solid #004d99; padding-bottom: 4px; font-size: 1.3em; font-weight: 700; margin-top: 18px; margin-bottom: 8px; }
        h3 { color: #0c4a6e; font-size: 1.1em; font-weight: 700; margin-top: 14px; margin-bottom: 6px; }
        h3:not([style]) { border-left: 3px solid #004d99; padding-left: 9px; }
        h4 { color: #1e3a5f; font-size: 1em; font-weight: 700; margin-top: 10px; margin-bottom: 4px; }
        ul { list-style-type: disc; padding-left: 1.5rem; margin: 6px 0 10px 0; }
        ol { list-style-type: decimal; padding-left: 1.5rem; margin: 6px 0 10px 0; }
        li { margin-bottom: 4px; line-height: 1.55; }
        table {
            width: 100%;
            border-collapse: collapse;
            border-spacing: 0;
            margin: 15px 0;
            font-size: 0.85em;
            table-layout: fixed;
        }
        .table-responsive {
            width: 100%;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #ddd;
            margin: 15px 0;
            -webkit-overflow-scrolling: touch;
        }
        th {
            background-color: #004d99;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #003580;
            word-break: break-word;
            overflow-wrap: break-word;
        }
        .checklist-mode th:nth-child(1) { width: 38px; }
        .checklist-mode th:nth-child(2) { width: 14%; }
        .checklist-mode th:nth-child(3) { width: 44%; }
        .checklist-mode th:nth-child(4) { width: 10%; }
        .checklist-mode th:nth-child(5) { width: 15%; }
        td {
            padding: 8px 6px;
            border: 1px solid #ddd;
            vertical-align: top;
            word-break: break-word;
            overflow-wrap: break-word;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
    </style>
</head>
<body class="${U==="checklist"?"checklist-mode":""}">
    <div class="report-wrapper">
        ${g.includes("table-responsive")?g:g.replace(/<table/g,'<div class="table-responsive"><table').replace(/<\/table>/g,"</table></div>")}
    </div>
</body>
</html>`,le=()=>{const l={"bg-teal-900":{"background-color":"#115e59"},"bg-teal-800":{"background-color":"#115e59"},"bg-teal-700":{"background-color":"#0f766e"},"bg-teal-600":{"background-color":"#0d9488"},"bg-teal-500":{"background-color":"#14b8a6"},"bg-teal-100":{"background-color":"#ccfbf1"},"bg-teal-50":{"background-color":"#f0fdfa"},"bg-slate-900":{"background-color":"#0f172a"},"bg-slate-800":{"background-color":"#1e293b"},"bg-slate-100":{"background-color":"#f1f5f9"},"bg-slate-50":{"background-color":"#f8fafc"},"bg-emerald-700":{"background-color":"#047857"},"bg-emerald-600":{"background-color":"#059669"},"bg-emerald-500":{"background-color":"#10b981"},"bg-emerald-100":{"background-color":"#d1fae5"},"bg-emerald-50":{"background-color":"#ecfdf5"},"bg-amber-700":{"background-color":"#b45309"},"bg-amber-600":{"background-color":"#d97706"},"bg-amber-500":{"background-color":"#f59e0b"},"bg-amber-100":{"background-color":"#fef3c7"},"bg-amber-50":{"background-color":"#fffbeb"},"bg-red-700":{"background-color":"#b91c1c"},"bg-red-600":{"background-color":"#dc2626"},"bg-red-500":{"background-color":"#ef4444"},"bg-red-100":{"background-color":"#fee2e2"},"bg-red-50":{"background-color":"#fef2f2"},"bg-gray-100":{"background-color":"#f3f4f6"},"bg-gray-50":{"background-color":"#f9fafb"},"bg-zinc-100":{"background-color":"#f4f4f5"},"bg-zinc-50":{"background-color":"#fafafa"},"text-white":{color:"#ffffff"},"text-teal-900":{color:"#115e59"},"text-teal-800":{color:"#115e59"},"text-teal-700":{color:"#0f766e"},"text-teal-600":{color:"#0d9488"},"text-teal-505":{color:"#14b8a6"},"text-slate-900":{color:"#0f172a"},"text-slate-800":{color:"#1e293b"},"text-slate-700":{color:"#334155"},"text-slate-600":{color:"#475569"},"text-emerald-800":{color:"#065f46"},"text-emerald-700":{color:"#047857"},"text-emerald-600":{color:"#059669"},"text-amber-800":{color:"#92400e"},"text-amber-700":{color:"#b45309"},"text-amber-600":{color:"#d97706"},"text-red-800":{color:"#991b1b"},"text-red-700":{color:"#b91c1c"},"text-red-600":{color:"#dc2626"},"text-gray-900":{color:"#111827"},"text-gray-800":{color:"#1f2937"},"text-gray-700":{color:"#374151"},"text-gray-600":{color:"#4b5563"},"font-bold":{"font-weight":"bold"},"font-semibold":{"font-weight":"600"},"font-medium":{"font-weight":"500"},"text-center":{"text-align":"center"},"text-right":{"text-align":"right"},"text-left":{"text-align":"left"},"border-teal-700":{"border-color":"#0f766e"},"border-teal-600":{"border-color":"#0d9488"},"border-teal-500":{"border-color":"#14b8a6"},"border-slate-300":{"border-color":"#cbd5e1"},"border-slate-200":{"border-color":"#e2e8f0"},"border-gray-300":{"border-color":"#d1d5db"},"border-gray-200":{"border-color":"#e5e7eb"}},o=t=>{const e={};return t.split(";").forEach(a=>{const s=a.indexOf(":");if(s===-1)return;const i=a.slice(0,s).trim().toLowerCase(),u=a.slice(s+1).trim();i&&u&&(e[i]=u)}),e},n=t=>Object.entries(t).map(([e,a])=>`${e}:${a}`).join(";"),c=(t,e)=>({...t,...e}),D=new DOMParser,j=g.trim().toLowerCase().startsWith("<!doctype")||g.trim().toLowerCase().startsWith("<html"),w=D.parseFromString(j?g:`<div>${g}</div>`,"text/html"),p=j?w.body||w.documentElement:w.body.firstElementChild,te=t=>{var s;const e=((s=t.getAttribute("class"))==null?void 0:s.split(/\s+/))||[];let a=o(t.getAttribute("style")||"");e.forEach(i=>{const u=l[i];u&&(a={...a,...u})}),Object.keys(a).length>0&&t.setAttribute("style",n(a)),Array.from(t.children).forEach(i=>te(i))};p.querySelectorAll(".no-print").forEach(t=>t.remove()),p.querySelectorAll(".wappy-standard-header-banner").forEach(t=>{const e=w.createElement("table");e.setAttribute("width","100%"),e.setAttribute("cellspacing","0"),e.setAttribute("cellpadding","12"),e.setAttribute("bgcolor","#0f766e"),e.setAttribute("style","width:100%;border-collapse:collapse;background-color:#0f766e;border:none;margin-bottom:14pt;");const a=w.createElement("tr");Array.from(t.children).forEach((i,u)=>{const E=w.createElement("td");E.setAttribute("bgcolor","#0f766e");const y=u===0?"12%":u===1?"68%":"20%",C=u===2?"right":"left";E.setAttribute("width",y),E.setAttribute("style",`width:${y};background-color:#0f766e;vertical-align:middle;text-align:${C};border:none;padding:10pt;`),E.innerHTML=i.innerHTML,a.appendChild(E)}),e.appendChild(a),t.replaceWith(e)}),p.querySelectorAll("div").forEach(t=>{if(!t.isConnected)return;const e=o(t.getAttribute("style")||"");if(e.display==="grid"&&t.children.length>=2&&t.children.length<=6){const a=t.children.length,s=Math.floor(100/a),i=w.createElement("table");i.setAttribute("width","100%"),i.setAttribute("cellspacing","4"),i.setAttribute("cellpadding","8"),i.setAttribute("style","width:100%;border-collapse:separate;margin-bottom:10pt;border:none;");const u=w.createElement("tr");Array.from(t.children).forEach(E=>{const y=o(E.getAttribute("style")||""),C=w.createElement("td");C.setAttribute("width",`${s}%`);const _=y["background-color"]||y.background;_&&!_.includes("gradient")&&(C.setAttribute("bgcolor",_),y["background-color"]=_),C.setAttribute("style",n({...y,width:`${s}%`,"vertical-align":"top"})),C.innerHTML=E.innerHTML,u.appendChild(C)}),i.appendChild(u),t.replaceWith(i)}else if(e.display==="flex"&&t.children.length===2){const a=t.children[0],s=t.children[1];if(o(s.getAttribute("style")||""),s.children.length===1){const i=s.children[0],u=o(i.getAttribute("style")||""),E=(u.width||"").match(/(\d+(?:\.\d+)?)%/),y=u["background-color"]||u.background||"#0d9488";if(E){const C=Math.max(8,Math.min(100,Math.round(parseFloat(E[1])))),_=Math.max(0,100-C),X=w.createElement("table");X.setAttribute("width","100%"),X.setAttribute("cellspacing","0"),X.setAttribute("cellpadding","0"),X.setAttribute("style","width:100%;border-collapse:collapse;margin-bottom:4pt;border:none;"),X.innerHTML=`<tr>
              <td width="38%" style="width:38%;font-size:9pt;color:#475569;font-weight:bold;text-align:right;padding:2pt 8pt 2pt 0;border:none;vertical-align:middle;">${a.innerHTML}</td>
              <td width="62%" style="width:62%;padding:2pt 0;border:none;vertical-align:middle;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;">
                  <tr>
                    <td width="${C}%" bgcolor="${y}" style="width:${C}%;background-color:${y};height:14pt;text-align:right;padding:0 5pt;color:#ffffff;font-size:8pt;font-weight:bold;border:none;vertical-align:middle;">${i.innerHTML}</td>
                    ${_>0?`<td width="${_}%" bgcolor="#f1f5f9" style="width:${_}%;background-color:#f1f5f9;height:14pt;border:none;font-size:1pt;">&nbsp;</td>`:""}
                  </tr>
                </table>
              </td>
            </tr>`,t.replaceWith(X);return}}if(e["justify-content"]==="space-between"){const i=w.createElement("table");i.setAttribute("width","100%"),i.setAttribute("cellspacing","0"),i.setAttribute("cellpadding","0");const u=e["border-bottom"]?`border-bottom:${e["border-bottom"]};`:"border:none;";i.setAttribute("style",`width:100%;border-collapse:collapse;margin-bottom:8pt;${u}`),i.innerHTML=`<tr>
            <td width="75%" style="width:75%;text-align:left;vertical-align:middle;border:none;padding:2pt 0;">${a.outerHTML}</td>
            <td width="25%" style="width:25%;text-align:right;vertical-align:middle;border:none;padding:2pt 0;">${s.outerHTML}</td>
          </tr>`,t.replaceWith(i)}}}),te(p),p.querySelectorAll("h1").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({color:"#004d99","text-align":"center","font-size":"22pt","font-weight":"bold",margin:"12pt 0 6pt 0"},e);a["font-family"]="Calibri,Arial,sans-serif",a["mso-style-name"]="Heading1",t.setAttribute("style",n(a))}),p.querySelectorAll("h2").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({color:"#004d99","font-size":"16pt","font-weight":"bold","border-bottom":"2pt solid #004d99","padding-bottom":"4pt",margin:"10pt 0 4pt 0"},e);a["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",n(a))}),p.querySelectorAll("h3").forEach(t=>{const e=o(t.getAttribute("style")||""),a=!!(e.border||e["border-bottom"]||e["border-left"]),s={color:"#0c4a6e","font-size":"13pt","font-weight":"bold",margin:"10pt 0 4pt 0"};a||(s["border-left"]="3pt solid #004d99",s["padding-left"]="6pt");const i=c(s,e);i["font-family"]="Calibri,Arial,sans-serif",i["mso-style-name"]="Heading3",t.setAttribute("style",n(i))}),p.querySelectorAll("h4").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({color:"#1e3a5f","font-size":"11.5pt","font-weight":"bold",margin:"8pt 0 4pt 0"},e);a["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",n(a))}),p.querySelectorAll("ol").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({"list-style-type":"decimal","padding-left":"18pt",margin:"4pt 0 8pt 0"},e);a["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",n(a))}),p.querySelectorAll("ul").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({"list-style-type":"disc","padding-left":"18pt",margin:"4pt 0 8pt 0"},e);a["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",n(a))}),p.querySelectorAll("li").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({"font-family":"Calibri,Arial,sans-serif","font-size":"11pt",margin:"2pt 0","line-height":"1.5"},e);t.setAttribute("style",n(a))}),p.querySelectorAll("p").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({"font-family":"Calibri,Arial,sans-serif","font-size":"11pt",margin:"4pt 0","line-height":"1.5"},e);t.setAttribute("style",n(a))}),p.querySelectorAll("table").forEach(t=>{const e=o(t.getAttribute("style")||""),a=e.border==="none",s={width:"100%","table-layout":"fixed","mso-table-layout-alt":"fixed","border-collapse":e["border-collapse"]==="separate"?"separate":"collapse","font-family":"Calibri,Arial,sans-serif","font-size":"8.5pt"};a||(s.margin=e.margin||"8pt 0",s["mso-border-alt"]="solid #CCCCCC .5pt");const i=c(e,s);delete i["border-radius"],delete i["border-spacing"],delete i["box-shadow"],delete i.overflow,delete i["min-width"],t.setAttribute("style",n(i)),t.setAttribute("border",a?"0":"1"),t.getAttribute("cellspacing")||t.setAttribute("cellspacing","0"),t.getAttribute("cellpadding")||t.setAttribute("cellpadding","0")}),p.querySelectorAll("th").forEach(t=>{const e=o(t.getAttribute("style")||"");e.background&&e.background.includes("gradient")&&!e["background-color"]?e["background-color"]="#0f766e":e.background&&!e.background.includes("gradient")&&!e["background-color"]&&(e["background-color"]=e.background);const s=c({"font-family":"Calibri,Arial,sans-serif","font-weight":"bold","font-size":"8.5pt",padding:"5pt 4pt",border:"1pt solid #CCCCCC","mso-background-source":"auto","mso-pattern":"auto","vertical-align":"middle","text-align":"left","word-break":"break-word"},e);s["font-family"]||(s["font-family"]="Calibri,Arial,sans-serif"),s["background-color"]?(delete s["mso-background-source"],delete s["mso-pattern"],s.background=s["background-color"],t.setAttribute("bgcolor",s["background-color"])):(s["mso-background-source"]||(s["mso-background-source"]="auto"),s["mso-pattern"]||(s["mso-pattern"]="auto")),delete s["border-radius"],delete s["box-shadow"],delete s["white-space"],delete s["min-width"],s["word-break"]="break-word",t.setAttribute("style",n(s))}),p.querySelectorAll("td").forEach(t=>{const e=o(t.getAttribute("style")||"");e.background&&!e.background.includes("gradient")&&!e["background-color"]&&(e["background-color"]=e.background);const s={"font-family":"Calibri,Arial,sans-serif","font-size":"8pt",padding:"4pt 4pt",border:e.border==="none"?"none":"1pt solid #DDDDDD","vertical-align":"top","word-break":"break-word"},i=c(s,e);i["background-color"]&&(delete i["mso-background-source"],delete i["mso-pattern"],i.background=i["background-color"],t.setAttribute("bgcolor",i["background-color"])),delete i["border-radius"],delete i["box-shadow"],delete i.transition,delete i["white-space"],delete i["min-width"],i["word-break"]="break-word",t.setAttribute("style",n(i))}),p.querySelectorAll("tr").forEach(t=>{const e=o(t.getAttribute("style")||"");delete e["border-radius"],delete e["box-shadow"],delete e.transition,Object.keys(e).length>0&&t.setAttribute("style",n(e))}),p.querySelectorAll("li").forEach(t=>{const e=o(t.getAttribute("style")||""),a=c({"font-family":"Calibri,Arial,sans-serif","font-size":"11pt",margin:"2pt 0"},e);t.setAttribute("style",n(a))}),p.querySelectorAll("strong, b").forEach(t=>{const e=o(t.getAttribute("style")||"");e["font-weight"]="bold",t.setAttribute("style",n(e))}),p.querySelectorAll("em, i").forEach(t=>{const e=o(t.getAttribute("style")||"");e["font-style"]="italic",t.setAttribute("style",n(e))}),p.querySelectorAll("div").forEach(t=>{const e=o(t.getAttribute("style")||"");delete e["border-radius"],delete e["box-shadow"],delete e.overflow,delete e.transition,delete e["-webkit-overflow-scrolling"],e["font-family"]||(e["font-family"]="Calibri,Arial,sans-serif"),Object.keys(e).length>0&&t.setAttribute("style",n(e))}),p.querySelectorAll("img").forEach(t=>{const e=o(t.getAttribute("style")||""),a=e["max-height"]||"",s=e["max-width"]||"",u=a&&a!=="none"?parseInt(a,10):null,E=u!==null&&u<=100;if(delete e["max-width"],delete e["max-height"],delete e["object-fit"],delete e["border-radius"],delete e.transition,E)e.width="150pt",e.height="75pt",e.display="block",t.setAttribute("width","150"),t.setAttribute("height","75");else if(s&&s!=="100%"&&s!=="none"){const y=parseInt(s,10);if(!isNaN(y)){const C=Math.round(y*.75);e.width=`${C}pt`,e.height="auto",t.setAttribute("width",String(y))}}else e["max-width"]="460pt",e.width=e.width||"100%";t.setAttribute("style",n(e))});const ce=p.innerHTML;return`<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word 15">
    <meta name="Originator" content="Microsoft Word 15">
    <title>${k}</title>
    <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page WordSection1 {
            size: 21cm 29.7cm;
            margin: 2cm 2.5cm 2cm 2.5cm;
            mso-header-margin: 1cm;
            mso-footer-margin: 1cm;
            mso-paper-source: 0;
        }
        body {
            font-family: Calibri, Arial, sans-serif;
            font-size: 11pt;
            color: #222222;
            line-height: 1.5;
            background: #ffffff;
        }
        div.WordSection1 { page: WordSection1; }
        /* Fallback table styles for Word */
        table { border-collapse: collapse !important; width: 100% !important; }
    </style>
</head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#222222;background:#ffffff;">
    <div style="max-width:100%;padding:0;margin:0;" class="WordSection1">
        ${ce}
    </div>
</body>
</html>`},ne=()=>{if(b)return!0;const l=`wappy_html_export_count_${B||v||"global"}`,o=parseInt(ke(l)||"0",10);return o>=3?!1:(ve(l,String(o+1)),!0)},K=x?[]:[{label:"Abrir en Navegador (HTML)",icon:he,handler:async()=>{if(!ne()){H("Límite de Previsualización"),W("Has abierto la vista web de este documento 3 veces en este chat (límite del Plan Gratuito). Pásate a Pro para tener accesos ilimitados."),R(!0),m(!1);return}O(!0);try{const l=A(),o=await F.post("/api/public-report",{content:l,fileName:k,reportType:U},{headers:{Authorization:`Bearer ${h}`}}),{id:n}=o.data,c=`${window.location.origin}/report/${n}`;window.open(c,"_blank"),m(!1)}catch(l){console.error("Error sharing report:",l);const o=A(),n=new Blob([o],{type:"text/html;charset=utf-8"}),c=URL.createObjectURL(n);window.open(c,"_blank"),setTimeout(()=>URL.revokeObjectURL(c),1e4),G({status:"error",message:"No se pudo generar el link compartido, se abrió una vista temporal."})}finally{O(!1)}},description:"Vista completa con estilos",disabled:!g},{label:"Descargar HTML (.html)",icon:re,handler:()=>{const l=A(),o=new Blob([l],{type:"text/html;charset=utf-8"}),n=URL.createObjectURL(o),c=document.createElement("a");c.href=n,c.download=`${k}.html`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(n),m(!1)},description:"Archivo HTML independiente",disabled:!g},{label:"Descargar Word (.doc)",icon:Y,handler:()=>{const l=le(),o="----=_NextPart_000_0000_01D00000.00000000",n=["MIME-Version: 1.0",`Content-Type: multipart/related; type="text/html"; boundary="${o}"`,"",`--${o}`,'Content-Type: text/html; charset="utf-8"',"Content-Transfer-Encoding: 8bit","Content-Location: file:///document.htm","",l,"",`--${o}--`].join(`\r
`),c=new Blob([n],{type:"application/msword"}),D=URL.createObjectURL(c),j=document.createElement("a");j.href=D,j.download=`${k}.doc`,document.body.appendChild(j),j.click(),document.body.removeChild(j),URL.revokeObjectURL(D),m(!1)},description:"Editable con tablas y formato",disabled:!g},{label:"Descargar PDF",icon:re,handler:()=>{const l=A(),o=window.open("","_blank");if(o){o.document.open(),o.document.write(l),o.document.close();const n=()=>{setTimeout(()=>{try{o.focus(),o.print()}catch(c){console.warn("Print failed:",c)}},600)};o.document.readyState==="complete"?n():(o.onload=n,setTimeout(n,2e3))}m(!1)},description:"Imprimir / guardar como PDF",disabled:!g}];L&&K.unshift({label:"Exportar Registros a Excel (.xlsx)",icon:Y,handler:()=>{L(),m(!1)},description:"Datos crudos de la tabla en Excel",disabled:!1,premium:!1}),S&&K.unshift({label:"Descargar Formato / Plantilla (.xlsx)",icon:Q,handler:()=>{S(),m(!1)},description:"Plantilla oficial vacía para diligenciar",disabled:!1,premium:!1});const de=M?r.jsx("div",{ref:$,style:{position:"fixed",top:P.top,right:P.right,zIndex:9999999},className:"w-64 overflow-hidden rounded-xl border border-border-medium bg-surface-primary shadow-xl duration-200 animate-in fade-in slide-in-from-top-2",children:r.jsx("div",{className:"p-1",children:K.map(l=>{const o=l.icon,n=!b&&l.premium;return r.jsx("button",{onClick:c=>{if(c.preventDefault(),c.stopPropagation(),n){H("Exportación Premium Bloqueada"),W(`La exportación en este formato (${l.label.split("(")[0].trim()}) está reservada exclusivamente para cuentas PREMIUM del Plan Pro.`),R(!0),m(!1);return}l.label.toLowerCase().includes("descargar")||l.label.toLowerCase().includes("exportar")?J(l.handler):l.handler()},disabled:l.disabled,className:ie("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",l.disabled?"cursor-not-allowed opacity-40":"hover:bg-surface-hover"),children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"rounded-xl bg-teal-100 p-1.5 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",children:r.jsx(o,{className:"h-4 w-4"})}),r.jsxs("div",{children:[r.jsx("div",{className:"text-sm font-medium text-text-primary",children:l.label}),r.jsx("div",{className:"text-xs text-text-secondary",children:l.description})]})]})},l.label)})})}):null;return r.jsxs(r.Fragment,{children:[r.jsxs("button",{ref:N,onClick:()=>{T(),m(l=>!l)},className:"group flex h-9 min-w-[36px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2.5 text-green-700 dark:text-green-300 shadow-xs outline-none transition-all duration-300 ease-in-out hover:bg-green-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-3",children:[r.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:r.jsx(Q,{className:"h-4 w-4"})}),r.jsxs("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100",children:[r.jsx("span",{className:"mr-1 text-sm font-bold tracking-wide",children:"Exportar"}),r.jsx(xe,{className:`h-3.5 w-3.5 text-green-600 dark:text-green-400 transition-transform duration-200 ${M?"rotate-180":""}`})]})]}),ee.createPortal(de,document.body),z&&r.jsx("div",{className:"fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:r.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[r.jsx("button",{onClick:()=>R(!1),className:"absolute -top-10 right-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300 z-50",children:"Cerrar ✕"}),r.jsx(oe,{title:I,description:Z,plan:(d==null?void 0:d.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]})};export{He as E,Ie as R};
