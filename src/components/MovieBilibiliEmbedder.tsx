import React, { useState, useEffect, ChangeEvent } from "react";
import { 
  Film, 
  Tv, 
  ExternalLink, 
  Copy, 
  Check, 
  Play, 
  HardDrive, 
  FileSpreadsheet, 
  Sparkles, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  Globe, 
  Download,
  Share2,
  Video,
  Layers,
  CheckCircle2,
  HelpCircle,
  Eye,
  Minimize2,
  FolderUp,
  Image as ImageIcon,
  Upload,
  CloudUpload,
  Palette,
  Wand2,
  Key,
  FileText
} from "lucide-react";
import { GoogleSheetInfo } from "../types";

interface MovieBilibiliEmbedderProps {
  user: any;
  accessToken: string | null;
  checkToken: () => Promise<string | null>;
  connectedSheet: GoogleSheetInfo | null;
  onRefreshSheet?: () => void;
  geminiApiKey?: string;
}

const MOVIE_CATEGORIES = [
  { id: "all", name: "ทั้งหมด (Home)", icon: "🎬" },
  { id: "online", name: "ดูหนังออนไลน์", icon: "🎞️" },
  { id: "new-2026", name: "หนังใหม่ 2026", icon: "✨" },
  { id: "cinema", name: "หนังชนโรง", icon: "🍿" },
  { id: "anime", name: "หนังการ์ตูน", icon: "🎬" },
  { id: "thai", name: "หนังไทย", icon: "🧭" },
  { id: "series", name: "ดูซีรีส์", icon: "📺" },
  { id: "netflix", name: "NETFLIX", icon: "🔥" },
  { id: "top-imdb", name: "TOP IMDB", icon: "🎖️" }
];

// Presets of high quality 4K movie posters
const INSTANT_MOVIE_POSTER_PRESETS = [
  {
    title: "Cyberpunk Action / Sci-Fi",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=85",
    category: "หนังใหม่ 2026"
  },
  {
    title: "Anime Fantasy / การ์ตูนอนิเมะ",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=85",
    category: "หนังการ์ตูน"
  },
  {
    title: "Cinema Blockbuster / หนังฟอร์มยักษ์",
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=85",
    category: "หนังชนโรง"
  },
  {
    title: "Series / ซีรีส์แฟนตาซี",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=85",
    category: "ดูซีรีส์"
  },
  {
    title: "Netflix Drama / สตรีมมิ่ง",
    url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1000&auto=format&fit=crop&q=85",
    category: "NETFLIX"
  }
];

