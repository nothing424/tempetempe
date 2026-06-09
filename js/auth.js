// ===== TEMPEPLAY AUTH =====

window.currentUser = null;

function showToast(msg, type = 'success') {
  let t = document.getElementById('tp-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'tp-toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

window.showToast = showToast;

window.addEventListener('firebase-ready', () => {
  const { onAuthStateChanged, signInWithPopup, GoogleAuthProvider,
          createUserWithEmailAndPassword, signInWithEmailAndPassword,
          signOut, updateProfile, doc, setDoc, getDoc } = window.firebaseFns;
  const auth = window.firebaseAuth;
  const db = window.firebaseDB;

  // ---- Auth State ----
  onAuthStateChanged(auth, async (user) => {
    window.currentUser = user;
    const userMenu = document.getElementById('user-menu');
    const btnLoginNav = document.getElementById('btn-login-nav');
    if (user) {
      if (userMenu) userMenu.classList.remove('hidden');
      if (btnLoginNav) btnLoginNav.classList.add('hidden');
      const avatar = document.getElementById('user-avatar');
      const nameEl = document.getElementById('user-display-name');
      if (avatar) avatar.src = user.photoURL || 'assets/default-avatar.png';
      if (nameEl) nameEl.textContent = user.displayName || user.email;

      // Save user to Firestore if new
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'TempeUser',
          email: user.email,
          photoURL: user.photoURL || '',
          createdAt: new Date().toISOString()
        });
      }
    } else {
      if (userMenu) userMenu.classList.add('hidden');
      if (btnLoginNav) btnLoginNav.classList.remove('hidden');
    }
  });

  // ---- Show/Hide Auth Modal ----
  function showAuthModal() {
    document.getElementById('auth-overlay')?.classList.remove('hidden');
  }
  function hideAuthModal() {
    document.getElementById('auth-overlay')?.classList.add('hidden');
  }

  window.showAuthModal = showAuthModal;
  window.hideAuthModal = hideAuthModal;

  document.getElementById('btn-login-nav')?.addEventListener('click', showAuthModal);
  document.getElementById('auth-close')?.addEventListener('click', hideAuthModal);
  document.getElementById('auth-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'auth-overlay') hideAuthModal();
  });

  // ---- Auth Tabs ----
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('form-login')?.classList.toggle('hidden', target !== 'login');
      document.getElementById('form-register')?.classList.toggle('hidden', target !== 'register');
    });
  });

  // ---- Google Login ----
  async function googleLogin() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      hideAuthModal();
      showToast('Selamat datang! 🎉');
    } catch (e) {
      showToast(e.message, 'error');
    }
  }
  document.getElementById('btn-google-login')?.addEventListener('click', googleLogin);
  document.getElementById('btn-google-register')?.addEventListener('click', googleLogin);

  // ---- Email Login ----
  document.getElementById('btn-email-login')?.addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    if (!email || !pass) { errEl.textContent = 'Isi email & password!'; return; }
    try {
      errEl.textContent = '';
      await signInWithEmailAndPassword(auth, email, pass);
      hideAuthModal();
      showToast('Berhasil masuk! 🎉');
    } catch (e) {
      errEl.textContent = e.code === 'auth/invalid-credential' ? 'Email/password salah!' : e.message;
    }
  });

  // ---- Email Register ----
  document.getElementById('btn-email-register')?.addEventListener('click', async () => {
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const pass = document.getElementById('register-password').value;
    const errEl = document.getElementById('register-error');
    if (!name || !email || !pass) { errEl.textContent = 'Semua kolom wajib diisi!'; return; }
    if (pass.length < 6) { errEl.textContent = 'Password minimal 6 karakter!'; return; }
    try {
      errEl.textContent = '';
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      hideAuthModal();
      showToast('Akun berhasil dibuat! 🎉');
    } catch (e) {
      errEl.textContent = e.code === 'auth/email-already-in-use' ? 'Email sudah dipakai!' : e.message;
    }
  });

  // ---- Logout ----
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOut(auth);
    showToast('Berhasil keluar 👋');
    setTimeout(() => location.reload(), 500);
  });

  // ---- Enter to submit ----
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const loginForm = document.getElementById('form-login');
      const registerForm = document.getElementById('form-register');
      if (loginForm && !loginForm.classList.contains('hidden')) {
        document.getElementById('btn-email-login')?.click();
      } else if (registerForm && !registerForm.classList.contains('hidden')) {
        document.getElementById('btn-email-register')?.click();
      }
    }
  });
});
