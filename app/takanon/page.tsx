import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { MarkdownBody } from "@/components/markdown-body";

export const metadata: Metadata = {
  title: "תקנון | פולישוק",
  description: "תקנון האתר, רוח מידברן וכתב ויתור",
};

export default function TakanonPage() {
  const filePath = path.join(process.cwd(), "content", "takanon.md");
  const markdown = fs.readFileSync(filePath, "utf8");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pb-16">
      <MarkdownBody markdown={markdown} />
    </div>
  );
}
