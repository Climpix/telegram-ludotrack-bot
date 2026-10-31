import { useEffect, useMemo, useRef, useState } from 'react';
import { useWebApp } from '@/lib/twa-mock';
import { Activity, ArrowDownLeft, ArrowUpRight, BarChart3, CalendarDays, Camera, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, FolderPlus, Home, ImagePlus, ListFilter, Palette, Pencil, Plus, Search, Settings, Sparkles, Trash2, WalletCards, X } from 'lucide-react';
import { getTelegramConfig, saveTelegramConfig, type TelegramConfig } from '@/lib/telegram';
import { parseInput } from '@/lib/parse';
import { currencies, getCurrency, saveCurrency, formatMoney as fmtMoney, fetchRates, convert, type Currency, type Rates } from '@/lib/currency';
import { themes, getTheme, saveTheme, applyTheme, type Theme } from '@/lib/theme';
import { getWorkspaces, saveWorkspaces, getActiveWorkspaceId, saveActiveWorkspaceId, createWorkspace, type Workspace } from '@/lib/workspace';

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';
type Tab = 'home' | 'history' | 'analytics';
type DeleteTarget = { type: 'category' | 'transaction' | 'workspace'; id: string; name: string; amount?: number } | null;

const formatDate = (value: string): string => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const categoryIcon = (categories: Workspace['categories'], name: string): string => categories.find((category) => category.name === name)?.icon ?? '•';

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => getWorkspaces());
  const [activeWsId, setActiveWsId] = useState<string>(() => getActiveWorkspaceId());
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Все категории');
  const [period, setPeriod] = useState<Period>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [config, setConfig] = useState<TelegramConfig>(getTelegramConfig());
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [notice, setNotice] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [currency, setCurrency] = useState<Currency>(getCurrency());
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [rates, setRates] = useState<Rates>({ USD: 1, EUR: 0.92, RUB: 92, UAH: 41, KZT: 480, BYN: 3.2, GBP: 0.79, TRY: 34 });
  const [ratesLoading, setRatesLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>(getTheme());
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showWsModal, setShowWsModal] = useState(false);
  const [showWsEditor, setShowWsEditor] = useState<Workspace | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [iconTarget, setIconTarget] = useState<string | null>(null);

  const webApp = useWebApp();
  const money = (value: number): string => fmtMoney(value, currency.symbol);

  const activeWs = useMemo(() => workspaces.find((w) => w.id === activeWsId) ?? workspaces[0], [workspaces, activeWsId]);
  const transactions = activeWs.transactions;
  const categories = activeWs.categories;

  useEffect(() => { setRatesLoading(true); void fetchRates().then((r) => { setRates(r); setRatesLoading(false); }).catch(() => setRatesLoading(false)); }, []);
  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => { saveWorkspaces(workspaces); }, [workspaces]);
  useEffect(() => { saveActiveWorkspaceId(activeWsId); }, [activeWsId]);

  const convertAmount = (tx: { amount: number; currency: string }): number => convert(tx.amount, tx.currency || 'RUB', currency.code, rates);

  useEffect(() => {
    webApp.ready();
    webApp.expand();
    document.documentElement.style.setProperty('--tg-bg', webApp.themeParams.bg_color || '#0d1117');
  }, []);

  const updateActiveWs = (updater: (ws: Workspace) => Workspace): void => {
    setWorkspaces((current) => current.map((w) => w.id === activeWsId ? updater(w) : w));
  };

  const convertedTransactions = useMemo(() => transactions.map((tx) => ({ ...tx, amount: convertAmount(tx) })), [transactions, rates, currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const balance = useMemo(() => convertedTransactions.reduce((total, item) => total + item.amount, 0), [convertedTransactions]);
  const totalIncome = useMemo(() => convertedTransactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0), [convertedTransactions]);
  const totalExpenses = useMemo(() => convertedTransactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0), [convertedTransactions]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of convertedTransactions) map.set(item.category, (map.get(item.category) ?? 0) + item.amount);
    return map;
  }, [convertedTransactions]);

  const filteredTransactions = useMemo(() => convertedTransactions.filter((item) => {
    const matchesSearch = !search || item.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'Все категории' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }), [convertedTransactions, search, categoryFilter]);

  const periodTransactions = useMemo(() => {
    const now = new Date();
    if (period === 'all') return convertedTransactions;
    let from = new Date(now);
    if (period === 'today') from.setHours(0, 0, 0, 0);
    if (period === 'week') from.setDate(now.getDate() - 6);
    if (period === 'month') from.setDate(1);
    if (period === 'custom' && customFrom) from = new Date(`${customFrom}T00:00:00`);
    const to = period === 'custom' && customTo ? new Date(`${customTo}T23:59:59`) : now;
    return convertedTransactions.filter((item) => { const date = new Date(item.timestamp); return date >= from && date <= to; });
  }, [convertedTransactions, period, customFrom, customTo]);

  const income = periodTransactions.filter((item) => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
  const expenses = periodTransactions.filter((item) => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const addTransaction = async (): Promise<void> => {
    const known = categories.map((c) => c.name);
    const parsed = parseInput(input, known);
    if (!parsed) { setNotice('Введите сумму и категорию, например: +1000 еда или еда +1к'); return; }
    const transaction = { id: crypto.randomUUID(), amount: parsed.amount, category: parsed.category, timestamp: new Date().toISOString(), currency: currency.code };
    updateActiveWs((ws) => ({ ...ws, transactions: [transaction, ...ws.transactions] }));
    setInput('');
    webApp.HapticFeedback.impactOccurred('light');
    try { navigator.vibrate?.(20); } catch { /* no-op */ }
    setNotice(`Операция добавлена: ${parsed.amount > 0 ? '+' : '−'}${money(parsed.amount)}`);
  };

  const createCategory = async (): Promise<void> => {
    const name = newCategoryName.trim();
    if (!name) return;
    const category = { id: crypto.randomUUID(), name, icon: '✦', color: 'blue' };
    updateActiveWs((ws) => ({ ...ws, categories: [...ws.categories, category] }));
    setNewCategoryName('');
    setShowCategoryModal(false);
    setNotice(`Раздел «${name}» создан`);
  };

  const deleteCategory = (id: string): void => {
    const category = categories.find((item) => item.id === id);
    updateActiveWs((ws) => ({
      ...ws,
      categories: ws.categories.filter((item) => item.id !== id),
      transactions: category ? ws.transactions.filter((item) => item.category !== category.name) : ws.transactions,
    }));
    setDeleteTarget(null);
    setNotice(`Раздел «${category?.name ?? ''}» удалён`);
  };

  const deleteTransaction = (id: string): void => {
    updateActiveWs((ws) => ({ ...ws, transactions: ws.transactions.filter((item) => item.id !== id) }));
    setDeleteTarget(null);
    setNotice('Операция удалена');
  };

  const deleteWorkspace = (id: string): void => {
    if (workspaces.length <= 1) { setNotice('Нельзя удалить единственную вкладку'); return; }
    setWorkspaces((current) => current.filter((w) => w.id !== id));
    if (activeWsId === id) { const remaining = workspaces.filter((w) => w.id !== id); setActiveWsId(remaining[0].id); }
    setShowWsModal(false);
    setDeleteTarget(null);
    setNotice('Вкладка удалена');
  };

  const confirmDelete = (): void => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'category') deleteCategory(deleteTarget.id);
    else if (deleteTarget.type === 'transaction') deleteTransaction(deleteTarget.id);
    else deleteWorkspace(deleteTarget.id);
  };

  const changeTheme = (next: Theme): void => { setTheme(next); saveTheme(next); applyTheme(next); setShowThemeModal(false); setNotice(`Тема: ${next.name}`); };

  const changeCurrency = (next: Currency): void => { setCurrency(next); saveCurrency(next); setShowCurrencyModal(false); setNotice(`Валюта: ${next.name}`); };

  const saveSettings = (): void => { saveTelegramConfig(config); setTelegramStatus('saved'); setTimeout(() => setTelegramStatus('idle'), 2200); };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const { compressImage } = await import('@/lib/image');
      const blob = await compressImage(file);
      const preview = URL.createObjectURL(blob);
      if (iconTarget) {
        if (iconTarget.startsWith('ws-')) {
          const wsId = iconTarget.slice(3);
          setWorkspaces((current) => current.map((w) => w.id === wsId ? { ...w, icon: preview } : w));
        } else {
          updateActiveWs((ws) => ({ ...ws, categories: ws.categories.map((item) => item.id === iconTarget ? { ...item, icon: preview } : item) }));
        }
      }
      setNotice('Иконка обновлена');
    } catch { setNotice('Не удалось обработать изображение'); }
    event.target.value = '';
  };

  const openIconPicker = (target: string): void => { setIconTarget(target); fileRef.current?.click(); };

  const createNewWorkspace = (): void => {
    setShowWsEditor({ id: '', name: '', icon: '📁', subtitle: '', transactions: [], categories: [] });
  };

  const saveNewWorkspace = (): void => {
    if (!showWsEditor) return;
    const name = showWsEditor.name.trim();
    if (!name) return;
    const ws = createWorkspace(name, showWsEditor.icon);
    ws.subtitle = showWsEditor.subtitle.trim() || 'Новая вкладка';
    setWorkspaces((current) => [...current, ws]);
    setActiveWsId(ws.id);
    setShowWsEditor(null);
    setShowWsModal(false);
    setNotice(`Вкладка «${name}» создана`);
  };

  const updateExistingWorkspace = (): void => {
    if (!showWsEditor || !showWsEditor.id) return;
    const name = showWsEditor.name.trim();
    if (!name) return;
    setWorkspaces((current) => current.map((w) => w.id === showWsEditor.id ? { ...w, name, subtitle: showWsEditor.subtitle.trim() || w.subtitle } : w));
    setShowWsEditor(null);
    setNotice('Вкладка обновлена');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setShowWsModal(true)}>
          <div className="brand-mark">{activeWs.icon.startsWith('blob:') ? <img src={activeWs.icon} alt="" /> : <span className="brand-mark-icon">{activeWs.icon}</span>}</div>
          <div>
            <div className="brand-name">{activeWs.name}</div>
            <div className="brand-sub">{activeWs.subtitle}</div>
          </div>
          <ChevronRight size={16} className="brand-chevron" />
        </button>
        <div className="topbar-right">
          <button className="currency-pill" onClick={() => setShowCurrencyModal(true)}>{currency.symbol}</button>
          <button className="icon-button" onClick={() => setShowThemeModal(true)} aria-label="Тема"><Palette size={18} /></button>
          <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Настройки"><Settings size={19} /></button>
        </div>
      </header>

      <main className="content">
        {tab === 'home' && <HomeView balance={balance} totalIncome={totalIncome} totalExpenses={totalExpenses} money={money} input={input} setInput={setInput} addTransaction={addTransaction} categories={categories} categoryTotals={categoryTotals} openIconPicker={openIconPicker} setShowCategoryModal={setShowCategoryModal} setDeleteTarget={setDeleteTarget} notice={notice} />}
        {tab === 'history' && <HistoryView transactions={filteredTransactions} categories={categories} money={money} search={search} setSearch={setSearch} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} setDeleteTarget={setDeleteTarget} />}
        {tab === 'analytics' && <AnalyticsView period={period} setPeriod={setPeriod} customFrom={customFrom} setCustomFrom={setCustomFrom} customTo={customTo} setCustomTo={setCustomTo} income={income} expenses={expenses} money={money} transactions={periodTransactions} categories={categories} />}
      </main>

      <nav className="bottom-nav">
        <NavButton active={tab === 'home'} icon={<Home size={19} />} label="Главная" onClick={() => setTab('home')} />
        <NavButton active={tab === 'history'} icon={<Activity size={19} />} label="История" onClick={() => setTab('history')} />
        <NavButton active={tab === 'analytics'} icon={<BarChart3 size={19} />} label="Аналитика" onClick={() => setTab('analytics')} />
      </nav>

      <input ref={fileRef} className="hidden-input" type="file" accept="image/*" onChange={handleFile} />
      {showSettings && <SettingsModal config={config} setConfig={setConfig} onClose={() => setShowSettings(false)} onSave={saveSettings} status={telegramStatus} />}
      {showCategoryModal && <CategoryModal name={newCategoryName} setName={setNewCategoryName} onClose={() => setShowCategoryModal(false)} onCreate={createCategory} />}
      {deleteTarget && <DeleteModal target={deleteTarget} money={money} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
      {showCurrencyModal && <CurrencyModal current={currency} ratesLoading={ratesLoading} onClose={() => setShowCurrencyModal(false)} onSelect={changeCurrency} />}
      {showThemeModal && <ThemeModal current={theme} onClose={() => setShowThemeModal(false)} onSelect={changeTheme} />}
      {showWsModal && <WorkspaceModal workspaces={workspaces} activeWsId={activeWsId} onSelect={(id) => { setActiveWsId(id); setShowWsModal(false); setNotice(`Вкладка: ${workspaces.find(w => w.id === id)?.name ?? ''}`); }} onCreate={createNewWorkspace} onEdit={(ws) => setShowWsEditor(ws)} onDelete={(ws) => setDeleteTarget({ type: 'workspace', id: ws.id, name: ws.name })} onClose={() => setShowWsModal(false)} />}
      {showWsEditor && <WorkspaceEditor workspace={showWsEditor} onChange={setShowWsEditor} isNew={!showWsEditor.id} onSave={showWsEditor.id ? updateExistingWorkspace : saveNewWorkspace} onPickIcon={() => { if (showWsEditor.id) openIconPicker(`ws-${showWsEditor.id}`); }} onClose={() => setShowWsEditor(null)} />}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span></button>; }

