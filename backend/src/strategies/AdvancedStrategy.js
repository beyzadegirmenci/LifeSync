const BaseStrategy = require('./BaseStrategy');

class AdvancedStrategy extends BaseStrategy {
    constructor() {
        super('advanced');
    }

    getLevelSpecificInstruction() {
        return 'Kullanıcı ileri seviyede olduğu için önerileri performans ve ilerleme odaklı hazırla. Yüksek yoğunluk, çeşitlendirilmiş antrenman ve daha gelişmiş beslenme stratejileri sun.';
    }

    getDefaultRecommendation() {
        return `## 1. Kısa Genel Değerlendirme
İleri seviyedesiniz. Mevcut alışkanlıklarınızı daha da optimize edip performans artırmaya odaklanın.

## 2. Diyet Önerileri
- Makro dengesi ve yeterli protein alımına dikkat edin
- Öğün planını disiplinli sürdürün
- Enerji ihtiyacınıza uygun besinler seçin
- Restoratif besinlere yer verin

## 3. Egzersiz Önerileri
- Haftada 5-6 gün antrenman yapın
- Farklı sistemleri hedefleyen programlar uygulayın
- Güç, dayanıklılık ve esneklik çalışmalarını dengeleyin
- İlerlemeyi yavaş yavaş artırın

## 4. Günlük Rutin Önerisi
- Dinlenme ve toparlanma arasında denge kurun
- Uyku kalitenizi yükseltin
- Stres yönetimini unutmayın

## 5. Su İçme ve Alışkanlıklar
- Günlük su hedefinizi hedefinize göre ayarlayın
- Antrenman öncesi ve sonrası sıvı takibini yapın
- Elektrolit dengesine dikkat edin

## 6. Dikkat Edilmesi Gerekenler
- Aşırı antrenmandan kaçının
- Yaralanma riskini yönetin
- Periyodik olarak vücudunuzu dinleyin`;
    }
}

module.exports = AdvancedStrategy;
