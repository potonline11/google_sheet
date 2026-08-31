import React, { useState, useEffect } from "react";
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
  FolderUp
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

export const MovieBilibiliEmbedder: React.FC<MovieBilibiliEmbedderProps> = ({
  user,
  accessToken,
  checkToken,
  connectedSheet,
  onRefreshSheet,
  geminiApiKey
}) => {
  // Bilibili & Conversion State
  const [bilibiliUrl, setBilibiliUrl] = useState("");
  const [movieTitle, setMovieTitle] = useState("");
  const [movieCategory, setMovieCategory] = useState("หนังใหม่ 2026");
  const [movieSynopsis, setMovieSynopsis] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [selectedWorksheet, setSelectedWorksheet] = useState("ai_studio_code");

  // Google Drive MP4 Video State
  const [driveMp4Input, setDriveMp4Input] = useState("");
  const [extractedFileId, setExtractedFileId] = useState("");
  const [isListingDriveMp4, setIsListingDriveMp4] = useState(false);
  const [driveMp4Files, setDriveMp4Files] = useState<Array<{ id: string; name: string; webViewLink?: string; size?: string }>>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState("");
  const [isSettingPermission, setIsSettingPermission] = useState(false);
  const [permissionSuccess, setPermissionSuccess] = useState(false);

  // Status & Feedback
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSavingToSheet, setIsSavingToSheet] = useState(false);
  const [saveStatusMessage, setSaveStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"player" | "iframeCode" | "htmlBox">("player");

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

    // Format 3: Raw 25-45 char ID
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

  // Open Altools.ai Compress Video (https://altools.ai/th/compress-video)
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
        // Fallback: list all non-trashed files
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
      // Clean file extension for title
      const cleanName = file.name.replace(/\.[a-zA-Z0-9]+$/, "").replace(/[-_]/g, " ");
      setMovieTitle(cleanName);
    }
  };

  // Make Google Drive file publicly viewable (anyone with link can view)
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

  // Save Movie Row to Google Sheet
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
      `ยืนยันบันทึกภาพยนตร์ "${titleToUse}" (${movieCategory}) ลงในชีต "${connectedSheet.title}" แท็บ "${selectedWorksheet}" ใช่หรือไม่?`
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
    // Col C: Category / หมวดหมู่ (หนังใหม่ 2026, ดูหนังออนไลน์, ฯลฯ)
    // Col D: Synopsis / เรื่องย่อ (HTML / ข้อความ)
    // Col E: iframe Video Player Code (รหัสเล่นหนัง potnuengshop.com)
    // Col F: Poster Image URL / ภาพประกอบ
    // Col G: Google Drive MP4 Link / Preview URL
    // Col H: Bilibili Source URL
    const rowData = [
      timestamp,
      titleToUse,
      movieCategory,
      movieSynopsis || `<p class="text-slate-300">${titleToUse} (${movieCategory}) สตรีมมิ่งความละเอียดสูงบน PotNuengShop</p>`,
      iframeCode,
      posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&auto=format&fit=crop&q=80",
      directDrivePreviewUrl || directDriveViewUrl,
      bilibiliUrl || "https://www.bilibili.tv/"
    ];

    try {
      // 1. Ensure tab exists
      const targetTab = selectedWorksheet || "ai_studio_code";
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

          // Write header row
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:H1?valueInputOption=USER_ENTERED`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${curToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              values: [["Timestamp", "Movie Title (ชื่อหนัง)", "Category (หมวดหมู่)", "Synopsis (เรื่องย่อ HTML)", "iframe Player Code (รหัสเล่นหนัง)", "Poster URL (ภาพโปสเตอร์)", "Google Drive MP4 Link", "Bilibili Source URL"]]
            })
          });
        }
      } catch (tabErr) {
        console.warn("Tab verification notice:", tabErr);
      }

      // 2. Append row
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/${encodeURIComponent(targetTab)}!A:H:append?valueInputOption=USER_ENTERED`;
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

      setSaveStatusMessage(`✅ บันทึก "${titleToUse}" ลงชีต "${connectedSheet.title}" แผ่นงาน "${targetTab}" สำเร็จแล้ว! พร้อมแสดงผลบนเว็บไซต์ทันที`);
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
                  ระบบแปลงหนัง Bilibili ➔ MP4 ➔ บีบอัด Altools ➔ Drive ➔ iframe Google Sheets
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  potnuengshop.com
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                แปลง Bilibili เป็น MP4 (<strong className="text-emerald-400">snapwc.com</strong>) ➔ ปรับขนาดบีบอัดไฟล์ (<strong className="text-pink-400">altools.ai</strong>) ➔ เก็บใน <strong className="text-amber-400">Google Drive ({user?.email || "pnmall4u@gmail.com"})</strong> ➔ สร้าง <strong className="text-indigo-400">iframe</strong> ลง Google Sheets เพื่อแสดงผลในเว็บดูหนัง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="https://potnuengshop.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-sm"
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
        
        {/* Left Column: Workflow Steps 1 & 2 */}
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
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>💡</span>
                  <span>ระบบจะคัดลอกลิงก์ Bilibili ให้โดยอัตโนมัติ เมื่อเปิดเว็บ snapwc.com ท่านสามารถกด <kbd className="px-1 py-0.5 bg-slate-200 rounded text-[10px] font-mono">Ctrl+V</kbd> เพื่อแปลงและดาวน์โหลดไฟล์ MP4 ได้ทันที</span>
                </p>
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
              <p className="text-xs text-slate-700 leading-relaxed">
                นำไฟล์ MP4 ที่ได้ไปปรับขนาดและบีบอัดที่ <strong>altools.ai/th/compress-video</strong> เพื่อลดขนาดไฟล์ให้เหลือต่ำกว่า <strong>100MB</strong> ซึ่งจะทำให้:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-white/80 border border-pink-100 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <div>
                    <strong className="text-slate-800 text-[11px]">ไม่ติดหน้าเตือนสแกนไวรัส</strong>
                    <p className="text-[10px] text-slate-500">Google Drive จะเปิดเล่นสตรีมมิ่งทันที ไม่บังคับดาวน์โหลด</p>
                  </div>
                </div>

                <div className="bg-white/80 border border-pink-100 rounded-lg p-2.5 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-sm">✓</span>
                  <div>
                    <strong className="text-slate-800 text-[11px]">ประมวลผลเร็วใน 1 นาที</strong>
                    <p className="text-[10px] text-slate-500">ผู้เข้าชมบน potnuengshop.com โหลดดูได้ลื่นไหล ไม่กระตุก</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenAltoolsCompress}
                  className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>🗜️ เปิด altools.ai บีบอัดวิดีโอ (compress-video)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenGoogleDrive}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <FolderUp className="w-4 h-4" />
                  <span>📁 เปิด Google Drive อัปโหลดไฟล์ MP4</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Google Drive MP4 Storage & Permission */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">3</span>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  เลือกไฟล์ MP4 จาก Google Drive
                  <span className="text-[11px] font-normal text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    {user?.email || "pnmall4u@gmail.com"}
                  </span>
                </h4>
              </div>

              <button
                type="button"
                onClick={() => handleListDriveMp4Files(driveSearchQuery)}
                disabled={isListingDriveMp4}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isListingDriveMp4 ? "animate-spin" : ""}`} />
                <span>ค้นหาไฟล์ในไดรฟ์</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    วางลิงก์ไฟล์ Google Drive MP4 หรือ File ID:
                  </label>
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    💡 ดูวิธีหา File ID ด้านล่าง
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={driveMp4Input}
                    onChange={(e) => setDriveMp4Input(e.target.value)}
                    placeholder="https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0.../view หรือใส่ File ID"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  />
                  {extractedFileId && (
                    <button
                      type="button"
                      onClick={handleSetPublicPermission}
                      disabled={isSettingPermission}
                      title="ตั้งค่าให้ไฟล์นี้เปิดดูได้แบบสาธารณะ (Anyone with link) เพื่อให้เล่นบนหน้าเว็บได้"
                      className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-2 rounded-lg transition-colors shadow-xs shrink-0 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isSettingPermission ? "กำลังเปิดสิทธิ์..." : "🔓 เปิดสิทธิ์แชร์"}</span>
                    </button>
                  )}
                </div>

                {/* Warning if user pasted a Google Spreadsheet link instead of MP4 file */}
                {driveMp4Input.includes("/spreadsheets/d/") && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-950 font-bold">⚠️ ลิงก์ที่วางอยู่คือ Google Sheets (ตารางข้อมูล) ไม่ใช่ไฟล์วิดีโอ MP4</strong>
                      <p className="mt-0.5 text-[11px] text-amber-800">
                        สำหรับช่องนี้ ต้องเป็น <strong>ไฟล์วิดีโอ MP4</strong> ที่อัปโหลดไว้ใน Google Drive เพื่อนำมาทำเครื่องเล่นหนัง (เช่น ลิงก์ที่ขึ้นต้นด้วย <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950">drive.google.com/file/d/.../view</code>)
                      </p>
                    </div>
                  </div>
                )}

                {extractedFileId && (
                  <div className="mt-2 flex items-center justify-between text-[11px] bg-slate-100 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-600">
                      <strong>File ID:</strong> <code className="text-indigo-700 font-mono">{extractedFileId}</code>
                    </span>
                    {permissionSuccess ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> เปิดสิทธิ์สาธารณะสำเร็จแล้ว
                      </span>
                    ) : (
                      <span className="text-slate-500">พร้อมแปลงเป็น iframe</span>
                    )}
                  </div>
                )}

                {/* How-to Guide for Google Drive File ID */}
                <div className="mt-2.5 bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-slate-700 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900 text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>วิธีเช็คและคัดลอกลิงก์ไฟล์วิดีโอ MP4 ใน Google Drive:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700 pl-1 leading-relaxed">
                    <li>เปิด <strong>Google Drive</strong> (drive.google.com) แล้วไปที่ไฟล์วิดีโอ <span className="font-semibold text-indigo-700">.mp4</span> ที่อัปโหลดไว้</li>
                    <li><strong>คลิกขวาที่ไฟล์วิดีโอ</strong> ➔ เลือก <strong>แชร์ (Share)</strong> ➔ <strong>คัดลอกลิงก์ (Copy link)</strong></li>
                    <li>
                      นำลิงก์มาวางในช่องนี้ ลิงก์จะมีรูปแบบ: <br/>
                      <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-indigo-700 font-mono text-[10px] break-all">
                        https://drive.google.com/file/d/<strong className="bg-amber-200 text-amber-950 px-1 rounded">1A2B3C4D5E6F7G8...</strong>/view
                      </code>
                    </li>
                    <li>ตัวอักษรภาษาอังกฤษผสมตัวเลขตรงกลาง (แถบสีเหลือง) คือ <strong>File ID</strong> ระบบจะดึงออกมาแปลงเป็น iframe ให้อัตโนมัติ!</li>
                  </ol>
                </div>
              </div>

              {/* Quick Drive Video Picker Dropdown/List */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-600">
                    หรือคลิกเลือกไฟล์วิดีโอจาก Google Drive ของคุณ:
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleListDriveMp4Files(driveSearchQuery)}
                      placeholder="พิมพ์ชื่อไฟล์..."
                      className="text-[11px] border border-slate-300 rounded px-2 py-0.5 w-28 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleListDriveMp4Files(driveSearchQuery)}
                      className="p-1 bg-slate-200 hover:bg-slate-300 rounded text-slate-700"
                    >
                      <Search className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {driveMp4Files.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                    {driveMp4Files.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleSelectDriveFile(f)}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-amber-50/60 transition-colors ${extractedFileId === f.id ? "bg-amber-50 font-bold text-amber-900" : "text-slate-700"}`}
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
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center bg-white">
                    <p className="text-[11px] text-slate-500">
                      คลิกปุ่ม <strong>"ค้นหาไฟล์ในไดรฟ์"</strong> ด้านบนเพื่อดึงรายชื่อไฟล์วิดีโอ MP4 จาก Google Drive ของท่าน
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Movie Information & Category */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">4</span>
              <h4 className="text-sm font-bold text-slate-900">
                ข้อมูลภาพยนตร์และหมวดหมู่เว็บ potnuengshop.com
              </h4>
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
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  หมวดหมู่ (ตรงตามเว็บ potnuengshop.com):
                </label>
                <select
                  value={movieCategory}
                  onChange={(e) => setMovieCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                >
                  {MOVIE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เรื่องย่อ / คำโปรย (จะนำไปแสดงบนหน้าเว็บ):
              </label>
              <textarea
                value={movieSynopsis}
                onChange={(e) => setMovieSynopsis(e.target.value)}
                rows={2}
                placeholder="ระบุเรื่องย่อสั้นๆ ไฮไลท์ของเรื่อง หรือรายละเอียดตอน..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลิงก์รูปภาพโปสเตอร์ (Poster URL):
                </label>
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://... หรือปล่อยว่างเพื่อใช้ภาพอัตโนมัติ"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  แผ่นงาน Google Sheets เป้าหมาย:
                </label>
                <select
                  value={selectedWorksheet}
                  onChange={(e) => setSelectedWorksheet(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="ai_studio_code">ai_studio_code (แท็บหลักของเว็บ)</option>
                  <option value="สำเนาของ ai_studio_code">สำเนาของ ai_studio_code</option>
                  <option value="ดูหนังฟรี">ดูหนังฟรี</option>
                  <option value="EA Content">EA Content</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Button: Save to Google Sheets */}
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
                  <span>บันทึกภาพยนตร์ & iframe ลง Google Sheet ({selectedWorksheet})</span>
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

        {/* Right Column: Live Interactive Player & Iframe Code Preview */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white flex-1 flex flex-col shadow-lg border border-slate-800">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  ตัวอย่างการแสดงผลบน potnuengshop.com
                </h4>
              </div>

              {/* Sub tabs */}
              <div className="flex bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("player")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${activePreviewTab === "player" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  หน้าจอเล่นจริง
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("iframeCode")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${activePreviewTab === "iframeCode" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
                >
                  โค้ด iframe
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreviewTab("htmlBox")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${activePreviewTab === "htmlBox" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"}`}
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
                        <p className="text-[10px] text-slate-500 mt-1">วางลิงก์หรือเลือกไฟล์ในขั้นตอนที่ 2 ด้านซ้ายเพื่อดูตัวอย่างเครื่องเล่น</p>
                      </div>
                    )}
                  </div>

                  {movieSynopsis && (
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
                      <span className="text-amber-400 font-bold text-[10px] block mb-0.5">เรื่องย่อ:</span>
                      {movieSynopsis}
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
