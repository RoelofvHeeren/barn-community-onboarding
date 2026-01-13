import React, { useState } from 'react';

const QuestionCard = ({ question, onNext, onBack, canGoBack, userName, showGreeting }) => {
    const [selectedOption, setSelectedOption] = useState(null);

    if (!question) return null;

    const handleNext = () => {
        if (selectedOption) {
            onNext(selectedOption);
            setSelectedOption(null);
        }
    };

    return (
        <div className="glass-card fade-in-up" style={{
            padding: '64px',
            width: '100%'
        }}>
            {/* Question Text */}
            <h2 style={{
                fontSize: '32px',
                lineHeight: '44px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 400,
                textAlign: 'center',
                marginBottom: 'var(--spacing-6)',
                maxWidth: '600px',
                margin: '0 auto var(--spacing-6)'
            }}>
                {showGreeting && userName ? `Hi ${userName}, ${question.text}` : question.text}
            </h2>

            {/* Options */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-2)'
            }}>
                {question.options.map((option, index) => {
                    const isSelected = selectedOption?.value === option.value;

                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedOption(option)}
                            style={{
                                padding: '24px',
                                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                borderRadius: '16px',
                                background: isSelected ? 'rgba(1, 117, 89, 0.1)' : 'transparent',
                                color: 'var(--color-text-primary)',
                                fontSize: '16px',
                                lineHeight: '24px',
                                fontWeight: 400,
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 150ms ease-out',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                                    e.currentTarget.style.transform = 'scale(1.01)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isSelected) {
                                    e.currentTarget.style.borderColor = 'var(--color-border)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }
                            }}
                        >
                            {option.label}
                            {isSelected && (
                                <span style={{
                                    position: 'absolute',
                                    right: '24px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-primary)',
                                    fontSize: '20px'
                                }}>✓</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Navigation */}
            <div style={{
                marginTop: 'var(--spacing-6)',
                display: 'flex',
                gap: 'var(--spacing-2)'
            }}>
                {canGoBack && (
                    <button
                        onClick={onBack}
                        className="btn-ghost"
                    >
                        Back
                    </button>
                )}
                <button
                    onClick={handleNext}
                    disabled={!selectedOption}
                    className="btn-primary"
                    style={{
                        flex: 1
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default QuestionCard;
