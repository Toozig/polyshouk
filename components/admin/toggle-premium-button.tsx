"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function TogglePremiumButton({
  userId,
  isPremium: initial,
}: {
  userId: string;
  isPremium: boolean;
}) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(initial);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIsPremium(initial);
  }, [initial]);

  function toggle() {
    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPremium: !isPremium }),
      });
      if (!res.ok) return;
      setIsPremium((v) => !v);
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={isPremium ? "default" : "outline"}
      size="sm"
      className={
        isPremium ? "bg-amber-600 hover:bg-amber-700 text-white border-0" : ""
      }
      disabled={pending}
      onClick={toggle}
    >
      {isPremium ? "פרימיום" : "רגיל"}
    </Button>
  );
}
