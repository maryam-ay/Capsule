/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Capsule, CapsuleCategory, CapsuleColor, CapsuleItem } from "../types";
import { getCapsuleColorClasses } from "../utils/storage";
import { uploadToCloudinary } from "../utils/cloudinary";
import { 
  ArrowLeft, Archive, Calendar, Lock, Check, Plus, Trash2, 
  Upload, FileText, Image, Volume2, Link as LinkIcon, Mic, MicOff, Square
} from "lucide-react";

interface CreateCapsuleProps {
  onBack: () => void;
  onSave: (capsule: Capsule) => void;
}

export default function CreateCapsule({ onBack, onSave }: CreateCapsuleProps) {
  // General details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CapsuleCategory>("book");
  const [color, setColor] = useState<CapsuleColor>("walnut");
  
  // Date lockpicker
  const [unlockDate, setUnlockDate] = useState("");
  const [datePreset, setDatePreset] = useState<string>("1m"); // 1m, 6m, 1y, 2030
  
  // Gift details
  const [isGift, setIsGift] = useState(false);
  const [giftTo, setGiftTo] = useState("");
  const [giftFrom, setGiftFrom] = useState("");

  // Capsule items compiled list
  const [items, setItems] = useState<CapsuleItem[]>([]);
  
  // Active selected item builder tab
  const [itemType, setItemType] = useState<"letter" | "image" | "voice" | "link">("letter");
  
  // Individual item builder state
  const [letterTitle, setLetterTitle] = useState("");
  const [letterText, setLetterText] = useState("");
  
  const [imageTitle, setImageTitle] = useState("");
  const [imageContent, setImageContent] = useState(""); // base64 URL
  const [imageFileName, setImageFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Real files states to upload on Sealing
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
  const [filesToUpload, setFilesToUpload] = useState<{ [itemId: string]: { file: File | Blob; type: "image" | "voice"; name: string } }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgressMsg, setSaveProgressMsg] = useState("");

  const [voiceTitle, setVoiceTitle] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isMicBlocked, setIsMicBlocked] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string>("");
  const [recordingTimer, setRecordingTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Preset Dates calc
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    if (preset === "10s") {
      now.setSeconds(now.getSeconds() + 15); // for fast testing!
    } else if (preset === "1m") {
      now.setMonth(now.getMonth() + 1);
    } else if (preset === "6m") {
      now.setMonth(now.getMonth() + 6);
    } else if (preset === "1y") {
      now.setFullYear(now.getFullYear() + 1);
    } else if (preset === "2030") {
      now.setFullYear(2030, 0, 1);
      now.setHours(0, 0, 0, 0);
    }
    
    // Format to yyyy-MM-ddThh:mm for datetime-local input
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - offset * 60 * 1000);
    setUnlockDate(localNow.toISOString().slice(0, 16));
  };

  // Set default lock date on load
  React.useEffect(() => {
    handlePresetChange("1m");
  }, []);

  // Handle Drag & Drop image files
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }
    setCurrentImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImageContent(e.target.result as string);
        setImageFileName(file.name);
        if (!imageTitle) {
          setImageTitle(file.name.split(".")[0]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Handle Microphones Voice Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      setIsMicBlocked(false);
      
      // Determine the best supported mimeType
      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          mimeType = "audio/webm;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
          mimeType = "audio/ogg;codecs=opus";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setCurrentAudioBlob(audioBlob);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setRecordedAudioUrl(reader.result as string);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all audio stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTimer(0);
      
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      // Fallback: Simulation of Recording if mic denied or sandboxed iframe prevents usage
      setIsMicBlocked(true);
      setIsRecording(true);
      setRecordingTimer(0);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTimer((prev) => {
          if (prev >= 15) {
            stopVoiceRecording();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    } else if (isRecording) {
      // simulated save
      setIsMicBlocked(true);
      setRecordedAudioUrl("https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav");
    }
    setIsRecording(false);
  };

  // Handle manual audio file uploading as a high-fidelity alternative
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCurrentAudioBlob(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setRecordedAudioUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      if (!voiceTitle.trim()) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        setVoiceTitle(nameWithoutExt);
      }
    }
  };

  // Compile any filled individual item fields into lists simultaneously
  const compileAllFilled = () => {
    const compiledList: CapsuleItem[] = [];
    const newFilesToUpload: { [itemId: string]: { file: File | Blob; type: "image" | "voice"; name: string } } = {};
    let timestampOffset = 0;

    // 1. Check Written Letter
    if (letterText.trim()) {
      const id = `item-${Date.now()}-${timestampOffset++}`;
      compiledList.push({
        id,
        type: "letter",
        title: letterTitle.trim() || "Unspoken Ledger",
        content: letterText.trim()
      });
      setLetterTitle("");
      setLetterText("");
    }

    // 2. Check Photo Upload
    if (imageContent || currentImageFile) {
      const id = `item-${Date.now()}-${timestampOffset++}`;
      compiledList.push({
        id,
        type: "image",
        title: imageTitle.trim() || imageFileName || "Imaged Memory",
        content: imageContent,
        fileName: imageFileName
      });
      if (currentImageFile) {
        newFilesToUpload[id] = { file: currentImageFile, type: "image" as const, name: imageFileName };
      }
      setImageTitle("");
      setImageContent("");
      setImageFileName("");
      setCurrentImageFile(null);
    }

    // 3. Check Voice Recording
    if (isRecording) {
      stopVoiceRecording();
    }
    if (recordedAudioUrl || currentAudioBlob) {
      const id = `item-${Date.now()}-${timestampOffset++}`;
      compiledList.push({
        id,
        type: "voice",
        title: voiceTitle.trim() || "Recorded Accent",
        content: recordedAudioUrl || "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav",
        duration: recordingTimer || 12
      });
      if (currentAudioBlob) {
        newFilesToUpload[id] = { file: currentAudioBlob, type: "voice" as const, name: voiceTitle.trim() || "voice_recording.opus" };
      }
      setVoiceTitle("");
      setRecordedAudioUrl("");
      setRecordingTimer(0);
      setCurrentAudioBlob(null);
    }

    // 4. Check Web Link
    if (linkUrl.trim()) {
      const id = `item-${Date.now()}-${timestampOffset++}`;
      compiledList.push({
        id,
        type: "link",
        title: linkTitle.trim() || "Web Anchor",
        content: linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`
      });
      setLinkTitle("");
      setLinkUrl("");
    }

    if (compiledList.length > 0) {
      setFilesToUpload(prev => ({ ...prev, ...newFilesToUpload }));
      setItems(prev => [...prev, ...compiledList]);
    }

    return { compiledList, newFilesToUpload };
  };

  const compileItem = () => {
    const { compiledList } = compileAllFilled();
    if (compiledList.length === 0) {
      alert("Please fill out at least one item field (Letter, Photo, Voice, or Link) before compiling.");
    }
  };

  const compileItemOld = () => {
    return;
    let newItem: CapsuleItem | null = null;

    if (itemType === "letter" && letterText.trim()) {
      newItem = {
        id: `item-${Date.now()}`,
        type: "letter",
        title: letterTitle.trim() || "Unspoken Ledger",
        content: letterText.trim()
      };
      // reset
      setLetterTitle("");
      setLetterText("");
    } else if (itemType === "image" && imageContent) {
      newItem = {
        id: `item-${Date.now()}`,
        type: "image",
        title: imageTitle.trim() || imageFileName || "Imaged Memory",
        content: imageContent,
        fileName: imageFileName
      };
      // reset
      setImageTitle("");
      setImageContent("");
      setImageFileName("");
    } else if (itemType === "voice" && (recordedAudioUrl || isRecording)) {
      if (isRecording) stopVoiceRecording();
      newItem = {
        id: `item-${Date.now()}`,
        type: "voice",
        title: voiceTitle.trim() || "Recorded Accent",
        content: recordedAudioUrl || "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav",
        duration: recordingTimer || 12
      };
      // reset
      setVoiceTitle("");
      setRecordedAudioUrl("");
      setRecordingTimer(0);
    } else if (itemType === "link" && linkUrl.trim()) {
      newItem = {
        id: `item-${Date.now()}`,
        type: "link",
        title: linkTitle.trim() || "Web Anchor",
        content: linkUrl.trim().startsWith("http") ? linkUrl.trim() : `https://${linkUrl.trim()}`
      };
      // reset
      setLinkTitle("");
      setLinkUrl("");
    }

    if (newItem) {
      // Associate selected file/blob for uploading on Sealing
      if (itemType === "image" && currentImageFile) {
        setFilesToUpload(prev => ({
          ...prev,
          [newItem!.id]: { file: currentImageFile, type: "image" as const, name: imageFileName }
        }));
        setCurrentImageFile(null);
      } else if (itemType === "voice") {
        // If we recorded a real audio file
        if (currentAudioBlob) {
          setFilesToUpload(prev => ({
            ...prev,
            [newItem!.id]: { file: currentAudioBlob, type: "voice" as const, name: voiceTitle.trim() || "voice_recording.opus" }
          }));
          setCurrentAudioBlob(null);
        } else {
          // If fallback/simulated, convert the audio URL or base64 if needed, or if mock URL, don't register file
        }
      }

      setItems((prev) => [...prev, newItem!]);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Save the complete newly-created capsule
  const handleSaveCapsule = async () => {
    if (!title.trim()) {
      alert("Please provide an archival title for this capsule.");
      return;
    }

    // Automatically compile any pending items that are filled but not yet explicitly compiled
    const { compiledList, newFilesToUpload } = compileAllFilled();
    const finalItems = [...items, ...compiledList];
    const finalFilesToUpload = { ...filesToUpload, ...newFilesToUpload };

    if (finalItems.length === 0) {
      alert("A quiet archive requires at least one memory, letter, photo, or audio recording inside.");
      return;
    }

    setIsSaving(true);
    setSaveProgressMsg("Sealing the memory capsule...");

    try {
      const capsuleId = `capsule-${Date.now()}`;
      const uploadedItems = [...finalItems];

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const isCloudinaryConfigured = !!(cloudName && uploadPreset);

      // Upload files to Cloudinary sequentially, with progress tracking
      for (let i = 0; i < uploadedItems.length; i++) {
        const item = uploadedItems[i];
        if (finalFilesToUpload[item.id]) {
          const uploadEntry = finalFilesToUpload[item.id];
          setSaveProgressMsg(`Preparing memory: ${item.title}...`);
          
          if (isCloudinaryConfigured) {
            // Convert Blob to File if needed
            let fileToUpload: File;
            if (uploadEntry.file instanceof File) {
              fileToUpload = uploadEntry.file;
            } else {
              fileToUpload = new File([uploadEntry.file], uploadEntry.name, { type: uploadEntry.file.type || "audio/ogg" });
            }

            // Images use "image" resource type; voice recordings use "video" in Cloudinary
            const resourceType = uploadEntry.type === "image" ? "image" : "video";
            
            try {
              const downloadUrl = await uploadToCloudinary(fileToUpload, resourceType, {
                onProgress: (percent) => {
                  setSaveProgressMsg(`Uploading ${item.title} (${percent}%)...`);
                }
              });

              uploadedItems[i] = {
                ...item,
                content: downloadUrl
              };
            } catch (uploadErr: any) {
              console.warn("Cloudinary upload failed, falling back to local data URL embedding:", uploadErr);
              // Fallback to existing base64 content
            }
          } else {
            console.log("Cloudinary is not configured. Embedding data as local Base64 URL.");
            // Fallback to existing base64 content
          }
        }
      }

      const newCapsule: Capsule = {
        id: capsuleId,
        title: title.trim(),
        description: description.trim() || "A keepsake for the future",
        unlockDate: new Date(unlockDate).toISOString(),
        category,
        color,
        style: Math.floor(Math.random() * 3) + 1, // select visual style variant
        isGift,
        giftTo: isGift ? giftTo.trim() || "Recipient" : undefined,
        giftFrom: isGift ? giftFrom.trim() || "Benefactor" : undefined,
        isOpened: false,
        items: uploadedItems,
        createdAt: new Date().toISOString()
      };

      setSaveProgressMsg("Saving records to Firestore...");
      await onSave(newCapsule);
    } catch (error: any) {
      console.error("Failed to seal and save capsule:", error);
      alert(`Archival Sealing Failed: ${error.message || "An unknown network error occurred. Please verify your Cloudinary configurations in the settings."}`);
    } finally {
      setIsSaving(false);
    }
  };

  const colors = getCapsuleColorClasses(color);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 relative" id="create-capsule-container">
      {/* Save loading overlay */}
      {isSaving && (
        <div className="absolute inset-0 bg-[#1A1614]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center select-none rounded-xl">
          <div className="w-14 h-14 rounded-full border-4 border-[#C5A059]/20 border-t-[#C5A059] animate-spin mb-6"></div>
          <h3 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#F2EFE9] font-medium tracking-wide">
            {saveProgressMsg}
          </h3>
          <p className="text-[10px] text-[#C5A059] font-sans tracking-widest uppercase mt-2.5">
            Encoding content streams and sealing outer shell
          </p>
        </div>
      )}

      {/* Header back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#F2EFE9]/60 hover:text-[#F2EFE9] px-3 py-1.5 rounded-sm border border-[#2D241E] bg-[#14110F] hover:bg-[#1A1614] transition-all text-xs font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel and return
        </button>
      </div>

      {/* Draftsman's Ledger Container (Ledger Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: THE PHYSICAL DESIGN BUILDER (8/12 blocks) */}
        <div className="lg:col-span-7 bg-[#14110F] border border-[#2D241E] rounded-sm shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-[#2D241E] pb-4">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#F2EFE9] font-semibold tracking-wide">
              Architect a New Time Capsule
            </h2>
            <p className="text-xs text-[#F2EFE9]/40 font-sans mt-1">
              Assemble files, letters, and memory logs into a physical protective case.
            </p>
          </div>

          {/* Form Fields: Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
                Archival Volume Title
              </label>
              <input
                type="text"
                placeholder="e.g., The Midsummer Strolls, Graduate Memoir, Echoes of 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={45}
                className="w-full px-3.5 py-2.5 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-sans placeholder-[#F2EFE9]/20 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/50 transition-all"
                id="create-input-title"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
                Spine Label Subtitle / Short Description
              </label>
              <input
                type="text"
                placeholder="e.g., A private diary for Clara, predictions for 2030"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={60}
                className="w-full px-3.5 py-2.5 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-sans placeholder-[#F2EFE9]/20 text-sm focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059]/50 transition-all"
                id="create-input-desc"
              />
            </div>
          </div>

          {/* Category Picker (tactile cards showing books/cases) */}
          <div>
            <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-3">
              Select Protective Container Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="create-category-picker">
              {[
                { type: "book", label: "Bound Volume", desc: "Gold-ribbed spine stood upright" },
                { type: "case", label: "Archival Case", desc: "Archival pull ring, paper card insert" },
                { type: "journal", label: "Leather Journal", desc: "Strap-bound leather stitching" },
                { type: "letter", label: "Sealed Letter", desc: "Wax-sealed thick rolled parchment" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setCategory(item.type as CapsuleCategory)}
                  className={`p-3 rounded-sm border text-left transition-all duration-300 flex flex-col justify-between min-h-[90px]
                    ${category === item.type
                      ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/50 shadow-lg"
                      : "bg-[#1A1614] text-[#F2EFE9]/50 border-[#2D241E] hover:bg-[#14110F] hover:text-[#F2EFE9]"
                    }`}
                >
                  <span className="text-xs font-serif font-bold tracking-wide">{item.label}</span>
                  <span className="text-[9px] text-[#F2EFE9]/40 font-sans leading-tight mt-1">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Palette Choice */}
          <div>
            <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-2.5">
              Select Premium Outer Cover Coat
            </label>
            <div className="flex flex-wrap gap-2.5" id="create-color-picker">
              {([
                { name: "oxblood", hex: "bg-[#4a1212]", border: "border-[#aa2c2c]" },
                { name: "walnut", hex: "bg-[#2f1f17]", border: "border-[#8b5a2b]" },
                { name: "charcoal", hex: "bg-[#222120]", border: "border-[#555350]" },
                { name: "pine", hex: "bg-[#1c281e]", border: "border-[#3f6446]" },
                { name: "indigo", hex: "bg-[#1c2230]", border: "border-[#3e568c]" },
                { name: "amber", hex: "bg-[#3d2a13]", border: "border-[#b3772d]" },
              ] as { name: CapsuleColor; hex: string; border: string }[]).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={`w-10 h-10 rounded-full ${c.hex} border-2 relative transition-transform duration-300 hover:scale-110 flex items-center justify-center
                    ${color === c.name ? `${c.border} ring-2 ring-[#C5A059]/40 scale-105` : "border-transparent"}`}
                  title={c.name}
                >
                  {color === c.name && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Locked Pick Timer */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-5">
              <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
                Preset Awakening Lock
              </label>
              <div className="grid grid-cols-5 gap-1" id="create-timer-presets">
                {[
                  { id: "10s", label: "15s" },
                  { id: "1m", label: "1M" },
                  { id: "6m", label: "6M" },
                  { id: "1y", label: "1Y" },
                  { id: "2030", label: "2030" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePresetChange(preset.id)}
                    className={`py-2 rounded-sm text-[10px] font-mono tracking-tighter border transition-all
                      ${datePreset === preset.id
                        ? "bg-[#C5A059] text-[#14110F] border-[#C5A059]/40 font-bold"
                        : "bg-[#1A1614] text-[#F2EFE9]/50 border-[#2D241E] hover:bg-[#14110F]"
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1.5">
                Precise Awakening Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={unlockDate}
                  onChange={(e) => {
                    setUnlockDate(e.target.value);
                    setDatePreset("");
                  }}
                  className="w-full px-3.5 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] font-mono text-xs focus:outline-none focus:border-[#C5A059]"
                  id="create-input-date"
                />
              </div>
            </div>
          </div>

          {/* Gift Settings Toggle */}
          <div className="bg-[#1A1614] border border-[#2D241E] rounded-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#C5A059]" />
                <span className="text-xs font-serif font-semibold text-[#F2EFE9]">Is this an heirloom gift for someone?</span>
              </div>
              <input
                type="checkbox"
                checked={isGift}
                onChange={(e) => setIsGift(e.target.checked)}
                className="w-4 h-4 rounded text-[#C5A059] bg-black border-[#2D241E] focus:ring-[#C5A059] cursor-pointer"
                id="create-gift-toggle"
              />
            </div>

            {isGift && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#2D241E] animate-fade-in">
                <div>
                  <label className="block text-[9px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1">
                    Recipient Name (To)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Clara Williams"
                    value={giftTo}
                    onChange={(e) => setGiftTo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-sm bg-[#14110F] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-[#C5A059]/60 uppercase tracking-widest mb-1">
                    Benefactor / Sender Name (From)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Grandfather David"
                    value={giftFrom}
                    onChange={(e) => setGiftFrom(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-sm bg-[#14110F] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none focus:border-[#C5A059]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REPOSITORIES / ITEMS COMPILER (5/12 blocks) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Item Builder tab board */}
          <div className="bg-[#14110F] border border-[#2D241E] rounded-sm shadow-2xl p-5 space-y-4">
            <div className="border-b border-[#2D241E] pb-2.5">
              <span className="text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest block">
                MEMORIES COMPILER
              </span>
              <h3 className="font-serif text-sm font-semibold text-[#F2EFE9] mt-0.5">
                Compile Content Sheets
              </h3>
            </div>

            {/* Type Switch Tabs */}
            <div className="flex bg-[#1A1614] border border-[#2D241E] rounded-sm p-1 gap-1">
              {[
                { type: "letter", label: "Letter", icon: FileText },
                { type: "image", label: "Photo", icon: Image },
                { type: "voice", label: "Voice", icon: Volume2 },
                { type: "link", label: "Link", icon: LinkIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => setItemType(tab.type as any)}
                    className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-sm text-[10.5px] font-sans transition-all
                      ${itemType === tab.type
                        ? "bg-[#C5A059]/10 text-[#C5A059] font-semibold"
                        : "text-[#F2EFE9]/40 hover:text-[#F2EFE9]"
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT: WRITTEN LETTER */}
            {itemType === "letter" && (
              <div className="space-y-3 pt-1 animate-fade-in">
                <input
                  type="text"
                  placeholder="Letter Title (e.g., A sacred promise, Predictions)"
                  value={letterTitle}
                  onChange={(e) => setLetterTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none"
                />
                <textarea
                  placeholder="Draft your handwritten letter here..."
                  value={letterText}
                  onChange={(e) => setLetterText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs font-serif leading-relaxed focus:outline-none resize-none"
                ></textarea>
              </div>
            )}

            {/* TAB CONTENT: IMAGE UPLOAD (Supports Drag & Drop) */}
            {itemType === "image" && (
              <div className="space-y-3 pt-1 animate-fade-in" id="image-dragdrop-box">
                <input
                  type="text"
                  placeholder="Photo Title (e.g., Standing on the high peaks)"
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-sm p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]
                    ${isDragOver 
                      ? "border-[#C5A059] bg-[#C5A059]/5" 
                      : imageContent 
                        ? "border-emerald-800 bg-[#1A1614]" 
                        : "border-[#2D241E]/50 bg-[#1A1614] hover:bg-[#14110F]"
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {imageContent ? (
                    <div className="space-y-2">
                      <div className="w-16 h-16 rounded overflow-hidden mx-auto border border-zinc-800">
                        <img src={imageContent} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-[10px] text-emerald-400 font-mono font-bold">Image Locked in Memory!</p>
                      <p className="text-[9px] text-[#F2EFE9]/30 truncate max-w-[200px]">{imageFileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[#F2EFE9]/40">
                      <Upload className="w-8 h-8 mx-auto opacity-40 animate-pulse-slow text-[#C5A059]" />
                      <p className="text-xs font-serif">Drag & drop photo or click to browse</p>
                      <p className="text-[9px] font-sans opacity-50">JPG, PNG, WEBP allowed (encoded locally)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: INTERACTIVE VOICE MEMO RECORDER */}
            {itemType === "voice" && (
              <div className="space-y-3 pt-1 animate-fade-in" id="voice-recorder-box">
                <input
                  type="text"
                  placeholder="Voice Memo Title (e.g., Rainy Evening Musings)"
                  value={voiceTitle}
                  onChange={(e) => setVoiceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none"
                />

                <input
                  type="file"
                  ref={audioFileInputRef}
                  onChange={handleAudioFileSelect}
                  accept="audio/*"
                  className="hidden"
                />

                {isMicBlocked && !currentAudioBlob && (
                  <div className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-sm text-left text-[11px] text-amber-300 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      ⚠️ Microphone Restricted by Sandbox/Browser
                    </p>
                    <p className="opacity-80 leading-normal">
                      Your browser blocked microphone access (often due to iframe sandbox security rules). Custom recording is simulated with a placeholder sound.
                    </p>
                    <p className="font-medium">
                      💡 Solution: You can upload your own voice memos, music, or audio recordings below!
                    </p>
                  </div>
                )}

                <div className="bg-[#1A1614] rounded-sm p-4 border border-[#2D241E] text-center flex flex-col items-center justify-center min-h-[140px] gap-3">
                  {isRecording ? (
                    <div className="space-y-2">
                      <div className="flex justify-center items-center gap-1.5 h-6">
                        {[...Array(6)].map((_, i) => (
                          <span key={i} className="w-1.5 bg-red-500 rounded animate-voice-bounce" style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 0.1}s` }}></span>
                        ))}
                      </div>
                      <p className="text-xs font-mono text-red-400 font-bold">RECORDING IN PROGRESS</p>
                      <p className="text-xl font-mono text-[#F2EFE9]">{recordingTimer}s</p>
                      
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="flex items-center gap-1.5 mx-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full text-xs font-semibold"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                        Stop and Save Note
                      </button>
                    </div>
                  ) : recordedAudioUrl ? (
                    <div className="space-y-3 w-full">
                      <Volume2 className="w-8 h-8 text-sky-400 mx-auto animate-bounce" />
                      
                      {recordedAudioUrl === "https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav" ? (
                        <div className="space-y-1.5">
                          <p className="text-xs font-mono text-amber-400 font-semibold">Simulated Placeholder Recorded</p>
                          <p className="text-[10px] text-[#F2EFE9]/50 max-w-xs mx-auto">
                            Since microphone permission was unavailable, we used a nostalgic bell-chime tone. Upload a real voice memo file to store actual audio!
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-mono text-sky-400 font-semibold">
                          {currentAudioBlob ? "Audio File Loaded Successfully!" : "Voice Note Captured successfully!"}
                        </p>
                      )}
                      
                      {/* Audio Player preview */}
                      <div className="max-w-xs mx-auto pb-1">
                        <audio src={recordedAudioUrl} controls className="w-full h-8 mx-auto accent-[#C5A059]" />
                      </div>
                      
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="flex items-center gap-1 bg-[#1A1614] border border-[#2D241E] hover:bg-[#14110F] text-[#C5A059] px-3 py-1.5 rounded-sm text-xs"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          Re-record
                        </button>
                        <button
                          type="button"
                          onClick={() => audioFileInputRef.current?.click()}
                          className="flex items-center gap-1 bg-[#1A1614] border border-[#2D241E] hover:bg-[#14110F] text-sky-400 px-3 py-1.5 rounded-sm text-xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Different File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Mic className="w-8 h-8 text-[#F2EFE9]/30 mx-auto" />
                      <p className="text-xs font-serif text-[#F2EFE9]/40">Add audio memory using your mic or upload an audio file</p>
                      
                      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                        <button
                          type="button"
                          onClick={startVoiceRecording}
                          className="flex items-center justify-center gap-2 bg-[#C5A059] hover:bg-[#b08e4e] text-[#14110F] px-4 py-2 rounded-full text-xs font-semibold shadow-md min-w-[150px]"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          Record Mic
                        </button>
                        <button
                          type="button"
                          onClick={() => audioFileInputRef.current?.click()}
                          className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-[#2D241E] text-sky-400 px-4 py-2 rounded-full text-xs font-semibold shadow-md min-w-[150px]"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Audio File
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: WEB LINKS & PLATFORMS */}
            {itemType === "link" && (
              <div className="space-y-3 pt-1 animate-fade-in">
                <input
                  type="text"
                  placeholder="Link Title (e.g., Shared Spotify Roadtrip list)"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Web URL (e.g., https://spotify.com/...)"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-sm bg-[#1A1614] border border-[#2D241E] text-[#F2EFE9] text-xs font-mono focus:outline-none"
                />
              </div>
            )}

            {/* BUTTON TO COMPILE THE ITEM SHEET */}
            <button
              type="button"
              onClick={compileItem}
              className="w-full bg-[#1C2E22] hover:bg-[#253D2D] border border-emerald-800/40 text-emerald-200 py-2.5 rounded-sm text-xs font-sans font-medium tracking-wide transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Compile into Capsule Bundle
            </button>
          </div>

          {/* ACTIVE INVENTORY LEDGER LIST */}
          <div className="bg-[#14110F] border border-[#2D241E] rounded-sm shadow-2xl p-5 space-y-4">
            <span className="text-[10px] font-mono text-[#C5A059]/60 uppercase tracking-widest block">
              CAPSULE INVENTORY ({items.length})
            </span>

            {items.length > 0 ? (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between bg-[#1A1614] border border-[#2D241E] p-2.5 rounded-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {it.type === "letter" && <FileText className="w-4 h-4 text-[#C5A059]" />}
                      {it.type === "image" && <Image className="w-4 h-4 text-emerald-400" />}
                      {it.type === "voice" && <Volume2 className="w-4 h-4 text-sky-400" />}
                      {it.type === "link" && <LinkIcon className="w-4 h-4 text-[#C5A059]" />}
                      
                      <div className="min-w-0">
                        <p className="text-xs text-[#F2EFE9] font-medium truncate leading-tight">{it.title}</p>
                        <p className="text-[9px] text-[#F2EFE9]/40 font-mono capitalize leading-none mt-1">{it.type}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="text-red-400/50 hover:text-red-400 p-1 rounded-sm hover:bg-red-950/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-[#2D241E]/40 rounded-sm text-[#F2EFE9]/30 select-none">
                <Archive className="w-8 h-8 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-serif">Capsule is currently empty</p>
                <p className="text-[9px] font-sans opacity-50 mt-0.5">Add a letter, memory card, or memo to seal it.</p>
              </div>
            )}

            {/* SEALS THE CAPSULE ON THE SHELF */}
            <div className="pt-3 border-t border-[#2D241E]">
              <button
                type="button"
                onClick={handleSaveCapsule}
                className="w-full bg-[#C5A059] hover:bg-[#b08e4e] border-2 border-[#C5A059]/30 text-[#14110F] py-3 rounded-sm font-sans tracking-wider font-bold text-xs shadow-xl hover:shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-2"
                id="create-btn-save"
              >
                <Lock className="w-4 h-4" />
                SEAL AND PLACE ON SHELF
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
