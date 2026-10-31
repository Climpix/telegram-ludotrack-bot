export type TelegramConfig = {
  botToken: string;
  channelId: string;
};

export type TelegramPost = {
  message_id?: number;
  date?: number;
  text?: string;
  caption?: string;
};

const CONFIG_KEY = 'fintrack-telegram-config';

export const getTelegramConfig = (): TelegramConfig => {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) as TelegramConfig : { botToken: '', channelId: '' };
  } catch {
    return { botToken: '', channelId: '' };
  }
};

export const saveTelegramConfig = (config: TelegramConfig): void => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

const callTelegram = async <T>(config: TelegramConfig, method: string, body?: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json() as { ok: boolean; result?: T; description?: string };
  if (!result.ok) throw new Error(result.description || 'Telegram API error');
  return result.result as T;
};

export const sendChannelPost = async (config: TelegramConfig, text: string): Promise<void> => {
  await callTelegram(config, 'sendMessage', { chat_id: config.channelId, text });
};

export const loadChannelPosts = async (config: TelegramConfig): Promise<TelegramPost[]> => {
  const updates = await callTelegram<{ channel_post?: TelegramPost }[]>(config, 'getUpdates');
  return updates.map((update) => update.channel_post).filter((post): post is TelegramPost => Boolean(post));
};

export const uploadChannelPhoto = async (config: TelegramConfig, chatId: string, photo: Blob, caption: string): Promise<void> => {
  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('photo', photo, 'category-icon.jpg');
  form.append('caption', caption);
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendPhoto`, { method: 'POST', body: form });
  const result = await response.json() as { ok: boolean; description?: string };
  if (!result.ok) throw new Error(result.description || 'Telegram API error');
};
