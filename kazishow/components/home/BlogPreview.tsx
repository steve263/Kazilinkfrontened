import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

const POSTS = [
  {
    tag: "Hiring Guide",
    tagColor: "#FF6B2B",
    title: "How to hire a reliable Fundi in Nairobi (without getting scammed)",
    excerpt: "7 red flags to watch for, and the one question that separates real professionals from chancers.",
    readTime: "5 min read",
    emoji: "🔧",
    bg: "#FF6B2B",
  },
  {
    tag: "Tips",
    tagColor: "#0EA5E9",
    title: "5 signs of a good house cleaner before they arrive",
    excerpt: "From response time to pricing transparency — what professional cleaners do differently.",
    readTime: "3 min read",
    emoji: "🧹",
    bg: "#0EA5E9",
  },
  {
    tag: "Pricing",
    tagColor: "#00C896",
    title: "What a plumber should charge in Nairobi in 2025",
    excerpt: "We surveyed 200+ plumbers and 500+ customers. Here's the honest market breakdown.",
    readTime: "4 min read",
    emoji: "🪛",
    bg: "#00C896",
  },
];

export default function BlogPreview() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-kazi-dark">Tips &amp; Guides</h2>
          <p className="text-sm text-gray-400 mt-0.5">Expert advice from the KaziShow team</p>
        </div>
        <Link href="#" className="flex items-center gap-1 text-sm text-kazi-orange font-semibold hover:gap-2 transition-all">
          View all <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {POSTS.map((post) => (
          <Link key={post.title} href="#" className="group bg-white rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover hover:-translate-y-0.5 transition-all">
            <div
              className="h-36 flex items-center justify-center text-6xl"
              style={{ background: `linear-gradient(135deg, ${post.bg}20 0%, ${post.bg}10 100%)` }}
            >
              {post.emoji}
            </div>
            <div className="p-4">
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: post.tagColor }}
              >
                {post.tag}
              </span>
              <h3 className="font-black text-sm text-kazi-dark mt-2 mb-1.5 leading-snug group-hover:text-kazi-orange transition-colors">
                {post.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{post.excerpt}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                {post.readTime}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
