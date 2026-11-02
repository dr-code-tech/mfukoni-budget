import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { DEFAULT_CATEGORIES, STORAGE_KEY, type BudgetData } from "@/lib/budget-model";

export function emptyBudgetData(): BudgetData {
  return { categories: DEFAULT_CATEGORIES, transactions: [], budgets: [] };
}

function isBudgetData(value: unknown): value is BudgetData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<BudgetData>;
  return Array.isArray(data.categories) && Array.isArray(data.transactions) && Array.isArray(data.budgets);
}

export async function loadBudgetData(): Promise<BudgetData> {
  try {
    const raw =
      Platform.OS === "web"
        ? typeof window !== "undefined"
          ? window.localStorage.getItem(STORAGE_KEY)
          : null
        : await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyBudgetData();
    const parsed: unknown = JSON.parse(raw);
    if (!isBudgetData(parsed)) return emptyBudgetData();
    return {
      ...parsed,
      categories: parsed.categories.length > 0 ? parsed.categories : DEFAULT_CATEGORIES,
    };
  } catch {
    return emptyBudgetData();
  }
}

export async function saveBudgetData(data: BudgetData): Promise<void> {
  const serialized = JSON.stringify(data);
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, serialized);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, serialized);
}
