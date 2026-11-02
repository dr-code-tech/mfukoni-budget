import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { ActionButton, BrandHeader, PageScroll, PageTitle } from "@/components/budget-ui";
import { useBudgetStore } from "@/hooks/use-budget-store";
import { exportCsv, inspectCsv, type CsvImportDraft } from "@/lib/budget-model";
import { palette, typeface } from "@/lib/budget-theme";

export default function DataScreen() {
  const { data, importDraft } = useBudgetStore();
  const [draft, setDraft] = useState<CsvImportDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const chooseCsv = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel", "public.comma-separated-values-text"],
        copyToCacheDirectory: true,
        multiple: false,
        base64: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const text = Platform.OS === "web" && asset.file
        ? await asset.file.text()
        : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
      setDraft(inspectCsv(text, data.categories));
      setMessage(`Ready to review ${asset.name}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn’t read that CSV file. Try another one.");
    } finally {
      setBusy(false);
    }
  };

  const downloadCsv = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const csv = exportCsv(data);
      const filename = `mfukoni-budget-${new Date().toISOString().slice(0, 10)}.csv`;
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        setMessage("Your CSV export is ready.");
      } else {
        const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!directory) throw new Error("No local folder is available to create the export.");
        const uri = `${directory}${filename}`;
        await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn’t available on this device.");
        await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "Export Mfukoni budget data", UTI: "public.comma-separated-values-text" });
        setMessage("Your local CSV export is ready to share.");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Couldn’t create the CSV export.");
    } finally {
      setBusy(false);
    }
  };

  const acceptImport = () => {
    if (!draft) return;
    const summary = importDraft(draft);
    setMessage(`Imported ${summary.transactions} transactions and ${summary.budgets} budgets. Valid rows were added; existing matching budgets were updated.`);
    setDraft(null);
  };

  const validCount = draft ? draft.transactions.length + draft.budgets.length : 0;

  return (
    <PageScroll contentContainerStyle={styles.pageContent}>
      <BrandHeader />
      <PageTitle title="Your data" subtitle="Private by default. Your numbers stay on this device." />

      <View style={styles.privacyCard}>
        <View style={styles.privacyIcon}><Ionicons name="lock-closed" size={19} color={palette.mint} /></View>
        <View style={styles.privacyCopy}>
          <Text style={styles.privacyTitle}>Stored here, not in an account.</Text>
          <Text style={styles.privacyText}>Mfukoni budget keeps your records in this browser or on this phone. Nothing is sent to a budget server.</Text>
        </View>
      </View>

      <View style={styles.actionCard}>
        <View style={styles.cardIntro}>
          <View style={styles.cardIcon}><Ionicons name="download-outline" size={18} color={palette.mint} /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Bring in a CSV</Text><Text style={styles.cardDescription}>Review valid rows and errors before importing.</Text></View>
        </View>
        <ActionButton label={busy ? "Working…" : "Choose CSV file"} icon="document-outline" onPress={chooseCsv} disabled={busy} />
        {draft ? (
          <View style={styles.preview}>
            <View style={styles.previewHeading}>
              <Text style={styles.previewTitle}>Import preview</Text>
              <Pressable accessibilityRole="button" onPress={() => setDraft(null)} style={styles.closePreview}><Ionicons name="close" size={17} color={palette.muted} /></Pressable>
            </View>
            <Text style={styles.previewSummary}>{validCount} valid row{validCount === 1 ? "" : "s"} · {draft.errors.length} issue{draft.errors.length === 1 ? "" : "s"} · {draft.newCategories.length} new categor{draft.newCategories.length === 1 ? "y" : "ies"}</Text>
            {draft.errors.length > 0 ? (
              <View style={styles.errorList}>
                {draft.errors.slice(0, 5).map((item, index) => (
                  <View key={`${item.row}-${index}`} style={styles.errorRow}><Text style={styles.errorRowNum}>Row {item.row}</Text><Text style={styles.errorRowText}>{item.message}</Text></View>
                ))}
                {draft.errors.length > 5 ? <Text style={styles.moreErrors}>+{draft.errors.length - 5} more issues in the file</Text> : null}
              </View>
            ) : <Text style={styles.cleanRows}>All rows look good. You can import them now.</Text>}
            <ActionButton label={`Import ${validCount} valid row${validCount === 1 ? "" : "s"}`} icon="checkmark" onPress={acceptImport} disabled={validCount === 0} />
            <Pressable accessibilityRole="button" onPress={() => setDraft(null)} style={styles.cancelImport}><Text style={styles.cancelImportLabel}>Cancel import</Text></Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.actionCard}>
        <View style={styles.cardIntro}>
          <View style={[styles.cardIcon, { backgroundColor: "#203149" }]}><Ionicons name="share-outline" size={18} color={palette.blue} /></View>
          <View style={styles.cardCopy}><Text style={styles.cardTitle}>Take your data with you</Text><Text style={styles.cardDescription}>Export every transaction and monthly budget to one CSV file.</Text></View>
        </View>
        <ActionButton label={busy ? "Working…" : "Export all data"} icon="arrow-down-outline" onPress={downloadCsv} variant="secondary" disabled={busy} />
      </View>

      <View style={styles.formatCard}>
        <View style={styles.formatHeading}><Ionicons name="code-slash-outline" size={16} color={palette.mint} /><Text style={styles.formatTitle}>CSV format</Text></View>
        <Text style={styles.formatText}>One file can hold both record types. Transaction rows use <Text style={styles.code}>record_type</Text> (income or expense), <Text style={styles.code}>date</Text>, <Text style={styles.code}>amount</Text>, <Text style={styles.code}>category</Text>, and optional <Text style={styles.code}>description</Text>. Budget rows use <Text style={styles.code}>record_type=budget</Text>, <Text style={styles.code}>month</Text> (YYYY-MM), <Text style={styles.code}>category</Text>, and <Text style={styles.code}>budget</Text>.</Text>
      </View>

      {message ? <View style={styles.notice}><Ionicons name="checkmark-circle" size={17} color={palette.mint} /><Text style={styles.noticeText}>{message}</Text></View> : null}
      {error ? <View style={styles.errorNotice}><Ionicons name="alert-circle" size={17} color={palette.coral} /><Text style={styles.errorNoticeText}>{error}</Text></View> : null}
      <Text style={styles.footerNote}>{data.transactions.length} transaction{data.transactions.length === 1 ? "" : "s"} · {data.budgets.length} saved budget{data.budgets.length === 1 ? "" : "s"} · local storage</Text>
    </PageScroll>
  );
}

const styles = StyleSheet.create({
  pageContent: { gap: 17, paddingTop: 15, paddingBottom: 34 },
  privacyCard: { flexDirection: "row", gap: 11, backgroundColor: palette.mintWash, borderWidth: 1, borderColor: "#245452", borderRadius: 18, padding: 14 },
  privacyIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: "#1B4B48", justifyContent: "center", alignItems: "center" },
  privacyCopy: { flex: 1, gap: 4 },
  privacyTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 12 },
  privacyText: { color: "#A8C3C2", fontFamily: typeface.regular, fontSize: 11, lineHeight: 16 },
  actionCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 20, padding: 16, gap: 14 },
  cardIntro: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: palette.mintWash },
  cardCopy: { flex: 1, gap: 4 },
  cardTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 14 },
  cardDescription: { color: palette.muted, fontFamily: typeface.regular, fontSize: 11, lineHeight: 16 },
  preview: { backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line, borderRadius: 15, padding: 12, gap: 10 },
  previewHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 13 },
  closePreview: { width: 27, height: 27, borderRadius: 9, backgroundColor: palette.raised, alignItems: "center", justifyContent: "center" },
  previewSummary: { color: palette.muted, fontFamily: typeface.medium, fontSize: 10 },
  errorList: { gap: 7 },
  errorRow: { flexDirection: "row", gap: 7 },
  errorRowNum: { color: palette.gold, fontFamily: typeface.semibold, fontSize: 9, width: 43 },
  errorRowText: { color: palette.muted, fontFamily: typeface.regular, fontSize: 10, flex: 1, lineHeight: 15 },
  moreErrors: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10 },
  cleanRows: { color: palette.mint, fontFamily: typeface.medium, fontSize: 11 },
  cancelImport: { alignItems: "center", paddingVertical: 3 },
  cancelImportLabel: { color: palette.muted, fontFamily: typeface.medium, fontSize: 11 },
  formatCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 18, padding: 15, gap: 9 },
  formatHeading: { flexDirection: "row", alignItems: "center", gap: 7 },
  formatTitle: { color: palette.text, fontFamily: typeface.semibold, fontSize: 12 },
  formatText: { color: palette.muted, fontFamily: typeface.regular, fontSize: 10, lineHeight: 16 },
  code: { color: palette.mint, fontFamily: typeface.medium, fontSize: 10 },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 13, backgroundColor: palette.mintWash },
  noticeText: { color: palette.mint, fontFamily: typeface.medium, fontSize: 11, flex: 1, lineHeight: 16 },
  errorNotice: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 13, backgroundColor: palette.coralWash },
  errorNoticeText: { color: palette.coral, fontFamily: typeface.medium, fontSize: 11, flex: 1, lineHeight: 16 },
  footerNote: { color: palette.dim, fontFamily: typeface.regular, fontSize: 10, textAlign: "center" },
});
