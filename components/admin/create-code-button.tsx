"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CreateCodeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);

    const response = await fetch("/api/admin/codes", {
      method: "POST",
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      toast.error(data.error ?? "אירעה שגיאה");
      return;
    }

    toast.success(`קוד חדש נוצר: ${data.code}`);
    router.refresh();
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      {loading ? "יוצר..." : "צור קוד חדש"}
    </Button>
  );
}
