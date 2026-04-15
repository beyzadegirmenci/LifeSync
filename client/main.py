from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Dict, Any

import requests


OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "llama3.1:8b"


@dataclass
class UserProfile:
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    goal: str
    diet_preference: str
    allergy_or_restriction: str
    activity_level: int
    exercise_days_per_week: int
    sleep_hours: float
    water_liters_per_day: float
    screen_hours_per_day: float
    health_note: str


LEVEL_LABEL_TR = {
    "beginner": "Başlangıç",
    "intermediate": "Orta",
    "advanced": "İleri",
}


@dataclass
class ClassificationResult:
    level: str
    score: int
    reasons: List[str]
    bmi: float
    level_label_tr: str = ""


@dataclass
class Recommendation:
    level: str
    raw_text: str
    metadata: Dict[str, Any]


def ask_int(prompt: str, min_value: int | None = None, max_value: int | None = None) -> int:
    while True:
        raw = input(prompt).strip()
        try:
            value = int(raw)
            if min_value is not None and value < min_value:
                print(f"Lütfen {min_value} veya daha büyük bir değer gir.")
                continue
            if max_value is not None and value > max_value:
                print(f"Lütfen {max_value} veya daha küçük bir değer gir.")
                continue
            return value
        except ValueError:
            print("Lütfen geçerli bir tam sayı gir.")


def ask_float(prompt: str, min_value: float | None = None, max_value: float | None = None) -> float:
    while True:
        raw = input(prompt).strip().replace(",", ".")
        try:
            value = float(raw)
            if min_value is not None and value < min_value:
                print(f"Lütfen {min_value} veya daha büyük bir değer gir.")
                continue
            if max_value is not None and value > max_value:
                print(f"Lütfen {max_value} veya daha küçük bir değer gir.")
                continue
            return value
        except ValueError:
            print("Lütfen geçerli bir sayı gir.")


def ask_text(prompt: str) -> str:
    while True:
        value = input(prompt).strip()
        if value:
            return value
        print("Bu alan boş bırakılamaz.")


def calculate_bmi(weight_kg: float, height_cm: float) -> float:
    height_m = height_cm / 100
    return weight_kg / (height_m ** 2)


def collect_survey() -> UserProfile:
    print("=" * 70)
    print("LifeSync CLI Backend MVP")
    print("=" * 70)
    print("Not: Bu çıktı genel iyi yaşam önerisi içindir, tıbbi tavsiye değildir.\n")

    print("=== LifeSync CLI Anketi ===")
    print("Aşağıdaki sorulara cevap ver. Sistem seviyeni belirleyip öneri üretecek.\n")

    return UserProfile(
        age=ask_int("Yaşınız: ", min_value=10, max_value=100),
        gender=ask_text("Cinsiyetiniz: "),
        height_cm=ask_float("Boyunuz (cm): ", min_value=100, max_value=250),
        weight_kg=ask_float("Kilonuz (kg): ", min_value=30, max_value=300),
        goal=ask_text("Ana hedefiniz (ör. kilo vermek, form korumak, kas kazanmak): "),
        diet_preference=ask_text("Beslenme tercihiniz (ör. omnivor, vejetaryen, vegan): "),
        allergy_or_restriction=ask_text("Alerji / besin kısıtı var mı? Yoksa 'yok' yazın: "),
        activity_level=ask_int("Günlük aktivite seviyeniz (1-5): ", min_value=1, max_value=5),
        exercise_days_per_week=ask_int("Haftada kaç gün egzersiz yapıyorsunuz: ", min_value=0, max_value=7),
        sleep_hours=ask_float("Ortalama uyku süreniz (saat): ", min_value=0, max_value=24),
        water_liters_per_day=ask_float("Günde yaklaşık kaç litre su içiyorsunuz: ", min_value=0, max_value=10),
        screen_hours_per_day=ask_float("Günlük ekran süreniz (saat): ", min_value=0, max_value=24),
        health_note=ask_text("Ek sağlık notu / hassasiyet / sakatlık durumu (yoksa 'yok'): "),
    )


