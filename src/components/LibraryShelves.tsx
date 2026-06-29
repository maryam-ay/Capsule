/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Capsule } from "../types";
import ShelfItem from "./ShelfItem";
import { Search, Compass, ShieldAlert, Archive, Gift, Eye, PlusCircle } from "lucide-react";

interface LibraryShelvesProps {
  capsules: Capsule[];
  onSelectCapsule: (capsule: Capsule) => void;
  onCreateClick: () => void;
}

type FilterType = "all" | "locked" | "ready" | "opened" | "gifts";

export default function LibraryShelves({ capsules, onSelectCapsule, onCreateClick }: LibraryShelvesProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [pullingId, setPullingId] = useState<string | null>(null);

  const handleSelectWithAnimation = (capsule: Capsule) => {
    if (pullingId) return;
    setPullingId(capsule.id);
    setTimeout(() => {
      onSelectCapsule(capsule);
      setPullingId(null);
    }, 950);
  };

  // Determine locked status
  const isCapsuleLocked = (c: Capsule) => new Date(c.unlockDate) > new Date();

  const filteredCapsules = capsules.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.description.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;

    const locked = isCapsuleLocked(c);
    if (filter === "locked") return locked;
    if (filter === "ready") return !locked && !c.isOpened;
    if (filter === "opened") return !locked && c.isOpened;
    if (filter === "gifts") return c.isGift;
    return true;
  });

  // Split capsules into shelves dynamically (e.g., max 3-4 items per shelf row for beautiful spacing)
  const itemsPerShelf = 4;
  const shelfRows: Capsule[][] = [];
  for (let i = 0; i < filteredCapsules.length; i += itemsPerShelf) {
    shelfRows.push(filteredCapsules.slice(i, i + itemsPerShelf));
  }

  // Ensure we show at least two shelves to maintain the aesthetic architecture even if empty
  while (shelfRows.length < 2) {
    shelfRows.push([]);
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6" id="library-shelves-container">
      {/* Bookcase Header / Library Controls (styled like a brass ledger drawer drawer) */}
      <div className="bg-[#14110F] border border-[#2D241E] rounded-md p-4 mb-10 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search box with search icon and warm copper theme */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#C5A059]/50">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search archival volumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-sans placeholder-[#F2EFE9]/30 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/50 transition-all"
              id="library-search-input"
            />
          </div>

          {/* Filter Toggles */}
          <div className="flex flex-wrap items-center gap-1.5" id="library-filter-buttons">
            {(["all", "locked", "ready", "opened", "gifts"] as FilterType[]).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-sm text-xs font-sans tracking-wide border transition-all duration-300 capitalize
                  ${filter === t 
                    ? "bg-[#C5A059] text-[#14110F] border-[#C5A059] shadow-md font-medium" 
                    : "bg-[#1A1614]/80 text-[#F2EFE9]/60 border-[#2D241E] hover:text-[#F2EFE9] hover:bg-[#1A1614]"
                  }`}
              >
                {t === "all" && "All Volumes"}
                {t === "locked" && "🔒 Locked"}
                {t === "ready" && "🔔 Ready to Open"}
                {t === "opened" && "📖 Opened"}
                {t === "gifts" && "🎁 Gift Heirloom"}
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] px-4.5 py-2.5 rounded-sm font-sans font-semibold tracking-wider text-xs shadow-lg transition-all transform active:scale-95"
            id="library-btn-new-capsule"
          >
            <PlusCircle className="w-4 h-4" />
            Seal New Capsule
          </button>
        </div>
      </div>

      {/* Bookcase Wooden Framework */}
      <div 
        className="relative bg-[#14110F] rounded-xl border-[12px] border-t-[16px] border-b-[20px] border-[#2D241E] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden"
        style={{
          boxShadow: "inset 0 0 50px rgba(0,0,0,0.95), 0 25px 50px -12px rgba(0,0,0,0.85)"
        }}
        id="wooden-bookcase"
      >
        {/* Soft light glare overlay casting from above */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#C5A059]/10 to-transparent pointer-events-none z-10"></div>

        {/* Outer wood grain edge details */}
        <div className="absolute inset-y-0 left-0 w-1 bg-black/20 z-10"></div>
        <div className="absolute inset-y-0 right-0 w-1 bg-black/20 z-10"></div>

        {/* Bookshelf shelf segments */}
        {shelfRows.map((shelfItems, shelfIndex) => (
          <div key={shelfIndex} className="relative flex flex-col justify-end pt-12 pb-2 min-h-[220px] sm:min-h-[270px]">
            
            {/* Inner Back Panel shadowing for realistic 3D cavity */}
            <div className="absolute inset-0 bg-[#14110F] bg-gradient-to-b from-black/60 via-black/30 to-black/80 -z-10"></div>

            {/* Shelf Items Grid Container */}
            <div className="flex flex-row justify-center items-end gap-5 sm:gap-10 px-6 sm:px-12 w-full pb-1 z-20">
              {shelfItems.length > 0 ? (
                shelfItems.map((c) => (
                  <ShelfItem 
                    key={c.id} 
                    capsule={c} 
                    onSelect={handleSelectWithAnimation} 
                    isPulling={pullingId === c.id}
                  />
                ))
              ) : (
                <div className="text-center py-10 opacity-20 select-none">
                  <span className="text-xs font-mono text-[#C5A059]/60 uppercase tracking-widest">EMPTY ARCHIVE ROW</span>
                </div>
              )}
            </div>

            {/* The Physical Wood Shelf Board */}
            <div 
              className="relative w-full h-8 bg-gradient-to-b from-[#2D241E] via-[#1A1614] to-[#14110F] border-t-2 border-[#C5A059]/30 shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10"
              style={{
                boxShadow: "inset 0 1px 3px rgba(255,255,255,0.05), 0 4px 6px rgba(0,0,0,0.8)"
              }}
            >
              {/* Wood Grain Highlights */}
              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-black/50"></div>
              <div className="absolute inset-x-0 top-0 h-[2px] bg-[#C5A059]/10"></div>

              {/* Little elegant Brass Index Tag in the center of the shelf */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1 px-3 py-0.5 rounded-sm bg-gradient-to-b from-[#C5A059] to-[#b08e4e] border border-[#C5A059]/40 text-[#14110F] text-[8px] font-sans font-bold tracking-widest uppercase shadow">
                SHELF NO. 0{shelfIndex + 1}
              </div>
            </div>

          </div>
        ))}

          {/* Empty library warning if search or filtering returned nothing */}
          {filteredCapsules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-[#14110F] relative z-20">
              <Archive className="w-10 h-10 text-[#C5A059]/40 mb-3" />
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#F2EFE9] mb-1">No Volumes Found</h3>
              <p className="text-xs text-[#F2EFE9]/40 font-sans max-w-sm">
                Adjust your search query or filters. You can also seal a new capsule to place it here.
              </p>
            </div>
          )}
        </div>

        {/* Mini shelf-legend helpful guidelines footer */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] font-sans text-[#F2EFE9]/40 px-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-950/40 border border-red-900/60 flex items-center justify-center shadow-inner"><span className="w-1 h-1 rounded-full bg-red-400"></span></span>
            <span>Locked: Deep recessed, combination dial safe-locked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center animate-pulse-slow shadow-inner"><span className="w-1 h-1 rounded-full bg-[#C5A059]"></span></span>
            <span className="text-[#C5A059] font-medium">Ready: Pulled forward, pulsing gold outline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950/40 border border-emerald-900/60 flex items-center justify-center shadow-inner"><span className="w-1 h-1 rounded-full bg-emerald-400"></span></span>
            <span>Opened: Read anytime on your reading desk</span>
          </div>
        </div>
      </div>
  );
}
