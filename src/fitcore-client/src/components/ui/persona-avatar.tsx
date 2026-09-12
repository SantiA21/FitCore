import { useMemo } from "react";
import { getPersonaAvatarUri } from "@/lib/avatar";
import { cn } from "@/lib/utils";

interface PersonaAvatarProps {
  /** Id o nombre completo de la persona — determina el avatar generado. */
  seed: string;
  /** Tamaño en px (ancho = alto). */
  size?: number;
  className?: string;
}

/**
 * Avatar ilustrado determinístico (DiceBear/Avataaars) que reemplaza a los
 * círculos de iniciales en toda la app. Mismo seed → mismo avatar siempre.
 */
export default function PersonaAvatar({ seed, size = 36, className }: PersonaAvatarProps) {
  const uri = useMemo(() => getPersonaAvatarUri(seed), [seed]);

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
