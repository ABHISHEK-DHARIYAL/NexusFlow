import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
let aiInstance: GoogleGenAI | null = null;

if (geminiApiKey) {
  try {
    aiInstance = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    console.log("🤖 Gemini Client successfully initialized.");
  } catch (err) {
    console.error("❌ Failed to initialize GoogleGenAI with provided key:", err);
  }
} else {
  console.log("ℹ️ No GEMINI_API_KEY detected. AI workflows will run under smart offline synthesis mode.");
}

export function getGeminiClient(): GoogleGenAI | null {
  return aiInstance;
}
