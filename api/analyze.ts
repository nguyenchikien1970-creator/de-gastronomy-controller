import { GoogleGenAI } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";

const MODEL_NAME = 'gemini-3-flash-preview';

export default async function handler(req: any, res: any) {
  // Chỉ chấp nhận POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Đọc API key từ biến môi trường server (KHÔNG bao giờ gửi cho client)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY chưa được cấu hình. Hãy thêm trong Vercel Dashboard → Settings → Environment Variables.' 
    });
  }

  try {
    const { payload } = req.body;

    if (!payload) {
      return res.status(400).json({ error: 'Thiếu dữ liệu phân tích.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: AI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: 'Phản hồi trống từ AI.' });
    }

    const result = JSON.parse(text);
    return res.status(200).json(result);

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ 
      error: error.message || 'Lỗi khi phân tích dữ liệu.' 
    });
  }
}
