export default function Label({ index, children, build = true }: { index?: string; children: string; build?: boolean }) {
  return (
    <p className="label" {...(build ? { 'data-build': 'Label' } : {})}>
      <span className="label__b">(</span>
      {index && (
        <>
          <span>{index}</span>
          <span className="label__dot">·</span>
        </>
      )}
      <span>{children}</span>
      <span className="label__b">)</span>
    </p>
  )
}
