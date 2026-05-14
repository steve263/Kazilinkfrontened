"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, RotateCcw, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { Socket } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
  ],
};

type CallStatus = "calling" | "ringing" | "connected" | "ended" | "rejected";

interface Props {
  socket: Socket;
  currentUserId: string;
  currentUserName: string;
  currentUserPhoto?: string | null;
  targetUserId: string;
  targetUserName: string;
  targetUserPhoto?: string | null;
  isInitiator: boolean;
  initialSignal?: any;
  onClose: () => void;
}

export default function VideoCall({
  socket,
  currentUserId,
  currentUserName,
  currentUserPhoto,
  targetUserId,
  targetUserName,
  targetUserPhoto,
  isInitiator,
  initialSignal,
  onClose,
}: Props) {
  const [callStatus, setCallStatus] = useState<CallStatus>(isInitiator ? "calling" : "ringing");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cleanedUpRef = useRef(false);

  const cleanup = useCallback((notify: boolean) => {
    if (cleanedUpRef.current) return;
    cleanedUpRef.current = true;

    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    if (peerRef.current) {
      try { peerRef.current.destroy(); } catch {}
      peerRef.current = null;
    }

    if (notify) socket.emit("video_call_ended", { to: targetUserId });

    setCallStatus("ended");
    setTimeout(onClose, 800);
  }, [socket, targetUserId, onClose]);

  // Listen for remote signaling events
  useEffect(() => {
    const onAnswered = ({ signal }: any) => {
      if (peerRef.current) peerRef.current.signal(signal);
    };
    const onEnded = () => cleanup(false);
    const onRejected = () => {
      setCallStatus("rejected");
      setTimeout(onClose, 1500);
    };

    socket.on("video_call_answered", onAnswered);
    socket.on("video_call_ended", onEnded);
    socket.on("video_call_rejected", onRejected);

    return () => {
      socket.off("video_call_answered", onAnswered);
      socket.off("video_call_ended", onEnded);
      socket.off("video_call_rejected", onRejected);
    };
  }, [socket, cleanup, onClose]);

  // Initialize media + peer
  useEffect(() => {
    let mounted = true;

    const start = async () => {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 44100,
          },
          video: { facingMode },
        });
      } catch (err: any) {
        toast.error("Cannot access camera/microphone: " + (err.message || "Permission denied"));
        if (mounted) { setCallStatus("ended"); setTimeout(onClose, 1000); }
        return;
      }

      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // CRITICAL: prevents local echo
      }

      const { default: SimplePeer } = await import("simple-peer");
      const peer = new SimplePeer({ initiator: isInitiator, trickle: false, stream, config: ICE_SERVERS });

      peer.on("signal", (signal: any) => {
        if (isInitiator) {
          socket.emit("video_call_offer", {
            to: targetUserId,
            from: currentUserId,
            fromName: currentUserName,
            fromPhoto: currentUserPhoto,
            signal,
          });
        } else {
          socket.emit("video_call_answer", { to: targetUserId, signal });
        }
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false; // CRITICAL: must not be muted
          remoteVideoRef.current.play().catch(() => {});
        }
        if (mounted) {
          setCallStatus("connected");
          timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
        }
      });

      peer.on("connect", () => { if (mounted) setCallStatus("connected"); });
      peer.on("error", () => { if (mounted) cleanup(false); });
      peer.on("close", () => cleanup(false));

      peerRef.current = peer;

      // Non-initiator feeds the received offer into the peer
      if (!isInitiator && initialSignal) {
        peer.signal(initialSignal);
      }
    };

    start();
    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const endCall = () => cleanup(true);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
      setIsMuted(p => !p);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = isVideoOff; });
      setIsVideoOff(p => !p);
    }
  };

  const flipCamera = async () => {
    if (!localStreamRef.current || !peerRef.current) return;
    const newFacing = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacing);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: newFacing },
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (!newTrack) return;

      const old = localStreamRef.current.getVideoTracks()[0];
      if (old) { localStreamRef.current.removeTrack(old); old.stop(); }
      localStreamRef.current.addTrack(newTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;

      const pc = peerRef.current._pc as RTCPeerConnection | undefined;
      const sender = pc?.getSenders().find(s => s.track?.kind === "video");
      if (sender) await sender.replaceTrack(newTrack);
    } catch {}
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const statusLabel: Record<CallStatus, string> = {
    calling: "Calling...",
    ringing: "Connecting...",
    connected: fmt(callSeconds),
    ended: "Call ended",
    rejected: "Call rejected",
  };

  const targetInitial = targetUserName?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Remote video — full screen */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Waiting placeholder */}
      {callStatus !== "connected" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="w-28 h-28 rounded-full bg-kazi-orange/20 flex items-center justify-center mb-4 overflow-hidden">
            {targetUserPhoto
              ? <img src={targetUserPhoto} className="w-full h-full object-cover" alt="" />
              : <span className="text-5xl font-black text-white">{targetInitial}</span>
            }
          </div>
          <h2 className="text-white font-black text-2xl mb-2">{targetUserName}</h2>
          <p className="text-white/60 text-sm animate-pulse">{statusLabel[callStatus]}</p>
          {(callStatus === "calling" || callStatus === "ringing") && (
            <div className="mt-4 flex gap-2">
              <div className="w-2 h-2 bg-kazi-orange rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-2 h-2 bg-kazi-orange rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-2 h-2 bg-kazi-orange rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-kazi-orange flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="text-white text-xs font-black tracking-tight">
            Kazi<span className="text-kazi-orange">Show</span>
          </span>
        </div>
        {callStatus === "connected" && (
          <div className="bg-black/40 px-3 py-1 rounded-full">
            <span className="text-white font-mono text-sm">{fmt(callSeconds)}</span>
          </div>
        )}
      </div>

      {/* Local PiP — top-right, always muted */}
      <div className="absolute top-20 right-4 z-20 w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-gray-800">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {isVideoOff && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-white/40" />
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 inset-x-0 z-10 pb-10 flex flex-col items-center gap-4">
        {callStatus === "connected" && (
          <p className="text-white/60 text-xs">{targetUserName}</p>
        )}

        <div className="flex items-center gap-5">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? "bg-white text-gray-900" : "bg-white/20 text-white"
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <span className="text-white/60 text-xs">{isMuted ? "Unmute" : "Mute"}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <span className="text-white/60 text-xs">End</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isVideoOff ? "bg-white text-gray-900" : "bg-white/20 text-white"
              }`}
            >
              {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
            <span className="text-white/60 text-xs">{isVideoOff ? "Camera" : "Camera"}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <button
              onClick={flipCamera}
              className="w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
            <span className="text-white/60 text-xs">Flip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
