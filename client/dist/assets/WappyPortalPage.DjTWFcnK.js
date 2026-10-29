import{r as s,j as e}from"./react-core.DnLkJYlj.js";import{a as D,u as V,b as G}from"./routing.G8zv3X9f.js";import{u as Y,Z as B,X as H}from"./index.CwR8ibA5.js";import{u as $,W as _,I as U,a as F,r as Q}from"./InstagramFollowGateModal.BCaOmErt.js";import"./vendor.BQ_vVZzs.js";import"./utilities.CCKZG3yh.js";/* empty css                  */import"./markdown_highlight.Cj_heSZW.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.DlzgRM_V.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.CLHK0heZ.js";import"./animations.BfNomghp.js";import"./virtualization.D3stoeJg.js";import"./tanstack-vendor.BbeFfzfD.js";import"./headlessui.BV2QIPYW.js";import"./framer-motion.BxrZXEJX.js";import"./http-client.D0DHqe6c.js";import"./validation.CXYwsuSc.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.DPzmCgFz.js";import"./math-katex.D41sMH58.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";function we(){const d=D(),o=V(),[x,y]=G(),{isAuthenticated:I,user:k}=Y(),P=o.pathname.includes("wappy-apps")||o.pathname==="/apps"||x.get("view")==="apps",[g,f]=s.useState(P?"apps":"hub"),[C,z]=s.useState(!1),[n,l]=s.useState(!1),[j,w]=s.useState(null),[r,W]=s.useState(()=>{try{return localStorage.getItem("wappy_theme_mode")==="dark"}catch{return!1}});s.useEffect(()=>{try{localStorage.setItem("wappy_theme_mode",r?"dark":"light"),r?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")}catch{}},[r]),s.useEffect(()=>{const a=()=>{const t=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;z(t>16)};return window.addEventListener("scroll",a,{passive:!0}),a(),()=>window.removeEventListener("scroll",a)},[]),s.useEffect(()=>(n?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[n]);const v=a=>{w(a),setTimeout(()=>{w(null)},3200)},S=()=>{W(a=>{const t=!a;return v(t?"🌙 Modo Oscuro activado":"☀️ Modo Claro activado"),t})};s.useEffect(()=>{const a=o.pathname.includes("wappy-apps")||o.pathname==="/apps"||x.get("view")==="apps"?"apps":"hub";f(a),l(!1),window.scrollTo({top:0,behavior:"smooth"})},[o.pathname,x]);const c=()=>{try{const a=new URLSearchParams(o.search||window.location.search),t=(a.get("ref")||a.get("referral")||a.get("r")||"").trim(),i=(localStorage.getItem("wappy_ref")||sessionStorage.getItem("wappy_ref")||"").trim(),p=t||i;if(p)return`?ref=${encodeURIComponent(p)}`}catch{}return""},b=()=>{l(!1);const a=c();if(I){d(k&&!H(k)?"/planes":"/c/new");return}d(`/login${a}`)},{isVerified:u,pendingApp:E,isGateOpen:T,setIsGateOpen:h,requireFollowBeforeOpen:O,handleGateVerified:R}=$(a=>{v(`✅ ¡Acceso verificado en @wappy_ia${a?` (@${a})`:""}!`)});s.useEffect(()=>{g==="apps"&&!u&&h(!0)},[g,u,h]);const m=()=>{l(!1),f("apps");const a=new URLSearchParams(x);a.set("view","apps"),y(a),u||h(!0)},A=()=>{if(l(!1),o.pathname.includes("wappy-apps")||o.pathname==="/apps"){d(`/portal${c()}`);return}f("hub");const a=new URLSearchParams(x);a.delete("view"),y(a)},N=a=>{a.path&&(window.location.href=F(Q(a.path)))},L=a=>t=>{t&&t.preventDefault(),O(a,N)},M=_.map(a=>({...a,onOpen:a.badgeTone==="active"&&a.path?L(a):void 0}));return e.jsxs("div",{className:`mkt wappy-portal-page ${r?"mkt-dark":""}`,children:[e.jsx(U,{isOpen:T,onClose:()=>h(!1),targetApp:E,onVerified:(a,t)=>R(a,t,N)}),e.jsx("style",{children:`
        .wappy-portal-page {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at 18% 12%, rgba(91, 184, 245, 0.35) 0%, rgba(91, 184, 245, 0) 48%),
            radial-gradient(circle at 82% 18%, rgba(199, 243, 3, 0.22) 0%, rgba(199, 243, 3, 0) 45%),
            linear-gradient(180deg, #dff1fd 0%, #f1f8fe 32%, #f6f7f9 100%);
          transition: background 0.3s ease, color 0.3s ease;
        }

        .wappy-portal-page.mkt-dark {
          background:
            radial-gradient(ellipse 120% 70% at 50% 0%, #0b2239 0%, #071526 52%, #050b14 100%) !important;
          color: #f8fafc;
        }

        @keyframes felix-avatar-float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-6px) scale(1.015);
          }
        }

        /* Importante: No usar .wrap en el <main> directamente porque marketing.css tiene
           @media (max-width: 640px) { .mkt .wrap { padding: 0 16px !important; } }
           lo cual borraba el padding-top y metía el contenido debajo del navbar fijo. */
        .portal-main-shell {
          flex: 1;
          width: 100%;
          padding-top: 118px;
          padding-bottom: 72px;
        }

        .portal-eyebrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 7px 16px;
          border-radius: 9999px;
          background: rgba(14, 19, 0, 0.92);
          color: #c7f303;
          font-size: clamp(10.5px, 2.6vw, 13px);
          font-weight: 700;
          line-height: 1.3;
          max-width: 100%;
          margin-bottom: 16px;
          border: 1px solid rgba(199, 243, 3, 0.28);
        }

        .portal-eyebrow .tdot {
          background: #c7f303;
          border-radius: 9999px;
          width: 7px;
          height: 7px;
          flex-shrink: 0;
          animation: 1.8s ease-in-out infinite mkt-pulse;
        }

        .portal-hero-title {
          font-size: clamp(26px, 5vw, 50px);
          font-weight: 800;
          color: #0e1300;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 12px;
        }

        .wappy-portal-page.mkt-dark .portal-hero-title {
          color: #f8fafc;
        }

        .portal-hero-sub {
          font-size: clamp(14px, 2vw, 17.5px);
          color: #475569;
          line-height: 1.55;
          margin: 0;
          font-weight: 500;
        }

        .wappy-portal-page.mkt-dark .portal-hero-sub {
          color: #cbd5e1;
        }

        .portal-hero-sub strong {
          color: #0f172a;
        }

        .wappy-portal-page.mkt-dark .portal-hero-sub strong {
          color: #c7f303;
        }

        .portal-main-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
          gap: 28px;
          inline-size: 100%;
          max-inline-size: 1080px;
          margin-inline: auto;
        }

        .portal-choice-card {
          position: relative;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 30px;
          border: 2px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 20px 50px -15px rgba(15, 23, 42, 0.12);
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, background 0.3s ease;
        }

        .wappy-portal-page.mkt-dark .portal-choice-card {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(51, 65, 85, 0.85);
          box-shadow: 0 22px 55px -15px rgba(0, 0, 0, 0.55);
        }

        .portal-choice-card:hover {
          transform: translateY(-6px);
        }

        .portal-choice-card.card-ia:hover {
          border-color: #10b981;
          box-shadow: 0 28px 65px -12px rgba(16, 185, 129, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.28);
        }

        .portal-choice-card.card-apps:hover {
          border-color: #f59e0b;
          box-shadow: 0 28px 65px -12px rgba(245, 158, 11, 0.26), 0 0 0 4px rgba(251, 191, 36, 0.24);
        }

        .portal-stage {
          position: relative;
          min-block-size: 315px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 16px 18px 14px;
        }

        .portal-stage-ia {
          background:
            radial-gradient(circle at 50% 42%, rgba(250, 204, 21, 0.24) 0%, rgba(16, 185, 129, 0.22) 38%, rgba(6, 20, 17, 0) 74%),
            linear-gradient(145deg, #041310 0%, #092620 52%, #0e1300 100%);
        }

        .portal-stage-apps {
          background:
            radial-gradient(circle at 50% 45%, rgba(251, 191, 36, 0.28) 0%, rgba(14, 165, 233, 0.2) 42%, rgba(15, 23, 42, 0) 74%),
            linear-gradient(145deg, #0b192c 0%, #102a43 52%, #1e293b 100%);
        }

        .portal-stage-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
        }

        .portal-stage-top-bar {
          position: relative;
          z-index: 30;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .portal-stage-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          line-height: 1.2;
        }

        .felix-avatar-wrapper {
          position: relative;
          z-index: 20;
          height: 245px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: felix-avatar-float 3.4s ease-in-out infinite;
          filter: drop-shadow(0 16px 28px rgba(0, 0, 0, 0.45));
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .portal-choice-card.card-apps:hover .felix-avatar-wrapper {
          transform: scale(1.05) translateY(-4px);
        }

        .portal-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 26px 28px 28px;
        }

        .portal-card-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          line-height: 1.35;
        }

        .portal-card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .portal-card-title {
          font-size: clamp(26px, 5.5vw, 32px);
          font-weight: 900;
          color: #0e1300;
          margin: 0;
          letter-spacing: -0.02em;
          white-space: nowrap;
          line-height: 1.1;
        }

        .wappy-portal-page.mkt-dark .portal-card-title {
          color: #f8fafc;
        }

        .portal-card-desc {
          font-size: clamp(13.5px, 1.8vw, 14.5px);
          color: #475569;
          line-height: 1.55;
          margin: 0 0 16px;
        }

        .wappy-portal-page.mkt-dark .portal-card-desc {
          color: #cbd5e1;
        }

        .portal-card-desc strong {
          color: #0f172a;
        }

        .wappy-portal-page.mkt-dark .portal-card-desc strong {
          color: #f8fafc;
        }

        .portal-card-status-pill {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 9999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .portal-chips-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }

        .portal-chip {
          font-size: 12px;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 10px;
          line-height: 1.3;
        }

        .wappy-portal-page.mkt-dark .portal-chip.chip-ia {
          background: rgba(30, 41, 59, 0.85) !important;
          border-color: rgba(51, 65, 85, 0.9) !important;
          color: #e2e8f0 !important;
        }

        .wappy-portal-page.mkt-dark .portal-chip.chip-apps {
          background: rgba(245, 158, 11, 0.14) !important;
          border-color: rgba(245, 158, 11, 0.35) !important;
          color: #fde68a !important;
        }

        .portal-cta-btn {
          width: 100%;
          justify-content: space-between;
          padding: 0 12px 0 24px !important;
          height: 54px !important;
          font-size: 16px !important;
          font-weight: 800 !important;
        }

        .portal-apps-banner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          background: linear-gradient(135deg, #0b192c 0%, #102a43 60%, #0f172a 100%);
          border-radius: 28px;
          padding: 24px 30px;
          margin-bottom: 28px;
          color: #fff;
          box-shadow: 0 20px 45px -15px rgba(15, 23, 42, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .portal-apps-banner-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(8px);
          white-space: nowrap;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .portal-apps-banner-back:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .portal-apps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
          gap: 24px;
          inline-size: 100%;
          max-inline-size: 1120px;
          margin-inline: auto;
        }

        .app-item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: #ffffff;
          border-radius: 26px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s ease, border-color 0.25s ease, background 0.3s ease;
          box-shadow: 0 14px 34px -12px rgba(15, 23, 42, 0.08);
        }

        .wappy-portal-page.mkt-dark .app-item-card {
          background: rgba(15, 23, 42, 0.92);
          border-color: rgba(51, 65, 85, 0.85);
          box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.5);
        }

        .app-item-card.is-active {
          border-color: rgba(13, 148, 136, 0.45);
          box-shadow: 0 20px 45px -12px rgba(13, 148, 136, 0.18);
          cursor: pointer;
        }

        .wappy-portal-page.mkt-dark .app-item-card.is-active {
          border-color: rgba(20, 184, 166, 0.55);
        }

        .app-item-card.is-active:hover {
          transform: translateY(-6px);
          border-color: #0d9488;
          box-shadow: 0 26px 55px -12px rgba(13, 148, 136, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.3);
        }

        .app-item-card.is-soon {
          opacity: 0.92;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
        }

        .wappy-portal-page.mkt-dark .app-item-card.is-soon {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.88) 0%, rgba(9, 14, 26, 0.92) 100%);
        }

        .app-card-meta-strip {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding: 10px 14px;
          background: #0b1320;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }

        .app-card-title {
          font-size: clamp(19px, 3.8vw, 22px);
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          line-height: 1.2;
        }

        .wappy-portal-page.mkt-dark .app-card-title {
          color: #f8fafc;
        }

        .app-card-desc {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.55;
          margin: 0 0 14px;
        }

        .wappy-portal-page.mkt-dark .app-card-desc {
          color: #cbd5e1;
        }

        .app-card-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 8px;
        }

        .app-card-tag.tag-active {
          background: #f0fdfa;
          color: #0f766e;
          border: 1px solid #99f6e4;
        }

        .wappy-portal-page.mkt-dark .app-card-tag.tag-active {
          background: rgba(13, 148, 136, 0.18);
          color: #5eead4;
          border: 1px solid rgba(45, 212, 191, 0.35);
        }

        .app-card-tag.tag-soon {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }

        .wappy-portal-page.mkt-dark .app-card-tag.tag-soon {
          background: rgba(30, 41, 59, 0.8);
          color: #94a3b8;
          border: 1px solid rgba(51, 65, 85, 0.8);
        }

        .portal-label-mobile {
          display: none;
        }

        .portal-label-desktop {
          display: inline;
        }

        /* =========================================================
           MOBILE & TABLET RESPONSIVE BREAKPOINTS
           ========================================================= */
        @media (max-width: 640px) {
          .portal-main-shell {
            padding-top: 82px !important;
            padding-bottom: 44px !important;
          }

          .portal-label-desktop {
            display: none;
          }

          .portal-label-mobile {
            display: inline;
          }

          .portal-main-grid {
            gap: 20px;
          }

          .portal-choice-card {
            border-radius: 24px;
          }

          .portal-stage {
            min-block-size: 270px;
            padding: 12px 12px 10px;
          }

          .portal-stage-pill {
            font-size: 10px;
            padding: 4px 9px;
            gap: 5px;
          }

          .felix-avatar-wrapper {
            height: 210px;
          }

          .portal-card-body {
            padding: 20px 18px 20px;
          }

          .portal-card-kicker {
            font-size: 10.5px;
          }

          .portal-card-status-pill {
            font-size: 10.5px;
            padding: 3.5px 9px;
          }

          .portal-chips-wrap {
            gap: 6px;
            margin-bottom: 18px;
          }

          .portal-chip {
            font-size: 11px;
            padding: 4px 9px;
          }

          .portal-cta-btn {
            height: 50px !important;
            font-size: 15px !important;
            padding: 0 10px 0 18px !important;
          }

          .portal-apps-banner {
            padding: 18px 16px;
            border-radius: 22px;
            margin-bottom: 20px;
            gap: 14px;
          }

          .portal-apps-banner-back {
            width: 100%;
            padding: 10px 16px;
            font-size: 13px;
          }

          .app-item-card {
            border-radius: 22px;
          }

          .app-card-meta-strip {
            padding: 8px 12px;
          }
        }

        @media (max-width: 380px) {
          .portal-stage-pill {
            font-size: 9.2px;
            padding: 3.5px 7.5px;
          }
        }
      `}),j&&e.jsx("div",{style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#0e1300",color:"#c7f303",padding:"10px 20px",borderRadius:9999,fontSize:13,fontWeight:800,boxShadow:"0 12px 30px rgba(0,0,0,0.35)",border:"1px solid rgba(199,243,3,0.4)",whiteSpace:"nowrap"},children:j}),n&&e.jsx("div",{className:"mkt-mobile-menu-backdrop",onClick:()=>l(!1),"aria-hidden":"true"}),e.jsxs("nav",{className:"mkt-nav","aria-label":"Navegación principal WAPPY",children:[e.jsxs("div",{className:`mkt-nav-inner ${C?"scrolled":""}`,children:[e.jsxs("a",{className:"mkt-nav-logo","aria-label":"WAPPY IA - Ecosistema SG-SST Inteligente",href:"/",onClick:a=>{a.preventDefault(),l(!1),d(`/${c()}`)},children:[e.jsx("img",{src:"/marketing/wappy-cat-logo.png",alt:"WAPPY Logo",className:"mkt-logo-icon"}),e.jsxs("div",{className:"mkt-logo-text",children:[e.jsxs("span",{className:"mkt-logo-title",children:["WAPPY",e.jsx("span",{children:"IA"})]}),e.jsx("span",{className:"mkt-logo-sub",children:"SOMOS SST"})]})]}),e.jsxs("div",{className:"mkt-nav-links",children:[e.jsx("a",{href:"/",onClick:a=>{a.preventDefault(),d(`/${c()}`)},children:"Inicio"}),e.jsx("a",{href:"/portal?view=apps",onClick:a=>{a.preventDefault(),m()},style:g==="apps"?{color:"#0d9488",fontWeight:800}:void 0,children:"Wappy APPs"})]}),e.jsxs("div",{className:"mkt-nav-cta",children:[e.jsx("button",{type:"button",onClick:S,className:"mkt-theme-toggle-btn",title:r?"Cambiar a Modo Claro":"Cambiar a Modo Oscuro","aria-label":r?"Cambiar a Modo Claro":"Cambiar a Modo Oscuro",children:e.jsx("span",{children:r?"☀️":"🌙"})}),g==="apps"?e.jsx("button",{type:"button",className:"btn btn-ghost mkt-nav-signin",onClick:A,children:"← Volver a Selección"}):e.jsx("button",{type:"button",className:"btn btn-ghost mkt-nav-signin",onClick:()=>d(`/${c()}`),children:"← Volver al inicio"}),e.jsxs("button",{type:"button",className:"btn btn-lime btn-sm",onClick:b,children:[e.jsx("span",{className:"portal-label-desktop",children:"Ingresar a Wappy IA"}),e.jsx("span",{className:"portal-label-mobile",children:"Wappy IA"})]}),e.jsxs("button",{type:"button",className:`mkt-hamburger-btn ${n?"active":""}`,onClick:()=>l(!n),"aria-label":n?"Cerrar menú":"Abrir menú","aria-expanded":n,children:[e.jsx("span",{className:"mkt-hamburger-bar"}),e.jsx("span",{className:"mkt-hamburger-bar"}),e.jsx("span",{className:"mkt-hamburger-bar"})]})]})]}),n&&e.jsxs("div",{className:"mkt-mobile-menu-drawer",children:[e.jsxs("div",{className:"mkt-mobile-menu-links",children:[e.jsxs("button",{type:"button",className:"mkt-mobile-link",onClick:()=>{l(!1),d(`/${c()}`)},children:[e.jsx("span",{className:"mkt-mobile-link-icon",children:"🏠"}),e.jsxs("div",{className:"mkt-mobile-link-info",children:[e.jsx("span",{className:"mkt-mobile-link-title",children:"Inicio"}),e.jsx("span",{className:"mkt-mobile-link-desc",children:"Volver a la portada principal de WAPPY"})]})]}),e.jsxs("button",{type:"button",className:"mkt-mobile-link",onClick:m,children:[e.jsx("span",{className:"mkt-mobile-link-icon",children:"🛠️"}),e.jsxs("div",{className:"mkt-mobile-link-info",children:[e.jsx("span",{className:"mkt-mobile-link-title",children:"Wappy APPs"}),e.jsx("span",{className:"mkt-mobile-link-desc",children:"Explorar suite de aplicaciones interactivas"})]})]})]}),e.jsx("div",{className:"mkt-mobile-menu-divider"}),e.jsxs("div",{className:"mkt-mobile-menu-actions",children:[e.jsx("button",{type:"button",className:"btn btn-outline-dark",style:{width:"100%",justifyContent:"center",minHeight:46},onClick:S,children:r?"☀️ Cambiar a Modo Claro":"🌙 Cambiar a Modo Oscuro"}),e.jsx("button",{type:"button",className:"btn btn-primary",style:{width:"100%",justifyContent:"center",minHeight:46},onClick:b,children:"Ingresar a Wappy IA (Login)"})]})]})]}),e.jsx("main",{className:"portal-main-shell",children:e.jsx("div",{className:"wrap",children:g==="hub"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{textAlign:"center",maxWidth:760,margin:"0 auto 30px"},children:[e.jsxs("div",{className:"portal-eyebrow",children:[e.jsx("span",{className:"tdot"}),e.jsx("span",{children:"PORTAL DE ACCESO OFICIAL · ECOSISTEMA WAPPY"})]}),e.jsx("h1",{className:"display portal-hero-title",children:"¿A dónde deseas ingresar hoy?"}),e.jsxs("p",{className:"portal-hero-sub",children:["Selecciona entre nuestra plataforma central de Inteligencia Artificial con"," ",e.jsx("strong",{children:"Tenshi IA"})," o nuestra suite de aplicaciones interactivas directas en"," ",e.jsx("strong",{children:"Wappy APPs"}),"."]})]}),e.jsxs("div",{className:"portal-main-grid",children:[e.jsxs("article",{className:"portal-choice-card card-ia",onClick:b,role:"button",tabIndex:0,"aria-label":"Ingresar a Wappy IA - Ir al Login",onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),b())},children:[e.jsxs("div",{className:"portal-stage portal-stage-ia",children:[e.jsx("div",{className:"portal-stage-grid"}),e.jsxs("div",{className:"portal-stage-top-bar",children:[e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(16, 185, 129, 0.18)",border:"1px solid rgba(52, 211, 153, 0.45)",color:"#a7f3d0"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#c7f303",boxShadow:"0 0 8px #c7f303",flexShrink:0}}),e.jsx("span",{children:"ORQUESTADOR IA 24/7"})]}),e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(250, 204, 21, 0.16)",border:"1px solid rgba(250, 204, 21, 0.5)",color:"#fef08a"},children:[e.jsx("span",{className:"portal-label-desktop",children:"😇 Tenshi + +20 Agentes"}),e.jsx("span",{className:"portal-label-mobile",children:"😇 +20 Agentes IA"})]})]}),e.jsx("div",{style:{position:"relative",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:6},children:e.jsx(B,{size:215,mood:"idle",showHaloEffect:!0,showHUD:!0,interactive:!1})}),e.jsx("div",{style:{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:170,height:20,borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(199, 243, 3, 0.45) 0%, rgba(16, 185, 129, 0) 75%)",filter:"blur(6px)",pointerEvents:"none"}})]}),e.jsxs("div",{className:"portal-card-body",children:[e.jsxs("div",{children:[e.jsx("div",{className:"portal-card-kicker",style:{color:"#14b8a6"},children:e.jsx("span",{children:"✨ PLATAFORMA CENTRAL SG-SST"})}),e.jsxs("div",{className:"portal-card-title-row",children:[e.jsxs("h2",{className:"display portal-card-title",children:["Wappy ",e.jsx("span",{style:{color:"#22c55e"},children:"IA"})]}),e.jsx("span",{className:"portal-card-status-pill",style:{background:r?"rgba(16, 185, 129, 0.18)":"#ecfdf5",color:r?"#6ee7b7":"#047857",border:r?"1px solid rgba(52, 211, 153, 0.4)":"1px solid #a7f3d0"},children:"Acceso a Cuenta / Login"})]}),e.jsxs("p",{className:"portal-card-desc",children:["Ingresa al ecosistema completo del SG-SST liderado por"," ",e.jsx("strong",{children:"Tenshi IA"}),". Gestiona los 8 Hitos preventivos, Metodología del Bioindividuo, Comités QR, Academia LMS y consulta en tiempo real a más de 20 especialistas autónomos."]}),e.jsx("div",{className:"portal-chips-wrap",children:["🤖 +20 Agentes Especialistas SST","🧬 Metodología del Bioindividuo","🎙️ Voz en Vivo con Tenshi","🎓 Academia LMS & Comités QR"].map(a=>e.jsx("span",{className:"portal-chip chip-ia",style:{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#1e293b"},children:a},a))})]}),e.jsxs("button",{type:"button",className:"btn btn-primary portal-cta-btn",onClick:a=>{a.stopPropagation(),b()},children:[e.jsx("span",{children:"Ingresar a Wappy IA"}),e.jsx("span",{className:"pip",style:{width:34,height:34,flexShrink:0},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#0E1300",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]})]}),e.jsxs("article",{className:"portal-choice-card card-apps",onClick:m,role:"button",tabIndex:0,"aria-label":"Ingresar a Wappy APPs - Ver tarjetas de aplicaciones",onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),m())},children:[e.jsxs("div",{className:"portal-stage portal-stage-apps",children:[e.jsx("div",{className:"portal-stage-grid"}),e.jsxs("div",{className:"portal-stage-top-bar",children:[e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(245, 158, 11, 0.2)",border:"1px solid rgba(251, 191, 36, 0.5)",color:"#fde68a"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#fbbf24",boxShadow:"0 0 8px #fbbf24",flexShrink:0}}),e.jsx("span",{children:"SUITE DE APLICATIVOS"})]}),e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(56, 189, 248, 0.18)",border:"1px solid rgba(56, 189, 248, 0.45)",color:"#bae6fd"},children:[e.jsx("span",{className:"portal-label-desktop",children:"⚡ Herramientas SST en Vivo"}),e.jsx("span",{className:"portal-label-mobile",children:"⚡ SST en Vivo"})]})]}),e.jsx("div",{className:"felix-avatar-wrapper",children:e.jsx("img",{src:"/assets/felix_avatar_3d.png",alt:"Avatar Wappy APPs",style:{height:"100%",width:"auto",objectFit:"contain",display:"block",userSelect:"none"}})}),e.jsx("div",{style:{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:170,height:20,borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(251, 191, 36, 0.5) 0%, rgba(14, 165, 233, 0) 75%)",filter:"blur(6px)",pointerEvents:"none"}})]}),e.jsxs("div",{className:"portal-card-body",children:[e.jsxs("div",{children:[e.jsx("div",{className:"portal-card-kicker",style:{color:"#f59e0b"},children:e.jsx("span",{children:"🛠️ APLICACIONES INTERACTIVAS DE ACCESO DIRECTO"})}),e.jsxs("div",{className:"portal-card-title-row",children:[e.jsxs("h2",{className:"display portal-card-title",children:["Wappy ",e.jsx("span",{style:{color:"#f59e0b"},children:"APPs"})]}),e.jsx("span",{className:"portal-card-status-pill",style:{background:r?"rgba(245, 158, 11, 0.18)":"#fffbeb",color:r?"#fde68a":"#b45309",border:r?"1px solid rgba(251, 191, 36, 0.4)":"1px solid #fde68a"},children:"Catálogo de Apps"})]}),e.jsxs("p",{className:"portal-card-desc",children:["Ingresa a nuestra colección de aplicativos especializados listos para usar al instante: la ",e.jsx("strong",{children:"APP de Matriz IPVR (GTC 45)"})," y"," ",e.jsx("strong",{children:"WAPPY Studio (Voz 24kHz & Video Cápsulas GSAP)"})," con IA integrada."]}),e.jsx("div",{className:"portal-chips-wrap",children:["📊 APP Matriz IPVR (GTC 45)","🎬 APP WAPPY Studio (Voz & Video)","🧠 IA Gemini Integrada","🖨️ Informes A4, Excel & Cápsulas"].map(a=>e.jsx("span",{className:"portal-chip chip-apps",style:{background:"#fffbeb",border:"1px solid #fde68a",color:"#78350f"},children:a},a))})]}),e.jsxs("button",{type:"button",className:"btn btn-lime portal-cta-btn",onClick:a=>{a.stopPropagation(),m()},style:{border:"2px solid #0e1300"},children:[e.jsx("span",{children:"Explorar Wappy APPs"}),e.jsx("span",{style:{width:34,height:34,borderRadius:9999,background:"#0e1300",color:"#c7f303",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#c7f303",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]})]})]})]}):e.jsxs("div",{children:[e.jsxs("div",{className:"portal-apps-banner",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{width:68,height:68,borderRadius:18,background:"radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.35), rgba(15, 23, 42, 0.9))",border:"2px solid #fbbf24",display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden",flexShrink:0},children:e.jsx("img",{src:"/assets/felix_avatar_3d.png",alt:"Avatar Wappy APPs",style:{height:"94%",width:"auto",objectFit:"contain",display:"block"}})}),e.jsxs("div",{style:{flex:"1 1 210px",minWidth:0},children:[e.jsx("div",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",color:"#fde047",marginBottom:4},children:e.jsx("span",{children:"🚀 SUITE DE APLICACIONES ESPECIALIZADAS"})}),e.jsxs("h1",{className:"display",style:{fontSize:"clamp(22px, 3.5vw, 34px)",fontWeight:900,color:"#ffffff",margin:0},children:["Wappy ",e.jsx("span",{style:{color:"#c7f303"},children:"APPs"})]}),e.jsx("p",{style:{fontSize:13.5,color:"rgba(255, 255, 255, 0.84)",margin:"4px 0 0",maxWidth:620,lineHeight:1.45},children:"Selecciona la aplicación especializada que deseas abrir. Herramientas prácticas diseñadas para multiplicar tu velocidad en Seguridad y Salud en el Trabajo."})]})]}),e.jsx("button",{type:"button",onClick:A,className:"portal-apps-banner-back",children:e.jsx("span",{children:"← Volver a Selección"})})]}),e.jsx("div",{className:"portal-apps-grid",children:M.map(a=>{const t=a.badgeTone==="active";return e.jsxs("article",{className:`app-item-card ${t?"is-active":"is-soon"}`,onClick:t&&a.onOpen?a.onOpen:void 0,role:t?"button":void 0,tabIndex:t?0:void 0,onKeyDown:t&&a.onOpen?i=>{var p;(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),(p=a.onOpen)==null||p.call(a))}:void 0,children:[e.jsxs("div",{children:[e.jsxs("div",{className:"app-card-meta-strip",children:[e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:6,padding:"3.5px 10px",borderRadius:9999,background:t?"rgba(199, 243, 3, 0.16)":"rgba(148, 163, 184, 0.18)",border:t?"1px solid rgba(199, 243, 3, 0.45)":"1px solid rgba(148, 163, 184, 0.3)",color:t?"#c7f303":"#cbd5e1",fontSize:10,fontWeight:900,letterSpacing:"0.03em",whiteSpace:"nowrap"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:t?"#c7f303":"#94a3b8",flexShrink:0}}),e.jsx("span",{children:a.badge})]}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:a.normative})]}),a.image?e.jsx("div",{style:{position:"relative",aspectRatio:"16 / 9",width:"100%",background:"#091526",overflow:"hidden",borderBottom:r?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0"},children:e.jsx("img",{src:a.image,alt:a.title,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})}):a.visualType==="wappy-studio"?e.jsxs("div",{style:{position:"relative",aspectRatio:"16 / 9",width:"100%",background:"radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.28) 0%, rgba(13, 148, 136, 0.25) 45%, rgba(6, 15, 28, 0.98) 100%), linear-gradient(135deg, #071120 0%, #0f172a 50%, #1e1b4b 100%)",overflow:"hidden",borderBottom:r?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 12px"},children:[e.jsxs("div",{style:{textAlign:"center",zIndex:2},children:[e.jsx("div",{style:{fontSize:"clamp(15px, 3vw, 19px)",fontWeight:900,color:"#c7f303",letterSpacing:"0.02em",lineHeight:1.1},children:"WAPPY STUDIO · VOZ & VIDEO IA"}),e.jsx("div",{style:{fontSize:10.5,color:"#5eead4",fontWeight:700,marginTop:2},children:"Locución 24kHz Gemini 2.5 · Cápsulas GSAP 16:9 y 9:16"})]}),e.jsxs("div",{style:{zIndex:2,width:"100%",maxWidth:290,background:"rgba(15, 23, 42, 0.85)",border:"1px solid rgba(199, 243, 3, 0.35)",borderRadius:14,padding:"10px 12px",boxShadow:"0 12px 28px rgba(0, 0, 0, 0.45)",display:"flex",flexDirection:"column",gap:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},children:[e.jsxs("span",{style:{fontSize:10,fontWeight:800,color:"#f8fafc",display:"inline-flex",alignItems:"center",gap:5},children:[e.jsx("span",{children:"🎙️"})," Pista Master 24kHz"]}),e.jsx("span",{style:{fontSize:9.5,fontWeight:800,padding:"2px 7px",borderRadius:9999,background:"#c7f303",color:"#0e1300"},children:"HTML + GSAP"})]}),e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:3,height:22},children:[45,80,60,95,50,88,100,70,40,85,65,92,55,78,48,82,60,38].map((i,p)=>e.jsx("span",{style:{flex:1,height:`${i}%`,borderRadius:9999,background:p%2===0?"#c7f303":"#2dd4bf"}},p))})]}),e.jsx("div",{style:{zIndex:2,display:"inline-flex",alignItems:"center",gap:8,padding:"3px 12px",borderRadius:9999,background:"rgba(16, 185, 129, 0.2)",border:"1px solid rgba(52, 211, 153, 0.45)",color:"#a7f3d0",fontSize:10,fontWeight:800},children:e.jsx("span",{children:"⚡ Acceso Directo · Exportación .WAV y .HTML"})})]}):e.jsx("div",{style:{position:"relative",height:140,background:r?"linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)":"linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:r?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0"},children:e.jsx("div",{style:{width:62,height:62,borderRadius:18,background:r?"#1e293b":"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 10px 25px rgba(15, 23, 42, 0.12)"},children:a.icon})}),e.jsxs("div",{style:{padding:"18px 20px 14px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6},children:[e.jsx("span",{style:{fontSize:22,flexShrink:0},children:a.icon}),e.jsx("h3",{className:"display app-card-title",children:a.title})]}),e.jsx("div",{style:{fontSize:12.5,fontWeight:800,color:t?r?"#2dd4bf":"#0d9488":"#64748b",marginBottom:10,lineHeight:1.35},children:a.subtitle}),e.jsx("p",{className:"app-card-desc",children:a.description}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10},children:a.tags.map(i=>e.jsx("span",{className:`app-card-tag ${t?"tag-active":"tag-soon"}`,children:i},i))})]})]}),e.jsx("div",{style:{padding:"0 20px 20px"},children:t&&a.href?e.jsxs("a",{href:a.href,onClick:a.onOpen,className:"btn btn-primary",style:{width:"100%",justifyContent:"space-between",padding:"0 12px 0 18px",height:50,fontSize:14.5,fontWeight:800,textDecoration:"none"},children:[e.jsx("span",{children:a.ctaLabel}),e.jsx("span",{className:"pip",style:{width:32,height:32,flexShrink:0},children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"#0E1300",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]}):e.jsxs("button",{type:"button",disabled:!0,style:{width:"100%",height:48,borderRadius:9999,border:r?"1px dashed #334155":"1px dashed #cbd5e1",background:r?"rgba(30, 41, 59, 0.5)":"#f8fafc",color:"#64748b",fontSize:13.5,fontWeight:700,cursor:"not-allowed"},children:["🔒 ",a.ctaLabel]})})]},a.id)})})]})})})]})}export{we as default};
