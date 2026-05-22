import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeadFunnelChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'];

export default function LeadFunnelChart({ data }: LeadFunnelChartProps) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
