import Link from "next/link";
import { Gift, Users, ArrowRight } from "lucide-react";

export default function ReferralBanner() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <div className="bg-gradient-to-r from-kazi-amber/20 to-kazi-orange/20 border border-kazi-orange/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-kazi-orange flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="font-black text-kazi-dark text-lg">Invite a friend, both get KSh 150</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Share your invite link. When they book their first service, you both receive KSh 150 credit instantly.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Users className="w-4 h-4 text-kazi-orange" />
            <span>847 referrals this week</span>
          </div>
          <Link
            href="/auth/register"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-kazi-orange text-white text-sm font-bold rounded-2xl hover:bg-orange-600 transition-all active:scale-95 whitespace-nowrap"
          >
            Invite Friends <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
