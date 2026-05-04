"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Props {
  postId: string;
  token: string | null;
  userName: string;
  onClose: () => void;
}

export default function CommentsSheet({ postId, token, userName, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API}/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setComments(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function handleSubmit() {
    if (!text.trim() || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: text.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setComments((prev) => [...prev, data.data]);
        setText("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl w-full max-w-lg h-[70vh] flex flex-col">
        {/* Handle */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-kazi-dark">Comments</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-kazi-orange border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && comments.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No comments yet. Be the first!
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-bold text-kazi-orange">
                  {c.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-kazi-dark">{c.user.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-gray-100">
          {token ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex-shrink-0 flex items-center justify-center">
                <span className="text-xs font-bold text-kazi-orange">
                  {userName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent text-sm outline-none text-kazi-dark placeholder:text-gray-400"
                />
                {text.trim() && (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="text-kazi-orange"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-1">
              Log in to comment
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
