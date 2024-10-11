const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';
const STORAGE_KEY = 'currencyTrackerData';
const UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let trackedPairs = [];
let allCurrencies = [];
let lastUpdateTime = 0;
let exchangeRates = {};
let countryFlags = {};

async function loadCountryFlags() {
    try {
        const response = await fetch('countries.json');
        if (!response.ok) {
            throw new Error('Failed to load country flags');
        }
        countryFlags = await response.json();
        populateCurrencyDropdowns(countryFlags);
    } catch (error) {
        console.error('Error loading country flags:', error);
    }
}

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

function saveToStorage() {
    const dataToStore = {
        trackedPairs,
        exchangeRates,
        lastUpdateTime,
        allCurrencies
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
}

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

async function updateRatesIfNeeded() {
    const currentTime = Date.now();
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        await fetchExchangeRates();
    }
}

function addCurrencyPair(baseCurrency, targetCurrency) {
    const pair = `${baseCurrency}/${targetCurrency}`;
    if (!trackedPairs.includes(pair)) {
        trackedPairs.push(pair);
        saveToStorage();
        updateTrackedPairsUI();
    }
}

function updateTrackedPairsUI() {
    const trackedPairsElement = document.getElementById('tracked-pairs');
    trackedPairsElement.innerHTML = '';

    trackedPairs.forEach(pair => {
        const [base, target] = pair.split('/');
        const rate = exchangeRates[target] / exchangeRates[base];
        
        const pairElement = document.createElement('div');
        pairElement.textContent = `${pair}: ${rate.toFixed(4)}`;

        // Create a remove button
        const removeButton = document.createElement('button');
        removeButton.textContent = '✖';
        removeButton.classList.add('remove-pair');
        removeButton.onclick = () => removeCurrencyPair(pair); // Add click event to remove pair

        // Append the button to the pair element
        pairElement.appendChild(removeButton);
        trackedPairsElement.appendChild(pairElement);
    });
}

function removeCurrencyPair(pair) {
    trackedPairs = trackedPairs.filter(trackedPair => trackedPair !== pair);
    saveToStorage();
    updateTrackedPairsUI();
}

function populateCurrencyDropdowns(countryFlags) {
    const baseCurrencySelect = document.getElementById('base-currency');
    const targetCurrencySelect = document.getElementById('target-currency');
    
    baseCurrencySelect.innerHTML = '';
    targetCurrencySelect.innerHTML = '';

    // Create and append the default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select currency';
    baseCurrencySelect.appendChild(defaultOption.cloneNode(true));
    targetCurrencySelect.appendChild(defaultOption);

    for (const continent in countryFlags) {
        if (countryFlags.hasOwnProperty(continent)) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = continent;

            for (const currency in countryFlags[continent]) {
                if (countryFlags[continent].hasOwnProperty(currency)) {
                    const flagUrl = countryFlags[continent][currency];
                    
                    const option = document.createElement('option');
                    option.value = currency;
                    option.textContent = currency;
                    option.style.backgroundImage = `url(${flagUrl})`;
                    option.style.backgroundRepeat = 'no-repeat';
                    option.style.backgroundSize = '3px 5px';
                    option.style.backgroundPosition = '5px center';
                    option.style.paddingLeft = '30px';

                    optgroup.appendChild(option);
                }
            }

            baseCurrencySelect.appendChild(optgroup.cloneNode(true));
            targetCurrencySelect.appendChild(optgroup);
        }
    }
}

function updateSelectBackground(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    selectElement.style.backgroundImage = selectedOption.style.backgroundImage;
}

async function init() {
    loadFromStorage();
    await updateRatesIfNeeded();
    await loadCountryFlags();
    updateTrackedPairsUI();

    const addPairForm = document.getElementById('add-pair-form');
    addPairForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const baseCurrency = document.getElementById('base-currency').value;
        const targetCurrency = document.getElementById('target-currency').value;
        addCurrencyPair(baseCurrency, targetCurrency);
    });

    const baseCurrencySelect = document.getElementById('base-currency');
    const targetCurrencySelect = document.getElementById('target-currency');

    baseCurrencySelect.addEventListener('change', () => updateSelectBackground(baseCurrencySelect));
    targetCurrencySelect.addEventListener('change', () => updateSelectBackground(targetCurrencySelect));
}


// Initialize the application
document.addEventListener('DOMContentLoaded', init);