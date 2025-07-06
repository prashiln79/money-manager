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
                        color: data?.color || '#2196F3', // Default blue color
                        createdAt: data?.createdAt
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

    async createCategory(userId: string, name: string, type: 'income' | 'expense', icon: string, color: string): Promise<void> {
        await addDoc(this.getUserCategoriesCollection(userId), {
            name,
            type,
            icon,
            color,
            createdAt: Date.now()
        });
    }

    /** Update a category */
    async updateCategory(userId: string, categoryId: string, name: string, type: 'income' | 'expense', icon: string, color: string): Promise<void> {
        const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
        await updateDoc(categoryRef, { name, type, icon, color });
    }

    /** Delete a category */
    async deleteCategory(userId: string, categoryId: string): Promise<void> {
        const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
        await deleteDoc(categoryRef);
    }
}
