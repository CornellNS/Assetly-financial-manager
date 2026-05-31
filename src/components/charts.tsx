"use client";

import { useId } from "react";
import { formatCurrency } from "@/lib/finance-data";
import { cn } from "./ui-kit";

type ValueFormatter = (value: number) => string;

const defaultValueFormatter: ValueFormatter = (value) => formatCurrency(value);
const compactValueFormatter: ValueFormatter = (value) => formatCurrency(value, true);
const numberValueFormatter: ValueFormatter = (value) => value.toLocaleString("en-US");

function ChartEmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid h-56 w-full place-items-center rounded-md border border-dashed border-[#ddd8cf] bg-[#fbfaf8] px-6 text-center",
        className,
      )}
      role="status"
    >
      <div>
        <div className="mx-auto mb-3 flex h-9 w-12 items-end justify-center gap-1 rounded-md border border-[#e5e0d8] bg-white px-2 py-1.5">
          <span className="h-2 w-1.5 rounded-sm bg-[#cfc8bd]" />
          <span className="h-4 w-1.5 rounded-sm bg-[#bfb7aa]" />
          <span className="h-3 w-1.5 rounded-sm bg-[#d8d2c8]" />
        </div>
        <p className="text-sm font-semibold text-[#302d29]">{title}</p>
        <p className="mt-1 max-w-xs text-xs leading-5 text-[#746f67]">{description}</p>
      </div>
    </div>
  );
}

function finiteValue(value: number) {
  return Number.isFinite(value);
}

function seriesSummary(
  data: { label: string; value: number }[],
  valueFormatter: ValueFormatter,
) {
  return data.map((point) => `${point.label}: ${valueFormatter(point.value)}`).join("; ");
}

type LineChartProps = {
  data: { label: string; value: number }[];
  className?: string;
  color?: string;
  ariaLabel?: string;
  bottomPadding?: number;
  description?: string;
  pointValueLabelClassName?: string;
  pointValueLabelStrokeWidth?: string;
  showCaption?: boolean;
  topPadding?: number;
  valueFormatter?: ValueFormatter;
  xAxisLabelBottomOffset?: number;
  xAxisLabelClassName?: string;
  yAxisLabelClassName?: string;
};

