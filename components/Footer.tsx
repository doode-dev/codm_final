import { legalLinks } from "@/data/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 text-sm sm:grid-cols-3">
        <div>
          <p className="font-bold">CODM Accounts</p>
          <p className="mt-2 max-w-xs text-mute">A marketplace for Call of Duty: Mobile accounts only. Not affiliated with Activision or Tencent.</p>
        </div>
        <div>
          <p className="font-medium">Help</p>
          <ul className="mt-2 space-y-1 text-mute">
            <li><a href="/info" className="hover:underline">How it works</a></li>
            <li><a href="/info#safety" className="hover:underline">Trust and safety</a></li>
            <li><a href="/info#faq" className="hover:underline">Questions</a></li>
            <li><a href="/contact" className="hover:underline">Contact support</a></li>
          </ul>
        </div>
        <div>
          <p className="font-medium">Legal</p>
          <ul className="mt-2 space-y-1 text-mute">
            {legalLinks.map(([label, href]) => (
              <li key={href}><a href={href} className="hover:underline">{label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
