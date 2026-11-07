"use client";

import { useEffect, useState } from "react";
import { banners } from "@/data/banners";

export default function Banner() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(m.matches);
    const h = () => setReduced(m.matches);
    m.addEventListener("change", h);
    return () => m.removeEventListener("change", h);
  }, []);

  // depends on i so a manual click restarts the 5 second timer
  useEffect(() => {
    if (paused || reduced) return;
    const t = setInterval(() => setI((p) => (p + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [paused, reduced, i]);

  const go = (n: number) => setI((n + banners.length) % banners.length);
  const arrow = "absolute top-1/2 z-10 -translate-y-1/2 rounded-sm bg-black/70 px-3 py-2 text-xl hover:bg-black";

  return (
    <section
      aria-roledescription="carousel" aria-label="Featured"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      className="relative h-64 overflow-hidden border-b border-line bg-surface sm:h-80 lg:h-[26rem]"
    >
      {banners.map((b, n) => (
        <div key={b.src} inert={n !== i} aria-hidden={n !== i}
          className={`absolute inset-0 transition-opacity duration-700 ${n === i ? "opacity-100" : "opacity-0"}`}>
          {failed[n] ? (
            <div className="flex h-full items-center justify-center px-5 text-sm text-mute">Add an image at public{b.src}</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={b.src} alt={b.alt} onError={() => setFailed((f) => ({ ...f, [n]: true }))} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/80">
            <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-5 py-4">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{b.title}</p>
                <p className="mt-1 text-sm text-mute">{b.caption}</p>
              </div>
              <a href={b.href} className="shrink-0 rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">
                {b.href === "/sell" ? "List an account" : "Browse accounts"}
              </a>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => go(i - 1)} aria-label="Previous slide" className={`${arrow} left-3`}>‹</button>
      <button onClick={() => go(i + 1)} aria-label="Next slide" className={`${arrow} right-3`}>›</button>
      <div className="absolute right-5 top-4 z-10 flex gap-2">
        {banners.map((b, n) => (
          <button key={b.src} onClick={() => go(n)} aria-label={`Show slide ${n + 1}`} aria-current={n === i}
            className={`h-1.5 w-8 rounded-sm ${n === i ? "bg-olive" : "bg-white/40"}`} />
        ))}
      </div>
    </section>
  );
}
