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
  Layers
} from "lucide-react";
import { initAuth, googleSignIn, logout, getAccessToken } from "./firebase";
import { User as FirebaseUser } from "firebase/auth";
import { EAContent, GoogleSheetInfo } from "./types";

const IMAGE_STYLE_PRESETS = [
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
    id: "mt5-dashboard",
    name: "📈 กราฟแท่งเทียน MT5 & มัลติสกรีนเรดาร์ (มีชื่อ EA ด้านบน)",
    promptSuffix: "hyper-realistic MetaTrader 5 multi-screen trading command desk. At the very top, bold glowing futuristic neon title text displaying the exact EA name. Center shows vibrant green ascending candlestick charts, technical analysis indicators EMA MACD RSI, currency pair matrix EURUSD GBPUSD USDJPY, glowing financial telemetry dashboard, bright clean fintech lighting, ultra-sharp focus, 8k"
  },
  {
    id: "golden-bull",
    name: "🐂 กระทิงทองคำ & สถิติกำไรพุ่งทะยาน (มีชื่อ EA ด้านบน)",
    promptSuffix: "majestic glowing golden cybernetic bull statue before ascending green candlestick charts. At the very top, large glowing gold 3D neon title displaying the exact EA name with luxury fintech laurels. Surrounding are dynamic laser candlestick bars, gold coin flow, forex analytics chart, ultra-bright commercial studio lighting, 8k octane render"
  },
  {
    id: "pro-desk",
    name: "💻 สเตชั่นโต๊ะเทรดมัลติมอนิเตอร์ระดับโปร",
    promptSuffix: "high-end luxury multi-monitor trading desk setup with 6 curved 4K OLED screens. At the very top, illuminated neon header bar displaying the exact EA name. Live candlestick charts, algorithmic trading bot status, clean bright penthouse office backdrop, 8k resolution"
  },
  {
    id: "fintech-matrix",
    name: "🌐 เครือข่ายควอนตัม & ดาต้าฟินเทค 3D",
    promptSuffix: "high-tech glowing financial technology matrix. At the very top, bold glowing 3D holographic title displaying the exact EA name. Floating 3D currency symbols, dynamic green candlestick bars, bright illuminated holographic UI, 3D render, 8k"
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

  // App functional states
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EAContent | null>(null);
  const [activeTab, setActiveTab] = useState<"tagline" | "features" | "imagePrompt" | "leonardo" | "drive" | "vercel">("tagline");

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

  const [leonardoModel, setLeonardoModel] = useState("dall-e-3"); // Default to OpenAI DALL-E 3
  const [customModelId, setCustomModelId] = useState("");
  const [leonardoDimension, setLeonardoDimension] = useState("1024x1024"); // Default to 1024x1024

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [leonardoStatus, setLeonardoStatus] = useState("");
  const [imageWorkshopError, setImageWorkshopError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [imageWorkshopTab, setImageWorkshopTab] = useState<"instant" | "ai">("instant");

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

    // Load API credentials
    const savedLeoUser = localStorage.getItem("leonardo_username");
    if (savedLeoUser) setLeonardoUsername(savedLeoUser);

    const savedLeoPass = localStorage.getItem("leonardo_password");
    if (savedLeoPass) setLeonardoPassword(savedLeoPass);

    const savedLeoModel = localStorage.getItem("leonardo_model");
    if (savedLeoModel) setLeonardoModel(savedLeoModel);

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
      setErrorMessage("กรุณากรอกรายละเอียดหรือเลือกกลยุทธ์ EA เพื่อทำการวิเคราะห์");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisResult(null);

    let parsedData: EAContent | null = null;
    const keyToUse = geminiApiKey.trim();

    // 1. Try server-side API
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input: inputText,
          geminiApiKey: keyToUse || undefined
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
          const prompt = `You are an expert copywriter, software engineer, and marketing designer for MetaTrader Expert Advisors (EA). 
Given the following raw text, EA trading strategy description, MQL code, or feature request:
1. eaName: short unique name (max 4-5 words)
2. tagline: catchy marketing tagline in Thai (คำโปรย) styled as clean HTML (e.g. '<p class="text-indigo-600 font-bold">...</p>')
3. featuresSummary: structured trading features in Thai (สรุปฟีเจอร์) as clean semantic HTML ('<ul>', '<li>', '<strong>', '<span>')
4. htmlCode: stunning visual showcase presentation card in HTML with Tailwind CSS
5. imagePrompt: rich, vivid English prompt for financial/forex EA marketing visual (e.g. 3D holographic forex charts, golden Wall Street bull, cybernetic trading bot, multi-currency matrix, dark titanium workstation, 8k octane render, cinematic lighting, photorealistic). Strictly avoid blurry pedestals or empty plates.

Input:
${inputText}

Return ONLY valid JSON matching this schema:
{"eaName": "...", "tagline": "...", "featuresSummary": "...", "htmlCode": "...", "imagePrompt": "..."}`;

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
      setAnalysisResult(parsedData);
      setCustomImagePrompt(parsedData.imagePrompt || "");
      setVercelProjectName(parsedData.eaName ? parsedData.eaName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") : "ea-landing-page");
      setGeneratedImageUrl(INSTANT_PRO_TRADING_GALLERY[0].url);
      setLeonardoStatus("โหลดภาพกราฟแท่งเทียน MT5 คมชัด 8K พร้อมใช้งาน");
      setVercelUrl("");
      setGoogleDriveUrl("");
      setActiveTab("tagline");
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

  // 1. Generate Image on OpenAI DALL-E 3, Leonardo.ai, Gemini Imagen, or Free Generator
  const handleGenerateLeonardoImage = async () => {
    if (!analysisResult) return;
    setIsGeneratingImage(true);
    setLeonardoStatus(
      leonardoModel === "dall-e-3"
        ? "กำลังสร้างภาพโฆษณาระดับพรีเมียมด้วย OpenAI DALL-E 3 (HD)..."
        : leonardoModel === "gemini-imagen" 
          ? "กำลังสั่งสร้างรูปภาพด้วย Gemini Image Model..." 
          : leonardoModel === "free-pollinations" 
            ? "กำลังสั่งสร้างรูปภาพด้วย Free AI Generator..." 
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
        p = `Ultra-clean commercial presentation infographic poster for '${title}', bright multi-screen glass trading workstation displaying crisp glowing green and gold EUR/USD candlestick charts, algorithmic trading telemetry, profit curve, modern fintech badges, bright studio backdrop, sharp typography, 8k resolution, photorealistic masterpiece`;
      }
      return p;
    };

    const finalSafePrompt = buildEnrichedPrompt(customImagePrompt || analysisResult.imagePrompt || "");

    try {
      const sanitizedKey = (leonardoPassword || "").trim();
      if (leonardoModel !== "free-pollinations" && leonardoModel !== "gemini-imagen" && leonardoModel !== "dall-e-3" && sanitizedKey.includes("@")) {
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
            clientApiKey: (leonardoModel === "free-pollinations" || leonardoModel === "gemini-imagen" || leonardoModel === "dall-e-3") ? "free" : leonardoPassword,
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
          setLeonardoStatus("✨ สร้างภาพและเปลี่ยนภาพใหม่เรียบร้อยแล้ว!");
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

        {/* Left Column: Inputs and Preset Selectors (span 5) */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          {/* Card: Paste strategy/code */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span>1. ใส่ข้อมูลกลยุทธ์ หรือไฟล์ EA</span>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              คุณสามารถระบุคำอธิบายระบบเทรด, ข้อมูลตัวชี้วัด (Indicators), หรือวางโค้ด MQL ของ EA ที่คุณใช้ เพื่อให้ Gemini ช่วยคัดสรรคำโปรยการตลาดที่โดนใจ และเขียนโค้ด HTML เพื่อโชว์เคสฟีเจอร์ให้ทันที
            </p>

            <textarea
              className="w-full min-h-[140px] bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all placeholder-slate-400"
              placeholder="วางข้อมูลสเปคอธิบาย EA, โค้ดโปรแกรมเมอร์ หรือไอเดียจุดเข้าซื้อขายได้ที่นี่..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            {/* Gemini API Key Configuration Box (Always Prominently Visible) */}
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
                      <span className="line-clamp-2">{geminiKeyTestStatus.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Presets Grid */}
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">💡 ตัวอย่างกลยุทธ์สเปค EA ยอดนิยม:</p>
              <div className="flex flex-col gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputText(preset.description)}
                    className="text-left text-xs bg-slate-50 hover:bg-indigo-50/60 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 p-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    <p className="font-semibold text-slate-700 flex items-center gap-1">
                      <span className="bg-slate-200 text-slate-600 rounded-md w-4 h-4 inline-flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      {preset.name}
                    </p>
                    <p className="text-slate-500 line-clamp-1 mt-0.5">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>กำลังประมวลผลด้วย Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 fill-white" />
                  <span>วิเคราะห์และแยกข้อมูลด่วน ✦</span>
                </>
              )}
            </button>
          </div>

          {/* Card: Connect to Sheet (Active only when logged in) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Database className="w-5 h-5 text-emerald-500" />
              <span>2. ตั้งค่าการเชื่อมต่อ Google Sheets</span>
            </div>

            {needsAuth ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center flex flex-col gap-3 items-center">
                <FileSpreadsheet className="w-8 h-8 text-slate-400" />
                <div className="text-xs">
                  <p className="font-bold text-slate-700">เข้าสู่ระบบ Google เพื่อเชื่อมต่อชีตของคุณ</p>
                  <p className="text-slate-500 mt-1">ระบบจะส่งข้อมูลบันทึกแยกคำโปรย สรุปและโค้ดลงตารางทันทีอย่างรวดเร็ว</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full mt-1">
                  <button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    {isLoggingIn ? (
                      <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>เชื่อมต่อบัญชี Google</span>
                  </button>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-medium text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>เปิดในแท็บใหม่</span>
                  </a>
                </div>
                <div className="mt-1 pt-2 border-t border-slate-200 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const input = prompt("กรอก Google OAuth Access Token (ya29...):");
                      if (input && input.trim()) {
                        setToken(input.trim());
                        setNeedsAuth(false);
                      }
                    }}
                    className="text-[11px] text-slate-500 hover:text-emerald-600 underline font-medium cursor-pointer"
                  >
                    หรือป้อน OAuth Access Token โดยตรง
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {connectedSheet ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-600">เชื่อมต่อตารางแล้ว ✓</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5 line-clamp-1">{connectedSheet.title}</p>
                      </div>
                      <button
                        onClick={() => saveSheetState(null)}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold"
                      >
                        ยกเลิกเชื่อมต่อ
                      </button>
                    </div>
                    <div className="text-xs flex flex-col gap-1 text-slate-500">
                      <p className="font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-md truncate max-w-full">
                        ID: {connectedSheet.spreadsheetId}
                      </p>
                      <a 
                        href={connectedSheet.spreadsheetUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-semibold mt-1"
                      >
                        เปิดไฟล์ Google Sheet ในแท็บใหม่
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {/* Method A: Create New Spreadsheet */}
                    <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2.5">
                      <p className="text-xs font-bold text-slate-700">แนวทางที่ 1: สร้าง Google Sheet ขึ้นมาใหม่</p>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        value={spreadsheetTitle}
                        onChange={(e) => setSpreadsheetTitle(e.target.value)}
                        placeholder="ชื่อชีตใหม่ เช่น EA Database"
                      />
                      <button
                        onClick={handleCreateSheet}
                        disabled={isCreatingSheet}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-semibold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {isCreatingSheet ? (
                          <>
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>กำลังสร้างตารางชีต...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>สร้าง Google Sheet ใหม่ 📁</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Method B: Connect Existing */}
                    <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50 flex flex-col gap-2.5">
                      <p className="text-xs font-bold text-slate-700">แนวทางที่ 2: เชื่อมต่อโดยใช้ Spreadsheet ID</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          value={manualSheetId}
                          onChange={(e) => setManualSheetId(e.target.value)}
                          placeholder="วาง ID ของชีตที่นี่..."
                        />
                        <button
                          onClick={handleConnectManualSheet}
                          disabled={isLoadingSheet || !manualSheetId.trim()}
                          className="bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-200 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                        >
                          {isLoadingSheet ? (
                            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span>เชื่อมต่อ</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Output Showcase & Sheets Sync Progress (span 7) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          
          {/* Gemini Content Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[480px]">
            {/* Header tab switcher */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500 fill-indigo-100" />
                <span className="font-bold text-slate-800 text-sm">3. ผลลัพธ์การคัดกรองจาก AI Gemini</span>
              </div>
              
              {analysisResult && (
                <div className="flex flex-wrap bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 gap-0.5">
                  <button
                    onClick={() => setActiveTab("tagline")}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activeTab === "tagline" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    คำโปรยโฆษณา
                  </button>
                  <button
                    onClick={() => setActiveTab("features")}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activeTab === "features" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    สรุปฟีเจอร์ EA
                  </button>
                  <button
                    onClick={() => setActiveTab("imagePrompt")}
                    className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${activeTab === "imagePrompt" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-pink-500 fill-pink-50" />
                    พรอมต์รูปภาพ Leonardo
                  </button>
                </div>
              )}
            </div>

            {/* Tab content space */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              {!analysisResult ? (
                <div className="text-center py-16 px-4 flex flex-col items-center gap-4">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                        <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse absolute" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600 mt-2">กำลังออกแบบสื่อนำเสนอ & คำโปรยใน 3 วินาที...</p>
                      <p className="text-xs text-slate-400">Gemini กำลังร่างคำโฆษณา และประกอบธีมการ์ดโชว์เคสด้วย Tailwind</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full text-slate-400">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <p className="text-sm font-bold text-slate-600">ยังไม่มีข้อมูลที่จะแสดงผล</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        กรุณากรอกไอเดียกลยุทธ์ด้านซ้ายมือแล้วกดปุ่ม "วิเคราะห์และแยกข้อมูลด่วน ✦" เพื่อให้ AI ช่วยจัดการเนื้อหาอย่างเป็นระบบ
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4 animate-fade-in">
                  
                  {/* Top Header: EA Name Extracted */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">ชื่อบอทที่สกัดได้</span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{analysisResult.eaName}</h3>
                    </div>

                    {/* Green Save to Sheet CTA */}
                    {connectedSheet ? (
                      <button
                        onClick={handleSaveToSheet}
                        disabled={isLoadingSheet}
                        className={`font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${exportSuccess ? "bg-emerald-500 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:-translate-y-0.5"}`}
                      >
                        {isLoadingSheet ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : exportSuccess ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>บันทึกตารางสำเร็จ!</span>
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="w-4 h-4" />
                            <span>ส่งข้อมูลเข้า Google Sheet 🟢</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic">💡 เชื่อมต่อ Google Sheet เพื่อบันทึก</span>
                    )}
                  </div>

                  {/* TAB 2: Marketing Tagline (HTML Code & Render) */}
                  {activeTab === "tagline" && (
                    <div className="flex-1 flex flex-col gap-3 py-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-600">🎯 โค้ด HTML คำโปรยการตลาด (Tagline HTML Code):</p>
                        <button
                          onClick={() => copyToClipboard(analysisResult.tagline)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors font-semibold"
                        >
                          {copied ? "คัดลอกโค้ดแล้ว" : "คัดลอกโค้ด HTML"}
                        </button>
                      </div>
                      
                      {/* Raw HTML display */}
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-indigo-300 overflow-y-auto max-h-[80px]">
                        <pre className="whitespace-pre-wrap">{analysisResult.tagline}</pre>
                      </div>

                      {/* Live preview render */}
                      <p className="text-xs font-semibold text-slate-500 mt-1">👀 ตัวอย่างการแสดงผล (Preview):</p>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <div dangerouslySetInnerHTML={{ __html: analysisResult.tagline }} />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Trading Features Summary (HTML Code & Render) */}
                  {activeTab === "features" && (
                    <div className="flex-1 flex flex-col gap-3 py-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-600">📋 โค้ด HTML สรุปฟีเจอร์การเทรด (Features HTML Code):</p>
                        <button
                          onClick={() => copyToClipboard(analysisResult.featuresSummary)}
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded-md transition-colors font-semibold"
                        >
                          {copied ? "คัดลอกโค้ดแล้ว" : "คัดลอกโค้ด HTML"}
                        </button>
                      </div>

                      {/* Raw HTML display */}
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-[10px] text-emerald-300 overflow-y-auto max-h-[100px]">
                        <pre className="whitespace-pre-wrap">{analysisResult.featuresSummary}</pre>
                      </div>

                      {/* Live preview render */}
                      <p className="text-xs font-semibold text-slate-500 mt-1">👀 ตัวอย่างการแสดงผล (Preview):</p>
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl max-h-[160px] overflow-y-auto">
                        <div dangerouslySetInnerHTML={{ __html: analysisResult.featuresSummary }} />
                      </div>
                    </div>
                  )}

                  {/* TAB 5: Leonardo.ai Image Gen Prompt */}
                  {activeTab === "imagePrompt" && (
                    <div className="flex-1 flex flex-col gap-3 py-2">
                      <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-xl flex items-start gap-3">
                        <div className="bg-pink-100 p-2 rounded-lg text-pink-600 shrink-0">
                          <Sparkles className="w-4 h-4 fill-pink-100" />
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-pink-800">พรอมต์สำหรับ Leonardo.ai 🎨</p>
                          <p className="text-pink-700/90 mt-0.5">
                            นี่คือพรอมต์ภาษาอังกฤษที่ AI ดีไซน์ขึ้นพิเศษเพื่อสื่อความหมายของ EA นี้ คุณสามารถคัดลอกไปวางใน Leonardo.ai เพื่อสร้างรูปภาพประกอบที่สวยงามได้ทันที และข้อมูลนี้จะถูกส่งไปยังคอลัมน์ที่ 6 ใน Google Sheets ด้วย!
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-600">✨ Leonardo.ai Image Prompt (English):</p>
                        <button
                          onClick={() => copyToClipboard(analysisResult.imagePrompt)}
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">คัดลอกแล้ว</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>คัดลอกพรอมต์</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-[11px] text-pink-300 overflow-y-auto max-h-[180px]">
                        <pre className="whitespace-pre-wrap">{analysisResult.imagePrompt}</pre>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* All-in-One Publishing Workshop */}
          {analysisResult && (
            <div id="workshop-section" className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col p-6 gap-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CloudLightning className="w-5 h-5 text-indigo-600 animate-pulse" />
                  <span>⚡ บอร์ดเวิร์กชอปงานเผยแพร่ EA ครบวงจร (All-in-One Workshop)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  สร้างภาพประกอบด้วย AI, ดึงลิงก์แชร์ดาวน์โหลดตัวโปรแกรมจาก Google Drive และอัปโหลดฝากไฟล์ภาพถาวรลง Vercel Blobs เพื่อบันทึกเข้า Sheets ทันที
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Panel 1: Image Generator & Instant Pro Gallery */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                        <div className="bg-pink-100 text-pink-600 p-1.5 rounded-lg">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        <span>1. รูปภาพหน้าปก EA (8K Visuals)</span>
                      </div>
                    </div>

                    {/* Mode switch tabs */}
                    <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setImageWorkshopTab("instant")}
                        className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          imageWorkshopTab === "instant"
                            ? "bg-white text-pink-600 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 text-pink-500" />
                        <span>⚡ คลังภาพ EA 8K ทันที</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageWorkshopTab("ai")}
                        className={`flex-1 py-1.5 px-2 rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          imageWorkshopTab === "ai"
                            ? "bg-white text-indigo-600 shadow-xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>🎨 สั่งเจนภาพ AI สด</span>
                      </button>
                    </div>

                    {imageWorkshopTab === "instant" ? (
                      /* Instant 8K Trading Gallery */
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          เลือกภาพกราฟิก EA ระดับมืออาชีพ 8K คมชัดระดับสตูดิโอ คลิกเลือกเพื่อนำไปใช้และฝากไฟล์ได้ทันที:
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
                          {INSTANT_PRO_TRADING_GALLERY.map((item) => {
                            const isSelected = generatedImageUrl === item.url;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setGeneratedImageUrl(item.url);
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
                      /* Custom AI Generator */
                      <div className="flex flex-col gap-2">
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          สั่งสร้างภาพเฉพาะตัวด้วย <strong>Google Gemini Imagen 3</strong> หรือ <strong>Free AI Generator (Flux)</strong>:
                        </p>

                        <div className="flex flex-col gap-1 mt-0.5">
                          <label className="text-[10px] font-bold text-slate-500">
                            โมเดล AI ที่ใช้เจนภาพ (AI Model)
                          </label>
                          <select
                            value={leonardoModel}
                            onChange={(e) => {
                              setLeonardoModel(e.target.value);
                              localStorage.setItem("leonardo_model", e.target.value);
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-pink-500 focus:outline-none font-medium"
                          >
                            <option value="dall-e-3">👑 OpenAI DALL-E 3 (สร้างโปสเตอร์ & Infographic แบบภาพ NEXUS - แนะนำสูงสุด)</option>
                            <option value="gemini-imagen">✨ Google Gemini Imagen 3 (ใช้คีย์ Gemini ด้านบน)</option>
                            <option value="free-pollinations">✨ Free AI Generator (ฟรี ไม่ต้องใช้คีย์)</option>
                            <option value="6bef9f1b-71cb-40e7-96a2-21e14026187e">Leonardo Phoenix (ลายเส้นคมชัด สะกดคำแม่น)</option>
                            <option value="5c232a9e-9040-4777-9f40-7e15c54047f0">Leonardo Vision XL (ภาพถ่ายเสมือนจริง 3D / Realistic)</option>
                            <option value="e1a32a61-3813-4907-94d8-7e39f37c4d37">Leonardo Diffusion XL (ภาพวาด งานอาร์ต แฟนตาซี)</option>
                            <option value="a72dfd34-4a4a-4ab7-b8f4-6338fb50cf00">AlbedoBase XL (3D Render, เวกเตอร์, อนิเมะ)</option>
                            <option value="1e60fcdb-a3a6-4bc0-b78d-177303d09a54">Stable Diffusion XL 1.0 (สแตนดาร์ด SDXL)</option>
                            <option value="custom">Custom Model ID (ระบุรหัสด้วยตนเอง)</option>
                          </select>
                        </div>

                        {/* OpenAI DALL-E 3 API Key Card */}
                        {leonardoModel === "dall-e-3" && (
                          <div className="flex flex-col gap-1.5 mt-1 border border-emerald-200 p-2.5 rounded-lg bg-emerald-50/40">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                                <Key className="w-3.5 h-3.5 text-emerald-600" /> คีย์ OpenAI API Key (DALL-E 3)
                              </label>
                              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                HD Quality & Infographic
                              </span>
                            </div>
                            <input
                              type="password"
                              value={openaiApiKey}
                              onChange={(e) => handleSaveOpenAIKey(e.target.value)}
                              placeholder="วาง OpenAI API Key (รูปแบบ sk-proj-... หรือ sk-...)"
                              className="w-full text-xs bg-white border border-emerald-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                            />
                            <div className="flex flex-col gap-0.5 text-[9.5px] text-slate-600">
                              <span>
                                💡 รับหรือสร้าง API Key ได้ที่{" "}
                                <a
                                  href="https://platform.openai.com/api-keys"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline font-semibold text-emerald-700 hover:text-emerald-800"
                                >
                                  platform.openai.com/api-keys
                                </a>
                              </span>
                              <span className="text-emerald-700 font-medium">
                                ✨ DALL-E 3 เป็นโมเดลเดียวที่สามารถสะกดชื่อ EA, แสดงกราฟแท่งเทียน, และทำเลย์เอาต์ Infographic สวยเหมือนภาพตัวอย่าง NEXUS
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Leonardo.ai API Key Card */}
                        {leonardoModel !== "free-pollinations" && leonardoModel !== "gemini-imagen" && leonardoModel !== "dall-e-3" && (
                          <div className="flex flex-col gap-1 mt-1 border border-pink-100 p-2.5 rounded-lg bg-pink-50/30">
                            <label className="text-[10px] font-bold text-pink-700 flex items-center gap-1">
                              <Key className="w-3 h-3 text-pink-500" /> คีย์ API ของ Leonardo.ai
                            </label>
                            <input
                              type="password"
                              value={leonardoPassword}
                              onChange={(e) => {
                                setLeonardoPassword(e.target.value);
                                localStorage.setItem("leonardo_password", e.target.value);
                              }}
                              placeholder="วาง API Key (รูปแบบ UUID เช่น 9f677511-xxxx-...)"
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-pink-500 focus:outline-none font-mono"
                            />
                            {leonardoPassword.trim().includes("@") && (
                              <span className="text-[10px] text-pink-600 font-semibold block mt-1 leading-normal">
                                ⚠️ ตรวจพบอีเมล: การใช้ API จะไม่รองรับ Gmail/รหัสผ่านเข้าสู่ระบบโดยตรง โปรดใช้ Leonardo API Key ในรูปแบบรหัส UUID (36 ตัวอักษร)
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500 mt-1 block">
                              💡 สมัครและรับคีย์ฟรีที่ <a href="https://app.leonardo.ai/" target="_blank" rel="noreferrer" className="underline font-semibold text-pink-600 hover:text-pink-700">app.leonardo.ai</a> เมนู API Access
                            </span>
                          </div>
                        )}

                        {leonardoModel === "custom" && (
                          <div className="flex flex-col gap-1 mt-1">
                            <label className="text-[10px] font-bold text-slate-500">
                              รหัสโมเดลแบบกำหนดเอง (Custom Model ID)
                            </label>
                            <input
                              type="text"
                              value={customModelId}
                              onChange={(e) => {
                                setCustomModelId(e.target.value);
                                localStorage.setItem("leonardo_custom_model_id", e.target.value);
                              }}
                              placeholder="ระบุรหัสโมเดล เช่น b2449217-..."
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-pink-500 focus:outline-none font-mono"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1 mt-1">
                          <label className="text-[10px] font-bold text-slate-500">
                            ขนาดภาพ / สัดส่วน (Dimensions)
                          </label>
                          <select
                            value={leonardoDimension}
                            onChange={(e) => {
                              setLeonardoDimension(e.target.value);
                              localStorage.setItem("leonardo_dimension", e.target.value);
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                          >
                            <option value="1024x1024">1:1 Square (1024x1024) - แนะนำที่สุด</option>
                            <option value="1024x576">16:9 Wide (1024x576) - เหมาะสำหรับแบนเนอร์กว้าง</option>
                            <option value="1024x768">4:3 Standard (1024x768) - มิติคลาสสิก</option>
                            <option value="768x1024">3:4 Portrait (768x1024) - สัดส่วนแนวตั้ง</option>
                            <option value="512x512">1:1 Small (512x512) - เจนเนอเรตเร็ว/ใช้เครดิตน้อย</option>
                          </select>
                        </div>

                        {/* Style presets selector */}
                        <div className="flex flex-col gap-1.5 mt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                              <Wand2 className="w-3 h-3 text-pink-500" /> เลือกสไตล์ภาพกราฟิก EA
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                if (analysisResult?.imagePrompt) {
                                  setCustomImagePrompt(analysisResult.imagePrompt);
                                } else if (analysisResult?.eaName) {
                                  setCustomImagePrompt(`A highly detailed, cinematic commercial presentation poster of a sleek modern AI trading robot and MT5 workstation. At the very top, large glowing vibrant 3D neon header text displaying '${analysisResult.eaName}'. Center shows floating holographic displays with glowing candlestick charts, trend statistics, EURUSD GBPUSD indicators, bright vivid lighting, 8k resolution, masterpiece`);
                                }
                              }}
                              className="text-[9px] text-pink-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5" /> ค่าเริ่มต้น AI
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {IMAGE_STYLE_PRESETS.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  const eaTitle = analysisResult?.eaName || "Forex EA Trading Bot";
                                  setCustomImagePrompt(`A premium commercial presentation poster visual for '${eaTitle}'. ${preset.promptSuffix.replace("the exact EA name", `'${eaTitle}'`)}`);
                                }}
                                className="text-[10px] font-semibold text-slate-700 bg-white hover:bg-pink-50 hover:text-pink-700 hover:border-pink-300 border border-slate-200 rounded-lg p-1.5 text-left transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <span>{preset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-500">Prompt เจนภาพโฆษณา</label>
                            <button
                              type="button"
                              onClick={() => {
                                const cur = customImagePrompt || analysisResult?.imagePrompt || "";
                                if (!cur.includes("candlestick") && !cur.includes("MetaTrader")) {
                                  setCustomImagePrompt(`${cur}, commercial presentation infographic poster, multi-screen glass workstation, ultra-crisp glowing green and gold EUR/USD candlestick charts, algorithmic trading indicators, bright clean studio backdrop, sharp typography, 8k resolution, photorealistic masterpiece`);
                                }
                              }}
                              className="text-[9px] text-indigo-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                            >
                              <Sparkles className="w-2.5 h-2.5" /> บูสต์ความคมชัด 8K
                            </button>
                          </div>
                          <textarea
                            value={customImagePrompt}
                            onChange={(e) => setCustomImagePrompt(e.target.value)}
                            placeholder="ระบุพรอมต์ภาษาอังกฤษเพื่อเจนภาพ..."
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 min-h-[70px] focus:ring-1 focus:ring-pink-500 focus:outline-none placeholder-slate-400 font-medium"
                          />
                        </div>

                        <button
                          onClick={handleGenerateLeonardoImage}
                          disabled={
                            isGeneratingImage ||
                            (leonardoModel === "dall-e-3" ? !openaiApiKey.trim() :
                             leonardoModel === "gemini-imagen" ? !geminiApiKey.trim() :
                             leonardoModel === "free-pollinations" ? false :
                             !leonardoPassword.trim())
                          }
                          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:cursor-not-allowed shadow-sm"
                        >
                          {isGeneratingImage ? (
                            <>
                              <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[10px]">กำลังประมวลผล...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>สร้างภาพ AI ทันที ✨</span>
                            </>
                          )}
                        </button>

                        {leonardoModel === "dall-e-3" && !openaiApiKey.trim() && (
                          <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 p-1.5 rounded text-center">
                            💡 กรุณาวาง <strong>OpenAI API Key</strong> ด้านบน หรือเลือก <strong>Free AI Generator</strong> เพื่อสร้างภาพทันที
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {imageWorkshopError && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-1.5 text-[11px] text-rose-700 animate-fade-in">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-semibold text-rose-800">สร้างภาพไม่สำเร็จ:</p>
                          <p>{imageWorkshopError}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            💡 คำแนะนำ: หาก OpenAI โควตาหมด สามารถเลือกโมเดล <strong>⚡ Free AI Generator</strong> หรือ <strong>✨ Google Gemini</strong> แทนได้ทันที
                          </p>
                        </div>
                      </div>
                    )}

                    {generatedImageUrl && (
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950 flex flex-col items-center p-2.5 gap-2 shadow-inner">
                        <img 
                          src={generatedImageUrl} 
                          alt="AI Generated" 
                          className="w-full h-auto max-h-[140px] object-contain rounded-md shadow-md"
                          referrerPolicy="no-referrer"
                        />
                        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                          <a 
                            href={generatedImageUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-pink-400 hover:underline font-bold inline-flex items-center gap-1"
                          >
                            เปิดภาพเต็ม <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                          {imageWorkshopTab === "ai" && (
                            <button
                              type="button"
                              onClick={handleGenerateLeonardoImage}
                              disabled={isGeneratingImage}
                              className="text-emerald-400 hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Dices className="w-3 h-3" /> สุ่มรูปใหม่ (Reroll)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {leonardoStatus && (
                      <p className="text-[10px] text-pink-600 font-semibold text-center animate-pulse">{leonardoStatus}</p>
                    )}
                  </div>
                </div>

                {/* Panel 2: Google Drive Exporter / Share link fetcher */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <span>2. ลิงก์แชร์ดาวน์โหลด (Google Drive)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      คลิกเลือกไฟล์เพื่อดึงลิงก์ดาวน์โหลด หรือค้นหาจากในบัญชี Google Drive ของคุณโดยตรง
                    </p>

                    {/* Drive search & file explorer */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={searchDriveQuery}
                        onChange={(e) => setSearchDriveQuery(e.target.value)}
                        placeholder="ชื่อไฟล์ EA / .zip..."
                        className="flex-1 text-xs bg-white border border-slate-200 rounded-lg p-1.5 focus:ring-1 focus:ring-amber-500 focus:outline-none"
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

                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-500">เลือกไฟล์จาก Drive ด้านล่าง:</span>
                      {isListingDriveFiles ? (
                        <div className="text-center text-[11px] text-slate-400 py-6 animate-pulse">กำลังดึงรายการไฟล์...</div>
                      ) : googleDriveFiles.length > 0 ? (
                        <div className="flex flex-col gap-1 max-h-[105px] overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-white shadow-inner">
                          {googleDriveFiles.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => {
                                setGoogleDriveUrl(file.webViewLink);
                                localStorage.setItem("google_drive_url", file.webViewLink);
                              }}
                              className={`text-left text-[10px] p-2 rounded-md hover:bg-amber-50 cursor-pointer transition-all border ${googleDriveUrl === file.webViewLink ? "bg-amber-50/70 border-amber-300 font-bold text-amber-900" : "bg-white border-transparent text-slate-700"}`}
                            >
                              📦 {file.name}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-[10px] text-slate-400 py-6 border border-dashed border-slate-200 rounded-lg bg-white">
                          <p>ไม่พบไฟล์บอท (.ex4, .ex5, .zip)</p>
                          <button
                            onClick={() => handleListDriveFiles("")}
                            className="text-[9px] text-amber-600 hover:underline font-bold mt-1 block w-full"
                          >
                            🔄 โหลดไฟล์ทั้งหมดอีกครั้ง
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Manual override input */}
                    <div className="flex flex-col gap-1 mt-1">
                      <label className="text-[10px] font-bold text-slate-500">ลิงก์ Google Drive ดาวน์โหลดโปรแกรม</label>
                      <input
                        type="text"
                        value={googleDriveUrl}
                        onChange={(e) => {
                          setGoogleDriveUrl(e.target.value);
                          localStorage.setItem("google_drive_url", e.target.value);
                        }}
                        placeholder="ลิงก์ดาวน์โหลดที่เลือก..."
                        className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    {needsAuth ? (
                      <p className="text-[10px] text-rose-500 font-semibold text-center mt-1">กรุณาลงชื่อเข้าใช้ Google ด้านซ้ายก่อน</p>
                    ) : (
                      <button
                        onClick={() => handleListDriveFiles("")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>ดึงรายการไฟล์จาก Google Drive 📁</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel 3: Vercel Blob Image Storage */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col gap-3 justify-between">
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <div className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span>3. บันทึกถาวร (Vercel Blobs)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      อัปโหลดเก็บรูปภาพโฆษณาถาวรลงใน Vercel Blob Storage เพื่อนำไปใช้เป็นลิงก์ภาพลงใน Google Sheets หรือกดใช้ลิงก์ภาพโดยตรงได้ทันที
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
                          <Check className="w-3.5 h-3.5" /> ลิงก์รูปภาพพร้อมส่งเข้า Google Sheets แล้ว!
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
                          setVercelBlobStatus("✅ เลือกใช้ภาพนี้โดยตรง พร้อมส่งลง Google Sheets แล้ว (ไม่ต้องผ่าน Vercel Blob)");
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

        {/* Bottom Section: Sheets Content Real-Time Sync Table */}
        {connectedSheet && (
          <section className="col-span-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ข้อมูลล่าสุดในไฟล์ Google Sheets</h3>
                  <p className="text-xs text-slate-400">ดึงสดจากชีต "{connectedSheet.title}" แผ่นงาน "EA Content"</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFetchRows()}
                  disabled={isLoadingSheet}
                  className="bg-slate-50 hover:bg-slate-100 disabled:bg-slate-200 text-slate-700 border border-slate-200 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheet ? "animate-spin" : ""}`} />
                  <span>รีเฟรชตาราง</span>
                </button>
                <a
                  href={connectedSheet.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>เปิด Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {isLoadingSheet && sheetRows.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">กำลังเชื่อมต่อฐานข้อมูล Google Sheets...</p>
              </div>
            ) : sheetRows.length <= 1 ? (
              <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">ยังไม่มีข้อมูลรายการบันทึกในไฟล์นี้</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto mt-1">
                  เมื่อคุณสกัดข้อมูลบอทเทรดด้วย Gemini สำเร็จ ให้กดปุ่ม "ส่งข้อมูลเข้า Google Sheet" เพื่อบันทึกแถวแรกของคุณ
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
                        <td className="p-3 text-slate-600 max-w-[150px] truncate" title={row[2]}>{row[2]}</td>
                        <td className="p-3 text-slate-600 max-w-[150px] truncate" title={row[3]}>{row[3]}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px] max-w-[150px] truncate" title={row[4]}>
                          {row[4]}
                        </td>
                        <td className="p-3 text-slate-600">
                          {row[5] && row[5].startsWith("http") ? (
                            <a 
                              href={row[5]} 
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
                          {row[6] && row[6].startsWith("http") ? (
                            <a 
                              href={row[6]} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-amber-600 hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              <span>ดูไฟล์ 💾</span>
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
                            title="ดึงข้อความพรมต์ภาพจากแถวนี้ไปใช้ในบอร์ดเวิร์กชอปด้านบน"
                          >
                            <CloudLightning className="w-3 h-3 text-indigo-600" />
                            <span>ดึงข้อมูลเข้าเวิร์กชอป ⚡</span>
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
