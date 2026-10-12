import { isTheme, type useTheme } from '../hooks/useTheme';

export default function ThemeSelector({ theme, setTheme, error }: ReturnType<typeof useTheme>) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme" className="text-sm text-stone-500">Theme</label>
      <select
        id="theme"
        value={theme}
        onChange={event => {
          if (isTheme(event.target.value)) setTheme(event.target.value);
        }}
        className="bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus-ring"
      >
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      {error && <span role="alert" className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
