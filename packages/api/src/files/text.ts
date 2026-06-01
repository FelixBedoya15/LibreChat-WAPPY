import axios from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import * as XLSX from 'xlsx';
import { logger } from '@librechat/data-schemas';
import { FileSources } from 'librechat-data-provider';
import type { Request as ServerRequest } from 'express';
import { logAxiosError, readFileAsString } from '~/utils';
import { generateShortLivedToken } from '~/crypto/jwt';

/**
 * Attempts to parse text using RAG API, falls back to native text parsing
 * @param params - The parameters object
 * @param params.req - The Express request object
 * @param params.file - The uploaded file
 * @param params.file_id - The file ID
 * @returns
 */
export async function parseText({
  req,
  file,
  file_id,
}: {
  req: Pick<ServerRequest, 'user'> & {
    user?: { id: string };
  };
  file: Express.Multer.File;
  file_id: string;
}): Promise<{ text: string; bytes: number; source: string }> {
  if (!process.env.RAG_API_URL) {
    logger.debug('[parseText] RAG_API_URL not defined, falling back to native text parsing');
    return parseTextNative(file);
  }

  const userId = req.user?.id;
  if (!userId) {
    logger.debug('[parseText] No user ID provided, falling back to native text parsing');
    return parseTextNative(file);
  }

  try {
    const healthResponse = await axios.get(`${process.env.RAG_API_URL}/health`, {
      timeout: 10000,
    });
    if (healthResponse?.statusText !== 'OK' && healthResponse?.status !== 200) {
      logger.debug('[parseText] RAG API health check failed, falling back to native parsing');
      return parseTextNative(file);
    }
  } catch (healthError) {
    logAxiosError({
      message: '[parseText] RAG API health check failed, falling back to native parsing:',
      error: healthError,
    });
    return parseTextNative(file);
  }

  try {
    const jwtToken = generateShortLivedToken(userId);
    const formData = new FormData();
    formData.append('file_id', file_id);
    formData.append('file', createReadStream(file.path));

    const formHeaders = formData.getHeaders();

    const response = await axios.post(`${process.env.RAG_API_URL}/text`, formData, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        accept: 'application/json',
        ...formHeaders,
      },
      timeout: 30000,
    });

    const responseData = response.data;
    logger.debug(`[parseText] RAG API completed successfully (${response.status})`);

    if (!('text' in responseData)) {
      throw new Error('RAG API did not return parsed text');
    }

    return {
      text: responseData.text,
      bytes: Buffer.byteLength(responseData.text, 'utf8'),
      source: FileSources.text,
    };
  } catch (error) {
    logAxiosError({
      message: '[parseText] RAG API text parsing failed, falling back to native parsing',
      error,
    });
    return parseTextNative(file);
  }
}

/**
 * Native JavaScript text parsing fallback
 * Simple text file reading - complex formats handled by RAG API
 * @param file - The uploaded file
 * @returns
 */
export async function parseTextNative(file: Express.Multer.File): Promise<{
  text: string;
  bytes: number;
  source: string;
}> {
  const originalName = file.originalname ? file.originalname.toLowerCase() : '';
  const isExcel =
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel' ||
    originalName.endsWith('.xlsx') ||
    originalName.endsWith('.xls');

  let text: string;
  if (isExcel) {
    try {
      const workbook = XLSX.readFile(file.path);
      let excelContent = '';
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        if (csv.trim()) {
          excelContent += `Sheet: ${sheetName}\n${csv}\n\n`;
        }
      }
      text = excelContent.trim();
      if (!text) {
        text = 'Empty Excel sheet';
      }
    } catch (excelError) {
      logger.error(`[parseTextNative] Error parsing Excel file ${file.path}:`, excelError);
      const { content } = await readFileAsString(file.path, {
        fileSize: file.size,
      });
      text = content;
    }
  } else {
    const { content } = await readFileAsString(file.path, {
      fileSize: file.size,
    });
    text = content;
  }

  return {
    text,
    bytes: Buffer.byteLength(text, 'utf8'),
    source: FileSources.text,
  };
}
