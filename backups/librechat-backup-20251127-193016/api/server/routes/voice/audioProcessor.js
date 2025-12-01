/**
 * Audio Processing Utilities
 * Handles audio format conversion for Gemini Live API
 */

/**
 * Convert WebM/Opus audio to PCM 16kHz mono
 * Note: This is a placeholder - actual conversion should be done client-side
 * The client should send already-formatted PCM audio
 */
function convertToPCM(audioBuffer) {
    // In production, use a library like ffmpeg or similar
    // For now, we assume client sends correct format
    return audioBuffer;
}

/**
 * Encode audio buffer to Base64
 */
function encodeAudioToBase64(audioBuffer) {
    if (Buffer.isBuffer(audioBuffer)) {
        return audioBuffer.toString('base64');
    }
    return Buffer.from(audioBuffer).toString('base64');
}

/**
 * Decode Base64 audio to buffer
 */
function decodeBase64ToAudio(base64String) {
    return Buffer.from(base64String, 'base64');
}

/**
 * Process incoming audio chunk from client
 * @param {Buffer|string} audioData - Audio data from client
 * @returns {string} Base64 encoded PCM audio
 */
function processInputAudio(audioData) {
    // If already base64 string, return as-is
    if (typeof audioData === 'string') {
        return audioData;
    }

    // Convert buffer to base64
    const pcmAudio = convertToPCM(audioData);
    return encodeAudioToBase64(pcmAudio);
}

/**
 * Process outgoing audio chunk from Gemini
 * @param {string} base64Audio - Base64 encoded audio from Gemini
 * @returns {string} Base64 audio ready for client playback
 */
function processOutputAudio(base64Audio) {
    // Gemini sends 24kHz PCM audio
    // Client will handle decoding and playback
    return base64Audio;
}

module.exports = {
    convertToPCM,
    encodeAudioToBase64,
    decodeBase64ToAudio,
    processInputAudio,
    processOutputAudio,
};
