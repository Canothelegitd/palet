// Main Website JavaScript

// Production API endpoint
// Render backend'i
const API_BASE = 'https://palet-site.onrender.com/api';

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

// Load paletler
async function loadPaletler() {
    try {
        const response = await fetch(`${API_BASE}/pallets`);
        const paletler = await response.json();
        displayPaletler(paletler);
    } catch (error) {
        console.error('Paletler yükleme hatası:', error);
        showNotification('Paletler yüklenemedi', 'error');
    }
}

// Display paletler
function displayPaletler(paletler) {
    const paletlerList = document.getElementById('paletler-list');
    
    if (paletler.length === 0) {
        paletlerList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">Şu anda mevcut palet yoktur.</p>';
        return;
    }

    paletlerList.innerHTML = paletler.map(palet => {
        const tarih = new Date(palet.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Palet resimlerini ayarla - Render'dan çek
        const palet_images = [
            'https://palet-site.onrender.com/resim/cp1-palet-100x120-1.jpg',
            'https://palet-site.onrender.com/resim/cp3-palet.jpg',
            'https://palet-site.onrender.com/resim/epal-euro-palet-profil.jpg',
            'https://palet-site.onrender.com/resim/euro-palet-izpas-palet.jpg',
            'https://palet-site.onrender.com/resim/prs-7-pallet-1.jpg',
            'https://palet-site.onrender.com/resim/IMG-20220725-WA0004.jpg',
            'https://palet-site.onrender.com/resim/IMG-20220809-WA0002.jpg'
        ];
        
        const palet_image = palet_images[palet.id % palet_images.length];
        
        return `
            <div class="palet-card">
                <div class="palet-image" style="background-image: url('${palet_image}'); background-size: cover; background-position: center;">
                </div>
                <div class="palet-content">
                    <div class="palet-name">${palet.name}</div>
                    ${palet.price ? `<div class="palet-price">₺ ${palet.price.toLocaleString('tr-TR')}</div>` : ''}
                    
                    <div class="palet-description">${palet.description}</div>
                    
                    <div class="palet-details">
                        <div class="detail-item">
                            <span class="detail-label">✓ Durum</span>
                            <span class="detail-value">${palet.condition || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📊 Miktar</span>
                            <span class="detail-value">${palet.quantity || '-'} adet</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📍 Konum</span>
                            <span class="detail-value">${palet.location || '-'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">📅 Eklenme</span>
                            <span class="detail-value">${tarih}</span>
                        </div>
                    </div>
                    
                    <div class="palet-contact">
                        <strong>${palet.contact_person || 'İletişim'}</strong>
                        ${palet.contact_phone ? `<a href="tel:${palet.contact_phone}">📞 ${palet.contact_phone}</a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filter paletler
document.addEventListener('DOMContentLoaded', () => {
    loadPaletler();

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const locationFilter = document.getElementById('locationFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterPaletler);
    }
    if (locationFilter) {
        locationFilter.addEventListener('change', filterPaletler);
    }

    // Contact form submit
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', submitContactForm);
    }
});

async function filterPaletler() {
    try {
        const response = await fetch(`${API_BASE}/pallets`);
        let paletler = await response.json();

        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const location = document.getElementById('locationFilter')?.value || '';

        paletler = paletler.filter(p => {
            const matchesSearch = !searchTerm || 
                p.name.toLowerCase().includes(searchTerm) || 
                p.description.toLowerCase().includes(searchTerm);
            const matchesLocation = !location || p.location === location;
            return matchesSearch && matchesLocation;
        });

        displayPaletler(paletler);
    } catch (error) {
        console.error('Filtreleme hatası:', error);
    }
}

// Submit contact form
async function submitContactForm(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    try {
        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(result.message, 'success');
            document.getElementById('contactForm').reset();
        } else {
            showNotification(result.error || 'Mesaj gönderilemedi', 'error');
        }
    } catch (error) {
        console.error('Form gönderme hatası:', error);
        showNotification('Bir hata oluştu', 'error');
    }
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});
