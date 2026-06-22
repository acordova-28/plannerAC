interface Props {
  x:      number
  height: number
}

export default function GanttTodayLine({ x, height }: Props) {
  return (
    <g>
      <rect x={x - 1} y={0} width={2} height={height} fill="#ef4444" opacity={0.7} />
      <polygon points={`${x - 5},0 ${x + 5},0 ${x},9`} fill="#ef4444" opacity={0.85} />
    </g>
  )
}
