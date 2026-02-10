import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
    } catch {
      localStorage.removeItem('token');
      navigate('/login');
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
      <div className="dashboard">
        <p className="dashboard-loading">Loading...</p>
      </div>
    );
  }

  const { user, health } = data;

  return (
    <div className="dashboard">
      {/* Navbar */}
      <nav className="dashboard-nav">
        <h1 className="nav-logo">LifeSync</h1>
        <div className="nav-right">
          <span className="nav-user">{user.firstName} {user.lastName}</span>
          <button className="btn btn-nav-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Content */}
      <main className="dashboard-content">
        <h2 className="dashboard-greeting">Welcome back, {user.firstName}!</h2>

        <div className="dashboard-grid">
          {/* Profile Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">Profile</h3>
            <div className="dash-card-body">
              <div className="profile-item">
                <span className="profile-label">Name</span>
                <span className="profile-value">{user.firstName} {user.lastName}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email</span>
                <span className="profile-value">{user.email}</span>
              </div>
              {user.gender && (
                <div className="profile-item">
                  <span className="profile-label">Gender</span>
                  <span className="profile-value">{user.gender === 'male' ? '♂ Male' : '♀ Female'}</span>
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

          {/* Body Stats Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">Body Stats</h3>
            <div className="dash-card-body">
              {user.height ? (
                <div className="profile-item">
                  <span className="profile-label">Height</span>
                  <span className="profile-value">{user.height} cm</span>
                </div>
              ) : (
                <div className="profile-item">
                  <span className="profile-label">Height</span>
                  <span className="profile-value empty">Not set</span>
                </div>
              )}
              {user.weight ? (
                <div className="profile-item">
                  <span className="profile-label">Weight</span>
                  <span className="profile-value">{user.weight} kg</span>
                </div>
              ) : (
                <div className="profile-item">
                  <span className="profile-label">Weight</span>
                  <span className="profile-value empty">Not set</span>
                </div>
              )}
            </div>
          </div>

          {/* BMI Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">BMI</h3>
            <div className="dash-card-body bmi-body">
              {health.bmi ? (
                <>
                  <span className="bmi-value">{health.bmi}</span>
                  <span className={`bmi-category bmi-${health.bmiCategory.toLowerCase()}`}>
                    {health.bmiCategory}
                  </span>
                </>
              ) : (
                <p className="empty">Add height & weight to calculate BMI</p>
              )}
            </div>
          </div>

          {/* Quick Info Card */}
          <div className="dash-card">
            <h3 className="dash-card-title">Account</h3>
            <div className="dash-card-body">
              <div className="profile-item">
                <span className="profile-label">User ID</span>
                <span className="profile-value id-value">{user.userId.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="edit-profile-btn-container">
          <button className="btn btn-edit-profile" onClick={() => navigate('/profile/edit')}>
            ✏️ Edit Profile
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
