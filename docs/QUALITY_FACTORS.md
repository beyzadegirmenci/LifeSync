# LifeSync – Quality Factors & Criteria

**Versiyon:** 1.0
**Tarih:** 2026-04-14
**Standart:** ISO/IEC 25010 (Software Product Quality Model)

---

## Quality Factor Tablosu

### 1. Functional Suitability (Fonksiyonel Uygunluk)

> Sistemin belirtilen ve örtük ihtiyaçları karşılayıp karşılamadığı.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Kullanıcı kaydı doğru çalışmalı | Başarılı kayıt oranı | %100 (geçerli input) | `register returns 400 when required fields are missing` | US-001 |
| Giriş kimlik doğrulaması doğru çalışmalı | Başarılı giriş oranı | %100 (doğru bilgiler) | `login returns 401 when password check fails` | US-002 |
| Çıkış sonrası token geçersiz olmalı | Blacklist'e eklenen token oranı | %100 | `logout blacklists the bearer token` | US-003 |
| BMI hesaplaması doğru sonuç vermeli | Hesaplama doğruluğu | +-0.1 hata payı | Selenium smoke: dashboard load | US-006 |
| Kullanıcı sınıflandırması doğru çalışmalı | Beginner/Intermediate/Advanced ataması | Algoritma kurallarına %100 uyum | Selenium smoke: survey submit | US-007 |
| AI diyet planı üretilmeli | Başarılı plan üretim oranı (Ollama açıkken) | >=95% | Manuel: diet-plan endpoint | US-009 |
| AI egzersiz planı üretilmeli | Başarılı plan üretim oranı (Ollama açıkken) | >=95% | Manuel: exercise-plan endpoint | US-010 |
| Ollama kapalıyken fallback çalışmalı | Fallback plan dönüş oranı | %100 | Manuel: Ollama kapalıyken istek at | US-011 |
| Profil güncellemesi kaydedilmeli | Başarılı güncelleme oranı | %100 (geçerli input) | Selenium smoke: profile update | US-013 |
| Şifre değiştirme çalışmalı | Başarılı şifre değişikliği | %100 | `ProfileBuilder rejects short passwords` | US-014 |

---

### 2. Reliability (Güvenilirlik)

> Sistemin belirli koşullar altında çalışmaya devam etme kapasitesi.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Ollama kapalıyken sistem çökmemeli | Fallback devreye girme süresi | < 3 sn | Manuel: Ollama kapalıyken plan iste | US-011 |
| Geçersiz JWT ile sistem hata vermemeli | Hatalı token reddedilme oranı | %100 | `auth middleware rejects malformed tokens` | US-004 |
| Süresi dolmuş token ile erişim engellenmeli | Expired token yönlendirme oranı | %100 | ProtectedRoute unit davranışı | US-004 |
| Tüm backend testleri yeşil olmalı | Geçen test sayısı / toplam test | 41/41 (%100) | `node --test test/*.test.js` | US-001 – US-014 |
| Frontend build hatasız tamamlanmalı | Build başarı durumu | Pass | `npm run build` | Tüm US |

---

### 3. Security (Güvenlik)

> Yetkisiz erişime ve veri sızıntısına karşı koruma.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Şifreler hashlenmiş saklanmalı | bcrypt hash varlığı | %100 | `register returns 400 when required fields are missing` | US-001 |
| Token olmadan korumalı endpoint'e erişilememeli | Yetkisiz istek engelleme oranı | %100 | `auth middleware rejects requests without bearer token` | US-002, US-004 |
| Blacklist'teki token reddedilmeli | Blacklisted token engelleme oranı | %100 | `auth middleware rejects blacklisted tokens` | US-003 |
| CORS sadece izin verilen origin'e izin vermeli | Engellenen yetkisiz origin oranı | %100 | Manuel: farklı origin'den istek | US-001 – US-014 |
| Survey input'u aralık dışı değerleri reddetmeli | Geçersiz input reddedilme oranı | %100 | Backend validasyon testleri | US-005 |
| Kayıt hatalarında stack trace dönmemeli | Kullanıcıya dönen hata detayı | Sadece genel mesaj | Manuel: hatalı kayıt isteği | US-001 |

---

### 4. Usability (Kullanılabilirlik)

