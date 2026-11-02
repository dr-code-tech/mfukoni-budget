import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ActionButton } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import { isValidDate, todayKey, type Category, type RecordType, type Transaction, type TransactionInput } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

export function TransactionComposer({
  visible,
  initialType = "expense",
  transaction,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialType?: RecordType;
  transaction?: Transaction | null;
  onClose: () => void;
  onSave: (input: TransactionInput) => void;
}) {
  const insets = useSafeAreaInsets();
  const { data, addCategory } = useBudgetStore();
  const [type, setType] = useState<RecordType>(transaction?.type ?? initialType);
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [date, setDate] = useState(transaction?.date ?? todayKey());
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? data.categories.find((item) => item.type === initialType)?.id ?? "",
  );
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => data.categories.filter((item) => item.type === type), [data.categories, type]);

  const createCategory = () => {
    const created = addCategory(newCategory, type);
    if (!created) {
      setError("Enter a category name first.");
      return;
    }
    setCategoryId(created.id);
    setNewCategory("");
    setShowNewCategory(false);
    setError("");
  };

  const save = () => {
    const parsedAmount = Number(amount.replace(/[$,\s]/g, ""));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!isValidDate(date)) {
      setError("Use a date in YYYY-MM-DD format.");
      return;
    }
    const chosenCategory = categories.find((item) => item.id === categoryId);
    if (!chosenCategory) {
      setError("Choose a category for this transaction.");
      return;
    }
    onSave({ type, amount: parsedAmount, date, categoryId, description: description.trim() });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close transaction form" onPress={onClose} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardWrap}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
            <View style={styles.handle} />
            <View style={styles.sheetHead}>
              <View>
                <Text style={styles.sheetTitle}>{transaction ? "Edit transaction" : "Add a transaction"}</Text>
                <Text style={styles.sheetSubtitle}>Keep it simple. You can change it later.</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              <View style={styles.segment}>
                {(["expense", "income"] as const).map((option) => {
                  const active = type === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      onPress={() => {
                        setType(option);
                        setCategoryId(data.categories.find((item) => item.type === option)?.id ?? "");
                      }}
                      style={[styles.segmentItem, active && (option === "expense" ? styles.expenseActive : styles.incomeActive)]}
                    >
                      <Ionicons name={option === "income" ? "arrow-down" : "arrow-up"} size={15} color={active ? palette.background : palette.muted} />
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{option === "expense" ? "Expense" : "Income"}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.amountField}>
                <Text style={styles.fieldLabel}>AMOUNT</Text>
                <View style={styles.amountInputRow}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    accessibilityLabel="Transaction amount"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor={palette.dim}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    selectionColor={palette.mint}
                    style={styles.amountInput}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>DATE</Text>
                <TextInput
                  accessibilityLabel="Transaction date"
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.dim}
                  autoCapitalize="none"
                  selectionColor={palette.mint}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.categoryHeader}>
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <Pressable accessibilityRole="button" onPress={() => setShowNewCategory((value) => !value)} style={styles.inlineAction}>
                  <Ionicons name="add" size={15} color={palette.mint} />
                  <Text style={styles.inlineActionText}>Add one</Text>
                </Pressable>
              </View>
              <View style={styles.categoryList}>
                {categories.map((item: Category) => {
                  const active = item.id === categoryId;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      onPress={() => setCategoryId(item.id)}
                      style={[styles.categoryChip, active && { borderColor: item.color, backgroundColor: `${item.color}1E` }]}
                    >
                      <View style={[styles.categoryDot, { backgroundColor: item.color }]} />
                      <Text style={[styles.categoryLabel, active && { color: palette.text }]}>{item.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {showNewCategory ? (
                <View style={styles.newCategoryRow}>
                  <TextInput
                    accessibilityLabel="New category name"
                    value={newCategory}
                    onChangeText={setNewCategory}
                    placeholder="Category name"
                    placeholderTextColor={palette.dim}
                    selectionColor={palette.mint}
                    returnKeyType="done"
                    onSubmitEditing={createCategory}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <Pressable accessibilityRole="button" onPress={createCategory} style={styles.addCategoryButton}>
                    <Ionicons name="checkmark" size={18} color={palette.background} />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>NOTE <Text style={styles.optional}>(OPTIONAL)</Text></Text>
                <TextInput
                  accessibilityLabel="Transaction description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What was it for?"
                  placeholderTextColor={palette.dim}
                  selectionColor={palette.mint}
                  style={styles.textInput}
                />
              </View>
              {error ? <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text> : null}
              <ActionButton label={transaction ? "Save changes" : "Save transaction"} icon="checkmark" onPress={save} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,8,18,0.72)" },
  keyboardWrap: { justifyContent: "flex-end" },
  sheet: { maxHeight: "92%", paddingHorizontal: 20, paddingTop: 11, backgroundColor: palette.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: palette.line },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 4, backgroundColor: palette.dim, marginBottom: 17 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  sheetTitle: { color: palette.text, fontFamily: typeface.bold, fontSize: 21, letterSpacing: -0.4 },
  sheetSubtitle: { color: palette.muted, fontFamily: typeface.regular, fontSize: 12, marginTop: 4 },
  closeButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: palette.raised, alignItems: "center", justifyContent: "center" },
  formContent: { gap: 16, paddingBottom: 8 },
  segment: { flexDirection: "row", padding: 4, borderRadius: 15, backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line },
  segmentItem: { flex: 1, minHeight: 42, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  expenseActive: { backgroundColor: palette.coral },
  incomeActive: { backgroundColor: palette.mint },
  segmentText: { color: palette.muted, fontFamily: typeface.medium, fontSize: 13 },
  segmentTextActive: { color: palette.background, fontFamily: typeface.semibold },
  amountField: { backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line, borderRadius: 17, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 10 },
  fieldLabel: { color: palette.dim, fontFamily: typeface.semibold, fontSize: 9, letterSpacing: 1.1 },
  amountInputRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  currencySymbol: { color: palette.mint, fontFamily: typeface.medium, fontSize: 29 },
  amountInput: { color: palette.text, fontFamily: typeface.semibold, fontSize: 29, flex: 1, paddingVertical: 1 },
  fieldRow: { gap: 7 },
  textInput: { minHeight: 46, backgroundColor: palette.background, borderRadius: 13, borderWidth: 1, borderColor: palette.line, color: palette.text, fontFamily: typeface.regular, fontSize: 13, paddingHorizontal: 13 },
  categoryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inlineAction: { flexDirection: "row", alignItems: "center", gap: 2, padding: 4 },
  inlineActionText: { color: palette.mint, fontFamily: typeface.medium, fontSize: 11 },
  categoryList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryChip: { minHeight: 34, paddingHorizontal: 10, borderRadius: 11, backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center", gap: 6 },
  categoryDot: { width: 6, height: 6, borderRadius: 6 },
  categoryLabel: { color: palette.muted, fontFamily: typeface.medium, fontSize: 11 },
  newCategoryRow: { flexDirection: "row", gap: 8 },
  addCategoryButton: { width: 46, height: 46, backgroundColor: palette.mint, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  optional: { color: palette.dim, fontFamily: typeface.regular, fontSize: 9 },
  errorText: { color: palette.coral, fontFamily: typeface.medium, fontSize: 12 },
});
