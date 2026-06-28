/**
 * Landing Page — Family Allowance Manager
 *
 * Phase 1 scaffold. Full hero section, features, CTA, and wallet
 * connection flow are implemented in Phase 3.
 */
export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background mesh gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(220 85% 60% / 0.12), transparent), " +
            "radial-gradient(ellipse 60% 50% at 80% 90%, hsl(38 88% 55% / 0.06), transparent), " +
            "hsl(220 68% 5%)",
        }}
      />

      {/* ── Nav placeholder ── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 h-16 border-b border-border/40 backdrop-blur-md bg-background/60">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-text">FAM</span>
          <span className="hidden sm:inline text-sm font-medium text-muted-foreground">
            Family Allowance Manager
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/10">
            Stellar Testnet
          </span>
          {/* Connect Wallet button — implemented in Phase 3 */}
          <button
            id="connect-wallet-btn"
            className="btn-glow px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Connect Wallet
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-16">
        <div className="animate-slide-in-top">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Built on Stellar · Powered by Soroban
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-balance">
            Family Finance,{" "}
            <span className="gradient-text">On-Chain.</span>
          </h1>

          {/* Sub-headline */}
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10">
            Automate recurring allowances, enforce spending rules, and build
            tamper-proof financial records for your family — all on the Stellar
            blockchain. No banks. No middlemen. Just code.
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              id="hero-connect-wallet-btn"
              className="btn-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground text-base font-bold hover:opacity-90 transition-opacity"
            >
              Launch App →
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-in">
          {[
            { label: "Smart Contracts", value: "2" },
            { label: "Roles", value: "3" },
            { label: "Network", value: "Stellar" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features section (scaffold) ── */}
      <section id="features" className="page-container py-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything your family needs,{" "}
          <span className="gradient-text">on the blockchain.</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, description }) => (
            <div key={title} className="glass-card p-6 hover:border-primary/30 transition-colors group">
              <div className="text-3xl mb-4 group-hover:animate-float">{icon}</div>
              <h3 className="text-base font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-xs text-muted-foreground">
        <p>
          Built on{" "}
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Stellar
          </a>{" "}
          ·{" "}
          <a
            href="https://developers.stellar.org/docs/build/smart-contracts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Soroban
          </a>{" "}
          · MIT License
        </p>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: "👨‍👩‍👧",
    title: "Family Groups",
    description:
      "Create a family group and add members by their Stellar wallet address. Role-based access control enforced on-chain.",
  },
  {
    icon: "📅",
    title: "Automated Schedules",
    description:
      "Configure daily, weekly, or monthly allowance distributions. Smart contracts handle the rest automatically.",
  },
  {
    icon: "💰",
    title: "Spending Limits",
    description:
      "Set hard on-chain spending limits per member. No contract call can exceed the configured cap.",
  },
  {
    icon: "🔗",
    title: "Immutable History",
    description:
      "Every payment is recorded on-chain forever. Transparent, tamper-proof, and verifiable by anyone.",
  },
  {
    icon: "⚡",
    title: "Real-time Events",
    description:
      "Live activity feed powered by Soroban contract events. See payments the moment they hit the ledger.",
  },
  {
    icon: "🔒",
    title: "Non-custodial",
    description:
      "Your keys, your money. All signing happens in your wallet (Freighter, xBull, Lobstr). No private keys ever leave your device.",
  },
];
