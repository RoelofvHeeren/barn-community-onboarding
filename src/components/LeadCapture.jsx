import React, { useState } from 'react';

const LeadCapture = ({ onNext, submitLabel = "Begin Assessment" }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.firstName && formData.lastName && formData.email) {
            // Join names for backward compatibility if needed, but also pass raw
            onNext({
                ...formData,
                name: `${formData.firstName} ${formData.lastName}`.trim()
            });
        }
    };

    return (
        <div className="glass-card fade-in-up" style={{
            padding: '64px',
            width: '100%',
            textAlign: 'center'
        }}>
            <h2 style={{
                fontSize: '32px',
                lineHeight: '44px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 400,
                marginBottom: '16px',
                color: 'var(--color-text-primary)'
            }}>
                Let's get to know you
            </h2>
            <p style={{
                fontSize: '16px',
                color: 'var(--color-text-secondary)',
                marginBottom: '48px',
                maxWidth: '400px',
                margin: '0 auto 48px'
            }}>
                Start your journey with the Barn Community. Tell us who you are so we can personalize your experience.
            </p>

            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                maxWidth: '400px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '8px',
                            color: 'var(--color-text-tertiary)'
                        }}>First Name</label>
                        <input
                            type="text"
                            required
                            placeholder="John"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '8px',
                            color: 'var(--color-text-tertiary)'
                        }}>Last Name</label>
                        <input
                            type="text"
                            required
                            placeholder="Doe"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '16px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '8px',
                        color: 'var(--color-text-tertiary)'
                    }}>Email Address</label>
                    <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                    <p style={{
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--color-primary)',
                        lineHeight: '1.4',
                        fontWeight: 500
                    }}>
                        ⚠️ Important: Please use the same email you used to sign up for the Barn Community on Circle.
                    </p>
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: '8px',
                        color: 'var(--color-text-tertiary)'
                    }}>Phone Number</label>
                    <input
                        type="tel"
                        required
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            background: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                        onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{
                        marginTop: '16px',
                        padding: '20px'
                    }}
                >
                    {submitLabel}
                </button>
            </form>
        </div>
    );
};

export default LeadCapture;
