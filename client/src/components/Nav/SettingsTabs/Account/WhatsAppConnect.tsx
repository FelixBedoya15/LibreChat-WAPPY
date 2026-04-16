import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@librechat/client';
import { Loader2, MessageSquare, LogOut, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

type WhatsAppStatus = 'OFFLINE' | 'STARTING' | 'QR_READY' | 'AUTHENTICATED';

export default function WhatsAppConnect() {
  const [status, setStatus] = useState<WhatsAppStatus>('OFFLINE');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Poll status every 2 seconds if STARTING or QR_READY
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'STARTING' || status === 'QR_READY') {
      interval = setInterval(async () => {
        try {
          const res = await axios.get('/api/whatsapp/status');
          const data = res.data;
          setStatus(data.status);
          if (data.qr) {
            setQrCode(data.qr);
          }
        } catch (e) {
          console.error('Error fetching WhatsApp status:', e);
        }
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  // Initial Check
  useEffect(() => {
    const checkInitial = async () => {
      try {
        const res = await axios.get('/api/whatsapp/status');
        setStatus(res.data.status);
        if (res.data.qr) setQrCode(res.data.qr);
      } catch (e) {}
    };
    checkInitial();
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/whatsapp/start');
      setStatus(res.data.status);
    } catch (e) {
      console.error(e);
      setStatus('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/api/whatsapp/logout');
      setStatus('OFFLINE');
      setQrCode(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 py-2 text-sm text-text-primary">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500" />
            Conexión WhatsApp (Modo OpenClaw)
          </h4>
          <p className="text-xs text-text-secondary mt-1 max-w-[280px]">
             Vincula tu WhatsApp personal. Una vez escaneado, <strong>escríbete a ti mismo</strong> ("Tú" o "Message yourself") para conversar con los agentes de IA desde tu celular.
          </p>
        </div>
        
        {status === 'OFFLINE' && (
          <Button 
             variant="outline" 
             onClick={handleStart} 
             disabled={isLoading}
             className="border-green-500/50 text-green-600 hover:bg-green-500/10 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar WhatsApp'}
          </Button>
        )}

        {status === 'AUTHENTICATED' && (
          <Button 
             variant="outline" 
             onClick={handleLogout} 
             disabled={isLoading}
             className="border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" />Desconectar</>}
          </Button>
        )}
      </div>

      {(status === 'STARTING' || (status === 'QR_READY' && !qrCode)) && (
        <div className="flex flex-col items-center justify-center p-6 bg-surface-secondary rounded-xl mt-2 border border-border-light">
           <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-3" />
           <p className="font-bold">Generando Código QR...</p>
           <p className="text-xs text-text-secondary">Esto tomará entre 5 a 15 segundos.</p>
        </div>
      )}

      {status === 'QR_READY' && qrCode && (
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-surface-secondary rounded-xl mt-2 border border-border-light">
           <div className="p-3 bg-white rounded-xl shadow-sm">
             <QRCodeSVG value={qrCode} size={150} level="M" />
           </div>
           <div className="flex flex-col gap-2">
             <h5 className="font-bold text-base">Escanea para enlazar</h5>
             <ol className="text-xs text-text-secondary list-decimal pl-4 space-y-1">
               <li>Abre WhatsApp en tu teléfono.</li>
               <li>Toca menú o configuración y selecciona <strong>Dispositivos vinculados</strong>.</li>
               <li>Toca <strong>Vincular un dispositivo</strong>.</li>
               <li>Apunta la cámara al código QR.</li>
             </ol>
           </div>
        </div>
      )}

      {status === 'AUTHENTICATED' && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 rounded-xl mt-2 border border-green-500/20">
           <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
           <div className="flex flex-col">
             <span className="font-bold text-green-600 dark:text-green-500">WhatsApp Conectado Exitosamente</span>
             <span className="text-xs text-text-secondary">Abre WhatsApp en tu teléfono, busca un chat contigo mismo y di "Hola".</span>
           </div>
        </div>
      )}
    </div>
  );
}
