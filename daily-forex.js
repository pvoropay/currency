const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const STORAGE_KEY = 'currencyTrackerData';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let trackedPairs = [];
let allCurrencies = [];
let lastUpdateTime = 0;
let exchangeRates = {};

// Load data from local storage
function loadFromStorage() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        trackedPairs = parsedData.trackedPairs || [];
        exchangeRates = parsedData.exchangeRates || {};
        lastUpdateTime = parsedData.lastUpdateTime || 0;
        allCurrencies = parsedData.allCurrencies || [];
    }
}

// Save data to local storage
function saveToStorage() {
    const dataToStore = {
        trackedPairs,
        exchangeRates,
        lastUpdateTime,
        allCurrencies
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
}

// Fetch exchange rates from API
async function fetchExchangeRates() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        exchangeRates = data.rates;
        allCurrencies = Object.keys(exchangeRates);
        lastUpdateTime = Date.now();
        saveToStorage();
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
    }
}

// Update exchange rates if necessary
async function updateRatesIfNeeded() {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        await fetchExchangeRates();
    }
}

// Add a new currency pair to track
function addCurrencyPair(baseCurrency, targetCurrency) {
    const pair = `${baseCurrency}/${targetCurrency}`;
    if (!trackedPairs.includes(pair)) {
        trackedPairs.push(pair);
        saveToStorage();
        updateTrackedPairsUI();
    }
}

// Update the UI with tracked currency pairs
function updateTrackedPairsUI() {
    const trackedPairsElement = document.getElementById('tracked-pairs');
    trackedPairsElement.innerHTML = '';
    trackedPairs.forEach(pair => {
        const [base, target] = pair.split('/');
        const rate = exchangeRates[target] / exchangeRates[base];
        const pairElement = document.createElement('div');
        pairElement.textContent = `${pair}: ${rate.toFixed(4)}`;
        trackedPairsElement.appendChild(pairElement);
    });
}

// Populate currency dropdowns
function populateCurrencyDropdowns() {
    const baseCurrencySelect = document.getElementById('base-currency');
    const targetCurrencySelect = document.getElementById('target-currency');
    
    allCurrencies.forEach(currency => {
        const baseOption = document.createElement('option');
        baseOption.value = currency;
        baseOption.textContent = currency;
        baseCurrencySelect.appendChild(baseOption);

        const targetOption = document.createElement('option');
        targetOption.value = currency;
        targetOption.textContent = currency;
        targetCurrencySelect.appendChild(targetOption);
    });
}

// Initialize the application
async function init() {
    loadFromStorage();
    await updateRatesIfNeeded();
    updateTrackedPairsUI();
    populateCurrencyDropdowns();

    // Add event listener for the form
    const addPairForm = document.getElementById('add-pair-form');
    addPairForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const baseCurrency = document.getElementById('base-currency').value;
        const targetCurrency = document.getElementById('target-currency').value;
        addCurrencyPair(baseCurrency, targetCurrency);
    });
}

// Run the initialization
init();

