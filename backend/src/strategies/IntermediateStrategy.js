const BaseStrategy = require('./BaseStrategy');

class IntermediateStrategy extends BaseStrategy {
    constructor() {
        super('intermediate');
    }

    getLevelSpecificInstruction() {
        return 'Kullanıcı orta seviyede olduğu için önerileri güçlendirme, dayanıklılık ve sürdürülebilirlik odaklı hazırla. Hem beslenme hem de egzersizde mevcut temeli geliştirici bir yaklaşım sun.';
    }

    getDefaultRecommendation() {
        return `## 1. Kısa Genel Değerlendirme
Orta seviyedesiniz. Mevcut temelinizi güçlendirip daha düzenli ilerleyin.

## 2. Diyet Önerileri
- Makro besin dengesine dikkat edin
- Sağlıklı atıştırmalıkları seçin
- Su tüketimini artırın
- Öğünlerinizi çeşitlendirin

## 3. Egzersiz Önerileri
- Haftada 4-5 gün egzersiz yapın
- Kuvvet ve kardiyo çalışmalarını karıştırın
- Programınızı kademeli olarak zorlaştırın
- Esneme ve mobiliteye zaman ayırın

## 4. Günlük Rutin Önerisi
- Egzersiz için sabit bir zaman belirleyin
- Uyku ve beslenme düzenini planlayın
- Kısa yürüyüş molaları ekleyin

## 5. Su İçme ve Alışkanlıklar
- Her gün en az 2 litre su için
- Egzersiz günlerinde suyu artırın
- Gün içinde su içme hatırlatıcı kullanın

## 6. Dikkat Edilmesi Gerekenler
- Aşırı yüklenmeden kaçının
- İlerlemenizi takip edin
- Dengeli beslenmeye devam edin`;
    }
}

module.exports = IntermediateStrategy;
