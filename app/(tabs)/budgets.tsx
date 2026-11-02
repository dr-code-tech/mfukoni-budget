import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { CategoryComposer } from "@/components/category-composer";
import { BrandHeader, MonthSelector, PageScroll, PageTitle, ProgressTrack } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import { formatCurrency, getBudgetMetrics, getCategorySpending, type Category } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

export default function BudgetsScreen() {
  const { data, selectedMonth, setBudget } = useBudgetStore();
  const [categoryComposerVisible, setCategoryComposerVisible] = useState(false);
  const metrics = useMemo(() => getBudgetMetrics(data, selectedMonth), [data, selectedMonth]);
  const spending = useMemo(() => getCategorySpending(data, selectedMonth), [data, selectedMonth]);
  const byCategory = new Map(spending.map((item) => [item.category.id, item]));
  const expenseCategories = data.categories.filter((item) => item.type === "expense");
  const activeBudgetCount = data.budgets.filter((item) => item.month === selectedMonth && item.amount > 0).length;

  return (
    <>
      <PageScroll contentContainerStyle={styles.pageContent}>
        <BrandHeader actionLabel="Category" onAction={() => setCategoryComposerVisible(true)} />
        <PageTitle title="Your budgets" subtitle="Set a soft limit. Leave room for real life." />
        <MonthSelector />

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.eyebrow}>BUDGET LEFT THIS MONTH</Text>
              <Text style={[styles.leftValue, { color: metrics.remaining < 0 ? palette.coral : palette.mint }]}>{formatCurrency(metrics.remaining)}</Text>
            </View>
            <View style={styles.planIcon}><Ionicons name="pie-chart" size={19} color={palette.mint} /></View>
          </View>
          <View style={styles.summaryFoot}>
            <Text style={styles.summaryFootText}>{formatCurrency(metrics.expenses)} spent</Text>
            <View style={styles.summaryDivider} />
            <Text style={styles.summaryFootText}>{formatCurrency(metrics.budget)} planned</Text>
          </View>
          <ProgressTrack value={metrics.budget > 0 ? metrics.expenses / metrics.budget : 0} color={metrics.remaining < 0 ? palette.coral : palette.mint} />
          <Text style={styles.categoryCount}>{activeBudgetCount} of {expenseCategories.length} categories have a plan</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View><Text style={styles.sectionTitle}>Category limits</Text><Text style={styles.sectionSubtitle}>Tap a category to give it a monthly target.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setCategoryComposerVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={16} color={palette.mint} /><Text style={styles.addLabel}>New</Text>
          </Pressable>
        </View>

        <View style={styles.categoryList}>
          {expenseCategories.map((category) => {
            const budgetAmount = data.budgets.find((item) => item.month === selectedMonth && item.categoryId === category.id)?.amount ?? 0;
            return (
              <BudgetRow
                key={`${category.id}-${selectedMonth}-${budgetAmount}`}
                category={category}
                budget={budgetAmount}
                spent={byCategory.get(category.id)?.spent ?? 0}
                onSave={(amount) => setBudget(selectedMonth, category.id, amount)}
              />
            );
          })}
        </View>
        <Text style={styles.localNote}><Ionicons name="lock-closed" size={12} color={palette.dim} /> These limits are saved on this device only.</Text>
      </PageScroll>
      {categoryComposerVisible ? <CategoryComposer visible initialType="expense" onClose={() => setCategoryComposerVisible(false)} /> : null}
    </>
  );
}

