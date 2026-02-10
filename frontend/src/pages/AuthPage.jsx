import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    firstName: '',
    lastName: '',
    height: '',
    weight: '',
    age: '',
    gender: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && form.password !== form.passwordConfirm) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            height: form.height ? parseInt(form.height) : null,
            weight: form.weight ? parseInt(form.weight) : null,
            age: form.age ? parseInt(form.age) : null,
            gender: form.gender || null
          };

      const res = await axios.post(`${API_URL}${endpoint}`, payload);

      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setForm({ email: '', password: '', passwordConfirm: '', firstName: '', lastName: '', height: '', weight: '', age: '', gender: '' });
  };

  return (
    <div className="app">
      <div className="auth-container">
        <div className="auth-card">
          <h1>LifeSync</h1>
          <p className="subtitle">{isLogin ? 'Sign in to your account' : 'Create your account'}</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="name-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  required={!isLogin}
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />

            {!isLogin && (
              <input
                type="password"
                name="passwordConfirm"
                placeholder="Confirm Password"
                value={form.passwordConfirm}
                onChange={handleChange}
                required={!isLogin}
                minLength={6}
              />
            )}

            {!isLogin && (
              <>
                <p className="section-label">Health Info (optional)</p>
                <div className="health-row">
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
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
                <div className="health-row">
                  <input
                    type="number"
                    name="height"
                    placeholder="Height (cm)"
                    value={form.height}
                    onChange={handleChange}
                    min={1}
                    max={300}
                  />
                  <input
                    type="number"
                    name="weight"
                    placeholder="Weight (kg)"
                    value={form.weight}
                    onChange={handleChange}
                    min={1}
                    max={500}
                  />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button className="toggle-btn" onClick={toggleMode}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
