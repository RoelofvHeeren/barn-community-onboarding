import React, { useState } from 'react';
import Layout from './components/Layout';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import LeadCapture from './components/LeadCapture';
import ProgramPodium from './components/ProgramPodium';
import { questions } from './data/questions';
import { analyzeProfile } from './services/gemini';
import { createContact } from './services/ghl';

function App() {
  const [step, setStep] = useState('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

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
            fontSize: '56px',
            lineHeight: '64px',
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
            Answer 4 questions to get your personalized fitness plan
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
          <ProgramPodium recommendations={recommendations} />
        </div>
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
