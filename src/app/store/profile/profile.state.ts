import { User } from '../../util/models';

export interface ProfileState {
  profile: User | null;
  loading: boolean;
  error: any;
}

export const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null
}; 