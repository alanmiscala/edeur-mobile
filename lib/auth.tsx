import { createContext, useContext, useState, type ReactNode } from 'react';
import { mockRepository } from './mockRepository';
import type { Operator } from './types';

interface AuthContextValue {
  operator: Operator | null;
  login: (pin: string) => boolean;
  loginReliever: (name: string, pin: string, deurId?: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'erms_operator_session_v1';

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
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [operator, setOperator] = useState<Operator | null>(loadSession);

  const login = (pin: string) => {
    const op = mockRepository.authenticateByPin(pin);
    if (!op) return false;
    setOperator(op);
    saveSession(op.id);
    return true;
  };

  const loginReliever = (name: string, pin: string, deurId?: string) => {
    const op = mockRepository.authenticateReliever(name, pin);
    if (!op) return false;
    if (deurId) {
      mockRepository.turnOverToReliever(deurId, op.id, op.name);
    }
    setOperator(op);
    saveSession(op.id);
    return true;
  };

  const logout = () => {
    setOperator(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ operator, login, loginReliever, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
