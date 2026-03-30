# LifeSync – Sprint 2 Backlog

**Sprint:** 2
**Tarih Aralığı:** 2025-03-15 – 2025-03-28
**Sprint Hedefi:** Sağlık anketi ve dashboard özelliklerini tamamlamak; BMI hesaplama ve kullanıcı sınıflandırmasını hayata geçirmek.

---

## Sprint Hedefi

> Kullanıcılar kapsamlı sağlık anketi doldurabilmeli, BMI değerlerini görebilmeli ve fitness seviyelerine göre otomatik sınıflandırılabilmelidir.

---

## Seçilen User Story'ler

| ID | Hikaye | Puan | Durum |
|----|--------|------|-------|
| US-005 | Sağlık anketi formu | 8 | ✅ Tamamlandı |
| US-006 | BMI hesaplama ve gösterimi | 3 | ✅ Tamamlandı |
| US-007 | Fitness seviyesi sınıflandırması | 5 | ✅ Tamamlandı |
| US-008 | Dashboard sağlık metrikleri | 5 | ✅ Tamamlandı |

**Sprint Toplam Puanı:** 21

---

## Görevler (Tasks)

### Backend
- [x] `GET /api/dashboard` endpoint'i (BMI hesaplama dahil)
- [x] `POST /api/dashboard/survey` endpoint'i
- [x] Anket verisi işleme mantığı
- [x] Fitness sınıflandırma algoritması (Beginner / Intermediate / Advanced)
- [x] BMI formülü implementasyonu
- [x] BMI kategorisi belirleme (Zayıf / Normal / Fazla Kilolu / Obez)

### Frontend
- [x] OnboardingSurvey sayfası (14 alan: yaş, cinsiyet, boy, kilo, hedef, diyet, alerji, aktivite, egzersiz sıklığı, uyku, su tüketimi, ekran süresi, sağlık notları)
- [x] Form validasyonu
- [x] Sınıflandırma sonuç ekranı
- [x] Dashboard sayfası (kullanıcı bilgileri, BMI değeri ve kategorisi)
- [x] Navigasyon yapısı

### Sınıflandırma Mantığı
- [x] Aktivite seviyesi + egzersiz sıklığı → puan hesaplama
- [x] Puan aralığına göre seviye atama

---

## Requirement → Design → Implementation → Test Döngüsü

| Aşama | Çıktı |
|-------|-------|
| **Requirement** | US-005 – US-008 kabul kriterleri |
| **Design** | SDD_v2 — Dashboard API arayüzleri, sınıflandırma algoritması tasarımı |
| **Implementation** | dashboardController.js, Dashboard.jsx, OnboardingSurvey.jsx |
| **Test** | Manuel: Anket doldur → Sınıflandırma sonucu gör → BMI değerini kontrol et |

---

## Kabul Kriterleri

- [ ] Tüm anket alanları doldurulabilir ve doğrulanır
- [ ] Eksik alan bırakıldığında uyarı gösterilir
- [ ] Anket gönderildiğinde sınıf (Beginner/Intermediate/Advanced) döner
- [ ] Dashboard'da BMI değeri ve kategorisi doğru hesaplanır
- [ ] Dashboard'da kullanıcı adı ve bilgileri görünür

---

## Definition of Done

- Sınıflandırma algoritması test edildi
- BMI hesabı farklı değerler için kontrol edildi
- Manuel end-to-end test geçildi
- Commit yapıldı ve push edildi

---

## Notlar

- Anket verileri veritabanında saklanmak yerine session bazlı tutulmaktadır (MVP kararı)
- Sınıflandırma kriterleri ilerleyen sprintlerde AI desteğiyle zenginleştirilebilir