export function LineChart({
  data,
  className,
  color = "#6fa47b",
  ariaLabel = "Line chart",
  bottomPadding = 28,
  description,
  pointValueLabelClassName = "fill-[#3f3a34] text-[14px] font-semibold",
  pointValueLabelStrokeWidth = "5",
  showCaption = true,
  topPadding = 30,
  valueFormatter = defaultValueFormatter,
  xAxisLabelBottomOffset = 4,
  xAxisLabelClassName = "fill-[#8b857c] text-[14px] font-medium",
  yAxisLabelClassName = "fill-[#8b857c] text-[15px] font-medium",
}: LineChartProps) {
  const chartId = useId();
  const chartData = data.filter((point) => finiteValue(point.value));

  if (chartData.length === 0) {
    return (
      <ChartEmptyState
        className={className}
        title="No trend data"
        description="Add dated values to show this line chart."
      />
    );
  }

  const width = 560;
  const height = 220;
  const leftPadding = 64;
  const rightPadding = 18;
  const values = chartData.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const domainPadding = min === max ? Math.max(Math.abs(max) * 0.05, 1) : 0;
  const domainMin = min - domainPadding;
  const domainMax = max + domainPadding;
  const range = Math.max(domainMax - domainMin, 1);
  const plotWidth = width - leftPadding - rightPadding;
  const plotHeight = height - topPadding - bottomPadding;
  const points = chartData.map((point, index) => {
    const x =
      leftPadding + (index / Math.max(chartData.length - 1, 1)) * plotWidth;
    const y = height - bottomPadding - ((point.value - domainMin) / range) * plotHeight;
    return { ...point, x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const minIndex = values.indexOf(min);
  const maxIndex = values.indexOf(max);
  const labeledIndexes = new Set([0, points.length - 1, minIndex, maxIndex]);
  const tickValues = [domainMax, domainMin + range / 2, domainMin];
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const summary =
    description ??
    `${ariaLabel}. Starts at ${valueFormatter(first.value)} for ${first.label}, ends at ${valueFormatter(
      last.value,
    )} for ${last.label}, with a high of ${valueFormatter(max)} and a low of ${valueFormatter(
      min,
    )}. Values: ${seriesSummary(chartData, valueFormatter)}.`;

  return (
    <figure
      className={cn(
        "grid w-full",
        !className && "h-56",
        showCaption && "grid-rows-[auto_1fr] gap-2",
        className,
      )}
    >
      {showCaption ? (
        <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-[#746f67]">
          <span className="font-medium text-[#3c3833]">
            Latest {valueFormatter(last.value)}
          </span>
          <span>
            High {valueFormatter(max)} / Low {valueFormatter(min)}
          </span>
        </figcaption>
      ) : null}
      <svg
        aria-describedby={`${chartId}-line-desc`}
        aria-labelledby={`${chartId}-line-title`}
        className="h-full min-h-0 w-full overflow-visible"
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title id={`${chartId}-line-title`}>{ariaLabel}</title>
        <desc id={`${chartId}-line-desc`}>{summary}</desc>
        <path
          d={`M ${leftPadding} ${height - bottomPadding} H ${width - rightPadding}`}
          stroke="#ebe7df"
          strokeWidth="1"
        />
        {tickValues.map((tickValue, index) => {
          const y = topPadding + (index / 2) * plotHeight;
          return (
            <g key={`${tickValue}-${index}`}>
              <path
                d={`M ${leftPadding} ${y} H ${width - rightPadding}`}
                stroke="#f0ede7"
                strokeWidth="1"
              />
              <text
                x="0"
                y={y + 5}
                className={yAxisLabelClassName}
              >
                {compactValueFormatter(tickValue)}
              </text>
            </g>
          );
        })}
        <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeWidth="3" />
        {points.length > 1 ? (
          <path
            d={`${path} L ${points[points.length - 1].x} ${height - bottomPadding} L ${
              points[0].x
            } ${height - bottomPadding} Z`}
            fill={color}
            opacity="0.08"
          />
        ) : null}
        {points.map((point, index) => (
          <g key={`${point.label}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
            <title>{`${point.label}: ${valueFormatter(point.value)}`}</title>
            {labeledIndexes.has(index) ? (
              <text
                x={Math.max(leftPadding + 6, Math.min(width - rightPadding - 6, point.x))}
                y={point.y < topPadding + 18 ? point.y + 18 : point.y - 10}
                textAnchor={
                  index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"
                }
                className={pointValueLabelClassName}
                paintOrder="stroke"
                stroke="#fff"
                strokeWidth={pointValueLabelStrokeWidth}
              >
                {compactValueFormatter(point.value)}
              </text>
            ) : null}
            <text
              x={point.x}
              y={height - xAxisLabelBottomOffset}
              textAnchor="middle"
              className={xAxisLabelClassName}
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

type BarChartProps = {
  data: {
    expenses: number;
    income: number;
    incomeIsFutureProjection?: boolean;
    label: string;
  }[];
  ariaLabel?: string;
  colors?: {
    expenses: string;
    income: string;
  };
  description?: string;
  valueFormatter?: ValueFormatter;
};

export function IncomeExpenseChart({
  data,
  ariaLabel = "Income and expense bar chart",
  colors = {
    expenses: "#c96b5b",
    income: "#6fa47b",
  },
  description,
  valueFormatter = defaultValueFormatter,
}: BarChartProps) {
  const chartId = useId();
  const chartData = data.filter(
    (item) => finiteValue(item.income) && finiteValue(item.expenses),
  );

  if (chartData.length === 0) {
    return (
      <ChartEmptyState
        title="No income or expense data"
        description="Add monthly income and expense values to compare cash flow."
      />
    );
  }

  const max = Math.max(...chartData.flatMap((item) => [item.income, item.expenses]), 1);
  const totalIncome = chartData.reduce((sum, item) => sum + item.income, 0);
  const totalExpenses = chartData.reduce((sum, item) => sum + item.expenses, 0);
  const net = totalIncome - totalExpenses;
  const width = Math.max(640, chartData.length * 54 + 86);
  const height = 220;
  const leftPadding = 68;
  const rightPadding = 18;
  const topPadding = 10;
  const baseline = 164;
  const labelY = 190;
  const netY = 210;
  const plotHeight = baseline - topPadding;
  const sparseSeries = chartData.length <= 2;
  const slotWidth = sparseSeries
    ? 140
    : (width - leftPadding - rightPadding) / Math.max(chartData.length, 1);
  const barGap = sparseSeries ? 14 : Math.max(5, Math.min(10, slotWidth * 0.14));
  const barWidth = sparseSeries
    ? 44
    : Math.max(10, Math.min(30, (slotWidth - barGap - 8) / 2));
  const groupWidth = barWidth * 2 + barGap;
  const groupStart = (index: number) =>
    sparseSeries
      ? leftPadding + 50 + index * slotWidth
      : leftPadding + index * slotWidth + Math.max((slotWidth - groupWidth) / 2, 0);
  const barHeight = (value: number) => Math.max((value / max) * plotHeight, value > 0 ? 3 : 0);
  const tickValues = [max, max / 2, 0];
  const summary =
    description ??
    `${ariaLabel}. Total income ${valueFormatter(totalIncome)}, total expenses ${valueFormatter(
      totalExpenses,
    )}, net ${valueFormatter(net)}. Values: ${chartData
      .map(
        (item) =>
          `${item.label}: ${
            item.incomeIsFutureProjection ? "projected income" : "income"
          } ${valueFormatter(item.income)}, expenses ${valueFormatter(
            item.expenses,
          )}, net ${valueFormatter(item.income - item.expenses)}`,
      )
      .join("; ")}.`;

  return (
    <div
      aria-describedby={`${chartId}-bar-desc`}
      aria-labelledby={`${chartId}-bar-title`}
      className="grid h-64 grid-rows-[auto_1fr] gap-3 overflow-hidden px-1 pb-2 pt-3"
      role="img"
    >
      <p id={`${chartId}-bar-title`} className="sr-only">
        {ariaLabel}
      </p>
      <p id={`${chartId}-bar-desc`} className="sr-only">
        {summary}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-[var(--muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.income }} />
          Income {compactValueFormatter(totalIncome)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.expenses }} />
          Expenses {compactValueFormatter(totalExpenses)}
        </span>
        <span className="ml-auto font-medium text-[var(--foreground-soft)]">
          Net {valueFormatter(net)}
        </span>
      </div>
      <div className="h-full min-h-0 overflow-x-auto pb-1">
        <svg
          className="h-full min-h-0 w-full"
          style={{ minWidth: width }}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
        <path
          d={`M ${leftPadding} ${topPadding} V ${baseline} H ${width - rightPadding}`}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        {tickValues.map((tickValue) => {
          const y = baseline - (tickValue / max) * plotHeight;

          return (
            <g key={tickValue}>
              <text
                x={leftPadding - 16}
                y={y + 4}
                className="fill-[var(--muted)] text-[10px]"
                textAnchor="end"
              >
                {tickValue === 0 ? "$0" : compactValueFormatter(tickValue)}
              </text>
              {tickValue > 0 ? (
                <path
                  d={`M ${leftPadding} ${y} H ${width - rightPadding}`}
                  stroke="var(--line)"
                  strokeDasharray="3 5"
                  strokeWidth="1"
                  opacity="0.45"
                />
              ) : null}
            </g>
          );
        })}
        {chartData.map((item, index) => {
          const x = groupStart(index);
          const incomeHeight = barHeight(item.income);
          const expenseHeight = barHeight(item.expenses);
          const labelX = x + groupWidth / 2;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={baseline - incomeHeight}
                width={barWidth}
                height={incomeHeight}
                opacity={item.incomeIsFutureProjection ? 0.3 : 1}
                rx="6"
                fill={colors.income}
              >
                <title>{`${item.label} ${
                  item.incomeIsFutureProjection ? "projected income" : "income"
                } ${valueFormatter(item.income)}`}</title>
              </rect>
              <rect
                x={x + barWidth + barGap}
                y={baseline - expenseHeight}
                width={barWidth}
                height={expenseHeight}
                opacity={item.incomeIsFutureProjection ? 0.3 : 1}
                rx="6"
                fill={colors.expenses}
              >
                <title>{`${item.label} ${
                  item.incomeIsFutureProjection ? "projected expenses" : "expenses"
                } ${valueFormatter(item.expenses)}`}</title>
              </rect>
              <text
                x={labelX}
                y={labelY}
                className="fill-[var(--muted)] text-[11px]"
                textAnchor="middle"
              >
                {item.label}
              </text>
              <text
                x={labelX}
                y={netY}
                className="fill-[var(--foreground-soft)] font-mono text-[10px]"
                textAnchor="middle"
              >
                {compactValueFormatter(item.income - item.expenses)}
              </text>
            </g>
          );
        })}
        </svg>
      </div>
    </div>
  );
}

type DonutChartProps = {
  data: { label: string; value: number; color: string }[];
  ariaLabel?: string;
  description?: string;
  valueFormatter?: ValueFormatter;
};

export function DonutChart({
  data,
  ariaLabel = "Donut chart",
  description,
  valueFormatter = defaultValueFormatter,
}: DonutChartProps) {
  const chartId = useId();
  const chartData = data.filter((item) => finiteValue(item.value) && item.value > 0);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total <= 0) {
    return (
      <ChartEmptyState
        title="No allocation data"
        description="Add positive values to show this allocation chart."
      />
    );
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const segments = chartData.reduce<{
    offset: number;
    items: Array<(typeof chartData)[number] & { dash: number; offset: number }>;
  }>(
    (accumulator, item) => {
      const dash = (item.value / total) * circumference;
      return {
        offset: accumulator.offset + dash,
        items: [...accumulator.items, { ...item, dash, offset: accumulator.offset }],
      };
    },
    { offset: 0, items: [] },
  ).items;
  const summary =
    description ??
    `${ariaLabel}. Total ${valueFormatter(total)}. Segments: ${chartData
      .map(
        (item, index) =>
          `${index + 1}. ${item.label}: ${valueFormatter(item.value)}, ${(
            (item.value / total) *
            100
          ).toFixed(1)} percent`,
      )
      .join("; ")}.`;

  return (
    <div className="grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
      <div className="relative mx-auto h-40 w-40">
        <svg
          aria-describedby={`${chartId}-donut-desc`}
          aria-labelledby={`${chartId}-donut-title`}
          className="-rotate-90"
          role="img"
          viewBox="0 0 120 120"
        >
          <title id={`${chartId}-donut-title`}>{ariaLabel}</title>
          <desc id={`${chartId}-donut-desc`}>{summary}</desc>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--line)"
            strokeWidth="14"
          />
          {segments.map((item, index) => (
            <circle
              key={`${item.label}-${index}`}
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeDasharray={`${item.dash} ${circumference - item.dash}`}
              strokeDashoffset={-item.offset}
              strokeLinecap="round"
              strokeWidth="14"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] font-medium uppercase text-[var(--muted)]">Total</p>
            <p className="font-mono text-lg font-semibold text-[var(--foreground)]">
              {formatCurrency(total, true)}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-2">
        {chartData.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center justify-between gap-3 text-sm"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="relative grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-md border border-[#d9d3ca] bg-white text-[10px] font-semibold text-[#3f3a34]"
              >
                <span
                  className="absolute inset-x-0 bottom-0 h-1"
                  style={{ background: item.color }}
                />
                {index + 1}
              </span>
              <span className="truncate text-[var(--foreground-soft)]">{item.label}</span>
            </div>
            <span className="shrink-0 text-right font-mono text-xs text-[var(--muted)]">
              {formatCurrency(item.value, true)} / {((item.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type SparklineProps = {
  values: number[];
  positive?: boolean;
  ariaLabel?: string;
  negativeColor?: string;
  positiveColor?: string;
  valueFormatter?: ValueFormatter;
};

export function Sparkline({
  values,
  positive = true,
  ariaLabel = "Sparkline trend",
  negativeColor = "#c96b5b",
  positiveColor = "#6fa47b",
  valueFormatter = numberValueFormatter,
}: SparklineProps) {
  const chartId = useId();
  const chartValues = values.filter(finiteValue);

  if (chartValues.length === 0) {
    return (
      <span
        aria-label="No sparkline data"
        className="h-7 w-20 rounded bg-[#efede9]"
        role="img"
      />
    );
  }

  const width = 86;
  const height = 28;
  const min = Math.min(...chartValues);
  const max = Math.max(...chartValues);
  const domainPadding = min === max ? Math.max(Math.abs(max) * 0.05, 1) : 0;
  const domainMin = min - domainPadding;
  const domainMax = max + domainPadding;
  const range = Math.max(max - min, 1);
  const points = chartValues.map((value, index) => {
    const x = (index / Math.max(chartValues.length - 1, 1)) * width;
    const y = height - ((value - domainMin) / Math.max(domainMax - domainMin, range)) * height;
    return `${x},${y}`;
  });
  const first = chartValues[0];
  const last = chartValues[chartValues.length - 1];

  return (
    <svg
      aria-describedby={`${chartId}-spark-desc`}
      aria-labelledby={`${chartId}-spark-title`}
      className="h-7 w-20 overflow-visible"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <title id={`${chartId}-spark-title`}>{ariaLabel}</title>
      <desc id={`${chartId}-spark-desc`}>
        Starts at {valueFormatter(first)}, ends at {valueFormatter(last)}, high{" "}
        {valueFormatter(max)}, low {valueFormatter(min)}.
      </desc>
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={positive ? positiveColor : negativeColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
