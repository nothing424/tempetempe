// ===== TEMPEPLAY - WATCH PARTY JS =====

const BACKEND = 'https://hsjshsjs-tempeplay-backend.hf.space';
let roomId = null;
let isHost = false;
let unsubRoom = null;
let unsubChat = null;
let hlsInstance = null;
let isSyncing = false;

function genCode() {
  return Math.random().toString(36).substring(2,8).toUpperCase();
}

window.addEventListener('firebase-ready', () => {
  const { doc, setDoc, getDoc, updateDoc, collection, addDoc,
          onSnapshot, serverTimestamp, query, orderBy, limit } = window.firebaseFns;
  const db = window.firebaseDB;

  // ---- Create Room ----
  document.getElementById('btn-create-room')?.addEventListener('click', async () => {
    if (!window.currentUser) { window.showAuthModal(); return; }
    const code = genCode();
    const params = new URLSearchParams(location.search);
    const animeId = params.get('animeid') || null;
    const ep = params.get('ep') || '1';

    const roomRef = doc(db, 'rooms', code);
    await setDoc(roomRef, {
      code,
      host: window.currentUser.uid,
      hostName: window.currentUser.displayName || 'Host',
      animeId,
      episode: ep,
      videoTime: 0,
      playing: false,
      members: { [window.currentUser.uid]: {
        name: window.currentUser.displayName || 'Host',
        photo: window.currentUser.photoURL || '',
        joinedAt: new Date().toISOString()
      }},
      createdAt: serverTimestamp()
    });

    isHost = true;
    joinRoom(code);
  });

  // ---- Join Room ----
  document.getElementById('btn-join-room')?.addEventListener('click', async () => {
    if (!window.currentUser) { window.showAuthModal(); return; }
    const code = document.getElementById('room-code-input').value.trim().toUpperCase();
    if (code.length < 4) { showToast('Kode room tidak valid!', 'error'); return; }

    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { showToast('Room tidak ditemukan!', 'error'); return; }

    // Add member
    await updateDoc(roomRef, {
      [`members.${window.currentUser.uid}`]: {
        name: window.currentUser.displayName || 'Guest',
        photo: window.currentUser.photoURL || '',
        joinedAt: new Date().toISOString()
      }
    });

    isHost = snap.data().host === window.currentUser.uid;
    joinRoom(code);
  });

  // ---- Allow Enter key for room code ----
  document.getElementById('room-code-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-join-room')?.click();
  });

  async function joinRoom(code) {
    roomId = code;
    document.getElementById('lobby').classList.add('hidden');
    document.getElementById('party-room').classList.remove('hidden');
    document.getElementById('room-code-display').textContent = code;

    // Copy code
    document.getElementById('btn-copy-code')?.addEventListener('click', () => {
      navigator.clipboard.writeText(code);
      showToast('Kode disalin! 📋');
    });

    const roomRef = doc(db, 'rooms', code);

    // Listen to room changes (sync video)
    unsubRoom = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) { leaveRoom(); return; }
      const data = snap.data();
      renderMembers(data.members || {});
      syncVideo(data);
      const count = Object.keys(data.members || {}).length;
      document.getElementById('room-status').textContent =
        `👥 ${count} orang nonton • ${isHost ? '👑 Kamu Host' : ''}`;

      // Load video if animeId set
      if (data.animeId && !window._roomVideoLoaded) {
        window._roomVideoLoaded = true;
        loadPartyVideo(data.animeId, data.episode);
      }
    });

    // Listen to chat
    const chatRef = collection(db, 'rooms', code, 'chat');
    const chatQ = query(chatRef, orderBy('time', 'asc'), limit(100));
    unsubChat = onSnapshot(chatQ, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      renderChat(msgs);
    });

    // Video sync events (host → all)
    const videoEl = document.getElementById('video-player');
    if (isHost) {
      videoEl.addEventListener('play', () => syncToFirebase(roomRef, { playing: true, videoTime: videoEl.currentTime }));
      videoEl.addEventListener('pause', () => syncToFirebase(roomRef, { playing: false, videoTime: videoEl.currentTime }));
      videoEl.addEventListener('seeked', () => syncToFirebase(roomRef, { videoTime: videoEl.currentTime }));
    }

    // Send chat
    document.getElementById('btn-send-chat')?.addEventListener('click', () => sendChat(code));
    document.getElementById('chat-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat(code);
    });

    // Leave
    document.getElementById('btn-leave-room')?.addEventListener('click', leaveRoom);

    // System message
    addSystemMsg(`${window.currentUser.displayName || 'Kamu'} bergabung ke room 🎉`);
  }

  async function syncToFirebase(roomRef, data) {
    try { await updateDoc(roomRef, data); } catch(e) {}
  }

  function syncVideo(data) {
    if (isHost) return;
    const videoEl = document.getElementById('video-player');
    if (!videoEl.src && !videoEl.querySelector('source')) return;

    isSyncing = true;
    const drift = Math.abs(videoEl.currentTime - (data.videoTime || 0));
    if (drift > 2) videoEl.currentTime = data.videoTime || 0;

    if (data.playing && videoEl.paused) videoEl.play().catch(()=>{});
    else if (!data.playing && !videoEl.paused) videoEl.pause();
    isSyncing = false;
  }

  async function sendChat(code) {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !window.currentUser) return;
    input.value = '';

    const chatRef = collection(db, 'rooms', code, 'chat');
    await addDoc(chatRef, {
      uid: window.currentUser.uid,
      name: window.currentUser.displayName || 'User',
      photo: window.currentUser.photoURL || '',
      text,
      time: serverTimestamp()
    });
  }

  function addSystemMsg(msg) {
    const msgs = document.getElementById('chat-messages');
    const el = document.createElement('div');
    el.className = 'chat-system';
    el.textContent = msg;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderChat(msgs) {
    const container = document.getElementById('chat-messages');
    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    container.innerHTML = msgs.map(m => {
      const isMe = m.uid === window.currentUser?.uid;
      return `
        <div class="chat-msg ${isMe ? 'me' : ''}">
          <img class="chat-msg-avatar" src="${m.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name) + '&background=0D8ABC&color=fff'}" alt="${m.name}" />
          <div class="chat-msg-body">
            <div class="chat-msg-name">${m.name}${isMe ? ' (kamu)' : ''}</div>
            <div class="chat-msg-text">${escapeHtml(m.text)}</div>
          </div>
        </div>
      `;
    }).join('');
    document.getElementById('chat-count').textContent = `${msgs.length} pesan`;
    if (isBottom) container.scrollTop = container.scrollHeight;
  }

  function renderMembers(members) {
    const list = document.getElementById('members-list');
    list.innerHTML = Object.entries(members).map(([uid, m]) => `
      <div class="member-chip ${uid === window.currentUser?.uid ? 'host' : ''}">
        <img src="${m.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(m.name) + '&background=0D8ABC&color=fff'}" alt="${m.name}" />
        ${m.name}
      </div>
    `).join('');
  }

  async function leaveRoom() {
    if (unsubRoom) unsubRoom();
    if (unsubChat) unsubChat();
    if (hlsInstance) hlsInstance.destroy();
    window._roomVideoLoaded = false;

    if (roomId && window.currentUser) {
      const roomRef = doc(db, 'rooms', roomId);
      try {
        await updateDoc(roomRef, {
          [`members.${window.currentUser.uid}`]: null
        });
      } catch(e) {}
    }
    document.getElementById('party-room').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
    roomId = null;
    showToast('Keluar dari room 👋');
  }

  async function loadPartyVideo(animeId, episode) {
    try {
      const anime = await fetchAnimeDetail(animeId);
      const title = anime.title.english || anime.title.romaji;
      const slug = encodeURIComponent(title.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
      const res = await fetch(`${BACKEND}/api/episodes/${slug}`);
      const data = await res.json();
      const ep = data.episodes?.[parseInt(episode)-1] || data.episodes?.[0];
      if (!ep) return;
      const srcRes = await fetch(`${BACKEND}/api/stream/${ep.id}`);
      const srcData = await srcRes.json();
      if (srcData.sources?.[0]) {
        const videoEl = document.getElementById('video-player');
        const loading = document.getElementById('video-loading');
        playHLS(srcData.sources[0].url, videoEl, loading);
      }
    } catch(e) {
      document.getElementById('video-loading').innerHTML = `
        <p style="color:var(--text2);text-align:center;padding:20px">Backend diperlukan untuk streaming. <br>Deploy Python backend dulu!</p>
      `;
    }
  }

  function playHLS(url, videoEl, loading) {
    if (hlsInstance) hlsInstance.destroy();
    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoEl);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        loading.style.display = 'none';
        videoEl.style.display = 'block';
      });
    } else {
      videoEl.src = url;
      loading.style.display = 'none';
      videoEl.style.display = 'block';
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
});
