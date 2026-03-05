import type { WeightRecord } from '../../types/workout';

interface ProgressChartProps {
  data: WeightRecord[];
}

export const ProgressChart = ({ data }: ProgressChartProps) => {
  const width = 300;
  const height = 120;
  const padding = 20;

  const minWeight = Math.min(...data.map((d) => d.weight)) - 1;
  const maxWeight = Math.max(...data.map((d) => d.weight)) + 1;

  const getCoordinates = (index: number, value: number) => {
    const x = padding + index * ((width - padding * 2) / (data.length - 1));
    const y =
      height -
      padding -
      ((value - minWeight) / (maxWeight - minWeight)) * (height - padding * 2);

    return `${x},${y}`;
  };

  const pathD = `M ${data
    .map((d, i) => getCoordinates(i, d.weight))
    .join(' L ')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full overflow-visible"
    >
      <line
        x1={padding}
        y1={padding}
        x2={width - padding}
        y2={padding}
        stroke="#f4f4f5"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={height / 2}
        x2={width - padding}
        y2={height / 2}
        stroke="#f4f4f5"
        strokeWidth="1"
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="#f4f4f5"
        strokeWidth="1"
      />
      <path
        d={pathD}
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const [x, y] = getCoordinates(i, d.weight).split(',');

        return (
          <g key={`chart-pt-${i}`}>
            <circle
              cx={x}
              cy={y}
              r="4"
              fill="#10b981"
              stroke="white"
              strokeWidth="2"
            />
            {i === data.length - 1 && (
              <text
                x={Number(x) - 10}
                y={Number(y) - 15}
                fontSize="10"
                fill="#10b981"
                fontWeight="bold"
              >
                {d.weight}kg
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};
