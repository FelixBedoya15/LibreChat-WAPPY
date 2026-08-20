import React, { useState, useEffect, useMemo } from 'react';
import { useAuthContext, useLocalize } from '~/hooks';
import { OGDialog, OGDialogContent, Input, Label, Button, useToastContext } from '@librechat/client';
import axios from 'axios';
import { Phone, MapPin, Building, Sparkles } from 'lucide-react';
import { DEPARTAMENTOS_LIST, getCitiesForDepartment } from '~/utils/colombiaLocations';

const RequiredInfoModal: React.FC = () => {
  const localize = useLocalize();
  const { user, setUser, logout } = useAuthContext();
  const { showToast } = useToastContext();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [customCiudad, setCustomCiudad] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Prepopulate if user already has partial info
  useEffect(() => {
    if (user) {
      const existingPhone = user.phoneNumber && user.phoneNumber !== 'No registrado' && user.phoneNumber !== 'N/A' 
        ? user.phoneNumber 
        : '';
      const existingDept = (user as any).departamento || (user as any).department || '';
      const existingCity = (user as any).ciudad || (user as any).city || '';

      if (existingPhone) setPhoneNumber(existingPhone);
      if (existingDept && existingDept !== 'No registrado' && existingDept !== 'N/A') {
        setDepartamento(existingDept);
      }
      if (existingCity && existingCity !== 'No registrado' && existingCity !== 'N/A') {
        setCiudad(existingCity);
      }
    }
  }, [user]);

  // Available cities for currently selected department
  const availableCities = useMemo(() => {
    if (!departamento) return [];
    return getCitiesForDepartment(departamento);
  }, [departamento]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    setDepartamento(selected);
    setCiudad('');
    setCustomCiudad(false);
    if (error) setError('');
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__OTRA__') {
      setCustomCiudad(true);
      setCiudad('');
    } else {
      setCustomCiudad(false);
      setCiudad(val);
    }
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneNumber.trim();
    const cleanDept = departamento.trim();
    const cleanCity = ciudad.trim();

    if (!cleanPhone) {
      setError('El número de teléfono celular es obligatorio para continuar.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('Por favor, ingresa un número de teléfono celular válido. Ej: +57 3123456789');
      return;
    }

    if (!cleanDept) {
      setError('Por favor, selecciona o ingresa tu departamento.');
      return;
    }

    if (!cleanCity) {
      setError('Por favor, selecciona o ingresa tu ciudad / municipio.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: user?.name,
        username: user?.username,
        phoneNumber: cleanPhone,
        departamento: cleanDept,
        ciudad: cleanCity,
        department: cleanDept,
        city: cleanCity,
      };

      const response = await axios.post('/api/user/update', payload);
      if (response.data?.user) {
        setUser(response.data.user);
        showToast({ message: '¡Información guardada correctamente!', status: 'success' });
      } else {
        throw new Error('Formato de respuesta inválido.');
      }
    } catch (err: any) {
      console.error('[RequiredInfoModal] Error saving required profile info:', err);
      const serverMessage = err.response?.data?.message || 'Error de red al guardar la información. Por favor intenta de nuevo.';
      setError(serverMessage);
      showToast({ message: serverMessage, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout('/login?redirect=false');
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) return;
  };

  return (
    <OGDialog open={true} onOpenChange={handleOpenChange}>
      <OGDialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[95vh] w-11/12 max-w-md overflow-y-auto rounded-3xl border border-emerald-500/20 bg-surface-secondary/95 p-0 shadow-2xl backdrop-blur-xl dark:border-emerald-500/10"
      >
        {/* Glow ambient background circles */}
        <div className="pointer-events-none absolute -mr-16 -mt-16 right-0 top-0 h-48 w-48 rounded-full bg-emerald-500/15 blur-2xl transition-all duration-700" />
        <div className="pointer-events-none absolute -mb-16 -ml-16 bottom-0 left-0 h-48 w-48 rounded-full bg-cyan-500/15 blur-2xl transition-all duration-700" />

        <div className="flex flex-col items-center p-6 text-center relative z-10">
          {/* Animated Header Icon */}
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 text-emerald-500 shadow-inner">
            <MapPin className="w-7 h-7 stroke-[2] animate-bounce" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="mb-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Completa tu Información
          </h2>

          {/* Subtitle */}
          <p className="mb-5 text-xs leading-relaxed text-text-secondary px-2">
            Para brindarte una experiencia óptima y asegurar la validez de tu cuenta de acuerdo con las normativas vigentes, por favor registra tu teléfono celular, departamento y ciudad.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-3.5">
            {/* Phone input */}
            <div>
              <Label htmlFor="phoneNumber" className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-500" />
                Teléfono Celular / WhatsApp *
              </Label>
              <Input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ej: +57 3123456789"
                className="mt-1 w-full rounded-xl border border-border-medium bg-surface-primary/70 px-3.5 py-2 text-xs text-text-primary backdrop-blur-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Departamento Select */}
            <div>
              <Label htmlFor="departamento" className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                Departamento *
              </Label>
              <select
                id="departamento"
                value={departamento}
                onChange={handleDepartmentChange}
                disabled={loading}
                className="mt-1 w-full rounded-xl border border-border-medium bg-surface-primary/70 px-3.5 py-2 text-xs text-text-primary backdrop-blur-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Selecciona un Departamento --</option>
                {DEPARTAMENTOS_LIST.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Ciudad / Municipio Select or Input */}
            <div>
              <Label htmlFor="ciudad" className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-500" />
                Ciudad / Municipio *
              </Label>

              {departamento && availableCities.length > 0 && !customCiudad ? (
                <div className="space-y-1.5">
                  <select
                    id="ciudad"
                    value={ciudad}
                    onChange={handleCityChange}
                    disabled={loading}
                    className="mt-1 w-full rounded-xl border border-border-medium bg-surface-primary/70 px-3.5 py-2 text-xs text-text-primary backdrop-blur-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Selecciona una Ciudad / Municipio --</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__OTRA__">✏️ Otra ciudad (escribir manualmente)...</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    id="ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(e) => {
                      setCiudad(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={departamento ? "Escribe el nombre de la ciudad o municipio" : "Primero selecciona un departamento"}
                    disabled={loading || !departamento}
                    className="mt-1 w-full rounded-xl border border-border-medium bg-surface-primary/70 px-3.5 py-2 text-xs text-text-primary backdrop-blur-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {customCiudad && availableCities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCiudad(false);
                        setCiudad('');
                      }}
                      className="text-[11px] text-emerald-500 hover:underline"
                    >
                      ← Volver a la lista de ciudades de {departamento}
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs font-medium text-red-500 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold py-2.5 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar y Continuar</span>
                )}
              </Button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-2 text-xs text-text-tertiary hover:text-text-primary transition-colors text-center font-medium border border-transparent rounded-xl hover:bg-surface-hover/50"
              >
                Cerrar Sesión
              </button>
            </div>
          </form>
        </div>
      </OGDialogContent>
    </OGDialog>
  );
};

export default RequiredInfoModal;
