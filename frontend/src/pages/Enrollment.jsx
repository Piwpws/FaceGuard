import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, Save } from 'lucide-react';
import axios from 'axios';

const Enrollment = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'Student'
  });
  
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const webcamRef = useRef(null);

  const capture = useCallback(() => {
    if (images.length < 3) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImages(prev => [...prev, imageSrc]);
    }
  }, [webcamRef, images]);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (images.length < 3) {
      setErrorMsg("Please capture 3 images for accurate recognition.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await axios.post('http://localhost:8000/api/enrollment/enroll', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        images: images
      });
      
      if (response.data.status === 'success') {
          setSuccessMsg(`User enrolled successfully! ID Number: ${response.data.id_number}`);
          setFormData({ firstName: '', lastName: '', role: 'Student' });
          setImages([]);
      } else {
          setErrorMsg(response.data.detail || "Enrollment failed.");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "An error occurred during enrollment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Enroll New Person</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
        <div className="glass-card">
          <h2 className="section-title">Personal Details</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text" 
                name="firstName" 
                className="form-input" 
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text" 
                name="lastName" 
                className="form-input" 
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select 
                name="role" 
                className="form-select"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="Student">Student</option>
                <option value="Faculty">Faculty</option>
                <option value="Part Timer">Part Timer</option>
                <option value="Utility">Utility</option>
              </select>
            </div>
            
            {errorMsg && <div style={{ color: 'var(--error)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.25rem' }}>{errorMsg}</div>}
            {successMsg && <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.5rem', background: 'var(--success-bg)', borderRadius: '0.25rem' }}>{successMsg}</div>}

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem' }}
              disabled={isSubmitting || images.length < 3}
            >
              {isSubmitting ? <div className="loader"></div> : <><Save size={18} /> Enroll User</>}
            </button>
            {images.length < 3 && <p style={{color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center'}}>Capture 3 images to enroll</p>}
          </form>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="section-title">Face Registration ({images.length}/3)</h2>
          
          <div className="camera-wrapper" style={{ flex: 1, maxHeight: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '1rem' }}>
             <button 
                type="button" 
                className="btn btn-success" 
                onClick={capture}
                disabled={images.length >= 3 || !formData.firstName.trim() || !formData.lastName.trim()}
                title={(!formData.firstName.trim() || !formData.lastName.trim()) ? "Please enter your First Name and Last Name first" : ""}
              >
                <Camera size={18} /> Capture Face
              </button>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setImages([])}
                disabled={images.length === 0}
              >
                <RefreshCw size={18} /> Reset
              </button>
          </div>
          
          {(!formData.firstName.trim() || !formData.lastName.trim()) && (
             <p style={{ color: 'var(--error)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
                 * Please fill in your Personal Details first to enable face capture.
             </p>
          )}

          {images.length > 0 && (
            <div className="capture-grid" style={{ marginTop: '2rem' }}>
              {images.map((img, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img src={img} alt={`Capture ${index + 1}`} className="captured-img" />
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Enrollment;
