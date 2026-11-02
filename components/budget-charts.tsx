import { Circle, G, Rect, Svg, Text as SvgText } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import { formatCurrency, type CategorySpending, type TrendPoint } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";
import { CategoryDot } from "@/components/budget-ui";

export function SpendingDonut({ items }: { items: CategorySpending[] }) {
  const active = items.filter((item) => item.spent > 0);
  const total = active.reduce((sum, item) => sum + item.spent, 0);
  const radius = 59;
  const circumference = 2 * Math.PI * radius;
  const segments = active.map((item, index) => ({
    item,
    length: total > 0 ? (item.spent / total) * circumference : 0,
    offset: active.slice(0, index).reduce((sum, prior) => sum + (total > 0 ? (prior.spent / total) * circumference : 0), 0),
  }));

  return (
    <View style={styles.donutLayout}>
      <View style={styles.donutWrap}>
        <Svg width={164} height={164} viewBox="0 0 164 164">
          <Circle cx={82} cy={82} r={radius} fill="none" stroke={palette.soft} strokeWidth={19} />
          <G transform="rotate(-90 82 82)">
            {segments.map(({ item, length, offset }) => {
              return (
                <Circle
                  key={item.category.id}
                  cx={82}
                  cy={82}
                  r={radius}
                  fill="none"
                  stroke={item.category.color}
                  strokeWidth={19}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                />
              );
            })}
          </G>
          <SvgText x={82} y={77} textAnchor="middle" fill={palette.muted} fontSize={10} fontFamily={typeface.medium} letterSpacing={1.2}>
            SPENT
          </SvgText>
          <SvgText x={82} y={98} textAnchor="middle" fill={palette.text} fontSize={15} fontFamily={typeface.semibold}>
            {formatCurrency(total)}
          </SvgText>
        </Svg>
      </View>
      <View style={styles.legend}>
        {active.length === 0 ? (
          <Text style={styles.noSpend}>No spending to chart yet.</Text>
        ) : (
          active.slice(0, 5).map((item) => (
            <View key={item.category.id} style={styles.legendItem}>
              <CategoryDot category={item.category} />
              <Text numberOfLines={1} style={styles.legendName}>{item.category.name}</Text>
              <Text style={styles.legendAmount}>{formatCurrency(item.spent)}</Text>
            </View>
          ))
        )}
        {active.length > 5 ? <Text style={styles.moreLabel}>+{active.length - 5} more categories</Text> : null}
      </View>
    </View>
  );
}

export function SpendingTrend({ points, selectedMonth }: { points: TrendPoint[]; selectedMonth: string }) {
  const max = Math.max(1, ...points.map((point) => point.amount));
  const chartWidth = 324;
  const chartHeight = 116;
  const baseY = 91;
  const barWidth = 28;
  const gap = (chartWidth - points.length * barWidth) / (points.length + 1);

  return (
    <View style={styles.trendWrap}>
      <View style={styles.trendCaption}>
        <Text style={styles.trendHint}>MONTHLY SPENDING</Text>
        <Text style={styles.trendScale}>Peak {formatCurrency(max)}</Text>
      </View>
      <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
        <Rect x="0" y={baseY} width={chartWidth} height="1" fill={palette.line} />
        {points.map((point, index) => {
          const x = gap + index * (barWidth + gap);
          const height = point.amount > 0 ? Math.max(5, (point.amount / max) * 72) : 3;
          const selected = point.month === selectedMonth;
          return (
            <G key={point.month}>
              <Rect
                x={x}
                y={baseY - height}
                width={barWidth}
                height={height}
                rx={7}
                fill={selected ? palette.mint : point.amount > 0 ? "#39506A" : "#26344A"}
              />
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight - 5}
                textAnchor="middle"
                fill={selected ? palette.mint : palette.muted}
                fontSize={10}
                fontFamily={selected ? typeface.semibold : typeface.regular}
              >
                {point.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  donutLayout: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 164 },
  donutWrap: { width: 164, height: 164, alignItems: "center", justifyContent: "center" },
  legend: { flex: 1, gap: 13, minWidth: 0 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendName: { flex: 1, minWidth: 0, color: palette.muted, fontFamily: typeface.medium, fontSize: 11 },
  legendAmount: { color: palette.text, fontFamily: typeface.semibold, fontSize: 11 },
  noSpend: { color: palette.muted, fontFamily: typeface.regular, fontSize: 12, lineHeight: 18 },
  moreLabel: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10, marginLeft: 16 },
  trendWrap: { gap: 8, paddingTop: 2 },
  trendCaption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trendHint: { color: palette.dim, fontFamily: typeface.medium, fontSize: 9, letterSpacing: 1 },
  trendScale: { color: palette.muted, fontFamily: typeface.regular, fontSize: 10 },
});
