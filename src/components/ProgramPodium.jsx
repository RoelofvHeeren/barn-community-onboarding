import React, { useState } from 'react';

const Modal = ({ program, onClose }) => {
    if (!program) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box fade-in-up" onClick={e => e.stopPropagation()}>
                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >✕</button>

                <div className="modal-image-container">
                    <img
                        src={`/programs/${program.slug || 'placeholder'}.png`}
                        alt={program.program}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                        }}
                    />
                </div>

                <h3 className="modal-program-title">{program.program}</h3>

                <div className="modal-tags">
                    <div className="modal-match-badge">{program.score}% Match</div>
                </div>

                <p className="modal-description">
                    {program.reason}
                </p>

                <button
                    className="btn-primary modal-close-action"
                    onClick={onClose}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

const ProgramPodium = ({ recommendations, user }) => {
    const [modalProgram, setModalProgram] = useState(null);
    const sortedPrograms = recommendations.scores;
    const winner = sortedPrograms[0];
    const runnersUp = sortedPrograms.slice(1);

    return (
        <div className="podium-container">

            {/* Header / Summary */}
            <div className="podium-header fade-in-up">
                <h2 className="podium-title">Your Perfect Match</h2>
                <p className="podium-subtitle">
                    {recommendations.summary}
                </p>
            </div>

            {/* Winner Hero Section */}
            <div className="winner-card fade-in-up">
                {/* Image Side */}
                <div className="winner-image-container">
                    <img
                        src={`/programs/${winner.slug}.png`}
                        alt={winner.program}
                        className="winner-image"
                    />
                    <div className="recommendation-badge">
                        #1 Recommended
                    </div>
                </div>

                {/* Content Side */}
                <div className="winner-content">
                    <div className="match-score-large">
                        {winner.score}%
                    </div>
                    <div className="match-label">Match Score</div>

                    <h3 className="winner-program-name">{winner.program}</h3>

                    <p className="winner-description">{winner.reason}</p>

                    <button
                        className="btn-primary cta-button-large"
                        onClick={() => {
                            // Direct redirect as requested by user
                            window.location.href = 'https://barn-community-f2a4b1.circle.so/checkout/barn-community-silver-membership';

                            /* Previous Logic (Trainerize Integration) - Kept for reference but bypassed
                            try {
                                const response = await fetch('/api/create-checkout-session', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        priceId: 'price_123456789', // Placeholder
                                        successUrl: window.location.origin + '?success=true',
                                        cancelUrl: window.location.origin,
                                        userEmail: user?.email || 'test@example.com',
                                        firstName: user?.firstName,
                                        lastName: user?.lastName,
                                        phone: user?.phone,
                                        programSlug: winner.slug
                                    })
                                });
                                const data = await response.json();
                                if (data.url) window.location.href = data.url;
                            } catch (error) {
                                console.error('Checkout error:', error);
                                alert('Something went wrong initiating checkout.');
                            }
                            */
                        }}
                    >
                        Start 7-Day Free Trial
                    </button>
                </div>
            </div>

            {/* Other Options Grid */}
            <div>
                <h3 className="runners-up-title">Other Potential Matches</h3>

                <div className="runners-up-grid">
                    {runnersUp.map((program) => (
                        <div
                            key={program.program}
                            onClick={() => setModalProgram(program)}
                            className="glass-card runner-up-card"
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div className="runner-up-image-container">
                                <img
                                    src={`/programs/${program.slug || 'placeholder'}.png`}
                                    alt={program.program}
                                    className="runner-up-image"
                                />
                                <div className="runner-up-match-badge">
                                    {program.score}% Match
                                </div>
                            </div>
                            <div className="runner-up-content">
                                <h4 className="runner-up-title">{program.program}</h4>
                                <div className="read-more-link">
                                    Read more →
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {modalProgram && (
                <Modal
                    program={modalProgram}
                    onClose={() => setModalProgram(null)}
                />
            )}

            <style>{`
                @media (max-width: 900px) {
                    .glass-card {
                        grid-template-columns: 1fr !important;
                    }
                    .glass-card > div:first-child {
                        height: 300px;
                    }
                    .glass-card > div:last-child {
                        padding: 32px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProgramPodium;
