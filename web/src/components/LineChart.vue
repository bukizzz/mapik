<script setup lang="ts">
import { getDashboardChart, getGroupList } from "@/api/dashboard";
import type { ChartData } from "@/types/models";
import { getGroupDisplayName } from "@/utils/display";
import { NSelect, NSpin } from "naive-ui";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Podaci grafikona
const chartData = ref<ChartData | null>(null);
const selectedGroup = ref<number | null>(null);
const loading = ref(true);
const animationProgress = ref(0);
const hoveredPoint = ref<{
  datasetIndex: number;
  pointIndex: number;
  x: number;
  y: number;
} | null>(null);
const tooltipData = ref<{
  time: string;
  datasets: Array<{
    label: string;
    value: number;
    color: string;
  }>;
} | null>(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const chartSvg = ref<SVGElement>();

// Dimenzije i margine grafikona
const chartWidth = 800;
const chartHeight = 260;
const padding = { top: 40, right: 40, bottom: 60, left: 80 };

// Formatiranje opcija grupe
const groupOptions = ref<Array<{ label: string; value: number | null }>>([]);

// Izračunaj efektivnu oblast crtanja
const plotWidth = chartWidth - padding.left - padding.right;
const plotHeight = chartHeight - padding.top - padding.bottom;

// Izračunaj maksimalne i minimalne vrednosti podataka
const dataRange = computed(() => {
  if (!chartData.value) {
    return { min: 0, max: 100 };
  }

  const allValues = chartData.value.datasets.flatMap(d => d.data);
  const max = Math.max(...allValues, 0);
  const min = Math.min(...allValues, 0);

  // Ako su svi podaci 0, postavi razuman opseg
  if (max === 0 && min === 0) {
    return { min: 0, max: 10 };
  }

  // Dodaj malo popunjavanja da grafikon izgleda bolje
  const paddingValue = Math.max((max - min) * 0.1, 1);
  return {
    min: Math.max(0, min - paddingValue),
    max: max + paddingValue,
  };
});

// Generiši oznake Y-ose
const yTicks = computed(() => {
  const { min, max } = dataRange.value;
  const range = max - min;
  const tickCount = 5;
  const step = range / (tickCount - 1);

  return Array.from({ length: tickCount }, (_, i) => min + i * step);
});

// Formatiraj vremenske oznake
const formatTimeLabel = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Generiši vidljive oznake X-ose (da bi se izbeglo preklapanje)
const visibleLabels = computed(() => {
  if (!chartData.value) {
    return [];
  }

  const labels = chartData.value.labels;
  const maxLabels = 8; // Prikaži najviše 8 oznaka
  const step = Math.ceil(labels.length / maxLabels);

  return labels
    .map((label, index) => ({ text: formatTimeLabel(label), index }))
    .filter((_, i) => i % step === 1);
});

// Funkcija za izračunavanje pozicije
const getXPosition = (index: number) => {
  if (!chartData.value) {
    return 0;
  }
  const totalPoints = chartData.value.labels.length;
  if (totalPoints <= 1) {
    return padding.left + plotWidth / 2;
  }
  return padding.left + (index / (totalPoints - 1)) * plotWidth;
};

const getYPosition = (value: number) => {
  const { min, max } = dataRange.value;
  const ratio = (value - min) / (max - min);
  return padding.top + (1 - ratio) * plotHeight;
};

// Pomoćna funkcija za pronalaženje segmenata podataka koji nisu nula (za popunjavanje oblasti)
const getSegments = (data: number[]) => {
  const segments: Array<Array<{ value: number; index: number }>> = [];
  let currentSegment: Array<{ value: number; index: number }> = [];

  data.forEach((value, index) => {
    if (value > 0) {
      currentSegment.push({ value, index });
    } else {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  });

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
};

// Generiši putanju linije (neprekidna linija, uključujući tačke sa vrednošću 0)
const generateLinePath = (data: number[]) => {
  if (data.length === 0) {
    return "";
  }

  // Pronađi prvu i poslednju poziciju vrednosti različite od nule
  let firstNonZeroIndex = -1;
  let lastNonZeroIndex = -1;

  for (let i = 0; i < data.length; i++) {
    if (data[i] > 0) {
      if (firstNonZeroIndex === -1) {
        firstNonZeroIndex = i;
      }
      lastNonZeroIndex = i;
    }
  }

  // Ako nema vrednosti različitih od nule, vrati praznu putanju
  if (firstNonZeroIndex === -1) {
    return "";
  }

  // Generiši neprekidnu putanju od prve do poslednje vrednosti različite od nule
  const pathCommands: string[] = [];

  for (let i = firstNonZeroIndex; i <= lastNonZeroIndex; i++) {
    const x = getXPosition(i);
    const y = getYPosition(data[i]);
    const command = i === firstNonZeroIndex ? "M" : "L";
    pathCommands.push(`${command} ${x},${y}`);
  }

  return pathCommands.join(" ");
};

// Generiši putanju oblasti popunjavanja (samo za oblasti sa podacima)
const generateAreaPath = (data: number[]) => {
  const segments = getSegments(data);
  const pathParts: string[] = [];
  const baseY = getYPosition(dataRange.value.min);

  segments.forEach(segment => {
    if (segment.length > 0) {
      const points = segment.map(p => ({
        x: getXPosition(p.index),
        y: getYPosition(p.value),
      }));
      const firstPoint = points[0];
      const lastPoint = points[points.length - 1];

      const lineCommands = points.map(p => `L ${p.x},${p.y}`).join(" ");

      pathParts.push(`M ${firstPoint.x},${baseY} ${lineCommands} L ${lastPoint.x},${baseY} Z`);
    }
  });

  return pathParts.join(" ");
};

// Formatiranje brojeva
const formatNumber = (value: number) => {
  // if (value >= 1000000) {
  //   return `${(value / 1000000).toFixed(1)}M`;
  // } else
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return Math.round(value).toString();
};

const isErrorDataset = (label: string) => {
  return label.includes(t("dashboard.chart.failed"));
};

// Povezano sa animacijom
const animatedStroke = ref("0");
const animatedOffset = ref("0");

const startAnimation = () => {
  if (!chartData.value) {
    return;
  }

  // Izračunaj ukupnu dužinu putanje (približno)
  const totalLength = plotWidth + plotHeight;
  animatedStroke.value = `${totalLength}`;
  animatedOffset.value = `${totalLength}`;

  let start = 0;
  const animate = (timestamp: number) => {
    if (!start) {
      start = timestamp;
    }
    const progress = Math.min((timestamp - start) / 1500, 1);

    animatedOffset.value = `${totalLength * (1 - progress)}`;
    animationProgress.value = progress;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };
  requestAnimationFrame(animate);
};

// Interakcija mišem
const handleMouseMove = (event: MouseEvent) => {
  if (!chartData.value || !chartSvg.value) {
    return;
  }

  const rect = chartSvg.value.getBoundingClientRect();
  // Uzmi u obzir skaliranje SVG-ovog viewBox-a
  const scaleX = 800 / rect.width;
  const scaleY = 260 / rect.height;

  const mouseX = (event.clientX - rect.left) * scaleX;
  const mouseY = (event.clientY - rect.top) * scaleY;

  // Prvo pronađi najbližu poziciju na X-osi (vremensku tačku)
  let closestXDistance = Infinity;
  let closestTimeIndex = -1;

  chartData.value.labels.forEach((_, pointIndex) => {
    const x = getXPosition(pointIndex);
    const xDistance = Math.abs(mouseX - x);

    if (xDistance < closestXDistance) {
      closestXDistance = xDistance;
      closestTimeIndex = pointIndex;
    }
  });

  // Ako je miš previše udaljen od najbliže vremenske tačke, ne prikazuj tooltip
  if (closestXDistance > 50) {
    hoveredPoint.value = null;
    tooltipData.value = null;
    return;
  }

  // Sakupi podatke iz svih skupova podataka u toj vremenskoj tački
  const datasetsAtTime = chartData.value.datasets.map(dataset => ({
    label: dataset.label,
    value: dataset.data[closestTimeIndex],
    color: dataset.color,
  }));

  if (closestTimeIndex >= 0) {
    hoveredPoint.value = {
      datasetIndex: 0, // No longer need a specific dataset index
      pointIndex: closestTimeIndex,
      x: mouseX,
      y: mouseY,
    };

    // Prikaži tooltip
    const x = getXPosition(closestTimeIndex);
    const avgY =
      datasetsAtTime.reduce((sum, item) => sum + getYPosition(item.value), 0) /
      datasetsAtTime.length;

    tooltipPosition.value = {
      x,
      y: avgY - 20, // Prikaži iznad prosečne visine
    };

    tooltipData.value = {
      time: formatTimeLabel(chartData.value.labels[closestTimeIndex]),
      datasets: datasetsAtTime,
    };
  } else {
    hoveredPoint.value = null;
    tooltipData.value = null;
  }
};

const hideTooltip = () => {
  hoveredPoint.value = null;
  tooltipData.value = null;
};

// Dobavi listu grupa
const fetchGroups = async () => {
  try {
    const response = await getGroupList();
    groupOptions.value = [
      { label: t("dashboard.chart.allGroups"), value: null },
      ...response.data.map(group => ({
        label: getGroupDisplayName(group),
        value: group.id || 0,
      })),
    ];
  } catch (error) {
    console.error(t("dashboard.chart.fetchGroupsFailed"), error);
  }
};

// Dobavi podatke grafikona
const fetchChartData = async () => {
  try {
    loading.value = true;
    const response = await getDashboardChart(selectedGroup.value || undefined);
    const data = response.data;
    if (data) {
      data.datasets.forEach(dataset => {
        if (dataset.label === "successful_requests") {
          dataset.label = t("dashboard.chart.successfulRequests");
        } else if (dataset.label === "failed_requests") {
          dataset.label = t("dashboard.chart.failedRequests");
        }
      });
    }
    chartData.value = data;

    // Odloži početak animacije kako bi se osiguralo ažuriranje DOM-a
    setTimeout(() => {
      startAnimation();
    }, 100);
  } catch (error) {
    console.error(t("dashboard.chart.fetchDataFailed"), error);
  } finally {
    loading.value = false;
  }
};

// Prati promene u izboru grupe
watch(selectedGroup, () => {
  fetchChartData();
});

onMounted(() => {
  fetchGroups();
  fetchChartData();
});
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="chart-title-section">
        <h3 class="chart-title">{{ t("dashboard.chart.title") }}</h3>
      </div>
      <n-select
        v-model:value="selectedGroup"
        :options="groupOptions as any"
        :placeholder="t('dashboard.chart.allGroups')"
        size="small"
        style="width: 150px"
        clearable
      />
    </div>

    <div v-if="chartData" class="chart-content">
      <div class="chart-wrapper">
        <div class="chart-legend">
          <div v-for="dataset in chartData.datasets" :key="dataset.label" class="legend-item">
            <div class="legend-indicator" :style="{ backgroundColor: dataset.color }" />
            <span class="legend-label">{{ dataset.label }}</span>
          </div>
        </div>
        <svg
          ref="chartSvg"
          viewBox="0 0 800 260"
          class="chart-svg"
          @mousemove="handleMouseMove"
          @mouseleave="hideTooltip"
        >
          <!-- Pozadinska mreža -->
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 30"
                fill="none"
                stroke="#f0f0f0"
                stroke-width="1"
                opacity="0.3"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          <!-- Linije mreže i oznake Y-ose -->
          <g class="y-axis">
            <line
              :x1="padding.left"
              :y1="padding.top"
              :x2="padding.left"
              :y2="chartHeight - padding.bottom"
              stroke="#e0e0e0"
              stroke-width="2"
            />
            <g v-for="(tick, index) in yTicks" :key="index">
              <line
                :x1="padding.left - 5"
                :y1="getYPosition(tick)"
                :x2="padding.left"
                :y2="getYPosition(tick)"
                stroke="#666"
                stroke-width="1"
              />
              <text
                :x="padding.left - 10"
                :y="getYPosition(tick) + 4"
                text-anchor="end"
                class="axis-label"
              >
                {{ formatNumber(tick) }}
              </text>
            </g>
          </g>

          <!-- Linije mreže i oznake X-ose -->
          <g class="x-axis">
            <line
              :x1="padding.left"
              :y1="chartHeight - padding.bottom"
              :x2="chartWidth - padding.right"
              :y2="chartHeight - padding.bottom"
              stroke="#e0e0e0"
              stroke-width="2"
            />
            <g v-for="(label, index) in visibleLabels" :key="index">
              <line
                :x1="getXPosition(label.index)"
                :y1="chartHeight - padding.bottom"
                :x2="getXPosition(label.index)"
                :y2="chartHeight - padding.bottom + 5"
                stroke="#666"
                stroke-width="1"
              />
              <text
                :x="getXPosition(label.index)"
                :y="chartHeight - padding.bottom + 18"
                text-anchor="middle"
                class="axis-label"
              >
                {{ label.text }}
              </text>
            </g>
          </g>

          <!-- Linije podataka -->
          <g v-for="(dataset, datasetIndex) in chartData.datasets" :key="dataset.label">
            <!-- Definicija gradijenta -->
            <defs>
              <linearGradient :id="`gradient-${datasetIndex}`" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="dataset.color" stop-opacity="0.3" />
                <stop offset="100%" :stop-color="dataset.color" stop-opacity="0.05" />
              </linearGradient>
            </defs>

            <!-- Oblast popunjavanja -->
            <path
              :d="generateAreaPath(dataset.data)"
              :fill="`url(#gradient-${datasetIndex})`"
              class="area-path"
              :style="{ opacity: isErrorDataset(dataset.label) ? 0.3 : 0.6 }"
            />

            <!-- Glavna linija -->
            <path
              :d="generateLinePath(dataset.data)"
              :stroke="dataset.color"
              :stroke-width="isErrorDataset(dataset.label) ? 1 : 2"
              fill="none"
              class="line-path"
              :style="{
                opacity: isErrorDataset(dataset.label) ? 0.75 : 1,
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))',
              }"
            />

            <!-- Tačke podataka -->
            <g v-for="(value, pointIndex) in dataset.data" :key="pointIndex">
              <circle
                v-if="value > 0"
                :cx="getXPosition(pointIndex)"
                :cy="getYPosition(value)"
                :r="isErrorDataset(dataset.label) ? 2 : 3"
                :fill="dataset.color"
                :stroke="dataset.color"
                stroke-width="1"
                class="data-point"
                :class="{
                  'point-hover': hoveredPoint?.pointIndex === pointIndex,
                }"
                :style="{ opacity: isErrorDataset(dataset.label) ? 0.8 : 1 }"
              />
            </g>
          </g>

          <!-- Linija indikatora lebdenja -->
          <line
            v-if="hoveredPoint"
            :x1="getXPosition(hoveredPoint.pointIndex)"
            :y1="padding.top"
            :x2="getXPosition(hoveredPoint.pointIndex)"
            :y2="chartHeight - padding.bottom"
            stroke="#999"
            stroke-width="1"
            stroke-dasharray="5,5"
            opacity="0.7"
          />
        </svg>

        <!-- Opis alata -->
        <div
          v-if="tooltipData"
          class="chart-tooltip"
          :style="{
            left: tooltipPosition.x + 'px',
            top: tooltipPosition.y + 'px',
          }"
        >
          <div class="tooltip-time">{{ tooltipData.time }}</div>
          <div v-for="dataset in tooltipData.datasets" :key="dataset.label" class="tooltip-value">
            <span class="tooltip-color" :style="{ backgroundColor: dataset.color }" />
            {{ dataset.label }}: {{ formatNumber(dataset.value) }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="chart-loading">
      <n-spin size="large" />
      <p>{{ t("dashboard.chart.loading") }}</p>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: white;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 16px;
}

