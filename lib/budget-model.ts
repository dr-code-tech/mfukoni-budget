export type RecordType = "income" | "expense";
export type CategoryType = RecordType;

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  builtIn?: boolean;
};

export type Transaction = {
  id: string;
  type: RecordType;
  amount: number;
  date: string;
  categoryId: string;
  description: string;
};

export type Budget = {
  id: string;
  month: string;
  categoryId: string;
  amount: number;
};

export type BudgetData = {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
};

export type TransactionInput = Omit<Transaction, "id">;

export type BudgetMetrics = {
  income: number;
  expenses: number;
  budget: number;
  remaining: number;
  net: number;
};

export type CategorySpending = {
  category: Category;
  spent: number;
  budget: number;
  remaining: number;
};

export type TrendPoint = {
  month: string;
  label: string;
  amount: number;
};

export type ImportError = { row: number; message: string };
export type CsvImportDraft = {
  transactions: TransactionInput[];
  budgets: Omit<Budget, "id">[];
  newCategories: Category[];
  errors: ImportError[];
  rowsSeen: number;
};

export const STORAGE_KEY = "pocket-budget:data:v1";

export const CATEGORY_PALETTE = [
  "#5EEAD4",
  "#FF826D",
  "#9C8BFF",
  "#76A9FF",
  "#F4C978",
  "#FF8DB4",
  "#82D4FF",
  "#C2D974",
  "#A7B2C7",
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "expense-dining", name: "Dining", type: "expense", color: "#FF826D", builtIn: true },
  { id: "expense-groceries", name: "Groceries", type: "expense", color: "#5EEAD4", builtIn: true },
  { id: "expense-home", name: "Home", type: "expense", color: "#9C8BFF", builtIn: true },
  { id: "expense-transport", name: "Transport", type: "expense", color: "#76A9FF", builtIn: true },
  { id: "expense-health", name: "Health", type: "expense", color: "#FF8DB4", builtIn: true },
  { id: "expense-shopping", name: "Shopping", type: "expense", color: "#F4C978", builtIn: true },
  { id: "expense-entertainment", name: "Fun", type: "expense", color: "#B09AFF", builtIn: true },
  { id: "expense-utilities", name: "Utilities", type: "expense", color: "#82D4FF", builtIn: true },
  { id: "expense-other", name: "Other", type: "expense", color: "#A7B2C7", builtIn: true },
  { id: "income-salary", name: "Salary", type: "income", color: "#5EEAD4", builtIn: true },
  { id: "income-freelance", name: "Freelance", type: "income", color: "#76A9FF", builtIn: true },
  { id: "income-investments", name: "Investments", type: "income", color: "#9C8BFF", builtIn: true },
  { id: "income-other", name: "Other income", type: "income", color: "#A7B2C7", builtIn: true },
];

export function makeId(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function shiftMonth(month: string, amount: number): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return currentMonthKey(date);
}

export function formatMonth(month: string): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, monthNumber - 1, 1),
  );
}

export function formatShortMonth(month: string): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(year, monthNumber - 1, 1),
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function getBudgetMetrics(data: BudgetData, month: string): BudgetMetrics {
  const monthTransactions = data.transactions.filter((item) => item.date.slice(0, 7) === month);
  const income = monthTransactions.reduce((sum, item) => sum + (item.type === "income" ? item.amount : 0), 0);
  const expenses = monthTransactions.reduce((sum, item) => sum + (item.type === "expense" ? item.amount : 0), 0);
  const budget = data.budgets
    .filter((item) => item.month === month)
    .reduce((sum, item) => sum + item.amount, 0);

  return { income, expenses, budget, remaining: budget - expenses, net: income - expenses };
}

