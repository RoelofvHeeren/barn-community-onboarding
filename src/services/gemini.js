const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PROGRAMS = [
    "Fat Loss",
    "Build Muscle",
    "Running Performance",
    "Hormone Regulation",
    "General Lifestyle"
];

export const analyzeProfile = async (answers) => {
    console.log("Analyzing answers with Gemini:", answers);

    const prompt = `
    You are an expert fitness coach for 'Barn Community'. 
    Analyze the following user profile based on their answers to onboarding questions:
    ${JSON.stringify(answers, null, 2)}

    We have 5 programs:
    ${PROGRAMS.join(', ')}

    Task:
    1. Score the user's fit for EACH program on a scale of 0-100.
    2. Write a brief 2-sentence summary of the user's profile.

    Output STRICT JSON format:
    {
      "summary": "...",
      "scores": [
        { "program": "Program Name", "score": 95, "reason": "..." }
      ]
    }
  `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const resultText = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(resultText);

        // Sort scores descending
        result.scores.sort((a, b) => b.score - a.score);

        return result;

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Fallback Mock if API fails
        return {
            summary: "Could not analyze profile. Defaulting to Lifestyle.",
            scores: PROGRAMS.map(p => ({ program: p, score: 50, reason: "Unable to generate specific recommendation at this time." }))
        };
    }
};
