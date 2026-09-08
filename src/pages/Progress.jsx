import { FiTrendingUp } from 'react-icons/fi'
import EmptyState from '../components/ui/EmptyState.jsx'

function ProgressPage() {
  return (
    <EmptyState
      icon={FiTrendingUp}
      title="Progress"
      description="Topic mastery, solving-time trends, and weak/strong areas will live here."
      phaseNote="Planned — Phase 16"
    />
  )
}

export default ProgressPage
