// in src/pages/SubmitReportPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';
import './LoginPage.css'; // Reuse styles

function SubmitReportPage() {
    const [hazardType, setHazardType] = useState('HIGH_WAVES');
    const [description, setDescription] = useState('');
    const [media, setMedia] = useState(null);
    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const auth = useAuth();

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => setMessage('Could not get location. Please enable it.')
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            setMessage('Location is required to submit a report.');
            return;
        }
        setIsSubmitting(true);
        setMessage('Submitting report...');

        const formData = new FormData();
        formData.append('latitude', location.latitude);
        formData.append('longitude', location.longitude);
        formData.append('hazard_type', hazardType);
        formData.append('description', description);
        if (media) {
            formData.append('media', media);
        }

        // This URL must exactly match the endpoint in main.py
        const response = await fetch(`${API_URL}/api/reports/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.token}` },
            body: formData,
        });

        setIsSubmitting(false);
        if (response.ok) {
            setMessage('Report submitted successfully!');
            setDescription('');
            setMedia(null);
            document.getElementById('file-input').value = "";
            
            // NEW: Trigger the global refetch signal
            auth.triggerRefetch();
        } else {
            setMessage('Failed to submit report. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Report an Ocean Hazard</h2>
                {location ? (
                    <p>Location Detected: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
                ) : (
                    <p>Detecting location...</p>
                )}
                <div className="form-group">
                    <label>Hazard Type:</label>
                    <select value={hazardType} onChange={(e) => setHazardType(e.target.value)}>
                        <option value="HIGH_WAVES">High Waves</option>
                        <option value="COASTAL_FLOODING">Coastal Flooding</option>
                        <option value="COASTAL_DAMAGE">Coastal Damage</option>
                        <option value="SWELL_SURGES">Swell Surges</option>
                        <option value="UNUSUAL_TIDES">Unusual Tides</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Description:</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Upload Media (Photo/Video):</label>
                    <input type="file" id="file-input" onChange={(e) => setMedia(e.target.files[0])} />
                </div>
                {message && <p>{message}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
            </form>
        </div>
    );
}

export default SubmitReportPage;