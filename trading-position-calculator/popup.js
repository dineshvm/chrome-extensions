let stopMode = 1;
let tradeType = 'long';
let selectedProfitTargets = [2];
let currentCalculation = null;
let editingTradeId = null;
let currentFont = 'google-sans-code';
let historyView = 'table';

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  initializeEventListeners();
  loadSavedData();
  await loadTradeHistory();
  loadFontPreference();
  toggleHistoryView(historyView);
});

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['totalCapital', 'fontPreference', 'historyView']);
    if (result?.totalCapital) {
      document.getElementById('totalCapital').value = result.totalCapital;
    }
    if (result?.fontPreference) {
      currentFont = result.fontPreference;
    }
    if (result?.historyView) {
      historyView = result.historyView;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function toggleHistoryView(view) {
  historyView = view;
  
  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  
  if (view === 'table') {
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('cardView').style.display = 'none';
  } else {
    document.getElementById('tableView').style.display = 'none';
    document.getElementById('cardView').style.display = 'block';
  }
  
  chrome.storage.local.set({ historyView: view });
  
  await loadTradeHistory();
}

function loadFontPreference() {
  document.body.className = `font-${currentFont}`;
  document.querySelectorAll('.font-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === currentFont);
  });
}

function toggleFont(font) {
  currentFont = font;
  document.body.className = `font-${font}`;
  document.querySelectorAll('.font-toggle-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.font === font);
  });
  chrome.storage.local.set({ fontPreference: font });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  
  const targetTab = tab === 'calculator' ? 'calculatorTab' : 'historyTab';
  document.getElementById(targetTab).classList.add('active');
}

function initializeEventListeners() {
  document.querySelectorAll('.stop-btn').forEach(btn => {
    btn.addEventListener('click', () => selectStopMode(btn.dataset.stop));
  });

  document.querySelectorAll('.trade-type-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTradeType(btn.dataset.type));
  });

  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.addEventListener('click', () => selectRisk(btn.dataset.risk));
  });

  document.querySelectorAll('.profit-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleProfitTarget(btn.dataset.r));
  });

  document.querySelectorAll('.font-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleFont(btn.dataset.font));
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleHistoryView(btn.dataset.view));
  });

  document.getElementById('fetchPrice').addEventListener('click', fetchLivePrice);
  document.getElementById('calculateBtn').addEventListener('click', calculate);
  document.getElementById('saveTradeBtn').addEventListener('click', saveTrade);
  document.getElementById('clearHistoryBtn').addEventListener('click', clearAllHistory);
  document.getElementById('totalCapital').addEventListener('change', saveTotalCapital);
  document.getElementById('entryPrice').addEventListener('input', updateFibStops);
  document.getElementById('stopLoss').addEventListener('input', updateFibStops);
  document.getElementById('targetPrice').addEventListener('input', calculateTargetRR);
  
  document.addEventListener('click', (e) => {
    if (e.target.closest('.edit-btn')) {
      const tradeId = e.target.closest('.edit-btn').dataset.tradeId;
      if (tradeId) editTrade(tradeId);
    }
    if (e.target.closest('.delete-btn')) {
      const tradeId = e.target.closest('.delete-btn').dataset.tradeId;
      if (tradeId) deleteTrade(tradeId);
    }
  });
  
  document.getElementById('downloadHistoryBtn')?.addEventListener('click', downloadHistoryCSV);
}

function selectStopMode(mode) {
  stopMode = parseInt(mode);
  document.querySelectorAll('.stop-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stop === mode);
  });

  const fibStops = document.getElementById('fibStops');
  if (stopMode === 3) {
    fibStops.style.display = 'block';
    updateFibStops();
  } else {
    fibStops.style.display = 'none';
  }
}

function selectTradeType(type) {
  tradeType = type;
  document.querySelectorAll('.trade-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  updateFibStops();
}

function selectRisk(risk) {
  document.getElementById('riskPercent').value = risk;
  document.querySelectorAll('.risk-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.risk === risk);
  });
}

