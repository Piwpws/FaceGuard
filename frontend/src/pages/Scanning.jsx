import React, { useRef, useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const Scanning = () => {
  const webcamRef = useRef(null);
  const [successEvent, setSuccessEvent] = useState(null);
  const [isScanning, setIsScanning] = useState(true);

  const captureAndSend = useCallback(async () => {
    if (!isScanning || !webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const response = await axios.post('http://localhost:8000/api/scanning/scan', {
        image: imageSrc
      });
      
      if (response.data.status === 'success') {
          showSuccess(response.data);
          // Pause scanning shortly to avoid multiple hits
          setIsScanning(false);
          setTimeout(() => setIsScanning(true), 5000);
      }
    } catch (error) {
       // Silently ignore errors or log them depending on need
       console.log("Scan attempt failed", error);
    }
  }, [webcamRef, isScanning]);

  useEffect(() => {
    // Send frames to backend every 1.5 seconds if scanning is active
    const timer = setInterval(() => {
        captureAndSend();
    }, 1500);
    return () => clearInterval(timer);
  }, [captureAndSend]);

  const showSuccess = (data) => {
    setSuccessEvent(data);
    setTimeout(() => {
      setSuccessEvent(null);
    }, 4500);
  };

  return (
    <div className="scanning-container">
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Live Attendance Scanning</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Please face the camera directly for attendance log.</p>
      </div>
      
      <div className="camera-wrapper">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user" }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
        <div className="camera-target"></div>
        
        {successEvent && (
            <div className="recognition-overlay" style={{ background: 'rgba(16, 185, 129, 0.9)' }}>
                <CheckCircle size={48} style={{ color: 'white', marginBottom: '0.5rem' }} />
                
                <div className="overlay-name">{successEvent.user.name} (Face Matched)</div>
                <span className={`badge ${successEvent.user.role.toLowerCase().replace(' ', '-')}`} style={{ color: 'white' }}>
                    {successEvent.user.role}
                </span>
                <div className="overlay-meta" style={{ marginTop: '0.5rem' }}>
                    <span>{successEvent.user.time}</span>
                    <span>{successEvent.user.date}</span>
                </div>
            </div>
        )}
      </div>

      <div className="glass-card" style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>System Status</h3>
              {isScanning ? (
                <p style={{ margin: 0, color: 'var(--success)', fontSize: '0.875rem' }}>● Online & Scanning active</p>
              ) : (
                <p style={{ margin: 0, color: '#fbbf24', fontSize: '0.875rem' }}>● Paused (Processing)</p>
              )}
          </div>
          <Camera size={32} style={{ color: 'var(--text-secondary)' }}/>
      </div>
    </div>
  );
};

export default Scanning;
