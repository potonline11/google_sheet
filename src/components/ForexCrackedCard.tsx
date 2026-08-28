import React from "react";
import { 
  Globe, 
  Search, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2 
} from "lucide-react";

export interface ForexCrackedSearchResult {
  title: string;
  url: string;
  snippet: string;
  imageUrl?: string;
  category?: string;
}

export interface ForexCrackedData {
  title?: string;
  url: string;
  content?: string;
  downloadLinks?: { title: string; url: string }[];
  images?: string[];
  meta?: any;
}

interface ForexCrackedCardProps {
  forexCrackedCopied: boolean;
  handleCopyForexCrackedUrl: (urlToCopy?: string) => void;
  forexCrackedUrl: string;
  setForexCrackedUrl: (val: string) => void;
  handleFetchForexCracked: (targetUrl?: string) => void;
  isFetchingForexCracked: boolean;
  forexCrackedSearch: string;
  setForexCrackedSearch: (val: string) => void;
  handleSearchForexCracked: (queryOverride?: string) => void;
  forexCrackedStatus: string | null;
  setForexCrackedStatus: (val: string | null) => void;
  forexCrackedResults: ForexCrackedSearchResult[];
  setForexCrackedResults: (results: ForexCrackedSearchResult[]) => void;
  forexCrackedData: ForexCrackedData | null;
}