function toggleProfitTarget(r) {
  const rValue = parseInt(r);
  const index = selectedProfitTargets.indexOf(rValue);
  
  if (index > -1) {
    selectedProfitTargets.splice(index, 1);
  } else {
    selectedProfitTargets.push(rValue);
  }
  
  selectedProfitTargets.sort((a, b) => a - b);
  
  document.querySelectorAll('.profit-btn').forEach(btn => {
    btn.classList.toggle('selected', selectedProfitTargets.includes(parseInt(btn.dataset.r)));
  });
  
  if (currentCalculation) {
    const entry = parseFloat(document.getElementById('entryPrice').value);
    const finalStop = parseFloat(document.getElementById('stopLoss').value);
    const fullRiskPerShare = Math.abs(entry - finalStop);
    const netRiskMultiple = stopMode === 3 ? 0.706 : 1.0;
    displayProfitTargets(entry, fullRiskPerShare, currentCalculation.shares, currentCalculation.isLong, netRiskMultiple);
  }
}

function calculateTargetRR() {
  const entry = parseFloat(document.getElementById('entryPrice').value);
  const finalStop = parseFloat(document.getElementById('stopLoss').value);
  const targetPrice = parseFloat(document.getElementById('targetPrice').value);
  
  if (!entry || !finalStop || !targetPrice) {
    document.getElementById('targetRRDisplay').style.display = 'none';
    return;
  }
  
  const riskPerShare = Math.abs(entry - finalStop);
  const rewardPerShare = Math.abs(targetPrice - entry);
  
  const isValidTarget = (tradeType === 'long' && targetPrice > entry) || 
                        (tradeType === 'short' && targetPrice < entry);
  
  if (!isValidTarget || riskPerShare === 0) {
    document.getElementById('targetRRDisplay').style.display = 'none';
    return;
  }
  
  const rMultiple = rewardPerShare / riskPerShare;
  const netRiskMultiple = stopMode === 3 ? 0.706 : 1;
  const actualRR = rMultiple / netRiskMultiple;
  
  let rrText = `${rMultiple.toFixed(2)}R`;
  if (stopMode === 3) {
    rrText += ` (${actualRR.toFixed(1)}:1 actual)`;
  }
  
  document.getElementById('targetRRValue').textContent = rrText;
  document.getElementById('targetRRDisplay').style.display = 'flex';
}

function updateFibStops() {
  if (stopMode !== 3) return;

  const entry = parseFloat(document.getElementById('entryPrice').value);
  const finalStop = parseFloat(document.getElementById('stopLoss').value);

  if (!entry || !finalStop) return;

  const fullRisk = Math.abs(entry - finalStop);
  const isLong = tradeType === 'long';

  const stop1 = isLong ? entry + (fullRisk * 0.5) : entry - (fullRisk * 0.5);
  const stop2 = isLong ? entry + (fullRisk * 0.618) : entry - (fullRisk * 0.618);
  const stop3 = finalStop;

  document.getElementById('stop1').textContent = stop1.toFixed(2);
  document.getElementById('stop2').textContent = stop2.toFixed(2);
  document.getElementById('stop3').textContent = stop3.toFixed(2);
  document.getElementById('fibStops').style.display = 'block';
  
  calculateTargetRR();
}

