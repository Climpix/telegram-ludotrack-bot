import { useEffect } from 'react';

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

type HapticFeedback = {
  impactOccurred: (style: HapticStyle) => void;
  notificationOccurred: (type: NotificationType) => void;
  selectionChanged: () => void;
};

type ButtonClickHandler = () => void;

type BackButton = {
  show: () => void;
  hide: () => void;
  onClick: (handler: ButtonClickHandler) => void;
  offClick: (handler: ButtonClickHandler) => void;
};

type MainButton = {
  text: string;
  show: () => void;
  hide: () => void;
  enable: () => void;
  disable: () => void;
  setText: (text: string) => void;
  onClick: (handler: ButtonClickHandler) => void;
  offClick: (handler: ButtonClickHandler) => void;
};

type PopupButton = { id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text?: string };

type MockWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  themeParams: Record<string, string>;
  colorScheme: 'light' | 'dark';
  initData: string;
  initDataUnsafe: Record<string, unknown>;
  version: string;
  platform: string;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  HapticFeedback: HapticFeedback;
  BackButton: BackButton;
  MainButton: MainButton;
  openPopup: (params: { title?: string; message?: string; buttons?: PopupButton[] }) => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
};

const mockWebApp: MockWebApp = {
  ready: () => {},
  expand: () => {},
  close: () => { window.close(); },
  themeParams: {
    bg_color: '#0d1117',
    text_color: '#eff4f2',
    hint_color: '#657476',
    link_color: '#a8e6ca',
    button_color: '#a8e6ca',
    button_text_color: '#102019',
    secondary_bg_color: '#141d22',
  },
  colorScheme: 'dark',
  initData: '',
  initDataUnsafe: {},
  version: 'mock',
  platform: 'browser',
  isExpanded: true,
  viewportHeight: window.innerHeight,
  viewportStableHeight: window.innerHeight,
  headerColor: '#0d1117',
  backgroundColor: '#0d1117',
  HapticFeedback: {
    impactOccurred: () => {},
    notificationOccurred: () => {},
    selectionChanged: () => {},
  },
  BackButton: {
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {},
  },
  MainButton: {
    text: '',
    show: () => {},
    hide: () => {},
    enable: () => {},
    disable: () => {},
    setText: () => {},
    onClick: () => {},
    offClick: () => {},
  },
  openPopup: () => {},
  setHeaderColor: () => {},
  setBackgroundColor: () => {},
  onEvent: () => {},
  offEvent: () => {},
};

export const isTelegramEnvironment = (): boolean => Boolean(
  typeof window !== 'undefined' &&
  (window as unknown as { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp
);

const getWebApp = (): MockWebApp => {
  if (isTelegramEnvironment()) {
    return (window as unknown as { Telegram: { WebApp: MockWebApp } }).Telegram.WebApp;
  }
  return mockWebApp;
};

export const useWebApp = (): MockWebApp => {
  useEffect(() => {
    const webApp = getWebApp();
    webApp.ready();
    webApp.expand();
  }, []);
  return getWebApp();
};

export default mockWebApp;
export { mockWebApp, getWebApp };
