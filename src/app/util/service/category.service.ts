import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';

interface Category {
    id?: string;
    name: string;
    type: 'income' | 'expense';
    createdAt: number;
}

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
                    categories.push({ id: doc.id, ...doc.data() } as Category);
                });
                observer.next(categories);
                observer.complete(); // Complete the observable to prevent memory leaks
            }).catch(error => {
                observer.error(error);
            });
        });
    }

    /** Create a new category */
    async createCategory(userId: string, name: string, type: 'income' | 'expense'): Promise<void> {
        await addDoc(this.getUserCategoriesCollection(userId), {
            name,
            type,
            createdAt: Date.now()
        });
    }

    /** Update a category */
    async updateCategory(userId: string, categoryId: string, name: string, type: 'income' | 'expense'): Promise<void> {
        const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
        await updateDoc(categoryRef, { name, type });
    }

    /** Delete a category */
    async deleteCategory(userId: string, categoryId: string): Promise<void> {
        const categoryRef = doc(this.firestore, `users/${userId}/categories/${categoryId}`);
        await deleteDoc(categoryRef);
    }
}
