import React, { useState, useEffect, useRef } from 'react';

const ProgramPodium = ({ recommendations, user }) => {
    // Flatten the data: the "winner" is just the first item, but we treat them all as slides
    const programs = recommendations.scores;
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);

    // Touch handling for swipe
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && activeIndex < programs.length - 1) {
            setActiveIndex(prev => prev + 1);
        }

        if (isRightSwipe && activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        }

        setTouchEnd(0);
        setTouchStart(0);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' && activeIndex < programs.length - 1) {
                setActiveIndex(prev => prev + 1);
            }
            if (e.key === 'ArrowLeft' && activeIndex > 0) {
                setActiveIndex(prev => prev - 1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, programs.length]);

    // Handle "Select Program" intent
    const handleSelectProgram = async (program) => {
        try {
            // Save lead logic (same as before)
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
        } catch (e) {
            console.warn("Could not save lead intent", e);
        }
        // Redirect
        window.location.href = 'https://barn-community-f2a4b1.circle.so/checkout/barn-community-silver-membership';
    };

    return (
        <div className="carousel-container">
            {/* Dynamic Background */}
            <div className="carousel-background">
                <div
                    className="background-image"
                    style={{ backgroundImage: `url(/programs/${programs[activeIndex].slug}.png)` }}
                />
                <div className="background-overlay" />
            </div>

            {/* Header */}
            <div className="carousel-header fade-in">
                <img src="/logo-black.png" alt="Barn Gym" className="logo" onError={(e) => e.target.style.display = 'none'} />
                {/* Fallback text if logo fails, but user provided logo in header before */}
                {/* Assuming logo exists or using text */}
                <h1 className="main-title">Your Perfect Match</h1>
                <p className="main-subtitle">{recommendations.summary}</p>
            </div>

            {/* 3D Carousel Track */}
            <div
                className="carousel-track-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                ref={containerRef}
            >
                <div className="carousel-track" style={{ transform: `translateX(calc(50% - ${activeIndex * 340 + 170}px))` }}>
                    {programs.map((program, index) => {
                        const isActive = index === activeIndex;
                        const distance = Math.abs(index - activeIndex);

                        // Calculate scale and opacity based on distance from center
                        let scale = 0.85;
                        let opacity = 0.5;
                        let zIndex = 10 - distance;
                        let rotateY = 0;

                        if (isActive) {
                            scale = 1;
                            opacity = 1;
                            rotateY = 0;
                        } else if (index < activeIndex) {
                            rotateY = 25; // Rotate left cards 
                        } else {
                            rotateY = -25; // Rotate right cards
                        }

                        return (
                            <div
                                key={program.slug}
                                className={`carousel-card ${isActive ? 'active' : ''}`}
                                style={{
                                    transform: `scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                                    opacity: opacity,
                                    zIndex: zIndex
                                }}
                                onClick={() => setActiveIndex(index)}
                            >
                                <div className="card-inner">
                                    <div className="card-image-container">
                                        <img
                                            src={`/programs/${program.slug}.png`}
                                            alt={program.program}
                                            className="card-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/600x400?text=Program'; // Fallback
                                            }}
                                        />
                                        {index === 0 && (
                                            <div className="top-choice-badge">#1 Match</div>
                                        )}
                                        <div className="match-score-badge">{program.score}% Match</div>
                                    </div>

                                    <div className="card-content">
                                        <h2 className="program-title">{program.program}</h2>
                                        <p className="program-tagline">{program.tagline || "Train for performance."}</p>

                                        <p className="program-description">
                                            {program.reason}
                                        </p>

                                        {program.bullets && (
                                            <ul className="program-bullets">
                                                {program.bullets.map((bullet, i) => (
                                                    <li key={i}>{bullet}</li>
                                                ))}
                                            </ul>
                                        )}

                                        <button
                                            className="select-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectProgram(program);
                                            }}
                                        >
                                            Start 7-Day Free Trial
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pagination Dots */}
            <div className="pagination-dots">
                {programs.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === activeIndex ? 'active' : ''}`}
                        onClick={() => setActiveIndex(index)}
                    />
                ))}
            </div>

            {/* Navigation Arrows for Desktop */}
            <button
                className="nav-arrow left"
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
            >
                ←
            </button>
            <button
                className="nav-arrow right"
                onClick={() => setActiveIndex(Math.min(programs.length - 1, activeIndex + 1))}
                disabled={activeIndex === programs.length - 1}
            >
                →
            </button>
        </div>
    );
};

export default ProgramPodium;