.chart-title-section {
  flex: 1;
}

.chart-title {
  font-size: 24px;
  line-height: 28px;
  font-weight: 600;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chart-subtitle {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 400;
}

/* .chart-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  color: #333;
} */

.chart-legend {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  transition: all 0.2s ease;
}

.legend-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.legend-indicator {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
}

.legend-indicator::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
}

.legend-label {
  font-size: 13px;
  color: #334155;
}

.chart-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
}

.chart-svg {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.axis-label {
  fill: #666;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.line-path {
  transition: all 0.3s ease;
}

.area-path {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.data-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point:hover,
.point-hover {
  r: 5;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.3));
}

.data-point-zero {
  cursor: default;
  transition: opacity 0.2s ease;
}

.data-point-zero:hover {
  opacity: 0.8;
}

.chart-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  z-index: 1000;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 140px;
  max-width: 220px;
}

.tooltip-time {
  font-weight: 700;
  margin-bottom: 8px;
  text-align: center;
  color: #e2e8f0;
  font-size: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 6px;
}

.tooltip-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 4px;
  font-size: 12px;
}

.tooltip-value:last-child {
  margin-bottom: 0;
}

.tooltip-color {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 260px;
  color: white;
}

.chart-loading p {
  margin-top: 16px;
  font-size: 16px;
  opacity: 0.8;
}

/* Responzivni dizajn */
@media (max-width: 768px) {
  .chart-container {
    padding: 16px;
  }

  .chart-title {
    font-size: 20px;
  }

  .chart-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .chart-legend {
    flex-wrap: wrap;
    gap: 16px;
  }

  .chart-svg {
    width: 100%;
    height: auto;
  }
}

/* Efekat animacije */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chart-container {
  animation: fadeInUp 0.6s ease-out;
}

.legend-item {
  animation: fadeInUp 0.6s ease-out;
}

.legend-item:nth-child(2) {
  animation-delay: 0.1s;
}

.legend-item:nth-child(3) {
  animation-delay: 0.2s;
}
</style>
