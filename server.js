const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/resim', express.static('resim'));

// Veritabanı başlatma
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Veritabanı bağlantı hatası:', err);
  } else {
    console.log('SQLite3 veritabanı başlatıldı.');
    initializeDatabase();
  }
});

// Veritabanı tablolarını oluştur
function initializeDatabase() {
  db.serialize(() => {
    // Paletler tablosu
    db.run(`
      CREATE TABLE IF NOT EXISTS pallets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        location TEXT,
        quantity INTEGER,
        condition TEXT,
        image_url TEXT,
        contact_person TEXT,
        contact_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mesajlar tablosu
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Admin kullanıcıları tablosu
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Örnek paletler ekle
    const examplePallets = [
      {
        name: 'Gadtafi Akbaba - Euro Palet 80x120',
        description: 'Gadtafi Akbaba işletmesine ait yüksek kaliteli EURO palet. 80x120 cm boyutlarında, EPAL sertifikalı. İç ve dış mekan kullanımına uygun, ağır yüklere dayanıklı. Minimal çizik ile mükemmel durumda.',
        price: 250,
        location: 'İstanbul',
        quantity: 15,
        condition: 'Çok İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0532-487-6543'
      },
      {
        name: 'Gadtafi Akbaba - Standart Ahşap Palet',
        description: 'Gadtafi Akbaba\'dan kaliteli standart ahşap palet. Endüstriyel kullanım için ideal, depo ve lojistik işletmelerine uygun. Sağlam yapı ve uzun ömürlü. Yoğun kullanıma rağmen iyi durumda. Toplu alımlarda ödeme kolaylığı.',
        price: 180,
        location: 'Ankara',
        quantity: 22,
        condition: 'İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0531-923-5678'
      },
      {
        name: 'Gadtafi Akbaba - Plastik Palet',
        description: 'Gadtafi Akbaba işletmesi tarafından sağlanan çevre dostu plastik paletler. Yüksek yoğunluklu polietilenden yapılmış, dayanıklı ve hafif. Su ve nem geçirmez, dış depolama alanları için ideal. Temizlenmesi kolay ve uzun ömürlü.',
        price: 150,
        location: 'İzmir',
        quantity: 18,
        condition: 'Çok İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0533-654-9012'
      },
      {
        name: 'Gadtafi Akbaba - CP Palet 100x120',
        description: 'Gadtafi Akbaba\'dan dinamik kullanıma uygun CP palet. 100x120 cm boyutunda, ağır endüstriyel kullanım için ideal. Gümrük ve lojistik sektöründe yaygın olarak kullanılır. Güçlü yapısı ile ağır yükleri taşıyabilir.',
        price: 220,
        location: 'Bursa',
        quantity: 10,
        condition: 'İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0534-218-7654'
      },
      {
        name: 'Gadtafi Akbaba - İmalat Sonrası Palet',
        description: 'Gadtafi Akbaba üretim tesisinden müşteri özel üretimi paletler. Yüksek toleransta ve hassas imalat. İhracat ürünleri için uygun, uluslararası standartlara uygun.',
        price: 200,
        location: 'Eskişehir',
        quantity: 8,
        condition: 'Çok İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0535-445-8901'
      },
      {
        name: 'Gadtafi Akbaba - Ikinci El Stok',
        description: 'Gadtafi Akbaba\'nın depolarından müşteri dönüşlü ikinci el paletler. Tüm paletler temiz ve tekrar kullanıma hazır. Ekonomik seçim arayanlara ideal. Her türlü endüstriyel kullanıma uygun.',
        price: 120,
        location: 'Gaziantep',
        quantity: 25,
        condition: 'İyi',
        contact_person: 'Gadtafi Akbaba',
        contact_phone: '0536-772-3456'
      }
    ];

    // Tablodan sonra örnek verileri ekle
    db.all('SELECT COUNT(*) as count FROM pallets', (err, rows) => {
      if (rows[0].count === 0) {
        const stmt = db.prepare(`
          INSERT INTO pallets (name, description, price, location, quantity, condition, contact_person, contact_phone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        examplePallets.forEach(pallet => {
          stmt.run(pallet.name, pallet.description, pallet.price, pallet.location, 
                   pallet.quantity, pallet.condition, pallet.contact_person, pallet.contact_phone);
        });
        stmt.finalize();
        console.log('Örnek paletler eklendi.');
      }
    });
  });
}

// API Routes

// Tüm paletleri getir
app.get('/api/pallets', (req, res) => {
  db.all('SELECT * FROM pallets ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Tek palet getir
app.get('/api/pallets/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM pallets WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Palet bulunamadı' });
    } else {
      res.json(row);
    }
  });
});

// Yeni palet ekle (kullanıcı tarafından)
app.post('/api/pallets', (req, res) => {
  const { name, description, price, location, quantity, condition, contact_person, contact_phone } = req.body;
  
  if (!name || !price) {
    return res.status(400).json({ error: 'Ad ve fiyat gereklidir' });
  }

  db.run(
    'INSERT INTO pallets (name, description, price, location, quantity, condition, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, description, price, location, quantity, condition, contact_person, contact_phone],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, id: this.lastID });
      }
    }
  );
});

// Mesaj gönder (Bize Ulaş formundan)
app.post('/api/messages', (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Ad, e-posta ve mesaj gereklidir' });
  }

  db.run(
    'INSERT INTO messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)',
    [name, email, phone, subject, message],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, id: this.lastID, message: 'Mesajınız başarıyla gönderildi. Yakında sizinle iletişime geçeceğiz.' });
      }
    }
  );
});

// Tüm mesajları getir (Admin)
app.get('/api/admin/messages', (req, res) => {
  const token = req.headers.authorization;
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  db.all('SELECT * FROM messages ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Mesaj durumunu güncelle (Admin)
app.put('/api/admin/messages/:id', (req, res) => {
  const token = req.headers.authorization;
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE messages SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, message: 'Mesaj durumu güncellendi' });
      }
    }
  );
});

// Mesaj sil (Admin)
app.delete('/api/admin/messages/:id', (req, res) => {
  const token = req.headers.authorization;
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }

  const { id } = req.params;
  db.run('DELETE FROM messages WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true, message: 'Mesaj silindi' });
    }
  });
});

// Admin giriş
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  // Basit demo için: username: admin, password: admin123
  if (username === 'admin' && password === 'admin123') {
    res.json({ success: true, token: 'demo-token-12345' });
  } else {
    res.status(401).json({ error: 'Hatalı kullanıcı adı veya şifre' });
  }
});

// Token doğrulama
function verifyAdminToken(token) {
  return token === 'Bearer demo-token-12345';
}

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Palet Bilgileri Sayfası
app.get('/palet-bilgileri', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'palet-bilgileri.html'));
});

// Admin paneli
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`✓ Palet Satış Sitesi başlatıldı!`);
  console.log(`✓ Ana site: http://localhost:${PORT}`);
  console.log(`✓ Admin Paneli: http://localhost:${PORT}/admin`);
  console.log(`✓ Paletler Bilgisi Aktif: http://localhost:${PORT}/palet-bilgileri`);
  console.log(`✓ Admin Giriş: Kullanıcı: admin | Şifre: admin123`);
  console.log(`=================================================\n`);
});

process.on('SIGINT', () => {
  db.close(() => {
    console.log('Veritabanı bağlantısı kapatıldı.');
    process.exit(0);
  });
});
