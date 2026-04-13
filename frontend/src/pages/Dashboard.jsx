import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import NotificationCenter from '../components/NotificationCenter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Veriler yuklenirken bir hata olustu. Lutfen sayfayi yenileyin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard" data-testid="dashboard-page">
        <p className="dashboard-loading" data-testid="dashboard-loading">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard" data-testid="dashboard-page">
        <p className="dashboard-loading" data-testid="dashboard-error">{error}</p>
      </div>
    );
  }

  const { user, health } = data;

  return (
    <div className="dashboard" data-testid="dashboard-page">
      <NotificationCenter />

      <nav className="dashboard-nav">
        <h1 className="nav-logo">LifeSync</h1>
        <div className="nav-right">
          <span className="nav-user" data-testid="nav-user">{user.firstName} {user.lastName}</span>
          <button className="btn btn-nav-logout" data-testid="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="dashboard-content">
        <h2 className="dashboard-greeting" data-testid="dashboard-greeting">Welcome back, {user.firstName}!</h2>

        <div className="dashboard-grid">
          <div className="dash-card">
            <h3 className="dash-card-title">Profile</h3>
            <div className="dash-card-body">
              <div className="profile-item">
                <span className="profile-label">Name</span>
                <span className="profile-value">{user.firstName} {user.lastName}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email</span>
                <span className="profile-value" data-testid="profile-email">{user.email}</span>
              </div>
              {user.gender && (
                <div className="profile-item">
                  <span className="profile-label">Gender</span>
                  <span className="profile-value">{user.gender === 'male' ? 'Male' : 'Female'}</span>
                </div>
              )}
              {user.age && (
                <div className="profile-item">
                  <span className="profile-label">Age</span>
                  <span className="profile-value">{user.age} years</span>
                </div>
              )}
            </div>
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title">Body Stats</h3>
            <div className="dash-card-body">
              {user.height ? (
                <div className="profile-item">
                  <span className="profile-label">Height</span>
                  <span className="profile-value" data-testid="profile-height">{user.height} cm</span>
                </div>
              ) : (
                <div className="profile-item">
                  <span className="profile-label">Height</span>
                  <span className="profile-value empty" data-testid="profile-height-empty">Not set</span>
                </div>
              )}
              {user.weight ? (
                <div className="profile-item">
                  <span className="profile-label">Weight</span>
                  <span className="profile-value" data-testid="profile-weight">{user.weight} kg</span>
                </div>
              ) : (
                <div className="profile-item">
                  <span className="profile-label">Weight</span>
                  <span className="profile-value empty" data-testid="profile-weight-empty">Not set</span>
                </div>
              )}
            </div>
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title">BMI</h3>
            <div className="dash-card-body bmi-body">
              {health.bmi ? (
                <>
                  <span className="bmi-value" data-testid="bmi-value">{health.bmi}</span>
                  <span className={`bmi-category bmi-${health.bmiCategory.toLowerCase()}`}>
                    {health.bmiCategory}
                  </span>
                </>
              ) : (
                <p className="empty" data-testid="bmi-empty">Add height & weight to calculate BMI</p>
              )}
            </div>
          </div>
        </div>

        <div className="edit-profile-btn-container">
          <button className="btn btn-edit-profile" data-testid="edit-profile-button" onClick={() => navigate('/profile/edit')}>
            Edit Profile
          </button>
          <button className="btn btn-survey" data-testid="survey-button" onClick={() => navigate('/survey')}>
            Saglik Anketi
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
