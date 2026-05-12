"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Smile } from "lucide-react";
import toast from "react-hot-toast";

const EMOJIS = [
  "😀","😂","😍","🥰","😎","🤔","😭","😤","🤣","😊",
  "👍","👎","❤️","🙌","👏","🔥","✨","💯","🎉","👌",
  "💪","🤝","🌟","😅","🥳","😬","🤩","😴","🥺","🫡",
  "🙈","💀","👀","🫶","💔","😱","🤯","😏","🥲","🤑",
];

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; profilePhoto: string | null };
}

interface CommentsSheetProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function CommentsSheet({ videoId, isOpen, onClose }: CommentsSheetProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojis(false);
      }
    }
    if (showEmojis) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    if (!el) { setText((t) => t + emoji); return; }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  }

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`${API}/api/videos/${videoId}/comments`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setComments(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, videoId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const token = localStorage.getItem("kazishow_token");
    if (!token) { toast.error("Login to comment"); return; }

    setPosting(true);
    try {
      const res = await fetch(`${API}/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [data.data, ...prev]);
        setText("");
      } else {
        toast.error(data.message || "Failed to post comment");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-3xl max-h-[75vh] flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-white font-black text-base">Comments</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No comments yet. Be the first!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-kazi-orange flex-shrink-0 flex items-center justify-center text-white text-xs font-black">
                {c.user.profilePhoto
                  ? <img src={c.user.profilePhoto} className="w-full h-full rounded-full object-cover" alt="" />
                  : c.user.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-xs font-bold">{c.user.name}</span>
                  <span className="text-gray-500 text-[10px]">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-gray-300 text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-white/10">
          {/* Emoji picker */}
          {showEmojis && (
            <div ref={emojiRef} className="mb-2 bg-gray-800 border border-white/10 rounded-2xl p-3 grid grid-cols-8 gap-1">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="text-xl leading-none p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={submit} className="flex gap-2">
            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => setShowEmojis((s) => !s)}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${showEmojis ? "bg-kazi-orange text-white" : "bg-white/10 text-gray-400 hover:text-white hover:bg-white/20"}`}
            >
              <Smile className="w-4 h-4" />
            </button>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-kazi-orange"
            />
            <button
              type="submit"
              disabled={posting || !text.trim()}
              className="flex-shrink-0 p-2.5 bg-kazi-orange rounded-xl text-white disabled:opacity-50 transition-all hover:bg-orange-600"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
