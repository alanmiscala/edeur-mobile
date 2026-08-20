import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockRepository } from './mockRepository';
import type { Operator } from './types';

interface AuthContextValue {
  operator: Operator | null;
  pendingDeurId: string | null;
  login: (pin: string) => boolean;
  loginReliever: (name: string, pin: string, deurId?: string) => boolean;
  loginMainOperator: (pin: string, deurId: string) => boolean;
  resumeDeur: (deurId: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'erms_operator_session_v1';
const PENDING_DEUR_KEY = 'erms_pending_deur_v1';

function loadSession(): Operator | null {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const opId = JSON.parse(raw) as string;
        return mockRepository.getOperator(opId);
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function saveSession(operatorId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(operatorId));
    }
  } catch {
    // ignore
  }
}

function clearSession(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(PENDING_DEUR_KEY);
    }
  } catch {
    // ignore
  }
}

function loadPendingDeurId(): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(PENDING_DEUR_KEY);
    }
  } catch { /* ignore */ }
  return null;
}

function savePendingDeurId(deurId: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PENDING_DEUR_KEY, deurId);
    }
  } catch { /* ignore */ }
}

function clearPendingDeurId(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(PENDING_DEUR_KEY);
    }
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(loadSession());
  const [pendingDeurId, setPendingDeurId] = useState<string | null>(loadPendingDeurId());

  const login = (pin: string) => {
    const op = mockRepository.authenticateByPin(pin);
    if (!op) return false;
    setOperator(op);
    saveSession(op.id);
    // Check if there's a pending DEUR to resume
    const pending = mockRepository.getActiveDeurWithTurnoverPending();
    if (pending) {
      setPendingDeurId(pending.id);
      savePendingDeurId(pending.id);
    } else {
      setPendingDeurId(null);
      clearPendingDeurId();
    }
    return true;
  };

  const loginReliever = (name: string, pin: string, deurId?: string) => {
    const op = mockRepository.authenticateReliever(name, pin);
    if (!op) return false;
    // Mark DEUR as pending turnover — do NOT create segment yet
    if (deurId) {
      mockRepository.markTurnoverPending(deurId);
      setPendingDeurId(deurId);
      savePendingDeurId(deurId);
    } else {
      // Check if there's a turnover-pending DEUR
      const pending = mockRepository.getActiveDeurWithTurnoverPending();
      if (pending) {
        setPendingDeurId(pending.id);
        savePendingDeurId(pending.id);
      }
    }
    setOperator(op);
    saveSession(op.id);
    return true;
  };

  const loginMainOperator = (pin: string, deurId: string) => {
    const op = mockRepository.authenticateByPin(pin);
    if (!op) return false;
    // Mark DEUR as pending turnover
    mockRepository.markTurnoverPending(deurId);
    setPendingDeurId(deurId);
    savePendingDeurId(deurId);
    setOperator(op);
    saveSession(op.id);
    return true;
  };

  const resumeDeur = (deurId: string) => {
    if (!operator) return false;
    const deur = mockRepository.getDeurById(deurId);
    if (!deur || deur.status !== 'Active') return false;
    mockRepository.resumeOperation(deurId, operator.id, operator.name, operator.isReliever ?? false);
    setPendingDeurId(null);
    clearPendingDeurId();
    return true;
  };

  const logout = () => {
    setOperator(null);
    setPendingDeurId(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ operator, pendingDeurId, login, loginReliever, loginMainOperator, resumeDeur, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
