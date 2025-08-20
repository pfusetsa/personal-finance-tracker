import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatCurrency } from '../utils.js';

function RecurrentChart({ data, isLoading, error, t }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (data && chartRef.current) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.category),
          datasets: [
            { label: t.income, data: data.map(d => d.income), backgroundColor: 'rgba(75, 192, 192, 0.6)' },
            { label: t.expenses, data: data.map(d => d.expenses), backgroundColor: 'rgba(255, 99, 132, 0.6)' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
          plugins: { tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}` } } }
        }
      });
    }
  }, [data, t]);

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{t.recurrentTransactions}</h2>
      <div className="relative h-64">
        {isLoading && <p>Loading chart...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default RecurrentChart;