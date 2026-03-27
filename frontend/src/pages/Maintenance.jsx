import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import { Pencil, Camera, Trash2, X, AlertCircle, CheckCircle2, RefreshCw, Save } from 'lucide-react';

const Maintenance = () => {
  const [enrollees, setEnrollees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reenrollModalOpen, setReenrollModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [selectedEnrollee, setSelectedEnrollee] = useState(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({ firstName: '', lastName: '', role: '' });
  
  // Re-enroll State
  const [images, setImages] = useState([]);
  const webcamRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEnrollees();
  }, []);

  const fetchEnrollees = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/maintenance/enrollees');
      setEnrollees(response.data);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Failed to fetch enrollees.");
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 3000);
  };

  // --- EDIT PROFILE LOGIC ---
  const handleEditClick = (enrollee) => {
    setSelectedEnrollee(enrollee);
    setEditFormData({
      firstName: enrollee.first_name,
      lastName: enrollee.last_name,
      role: enrollee.role
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:8000/api/maintenance/enrollees/${selectedEnrollee.id_number}`, editFormData);
      showSuccess("Profile updated successfully!");
      setEditModalOpen(false);
      fetchEnrollees();
    } catch (error) {
      showError(error.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RE-ENROLL LOGIC ---
  const handleReenrollClick = (enrollee) => {
    setSelectedEnrollee(enrollee);
    setImages([]);
    setReenrollModalOpen(true);
  };

  const capture = useCallback(() => {
    if (images.length < 3) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImages(prev => [...prev, imageSrc]);
    }
  }, [webcamRef, images]);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleReenrollSubmit = async () => {
    if (images.length < 3) return;
    setIsSubmitting(true);
    try {
      await axios.put(`http://localhost:8000/api/maintenance/enrollees/${selectedEnrollee.id_number}/re-enroll`, { images });
      showSuccess("Images re-enrolled successfully!");
      setReenrollModalOpen(false);
    } catch (error) {
       showError(error.response?.data?.detail || "Failed to re-enroll images.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DELETE LOGIC ---
  const handleDeleteClick = (enrollee) => {
    setSelectedEnrollee(enrollee);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`http://localhost:8000/api/maintenance/enrollees/${selectedEnrollee.id_number}`);
      showSuccess("Record deleted successfully!");
      setDeleteModalOpen(false);
      fetchEnrollees();
    } catch (error) {
       showError(error.response?.data?.detail || "Failed to delete record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="maintenance-page" style={{ paddingBottom: '2rem' }}>
      <h1 className="page-title">File Maintenance</h1>

      {errorMsg && (
        <div style={{ color: 'var(--error)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div style={{ color: 'var(--success)', padding: '1rem', background: 'var(--success-bg)', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><div className="loader"></div></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '1rem' }}>ID Number</th>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Role</th>
                <th style={{ padding: '1rem' }}>Date Enrolled</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrollees.map(enrollee => (
                <tr key={enrollee.id_number} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>{enrollee.id_number}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{enrollee.first_name} {enrollee.last_name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.875rem',
                      background: 'rgba(255,255,255,0.1)' 
                    }}>
                      {enrollee.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{new Date(enrollee.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.5rem', width: 'auto' }} 
                      title="Edit Profile"
                      onClick={() => handleEditClick(enrollee)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem', width: 'auto' }} 
                      title="Re-enroll Face"
                      onClick={() => handleReenrollClick(enrollee)}
                    >
                      <Camera size={16} />
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ padding: '0.5rem', width: 'auto', borderColor: 'var(--error)', color: 'var(--error)' }} 
                      title="Delete Record"
                      onClick={() => handleDeleteClick(enrollee)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {enrollees.length === 0 && (
                 <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>No records found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* --- EDIT MODAL --- */}
      {editModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Edit Profile</h2>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-input" value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-input" value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Part Timer">Part Timer</option>
                  <option value="Utility">Utility</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
                  {isSubmitting ? <div className="loader"></div> : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RE-ENROLL MODAL --- */}
      {reenrollModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={{ ...modalContentStyle, width: '600px', maxWidth: '95%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Re-enroll Face: {selectedEnrollee?.first_name}</h2>
              <button onClick={() => setReenrollModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div className="camera-wrapper" style={{ maxHeight: '300px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user" }}
                  style={{ width: '100%', objectFit: 'cover' }}
                />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                 <button type="button" className="btn btn-success" onClick={capture} disabled={images.length >= 3}>
                  <Camera size={18} /> Capture ({images.length}/3)
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setImages([])} disabled={images.length === 0}>
                  <RefreshCw size={18} /> Reset
                </button>
              </div>

              {images.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                  {images.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <img src={img} alt={`Capture ${index}`} style={{ width: '100%', borderRadius: '0.5rem' }} />
                      <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', background: 'rgba(239, 68, 68, 0.8)', border: 'none', color: 'white', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer' }}>×</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setReenrollModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleReenrollSubmit} style={{ flex: 1 }} disabled={isSubmitting || images.length < 3}>
                   {isSubmitting ? <div className="loader"></div> : <><Save size={18} /> Update Face Data</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRM MODAL --- */}
      {deleteModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="glass-card" style={modalContentStyle}>
             <div style={{ textAlign: 'center', padding: '1rem 0' }}>
               <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '1rem' }} />
               <h2 className="section-title">Confirm Deletion</h2>
               <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
                 Are you sure you want to delete the record for <strong>{selectedEnrollee?.first_name} {selectedEnrollee?.last_name}</strong>? This action cannot be undone.
               </p>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setDeleteModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                  <button type="button" className="btn" onClick={confirmDelete} disabled={isSubmitting} style={{ flex: 1, backgroundColor: 'var(--error)', color: 'white' }}>
                    {isSubmitting ? <div className="loader"></div> : "Yes, Delete"}
                  </button>
               </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Inline styles for modals to keep it standalone
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem'
};

const modalContentStyle = {
  width: '400px',
  maxWidth: '100%',
  animation: 'slideUp 0.3s ease-out'
};

export default Maintenance;
