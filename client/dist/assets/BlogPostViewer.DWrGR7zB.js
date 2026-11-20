import{r,j as e}from"./react-core.DnLkJYlj.js";import{a as W}from"./http-client.B65nVLIf.js";import{a0 as $,o as U,d6 as d,U as _}from"./index.CcR-UX8W.js";import{A as H}from"./Attachments.CJyDgO6H.js";import{r as O}from"./blogThumbnail.CrEXAipt.js";import{f as Y,a as J}from"./routing.CpqY7sNF.js";import{cC as X,cl as T,aI as A,ci as P,c8 as G,cF as K,dE as Q,df as Z}from"./vendor.D6dmva7o.js";import"./markdown_highlight.Cj_heSZW.js";import"./locales-core.odB_8JGc.js";import"./i18n.CdklldLM.js";import"./radix-ui.tyTt8AVy.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.eOyFKrPk.js";import"./animations.Bex6e3gT.js";import"./virtualization.K9f6iwJ3.js";import"./tanstack-vendor.V0CwQAMH.js";import"./headlessui.D--G9T6_.js";import"./framer-motion.O8fbVyXv.js";import"./validation.CXYwsuSc.js";import"./utilities.CCKZG3yh.js";import"./date-utils.D18hejP2.js";import"./forms.DRVLrJdX.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.CGWTjSj6.js";import"./math-katex.D41sMH58.js";const ee=`
  .wappy-article-body {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 1.0625rem;
    line-height: 1.82;
    color: #1e293b;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .wappy-article-body,
  .wappy-article-body * {
    box-sizing: border-box;
  }

  .wappy-article-body > *,
  .wappy-article-body .wappy-editorial-article {
    max-width: 100% !important;
  }

  .wappy-article-body h1,
  .wappy-article-body h2,
  .wappy-article-body h3,
  .wappy-article-body h4 {
    font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.28;
    color: #0f172a;
    scroll-margin-top: 5rem;
  }

  .wappy-article-body h2 {
    font-size: clamp(1.35rem, 2.2vw, 1.75rem);
    margin-top: 2.25rem;
    margin-bottom: 0.95rem;
    padding-left: 0.85rem;
    border-left: 4px solid #0d9488;
    color: #0f766e;
  }

  .wappy-article-body h3 {
    font-size: clamp(1.125rem, 1.8vw, 1.35rem);
    margin-top: 1.65rem;
    margin-bottom: 0.65rem;
    color: #0f172a;
  }

  .wappy-article-body h4 {
    font-size: 1.05rem;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
    color: #1e293b;
  }

  .wappy-article-body p {
    margin-top: 0;
    margin-bottom: 1.15rem;
    color: #334155;
  }

  .wappy-article-body strong,
  .wappy-article-body b {
    font-weight: 700;
    color: #0f172a;
  }

  .wappy-article-body a {
    color: #0d9488;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: rgba(13, 148, 136, 0.38);
    text-underline-offset: 3px;
    transition: color 0.18s ease, text-decoration-color 0.18s ease;
  }

  .wappy-article-body a:hover {
    color: #0f766e;
    text-decoration-color: #0d9488;
  }

  .wappy-article-body ul,
  .wappy-article-body ol {
    margin-top: 0.85rem;
    margin-bottom: 1.35rem;
    padding-left: 1.5rem;
  }

  .wappy-article-body ul {
    list-style-type: disc;
  }

  .wappy-article-body ol {
    list-style-type: decimal;
  }

  .wappy-article-body li {
    margin-bottom: 0.55rem;
    padding-left: 0.25rem;
    color: #334155;
  }

  .wappy-article-body li::marker {
    color: #0d9488;
    font-weight: 700;
  }

  .wappy-article-body blockquote {
    margin: 1.6rem 0;
    padding: 1.1rem 1.35rem;
    border-left: 4px solid #0d9488;
    border-radius: 0 1rem 1rem 0;
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.08), rgba(16, 185, 129, 0.04));
    color: #1e293b;
    font-style: italic;
  }

  .wappy-article-body blockquote.wappy-callout {
    font-style: normal;
  }

  .wappy-article-body blockquote p:last-child {
    margin-bottom: 0;
  }

  .wappy-article-body hr {
    border: 0;
    height: 1px;
    margin: 2.2rem 0;
    background: linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.35), transparent);
  }

  .wappy-article-body img {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 1rem;
    box-shadow: 0 12px 32px -12px rgba(15, 23, 42, 0.18);
    margin: 1.5rem auto;
    display: block;
  }

  .wappy-article-body figure {
    margin: 1.75rem 0;
    max-width: 100%;
  }

  .wappy-article-body figcaption {
    margin-top: 0.65rem;
    text-align: center;
    font-size: 0.85rem;
    color: #64748b;
    font-style: italic;
  }

  .wappy-article-body .table-responsive,
  .wappy-article-body .wappy-table-wrap,
  .wappy-article-body .custom-table-scroll {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 1.5rem 0;
    border-radius: 0.875rem;
    border: 1px solid #e2e8f0;
    background: #ffffff;
  }

  .wappy-article-body table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.9375rem;
    line-height: 1.55;
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .wappy-article-body .table-responsive table,
  .wappy-article-body .wappy-table-wrap table,
  .wappy-article-body .custom-table-scroll table {
    display: table;
    margin: 0;
    min-width: 100%;
  }

  .wappy-article-body thead th,
  .wappy-article-body th {
    background-color: #f0fdfa;
    color: #0f766e;
    font-weight: 700;
    text-align: left;
    padding: 0.8rem 1rem;
    border-bottom: 2px solid #99f6e4;
    border-right: 1px solid #e2e8f0;
  }

  .wappy-article-body td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    border-right: 1px solid #f1f5f9;
    color: #334155;
    vertical-align: top;
  }

  .wappy-article-body th:last-child,
  .wappy-article-body td:last-child {
    border-right: none;
  }

  .wappy-article-body tbody tr:nth-child(even) td {
    background-color: #f8fafc;
  }

  .wappy-article-body code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.88em;
    padding: 0.15rem 0.4rem;
    border-radius: 0.4rem;
    background: rgba(13, 148, 136, 0.1);
    color: #0f766e;
  }

  .wappy-article-body pre {
    max-width: 100%;
    overflow-x: auto;
    padding: 1.1rem 1.25rem;
    border-radius: 0.875rem;
    background: #0f172a;
    color: #e2e8f0;
    margin: 1.5rem 0;
  }

  .wappy-article-body pre code {
    background: transparent;
    color: inherit;
    padding: 0;
  }

  .wappy-article-body iframe,
  .wappy-article-body video {
    max-width: 100%;
    border-radius: 1rem;
  }

  /* =========================================================
     Dark Mode Editorial Contrast Overrides (V2 + Legacy HTML)
     ========================================================= */
  .dark .wappy-article-body {
    color: #e2e8f0;
  }

  .dark .wappy-article-body h1,
  .dark .wappy-article-body h4 {
    color: #f8fafc !important;
  }

  .dark .wappy-article-body h2 {
    color: #5eead4 !important;
    border-left-color: #2dd4bf !important;
    border-bottom-color: rgba(45, 212, 191, 0.32) !important;
  }

  .dark .wappy-article-body h3,
  .dark .wappy-article-body .wappy-kicker {
    color: #2dd4bf !important;
  }

  .dark .wappy-article-body .wappy-lead-badge {
    color: #5eead4 !important;
    background: rgba(13, 148, 136, 0.24) !important;
  }

  .dark .wappy-article-body p,
  .dark .wappy-article-body li {
    color: #cbd5e1;
  }

  .dark .wappy-article-body strong,
  .dark .wappy-article-body b {
    color: #f8fafc;
  }

  .dark .wappy-article-body li::marker {
    color: #2dd4bf;
  }

  .dark .wappy-article-body a:not(.wappy-cta-btn):not([style*="#c7f303"]):not([style*="#C7F303"]):not([style*="background"]) {
    color: #2dd4bf !important;
    text-decoration-color: rgba(45, 212, 191, 0.45);
  }

  .dark .wappy-article-body a:not(.wappy-cta-btn):not([style*="#c7f303"]):not([style*="#C7F303"]):not([style*="background"]):hover {
    color: #c7f303 !important;
    text-decoration-color: #c7f303;
  }

  .dark .wappy-article-body blockquote:not([style*="f59e0b"]):not([style*="F59E0B"]) {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.16), rgba(15, 23, 42, 0.65)) !important;
    border-left-color: #2dd4bf !important;
    color: #e2e8f0 !important;
  }

  .dark .wappy-article-body blockquote[style*="f59e0b"],
  .dark .wappy-article-body blockquote[style*="F59E0B"] {
    background: rgba(245, 158, 11, 0.14) !important;
    border-left-color: #fbbf24 !important;
    border-color: rgba(251, 191, 36, 0.34) !important;
    color: #fef3c7 !important;
  }

  .dark .wappy-article-body img {
    box-shadow: 0 14px 36px -12px rgba(0, 0, 0, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.18);
  }

  .dark .wappy-article-body figcaption {
    color: #94a3b8;
  }

  .dark .wappy-article-body .table-responsive,
  .dark .wappy-article-body .wappy-table-wrap,
  .dark .wappy-article-body .custom-table-scroll {
    border-color: rgba(45, 212, 191, 0.3) !important;
    background: rgba(15, 23, 42, 0.55) !important;
  }

  .dark .wappy-article-body thead th,
  .dark .wappy-article-body th {
    background-color: rgba(13, 148, 136, 0.24) !important;
    color: #5eead4 !important;
    border-bottom-color: rgba(45, 212, 191, 0.45) !important;
    border-color: rgba(51, 65, 85, 0.7) !important;
  }

  .dark .wappy-article-body td {
    background-color: transparent !important;
    color: #e2e8f0 !important;
    border-color: rgba(51, 65, 85, 0.65) !important;
  }

  .dark .wappy-article-body tbody tr:nth-child(even) td {
    background-color: rgba(148, 163, 184, 0.08) !important;
  }

  .dark .wappy-article-body code {
    background: rgba(45, 212, 191, 0.14);
    color: #5eead4;
  }

  /* Enhance V2 translucent cards and adapt legacy light inline boxes cleanly in dark mode */
  .dark .wappy-article-body .wappy-lead-card,
  .dark .wappy-article-body .wappy-editorial-lead {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.16) 0%, rgba(199, 243, 3, 0.08) 100%) !important;
    border-color: rgba(45, 212, 191, 0.3) !important;
    border-left-color: #2dd4bf !important;
    color: #e2e8f0 !important;
  }

  .dark .wappy-article-body .wappy-list-card {
    background: rgba(148, 163, 184, 0.08) !important;
    border-color: rgba(148, 163, 184, 0.24) !important;
    color: #e2e8f0 !important;
  }

  .dark .wappy-article-body .wappy-cta-card,
  .dark .wappy-article-body .wappy-cta-box {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.18) 0%, rgba(199, 243, 3, 0.1) 100%) !important;
    border-color: rgba(45, 212, 191, 0.42) !important;
    color: #f1f5f9 !important;
  }

  .dark .wappy-article-body :is(div, section, aside, figure, ul, ol):not(.wappy-cta-card):not(.wappy-cta-box):not(.wappy-cta):not([style*="#c7f303"]):not([style*="#C7F303"]):is(
    [style*="background:#f"],
    [style*="background: #f"],
    [style*="background-color:#f"],
    [style*="background-color: #f"],
    [style*="background:#e"],
    [style*="background: #e"],
    [style*="background-color:#e"],
    [style*="background-color: #e"],
    [style*="background:#fff"],
    [style*="background: #fff"],
    [style*="background-color:#fff"],
    [style*="background-color: #fff"],
    [style*="linear-gradient"][style*="#f"]
  ) {
    background: rgba(30, 41, 59, 0.72) !important;
    border-color: rgba(71, 85, 105, 0.7) !important;
    color: #e2e8f0 !important;
  }

  .dark .wappy-article-body :is(p, li, div, span, td, dd, dt, blockquote):not(.wappy-cta-btn):not([style*="#c7f303"]):not([style*="#C7F303"]):is(
    [style*="color:#0"],
    [style*="color: #0"],
    [style*="color:#1"],
    [style*="color: #1"],
    [style*="color:#2"],
    [style*="color: #2"],
    [style*="color:#3"],
    [style*="color: #3"],
    [style*="color:#4"],
    [style*="color: #4"],
    [style*="color:#5"],
    [style*="color: #5"],
    [style*="color:rgb(1"],
    [style*="color: rgb(1"],
    [style*="color:rgb(3"],
    [style*="color: rgb(3"],
    [style*="color:rgb(5"],
    [style*="color: rgb(5"]
  ) {
    color: #e2e8f0 !important;
  }

  .dark .wappy-article-body :is(strong, b):not(.wappy-cta-btn):not([style*="#c7f303"]):not([style*="#C7F303"]) {
    color: #f8fafc !important;
  }

  /* Preserve electric lime pills & buttons (#c7f303) with crisp dark ink (#0e1300) */
  .wappy-article-body [style*="#c7f303"],
  .wappy-article-body [style*="#C7F303"],
  .dark .wappy-article-body [style*="#c7f303"],
  .dark .wappy-article-body [style*="#C7F303"] {
    color: #0e1300 !important;
  }

  .wappy-article-body .wappy-cta-btn,
  .dark .wappy-article-body .wappy-cta-btn {
    text-decoration: none !important;
  }
`;function ze(){var z;const{postId:g}=Y(),[a,M]=r.useState(null),[R,F]=r.useState(!0),[I,u]=r.useState(!1),[c,y]=r.useState(0),[n,w]=r.useState(!1),l=r.useRef(null),i=r.useRef(null),{showToast:s}=$(),p=J(),{user:f}=U(),h=(f==null?void 0:f.role)==="USER";r.useEffect(()=>{u(!1),y(0),l.current&&(l.current.scrollTop=0)},[a==null?void 0:a._id,a==null?void 0:a.thumbnail]),r.useEffect(()=>()=>{i.current&&clearTimeout(i.current)},[]),r.useEffect(()=>{(async()=>{try{const o=await W.get(`/api/blog/${g}`);M(o.data)}catch(o){console.error("Error fetching blog post:",o),s({message:"Error cargando la publicación. Intenta de nuevo más tarde.",status:"error"}),p("/academia?tab=blog")}finally{F(!1)}})()},[g,p,s]);const b=r.useCallback(()=>{const t=l.current;if(!t)return;const o=t.scrollHeight-t.clientHeight;if(o<=0){y(0);return}const E=Math.min(100,Math.max(0,t.scrollTop/o*100));y(E)},[]);r.useEffect(()=>(window.addEventListener("resize",b),()=>window.removeEventListener("resize",b)),[b]);const B=r.useMemo(()=>{const t=typeof(a==null?void 0:a.content)=="string"?a.content:"",o=typeof(a==null?void 0:a.description)=="string"?a.description:"",S=`${typeof(a==null?void 0:a.title)=="string"?a.title:""} ${o} ${t}`.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi," ").replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/\s+/g," ").trim();if(!S)return 1;const V=S.split(" ").filter(Boolean).length;return Math.max(1,Math.ceil(V/200))},[a==null?void 0:a.content,a==null?void 0:a.description,a==null?void 0:a.title]),k=r.useMemo(()=>{if(!(a!=null&&a.createdAt))return"";const t=new Date(a.createdAt);return Number.isNaN(t.getTime())?"":t.toLocaleDateString("es-CO",{year:"numeric",month:"long",day:"numeric"})},[a==null?void 0:a.createdAt]),v=r.useCallback(()=>{var t;typeof window>"u"||(t=navigator.clipboard)==null||t.writeText(window.location.href).then(()=>{w(!0),s({message:"Enlace copiado al portapapeles",status:"success"}),i.current&&clearTimeout(i.current),i.current=setTimeout(()=>w(!1),2500)}).catch(()=>{s({message:"No se pudo copiar el enlace",status:"error"})})},[s]),L=r.useCallback(()=>{var t;(t=l.current)==null||t.scrollTo({top:0,behavior:"smooth"})},[]);if(R)return e.jsx("div",{className:"flex justify-center items-center h-full min-h-[60vh] bg-white dark:bg-gray-950",children:e.jsxs("div",{className:"animate-pulse flex flex-col items-center gap-3",children:[e.jsx("div",{className:"h-14 w-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center",children:e.jsx(X,{className:"w-6 h-6 text-teal-600 dark:text-teal-400"})}),e.jsx("div",{className:"h-4 w-44 bg-slate-200 dark:bg-zinc-800 rounded-lg"}),e.jsx("div",{className:"h-3 w-28 bg-slate-200 dark:bg-zinc-800 rounded-lg"})]})});if(!a)return e.jsxs("div",{className:"flex flex-col items-center justify-center p-8 sm:p-12 text-center h-full bg-white dark:bg-gray-950",children:[e.jsx("h2",{className:"text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-2",children:"Publicación no encontrada"}),e.jsx("p",{className:"text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md",children:"Es posible que este artículo haya sido movido o eliminado del Blog WAPPY IA."}),e.jsx(d,{variant:"neutral",size:"md",onClick:()=>p("/academia?tab=blog"),icon:e.jsx(T,{className:"w-4 h-4"}),label:"Volver a Academia"})]});const j=O(a==null?void 0:a.thumbnail),x=typeof(a==null?void 0:a.content)=="string"?a.content:"",N=typeof(a==null?void 0:a.description)=="string"?a.description.trim():"",D=x.includes("wappy-lead-card")||x.includes("wappy-editorial-lead"),q=!!N&&!D,m=Array.isArray(a==null?void 0:a.tags)?a.tags.filter(t=>typeof t=="string"&&t.trim().length>0):[],C=Array.isArray(a==null?void 0:a.attachments)?a.attachments:[];return e.jsxs("div",{className:"flex flex-col h-full bg-slate-50/70 dark:bg-gray-950 text-slate-800 dark:text-slate-200 w-full relative overflow-hidden",children:[e.jsx("style",{children:ee}),e.jsx("div",{"aria-hidden":"true",className:"pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-500/10 dark:bg-teal-500/10 blur-3xl"}),e.jsx("div",{"aria-hidden":"true",className:"pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl"}),e.jsxs("div",{ref:l,onScroll:b,className:`relative z-10 flex-1 flex flex-col overflow-y-auto overflow-x-hidden ${h?"filter blur-[8px] pointer-events-none select-none":""}`,children:[e.jsxs("div",{className:"sticky top-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 flex-shrink-0",children:[e.jsx("div",{className:"w-full h-[3px] bg-slate-200/70 dark:bg-zinc-800/90 overflow-hidden",children:e.jsx("div",{className:"h-full bg-gradient-to-r from-[#0d9488] via-[#10b981] to-[#c7f303] transition-[width] duration-150 ease-out",style:{width:`${c}%`},role:"progressbar","aria-label":"Progreso de lectura","aria-valuenow":Math.round(c),"aria-valuemin":0,"aria-valuemax":100})}),e.jsxs("div",{className:"max-w-5xl mx-auto px-4 md:px-8 py-2.5 flex items-center justify-between gap-3 min-w-0",children:[e.jsx(d,{variant:"neutral",size:"md",onClick:()=>p("/academia?tab=blog"),icon:e.jsx(T,{className:"w-4 h-4"}),label:"Volver a Academia","aria-label":"Volver a Academia"}),e.jsxs("div",{className:`hidden md:flex items-center gap-2.5 min-w-0 flex-1 justify-center transition-opacity duration-200 ${c>4?"opacity-100":"opacity-0 pointer-events-none"}`,children:[e.jsx("span",{className:"truncate max-w-md text-xs font-bold text-slate-700 dark:text-slate-200",children:a.title}),e.jsxs("span",{className:"shrink-0 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2 py-0.5 text-[10px] font-extrabold text-teal-700 dark:text-teal-300",children:[Math.round(c),"%"]})]}),e.jsx(d,{variant:"fuchsia",size:"md",onClick:v,icon:n?e.jsx(A,{className:"w-4 h-4"}):e.jsx(P,{className:"w-4 h-4"}),label:n?"¡Enlace copiado!":"Compartir artículo",title:"Copiar enlace del artículo"})]})]}),e.jsx("article",{className:"flex-1 w-full min-w-0 max-w-4xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-10 lg:py-12",children:e.jsxs("div",{className:"rounded-3xl border border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/75 backdrop-blur-sm shadow-xl shadow-slate-900/[0.04] dark:shadow-black/30 p-5 sm:p-8 md:p-10 lg:p-12 min-w-0 overflow-x-clip",children:[e.jsxs("header",{className:"mb-8",children:[m.length>0&&e.jsx("div",{className:"flex flex-wrap items-center gap-2 mb-4",children:m.map((t,o)=>e.jsx("span",{className:"inline-flex items-center rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] font-extrabold tracking-wider uppercase text-teal-700 dark:text-teal-300",children:t},o))}),e.jsx("h1",{className:"text-2xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.16] tracking-tight text-slate-900 dark:text-slate-50 mb-5",children:a.title}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 pt-4 pb-5 border-y border-slate-200/80 dark:border-zinc-800",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 min-w-0",children:[((z=a.author)==null?void 0:z.name)&&e.jsxs("div",{className:"inline-flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100",children:[e.jsx("span",{className:"inline-flex h-7 w-7 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 flex-shrink-0",children:e.jsx(G,{className:"w-3.5 h-3.5"})}),e.jsx("span",{className:"truncate max-w-[180px] sm:max-w-none",children:a.author.name})]}),k&&e.jsxs("div",{className:"inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400",children:[e.jsx(K,{className:"w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0"}),e.jsx("span",{children:k})]}),e.jsxs("div",{className:"inline-flex items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300",title:"Tiempo estimado de lectura",children:[e.jsx(Q,{className:"w-3.5 h-3.5 flex-shrink-0"}),e.jsxs("span",{children:[B," min de lectura"]})]})]}),e.jsx(d,{variant:"fuchsia",size:"sm",onClick:v,icon:n?e.jsx(A,{className:"w-3.5 h-3.5"}):e.jsx(P,{className:"w-3.5 h-3.5"}),label:n?"¡Copiado!":"Compartir",title:"Compartir artículo"})]})]}),j&&!I&&e.jsx("figure",{className:"mb-8 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-zinc-800 shadow-lg shadow-slate-900/5 dark:shadow-black/40 w-full bg-slate-50 dark:bg-zinc-900/60",children:e.jsx("img",{src:j,alt:a.title||"Imagen del artículo",className:"w-full h-auto object-contain block",onError:()=>u(!0)})}),q&&e.jsxs("section",{"aria-label":"Resumen ejecutivo",className:"mb-8 rounded-2xl border border-teal-500/25 border-l-4 border-l-[#0d9488] bg-gradient-to-br from-teal-500/[0.08] via-emerald-500/[0.04] to-transparent dark:from-teal-500/15 dark:via-emerald-500/10 dark:to-zinc-900/40 p-5 sm:p-6 shadow-sm",children:[e.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[e.jsx("span",{className:"inline-block h-2 w-2 rounded-full bg-[#0d9488] dark:bg-[#2dd4bf]"}),e.jsx("span",{className:"text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#0d9488] dark:text-[#2dd4bf]",children:"Resumen Ejecutivo"})]}),e.jsx("p",{className:"text-base sm:text-[17px] leading-relaxed text-slate-700 dark:text-slate-200 font-medium m-0",children:N})]}),e.jsx("div",{className:"wappy-article-body w-full min-w-0 max-w-full overflow-x-hidden",dangerouslySetInnerHTML:{__html:x}}),C.length>0&&e.jsx("div",{className:"mt-10 pt-8 border-t border-slate-200/80 dark:border-zinc-800",children:e.jsx(H,{attachments:C,title:"Archivos y Recursos Descargables",subtitle:"Descarga el material de apoyo, plantillas y documentos adjuntos a este artículo."})}),e.jsxs("footer",{className:"mt-12 pt-8 border-t border-slate-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-6",children:[m.length>0?e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("h3",{className:"text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 mb-3",children:"Etiquetas Relacionadas"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:m.map((t,o)=>e.jsxs("span",{className:"inline-flex items-center rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-slate-100/80 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 transition-colors",children:["#",t]},o))})]}):e.jsx("div",{}),e.jsx("div",{className:"flex items-center gap-2 shrink-0",children:e.jsx(d,{variant:"neutral",size:"md",onClick:L,icon:e.jsx(Z,{className:"w-4 h-4"}),label:"Subir al inicio",title:"Volver al inicio del artículo"})})]})]})})]}),h&&e.jsx("div",{className:"absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4 sm:p-6 md:p-8",children:e.jsx(_,{isPopup:!0,title:"Blog WAPPY Exclusivo",description:"El acceso a los artículos, normativas de SST y novedades en el Blog Wappy es exclusivo de los planes Wappy Vital y Wappy Pro. Evoluciona hoy tu plan para estar al día."})})]})}export{ze as default};