function HomeView({ balance, totalIncome, totalExpenses, money, input, setInput, addTransaction, categories, categoryTotals, openIconPicker, setShowCategoryModal, setDeleteTarget, notice }: { balance: number; totalIncome: number; totalExpenses: number; money: (value: number) => string; input: string; setInput: (value: string) => void; addTransaction: () => Promise<void>; categories: Workspace['categories']; categoryTotals: Map<string, number>; openIconPicker: (target: string) => void; setShowCategoryModal: (value: boolean) => void; setDeleteTarget: (target: DeleteTarget) => void; notice: string }) {
  return <section className="view home-view">
    <div className="eyebrow"><span className="status-dot" /> ОБЩИЙ БАЛАНС <span className="live-pill">LIVE</span></div>
    <div className="balance-row"><h1 className={balance < 0 ? 'negative' : balance > 0 ? 'positive' : ''}>{balance !== 0 ? (balance < 0 ? '−' : '+') : ''}{money(balance)}</h1></div>
    <div className="balance-caption">После всех операций</div>
    <div className="balance-mini"><div className="mini-stat income"><ArrowUpRight size={13} /> +{money(totalIncome)}</div><div className="mini-stat expense"><ArrowDownLeft size={13} /> −{money(totalExpenses)}</div></div>
    <div className="quick-card"><div className="quick-label"><Sparkles size={15} /> Быстрое добавление</div><div className="input-row"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void addTransaction(); }} placeholder="еда +1к или +1000 сайт" /><button onClick={() => void addTransaction()}>Отправить <ArrowUpRight size={16} /></button></div><div className="hint"><CircleHelp size={13} /> Порядок любой: «еда +1000» или «+1000 еда». Поддержка 1к, 2к, 1м</div></div>
    {notice && <div className="notice"><Check size={15} /> {notice}</div>}
    <div className="section-heading"><div><span className="section-kicker">БЫСТРЫЙ ДОСТУП</span><h2>Разделы</h2></div><span className="count-badge">{categories.length}</span></div>
    <div className="categories-grid">{categories.map((category) => { const total = categoryTotals.get(category.name) ?? 0; return <div className="category-wrap" key={category.id}><button className={`category-card ${category.color}`} onClick={() => setInput(`${input}${input ? ' ' : ''}${category.name.toLowerCase()}`)}><span className="category-icon">{category.icon.startsWith('blob:') ? <img src={category.icon} alt="" /> : category.icon}</span><span>{category.name}</span>{total !== 0 && <span className={`category-amount ${total > 0 ? 'positive' : 'negative'}`}>{total > 0 ? '+' : '−'}{money(total)}</span>}<Plus className="category-plus" size={14} /></button><button className="edit-icon" onClick={() => openIconPicker(category.id)} aria-label={`Изменить иконку ${category.name}`}><Camera size={12} /></button><button className="delete-icon" onClick={() => setDeleteTarget({ type: 'category', id: category.id, name: category.name })} aria-label={`Удалить раздел ${category.name}`}><Trash2 size={12} /></button></div>; })}<button className="new-category" onClick={() => setShowCategoryModal(true)}><span><Plus size={19} /></span><b>Новый раздел</b><small>Добавить категорию</small></button></div>
    <div className="sync-card"><div className="sync-icon"><Clock3 size={17} /></div><div><b>Синхронизация с каналом</b><span>История сохраняется в Telegram</span></div><span className="connected"><span /> Готово</span></div>
  </section>;
}

