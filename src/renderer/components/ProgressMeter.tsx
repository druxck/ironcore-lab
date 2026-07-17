interface ProgressMeterProps {
  label: string
  pct: number
  accentColor?: string
}

export default function ProgressMeter({ label, pct, accentColor }: ProgressMeterProps): JSX.Element {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs text-lab-phosphorDim">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-lab-wire">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: accentColor ?? '#39ff88' }}
        />
      </div>
    </div>
  )
}
