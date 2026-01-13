import React from 'react';

const ProgressBar = ({ current, total }) => {
    const progress = (current / total) * 100;

    return (
        <div style={{
            width: '100%',
            marginBottom: 'var(--spacing-8)'
        }}>
            {/* Progress indicator */}
            <div style={{
                height: '2px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '1px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'var(--color-primary)',
                    transition: 'width 600ms ease-in-out'
                }} />
            </div>

            {/* Step indicator */}
            <div style={{
                marginTop: 'var(--spacing-2)',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--color-primary)'
            }}>
                Step {current} of {total}
            </div>
        </div>
    );
};

export default ProgressBar;
