import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ScorePoint } from '../types';

interface ScoreChartProps {
  data: ScorePoint[];
  height?: number;
}

export default function ScoreChart({ data, height = 160 }: ScoreChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: '#475569', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            background: '#161D2B',
            border: '1px solid #1E2D3D',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#F8FAFC',
          }}
          itemStyle={{ color: '#8B7CFF' }}
          labelStyle={{ color: '#94A3B8' }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#8B7CFF"
          strokeWidth={2}
          dot={{ fill: '#8B7CFF', r: 3, strokeWidth: 0 }}
          activeDot={{ fill: '#8B7CFF', r: 5, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
