import { useLocalStorage } from '~/hooks';

export interface ExportConfig {
    documentTitle: string;
    fontFamily: string;
    fontSize: number;
    margins: number;
    logoUrl: string;
    showPagination: boolean;
    coverTitle: string;
    messageTitle: string;
}

const defaultConfig: ExportConfig = {
    documentTitle: 'AI Conversation',
    fontFamily: 'Calibri',
    fontSize: 12,
    margins: 1,
    logoUrl: '',
    showPagination: true,
    coverTitle: 'Reporte de IA',
    messageTitle: 'Respuesta Generada',
};

export default function useExportConfig() {
    const [exportConfig, setExportConfig] = useLocalStorage<ExportConfig>('exportConfig', defaultConfig);

    const updateConfig = (newConfig: Partial<ExportConfig>) => {
        setExportConfig((prev) => ({ ...prev, ...newConfig }));
    };

    const resetConfig = () => {
        setExportConfig(defaultConfig);
    };

    return {
        exportConfig,
        updateConfig,
        resetConfig,
    };
}
