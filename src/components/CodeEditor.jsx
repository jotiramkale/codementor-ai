import Editor from '@monaco-editor/react'
import { LANGUAGES } from '../data/languages.js'

// Monaco's built-in theme ids — 'light' is NOT one of them, it's 'vs'.
const THEMES = [
  { id: 'vs-dark', label: 'Dark' },
  { id: 'vs', label: 'Light' },
]

/**
 * Phase 7: real Monaco editor, replacing Phase 6's plain textarea.
 * Phase 8: made a controlled component (language/theme/code all come
 * from props) so ProblemDetail can read the current code when Run/
 * Submit are clicked, rather than this component hiding that state.
 *
 * Loads Monaco from a CDN by default (via @monaco-editor/react's
 * built-in loader) rather than bundling it locally — the standard,
 * well-documented way to use this package with Vite. That means the
 * browser needs internet access the first time it loads the editor.
 */
function CodeEditor({ language, onLanguageChange, theme, onThemeChange, code, onCodeChange, onReset }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-400"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>

        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 focus:border-indigo-400"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          Reset code
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <Editor
          height="420px"
          language={language}
          theme={theme}
          value={code}
          onChange={(value) => onCodeChange(value ?? '')}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditor
