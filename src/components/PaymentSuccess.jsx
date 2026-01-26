import React, { useEffect } from 'react';

const PaymentSuccess = () => {
    useEffect(() => {
        // You might want to poll the backend here to confirm checking is done
        // Or just redirect to Trainerize/Community after a few seconds
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px',
            textAlign: 'center',
            minHeight: '60vh'
        }} className="fade-in-up">
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                marginBottom: '32px'
            }}>
                ✓
            </div>

            <h2 style={{
                fontSize: '48px',
                marginBottom: '24px',
                fontFamily: 'var(--font-heading)'
            }}>Payment Successful!</h2>

            <p style={{
                fontSize: '20px',
                color: 'var(--color-text-secondary)',
                marginBottom: '48px',
                maxWidth: '600px'
            }}>
                Your 7-day free trial has started. We are setting up your Trainerize account now.
                Please check your email for login instructions.
            </p>

            <button className="btn-primary" style={{ width: '200px' }} onClick={() => window.location.href = '/'}>
                Back to Home
            </button>
        </div>
    );
};

export default PaymentSuccess;
