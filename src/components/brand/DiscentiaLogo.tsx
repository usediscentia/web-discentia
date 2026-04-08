import Image from "next/image";
import { cn } from "@/lib/utils";

interface DiscentiaLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

export function DiscentiaLogo({
  size = 20,
  className,
  alt = "",
}: DiscentiaLogoProps) {
  return (
    <span
      aria-hidden={alt ? undefined : true}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/discentia-logo.svg"
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </span>
  );
}