async function fetchLivePrice() {
  const ticker = document.getElementById('ticker').value.trim();
  
  if (!ticker) {
    alert('Please enter a ticker symbol');
    return;
  }

  const fetchBtn = document.getElementById('fetchPrice');
  fetchBtn.textContent = 'Loading...';
  fetchBtn.disabled = true;

  try {
    const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`;
    
    document.getElementById('dataSource').textContent = 'Data: Yahoo Finance';
    await fetchFromYahooFinance(symbol);
    
  } catch (error) {
    console.error('API error:', error);
    alert(`Error fetching price: ${error.message}\n\nTry:\n- RELIANCE.NS for NSE\n- RELIANCE.BO for BSE\n- Check ticker symbol`);
  } finally {
    fetchBtn.textContent = 'Fetch';
    fetchBtn.disabled = false;
  }
}

async function fetchYahooHistoricalData(symbol) {
  try {
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = endDate - (86400 * 5);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`;
    const response = await fetch(url);
    const data = await response.json();
    
    const quotes = data?.chart?.result?.[0]?.indicators?.quote?.[0];
    
    if (quotes?.low?.length >= 2 && quotes?.high?.length >= 2) {
      const prevIndex = quotes.low.length - 2;
      const prevLow = quotes.low[prevIndex];
      const prevHigh = quotes.high[prevIndex];
      document.getElementById('prevLod').textContent = prevLow ? prevLow.toFixed(2) : '-';
      document.getElementById('prevHod').textContent = prevHigh ? prevHigh.toFixed(2) : '-';
    } else {
      document.getElementById('prevLod').textContent = '-';
      document.getElementById('prevHod').textContent = '-';
    }
  } catch (error) {
    console.error('Yahoo historical data error:', error);
    document.getElementById('prevLod').textContent = '-';
    document.getElementById('prevHod').textContent = '-';
  }
}

async function fetchFromYahooFinance(ticker) {
  const symbol = ticker.includes('.') ? ticker : `${ticker}.NS`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (!data.chart || !data.chart.result || !data.chart.result[0]) {
    throw new Error('Invalid ticker or no data available');
  }
  
  const result = data?.chart?.result?.[0];
  const meta = result?.meta;
  const quotes = result?.indicators?.quote?.[0];
  
  const currentPrice = meta.regularMarketPrice || 0;
  const prevClose = meta.chartPreviousClose || meta.previousClose || currentPrice;
  
  document.getElementById('currentPrice').textContent = currentPrice.toFixed(2);
  document.getElementById('lod').textContent = (meta.regularMarketDayLow || quotes.low?.[quotes.low.length - 1] || currentPrice).toFixed(2);
  document.getElementById('hod').textContent = (meta.regularMarketDayHigh || quotes.high?.[quotes.high.length - 1] || currentPrice).toFixed(2);
  document.getElementById('prevClose').textContent = prevClose.toFixed(2);
  document.getElementById('entryPrice').value = currentPrice.toFixed(2);
  
  if (quotes.low && quotes.low.length >= 2 && quotes.high && quotes.high.length >= 2) {
    const prevLow = quotes.low[quotes.low.length - 2];
    const prevHigh = quotes.high[quotes.high.length - 2];
    document.getElementById('prevLod').textContent = prevLow ? prevLow.toFixed(2) : '-';
    document.getElementById('prevHod').textContent = prevHigh ? prevHigh.toFixed(2) : '-';
  } else {
    document.getElementById('prevLod').textContent = '-';
    document.getElementById('prevHod').textContent = '-';
  }
  
  document.getElementById('priceGrid').style.display = 'grid';
}

