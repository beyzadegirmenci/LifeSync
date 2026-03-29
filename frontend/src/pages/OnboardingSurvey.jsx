import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OnboardingSurvey.css';

const API_URL = 'http://localhost:5000/api';

function OnboardingSurvey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [classification, setClassification] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [showDietPlanModal, setShowDietPlanModal] = useState(false);
  const [dietPlanDuration, setDietPlanDuration] = useState('weekly');
  const [dietPlan, setDietPlan] = useState(null);
  const [dietPlanLoading, setDietPlanLoading] = useState(false);
  const [showExercisePlanModal, setShowExercisePlanModal] = useState(false);
  const [exercisePlanDuration, setExercisePlanDuration] = useState('weekly');
  const [exercisePlan, setExercisePlan] = useState(null);
  const [exercisePlanLoading, setExercisePlanLoading] = useState(false);

  const [form, setForm] = useState({
    age: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    goal: '',
    diet_preference: '',
    allergy_or_restriction: '',
    activity_level: '3',
    exercise_days_per_week: '',
    sleep_hours: '',
    water_liters_per_day: '',
    screen_hours_per_day: '',
    health_note: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!form.age || !form.gender || !form.height_cm || !form.weight_kg || 
        !form.goal || !form.diet_preference || !form.exercise_days_per_week || 
        !form.sleep_hours || !form.water_liters_per_day || !form.screen_hours_per_day) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return false;
    }

    if (form.age < 10 || form.age > 100) {
      setError('Yaş 10-100 arasında olmalıdır.');
      return false;
    }

    if (form.height_cm < 100 || form.height_cm > 250) {
      setError('Boy 100-250 cm arasında olmalıdır.');
      return false;
    }

    if (form.weight_kg < 30 || form.weight_kg > 300) {
      setError('Kilo 30-300 kg arasında olmalıdır.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/dashboard/survey`,
        {
          age: parseInt(form.age),
          gender: form.gender,
          height_cm: parseFloat(form.height_cm),
          weight_kg: parseFloat(form.weight_kg),
          goal: form.goal,
          diet_preference: form.diet_preference,
          allergy_or_restriction: form.allergy_or_restriction || 'yok',
          activity_level: parseInt(form.activity_level),
          exercise_days_per_week: parseInt(form.exercise_days_per_week),
          sleep_hours: parseFloat(form.sleep_hours),
          water_liters_per_day: parseFloat(form.water_liters_per_day),
          screen_hours_per_day: parseFloat(form.screen_hours_per_day),
          health_note: form.health_note || 'yok'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setClassification(response.data.classification);
      setRecommendation(response.data.recommendation);
      setShowResults(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const generateDietPlan = async () => {
    setDietPlanLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/dashboard/diet-plan`,
        {
          profile: form,
          classification,
          duration: dietPlanDuration
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDietPlan(response.data.diet_plan);
      setShowDietPlanModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Diyet planı oluşturulurken bir hata oluştu.');
    } finally {
      setDietPlanLoading(false);
    }
  };

  const generateExercisePlan = async () => {
    setExercisePlanLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/dashboard/exercise-plan`,
        {
          profile: form,
          classification,
          duration: exercisePlanDuration
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setExercisePlan(response.data.exercise_plan);
      setShowExercisePlanModal(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Egzersiz planı oluşturulurken bir hata oluştu.');
    } finally {
      setExercisePlanLoading(false);
    }
  };

  // Diet Plan View
  if (showResults && dietPlan) {
    return (
        <div className="survey-container results-view">
          <div className="results-card">
          <h2>🍽️ {dietPlanDuration === 'daily' ? 'Günlük' : dietPlanDuration === 'weekly' ? 'Haftalık' : 'Aylık'} Diyet Planı</h2>
          
          <div className="diet-plan-content">
            {dietPlan.raw_text.split('\n').map((line, idx) => (
              line.trim() ? <p key={idx}>{line}</p> : <br key={idx} />
            ))}
          </div>

          <div className="results-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setDietPlan(null);
                setDietPlanDuration('weekly');
              }}
            >
              Başka Plan Oluştur
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExercisePlanModal(true)}
            >
              💪 Egzersiz Planı Oluştur
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Exercise Plan View
  if (showResults && exercisePlan) {
    return (
      <div className="survey-container results-view">
        <div className="results-card">
          <h2>💪 {exercisePlanDuration === 'daily' ? 'Günlük' : exercisePlanDuration === 'weekly' ? 'Haftalık' : 'Aylık'} Egzersiz Planı</h2>
          
          <div className="diet-plan-content">
            {exercisePlan.raw_text.split('\n').map((line, idx) => (
              line.trim() ? <p key={idx}>{line}</p> : <br key={idx} />
            ))}
          </div>

          <div className="results-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setExercisePlan(null);
                setExercisePlanDuration('weekly');
              }}
            >
              Başka Plan Oluştur
                Dashboard'a Dön
              </button>
            </div>
          </div>
        </div>
      );
    }

  // Survey Results View
  if (showResults) {
    return (
      <div className="survey-container results-view">
        <div className="results-card">
          <h2>Sağlık Değerlendirmesi Sonuçları</h2>
          
          <div className="results-section">
            <h3>Özet</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">BMI</span>
                <span className="value">{classification.bmi}</span>
              </div>
              <div className="summary-item">
                <span className="label">Seviye</span>
                <span className={`value level-badge level-${classification.level.toLowerCase()}`}>
                  {classification.level}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Skor</span>
                <span className="value">{classification.score}</span>
              </div>
            </div>
          </div>

          <div className="results-section">
            <h3>Değerlendirme Nedenleri</h3>
            <div className="reasons-list">
              {classification.reasons.map((reason, idx) => (
                <div key={idx} className="reason-item">
                  <span className="reason-bullet">•</span>
                  <span className="reason-text">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="results-section">
            <h3>Kişiselleştirilmiş Öneriler</h3>
            <div className="recommendations-box">
              <div className="recommendation-meta">
                <span>Model: {recommendation.metadata.model}</span>
              </div>
              <div className="recommendation-content">
                {recommendation.raw_text.split('\n').map((line, idx) => (
                  line.trim() ? <p key={idx}>{line}</p> : <br key={idx} />
                ))}
              </div>
            </div>
          </div>

          <div className="results-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard'a Dön
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowDietPlanModal(true)}
            >
              🍽️ Diyet Planı Oluştur
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExercisePlanModal(true)}
            >
              💪 Egzersiz Planı Oluştur
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setShowResults(false);
                setClassification(null);
                setRecommendation(null);
              }}
            >
              Tekrar Başla
            </button>
          </div>
        </div>

        {/* Diet Plan Modal */}
        {showDietPlanModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Diyet Planı Süresi Seçin</h3>
              <p>Program için hangi zaman aralığını tercih edersiniz?</p>
              
              {error && <div className="error-message">{error}</div>}

              <div className="diet-plan-options">
                <button
                  className={`diet-option ${dietPlanDuration === 'daily' ? 'active' : ''}`}
                  onClick={() => setDietPlanDuration('daily')}
                  disabled={dietPlanLoading}
                >
                  <span className="option-icon">📅</span>
                  <span className="option-label">Günlük</span>
                </button>
                <button
                  className={`diet-option ${dietPlanDuration === 'weekly' ? 'active' : ''}`}
                  onClick={() => setDietPlanDuration('weekly')}
                  disabled={dietPlanLoading}
                >
                  <span className="option-icon">📊</span>
                  <span className="option-label">Haftalık</span>
                </button>
                <button
                  className={`diet-option ${dietPlanDuration === 'monthly' ? 'active' : ''}`}
                  onClick={() => setDietPlanDuration('monthly')}
                  disabled={dietPlanLoading}
                >
                  <span className="option-icon">📈</span>
                  <span className="option-label">Aylık</span>
                </button>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDietPlanModal(false)}
                  disabled={dietPlanLoading}
                >
                  İptal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={generateDietPlan}
                  disabled={dietPlanLoading}
                >
                  {dietPlanLoading ? 'Plan Oluşturuluyor...' : 'Planı Oluştur'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Plan Modal */}
        {showExercisePlanModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Egzersiz Planı Süresi Seçin</h3>
              <p>Program için hangi zaman aralığını tercih edersiniz?</p>
              
              {error && <div className="error-message">{error}</div>}

              <div className="diet-plan-options">
                <button
                  className={`diet-option ${exercisePlanDuration === 'daily' ? 'active' : ''}`}
                  onClick={() => setExercisePlanDuration('daily')}
                  disabled={exercisePlanLoading}
                >
                  <span className="option-icon">📅</span>
                  <span className="option-label">Günlük</span>
                </button>
                <button
                  className={`diet-option ${exercisePlanDuration === 'weekly' ? 'active' : ''}`}
                  onClick={() => setExercisePlanDuration('weekly')}
                  disabled={exercisePlanLoading}
                >
                  <span className="option-icon">📊</span>
                  <span className="option-label">Haftalık</span>
                </button>
                <button
                  className={`diet-option ${exercisePlanDuration === 'monthly' ? 'active' : ''}`}
                  onClick={() => setExercisePlanDuration('monthly')}
                  disabled={exercisePlanLoading}
                >
                  <span className="option-icon">📈</span>
                  <span className="option-label">Aylık</span>
                </button>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowExercisePlanModal(false)}
                  disabled={exercisePlanLoading}
                >
                  İptal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={generateExercisePlan}
                  disabled={exercisePlanLoading}
                >
                  {exercisePlanLoading ? 'Plan Oluşturuluyor...' : 'Planı Oluştur'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div className="survey-card">
        <h1>LifeSync Sağlık Anketi</h1>
        <p className="survey-subtitle">
          Kişiselleştirilmiş sağlık ve egzersiz önerileri almak için lütfen bilgilerinizi girin.
        </p>
        <p className="survey-disclaimer">
          Not: Bu sistem genel iyi yaşam önerisi içerir, tıbbi tavsiye değildir.
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="survey-form">
          {/* Section 1: Physical Info */}
          <fieldset className="form-section">
            <legend>Fiziksel Bilgiler</legend>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Yaş *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  min="10"
                  max="100"
                  required
                  placeholder="25"
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Cinsiyet *</label>
                <select
                  id="gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seçin...</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="height_cm">Boy (cm) *</label>
                <input
                  type="number"
                  id="height_cm"
                  name="height_cm"
                  value={form.height_cm}
                  onChange={handleChange}
                  min="100"
                  max="250"
                  step="0.1"
                  required
                  placeholder="180"
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight_kg">Kilo (kg) *</label>
                <input
                  type="number"
                  id="weight_kg"
                  name="weight_kg"
                  value={form.weight_kg}
                  onChange={handleChange}
                  min="30"
                  max="300"
                  step="0.1"
                  required
                  placeholder="75"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 2: Health Goals */}
          <fieldset className="form-section">
            <legend>Sağlık Hedefleri</legend>

            <div className="form-group">
              <label htmlFor="goal">Ana Hedefiniz *</label>
              <input
                type="text"
                id="goal"
                name="goal"
                value={form.goal}
                onChange={handleChange}
                required
                placeholder="Örn: kilo vermek, kas kazanmak, form korumak"
              />
            </div>

            <div className="form-group">
              <label htmlFor="diet_preference">Beslenme Tercihiniz *</label>
              <input
                type="text"
                id="diet_preference"
                name="diet_preference"
                value={form.diet_preference}
                onChange={handleChange}
                required
                placeholder="Örn: omnivor, vejetaryen, vegan, gluten free vb."
              />
            </div>

            <div className="form-group">
              <label htmlFor="allergy_or_restriction">Alerji / Besin Kısıtı</label>
              <input
                type="text"
                id="allergy_or_restriction"
                name="allergy_or_restriction"
                value={form.allergy_or_restriction}
                onChange={handleChange}
                placeholder="Yoksa boş bırakın"
              />
            </div>
          </fieldset>

          {/* Section 3: Lifestyle */}
          <fieldset className="form-section">
            <legend>Yaşam Stili</legend>

            <div className="form-group">
              <label htmlFor="activity_level">Günlük Aktivite Seviyesi (1-5) *</label>
              <input
                type="range"
                id="activity_level"
                name="activity_level"
                value={form.activity_level}
                onChange={handleChange}
                min="1"
                max="5"
              />
              <span className="range-value">
                {form.activity_level === '1' && '1 (Çok Az)'}
                {form.activity_level === '2' && '2 (Az)'}
                {form.activity_level === '3' && '3 (Orta)'}
                {form.activity_level === '4' && '4 (İyi)'}
                {form.activity_level === '5' && '5 (Çok İyi)'}
              </span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="exercise_days_per_week">Haftada Egzersiz Günü *</label>
                <input
                  type="number"
                  id="exercise_days_per_week"
                  name="exercise_days_per_week"
                  value={form.exercise_days_per_week}
                  onChange={handleChange}
                  min="0"
                  max="7"
                  required
                  placeholder="3"
                />
              </div>
              <div className="form-group">
                <label htmlFor="sleep_hours">Ortalama Uyku (saat) *</label>
                <input
                  type="number"
                  id="sleep_hours"
                  name="sleep_hours"
                  value={form.sleep_hours}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.5"
                  required
                  placeholder="7.5"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="water_liters_per_day">Günlük Su (litre) *</label>
                <input
                  type="number"
                  id="water_liters_per_day"
                  name="water_liters_per_day"
                  value={form.water_liters_per_day}
                  onChange={handleChange}
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  placeholder="2"
                />
              </div>
              <div className="form-group">
                <label htmlFor="screen_hours_per_day">Günlük Ekran (saat) *</label>
                <input
                  type="number"
                  id="screen_hours_per_day"
                  name="screen_hours_per_day"
                  value={form.screen_hours_per_day}
                  onChange={handleChange}
                  min="0"
                  max="24"
                  step="0.5"
                  required
                  placeholder="8"
                />
              </div>
            </div>
          </fieldset>

          {/* Section 4: Additional */}
          <fieldset className="form-section">
            <legend>Ek Bilgiler</legend>

            <div className="form-group">
              <label htmlFor="health_note">Ek Sağlık Notu / Sakatlık</label>
              <textarea
                id="health_note"
                name="health_note"
                value={form.health_note}
                onChange={handleChange}
                placeholder="Yoksa boş bırakın"
                rows="3"
              />
            </div>
          </fieldset>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              İptal
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Analiz Ediliyor...' : 'Formu Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OnboardingSurvey;
