/**
 * Regex que identifica modelos que NO son de chat/texto general
 * (Voz Live, Audio Nativo, TTS, Transcripción, Imagen, Video Veo, Embeddings, AQA, Whisper).
 */
export const NON_TEXT_MODEL_REGEX =
  /(?:^|[-_/])(live|native-audio|tts|transcribe|imagen|veo|embedding|aqa|whisper)(?:$|[-_/])/i;

/**
 * Devuelve `true` únicamente si el identificador corresponde a un modelo de texto/chat
 * apto para selectores de Chat, Agentes, Presets y módulos SG-SST.
 */
export const isTextChatModel = (modelId?: string | null): boolean =>
  typeof modelId === 'string' &&
  Boolean(modelId.trim()) &&
  !NON_TEXT_MODEL_REGEX.test(modelId.trim());

/**
 * Filtra una lista de modelos conservando únicamente los modelos de texto/chat.
 */
export const filterTextChatModels = (models?: ReadonlyArray<string> | null): string[] =>
  Array.isArray(models) ? models.filter((m) => isTextChatModel(m)) : [];
