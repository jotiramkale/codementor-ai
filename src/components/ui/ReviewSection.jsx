// Renders one labeled section of an AI review (Overall Assessment, Bug
// Analysis, etc.). Skips rendering entirely if there's no content yet,
// so a partially-loaded review never shows empty headings.
function ReviewSection({ title, content }) {
  if (!content) return null

  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-200">{title}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{content}</p>
    </div>
  )
}

export default ReviewSection
