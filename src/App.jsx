import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import LeadCapture from './components/LeadCapture';
import ProgramPodium from './components/ProgramPodium';
import PaymentSuccess from './components/PaymentSuccess';
import { questions } from './data/questions';
import { analyzeProfile } from './services/gemini';
import { createContact } from './services/ghl';

function App() {
  const [step, setStep] = useState('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  // Mock data for preview
  const MOCK_RESULTS = {
    summary: "Based on your goal to build strength and size while maintaining athleticism, we've found your perfect match.",
    scores: [
      {
        program: "Power Building",
        slug: "power-building",
        score: 95,
        tagline: "Train for performance, not just aesthetics.",
        reason: "Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning. This is high level training that turns you into a weapon.",
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
        program: "Hybrid Athlete",
        slug: "hybrid-athlete",
        score: 85,
        tagline: "Train like an athlete, not just a gym-goer.",
        reason: "Hybrid Athlete blends strength training with conditioning so you build muscle and real fitness at the same time. No choosing between lifting and cardio.",
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
        program: "Functional Bodybuilding",
        slug: "functional-bodybuilding",
        score: 80,
        tagline: "Train for performance, not just aesthetics.",
        reason: "Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning. This is high level training that turns you into a weapon.",
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
        program: "Sculpt & Tone",
        slug: "sculpt-tone",
        score: 78,
        tagline: "Build a lean, confident physique without extremes.",
        reason: "This program focuses on smart strength training to improve muscle definition, tone, and overall shape. No crazy diets, no endless cardio.",
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
        program: "Kettlebell Program",
        slug: "kettlebell-program",
        score: 70,
        tagline: "Train for performance, not just aesthetics.",
        reason: "Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning. This is high level training that turns you into a weapon.",
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
        program: "Running Program",
        slug: "running-program",
        score: 65,
        tagline: "Take your running seriously with structure and support.",
        reason: "This program gives you clear running sessions plus strength work to help you get faster, fitter, and more resilient. No more random runs with no progress.",
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
        program: "Bodyweight",
        slug: "bodyweight",
        score: 60,
        tagline: "Train for performance, not just aesthetics.",
        reason: "Designed for advanced trainees who want to improve power, speed, agility, strength, and conditioning. This is high level training that turns you into a weapon.",
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
      }
    ]
  };

  useEffect(() => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Payment Success
    if (urlParams.get('success') === 'true') {
      setStep('payment_success');
      return;
    }

    // Design Preview Mode
    if (urlParams.get('preview') === 'true') {
      setRecommendations(MOCK_RESULTS);
      setUser({ firstName: 'Guest', email: 'guest@example.com' });
      setStep('results');
    }
  }, []);

  const startJourney = () => setStep('lead_capture');

  const handleLeadCapture = (userData) => {
    setUser(userData);
    setStep('questions');
  };

  const handleNext = (option) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.id]: option.label };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      processResults(newAnswers, user);
    }
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const processResults = async (finalAnswers, userData) => {
    setStep('analyzing');
    try {
      // Parallel AI analysis and GHL sync
      const [result] = await Promise.all([
        analyzeProfile(finalAnswers),
        createContact({ ...userData, answers: finalAnswers })
      ]);
      setRecommendations(result);
      setTimeout(() => setStep('results'), 1500);
    } catch (err) {
      console.error(err);
      setTimeout(() => setStep('results'), 1500);
    }
  };

  return (
    <Layout>
      {step === 'welcome' && (
        <div className="glass-card fade-in-up" style={{
          padding: '64px',
          textAlign: 'center',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '42px',
            lineHeight: '1.2',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            marginBottom: '24px'
          }}>
            Find Your Perfect Program
          </h1>

          <p style={{
            fontSize: '18px',
            lineHeight: '28px',
            fontWeight: 300,
            color: 'var(--color-text-secondary)',
            marginBottom: '64px'
          }}>
            Answer a few questions to get your personalized fitness plan
          </p>

          <button
            onClick={startJourney}
            className="btn-primary"
            style={{
              height: '56px',
              width: '200px'
            }}
          >
            Get Started
          </button>
        </div>
      )}

      {step === 'lead_capture' && (
        <LeadCapture onNext={handleLeadCapture} />
      )}

      {step === 'questions' && (
        <div style={{ width: '100%' }} className="fade-in-up">
          <ProgressBar current={currentQuestionIndex + 1} total={questions.length} />
          <QuestionCard
            question={questions[currentQuestionIndex]}
            onNext={handleNext}
            onBack={handleBack}
            canGoBack={currentQuestionIndex > 0}
            userName={user?.firstName}
            showGreeting={currentQuestionIndex === 0}
          />
        </div>
      )}

      {step === 'analyzing' && (
        <div className="glass-card fade-in-up" style={{
          padding: '64px',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 32px',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid var(--color-primary)',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>

          <h2 style={{
            fontSize: '32px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 400,
            marginBottom: '16px'
          }}>
            Analyzing Your Profile
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--color-text-primary)',
            fontStyle: 'italic'
          }}>
            Creating your personalized plan...
          </p>
        </div>
      )}

      {step === 'results' && recommendations && (
        <div style={{ width: '100%' }}>
          <ProgramPodium recommendations={recommendations} user={user} />
        </div>
      )}

      {step === 'payment_success' && (
        <PaymentSuccess />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}

export default App;
