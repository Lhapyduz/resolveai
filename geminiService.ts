
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "API_KEY for Gemini is not set. AI features will be disabled. " +
    "This is expected in environments where process.env.API_KEY is not provided. " +
    "For local development, ensure API_KEY is in your environment variables (e.g., .env file)."
  );
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const generateServiceDescription = async (
  serviceTitle: string,
  keywords: string[],
  currentDescription?: string
): Promise<string> => {
  if (!ai) {
    console.error("Gemini API key not configured. Cannot generate description.");
    return Promise.resolve(currentDescription || `Descrição otimizada para "${serviceTitle}" com palavras-chave: ${keywords.join(', ')}.`);
  }

  const prompt = `
    Você é um assistente de marketing especializado em criar descrições de serviços atraentes e concisas para uma plataforma de freelancers chamada ResolveAí.
    Gere uma descrição para o seguinte serviço:
    Título do Serviço: "${serviceTitle}"
    Palavras-chave: ${keywords.join(', ')}
    ${currentDescription ? `Descrição Atual (para refinar ou melhorar, se desejar): "${currentDescription}"` : ""}

    A descrição deve:
    - Ser profissional e convidativa.
    - Ter no máximo 2-3 frases curtas.
    - Destacar os benefícios para o cliente.
    - Usar linguagem clara e direta.
    - Incorporar naturalmente as palavras-chave, se possível.
    - Não use markdown, apenas texto simples.
    - Responda em Português do Brasil.

    Exemplo de boa descrição:
    Para "Reparo Rápido de Vazamentos": "Diga adeus aos vazamentos! Soluções rápidas e eficientes para encanamentos, garantindo tranquilidade e evitando desperdícios. Chame agora!"

    Sua tarefa é gerar uma nova descrição otimizada.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17", // Ensure this model is suitable for your use case and region
      contents: prompt,
    });
    
    const text = response.text;
    if (text) {
      return text.trim();
    }
    return "Não foi possível gerar uma descrição no momento.";
  } catch (error) {
    console.error("Error generating service description with Gemini:", error);
    // In a real app, you might want to throw a custom error or handle it more gracefully
    if (error instanceof Error && error.message.includes("API key not valid")) {
        return "Erro: Chave da API Gemini inválida. Verifique suas credenciais.";
    }
    return "Ocorreu um erro ao tentar gerar a descrição. Tente novamente mais tarde.";
  }
};