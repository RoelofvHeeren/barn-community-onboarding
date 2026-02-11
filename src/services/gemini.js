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
    {
        name: "Female Functional Strength",
        description: "A strength and conditioning program built specifically for women. Combines compound lifts, functional movement, and targeted accessory work to build real strength, improve body composition, and boost confidence in the gym.\n\nWhat it focuses on:\n- Full body strength with a female-focused approach\n- Functional movements for daily life\n- Balanced programming for longevity and results",
        slug: "female-functional",
        tagline: "Strength training designed for women, by coaches who understand.",
        specs: {
            frequency: "3-4 days/week",
            duration: "45-60 mins",
            intensity: "Moderate-High",
            focus: "Strength & Conditioning"
        },
        bullets: [
            "Built specifically for women",
            "Compound lifts and functional movement",
            "Confidence and strength combined"
        ]
    },

];

const calculateDeterministicScores = (answers) => {
    // Start at 0. Each answer adds points to matching programs.
    let scores = PROGRAMS.map(p => ({
        name: p.name,
        slug: p.slug,
        score: 0,
        reason: "General recommendation.",
        specs: p.specs,
        bullets: p.bullets,
        tagline: p.tagline
    }));

    const { goal, gender, experience, frequency, duration, cardio, equipment, limitations } = answers;

    scores = scores.map(p => {
        let score = 0;
        let reason = "General recommendation.";

        // ═══════════════════════════════════════════
        // GOAL — Heaviest weight (+40 points)
        // ═══════════════════════════════════════════
        if (goal === 'running') {
            if (p.slug === 'running-program') { score += 40; reason = "Perfect match for your running goals."; }
            else if (p.slug === 'hybrid-athlete') { score += 15; }
        }
        else if (goal === 'strength') {
            if (p.slug === 'power-building') { score += 40; reason = "Built for raw strength and progression."; }
            else if (p.slug === 'kettlebell-program') { score += 15; }
            else if (p.slug === 'functional-bodybuilding') { score += 10; }
        }
        else if (goal === 'hypertrophy') {
            if (p.slug === 'power-building') { score += 30; reason = "Combines size and strength training."; }
            else if (p.slug === 'functional-bodybuilding') { score += 35; reason = "Great for building muscle with purpose."; }
            else if (p.slug === 'sculpt-tone') { score += 20; }
            else if (p.slug === 'female-functional') { score += 15; }
        }
        else if (goal === 'athletic') {
            if (p.slug === 'athlete-program') { score += 35; reason = "Built for athletic performance."; }
            else if (p.slug === 'hybrid-athlete') { score += 40; reason = "Strength and conditioning combined."; }
            else if (p.slug === 'female-functional') { score += 10; }
        }
        else if (goal === 'fat_loss') {
            if (p.slug === 'sculpt-tone') { score += 35; reason = "Lean muscle and fat burning focus."; }
            else if (p.slug === 'female-functional') { score += 25; }
            else if (p.slug === 'bodyweight') { score += 25; }
            else if (p.slug === 'hybrid-athlete') { score += 20; }
        }
        else if (goal === 'health') {
            if (p.slug === 'functional-bodybuilding') { score += 30; reason = "Sustainable strength for daily life."; }
            else if (p.slug === 'bodyweight') { score += 30; reason = "Low barrier, great for longevity."; }
            else if (p.slug === 'female-functional') { score += 20; }
            else if (p.slug === 'sculpt-tone') { score += 15; }
        }

        // ═══════════════════════════════════════════
        // GENDER (+10-15 points)
        // ═══════════════════════════════════════════
        if (gender === 'female') {
            if (p.slug === 'female-functional') { score += 25; reason = "Built specifically for women."; }
            if (p.slug === 'sculpt-tone') { score += 15; }
            if (p.slug === 'functional-bodybuilding') { score += 5; }
            if (p.slug === 'bodyweight') { score += 5; }
        }
        else if (gender === 'male') {
            if (p.slug === 'sculpt-tone') { score = 0; reason = "Not recommended for men."; }
            if (p.slug === 'female-functional') { score = 0; reason = "Designed for women."; }
        }

        // ═══════════════════════════════════════════
        // EXPERIENCE (+5-10 points)
        // ═══════════════════════════════════════════
        if (experience === 'beginner') {
            if (p.slug === 'bodyweight') { score += 10; }
            if (p.slug === 'sculpt-tone') { score += 5; }
            if (p.slug === 'kettlebell-program') { score += 5; }
            // Penalize advanced programs
            if (p.slug === 'athlete-program') { score -= 10; }
            if (p.slug === 'power-building') { score -= 5; }
        }
        else if (experience === 'advanced') {
            if (p.slug === 'athlete-program') { score += 10; }
            if (p.slug === 'power-building') { score += 10; }
            if (p.slug === 'hybrid-athlete') { score += 5; }
        }

        // ═══════════════════════════════════════════
        // EQUIPMENT — Hard disqualifiers
        // ═══════════════════════════════════════════
        if (equipment === 'none') {
            if (p.slug === 'bodyweight') { score += 20; }
            else if (p.slug === 'running-program') { score += 5; }
            else {
                score = 0; reason = "Requires equipment you don't have.";
            }
        }
        else if (equipment === 'kettlebell') {
            if (p.slug === 'kettlebell-program') { score += 25; reason = "Matches your kettlebell setup."; }
            else if (p.slug === 'functional-bodybuilding') { score += 10; }
            else if (['power-building', 'athlete-program'].includes(p.slug)) {
                score = Math.max(0, score - 15); // These need barbells
            }
        }
        else if (equipment === 'full' || equipment === 'barbell') {
            if (['power-building', 'functional-bodybuilding', 'hybrid-athlete', 'athlete-program'].includes(p.slug)) {
                score += 5;
            }
        }

        // ═══════════════════════════════════════════
        // CARDIO PREFERENCE — Disqualifiers
        // ═══════════════════════════════════════════
        if (cardio === 'low_cardio') {
            if (p.slug === 'running-program') { score = 0; reason = "You prefer minimal cardio."; }
            if (p.slug === 'hybrid-athlete') { score = Math.max(0, score - 10); }
        }
        else if (cardio === 'high_cardio') {
            if (p.slug === 'running-program') { score += 15; }
            if (p.slug === 'hybrid-athlete') { score += 10; }
        }
        else if (cardio === 'metcon') {
            if (p.slug === 'hybrid-athlete') { score += 10; }
            if (p.slug === 'kettlebell-program') { score += 10; }
        }

        // ═══════════════════════════════════════════
        // INJURIES — Hard disqualifiers
        // ═══════════════════════════════════════════
        if (limitations === 'knee') {
            if (p.slug === 'running-program') { score = 0; reason = "Not safe with knee issues."; }
            if (p.slug === 'hybrid-athlete') { score = Math.max(0, score - 15); }
            if (p.slug === 'athlete-program') { score = Math.max(0, score - 10); }
        }
        if (limitations === 'shoulder') {
            if (p.slug === 'athlete-program') { score = Math.max(0, score - 15); }
            if (p.slug === 'power-building') { score = Math.max(0, score - 10); }
        }
        if (limitations === 'back') {
            if (p.slug === 'power-building') { score = Math.max(0, score - 15); }
            if (p.slug === 'athlete-program') { score = Math.max(0, score - 10); }
            if (p.slug === 'bodyweight') { score += 5; }
        }

        return { ...p, score: Math.min(100, Math.max(0, score)), reason };
    });

    scores.sort((a, b) => b.score - a.score);

    return {
        summary: "Based on your answers, we've matched you with the programs that fit your goals, equipment, and preferences.",
        scores: scores.map(s => ({
            program: s.name,
            slug: s.slug,
            score: s.score,
            reason: s.reason,
            specs: s.specs,
            bullets: s.bullets,
            tagline: s.tagline
        }))
    };
};

