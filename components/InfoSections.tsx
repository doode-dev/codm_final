import { buySteps, sellSteps, trust, faqs, fees } from "@/data/site";

function Block({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {intro && <p className="mt-2 max-w-xs text-sm leading-relaxed text-mute">{intro}</p>}
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[2rem_1fr] gap-3 py-4">
          <span className="text-mute">{i + 1}</span>
          <div>
            <p className="font-medium">{s.title}</p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-mute">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InfoSections() {
  return (
    <>
      <Block id="how-it-works" title="Buying an account" intro="From first search to confirmed delivery.">
        <Steps items={buySteps} />
      </Block>
      <Block id="sell" title="Selling an account" intro={`We take a ${fees.sellerCommissionPct}% commission on completed sales. Listing is free.`}>
        <Steps items={sellSteps} />
        <p className="mt-4 text-sm text-mute">Example: a $100 sale pays you $90 before payout costs.</p>
        <a href="/sell" className="mt-5 inline-block rounded-sm bg-olive px-4 py-2 text-sm font-medium text-white hover:bg-olive-dark">List an account</a>
      </Block>
      <Block id="safety" title="Trust and safety" intro="How we reduce fraud, and what we can't promise.">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {trust.map((t) => (
            <div key={t.title}>
              <dt className="font-medium">{t.title}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-mute">{t.body}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 border-l-2 border-alert pl-4">
          <p className="font-medium">Risk disclosure</p>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-mute">
            Activision prohibits buying, selling and transferring Call of Duty: Mobile accounts. Any account sold here can be restricted or banned, or recovered by the original owner, and we cannot prevent that. Refunds are not guaranteed for publisher actions.
          </p>
          <a href="/legal/risk-disclosure" className="mt-2 inline-block text-sm underline underline-offset-4">Read the full disclosure</a>
        </div>
      </Block>
      <Block id="faq" title="Questions">
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex items-start justify-between gap-4 font-medium">
                {f.q}
                <span aria-hidden className="text-mute group-open:hidden">+</span>
                <span aria-hidden className="hidden text-mute group-open:inline">−</span>
              </summary>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-mute">{f.a}</p>
            </details>
          ))}
        </div>
      </Block>
    </>
  );
}
