import React, { useState } from "react";
import { signInUser, signUpUser } from "../utils/firebaseStorage";
import { Lock, Mail, Eye, EyeOff, Key, ShieldCheck, HelpCircle } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: any) => void;
  onGuestSuccess: () => void;
}

export default function Auth({ onAuthSuccess, onGuestSuccess }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAuthNotAllowed, setIsAuthNotAllowed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthNotAllowed(false);
    setLoading(true);

    try {
      if (isSignUp) {
        const user = await signUpUser(email, password);
        onAuthSuccess(user);
      } else {
        const user = await signInUser(email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      let friendlyMessage = "Authentication failed. Please verify your credentials.";
      if (err.code === "auth/operation-not-allowed") {
        friendlyMessage = "Email/Password Authentication is not yet enabled in this Firebase project. To enable it, navigate to your Firebase Console -> Authentication -> Sign-in Method, and enable 'Email/Password'.";
        setIsAuthNotAllowed(true);
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "An account with this email already exists.";
      } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password combination.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 select-none">
      <div 
        className="w-full max-w-md bg-[#14110F] border-[10px] border-[#2D241E] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.95)] overflow-hidden relative p-8 sm:p-10"
        style={{
          boxShadow: "inset 0 0 50px rgba(0,0,0,0.95), 0 30px 60px rgba(0,0,0,0.85)"
        }}
      >
        {/* Fine gold lines / accents */}
        <div className="absolute inset-3 border border-[#C5A059]/15 pointer-events-none rounded-lg"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[250px] h-[100px] bg-[#C5A059]/5 rounded-full filter blur-2xl pointer-events-none"></div>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="w-14 h-14 bg-[#C5A059]/10 rounded-full border border-[#C5A059]/30 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-[#C5A059]" />
          </div>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl sm:text-3xl text-[#F2EFE9] font-medium tracking-wide">
            {isSignUp ? "Register Ledger" : "Unlock Archive"}
          </h2>
          <p className="text-[10px] text-[#C5A059] font-sans tracking-widest uppercase mt-2">
            {isSignUp ? "Create your secure time vault" : "Authenticate to access your private volumes"}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/30 text-red-300 text-xs rounded-sm p-3.5 mb-6 text-center font-sans tracking-wide leading-relaxed animate-fade-in">
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
              Ledger Identifier (Email)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-[#C5A059]/45">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="archivist@heritage.com"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-sans placeholder-[#F2EFE9]/15 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/50 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
              Access Code (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center text-[#C5A059]/45">
                <Key className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10.5 pr-10.5 py-2.5 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-sans placeholder-[#F2EFE9]/15 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3.5 flex items-center text-[#C5A059]/45 hover:text-[#C5A059]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] py-3.5 rounded-sm font-sans font-bold tracking-wider text-xs shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-55"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "AUTHENTICATING..." : isSignUp ? "INITIALIZE PRIVATE VAULT" : "UNLOCK SHELVES"}
          </button>
        </form>

        <div className="mt-5 space-y-4 relative z-10">
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[#2D241E]"></div>
            <span className="flex-shrink mx-4 text-[9px] font-mono text-[#F2EFE9]/20 uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-[#2D241E]"></div>
          </div>

          <button
            type="button"
            onClick={onGuestSuccess}
            className="w-full bg-transparent hover:bg-[#C5A059]/5 border border-[#C5A059]/30 hover:border-[#C5A059] text-[#C5A059] py-3.5 rounded-sm font-sans font-semibold tracking-wider text-xs transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#C5A059]/70" />
            ENTER AS GUEST
          </button>
          
          {isAuthNotAllowed && (
            <p className="text-[10px] text-[#C5A059]/80 font-serif leading-relaxed text-center bg-[#C5A059]/5 border border-[#C5A059]/20 p-3 rounded-sm">
              💡 <strong>Archivist Note:</strong> Since Firebase Email/Password Auth is not enabled yet in your dashboard, you can click the button above to run completely in high-fidelity <strong>Guest Mode</strong>. Your capsules will be saved locally in this browser.
            </p>
          )}
        </div>

        {/* Toggle option */}
        <div className="mt-8 text-center border-t border-[#2D241E] pt-5 relative z-10">
          <p className="text-xs text-[#F2EFE9]/40 font-sans">
            {isSignUp ? "Already hold an archive key?" : "No key to this bookcase yet?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs text-[#C5A059] hover:text-[#b08e4e] font-sans font-medium mt-1.5 focus:outline-none underline underline-offset-4 decoration-[#C5A059]/30 hover:decoration-[#C5A059]"
          >
            {isSignUp ? "Sign In to Existing Cabinets" : "Register a New Chronicle Ledger"}
          </button>
        </div>
      </div>
    </div>
  );
}
