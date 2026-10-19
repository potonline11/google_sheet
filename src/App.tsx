import { useState, useEffect, useRef, ChangeEvent } from "react";
import { 
  FileSpreadsheet, 
  Sparkles, 
  Code2, 
  Layout, 
  RefreshCw, 
  Plus, 
  Check, 
  Copy, 
  Trash2, 
  ExternalLink, 
  LogOut, 
  BookOpen, 
  Database,
  ArrowRight,
  User,
  AlertCircle,
  Image as ImageIcon,
  CloudLightning,
  HardDrive,
  Key,
  Globe,
  Play,
  CheckCircle2,
  ShieldCheck,
  Search,
  Upload,
  Eye,
  EyeOff,
  Wand2,
  Dices,
  Layers,
  Film,
  Tv,
  Video,
  Cloud,
  FileText,
  Download,
  FolderDown,
  Laptop,
  Cpu,
  MonitorPlay,
  Save,
  FolderOpen
} from "lucide-react";
import * as XLSX from "xlsx";
import { initAuth, googleSignIn, logout, getAccessToken } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";
import { EAContent, GoogleSheetInfo, OneDriveInfo, ContentCategory } from "./types";
import { ForexCrackedCard } from "./components/ForexCrackedCard";
import { MovieBilibiliEmbedder } from "./components/MovieBilibiliEmbedder";

// Software Marketing & 3D Workstation Image Style Presets
const SOFTWARE_IMAGE_STYLE_PRESETS = [
  {
    id: "software-box-3d",
    name: "📦 กล่องซอฟต์แวร์ 3D & Holographic Box Mockup (พรีเมียม 8K)",
    promptSuffix: "At the very top, large glowing neon 3D metallic header text displaying the exact software name. Center features a sleek, high-tech 3D software box packaging mockup with glossy embossed typography and vibrant LED edge lighting. In the background, a futuristic workstation with dual 4K curved displays showing the software UI and live timeline, volumetric cinematic studio lighting, sharp 8k resolution, photorealistic commercial product photography masterpiece"
  },
  {
    id: "creative-editing-studio",
    name: "🖥️ สเตชั่นตัดต่อ & ครีเอทีฟมัลติสกรีน (DaVinci / Adobe Studio)",
    promptSuffix: "At the very top, large glowing 3D metallic neon title header displaying the exact software name. Center shows a luxury high-end video editing command desk with dual OLED monitors displaying multi-track video timeline, 8K color grading wheels, and visual effects nodes. Clean dark studio aesthetic with glowing violet and teal ambient lights, ultra-sharp focus, 8k resolution"
  },
  {
    id: "cyber-tech-hologram",
    name: "⚡ ไซเบอร์ไฮเทค & นีออนโปรดักชัน (Cyber Tech & UI)",
    promptSuffix: "At the very top, bold futuristic neon title text displaying the exact software name. Center stage features floating holographic user interface panels, 3D wireframe render elements, and floating particle data streams. Dynamic purple and electric cyan lighting, octane render, 8k photorealistic commercial poster"
  },
  {
    id: "minimal-clean-tech",
    name: "🚀 มินิมอลโมเดิร์น & ซอฟต์แวร์แดชบอร์ด (Clean Minimal Tech)",
    promptSuffix: "At the very top, elegant modern metallic title header displaying the exact software name. Minimalist architectural creative workspace, ultra-wide curved screen showing sleek software interface, soft daylight studio illumination, Scandinavian aesthetic, 8k photorealistic commercial presentation"
  }
];

const INSTANT_SOFTWARE_GALLERY = [
  {
    id: "davinci-studio-monitor",
    title: "🎬 สเตชั่นตัดต่อวิดีโอ & Color Grading DaVinci 8K",
    badge: "DaVinci Video",
    url: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "software-tech-workspace",
    title: "💻 จอมอนิเตอร์โปรแกรมเมอร์ & ซอฟต์แวร์ทูลส์",
    badge: "Software Dev",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "creative-multitrack",
    title: "🎨 สตูดิโอครีเอทีฟกราฟิก & โมชัน VFX",
    badge: "Creative VFX",
    url: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cyber-security-dashboard",
    title: "🛡️ ซิสเต็มยูทิลิตี้ & ซอฟต์แวร์แดชบอร์ด",
    badge: "System Utility",
    url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "sound-audio-studio",
    title: "🎧 สตูดิโอบันทึกเสียง & ซาวด์เอนจิเนียริ่ง",
    badge: "Audio Studio",
    url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "futuristic-hologram-ui",
    title: "🌐 โฮโลแกรมไฮเทค 3D & อัลกอริทึม",
    badge: "Holo UI",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
  }
];

const SOFTWARE_PRESETS = [
  {
    name: "DaVinci Resolve Studio 18.1.3.0008 (x64)",
    description: "โปรแกรมตัดต่อวิดีโอระดับมืออาชีพ Color Grading ขั้นเทพ และ Visual Effects สำหรับงานภาพยนตร์ 8K พร้อมระบบ DaVinci Neural Engine AI และเครื่องมือตัดต่อเสียง Fairlight ระดับสตูดิโอ"
  },
  {
    name: "Adobe Premiere Pro 2024 (v24.2) Multilingual x64",
    description: "โปรแกรมตัดต่อวิดีโอชั้นนำสำหรับครีเอเตอร์และโปรดักชัน รองรับ AI Speech Enhancement, Text-Based Editing, และเรนเดอร์ GPU ความเร็วสูงสำหรับ YouTube, TikTok และภาพยนตร์"
  },
  {
    name: "Blender 4.1 3D Studio & VFX Suite",
    description: "ชุดซอฟต์แวร์ 3D และกราฟิกแอนิเมชันระดับโลก โอเพนซอร์สเต็มรูปแบบ รองรับ Cycles GPU Rendering, Geometry Nodes และงาน Visual Effects ระดับภาพยนตร์"
  },
  {
    name: "Windows 11 Optimizer & PC Utility Pro (x64)",
    description: "โปรแกรมเพิ่มความเร็วและทำความสะอาดระบบปฏิบัติการ Windows 11 ปรับแต่งรีจิสทรี จัดการเซอร์วิสเบื้องหลัง และลดค่า Latency สำหรับสายเกมเมอร์และงานตัดต่อ"
  }
];

// Movie Presets & Showcase Data
const MOVIE_PRESETS = [
  {
    name: "Avatar: Fire and Ash (2026) [4K IMAX HDR]",
    description: "มหากาพย์ภาพยนตร์ไซไฟแฟนตาซีฟอร์มยักษ์ เรื่องราวการต่อสู้ครั้งใหม่บนดาวแพนดอร่า ปะทะชนเผ่าเถ้าถ่านสุดดุดัน กราฟิกตระการตา ระบบเสียง Dolby Atmos 7.1 และความคมชัดระดับ 4K HDR",
    bilibiliUrl: "https://www.bilibili.tv/th/video/avatar-fire-and-ash-4k"
  },
  {
    name: "Demon Slayer: Infinity Castle Arc (ดาบพิฆาตอสูร ภาคปราสาทไร้ขอบเขต)",
    description: "ภาพยนตร์อนิเมะฟอร์มยักษ์แห่งปี การต่อสู้ครั้งสุดท้ายระหว่างหน่วยพิฆาตอสูรและมุซันในปราสาทไร้ขอบเขต แอนิเมชันระดับปรากฏการณ์จาก Ufotable ความคมชัด 4K พากย์ไทย/ซับไทย",
    bilibiliUrl: "https://www.bilibili.tv/th/video/demon-slayer-infinity-castle"
  },
  {
    name: "Oppenheimer (4K UHD Director's Cut) พากย์ไทย",
    description: "ภาพยนตร์ชีวประวัติยอดเยี่ยมรางวัลออสการ์ ผลงานกำกับของ คริสโตเฟอร์ โนแลน ถ่ายทอดเรื่องราวของ เจ. โรเบิร์ต ออปเพนไฮเมอร์ บิดาแห่งระเบิดปรมาณู ระบบภาพ IMAX 70mm",
    bilibiliUrl: "https://www.bilibili.tv/th/video/oppenheimer-movie-4k"
  },
  {
    name: "Cyberpunk: Edgerunners (4K Ultra HD) ครบทุกตอน",
    description: "ซีรีส์แอนิเมะไซไฟแอ็กชันสุดเดือดในเมือง Night City ผลงานจากสตูดิโอ Trigger และ CD Projekt RED แสงสีนีออน ดนตรีประกอบระดับตำนาน พากย์ไทยเต็มเรื่อง",
    bilibiliUrl: "https://www.bilibili.tv/th/video/cyberpunk-edgerunners-hd"
  }
];

const MOVIE_IMAGE_STYLE_PRESETS = [
  {
    id: "cinema-blockbuster",
    name: "🍿 โปสเตอร์ฮอลลีวูดฟอร์มยักษ์ (Blockbuster Cinema Poster 8K)",
    promptSuffix: "At the very top, large glowing 3D embossed cinematic movie title typography displaying the exact movie name. The center features a high-budget theatrical movie poster key visual with epic character silhouettes, dramatic cinematic lighting, rim light, volumetric smoke, embers, anamorphic lens flare, sharp 8k resolution, IMAX official movie poster masterpiece"
  },
  {
    id: "cyberpunk-scifi",
    name: "⚡ ไซเบอร์พังก์ & ไซไฟล้ำยุค (Cyberpunk Sci-Fi Cinema)",
    promptSuffix: "At the very top, sharp neon 3D metallic movie title displaying the exact film title. The visual shows a rain-soaked futuristic metropolis with soaring holographic billboards, glowing neon reflections, flying spinner vehicles, dark dystopian mood, hyperrealistic 8k octane render movie poster"
  },
  {
    id: "anime-epic",
    name: "⚔️ มหากาพย์อนิเมะโรงภาพยนตร์ (Epic Anime Theatrical Poster)",
    promptSuffix: "At the very top, dynamic Japanese calligraphy style 3D movie title text displaying the exact title. Visual features iconic anime hero in an intense battle stance with glowing mystical aura, swirling particle magic effects, breathtaking celestial sky background, Ufotable Makoto Shinkai aesthetic, 8k wallpaper"
  },
  {
    id: "dark-thriller",
    name: "🩸 ระทึกขวัญ & สืบสวนเข้มข้น (Dark Mystery Thriller)",
    promptSuffix: "At the very top, distressed metallic typography displaying the film name. Center shows suspenseful noir composition with dramatic deep shadows, chiaroscuro lighting, psychological thriller atmosphere, film grain, award-winning Cannes Film Festival aesthetic, 8k resolution"
  }
];

const INSTANT_MOVIE_POSTER_PRESETS = [
  {
    id: "movie-scifi-1",
    title: "🎬 Cyberpunk Sci-Fi Theatrical Poster 4K",
    badge: "หนังใหม่ 2026",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1000&auto=format&fit=crop&q=85"
  },
  {
    id: "movie-anime-2",
    title: "⚔️ Anime Fantasy Cinema Edition 4K",
    badge: "อนิเมะ 4K",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=85"
  },
  {
    id: "movie-imax-3",
    title: "🍿 IMAX Theatrical Epic Masterpiece",
    badge: "หนังชนโรง",
    url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1000&auto=format&fit=crop&q=85"
  },
  {
    id: "movie-series-4",
    title: "📺 Top Streaming 4K Ultra Series",
    badge: "ดูซีรีส์",
    url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=85"
  },
  {
    id: "movie-netflix-5",
    title: "🔥 Netflix Global Action Thriller",
    badge: "NETFLIX",
    url: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1000&auto=format&fit=crop&q=85"
  },
  {
    id: "movie-crime-6",
    title: "🎖️ Dark Mystery & Crime Masterpiece",
    badge: "TOP IMDB",
    url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=85"
  }
];

const IMAGE_STYLE_PRESETS = [
  {
    id: "mustang-pro",
    name: "🐎 มัสแตง & พลังเทรดความเร็วสูง (สไตล์ Mustang EURUSD Pro 8K)",
    promptSuffix: "At the very top, large glowing neon 3D metallic header text displaying the exact EA name. The image features a powerful, stylized holographic mustang horse formed from golden light and flowing digital trading data on a high-tech glowing trading platform. In the background, sleek multi-monitor trading stations with glowing green candlestick charts (EURUSD, GBPUSD, XAUUSD) and forex telemetry dashboards with ascending profit trendlines. Ultra-bright cinematic studio lighting, sharp 8k resolution, photorealistic commercial masterpiece"
  },
  {
    id: "nexus-commercial",
    name: "🏆 โปสเตอร์โฆษณาพรีเมียม (มีชื่อโปรแกรมด้านบน + กราฟแท่งเทียน 3D)",
    promptSuffix: "ultra-detailed cinematic commercial marketing poster. At the very top, large glowing 3D futuristic neon title header banner displaying the exact EA name in bold capital letters with sleek ornamental frame. In the center, bright multi-screen holographic trading station displaying crisp glowing candlestick charts EURUSD, GBPUSD, XAUUSD, profit growth trendline, robotic trading interface, sharp typography, 8k resolution, photorealistic masterpiece"
  },
  {
    id: "neon-cyber-pop",
    name: "🍭 ไซเบอร์ป็อป & หุ่นยนต์เทรดเดอร์ (สไตล์ VR Lollipop Trend)",
    promptSuffix: "highly detailed cinematic image of a sleek modern AI trading robot with cyber-pop neon aesthetic. At the very top, large glowing vibrant neon 3D header text displaying the exact EA name with glowing neon emblem. Center stage shows floating holographic trading displays with glowing candlestick charts, trend statistics, EURUSD GBPUSD indicators, bright vivid magenta and cyan ambient lighting, 8k resolution, masterpiece"
  },
  {
    id: "golden-bull",
    name: "🐂 กระทิงทองคำ & สถิติกำไรพุ่งทะยาน (มีชื่อ EA ด้านบน)",
    promptSuffix: "majestic glowing golden cybernetic bull statue before ascending green candlestick charts. At the very top, large glowing gold 3D neon title displaying the exact EA name with luxury fintech laurels. Surrounding are dynamic laser candlestick bars, gold coin flow, forex analytics chart, ultra-bright commercial studio lighting, 8k octane render"
  },
  {
    id: "golden-dragon",
    name: "🐉 มังกรทองคำ & ควอนตัมฟินเทค 3D (มีชื่อ EA ด้านบน)",
    promptSuffix: "At the very top, large glowing 3D metallic neon title header displaying the exact EA name. Center features an illuminated majestic golden Chinese dragon hologram weaving through multi-screen MT5 candlestick charts, gold currency matrix, glowing cyan laser data grid, bright commercial studio lighting, 8k resolution"
  },
  {
    id: "mt5-dashboard",
    name: "📈 กราฟแท่งเทียน MT5 & มัลติสกรีนเรดาร์ (มีชื่อ EA ด้านบน)",
    promptSuffix: "hyper-realistic MetaTrader 5 multi-screen trading command desk. At the very top, bold glowing futuristic neon title text displaying the exact EA name. Center shows vibrant green ascending candlestick charts, technical analysis indicators EMA MACD RSI, currency pair matrix EURUSD GBPUSD USDJPY, glowing financial telemetry dashboard, bright clean fintech lighting, ultra-sharp focus, 8k"
  },
  {
    id: "pro-desk",
    name: "💻 สเตชั่นโต๊ะเทรดมัลติมอนิเตอร์ระดับโปร",
    promptSuffix: "high-end luxury multi-monitor trading desk setup with 6 curved 4K OLED screens. At the very top, illuminated neon header bar displaying the exact EA name. Live candlestick charts, algorithmic trading bot status, clean bright penthouse office backdrop, 8k resolution"
  }
];

const INSTANT_PRO_TRADING_GALLERY = [
  {
    id: "nexus-robot-trader",
    title: "🏆 หุ่นยนต์เทรดเดอร์ AI & MT5 กราฟิก NEXUS",
    badge: "Official Poster",
    url: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "candlestick-pro",
    title: "📈 กราฟแท่งเทียน MT5 & เรดาร์เทรด",
    badge: "Most Popular",
    url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "bull-market-gold",
    title: "🐂 ตลาดกระทิงทองคำ & กราฟกำไร",
    badge: "High Profit",
    url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "multi-desk-station",
    title: "💻 จอมอนิเตอร์มัลติเทรดดิ้งรูม",
    badge: "Pro Trader",
    url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "quantum-network",
    title: "🌐 บล็อกเชนควอนตัม & ฟินเทค",
    badge: "Ultra Tech",
    url: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "dark-fintech-dashboard",
    title: "📊 แดชบอร์ดเทรดดาร์กโหมด",
    badge: "Clean MT5",
    url: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&w=1200&q=80"
  }
];

