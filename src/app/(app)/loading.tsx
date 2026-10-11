/** Shown while a screen loads: the layout's shape, not a spinner. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-3.5 w-32 rounded bg-surface-2" />
        <div className="h-7 w-56 rounded bg-surface-2" />
      </div>
      <div className="h-56 rounded-xl bg-surface" />
      <div className="flex flex-col gap-3">
        <div className="h-3.5 w-40 rounded bg-surface-2" />
        <div className="h-24 rounded-xl bg-surface" />
        <div className="h-24 rounded-xl bg-surface" />
      </div>
    </div>
  );
}
