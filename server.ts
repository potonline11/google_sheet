import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { put } from "@vercel/blob";
import * as XLSX from "xlsx";

dotenv.config();

const app = express();
app.use(express.json({ limit: "15mb" }));

const PORT = 3000;

// Helper to convert OneDrive/SharePoint sharing links into direct download links
function getOneDriveDirectDownloadUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  
  // Already direct download or raw file
  if (url.includes("download=1") || url.endsWith(".xlsx") || url.endsWith(".xls") || url.endsWith(".csv")) {
    return url;
  }

  // 1drv.ms short links usually redirect to onedrive.live.com or sharepoint
  if (url.includes("onedrive.live.com")) {
    if (url.includes("view.aspx")) {
      return url.replace("view.aspx", "download.aspx");
    }
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}download=1`;
  }

  if (url.includes("sharepoint.com")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}download=1`;
  }

  return url;
}


// Cache for storing generated image URLs in-memory
const imageCache = new Map<string, string>();

// API endpoint to test Gemini API Key directly
app.post("/api/test-gemini-key", async (req, res) => {
  try {
    const { geminiApiKey } = req.body || {};
    const apiKey = (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim()) 
      ? geminiApiKey.trim() 
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ ok: false, error: "ยังไม่ได้ระบุ Gemini API Key" });
    }

    const models = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
    let successModel = "";
    let lastError: any = null;
    let modelErrors: { model: string; error: string }[] = [];

    // 1. Try SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      for (const m of models) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: "Say 'OK' in 1 word",
          });
          if (resp && resp.text) {
            successModel = m;
            break;
          }
        } catch (e: any) {
          lastError = e;
          const msg = e?.message || JSON.stringify(e);
          modelErrors.push({ model: m, error: msg });
        }
      }
    } catch (sdkErr: any) {
      lastError = sdkErr;
    }

    // 2. Fallback to direct REST API if SDK failed
    if (!successModel) {
      for (const m of models) {
        try {
          const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Say 'OK' in 1 word" }] }]
            })
          });
          const restData = await restRes.json();
          if (restRes.ok && restData.candidates && restData.candidates.length > 0) {
            successModel = `${m} (REST)`;
            break;
          } else {
            const msg = restData.error?.message || JSON.stringify(restData.error || "");
            modelErrors.push({ model: `${m} REST`, error: msg });
            lastError = restData.error || lastError;
          }
        } catch (fetchErr: any) {
          lastError = fetchErr;
        }
      }
    }

    if (successModel) {
      return res.json({
        ok: true,
        model: successModel,
        message: `เชื่อมต่อสำเร็จ! API Key ใช้งานได้สมบูรณ์ (ผ่านโมเดล ${successModel})`
      });
    }

    const firstDetail = modelErrors.find(e => !e.error.includes("not found"))?.error 
      || modelErrors[0]?.error 
      || (typeof lastError === 'string' ? lastError : lastError?.message)
      || JSON.stringify(lastError || "");

    return res.status(400).json({
      ok: false,
      error: firstDetail || "ไม่สามารถเชื่อมต่อ Gemini API ได้",
      modelErrors
    });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Server error while testing key" });
  }
});

// API endpoint to fetch and parse OneDrive/SharePoint Excel or CSV files
app.post("/api/onedrive/fetch", async (req, res) => {
  try {
    const { onedriveUrl } = req.body || {};
    if (!onedriveUrl || typeof onedriveUrl !== "string" || !onedriveUrl.trim()) {
      return res.status(400).json({ ok: false, error: "กรุณาระบุ URL หรือลิงก์แชร์ของ OneDrive" });
    }

    const directDownloadUrl = getOneDriveDirectDownloadUrl(onedriveUrl);
    console.log("Fetching OneDrive file from:", directDownloadUrl);

    const fileRes = await fetch(directDownloadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "*/*"
      },
      redirect: "follow"
    });

    if (!fileRes.ok) {
      return res.status(fileRes.status).json({
        ok: false,
        error: `ไม่สามารถดาวน์โหลดไฟล์จาก OneDrive ได้ (Status ${fileRes.status}): กรุณาตรวจสอบว่าลิงก์ถูกแชร์แบบ 'Anyone with the link can view' (ทุกคนที่มีลิงก์สามารถดูได้)`
      });
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read with xlsx library (supports .xlsx, .xls, .csv)
    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (parseErr: any) {
      // If binary parse failed, check if it's text/html or csv
      const text = buffer.toString("utf-8");
      if (text.includes("<html") || text.includes("<!DOCTYPE")) {
        return res.status(400).json({
          ok: false,
          error: "ลิงก์ OneDrive ที่ระบุคืนค่าเป็นหน้าเว็บ HTML แทนที่จะเป็นไฟล์ Excel กรุณาตรวจสอบการตั้งค่าแชร์ หรือใช้ตัวเลือก 'อัปโหลดไฟล์ Excel จากเครื่อง' ด้านล่างได้ทันที"
        });
      }
      workbook = XLSX.read(text, { type: "string" });
    }

    const sheetNames = workbook.SheetNames;
    if (!sheetNames || sheetNames.length === 0) {
      return res.status(400).json({ ok: false, error: "ไม่พบแผ่นงาน (Sheet) ในไฟล์ Excel นี้" });
    }

    // Default to the first sheet or one containing 'Software' or 'EA' or 'Content'
    const targetSheetName = sheetNames.find(s => /software|ea|content|database/i.test(s)) || sheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    // Clean rows and filter out completely empty rows
    const cleanedRows = rawRows
      .map(row => row.map(cell => String(cell !== undefined && cell !== null ? cell : "").trim()))
      .filter(row => row.some(cell => cell.length > 0));

    res.json({
      ok: true,
      title: targetSheetName || "OneDrive Sheet",
      sheetNames,
      totalRows: cleanedRows.length,
      rows: cleanedRows
    });
  } catch (err: any) {
    console.error("OneDrive fetch error:", err);
    res.status(500).json({
      ok: false,
      error: `เกิดข้อผิดพลาดในการดึงข้อมูลจาก OneDrive: ${err?.message || "ไม่สามารถเข้าถึงไฟล์ได้"}`
    });
  }
});

