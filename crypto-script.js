const cryptoForm = document.getElementById('crypto-form');
const cryptoResult = document.getElementById('crypto-result');
const cryptoSwapButton = document.getElementById('crypto-swap-button');
const fromCryptoInput = document.getElementById('from-crypto');
const toCryptoInput = document.getElementById('to-crypto');
const fromCryptoList = document.getElementById('from-crypto-list');
const toCryptoList = document.getElementById('to-crypto-list');
const cryptoHistoryList = document.getElementById('crypto-history-list');
const clearCryptoHistoryBtn = document.getElementById('clear-crypto-history');


let cryptoConversionHistory = [];

function populateCryptoList(cryptoInput, cryptoList, cryptocurrencies) {
    cryptoList.innerHTML = '';  

    if (!Array.isArray(cryptocurrencies)) {
        console.error('cryptocurrencies is not an array:', cryptocurrencies);
        return;
    }

    cryptocurrencies.forEach(crypto => {
        const cryptoItem = document.createElement('div');
        cryptoItem.className = 'crypto-item';
        cryptoItem.textContent = crypto;  // Здесь предполагается, что "crypto" - это строка

        cryptoItem.addEventListener('click', function () {
            cryptoInput.value = crypto;
            cryptoList.style.display = 'none';
        });

        cryptoList.appendChild(cryptoItem);
    });
}
function setupCryptoInput(cryptoInput, cryptoList) {
    populateCryptoList(cryptoInput, cryptoList);

    cryptoInput.addEventListener('focus', function () {
        cryptoList.style.display = 'block';
    });

    document.addEventListener('click', function (e) {
        if (!cryptoInput.contains(e.target) && !cryptoList.contains(e.target)) {
            cryptoList.style.display = 'none';
        }
    });
}

function updateCryptoHistoryDisplay() {
    cryptoHistoryList.innerHTML = '';
    cryptoConversionHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.classList.add('history-item');
        historyItem.textContent = `${item.amount} ${item.fromCrypto} = ${item.result} ${item.toCrypto}`;
        historyItem.addEventListener('click', () => fillCryptoFormFromHistory(item));
        cryptoHistoryList.appendChild(historyItem);
    });
}

function addToCryptoHistory(amount, fromCrypto, toCrypto, convertedAmount) {
    const newHistoryItem = {
        amount,
        fromCrypto,
        toCrypto,
        result: convertedAmount,
        date: new Date().toLocaleString()
    };

    const isDuplicate = cryptoConversionHistory.some(item =>
        item.amount === amount &&
        item.fromCrypto === fromCrypto &&
        item.toCrypto === toCrypto &&
        item.result === convertedAmount
    );

    if (!isDuplicate) {
        cryptoConversionHistory.unshift(newHistoryItem);
        if (cryptoConversionHistory.length > 20) {
            cryptoConversionHistory.pop();
        }
        localStorage.setItem('cryptoConversionHistory', JSON.stringify(cryptoConversionHistory));
        updateCryptoHistoryDisplay();
    }
}

function fillCryptoFormFromHistory(item) {
    document.getElementById('crypto-amount').value = item.amount;
    document.getElementById('from-crypto').value = item.fromCrypto;
    document.getElementById('to-crypto').value = item.toCrypto;
}

function swapCryptocurrencies() {
    const fromCrypto = document.getElementById('from-crypto');
    const toCrypto = document.getElementById('to-crypto');
    const temp = fromCrypto.value;
    fromCrypto.value = toCrypto.value;
    toCrypto.value = temp;
}

async function getCryptoPrice(symbol) {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

cryptoForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const amount = parseFloat(document.getElementById('crypto-amount').value);
    const fromCrypto = fromCryptoInput.value.toUpperCase();
    const toCrypto = toCryptoInput.value.toUpperCase();

    try {
        // Get prices for both cryptocurrencies in USDT
        const fromPrice = await getCryptoPrice(`${fromCrypto}USDT`);
        const toPrice = await getCryptoPrice(`${toCrypto}USDT`);

        if (fromPrice.price && toPrice.price) {
            // Convert prices to numbers
            const fromPriceNum = parseFloat(fromPrice.price);
            const toPriceNum = parseFloat(toPrice.price);

            // Calculate the conversion
            const convertedAmount = (amount * fromPriceNum / toPriceNum).toFixed(8);

            cryptoResult.textContent = `${amount} ${fromCrypto} = ${convertedAmount} ${toCrypto}`;
            addToCryptoHistory(amount, fromCrypto, toCrypto, convertedAmount);
        } else {
            cryptoResult.textContent = 'Invalid cryptocurrency code';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        cryptoResult.textContent = 'Error fetching cryptocurrency data: ' + error.message;
    }
});

cryptoSwapButton.addEventListener('click', swapCryptocurrencies);
clearCryptoHistoryBtn.addEventListener('click', clearCryptoHistory);


function clearCryptoHistory() {
    cryptoConversionHistory = [];
    localStorage.removeItem('cryptoConversionHistory');
    updateCryptoHistoryDisplay();
}


function loadCryptoConversionHistory() {
    cryptoConversionHistory = JSON.parse(localStorage.getItem('cryptoConversionHistory')) || [];
    updateCryptoHistoryDisplay(); // Обновляем отображение сразу после загрузки
}

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
    // Initialize page elements
    setupCryptoInput(fromCryptoInput, fromCryptoList);
    setupCryptoInput(toCryptoInput, toCryptoList);
    
    // Load and display conversion history immediately
    loadCryptoConversionHistory();
    
    // Bind event handlers
    cryptoForm.addEventListener('submit', handleCryptoConversion);
    cryptoSwapButton.addEventListener('click', swapCryptocurrencies);
    clearCryptoHistoryBtn.addEventListener('click', clearCryptoHistory);

    
    switchPage('crypto'); // Default to showing the cryptocurrency page
});

