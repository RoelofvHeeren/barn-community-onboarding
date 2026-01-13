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

const ProgramPodium = ({ recommendations }) => {
    const [selectedProgram, setSelectedProgram] = useState(recommendations.scores[0]);
    const [modalProgram, setModalProgram] = useState(null);

    // Sort logic for 5-wide centered podium
    // Original: [1, 2, 3, 4, 5]
    // Reordered: [4, 2, 1, 3, 5]
    const original = recommendations.scores;
    const podiumOrder = [original[3], original[1], original[0], original[2], original[4]].filter(Boolean);

    return (
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Instructions */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '32px',
                    marginBottom: '12px',
                    color: 'var(--color-text-primary)'
                }}>Your Personalized Recommendations</h2>
                <p style={{
                    fontSize: '16px',
                    color: 'var(--color-text-secondary)',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    Based on your goals and experience, we recommend the **{original[0].program}** program.
                    However, feel free to explore and choose the style that interests you most.
                </p>
            </div>

            {/* Podium Grid */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'stretch',
                gap: '16px',
                padding: '0 20px',
                maxWidth: '100%',
                margin: '0 auto 48px'
            }} className="podium-grid">
                {podiumOrder.map((program, index) => {
                    const isWinner = program.program === original[0].program;
                    const isSelected = selectedProgram?.program === program.program;
                    const rank = original.findIndex(p => p.program === program.program) + 1;

                    return (
                        <div
                            key={program.program}
                            onClick={() => setSelectedProgram(program)}
                            className={`glass-card fade-in-up ${isWinner ? 'winner-card' : ''}`}
                            style={{
                                flex: '1 1 180px',
                                minWidth: '160px',
                                maxWidth: '220px',
                                padding: '24px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                background: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'var(--color-card-bg)',
                                border: isWinner ? '2px solid var(--color-primary)' : (isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)'),
                                transform: isSelected ? 'scale(1.05) translateY(-8px)' : 'scale(1)',
                                boxShadow: isWinner ? '0 10px 40px rgba(1, 117, 89, 0.2)' : undefined,
                                zIndex: isSelected ? 2 : 1,
                                minHeight: isWinner ? '280px' : '240px'
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
                                    whiteSpace: 'nowrap'
                                }}>Best Match</div>
                            )}

                            <div style={{
                                fontSize: '14px',
                                color: isWinner ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                                fontWeight: 700
                            }}>0{rank}</div>

                            <div style={{
                                fontSize: '18px',
                                fontWeight: 600,
                                textAlign: 'center',
                                color: isSelected ? '#000' : 'var(--color-text-primary)'
                            }}>{program.program}</div>

                            <div style={{
                                fontSize: isWinner ? '36px' : '28px',
                                fontWeight: 800,
                                color: isWinner || isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                            }}>{program.score}%</div>

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
                                    marginTop: '8px'
                                }}
                            >
                                More Info
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
                gap: '16px'
            }}>
                <button className="btn-primary" style={{
                    width: '100%',
                    maxWidth: '400px',
                    height: '64px',
                    fontSize: '18px'
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
                    Retake Assessment
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
