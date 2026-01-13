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

// Helper to handle bolding in summary text
const BoldText = ({ text }) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <span>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i} style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{part.slice(2, -2)}</strong>
                    : part
            )}
        </span>
    );
};

const ProgramPodium = ({ recommendations }) => {
    const [selectedProgram, setSelectedProgram] = useState(recommendations.scores[0]);
    const [modalProgram, setModalProgram] = useState(null);

    const original = recommendations.scores;
    const podiumOrder = [original[3], original[1], original[0], original[2], original[4]].filter(Boolean);

    return (
        <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header Instructions */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '48px',
                    lineHeight: '56px',
                    marginBottom: '16px',
                    color: 'var(--color-text-primary)'
                }}>Your Personalized Recommendations</h2>
                <p style={{
                    fontSize: '18px',
                    lineHeight: '28px',
                    color: 'black', // Pure black for summary as requested previously
                    maxWidth: '800px',
                    margin: '0 auto',
                    fontWeight: 400
                }}>
                    <BoldText text={`Based on your goals and experience, we recommend the **${original[0].program}** program. However, feel free to explore and choose the style that interests you most.`} />
                </p>
            </div>

            {/* Podium Grid */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '20px',
                marginBottom: '64px',
                padding: '0 20px',
                maxWidth: '100%'
            }} className="podium-grid">
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
                                flex: '1 1 200px',
                                minWidth: '180px',
                                maxWidth: '240px',
                                padding: '32px 20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                background: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-card-bg)',
                                border: isWinner ? '2px solid var(--color-primary)' : (isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'),
                                transform: isSelected ? 'scale(1.04) translateY(-8px)' : 'scale(1)',
                                boxShadow: isWinner ? '0 15px 45px rgba(1, 117, 89, 0.15)' : '0 10px 30px rgba(0,0,0,0.06)',
                                zIndex: isSelected ? 2 : 1,
                                minHeight: isWinner ? '320px' : '280px'
                            }}
                        >
                            {isWinner && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    background: 'var(--color-primary)',
                                    color: 'white',
                                    padding: '6px 14px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 10px rgba(1, 117, 89, 0.3)'
                                }}>Recommended</div>
                            )}

                            <div style={{
                                fontSize: '14px',
                                color: isWinner ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                                fontWeight: 700,
                                letterSpacing: '0.1em'
                            }}>0{rank}</div>

                            <div style={{
                                fontSize: '22px',
                                fontWeight: 700,
                                textAlign: 'center',
                                fontFamily: 'var(--font-heading)', // Playfair Display
                                color: isSelected ? '#000' : 'var(--color-text-primary)',
                                margin: '16px 0 auto'
                            }}>{program.program}</div>

                            <div style={{
                                fontSize: isWinner ? '40px' : '32px',
                                fontWeight: 800,
                                color: isWinner || isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                marginTop: '24px'
                            }}>{program.score}%</div>

                            <div style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--color-text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '16px'
                            }}>Match Score</div>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalProgram(program);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-primary)',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    textDecoration: 'underline',
                                    cursor: 'pointer'
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
                gap: '20px',
                paddingBottom: '80px'
            }}>
                <button className="btn-primary" style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '72px',
                    fontSize: '20px',
                    fontWeight: 700,
                    boxShadow: '0 20px 40px rgba(1, 117, 89, 0.2)'
                }}>
                    Start {selectedProgram?.program} Program
                </button>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '15px',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        opacity: 0.8
                    }}
                >
                    Retake fitness assessment
                </button>
            </div>

            {/* Modal */}
            {modalProgram && (
                <Modal
                    program={modalProgram}
                    onClose={() => setModalProgram(null)}
                />
            )}
        </div>
    );
};

export default ProgramPodium;
