/**
 * Save User Message to database
 */
async saveUserMessage(text) {
    if (!text) return;

    try {
        let conversationId = this.conversationId;
        let isNewConversation = false;

        // If conversation doesn't exist, create a new one
        if (!conversationId || conversationId === 'new') {
            conversationId = uuidv4();
            this.conversationId = conversationId;
            isNewConversation = true;
            logger.info(`[VoiceSession] Generated new conversationId for user message: ${conversationId}`);
        }

        const messageId = uuidv4();
        const messageData = {
            messageId,
            conversationId,
            text: text,
            content: [{ type: 'text', text: text }],
            user: this.userId,
            sender: 'User',
            isCreatedByUser: true,
            endpoint: EModelEndpoint.google,
            model: this.config.model,
        };

        const savedMessage = await saveMessage({ user: { id: this.userId } }, messageData, { context: 'VoiceSession' });

        if (savedMessage) {
            await saveConvo({ user: { id: this.userId } }, savedMessage, { context: 'VoiceSession' });
            logger.info(`[VoiceSession] Saved user message: ${messageId}`);

            // If new conversation, notify client
            if (isNewConversation) {
                this.sendToClient({
                    type: 'conversationId',
                    data: { conversationId: this.conversationId }
                });
            }

            // Notify client to refresh chat
            this.sendToClient({
                type: 'conversationUpdated',
                data: { conversationId: this.conversationId }
            });
        }
    } catch (error) {
        logger.error('[VoiceSession] Error saving user message:', error);
    }
}
