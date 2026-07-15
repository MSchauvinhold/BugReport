/** Ícono de la app: un bug estilizado. Pensado para ir sobre el cuadrado índigo. */
export function BugLogo({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 4 11 7" />
      <path d="M14.5 4 13 7" />
      <rect x="7" y="7" width="10" height="13" rx="5" />
      <line x1="12" y1="8.5" x2="12" y2="18.5" />
      <path d="M7 10.5 4 9" />
      <path d="M6.7 13.6 3.8 13.6" />
      <path d="M7 16.7 4 18.2" />
      <path d="M17 10.5 20 9" />
      <path d="M17.3 13.6 20.2 13.6" />
      <path d="M17 16.7 20 18.2" />
    </svg>
  );
}
