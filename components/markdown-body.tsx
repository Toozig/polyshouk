"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";

type Props = {
  markdown: string;
};

export function MarkdownBody({ markdown }: Props) {
  return (
    <article className="text-slate-200 text-sm leading-relaxed space-y-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white [&_h1]:mb-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-blue-400 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:text-white [&_strong]:font-semibold">
      <ReactMarkdown
        components={{
          a({ href, children, ...rest }) {
            if (href?.startsWith("/")) {
              return (
                <Link href={href} {...rest}>
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...rest}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
