import { FiUser } from 'react-icons/fi'
import EmptyState from '../components/ui/EmptyState.jsx'

function Profile() {
  return (
    <EmptyState
      icon={FiUser}
      title="Profile"
      description="Account details and (once Phase 3 auth exists) real session info will live here."
      phaseNote="Planned — later phase"
    />
  )
}

export default Profile
