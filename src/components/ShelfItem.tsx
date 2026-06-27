/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Capsule } from "../types";
import { getCapsuleColorClasses } from "../utils/storage";
import { Lock, Unlock, Gift, BookOpen, AlertCircle } from "lucide-react";

interface ShelfItemProps {
  key?: string;
  capsule: Capsule;
  onSelect: (capsule: Capsule) => void;
}

export default function ShelfItem({ capsule, onSelect }: ShelfItemProps) {
  const isLocked = new Date(capsule.unlockDate) > new Date();
  const isReady = !isLocked && !capsule.isOpened;
  const isOpened = !isLocked && capsule.isOpened;
  const colors = getCapsuleColorClasses(capsule.color);

  // Formatted date string
  const unlockDateObj = new Date(capsule.unlockDate);
  const formattedUnlockDate = unlockDateObj.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    day: "numeric",
  });

  return (
    <div
      onClick={() => onSelect(capsule)}
      className={`group relative flex flex-col justify-end items-center select-none transition-all duration-500 transform-gpu cursor-pointer
        ${isLocked ? "scale-92 translate-y-2 opacity-85 hover:opacity-100 hover:scale-96 hover:translate-y-0 filter brightness-75 hover:brightness-95" : ""}
        ${isReady ? "scale-102 translate-y-[-6px] filter brightness-105 active:scale-100 shadow-[0_12px_24px_rgba(197,160,89,0.25)] hover:shadow-[0_16px_32px_rgba(197,160,89,0.45)]" : ""}
        ${isOpened ? "scale-98 hover:scale-102 hover:translate-y-[-2px] hover:brightness-110 active:scale-96" : ""}
      `}
      style={{ perspective: "1000px" }}
      id={`shelf-item-${capsule.id}`}
    >
      {/* State Badge floating just above */}
      <div className="absolute top-[-36px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-30">
        <div className="bg-[#14110F] text-[#F2EFE9] border border-[#2D241E] px-2 py-1 rounded-sm text-[10px] tracking-widest uppercase font-sans whitespace-nowrap shadow-md">
          {isLocked && `Unlocks ${formattedUnlockDate}`}
          {isReady && "⚠️ Pull to Reading Desk"}
          {isOpened && "Opened Archive"}
          {capsule.isGift && `Gift for ${capsule.giftTo}`}
        </div>
      </div>

      {/* 1. ARCHIVAL CASE Visual Style */}
      {capsule.category === "case" && (
        <div 
          className={`relative w-24 h-48 sm:w-28 sm:h-56 rounded-sm ${colors.bg} ${colors.border} border-t-2 border-x-2 shadow-[2px_10px_20px_rgba(0,0,0,0.5)] flex flex-col justify-between items-center p-3 text-center`}
          style={{
            boxShadow: `inset -6px 0 15px rgba(0,0,0,0.6), inset 6px 0 10px rgba(255,255,255,0.05), 4px 12px 18px rgba(0,0,0,0.5)`
          }}
        >
          {/* Top Brass rivets */}
          <div className="flex justify-between w-full px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]/80 shadow-[0_1px_1px_rgba(0,0,0,0.5)]"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]/80 shadow-[0_1px_1px_rgba(0,0,0,0.5)]"></span>
          </div>

          {/* Library Index Label (The Card Holder) */}
          <div className="w-full bg-[#F2EFE9] border-2 border-[#2D241E]/40 p-1.5 rounded-sm shadow-inner flex flex-col justify-center items-center select-none overflow-hidden my-3">
            <span className="text-[9px] text-[#C5A059] uppercase tracking-wider font-mono font-bold">
              {capsule.isGift ? "GIFT" : "ARCHIVE"}
            </span>
            <h4 style={{ fontFamily: "Georgia, serif" }} className="text-[10px] sm:text-xs font-bold text-[#14110F] leading-tight truncate max-w-full">
              {capsule.title}
            </h4>
            <div className="w-6 h-0.5 bg-[#2D241E]/20 my-0.5"></div>
            <span className="text-[8px] text-[#14110F]/70 font-sans tracking-tight truncate max-w-full">
              {capsule.description}
            </span>
          </div>

          {/* Bottom Pull Ring and Rivet */}
          <div className="flex flex-col items-center gap-1.5 mt-auto w-full">
            {/* Draw Ring (Tactile handle) */}
            <div className="w-6 h-6 rounded-full border-2 border-[#C5A059]/70 flex items-center justify-center relative shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_1px_2px_rgba(255,255,255,0.15)]">
              <span className="absolute w-1.5 h-2.5 bg-[#C5A059] top-[-3px] rounded-t-sm"></span>
              <span className="w-1 h-1 bg-[#14110F] rounded-full"></span>
            </div>
            
            {/* Lock/Unlock status plate */}
            <div className={`px-1.5 py-0.5 rounded-sm text-[8px] border font-mono tracking-widest ${isLocked ? "bg-red-950/40 text-red-300 border-red-900/40" : "bg-emerald-950/40 text-emerald-300 border-emerald-950/40"}`}>
              {isLocked ? "SECURE" : "UNLOCKED"}
            </div>
          </div>
        </div>
      )}

      {/* 2. LEATHER JOURNAL Visual Style */}
      {capsule.category === "journal" && (
        <div 
          className={`relative w-22 h-44 sm:w-26 sm:h-52 rounded-l-md rounded-r ${colors.bg} ${colors.border} border-y-2 border-r-2 shadow-[4px_8px_16px_rgba(0,0,0,0.55)] flex flex-col justify-between p-3.5`}
          style={{
            boxShadow: `inset -8px 0 12px rgba(0,0,0,0.4), inset 4px 0 8px rgba(255,255,255,0.06), 6px 10px 16px rgba(0,0,0,0.6)`,
            backgroundImage: "radial-gradient(circle at 10% 50%, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)"
          }}
        >
          {/* Vertical Spine Stitching Detail on left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-2.5 border-r border-dashed border-black/45 bg-black/25 flex flex-col justify-around py-2 items-center">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="w-1 h-1 rounded-full bg-[#C5A059]/30"></span>
            ))}
          </div>

          {/* Label Title plate - Gold stamped or brass */}
          <div className="mt-4 pl-2 flex flex-col gap-0.5 border-l-2 border-[#C5A059]/40">
            <h4 className="font-serif text-[11px] sm:text-[13px] font-medium leading-tight tracking-wide text-[#F2EFE9] truncate">
              {capsule.title}
            </h4>
            <span className="text-[8px] sm:text-[9px] font-sans text-[#C5A059]/60 italic tracking-tight truncate">
              {capsule.description}
            </span>
          </div>

          {/* Leather wrap strap horizontally crossing the book */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[70%] h-5 bg-[#14110F] border-t border-b border-[#2D241E] shadow-md rounded-l flex items-center justify-end pr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059] border border-black/40 flex items-center justify-center shadow-sm">
              <span className="w-1 h-1 bg-black/80 rounded-full"></span>
            </span>
          </div>

          {/* Bottom Stamp Logo */}
          <div className="flex justify-between items-center pl-2 mt-auto">
            <span className="text-[8px] font-mono opacity-40 text-[#F2EFE9]">
              VOL. {capsule.style * 4 + 1}
            </span>
            {isLocked ? (
              <Lock className="w-3 h-3 text-red-400/80" />
            ) : isReady ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <BookOpen className="w-3 h-3 text-[#C5A059]" />
            )}
          </div>
        </div>
      )}

      {/* 3. CLASSICAL STANDING BOOK Visual Style */}
      {capsule.category === "book" && (
        <div 
          className={`relative w-20 h-46 sm:w-24 sm:h-54 rounded-sm ${colors.bg} ${colors.border} border-y-2 border-x border-r-2 shadow-[2px_12px_22px_rgba(0,0,0,0.6)] flex flex-col justify-between p-3`}
          style={{
            boxShadow: `inset -10px 0 15px rgba(0,0,0,0.5), inset 2px 0 6px rgba(255,255,255,0.08), 5px 12px 20px rgba(0,0,0,0.55)`
          }}
        >
          {/* Gold Embossed Spine Details (ribs) */}
          <div className="flex flex-col gap-8 w-full mt-2">
            <div className="border-t border-b py-0.5 border-[#C5A059]/40 flex flex-col gap-0.5">
              <span className="block h-0.5 bg-[#C5A059]/20"></span>
              <span className="block h-0.5 bg-[#C5A059]/20"></span>
            </div>
          </div>

          {/* Spine Gold Embossed Title Text */}
          <div className="flex-1 flex items-center justify-center py-4 my-2">
            <div className="rotate-90 origin-center whitespace-nowrap text-center">
              <h4 className="font-serif text-[10px] sm:text-xs font-bold text-[#F2EFE9] tracking-widest uppercase truncate max-w-[90px] sm:max-w-[110px]">
                {capsule.title}
              </h4>
            </div>
          </div>

          {/* Bottom details (Gold foil rib + Date) */}
          <div className="flex flex-col items-center gap-1 mt-auto">
            <div className="w-full border-t border-[#C5A059]/30 pt-1 text-center">
              <span className="text-[7.5px] font-mono tracking-tight text-[#C5A059]/60">
                {isLocked ? "LOCKED" : "OPEN"}
              </span>
            </div>
            
            {/* Hanging ribbon bookmark details */}
            <div className="absolute bottom-[-10px] left-1/3 w-3 h-4 bg-[#802020] border-b border-x border-black/40 shadow-md transform rotate-2"></div>
          </div>
        </div>
      )}

      {/* 4. WAX-SEALED LETTER DOSSIER Visual Style */}
      {capsule.category === "letter" && (
        <div 
          className={`relative w-22 h-44 sm:w-26 sm:h-52 rounded-sm ${colors.bg} ${colors.border} border-2 shadow-[4px_12px_20px_rgba(0,0,0,0.6)] flex flex-col justify-between p-4`}
          style={{
            boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.5), inset 6px 6px 10px rgba(255,255,255,0.04), 4px 10px 18px rgba(0,0,0,0.5)`
          }}
        >
          {/* Tied parchment ribbon wrapped around (visual overlay) */}
          <div className="absolute inset-x-0 top-1/3 h-6 bg-[#802020]/90 border-y border-[#aa2c2c] shadow flex items-center justify-center z-10">
            {/* Wax seal ornament in the center of the ribbon */}
            <div className="absolute w-8 h-8 rounded-full bg-[#5c1313] border-2 border-[#C5A059]/70 shadow-lg flex items-center justify-center transform -rotate-12 hover:scale-105 transition-transform">
              <span className="text-[7px] text-[#F2EFE9] font-serif font-bold">C</span>
            </div>
          </div>

          <div className="z-20">
            <span className="text-[8px] font-mono text-[#C5A059] tracking-wider font-bold">
              {capsule.isGift ? "✉ GIFT" : "✉ LETTER"}
            </span>
            <h4 className="font-serif text-[11px] sm:text-xs font-semibold text-[#F2EFE9] leading-tight mt-1 truncate">
              {capsule.title}
            </h4>
          </div>

          <div className="z-20 mt-auto flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[7px] text-[#C5A059]/50 font-sans font-semibold tracking-wider">RECIPIENT</span>
              <span className="text-[9px] text-[#F2EFE9] font-serif font-medium truncate max-w-[65px]">
                {capsule.isGift ? capsule.giftTo : "Self"}
              </span>
            </div>

            {capsule.isGift && <Gift className="w-3.5 h-3.5 text-[#C5A059]" />}
          </div>
        </div>
      )}

      {/* Ribbon Overlay for Gifted capsules (wrapped diagonally over the top corner) */}
      {capsule.isGift && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none">
          <div className="flex items-center gap-0.5 bg-[#C5A059] border border-[#C5A059]/80 text-[#14110F] px-1 py-0.2 rounded-sm text-[8px] font-sans font-bold tracking-widest uppercase shadow">
            <Gift className="w-2 h-2" />
            <span>GIFT</span>
          </div>
        </div>
      )}

      {/* Tactile shadows on the bottom simulating depth of shelf board */}
      <div className="absolute bottom-[-2px] left-2 right-2 h-[4px] bg-black/40 rounded-full blur-[1.5px] pointer-events-none"></div>

      {/* Interactive LED glow ring on the wood under active "READY" capsules */}
      {isReady && (
        <div className="absolute bottom-[-1px] w-[80%] h-3 bg-[#C5A059]/15 rounded-full filter blur-md animate-pulse pointer-events-none z-0"></div>
      )}
    </div>
  );
}
