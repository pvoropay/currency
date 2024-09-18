
const form = document.getElementById('converter-form');
const result = document.getElementById('result');
const swapButton = document.getElementById('swap-button');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const exportHistoryBtn = document.getElementById('export-history');
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];

//
async function loadCountries() {
    try {
        const response = await fetch('countries.json');
        if (!response.ok) {
            throw new Error('Failed to load countries data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading countries data:', error);
        return {};
    }
}

let regions = {};

loadCountries().then(data => {
    regions = data;
    setupCurrencyInput(fromCurrencyInput, fromCurrencyList);
    setupCurrencyInput(toCurrencyInput, toCurrencyList);
}); //подгрузка json флагов и стран

function populateCurrencyList(currencyInput, currencyList) {
    currencyList.innerHTML = '';
    for (let [region, currencies] of Object.entries(regions)) {
        const regionHeader = document.createElement('div');
        regionHeader.className = 'region-header';
        regionHeader.textContent = region;
        currencyList.appendChild(regionHeader);

        for (let [code, flagUrl] of Object.entries(currencies)) {
            const currencyItem = document.createElement('div');
            currencyItem.className = 'currency-item';

            const flagImg = document.createElement('img');
            flagImg.src = flagUrl;
            flagImg.alt = code;
            flagImg.width = 20;
            flagImg.height = 15;
            flagImg.style.marginRight = '5px';

            currencyItem.appendChild(flagImg);
            currencyItem.appendChild(document.createTextNode(code));

            currencyItem.addEventListener('click', function () {
                currencyInput.value = code;
                currencyList.style.display = 'none';
            });
            currencyList.appendChild(currencyItem);
        }
    }
}

function setupCurrencyInput(currencyInput, currencyList) {
    populateCurrencyList(currencyInput, currencyList);

    currencyInput.addEventListener('focus', function () {
        currencyList.style.display = 'block';
    });

    document.addEventListener('click', function (e) {
        if (!currencyInput.contains(e.target) && !currencyList.contains(e.target)) {
            currencyList.style.display = 'none';
        }
    });
}

const fromCurrencyInput = document.getElementById('from-currency');
const toCurrencyInput = document.getElementById('to-currency');
const fromCurrencyList = document.getElementById('from-currency-list');
const toCurrencyList = document.getElementById('to-currency-list');

setupCurrencyInput(fromCurrencyInput, fromCurrencyList);
setupCurrencyInput(toCurrencyInput, toCurrencyList);

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    conversionHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.textContent = `${item.amount} ${item.fromCurrency} = ${item.result} ${item.toCurrency}`;
        historyItem.addEventListener('click', () => fillFormFromHistory(item));
        historyList.appendChild(historyItem);
    });
}

function addToHistory(amount, fromCurrency, toCurrency, convertedAmount) {
    const newHistoryItem = {
        amount,
        fromCurrency,
        toCurrency,
        result: convertedAmount,
        date: new Date().toLocaleString()
    };

    const isDuplicate = conversionHistory.some(item =>
        item.amount === amount &&
        item.fromCurrency === fromCurrency &&
        item.toCurrency === toCurrency &&
        item.result === convertedAmount
    );

    if (!isDuplicate) {
        conversionHistory.unshift(newHistoryItem);
        if (conversionHistory.length > 20) {
            conversionHistory.pop();
        }
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
        updateHistoryDisplay();
    }
}


function fillFormFromHistory(item) {
    document.getElementById('amount').value = item.amount;
    document.getElementById('from-currency').value = item.fromCurrency;
    document.getElementById('to-currency').value = item.toCurrency;
}

function clearHistory() {
    conversionHistory = [];
    localStorage.removeItem('conversionHistory');
    updateHistoryDisplay();
}

function exportHistory() {
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Amount,From Currency,To Currency,Result,Date\n"
        + conversionHistory.map(item => `${item.amount},${item.fromCurrency},${item.toCurrency},${item.result},${item.date}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "conversion_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function swapCurrencies() {
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const fromCurrency = document.getElementById('from-currency').value.toUpperCase();
    const toCurrency = document.getElementById('to-currency').value.toUpperCase();

    try {
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const rate = data.rates[toCurrency];
        if (rate) {
            const convertedAmount = (amount * rate).toFixed(2);
            result.textContent = `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
            addToHistory(amount, fromCurrency, toCurrency, convertedAmount);
        } else {
            result.textContent = 'Invalid currency code';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        result.textContent = 'Please enter the correct currency: ' + error.message;
    }
});

clearHistoryBtn.addEventListener('click', clearHistory);
exportHistoryBtn.addEventListener('click', exportHistory);
swapButton.addEventListener('click', swapCurrencies);


updateHistoryDisplay();


// swither js
function switchPage(page) {
    const fiatContent = document.getElementById('fiat-content');
    const cryptoContent = document.getElementById('crypto-content');
    const fiatSwitch = document.getElementById('fiatSwitch');
    const cryptoSwitch = document.getElementById('cryptoSwitch');

    if (page === 'fiat') {
        fiatContent.style.display = 'block';
        cryptoContent.style.display = 'none';
        fiatSwitch.classList.add('active');
        fiatSwitch.classList.remove('inactive');
        cryptoSwitch.classList.add('inactive');
        cryptoSwitch.classList.remove('active');
    } else if (page === 'crypto') {
        fiatContent.style.display = 'none';
        cryptoContent.style.display = 'block';
        fiatSwitch.classList.add('inactive');
        fiatSwitch.classList.remove('active');
        cryptoSwitch.classList.add('active');
        cryptoSwitch.classList.remove('inactive');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchPage('fiat'); // 
});