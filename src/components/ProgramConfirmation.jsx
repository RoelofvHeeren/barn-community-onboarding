import React, { useState } from 'react';

const ProgramConfirmation = ({ program, user, onConfirm, onBack }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleConfirm = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await onConfirm();
        } catch (err) {
            if (err.requireCircle) {
                setError('require_circle');
            } else {
                setError(err.message || 'Something went wrong. Please try again.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-card fade-in-up" style={{
            padding: '64px',
            textAlign: 'center',
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative'
        }}>
            {onBack && !isLoading && (
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        left: '24px',
                        top: '24px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-text-tertiary)',
                        fontSize: '24px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '50%',
                        transition: 'background 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    aria-label="Go Back"
                >
                    ←
                </button>
            )}

            <h2 style={{
                fontSize: '32px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                marginBottom: '16px',
                color: 'var(--color-text-primary)'
            }}>
                Finalize Your Choice
            </h2>

            <p style={{
                fontSize: '18px',
                color: 'var(--color-text-secondary)',
                marginBottom: '48px',
                lineHeight: '1.6'
            }}>
                You are about to sign up for <strong>{program.program}</strong>.
                <br /><br />
                {program.tagline || 'Get ready to transform your performance and build real strength.'}
            </p>

            {error === 'require_circle' ? (
                <div style={{
                    background: 'rgba(255, 170, 0, 0.1)',
                    padding: '24px',
                    borderRadius: '12px',
                    marginBottom: '32px',
                    border: '1px solid rgba(255, 170, 0, 0.3)'
                }}>
                    <h3 style={{ color: '#d97706', marginBottom: '8px', fontSize: '18px' }}>Community Account Required</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px', fontSize: '15px' }}>
                        We couldn't find a Barn Community membership for this email. Please make sure you are using the same email you used to sign up.
                    </p>
                    <a
                        href="https://barn-community-f2a4b1.circle.so/join?invitation_token=5bdb9d675cfc4796c495f9af565fbc5442d7c9f3-e1a35338-e720-4c78-be1e-d7947088a781"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '12px 24px' }}
                    >
                        Join the Community First
                    </a>
                </div>
            ) : error ? (
                <p style={{
                    color: '#ff4d4d',
                    background: 'rgba(255, 77, 77, 0.1)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    {error}
                </p>
            ) : null}

            <button
                onClick={handleConfirm}
                className="btn-primary"
                disabled={isLoading}
                style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '18px',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease-in-out'
                }}
            >
                {isLoading ? 'Setting up your program...' : 'Log In Program'}
            </button>
        </div>
    );
};

export default ProgramConfirmation;
