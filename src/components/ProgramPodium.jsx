import React, { useState } from 'react';

const Modal = ({ program, onClose }) => {
    if (!program) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
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
                        color: 'var(--color-text-tertiary)'
                    }}
                >✕</button>

                <h3 style={{
                    fontSize: '28px',
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-primary)',
                    marginBottom: '16px'
                }}>{program.program}</h3>

                <div style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    marginBottom: '24px'
                }}>{program.score}% Match</div>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: 'var(--color-text-secondary)',
                    marginBottom: '32px'
                }}>
                    {program.reason}
                </p>

                <button
                    className="btn-primary"
                    onClick={onClose}
                    style={{ width: '100%' }}
                >
                    Got it
                </button>
            </div>
        </div>
    );
};

const BoldText = ({ text }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={part + i} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{part.slice(2, -2)}</strong>
                    : part
            )}
        </span>
    );
};

const ProgramPodium = ({ recommendations }) => {
    const [selectedProgram, setSelectedProgram] = useState(recommendations.scores[0]);
    const [modalProgram, setModalProgram] = useState(null);

    const original = recommendations.scores;
    // Perfect Podium Order: [5, 3, 1, 2, 4]
    // Indices: [4, 2, 0, 1, 3]
    const podiumOrder = [original[4], original[2], original[0], original[1], original[3]].filter(Boolean);

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Instructions */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'min(48px, 10vw)',
                    lineHeight: '1.2',
                    marginBottom: '16px',
                    color: 'var(--color-text-primary)'
                }}>Your Personalized Recommendations</h2>
                <div style={{
                    fontSize: '18px',
                    lineHeight: '28px',
                    color: '#000',
                    maxWidth: '800px',
                    margin: '0 auto',
                    fontWeight: 400
                }}>
                    <BoldText text={`Based on your goals and experience, we recommend the **${original[0].program}** program. However, feel free to explore and choose the style that interests you most.`} />
                </div>
            </div>

            {/* Podium Grid */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap', // Force 5-wide on desktop
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '12px',
                marginBottom: '48px',
                padding: '0 10px',
                width: '100%'
            }} className="podium-container">
                {podiumOrder.map((program) => {
                    const isWinner = program.program === original[0].program;
                    const isSelected = selectedProgram?.program === program.program;
                    const rank = original.findIndex(p => p.program === program.program) + 1;

                    return (
                        <div
                            key={program.program}
                            onClick={() => setSelectedProgram(program)}
                            className={`glass-card fade-in-up ${isWinner ? 'winner-card' : ''}`}
                            style={{
                                flex: isWinner ? '1 1 240px' : '1 1 200px',
                                minWidth: '160px',
                                padding: '24px 12px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                background: isSelected ? 'rgba(255, 255, 255, 0.98)' : 'var(--color-card-bg)',
                                border: isWinner ? '2px solid var(--color-primary)' : (isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'),
                                transform: isSelected ? 'scale(1.03) translateY(-8px)' : 'scale(1)',
                                boxShadow: isWinner ? '0 15px 45px rgba(1, 117, 89, 0.15)' : (isSelected ? '0 10px 30px rgba(0,0,0,0.1)' : '0 10px 20px rgba(0,0,0,0.05)'),
                                zIndex: isSelected ? 2 : 1,
                                height: isWinner ? '340px' : (rank <= 3 ? '300px' : '280px')
                            }}
                        >
                            {isWinner && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 8px rgba(1, 117, 89, 0.3)'
                                }}>Recommended</div>
                            )}

                            <div style={{
                                fontSize: '12px',
                                color: 'var(--color-text-tertiary)',
                                fontWeight: 700,
                                opacity: 0.6
                            }}>0{rank}</div>

                            <div style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                textAlign: 'center',
                                fontFamily: 'var(--font-heading)',
                                color: 'var(--color-text-primary)',
                                marginTop: '12px',
                                marginBottom: '4px' // Ultra tightened gap
                            }}>{program.program}</div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0px', // Minimal gap
                                marginTop: 'auto',
                                marginBottom: 'auto'
                            }}>
                                <div style={{
                                    fontSize: isWinner ? '36px' : '28px',
                                    fontWeight: 800,
                                    color: 'var(--color-primary)',
                                    lineHeight: '1'
                                }}>{program.score}%</div>
                                <div style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: 'var(--color-text-tertiary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginTop: '4px'
                                }}>Match Score</div>
                            </div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalProgram(program);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textDecoration: 'underline',
                                    cursor: 'pointer',
                                    marginTop: '12px'
                                }}
                            >
                                Why this?
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* CTA */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                paddingBottom: '40px'
            }}>
                <button className="btn-primary" style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '64px',
                    fontSize: '18px',
                    fontWeight: 700
                }}>
                    Start {selectedProgram?.program} Program
                </button>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '14px',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                    }}
                >
                    Retake fitness assessment
                </button>
            </div>

            {modalProgram && (
                <Modal
                    program={modalProgram}
                    onClose={() => setModalProgram(null)}
                />
            )}

            <style>{`
                @media (max-width: 1100px) {
                    .podium-container {
                        flex-wrap: wrap !important;
                        gap: 16px !important;
                    }
                    .glass-card {
                        flex: 1 1 200px !important;
                        max-width: 100% !important;
                        height: auto !important;
                        min-height: 200px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProgramPodium;