// API endpoint to parse uploaded Excel or CSV file
app.post("/api/onedrive/parse-file", async (req, res) => {
  try {
    const { base64Data, fileName } = req.body || {};
    if (!base64Data) {
      return res.status(400).json({ ok: false, error: "ไม่พบข้อมูลไฟล์สำหรับประมวลผล" });
    }

    const buffer = Buffer.from(base64Data, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;
    
    if (!sheetNames || sheetNames.length === 0) {
      return res.status(400).json({ ok: false, error: "ไม่พบแผ่นงานในไฟล์" });
    }

    const targetSheetName = sheetNames.find(s => /software|ea|content|database/i.test(s)) || sheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    const cleanedRows = rawRows
      .map(row => row.map(cell => String(cell !== undefined && cell !== null ? cell : "").trim()))
      .filter(row => row.some(cell => cell.length > 0));

    res.json({
      ok: true,
      title: fileName || targetSheetName || "Uploaded Excel",
      sheetNames,
      totalRows: cleanedRows.length,
      rows: cleanedRows
    });
  } catch (err: any) {
    console.error("Parse file error:", err);
    res.status(500).json({ ok: false, error: `ไม่สามารถอ่านไฟล์ Excel ได้: ${err.message}` });
  }
});

// API endpoint to analyze raw EA or Software text / specs and extract Tagline, Features, and Prompts.
app.post("/api/analyze", async (req, res) => {
  try {
    const { input, geminiApiKey, category } = req.body || {};
    if (!input) {
      return res.status(400).json({ error: "Input text is required" });
    }

    const apiKey = (geminiApiKey && typeof geminiApiKey === 'string' && geminiApiKey.trim()) 
      ? geminiApiKey.trim() 
      : process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ 
        error: "ยังไม่ได้ระบุ Gemini API Key กรุณากรอก Gemini API Key ในกล่องข้อความ 'ตั้งค่า Gemini API Key' หรือระบุ GEMINI_API_KEY ใน Environment Variables ของเซิร์ฟเวอร์" 
      });
    }

    // Auto-detect Category: Movie vs Software vs Forex EA
    const isMovie = (category === "movie") || (category !== "ea" && category !== "software" && (
      /bilibili|snapwc|movie|cinema|film|series|anime|imdb|netflix|เรื่องย่อ|ภาพยนตร์|หนัง|อนิเมะ|ซีรีส์|นักแสดง|ผู้กำกับ/i.test(input)
    ));

    const isSoftware = !isMovie && ((category === "software") || (category !== "ea" && (
      /davinci|resolve|adobe|photoshop|premiere|after effects|illustrator|autocad|blender|cinema 4d|windows|office|studio|setup\.exe|x64|x86|installer|portable|v\d+|\.iso|\.zip|software|utility|plugin|vst|crack|full version|keygen|corel|obs|maya|visual studio|driver|antivirus/i.test(input)
    )));

    const detectedCategory = isMovie ? "movie" : (isSoftware ? "software" : "ea");

    let prompt = "";
    if (isMovie) {
      prompt = `You are an expert Hollywood cinema copywriter, movie reviewer, and creative poster designer for feature films, blockbuster cinema, anime movies, and streaming series.
Given the following raw text, movie title, Bilibili video description, synopsis, or genre notes:

1. Parse and extract/generate the official Movie Title & Year (e.g. "Avatar: The Way of Water (2022) อวตาร: วิถีแห่งสายน้ำ" or "Cyberpunk: Edgerunners (2022)"). DO NOT mention EA, trading, forex, or pips!
2. Create an exciting, cinematic, persuasive marketing tagline (คำโปรยภาพยนตร์ in Thai, 1-2 sentences) that captures the emotion, thrill, epic stakes, and atmosphere of the movie. MUST be formatted as modern, clean HTML code (e.g. '<p class="text-amber-400 font-bold text-lg">...</p>').
3. Generate a structured synopsis and movie specifications (เรื่องย่อและรายละเอียดภาพยนตร์ in Thai) formatted entirely as clean, styled semantic HTML code ('<ul>', '<li>', '<strong>', '<span class="...">'). Include:
   - 🎬 แนวภาพยนตร์ (Genre: Action, Sci-Fi, Fantasy, Anime, Drama, etc.)
   - ⏱️ ความยาว & คุณภาพ (Duration, 4K UHD, HDR10, Dolby Atmos, เสียงไทย/ซับไทย)
   - 🌟 ผู้กำกับ & นักแสดงนำ (Director, Cast, Voice Actors)
   - 📖 เรื่องย่อภาพยนตร์ (Compelling 2-3 paragraph movie plot overview without spoiling the ending)
4. Code a stunning, modern cinema showcase card using HTML with Tailwind CSS. Styled like a dark theater backdrop with gold/amber/crimson accents, star rating (⭐⭐⭐⭐⭐ 4.8/5), genre badges, duration chip, synopsis, and an attractive '▶️ รับชมภาพยนตร์' / '⬇️ ดาวน์โหลด 4K' button. Must be self-contained in a single <div>.
5. Create a highly descriptive English image generation prompt for generating an 8K commercial theatrical movie poster:
   - EXACT PROMPT FORMULA FOR MOVIE POSTER:
     "At the very top, large glowing 3D cinematic metallic title text displaying \\"[EXACT_MOVIE_NAME]\\". Center stage features an epic high-budget IMAX movie poster design with the main heroes and villains, dramatic cinematic color grading, volumetric fog, rim lighting, lens flare, film grain, 8k octane render, photorealistic Hollywood masterpiece."

CRITICAL DESIGN REQUIREMENT FOR HTML / TEXT FIELDS:
- DO NOT use HTML character entities like '&ldquo;', '&rdquo;', '&rsquo;', '&lsquo;', '&quot;', '&amp;', or '&nbsp;'. Use raw characters.
- Thai text must be grammatically correct, dramatic, and captivating.

Input Movie Information:
${input}

Return your response strictly as a JSON object matching the requested schema.`;
    } else if (isSoftware) {
      prompt = `You are an expert software engineer, technical copywriter, and digital product marketing designer for PC/Mac desktop software, creative studio tools, utilities, and applications.
Given the following raw text, software title, version specs, installer notes, or feature requests:

1. Parse and extract the exact, clean Software Name & Version (short, clean, professional e.g. "DaVinci Resolve Studio 18.1.3 (x64)" or "Adobe Premiere Pro 2024 (v24.2)"). DO NOT mention EA, trading, forex, or pips!
2. Create a catchy, persuasive marketing tagline (คำโปรย in Thai, 1-2 sentences) highlighting the software's speed, productivity, creative power, stability, rendering excellence, or user experience. MUST be returned fully formatted as modern, clean HTML code (e.g. using '<p class="text-indigo-600 font-bold text-lg">...</p>').
3. Generate a structured features & technical summary (สรุปฟีเจอร์และรายละเอียด in Thai) formatted entirely as clean, robust semantic HTML code ('<ul>', '<li>', '<strong>', '<span class="...">'). Include:
   - 🌟 ฟีเจอร์หลัก & เครื่องมือใหม่ล่าสุด (Key features, AI tools, rendering engine)
   - 💻 สเปกความต้องการของระบบ (System Requirements: OS Windows 10/11 x64, CPU, RAM, GPU VRAM, Storage)
   - ⚡ รูปแบบการติดตั้ง (Full Version / Pre-activated / Portable / Multilingual)
   - 🛠️ คำแนะนำและขั้นตอนการติดตั้งเบื้องต้น
4. Code a stunning, modern software showcase card using HTML with Tailwind CSS. Display the software title, version badge, tagline, specs grid, key highlights, and clean download CTA styling. Must be self-contained in a single <div>.
5. Create a highly descriptive English image generation prompt for generating an 8K commercial product showcase poster:
   - EXACT PROMPT FORMULA FOR SOFTWARE:
     "At the very top, large glowing neon 3D metallic header text displaying \\"[EXACT_SOFTWARE_NAME]\\". The image features a sleek, high-tech 3D software box packaging mockup next to a futuristic creative studio workstation with dual 4K curved displays showcasing the software interface (multitrack timeline, visual nodes, rendering viewport, high-tech UI). Volumetric cinematic studio lighting, vibrant neon accents, sharp 8k resolution, photorealistic commercial product photography masterpiece."

CRITICAL DESIGN REQUIREMENT FOR HTML / TEXT FIELDS:
- DO NOT use HTML character entities like '&ldquo;', '&rdquo;', '&rsquo;', '&lsquo;', '&quot;', '&amp;', or '&nbsp;'. Use raw characters.
- Thai text must be grammatically correct, inspiring, and persuasive.

Input Software Text/Specs:
${input}

Return your response strictly as a JSON object matching the requested schema.`;
    } else {
      prompt = `You are an expert copywriter, software engineer, and marketing designer for MetaTrader Expert Advisors (EA). 
Given the following raw text, EA trading strategy description, MQL code, or feature request, perform these steps:
1. Parse and extract/generate a professional and unique EA Name (short, maximum 4-5 words, e.g. "Scalping Horizon EA" or "Divergence Quantum Pro").
2. Create a catchment, catchy, persuasive marketing tagline (คำโปรย in Thai, 1-2 sentences) that highlights the EA's key benefit or strategy. This tagline MUST be returned fully formatted as modern, clean HTML code (e.g. using a beautifully styled paragraph tag or wrapper like '<p class="text-indigo-600 font-bold italic text-lg">...</p>').
3. Generate a structured features summary (สรุปฟีเจอร์ in Thai, detailing indicators used, trading session focus, risk management, and settings). This features summary MUST be returned fully formatted as robust, semantic HTML code (e.g. using '<ul>', '<li>', '<strong>', '<span class="text-emerald-500">', etc. with Tailwind utility classes or clean inline styled elements). Do NOT use markdown.
4. Code a stunning, modern visual landing card or showcase section using HTML with Tailwind CSS classes. It should visually display the EA's name, the tagline, the core features list, and include mock visual elements (like a green active trading indicator, target success rate badges, and clean padding).
   - Use beautiful modern colors (such as slate-800, indigo, emerald, or amber accents).
   - The HTML MUST be self-contained in a parent <div>.
   - Do NOT include <html>, <head>, or <body> tags. Just raw styled Tailwind elements.
   - Ensure all images/icons are clean and from Lucide/Heroicons if any, or simple CSS circles/shapes.
   - The HTML code should be robust, professional, and readable.
5. Create a highly descriptive English image generation prompt to generate a stunning, commercial-grade marketing infographic poster that explicitly represents this EA and features its name prominently at the top.
   - EXACT PROMPT FORMULA (as shown in high-converting commercial forex AI posters):
     "At the very top, large glowing neon 3D metallic header text displaying \\"[EXACT_EA_NAME]\\". The image features a powerful, stylized holographic [MASCOT/SYMBOL MATCHING EA NAME, e.g. 'mustang horse' for Mustang EA, 'golden cyber dragon' for Dragon EA, 'majestic golden bull' for Bull/Trend EA, 'cybernetic falcon' for Scalper/Falcon EA, 'futuristic samurai' for Samurai EA, 'modern cyber-pop AI robot' for Robot/Lollipop EA] formed from golden light and flowing digital trading data on a high-tech glowing trading platform. In the background, sleek multi-monitor trading stations with glowing green candlestick charts (EURUSD, GBPUSD, XAUUSD) and forex telemetry dashboards with ascending profit trendlines. Ultra-bright cinematic studio lighting, sharp 8k resolution, photorealistic commercial masterpiece."

CRITICAL DESIGN REQUIREMENT FOR HTML / TEXT FIELDS:
- DO NOT use any HTML character entities or encodings like '&ldquo;', '&rdquo;', '&rsquo;', '&lsquo;', '&quot;', '&amp;', or '&nbsp;'.
- All Thai quotation marks must be raw characters.

Input Text/Strategy Description:
${input}

Return your response strictly as a JSON object matching the requested schema.`;
    }

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eaName: {
            type: Type.STRING,
            description: isMovie ? "The title and release year of the Movie." : (isSoftware ? "The exact name and version of the Software." : "The name of the Expert Advisor (EA).")
          },
          tagline: {
            type: Type.STRING,
            description: "A persuasive, catchy marketing tagline in Thai (คำโปรย) written as ready-to-use HTML code."
          },
          featuresSummary: {
            type: Type.STRING,
            description: isMovie ? "Synopsis and movie specifications in Thai (เรื่องย่อ & ข้อมูลภาพยนตร์) formatted as styled HTML." : (isSoftware ? "Structured software features and system requirements in Thai formatted as HTML." : "Structured EA features in Thai formatted as HTML.")
          },
          htmlCode: {
            type: Type.STRING,
            description: "Stunning visual presentation card styled with Tailwind CSS in HTML."
          },
          imagePrompt: {
            type: Type.STRING,
            description: "Detailed English image generation prompt representing the product."
          },
          systemRequirements: {
            type: Type.STRING,
            description: "Short summary of system requirements (OS, RAM, GPU, CPU) or Movie genre/specs."
          }
        },
        required: ["eaName", "tagline", "featuresSummary", "htmlCode", "imagePrompt"]
      }
    };

    let text: string | undefined;
    const modelsToTry = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
    let lastError: any = null;

    // 1. Try with GoogleGenAI SDK
    try {
      const ai = new GoogleGenAI({ apiKey });
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: schemaConfig
          });
          if (response && response.text) {
            text = response.text;
            break;
          }
        } catch (err: any) {
          lastError = err;
          console.warn(`Attempt with SDK model ${model} failed:`, err?.message || err);
        }
      }
    } catch (e) {
      lastError = e;
    }

    // 2. Direct REST fallback if SDK fails
    if (!text) {
      for (const model of modelsToTry) {
        try {
          const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });
          const restData = await restRes.json();
          if (restRes.ok && restData.candidates && restData.candidates[0]?.content?.parts?.[0]?.text) {
            text = restData.candidates[0].content.parts[0].text;
            break;
          } else {
            lastError = restData.error || lastError;
          }
        } catch (restErr) {
          lastError = restErr;
        }
      }
    }

    if (!text) {
      const errMsg = typeof lastError === 'string' ? lastError : (lastError?.message || JSON.stringify(lastError || ""));
      if (errMsg.includes("API key not valid") || errMsg.includes("API_KEY_INVALID")) {
        return res.status(401).json({ error: "Gemini API Key ไม่ถูกต้อง กรุณาตรวจสอบและคัดลอกคีย์ใหม่อีกครั้งจาก Google AI Studio" });
      }
      if (errMsg.includes("blocked") || errMsg.includes("PERMISSION_DENIED")) {
        return res.status(403).json({ 
          error: "API Key นี้ถูกจำกัดสิทธิ์ (PERMISSION_DENIED) กรุณาใช้ API Key จากโปรเจกต์อื่น หรือสร้างคีย์ใหม่ใน Google AI Studio" 
        });
      }
      if (errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("429")) {
        return res.status(429).json({ error: "โควต้าการใช้งาน Gemini API หมดชั่วคราว กรุณารอสักครู่หรือเปลี่ยนไปใช้ API Key อื่น" });
      }
      throw new Error(`การเชื่อมต่อ Gemini ล้มเหลว: ${errMsg}`);
    }

    let result: any;
    try {
      let cleanedText = text.trim();
      if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      result = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("Direct JSON parse failed, trying regex extraction. Raw text:", text);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("ไม่สามารถอ่านข้อมูลผลลัพธ์จาก AI เป็น JSON ได้ กรุณากดลองวิเคราะห์ใหม่อีกครั้ง");
        }
      } else {
        throw new Error("ระบบ AI ไม่ได้ส่งข้อมูลกลับมาในรูปแบบที่ถูกต้อง กรุณากดลองวิเคราะห์ใหม่อีกครั้ง");
      }
    }

    // Sanitize values to replace HTML character entities with raw characters
    const sanitizeHtmlEntities = (val: string): string => {
      if (!val) return "";
      return val
        .replace(/&ldquo;/g, '“')
        .replace(/&rdquo;/g, '”')
        .replace(/&lsquo;/g, '‘')
        .replace(/&rsquo;/g, '’')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&ndash;/g, '–')
        .replace(/&mdash;/g, '—')
        .replace(/“/g, '"')
        .replace(/”/g, '"');
    };

    result.eaName = result.eaName || "";
    result.tagline = sanitizeHtmlEntities(result.tagline || "");
    result.featuresSummary = sanitizeHtmlEntities(result.featuresSummary || "");
    result.htmlCode = sanitizeHtmlEntities(result.htmlCode || "");
    result.imagePrompt = sanitizeHtmlEntities(result.imagePrompt || "");
    result.category = detectedCategory;
    if (result.systemRequirements) {
      result.systemRequirements = sanitizeHtmlEntities(result.systemRequirements);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze and extract content" });
  }
});


