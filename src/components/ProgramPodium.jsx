import React, { useState, useEffect, useRef } from 'react';

const MobileCarousel = ({ programs, user, onSelect }) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [flippedIndices, setFlippedIndices] = useState(new Set());

    // Touch handling
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
    const handleTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > 50 && activeIndex < programs.length - 1) setActiveIndex(prev => prev + 1);
        if (distance < -50 && activeIndex > 0) setActiveIndex(prev => prev - 1);
        setTouchEnd(0);
        setTouchStart(0);
    };

    const toggleFlip = (index, e) => {
        e.stopPropagation();
        const newFlipped = new Set(flippedIndices);
        if (newFlipped.has(index)) {
            newFlipped.delete(index);
        } else {
            newFlipped.add(index);
        }
        setFlippedIndices(newFlipped);
    };

    return (
        <div
            className="carousel-track-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className="carousel-track" style={{ transform: `translateX(calc(50% - ${activeIndex * 320 + 160}px))` }}>
                {programs.map((program, index) => {
                    const isActive = index === activeIndex;
                    const isFlipped = flippedIndices.has(index);

                    let scale = isActive ? 1 : 0.9;
                    let opacity = isActive ? 1 : 0.5;
                    let zIndex = isActive ? 20 : 10;

                    return (
                        <div
                            key={program.slug}
                            className={`carousel-card-wrapper ${isActive ? 'active' : ''}`}
                            style={{
                                transform: `scale(${scale})`,
                                opacity: opacity,
                                zIndex: zIndex
                            }}
                            onClick={() => setActiveIndex(index)}
                        >
                            <div className={`carousel-card-inner ${isFlipped ? 'flipped' : ''}`}>
                                {/* FRONT */}
                                <div className="card-front">
                                    <div className="card-image-full">
                                        <img
                                            src={`/programs/${program.slug}.png`}
                                            alt={program.program}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://placehold.co/400x600/333/FFF?text=${encodeURIComponent(program.program)}`;
                                            }}
                                        />
                                        <div className="card-overlay-gradient"></div>
                                    </div>

                                    <div className="card-front-content">
                                        <h2 className="front-title">{program.program}</h2>
                                        <button
                                            className="learn-more-btn"
                                            onClick={(e) => toggleFlip(index, e)}
                                        >
                                            Learn More
                                        </button>
                                    </div>
                                </div>

                                {/* BACK */}
                                <div className="card-back" onClick={(e) => toggleFlip(index, e)}>
                                    <div className="back-content">
                                        <h3 className="back-title">{program.program}</h3>
                                        <p className="back-tagline">{program.tagline}</p>
                                        <p className="back-description">{program.reason}</p>
                                        {program.bullets && (
                                            <ul className="back-bullets">
                                                {program.bullets.map((bullet, i) => (
                                                    <li key={i}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}
                                        <div className="close-instruction">Tap to flip back</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Pagination Dots (Mobile Only) */}
            <div className="pagination-dots mobile-only">
                {programs.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(index)}
                    />
                ))}
            </div>

            {/* Fixed Join Button (Mobile Only) */}
            <div className="floating-action-container mobile-only">
                <button className="join-now-btn" onClick={() => onSelect(programs[activeIndex])}>
                    Join Now
                </button>
            </div>
        </div>
    );
};

const DesktopPodium = ({ programs, onSelect }) => {
    // Top 3 programs
    const top3 = programs.slice(0, 3);
    const rest = programs.slice(3);

    // Reorder for podium visual: 2nd, 1st, 3rd
    // Actually simpler is just 1st (Center), 2nd (Left), 3rd (Right)
    const winner = top3[0];
    const second = top3[1];
    const third = top3[2];

    return (
        <div className="desktop-podium-layout">
            <div className="podium-top-row">
                {/* 2nd Place */}
                <div className="podium-card secondary">
                    <div className="podium-rank">#2</div>
                    <img src={`/programs/${second.slug}.png`} alt={second.program} />
                    <div className="podium-info">
                        <h3>{second.program}</h3>
                        <p>{second.score}% Match</p>
                        <button onClick={() => onSelect(second)}>View Details</button>
                    </div>
                </div>

                {/* 1st Place (Winner) */}
                <div className="podium-card winner">
                    <div className="podium-rank">#1 Match</div>
                    <img src={`/programs/${winner.slug}.png`} alt={winner.program} />
                    <div className="podium-info">
                        <h1>{winner.program}</h1>
                        <p className="winner-tagline">{winner.tagline}</p>
                        <div className="winner-score">{winner.score}% Match</div>
                        <p className="winner-desc">{winner.reason}</p>
                        <button className="winner-cta" onClick={() => onSelect(winner)}>Start Free Trial</button>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="podium-card secondary">
                    <div className="podium-rank">#3</div>
                    <img src={`/programs/${third.slug}.png`} alt={third.program} />
                    <div className="podium-info">
                        <h3>{third.program}</h3>
                        <p>{third.score}% Match</p>
                        <button onClick={() => onSelect(third)}>View Details</button>
                    </div>
                </div>
            </div>

            {/* Rest of the programs list */}
            <div className="others-list">
                <h3>Other Great Matches</h3>
                <div className="others-grid">
                    {rest.map((program, i) => (
                        <div key={program.slug} className="other-program-card" onClick={() => onSelect(program)}>
                            <img src={`/programs/${program.slug}.png`} alt={program.program} />
                            <div className="other-info">
                                <h4>{program.program}</h4>
                                <span className="match-pill">{program.score}% Match</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const ProgramPodium = ({ recommendations, user }) => {
    const programs = recommendations.scores;
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const handleSelectProgram = async (program) => {
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
        <div className="podium-container">
            <div className="podium-header fade-in">
                <h1 className="main-title">We've got programs for everybody</h1>
            </div>

            {isDesktop ? (
                <DesktopPodium programs={programs} onSelect={handleSelectProgram} />
            ) : (
                <MobileCarousel programs={programs} user={user} onSelect={handleSelectProgram} />
            )}
        </div>
    );
};

export default ProgramPodium;
