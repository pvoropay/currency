// Crypto conversion script

const cryptoForm = document.getElementById('crypto-form');
const cryptoResult = document.getElementById('crypto-result');
const cryptoSwapButton = document.getElementById('crypto-swap-button');
const fromCryptoInput = document.getElementById('from-crypto');
const toCryptoInput = document.getElementById('to-crypto');
const fromCryptoList = document.getElementById('from-crypto-list');
const toCryptoList = document.getElementById('to-crypto-list');
const cryptoHistoryList = document.getElementById('crypto-history-list');
const clearCryptoHistoryBtn = document.getElementById('clear-crypto-history');
const exportCryptoHistoryBtn = document.getElementById('export-crypto-history');



const cryptoList = [
    'BTC', 'ETH', 'BNB', 'ADA', 'DOGE', 'XRP', 'DOT', 'UNI', 'BCH', 'LTC',
    'LINK', 'MATIC', 'XLM', 'ETC', 'THETA', 'VET', 'TRX', 'FIL', 'XMR', 'AAVE'
];


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
            addToHistory(amount, fromCrypto, toCrypto, convertedAmount);
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
exportCryptoHistoryBtn.addEventListener('click', exportCryptoHistory);

function clearCryptoHistory() {
    cryptoConversionHistory = [];
    localStorage.removeItem('cryptoConversionHistory');
    updateCryptoHistoryDisplay();
}

function exportCryptoHistory() {
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Amount,From Crypto,To Crypto,Result,Date\n"
        + cryptoConversionHistory.map(item => `${item.amount},${item.fromCrypto},${item.toCrypto},${item.result},${item.date}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "crypto_conversion_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}



updateCryptoHistoryDisplay();