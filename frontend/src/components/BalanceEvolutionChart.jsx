import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { formatMoney } from '../utils.js';

function BalanceEvolutionChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0 && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy();
      
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.date),
          datasets: [{
            label: 'Total Balance',
            data: data.map(d => d.cumulative_balance),
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.5)',
            fill: true,
            tension: 0.1
          }]
        },
        options: {
          responsive: true, 
          maintainAspectRatio: false, // This is key to allowing vertical stretching
          scales: { x: { ticks: { maxRotation: 0, minRotation: 0, autoSkip: true, maxTicksLimit: 7 } } },
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `Balance: ${formatMoney(context.parsed.y)}` } } }
        }
      });
    } else if (chartInstance.current) {
      chartInstance.current.destroy();
    }
  }, [data]);

  return (
    // Removed fixed height (h-64) to allow this container to be flexible
    <div className="relative h-full">
      {(!data || data.length === 0) && <p className="text-center text-gray-500 pt-8">No data to display.</p>}
      <canvas ref={chartRef}></canvas>
    </div>
  );
}

export default BalanceEvolutionChart;