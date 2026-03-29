# Quick Installation Guide - v2.0

## Step 1: Setup Icons (Optional)

The browser should have opened and downloaded 3 icon files. Move them to the `icons` folder:

- icon16.png → `icons/icon16.png`
- icon48.png → `icons/icon48.png`
- icon128.png → `icons/icon128.png`

If icons didn't download, the extension will work fine with default Chrome icons.

## Step 2: Load Extension in Chrome

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select folder: `c:\ZZZZZZZZZZ\Extensions\trading-position-calculator`
6. Extension should now appear in your toolbar

## Step 3: Start Using!

1. Click the extension icon in Chrome toolbar
2. Enter your total capital
3. You're ready - **NO API KEY NEEDED!**

## Step 4: Your First Trade

1. Enter ticker (e.g., `RELIANCE.NS` for NSE stocks)
2. Click **Fetch** to get live prices
3. Set your entry price and stop loss
4. Choose 1 Stop or 3 Stops (Fibonacci)
5. Set risk percentage
6. Click **CALCULATE**

## Ticker Format for Indian Stocks

- **NSE**: Add `.NS` suffix (e.g., `TCS.NS`, `INFY.NS`, `RELIANCE.NS`)
- **BSE**: Add `.BO` suffix (e.g., `TCS.BO`, `RELIANCE.BO`)

## Features Overview

✅ **No API key required** - Works immediately!  
✅ Live price data from Yahoo Finance  
✅ Position sizing based on risk %  
✅ **Improved 3-stop system**: 0.5R, 0.618R, 1R (net -0.7R risk)  
✅ Position split calculator (1/3 at each stop)  
✅ Profit targets with **actual RR ratio** display  
✅ Trade value and risk calculations  
✅ Dark theme UI

## Understanding 3-Stop Mode

When you select **3 Stops**:

- Extension calculates stops at 0.5R, 0.618R, and 1R
- Position automatically split into thirds
- **Net risk: -0.7R** (30% less than single stop!)
- Actual RR improves: 2R target = **2.9:1 actual RR**

## Troubleshooting

**No price data?**

- Check ticker format (must include .NS or .BO)
- Check internet connection
- Verify ticker symbol is correct

**Extension not loading?**

- Make sure all files are in the folder
- Check Developer mode is enabled
- Try reloading the extension

Enjoy your trading calculator! 📈
