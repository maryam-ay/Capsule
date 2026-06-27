/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Capsule } from "../types";
import { getCapsuleColorClasses } from "../utils/storage";
import { getGiftCapsule } from "../utils/firebaseStorage";
import CapsuleDesk from "./CapsuleDesk";
import { Mail, Gift, ShieldAlert, ArrowRight, Lock, BookOpen } from "lucide-react";

interface GiftLandingProps {
  giftId: string;
  capsules: Capsule[];
  onUpdateCapsule: (updated: Capsule) => void;
  onGoToLibrary: () => void;
}

export default function GiftLanding({ giftId, capsules, onUpdateCapsule, onGoToLibrary }: GiftLandingProps) {
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isEnvelopeOpened, setIsEnvelopeOpened] = useState(false);
  const [isTearOpenPlaying, setIsTearOpenPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSharedGift() {
      setLoading(true);
      try {
        const doc = await getGiftCapsule(giftId);
        if (doc) {
          setCapsule(doc);
        } else {
          // Fallback to local capsules
          const found = capsules.find((c) => c.id === giftId);
          if (found) {
            setCapsule(found);
          }
        }
      } catch (e) {
        console.error("Error loading shared gift from Firestore:", e);
        const found = capsules.find((c) => c.id === giftId);
        if (found) {
          setCapsule(found);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSharedGift();
  }, [giftId, capsules]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1614] text-[#F2EFE9] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#C5A059]/30 border-t-[#C5A059] animate-spin mb-4"></div>
        <p className="text-xs font-mono tracking-widest text-[#C5A059] uppercase">RETRIEVING MEMORY RECORD...</p>
      </div>
    );
  }

  if (!capsule) {
    return (
      <div className="min-h-screen bg-[#1A1614] text-[#F2EFE9] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#14110F] border border-[#2D241E] p-8 rounded-sm shadow-2xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="font-serif text-xl font-bold text-[#F2EFE9]">Archive Not Found</h2>
          <p className="text-xs text-[#F2EFE9]/40 font-sans">
            The gift transmission link appears to have expired or point to a non-existent chronicle.
          </p>
          <button
            onClick={onGoToLibrary}
            className="mt-4 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] px-4 py-2 rounded-sm text-xs font-sans font-semibold"
          >
            Enter Main Library Vault
          </button>
        </div>
      </div>
    );
  }

  const isLocked = new Date(capsule.unlockDate) > new Date();
  const colors = getCapsuleColorClasses(capsule.color);

  // Envelope Tear Open Ceremony
  const handleTearOpen = () => {
    setIsTearOpenPlaying(true);
    setTimeout(() => {
      setIsEnvelopeOpened(true);
      setIsTearOpenPlaying(false);
    }, 1200);
  };

  // If envelope has been broken open, we land them on their personalized capsule desk!
  if (isEnvelopeOpened) {
    return (
      <div className="min-h-screen bg-[#120a05] py-12 px-4 animate-fade-in">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <span className="text-[10px] font-mono text-yellow-500 tracking-widest uppercase bg-yellow-500/15 border border-yellow-500/30 px-3 py-1 rounded-full">
            ✨ GIFTED ARCHIVE REVEAL
          </span>
          <p className="text-xs text-amber-100/40 font-sans mt-3">
            You are browsing a private keepsake shared specifically with you.
          </p>
        </div>
        <CapsuleDesk 
          capsule={capsule} 
          onBack={onGoToLibrary} 
          onUpdateCapsule={(updated) => {
            setCapsule(updated);
            onUpdateCapsule(updated);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0703] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1d120a] to-[#050301] flex flex-col items-center justify-center p-4">
      {/* Visual background details */}
      <div className="absolute inset-0 bg-[radial-gradient(#3a2717_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none"></div>

      <div className="max-w-lg w-full text-center space-y-10 relative z-10" id="gift-envelope-station">
        
        {/* Ambient top title */}
        <div className="space-y-1.5 animate-fade-in">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#dfcaad] font-medium tracking-wide">
            Capsule
          </h1>
          <p className="text-xs text-amber-100/30 uppercase tracking-widest font-mono">
            ARCHIVAL TRANSFERS
          </p>
        </div>

        {/* 3D Envelope Container with wax seal */}
        <div className={`relative transition-all duration-1000 transform-gpu
          ${isTearOpenPlaying ? "scale-90 rotate-2 opacity-50 blur-[1px]" : "hover:scale-102"}`}
        >
          {/* Main Ivory Envelope body */}
          <div className="bg-[#f5ebd6] rounded-lg border-2 border-amber-900/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-6 sm:p-10 relative overflow-hidden text-amber-950 flex flex-col justify-between min-h-[280px]">
            {/* Envelope flap lines (SVG overlay rendering back) */}
            <div className="absolute inset-0 pointer-events-none opacity-5">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="50%" y2="50%" stroke="black" strokeWidth="2" />
                <line x1="100%" y1="0" x2="50%" y2="50%" stroke="black" strokeWidth="2" />
              </svg>
            </div>

            {/* Stamp Detail */}
            <div className="absolute top-4 right-4 w-12 h-14 border border-dashed border-amber-900/30 p-1 rounded-sm rotate-6 opacity-80 flex flex-col items-center justify-center text-center bg-[#eae0cc]">
              <Gift className="w-4 h-4 text-amber-900/60" />
              <span className="text-[6.5px] font-mono tracking-tight text-amber-900/60 mt-1 uppercase">HEIRLOOM</span>
            </div>

            {/* Sender / Recipient Address fields in script */}
            <div className="text-left font-serif space-y-3 pl-2 sm:pl-4 mt-4">
              <div>
                <span className="text-[8px] font-sans font-bold text-amber-900/40 uppercase tracking-widest block leading-none">For the hands of</span>
                <span className="text-lg sm:text-xl font-bold italic text-amber-900 font-serif leading-tight">
                  {capsule.giftTo || "Dearest Recipient"}
                </span>
              </div>
              <div className="w-24 h-0.5 bg-amber-900/10"></div>
              <div>
                <span className="text-[8px] font-sans font-bold text-amber-900/40 uppercase tracking-widest block leading-none">Sealed and sent by</span>
                <span className="text-sm font-semibold italic text-amber-800 font-serif">
                  {capsule.giftFrom || "Your Benefactor"}
                </span>
              </div>
            </div>

            {/* Interactive Wax Seal */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
              <button
                onClick={handleTearOpen}
                className="w-16 h-16 rounded-full bg-[#802020] border-2 border-yellow-600/60 flex flex-col items-center justify-center shadow-lg transform hover:scale-108 active:scale-95 transition-all relative"
                style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)" }}
                id="envelope-wax-seal"
              >
                <span className="text-[6px] font-mono tracking-widest font-bold text-yellow-400">BREAK</span>
                <Mail className="w-5 h-5 text-yellow-500/80 my-0.5" />
                <span className="text-[6px] font-mono tracking-widest font-bold text-yellow-400">SEAL</span>
              </button>
            </div>

            {/* Small decorative seal ribbon */}
            <div className="absolute inset-x-0 bottom-14 h-4 bg-[#802020]/20 border-y border-[#802020]/10 -z-10"></div>
          </div>
        </div>

        {/* Actions guidelines */}
        <div className="space-y-4 animate-fade-in">
          <p className="text-xs text-amber-100/40 font-sans max-w-sm mx-auto leading-relaxed">
            Click the wax seal to break open the envelope. If the capsule is currently locked, a chronometer will tick down until the seal dissolves.
          </p>
          <div>
            <button
              onClick={onGoToLibrary}
              className="inline-flex items-center gap-1 text-amber-200/50 hover:text-amber-200 text-xs font-sans tracking-wide border-b border-dashed border-amber-900/30 pb-0.5"
            >
              Enter Public Library Vault
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
