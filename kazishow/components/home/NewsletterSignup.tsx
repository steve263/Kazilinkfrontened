"use client";
import { useState } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-4 pb-12">
      <div className="bg-gradient-to-br from-kazi-dark to-kazi-dark2 rounded-3xl p-8 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/4 w-48 h-48 bg-kazi-orange/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-kazi-amber/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-kazi-orange/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-7 h-7 text-kazi-orange" />
          </div>

          {!done ? (
            <>
              <h2 className="text-2xl font-black text-white mb-2">Get KSh 300 off your first booking</h2>
              <p className="text-white/50 text-sm mb-6">
                Subscribe to our weekly digest — exclusive deals, new providers, and Nairobi service tips.
              </p>
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-white/40 text-sm outline-none focus:border-kazi-orange"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-kazi-orange text-white font-bold rounded-2xl hover:bg-orange-600 transition-all flex items-center gap-1.5 text-sm active:scale-95"
                >
                  Subscribe <ArrowRight className="w-4 h-4" />
                </button>
              </form>
              <p className="text-white/30 text-xs mt-3">No spam. Unsubscribe anytime.</p>
            </>
          ) : (
            <div className="py-4">
              <CheckCircle className="w-12 h-12 text-kazi-green mx-auto mb-3" fill="#00C896" />
              <h3 className="text-xl font-black text-white mb-1">You're in! 🎉</h3>
              <p className="text-white/50 text-sm">
                Your KSh 300 discount code will arrive shortly at <span className="text-kazi-orange font-semibold">{email}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
