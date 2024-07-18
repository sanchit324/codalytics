import { Bar } from "react-chartjs-2";
export const BarChart = ({ chartData }) => {
  return (
    <>
        <div className="chart-container">
        <Bar
            data={chartData}
            options={{
              plugins: {
                  title: {
                    display: false,
                    text: "Contest Rating"
                  },
                  legend: {
                    display: true
                  }
              },
              scales: {
                x: {
                  ticks: {
                    display: true
                  }
                }
              }
            }}
        />
        </div>
    </>
  );
};