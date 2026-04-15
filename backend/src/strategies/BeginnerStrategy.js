const BaseStrategy = require('./BaseStrategy');

class BeginnerStrategy extends BaseStrategy {
    constructor() {
        super('beginner');
    }

    getLevelSpecificInstruction() {
        return 'Kullanıcı başlangıç seviyesinde olduğu için önerileri temel, düşük yoğunluklu ve kolay uygulanabilir tut. Daha önce düzenli spor yapmamış veya yeni başlayan kullanıcılar için adım adım güvenli bir başlangıç yolu sun.';
    }

    getDefaultRecommendation() {
        return `## 1. Kısa Genel Değerlendirme
Başlangıç seviyesindesiniz. Temel alışkanlıklara odaklanarak yavaşça ilerleyin.

## 2. Diyet Önerileri
- Günde 3 düzgün öğün yemeye çalışın
- İşlenmiş gıdaları azaltın
- Bol su için
- Her öğünde sebze ve protein ekleyin

## 3. Egzersiz Önerileri
- Haftada 3 gün 30 dakika yürüyüş yapın
- Hafif esneme hareketleri ekleyin
- Merdiven çıkmayı deneyin
- İlerde kuvvet çalışmalarına geçebilirsiniz

## 4. Günlük Rutin Önerisi
- Uyumadan önce 7-8 saat uyuyun
- Su içmeyi saat bazlı hatırlayın
- Düzenli öğün saatleri belirleyin

## 5. Su İçme ve Alışkanlıklar
- Günde en az 8 bardak su için
- Sabah uyandığınızda su için
- Egzersiz sonrası ek su için

## 6. Dikkat Edilmesi Gerekenler
- Hemen hızlı değişim beklemeyin
- Dinlenmeyi ihmal etmeyin`;
    }
}

module.exports = BeginnerStrategy;
