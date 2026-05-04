const AWARDS = [
  { emoji: "🏆", title: "Best App Kenya", year: "2024", org: "TechAwards KE" },
  { emoji: "🌍", title: "Top Startup EA", year: "2024", org: "East Africa Tech" },
  { emoji: "🚀", title: "Most Innovative", year: "2024", org: "iHub Nairobi" },
  { emoji: "⭐", title: "Editors Choice", year: "2024", org: "Techweez" },
  { emoji: "🇰🇪", title: "Made in Kenya", year: "2024", org: "Startup Kenya" },
];

export default function AwardShelf() {
  return (
    <section className="bg-white border-y border-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-widest mb-6">
          Recognition &amp; Awards
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {AWARDS.map((a) => (
            <div
              key={a.title}
              className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-kazi-orange/30 hover:bg-orange-50/30 transition-all group cursor-default"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{a.emoji}</span>
              <div>
                <p className="text-xs font-black text-kazi-dark">{a.title}</p>
                <p className="text-xs text-gray-400">{a.org} · {a.year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
