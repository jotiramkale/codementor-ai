import { FiCpu } from 'react-icons/fi'
import EmptyState from '../components/ui/EmptyState.jsx'

function AiMentor() {
  return (
    <EmptyState
      icon={FiCpu}
      title="AI Mentor"
      description="A conversational AI mentor for concept explanations, hints, and study guidance will live here."
      phaseNote="Planned — Phase 12"
    />
  )
}

export default AiMentor
