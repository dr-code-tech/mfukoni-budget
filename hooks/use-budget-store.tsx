import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import {
  CATEGORY_PALETTE,
  currentMonthKey,
  DEFAULT_CURRENCY,
  makeId,
  normalizeCurrencyCode,
  setCurrencyCode,
  type Budget,
  type BudgetData,
  type Category,
  type CategoryType,
  type CsvImportDraft,
  type Transaction,
  type TransactionInput,
} from "@/lib/budget-model";
import { emptyBudgetData, loadBudgetData, saveBudgetData } from "@/lib/budget-storage";
import { palette, typeface } from "@/lib/budget-theme";

type BudgetStoreValue = {
  data: BudgetData;
  currency: string;
  selectedMonth: string;
  hydrated: boolean;
  setSelectedMonth: (month: string) => void;
  setCurrency: (currency: string) => void;
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, input: TransactionInput) => void;
  removeTransaction: (id: string) => void;
  setBudget: (month: string, categoryId: string, amount: number) => void;
  addCategory: (name: string, type: CategoryType) => Category | null;
  importDraft: (draft: CsvImportDraft) => { transactions: number; budgets: number };
};

const BudgetStoreContext = createContext<BudgetStoreValue | null>(null);

export function BudgetStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BudgetData>(emptyBudgetData);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [hydrated, setHydrated] = useState(false);
  const [currency, setCurrencyState] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    let active = true;
    void loadBudgetData().then((saved) => {
      if (!active) return;
      setData(saved);
      setCurrencyState(normalizeCurrencyCode(saved.currency));
      setCurrencyCode(saved.currency);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) void saveBudgetData(data).catch(() => undefined);
  }, [data, hydrated]);

  useEffect(() => {
    const nextCurrency = normalizeCurrencyCode(data.currency ?? currency);
    setCurrencyState(nextCurrency);
    setCurrencyCode(nextCurrency);
  }, [data, currency]);

  const setCurrency = useCallback((nextCurrency: string) => {
    const normalized = normalizeCurrencyCode(nextCurrency);
    setCurrencyState(normalized);
    setCurrencyCode(normalized);
    setData((current) => ({ ...current, currency: normalized }));
  }, []);

  const addTransaction = useCallback((input: TransactionInput) => {
    const transaction: Transaction = { ...input, id: makeId() };
    setData((current) => ({ ...current, transactions: [transaction, ...current.transactions] }));
    return transaction;
  }, []);

  const updateTransaction = useCallback((id: string, input: TransactionInput) => {
    setData((current) => ({
      ...current,
      transactions: current.transactions.map((item) => (item.id === id ? { ...input, id } : item)),
    }));
  }, []);

  const removeTransaction = useCallback((id: string) => {
    setData((current) => ({ ...current, transactions: current.transactions.filter((item) => item.id !== id) }));
  }, []);

  const setBudget = useCallback((month: string, categoryId: string, amount: number) => {
    setData((current) => {
      const existing = current.budgets.find((item) => item.month === month && item.categoryId === categoryId);
      if (amount <= 0) {
        return {
          ...current,
          budgets: current.budgets.filter((item) => item.month !== month || item.categoryId !== categoryId),
        };
      }
      if (existing) {
        return {
          ...current,
          budgets: current.budgets.map((item) =>
            item.id === existing.id ? { ...item, amount } : item,
          ),
        };
      }
      const budget: Budget = { id: makeId(), month, categoryId, amount };
      return { ...current, budgets: [...current.budgets, budget] };
    });
  }, []);

  const addCategory = useCallback((name: string, type: CategoryType) => {
    const normalized = name.trim();
    if (!normalized) return null;
    const existing = data.categories.find(
      (item) => item.type === type && item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
    );
    if (existing) return existing;
    const colorIndex = data.categories.filter((item) => item.type === type).length % CATEGORY_PALETTE.length;
    const category: Category = {
      id: `category-${makeId()}`,
      name: normalized,
      type,
      color: CATEGORY_PALETTE[colorIndex] ?? "#A7B2C7",
    };
    setData((current) => {
      const duplicate = current.categories.find(
        (item) => item.type === type && item.name.toLocaleLowerCase() === normalized.toLocaleLowerCase(),
      );
      return duplicate ? current : { ...current, categories: [...current.categories, category] };
    });
    return category;
  }, [data.categories]);

  const importDraft = useCallback((draft: CsvImportDraft) => {
    setData((current) => {
      const categories = [...current.categories];
      const mappedIds = new Map<string, string>();
      const findCategory = (name: string, type: CategoryType) =>
        categories.find(
          (item) => item.type === type && item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
        );

      for (const staged of draft.newCategories) {
        const existing = findCategory(staged.name, staged.type);
        if (existing) {
          mappedIds.set(staged.id, existing.id);
        } else {
          const category = { ...staged, id: `category-${makeId()}` };
          categories.push(category);
          mappedIds.set(staged.id, category.id);
        }
      }

      const imported = draft.transactions.map((item) => ({
        ...item,
        id: makeId(),
        categoryId: mappedIds.get(item.categoryId) ?? item.categoryId,
      }));
      const nextBudgets = [...current.budgets];
      for (const item of draft.budgets) {
        const categoryId = mappedIds.get(item.categoryId) ?? item.categoryId;
        const existingIndex = nextBudgets.findIndex(
          (candidate) => candidate.month === item.month && candidate.categoryId === categoryId,
        );
        const budget: Budget = {
          id: existingIndex >= 0 ? nextBudgets[existingIndex]?.id ?? makeId() : makeId(),
          ...item,
          categoryId,
        };
        if (existingIndex >= 0) nextBudgets[existingIndex] = budget;
        else nextBudgets.push(budget);
      }

      return {
        categories,
        transactions: [...imported, ...current.transactions],
        budgets: nextBudgets,
      };
    });
    return { transactions: draft.transactions.length, budgets: draft.budgets.length };
  }, []);

  const value = useMemo<BudgetStoreValue>(
    () => ({
      data,
      currency,
      selectedMonth,
      hydrated,
      setSelectedMonth,
      setCurrency,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setBudget,
      addCategory,
      importDraft,
    }),
    [
      data,
      currency,
      selectedMonth,
      hydrated,
      setCurrency,
      addTransaction,
      updateTransaction,
      removeTransaction,
      setBudget,
      addCategory,
      importDraft,
    ],
  );

  return (
    <BudgetStoreContext.Provider value={value}>
      {hydrated ? children : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: palette.background }}>
          <ActivityIndicator color={palette.mint} />
          <Text style={{ color: palette.muted, fontFamily: typeface.medium, fontSize: 12 }}>Opening your local ledger…</Text>
        </View>
      )}
    </BudgetStoreContext.Provider>
  );
}

export function useBudgetStore(): BudgetStoreValue {
  const value = useContext(BudgetStoreContext);
  if (!value) throw new Error("useBudgetStore must be used inside BudgetStoreProvider.");
  return value;
}
