const TEAM = [
  {
    name: "Stephen Gicheru",
    role: "CEO & Co-Founder",
    bio: "Former Safaricom M-Pesa product lead. 8 years in Kenya fintech.",
    number: "+254 795542312",
    avatar: "B",
    color: "#FF6B2B",
    linkedin: "#",
  },
  {
    name: "Mary Ivy Wairimu",
    role: "CTO & Co-Founder",
    bio: "Ex-Google Nairobi engineer. Built platforms serving 1M+ users.",
    avatar: "A",
    color: "#0EA5E9",
    linkedin: "#",
  },
  {
    name: " Mary Tessy Muthoni",
    role: "Head of Trust & Safety",
    bio: "Former DCI analyst. Designed KaziShow's ID verification system.",
    avatar: "D",
    color: "#00C896",
    linkedin: "#",
  },
  {
    name: "Alvin Njaramba",
    role: "Head of Growth",
    bio: "Built Jumia Kenya's SME seller program to 5,000 vendors.",
    avatar: "G",
    color: "#EC4899",
    linkedin: "#",
  },
];

export default function TeamSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-kazi-dark mb-2">Meet the team behind KaziShow</h2>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          Built by Kenyans who have seen first-hand how hard it is to find reliable services.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {TEAM.map((member) => (
          <div key={member.name} className="group text-center">
            <div className="relative mb-4 inline-block">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-white text-3xl font-black mx-auto shadow-lg group-hover:scale-105 transition-transform"
                style={{ backgroundColor: member.color }}
              >
                {member.avatar}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-kazi-green rounded-full flex items-center justify-center border-2 border-white text-xs">
                ✓
              </div>
            </div>
            <h3 className="font-black text-sm text-kazi-dark">{member.name}</h3>
            <p className="text-xs text-kazi-orange font-semibold mt-0.5">{member.role}</p>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{member.bio}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-kazi-dark rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="text-3xl flex-shrink-0">🏢</div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">KaziShow Ltd</p>
          <p className="text-xs text-white/50 mt-1">
            Registration No. PVT-2024-NBI-04821 · Registered in Kenya under the Companies Act 2015 ·
            Regulated by CA (Communications Authority) · Nairobi, Kenya 00100
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/10 rounded-2xl px-4 py-2.5 text-white text-xs font-bold whitespace-nowrap">
          🇰🇪 Proudly Kenyan
        </div>
      </div>
    </section>
  );
}