def classify_user(profile: UserProfile) -> ClassificationResult:
    bmi = calculate_bmi(profile.weight_kg, profile.height_cm)
    score = 0
    reasons: List[str] = []

    if profile.activity_level >= 4:
        score += 2
        reasons.append("Günlük aktivite seviyesi yüksek.")
    elif profile.activity_level == 3:
        score += 1
        reasons.append("Günlük aktivite seviyesi orta.")
    else:
        reasons.append("Günlük aktivite seviyesi düşük.")

    if profile.exercise_days_per_week >= 4:
        score += 2
        reasons.append("Haftalık egzersiz sıklığı yüksek.")
    elif profile.exercise_days_per_week >= 2:
        score += 1
        reasons.append("Haftalık egzersiz sıklığı orta.")
    else:
        reasons.append("Haftalık egzersiz sıklığı düşük.")

    if 18.5 <= bmi <= 29.9:
        score += 1
        reasons.append("BMI aralığı planlama açısından yönetilebilir seviyede.")
    else:
        reasons.append("BMI özel dikkat gerektirebilir.")

    if 6 <= profile.sleep_hours <= 9:
        score += 1
        reasons.append("Uyku süresi dengeli.")
    else:
        reasons.append("Uyku düzeni iyileştirilebilir.")

    if profile.water_liters_per_day >= 2:
        score += 1
        reasons.append("Su tüketimi iyi düzeyde.")
    else:
        reasons.append("Su tüketimi düşük.")

    if score <= 2:
        level = "beginner"
    elif score <= 5:
        level = "intermediate"
    else:
        level = "advanced"

    return ClassificationResult(
        level=level,
        score=score,
        reasons=reasons,
        bmi=round(bmi, 1),
        level_label_tr=LEVEL_LABEL_TR[level],
    )


def build_prompt(profile: UserProfile, result: ClassificationResult) -> str:
    level_tr = result.level_label_tr or LEVEL_LABEL_TR.get(result.level, result.level)
    return f"""
Sen bir sağlıklı yaşam asistanısın.
Kullanıcı için güvenli, uygulanabilir, kısa ve net öneriler üret.

ÖNEMLİ KURALLAR:
- Tıbbi teşhis koyma.
- Riskli, aşırı zorlayıcı öneriler verme.
- Kullanıcının fitness seviyesi {level_tr} olduğu için önerileri buna uygun hazırla.
- Cevabı Türkçe ver.
- Formatı düzenli olsun.
- Çok uzun yazma.

KULLANICI BİLGİLERİ:
- Yaş: {profile.age}
- Cinsiyet: {profile.gender}
- Boy: {profile.height_cm} cm
- Kilo: {profile.weight_kg} kg
- BMI: {result.bmi}
- Hedef: {profile.goal}
- Beslenme tercihi: {profile.diet_preference}
- Alerji / kısıt: {profile.allergy_or_restriction}
- Aktivite seviyesi: {profile.activity_level}/5
- Haftalık egzersiz günü: {profile.exercise_days_per_week}
- Uyku: {profile.sleep_hours} saat
- Günlük su: {profile.water_liters_per_day} litre
- Günlük ekran süresi: {profile.screen_hours_per_day} saat
- Ek sağlık notu: {profile.health_note}
- Seviye: {level_tr}

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
- Bozuk veya karışık dil kullanırsan cevap geçersiz sayılır.

""".strip()


def generate_recommendation(
    profile: UserProfile,
    result: ClassificationResult,
    model: str = DEFAULT_MODEL,
) -> Recommendation:
    prompt = build_prompt(profile, result)

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": 4000,
            "temperature": 0.3
        },
    }

    try:
        response = requests.post(
            OLLAMA_URL,
            json=payload,
            timeout=(10, 300),
        )
        response.raise_for_status()
        data = response.json()

        return Recommendation(
            level=result.level,
            raw_text=data.get("response", "").strip() or "Model boş yanıt döndürdü.",
            metadata={
                "model": data.get("model", model),
                "done": data.get("done", False),
            },
        )
    except requests.exceptions.RequestException as exc:
        return Recommendation(
            level=result.level,
            raw_text=(
                "Ollama bağlantısı kurulamadı veya yanıt zaman aşımına uğradı.\n"
                "Kontrol et:\n"
                "1) Ollama açık mı?\n"
                "2) Model hazır mı? Örn: ollama run llama3.2:3b\n"
                "3) localhost:11434 erişilebilir mi?\n"
            ),
            metadata={
                "model": model,
                "error": str(exc),
            },
        )


def main() -> None:
    profile = collect_survey()
    result = classify_user(profile)

    print("\n" + "=" * 70)
    print("Kullanıcı Özeti")
    print("=" * 70)
    print(f"BMI: {result.bmi}")
    print(f"Seviye: {result.level}")
    print(f"Skor: {result.score}")
    print("Nedenler:")
    for reason in result.reasons:
        print(f"- {reason}")

    print("\nLLM üzerinden kişiselleştirilmiş öneri üretiliyor...\n")
    recommendation = generate_recommendation(profile, result)

    print("=" * 70)
    print("Kişiselleştirilmiş Öneriler")
    print("=" * 70)
    print(f"Model: {recommendation.metadata.get('model', 'unknown')}")
    print(f"Seviye: {recommendation.level}")
    print("-" * 70)
    print(recommendation.raw_text)

    if "error" in recommendation.metadata:
        print("\nTeknik detay:")
        print(recommendation.metadata["error"])


if __name__ == "__main__":
    main()