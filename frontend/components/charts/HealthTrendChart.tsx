import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface HealthTrendChartProps {
  data: { date: string; healthScore: number; securityScore: number; performanceScore: number }[];
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} domain={[60, 100]} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="healthScore" name="Overall Health" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#healthGrad)" />
          <Area type="monotone" dataKey="securityScore" name="Security Score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#secGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
