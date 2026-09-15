'use client';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  function toggle() {
    const isDark = resolvedTheme ? resolvedTheme === 'dark' : document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'light' : 'dark');
  }
  // Both icons are rendered on the server. CSS follows the early theme script,
  // avoiding a mismatched icon or hydration warning on a saved dark preference.
  return <button type="button" className="theme-toggle" onClick={toggle} title="Zwischen Hell und Dunkel wechseln">
    <span className="theme-to-dark"><Moon size={18} aria-hidden="true" /><span className="sr-only">Dunkelmodus aktivieren</span></span>
    <span className="theme-to-light"><Sun size={18} aria-hidden="true" /><span className="sr-only">Hellmodus aktivieren</span></span>
  </button>;
}
