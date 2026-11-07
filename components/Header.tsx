import HeaderAuth from "./HeaderAuth";

export default function Header() {
  const link = "hover:underline underline-offset-4";
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <a href="/" className="text-lg font-bold tracking-tight">CODM Accounts</a>
        <nav aria-label="Main" className="hidden gap-6 text-sm sm:flex">
          <a href="/accounts" className={link}>Browse accounts</a>
          <a href="/sell" className={link}>Sell</a>
          <a href="/info" className={link}>Info</a>
        </nav>
        <HeaderAuth />
      </div>
      <nav aria-label="Main (small screens)" className="flex justify-center gap-6 border-t border-line py-2 text-sm sm:hidden">
        <a href="/accounts" className={link}>Browse</a>
        <a href="/sell" className={link}>Sell</a>
        <a href="/info" className={link}>Info</a>
      </nav>
    </header>
  );
}
