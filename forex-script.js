const form = document.getElementById('converter-form');
const result = document.getElementById('result');
const swapButton = document.getElementById('swap-button');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
let conversionHistory = JSON.parse(localStorage.getItem('conversionHistory')) || [];

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
});

function populateCurrencyList(currencyInput, currencyList, filter = '') {
    currencyList.innerHTML = '';
    for (let [region, currencies] of Object.entries(regions)) {
        const filteredCurrencies = Object.entries(currencies).filter(([code]) => 
            code.toLowerCase().startsWith(filter.toLowerCase())
        );

        if (filteredCurrencies.length > 0) {
            const regionHeader = document.createElement('div');
            regionHeader.className = 'region-header';
            regionHeader.textContent = region;
            currencyList.appendChild(regionHeader);

            for (let [code, flagUrl] of filteredCurrencies) {
                const currencyItem = document.createElement('div');
                currencyItem.className = 'currency-item';

                const flagImg = document.createElement('img');
                flagImg.src = flagUrl;
                flagImg.alt = code;
                flagImg.width = 30;
                flagImg.height = 20;
                flagImg.style.marginRight = '5px';

                currencyItem.appendChild(flagImg);
                currencyItem.appendChild(document.createTextNode(code));

                currencyItem.addEventListener('click', function () {
                    currencyInput.value = code;
                    currencyList.style.display = 'none';
                    updateCurrencyLogo(currencyInput, code, flagUrl);
                });
                currencyList.appendChild(currencyItem);
            }
        }
    }
}

function setupCurrencyInput(currencyInput, currencyList) {
    function updateList() {
        populateCurrencyList(currencyInput, currencyList, currencyInput.value);
        currencyList.style.display = 'block';
    }

    currencyInput.addEventListener('input', function () {
        const value = this.value.toUpperCase();
        updateList();
        updateCurrencyLogo(currencyInput, value);
    });

    currencyInput.addEventListener('focus', updateList);

    currencyInput.addEventListener('click', function(e) {
        e.stopPropagation();
        updateList();
    });

    currencyList.addEventListener('click', function(e) {
        e.stopPropagation();
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

function updateCurrencyLogo(input, currencyCode) {
    const wrapper = input.parentElement;

    // Remove existing logo if present
    const existingLogo = wrapper.querySelector('.currency-logo');
    if (existingLogo) {
        wrapper.removeChild(existingLogo);
    }

    const flagUrl = regions[Object.keys(regions).find(region => 
        regions[region][currencyCode]
    )]?.[currencyCode];

    // Create and insert new logo if flag URL exists
    if (flagUrl) {
        const logoImg = document.createElement('img');
        logoImg.src = flagUrl;
        logoImg.alt = `${currencyCode} flag`;
        logoImg.className = 'currency-logo';
        logoImg.style.width = '20px';
        logoImg.style.position = 'absolute';
        logoImg.style.left = '5px';
        logoImg.style.top = '50%';
        logoImg.style.transform = 'translateY(-50%)';

        wrapper.style.position = 'relative';
        wrapper.insertBefore(logoImg, input);
        input.style.paddingLeft = '30px'; // Adjust input style to make room for logo
    } else {
        input.style.paddingLeft = '5px'; // Reset padding if no flag found
    }
}

function updateHistoryDisplay() {
    historyList.innerHTML = '';
    conversionHistory.forEach((item) => {
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
    updateCurrencyLogo(fromCurrencyInput, item.fromCurrency);
    updateCurrencyLogo(toCurrencyInput, item.toCurrency);
}

function clearHistory() {
    conversionHistory = [];
    localStorage.removeItem('conversionHistory');
    updateHistoryDisplay();
}

function swapCurrencies() {
    const fromCurrency = document.getElementById('from-currency');
    const toCurrency = document.getElementById('to-currency');
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    updateCurrencyLogo(fromCurrencyInput, fromCurrency.value);
    updateCurrencyLogo(toCurrencyInput, toCurrency.value);
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
            const convertedAmount = (amount * rate).toFixed(4);
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
swapButton.addEventListener('click', swapCurrencies);

updateHistoryDisplay();

function switchPage(page) {
    const fiatContent = document.getElementById('fiat-content');
    const fiatSwitch = document.getElementById('fiatSwitch');
    const cryptoSwitch = document.querySelector('.switcher a');

    if (page === 'fiat') {
        fiatContent.style.display = 'block';
        fiatSwitch.classList.add('active');
        fiatSwitch.classList.remove('inactive');
        cryptoSwitch.classList.add('inactive');
        cryptoSwitch.classList.remove('active');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    switchPage('fiat');
});