export const MovieBilibiliEmbedder: React.FC<MovieBilibiliEmbedderProps> = ({
  user,
  accessToken,
  checkToken,
  connectedSheet,
  onRefreshSheet,
  geminiApiKey
}) => {
  // Step 1: Bilibili & Conversion
  const [bilibiliUrl, setBilibiliUrl] = useState("");

  // Step 2 & 3: Google Drive MP4 Video & iframe
  const [driveMp4Input, setDriveMp4Input] = useState("");
  const [extractedFileId, setExtractedFileId] = useState("");
  const [isListingDriveMp4, setIsListingDriveMp4] = useState(false);
  const [driveMp4Files, setDriveMp4Files] = useState<Array<{ id: string; name: string; webViewLink?: string; size?: string }>>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [isSettingPermission, setIsSettingPermission] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState(false);

  // Step 4: Movie Metadata (Title, Tagline, Details, Category)
  const [movieTitle, setMovieTitle] = useState("");
  const [movieCategory, setMovieCategory] = useState("หนังใหม่ 2026");
  const [movieTagline, setMovieTagline] = useState("");
  const [movieSynopsis, setMovieSynopsis] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("ai_studio_code");
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);

  // Step 5: AI Poster Generation & Vercel Blob Upload
  const [posterUrl, setPosterUrl] = useState("");
  const [movieImagePrompt, setMovieImagePrompt] = useState("");
  const [posterModel, setPosterModel] = useState("gemini-imagen");
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterStatusText, setPosterStatusText] = useState("");
  
  // Vercel Blob States
  const [vercelBlobToken, setVercelBlobToken] = useState("");
  const [isUploadingBlob, setIsUploadingBlob] = useState(false);
  const [blobStatusMessage, setBlobStatusMessage] = useState<string | null>(null);
  const [localFileBase64, setLocalFileBase64] = useState<string | null>(null);
  const [localFileType, setLocalFileType] = useState<string>("");
  const [localFileName, setLocalFileName] = useState<string>("");

  // Preview and Feedback States
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"player" | "iframeCode" | "htmlBox" | "poster">("player");
  const [posterTab, setPosterTab] = useState<"ai-gen" | "presets" | "upload">("ai-gen");

  // Load saved Vercel Blob Token from localStorage
  useEffect(() => {
    const savedBlobToken = localStorage.getItem("vercel_blob_token");
    if (savedBlobToken) {
      setVercelBlobToken(savedBlobToken);
    }
  }, []);

  // Helper to extract Google Drive File ID from various link formats
  const extractDriveId = (input: string): string => {
    if (!input) return "";
    const clean = input.trim();
    
    // Format 1: https://drive.google.com/file/d/FILE_ID/view...
    const match1 = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1 && match1[1]) return match1[1];

    // Format 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
    const match2 = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2 && match2[1]) return match2[1];

    // Format 3: Raw 25-50 char ID
    if (/^[a-zA-Z0-9_-]{20,50}$/.test(clean)) {
      return clean;
    }

    return "";
  };

  // Update extracted File ID when drive input changes
  useEffect(() => {
    const fid = extractDriveId(driveMp4Input);
    setExtractedFileId(fid);
  }, [driveMp4Input]);

  // Construct iframe embed src URL
  const iframeSrc = extractedFileId 
    ? `https://drive.google.com/file/d/${extractedFileId}/preview` 
    : "";

  // Complete iframe player code
  const iframeCode = extractedFileId
    ? `<iframe src="https://drive.google.com/file/d/${extractedFileId}/preview" width="100%" height="480" allow="autoplay; fullscreen" allowfullscreen frameborder="0" class="w-full aspect-video rounded-xl shadow-lg border border-slate-700"></iframe>`
    : "";

  // Complete Movie HTML Card/Player for potnuengshop.com
  const completeMovieHtml = `<div class="movie-player-container bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 text-white shadow-2xl max-w-4xl mx-auto my-4 font-sans">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
    <div>
      <div class="flex items-center gap-2 mb-1">
        <span class="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">${movieCategory}</span>
        <span class="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold">4K HD ดูฟรี</span>
      </div>
      <h2 class="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">${movieTitle || "ชื่อภาพยนตร์"}</h2>
      ${movieTagline ? `<p class="text-xs text-amber-300 font-semibold mt-0.5">${movieTagline}</p>` : ""}
    </div>
    <div class="text-xs text-slate-400">
      ระบบสตรีมมิ่ง PotNuengShop (Hub Free)
    </div>
  </div>

  <div class="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner border border-slate-800 mb-4">
    ${iframeCode || `<div class="w-full h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center"><p class="text-sm font-semibold">กรุณาระบุไฟล์ MP4 จาก Google Drive เพื่อสร้างเครื่องเล่น</p></div>`}
  </div>

  ${movieSynopsis ? `
  <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 mt-3">
    <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
      <span>📖</span> เรื่องย่อ / รายละเอียด
    </h4>
    <p class="text-sm text-slate-300 leading-relaxed">${movieSynopsis}</p>
  </div>` : ""}

  <div class="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
    <div class="flex items-center gap-2">
      <span>แหล่งที่มา: Bilibili.tv</span>
      <span>•</span>
      <span>Google Drive Direct Stream</span>
    </div>
    <div class="text-emerald-400 font-semibold">
      ✓ เล่นได้ทุกอุปกรณ์ (PC, Mobile, Tablet, Smart TV)
    </div>
  </div>
</div>`;

  // Copy to clipboard helper
  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1-Click Open Snapwc & Copy Bilibili URL
  const handleOpenSnapwc = () => {
    if (bilibiliUrl.trim()) {
      navigator.clipboard.writeText(bilibiliUrl.trim());
    }
    window.open("https://snapwc.com/", "_blank", "noopener,noreferrer");
  };

  // Open Bilibili.tv
  const handleOpenBilibili = () => {
    window.open("https://www.bilibili.tv/", "_blank", "noopener,noreferrer");
  };

  // Open Altools.ai Compress Video
  const handleOpenAltoolsCompress = () => {
    window.open("https://altools.ai/th/compress-video", "_blank", "noopener,noreferrer");
  };

  // Open Google Drive in new tab
  const handleOpenGoogleDrive = () => {
    window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener,noreferrer");
  };

  // List MP4 files from user's Google Drive
  const handleListDriveMp4Files = async (query = "") => {
    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("กรุณาลงชื่อเข้าใช้งาน Google ด้วยบัญชีของคุณเพื่อเชื่อมต่อ Google Drive");
      return;
    }

    setIsListingDriveMp4(true);
    setErrorMessage(null);

    try {
      let q = "trashed=false and (mimeType contains 'video/' or name contains '.mp4' or name contains '.mkv' or name contains '.webm')";
      if (query.trim()) {
        q += ` and name contains '${query.trim().replace(/'/g, "\\'")}'`;
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink,size,mimeType)&pageSize=20&orderBy=modifiedTime desc`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${curToken}` }
      });

      if (!res.ok) {
        throw new Error("ดึงข้อมูลวิดีโอจาก Google Drive ไม่สำเร็จ");
      }

      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setDriveMp4Files(data.files);
      } else {
        const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&fields=files(id,name,webViewLink,size,mimeType)&pageSize=15&orderBy=modifiedTime desc`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${curToken}` }
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          setDriveMp4Files(fbData.files || []);
        } else {
          setDriveMp4Files([]);
        }
      }
    } catch (err: any) {
      console.error("List Drive MP4 error:", err);
      setErrorMessage(err.message || "เกิดปัญหาในการค้นหาไฟล์ใน Google Drive");
    } finally {
      setIsListingDriveMp4(false);
    }
  };

  // Select file from Drive list
  const handleSelectDriveFile = (file: { id: string; name: string; webViewLink?: string }) => {
    setDriveMp4Input(file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`);
    setExtractedFileId(file.id);
    if (!movieTitle) {
      const cleanName = file.name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]/g, " ");
      setMovieTitle(cleanName);
      // Generate initial prompt for image
      setMovieImagePrompt(`Cinematic movie poster for "${cleanName}", 8k resolution, photorealistic masterpiece, vivid dramatic lighting, IMAX typography, vibrant background, cinematic composition`);
    }
  };

  // Make Google Drive file publicly viewable
  const handleSetPublicPermission = async () => {
    if (!extractedFileId) {
      setErrorMessage("กรุณาระบุลิงก์หรือเลือกไฟล์ Google Drive ก่อนทำการตั้งค่าสิทธิ์");
      return;
    }

    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("เซสชั่น Google หมดอายุ กรุณาลงชื่อเข้าใช้อีกครั้ง");
      return;
    }

    setIsSettingPermission(true);
    setErrorMessage(null);
    setPermissionSuccess(false);

    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${extractedFileId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role: "reader",
          type: "anyone"
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || "ไม่สามารถเปิดสิทธิ์สาธารณะได้ กรุณาตรวจสอบว่าคุณเป็นเจ้าของไฟล์นี้");
      }

      setPermissionSuccess(true);
      setTimeout(() => setPermissionSuccess(false), 4000);
    } catch (err: any) {
      console.error("Set permission error:", err);
      setErrorMessage(err.message || "ไม่สามารถตั้งค่าสิทธิ์สาธารณะได้");
    } finally {
      setIsSettingPermission(false);
    }
  };

  // AI Generator for Movie Tagline & Synopsis
  const handleGenerateMovieCopy = async () => {
    const titleToUse = (movieTitle || "ภาพยนตร์").trim();
    const keyToUse = (geminiApiKey || localStorage.getItem("custom_gemini_api_key") || "").trim();

    setIsGeneratingCopy(true);
    setErrorMessage(null);

    const prompt = `You are a movie marketing expert and creative copywriter.
Create a captivating Thai marketing tagline (คำโปรย) and an engaging movie synopsis/details (เรื่องย่อ / รายละเอียด) for the following movie or anime:
Title: "${titleToUse}"
Category: "${movieCategory}"
Bilibili Link / Context: "${bilibiliUrl || ""}"

Requirements:
1. tagline: A short, high-energy, persuasive tagline in Thai (1 sentence, exciting and attention-grabbing, e.g. "มหาศึกการต่อสู้เหนือจินตนาการ คมชัดพากย์ไทย 4K ดูฟรีครบทุกตอน").
2. synopsis: An engaging 2-3 paragraph Thai synopsis explaining the plot hook, character stakes, and why viewers shouldn't miss it.
3. imagePrompt: A rich English prompt for an ultra-realistic 8K cinematic movie poster suitable for AI image generators.

Return ONLY valid JSON:
{"tagline": "...", "synopsis": "...", "imagePrompt": "..."}`;

    try {
      let parsed: { tagline?: string; synopsis?: string; imagePrompt?: string } | null = null;

      // 1. Try server endpoint
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: prompt,
            geminiApiKey: keyToUse || undefined
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.tagline || data.featuresSummary || data.imagePrompt) {
            parsed = {
              tagline: data.tagline?.replace(/<[^>]*>?/gm, "").trim() || "",
              synopsis: data.featuresSummary?.replace(/<[^>]*>?/gm, "").trim() || "",
              imagePrompt: data.imagePrompt || ""
            };
          }
        }
      } catch (srvErr) {
        console.warn("Server copy gen failed, attempting direct Gemini call...", srvErr);
      }

      // 2. Direct Gemini Call Fallback
      if (!parsed && keyToUse) {
        const models = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
        for (const m of models) {
          try {
            const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${keyToUse}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
              })
            });
            const dJson = await directRes.json();
            if (directRes.ok && dJson.candidates?.[0]?.content?.parts?.[0]?.text) {
              parsed = JSON.parse(dJson.candidates[0].content.parts[0].text);
              break;
            }
          } catch (e) {
            console.warn(`Model ${m} failed:`, e);
          }
        }
      }

      if (parsed) {
        if (parsed.tagline) setMovieTagline(parsed.tagline);
        if (parsed.synopsis) setMovieSynopsis(parsed.synopsis);
        if (parsed.imagePrompt) setMovieImagePrompt(parsed.imagePrompt);
      } else {
        // Fallback default copy if AI keys are not configured
        setMovieTagline(`มหากาพย์ความมันส์ระดับ 4K ฉบับพากย์ไทย สตรีมมิ่งดูฟรีที่นี่ (${movieCategory})`);
        setMovieSynopsis(`สัมผัสเรื่องราวสุดเข้มข้นของ "${titleToUse}" การผจญภัยและการต่อสู้อันดุเดือดที่แฟนหนังไม่ควรพลาด รับชมแบบสตรีมมิ่งความละเอียดสูง ไม่กระตุก ผ่านระบบ PotNuengShop.`);
        setMovieImagePrompt(`Cinematic movie poster of "${titleToUse}", 8k resolution, photorealistic, dramatic movie lighting, IMAX typography banner, masterpiece, vibrant colors`);
      }
    } catch (err: any) {
      console.error("Generate copy error:", err);
      setErrorMessage("ไม่สามารถสร้างคำโปรยด้วย AI ได้ กรุณากรอกด้วยตนเอง");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // AI Image Generator for Movie Poster
  const handleGeneratePosterImage = async () => {
    setIsGeneratingPoster(true);
    setPosterStatusText("กำลังสั่งสร้างโปสเตอร์หนังระดับ 8K ด้วย AI...");
    setErrorMessage(null);

    const titleToUse = movieTitle || "Cinematic Movie";
    const basePrompt = movieImagePrompt || `Cinematic official movie poster for "${titleToUse}", 8k resolution, dramatic blockbuster lighting, IMAX typography, vibrant action, photorealistic studio render`;
    const keyToUse = (geminiApiKey || localStorage.getItem("custom_gemini_api_key") || "").trim();

    try {
      const response = await fetch("/api/leonardo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: basePrompt,
          clientApiKey: "free",
          geminiApiKey: keyToUse || undefined,
          width: 768,
          height: 1152, // 2:3 vertical movie poster aspect ratio
          modelId: posterModel === "gemini-imagen" ? "gemini-imagen" : posterModel
        })
      });

      if (!response.ok) {
        throw new Error("สร้างรูปภาพโปสเตอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      const initData = await response.json();
      if (initData.imageUrl) {
        setPosterUrl(initData.imageUrl);
        setPosterStatusText("✨ สร้างภาพโปสเตอร์หนังสำเร็จแล้ว!");
        setActivePreviewTab("poster");
        setIsGeneratingPoster(false);
        return;
      }

      const genId = initData.sdGenerationJob?.generationId;
      if (genId) {
        // Poll for completion
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes = await fetch(`/api/leonardo/status/${genId}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              const job = statusData.generations_by_pk;
              if (job?.status === "COMPLETE" && job.generated_images?.[0]?.url) {
                clearInterval(interval);
                setPosterUrl(job.generated_images[0].url);
                setPosterStatusText("✨ สร้างโปสเตอร์สำเร็จเรียบร้อย!");
                setActivePreviewTab("poster");
                setIsGeneratingPoster(false);
                return;
              }
            }
          } catch (e) {
            console.warn("Poll error:", e);
          }

          if (attempts >= 15) {
            clearInterval(interval);
            setIsGeneratingPoster(false);
            setPosterStatusText("");
          }
        }, 2500);
      } else {
        setIsGeneratingPoster(false);
      }
    } catch (err: any) {
      console.error("Poster gen error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการสั่งสร้างโปสเตอร์ AI");
      setIsGeneratingPoster(false);
      setPosterStatusText("");
    }
  };

  // Local File Poster Picker
  const handleLocalPosterFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFileName(file.name);
    setLocalFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setLocalFileBase64(base64);
      setPosterUrl(result);
      setActivePreviewTab("poster");
    };
    reader.readAsDataURL(file);
  };

  // Save Vercel Blob Token handler
  const handleSaveBlobToken = (tok: string) => {
    const cleaned = tok.replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "").replace(/["']/g, "").trim();
    setVercelBlobToken(cleaned);
    localStorage.setItem("vercel_blob_token", cleaned);
    setBlobStatusMessage("✅ บันทึก Token แล้ว");
    setTimeout(() => setBlobStatusMessage(null), 3000);
  };

  // Upload Poster Image to Vercel Blob Storage
  const handleUploadPosterToVercelBlob = async () => {
    const imageToUpload = localFileBase64 ? `data:${localFileType || 'image/jpeg'};base64,${localFileBase64}` : posterUrl;
    if (!imageToUpload) {
      setErrorMessage("กรุณาสร้างภาพโปสเตอร์ หรือเลือกรูปภาพก่อนทำการอัปโหลด");
      return;
    }

    const cleanedToken = vercelBlobToken
      .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "")
      .replace(/["']/g, "")
      .trim();

    if (!cleanedToken) {
      setErrorMessage("กรุณาระบุ Vercel BLOB_READ_WRITE_TOKEN เพื่ออัปโหลดไฟล์ หรือใช้รูปจากคลังภาพได้ทันที");
      setBlobStatusMessage("⚠️ ยังไม่ได้ระบุ BLOB_READ_WRITE_TOKEN (สามารถกรอก Token ด้านล่างได้เลย)");
      return;
    }

    setIsUploadingBlob(true);
    setErrorMessage(null);
    setBlobStatusMessage("กำลังอัปโหลดรูปภาพโปสเตอร์เข้าสู่ Vercel Blob Storage...");

    try {
      const safeTitle = (movieTitle || "movie_poster").toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const fileNameToUse = `${safeTitle}_${Date.now()}.jpg`;

      const response = await fetch("/api/vercel/blob/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageToUpload,
          customToken: cleanedToken,
          fileName: fileNameToUse
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.url) {
        throw new Error(resData.error || "อัปโหลดภาพเข้าสู่ Vercel Blob ไม่สำเร็จ");
      }

      setPosterUrl(resData.url);
      setBlobStatusMessage(`🎉 อัปโหลดขึ้น BLOB สำเร็จ! ลิงก์ถาวร: ${resData.url.substring(0, 45)}...`);
      setActivePreviewTab("poster");
    } catch (err: any) {
      console.error("Vercel Blob upload error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการอัปโหลดภาพลง BLOB");
      setBlobStatusMessage(null);
    } finally {
      setIsUploadingBlob(false);
    }
  };

  // Save Movie Row to Google Sheet (ai_studio_code / custom tab)
  const handleSaveMovieToSheet = async () => {
    if (!extractedFileId && !iframeCode) {
      setErrorMessage("กรุณาระบุไฟล์วิดีโอ MP4 จาก Google Drive ก่อนทำการบันทึกลงชีต");
      return;
    }

    if (!connectedSheet) {
      setErrorMessage("กรุณาเชื่อมต่อ Google Sheet ก่อนทำการบันทึกข้อมูล");
      return;
    }

    const titleToUse = (movieTitle || "ภาพยนตร์ Bilibili MP4").trim();
    const confirmed = window.confirm(
      `ยืนยันบันทึกภาพยนตร์ "${titleToUse}" (${movieCategory})\nแท็บเป้าหมาย: "${selectedWorksheet}"\nชีต: "${connectedSheet.title}" ใช่หรือไม่?`
    );
    if (!confirmed) return;

    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("เซสชั่น Google หมดอายุ กรุณาลงชื่อเข้าใช้อีกครั้ง");
      return;
    }

    setIsSavingToSheet(true);
    setErrorMessage(null);
    setSaveStatusMessage(null);

    const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    const directDrivePreviewUrl = `https://drive.google.com/file/d/${extractedFileId}/preview`;
    const directDriveViewUrl = `https://drive.google.com/file/d/${extractedFileId}/view`;

    // Row Data Format:
    // Col A: Timestamp
    // Col B: Movie Title / ชื่อหนัง
    // Col C: Category / หมวดหมู่
    // Col D: Tagline / คำโปรย
    // Col E: Synopsis / เรื่องย่อ & รายละเอียด
    // Col F: iframe Video Player Code (รหัสเล่นหนัง)
    // Col G: Poster Image URL / ลิงก์รูปภาพ BLOB
    // Col H: Google Drive MP4 Link
    // Col I: Bilibili Source URL
    const rowData = [
      timestamp,
      titleToUse,
      movieCategory,
      movieTagline || `4K HD ดูฟรี ฉบับพากย์ไทย คมชัดสมบูรณ์แบบ`,
      movieSynopsis || `<p class="text-slate-300">${titleToUse} (${movieCategory}) สตรีมมิ่งความละเอียดสูงบน PotNuengShop</p>`,
      iframeCode,
      posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80",
      directDrivePreviewUrl || directDriveViewUrl,
      bilibiliUrl || "https://www.bilibili.tv/"
    ];

    try {
      const targetTab = selectedWorksheet || "ai_studio_code";
      
      // Ensure tab exists
      try {
        const testTabRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:A1`, {
          headers: { Authorization: `Bearer ${curToken}` }
        });

        if (testTabRes.status === 400 || testTabRes.status === 404) {
          // Add sheet tab
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}:batchUpdate`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${curToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              requests: [{ addSheet: { properties: { title: targetTab } } }]
            })
          });

          // Write header row (A1:I1)
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:I1?valueInputOption=USER_ENTERED`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${curToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              values: [["Timestamp", "Movie Title (ชื่อหนัง)", "Category (หมวดหมู่)", "Tagline (คำโปรย)", "Synopsis (เรื่องย่อ)", "iframe Player Code (รหัสเล่นหนัง)", "Poster URL (BLOB)", "Google Drive Link", "Bilibili Source URL"]]
            })
          });
        }
      } catch (tabErr) {
        console.warn("Tab verification notice:", tabErr);
      }

      // Append row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/${encodeURIComponent(targetTab)}!A:I:append?valueInputOption=USER_ENTERED`;
      const appendRes = await fetch(appendUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ values: [rowData] })
      });

      if (!appendRes.ok) {
        const errJson = await appendRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "ไม่สามารถเพิ่มข้อมูลลง Google Sheets ได้");
      }

      setSaveStatusMessage(`✅ บันทึก "${titleToUse}" พร้อม iframe และรูปภาพ BLOB ลงชีต "${connectedSheet.title}" (${targetTab}) สำเร็จแล้ว!`);
      if (onRefreshSheet) onRefreshSheet();
    } catch (err: any) {
      console.error("Save Movie row error:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลหนังลง Google Sheet");
    } finally {
      setIsSavingToSheet(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8" id="movie-bilibili-embedder-section">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <Film className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  ระบบแปลงหนัง Bilibili ➔ MP4 ➔ เจนภาพ BLOB ➔ Drive ➔ iframe Google Sheets
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  potnuengshop.com
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                สร้างคำโปรย & เรื่องย่อ ➔ เจนภาพโปสเตอร์ AI ➔ อัปโหลดลง <strong className="text-pink-400">Vercel BLOB</strong> ➔ แปลง MP4 เป็น <strong className="text-indigo-400">iframe</strong> ลง Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://potnuengshop.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span>เปิดเว็บ potnuengshop.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        
        {/* Left Column: Form & Workflows (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Step 1: Bilibili to Snapwc Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">1</span>
                <h4 className="text-sm font-bold text-slate-900">
                  ดึงลิงก์หนังจาก Bilibili.tv และเปิดแปลงไฟล์ใน Snapwc.com
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenBilibili}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  เปิด bilibili.tv
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วางลิงก์วิดีโอจาก Bilibili.tv:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={bilibiliUrl}
                    onChange={(e) => setBilibiliUrl(e.target.value)}
                    placeholder="https://www.bilibili.tv/th/play/2088628/1255432..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleOpenSnapwc}
                    title="คัดลอกลิงก์และเปิดเว็บ Snapwc.com ทันที"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>แปลงเป็น MP4 ที่ snapwc.com</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Compress & Resize Video at Altools.ai */}
          <div className="bg-gradient-to-br from-pink-50/70 via-slate-50 to-purple-50/50 border border-pink-200/80 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">2</span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  ปรับขนาดและบีบอัดวิดีโอ MP4 ที่ Altools.ai
                  <span className="text-[10px] font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">
                    แนะนำให้ทำ ⭐
                  </span>
                </h4>
              </div>
              <span className="text-[11px] text-pink-700 font-semibold bg-pink-100/70 px-2.5 py-0.5 rounded-md border border-pink-200 hidden sm:inline">
                แก้ปัญหาวิดีโอใหญ่เกิน 100MB
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAltoolsCompress}
                  className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>🗜️ เปิด altools.ai บีบอัดวิดีโอ (compress-video)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenGoogleDrive}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>📁 เปิด Google Drive อัปโหลดไฟล์ MP4</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Google Drive MP4 to IFRAME Converter */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">3</span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  แปลงไฟล์ MP4 เป็น IFRAME สำหรับ Google Sheet
                </h4>
              </div>
              <span className="text-[11px] font-medium text-slate-500">
                บัญชี: <strong className="text-amber-700">{user?.email || "pnmall4u@gmail.com"}</strong>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วางลิงก์ไฟล์ Google Drive MP4 หรือ File ID:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={driveMp4Input}
                    onChange={(e) => setDriveMp4Input(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1hGi_J7QacacnfeIsJQQpjfIbDN5rAZ4W/view"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  {extractedFileId && (
                    <button
                      type="button"
                      onClick={handleSetPublicPermission}
                      disabled={isSettingPermission}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shrink-0 ${
                        permissionSuccess 
                          ? "bg-emerald-600 text-white" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                      }`}
                    >
                      {isSettingPermission ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : permissionSuccess ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{permissionSuccess ? "เปิดสิทธิ์สาธารณะแล้ว!" : "🔓 เปิดสิทธิ์แชร์"}</span>
                    </button>
                  )}
                </div>

                {extractedFileId && (
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-600">
                      File ID: <strong className="font-mono text-indigo-600">{extractedFileId}</strong>
                    </span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      พร้อมแปลงเป็น iframe
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Drive Picker */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">หรือค้นหาและเลือกไฟล์จาก Google Drive ของคุณ:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleListDriveMp4Files(driveSearchQuery)}
                      placeholder="ค้นหาชื่อไฟล์..."
                      className="bg-white border border-slate-300 rounded px-2 py-0.5 text-[11px] w-32 focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleListDriveMp4Files(driveSearchQuery)}
                      disabled={isListingDriveMp4}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isListingDriveMp4 ? "animate-spin" : ""}`} />
                      ค้นหาไฟล์
                    </button>
                  </div>
                </div>

                {driveMp4Files.length > 0 && (
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                    {driveMp4Files.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectDriveFile(f)}
                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-amber-50 transition-colors ${extractedFileId === f.id ? "bg-amber-50 font-bold text-amber-900" : "text-slate-700"}`}
                      >
                        <span className="truncate max-w-[280px] flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {extractedFileId === f.id ? "✓ เลือกแล้ว" : "คลิกเพื่อใช้"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Converted iframe Box */}
              {iframeCode && (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> โค้ด IFRAME พร้อมลง Google Sheet:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(iframeCode)}
                      className="text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? "คัดลอกแล้ว!" : "คัดลอก iframe"}</span>
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-emerald-300 break-all whitespace-pre-wrap bg-slate-950 p-2 rounded border border-slate-800/80">
                    {iframeCode}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Step 4: Movie Copywriting (Title, Tagline, Details, Category) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">4</span>
                <h4 className="text-sm font-bold text-slate-900">
                  ข้อมูลภาพยนตร์, คำโปรย และรายละเอียด
                </h4>
              </div>
              <button
                type="button"
                onClick={handleGenerateMovieCopy}
                disabled={isGeneratingCopy || !movieTitle}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingCopy ? "animate-spin" : ""}`} />
                <span>{isGeneratingCopy ? "AI กำลังคิดคำโปรย..." : "✨ AI ช่วยเขียนคำโปรย & เรื่องย่อ"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อภาพยนตร์ / ซีรีส์:
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="เช่น มหาศึกคนชนเทพ / Spy x Family Season 2"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่เว็บ potnuengshop.com:
                </label>
                <select
                  value={movieCategory}
                  onChange={(e) => setMovieCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                >
                  {MOVIE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tagline / คำโปรย */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>คำโปรย (Tagline / ไฮไลท์สะดุดตา):</span>
                <span className="text-[10px] text-indigo-600 font-normal">ประโยคสั้นกระชับ ดึงดูดผู้ชม</span>
              </label>
              <input
                type="text"
                value={movieTagline}
                onChange={(e) => setMovieTagline(e.target.value)}
                placeholder="เช่น ภารกิจข้ามมิติสุดระทึก ฉบับพากย์ไทย 4K ดูฟรีไม่สะดุด..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Synopsis / เรื่องย่อ & รายละเอียด */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>เรื่องย่อ & รายละเอียด (Synopsis / Details):</span>
                <span className="text-[10px] text-slate-400 font-normal">เนื้อเรื่องย่อ จุดเด่น ตัวละคร</span>
              </label>
              <textarea
                value={movieSynopsis}
                onChange={(e) => setMovieSynopsis(e.target.value)}
                rows={3}
                placeholder="ระบุเรื่องย่อสั้นๆ ปมเรื่องราว หรือรายละเอียดของตอน..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Step 5: AI Poster Workshop & Vercel Blob Upload */}
          <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-pink-50/60 border border-indigo-200/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">5</span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  เจนภาพโปสเตอร์ AI และอัปโหลดลง BLOB
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                    Vercel Blob Storage
                  </span>
                </h4>
              </div>

              {/* Tabs for Poster Source */}
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setPosterTab("ai-gen")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${posterTab === "ai-gen" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  ✨ สั่งเจนภาพ AI
                </button>
                <button
                  type="button"
                  onClick={() => setPosterTab("presets")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${posterTab === "presets" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  🖼️ คลังภาพสำเร็จรูป
                </button>
                <button
                  type="button"
                  onClick={() => setPosterTab("upload")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${posterTab === "upload" ? "bg-white text-indigo-700 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                >
                  📁 อัปโหลดจากเครื่อง
                </button>
              </div>
            </div>

            {/* Tab 1: AI Poster Generator */}
            {posterTab === "ai-gen" && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    คำสั่งสร้างภาพโปสเตอร์ (Prompt):
                  </label>
                  <textarea
                    value={movieImagePrompt}
                    onChange={(e) => setMovieImagePrompt(e.target.value)}
                    rows={2}
                    placeholder="Cinematic movie poster for action movie, 8k resolution, IMAX typography, vivid lighting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">โมเดล AI:</span>
                    <select
                      value={posterModel}
                      onChange={(e) => setPosterModel(e.target.value)}
                      className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="gemini-imagen">Google Gemini Imagen 3 (แนะนำ)</option>
                      <option value="dall-e-3">OpenAI DALL-E 3 (HD Poster)</option>
                      <option value="flux">Flux AI 8K Cinema Studio</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGeneratePosterImage}
                    disabled={isGeneratingPoster}
                    className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <Wand2 className={`w-4 h-4 ${isGeneratingPoster ? "animate-spin" : ""}`} />
                    <span>{isGeneratingPoster ? "กำลังเจนภาพโปสเตอร์..." : "🎨 สั่งเจนภาพโปสเตอร์หนัง (AI)"}</span>
                  </button>
                </div>

                {posterStatusText && (
                  <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{posterStatusText}</span>
                  </p>
                )}
              </div>
            )}

            {/* Tab 2: Preset Posters */}
            {posterTab === "presets" && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-indigo-100">
                {INSTANT_MOVIE_POSTER_PRESETS.map((pst, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPosterUrl(pst.url);
                      setActivePreviewTab("poster");
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${posterUrl === pst.url ? "border-purple-600 bg-purple-50 ring-2 ring-purple-400" : "border-slate-200 hover:border-purple-300 bg-slate-50"}`}
                  >
                    <img src={pst.url} alt={pst.title} className="w-full aspect-[2/3] object-cover rounded-md mb-1.5" />
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pst.title}</span>
                    <span className="text-[10px] text-slate-500">{pst.category}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Local File Upload */}
            {posterTab === "upload" && (
              <div className="bg-white p-4 rounded-xl border border-dashed border-indigo-200 text-center space-y-2">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto opacity-70" />
                <p className="text-xs font-semibold text-slate-700">ลากวางรูปภาพโปสเตอร์ หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLocalPosterFileChange}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                {localFileName && (
                  <p className="text-[11px] text-emerald-600 font-semibold">✓ เลือกไฟล์: {localFileName}</p>
                )}
              </div>
            )}

            {/* Vercel Blob Uploader Bar */}
            <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CloudUpload className="w-4 h-4 text-purple-600" />
                  อัปโหลดภาพโปสเตอร์เข้าสู่ Vercel BLOB Storage (URL ถาวร)
                </span>
                {posterUrl && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[200px]">
                    {posterUrl.startsWith("http") ? posterUrl.substring(0, 30) + "..." : "พร้อมอัปโหลด"}
                  </span>
                )}
              </div>

              {/* Vercel Token Input & Upload Button */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-1.5">
                  <input
                    type="password"
                    value={vercelBlobToken}
                    onChange={(e) => setVercelBlobToken(e.target.value)}
                    placeholder="BLOB_READ_WRITE_TOKEN (vercel_blob_rw_...)"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveBlobToken(vercelBlobToken)}
                    title="บันทึก Token ลงในระบบ"
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    บันทึก
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleUploadPosterToVercelBlob}
                  disabled={isUploadingBlob || (!posterUrl && !localFileBase64)}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <CloudUpload className={`w-4 h-4 ${isUploadingBlob ? "animate-spin" : ""}`} />
                  <span>{isUploadingBlob ? "กำลังอัปโหลดลง BLOB..." : "☁️ อัปโหลดลง Vercel BLOB"}</span>
                </button>
              </div>

              {blobStatusMessage && (
                <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{blobStatusMessage}</span>
                </p>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  URL โปสเตอร์ปัจจุบัน (จะถูกบันทึกลง Google Sheet):
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://...blob.vercel-storage.com/... หรือภาพจากเว็บ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Worksheet Selection & Final Save */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-800">
                แผ่นงาน Google Sheets เป้าหมาย:
              </label>
              <span className="text-[11px] text-slate-500">
                ชีต: <strong className="text-slate-800">{connectedSheet?.title || "HubFree Products Database"}</strong>
              </span>
            </div>

            <select
              value={selectedWorksheet}
              onChange={(e) => setSelectedWorksheet(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer"
            >
              <option value="ai_studio_code">ai_studio_code (แท็บหลักของเว็บ potnuengshop.com)</option>
              <option value="สำเนาของ ai_studio_code">สำเนาของ ai_studio_code</option>
              <option value="ดูหนังฟรี">ดูหนังฟรี</option>
              <option value="EA Content">EA Content</option>
            </select>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveMovieToSheet}
                disabled={isSavingToSheet || !extractedFileId}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {isSavingToSheet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึกลง Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>💾 บันทึกภาพยนตร์ & iframe ลง Google Sheet ({selectedWorksheet})</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(iframeCode)}
                disabled={!iframeCode}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-semibold text-xs px-4 py-3 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "คัดลอก iframe แล้ว!" : "คัดลอกรหัส iframe"}</span>
              </button>
            </div>

            {saveStatusMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveStatusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Player, Poster & Iframe Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white flex-1 flex flex-col shadow-lg border border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  ตัวอย่างการแสดงผล
                </h4>
              </div>

              {/* Sub tabs */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("player")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${activePreviewTab === "player" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  หน้าจอเล่น
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("poster")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${activePreviewTab === "poster" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  ภาพโปสเตอร์
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("iframeCode")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${activePreviewTab === "iframeCode" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  โค้ด iframe
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("htmlBox")}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${activePreviewTab === "htmlBox" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  HTML เต็ม
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 flex flex-col justify-center">
              {activePreviewTab === "player" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {movieCategory}
                      </span>
                      <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">
                        {movieTitle || "ชื่อภาพยนตร์"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">1080p Full HD</span>
                  </div>

                  {movieTagline && (
                    <p className="text-xs text-amber-300 font-medium italic">
                      "{movieTagline}"
                    </p>
                  )}

                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
                    {extractedFileId ? (
                      <iframe
                        src={`https://drive.google.com/file/d/${extractedFileId}/preview`}
                        className="w-full h-full border-0"
                        allow="autoplay; fullscreen"
                        allowFullScreen
                        title="Google Drive Video Player"
                      />
                    ) : (
                      <div className="p-6 text-center text-slate-500">
                        <Video className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-500" />
                        <p className="text-xs font-semibold text-slate-300">ยังไม่ได้เลือกไฟล์ MP4 จาก Google Drive</p>
                        <p className="text-[10px] text-slate-500 mt-1">วางลิงก์หรือเลือกไฟล์ในขั้นตอนที่ 3 ด้านซ้ายเพื่อดูตัวอย่างเครื่องเล่น</p>
                      </div>
                    )}
                  </div>

                  {movieSynopsis && (
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                      <span className="text-amber-400 font-bold text-[10px] block mb-0.5">เรื่องย่อ & รายละเอียด:</span>
                      {movieSynopsis}
                    </div>
                  )}
                </div>
              )}

              {/* Poster Preview */}
              {activePreviewTab === "poster" && (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="relative w-full max-w-[260px] aspect-[2/3] bg-black rounded-xl overflow-hidden border border-slate-700 shadow-xl flex items-center justify-center">
                    {posterUrl ? (
                      <img src={posterUrl} alt={movieTitle || "Movie Poster"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
                        <p className="text-xs font-semibold text-slate-300">ยังไม่มีรูปภาพโปสเตอร์</p>
                        <p className="text-[10px] text-slate-500 mt-1">สั่งเจนภาพ AI หรือเลือกจากคลังภาพในขั้นตอนที่ 5</p>
                      </div>
                    )}
                  </div>
                  {posterUrl && (
                    <div className="w-full text-center">
                      <span className="text-[10px] font-mono text-purple-300 break-all block bg-slate-950 p-1.5 rounded border border-slate-800">
                        {posterUrl}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activePreviewTab === "iframeCode" && (
                <div className="relative flex-1 flex flex-col">
                  <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap flex-1 max-h-[300px]">
                    {iframeCode || `<iframe src="https://drive.google.com/file/d/FILE_ID/preview" width="100%" height="480" allow="autoplay; fullscreen" allowfullscreen frameborder="0" class="w-full aspect-video rounded-xl shadow-lg border border-slate-700"></iframe>`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(iframeCode)}
                    disabled={!iframeCode}
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "คัดลอกเรียบร้อยแล้ว!" : "คัดลอกโค้ด iframe นี้"}</span>
                  </button>
                </div>
              )}

              {activePreviewTab === "htmlBox" && (
                <div className="relative flex-1 flex flex-col">
                  <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[10px] font-mono text-sky-300 overflow-x-auto whitespace-pre-wrap flex-1 max-h-[300px]">
                    {completeMovieHtml}
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopy(completeMovieHtml)}
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>คัดลอกโค้ด HTML ทั้งหมด</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
