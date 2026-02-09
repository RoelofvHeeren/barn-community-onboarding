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
        reason: "The perfect hybrid of strength and hypertrophy training. This 4-day split focuses on the big three lifts while adding accessory work to build muscle."
      },
      {
        program: "Hybrid Athlete",
        slug: "hybrid-athlete",
        score: 85,
        reason: "Great for building strength, but includes more conditioning than you might need right now."
      },
      {
        program: "Functional Bodybuilding",
        slug: "functional-bodybuilding",
        score: 80,
        reason: "Focuses on movement quality and aesthetics, a strong runner-up."
      },
      {
        program: "CrossFit",
        slug: "crossfit",
        score: 75,
        reason: "High intensity functional movement, if you want more variety."
      },
      {
        program: "Kettlebell Program",
        slug: "kettlebell-program",
        score: 70,
        reason: "Great for home workouts or minimal equipment."
      },
      {
        program: "Running Program",
        slug: "running-program",
        score: 65,
        reason: "Pure endurance focus if you want to shift gears."
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
