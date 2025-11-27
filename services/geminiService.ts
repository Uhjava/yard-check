import { GoogleGenAI } from "@google/genai";
import { AuditSession } from '../types';
import { MOCK_UNITS } from '../constants';

// Declare the constant injected by Vite
declare const __GEMINI_API_KEY__: string;

let aiClient: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;

  // Use the injected constant directly
  const apiKey = typeof __GEMINI_API_KEY__ !== 'undefined' ? __GEMINI_API_KEY__ : '';

  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
    return null;
  }

  try {
    aiClient = new GoogleGenAI({ apiKey });
    return aiClient;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
};

const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const processAuditFile = async (file: File, yardName: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return [];

  try {
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      I am performing an inventory audit at the "${yardName}" yard.
      Analyze the provided inventory document/image.
      
      Task: Extract all 'Unit IDs' (e.g., GST 01-01, GHM 08-01, etc.) that are listed as being PRESENT at this yard.
      
      Rules for determining "Present":
      1. If the 'Location' column says "YARD", count it as present.
      2. If the 'Location' column explicitly says "${yardName}", count it as present.
      3. If the 'Location' is "Davenport" and I am at "Davenport", count it.
      4. If the 'Location' is "Movie Ranch" and I am at "Movie Ranch", count it.
      5. EXCLUDE units listed at other locations (e.g., "Texas", "New Mexico", "Repair", "Returning").
      
      Return ONLY a JSON array of strings containing the Unit IDs found. 
      Example format: ["GST 01-01", "GHM 08-02"]
      Do not include markdown formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [filePart, { text: prompt }]
      }
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Gemini File Processing Error:", error);
    return [];
  }
};

export const generateAuditReport = async (session: AuditSession): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "API Key is missing. Please configure your environment variables.";

  const presentCount = Object.values(session.records).filter(r => r.status === 'PRESENT').length;
  const missingCount = Object.values(session.records).filter(r => r.status === 'MISSING').length;
  
  const missingUnits = Object.values(session.records)
    .filter(r => r.status === 'MISSING')
    .map(r => {
      const unit = MOCK_UNITS.find(u => u.id === r.unitId);
      return `- ${r.unitId} (${unit?.category || 'Unknown'})`;
    }).join('\n');

  const prompt = `
    Audit Summary for ${session.yard} Yard.
    Date: ${new Date(session.startTime).toLocaleDateString()}
    Found: ${presentCount}
    Missing: ${missingCount}
    
    Missing Units List:
    ${missingUnits}
    
    Write a brief executive summary and action plan. Format as Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI report.";
  }
};