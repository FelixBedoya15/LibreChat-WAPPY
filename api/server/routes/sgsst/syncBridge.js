const CanvasSession = require('~/models/CanvasSession');
const LiveEditorSession = require('~/models/LiveEditorSession');
const CompanyInfo = require('~/models/CompanyInfo');
const { logger } = require('@librechat/data-schemas');

async function getActiveCompanyId(userId) {
  if (!userId) return null;
  let active = await CompanyInfo.findOne({ user: userId, isActive: true });
  if (!active) active = await CompanyInfo.findOne({ user: userId });
  return active ? active._id : null;
}

/**
 * Sincroniza el contenido de LiveEditor a Canvas.
 * Se ejecuta cada vez que el agente o el usuario guardan en LiveEditorSession.
 */
async function syncLiveEditorToCanvas(conversationId, content, fileName, userId) {
  try {
    if (!conversationId || conversationId === 'new') return;
    
    const companyId = await getActiveCompanyId(userId);
    let canvasSession = await CanvasSession.findOne({ conversationId });
    
    // Si no existe, creamos la sesión de Canvas de tipo 'text'
    if (!canvasSession) {
      canvasSession = new CanvasSession({
        user: userId,
        companyId,
        conversationId,
        title: fileName || 'Documento sin título',
        fileType: 'text',
        content: content || '',
        version: 1,
        history: [{
          version: 1,
          content: content || '',
          title: fileName || 'Documento sin título',
          fileType: 'text',
          updatedAt: new Date()
        }]
      });
      await canvasSession.save();
      logger.info(`[SyncBridge] CanvasSession creada para conversationId: ${conversationId}`);
    } else {
      // Si existe y el tipo es 'text', actualizamos. Si es otro tipo (ej: excel), NO sobrescribimos.
      if (canvasSession.fileType === 'text') {
        const contentChanged = JSON.stringify(canvasSession.content) !== JSON.stringify(content);
        const titleChanged = fileName && canvasSession.title !== fileName;
        
        if (contentChanged || titleChanged) {
          const maxHistoryVersion = (canvasSession.history || []).reduce((max, item) => Math.max(max, item.version || 0), 0);
          const nextVersion = Math.max(maxHistoryVersion, canvasSession.version || 0) + 1;
          const newHistoryItem = {
            version: nextVersion,
            content: content ?? canvasSession.content,
            title: fileName || canvasSession.title,
            fileType: 'text',
            updatedAt: new Date()
          };
          
          canvasSession.content = content ?? canvasSession.content;
          canvasSession.title = fileName || canvasSession.title;
          canvasSession.version = nextVersion;
          canvasSession.history = [...(canvasSession.history || []), newHistoryItem].slice(-20);
          
          await canvasSession.save();
          logger.info(`[SyncBridge] CanvasSession actualizada a v${nextVersion} para conversationId: ${conversationId}`);
        }
      }
    }
  } catch (error) {
    logger.error('[SyncBridge] Error en syncLiveEditorToCanvas:', error);
  }
}

/**
 * Sincroniza el contenido de Canvas a LiveEditor.
 * Se ejecuta cada vez que el usuario realiza cambios en CanvasSession de tipo 'text'.
 */
async function syncCanvasToLiveEditor(conversationId, content, title, userId) {
  try {
    if (!conversationId || conversationId === 'new') return;
    
    const companyId = await getActiveCompanyId(userId);
    
    await LiveEditorSession.findOneAndUpdate(
      { conversationId },
      {
        $set: {
          content: content ?? '',
          contentUpdatedAt: new Date(),
          companyId,
          ...(title ? { fileName: title } : {})
        },
        $setOnInsert: { user: userId }
      },
      { upsert: true, new: true }
    );
    logger.info(`[SyncBridge] LiveEditorSession sincronizada desde Canvas para conversationId: ${conversationId}`);
  } catch (error) {
    logger.error('[SyncBridge] Error en syncCanvasToLiveEditor:', error);
  }
}

module.exports = {
  syncLiveEditorToCanvas,
  syncCanvasToLiveEditor
};
