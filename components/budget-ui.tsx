import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { formatCurrency, formatMonth, formatShortMonth, shiftMonth, type Category, type Transaction } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";
import { useBudgetStore } from "@/hooks/use-budget-store";

export function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.page}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

export function PageScroll({ children, contentContainerStyle }: { children: React.ReactNode; contentContainerStyle?: ViewStyle }) {
  return (
    <PageFrame>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </PageFrame>
  );
}

export function BrandHeader({ actionLabel, onAction }: { actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandMark}>
        <Image
          source={Platform.OS === "web"
            ? { uri: "/manus-storage/async-images/spUvcNEEE8JnxY0VbOnJYG/image-1.webp" }
            : require("../assets/images/icon.png")}
          resizeMode="cover"
          style={styles.brandImage}
        />
      </View>
      <View style={styles.brandCopy}>
        <Text style={styles.brandName}>Mfukoni budget</Text>
        <View style={styles.localTag}>
          <View style={styles.localDot} />
          <Text style={styles.localLabel}>LOCAL ONLY</Text>
        </View>
      </View>
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} icon="add" onPress={onAction} compact />
      ) : null}
    </View>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.pageTitleBlock}>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.textAction, pressed && { opacity: 0.68 }]}>
          <Text style={styles.textActionLabel}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={palette.mint} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function MonthSelector() {
  const { selectedMonth, setSelectedMonth } = useBudgetStore();
  return (
    <View style={styles.monthSelector}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
        style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-back" size={18} color={palette.text} />
      </Pressable>
      <View style={styles.monthLabelWrap}>
        <Text style={styles.monthLabel}>{formatMonth(selectedMonth)}</Text>
        <Text style={styles.monthHint}>{formatShortMonth(selectedMonth).toUpperCase()} OVERVIEW</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next month"
        onPress={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
        style={({ pressed }) => [styles.monthArrow, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="chevron-forward" size={18} color={palette.text} />
      </Pressable>
    </View>
  );
}

export function ActionButton({
  label,
  icon,
  onPress,
  compact = false,
  variant = "primary",
  disabled = false,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: PressableProps["onPress"];
  compact?: boolean;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const backgroundColor = variant === "primary" ? palette.mint : variant === "danger" ? palette.coralWash : palette.raised;
  const foregroundColor = variant === "primary" ? palette.background : variant === "danger" ? palette.coral : palette.text;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        compact && styles.actionButtonCompact,
        { backgroundColor, opacity: disabled ? 0.44 : pressed ? 0.78 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={compact ? 16 : 18} color={foregroundColor} /> : null}
      <Text style={[styles.actionButtonLabel, compact && styles.actionButtonLabelCompact, { color: foregroundColor }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressTrack({ value, color = palette.mint, track = palette.soft, height = 7 }: { value: number; color?: string; track?: string; height?: number }) {
  const ratio = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }}>
      <View style={{ width: `${ratio * 100}%`, height: "100%", borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function EmptyState({ title, message, action, onAction, icon = "sparkles-outline" }: { title: string; message: string; action?: string; onAction?: () => void; icon?: React.ComponentProps<typeof Ionicons>["name"] }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={22} color={palette.mint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action && onAction ? <ActionButton label={action} icon="add" onPress={onAction} compact /> : null}
    </View>
  );
}

export function TransactionRow({
  transaction,
  category,
  onEdit,
  onDelete,
  showDate = true,
}: {
  transaction: Transaction;
  category?: Category;
  onEdit?: () => void;
  onDelete?: () => void;
  showDate?: boolean;
}) {
  const title = category?.name ?? "Uncategorized";
  const dateLabel = showDate
    ? new Date(`${transaction.date}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  return (
    <View style={styles.transactionRow}>
      <View style={[styles.transactionGlyph, { backgroundColor: `${category?.color ?? palette.dim}22` }]}>
        <Ionicons name={transaction.type === "income" ? "arrow-down" : "arrow-up"} size={17} color={category?.color ?? palette.muted} />
      </View>
      <View style={styles.transactionInfo}>
        <Text numberOfLines={1} style={styles.transactionName}>{transaction.description || title}</Text>
        <Text numberOfLines={1} style={styles.transactionSub}>{transaction.description ? `${title} · ${dateLabel}` : dateLabel || title}</Text>
      </View>
      <Text style={[styles.transactionAmount, transaction.type === "income" && { color: palette.mint }]}>
        {transaction.type === "income" ? "+" : "−"}{formatCurrency(transaction.amount)}
      </Text>
      {onEdit ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${title} transaction`} onPress={onEdit} style={styles.rowAction}>
          <Ionicons name="create-outline" size={17} color={palette.muted} />
        </Pressable>
      ) : null}
      {onDelete ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${title} transaction`} onPress={onDelete} style={styles.rowAction}>
          <Ionicons name="trash-outline" size={16} color={palette.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function CategoryDot({ category, size = 8 }: { category: Category; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size, backgroundColor: category.color }} />;
}

export function useGoToTab() {
  const router = useRouter();
  return (route: "transactions" | "budgets" | "data") => router.push(`/(tabs)/${route}` as never);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background, alignItems: "center" },
  content: { flex: 1, width: "100%", maxWidth: 720 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 30, gap: 20 },
  brandHeader: { flexDirection: "row", alignItems: "center", gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.mintWash, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#245452" },
  brandImage: { width: 42, height: 42, borderRadius: 14 },
  brandCopy: { flex: 1, gap: 4 },
  brandName: { color: palette.text, fontFamily: typeface.semibold, fontSize: 15, letterSpacing: -0.2 },
  localTag: { flexDirection: "row", alignItems: "center", gap: 5 },
  localDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: palette.mint },
  localLabel: { color: palette.muted, fontFamily: typeface.medium, fontSize: 9, letterSpacing: 1.1 },
  pageTitleBlock: { gap: 5, marginTop: 2 },
  pageTitle: { color: palette.text, fontFamily: typeface.bold, fontSize: 30, letterSpacing: -1.1 },
  pageSubtitle: { color: palette.muted, fontFamily: typeface.regular, fontSize: 13, lineHeight: 19 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  sectionTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 16, letterSpacing: -0.2 },
  textAction: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 5, paddingLeft: 8 },
  textActionLabel: { color: palette.mint, fontFamily: typeface.medium, fontSize: 12 },
  monthSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 16, minHeight: 58, paddingHorizontal: 8 },
  monthArrow: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: palette.raised },
  monthLabelWrap: { alignItems: "center", gap: 2 },
  monthLabel: { color: palette.text, fontFamily: typeface.semibold, fontSize: 15 },
  monthHint: { color: palette.dim, fontFamily: typeface.medium, fontSize: 9, letterSpacing: 1.1 },
  actionButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  actionButtonCompact: { minHeight: 36, paddingHorizontal: 12, borderRadius: 12 },
  actionButtonLabel: { fontFamily: typeface.semibold, fontSize: 14 },
  actionButtonLabelCompact: { fontSize: 12 },
  emptyState: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  emptyIcon: { width: 46, height: 46, backgroundColor: palette.mintWash, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  emptyTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 16 },
  emptyMessage: { color: palette.muted, fontFamily: typeface.regular, fontSize: 13, lineHeight: 20, textAlign: "center", maxWidth: 310, marginBottom: 5 },
  transactionRow: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 65, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#1C273A" },
  transactionGlyph: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  transactionInfo: { flex: 1, gap: 4, minWidth: 80 },
  transactionName: { color: palette.text, fontFamily: typeface.medium, fontSize: 13 },
  transactionSub: { color: palette.muted, fontFamily: typeface.regular, fontSize: 11 },
  transactionAmount: { color: palette.text, fontFamily: typeface.semibold, fontSize: 13 },
  rowAction: { width: 30, height: 34, alignItems: "center", justifyContent: "center" },
});
