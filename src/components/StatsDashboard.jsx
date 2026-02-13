import React, { useState, useEffect } from 'react';

const StatsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats');
            if (!res.ok) throw new Error('Failed to fetch stats');
            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading stats...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    if (!stats) return null;

    return (
        <div className="stats-dashboard" style={{
            padding: '40px',
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'white',
            minHeight: '100vh',
            color: '#333'
        }}>
            <h1 style={{ fontSize: '32px', marginBottom: '40px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                Onboarding Analytics
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>

                {/* Funnel Overview */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>Funnel Overview</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Event</th>
                                <th style={{ padding: '8px' }}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.funnel.map((item) => (
                                <tr key={item.event_type} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '8px' }}>{item.event_type}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Recommendations */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>Program Recommendations</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Program</th>
                                <th style={{ padding: '8px' }}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.recommendations.map((item) => (
                                <tr key={item.program} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '8px' }}>{item.program || 'Unknown'}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quiz Drop-off */}
                <div className="stat-card">
                    <h2 style={{ fontSize: '20px', marginBottom: '20px', fontWeight: 600 }}>Quiz Step Views</h2>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '8px' }}>Step</th>
                                <th style={{ padding: '8px' }}>Views</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.quizSteps.map((item) => (
                                <tr key={item.step} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <td style={{ padding: '8px' }}>Step {item.step}</td>
                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .stat-card {
                    background: #fff;
                    border: 1px solid #e5e5e5;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    );
};

export default StatsDashboard;
