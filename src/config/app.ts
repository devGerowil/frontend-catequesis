export const APP_NAME = 'Confirmación 2026';

export const APP_PARROQUIA = 'Parroquia Inmaculada Concepción Vinto';

export const APP_TAGLINE = 'Materiales de la catequesis de confirmación';

/** Bucket de Supabase Storage donde se suben los archivos. */
export const STORAGE_BUCKET = 'materiales';

/** Tamaño máximo por archivo en MB (límite real de Supabase: 50 MB). */
export const MAX_FILE_SIZE_MB = 25;

/** Extensiones aceptadas para subir. */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'doc',
  'docx',
  'odt',
  'txt',
  'rtf',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
];

/** Valor para el atributo `accept` del input de archivos. */
export const ACCEPTED_MIME =
  '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.odt,.txt,.rtf,.xls,.xlsx,.ppt,.pptx';
