import {
  TextPaths,
  FilePaths,
  CodePaths,
  AudioPaths,
  VideoPaths,
  SheetPaths,
} from '@librechat/client';
import {
  megabyte,
  QueryKeys,
  excelMimeTypes,
  EToolResources,
  codeTypeMapping,
  fileConfig as defaultFileConfig,
} from 'librechat-data-provider';
import type { TFile, EndpointFileConfig, FileConfig } from 'librechat-data-provider';
import type { QueryClient } from '@tanstack/react-query';
import type { ExtendedFile } from '~/common';

export const partialTypes = ['text/x-'];

const textDocument = {
  paths: TextPaths,
  fill: '#FF5588',
  title: 'Document',
};

const spreadsheet = {
  paths: SheetPaths,
  fill: '#10A37F',
  title: 'Spreadsheet',
};

const codeFile = {
  paths: CodePaths,
  fill: '#FF6E3C',
  // TODO: make this dynamic to the language
  title: 'Code',
};

const artifact = {
  paths: CodePaths,
  fill: '#2D305C',
  title: 'Code',
};

const audioFile = {
  paths: AudioPaths,
  fill: '#FF6B35',
  title: 'Audio',
};

const videoFile = {
  paths: VideoPaths,
  fill: '#8B5CF6',
  title: 'Video',
};

export const extensionMimeMapping: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  csv: 'text/csv',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt: 'application/vnd.ms-powerpoint',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  json: 'application/json',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  avi: 'video/avi',
  mkv: 'video/mkv',
  m4v: 'video/m4v',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/m4a',
};

const browserMimeAliasMapping: Record<string, string> = {
  'video/x-matroska': 'video/mkv',
  'video/x-msvideo': 'video/avi',
  'video/x-m4v': 'video/m4v',
  'video/x-ms-wmv': 'video/wmv',
  'video/x-flv': 'video/flv',
  'video/3gpp': 'video/3gp',
};

export const inferMimeType = (fileName = '', currentType = ''): string => {
  const trimmedType = (currentType || '').trim();
  const hasExtension = fileName.includes('.');
  const ext = hasExtension ? (fileName.split('.').pop()?.toLowerCase() ?? '') : '';

  if (trimmedType && browserMimeAliasMapping[trimmedType]) {
    return browserMimeAliasMapping[trimmedType];
  }

  const knownCodeType = ext ? codeTypeMapping[ext] : undefined;
  if (
    knownCodeType &&
    (!trimmedType || trimmedType === 'application/octet-stream' || trimmedType !== knownCodeType)
  ) {
    return knownCodeType;
  }

  if (!trimmedType || trimmedType === 'application/octet-stream') {
    return (ext && extensionMimeMapping[ext]) || '';
  }

  return trimmedType;
};

export const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    let settled = false;
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const finish = (duration: number) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      video.onloadedmetadata = null;
      video.onerror = null;
      window.URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(duration) && duration >= 0 ? duration : 0);
    };

    const timeoutId = setTimeout(() => finish(0), 4000);

    video.onloadedmetadata = function () {
      finish(video.duration);
    };

    video.onerror = function () {
      finish(0);
    };

    video.src = objectUrl;
  });
};

export const fileTypes = {
  /* Category matches */
  file: {
    paths: FilePaths,
    fill: '#0000FF',
    title: 'File',
  },
  text: textDocument,
  txt: textDocument,
  audio: audioFile,
  video: videoFile,
  // application:,

  /* Partial matches */
  csv: spreadsheet,
  'application/pdf': textDocument,
  pdf: textDocument,
  'text/x-': codeFile,
  artifact: artifact,

  /* Exact matches */
  // 'application/json':,
  // 'text/html':,
  // 'text/css':,
  // image,
};

// export const getFileType = (type = '') => {
//   let fileType = fileTypes.file;
//   const exactMatch = fileTypes[type];
//   const partialMatch = !exactMatch && partialTypes.find((type) => type.includes(type));
//   const category = (!partialMatch && (type.split('/')[0] ?? 'text') || 'text');

//   if (exactMatch) {
//     fileType = exactMatch;
//   } else if (partialMatch) {
//     fileType = fileTypes[partialMatch];
//   } else if (fileTypes[category]) {
//     fileType = fileTypes[category];
//   }

//   if (!fileType) {
//     fileType = fileTypes.file;
//   }

//   return fileType;
// };

export const getFileType = (
  type = '',
): {
  paths: React.FC;
  fill: string;
  title: string;
} => {
  // Direct match check
  if (fileTypes[type]) {
    return fileTypes[type];
  }

  if (excelMimeTypes.test(type)) {
    return spreadsheet;
  }

  // Partial match check
  const partialMatch = partialTypes.find((partial) => type.includes(partial));
  if (partialMatch && fileTypes[partialMatch]) {
    return fileTypes[partialMatch];
  }

  // Category check
  const category = type.split('/')[0] || 'text';
  if (fileTypes[category]) {
    return fileTypes[category];
  }

  // Default file type
  return fileTypes.file;
};

