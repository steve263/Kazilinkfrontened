"use client";
import { useState, useEffect } from "react";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function TrustScoreCard() {
  const [trustScore, setTrustScore] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("kazishow_token");
    if (!token) return;
    fetch(`${API_URL}/api/trust/trust-score`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { if (data.success) setTrustScore(data.data); })
      .catch(() => {});
  }, []);

  if (!trustScore) return null;

  const scoreColor =
    trustScore.score >= 75 ? "text-green-500" :
    trustScore.score >= 50 ? "text-amber-500" :
    "text-red-500";

  const scoreBarColor =
    trustScore.score >= 75 ? "bg-green-500" :
    trustScore.score >= 50 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-kazi-orange" />
        <h3 className="font-bold text-kazi-dark">Trust Score</h3>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className={`text-5xl font-black ${scoreColor}`}>{Math.round(trustScore.score)}</div>
        <div>
          <p className="font-bold text-kazi-dark">{trustScore.badge?.label}</p>
          <p className="text-xs text-gray-400">out of 100</p>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${scoreBarColor}`}
          style={{ width: `${trustScore.score}%` }}
        />
      </div>

      <div className="space-y-2 mb-4">
        {[
          { ok: trustScore.verifiedPhone, label: "Phone Verified", pts: "+10 pts" },
          { ok: trustScore.verifiedId,    label: "ID Verified",    pts: "+15 pts" },
          { ok: trustScore.verifiedFace,  label: "Face Verified",  pts: "+10 pts" },
        ].map((item) => (
          <div key={item.label} className={`flex items-center gap-2 text-sm ${item.ok ? "text-green-600" : "text-gray-400"}`}>
            {item.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {item.label} {!item.ok && <span className="text-xs">({item.pts})</span>}
          </div>
        ))}
      </div>

      {trustScore.tips?.length > 0 && (
        <div className="bg-orange-50 rounded-xl p-3">
          <p className="text-xs font-bold text-kazi-orange mb-2">How to improve your score:</p>
          {trustScore.tips.map((tip: string, i: number) => (
            <p key={i} className="text-xs text-gray-600 flex items-start gap-1 mb-1">
              <span>→</span> {tip}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
