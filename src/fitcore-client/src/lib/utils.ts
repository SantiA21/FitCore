import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Arma un link de wa.me a partir de un teléfono (tolera espacios, guiones,
 * paréntesis y un "+" inicial) y un mensaje pre-cargado. Devuelve null si no
 * hay teléfono cargado, para que el llamador pueda ocultar el botón.
 */
export function buildWhatsAppUrl(telefono: string | null | undefined, mensaje: string): string | null {
  if (!telefono) return null
  const digits = telefono.replace(/[^\d]/g, "")
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`
}
