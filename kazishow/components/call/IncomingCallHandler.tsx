"use client";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface IncomingCallData {
  from: string;
  callerName: string;
  callerRole: string;
  callerAvatar: string;
  signal: any;
}

export default function IncomingCallHandler() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [callState, setCallState] = useState<"idle" | "connected">("idle");
  const [connectedCaller, setConnectedCaller] = useState<{ name: string; avatar: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<any>(null);
  const callSecondsRef = useRef(0);
  const ringtoneCtxRef = useRef<AudioContext | null>(null);
  const callerIdRef = useRef<string>("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("kazishow_user") || "null");
    if (!user) return;

    const socket = io(API, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join", user.id));

    socket.on("incoming_call", (data: IncomingCallData) => {
      callerIdRef.current = data.from;
      setIncomingCall(data);
      startRingtone();
    });

    socket.on("call_ended", () => {
      stopRingtone();
      cleanupCall(false);
    });

    return () => {
      socket.disconnect();
      stopRingtone();
      cleanupCall(false);
    };
  }, []);

  // Call duration timer
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

  const startRingtone = () => {
    try {
      const ctx = new AudioContext();
      ringtoneCtxRef.current = ctx;
      for (let i = 0; i < 40; i++) {
        const t = ctx.currentTime + i * 0.7;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = i % 2 === 0 ? 440 : 480;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.start(t);
        osc.stop(t + 0.5);
      }
    } catch {}
  };

  const stopRingtone = () => {
    if (ringtoneCtxRef.current) {
      try { ringtoneCtxRef.current.close(); } catch {}
      ringtoneCtxRef.current = null;
    }
  };

  const getDuration = () => {
    const s = callSecondsRef.current;
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const cleanupCall = (emitEnd: boolean) => {
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (remoteAudioRef.current) { remoteAudioRef.current.pause(); remoteAudioRef.current = null; }
    if (emitEnd && callerIdRef.current) {
      socketRef.current?.emit("end_call", { to: callerIdRef.current, duration: getDuration() });
    }
    callerIdRef.current = "";
    setCallState("idle");
    setIncomingCall(null);
    setConnectedCaller(null);
    setIsMuted(false);
    setIsSpeaker(false);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setConnectedCaller({ name: incomingCall.callerName, avatar: incomingCall.callerAvatar });

      const { default: SimplePeer } = await import("simple-peer");
      const peer = new SimplePeer({ initiator: false, trickle: false, stream });

      peer.on("signal", (signal: any) => {
        socketRef.current?.emit("accept_call", { to: incomingCall.from, signal });
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

      peer.signal(incomingCall.signal);
      peerRef.current = peer;
      setIncomingCall(null);
    } catch {
      toast.error("Could not access microphone. Please allow permission.");
      stopRingtone();
      socketRef.current?.emit("decline_call", { to: incomingCall.from });
      setIncomingCall(null);
    }
  };

  const declineCall = () => {
    stopRingtone();
    socketRef.current?.emit("decline_call", { to: incomingCall?.from });
    setIncomingCall(null);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(p => !p);
    }
  };

  if (!incomingCall && callState !== "connected") return null;

  return (
    <div className="fixed inset-0 bg-[#1A1714] z-[9999] flex flex-col items-center justify-center px-6">

      {/* ── Incoming call ── */}
      {incomingCall && (
        <>
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-[#FF6B2B]/20 animate-ping absolute" />
            <div className="w-28 h-28 rounded-full bg-[#FF6B2B]/10 animate-ping absolute [animation-delay:300ms]" />
            <div className="w-28 h-28 rounded-full bg-[#FF6B2B]/10 flex items-center justify-center relative z-10 text-5xl font-black text-white">
              {incomingCall.callerAvatar}
            </div>
          </div>

          <h2 className="text-white font-black text-2xl mb-1">{incomingCall.callerName}</h2>
          <p className="text-white/50 text-sm mb-2">Incoming audio call...</p>
          <span className="text-xs text-white/30 bg-white/10 px-3 py-1 rounded-full mb-12">
            {incomingCall.callerRole}
          </span>

          <div className="flex items-center gap-16">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={declineCall}
                className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/40 animate-bounce"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-[#00C896] flex items-center justify-center shadow-lg shadow-green-500/40 animate-bounce"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
              <span className="text-white/50 text-xs">Accept</span>
            </div>
          </div>
        </>
      )}

      {/* ── Active call ── */}
      {callState === "connected" && connectedCaller && (
        <>
          <div className="w-28 h-28 rounded-full bg-[#00C896]/20 flex items-center justify-center text-5xl mb-6">
            {connectedCaller.avatar}
          </div>

          <h2 className="text-white font-black text-2xl mb-2">{connectedCaller.name}</h2>
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
                onClick={() => cleanupCall(true)}
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
        </>
      )}
    </div>
  );
}
