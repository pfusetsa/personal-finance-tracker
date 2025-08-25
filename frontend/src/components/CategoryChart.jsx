import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMoney } from '../utils.js';

function CategoryChart({ title, data, t }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (data && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.category),
          datasets: [{
            // The chart visual is based on the absolute value
            data: data.map(d => Math.abs(d.total)),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#7BC225']
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right' },
            tooltip: {
              callbacks: {
                label: (context) => {
                  // Find the original data point to get the signed value
                  const originalDataPoint = data[context.dataIndex];
                  const signedAmount = originalDataPoint.total;
                  // Use our formatMoney function to show the correct sign and currency
                  return `${context.label}: ${formatMoney(signedAmount)}`;
                }
              }
            }
          }
        }
      });
    }
  }, [data]);

  return (
    <div className="bg-white shadow rounded-lg p-6 h-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
      <div className="relative h-64">
        {!data && <p>Loading chart...</p>}
        {data && data.length === 0 && <p className="text-center text-gray-500 pt-8">No data to display for this period.</p>}
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default CategoryChart;