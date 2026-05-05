"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, MessageSquare } from "lucide-react";
import { io, Socket } from "socket.io-client";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ConversationItem from "@/components/chat/ConversationItem";

interface Conversation {
  partner: { id: string; name: string; isOnline: boolean };
  lastMessage: { senderId: string; content: string; createdAt: string };
  unreadCount: number;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ChatListPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("kazishow_user") || "null");
    if (!user) { router.push("/auth/login"); return; }

    setUserId(user.id);
    tokenRef.current = localStorage.getItem("kazishow_token");
    fetchConversations();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
    const socket = io(API_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join", user.id));
    socket.on("new_message", () => fetchConversations());
    socket.on("message_read", () => fetchConversations());
    socket.on("user_online", ({ userId: uid }: { userId: string }) => {
      setConversations((prev) =>
        prev.map((c) => c.partner.id === uid ? { ...c, partner: { ...c.partner, isOnline: true } } : c)
      );
    });
    socket.on("user_offline", ({ userId: uid }: { userId: string }) => {
      setConversations((prev) =>
        prev.map((c) => c.partner.id === uid ? { ...c, partner: { ...c.partner, isOnline: false } } : c)
      );
    });

    return () => { socket.disconnect(); };
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
      const data = await res.json();
      if (data.success) setConversations(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  const filtered = conversations.filter((c) =>
    c.partner.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-kazi-cream">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-28">
        <h1 className="text-2xl font-black text-kazi-dark mb-5">Messages</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl text-sm border border-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-kazi-orange"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white rounded-2xl animate-pulse shadow-sm" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-kazi-orange" />
            </div>
            <p className="font-bold text-kazi-dark text-lg mb-1">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-sm text-gray-400">
              {search ? "Try a different name" : "Book a service to start chatting!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((conv) => (
              <ConversationItem
                key={conv.partner.id}
                partnerId={conv.partner.id}
                partnerName={conv.partner.name}
                isOnline={conv.partner.isOnline}
                lastMessage={conv.lastMessage.content}
                lastMessageTime={conv.lastMessage.createdAt}
                unreadCount={conv.unreadCount}
                isFromMe={conv.lastMessage.senderId === userId}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