const PRESETS = [
  {
    name: "RSI Scalper Grid (Martingale)",
    description: "บอทเทรดสแคลปปิ้งที่ใช้สัญญาณ RSI ในการเข้าออเดอร์เมื่อเกิดสภาวะ Overbought/Oversold ร่วมกับการวางกริดแก้พอร์ตแบบ Martingale อัตโนมัติ ป้องกันการลากระยะสั้นด้วยการตั้งระยะกริดกว้างตามค่าเฉลี่ย ATR"
  },
  {
    name: "Golden Cross Trend Rider H4",
    description: "ระบบเทรดตามเทรนด์ระยะยาวที่อิงกับ Golden Cross และ Death Cross ของเส้น EMA 50 และ EMA 200 ในไทม์เฟรม H4 มีระบบจำกัดความเสี่ยงด้วยเทคนิค Smart Position Sizing อิงตามยอดบาลานซ์เพื่อความปลอดภัยสูงสุด"
  },
  {
    name: "Asian Session Breakout",
    description: "บอทเทรดแนวทะลุกรอบในช่วงเซสชั่นเอเชียที่มีความผันผวนต่ำ โดยจะจำกัดกรอบราคาแนวรับแนวต้านในช่วง 22:00 ถึง 06:00 น. หากทะลุฝั่งใดจะทำการเปิดออเดอร์ตามพร้อมตั้งจุดคุ้มทุน (Breakeven) และ Trailing Stop ทันที"
  }
];


const parseApiResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  let data: any = null;
  if (contentType.includes("application/json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    try {
      data = JSON.parse(text);
    } catch {
      // ignore JSON parse error
    }
  }

  if (!response.ok) {
    if (data && (data.error || data.message)) {
      throw new Error(data.error || data.message);
    }
    throw new Error(`เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ (${response.status}): ${text.slice(0, 200) || "ไม่สามารถตอบรับคำขอได้"}`);
  }

  if (!data) {
    throw new Error("การตอบกลับจากเซิร์ฟเวอร์ไม่ได้อยู่ในรูปแบบ JSON ที่ถูกต้อง");
  }

  return data;
};

