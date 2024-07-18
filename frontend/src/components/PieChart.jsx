import { Pie } from "react-chartjs-2";

export const PieChart = ({chartData}) => {
    return(
        <>
            <div className="chart-container">
                <Pie
                    data={chartData}
                    options={{
                      plugins: {
                          title: {
                            display: true,
                            text: "Contest Rating"
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