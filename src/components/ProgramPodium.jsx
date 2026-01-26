import React, { useState } from 'react';

const Modal = ({ program, onClose }) => {
    if (!program) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(5px)'
        }}>
            <div className="modal-content fade-in-up" onClick={e => e.stopPropagation()} style={{
                background: 'white',
                borderRadius: '24px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: 'var(--color-text-tertiary)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                >✕</button>

                <div style={{
                    width: '100%',
                    height: '200px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    marginBottom: '24px'
                }}>
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

                <h3 style={{
                    fontSize: '32px',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-text-primary)',
                    marginBottom: '8px',
                    lineHeight: '1.2'
                }}>{program.program}</h3>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '6px 16px',
                        borderRadius: '100px',
                        fontWeight: 700,
                        fontSize: '14px'
                    }}>{program.score}% Match</div>
                </div>

                <p style={{
                    fontSize: '18px',
                    lineHeight: '1.6',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '32px'
                }}>
                    {program.reason}
                </p>

                <button
                    className="btn-primary"
                    onClick={onClose}
                    style={{ width: '100%', height: '56px', fontSize: '18px' }}
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
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px' }}>

            {/* Header / Summary */}
            <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '900px', margin: '0 auto 64px' }} className="fade-in-up">
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'min(56px, 12vw)',
                    lineHeight: '1.1',
                    marginBottom: '24px',
                    color: 'var(--color-text-primary)'
                }}>Your Perfect Match</h2>
                <p style={{
                    fontSize: '20px',
                    lineHeight: '32px',
                    color: 'var(--color-text-secondary)',
                    fontWeight: 400
                }}>
                    {recommendations.summary}
                </p>
            </div>

            {/* Winner Hero Section */}
            <div className="glass-card fade-in-up" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                padding: '0',
                overflow: 'hidden',
                backgroundColor: 'white',
                border: '1px solid var(--color-border)',
                marginBottom: '80px',
                minHeight: '500px'
            }}>
                {/* Image Side */}
                <div style={{ position: 'relative', height: '100%', minHeight: '300px' }}>
                    <img
                        src={`/programs/${winner.slug}.png`}
                        alt={winner.program}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            position: 'absolute',
                            inset: 0
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '8px 20px',
                        borderRadius: '100px',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}>
                        #1 Recommended
                    </div>
                </div>

                {/* Content Side */}
                <div style={{
                    padding: '64px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        fontSize: '80px',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 800,
                        color: 'var(--color-primary)',
                        lineHeight: 1,
                        marginBottom: '8px'
                    }}>
                        {winner.score}%
                    </div>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: 'var(--color-text-tertiary)',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '32px'
                    }}>Match Score</div>

                    <h3 style={{
                        fontSize: '48px',
                        fontFamily: 'var(--font-heading)',
                        marginBottom: '24px',
                        lineHeight: 1.1,
                        color: 'var(--color-text-primary)'
                    }}>{winner.program}</h3>

                    <p style={{
                        fontSize: '18px',
                        lineHeight: '1.6',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '40px'
                    }}>{winner.reason}</p>

                    <button
                        className="btn-primary"
                        style={{ height: '64px', fontSize: '18px', maxWidth: '300px' }}
                        onClick={async () => {
                            try {
                                const response = await fetch('/api/create-checkout-session', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        priceId: 'price_123456789', // Placeholder
                                        successUrl: window.location.origin + '?success=true',
                                        cancelUrl: window.location.origin,
                                        userEmail: user?.email || 'test@example.com', // Use captured email
                                        programSlug: winner.slug
                                    })
                                });
                                const data = await response.json();
                                if (data.url) window.location.href = data.url;
                            } catch (error) {
                                console.error('Checkout error:', error);
                                alert('Something went wrong initiating checkout.');
                            }
                        }}
                    >
                        Start 7-Day Free Trial
                    </button>
                </div>
            </div>

            {/* Other Options Grid */}
            <div>
                <h3 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    marginBottom: '32px',
                    color: 'var(--color-text-secondary)',
                    textAlign: 'center'
                }}>Other Potential Matches</h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                }}>
                    {runnersUp.map((program) => (
                        <div
                            key={program.program}
                            onClick={() => setModalProgram(program)}
                            className="glass-card"
                            style={{
                                padding: '0',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={`/programs/${program.slug || 'placeholder'}.png`}
                                    alt={program.program}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    background: 'rgba(255,255,255,0.9)',
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                    color: 'var(--color-text-primary)'
                                }}>
                                    {program.score}% Match
                                </div>
                            </div>
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h4 style={{
                                    fontSize: '20px',
                                    fontFamily: 'var(--font-heading)',
                                    marginBottom: '8px',
                                    color: 'var(--color-text-primary)'
                                }}>{program.program}</h4>
                                <div style={{
                                    marginTop: 'auto',
                                    paddingTop: '16px',
                                    color: 'var(--color-primary)',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}>
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
