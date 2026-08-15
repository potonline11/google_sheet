import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { put } from "@vercel/blob";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const PORT = 3000;

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

// API endpoint to analyze raw EA text / code and extract Slogan, Features, and HTML code.
app.post("/api/analyze", async (req, res) => {
  try {
    const { input, geminiApiKey } = req.body || {};
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

    const prompt = `You are an expert copywriter, software engineer, and marketing designer for MetaTrader Expert Advisors (EA). 
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
5. Create a highly descriptive English image generation prompt tailored for Leonardo.ai or Flux/Pollinations to generate a stunning, professional, and commercial-grade marketing visual representing this EA.
   - CRITICAL QUALITY CONTROL: The visual must look like a premium corporate financial or fintech product (e.g., sleek futuristic AI trading terminal, a smart metallic trading bot with glowing blue/green/amber charts, elegant gold bulls/bears representations, or high-tech automated trading consoles).
   - AVOID CHILDISH/LITERAL INTERPRETATIONS: If the EA's name contains metaphorical or whimsical terms (like "Lollipop", "Rabbit", "Candy", "Dragon", "Phoenix", etc.), DO NOT generate literal candies, sweets, rabbits, or toys. Instead, interpret them as a sleek modern tech-branding concept. For example, if the name is "Lollipop", represent it as a professional, abstract high-tech corporate icon, a glowing geometric sphere representing market data, or a cybernetic trading terminal with an emblem decal. Never make actual lollipops, foods, or cartoonish characters.
   - STYLE: Cinematic lighting, 3D digital art, octane render, futuristic, clean professional aesthetic, high contrast, dark high-tech slate/indigo background with vibrant neon accents (green/blue/amber), photorealistic, 8k resolution, commercial advertising style.

CRITICAL DESIGN REQUIREMENT FOR HTML / TEXT FIELDS:
- DO NOT use any HTML character entities or encodings like '&ldquo;', '&rdquo;', '&rsquo;', '&lsquo;', '&quot;', '&amp;', or '&nbsp;' inside the Thai text fields or HTML wrappers.
- All Thai quotation marks must be raw characters (e.g., “ หรือ ” หรือ " หรือ ') or normal standard characters.
- Ensure that the resulting JSON can be rendered directly using dangerouslySetInnerHTML without displaying weird literal codes like '&ldquo;' to the user.

Input Text/Strategy Description:
${input}

Return your response strictly as a JSON object matching the requested schema. Ensure that your output does not wrap the JSON keys with any formatting or code blocks inside the text fields. Thai text must be grammatically correct and persuasive.`;

    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          eaName: {
            type: Type.STRING,
            description: "The name of the Expert Advisor (EA)."
          },
          tagline: {
            type: Type.STRING,
            description: "A persuasive, catchy marketing tagline in Thai (คำโปรย) written as ready-to-use HTML code."
          },
          featuresSummary: {
            type: Type.STRING,
            description: "Structured trading features and settings in Thai (สรุปฟีเจอร์) formatted entirely as clean, styled semantic HTML code (e.g. ul/li/strong/span)."
          },
          htmlCode: {
            type: Type.STRING,
            description: "Stunning visual presentation card styled with Tailwind CSS in HTML."
          },
          imagePrompt: {
            type: Type.STRING,
            description: "Detailed English image generation prompt for Leonardo.ai representing the EA."
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

    res.json(result);
  } catch (error: any) {
    console.error("Gemini analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze and extract EA content" });
  }
});

