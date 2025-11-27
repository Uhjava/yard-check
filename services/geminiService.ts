import { GoogleGenAI } from "@google/genai";
import { AuditSession, Unit } from '../types';
import { MOCK_UNITS } from '../constants';

// Lazy initialization holder
let aiClient: GoogleGenAI | null = null;

// Helper to safely get the AI client instance
const getAiClient = (): GoogleGenAI | null => {
  if (aiClient) return aiClient;

  // With Vite's `define` config, this string is replaced at build time.
  // We check if it exists and is not empty.
  const apiKey = process.env.API_KEY;

  if (!apiKey || apiKey.length === 0) {
    console.warn("Gemini API Key is missing. AI features will not work.");
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

// Helper to convert File to base64 for Gemini
const fileToGenerativePart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
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
  if (!ai) {
    console.error("AI Client not initialized (Missing API Key)");
    return [];
  }

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
      Do not include markdown formatting or explanations, just the raw JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [filePart, { text: prompt }]
      }
    });

    const text = response.text || "[]";
    // Clean up potential markdown code blocks if Gemini adds them
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
  
  // Prepare data for the prompt
  const missingUnits = Object.values(session.records)
    .filter(r => r.status === 'MISSING')
    .map(r => {
      const unit = MOCK_UNITS.find(u => u.id === r.unitId);
      return `- ${r.unitId} (${unit?.category || 'Unknown'}) - Last known: ${unit?.expectedLocation || 'N/A'}`;
    }).join('\n');

  const presentSample = Object.values(session.records)
    .filter(r => r.status === 'PRESENT')
    .slice(0, 5)
    .map(r => r.unitId)
    .join(', ');

  const prompt = `
    You are an expert fleet manager assistant.
    I have just completed a physical inventory check at the "${session.yard}" yard.
    
    Here is the data:
    - Date: ${new Date(session.startTime).toLocaleDateString()}
    - Total Units Checked: ${Object.keys(session.records).length}
    - Found (Present): ${presentCount} (Examples: ${presentSample}...)
    - Not Found (Missing): ${missingCount}
    
    Here is the list of MISSING units that were marked not present:
    ${missingUnits}
    
    Please write a concise, professional executive summary of this audit. 
    1. Start with a high-level status (Success rate).
    2. List the missing units clearly as "Action Items".
    3. Suggest next steps (e.g., check GPS logs, contact dispatch).
    4. Keep the tone operational and direct.
    
    Format the output in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI report. Please check your API key and connection.";
  }
};