function HistoryView({ transactions, categories, money, search, setSearch, categoryFilter, setCategoryFilter, setDeleteTarget }: { transactions: Workspace['transactions']; categories: Workspace['categories']; money: (value: number) => string; search: string; setSearch: (value: string) => void; categoryFilter: string; setCategoryFilter: (value: string) => void; setDeleteTarget: (target: DeleteTarget) => void }) {
  return <section className="view"><div className="page-title"><div><span className="section-kicker">ЖУРНАЛ ИЗМЕНЕНИЙ</span><h1>История операций</h1></div><div className="round-stat"><ListFilter size={17} /><span>{transactions.length}</span></div></div><div className="filters"><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по разделам" /></div><div className="select-wrap"><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>Все категории</option>{categories.map((category) => <option key={category.id}>{category.name}</option>)}</select><ChevronDown size={15} /></div></div><div className="timeline">{transactions.map((item, index) => <div className="history-item" key={item.id}><div className={`history-icon ${item.amount > 0 ? 'income' : 'expense'}`}>{item.amount > 0 ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}</div><div className="history-main"><div className="history-name"><b>{categoryIcon(categories, item.category)}</b> {item.category}</div><span>{formatDate(item.timestamp)}</span></div><div className={`history-amount ${item.amount > 0 ? 'positive' : 'negative'}`}>{item.amount > 0 ? '+' : '−'} {money(item.amount)}</div><button className="history-delete" onClick={() => setDeleteTarget({ type: 'transaction', id: item.id, name: item.category, amount: item.amount })} aria-label="Удалить операцию"><Trash2 size={14} /></button>{index < transactions.length - 1 && <div className="timeline-line" />}</div>)}{transactions.length === 0 && <div className="empty-state"><Search size={28} /><b>Ничего не найдено</b><span>Попробуйте изменить фильтры</span></div>}</div></section>;
}

