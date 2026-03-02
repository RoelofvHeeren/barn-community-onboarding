import React, { useState } from 'react';
import './ProgramPodium.css'; // Reuse existing styles for consistency

const SpecRow = ({ icon, label, value }) => (
    <div className="spec-item">
        <span className="spec-label">{label}</span>
        <span className="spec-value">{value}</span>
    </div>
);

const ProgramModal = ({ program, onClose, onSelect }) => {
    if (!program) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="modal-scroll">
                    <div className="modal-header">
                        <div className="modal-image-hero">
                            <img src={`/programs/${program.slug}.png`} alt={program.name} />
                        </div>
                        <h2>{program.name}</h2>
                        <p className="modal-tagline">{program.tagline}</p>
                    </div>

                    <div className="modal-body">
                        <div className="modal-section">
                            <h3>Program Overview</h3>
                            <p>{program.reason}</p>
                        </div>

                        <div className="modal-section">
                            <h3>Key Benefits</h3>
                            <ul className="benefits-list">
                                {program.bullets && program.bullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            className="join-modal-btn"
                            onClick={() => { onClose(); onSelect(program); }}
                        >
                            Select This Program
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgramCard = ({ program, onSelect, onLearnMore }) => {
    return (
        <div
            className="podium-card secondary"
            style={{ height: 'auto', minHeight: '400px' }}
            onClick={() => onSelect(program)}
        >
            <div className="card-image-container">
                <img
                    src={`/programs/${program.slug}.png`}
                    alt={program.name}
                    className="card-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/600x400/f5f5f7/333?text=${program.name}`;
                    }}
                />
            </div>

            <div className="card-content">
                <h3 className="program-name">{program.name}</h3>
                <p className="value-statement">{program.tagline}</p>

                {program.specs && (
                    <div className="specs-grid">
                        <div className="spec-pill">{program.specs.frequency}</div>
                        <div className="spec-pill">{program.specs.intensity}</div>
                        <div className="spec-pill">{program.specs.focus}</div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                        className="view-program-btn"
                        style={{ flex: 1, background: '#E8E8ED', color: '#1D1D1F' }}
                        onClick={(e) => { e.stopPropagation(); onLearnMore(program); }}
                    >
                        Learn More
                    </button>
                    <button
                        className="view-program-btn"
                        style={{ flex: 1 }}
                        onClick={(e) => { e.stopPropagation(); onSelect(program); }}
                    >
                        Select
                    </button>
                </div>
            </div>
        </div>
    );
};

const ProgramSelector = ({ programs, onSelect, onBack }) => {
    const [selectedProgram, setSelectedProgram] = useState(null);

    // Prevent scrolling when modal is open
    React.useEffect(() => {
        if (selectedProgram) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedProgram]);

    return (
        <div className="podium-page-container">
            <header className="results-header" style={{ position: 'relative' }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F5F5F7'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                        ← Back
                    </button>
                )}
                <h1 className="primary-heading">Select Your Program</h1>
                <p className="sub-heading">Choose the program that best fits your goals and lifestyle.</p>
            </header>

            <section className="podium-section program-selector-grid">
                {programs.map((program) => (
                    <ProgramCard
                        key={program.slug}
                        program={program}
                        onSelect={onSelect}
                        onLearnMore={setSelectedProgram}
                    />
                ))}
            </section>

            <ProgramModal
                program={selectedProgram}
                onClose={() => setSelectedProgram(null)}
                onSelect={onSelect}
            />
        </div>
    );
};

export default ProgramSelector;
