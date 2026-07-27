import React, { useCallback, useEffect, useRef } from "react";
import { generateCaptchaText } from "../Utils/captchaUtils";

const CANVAS_WIDTH = 150;
const CANVAS_HEIGHT = 48;

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
  </svg>
);

// Renders a distorted text challenge onto a <canvas>. The generated answer is
// reported up via onAnswerChange; the typed answer is a controlled value/onChange.
// POC (frontend-only) — see Utils/captchaUtils.js for the backend swap points.
const ImageCaptcha = ({ t, value, onChange, onAnswerChange, error }) => {
  const canvasRef = useRef(null);

  const draw = useCallback((text) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;

    // Scale for crisp rendering on high-DPI screens.
    canvas.width = CANVAS_WIDTH * ratio;
    canvas.height = CANVAS_HEIGHT * ratio;
    canvas.style.width = `${CANVAS_WIDTH}px`;
    canvas.style.height = `${CANVAS_HEIGHT}px`;
    ctx.scale(ratio, ratio);

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#f4f4f7";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Noise lines.
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(0,126,126,${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT);
      ctx.lineTo(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT);
      ctx.stroke();
    }

    // Noise dots.
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `rgba(139,141,152,${Math.random() * 0.5})`;
      ctx.beginPath();
      ctx.arc(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, Math.random() * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Characters, each jittered and rotated slightly.
    const step = CANVAS_WIDTH / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
      const fontSize = 24 + Math.floor(Math.random() * 6);
      ctx.save();
      ctx.font = `700 ${fontSize}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
      ctx.fillStyle = `hsl(${Math.floor(Math.random() * 40) + 175}, 45%, ${20 + Math.floor(Math.random() * 20)}%)`;
      ctx.textBaseline = "middle";
      const x = step * (i + 1);
      const y = CANVAS_HEIGHT / 2 + (Math.random() * 8 - 4);
      ctx.translate(x, y);
      ctx.rotate((Math.random() * 40 - 20) * (Math.PI / 180));
      ctx.fillText(text[i], -fontSize / 3, 0);
      ctx.restore();
    }
  }, []);

  const regenerate = useCallback(() => {
    const text = generateCaptchaText();
    onAnswerChange(text);
    draw(text);
  }, [draw, onAnswerChange]);

  // Generate a fresh challenge when the widget mounts.
  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="login-v2-field">
      <label className="login-v2-label" htmlFor="login-v2-captcha">
        {t("CS_CAPTCHA_LABEL")}
      </label>
      <div className="login-v2-captcha-row">
        <canvas ref={canvasRef} className="login-v2-captcha-canvas" aria-hidden="true" />
        <button
          type="button"
          className="login-v2-captcha-refresh"
          aria-label={t("CS_CAPTCHA_REFRESH")}
          title={t("CS_CAPTCHA_REFRESH")}
          onClick={() => {
            onChange("");
            regenerate();
          }}
        >
          <RefreshIcon />
        </button>
      </div>
      <input
        id="login-v2-captcha"
        className={`login-v2-input ${error ? "login-v2-err" : ""}`}
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        placeholder={t("CS_ENTER_CAPTCHA")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <div className="login-v2-error-text">{t("CS_CAPTCHA_INCORRECT")}</div>}
    </div>
  );
};

export default ImageCaptcha;
