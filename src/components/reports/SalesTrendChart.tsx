
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/currency';

const mockSalesData = [
  { date: '2024-01-01', sales: 12000 },
  { date: '2024-01-02', sales: 15000 },
  { date: '2024-01-03', sales: 18000 },
  { date: '2024-01-04', sales: 14000 },
  { date: '2024-01-05', sales: 22000 },
  { date: '2024-01-06', sales: 25000 },
  { date: '2024-01-07', sales: 28000 },
];

const SalesTrendChart = () => {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={mockSalesData}
          margin={{
            top: 20,
            right: 30,
            left: 60,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
            width={50}
          />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Sales']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#3b82f6',
              stroke: '#ffffff',
              strokeWidth: 2,
              style: { cursor: 'pointer' }
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesTrendChart;
