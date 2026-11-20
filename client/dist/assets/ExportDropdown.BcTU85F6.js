import{r as p,c as ee,j as r}from"./react-core.DnLkJYlj.js";import{gg as be,ch as me,dL as ue,cA as Y,ht as pe,c$ as fe,dn as ge,dD as Q,d6 as he,fJ as re,cy as xe}from"./vendor.CzLQ0fq0.js";import{o as ae,u as we,c as se,_ as ie,a0 as ye,U as oe,aU as ke,aT as ve}from"./index.wp1___57.js";import"./utilities.CCKZG3yh.js";import{a as B}from"./http-client.CBcqubEr.js";import{f as Ae}from"./routing.CpqY7sNF.js";const je=1e8,Ee=({title:f,onRename:k,onDelete:U,isPro:z})=>{const[P,x]=p.useState(!1),[M,b]=p.useState({}),[V,O]=p.useState(!1),S=p.useRef(null),q=p.useRef(null),N=()=>{if(!S.current)return;const g=S.current.getBoundingClientRect();b({position:"fixed",top:g.bottom+4,right:window.innerWidth-g.right,zIndex:je})};p.useEffect(()=>{if(!P)return;const g=n=>{var v,m;const F=n.target;!((v=S.current)!=null&&v.contains(F))&&!((m=q.current)!=null&&m.contains(F))&&x(!1)};return document.addEventListener("mousedown",g),()=>document.removeEventListener("mousedown",g)},[P]);const $=async g=>{if(g.stopPropagation(),x(!1),z===!1){alert("La opción de eliminar reportes es exclusiva del Plan Pro. Para generar múltiples reportes, adquiere Premium.");return}window.confirm(`¿Eliminar "${f}" del historial?
Esta acción no borra la conversación.`)&&(O(!0),await U(),O(!1))},G=P?r.jsxs("div",{ref:q,style:M,className:"w-36 rounded-lg border border-gray-200 bg-surface-primary py-1 shadow-xl dark:border-gray-700",children:[r.jsxs("button",{onClick:g=>{g.stopPropagation();const n=prompt("Nuevo nombre:",f);n&&n!==f&&k(n),x(!1)},className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-hover",children:[r.jsx(fe,{className:"h-3 w-3"})," Renombrar"]}),r.jsxs("button",{onClick:$,disabled:V,className:"flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20",children:[V?r.jsx(ie,{className:"h-3 w-3"}):r.jsx(ge,{className:"h-3 w-3"})," Eliminar"]})]}):null;return r.jsxs(r.Fragment,{children:[r.jsx("button",{ref:S,onClick:g=>{g.stopPropagation(),N(),x(n=>!n)},className:"rounded-full p-1 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",children:r.jsx(pe,{className:"h-4 w-4 text-text-secondary"})}),ee.createPortal(G,document.body)]})},Ie=({onSelectReport:f,isOpen:k,toggleOpen:U,refreshTrigger:z,tags:P=["report"],historyEndpoint:x})=>{const{isAuthenticated:M,user:b,token:V}=ae(),O=(b==null?void 0:b.role)==="ADMIN"||(b==null?void 0:b.role)==="USER_PRO"||(b==null?void 0:b.role)==="USER_IPEVAR"||(b==null?void 0:b.role)==="IPEVAR",S=we(),[q,N]=p.useState([]),[$,G]=p.useState(!1),[g,n]=p.useState(null),F=Array.isArray(P)&&P.length>0?P.join(","):"report",v=p.useCallback(async()=>{const m=V||localStorage.getItem("token");if(!M&&!m)return;G(!0),n(null);const R=new AbortController,L=setTimeout(()=>R.abort(),1e4);try{const H=F.split(",").filter(Boolean).map(T=>`tags=${encodeURIComponent(T)}`).join("&");let Z=x||"/api/sgsst/diagnostico/report-history";H&&(Z+=`${Z.includes("?")?"&":"?"}${H}`);const W=await fetch(Z,{headers:m?{Authorization:`Bearer ${m}`}:{},cache:"no-store",signal:R.signal});if(!W.ok){let T="Error al cargar el historial";try{const A=await W.json();A!=null&&A.details?T=A.details:A!=null&&A.error&&(T=A.error)}catch{}n(T),N([]);return}const J=await W.json();N(J.conversations||[])}catch(I){(I==null?void 0:I.name)==="AbortError"?n("La consulta tardó demasiado. Pulsa Actualizar para reintentar."):n("Error de red al cargar el historial"),N([])}finally{clearTimeout(L),G(!1)}},[M,V,F,x]);return p.useEffect(()=>{k?v():(N([]),n(null))},[k,v]),p.useEffect(()=>{if(z&&z>0&&k){const m=setTimeout(v,600);return()=>clearTimeout(m)}},[z,k,v]),k?ee.createPortal(r.jsxs("div",{className:"fixed inset-0 z-[9999999] flex items-center justify-center p-4 sm:p-6",children:[r.jsx("div",{className:"absolute inset-0 bg-black/40 backdrop-blur-sm",onClick:U}),r.jsxs("div",{className:"relative flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-surface-primary shadow-2xl duration-200 animate-in fade-in zoom-in-95",children:[r.jsxs("div",{className:"bg-surface-secondary/30 flex items-center justify-between border-b border-border-light px-6 py-5",children:[r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"rounded-[14px] bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-900/30",children:r.jsx(be,{className:"h-5 w-5"})}),r.jsxs("div",{children:[r.jsx("h2",{className:"text-xl font-bold tracking-tight text-text-primary",children:S("com_ui_history")}),r.jsx("p",{className:"mt-0.5 text-xs font-medium text-text-secondary",children:"Historial de reportes de esta empresa"})]})]}),r.jsxs("div",{className:"flex flex-col items-end gap-2",children:[r.jsx("button",{onClick:U,className:"rounded-full p-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10",children:r.jsx(me,{className:"h-5 w-5 text-text-secondary"})}),r.jsxs("button",{onClick:v,className:"flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-secondary hover:text-blue-600",children:[r.jsx(ue,{className:se("h-3.5 w-3.5",$&&"animate-spin")}),"Actualizar"]})]})]}),r.jsxs("div",{className:"max-h-[60vh] flex-1 space-y-3 overflow-y-auto p-4",children:[$&&r.jsx("div",{className:"flex justify-center p-8",children:r.jsx(ie,{})}),!$&&g&&r.jsxs("div",{className:"flex h-32 flex-col items-center justify-center gap-2 text-sm text-red-500",children:[r.jsx("p",{children:g}),r.jsx("button",{onClick:v,className:"text-xs underline",children:"Reintentar"})]}),!$&&!g&&q.length===0&&r.jsxs("div",{className:"flex h-40 flex-col items-center justify-center gap-2 text-sm text-text-secondary",children:[r.jsx(Y,{className:"mb-2 h-8 w-8 opacity-50"}),r.jsx("p",{children:S("com_ui_no_reports")})]}),!$&&q.map(m=>r.jsxs("div",{className:"group relative",children:[r.jsx("button",{onClick:()=>{f(m.conversationId),U()},className:"w-full rounded-2xl border border-transparent bg-surface-primary p-4 pr-10 text-left shadow-sm transition-colors hover:border-black/5 hover:bg-surface-secondary",children:r.jsxs("div",{className:"flex items-start gap-4",children:[r.jsx("div",{className:"mt-0.5 rounded-xl border border-border-light bg-surface-tertiary p-2 text-[#0d9488] shadow-sm",children:r.jsx(Y,{className:"h-5 w-5",strokeWidth:1.5})}),r.jsxs("div",{className:"min-w-0 flex-1",children:[r.jsx("h3",{className:"truncate text-[15px] font-bold tracking-tight text-text-primary",children:m.title||S("com_ui_untitled_report")}),r.jsx("p",{className:"mt-1 text-[13px] font-medium text-text-secondary",children:new Date(m.updatedAt).toLocaleString(void 0,{dateStyle:"medium",timeStyle:"short"})})]})]})}),r.jsx("div",{className:"absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100",children:r.jsx(Ee,{title:m.title||S("com_ui_report"),isPro:O,onRename:async R=>{try{x&&x.includes("/canvas/")&&await B.post(`/api/sgsst/canvas/${m.conversationId}/rename`,{title:R}),await B.post("/api/convos/update",{arg:{conversationId:m.conversationId,title:R}}),v()}catch(L){console.error(L)}},onDelete:async()=>{try{x&&x.includes("/canvas/")&&await B.delete(`/api/sgsst/canvas/${m.conversationId}`);const I=((await B.get(`/api/convos/${m.conversationId}`)).data.tags||[]).filter(H=>!P.includes(H));await B.post("/api/convos/update",{arg:{conversationId:m.conversationId,tags:I}}),v()}catch(R){console.error(R)}}})})]},m.conversationId))]}),r.jsx("div",{className:"from-surface-secondary/50 h-2 bg-gradient-to-t to-transparent"})]})]}),document.body):null},He=({content:f,fileName:k,reportType:U="general",onExportExcel:z,onDownloadTemplate:P,onlyExcel:x})=>{const[M,b]=p.useState(!1),[V,O]=p.useState(!1),[S,q]=p.useState({top:0,right:0}),N=p.useRef(null),$=p.useRef(null),{showToast:G}=ye(),{token:g,user:n}=ae(),{conversationId:F,id:v}=Ae(),m=(n==null?void 0:n.role)==="ADMIN"||(n==null?void 0:n.role)==="USER_PRO"||(n==null?void 0:n.role)==="USER_IPEVAR"||(n==null?void 0:n.role)==="IPEVAR"||!!(n!=null&&n.isSubUser),[R,L]=p.useState(!1),[I,H]=p.useState(""),[Z,W]=p.useState(""),J=async i=>{var o,c;if(!n||n.role!=="USER"){i();return}try{await B.post("/api/files/register-download",{},{headers:{Authorization:`Bearer ${g}`}}),i()}catch(d){console.error("Download limit check failed:",d);const D=n.role==="USER_IPEVAR"||n.role==="IPEVAR",j=((c=(o=d.response)==null?void 0:o.data)==null?void 0:c.message)||(D?"Has alcanzado tu límite de 6 descargas diarias en el plan Wappy Vital. Adquiere el plan Wappy Pro para realizar descargas ilimitadas.":"Has alcanzado tu límite de 1 descarga diaria en el plan Gratis. Adquiere el plan Wappy Vital para realizar descargas ilimitadas.");H("Límite de Descargas Excedido"),W(j),L(!0),b(!1)}},T=()=>{if(N.current){const i=N.current.getBoundingClientRect();q({top:i.bottom+8,right:window.innerWidth-i.right})}};if(p.useEffect(()=>{if(!M)return;const i=d=>{var j,w;const D=d.target;!((j=N.current)!=null&&j.contains(D))&&!((w=$.current)!=null&&w.contains(D))&&b(!1)},o=()=>T(),c=()=>T();return document.addEventListener("mousedown",i),window.addEventListener("scroll",o,!0),window.addEventListener("resize",c),()=>{document.removeEventListener("mousedown",i),window.removeEventListener("scroll",o,!0),window.removeEventListener("resize",c)}},[M]),x&&z&&!P)return r.jsxs(r.Fragment,{children:[r.jsxs("button",{onClick:i=>{if(i.preventDefault(),i.stopPropagation(),!m){H("Exportación Premium Bloqueada"),W("La exportación de matrices a Excel está reservada exclusivamente para cuentas PREMIUM del Plan Pro."),L(!0);return}z()},className:"group flex h-7 min-w-[28px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2 text-green-700 dark:text-green-300 shadow-xs outline-none transition-all duration-300 ease-in-out hover:bg-green-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:min-w-[32px] sm:px-2.5",children:[r.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:r.jsx(Q,{className:"h-3.5 w-3.5 sm:h-4 sm:w-4"})}),r.jsx("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1.5 group-hover:max-w-[200px] group-hover:opacity-100",children:r.jsx("span",{className:"text-xs font-bold tracking-wide",children:"Exportar Excel"})})]}),R&&r.jsx("div",{className:"fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:r.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[r.jsx("button",{onClick:()=>L(!1),className:"absolute -top-10 right-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300 z-50",children:"Cerrar ✕"}),r.jsx(oe,{title:I,description:Z,plan:(n==null?void 0:n.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]});const A=()=>f.trim().toLowerCase().startsWith("<!doctype")||f.trim().toLowerCase().startsWith("<html")?f:`<!DOCTYPE html>
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
            h1, h2, h3 { page-break-after: avoid; }
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
        h1 { color: #004d99; text-align: center; margin-bottom: 5px; font-size: 1.8em; }
        h2 { color: #004d99; border-bottom: 2px solid #004d99; padding-bottom: 5px; font-size: 1.4em; }
        h3 { color: #333; font-size: 1.2em; }
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
        ${f.includes("table-responsive")?f:f.replace(/<table/g,'<div class="table-responsive"><table').replace(/<\/table>/g,"</table></div>")}
    </div>
</body>
</html>`,le=()=>{const i={"bg-teal-900":{"background-color":"#115e59"},"bg-teal-800":{"background-color":"#115e59"},"bg-teal-700":{"background-color":"#0f766e"},"bg-teal-600":{"background-color":"#0d9488"},"bg-teal-500":{"background-color":"#14b8a6"},"bg-teal-100":{"background-color":"#ccfbf1"},"bg-teal-50":{"background-color":"#f0fdfa"},"bg-slate-900":{"background-color":"#0f172a"},"bg-slate-800":{"background-color":"#1e293b"},"bg-slate-100":{"background-color":"#f1f5f9"},"bg-slate-50":{"background-color":"#f8fafc"},"bg-emerald-700":{"background-color":"#047857"},"bg-emerald-600":{"background-color":"#059669"},"bg-emerald-500":{"background-color":"#10b981"},"bg-emerald-100":{"background-color":"#d1fae5"},"bg-emerald-50":{"background-color":"#ecfdf5"},"bg-amber-700":{"background-color":"#b45309"},"bg-amber-600":{"background-color":"#d97706"},"bg-amber-500":{"background-color":"#f59e0b"},"bg-amber-100":{"background-color":"#fef3c7"},"bg-amber-50":{"background-color":"#fffbeb"},"bg-red-700":{"background-color":"#b91c1c"},"bg-red-600":{"background-color":"#dc2626"},"bg-red-500":{"background-color":"#ef4444"},"bg-red-100":{"background-color":"#fee2e2"},"bg-red-50":{"background-color":"#fef2f2"},"bg-gray-100":{"background-color":"#f3f4f6"},"bg-gray-50":{"background-color":"#f9fafb"},"bg-zinc-100":{"background-color":"#f4f4f5"},"bg-zinc-50":{"background-color":"#fafafa"},"text-white":{color:"#ffffff"},"text-teal-900":{color:"#115e59"},"text-teal-800":{color:"#115e59"},"text-teal-700":{color:"#0f766e"},"text-teal-600":{color:"#0d9488"},"text-teal-505":{color:"#14b8a6"},"text-slate-900":{color:"#0f172a"},"text-slate-800":{color:"#1e293b"},"text-slate-700":{color:"#334155"},"text-slate-600":{color:"#475569"},"text-emerald-800":{color:"#065f46"},"text-emerald-700":{color:"#047857"},"text-emerald-600":{color:"#059669"},"text-amber-800":{color:"#92400e"},"text-amber-700":{color:"#b45309"},"text-amber-600":{color:"#d97706"},"text-red-800":{color:"#991b1b"},"text-red-700":{color:"#b91c1c"},"text-red-600":{color:"#dc2626"},"text-gray-900":{color:"#111827"},"text-gray-800":{color:"#1f2937"},"text-gray-700":{color:"#374151"},"text-gray-600":{color:"#4b5563"},"font-bold":{"font-weight":"bold"},"font-semibold":{"font-weight":"600"},"font-medium":{"font-weight":"500"},"text-center":{"text-align":"center"},"text-right":{"text-align":"right"},"text-left":{"text-align":"left"},"border-teal-700":{"border-color":"#0f766e"},"border-teal-600":{"border-color":"#0d9488"},"border-teal-500":{"border-color":"#14b8a6"},"border-slate-300":{"border-color":"#cbd5e1"},"border-slate-200":{"border-color":"#e2e8f0"},"border-gray-300":{"border-color":"#d1d5db"},"border-gray-200":{"border-color":"#e5e7eb"}},o=t=>{const e={};return t.split(";").forEach(l=>{const s=l.indexOf(":");if(s===-1)return;const a=l.slice(0,s).trim().toLowerCase(),u=l.slice(s+1).trim();a&&u&&(e[a]=u)}),e},c=t=>Object.entries(t).map(([e,l])=>`${e}:${l}`).join(";"),d=(t,e)=>({...t,...e}),D=new DOMParser,j=f.trim().toLowerCase().startsWith("<!doctype")||f.trim().toLowerCase().startsWith("<html"),w=D.parseFromString(j?f:`<div>${f}</div>`,"text/html"),h=j?w.body||w.documentElement:w.body.firstElementChild,te=t=>{var s;const e=((s=t.getAttribute("class"))==null?void 0:s.split(/\s+/))||[];let l=o(t.getAttribute("style")||"");e.forEach(a=>{const u=i[a];u&&(l={...l,...u})}),Object.keys(l).length>0&&t.setAttribute("style",c(l)),Array.from(t.children).forEach(a=>te(a))};h.querySelectorAll(".no-print").forEach(t=>t.remove()),h.querySelectorAll(".wappy-standard-header-banner").forEach(t=>{const e=w.createElement("table");e.setAttribute("width","100%"),e.setAttribute("cellspacing","0"),e.setAttribute("cellpadding","12"),e.setAttribute("bgcolor","#0f766e"),e.setAttribute("style","width:100%;border-collapse:collapse;background-color:#0f766e;border:none;margin-bottom:14pt;");const l=w.createElement("tr");Array.from(t.children).forEach((a,u)=>{const E=w.createElement("td");E.setAttribute("bgcolor","#0f766e");const y=u===0?"12%":u===1?"68%":"20%",C=u===2?"right":"left";E.setAttribute("width",y),E.setAttribute("style",`width:${y};background-color:#0f766e;vertical-align:middle;text-align:${C};border:none;padding:10pt;`),E.innerHTML=a.innerHTML,l.appendChild(E)}),e.appendChild(l),t.replaceWith(e)}),h.querySelectorAll("div").forEach(t=>{if(!t.isConnected)return;const e=o(t.getAttribute("style")||"");if(e.display==="grid"&&t.children.length>=2&&t.children.length<=6){const l=t.children.length,s=Math.floor(100/l),a=w.createElement("table");a.setAttribute("width","100%"),a.setAttribute("cellspacing","4"),a.setAttribute("cellpadding","8"),a.setAttribute("style","width:100%;border-collapse:separate;margin-bottom:10pt;border:none;");const u=w.createElement("tr");Array.from(t.children).forEach(E=>{const y=o(E.getAttribute("style")||""),C=w.createElement("td");C.setAttribute("width",`${s}%`);const _=y["background-color"]||y.background;_&&!_.includes("gradient")&&(C.setAttribute("bgcolor",_),y["background-color"]=_),C.setAttribute("style",c({...y,width:`${s}%`,"vertical-align":"top"})),C.innerHTML=E.innerHTML,u.appendChild(C)}),a.appendChild(u),t.replaceWith(a)}else if(e.display==="flex"&&t.children.length===2){const l=t.children[0],s=t.children[1];if(o(s.getAttribute("style")||""),s.children.length===1){const a=s.children[0],u=o(a.getAttribute("style")||""),E=(u.width||"").match(/(\d+(?:\.\d+)?)%/),y=u["background-color"]||u.background||"#0d9488";if(E){const C=Math.max(8,Math.min(100,Math.round(parseFloat(E[1])))),_=Math.max(0,100-C),X=w.createElement("table");X.setAttribute("width","100%"),X.setAttribute("cellspacing","0"),X.setAttribute("cellpadding","0"),X.setAttribute("style","width:100%;border-collapse:collapse;margin-bottom:4pt;border:none;"),X.innerHTML=`<tr>
              <td width="38%" style="width:38%;font-size:9pt;color:#475569;font-weight:bold;text-align:right;padding:2pt 8pt 2pt 0;border:none;vertical-align:middle;">${l.innerHTML}</td>
              <td width="62%" style="width:62%;padding:2pt 0;border:none;vertical-align:middle;">
                <table width="100%" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;border:none;">
                  <tr>
                    <td width="${C}%" bgcolor="${y}" style="width:${C}%;background-color:${y};height:14pt;text-align:right;padding:0 5pt;color:#ffffff;font-size:8pt;font-weight:bold;border:none;vertical-align:middle;">${a.innerHTML}</td>
                    ${_>0?`<td width="${_}%" bgcolor="#f1f5f9" style="width:${_}%;background-color:#f1f5f9;height:14pt;border:none;font-size:1pt;">&nbsp;</td>`:""}
                  </tr>
                </table>
              </td>
            </tr>`,t.replaceWith(X);return}}if(e["justify-content"]==="space-between"){const a=w.createElement("table");a.setAttribute("width","100%"),a.setAttribute("cellspacing","0"),a.setAttribute("cellpadding","0");const u=e["border-bottom"]?`border-bottom:${e["border-bottom"]};`:"border:none;";a.setAttribute("style",`width:100%;border-collapse:collapse;margin-bottom:8pt;${u}`),a.innerHTML=`<tr>
            <td width="75%" style="width:75%;text-align:left;vertical-align:middle;border:none;padding:2pt 0;">${l.outerHTML}</td>
            <td width="25%" style="width:25%;text-align:right;vertical-align:middle;border:none;padding:2pt 0;">${s.outerHTML}</td>
          </tr>`,t.replaceWith(a)}}}),te(h),h.querySelectorAll("h1").forEach(t=>{const e=o(t.getAttribute("style")||""),l=d({color:"#004d99","text-align":"center","font-size":"22pt","font-weight":"bold",margin:"12pt 0 6pt 0"},e);l["font-family"]="Calibri,Arial,sans-serif",l["mso-style-name"]="Heading1",t.setAttribute("style",c(l))}),h.querySelectorAll("h2").forEach(t=>{const e=o(t.getAttribute("style")||""),l=d({color:"#004d99","font-size":"16pt","font-weight":"bold","border-bottom":"2pt solid #004d99","padding-bottom":"4pt",margin:"10pt 0 4pt 0"},e);l["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",c(l))}),h.querySelectorAll("h3").forEach(t=>{const e=o(t.getAttribute("style")||""),l=d({color:"#333333","font-size":"13pt","font-weight":"bold",margin:"8pt 0 4pt 0"},e);l["font-family"]="Calibri,Arial,sans-serif",t.setAttribute("style",c(l))}),h.querySelectorAll("p").forEach(t=>{const e=o(t.getAttribute("style")||""),l=d({"font-family":"Calibri,Arial,sans-serif","font-size":"11pt",margin:"4pt 0","line-height":"1.5"},e);t.setAttribute("style",c(l))}),h.querySelectorAll("table").forEach(t=>{const e=o(t.getAttribute("style")||""),l=e.border==="none",s={width:"100%","table-layout":"fixed","mso-table-layout-alt":"fixed","border-collapse":e["border-collapse"]==="separate"?"separate":"collapse","font-family":"Calibri,Arial,sans-serif","font-size":"8.5pt"};l||(s.margin=e.margin||"8pt 0",s["mso-border-alt"]="solid #CCCCCC .5pt");const a=d(e,s);delete a["border-radius"],delete a["border-spacing"],delete a["box-shadow"],delete a.overflow,delete a["min-width"],t.setAttribute("style",c(a)),t.setAttribute("border",l?"0":"1"),t.getAttribute("cellspacing")||t.setAttribute("cellspacing","0"),t.getAttribute("cellpadding")||t.setAttribute("cellpadding","0")}),h.querySelectorAll("th").forEach(t=>{const e=o(t.getAttribute("style")||"");e.background&&e.background.includes("gradient")&&!e["background-color"]?e["background-color"]="#0f766e":e.background&&!e.background.includes("gradient")&&!e["background-color"]&&(e["background-color"]=e.background);const s=d({"font-family":"Calibri,Arial,sans-serif","font-weight":"bold","font-size":"8.5pt",padding:"5pt 4pt",border:"1pt solid #CCCCCC","mso-background-source":"auto","mso-pattern":"auto","vertical-align":"middle","text-align":"left","word-break":"break-word"},e);s["font-family"]||(s["font-family"]="Calibri,Arial,sans-serif"),s["background-color"]?(delete s["mso-background-source"],delete s["mso-pattern"],s.background=s["background-color"],t.setAttribute("bgcolor",s["background-color"])):(s["mso-background-source"]||(s["mso-background-source"]="auto"),s["mso-pattern"]||(s["mso-pattern"]="auto")),delete s["border-radius"],delete s["box-shadow"],delete s["white-space"],delete s["min-width"],s["word-break"]="break-word",t.setAttribute("style",c(s))}),h.querySelectorAll("td").forEach(t=>{const e=o(t.getAttribute("style")||"");e.background&&!e.background.includes("gradient")&&!e["background-color"]&&(e["background-color"]=e.background);const s={"font-family":"Calibri,Arial,sans-serif","font-size":"8pt",padding:"4pt 4pt",border:e.border==="none"?"none":"1pt solid #DDDDDD","vertical-align":"top","word-break":"break-word"},a=d(s,e);a["background-color"]&&(delete a["mso-background-source"],delete a["mso-pattern"],a.background=a["background-color"],t.setAttribute("bgcolor",a["background-color"])),delete a["border-radius"],delete a["box-shadow"],delete a.transition,delete a["white-space"],delete a["min-width"],a["word-break"]="break-word",t.setAttribute("style",c(a))}),h.querySelectorAll("tr").forEach(t=>{const e=o(t.getAttribute("style")||"");delete e["border-radius"],delete e["box-shadow"],delete e.transition,Object.keys(e).length>0&&t.setAttribute("style",c(e))}),h.querySelectorAll("li").forEach(t=>{const e=o(t.getAttribute("style")||""),l=d({"font-family":"Calibri,Arial,sans-serif","font-size":"11pt",margin:"2pt 0"},e);t.setAttribute("style",c(l))}),h.querySelectorAll("strong, b").forEach(t=>{const e=o(t.getAttribute("style")||"");e["font-weight"]="bold",t.setAttribute("style",c(e))}),h.querySelectorAll("em, i").forEach(t=>{const e=o(t.getAttribute("style")||"");e["font-style"]="italic",t.setAttribute("style",c(e))}),h.querySelectorAll("div").forEach(t=>{const e=o(t.getAttribute("style")||"");delete e["border-radius"],delete e["box-shadow"],delete e.overflow,delete e.transition,delete e["-webkit-overflow-scrolling"],e["font-family"]||(e["font-family"]="Calibri,Arial,sans-serif"),Object.keys(e).length>0&&t.setAttribute("style",c(e))}),h.querySelectorAll("img").forEach(t=>{const e=o(t.getAttribute("style")||""),l=e["max-height"]||"",s=e["max-width"]||"",u=l&&l!=="none"?parseInt(l,10):null,E=u!==null&&u<=100;if(delete e["max-width"],delete e["max-height"],delete e["object-fit"],delete e["border-radius"],delete e.transition,E)e.width="150pt",e.height="75pt",e.display="block",t.setAttribute("width","150"),t.setAttribute("height","75");else if(s&&s!=="100%"&&s!=="none"){const y=parseInt(s,10);if(!isNaN(y)){const C=Math.round(y*.75);e.width=`${C}pt`,e.height="auto",t.setAttribute("width",String(y))}}else e["max-width"]="460pt",e.width=e.width||"100%";t.setAttribute("style",c(e))});const de=h.innerHTML;return`<!DOCTYPE html>
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
        ${de}
    </div>
</body>
</html>`},ne=()=>{if(m)return!0;const i=`wappy_html_export_count_${F||v||"global"}`,o=parseInt(ke(i)||"0",10);return o>=3?!1:(ve(i,String(o+1)),!0)},K=x?[]:[{label:"Abrir en Navegador (HTML)",icon:he,handler:async()=>{if(!ne()){H("Límite de Previsualización"),W("Has abierto la vista web de este documento 3 veces en este chat (límite del Plan Gratuito). Pásate a Pro para tener accesos ilimitados."),L(!0),b(!1);return}O(!0);try{const i=A(),o=await B.post("/api/public-report",{content:i,fileName:k,reportType:U},{headers:{Authorization:`Bearer ${g}`}}),{id:c}=o.data,d=`${window.location.origin}/report/${c}`;window.open(d,"_blank"),b(!1)}catch(i){console.error("Error sharing report:",i);const o=A(),c=new Blob([o],{type:"text/html;charset=utf-8"}),d=URL.createObjectURL(c);window.open(d,"_blank"),setTimeout(()=>URL.revokeObjectURL(d),1e4),G({status:"error",message:"No se pudo generar el link compartido, se abrió una vista temporal."})}finally{O(!1)}},description:"Vista completa con estilos",disabled:!f},{label:"Descargar HTML (.html)",icon:re,handler:()=>{const i=A(),o=new Blob([i],{type:"text/html;charset=utf-8"}),c=URL.createObjectURL(o),d=document.createElement("a");d.href=c,d.download=`${k}.html`,document.body.appendChild(d),d.click(),document.body.removeChild(d),URL.revokeObjectURL(c),b(!1)},description:"Archivo HTML independiente",disabled:!f},{label:"Descargar Word (.doc)",icon:Y,handler:()=>{const i=le(),o="----=_NextPart_000_0000_01D00000.00000000",c=["MIME-Version: 1.0",`Content-Type: multipart/related; type="text/html"; boundary="${o}"`,"",`--${o}`,'Content-Type: text/html; charset="utf-8"',"Content-Transfer-Encoding: 8bit","Content-Location: file:///document.htm","",i,"",`--${o}--`].join(`\r
`),d=new Blob([c],{type:"application/msword"}),D=URL.createObjectURL(d),j=document.createElement("a");j.href=D,j.download=`${k}.doc`,document.body.appendChild(j),j.click(),document.body.removeChild(j),URL.revokeObjectURL(D),b(!1)},description:"Editable con tablas y formato",disabled:!f},{label:"Descargar PDF",icon:re,handler:()=>{const i=A(),o=window.open("","_blank");if(o){o.document.open(),o.document.write(i),o.document.close();const c=()=>{setTimeout(()=>{try{o.focus(),o.print()}catch(d){console.warn("Print failed:",d)}},600)};o.document.readyState==="complete"?c():(o.onload=c,setTimeout(c,2e3))}b(!1)},description:"Imprimir / guardar como PDF",disabled:!f}];z&&K.unshift({label:"Exportar Registros a Excel (.xlsx)",icon:Y,handler:()=>{z(),b(!1)},description:"Datos crudos de la tabla en Excel",disabled:!1,premium:!1}),P&&K.unshift({label:"Descargar Formato / Plantilla (.xlsx)",icon:Q,handler:()=>{P(),b(!1)},description:"Plantilla oficial vacía para diligenciar",disabled:!1,premium:!1});const ce=M?r.jsx("div",{ref:$,style:{position:"fixed",top:S.top,right:S.right,zIndex:9999999},className:"w-64 overflow-hidden rounded-xl border border-border-medium bg-surface-primary shadow-xl duration-200 animate-in fade-in slide-in-from-top-2",children:r.jsx("div",{className:"p-1",children:K.map(i=>{const o=i.icon,c=!m&&i.premium;return r.jsx("button",{onClick:d=>{if(d.preventDefault(),d.stopPropagation(),c){H("Exportación Premium Bloqueada"),W(`La exportación en este formato (${i.label.split("(")[0].trim()}) está reservada exclusivamente para cuentas PREMIUM del Plan Pro.`),L(!0),b(!1);return}i.label.toLowerCase().includes("descargar")||i.label.toLowerCase().includes("exportar")?J(i.handler):i.handler()},disabled:i.disabled,className:se("flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",i.disabled?"cursor-not-allowed opacity-40":"hover:bg-surface-hover"),children:r.jsxs("div",{className:"flex items-center gap-3",children:[r.jsx("div",{className:"rounded-xl bg-teal-100 p-1.5 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",children:r.jsx(o,{className:"h-4 w-4"})}),r.jsxs("div",{children:[r.jsx("div",{className:"text-sm font-medium text-text-primary",children:i.label}),r.jsx("div",{className:"text-xs text-text-secondary",children:i.description})]})]})},i.label)})})}):null;return r.jsxs(r.Fragment,{children:[r.jsxs("button",{ref:N,onClick:()=>{T(),b(i=>!i)},className:"group flex h-9 min-w-[36px] flex-shrink-0 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 px-2.5 text-green-700 dark:text-green-300 shadow-xs outline-none transition-all duration-300 ease-in-out hover:bg-green-500/20 sm:hover:-rotate-3 sm:hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:min-w-[40px] sm:px-3",children:[r.jsx("div",{className:"relative flex flex-shrink-0 items-center justify-center",children:r.jsx(Q,{className:"h-4 w-4"})}),r.jsxs("div",{className:"hidden sm:flex max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100",children:[r.jsx("span",{className:"mr-1 text-sm font-bold tracking-wide",children:"Exportar"}),r.jsx(xe,{className:`h-3.5 w-3.5 text-green-600 dark:text-green-400 transition-transform duration-200 ${M?"rotate-180":""}`})]})]}),ee.createPortal(ce,document.body),R&&r.jsx("div",{className:"fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm",children:r.jsxs("div",{className:"relative w-full max-w-sm duration-300 animate-in zoom-in-95",children:[r.jsx("button",{onClick:()=>L(!1),className:"absolute -top-10 right-0 rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white backdrop-blur-md hover:text-gray-300 z-50",children:"Cerrar ✕"}),r.jsx(oe,{title:I,description:Z,plan:(n==null?void 0:n.role)||"USER",isPopup:!0,hideFeatures:!0})]})})]})};export{He as E,Ie as R};
