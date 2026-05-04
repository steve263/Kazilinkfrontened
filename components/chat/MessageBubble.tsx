"use client";
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, CheckCheck, Trash2, Copy } from "lucide-react";

interface Props {
  id: string;
  content: string;
  createdAt: string;
  isSent: boolean;
  isRead: boolean;
  onDelete: (id: string) => void;
}

interface MenuAnchor {
  top: number;
  left?: number;
  right?: number;
}

export default function MessageBubble({ id, content, createdAt, isSent, isRead, onDelete }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [anchor, setAnchor] = useState<MenuAnchor>({ top: 0 });
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const isImage = content.startsWith("https://res.cloudinary.com");
  const time = new Date(createdAt).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const openMenu = () => {
    const rect = bubbleRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAnchor({
      top: rect.top,
      ...(isSent ? { right: window.innerWidth - rect.right } : { left: rect.left }),
    });
    setShowMenu(true);
  };

  const closeMenu = () => setShowMenu(false);

  const startPress = () => {
    pressTimer.current = setTimeout(openMenu, 480);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(content).catch(() => {});
    closeMenu();
  };

  const handleDelete = () => {
    closeMenu();
    onDelete(id);
  };

  return (
    <>
      <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1 px-1`}>
        <div
          ref={bubbleRef}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onContextMenu={(e) => { e.preventDefault(); openMenu(); }}
          className={`
            max-w-[75vw] sm:max-w-xs px-3 py-2 shadow-sm select-none cursor-pointer
            ${isSent
              ? "bg-[#FF6B2B] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm"
              : "bg-white text-[#1a1714] rounded-t-2xl rounded-br-2xl rounded-bl-sm"
            }
          `}
        >
          {isImage ? (
            <img src={content} alt="attachment" className="max-w-full rounded-xl mb-1" />
          ) : (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>
          )}

          <div className={`flex items-center justify-end gap-1 mt-0.5 ${isSent ? "text-white/60" : "text-gray-400"}`}>
            <span className="text-[10px]">{time}</span>
            {isSent && (
              isRead
                ? <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                : <Check className="w-3.5 h-3.5 opacity-70" />
            )}
          </div>
        </div>
      </div>

      {/* Render menu at document.body to escape scroll containers and z-index stacks */}
      {showMenu && typeof window !== "undefined" && createPortal(
        <>
          {/* Full-screen backdrop — click anywhere outside to dismiss */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={closeMenu}
          />

          {/* Context menu */}
          <div
            style={{
              position: "fixed",
              zIndex: 9999,
              top: anchor.top,
              left: anchor.left,
              right: anchor.right,
              transform: "translateY(calc(-100% - 8px))",
              minWidth: 150,
            }}
            className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            {!isImage && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Copy text
              </button>
            )}
            {isSent && (
              <>
                {!isImage && <div className="h-px bg-gray-100 mx-3" />}
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 flex-shrink-0" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
