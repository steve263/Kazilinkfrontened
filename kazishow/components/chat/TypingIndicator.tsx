"use client";

export default function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <div className="flex items-center gap-2 bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <span className="text-xs text-gray-500">{name} is typing</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
