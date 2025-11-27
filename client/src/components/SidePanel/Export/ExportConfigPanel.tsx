import React from 'react';
import { useLocalize } from '~/hooks';
import useExportConfig from '~/hooks/useExportConfig';
import { Input, Label, Switch } from '@librechat/client';

export default function ExportConfigPanel() {
    const localize = useLocalize();
    const { exportConfig, updateConfig, resetConfig } = useExportConfig();

    return (
        <div className="flex flex-col gap-4 p-4 text-sm text-text-primary">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
                <h3 className="text-lg font-medium">Configuración de Exportación</h3>
                <button
                    onClick={resetConfig}
                    className="text-xs text-text-secondary hover:text-text-primary"
                >
                    Restaurar
                </button>
            </div>

            <div className="space-y-4">
                {/* Cover Settings */}
                <div className="space-y-2">
                    <Label htmlFor="coverTitle">Título de Portada</Label>
                    <Input
                        id="coverTitle"
                        value={exportConfig.coverTitle}
                        onChange={(e) => updateConfig({ coverTitle: e.target.value })}
                        placeholder="Ej: Reporte de IA"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
                    <Input
                        id="logoUrl"
                        value={exportConfig.logoUrl}
                        onChange={(e) => updateConfig({ logoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                    />
                </div>

                {/* Document Settings */}
                <div className="space-y-2">
                    <Label htmlFor="documentTitle">Título del Documento (Metadatos)</Label>
                    <Input
                        id="documentTitle"
                        value={exportConfig.documentTitle}
                        onChange={(e) => updateConfig({ documentTitle: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fontFamily">Tipografía</Label>
                        <Input
                            id="fontFamily"
                            value={exportConfig.fontFamily}
                            onChange={(e) => updateConfig({ fontFamily: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fontSize">Tamaño Fuente</Label>
                        <Input
                            id="fontSize"
                            type="number"
                            value={exportConfig.fontSize}
                            onChange={(e) => updateConfig({ fontSize: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="margins">Márgenes (pulgadas)</Label>
                    <Input
                        id="margins"
                        type="number"
                        step="0.1"
                        value={exportConfig.margins}
                        onChange={(e) => updateConfig({ margins: Number(e.target.value) })}
                    />
                </div>

                {/* Content Settings */}
                <div className="space-y-2">
                    <Label htmlFor="messageTitle">Título del Mensaje</Label>
                    <Input
                        id="messageTitle"
                        value={exportConfig.messageTitle}
                        onChange={(e) => updateConfig({ messageTitle: e.target.value })}
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="showPagination">Mostrar Paginación</Label>
                    <Switch
                        id="showPagination"
                        checked={exportConfig.showPagination}
                        onCheckedChange={(checked) => updateConfig({ showPagination: checked })}
                    />
                </div>
            </div>
        </div>
    );
}
