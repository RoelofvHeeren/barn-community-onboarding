export const questions = [
    {
        id: 'goal',
        text: "What is your primary fitness goal?",
        options: [
            { label: "Lose Fat & Weight", value: "fat_loss" },
            { label: "Build Muscle & Strength", value: "muscle" },
            { label: "Improve Running Performance", value: "running" },
            { label: "Optimize Hormone Regulation", value: "hormone" },
            { label: "General Lifestyle & Health", value: "lifestyle" }
        ]
    },
    {
        id: 'experience',
        text: "How would you describe your training experience?",
        options: [
            { label: "Beginner (New to training)", value: "beginner" },
            { label: "Intermediate (1-3 years)", value: "intermediate" },
            { label: "Advanced (3+ years serious)", value: "advanced" }
        ]
    },
    {
        id: 'frequency',
        text: "How many days per week can you dedicate to training?",
        options: [
            { label: "1-2 days", value: "1-2" },
            { label: "3-4 days", value: "3-4" },
            { label: "5+ days", value: "5+" }
        ]
    },
    {
        id: 'challenges',
        text: "What is your biggest obstacle right now?",
        options: [
            { label: "Consistency & Routine", value: "consistency" },
            { label: "Nutrition & Dieting", value: "nutrition" },
            { label: "Lack of a clear plan", value: "planning" },
            { label: "Sustaining Motivation", value: "motivation" }
        ]
    }
];
