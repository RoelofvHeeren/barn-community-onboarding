import React, { useState, useEffect, useRef } from 'react';

const ProgramPodium = ({ recommendations, user }) => {
    const programs = recommendations.scores;
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

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' && activeIndex < programs.length - 1) setActiveIndex(prev => prev + 1);
            if (e.key === 'ArrowLeft' && activeIndex > 0) setActiveIndex(prev => prev - 1);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, programs.length]);

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

    const handleJoinNow = async () => {
        const program = programs[activeIndex];
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
            {/* Header */}
            <div className="podium-header fade-in">
                <h1 className="main-title">We've got programs for everybody</h1>
                {/* <p className="main-subtitle">{recommendations.summary}</p> */}
            </div>

            {/* Carousel Track */}
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

                        // 3D positioning
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
                                    {/* FRONT SIDE */}
                                    <div className="card-front">
                                        <div className="card-image-full">
                                            <img
                                                src={`/programs/${program.slug}.png`}
                                                alt={program.program}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    // High quality placeholder if local image fails
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

                                        {/* Navigation Arrows (Visual only on active card) */}
                                        {isActive && index > 0 && (
                                            <button className="card-arrow left" onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveIndex(prev => prev - 1);
                                            }}>‹</button>
                                        )}
                                        {isActive && index < programs.length - 1 && (
                                            <button className="card-arrow right" onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveIndex(prev => prev + 1);
                                            }}>›</button>
                                        )}
                                    </div>

                                    {/* BACK SIDE */}
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
            </div>

            {/* Pagination */}
            <div className="pagination-dots">
                {programs.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(index)}
                    />
                ))}
            </div>

            {/* Fixed Join Button */}
            <div className="floating-action-container">
                <button className="join-now-btn" onClick={handleJoinNow}>
                    Join Now
                </button>
            </div>
        </div>
    );
};

export default ProgramPodium;
