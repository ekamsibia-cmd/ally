"use client";
export default function ThemeToggle() {
  const flip = () => {
    const dark = document.documentElement.dataset.theme === "dark" || (!document.documentElement.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("ally-theme", next); } catch {}
  };
  return <button className="tt" onClick={flip} aria-label="Switch light or dark mode" type="button">Light / dark</button>;
}
