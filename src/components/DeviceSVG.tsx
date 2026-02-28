interface DeviceSVGProps {
  part: string;
  width: number;
  height: number;
}

export function DeviceSVG({ part, width, height }: DeviceSVGProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 90 120">
      <rect
        x="5"
        y="5"
        width="80"
        height="110"
        fill="#f3f4f6"
        stroke="#9ca3af"
        strokeWidth="2"
        rx="4"
      />
      <text
        x="45"
        y="60"
        textAnchor="middle"
        fontSize="10"
        fill="#374151"
        fontWeight="600"
      >
        {part}
      </text>
    </svg>
  );
}
