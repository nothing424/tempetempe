// ===== TempePlay - WatchParty.jsx =====
// Full watch party component with Firebase Firestore sync
// Props: firebaseApp, currentUser

import { useState, useEffect, useRef } from "react";
import VideoPlayer from "./VideoPlayer";

const BACKEND = "http://localhost:8000";

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function WatchParty({ db, currentUser, fns }) {
  const [screen, setScreen] = useState("lobby"); // lobby | room
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sources, setSources] = useState([]);
  const [error, setError] = useState("");
  const chatRef = useRef(null);
  const unsubRoom = useRef(null);
  const unsubChat = useRef(null);

  const { doc, setDoc, getDoc, updateDoc, collection, addDoc,
          onSnapshot, serverTimestamp, query, orderBy, limit } = fns;

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Cleanup on unmount
  useEffect(() => () => {
    unsubRoom.current?.();
    unsubChat.current?.();
  }, []);

  async function createRoom() {
    if (!currentUser) { setError("Login dulu!"); return; }
    const code = genCode();
    const roomRef = doc(db, "rooms", code);
    await setDoc(roomRef, {
      code, host: currentUser.uid,
      hostName: currentUser.displayName || "Host",
      animeId: null, episode: "1",
      videoTime: 0, playing: false,
      members: { [currentUser.uid]: {
        name: currentUser.displayName || "Host",
        photo: currentUser.photoURL || "",
      }},
      createdAt: serverTimestamp(),
    });
    setIsHost(true);
    enterRoom(code);
  }

  async function joinRoom() {
    if (!currentUser) { setError("Login dulu!"); return; }
    const code = inputCode.trim().toUpperCase();
    if (code.length < 4) { setError("Kode tidak valid!"); return; }
    const roomRef = doc(db, "rooms", code);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) { setError("Room tidak ditemukan!"); return; }
    await updateDoc(roomRef, {
      [`members.${currentUser.uid}`]: {
        name: currentUser.displayName || "Guest",
        photo: currentUser.photoURL || "",
      }
    });
    setIsHost(snap.data().host === currentUser.uid);
    enterRoom(code);
  }

  function enterRoom(code) {
    setRoomCode(code);
    setError("");

    const roomRef = doc(db, "rooms", code);
    unsubRoom.current = onSnapshot(roomRef, (snap) => {
      if (!snap.exists()) { leaveRoom(); return; }
      setRoomData(snap.data());
    });

    const chatQ = query(collection(db, "rooms", code, "chat"), orderBy("time", "asc"), limit(100));
    unsubChat.current = onSnapshot(chatQ, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    setScreen("room");
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || !currentUser || !roomCode) return;
    setChatInput("");
    await addDoc(collection(db, "rooms", roomCode, "chat"), {
      uid: currentUser.uid,
      name: currentUser.displayName || "User",
      photo: currentUser.photoURL || "",
      text, time: serverTimestamp(),
    });
  }

  function leaveRoom() {
    unsubRoom.current?.();
    unsubChat.current?.();
    setScreen("lobby");
    setRoomCode("");
    setRoomData(null);
    setMessages([]);
    setSources([]);
  }

  const memberCount = Object.keys(roomData?.members || {}).length;

  // ---- LOBBY ----
  if (screen === "lobby") return (
    <div style={{
      minHeight: "calc(100vh - 70px)", display: "flex",
      alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <div style={{
        background: "var(--bg2, #0f1720)", border: "1px solid rgba(0,200,200,0.15)",
        borderRadius: 24, padding: "48px 40px", maxWidth: 480, width: "100%", textAlign: "center",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>🍿</div>
        <h1 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>
          Watch Party
        </h1>
        <p style={{ color: "#8ba8b8", marginBottom: 36, lineHeight: 1.6 }}>
          Nonton anime bareng temen secara real-time!
        </p>
        {error && <p style={{ color: "#ff4757", marginBottom: 12, fontWeight: 700 }}>{error}</p>}
        <button
          onClick={createRoom}
          style={{
            width: "100%", background: "linear-gradient(135deg,#00c8c8,#009999)",
            color: "#fff", border: "none", borderRadius: 50, padding: "14px 32px",
            fontFamily: "Nunito,sans-serif", fontWeight: 800, fontSize: "1.05rem",
            cursor: "pointer", marginBottom: 20,
          }}
        >✨ Buat Room Baru</button>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
            placeholder="MASUKKAN KODE"
            maxLength={6}
            style={{
              background: "#162030", border: "1px solid rgba(0,200,200,0.15)",
              borderRadius: 10, padding: "12px 16px", color: "#e8f4f8",
              fontFamily: "monospace", fontSize: "1.3rem", textAlign: "center",
              letterSpacing: 6, outline: "none", width: "100%",
            }}
          />
          <button
            onClick={joinRoom}
            style={{
              width: "100%", background: "transparent", color: "#00c8c8",
              border: "2px solid #00c8c8", borderRadius: 50, padding: "12px",
              fontFamily: "Nunito,sans-serif", fontWeight: 800, cursor: "pointer",
            }}
          >Masuk Room</button>
        </div>
      </div>
    </div>
  );

  // ---- ROOM ----
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 340px", gap: 20,
      maxWidth: 1400, margin: "0 auto", padding: "20px 24px",
      height: "calc(100vh - 70px)",
    }}>
      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
        <VideoPlayer sources={sources} />

        {/* Room bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          background: "#111c27", border: "1px solid rgba(0,200,200,0.15)",
          borderRadius: 14, padding: "12px 20px",
        }}>
          <span style={{ color: "#8ba8b8", fontSize: "0.9rem" }}>Kode Room:</span>
          <strong style={{
            fontFamily: "monospace", fontSize: "1.5rem", fontWeight: 900,
            color: "#00c8c8", letterSpacing: 4,
          }}>{roomCode}</strong>
          <button
            onClick={() => navigator.clipboard.writeText(roomCode)}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem" }}
          >📋</button>
          <span style={{ color: "#8ba8b8", fontSize: "0.85rem", flex: 1 }}>
            👥 {memberCount} orang {isHost ? "• 👑 Kamu Host" : ""}
          </span>
          <button
            onClick={leaveRoom}
            style={{
              background: "#ff4757", color: "#fff", border: "none",
              borderRadius: 50, padding: "8px 18px",
              fontFamily: "Nunito,sans-serif", fontWeight: 800, cursor: "pointer",
            }}
          >Keluar</button>
        </div>

        {/* Members */}
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center",
          background: "#111c27", border: "1px solid rgba(0,200,200,0.15)",
          borderRadius: 14, padding: "10px 16px",
        }}>
          <span style={{ color: "#8ba8b8", fontSize: "0.85rem", fontWeight: 700 }}>👥 Anggota:</span>
          {Object.entries(roomData?.members || {}).map(([uid, m]) => (
            <div key={uid} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#162030",
              border: `1px solid ${uid === currentUser?.uid ? "#00c8c8" : "rgba(0,200,200,0.15)"}`,
              borderRadius: 50, padding: "4px 12px",
              fontSize: "0.8rem", fontWeight: 700,
              color: uid === currentUser?.uid ? "#00c8c8" : "#e8f4f8",
            }}>
              <img
                src={m.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=0D8ABC&color=fff`}
                alt={m.name}
                style={{ width: 20, height: 20, borderRadius: "50%" }}
              />
              {m.name}
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{
        background: "#111c27", border: "1px solid rgba(0,200,200,0.15)",
        borderRadius: 14, display: "flex", flexDirection: "column", overflow: "hidden",
        height: "100%",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,200,200,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "1rem" }}>💬 Chat Room</h3>
          <span style={{ color: "#8ba8b8", fontSize: "0.8rem" }}>{messages.length} pesan</span>
        </div>
        <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map(m => {
            const isMe = m.uid === currentUser?.uid;
            return (
              <div key={m.id} style={{ display: "flex", gap: 10, flexDirection: isMe ? "row-reverse" : "row" }}>
                <img
                  src={m.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=0D8ABC&color=fff`}
                  alt={m.name}
                  style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0 }}
                />
                <div style={{ maxWidth: "75%" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: isMe ? "#40e0d0" : "#00c8c8", marginBottom: 3, textAlign: isMe ? "right" : "left" }}>
                    {m.name}
                  </div>
                  <div style={{
                    background: isMe ? "rgba(0,200,200,0.15)" : "#162030",
                    borderRadius: isMe ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                    padding: "8px 12px", fontSize: "0.88rem", lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid rgba(0,200,200,0.15)", display: "flex", gap: 8 }}>
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
            placeholder="Ketik pesan..."
            maxLength={200}
            style={{
              flex: 1, background: "#162030", border: "1px solid rgba(0,200,200,0.15)",
              borderRadius: 50, padding: "10px 16px", color: "#e8f4f8",
              fontFamily: "Nunito,sans-serif", fontSize: "0.9rem", outline: "none",
            }}
          />
          <button
            onClick={sendChat}
            style={{
              background: "linear-gradient(135deg,#00c8c8,#009999)", color: "#fff",
              border: "none", borderRadius: 50, padding: "10px 18px",
              fontFamily: "Nunito,sans-serif", fontWeight: 800, cursor: "pointer",
            }}
          >Kirim</button>
        </div>
      </div>
    </div>
  );
}
