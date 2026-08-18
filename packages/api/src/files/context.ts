import fs, { promises as fsPromises } from 'fs';
import { logger } from '@librechat/data-schemas';
import { FileSources, mergeFileConfig } from 'librechat-data-provider';
import type { fileConfigSchema } from 'librechat-data-provider';
import type { IMongoFile } from '@librechat/data-schemas';
import type { z } from 'zod';
import { processTextWithTokenLimit } from '~/utils/text';

/**
 * Extracts text context from attachments and returns formatted text.
 * This handles text that was already extracted from files (OCR, transcriptions, document text, etc.)
 * @param params - The parameters object
 * @param params.attachments - Array of file attachments
 * @param params.req - Express request object for config access
 * @param params.tokenCountFn - Function to count tokens in text
 * @returns The formatted file context text, or undefined if no text found
 */
export async function extractFileContext({
  attachments,
  req,
  tokenCountFn,
}: {
  attachments: IMongoFile[];
  req?: {
    body?: { fileTokenLimit?: number };
    config?: { fileConfig?: z.infer<typeof fileConfigSchema> };
  };
  tokenCountFn: (text: string) => number;
}): Promise<string | undefined> {
  if (!attachments || attachments.length === 0) {
    return undefined;
  }

  const fileConfig = mergeFileConfig(req?.config?.fileConfig);
  const fileTokenLimit = req?.body?.fileTokenLimit ?? fileConfig?.fileTokenLimit ?? 50000;

  let resultText = '';

  for (const file of attachments) {
    let fileText = file.text;
    if (!fileText || fileText.trim().length === 0) {
      if (file.filepath && fs.existsSync(file.filepath)) {
        try {
          if (file.type === 'application/pdf' || file.filename?.toLowerCase().endsWith('.pdf')) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const pdf = require('pdf-parse');
            const dataBuffer = await fsPromises.readFile(file.filepath);
            const pdfData = await pdf(dataBuffer);
            fileText = pdfData?.text ? pdfData.text.replace(/\n+/g, '\n').trim() : '';
          }
        } catch (e) {
          logger.warn(`[extractFileContext] On-the-fly PDF extraction failed for ${file.filename}: ${e.message}`);
        }
      }
    }

    if (!fileText || fileText.trim().length === 0) {
      fileText = `[Documento adjunto: "${file.filename || 'Archivo'}"]`;
    }

    const { text: limitedText, wasTruncated } = await processTextWithTokenLimit({
      text: fileText,
      tokenLimit: fileTokenLimit,
      tokenCountFn,
    });

    if (wasTruncated) {
      logger.debug(
        `[extractFileContext] Text content truncated for file: ${file.filename} due to token limits`,
      );
    }

    resultText += `${!resultText ? 'Attached document(s):\n```md' : '\n\n---\n\n'}# "${file.filename}"\n${limitedText}\n`;
  }

  if (resultText) {
    resultText += '\n```';
    return resultText;
  }

  return undefined;
}