function AnalyticsView({ period, setPeriod, customFrom, setCustomFrom, customTo, setCustomTo, income, expenses, money, transactions, categories }: { period: Period; setPeriod: (value: Period) => void; customFrom: string; setCustomFrom: (value: string) => void; customTo: string; setCustomTo: (value: string) => void; income: number; expenses: number; money: (value: number) => string; transactions: Workspace['transactions']; categories: Workspace['categories'] }) {
  const breakdown = categories.map((category) => ({ ...category, total: transactions.filter((item) => item.category === category.name).reduce((sum, item) => sum + item.amount, 0) })).filter((category) => category.total !== 0).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  return <section className="view"><div className="page-title"><div><span className="section-kicker">ОБЗОР ФИНАНСОВ</span><h1>Аналитика</h1></div><div className="round-stat"><BarChart3 size={17} /></div></div><div className="period-tabs">{([['today', 'Сегодня'], ['week', 'Неделя'], ['month', 'Месяц'], ['all', 'Всё время'], ['custom', 'Период']] as [Period, string][]).map(([value, label]) => <button className={period === value ? 'selected' : ''} key={value} onClick={() => setPeriod(value)}>{label}</button>)}</div>{period === 'custom' && <div className="date-range"><label>От<input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} /></label><span>—</span><label>До<input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} /></label></div>}<div className="analytics-total"><div className="chart-orb"><BarChart3 size={24} /></div><div><span>Чистый результат</span><strong>{income - expenses >= 0 ? '+' : '−'} {money(income - expenses)}</strong></div><div className="result-period"><CalendarDays size={14} /> Выбранный период</div></div><div className="metric-grid"><Metric label="Доходы" value={income} money={money} tone="green" icon={<ArrowUpRight size={16} />} /><Metric label="Расходы" value={expenses} money={money} tone="red" icon={<ArrowDownLeft size={16} />} /></div><div className="breakdown-head"><h2>По категориям</h2><span>Всего {transactions.length}</span></div><div className="breakdown-list">{breakdown.map((item) => <div className="breakdown-row" key={item.id}><span className={`mini-icon ${item.color}`}>{item.icon}</span><div className="breakdown-label"><b>{item.name}</b><span>{item.total > 0 ? 'Доход' : 'Расход'}</span></div><strong className={item.total > 0 ? 'positive' : 'negative'}>{item.total > 0 ? '+' : '−'} {money(item.total)}</strong></div>)}{breakdown.length === 0 && <div className="empty-state compact"><BarChart3 size={28} /><b>Пока нет данных</b><span>Добавьте операции за этот период</span></div>}</div></section>;
}