function BudgetRow({ category, budget, spent, onSave }: { category: Category; budget: number; spent: number; onSave: (amount: number) => void }) {
  const [value, setValue] = useState(budget > 0 ? String(budget) : "");
  const [message, setMessage] = useState("");

  const progress = budget > 0 ? Math.min(1, spent / budget) : 0;
  const remaining = budget - spent;
  const save = () => {
    const amount = value.trim() ? Number(value.replace(/[$,\s]/g, "")) : 0;
    if (!Number.isFinite(amount) || amount < 0) {
      setMessage("Enter a positive amount, or clear to remove.");
      return;
    }
    onSave(amount);
    setMessage(amount > 0 ? "Saved" : "Removed");
  };

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryTop}>
        <View style={styles.categoryIdentity}>
          <View style={[styles.categoryGlyph, { backgroundColor: `${category.color}1B` }]}>
            <Ionicons name={iconForCategory(category.name)} size={17} color={category.color} />
          </View>
          <View style={styles.categoryCopy}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categorySpent}>{formatCurrency(spent)} spent</Text>
          </View>
        </View>
        <View style={styles.amountInputWrap}>
          <Text style={styles.dollarSign}>$</Text>
          <TextInput
            accessibilityLabel={`${category.name} monthly budget`}
            value={value}
            onChangeText={(text) => { setValue(text); setMessage(""); }}
            placeholder="0"
            placeholderTextColor={palette.dim}
            keyboardType="decimal-pad"
            selectionColor={palette.mint}
            style={styles.budgetInput}
          />
        </View>
      </View>
      <ProgressTrack value={progress} color={budget > 0 && spent > budget ? palette.coral : category.color} height={5} />
      <View style={styles.categoryBottom}>
        <Text style={[styles.remainingText, budget > 0 && remaining < 0 ? { color: palette.coral } : null]}>
          {budget > 0 ? remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over` : "No limit set"}
        </Text>
        <View style={styles.saveRow}>
          {message ? <Text style={styles.savedMessage}>{message}</Text> : null}
          <Pressable accessibilityRole="button" onPress={save} style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.72 }]}>
            <Text style={styles.saveLabel}>{budget > 0 ? "Save" : "Set limit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function iconForCategory(name: string): React.ComponentProps<typeof Ionicons>["name"] {
  const key = name.toLowerCase();
  if (key.includes("dining") || key.includes("restaurant")) return "restaurant-outline";
  if (key.includes("grocer") || key.includes("food")) return "basket-outline";
  if (key.includes("home") || key.includes("rent")) return "home-outline";
  if (key.includes("transport") || key.includes("car")) return "car-outline";
  if (key.includes("health") || key.includes("medical")) return "medkit-outline";
  if (key.includes("shop")) return "bag-outline";
  if (key.includes("fun") || key.includes("entertain")) return "game-controller-outline";
  if (key.includes("utilit") || key.includes("bill")) return "flash-outline";
  return "pricetag-outline";
}

const styles = StyleSheet.create({
  pageContent: { gap: 19, paddingTop: 15, paddingBottom: 34 },
  summaryCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: "#294048", borderRadius: 22, padding: 18, gap: 14 },
  summaryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  eyebrow: { color: palette.muted, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1.1 },
  leftValue: { fontFamily: typeface.bold, fontSize: 33, letterSpacing: -0.8, marginTop: 4 },
  planIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: palette.mintWash, alignItems: "center", justifyContent: "center" },
  summaryFoot: { flexDirection: "row", alignItems: "center", gap: 9 },
  summaryFootText: { color: palette.muted, fontFamily: typeface.medium, fontSize: 11 },
  summaryDivider: { height: 13, width: 1, backgroundColor: palette.line },
  categoryCount: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10, marginTop: -8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  sectionTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 16 },
  sectionSubtitle: { color: palette.muted, fontFamily: typeface.regular, fontSize: 11, marginTop: 3 },
  addButton: { minHeight: 33, flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 10, borderRadius: 11, backgroundColor: palette.mintWash },
  addLabel: { color: palette.mint, fontFamily: typeface.semibold, fontSize: 11 },
  categoryList: { gap: 9 },
  categoryCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 14, gap: 12 },
  categoryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  categoryIdentity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  categoryGlyph: { width: 37, height: 37, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryCopy: { flex: 1, minWidth: 0, gap: 3 },
  categoryName: { color: palette.text, fontFamily: typeface.semibold, fontSize: 13 },
  categorySpent: { color: palette.muted, fontFamily: typeface.regular, fontSize: 10 },
  amountInputWrap: { width: 93, height: 39, flexDirection: "row", alignItems: "center", paddingHorizontal: 9, backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line, borderRadius: 11 },
  dollarSign: { color: palette.dim, fontFamily: typeface.regular, fontSize: 12 },
  budgetInput: { flex: 1, color: palette.text, fontFamily: typeface.semibold, fontSize: 12, textAlign: "right", paddingVertical: 0 },
  categoryBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  remainingText: { color: palette.muted, fontFamily: typeface.medium, fontSize: 10 },
  saveRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  savedMessage: { color: palette.mint, fontFamily: typeface.medium, fontSize: 9 },
  saveButton: { minHeight: 28, minWidth: 63, alignItems: "center", justifyContent: "center", paddingHorizontal: 9, borderRadius: 9, backgroundColor: palette.mintWash },
  saveLabel: { color: palette.mint, fontFamily: typeface.semibold, fontSize: 10 },
  localNote: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10, textAlign: "center" },
});
