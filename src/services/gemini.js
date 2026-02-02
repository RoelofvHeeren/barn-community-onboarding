const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PROGRAMS = [
    {
        name: "Power Building",
        description: "Build serious strength while adding muscle. Power Building focuses on progressing the big lifts while still training for size and power. Ideal if you want to look strong and be genuinely strong.\n\nWhat it focuses on:\n- Squat, bench, and deadlift progression\n- Strength with added hypertrophy\n- Clear structure and weekly progression",
        slug: "power_building"
    },
    {
        name: "Hybrid Athlete",
        description: "Get strong, fit, and athletic at the same time. Hybrid Athlete combines structured strength training with conditioning so you don’t have to choose between lifting and fitness.\n\nWhat it focuses on:\n- Strength and conditioning combined\n- Athletic performance and endurance\n- Balanced, all-round training",
        slug: "hybrid_athlete"
    },
    {
        name: "Kettlebell Program",
        description: "Build a strong, functional body with minimal equipment. This program uses kettlebells to develop strength, power, muscle, and conditioning, perfect for home or gym training.\n\nWhat it focuses on:\n- Full body functional strength\n- Power and conditioning\n- Simple but effective training",
        slug: "kettlebell_program"
    },
    {
        name: "Running Program",
        description: "Run faster, feel fitter, and train with purpose. The Running Program gives you structured weekly runs plus strength work to improve performance and reduce injury risk.\n\nWhat it focuses on:\n- Structured run sessions\n- Strength for runners\n- Improved pace and endurance",
        slug: "running_program"
    },
    {
        name: "Bodyweight Program",
        description: "Get in great shape without a gym. This program uses bodyweight training to build strength, control, and conditioning using just your own body.\n\nWhat it focuses on:\n- No equipment needed\n- Full body strength and conditioning\n- Train anywhere, anytime",
        slug: "bodyweight_program"
    },
    {
        name: "Functional Bodybuilding",
        description: "Build muscle that actually performs. Functional Bodybuilding combines traditional lifting with functional movements so you look good and move well.\n\nWhat it focuses on:\n- Muscle building with purpose\n- Barbells, dumbbells, and kettlebells\n- Strength that carries into daily life",
        slug: "functional_bodybuilding"
    },
    {
        name: "Athlete Program",
        description: "Train for performance, not just aesthetics. Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning.\n\nWhat it focuses on:\n- Power, speed, and agility\n- High-level strength training\n- Athletic performance development",
        slug: "athlete_program"
    },
    {
        name: "Sculpted and Toned",
        description: "Build a lean, confident physique without extremes. This program focuses on smart strength training to improve muscle definition, tone, and overall shape.\n\nWhat it focuses on:\n- Lean muscle and definition\n- Full body toning\n- Sustainable, balanced training",
        slug: "sculpted_toned"
    },
    {
        name: "7-Day Challenge",
        description: "A perfect introduction to our training style. 7 days of focused workouts to get you moving and building habits.",
        slug: "7_day_challenge"
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