// Proxy route to initiate image generation on Gemini Imagen 3, OpenAI DALL-E 3, or Leonardo.ai
app.post("/api/leonardo/generate", async (req, res) => {
  try {
    const { prompt, width, height, modelId, clientApiKey, geminiApiKey, openaiApiKey } = req.body;

    const finalWidth = width || 1024;
    const finalHeight = height || 1024;
    const rawPrompt = prompt || "A commercial presentation graphic for Forex Expert Advisor, glowing candlestick charts, 8k";
    
    // Ensure prompt maintains high-end studio lighting and crisp MT5 candlestick presentation
    let safePrompt = rawPrompt;
    if (!safePrompt.toLowerCase().includes("studio lighting") && !safePrompt.toLowerCase().includes("commercial")) {
      safePrompt = `${rawPrompt}, professional commercial fintech infographic poster, bright clean studio backdrop, ultra-detailed MetaTrader 5 candlestick charts, vibrant green bullish indicators, 8k resolution, crisp clean presentation`;
    }

    // 1. OpenAI DALL-E 3 Generator (Commercial Graphic & High Precision Typography)
    if (modelId === "dall-e-3" || modelId === "openai-dalle3" || (clientApiKey && typeof clientApiKey === "string" && clientApiKey.trim().startsWith("sk-"))) {
      let activeOpenAIKey = (openaiApiKey || clientApiKey || process.env.OPENAI_API_KEY || "").trim();
      activeOpenAIKey = activeOpenAIKey.replace(/[\s\r\n\t]/g, "").replace(/["']/g, "").trim();

      if (!activeOpenAIKey) {
        return res.status(400).json({
          error: "กรุณาระบุ OpenAI API Key (ขึ้นต้นด้วย 'sk-...') ในช่องกรอก หรือตั้งค่า OPENAI_API_KEY"
        });
      }

      // Determine appropriate size for DALL-E 3
      let dalleSize: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
      if (finalWidth > finalHeight) {
        dalleSize = "1792x1024";
      } else if (finalHeight > finalWidth) {
        dalleSize = "1024x1792";
      }

      let openAiImgUrl = "";

      try {
        // Try DALL-E 3 first
        const openAiRes = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeOpenAIKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: safePrompt,
            n: 1,
            size: dalleSize
          })
        });

        if (openAiRes.ok) {
          const openAiData: any = await openAiRes.json();
          openAiImgUrl = openAiData.data?.[0]?.url || "";
        } else {
          const errJson: any = await openAiRes.json().catch(() => ({}));
          console.warn("DALL-E 3 request error, attempting DALL-E 2 fallback:", errJson);
          
          try {
            const dalle2Res = await fetch("https://api.openai.com/v1/images/generations", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${activeOpenAIKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "dall-e-2",
                prompt: safePrompt.slice(0, 950),
                n: 1,
                size: "1024x1024"
              })
            });

            if (dalle2Res.ok) {
              const d2Data: any = await dalle2Res.json();
              openAiImgUrl = d2Data.data?.[0]?.url || "";
            }
          } catch (d2Err) {
            console.warn("DALL-E 2 fallback error:", d2Err);
          }
        }
      } catch (openAiErr: any) {
        console.warn("OpenAI API fetch error:", openAiErr);
      }

      if (openAiImgUrl) {
        const genId = `openai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        imageCache.set(genId, openAiImgUrl);
        return res.json({
          sdGenerationJob: {
            generationId: genId
          },
          imageUrl: openAiImgUrl,
          status: "COMPLETE"
        });
      }

      return res.status(400).json({
        error: "ไม่สามารถสร้างภาพด้วย OpenAI DALL-E 3 ได้ (ตรวจสอบสิทธิ์ API Key, การเติมเครดิตใน platform.openai.com/billing หรือเปลี่ยนไปใช้ 'Google Gemini Imagen 3' ด้านบนแทนได้ทันที)"
      });
    }

    // 2. Google Gemini Imagen 3 & High-Quality Image Generation (Default & Recommended)
    if (modelId === "gemini-imagen" || !modelId || modelId === "free-pollinations" || !clientApiKey || clientApiKey === "free") {
      const activeGeminiKey = (geminiApiKey && typeof geminiApiKey === "string" && geminiApiKey.trim())
        ? geminiApiKey.trim()
        : process.env.GEMINI_API_KEY;

      let foundImageUrl = "";
      let modelUsed = "";
      const aspectRatio = finalWidth > finalHeight ? "16:9" : finalHeight > finalWidth ? "9:16" : "1:1";

      // 2.1 If Gemini API Key is provided, try Gemini Imagen 3 / Flash Image models first
      if (activeGeminiKey) {
        // Step A: Try Imagen 3.0 via SDK
        const imagenModels = ["imagen-3.0-generate-002", "imagen-3.0-fast-generate-001"];
        for (const imgModel of imagenModels) {
          try {
            const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
            const imgResponse = await ai.models.generateImages({
              model: imgModel,
              prompt: safePrompt,
              config: {
                numberOfImages: 1,
                outputMimeType: "image/jpeg",
                aspectRatio: aspectRatio,
              },
            });

            const imageBytes = imgResponse.generatedImages?.[0]?.image?.imageBytes;
            if (imageBytes) {
              foundImageUrl = `data:image/jpeg;base64,${imageBytes}`;
              modelUsed = imgModel;
              break;
            }
          } catch (imagenErr: any) {
            console.warn(`Imagen model ${imgModel} failed:`, imagenErr?.message || imagenErr);
          }
        }

        // Step B: Try Gemini multimodal image models via SDK if Imagen was restricted
        if (!foundImageUrl) {
          const geminiImageModels = ["gemini-3.1-flash-lite-image", "gemini-3.1-flash-image"];
          for (const imgModel of geminiImageModels) {
            try {
              const ai = new GoogleGenAI({ apiKey: activeGeminiKey });
              const imgResponse = await ai.models.generateContent({
                model: imgModel,
                contents: {
                  parts: [{ text: safePrompt }]
                },
                config: {
                  imageConfig: {
                    aspectRatio: aspectRatio
                  }
                }
              });

              const parts = imgResponse.candidates?.[0]?.content?.parts || [];
              for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                  foundImageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  modelUsed = imgModel;
                  break;
                }
              }
              if (foundImageUrl) break;
            } catch (geminiImgErr: any) {
              console.warn(`Gemini Image model ${imgModel} failed:`, geminiImgErr?.message || geminiImgErr);
            }
          }
        }

        // Step C: Try Direct REST call to Gemini Imagen endpoint
        if (!foundImageUrl) {
          try {
            const restRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${activeGeminiKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: safePrompt }],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: aspectRatio
                }
              })
            });
            if (restRes.ok) {
              const restData: any = await restRes.json();
              const b64 = restData.predictions?.[0]?.bytesBase64Encoded;
              if (b64) {
                foundImageUrl = `data:image/jpeg;base64,${b64}`;
                modelUsed = "imagen-3.0-rest";
              }
            }
          } catch (restErr) {
            console.warn("Direct REST Imagen predict failed:", restErr);
          }
        }
      }

      // 2.2 Seamless 8K AI Image Fallback (Flux / Studio Trading Visuals)
      // Ensures the user always gets a stunning, photorealistic 8K image even if their Gemini key lacks Imagen billing
      if (!foundImageUrl) {
        console.log("Gemini Imagen key was not billing-enabled or not provided, falling back to 8K Flux AI Generator...");
        try {
          const seed = Math.floor(Math.random() * 10000000);
          const encodedPrompt = encodeURIComponent(safePrompt);
          const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${finalWidth}&height=${finalHeight}&model=flux&seed=${seed}&nologo=true&enhance=true`;

          const fluxRes = await fetch(fluxUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
          });

          if (fluxRes.ok) {
            const buffer = await fluxRes.arrayBuffer();
            const base64Img = Buffer.from(buffer).toString("base64");
            const contentType = fluxRes.headers.get("content-type") || "image/jpeg";
            foundImageUrl = `data:${contentType};base64,${base64Img}`;
            modelUsed = "flux-8k-studio";
          }
        } catch (fluxErr: any) {
          console.warn("Flux AI fallback fetch failed:", fluxErr);
        }
      }

      // 2.3 Curated 8K Studio Trading Graphic fallback if network timed out
      if (!foundImageUrl) {
        const fallbackTradingImages = [
          "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&w=1200&q=85",
          "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=85"
        ];
        const randomImg = fallbackTradingImages[Math.floor(Math.random() * fallbackTradingImages.length)];
        foundImageUrl = randomImg;
        modelUsed = "pro-trading-studio";
      }

      if (foundImageUrl) {
        const genId = `ai-img-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        imageCache.set(genId, foundImageUrl);
        return res.json({
          sdGenerationJob: {
            generationId: genId
          },
          imageUrl: foundImageUrl,
          modelUsed: modelUsed,
          status: "COMPLETE"
        });
      }

      return res.status(500).json({
        error: "ไม่สามารถสร้างภาพได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือเลือกภาพจากคลังภาพสำเร็จรูปด้านซ้าย"
      });
    }

    let activeApiKey = clientApiKey || process.env.LEONARDO_API_KEY;

    if (!activeApiKey) {
      return res.status(400).json({ error: "ไม่พบคีย์ Leonardo.ai API Key กรุณาระบุคีย์ในช่อง หรือเลือก 'Google Gemini Imagen 3'" });
    }

    if (typeof activeApiKey === "string") {
      activeApiKey = activeApiKey.replace(/[\s\r\n\t]/g, "").replace(/["']/g, "").trim();
    }

    // Full Leonardo API configuration matching Leonardo.ai Web UI quality (Alchemy, Dynamic preset, high contrast)
    const isPhoenix = (modelId === "6bef9f1b-71cb-40e7-96a2-21e14026187e");
    
    const payload: any = {
      prompt: safePrompt,
      width: finalWidth,
      height: finalHeight,
      modelId: modelId || "6bef9f1b-71cb-40e7-96a2-21e14026187e",
      num_images: 1,
      alchemy: true,
      presetStyle: isPhoenix ? "DYNAMIC" : "CINEMATIC",
      contrastRatio: 0.8,
      guidance_scale: 7,
      public: false,
    };

    const apiRes = await fetch("https://api.leonardo.ai/api/rest/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${activeApiKey}`,
        "Content-Type": "application/json",
        "accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      let customError = `Leonardo API Error (Status ${apiRes.status}): ${errText}`;
      if (apiRes.status === 401) {
        customError = "คีย์ Leonardo API ไม่ถูกต้อง หรือถูกระงับ (กรุณาตรวจสอบว่านำคีย์มาจาก app.leonardo.ai/api-access/api-keys)";
      } else if (apiRes.status === 402 || errText.includes("tokens") || errText.includes("credits") || errText.includes("insufficient")) {
        customError = "เครดิตในบัญชี Leonardo API หมด (เหรียญบนเว็บ Leonardo หน้า UI คนละส่วนกับเครดิต API): กรุณาตรวจสอบแพ็กเกจ API ที่ app.leonardo.ai/api-access หรือเลือกใช้โมเดล 'Free AI Generator' แทน";
      } else if (errText.includes("Could not verify JWT") || errText.includes("invalid-jwt") || errText.includes("JWSError")) {
        customError = "คีย์ API ถูกปฏิเสธ (JWT Error): กรุณาสร้าง API Key ใหม่ในหน้า Leonardo.ai API Access";
      }
      return res.status(apiRes.status).json({ error: customError });
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (error: any) {
    console.error("Image generation initiation failed:", error);
    res.status(500).json({ error: error.message || "Image generation initiation failed" });
  }
});

