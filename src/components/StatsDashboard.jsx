import React, { useState, useEffect } from 'react';

const StatsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    useEffect(() => {
        fetchStats();
        // Live polling every 5 seconds
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (loading) setError(err.message); // Only show error if initial load fails
        }
    };

    if (loading) return <div className="dashboard-loading">Loading Analytics...</div>;
    if (error) return <div className="dashboard-error">Error: {error}</div>;
    if (!stats) return null;

    // --- Data Processing ---
    const getCount = (eventType) => {
        const event = stats.funnel.find(e => e.event_type === eventType);
        return event ? parseInt(event.count, 10) : 0;
    };

    const visitors = getCount('view_welcome');
    const manualFlow = getCount('click_manual_flow');
    const quizFlow = getCount('click_quiz_flow');
    const leads = getCount('complete_lead_capture');
    const resultsViews = getCount('view_results');
    const checkouts = getCount('click_checkout');

    // Rates
    const leadConversionRate = visitors > 0 ? ((leads / visitors) * 100).toFixed(1) : 0;
    const checkoutConversionRate = visitors > 0 ? ((checkouts / visitors) * 100).toFixed(1) : 0;
    const leadToCheckoutRate = leads > 0 ? ((checkouts / leads) * 100).toFixed(1) : 0;

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header fade-in-up">
                <div>
                    <h1>Onboarding Analytics</h1>
                    <p className="subtitle">Live performance tracking • Updates every 5s</p>
                </div>
                <div className="status-badge">
                    <span className="dot pulse"></span>
                    Live
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="bento-grid fade-in-up delay-100">
                <MetricCard
                    label="Total Visitors"
                    value={visitors}
                    icon="👥"
                    trend="100% Traffic"
                />
                <MetricCard
                    label="Active Leads"
                    value={leads}
                    icon="📧"
                    trend={`${leadConversionRate}% Conv.`}
                    trendColor={leadConversionRate > 20 ? 'green' : 'orange'}
                />
                <MetricCard
                    label="Started Trial"
                    value={stats.activeTrials !== undefined ? stats.activeTrials : checkouts}
                    icon="🚀"
                    trend={`${checkoutConversionRate}% Click Rate`}
                    trendColor={checkoutConversionRate > 5 ? 'green' : 'orange'}
                />
                <MetricCard
                    label="Lead to Trial"
                    value={`${leadToCheckoutRate}%`}
                    icon="⚡"
                    trend="Funnel Efficiency"
                />
            </div>

            <div className="dashboard-split fade-in-up delay-200">

                {/* Visual Funnel */}
                <div className="dashboard-card funnel-card">
                    <h2>Conversion Funnel</h2>
                    <div className="funnel-chart">
                        <FunnelStep label="Visitors" count={visitors} total={visitors} color="#007AFF" />
                        <FunnelStep label="Flow Selected" count={manualFlow + quizFlow} total={visitors} color="#34C759" />
                        <FunnelStep label="Leads Captured" count={leads} total={visitors} color="#5856D6" />
                        <FunnelStep label="View Results" count={resultsViews} total={visitors} color="#FF9500" />
                        <FunnelStep label="Checkout Click" count={checkouts} total={visitors} color="#FF2D55" />
                    </div>
                </div>

                {/* Flow Split */}
                <div className="dashboard-card split-card">
                    <h2>Flow Preference</h2>
                    <div className="split-chart">
                        <div className="split-bar">
                            <div className="split-segment manual" style={{ flex: manualFlow || 1 }}>
                                <span>Manual</span>
                                <strong>{manualFlow}</strong>
                            </div>
                            <div className="split-segment quiz" style={{ flex: quizFlow || 1 }}>
                                <span>Quiz</span>
                                <strong>{quizFlow}</strong>
                            </div>
                        </div>
                        <div className="split-legend">
                            <div className="legend-item"><span className="dot manual"></span> I know what I want</div>
                            <div className="legend-item"><span className="dot quiz"></span> Help me find it</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-split fade-in-up delay-300">

                {/* Quiz Drop-off */}
                <div className="dashboard-card">
                    <h2>Quiz Drop-off Analysis</h2>
                    <div className="quiz-list">
                        {stats.quizSteps.map((step) => {
                            const views = parseInt(step.count, 10);
                            const percent = visitors > 0 ? (views / visitors) * 100 : 0;
                            return (
                                <div key={step.step} className="quiz-step-row">
                                    <div className="step-label">Step {step.step}</div>
                                    <div className="step-bar-container">
                                        <div className="step-bar" style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="step-val">{views} <span className="step-pct">({percent.toFixed(0)}%)</span></div>
                                </div>
                            );
                        })}
                        {stats.quizSteps.length === 0 && <div className="empty-state">No quiz data yet</div>}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="dashboard-card">
                    <h2>Program Recommendations</h2>
                    <div className="rec-list">
                        {stats.recommendations.map((rec) => (
                            <div key={rec.program} className="rec-row">
                                <span className="rec-name">{formatProgramName(rec.program)}</span>
                                <span className="rec-count">{rec.count}</span>
                            </div>
                        ))}
                        {stats.recommendations.length === 0 && <div className="empty-state">No recommendations yet</div>}
                    </div>
                </div>
            </div>

            <style>{`
                :root {
                    --bg-app: #F5F5F7;
                    --card-bg: #FFFFFF;
                    --text-primary: #1D1D1F;
                    --text-secondary: #86868B;
                    --accent-blue: #007AFF;
                }

                .dashboard-container {
                    padding: 40px;
                    max-width: 1400px;
                    margin: 0 auto;
                    background-color: var(--bg-app);
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    color: var(--text-primary);
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 40px;
                }

                h1 {
                    font-size: 32px;
                    font-weight: 700;
                    margin: 0 0 8px 0;
                    letter-spacing: -0.02em;
                }

                .subtitle {
                    color: var(--text-secondary);
                    font-size: 14px;
                    font-weight: 500;
                }

                .status-badge {
                    background: rgba(52, 199, 89, 0.1);
                    color: #34C759;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .dot {
                    width: 8px;
                    height: 8px;
                    background: currentColor;
                    border-radius: 50%;
                }

                .dot.pulse {
                    box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7);
                    animation: pulse 2s infinite;
                }

                /* Bento Grid */
                .bento-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }

                .dashboard-split {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }

                @media (max-width: 900px) {
                    .dashboard-split {
                        grid-template-columns: 1fr;
                    }
                }

                .dashboard-card {
                    background: var(--card-bg);
                    border-radius: 18px;
                    padding: 24px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
                    border: 1px solid rgba(0,0,0,0.05);
                }

                .metric-card {
                    background: var(--card-bg);
                    border-radius: 18px;
                    padding: 24px;
                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
                    border: 1px solid rgba(0,0,0,0.05);
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 140px;
                }

                .metric-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    color: var(--text-secondary);
                    font-size: 14px;
                    font-weight: 500;
                }

                .metric-val {
                    font-size: 36px;
                    font-weight: 700;
                    letter-spacing: -0.02em;
                    margin-top: 8px;
                }

                .metric-trend {
                    margin-top: auto;
                    font-size: 13px;
                    font-weight: 600;
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 8px;
                    background: #f5f5f7;
                    width: fit-content;
                }

                .metric-trend.green { color: #34C759; background: rgba(52, 199, 89, 0.1); }
                .metric-trend.orange { color: #FF9500; background: rgba(255, 149, 0, 0.1); }

                h2 {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 20px;
                    color: var(--text-primary);
                }

                /* Funnel */
                .funnel-chart {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .funnel-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .funnel-label {
                    width: 120px;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-secondary);
                }

                .funnel-bar-bg {
                    flex: 1;
                    height: 32px;
                    background: #f5f5f7;
                    border-radius: 8px;
                    overflow: hidden;
                    position: relative;
                }

                .funnel-bar {
                    height: 100%;
                    border-radius: 8px 0 0 8px;
                    transition: width 1s ease-out;
                }

                .funnel-val {
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 12px;
                    font-weight: 600;
                    color: rgba(0,0,0,0.6);
                }
                
                .funnel-count {
                    width: 40px;
                    text-align: right;
                    font-weight: 700;
                }

                /* Split Chart */
                .split-bar {
                    display: flex;
                    height: 48px;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 16px;
                }
                .split-segment {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                }
                .split-segment.manual { background: #007AFF; }
                .split-segment.quiz { background: #5856D6; }
                .split-segment strong { font-size: 16px; margin-top: 2px; }

                .split-legend {
                    display: flex;
                    gap: 16px;
                    justify-content: center;
                    font-size: 13px;
                    color: var(--text-secondary);
                }
                .legend-item { display: flex; align-items: center; gap: 6px; }
                .dot.manual { background: #007AFF; }
                .dot.quiz { background: #5856D6; }

                /* Quiz Steps */
                .quiz-step-row {
                    display: flex;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 13px;
                }
                .step-label { width: 50px; color: var(--text-secondary); }
                .step-bar-container { flex: 1; height: 8px; background: #f5f5f7; border-radius: 4px; overflow: hidden; margin: 0 12px; }
                .step-bar { height: 100%; background: #8E8E93; border-radius: 4px; }
                .step-val { width: 60px; text-align: right; font-weight: 600; }
                .step-pct { color: var(--text-secondary); font-weight: 400; font-size: 11px; margin-left: 4px; }

                /* Recommendations */
                .rec-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #f5f5f7;
                    font-size: 14px;
                }
                .rec-row:last-child { border-bottom: none; }
                .rec-name { font-weight: 500; }
                .rec-count { font-weight: 700; color: var(--accent-blue); background: rgba(0, 122, 255, 0.1); padding: 2px 8px; border-radius: 6px; }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-secondary);
                    font-style: italic;
                }

                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(52, 199, 89, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(52, 199, 89, 0); }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .delay-100 { animation-delay: 0.1s; }
                .delay-200 { animation-delay: 0.2s; }
                .delay-300 { animation-delay: 0.3s; }
            `}</style>
        </div>
    );
};

// --- Sub-components ---

const MetricCard = ({ label, value, icon, trend, trendColor }) => (
    <div className="metric-card">
        <div className="metric-header">
            <span>{label}</span>
            <span style={{ fontSize: '20px' }}>{icon}</span>
        </div>
        <div className="metric-val">{value}</div>
        {trend && <div className={`metric-trend ${trendColor || ''}`}>{trend}</div>}
    </div>
);

const FunnelStep = ({ label, count, total, color }) => {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="funnel-row">
            <span className="funnel-label">{label}</span>
            <div className="funnel-bar-bg">
                <div
                    className="funnel-bar"
                    style={{ width: `${percent}%`, background: color }}
                />
                <span className="funnel-val">{percent.toFixed(0)}%</span>
            </div>
            <span className="funnel-count">{count}</span>
        </div>
    );
};

const formatProgramName = (slug) => {
    if (!slug) return 'Unknown';
    return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export default StatsDashboard;
