import React, { useState, useEffect } from 'react';
import './ProgramPodium.css';

// ==========================================
// SUB-COMPONENTS
// ==========================================

const SpecRow = ({ icon, label, value }) => (
    <div className="spec-item">
        <span className="spec-label">{label}</span>
        <span className="spec-value">{value}</span>
    </div>
);

const PodiumCard = ({ program, rank, onClick, isMobile }) => {
    const isWinner = rank === 1;

    return (
        <div
            className={`podium-card ${isWinner ? 'winner' : 'secondary'} rank-${rank}`}
            onClick={() => onClick(program)}
        >
            {/* 1. Ranking Indicator */}
            <div className="ranking-badge">
                {isWinner ? (
                    <>
                        <span className="trophy-icon">🏆</span> Top Recommendation
                    </>
                ) : (
                    `#${rank}`
                )}
            </div>

            {/* Image (Placed top for visual balance, though user listed text hierarchy first, images are crucial for "Product Box" feel) */}
            <div className="card-image-container">
                <img
                    src={`/programs/${program.slug}.png`}
                    alt={program.program}
                    className="card-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/600x400/f5f5f7/333?text=${program.program}`;
                    }}
                />
            </div>

            <div className="card-content">
                {/* 2. Program Name */}
                <h3 className="program-name">{program.program}</h3>

                {/* 3. Value Statement */}
                <p className="value-statement">{program.tagline || program.reason.substring(0, 60) + "..."}</p>

                {/* 4. Fit Indicators (Specs) */}
                {program.specs && (
                    <div className="specs-grid">
                        <div className="spec-pill">{program.specs.frequency}</div>
                        <div className="spec-pill">{program.specs.intensity}</div>
                        <div className="spec-pill">{program.specs.focus}</div>
                    </div>
                )}

                {/* 5. Primary Action */}
                <button className="view-program-btn">
                    View Program
                </button>
            </div>
        </div>
    );
};

const OtherProgramRow = ({ program, onClick }) => (
    <div className="other-program-row" onClick={() => onClick(program)}>
        <div className="row-image">
            <img src={`/programs/${program.slug}.png`} alt={program.program} />
        </div>
        <div className="row-content">
            <h4 className="row-title">{program.program}</h4>
            <p className="row-desc">{program.tagline}</p>
        </div>
        <button className="row-action">View</button>
    </div>
);

const ProgramModal = ({ program, onClose, onJoin }) => {
    if (!program) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <div className="modal-scroll">
                    <div className="modal-header">
                        <div className="modal-image-hero">
                            <img src={`/programs/${program.slug}.png`} alt={program.program} />
                        </div>
                        <h2>{program.program}</h2>
                        <p className="modal-tagline">{program.tagline}</p>
                    </div>

                    <div className="modal-body">
                        <div className="modal-section">
                            <h3>Why this fits you</h3>
                            <p>{program.reason}</p>
                        </div>

                        {program.specs && (
                            <div className="modal-section specs-section">
                                <h3>Program Specs</h3>
                                <div className="specs-list">
                                    <SpecRow label="Frequency" value={program.specs.frequency} />
                                    <SpecRow label="Duration" value={program.specs.duration} />
                                    <SpecRow label="Intensity" value={program.specs.intensity} />
                                    <SpecRow label="Focus" value={program.specs.focus} />
                                </div>
                            </div>
                        )}

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
                        <button className="join-modal-btn" onClick={() => onJoin(program)}>
                            Start with this program
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const ProgramPodium = ({ recommendations, user }) => {
    const programs = recommendations.scores;
    const top3 = programs.slice(0, 3);
    const others = programs.slice(3);

    // Top 3 for Podium: Winner, 2nd, 3rd
    const winner = top3[0];
    const second = top3[1];
    const third = top3[2];

    const [selectedProgram, setSelectedProgram] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        // Clean up body scroll lock if modal was open
        return () => {
            window.removeEventListener('resize', checkMobile);
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (selectedProgram) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedProgram]);

    const handleJoin = async (program) => {
        try {
            const leadData = {
                email: user?.email || '',
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                programSlug: program.slug
            };
            await fetch('/api/save-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
        } catch (e) { console.warn("Intent save failed", e); }
        window.location.href = 'https://barn-community-f2a4b1.circle.so/checkout/barn-community-silver-membership';
    };

    return (
        <div className="podium-page-container">
            {/* 1. Header Section */}
            <header className="results-header">
                <h1 className="primary-heading">Your Best Program Matches</h1>
                <p className="sub-heading">Based on your answers, these programs align best with your goals, experience, and availability.</p>
                <p className="micro-copy">You canexplore any program in more detail.</p>
            </header>

            {/* 2. Podium Section */}
            <section className="podium-section">
                {isMobile ? (
                    // Mobile: Vertical Stack (1, 2, 3)
                    <div className="mobile-stack">
                        <PodiumCard program={winner} rank={1} onClick={setSelectedProgram} isMobile={true} />
                        {second && <PodiumCard program={second} rank={2} onClick={setSelectedProgram} isMobile={true} />}
                        {third && <PodiumCard program={third} rank={3} onClick={setSelectedProgram} isMobile={true} />}
                    </div>
                ) : (
                    // Desktop: Horizontal Podium (2, 1, 3) for visual balance
                    <div className="desktop-podium">
                        <div className="podium-column side">
                            {second && <PodiumCard program={second} rank={2} onClick={setSelectedProgram} />}
                        </div>
                        <div className="podium-column center">
                            <PodiumCard program={winner} rank={1} onClick={setSelectedProgram} />
                        </div>
                        <div className="podium-column side">
                            {third && <PodiumCard program={third} rank={3} onClick={setSelectedProgram} />}
                        </div>
                    </div>
                )}
            </section>

            {/* 3. Others Section */}
            {others.length > 0 && (
                <section className="others-section">
                    <h2 className="others-title">Other Programs You May Like</h2>
                    <div className="others-list">
                        {others.map((p) => (
                            <OtherProgramRow key={p.slug} program={p} onClick={setSelectedProgram} />
                        ))}
                    </div>
                </section>
            )}

            {/* Modal */}
            <ProgramModal
                program={selectedProgram}
                onClose={() => setSelectedProgram(null)}
                onJoin={handleJoin}
            />
        </div>
    );
};

export default ProgramPodium;