function Metric({ label, value, money, tone, icon }: { label: string; value: number; money: (value: number) => string; tone: string; icon: React.ReactNode }) { return <div className={`metric ${tone}`}><div className="metric-top"><span>{label}</span><i>{icon}</i></div><b>{money(value)}</b></div>; }

function SettingsModal({ config, setConfig, onClose, onSave, status }: { config: TelegramConfig; setConfig: (value: TelegramConfig) => void; onClose: () => void; onSave: () => void; status: 'idle' | 'saved' | 'error' }) { return <div className="modal-backdrop"><div className="modal"><div className="modal-header"><div><span className="section-kicker">ПОДКЛЮЧЕНИЕ</span><h2>Настройки канала</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><p className="modal-copy">Укажите данные бота и закрытого канала, куда будут сохраняться операции, категории и иконки.</p><label className="field-label">Telegram Bot Token<input type="password" value={config.botToken} onChange={(event) => setConfig({ ...config, botToken: event.target.value })} placeholder="123456:ABC-DEF..." /></label><label className="field-label">ID закрытого канала<input value={config.channelId} onChange={(event) => setConfig({ ...config, channelId: event.target.value })} placeholder="-1001234567890" /></label><div className="security-note"><Settings size={15} /><span>Данные хранятся только на этом устройстве</span></div><button className="primary-button" onClick={onSave}>{status === 'saved' ? <><Check size={16} /> Сохранено</> : 'Сохранить подключение'}</button><button className="text-button" onClick={onClose}>Отмена</button></div></div>; }

