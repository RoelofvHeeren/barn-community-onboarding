const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PROGRAMS = [
    {
        name: "Power Building",
        description: "Focus on getting stronger in big lifts (Squat, Bench, Deadlift) while building muscle size. Ideal for strength and physique.",
        slug: "power_building"
    },
    {
        name: "Hybrid Athlete",
        description: "Blends strength training with conditioning. Build muscle and real fitness simultaneously. Lifts + Cardio.",
        slug: "hybrid_athlete"
    },
    {
        name: "Kettlebell Program",
        description: "Functional training using kettlebells. Builds power, strength, and conditioning with minimal equipment.",
        slug: "kettlebell_program"
    },
    {
        name: "Running Program",
        description: "Structured running sessions plus strength work to prevent injury and improve pace/endurance.",
        slug: "running_program"
    },
    {
        name: "Bodyweight Program",
        description: "Build strength and control using just bodyweight. No equipment required. Train anywhere.",
        slug: "bodyweight_program"
    },
    {
        name: "Functional Bodybuilding",
        description: "Traditional lifting mixed with functional movements. Look good, move well, feel athletic.",
        slug: "functional_bodybuilding"
    },
    {
        name: "Athlete Program",
        description: "Advanced performance training. Power, speed, agility, and strength. For those wanting to train like an athlete.",
        slug: "athlete_program"
    },
    {
        name: "Sculpted and Toned",
        description: "Smart strength training for muscle definition and tone without 'bulking'. sustainable and balanced.",
        slug: "sculpted_toned"
    }
];

export const analyzeProfile = async (answers) => {
    console.log("Analyzing answers with Gemini:", answers);

    const prompt = `
    You are an expert fitness coach for 'Barn Community'. 
    Analyze the following user profile based on their answers to onboarding questions:
    ${JSON.stringify(answers, null, 2)}

    We have 8 specific programs:
    ${JSON.stringify(PROGRAMS.map(p => ({ name: p.name, description: p.description })), null, 2)}

    Task:
    1. Score the user's fit for EACH of the 8 programs on a scale of 0-100.
    2. Write a brief 2-sentence summary of the user's profile and why the top program is the best fit.
    3. For the top 3 programs, provide a short 1-sentence "Why this fits" reason.

    Output STRICT JSON format:
    {
      "summary": "...",
      "scores": [
        { "program": "Program Name", "slug": "program_slug", "score": 95, "reason": "..." }
      ]
    }
    ENSURE 'slug' matches the program slug exactly from the list provided.
  `;

    try {
        // Using gemini-1.5-flash for better stability and speed
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

        // Ensure slugs are correct if AI missed them (fallback)
        result.scores = result.scores.map(s => {
            const prog = PROGRAMS.find(p => p.name === s.program);
            return { ...s, slug: prog ? prog.slug : s.slug };
        });

        return result;

    } catch (error) {
        console.error("Gemini API Error:", error);
        // Fallback Mock if API fails
        const errorMessage = error.message || "Unknown Error";
        return {
            summary: `We encountered a technical issue analyzing your profile, but here are our general recommendations based on your input.`,
            scores: PROGRAMS.map((p, i) => ({
                program: p.name,
                slug: p.slug,
                score: 95 - (i * 5),
                reason: "Recommended based on general fitness principles."
            }))
        };
    }
};