function calculate() {
  const capital = parseFloat(document.getElementById('totalCapital').value);
  const entry = parseFloat(document.getElementById('entryPrice').value);
  const finalStop = parseFloat(document.getElementById('stopLoss').value);
  const riskPercent = parseFloat(document.getElementById('riskPercent').value);

  if (!capital || !entry || !finalStop || !riskPercent) {
    alert('Please fill in all required fields');
    return;
  }

  const isLong = tradeType === 'long';
  const fullRiskPerShare = Math.abs(entry - finalStop);
  const totalRiskAmount = capital * (riskPercent / 100);

  let shares = 0;
  let effectiveRiskPerShare = fullRiskPerShare;
  let netRiskMultiple = 1.0;

  if (stopMode === 1) {
    shares = Math.floor(totalRiskAmount / fullRiskPerShare);
    netRiskMultiple = 1.0;
  } else {
    const stop1Risk = fullRiskPerShare * 0.5;
    const stop2Risk = fullRiskPerShare * 0.618;
    const stop3Risk = fullRiskPerShare * 1.0;
    
    const avgRisk = (stop1Risk + stop2Risk + stop3Risk) / 3;
    netRiskMultiple = avgRisk / fullRiskPerShare;
    
    effectiveRiskPerShare = avgRisk;
    shares = Math.floor(totalRiskAmount / avgRisk);
    
    document.getElementById('netRisk').textContent = `-${netRiskMultiple.toFixed(2)}R`;
  }

  const tradeValue = shares * entry;
  const tradeValuePercent = (tradeValue / capital) * 100;
  const actualRisk = shares * effectiveRiskPerShare;

  const sharesPerStop = stopMode === 3 ? Math.floor(shares / 3) : shares;
  const displayText = stopMode === 3 
    ? `${shares} shares (${sharesPerStop} per stop)`
    : `${shares} shares`;

  document.getElementById('sharesCount').textContent = displayText;
  document.getElementById('sharesDetail').textContent = 
    `₹${tradeValue.toFixed(2)} (${tradeValuePercent.toFixed(1)}%) - Risk ₹${actualRisk.toFixed(2)}`;

  document.getElementById('tradeValue').textContent = 
    `₹${tradeValue.toFixed(2)} (${tradeValuePercent.toFixed(1)}%)`;
  document.getElementById('riskAmount').textContent = 
    `${riskPercent}% / ₹${actualRisk.toFixed(2)}`;

  if (selectedProfitTargets.length > 0) {
    displayProfitTargets(entry, fullRiskPerShare, shares, isLong, netRiskMultiple);
  }

  currentCalculation = {
    ticker: document.getElementById('ticker').value.trim(),
    capital,
    entry,
    finalStop,
    riskPercent,
    shares,
    tradeValue,
    stopMode,
    tradeType,
    netRiskMultiple,
    profitTargets: selectedProfitTargets,
    isLong,
    fullRiskPerShare,
    actualRisk,
    notes: document.getElementById('tradeNotes').value.trim()
  };

  document.getElementById('saveTradeBtn').style.display = 'block';
  saveCalculation({capital, entry, finalStop, riskPercent, shares, tradeValue});
}

function displayProfitTargets(entry, fullRiskPerShare, shares, isLong, netRiskMultiple) {
  const profitValuesDiv = document.getElementById('profitValues');
  profitValuesDiv.innerHTML = '';

  selectedProfitTargets.forEach(r => {
    const targetPrice = isLong 
      ? entry + (fullRiskPerShare * r)
      : entry - (fullRiskPerShare * r);
    
    const profitAmount = shares * fullRiskPerShare * r;

    const row = document.createElement('div');
    row.className = 'profit-row';
    
    let rrDisplay;
    if (stopMode === 3) {
      const actualRR = (r / netRiskMultiple).toFixed(1);
      rrDisplay = `${r}R (${actualRR}:1 actual)`;
    } else {
      rrDisplay = `${r}R`;
    }
    
    row.innerHTML = `
      <span>${rrDisplay} @ ₹${targetPrice.toFixed(2)}</span>
      <span>₹${profitAmount.toFixed(2)}</span>
    `;
    profitValuesDiv.appendChild(row);
  });

  profitValuesDiv.classList.add('show');
}


async function saveTotalCapital() {
  try {
    const capital = document.getElementById('totalCapital').value;
    await chrome.storage.local.set({ totalCapital: capital });
  } catch (error) {
    console.error('Error saving capital:', error);
  }
}

async function saveCalculation(data) {
  try {
    await chrome.storage.local.set({ lastCalculation: data });
  } catch (error) {
    console.error('Error saving calculation:', error);
  }
}

