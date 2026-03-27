from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from typing import Dict, List, Protocol, Tuple

try:
    import requests
except ImportError:
    print("Missing dependency: requests. Install with: pip install requests")
    sys.exit(1)


# -----------------------------
# Domain models
# -----------------------------

@dataclass
class UserProfile:
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    goal: str
    diet_preference: str
    dietary_restrictions: str
    activity_level: int
    exercise_days_per_week: int
    sleep_hours: float
    water_liters_per_day: float
    daily_screen_time_hours: float
    health_notes: str

    @property
    def bmi(self) -> float:
        meters = self.height_cm / 100
        return round(self.weight_kg / (meters * meters), 1)


# -----------------------------
# Level classification
# -----------------------------

class LevelRule(Protocol):
    def matches(self, score: int) -> bool: ...
    def label(self) -> str: ...


@dataclass
class BeginnerRule:
    def matches(self, score: int) -> bool:
        return score <= 4

    def label(self) -> str:
        return "Beginner"


@dataclass
class IntermediateRule:
    def matches(self, score: int) -> bool:
        return 5 <= score <= 8

    def label(self) -> str:
        return "Intermediate"


@dataclass
class AdvancedRule:
    def matches(self, score: int) -> bool:
        return score >= 9

    def label(self) -> str:
        return "Advanced"


class LevelClassifier:
    """
    Strategy-friendly classifier.
    You can later replace scoring logic or threshold rules without touching the CLI.
    """

    def __init__(self, rules: List[LevelRule]) -> None:
        self.rules = rules

    def calculate_score(self, profile: UserProfile) -> int:
        score = 0

        # Exercise habits
        if profile.exercise_days_per_week >= 5:
            score += 4
        elif profile.exercise_days_per_week >= 3:
            score += 3
        elif profile.exercise_days_per_week >= 1:
            score += 1

        # Self-reported activity
        score += max(0, min(profile.activity_level - 1, 4))

        # Recovery habits
        if profile.sleep_hours >= 7:
            score += 1
        if profile.water_liters_per_day >= 2:
            score += 1

        # Sedentary penalty
        if profile.daily_screen_time_hours >= 9:
            score -= 1

        return max(score, 0)

    def classify(self, profile: UserProfile) -> Tuple[str, int]:
        score = self.calculate_score(profile)
        for rule in self.rules:
            if rule.matches(score):
                return rule.label(), score
        return "Beginner", score


# -----------------------------
# LLM integration
# -----------------------------

class LLMProvider(Protocol):
    def generate(self, prompt: str) -> str: ...


class OllamaProvider:
    """
    Adapter-like provider for Ollama's local API.
    Default base URL follows Ollama docs.
    """

    def __init__(
        self,
        model: str = "llama3",
        base_url: str = "http://localhost:11434/api/generate",
        timeout: int = 120,
    ) -> None:
        self.model = model
        self.base_url = base_url
        self.timeout = timeout

    def generate(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
        }
        response = requests.post(self.base_url, json=payload, timeout=self.timeout)
        response.raise_for_status()
        data = response.json()
        text = data.get("response", "").strip()
        if not text:
            raise ValueError("Empty response received from Ollama.")
        return text


class RoutineGenerator:
    def __init__(self, provider: LLMProvider) -> None:
        self.provider = provider

    def build_prompt(self, profile: UserProfile, level: str, score: int) -> str:
        return f"""
You are a careful wellness assistant for a university software project.
Create a personalized weekly wellness routine.

Important constraints:
- Do NOT claim to be a doctor.
- Do NOT give medical diagnosis.
- Keep suggestions general, practical, and safe.
- If the user has health limitations in notes, be conservative.
- Respond in Turkish.
- Format output with these sections exactly:
  1. Seviye Özeti
  2. Haftalık Egzersiz Rutini
  3. Günlük Beslenme Önerileri
  4. Günlük Sağlıklı Alışkanlık Hatırlatmaları
  5. Dikkat Edilmesi Gerekenler

User profile:
- Yaş: {profile.age}
- Cinsiyet: {profile.gender}
- Boy (cm): {profile.height_cm}
- Kilo (kg): {profile.weight_kg}
- BMI: {profile.bmi}
- Hedef: {profile.goal}
- Beslenme tercihi: {profile.diet_preference}
- Kısıtlar / alerjiler: {profile.dietary_restrictions}
- Aktivite seviyesi (1-5): {profile.activity_level}
- Haftalık egzersiz günü: {profile.exercise_days_per_week}
- Uyku (saat): {profile.sleep_hours}
- Günlük su (litre): {profile.water_liters_per_day}
- Günlük ekran süresi (saat): {profile.daily_screen_time_hours}
- Ek sağlık notları: {profile.health_notes}

Detected level: {level}
Internal score: {score}

Need:
- 7 günlük sade bir egzersiz planı oluştur.
- 1 haftalık uygulanabilir beslenme önerileri ver.
- Günlük su içme, kısa yürüyüş, esneme gibi tekrar eden hatırlatmaları madde madde ekle.
- Öğrenci/yoğun kullanıcı için gerçekçi öneriler yaz.
- Her gün için aşırı detay yerine uygulanabilir ve kısa öneriler ver.
""".strip()

    def generate_routine(self, profile: UserProfile, level: str, score: int) -> str:
        prompt = self.build_prompt(profile, level, score)
        return self.provider.generate(prompt)


