import { createAvatar } from "@dicebear/core";
// Se importa cada estilo directamente de su paquete (en vez de desde el
// barrel @dicebear/collection, que reexporta las ~30 colecciones juntas) para
// que el bundle final solo incluya estos 4 estilos.
import * as avataaars from "@dicebear/avataaars";
import * as notionists from "@dicebear/notionists";
import * as personas from "@dicebear/personas";
import * as openPeeps from "@dicebear/open-peeps";

export type AvatarStyleId = "avataaars" | "notionists" | "personas" | "open-peeps";

export const AVATAR_STYLES: { id: AvatarStyleId; label: string; description: string }[] = [
  { id: "avataaars", label: "Avataaars", description: "Cartoon clásico, el más usado" },
  { id: "notionists", label: "Notionists", description: "Minimalista, trazo tipo ilustración editorial" },
  { id: "personas", label: "Personas", description: "Look más corporativo, con más detalle" },
  { id: "open-peeps", label: "Open Peeps", description: "Dibujado a mano, informal" },
];

export const DEFAULT_AVATAR_STYLE: AvatarStyleId = "avataaars";

const STYLE_MODULES: Record<AvatarStyleId, Parameters<typeof createAvatar>[0]> = {
  avataaars,
  notionists,
  personas,
  "open-peeps": openPeeps,
};

// Mismos tonos pastel que ya usa AVATAR_COLORS (Clientes.tsx) para los fondos
// de iniciales, así el avatar ilustrado no desentona con el resto de la app.
const BACKGROUND_COLORS = ["eef2ff", "fff7ed", "ecfdf5", "fff1f2", "eff6ff", "faf5ff"];

// La generación del SVG es determinística por seed pero no gratis (recorre
// el esquema completo del estilo) — con listas largas (Clientes, Asistencias)
// el mismo seed se repite en varias pantallas, así que se cachea el data URI
// en memoria por el resto de la sesión.
const cache = new Map<string, string>();

/**
 * Genera un avatar ilustrado (vía DiceBear) determinístico a partir de un
 * seed — típicamente el id del cliente, o su nombre completo cuando no hay
 * id disponible (ej. listados que solo traen el nombre desde la API). El
 * mismo seed + estilo siempre da el mismo avatar.
 */
export function getPersonaAvatarUri(seed: string, style: AvatarStyleId = DEFAULT_AVATAR_STYLE): string {
  const cacheKey = `${style}:${seed}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const uri = createAvatar(STYLE_MODULES[style] ?? avataaars, {
    seed,
    backgroundColor: BACKGROUND_COLORS,
    backgroundType: ["solid"],
    radius: 50,
  }).toDataUri();

  cache.set(cacheKey, uri);
  return uri;
}
