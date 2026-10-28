import { Suspense } from "react";

// Dynamic routes read `params`, which is request-time data; wrapping the content in Suspense lets the shell render instantly.
export default function WithLoading({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="mx-auto h-[70vh] max-w-6xl px-5 py-16 font-mono text-xs text-jade-bright">&gt; [SYS] loading…</div>}>
      {children}
    </Suspense>
  );
}
