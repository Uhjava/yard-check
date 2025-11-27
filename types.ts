// Augment NodeJS.ProcessEnv to include API_KEY
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      [key: string]: string | undefined;
    }
  }
}

export enum UnitStatus {
  PENDING = 'PENDING',
  PRESENT = 'PRESENT',
  MISSING = 'MISSING',
  DAMAGED = 'DAMAGED' // Optional extension
}

export interface Unit {
  id: string; // e.g., "GST 01-01"
  category: string; // e.g., "5th Wheel", "8 Station HMU"
  description?: string;
  expectedLocation?: string; // from the spreadsheet "LOCATION"
}

export interface AuditRecord {
  unitId: string;
  status: UnitStatus;
  timestamp: number;
  notes?: string;
}

export type YardLocation = 'Davenport' | 'Movie Ranch';

export interface AuditSession {
  id: string;
  yard: YardLocation;
  startTime: number;
  records: Record<string, AuditRecord>; // Map unitId to Record
  completed: boolean;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'normal';
  createdAt: number;
}