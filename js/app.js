const DB_NAME = 'kiranaBrainDB';
const DB_VERSION = 2;
let recognition = null;
let isListening = false;
let voiceTranscript = '';

const state = {
  storeName: 'Sharma Kirana Store',
  inventory: [
    { id: 1, name: 'Aashirvaad Atta 5kg', stock: 6, unit: 'bags', reorderThreshold: 5, price: 285, status: 'Low Stock' },
    { id: 2, name: 'Amul Butter 500g', stock: 8, unit: 'packs', reorderThreshold: 6, price: 250, status: 'In Stock' },
    { id: 3, name: 'Fortune Mustard Oil 1L', stock: 4, unit: 'bottles', reorderThreshold: 5, price: 175, status: 'Low Stock' },
    { id: 4, name: 'Tata Salt 1kg', stock: 12, unit: 'packs', reorderThreshold: 8, price: 28, status: 'In Stock' },
    { id: 5, name: 'Surf Excel 1kg', stock: 7, unit: 'packs', reorderThreshold: 5, price: 120, status: 'In Stock' },
    { id: 6, name: 'Basmati Rice 5kg', stock: 9, unit: 'bags', reorderThreshold: 6, price: 420, status: 'In Stock' },
    { id: 7, name: 'Nestle Maggi 2-Minute Noodles', stock: 11, unit: 'packs', reorderThreshold: 8, price: 84, status: 'In Stock' },
    { id: 8, name: 'Parle-G Biscuit 800g', stock: 5, unit: 'packs', reorderThreshold: 6, price: 70, status: 'Low Stock' },
    { id: 9, name: 'Dabur Red Toothpaste 200g', stock: 10, unit: 'tubes', reorderThreshold: 7, price: 95, status: 'In Stock' },
    { id: 10, name: 'Nescafe Classic 100g', stock: 4, unit: 'jars', reorderThreshold: 5, price: 320, status: 'Low Stock' },
    { id: 11, name: 'Britannia Good Day Cookies', stock: 7, unit: 'packs', reorderThreshold: 5, price: 55, status: 'In Stock' },
    { id: 12, name: 'Dettol Handwash 250ml', stock: 6, unit: 'bottles', reorderThreshold: 5, price: 82, status: 'In Stock' },
    { id: 13, name: 'MTR Masala Mix 100g', stock: 8, unit: 'packs', reorderThreshold: 6, price: 45, status: 'In Stock' },
    { id: 14, name: 'Sunfeast Dark Fantasy', stock: 5, unit: 'packs', reorderThreshold: 6, price: 60, status: 'Low Stock' },
    { id: 15, name: 'Saffola Gold Oil 1L', stock: 3, unit: 'bottles', reorderThreshold: 4, price: 220, status: 'Low Stock' },
    { id: 16, name: 'Gits Rasam Powder 100g', stock: 6, unit: 'packs', reorderThreshold: 5, price: 48, status: 'In Stock' },
    { id: 17, name: 'Haldiram Bhujia 200g', stock: 5, unit: 'packs', reorderThreshold: 5, price: 40, status: 'Low Stock' },
    { id: 18, name: 'Tata Tea Premium 500g', stock: 7, unit: 'packs', reorderThreshold: 6, price: 320, status: 'In Stock' },
    { id: 19, name: 'Colgate Strong Teeth 200g', stock: 8, unit: 'tubes', reorderThreshold: 6, price: 88, status: 'In Stock' },
    { id: 20, name: 'MTR Gulab Jamun Mix', stock: 4, unit: 'packs', reorderThreshold: 5, price: 55, status: 'Low Stock' },
    { id: 21, name: 'Kissan Tomato Ketchup 1kg', stock: 9, unit: 'bottles', reorderThreshold: 6, price: 140, status: 'In Stock' },
    { id: 22, name: 'Cinthol Soap 100g', stock: 10, unit: 'bars', reorderThreshold: 7, price: 35, status: 'In Stock' },
    { id: 23, name: 'Mango Pickle 500g', stock: 6, unit: 'jars', reorderThreshold: 5, price: 95, status: 'In Stock' },
    { id: 24, name: 'Pepsi 2L Bottle', stock: 4, unit: 'bottles', reorderThreshold: 4, price: 90, status: 'Low Stock' }
  ],
  analytics: [
    { id: 1, date: 'Today', revenue: 18240, orders: 64, demandScore: 84 },
    { id: 2, date: 'Yesterday', revenue: 16780, orders: 58, demandScore: 78 },
    { id: 3, date: '2 days ago', revenue: 14990, orders: 52, demandScore: 72 }
  ],
  aiLog: [
    { id: 1, tone: 'alert', text: 'Aashirvaad Atta is depleting 40% faster than last week due to upcoming weekend festival demand.' },
    { id: 2, tone: 'info', text: 'Fortune Mustard Oil demand is climbing ahead of evening meal rushes in your area.' }
  ],
  currentView: 'dashboard',
  chatMessages: [
    { role: 'ai', message: 'Hello! I can help monitor stock, sales patterns, and restock decisions for Sharma Kirana Store.' }
  ],
  orders: [
    { id: 1, itemName: 'Aashirvaad Atta 5kg', quantity: 8, unit: 'bags', status: 'Pending', createdAt: 'Today' },
    { id: 2, itemName: 'Amul Butter 500g', quantity: 5, unit: 'packs', status: 'Delivered', createdAt: 'Yesterday' }
  ],
  orderMessage: ''
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains('appState')) {
        db.deleteObjectStore('appState');
      }
      db.createObjectStore('appState', { keyPath: 'id' });
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function saveState() {
  const payload = {
    storeName: state.storeName,
    inventory: state.inventory,
    aiLog: state.aiLog,
    currentView: state.currentView,
    chatMessages: state.chatMessages,
    orders: state.orders,
    orderMessage: state.orderMessage
  };

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appState', 'readwrite');
      const store = tx.objectStore('appState');
      store.put({ id: 1, payload });
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.warn('Could not save state to IndexedDB:', error);
  }
}

