import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, collectionData, getDocs, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Category } from 'src/app/util/models';
import { TransactionType } from '../config/enums';
import { AppState } from 'src/app/store/app.state';
import { Store } from '@ngrx/store';
import * as CategoriesActions from 'src/app/store/categories/categories.actions';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    constructor(private firestore: Firestore, private store: Store<AppState>) { }

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
                        budget: data?.budget || null,
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

    createCategory(userId: string, name: string, type: TransactionType, icon: string, color: string): Observable<void> {
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
    updateCategory(userId: string, categoryId: string, name: string, type: TransactionType, icon: string, color: string, budgetData?: any): Observable<void> {
        return new Observable<void>(observer => {
            const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
            
            const updateData: Omit<Category, 'createdAt'> = { name, type, icon, color };
            
            // Add budget data if provided
            if (budgetData) {
                updateData.budget = budgetData;
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

    updateBudgetSpent(userId: string, categoryId: string, budgetSpent: number): Observable<void> {
        return new Observable<void>(observer => {
            const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);

            getDoc(categoryRef).then(categoryData => {
                const data = categoryData.data();
                if (
                    categoryData.exists() &&
                    data &&
                    typeof data['budget'] === 'object' &&
                    data['budget'] !== null &&
                    (data['budget'] as any).hasBudget
                ) {
                    const category = data as Category;
                    if (category.budget) {
                        category.budget.budgetSpent = (category.budget.budgetSpent || 0) + budgetSpent;
                        category.budget.budgetRemaining = (category.budget.budgetAmount || 0) - category.budget.budgetSpent;
                        category.budget.budgetProgressPercentage = (category.budget.budgetSpent / (category.budget.budgetAmount || 0)   ) * 100;
                        category.budget.budgetAlertEnabled = category.budget.budgetProgressPercentage > (category.budget.budgetAlertThreshold || 0);
                        updateDoc(categoryRef, { budget: category.budget }).then(() => {
                            observer.next();
                            observer.complete();
                        }).catch(error => {
                            observer.error(error);
                        });
                        this.store.dispatch(CategoriesActions.loadCategories({ userId: userId }));
                    } else {
                        observer.error(new Error('Category budget not found'));
                    }
                } else {
                    observer.error(new Error('Category not found or has no budget'));
                }
            }).catch(error => {
                observer.error(error);
            });
                
        });
    }
}
