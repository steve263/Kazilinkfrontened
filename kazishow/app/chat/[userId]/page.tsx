"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Smile, Paperclip, X,
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import MessageBubble from "@/components/chat/MessageBubble";
import TypingIndicator from "@/components/chat/TypingIndicator";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ─── Emoji picker data ────────────────────────────────────────────────────────

const EMOJI_ROWS = [
  ["😀","😂","😍","😎","🥰","😊","😅","😭","🤔","😤"],
  ["😇","🥳","😱","🤯","😢","😡","😬","🤣","😏","🤗"],
  ["😴","🤩","😮","🥹","😌","🫡","🥲","😲","🤪","😜"],
  ["👍","👎","❤️","🔥","💯","🎉","🙏","💪","👋","✌️"],
  ["🤝","🫶","💕","⭐","🎊","🙌","👏","🤞","💖","😘"],
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string };
}

interface OtherUser {
  id: string;
  name: string;
  isOnline: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const otherId = params.userId as string;

  // ── Chat state ──────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // ── Call state ──────────────────────────────────────────────────────────────
  const [callState, setCallState] = useState<"idle" | "calling" | "connected">("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");

  // ── Refs ────────────────────────────────────────────────────────────────────
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pageRef = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Call refs
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<any>(null);
  const callSecondsRef = useRef(0);

