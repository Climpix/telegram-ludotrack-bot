import { compressImage } from '@/lib/image';

export type Category = { id: string; name: string; icon: string; color: string };
export type Transaction = { id: string; amount: number; category: string; timestamp: string; currency: string };
export type Workspace = {
  id: string;
  name: string;
  icon: string;
  subtitle: string;
  transactions: Transaction[];
  categories: Category[];
};

const WORKSPACES_KEY = 'fintrack-workspaces';
const ACTIVE_WS_KEY = 'fintrack-active-workspace';

const defaultWorkspace: Workspace = {
  id: 'fintrack',
  name: 'Fintrack',
  icon: '💳',
  subtitle: 'Личный финансовый штаб',
  transactions: [],
  categories: [],
};

export const getWorkspaces = (): Workspace[] => {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    if (!raw) return [defaultWorkspace];
    const parsed = JSON.parse(raw) as Workspace[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [defaultWorkspace];
    return parsed;
  } catch {
    return [defaultWorkspace];
  }
};

export const saveWorkspaces = (workspaces: Workspace[]): void => {
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces));
};

export const getActiveWorkspaceId = (): string => {
  return localStorage.getItem(ACTIVE_WS_KEY) || 'fintrack';
};

export const saveActiveWorkspaceId = (id: string): void => {
  localStorage.setItem(ACTIVE_WS_KEY, id);
};

export const createWorkspace = (name: string, icon: string): Workspace => {
  return {
    id: crypto.randomUUID(),
    name,
    icon,
    subtitle: 'Новая вкладка',
    transactions: [],
    categories: [],
  };
};

export const updateWorkspaceIcon = async (workspaceId: string, file: File): Promise<string> => {
  const blob = await compressImage(file);
  return URL.createObjectURL(blob);
};