async function loadSavedData() {
  try {
    const result = await chrome.storage.local.get(['lastCalculation']);
    if (result?.lastCalculation) {
      const data = result.lastCalculation;
      if (data?.entry) document.getElementById('entryPrice').value = data.entry;
      if (data?.finalStop) document.getElementById('stopLoss').value = data.finalStop;
      if (data?.riskPercent) document.getElementById('riskPercent').value = data.riskPercent;
    }
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
}

async function saveTrade() {
  if (!currentCalculation) {
    alert('Please calculate a trade first');
    return;
  }

  try {
    const notes = document.getElementById('tradeNotes')?.value?.trim() || '';
    
    const trade = {
      id: editingTradeId || Date.now().toString(),
      timestamp: editingTradeId ? (await getTradeById(editingTradeId))?.timestamp || Date.now() : Date.now(),
      ...currentCalculation,
      notes
    };

    const result = await chrome.storage.local.get(['tradeHistory']);
    let trades = result?.tradeHistory || [];

    if (editingTradeId) {
      trades = trades.map(t => t.id === editingTradeId ? trade : t);
      editingTradeId = null;
      switchTab('history');
    } else {
      trades.unshift(trade);
    }

    await chrome.storage.local.set({ tradeHistory: trades });
    await loadTradeHistory();
    document.getElementById('saveTradeBtn').style.display = 'none';
    document.getElementById('tradeNotes').value = '';
  } catch (error) {
    console.error('Error saving trade:', error);
    alert('Failed to save trade. Please try again.');
  }
}

async function getTradeById(id) {
  try {
    const result = await chrome.storage.local.get(['tradeHistory']);
    const trades = result?.tradeHistory || [];
    return trades.find(t => t?.id === id);
  } catch (error) {
    console.error('Error getting trade:', error);
    return null;
  }
}

async function loadTradeHistory() {
  try {
    const result = await chrome.storage.local.get(['tradeHistory']);
    const trades = result?.tradeHistory || [];
    
    if (historyView === 'table') {
      loadTableView(trades);
    } else {
      loadCardView(trades);
    }
  } catch (error) {
    console.error('Error loading trade history:', error);
  }
}

function loadTableView(trades) {
  const tbody = document.getElementById('tableViewBody');
  
  if (trades.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="10">No trades saved yet</td></tr>';
    return;
  }
  
  tbody.innerHTML = '';
  
  trades.forEach(trade => {
    const row = createTableRow(trade);
    tbody.appendChild(row);
  });
}

function createTableRow(trade) {
  const tr = document.createElement('tr');
  
  const date = new Date(trade?.timestamp || Date.now());
  const dateStr = date.toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short',
    year: 'numeric'
  });
  
  const tradeTypeClass = trade?.tradeType === 'short' ? 'short' : 'long';
  const tradeTypeText = trade?.tradeType === 'short' ? 'SHORT' : 'LONG';
  
  const positionPercent = trade?.capital && trade?.tradeValue 
    ? ((trade.tradeValue / trade.capital) * 100).toFixed(1)
    : '0.0';
  
  tr.innerHTML = `
    <td class="td-date">${dateStr}</td>
    <td class="td-ticker"><span class="table-ticker" title="${trade?.ticker || 'N/A'}">${trade?.ticker || 'N/A'}</span></td>
    <td><span class="table-type ${tradeTypeClass}">${tradeTypeText}</span></td>
    <td>₹${trade?.entry?.toFixed(2) || '0.00'}</td>
    <td>₹${trade?.finalStop?.toFixed(2) || '0.00'}</td>
    <td>${trade?.shares || 0}</td>
    <td>${positionPercent}%</td>
    <td>${trade?.riskPercent || 0}%</td>
    <td>${trade?.profitTargets?.join('R, ') || '-'}R</td>
    <td>
      <div class="table-actions">
        <button class="table-action-btn edit-btn" data-trade-id="${trade?.id}" title="Edit trade">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="table-action-btn delete-btn" data-trade-id="${trade?.id}" title="Delete trade">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </td>
  `;
  
  return tr;
}

function loadCardView(trades) {
  const listDiv = document.getElementById('tradeHistoryList');
  
  if (trades.length === 0) {
    listDiv.innerHTML = '<div class="empty-history"><span>No trades saved yet</span></div>';
    return;
  }

  const groupedTrades = groupTradesByDate(trades);
  
  listDiv.innerHTML = '';
  Object.keys(groupedTrades).forEach(dateKey => {
    const dateGroup = createDateGroup(dateKey, groupedTrades[dateKey]);
    listDiv.appendChild(dateGroup);
  });
}

