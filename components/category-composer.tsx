import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ActionButton } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import type { CategoryType } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

export function CategoryComposer({ visible, initialType = "expense", onClose, onCreated }: { visible: boolean; initialType?: CategoryType; onClose: () => void; onCreated?: (id: string) => void }) {
  const { addCategory } = useBudgetStore();
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>(initialType);
  const [error, setError] = useState("");

  const save = () => {
    if (!name.trim()) {
      setError("Give your category a name.");
      return;
    }
    const category = addCategory(name, type);
    if (!category) return;
    onCreated?.(category.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Close category dialog" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.iconBubble}><Ionicons name="pricetag-outline" size={20} color={palette.mint} /></View>
          <Text style={styles.title}>New category</Text>
          <Text style={styles.subtitle}>Make a place for the things you spend or earn.</Text>
          <View style={styles.segment}>
            {(["expense", "income"] as const).map((option) => (
              <Pressable key={option} accessibilityRole="button" onPress={() => setType(option)} style={[styles.segmentItem, type === option && (option === "expense" ? styles.expense : styles.income)]}>
                <Text style={[styles.segmentLabel, type === option && styles.activeLabel]}>{option === "expense" ? "Expense" : "Income"}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput accessibilityLabel="Category name" value={name} onChangeText={setName} placeholder="e.g. Pet care" placeholderTextColor={palette.dim} autoFocus selectionColor={palette.mint} returnKeyType="done" onSubmitEditing={save} style={styles.input} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <ActionButton label="Create category" icon="add" onPress={save} />
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Not now</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 22, backgroundColor: "rgba(3,8,18,0.75)" },
  dialog: { width: "100%", maxWidth: 430, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 23, padding: 22, gap: 14 },
  iconBubble: { width: 43, height: 43, backgroundColor: palette.mintWash, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { color: palette.text, fontFamily: typeface.bold, fontSize: 21, marginBottom: -8 },
  subtitle: { color: palette.muted, fontFamily: typeface.regular, fontSize: 12, lineHeight: 18 },
  segment: { flexDirection: "row", padding: 4, borderRadius: 13, backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line },
  segmentItem: { flex: 1, height: 37, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  expense: { backgroundColor: palette.coral },
  income: { backgroundColor: palette.mint },
  segmentLabel: { color: palette.muted, fontFamily: typeface.medium, fontSize: 12 },
  activeLabel: { color: palette.background, fontFamily: typeface.semibold },
  input: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.background, color: palette.text, fontFamily: typeface.regular, fontSize: 13, paddingHorizontal: 13 },
  error: { color: palette.coral, fontFamily: typeface.medium, fontSize: 11 },
  cancel: { minHeight: 31, justifyContent: "center", alignItems: "center" },
  cancelText: { color: palette.muted, fontFamily: typeface.medium, fontSize: 12 },
});
