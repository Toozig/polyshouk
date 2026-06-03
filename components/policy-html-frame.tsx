type Props = {
  html: string;
};

export function PolicyHtmlFrame({ html }: Props) {
  return (
    <iframe
      title="תקנון"
      srcDoc={html}
      className="w-full min-h-[75vh] rounded-lg border border-slate-700 bg-slate-900"
      sandbox="allow-scripts"
    />
  );
}
