import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, InputHelperText } from '@librechat/client';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface Ad {
    _id: string;
    title: string;
    content: string;
    images: string[];
    link: string;
    ctaText: string;
    active: boolean;
}

const Ads = () => {
    const localize = useLocalize();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAd, setCurrentAd] = useState<Ad | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Ad>();

    const fetchAds = async () => {
        setLoading(true);
        try {
            // Use admin endpoint? The plan said /api/ads/admin for all ads
            const response = await fetch('/api/ads/admin');
            if (response.ok) {
                const data = await response.json();
                setAds(data);
            }
        } catch (error) {
            console.error('Error fetching ads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAds();
    }, []);

    const onSubmit = async (data: Ad) => {
        try {
            // Quick fix for images array from string input (comma separated)
            // Ideally use a better input for images
            const formattedData = {
                ...data,
                images: typeof data.images === 'string' ? (data.images as string).split(',').map((s: string) => s.trim()) : data.images
            };

            let response;
            if (currentAd) {
                response = await fetch(`/api/ads/${currentAd._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formattedData),
                });
            } else {
                response = await fetch('/api/ads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formattedData),
                });
            }

            if (response.ok) {
                setIsEditing(false);
                setCurrentAd(null);
                reset();
                fetchAds();
            } else {
                console.error('Failed to save ad');
            }
        } catch (error) {
            console.error('Error saving ad', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;
        try {
            const response = await fetch(`/api/ads/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                fetchAds();
            }
        } catch (error) {
            console.error('Error deleting ad', error);
        }
    };

    const startEdit = (ad: Ad) => {
        setCurrentAd(ad);
        setValue('title', ad.title);
        setValue('content', ad.content);
        setValue('images', ad.images.join(', ') as any);
        setValue('link', ad.link);
        setValue('ctaText', ad.ctaText);
        setValue('active', ad.active);
        setIsEditing(true);
    };

    const startCreate = () => {
        setCurrentAd(null);
        reset();
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setCurrentAd(null);
        reset();
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">{currentAd ? 'Editar Anuncio' : 'Crear Anuncio'}</h3>
                    <Button variant="ghost" size="icon" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium">Título</label>
                        <Input {...register('title', { required: true })} placeholder="Título del anuncio" />
                        {errors.title && <span className="text-red-500 text-xs">Requerido</span>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Contenido</label>
                        <Input {...register('content')} placeholder="Descripción corta" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Imágenes (URLs separadas por coma)</label>
                        <Input {...register('images', { required: true })} placeholder="https://example.com/img1.jpg, https://..." />
                        {errors.images && <span className="text-red-500 text-xs">Requerido (al menos una URL)</span>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Enlace (Opcional)</label>
                        <Input {...register('link')} placeholder="https://..." />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Texto del Botón</label>
                        <Input {...register('ctaText')} placeholder="Ver más" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" {...register('active')} id="active" />
                        <label htmlFor="active" className="text-sm">Activo</label>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={cancelEdit}>Cancelar</Button>
                        <Button type="submit">Guardar</Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Gestión de Publicidad</h3>
                <Button onClick={startCreate} size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Anuncio
                </Button>
            </div>

            {loading ? (
                <div>Cargando...</div>
            ) : (
                <div className="flex flex-col gap-2">
                    {ads.map((ad) => (
                        <div key={ad._id} className="flex items-center justify-between rounded-md border p-3 bg-surface-primary">
                            <div className="flex flex-col">
                                <span className="font-medium">{ad.title}</span>
                                <span className="text-xs text-text-secondary">{ad.active ? 'Activo' : 'Inactivo'}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => startEdit(ad)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(ad._id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {ads.length === 0 && <div className="text-center text-text-secondary pt-4">No hay anuncios creados.</div>}
                </div>
            )}
        </div>
    );
};

export default Ads;
