import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFinances = async (transactions: Transaction[]): Promise<AIInsight> => {
  if (transactions.length === 0) {
    return {
      status: 'good',
      message: 'Belum ada data untuk dianalisis.',
      recommendations: ['Mulai masukkan transaksi harian Anda.']
    };
  }

  const dataStr = JSON.stringify(transactions);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Berikut adalah data buku kas saya: ${dataStr}. Berikan ringkasan kesehatan finansial dan saran strategi uang dalam Bahasa Indonesia.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            message: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['status', 'message', 'recommendations']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as AIInsight;
  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      status: 'warning',
      message: 'Gagal menganalisis data saat ini.',
      recommendations: ['Coba lagi nanti atau periksa koneksi internet Anda.']
    };
  }
};
