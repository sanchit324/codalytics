import { Doughnut } from "react-chartjs-2";

export const DoughnutChart = ({chartData}) => {
    return(
        <>
            <div className="chart-container">
                <Doughnut
                    data={chartData}
                    options={{
                      plugins: {
                          title: {
                            display: false,
                            text: "Problem Tags"
                          },
                          legend: {
                            display: true
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
                />
            </div>
        </>
    )
}