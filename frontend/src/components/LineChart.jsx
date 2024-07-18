import { Line } from "react-chartjs-2";
import ChartZoom from 'chartjs-plugin-zoom';

export const LineChart = ({ chartData }) => {
  return (
    <div className="chart-container">
      <Line
        data={chartData}
        options={{
          plugins: {
            title: {
              display: false,
              text: "Contest Rating"
            },
            legend: {
              display: true
            },
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: 'x',
              }
            }
          },
          scales: {
            x: {
              ticks: {
                display: false
              }
            }
          }
        }}
        plugins={[ChartZoom]} 
      />
    </div>
  );
};