async function loadState() {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('appState', 'readonly');
      const store = tx.objectStore('appState');
      const request = store.get(1);

      request.onsuccess = () => {
        const saved = request.result?.payload;
        if (saved) {
          const savedInventory = Array.isArray(saved.inventory) ? saved.inventory : null;
          state.inventory = savedInventory && savedInventory.length >= state.inventory.length ? savedInventory : state.inventory;
          state.aiLog = saved.aiLog || state.aiLog;
          state.currentView = saved.currentView || state.currentView;
          state.chatMessages = saved.chatMessages || state.chatMessages;
          state.orders = saved.orders || state.orders;
          state.orderMessage = saved.orderMessage || '';
        }
        db.close();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Could not load state from IndexedDB:', error);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function updateInventoryStatuses() {
  state.inventory.forEach((item) => {
    item.status = item.stock <= item.reorderThreshold ? 'Low Stock' : 'In Stock';
  });
}

function getMetrics() {
  updateInventoryStatuses();
  const criticalLow = state.inventory.filter((item) => item.status === 'Low Stock').length;
  const latestRevenue = state.analytics[0]?.revenue || 0;
  return {
    totalSkus: state.inventory.length,
    criticalLow,
    dailyRevenue: latestRevenue
  };
}

function renderDashboard() {
  const root = document.getElementById('dashboard-section');
  const metrics = getMetrics();
  root.innerHTML = '';

  const cardData = [
    { title: 'Items in stock', value: metrics.totalSkus, hint: 'Total products you have', accent: 'from-blue-500 to-cyan-400' },
    { title: 'Low stock items', value: metrics.criticalLow, hint: 'Need to order soon', accent: 'from-amber-500 to-orange-400' },
    { title: 'Today sales estimate', value: formatCurrency(metrics.dailyRevenue), hint: 'Approximate revenue today', accent: 'from-emerald-500 to-lime-400' }
  ];

  const grid = document.createElement('div');
  grid.className = 'grid gap-4 md:grid-cols-3';

  cardData.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'rounded-[24px] border border-slate-800/70 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30';
    article.innerHTML = `
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-slate-400">${card.title}</p>
        <div class="h-10 w-10 rounded-2xl bg-gradient-to-br ${card.accent} shadow-lg"></div>
      </div>
      <div class="mt-4 text-3xl font-semibold text-white">${card.value}</div>
      <p class="mt-2 text-sm text-slate-400">${card.hint}</p>
    `;
    grid.appendChild(article);
  });

  root.appendChild(grid);
  const layout = document.createElement('div');
  layout.className = 'grid gap-6 xl:grid-cols-[1.05fr_0.95fr]';
  layout.appendChild(renderAlerts());
  layout.appendChild(renderTrendChart());
  root.appendChild(layout);
}

