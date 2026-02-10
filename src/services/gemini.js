const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const PROGRAMS = [
    {
        name: "Power Building",
        description: "Build serious strength while adding muscle. Power Building focuses on progressing the big lifts while still training for size and power. Ideal if you want to look strong and be genuinely strong.\n\nWhat it focuses on:\n- Squat, bench, and deadlift progression\n- Strength with added hypertrophy\n- Clear structure and weekly progression",
        slug: "power-building",
        tagline: "Train for performance, not just aesthetics.",
        specs: {
            frequency: "4 days/week",
            duration: "60-75 mins",
            intensity: "High",
            focus: "Strength & Size"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Strength and conditioning combined",
            "Built for advanced athletes"
        ]
    },
    {
        name: "Hybrid Athlete",
        description: "Get strong, fit, and athletic at the same time. Hybrid Athlete combines structured strength training with conditioning so you don’t have to choose between lifting and fitness.\n\nWhat it focuses on:\n- Strength and conditioning combined\n- Athletic performance and endurance\n- Balanced, all-round training",
        slug: "hybrid-athlete",
        tagline: "Train like an athlete, not just a gym-goer.",
        specs: {
            frequency: "3-4 days/week",
            duration: "45-60 mins",
            intensity: "Moderate-High",
            focus: "Endurance & Power"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Improves performance and fitness",
            "Includes performance and fitness"
        ]
    },
    {
        name: "Kettlebell Program",
        description: "Build a strong, functional body with minimal equipment. This program uses kettlebells to develop strength, power, muscle, and conditioning, perfect for home or gym training.\n\nWhat it focuses on:\n- Full body functional strength\n- Power and conditioning\n- Simple but effective training",
        slug: "kettlebell-program",
        tagline: "Train for performance, not just aesthetics.",
        specs: {
            frequency: "3-4 days/week",
            duration: "30-45 mins",
            intensity: "High",
            focus: "Functional Strength"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Strength and conditioning combined",
            "Builds power and conditioning"
        ]
    },
    {
        name: "Running Program",
        description: "Run faster, feel fitter, and train with purpose. The Running Program gives you structured weekly runs plus strength work to improve performance and reduce injury risk.\n\nWhat it focuses on:\n- Structured run sessions\n- Strength for runners\n- Improved pace and endurance",
        slug: "running-program",
        tagline: "Take your running seriously with structure and support.",
        specs: {
            frequency: "3-5 days/week",
            duration: "30-90 mins",
            intensity: "Varied",
            focus: "Endurance & Speed"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Strength and conditioning combined",
            "Improve pace, fitness, and endurance"
        ]
    },
    {
        name: "Bodyweight Program",
        description: "Get in great shape without a gym. This program uses bodyweight training to build strength, control, and conditioning using just your own body.\n\nWhat it focuses on:\n- No equipment needed\n- Full body strength and conditioning\n- Train anywhere, anytime",
        slug: "bodyweight",
        tagline: "Train for performance, not just aesthetics.",
        specs: {
            frequency: "3-5 days/week",
            duration: "20-40 mins",
            intensity: "High",
            focus: "Body Control"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Strength and conditioning combined",
            "Train anywhere, anytime"
        ]
    },
    {
        name: "Functional Bodybuilding",
        description: "Build muscle that actually performs. Functional Bodybuilding combines traditional lifting with functional movements so you look good and move well.\n\nWhat it focuses on:\n- Muscle building with purpose\n- Barbells, dumbbells, and kettlebells\n- Strength that carries into daily life",
        slug: "functional-bodybuilding",
        tagline: "Train for performance, not just aesthetics.",
        specs: {
            frequency: "3 days/week",
            duration: "45 mins",
            intensity: "Moderate",
            focus: "Mobility & Strength"
        },
        bullets: [
            "Muscle building with purpose",
            "Kettlebells, barbells, and dumbbells",
            "Strength that transfers to real life"
        ]
    },
    {
        name: "Athlete Program",
        description: "Train for performance, not just aesthetics. Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning.\n\nWhat it focuses on:\n- Power, speed, and agility\n- High-level strength training\n- Athletic performance development",
        slug: "athlete-program",
        tagline: "Train for performance, not just aesthetics.",
        specs: {
            frequency: "4 days/week",
            duration: "60-75 mins",
            intensity: "High",
            focus: "Strength & Conditioning"
        },
        bullets: [
            "Power, speed, and agility focus",
            "High-level strength training",
            "Athletic performance development"
        ]
    },
    {
        name: "Sculpted and Toned",
        description: "Build a lean, confident physique without extremes. This program focuses on smart strength training to improve muscle definition, tone, and overall shape.\n\nWhat it focuses on:\n- Lean muscle and definition\n- Full body toning\n- Sustainable, balanced training",
        slug: "sculpt-tone",
        tagline: "Build a lean, confident physique without extremes.",
        specs: {
            frequency: "4 days/week",
            duration: "45-60 mins",
            intensity: "Moderate",
            focus: "Definition & Tone"
        },
        bullets: [
            "Power, speed, and agility focus",
            "Strength and conditioning combined",
            "Sustainable and balanced training"
        ]
    },

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
        // Using gemini-2.0-flash for better stability and speed
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
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

        // Ensure slugs are correct and merge rich defaults if AI missed them
        result.scores = result.scores.map(s => {
            const prog = PROGRAMS.find(p => p.name === s.program);
            return {
                ...s,
                slug: prog ? prog.slug : s.slug,
                // Fallback to default rich data if AI didn't generate it or generated it poorly
                specs: s.specs || (prog ? prog.specs : undefined),
                bullets: s.bullets || (prog ? prog.bullets : undefined),
                tagline: s.tagline || (prog ? prog.tagline : undefined)
            };
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
                reason: "Recommended based on general fitness principles.",
                specs: p.specs,
                bullets: p.bullets,
                tagline: p.tagline
            }))
        };
    }
};
