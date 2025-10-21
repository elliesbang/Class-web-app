import { CSSProperties, ReactElement, ReactNode } from 'react';

type ResponsiveContainerProps = {
  width?: string | number;
  height?: number;
  children: ReactNode;
};

export const ResponsiveContainer = ({ width = '100%', height = 300, children }: ResponsiveContainerProps) => {
  const containerStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height,
  };

  return (
    <div className="relative" style={containerStyle}>
      <div className="absolute inset-0 flex flex-col">{children}</div>
    </div>
  );
};

type XAxisProps = { dataKey?: string };
export const XAxis = (_props: XAxisProps) => null;

type YAxisProps = { dataKey?: string };
export const YAxis = (_props: YAxisProps) => null;

type CartesianGridProps = { strokeDasharray?: string; stroke?: string };
export const CartesianGrid = (_props: CartesianGridProps) => null;

export const Tooltip = (_props: unknown) => null;
export const Legend = (_props: unknown) => null;

type BarProps = {
  dataKey: string;
  fill?: string;
  radius?: [number, number, number, number];
};

export const Bar = (_props: BarProps) => null;

type BarChartProps = {
  data: Array<Record<string, number | string>>;
  children: ReactNode;
};

export const BarChart = ({ data, children }: BarChartProps) => {
  const barElements = (Array.isArray(children) ? children : [children]).filter(
    (child) => (child as ReactElement).type === Bar,
  ) as ReactElement<BarProps>[];

  const bar = barElements[0]?.props;

  if (!bar) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500">데이터가 없습니다.</div>;
  }

  const maxValue = Math.max(...data.map((item) => Number(item[bar.dataKey] ?? 0)), 1);

  return (
    <div className="flex h-full items-end justify-between gap-4 px-2 py-4">
      {data.map((item) => {
        const value = Number(item[bar.dataKey] ?? 0);
        const heightPercent = (value / maxValue) * 100;

        return (
          <div
            key={String(item.course ?? item.name ?? item.date ?? Math.random())}
            className="flex flex-1 flex-col items-center gap-3"
          >
            <div className="flex h-56 w-full items-end justify-center">
              <div
                className="w-10 rounded-t-lg"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: bar.fill ?? '#ffd331',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
            <span className="text-xs font-semibold text-[#5c5c5c]">{String(item.course ?? item.name)}</span>
            <span className="text-xs text-[#868686]">{value}%</span>
          </div>
        );
      })}
    </div>
  );
};

type LineProps = {
  dataKey: string;
  stroke?: string;
  strokeWidth?: number;
  dot?: { r?: number };
};

export const Line = (_props: LineProps) => null;

type LineChartProps = {
  data: Array<Record<string, number | string>>;
  children: ReactNode;
};

export const LineChart = ({ data, children }: LineChartProps) => {
  const lineElements = (Array.isArray(children) ? children : [children]).filter(
    (child) => (child as ReactElement).type === Line,
  ) as ReactElement<LineProps>[];
  const line = lineElements[0]?.props;

  if (!line) {
    return <div className="flex h-full items-center justify-center text-sm text-gray-500">데이터가 없습니다.</div>;
  }

  const points = data.map((item) => Number(item[line.dataKey] ?? 0));
  const maxValue = Math.max(...points, 1);
  const minValue = Math.min(...points, 0);
  const range = Math.max(maxValue - minValue, 1);

  const svgPoints = points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((value - minValue) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  const strokeColor = line.stroke ?? '#ffd331';
  const strokeWidth = line.strokeWidth ?? 2;
  const dotRadius = line.dot?.r ?? 3;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        points={svgPoints}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {svgPoints.split(' ').map((point) => {
        const [x, y] = point.split(',').map(Number);
        return <circle key={`${x}-${y}`} cx={x} cy={y} r={dotRadius} fill={strokeColor} />;
      })}
    </svg>
  );
};
