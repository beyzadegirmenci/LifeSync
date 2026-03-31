// Logout olan token'ları tutan in-memory liste.
// Sunucu yeniden başlatıldığında temizlenir — production için Redis kullanılmalıdır.
const tokenBlacklist = new Set();

module.exports = tokenBlacklist;
