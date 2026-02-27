import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ProgressBar from './components/ProgressBar';
import QuestionCard from './components/QuestionCard';
import LeadCapture from './components/LeadCapture';
import ProgramPodium from './components/ProgramPodium';
import ProgramSelector from './components/ProgramSelector';
import PaymentSuccess from './components/PaymentSuccess';
import StatsDashboard from './components/StatsDashboard';
import ProgramConfirmation from './components/ProgramConfirmation';
import { questions } from './data/questions';
import { analyzeProfile, PROGRAMS } from './services/gemini';
import { createContact } from './services/ghl';

// ── Embed Helpers ──
function notifyParent(type, data = {}) {
  if (window.parent !== window) {
    window.parent.postMessage({ type, data }, '*');
  }
}

function closeEmbeddedModal() {
  notifyParent('CLOSE_MODAL');
}

// Helper to get cookies safely
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

function App() {
  const [step, setStep] = useState('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [flowType, setFlowType] = useState('quiz'); // 'quiz' or 'manual'
  const [manualProgram, setManualProgram] = useState(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [verificationError, setVerificationError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Tracking Helper
  const trackEvent = async (eventType, eventData = {}) => {
    try {
      await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType,
          eventData,
          url: window.location.href
        })
      });
    } catch (e) {
      console.error("Tracking failed", e);
    }
  };

  useEffect(() => {
    trackEvent('view_welcome');
  }, []);

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
      },
      {
        program: "Female Functional Strength",
        slug: "female-functional",
        score: 55,
        tagline: "Strength training designed for women, by coaches who understand.",
        reason: "A strength and conditioning program built specifically for women. Compound lifts, functional movement, and targeted accessory work for real results.",
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
      }
    ]
  };

  // ── Iframe Embed Detection ──
  useEffect(() => {
    if (window.parent !== window) {
      document.body.classList.add('is-embedded');
      setIsEmbedded(true);
    }
  }, []);

  useEffect(() => {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Payment Success
    if (urlParams.get('success') === 'true') {
      // If we're in an iframe, break out by redirecting the parent
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'PAYMENT_SUCCESS',
          data: { redirectUrl: window.location.href }
        }, '*');
        // Also try to redirect parent directly
        try { window.top.location.href = window.location.href; } catch (e) { /* cross-origin blocked, rely on postMessage */ }
      }
      setStep('payment_success');
      return;
    }

    // Design Preview Mode
    if (urlParams.get('preview') === 'true') {
      setRecommendations(MOCK_RESULTS);
      setUser({ firstName: 'Guest', email: 'guest@example.com' });
      setStep('results');
    }

    // Stats Dashboard Mode (New /reporting route)
    if (window.location.pathname === '/reporting' || urlParams.get('mode') === 'stats') {
      setStep('stats');
      return;
    }

    // Direct Program Flow
    if (window.location.pathname === '/programs' || urlParams.get('flow') === 'direct') {
      setFlowType('direct');
      setStep('program_selection');
      return;
    }
  }, []);

  const startQuiz = () => {
    trackEvent('click_quiz_flow');
    setFlowType('quiz');
    setStep('lead_capture');
  };

  const startManualSelection = () => {
    trackEvent('click_manual_flow');
    setFlowType('manual');
    setStep('program_selection');
  };

  const handleProgramSelect = (program) => {
    trackEvent('select_program_manual', { programSlug: program.slug });
    setManualProgram(program);
    setStep('lead_capture');
  };

  const handleLeadCapture = async (userData) => {
    setIsVerifying(true);
    setVerificationError(null);
    trackEvent('attempt_lead_capture', { flowType, email: userData.email });

    if (flowType === 'direct') {
      setUser(userData);
      setIsVerifying(false);
      setStep('direct_confirmation');
      trackEvent('complete_lead_capture', { flowType, status: 'unverified' });
      return;
    }

    try {
      // 1. Verify Membership via Backend (Stripe)
      const verifyRes = await fetch('/api/verify-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setVerificationError(verifyData.error || "Verification failed. Please check your email.");
        setIsVerifying(false);
        trackEvent('verification_failed', { email: userData.email, error: verifyData.error });
        return;
      }

      // 2. Successful Verification
      setUser({
        ...userData,
        firstName: verifyData.customer?.firstName || userData.firstName,
        lastName: verifyData.customer?.lastName || userData.lastName
      });
      setIsVerifying(false);
      trackEvent('complete_lead_capture', { flowType, status: 'verified' });

      if (flowType === 'manual' && manualProgram) {
        // Direct transition for manual flow
        setStep('results'); // Show them the program they picked
        setRecommendations({
          summary: "Great choice! This program is perfectly suited for your training goals.",
          scores: [manualProgram] // Just show the one they picked
        });
      } else {
        // Quiz flow
        setStep('questions');
      }
    } catch (err) {
      console.error("Lead capture/verification failed", err);
      setVerificationError("Connection error. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleDirectOnboard = async () => {
    trackEvent('attempt_direct_onboard', { programSlug: manualProgram.slug, email: user.email });

    try {
      const res = await fetch('/api/direct-onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          programSlug: manualProgram.slug
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Setup failed. Please try again.");
      }

      trackEvent('complete_direct_onboard', { status: 'success' });
      setStep('direct_success');
    } catch (err) {
      console.error("Direct onboard failed", err);
      throw err;
    }
  };

  const handleNext = (option) => {
    const currentQuestion = questions[currentQuestionIndex];
    trackEvent('view_question', {
      step: currentQuestionIndex + 1,
      questionId: currentQuestion.id,
      answer: option.value
    });

    const newAnswers = { ...answers, [currentQuestion.id]: option.value };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      processResults(newAnswers, user);
    }
  };

  const handleBack = () => {
    trackEvent('click_back', { fromStep: step, currentQuestionIndex });
    if (step === 'program_selection') {
      setStep('welcome');
    } else if (step === 'lead_capture') {
      if (flowType === 'manual' || flowType === 'direct') {
        // If they came from program selection, go back there
        setStep('program_selection');
      } else {
        // For quiz flow, it's welcome -> lead_capture
        setStep('welcome');
      }
    } else if (step === 'direct_confirmation') {
      setStep('lead_capture');
    } else if (step === 'questions') {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      } else {
        // Before questions is lead_capture
        setStep('lead_capture');
      }
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
      trackEvent('view_results', {
        programSlug: result.scores[0].slug,
        programName: result.scores[0].program
      });
      setTimeout(() => setStep('results'), 1500);
    } catch (err) {
      console.error(err);
      setTimeout(() => setStep('results'), 1500);
    }
  };

  // Determine max width based on step
  const getMaxWidth = () => {
    switch (step) {
      case 'program_selection':
      case 'results':
      case 'welcome':
        return '1200px';
      case 'direct_success':
        return '1200px';
      case 'stats':
        return '100%';
      default:
        return '600px';
    }
  };

  return (
    <Layout contentMaxWidth={getMaxWidth()}>
      {/* Embed Close Button — visible only when body.is-embedded via CSS */}
      <button
        id="embed-close-btn"
        onClick={closeEmbeddedModal}
        aria-label="Close"
      >
        ✕
      </button>
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
            Choose how you want to get started
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <button
              onClick={startManualSelection}
              className="btn-secondary"
              style={{
                width: '100%',
                maxWidth: '300px'
              }}
            >
              I know what I want
            </button>

            <button
              onClick={startQuiz}
              className="btn-primary"
              style={{
                width: '100%',
                maxWidth: '300px'
              }}
            >
              Help me find my program
            </button>
          </div>
        </div>
      )}

      {step === 'program_selection' && (
        <ProgramSelector
          programs={PROGRAMS}
          onSelect={handleProgramSelect}
          onBack={handleBack}
        />
      )}

      {step === 'lead_capture' && (
        <LeadCapture
          onNext={handleLeadCapture}
          onBack={handleBack}
          submitLabel={isVerifying ? "Verifying..." : (flowType === 'manual' ? "Continue to Program" : "Begin Assessment")}
          error={verificationError}
          isLoading={isVerifying}
        />
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

      {step === 'direct_confirmation' && (
        <ProgramConfirmation
          program={manualProgram}
          user={user}
          onConfirm={handleDirectOnboard}
          onBack={handleBack}
        />
      )}

      {step === 'direct_success' && (
        <div className="glass-card fade-in-up" style={{
          padding: '64px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            fontSize: '32px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            marginBottom: '16px',
            color: 'var(--color-text-primary)'
          }}>
            Setup Complete!
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.6'
          }}>
            We've successfully set you up. You'll receive an email shortly with your Trainerize login details. Get ready to transform!
          </p>
        </div>
      )}

      {step === 'payment_success' && (
        <PaymentSuccess />
      )}

      {step === 'stats' && (
        <StatsDashboard />
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
