/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Capsule, CapsuleItem } from "../types";
import { getCapsuleColorClasses } from "../utils/storage";
import { 
  ArrowLeft, Lock, Unlock, Calendar, Clock, BookOpen, 
  FileText, Image, Volume2, Link as LinkIcon, Play, Pause, 
  ExternalLink, Copy, Check, Gift, VolumeX, RotateCcw
} from "lucide-react";

interface CapsuleDeskProps {
  capsule: Capsule;
  onBack: () => void;
  onUpdateCapsule: (updated: Capsule) => void;
}

export default function CapsuleDesk({ capsule, onBack, onUpdateCapsule }: CapsuleDeskProps) {
  const isLocked = new Date(capsule.unlockDate) > new Date();
  
  // Timer countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Lock shake animation trigger
  const [shakeLock, setShakeLock] = useState(false);
  
  // Opening ceremony transition states
  const [isOpeningInProgress, setIsOpeningInProgress] = useState(false);
  const [ceremonyStep, setCeremonyStep] = useState<"idle" | "unbolting" | "breaking" | "opened">("idle");
  
  // Audio state
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioIntervalRef = useRef<number | null>(null);

  // Copy gift link state
  const [isCopied, setIsCopied] = useState(false);

  // Active viewed item inside the opened capsule
  const [activeItem, setActiveItem] = useState<CapsuleItem | null>(null);

  // Calc countdown
  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(capsule.unlockDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [capsule.unlockDate]);

  // Set default active item once opened
  useEffect(() => {
    if (capsule.isOpened && capsule.items.length > 0 && !activeItem) {
      setActiveItem(capsule.items[0]);
    }
  }, [capsule.isOpened, capsule.items, activeItem]);

  // Handle breaking lock
  const handleLockClick = () => {
    if (isLocked) {
      setShakeLock(true);
      setTimeout(() => setShakeLock(false), 500);
      return;
    }
  };

  // Perform ceremonial unlock
  const triggerCeremony = () => {
    setIsOpeningInProgress(true);
    setCeremonyStep("unbolting");
    
    // Step 1: Slide back brass bolts
    setTimeout(() => {
      setCeremonyStep("breaking");
      
      // Step 2: Break wax seal with dynamic visual particles
      setTimeout(() => {
        setCeremonyStep("opened");
        
        // Step 3: Archive successfully opened
        const updated: Capsule = { ...capsule, isOpened: true };
        onUpdateCapsule(updated);
        setIsOpeningInProgress(false);
        if (updated.items.length > 0) {
          setActiveItem(updated.items[0]);
        }
      }, 1500);
    }, 1200);
  };

  // Audio Playback Simulator
  const toggleAudio = (item: CapsuleItem) => {
    if (playingItem === item.id) {
      // Pause
      setPlayingItem(null);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    } else {
      // Play
      setPlayingItem(item.id);
      const duration = item.duration || 30;
      audioIntervalRef.current = window.setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setPlayingItem(null);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            return 0;
          }
          return prev + (100 / duration);
        });
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

  const generateGiftLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?gift=${capsule.id}`;
  };

  const copyGiftLink = () => {
    navigator.clipboard.writeText(generateGiftLink());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const colors = getCapsuleColorClasses(capsule.color);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8" id="capsule-desk-container">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#F2EFE9]/60 hover:text-[#F2EFE9] px-3 py-1.5 rounded-sm border border-[#2D241E] bg-[#14110F] hover:bg-[#1A1614] transition-all text-xs font-sans tracking-wide"
          id="desk-btn-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Library
        </button>

        {capsule.isGift && (
          <div className="flex items-center gap-1.5 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] px-3 py-1 rounded-full text-xs font-sans font-medium tracking-wide">
            <Gift className="w-3.5 h-3.5" />
            <span>Gifted Archives from {capsule.giftFrom || "Unknown"}</span>
          </div>
        )}
      </div>

      {/* THE DESK SURFACE */}
      <div 
        className="w-full bg-[#14110F] border-[14px] border-[#2D241E] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col min-h-[550px] relative"
        style={{
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.95), 0 35px 70px rgba(0,0,0,0.9)"
        }}
        id="physical-reading-desk"
      >
        {/* Soft atmospheric desktop lamp focus (Top ambient lamp glare) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[350px] h-[150px] bg-[#C5A059]/10 rounded-full filter blur-3xl pointer-events-none z-10"></div>
        
        {/* Soft lamp reflection plate */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-[#C5A059]/5 filter blur-2xl pointer-events-none z-10"></div>

        {/* Desk leather gold foil accent borderline */}
        <div className="absolute inset-4 border border-[#C5A059]/20 pointer-events-none rounded-lg z-10"></div>

        {/* 1. STATE: LOCKED COUNTDOWN VIEW */}
        {isLocked && !isOpeningInProgress && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-20">
            {/* The Locked Container Capsule visual representation */}
            <div 
              onClick={handleLockClick}
              className={`mb-8 select-none transition-transform duration-300 transform cursor-pointer relative ${shakeLock ? "animate-shake" : "hover:scale-105"}`}
            >
              {/* Massive combination dial safe representation */}
              <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full ${colors.bg} ${colors.border} border-4 flex items-center justify-center shadow-2xl relative`}
                   style={{ boxShadow: "inset 0 0 25px rgba(0,0,0,0.7), 0 10px 20px rgba(0,0,0,0.6)" }}>
                
                {/* Dial increments */}
                {[...Array(12)].map((_, i) => (
                  <span key={i} className="absolute w-1 h-3 bg-[#C5A059]/40 rounded-full" 
                        style={{ transform: `rotate(${i * 30}deg) translateY(-60px)` }}></span>
                ))}

                {/* Brass Center Core */}
                <div className="w-20 h-20 sm:w-26 sm:h-26 rounded-full bg-gradient-to-br from-[#C5A059] via-[#a37e3d] to-[#14110F] border border-[#C5A059]/30 flex items-center justify-center shadow-lg">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1A1614] border-2 border-[#2D241E] flex flex-col items-center justify-center">
                    <Lock className="w-6 h-6 text-red-400 animate-pulse-slow" />
                    <span className="text-[7.5px] font-mono text-red-400/80 tracking-widest mt-1">LOCKED</span>
                  </div>
                </div>

                {/* Outer combination arrow pointer */}
                <span className="absolute top-2 w-1.5 h-1.5 bg-[#C5A059] rounded-full"></span>
              </div>
            </div>

            {/* Locked Title Details */}
            <div className="max-w-xl">
              <span className="text-xs font-mono text-[#C5A059]/60 uppercase tracking-widest block mb-1">
                SEALED TIME CAPSULE
              </span>
              <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl sm:text-3xl text-[#F2EFE9] font-bold tracking-wide mb-2">
                {capsule.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#F2EFE9]/60 font-sans italic mb-8 max-w-md mx-auto">
                &ldquo;{capsule.description}&rdquo;
              </p>
            </div>

            {/* Countdown Clock with vintage numbers */}
            <div className="grid grid-cols-4 gap-3 sm:gap-5 mb-10 max-w-md w-full" id="lock-countdown">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hours", val: timeLeft.hours },
                { label: "Minutes", val: timeLeft.minutes },
                { label: "Seconds", val: timeLeft.seconds },
              ].map((cell, idx) => (
                <div key={idx} className="bg-[#1A1614] border border-[#2D241E] rounded-sm p-3 sm:p-4 shadow-inner relative overflow-hidden">
                  {/* Vintage divider line in middle of flip clock */}
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/60 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                  
                  <span className="block font-mono text-2xl sm:text-3xl text-[#C5A059] font-bold leading-none select-none">
                    {String(cell.val).padStart(2, "0")}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] text-[#F2EFE9]/40 uppercase tracking-widest mt-2">
                    {cell.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Lock rattle indicator warning banner */}
            <div className="flex items-center gap-2 text-[11px] text-[#F2EFE9]/40 font-sans bg-black/20 px-4 py-2 rounded-sm border border-[#2D241E] mb-6">
              <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Sealed on {new Date(capsule.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}. Under penalty of erasure, seal dissolves {new Date(capsule.unlockDate).toLocaleDateString("en-US", { dateStyle: "long" })}.</span>
            </div>

            {/* Gift Sharing Box */}
            <div className="bg-[#1A1614]/85 border border-[#2D241E] p-4 rounded-sm max-w-md w-full text-left space-y-3 shadow-lg z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#C5A059] font-serif font-medium text-xs">
                  <Gift className="w-4 h-4" />
                  <span>Heirloom Gift Delivery Link</span>
                </div>
                {capsule.isGift && (
                  <span className="text-[9px] font-mono bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Gift Mode Active
                  </span>
                )}
              </div>
              
              <p className="text-[11px] text-[#F2EFE9]/60 leading-relaxed font-sans">
                {capsule.isGift 
                  ? `This capsule is addressed to ${capsule.giftTo || "Recipient"} from ${capsule.giftFrom || "Benefactor"}. Copy the secure gift link below to send it.`
                  : "Convert this archived capsule into a shareable gift or copy its link to send to someone."
                }
              </p>

              <div className="flex gap-2">
                <button
                  onClick={copyGiftLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] py-2.5 px-4 rounded-sm text-xs font-sans font-semibold tracking-wider transition-all cursor-pointer"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? "GIFT LINK COPIED!" : "COPY SECURE GIFT LINK"}</span>
                </button>

                {!capsule.isGift && (
                  <button
                    onClick={() => {
                      const toName = prompt("Enter recipient's name:", "Clara");
                      if (toName === null) return;
                      const fromName = prompt("Enter your name (sender):", "Grandfather David");
                      if (fromName === null) return;
                      
                      const updated: Capsule = {
                        ...capsule,
                        isGift: true,
                        giftTo: toName.trim() || "Recipient",
                        giftFrom: fromName.trim() || "Benefactor"
                      };
                      onUpdateCapsule(updated);
                    }}
                    className="flex items-center justify-center bg-[#1A1614] hover:bg-[#2D241E] border border-[#2D241E] text-[#F2EFE9]/80 hover:text-[#F2EFE9] px-3.5 rounded-sm text-xs transition-all cursor-pointer"
                    title="Configure as Gift"
                  >
                    <Gift className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. STATE: UNLOCKED BUT UNOPENED RITUAL VIEW */}
        {!isLocked && !capsule.isOpened && !isOpeningInProgress && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-20">
            
            {/* Pulsing visual wax seal inviting click */}
            <div className="mb-10 relative">
              <div className="absolute inset-0 bg-[#C5A059]/10 rounded-full filter blur-xl animate-pulse"></div>
              
              <div 
                onClick={triggerCeremony}
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#802020] border-4 border-[#C5A059]/60 shadow-2xl flex flex-col items-center justify-center cursor-pointer transform hover:scale-108 active:scale-95 duration-300 relative`}
                style={{ boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 0 15px 25px rgba(0,0,0,0.5)" }}
              >
                {/* Seal center ribbon detail */}
                <div className="absolute h-40 w-4 bg-[#802020] border-x border-[#2D241E]/40 -z-10 rounded-sm"></div>

                <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#C5A059]/40 flex items-center justify-center">
                  <Unlock className="w-8 h-8 text-[#C5A059] animate-bounce" />
                </div>
                <span className="text-[9px] font-mono text-[#C5A059] tracking-widest mt-2 font-bold animate-pulse-slow">BREAK SEAL</span>
              </div>
            </div>

            {/* Ready Details */}
            <div className="max-w-xl">
              <span className="text-xs font-mono text-[#C5A059] tracking-widest block mb-1">
                SEAL HAS DISSOLVED
              </span>
              <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#F2EFE9] font-bold tracking-wide mb-2">
                {capsule.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#F2EFE9]/60 font-sans italic mb-8 max-w-md mx-auto">
                &ldquo;{capsule.description}&rdquo;
              </p>
              
              <button
                onClick={triggerCeremony}
                className="bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] px-8 py-3.5 rounded-sm font-sans font-semibold tracking-wider text-xs shadow-2xl transition-all transform active:scale-95 mb-8"
              >
                Perform Opening Ceremony
              </button>

              {/* Gift Sharing Box for Unlocked but Unopened */}
              <div className="bg-[#1A1614]/85 border border-[#2D241E] p-4 rounded-sm max-w-md w-full text-left space-y-3 shadow-lg z-20 mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[#C5A059] font-serif font-medium text-xs">
                    <Gift className="w-4 h-4" />
                    <span>Heirloom Gift Delivery Link</span>
                  </div>
                  {capsule.isGift && (
                    <span className="text-[9px] font-mono bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Gift Mode Active
                    </span>
                  )}
                </div>
                
                <p className="text-[11px] text-[#F2EFE9]/60 leading-relaxed font-sans">
                  {capsule.isGift 
                    ? `This capsule is addressed to ${capsule.giftTo || "Recipient"} from ${capsule.giftFrom || "Benefactor"}. Copy the secure gift link below to send it.`
                    : "Convert this archived capsule into a shareable gift or copy its link to send to someone."
                  }
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={copyGiftLink}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] py-2.5 px-4 rounded-sm text-xs font-sans font-semibold tracking-wider transition-all cursor-pointer"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? "GIFT LINK COPIED!" : "COPY SECURE GIFT LINK"}</span>
                  </button>

                  {!capsule.isGift && (
                    <button
                      onClick={() => {
                        const toName = prompt("Enter recipient's name:", "Clara");
                        if (toName === null) return;
                        const fromName = prompt("Enter your name (sender):", "Grandfather David");
                        if (fromName === null) return;
                        
                        const updated: Capsule = {
                          ...capsule,
                          isGift: true,
                          giftTo: toName.trim() || "Recipient",
                          giftFrom: fromName.trim() || "Benefactor"
                        };
                        onUpdateCapsule(updated);
                      }}
                      className="flex items-center justify-center bg-[#1A1614] hover:bg-[#2D241E] border border-[#2D241E] text-[#F2EFE9]/80 hover:text-[#F2EFE9] px-3.5 rounded-sm text-xs transition-all cursor-pointer"
                      title="Configure as Gift"
                    >
                      <Gift className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CEREMONIAL WORKSTATION TRANSITIONS ANIMATION */}
        {isOpeningInProgress && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#14110F]/95 relative z-30">
            <div className="max-w-md">
              
              {/* Simulated ritual progression */}
              <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-t-[#C5A059] border-r-transparent border-b-transparent border-l-transparent animate-spin duration-1000"></div>
                <div className="absolute inset-2 rounded-full border-2 border-dashed border-[#C5A059]/40"></div>
                
                {ceremonyStep === "unbolting" && <Lock className="w-8 h-8 text-[#C5A059] animate-pulse" />}
                {ceremonyStep === "breaking" && <Unlock className="w-8 h-8 text-red-500 animate-ping" />}
                {ceremonyStep === "opened" && <BookOpen className="w-8 h-8 text-emerald-400" />}
              </div>

              <h3 className="font-serif text-xl text-[#F2EFE9] font-medium mb-2 tracking-wide">
                {ceremonyStep === "unbolting" && "Withdrawing Heavy Brass Bolts..."}
                {ceremonyStep === "breaking" && "Breaking Ancient Wax Seal..."}
                {ceremonyStep === "opened" && "Archive Restored!"}
              </h3>
              
              <p className="text-xs text-[#C5A059]/60 font-mono tracking-widest uppercase">
                {ceremonyStep === "unbolting" && "Restoring internal mechanism..."}
                {ceremonyStep === "breaking" && "Unpacking local memory cells..."}
                {ceremonyStep === "opened" && "Laying volume on the Desk..."}
              </p>
            </div>
          </div>
        )}

        {/* 3. STATE: FULLY OPENED WORKSTATION VIEW */}
        {capsule.isOpened && !isOpeningInProgress && activeItem && (
          <div className="flex-1 flex flex-col md:flex-row z-20">
            
            {/* LEFT BAR: INDEX LEDGER OF SECTIONS */}
            <div className="w-full md:w-64 bg-[#14110F] border-b md:border-b-0 md:border-r border-[#2D241E] p-4 flex flex-col justify-between select-none">
              <div className="space-y-4">
                <div className="border-b border-[#2D241E] pb-3">
                  <span className="text-[9px] font-mono text-[#C5A059]/60 tracking-wider uppercase block">
                    Opened Volume Index
                  </span>
                  <h3 className="font-serif text-sm font-semibold text-[#F2EFE9] leading-tight tracking-wide mt-1 truncate">
                    {capsule.title}
                  </h3>
                </div>

                <div className="space-y-1">
                  {capsule.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-sm flex items-center gap-2.5 transition-all text-xs border
                        ${activeItem?.id === item.id
                          ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/30 font-semibold shadow-inner"
                          : "text-[#F2EFE9]/50 border-transparent hover:text-[#F2EFE9] hover:bg-[#1A1614]"
                        }`}
                    >
                      {item.type === "letter" && <FileText className="w-4 h-4 text-[#C5A059]" />}
                      {item.type === "image" && <Image className="w-4 h-4 text-emerald-400" />}
                      {item.type === "voice" && <Volume2 className="w-4 h-4 text-sky-400" />}
                      {item.type === "link" && <LinkIcon className="w-4 h-4 text-[#C5A059]" />}
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gift Capsule Thread Generation Controls inside Left Panel */}
              {capsule.isGift ? (
                <div className="mt-8 pt-4 border-t border-[#2D241E] text-[11px] space-y-2 font-sans bg-[#1A1614] p-2.5 rounded-sm border border-[#2D241E]">
                  <div className="flex items-center gap-1.5 text-[#C5A059] font-serif font-semibold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Gift Details</span>
                  </div>
                  <div className="text-[#F2EFE9]/60 leading-relaxed">
                    Sent by <strong className="text-[#F2EFE9]">{capsule.giftFrom}</strong> for <strong className="text-[#F2EFE9]">{capsule.giftTo}</strong>.
                  </div>
                </div>
              ) : (
                <div className="mt-8 pt-4 border-t border-[#2D241E] space-y-3 font-sans">
                  <div className="text-[10px] text-[#C5A059]/60 tracking-wider font-mono">SHARE THIS HEIRLOOM</div>
                  
                  {/* Share gift link simulation */}
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] text-[#F2EFE9]/50 leading-normal">
                      Turn this capsule into a gift and share with a unique link.
                    </p>
                    <button
                      onClick={copyGiftLink}
                      className="w-full flex items-center justify-between gap-1 bg-[#1A1614] hover:bg-[#2D241E] border border-[#2D241E] text-[#F2EFE9] px-2.5 py-1.5 rounded-sm text-[11px] font-sans font-medium transition-all"
                    >
                      <span className="truncate text-[10px] opacity-75">
                        {isCopied ? "Link Copied!" : "Generate Gift Link"}
                      </span>
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C5A059]" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT WORKPLACE: DYNAMIC READING MAT */}
            <div className="flex-1 p-6 sm:p-10 flex items-center justify-center bg-[#1A1614] relative min-h-[400px]">
              
              {/* Dynamic scroll representation */}
              <div className="w-full max-w-xl animate-fade-in">
                
                {/* TYPE: WRITTEN LETTER */}
                {activeItem.type === "letter" && (
                  <div 
                    className="bg-[#F2EFE9] border-r-4 border-b-4 border-black/25 rounded-sm shadow-2xl p-6 sm:p-10 font-serif text-[#14110F] relative overflow-hidden"
                    style={{
                      backgroundImage: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.4) 0%, rgba(220,210,195,0.1) 100%)"
                    }}
                    id="reading-mat-letter"
                  >
                    {/* Watermark header logo */}
                    <div className="flex justify-between items-center border-b border-[#2D241E]/10 pb-4 mb-6">
                      <span className="text-[9px] font-mono tracking-widest text-[#14110F]/40">MEMORABILIA RECORD</span>
                      <span className="text-[10px] italic text-[#14110F]/50">Post Scriptum</span>
                    </div>

                    <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl sm:text-2xl font-bold text-[#14110F] tracking-wide mb-6 border-l-4 border-[#C5A059] pl-4">
                      {activeItem.title}
                    </h2>

                    <div className="text-sm sm:text-base leading-relaxed space-y-4 font-serif text-justify whitespace-pre-line text-[#14110F]/80 select-text">
                      {activeItem.content}
                    </div>

                    {/* Quill icon overlay background */}
                    <div className="absolute right-6 bottom-4 text-black/5 pointer-events-none text-7xl select-none font-serif">
                      ✒
                    </div>
                  </div>
                )}

                {/* TYPE: MEMORY IMAGE (Polaroid frame representation) */}
                {activeItem.type === "image" && (
                  <div 
                    className="bg-white p-4 pb-12 rounded-sm shadow-2xl border-b-4 border-r-4 border-black/30 transform -rotate-1 hover:rotate-0 duration-300 max-w-md mx-auto"
                    id="reading-mat-polaroid"
                  >
                    {/* The image or SVG procedural display */}
                    <div className="w-full aspect-[4/3] bg-zinc-900 rounded-sm overflow-hidden flex items-center justify-center relative shadow-inner border border-zinc-200">
                      {activeItem.content.startsWith("data:image/") ? (
                        <img 
                          src={activeItem.content} 
                          alt={activeItem.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-950 p-4">
                          <Image className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-[10px] font-mono opacity-50">CANNOT CONVERT IMAGE BLOCK</span>
                        </div>
                      )}
                    </div>

                    {/* Polaroid Pencil handwritten signature */}
                    <div className="mt-5 text-center font-serif text-sm sm:text-base italic text-zinc-700 tracking-wide select-none">
                      {activeItem.title}
                    </div>
                  </div>
                )}

                {/* TYPE: VOICE RECORDING PLAYER */}
                {activeItem.type === "voice" && (
                  <div 
                    className="bg-[#14110F] border-2 border-[#2D241E] rounded-md p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
                    id="reading-mat-audiorecorder"
                  >
                    {/* Brass speaker grill texture backing */}
                    <div className="absolute inset-0 bg-[radial-gradient(#C5A059_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

                    <span className="text-[9px] font-mono text-[#C5A059]/65 tracking-widest block mb-1">
                      ANALOG AUDIO FEED
                    </span>
                    <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#F2EFE9] font-medium tracking-wide mb-6">
                      {activeItem.title}
                    </h3>

                    {/* Tape Deck Reel-to-Reel interactive design */}
                    <div className="flex justify-center items-center gap-8 mb-8">
                      {/* Left Reel */}
                      <div className="relative">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#1A1614] via-zinc-800 to-[#14110F] border border-[#2D241E] flex items-center justify-center shadow-lg
                          ${playingItem === activeItem.id ? "animate-spin [animation-duration:4s]" : ""}`}>
                          {/* Inner spokes */}
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className="absolute w-1.5 h-full bg-[#14110F]/65" style={{ transform: `rotate(${i * 60}deg)` }}></span>
                          ))}
                          <div className="w-6 h-6 rounded-full bg-[#C5A059] border border-black/40 flex items-center justify-center shadow-inner z-10">
                            <span className="w-2 h-2 bg-[#14110F] rounded-full"></span>
                          </div>
                        </div>
                        <span className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#C5A059]/65">SUPPLY</span>
                      </div>

                      {/* Moving Tape Thread lines */}
                      <div className="flex-1 h-3 flex items-center justify-between px-2 relative">
                        <div className="absolute inset-x-0 h-0.5 bg-[#2D241E]"></div>
                        {/* Audio wave indicator bars */}
                        <div className="w-full flex justify-around items-end h-6 z-10 px-4">
                          {[...Array(12)].map((_, i) => {
                            return (
                              <span 
                                key={i} 
                                className="w-1 rounded-t bg-[#C5A059] transition-all duration-300"
                                style={{ 
                                  height: playingItem === activeItem.id 
                                    ? `${Math.max(4, Math.floor(Math.random() * 24 + 4))}px` 
                                    : "4px" 
                                }}
                              ></span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right Reel */}
                      <div className="relative">
                        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#1A1614] via-zinc-800 to-[#14110F] border border-[#2D241E] flex items-center justify-center shadow-lg
                          ${playingItem === activeItem.id ? "animate-spin [animation-duration:4s]" : ""}`}>
                          {/* Inner spokes */}
                          {[...Array(3)].map((_, i) => (
                            <span key={i} className="absolute w-1.5 h-full bg-[#14110F]/65" style={{ transform: `rotate(${i * 60}deg)` }}></span>
                          ))}
                          <div className="w-6 h-6 rounded-full bg-[#C5A059] border border-black/40 flex items-center justify-center shadow-inner z-10">
                            <span className="w-2 h-2 bg-[#14110F] rounded-full"></span>
                          </div>
                        </div>
                        <span className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[8px] font-mono text-[#C5A059]/65">TAKEUP</span>
                      </div>
                    </div>

                    {/* Progress slider bar */}
                    <div className="w-full bg-[#1A1614] rounded-full h-1.5 mb-6 overflow-hidden">
                      <div 
                        className="bg-[#C5A059] h-full transition-all duration-1000"
                        style={{ width: `${playingItem === activeItem.id ? audioProgress : 0}%` }}
                      ></div>
                    </div>

                    {/* Audio Interface Buttons */}
                    <div className="flex justify-center items-center gap-4">
                      <button
                        onClick={() => toggleAudio(activeItem)}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center text-[#14110F] hover:text-[#14110F]/90 transition-all transform active:scale-90 shadow-md
                          ${playingItem === activeItem.id 
                            ? "bg-red-950/40 border-red-900/50 text-red-400" 
                            : "bg-[#C5A059] border-[#C5A059]/30 hover:bg-[#b08e4e]"
                          }`}
                      >
                        {playingItem === activeItem.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-[#14110F]" />}
                      </button>
                    </div>

                    <p className="text-[10px] text-[#F2EFE9]/30 font-sans mt-6">
                      Estimated duration: {activeItem.duration || 30}s. Replaying requires browser audio driver.
                    </p>
                  </div>
                )}

                {/* TYPE: LINKS AND THREADS */}
                {activeItem.type === "link" && (
                  <div 
                    className="bg-[#14110F] border border-[#2D241E] rounded-md p-8 shadow-2xl text-center relative overflow-hidden"
                    id="reading-mat-webthread"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <LinkIcon className="w-24 h-24 text-[#C5A059]" />
                    </div>

                    <span className="text-[9px] font-mono text-[#C5A059] tracking-widest block mb-1">
                      INTELLIGENT EXTERNAL LINK
                    </span>
                    <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#F2EFE9] font-semibold tracking-wide mb-2">
                      {activeItem.title}
                    </h3>
                    <p className="text-xs text-[#F2EFE9]/40 font-sans mb-8">
                      A portal connected to this archive. Follow the thread into the outer web.
                    </p>

                    <div className="bg-[#1A1614] border border-[#2D241E] rounded-sm p-4 mb-8 text-xs font-mono text-[#C5A059]/85 select-all truncate">
                      {activeItem.content}
                    </div>

                    <a
                      href={activeItem.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] px-6 py-3 rounded-sm font-sans tracking-wide font-medium shadow-lg transition-all transform active:scale-95"
                    >
                      Follow Thread Outward
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