# -----------------------------
# CLI helpers
# -----------------------------

def ask_int(question: str, min_value: int | None = None, max_value: int | None = None) -> int:
    while True:
        raw = input(f"{question}: ").strip()
        try:
            value = int(raw)
            if min_value is not None and value < min_value:
                raise ValueError
            if max_value is not None and value > max_value:
                raise ValueError
            return value
        except ValueError:
            range_text = []
            if min_value is not None:
                range_text.append(f">= {min_value}")
            if max_value is not None:
                range_text.append(f"<= {max_value}")
            hint = f" ({', '.join(range_text)})" if range_text else ""
            print(f"Lütfen geçerli bir tam sayı gir.{hint}")


def ask_float(question: str, min_value: float | None = None, max_value: float | None = None) -> float:
    while True:
        raw = input(f"{question}: ").strip().replace(",", ".")
        try:
            value = float(raw)
            if min_value is not None and value < min_value:
                raise ValueError
            if max_value is not None and value > max_value:
                raise ValueError
            return value
        except ValueError:
            print("Lütfen geçerli bir sayı gir.")


def ask_text(question: str, allowed: List[str] | None = None) -> str:
    while True:
        value = input(f"{question}: ").strip()
        if not value:
            print("Bu alan boş bırakılamaz.")
            continue
        if allowed and value.lower() not in [x.lower() for x in allowed]:
            print(f"Geçerli seçenekler: {', '.join(allowed)}")
            continue
        return value


def collect_survey() -> UserProfile:
    print("\n=== LifeSync CLI Anketi ===")
    print("Aşağıdaki sorulara cevap ver. Sistem seviyeni belirleyip öneri üretecek.\n")

    return UserProfile(
        age=ask_int("Yaşınız", 12, 100),
        gender=ask_text("Cinsiyetiniz"),
        height_cm=ask_float("Boyunuz (cm)", 100, 250),
        weight_kg=ask_float("Kilonuz (kg)", 30, 300),
        goal=ask_text("Ana hedefiniz (ör. kilo vermek, form korumak, kas kazanmak)"),
        diet_preference=ask_text("Beslenme tercihiniz (ör. omnivor, vejetaryen, vegan)"),
        dietary_restrictions=ask_text("Alerji / besin kısıtı var mı? Yoksa 'yok' yazın"),
        activity_level=ask_int("Günlük aktivite seviyeniz (1-5)", 1, 5),
        exercise_days_per_week=ask_int("Haftada kaç gün egzersiz yapıyorsunuz", 0, 7),
        sleep_hours=ask_float("Ortalama uyku süreniz (saat)", 0, 24),
        water_liters_per_day=ask_float("Günde yaklaşık kaç litre su içiyorsunuz", 0, 10),
        daily_screen_time_hours=ask_float("Günlük ekran süreniz (saat)", 0, 24),
        health_notes=ask_text("Ek sağlık notu / hassasiyet / sakatlık durumu (yoksa 'yok')"),
    )


def print_profile_summary(profile: UserProfile, level: str, score: int) -> None:
    print("\n=== Kullanıcı Özeti ===")
    print(f"BMI: {profile.bmi}")
    print(f"Seviye: {level}")
    print(f"Skor: {score}")


# -----------------------------
# Main app
# -----------------------------

def main() -> None:
    model = os.getenv("OLLAMA_MODEL", "llama3")
    print("LifeSync CLI Backend MVP")
    print(f"Ollama model: {model}")
    print("Not: Bu çıktı genel iyi yaşam önerisi içindir, tıbbi tavsiye değildir.\n")

    profile = collect_survey()

    classifier = LevelClassifier(
        [BeginnerRule(), IntermediateRule(), AdvancedRule()]
    )
    level, score = classifier.classify(profile)
    print_profile_summary(profile, level, score)

    provider = OllamaProvider(model=model)
    generator = RoutineGenerator(provider)

    print("\nLLM üzerinden kişiselleştirilmiş öneri üretiliyor...\n")
    try:
        result = generator.generate_routine(profile, level, score)
        print(result)
    except requests.RequestException as exc:
        print("Ollama bağlantısı kurulamadı.")
        print("Kontrol et:")
        print("1) Ollama açık mı?")
        print("2) Model çekildi mi? Örn: ollama run llama3")
        print(f"Teknik detay: {exc}")
    except Exception as exc:
        print(f"Beklenmeyen hata: {exc}")


if __name__ == "__main__":
    main()
