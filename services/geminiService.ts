import { GoogleGenAI } from "@google/genai";

/**
 * Generates global business insights by analyzing the entire application state.
 */
export const getBusinessInsights = async (data: any, language: 'fr' | 'ar') => {
  // Client creation inside the function to ensure process.env.API_KEY is accessed in the correct scope
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemContext = `You are a world-class Business Intelligence consultant for a car rental agency. 
    Analyze the provided raw data (Fleet, Reservations, Expenses, Maintenance) and provide a professional, logical, and actionable report. 
    Identify trends, financial leaks, and optimization opportunities.`;

  const dataSummary = `
    Total Fleet: ${data.properties.length} vehicles.
    Total Clients: ${data.clients.length}.
    Total Reservations: ${data.reservations.length}.
    Total Maintenance Logs: ${data.maintenance.length}.
    Total Agency Expenses: ${data.expenses.length}.
    Calculated Revenue: ${data.stats.totalRevenue} DA.
    Calculated Costs: ${data.stats.totalCosts} DA.
    Net Profit: ${data.stats.netProfit} DA.
  `;

  const prompt = language === 'fr' 
    ? `Analyse cet ensemble de données complet d'une agence de location de voitures et génère un rapport stratégique détaillé. 
       Inclus: 1. État de santé financier. 2. Performance de la flotte (rentabilité par unité). 3. Efficacité opérationnelle (maintenance vs revenus). 4. Recommandations stratégiques concrètes.
       Données de l'agence: ${dataSummary}. 
       Réponds en français avec un ton professionnel et structure le texte avec des titres clairs.`
    : `قم بتحليل مجموعة البيانات الشاملة هذه لوكالة تأجير سيارات وقم بإنشاء تقرير استراتيجي مفصل.
       يتضمن: 1. الحالة المالية العامة. 2. أداء الأسطول (الربحية لكل مركبة). 3. الكفاءة التشغيلية (الصيانة مقابل الإيرادات). 4. توصيات استراتيجية ملموسة.
       بيانات الوكالة: ${dataSummary}.
       أجب باللغة العربية بنبرة احترافية وقم بتنظيم النص بعناوين واضحة.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for complex data analysis
      contents: prompt,
      config: {
        systemInstruction: systemContext,
        temperature: 0.7,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Global Error:", error);
    return language === 'fr' ? "Erreur lors de l'analyse stratégique." : "خطأ في التحليل الاستراتيجي.";
  }
};