// ===== TempePlay - VideoPlayer.jsx =====
// HLS video player with quality selector
// Usage: <VideoPlayer sources={[{url, quality}]} onEnded={() => {}} />

import { useEffect, useRef, useState } from "react";

export default function VideoPlayer({ sources = [], onEnded, onTimeUpdate }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sources.length) return;
    loadSource(sources[activeIdx]);
    return () => destroyHls();
  }, [sources, activeIdx]);

  function destroyHls() {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }

  function loadSource(source) {
    if (!source?.url) return;
    const video = videoRef.current;
    setLoading(true);
    setError(false);
    destroyHls();

    const isHLS = source.type === "hls" || source.url.includes(".m3u8");

    if (isHLS) {
      // Dynamic import Hls.js
      import("https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js")
        .then(({ default: Hls }) => {
          if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: false });
            hlsRef.current = hls;
            hls.loadSource(source.url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
              video.play().catch(() => {});
            });
            hls.on(Hls.Events.ERROR, (_, data) => {
              if (data.fatal) setError(true);
            });
          } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = source.url;
            video.addEventListener("loadedmetadata", () => setLoading(false), { once: true });
          }
        })
        .catch(() => setError(true));
    } else {
      video.src = source.url;
      video.addEventListener("loadeddata", () => setLoading(false), { once: true });
      video.addEventListener("error", () => setError(true), { once: true });
    }
  }

  const containerStyle = {
    position: "relative",
    background: "#000",
    borderRadius: 14,
    overflow: "hidden",
    aspectRatio: "16/9",
    width: "100%",
  };

  const overlayStyle = {
    position: "absolute", inset: 0,
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    background: "#000", gap: 16,
    color: "#8ba8b8",
  };

  return (
    <div>
      <div style={containerStyle}>
        {loading && !error && (
          <div style={overlayStyle}>
            <div style={{
              width: 48, height: 48,
              border: "4px solid rgba(0,200,200,0.2)",
              borderTopColor: "#00c8c8",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p>Memuat video...</p>
          </div>
        )}
        {error && (
          <div style={overlayStyle}>
            <span style={{ fontSize: "2rem" }}>😢</span>
            <p>Video tidak tersedia.</p>
            <p style={{ fontSize: "0.8rem" }}>Coba server lain</p>
          </div>
        )}
        <video
          ref={videoRef}
          controls
          playsInline
          style={{ width: "100%", height: "100%", display: loading && !error ? "none" : "block" }}
          onEnded={onEnded}
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
        />
      </div>

      {/* Server selector */}
      {sources.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: "#8ba8b8", fontSize: "0.85rem", fontWeight: 700 }}>Server:</span>
          {sources.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                background: i === activeIdx ? "#00c8c8" : "#111c27",
                border: `1px solid ${i === activeIdx ? "#00c8c8" : "rgba(0,200,200,0.15)"}`,
                color: i === activeIdx ? "#fff" : "#8ba8b8",
                borderRadius: 50, padding: "6px 16px",
                fontFamily: "Nunito, sans-serif", fontWeight: 700,
                fontSize: "0.82rem", cursor: "pointer", transition: "all 0.2s",
              }}
            >
              {s.quality || `Server ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
