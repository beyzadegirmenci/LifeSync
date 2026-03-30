# LifeSync – Sprint 3 Backlog

**Sprint:** 3
**Tarih Aralığı:** 2025-03-29 – 2025-04-11
**Sprint Hedefi:** Ollama LLM entegrasyonuyla kişiselleştirilmiş AI planlarını hayata geçirmek ve profil yönetimi sistemini tamamlamak.

---

## Sprint Hedefi

> Kullanıcılar sağlık profillerine göre AI destekli diyet ve egzersiz planları alabilmeli; profil bilgilerini güncelleyebilmelidir.

---

## Seçilen User Story'ler

| ID | Hikaye | Puan | Durum |
|----|--------|------|-------|
| US-009 | Kişiselleştirilmiş diyet planı (Ollama) | 8 | ✅ Tamamlandı |
| US-010 | Kişiselleştirilmiş egzersiz planı (Ollama) | 8 | ✅ Tamamlandı |
| US-011 | AI olmadan fallback öneriler | 3 | ✅ Tamamlandı |
| US-012 | Profil görüntüleme | 2 | ✅ Tamamlandı |
| US-013 | Profil bilgilerini güncelleme | 5 | ✅ Tamamlandı |
| US-014 | Şifre değiştirme | 3 | ✅ Tamamlandı |

**Sprint Toplam Puanı:** 29

---

## Görevler (Tasks)

### Backend – AI Entegrasyonu
- [x] `POST /api/dashboard/diet-plan` endpoint'i
- [x] `POST /api/dashboard/exercise-plan` endpoint'i
- [x] Ollama API entegrasyonu (`http://localhost:11434/api/generate`)
- [x] Kullanıcı profilinden prompt oluşturma (yaş, cinsiyet, boy, kilo, hedef, seviye)
- [x] Ollama erişilemediğinde fallback plan dönme
- [x] Model seçimi: llama3.1:8b (varsayılan)

### Backend – Profil Yönetimi
- [x] `GET /api/profile` endpoint'i
- [x] `PUT /api/profile` endpoint'i
- [x] ProfileBuilder pattern implementasyonu
- [x] SqlUpdateBuilder pattern implementasyonu
- [x] Şifre değiştirme (mevcut şifre doğrulama + bcrypt hashleme)

### Frontend
- [x] "Diyet Planı Oluştur" butonu ve modal
- [x] "Egzersiz Planı Oluştur" butonu ve modal
- [x] Plan yüklenirken loading state gösterimi
- [x] EditProfile sayfası
- [x] Profil güncelleme formu (şifre, boy, kilo, yaş, cinsiyet)
- [x] Başarı/hata mesajları

### Tasarım Desenleri
- [x] Builder Pattern: ProfileBuilder (profil validasyonu)
- [x] Builder Pattern: SqlUpdateBuilder (dinamik SQL üretimi)

---

## Requirement → Design → Implementation → Test Döngüsü

| Aşama | Çıktı |
|-------|-------|
| **Requirement** | US-009 – US-014 kabul kriterleri |
| **Design** | SDD_v3 — Ollama entegrasyon diyagramı, Builder class diyagramı |
| **Implementation** | dashboardController.js (AI), ProfileBuilder.js, SqlUpdateBuilder.js, EditProfile.jsx |
| **Test** | Manuel: Diyet planı iste → Plan görüntüle; Profil güncelle → Değişiklik kayıt |

---

## Kabul Kriterleri

- [ ] Ollama çalışırken kişiselleştirilmiş diyet planı oluşturulur
- [ ] Ollama çalışırken kişiselleştirilmiş egzersiz planı oluşturulur
- [ ] Ollama kapalıyken fallback öneriler döner
- [ ] Profil bilgileri başarıyla güncellenir
- [ ] Hatalı mevcut şifreyle şifre değiştirilmez
- [ ] Builder pattern geçersiz girişlerde hata döner

---

## Definition of Done

- AI planları farklı kullanıcı profilleri için test edildi
- Profil güncelleme end-to-end test edildi
- Builder validasyonları kontrol edildi
- Tüm commit'ler push edildi

---

## Notlar

- Ollama kurulumu isteğe bağlıdır; yoksa sistem fallback modda çalışır
- Python CLI client (`client/main.py`) bu sprintte paralel olarak geliştirildi (demo amaçlı)
- Memento pattern (undo için) araştırıldı ve kısmen implemente edildi
