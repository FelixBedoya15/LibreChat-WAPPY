import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import { UserPlus, X, Mail, Lock, Phone, MapPin, Building2, Shield, Crown, CheckCircle2 } from 'lucide-react';
import { DEPARTAMENTOS_LIST, getCitiesForDepartment } from '~/utils/colombiaLocations';

interface CreateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onUserCreated }: CreateUserModalProps) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'USER',
        accountStatus: 'active',
        phoneNumber: '',
        departamento: '',
        ciudad: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/users/create', formData);
            showToast({ message: localize('com_ui_user_created_success') || 'Usuario creado exitosamente', status: 'success' });
            onUserCreated();
            onClose();
        } catch (error: any) {
            console.error('Error creating user:', error);
            showToast({ message: error.response?.data?.message || localize('com_ui_user_create_error') || 'Error al crear usuario', status: 'error' });
        }
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-[100050]" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-2xl transition-all border border-slate-200/80 dark:border-zinc-800">
                                {/* Header */}
                                <div className="flex justify-between items-start border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/20">
                                            <UserPlus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <DialogTitle as="h3" className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                                                {localize('com_ui_create_new_user') || 'Crear Nuevo Usuario'}
                                            </DialogTitle>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                                Registra un nuevo usuario con credenciales y perfil inicial.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={onClose} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Nombre */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                {localize('com_ui_name') || 'Nombre'}
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                            />
                                        </div>

                                        {/* Usuario */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                {localize('com_ui_username') || 'Usuario'}
                                            </label>
                                            <input
                                                type="text"
                                                name="username"
                                                value={formData.username}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                            />
                                        </div>

                                        {/* Correo */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Mail className="w-3.5 h-3.5 text-slate-400" /> {localize('com_ui_email') || 'Correo'}
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                            />
                                        </div>

                                        {/* Contraseña */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Lock className="w-3.5 h-3.5 text-slate-400" /> {localize('com_ui_password') || 'Contraseña'}
                                            </label>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                                            />
                                        </div>

                                        {/* Teléfono */}
                                        <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Phone className="w-3.5 h-3.5 text-slate-400" /> Teléfono / Contacto
                                            </label>
                                            <input
                                                type="text"
                                                name="phoneNumber"
                                                placeholder="Ej: +57 3123456789"
                                                value={formData.phoneNumber}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                            />
                                        </div>

                                        {/* Departamento */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Departamento
                                            </label>
                                            <select
                                                name="departamento"
                                                value={formData.departamento}
                                                onChange={(e) => {
                                                    const newDept = e.target.value;
                                                    setFormData(prev => ({ ...prev, departamento: newDept, ciudad: '' }));
                                                }}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {DEPARTAMENTOS_LIST.map((dept) => (
                                                    <option key={dept} value={dept}>{dept}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Ciudad */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Ciudad
                                            </label>
                                            {formData.departamento && getCitiesForDepartment(formData.departamento).length > 0 ? (
                                                <select
                                                    name="ciudad"
                                                    value={formData.ciudad}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer"
                                                >
                                                    <option value="">-- Seleccionar --</option>
                                                    {getCitiesForDepartment(formData.departamento).map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    name="ciudad"
                                                    placeholder="Escribe la ciudad"
                                                    value={formData.ciudad}
                                                    onChange={handleChange}
                                                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none"
                                                />
                                            )}
                                        </div>

                                        {/* Rol */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                                <Shield className="w-3.5 h-3.5 text-teal-600" /> Rol de Acceso
                                            </label>
                                            <select
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer font-semibold"
                                            >
                                                <option value="USER">Invitado (USER)</option>
                                                <option value="USER_GO">Go (USER_GO)</option>
                                                <option value="USER_PLUS">Plus (USER_PLUS)</option>
                                                <option value="USER_PRO">Wappy Pro (USER_PRO)</option>
                                                <option value="USER_IPEVAR">Wappy Vital (USER_IPEVAR)</option>
                                                <option value="USER_CUSTOM">A la Medida (USER_CUSTOM)</option>
                                                <option value="ADMIN">Administrador (ADMIN)</option>
                                            </select>
                                        </div>

                                        {/* Estado */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                                Estado Inicial
                                            </label>
                                            <select
                                                name="accountStatus"
                                                value={formData.accountStatus}
                                                onChange={handleChange}
                                                className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50 px-3.5 py-2.5 text-xs text-slate-800 dark:text-zinc-100 focus:border-teal-500 outline-none cursor-pointer font-semibold"
                                            >
                                                <option value="active">Activo</option>
                                                <option value="pending">Pendiente</option>
                                                <option value="inactive">Inactivo</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-6 flex justify-end items-center gap-3 border-t border-slate-100 dark:border-zinc-800 pt-4">
                                        <button
                                            type="button"
                                            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                                            onClick={onClose}
                                        >
                                            {localize('com_ui_cancel') || 'Cancelar'}
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white cursor-pointer"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>{localize('com_ui_create_user') || 'Crear Usuario'}</span>
                                        </button>
                                    </div>
                                </form>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
