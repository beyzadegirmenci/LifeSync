const User = require('../models/User');
const axios = require('axios');
const WellnessPlanFacade = require('../facades/WellnessPlanFacade');
const PlanEventEmitter = require('../observers/PlanEventEmitter');
const UserNotificationObserver = require('../observers/UserNotificationObserver');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

const createWellnessPlanFacade = (controller) => new WellnessPlanFacade({
    defaultModel: DEFAULT_MODEL,
    generateRecommendation: controller.generateRecommendation.bind(controller),
    callOllama: controller.callOllama.bind(controller)
});

const dashboardController = {
    async getDashboard(req, res) {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let bmi = null;
            let bmiCategory = null;
            if (user.height && user.weight) {
                const heightInMeters = user.height / 100;
                bmi = parseFloat((user.weight / (heightInMeters * heightInMeters)).toFixed(1));

                if (bmi < 18.5) bmiCategory = 'Underweight';
                else if (bmi < 25) bmiCategory = 'Normal';
                else if (bmi < 30) bmiCategory = 'Overweight';
                else bmiCategory = 'Obese';
            }

            res.json({
                user: {
                    userId: user.user_id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    height: user.height,
                    weight: user.weight,
                    age: user.age,
                    gender: user.gender
                },
                health: {
                    bmi,
                    bmiCategory
                }
            });
        } catch (error) {
            console.error('Dashboard error:', error);
            res.status(500).json({ error: 'Failed to load dashboard' });
        }
    },

    classifyUser(profile) {
        const bmi = parseFloat((profile.weight_kg / ((profile.height_cm / 100) ** 2)).toFixed(1));
        let score = 0;
        const reasons = [];

        if (profile.activity_level >= 4) {
            score += 2;
            reasons.push('Günlük aktivite seviyesi yüksek.');
        } else if (profile.activity_level === 3) {
            score += 1;
            reasons.push('Günlük aktivite seviyesi orta.');
        } else {
            reasons.push('Günlük aktivite seviyesi düşük.');
        }

        if (profile.exercise_days_per_week >= 4) {
            score += 2;
            reasons.push('Haftalık egzersiz sıklığı yüksek.');
        } else if (profile.exercise_days_per_week >= 2) {
            score += 1;
            reasons.push('Haftalık egzersiz sıklığı orta.');
        } else {
            reasons.push('Haftalık egzersiz sıklığı düşük.');
        }

        if (bmi >= 18.5 && bmi <= 29.9) {
            score += 1;
            reasons.push('BMI aralığı planlama açısından yönetilebilir seviyede.');
        } else {
            reasons.push('BMI özel dikkat gerektirebilir.');
        }

        if (profile.sleep_hours >= 6 && profile.sleep_hours <= 9) {
            score += 1;
            reasons.push('Uyku süresi dengeli.');
        } else {
            reasons.push('Uyku düzeni iyileştirilebilir.');
        }

        if (profile.water_liters_per_day >= 2) {
            score += 1;
            reasons.push('Su tüketimi iyi düzeyde.');
        } else {
            reasons.push('Su tüketimi düşük.');
        }

        let level = 'Beginner';
        if (score <= 2) {
            level = 'Beginner';
        } else if (score <= 5) {
            level = 'Intermediate';
        } else {
            level = 'Advanced';
        }

        return { level, score, reasons, bmi };
    },

    async generateRecommendation(profile, classification, model = DEFAULT_MODEL) {
        const prompt = this.buildPrompt(profile, classification);

        const payload = {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                num_predict: 4000,
                temperature: 0.3
            }
        };

        try {
            const response = await axios.post(OLLAMA_URL, payload, {
                timeout: 300000 // 5 mins
            });

            const rawText = response.data.response?.trim() || 'Model boş yanıt döndürdü.';
            const sanitizedText = this.sanitizeRecommendationText(rawText, profile, classification.level);

            return {
                level: classification.level,
                raw_text: sanitizedText,
                metadata: {
                    model: response.data.model || model,
                    done: response.data.done || false
                }
            };
        } catch (error) {
            console.error('Ollama error:', error.message);
            return {
                level: classification.level,
                raw_text: 'AI önerisi şu anda üretilemedi. Lütfen daha sonra tekrar deneyin.',
                metadata: {
                    model: model,
                    error: 'Ollama bağlantısı kurulamadı. Varsayılan öneriler gösterilmektedir.'
                }
            };
        }
    },

    buildPrompt(profile, result) {
        return `
Sen bir sağlıklı yaşam asistanısın.
Kullanıcı için güvenli, uygulanabilir, kısa ve net öneriler üret.

ÖNEMLİ KURALLAR:
- Tıbbi teşhis koyma.
- Riskli, aşırı zorlayıcı öneriler verme.
- Kullanıcının seviyesi ${result.level} olduğu için önerileri buna uygun hazırla.
- Cevabı Türkçe ver.
- Formatı düzenli olsun.
- Çok uzun yazma.
- Kullanıcı bilgilerini metin içinde tekrar etme (yaş, kilo, boy, cinsiyet, BMI vb. yazma).
- Prompt/kurallar/meta ifadeleri asla yazma.
- İngilizce kelime kullanma (ör. lunch, dinner, starting point, dairy).
- Kullanıcının tüketmediğini belirttiği gıdaları asla önerme.
- "kırmızı parça et tüketmiyorum" gibi bir kısıt varsa dana/kuzu/sığır/biftek/antrikot/bonfile/pirzola yazma.
- Bu kısıtta sadece izinli alternatifler öner: tavuk, hindi, balık, yumurta, kurubaklagil, tofu.

KULLANICI BİLGİLERİ:
- Yaş: ${profile.age}
- Cinsiyet: ${profile.gender}
- Boy: ${profile.height_cm} cm
- Kilo: ${profile.weight_kg} kg
- BMI: ${result.bmi}
- Hedef: ${profile.goal}
- Beslenme tercihi: ${profile.diet_preference}
- Alerji / kısıt: ${profile.allergy_or_restriction}
- Aktivite seviyesi: ${profile.activity_level}/5
- Haftalık egzersiz günü: ${profile.exercise_days_per_week}
- Uyku: ${profile.sleep_hours} saat
- Günlük su: ${profile.water_liters_per_day} litre
- Günlük ekran süresi: ${profile.screen_hours_per_day} saat
- Ek sağlık notu: ${profile.health_note}
- Seviye: ${result.level}

Lütfen şu başlıklarda cevap ver:
1. Kısa genel değerlendirme
2. Diyet önerileri
3. Egzersiz önerileri
4. Günlük rutin önerisi
5. Su içme ve alışkanlık hatırlatmaları
6. Dikkat edilmesi gerekenler

Her bölüm kısa, uygulanabilir ve maddeli olsun.

ÇIKTI FORMATI:
- Her başlık altında sadece Türkçe maddeler yaz.
- Her madde açık ve anlaşılır olsun.
- Her başlık altında en fazla 4 madde yaz.
- Bozuk veya karışık dil kullanırsan cevap geçersiz sayılır.
`.trim();
    },

    normalizeRecommendationLanguage(text) {
        const replacements = [
            { pattern: /starting\s*point/gi, value: 'başlangıç noktası' },
            { pattern: /dairy\s*products?/gi, value: 'süt ürünleri' },
            { pattern: /lunch/gi, value: 'öğle öğünü' },
            { pattern: /dinner/gi, value: 'akşam öğünü' },
            { pattern: /proposal(lar[ıi]?)?/gi, value: 'öneriler' },
            { pattern: /\bonly\b/gi, value: 'yalnızca' },
            { pattern: /\bdaily\b/gi, value: 'günlük' },
            { pattern: /\bpriorit(?:y|ies|ize|ized)\b/gi, value: 'öncelik' },
            { pattern: /\bcalorie\b/gi, value: 'kalori' },
            { pattern: /\bkalorie\b/gi, value: 'kalori' },
            { pattern: /\bdeep\s*breathing\b/gi, value: 'derin nefes egzersizi' }
        ];

        let output = text || '';
        for (const replacement of replacements) {
            output = output.replace(replacement.pattern, replacement.value);
        }

        return output;
    },

    sanitizeRecommendationText(text, profile = {}, level = 'Beginner') {
        if (!text || typeof text !== 'string') {
            return 'AI önerisi şu anda üretilemedi. Lütfen daha sonra tekrar deneyin.';
        }

        const metaLineRegex = /^(kullan[ıi]c[ıi]\s*bilgileri|[öo]nemli\s*kurallar|[çc][ıi]kt[ıi]\s*format[ıi]|input|prompt|l[uü]tfen\s*şu\s*başl[ıi]klarda|bozuk\s*veya\s*kar[ıi]ş[ıi]k\s*dil)/i;
        const privateLineRegex = /^(yaş|cinsiyet|boy|kilo|bmi|hedef|beslenme\s*tercihi|alerji|aktivite\s*seviyesi|haftal[ıi]k\s*egzersiz|uyku|g[uü]nl[uü]k\s*su|g[uü]nl[uü]k\s*ekran\s*s[üu]resi|ek\s*sağl[ıi]k\s*notu)\s*:/i;

        const profileNarrativeRegex = /(kullan[ıi]c[ıi].*(yaş|kg|cm|bmi|cinsiyet|boy|kilo|hedef)|\b\d{1,3}\s*yaş|\b\d{2,3}\s*cm|\b\d{2,3}\s*kg|\bbmi\b)/i;

        let output = text.replace(/\r\n/g, '\n');
        output = this.normalizeRecommendationLanguage(output);

        output = output
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line)
            .filter((line) => !metaLineRegex.test(line.toLowerCase()))
            .filter((line) => !privateLineRegex.test(line.toLowerCase()))
            .filter((line) => !profileNarrativeRegex.test(line.toLowerCase()))
            .join('\n');

        output = this.applyDietRestrictionsToPlan(output, profile);
        output = this.normalizeRecommendationLanguage(output);

        if (!output || output.trim().length === 0) {
            return 'AI önerisi şu anda üretilemedi. Lütfen daha sonra tekrar deneyin.';
        }

        return output;
    },

    getDefaultRecommendation(level, profile) {
        const beginnerRecs = `
## 1. Kısa Genel Değerlendirme
Başlangıç aşamasındasınız. Hedeflerinize ulaşmak için temel alışkanlıklar oluşturmalısınız.

## 2. Diyet Önerileri
- Günde 3 ana öğün yapın
- İşlenmiş gıdaları azaltın
- Meyve ve sebze tüketimini artırın
- Proteini dengeli tüketin

## 3. Egzersiz Önerileri
- Haftada 3 gün 30 dakika hafif aktivite
- Yürüyüş veya bisiklet ile başlayın
- Germeler (stretch) yapmayı unutmayın

## 4. Günlük Rutin Önerisi
- Sabah erken kalkış alışkanlığı yapın
- Gün içinde ara vermeler alın
- Belli saatlerde yemek yiyin

## 5. Su İçme ve Alışkanlıklar
- Günde en az 8-10 bardak su için
- Sabah ilk işiniz su içmek olsun
- Uyku öncesi 1 saat az su tüketin

## 6. Dikkat Edilmesi Gerekenler
- Çok hızlı değişim beklememeyin
- Sabrın ve disiplinin devamını sağlayın
`;

        const intermediateRecs = `
## 1. Kısa Genel Değerlendirme
Orta seviyesiniz. Şimdiye kadar iyi bir temel oluşturdunuz, bunu geliştirmeye devam edin.

## 2. Diyet Önerileri
- Makro besinleri hesaplamaya başlayın
- Beslenme planını yazılı tutun
- Sağlıklı snacklar seçin
- Su tüketimini artırın

## 3. Egzersiz Önerileri
- Haftada 4-5 gün egzersiz yapın
- Dayanıklılık ve kuvvet antrenmanı karıştırın
- Kişisel bir program oluşturun

## 4. Günlük Rutin Önerisi
- Egzersiz için sabit zaman belirleyin
- Uyku düzeni düzenli olsun
- Meditasyon veya yoga deneyin

## 5. Su İçme ve Alışkanlıklar
- Beden ağırlığınıza göre su hesapla: kilo × 35ml
- Egzersizden sonra fazla su içmeyi unutmayın

## 6. Dikkat Edilmesi Gerekenler
- Aşırı antrenman yapmayın
- Beslenmeye dikkat edin
- İlerlemelerinizi takip edin
`;

        const advancedRecs = `
## 1. Kısa Genel Değerlendirme
İleri seviyesiniz. Sağlıklı yaşam alışkanlıklarınız iyi yerleşmiş durumda.

## 2. Diyet Önerileri
- İleri seviye beslenme planı uygulamak
- Beden kompozisyonunuza göre makro ayarı
- Suplement kullanımını değerlendir
- Beslenme deklaresini okumayı alışkanlık haline getir

## 3. Egzersiz Önerileri
- Haftada 5-6 gün spor yapın
- Farklı antrenman yöntemlerini dene
- Progresif aşırı yüklenme uygula
- Esneklik ve dengeyi ihmal etme

## 4. Günlük Rutin Önerisi
- Dinlenme günlerini planla
- Stres yönetimi önemli
- Kalite uyku hedef: 7-9 saat

## 5. Su İçme ve Alışkanlıklar
- Egzersiz türüne göre sıvı kaybı kompanse et
- Elektrolit dengesini gözet
- Günlük su hedefini artırabilir

## 6. Dikkat Edilmesi Gerekenler
- Aşırı antrenman sendromuna dikkat
- Yaralanmalardan korunun
- Periyodik sağlık kontrolü yaptır
`;

        if (level === 'Beginner') return beginnerRecs;
        if (level === 'Intermediate') return intermediateRecs;
        return advancedRecs;
    },

    async survey(req, res) {
        try {
            const userId = req.userId;
            const profile = req.body;

            // Validate required fields
            if (!profile.age || !profile.gender || !profile.height_cm || !profile.weight_kg ||
                !profile.goal || !profile.diet_preference || profile.exercise_days_per_week === undefined ||
                !profile.sleep_hours || !profile.water_liters_per_day || !profile.screen_hours_per_day) {
                return res.status(400).json({ error: 'Gerekli alanlar eksik' });
            }

            // Type and range validation
            const age = parseInt(profile.age);
            const height = parseFloat(profile.height_cm);
            const weight = parseFloat(profile.weight_kg);
            const exerciseDays = parseInt(profile.exercise_days_per_week);
            const sleepHours = parseFloat(profile.sleep_hours);
            const water = parseFloat(profile.water_liters_per_day);
            const screen = parseFloat(profile.screen_hours_per_day);

            if (isNaN(age) || age < 10 || age > 120)
                return res.status(400).json({ error: 'Yaş 10-120 arasında olmalıdır' });
            if (isNaN(height) || height < 100 || height > 250)
                return res.status(400).json({ error: 'Boy 100-250 cm arasında olmalıdır' });
            if (isNaN(weight) || weight < 30 || weight > 300)
                return res.status(400).json({ error: 'Kilo 30-300 kg arasında olmalıdır' });
            if (isNaN(exerciseDays) || exerciseDays < 0 || exerciseDays > 7)
                return res.status(400).json({ error: 'Egzersiz günü 0-7 arasında olmalıdır' });
            if (isNaN(sleepHours) || sleepHours < 0 || sleepHours > 24)
                return res.status(400).json({ error: 'Uyku süresi 0-24 saat arasında olmalıdır' });
            if (isNaN(water) || water < 0 || water > 20)
                return res.status(400).json({ error: 'Su tüketimi 0-20 litre arasında olmalıdır' });
            if (isNaN(screen) || screen < 0 || screen > 24)
                return res.status(400).json({ error: 'Ekran süresi 0-24 saat arasında olmalıdır' });

            // Classify user
            const classification = this.classifyUser(profile);

            // Facade handles recommendation generation complexity behind one simple API.
            const wellnessPlanFacade = createWellnessPlanFacade(this);
            const recommendation = await wellnessPlanFacade.generateSurveyRecommendation(profile, classification);

            try {
                const eventEmitter = new PlanEventEmitter();
                const observer = new UserNotificationObserver(userId);
                eventEmitter.attach(observer);
                await eventEmitter.emitSurveyCompleted(userId);
                eventEmitter.detach(observer);
            } catch (notificationError) {
                console.error('Survey notification error:', notificationError.message);
            }

            res.json({
                classification,
                recommendation
            });
        } catch (error) {
            console.error('Survey error:', error);
            res.status(500).json({ error: 'Anket işlenirken bir hata oluştu' });
        }
    },

    async callOllama(prompt, model = DEFAULT_MODEL, numPredict = 4000) {
        const payload = {
            model,
            prompt,
            stream: true,
            options: { num_predict: numPredict, temperature: 0.7 }
        };

        const response = await axios.post(OLLAMA_URL, payload, {
            timeout: 300000,
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            let fullText = '';

            response.data.on('data', (chunk) => {
                try {
                    const lines = chunk.toString().split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        const json = JSON.parse(line);
                        if (json.response) fullText += json.response;
                    }
                } catch (_) { /* skip parse errors */ }
            });

            response.data.on('end', () => {
                if (!fullText.trim()) reject(new Error('Ollama boş yanıt döndü'));
                else resolve(fullText);
            });

            response.data.on('error', reject);
        });
    },

    async dietPlan(req, res) {
        try {
            const { profile, classification, duration } = req.body;
            const userId = req.userId; // Auth middleware'den gelen kullanıcı ID

            const wellnessPlanFacade = createWellnessPlanFacade(this);
            // generateDietPlanResult metoduna userId pass et (observer için)
            const result = await wellnessPlanFacade.generateDietPlanResult(profile, classification, duration, userId);

            if (result.error) {
                return res.status(result.statusCode || 400).json({ error: result.error });
            }

            return res.status(result.statusCode || 200).json(result.data);
        } catch (error) {
            console.error('Diet plan error:', error.message);
            return res.status(503).json({
                error: 'AI beslenme planı şu anda üretilemedi. Lütfen kısa süre sonra tekrar deneyin.'
            });
        }
    },

    buildDietPlanPrompt(profile, classification, durationLabel, duration) {
        const bmi = classification?.bmi || 'bilinmiyor';
        const level = classification?.level || 'bilinmiyor';
        const waterPerDay = profile.water_liters_per_day || 2;
        const preferenceText = `${profile.diet_preference || ''} ${profile.allergy_or_restriction || ''}`.toLowerCase();
        const noRedMeat = /(k[ıi]rm[ıi]z[ıi].*(et|par[çc]a)|dana|kuzu|s[ıi][ğg]?[ıi]r)/i.test(preferenceText)
            && /(t[üu]ketmiyorum|yemiyorum|istemiyorum|olmas[ıi]n|yasak|k[ıi]s[ıi]t|sevmiyorum)/i.test(preferenceText);

        const durationInstruction = duration === 'daily'
            ? 'Sadece 1 gün için plan üret. 2. gün veya sonraki günleri yazma.'
            : duration === 'weekly'
                ? 'Sadece 1 hafta (7 gün) için plan üret. 2. haftayı yazma.'
                : 'Sadece 1 ay için plan üret. Tam 30 günü gün gün yaz. 2. ayı yazma.';

        const durationFormatRule = duration === 'daily'
            ? 'Zorunlu başlık: "Gün 1". Sadece o günün öğünlerini ver.'
            : duration === 'weekly'
                ? 'Zorunlu başlıklar: "Gün 1" ile "Gün 7" arası eksiksiz.'
                : 'Zorunlu başlıklar: "Gün 1" ile "Gün 30" arası eksiksiz, her gün için ayrı öğün planı.';

        return `
Sen bir profesyonel diyetisyen ve beslenme uzmanısın.
Kullanıcının verilerine göre, sadece istenen süre için kişiye özel beslenme planı üret.

KULLANICI BİLGİLERİ:
- Yaş: ${profile.age}
- Cinsiyet: ${profile.gender}
- Boy: ${profile.height_cm} cm
- Kilo: ${profile.weight_kg} kg
- BMI: ${bmi}
- Hedef: ${profile.goal}
- Beslenme tercihi: ${profile.diet_preference}
- Alerji / Kısıtlama: ${profile.allergy_or_restriction}
- Aktivite seviyesi: ${profile.activity_level}/5
- Haftalık egzersiz: ${profile.exercise_days_per_week} gün
- Uyku: ${profile.sleep_hours} saat
- Sağlık seviyesi: ${level}
- Sağlık notu: ${profile.health_note}

PLAN TİPİ: ${durationLabel.toUpperCase()} DİYET PLANI

KURALLAR:
- ${durationInstruction}
- ${durationFormatRule}
- Planı sadece kullanıcı verilerine göre oluştur.
- Beslenme tercihi, alerjiler ve sağlık notuna tam uyum sağla.
- Kalori ve makro dağılımını (protein/karbonhidrat/yağ) hedefe uygun belirle.
- Öğünleri gerçekçi, uygulanabilir ve pratik seç.
- Günlük su hedefini belirt (yaklaşık ${waterPerDay} litre/gün).
- Türkçe yaz.
- İngilizce başlık kullanma (Lunch, Dinner vb. yasak).
- Belirsiz ifade kullanma ("1 adet tavuk" gibi). Her öğünde spesifik yemek adı ve porsiyon yaz.
- Kırmızı et önerme; kullanıcı tercihine uy.
- KULLANICI KISITI CIGNENEMEZ: kullanici bir gidayi tuketmedigini soyluyorsa o gida asla plana girmez.
- YASAKLI GIDA GORULURSE ALTERNATIF URET: ayni ogunu izinli proteinle degistir (tavuk, hindi, balik, yumurta, kurubaklagil, tofu).
- "alternatif olarak ..." gibi belirsiz not yazma; dogrudan kural uyumlu ogunu yaz.
- Asla tablo/markdown tablo kullanma (| karakteri ile satır yazma).
- Asla "Kullanıcı Bilgileri", "Öneriler", "Dikkat edilmesi gerekenler", "Plan Özeti" gibi plan dışı bölüm ekleme.
- Çıktıda kişisel veri satırı (yaş, kilo, boy, cinsiyet, BMI, hedef vb.) yazma.
- Sadece gün başlıkları ve öğün satırları yaz.
- Haftalık planda her günün ana öğün kombinasyonu farklı olmalı; birebir aynı gün menüsü tekrar etmeyecek.
- Aylık planda ardışık günler birebir kopya olmayacak; dengeli ve döngüsel çeşitlilik uygula.
${noRedMeat ? '- KRITIK KISIT: Kirmizi parca et YASAK. Dana, kuzu, sigir, biftek, antrikot, bonfile, pirzola yazma. Bu ogunlerde tavuk/hindi/balik/kurubaklagil kullan.' : ''}

ÇIKTI FORMATI:
- Başlıklı bölümler kullan.
- Süreye uygun gün/hafta düzeni ver.
- Her öğün için miktar (gram/ml/adet) yaz.
- Video/link/URL ekleme.
- Tablo kullanma; açık ve okunabilir günlük başlık formatı kullan.

Yalnızca ${durationLabel} planı üret.
`.trim();
    },

    getDietRestrictions(profile = {}) {
        const combined = `${profile.diet_preference || ''} ${profile.allergy_or_restriction || ''}`.toLowerCase();
        const noRedMeat = /(k[ıi]rm[ıi]z[ıi].*(et|par[çc]a)|dana|kuzu|s[ıi][ğg]?[ıi]r)/i.test(combined)
            && /(t[üu]ketmiyorum|yemiyorum|istemiyorum|olmas[ıi]n|yasak|k[ıi]s[ıi]t|sevmiyorum)/i.test(combined);

        return { noRedMeat };
    },

    applyDietRestrictionsToPlan(text, profile = {}) {
        let output = text || '';
        const { noRedMeat } = this.getDietRestrictions(profile);

        if (noRedMeat) {
            const replacements = [
                { pattern: /\bk[ıi]rm[ıi]z[ıi]\s*et\b/gi, value: 'tavuk veya balık' },
                { pattern: /\bdana\s*eti\b/gi, value: 'tavuk göğüs' },
                { pattern: /\bdana\b/gi, value: 'tavuk' },
                { pattern: /\bkuzu\s*eti\b/gi, value: 'hindi' },
                { pattern: /\bkuzu\b/gi, value: 'hindi' },
                { pattern: /\bs[ıi][ğg]?[ıi]r\s*eti\b/gi, value: 'balık' },
                { pattern: /\bbiftek\b/gi, value: 'ızgara tavuk' },
                { pattern: /\bantrikot\b/gi, value: 'fırında somon' },
                { pattern: /\bbonfile\b/gi, value: 'hindi bonfile' },
                { pattern: /\bpirzola\b/gi, value: 'fırın tavuk' }
            ];

            for (const replacement of replacements) {
                output = output.replace(replacement.pattern, replacement.value);
            }
        }

        return output;
    },

    sanitizePlanByDuration(text, duration) {
        const normalized = text.replace(/\r\n/g, '\n');
        const withoutLinks = normalized
            .split('\n')
            .filter((line) => !/(youtube|youtu\.be|https?:\/\/|www\.|video|link|url)/i.test(line))
            .join('\n');

        if (duration === 'daily') {
            const day2Index = withoutLinks.search(/(^|\n)\s{0,3}(#{1,6}\s*)?((g[uü]n\s*2)|(day\s*2)|sal[ıi]|tuesday)\b/i);
            return day2Index > -1 ? withoutLinks.slice(0, day2Index).trim() : withoutLinks.trim();
        }

        if (duration === 'weekly') {
            const week2Index = withoutLinks.search(/(^|\n)\s{0,3}(#{1,6}\s*)?(hafta\s*2|week\s*2)\b/i);
            return week2Index > -1 ? withoutLinks.slice(0, week2Index).trim() : withoutLinks.trim();
        }

        if (duration === 'monthly') {
            const month2Index = withoutLinks.search(/(^|\n)\s{0,3}(#{1,6}\s*)?(ay\s*2|month\s*2)\b/i);
            return month2Index > -1 ? withoutLinks.slice(0, month2Index).trim() : withoutLinks.trim();
        }

        return withoutLinks.trim();
    },

    sanitizeDietPlanContent(text, duration = 'weekly') {
        if (!text || typeof text !== 'string') {
            return '';
        }

        const normalized = text.replace(/\r\n/g, '\n');
        const dropAfterSectionRegex = /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:dikkat\s*edilmesi\s*gerekenler|öneriler|oneriler|notlar|plan\s*özeti|plan\s*ozeti)\s*:?.*$/i;
        const cutIndex = normalized.search(dropAfterSectionRegex);
        const limited = cutIndex > -1 ? normalized.slice(0, cutIndex) : normalized;

        const metaLineRegex = /^(kullan[ıi]c[ıi]\s*bilgileri|haftal[ıi]k\s*diyet\s*plan[ıi]|plan\s*tipi|kurallar|[çc][ıi]kt[ıi]\s*format[ıi]|input|output|summary|plan\s*ozeti)/i;
        const privateLineRegex = /^(yaş|yas|cinsiyet|boy|kilo|bmi|hedef|beslenme\s*tercihi|alerji|aktivite\s*seviyesi|haftal[ıi]k\s*egzersiz|uyku|sağl[ıi]k\s*seviyesi|sağl[ıi]k\s*notu|g[uü]nl[uü]k\s*su)\s*:/i;
        const allowedLineRegex = /^(?:#{1,6}\s*)?(?:g[uü]n\s*\d+|uyuduktan\s*sonra|kahvalt[ıi]|[öo]ğ[uü]n\s*\d+|ara\s*[öo]ğ[uü]n\s*\d*|[öo]ğle|akşam|gece|toplam|\+\s*.+)/i;

        const cleanedLines = limited
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line)
            .filter((line) => !line.includes('|'))
            .filter((line) => !/^[-:|\s]+$/.test(line))
            .filter((line) => !metaLineRegex.test(line.toLowerCase()))
            .filter((line) => !privateLineRegex.test(line.toLowerCase()))
            .filter((line) => allowedLineRegex.test(line));

        const replacements = [
            { pattern: /\bsalad\b/gi, value: 'salata' },
            { pattern: /\bsandwich\b/gi, value: 'sandviç' },
            { pattern: /\bmeal\b/gi, value: 'öğün' }
        ];

        let output = cleanedLines.join('\n');
        for (const replacement of replacements) {
            output = output.replace(replacement.pattern, replacement.value);
        }

        if (duration === 'daily') {
            const day2Index = output.search(/(^|\n)\s{0,3}(?:#{1,6}\s*)?g[uü]n\s*2\b/i);
            return (day2Index > -1 ? output.slice(0, day2Index) : output).trim();
        }

        return output.trim();
    },

    hasSufficientDailyVariety(text, duration = 'weekly') {
        if (!text || typeof text !== 'string') {
            return false;
        }

        if (duration !== 'weekly' && duration !== 'monthly') {
            return true;
        }

        const dayBlocks = [];
        const dayRegex = /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?g[uü]n\s*(\d{1,2})\b/gi;
        const matches = [...text.matchAll(dayRegex)];

        for (let i = 0; i < matches.length; i += 1) {
            const start = matches[i].index;
            const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
            if (start !== undefined) {
                const block = text.slice(start, end)
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .replace(/g[uü]n\s*\d+/g, 'gün')
                    .trim();
                dayBlocks.push(block);
            }
        }

        if (dayBlocks.length === 0) {
            return false;
        }

        const uniqueCount = new Set(dayBlocks).size;
        if (duration === 'weekly') {
            return uniqueCount >= 4;
        }

        return uniqueCount >= 12;
    },

    hasCompleteMonthlyDietDays(text) {
        const foundDays = new Set();
        const dayRegex = /(?:^|\n)\s{0,3}(?:#{1,6}\s*)?(?:g[uü]n|day)\s*(\d{1,2})\b/gi;
        let match = dayRegex.exec(text);

        while (match) {
            const day = parseInt(match[1], 10);
            if (!Number.isNaN(day) && day >= 1 && day <= 30) {
                foundDays.add(day);
            }
            match = dayRegex.exec(text);
        }

        for (let i = 1; i <= 30; i += 1) {
            if (!foundDays.has(i)) {
                return false;
            }
        }

        return true;
    },

    async generateDietPlan(prompt, model = DEFAULT_MODEL, duration = 'weekly', profile = {}) {
        const numPredict = duration === 'monthly' ? 7000 : 4000;

        const streamPlan = async (promptText) => {
            const payload = {
                model: model,
                prompt: promptText,
                stream: true,
                options: {
                    num_predict: numPredict,
                    temperature: 0.3
                }
            };

            const response = await axios.post(OLLAMA_URL, payload, {
                timeout: 180000,
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                let fullText = '';

                response.data.on('data', (chunk) => {
                    try {
                        const lines = chunk.toString().split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                            }
                        }
                    } catch (e) {
                        // Skip JSON parse errors in streaming
                    }
                });

                response.data.on('end', () => {
                    if (!fullText.trim()) {
                        reject(new Error('Ollama boş yanıt döndü'));
                    } else {
                        resolve(fullText);
                    }
                });

                response.data.on('error', (error) => {
                    reject(error);
                });
            });
        };

        try {
            const firstRaw = await streamPlan(prompt);
            let sanitized = this.sanitizePlanByDuration(firstRaw, duration);
            sanitized = this.sanitizeDietPlanContent(sanitized, duration);
            sanitized = this.applyDietRestrictionsToPlan(sanitized, profile);
            let attempt = 1;

            const requiresVarietyRetry = (duration === 'weekly' || duration === 'monthly')
                && !this.hasSufficientDailyVariety(sanitized, duration);

            if (requiresVarietyRetry) {
                const retryPromptForVariety = `${prompt}\n\nKRİTİK DÜZELTME:\n- Çıktıda günler birbirine fazla benziyor.\n- Her günün öğünleri farklı olmalı, birebir kopya gün istemiyorum.\n- Kişisel bilgi, öneriler, dikkat notları, özet ve tablo ekleme.\n- Sadece Gün başlığı + öğün satırları ver.`;
                const retryRawForVariety = await streamPlan(retryPromptForVariety);
                sanitized = this.sanitizePlanByDuration(retryRawForVariety, duration);
                sanitized = this.sanitizeDietPlanContent(sanitized, duration);
                sanitized = this.applyDietRestrictionsToPlan(sanitized, profile);
                attempt = 2;
            }

            if (duration === 'monthly' && !this.hasCompleteMonthlyDietDays(sanitized)) {
                const retryPrompt = `${prompt}\n\nKRİTİK DÜZELTME:\n- Cevap eksik. Tam 30 gün (Gün 1..Gün 30) ver.\n- Her gün için kahvaltı, öğle, ara öğün, akşam öğünü ayrı yaz.\n- Örnek/şablon değil, gerçek günlük plan yaz.`;
                const retryRaw = await streamPlan(retryPrompt);
                sanitized = this.sanitizePlanByDuration(retryRaw, duration);
                sanitized = this.sanitizeDietPlanContent(sanitized, duration);
                sanitized = this.applyDietRestrictionsToPlan(sanitized, profile);
                attempt = Math.max(attempt, 2);

                if (!this.hasCompleteMonthlyDietDays(sanitized)) {
                    throw new Error('Aylık diyet planı 30 günü eksiksiz üretemedi');
                }
            }

            return {
                raw_text: sanitized,
                metadata: {
                    model: model,
                    done: true,
                    source: 'ollama',
                    attempt
                }
            };
        } catch (error) {
            console.error('Ollama diet plan error:', error.message);
            throw error; // Let the caller handle the error
        }
    },

    getDefaultDietPlan() {
        return `
## Haftalık Beslenme Planı

### Pazartesi

**Sabah (08:00)**
- Yoğurt: 150g
- Granola: 30g
- Muz: 1 orta boy
- Enerji: 350 kkal | Protein: 12g | Karbohidrat: 55g | Yağ: 8g

**Öğlen (12:30)**
- Tavuk göğüs (haşlanmış): 150g
- Elde pirinç: 200g
- Brokoli (haşlanmış): 100g
- Zeytinyağı: 1 tatl. kaşığı
- Enerji: 550 kkal | Protein: 38g | Karbohidrat: 65g | Yağ: 10g

**Ara Yemek (15:00)**
- Elma: 1 orta boy
- Badem: 20g
- Enerji: 180 kkal | Protein: 4g | Karbohidrat: 20g | Yağ: 8g

**Akşam (19:00)**
- Somon filesi: 120g
- Tatlı patates (fırında): 150g
- Salata: 200g (mısır, domates, marul, salata sosu)
- Enerji: 450 kkal | Protein: 28g | Karbohidrat: 40g | Yağ: 18g

**Günlük Toplam**: 1530 kkal | 82g Protein | 180g Karbohidrat | 44g Yağ

---

### Salı

**Sabah (08:00)**
- Üzümlü çavdar ekmegi: 2 dilim
- Beyaz peynir: 30g
- Çay/Kahve: 1 fincan (şekersiz)
- Enerji: 320 kkal | Protein: 10g | Karbohidrat: 50g | Yağ: 8g

**Öğlen (12:30)**
- Kırmızı mercan balığı: 150g
- Kaynatılmış patates: 200g
- Havuç (haşlanmış): 100g
- Zeytinyağı: 1 tatl. kaşığı
- Enerji: 520 kkal | Protein: 35g | Karbohidrat: 60g | Yağ: 11g

**Ara Yemek (15:00)**
- Portakal: 1 orta boy
- Fındık: 15g
- Enerji: 160 kkal | Protein: 3g | Karbohidrat: 18g | Yağ: 9g

**Akşam (19:00)**
- Tavuk tandoori: 130g
- Lahana salatası: 150g
- Yaz cereal: 100g
- Enerji: 420 kkal | Protein: 30g | Karbohidrat: 35g | Yağ: 15g

**Günlük Toplam**: 1420 kkal | 78g Protein | 163g Karbohidrat | 43g Yağ

---

### Çarşamba

**Sabah (08:00)**
- Omlet (2 yumurta): 100g
- Domates: 80g
- Buğday ekmegi: 1 dilim
- Enerji: 310 kkal | Protein: 15g | Karbohidrat: 28g | Yağ: 14g

**Öğlen (12:30)**
- Mercimek çorbası: 250ml
- Tavuk göğüs: 100g
- Pilav: 150g
- Turşu: 50g
- Enerji: 480 kkal | Protein: 32g | Karbohidrat: 58g | Yağ: 9g

**Ara Yemek (15:00)**
- Yoğurt: 150g
- Bal: 1 çay kaşığı
- Enerji: 140 kkal | Protein: 6g | Karbohidrat: 26g | Yağ: 1g

**Akşam (19:00)**
- Baked fıstık: 120g
- Taze salata: 200g (marul, roka, sos)
- Tost peyniri: 30g
- Enerji: 380 kkal | Protein: 22g | Karbohidrat: 32g | Yağ: 18g

**Günlük Toplam**: 1310 kkal | 75g Protein | 144g Karbohidrat | 42g Yağ

---

### Perşembe

**Sabah (08:00)**
- Müsli: 50g
- Süt: 200ml (1% yağlı)
- Çilek: 100g
- Enerji: 290 kkal | Protein: 11g | Karbohidrat: 48g | Yağ: 3g

**Öğlen (12:30)**
- Hindiba dolması: 150g
- Yumuşak pirinç: 180g
- Ayran: 200ml
- Enerji: 450 kkal | Protein: 14g | Karbohidrat: 72g | Yağ: 6g

**Ara Yemek (15:00)**
- Kiwi: 2 adet
- Antep fıstığı: 20g
- Enerji: 180 kkal | Protein: 4g | Karbohidrat: 22g | Yağ: 8g

**Akşam (19:00)**
- Kıymalı sebze tenceresi: 200g
- Kuskus: 100g
- Zeytinyağı: 1 tatl. kaşığı
- Enerji: 420 kkal | Protein: 18g | Karbohidrat: 48g | Yağ: 16g

**Günlük Toplam**: 1340 kkal | 47g Protein | 190g Karbohidrat | 33g Yağ

---

### Cuma

**Sabah (08:00)**
- Pancake: 2 adet (orta boy)
- Bal: 1 çay kaşığı
- Meyveli komposto: 100g
- Enerji: 350 kkal | Protein: 8g | Karbohidrat: 62g | Yağ: 6g

**Öğlen (12:30)**
- Izgara köfte: 130g
- Bulgur pilavı: 200g
- Misir: 80g
- Salata: 100g
- Enerji: 540 kkal | Protein: 32g | Karbohidrat: 68g | Yağ: 12g

**Ara Yemek (15:00)**
- Beyaz peynir: 50g
- Başak ekmeği: 1 adet
- Enerji: 200 kkal | Protein: 8g | Karbohidrat: 20g | Yağ: 8g

**Akşam (19:00)**
- Beyin: 120g
- Çiçek mevsi: 150g
- Mantar: 100g
- Yoğurt salatası: 100g
- Enerji: 380 kkal | Protein: 18g | Karbohidrat: 35g | Yağ: 17g

**Günlük Toplam**: 1470 kkal | 66g Protein | 185g Karbohidrat | 43g Yağ

---

### Cumartesi

**Sabah (08:00)**
- Pastirma: 40g
- Simit: 50g
- Yeşil çay: 1 fincan
- Enerji: 280 kkal | Protein: 12g | Karbohidrat: 38g | Yağ: 8g

**Öğlen (12:30)**
- Etli bamya: 250g
- Erişte: 150g
- Ayran: 200ml
- Enerji: 490 kkal | Protein: 24g | Karbohidrat: 62g | Yağ: 13g

**Ara Yemek (15:00)**
- Hurma: 5 adet
- Fındık: 15g
- Enerji: 190 kkal | Protein: 3g | Karbohidrat: 28g | Yağ: 7g

**Akşam (19:00)**
- Saç böbreği: 100g
- Tatlı civciv: 150g
- Patates patates: 100g
- Enerji: 360 kkal | Protein: 20g | Karbohidrat: 42g | Yağ: 11g

**Günlük Toplam**: 1320 kkal | 59g Protein | 170g Karbohidrat | 39g Yağ

---

### Pazar

**Sabah (08:00)**
- Peynirli tost: 1 adet
- Domates dilimi: 50g
- Portakal suyu: 150ml
- Enerji: 300 kkal | Protein: 11g | Karbohidrat: 42g | Yağ: 9g

**Öğlen (12:30)**
- Fırında çipura: 140g
- Sebzeli bulgur: 200g
- Salata: 100g
- Limon soslu sızma zeytinyağı: 1 tatl. kaşığı
- Enerji: 510 kkal | Protein: 36g | Karbohidrat: 55g | Yağ: 14g

**Ara Yemek (15:00)**
- Incir: 3 adet
- Kestane: 15g
- Enerji: 170 kkal | Protein: 2g | Karbohidrat: 32g | Yağ: 4g

**Akşam (19:00)**
- Tarçın soslu veya meze tabağı: 150g
- Sebzeli tava: 100g
- Brown bread: 1 dilim
- Enerji: 340 kkal | Protein: 16g | Karbohidrat: 38g | Yağ: 12g

**Günlük Toplam**: 1320 kkal | 65g Protein | 167g Karbohidrat | 39g Yağ

---

### Beslenme İpuçları

1. **Hidrasyon**: Günde 8-10 bardak su içmeyi ihmal etmeyin
2. **Esneklik**: Bu planı kendi zevkinize göre uyarlayabilirsiniz
3. **Pişirme**: Haşlama, fırınlama, ızgara tercih edin
4. **Tuzu**: Günlük tuz tüketimini 5g'nin altında tutun
5. **Ara yemekler**: Açlık hissettiğinizde yiyebileceğiniz sağlıklı seçenekler (kuru yemişler, meyva)

### Daha İyi Sonuçlar İçin

- Yemekleri zamanında ve oturup tüketin
- Çiğnenme işlemini iyi yapın
- Egzersiz sonrası protein tüketimine dikkat edin
- Her 3 gün beslenme planını değerlendirin
- Hissiyatlarınızı ve enerji seviyenizi gözleyin
`;
    },

    async exercisePlan(req, res) {
        try {
            const { profile, classification, duration } = req.body;
            const userId = req.userId; // Auth middleware'den gelen kullanıcı ID

            const wellnessPlanFacade = createWellnessPlanFacade(this);
            // generateExercisePlanResult metoduna userId pass et (observer için)
            const result = await wellnessPlanFacade.generateExercisePlanResult(profile, classification, duration, userId);

            if (result.error) {
                return res.status(result.statusCode || 400).json({ error: result.error });
            }

            return res.status(result.statusCode || 200).json(result.data);
        } catch (error) {
            console.error('Exercise plan error:', error.message);
            return res.status(503).json({
                error: 'AI egzersiz planı şu anda üretilemedi. Lütfen kısa süre sonra tekrar deneyin.'
            });
        }
    },

    buildExercisePlanPrompt(profile, classification, durationLabel, duration) {
        const bmi = classification?.bmi || 'bilinmiyor';
        const level = classification?.level || 'Intermediate';
        const durationInstruction = duration === 'daily'
            ? 'Sadece 1 günlük plan üret. 2. günü yazma.'
            : duration === 'weekly'
                ? 'Sadece 1 haftalık (7 gün) plan üret. 2. haftayı yazma.'
                : 'Sadece 1 aylık plan üret. Haftalara bölerek yazabilirsin ama 2. ayı yazma.';

        return `
Sen bir profesyonel fitness antrenörü ve egzersiz uzmanısın.
Detaylı, güvenli, uygulanabilir ve kişiye özel egzersiz planı oluştur.

KULLANICI BİLGİLERİ:
- Yaş: ${profile.age}
- Cinsiyet: ${profile.gender}
- Boy: ${profile.height_cm} cm
- Kilo: ${profile.weight_kg} kg
- BMI: ${bmi}
- Hedef: ${profile.goal}
- Aktivite seviyesi: ${profile.activity_level}/5
- Haftalık egzersiz: ${profile.exercise_days_per_week} gün
- Uyku: ${profile.sleep_hours} saat
- Ek sağlık notu: ${profile.health_note}
- Fitness seviyesi: ${level}

PLAN TİPİ: ${durationLabel.toUpperCase()} EGZERSİZ PLANI

KURALLAR:
- ${durationInstruction}
- Egzersizlerin zorluk seviyesi ${level} olsun
- Sağlık durumuna dikkat et: ${profile.health_note}
- Türkçe tüm içeriği yaz
- Süreye uygun gün/hafta bazlı başlıklandırma kullan
- Her egzersiz için:
  * Adı ve açıklama
  * Set ve tekrar sayısı
  * Dinlenme süresi
  * Hedeflenen kaslar
    * Bu kullanıcı seviyesine uygun varyasyon (başlangıç/orta/ileri)
- Isınma ve soğuma hareketleri ekle
- Egzersiz aralıkları ve dinlenme günlerini göster

ÖNEMLİ:
- Güvenli ve yaralanma riski düşük hareketler öner
- Progresif aşırı yüklenme ilkesini uygula
- Uyku ve toparlanmaya önem ver
- Motivasyon ve ipuçları ekle
- Kullanıcının sağlık notuna göre kaçınılması gereken hareketleri belirt
- Haftalık yük artışı önerisini güvenli aralıkla ver (her antrenmanda değil)

ÇIKTI FORMATI:
- Başlıklı bölümler kullan
- Süreye uygun detaylı program göster
- Video, link, URL veya YouTube bölümü EKLEME
- Dikkat edilmesi gerekenler bölümü ekle
- Uyku ve toparlanma bölümü ekle (hedef uyku süresi, dinlenme günü, esneme)
- Motivasyon ve günlük uygulanabilir ipuçları ekle

YANIT ŞABLONU:
1) ${durationLabel} Egzersiz Planı
2) Dikkat Edilmesi Gerekenler
3) Uyku ve Toparlanma
4) Motivasyon ve İpuçları

Yalnızca ${durationLabel} planı üret.
`.trim();
    },

    sanitizeExercisePlanOutput(text, duration = 'weekly') {
        return this.sanitizePlanByDuration(text, duration);
    },

    async generateExercisePlan(prompt, model = DEFAULT_MODEL, level = 'Beginner', duration = 'weekly') {
        const payload = {
            model: model,
            prompt: prompt,
            stream: true,
            options: {
                num_predict: 4000,
                temperature: 0.3
            }
        };

        try {
            const response = await axios.post(OLLAMA_URL, payload, {
                timeout: 120000, // 2 minutes for Ollama to respond
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                let fullText = '';
                
                response.data.on('data', (chunk) => {
                    try {
                        const lines = chunk.toString().split('\n').filter(line => line.trim());
                        for (const line of lines) {
                            const json = JSON.parse(line);
                            if (json.response) {
                                fullText += json.response;
                            }
                        }
                    } catch (e) {
                        // Skip JSON parse errors in streaming
                    }
                });

                response.data.on('end', () => {
                    if (!fullText.trim()) {
                        reject(new Error('Ollama boş yanıt döndü'));
                    } else {
                        resolve({
                            raw_text: this.sanitizeExercisePlanOutput(fullText, duration),
                            metadata: {
                                model: model,
                                done: true,
                                source: 'ollama'
                            }
                        });
                    }
                });

                response.data.on('error', (error) => {
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Ollama exercise plan error:', error.message);
            throw error; // Let the caller handle the error
        }
    },

    getDefaultExercisePlan(level = 'Beginner') {
        const beginnerPlan = `
## Haftalık Egzersiz Planı - Başlangıç Seviyesi

### Pazartesi - Kardiyovasküler Egzersizler

**Isınma (5 dakika)**
- Hafif tempoda yürüyüş veya dinamik germe

**Ana Egzersiz**
- Hızlı yürüyüş: 20-30 dakika (kalp atış hızınızın % 50-60'ı)
- Istirahat: 2 dakika
- Bisiklet (hafif): 15-20 dakika

**Soğuma (5 dakika)**
- Yavaş yürüyüş ve statik germeler

---

### Salı - Gücü Artırma (Ağırlıksız)

**Isınma (5 dakika)**
- Dinamik germeler ve hafif kardiyö

**Ana Egzersiz**
1. Şınav: 3 set x 5-10 tekrar
2. Bodyweight Squat: 3 set x 10-15 tekrar
3. Plank: 3 set x 20-30 saniye
4. Lunges: 3 set x 8 tekrar (her bacak)
5. Triceps Dips: 3 set x 5-10 tekrar

**Soğuma (5 dakika)**
- Statik germeler

---

### Çarşamba - Dinlenme Günü

- Hafif yürüyüş veya yoga
- 20-30 dakika

---

### Perşembe - Kardiyovasküler Egzersizler

- Hızlı yürüyüş: 30 dakika
- Veya: Koşu-yürüyüş kombinasyonu

---

### Cuma - Gücü Artırma (Ağırlıksız)

Salı ile aynı egzersizler, başlayan için alternatifler:
- Şınav (Duvar şınav başlayanlar için)
- Plank (azaltılmış süre: 10-15 saniye)

---

### Cumartesi - Esnek Cardio

- Yüzme, bisiklet, danış veya dans  
- 30-40 dakika, uygun tempoda

---

### Pazar - Dinlenme/Strech

- Tam dinlenme veya çok hafif yoga

---

## Önemli İpuçları

1. **Tutarlılık**: Başlangıçta 3 gün spor yeterlidir
2. **İçme**: Her egzersiz sırasında su içmeyi unutmayın
3. **Beslenme**: Egzersizden 1-2 saat sonra protein aldığınızdan emin olun
4. **Uyku**: Kas toparlanması için yeterli uyku verin
5. **Aşırı yapma**: Başlangıçta ağır yapmayın, zamanla arttırın

## Dikkat Edilmesi Gerekenler

- Herhangi bir ağrı veya acı hissettiğinizde hemen durdurun
- Doktor önerisi dışında hareket etmeyin
- Progresyon yavaş ve sürdürülebilir olmalı
`;

        const intermediatePlan = `
## Haftalık Egzersiz Planı - Orta Seviye

### Pazartesi - Göğüs + Triseps

**Isınma**
- 5 dakika hafif kardiyö
- Dinamik germeler

**Ana Egzersiz**
1. Push-ups: 4 set × 10-15 tekrar
2. Dips: 4 set × 8-12 tekrar
3. Triceps Kickbacks (bodyweight): 3 set × 12-15 tekrar
4. Cardio (30 saniye yüksek tempodan sonra 1.5 dakika dinlenme): 5 turla

**Soğuma**: 5 dakika statik germeler

---

### Salı - Arka Kasları ve Bacaklar

1. Pull-ups (ağırlıklı band ile): 4 set × 8-12 tekrar
2. Single-leg glute bridges: 3 set × 12 tekrar
3. Lunges ağırlıklı: 3 set × 10 tekrar (her bacak)
4. Deadlifts (vücut ağırlığı): 3 set × 10 tekrar

---

### Çarşamba - Kardiyö & Core

- HIIT: 20 dakika (40 saniye yüksek tempo, 20 saniye dinlenme)
- Plank varyasyonları: 3 set × 45 saniye
- Çekirdek egzersizleri: 15 dakika

---

### Perşembe - Omuzlar + Bacaklar

1. Shoulder presses: 4 set × 10 tekrar
2. Lateral raises: 3 set × 12-15 tekrar  
3. Pistol squats (asistan ile): 3 set × 5-8 tekrar
4. Calf raises: 3 set × 15-20 tekrar

---

### Cuma - Tam Vücut + Cardio

1. Kompleks hareket kombinasyonu
2. 30 dakika kardiyö

---

### Cumartesi - Uzun Kardiyö Oturumu

30-45 dakika orta tempodan

---

### Pazar - Dinlenme veya hafif yoga

---

## Tavsiyeler

- Haftada 3-4 gün antrenman yeterli
- İlerleyişinizi takip edin
- Ağırlıkları veya tekrar sayısını kademeli olarak arttırın
`;

        const advancedPlan = `
## Haftalık Egzersiz Planı - İleri Seviye

### Pazartesi - Göğüs & Triseps (Ağır Gün)

1. Barbell bench press: 5 set × 3-5 tekrar (ağır)
2. Incline push-ups: 4 set × 6-8 tekrar
3. Triceps close-grip push-ups: 4 set × 8-10 tekrar
4. Cable flyes: 3 set × 12-15 tekrar

---

### Salı - Arka Kasları (Ağır)

1. Weighted pull-ups: 5 set × 3-5 tekrar
2. Single-leg deadlifts: 4 set × 8-10 tekrar
3. Barbell rows: 4 set × 5-8 tekrar
4. Lat pulldowns: 3 set × 10-12 tekrar

---

### Çarşamba - Aktif Dinlenme + Core

- 45 dakika düşük yoğunluklu kardiyö
- Gelişmiş core egzersizleri: 20 dakika

---

### Perşembe - Omuzlar & Bacaklar (Ağır)

1. Military press: 5 set × 3-5 tekrar
2. Bulgarian split squats: 4 set × 6-8 tekrar
3. Lateral raises weighted: 3 set × 12-15 tekrar
4. Leg press: 4 set × 10-12 tekrar

---

### Cuma - Güç & Kardiyö Kombinasyonu

- HIIT + Kompleks hareketler
- 60 dakika toplam

---

### Cumartesi - Uzun Antrenman

- Kas grubu seçim antrenmanı
- 90 dakika

---

### Pazar - Tam Dinlenme & Strech

---

## Beslenme ve Toparlanma

- Günde 1.6-2.2g/kg vücut ağırlığı kadar protein alın
- Yeterli kalori alımı sağlayın
- 7-9 saatlik uyku hedefleyin
- Suplementasyon düşünün (creatine, whey protein gibi)
`;

        if (level === 'Beginner') return beginnerPlan;
        if (level === 'Intermediate') return intermediatePlan;
        return advancedPlan;
    },

    async getNotifications(req, res) {
        try {
            const userId = req.userId;
            const { limit = 20, offset = 0, read } = req.query;

            const { pool } = require('../config/database');
            let query = 'SELECT * FROM notifications WHERE user_id = $1';
            const params = [userId];

            if (read !== undefined) {
                query += ` AND is_read = $${params.length + 1}`;
                params.push(read === 'true');
            }

            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(parseInt(limit), parseInt(offset));

            const result = await pool.query(query, params);

            res.json({
                notifications: result.rows,
                count: result.rows.length,
                limit,
                offset
            });
        } catch (error) {
            console.error('Get notifications error:', error.message);
            res.status(500).json({ error: 'Bildirimler alınırken hata oluştu' });
        }
    },

    async markNotificationAsRead(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;

            const { pool } = require('../config/database');
            const query = `
                UPDATE notifications 
                SET is_read = TRUE, read_at = NOW()
                WHERE notification_id = $1 AND user_id = $2
                RETURNING *;
            `;

            const result = await pool.query(query, [id, userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Bildirim bulunamadı' });
            }

            res.json({
                message: 'Bildirim okundu olarak işaretlendi',
                notification: result.rows[0]
            });
        } catch (error) {
            console.error('Mark notification as read error:', error.message);
            res.status(500).json({ error: 'Bildirim işaretlenirken hata oluştu' });
        }
    },

    async getUnreadNotificationCount(req, res) {
        try {
            const userId = req.userId;

            const { pool } = require('../config/database');
            const query = `
                SELECT COUNT(*) as unread_count 
                FROM notifications 
                WHERE user_id = $1 AND is_read = FALSE;
            `;

            const result = await pool.query(query, [userId]);

            res.json({
                unread_count: parseInt(result.rows[0].unread_count)
            });
        } catch (error) {
            console.error('Get unread notification count error:', error.message);
            res.status(500).json({ error: 'Bildirim sayısı alınırken hata oluştu' });
        }
    }
};

module.exports = dashboardController;
