import { MonthlyData } from '../types';

const STORAGE_KEY = 'de_restaurant_data_v1';

export const saveAllData = (data: MonthlyData[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data', error);
  }
};

export const loadAllData = (): MonthlyData[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Failed to load data', error);
    return [];
  }
};
