// Mapping from internal 'slug' (from frontend/Gemini) to Trainerize Program IDs
const PROGRAM_MAPPING = {
    'bodyweight': '4681412', // Frontend: 'bodyweight'
    'functional-bodybuilding': '4681634', // Frontend: 'functional-bodybuilding'
    'hybrid-athlete': '4857071', // Frontend: 'hybrid-athlete'
    'power-building': '4835328', // Frontend: 'power-building'
    'athlete-program': '4854181', // Legacy? Kept just in case
    'running-program': '4834319', // Frontend: 'running-program'
    '7-day-challenge': '4802280',
    // 'kettlebell-program': 'TODO', // Frontend: 'kettlebell-program'
    // 'sculpt-tone': 'TODO'         // Frontend: 'sculpt-tone'
};

module.exports = PROGRAM_MAPPING;
