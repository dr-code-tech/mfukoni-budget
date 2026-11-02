import { describe, expect, it } from "vitest";

import {
  DEFAULT_CATEGORIES,
  exportCsv,
  getBudgetMetrics,
  getInsights,
  inspectCsv,
  type BudgetData,
} from "../lib/budget-model";

const emptyData = (): BudgetData => ({ categories: DEFAULT_CATEGORIES, transactions: [], budgets: [] });

describe("Mfukoni budget model", () => {
  it("summarizes only the selected month and keeps budget remaining distinct from net cashflow", () => {
    const data = emptyData();
    data.transactions = [
      { id: "t1", type: "income", amount: 2400, date: "2026-10-02", categoryId: "income-salary", description: "Pay" },
      { id: "t2", type: "expense", amount: 120, date: "2026-10-03", categoryId: "expense-dining", description: "Dinner" },
      { id: "t3", type: "expense", amount: 900, date: "2026-09-30", categoryId: "expense-home", description: "Earlier month" },
    ];
    data.budgets = [{ id: "b1", month: "2026-10", categoryId: "expense-dining", amount: 200 }];

    expect(getBudgetMetrics(data, "2026-10")).toEqual({ income: 2400, expenses: 120, budget: 200, remaining: 80, net: 2280 });
  });

  it("turns a 32 percent overspend into plain-English guidance", () => {
    const data = emptyData();
    data.transactions = [{ id: "t1", type: "expense", amount: 132, date: "2026-10-05", categoryId: "expense-dining", description: "" }];
    data.budgets = [{ id: "b1", month: "2026-10", categoryId: "expense-dining", amount: 100 }];

    expect(getInsights(data, "2026-10")[0]).toContain("Dining is 32% over budget");
  });

  it("imports escaped commas and budgets while reporting an invalid date by CSV row", () => {
    const csv = [
      "record_type,date,amount,category,description,month,budget",
      'expense,2026-10-02,24.50,Dining,"Lunch, team",,',
      "income,2026-10-01,2100,Salary,Pay,,",
      "budget,,,Dining,,2026-10,300",
      "expense,2026-02-30,10,New shop,Invalid date,,",
    ].join("\r\n");

    const draft = inspectCsv(csv, DEFAULT_CATEGORIES);
    expect(draft.transactions).toHaveLength(2);
    expect(draft.transactions[0]?.description).toBe("Lunch, team");
    expect(draft.budgets).toEqual([{ month: "2026-10", categoryId: "expense-dining", amount: 300 }]);
    expect(draft.errors).toEqual([{ row: 5, message: "Transaction date must be a real date in YYYY-MM-DD format." }]);
    expect(draft.newCategories).toHaveLength(0);
  });

  it("exports both record types in one CSV and quotes descriptions safely", () => {
    const data = emptyData();
    data.transactions = [{ id: "t1", type: "expense", amount: 18.5, date: "2026-10-04", categoryId: "expense-dining", description: 'Dinner, "team"' }];
    data.budgets = [{ id: "b1", month: "2026-10", categoryId: "expense-dining", amount: 300 }];

    const exported = exportCsv(data);
    const draft = inspectCsv(exported, DEFAULT_CATEGORIES);
    expect(exported.split("\r\n")).toHaveLength(3);
    expect(draft.transactions[0]?.description).toBe('Dinner, "team"');
    expect(draft.budgets[0]?.amount).toBe(300);
    expect(draft.errors).toHaveLength(0);
  });

  it("keeps distinct imported category names separate even when their slugs would match", () => {
    const csv = [
      "record_type,date,amount,category,description,month,budget",
      "expense,2026-10-02,10,Home & Bills,First,,",
      "expense,2026-10-03,20,Home/Bills,Second,,",
    ].join("\n");

    const draft = inspectCsv(csv, DEFAULT_CATEGORIES);
    expect(draft.newCategories.map((item) => item.name)).toEqual(["Home & Bills", "Home/Bills"]);
    expect(draft.newCategories[0]?.id).not.toBe(draft.newCategories[1]?.id);
    expect(draft.transactions[0]?.categoryId).not.toBe(draft.transactions[1]?.categoryId);
  });
});
