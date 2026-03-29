# Trading Position Calculator - Chrome Extension v2.0

A Chrome extension for calculating position sizes, risk management, and profit targets for NSE/BSE stocks with **live price data** - **NO API KEY REQUIRED!**

## ✨ What's New in v2.0

- ✅ **No API key needed** - Works immediately after installation
- ✅ **Yahoo Finance** integration for live price data
- ✅ **Improved 3-stop system**: 0.5R, 0.618R, 1R with **-0.7R net risk**
- ✅ **Position split calculator** - Shows shares per stop level
- ✅ **Actual RR ratio display** - See true risk-to-reward when scaling out

## Features

- **Position Sizing**: Calculate shares based on risk tolerance
- **Risk Management**: Set risk % (0.3%, 0.5%, 1%, or custom)
- **Stop Loss Options**:
  - **1 Stop**: Single stop loss level (1R risk)
  - **3 Stops**: Scaled stops at 0.5R, 0.618R, 1R (net -0.7R risk when scaling out 1/3 at each)
- **Profit Targets**: 1R, 2R, 3R, 4R with actual RR display for 3-stop mode
- **Live Price Data**: Free real-time NSE/BSE prices
- **Price Information**:
  - Current price
  - Low of the day (LoD)
  - High of the day (HoD)
  - Previous close
  - Previous day's low
  - Previous day's high

## Installation

1. **Install the Extension**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `trading-position-calculator` folder

2. **Start Using**:
   - Click the extension icon in Chrome toolbar
   - Enter your total capital
   - You're ready to trade!

## Usage

### Basic Setup

1. **Enter Total Capital**: Input your total trading capital
2. **Enter Ticker**: Type stock symbol (e.g., `RELIANCE.NS` for NSE, `TCS.BO` for BSE)
3. **Fetch Live Price**: Click "Fetch" - no API key needed!

### Calculate Position Size

1. **Set Entry Price**: Either fetched automatically or enter manually
2. **Choose Stop Loss Mode**:
   - **1 Stop**: Enter single stop loss (full 1R risk)
   - **3 Stops**: Enter final stop; extension calculates 0.5R, 0.618R, 1R levels
     - Automatically splits position into thirds
     - Shows net risk: **-0.7R** (vs -1R for single stop)
3. **Set Risk %**: Choose from presets (0.3%, 0.5%, 1%) or enter custom percentage
4. **Select Profit Targets**: Click on 1R, 2R, 3R, or 4R buttons to see profit levels
5. **Click Calculate**: View your position size, trade value, and risk amount

### Understanding the Results

- **Shares Count**: Total shares + shares per stop (for 3-stop mode)
- **Trade Value**: Total position cost and % of capital
- **Risk Amount**: Total risk in ₹ and %
- **Net Risk**: Displays -0.7R for 3-stop mode (scaling out)
- **Profit Targets**: Price levels, profit amounts, and **actual RR ratio**
  - Example: 2R target with -0.7R net risk = **2.9:1 actual RR**

## Ticker Symbol Format

For Indian stocks, use the following formats:

- **NSE stocks**: `SYMBOL.NS` (e.g., `RELIANCE.NS`, `TCS.NS`)
- **BSE stocks**: `SYMBOL.BO` (e.g., `RELIANCE.BO`, `TCS.BO`)

## Understanding the 3-Stop System

### Stop Levels (Based on R multiples)

When using 3 stops with final stop at 1R:

- **Stop 1 (0.5R)**: Exit 1/3 position - 50% of full risk
- **Stop 2 (0.618R)**: Exit 1/3 position - 61.8% of full risk
- **Stop 3 (1R)**: Exit final 1/3 - 100% of full risk

### Net Risk Calculation

With equal position splits (1/3 at each stop):

- Average risk = (0.5R + 0.618R + 1R) / 3 = **0.706R ≈ 0.7R**
- This means you risk **30% less** than a single stop!

### Example Trade

**Entry**: ₹100 | **Final Stop**: ₹95 (5% = 1R)

- Stop 1: ₹97.50 (0.5R) - Sell 1/3 position
- Stop 2: ₹96.91 (0.618R) - Sell 1/3 position
- Stop 3: ₹95.00 (1R) - Sell final 1/3
- **Net risk**: 0.7R instead of 1R

### Improved Risk-to-Reward

- **1R target**: 1 ÷ 0.7 = **1.4:1 actual RR** (vs 1:1)
- **2R target**: 2 ÷ 0.7 = **2.9:1 actual RR** (vs 2:1)
- **3R target**: 3 ÷ 0.7 = **4.3:1 actual RR** (vs 3:1)
- **4R target**: 4 ÷ 0.7 = **5.7:1 actual RR** (vs 4:1)

## Risk Multiples (R)

- **1R**: Profit equals your risk amount
- **2R**: Profit equals 2x your risk amount
- **3R**: Profit equals 3x your risk amount
- **4R**: Profit equals 4x your risk amount

Example: If you're risking ₹1,000, a 2R target means ₹2,000 profit.

## Data Sources

**Yahoo Finance**

- Free, no registration needed
- Real-time NSE/BSE data
- Current price, day high/low, previous close
- Previous day's high/low
- No API key required

## Tips

1. Always verify the ticker symbol format for NSE (.NS) or BSE (.BO)
2. The extension saves your last calculation and total capital
3. Use the price grid to identify key support/resistance levels
4. Adjust your risk percentage based on market conditions
5. Consider using 3 stops for scaling out of winning positions

## Troubleshooting

**"Invalid ticker or no data available"**:

- Check ticker format (SYMBOL.NS for NSE, SYMBOL.BO for BSE)
- Verify stock is listed on NSE or BSE
- Try during market hours for real-time data

**No price data showing**:

- Check your internet connection
- Verify ticker symbol is correct

## Privacy

This extension:

- Stores calculations locally in Chrome only
- Makes API calls only when you click "Fetch"
- No registration, no tracking, no data collection
- 100% free and open source

## Tips for Best Results

1. **Use 3-stop mode** for better risk management and RR ratios
2. **Verify ticker format**: RELIANCE.NS (NSE) or RELIANCE.BO (BSE)
3. **Check net risk**: 3-stop mode shows -0.7R (30% less risk)
4. **Review actual RR**: Extension shows true RR when scaling out
5. **Position splits**: Note shares per stop for proper execution

## Version History

**v2.0.0** - Major Update

- Removed API key requirement
- Added Yahoo Finance integration
- Updated 3-stop system to 0.5R, 0.618R, 1R
- Added net risk display (-0.7R)
- Added actual RR ratio calculations
- Added position split calculator
- Improved UI with data source indicator
- Added font toggle (Google Sans Code / Inter)
- Added tabs for Calculator and History
- Responsive width (400px-900px)

**v1.0.0** - Initial release
