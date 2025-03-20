import { atom } from 'recoil';
import { FirebaseRoutingSetting } from '../interfaces/FirebaseModels';

export const routingsMapState = atom<FirebaseRoutingSetting[]>({
  key: 'routingsMap',
  default: [],
});
