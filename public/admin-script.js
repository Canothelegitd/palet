// Admin Panel JavaScript - Geliştirilmiş Versiyon

const API_BASE = 'http://localhost:3000/api';
let adminToken = null;
let allPaletler = [];
let allMessages = [];

// Notification helper
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 4000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
        adminToken = savedToken;
        showAdminDashboard();
        loadDashboard();
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            switchSection(section);
        });
    });

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', loadMessages);
    }

    const paletFilter = document.getElementById('paletFilter');
    const locationFilterPalet = document.getElementById('locationFilterPalet');
    if (paletFilter) paletFilter.addEventListener('input', filterPaletler);
    if (locationFilterPalet) locationFilterPalet.addEventListener('change', filterPaletler);

    const modal = document.getElementById('messageModal');
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
});

// Login handler
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const result = await response.json();

        if (response.ok) {
            adminToken = result.token;
            localStorage.setItem('adminToken', adminToken);
            showNotification('Giriş başarılı!', 'success');
            showAdminDashboard();
            loadDashboard();
        } else {
            showNotification(result.error || 'Giriş başarısız', 'error');
        }
    } catch (error) {
        showNotification('Bir hata oluştu', 'error');
    }
}

// Logout handler
function handleLogout() {
    adminToken = null;
    localStorage.removeItem('adminToken');
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    document.getElementById('loginForm').reset();
    showNotification('Çıkış yapıldı', 'success');
}

// Show admin dashboard
function showAdminDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
}

// Switch sections
function switchSection(section) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    document.getElementById(`${section}-section`).classList.add('active');
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    if (section === 'paletler') {
        loadPaletler();
    } else if (section === 'kategori') {
        loadCategories();
    } else if (section === 'raporlar') {
        loadReports();
    } else if (section === 'messages') {
        loadMessages();
    } else if (section === 'dashboard') {
        loadDashboard();
    }
}

// DASHBOARD
async function loadDashboard() {
    try {
        const [pallets, messages] = await Promise.all([
            fetch(`${API_BASE}/pallets`).then(r => r.json()),
            fetch(`${API_BASE}/admin/messages`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }).then(r => r.json())
        ]);

        allPaletler = pallets;
        allMessages = messages;

        // İstatistikleri güncelle
        document.getElementById('statTotalPaletler').textContent = pallets.length;
        document.getElementById('statTotalDeger').textContent = '₺' + pallets.reduce((sum, p) => sum + (p.price * p.quantity), 0).toLocaleString('tr-TR');
        document.getElementById('statYeniMesaj').textContent = messages.filter(m => m.status === 'new').length;
        
        const locations = [...new Set(pallets.map(p => p.location).filter(Boolean))];
        document.getElementById('statDepoSayisi').textContent = locations.length;

        // Son 5 paleti göster
        document.getElementById('recentPaletler').innerHTML = pallets.slice(0, 5).map(p => `
            <div class="recent-item">
                <strong>${p.name}</strong><br>
                <small>₺${p.price.toLocaleString('tr-TR')} | ${p.location} | ${p.quantity} adet</small>
            </div>
        `).join('');

        // Son 5 mesajı göster
        document.getElementById('recentMessages').innerHTML = messages.slice(0, 5).map(m => `
            <div class="recent-item">
                <strong>${m.name}</strong><br>
                <small>${m.email} | ${new Date(m.created_at).toLocaleDateString('tr-TR')}</small>
            </div>
        `).join('');
    } catch (error) {
        showNotification('Dashboard yüklenemedi', 'error');
    }
}

// MESAJLAR
async function loadMessages() {
    if (!adminToken) return;

    try {
        const response = await fetch(`${API_BASE}/admin/messages`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.status === 401) {
            handleLogout();
            return;
        }

        const messages = await response.json();
        allMessages = messages;
        
        const statusFilter = document.getElementById('statusFilter')?.value;
        let filtered = messages;
        if (statusFilter) {
            filtered = messages.filter(m => m.status === statusFilter);
        }

        displayMessages(filtered);
        updateMessageStats(messages);
    } catch (error) {
        showNotification('Mesajlar yüklenemedi', 'error');
    }
}

