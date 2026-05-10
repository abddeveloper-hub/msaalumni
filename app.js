/**
 * Core Application Logic — Alumni Platform
 * Handles Data Persistence, Auth, and UI Interactions
 * Powered by Firebase Firestore Sync
 */

const firebaseConfig = {
    apiKey: "AIzaSyBXBCvarFZcS-1kJe-zsL9HA7XnRAskgoQ",
    authDomain: "mdu-alumni.firebaseapp.com",
    projectId: "mdu-alumni",
    storageBucket: "mdu-alumni.firebasestorage.app",
    messagingSenderId: "1008766776695",
    appId: "1:1008766776695:web:9c88f9784f863e0e095d72"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const App = {
    STORAGE_KEYS: {
        ALUMNI:   'mdu_alumni_data',
        PENDING:  'mdu_pending_registrations',
        SESSION:  'mdu_user_session',
        EVENTS:   'mdu_alumni_events'
    },

    async init() {
        this.handleNavbarScroll();
        this.handleAuthVisibility();
        this.setupEventListeners();
        this.animateOnScroll();
        this.initPWA();
        
        // Sync with Firebase automatically
        this.syncData();

        // Initialize Theme
        if (localStorage.getItem('mdu_theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (localStorage.getItem('mdu_theme') === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        this.initInvisibleTranslator();
    },

    initInvisibleTranslator() {
        if (document.getElementById('google_translate_element')) return;

        // Create hidden Google Translate container
        const gtContainer = document.createElement('div');
        gtContainer.id = 'google_translate_element';
        gtContainer.style.display = 'none';
        document.body.appendChild(gtContainer);

        // Inject Init Function
        const initScript = document.createElement('script');
        initScript.type = 'text/javascript';
        initScript.innerHTML = `
            function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                    pageLanguage: 'en', 
                    includedLanguages: 'en,ml,ar,kn', 
                    autoDisplay: false
                }, 'google_translate_element');
            }
        `;
        document.body.appendChild(initScript);

        const apiScript = document.createElement('script');
        apiScript.type = 'text/javascript';
        apiScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(apiScript);

        // Add custom styles to completely hide Google's UI
        const style = document.createElement('style');
        style.innerHTML = `
            .goog-te-banner-frame.skiptranslate { display: none !important; }
            body { top: 0px !important; }
            #goog-gt-tt { display: none !important; }
            .goog-tooltip { display: none !important; }
            .goog-tooltip:hover { display: none !important; }
            .goog-text-highlight { background-color: transparent !important; border: none !important; box-shadow: none !important; }
        `;
        document.head.appendChild(style);
    },

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark' || 
                      (!document.documentElement.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('mdu_theme', isDark ? 'light' : 'dark');
    },

    exportAlumniCSV() {
        const alumni = this.getAlumni();
        if(!alumni.length) return alert("No data to export");
        let csv = "ID,Name,Email,Batch,Year,Status,Qualification,Address\n";
        alumni.forEach(a => {
            const name = (a.name||'').replace(/"/g, '""');
            const email = (a.email||'').replace(/"/g, '""');
            const addr = (a.address||'').replace(/"/g, '""');
            csv += `"${a.memberId}","${name}","${email}","${a.batch}","${a.passedYear}","${a.status}","${a.darsQual}","${addr}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `alumni_directory_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    initPWA() {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('SW registered successfully'))
                    .catch(err => console.log('SW registration failed:', err));
            });
        }

        // Handle Install Prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            deferredPrompt = e;
            
            // Show install button dynamically if it doesn't exist
            if (!document.getElementById('pwa-install-btn')) {
                const btn = document.createElement('button');
                btn.id = 'pwa-install-btn';
                btn.className = 'btn btn-primary';
                btn.innerHTML = '📱 Install App';
                btn.style.cssText = 'position:fixed; bottom:20px; left:20px; z-index:9999; box-shadow:0 4px 15px rgba(0,0,0,0.2); border-radius:50px; padding:0.75rem 1.5rem; display:flex; align-items:center; gap:0.5rem; cursor:pointer; font-weight:bold; transition:all 0.3s ease;';
                
                // Add bounce animation
                if (!document.getElementById('pwa-styles')) {
                    const style = document.createElement('style');
                    style.id = 'pwa-styles';
                    style.textContent = `
                        @keyframes pwa-bounce {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-5px); }
                        }
                        #pwa-install-btn {
                            animation: pwa-bounce 2s infinite;
                        }
                        #pwa-install-btn:hover {
                            transform: scale(1.05);
                            animation: none;
                        }
                    `;
                    document.head.appendChild(style);
                }

                btn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') {
                            console.log('User accepted the PWA install prompt');
                            btn.style.display = 'none';
                        }
                        deferredPrompt = null;
                    }
                });
                document.body.appendChild(btn);
            }
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('PWA was installed');
            const btn = document.getElementById('pwa-install-btn');
            if (btn) btn.style.display = 'none';
        });
    },

    syncData() {
        // Listen to Alumni
        db.collection('alumni').onSnapshot(snap => {
            let alumni = snap.docs.map(d => ({ fbId: d.id, ...d.data() }));
            alumni.sort((a, b) => {
                const pyA = parseInt(a.passedYear) || 9999;
                const pyB = parseInt(b.passedYear) || 9999;
                if (pyA !== pyB) return pyA - pyB;
                const jyA = parseInt(a.joinedYear) || 9999;
                const jyB = parseInt(b.joinedYear) || 9999;
                if (jyA !== jyB) return jyA - jyB;
                return new Date(a.registeredAt || 0) - new Date(b.registeredAt || 0);
            });
            alumni.forEach((a, i) => a.memberId = `MDU-${String(i + 1).padStart(3, '0')}`);
            localStorage.setItem(this.STORAGE_KEYS.ALUMNI, JSON.stringify(alumni));
            window.dispatchEvent(new Event('dbSynced'));
        });

        // Listen to Pending
        db.collection('pending').onSnapshot(snap => {
            const pending = snap.docs.map(d => ({ fbId: d.id, ...d.data() }));
            localStorage.setItem(this.STORAGE_KEYS.PENDING, JSON.stringify(pending));
            window.dispatchEvent(new Event('dbSynced'));
        });

        // Listen to Events
        db.collection('events').onSnapshot(snap => {
            const events = snap.docs.map(d => ({ fbId: d.id, ...d.data() }));
            if (events.length === 0 && snap.metadata.fromCache === false) {
                const initialEvents = [
                    { title:'Annual Alumni Gathering 2026',  date:'2026-07-10', location:'Muhyisunnah Dars Ukkada Campus', category:'Social', desc:'A grand reunion.' },
                    { title:'Islamic Scholarship Seminar',   date:'2026-08-20', location:'Main Hall, Ukkada', category:'Academic', desc:'Seminar on contemporary Fiqh issues.' }
                ];
                initialEvents.forEach(e => db.collection('events').add(e));
            }
            localStorage.setItem(this.STORAGE_KEYS.EVENTS, JSON.stringify(events));
            window.dispatchEvent(new Event('dbSynced'));
        });
    },

    // ── Auth ──────────────────────────────────────
    async register(formData) {
        formData.registeredAt = new Date().toISOString();
        await db.collection('pending').add(formData);
        return { success: true };
    },

    async login(email, password) {
        if (email === 'admin@mdu.edu' && password === 'admin123') {
            const session = { user: { email, role: 'admin', name: 'Administrator' }, token: 'admin-token' };
            localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(session));
            return { success: true, role: 'admin' };
        }
        
        // Check firestore directly for live login
        const snap = await db.collection('alumni').where('email', '==', email).where('password', '==', password).get();
        if (!snap.empty) {
            const user = { fbId: snap.docs[0].id, ...snap.docs[0].data() };
            const session = { user: { ...user, role: 'alumni' }, token: 'user-token' };
            localStorage.setItem(this.STORAGE_KEYS.SESSION, JSON.stringify(session));
            return { success: true, role: 'alumni' };
        }
        return { success: false, message: 'Invalid email or password.' };
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.SESSION);
        window.location.href = 'index.html';
    },

    getSession() {
        const s = localStorage.getItem(this.STORAGE_KEYS.SESSION);
        return s ? JSON.parse(s) : null;
    },

    // ── Local Reads ──────────────────────────────────────
    getAlumni(filter = {}) {
        let alumni = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ALUMNI)) || [];
        if (filter.search) {
            const s = filter.search.toLowerCase();
            alumni = alumni.filter(a =>
                (a.name      || '').toLowerCase().includes(s) ||
                (a.batch     || '').toLowerCase().includes(s) ||
                (a.darsQual  || '').toLowerCase().includes(s) ||
                (a.address   || '').toLowerCase().includes(s) ||
                (a.memberId  || '').toLowerCase().includes(s) ||
                (a.email     || '').toLowerCase().includes(s)
            );
        }
        if (filter.batch)  alumni = alumni.filter(a => a.batch  === filter.batch);
        if (filter.year)   alumni = alumni.filter(a => a.passedYear === filter.year);
        if (filter.status) alumni = alumni.filter(a => a.status === filter.status);
        return alumni;
    },

    getPendingRegistrations() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PENDING)) || [];
    },

    getEvents() {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.EVENTS)) || [];
    },

    // ── Live Writes ──────────────────────────────────────
    async register(data) {
        data.registeredAt = new Date().toISOString();
        data.approvalStatus = 'pending';
        await db.collection('pending').add(data);
        return true;
    },
    async approveRegistration(id) {
        // id is fbId
        const doc = await db.collection('pending').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            data.approvalStatus = 'approved';
            await db.collection('alumni').add(data);
            await db.collection('pending').doc(id).delete();
            return true;
        }
        return false;
    },

    async rejectRegistration(id) {
        await db.collection('pending').doc(id).delete();
        return true;
    },

    async deleteAlumni(id) {
        await db.collection('alumni').doc(id).delete();
        return true;
    },

    async updateAlumni(id, data) {
        await db.collection('alumni').doc(id).update(data);
        return true;
    },

    async addEvent(data) {
        await db.collection('events').add(data);
        return true;
    },

    async updateEvent(id, data) {
        await db.collection('events').doc(id).update(data);
        return true;
    },

    async deleteEvent(id) {
        await db.collection('events').doc(id).delete();
        return true;
    },

    // ── UI Helpers ────────────────────────────────
    handleAuthVisibility() {
        const session = this.getSession();
        document.body.classList.toggle('logged-in', !!session);
        document.body.classList.toggle('role-admin', !!(session && session.user.role === 'admin'));
        document.querySelectorAll('[data-auth]').forEach(el  => el.style.display = session ? 'flex' : 'none');
        document.querySelectorAll('[data-guest]').forEach(el => el.style.display = session ? 'none' : 'flex');
        document.querySelectorAll('[data-role="admin"]').forEach(el =>
            el.style.display = (session && session.user.role === 'admin') ? 'flex' : 'none'
        );
    },

    handleNavbarScroll() {
        const nav = document.querySelector('.navbar');
        if (!nav) return;
        const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // Setup Mobile Menu
        const navContainer = nav.querySelector('.nav-container');
        const navLinks = nav.querySelector('.nav-links');
        if (navContainer && navLinks && !nav.querySelector('.mobile-menu-btn')) {
            const btn = document.createElement('button');
            btn.className = 'mobile-menu-btn';
            btn.innerHTML = '☰';
            btn.style.cssText = 'display:none; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-main); margin-left:auto;';
            navContainer.insertBefore(btn, navLinks);

            btn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
            });
        }
    },

    animateOnScroll() {
        const els = document.querySelectorAll('.fade-up');
        if (!els.length) return;
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
            });
        }, { threshold: 0.1 });
        els.forEach(el => obs.observe(el));
    },

    setupEventListeners() {
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', e => { e.preventDefault(); this.logout(); });
    },

    // ── Utility ───────────────────────────────────
    getInitials(name = '') {
        return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
    },

    formatDate(iso) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    avatarHTML(alumni, size = 48) {
        if (alumni.photo) {
            return `<img src="${alumni.photo}" alt="${alumni.name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;">`;
        }
        const initials = this.getInitials(alumni.name);
        const colors   = ['#b8860b', '#8b6914', '#a0790e', '#c9960d', '#d4a017'];
        const bg       = colors[alumni.id % colors.length] || colors[0];
        return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.round(size*0.34)}px;flex-shrink:0;">${initials}</div>`;
    },

    statusLabel(s) {
        const map = { employed: '💼 Employed', studying: '📖 Studying', teaching: '🏫 Teaching', other: '🔍 Other' };
        return map[s] || s || '—';
    }
};

// Inject fade-up animation CSS
const _style = document.createElement('style');
_style.textContent = `.fade-up{opacity:0;transform:translateY(28px);transition:opacity .6s ease,transform .6s ease;} .fade-up.visible{opacity:1;transform:none;}`;
document.head.appendChild(_style);

document.addEventListener('DOMContentLoaded', () => App.init());
