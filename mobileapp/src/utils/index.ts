// Utility functions following Single Responsibility Principle

import { TaskinError } from '../types';

// Date utilities
export class DateUtils {
  static formatDate(date: string | Date): string {
    let d: Date;

    if (typeof date === 'string') {
      // If it's a date string in YYYY-MM-DD format, parse it carefully to avoid timezone issues
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-').map(Number);
        d = new Date(year, month - 1, day); // Create date in local timezone
      } else {
        d = new Date(date);
      }
    } else {
      d = date;
    }

    return d.toLocaleDateString('pt-BR');
  }

  static formatDateTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  }

  static isOverdue(dueDate: string): boolean {
    // Compare only dates, not times - normalize both to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse the due date properly, handling YYYY-MM-DD format
    let due: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      const [year, month, day] = dueDate.split('-').map(Number);
      due = new Date(year, month - 1, day); // month is 0-indexed
    } else {
      due = new Date(dueDate);
    }
    due.setHours(0, 0, 0, 0);

    return due.getTime() < today.getTime();
  }

  static getDaysUntilDue(dueDate: string): number {
    // Set both dates to midnight to compare only dates, not times
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse the due date properly, handling YYYY-MM-DD format in local timezone
    let due: Date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      const [year, month, day] = dueDate.split('-').map(Number);
      due = new Date(year, month - 1, day); // month is 0-indexed, create in local timezone
    } else {
      due = new Date(dueDate);
    }
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getCurrentISOString(): string {
    return new Date().toISOString();
  }

  static getCurrentDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  static getCurrentDateStringBrazil(): string {
    // Get current date in Brazil timezone (UTC-3) explicitly
    const now = new Date();

    // Use Intl.DateTimeFormat to get Brazil timezone date components
    const brasilFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const brasilDateString = brasilFormatter.format(now);
    console.log(`DateUtils: Current Brazil date: ${brasilDateString} (local time: ${now.toLocaleString()})`);
    return brasilDateString;
  }

  static isValidDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  static isThisWeek(date: Date): boolean {
    const now = new Date();
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday as first day
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  }

  static isThisMonth(date: Date): boolean {
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
}

// Validation utilities
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPassword(password: string): boolean {
    return password.length >= 6;
  }

  static isValidTaskTitle(title: string): boolean {
    return title.trim().length > 0 && title.length <= 100;
  }

  static isValidTaskDescription(description: string): boolean {
    return description.length <= 500;
  }

  static validateRequired(value: string, fieldName: string): void {
    if (!value || value.trim().length === 0) {
      throw new TaskinError(`${fieldName} é obrigatório`, 'VALIDATION_ERROR');
    }
  }

  static validateEmail(email: string): void {
    this.validateRequired(email, 'Email');
    if (!this.isValidEmail(email)) {
      throw new TaskinError('Email inválido', 'VALIDATION_ERROR');
    }
  }

  static validatePassword(password: string): void {
    this.validateRequired(password, 'Senha');
    if (!this.isValidPassword(password)) {
      throw new TaskinError('Senha deve ter pelo menos 6 caracteres', 'VALIDATION_ERROR');
    }
  }
}

// String utilities
export class StringUtils {
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static sanitize(str: string): string {
    return str.trim();
  }

  static truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.substr(0, length) + '...';
  }

  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
}

// Storage utilities
export class StorageUtils {
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      const { setItemAsync } = await import('expo-secure-store');
      await setItemAsync(key, value);
    } catch (error) {
      throw new TaskinError(`Erro ao salvar ${key}`, 'STORAGE_ERROR');
    }
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      const { getItemAsync } = await import('expo-secure-store');
      return await getItemAsync(key);
    } catch (error) {
      console.warn(`Erro ao buscar ${key}:`, error);
      return null;
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    try {
      const { deleteItemAsync } = await import('expo-secure-store');
      await deleteItemAsync(key);
    } catch (error) {
      throw new TaskinError(`Erro ao remover ${key}`, 'STORAGE_ERROR');
    }
  }

  static async setAsyncStorageItem(key: string, value: string): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem(key, value);
    } catch (error) {
      throw new TaskinError(`Erro ao salvar ${key}`, 'STORAGE_ERROR');
    }
  }

  static async getAsyncStorageItem(key: string): Promise<string | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.default.getItem(key);
    } catch (error) {
      console.warn(`Erro ao buscar ${key}:`, error);
      return null;
    }
  }
}

// JWT utilities
export class JwtUtils {
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new TaskinError('Token inválido', 'JWT_ERROR');
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static getTokenExpiration(token: string): Date | null {
    try {
      const decoded = this.decodeToken(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      return null;
    }
  }
}

// Network utilities
export class NetworkUtils {
  static async isConnected(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async waitForConnection(timeout: number = 5000): Promise<boolean> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.isConnected()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return false;
  }
}

// Array utilities
export class ArrayUtils {
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  static sortBy<T>(array: T[], key: keyof T, ascending: boolean = true): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      if (aVal < bVal) return ascending ? -1 : 1;
      if (aVal > bVal) return ascending ? 1 : -1;
      return 0;
    });
  }

  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// Debounce utility
export class DebounceUtils {
  private static timers: Record<string, NodeJS.Timeout> = {};

  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    key: string = 'default'
  ): T {
    return ((...args: any[]) => {
      if (this.timers[key]) {
        clearTimeout(this.timers[key]);
      }

      this.timers[key] = setTimeout(() => {
        fn.apply(null, args);
        delete this.timers[key];
      }, delay);
    }) as T;
  }

  static clearDebounce(key: string): void {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
  }
}

// Type guards
export class TypeGuards {
  static isString(value: any): value is string {
    return typeof value === 'string';
  }

  static isNumber(value: any): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  static isObject(value: any): value is object {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  static isArray(value: any): value is any[] {
    return Array.isArray(value);
  }

  static hasProperty<T extends object, K extends string>(
    obj: T,
    prop: K
  ): obj is T & Record<K, unknown> {
    return prop in obj;
  }
}