function renderAlerts() {
  const alerts = state.aiLog.slice(0, 3);
  const container = document.createElement('div');
  container.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30';
  container.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Store notes</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Important alerts</h2>
      </div>
      <div class="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">Alerts</div>
    </div>
    <div class="mt-5 space-y-3">
      ${alerts.map((item) => `
        <div class="flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
          <span class="mt-1 inline-flex h-2.5 w-2.5 rounded-full ${item.tone === 'alert' ? 'bg-rose-500' : 'bg-cyan-400'}"></span>
          <div>
            <p class="text-sm font-medium text-white">${item.tone === 'alert' ? 'Urgent' : 'Advisory'}</p>
            <p class="mt-1 text-sm leading-6 text-slate-300">${item.text}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  return container;
}

function renderTrendChart() {
  const chart = document.createElement('div');
  chart.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/30';
  chart.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Customer demand</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Weekly sale trend</h2>
      </div>
      <div class="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-200">+18.4% demand</div>
    </div>
    <div class="mt-5 rounded-[24px] border border-slate-800/70 bg-slate-950/70 p-4">
      <svg viewBox="0 0 600 260" class="h-64 w-full">
        <defs>
          <linearGradient id="salesFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45" />
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
          </linearGradient>
        </defs>
        <g stroke="rgba(148,163,184,0.18)" stroke-width="1">
          <line x1="20" y1="40" x2="580" y2="40" />
          <line x1="20" y1="90" x2="580" y2="90" />
          <line x1="20" y1="140" x2="580" y2="140" />
          <line x1="20" y1="190" x2="580" y2="190" />
          <line x1="20" y1="240" x2="580" y2="240" />
        </g>
        <path d="M20 190 C80 170, 120 155, 160 135 S250 95, 300 120 S420 190, 480 160 S560 110, 580 80 L580 240 L20 240 Z" fill="url(#salesFill)" />
        <path d="M20 188 C85 162, 140 150, 180 132 S270 90, 320 102 S430 158, 480 138 S550 95, 580 72" stroke="#38bdf8" stroke-width="4" fill="none" stroke-linecap="round" />
        <path d="M20 205 C90 175, 155 168, 200 152 S280 120, 340 132 S430 176, 500 158 S550 132, 580 112" stroke="#f472b6" stroke-width="4" fill="none" stroke-linecap="round" stroke-dasharray="8 8" />
        <circle cx="480" cy="138" r="8" fill="#f472b6" />
        <circle cx="320" cy="102" r="8" fill="#38bdf8" />
      </svg>
    </div>
  `;
  return chart;
}

function renderInventory() {
  const root = document.getElementById('inventory-section');
  root.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/30 sm:p-6';
  root.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Inventory tracker</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Current store health</h2>
      </div>
      <div class="rounded-full border border-slate-700/70 bg-slate-950/70 px-3 py-1 text-sm text-slate-300">${state.storeName}</div>
    </div>
    <div class="mt-5 overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-800/70 text-sm">
        <thead>
          <tr class="text-left text-slate-400">
            <th class="px-3 py-3 font-medium">Item name</th>
            <th class="px-3 py-3 font-medium">In stock</th>
            <th class="px-3 py-3 font-medium">Min stock</th>
            <th class="px-3 py-3 font-medium">Price</th>
            <th class="px-3 py-3 font-medium">Status</th>
            <th class="px-3 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/70">
          ${state.inventory.map((item) => `
            <tr class="text-slate-300">
              <td class="px-3 py-4">
                <div class="font-medium text-white">${item.name}</div>
                <div class="mt-1 text-xs text-slate-400">Metric: ${item.unit}</div>
              </td>
              <td class="px-3 py-4">${item.stock} ${item.unit}</td>
              <td class="px-3 py-4">${item.reorderThreshold} ${item.unit}</td>
              <td class="px-3 py-4">${formatCurrency(item.price)}</td>
              <td class="px-3 py-4">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Low Stock' ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300'}">${item.status}</span>
              </td>
              <td class="px-3 py-4 text-right">
                <button class="quick-restock inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/25" data-id="${item.id}">
                  <svg viewBox="0 0 24 24" fill="none" class="mr-2 h-4 w-4" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  </svg>
                  Quick Restock
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderAI() {
  const root = document.getElementById('ai-section');
  root.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/30 sm:p-6';
  root.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Ask the store assistant</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Ask stock or order help</h2>
      </div>
      <div class="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">Local shop mode</div>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div class="rounded-[24px] border border-slate-800/70 bg-slate-950/70 p-4">
        <div id="chat-log" class="max-h-[420px] space-y-3 overflow-y-auto pr-2">
          ${state.chatMessages.map((message) => `
            <div class="flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}">
              <div class="max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-blue-600/80 text-white' : 'bg-slate-800/80 text-slate-200'}">
                <p class="text-[11px] uppercase tracking-[0.25em] opacity-80">${message.role === 'user' ? 'You' : 'KiranaBrain AI Agent'}</p>
                <p class="mt-1 text-sm leading-6">${message.message}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <form id="ai-form" class="mt-4 flex flex-col gap-3 sm:flex-row">
          <label class="flex-1">
            <span class="sr-only">Ask for stock help</span>
            <input id="message-input" type="text" placeholder="Type here: stock, low items, or order help" class="w-full rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 outline-none ring-0 transition focus:border-blue-500/60" autocomplete="off" />
          </label>
          <div class="flex flex-col gap-2 sm:flex-row">
            <button id="mic-btn" type="button" class="inline-flex items-center justify-center rounded-2xl border border-slate-700/70 bg-slate-800/80 p-3 text-slate-200 transition hover:border-cyan-500/60 hover:text-cyan-200" aria-label="Use voice command">
              <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
                <path d="M12 4a2.5 2.5 0 0 1 2.5 2.5v5A2.5 2.5 0 0 1 12 14a2.5 2.5 0 0 1-2.5-2.5v-5A2.5 2.5 0 0 1 12 4Zm-4 8.5a1 1 0 0 0-1 1V13a5 5 0 0 0 10 0v-.5a1 1 0 0 0-2 0V13a3 3 0 0 1-6 0v-.5a1 1 0 0 0-1-1Z" fill="currentColor" />
              </svg>
            </button>
            <button type="submit" class="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110">Send</button>
          </div>
        </form>

        <div id="voice-status" class="mt-3 text-sm text-cyan-200"></div>
      </div>

      <div class="rounded-[24px] border border-slate-800/70 bg-slate-950/70 p-4">
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Quick prompts</p>
        <div class="mt-4 flex flex-wrap gap-3">
          <button data-prompt="Sold 10 bags of Atta and check stock" class="quick-prompt rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/60 hover:bg-slate-800/80">Sold 10 bags of Atta</button>
          <button data-prompt="Which items are low in stock?" class="quick-prompt rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/60 hover:bg-slate-800/80">Which items are low?</button>
          <button data-prompt="What should I order for the weekend?" class="quick-prompt rounded-2xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500/60 hover:bg-slate-800/80">Order suggestion</button>
        </div>
        <div class="mt-6 rounded-[20px] border border-slate-800/70 bg-slate-900/70 p-4">
          <p class="text-sm font-medium text-white">Prototype behavior</p>
          <ul class="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <li>• AI answers instantly with context-aware retail guidance.</li>
            <li>• Inventory changes are reflected in the table and dashboard indicators.</li>
            <li>• Conversation logs preserve the latest store intelligence.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderOrderSection() {
  const root = document.getElementById('order-section');
  root.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/30 sm:p-6';
  root.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Place inventory order</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Create a supplier order</h2>
      </div>
      <div class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-200">Fast reorder</div>
    </div>

    <form id="order-form" class="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.6fr_auto]">
      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium text-slate-300">Select item</span>
        <select id="order-item" class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none">
          ${state.inventory.map((item) => `<option value="${item.name}">${item.name}</option>`).join('')}
        </select>
      </label>
      <label class="flex flex-col gap-2">
        <span class="text-sm font-medium text-slate-300">Quantity</span>
        <input id="order-quantity" type="number" min="1" value="5" class="rounded-2xl border border-slate-700/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none" />
      </label>
      <button type="submit" class="self-end rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:brightness-110">Place Order</button>
    </form>

    <div id="order-status" class="mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">
      ${state.orderMessage || 'Choose an item and quantity to request a purchase order.'}
    </div>
  `;
}

function renderOrdersSection() {
  const root = document.getElementById('orders-section');
  root.className = 'rounded-[28px] border border-slate-800/70 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/30 sm:p-6';
  root.innerHTML = `
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="text-sm uppercase tracking-[0.3em] text-blue-300">Order tracker</p>
        <h2 class="mt-1 text-xl font-semibold text-white">Pending and completed orders</h2>
      </div>
      <div class="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm text-violet-200">${state.orders.length} total</div>
    </div>

    <div class="mt-5 overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-800/70 text-sm">
        <thead>
          <tr class="text-left text-slate-400">
            <th class="px-3 py-3 font-medium">Item</th>
            <th class="px-3 py-3 font-medium">Qty</th>
            <th class="px-3 py-3 font-medium">Status</th>
            <th class="px-3 py-3 font-medium">Date</th>
            <th class="px-3 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800/70">
          ${state.orders.map((order) => `
            <tr class="text-slate-300">
              <td class="px-3 py-4 font-medium text-white">${order.itemName}</td>
              <td class="px-3 py-4">${order.quantity} ${order.unit}</td>
              <td class="px-3 py-4">
                <span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === 'Delivered' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}">${order.status}</span>
              </td>
              <td class="px-3 py-4">${order.createdAt}</td>
              <td class="px-3 py-4 text-right">
                ${order.status === 'Pending' ? `<button class="mark-delivered inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/25" data-id="${order.id}">Mark Delivered</button>` : '<span class="text-sm text-slate-500">Completed</span>'}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderApp() {
  updateInventoryStatuses();
  renderDashboard();
  renderInventory();
  renderAI();
  renderOrderSection();
  renderOrdersSection();
  setupInventoryHandlers();
  setupAIHandlers();
  setupOrderHandlers();
  setupOrdersHandlers();
  updateNavigation();
}

function setupNavigation() {
  document.querySelectorAll('[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currentView = btn.dataset.view;
      switchView();
    });
  });
}

function updateNavigation() {
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const isActive = btn.dataset.view === state.currentView;
    btn.classList.toggle('border-blue-500/60', isActive);
    btn.classList.toggle('bg-slate-800/80', isActive);
    btn.classList.toggle('text-white', isActive);
    btn.classList.toggle('text-slate-300', !isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function switchView() {
  const views = {
    dashboard: document.getElementById('dashboard-section'),
    inventory: document.getElementById('inventory-section'),
    ai: document.getElementById('ai-section'),
    order: document.getElementById('order-section'),
    orders: document.getElementById('orders-section')
  };

  Object.entries(views).forEach(([key, section]) => {
    section.classList.toggle('hidden', key !== state.currentView);
    section.classList.toggle('block', key === state.currentView);
  });

  renderApp();
  saveState();
}

function setupInventoryHandlers() {
  document.querySelectorAll('.quick-restock').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = Number(btn.dataset.id);
      const item = state.inventory.find((entry) => entry.id === targetId);
      if (!item) return;
      item.stock += 5;
      item.status = item.stock <= item.reorderThreshold ? 'Low Stock' : 'In Stock';
      state.aiLog.unshift({
        id: Date.now(),
        tone: 'info',
        text: `${item.name} received a quick restock. New stock: ${item.stock} ${item.unit}.`
      });
      saveState();
      renderApp();
    });
  });
}

function setupAIHandlers() {
  const form = document.getElementById('ai-form');
  const micButton = document.getElementById('mic-btn');

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = document.getElementById('message-input');
      const text = input.value.trim();
      if (!text) return;
      handlePrompt(text);
      input.value = '';
    });
  }

  document.querySelectorAll('.quick-prompt').forEach((btn) => {
    btn.addEventListener('click', () => handlePrompt(btn.dataset.prompt));
  });

  if (micButton) {
    micButton.addEventListener('click', startVoiceCommand);
  }
}

function setupOrderHandlers() {
  const form = document.getElementById('order-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const itemSelect = document.getElementById('order-item');
    const quantityInput = document.getElementById('order-quantity');
    const statusBox = document.getElementById('order-status');

    if (!itemSelect || !quantityInput || !statusBox) return;

    const itemName = itemSelect.value;
    const quantity = Number(quantityInput.value);

    if (!itemName || !quantity || quantity <= 0) {
      statusBox.textContent = 'Please choose a valid quantity.';
      return;
    }

    const existingItem = state.inventory.find((item) => item.name === itemName);
    if (!existingItem) return;

    state.orders.unshift({
      id: Date.now(),
      itemName,
      quantity,
      unit: existingItem.unit,
      status: 'Pending',
      createdAt: 'Just now'
    });

    state.orderMessage = `Order placed for ${quantity} ${existingItem.unit} of ${itemName}.`;
    state.aiLog.unshift({
      id: Date.now(),
      tone: 'info',
      text: `Placed a new order for ${quantity} ${existingItem.unit} of ${itemName}.`
    });

    saveState();
    renderApp();
  });
}

function setupOrdersHandlers() {
  document.querySelectorAll('.mark-delivered').forEach((btn) => {
    btn.addEventListener('click', () => {
      const orderId = Number(btn.dataset.id);
      const order = state.orders.find((item) => item.id === orderId);
      if (!order) return;

      order.status = 'Delivered';
      order.createdAt = 'Delivered now';
      state.orderMessage = `${order.itemName} marked as delivered.`;
      saveState();
      renderApp();
    });
  });
}

function handlePrompt(text) {
  state.chatMessages.push({ role: 'user', message: text });
  renderAI();
  saveState();
  setVoiceStatus('Processing your command...');

  setTimeout(() => {
    const reply = buildReply(text);
    state.chatMessages.push({ role: 'ai', message: reply });
    renderAI();
    saveState();
    speak(reply);
  }, 700);
}

function buildReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('sold 10 bags of atta') || lower.includes('sold 10 bags')) {
    const atta = state.inventory.find((item) => item.name.toLowerCase().includes('atta'));
    if (atta) {
      atta.stock = Math.max(0, atta.stock - 10);
      atta.status = atta.stock <= atta.reorderThreshold ? 'Low Stock' : 'In Stock';
      state.aiLog.unshift({
        id: Date.now(),
        tone: 'alert',
        text: `Processed sales. ${atta.name} dropped to ${atta.stock} ${atta.unit}. Flagged as ${atta.status}.`
      });
      renderApp();
      saveState();
      return `Processed sales. ${atta.name} dropped to ${atta.stock} ${atta.unit}. Flagged as Low Stock! Would you like me to draft an order request?`;
    }
  }

  if (lower.includes('running out today') || lower.includes('what items are running out')) {
    const lowItems = state.inventory.filter((item) => item.status === 'Low Stock').map((item) => item.name);
    if (lowItems.length) {
      return `These items are running out today: ${lowItems.join(', ')}.`;
    }
    return 'Great news — no product is currently flagged as low stock.';
  }

  if (lower.includes('weekend sales tip')) {
    return 'Saturdays show a 60% surge in dairy products. Ensure Amul Butter stock is increased by Friday evening.';
  }

  if (lower.includes('check stock') || lower.includes('restock')) {
    const lowItems = state.inventory.filter((item) => item.status === 'Low Stock').map((item) => `${item.name} (${item.stock})`);
    return lowItems.length
      ? `I recommend reordering these low-stock items: ${lowItems.join(', ')}.`
      : 'All tracked items are currently above reorder threshold.';
  }

  return 'I can help you check low stock, forecast demand, or draft a restock plan for your store.';
}

function speak(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-IN';
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function speakRecognizedText(text) {
  if (!text) return;
  const confirmation = `You said: ${text}`;
  speak(confirmation);
}

function setVoiceStatus(message, active = false) {
  const status = document.getElementById('voice-status');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('speech-active', active);
}

function startVoiceCommand() {
  const input = document.getElementById('message-input');

  if (!recognition) {
    setVoiceStatus('Mic support is not available in this browser. Please use Chrome or Edge.');
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  voiceTranscript = '';
  if (input) {
    input.value = '';
    input.focus();
  }

  isListening = true;
  setVoiceStatus('Listening... speak now.', true);
  recognition.start();
}

function initializeVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setVoiceStatus('Voice input is unavailable here. Please use Chrome or Edge.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    setVoiceStatus('Listening... speak now.', true);
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0].transcript.trim();
      if (!transcript) continue;

      if (result.isFinal) {
        finalTranscript += `${finalTranscript ? ' ' : ''}${transcript}`;
      } else {
        interimTranscript += `${interimTranscript ? ' ' : ''}${transcript}`;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    if (transcript) {
      voiceTranscript = transcript;
      const input = document.getElementById('message-input');
      if (input) {
        input.value = transcript;
        input.focus();
      }
      setVoiceStatus(finalTranscript ? 'Captured voice input. Sending...' : 'Listening... speak now.', true);
    }

    if (finalTranscript) {
      const input = document.getElementById('message-input');
      if (input) {
        input.value = finalTranscript;
      }
      speakRecognizedText(finalTranscript);
      handlePrompt(finalTranscript);
      if (input) {
        input.value = '';
      }
      recognition.stop();
    }
  };

  recognition.onerror = (event) => {
    console.warn('Speech recognition error', event.error);
    isListening = false;
    setVoiceStatus('Voice command failed. Try again or use the text box.');
  };

  recognition.onend = () => {
    isListening = false;
    if (voiceTranscript) {
      setVoiceStatus('Voice command sent.');
      voiceTranscript = '';
    } else {
      setVoiceStatus('Listening finished.');
    }
  };
}

async function initializeApp() {
  await loadState();
  initializeVoiceRecognition();
  renderApp();
  setupNavigation();
  updateNavigation();
  switchView();
}

window.addEventListener('DOMContentLoaded', initializeApp);
