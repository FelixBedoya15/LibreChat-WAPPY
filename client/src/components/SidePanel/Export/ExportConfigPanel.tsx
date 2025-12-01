import React, { useState, useEffect } from 'react';
import { useLocalize } from '~/hooks';
import useExportConfig from '~/hooks/useExportConfig';
import type { ExportConfig } from '~/hooks/useExportConfig';
import { Input, Label, Switch, Button } from '@librechat/client';

export default function ExportConfigPanel() {
    const localize = useLocalize();
    const { exportConfig, updateConfig, resetConfig, setConfig } = useExportConfig();

    // Draft state for unsaved changes
    const [draftConfig, setDraftConfig] = useState<ExportConfig>(exportConfig);

    // Sync draft with saved config when it changes (e.g., after save or component remount)
    useEffect(() => {
        setDraftConfig(exportConfig);
    }, [exportConfig]);

    const handleSave = () => {
        setConfig(draftConfig);
    };

    const handleCancel = () => {
        setDraftConfig(exportConfig);
    };

    const handleReset = () => {
        resetConfig();
        setDraftConfig(exportConfig);
    };

    const hasChanges = JSON.stringify(draftConfig) !== JSON.stringify(exportConfig);

    return (
        <div className="flex flex-col gap-4 p-4 text-sm text-text-primary">
            <div className="flex items-center justify-between border-b border-border-light pb-2">
                <h3 className="text-lg font-medium">Configuración de Exportación</h3>
                <button
                    onClick={handleReset}
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
                        value={draftConfig.coverTitle}
                        onChange={(e) => setDraftConfig({ ...draftConfig, coverTitle: e.target.value })}
                        placeholder="Ej: Reporte de IA"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="logoUrl">URL del Logo (Opcional)</Label>
                    <Input
                        id="logoUrl"
                        value={draftConfig.logoUrl}
                        onChange={(e) => setDraftConfig({ ...draftConfig, logoUrl: e.target.value })}
                        placeholder="https://ejemplo.com/logo.png"
                    />
                </div>

                {/* Document Settings */}
                <div className="space-y-2">
                    <Label htmlFor="documentTitle">Título del Documento (Metadatos)</Label>
                    <Input
                        id="documentTitle"
                        value={draftConfig.documentTitle}
                        onChange={(e) => setDraftConfig({ ...draftConfig, documentTitle: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fontFamily">Tipografía</Label>
                        <Input
                            id="fontFamily"
                            value={draftConfig.fontFamily}
                            onChange={(e) => setDraftConfig({ ...draftConfig, fontFamily: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fontSize">Tamaño Fuente</Label>
                        <Input
                            id="fontSize"
                            type="number"
                            value={draftConfig.fontSize}
                            onChange={(e) => setDraftConfig({ ...draftConfig, fontSize: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="margins">Márgenes (pulgadas)</Label>
                    <Input
                        id="margins"
                        type="number"
                        step="0.1"
                        value={draftConfig.margins}
                        onChange={(e) => setDraftConfig({ ...draftConfig, margins: Number(e.target.value) })}
                    />
                </div>

                {/* Content Settings */}
                <div className="space-y-2">
                    <Label htmlFor="messageTitle">Título del Mensaje</Label>
                    <Input
                        id="messageTitle"
                        value={draftConfig.messageTitle}
                        onChange={(e) => setDraftConfig({ ...draftConfig, messageTitle: e.target.value })}
                    />
                </div>

                <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="showPagination">Mostrar Paginación</Label>
                    <Switch
                        id="showPagination"
                        checked={draftConfig.showPagination}
                        onCheckedChange={(checked) => setDraftConfig({ ...draftConfig, showPagination: checked })}
                    />
                </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-2 border-t border-border-light pt-4">
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="flex-1"
                    variant="default"
                >
                    Guardar Cambios
                </Button>
                <Button
                    onClick={handleCancel}
                    disabled={!hasChanges}
                    className="flex-1"
                    variant="outline"
                >
                    Cancelar
                </Button>
            </div>
        </div>
    );
}
