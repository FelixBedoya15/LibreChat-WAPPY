import{r as n,j as e}from"./react-core.DnLkJYlj.js";import{a as F,u as Q,b as K}from"./routing.G8zv3X9f.js";import{u as q,a4 as E,a2 as Z}from"./index.D6CbSi70.js";import{u as X,W as J,I as ee,a as ae,r as te}from"./InstagramFollowGateModal.CiCFaksU.js";import"./vendor.CuWh8rdW.js";import"./utilities.CCKZG3yh.js";/* empty css                  */import"./markdown_highlight.Cj_heSZW.js";import"./locales.DGMWYUix.js";import"./i18n.CdklldLM.js";import"./radix-ui.JFOo4_25.js";import"./avatars.Cl1qbG22.js";import"./advanced-inputs.EA7jKbT9.js";import"./animations.BfsvY-QJ.js";import"./virtualization.Rcdi2ygP.js";import"./tanstack-vendor.B4RQyNlb.js";import"./headlessui.B6b0_h62.js";import"./framer-motion.rIlKLafi.js";import"./http-client.D_CJhV6g.js";import"./validation.CXYwsuSc.js";import"./date-utils.X8D4nCrw.js";import"./forms.PdoLQ5-c.js";import"./security-ui.Bga5GGyP.js";import"./markdown-processing.B7jF8Uuc.js";import"./math-katex.D41sMH58.js";import"./heic-converter.BhQCFQ0l.js";import"./canvas-templates.BS0AxzrQ.js";function Pe(){const d=F(),p=Q(),[h,I]=K(),{isAuthenticated:N,user:x}=q(),O=p.pathname.includes("wappy-apps")||p.pathname==="/apps"||h.get("view")==="apps",[f,k]=n.useState(O?"apps":"hub"),[D,L]=n.useState(!1),[c,l]=n.useState(!1),[C,z]=n.useState(null),[M,w]=n.useState(!1),P=["cristhian@mauricioposadac.com","mauricioposadac@gmail.com"],v=!!(N&&x&&(x.role==="ADMIN"||x.role==="admin"||P.includes((x.email||"").toLowerCase()))),V=typeof window<"u"&&(new URLSearchParams(window.location.search).get("admin")==="1"||localStorage.getItem("wappy_dots_admin")==="1"),i=v||M||V;n.useEffect(()=>{let a=!1;async function r(){if(v){w(!0);return}try{const s=await fetch("/api/auth/refresh",{method:"POST",credentials:"include"});if(s.ok){const o=await s.json(),j=o==null?void 0:o.user;if(j&&(j.role==="ADMIN"||j.role==="admin"||P.includes((j.email||"").toLowerCase()))){a||w(!0);return}}}catch{}try{const s=await fetch("/api/comunidad/is-admin",{credentials:"include"});if(s.ok){const o=await s.json();(o==null?void 0:o.isAdmin)===!0&&!a&&w(!0)}}catch{}}return r(),()=>{a=!0}},[v]);const[t,H]=n.useState(()=>{try{return localStorage.getItem("wappy_theme_mode")==="dark"}catch{return!1}});n.useEffect(()=>{try{localStorage.setItem("wappy_theme_mode",t?"dark":"light"),t?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")}catch{}},[t]),n.useEffect(()=>{const a=()=>{const r=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;L(r>16)};return window.addEventListener("scroll",a,{passive:!0}),a(),()=>window.removeEventListener("scroll",a)},[]),n.useEffect(()=>(c?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[c]);const S=a=>{z(a),setTimeout(()=>{z(null)},3200)},W=()=>{H(a=>{const r=!a;return S(r?"🌙 Modo Oscuro activado":"☀️ Modo Claro activado"),r})};n.useEffect(()=>{const a=p.pathname.includes("wappy-apps")||p.pathname==="/apps"||h.get("view")==="apps"?"apps":"hub";k(a),l(!1),window.scrollTo({top:0,behavior:"smooth"})},[p.pathname,h]);const g=()=>{try{const a=new URLSearchParams(p.search||window.location.search),r=(a.get("ref")||a.get("referral")||a.get("r")||"").trim(),s=(localStorage.getItem("wappy_ref")||sessionStorage.getItem("wappy_ref")||"").trim(),o=r||s;if(o)return`?ref=${encodeURIComponent(o)}`}catch{}return""},b=()=>{l(!1);const a=g();if(N){d(x&&!Z(x)?"/planes":"/c/new");return}d(`/login${a}`)},{isVerified:A,pendingApp:B,isGateOpen:G,setIsGateOpen:y,requireFollowBeforeOpen:Y,handleGateVerified:U}=X(a=>{S(`✅ ¡Acceso verificado en @wappy_ia${a?` (@${a})`:""}!`)});n.useEffect(()=>{f==="apps"&&!A&&y(!0)},[f,A,y]);const m=()=>{l(!1),k("apps");const a=new URLSearchParams(h);a.set("view","apps"),I(a),A||y(!0)},R=()=>{if(l(!1),p.pathname.includes("wappy-apps")||p.pathname==="/apps"){d(`/portal${g()}`);return}k("hub");const a=new URLSearchParams(h);a.delete("view"),I(a)},T=a=>{a.path&&(window.location.href=ae(te(a.path)))},_=a=>r=>{r&&r.preventDefault(),Y(a,T)},u=()=>{if(l(!1),i){d("/wappy-dots");return}S("🔒 Wappy Dots estará disponible muy pronto · Acceso exclusivo para Administradores")},$=J.map(a=>a.id==="wappy-dots"?{...a,badge:i?"🔓 ACCESO ADMIN · DESCARGAR .ZIP":"🔒 MUY PRONTO · BLOQUEADO",badgeTone:i?"active":"soon",ctaLabel:i?"Entrar a Wappy Dots (Admin)":"🔒 Muy Pronto · Bloqueado",onOpen:()=>u()}:{...a,onOpen:a.badgeTone==="active"&&a.path?_(a):void 0});return e.jsxs("div",{className:`mkt wappy-portal-page ${t?"mkt-dark":""}`,children:[e.jsx(ee,{isOpen:G,onClose:()=>y(!1),targetApp:B,onVerified:(a,r)=>U(a,r,T)}),e.jsx("style",{children:`
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

        .portal-main-shell .wrap {
          max-width: 1380px !important;
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 22px;
          inline-size: 100%;
          max-inline-size: 1340px;
          margin-inline: auto;
        }

        @media (max-width: 960px) {
          .portal-main-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 680px) {
          .portal-main-grid {
            grid-template-columns: minmax(0, 1fr);
          }
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

        .portal-choice-card.card-dots:hover {
          border-color: #a855f7;
          box-shadow: 0 28px 65px -12px rgba(168, 85, 247, 0.28), 0 0 0 4px rgba(199, 243, 3, 0.25);
        }

        .portal-stage {
          position: relative;
          min-block-size: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          padding: 14px 14px 12px;
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

        .portal-stage-dots {
          background:
            radial-gradient(circle at 50% 42%, rgba(168, 85, 247, 0.32) 0%, rgba(16, 185, 129, 0.22) 42%, rgba(9, 13, 36, 0) 76%),
            linear-gradient(145deg, #090d24 0%, #15193b 52%, #071e26 100%);
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
          padding: 22px 22px 24px;
        }

        .portal-card-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
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
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .portal-card-title {
          font-size: clamp(23px, 2.5vw, 30px);
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
      `}),C&&e.jsx("div",{style:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#0e1300",color:"#c7f303",padding:"10px 20px",borderRadius:9999,fontSize:13,fontWeight:800,boxShadow:"0 12px 30px rgba(0,0,0,0.35)",border:"1px solid rgba(199,243,3,0.4)",whiteSpace:"nowrap"},children:C}),c&&e.jsx("div",{className:"mkt-mobile-menu-backdrop",onClick:()=>l(!1),"aria-hidden":"true"}),e.jsxs("nav",{className:"mkt-nav","aria-label":"Navegación principal WAPPY",children:[e.jsxs("div",{className:`mkt-nav-inner ${D?"scrolled":""}`,children:[e.jsxs("a",{className:"mkt-nav-logo","aria-label":"WAPPY IA - Ecosistema SG-SST Inteligente",href:"/",onClick:a=>{a.preventDefault(),l(!1),d(`/${g()}`)},children:[e.jsx("img",{src:"/marketing/wappy-cat-logo.png",alt:"WAPPY Logo",className:"mkt-logo-icon"}),e.jsxs("div",{className:"mkt-logo-text",children:[e.jsxs("span",{className:"mkt-logo-title",children:["WAPPY",e.jsx("span",{children:"IA"})]}),e.jsx("span",{className:"mkt-logo-sub",children:"SOMOS SST"})]})]}),e.jsxs("div",{className:"mkt-nav-links",children:[e.jsx("a",{href:"/",onClick:a=>{a.preventDefault(),d(`/${g()}`)},children:"Inicio"}),e.jsx("a",{href:"/portal?view=apps",onClick:a=>{a.preventDefault(),m()},style:f==="apps"?{color:"#0d9488",fontWeight:800}:void 0,children:"Wappy APPs"}),e.jsxs("a",{href:"/wappy-dots",onClick:a=>{a.preventDefault(),u()},children:["Wappy Dots ",i?"🔓":"🔒"]})]}),e.jsxs("div",{className:"mkt-nav-cta",children:[e.jsx("button",{type:"button",onClick:W,className:"mkt-theme-toggle-btn",title:t?"Cambiar a Modo Claro":"Cambiar a Modo Oscuro","aria-label":t?"Cambiar a Modo Claro":"Cambiar a Modo Oscuro",children:e.jsx("span",{children:t?"☀️":"🌙"})}),f==="apps"?e.jsx("button",{type:"button",className:"btn btn-ghost mkt-nav-signin",onClick:R,children:"← Volver a Selección"}):e.jsx("button",{type:"button",className:"btn btn-ghost mkt-nav-signin",onClick:()=>d(`/${g()}`),children:"← Volver al inicio"}),e.jsxs("button",{type:"button",className:"btn btn-lime btn-sm",onClick:b,children:[e.jsx("span",{className:"portal-label-desktop",children:"Ingresar a Wappy IA"}),e.jsx("span",{className:"portal-label-mobile",children:"Wappy IA"})]}),e.jsxs("button",{type:"button",className:`mkt-hamburger-btn ${c?"active":""}`,onClick:()=>l(!c),"aria-label":c?"Cerrar menú":"Abrir menú","aria-expanded":c,children:[e.jsx("span",{className:"mkt-hamburger-bar"}),e.jsx("span",{className:"mkt-hamburger-bar"}),e.jsx("span",{className:"mkt-hamburger-bar"})]})]})]}),c&&e.jsxs("div",{className:"mkt-mobile-menu-drawer",children:[e.jsxs("div",{className:"mkt-mobile-menu-links",children:[e.jsxs("button",{type:"button",className:"mkt-mobile-link",onClick:()=>{l(!1),d(`/${g()}`)},children:[e.jsx("span",{className:"mkt-mobile-link-icon",children:"🏠"}),e.jsxs("div",{className:"mkt-mobile-link-info",children:[e.jsx("span",{className:"mkt-mobile-link-title",children:"Inicio"}),e.jsx("span",{className:"mkt-mobile-link-desc",children:"Volver a la portada principal de WAPPY"})]})]}),e.jsxs("button",{type:"button",className:"mkt-mobile-link",onClick:m,children:[e.jsx("span",{className:"mkt-mobile-link-icon",children:"🛠️"}),e.jsxs("div",{className:"mkt-mobile-link-info",children:[e.jsx("span",{className:"mkt-mobile-link-title",children:"Wappy APPs"}),e.jsx("span",{className:"mkt-mobile-link-desc",children:"Explorar suite de aplicaciones interactivas"})]})]})]}),e.jsx("div",{className:"mkt-mobile-menu-divider"}),e.jsxs("div",{className:"mkt-mobile-menu-actions",children:[e.jsx("button",{type:"button",className:"btn btn-outline-dark",style:{width:"100%",justifyContent:"center",minHeight:46},onClick:W,children:t?"☀️ Cambiar a Modo Claro":"🌙 Cambiar a Modo Oscuro"}),e.jsx("button",{type:"button",className:"btn btn-primary",style:{width:"100%",justifyContent:"center",minHeight:46},onClick:b,children:"Ingresar a Wappy IA (Login)"})]})]})]}),e.jsx("main",{className:"portal-main-shell",children:e.jsx("div",{className:"wrap",children:f==="hub"?e.jsxs(e.Fragment,{children:[e.jsxs("div",{style:{textAlign:"center",maxWidth:760,margin:"0 auto 30px"},children:[e.jsxs("div",{className:"portal-eyebrow",children:[e.jsx("span",{className:"tdot"}),e.jsx("span",{children:"PORTAL DE ACCESO OFICIAL · ECOSISTEMA WAPPY"})]}),e.jsx("h1",{className:"display portal-hero-title",children:"¿A dónde deseas ingresar hoy?"}),e.jsxs("p",{className:"portal-hero-sub",children:["Selecciona entre nuestra plataforma central de Inteligencia Artificial con"," ",e.jsx("strong",{children:"Tenshi IA"}),", nuestra suite de aplicaciones interactivas en"," ",e.jsx("strong",{children:"Wappy APPs"})," o la isla inteligente de escritorio"," ",e.jsx("strong",{children:"Wappy Dots"}),"."]})]}),e.jsxs("div",{className:"portal-main-grid",children:[e.jsxs("article",{className:"portal-choice-card card-ia",onClick:b,role:"button",tabIndex:0,"aria-label":"Ingresar a Wappy IA - Ir al Login",onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),b())},children:[e.jsxs("div",{className:"portal-stage portal-stage-ia",children:[e.jsx("div",{className:"portal-stage-grid"}),e.jsxs("div",{className:"portal-stage-top-bar",children:[e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(16, 185, 129, 0.18)",border:"1px solid rgba(52, 211, 153, 0.45)",color:"#a7f3d0"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#c7f303",boxShadow:"0 0 8px #c7f303",flexShrink:0}}),e.jsx("span",{children:"ORQUESTADOR IA 24/7"})]}),e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(250, 204, 21, 0.16)",border:"1px solid rgba(250, 204, 21, 0.5)",color:"#fef08a"},children:[e.jsx("span",{className:"portal-label-desktop",children:"😇 Tenshi + +20 Agentes"}),e.jsx("span",{className:"portal-label-mobile",children:"😇 +20 Agentes IA"})]})]}),e.jsx("div",{style:{position:"relative",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",paddingTop:6},children:e.jsx(E,{size:215,mood:"idle",showHaloEffect:!0,showHUD:!0,interactive:!1})}),e.jsx("div",{style:{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:170,height:20,borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(199, 243, 3, 0.45) 0%, rgba(16, 185, 129, 0) 75%)",filter:"blur(6px)",pointerEvents:"none"}})]}),e.jsxs("div",{className:"portal-card-body",children:[e.jsxs("div",{children:[e.jsx("div",{className:"portal-card-kicker",style:{color:"#14b8a6"},children:e.jsx("span",{children:"✨ PLATAFORMA CENTRAL SG-SST"})}),e.jsxs("div",{className:"portal-card-title-row",children:[e.jsxs("h2",{className:"display portal-card-title",children:["Somos ",e.jsx("span",{style:{color:"#22c55e"},children:"SST"})]}),e.jsx("span",{className:"portal-card-status-pill",style:{background:t?"rgba(16, 185, 129, 0.18)":"#ecfdf5",color:t?"#6ee7b7":"#047857",border:t?"1px solid rgba(52, 211, 153, 0.4)":"1px solid #a7f3d0"},children:"Acceso a Cuenta / Login"})]}),e.jsxs("p",{className:"portal-card-desc",children:["Ingresa al ecosistema completo del SG-SST liderado por"," ",e.jsx("strong",{children:"Tenshi IA"}),". Gestiona los 8 Hitos preventivos, Metodología del Bioindividuo, Comités QR, Academia LMS y consulta en tiempo real a más de 20 especialistas autónomos."]}),e.jsx("div",{className:"portal-chips-wrap",children:["🤖 +20 Agentes Especialistas SST","🧬 Metodología del Bioindividuo","🎙️ Voz en Vivo con Tenshi","🎓 Academia LMS & Comités QR"].map(a=>e.jsx("span",{className:"portal-chip chip-ia",style:{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#1e293b"},children:a},a))})]}),e.jsxs("button",{type:"button",className:"btn btn-primary portal-cta-btn",onClick:a=>{a.stopPropagation(),b()},children:[e.jsx("span",{children:"Ingresar a Somos SST"}),e.jsx("span",{className:"pip",style:{width:34,height:34,flexShrink:0},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#0E1300",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]})]}),e.jsxs("article",{className:"portal-choice-card card-apps",onClick:m,role:"button",tabIndex:0,"aria-label":"Ingresar a Wappy APPs - Ver tarjetas de aplicaciones",onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),m())},children:[e.jsxs("div",{className:"portal-stage portal-stage-apps",children:[e.jsx("div",{className:"portal-stage-grid"}),e.jsxs("div",{className:"portal-stage-top-bar",children:[e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(245, 158, 11, 0.2)",border:"1px solid rgba(251, 191, 36, 0.5)",color:"#fde68a"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#fbbf24",boxShadow:"0 0 8px #fbbf24",flexShrink:0}}),e.jsx("span",{children:"SUITE DE APLICATIVOS"})]}),e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(56, 189, 248, 0.18)",border:"1px solid rgba(56, 189, 248, 0.45)",color:"#bae6fd"},children:[e.jsx("span",{className:"portal-label-desktop",children:"⚡ Herramientas SST en Vivo"}),e.jsx("span",{className:"portal-label-mobile",children:"⚡ SST en Vivo"})]})]}),e.jsx("div",{className:"felix-avatar-wrapper",children:e.jsx("img",{src:"/assets/felix_avatar_3d.png",alt:"Avatar Wappy APPs",style:{height:"100%",width:"auto",objectFit:"contain",display:"block",userSelect:"none"}})}),e.jsx("div",{style:{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:170,height:20,borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(251, 191, 36, 0.5) 0%, rgba(14, 165, 233, 0) 75%)",filter:"blur(6px)",pointerEvents:"none"}})]}),e.jsxs("div",{className:"portal-card-body",children:[e.jsxs("div",{children:[e.jsx("div",{className:"portal-card-kicker",style:{color:"#f59e0b"},children:e.jsx("span",{children:"🛠️ APLICACIONES INTERACTIVAS DE ACCESO DIRECTO"})}),e.jsxs("div",{className:"portal-card-title-row",children:[e.jsxs("h2",{className:"display portal-card-title",children:["Wappy ",e.jsx("span",{style:{color:"#f59e0b"},children:"APPs"})]}),e.jsx("span",{className:"portal-card-status-pill",style:{background:t?"rgba(245, 158, 11, 0.18)":"#fffbeb",color:t?"#fde68a":"#b45309",border:t?"1px solid rgba(251, 191, 36, 0.4)":"1px solid #fde68a"},children:"Catálogo de Apps"})]}),e.jsxs("p",{className:"portal-card-desc",children:["Ingresa a nuestra colección de aplicativos especializados listos para usar al instante: la ",e.jsx("strong",{children:"APP de Matriz IPVR (GTC 45)"})," y"," ",e.jsx("strong",{children:"WAPPY Studio (Voz 24kHz & Video Cápsulas GSAP)"})," con IA integrada."]}),e.jsx("div",{className:"portal-chips-wrap",children:["📊 APP Matriz IPVR (GTC 45)","🎬 APP WAPPY Studio (Voz & Video)","🧠 IA Gemini Integrada","🖨️ Informes A4, Excel & Cápsulas"].map(a=>e.jsx("span",{className:"portal-chip chip-apps",style:{background:"#fffbeb",border:"1px solid #fde68a",color:"#78350f"},children:a},a))})]}),e.jsxs("button",{type:"button",className:"btn btn-lime portal-cta-btn",onClick:a=>{a.stopPropagation(),m()},style:{border:"2px solid #0e1300"},children:[e.jsx("span",{children:"Explorar Wappy APPs"}),e.jsx("span",{style:{width:34,height:34,borderRadius:9999,background:"#0e1300",color:"#c7f303",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#c7f303",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]})]})]}),e.jsxs("article",{className:"portal-choice-card card-dots",onClick:u,role:"button",tabIndex:0,"aria-label":"Wappy Dots - Isla Inteligente en tu Computador con Tenshi IA",onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),u())},children:[e.jsxs("div",{className:"portal-stage portal-stage-dots",children:[e.jsx("div",{className:"portal-stage-grid"}),e.jsxs("div",{className:"portal-stage-top-bar",children:[e.jsxs("div",{className:"portal-stage-pill",style:{background:"rgba(168, 85, 247, 0.22)",border:"1px solid rgba(192, 132, 252, 0.5)",color:"#e9d5ff"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#c7f303",boxShadow:"0 0 8px #c7f303",flexShrink:0}}),e.jsx("span",{children:"ISLA NOTCH · VOZ 24KHZ"})]}),e.jsxs("div",{className:"portal-stage-pill",style:{background:i?"rgba(16, 185, 129, 0.24)":"rgba(245, 158, 11, 0.22)",border:i?"1px solid rgba(52, 211, 153, 0.55)":"1px solid rgba(251, 191, 36, 0.55)",color:i?"#a7f3d0":"#fde68a"},children:[e.jsx("span",{className:"portal-label-desktop",children:i?"🔓 Admin · Descargar .ZIP":"🔒 Muy Pronto · Bloqueado"}),e.jsx("span",{className:"portal-label-mobile",children:i?"🔓 Admin":"🔒 Muy Pronto"})]})]}),e.jsxs("div",{style:{position:"relative",zIndex:25,background:"rgba(3, 7, 18, 0.92)",border:"1px solid rgba(199, 243, 3, 0.4)",borderRadius:9999,padding:"4px 12px",display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 8px 22px rgba(0,0,0,0.55)",marginTop:2},children:[e.jsx("span",{style:{width:7,height:7,borderRadius:"50%",background:"#c7f303",boxShadow:"0 0 8px #c7f303"}}),e.jsx("span",{style:{fontSize:10,fontWeight:800,color:"#f8fafc",letterSpacing:"0.02em"},children:"«Oye Tenshi» · Hermes Core · Mac / Win / Linux"})]}),e.jsx("div",{style:{position:"relative",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",marginTop:-4},children:e.jsx(E,{size:195,mood:"idle",showHaloEffect:!0,showHUD:!0,interactive:!1})}),e.jsx("div",{style:{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",width:170,height:20,borderRadius:"50%",background:"radial-gradient(ellipse at center, rgba(168, 85, 247, 0.5) 0%, rgba(16, 185, 129, 0) 75%)",filter:"blur(6px)",pointerEvents:"none"}})]}),e.jsxs("div",{className:"portal-card-body",children:[e.jsxs("div",{children:[e.jsx("div",{className:"portal-card-kicker",style:{color:"#a855f7"},children:e.jsx("span",{children:"🟣 ISLA INTELIGENTE EN TU COMPUTADOR · MULTI-OS"})}),e.jsxs("div",{className:"portal-card-title-row",children:[e.jsxs("h2",{className:"display portal-card-title",children:["Wappy ",e.jsx("span",{style:{color:"#a855f7"},children:"Dots"})]}),e.jsx("span",{className:"portal-card-status-pill",style:{background:i?"rgba(16, 185, 129, 0.16)":t?"rgba(168, 85, 247, 0.2)":"#faf5ff",color:i?"#059669":t?"#e9d5ff":"#7e22ce",border:i?"1px solid rgba(16, 185, 129, 0.45)":t?"1px solid rgba(192, 132, 252, 0.45)":"1px solid #e9d5ff"},children:i?"🔓 Admin ( Muy Pronto )":"🔒 Muy Pronto"})]}),e.jsxs("p",{className:"portal-card-desc",children:["Lleva a ",e.jsx("strong",{children:"Tenshi IA"})," en el Notch de tu computador con"," ",e.jsx("strong",{children:"Voz Viva 24 kHz (Gemini Live)"}),","," ",e.jsx("strong",{children:"Memoria Dual y Auto-Aprendizaje de Skills"})," (estilo Hermes & OpenClaw), ",e.jsx("strong",{children:"Team de Agentes Autónomos"})," en paralelo y puente en vivo con ",e.jsx("strong",{children:"Antigravity IDE, Siigo ERP, Google Workspace"})," y"," ",e.jsx("strong",{children:"Portal Móvil QR"}),"."]}),e.jsx("div",{className:"portal-chips-wrap",children:["🎙️ Voz Viva 24kHz («Oye Tenshi»)","🧠 Memoria & Skills (Hermes Core)","🤝 Team de 4 Agentes en Paralelo","🔌 Antigravity · Siigo · Google · QR"].map(a=>e.jsx("span",{className:"portal-chip",style:{background:t?"rgba(168, 85, 247, 0.14)":"#faf5ff",border:t?"1px solid rgba(192, 132, 252, 0.35)":"1px solid #e9d5ff",color:t?"#e9d5ff":"#581c87"},children:a},a))})]}),e.jsxs("button",{type:"button",className:"btn portal-cta-btn",onClick:a=>{a.stopPropagation(),u()},style:{background:i?"linear-gradient(135deg, #0e1300 0%, #1e1b4b 100%)":t?"rgba(30, 41, 59, 0.9)":"#f1f5f9",color:i?"#c7f303":t?"#cbd5e1":"#334155",border:i?"2px solid #c7f303":t?"2px solid rgba(148, 163, 184, 0.35)":"2px solid #cbd5e1",borderRadius:9999},children:[e.jsx("span",{children:i?"🔓 Descargar Wappy Dots (Admin)":"🔒 Muy Pronto · Bloqueado"}),e.jsx("span",{style:{width:34,height:34,borderRadius:9999,background:i?"#c7f303":"#0e1300",color:i?"#0e1300":"#c7f303",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14},children:i?"⬇️":"🔒"})]})]})]})]})]}):e.jsxs("div",{children:[e.jsxs("div",{className:"portal-apps-banner",children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"},children:[e.jsx("div",{style:{width:68,height:68,borderRadius:18,background:"radial-gradient(circle at 50% 40%, rgba(251, 191, 36, 0.35), rgba(15, 23, 42, 0.9))",border:"2px solid #fbbf24",display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden",flexShrink:0},children:e.jsx("img",{src:"/assets/felix_avatar_3d.png",alt:"Avatar Wappy APPs",style:{height:"94%",width:"auto",objectFit:"contain",display:"block"}})}),e.jsxs("div",{style:{flex:"1 1 210px",minWidth:0},children:[e.jsx("div",{style:{display:"inline-flex",alignItems:"center",gap:6,fontSize:10.5,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em",color:"#fde047",marginBottom:4},children:e.jsx("span",{children:"🚀 SUITE DE APLICACIONES ESPECIALIZADAS"})}),e.jsxs("h1",{className:"display",style:{fontSize:"clamp(22px, 3.5vw, 34px)",fontWeight:900,color:"#ffffff",margin:0},children:["Wappy ",e.jsx("span",{style:{color:"#c7f303"},children:"APPs"})]}),e.jsx("p",{style:{fontSize:13.5,color:"rgba(255, 255, 255, 0.84)",margin:"4px 0 0",maxWidth:620,lineHeight:1.45},children:"Selecciona la aplicación especializada que deseas abrir. Herramientas prácticas diseñadas para multiplicar tu velocidad en Seguridad y Salud en el Trabajo."})]})]}),e.jsx("button",{type:"button",onClick:R,className:"portal-apps-banner-back",children:e.jsx("span",{children:"← Volver a Selección"})})]}),e.jsx("div",{className:"portal-apps-grid",children:$.map(a=>{const r=a.badgeTone==="active";return e.jsxs("article",{className:`app-item-card ${r?"is-active":"is-soon"}`,onClick:r&&a.onOpen?a.onOpen:void 0,role:r?"button":void 0,tabIndex:r?0:void 0,onKeyDown:r&&a.onOpen?s=>{var o;(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),(o=a.onOpen)==null||o.call(a))}:void 0,children:[e.jsxs("div",{children:[e.jsxs("div",{className:"app-card-meta-strip",children:[e.jsxs("span",{style:{display:"inline-flex",alignItems:"center",gap:6,padding:"3.5px 10px",borderRadius:9999,background:r?"rgba(199, 243, 3, 0.16)":"rgba(148, 163, 184, 0.18)",border:r?"1px solid rgba(199, 243, 3, 0.45)":"1px solid rgba(148, 163, 184, 0.3)",color:r?"#c7f303":"#cbd5e1",fontSize:10,fontWeight:900,letterSpacing:"0.03em",whiteSpace:"nowrap"},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:r?"#c7f303":"#94a3b8",flexShrink:0}}),e.jsx("span",{children:a.badge})]}),e.jsx("span",{style:{fontSize:10,fontWeight:700,color:"#94a3b8",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},children:a.normative})]}),a.image?e.jsx("div",{style:{position:"relative",aspectRatio:"16 / 9",width:"100%",background:"#091526",overflow:"hidden",borderBottom:t?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0"},children:e.jsx("img",{src:a.image,alt:a.title,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}})}):a.visualType==="wappy-studio"?e.jsxs("div",{style:{position:"relative",aspectRatio:"16 / 9",width:"100%",background:"radial-gradient(circle at 50% 35%, rgba(168, 85, 247, 0.28) 0%, rgba(13, 148, 136, 0.25) 45%, rgba(6, 15, 28, 0.98) 100%), linear-gradient(135deg, #071120 0%, #0f172a 50%, #1e1b4b 100%)",overflow:"hidden",borderBottom:t?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 12px"},children:[e.jsxs("div",{style:{textAlign:"center",zIndex:2},children:[e.jsx("div",{style:{fontSize:"clamp(15px, 3vw, 19px)",fontWeight:900,color:"#c7f303",letterSpacing:"0.02em",lineHeight:1.1},children:"WAPPY STUDIO · VOZ & VIDEO IA"}),e.jsx("div",{style:{fontSize:10.5,color:"#5eead4",fontWeight:700,marginTop:2},children:"Locución 24kHz Gemini 2.5 · Cápsulas GSAP 16:9 y 9:16"})]}),e.jsxs("div",{style:{zIndex:2,width:"100%",maxWidth:290,background:"rgba(15, 23, 42, 0.85)",border:"1px solid rgba(199, 243, 3, 0.35)",borderRadius:14,padding:"10px 12px",boxShadow:"0 12px 28px rgba(0, 0, 0, 0.45)",display:"flex",flexDirection:"column",gap:8},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},children:[e.jsxs("span",{style:{fontSize:10,fontWeight:800,color:"#f8fafc",display:"inline-flex",alignItems:"center",gap:5},children:[e.jsx("span",{children:"🎙️"})," Pista Master 24kHz"]}),e.jsx("span",{style:{fontSize:9.5,fontWeight:800,padding:"2px 7px",borderRadius:9999,background:"#c7f303",color:"#0e1300"},children:"HTML + GSAP"})]}),e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",gap:3,height:22},children:[45,80,60,95,50,88,100,70,40,85,65,92,55,78,48,82,60,38].map((s,o)=>e.jsx("span",{style:{flex:1,height:`${s}%`,borderRadius:9999,background:o%2===0?"#c7f303":"#2dd4bf"}},o))})]}),e.jsx("div",{style:{zIndex:2,display:"inline-flex",alignItems:"center",gap:8,padding:"3px 12px",borderRadius:9999,background:"rgba(16, 185, 129, 0.2)",border:"1px solid rgba(52, 211, 153, 0.45)",color:"#a7f3d0",fontSize:10,fontWeight:800},children:e.jsx("span",{children:"⚡ Acceso Directo · Exportación .WAV y .HTML"})})]}):a.visualType==="wappy-podcast"?e.jsxs("div",{style:{position:"relative",aspectRatio:"16 / 9",width:"100%",background:"radial-gradient(circle at 20% 20%, rgba(199, 243, 3, 0.18) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(13, 148, 136, 0.25) 0%, transparent 50%), linear-gradient(135deg, #070d18 0%, #0c192e 50%, #0e1300 100%)",overflow:"hidden",borderBottom:t?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"10px 14px"},children:[e.jsx("div",{style:{position:"absolute",top:-15,left:-15,width:90,height:90,borderRadius:"50%",background:"#c7f303",filter:"blur(35px)",opacity:.25,pointerEvents:"none"}}),e.jsx("div",{style:{position:"absolute",bottom:-15,right:-15,width:100,height:100,borderRadius:"50%",background:"#0d9488",filter:"blur(40px)",opacity:.3,pointerEvents:"none"}}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",zIndex:2},children:[e.jsxs("div",{style:{display:"inline-flex",alignItems:"center",gap:6},children:[e.jsx("span",{style:{width:6,height:6,borderRadius:"50%",background:"#ef4444",boxShadow:"0 0 8px #ef4444"}}),e.jsx("span",{style:{fontSize:10,fontWeight:900,color:"#c7f303",letterSpacing:"0.04em"},children:"APPLE PODCASTS × WAPPY WALKMAN"})]}),e.jsx("span",{style:{fontSize:8.5,fontWeight:800,color:"#99f6e4",background:"rgba(13,148,136,0.3)",border:"1px solid rgba(45,212,191,0.4)",borderRadius:6,padding:"1px 6px"},children:"24kHz MASTER WAV"})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1.15fr 0.85fr",gap:8,alignItems:"center",zIndex:2},children:[e.jsxs("div",{style:{background:"linear-gradient(180deg, #18240f 0%, #0e1300 60%, #080d04 100%)",border:"1.5px solid rgba(199,243,3,0.45)",borderRadius:10,padding:"5px 7px",boxShadow:"0 8px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",display:"flex",flexDirection:"column",gap:4},children:[e.jsxs("div",{style:{background:"linear-gradient(90deg, #c7f303, #a3e635)",borderRadius:5,padding:"2px 5px",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsx("span",{style:{fontSize:7.5,fontWeight:900,color:"#0e1300",letterSpacing:"0.02em"},children:"WAPPY C-60 • 24kHz STEREO"}),e.jsx("span",{style:{fontSize:6.5,fontWeight:800,background:"#0e1300",color:"#c7f303",padding:"0.5px 3px",borderRadius:3},children:"TYPE II"})]}),e.jsxs("div",{style:{background:"#090e05",border:"1px solid rgba(255,255,255,0.12)",borderRadius:6,height:38,position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px",overflow:"hidden"},children:[e.jsx("div",{style:{position:"absolute",left:16,right:16,top:"50%",transform:"translateY(-50%)",height:8,background:"#261a0d",borderTop:"1px solid #3d2a17",borderBottom:"1px solid #3d2a17"}}),e.jsx("svg",{width:"26",height:"26",viewBox:"0 0 100 100",style:{zIndex:2},children:e.jsxs("g",{children:[e.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 50 50",to:"360 50 50",dur:"3.5s",repeatCount:"indefinite"}),e.jsx("circle",{cx:"50",cy:"50",r:"46",fill:"#1f2937",stroke:"#9ca3af",strokeWidth:"3"}),e.jsx("circle",{cx:"50",cy:"50",r:"28",fill:"#111827",stroke:"#4b5563",strokeWidth:"2"}),e.jsx("circle",{cx:"50",cy:"50",r:"14",fill:"#ffffff",stroke:"#111827",strokeWidth:"4"}),e.jsx("rect",{x:"47",y:"24",width:"6",height:"8",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"47",y:"68",width:"6",height:"8",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"24",y:"47",width:"8",height:"6",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"68",y:"47",width:"8",height:"6",rx:"2",fill:"#c7f303"})]})}),e.jsxs("div",{style:{zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",gap:1},children:[e.jsx("span",{style:{fontSize:7,fontFamily:"monospace",fontWeight:900,color:"#c7f303",background:"rgba(0,0,0,0.8)",padding:"0.5px 3px",borderRadius:3},children:"04:20"}),e.jsxs("div",{style:{display:"flex",gap:1.5,alignItems:"flex-end",height:8},children:[e.jsx("span",{style:{width:2,height:"70%",background:"#4ade80",borderRadius:1}}),e.jsx("span",{style:{width:2,height:"90%",background:"#c7f303",borderRadius:1}}),e.jsx("span",{style:{width:2,height:"40%",background:"#fbbf24",borderRadius:1}}),e.jsx("span",{style:{width:2,height:"100%",background:"#ef4444",borderRadius:1}})]})]}),e.jsx("svg",{width:"26",height:"26",viewBox:"0 0 100 100",style:{zIndex:2},children:e.jsxs("g",{children:[e.jsx("animateTransform",{attributeName:"transform",type:"rotate",from:"0 50 50",to:"360 50 50",dur:"3.5s",repeatCount:"indefinite"}),e.jsx("circle",{cx:"50",cy:"50",r:"46",fill:"#1f2937",stroke:"#9ca3af",strokeWidth:"3"}),e.jsx("circle",{cx:"50",cy:"50",r:"28",fill:"#111827",stroke:"#4b5563",strokeWidth:"2"}),e.jsx("circle",{cx:"50",cy:"50",r:"14",fill:"#ffffff",stroke:"#111827",strokeWidth:"4"}),e.jsx("rect",{x:"47",y:"24",width:"6",height:"8",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"47",y:"68",width:"6",height:"8",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"24",y:"47",width:"8",height:"6",rx:"2",fill:"#c7f303"}),e.jsx("rect",{x:"68",y:"47",width:"8",height:"6",rx:"2",fill:"#c7f303"})]})})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",gap:3},children:[e.jsx("span",{style:{flex:1,textAlign:"center",fontSize:6.5,fontWeight:800,background:"#1e293b",color:"#cbd5e1",borderRadius:3,padding:"1px 0"},children:"REW"}),e.jsx("span",{style:{flex:1.4,textAlign:"center",fontSize:6.5,fontWeight:900,background:"#c7f303",color:"#0e1300",borderRadius:3,padding:"1px 0"},children:"PLAY ▶"}),e.jsx("span",{style:{flex:1,textAlign:"center",fontSize:6.5,fontWeight:800,background:"#dc2626",color:"#ffffff",borderRadius:3,padding:"1px 0"},children:"REC ●"}),e.jsx("span",{style:{flex:1,textAlign:"center",fontSize:6.5,fontWeight:800,background:"#1e293b",color:"#cbd5e1",borderRadius:3,padding:"1px 0"},children:"FF"})]})]}),e.jsxs("div",{style:{position:"relative",height:74,display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsxs("div",{style:{position:"absolute",right:4,width:54,height:54,borderRadius:8,background:"linear-gradient(135deg, #3b0764, #1e1b4b)",border:"1px solid rgba(168,85,247,0.4)",boxShadow:"0 4px 10px rgba(0,0,0,0.5)",transform:"rotate(8deg) scale(0.9)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:3},children:[e.jsx("span",{style:{fontSize:6,fontWeight:900,color:"#d8b4fe"},children:"ATEL"}),e.jsx("span",{style:{fontSize:10,alignSelf:"center"},children:"🔍"})]}),e.jsxs("div",{style:{position:"absolute",right:14,width:58,height:58,borderRadius:9,background:"linear-gradient(135deg, #c7f303, #84cc16)",border:"1px solid rgba(255,255,255,0.6)",boxShadow:"0 6px 14px rgba(0,0,0,0.6)",transform:"rotate(-4deg) scale(0.95)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:3.5},children:[e.jsx("span",{style:{fontSize:6,fontWeight:900,color:"#0e1300"},children:"CERO ACC"}),e.jsx("span",{style:{fontSize:11,alignSelf:"center"},children:"🛡️"})]}),e.jsxs("div",{style:{position:"relative",zIndex:3,width:64,height:64,borderRadius:10,background:"linear-gradient(135deg, #0d9488, #064e3b)",border:"1.5px solid rgba(199,243,3,0.8)",boxShadow:"0 8px 20px rgba(0,0,0,0.7)",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:4},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center"},children:[e.jsx("span",{style:{fontSize:5.5,fontWeight:900,background:"#0e1300",color:"#c7f303",padding:"0.5px 3px",borderRadius:3},children:"NEW"}),e.jsx("span",{style:{width:11,height:11,borderRadius:"50%",background:"#c7f303",color:"#0e1300",fontSize:6.5,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"},children:"▶"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:6.5,fontWeight:900,color:"#ffffff",lineHeight:1.1},children:"SOMOS SST"}),e.jsx("div",{style:{fontSize:5,fontWeight:700,color:"#a7f3d0"},children:"Daily 24kHz"})]})]})]})]}),e.jsx("div",{style:{zIndex:2,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"2px 10px",borderRadius:9999,background:"rgba(13, 148, 136, 0.2)",border:"1px solid rgba(45, 212, 191, 0.4)",color:"#99f6e4",fontSize:9,fontWeight:800,letterSpacing:"0.02em"},children:e.jsx("span",{children:"🎙️ Voces Neuronales · Dual Host 1 & 2 · Show Notes IA"})})]}):e.jsx("div",{style:{position:"relative",height:140,background:t?"linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(15,23,42,0.9) 100%)":"linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",display:"flex",alignItems:"center",justifyContent:"center",borderBottom:t?"1px solid rgba(51,65,85,0.8)":"1px solid #e2e8f0"},children:e.jsx("div",{style:{width:62,height:62,borderRadius:18,background:t?"#1e293b":"#ffffff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 10px 25px rgba(15, 23, 42, 0.12)"},children:a.icon})}),e.jsxs("div",{style:{padding:"18px 20px 14px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6},children:[e.jsx("span",{style:{fontSize:22,flexShrink:0},children:a.icon}),e.jsx("h3",{className:"display app-card-title",children:a.title})]}),e.jsx("div",{style:{fontSize:12.5,fontWeight:800,color:r?t?"#2dd4bf":"#0d9488":"#64748b",marginBottom:10,lineHeight:1.35},children:a.subtitle}),e.jsx("p",{className:"app-card-desc",children:a.description}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10},children:a.tags.map(s=>e.jsx("span",{className:`app-card-tag ${r?"tag-active":"tag-soon"}`,children:s},s))})]})]}),e.jsx("div",{style:{padding:"0 20px 20px"},children:r&&a.href?e.jsxs("a",{href:a.href,onClick:a.onOpen,className:"btn btn-primary",style:{width:"100%",justifyContent:"space-between",padding:"0 12px 0 18px",height:50,fontSize:14.5,fontWeight:800,textDecoration:"none"},children:[e.jsx("span",{children:a.ctaLabel}),e.jsx("span",{className:"pip",style:{width:32,height:32,flexShrink:0},children:e.jsxs("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"#0E1300",strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("line",{x1:"5",y1:"12",x2:"19",y2:"12"}),e.jsx("polyline",{points:"12 5 19 12 12 19"})]})})]}):e.jsxs("button",{type:"button",disabled:!0,style:{width:"100%",height:48,borderRadius:9999,border:t?"1px dashed #334155":"1px dashed #cbd5e1",background:t?"rgba(30, 41, 59, 0.5)":"#f8fafc",color:"#64748b",fontSize:13.5,fontWeight:700,cursor:"not-allowed"},children:["🔒 ",a.ctaLabel]})})]},a.id)})})]})})})]})}export{Pe as default};