// Map answer values to human-readable descriptions for the AI prompt
const ANSWER_KEY_MAP = {
    goal: { running: "Run Faster & Further", fat_loss: "Lose Body Fat & Get Lean", hypertrophy: "Build Muscle & Size", strength: "Build Raw Strength", athletic: "Improve Athletic Performance", health: "Functional Health & Longevity" },
    gender: { male: "Male", female: "Female" },
    experience: { beginner: "Beginner (0-1 years)", intermediate: "Intermediate (1-3 years)", advanced: "Advanced (3+ years)" },
    frequency: { low: "2-3 days/week", moderate: "3-4 days/week", high: "4-5 days/week", athlete: "6+ days/week" },
    duration: { short: "30-45 minutes", medium: "45-60 minutes", long: "60-90 minutes", extra_long: "90+ minutes" },
    cardio: { high_cardio: "Loves cardio/running", mixed_cardio: "Doesn't mind cardio mixed in", metcon: "Prefers conditioning circuits (Metcons)", low_cardio: "Hates cardio, keep it minimal" },
    equipment: { full: "Full Gym (Barbells, Machines, DBs)", kettlebell: "Kettlebells mainly", barbell: "Barbell & Plates only", none: "Bodyweight only, no equipment" },
    limitations: { none: "No injuries", knee: "Lower Body / Knee Issues", shoulder: "Upper Body / Shoulder Issues", back: "Back Issues" }
};

