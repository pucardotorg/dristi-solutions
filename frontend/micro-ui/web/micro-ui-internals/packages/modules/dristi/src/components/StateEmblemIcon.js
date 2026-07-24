import React from "react";

const StateEmblemIcon = ({ className, width = 48, height = 56 }) => (
  <svg
    className={className}
    width={width}
    height={height}
    viewBox="0 0 64 74"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="State Emblem of India"
  >
    <path d="M32 2c2.2 0 4 2.2 4 5 0 1.6-.6 3-1.5 3.9 2.4.5 4.2 2.5 4.2 4.9 0 .7-.15 1.35-.4 1.95C41.5 16.9 44 18.2 44 20.4c0 1-.5 1.9-1.3 2.5H21.3c-.8-.6-1.3-1.5-1.3-2.5 0-2.2 2.5-3.5 5.7-2.65-.25-.6-.4-1.25-.4-1.95 0-2.4 1.8-4.4 4.2-4.9C28.6 10 28 8.6 28 7c0-2.8 1.8-5 4-5Z" />
    <path d="M18 23.5c-1.3 1-2.4 2.3-2.4 3.9 0 .5.1.95.3 1.35h32.2c.2-.4.3-.85.3-1.35 0-1.6-1.1-2.9-2.4-3.9H18Z" />
    <rect x="14" y="29.4" width="36" height="4.2" rx="1" />
    <rect x="17.5" y="34.4" width="29" height="3.4" rx="1" />
    <g>
      <circle cx="32" cy="45.6" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="45.6" r="1.5" />
      <g stroke="currentColor" strokeWidth="1">
        <line x1="32" y1="38.4" x2="32" y2="52.8" />
        <line x1="24.8" y1="45.6" x2="39.2" y2="45.6" />
        <line x1="26.9" y1="40.5" x2="37.1" y2="50.7" />
        <line x1="37.1" y1="40.5" x2="26.9" y2="50.7" />
        <line x1="28.6" y1="39.1" x2="35.4" y2="52.1" />
        <line x1="35.4" y1="39.1" x2="28.6" y2="52.1" />
        <line x1="38.5" y1="42.2" x2="25.5" y2="49" />
        <line x1="25.5" y1="42.2" x2="38.5" y2="49" />
      </g>
    </g>
    <path d="M22 53h20l-2.4 5H24.4L22 53Z" />
    <text x="32" y="67" textAnchor="middle" fontSize="6.4" fontWeight="700" letterSpacing=".3" fill="currentColor" fontFamily="Helvetica,Arial,sans-serif">
      सत्यमेव जयते
    </text>
  </svg>
);

export default StateEmblemIcon;
