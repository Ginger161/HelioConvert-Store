"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, type Answers } from "@/lib/quiz";

/* eslint-disable @next/next/no-img-element */
export default function Quiz({ covers }: { covers: { src: string; alt: string; obj: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const q = QUESTIONS[step];
  const chosen = answers[q.key];
  const last = step === QUESTIONS.length - 1;

  const next = () => {
    if (!chosen) return;
    if (last) router.push(`/start/results?${new URLSearchParams(answers as Record<string, string>)}`);
    else setStep((s) => s + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") next();
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) setAnswers((a) => ({ ...a, [q.key]: q.options[n - 1].value }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, chosen]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-[1.25fr_1fr]">
      <div className="edge p-6 sm:p-10">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase text-muted">
          <span>Step {step + 1} of {QUESTIONS.length}</span>
          <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-jade-bright to-gold shadow-[0_0_14px_var(--gold)] transition-all duration-500" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
        </div>

        <h1 key={q.key} className="mt-10 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{q.title}</h1>
        <p className="mt-2 text-muted">{q.sub}</p>

        <div role="radiogroup" aria-label={q.title} className="mt-8 space-y-3">
          {q.options.map((o, i) => {
            const on = chosen === o.value;
            return (
              <button key={o.value} role="radio" aria-checked={on} onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
                className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${on ? "border-jade-bright bg-jade/15 shadow-[0_0_30px_-10px_var(--jade-bright)]" : "border-line bg-white/[0.03] hover:border-white/25"}`}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/25 font-mono text-[10px] text-muted">{on ? <span className="h-3 w-3 rounded-full bg-jade-bright shadow-[0_0_10px_var(--jade-bright)]" /> : i + 1}</span>
                <span className="flex-1 text-[15px]">{o.label}</span>
                {o.hint && <span className="hidden font-mono text-[11px] text-muted sm:inline">{o.hint}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && <button onClick={() => setStep((s) => s - 1)} className="rounded-xl border border-line px-5 py-3 text-sm text-muted hover:text-foreground">Back</button>}
          <button disabled={!chosen} onClick={next} className="btn-gold rounded-xl px-7 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none">
            {last ? "Show my picks →" : "Continue →"}
          </button>
          <span className="ml-auto hidden font-mono text-[11px] text-muted sm:block">Press 1-{q.options.length} to pick · Enter to continue</span>
        </div>
      </div>

      <aside className="edge relative hidden overflow-hidden p-8 lg:block">
        <div className="halo -right-10 -top-10 h-64 w-64 bg-gold/25" />
        <div className="halo -bottom-16 -left-10 h-64 w-64 bg-jade-bright/20" />
        <p className="relative font-mono text-[11px] uppercase text-gold">Your picks, personalised</p>
        <h2 className="relative mt-3 text-3xl font-extrabold leading-tight tracking-tight">5 quick questions, then a bundle or course made for you</h2>
        <p className="relative mt-3 text-sm text-muted">We match your answers against the whole library. No sign-up, nothing to pay to see your picks.</p>
        <ol className="relative mt-8 space-y-3">
          {QUESTIONS.map((x, i) => (
            <li key={x.key} className={`flex items-center gap-3 text-sm ${i <= step ? "text-foreground" : "text-muted"}`}>
              <span className={`grid h-6 w-6 place-items-center rounded-full border text-[11px] ${i < step ? "border-jade-bright bg-jade-bright text-black" : i === step ? "border-gold text-gold" : "border-white/20"}`}>{i < step ? "✓" : i + 1}</span>
              {x.key === "stage" ? "Where you are" : x.key === "goal" ? "Your goal" : x.key === "time" ? "Your time" : x.key === "style" ? "How you learn" : "What helps most"}
            </li>
          ))}
        </ol>
        <div className="relative mt-10 flex h-40 justify-center">
          {covers.map((c, i) => (
            <div key={c.src} className={`obj ${c.obj} absolute w-28`} style={{ left: `${18 + i * 24}%`, top: i === 1 ? 0 : 12, transform: `rotate(${(i - 1) * 7}deg)`, zIndex: i }}>
              <img src={c.src} alt={c.alt} />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
