import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton } from "@/components/budget-ui";
import { palette, typeface } from "@/lib/budget-theme";

export function ConfirmationDialog({ visible, title, message, onCancel, onConfirm, confirmLabel = "Delete" }: { visible: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void; confirmLabel?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Cancel" onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View style={styles.dialog}>
          <View style={styles.iconBubble}><Ionicons name="alert-circle-outline" size={23} color={palette.coral} /></View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.cancel}><Text style={styles.cancelLabel}>Keep it</Text></Pressable>
            <View style={styles.confirm}><ActionButton label={confirmLabel} icon="trash-outline" onPress={onConfirm} variant="danger" /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 22, backgroundColor: "rgba(3,8,18,0.76)" },
  dialog: { width: "100%", maxWidth: 400, backgroundColor: palette.surface, borderColor: palette.line, borderWidth: 1, borderRadius: 23, padding: 22, gap: 13 },
  iconBubble: { width: 44, height: 44, backgroundColor: palette.coralWash, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { color: palette.text, fontFamily: typeface.bold, fontSize: 19 },
  message: { color: palette.muted, fontFamily: typeface.regular, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 5 },
  cancel: { minHeight: 44, flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: palette.raised, borderRadius: 14 },
  cancelLabel: { color: palette.text, fontFamily: typeface.semibold, fontSize: 12 },
  confirm: { flex: 1 },
});
