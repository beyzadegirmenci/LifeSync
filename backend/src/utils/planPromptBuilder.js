/**
 * Builds structured JSON prompts for LLM plan generation.
 * The AI returns ONLY cell content as JSON — never table structure.
 */

const DIET_ROW_TITLES = ['Kahvaltı', 'Ara Öğün 1', 'Öğle Yemeği', 'Ara Öğün 2', 'Akşam Yemeği'];
const EXERCISE_ROW_TITLES = ['Isınma', 'Ana Antrenman', 'Soğuma', 'Esneklik/Mobilite'];

function getPeriods(duration) {
    if (duration === 'daily') return ['Bugün'];
    if (duration === 'weekly') return ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
    // monthly
    return Array.from({ length: 30 }, (_, i) => String(i + 1));
}

function buildUserContext(profile, classification) {
    const bmi = classification?.bmi || 'bilinmiyor';
    const level = classification?.level || 'bilinmiyor';
    return {
        age: profile.age,
        gender: profile.gender,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        bmi,
        goal: profile.goal,
        diet_preference: profile.diet_preference || '',
        allergy_or_restriction: profile.allergy_or_restriction || '',
        activity_level: profile.activity_level,
        exercise_days_per_week: profile.exercise_days_per_week,
        sleep_hours: profile.sleep_hours,
        level
    };
}

function buildStructuredDietPrompt(profile, classification, duration) {
    const periods = getPeriods(duration);
    const userContext = buildUserContext(profile, classification);
    const periodsLength = periods.length;

    return `Sen bir beslenme plani motorusun. SADECE gecerli JSON dondur.

KRITIK KURALLAR:
1. SADECE JSON dondur. Baska HICBIR sey yazma. Markdown, aciklama, not YASAK.
2. Her hucreye GERCEK yemek adi ve porsiyon yaz. BOS string ("") KESINLIKLE YASAK.
3. Kisisel bilgi (yas, kilo, boy, BMI, cinsiyet, hedef) ciktida OLMAMALI.
4. periodType: "${duration}" yaz. periods: ${JSON.stringify(periods)} aynen kopyala.
5. rows icinde tam ${DIET_ROW_TITLES.length} satir olmali, basliklar sirayla: ${DIET_ROW_TITLES.map(t => `"${t}"`).join(', ')}
6. Her satirin items dizisi tam ${periodsLength} eleman icermeli.
7. Tum icerik TURKCE olmali.
8. Gunler arasi cesitlilik sagla, ayni gunu tekrarlama.
9. Her hucrede spesifik yemek yaz, ornegin: "2 yumurta, 1 dilim ekmek, domates" veya "Mercimek corbasi, pilav, ayran".
10. OGUNLER ARASI FARK: Kahvalti, Ogle Yemegi ve Aksam Yemegi FARKLI yemekler icermeli. Ayni yemegi birden fazla ogune yazma. Ogle hafif ana yemek (corba, pilav, salata), Aksam daha agir (et/balik/sebze yemegi) olmali.
11. Ara ogunler hafif atistirmalik olmali (meyve, kuruyemis, yogurt). Ana ogunlerden FARKLI olmali.
${userContext.allergy_or_restriction ? `12. KISIT: "${userContext.allergy_or_restriction}" — bu gidalar YASAK, alternatif yaz.` : ''}

KULLANICI BILGILERI (plani kisisellestirmek icin kullan, ciktiya YAZMA):
${JSON.stringify(userContext)}

JSON YAPISI (items icine gercek yemek adlari yaz):
{"periodType":"${duration}","periods":${JSON.stringify(periods)},"rows":[${DIET_ROW_TITLES.map(t => `{"title":"${t}","items":[${periodsLength} adet gercek yemek stringi]}`).join(',')}]}

Simdi kullaniciya ozel beslenme planini JSON olarak dondur.`;
}

function buildStructuredExercisePrompt(profile, classification, duration) {
    const periods = getPeriods(duration);
    const userContext = buildUserContext(profile, classification);
    const periodsLength = periods.length;

    return `Sen bir egzersiz plani motorusun. SADECE gecerli JSON dondur.

KRITIK KURALLAR:
1. SADECE JSON dondur. Baska HICBIR sey yazma. Markdown, aciklama, not YASAK.
2. Her hucreye GERCEK egzersiz hareketi yaz. BOS string ("") KESINLIKLE YASAK.
3. Kisisel bilgi (yas, kilo, boy, BMI, cinsiyet, hedef) ciktida OLMAMALI.
4. periodType: "${duration}" yaz. periods: ${JSON.stringify(periods)} aynen kopyala.
5. rows icinde tam ${EXERCISE_ROW_TITLES.length} satir olmali, basliklar sirayla: ${EXERCISE_ROW_TITLES.map(t => `"${t}"`).join(', ')}
6. Her satirin items dizisi tam ${periodsLength} eleman icermeli.
7. Tum icerik TURKCE olmali.
8. Gunler arasi cesitlilik sagla.
9. Kullanicinin seviyesine uygun egzersizler sec.
10. Her hucrede spesifik hareket yaz, ornegin: "3x12 squat, 3x10 lunge" veya "5 dk hafif kosma, dinamik germe".

KULLANICI BILGILERI (plani kisisellestirmek icin kullan, ciktiya YAZMA):
${JSON.stringify(userContext)}

JSON YAPISI (items icine gercek egzersiz hareketi yaz):
{"periodType":"${duration}","periods":${JSON.stringify(periods)},"rows":[${EXERCISE_ROW_TITLES.map(t => `{"title":"${t}","items":[${periodsLength} adet gercek egzersiz stringi]}`).join(',')}]}

Simdi kullaniciya ozel egzersiz planini JSON olarak dondur.`;
}

module.exports = {
    DIET_ROW_TITLES,
    EXERCISE_ROW_TITLES,
    getPeriods,
    buildStructuredDietPrompt,
    buildStructuredExercisePrompt
};
