import '../styles/commonStyle.css';
import '../styles/ProfilePage.css';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

import UserAPI from '../api/UserAPI.mjs';


export default function ProfilePage({ user, setUser }) {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [allowEmailNotification, setAllowEmailNotification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    setTelegramUsername(user.telegramUsername || '');
    setAllowEmailNotification(user.allowEmailNotification === 1);
    if (user.imageUrl) setPhotoPreview(user.imageUrl);
  }, [user, navigate]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setProfilePhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoRemoved(false);
    setError('');
  };

  const handleRemovePhoto = () => {
    setPhotoRemoved(true);
    setProfilePhoto(null);
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      if (photoRemoved && user.imageUrl) {
        await UserAPI.deleteProfilePhoto();
        setPhotoPreview(null);
        setUser(prevUser => ({ ...prevUser, imageUrl: null }));
      }
      if (!photoRemoved || profilePhoto) {
        const formData = new FormData();
        if (profilePhoto && !photoRemoved) {
          formData.append('profilePhoto', profilePhoto);
        }
        formData.append('telegramUsername', telegramUsername.trim());
        formData.append('allowEmailNotification', allowEmailNotification ? 1 : 0);
        const updatedUser = await UserAPI.updateProfile(formData);
        setUser(updatedUser);
      }
      setPhotoRemoved(false);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h2>Profile Settings</h2>
        <p>Manage your account preferences and notifications</p>
      </div>
      <form className="profile-form" onSubmit={handleSubmit}>
        {/* Due colonne: foto | info */}
        <div className="profile-grid">
          {/* Colonna sinistra: Foto */}
          <div className="profile-col profile-col-photo">
            <div className="photo-upload-area">
              <div className="photo-preview-container">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile preview" className="photo-preview" />
                ) : (
                  <i className="bi bi-person-circle photo-placeholder"></i>
                )}
              </div>
              <div className="photo-upload-controls-row">
                <label htmlFor="photo-input" className="upload-button">
                  {photoPreview ? 'Change Photo' : 'Upload Photo'}
                </label>
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {photoPreview && (
                  <button
                    type="button"
                    className="remove-photo-button"
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="photo-hint">Max size: 5MB</p>
            </div>
          </div>
          {/* Colonna destra: Info utente */}
          <div className="profile-col profile-col-info">
            <div className="info-display">
              <div className="info-item">
                <label>Full Name</label>
                <div className="info-value">
                  <i className="bi bi-person-fill"></i>
                  {user.firstName} {user.lastName}
                </div>
              </div>
              <div className="info-item">
                <label>Username</label>
                <div className="info-value">
                  <i className="bi bi-at"></i>
                  {user.username}
                </div>
              </div>
              <div className="info-item">
                <label>Email</label>
                <div className="info-value">
                  <i className="bi bi-envelope-fill"></i>
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* telegram ad notificztions */}
        <div className="profile-bottom">
          <div className="form-section">
            <h3>Telegram</h3>
            <label htmlFor="telegram">Telegram Username (optional)</label>
            <input
              id="telegram"
              type="text"
              className="form-input"
              placeholder="@yourusername"
              value={telegramUsername}
              onChange={(e) => setTelegramUsername(e.target.value)}
            />
            <p className="input-hint">
              Link your Telegram account to receive notifications via telegram
            </p>
          </div>
          <div className="form-section">
            <h3>Notification Preferences</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={allowEmailNotification}
                onChange={(e) => setAllowEmailNotification(e.target.checked)}
                className="checkbox-input"
              />
              <span>Receive email notifications for report updates</span>
            </label>
          </div>
        </div>
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="save-button"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
