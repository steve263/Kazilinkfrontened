"use client";
import { useState } from "react";
import { Calculator } from "lucide-react";

const SERVICES: Record<string, Record<string, [number, number]>> = {
  "Plumbing": {
    "Westlands / Karen / Kilimani": [2000, 5000],
    "Kasarani / Ruaka / Roysambu": [1500, 3500],
    "Eastleigh / Mathare / Huruma": [1000, 2500],
    "CBD / Industrial Area": [1500, 4000],
  },
  "Electrical": {
    "Westlands / Karen / Kilimani": [2500, 6000],
    "Kasarani / Ruaka / Roysambu": [1800, 4000],
    "Eastleigh / Mathare / Huruma": [1200, 3000],
    "CBD / Industrial Area": [2000, 5000],
  },
  "Cleaning (2BR)": {
    "Westlands / Karen / Kilimani": [2000, 4000],
    "Kasarani / Ruaka / Roysambu": [1500, 3000],
    "Eastleigh / Mathare / Huruma": [800, 2000],
    "CBD / Industrial Area": [1500, 3000],
  },
  "Carpentry": {
    "Westlands / Karen / Kilimani": [3000, 8000],
    "Kasarani / Ruaka / Roysambu": [2000, 6000],
    "Eastleigh / Mathare / Huruma": [1500, 4000],
    "CBD / Industrial Area": [2500, 7000],
  },
  "Painting (1 room)": {
    "Westlands / Karen / Kilimani": [4000, 9000],
    "Kasarani / Ruaka / Roysambu": [3000, 7000],
    "Eastleigh / Mathare / Huruma": [2000, 5000],
    "CBD / Industrial Area": [3500, 8000],
  },
  "Salon (hair)": {
    "Westlands / Karen / Kilimani": [500, 3000],
    "Kasarani / Ruaka / Roysambu": [300, 1500],
    "Eastleigh / Mathare / Huruma": [200, 1000],
    "CBD / Industrial Area": [400, 2000],
  },
};

const LOCATIONS = [
  "Westlands / Karen / Kilimani",
  "Kasarani / Ruaka / Roysambu",
  "Eastleigh / Mathare / Huruma",
  "CBD / Industrial Area",
];

export default function CostCalculator() {
  const [service, setService] = useState("Plumbing");
  const [location, setLocation] = useState(LOCATIONS[0]);

  const range = SERVICES[service]?.[location] ?? [0, 0];
  const [low, high] = range;

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-3xl p-8 card-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-kazi-orange/10 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-kazi-orange" />
          </div>
          <div>
            <h2 className="text-xl font-black text-kazi-dark">Service Cost Estimator</h2>
            <p className="text-sm text-gray-400">How much should a service cost in Nairobi?</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Service Type</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-kazi-dark outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
            >
              {Object.keys(SERVICES).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Your Area</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm text-kazi-dark outline-none focus:ring-2 focus:ring-kazi-orange focus:border-transparent"
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Result */}
        <div className="bg-gradient-to-r from-kazi-orange/10 to-kazi-amber/10 rounded-2xl p-5 border border-kazi-orange/20">
          <p className="text-xs text-gray-500 mb-1">Typical market rate for <strong>{service}</strong> in <strong>{location.split("/")[0].trim()}</strong></p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-kazi-dark">
              KSh {low.toLocaleString()} – {high.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Prices vary based on complexity, materials, and experience. On KaziShow, providers must display upfront pricing before you confirm.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-kazi-green animate-pulse" />
            <p className="text-xs text-kazi-green font-semibold">
              KaziShow locks in the price before booking — no surprises
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Based on aggregated booking data from 2,000+ jobs across Nairobi
        </p>
      </div>
    </section>
  );
}
