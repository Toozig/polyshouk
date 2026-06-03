import type { Metadata } from "next";
import { PolicyHtmlFrame } from "@/components/policy-html-frame";
import { loadRandomPolicyHtml } from "@/lib/policy/load-random-policy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "תקנון | פולישוק",
  description: "תקנון האתר, רוח מידברן וכתב ויתור",
};

export default function TakanonPage() {
  const html = loadRandomPolicyHtml();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 pb-16">
      <PolicyHtmlFrame html={html} />
    </div>
  );
}