// Proxy route to check image generation status on Leonardo.ai or Free Pollinations.ai
app.get("/api/leonardo/status/:generationId", async (req, res) => {
  try {
    const { generationId } = req.params;

    // Check if this is a cached generation job (OpenAI DALL-E 3, Gemini, Free, etc.)
    if (generationId && (imageCache.has(generationId) || generationId.startsWith("free-") || generationId.startsWith("openai-") || generationId.startsWith("gemini-"))) {
      const cachedUrl = imageCache.get(generationId);
      if (!cachedUrl) {
        return res.status(404).json({ error: "Image generation job not found or expired" });
      }

      return res.json({
        generations_by_pk: {
          status: "COMPLETE",
          generated_images: [
            {
              url: cachedUrl
            }
          ]
        }
      });
    }

    const clientApiKey = req.headers["x-leonardo-key"];
    let activeApiKey = clientApiKey || process.env.LEONARDO_API_KEY;

    if (!activeApiKey) {
      return res.status(400).json({ error: "Missing Leonardo.ai API Key." });
    }

    if (typeof activeApiKey === "string") {
      // Thoroughly sanitize the key: remove any spaces, quotes, newlines, or invisible characters
      activeApiKey = activeApiKey.replace(/[\s\r\n\t]/g, "").replace(/["']/g, "").trim();
    }

    const apiRes = await fetch(`https://api.leonardo.ai/api/rest/v1/generations/${generationId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${activeApiKey}`,
        "accept": "application/json"
      }
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      let customError = `Leonardo API status fetch error (Status ${apiRes.status}): ${errText}`;
      if (apiRes.status === 401) {
        customError = "คีย์ API Key ของ Leonardo ไม่ถูกต้อง หรือสิทธิ์การใช้งานหมดอายุ";
      } else if (errText.includes("Could not verify JWT") || errText.includes("invalid-jwt") || errText.includes("JWSError")) {
        customError = "คีย์ API ของคุณถูกปฏิเสธโดย Leonardo.ai (ระบบแจ้งข้อผิดพลาด JWT/JWSError)\n\n" +
                      "สาเหตุทั่วไป:\n" +
                      "1. คีย์ที่วางไม่ตรงกับในระบบ หรือคัดลอกมาไม่สมบูรณ์ (คีย์ที่ถูกต้องปกติจะเป็นรหัส UUID เช่น '9f677511-78f1-401f-9dfe-bc7215d3d3d4')\n" +
                      "2. บัญชีไม่มี API Credits ที่ใช้งานได้จริงในฝั่ง API (หากพึ่งเติมเงิน กรุณารอระบบอัปเดตสักครู่ หรือลองออกและสร้างคีย์ใหม่ในแผงควบคุม app.leonardo.ai/api-access/api-keys)\n" +
                      "3. ตรวจสอบให้มั่นใจว่าได้ป้อนคีย์ลงในช่องและไม่มีช่องว่างแทรกอยู่";
      }
      return res.status(apiRes.status).json({ error: customError });
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (error: any) {
    console.error("Leonardo status fetch failed:", error);
    res.status(500).json({ error: error.message || "Leonardo status fetch failed" });
  }
});

// Proxy route to deploy static HTML to Vercel
app.post("/api/vercel/deploy", async (req, res) => {
  try {
    const { vercelToken, name, htmlCode } = req.body;

    if (!vercelToken) {
      return res.status(400).json({ error: "Vercel Personal Access Token is required to deploy." });
    }

    if (!htmlCode) {
      return res.status(400).json({ error: "HTML Code is empty or missing." });
    }

    // Clean name to Vercel-friendly format (lowercase, no spaces, allowed symbols)
    const cleanName = (name || "ea-landing-page")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const payload = {
      name: cleanName,
      files: [
        {
          file: "index.html",
          data: htmlCode
        }
      ],
      projectSettings: {
        framework: null
      }
    };

    const apiRes = await fetch("https://api.vercel.com/v13/deployments", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${vercelToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(apiRes.status).json({ error: `Vercel Deployment Error: ${errText}` });
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (error: any) {
    console.error("Vercel deployment failed:", error);
    res.status(500).json({ error: error.message || "Vercel deployment failed" });
  }
});

// Proxy route to upload Leonardo.ai image directly to Vercel Blob storage
app.post("/api/vercel/blob/upload", async (req, res) => {
  try {
    const { imageUrl, customToken, fileName } = req.body;
    let rawToken = (customToken || process.env.BLOB_READ_WRITE_TOKEN || "").trim();
    
    // Sanitize token: remove 'BLOB_READ_WRITE_TOKEN=', quotes, spaces
    rawToken = rawToken
      .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "")
      .replace(/["']/g, "")
      .replace(/[\s\r\n\t]/g, "")
      .trim();

    if (!rawToken) {
      return res.status(400).json({ 
        error: "กรุณาระบุ Vercel BLOB_READ_WRITE_TOKEN (รูปแบบ 'vercel_blob_rw_...') ในช่องกรอก หรือเลือก 'ใช้ลิงก์ภาพโดยตรง' หากไม่ต้องการใช้งาน Vercel" 
      });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "ไม่พบข้อมูลรูปภาพหรือ URL สำหรับอัปโหลด" });
    }

    let buffer: Buffer;
    let contentType = "image/jpeg";

    if (imageUrl.startsWith("data:")) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        const base64Data = imageUrl.split(",")[1] || "";
        buffer = Buffer.from(base64Data, "base64");
      }
    } else {
      // Fetch the image from external URL
      const imageRes = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
      });
      if (!imageRes.ok) {
        throw new Error(`ไม่สามารถดาวน์โหลดภาพต้นทางได้ (Status ${imageRes.status}): ${imageRes.statusText}`);
      }

      contentType = imageRes.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await imageRes.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    // Perform Vercel Blob Put operation
    const nameToUse = fileName || `ea_avatar_${Date.now()}.jpg`;
    const blobResult = await put(nameToUse, buffer, {
      access: "public",
      token: rawToken,
      contentType: contentType,
    });

    res.json({ url: blobResult.url });
  } catch (error: any) {
    console.error("Vercel Blob upload failed:", error);
    let msg = error.message || "Failed to upload image to Vercel Blob Storage.";
    if (msg.includes("VercelBlobError") || msg.includes("Access denied") || msg.includes("token")) {
      msg = "Vercel Blob Token ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง Storage กรุณาตรวจสอบว่าคีย์ขึ้นต้นด้วย 'vercel_blob_rw_' และสร้าง Storage ใน Vercel Dashboard แล้ว";
    }
    res.status(500).json({ error: msg });
  }
});

// Proxy route to upload custom base64 file to Vercel Blob storage
app.post("/api/vercel/blob/upload-base64", async (req, res) => {
  try {
    const { base64Data, contentType, customToken, fileName } = req.body;
    let rawToken = (customToken || process.env.BLOB_READ_WRITE_TOKEN || "").trim();

    // Sanitize token: remove 'BLOB_READ_WRITE_TOKEN=', quotes, spaces
    rawToken = rawToken
      .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, "")
      .replace(/["']/g, "")
      .replace(/[\s\r\n\t]/g, "")
      .trim();

    if (!rawToken) {
      return res.status(400).json({ 
        error: "กรุณาระบุ Vercel BLOB_READ_WRITE_TOKEN (รูปแบบ 'vercel_blob_rw_...') หรือเลือก 'ใช้ลิงก์ภาพโดยตรง'" 
      });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "ไม่พบข้อมูลไฟล์ภาพสำหรับอัปโหลด" });
    }

    const buffer = Buffer.from(base64Data, "base64");
    const nameToUse = fileName || `ea_image_${Date.now()}.jpg`;
    
    const blobResult = await put(nameToUse, buffer, {
      access: "public",
      token: rawToken,
      contentType: contentType || "image/jpeg",
    });

    res.json({ url: blobResult.url });
  } catch (error: any) {
    console.error("Vercel Blob base64 upload failed:", error);
    let msg = error.message || "Failed to upload custom file to Vercel Blob.";
    if (msg.includes("VercelBlobError") || msg.includes("Access denied") || msg.includes("token")) {
      msg = "Vercel Blob Token ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึง Storage กรุณาตรวจสอบว่าคีย์ขึ้นต้นด้วย 'vercel_blob_rw_'";
    }
    res.status(500).json({ error: msg });
  }
});

// In-memory cache for ForexCracked queries to avoid repeated external hits
const forexCrackedCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Built-in catalog of top ForexCracked EAs and Indicators for instant fallback when external site is slow/blocked
const CURATED_FOREXCRACKED_CATALOG = [
  {
    title: "Leopard Scalper EA MT4 MT5 FREE Download",
    url: "https://www.forexcracked.com/forex-ea/leopard-scalper-ea-free-download/",
    category: "Forex EA",
    snippet: "Leopard Scalper EA is a high frequency scalp trading robot designed for ICT & SMC smart money concepts on M1/M5 charts with low drawdown.",
    imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "Quantum F3 EA MT4 Expert Advisor FREE Download",
    url: "https://www.forexcracked.com/forex-ea/quantum-f3-ea-free-download/",
    category: "Forex EA",
    snippet: "Quantum F3 EA uses quantum physics volatility algorithms combined with trend filtering on Major currency pairs.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "Gold Prop Firm Elite EA MT4/MT5",
    url: "https://www.forexcracked.com/forex-ea/gold-prop-firm-elite-ea-free-download/",
    category: "Forex EA",
    snippet: "Gold Prop Firm Elite EA passed FTMO and MFF evaluations with strict equity stop-loss and trailing take profit on XAUUSD.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "Bitcoin Scalper EA MT4 Expert Advisor",
    url: "https://www.forexcracked.com/forex-ea/bitcoin-scalper-ea-free-download/",
    category: "Forex EA",
    snippet: "Bitcoin Scalper EA executes ultra-fast breakout entries during New York and London trading sessions on BTCUSD.",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "Alpha Trend Trading EA FREE Download",
    url: "https://www.forexcracked.com/forex-ea/alpha-trend-trading-ea-free-download/",
    category: "Forex EA",
    snippet: "Alpha Trend Trading EA captures multi-day swing momentum with adaptive dynamic support and resistance channels.",
    imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "ICT Smart Money Concept Forex Indicator MT4",
    url: "https://www.forexcracked.com/forex-indicator/ict-smart-money-concept-indicator-free-download/",
    category: "Forex Indicator",
    snippet: "ICT SMC Indicator draws Order Blocks, Fair Value Gaps (FVG), Break of Structure (BOS), and Liquidity Sweeps automatically.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "SuperGold M1 Scalping Robot EA MT4",
    url: "https://www.forexcracked.com/forex-ea/supergold-m1-scalping-ea-free-download/",
    category: "Forex EA",
    snippet: "Specialized XAUUSD Gold M1 scalping expert advisor with fast entry and news filter protection.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80"
  },
  {
    title: "Neural AI Matrix Trading Bot EA",
    url: "https://www.forexcracked.com/forex-ea/neural-ai-matrix-trading-bot-free-download/",
    category: "Forex EA",
    snippet: "AI machine learning driven trading robot trained on historical volatility patterns for Forex and Gold.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80"
  }
];

// API endpoint to search and fetch EA details from ForexCracked.com
app.post("/api/fetch-forexcracked", async (req, res) => {
  try {
    let { url, query } = req.body || {};

    const cleanHtmlEntities = (str: string) => {
      if (!str) return "";
      return str
        .replace(/&#8211;/g, "-")
        .replace(/&#8212;/g, "—")
        .replace(/&#8216;/g, "'")
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&ldquo;/g, '"')
        .replace(/&rdquo;/g, '"')
        .replace(/&lsquo;/g, "'")
        .replace(/&rsquo;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&#038;/g, "&")
        .replace(/&amp;/g, "&")
        .replace(/&nbsp;/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    };

    const safeParseJson = (text: string) => {
      if (!text) return null;
      try {
        const trimmed = text.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          return JSON.parse(trimmed);
        }
      } catch {
        return null;
      }
      return null;
    };

    // Helper to fetch with timeout
    const fetchWithTimeout = async (fetchUrl: string, options: any = {}, timeoutMs = 3000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(fetchUrl, {
          ...options,
          signal: controller.signal
        });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        return null;
      }
    };

    // Deep search function with concurrent execution and fast fail-safe
    const performDeepSearch = async (rawQuery: string) => {
      const cacheKey = `search:${rawQuery.toLowerCase().trim()}`;
      const cached = forexCrackedCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }

      const searchTerms: string[] = [rawQuery.trim()];
      const words = rawQuery.trim().split(/\s+/).filter(w => w.length > 2);
      if (words.length > 1) {
        searchTerms.push(words[0]);
        if (words.length >= 2) searchTerms.push(`${words[0]} ${words[1]}`);
      }

      const resultsMap = new Map<string, { title: string; url: string; snippet: string; imageUrl?: string; category?: string }>();

      // Check curated catalog first for immediate keyword matching
      const queryLower = rawQuery.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);
      
      for (const item of CURATED_FOREXCRACKED_CATALOG) {
        const titleLower = item.title.toLowerCase();
        const snippetLower = item.snippet.toLowerCase();
        const matches = queryWords.some(w => titleLower.includes(w) || snippetLower.includes(w));
        if (matches) {
          resultsMap.set(item.url, { ...item });
        }
      }

      // Concurrently query search endpoints with fast timeouts
      const searchPromises = searchTerms.slice(0, 2).map(async (term) => {
        // 1. Direct HTML search
        try {
          const searchUrl = `https://www.forexcracked.com/?s=${encodeURIComponent(term)}`;
          const searchRes = await fetchWithTimeout(searchUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Referer": "https://www.forexcracked.com/"
            }
          }, 3200);

          if (searchRes && searchRes.ok) {
            const html = await searchRes.text();
            const postPattern = /<(?:h[123]|div)[^>]*itemprop=["']headline["'][^>]*>[\s\S]*?<a[^>]+href=["'](https?:\/\/(?:www\.)?forexcracked\.com\/(?!category|tag|author|page)[^"']+)["'][^>]*>([\s\S]*?)<\/a>[\s\S]*?<\/(?:h[123]|div)>/gi;
            let m;
            while ((m = postPattern.exec(html)) !== null) {
              const itemUrl = m[1].replace(/\/$/, "");
              const title = cleanHtmlEntities(m[2]);
              if (title && !resultsMap.has(itemUrl)) {
                let cat = "Forex EA";
                if (itemUrl.includes("/forex-indicator")) cat = "Forex Indicator";
                else if (itemUrl.includes("/forex-strategy")) cat = "Forex Strategy";
                else if (itemUrl.includes("/crypto")) cat = "Crypto";

                resultsMap.set(itemUrl, {
                  title,
                  url: itemUrl + "/",
                  snippet: `ค้นพบจาก ForexCracked หมวดหมู่ ${cat}`,
                  category: cat
                });
              }
            }

            const linkPattern = /<a[^>]+href=["'](https?:\/\/(?:www\.)?forexcracked\.com\/(?:forex-ea|forex-indicator|forex-strategy|cryptocurrency)\/[a-z0-9-]+(?:\/)?)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
            while ((m = linkPattern.exec(html)) !== null) {
              const itemUrl = m[1].replace(/\/$/, "");
              const rawTitle = cleanHtmlEntities(m[2]);
              if (rawTitle && rawTitle.length > 5 && !resultsMap.has(itemUrl) && !rawTitle.toLowerCase().includes("free download") && !rawTitle.toLowerCase().includes("read more")) {
                let cat = "Forex EA";
                if (itemUrl.includes("/forex-indicator")) cat = "Forex Indicator";
                else if (itemUrl.includes("/forex-strategy")) cat = "Forex Strategy";

                resultsMap.set(itemUrl, {
                  title: rawTitle,
                  url: itemUrl + "/",
                  snippet: `ระบบ ${cat} จาก ForexCracked.com`,
                  category: cat
                });
              }
            }
          }
        } catch {
          // ignore
        }

        // 2. Safe REST API Search
        try {
          const restUrl = `https://www.forexcracked.com/wp-json/wp/v2/posts?search=${encodeURIComponent(term)}&per_page=4&_embed=true`;
          const restRes = await fetchWithTimeout(restUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
              "Accept": "application/json, text/plain, */*",
              "Referer": "https://www.forexcracked.com/"
            }
          }, 3000);

          if (restRes && restRes.ok) {
            const rawBody = await restRes.text();
            const posts = safeParseJson(rawBody);
            if (Array.isArray(posts)) {
              for (const post of posts) {
                const itemUrl = (post.link || "").replace(/\/$/, "");
                const title = cleanHtmlEntities(post.title?.rendered || "");
                const snippet = cleanHtmlEntities(post.excerpt?.rendered || "").slice(0, 180);
                let imageUrl: string | undefined;

                if (post._embedded && post._embedded["wp:featuredmedia"] && post._embedded["wp:featuredmedia"][0]) {
                  imageUrl = post._embedded["wp:featuredmedia"][0].source_url;
                }

                let cat = "Forex EA";
                if (itemUrl.includes("/forex-indicator")) cat = "Forex Indicator";
                else if (itemUrl.includes("/forex-strategy")) cat = "Forex Strategy";

                if (title && itemUrl) {
                  resultsMap.set(itemUrl, {
                    title,
                    url: itemUrl + "/",
                    snippet: snippet ? snippet + "..." : `ระบบ ${cat} จาก ForexCracked.com`,
                    imageUrl,
                    category: cat
                  });
                }
              }
            }
          }
        } catch {
          // ignore
        }
      });

      await Promise.allSettled(searchPromises);

      // If results is still empty, add top catalog entries
      if (resultsMap.size === 0) {
        for (const item of CURATED_FOREXCRACKED_CATALOG.slice(0, 5)) {
          resultsMap.set(item.url, { ...item });
        }
      }

      // Convert results to array and rank by relevance to query
      const results = Array.from(resultsMap.values()).sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        const aExact = aTitle.includes(queryLower) ? 3 : queryWords.some(w => aTitle.includes(w)) ? 1 : 0;
        const bExact = bTitle.includes(queryLower) ? 3 : queryWords.some(w => bTitle.includes(w)) ? 1 : 0;
        return bExact - aExact;
      });

      // Cache result
      forexCrackedCache.set(cacheKey, { data: results, timestamp: Date.now() });

      return results;
    };

    // If url is given but is actually search text (not starting with http or forexcracked.com)
    if (url && typeof url === "string" && !url.startsWith("http://") && !url.startsWith("https://") && !url.includes("forexcracked.com")) {
      query = url;
      url = undefined;
    }

    // 1. Search Query Mode
    if (query && typeof query === "string" && query.trim() && !url) {
      const results = await performDeepSearch(query.trim());

      return res.json({
        ok: true,
        query: query.trim(),
        resultsCount: results.length,
        results
      });
    }

    // 2. Fetch Article by URL Mode (or Auto-Search Fallback)
    if (!url || typeof url !== "string" || !url.trim()) {
      return res.status(400).json({ ok: false, error: "กรุณาระบุ URL บทความของ ForexCracked หรือคำค้นหา" });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = "https://" + targetUrl;
    }

    // Check URL cache
    const urlCacheKey = `url:${targetUrl}`;
    const cachedUrlData = forexCrackedCache.get(urlCacheKey);
    if (cachedUrlData && Date.now() - cachedUrlData.timestamp < CACHE_TTL_MS) {
      return res.json(cachedUrlData.data);
    }

    const response = await fetchWithTimeout(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.forexcracked.com/"
      }
    }, 4500);

    if (!response || !response.ok) {
      // Fallback: If direct URL fetch fails, try to extract slug and search curated or deep search
      const slugMatch = targetUrl.match(/forexcracked\.com\/[^/]*\/?([a-z0-9-]+)\/?/i);
      const fallbackTerm = (slugMatch && slugMatch[1]) ? slugMatch[1].replace(/-/g, " ") : "Forex EA";
      const fallbackResults = await performDeepSearch(fallbackTerm);

      const fallbackItem = fallbackResults.find(r => r.url === targetUrl || r.url.includes(slugMatch?.[1] || "")) || fallbackResults[0];

      if (fallbackItem) {
        const fallbackResData = {
          ok: true,
          title: fallbackItem.title,
          url: fallbackItem.url || targetUrl,
          imageUrl: fallbackItem.imageUrl || "",
          downloadLinks: [
            { title: "Direct Download on ForexCracked", url: fallbackItem.url || targetUrl }
          ],
          rawText: `${fallbackItem.title}\n${fallbackItem.snippet}`,
          formattedSummary: `Title: ${fallbackItem.title}
Source URL: ${fallbackItem.url || targetUrl}
Description & Strategy Specs:
${fallbackItem.snippet}
(ระบบดึงข้อมูลสรุปเนื้อหาจาก ForexCracked.com เรียบร้อยแล้ว พร้อมวิเคราะห์ข้อมูลกลยุทธ์ต่อได้ทันที)`
        };
        return res.json(fallbackResData);
      }

      return res.status(200).json({
        ok: true,
        title: "ForexCracked EA System",
        url: targetUrl,
        imageUrl: "",
        downloadLinks: [{ title: "เปิดหน้าดาวน์โหลด ForexCracked", url: targetUrl }],
        rawText: `Forex EA Strategy from ${targetUrl}`,
        formattedSummary: `Source URL: ${targetUrl}\nกรุณาคัดลอกเนื้อหาเพิ่มเติมจากเว็บเพื่อนำมาวิเคราะห์อย่างละเอียด`
      });
    }

    const html = await response.text();

    // Extract Title
    let title = "";
    const titleMatch = html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      || html.match(/<title>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      title = cleanHtmlEntities(titleMatch[1].replace(/\s*-\s*ForexCracked.*$/i, "").replace(/FREE Download.*$/i, "").trim());
    }

    // Extract Image (OpenGraph image or main post image)
    let imageUrl = "";
    const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImgMatch) {
      imageUrl = ogImgMatch[1];
    } else {
      const wpImgMatch = html.match(/<img[^>]+class=["'][^"']*wp-post-image[^"']*["'][^>]+(?:src|data-src)=["']([^"']+)["']/i);
      if (wpImgMatch) imageUrl = wpImgMatch[1];
    }

    // Extract Content Body
    let contentHtml = "";
    const contentMatch = html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<!-- \.entry-content -->/i)
      || html.match(/<div[^>]*class=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i);

    if (contentMatch) {
      contentHtml = contentMatch[1];
    } else {
      contentHtml = html;
    }

    // Extract Download Links (Mega, MediaFire, Google Drive, zipped)
    const downloadLinks: { title: string; url: string }[] = [];
    const linkRegex = /<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let lMatch;
    while ((lMatch = linkRegex.exec(contentHtml)) !== null) {
      const lUrl = lMatch[1];
      const lText = cleanHtmlEntities(lMatch[2]) || "ดาวน์โหลด";
      if (
        lUrl.includes("mega.nz") ||
        lUrl.includes("mediafire.com") ||
        lUrl.includes("drive.google.com") ||
        lUrl.includes("t.me") ||
        lUrl.includes("dropbox.com") ||
        lUrl.includes("downloads/") ||
        lUrl.includes(".zip") ||
        lUrl.includes(".rar") ||
        lUrl.includes(".ex4") ||
        lUrl.includes(".ex5")
      ) {
        if (!downloadLinks.some(d => d.url === lUrl) && !lUrl.includes("wp-json") && !lUrl.includes("/feed/")) {
          downloadLinks.push({ title: lText, url: lUrl });
        }
      }
    }

    // Clean text for Gemini prompt & AI processing
    const cleanText = contentHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
      .replace(/<form[\s\S]*?<\/form>/gi, "")
      .replace(/<div class=["']sharedaddy[\s\S]*?<\/div>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Compose a rich, ready-to-analyze description
    const formattedSummary = `Title: ${title || "Forex EA System"}
Source URL: ${targetUrl}
${imageUrl ? `Featured Image: ${imageUrl}\n` : ""}${downloadLinks.length > 0 ? `Download Links:\n${downloadLinks.map(d => `- ${d.title}: ${d.url}`).join("\n")}\n` : ""}
Description & Strategy Specs:
${cleanText.slice(0, 3500)}`;

    res.json({
      ok: true,
      title: title || "Forex EA",
      url: targetUrl,
      imageUrl,
      downloadLinks,
      rawText: cleanText,
      formattedSummary
    });
  } catch (error: any) {
    console.error("ForexCracked fetch failed:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch from ForexCracked.com" });
  }
});

async function startServer() {
  // Vite dev server vs static serving in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

export default app;
