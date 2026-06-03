import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-7 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
} as const;

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hues = [210, 250, 280, 320, 170, 30, 15];
  const hue = hues[Math.abs(hash) % hues.length];
  return `hsl(${hue} 45% 38%)`;
}

function initialsFromUsername(username: string): string {
  const trimmed = username.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const slice = trimmed.slice(0, 2);
  return slice.toUpperCase();
}

export function UserAvatar({
  username,
  size = "md",
  className,
}: {
  username: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const bg = avatarColor(username);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bg }}
      aria-hidden
    >
      {initialsFromUsername(username)}
    </span>
  );
}
