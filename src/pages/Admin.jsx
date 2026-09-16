import { useState } from 'react'
import { FiCpu, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi'
import Panel from '../components/ui/Panel.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import FilterChip from '../components/ui/FilterChip.jsx'
import { toneForDifficulty } from '../utils/difficulty.js'
import { DIFFICULTIES, TOPICS, DEFAULT_STARTER_CODE } from '../data/problemsMockData.js'
import { getProblems, createProblem, updateProblem, deleteProblem } from '../data/problemStore.js'
import {
  listKnowledgeEntries,
  addKnowledgeEntry,
  updateKnowledgeEntry,
  deleteKnowledgeEntry,
  KNOWLEDGE_DOMAINS,
} from '../services/ragService.js'
import { generateProblemDraft } from '../services/aiService.js'

const STARTER_CODE_LANGUAGES = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

function emptyProblemForm() {
  return {
    title: '',
    difficulty: 'Easy',
    topic: TOPICS[0],
    estimatedTime: '15m',
    description: '',
    expectedInput: '',
    expectedOutput: '',
    examples: [{ input: '', output: '', explanation: '' }],
    constraints: [''],
    hints: [''],
    starterCode: { ...DEFAULT_STARTER_CODE },
    testCases: [{ input: '', expectedOutput: '', hidden: false }],
  }
}

function emptyKnowledgeForm() {
  return { domain: KNOWLEDGE_DOMAINS[0], title: '', content: '', keywords: '' }
}

// Phase 18: admin-only (see AdminRoute.jsx + navigation.js's
// requiresAdmin flag). Problem CRUD writes through problemStore.js and
// knowledge CRUD through ragService.js's exported functions — both
// genuinely mutable stores (Phase 18 also converted them from static
// consts), so changes made here actually show up on Problems,
// ProblemDetail, Interview Mode, and the AI Mentor's retrieval in the
// same session. There's no live-push subscription, so a page already
// open elsewhere won't refresh instantly — navigating to it will.
function Admin() {
  const [, setRefreshTick] = useState(0)
  function bumpRefresh() {
    setRefreshTick((n) => n + 1)
  }

  const [tab, setTab] = useState('problems') // 'problems' | 'knowledge'

  // --- Problems ---
  const [problemView, setProblemView] = useState('list') // 'list' | 'form'
  const [editingProblemId, setEditingProblemId] = useState(null)
  const [problemForm, setProblemForm] = useState(emptyProblemForm())
  const [isGenerating, setIsGenerating] = useState(false)
  const [genTopic, setGenTopic] = useState('')
  const [genDifficulty, setGenDifficulty] = useState('')

  const problems = getProblems()

  function startCreateProblem() {
    setEditingProblemId(null)
    setProblemForm(emptyProblemForm())
    setProblemView('form')
  }

  function startEditProblem(problem) {
    setEditingProblemId(problem.id)
    setProblemForm({
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topic,
      estimatedTime: problem.estimatedTime,
      description: problem.description || '',
      expectedInput: problem.expectedInput || '',
      expectedOutput: problem.expectedOutput || '',
      examples: problem.examples?.length ? problem.examples : [{ input: '', output: '', explanation: '' }],
      constraints: problem.constraints?.length ? problem.constraints : [''],
      hints: problem.hints?.length ? problem.hints : [''],
      starterCode: problem.starterCode || { ...DEFAULT_STARTER_CODE },
      testCases: problem.testCases?.length ? problem.testCases : [{ input: '', expectedOutput: '', hidden: false }],
    })
    setProblemView('form')
  }

  function handleDeleteProblem(id) {
    deleteProblem(id)
    bumpRefresh()
  }

  function updateExample(index, field, value) {
    setProblemForm((prev) => {
      const examples = [...prev.examples]
      examples[index] = { ...examples[index], [field]: value }
      return { ...prev, examples }
    })
  }
  function addExample() {
    setProblemForm((prev) => ({ ...prev, examples: [...prev.examples, { input: '', output: '', explanation: '' }] }))
  }
  function removeExample(index) {
    setProblemForm((prev) => ({ ...prev, examples: prev.examples.filter((_, i) => i !== index) }))
  }

  function updateListField(field, index, value) {
    setProblemForm((prev) => {
      const list = [...prev[field]]
      list[index] = value
      return { ...prev, [field]: list }
    })
  }
  function addListField(field) {
    setProblemForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }))
  }
  function removeListField(field, index) {
    setProblemForm((prev) => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }))
  }

  function updateTestCase(index, field, value) {
    setProblemForm((prev) => {
      const testCases = [...prev.testCases]
      testCases[index] = { ...testCases[index], [field]: value }
      return { ...prev, testCases }
    })
  }
  function addTestCase() {
    setProblemForm((prev) => ({ ...prev, testCases: [...prev.testCases, { input: '', expectedOutput: '', hidden: false }] }))
  }
  function removeTestCase(index) {
    setProblemForm((prev) => ({ ...prev, testCases: prev.testCases.filter((_, i) => i !== index) }))
  }

  function updateStarterCode(lang, value) {
    setProblemForm((prev) => ({ ...prev, starterCode: { ...prev.starterCode, [lang]: value } }))
  }

  async function handleGenerate() {
    setIsGenerating(true)
    try {
      const result = await generateProblemDraft({ topic: genTopic || undefined, difficulty: genDifficulty || undefined })
      setProblemForm({
        ...emptyProblemForm(),
        ...result.draft,
        starterCode: { ...DEFAULT_STARTER_CODE },
        testCases: [{ input: '', expectedOutput: '', hidden: false }],
      })
      setEditingProblemId(null)
      setProblemView('form')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleSaveProblem(e) {
    e.preventDefault()
    const payload = {
      ...problemForm,
      constraints: problemForm.constraints.filter((c) => c.trim() !== ''),
      hints: problemForm.hints.filter((h) => h.trim() !== ''),
      examples: problemForm.examples.filter((ex) => ex.input.trim() !== '' || ex.output.trim() !== ''),
      testCases: problemForm.testCases.filter((tc) => tc.input.trim() !== '' || tc.expectedOutput.trim() !== ''),
    }
    if (editingProblemId) {
      updateProblem(editingProblemId, payload)
    } else {
      createProblem(payload)
    }
    bumpRefresh()
    setProblemView('list')
  }

  // --- Knowledge base ---
  const [knowledgeView, setKnowledgeView] = useState('list')
  const [editingKnowledgeId, setEditingKnowledgeId] = useState(null)
  const [knowledgeForm, setKnowledgeForm] = useState(emptyKnowledgeForm())

  const knowledgeEntries = listKnowledgeEntries()

  function startCreateKnowledge() {
    setEditingKnowledgeId(null)
    setKnowledgeForm(emptyKnowledgeForm())
    setKnowledgeView('form')
  }

  function startEditKnowledge(entry) {
    setEditingKnowledgeId(entry.id)
    setKnowledgeForm({ domain: entry.domain, title: entry.title, content: entry.content, keywords: entry.keywords.join(', ') })
    setKnowledgeView('form')
  }

  function handleDeleteKnowledge(id) {
    deleteKnowledgeEntry(id)
    bumpRefresh()
  }

  function handleSaveKnowledge(e) {
    e.preventDefault()
    const keywords = knowledgeForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
    const payload = { domain: knowledgeForm.domain, title: knowledgeForm.title, content: knowledgeForm.content, keywords }
    if (editingKnowledgeId) {
      updateKnowledgeEntry(editingKnowledgeId, payload)
    } else {
      addKnowledgeEntry(payload)
    }
    bumpRefresh()
    setKnowledgeView('list')
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-50">Admin</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Visible only to admin accounts — students never see this nav item or page, and are redirected
          if they visit this URL directly.
        </p>
      </header>

      <div className="mb-4 flex gap-2">
        <FilterChip label="Problems" isActive={tab === 'problems'} onClick={() => setTab('problems')} />
        <FilterChip label="Knowledge Base" isActive={tab === 'knowledge'} onClick={() => setTab('knowledge')} />
      </div>

      {tab === 'problems' && problemView === 'list' && (
        <div className="flex flex-col gap-4">
          <Panel title="Generate a problem draft with AI" action={<Badge tone="ai">AI</Badge>}>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Topic (optional)</label>
                <select
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200"
                >
                  <option value="">Random</option>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Difficulty (optional)</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200"
                >
                  <option value="">Medium (default)</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="ai" onClick={handleGenerate} disabled={isGenerating}>
                <FiCpu className="h-4 w-4" /> {isGenerating ? 'Generating…' : 'Generate draft'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-zinc-600">
              Produces a deliberately rough draft (placeholder example, constraint, hint) — the point is
              that you review and rewrite it before publishing, not rubber-stamp something already
              finished. No real AI is connected yet (Phase 22).
            </p>
          </Panel>

          <Panel
            title={`Problems (${problems.length})`}
            action={
              <Button onClick={startCreateProblem}>
                <FiPlus className="h-4 w-4" /> New problem
              </Button>
            }
          >
            <div className="flex flex-col divide-y divide-zinc-800">
              {problems.map((problem) => (
                <div key={problem.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-zinc-200">{problem.title}</span>
                      <Badge tone={toneForDifficulty(problem.difficulty)}>{problem.difficulty}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500">{problem.topic}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEditProblem(problem)}
                      aria-label={`Edit ${problem.title}`}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                    >
                      <FiEdit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProblem(problem.id)}
                      aria-label={`Delete ${problem.title}`}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-red-400/10 hover:text-red-300"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'problems' && problemView === 'form' && (
        <form onSubmit={handleSaveProblem}>
          <Panel title={editingProblemId ? 'Edit problem' : 'New problem'}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Title</label>
                  <input
                    required
                    value={problemForm.title}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Estimated time</label>
                  <input
                    value={problemForm.estimatedTime}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, estimatedTime: e.target.value }))}
                    placeholder="15m"
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Difficulty</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Topic</label>
                  <select
                    value={problemForm.topic}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, topic: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                  >
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Description</label>
                <textarea
                  rows={3}
                  value={problemForm.description}
                  onChange={(e) => setProblemForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Expected input</label>
                  <textarea
                    rows={2}
                    value={problemForm.expectedInput}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, expectedInput: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Expected output</label>
                  <textarea
                    rows={2}
                    value={problemForm.expectedOutput}
                    onChange={(e) => setProblemForm((prev) => ({ ...prev, expectedOutput: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs text-zinc-500">Examples</label>
                  <button type="button" onClick={addExample} className="text-xs text-indigo-400 hover:text-indigo-300">
                    + Add example
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {problemForm.examples.map((example, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border border-zinc-800 p-2.5 sm:grid-cols-3">
                      <input
                        value={example.input}
                        onChange={(e) => updateExample(index, 'input', e.target.value)}
                        placeholder="Input"
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                      />
                      <input
                        value={example.output}
                        onChange={(e) => updateExample(index, 'output', e.target.value)}
                        placeholder="Output"
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          value={example.explanation}
                          onChange={(e) => updateExample(index, 'explanation', e.target.value)}
                          placeholder="Explanation (optional)"
                          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                        />
                        {problemForm.examples.length > 1 && (
                          <button type="button" onClick={() => removeExample(index)} className="shrink-0 text-zinc-500 hover:text-red-300">
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {['constraints', 'hints'].map((field) => (
                <div key={field}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs capitalize text-zinc-500">{field}</label>
                    <button type="button" onClick={() => addListField(field)} className="text-xs text-indigo-400 hover:text-indigo-300">
                      + Add {field === 'constraints' ? 'constraint' : 'hint'}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {problemForm[field].map((value, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <input
                          value={value}
                          onChange={(e) => updateListField(field, index, e.target.value)}
                          className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100"
                        />
                        {problemForm[field].length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeListField(field, index)}
                            className="shrink-0 text-zinc-500 hover:text-red-300"
                          >
                            <FiTrash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Starter code</label>
                <div className="flex flex-col gap-2">
                  {STARTER_CODE_LANGUAGES.map((lang) => (
                    <div key={lang.id}>
                      <p className="mb-1 text-xs text-zinc-600">{lang.label}</p>
                      <textarea
                        rows={3}
                        value={problemForm.starterCode[lang.id] || ''}
                        onChange={(e) => updateStarterCode(lang.id, e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs text-zinc-500">
                    Test cases (architecture only — not yet consumed by the mock execution engine; see
                    Phase 21)
                  </label>
                  <button type="button" onClick={addTestCase} className="text-xs text-indigo-400 hover:text-indigo-300">
                    + Add test case
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {problemForm.testCases.map((testCase, index) => (
                    <div key={index} className="grid gap-2 rounded-lg border border-zinc-800 p-2.5 sm:grid-cols-4">
                      <input
                        value={testCase.input}
                        onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                        placeholder="Input"
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 sm:col-span-1"
                      />
                      <input
                        value={testCase.expectedOutput}
                        onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                        placeholder="Expected output"
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-100 sm:col-span-1"
                      />
                      <label className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <input
                          type="checkbox"
                          checked={testCase.hidden}
                          onChange={(e) => updateTestCase(index, 'hidden', e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-400"
                        />
                        Hidden
                      </label>
                      {problemForm.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTestCase(index)}
                          className="justify-self-start text-zinc-500 hover:text-red-300"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingProblemId ? 'Save changes' : 'Create problem'}</Button>
                <Button type="button" variant="secondary" onClick={() => setProblemView('list')}>
                  Cancel
                </Button>
              </div>
            </div>
          </Panel>
        </form>
      )}

      {tab === 'knowledge' && knowledgeView === 'list' && (
        <Panel
          title={`RAG knowledge entries (${knowledgeEntries.length})`}
          action={
            <Button onClick={startCreateKnowledge}>
              <FiPlus className="h-4 w-4" /> New entry
            </Button>
          }
        >
          <div className="flex flex-col divide-y divide-zinc-800">
            {knowledgeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-zinc-200">{entry.title}</span>
                    <Badge tone="neutral">{entry.domain}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{entry.source}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditKnowledge(entry)}
                    aria-label={`Edit ${entry.title}`}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteKnowledge(entry.id)}
                    aria-label={`Delete ${entry.title}`}
                    className="rounded-lg p-2 text-zinc-400 hover:bg-red-400/10 hover:text-red-300"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'knowledge' && knowledgeView === 'form' && (
        <form onSubmit={handleSaveKnowledge}>
          <Panel title={editingKnowledgeId ? 'Edit knowledge entry' : 'New knowledge entry'}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Domain</label>
                  <select
                    value={knowledgeForm.domain}
                    onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, domain: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200"
                  >
                    {KNOWLEDGE_DOMAINS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-zinc-500">Title</label>
                  <input
                    required
                    value={knowledgeForm.title}
                    onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Content</label>
                <textarea
                  required
                  rows={4}
                  value={knowledgeForm.content}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-zinc-500">Keywords (comma-separated)</label>
                <input
                  value={knowledgeForm.keywords}
                  onChange={(e) => setKnowledgeForm((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="two pointer, two pointers"
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-600">
                  Used by the AI Mentor's keyword retriever (Phase 13) to decide when this entry is
                  relevant to a question.
                </p>
              </div>

              <div className="rounded-lg border border-dashed border-zinc-800 p-2.5 text-xs text-zinc-500">
                Source is always set to "CodeMentor AI knowledge base (demo entry)" — this form
                deliberately doesn't let you type a citation to an external book or site, so it can't
                become a way around the "no fake citations" rule this feature was built around.
              </div>

              <div className="flex gap-2">
                <Button type="submit">{editingKnowledgeId ? 'Save changes' : 'Add entry'}</Button>
                <Button type="button" variant="secondary" onClick={() => setKnowledgeView('list')}>
                  Cancel
                </Button>
              </div>
            </div>
          </Panel>
        </form>
      )}
    </div>
  )
}

export default Admin
