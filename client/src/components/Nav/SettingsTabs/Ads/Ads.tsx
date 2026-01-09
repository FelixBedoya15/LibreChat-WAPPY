import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Input } from '@librechat/client';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import { useLocalize, useAuthContext } from '~/hooks';

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
    const { token } = useAuthContext(); // Get token from context (might be null initially)
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAd, setCurrentAd] = useState<Ad | null>(null);

    const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<Ad>({
        defaultValues: {
            title: '',
            content: '',
            images: [],
            link: '',
            ctaText: '',
            active: true
        }
    });

    // Debugging: Log errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.error('Form Validation Errors:', errors);
        }
    }, [errors]);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/ads/admin', { headers }); // Add headers
            if (response.ok) {
                const data = await response.json();
                setAds(data);
            } else {
                console.error('Failed to fetch ads:', response.status);
            }
        } catch (error) {
            console.error('Error fetching ads', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchAds();
        }
    }, [token]); // Add token dependency

    const onSubmit = async (data: Ad) => {
        console.log('Submitting Ad Data:', data);
        try {
            const formattedData = {
                ...data,
                images: typeof data.images === 'string' ? (data.images as string).split(',').map((s: string) => s.trim()).filter(Boolean) : data.images
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let response;
            if (currentAd) {
                response = await fetch(`/api/ads/${currentAd._id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(formattedData),
                });
            } else {
                response = await fetch('/api/ads', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(formattedData),
                });
            }

            if (response.ok) {
                console.log('Ad saved successfully');
                alert('Anuncio guardado correctamente');
                setIsEditing(false);
                setCurrentAd(null);
                reset();
                fetchAds();
            } else {
                const errorText = await response.text();
                console.error('Failed to save ad', errorText);
                alert(`Error al guardar: ${response.status} ${response.statusText}\n${errorText}`);
            }
        } catch (error) {
            console.error('Error saving ad', error);
            alert('Error de red o servidor al guardar.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;
        try {
            const headers: Record<string, string> = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`/api/ads/${id}`, {
                method: 'DELETE',
                headers,
            });
            if (response.ok) {
                fetchAds();
            } else {
                alert('Error deleting ad');
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
        reset({
            title: '',
            content: '',
            images: [],
            link: '',
            ctaText: '',
            active: true
        });
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
                <form onSubmit={handleSubmit(onSubmit, (e) => console.error('Submit Error:', e))} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium">Título</label>
                        <Controller
                            name="title"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Input {...field} placeholder="Título del anuncio" value={field.value || ''} />
                            )}
                        />
                        {errors.title && <span className="text-red-500 text-xs">Requerido</span>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Contenido</label>
                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Descripción corta" value={field.value || ''} />
                            )}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Imágenes (URLs separadas por coma)</label>
                        <Controller
                            name="images"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Input {...field} placeholder="https://example.com/img1.jpg, https://..." value={field.value || ''} />
                            )}
                        />
                        {errors.images && <span className="text-red-500 text-xs">Requerido (al menos una URL)</span>}
                    </div>
                    <div>
                        <label className="text-sm font-medium">Enlace (Opcional)</label>
                        <Controller
                            name="link"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="https://..." value={field.value || ''} />
                            )}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Texto del Botón</label>
                        <Controller
                            name="ctaText"
                            control={control}
                            render={({ field }) => (
                                <Input {...field} placeholder="Ver más" value={field.value || ''} />
                            )}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Controller
                            name="active"
                            control={control}
                            render={({ field: { onChange, value, ref } }) => (
                                <input
                                    type="checkbox"
                                    id="active"
                                    onChange={onChange}
                                    checked={value}
                                    ref={ref}
                                />
                            )}
                        />
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
