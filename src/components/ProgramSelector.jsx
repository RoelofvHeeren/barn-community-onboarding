import React from 'react';
import './ProgramPodium.css'; // Reuse existing styles for consistency

const ProgramCard = ({ program, onSelect }) => {
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

                <button className="view-program-btn">
                    Select This Program
                </button>
            </div>
        </div>
    );
};

const ProgramSelector = ({ programs, onSelect }) => {
    return (
        <div className="podium-page-container">
            <header className="results-header">
                <h1 className="primary-heading">Select Your Program</h1>
                <p className="sub-heading">Choose the program that best fits your goals and lifestyle.</p>
            </header>

            <section className="podium-section program-selector-grid">
                {programs.map((program) => (
                    <ProgramCard
                        key={program.slug}
                        program={program}
                        onSelect={onSelect}
                    />
                ))}
            </section>
        </div>
    );
};

export default ProgramSelector;
