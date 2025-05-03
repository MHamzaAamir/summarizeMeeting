import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.API_KEY });

export const handler = async (event) => {

    try {
        if (!event.body) {
            throw new Error("No data provided")
        }

        const jsonData = JSON.parse(event.body);
        
        const prompt = createPromptFromJSON(jsonData);
        
        const summary = await getGroqSummary(prompt);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Data processed successfully',
                response: summary,
            })
        };

    } catch (error) {

        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};

function createPromptFromJSON(jsonData) {
    return `
      I have the following data from a meeting transcript (in JSON format). Please summarize the key points in 3 sentences:
      ${JSON.stringify(jsonData)}
    `;
}

async function getGroqSummary(prompt) {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a meeting summary agent. You should summarize the key points in the provided meeting data."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" }
    });
    
    try {
        return JSON.parse(chatCompletion.choices[0]?.message?.content || '{}');
    } catch (e) {
        console.error('Failed to parse Groq response:', e);
        return { error: 'Failed to parse AI response' };
    }
}
