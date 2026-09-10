import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0e10",
          backgroundImage:
            "radial-gradient(circle at 50% 120%, rgba(217,164,65,0.18), transparent 60%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 96,
            fontWeight: 700,
            color: "#f2f1ec",
            letterSpacing: -2,
          }}
        >
          <span>PITSTOP 084</span>
          <span style={{ color: "#d9a441" }}>⚡</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            color: "#9aa0a6",
          }}
        >
          Assinatura automotiva, sempre em dia
        </div>
        <div
          style={{
            marginTop: 48,
            width: 160,
            height: 6,
            background: "#d9a441",
            borderRadius: 999,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
