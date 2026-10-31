import{r,j as e}from"./react-core.DnLkJYlj.js";import{a as h}from"./http-client.Cc7S4e2q.js";import{d as b}from"./routing.G8zv3X9f.js";import{ck as u,aI as g,e5 as j,fX as w}from"./vendor.B4N1X42Z.js";import"./markdown_highlight.Cj_heSZW.js";import"./validation.CXYwsuSc.js";import"./math-katex.D41sMH58.js";const F=()=>{const{id:a}=b(),[o,n]=r.useState(null),[N,l]=r.useState(""),[s,c]=r.useState(null),[d,m]=r.useState(!0),[p,i]=r.useState(!1);r.useEffect(()=>{a&&(async()=>{try{const t=await h.get(`/api/public-report/${a}`);n(t.data.content),t.data.fileName&&(l(t.data.fileName),document.title=`${t.data.fileName.replace(/_/g," ")} | WAPPY`)}catch(t){console.error("Error fetching public report:",t),c("El informe no existe o ha expirado.")}finally{m(!1)}})()},[a]);const x=()=>{navigator.clipboard.writeText(window.location.href),i(!0),setTimeout(()=>i(!1),2500)},f=()=>{window.print()};return d?e.jsxs("div",{className:"flex flex-col items-center justify-center min-h-screen bg-slate-50",children:[e.jsx("div",{className:"animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-3"}),e.jsx("p",{className:"text-xs font-semibold text-slate-500 animate-pulse",children:"Cargando informe oficial..."})]}):s||!o?e.jsxs("div",{className:"flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4",children:[e.jsx("div",{className:"text-amber-500 text-6xl mb-4",children:"⚠️"}),e.jsx("h1",{className:"text-2xl font-bold text-slate-800 mb-2",children:"Informe No Encontrado"}),e.jsx("p",{className:"text-slate-600 text-center max-w-md text-sm",children:s||"No se pudo cargar el informe solicitado."})]}):e.jsxs("div",{className:"public-report-viewer bg-white min-h-screen relative text-slate-800",children:[e.jsx("style",{children:`
        /* Overwrite any global app styles for the public view */
        html, body {
          background-color: #ffffff !important;
          color: #1e293b !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        #root {
          max-width: none !important;
          width: 100% !important;
          background-color: #ffffff !important;
          color: #1e293b !important;
        }
        .public-report-viewer {
          color: #1e293b !important;
        }
        @media print {
          .print-hidden-bar {
            display: none !important;
          }
        }
      `}),e.jsxs("aside",{"aria-label":"Acciones del informe",className:"print-hidden-bar fixed top-4 right-4 z-50 flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/90 dark:border-zinc-800 shadow-xl transition-all",children:[e.jsxs("div",{className:"hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-100 dark:border-teal-900/30",children:[e.jsx(u,{className:"w-4 h-4 text-teal-600"}),e.jsx("span",{children:"Documento Oficial"})]}),e.jsx("button",{type:"button",onClick:x,className:"flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-700 shadow-2xs active:scale-95 transition-all cursor-pointer",title:"Copiar enlace para compartir",children:p?e.jsxs(e.Fragment,{children:[e.jsx(g,{className:"w-3.5 h-3.5 text-emerald-600"}),e.jsx("span",{className:"text-emerald-600 font-bold",children:"¡Copiado!"})]}):e.jsxs(e.Fragment,{children:[e.jsx(j,{className:"w-3.5 h-3.5 text-slate-600 dark:text-zinc-300"}),e.jsx("span",{children:"Copiar Enlace"})]})}),e.jsxs("button",{type:"button",onClick:f,className:"flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-xs font-bold shadow-md shadow-teal-600/20 active:scale-95 transition-all cursor-pointer",title:"Imprimir o guardar como PDF",children:[e.jsx(w,{className:"w-3.5 h-3.5"}),e.jsx("span",{children:"Imprimir / PDF"})]})]}),e.jsx("main",{className:"public-report-content",dangerouslySetInnerHTML:{__html:o}})]})};export{F as default};
