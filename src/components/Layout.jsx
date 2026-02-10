import React from 'react';
import logo from '../assets/logo.png';
import background from '../assets/background.png';

const Layout = ({ children, contentMaxWidth = '600px' }) => {
  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} />


      {/* Content Layer */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo - 60px from top */}
        <header style={{
          paddingTop: '60px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img
            src={logo}
            alt="Barn Gym"
            style={{
              width: '80px',
              height: 'auto'
            }}
          />
        </header>

        {/* Main Content - Vertically Centered */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: contentMaxWidth,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          transition: 'max-width 0.3s ease'
        }}>
          {children}
        </main>

        {/* Bottom Spacer */}
        <div style={{ height: '40px' }} />
      </div>
    </div>
  );
};

export default Layout;
