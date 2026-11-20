/**
 * Resuelve de forma defensiva la URL pública de una miniatura del Blog.
 * Soporta URLs externas (https://...), rutas permanentes del servidor (/images/blog/...),
 * rutas relativas que inicien por images/... y nombres de archivo legados.
 */
export function resolveBlogThumbnail(raw?: string | null): string {
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (!trimmed) {
        return '';
    }
    if (/^(https?:\/\/|data:image\/)/i.test(trimmed) || trimmed.startsWith('/')) {
        return trimmed;
    }
    if (trimmed.startsWith('images/')) {
        return `/${trimmed}`;
    }
    const filename = trimmed.split('/').pop()?.trim() || '';
    return filename ? `/images/${filename}` : '';
}
