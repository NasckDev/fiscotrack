import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

// Só o que o app usa: barras, linha e rosca, com renderizador SVG (nítido e leve).
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  AriaComponent,
  SVGRenderer,
]);

export { echarts };
