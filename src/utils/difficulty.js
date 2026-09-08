const DIFFICULTY_TONES = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
}

const DIFFICULTY_BAR_COLORS = {
  Easy: 'bg-emerald-400',
  Medium: 'bg-yellow-400',
  Hard: 'bg-red-400',
}

export function toneForDifficulty(difficulty) {
  return DIFFICULTY_TONES[difficulty] || 'neutral'
}

export function barColorForDifficulty(difficulty) {
  return DIFFICULTY_BAR_COLORS[difficulty] || 'bg-zinc-500'
}
