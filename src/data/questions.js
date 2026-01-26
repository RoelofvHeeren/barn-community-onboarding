export const questions = [
    {
        id: 'goal',
        text: "What is your primary fitness goal?",
        options: [
            { label: "Lose Body Fat & Get Lean", value: "fat_loss" },
            { label: "Build Muscle & Size", value: "hypertrophy" },
            { label: "Build Raw Strength", value: "strength" },
            { label: "Improve Athletic Performance", value: "athletic" },
            { label: "Run Faster & Further", value: "running" },
            { label: "Functional Health & Longevity", value: "health" }
        ]
    },
    {
        id: 'gender',
        text: "Which best describes you?",
        options: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" }
        ]
    },
    {
        id: 'age',
        text: "What is your age range?",
        options: [
            { label: "Under 20", value: "u20" },
            { label: "20-29", value: "20s" },
            { label: "30-39", value: "30s" },
            { label: "40-49", value: "40s" },
            { label: "50+", value: "50+" }
        ]
    },
    {
        id: 'environment',
        text: "Where will you be training?",
        options: [
            { label: "Commercial Gym (Fully Equipped)", value: "gym" },
            { label: "Home Gym (Barbell + Rack)", value: "home_gym" },
            { label: "Home (Dumbbells/Kettlebells only)", value: "home_limited" },
            { label: "Home (Bodyweight only)", value: "bodyweight" },
            { label: "Outdoors / Running", value: "outdoors" }
        ]
    },
    {
        id: 'experience',
        text: "How much training experience do you have?",
        options: [
            { label: "Beginner (0-1 years)", value: "beginner" },
            { label: "Intermediate (1-3 years)", value: "intermediate" },
            { label: "Advanced (3+ years)", value: "advanced" }
        ]
    },
    {
        id: 'frequency',
        text: "How many days per week can you realistically train?",
        options: [
            { label: "2-3 days", value: "low" },
            { label: "3-4 days", value: "moderate" },
            { label: "4-5 days", value: "high" },
            { label: "6+ days", value: "athlete" }
        ]
    },
    {
        id: 'duration',
        text: "How much time do you have per session?",
        options: [
            { label: "30-45 minutes", value: "short" },
            { label: "45-60 minutes", value: "medium" },
            { label: "60-90 minutes", value: "long" },
            { label: "90+ minutes", value: "extra_long" }
        ]
    },
    {
        id: 'cardio',
        text: "How do you feel about cardio/running?",
        options: [
            { label: "I love it, I want a lot of it", value: "high_cardio" },
            { label: "I don't mind it mixed in", value: "mixed_cardio" },
            { label: "I prefer conditioning circuits (Metcons)", value: "metcon" },
            { label: "I hate it, keep it to a minimum", value: "low_cardio" }
        ]
    },
    {
        id: 'equipment',
        text: "Which equipment do you have access to? (Select best fit)",
        options: [
            { label: "Full Gym (Barbells, Machines, DBs)", value: "full" },
            { label: "Kettlebells Mainly", value: "kettlebell" },
            { label: "Barbell & Plates only", value: "barbell" },
            { label: "Just my bodyweight", value: "none" }
        ]
    },
    {
        id: 'limitations',
        text: "Do you have any injuries or limitations?",
        options: [
            { label: "None, I'm good to go", value: "none" },
            { label: "Lower Body / Knee Issues", value: "knee" },
            { label: "Upper Body / Shoulder Issues", value: "shoulder" },
            { label: "Back Issues", value: "back" }
        ]
    }
];
