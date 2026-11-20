// Gráficos ficam fora do índice de `ui`: quem usa importa daqui, e o ECharts (pesado) só carrega
// com as telas que desenham gráficos.
export { AppChart } from './chart/AppChart';
export { AppBarChart, AppDonutChart, AppLineChart, type DonutSlice } from './chart/charts';