function displayMessages(messages) {
    const messagesList = document.getElementById('messagesList');
    
    if (messages.length === 0) {
        messagesList.innerHTML = '<p style="text-align: center; padding: 40px;">Mesaj bulunamadı</p>';
        return;
    }

    messagesList.innerHTML = messages.map(msg => `
        <div class="message-item ${msg.status}" onclick="showMessageDetail(${msg.id})">
            <div class="message-header">
                <div class="message-name">${msg.name}</div>
                <span class="message-status ${msg.status}">${getStatusText(msg.status)}</span>
            </div>
            <div class="message-email">📧 ${msg.email}</div>
            ${msg.phone ? `<div class="message-email">📞 ${msg.phone}</div>` : ''}
            ${msg.subject ? `<div class="message-preview"><strong>Konu:</strong> ${msg.subject}</div>` : ''}
            <div class="message-preview">${msg.message.substring(0, 150)}...</div>
            <div class="message-time">${new Date(msg.created_at).toLocaleString('tr-TR')}</div>
            <div class="message-actions" onclick="event.stopPropagation()">
                <button class="btn-mark" onclick="markMessage(${msg.id}, '${msg.status === 'new' ? 'read' : 'replied'}')">
                    ${msg.status === 'new' ? '✓ Okundu' : '✓ Cevaplandı'}
                </button>
                <button class="btn-delete" onclick="deleteMessage(${msg.id})">🗑️ Sil</button>
            </div>
        </div>
    `).join('');
}

function updateMessageStats(messages) {
    document.getElementById('totalMessages').textContent = messages.length;
    document.getElementById('unreadMessages').textContent = messages.filter(m => m.status === 'new').length;
    document.getElementById('repliedMessages').textContent = messages.filter(m => m.status === 'replied').length;
}

function getStatusText(status) {
    const statusMap = { 'new': 'Yeni', 'read': 'Okundu', 'replied': 'Cevaplandı' };
    return statusMap[status] || status;
}

function showMessageDetail(messageId) {
    const message = allMessages.find(m => m.id === messageId);
    if (message) {
        const messageDetails = document.getElementById('messageDetails');
        messageDetails.innerHTML = `
            <div class="message-detail"><label>Ad Soyadı:</label><p>${message.name}</p></div>
            <div class="message-detail"><label>E-posta:</label><p><a href="mailto:${message.email}">${message.email}</a></p></div>
            ${message.phone ? `<div class="message-detail"><label>Telefon:</label><p><a href="tel:${message.phone}">${message.phone}</a></p></div>` : ''}
            ${message.subject ? `<div class="message-detail"><label>Konu:</label><p>${message.subject}</p></div>` : ''}
            <div class="message-detail"><label>Mesaj:</label><p>${message.message}</p></div>
            <div class="message-detail"><label>Tarih:</label><p>${new Date(message.created_at).toLocaleString('tr-TR')}</p></div>
        `;
        document.getElementById('messageModal').style.display = 'flex';
    }
}

async function markMessage(messageId, newStatus) {
    if (!adminToken) return;

    try {
        const response = await fetch(`${API_BASE}/admin/messages/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            showNotification('Mesaj durumu güncellendi', 'success');
            loadMessages();
        }
    } catch (error) {
        showNotification('Güncelleme başarısız', 'error');
    }
}

async function deleteMessage(messageId) {
    if (!confirm('Bu mesajı silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/messages/${messageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            showNotification('Mesaj silindi', 'success');
            loadMessages();
        }
    } catch (error) {
        showNotification('Silme başarısız', 'error');
    }
}

// PALETLER
async function loadPaletler() {
    try {
        const response = await fetch(`${API_BASE}/pallets`);
        allPaletler = await response.json();
        
        // Şehirleri dropdown'a ekle
        const locations = [...new Set(allPaletler.map(p => p.location).filter(Boolean))];
        const locationSelect = document.getElementById('locationFilterPalet');
        if (locationSelect) {
            const current = locationSelect.value;
            locationSelect.innerHTML = '<option value="">Tüm Şehirler</option>' + 
                locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
            locationSelect.value = current;
        }

        displayPaletler(allPaletler);
    } catch (error) {
        showNotification('Paletler yüklenemedi', 'error');
    }
}

function displayPaletler(paletler) {
    const paletlerList = document.getElementById('paletlerList');
    
    if (paletler.length === 0) {
        paletlerList.innerHTML = '<p style="text-align: center; padding: 40px;">Palet bulunamadı</p>';
        return;
    }

    paletlerList.innerHTML = paletler.map(p => `
        <div class="palet-card">
            <div class="palet-content">
                <h3>${p.name}</h3>
                <p class="palet-desc">${p.description?.substring(0, 100) || ''}...</p>
                <div class="palet-info">
                    <div>💰 ₺${p.price.toLocaleString('tr-TR')}</div>
                    <div>📦 ${p.quantity} adet</div>
                    <div>📍 ${p.location}</div>
                    <div>⭐ ${p.condition}</div>
                </div>
                <div class="palet-actions">
                    <button class="btn-edit" onclick="editPalet(${p.id})">✏️ Düzenle</button>
                    <button class="btn-delete" onclick="deletePalet(${p.id})">🗑️ Sil</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterPaletler() {
    const search = document.getElementById('paletFilter')?.value.toLowerCase() || '';
    const location = document.getElementById('locationFilterPalet')?.value || '';

    const filtered = allPaletler.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search) || 
                            p.description?.toLowerCase().includes(search);
        const matchesLocation = !location || p.location === location;
        return matchesSearch && matchesLocation;
    });

    displayPaletler(filtered);
}

