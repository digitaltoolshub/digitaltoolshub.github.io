// Global variables
let priceChart;
let arimaChart;
let lstmChart;
let activeAlerts = JSON.parse(localStorage.getItem('cryptoAlerts')) || [];
let portfolio = JSON.parse(localStorage.getItem('cryptoPortfolio')) || [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initMarketOverview();
    initPriceChart();
    initSentimentAnalysis();
    initPredictions();
    initPortfolioTracker();
    initAlerts();
    
    // Set up periodic data refreshes
    setInterval(updateMarketData, 300000); // 5 minutes
    setInterval(checkAlerts, 60000); // 1 minute
    
    // Load any saved portfolio or alerts
    updatePortfolioDisplay();
    updateAlertsDisplay();
});

// 1. Real-Time Data from Public APIs
async function initMarketOverview() {
    // Fetch top cryptocurrencies
    const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
    const data = await response.json();
    
    const container = document.getElementById('top-cryptos');
    container.innerHTML = '';
    
    data.forEach(crypto => {
        const changeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changeSymbol = crypto.price_change_percentage_24h >= 0 ? '↑' : '↓';
        
        const card = document.createElement('div');
        card.className = 'crypto-card';
        card.innerHTML = `
            <div class="crypto-name">
                <img src="${crypto.image}" alt="${crypto.name}">
                <span>${crypto.symbol.toUpperCase()}</span>
            </div>
            <div class="crypto-price">$${crypto.current_price.toLocaleString()}</div>
            <div class="crypto-change ${changeClass}">
                ${changeSymbol} ${Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </div>
            <div class="crypto-volume">Vol: $${(crypto.total_volume / 1000000).toFixed(2)}M</div>
        `;
        container.appendChild(card);
    });
    
    // Initialize heatmap
    initVolatilityHeatmap(data);
}

function initVolatilityHeatmap(cryptoData) {
    // Simplified heatmap visualization
    const heatmap = document.getElementById('volatility-heatmap');
    heatmap.innerHTML = '';
    
    // Create a simple grid visualization
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(auto-fill, minmax(80px, 1fr))';
    gridContainer.style.gap = '10px';
    gridContainer.style.width = '100%';
    gridContainer.style.height = '100%';
    
    cryptoData.forEach(crypto => {
        const volatility = Math.abs(crypto.price_change_percentage_24h);
        const intensity = Math.min(100, volatility * 5); // Scale for visibility
        
        const cell = document.createElement('div');
        cell.style.backgroundColor = `hsl(0, 100%, ${100 - intensity}%)`;
        cell.style.borderRadius = '4px';
        cell.style.padding = '5px';
        cell.style.display = 'flex';
        cell.style.flexDirection = 'column';
        cell.style.justifyContent = 'center';
        cell.style.alignItems = 'center';
        cell.style.color = intensity > 50 ? 'white' : 'black';
        cell.innerHTML = `
            <div style="font-weight: bold;">${crypto.symbol.toUpperCase()}</div>
            <div>${volatility.toFixed(2)}%</div>
        `;
        
        gridContainer.appendChild(cell);
    });
    
    heatmap.appendChild(gridContainer);
}

// 2. Client-Side Technical Analysis
async function initPriceChart() {
    const cryptoSelector = document.getElementById('crypto-selector');
    const timeframe = document.getElementById('timeframe');
    
    // Load initial chart
    await updatePriceChart(cryptoSelector.value, timeframe.value);
    
    // Set up event listeners
    cryptoSelector.addEventListener('change', async () => {
        await updatePriceChart(cryptoSelector.value, timeframe.value);
    });
    
    timeframe.addEventListener('change', async () => {
        await updatePriceChart(cryptoSelector.value, timeframe.value);
    });
    
    document.getElementById('add-indicator').addEventListener('click', () => {
        addTechnicalIndicator(cryptoSelector.value, timeframe.value);
    });
}

