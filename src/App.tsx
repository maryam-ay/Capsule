/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Capsule, ViewState } from "./types";
import { getCapsules, saveCapsules } from "./utils/storage";
import { auth } from "./utils/firebase";
import { onAuthStateChanged, signOutUser, getUserCapsules, saveCapsuleToFirestore } from "./utils/firebaseStorage";
import { User } from "firebase/auth";
import LibraryShelves from "./components/LibraryShelves";
import CapsuleDesk from "./components/CapsuleDesk";
import CreateCapsule from "./components/CreateCapsule";
import GiftLanding from "./components/GiftLanding";
import Auth from "./components/Auth";
import { Library, Archive, Shield, Hourglass, Gift, RefreshCw } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [view, setView] = useState<ViewState>("library");
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  
  // Gift link token check
  const [giftId, setGiftId] = useState<string | null>(null);

  // Load capsules and check URL parameters on mount
  useEffect(() => {
    // Parse URL parameter: ?gift=CAPSULE_ID
    const searchParams = new URLSearchParams(window.location.search);
    const giftParam = searchParams.get("gift");
    if (giftParam) {
      setGiftId(giftParam);
      setView("gift");
    }

    // Check if there is an existing guest session
    const savedGuest = localStorage.getItem("guest_session");
    if (savedGuest) {
      try {
        const guestUser = JSON.parse(savedGuest);
        setUser(guestUser);
        setCapsules(getCapsules());
        setAuthLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("guest_session");
      }
    }

    // Bind auth state listener
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // If we are currently running a guest session, do not override with null auth
      if (localStorage.getItem("guest_session")) {
        return;
      }

      setUser(currentUser);
      if (currentUser) {
        // Load from Firestore
        getUserCapsules(currentUser.uid)
          .then((loaded) => {
            setCapsules(loaded);
          })
          .catch((err) => {
            console.error("Error loading user capsules:", err);
          })
          .finally(() => {
            setAuthLoading(false);
          });
      } else {
        setCapsules([]);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGuestLogin = () => {
    const guestUser = { uid: "guest-user", email: "guest@chronicle.local", isAnonymous: true };
    localStorage.setItem("guest_session", JSON.stringify(guestUser));
    setUser(guestUser);
    setCapsules(getCapsules());
  };

  // Update capsule states in Firestore & local state
  const handleUpdateCapsule = async (updated: Capsule) => {
    const nextCapsules = capsules.map((c) => (c.id === updated.id ? updated : c));
    setCapsules(nextCapsules);
    if (selectedCapsule && selectedCapsule.id === updated.id) {
      setSelectedCapsule(updated);
    }
    if (user) {
      if (user.uid === "guest-user") {
        saveCapsules(nextCapsules);
      } else {
        try {
          await saveCapsuleToFirestore(updated, user.uid);
        } catch (err) {
          console.error("Failed to save updated capsule to Firestore:", err);
        }
      }
    }
  };

  // Add newly created capsule to Firestore & local state
  const handleSaveNewCapsule = async (newCapsule: Capsule) => {
    const nextCapsules = [newCapsule, ...capsules];
    setCapsules(nextCapsules);
    setView("library");
    if (user) {
      if (user.uid === "guest-user") {
        saveCapsules(nextCapsules);
      } else {
        try {
          await saveCapsuleToFirestore(newCapsule, user.uid);
        } catch (err) {
          console.error("Failed to save new capsule to Firestore:", err);
        }
      }
    }
  };

  // Reset/Clear Archive back to factory default
  const handleResetArchive = async () => {
    if (window.confirm("Are you sure you want to clear your current library? This will refresh your showcase.")) {
      if (user) {
        if (user.uid === "guest-user") {
          localStorage.removeItem("capsule_archive");
          const defaults = getCapsules();
          setCapsules(defaults);
        } else {
          setCapsules([]);
        }
        setView("library");
        setSelectedCapsule(null);
      }
    }
  };

  // Archive statistics calculated dynamically
  const isLocked = (c: Capsule) => new Date(c.unlockDate) > new Date();
  const totalCount = capsules.length;
  const lockedCount = capsules.filter(isLocked).length;
  const readyCount = capsules.filter((c) => !isLocked(c) && !c.isOpened).length;
  const openedCount = capsules.filter((c) => !isLocked(c) && c.isOpened).length;

  return (
    <div className="min-h-screen bg-[#1A1614] text-[#F2EFE9] relative overflow-x-hidden select-none pb-12">
      {/* 1. Fine grain static noise texture layered over the entire application */}
      <div className="absolute inset-0 grain-overlay pointer-events-none z-50"></div>

      {/* 2. Top Navigation header (hidden in pure Gift Mode landing screen to preserve full envelope immersion) */}
      {view !== "gift" && user && (
        <header className="border-b border-[#2D241E] bg-[#14110F]/95 backdrop-blur-md sticky top-0 z-40 px-4 py-4 sm:px-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Logo and Tagline */}
            <div 
              onClick={() => setView("library")}
              className="flex items-center gap-3 cursor-pointer group"
              id="app-header-logo"
            >
              <div className="w-8 h-8 bg-[#C5A059] rounded-sm flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <div className="w-4 h-4 border-2 border-[#1A1614]"></div>
              </div>
              <div className="text-left">
                <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#F2EFE9] font-medium tracking-tight leading-none">
                  Capsule
                </h1>
                <span className="text-[9px] font-sans tracking-[0.2em] text-[#C5A059]/60 uppercase block mt-1 leading-none">
                  THE PRIVATE ARCHIVE
                </span>
              </div>
            </div>

            {/* Live Stats display panels */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
              
              <div className="bg-[#14110F] px-3 py-1.5 rounded-sm border border-[#2D241E] flex items-center gap-1.5 shadow-sm">
                <Archive className="w-3.5 h-3.5 text-[#C5A059]" />
                <span className="text-[#F2EFE9]/50">Stored:</span>
                <strong className="text-[#F2EFE9]">{totalCount}</strong>
              </div>

              {readyCount > 0 && (
                <div className="bg-[#C5A059]/10 px-3 py-1.5 rounded-sm border border-[#C5A059]/30 flex items-center gap-1.5 animate-pulse-slow shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                  <span className="text-[#C5A059]">Ready:</span>
                  <strong className="text-[#C5A059] font-bold">{readyCount}</strong>
                </div>
              )}

              <div className="bg-[#14110F] px-3 py-1.5 rounded-sm border border-[#2D241E] flex items-center gap-1.5 shadow-sm">
                <Hourglass className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[#F2EFE9]/40">Locked:</span>
                <strong className="text-[#F2EFE9]/70">{lockedCount}</strong>
              </div>

              {/* Maintenance Reset database button */}
              <button
                onClick={handleResetArchive}
                className="p-1.5 rounded-sm bg-[#14110F] hover:bg-[#2D241E] border border-[#2D241E] text-[#F2EFE9]/40 hover:text-[#F2EFE9]/80 transition-all ml-1 shadow-sm"
                title="Clear current shelves"
                id="header-btn-reset"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Secure Lock Cabinets / Session profile */}
              <div className="flex items-center gap-2 pl-2 border-l border-[#2D241E]">
                <span className="text-[10px] text-[#F2EFE9]/40 font-mono hidden md:inline truncate max-w-[120px]" title={user.email || ""}>
                  {user.email}
                </span>
                <button
                  onClick={() => {
                    if (user.uid === "guest-user") {
                      localStorage.removeItem("guest_session");
                      setUser(null);
                      setCapsules([]);
                    } else {
                      signOutUser();
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-sm bg-[#802020]/10 hover:bg-[#802020]/20 border border-[#802020]/30 text-red-300 hover:text-red-200 transition-all text-[10px] font-mono tracking-wider uppercase shadow-sm cursor-pointer"
                  title="Lock private bookcase and sign out"
                >
                  LOCK VAULT
                </button>
              </div>

            </div>

          </div>
        </header>
      )}

      {/* 3. CORE ROUTING RENDERING WINDOW */}
      <main className="relative z-10">
        {authLoading ? (
          <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-12 h-12 rounded-full border-4 border-[#C5A059]/20 border-t-[#C5A059] animate-spin mb-4"></div>
            <p className="text-xs font-mono tracking-widest text-[#C5A059] uppercase">RESTORING HERITAGE LOGS...</p>
          </div>
        ) : view !== "gift" && !user ? (
          <Auth onAuthSuccess={(u) => setUser(u)} onGuestSuccess={handleGuestLogin} />
        ) : (
          <>
            {/* VIEW: MAIN BOOKCASE SHELVES LIBRARY */}
            {view === "library" && (
              <div className="animate-fade-in pt-6">
                <div className="text-center mb-10 max-w-xl mx-auto px-4 select-none">
                  <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl sm:text-4xl text-[#F2EFE9] font-medium tracking-wide">
                    Chronicle Archives
                  </h2>
                  <p className="text-[10px] text-[#C5A059] font-sans mt-2 tracking-widest uppercase">
                    A repository of locked memories, letters, and voices awaiting future thresholds.
                  </p>
                </div>
                
                <LibraryShelves
                  capsules={capsules}
                  onSelectCapsule={(c) => {
                    setSelectedCapsule(c);
                    setView("desk");
                  }}
                  onCreateClick={() => setView("create")}
                />
              </div>
            )}

            {/* VIEW: CEREMONIAL READING DESK */}
            {view === "desk" && selectedCapsule && (
              <div className="animate-fade-in">
                <CapsuleDesk
                  capsule={selectedCapsule}
                  onBack={async () => {
                    setView("library");
                    setSelectedCapsule(null);
                    // refresh count lists
                    if (user) {
                      if (user.uid === "guest-user") {
                        setCapsules(getCapsules());
                      } else {
                        try {
                          const loaded = await getUserCapsules(user.uid);
                          setCapsules(loaded);
                        } catch (err) {
                          console.error(err);
                        }
                      }
                    }
                  }}
                  onUpdateCapsule={handleUpdateCapsule}
                />
              </div>
            )}

            {/* VIEW: CREATE FLOW */}
            {view === "create" && (
              <div className="animate-fade-in">
                <CreateCapsule
                  onBack={() => setView("library")}
                  onSave={handleSaveNewCapsule}
                />
              </div>
            )}
          </>
        )}

        {/* VIEW: RECEIVED GIFT ENVELOPE LANDING VIEW (Always accessible via URL, even if logged out) */}
        {view === "gift" && giftId && (
          <GiftLanding
            giftId={giftId}
            capsules={capsules}
            onUpdateCapsule={handleUpdateCapsule}
            onGoToLibrary={() => {
              // Clean URL parameters
              window.history.pushState({}, document.title, window.location.pathname);
              setGiftId(null);
              setView("library");
            }}
          />
        )}

      </main>
    </div>
  );
}