// Proxy route to initiate image generation on Leonardo.ai or Free Pollinations.ai
app.post("/api/leonardo/generate", async (req, res) => {
  try {
    const { prompt, width, height, modelId, clientApiKey } = req.body;

    // Check if user selected the free generator or does not have a key
    if (modelId === "free-pollinations" || !clientApiKey) {
      const finalWidth = width || 1024;
      const finalHeight = height || 1024;
      const randomSeed = Math.floor(Math.random() * 1000000);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt || "A sleek futuristic trading card")}?width=${finalWidth}&height=${finalHeight}&nologo=true&enhance=true&seed=${randomSeed}`;
      
      const generationId = `free-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      imageCache.set(generationId, imageUrl);

      return res.json({
        sdGenerationJob: {
          generationId: generationId
        }
      });
    }

    let activeApiKey = clientApiKey || process.env.LEONARDO_API_KEY;

    if (!activeApiKey) {
      return res.status(400).json({ error: "Missing Leonardo.ai API Key. Please select 'Free AI Generator' or configure LEONARDO_API_KEY on the server." });
    }

    if (typeof activeApiKey === "string") {
      // Thoroughly sanitize the key: remove any spaces, quotes, newlines, or invisible characters
      activeApiKey = activeApiKey.replace(/[\s\r\n\t]/g, "").replace(/["']/g, "").trim();
    }

    const payload = {
      prompt: prompt || "A sleek futuristic trading card",
      width: width || 1024,
      height: height || 768,
      modelId: modelId || "b2449217-0e93-4096-bba0-49aef32fc5b5", // Default to Phoenix/Leonardo Vision XL
      num_images: 1,
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
        customError = "คีย์ API Key ของ Leonardo ไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าใช้งาน กรุณาตรวจสอบว่าคีย์สะกดถูกต้องและไม่มีช่องว่างส่วนเกิน";
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
    console.error("Leonardo generation initiation failed:", error);
    res.status(500).json({ error: error.message || "Leonardo generation initiation failed" });
  }
});

// Proxy route to check image generation status on Leonardo.ai or Free Pollinations.ai
app.get("/api/leonardo/status/:generationId", async (req, res) => {
  try {
    const { generationId } = req.params;

    // Check if this is a free generation job
    if (generationId && generationId.startsWith("free-")) {
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
    const rawToken = customToken || process.env.BLOB_READ_WRITE_TOKEN;
    const token = typeof rawToken === "string" ? rawToken.trim() : rawToken;

    if (!token) {
      return res.status(400).json({ error: "Missing Vercel BLOB_READ_WRITE_TOKEN. Please provide it in the inputs or configure it as environment variable." });
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "No image URL provided to upload." });
    }

    // Fetch the image from Leonardo S3 (often a presigned S3 url)
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download Leonardo image: ${imageRes.statusText}`);
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Perform Vercel Blob Put operation
    const nameToUse = fileName || `ea_avatar_${Date.now()}.jpg`;
    const blobResult = await put(nameToUse, buffer, {
      access: "public",
      token: token,
      contentType: contentType,
    });

    res.json({ url: blobResult.url });
  } catch (error: any) {
    console.error("Vercel Blob upload failed:", error);
    res.status(500).json({ error: error.message || "Failed to upload image to Vercel Blob Storage." });
  }
});

// Proxy route to upload custom base64 file to Vercel Blob storage
app.post("/api/vercel/blob/upload-base64", async (req, res) => {
  try {
    const { base64Data, contentType, customToken, fileName } = req.body;
    const rawToken = customToken || process.env.BLOB_READ_WRITE_TOKEN;
    const token = typeof rawToken === "string" ? rawToken.trim() : rawToken;

    if (!token) {
      return res.status(400).json({ error: "Missing Vercel BLOB_READ_WRITE_TOKEN." });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "No base64 data provided." });
    }

    const buffer = Buffer.from(base64Data, "base64");
    const nameToUse = fileName || `ea_image_${Date.now()}.jpg`;
    
    const blobResult = await put(nameToUse, buffer, {
      access: "public",
      token: token,
      contentType: contentType || "image/jpeg",
    });

    res.json({ url: blobResult.url });
  } catch (error: any) {
    console.error("Vercel Blob base64 upload failed:", error);
    res.status(500).json({ error: error.message || "Failed to upload custom file to Vercel Blob." });
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
