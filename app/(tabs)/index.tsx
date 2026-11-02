import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { SpendingDonut, SpendingTrend } from "@/components/budget-charts";
import { TransactionComposer } from "@/components/transaction-composer";
import { ActionButton, BrandHeader, MonthSelector, PageScroll, SectionHeading, TransactionRow } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import { formatCurrency, getBudgetMetrics, getCategorySpending, getInsights, getTrend, type Transaction } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

export default function DashboardScreen() {
  const router = useRouter();
  const { data, selectedMonth, hydrated, addTransaction } = useBudgetStore();
  const [composerVisible, setComposerVisible] = useState(false);
  const metrics = useMemo(() => getBudgetMetrics(data, selectedMonth), [data, selectedMonth]);
  const categorySpending = useMemo(() => getCategorySpending(data, selectedMonth), [data, selectedMonth]);
  const trend = useMemo(() => getTrend(data, selectedMonth), [data, selectedMonth]);
  const insights = useMemo(() => getInsights(data, selectedMonth), [data, selectedMonth]);
  const recent = useMemo(
    () => data.transactions
      .filter((item) => item.date.slice(0, 7) === selectedMonth)
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 4),
    [data.transactions, selectedMonth],
  );
  const budgetRatio = metrics.budget > 0 ? Math.max(0, Math.min(1, metrics.expenses / metrics.budget)) : 0;
  const remainingColor = metrics.remaining < 0 ? palette.coral : palette.mint;

  return (
    <>
      <PageScroll contentContainerStyle={styles.pageContent}>
        <BrandHeader actionLabel="Add" onAction={() => setComposerVisible(true)} />
        <View style={styles.greeting}>
          <Text style={styles.overline}>YOUR MONTH, IN FOCUS</Text>
          <Text style={styles.headline}>A little more clarity.</Text>
          <Text style={styles.description}>Money moves. You’re keeping track.</Text>
        </View>

        <MonthSelector />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroLabelGroup}>
              <Text style={styles.heroEyebrow}>LEFT IN YOUR PLAN</Text>
              <Text style={[styles.heroAmount, { color: remainingColor }]}>{formatCurrency(metrics.remaining)}</Text>
            </View>
            <View style={styles.planIcon}>
              <Ionicons name="pulse" size={20} color={palette.mint} />
            </View>
          </View>
          <Text style={styles.heroExplanation}>
            {metrics.budget > 0
              ? `${formatCurrency(metrics.expenses)} spent from ${formatCurrency(metrics.budget)} budgeted`
              : metrics.expenses > 0
                ? `${formatCurrency(metrics.expenses)} spent · add budgets to set a target`
                : "Set category budgets to give this month a plan."}
          </Text>
          <View style={styles.heroProgress}><View style={[styles.heroProgressFill, { width: `${budgetRatio * 100}%`, backgroundColor: remainingColor }]} /></View>
          <View style={styles.heroFoot}>
            <Text style={styles.heroFootLabel}>{metrics.budget > 0 ? `${Math.round((metrics.expenses / metrics.budget) * 100)}% of monthly plan used` : "A plan that fits your life"}</Text>
            {metrics.budget === 0 ? (
              <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/budgets" as never)} style={styles.planLink}>
                <Text style={styles.planLinkText}>Set a budget</Text><Ionicons name="arrow-forward" size={13} color={palette.mint} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.heroDecor}><View style={styles.heroRing} /><View style={styles.heroRingSmall} /></View>
        </View>

        <View style={styles.metricRow}>
          <Metric label="INCOME" value={formatCurrency(metrics.income)} icon="arrow-down" color={palette.mint} wash={palette.mintWash} />
          <Metric label="SPENT" value={formatCurrency(metrics.expenses)} icon="arrow-up" color={palette.coral} wash={palette.coralWash} />
        </View>

        <View style={styles.section}>
          <SectionHeading title="Spending by category" action="Budgets" onAction={() => router.push("/(tabs)/budgets" as never)} />
          <View style={styles.chartCard}>
            {categorySpending.length === 0 ? (
              <View style={styles.chartEmpty}>
                <SpendingDonut items={[]} />
                <Text style={styles.chartEmptyTitle}>Your categories will show up here.</Text>
                <Text style={styles.chartEmptyText}>Add an expense, then watch where your month is going.</Text>
              </View>
            ) : <SpendingDonut items={categorySpending} />}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading title="Month-over-month" />
          <View style={styles.chartCard}>
            <SpendingTrend points={trend} selectedMonth={selectedMonth} />
            <View style={styles.trendFoot}>
              <View style={styles.trendFootDot} />
              <Text style={styles.trendFootText}>The highlighted bar is your selected month</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading title="A few useful signals" />
          <View style={styles.insightStack}>
            {insights.map((insight, index) => (
              <View key={`${index}-${insight}`} style={styles.insightCard}>
                <View style={[styles.insightIcon, index === 0 && insight.toLowerCase().includes("over budget") ? styles.insightWarning : null]}>
                  <Ionicons name={index === 0 && insight.toLowerCase().includes("over budget") ? "alert-outline" : "sparkles-outline"} size={17} color={index === 0 && insight.toLowerCase().includes("over budget") ? palette.gold : palette.mint} />
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading
            title="Recent activity"
            action="See all"
            onAction={() => router.push("/(tabs)/transactions" as never)}
          />
          {recent.length > 0 ? (
            <View style={styles.activityCard}>
              {recent.map((transaction: Transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  category={data.categories.find((item) => item.id === transaction.categoryId)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityTitle}>{hydrated ? "No activity just yet" : "Loading your local data…"}</Text>
              <Text style={styles.emptyActivityBody}>Your first entry is only a tap away.</Text>
              {hydrated ? <ActionButton label="Add transaction" icon="add" onPress={() => setComposerVisible(true)} compact /> : null}
            </View>
          )}
        </View>
      </PageScroll>
      {composerVisible ? (
        <TransactionComposer
          visible
          onClose={() => setComposerVisible(false)}
          onSave={(input) => { addTransaction(input); setComposerVisible(false); }}
        />
      ) : null}
    </>
  );
}

function Metric({ label, value, icon, color, wash }: { label: string; value: string; icon: "arrow-down" | "arrow-up"; color: string; wash: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricTop}>
        <View style={[styles.metricIcon, { backgroundColor: wash }]}><Ionicons name={icon} size={14} color={color} /></View>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContent: { gap: 21, paddingTop: 15, paddingBottom: 34 },
  greeting: { gap: 4, paddingTop: 1 },
  overline: { color: palette.mint, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1.5 },
  headline: { color: palette.text, fontFamily: typeface.bold, fontSize: 26, letterSpacing: -0.8 },
  description: { color: palette.muted, fontFamily: typeface.regular, fontSize: 13 },
  heroCard: { minHeight: 192, overflow: "hidden", backgroundColor: palette.surface, borderColor: "#294048", borderWidth: 1, borderRadius: 24, padding: 20, gap: 10 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroLabelGroup: { gap: 5 },
  heroEyebrow: { color: palette.muted, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1.1 },
  heroAmount: { fontFamily: typeface.bold, fontSize: 38, letterSpacing: -1.2 },
  planIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: palette.mintWash, alignItems: "center", justifyContent: "center" },
  heroExplanation: { color: palette.muted, fontFamily: typeface.regular, fontSize: 12 },
  heroProgress: { height: 7, backgroundColor: palette.soft, borderRadius: 7, overflow: "hidden", marginTop: 3 },
  heroProgressFill: { height: "100%", borderRadius: 7 },
  heroFoot: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroFootLabel: { color: palette.dim, fontFamily: typeface.medium, fontSize: 10 },
  planLink: { flexDirection: "row", alignItems: "center", gap: 3, padding: 3 },
  planLinkText: { color: palette.mint, fontFamily: typeface.semibold, fontSize: 11 },
  heroDecor: { position: "absolute", width: 0, height: 0, right: 18, top: 50 },
  heroRing: { position: "absolute", width: 130, height: 130, borderRadius: 130, borderWidth: 1, borderColor: "rgba(94,234,212,0.07)", right: -18, top: -10 },
  heroRingSmall: { position: "absolute", width: 92, height: 92, borderRadius: 92, borderWidth: 1, borderColor: "rgba(94,234,212,0.06)", right: 0, top: 9 },
  metricRow: { flexDirection: "row", gap: 12 },
  metricCard: { flex: 1, minWidth: 0, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 14, gap: 11 },
  metricTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricIcon: { width: 27, height: 27, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  metricLabel: { color: palette.muted, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1 },
  metricValue: { color: palette.text, fontFamily: typeface.semibold, fontSize: 19, letterSpacing: -0.4 },
  section: { gap: 10 },
  chartCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, padding: 16 },
  chartEmpty: { alignItems: "center", gap: 5, paddingVertical: 4 },
  chartEmptyTitle: { color: palette.text, fontFamily: typeface.medium, fontSize: 13, textAlign: "center" },
  chartEmptyText: { color: palette.muted, fontFamily: typeface.regular, fontSize: 11, textAlign: "center", lineHeight: 16, maxWidth: 245 },
  trendFoot: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  trendFootDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: palette.mint },
  trendFootText: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10 },
  insightStack: { gap: 8 },
  insightCard: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 57, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 },
  insightIcon: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: palette.mintWash },
  insightWarning: { backgroundColor: "#3F3928" },
  insightText: { flex: 1, color: palette.muted, fontFamily: typeface.medium, fontSize: 11, lineHeight: 17 },
  activityCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18, paddingHorizontal: 13 },
  emptyActivity: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 19, alignItems: "center", gap: 9 },
  emptyActivityTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 14 },
  emptyActivityBody: { color: palette.muted, fontFamily: typeface.regular, fontSize: 11, marginBottom: 3 },
});