  // ── Socket + init ──────────────────────────────────────────────────────────
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("kazishow_user") || "null");
    if (!user) { router.push("/auth/login"); return; }
    setCurrentUserId(user.id);
    setCurrentUserName(user.name || "");
    setCurrentUserRole(user.role || "");
    tokenRef.current = localStorage.getItem("kazishow_token");

    fetchUserInfo();
    fetchMessages(1, true);

    const socket = io(API, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join", user.id));

    // ── Chat events ──
    socket.on("new_message", (msg: Message) => {
      const relevant =
        (msg.senderId === otherId && msg.receiverId === user.id) ||
        (msg.senderId === user.id && msg.receiverId === otherId);
      if (!relevant) return;
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
      if (msg.senderId === otherId) markAsRead();
      scrollToBottom();
    });

    socket.on("message_deleted", ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    socket.on("message_read", () => {
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    });

    socket.on("user_typing", ({ userId }: { userId: string }) => {
      if (userId === otherId) setIsTyping(true);
    });
    socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
      if (userId === otherId) setIsTyping(false);
    });
    socket.on("user_online", ({ userId }: { userId: string }) => {
      if (userId === otherId) setOtherUser(p => p ? { ...p, isOnline: true } : p);
    });
    socket.on("user_offline", ({ userId }: { userId: string }) => {
      if (userId === otherId) setOtherUser(p => p ? { ...p, isOnline: false } : p);
    });

    // ── Call signaling events (outgoing call side) ──
    socket.on("call_accepted", (data: any) => {
      if (peerRef.current) peerRef.current.signal(data.signal);
    });

    socket.on("call_declined", () => {
      cleanupCall(false);
      toast.error("Call was declined");
    });

    socket.on("call_ended", () => {
      cleanupCall(false);
    });

    return () => {
      socket.disconnect();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      cleanupCall(false);
    };
  }, [otherId]);

  // ── Call duration timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (callState === "connected") {
      callSecondsRef.current = 0;
      callTimerRef.current = setInterval(() => {
        callSecondsRef.current++;
        const m = Math.floor(callSecondsRef.current / 60).toString().padStart(2, "0");
        const s = (callSecondsRef.current % 60).toString().padStart(2, "0");
        setCallDuration(`${m}:${s}`);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
      setCallDuration("00:00");
    }
    return () => clearInterval(callTimerRef.current);
  }, [callState]);

  // ── Chat helpers ─────────────────────────────────────────────────────────────
  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API}/api/messages/user-info/${otherId}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (data.success) setOtherUser(data.data);
    } catch {}
  };

  const fetchMessages = async (p: number, replace = false) => {
    try {
      if (p === 1) setLoading(true); else setLoadingMore(true);
      const prevScrollHeight = scrollRef.current?.scrollHeight || 0;
      const res = await fetch(`${API}/api/messages/${otherId}?page=${p}`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (data.success) {
        const msgs: Message[] = data.data;
        setHasMore(msgs.length === 50);
        setMessages(prev => replace ? msgs : [...msgs, ...prev]);
        if (replace) { setTimeout(scrollToBottom, 100); markAsRead(); }
        else requestAnimationFrame(() => {
          if (scrollRef.current)
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight;
        });
      }
    } catch {}
    finally { setLoading(false); setLoadingMore(false); }
  };

  const markAsRead = useCallback(async () => {
    try {
      await fetch(`${API}/api/messages/${otherId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      socketRef.current?.emit("mark_read", { senderId: otherId });
    } catch {}
  }, [otherId]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && hasMore && !loadingMore) {
      const next = pageRef.current + 1;
      pageRef.current = next;
      fetchMessages(next);
    }
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    if (!socketRef.current) return;
    if (!val.trim()) { socketRef.current.emit("typing_stop", { receiverId: otherId }); return; }
    socketRef.current.emit("typing_start", { receiverId: otherId });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing_stop", { receiverId: otherId });
    }, 1500);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput(""); setShowEmojiPicker(false); setSending(true);
    socketRef.current?.emit("typing_stop", { receiverId: otherId });
    try {
      const res = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ receiverId: otherId, content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.some(m => m.id === data.data.id) ? prev : [...prev, data.data]);
        scrollToBottom();
      }
    } catch {}
    finally { setSending(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const uploadRes = await fetch(`${API}/api/messages/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) return;
      const msgRes = await fetch(`${API}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ receiverId: otherId, content: uploadData.data.url }),
      });
      const msgData = await msgRes.json();
      if (msgData.success) { setMessages(prev => [...prev, msgData.data]); scrollToBottom(); }
    } catch {}
    finally { setSending(false); e.target.value = ""; }
  };

  const handleDelete = useCallback(async (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    try {
      await fetch(`${API}/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
    } catch {}
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    const el = inputRef.current;
    if (!el) { setInput(v => v + emoji); return; }
    const start = el.selectionStart ?? input.length;
    const end = el.selectionEnd ?? input.length;
    const newVal = input.slice(0, start) + emoji + input.slice(end);
    setInput(newVal);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === "Escape") setShowEmojiPicker(false);
  };

  // ── Call helpers ─────────────────────────────────────────────────────────────
  const getDuration = () => {
    const s = callSecondsRef.current;
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const cleanupCall = (emitEnd: boolean) => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (remoteAudioRef.current) { remoteAudioRef.current.pause(); remoteAudioRef.current = null; }
    if (emitEnd) {
      socketRef.current?.emit("end_call", { to: otherId, duration: getDuration() });
    }
    setCallState("idle");
    setIsMuted(false);
    setIsSpeaker(false);
  };

  const startCall = async () => {
    if (callState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { default: SimplePeer } = await import("simple-peer");
      const peer = new SimplePeer({ initiator: true, trickle: false, stream });

      peer.on("signal", (signal: any) => {
        socketRef.current?.emit("call_user", {
          to: otherId,
          from: currentUserId,
          callerName: currentUserName,
          callerRole: currentUserRole,
          callerAvatar: currentUserName?.charAt(0)?.toUpperCase() || "?",
          signal,
        });
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch(() => {});
        remoteAudioRef.current = audio;
        setCallState("connected");
      });

      peer.on("error", () => {
        toast.error("Call connection failed");
        cleanupCall(false);
      });

      peerRef.current = peer;
      setCallState("calling");
    } catch {
      toast.error("Could not access microphone. Please allow permission.");
    }
  };

  const endCall = () => cleanupCall(true);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(p => !p);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
          <div className="w-8 h-8 rounded-xl bg-gray-100 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#FF6B2B] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const receiverAvatar = otherUser?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ── Outgoing call overlay ── */}
      {callState === "calling" && (
        <div className="fixed inset-0 bg-[#1A1714] z-50 flex flex-col items-center justify-center">
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-[#00C896]/10 animate-ping absolute" />
            <div className="w-28 h-28 rounded-full bg-[#00C896]/20 animate-ping absolute [animation-delay:300ms]" />
            <div className="w-28 h-28 rounded-full bg-[#00C896]/10 flex items-center justify-center relative z-10 text-5xl font-black text-white">
              {receiverAvatar}
            </div>
          </div>
          <h2 className="text-white font-black text-2xl mb-2">{otherUser?.name || "..."}</h2>
          <p className="text-white/50 text-sm mb-12">Calling...</p>
          <button
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/40"
          >
            <PhoneOff className="w-7 h-7 text-white" />
          </button>
        </div>
      )}

      {/* ── Active call overlay ── */}
      {callState === "connected" && (
        <div className="fixed inset-0 bg-[#1A1714] z-50 flex flex-col items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-[#00C896]/20 flex items-center justify-center text-5xl mb-6">
            {receiverAvatar}
          </div>
          <h2 className="text-white font-black text-2xl mb-2">{otherUser?.name}</h2>
          <p className="text-[#00C896] font-mono text-lg mb-12">{callDuration}</p>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleMute}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isMuted ? "bg-white text-[#1A1714]" : "bg-white/10 text-white"
                }`}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <span className="text-white/50 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/40"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">End</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setIsSpeaker(p => !p)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isSpeaker ? "bg-white text-[#1A1714]" : "bg-white/10 text-white"
                }`}
              >
                {isSpeaker ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </button>
              <span className="text-white/50 text-xs">Speaker</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1a1714]" />
        </button>

        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-[#FF6B2B] text-lg">
            {receiverAvatar}
          </div>
          {otherUser?.isOnline && (
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#00c896] rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a1714] text-sm truncate">{otherUser?.name || "Chat"}</p>
          <p className={`text-xs font-medium ${otherUser?.isOnline ? "text-[#00c896]" : "text-gray-400"}`}>
            {otherUser?.isOnline ? "Online" : "Offline"}
          </p>
        </div>

        {/* Call button */}
        <button
          onClick={startCall}
          disabled={callState !== "idle"}
          title="Audio Call"
          className="w-10 h-10 rounded-full bg-[#00C896]/10 flex items-center justify-center hover:bg-[#00C896]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Phone className="w-5 h-5 text-[#00C896]" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-3"
        style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf5 50%, #f0ece8 100%)" }}
        onScroll={handleScroll}
        onClick={() => setShowEmojiPicker(false)}
      >
        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="w-5 h-5 border-2 border-[#FF6B2B] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {messages.length === 0 && !loadingMore && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <p className="text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-300 text-xs mt-1">Say hello!</p>
          </div>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            id={msg.id}
            content={msg.content}
            createdAt={msg.createdAt}
            isSent={msg.senderId === currentUserId}
            isRead={msg.isRead}
            onDelete={handleDelete}
          />
        ))}

        {isTyping && <TypingIndicator name={otherUser?.name || "..."} />}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Emoji picker ── */}
      {showEmojiPicker && (
        <div className="bg-white border-t border-gray-100 px-3 pt-2 pb-1 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Emoji</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="space-y-0.5">
            {EMOJI_ROWS.map((row, ri) => (
              <div key={ri} className="flex gap-0.5">
                {row.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="flex-1 text-xl py-1.5 rounded-xl hover:bg-orange-50 active:scale-90 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="flex-shrink-0 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-gray-400 hover:text-[#FF6B2B]">
            <Paperclip className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={sending}
            />
          </label>

          <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowEmojiPicker(false)}
              placeholder="Type a message…"
              className="flex-1 bg-transparent text-sm text-[#1a1714] placeholder-gray-400 outline-none"
              disabled={sending}
            />
            <button
              onClick={e => { e.stopPropagation(); setShowEmojiPicker(v => !v); }}
              className={`flex-shrink-0 transition-colors ${showEmojiPicker ? "text-[#FF6B2B]" : "text-gray-400 hover:text-[#FF6B2B]"}`}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#FF6B2B] rounded-2xl hover:bg-orange-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
