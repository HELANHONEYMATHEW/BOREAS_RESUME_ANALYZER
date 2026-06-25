import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, Area, AreaChart, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const BAR_DATA = [
  { range: '10-20', count: 12 }, { range: '21-30', count: 18 }, { range: '31-40', count: 28 },
  { range: '41-50', count: 35 }, { range: '51-60', count: 48 }, { range: '61-70', count: 64 },
  { range: '71-80', count: 58 }, { range: '81-90', count: 42 }, { range: '91-100', count: 27 },
];

const LINE_DATA = [
  { month: 'Jan', apps: 12 }, { month: 'Feb', apps: 18 }, { month: 'Mar', apps: 15 },
  { month: 'Apr', apps: 32 }, { month: 'May', apps: 45 }, { month: 'Jun', apps: 67 },
];

const PIE_DATA = [
  { name: 'Applied', value: 247, color: '#7C3AED' },
  { name: 'Reviewed', value: 143, color: '#38BDF8' },
  { name: 'Interview', value: 38, color: '#F59E0B' },
  { name: 'Hired', value: 9, color: '#10B981' },
];

const tooltipStyle = { background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#F1F5F9' };

export function MatchScoreChart() {
  const getColor = (v) => v.range.startsWith('8') || v.range.startsWith('9') ? '#10B981' : v.range.startsWith('6') || v.range.startsWith('7') ? '#F59E0B' : '#7C3AED';
  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={BAR_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 9, fill: '#64748B' }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {BAR_DATA.map((entry, i) => <Cell key={i} fill={getColor(entry)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ApplicationsChart() {
  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={LINE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748B' }} />
        <YAxis tick={{ fontSize: 9, fill: '#64748B' }} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#334155' }} />
        <Area type="monotone" dataKey="apps" stroke="#7C3AED" strokeWidth={2} fill="url(#areaGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function PipelinePieChart() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
      <PieChart width={140} height={140}>
        <Pie data={PIE_DATA} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="value" stroke="none">
          {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
      </PieChart>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PIE_DATA.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--text2)' }}>{d.name}</span>
            <strong style={{ marginLeft: 'auto', color: 'var(--text)', minWidth: 30, textAlign: 'right' }}>{d.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
