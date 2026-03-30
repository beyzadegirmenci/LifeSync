# LifeSync – Sprint 1 Backlog

**Sprint:** 1
**Tarih Aralığı:** 2025-03-01 – 2025-03-14
**Sprint Hedefi:** Temel proje altyapısını kurmak ve kullanıcı kimlik doğrulama sistemini tamamlamak.

---

## Sprint Hedefi

> Kullanıcılar sisteme kayıt olabilmeli, giriş yapabilmeli ve güvenli oturumlarla uygulamayı kullanabilmelidir.

---

## Seçilen User Story'ler

| ID | Hikaye | Puan | Durum |
|----|--------|------|-------|
| US-001 | Kullanıcı kaydı | 5 | ✅ Tamamlandı |
| US-002 | Kullanıcı girişi | 3 | ✅ Tamamlandı |
| US-003 | Kullanıcı çıkışı | 2 | ✅ Tamamlandı |
| US-004 | Oturum kalıcılığı (JWT + localStorage) | 3 | ✅ Tamamlandı |

**Sprint Toplam Puanı:** 13

---

## Görevler (Tasks)

### Altyapı
- [x] PostgreSQL veritabanı kurulumu
- [x] `users` tablosunun oluşturulması
- [x] Node.js + Express proje iskeletinin kurulması
- [x] React + Vite proje iskeletinin kurulması
- [x] CORS ve environment variable konfigürasyonu

### Backend
- [x] `POST /api/auth/register` endpoint'i
- [x] `POST /api/auth/login` endpoint'i
- [x] `POST /api/auth/logout` endpoint'i
- [x] `GET /api/auth/me` endpoint'i
- [x] bcrypt ile şifre hashleme
- [x] JWT token üretimi (7 gün)
- [x] JWT doğrulama middleware'i
- [x] User modeli (create, findByEmail, findById)

### Frontend
- [x] AuthPage bileşeni (login/register toggle)
- [x] Form validasyonu
- [x] JWT token'ı localStorage'a kaydetme
- [x] ProtectedRoute bileşeni
- [x] Login sonrası dashboard'a yönlendirme

---

## Requirement → Design → Implementation → Test Döngüsü

| Aşama | Çıktı |
|-------|-------|
| **Requirement** | US-001, US-002, US-003, US-004 kabul kriterleri |
| **Design** | SDD_v1 — Auth API arayüzleri, veritabanı şeması |
| **Implementation** | authController.js, User.js, AuthPage.jsx |
| **Test** | Manuel: Register → Login → Logout → Sayfa yenile → Oturum açık |

---

## Kabul Kriterleri

- [ ] Kullanıcı geçerli bilgilerle kayıt olabilir
- [ ] Hatalı email/şifreyle giriş reddedilir
- [ ] Başarılı girişte JWT token alınır
- [ ] Token ile korumalı endpoint'lere erişilebilir
- [ ] Çıkış sonrası korumalı sayfalara erişim engellenir

---

## Definition of Done

- Kod yazıldı ve çalışıyor
- Manuel testler geçildi
- Commit yapıldı ve push edildi
- Sprint Backlog güncellendi
