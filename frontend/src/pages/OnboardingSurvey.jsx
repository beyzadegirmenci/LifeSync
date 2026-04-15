import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlanTable from '../components/PlanTable';
import { ExportCreatorFactory } from '../factory/export/ExportCreatorFactory';
import '../styles/OnboardingSurvey.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FITNESS_LEVEL_LABEL_TR = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri'
};

function fitnessLevelBadgeClass(level) {
  const key = String(level || 'beginner').toLowerCase();
  return FITNESS_LEVEL_LABEL_TR[key] ? key : 'beginner';
}

function fitnessLevelDisplay(classification) {
  if (!classification) return '-';
  const key = String(classification.level || '').toLowerCase();
  return (
    classification.levelLabelTr ??
    FITNESS_LEVEL_LABEL_TR[key] ??
    classification.level ??
    '-'
  );
}

function OnboardingSurvey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLabel, setLoadingLabel] = useState('İşleniyor...');
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

  const isAnyLoading = loading || dietPlanLoading || exercisePlanLoading;

  useEffect(() => {
    if (!isAnyLoading) {
      setLoadingProgress(0);
      return;
    }

    setLoadingProgress(5);
    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 92) return prev;
        if (prev < 40) return prev + 4;
        if (prev < 70) return prev + 2;
        return prev + 1;
      });
    }, 350);

    return () => clearInterval(timer);
  }, [isAnyLoading]);

  const finalizeLoadingProgress = async () => {
    setLoadingProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 220));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

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

  useEffect(() => {
    const prefillFromProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const user = res.data?.user;
        if (!user) return;

        // Keep existing user edits if they already exist in form state.
        setForm(prev => ({
          ...prev,
          age: prev.age || (user.age != null ? String(user.age) : ''),
          gender: prev.gender || (user.gender || ''),
          height_cm: prev.height_cm || (user.height != null ? String(user.height) : ''),
          weight_kg: prev.weight_kg || (user.weight != null ? String(user.weight) : '')
        }));
      } catch {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    prefillFromProfile();
  }, [navigate]);

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

    setLoadingLabel('Sağlık analizi hazırlanıyor...');
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
      await finalizeLoadingProgress();
    } catch (err) {
      setError(err.response?.data?.error || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      await finalizeLoadingProgress();
    } finally {
      setLoading(false);
    }
  };

  const generateDietPlan = async () => {
    setLoadingLabel(`${planDurationLabel(dietPlanDuration)} diyet planı oluşturuluyor...`);
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
      await finalizeLoadingProgress();
    } catch (err) {
      setError(err.response?.data?.error || 'Diyet planı oluşturulurken bir hata oluştu.');
      await finalizeLoadingProgress();
    } finally {
      setDietPlanLoading(false);
    }
  };

  const generateExercisePlan = async () => {
    setLoadingLabel(`${planDurationLabel(exercisePlanDuration)} egzersiz planı oluşturuluyor...`);
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
      await finalizeLoadingProgress();
    } catch (err) {
      setError(err.response?.data?.error || 'Egzersiz planı oluşturulurken bir hata oluştu.');
      await finalizeLoadingProgress();
    } finally {
      setExercisePlanLoading(false);
    }
  };

  const renderLoadingOverlay = () => {
    if (!isAnyLoading) return null;

    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (loadingProgress / 100) * circumference;

    return (
      <div className="global-loading-overlay" role="status" aria-live="polite" aria-busy="true">
        <div className="progress-card">
          <div className="progress-ring-wrap">
            <svg className="progress-ring" width="140" height="140" viewBox="0 0 140 140" aria-hidden="true">
              <circle className="progress-ring-bg" cx="70" cy="70" r={radius} />
              <circle
                className="progress-ring-bar"
                cx="70"
                cy="70"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="progress-value">%{Math.round(loadingProgress)}</div>
          </div>
          <p className="progress-label">{loadingLabel}</p>
          <p className="progress-subtitle">Plan hazırlanıyor, lütfen bekleyin.</p>
        </div>
      </div>
    );
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    const formatInline = (input) => {
      const parts = input.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={`strong-${idx}`}>{part.slice(2, -2)}</strong>;
        }
        return <span key={`span-${idx}`}>{part}</span>;
      });
    };

    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let key = 0;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key++}`} className="formatted-list">
            {listItems.map((item, idx) => (
              <li key={`li-${idx}`}>{formatInline(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((raw) => {
      const line = raw.trim();

      if (!line) {
        flushList();
        return;
      }

      if (line.startsWith('## ')) {
        flushList();
        const heading = line
          .replace(/^##\s*/, '')
          .replace(/^\d+\.\s*/, '')
          .trim();
        elements.push(<h4 key={`h-${key++}`}>{formatInline(heading)}</h4>);
        return;
      }

      if (/^\*\*.+\*\*$/.test(line)) {
        flushList();
        const subtitle = line.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
        elements.push(<h5 key={`h5-${key++}`}>{formatInline(subtitle)}</h5>);
        return;
      }

      if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s+/.test(line)) {
        const item = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        listItems.push(item);
        return;
      }

      flushList();
      elements.push(<p key={`p-${key++}`}>{formatInline(line.replace(/^#+\s*/, '').trim())}</p>);
    });

    flushList();
    return <div className="formatted-content">{elements}</div>;
  };

  const planDurationLabel = (duration) => (
    duration === 'daily' ? 'Günlük' : duration === 'weekly' ? 'Haftalık' : 'Aylık'
  );

  const getDayLabelFromLine = (line, fallbackIndex) => {
    const dayMatch = line.match(/(?:^|\s)(?:g[uü]n|day)\s*(\d{1,2})\b/i);
    if (dayMatch) return `Gün ${parseInt(dayMatch[1], 10)}`;

    const weekdays = ['pazartesi', 'sali', 'salı', 'carsamba', 'çarşamba', 'persembe', 'perşembe', 'cuma', 'cumartesi', 'pazar'];
    const normalized = line.toLowerCase();
    for (const dayName of weekdays) {
        if (normalized.includes(dayName)) {
          const pretty = dayName
            .replace('sali', 'Salı')
            .replace('salı', 'Salı')
            .replace('carsamba', 'Çarşamba')
            .replace('çarşamba', 'Çarşamba')
            .replace('persembe', 'Perşembe')
            .replace('perşembe', 'Perşembe')
            .replace('pazartesi', 'Pazartesi')
            .replace('cuma', 'Cuma')
            .replace('cumartesi', 'Cumartesi')
            .replace('pazar', 'Pazar');
          return pretty;
        }
    }

    return `Gün ${fallbackIndex}`;
  };

  const normalizeSectionKey = (line, planType) => {
    const text = line.toLowerCase();
    if (planType === 'diet') {
      if (/(kahvalt[ıi]|sabah)/i.test(text)) return 'Kahvaltı';
      if (/(öğle|ogle|öğlen|oglen|lunch)/i.test(text)) return 'Öğle';
      if (/(ara\s*öğün|ara\s*ogun|snack)/i.test(text)) return 'Ara Öğün';
      if (/(akşam|aksam|dinner)/i.test(text)) return 'Akşam';
      if (/(gece)/i.test(text)) return 'Gece';
      return 'Notlar';
    }

    if (/(ısınma|isinma|warm-?up)/i.test(text)) return 'Isınma';
    if (/(ana\s*egzersiz|ana\s*antrenman|workout|antrenman|egzersiz)/i.test(text)) return 'Ana Antrenman';
    if (/(soğuma|soguma|cool\s*down|cooldown)/i.test(text)) return 'Soğuma';
    if (/(dinlenme|rest)/i.test(text)) return 'Dinlenme';
    return 'Notlar';
  };

  // Returns { days: string[], sections: string[], data: Record<section, Record<day, string>> }
  const parsePlanMatrix = (rawText, planType) => {
    if (!rawText) return { days: [], sections: [], data: {} };

    const sectionKeys = planType === 'diet'
      ? ['Kahvaltı', 'Öğle', 'Ara Öğün', 'Akşam', 'Gece', 'Notlar']
      : ['Isınma', 'Ana Antrenman', 'Soğuma', 'Dinlenme', 'Notlar'];

    const days = [];
    const data = {};
    sectionKeys.forEach((s) => { data[s] = {}; });

    let currentDay = null;
    let currentSection = 'Notlar';
    let fallbackIndex = 1;

    const ensureDay = (label) => {
      if (!days.includes(label)) days.push(label);
      sectionKeys.forEach((s) => {
        if (data[s][label] === undefined) data[s][label] = '';
      });
    };

    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    for (const line of lines) {
      const isDayHeading = /^(#{1,6}\s*)?((g[uü]n\s*\d{1,2})|(day\s*\d{1,2})|pazartesi|sal[ıi]|[çc]ar[sş]amba|per[sş]embe|cuma|cumartesi|pazar)\b/i.test(line);
      if (isDayHeading) {
        const label = getDayLabelFromLine(line, fallbackIndex);
        ensureDay(label);
        currentDay = label;
        currentSection = 'Notlar';
        fallbackIndex += 1;
        continue;
      }

      if (!currentDay) {
        const label = `Gün ${fallbackIndex}`;
        ensureDay(label);
        currentDay = label;
        fallbackIndex += 1;
      }

      const cleaned = line
        .replace(/^[-*]\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .replace(/^#+\s*/, '')
        .trim();

      if (!cleaned) continue;

      if (/^\*\*.*\*\*$/.test(cleaned) || /:$/.test(cleaned)) {
        const key = normalizeSectionKey(cleaned.replace(/\*\*/g, '').replace(/:$/, '').trim(), planType);
        if (sectionKeys.includes(key)) currentSection = key;
        continue;
      }

      if (data[currentSection]) {
        data[currentSection][currentDay] = data[currentSection][currentDay]
          ? `${data[currentSection][currentDay]}\n${cleaned}`
          : cleaned;
      }
    }

    // Drop sections with no content across all days
    const usedSections = sectionKeys.filter((s) =>
      days.some((d) => data[s][d] && data[s][d].trim())
    );

    return { days, sections: usedSections, data };
  };

  const exportPlanByType = (planData, duration, planType, exportType) => {
    try {
      const creator = ExportCreatorFactory.create(exportType);
      const exporter = creator.createExporter();
      exporter.export(planData, { duration, planType, dataType: 'plan' });
    } catch (err) {
      setError(err.message || 'Plan export edilirken bir hata olustu.');
    }
  };

  const exportSurveyResultByType = (exportType) => {
    try {
      if (!classification || !recommendation) {
        setError('Export icin anket sonucu bulunamadi.');
        return;
      }

      const creator = ExportCreatorFactory.create(exportType);
      const exporter = creator.createExporter();

      exporter.export(
        { classification, recommendation },
        { dataType: 'survey', label: 'anket' }
      );
    } catch (err) {
      setError(err.message || 'Anket sonucu export edilirken bir hata olustu.');
    }
  };

  const renderPlanTable = (rawText, planType) => {
    const { days, sections, data } = parsePlanMatrix(rawText, planType);
    if (!days.length) return null;

    return (
      <div className="plan-table-wrapper">
        <table className="plan-table">
          <thead>
            <tr>
              <th>Öğün</th>
              {days.map((day) => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <tr key={section}>
                <td className="plan-table-section-label">{section}</td>
                {days.map((day) => (
                  <td key={`${section}-${day}`}>
                    {(data[section][day] || '').split('\n').map((line, i) => (
                      <span key={i}>{line}{i < (data[section][day] || '').split('\n').length - 1 && <br />}</span>
                    ))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const withPageShell = (content) => (
    <div className="dashboard survey-dashboard">
      <nav className="dashboard-nav">
        <h1 className="nav-logo">LifeSync</h1>
        <div className="nav-right">
          <button className="btn btn-nav-back" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </button>
          <button className="btn btn-nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="dashboard-content survey-content">{content}</main>
    </div>
  );

  if (showResults && dietPlan) {
    return withPageShell(
        <>
        {renderLoadingOverlay()}
        <div className="survey-container results-view">
          <div className="results-card">
          <div className="plan-header-row">
            <h2>{planDurationLabel(dietPlanDuration)} Diyet Plani</h2>
            <div className="export-actions">
              <button
                type="button"
                className="export-btn export-btn-excel"
                onClick={() => exportPlanByType(dietPlan, dietPlanDuration, 'diet', 'excel')}
                title="Excel Olarak Disa Aktar"
              >
                <span>Excel</span>
              </button>
              <button
                type="button"
                className="export-btn export-btn-pdf"
                onClick={() => exportPlanByType(dietPlan, dietPlanDuration, 'diet', 'pdf')}
                title="PDF Olarak Disa Aktar"
              >
                <span>PDF</span>
              </button>
            </div>
          </div>

          <PlanTable planData={dietPlan} />

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
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard'a Dön
            </button>
          </div>
        </div>
      </div>
        </>
    );
  }

  if (showResults && exercisePlan) {
    return withPageShell(
      <>
      {renderLoadingOverlay()}
      <div className="survey-container results-view">
        <div className="results-card">
          <div className="plan-header-row">
            <h2>{planDurationLabel(exercisePlanDuration)} Egzersiz Plani</h2>
            <div className="export-actions">
              <button
                type="button"
                className="export-btn export-btn-excel"
                onClick={() => exportPlanByType(exercisePlan, exercisePlanDuration, 'exercise', 'excel')}
                title="Excel Olarak Disa Aktar"
              >
                <span>Excel</span>
              </button>
              <button
                type="button"
                className="export-btn export-btn-pdf"
                onClick={() => exportPlanByType(exercisePlan, exercisePlanDuration, 'exercise', 'pdf')}
                title="PDF Olarak Disa Aktar"
              >
                <span>PDF</span>
              </button>
            </div>
          </div>

          <PlanTable planData={exercisePlan} />

          <div className="results-actions">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setExercisePlan(null);
                setExercisePlanDuration('weekly');
              }}
            >
              Başka Plan Oluştur
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
      </>
      );
    }

  // Survey Results View
  if (showResults) {
    return withPageShell(
      <>
      {renderLoadingOverlay()}
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
                <span className={`value level-badge level-${fitnessLevelBadgeClass(classification.level)}`}>
                  {fitnessLevelDisplay(classification)}
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
                {renderFormattedText(recommendation.raw_text)}
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
              Diyet Plani Olustur
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExercisePlanModal(true)}
            >
              Egzersiz Plani Olustur
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

          <div className="results-export-actions">
            <button
              type="button"
              className="export-btn export-btn-excel"
              onClick={() => exportSurveyResultByType('excel')}
              title="Anket sonucunu Excel olarak disa aktar"
            >
              Excel Export
            </button>
            <button
              type="button"
              className="export-btn export-btn-pdf"
              onClick={() => exportSurveyResultByType('pdf')}
              title="Anket sonucunu PDF olarak disa aktar"
            >
              PDF Export
            </button>
          </div>
        </div>

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
                  <span className="option-icon">D</span>
                  <span className="option-label">Günlük</span>
                </button>
                <button
                  className={`diet-option ${dietPlanDuration === 'weekly' ? 'active' : ''}`}
                  onClick={() => setDietPlanDuration('weekly')}
                  disabled={dietPlanLoading}
                >
                  <span className="option-icon">H</span>
                  <span className="option-label">Haftalık</span>
                </button>
                <button
                  className={`diet-option ${dietPlanDuration === 'monthly' ? 'active' : ''}`}
                  onClick={() => setDietPlanDuration('monthly')}
                  disabled={dietPlanLoading}
                >
                  <span className="option-icon">A</span>
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
                  <span className="option-icon">D</span>
                  <span className="option-label">Günlük</span>
                </button>
                <button
                  className={`diet-option ${exercisePlanDuration === 'weekly' ? 'active' : ''}`}
                  onClick={() => setExercisePlanDuration('weekly')}
                  disabled={exercisePlanLoading}
                >
                  <span className="option-icon">H</span>
                  <span className="option-label">Haftalık</span>
                </button>
                <button
                  className={`diet-option ${exercisePlanDuration === 'monthly' ? 'active' : ''}`}
                  onClick={() => setExercisePlanDuration('monthly')}
                  disabled={exercisePlanLoading}
                >
                  <span className="option-icon">A</span>
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
      </>
    );
  }

  return withPageShell(
    <>
    {renderLoadingOverlay()}
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
    </>
  );
}

export default OnboardingSurvey;
