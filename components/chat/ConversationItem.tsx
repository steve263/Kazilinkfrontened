"use client";
import Link from "next/link";

interface Props {
  partnerId: string;
  partnerName: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isFromMe: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function ConversationItem({
  partnerId,
  partnerName,
  isOnline,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isFromMe,
}: Props) {
  const initial = partnerName?.charAt(0)?.toUpperCase() || "?";
  const isUnread = unreadCount > 0;

  return (
    <Link
      href={`/chat/${partnerId}`}
      className="flex items-center gap-3 p-4 bg-white rounded-2xl hover:bg-orange-50 transition-colors active:scale-[0.98] shadow-sm"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-bold text-kazi-orange text-lg">
          {initial}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-kazi-green rounded-full border-2 border-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm truncate ${isUnread ? "font-bold text-kazi-dark" : "font-semibold text-kazi-dark"}`}>
            {partnerName}
          </p>
          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(lastMessageTime)}</span>
        </div>
        <p className={`text-xs truncate ${isUnread ? "font-semibold text-kazi-dark" : "text-gray-500"}`}>
          {isFromMe && <span className="text-gray-400">You: </span>}
          {lastMessage.startsWith("https://") ? "📷 Image" : lastMessage}
        </p>
      </div>

      {/* Unread badge */}
      {isUnread && (
        <div className="flex-shrink-0 min-w-[20px] h-5 bg-kazi-orange rounded-full flex items-center justify-center px-1">
          <span className="text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        </div>
      )}
    </Link>
  );
}
