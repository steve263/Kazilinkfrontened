import { Clock, Star } from "lucide-react";

export default function KaziPromise() {
  const promises = [
    {
      icon: Clock,
      color: "#F59E0B",
      title: "15-Min Response Guarantee",
      desc: "Providers must respond within 15 minutes of a booking request — or you automatically receive a KSh 100 discount.",
    },
    {
      icon: Star,
      color: "#0EA5E9",
      title: "Quality Promise",
      desc: "Every Fundi maintains a minimum 4.0 rating. Below that, their account is suspended pending review.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Guarantee banner */}
      <div className="bg-gradient-to-r from-kazi-green to-teal-500 rounded-3xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-5 text-white">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 text-3xl">
          🛡️
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-xl font-black mb-1">100% Satisfaction Guarantee</h3>
          <p className="text-white/80 text-sm leading-relaxed">
            Not happy with the service? Contact us within 24 hours and get a full refund. We stand behind every booking on our platform.
          </p>
        </div>
        <div className="flex-shrink-0 bg-white/20 border border-white/30 rounded-2xl px-5 py-3 text-center">
          <p className="text-2xl font-black">100%</p>
          <p className="text-xs font-semibold opacity-80">Money-back</p>
        </div>
      </div>

      {/* Promise cards */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-kazi-dark">The KaziShow Promise</h2>
        <p className="text-gray-500 text-sm mt-1">What happens if something goes wrong? We fix it.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {promises.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="bg-white rounded-2xl p-5 card-shadow border border-gray-50 hover:card-shadow-hover hover:-translate-y-0.5 transition-all group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${p.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: p.color }} />
              </div>
              <h3 className="font-black text-sm text-kazi-dark mb-2">{p.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
