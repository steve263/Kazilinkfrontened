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
  const [callState, setCallState] = useState<"idle" | "connected" | "failed">("idle");
  const [callError, setCallError] = useState<string | null>(null);
  const [connectedCaller, setConnectedCaller] = useState<{ name: string; avatar: string } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00");

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // DOM audio element for remote stream — browser AEC works better with a real DOM element
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const callTimerRef = useRef<any>(null);
  const callSecondsRef = useRef(0);

  // Ringtone refs
  const ringtoneAudioRef = useRef<HTMLAudioElement | null>(null);   // custom URL ringtone
  const ringtoneCtxRef = useRef<AudioContext | null>(null);          // synthesized ringtone
  const ringtoneIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // loop interval

  const callerIdRef = useRef<string>("");
  // Queue ICE candidates that arrive before the user taps Accept (peerRef is still null).
  // Draining them after peer creation ensures no candidates are lost.
  const iceCandidateQueueRef = useRef<any[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("kazishow_user") || "null");
    if (!user) return;

    const socket = io(API, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join", user.id));

    socket.on("incoming_call", (data: IncomingCallData) => {
      callerIdRef.current = data.from;
      setIncomingCall(data);
      startRingtone();
    });

    socket.on("ice_candidate", (data: any) => {
      if (peerRef.current) {
        peerRef.current.signal(data.candidate);
      } else {
        // Peer not created yet (waiting for Accept) — queue for later
        iceCandidateQueueRef.current.push(data.candidate);
      }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // ── STUN / TURN servers ────────────────────────────────────────────────────
  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
      { urls: "turn:openrelay.metered.ca:80",              username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443",             username: "openrelayproject", credential: "openrelayproject" },
      { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    ],
  };

  // ── Microphone helper ──────────────────────────────────────────────────────
  const getMicrophone = async (): Promise<MediaStream | null> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100, channelCount: 1 },
        video: false,
      });
    } catch (err: any) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied. Please allow microphone access.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        toast.error("No microphone found on this device.");
      } else if (err.name === "NotReadableError") {
        toast.error("Microphone is in use by another app. Close it and try again.");
      } else {
        toast.error("Cannot access microphone: " + (err.message || "Unknown error"));
      }
      return null;
    }
  };

  // ── Ringtone ────────────────────────────────────────────────────────────────

  const startRingtone = () => {
    // Use custom ringtone URL if the user set one
    const customUrl = typeof window !== "undefined"
      ? localStorage.getItem("kazishow_ringtone_url")
      : null;

    if (customUrl) {
      try {
        const audio = new Audio(customUrl);
        audio.loop = true;
        audio.volume = 0.8;
        audio.play().catch(() => {});
        ringtoneAudioRef.current = audio;
      } catch {}
      return;
    }

    // Synthesized two-tone ring pattern, looping via setInterval
    try {
      const ctx = new AudioContext();
      ringtoneCtxRef.current = ctx;

      const scheduleBatch = () => {
        const c = ringtoneCtxRef.current;
        if (!c || c.state === "closed") return;
        const now = c.currentTime;
        [
          { delay: 0,   freq: 440 },
          { delay: 0.3, freq: 480 },
        ].forEach(({ delay, freq }) => {
          try {
            const osc = c.createOscillator();
            const gain = c.createGain();
            osc.connect(gain);
            gain.connect(c.destination);
            osc.frequency.value = freq;
            const t = now + delay;
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.start(t);
            osc.stop(t + 0.25);
          } catch {}
        });
      };

      scheduleBatch();
      // Repeat every 1.5 s — keeps ringing indefinitely until stopRingtone()
      ringtoneIntervalRef.current = setInterval(scheduleBatch, 1500);
    } catch {}
  };

  const stopRingtone = () => {
    // Stop custom audio
    if (ringtoneAudioRef.current) {
      ringtoneAudioRef.current.pause();
      ringtoneAudioRef.current.currentTime = 0;
      ringtoneAudioRef.current = null;
    }
    // Stop looping interval
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
      ringtoneIntervalRef.current = null;
    }
    // Close AudioContext — kills any still-scheduled oscillators immediately
    if (ringtoneCtxRef.current) {
      try { ringtoneCtxRef.current.close(); } catch {}
      ringtoneCtxRef.current = null;
    }
  };

  // ── Call helpers ─────────────────────────────────────────────────────────────

  const getDuration = () => {
    const s = callSecondsRef.current;
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  };

  const cleanupCall = (emitEnd: boolean) => {
    iceCandidateQueueRef.current = [];
    if (peerRef.current) { peerRef.current.destroy(); peerRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => { t.stop(); }); streamRef.current = null; }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.pause();
      remoteAudioElRef.current.srcObject = null;
    }
    if (emitEnd && callerIdRef.current) {
      socketRef.current?.emit("end_call", { to: callerIdRef.current, duration: getDuration() });
    }
    callerIdRef.current = "";
    setCallState("idle");
    setCallError(null);
    setIncomingCall(null);
    setConnectedCaller(null);
    setIsMuted(false);
    setIsSpeaker(false);
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    stopRingtone();
    setCallError(null);
    const callFrom = incomingCall.from;
    const callSignal = incomingCall.signal;

    const stream = await getMicrophone();
    if (!stream) {
      socketRef.current?.emit("decline_call", { to: callFrom });
      setIncomingCall(null);
      return;
    }
    streamRef.current = stream;
    setConnectedCaller({ name: incomingCall.callerName, avatar: incomingCall.callerAvatar });

    try {
      const { default: SimplePeer } = await import("simple-peer");
      const peer = new SimplePeer({ initiator: false, trickle: true, stream, config: ICE_SERVERS });

      peer.on("signal", (signal: any) => {
        if (signal.type === "answer") {
          socketRef.current?.emit("accept_call", { to: callFrom, signal });
        } else {
          socketRef.current?.emit("ice_candidate", { to: callFrom, candidate: signal });
        }
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        if (remoteAudioElRef.current) {
          remoteAudioElRef.current.srcObject = remoteStream;
          remoteAudioElRef.current.play().catch((e) => console.warn("Audio play blocked:", e));
        }
        setCallState("connected");
      });

      peer.on("connect", () => {
        console.log("✅ Peer connected");
        setCallState("connected");
      });

      peer.on("error", (err: any) => {
        console.error("❌ Peer error:", err);
        setCallError("Call connection failed. Check your internet and try again.");
        setCallState("failed");
        cleanupCall(false);
      });

      peer.on("close", () => cleanupCall(false));

      // Signal the offer, then drain any queued ICE candidates
      peer.signal(callSignal);
      iceCandidateQueueRef.current.forEach(c => { try { peer.signal(c); } catch {} });
      iceCandidateQueueRef.current = [];
      peerRef.current = peer;
      setIncomingCall(null);
    } catch (err: any) {
      console.error("acceptCall error:", err);
      setCallError("Failed to accept call: " + (err.message || "Unknown error"));
      setCallState("failed");
      socketRef.current?.emit("decline_call", { to: callFrom });
      setIncomingCall(null);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
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

  // Always render — the <audio> element must stay mounted from the moment
  // the component loads so remoteAudioElRef.current is never null when the
  // peer stream arrives. The overlay is shown conditionally inside.
  return (
    <>
      {/*
        Keep this <audio> ALWAYS in the DOM (outside any conditional).
        If it unmounts between setIncomingCall(null) and peer.on("stream"),
        remoteAudioElRef.current becomes null and neither side hears anything.
      */}
      <audio ref={remoteAudioElRef} autoPlay playsInline style={{ display: "none" }} />

      {!incomingCall && callState !== "connected" && callState !== "failed" ? null : (
      <div className="fixed inset-0 bg-[#1A1714] z-[9999] flex flex-col items-center justify-center px-6">

      {/* ── Failed state ── */}
      {callState === "failed" && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <span className="text-4xl">📵</span>
          </div>
          <h2 className="text-white font-black text-2xl mb-2">Call Failed</h2>
          <p className="text-white/50 text-sm text-center mb-8 max-w-xs">
            {callError || "Could not connect. Check your internet and try again."}
          </p>
          <button
            onClick={() => { setCallState("idle"); setCallError(null); }}
            className="w-full max-w-xs py-4 bg-kazi-orange text-white font-bold rounded-2xl mb-3 hover:bg-orange-600 transition-colors active:scale-95"
          >
            Close
          </button>
        </>
      )}

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
      )}
    </>
  );
}
