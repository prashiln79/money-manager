import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Budget {
  budgetId: string;
  userId: string;
  category: string;   // "Groceries", "Entertainment", etc.
  limit: number;      // The budget limit
  spent: number;      // Total spent in this category (calculated field)
  startDate: Timestamp;  // Start date of the budget period
  endDate: Timestamp;    // End date of the budget period
}

@Injectable({
  providedIn: 'root'
})
export class BudgetsService {

  constructor(private firestore: Firestore, private auth: Auth) {}

  // 🔹 Create a new budget
  async createBudget(userId: string, budget: Budget): Promise<void> {
    const budgetRef = doc(this.firestore, `users/${userId}/budgets/${budget.budgetId}`);
    await setDoc(budgetRef, {
      ...budget,
      startDate: Timestamp.fromDate(new Date(budget.startDate.toDate())),
      endDate: Timestamp.fromDate(new Date(budget.endDate.toDate())),
      spent: 0, // Initialize spent to 0
    });
  }

  // 🔹 Get all budgets for a user
  getBudgets(userId: string): Observable<Budget[]> {
    const budgetsRef = collection(this.firestore, `users/${userId}/budgets`);
    return new Observable<Budget[]>(observer => {
      getDocs(budgetsRef).then(querySnapshot => {
        const budgets: Budget[] = [];
        querySnapshot.forEach(doc => {
          budgets.push(doc.data() as Budget);
        });
        observer.next(budgets);
      });
    });
  }

  // 🔹 Get a single budget by its ID
  async getBudget(userId: string, budgetId: string): Promise<Budget | undefined> {
    const budgetRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
    const budgetSnap = await getDoc(budgetRef);
    if (budgetSnap.exists()) {
      return budgetSnap.data() as Budget;
    }
    return undefined;
  }

  // 🔹 Update an existing budget
  async updateBudget(userId: string, budgetId: string, updatedBudget: Partial<Budget>): Promise<void> {
    const budgetRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
    await updateDoc(budgetRef, updatedBudget);
  }

  // 🔹 Delete a budget
  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const budgetRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
    await deleteDoc(budgetRef);
  }

  // 🔹 Update the spent amount for a budget
  async updateSpent(userId: string, budgetId: string, amount: number): Promise<void> {
    const budgetRef = doc(this.firestore, `users/${userId}/budgets/${budgetId}`);
    const budgetSnap = await getDoc(budgetRef);
    if (budgetSnap.exists()) {
      const currentSpent = budgetSnap.data()?.['spent'] || 0;
      const newSpent = currentSpent + amount;
      await updateDoc(budgetRef, { spent: newSpent });
    }
  }
}
