import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { TransactionComposer } from "@/components/transaction-composer";
import { ActionButton, BrandHeader, MonthSelector, PageScroll, PageTitle, TransactionRow } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import { formatCurrency, type Transaction } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

const FILTERS = ["all", "expense", "income"] as const;
type Filter = (typeof FILTERS)[number];

export default function TransactionsScreen() {
  const { data, selectedMonth, addTransaction, updateTransaction, removeTransaction } = useBudgetStore();
  const [filter, setFilter] = useState<Filter>("all");
  const [composerVisible, setComposerVisible] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const monthTransactions = useMemo(
    () => data.transactions
      .filter((item) => item.date.slice(0, 7) === selectedMonth && (filter === "all" || item.type === filter))
      .sort((left, right) => right.date.localeCompare(left.date)),
    [data.transactions, filter, selectedMonth],
  );
  const income = monthTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);

  const startEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setComposerVisible(true);
  };

  const closeComposer = () => {
    setComposerVisible(false);
    setEditing(null);
  };

  return (
    <>
      <PageScroll contentContainerStyle={styles.pageContent}>
        <BrandHeader actionLabel="Add" onAction={() => { setEditing(null); setComposerVisible(true); }} />
        <PageTitle title="Activity" subtitle="Every in and out, in one place." />
        <MonthSelector />

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLabel}><Ionicons name="arrow-down" size={13} color={palette.mint} /><Text style={styles.label}>IN</Text></View>
            <Text style={[styles.summaryValue, { color: palette.mint }]}>{formatCurrency(income)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLabel}><Ionicons name="arrow-up" size={13} color={palette.coral} /><Text style={styles.label}>OUT</Text></View>
            <Text style={[styles.summaryValue, { color: palette.text }]}>{formatCurrency(expenses)}</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {FILTERS.map((option) => {
            const active = option === filter;
            return (
              <Pressable key={option} accessibilityRole="button" onPress={() => setFilter(option)} style={[styles.filter, active && styles.activeFilter]}>
                <Text style={[styles.filterLabel, active && styles.activeFilterLabel]}>{option === "all" ? "All" : option === "expense" ? "Expenses" : "Income"}</Text>
              </Pressable>
            );
          })}
        </View>

        {monthTransactions.length > 0 ? (
          <View style={styles.listCard}>
            <View style={styles.listHeader}><Text style={styles.listTitle}>Transactions</Text><Text style={styles.count}>{monthTransactions.length} {monthTransactions.length === 1 ? "entry" : "entries"}</Text></View>
            {monthTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                category={data.categories.find((item) => item.id === transaction.categoryId)}
                onEdit={() => startEdit(transaction)}
                onDelete={() => setPendingDelete(transaction)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Ionicons name="swap-horizontal" size={21} color={palette.mint} /></View>
            <Text style={styles.emptyTitle}>Nothing logged this month.</Text>
            <Text style={styles.emptyText}>Add income or an expense to start your local ledger.</Text>
            <ActionButton label="Add transaction" icon="add" onPress={() => { setEditing(null); setComposerVisible(true); }} compact />
          </View>
        )}
      </PageScroll>

      {composerVisible ? (
        <TransactionComposer
          visible
          transaction={editing}
          onClose={closeComposer}
          onSave={(input) => {
            if (editing) updateTransaction(editing.id, input);
            else addTransaction(input);
            closeComposer();
          }}
        />
      ) : null}
      <ConfirmationDialog
        visible={pendingDelete !== null}
        title="Remove this transaction?"
        message="This removes the entry from this device’s local ledger. This can’t be undone."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => { if (pendingDelete) removeTransaction(pendingDelete.id); setPendingDelete(null); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pageContent: { gap: 19, paddingTop: 15, paddingBottom: 34 },
  summaryRow: { flexDirection: "row", gap: 11 },
  summaryCard: { flex: 1, minWidth: 0, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 17, padding: 14, gap: 8 },
  summaryLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { color: palette.muted, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1.1 },
  summaryValue: { color: palette.text, fontFamily: typeface.semibold, fontSize: 21, letterSpacing: -0.4 },
  filters: { flexDirection: "row", gap: 8 },
  filter: { minHeight: 36, paddingHorizontal: 13, borderRadius: 12, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  activeFilter: { backgroundColor: palette.mintWash, borderColor: "#2D6964" },
  filterLabel: { color: palette.muted, fontFamily: typeface.medium, fontSize: 11 },
  activeFilterLabel: { color: palette.mint, fontFamily: typeface.semibold },
  listCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 19, paddingHorizontal: 13, paddingTop: 15, paddingBottom: 4 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 3, paddingBottom: 5 },
  listTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 14 },
  count: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10 },
  emptyCard: { minHeight: 260, backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 21, justifyContent: "center", alignItems: "center", padding: 22, gap: 10 },
  emptyIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: palette.mintWash, justifyContent: "center", alignItems: "center", marginBottom: 2 },
  emptyTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 15 },
  emptyText: { maxWidth: 265, color: palette.muted, fontFamily: typeface.regular, fontSize: 12, lineHeight: 18, textAlign: "center", marginBottom: 4 },
});