function CategoryModal({ name, setName, onClose, onCreate }: { name: string; setName: (value: string) => void; onClose: () => void; onCreate: () => Promise<void> }) { return <div className="modal-backdrop"><div className="modal small"><div className="modal-header"><div><span className="section-kicker">РАЗДЕЛЫ</span><h2>Новый раздел</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><label className="field-label">Название<input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void onCreate(); }} placeholder="Например, Подписки" /></label><div className="icon-upload"><div className="upload-preview"><ImagePlus size={21} /></div><div><b>Иконка раздела</b><span>Можно добавить после создания</span></div></div><button className="primary-button" onClick={() => void onCreate()}>Создать раздел <Plus size={16} /></button></div></div>; }

function DeleteModal({ target, money, onClose, onConfirm }: { target: NonNullable<DeleteTarget>; money: (value: number) => string; onClose: () => void; onConfirm: () => void }) {
  const isCategory = target.type === 'category';
  const isWorkspace = target.type === 'workspace';
  const title = isWorkspace ? 'Удалить вкладку?' : isCategory ? 'Удалить раздел?' : 'Удалить операцию?';
  const msg = isWorkspace ? `Вкладка «${target.name}» и все её операции и разделы будут удалены безвозвратно.` : isCategory ? `Раздел «${target.name}» и все связанные с ним операции будут удалены безвозвратно.` : `Операция «${target.name}» на ${target.amount !== undefined ? (target.amount > 0 ? '+' : '−') : ''}${money(target.amount ?? 0)} будет удалена безвозвратно.`;
  return <div className="modal-backdrop"><div className="modal small">
    <div className="modal-header"><div><span className="section-kicker">УДАЛЕНИЕ</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <p className="modal-copy">{msg}</p>
    <button className="danger-button" onClick={onConfirm}><Trash2 size={16} /> Удалить безвозвратно</button>
    <button className="text-button" onClick={onClose}>Отмена</button>
  </div></div>;
}

function CurrencyModal({ current, ratesLoading, onClose, onSelect }: { current: Currency; ratesLoading: boolean; onClose: () => void; onSelect: (currency: Currency) => void }) {
  return <div className="modal-backdrop"><div className="modal small">
    <div className="modal-header"><div><span className="section-kicker">ВАЛЮТА</span><h2>Выбор валюты</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <p className="modal-copy">{ratesLoading ? 'Загрузка актуальных курсов...' : 'Суммы конвертируются по актуальному курсу при смене валюты.'}</p>
    <div className="currency-list">{currencies.map((cur) => <button key={cur.code} className={`currency-item ${cur.code === current.code ? 'selected' : ''}`} onClick={() => onSelect(cur)}><span className="currency-symbol">{cur.symbol}</span><div><b>{cur.name}</b><span>{cur.code}</span></div>{cur.code === current.code && <Check size={16} />}</button>)}</div>
  </div></div>;
}

