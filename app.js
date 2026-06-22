// ===== Production ES Module for Authentication =====
const GOOGLE_CLIENT_ID = 'REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

export function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Failed to parse JWT', e);
        return null;
    }
}

export function saveUserToLocal(user) {
    if (!user) return;
    const minimal = {
        id: user.sub || user.iat || ('guest_' + Date.now()),
        name: user.name || user.email || 'مستخدم',
        email: user.email || '',
        picture: user.picture || ''
    };
    localStorage.setItem('currentUser', JSON.stringify(minimal));
    updateUserUI(minimal);
}

export function updateUserUI(user) {
    const userInfo = document.getElementById('user-info');
    if (!userInfo) return;
    if (user) {
        userInfo.innerHTML = '';
        const img = user.picture ? `<img src="${user.picture}" alt="avatar" style="width:48px;height:48px;border-radius:50%;display:block;margin:0 auto 8px;">` : '';
        userInfo.innerHTML = `${img}<div style="font-weight:700">${user.name}</div>`;
    } else {
        userInfo.textContent = '';
    }
}

export function handleCredentialResponse(response) {
    const payload = parseJwt(response.credential);
    if (!payload) {
        console.error('Invalid credential response');
        return;
    }
    saveUserToLocal(payload);
    const googleDiv = document.getElementById('g_id_signin');
    if (googleDiv) googleDiv.style.display = 'none';
    const topicSection = document.getElementById('topic-selection');
    if (topicSection) topicSection.classList.add('visible');
    const loginSection = document.getElementById('login-screen');
    if (loginSection) loginSection.classList.remove('visible');
}

export function initializeAuth() {
    if (window.google && google.accounts && google.accounts.id) {
        try {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false
            });
            google.accounts.id.renderButton(document.getElementById('g_id_signin'), {
                theme: 'outline', size: 'large', text: 'signin_with'
            });
        } catch (e) {
            console.warn('Google Identity Services not ready', e);
        }
    } else {
        console.warn('Google API not loaded yet');
    }
}

export function loadProfileFromLocal() {
    const raw = localStorage.getItem('currentUser');
    if (!raw) return null;
    try {
        const user = JSON.parse(raw);
        updateUserUI(user);
        const topicSection = document.getElementById('topic-selection');
        const loginSection = document.getElementById('login-screen');
        if (topicSection) topicSection.classList.add('visible');
        if (loginSection) loginSection.classList.remove('visible');
        const googleDiv = document.getElementById('g_id_signin');
        if (googleDiv) googleDiv.style.display = 'none';
        return user;
    } catch (e) {
        console.error('Failed to parse currentUser from localStorage', e);
        return null;
    }
}

export function signOut() {
    localStorage.removeItem('currentUser');
    updateUserUI(null);
    const loginSection = document.getElementById('login-screen');
    const topicSection = document.getElementById('topic-selection');
    if (loginSection) loginSection.classList.add('visible');
    if (topicSection) topicSection.classList.remove('visible');
    const googleDiv = document.getElementById('g_id_signin');
    if (googleDiv) googleDiv.style.display = 'block';
}

export function guestSignIn() {
    const guest = { id: 'guest_' + Date.now(), name: 'ضيف', email: '', picture: '' };
    localStorage.setItem('currentUser', JSON.stringify(guest));
    updateUserUI(guest);
    const loginSection = document.getElementById('login-screen');
    const topicSection = document.getElementById('topic-selection');
    if (loginSection) loginSection.classList.remove('visible');
    if (topicSection) topicSection.classList.add('visible');
    const googleDiv = document.getElementById('g_id_signin');
    if (googleDiv) googleDiv.style.display = 'none';
}

// ===== ES Module Global Mapping for UI Access =====
window.parseJwt = parseJwt;
window.saveUserToLocal = saveUserToLocal;
window.updateUserUI = updateUserUI;
window.handleCredentialResponse = handleCredentialResponse;
window.initializeAuth = initializeAuth;
window.loadProfileFromLocal = loadProfileFromLocal;
window.signOut = signOut;
window.guestSignIn = guestSignIn;

// Auto init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    loadProfileFromLocal();
    const guestBtn = document.getElementById('guest-signin-btn');
    if (guestBtn) guestBtn.addEventListener('click', guestSignIn);
    const logoutMenu = document.getElementById('menu-logout');
    if (logoutMenu) logoutMenu.addEventListener('click', signOut);
});
