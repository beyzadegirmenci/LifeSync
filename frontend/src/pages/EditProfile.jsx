import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function EditProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    password: '',
    passwordConfirm: '',
    height: '',
    weight: '',
    age: '',
    gender: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const u = res.data.user;
      setUser(u);
      setForm({
        password: '',
        passwordConfirm: '',
        height: u.height || '',
        weight: u.weight || '',
        age: u.age || '',
        gender: u.gender || ''
      });
    } catch {
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.password && form.password !== form.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {};

      if (form.password) payload.password = form.password;
      if (form.height !== '') payload.height = parseInt(form.height);
      if (form.weight !== '') payload.weight = parseInt(form.weight);
      if (form.age !== '') payload.age = parseInt(form.age);
      if (form.gender !== '') payload.gender = form.gender;

      
      if (form.height === '') payload.height = null;
      if (form.weight === '') payload.weight = null;
      if (form.age === '') payload.age = null;
      if (form.gender === '') payload.gender = null;

      const res = await axios.put(`${API_URL}/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(res.data.user);
      setForm(prev => ({ ...prev, password: '', passwordConfirm: '' }));
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <p className="dashboard-loading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <h1 className="nav-logo">LifeSync</h1>
        <div className="nav-right">
          <span className="nav-user">{user.firstName} {user.lastName}</span>
          <button className="btn btn-nav-back" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="dashboard-content">
        <h2 className="dashboard-greeting">Edit Profile</h2>

        <div className="edit-profile-card">
          {/* Read-only info */}
          <div className="edit-readonly">
            <div className="readonly-item">
              <span className="readonly-label">Name</span>
              <span className="readonly-value">{user.firstName} {user.lastName}</span>
            </div>
            <div className="readonly-item">
              <span className="readonly-label">Email</span>
              <span className="readonly-value">{user.email}</span>
            </div>
          </div>

          <hr className="edit-divider" />

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form className="edit-form" onSubmit={handleSubmit}>
            {/* Password Section */}
            <div className="edit-section">
              <h3 className="edit-section-title">Change Password</h3>
              <div className="edit-row">
                <input
                  type="password"
                  name="password"
                  placeholder="New Password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={6}
                />
                <input
                  type="password"
                  name="passwordConfirm"
                  placeholder="Confirm Password"
                  value={form.passwordConfirm}
                  onChange={handleChange}
                  minLength={6}
                />
              </div>
            </div>

            {/* Body Info Section */}
            <div className="edit-section">
              <h3 className="edit-section-title">Body Info</h3>
              <div className="edit-row">
                <div className="edit-field">
                  <label>Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="Height"
                    value={form.height}
                    onChange={handleChange}
                    min={1}
                    max={300}
                  />
                </div>
                <div className="edit-field">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="Weight"
                    value={form.weight}
                    onChange={handleChange}
                    min={1}
                    max={500}
                  />
                </div>
              </div>
              <div className="edit-row">
                <div className="edit-field">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={form.age}
                    onChange={handleChange}
                    min={1}
                    max={150}
                  />
                </div>
                <div className="edit-field">
                  <label>Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Not specified</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditProfile;