/**
 * Format a date string to a human readable format
 * @example
 * formatDate('2020-01-01T00:00:00.000Z') // '1 Jan 2020'
 */
export function formatDate(dateString: string, isSmallScreen = false) {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);

  if (isSmallScreen) {
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
    });
  }

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Adds a file to the query cache
 */
export function addFileToCache(queryClient: QueryClient, newfile: TFile) {
  const currentFiles = queryClient.getQueryData<TFile[]>([QueryKeys.files]);

  if (!currentFiles) {
    console.warn('No current files found in cache, skipped updating file query cache');
    return;
  }

  const fileIndex = currentFiles.findIndex((file) => file.file_id === newfile.file_id);

  if (fileIndex > -1) {
    console.warn('File already exists in cache, skipped updating file query cache');
    return;
  }

  queryClient.setQueryData<TFile[]>(
    [QueryKeys.files],
    [
      {
        ...newfile,
      },
      ...currentFiles,
    ],
  );
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) {
    return 0;
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
}

const { checkType } = defaultFileConfig;

export const validateFiles = ({
  files,
  fileList,
  setError,
  endpointFileConfig,
  toolResource,
  fileConfig,
}: {
  fileList: File[];
  files: Map<string, ExtendedFile>;
  setError: (error: string) => void;
  endpointFileConfig: EndpointFileConfig;
  toolResource?: string;
  fileConfig: FileConfig | null;
}) => {
  const { fileLimit, fileSizeLimit, totalSizeLimit, supportedMimeTypes } = endpointFileConfig;
  const existingFiles = Array.from(files.values());
  const incomingTotalSize = fileList.reduce((total, file) => total + file.size, 0);
  if (incomingTotalSize === 0) {
    setError('com_error_files_empty');
    return false;
  }
  const currentTotalSize = existingFiles.reduce((total, file) => total + file.size, 0);

  if (fileLimit && fileList.length + files.size > fileLimit) {
    setError(`You can only upload up to ${fileLimit} files at a time.`);
    return false;
  }

  for (let i = 0; i < fileList.length; i++) {
    let originalFile = fileList[i];
    const hasExtension = originalFile.name.includes('.');
    const extension = hasExtension ? (originalFile.name.split('.').pop()?.toLowerCase() ?? '') : '';
    let fileType = inferMimeType(originalFile.name, originalFile.type);

    // Check if the file type is still empty after the extension check
    if (!fileType) {
      setError('Unable to determine file type for: ' + originalFile.name);
      return false;
    }

    let mimeTypesToCheck = supportedMimeTypes;
    if (toolResource === EToolResources.context) {
      const isMultimodalMedia =
        fileType.startsWith('image/') ||
        fileType.startsWith('video/') ||
        fileType.startsWith('audio/');
      mimeTypesToCheck = [
        ...(fileConfig?.text?.supportedMimeTypes || defaultFileConfig.text.supportedMimeTypes || []),
        ...(fileConfig?.ocr?.supportedMimeTypes || defaultFileConfig.ocr.supportedMimeTypes || []),
        ...(fileConfig?.stt?.supportedMimeTypes || defaultFileConfig.stt.supportedMimeTypes || []),
        ...(isMultimodalMedia
          ? supportedMimeTypes || defaultFileConfig.endpoints.default.supportedMimeTypes || []
          : []),
      ];
    }

    // Fallback to canonical extension MIME if OS-supplied MIME does not match endpoint regexes
    if (!checkType(fileType, mimeTypesToCheck) && extension && extensionMimeMapping[extension]) {
      const canonicalExtMime = extensionMimeMapping[extension];
      if (checkType(canonicalExtMime, mimeTypesToCheck)) {
        fileType = canonicalExtMime;
      }
    }

    // Replace empty/generic/mismatched type with inferred canonical type
    if (originalFile.type !== fileType) {
      const newFile = new File([originalFile], originalFile.name, { type: fileType });
      originalFile = newFile;
      fileList[i] = newFile;
    }

    if (!checkType(originalFile.type, mimeTypesToCheck)) {
      console.log(originalFile);
      setError('Currently, unsupported file type: ' + originalFile.type);
      return false;
    }

    if (fileSizeLimit && originalFile.size >= fileSizeLimit) {
      setError(`File size exceeds ${fileSizeLimit / megabyte} MB.`);
      return false;
    }
  }

  if (totalSizeLimit && currentTotalSize + incomingTotalSize > totalSizeLimit) {
    setError(`The total size of the files cannot exceed ${totalSizeLimit / megabyte} MB.`);
    return false;
  }

  const combinedFilesInfo = [
    ...existingFiles.map(
      (file) =>
        `${file.file?.name ?? file.filename}-${file.size}-${file.type?.split('/')[0] ?? 'file'}`,
    ),
    ...fileList.map(
      (file: File | undefined) =>
        `${file?.name}-${file?.size}-${file?.type?.split('/')[0] ?? 'file'}`,
    ),
  ];

  const uniqueFilesSet = new Set(combinedFilesInfo);

  if (uniqueFilesSet.size !== combinedFilesInfo.length) {
    setError('com_error_files_dupe');
    return false;
  }

  return true;
};