function openPaletModal() {
    document.getElementById('paletId').value = '';
    document.getElementById('paletForm').reset();
    document.getElementById('paletModal').style.display = 'flex';
}

function closePaletModal() {
    document.getElementById('paletModal').style.display = 'none';
}

async function savePalet(e) {
    e.preventDefault();
    
    const id = document.getElementById('paletId').value;
    const palet = {
        name: document.getElementById('paletName').value,
        description: document.getElementById('paletDesc').value,
        price: parseFloat(document.getElementById('paletPrice').value),
        quantity: parseInt(document.getElementById('paletQuantity').value) || 0,
        location: document.getElementById('paletLocation').value,
        condition: document.getElementById('paletCondition').value,
        contact_person: document.getElementById('paletContact').value,
        contact_phone: document.getElementById('paletPhone').value
    };

    try {
        const url = id ? `${API_BASE}/admin/pallets/${id}` : `${API_BASE}/pallets`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminToken ? `Bearer ${adminToken}` : undefined
            },
            body: JSON.stringify(palet)
        });

        if (response.ok) {
            showNotification(id ? 'Palet güncellendi' : 'Palet eklendi', 'success');
            closePaletModal();
            loadPaletler();
        } else {
            showNotification('İşlem başarısız', 'error');
        }
    } catch (error) {
        showNotification('Hata oluştu', 'error');
    }
}

async function editPalet(paletId) {
    const palet = allPaletler.find(p => p.id === paletId);
    if (palet) {
        document.getElementById('paletId').value = palet.id;
        document.getElementById('paletName').value = palet.name;
        document.getElementById('paletDesc').value = palet.description || '';
        document.getElementById('paletPrice').value = palet.price;
        document.getElementById('paletQuantity').value = palet.quantity || 0;
        document.getElementById('paletLocation').value = palet.location || '';
        document.getElementById('paletCondition').value = palet.condition || 'İyi';
        document.getElementById('paletContact').value = palet.contact_person || '';
        document.getElementById('paletPhone').value = palet.contact_phone || '';
        document.getElementById('paletModal').style.display = 'flex';
    }
}

