import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, Timestamp } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

export interface Goal {
    goalId: string;
    userId: string;
    title: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Timestamp;
}

@Injectable({
    providedIn: 'root'
})
export class GoalsService {

    constructor(private firestore: Firestore, private auth: Auth) { }

    // 🔹 Create a new goal
    async createGoal(userId: string, goal: Goal): Promise<void> {
        const goalRef = doc(this.firestore, `users/${userId}/goals/${goal.goalId}`);
        await setDoc(goalRef, {
            ...goal,
            deadline: Timestamp.fromDate(new Date(goal.deadline.toDate())),
            currentAmount: 0, // Initialize currentAmount to 0
        });
    }

    // 🔹 Get all goals for a user
    getGoals(userId: string): Observable<Goal[]> {
        const goalsRef = collection(this.firestore, `users/${userId}/goals`);
        return new Observable<Goal[]>(observer => {
            getDocs(goalsRef).then(querySnapshot => {
                const goals: Goal[] = [];
                querySnapshot.forEach(doc => {
                    goals.push(doc.data() as Goal);
                });
                observer.next(goals);
            });
        });
    }

    // 🔹 Get a single goal by its ID
    async getGoal(userId: string, goalId: string): Promise<Goal | undefined> {
        const goalRef = doc(this.firestore, `users/${userId}/goals/${goalId}`);
        const goalSnap = await getDoc(goalRef);
        if (goalSnap.exists()) {
            return goalSnap.data() as Goal;
        }
        return undefined;
    }

    // 🔹 Update an existing goal
    async updateGoal(userId: string, goalId: string, updatedGoal: Partial<Goal>): Promise<void> {
        const goalRef = doc(this.firestore, `users/${userId}/goals/${goalId}`);
        await updateDoc(goalRef, updatedGoal);
    }

    // 🔹 Delete a goal
    async deleteGoal(userId: string, goalId: string): Promise<void> {
        const goalRef = doc(this.firestore, `users/${userId}/goals/${goalId}`);
        await deleteDoc(goalRef);
    }

    // 🔹 Update the current amount for a goal
    async updateCurrentAmount(userId: string, goalId: string, amount: number): Promise<void> {
        const goalRef = doc(this.firestore, `users/${userId}/goals/${goalId}`);
        const goalSnap = await getDoc(goalRef);
        if (goalSnap.exists()) {
            const currentAmount = goalSnap.data()?.['currentAmount'] || 0;
            const newAmount = currentAmount + amount;
            await updateDoc(goalRef, { currentAmount: newAmount });
        }
    }
}
