export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C8 8 5 11.5 5 15a7 7 0 0 0 14 0c0-3.500-3-7-7-13z" fill="var(--rose)" />
      <path d="M9 15a3 3 0 0 0 3 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