async function deletePalet(paletId) {
    if (!confirm('Bu paleti silmek istediğinizden emin misiniz?')) return;

    try {
        const response = await fetch(`${API_BASE}/admin/pallets/${paletId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        if (response.ok) {
            showNotification('Palet silindi', 'success');
            loadPaletler();
        }
    } catch (error) {
        showNotification('Silme başarısız', 'error');
    }
}

// KATEGORİLER
function openCategoryModal() {
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryModal').style.display = 'flex';
}

function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

async function loadCategories() {
    // Örnek kategoriler
    const categories = [
        { id: 1, name: 'Euro Palet', description: '80x120 cm boyutlarında standart paletler' },
        { id: 2, name: 'Ahşap Palet', description: 'Endüstriyel kullanım için ahşap paletler' },
        { id: 3, name: 'Plastik Palet', description: 'Hafif ve dayanıklı plastik paletler' },
        { id: 4, name: 'CP Palet', description: '100x120 cm özel boyut paletler' }
    ];
    displayCategories(categories);
}

function displayCategories(categories) {
    const list = document.getElementById('categoriesList');
    if (categories.length === 0) {
        list.innerHTML = '<p>Kategori bulunamadı</p>';
        return;
    }
    
    list.innerHTML = categories.map(cat => `
        <div class="category-item">
            <h4>${cat.name}</h4>
            <p>${cat.description || ''}</p>
        </div>
    `).join('');
}

async function saveCategory(e) {
    e.preventDefault();
    showNotification('Kategori eklendi', 'success');
    closeCategoryModal();
    loadCategories();
}

// RAPORLAR
async function loadReports() {
    try {
        const paletler = await fetch(`${API_BASE}/pallets`).then(r => r.json());

        // Şehir bazlı dağılım
        const cityDist = {};
        paletler.forEach(p => {
            cityDist[p.location] = (cityDist[p.location] || 0) + 1;
        });

        const cityHTML = Object.entries(cityDist)
            .map(([city, count]) => `<div>📍 ${city}: <strong>${count} palet</strong></div>`)
            .join('');
        document.getElementById('cityDistribution').innerHTML = cityHTML || '<p>Veri yok</p>';

        // Fiyat analizi
        const avgPrice = paletler.reduce((sum, p) => sum + p.price, 0) / paletler.length;
        const minPrice = Math.min(...paletler.map(p => p.price));
        const maxPrice = Math.max(...paletler.map(p => p.price));

        document.getElementById('priceAnalysis').innerHTML = `
            <div>Ortalama: <strong>₺${avgPrice.toFixed(2)}</strong></div>
            <div>Minimum: <strong>₺${minPrice}</strong></div>
            <div>Maksimum: <strong>₺${maxPrice}</strong></div>
        `;
    } catch (error) {
        showNotification('Raporlar yüklenemedi', 'error');
    }
}

function generatePaletReport() {
    const csv = 'Palet Adı,Fiyat,Miktar,Şehir,Durumu\n' +
        allPaletler.map(p => `"${p.name}",${p.price},${p.quantity},"${p.location}","${p.condition}"`).join('\n');
    
    downloadCSV(csv, 'paletler.csv');
}

function generateContactReport() {
    const csv = 'Ad,Email,Telefon,Konu,Tarih,Durum\n' +
        allMessages.map(m => `"${m.name}","${m.email}","${m.phone || ''}","${m.subject || ''}","${new Date(m.created_at).toLocaleDateString()}","${m.status}"`).join('\n');
    
    downloadCSV(csv, 'mesajlar.csv');
}

function downloadCSV(content, filename) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// AYARLAR
function openAdminModal() {
    document.getElementById('adminForm').reset();
    document.getElementById('adminModal').style.display = 'flex';
}

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

async function addAdmin(e) {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_BASE}/admin/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                username: document.getElementById('adminUsername').value,
                password: document.getElementById('adminPassword').value
            })
        });

        if (response.ok) {
            showNotification('Yönetici eklendi', 'success');
            closeAdminModal();
        } else {
            showNotification('Hata: Bu kullanıcı adı zaten var olabilir', 'error');
        }
    } catch (error) {
        showNotification('Hata oluştu', 'error');
    }
}

function openSiteSettingsModal() {
    const settings = JSON.parse(localStorage.getItem('siteSettings') || '{}');
    document.getElementById('companyName').value = settings.companyName || 'ULUSAL PALET';
    document.getElementById('companyPhone').value = settings.companyPhone || '+90 (555) 123-4567';
    document.getElementById('companyEmail').value = settings.companyEmail || 'info@paletsatisi.com';
    document.getElementById('companyAddress').value = settings.companyAddress || 'İstanbul, Türkiye';
    document.getElementById('companyHours').value = settings.companyHours || '09:00 - 18:00';
    document.getElementById('siteSettingsModal').style.display = 'flex';
}

function closeSiteSettingsModal() {
    document.getElementById('siteSettingsModal').style.display = 'none';
}

function saveSiteSettings(e) {
    e.preventDefault();
    
    const settings = {
        companyName: document.getElementById('companyName').value,
        companyPhone: document.getElementById('companyPhone').value,
        companyEmail: document.getElementById('companyEmail').value,
        companyAddress: document.getElementById('companyAddress').value,
        companyHours: document.getElementById('companyHours').value
    };

    localStorage.setItem('siteSettings', JSON.stringify(settings));
    showNotification('Ayarlar kaydedildi', 'success');
    closeSiteSettingsModal();
}

async function backupDatabase() {
    try {
        const [paletler, messages] = await Promise.all([
            fetch(`${API_BASE}/pallets`).then(r => r.json()),
            fetch(`${API_BASE}/admin/messages`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            }).then(r => r.json())
        ]);

        const backup = {
            timestamp: new Date().toLocaleString('tr-TR'),
            paletler,
            messages
        };

        const json = JSON.stringify(backup, null, 2);
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(json));
        element.setAttribute('download', `backup_${new Date().getTime()}.json`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        showNotification('Yedek indirildi', 'success');
    } catch (error) {
        showNotification('Yedek alınamadı', 'error');
    }
}

async function deleteAllMessages() {
    if (!confirm('Tüm mesajları silmek istediğinizden EMIN misiniz? Bu işlem geri alınamaz!')) return;
    if (!confirm('Son kontrol: Gerçekten tüm mesajları silmek istiyor musunuz?')) return;

    try {
        for (const msg of allMessages) {
            await fetch(`${API_BASE}/admin/messages/${msg.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
        }
        showNotification('Tüm mesajlar silindi', 'success');
        loadMessages();
    } catch (error) {
        showNotification('Silme başarısız', 'error');
    }
}

// Modal close buttons
window.onclick = function(event) {
    const modals = ['messageModal', 'paletModal', 'categoryModal', 'adminModal', 'siteSettingsModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// ===== GELİŞTİRİLMİŞ RAPORLAR =====

function generateStockReport() {
    const stockData = {};
    allPaletler.forEach(p => {
        if (!stockData[p.location]) {
            stockData[p.location] = { adet: 0, deger: 0, paletSayisi: 0 };
        }
        stockData[p.location].adet += p.quantity || 0;
        stockData[p.location].deger += (p.price * (p.quantity || 0));
        stockData[p.location].paletSayisi += 1;
    });

    let report = 'Şehir,Toplam Adet,Stok Değeri (₺),Palet Sayısı\n';
    Object.entries(stockData).forEach(([city, data]) => {
        report += `"${city}",${data.adet},${data.deger.toLocaleString('tr-TR')},${data.paletSayisi}\n`;
    });

    downloadCSV(report, 'stok-durum.csv');
    showNotification('Stok raporu indirildi', 'success');
}

function generatePriceTrendsReport() {
    let minPrice = 0, maxPrice = 0, avgPrice = 0;
    const priceRanges = {
        '0-100': 0, '100-200': 0, '200-300': 0, '300-400': 0, '400+': 0
    };

    allPaletler.forEach(p => {
        if (p.price < minPrice || minPrice === 0) minPrice = p.price;
        if (p.price > maxPrice) maxPrice = p.price;
        avgPrice += p.price;

        if (p.price <= 100) priceRanges['0-100']++;
        else if (p.price <= 200) priceRanges['100-200']++;
        else if (p.price <= 300) priceRanges['200-300']++;
        else if (p.price <= 400) priceRanges['300-400']++;
        else priceRanges['400+']++;
    });

    avgPrice = allPaletler.length > 0 ? avgPrice / allPaletler.length : 0;

    let report = 'Fiyat Aralığı,Palet Sayısı\n';
    Object.entries(priceRanges).forEach(([range, count]) => {
        report += `"${range}",${count}\n`;
    });

    report += `\n\nFiyat İstatistikleri\nMinimum,${minPrice}\nMaksimum,${maxPrice}\nOrtalama,${avgPrice.toFixed(2)}\n`;

    downloadCSV(report, 'fiyat-trendleri.csv');
    showNotification('Fiyat raporu indirildi', 'success');
}

function generateTrendingReport() {
    const trendingPaletler = [...allPaletler].sort((a, b) => b.quantity - a.quantity).slice(0, 10);

    let report = 'Sıra,Palet Adı,Fiyat (₺),Miktar,Şehir,Durumu\n';
    trendingPaletler.forEach((p, i) => {
        report += `${i+1},"${p.name}",${p.price},${p.quantity},"${p.location}","${p.condition}"\n`;
    });

    downloadCSV(report, 'trending-paletler.csv');
    showNotification('Trend raporu indirildi', 'success');
}

function generateMessageAnalysis() {
    const messageStats = {
        total: allMessages.length,
        new: allMessages.filter(m => m.status === 'new').length,
        read: allMessages.filter(m => m.status === 'read').length,
        replied: allMessages.filter(m => m.status === 'replied').length,
        avgResponseTime: 'N/A'
    };

    const bySubject = {};
    allMessages.forEach(m => {
        const subject = m.subject || 'Konu Yok';
        bySubject[subject] = (bySubject[subject] || 0) + 1;
    });

    let report = 'MESAJ ANALİZİ RAPORU\n\n';
    report += 'Genel İstatistikler\n';
    report += `Toplam Mesaj,${messageStats.total}\n`;
    report += `Yeni Mesajlar,${messageStats.new}\n`;
    report += `Okundu,${messageStats.read}\n`;
    report += `Cevaplandı,${messageStats.replied}\n\n`;
    
    report += 'Konu Başlıklarına Göre Dağılım\n';
    Object.entries(bySubject).forEach(([subject, count]) => {
        report += `"${subject}",${count}\n`;
    });

    downloadCSV(report, 'mesaj-analizi.csv');
    showNotification('Mesaj analizi raporu indirildi', 'success');
}

