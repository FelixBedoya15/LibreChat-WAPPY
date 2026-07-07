import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, Pause, ShieldAlert, Check, Lock, ShieldCheck, ArrowRight, ArrowDown, Settings, Save, 
  AlertCircle, Sparkles, UserCheck, HelpCircle, Maximize, Minimize, Trash2, 
  Download, Unlock, FileText, Loader2, RefreshCw, Plus, X, ExternalLink, Key,
  Eye, EyeOff, Gift
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { ThemeSelector } from '@librechat/client';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

// Declare global types for YouTube Iframe Player API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    WidgetCheckout: any;
  }
}

// Extract YouTube ID helper
function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// SVG Icons copied from PlansPage.tsx
const IpevarSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5">
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="2s" fill="freeze" />
    </rect>
    <path d="M3 9H21M9 21V9" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
    <path d="M13 13L17 17M17 13L13 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="15" cy="15" r="5" stroke="currentColor" strokeWidth="1.5" opacity="0.2">
      <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const ProSVG = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <path
      d="M2.5 19H21.5L19.5 7L15 12.5L12 4L9 12.5L4.5 7L2.5 19Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.9"
    >
      <animate attributeName="stroke-dasharray" values="0 100;100 0" dur="1.5s" fill="freeze" />
    </path>
    <circle cx="12" cy="3" r="1.5" fill="currentColor">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="4.5" cy="6" r="1.5" fill="currentColor">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="0.6s" repeatCount="indefinite" />
    </circle>
    <circle cx="19.5" cy="6" r="1.5" fill="currentColor">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" begin="1.2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const renderFeatureText = (f: string) => {
  const parts = f.split('**');
  if (parts.length === 1) {
    return <span>{f}</span>;
  }
  return (
    <span>
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          return (
            <strong key={index} className="font-bold text-text-primary">
              {part}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};

export default function ComunidadPage() {
  const navigate = useNavigate();
  const { user, token, login } = useAuthContext();
  const isAdmin = user?.role === 'ADMIN';

  // Determine funnelKey based on URL
  const funnelKey = window.location.pathname.includes('wappyvital')
    ? 'wappyvital'
    : window.location.pathname.includes('comunidadmp')
      ? 'comunidadmp'
      : 'comunidad';

  // Storage key helper for LocalStorage partitioning
  const getStorageKey = (key: string) => {
    if (funnelKey === 'comunidad') {
      return key;
    }
    return `${key}_${funnelKey}`;
  };

  // Config States (Loaded from Backend DB)
  const [configLoading, setConfigLoading] = useState(true);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [price, setPrice] = useState(0);
  const [showQuickAccessBanner, setShowQuickAccessBanner] = useState(true);
  const [tempShowQuickAccessBanner, setTempShowQuickAccessBanner] = useState(true);
  const actualRequiresPayment = requiresPayment && price > 0;
  const [gatingSeconds, setGatingSeconds] = useState(120);
  const [gatingEnabled, setGatingEnabled] = useState(true);
  const [downloadableFiles, setDownloadableFiles] = useState<any[]>([]);
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [whatsappUrl, setWhatsappUrl] = useState('https://chat.whatsapp.com/GDoaMdEN5m5GhogIL7TGhy?s=cl&p=i&ilr=4');
  const [extraVideoUrl1, setExtraVideoUrl1] = useState('');
  const [extraVideoTitle1, setExtraVideoTitle1] = useState('Clase Extra 1');
  const [extraVideoUrl2, setExtraVideoUrl2] = useState('');
  const [extraVideoTitle2, setExtraVideoTitle2] = useState('Clase Extra 2');
  const [extraVideoUrl3, setExtraVideoUrl3] = useState('');
  const [extraVideoTitle3, setExtraVideoTitle3] = useState('Clase Extra 3');
  const [extraVideoUrl4, setExtraVideoUrl4] = useState('');
  const [extraVideoTitle4, setExtraVideoTitle4] = useState('Clase Extra 4');
  const [extraVideoUrl5, setExtraVideoUrl5] = useState('');
  const [extraVideoTitle5, setExtraVideoTitle5] = useState('Clase Extra 5');
  const [extraVideoUrl6, setExtraVideoUrl6] = useState('');
  const [extraVideoTitle6, setExtraVideoTitle6] = useState('Clase Extra 6');
  const [extraVideoUrl7, setExtraVideoUrl7] = useState('');
  const [extraVideoTitle7, setExtraVideoTitle7] = useState('Clase Extra 7');
  const [extraVideoUrl8, setExtraVideoUrl8] = useState('');
  const [extraVideoTitle8, setExtraVideoTitle8] = useState('Clase Extra 8');
  const [extraVideoUrl9, setExtraVideoUrl9] = useState('');
  const [extraVideoTitle9, setExtraVideoTitle9] = useState('Clase Extra 9');
  const [extraVideoUrl10, setExtraVideoUrl10] = useState('');
  const [extraVideoTitle10, setExtraVideoTitle10] = useState('Clase Extra 10');

  // Coupon / Discount States
  const [couponCode, setCouponCode] = useState('');
  const [approvedPurchasesCount, setApprovedPurchasesCount] = useState(0);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);

  // Video State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(() => localStorage.getItem(getStorageKey('wappy_comunidad_video_finished')) === 'true');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);

  // Parse if it is YouTube
  const youtubeId = getYouTubeId(videoUrl);
  const isYouTube = !!youtubeId;
  const isYouTubeChannelError = !isYouTube && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));

  // Parse extra videos if they are YouTube
  const youtubeId1 = extraVideoUrl1 ? getYouTubeId(extraVideoUrl1) : null;
  const isYouTube1 = !!youtubeId1;
  const youtubeId2 = extraVideoUrl2 ? getYouTubeId(extraVideoUrl2) : null;
  const isYouTube2 = !!youtubeId2;
  const youtubeId3 = extraVideoUrl3 ? getYouTubeId(extraVideoUrl3) : null;
  const isYouTube3 = !!youtubeId3;
  const youtubeId4 = extraVideoUrl4 ? getYouTubeId(extraVideoUrl4) : null;
  const isYouTube4 = !!youtubeId4;
  const youtubeId5 = extraVideoUrl5 ? getYouTubeId(extraVideoUrl5) : null;
  const isYouTube5 = !!youtubeId5;
  const youtubeId6 = extraVideoUrl6 ? getYouTubeId(extraVideoUrl6) : null;
  const isYouTube6 = !!youtubeId6;
  const youtubeId7 = extraVideoUrl7 ? getYouTubeId(extraVideoUrl7) : null;
  const isYouTube7 = !!youtubeId7;
  const youtubeId8 = extraVideoUrl8 ? getYouTubeId(extraVideoUrl8) : null;
  const isYouTube8 = !!youtubeId8;
  const youtubeId9 = extraVideoUrl9 ? getYouTubeId(extraVideoUrl9) : null;
  const isYouTube9 = !!youtubeId9;
  const youtubeId10 = extraVideoUrl10 ? getYouTubeId(extraVideoUrl10) : null;
  const isYouTube10 = !!youtubeId10;

  // Access State (Free Leads or Paid Purchases)
  const [isAccessChecking, setIsAccessChecking] = useState(true);
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem(getStorageKey('wappy_comunidad_email')) || '');
  const [userFullName, setUserFullName] = useState('');
  const [userPhone, setUserPhone] = useState(() => localStorage.getItem(getStorageKey('wappy_comunidad_phone')) || '');
  
  const [billingInterval, setBillingInterval] = useState<string>('annual');
  const [fetchedPlans, setFetchedPlans] = useState<any[]>([]);

  const vitalPlanConfig = useMemo(() => {
    const fetchedConfig = fetchedPlans.find((p: any) => p.planId === 'ipevar');
    if (!fetchedConfig) return null;
    const fixedInterval = 'lifetime';
    const rawPrice = fetchedConfig.prices?.[fixedInterval] || 150000;
    const displayPrice = '$' + rawPrice.toLocaleString('es-CO');
    let promotion: any = null;
    if (fetchedConfig.promotions?.[fixedInterval]?.active) {
      promotion = fetchedConfig.promotions[fixedInterval];
    }
    let discountedPrice = 0;
    if (promotion && rawPrice > 0) {
      discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
    } else {
      discountedPrice = Math.round(rawPrice * 0.7);
    }
    const finalPrice = promotion && promotion.discountPercentage > 0 ? discountedPrice : rawPrice;
    return {
      rawPrice,
      displayPrice,
      finalPrice,
      promotion
    };
  }, [fetchedPlans]);

  const basePrice = (funnelKey === 'wappyvital') 
    ? (vitalPlanConfig?.rawPrice || 350000) 
    : price;

  const proPlanConfig = useMemo(() => {
    const fetchedConfig = fetchedPlans.find((p: any) => p.planId === 'pro');
    if (!fetchedConfig) return null;
    const rawPrice = fetchedConfig.prices?.[billingInterval] || 0;
    const displayPrice = rawPrice > 0 ? '$' + rawPrice.toLocaleString('es-CO') : '$0';
    let promotion: any = null;
    if (fetchedConfig.promotions?.[billingInterval]?.active) {
      promotion = fetchedConfig.promotions[billingInterval];
    }
    let discountedPrice = 0;
    if (promotion && rawPrice > 0) {
      discountedPrice = rawPrice - rawPrice * (promotion.discountPercentage / 100);
    } else {
      discountedPrice = rawPrice;
    }
    const finalPrice = promotion && promotion.discountPercentage > 0 ? discountedPrice : rawPrice;
    const monthsDivisor =
      billingInterval === 'quarterly'
        ? 3
        : billingInterval === 'semiannual'
          ? 6
          : billingInterval === 'annual'
            ? 12
            : 1;
    const pricePerMonth = finalPrice / monthsDivisor;
    return {
      rawPrice,
      displayPrice,
      finalPrice,
      promotion,
      pricePerMonth
    };
  }, [fetchedPlans, billingInterval]);
  
  // Checkout & Recovery Modal States
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [checkoutPassword, setCheckoutPassword] = useState('');
  const [showCheckoutPassword, setShowCheckoutPassword] = useState(false);
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<'vital' | 'pro' | null>(null);

  // Free Lead Modal State (Active when requiresPayment is false)
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [isLeadCaptured, setIsLeadCaptured] = useState(() => {
    return localStorage.getItem(getStorageKey('wappy_lead_captured')) === 'true';
  });

  // Access Recovery
  const [showRecoveryView, setShowRecoveryView] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);

  // Admin Config Panel States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [tempVideoUrl, setTempVideoUrl] = useState(videoUrl);
  const [tempRequiresPayment, setTempRequiresPayment] = useState(requiresPayment);
  const [tempPrice, setTempPrice] = useState(price);
  const [tempGatingSeconds, setTempGatingSeconds] = useState(120);
  const [tempGatingEnabled, setTempGatingEnabled] = useState(true);
  const [tempFiles, setTempFiles] = useState<any[]>([]);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [tempWhatsappUrl, setTempWhatsappUrl] = useState(whatsappUrl);
  const [tempExtraVideoUrl1, setTempExtraVideoUrl1] = useState(extraVideoUrl1);
  const [tempExtraVideoTitle1, setTempExtraVideoTitle1] = useState(extraVideoTitle1);
  const [tempExtraVideoUrl2, setTempExtraVideoUrl2] = useState(extraVideoUrl2);
  const [tempExtraVideoTitle2, setTempExtraVideoTitle2] = useState(extraVideoTitle2);
  const [tempExtraVideoUrl3, setTempExtraVideoUrl3] = useState('');
  const [tempExtraVideoTitle3, setTempExtraVideoTitle3] = useState('Clase Extra 3');
  const [tempExtraVideoUrl4, setTempExtraVideoUrl4] = useState('');
  const [tempExtraVideoTitle4, setTempExtraVideoTitle4] = useState('Clase Extra 4');
  const [tempExtraVideoUrl5, setTempExtraVideoUrl5] = useState('');
  const [tempExtraVideoTitle5, setTempExtraVideoTitle5] = useState('Clase Extra 5');
  const [tempExtraVideoUrl6, setTempExtraVideoUrl6] = useState('');
  const [tempExtraVideoTitle6, setTempExtraVideoTitle6] = useState('Clase Extra 6');
  const [tempExtraVideoUrl7, setTempExtraVideoUrl7] = useState('');
  const [tempExtraVideoTitle7, setTempExtraVideoTitle7] = useState('Clase Extra 7');
  const [tempExtraVideoUrl8, setTempExtraVideoUrl8] = useState('');
  const [tempExtraVideoTitle8, setTempExtraVideoTitle8] = useState('Clase Extra 8');
  const [tempExtraVideoUrl9, setTempExtraVideoUrl9] = useState('');
  const [tempExtraVideoTitle9, setTempExtraVideoTitle9] = useState('Clase Extra 9');
  const [tempExtraVideoUrl10, setTempExtraVideoUrl10] = useState('');
  const [tempExtraVideoTitle10, setTempExtraVideoTitle10] = useState('Clase Extra 10');

  // Admin Dashboard States (Leads vs Purchases)
  const [isLeadsPanelOpen, setIsLeadsPanelOpen] = useState(false);
  const [dashboardTab, setDashboardTab] = useState<'leads' | 'purchases' | 'pending' | 'metrics'>('leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [metricsStats, setMetricsStats] = useState<any>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [syncingEmail, setSyncingEmail] = useState<string | null>(null);

  // Admin File Upload States
  const [uploadFileName, setUploadFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploading, setIsFileUploading] = useState(false);

  const isAccessGrantedRef = useRef(isAccessGranted);
  useEffect(() => {
    isAccessGrantedRef.current = isAccessGranted;
  }, [isAccessGranted]);

  const isLeadCapturedRef = useRef(isLeadCaptured);
  useEffect(() => {
    isLeadCapturedRef.current = isLeadCaptured;
  }, [isLeadCaptured]);

  const showLeadModalRef = useRef(showLeadModal);
  useEffect(() => {
    showLeadModalRef.current = showLeadModal;
  }, [showLeadModal]);

  // 1. Fetch Page Configurations from Backend
  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/comunidad/config', { params: { funnelKey } });
      if (response.data) {
        const data = response.data;
        setVideoUrl(data.videoUrl);
        setTempVideoUrl(data.videoUrl);
        setRequiresPayment(data.requiresPayment);
        setTempRequiresPayment(data.requiresPayment);
        setPrice(data.price);
        setTempPrice(data.price);
        setShowQuickAccessBanner(data.showQuickAccessBanner !== undefined ? data.showQuickAccessBanner : true);
        setTempShowQuickAccessBanner(data.showQuickAccessBanner !== undefined ? data.showQuickAccessBanner : true);
        const gatingSecs = data.gatingSeconds !== undefined ? data.gatingSeconds : 120;
        const gatingActive = data.gatingEnabled !== undefined ? data.gatingEnabled : true;
        setGatingSeconds(gatingSecs);
        setTempGatingSeconds(gatingSecs);
        setGatingEnabled(gatingActive);
        setTempGatingEnabled(gatingActive);
        setDownloadableFiles(data.downloadableFiles || []);
        setTempFiles(data.downloadableFiles || []);
        if (data.whatsappUrl) {
          setWhatsappUrl(data.whatsappUrl);
          setTempWhatsappUrl(data.whatsappUrl);
        }
        if (data.extraVideoUrl1 !== undefined) { setExtraVideoUrl1(data.extraVideoUrl1); setTempExtraVideoUrl1(data.extraVideoUrl1); }
        if (data.extraVideoTitle1 !== undefined) { setExtraVideoTitle1(data.extraVideoTitle1); setTempExtraVideoTitle1(data.extraVideoTitle1); }
        if (data.extraVideoUrl2 !== undefined) { setExtraVideoUrl2(data.extraVideoUrl2); setTempExtraVideoUrl2(data.extraVideoUrl2); }
        if (data.extraVideoTitle2 !== undefined) { setExtraVideoTitle2(data.extraVideoTitle2); setTempExtraVideoTitle2(data.extraVideoTitle2); }
        if (data.extraVideoUrl3 !== undefined) { setExtraVideoUrl3(data.extraVideoUrl3); setTempExtraVideoUrl3(data.extraVideoUrl3); }
        if (data.extraVideoTitle3 !== undefined) { setExtraVideoTitle3(data.extraVideoTitle3); setTempExtraVideoTitle3(data.extraVideoTitle3); }
        if (data.extraVideoUrl4 !== undefined) { setExtraVideoUrl4(data.extraVideoUrl4); setTempExtraVideoUrl4(data.extraVideoUrl4); }
        if (data.extraVideoTitle4 !== undefined) { setExtraVideoTitle4(data.extraVideoTitle4); setTempExtraVideoTitle4(data.extraVideoTitle4); }
        if (data.extraVideoUrl5 !== undefined) { setExtraVideoUrl5(data.extraVideoUrl5); setTempExtraVideoUrl5(data.extraVideoUrl5); }
        if (data.extraVideoTitle5 !== undefined) { setExtraVideoTitle5(data.extraVideoTitle5); setTempExtraVideoTitle5(data.extraVideoTitle5); }
        if (data.extraVideoUrl6 !== undefined) { setExtraVideoUrl6(data.extraVideoUrl6); setTempExtraVideoUrl6(data.extraVideoUrl6); }
        if (data.extraVideoTitle6 !== undefined) { setExtraVideoTitle6(data.extraVideoTitle6); setTempExtraVideoTitle6(data.extraVideoTitle6); }
        if (data.extraVideoUrl7 !== undefined) { setExtraVideoUrl7(data.extraVideoUrl7); setTempExtraVideoUrl7(data.extraVideoUrl7); }
        if (data.extraVideoTitle7 !== undefined) { setExtraVideoTitle7(data.extraVideoTitle7); setTempExtraVideoTitle7(data.extraVideoTitle7); }
        if (data.extraVideoUrl8 !== undefined) { setExtraVideoUrl8(data.extraVideoUrl8); setTempExtraVideoUrl8(data.extraVideoUrl8); }
        if (data.extraVideoTitle8 !== undefined) { setExtraVideoTitle8(data.extraVideoTitle8); setTempExtraVideoTitle8(data.extraVideoTitle8); }
        if (data.extraVideoUrl9 !== undefined) { setExtraVideoUrl9(data.extraVideoUrl9); setTempExtraVideoUrl9(data.extraVideoUrl9); }
        if (data.extraVideoTitle9 !== undefined) { setExtraVideoTitle9(data.extraVideoTitle9); setTempExtraVideoTitle9(data.extraVideoTitle9); }
        if (data.extraVideoUrl10 !== undefined) { setExtraVideoUrl10(data.extraVideoUrl10); setTempExtraVideoUrl10(data.extraVideoUrl10); }
        if (data.extraVideoTitle10 !== undefined) { setExtraVideoTitle10(data.extraVideoTitle10); setTempExtraVideoTitle10(data.extraVideoTitle10); }
        if (data.approvedPurchasesCount !== undefined) {
          setApprovedPurchasesCount(data.approvedPurchasesCount);
        }
      }
    } catch (err) {
      console.error('[Comunidad] Error fetching page config:', err);
    } finally {
      setConfigLoading(false);
    }
  };

  const triggerMetaPurchasePixel = async (email: string, fullName?: string, phone?: string) => {
    if (window.fbq) {
      // Configure Advanced Matching
      const matchingData: any = { em: email.toLowerCase().trim() };
      if (phone) matchingData.ph = phone.trim().replace(/[^0-9]/g, '');
      if (fullName) {
        const nameParts = fullName.trim().split(/\s+/);
        matchingData.fn = nameParts[0].toLowerCase();
        if (nameParts.length > 1) {
          matchingData.ln = nameParts[nameParts.length - 1].toLowerCase();
        }
      }

      const finalPrice = (couponCode.toUpperCase().trim() === 'VITAL30' && funnelKey === 'wappyvital') ? Math.round(basePrice * 0.7) : basePrice;
      window.fbq('init', '1552188416261002', matchingData);
      window.fbq('track', 'Purchase', {
        value: finalPrice || 28000,
        currency: 'COP',
        content_name: funnelKey === 'wappyvital' ? 'Membresía Wappy Vital' : 'Curso SST IA + 10 Aplicativos'
      });
      console.log(`[Meta Pixel] Sent Purchase event with Advanced Matching for ${email}`);
    }
    try {
      await axios.post('/api/comunidad/mark-tracked', { email, funnelKey });
    } catch (err) {
      console.error('[Meta Pixel] Error calling mark-tracked endpoint:', err);
    }
  };

  const handleSendToPixelManual = async (purchase: any) => {
    const { email, fullName, phone } = purchase;
    setSyncingEmail(email);
    try {
      if (window.fbq) {
        // Configure Advanced Matching
        const matchingData: any = { em: email.toLowerCase().trim() };
        if (phone) matchingData.ph = phone.trim().replace(/[^0-9]/g, '');
        if (fullName) {
          const nameParts = fullName.trim().split(/\s+/);
          matchingData.fn = nameParts[0].toLowerCase();
          if (nameParts.length > 1) {
            matchingData.ln = nameParts[nameParts.length - 1].toLowerCase();
          }
        }

        window.fbq('init', '1552188416261002', matchingData);
        window.fbq('track', 'Purchase', {
          value: purchase.amountInCents ? (purchase.amountInCents / 100) : (price || 28000),
          currency: 'COP',
          content_name: funnelKey === 'wappyvital' ? 'Membresía Wappy Vital' : 'Curso SST IA + 10 Aplicativos'
        });
        console.log(`[Meta Pixel] Sent Manual Purchase event with Advanced Matching for ${email}`);
      } else {
        alert('Meta Pixel no está cargado en el navegador o está bloqueado por un adblocker.');
      }
      
      const response = await axios.post('/api/comunidad/mark-tracked', { email, funnelKey });
      if (response.data.success) {
        setPurchases(prev => prev.map(p => {
          if (p.email.toLowerCase() === email.toLowerCase()) {
            return { ...p, purchaseTracked: true };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('[Admin] Error marking purchase as tracked:', err);
      alert('Error al actualizar el estado de sincronización en el servidor.');
    } finally {
      setSyncingEmail(null);
    }
  };

  const handleApprovePurchaseManual = async (email: string, reference: string) => {
    if (!confirm(`¿Estás seguro de que deseas aprobar manualmente la compra de ${email}?`)) {
      return;
    }
    try {
      const response = await axios.post('/api/comunidad/fix-purchase', {
        secret: 'forensic2026',
        email,
        action: 'approve',
        reference,
        funnelKey
      });
      if (response.data.success) {
        alert('Compra aprobada con éxito.');
        // Update local state
        setPurchases(prev => prev.map(p => {
          if (p.email.toLowerCase() === email.toLowerCase()) {
            return { ...p, isPaid: true, status: 'APPROVED' };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error approving purchase:', err);
      alert('Error al aprobar la compra.');
    }
  };

  useEffect(() => {
    if (funnelKey === 'wappyvital') {
      axios.get('/api/wompi/configured-plans')
        .then(({ data }) => {
          setFetchedPlans(data);
        })
        .catch(err => {
          console.error('Error fetching vital/pro plan config from plans API:', err);
        });
    }
  }, [funnelKey]);

  useEffect(() => {
    fetchConfig();
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Redirect flow verification (PSE/bank transfers)
    const verifyRedirectTransaction = async () => {
      const params = new URLSearchParams(window.location.search);
      const transactionId = params.get('id');
      if (transactionId) {
        try {
          setIsAccessChecking(true);
          const response = await axios.post('/api/comunidad/verify', { transactionId, funnelKey });
          if (response.data.success) {
            const { email, fullName, phone } = response.data;
            localStorage.setItem(getStorageKey('wappy_comunidad_email'), email);
            setUserEmail(email);
            if (phone) {
              localStorage.setItem(getStorageKey('wappy_comunidad_phone'), phone);
              setUserPhone(phone);
            }
            setIsAccessGranted(true);
            setShowLeadModal(false);
            
            // Trigger Pixel with Advanced Matching
            triggerMetaPurchasePixel(email, fullName, phone);

            // Clean query parameters from URL to avoid repeating on refresh
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
          }
        } catch (err) {
          console.error('[Redirect Verify] Error:', err);
        } finally {
          setIsAccessChecking(false);
        }
      }
    };
    verifyRedirectTransaction();
  }, []);

  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('wappy_sess_id');
    if (!id) {
      id = 'wappy_sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('wappy_sess_id', id);
    }
    return id;
  });

  // Track page visit and heartbeat duration
  useEffect(() => {
    if (configLoading) return;
    
    // Register initial page visit
    axios.post('/api/comunidad/metrics/session', { sessionId, funnelKey }).catch(err => {});

    // Duration heartbeat timer
    let durationCounter = 0;
    const interval = setInterval(() => {
      durationCounter += 10;
      axios.post('/api/comunidad/metrics/session', {
        sessionId,
        durationSeconds: durationCounter,
        funnelKey
      }).catch(err => {});
    }, 10000);

    return () => clearInterval(interval);
  }, [sessionId, configLoading]);

  // Click tracking helper
  const trackClick = (clickType: 'playVideo' | 'quickAccess' | 'checkoutSubmit' | 'downloadFile' | 'recoverAccess' | 'whatsapp') => {
    axios.post('/api/comunidad/metrics/session', { sessionId, clickType, funnelKey }).catch(err => {});
  };

  // 2. Check Access for Returning User
  useEffect(() => {
    if (configLoading) return;
    
    // If not in paid mode, we bypass paid check
    if (!actualRequiresPayment) {
      setIsAccessChecking(false);
      return;
    }

    if (!userEmail) {
      setIsAccessChecking(false);
      return;
    }

    axios.post('/api/comunidad/check-access', { email: userEmail, funnelKey })
      .then(res => {
        if (res.data.isPaid) {
          setIsAccessGranted(true);
          setUserFullName(res.data.fullName);
          if (res.data.videoWatched) {
            setIsVideoFinished(true); // if they watched it, immediately unlock materials!
          }
          if (res.data.purchaseTracked === false) {
            triggerMetaPurchasePixel(userEmail);
          }
        }
      })
      .catch(err => {
        console.error('[Comunidad] Access check failed:', err);
      })
      .finally(() => {
        setIsAccessChecking(false);
      });
  }, [userEmail, actualRequiresPayment, configLoading]);

  // 3. Auto-populate fields and email checking if user is logged in
  useEffect(() => {
    if (user) {
      if (user.email && !userEmail) {
        setUserEmail(user.email);
      }
      setCheckoutFullName(user.name || user.username || '');
      setCheckoutEmail(user.email || '');
      setCheckoutPhone(user.phoneNumber || user.phone || '');
      setAcceptedPolicies(true);
    }
  }, [user, userEmail]);

  // 4. Silent lead registration for logged-in users in Free Mode
  useEffect(() => {
    if (configLoading) return;
    if (actualRequiresPayment) return;
    if (!user) return;
    if (isLeadCaptured) return;

    const fullName = user.name || user.username || 'Usuario WAPPY';
    const email = user.email || '';
    const phone = user.phoneNumber || user.phone || '';

    if (!email) return;

    axios.post('/api/admin/leads', {
      fullName,
      email,
      phone,
      videoUrl,
      funnelKey
    })
    .then(() => {
      localStorage.setItem(getStorageKey('wappy_lead_captured'), 'true');
      localStorage.setItem(getStorageKey('wappy_lead_data'), JSON.stringify({ 
        fullName, 
        email, 
        phone 
      }));
      setIsLeadCaptured(true);
      console.log('[Comunidad] Silent lead registration completed for logged-in user.');
    })
    .catch((err) => {
      console.error('[Comunidad] Silent lead registration failed:', err);
    });
  }, [user, actualRequiresPayment, configLoading, isLeadCaptured, videoUrl]);

  // Load YouTube API script dynamically
  useEffect(() => {
    if (!isYouTube) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, [isYouTube]);

  // Hook into the YouTube Player Iframe API
  useEffect(() => {
    if (!isYouTube) return;

    let intervalId: NodeJS.Timeout;
    let ytPlayer: any = null;

    const initializeYTPlayer = () => {
      if (window.YT && window.YT.Player) {
        ytPlayer = new window.YT.Player('wappy-yt-player', {
          events: {
            onReady: (event: any) => {
              setDuration(event.target.getDuration());
              const savedProgress = localStorage.getItem(getStorageKey('wappy_comunidad_video_progress'));
              if (savedProgress) {
                const seekTime = parseFloat(savedProgress);
                if (seekTime > 0 && seekTime < event.target.getDuration() - 2) {
                  event.target.seekTo(seekTime, true);
                }
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              if (state === 1) { // Playing
                setIsPlaying(true);
              } else if (state === 2) { // Paused
                setIsPlaying(false);
              } else if (state === 0) { // Ended
                setIsPlaying(false);
                handleVideoFinished();
              }
            }
          }
        });
        ytPlayerRef.current = ytPlayer;

        // Poll current playback time securely every 200ms
        intervalId = setInterval(() => {
          if (ytPlayer && typeof ytPlayer.getCurrentTime === 'function') {
            try {
              const time = ytPlayer.getCurrentTime();
              setCurrentTime(time);
              const totalDuration = ytPlayer.getDuration();
              if (totalDuration > 0) setDuration(totalDuration);

              // Save progress locally if video is not finished yet
              const savedFinished = localStorage.getItem(getStorageKey('wappy_comunidad_video_finished')) === 'true';
              if (time > 1 && !savedFinished && (!totalDuration || time < totalDuration - 2)) {
                localStorage.setItem(getStorageKey('wappy_comunidad_video_progress'), time.toString());
              }

              // Check if playback should be gated (Free Mode lead capture or Paid Mode payment popup)
              const isCurrentlyPlaying = isPlaying || (ytPlayer && typeof ytPlayer.getPlayerState === 'function' && ytPlayer.getPlayerState() === 1);
              const shouldGate = isCurrentlyPlaying && gatingEnabled && time >= gatingSeconds && !showLeadModalRef.current && !isAdmin && (
                funnelKey === 'wappyvital'
                  ? (!isLeadCapturedRef.current && !user)
                  : (actualRequiresPayment 
                      ? !isAccessGrantedRef.current 
                      : (!isLeadCapturedRef.current && !user)
                    )
              );

              if (shouldGate) {
                ytPlayer.pauseVideo();
                setIsPlaying(false);
                setShowLeadModal(true);
              }
            } catch (err) {
              // Frame may not be fully loaded
            }
          }
        }, 200);
      }
    };

    if (window.YT && window.YT.Player) {
      initializeYTPlayer();
    } else {
      const pollYTSDK = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(pollYTSDK);
          initializeYTPlayer();
        }
      }, 100);

      return () => {
        clearInterval(pollYTSDK);
        if (intervalId) clearInterval(intervalId);
      };
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (ytPlayer && typeof ytPlayer.destroy === 'function') {
        ytPlayer.destroy();
      }
    };
  }, [isYouTube, videoUrl, actualRequiresPayment, gatingSeconds, gatingEnabled]);

  // Monitor playback time for HTML5 video
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);

      // Save progress locally if video is not finished yet
      const savedFinished = localStorage.getItem(getStorageKey('wappy_comunidad_video_finished')) === 'true';
      if (time > 1 && !savedFinished && (!video.duration || time < video.duration - 2)) {
        localStorage.setItem(getStorageKey('wappy_comunidad_video_progress'), time.toString());
      }
      
      // Check if playback should be gated (Free Mode lead capture or Paid Mode payment popup)
      const shouldGate = gatingEnabled && video.currentTime >= gatingSeconds && !showLeadModalRef.current && !isAdmin && (
        funnelKey === 'wappyvital'
          ? (!isLeadCapturedRef.current && !user)
          : (actualRequiresPayment 
              ? !isAccessGrantedRef.current 
              : (!isLeadCapturedRef.current && !user)
            )
      );

      if (shouldGate) {
        video.pause();
        setIsPlaying(false);
        video.currentTime = gatingSeconds; // Lock to exactly gatingSeconds
        setShowLeadModal(true);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      const savedProgress = localStorage.getItem(getStorageKey('wappy_comunidad_video_progress'));
      if (savedProgress) {
        const seekTime = parseFloat(savedProgress);
        if (seekTime > 0 && seekTime < video.duration - 2) {
          video.currentTime = seekTime;
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      handleVideoFinished();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl, isYouTube, actualRequiresPayment, gatingSeconds, gatingEnabled]);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Prevent seeking via keyboard
  useEffect(() => {
    if (showLeadModal || (funnelKey !== 'wappyvital' && actualRequiresPayment && !isAccessGranted && !isAdmin && !gatingEnabled)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const blockedKeys = [
        'ArrowLeft', 'ArrowRight', 'Home', 'End', 
        'j', 'J', 'l', 'L', 'k', 'K', 
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 
        'PageUp', 'PageDown', 'i', 'I', 't', 'T'
      ];
      
      if (blockedKeys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showLeadModal, isPlaying, videoUrl, actualRequiresPayment, isAccessGranted, isAdmin]);

  // Video completion callback
  const handleVideoFinished = async () => {
    setIsVideoFinished(true);
    localStorage.setItem(getStorageKey('wappy_comunidad_video_finished'), 'true');
    localStorage.removeItem(getStorageKey('wappy_comunidad_video_progress'));

    if (funnelKey === 'wappyvital' && !isAccessGranted) {
      setShowDiscountModal(true);
    }
    
    // Save completion state to DB if email is available (in free/paid modes)
    let email = userEmail;
    if (!email) {
      const leadDataStr = localStorage.getItem(getStorageKey('wappy_lead_data'));
      if (leadDataStr) {
        try {
          email = JSON.parse(leadDataStr).email || '';
        } catch (e) {
          // ignore
        }
      }
    }

    if (email) {
      try {
        await axios.post('/api/comunidad/video-finished', { email });
        console.log('[Comunidad] Persisted video watched status.');
      } catch (err) {
        console.error('[Comunidad] Error persisting progress:', err);
      }
    }
  };

  const playYouTube = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const pauseYouTube = () => {
    if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
      ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (showLeadModal || (funnelKey !== 'wappyvital' && actualRequiresPayment && !isAccessGranted && !isAdmin && !gatingEnabled)) return;

    // Immediate gating check on play attempt if past gatingSeconds
    const isPastGating = currentTime >= gatingSeconds;
    const isGated = gatingEnabled && !isAdmin && (
      funnelKey === 'wappyvital'
        ? (!isLeadCaptured && !user)
        : (actualRequiresPayment 
            ? !isAccessGranted 
            : (!isLeadCaptured && !user)
          )
    );

    if (isPastGating && isGated) {
      setShowLeadModal(true);
      return;
    }

    if (isYouTube) {
      if (isPlaying) {
        pauseYouTube();
      } else {
        trackClick('playVideo');
        playYouTube();
      }
    } else {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        trackClick('playVideo');
        video.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error("Error playing video:", err));
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error("Error entering fullscreen:", err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Custom visual progress bar math
  const getProgressBarWidth = () => {
    const isUnlocked = isAdmin || isAccessGranted || isLeadCaptured || !gatingEnabled;
    const targetDuration = isUnlocked ? duration : gatingSeconds;
    if (targetDuration <= 0) return 0;
    
    const x = Math.min(Math.max(currentTime / targetDuration, 0), 1);
    const nonLinearX = 1 - Math.pow(1 - x, 2); // Quadratic ease-out curve
    return nonLinearX * 100;
  };

  // --- Dynamic Payment Checkout Flow (Wompi) ---
  const handleWompiCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutFullName.trim()) {
      setCheckoutError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!checkoutEmail.trim() || !/\S+@\S+\.\S+/.test(checkoutEmail)) {
      setCheckoutError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!checkoutPhone.trim() || checkoutPhone.length < 7) {
      setCheckoutError('Por favor, ingresa un número de celular válido.');
      return;
    }
    if (funnelKey === 'wappyvital') {
      if (!checkoutPassword || checkoutPassword.length < 8) {
        setCheckoutError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
    }
    if (!acceptedPolicies) {
      setCheckoutError('Debes aceptar las políticas de WAPPY para continuar.');
      return;
    }

    trackClick('checkoutSubmit');
    setIsCheckoutSubmitting(true);

    const finalPlan = selectedCheckoutPlan || 'vital';

    // Start Wompi Checkout
    try {
      if (funnelKey === 'wappyvital' && finalPlan === 'pro') {
        // subscription guest checkout (Wappy Pro)
        const { data } = await axios.post('/api/wompi/guest-checkout', {
          name: checkoutFullName.trim(),
          email: checkoutEmail.trim(),
          password: checkoutPassword,
          plan: 'pro|' + billingInterval,
          promoCode: couponCode.trim() || undefined,
          phone: checkoutPhone.trim()
        });

        if (!window.WidgetCheckout) {
          const script = document.createElement('script');
          script.src = 'https://checkout.wompi.co/widget.js';
          script.async = true;
          script.onload = () => {
            openWompiWidgetPro(data, checkoutEmail.trim());
          };
          document.body.appendChild(script);
        } else {
          openWompiWidgetPro(data, checkoutEmail.trim());
        }
      } else {
        // standard community checkout (vital / sst)
        const finalPrice = (couponCode.toUpperCase().trim() === 'VITAL30' && funnelKey === 'wappyvital') ? Math.round(basePrice * 0.7) : basePrice;
        if (window.fbq) {
          window.fbq('track', 'InitiateCheckout', {
            content_name: funnelKey === 'wappyvital' ? 'Membresía Wappy Vital' : 'Curso SST IA + 10 Aplicativos',
            value: finalPrice || 28000,
            currency: 'COP'
          });
        }

        const { data } = await axios.post('/api/comunidad/checkout', {
          fullName: checkoutFullName.trim(),
          email: checkoutEmail.trim(),
          phone: checkoutPhone.trim(),
          funnelKey,
          discountCode: couponCode.trim(),
          password: checkoutPassword
        });

        if (data.freeAccess || data.alreadyPaid) {
          localStorage.setItem(getStorageKey('wappy_comunidad_email'), checkoutEmail.trim());
          setUserEmail(checkoutEmail.trim());
          setIsAccessGranted(true);
          setShowLeadModal(false);
          if (data.videoWatched) {
            setIsVideoFinished(true);
          }
          setIsCheckoutSubmitting(false);

          if (funnelKey === 'wappyvital') {
            try {
              await login({
                email: checkoutEmail.trim(),
                password: checkoutPassword
              });
            } catch (loginErr) {
              alert('Esta cuenta ya tiene la membresía activa. Por favor, inicia sesión con tu contraseña.');
              navigate('/login');
            }
          } else {
            alert('¡Ya tienes acceso concedido! Disfruta del curso.');
          }
          return;
        }

        if (!window.WidgetCheckout) {
          const script = document.createElement('script');
          script.src = 'https://checkout.wompi.co/widget.js';
          script.async = true;
          script.onload = () => {
            openWompiWidget(data, checkoutEmail.trim());
          };
          document.body.appendChild(script);
        } else {
          openWompiWidget(data, checkoutEmail.trim());
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err?.response?.data?.message || err.message || 'Error al iniciar el proceso de pago.';
      setCheckoutError(errMsg);
      setIsCheckoutSubmitting(false);
    }
  };

  const openWompiWidget = (wompiData: any, email: string) => {
    setIsCheckoutSubmitting(false);
    
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: wompiData.amountInCents,
      reference: wompiData.reference,
      publicKey: wompiData.publicKey,
      signature: wompiData.signature ? { integrity: wompiData.signature } : undefined,
      redirectUrl: window.location.href
    });

    checkout.open(async (result: any) => {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        try {
          setIsAccessChecking(true);
          const response = await axios.post('/api/comunidad/verify', { transactionId: transaction.id, funnelKey });
          if (response.data.success) {
            localStorage.setItem(getStorageKey('wappy_comunidad_email'), email);
            setUserEmail(email);
            if (checkoutPhone) {
              localStorage.setItem(getStorageKey('wappy_comunidad_phone'), checkoutPhone);
              setUserPhone(checkoutPhone);
            }
            setIsAccessGranted(true);
            setShowLeadModal(false);
            triggerMetaPurchasePixel(email, checkoutFullName, checkoutPhone);

            // Log in automatically after payment is approved
            if (funnelKey === 'wappyvital') {
              try {
                await login({
                  email: email.trim(),
                  password: checkoutPassword
                });
              } catch (loginErr) {
                console.error('[Auto-login] failed after approval:', loginErr);
              }
            }
          }
        } catch (err) {
          console.error('[Wompi Verify] Error:', err);
        } finally {
          setIsAccessChecking(false);
        }
      } else if (transaction.status === 'PENDING') {
        alert('Tu pago está siendo procesado por tu banco. Tan pronto sea aprobado, podrás acceder escribiendo tu correo en la opción "Recuperar acceso".');
      } else {
        alert('El pago no fue aprobado. Por favor, intenta de nuevo o con otro medio de pago.');
      }
    });
  };

  const openWompiWidgetPro = (wompiData: any, email: string) => {
    setIsCheckoutSubmitting(false);
    
    const checkout = new window.WidgetCheckout({
      currency: 'COP',
      amountInCents: wompiData.amountInCents,
      reference: wompiData.reference,
      publicKey: wompiData.publicKey,
      signature: wompiData.signature ? { integrity: wompiData.signature } : undefined,
      redirectUrl: window.location.origin + '/c/new'
    });

    checkout.open(async (result: any) => {
      const transaction = result.transaction;
      if (transaction.status === 'APPROVED') {
        try {
          setIsAccessChecking(true);
          if (wompiData.guestToken) {
            await axios.post('/api/wompi/guest-verify', {
              transactionId: transaction.id,
              guestToken: wompiData.guestToken
            });
          } else {
            await axios.post('/api/wompi/verify-transaction', { transactionId: transaction.id });
          }
          localStorage.setItem(getStorageKey('wappy_comunidad_email'), email);
          setUserEmail(email);
          if (checkoutPhone) {
            localStorage.setItem(getStorageKey('wappy_comunidad_phone'), checkoutPhone);
            setUserPhone(checkoutPhone);
          }
          alert('¡Suscripción Wappy Pro activada con éxito!');
          // Log in automatically after payment is approved
          try {
            await login({
              email: email.trim(),
              password: checkoutPassword
            });
          } catch (loginErr) {
            console.error('[Pro Auto-login] failed:', loginErr);
            window.location.href = '/c/new';
          }
        } catch (err) {
          console.error('[Wompi Verify Pro] Error:', err);
          window.location.href = '/c/new';
        } finally {
          setIsAccessChecking(false);
        }
      } else if (transaction.status === 'PENDING') {
        alert('Tu suscripción está siendo procesada por tu banco. Podrás acceder tan pronto se apruebe.');
        window.location.href = '/c/new';
      } else {
        alert('El pago no fue aprobado. Por favor, intenta de nuevo o con otro medio de pago.');
      }
    });
  };

  // --- Access Recovery Flow ---
  const handleRecoverAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (!recoveryEmail.trim() || !/\S+@\S+\.\S+/.test(recoveryEmail)) {
      setRecoveryError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    trackClick('recoverAccess');
    setIsRecovering(true);

    try {
      const response = await axios.post('/api/comunidad/check-access', { email: recoveryEmail.trim(), funnelKey });
      if (response.data.isPaid) {
        localStorage.setItem(getStorageKey('wappy_comunidad_email'), recoveryEmail.trim());
        setUserEmail(recoveryEmail.trim());
        setIsAccessGranted(true);
        setRecoverySuccess('¡Acceso recuperado con éxito! Bienvenido de vuelta.');
        
        if (response.data.videoWatched) {
          setIsVideoFinished(true);
        }
        if (response.data.purchaseTracked === false) {
          triggerMetaPurchasePixel(recoveryEmail.trim(), response.data.fullName, response.data.phone);
        }
        
        setTimeout(() => {
          setShowRecoveryView(false);
          setRecoverySuccess('');
        }, 2000);
      } else {
        setRecoveryError('No se encontró ningún pago aprobado asociado a este correo. Verifica los datos o realiza tu compra.');
      }
    } catch (err: any) {
      setRecoveryError('Error al validar el correo.');
    } finally {
      setIsRecovering(false);
    }
  };

  // --- Free Lead Capture Form Submit ---
  const handleLeadFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutFullName.trim()) {
      setCheckoutError('Por favor, ingresa tu nombre completo.');
      return;
    }
    if (!checkoutEmail.trim() || !/\S+@\S+\.\S+/.test(checkoutEmail)) {
      setCheckoutError('Por favor, ingresa un correo electrónico válido.');
      return;
    }
    if (!checkoutPhone.trim() || checkoutPhone.length < 7) {
      setCheckoutError('Por favor, ingresa un número de celular válido.');
      return;
    }
    if (!acceptedPolicies) {
      setCheckoutError('Debes aceptar las políticas de WAPPY para continuar.');
      return;
    }

    trackClick('checkoutSubmit');
    setIsCheckoutSubmitting(true);

    try {
      await axios.post('/api/admin/leads', {
        fullName: checkoutFullName.trim(),
        email: checkoutEmail.trim(),
        phone: checkoutPhone.trim(),
        videoUrl,
        funnelKey
      });

      localStorage.setItem(getStorageKey('wappy_lead_captured'), 'true');
      localStorage.setItem(getStorageKey('wappy_lead_data'), JSON.stringify({ 
        fullName: checkoutFullName, 
        email: checkoutEmail, 
        phone: checkoutPhone 
      }));
      setIsLeadCaptured(true);
      setShowLeadModal(false);
      setIsCheckoutSubmitting(false);
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Curso SST IA + 10 Aplicativos'
        });
      }
      
      // Auto-resume video
      if (isYouTube) {
        playYouTube();
      } else if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(err => console.error("Error playing video:", err));
      }
    } catch (err: any) {
      setCheckoutError('Error al registrar tus datos.');
      setIsCheckoutSubmitting(false);
    }
  };

  const handleQuickAccessClick = () => {
    trackClick('quickAccess');
    // Pause video
    if (isYouTube) {
      pauseYouTube();
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
    
    if (funnelKey === 'wappyvital') {
      setSelectedCheckoutPlan('vital');
      setShowLeadModal(true);
    } else {
      setShowLeadModal(true);
    }
  };

  const handleScrollToCard = () => {
    const card = document.getElementById('wappy-vital-card');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };


  // --- Admin: Config Settings Submit ---
  const handleSaveAdminConfig = async () => {
    setIsSavingConfig(true);
    try {
      const response = await axios.post('/api/comunidad/config', {
        videoUrl: tempVideoUrl,
        requiresPayment: tempRequiresPayment,
        price: tempPrice,
        gatingSeconds: tempGatingSeconds,
        gatingEnabled: tempGatingEnabled,
        showQuickAccessBanner: tempShowQuickAccessBanner,
        downloadableFiles: tempFiles,
        whatsappUrl: tempWhatsappUrl,
        extraVideoUrl1: tempExtraVideoUrl1,
        extraVideoTitle1: tempExtraVideoTitle1,
        extraVideoUrl2: tempExtraVideoUrl2,
        extraVideoTitle2: tempExtraVideoTitle2,
        extraVideoUrl3: tempExtraVideoUrl3,
        extraVideoTitle3: tempExtraVideoTitle3,
        extraVideoUrl4: tempExtraVideoUrl4,
        extraVideoTitle4: tempExtraVideoTitle4,
        extraVideoUrl5: tempExtraVideoUrl5,
        extraVideoTitle5: tempExtraVideoTitle5,
        extraVideoUrl6: tempExtraVideoUrl6,
        extraVideoTitle6: tempExtraVideoTitle6,
        extraVideoUrl7: tempExtraVideoUrl7,
        extraVideoTitle7: tempExtraVideoTitle7,
        extraVideoUrl8: tempExtraVideoUrl8,
        extraVideoTitle8: tempExtraVideoTitle8,
        extraVideoUrl9: tempExtraVideoUrl9,
        extraVideoTitle9: tempExtraVideoTitle9,
        extraVideoUrl10: tempExtraVideoUrl10,
        extraVideoTitle10: tempExtraVideoTitle10,
        funnelKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setVideoUrl(tempVideoUrl);
        setRequiresPayment(tempRequiresPayment);
        setPrice(tempPrice);
        setGatingSeconds(tempGatingSeconds);
        setGatingEnabled(tempGatingEnabled);
        setShowQuickAccessBanner(tempShowQuickAccessBanner);
        setDownloadableFiles(tempFiles);
        setWhatsappUrl(tempWhatsappUrl);
        setExtraVideoUrl1(tempExtraVideoUrl1);
        setExtraVideoTitle1(tempExtraVideoTitle1);
        setExtraVideoUrl2(tempExtraVideoUrl2);
        setExtraVideoTitle2(tempExtraVideoTitle2);
        setExtraVideoUrl3(tempExtraVideoUrl3);
        setExtraVideoTitle3(tempExtraVideoTitle3);
        setExtraVideoUrl4(tempExtraVideoUrl4);
        setExtraVideoTitle4(tempExtraVideoTitle4);
        setExtraVideoUrl5(tempExtraVideoUrl5);
        setExtraVideoTitle5(tempExtraVideoTitle5);
        setExtraVideoUrl6(tempExtraVideoUrl6);
        setExtraVideoTitle6(tempExtraVideoTitle6);
        setExtraVideoUrl7(tempExtraVideoUrl7);
        setExtraVideoTitle7(tempExtraVideoTitle7);
        setExtraVideoUrl8(tempExtraVideoUrl8);
        setExtraVideoTitle8(tempExtraVideoTitle8);
        setExtraVideoUrl9(tempExtraVideoUrl9);
        setExtraVideoTitle9(tempExtraVideoTitle9);
        setExtraVideoUrl10(tempExtraVideoUrl10);
        setExtraVideoTitle10(tempExtraVideoTitle10);
        setIsAdminPanelOpen(false);
        setIsVideoFinished(false);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.load();
        }
        alert('Configuración guardada exitosamente.');
      }
    } catch (err) {
      console.error('[Admin Config] Save error:', err);
      alert('Hubo un error al guardar la configuración.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDownloadQR = () => {
    const svgElement = document.getElementById('comunidad-qr-svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 500;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, 500, 500);
        context.drawImage(image, 25, 25, 450, 450);

        const pngURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngURL;
        downloadLink.download = `QR_Acceso_Comunidad_${funnelKey}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  const handleCopyLink = () => {
    const fullUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(fullUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- Admin: Files Upload & Management ---
  const handleUploadFile = async () => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo primero.');
      return;
    }
    if (!uploadFileName.trim()) {
      alert('Por favor ingresa un nombre para mostrar al usuario.');
      return;
    }

    setIsFileUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post('/api/comunidad/upload', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      if (response.data.success) {
        const uploaded = response.data.file;
        const newFile = {
          name: uploadFileName.trim(),
          url: uploaded.url,
          filename: uploaded.filename
        };
        const updatedFiles = [...tempFiles, newFile];
        setTempFiles(updatedFiles);
        setDownloadableFiles(updatedFiles);

        // Auto-save immediately to DB to prevent session/save mismatches
        await axios.post('/api/comunidad/config', {
          downloadableFiles: updatedFiles,
          funnelKey
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSelectedFile(null);
        setUploadFileName('');
        const fileInput = document.getElementById('comunidad-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err: any) {
      console.error('[Admin Upload] File upload error:', err);
      alert(err.response?.data?.error || 'Error al subir el archivo.');
    } finally {
      setIsFileUploading(false);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const updatedFiles = tempFiles.filter((_, idx) => idx !== index);
    setTempFiles(updatedFiles);
    setDownloadableFiles(updatedFiles);

    try {
      await axios.post('/api/comunidad/config', {
        downloadableFiles: updatedFiles,
        funnelKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('[Admin Remove] Remove error:', err);
      alert('Hubo un error al eliminar el archivo del servidor.');
    }
  };


  // --- Admin Dashboard (Leads & Purchases lists) ---
  const fetchDashboardData = async () => {
    setIsLoadingLeads(true);
    try {
      const [leadsRes, purchasesRes, metricsRes] = await Promise.all([
        axios.get('/api/admin/leads', { params: { funnelKey }, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/comunidad/purchases', { params: { funnelKey }, headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/comunidad/metrics/stats', { params: { funnelKey }, headers: { Authorization: `Bearer ${token}` } }).catch(err => {
          console.error('[Admin Dashboard] Fetch metrics stats error:', err);
          return { data: null };
        })
      ]);
      setLeads(leadsRes.data || []);
      setPurchases(purchasesRes.data || []);
      setMetricsStats(metricsRes.data || null);
    } catch (err) {
      console.error('[Admin Dashboard] Fetch metrics error:', err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin, isLeadsPanelOpen]);

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este lead registrado?')) {
      return;
    }
    try {
      const response = await axios.delete(`/api/admin/leads/${leadId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setLeads(prev => prev.filter(l => l._id !== leadId));
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error al intentar eliminar.');
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de pago? Se le suspenderá el acceso al usuario.')) {
      return;
    }
    try {
      const response = await axios.delete(`/api/comunidad/purchases/${purchaseId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        setPurchases(prev => prev.filter(p => p._id !== purchaseId));
      }
    } catch (err) {
      console.error('Error deleting purchase:', err);
      alert('Error al intentar eliminar.');
    }
  };

  const getActiveList = () => {
    if (dashboardTab === 'leads') return leads;
    if (dashboardTab === 'purchases') return purchases.filter(p => p.isPaid);
    return purchases.filter(p => !p.isPaid);
  };

  const handleExportCSV = () => {
    const isLeads = dashboardTab === 'leads';
    const activeList = getActiveList();
    if (activeList.length === 0) return;

    let headers = [];
    let rows = [];

    if (isLeads) {
      headers = ['Nombre Completo', 'Correo Electrónico', 'Número de Celular', 'Fecha de Registro'];
      rows = activeList.map(item => [
        `"${item.fullName.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${item.phone.replace(/"/g, '""')}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ]);
    } else {
      headers = ['Nombre Completo', 'Correo Electrónico', 'Celular', 'Monto Intentado/Pagado', 'Referencia Wompi', 'Estado de Transacción', 'Vio Video Completo', 'Fecha de Registro'];
      rows = activeList.map(item => [
        `"${item.fullName.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${item.phone.replace(/"/g, '""')}"`,
        `"$${((item.amountInCents || 0) / 100).toLocaleString('es-CO')}"`,
        `"${item.wompiReference || ''}"`,
        `"${item.status || 'PENDING'}"`,
        `"${item.videoWatched ? 'Sí' : 'No'}"`,
        `"${new Date(item.createdAt).toLocaleString()}"`
      ]);
    }

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `WAPPY_${dashboardTab === 'leads' ? 'Leads' : dashboardTab === 'purchases' ? 'Pagos_Aprobados' : 'Intentos_Pago'}_Comunidad_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isUnlocked = isAdmin || isAccessGranted || (funnelKey !== 'wappyvital' && (!gatingEnabled || (!actualRequiresPayment && isLeadCaptured)));

  return (
    <div className={`min-h-screen bg-surface-secondary text-text-primary font-sans relative overflow-x-hidden transition-colors duration-300 flex flex-col justify-between ${funnelKey === 'comunidadmp' ? 'comunidadmp-bg' : ''}`}>
      
      {/* Corner Brackets for Mauricio Posada theme */}
      {funnelKey === 'comunidadmp' && (
        <>
          <span className="bracket-mp tl"></span>
          <span className="bracket-mp tr"></span>
          <span className="bracket-mp bl"></span>
          <span className="bracket-mp br"></span>
        </>
      )}

      {/* Premium Tech Grid & Flowing Ambient Light */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)]"></div>
        {funnelKey === 'comunidadmp' ? (
          <>
            <div className="absolute top-[10%] left-[20%] w-[60vw] h-[50vw] rounded-full bg-[#0EA5A5]/[0.08] blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[15%] w-[45vw] h-[45vw] rounded-full bg-[#06B6D4]/[0.06] blur-[120px] pointer-events-none" />
          </>
        ) : (
          <>
            <div className="absolute top-[-20%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/[0.04] dark:bg-emerald-500/[0.07] blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-teal-500/[0.03] dark:bg-teal-500/[0.06] blur-[130px] animate-pulse" style={{ animationDuration: '12s' }} />
            <div className="absolute top-[30%] right-[10%] w-[30vw] h-[30vw] rounded-full bg-cyan-500/[0.02] dark:bg-cyan-500/[0.04] blur-[110px]" />
          </>
        )}
      </div>

      {funnelKey === 'comunidadmp' && (
        <>
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet" />
          <style>{`
            :root {
              --teal: #0EA5A5;
              --teal-bright: #14D4D4;
              --green: #10B981;
              --green-bright: #34D399;
              --cyan: #06B6D4;
              --glow: .4;
              --space-grotesk: 'Space Grotesk', sans-serif;
            }
            .font-space-grotesk {
              font-family: 'Space Grotesk', sans-serif !important;
            }
            /* Mauricio Presentation Custom overrides */
            .comunidadmp-bg {
              background-color: #000000 !important;
              background-image: radial-gradient(ellipse 70% 50% at 25% 30%, rgba(14,165,165,0.06) 0%, transparent 70%),
                                radial-gradient(ellipse 60% 70% at 85% 70%, rgba(6,182,212,0.04) 0%, transparent 70%) !important;
              color: #FFFFFF !important;
            }
            .comunidadmp-title {
              font-family: 'Space Grotesk', sans-serif !important;
              font-weight: 700 !important;
              color: #FFFFFF !important;
              text-shadow: 0 0 30px rgba(14,165,165,0.4);
            }
            .comunidadmp-kicker {
              font-family: 'JetBrains Mono', monospace !important;
              font-size: 14px !important;
              letter-spacing: 0.16em !important;
              text-transform: uppercase !important;
              color: #14D4D4 !important;
              font-weight: 600 !important;
            }
            .comunidadmp-card {
              padding: 24px 28px !important;
              border-radius: 18px !important;
              background: rgba(14,165,165,0.08) !important;
              border: 2px solid rgba(14,165,165,0.35) !important;
              transition: all 0.3s !important;
            }
            .comunidadmp-card:hover {
              border-color: #14D4D4 !important;
              transform: translateY(-4px);
              box-shadow: 0 10px 30px rgba(14,165,165,0.15);
            }
            .comunidadmp-btn-whatsapp {
              border: 2px solid rgba(14,165,165,0.45) !important;
              background: rgba(14,165,165,0.12) !important;
              color: #14D4D4 !important;
              transition: all 0.3s !important;
            }
            .comunidadmp-btn-whatsapp:hover {
              background: #0EA5A5 !important;
              border-color: #14D4D4 !important;
              color: #FFFFFF !important;
              transform: scale(1.04);
            }
            .comunidadmp-btn-wappy {
              background: linear-gradient(135deg, #14D4D4, #34D399) !important;
              color: #000000 !important;
              font-weight: 700 !important;
              box-shadow: 0 0 25px rgba(20,212,212,0.4) !important;
            }
            .comunidadmp-btn-wappy:hover {
              background: linear-gradient(135deg, #14D4D4, #06B6D4) !important;
              transform: scale(1.04);
            }
            /* Corner Brackets Style */
            .bracket-mp {
              position: fixed;
              width: 32px;
              height: 32px;
              border: 3px solid rgba(14,165,165,0.35);
              z-index: 90;
              pointer-events: none;
            }
            .bracket-mp.tl { top: 20px; left: 20px; border-right: none; border-bottom: none; }
            .bracket-mp.tr { top: 20px; right: 20px; border-left: none; border-bottom: none; }
            .bracket-mp.bl { bottom: 20px; left: 20px; border-right: none; border-top: none; }
            .bracket-mp.br { bottom: 20px; right: 20px; border-left: none; border-top: none; }
          `}</style>
        </>
      )}

      <style>{`
        @keyframes floatEffect {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .animate-premium-float {
          animation: floatEffect 4s ease-in-out infinite;
        }
      `}</style>

      {/* Fixed bottom left theme selector */}
      <div className="fixed bottom-4 left-4 z-50">
        <ThemeSelector />
      </div>

      <div>
        {/* Top Header Navbar */}
        <nav className="w-full max-w-6xl mx-auto px-4 py-4 sm:px-6 sm:py-4 flex items-center justify-between relative z-10 border border-border-medium/40 bg-surface-primary/40 backdrop-blur-md rounded-2xl mt-4 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-md rounded-xl"></div>
              <img src="/assets/logo.png" alt="WAPPY Logo" className="h-14 sm:h-20 w-auto relative z-10" />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    localStorage.removeItem(getStorageKey('wappy_comunidad_email'));
                    localStorage.removeItem(getStorageKey('wappy_lead_captured'));
                    localStorage.removeItem(getStorageKey('wappy_lead_data'));
                    localStorage.removeItem(getStorageKey('wappy_comunidad_video_finished'));
                    localStorage.removeItem(getStorageKey('wappy_comunidad_video_progress'));
                    setIsAccessGranted(false);
                    setIsLeadCaptured(false);
                    setShowLeadModal(false);
                    setCurrentTime(0);
                    window.location.reload();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all text-xs font-semibold shadow-sm"
                  title="Reinicia las cookies locales para probar la vista pública"
                >
                  Reiniciar Sesión
                </button>

                <button
                  onClick={() => {
                    setIsLeadsPanelOpen(!isLeadsPanelOpen);
                    setIsAdminPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-primary hover:bg-surface-hover text-text-primary border border-border-medium transition-all text-xs font-semibold shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Métricas de Comunidad
                </button>

                <button
                  onClick={() => {
                    setIsAdminPanelOpen(!isAdminPanelOpen);
                    setIsLeadsPanelOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-primary hover:bg-surface-hover text-text-primary border border-border-medium transition-all text-xs font-semibold shadow-sm"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-500" />
                  Ajustes de Curso
                </button>
              </>
            )}

            <>
              <a
                href="https://wa.me/573106415385"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('whatsapp')}
                className={`px-3.5 py-2 rounded-full border border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 font-semibold transition-all duration-300 text-[10px] sm:text-xs flex items-center gap-1 sm:gap-1.5 ${funnelKey === 'comunidadmp' ? 'comunidadmp-btn-whatsapp' : ''}`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.02-5.11-2.881-6.974-1.862-1.864-4.339-2.89-6.974-2.891-5.438 0-9.862 4.422-9.866 9.86-.001 1.702.453 3.361 1.311 4.816L1.874 21.66l4.773-1.506zm13.114-6.398c-.29-.145-1.716-.847-1.978-.942-.262-.096-.453-.145-.644.145-.19.29-.738.942-.905 1.133-.166.19-.333.214-.623.069-.29-.145-1.22-.449-2.324-1.433-.859-.767-1.439-1.714-1.607-2.005-.168-.29-.018-.447.127-.591.13-.13.29-.338.436-.508.145-.17.193-.29.29-.483.097-.19.048-.362-.024-.508-.073-.145-.644-1.55-.88-2.119-.23-.556-.479-.482-.644-.49-.166-.008-.356-.01-.546-.01-.19 0-.501.071-.762.35-.262.279-1 1.002-1 2.443 0 1.441 1.049 2.834 1.195 3.027.145.19 2.062 3.149 4.996 4.413.698.301 1.243.481 1.668.616.702.223 1.34.191 1.845.116.562-.083 1.716-.701 1.958-1.378.243-.677.243-1.258.17-1.378-.073-.12-.262-.19-.553-.335z"/>
                </svg>
                ¿Tienes dudas? Escríbenos
              </a>
              {(isVideoFinished || isAdmin) && (
                <button
                  onClick={() => navigate('/login')}
                  className={`px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold transition-all duration-300 text-[10px] sm:text-xs shadow-md shadow-emerald-500/10 hover:scale-105 ${funnelKey === 'comunidadmp' ? 'comunidadmp-btn-wappy' : ''}`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Acceder a WAPPY
                </button>
              )}
            </>
          </div>
        </nav>

        {/* --- Admin leads / purchases metrics panel --- */}
        {isAdmin && isLeadsPanelOpen && (
          <div className="w-full max-w-5xl mx-auto px-6 mb-6 relative z-30">
            <div className="bg-surface-primary/95 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-medium">
                <div>
                  <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Dashboard de Contactos y Ventas de Comunidad
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">
                    Visualiza y descarga los leads recolectados en el embudo gratuito y los pagos acreditados en el embudo premium.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    disabled={dashboardTab === 'metrics' || getActiveList().length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Exportar Lista (CSV)
                  </button>
                  <button
                    onClick={() => setIsLeadsPanelOpen(false)}
                    className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary border border-border-medium transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => setDashboardTab('leads')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${dashboardTab === 'leads' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Registros Gratuitos (Leads: {leads.length})
                </button>
                <button
                  onClick={() => setDashboardTab('purchases')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${dashboardTab === 'purchases' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Ventas Aprobadas (Wompi: {purchases.filter(p => p.isPaid).length})
                </button>
                <button
                  onClick={() => setDashboardTab('pending')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${dashboardTab === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Intentos de Pago / Abandonados (Wompi: {purchases.filter(p => !p.isPaid).length})
                </button>
                <button
                  onClick={() => setDashboardTab('metrics')}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${dashboardTab === 'metrics' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/40 shadow-sm' : 'bg-surface-secondary border-border-medium text-text-secondary hover:bg-surface-hover'}`}
                >
                  Métricas de Embudo
                </button>
              </div>

              {dashboardTab !== 'metrics' && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={leadsSearch}
                    onChange={(e) => setLeadsSearch(e.target.value)}
                    placeholder="Buscar por nombre, correo o celular..."
                    className="w-full max-w-sm px-4 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all placeholder:text-text-secondary/40"
                  />
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border-medium bg-surface-secondary/20 max-h-[32rem] overflow-y-auto">
                {isLoadingLeads ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs text-text-secondary">Cargando métricas...</span>
                  </div>
                ) : dashboardTab === 'metrics' ? (
                  <div className="p-6 space-y-6">
                    {/* Top KPI row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-surface-primary border border-border-medium flex flex-col justify-center text-left">
                        <span className="text-[10px] uppercase font-bold text-text-secondary">Visitas Totales</span>
                        <span className="text-2xl font-extrabold text-emerald-500 mt-1 outfit">
                          {metricsStats?.totalVisits ?? 0}
                        </span>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-surface-primary border border-border-medium flex flex-col justify-center text-left">
                        <span className="text-[10px] uppercase font-bold text-text-secondary">Permanencia Promedio</span>
                        <span className="text-2xl font-extrabold text-emerald-500 mt-1 outfit">
                          {metricsStats ? (
                            <>
                              {Math.floor(metricsStats.avgDurationSeconds / 60)}m {metricsStats.avgDurationSeconds % 60}s
                            </>
                          ) : '0s'}
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-surface-primary border border-border-medium flex flex-col justify-center text-left">
                        <span className="text-[10px] uppercase font-bold text-text-secondary">Conversión (Formulario)</span>
                        <span className="text-2xl font-extrabold text-emerald-500 mt-1 outfit">
                          {metricsStats?.totalVisits ? (
                            <>
                              {((metricsStats.clicks?.checkoutSubmit / metricsStats.totalVisits) * 100).toFixed(1)}%
                            </>
                          ) : '0%'}
                        </span>
                      </div>
                    </div>

                    {/* Clics breakdown/funnel */}
                    <div className="p-5 rounded-xl bg-surface-primary border border-border-medium space-y-4 text-left">
                      <h4 className="font-bold text-xs text-text-primary uppercase tracking-wider outfit">Embudo de Interacción y Clics</h4>
                      <p className="text-[10px] text-text-secondary">Seguimiento de las acciones clave de los usuarios dentro de la página.</p>
                      
                      <div className="space-y-3 pt-2">
                        {/* Play Video */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Reproducciones de Video</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.playVideo ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.playVideo || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* Quick Access */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Clics en Compra Rápida (Banner Superior)</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.quickAccess ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.quickAccess || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* checkoutSubmit */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Formularios de Pago Enviados</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.checkoutSubmit ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.checkoutSubmit || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* downloadFile */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Descargas de Archivos</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.downloadFile ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.downloadFile || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* recoverAccess */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Intentos de Recuperación de Acceso</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.recoverAccess ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.recoverAccess || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>

                        {/* whatsapp */}
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span>Clics en Enlace Comunidad de WhatsApp</span>
                            <span className="font-mono text-emerald-500">{metricsStats?.clicks?.whatsapp ?? 0} clics</span>
                          </div>
                          <div className="w-full bg-surface-secondary rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${metricsStats?.totalVisits ? Math.min(100, ((metricsStats.clicks?.whatsapp || 0) / metricsStats.totalVisits) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : getActiveList().length === 0 ? (
                  <div className="text-center py-12 text-xs text-text-secondary">No hay registros cargados para esta sección.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-border-medium text-text-secondary font-semibold sticky top-0 z-10">
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3">Celular</th>
                        {(dashboardTab === 'purchases' || dashboardTab === 'pending') && (
                          <>
                            <th className="p-3">Monto (COP)</th>
                            <th className="p-3">Referencia</th>
                            <th className="p-3 text-center">Estado Pago</th>
                            <th className="p-3 text-center">Video Visto</th>
                            <th className="p-3 text-center">Meta Pixel</th>
                          </>
                        )}
                        <th className="p-3">Fecha de Registro</th>
                        <th className="p-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveList()
                        .filter(item => {
                          const query = leadsSearch.toLowerCase();
                          return (
                            item.fullName.toLowerCase().includes(query) ||
                            item.email.toLowerCase().includes(query) ||
                            item.phone.includes(query)
                          );
                        })
                        .map((item, idx) => (
                          <tr key={item._id || idx} className="border-b border-border-medium/40 hover:bg-surface-secondary/40 transition-colors">
                            <td className="p-3 font-semibold text-text-primary">{item.fullName}</td>
                            <td className="p-3 text-text-secondary font-mono">{item.email}</td>
                            <td className="p-3 text-text-secondary">{item.phone}</td>
                            {(dashboardTab === 'purchases' || dashboardTab === 'pending') && (
                              <>
                                <td className={`p-3 font-bold ${item.isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                                  ${((item.amountInCents || 0) / 100).toLocaleString('es-CO')}
                                </td>
                                <td className="p-3 text-text-secondary font-mono text-[10px]">{item.wompiReference}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500' :
                                    item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                                    'bg-red-500/10 text-red-500'
                                  }`}>
                                    {item.status || 'PENDING'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  {item.videoWatched ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">Completado</span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold">En curso</span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {item.isPaid ? (
                                    <button
                                      onClick={() => handleSendToPixelManual(item)}
                                      disabled={item.purchaseTracked || syncingEmail === item.email}
                                      className={`px-2 py-1 rounded-lg font-bold text-[10px] transition-all ${
                                        item.purchaseTracked
                                          ? 'bg-emerald-500/15 text-emerald-500/60 dark:text-emerald-400/60 cursor-default'
                                          : syncingEmail === item.email
                                          ? 'bg-amber-500/20 text-amber-500 cursor-wait'
                                          : 'bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 shadow-sm hover:scale-105'
                                      }`}
                                    >
                                      {syncingEmail === item.email
                                        ? 'Sincronizando...'
                                        : item.purchaseTracked
                                        ? 'Sincronizado'
                                        : 'Enviar a Pixel'}
                                    </button>
                                  ) : (
                                    <span className="text-text-secondary/40 font-mono">-</span>
                                  )}
                                </td>
                              </>
                            )}
                            <td className="p-3 text-text-secondary">{new Date(item.createdAt).toLocaleString()}</td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              {dashboardTab === 'pending' && (
                                <button
                                  onClick={() => handleApprovePurchaseManual(item.email, item.wompiReference)}
                                  className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400 transition-all shadow-sm hover:scale-105 shrink-0"
                                  title="Aprobar Compra Manualmente"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => dashboardTab === 'leads' ? handleDeleteLead(item._id) : handleDeletePurchase(item._id)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all shadow-sm hover:scale-105 shrink-0"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- Admin global configuration panel (Requires Payment, price, file uploads) --- */}
        {isAdmin && isAdminPanelOpen && (
          <div className="w-full max-w-4xl mx-auto px-6 mb-6 relative z-30">
            <div className="bg-surface-primary/95 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md shadow-xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-border-medium mb-4">
                <h3 className="text-base font-bold text-emerald-500 flex items-center gap-2">
                  <Settings className="w-4 h-4 animate-spin-slow" />
                  Ajustes Avanzados del Embudo de Comunidad
                </h3>
                <button
                  onClick={() => setIsAdminPanelOpen(false)}
                  className="p-1.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary border border-border-medium transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Ajustes Generales</h4>
                  
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Enlace del Video Curso</label>
                    <input
                      type="text"
                      value={tempVideoUrl}
                      onChange={(e) => setTempVideoUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      placeholder="URL .mp4 o enlace de YouTube"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-medium">
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">¿Requiere Pago para Acceder?</h5>
                      <p className="text-[10px] text-text-secondary mt-0.5">Si se activa, el video se bloquea completamente hasta pagar. Si no, se bloquea a los 2 minutos con un formulario de lead.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tempRequiresPayment} 
                        onChange={(e) => setTempRequiresPayment(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-border-medium peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {tempRequiresPayment && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Precio de Venta (COP)</label>
                      <input
                        type="number"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                        placeholder="Ej. 49000"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-medium">
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">
                        {tempRequiresPayment ? '¿Activar Vista Previa de Video (Pago)?' : '¿Activar Bloqueo de Leads en Video?'}
                      </h5>
                      <p className="text-[10px] text-text-secondary mt-0.5">
                        {tempRequiresPayment 
                          ? 'Si se activa, el usuario verá una parte del video antes de requerir el pago. Si se desactiva, se paywalleará inmediatamente al inicio.' 
                          : 'Si se activa, el video se pausará en el minuto indicado para solicitar los datos del usuario para poder continuar.'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tempGatingEnabled} 
                        onChange={(e) => setTempGatingEnabled(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-border-medium peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {tempGatingEnabled && (
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        {tempRequiresPayment ? 'Minuto del Video para Solicitar Pago' : 'Minuto del Video para Solicitar Datos'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={tempGatingSeconds / 60}
                        onChange={(e) => setTempGatingSeconds(Math.max(6, Math.round(Number(e.target.value) * 60)))}
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                        placeholder="Ej: 2 para el minuto 2:00, o 1.5 para el minuto 1:30"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary border border-border-medium">
                    <div>
                      <h5 className="text-xs font-bold text-text-primary">¿Mostrar Banner de Registro Rápido?</h5>
                      <p className="text-[10px] text-text-secondary mt-0.5">Muestra u oculta el banner superior de acceso rápido con el botón "Regístrate ya".</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={tempShowQuickAccessBanner} 
                        onChange={(e) => setTempShowQuickAccessBanner(e.target.checked)} 
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-border-medium peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">Enlace de WhatsApp de la Comunidad</label>
                    <input
                      type="text"
                      value={tempWhatsappUrl}
                      onChange={(e) => setTempWhatsappUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      placeholder="https://chat.whatsapp.com/..."
                    />
                  </div>

                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider pt-2">Clases Complementarias</h4>

                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const titleVal = num === 1 ? tempExtraVideoTitle1 :
                                       num === 2 ? tempExtraVideoTitle2 :
                                       num === 3 ? tempExtraVideoTitle3 :
                                       num === 4 ? tempExtraVideoTitle4 :
                                       num === 5 ? tempExtraVideoTitle5 :
                                       num === 6 ? tempExtraVideoTitle6 :
                                       num === 7 ? tempExtraVideoTitle7 :
                                       num === 8 ? tempExtraVideoTitle8 :
                                       num === 9 ? tempExtraVideoTitle9 :
                                       tempExtraVideoTitle10;
                      const setTitleFn = num === 1 ? setTempExtraVideoTitle1 :
                                         num === 2 ? setTempExtraVideoTitle2 :
                                         num === 3 ? setTempExtraVideoTitle3 :
                                         num === 4 ? setTempExtraVideoTitle4 :
                                         num === 5 ? setTempExtraVideoTitle5 :
                                         num === 6 ? setTempExtraVideoTitle6 :
                                         num === 7 ? setTempExtraVideoTitle7 :
                                         num === 8 ? setTempExtraVideoTitle8 :
                                         num === 9 ? setTempExtraVideoTitle9 :
                                         setTempExtraVideoTitle10;
                      const urlVal = num === 1 ? tempExtraVideoUrl1 :
                                     num === 2 ? tempExtraVideoUrl2 :
                                     num === 3 ? tempExtraVideoUrl3 :
                                     num === 4 ? tempExtraVideoUrl4 :
                                     num === 5 ? tempExtraVideoUrl5 :
                                     num === 6 ? tempExtraVideoUrl6 :
                                     num === 7 ? tempExtraVideoUrl7 :
                                     num === 8 ? tempExtraVideoUrl8 :
                                     num === 9 ? tempExtraVideoUrl9 :
                                     tempExtraVideoUrl10;
                      const setUrlFn = num === 1 ? setTempExtraVideoUrl1 :
                                       num === 2 ? setTempExtraVideoUrl2 :
                                       num === 3 ? setTempExtraVideoUrl3 :
                                       num === 4 ? setTempExtraVideoUrl4 :
                                       num === 5 ? setTempExtraVideoUrl5 :
                                       num === 6 ? setTempExtraVideoUrl6 :
                                       num === 7 ? setTempExtraVideoUrl7 :
                                       num === 8 ? setTempExtraVideoUrl8 :
                                       num === 9 ? setTempExtraVideoUrl9 :
                                       setTempExtraVideoUrl10;
                      return (
                        <div key={num} className="p-3 rounded-xl bg-surface-secondary/40 border border-border-medium space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-0.5">Título Clase Extra {num}</label>
                            <input
                              type="text"
                              value={titleVal}
                              onChange={(e) => setTitleFn(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border-medium text-[11px] text-text-primary focus:outline-none focus:border-emerald-500"
                              placeholder={`Título para el video extra ${num}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-text-secondary uppercase mb-0.5">Enlace Video Extra {num}</label>
                            <input
                              type="text"
                              value={urlVal}
                              onChange={(e) => setUrlFn(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border-medium text-[11px] text-text-primary focus:outline-none focus:border-emerald-500 font-mono"
                              placeholder="URL de video o link de YouTube"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleSaveAdminConfig}
                    disabled={isSavingConfig}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Todas las Configuraciones
                  </button>
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-border-medium md:pl-6 pt-4 md:pt-0 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Recursos y Archivos de Descarga</h4>
                    
                    <div className="p-3 rounded-xl bg-surface-secondary/40 border border-border-medium mb-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Nombre en Pantalla</label>
                          <input
                            type="text"
                            value={uploadFileName}
                            onChange={(e) => setUploadFileName(e.target.value)}
                            placeholder="Ej. Matriz de Peligros Editable"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border-medium text-[11px] text-text-primary focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-secondary mb-0.5">Seleccionar Archivo (PDF, Excel, ZIP...)</label>
                          <input
                            type="file"
                            id="comunidad-file-input"
                            onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                            className="w-full text-[10px] text-text-secondary file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border file:border-emerald-500/20 file:text-[10px] file:font-semibold file:bg-emerald-500/10 file:text-emerald-500 file:cursor-pointer hover:file:bg-emerald-500/20"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleUploadFile}
                        disabled={isFileUploading}
                        className="w-full py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        {isFileUploading ? <Loader2 className="w-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Subir y Agregar Material
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {tempFiles.length === 0 ? (
                        <div className="text-[10px] text-text-secondary/50 text-center py-4">No se han subido materiales aún.</div>
                      ) : (
                        tempFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary border border-border-medium/60 text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="font-medium text-text-primary truncate" title={file.name}>{file.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveFile(idx)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500/80 hover:text-red-500 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* QR Code Section */}
                    <div className="border-t border-border-medium/60 pt-4 mt-4 space-y-3">
                      <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Código QR de la Página</h4>
                      <p className="text-[10px] text-text-secondary">Comparte este código QR o enlace con tus usuarios para que accedan directamente a esta página de comunidad.</p>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-surface-secondary/40 border border-border-medium">
                        <div className="bg-white p-2 rounded-lg border border-border-medium shrink-0">
                          <QRCodeSVG
                            id="comunidad-qr-svg"
                            value={window.location.origin + window.location.pathname}
                            size={100}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            level={"M"}
                            includeMargin={false}
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              readOnly
                              value={window.location.origin + window.location.pathname}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border-medium text-[10px] text-text-primary focus:outline-none font-mono"
                            />
                            <button
                              onClick={handleCopyLink}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold transition-all whitespace-nowrap"
                            >
                              {copyFeedback ? 'Copiado' : 'Copiar'}
                            </button>
                          </div>
                          <button
                            onClick={handleDownloadQR}
                            className="w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 transition-all shadow-sm"
                          >
                            <Download className="w-3 h-3" /> Descargar Código QR (PNG)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Landing/Checkout Section */}
        {configLoading ? (
          <div className="w-full max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <h3 className="font-bold text-text-primary text-base">Cargando embudo interactivo...</h3>
          </div>
        ) : (funnelKey !== 'wappyvital' && actualRequiresPayment && !isAccessGranted && !isAdmin && !gatingEnabled) ? (
          <main className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col items-center justify-center relative z-10 text-center">
            
            {funnelKey === 'comunidadmp' ? (
              <span className="comunidadmp-kicker mb-6 block">ADELÁNTATE A LA IA · MAURICIO POSADA</span>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide mb-6 shadow-sm shadow-emerald-500/5 animate-pulse">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {funnelKey === 'wappyvital' ? 'PLAN WAPPY VITAL - ACCESO DE POR VIDA' : 'CURSO MASTERCLASS GESTIÓN SST IA'}
              </div>
            )}

            <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tighter text-text-primary mb-6 leading-[1.1] max-w-3xl outfit ${funnelKey === 'comunidadmp' ? 'comunidadmp-title font-space-grotesk' : ''}`}>
              {funnelKey === 'wappyvital' ? (
                <>
                  Consigue <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">WAPPY VITAL</span> de Por Vida
                </>
              ) : (
                <>
                  Optimiza tu Gestión de SST con <span className={funnelKey === 'comunidadmp' ? 'bg-gradient-to-r from-[#14D4D4] via-[#34D399] to-[#06B6D4] bg-clip-text text-transparent' : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent'}>Inteligencia Artificial</span>
                </>
              )}
            </h1>

            <p className="text-sm sm:text-base text-text-secondary max-w-2xl mb-10 leading-relaxed font-normal">
              {funnelKey === 'wappyvital' 
                ? 'Paga una tarifa única y obtén acceso ilimitado de por vida a Wappy IA, los 15+ agentes especialistas de SST y editores avanzados de matrices.'
                : 'Paga una tarifa única para acceder a la videocapacitación completa y descargar todas las plantillas y aplicativos editables de valor inmediato.'}
            </p>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 text-left mt-4 items-start relative z-10">
              
              <div className={funnelKey === 'comunidadmp' ? 'comunidadmp-card space-y-6' : 'space-y-6 bg-transparent border-t border-border-medium/80 pt-6'}>
                <h3 className="text-xl font-bold tracking-tight text-text-primary outfit">
                  {funnelKey === 'wappyvital' ? '¿Qué incluye el Plan Wappy Vital?' : '¿Qué incluye tu compra?'}
                </h3>
                
                 <div className="space-y-1">
                  {funnelKey === 'wappyvital' ? (
                    <>
                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Membresía de Por Vida a Wappy Vital (IA + Matrices)</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Paga una vez y usa Wappy IA para siempre (sin suscripción mensual) para redactar y automatizar tu gestión SST.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Más de 15 Agentes Especialistas de SST</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Consultas ilimitadas a agentes entrenados en GTC-45, Riesgo Psicosocial, Consultor Médico y Consultor Jurídico.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Skill Canvas, RIT e IPEVAR</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Editores inteligentes para crear matrices y el Reglamento Interno de Trabajo en minutos y exportar a Word/Excel.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Mentoría y Capacitación Exclusiva</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Acceso a la mentoría completa en video y clases extra grabadas para dominar el uso de IA en tu gestión.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Videocapacitación Práctica Completa</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Domina la matriz de riesgos, aplicativos automatizados y el diagnóstico global del SVE utilizando Inteligencia Artificial.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Material y Plantillas Editables</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Descarga de forma ilimitada la Matriz de Peligros, el Plan de Capacitaciones y el manual completo al terminar de ver el video.</p>
                        </div>
                      </div>

                      <div className="flex gap-4 py-4 border-b border-border-medium/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-0.5 border border-emerald-500/25">
                          <Check className="w-3 h-3" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-text-primary tracking-wide">Acceso de por Vida y Sin Límite</h4>
                          <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">Vuelve a ingresar las veces que quieras con tu correo electrónico para revisar el material y descargar actualizaciones sin volver a pagar.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4 border-t border-border-medium flex flex-col justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
                    {funnelKey === 'wappyvital' ? 'Precio de lanzamiento por tiempo limitado' : 'Costo único del Curso'}
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-500 mt-1 outfit">
                    {couponCode.toUpperCase().trim() === 'VITAL30' && funnelKey === 'wappyvital' ? (
                      <>
                        <span className="text-sm line-through text-text-secondary mr-2">${basePrice.toLocaleString('es-CO')}</span>
                        <span>${Math.round(basePrice * 0.7).toLocaleString('es-CO')}</span>
                      </>
                    ) : (
                      <span>${basePrice.toLocaleString('es-CO')}</span>
                    )}{' '}
                    <span className="text-xs font-semibold text-text-secondary font-sans">COP</span>
                  </span>
                  {couponCode.toUpperCase().trim() === 'VITAL30' && funnelKey === 'wappyvital' && (
                    <span className="text-[10px] text-emerald-500 font-bold mt-1">¡Descuento del 30% aplicado con éxito!</span>
                  )}
                </div>
              </div>

              <div className={funnelKey === 'comunidadmp' ? 'comunidadmp-card relative' : 'bg-surface-primary/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl relative transition-all duration-300 hover:border-emerald-500/50'}>
                
                {!showRecoveryView ? (
                  <form onSubmit={handleWompiCheckout} className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-medium/60">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Completa tu Registro y Pago</h3>
                    </div>

                    {checkoutError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{checkoutError}</span>
                      </div>
                    )}

                     <div>
                      <label className="block text-[10px] font-bold text-text-secondary/80 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                      <input
                        type="text"
                        value={checkoutFullName}
                        onChange={(e) => setCheckoutFullName(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary/70 border border-border-medium/80 text-text-primary text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-text-secondary/40 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary/80 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                      <input
                        type="email"
                        value={checkoutEmail}
                        onChange={(e) => setCheckoutEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary/70 border border-border-medium/80 text-text-primary text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-text-secondary/40 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary/80 uppercase tracking-wider mb-1.5">Número de Celular</label>
                      <input
                        type="tel"
                        value={checkoutPhone}
                        onChange={(e) => setCheckoutPhone(e.target.value)}
                        placeholder="Ej. 3001234567"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary/70 border border-border-medium/80 text-text-primary text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-text-secondary/40 font-medium"
                      />
                    </div>

                    {funnelKey === 'wappyvital' && (
                      <div>
                        <label className="block text-[10px] font-bold text-text-secondary/80 uppercase tracking-wider mb-1.5">Cupón de Descuento</label>
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Ej. PROMO30"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary/70 border border-border-medium/80 text-text-primary text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-text-secondary/40 font-mono uppercase"
                        />
                      </div>
                    )}

                    <label className="flex items-start gap-2.5 cursor-pointer group pt-1">
                      <input
                        type="checkbox"
                        checked={acceptedPolicies}
                        onChange={(e) => setAcceptedPolicies(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border-medium bg-surface-secondary text-emerald-500 focus:ring-emerald-500/20"
                      />
                      <span className="text-[10px] text-text-secondary leading-normal group-hover:text-text-primary transition-colors">
                        Acepto la{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline hover:text-emerald-400 transition-colors">política de privacidad</a>{' '}
                        y el tratamiento de datos de WAPPY.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isCheckoutSubmitting}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white dark:text-slate-950 font-extrabold transition-all duration-300 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isCheckoutSubmitting ? (
                        <>
                          <Loader2 className="w-4.5 h-4.5 animate-spin" />
                          <span>Inicializando Wompi...</span>
                        </>
                      ) : (
                        <>
                          <span>Pagar y Acceder al Curso</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="pt-3 text-center border-t border-border-medium/60 mt-1">
                      <button
                        type="button"
                        onClick={() => setShowRecoveryView(true)}
                        className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline hover:text-emerald-500 flex items-center justify-center gap-1.5 mx-auto transition-colors"
                      >
                        <Key className="w-3.5 h-3.5" />
                        ¿Ya compraste? Recupera tu acceso
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRecoverAccess} className="space-y-4 py-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border-medium/60">
                      <Key className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">Recuperar Acceso Autorizado</h3>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-normal">
                      Ingresa el correo electrónico que utilizaste al realizar el pago del curso. Si tu compra fue aprobada, recuperarás el acceso al video y materiales al instante.
                    </p>

                    {recoveryError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{recoveryError}</span>
                      </div>
                    )}

                    {recoverySuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>{recoverySuccess}</span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-text-secondary/80 uppercase tracking-wider mb-1.5">Correo Electrónico registrado</label>
                      <input
                        type="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="juan@correo.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-secondary/70 border border-border-medium/80 text-text-primary text-xs focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 placeholder:text-text-secondary/40 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRecovering}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold transition-all duration-300 shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isRecovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Verificar Acceso de Compra
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRecoveryView(false);
                        setRecoveryError('');
                      }}
                      className="w-full py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary text-xs font-semibold border border-border-medium transition-all"
                    >
                      Volver al Formulario de Compra
                    </button>
                  </form>
                )}

              </div>

            </div>

          </main>
        ) : (
          <main className="w-full max-w-4xl mx-auto px-6 py-4 flex flex-col items-center text-center relative z-10">
            
            {funnelKey === 'comunidadmp' ? (
              <span className="comunidadmp-kicker mb-6 block">CAPACITACIÓN EXCLUSIVA · MAURICIO POSADA</span>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                CAPACITACIÓN EXCLUSIVA WAPPY
              </div>
            )}

            <h1 className={`text-4xl sm:text-6xl font-extrabold tracking-tighter text-text-primary mb-8 leading-[1.1] max-w-3xl outfit ${funnelKey === 'comunidadmp' ? 'comunidadmp-title font-space-grotesk' : ''}`}>
              {funnelKey === 'wappyvital' ? (
                <>
                  <span className={funnelKey === 'comunidadmp' ? 'bg-gradient-to-r from-[#14D4D4] via-[#34D399] to-[#06B6D4] bg-clip-text text-transparent' : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent'}>WAPPY: IA para SST que Multiplica tu Rentabilidad 🚀</span>
                </>
              ) : (
                <>
                  Descarga <span className={funnelKey === 'comunidadmp' ? 'bg-gradient-to-r from-[#14D4D4] via-[#34D399] to-[#06B6D4] bg-clip-text text-transparent' : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent'}>10 aplicativos SST listos para usar</span> y ahorra horas de trabajo
                </>
              )}
            </h1>

            {/* Quick Access / Skip Video Banner */}
            {!isUnlocked && (funnelKey === 'wappyvital' ? (showQuickAccessBanner || isVideoFinished) : showQuickAccessBanner) && (
              <div className="w-full max-w-3xl mb-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/[0.06] to-teal-500/[0.02] border border-emerald-500/30 backdrop-blur-md text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-500/[0.02] hover:border-emerald-500/50 transition-all duration-300 animate-premium-float relative z-10">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed">
                    {funnelKey === 'wappyvital' ? (
                      isVideoFinished ? (
                        <>
                          ⚡ ¡FELICITACIONES POR TERMINAR LA CAPACITACIÓN! Estás a un solo paso de asegurar tu acceso de por vida y multiplicar tus resultados. Completa tu registro de datos ahora para continuar.
                        </>
                      ) : (
                        <>
                          ⚡ ¡PRECIO DE LANZAMIENTO POR TIEMPO LIMITADO! Asegura tu acceso de por vida y multiplica tu rentabilidad en SST. Mira la capacitación ahora y completa tu registro para continuar. 🎁 ¡AL FINALIZAR RECIBIRÁS TU 30% DE DESCUENTO!
                        </>
                      )
                    ) : actualRequiresPayment ? (
                      <>
                        Obtendrás el <strong>curso completo, más de 10 aplicativos, 2 clases extras (Matriz IPEVAR y Reglamento RIT) y acceso a WAPPY IA</strong> por solo <strong>${price.toLocaleString('es-CO')} COP</strong> (¡Precio de lanzamiento!).
                      </>
                    ) : (
                      <>
                        ⚡ <strong>¿Quieres ahorrar tiempo?</strong> Si no deseas ver la Mentoría completa, puedes saltarte el video y descargar los <strong>más de 10 aplicativos listos</strong> de forma inmediata completando tu registro.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (funnelKey === 'wappyvital') {
                      setSelectedCheckoutPlan('vital');
                      setShowLeadModal(true);
                    } else {
                      handleQuickAccessClick();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs transition-all duration-300 shadow-md shadow-emerald-500/25 hover:scale-105 whitespace-nowrap"
                >
                  {funnelKey === 'wappyvital' ? 'Regístrate ya' : 'Registrar and Descargar Ya'}
                </button>
              </div>
            )}
            <div 
              ref={playerContainerRef}
              className="w-full relative rounded-3xl overflow-hidden border-4 border-slate-900 dark:border-slate-800 bg-slate-950 shadow-2xl aspect-video mb-12 group transition-all duration-500 ring-1 ring-border-medium/60 z-10"
              onContextMenu={(e) => e.preventDefault()}
            >
              {isYouTube ? (
                <iframe
                  id="wappy-yt-player"
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&controls=0&disablekb=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3&showinfo=0`}
                  className="w-full h-full object-cover pointer-events-none select-none border-0"
                  allow="autoplay; encrypted-media"
                  title="YouTube Video Player"
                />
              ) : isYouTubeChannelError ? (
                <div className="w-full h-full bg-surface-secondary flex flex-col items-center justify-center p-6 text-center select-none">
                  <ShieldAlert className="w-12 h-12 text-amber-500 mb-2 animate-bounce" />
                  <h4 className="font-bold text-text-primary text-base">Enlace de YouTube no soportado</h4>
                  <p className="text-xs text-text-secondary mt-1 max-w-sm leading-normal">
                    Ingresa un link directo de video (ej: https://www.youtube.com/watch?v=VIDEO_ID) para que funcione.
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  playsInline
                  controls={false}
                />
              )}

              <div 
                onClick={togglePlay}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="absolute inset-0 z-20 cursor-pointer select-none"
              />

              {!isPlaying && !showLeadModal && !isYouTubeChannelError && (
                <div 
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-slate-950/40 hover:bg-slate-950/30 transition-all duration-300 cursor-pointer z-25"
                >
                  <div className="w-20 h-20 flex items-center justify-center rounded-full bg-emerald-500 text-white dark:text-slate-950 shadow-lg shadow-emerald-500/35 transform hover:scale-110 transition-transform duration-300">
                    <Play className="w-9 h-9 fill-current ml-1" />
                  </div>
                </div>
              )}

              <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-950/90 to-transparent flex flex-col justify-end z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-full h-1 bg-white/20 relative">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-200 ease-out shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                    style={{ width: `${getProgressBarWidth()}%` }}
                  />
                </div>

                <div className="flex items-center justify-between px-6 py-3">
                  <button 
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={toggleFullscreen}
                      className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>

                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 select-none">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Reproducción Protegida WAPPY</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {funnelKey === 'wappyvital' && !isUnlocked && (
              <div className="w-full max-w-3xl mx-auto mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
                <span>🎁 ¡Ve la capacitación completa! Al finalizar el video obtendrás un regalo extra sorpresa.</span>
              </div>
            )}

            {funnelKey !== 'wappyvital' && (
              <div className="w-full max-w-4xl mt-6 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-bold text-text-primary outfit">Material Complementario y Plantillas Descargables</h3>
                </div>

              {downloadableFiles.length === 0 ? (
                <div className="p-8 rounded-2xl border border-border-medium bg-surface-primary/40 text-center text-xs text-text-secondary">
                  El administrador no ha subido materiales complementarios para esta clase aún.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {downloadableFiles.map((file, idx) => {
                    const canDownload = isUnlocked || isVideoFinished;
                    return (
                      <div 
                        key={idx} 
                        className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group/card ${
                          canDownload 
                            ? 'bg-surface-primary/80 border-emerald-500/20 hover:border-emerald-500/40 shadow-md hover:shadow-lg hover:shadow-emerald-500/[0.02] hover:-translate-y-0.5' 
                            : 'bg-surface-primary/40 border-border-medium/50 opacity-60 select-none'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-xl border shrink-0 ${
                            canDownload 
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-sm shadow-emerald-500/5' 
                              : 'bg-surface-secondary border-border-medium text-text-secondary/50'
                          }`}>
                            {canDownload ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-text-primary truncate" title={file.name}>{file.name}</h4>
                            <p className="text-[10px] text-text-secondary mt-0.5">Aplicativo 100% editable</p>
                          </div>
                        </div>

                        {canDownload ? (
                          <a
                            href={file.url}
                            download
                            onClick={() => trackClick('downloadFile')}
                            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white dark:text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Descargar Archivo
                          </a>
                        ) : (
                          <button
                            onClick={handleQuickAccessClick}
                            className="w-full py-2.5 rounded-xl bg-surface-secondary border border-border-medium text-emerald-500 dark:text-emerald-400 hover:bg-surface-hover text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                          >
                            <Lock className="w-3.5 h-3.5 text-text-secondary" />
                            Adquiere ya
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {/* Clases y Capacitaciones Complementarias */}
            <div className="w-full max-w-4xl mt-12 text-left">
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-text-primary outfit">
                  {funnelKey === 'wappyvital' 
                    ? 'Clases para sacar el mejor provecho a la plataforma y rentabilidad' 
                    : 'Clases y Capacitaciones Complementarias'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { num: 1, url: extraVideoUrl1, title: extraVideoTitle1, youtubeId: youtubeId1, isYouTube: isYouTube1 },
                  { num: 2, url: extraVideoUrl2, title: extraVideoTitle2, youtubeId: youtubeId2, isYouTube: isYouTube2 },
                  { num: 3, url: extraVideoUrl3, title: extraVideoTitle3, youtubeId: youtubeId3, isYouTube: isYouTube3 },
                  { num: 4, url: extraVideoUrl4, title: extraVideoTitle4, youtubeId: youtubeId4, isYouTube: isYouTube4 },
                  { num: 5, url: extraVideoUrl5, title: extraVideoTitle5, youtubeId: youtubeId5, isYouTube: isYouTube5 },
                  { num: 6, url: extraVideoUrl6, title: extraVideoTitle6, youtubeId: youtubeId6, isYouTube: isYouTube6 },
                  { num: 7, url: extraVideoUrl7, title: extraVideoTitle7, youtubeId: youtubeId7, isYouTube: isYouTube7 },
                  { num: 8, url: extraVideoUrl8, title: extraVideoTitle8, youtubeId: youtubeId8, isYouTube: isYouTube8 },
                  { num: 9, url: extraVideoUrl9, title: extraVideoTitle9, youtubeId: youtubeId9, isYouTube: isYouTube9 },
                  { num: 10, url: extraVideoUrl10, title: extraVideoTitle10, youtubeId: youtubeId10, isYouTube: isYouTube10 },
                ].filter((item) => !!item.url)
                 .map((item, index) => {
                  const isItemUnlocked = isUnlocked || index === 0;
                  return (
                    <div key={item.num} className="bg-surface-primary/80 border border-border-medium/60 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl hover:border-emerald-500/25 transition-all duration-300 flex flex-col justify-between group/tutorial">
                      <div className="p-4 border-b border-border-medium/60 bg-surface-secondary/40">
                        <h4 className="font-bold text-xs text-text-primary outfit truncate group-hover/tutorial:text-emerald-500 transition-colors" title={item.title || `Clase Extra ${item.num}`}>
                          {item.title || `Clase Extra ${item.num}`}
                        </h4>
                      </div>
                      <div className="aspect-video relative bg-slate-950 flex items-center justify-center">
                        {item.isYouTube ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${item.youtubeId}`}
                            className={`w-full h-full border-0 ${!isItemUnlocked ? 'pointer-events-none select-none' : ''}`}
                            allowFullScreen={isItemUnlocked}
                            title={item.title}
                          />
                        ) : (
                          <video
                            src={item.url}
                            controls={isItemUnlocked}
                            className={`w-full h-full object-contain ${!isItemUnlocked ? 'pointer-events-none select-none' : ''}`}
                          />
                        )}

                        {!isItemUnlocked && (
                          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 text-center z-10">
                            <Lock className="w-8 h-8 text-emerald-500 mb-2 animate-pulse" />
                            <p className="text-[11px] text-text-secondary max-w-[240px] leading-relaxed mb-3">
                              Disponible solo para usuarios Premium. Adquiere la membresía para acceder a esta clase.
                            </p>
                            <button
                              onClick={handleQuickAccessClick}
                              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-[10px] transition-all shadow-md shadow-emerald-500/25 hover:scale-105"
                            >
                              Adquiere ya
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {funnelKey === 'wappyvital' && !isAccessGranted && isVideoFinished && (
              <div className="w-full max-w-5xl mx-auto mt-12 px-4 text-center">
                <div className="mx-auto my-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl max-w-3xl flex items-center justify-center gap-3 text-red-600 dark:text-red-400">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <p className="text-xs sm:text-sm font-bold tracking-tight">
                    🔴 ¡OFERTA EXCLUSIVA DE LANZAMIENTO! Solo quedan {Math.max(3, 17 - approvedPurchasesCount)} membresías disponibles a este precio especial.
                  </p>
                </div>

                <div className="grid grid-cols-1 max-w-md mx-auto gap-8 text-left">
                  {/* CARD 1: Wappy Vital */}
                  {(() => {
                    const fixedInterval = 'lifetime';
                    let rawPrice = 350000;
                    let displayPrice = '$350.000';

                    if (vitalPlanConfig) {
                      rawPrice = vitalPlanConfig.rawPrice;
                      displayPrice = vitalPlanConfig.displayPrice;
                    } else if (price > 0) {
                      rawPrice = price;
                      displayPrice = '$' + price.toLocaleString('es-CO');
                    }

                    const hasPromoInDB = vitalPlanConfig?.promotion && vitalPlanConfig.promotion.discountPercentage > 0;
                    const isDiscountActive = couponCode.toUpperCase().trim() === 'VITAL30' || hasPromoInDB;
                    const discountPercentage = hasPromoInDB ? vitalPlanConfig.promotion.discountPercentage : 30;
                    const totalToBill = isDiscountActive 
                      ? (hasPromoInDB ? vitalPlanConfig.finalPrice : Math.round(rawPrice * 0.7)) 
                      : rawPrice;

                    return (
                      <div
                        className={`group relative flex flex-col rounded-3xl border bg-gradient-to-b p-5 sm:p-8 transition-all duration-500 hover:-translate-y-2 from-emerald-500/5 to-teal-500/10 border-emerald-500/20 hover:border-emerald-500/30 hover:shadow-2xl bg-surface-primary/60 backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.05)]`}
                      >
                        <div className="absolute -top-3 left-6 sm:left-8 whitespace-nowrap rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-1 text-xs font-bold text-white shadow-lg">
                          ✨ Pago único de por vida
                        </div>

                        {isDiscountActive ? (
                          <div className="absolute right-6 top-6 z-10 whitespace-nowrap rounded-full border border-emerald-500/30 bg-[#ccff00] px-3.5 py-1.5 text-xs font-black text-black shadow-sm">
                            -{discountPercentage}%
                          </div>
                        ) : (
                          <div className="absolute right-6 top-6 z-10 whitespace-nowrap rounded-full border border-dashed border-emerald-500/30 bg-emerald-950/40 backdrop-blur-[2px] px-3.5 py-1.5 text-xs font-bold text-emerald-400 shadow-sm flex items-center gap-1 animate-pulse">
                            <Lock className="w-3 h-3 text-emerald-400" />
                            <span>Descubre -30%</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mb-6 mt-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                            <IpevarSVG className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-extrabold text-text-primary">Wappy Vital</h2>
                            <p className="text-xs text-text-secondary">¡Pagas una vez, lo usas para siempre!</p>
                          </div>
                        </div>

                        <div className="mb-6 flex flex-col items-start gap-1">
                          {isDiscountActive && (
                            <span className="text-sm font-semibold text-text-tertiary line-through decoration-red-500 decoration-2">
                              {displayPrice}
                            </span>
                          )}

                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tight text-emerald-500">
                              ${Math.round(totalToBill).toLocaleString('es-CO')}
                            </span>
                            <span className="text-sm font-bold text-text-secondary">
                              Pago Único
                            </span>
                          </div>
                          {isDiscountActive ? (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                              ¡Pagas una vez, lo usas para siempre!
                            </p>
                          ) : (
                            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                <Gift className="w-4 h-4 animate-bounce" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Descuento Especial</p>
                                <p className="text-[11px] text-text-secondary leading-normal mt-0.5">
                                  Mira el video completo para desbloquear tu <strong className="text-emerald-500">30% de descuento</strong> ($245.000 COP).
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 mb-6">
                          <button
                            onClick={() => {
                              setSelectedCheckoutPlan('vital');
                              setShowLeadModal(true);
                            }}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 transition-all hover:opacity-90 hover:shadow-xl hover:scale-[1.02] duration-300"
                          >
                            Adquirir Wappy Vital
                          </button>
                        </div>

                        <div className="border-t border-border-medium/60 my-2"></div>

                        <ul className="mt-4 flex-1 space-y-3">
                          {[
                            '**Pago Único (Acceso de Por Vida)**',
                            '**Hasta 20 chats abiertos**',
                            '**Más de 15 Agentes Especialistas en SST (Consultor SG-SST, Especialista GTC-45, Especialista en Riesgo Psicosocial, Consultor Médico Ocupacional, Consultor Jurídico Laboral, Auditor Integral SG-SST)**',
                            '**Subida de archivos ilimitada**',
                            '**Skill de Canvas (Word, Hojas de Cálculo, Presentaciones, Código Creador de Aplicativos)**',
                            '**Skill Editor RIT**',
                            '**Skill IPEVAR**',
                            '**Skill Videollamada con Agente Biomecánico Laboral y visión con exoesqueleto luminoso para medir los grados e higiene postural**',
                            '**Descargas y exportaciones ilimitadas**',
                            '**Aula de estudio**',
                            '**Blog WAPPY**',
                          ].map((f) => {
                            const isWholeLineHighlighted = f.startsWith('**') && f.endsWith('**');
                            const cleanText = f.startsWith('**') && f.endsWith('**') ? f.slice(2, -2) : f;
                            return (
                              <li
                                key={f}
                                className={`flex items-start gap-3 text-xs md:text-sm ${isWholeLineHighlighted ? 'font-bold text-text-primary' : 'text-text-secondary'}`}
                              >
                                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                                {renderFeatureText(cleanText)}
                              </li>
                            );
                          })}
                          {[
                            'Somos SST',
                            'Crear Agentes de IA propios',
                            'Análisis en Vivo'
                          ].map((f) => (
                            <li
                              key={f}
                              className="flex items-start gap-3 text-xs md:text-sm text-text-tertiary line-through opacity-40"
                            >
                              <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-center font-bold text-red-500">✕</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {isAccessGranted && (
              <div className="w-full max-w-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/10 border-2 border-emerald-500/80 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] transition-all duration-300 mt-10 text-center flex flex-col items-center justify-center gap-3 animate-premium-float">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                    {funnelKey === 'wappyvital' 
                      ? '¡Ya tienes activa tu Membresía WAPPY de Por Vida!' 
                      : '¡Ya tienes acceso completo a todos los aplicativos y herramientas! Disfruta del curso.'}
                  </h3>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {funnelKey === 'wappyvital' ? (
                      userPhone ? (
                        <>
                          Tu cuenta ha sido creada automáticamente. Usa tus credenciales para iniciar sesión:
                          <br />
                          <span className="text-text-primary">Usuario:</span> {userEmail}
                          <br />
                          <span className="text-text-primary">Contraseña:</span> {userPhone}
                        </>
                      ) : (
                        'Tu cuenta ha sido autorizada de por vida. Utiliza tu correo registrado para iniciar sesión en la plataforma y acceder a los más de 15 agentes de IA.'
                      )
                    ) : (
                      'Aprovecha esta capacitación e integra la IA con la Seguridad y Salud en el Trabajo.'
                    )}
                  </p>
                  {funnelKey === 'wappyvital' && (
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => navigate('/login')}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105"
                      >
                        Iniciar Sesión en WAPPY IA
                      </button>
                      <button
                        onClick={() => navigate('/register')}
                        className="px-4 py-2 bg-surface-secondary hover:bg-surface-hover text-text-primary border border-border-medium rounded-xl font-bold text-xs transition-all hover:scale-105"
                      >
                        Registrar Nueva Cuenta
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </main>
        )}
      </div>

      {showLeadModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-lg p-4 sm:p-6 z-50 overflow-y-auto">
          <div className="w-full max-w-md bg-surface-primary border border-border-medium rounded-2xl p-6 sm:p-8 text-left shadow-2xl relative my-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => { setShowLeadModal(false); setSelectedCheckoutPlan(null); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors z-10"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                {showRecoveryView ? <Key className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-emerald-500" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary leading-tight outfit">
                  {showRecoveryView 
                    ? 'Recuperar Acceso Autorizado' 
                    : ((actualRequiresPayment && (funnelKey !== 'wappyvital' || selectedCheckoutPlan !== null)) 
                        ? 'Acceder a la Capacitación Completa' 
                        : (funnelKey === 'wappyvital' ? 'Continúa viendo la Capacitación' : 'Acceso Exclusivo WAPPY')
                      )
                  }
                </h3>
                <p className="text-[10px] text-text-secondary">
                  {showRecoveryView 
                    ? 'Valida tu correo de compra para acceder al instante'
                    : ((actualRequiresPayment && (funnelKey !== 'wappyvital' || selectedCheckoutPlan !== null)) 
                        ? (couponCode.toUpperCase().trim() === 'VITAL30' && funnelKey === 'wappyvital'
                            ? `Paga una tarifa única de $${Math.round(basePrice * 0.7).toLocaleString('es-CO')} COP (¡30% Descuento Aplicado!)`
                            : `Paga una tarifa única de $${basePrice.toLocaleString('es-CO')} COP para continuar viendo`
                          )
                        : (funnelKey === 'wappyvital'
                            ? 'Registra tus datos para desbloquear el video y continuar aprendiendo'
                            : 'Registra tus datos para acceder al video curso'
                          )
                      )
                  }
                </p>
              </div>
            </div>

            {!showRecoveryView ? (
              <form onSubmit={(actualRequiresPayment && (funnelKey !== 'wappyvital' || selectedCheckoutPlan !== null)) ? handleWompiCheckout : handleLeadFormSubmit} className="space-y-3.5">
                {checkoutError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={checkoutFullName}
                    onChange={(e) => setCheckoutFullName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Correo</label>
                    <input
                      type="email"
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="juan@correo.com"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Celular</label>
                    <input
                      type="tel"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="Ej. 3001234567"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {funnelKey === 'wappyvital' && selectedCheckoutPlan !== null && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Contraseña</label>
                    <div className="relative">
                      <input
                        type={showCheckoutPassword ? 'text' : 'password'}
                        value={checkoutPassword}
                        onChange={(e) => setCheckoutPassword(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCheckoutPassword(!showCheckoutPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary focus:outline-none"
                      >
                        {showCheckoutPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {funnelKey === 'wappyvital' && selectedCheckoutPlan !== null && (
                  <div>
                    <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Cupón de Descuento</label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Ej. PROMO30"
                      className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-mono uppercase"
                    />
                  </div>
                )}

                <label className="flex items-start gap-2 cursor-pointer group mt-2.5">
                  <input
                    type="checkbox"
                    checked={acceptedPolicies}
                    onChange={(e) => setAcceptedPolicies(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border-medium bg-surface-secondary text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <span className="text-[10px] text-text-secondary leading-normal group-hover:text-text-primary">
                    Acepto las <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline">políticas de privacidad</a> y el tratamiento de datos de WAPPY.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isCheckoutSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isCheckoutSubmitting ? (
                    <span>Procesando...</span>
                  ) : (
                    <>
                      <span>
                        {funnelKey === 'wappyvital' && selectedCheckoutPlan !== null
                          ? 'Registrarse' 
                          : ((actualRequiresPayment && (funnelKey !== 'wappyvital' || selectedCheckoutPlan !== null)) 
                              ? 'Pagar y Obtener Acceso' 
                              : 'Continuar con el video'
                            )
                        }
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                {(actualRequiresPayment && (funnelKey !== 'wappyvital' || selectedCheckoutPlan !== null)) && (
                  <div className="pt-3 text-center border-t border-border-medium/60 mt-1">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryView(true)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto"
                    >
                      <Key className="w-3.5 h-3.5" />
                      ¿Ya compraste? Recupera tu acceso
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleRecoverAccess} className="space-y-3.5">
                <p className="text-[11px] text-text-secondary leading-normal">
                  Ingresa el correo electrónico que utilizaste al realizar el pago del curso. Si tu compra fue aprobada, recuperarás el acceso de inmediato.
                </p>

                {recoveryError && (
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{recoveryError}</span>
                  </div>
                )}

                {recoverySuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1.5">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{recoverySuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Correo registrado</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="juan@correo.com"
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-border-medium text-text-primary text-xs focus:outline-none focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRecovering}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                >
                  {isRecovering ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Verificar Acceso de Compra
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryView(false);
                    setRecoveryError('');
                  }}
                  className="w-full py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary text-xs font-semibold border border-border-medium transition-all"
                >
                  Volver al Formulario de Compra
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-lg p-4 sm:p-6 z-50 overflow-y-auto">
          <div className="w-full max-w-md bg-surface-primary border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative my-auto">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowDiscountModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors z-10"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mx-auto mb-4 animate-premium-float">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-extrabold text-text-primary leading-tight outfit mb-2">
              🎉 ¡Felicitaciones por terminar la capacitación!
            </h3>
            <p className="text-xs text-text-secondary mb-6 leading-relaxed">
              Has demostrado un gran compromiso con la Seguridad y Salud en el Trabajo. Como premio, has desbloqueado un <strong className="font-extrabold text-emerald-500">30% de descuento inmediato</strong> aplicable para adquirir tu membresía (Wappy Vital o Wappy Pro).
            </p>

            <div className="bg-surface-secondary border border-dashed border-emerald-500/40 rounded-2xl p-4 mb-6 flex flex-col items-center justify-center gap-2 relative">
              <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wider">Código de Descuento</span>
              <span className="text-2xl font-black text-emerald-500 font-mono tracking-widest">VITAL30</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('VITAL30');
                  alert('¡Código copiado al portapapeles!');
                }}
                className="mt-1 px-3 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-all"
              >
                Copiar Código
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setCouponCode('VITAL30');
                  setShowDiscountModal(false);
                  
                  // Scroll to pricing section smoothly
                  const pricingToggle = document.querySelector('.grid-cols-2');
                  if (pricingToggle) {
                    pricingToggle.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    const cardsContainer = document.getElementById('wappy-vital-card') || document.querySelector('.grid');
                    if (cardsContainer) {
                      cardsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold text-sm transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
              >
                Aplicar Descuento y Ver Planes
              </button>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="w-full py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-secondary text-xs font-semibold border border-border-medium transition-all"
              >
                Ver Ofertas
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="w-full border-t border-border-medium py-6 mt-10 text-center text-xs text-text-secondary relative z-10 bg-surface-primary/20">
        <div className="flex justify-center gap-6 mb-2">
          <a href="/privacy" className="hover:text-emerald-500 transition-colors">Políticas de Privacidad</a>
          <span>·</span>
          <a href="/terms" className="hover:text-emerald-500 transition-colors">Términos de Servicio</a>
        </div>
        <p>© {new Date().getFullYear()} WAPPY. Todos los derechos reservados.</p>
      </footer>

    </div>
  );
}
