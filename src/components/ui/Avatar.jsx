function initialsFrom(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

// No real accounts exist until Phase 3, so this always renders a
// placeholder identity — never invented personal data.
function Avatar({ name = 'Guest Student', size = 32 }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-400/15 font-display font-semibold text-indigo-300"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initialsFrom(name)}
    </div>
  )
}

export default Avatar
