import { useMemo } from "react";
import { getPersonaAvatarUri, type AvatarStyleId } from "@/lib/avatar";
import { useGymSettings } from "@/context/GymSettingsContext";
import { cn } from "@/lib/utils";

interface PersonaAvatarProps {
  /** Id o nombre completo de la persona — determina el avatar generado. */
  seed: string;
  /** Tamaño en px (ancho = alto). */
  size?: number;
  className?: string;
}

/**
 * Avatar ilustrado determinístico (DiceBear) que reemplaza a los círculos de
 * iniciales en toda la app. Mismo seed → mismo avatar siempre. El estilo
 * (Avataaars, Notionists, etc.) se toma de la configuración del gimnasio, así
 * que cambiarlo en Configuración lo actualiza en todos lados sin tocar cada
 * lugar que usa este componente.
 */
export default function PersonaAvatar({ seed, size = 36, className }: PersonaAvatarProps) {
  const { settings } = useGymSettings();
  const uri = useMemo(
    () => getPersonaAvatarUri(seed, settings.avatarStyle as AvatarStyleId),
    [seed, settings.avatarStyle]
  );

  return (
    <img
      src={uri}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("rounded-full shrink-0 bg-gray-50", className)}
    />
  );
}
