
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might show a more user-friendly error.
  // For this context, we assume the API_KEY is set in the environment.
  console.error("Gemini API key not found. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export interface ForecastInput {
  historicalData: { date: string; itemName: string; soldQty: number }[];
  weather: string;
  season: string;
  itemsToForecast: string[];
}

export interface ForecastResult {
  itemName: string;
  predictedDemand: number;
  unit: string;
  justification: string;
}

export const getDemandForecast = async (
  input: ForecastInput
): Promise<ForecastResult[]> => {
  try {
    const prompt = `
      You are a demand forecasting expert for a perishable goods business in India.
      Analyze the following historical sales data, weather conditions, and seasonality to predict demand for the given items.
      Provide a justification for each prediction.

      Historical Sales Data:
      ${JSON.stringify(input.historicalData, null, 2)}

      Current Conditions:
      - Weather: ${input.weather}
      - Season: ${input.season}

      Items to Forecast:
      ${input.itemsToForecast.join(', ')}

      Provide the forecast in a structured JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              predictedDemand: { type: Type.NUMBER },
              unit: { type: Type.STRING, description: "e.g., kg, box, piece" },
              justification: { type: Type.STRING },
            },
            required: ["itemName", "predictedDemand", "unit", "justification"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const forecast = JSON.parse(jsonText);
    return forecast as ForecastResult[];

  } catch (error) {
    console.error("Error fetching demand forecast:", error);
    throw new Error("Failed to generate demand forecast.");
  }
};