export default function App() {
  // Authentication states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mode navigation: movies vs ea vs sheets vs onedrive
  const [appActiveMode, setAppActiveMode] = useState<"movies" | "ea" | "sheets">("ea");

  // Content Category: Forex EA vs Software vs Movie (Default is Forex EA)
  const [contentCategory, setContentCategory] = useState<ContentCategory>("ea");

  // App functional states
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EAContent | null>(null);
  const [activeTab, setActiveTab] = useState<"tagline" | "features" | "imagePrompt" | "leonardo" | "drive" | "vercel">("tagline");

  // Movie Pipeline & Bilibili/Snapwc Integration states
  const [bilibiliMovieUrl, setBilibiliMovieUrl] = useState("");
  const [bilibiliActionStatus, setBilibiliActionStatus] = useState<string | null>(null);

  // OneDrive Integration states
  const [oneDriveUrl, setOneDriveUrl] = useState("");
  const [oneDriveDownloadLink, setOneDriveDownloadLink] = useState("");
  const [connectedOneDrive, setConnectedOneDrive] = useState<OneDriveInfo | null>(null);
  const [isLoadingOneDrive, setIsLoadingOneDrive] = useState(false);
  const [oneDriveStatusMessage, setOneDriveStatusMessage] = useState<string | null>(null);


  // Advanced Integrations states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [showGeminiKeyInput, setShowGeminiKeyInput] = useState(false);
  const [isTestingGeminiKey, setIsTestingGeminiKey] = useState(false);
  const [geminiKeyTestStatus, setGeminiKeyTestStatus] = useState<{ ok: boolean; message: string; model?: string } | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [leonardoUsername, setLeonardoUsername] = useState("");
  const [leonardoPassword, setLeonardoPassword] = useState(""); // Can double as API Key
  const [vercelBlobToken, setVercelBlobToken] = useState("");
  const [vercelBlobUrl, setVercelBlobUrl] = useState("");
  const [isUploadingToVercelBlob, setIsUploadingToVercelBlob] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState("");

  const [leonardoModel, setLeonardoModel] = useState("gemini-imagen"); // Default to Google Gemini Imagen 3
  const [customModelId, setCustomModelId] = useState("");
  const [leonardoDimension, setLeonardoDimension] = useState("1024x1024"); // Default to 1024x1024

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [leonardoStatus, setLeonardoStatus] = useState("");
  const [imageWorkshopError, setImageWorkshopError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imageWorkshopTab, setImageWorkshopTab] = useState<"gemini-web" | "instant">("gemini-web");
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Google Drive files browser states
  const [googleDriveFiles, setGoogleDriveFiles] = useState<any[]>([]);
  const [isListingDriveFiles, setIsListingDriveFiles] = useState(false);
  const [searchDriveQuery, setSearchDriveQuery] = useState("");
  const [googleDriveUrl, setGoogleDriveUrl] = useState("");

  // Legacy deploy states (preserved to avoid compile issues)
  const [vercelToken, setVercelToken] = useState("");
  const [vercelProjectName, setVercelProjectName] = useState("");
  const [isDeployingToVercel, setIsDeployingToVercel] = useState(false);
  const [vercelUrl, setVercelUrl] = useState("");
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  // Google Sheets states
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("EA Trading Bots Database");
  const [connectedSheet, setConnectedSheet] = useState<GoogleSheetInfo | null>(null);
  const [manualSheetId, setManualSheetId] = useState("");
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UX states
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Local file upload states
  const [localFileBase64, setLocalFileBase64] = useState<string | null>(null);
  const [localFileType, setLocalFileType] = useState<string>("");
  const [localFileName, setLocalFileName] = useState<string>("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [vercelBlobStatus, setVercelBlobStatus] = useState<string | null>(null);

  // ForexCracked.com Integration states
  const [forexCrackedUrl, setForexCrackedUrl] = useState("");
  const [forexCrackedSearch, setForexCrackedSearch] = useState("");
  const [isFetchingForexCracked, setIsFetchingForexCracked] = useState(false);
  const [forexCrackedResults, setForexCrackedResults] = useState<{ title: string; url: string; snippet: string; imageUrl?: string }[]>([]);
  const [forexCrackedStatus, setForexCrackedStatus] = useState<string | null>(null);
  const [forexCrackedData, setForexCrackedData] = useState<any | null>(null);
  const [forexCrackedCopied, setForexCrackedCopied] = useState(false);

  // Helper to load image file / blob into state
  const handleLoadImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLocalFileName(file.name);
    setLocalFileType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setLocalFileBase64(base64);
      setLocalPreviewUrl(result);
      setGeneratedImageUrl(result);
      setLeonardoStatus("✅ นำเข้ารูปภาพจาก Gemini สำเร็จเรียบร้อย!");
      setImageWorkshopError(null);
    };
    reader.readAsDataURL(file);
  };

  // 1-Click Copy Prompt and Open gemini.google.com
  const handleCopyAndOpenGemini = (promptText?: string) => {
    const p = promptText || customImagePrompt || analysisResult?.imagePrompt || "";
    if (!p) return;
    copyToClipboard(p);
    setLeonardoStatus("📋 คัดลอก Prompt แล้ว! วาง (Ctrl+V) บนเว็บ Gemini แล้วกดส่งคำสั่งได้เลย");
    window.open("https://gemini.google.com", "_blank");
  };

  // Copy ForexCracked URL with instant feedback
  const handleCopyForexCrackedUrl = (urlToCopy = "https://www.forexcracked.com") => {
    copyToClipboard(urlToCopy);
    setForexCrackedCopied(true);
    setTimeout(() => setForexCrackedCopied(false), 2000);
  };

  // Fetch article or EA description from ForexCracked.com
  const handleFetchForexCracked = async (targetUrl?: string) => {
    const rawInput = (targetUrl || forexCrackedUrl).trim();
    if (!rawInput) {
      setErrorMessage("กรุณาระบุ URL หรือชื่อ EA ที่ต้องการดึงจาก ForexCracked");
      return;
    }

    setIsFetchingForexCracked(true);
    setForexCrackedStatus(`กำลังค้นหาและดึงข้อมูล '${rawInput}' จาก ForexCracked.com...`);
    setErrorMessage(null);

    try {
      // Check if input is a direct URL or search phrase
      const isUrl = rawInput.startsWith("http://") || rawInput.startsWith("https://") || rawInput.includes("forexcracked.com/");
      
      let articleUrl = rawInput;

      // If user provided a search name instead of direct URL, find the exact matching post first
      if (!isUrl) {
        const searchRes = await fetch("/api/fetch-forexcracked", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: rawInput })
        });
        
        let searchData: any = null;
        try {
          searchData = await searchRes.json();
        } catch {
          throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อค้นหา ForexCracked ได้ในขณะนี้");
        }

        if (searchData && searchData.ok && searchData.results && searchData.results.length > 0) {
          setForexCrackedResults(searchData.results);
          articleUrl = searchData.results[0].url; // Take top 1 exact match
          setForexCrackedUrl(articleUrl);
        } else {
          throw new Error(`ไม่พบบทความ EA ที่ตรงกับ "${rawInput}" บน ForexCracked.com กรุณาลองใช้คำค้นหาที่สั้นลง เช่น "Gold" หรือ "Scalper"`);
        }
      }

      // Fetch the full article details
      const res = await fetch("/api/fetch-forexcracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: articleUrl })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error("ไม่สามารถอ่านข้อมูลบทความจากเซิร์ฟเวอร์ได้ กรุณาใช้ปุ่ม 'เปิดเว็บ' แล้วคัดลอกข้อความมาวางโดยตรง");
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลจาก ForexCracked ได้");
      }

      setForexCrackedData(data);
      setInputText(data.formattedSummary || data.rawText);
      setForexCrackedStatus(`✅ ดึงข้อมูล '${data.title}' สำเร็จเรียบร้อย! พร้อมกดวิเคราะห์ด้วย Gemini ได้ทันที`);

      if (data.imageUrl && !generatedImageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setLocalPreviewUrl(data.imageUrl);
      }
    } catch (err: any) {
      console.error("Fetch ForexCracked failed:", err);
      const msg = err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลจาก ForexCracked";
      setForexCrackedStatus(`❌ ${msg}`);
      setErrorMessage(msg);
    } finally {
      setIsFetchingForexCracked(false);
    }
  };

  // Search ForexCracked.com directly with deep search
  const handleSearchForexCracked = async (queryToSearch?: string) => {
    const q = (queryToSearch || forexCrackedSearch).trim();
    if (!q) return;

    setIsFetchingForexCracked(true);
    setForexCrackedStatus(`กำลังค้นหา "${q}" บน ForexCracked...`);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/fetch-forexcracked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // If JSON parsing fails due to network glitch, use client fallback
        data = null;
      }

      if (data && data.ok && Array.isArray(data.results) && data.results.length > 0) {
        setForexCrackedResults(data.results);
        setForexCrackedStatus(`🔍 พบ ${data.results.length} รายการสำหรับ "${q}" (คลิก 'ดึงเข้าฟอร์ม' ได้ทันที)`);
      } else {
        // Fallback: Generate smart direct search link item
        const fallbackResults = [
          {
            title: `${q} EA (เปิดค้นหาบน ForexCracked)`,
            url: `https://www.forexcracked.com/?s=${encodeURIComponent(q)}`,
            snippet: `ค้นหาบทความ '${q}' โดยตรงบนเว็บไซต์ www.forexcracked.com`,
            category: "Forex EA"
          },
          {
            title: "Leopard Scalper EA MT4 MT5 FREE Download",
            url: "https://www.forexcracked.com/forex-ea/leopard-scalper-ea-free-download/",
            snippet: "Leopard Scalper EA high frequency scalp robot for ICT & SMC smart money concepts.",
            category: "Forex EA"
          },
          {
            title: "Quantum F3 EA MT4 Expert Advisor FREE Download",
            url: "https://www.forexcracked.com/forex-ea/quantum-f3-ea-free-download/",
            snippet: "Quantum volatility breakout algorithm for major currency pairs.",
            category: "Forex EA"
          }
        ];
        setForexCrackedResults(fallbackResults);
        setForexCrackedStatus(`🔍 พบผลการค้นหาสำหรับ "${q}" (คลิกดูหรือเปิดเว็บได้ทันที)`);
      }
    } catch (err: any) {
      console.warn("Search ForexCracked fallback triggered:", err);
      // Even on network error, ensure user has actionable results & open web button
      const fallbackResults = [
        {
          title: `ค้นหา "${q}" บน ForexCracked.com`,
          url: `https://www.forexcracked.com/?s=${encodeURIComponent(q)}`,
          snippet: `เปิดหน้าค้นหาบทความ '${q}' บนเว็บไซต์ ForexCracked โดยตรง`,
          category: "Forex EA"
        }
      ];
      setForexCrackedResults(fallbackResults);
      setForexCrackedStatus(`🔍 เตรียมลิงก์ค้นหาสำหรับ "${q}" เรียบร้อยแล้ว (สามารถคลิก 'เปิดดู' ได้ทันที)`);
    } finally {
      setIsFetchingForexCracked(false);
    }
  };

  // Global paste event listener for clipboard image (Copy Image on Gemini -> Ctrl+V here)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleLoadImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);

  // Load from LocalStorage (safe persist of sheet and credentials)
  useEffect(() => {
    const savedSheetId = localStorage.getItem("connected_spreadsheet_id");
    const savedSheetTitle = localStorage.getItem("connected_spreadsheet_title");
    const savedSheetUrl = localStorage.getItem("connected_spreadsheet_url");
    if (savedSheetId && savedSheetTitle && savedSheetUrl) {
      setConnectedSheet({
        spreadsheetId: savedSheetId,
        title: savedSheetTitle,
        spreadsheetUrl: savedSheetUrl
      });
    }

    // Load OneDrive state
    const savedOneDriveUrl = localStorage.getItem("connected_onedrive_url");
    const savedOneDriveName = localStorage.getItem("connected_onedrive_name");
    if (savedOneDriveUrl) {
      setOneDriveUrl(savedOneDriveUrl);
      setConnectedOneDrive({
        name: savedOneDriveName || "OneDrive Excel Database",
        url: savedOneDriveUrl,
        type: "shared_link"
      });
    }

    const savedOneDriveDownload = localStorage.getItem("onedrive_download_link");
    if (savedOneDriveDownload) setOneDriveDownloadLink(savedOneDriveDownload);

    const savedCategory = localStorage.getItem("content_category") as ContentCategory;
    if (savedCategory) setContentCategory(savedCategory);

    const savedRows = localStorage.getItem("saved_onedrive_rows");
    if (savedRows) {
      try {
        const parsed = JSON.parse(savedRows);
        if (Array.isArray(parsed) && parsed.length > 0) setSheetRows(parsed);
      } catch {}
    }

    // Load API credentials
    const savedLeoUser = localStorage.getItem("leonardo_username");
    if (savedLeoUser) setLeonardoUsername(savedLeoUser);

    const savedLeoPass = localStorage.getItem("leonardo_password");
    if (savedLeoPass) setLeonardoPassword(savedLeoPass);

    const savedLeoModel = localStorage.getItem("leonardo_model");
    if (savedLeoModel) {
      setLeonardoModel(savedLeoModel === "free-pollinations" ? "gemini-imagen" : savedLeoModel);
    }

    const savedCustomModelId = localStorage.getItem("leonardo_custom_model_id");
    if (savedCustomModelId) setCustomModelId(savedCustomModelId);

    const savedLeoDimension = localStorage.getItem("leonardo_dimension");
    if (savedLeoDimension) setLeonardoDimension(savedLeoDimension);

    const savedBlobToken = localStorage.getItem("vercel_blob_token");
    if (savedBlobToken) {
      setVercelBlobToken(savedBlobToken);
      setVercelToken(savedBlobToken);
    }

    const savedGeminiKey = localStorage.getItem("custom_gemini_api_key");
    if (savedGeminiKey) {
      setGeminiApiKey(savedGeminiKey);
    }

    const savedOpenAIKey = localStorage.getItem("custom_openai_api_key");
    if (savedOpenAIKey) {
      setOpenaiApiKey(savedOpenAIKey);
    }
  }, []);

  // Save Content Category
  const handleSelectCategory = (cat: ContentCategory) => {
    setContentCategory(cat);
    localStorage.setItem("content_category", cat);
    if (cat === "software") {
      setGeneratedImageUrl(INSTANT_SOFTWARE_GALLERY[0].url);
      setLeonardoStatus("โหลดภาพสเตชั่นตัดต่อ DaVinci 8K พร้อมใช้งาน");
    } else if (cat === "movie") {
      setGeneratedImageUrl(INSTANT_MOVIE_POSTER_PRESETS[0].url);
      setLeonardoStatus("โหลดภาพโปสเตอร์หนังไซไฟ 4K พร้อมใช้งาน");
    } else {
      setGeneratedImageUrl(INSTANT_PRO_TRADING_GALLERY[0].url);
      setLeonardoStatus("โหลดภาพกราฟแท่งเทียน MT5 8K พร้อมใช้งาน");
    }
  };

  // Movie Helper 1: Open Snapwc.com and copy Bilibili URL for conversion
  const handleOpenSnapwc = () => {
    const url = bilibiliMovieUrl.trim();
    if (url) {
      copyToClipboard(url);
      setBilibiliActionStatus("📋 คัดลอกลิงก์ Bilibili ให้แล้ว! กำลังเปิด Snapwc.com เพื่อให้คุณกด Ctrl+V วางแปลงไฟล์...");
    } else {
      setBilibiliActionStatus("🚀 กำลังเปิด Snapwc.com เพื่อแปลงไฟล์ภาพยนตร์...");
    }
    window.open("https://snapwc.com/", "_blank");
    setTimeout(() => setBilibiliActionStatus(null), 6000);
  };

  // Movie Helper 2: Extract Bilibili title or fill input
  const handleExtractBilibiliInfo = () => {
    const url = bilibiliMovieUrl.trim();
    if (!url) {
      setErrorMessage("กรุณาระบุลิงก์ภาพยนตร์ Bilibili.tv ด้านบนก่อน");
      return;
    }
    let extractedName = "";
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1] || "";
      if (lastPart) {
        extractedName = decodeURIComponent(lastPart).replace(/[-_]/g, " ");
      }
    } catch {
      extractedName = url;
    }

    const movieInputSample = `ภาพยนตร์จาก Bilibili: ${extractedName || "Bilibili Cinema"}\nลิงก์ต้นทาง: ${url}\nต้องการสกัดชื่อภาพยนตร์อย่างเป็นทางการ, คำโปรยภาพยนตร์สั้นดึงดูดใจ, เรื่องย่อ & ข้อมูลภาพยนตร์ (ความยาว, หมวดหมู่, นักแสดง, สเปก 4K HDR) และพร้อมต์สร้างโปสเตอร์ภาพยนตร์ระดับ 8K Theatrical Cinema Poster`;
    setInputText(movieInputSample);
    setBilibiliActionStatus("✨ นำข้อมูลภาพยนตร์จาก Bilibili ลงในช่องสกัดเนื้อหาเรียบร้อยแล้ว! สามารถกด 'สกัดข้อมูลภาพยนตร์' ได้ทันที");
    setTimeout(() => setBilibiliActionStatus(null), 5000);
  };

  // Fetch and parse Excel/CSV from OneDrive link
  const handleFetchOneDrive = async (targetUrl?: string) => {
    const rawUrl = (targetUrl || oneDriveUrl).trim();
    if (!rawUrl) {
      setErrorMessage("กรุณาระบุลิงก์แชร์ของ OneDrive (เช่น ลิงก์ไฟล์ Excel หรือโฟลเดอร์)");
      return;
    }

    setIsLoadingOneDrive(true);
    setOneDriveStatusMessage(`กำลังเชื่อมต่อและดึงไฟล์ Excel จาก OneDrive...`);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/onedrive/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onedriveUrl: rawUrl })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูลจาก OneDrive ได้");
      }

      setSheetRows(data.rows || []);
      localStorage.setItem("saved_onedrive_rows", JSON.stringify(data.rows || []));

      const info: OneDriveInfo = {
        name: data.title || "OneDrive Excel",
        url: rawUrl,
        type: "excel",
        rowCount: data.totalRows || (data.rows ? data.rows.length : 0),
        lastSynced: new Date().toLocaleTimeString("th-TH")
      };

      setConnectedOneDrive(info);
      localStorage.setItem("connected_onedrive_url", rawUrl);
      localStorage.setItem("connected_onedrive_name", info.name);
      setOneDriveStatusMessage(`🎉 ดึงข้อมูลสำเร็จ! พบ ${data.totalRows} แถวจากแผ่นงาน "${data.title}"`);
    } catch (err: any) {
      console.error("Fetch OneDrive error:", err);
      const msg = err.message || "เกิดข้อผิดพลาดในการดึงไฟล์จาก OneDrive";
      setOneDriveStatusMessage(`❌ ${msg}`);
      setErrorMessage(msg);
    } finally {
      setIsLoadingOneDrive(false);
    }
  };

  // Handle uploading local Excel / CSV file (from OneDrive desktop or local drive)
  const handleUploadExcelFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingOneDrive(true);
    setOneDriveStatusMessage(`กำลังอ่านไฟล์ Excel "${file.name}"...`);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetNames = workbook.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          throw new Error("ไม่พบแผ่นงานในไฟล์ Excel");
        }

        const targetSheetName = sheetNames.find(s => /software|ea|content|database/i.test(s)) || sheetNames[0];
        const sheet = workbook.Sheets[targetSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        const cleanedRows = rawRows
          .map(row => row.map(cell => String(cell !== undefined && cell !== null ? cell : "").trim()))
          .filter(row => row.some(cell => cell.length > 0));

        setSheetRows(cleanedRows);
        localStorage.setItem("saved_onedrive_rows", JSON.stringify(cleanedRows));

        const info: OneDriveInfo = {
          name: file.name,
          url: "Local File / OneDrive Sync",
          type: "file",
          rowCount: cleanedRows.length,
          lastSynced: new Date().toLocaleTimeString("th-TH")
        };
        setConnectedOneDrive(info);
        setOneDriveStatusMessage(`🎉 อ่านไฟล์ "${file.name}" สำเร็จ! ดึงมาทั้งหมด ${cleanedRows.length} แถว`);
      } catch (err: any) {
        console.error("Upload Excel parse error:", err);
        setOneDriveStatusMessage(`❌ เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}`);
        setErrorMessage(`ไม่สามารถอ่านไฟล์ Excel ได้: ${err.message}`);
      } finally {
        setIsLoadingOneDrive(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Export current table to a real OneDrive Excel (.xlsx) file
  const handleExportOneDriveExcel = () => {
    if (sheetRows.length === 0) {
      setErrorMessage("ยังไม่มีข้อมูลในตารางสำหรับส่งออก");
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetRows);
      XLSX.utils.book_append_sheet(wb, ws, "Software Database");
      
      const fileName = `OneDrive_Software_Database_${Date.now()}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setOneDriveStatusMessage(`💾 ส่งออกไฟล์ "${fileName}" เรียบร้อยแล้ว! สามารถอัปโหลดขึ้น OneDrive ได้ทันที`);
    } catch (err: any) {
      setErrorMessage(`เกิดข้อผิดพลาดในการสร้างไฟล์ Excel: ${err.message}`);
    }
  };

  // Copy table rows as TSV for direct paste into OneDrive Excel Online
  const handleCopyTableForOneDrive = () => {
    if (sheetRows.length === 0) {
      setErrorMessage("ยังไม่มีข้อมูลในตารางสำหรับคัดลอก");
      return;
    }

    const tsvContent = sheetRows
      .map(row => row.map(cell => String(cell).replace(/\t/g, " ").replace(/\n/g, " ")).join("\t"))
      .join("\n");

    copyToClipboard(tsvContent);
    setOneDriveStatusMessage("📋 คัดลอกข้อมูลตารางทั้งหมดแล้ว! สามารถเปิด Excel Online บน OneDrive แล้วกด Ctrl+V วางแถวได้ทันที");
  };

  // Save current analysis result to OneDrive Table
  const handleSaveToOneDriveTable = () => {
    if (!analysisResult) {
      setErrorMessage("ยังไม่มีผลการวิเคราะห์ข้อมูลสำหรับบันทึก");
      return;
    }

    const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    const isMovie = analysisResult.category === "movie" || contentCategory === "movie";
    const isSoftware = !isMovie && (analysisResult.category === "software" || contentCategory === "software");

    const headers = [
      "Timestamp",
      isMovie ? "Movie Title (ชื่อภาพยนตร์)" : (isSoftware ? "Software Name / Version" : "EA Name"),
      "หมวดหมู่",
      "Tagline / คำโปรย (HTML)",
      isMovie ? "Movie Synopsis & Specs / เรื่องย่อ & สเปก (HTML)" : "Features & Specs / สรุปฟีเจอร์ (HTML)",
      isMovie ? "Movie Poster Prompt 8K" : "Image Gen Prompt",
      "Poster / Image URL (OneDrive / Web)",
      isMovie ? "OneDrive Video Link (หรือ Bilibili)" : "OneDrive / Program Download Link"
    ];

    const newRow = [
      timestamp,
      analysisResult.eaName,
      isMovie ? "Movie / Series (ภาพยนตร์)" : (isSoftware ? "Software / PC Tools" : "Forex EA"),
      analysisResult.tagline,
      analysisResult.featuresSummary,
      analysisResult.imagePrompt,
      vercelBlobUrl || generatedImageUrl || "",
      oneDriveDownloadLink || googleDriveUrl || bilibiliMovieUrl || ""
    ];

    let updatedRows: string[][];
    if (sheetRows.length === 0) {
      updatedRows = [headers, newRow];
    } else {
      updatedRows = [...sheetRows, newRow];
    }

    setSheetRows(updatedRows);
    localStorage.setItem("saved_onedrive_rows", JSON.stringify(updatedRows));
    setExportSuccess(true);
    setOneDriveStatusMessage(`🎉 บันทึกข้อมูล "${analysisResult.eaName}" ลงในตาราง OneDrive เรียบร้อยแล้ว!`);
    setTimeout(() => setExportSuccess(false), 5000);
  };

  // Save OpenAI API Key
  const handleSaveOpenAIKey = (keyVal: string) => {
    const cleaned = keyVal.replace(/[\s\r\n\t]/g, "").replace(/["']/g, "").trim();
    setOpenaiApiKey(cleaned);
    localStorage.setItem("custom_openai_api_key", cleaned);
  };

  // Save Gemini API Key
  const handleSaveGeminiKey = (keyVal: string) => {
    setGeminiApiKey(keyVal);
    localStorage.setItem("custom_gemini_api_key", keyVal);
    setGeminiKeyTestStatus(null);
  };

  // Test Gemini API Key with dual server & client fallback
  const handleTestGeminiKey = async (keyToTest?: string) => {
    const k = (keyToTest !== undefined ? keyToTest : geminiApiKey).trim();
    if (!k) {
      setErrorMessage("กรุณาระบุ Gemini API Key ก่อนทำการทดสอบ");
      return;
    }
    setIsTestingGeminiKey(true);
    setGeminiKeyTestStatus(null);
    setErrorMessage(null);

    // 1. Try testing via backend API
    try {
      const res = await fetch("/api/test-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ geminiApiKey: k })
      });
      const data = await res.json();
      if (data.ok) {
        setGeminiKeyTestStatus({ ok: true, message: data.message, model: data.model });
        setIsTestingGeminiKey(false);
        return;
      }
    } catch (serverErr) {
      console.warn("Backend test failed, falling back to direct browser call...", serverErr);
    }

    // 2. Direct browser REST API test fallback
    try {
      const modelsToTest = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
      let directSuccess = false;
      let directErrorMsg = "";

      for (const m of modelsToTest) {
        try {
          const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say 'OK' in 1 word" }] }]
            })
          });
          const dData = await directRes.json();
          if (directRes.ok && dData.candidates && dData.candidates.length > 0) {
            directSuccess = true;
            setGeminiKeyTestStatus({
              ok: true,
              message: `เชื่อมต่อสำเร็จ! API Key ใช้งานได้สมบูรณ์ (โมเดล ${m})`,
              model: m
            });
            break;
          } else {
            directErrorMsg = dData.error?.message || JSON.stringify(dData.error || "");
          }
        } catch (e: any) {
          directErrorMsg = e.message || String(e);
        }
      }

      if (!directSuccess) {
        setGeminiKeyTestStatus({ ok: false, message: directErrorMsg || "เชื่อมต่อ Gemini ไม่สำเร็จ" });
        setErrorMessage(`ผลการทดสอบ API Key: ${directErrorMsg}`);
      }
    } catch (err: any) {
      setGeminiKeyTestStatus({ ok: false, message: err.message || "เกิดข้อผิดพลาดในการทดสอบ" });
      setErrorMessage(`เกิดข้อผิดพลาดในการทดสอบ: ${err.message}`);
    } finally {
      setIsTestingGeminiKey(false);
    }
  };

  // Save API credentials to localStorage
  const handleSaveLeonardoCreds = (userVal: string, passVal: string) => {
    setLeonardoUsername(userVal);
    setLeonardoPassword(passVal);
    localStorage.setItem("leonardo_username", userVal);
    localStorage.setItem("leonardo_password", passVal);
  };

  const handleSaveVercelBlobToken = (tokenVal: string) => {
    const cleaned = tokenVal.replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "").replace(/["']/g, "").trim();
    setVercelBlobToken(cleaned);
    setVercelToken(cleaned);
    localStorage.setItem("vercel_blob_token", cleaned);
    setVercelBlobStatus(null);
  };

  // Save connected sheet state
  const saveSheetState = (sheet: GoogleSheetInfo | null) => {
    setConnectedSheet(sheet);
    if (sheet) {
      localStorage.setItem("connected_spreadsheet_id", sheet.spreadsheetId);
      localStorage.setItem("connected_spreadsheet_title", sheet.title);
      localStorage.setItem("connected_spreadsheet_url", sheet.spreadsheetUrl);
    } else {
      localStorage.removeItem("connected_spreadsheet_id");
      localStorage.removeItem("connected_spreadsheet_title");
      localStorage.removeItem("connected_spreadsheet_url");
      setSheetRows([]);
    }
  };

  // Auth setup on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, currentToken) => {
        setUser(currentUser);
        setToken(currentToken);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch Drive files once authenticated
  useEffect(() => {
    if (token && !needsAuth) {
      handleListDriveFiles();
    }
  }, [token, needsAuth]);

  // Sync token to state on demand
  const checkToken = async (): Promise<string | null> => {
    const activeToken = await getAccessToken();
    if (activeToken) {
      setToken(activeToken);
      return activeToken;
    }
    return token;
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const errCode = err?.code || "";
      const errDetail = err?.message || String(err);

      let friendlyMsg = "";
      if (errCode === "auth/popup-blocked") {
        friendlyMsg = "ป๊อบอัพลงชื่อเข้าใช้ถูกบล็อกโดยเบราว์เซอร์/iframe กรุณาอนุญาตป๊อบอัพ หรือคลิกปุ่ม 'เปิดในแท็บใหม่' ด้านบน";
      } else if (errCode === "auth/popup-closed-by-user") {
        friendlyMsg = "หน้าต่างลงชื่อเข้าใช้ถูกปิดก่อนทำรายการเสร็จสิ้น กรุณากด Sign in with Google อีกครั้ง";
      } else if (errCode === "auth/unauthorized-domain") {
        friendlyMsg = "โดเมนเว็บไซต์นี้ยังไม่ได้ลงทะเบียนใน Firebase Authorized Domains (กรุณาคลิก 'เปิดในแท็บใหม่')";
      } else {
        friendlyMsg = `ไม่สามารถลงชื่อเข้าใช้ด้วยบัญชี Google ได้: ${errDetail}`;
      }

      setErrorMessage(friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Request analysis from server-side API proxy with direct client fallback
  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setErrorMessage("กรุณากรอกรายละเอียดหรือชื่อโปรแกรม / สเปคเพื่อทำการวิเคราะห์");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    let parsedData: EAContent | null = null;
    const keyToUse = geminiApiKey.trim();

    // 1. Try server-side API with category
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input: inputText,
          geminiApiKey: keyToUse || undefined,
          category: contentCategory
        }),
      });

      if (response.ok) {
        parsedData = await response.json();
      } else {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${response.status}`);
      }
    } catch (serverErr: any) {
      console.warn("Server API failed, trying direct browser Gemini call...", serverErr);

      // 2. Direct browser Gemini API Fallback if user provided a key
      if (keyToUse) {
        try {
          // 1. Explicit Forex EA keywords
          const isEAText = /\b(ea|mt4|mt5|mql4|mql5|forex|metatrader|xauusd|eurusd|gbpusd|usdjpy|usdchf|audusd|nzdusd|usdcad|btc|crypto|pip|pips|lot|lots)\b|expert\s*advisor|scalp(ing|er)?|trading\s*bot|forexcracked|trailing\s*stop|drawdown|gold\s*bot|martingale|grid\s*trad(e|ing)|take\s*profit|stop\s*loss|forex\s*indicator|b-clock|candlestick|backtest|timeframe/i.test(inputText);

          // 2. Explicit Movie keywords
          const isMovieText = /bilibili|snapwc|เรื่องย่อ|ภาพยนตร์|พากย์ไทย|ซับไทย|กำกับโดย|นักแสดงนำ|หนังโรง|ซีรีส์|อนิเมะ|\b(imdb|netflix|cinema|theatrical|box\s*office)\b/i.test(inputText);

          // 3. Explicit PC/Mac Software keywords (strict names/tools)
          const isSoftwareText = /davinci|adobe|photoshop|premiere|after\s*effects|illustrator|autocad|blender|cinema\s*4d|setup\.exe|portable\s*app|utility\s*tool|plugin\s*vst|full\s*version\s*crack|keygen|corel\s*draw|obs\s*studio|maya\s*3d|driver\s*pack|antivirus|microsoft\s*office/i.test(inputText);

          let detectedCategory: ContentCategory = "ea";
          if (contentCategory === "ea") {
            detectedCategory = "ea";
          } else if (contentCategory === "movie") {
            detectedCategory = (isEAText && !isMovieText) ? "ea" : "movie";
          } else if (contentCategory === "software") {
            detectedCategory = (isEAText && !isSoftwareText) ? "ea" : "software";
          } else {
            if (isEAText) detectedCategory = "ea";
            else if (isMovieText) detectedCategory = "movie";
            else if (isSoftwareText) detectedCategory = "software";
            else detectedCategory = "ea";
          }

          const isMovie = detectedCategory === "movie";
          const isSoftware = detectedCategory === "software";

          let prompt = "";
          if (isMovie) {
            prompt = `You are an expert film critic, cinema marketing copywriter, and theatrical promotional designer for movies, blockbuster films, anime, and series.
Given the following movie title, raw details, synopsis, or Bilibili video description:
1. eaName: Clean Official Movie Title in Thai and English with Year (e.g. "Avatar: Fire and Ash (2026) [4K IMAX HDR]" or "ดาบพิฆาตอสูร ภาคปราสาทไร้ขอบเขต"). Do NOT mention EA, trading, or software!
2. tagline: Punchy, emotionally gripping cinema marketing tagline in Thai (คำโปรยภาพยนตร์สั้นดึงดูดใจ) formatted as clean HTML with modern cinema styling (e.g. '<p class="text-amber-400 font-extrabold tracking-wide">มหากาพย์สงครามแห่งดวงดาวบทใหม่... สู่จุดเปลี่ยนแห่งโชคชะตา</p>')
3. featuresSummary: Comprehensive movie specifications & synopsis in Thai (เรื่องย่อ & ข้อมูลภาพยนตร์) as clean semantic HTML ('<ul>', '<li>', '<strong>', '<span>') including:
   - เรื่องย่อภาพยนตร์ (Engaging synopsis)
   - หมวดหมู่ (Genre): เช่น แอ็กชัน / ไซไฟ / แฟนตาซี
   - นักแสดงนำ & ผู้กำกับ (Cast & Director)
   - ความยาว & ระบบเสียง/ภาพ (Duration, 4K HDR, Dolby Atmos)
   - แหล่งรับชม & การสตรีม (OneDrive / Bilibili / Potnuengshop)
4. htmlCode: Stunning dark cinema theater presentation showcase card in HTML with Tailwind CSS (deep dark black/slate background, gold/amber and crimson accents, movie poster frame, star rating, movie badge, and action buttons for "รับชมภาพยนตร์ (OneDrive)" and "ดาวน์โหลดหนัง")
5. imagePrompt: Vivid 8K IMAX theatrical cinema movie poster prompt in English (e.g. "At the very top, large glowing 3D embossed cinematic movie title typography displaying the exact movie name. The center features a high-budget theatrical movie poster key visual with epic character silhouettes, dramatic cinematic lighting, rim light, volumetric smoke, embers, anamorphic lens flare, sharp 8k resolution, IMAX official movie poster masterpiece")

Input:
${inputText}

Return ONLY valid JSON matching this schema:
{"eaName": "...", "tagline": "...", "featuresSummary": "...", "htmlCode": "...", "imagePrompt": "..."}`;
          } else if (isSoftware) {
            prompt = `You are an expert software engineer, technical copywriter, and digital product marketing designer for PC/Mac desktop software, creative studio tools, utilities, and applications.
Given the following raw text, software title, version specs, installer notes, or feature requests:
1. eaName: Clean official Software Name & Version (e.g. "DaVinci Resolve Studio 18.1.3 (x64)"). Do NOT mention EA, trading, or pips!
2. tagline: Catchy marketing tagline in Thai (คำโปรย) highlighting software speed, creative power, stability, rendering excellence, formatted as clean HTML (e.g. '<p class="text-indigo-600 font-bold">...</p>')
3. featuresSummary: Structured features & system requirements in Thai (สรุปฟีเจอร์ & สเปกระบบ) as clean semantic HTML ('<ul>', '<li>', '<strong>', '<span>')
4. htmlCode: Stunning modern software presentation showcase card in HTML with Tailwind CSS
5. imagePrompt: Commercial 8K software product packaging & workstation mockup prompt (e.g. "At the very top, large glowing neon 3D metallic header text displaying the software name. Center features 3D software box packaging mockup next to dual 4K creative workstation monitors displaying the software UI timeline, volumetric studio lighting, 8k resolution, photorealistic masterpiece")

Input:
${inputText}

Return ONLY valid JSON matching this schema:
{"eaName": "...", "tagline": "...", "featuresSummary": "...", "htmlCode": "...", "imagePrompt": "..."}`;
          } else {
            prompt = `You are an expert copywriter, software engineer, and marketing designer for MetaTrader Expert Advisors (EA). 
Given the following raw text, EA trading strategy description, MQL code, or feature request:
1. eaName: short unique name (max 4-5 words)
2. tagline: catchy marketing tagline in Thai (คำโปรย) styled as clean HTML (e.g. '<p class="text-indigo-600 font-bold">...</p>')
3. featuresSummary: structured trading features in Thai (สรุปฟีเจอร์) as clean semantic HTML ('<ul>', '<li>', '<strong>', '<span>')
4. htmlCode: stunning visual showcase presentation card in HTML with Tailwind CSS
5. imagePrompt: rich, vivid English prompt for financial/forex EA marketing visual (e.g. 3D holographic forex charts, golden Wall Street bull, cybernetic trading bot, multi-currency matrix, dark titanium workstation, 8k octane render, cinematic lighting, photorealistic).

Input:
${inputText}

Return ONLY valid JSON matching this schema:
{"eaName": "...", "tagline": "...", "featuresSummary": "...", "htmlCode": "...", "imagePrompt": "..."}`;
          }

          const models = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
          let lastDirectError = "";

          for (const m of models) {
            try {
              const directRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${keyToUse}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: prompt }] }],
                  generationConfig: {
                    responseMimeType: "application/json"
                  }
                })
              });
              const dJson = await directRes.json();
              if (directRes.ok && dJson.candidates?.[0]?.content?.parts?.[0]?.text) {
                const rawText = dJson.candidates[0].content.parts[0].text;
                parsedData = JSON.parse(rawText);
                parsedData.category = detectedCategory;
                break;
              } else {
                lastDirectError = dJson.error?.message || JSON.stringify(dJson.error || "");
              }
            } catch (e: any) {
              lastDirectError = e.message || String(e);
            }
          }

          if (!parsedData) {
            throw new Error(lastDirectError || serverErr.message || "การวิเคราะห์ล้มเหลว");
          }
        } catch (directErr: any) {
          console.error("Direct browser call failed:", directErr);
          setErrorMessage(directErr.message || serverErr.message || "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย Gemini");
        }
      } else {
        setErrorMessage(serverErr.message || "เกิดข้อผิดพลาดในการวิเคราะห์ด้วย Gemini");
      }
    }

    if (parsedData) {
      const resolvedCategory: "ea" | "software" | "movie" = 
        (parsedData.category === "movie" || parsedData.category === "software" || parsedData.category === "ea")
          ? parsedData.category
          : (contentCategory === "movie" || contentCategory === "software" ? contentCategory : "ea");
      parsedData.category = resolvedCategory;
      if (resolvedCategory !== contentCategory) {
        setContentCategory(resolvedCategory);
        localStorage.setItem("content_category", resolvedCategory);
      }
      setAnalysisResult(parsedData);
      setCustomImagePrompt(parsedData.imagePrompt || "");
      setVercelProjectName(parsedData.eaName ? parsedData.eaName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") : `${resolvedCategory}-landing-page`);
      
      if (resolvedCategory === "movie") {
        setGeneratedImageUrl(INSTANT_MOVIE_POSTER_PRESETS[0].url);
        setLeonardoStatus(`โหลดภาพโปสเตอร์ภาพยนตร์ 4K/8K สำหรับ "${parsedData.eaName}" เรียบร้อยแล้ว`);
      } else if (resolvedCategory === "software") {
        setGeneratedImageUrl(INSTANT_SOFTWARE_GALLERY[0].url);
        setLeonardoStatus(`โหลดภาพสเตชั่นซอฟต์แวร์ 8K สำหรับ "${parsedData.eaName}" เรียบร้อยแล้ว`);
      } else {
        setGeneratedImageUrl(INSTANT_PRO_TRADING_GALLERY[0].url);
        setLeonardoStatus(`โหลดภาพกราฟแท่งเทียน MT5 8K สำหรับ EA "${parsedData.eaName}" พร้อมใช้งาน`);
      }

      setVercelUrl("");
      setActiveTab("tagline");

      // Auto populate search on ForexCracked if EA mode
      if (resolvedCategory === "ea") {
        const eaKeyword = (parsedData.eaName || "").trim();
        if (eaKeyword) {
          setForexCrackedSearch(eaKeyword);
          handleSearchForexCracked(eaKeyword);
        }
      }
    }

    setIsAnalyzing(false);
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create sheet with explicit sheetName
  const handleCreateSheet = async () => {
    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("กรุณาลงชื่อเข้าใช้งาน Google ก่อนเพื่อสร้างชีต");
      return;
    }

    setIsCreatingSheet(true);
    setErrorMessage(null);

    try {
      // 1. Create Spreadsheet with a designated tab
      const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: { title: spreadsheetTitle },
          sheets: [{ properties: { title: "EA Content" } }]
        })
      });

      if (!createResponse.ok) {
        throw new Error("ไม่สามารถสร้าง Google Sheets ได้ กรุณาลองตรวจสอบสิทธิ์การใช้งาน");
      }

      const sheetData = await createResponse.json();
      const spreadsheetId = sheetData.spreadsheetId;
      const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // 2. Initialize Headers on the new tab (Columns A to G)
      const headerResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/EA%20Content!A1:G1?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [["Timestamp", "EA Name", "Tagline / คำโปรย (HTML)", "Features Summary / สรุปฟีเจอร์ (HTML)", "Image Gen Prompt", "Image URL (Vercel Blobs)", "Google Drive Program Link"]]
        })
      });

      if (!headerResponse.ok) {
        throw new Error("สร้างไฟล์สำเร็จ แต่ไม่สามารถเขียนส่วนหัวคอลัมน์ (Headers) ได้");
      }

      const newSheet: GoogleSheetInfo = {
        spreadsheetId,
        spreadsheetUrl,
        title: spreadsheetTitle
      };

      saveSheetState(newSheet);
      setSheetRows([["Timestamp", "EA Name", "Tagline / คำโปรย (HTML)", "Features Summary / สรุปฟีเจอร์ (HTML)", "Image Gen Prompt", "Image URL (Vercel Blobs)", "Google Drive Program Link"]]);
    } catch (err: any) {
      console.error("Create sheet error:", err);
      setErrorMessage(err.message || "เกิดปัญหาในการสร้าง Google Sheets");
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Connect manually with sheet ID
  const handleConnectManualSheet = async () => {
    if (!manualSheetId.trim()) {
      setErrorMessage("กรุณากรอก Spreadsheet ID");
      return;
    }

    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("กรุณาลงชื่อเข้าใช้งาน Google ก่อนเชื่อมต่อ");
      return;
    }

    setIsLoadingSheet(true);
    setErrorMessage(null);

    const spreadsheetId = manualSheetId.trim();

    try {
      // Get spreadsheet metadata to verify it exists and retrieve its title
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
        headers: { Authorization: `Bearer ${curToken}` }
      });

      if (!metaRes.ok) {
        throw new Error("ไม่พบไฟล์ชีตนี้ หรือคุณไม่มีสิทธิ์เข้าถึง กรุณาตรวจสอบ Spreadsheet ID");
      }

      const metaData = await metaRes.json();
      const title = metaData.properties.title || "Custom Google Sheet";
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

      // Ensure the "EA Content" tab exists
      await ensureTabExists(curToken, spreadsheetId);

      const connected: GoogleSheetInfo = {
        spreadsheetId,
        spreadsheetUrl,
        title
      };

      saveSheetState(connected);
      setManualSheetId("");
      await handleFetchRows(curToken, spreadsheetId);
    } catch (err: any) {
      console.error("Manual connect error:", err);
      setErrorMessage(err.message || "เกิดปัญหาในการเชื่อมต่อกับชีต");
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Ensure tab exists helper
  const ensureTabExists = async (accessToken: string, spreadsheetId: string) => {
    try {
      // Check if EA Content tab can be fetched
      const testRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/EA%20Content!A1:A1`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (testRes.status === 400) {
        // Tab doesn't exist, let's append it
        const createTabRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requests: [
              {
                addSheet: {
                  properties: {
                    title: "EA Content"
                  }
                }
              }
            ]
          })
        });

        if (createTabRes.ok) {
          // Initialize headers in the newly created tab (A1:G1)
          await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/EA%20Content!A1:G1?valueInputOption=USER_ENTERED`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              values: [["Timestamp", "EA Name", "Tagline / คำโปรย (HTML)", "Features Summary / สรุปฟีเจอร์ (HTML)", "Image Gen Prompt", "Image URL (Vercel Blobs)", "Google Drive Program Link"]]
            })
          });
        }
      }
    } catch (err) {
      console.error("Error creating tab:", err);
    }
  };

  // Fetch spreadsheet values
  const handleFetchRows = async (customToken?: string, customSheetId?: string) => {
    const curToken = customToken || await checkToken();
    const sheetId = customSheetId || connectedSheet?.spreadsheetId;

    if (!curToken || !sheetId) return;

    setIsLoadingSheet(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/EA%20Content!A1:G100`, {
        headers: { Authorization: `Bearer ${curToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.values) {
          setSheetRows(data.values);
        } else {
          setSheetRows([]);
        }
      } else {
        // If getting the explicit tab fails, it might not be initialized
        await ensureTabExists(curToken, sheetId);
        const secondRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/EA%20Content!A1:G100`, {
          headers: { Authorization: `Bearer ${curToken}` }
        });
        if (secondRes.ok) {
          const secondData = await secondRes.json();
          setSheetRows(secondData.values || []);
        }
      }
    } catch (err) {
      console.error("Fetch rows error:", err);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Load existing Google Sheet row into the workspace
  const handleLoadRowToWorkshop = (row: string[]) => {
    if (!row || row.length < 2) return;
    
    const eaData: EAContent = {
      eaName: row[1] || "EA จาก Google Sheet",
      tagline: row[2] || "",
      featuresSummary: row[3] || "",
      imagePrompt: row[4] || "",
      htmlCode: "", // We can keep HTML code blank for historical row loads
      generatedImageUrl: row[5] || undefined,
      googleDriveUrl: row[6] || undefined,
    };
    
    setAnalysisResult(eaData);
    setCustomImagePrompt(row[4] || "");
    setActiveTab("imagePrompt"); // Auto-switch tab to highlight the Leonardo image prompt
    
    // Auto populate and search ForexCracked for this EA
    if (row[1]) {
      setForexCrackedSearch(row[1]);
      handleSearchForexCracked(row[1]);
    }
    
    // Smooth scroll to the workshop section so the user can see it
    setTimeout(() => {
      const workshopElement = document.getElementById("workshop-section");
      if (workshopElement) {
        workshopElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Save parsed result to Google Sheet
  const handleSaveToSheet = async () => {
    if (!analysisResult) return;
    if (!connectedSheet) {
      setErrorMessage("กรุณาเชื่อมต่อหรือสร้าง Google Sheet ก่อนทำการบันทึก");
      return;
    }

    // MANDATORY USER CONFIRMATION DIALOG BEFORE MUTATION
    const confirmed = window.confirm(
      `คุณต้องการบันทึกข้อมูลและสรุปเนื้อหาของ EA "${analysisResult.eaName}" ลงในไฟล์ชีต "${connectedSheet.title}" ใช่หรือไม่?`
    );
    if (!confirmed) return;

    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("เซสชั่น Google หมดอายุ กรุณาลงชื่อเข้าใช้อีกครั้ง");
      return;
    }

    setIsLoadingSheet(true);
    setErrorMessage(null);
    setExportSuccess(false);

    const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    const rowData = [
      timestamp,
      analysisResult.eaName,
      analysisResult.tagline,
      analysisResult.featuresSummary,
      analysisResult.imagePrompt,
      vercelBlobUrl || generatedImageUrl || "", // Permanent URL (or fallback to Leonardo URL)
      googleDriveUrl || "" // Google Drive shared program link
    ];

    try {
      // Save data using Append (A to G)
      const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${connectedSheet.spreadsheetId}/values/EA%20Content!A:G:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          values: [rowData]
        })
      });

      if (!appendResponse.ok) {
        throw new Error("ไม่สามารถส่งข้อมูลลงในชีตได้ กรุณาลองยืนยันสิทธิ์อีกครั้ง");
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
      
      // Update table data
      await handleFetchRows(curToken, connectedSheet.spreadsheetId);
    } catch (err: any) {
      console.error("Save to sheet error:", err);
      setErrorMessage(err.message || "เกิดปัญหาในการส่งข้อมูลไปยัง Google Sheets");
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // 1. Generate Image on Google Gemini Imagen 3, OpenAI DALL-E 3, or Leonardo.ai
  const handleGenerateLeonardoImage = async () => {
    if (!analysisResult) return;
    setIsGeneratingImage(true);
    setImageWorkshopError(null);
    setLeonardoStatus(
      leonardoModel === "dall-e-3"
        ? "กำลังสร้างภาพโฆษณาระดับพรีเมียมด้วย OpenAI DALL-E 3 (HD)..."
        : leonardoModel === "gemini-imagen" 
          ? "กำลังสั่งสร้างรูปภาพ 8K ด้วย Google Gemini Imagen 3 / 8K Engine..." 
          : "กำลังเชื่อมต่อและส่งข้อมูลสเปคภาพไปยัง Leonardo.ai..."
    );
    setErrorMessage(null);

    const [widthStr, heightStr] = leonardoDimension.split("x");
    const widthNum = parseInt(widthStr, 10) || 1024;
    const heightNum = parseInt(heightStr, 10) || 1024;
    const finalModelId = leonardoModel === "custom" ? customModelId.trim() : leonardoModel;
    
    // Auto-enrich the prompt to ensure it generates high-converting, professional trading graphics
    const buildEnrichedPrompt = (basePrompt: string) => {
      let p = (basePrompt || "").trim();
      if (!p) {
        const title = analysisResult?.eaName || "MetaTrader 5 Forex Expert Advisor";
        p = `At the very top, large glowing neon 3D metallic header text displaying "${title}". The image features a powerful, stylized holographic mascot formed from golden light and flowing digital trading data on a high-tech glowing trading platform. In the background, sleek multi-monitor trading stations with glowing green candlestick charts (EURUSD, GBPUSD, XAUUSD) and forex telemetry dashboards with ascending profit trendlines. Ultra-bright cinematic studio lighting, sharp 8k resolution, photorealistic commercial masterpiece`;
      }
      return p;
    };

    const finalSafePrompt = buildEnrichedPrompt(customImagePrompt || analysisResult.imagePrompt || "");

    try {
      const sanitizedKey = (leonardoPassword || "").trim();

      if (leonardoModel !== "gemini-imagen" && leonardoModel !== "dall-e-3" && sanitizedKey.includes("@")) {
        throw new Error("ตรวจพบรูปแบบอีเมลในช่อง API Key: ระบบไม่รองรับการเข้าสู่ระบบ Leonardo.ai ด้วย Gmail หรือรหัสผ่านโดยตรงผ่าน API กรุณาป้อนคีย์ API Key (รหัส UUID 36 หลัก) จากแผงควบคุม Leonardo.ai");
      }

      if (leonardoModel === "dall-e-3" && !openaiApiKey.trim() && !sanitizedKey.startsWith("sk-")) {
        throw new Error("กรุณาระบุ OpenAI API Key (ขึ้นต้นด้วย 'sk-...') ในช่องกรอกด้านบน เพื่อสั่งเจนภาพด้วย DALL-E 3");
      }

      // 1. Try server-side proxy
      let generationId = "";
      let directImageUrl = "";
      try {
        const response = await fetch("/api/leonardo/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: finalSafePrompt,
            clientApiKey: (leonardoModel === "gemini-imagen" || leonardoModel === "dall-e-3") ? "free" : leonardoPassword,
            geminiApiKey: geminiApiKey.trim() || undefined,
            openaiApiKey: openaiApiKey.trim() || (sanitizedKey.startsWith("sk-") ? sanitizedKey : undefined),
            width: widthNum,
            height: heightNum,
            modelId: finalModelId || undefined
          })
        });

        const initData = await parseApiResponse(response);
        generationId = initData.sdGenerationJob?.generationId;
        directImageUrl = initData.imageUrl || "";

        // If backend returned immediate image URL
        if (directImageUrl) {
          setGeneratedImageUrl(directImageUrl);
          const usedModelNotice = initData.modelUsed?.includes("flux")
            ? "✨ สร้างภาพหน้าปก EA คมชัดระดับ 8K สำเร็จเรียบร้อย!"
            : initData.modelUsed?.includes("imagen")
              ? "✨ สร้างภาพสำเร็จด้วย Google Gemini Imagen 3 เรียบร้อยแล้ว!"
              : "✨ สร้างภาพและเปลี่ยนภาพใหม่เรียบร้อยแล้ว!";
          setLeonardoStatus(usedModelNotice);
          setIsGeneratingImage(false);
          return;
        }
      } catch (serverGenErr: any) {
        console.warn("Server generation initiation error:", serverGenErr);
        throw serverGenErr;
      }

      if (!generationId) {
        throw new Error("ไม่สามารถเริ่มคิวงานสร้างภาพได้ กรุณาลองใหม่อีกครั้ง");
      }

      setLeonardoStatus("กำลังประมวลผลและสร้างสรรค์ภาพด้วย AI...");

      // Helper function to check status
      const checkStatus = async () => {
        const statusRes = await fetch(`/api/leonardo/status/${generationId}`, {
          headers: {
            "x-leonardo-key": leonardoPassword
          }
        });

        const statusData = await parseApiResponse(statusRes);
        const job = statusData.generations_by_pk;
        
        if (!job) {
          throw new Error("ไม่สามารถดึงข้อมูลสถานะคิวงานได้");
        }

        if (job.status === "COMPLETE") {
          const images = job.generated_images || [];
          if (images.length > 0) {
            setGeneratedImageUrl(images[0].url);
            setLeonardoStatus("✨ สร้างภาพสำเร็จเรียบร้อย!");
            return true;
          } else {
            throw new Error("สร้างภาพเสร็จสิ้นแต่ไม่พบผลลัพธ์รูปภาพ");
          }
        } else if (job.status === "FAILED") {
          throw new Error("การสร้างรูปภาพล้มเหลว (Failed)");
        }
        return false;
      };

      // Check immediately first (useful for instantaneous synchronous generators)
      try {
        const isDone = await checkStatus();
        if (isDone) {
          setIsGeneratingImage(false);
          return;
        }
      } catch (immediateErr: any) {
        console.warn("Immediate check error:", immediateErr);
      }
      
      // Start polling for 20 attempts, 3s interval
      let attempts = 0;
      const maxAttempts = 20;

      const pollInterval = setInterval(async () => {
        try {
          attempts++;
          const isDone = await checkStatus();
          if (isDone) {
            clearInterval(pollInterval);
            setIsGeneratingImage(false);
            return;
          } else {
            setLeonardoStatus(`กำลังเจนภาพ... (ลองครั้งที่ ${attempts}/${maxAttempts})`);
          }

          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsGeneratingImage(false);
            setLeonardoStatus("");
            setImageWorkshopError("การสร้างรูปภาพใช้เวลานานเกินกำหนด กรุณาลองใหม่อีกครั้ง");
          }
        } catch (pollErr: any) {
          clearInterval(pollInterval);
          setIsGeneratingImage(false);
          setLeonardoStatus("");
          setImageWorkshopError(pollErr.message || "เกิดข้อผิดพลาดในการตรวจสอบความคืบหน้า");
        }
      }, 3000);

    } catch (err: any) {
      console.error("Image generation error:", err);
      const errMsg = err.message || "การสร้างรูปภาพล้มเหลว กรุณาตรวจสอบคีย์หรือเลือกโมเดลอื่น";
      setIsGeneratingImage(false);
      setLeonardoStatus("");
      setImageWorkshopError(errMsg);
      setErrorMessage(errMsg);
    }
  };

  // Local file handler
  const handleLocalFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalFileName(file.name);
    setLocalFileType(file.type);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setLocalFileBase64(base64);
      setLocalPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // 3. Upload image to Vercel Blob (supports Leonardo.ai generated image or direct local files)
  const handleUploadToVercelBlob = async () => {
    const imageToUpload = localFileBase64 || generatedImageUrl;
    if (!imageToUpload) {
      setErrorMessage("กรุณาสร้างภาพหรือเลือกรูปภาพจากคลัง/เครื่องของท่านก่อนทำการอัปโหลด");
      return;
    }
    
    const cleanedToken = vercelBlobToken
      .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "")
      .replace(/["']/g, "")
      .replace(/[\s\r\n\t]/g, "")
      .trim();

    if (!cleanedToken) {
      setErrorMessage("กรุณาระบุ Vercel BLOB_READ_WRITE_TOKEN หรือคลิกปุ่ม '⚡ ใช้รูปนี้ทันที' หากไม่ต้องการใช้งาน Vercel");
      setVercelBlobStatus("⚠️ ยังไม่ได้ระบุ BLOB_READ_WRITE_TOKEN หรือสามารถกดปุ่ม '⚡ ใช้รูปนี้ทันที' ด้านล่างได้เลย");
      return;
    }

    setIsUploadingToVercelBlob(true);
    setErrorMessage(null);
    setVercelBlobStatus("กำลังอัปโหลดรูปภาพเข้าสู่ Vercel Blob Storage...");

    try {
      let finalUploadedUrl = "";

      // Check if image is local base64 or external URL
      if (localFileBase64) {
        // Convert base64 to File / Blob
        const byteCharacters = atob(localFileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const fileBlob = new Blob([byteArray], { type: localFileType || "image/jpeg" });
        const nameToUse = analysisResult 
          ? `${analysisResult.eaName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}_${Date.now()}_${localFileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-")}` 
          : `uploaded_${Date.now()}_${localFileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-")}`;

        // Attempt 1: Direct client-side upload via Vercel Blob API
        try {
          const directRes = await fetch(`https://blob.vercel-storage.com/${nameToUse}`, {
            method: "PUT",
            headers: {
              "authorization": `Bearer ${cleanedToken}`,
              "x-api-version": "7",
              "content-type": localFileType || "image/jpeg"
            },
            body: fileBlob
          });

          if (directRes.ok) {
            const blobData = await directRes.json();
            finalUploadedUrl = blobData.url;
          }
        } catch (directErr) {
          console.warn("Direct blob upload attempt failed, trying backend proxy:", directErr);
        }

        // Attempt 2: Server-side proxy if direct didn't return URL
        if (!finalUploadedUrl) {
          const response = await fetch("/api/vercel/blob/upload-base64", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Data: localFileBase64,
              contentType: localFileType,
              customToken: cleanedToken,
              fileName: nameToUse
            })
          });
          const data = await parseApiResponse(response);
          finalUploadedUrl = data.url;
        }
      } else {
        // For generated image (external URL or base64)
        const nameToUse = analysisResult 
          ? `${analysisResult.eaName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}_${Date.now()}.jpg` 
          : `ea_image_${Date.now()}.jpg`;

        // If generatedImageUrl is base64 data URL
        if (generatedImageUrl.startsWith("data:")) {
          const parts = generatedImageUrl.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const fileBlob = new Blob([u8arr], { type: mime });

          try {
            const directRes = await fetch(`https://blob.vercel-storage.com/${nameToUse}`, {
              method: "PUT",
              headers: {
                "authorization": `Bearer ${cleanedToken}`,
                "x-api-version": "7",
                "content-type": mime
              },
              body: fileBlob
            });
            if (directRes.ok) {
              const blobData = await directRes.json();
              finalUploadedUrl = blobData.url;
            }
          } catch (directErr) {
            console.warn("Direct blob upload for data URL failed:", directErr);
          }
        }

        // Server-side proxy fallback
        if (!finalUploadedUrl) {
          const response = await fetch("/api/vercel/blob/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: generatedImageUrl,
              customToken: cleanedToken,
              fileName: nameToUse
            })
          });
          const data = await parseApiResponse(response);
          finalUploadedUrl = data.url;
        }
      }

      if (!finalUploadedUrl) {
        throw new Error("ไม่ได้รับ URL รูปภาพจาก Vercel Blob กรุณาตรวจสอบสิทธิ์ของ BLOB_READ_WRITE_TOKEN");
      }

      setVercelBlobUrl(finalUploadedUrl);
      setVercelBlobStatus("อัปโหลดสำเร็จแล้ว! ลิงก์พร้อมส่งเข้า Google Sheets เรียบร้อย");
    } catch (err: any) {
      console.error("Upload to Vercel Blob failed:", err);
      const errMsg = err.message || "ไม่สามารถอัปโหลดรูปไปยัง Vercel Blob ได้";
      setErrorMessage(errMsg);
      setVercelBlobStatus(`❌ ข้อผิดพลาด: ${errMsg}`);
    } finally {
      setIsUploadingToVercelBlob(false);
    }
  };

  // Google Drive files browser list
  const handleListDriveFiles = async (query = "") => {
    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("กรุณาลงชื่อเข้าใช้งาน Google ก่อนเพื่อแสดงไฟล์");
      return;
    }

    setIsListingDriveFiles(true);
    setErrorMessage(null);

    try {
      let q = "trashed=false";
      if (query.trim()) {
        q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
      } else {
        // Try listing files that look like EAs or standard formats
        q += " and (name contains '.ex4' or name contains '.ex5' or name contains '.mq4' or name contains '.mq5' or name contains '.zip')";
      }

      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink,mimeType)&pageSize=15`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${curToken}` }
      });

      if (!res.ok) {
        throw new Error("ดึงข้อมูลจาก Google Drive ล้มเหลว");
      }

      const data = await res.json();
      if (data.files && data.files.length > 0) {
        setGoogleDriveFiles(data.files);
      } else {
        // Fallback: list any 10 files if no specific EA files are found
        const fallbackUrl = `https://www.googleapis.com/drive/v3/files?q=trashed%3Dfalse&fields=files(id%2Cname%2CwebViewLink%2CmimeType)&pageSize=10`;
        const fbRes = await fetch(fallbackUrl, {
          headers: { Authorization: `Bearer ${curToken}` }
        });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          setGoogleDriveFiles(fbData.files || []);
        } else {
          setGoogleDriveFiles([]);
        }
      }
    } catch (err: any) {
      console.error("Google Drive list files failed:", err);
      setErrorMessage("เกิดปัญหาในการติดต่อ Google Drive เพื่อแสดงรายการไฟล์");
    } finally {
      setIsListingDriveFiles(false);
    }
  };

  // 2. Package and Upload static showcase HTML file to Google Drive using Google REST API
  const handleSaveToDrive = async () => {
    if (!analysisResult) return;
    const curToken = await checkToken();
    if (!curToken) {
      setErrorMessage("กรุณาลงชื่อเข้าใช้งาน Google ก่อนเพื่อเชื่อมต่อ Google Drive");
      return;
    }

    setIsSavingToDrive(true);
    setErrorMessage(null);
    setGoogleDriveUrl("");

    try {
      // Build self-contained beautiful static showcase HTML file (Tailwind + Inter font)
      const packagedHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysisResult.eaName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #0f172a;
      }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-4xl">
        ${analysisResult.htmlCode}
    </div>
</body>
</html>`;

      const fileName = `${analysisResult.eaName.replace(/\s+/g, "_")}_showcase.html`;

      // 1. Create file metadata in Google Drive
      const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: "text/html"
        })
      });

      if (!createRes.ok) {
        throw new Error("ไม่สามารถจองพื้นที่สร้างไฟล์ใน Google Drive ได้");
      }

      const fileMeta = await createRes.json();
      const fileId = fileMeta.id;

      // 2. Upload raw HTML media to Google Drive
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${curToken}`,
          "Content-Type": "text/html"
        },
        body: packagedHtml
      });

      if (!uploadRes.ok) {
        throw new Error("จองไฟล์สำเร็จ แต่ไม่สามารถอัปโหลดข้อมูล HTML ได้");
      }

      // 3. Set standard public view permission so anyone with link can preview it
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
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
      } catch (permErr) {
        console.warn("Failed to set public permissions (this is optional):", permErr);
      }

      // 4. Retrieve webViewLink
      const infoRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=webViewLink`, {
        headers: { Authorization: `Bearer ${curToken}` }
      });

      if (infoRes.ok) {
        const fileInfo = await infoRes.json();
        setGoogleDriveUrl(fileInfo.webViewLink || `https://drive.google.com/file/d/${fileId}/view`);
      } else {
        setGoogleDriveUrl(`https://drive.google.com/file/d/${fileId}/view`);
      }

    } catch (err: any) {
      console.error("Save to Google Drive failed:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Google Drive");
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // 3. Deploy packaged HTML to Vercel via server proxy
  const handleDeployToVercel = async () => {
    if (!analysisResult) return;
    if (!vercelToken.trim()) {
      setErrorMessage("กรุณาระบุ Vercel Personal Access Token ในแท็บ Vercel ก่อนทำการดีพลอย");
      return;
    }

    setIsDeployingToVercel(true);
    setErrorMessage(null);
    setVercelUrl("");

    const packagedHtml = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${analysisResult.eaName}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #0f172a;
      }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen flex items-center justify-center p-4 sm:p-8">
    <div class="w-full max-w-4xl">
        ${analysisResult.htmlCode}
    </div>
</body>
</html>`;

    try {
      const response = await fetch("/api/vercel/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vercelToken: vercelToken.trim(),
          name: vercelProjectName,
          htmlCode: packagedHtml
        })
      });

      const data = await parseApiResponse(response);
      if (data.url) {
        setVercelUrl(`https://${data.url}`);
      } else {
        throw new Error("ระบบสร้างดีพลอยสำเร็จแต่ไม่ได้รับลิงก์ URL ตอบกลับ");
      }

    } catch (err: any) {
      console.error("Vercel deploy failed:", err);
      setErrorMessage(err.message || "เกิดข้อผิดพลาดในการดีพลอยหน้าเว็บไปที่ Vercel");
    } finally {
      setIsDeployingToVercel(false);
    }
  };

  // Create custom iframe Tailwind preview doc
  const getSrcDoc = (htmlContent: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background-color: transparent;
              margin: 0;
              padding: 16px;
            }
          </style>
        </head>
        <body class="p-2 sm:p-4">
          ${htmlContent}
        </body>
      </html>
    `;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased font-sans pb-16">
      {/* Top Banner & Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <FileSpreadsheet className="w-6 h-6" id="app_logo_icon" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                EA Content Extractor
                <span className="bg-indigo-50 text-indigo-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                  Google Sheets + Gemini
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                ดึงและแยกแยะข้อมูลคำโปรย โค้ด HTML และฟีเจอร์ลง Google Sheet ด้วยระบบ AI อัจฉริยะ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              title="เปิดแอปในหน้าต่างใหม่ หากเกิดปัญหาป๊อบอัพเข้าสู่ระบบถูกบล็อก"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดในแท็บใหม่</span>
            </a>

            {user ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="avatar" 
                    className="w-6 h-6 rounded-full border border-slate-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-none">{user.displayName || "Google User"}</p>
                  <p className="text-[10px] text-slate-400">{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  title="ลงชื่อออก"
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-500 transition-colors ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-xs"
              >
                {isLoggingIn ? (
                  <div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Alerts / Error message box */}
        {errorMessage && (
          <div className="col-span-12 bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-rose-800 shadow-xs animate-fade-in">
            <div className="flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-rose-900">เกิดข้อผิดพลาดในการทำงาน</p>
                <p className="text-rose-700/90 leading-relaxed mt-0.5">{errorMessage}</p>
                {(errorMessage.includes("Google") || errorMessage.includes("ป๊อบอัพ") || errorMessage.includes("ลงชื่อเข้าใช้")) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      เปิดแอปในหน้าต่างใหม่ (New Tab) เพื่อลงชื่อเข้าใช้
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-xs text-rose-400 hover:text-rose-600 font-semibold px-2 py-1 rounded-md shrink-0 cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Mode Navigation Bar */}
        <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => { setAppActiveMode("ea"); handleSelectCategory("ea"); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                appActiveMode === "ea" && contentCategory === "ea"
                  ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>📈 สกัดเนื้อหา Forex EA (บอทเทรด MT4/MT5)</span>
            </button>

            <button
              type="button"
              onClick={() => { setAppActiveMode("ea"); handleSelectCategory("movie"); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                appActiveMode === "ea" && contentCategory === "movie"
                  ? "bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white shadow-sm ring-2 ring-amber-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Film className="w-4 h-4 text-amber-300" />
              <span>🎬 สกัดภาพยนตร์ (Bilibili + Snapwc + OneDrive)</span>
            </button>

            <button
              type="button"
              onClick={() => { setAppActiveMode("ea"); handleSelectCategory("software"); }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                appActiveMode === "ea" && contentCategory === "software"
                  ? "bg-slate-800 text-white shadow-sm ring-2 ring-slate-400"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Laptop className="w-4 h-4 text-sky-400" />
              <span>🖥️ สกัดซอฟต์แวร์ (PC/Mac)</span>
            </button>

            <button
              type="button"
              onClick={() => setAppActiveMode("sheets")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                appActiveMode === "sheets"
                  ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-300"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Cloud className="w-4 h-4 text-sky-200" />
              <span>☁️ ฐานข้อมูล OneDrive / Excel Database</span>
              {sheetRows.length > 0 && (
                <span className="bg-sky-500/30 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {sheetRows.length} แถว
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 px-2 text-xs text-slate-500 font-medium">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">เว็บไซต์เป้าหมาย:</span>
            <a 
              href="https://potnuengshop.com" 
              target="_blank" 
              rel="noreferrer"
              className="font-bold text-slate-800 hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
            >
              <span>potnuengshop.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Left Column: Inputs and Preset Selectors (span 5) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">

          {/* Card 1: Input Information (Movie / Software / EA) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            
            {/* Category Selector Tabs */}
            <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => handleSelectCategory("ea")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contentCategory === "ea"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>📈 Forex EA (บอทเทรด)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("movie")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contentCategory === "movie"
                    ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>🎬 ภาพยนตร์ & ซีรีส์</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectCategory("software")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  contentCategory === "software"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>🖥️ ซอฟต์แวร์ (Software)</span>
              </button>
            </div>

            {/* Movie Bilibili & Snapwc Integration Box */}
            {contentCategory === "movie" && (
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-amber-500/30 rounded-2xl p-4.5 text-white shadow-md flex flex-col gap-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Film className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">
                        ดึงลิงก์หนังจาก Bilibili.tv & แปลงไฟล์ใน Snapwc.com
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        ไม่ต้องใช้ iframe แล้ว นำไฟล์ MP4 เก็บไว้บน OneDrive ของคุณได้โดยตรง
                      </p>
                    </div>
                  </div>
                  <a
                    href="https://www.bilibili.tv"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>เปิด Bilibili.tv</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Bilibili URL input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-sky-400" />
                    <span>1. วางลิงก์ภาพยนตร์ Bilibili.tv:</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={bilibiliMovieUrl}
                      onChange={(e) => setBilibiliMovieUrl(e.target.value)}
                      placeholder="เช่น https://www.bilibili.tv/th/video/478923... หรือ https://bilibili.tv/video/..."
                      className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {bilibiliMovieUrl && (
                      <button
                        type="button"
                        onClick={handleExtractBilibiliInfo}
                        className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1"
                        title="ดึงข้อมูลลงช่องสกัดเนื้อหาด้านล่าง"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ใส่ช่องสกัด</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Snapwc action button */}
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={handleOpenSnapwc}
                    className="w-full bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-600 hover:to-rose-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all hover:scale-[1.01]"
                  >
                    <ExternalLink className="w-4 h-4 text-amber-200" />
                    <span>🚀 เปิดแปลงไฟล์ใน Snapwc.com (คัดลอกลิงก์อัตโนมัติ)</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center">
                    เมื่อกดปุ่ม ระบบจะคัดลอกลิงก์ Bilibili ให้ทันที เพื่อให้คุณกด <strong>Ctrl+V</strong> วางบน Snapwc.com แล้วโหลดไฟล์ MP4
                  </p>
                </div>

                {bilibiliActionStatus && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{bilibiliActionStatus}</span>
                  </div>
                )}

                {/* 4-Step Workflow Helper Banner */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 text-[10px] text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-amber-400">1. ก็อปลิงก์</span>
                    <span className="text-slate-400">จาก Bilibili.tv</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-amber-400">2. แปลงไฟล์</span>
                    <span className="text-slate-400">ใน Snapwc.com (MP4)</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sky-400">3. เก็บไฟล์</span>
                    <span className="text-slate-400">ไว้บน OneDrive</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-400">4. สกัดเนื้อหา</span>
                    <span className="text-slate-400">คำโปรย+เรื่องย่อ+โปสเตอร์</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <span>
                  {contentCategory === "movie"
                    ? "ข้อมูลภาพยนตร์, คำโปรย และรายละเอียดรูปภาพโปสเตอร์"
                    : (contentCategory === "software" 
                      ? "1. ระบุชื่อโปรแกรม หรือสเปคซอฟต์แวร์ (พร้อมวิเคราะห์)"
                      : "1. ข้อมูลกลยุทธ์ หรือสเปค EA (พร้อมวิเคราะห์)"
                    )
                  }
                </span>
              </div>
              {inputText && (
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(inputText);
                    setForexCrackedCopied(true);
                    setTimeout(() => setForexCrackedCopied(false), 2000);
                  }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  <span>{forexCrackedCopied ? "คัดลอกแล้ว!" : "คัดลอก"}</span>
                </button>
              )}
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              {contentCategory === "movie" ? (
                <>ป้อนชื่อภาพยนตร์ (เช่น <strong>Avatar: Fire and Ash (2026) 4K</strong>, <strong>ดาบพิฆาตอสูร ปราสาทไร้ขอบเขต</strong>), ปีที่ฉาย หรือคัดลอกคำอธิบายเรื่องย่อจาก Bilibili เพื่อให้ Gemini เจน<strong>คำโปรยภาพยนตร์สั้นดึงดูดใจ</strong>, <strong>เรื่องย่อ & ข้อมูลภาพยนตร์ (ความยาว, หมวดหมู่, นักแสดง, สเปก 4K HDR)</strong>, โค้ด Cinema Showcase และ <strong>พร้อมต์โปสเตอร์ภาพยนตร์ระดับ 8K</strong> ทันที</>
              ) : (contentCategory === "software" ? (
                <>ป้อนชื่อซอฟต์แวร์ (เช่น <strong>DaVinci Resolve Studio 19</strong>, <strong>Adobe Premiere Pro</strong>, <strong>AutoCAD</strong>, <strong>Blender</strong>) หรือข้อมูลเวอร์ชัน/สเปกติดตั้ง เพื่อให้ Gemini เจน<strong>คำโปรยการตลาด</strong>, <strong>รายละเอียดฟีเจอร์ & ความต้องการของระบบ (System Requirements)</strong>, โค้ด Showcase และ <strong>Prompt ภาพ 8K</strong> สำหรับโปรแกรมทันที</>
              ) : (
                <>คุณสามารถระบุคำอธิบายระบบเทรด, ข้อมูลตัวชี้วัด (Indicators), หรือวางโค้ด MQL / ข้อมูลที่ดึงจาก ForexCracked เพื่อให้ Gemini ช่วยคัดสรรคำโปรยการตลาดที่โดนใจ และเขียนโค้ด HTML โชว์เคสฟีเจอร์ให้ทันที</>
              ))}
            </p>

            <textarea
              className="w-full min-h-[130px] bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all placeholder-slate-400"
              placeholder={
                contentCategory === "movie"
                  ? "วางชื่อภาพยนตร์ เช่น Avatar: Fire and Ash (2026) 4K IMAX, ดาบพิฆาตอสูร ภาคปราสาทไร้ขอบเขต หรือวางเรื่องย่อและรายละเอียดภาพยนตร์ที่นี่..."
                  : (contentCategory === "software"
                    ? "วางชื่อโปรแกรม เช่น DaVinci Resolve Studio 18.1.3 (x64), Adobe Premiere Pro 2024 หรือระบุรายละเอียดโปรแกรม/สเปกติดตั้งที่นี่..."
                    : "วางข้อมูลสเปคอธิบาย EA, โค้ดโปรแกรมเมอร์ หรือไอเดียจุดเข้าซื้อขายได้ที่นี่ (หรือใช้ปุ่มดึงข้อมูลจาก ForexCracked ด้านล่าง)..."
                  )
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            {/* Gemini API Key Configuration Box */}
            <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/70 border border-indigo-200 rounded-xl p-3.5 flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Gemini API Key
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {geminiApiKey ? "✅ บันทึกคีย์ในเบราว์เซอร์แล้ว" : "⚠️ กรุณาวาง Gemini API Key เพื่อเริ่มวิเคราะห์"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestGeminiKey()}
                    disabled={isTestingGeminiKey || !geminiApiKey.trim()}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 disabled:opacity-50 px-2.5 py-1 rounded-lg shadow-2xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isTestingGeminiKey ? (
                      <>
                        <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>กำลังทดสอบ...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>ทดสอบคีย์</span>
                      </>
                    )}
                  </button>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg shadow-2xs"
                  >
                    <span>รับคีย์ฟรี</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type={showGeminiKeyInput ? "text" : "password"}
                  placeholder="วาง Gemini API Key ที่นี่ (ขึ้นต้นด้วย AIzaSy...)"
                  value={geminiApiKey}
                  onChange={(e) => handleSaveGeminiKey(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKeyInput(!showGeminiKeyInput)}
                  title={showGeminiKeyInput ? "ซ่อนคีย์" : "แสดงคีย์"}
                  className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors"
                >
                  {showGeminiKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {geminiApiKey && (
                  <button
                    type="button"
                    onClick={() => handleSaveGeminiKey("")}
                    title="ลบคีย์"
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Real-time Key Test Result Banner */}
              {geminiKeyTestStatus && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  geminiKeyTestStatus.ok 
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium" 
                    : "bg-rose-50 text-rose-800 border border-rose-200 font-medium"
                }`}>
                  {geminiKeyTestStatus.ok ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{geminiKeyTestStatus.message}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{geminiKeyTestStatus.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Presets & Analyze Button */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">
                {contentCategory === "movie"
                  ? "เลือกภาพยนตร์ตัวอย่างยอดนิยม (คลิกเพื่อทดสอบทันที):"
                  : (contentCategory === "software" 
                    ? "เลือกตัวอย่างโปรแกรมยอดนิยม (คลิกเพื่อทดสอบทันที):" 
                    : "หรือเลือกเทมเพลตตัวอย่างกลยุทธ์ยอดนิยม:"
                  )
                }
              </span>
              <div className="grid grid-cols-1 gap-2">
                {contentCategory === "movie" ? (
                  MOVIE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputText(`${preset.name}\n${preset.description}`);
                        if (preset.bilibiliUrl) setBilibiliMovieUrl(preset.bilibiliUrl);
                      }}
                      className="p-2.5 text-left border border-amber-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/40 transition-all group flex flex-col gap-1 cursor-pointer bg-white shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-amber-700 flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5 text-amber-500" />
                          <span>{preset.name}</span>
                        </span>
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                          4K ภาพยนตร์
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {preset.description}
                      </span>
                    </button>
                  ))
                ) : contentCategory === "software" ? (
                  SOFTWARE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(`${preset.name}\n${preset.description}`)}
                      className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group flex flex-col gap-1 cursor-pointer bg-white shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{preset.name}</span>
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {preset.description}
                      </span>
                    </button>
                  ))
                ) : (
                  PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(preset.description)}
                      className="p-2.5 text-left border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/40 transition-all group flex flex-col gap-1 cursor-pointer bg-white shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-600">
                          {preset.name}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1">
                        {preset.description}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim() || !geminiApiKey.trim()}
              className={`w-full font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-sm ${
                contentCategory === "movie"
                  ? "bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-700 hover:to-rose-800 text-white disabled:bg-slate-300"
                  : "bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    {contentCategory === "movie" 
                      ? "Gemini กำลังสกัดคำโปรย เรื่องย่อ & พร้อมต์โปสเตอร์ภาพยนตร์..." 
                      : (contentCategory === "software" 
                        ? "Gemini กำลังเจนคำโปรย & สเปกซอฟต์แวร์..." 
                        : "Gemini กำลังวิเคราะห์กลยุทธ์ EA, คำโปรย & พร้อมต์ภาพ 8K..."
                      )
                    }
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {contentCategory === "movie"
                      ? "🎬 สกัดข้อมูลภาพยนตร์ + คำโปรย + เรื่องย่อ + พร้อมต์โปสเตอร์ 8K ✨"
                      : (contentCategory === "software" 
                        ? "🚀 เจนคำโปรย สเปก & ภาพ 8K ซอฟต์แวร์ ✨" 
                        : "📈 สกัดข้อมูลกลยุทธ์ EA + คำโปรย + สรุปฟีเจอร์ + พร้อมต์ภาพ 8K ✨"
                      )
                    }
                  </span>
                </>
              )}
            </button>
          </div>

          {/* ForexCracked Card: Only displayed when in EA mode */}
          {contentCategory === "ea" && (
            <ForexCrackedCard
              forexCrackedCopied={forexCrackedCopied}
              handleCopyForexCrackedUrl={handleCopyForexCrackedUrl}
              forexCrackedUrl={forexCrackedUrl}
              setForexCrackedUrl={setForexCrackedUrl}
              handleFetchForexCracked={handleFetchForexCracked}
              isFetchingForexCracked={isFetchingForexCracked}
              forexCrackedSearch={forexCrackedSearch}
              setForexCrackedSearch={setForexCrackedSearch}
              handleSearchForexCracked={handleSearchForexCracked}
              forexCrackedStatus={forexCrackedStatus}
              setForexCrackedStatus={setForexCrackedStatus}
              forexCrackedResults={forexCrackedResults}
              setForexCrackedResults={setForexCrackedResults}
              forexCrackedData={forexCrackedData}
            />
          )}

          {/* Card 2: Microsoft OneDrive (Excel Database) Integration */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold">
                <Cloud className="w-5 h-5 text-sky-600" />
                <span>2. ดึงข้อมูลจาก Microsoft OneDrive (Excel Database)</span>
              </div>
              {connectedOneDrive && (
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-sky-600" /> เชื่อมต่อแล้ว
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              ดึงข้อมูลจากไฟล์ Excel หรือ CSV บน <strong>Microsoft OneDrive</strong> / SharePoint ผ่านลิงก์แชร์ หรืออัปโหลดไฟล์ตารางจาก OneDrive บนเครื่องของคุณโดยตรง พร้อมส่งออกและอัปเดตข้อมูลได้ทันที
            </p>

            {/* If connected to OneDrive or has synced file */}
            {connectedOneDrive ? (
              <div className="flex flex-col gap-3">
                <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-950 truncate max-w-[240px] flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{connectedOneDrive.name}</span>
                    </span>
                    <span className="text-[10px] bg-white border border-sky-200 text-sky-800 font-semibold px-2 py-0.5 rounded-md">
                      {sheetRows.length} แถว
                    </span>
                  </div>
                  {connectedOneDrive.url && connectedOneDrive.url.startsWith("http") && (
                    <a
                      href={connectedOneDrive.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1 font-semibold truncate"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{connectedOneDrive.url}</span>
                    </a>
                  )}
                  {connectedOneDrive.lastSynced && (
                    <p className="text-[10px] text-slate-500">
                      ซิงค์ล่าสุด: {connectedOneDrive.lastSynced}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFetchOneDrive()}
                    disabled={isLoadingOneDrive || !oneDriveUrl.trim()}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOneDrive ? "animate-spin" : ""}`} />
                    <span>{isLoadingOneDrive ? "กำลังดึงข้อมูล..." : "ซิงค์จาก OneDrive อีกครั้ง"}</span>
                  </button>
                  <button
                    onClick={() => {
                      setConnectedOneDrive(null);
                      setOneDriveUrl("");
                      localStorage.removeItem("connected_onedrive_url");
                      localStorage.removeItem("connected_onedrive_name");
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 px-3 py-2 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    สลับไฟล์
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Method 1: OneDrive Sharing Link */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>วางลิงก์แชร์ OneDrive (Sharing Link / Direct Link)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={oneDriveUrl}
                      onChange={(e) => setOneDriveUrl(e.target.value)}
                      placeholder="https://1drv.ms/x/... หรือ onedrive.live.com..."
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                    />
                    <button
                      onClick={() => handleFetchOneDrive()}
                      disabled={isLoadingOneDrive || !oneDriveUrl.trim()}
                      className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
                    >
                      {isLoadingOneDrive ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Cloud className="w-3.5 h-3.5" />
                      )}
                      <span>ดึงข้อมูล</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    💡 รองรับลิงก์แชร์ของไฟล์ Excel (.xlsx, .xls) หรือโฟลเดอร์จาก OneDrive ส่วนตัวและ OneDrive for Business
                  </p>
                </div>

                <div className="flex items-center gap-2 text-slate-400 my-1">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-[10px] uppercase font-bold">หรือ</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>

                {/* Method 2: Upload Excel File from OneDrive Folder on PC */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    อัปโหลดไฟล์ตาราง Excel จากโฟลเดอร์ OneDrive ในเครื่อง (.xlsx, .xls, .csv)
                  </label>
                  <div className="border border-dashed border-sky-300 hover:border-sky-500 rounded-xl p-3 bg-sky-50/30 hover:bg-sky-50/60 transition-colors text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleUploadExcelFile}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-sky-800 font-medium">
                      <FolderDown className="w-4 h-4 text-sky-600" />
                      <span>คลิกเพื่อเลือกไฟล์ตาราง หรือลากไฟล์มาวางที่นี่</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions for OneDrive Table */}
            <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportOneDriveExcel}
                disabled={sheetRows.length === 0}
                className="flex-1 min-w-[130px] bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold text-xs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="ดาวน์โหลดไฟล์ .xlsx พร้อมข้อมูลล่าสุดเพื่ออัปโหลดเก็บใน OneDrive"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>ดาวน์โหลด Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyTableForOneDrive}
                disabled={sheetRows.length === 0}
                className="flex-1 min-w-[130px] bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-800 border border-sky-200 font-semibold text-xs py-2 px-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="คัดลอกข้อมูลทั้งหมดเพื่อนำไปวาง (Ctrl+V) ลงบน Excel Online ของ OneDrive"
              >
                <Copy className="w-3.5 h-3.5 text-sky-600" />
                <span>คัดลอกตาราง (วางใน OneDrive)</span>
              </button>
            </div>

            {/* Status Message */}
            {oneDriveStatusMessage && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                oneDriveStatusMessage.startsWith("❌")
                  ? "bg-rose-50 text-rose-800 border border-rose-200"
                  : "bg-sky-50 text-sky-900 border border-sky-200"
              }`}>
                <span>{oneDriveStatusMessage}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: 3. Results & 4. Workshop (span 7) */}
        {appActiveMode === "ea" && (
          <section className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          {/* Results Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {contentCategory === "movie"
                    ? "3. ข้อมูลภาพยนตร์, คำโปรย, เรื่องย่อ & โค้ดโชว์เคส (Movie Results)"
                    : (contentCategory === "software"
                      ? "3. ผลการวิเคราะห์โปรแกรม & ข้อมูลพร้อมใช้ (Software Results)"
                      : "3. ผลการวิเคราะห์ & ข้อมูลพร้อมใช้ (EA Results)"
                    )
                  }
                </h3>
              </div>
              {analysisResult && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveToOneDriveTable}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                    title="บันทึกผลการวิเคราะห์นี้ลงในตาราง OneDrive ทันที"
                  >
                    <Cloud className="w-3.5 h-3.5 text-white" />
                    <span>บันทึกลงตาราง OneDrive ☁️</span>
                  </button>

                  {connectedSheet && (
                    <button
                      onClick={handleSaveToSheet}
                      disabled={isLoadingSheet}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                      title="บันทึกข้อมูลนี้ลง Google Sheets สำรอง"
                    >
                      {isLoadingSheet ? (
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>ลง Sheet 📊</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {exportSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>บันทึกข้อมูลสำเร็จเรียบร้อยแล้ว! ข้อมูลจะแสดงในตารางฐานข้อมูลด้านล่าง</span>
              </div>
            )}

            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Sparkles className="w-10 h-10 stroke-1 text-slate-300" />
                <p className="text-sm">
                  {contentCategory === "movie"
                    ? "กรอกชื่อภาพยนตร์หรือวางลิงก์ Bilibili ด้านซ้าย แล้วกดปุ่ม \"สกัดข้อมูลภาพยนตร์\" เพื่อดูผลลัพธ์ที่นี่"
                    : (contentCategory === "software"
                      ? "กรอกชื่อซอฟต์แวร์หรือสเปกโปรแกรมด้านซ้าย แล้วกดปุ่ม \"เจนคำโปรย สเปก & ภาพ 8K ซอฟต์แวร์\" เพื่อดูผลลัพธ์ที่นี่"
                      : "กรอกข้อมูลระบบเทรดด้านซ้าย แล้วกดปุ่ม \"วิเคราะห์และแยกข้อมูลด่วน\" เพื่อดูผลลัพธ์ที่นี่"
                    )
                  }
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-indigo-600 font-semibold">
                  {contentCategory === "movie"
                    ? "Gemini AI กำลังสกัดคำโปรย เรื่องย่อ ข้อมูลสเปกภาพยนตร์ 4K และโค้ด Cinema Showcase..."
                    : (contentCategory === "software"
                      ? "Gemini AI กำลังวิเคราะห์สเปกโปรแกรม สร้างคำโปรย และประกอบการ์ดนำเสนอ..."
                      : "Gemini AI กำลังวิเคราะห์สเปค EA และสร้างสรรค์คำโปรย..."
                    )
                  }
                </p>
              </div>
            )}

            {analysisResult && (
              <div className="flex flex-col gap-4">
                {/* Header Info Banner */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full border border-indigo-200 flex items-center gap-1">
                      {contentCategory === "movie" ? <Film className="w-3 h-3 text-amber-600" /> : (contentCategory === "software" ? <Laptop className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />)}
                      <span>
                        {contentCategory === "movie"
                          ? "ชื่อภาพยนตร์ & ปีที่ฉาย (Official Movie Title)"
                          : (contentCategory === "software" ? "ชื่อซอฟต์แวร์ / เวอร์ชั่น (Software Version)" : "ชื่อ EA ที่แนะนำ")
                        }
                      </span>
                    </span>
                    {contentCategory === "ea" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (analysisResult.eaName) {
                            setForexCrackedSearch(analysisResult.eaName);
                            handleSearchForexCracked(analysisResult.eaName);
                            const el = document.getElementById("forexcracked-section");
                            if (el) el.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border border-amber-400/50 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all cursor-pointer shadow-2xs"
                        title="ค้นหา EA นี้บน ForexCracked.com ทันที"
                      >
                        <Search className="w-3 h-3 text-amber-600" />
                        <span>ค้นหาบน ForexCracked</span>
                      </button>
                    )}
                  </div>
                  <h4 className="text-lg font-extrabold text-slate-900">{analysisResult.eaName}</h4>
                </div>

                {/* Tab Navigation for Results */}
                <div className="flex border-b border-slate-200 gap-2 text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("tagline")}
                    className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === "tagline"
                        ? "border-indigo-600 text-indigo-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {contentCategory === "movie" ? "1. คำโปรยภาพยนตร์ HTML (Tagline)" : "1. คำโปรย HTML (Tagline)"}
                  </button>
                  <button
                    onClick={() => setActiveTab("features")}
                    className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === "features"
                        ? "border-indigo-600 text-indigo-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {contentCategory === "movie"
                      ? "2. เรื่องย่อ & ข้อมูลภาพยนตร์ HTML (Synopsis & Specs)"
                      : (contentCategory === "software" 
                        ? "2. สเปก & ฟีเจอร์ HTML (Specs & Features)" 
                        : "2. สรุปฟีเจอร์ HTML (Features)"
                      )
                    }
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === "preview"
                        ? "border-indigo-600 text-indigo-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {contentCategory === "movie" ? "3. กล่องภาพยนตร์ (Cinema Card Preview)" : "3. การ์ดนำเสนอ (Card Preview)"}
                  </button>
                  <button
                    onClick={() => setActiveTab("imagePrompt")}
                    className={`pb-2 px-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === "imagePrompt"
                        ? "border-indigo-600 text-indigo-600 font-bold"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {contentCategory === "movie"
                      ? "4. พรอมต์โปสเตอร์หนัง 8K (Poster Prompt)"
                      : (contentCategory === "software" 
                        ? "4. พรอมต์ภาพซอฟต์แวร์ 8K (Image Prompt)" 
                        : "4. พรอมต์ภาพ 8K (Image Prompt)"
                      )
                    }
                  </button>
                </div>

                {/* Tab 1: Tagline */}
                {activeTab === "tagline" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        {contentCategory === "movie" ? "คำโปรยภาพยนตร์สั้นดึงดูดใจ (Movie Tagline HTML):" : "ผลลัพธ์คำโปรยการตลาด (Tagline HTML):"}
                      </span>
                      <button
                        onClick={() => copyToClipboard(analysisResult.tagline)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด HTML"}</span>
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
                      <div className="bg-slate-900 text-slate-200 p-3 font-mono text-xs overflow-x-auto">
                        <code>{analysisResult.tagline}</code>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          การแสดงผลจริง (Rendered Preview):
                        </span>
                        <div 
                          dangerouslySetInnerHTML={{ __html: analysisResult.tagline }} 
                          className="text-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Features & System Requirements */}
                {activeTab === "features" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        {contentCategory === "movie"
                          ? "เรื่องย่อ & ข้อมูลภาพยนตร์ (Synopsis & Specifications HTML):"
                          : (contentCategory === "software" 
                            ? "สรุปฟีเจอร์เด่น & สเปกระบบคอมพิวเตอร์ (Specs & Features HTML):" 
                            : "สรุปฟีเจอร์และจุดเด่น (Features HTML):"
                          )
                        }
                      </span>
                      <button
                        onClick={() => copyToClipboard(analysisResult.featuresSummary)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด HTML"}</span>
                      </button>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-inner">
                      <div className="bg-slate-900 text-slate-200 p-3 font-mono text-xs overflow-x-auto max-h-[180px]">
                        <code>{analysisResult.featuresSummary}</code>
                      </div>
                      <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          การแสดงผลจริง (Rendered Preview):
                        </span>
                        <div 
                          dangerouslySetInnerHTML={{ __html: analysisResult.featuresSummary }} 
                          className="text-sm leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Card Preview */}
                {activeTab === "preview" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        {contentCategory === "movie" ? "ตัวอย่างกล่องแสดงภาพยนตร์ Cinema Showcase Card HTML:" : "ตัวอย่างการ์ดนำเสนอ HTML Showcase:"}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(analysisResult.htmlCode)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกโค้ด"}</span>
                        </button>
                      </div>
                    </div>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 p-4 shadow-inner">
                      <div 
                        dangerouslySetInnerHTML={{ __html: analysisResult.htmlCode }} 
                      />
                    </div>
                  </div>
                )}

                {/* Tab 4: Image Prompt */}
                {activeTab === "imagePrompt" && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500">
                        {contentCategory === "movie"
                          ? "พรอมต์สร้างโปสเตอร์ภาพยนตร์ 8K (Theatrical Cinema Poster Prompt):"
                          : (contentCategory === "software" 
                            ? "พรอมต์สร้างภาพซอฟต์แวร์ 8K (3D Packaging & Workstation):" 
                            : "พรอมต์สร้างภาพ 8K สำหรับ Gemini Image Generator:"
                          )
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(analysisResult.imagePrompt)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copied ? "คัดลอกแล้ว!" : "คัดลอกพรอมต์"}</span>
                        </button>
                        <button
                          onClick={() => handleCopyAndOpenGemini(analysisResult.imagePrompt)}
                          className="text-xs text-white bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 font-bold flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded-md shadow-xs transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>🚀 คัดลอก & เปิดเว็บ Gemini</span>
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs leading-relaxed border border-slate-800">
                      {analysisResult.imagePrompt}
                    </div>
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-2.5 rounded-lg">
                      <span className="text-xs text-indigo-800">
                        💡 <strong>ขั้นตอนง่ายๆ</strong>: กดปุ่ม <strong>"🚀 คัดลอก & เปิดเว็บ Gemini"</strong> เพื่อเจนภาพ 8K บนเว็บ Gemini แล้วก๊อปรูปกลับมากด <strong>Ctrl+V</strong> ใส่ระบบได้ทันที
                      </span>
                      <button
                        onClick={() => {
                          setCustomImagePrompt(analysisResult.imagePrompt);
                          const workshopEl = document.getElementById("workshop-section");
                          if (workshopEl) workshopEl.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0 ml-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>ไปที่เวิร์กช็อปภาพ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workshop Section */}
          {analysisResult && (
            <div id="workshop-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {contentCategory === "movie"
                        ? "4. เวิร์กช็อปโปสเตอร์ภาพยนตร์ 8K & ลิงก์สตรีมมิ่ง (Movie Poster & Streaming Workshop)"
                        : (contentCategory === "software" 
                          ? "4. เวิร์กช็อปรูปภาพซอฟต์แวร์ 8K & ลิงก์ดาวน์โหลด (Software Content Workshop)"
                          : "4. เวิร์กช็อปเตรียมมีเดีย & ไฟล์ดาวน์โหลด (Content Workshop)"
                        )
                      }
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {contentCategory === "movie"
                        ? "สร้างโปสเตอร์ภาพยนตร์ระดับ 8K ด้วย Gemini หรือเลือกคลังโปสเตอร์ 4K นำมารวมกับลิงก์ OneDrive เพื่อบันทึกเข้าตาราง"
                        : "ส่ง Prompt ไปเจนที่เว็บ Gemini หรือเลือกคลังภาพสำเร็จรูป นำมารวมกับลิงก์ดาวน์โหลด OneDrive และบันทึกเข้าตาราง"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Interactive Tool Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Panel 1: Dedicated Gemini Web Image Hub */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <div className="bg-pink-100 text-pink-600 p-1.5 rounded-lg">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span>
                          {contentCategory === "movie"
                            ? "1. รูปภาพโปสเตอร์ภาพยนตร์ (8K Cinema Poster)"
                            : (contentCategory === "software" ? "1. รูปภาพหน้าปกซอฟต์แวร์ (8K)" : "1. รูปภาพหน้าปก EA (8K)")
                          }
                        </span>
                      </div>
                    </div>

                    {/* Tab Switcher: Gemini Web Bridge vs Instant Gallery */}
                    <div className="flex bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setImageWorkshopTab("gemini-web")}
                        className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          imageWorkshopTab === "gemini-web"
                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>🚀 เจนบน Gemini</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageWorkshopTab("instant")}
                        className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          imageWorkshopTab === "instant"
                            ? "bg-white text-pink-600 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-pink-500" />
                        <span>⚡ คลังภาพสำเร็จรูป</span>
                      </button>
                    </div>

                    {imageWorkshopTab === "instant" ? (
                      /* Instant Gallery (Movie vs Software vs Trading) */
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {contentCategory === "movie"
                            ? "เลือกโปสเตอร์ภาพยนตร์ 4K คมชัดระดับโรงภาพยนตร์ IMAX:"
                            : (contentCategory === "software" 
                              ? "เลือกภาพกราฟิกหน้าจอตัดต่อ สตูดิโอ และซอฟต์แวร์ 8K คมชัดระดับพรีเมียม:" 
                              : "เลือกภาพกราฟิก EA ระดับมืออาชีพ 8K คมชัดระดับสตูดิโอ:"
                            )
                          }
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
                          {(contentCategory === "movie" 
                            ? INSTANT_MOVIE_POSTER_PRESETS 
                            : (contentCategory === "software" ? INSTANT_SOFTWARE_GALLERY : INSTANT_PRO_TRADING_GALLERY)
                          ).map((item) => {
                            const isSelected = generatedImageUrl === item.url;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setGeneratedImageUrl(item.url);
                                  setLocalPreviewUrl(item.url);
                                  setLocalFileBase64(null);
                                  setLeonardoStatus(`เลือกภาพ: ${item.title} สำเร็จ!`);
                                }}
                                className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                                  isSelected 
                                    ? "border-pink-500 ring-2 ring-pink-500/20 shadow-md" 
                                    : "border-slate-200 hover:border-pink-300 hover:shadow-xs"
                                }`}
                              >
                                <div className="h-20 w-full overflow-hidden bg-slate-900">
                                  <img 
                                    src={item.url} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="p-1.5 bg-white flex flex-col gap-0.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-slate-700 truncate">{item.title}</span>
                                  </div>
                                  <span className="text-[8px] font-semibold text-pink-600 bg-pink-50 self-start px-1 rounded">
                                    {item.badge}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-pink-600 text-white rounded-full p-0.5 shadow-sm">
                                    <Check className="w-2.5 h-2.5" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Gemini Web Bridge Workflow */
                      <div className="flex flex-col gap-2.5">
                        
                        {/* Step A: Copy & Open Gemini */}
                        <div className="flex flex-col gap-1.5 bg-indigo-50/70 border border-indigo-200 p-2.5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-600" /> ส่ง Prompt ไป Gemini
                            </span>
                            
                            {/* Boost Prompt Style Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const cur = customImagePrompt || analysisResult?.imagePrompt || "";
                                if (contentCategory === "movie") {
                                  setCustomImagePrompt(`${cur}, high-budget Hollywood blockbuster theatrical movie poster key visual, 3D embossed movie title typography, epic composition, anamorphic lens flare, volumetric smoke and embers, dramatic rim lighting, IMAX 70mm cinematic masterpiece, 8k resolution`);
                                } else if (contentCategory === "software") {
                                  setCustomImagePrompt(`${cur}, commercial software presentation infographic poster, 3D holographic software box packaging mockup, sleek curved multi-monitor video editing command desk, ultra-sharp timeline UI, volumetric studio lighting, 8k octane render`);
                                } else {
                                  setCustomImagePrompt(`${cur}, commercial presentation infographic poster, multi-screen glass workstation, ultra-crisp glowing green and gold EUR/USD candlestick charts, algorithmic trading indicators, bright clean studio backdrop, sharp typography, 8k resolution, photorealistic masterpiece`);
                                }
                              }}
                              className="text-[9px] text-indigo-700 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Wand2 className="w-2.5 h-2.5" /> บูสต์ 8K
                            </button>
                          </div>

                          {/* Movie Style Presets Pills */}
                          {contentCategory === "movie" && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {MOVIE_IMAGE_STYLE_PRESETS.map((style) => (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => {
                                    const baseTitle = analysisResult?.eaName || "Blockbuster Movie";
                                    setCustomImagePrompt(`${style.promptSuffix}. Key art visual for movie title: ${baseTitle}`);
                                  }}
                                  className="text-[9px] bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer truncate max-w-[200px]"
                                  title={style.name}
                                >
                                  {style.name.split(" ")[0]} {style.name.split(" ")[1]}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Software Style Presets Pills */}
                          {contentCategory === "software" && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {SOFTWARE_IMAGE_STYLE_PRESETS.map((style) => (
                                <button
                                  key={style.id}
                                  type="button"
                                  onClick={() => {
                                    const baseTitle = analysisResult?.eaName || "Professional Software";
                                    setCustomImagePrompt(`${style.promptSuffix}. Specifically branded for: ${baseTitle}`);
                                  }}
                                  className="text-[9px] bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer truncate max-w-[200px]"
                                  title={style.name}
                                >
                                  {style.name.split(" ")[0]} {style.name.split(" ")[1]}
                                </button>
                              ))}
                            </div>
                          )}

                          <textarea
                            value={customImagePrompt || analysisResult?.imagePrompt || ""}
                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                            placeholder="ระบุพรอมต์ภาษาอังกฤษเพื่อส่งไปยัง Gemini..."
                            className="w-full text-[11px] bg-white border border-indigo-200 rounded-md p-2 min-h-[55px] focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-slate-400 font-medium"
                          />

                          <button
                            type="button"
                            onClick={() => handleCopyAndOpenGemini(customImagePrompt || analysisResult?.imagePrompt)}
                            className="w-full bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>🚀 1-Click คัดลอก & เปิดเว็บ Gemini.com</span>
                          </button>
                        </div>

                        {/* Step B: Paste or Drop Image Back into App */}
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                            <Upload className="w-3 h-3 text-pink-600" /> นำรูปจาก Gemini กลับมาใส่
                          </span>
                          
                          {/* Dropzone & Paste Box */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingOver(true);
                            }}
                            onDragLeave={() => setIsDraggingOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleLoadImageFile(file);
                            }}
                            className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer relative ${
                              isDraggingOver
                                ? "border-pink-500 bg-pink-50/50 scale-[1.01]"
                                : "border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/20"
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLocalFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              title="คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปภาพมาวาง"
                            />
                            <div className="flex flex-col items-center justify-center gap-1 pointer-events-none">
                              <div className="bg-pink-50 text-pink-600 p-1.5 rounded-full">
                                <Upload className="w-4 h-4" />
                              </div>
                              <p className="text-[11px] font-bold text-slate-800">
                                วางรูปภาพทันที (กด <kbd className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded border border-slate-300 text-[9px]">Ctrl+V</kbd>)
                              </p>
                              <p className="text-[9.5px] text-slate-500 leading-tight">
                                หรือลากไฟล์ภาพมาวาง / คลิกเลือกรูปภาพจากเครื่อง
                              </p>
                            </div>
                          </div>

                          {/* Alternative: Image URL Input */}
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={imageUrlInput}
                              onChange={(e) => setImageUrlInput(e.target.value)}
                              placeholder="หรือวางลิงก์รูปภาพ (Image URL)..."
                              className="flex-1 text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (imageUrlInput.trim()) {
                                  setGeneratedImageUrl(imageUrlInput.trim());
                                  setLocalPreviewUrl(imageUrlInput.trim());
                                  setLocalFileBase64(null);
                                  setLeonardoStatus("✅ นำเข้ารูปภาพจากลิงก์สำเร็จ!");
                                  setImageUrlInput("");
                                }
                              }}
                              className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
                            >
                              ตกลง
                            </button>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Image Preview & Status */}
                  <div className="mt-2 flex flex-col gap-2">
                    {imageWorkshopError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-1.5 text-[11px] text-rose-700 animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-rose-800">เกิดข้อผิดพลาด:</p>
                          <p>{imageWorkshopError}</p>
                        </div>
                      </div>
                    )}

                    {(generatedImageUrl || localPreviewUrl) && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950 flex flex-col items-center p-2.5 gap-2 shadow-inner animate-fade-in">
                        <img 
                          src={generatedImageUrl || localPreviewUrl || ""} 
                          alt="Graphic Preview" 
                          className="w-full h-auto max-h-[140px] object-contain rounded-md shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                          <a 
                            href={generatedImageUrl || localPreviewUrl || ""} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-pink-400 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            เปิดภาพเต็ม <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> พร้อมบันทึก
                          </span>
                        </div>
                      </div>
                    )}

                    {leonardoStatus && (
                      <p className="text-[10px] text-pink-600 font-semibold text-center">{leonardoStatus}</p>
                    )}
                  </div>
                </div>

                {/* Panel 2: OneDrive / Cloud Download link fetcher */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <div className="bg-sky-100 text-sky-600 p-1.5 rounded-lg">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <span>
                        {contentCategory === "movie" 
                          ? "2. ลิงก์ไฟล์ภาพยนตร์ (OneDrive Video / Streaming Link)" 
                          : "2. ลิงก์ดาวน์โหลดโปรแกรม (OneDrive / Cloud)"
                        }
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {contentCategory === "movie"
                        ? "ระบุลิงก์ไฟล์วิดีโอภาพยนตร์บน Microsoft OneDrive (หรือ Bilibili) สำหรับปุ่มรับชมและดาวน์โหลด"
                        : "ระบุลิงก์ดาวน์โหลดตัวติดตั้งโปรแกรมจาก Microsoft OneDrive หรือคลาวด์สตอเรจอื่น เพื่อบันทึกลงตาราง"
                      }
                    </p>

                    {/* OneDrive Direct Download / Sharing URL Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-600">
                        {contentCategory === "movie"
                          ? "ลิงก์ไฟล์วิดีโอภาพยนตร์บน OneDrive (หรือ URL สตรีมมิ่ง)"
                          : "ลิงก์ดาวน์โหลดตัวติดตั้ง OneDrive (Download / Share Link)"
                        }
                      </label>
                      <input
                        type="text"
                        value={oneDriveDownloadLink}
                        onChange={(e) => {
                          setOneDriveDownloadLink(e.target.value);
                          localStorage.setItem("onedrive_download_link", e.target.value);
                        }}
                        placeholder={
                          contentCategory === "movie"
                            ? "https://1drv.ms/v/... หรือ ลิงก์วิดีโอภาพยนตร์ OneDrive..."
                            : "https://1drv.ms/u/... หรือ ลิงก์ดาวน์โหลดตรง..."
                        }
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Alternative Google Drive Link Support */}
                    <div className="border-t border-slate-200 pt-2 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-amber-500" /> หรือเลือกลิงก์จาก Google Drive:
                        </label>
                      </div>

                      {/* Drive search & file explorer */}
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={searchDriveQuery}
                          onChange={(e) => setSearchDriveQuery(e.target.value)}
                          placeholder="ค้นหาไฟล์โปรแกรม .zip/.exe..."
                          className="flex-1 text-[11px] bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleListDriveFiles(searchDriveQuery)}
                          disabled={isListingDriveFiles}
                          className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          {isListingDriveFiles ? (
                            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Search className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {googleDriveFiles.length > 0 && (
                        <div className="flex flex-col gap-1 max-h-[85px] overflow-y-auto border border-slate-200 rounded-lg p-1 bg-white shadow-inner">
                          {googleDriveFiles.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => {
                                setOneDriveDownloadLink(file.webViewLink);
                                setGoogleDriveUrl(file.webViewLink);
                                localStorage.setItem("onedrive_download_link", file.webViewLink);
                              }}
                              className={`text-left text-[9.5px] p-1.5 rounded-md hover:bg-sky-50 cursor-pointer transition-all border ${oneDriveDownloadLink === file.webViewLink ? "bg-sky-50 border-sky-300 font-bold text-sky-900" : "bg-white border-transparent text-slate-700"}`}
                            >
                              📦 {file.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (oneDriveDownloadLink) {
                          setOneDriveStatusMessage(`✅ ตั้งค่าลิงก์ดาวน์โหลด: ${oneDriveDownloadLink}`);
                        }
                      }}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>บันทึกลิงก์ดาวน์โหลดพร้อมส่งลงตาราง</span>
                    </button>
                  </div>
                </div>

                {/* Panel 3: Vercel Blob Image Storage */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span>3. บันทึกรูปภาพถาวร (Vercel Blobs / ตรง)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      อัปโหลดรูปภาพเก็บถาวรลงใน Vercel Blob Storage เพื่อเป็น URL สำหรับส่งออกเข้าตาราง OneDrive หรือกดใช้รูปภาพนี้ตรงๆ ทันที
                    </p>

                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Key className="w-3 h-3 text-slate-400" /> Vercel BLOB_READ_WRITE_TOKEN
                        </label>
                        <span className="text-[9px] text-slate-400">vercel_blob_rw_...</span>
                      </div>
                      <input
                        type="password"
                        value={vercelBlobToken}
                        onChange={(e) => handleSaveVercelBlobToken(e.target.value)}
                        placeholder="วางคีย์ BLOB_READ_WRITE_TOKEN..."
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500">หรือ อัปโหลดรูปภาพอื่นจากคอมพิวเตอร์:</span>
                      <div className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg p-2.5 text-center bg-white hover:bg-indigo-50/20 transition-colors cursor-pointer relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLocalFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] text-slate-600 font-medium truncate max-w-[180px]">
                            {localFileName || "ลากและวาง หรือคลิกเลือกภาพ"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {localPreviewUrl && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white p-1.5 flex flex-col items-center">
                        <img 
                          src={localPreviewUrl} 
                          alt="Local Preview" 
                          className="max-h-[80px] object-contain rounded-md"
                        />
                        <span className="text-[8px] text-slate-400 mt-1 truncate max-w-full">{localFileName}</span>
                      </div>
                    )}

                    {vercelBlobStatus && (
                      <div className={`p-2 rounded-lg text-[10px] font-medium ${
                        vercelBlobStatus.startsWith("❌") || vercelBlobStatus.startsWith("⚠️") 
                          ? "bg-rose-50 border border-rose-200 text-rose-700" 
                          : vercelBlobStatus.includes("สำเร็จ") 
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                            : "bg-indigo-50 border border-indigo-200 text-indigo-700"
                      }`}>
                        {vercelBlobStatus}
                      </div>
                    )}

                    {vercelBlobUrl && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-left flex flex-col gap-1 text-[10px]">
                        <p className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> ลิงก์รูปภาพพร้อมส่งเข้าตารางแล้ว!
                        </p>
                        <a 
                          href={vercelBlobUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-700 hover:underline font-semibold break-all text-[9px]"
                        >
                          {vercelBlobUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      onClick={handleUploadToVercelBlob}
                      disabled={isUploadingToVercelBlob || (!generatedImageUrl && !localFileBase64)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:cursor-not-allowed shadow-xs"
                    >
                      {isUploadingToVercelBlob ? (
                        <>
                          <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>กำลังอัปโหลดรูปภาพ...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดเข้า Vercel Blobs ☁️</span>
                        </>
                      )}
                    </button>

                    {(generatedImageUrl || localPreviewUrl) && (
                      <button
                        onClick={() => {
                          const targetUrl = localPreviewUrl || generatedImageUrl || "";
                          setVercelBlobUrl(targetUrl);
                          setVercelBlobStatus("✅ เลือกใช้ภาพนี้โดยตรง พร้อมส่งลงตาราง OneDrive แล้ว (ไม่ต้องผ่าน Vercel Blob)");
                        }}
                        className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-[11px] py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>⚡ ใช้รูปนี้ตรงๆ ทันที (ไม่ต้องใช้ Vercel Token)</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </section>
        )}

        {/* Bottom Section: Microsoft OneDrive / Excel Real-Time Sync Table */}
        {(sheetRows.length > 0 || connectedOneDrive || connectedSheet || appActiveMode === "sheets") && (
          <section className="col-span-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-sky-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {contentCategory === "movie"
                      ? "ฐานข้อมูลภาพยนตร์ & สตรีมมิ่ง Microsoft OneDrive (Excel Database)"
                      : (contentCategory === "software" 
                        ? "ฐานข้อมูลซอฟต์แวร์ Microsoft OneDrive (Excel Database)"
                        : "ฐานข้อมูลตาราง Microsoft OneDrive / Excel Database"
                      )
                    }
                  </h3>
                  <p className="text-xs text-slate-500">
                    {connectedOneDrive 
                      ? `เชื่อมต่อกับ "${connectedOneDrive.name}" (ทั้งหมด ${sheetRows.length > 0 ? sheetRows.length - 1 : 0} รายการ)` 
                      : (contentCategory === "movie"
                        ? "ตารางรวบรวมชื่อภาพยนตร์ คำโปรย เรื่องย่อ ลิงก์สตรีมมิ่ง OneDrive และโปสเตอร์"
                        : "ตารางรวบรวมข้อมูลซอฟต์แวร์ คำโปรย สเปกระบบ ลิงก์ดาวน์โหลด และรูปภาพสำหรับ OneDrive"
                      )
                    }
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportOneDriveExcel}
                  disabled={sheetRows.length === 0}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>ส่งออก Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleCopyTableForOneDrive}
                  disabled={sheetRows.length === 0}
                  className="bg-sky-50 hover:bg-sky-100 disabled:opacity-50 text-sky-800 border border-sky-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-600" />
                  <span>คัดลอกตาราง (วางใน OneDrive)</span>
                </button>

                {connectedOneDrive?.url && (
                  <button
                    onClick={() => handleFetchOneDrive()}
                    disabled={isLoadingOneDrive}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingOneDrive ? "animate-spin" : ""}`} />
                    <span>รีเฟรชตาราง</span>
                  </button>
                )}
              </div>
            </div>

            {isLoadingOneDrive && sheetRows.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-sky-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">กำลังเชื่อมต่อฐานข้อมูล Microsoft OneDrive...</p>
              </div>
            ) : sheetRows.length <= 1 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <Cloud className="w-10 h-10 text-sky-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">ยังไม่มีข้อมูลในตาราง</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
                  วางลิงก์แชร์ OneDrive ด้านซ้าย หรืออัปโหลดไฟล์ Excel / เมื่อเจนข้อมูลคำโปรยและสเปกซอฟต์แวร์แล้ว ให้กดปุ่ม <strong>"บันทึกลงตาราง OneDrive ☁️"</strong> เพื่อเพิ่มข้อมูลแถวแรกของคุณ
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      {sheetRows[0]?.map((header, index) => (
                        <th key={index} className="p-3 font-semibold text-slate-700 whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                      <th className="p-3 font-semibold text-slate-700 whitespace-nowrap text-center">
                        การจัดการ (Actions)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheetRows.slice(1).map((row, rowIndex) => (
                      <tr 
                        key={rowIndex} 
                        className="border-b border-slate-200 bg-white hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="p-3 text-slate-500 whitespace-nowrap font-medium">{row[0]}</td>
                        <td className="p-3 text-slate-900 font-bold">{row[1]}</td>
                        <td className="p-3 text-slate-700 font-semibold">{row[2]}</td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate" title={row[3]}>{row[3]}</td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate" title={row[4]}>{row[4]}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px] max-w-[150px] truncate" title={row[5]}>
                          {row[5]}
                        </td>
                        <td className="p-3 text-slate-600">
                          {row[6] && row[6].startsWith("http") ? (
                            <a 
                              href={row[6]} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-pink-600 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>ดูรูปภาพ 🎨</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {row[7] && row[7].startsWith("http") ? (
                            <a 
                              href={row[7]} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-sky-600 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>ดาวน์โหลด 💾</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleLoadRowToWorkshop(row)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="ดึงข้อมูลจากแถวนี้เข้าเวิร์กชอป"
                          >
                            <CloudLightning className="w-3 h-3 text-indigo-600" />
                            <span>ดึงเข้าเวิร์กชอป ⚡</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
