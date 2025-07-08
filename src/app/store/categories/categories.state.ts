import { Category } from '../../util/models/category.model';

export interface CategoriesState {
  entities: { [id: string]: Category };
  ids: string[];
  loading: boolean;
  error: any;
}

export const initialState: CategoriesState = {
  entities: {},
  ids: [],
  loading: false,
  error: null
}; 