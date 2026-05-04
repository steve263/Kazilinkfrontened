export default function PartnerLogos() {
  const partners = [
    {
      name: "Safaricom M-Pesa",
      bg: "#00A651",
      text: "white",
      logo: "M-PESA",
      sub: "Official Payment Partner",
    },
    {
      name: "Huduma Centre",
      bg: "#006B3F",
      text: "white",
      logo: "HUDUMA",
      sub: "Government Partner",
    },
    {
      name: "Kenya Revenue Authority",
      bg: "#1E3A5F",
      text: "white",
      logo: "KRA",
      sub: "Compliance Partner",
    },
    {
      name: "iHub Nairobi",
      bg: "#FF6B2B",
      text: "white",
      logo: "iHub",
      sub: "Tech Incubator Partner",
    },
    {
      name: "Equity Bank",
      bg: "#C8102E",
      text: "white",
      logo: "EQUITY",
      sub: "Banking Partner",
    },
  ];

  return (
    <section className="bg-white border-b border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-widest mb-6">
          Trusted partners &amp; integrations
        </p>
        <div className="flex items-center justify-center gap-6 flex-wrap">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-1.5 group cursor-default"
              title={p.name}
            >
              <div
                className="px-4 py-2 rounded-xl flex items-center justify-center min-w-[80px] group-hover:scale-105 transition-transform"
                style={{ backgroundColor: p.bg }}
              >
                <span className="text-sm font-black tracking-tight" style={{ color: p.text }}>
                  {p.logo}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-medium">{p.sub}</span>
            </div>
          ))}
        </div>

        {/* Data protection strip */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-kazi-blue/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🔒</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-black text-kazi-dark">How Your Data is Protected</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              All personal data is encrypted at rest and in transit (AES-256). We never sell your data. You can request deletion at any time. Compliant with Kenya Data Protection Act 2019.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {["🔐 AES-256", "🇰🇪 DPA 2019"].map((badge) => (
              <span key={badge} className="px-2 py-1 bg-kazi-green/10 text-kazi-green text-xs font-bold rounded-lg whitespace-nowrap">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
