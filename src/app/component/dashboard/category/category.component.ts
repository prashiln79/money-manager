import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { CategoryService } from 'src/app/util/service/category.service';
import { Auth } from '@angular/fire/auth';

interface Category {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  createdAt: number;
}

@Component({
  selector: 'transaction-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss']
})
export class CategoryComponent implements OnInit {
  categories: Category[] | undefined = [];
  newCategory: Category = { name: '', type: 'expense', createdAt: Date.now() };
  userId: any;

  constructor(private categoryService: CategoryService, private auth: Auth) {
    //
  }

  ngOnInit(): void {
    this.userId = this.auth?.currentUser?.uid;
    this.getCategoryList();
  }


  getCategoryList() {
    this.categoryService.getCategories(this.userId).subscribe((resp: any) => {
      this.categories = resp;
    });
  }

  async createCategory() {
    if (this.newCategory.name) {
      await this.categoryService.createCategory(this.userId, this.newCategory.name, this.newCategory.type);
      this.newCategory.name = ''; // Reset input
      this.getCategoryList();
    }
  }

  async editCategory(category: Category) {
    const newName = prompt('Edit Category Name:', category.name);
    if (newName !== null && newName.trim() !== '') {
      await this.categoryService.updateCategory(this.userId, category.id!, newName, category.type);
    }
  }

  async deleteCategory(categoryId: any) {
    if (confirm('Are you sure you want to delete this category?')) {
      await this.categoryService.deleteCategory(this.userId, categoryId);
      this.getCategoryList();
    }
  }
}
