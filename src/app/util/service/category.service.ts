import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Category } from 'src/app/util/models';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    constructor(private firestore: Firestore) { }

    private getUserCategoriesCollection(userId: string) {
        return collection(this.firestore, `users/${userId}/categories`);
    }

    /** Get all categories */
    getCategories(userId: string): Observable<Category[]> {
        const categoriesRef = this.getUserCategoriesCollection(userId); // Ensure userId is passed
        return new Observable<Category[]>(observer => {
            getDocs(categoriesRef).then(querySnapshot => {
                const categories: Category[] = [];
                querySnapshot.forEach(doc => {
                    const data:any = doc.data();
                    // Handle existing categories that might not have icon or color field
                    const category: Category = {
                        id: doc.id,
                        name: data?.name,
                        type: data?.type,
                        icon: data?.icon || 'category',
                        color: data?.color || '#46777f', // Default blue color
                        createdAt: data?.createdAt,
                        // Budget-related fields
                        hasBudget: data?.hasBudget || false,
                        budgetAmount: data?.budgetAmount || 0,
                        budgetPeriod: data?.budgetPeriod || 'monthly',
                        budgetStartDate: data?.budgetStartDate || null,
                        budgetEndDate: data?.budgetEndDate || null,
                        budgetSpent: data?.budgetSpent || 0,
                        budgetRemaining: data?.budgetRemaining || 0,
                        budgetProgressPercentage: data?.budgetProgressPercentage || 0,
                        budgetAlertThreshold: data?.budgetAlertThreshold || 80,
                        budgetAlertEnabled: data?.budgetAlertEnabled !== false
                    };
                    categories.push(category);
                });
                observer.next(categories);
                observer.complete(); // Complete the observable to prevent memory leaks
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    createCategory(userId: string, name: string, type: 'income' | 'expense', icon: string, color: string): Observable<void> {
        return new Observable<void>(observer => {
            addDoc(this.getUserCategoriesCollection(userId), {
                name,
                type,
                icon,
                color,
                createdAt: Date.now()
            }).then(() => {
                observer.next();
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    /** Update a category */
    updateCategory(userId: string, categoryId: string, name: string, type: 'income' | 'expense', icon: string, color: string, budgetData?: any): Observable<void> {
        return new Observable<void>(observer => {
            const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
            
            const updateData: any = { name, type, icon, color };
            
            // Add budget data if provided
            if (budgetData) {
                updateData.hasBudget = budgetData.hasBudget;
                updateData.budgetAmount = budgetData.budgetAmount;
                updateData.budgetPeriod = budgetData.budgetPeriod;
                updateData.budgetStartDate = budgetData.budgetStartDate || null;
                updateData.budgetEndDate = budgetData.budgetEndDate || null;
                updateData.budgetSpent = budgetData.budgetSpent;
                updateData.budgetRemaining = budgetData.budgetRemaining;
                updateData.budgetProgressPercentage = budgetData.budgetProgressPercentage;
                updateData.budgetAlertThreshold = budgetData.budgetAlertThreshold;
                updateData.budgetAlertEnabled = budgetData.budgetAlertEnabled;
            }
            
            updateDoc(categoryRef, updateData).then(() => {
                observer.next();
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    /** Delete a category */
    deleteCategory(userId: string, categoryId: string): Observable<void> {
        return new Observable<void>(observer => {
            const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
            deleteDoc(categoryRef).then(() => {
                observer.next();
                observer.complete();
            }).catch(error => {
                observer.error(error);
            });
        });
    }
}
