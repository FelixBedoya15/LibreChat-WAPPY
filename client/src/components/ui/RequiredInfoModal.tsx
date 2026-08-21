import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import { OGDialog, OGDialogContent, Label, Button, useToastContext } from '@librechat/client';
import axios from 'axios';
import { Phone, MapPin, Building, Sparkles } from 'lucide-react';
import { DEPARTAMENTOS_LIST, getCitiesForDepartment } from '~/utils/colombiaLocations';

const RequiredInfoModal: React.FC = () => {
  const localize = useLocalize();
  const queryClient = useQueryClient();
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
      setError('Por favor, selecciona tu departamento.');
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
        queryClient.setQueryData([QueryKeys.user], response.data.user);
        queryClient.invalidateQueries([QueryKeys.user]);
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
        className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-850 p-6 text-left align-middle shadow-2xl transition-all border border-gray-200 dark:border-gray-800"
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated Header Icon with Movement */}
          <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 shadow-inner">
            <MapPin className="w-7 h-7 stroke-[2] animate-bounce" />
            <Sparkles className="w-3.5 h-3.5 text-teal-500 absolute -top-1 -right-1 animate-pulse" />
          </div>

          {/* Title */}
          <h2 className="mb-1 text-xl font-bold text-gray-900 dark:text-white">
            Completa tu Información
          </h2>

          {/* Subtitle */}
          <p className="mb-5 text-xs leading-relaxed text-gray-500 dark:text-gray-400 px-1">
            Para brindarte una experiencia óptima y asegurar la validez de tu cuenta de acuerdo con las normativas vigentes, por favor registra tu teléfono celular, departamento y ciudad.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full text-left space-y-4">
            {/* Phone input */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phoneNumber" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Teléfono Celular / WhatsApp *
              </Label>
              <input
                id="phoneNumber"
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ej: +57 3123456789"
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Departamento Select */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="departamento" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Departamento *
              </Label>
              <select
                id="departamento"
                value={departamento}
                onChange={handleDepartmentChange}
                disabled={loading}
                className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all cursor-pointer"
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
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ciudad" className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                Ciudad / Municipio *
              </Label>

              {departamento && availableCities.length > 0 && !customCiudad ? (
                <div className="space-y-1.5">
                  <select
                    id="ciudad"
                    value={ciudad}
                    onChange={handleCityChange}
                    disabled={loading}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all cursor-pointer"
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
                  <input
                    id="ciudad"
                    type="text"
                    value={ciudad}
                    onChange={(e) => {
                      setCiudad(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder={departamento ? "Escribe el nombre de la ciudad o municipio" : "Primero selecciona un departamento"}
                    disabled={loading || !departamento}
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-3.5 py-2.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                  />
                  {customCiudad && availableCities.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCiudad(false);
                        setCiudad('');
                      }}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                    >
                      ← Volver a la lista de ciudades de {departamento}
                    </button>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 shadow-md shadow-teal-600/20 hover:shadow-teal-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
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
                className="w-full py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors text-center font-medium border border-transparent rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer"
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