export function getCategorySpending(data: BudgetData, month: string): CategorySpending[] {
  const categories = data.categories.filter((item) => item.type === "expense");
  return categories
    .map((category) => {
      const spent = data.transactions
        .filter(
          (item) => item.type === "expense" && item.date.slice(0, 7) === month && item.categoryId === category.id,
        )
        .reduce((sum, item) => sum + item.amount, 0);
      const budget = data.budgets.find(
        (item) => item.month === month && item.categoryId === category.id,
      )?.amount ?? 0;
      return { category, spent, budget, remaining: budget - spent };
    })
    .filter((item) => item.spent > 0 || item.budget > 0)
    .sort((left, right) => right.spent - left.spent || left.category.name.localeCompare(right.category.name));
}

export function getTrend(data: BudgetData, month: string, count = 6): TrendPoint[] {
  const firstMonth = shiftMonth(month, -(count - 1));
  return Array.from({ length: count }, (_, index) => {
    const key = shiftMonth(firstMonth, index);
    const amount = data.transactions
      .filter((item) => item.type === "expense" && item.date.slice(0, 7) === key)
      .reduce((sum, item) => sum + item.amount, 0);
    return { month: key, label: formatShortMonth(key), amount };
  });
}

export function getInsights(data: BudgetData, month: string): string[] {
  const categorySpending = getCategorySpending(data, month);
  const over = categorySpending
    .filter((item) => item.budget > 0 && item.spent > item.budget)
    .map((item) => {
      const percent = Math.round(((item.spent - item.budget) / item.budget) * 100);
      return `${item.category.name} is ${percent}% over budget. Consider easing up for the rest of the month.`;
    });
  const near = categorySpending
    .filter((item) => item.budget > 0 && item.spent > 0 && item.spent <= item.budget && item.spent / item.budget >= 0.8)
    .map((item) => `${item.category.name} is getting close — ${formatCurrency(item.remaining)} left in its budget.`);
  const unplanned = categorySpending
    .filter((item) => item.spent > 0 && item.budget === 0)
    .map((item) => `${item.category.name} has ${formatCurrency(item.spent)} in spending and no budget yet.`);

  const messages = [...over, ...unplanned, ...near];
  if (messages.length > 0) return messages.slice(0, 3);

  if (categorySpending.length === 0) {
    return [`No spending recorded for ${formatMonth(month)} yet. Add a transaction when money moves.`];
  }

  const budgeted = categorySpending.filter((item) => item.budget > 0);
  if (budgeted.length > 0) {
    const headroom = budgeted.reduce((sum, item) => sum + Math.max(0, item.remaining), 0);
    return [`You’re on track so far — ${formatCurrency(headroom)} remains across your category budgets.`];
  }

  return [`Your spending is adding up to ${formatCurrency(categorySpending.reduce((sum, item) => sum + item.spent, 0))}. Add a budget to set a monthly target.`];
}