function groupTradesByDate(trades) {
  const grouped = {};
  
  trades.forEach(trade => {
    if (!trade?.timestamp) return;
    
    const date = new Date(trade.timestamp);
    const dateKey = date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(trade);
  });
  
  return grouped;
}

function createDateGroup(dateKey, trades) {
  const groupDiv = document.createElement('div');
  groupDiv.className = 'date-group';
  
  const headerDiv = document.createElement('div');
  headerDiv.className = 'date-group-header';
  
  const today = new Date().toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  
  let displayDate = dateKey;
  if (dateKey === today) {
    displayDate = 'Today';
  } else if (dateKey === yesterday) {
    displayDate = 'Yesterday';
  }
  
  headerDiv.innerHTML = `
    <span class="date-group-title">${displayDate}</span>
    <span class="date-group-count">${trades.length} trade${trades.length > 1 ? 's' : ''}</span>
  `;
  
  groupDiv.appendChild(headerDiv);
  
  trades.forEach(trade => {
    const tradeItem = createTradeItem(trade);
    groupDiv.appendChild(tradeItem);
  });
  
  return groupDiv;
}

function createTradeItem(trade) {
  const div = document.createElement('div');
  div.className = 'trade-item';
  div.dataset.id = trade?.id || '';

  const date = new Date(trade?.timestamp || Date.now());
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const tradeTypeClass = trade?.tradeType === 'short' ? 'short' : 'long';
  const tradeTypeText = trade?.tradeType === 'short' ? '📉 SHORT' : '📈 LONG';
  const stopModeText = trade?.stopMode === 3 ? '3 Stops' : '1 Stop';
  const netRiskText = trade?.stopMode === 3 ? ` (Net: -${trade?.netRiskMultiple?.toFixed(2) || '0.70'}R)` : '';
  
  const positionPercent = trade?.capital && trade?.tradeValue 
    ? ((trade.tradeValue / trade.capital) * 100).toFixed(1)
    : '0.0';

  div.innerHTML = `
    <div class="trade-header">
      <div>
        <div class="trade-ticker">
          ${trade.ticker || 'N/A'}
          <span class="trade-type-badge ${tradeTypeClass}">${tradeTypeText}</span>
        </div>
        <div class="trade-date">${timeStr}</div>
      </div>
      <div class="trade-actions">
        <button class="trade-action-btn edit-btn" data-trade-id="${trade.id}" title="Edit trade">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="trade-action-btn delete-btn" data-trade-id="${trade.id}" title="Delete trade">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="trade-details">
      <div class="trade-detail">
        <span class="trade-detail-label">Entry</span>
        <span class="trade-detail-value">₹${trade.entry.toFixed(2)}</span>
      </div>
      <div class="trade-detail">
        <span class="trade-detail-label">Stop</span>
        <span class="trade-detail-value">₹${trade.finalStop.toFixed(2)}</span>
      </div>
      <div class="trade-detail">
        <span class="trade-detail-label">Shares</span>
        <span class="trade-detail-value">${trade.shares}</span>
      </div>
      <div class="trade-detail">
        <span class="trade-detail-label">Position %</span>
        <span class="trade-detail-value">${positionPercent}%</span>
      </div>
      <div class="trade-detail">
        <span class="trade-detail-label">Type</span>
        <span class="trade-detail-value">${tradeTypeText}</span>
      </div>
      <div class="trade-detail">
        <span class="trade-detail-label">Stop Mode</span>
        <span class="trade-detail-value">${stopModeText}${netRiskText}</span>
      </div>
    </div>
    <div class="trade-stats">
      <div class="trade-stat">
        <span class="trade-stat-label">Trade Value</span>
        <span class="trade-stat-value">₹${trade.tradeValue.toFixed(2)}</span>
      </div>
      <div class="trade-stat">
        <span class="trade-stat-label">Risk ${trade.riskPercent}%</span>
        <span class="trade-stat-value risk">₹${trade.actualRisk.toFixed(2)}</span>
      </div>
      <div class="trade-stat">
        <span class="trade-stat-label">Targets</span>
        <span class="trade-stat-value">${trade.profitTargets.join('R, ')}R</span>
      </div>
    </div>
    ${trade.notes ? `
    <div class="trade-notes">
      <span class="trade-notes-label">Trade Notes</span>
      <div class="trade-notes-text">${trade.notes}</div>
    </div>
    ` : ''}
  `;

  return div;
}