async function updatePriceChart(cryptoId, days) {
    // Fetch historical data
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=usd&days=${days}`);
    const data = await response.json();
    
    // Process data for Chart.js - ensure dates are properly formatted
    const prices = data.prices.map(price => ({
        x: price[0],  // Keep as timestamp
        y: price[1]
    }));
    
    // Calculate indicators (unchanged)
    const rsi = calculateRSI(prices.map(p => p.y), 14);
    const macd = calculateMACD(prices.map(p => p.y));
    const bollinger = calculateBollingerBands(prices.map(p => p.y), 20);
    
    // Update indicator displays (unchanged)
    document.getElementById('rsi-display').querySelector('.value').textContent = rsi[rsi.length - 1].toFixed(2);
    document.getElementById('macd-display').querySelector('.value').textContent = macd.histogram[macd.histogram.length - 1].toFixed(2);
    document.getElementById('bollinger-display').querySelector('.value').textContent = 
        `Upper: $${bollinger.upper[bollinger.upper.length - 1].toFixed(2)}, Lower: $${bollinger.lower[bollinger.lower.length - 1].toFixed(2)}`;
    
    // Create or update chart
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    if (priceChart) {
        priceChart.destroy();
    }
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Price',
                data: prices,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                yAxisID: 'y'
            }, {
                label: 'RSI',
                data: rsi.map((value, index) => ({
                    x: prices[index].x,  // Use same timestamp
                    y: value
                })),
                borderColor: 'rgb(255, 99, 132)',
                yAxisID: 'y1',
                hidden: true
            }]
        },
        options: {
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'day'
            }
        }
    }
}
    });
}

function addTechnicalIndicator(cryptoId, days) {
    // In a real implementation, this would add the selected indicator to the chart
    alert('In a full implementation, this would open a dialog to select and add technical indicators to the chart.');
}

// Technical Indicator Calculations
function calculateRSI(prices, period = 14) {
    let gains = [];
    let losses = [];
    
    for (let i = 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        gains.push(change >= 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate average gains and losses
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    
    let rsValues = [avgGain / avgLoss];
    let rsiValues = [100 - (100 / (1 + rsValues[0]))];
    
    for (let i = period; i < gains.length; i++) {
        avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
        avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;
        
        const rs = avgGain / avgLoss;
        rsValues.push(rs);
        rsiValues.push(100 - (100 / (1 + rs)));
    }
    
    // Pad the beginning with null values for alignment with prices
    return Array(period).fill(null).concat(rsiValues);
}

function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    // Calculate EMAs
    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    
    // Calculate MACD line
    const macdLine = [];
    for (let i = 0; i < prices.length; i++) {
        if (fastEMA[i] !== null && slowEMA[i] !== null) {
            macdLine.push(fastEMA[i] - slowEMA[i]);
        } else {
            macdLine.push(null);
        }
    }
    
    // Calculate Signal line (EMA of MACD line)
    const signalLine = calculateEMA(macdLine.filter(v => v !== null), signalPeriod);
    
    // Calculate Histogram (MACD - Signal)
    const histogram = [];
    for (let i = 0; i < macdLine.length; i++) {
        if (macdLine[i] !== null && signalLine[i] !== null) {
            histogram.push(macdLine[i] - signalLine[i]);
        } else {
            histogram.push(null);
        }
    }
    
    return {
        macd: macdLine,
        signal: signalLine,
        histogram: histogram
    };
}

function calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    const ema = [];
    
    // Calculate SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += prices[i];
        ema.push(null); // Pad beginning with null
    }
    
    // First EMA value is SMA
    let firstEMA = sum / period;
    ema[period - 1] = firstEMA;
    
    // Calculate subsequent EMA values
    for (let i = period; i < prices.length; i++) {
        ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
}

function calculateBollingerBands(prices, period = 20, multiplier = 2) {
    const upperBand = [];
    const lowerBand = [];
    const middleBand = [];
    
    for (let i = 0; i < prices.length; i++) {
        if (i < period - 1) {
            upperBand.push(null);
            lowerBand.push(null);
            middleBand.push(null);
            continue;
        }
        
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        middleBand.push(mean);
        upperBand.push(mean + (stdDev * multiplier));
        lowerBand.push(mean - (stdDev * multiplier));
    }
    
    return {
        upper: upperBand,
        middle: middleBand,
        lower: lowerBand
    };
}

// 3. Sentiment Analysis
async function initSentimentAnalysis() {
    // Simulate sentiment analysis from public sources
    // Note: In a real implementation, you would use actual RSS feeds or other public APIs
    
    // Reddit sentiment
    const redditSentiments = ['Very Positive', 'Positive', 'Neutral', 'Negative', 'Very Negative'];
    document.getElementById('reddit-sentiment').textContent = 
        redditSentiments[Math.floor(Math.random() * redditSentiments.length)];
    
    // Twitter sentiment
    const twitterSentiments = ['Bullish', 'Slightly Bullish', 'Neutral', 'Slightly Bearish', 'Bearish'];
    document.getElementById('twitter-sentiment').textContent = 
        twitterSentiments[Math.floor(Math.random() * twitterSentiments.length)];
    
    // Google Trends
    const trendDirections = ['Rising', 'Falling', 'Steady', 'Volatile'];
    document.getElementById('google-trends').textContent = 
        `Interest is ${trendDirections[Math.floor(Math.random() * trendDirections.length)]}`;
}

// 4. Predictive Models
async function initPredictions() {
    // ARIMA Model
    const arimaCtx = document.getElementById('arimaChart').getContext('2d');
    
    // Generate sample ARIMA prediction
    const arimaData = generateSamplePrediction('ARIMA');
    arimaChart = new Chart(arimaCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 14}, (_, i) => `Day ${i + 1}`),
            datasets: [{
                label: 'Predicted Price',
                data: arimaData,
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '7-Day ARIMA Forecast'
                }
            }
        }
    });
    
    // LSTM Model
    const lstmCtx = document.getElementById('lstmChart').getContext('2d');
    
    // Generate sample LSTM prediction
    const lstmData = generateSamplePrediction('LSTM');
    lstmChart = new Chart(lstmCtx, {
        type: 'line',
        data: {
            labels: Array.from({length: 14}, (_, i) => `Day ${i + 1}`),
            datasets: [{
                label: 'Predicted Price',
                data: lstmData,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '7-Day LSTM Forecast'
                }
            }
        }
    });
    
    // Pattern Recognition
    initPatternRecognition();
}

function generateSamplePrediction(modelType) {
    // Generate a realistic-looking prediction curve
    const baseValue = 30000 + Math.random() * 10000;
    const data = [baseValue];
    
    for (let i = 1; i < 14; i++) {
        // Different patterns for different models
        if (modelType === 'ARIMA') {
            // More linear with some noise
            const trend = Math.random() > 0.3 ? 1 : -1;
            data.push(data[i-1] + trend * (100 + Math.random() * 300));
        } else {
            // LSTM - more complex pattern
            const oscillation = Math.sin(i * 0.5) * 500;
            const noise = (Math.random() - 0.5) * 200;
            data.push(data[i-1] + oscillation + noise);
        }
    }
    
    return data;
}

function initPatternRecognition() {
    const canvas = document.getElementById('patternCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Draw a sample pattern
    ctx.strokeStyle = '#2962ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const width = canvas.width;
    const height = canvas.height;
    const midY = height / 2;
    
    // Draw a head-and-shoulders pattern
    ctx.moveTo(0, midY);
    ctx.lineTo(width * 0.2, midY - height * 0.3);
    ctx.lineTo(width * 0.4, midY);
    ctx.lineTo(width * 0.6, midY - height * 0.4);
    ctx.lineTo(width * 0.8, midY);
    ctx.lineTo(width, midY - height * 0.3);
    
    ctx.stroke();
    
    // Set pattern detection text
    document.getElementById('pattern-output').textContent = 
        'Detected: Head and Shoulders Pattern (Bearish)';
}

// 5. Portfolio Tracker
function initPortfolioTracker() {
    document.getElementById('add-to-portfolio').addEventListener('click', addToPortfolio);
}

function addToPortfolio() {
    const cryptoInput = document.getElementById('crypto-input').value.trim().toUpperCase();
    const amount = parseFloat(document.getElementById('amount-input').value);
    const price = parseFloat(document.getElementById('price-input').value);
    
    if (!cryptoInput || isNaN(amount) || isNaN(price)) {
        alert('Please fill in all fields with valid values');
        return;
    }
    
    // Add to portfolio
    portfolio.push({
        symbol: cryptoInput,
        amount: amount,
        purchasePrice: price,
        id: Date.now()
    });
    
    // Save to localStorage
    localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
    
    // Update display
    updatePortfolioDisplay();
    
    // Clear inputs
    document.getElementById('crypto-input').value = '';
    document.getElementById('amount-input').value = '';
    document.getElementById('price-input').value = '';
}

function updatePortfolioDisplay() {
    const container = document.getElementById('portfolio-holdings');
    container.innerHTML = '';
    
    if (portfolio.length === 0) {
        container.innerHTML = '<p>No holdings in your portfolio yet.</p>';
        document.getElementById('portfolio-total').textContent = '$0.00';
        document.getElementById('portfolio-change').textContent = '$0.00 (0.00%)';
        return;
    }
    
    // Fetch current prices for portfolio items
    updatePortfolioValues();
}

async function updatePortfolioValues() {
    // Get unique symbols from portfolio
    const symbols = [...new Set(portfolio.map(item => item.symbol.toLowerCase()))];
    
    try {
        // Fetch current prices (simplified - in reality you'd need to map to CoinGecko IDs)
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbols.join(',')}&vs_currencies=usd`);
        const prices = await response.json();
        
        let totalValue = 0;
        let totalCost = 0;
        
        const container = document.getElementById('portfolio-holdings');
        container.innerHTML = '';
        
        portfolio.forEach(item => {
            const currentPrice = prices[item.symbol.toLowerCase()]?.usd || 0;
            const value = item.amount * currentPrice;
            const cost = item.amount * item.purchasePrice;
            const profit = value - cost;
            const profitPercent = (profit / cost) * 100;
            
            totalValue += value;
            totalCost += cost;
            
            const profitClass = profit >= 0 ? 'positive' : 'negative';
            const profitSymbol = profit >= 0 ? '↑' : '↓';
            
            const holding = document.createElement('div');
            holding.className = 'holding-item';
            holding.innerHTML = `
                <div class="holding-info">
                    <span class="holding-symbol">${item.symbol}</span>
                    <span class="holding-amount">${item.amount} @ $${item.purchasePrice.toFixed(2)}</span>
                </div>
                <div class="holding-value">
                    <span>$${value.toFixed(2)}</span>
                    <span class="${profitClass}">${profitSymbol} $${Math.abs(profit).toFixed(2)} (${Math.abs(profitPercent).toFixed(2)}%)</span>
                </div>
                <div class="holding-actions">
                    <button class="remove-holding" data-id="${item.id}">Remove</button>
                </div>
            `;
            
            container.appendChild(holding);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-holding').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                portfolio = portfolio.filter(item => item.id !== id);
                localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
                updatePortfolioDisplay();
            });
        });
        
        // Update summary
        const totalProfit = totalValue - totalCost;
        const totalProfitPercent = (totalProfit / totalCost) * 100;
        const profitClass = totalProfit >= 0 ? 'positive' : 'negative';
        const profitSymbol = totalProfit >= 0 ? '↑' : '↓';
        
        document.getElementById('portfolio-total').textContent = `$${totalValue.toFixed(2)}`;
        document.getElementById('portfolio-change').innerHTML = 
            `<span class="${profitClass}">${profitSymbol} $${Math.abs(totalProfit).toFixed(2)} (${Math.abs(totalProfitPercent).toFixed(2)}%)</span>`;
            
    } catch (error) {
        console.error('Error updating portfolio values:', error);
        container.innerHTML = '<p>Error fetching current prices. Please try again later.</p>';
    }
}

