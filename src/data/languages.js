// Shared between CodeEditor.jsx (language dropdown) and ProblemDetail.jsx
// (submission history display) so the two never drift out of sync.
export const LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

export function labelForLanguage(id) {
  return LANGUAGES.find((lang) => lang.id === id)?.label || id
}
