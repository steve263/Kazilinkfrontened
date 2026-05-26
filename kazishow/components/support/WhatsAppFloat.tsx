"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/lib/settingsContext";

const WA_SVG = (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const WA_ICON_SM = (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366] shrink-0 ml-auto">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);
  const { whatsappNumber } = useSettings();

  const toIntl = (n: string) => "254" + n.replace(/^0/, "").replace(/\D/g, "");

  const AGENTS = [
    {
      id: "K1",
      name: "Kazi Agent K1",
      role: "General Help",
      number: toIntl(whatsappNumber || "0795542312"),
      message: "Hi KaziShow! I need help with your platform.",
      bg: "bg-green-500",
    },
  ];

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-72 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: "#25D366" }}>
            <div>
              <p className="text-white font-semibold text-sm">KaziShow Support</p>
              <p className="text-green-100 text-xs">Available 8AM–8PM EAT</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white hover:text-green-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 space-y-2">
            <p className="text-xs text-gray-500 px-1 pb-1">Choose a support agent:</p>
            {AGENTS.map((agent) => (
              <a
                key={agent.id}
                href={`https://wa.me/${agent.number}?text=${encodeURIComponent(agent.message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <div
                  className={`w-10 h-10 rounded-full ${agent.bg} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {agent.id}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500">{agent.role}</p>
                </div>
                {WA_ICON_SM}
              </a>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform"
        style={{ backgroundColor: "#25D366" }}
        aria-label="WhatsApp Support"
      >
        {open ? <X className="w-6 h-6 text-white" /> : WA_SVG}
      </button>
    </div>
  );
}