// 6. Browser-Based Alerts
function initAlerts() {
    document.getElementById('add-alert').addEventListener('click', addAlert);
}

function addAlert() {
    const crypto = document.getElementById('alert-crypto').value;
    const condition = document.getElementById('alert-condition').value;
    const value = parseFloat(document.getElementById('alert-value').value);
    
    if (isNaN(value)) {
        alert('Please enter a valid value for the alert');
        return;
    }
    
    const alert = {
        id: Date.now(),
        crypto: crypto,
        condition: condition,
        value: value,
        active: true
    };
    
    activeAlerts.push(alert);
    localStorage.setItem('cryptoAlerts', JSON.stringify(activeAlerts));
    
    updateAlertsDisplay();
    document.getElementById('alert-value').value = '';
}

function updateAlertsDisplay() {
    const container = document.getElementById('active-alerts');
    container.innerHTML = '';
    
    if (activeAlerts.length === 0) {
        container.innerHTML = '<p>No active alerts.</p>';
        return;
    }
    
    activeAlerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert-item';
        alertElement.innerHTML = `
            <div class="alert-info">
                <span class="alert-crypto">${alert.crypto.toUpperCase()}</span>
                <span class="alert-condition">${formatCondition(alert.condition)} $${alert.value.toFixed(2)}</span>
            </div>
            <div class="alert-actions">
                <button class="remove-alert" data-id="${alert.id}">Remove</button>
            </div>
        `;
        
        container.appendChild(alertElement);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-alert').forEach(button => {
        button.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            activeAlerts = activeAlerts.filter(alert => alert.id !== id);
            localStorage.setItem('cryptoAlerts', JSON.stringify(activeAlerts));
            updateAlertsDisplay();
        });
    });
}