window.editTrade = async function(tradeId) {
  try {
    console.log('Edit trade called with ID:', tradeId);
    const trade = await getTradeById(tradeId);
    if (!trade) {
      console.error('Trade not found:', tradeId);
      return;
    }

    editingTradeId = tradeId;
    console.log('Switching to calculator tab...');
    
    switchTab('calculator');
    
    document.getElementById('ticker').value = trade?.ticker || '';
    document.getElementById('totalCapital').value = trade?.capital || '';
    document.getElementById('entryPrice').value = trade?.entry || '';
    document.getElementById('stopLoss').value = trade?.finalStop || '';
    document.getElementById('riskPercent').value = trade?.riskPercent || '';
    document.getElementById('tradeNotes').value = trade?.notes || '';
    
    selectStopMode((trade?.stopMode || 1).toString());
    selectTradeType(trade?.tradeType || 'long');
    
    selectedProfitTargets = [...(trade?.profitTargets || [2])];
    document.querySelectorAll('.profit-btn').forEach(btn => {
      btn.classList.toggle('selected', selectedProfitTargets.includes(parseInt(btn.dataset.r)));
    });
    
    calculate();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error('Error editing trade:', error);
    alert('Failed to load trade for editing.');
  }
};

window.deleteTrade = async function(tradeId) {
  console.log('Delete trade called with ID:', tradeId);
  if (!confirm('Are you sure you want to delete this trade? This action cannot be undone.')) return;
  
  try {
    const result = await chrome.storage.local.get(['tradeHistory']);
    let trades = result?.tradeHistory || [];
    console.log('Trades before delete:', trades.length);
    trades = trades.filter(t => t?.id !== tradeId);
    console.log('Trades after delete:', trades.length);
    
    await chrome.storage.local.set({ tradeHistory: trades });
    await loadTradeHistory();
  } catch (error) {
    console.error('Error deleting trade:', error);
    alert('Failed to delete trade. Please try again.');
  }
};

async function clearAllHistory() {
  if (!confirm('Clear all trade history? This cannot be undone.')) return;
  
  try {
    await chrome.storage.local.set({ tradeHistory: [] });
    await loadTradeHistory();
  } catch (error) {
    console.error('Error clearing history:', error);
    alert('Failed to clear history. Please try again.');
  }
}

async function downloadHistoryCSV() {
  try {
    const result = await chrome.storage.local.get(['tradeHistory']);
    const trades = result?.tradeHistory || [];
    
    if (trades.length === 0) {
      alert('No trades to export');
      return;
    }
    
    const headers = ['Date', 'Ticker', 'Type', 'Entry', 'Stop', 'Shares', 'Position %', 'Risk %', 'Trade Value', 'Targets', 'Notes'];
    const csvRows = [headers.join(',')];
    
    trades.forEach(trade => {
      const date = new Date(trade?.timestamp || Date.now());
      const dateStr = date.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short',
        year: 'numeric'
      });
      
      const positionPercent = trade?.capital && trade?.tradeValue 
        ? ((trade.tradeValue / trade.capital) * 100).toFixed(1)
        : '0.0';
      
      const row = [
        dateStr,
        trade?.ticker || 'N/A',
        trade?.tradeType === 'short' ? 'SHORT' : 'LONG',
        trade?.entry?.toFixed(2) || '0.00',
        trade?.finalStop?.toFixed(2) || '0.00',
        trade?.shares || 0,
        positionPercent,
        trade?.riskPercent || 0,
        trade?.tradeValue?.toFixed(2) || '0.00',
        trade?.profitTargets?.join(' ') || '-',
        `"${(trade?.notes || '').replace(/"/g, '""')}"` 
      ];
      
      csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trade-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    alert('Failed to download CSV. Please try again.');
  }
}
