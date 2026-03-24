# Palet Satış Sitesi 🚛

İkinci el palet alım satımı için modern ve fonksiyonel bir web sitesi.

## Özellikler ✨

- **Palet Kataloğu**: Satılan paletleri görüntüleyin
- **Arama ve Filtreleme**: Konum ve palet adına göre filtrele
- **Bize Ulaş Formu**: Direktleri ile iletişim için form
- **Admin Paneli**: Gelen mesajları yönetin
- **Mesaj Yönetimi**: Mesaj durumunu (Yeni, Okundu, Cevaplandı) işaretleyin
- **Responsive Tasarım**: Tüm cihazlarda güzel görüntülenir

## Teknoloji Stack 🛠️

- **Backend**: Node.js + Express
- **Database**: SQLite3
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Port**: 3000

## Kurulum 📦

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Sunucuyu Başlatın
```bash
npm start
```

Sunucu başlatılacak ve aşağıdaki adresler açılacak:
- **Ana Site**: http://localhost:3000
- **Admin Paneli**: http://localhost:3000/admin

## Kullanım 🚀

### Ana Sayfa
1. Mevcut paletleri yatay kaydırarak görüntüleyin
2. Ada ve konuma göre arama yapın
3. "Bize Ulaş" bölümüne yıl bakın ve mesaj gönderilen

### Admin Paneli
1. **Giriş Yapın**: 
   - Kullanıcı Adı: `admin`
   - Şifre: `admin123`

2. **Mesajları Yönetin**:
   - Tüm gelen mesajları görüntüleyin
   - Mesaj detaylarını görmek için tıklayın
   - Durumunu Yeni/Okundu/Cevaplandığı işaretleyin
   - Mesajları silin

3. **Paletleri Yönetin**:
   - Mevcut paletleri listeyin
   - Palet bilgilerini düzenleyin

## API End Points 📱

### Public API
- `GET /api/pallets` - Tüm paletleri getir
- `GET /api/pallets/:id` - Tek palet getir
- `POST /api/pallets` - Yeni palet ekle
- `POST /api/messages` - İletişim formu gönder

### Admin API (Token gerekli)
- `POST /api/admin/login` - Admin giriş
- `GET /api/admin/messages` - Tüm mesajları getir
- `PUT /api/admin/messages/:id` - Mesaj durumunu güncelle
- `DELETE /api/admin/messages/:id` - Mesaj sil

## Veritabanı 🗄️

### Paletler Tablosu
```sql
pallets (
  id, name, description, price, location, 
  quantity, condition, image_url, 
  contact_person, contact_phone, created_at
)
```

### Mesajlar Tablosu
```sql
messages (
  id, name, email, phone, subject, message, 
  status, created_at
)
```

## Özelleştirme 🎨

### Renkleri Değiştirmek (style.css)
```css
:root {
    --primary-color: #2c3e50;      /* Ana renk */
    --secondary-color: #e74c3c;    /* Vurgu rengi */
    --accent-color: #3498db;       /* Aksent rengi */
}
```

### Admin Şifresini Değiştirmek (server.js)
```javascript
// Line 116-119'da bulun ve değiştirin
if (username === 'admin' && password === 'admin123') {
    // Şifre burada
}
```

## Sorun Giderme 🔧

### Port Zaten Kullanımda
```bash
# Farklı port kullanın
PORT=3001 npm start
```

### Veritabanı Hatası
```bash
# database.db dosyasını silin ve tekrar başlayın
# (Örnek veriler yeniden yüklenecek)
```

## Geleceğe Yönelik Geliştirmeler 🚀

- [ ] Palet fotoğrafları yükleme
- [ ] Ödeme entegrasyonu
- [ ] Email bildirimleri
- [ ] Kullanıcı hesapları
- [ ] İleri arama ve filtreleme
- [ ] Analitik ve raporlar

## Lisans 📄

MIT

## İletişim 📧

Sorularınız için: info@paletsatisi.com
