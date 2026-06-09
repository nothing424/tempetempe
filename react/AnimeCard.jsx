// ===== TempePlay - AnimeCard.jsx =====
// Reusable anime card component
// Usage: <AnimeCard anime={animeObj} onClick={(id) => navigate(`/watch/${id}`)} />

import { useState } from "react";

export default function AnimeCard({ anime, onClick }) {
  const [imgError, setImgError] = useState(false);

  const title = anime?.title?.english || anime?.title?.romaji || "Unknown";
  const poster = imgError
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=009999&color=fff&size=300`
    : anime?.coverImage?.large || anime?.coverImage?.extraLarge;
  const score = anime?.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
  const eps = anime?.episodes ? `${anime.episodes} eps` : null;
  const isOngoing = anime?.status === "RELEASING";

  return (
    <div
      className="tp-card"
      onClick={() => onClick?.(anime.id)}
      style={{
        background: "var(--card, #111c27)",
        borderRadius: 14,
        overflow: "hidden",
        cursor: "pointer",
        border: "1px solid transparent",
        transition: "all 0.25s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.borderColor = "var(--primary, #00c8c8)";
        e.currentTarget.style.boxShadow = "0 0 20px rgba(0,200,200,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = "transparent";
        e.currentTarget.style.boxShadow = "";
      }}
    >
      {/* Poster */}
      <div style={{ position: "relative", aspectRatio: "2/3", overflow: "hidden" }}>
        <img
          src={poster}
          alt={title}
          onError={() => setImgError(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        {/* Score badge */}
        {score && (
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,0.8)", color: "#ffd700",
            borderRadius: 50, padding: "2px 8px",
            fontSize: "0.75rem", fontWeight: 800,
          }}>
            ⭐ {score}
          </div>
        )}
        {/* Ongoing badge */}
        {isOngoing && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            background: "rgba(0,200,200,0.85)", color: "#fff",
            borderRadius: 50, padding: "2px 10px",
            fontSize: "0.72rem", fontWeight: 800,
          }}>
            Ongoing
          </div>
        )}
        {/* Hover overlay */}
        <div className="card-overlay" style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          paddingBottom: 16, opacity: 0, transition: "opacity 0.25s",
        }}>
          <span style={{
            background: "var(--primary, #00c8c8)", color: "#fff",
            borderRadius: 50, padding: "6px 18px",
            fontWeight: 800, fontSize: "0.85rem",
          }}>
            ▶ Tonton
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px" }}>
        <div style={{
          fontWeight: 800, fontSize: "0.85rem",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 4, color: "var(--text, #e8f4f8)",
        }}>
          {title}
        </div>
        <div style={{
          color: "var(--text2, #8ba8b8)",
          fontSize: "0.75rem", display: "flex", gap: 8,
        }}>
          <span>{anime?.format || "TV"}</span>
          {eps && <span>{eps}</span>}
        </div>
      </div>
    </div>
  );
}
