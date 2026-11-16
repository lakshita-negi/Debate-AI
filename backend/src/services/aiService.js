
const getGeminiClient = async () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }

  const { GoogleGenAI } = await import('@google/genai');

  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,

    httpOptions: {
      timeout: 120000,

      retryOptions: {
        attempts: 1
      }
    }
  });
};

const generateAIResponse = async (prompt) => {
  try {
    console.log('Connecting to Gemini...');

    const ai = await getGeminiClient();

    console.log('Sending prompt to Gemini Interactions API...');

    const response = await ai.interactions.create({
      model: 'gemini-3.5-flash-lite',
      input: prompt
    });

    console.log('Gemini interaction status:', response.status);

    const generatedText = response.output_text;

    if (!generatedText || !generatedText.trim()) {
      throw new Error('Gemini returned an empty response.');
    }

    console.log('Gemini response received successfully.');

    return generatedText;

  } catch (error) {
    console.error('Gemini API error:', error.message);

    throw new Error(
      error.message || 'Unable to generate an AI response.'
    );
  }
};

module.exports = {
  generateAIResponse
};
