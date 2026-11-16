
require('dotenv').config();

const testGemini = async () => {
  try {
    const { GoogleGenAI } = await import('@google/genai');

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        timeout: 120000,
        retryOptions: {
          attempts: 1
        }
      }
    });

    console.log('Testing Gemini 3.5 Flash Lite...');
    console.log('Using the Interactions API...');

    const response = await ai.interactions.create({
      model: 'gemini-3.5-flash-lite',
      input: 'Reply with exactly: DebateAI is ready.'
    });

    console.log('\nInteraction status:', response.status);
    console.log('\nGenerated text:', response.output_text);

    if (response.output_text) {
      console.log('\nGemini test successful!');
    } else {
      console.log('\nNo text returned. Full response:');
      console.dir(response, { depth: 6 });
    }

  } catch (error) {
    console.error('\nGemini test failed:', error.message);
    console.error('Status:', error.status || 'Unknown');
  }
};

testGemini();
