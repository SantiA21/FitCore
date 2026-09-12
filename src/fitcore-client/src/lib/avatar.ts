import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";

// Mismos tonos pastel que ya usa AVATAR_COLORS (Clientes.tsx) para los fondos
// de iniciales, así el avatar ilustrado no desentona con el resto de la app.
const BACKGROUND_COLORS = ["eef2ff", "fff7ed", "ecfdf5", "fff1f2", "eff6ff", "faf5ff"];

// La generación del SVG es determinística mixed por seed pero no gratis
// (recorre el esquema completo de avataaars) — con listas largas (Clientes,
// Asistencias) el mismo seed se repite en varias pantallas, así que se
// cachea el data URI en memoria por el resto de la sesión.
const cache = new Map<string, string>();

/**
 * Genera un avatar ilustrado (estilo Avataaars, vía DiceBear) determinístico
 * a partir de un seed — típicamente el id del cliente, o su nombre completo
 * cuando no hay id disponible (ej. listados que solo traen el nombre desde
 * la API). El mismo seed siempre da el mismo avatar.
 */
export function getPersonaAvatarUri(seed: string): string {
  const cached = cache.get(seed);
  if (cached) return cached;

  const uri = createAvatar(avataaars, {
    seed,
    backgroundColor: BACKGROUND_COLORS,
    backgroundType: ["solid"],
    radius: 50,
  }).toDataUri();

  cache.set(seed, uri);
  return uri;
}