const humanizeAnswers = (answers) => {
    const result = {};
    for (const [key, value] of Object.entries(answers)) {
        result[key] = ANSWER_KEY_MAP[key]?.[value] || value;
    }
    return result;
};

export const analyzeProfile = async (answers) => {
    console.log("Analyzing answers with Gemini:", JSON.stringify(answers, null, 2));

    // Convert machine values to human-readable for the AI
    const readableAnswers = humanizeAnswers(answers);

    const prompt = `
    You are an expert fitness coach for 'Barn Community'.
    A user has completed an onboarding quiz. Here are their answers:
    ${JSON.stringify(readableAnswers, null, 2)}

    CRITICAL RULES for scoring:
    - The user's PRIMARY GOAL is the most important factor. The program that best matches their goal should score highest.
    - If the user's goal is "Run Faster & Further", the Running Program MUST be the top recommendation.
    - If the user's goal is "Build Raw Strength", Power Building MUST be the top recommendation.
    - If the user's goal is "Improve Athletic Performance", Hybrid Athlete or Athlete Program MUST be top.
    - If the user hates cardio, Running Program should score very low (under 20).
    - If the user has knee issues, Running Program should score very low (under 10).
    - If the user has no equipment, programs requiring a gym should score very low.
    - Female users should get a strong boost for Sculpt & Tone AND Female Functional Strength.
    - Male users should NEVER be recommended Sculpt & Tone or Female Functional Strength. These are designed for women. Give them a score under 10 for men.

    Available programs:
    ${JSON.stringify(PROGRAMS.map(p => ({ name: p.name, slug: p.slug, description: p.description })), null, 2)}

    Task:
    1. Score the user's fit for EACH of the 9 programs on a scale of 0-100.
    2. Write a brief 2-sentence summary of the user's profile and why the top program is the best fit.
    3. For each program, provide a short 1-sentence "reason" explaining why it does or doesn't fit.

    Output STRICT JSON format:
    {
      "summary": "...",
      "scores": [
        { "program": "Program Name", "slug": "program-slug", "score": 95, "reason": "..." }
      ]
    }
    ENSURE 'slug' matches the program slug exactly from the list provided.
  `;

    try {
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
            console.error(`Gemini API Error ${response.status}: ${errorText}`);
            console.warn("Falling back to deterministic scoring.");
            return calculateDeterministicScores(answers);
        }

        const data = await response.json();

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) {
            throw new Error("Invalid response format from Gemini");
        }

        const result = JSON.parse(resultText);

        // Sort scores descending
        result.scores.sort((a, b) => b.score - a.score);

        // Ensure slugs are correct and merge rich defaults
        result.scores = result.scores.map(s => {
            const prog = PROGRAMS.find(p => p.name === s.program);
            return {
                ...s,
                slug: prog ? prog.slug : s.slug,
                specs: s.specs || (prog ? prog.specs : undefined),
                bullets: s.bullets || (prog ? prog.bullets : undefined),
                tagline: s.tagline || (prog ? prog.tagline : undefined)
            };
        });

        return result;

    } catch (error) {
        console.error("Gemini API Exception:", error);
        console.warn("Falling back to deterministic scoring.");
        return calculateDeterministicScores(answers);
    }
};
