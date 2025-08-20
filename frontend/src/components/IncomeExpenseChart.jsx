import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMoney } from '../utils.js'; // FIX: Use formatMoney

function IncomeExpenseChart({ title, data, t }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (data && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.month),
          datasets: [
            { label: t.income, data: data.map(d => d.income), backgroundColor: 'rgba(75, 192, 192, 0.6)' },
            { label: t.expenses, data: data.map(d => d.expenses), backgroundColor: 'rgba(255, 99, 132, 0.6)' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } },
          // FIX: Use formatMoney in the tooltip
          plugins: { tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatMoney(context.parsed.y)}` } } }
        }
      });
    }
  }, [data, t]);

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
      <div className="relative h-64">
        {!data && <p>Loading chart...</p>}
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;