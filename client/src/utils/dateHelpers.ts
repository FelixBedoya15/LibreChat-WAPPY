export const formatDateForInput = (dateString?: string | Date | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
};