function formatCondition(condition) {
    const conditions = {
        'above': 'Price Above',
        'below': 'Price Below',
        'rsi-above': 'RSI Above',
        'rsi-below': 'RSI Below'
    };
    
    return conditions[condition] || condition;
}

async function checkAlerts() {
    if (activeAlerts.length === 0) return;
    
    // Get current prices and RSI values for alert cryptos
    const cryptosToCheck = [...new Set(activeAlerts.map(alert => alert.crypto))];
    
    try {
        // Fetch current prices
        const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptosToCheck.join(',')}&vs_currencies=usd`);
        const prices = await priceResponse.json();
        
        // For RSI alerts, we'd need to fetch historical data and calculate RSI
        // This is simplified for demonstration
        
        activeAlerts.forEach(alert => {
            const currentPrice = prices[alert.crypto]?.usd;
            
            if (currentPrice) {
                let triggered = false;
                
                if (alert.condition === 'above' && currentPrice > alert.value) {
                    triggered = true;
                } else if (alert.condition === 'below' && currentPrice < alert.value) {
                    triggered = true;
                }
                // RSI conditions would require actual RSI calculation
                
                if (triggered && alert.active) {
                    // Show notification
                    if (Notification.permission === 'granted') {
                        new Notification(`Alert: ${alert.crypto.toUpperCase()} ${formatCondition(alert.condition)} $${alert.value.toFixed(2)}`, {
                            body: `Current price: $${currentPrice.toFixed(2)}`
                        });
                    } else if (Notification.permission !== 'denied') {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                new Notification(`Alert: ${alert.crypto.toUpperCase()} ${formatCondition(alert.condition)} $${alert.value.toFixed(2)}`, {
                                    body: `Current price: $${currentPrice.toFixed(2)}`
                                });
                            }
                        });
                    }
                    
                    // Mark alert as inactive to prevent repeated notifications
                    alert.active = false;
                }
            }
        });
        
        // Save updated alerts
        localStorage.setItem('cryptoAlerts', JSON.stringify(activeAlerts));
        
    } catch (error) {
        console.error('Error checking alerts:', error);
    }
}

// Request notification permission on page load
if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}

// Periodic Data Updates
async function updateMarketData() {
    await initMarketOverview();
    
    const cryptoSelector = document.getElementById('crypto-selector');
    const timeframe = document.getElementById('timeframe');
    await updatePriceChart(cryptoSelector.value, timeframe.value);
    
    await updatePortfolioDisplay();
}

// Initialize Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}