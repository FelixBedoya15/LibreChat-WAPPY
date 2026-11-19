/**
 * Check if a file is in HEIC format without eagerly bundling the 2.1MB heic-to WASM/JS decoder.
 * @param file - The file to check
 * @returns Promise<boolean> - True if the file is HEIC
 */
export const isHEICFile = async (file: File): Promise<boolean> => {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const looksLikeHeic =
    mime === 'image/heic' ||
    mime === 'image/heif' ||
    /\.(heic|heif)$/i.test(name);

  // Fast-path skip for obviously non-HEIC files (PNG, JPEG, PDF, DOCX, MP4, etc.)
  // so the 2.1MB heic-to chunk is NEVER downloaded unless needed.
  if (!looksLikeHeic && mime && mime !== 'application/octet-stream') {
    return false;
  }

  try {
    const { isHeic } = await import('heic-to');
    return await isHeic(file);
  } catch (error) {
    console.warn('Error checking if file is HEIC:', error);
    return looksLikeHeic;
  }
};

/**
 * Convert HEIC file to JPEG
 * @param file - The HEIC file to convert
 * @param quality - JPEG quality (0-1), default is 0.9
 * @param onProgress - Optional callback to track conversion progress
 * @returns Promise<File> - The converted JPEG file
 */
export const convertHEICToJPEG = async (
  file: File,
  quality: number = 0.9,
  onProgress?: (progress: number) => void,
): Promise<File> => {
  try {
    // Report conversion start
    onProgress?.(0.3);

    const { heicTo } = await import('heic-to');
    const convertedBlob = await heicTo({
      blob: file,
      type: 'image/jpeg',
      quality,
    });

    // Report conversion completion
    onProgress?.(0.8);

    // Create a new File object with the converted blob
    const convertedFile = new File([convertedBlob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });

    // Report file creation completion
    onProgress?.(1.0);

    return convertedFile;
  } catch (error) {
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image to JPEG');
  }
};

/**
 * Process a file, converting it from HEIC to JPEG if necessary
 * @param file - The file to process
 * @param quality - JPEG quality for conversion (0-1), default is 0.9
 * @param onProgress - Optional callback to track conversion progress
 * @returns Promise<File> - The processed file (converted if it was HEIC, original otherwise)
 */
export const processFileForUpload = async (
  file: File,
  quality: number = 0.9,
  onProgress?: (progress: number) => void,
): Promise<File> => {
  const isHEIC = await isHEICFile(file);

  if (isHEIC) {
    console.log('HEIC file detected, converting to JPEG...');
    return convertHEICToJPEG(file, quality, onProgress);
  }

  return file;
};