> Kullanıcıların sistemi etkili ve verimli şekilde kullanabilmesi.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Eksik form alanında anlaşılır hata gösterilmeli | Hata mesajı gösterim oranı | %100 | Selenium: form validation | US-001, US-005 |
| API hatalarında kullanıcı dostu mesaj gösterilmeli | Teknik hata mesajı gizlenme oranı | %100 | Selenium: hatalı giriş | US-002 |
| Sayfa yenilemede oturum korunmalı | Token kalıcılık oranı | %100 | Selenium smoke: re-login check | US-004 |
| Yükleme sırasında kullanıcıya geri bildirim verilmeli | Loading state gösterim oranı | %100 | Selenium: plan oluşturma süreci | US-009, US-010 |
| Egzersiz planı ekranında navigasyon çalışmalı | "Dashboard'a Dön" butonu erişilebilirliği | %100 | Selenium smoke flow | US-010 |

---

### 5. Maintainability (Bakım Kolaylığı)

> Sistemin değiştirilmesi, iyileştirilmesi ve hata giderilmesinin kolaylığı.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Builder pattern validasyon mantığı izole olmalı | ProfileBuilder test coverage | Tüm doğrulama dalları test edilmiş | `ProfileBuilder rejects short passwords` vb. (7 test) | US-013, US-014 |
| SQL güncelleme mantığı izole olmalı | SqlUpdateBuilder test coverage | Tüm senaryolar test edilmiş | `SqlUpdateBuilder accumulates fields` vb. (4 test) | US-013 |
| Observer pattern doğru çalışmalı | Observer test coverage | Tüm event tipleri test edilmiş | `PlanEventEmitter emits plan created event` vb. (5 test) | US-009, US-010 |
| Token blacklist modülü bağımsız çalışmalı | Modül izolasyon testi | Bağımsız import edilebilir | `auth middleware rejects blacklisted tokens` | US-003 |

---

### 6. Performance Efficiency (Performans Verimliliği)

> Kaynakların verimli kullanımı ve yanıt süreleri.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| Backend unit testleri hızlı çalışmalı | Toplam test süresi | < 500 ms (41 test) | `duration_ms 358.0644` | US-001 – US-014 |
| AI plan üretimi makul sürede tamamlanmalı | Ollama yanıt timeout | <= 120 sn | Manuel: plan oluşturma süreci | US-009, US-010 |
| Dashboard ilk yükleme süresi | Sayfa render süresi | < 2 sn (local) | Selenium smoke: dashboard load | US-008 |
| Frontend build süresi | Build tamamlanma süresi | < 30 sn | `npm run build` | Tüm US |

---

### 7. Portability (Taşınabilirlik)

> Sistemin farklı ortamlara taşınabilme kolaylığı.

| Quality Criteria | Metric | Target Value | Related Test | Related Requirement |
|-----------------|--------|--------------|--------------|---------------------|
| API URL ortama göre değişmeli | VITE_API_URL env değişkeni kullanımı | %100 (hardcoded URL yok) | Manuel: .env değiştir, build al | Tüm US |
| CORS origin ortama göre değişmeli | FRONTEND_URL env değişkeni kullanımı | %100 | Manuel: .env.example kontrolü | US-001 – US-014 |
| Ollama model ortama göre değişmeli | OLLAMA_MODEL env değişkeni kullanımı | %100 | Manuel: .env.example kontrolü | US-009, US-010 |

---

## Özet

| Quality Factor | Kriter Sayısı | Mevcut Durum |
|---------------|--------------|--------------|
| Functional Suitability | 10 | 41 backend testi geçiyor, Selenium smoke pass |
| Reliability | 5 | 41/41 test pass, fallback mekanizması mevcut |
| Security | 6 | bcrypt, JWT blacklist, CORS düzeltildi |
| Usability | 5 | Selenium E2E doğruladı |
| Maintainability | 4 | Builder, Observer, SqlUpdate izole test edildi |
| Performance Efficiency | 4 | Test süresi 358ms, timeout 120sn |
| Portability | 3 | Env değişkenleri ile ortam bağımsızlığı sağlandı |
| **Toplam** | **37** | |

---

*Referans standart: ISO/IEC 25010:2011 – Systems and software Quality Requirements and Evaluation (SQuaRE)*
