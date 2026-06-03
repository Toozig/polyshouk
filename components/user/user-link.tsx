import Link from "next/link";
import { userProfilePath } from "@/lib/users/user-route";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";

export function UserLink({
  username,
  className,
  showAvatar = false,
  avatarSize = "sm",
}: {
  username: string;
  className?: string;
  showAvatar?: boolean;
  avatarSize?: "sm" | "md" | "lg";
}) {
  return (
    <Link
      href={userProfilePath(username)}
      className={cn(
        "inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors",
        className
      )}
      dir="ltr"
    >
      {showAvatar ? <UserAvatar username={username} size={avatarSize} /> : null}
      <span>{username}</span>
    </Link>
  );
}
