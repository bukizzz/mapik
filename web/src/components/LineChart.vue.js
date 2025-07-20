import { getDashboardChart, getGroupList } from "@/api/dashboard";
import { getGroupDisplayName } from "@/utils/display";
import { NSelect, NSpin } from "naive-ui";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
// Podaci grafikona
const chartData = ref(null);
const selectedGroup = ref(null);
const loading = ref(true);
const animationProgress = ref(0);
const hoveredPoint = ref(null);
const tooltipData = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });
const chartSvg = ref();
// Dimenzije i margine grafikona
const chartWidth = 800;
const chartHeight = 260;
const padding = { top: 40, right: 40, bottom: 60, left: 80 };
// Formatiranje opcija grupe
const groupOptions = ref([]);
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
const formatTimeLabel = (isoString) => {
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
const getXPosition = (index) => {
    if (!chartData.value) {
        return 0;
    }
    const totalPoints = chartData.value.labels.length;
    if (totalPoints <= 1) {
        return padding.left + plotWidth / 2;
    }
    return padding.left + (index / (totalPoints - 1)) * plotWidth;
};
const getYPosition = (value) => {
    const { min, max } = dataRange.value;
    const ratio = (value - min) / (max - min);
    return padding.top + (1 - ratio) * plotHeight;
};
// Pomoćna funkcija za pronalaženje segmenata podataka koji nisu nula (za popunjavanje oblasti)
const getSegments = (data) => {
    const segments = [];
    let currentSegment = [];
    data.forEach((value, index) => {
        if (value > 0) {
            currentSegment.push({ value, index });
        }
        else {
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
const generateLinePath = (data) => {
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
    const pathCommands = [];
    for (let i = firstNonZeroIndex; i <= lastNonZeroIndex; i++) {
        const x = getXPosition(i);
        const y = getYPosition(data[i]);
        const command = i === firstNonZeroIndex ? "M" : "L";
        pathCommands.push(`${command} ${x},${y}`);
    }
    return pathCommands.join(" ");
};
// Generiši putanju oblasti popunjavanja (samo za oblasti sa podacima)
const generateAreaPath = (data) => {
    const segments = getSegments(data);
    const pathParts = [];
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
const formatNumber = (value) => {
    // if (value >= 1000000) {
    //   return `${(value / 1000000).toFixed(1)}M`;
    // } else
    if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return Math.round(value).toString();
};
const isErrorDataset = (label) => {
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
    const animate = (timestamp) => {
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
const handleMouseMove = (event) => {
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
        const avgY = datasetsAtTime.reduce((sum, item) => sum + getYPosition(item.value), 0) /
            datasetsAtTime.length;
        tooltipPosition.value = {
            x,
            y: avgY - 20, // Prikaži iznad prosečne visine
        };
        tooltipData.value = {
            time: formatTimeLabel(chartData.value.labels[closestTimeIndex]),
            datasets: datasetsAtTime,
        };
    }
    else {
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
    }
    catch (error) {
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
                }
                else if (dataset.label === "failed_requests") {
                    dataset.label = t("dashboard.chart.failedRequests");
                }
            });
        }
        chartData.value = data;
        // Odloži početak animacije kako bi se osiguralo ažuriranje DOM-a
        setTimeout(() => {
            startAnimation();
        }, 100);
    }
    catch (error) {
        console.error(t("dashboard.chart.fetchDataFailed"), error);
    }
    finally {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['data-point']} */ ;
/** @type {__VLS_StyleScopedClasses['data-point-zero']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-value']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-loading']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "chart-title-section" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "chart-title" },
});
(__VLS_ctx.t("dashboard.chart.title"));
const __VLS_0 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    value: (__VLS_ctx.selectedGroup),
    options: __VLS_ctx.groupOptions,
    placeholder: (__VLS_ctx.t('dashboard.chart.allGroups')),
    size: "small",
    ...{ style: {} },
    clearable: true,
}));
const __VLS_2 = __VLS_1({
    value: (__VLS_ctx.selectedGroup),
    options: __VLS_ctx.groupOptions,
    placeholder: (__VLS_ctx.t('dashboard.chart.allGroups')),
    size: "small",
    ...{ style: {} },
    clearable: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
if (__VLS_ctx.chartData) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-content" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-wrapper" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-legend" },
    });
    for (const [dataset] of __VLS_getVForSourceType((__VLS_ctx.chartData.datasets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (dataset.label),
            ...{ class: "legend-item" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            ...{ class: "legend-indicator" },
            ...{ style: ({ backgroundColor: dataset.color }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "legend-label" },
        });
        (dataset.label);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        ...{ onMousemove: (__VLS_ctx.handleMouseMove) },
        ...{ onMouseleave: (__VLS_ctx.hideTooltip) },
        ref: "chartSvg",
        viewBox: "0 0 800 260",
        ...{ class: "chart-svg" },
    });
    /** @type {typeof __VLS_ctx.chartSvg} */ ;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pattern, __VLS_intrinsicElements.pattern)({
        id: "grid",
        width: "40",
        height: "30",
        patternUnits: "userSpaceOnUse",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M 40 0 L 0 0 0 30",
        fill: "none",
        stroke: "#f0f0f0",
        'stroke-width': "1",
        opacity: "0.3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        width: "100%",
        height: "100%",
        fill: "url(#grid)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
        ...{ class: "y-axis" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: (__VLS_ctx.padding.left),
        y1: (__VLS_ctx.padding.top),
        x2: (__VLS_ctx.padding.left),
        y2: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom),
        stroke: "#e0e0e0",
        'stroke-width': "2",
    });
    for (const [tick, index] of __VLS_getVForSourceType((__VLS_ctx.yTicks))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
            key: (index),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: (__VLS_ctx.padding.left - 5),
            y1: (__VLS_ctx.getYPosition(tick)),
            x2: (__VLS_ctx.padding.left),
            y2: (__VLS_ctx.getYPosition(tick)),
            stroke: "#666",
            'stroke-width': "1",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
            x: (__VLS_ctx.padding.left - 10),
            y: (__VLS_ctx.getYPosition(tick) + 4),
            'text-anchor': "end",
            ...{ class: "axis-label" },
        });
        (__VLS_ctx.formatNumber(tick));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
        ...{ class: "x-axis" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: (__VLS_ctx.padding.left),
        y1: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom),
        x2: (__VLS_ctx.chartWidth - __VLS_ctx.padding.right),
        y2: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom),
        stroke: "#e0e0e0",
        'stroke-width': "2",
    });
    for (const [label, index] of __VLS_getVForSourceType((__VLS_ctx.visibleLabels))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
            key: (index),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: (__VLS_ctx.getXPosition(label.index)),
            y1: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom),
            x2: (__VLS_ctx.getXPosition(label.index)),
            y2: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom + 5),
            stroke: "#666",
            'stroke-width': "1",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.text, __VLS_intrinsicElements.text)({
            x: (__VLS_ctx.getXPosition(label.index)),
            y: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom + 18),
            'text-anchor': "middle",
            ...{ class: "axis-label" },
        });
        (label.text);
    }
    for (const [dataset, datasetIndex] of __VLS_getVForSourceType((__VLS_ctx.chartData.datasets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
            key: (dataset.label),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.linearGradient, __VLS_intrinsicElements.linearGradient)({
            id: (`gradient-${datasetIndex}`),
            x1: "0%",
            y1: "0%",
            x2: "0%",
            y2: "100%",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
            offset: "0%",
            'stop-color': (dataset.color),
            'stop-opacity': "0.3",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.stop)({
            offset: "100%",
            'stop-color': (dataset.color),
            'stop-opacity': "0.05",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: (__VLS_ctx.generateAreaPath(dataset.data)),
            fill: (`url(#gradient-${datasetIndex})`),
            ...{ class: "area-path" },
            ...{ style: ({ opacity: __VLS_ctx.isErrorDataset(dataset.label) ? 0.3 : 0.6 }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: (__VLS_ctx.generateLinePath(dataset.data)),
            stroke: (dataset.color),
            'stroke-width': (__VLS_ctx.isErrorDataset(dataset.label) ? 1 : 2),
            fill: "none",
            ...{ class: "line-path" },
            ...{ style: ({
                    opacity: __VLS_ctx.isErrorDataset(dataset.label) ? 0.75 : 1,
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))',
                }) },
        });
        for (const [value, pointIndex] of __VLS_getVForSourceType((dataset.data))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.g, __VLS_intrinsicElements.g)({
                key: (pointIndex),
            });
            if (value > 0) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
                    cx: (__VLS_ctx.getXPosition(pointIndex)),
                    cy: (__VLS_ctx.getYPosition(value)),
                    r: (__VLS_ctx.isErrorDataset(dataset.label) ? 2 : 3),
                    fill: (dataset.color),
                    stroke: (dataset.color),
                    'stroke-width': "1",
                    ...{ class: "data-point" },
                    ...{ class: ({
                            'point-hover': __VLS_ctx.hoveredPoint?.pointIndex === pointIndex,
                        }) },
                    ...{ style: ({ opacity: __VLS_ctx.isErrorDataset(dataset.label) ? 0.8 : 1 }) },
                });
            }
        }
    }
    if (__VLS_ctx.hoveredPoint) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: (__VLS_ctx.getXPosition(__VLS_ctx.hoveredPoint.pointIndex)),
            y1: (__VLS_ctx.padding.top),
            x2: (__VLS_ctx.getXPosition(__VLS_ctx.hoveredPoint.pointIndex)),
            y2: (__VLS_ctx.chartHeight - __VLS_ctx.padding.bottom),
            stroke: "#999",
            'stroke-width': "1",
            'stroke-dasharray': "5,5",
            opacity: "0.7",
        });
    }
    if (__VLS_ctx.tooltipData) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "chart-tooltip" },
            ...{ style: ({
                    left: __VLS_ctx.tooltipPosition.x + 'px',
                    top: __VLS_ctx.tooltipPosition.y + 'px',
                }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "tooltip-time" },
        });
        (__VLS_ctx.tooltipData.time);
        for (const [dataset] of __VLS_getVForSourceType((__VLS_ctx.tooltipData.datasets))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (dataset.label),
                ...{ class: "tooltip-value" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span)({
                ...{ class: "tooltip-color" },
                ...{ style: ({ backgroundColor: dataset.color }) },
            });
            (dataset.label);
            (__VLS_ctx.formatNumber(dataset.value));
        }
    }
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "chart-loading" },
    });
    const __VLS_4 = {}.NSpin;
    /** @type {[typeof __VLS_components.NSpin, typeof __VLS_components.nSpin, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        size: "large",
    }));
    const __VLS_6 = __VLS_5({
        size: "large",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.t("dashboard.chart.loading"));
}
/** @type {__VLS_StyleScopedClasses['chart-container']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-header']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-title-section']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-title']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-content']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-legend']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-item']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['legend-label']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-svg']} */ ;
/** @type {__VLS_StyleScopedClasses['y-axis']} */ ;
/** @type {__VLS_StyleScopedClasses['axis-label']} */ ;
/** @type {__VLS_StyleScopedClasses['x-axis']} */ ;
/** @type {__VLS_StyleScopedClasses['axis-label']} */ ;
/** @type {__VLS_StyleScopedClasses['area-path']} */ ;
/** @type {__VLS_StyleScopedClasses['line-path']} */ ;
/** @type {__VLS_StyleScopedClasses['data-point']} */ ;
/** @type {__VLS_StyleScopedClasses['point-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-time']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-value']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip-color']} */ ;
/** @type {__VLS_StyleScopedClasses['chart-loading']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NSelect: NSelect,
            NSpin: NSpin,
            t: t,
            chartData: chartData,
            selectedGroup: selectedGroup,
            hoveredPoint: hoveredPoint,
            tooltipData: tooltipData,
            tooltipPosition: tooltipPosition,
            chartSvg: chartSvg,
            chartWidth: chartWidth,
            chartHeight: chartHeight,
            padding: padding,
            groupOptions: groupOptions,
            yTicks: yTicks,
            visibleLabels: visibleLabels,
            getXPosition: getXPosition,
            getYPosition: getYPosition,
            generateLinePath: generateLinePath,
            generateAreaPath: generateAreaPath,
            formatNumber: formatNumber,
            isErrorDataset: isErrorDataset,
            handleMouseMove: handleMouseMove,
            hideTooltip: hideTooltip,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