export const ForexCrackedCard: React.FC<ForexCrackedCardProps> = ({
  forexCrackedCopied,
  handleCopyForexCrackedUrl,
  forexCrackedUrl,
  setForexCrackedUrl,
  handleFetchForexCracked,
  isFetchingForexCracked,
  forexCrackedSearch,
  setForexCrackedSearch,
  handleSearchForexCracked,
  forexCrackedStatus,
  setForexCrackedStatus,
  forexCrackedResults,
  setForexCrackedResults,
  forexCrackedData,
}) => {
  return (
    <div 
      id="forexcracked-section" 
      className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/80 rounded-2xl p-5 shadow-md flex flex-col gap-3.5 animate-fade-in"
    >
      <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-amber-300">www.forexcracked.com</h3>
              <span className="text-[9.5px] bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded-full font-medium">
                EA Source Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-300">ค้นหา ดึงข้อมูล และเชื่อมต่อไฟล์ EA จาก ForexCracked</p>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCopyForexCrackedUrl("https://www.forexcracked.com")}
            title="คัดลอก URL เว็บไซต์ ForexCracked.com"
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs"
          >
            {forexCrackedCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-[11px] font-semibold">{forexCrackedCopied ? "คัดลอกแล้ว!" : "คัดลอกเว็บ"}</span>
          </button>
          <a
            href="https://www.forexcracked.com"
            target="_blank"
            rel="noreferrer"
            title="เปิดเว็บไซต์ www.forexcracked.com ในแท็บใหม่"
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all shadow-xs"
          >
            <span>เปิดเว็บ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Search on ForexCracked (Primary & Prominent) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-amber-400" /> ค้นหา EA บน ForexCracked.com:
          </span>
          {forexCrackedSearch && (
            <span className="text-[10px] text-amber-300 font-normal">
              (คำค้นหาปัจจุบัน: <strong className="font-semibold text-amber-200">{forexCrackedSearch}</strong>)
            </span>
          )}
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={forexCrackedSearch}
            onChange={(e) => setForexCrackedSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchForexCracked();
            }}
            placeholder="พิมพ์ชื่อ EA เช่น SuperGold, Scalper, Grid, HFT..."
            className="flex-1 text-xs bg-slate-900/90 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-500 font-medium"
          />
          <button
            type="button"
            onClick={() => handleSearchForexCracked()}
            disabled={isFetchingForexCracked || !forexCrackedSearch.trim()}
            className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
          >
            {isFetchingForexCracked ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>ค้นหา</span>
          </button>
          <a
            href={`https://forexcracked.com/?s=${encodeURIComponent(forexCrackedSearch.trim() || "EA")}`}
            target="_blank"
            rel="noreferrer"
            title="เปิดผลค้นหาบนเว็บ ForexCracked ในแท็บใหม่"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-2.5 rounded-xl flex items-center justify-center transition-all shrink-0"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Popular Search Tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {[
            { label: "🥇 Gold / XAUUSD", q: "Gold" },
            { label: "⚡ Scalper EA", q: "Scalper" },
            { label: "🤖 AI Neural", q: "AI Bot" },
            { label: "📈 Trend System", q: "Trend" },
            { label: "🛡️ Grid Recovery", q: "Grid" },
          ].map((tag, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setForexCrackedSearch(tag.q);
                handleSearchForexCracked(tag.q);
              }}
              className="text-[10px] bg-slate-800/90 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-400/40 px-2 py-0.5 rounded-md transition-all cursor-pointer"
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* URL Fetch Input Box (Secondary) */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
        <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span>📥 หรือวางลิงก์บทความเพื่อดึงข้อมูลเข้าสู่ฟอร์ม:</span>
          {forexCrackedUrl && (
            <button
              type="button"
              onClick={() => handleCopyForexCrackedUrl(forexCrackedUrl)}
              className="text-[10px] text-amber-300 hover:underline flex items-center gap-0.5"
            >
              <Copy className="w-3 h-3" /> คัดลอกลิงก์นี้
            </button>
          )}
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={forexCrackedUrl}
            onChange={(e) => setForexCrackedUrl(e.target.value)}
            placeholder="https://forexcracked.com/... (วาง URL บทความ EA)"
            className="flex-1 text-xs bg-slate-900/90 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-500 font-mono"
          />
          <button
            type="button"
            onClick={() => handleFetchForexCracked()}
            disabled={isFetchingForexCracked || !forexCrackedUrl.trim()}
            className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-slate-200 border border-slate-600 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
          >
            {isFetchingForexCracked ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[11px]">กำลังดึง...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>ดึงข้อมูล EA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {forexCrackedStatus && (
        <div className="bg-slate-900/90 border border-amber-500/30 text-amber-300 p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
          <span className="leading-tight">{forexCrackedStatus}</span>
          <button
            type="button"
            onClick={() => setForexCrackedStatus(null)}
            className="text-slate-400 hover:text-slate-200 text-[10px] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Results Drawer */}
      {forexCrackedResults.length > 0 && (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 flex flex-col gap-2 max-h-[300px] overflow-y-auto shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-amber-300">
                🎯 ผลการค้นหา ({forexCrackedResults.length} รายการ):
              </span>
              <span className="text-[9.5px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">คลิกดึงเข้าฟอร์มได้ทันที</span>
            </div>
            <button
              type="button"
              onClick={() => setForexCrackedResults([])}
              className="text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              ซ่อนผลลัพธ์
            </button>
          </div>
          {forexCrackedResults.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/40 rounded-xl p-2.5 flex items-start gap-2.5 transition-all shadow-xs"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700 shrink-0 bg-slate-900"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9.5px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded">
                        {item.category || "Forex EA"}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 hover:text-amber-200 leading-snug line-clamp-1">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>
                {item.snippet && (
                  <p className="text-[10.5px] text-slate-400 line-clamp-1 leading-normal">{item.snippet}</p>
                )}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForexCrackedUrl(item.url);
                      handleFetchForexCracked(item.url);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>ดึงเข้าฟอร์ม</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyForexCrackedUrl(item.url)}
                    title="คัดลอกลิงก์บทความนี้"
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5 text-amber-400" />
                    <span>คัดลอกลิงก์</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-700/80 hover:bg-slate-600 text-slate-300 text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
                    title="เปิดอ่านบทความบนเว็บ ForexCracked"
                  >
                    <span>เปิดดู</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fetched Data Summary Badges */}
      {forexCrackedData && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ดึงบทความ: {forexCrackedData.title}
            </span>
            <button
              type="button"
              onClick={() => handleCopyForexCrackedUrl(forexCrackedData.url)}
              className="text-[10px] text-emerald-300 hover:underline flex items-center gap-0.5"
            >
              <Copy className="w-3 h-3" /> คัดลอกลิงก์ต้นทาง
            </button>
          </div>
          {forexCrackedData.downloadLinks && forexCrackedData.downloadLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-0.5">
              <span className="text-[9.5px] text-slate-400">ลิงก์ดาวน์โหลดที่พบ:</span>
              {forexCrackedData.downloadLinks.map((dl: any, dIdx: number) => (
                <a
                  key={dIdx}
                  href={dl.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[9.5px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-colors"
                >
                  <span>{dl.title || "ดาวน์โหลด"}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
