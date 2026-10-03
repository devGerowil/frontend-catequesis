/** Formatea un tamaño en bytes como texto legible (ej. 1,4 MB). */
export function formatTamano(bytes: number | null | undefined): string {
  if (!bytes || bytes < 0) return '';

  const unidades = ['B', 'KB', 'MB', 'GB'];
  let valor = bytes;
  let i = 0;

  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i += 1;
  }

  const decimales = valor < 10 && i > 0 ? 1 : 0;
  return `${valor.toFixed(decimales).replace('.', ',')} ${unidades[i]}`;
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const FECHA_LARGA = new Intl.DateTimeFormat('es-BO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function aFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Fecha corta: «12 de marzo de 2026». Cadena vacía si no hay fecha. */
export function formatFecha(valor: string | Date | null | undefined): string {
  const fecha = aFecha(valor);
  return fecha ? FECHA_CORTA.format(fecha) : '';
}

/** Fecha con hora, para el historial del panel. */
export function formatFechaHora(valor: string | Date | null | undefined): string {
  const fecha = aFecha(valor);
  return fecha ? FECHA_LARGA.format(fecha) : '';
}

/** Traduce 'YYYY-MM-DD' al formato que espera `<q-input type="date">`. */
export function paraInputFecha(valor: string | null | undefined): string {
  return valor ? valor.slice(0, 10) : '';
}

export type TipoArchivo = 'pdf' | 'imagen' | 'documento' | 'otro';

export const INFO_TIPOS: Record<TipoArchivo, { etiqueta: string; icono: string; color: string }> = {
  pdf: { etiqueta: 'Documentos PDF', icono: 'picture_as_pdf', color: 'negative' },
  imagen: { etiqueta: 'Imágenes', icono: 'image', color: 'info' },
  documento: { etiqueta: 'Documentos', icono: 'description', color: 'primary' },
  otro: { etiqueta: 'Otros archivos', icono: 'draft', color: 'grey-7' },
};

/** Clasifica un archivo por su mime o extensión. */
export function tipoDeArchivo(archivo: { mime?: string | null; nombre: string }): TipoArchivo {
  const mime = (archivo.mime ?? '').toLowerCase();
  const ext = archivo.nombre.split('.').pop()?.toLowerCase() ?? '';

  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp'].includes(ext)
  ) {
    return 'imagen';
  }
  if (
    mime.startsWith('text/') ||
    ['doc', 'docx', 'odt', 'rtf', 'txt', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp'].includes(ext)
  ) {
    return 'documento';
  }
  return 'otro';
}

/** ¿Se puede previsualizar en el navegador? */
export function esVisualizable(tipo: TipoArchivo): boolean {
  return tipo === 'pdf' || tipo === 'imagen';
}

/** Normaliza un texto para búsquedas: minúsculas y sin acentos. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