function ThemeModal({ current, onClose, onSelect }: { current: Theme; onClose: () => void; onSelect: (theme: Theme) => void }) {
  return <div className="modal-backdrop"><div className="modal small">
    <div className="modal-header"><div><span className="section-kicker">ДИЗАЙН</span><h2>Цветовая тема</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <p className="modal-copy">Выберите гамму — фон, акценты и кнопки поменяются сразу. Выбор сохранится автоматически.</p>
    <div className="theme-grid">{themes.map((t) => <button key={t.id} className={`theme-card ${t.id === current.id ? 'selected' : ''}`} onClick={() => onSelect(t)}><span className="theme-swatch" style={{ background: t.accent }} /><b>{t.name}</b>{t.id === current.id && <Check className="theme-check" size={16} />}</button>)}</div>
  </div></div>;
}

function WorkspaceModal({ workspaces, activeWsId, onSelect, onCreate, onEdit, onDelete, onClose }: { workspaces: Workspace[]; activeWsId: string; onSelect: (id: string) => void; onCreate: () => void; onEdit: (ws: Workspace) => void; onDelete: (ws: Workspace) => void; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="modal small">
    <div className="modal-header"><div><span className="section-kicker">ВКЛАДКИ</span><h2>Мои вкладки</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <p className="modal-copy">Каждая вкладка — отдельный счёт со своими разделами и операциями.</p>
    <div className="ws-list">{workspaces.map((ws) => <div key={ws.id} className={`ws-item ${ws.id === activeWsId ? 'active' : ''}`}><button className="ws-select" onClick={() => onSelect(ws.id)}><span className="ws-icon">{ws.icon.startsWith('blob:') ? <img src={ws.icon} alt="" /> : ws.icon}</span><div><b>{ws.name}</b><span>{ws.subtitle}</span></div>{ws.id === activeWsId && <Check size={16} />}</button><button className="ws-edit" onClick={() => onEdit(ws)} aria-label="Редактировать"><Pencil size={13} /></button><button className="ws-delete" onClick={() => onDelete(ws)} aria-label="Удалить"><Trash2 size={13} /></button></div>)}</div>
    <button className="primary-button" onClick={onCreate}><FolderPlus size={16} /> Создать вкладку</button>
    <button className="text-button" onClick={onClose}>Закрыть</button>
  </div></div>;
}

function WorkspaceEditor({ workspace, onChange, isNew, onSave, onPickIcon, onClose }: { workspace: Workspace; onChange: (ws: Workspace) => void; isNew: boolean; onSave: () => void; onPickIcon: () => void; onClose: () => void }) {
  return <div className="modal-backdrop"><div className="modal small">
    <div className="modal-header"><div><span className="section-kicker">{isNew ? 'СОЗДАНИЕ' : 'РЕДАКТИРОВАНИЕ'}</span><h2>{isNew ? 'Новая вкладка' : 'Вкладка'}</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div>
    <div className="ws-editor-icon"><button className="ws-icon-picker" onClick={onPickIcon}><span>{workspace.icon.startsWith('blob:') ? <img src={workspace.icon} alt="" /> : workspace.icon}</span><Camera size={14} /></button><div><b>Иконка вкладки</b><span>Нажмите, чтобы загрузить фото</span></div></div>
    <label className="field-label">Название<input autoFocus value={workspace.name} onChange={(event) => onChange({ ...workspace, name: event.target.value })} placeholder="Например, Еда" /></label>
    <label className="field-label">Подпись<input value={workspace.subtitle} onChange={(event) => onChange({ ...workspace, subtitle: event.target.value })} placeholder="Например, Расходы на еду" /></label>
    <button className="primary-button" onClick={onSave}>{isNew ? <>Создать <Plus size={16} /></> : 'Сохранить'}</button>
    <button className="text-button" onClick={onClose}>Отмена</button>
  </div></div>;
}

export default App;