export function exportCsv(data: BudgetData): string {
  const rows: string[][] = [["record_type", "date", "amount", "category", "description", "month", "budget"]];
  const categories = new Map(data.categories.map((category) => [category.id, category.name]));
  const transactions = [...data.transactions].sort((left, right) => left.date.localeCompare(right.date));
  for (const item of transactions) {
    rows.push([
      item.type,
      item.date,
      item.amount.toFixed(2),
      categories.get(item.categoryId) ?? "Other",
      item.description,
      "",
      "",
    ]);
  }
  const budgets = [...data.budgets].sort(
    (left, right) => left.month.localeCompare(right.month) || left.categoryId.localeCompare(right.categoryId),
  );
  for (const item of budgets) {
    rows.push([
      "budget",
      "",
      "",
      categories.get(item.categoryId) ?? "Other",
      "",
      item.month,
      item.amount.toFixed(2),
    ]);
  }
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index] ?? "";
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseAmount(value: string): number | null {
  const normalized = value.trim().replace(/[$,\s]/g, "");
  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function categoryKey(name: string, type: CategoryType): string {
  return `${type}:${name.trim().toLocaleLowerCase()}`;
}

export function inspectCsv(text: string, categories: Category[]): CsvImportDraft {
  const rows = parseCsv(text);
  const draft: CsvImportDraft = { transactions: [], budgets: [], newCategories: [], errors: [], rowsSeen: 0 };
  if (rows.length === 0) {
    draft.errors.push({ row: 1, message: "The CSV file is empty." });
    return draft;
  }

  const headers = rows[0]?.map((header) => header.trim().toLowerCase()) ?? [];
  const column = (name: string) => headers.indexOf(name);
  const recordColumn = column("record_type") >= 0 ? column("record_type") : column("type");
  if (recordColumn < 0 || column("category") < 0) {
    draft.errors.push({ row: 1, message: "Required columns are record_type and category." });
    return draft;
  }

  const known = new Map(categories.map((item) => [categoryKey(item.name, item.type), item]));
  const staged = new Map<string, Category>();
  const budgetRows = new Set<string>();
  const amountColumn = column("amount");
  const budgetColumn = column("budget");
  const dateColumn = column("date");
  const descriptionColumn = column("description");
  const monthColumn = column("month");
  const valueAt = (row: string[], index: number) => (index >= 0 ? (row[index] ?? "").trim() : "");

  for (let index = 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    draft.rowsSeen += 1;
    const rowNumber = index + 1;
    const recordType = valueAt(row, recordColumn).toLowerCase();
    if (recordType !== "income" && recordType !== "expense" && recordType !== "budget") {
      draft.errors.push({ row: rowNumber, message: "record_type must be income, expense, or budget." });
      continue;
    }
    const type: CategoryType = recordType === "income" ? "income" : "expense";
    const categoryName = valueAt(row, column("category"));
    if (!categoryName) {
      draft.errors.push({ row: rowNumber, message: "Category is required." });
      continue;
    }

    const key = categoryKey(categoryName, type);
    let category = known.get(key) ?? staged.get(key);
    if (!category) {
      category = {
        id: `csv-${makeId()}`,
        name: categoryName,
        type,
        color: CATEGORY_PALETTE[(known.size + staged.size) % CATEGORY_PALETTE.length] ?? "#A7B2C7",
      };
      staged.set(key, category);
    }

    if (recordType === "budget") {
      const month = valueAt(row, monthColumn);
      const amount = parseAmount(valueAt(row, budgetColumn) || valueAt(row, amountColumn));
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        draft.errors.push({ row: rowNumber, message: "A budget row needs a valid month in YYYY-MM format." });
        continue;
      }
      if (amount === null) {
        draft.errors.push({ row: rowNumber, message: "Budget amount must be a non-negative number." });
        continue;
      }
      const duplicateKey = `${month}:${category.id}`;
      if (budgetRows.has(duplicateKey)) {
        draft.errors.push({ row: rowNumber, message: "This category already has a budget row for that month in the file." });
        continue;
      }
      budgetRows.add(duplicateKey);
      draft.budgets.push({ month, categoryId: category.id, amount });
      continue;
    }

    const date = valueAt(row, dateColumn);
    const amount = parseAmount(valueAt(row, amountColumn));
    if (!isValidDate(date)) {
      draft.errors.push({ row: rowNumber, message: "Transaction date must be a real date in YYYY-MM-DD format." });
      continue;
    }
    if (amount === null || amount <= 0) {
      draft.errors.push({ row: rowNumber, message: "Transaction amount must be greater than zero." });
      continue;
    }
    draft.transactions.push({
      type,
      amount,
      date,
      categoryId: category.id,
      description: valueAt(row, descriptionColumn),
    });
  }

  const referencedCategories = new Set([
    ...draft.transactions.map((item) => item.categoryId),
    ...draft.budgets.map((item) => item.categoryId),
  ]);
  draft.newCategories = [...staged.values()].filter((item) => referencedCategories.has(item.id));
  return draft;
}
