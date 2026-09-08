import { FiAward } from 'react-icons/fi'
import EmptyState from '../components/ui/EmptyState.jsx'

function Interview() {
  return (
    <EmptyState
      icon={FiAward}
      title="Interview Mode"
      description="Timed mock interviews with an AI interviewer and a performance summary will live here."
      phaseNote="Planned — Phase 17"
    />
  )
}

export default Interview
