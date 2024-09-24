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

async function loadCryptocurrencies() {
    try {
        const response = await fetch('crypto.json'); // Убедитесь, что путь правильный
        if (!response.ok) {
            throw new Error('Failed to load cryptocurrency list');
        }
        const data = await response.json();
        
        // Проверка на корректность данных
        if (!data || !data.Cryptocurrencies || typeof data.Cryptocurrencies !== 'object') {
            throw new Error('Invalid data format');
        }

        return data.Cryptocurrencies; // Возвращаем объект с криптовалютами и URL логотипов
    } catch (error) {
        console.error('Error loading cryptocurrency list:', error);
        return {}; // Возвращаем пустой объект в случае ошибки
    }
}

function populateCryptoList(cryptoInput, cryptoList, cryptocurrencies) {
    cryptoList.innerHTML = '';  

    // Проходим по объекту криптовалют и создаём элементы списка
    Object.keys(cryptocurrencies).forEach(crypto => {
        const cryptoItem = document.createElement('div');
        cryptoItem.className = 'crypto-item';
        
        // Добавляем название криптовалюты
        cryptoItem.textContent = crypto;

        // Добавляем логотип криптовалюты
        const logoImg = document.createElement('img');
        logoImg.src = cryptocurrencies[crypto]; // URL логотипа из JSON
        logoImg.alt = `${crypto} logo`;
        logoImg.style.width = '20px'; // Размер логотипа (можно настроить)
        logoImg.style.marginRight = '10px';
        cryptoItem.prepend(logoImg);

        // При клике вставляем выбранную криптовалюту в input
        cryptoItem.addEventListener('click', function () {
            cryptoInput.value = crypto;
            cryptoList.style.display = 'none';
        });

        cryptoList.appendChild(cryptoItem);
    });
}

function setupCryptoInput(cryptoInput, cryptoList) {
    loadCryptocurrencies().then(cryptocurrencies => {
        const cryptoNames = Object.keys(cryptocurrencies);

        function autocomplete(input, arr) {
            let currentFocus;
            
            input.addEventListener("input", function(e) {
                let val = this.value;
                updateList(val);
            });
            
            input.addEventListener("keydown", function(e) {
                let x = cryptoList.getElementsByClassName("crypto-item");
                if (e.keyCode == 40) {
                    currentFocus++;
                    addActive(x);
                } else if (e.keyCode == 38) {
                    currentFocus--;
                    addActive(x);
                } else if (e.keyCode == 13) {
                    e.preventDefault();
                    if (currentFocus > -1) {
                        if (x) x[currentFocus].click();
                    }
                }
            });
            
            function updateList(val) {
                closeAllLists();
                currentFocus = -1;
                if (!val) {
                    populateCryptoList(cryptoInput, cryptoList, cryptocurrencies);
                } else {
                    let matchingItems = arr.filter(item => 
                        item.toLowerCase().startsWith(val.toLowerCase())
                    );
                    populateCryptoList(cryptoInput, cryptoList, 
                        Object.fromEntries(matchingItems.map(item => [item, cryptocurrencies[item]]))
                    );
                }
                cryptoList.style.display = 'block';
            }
            
            function addActive(x) {
                if (!x) return false;
                removeActive(x);
                if (currentFocus >= x.length) currentFocus = 0;
                if (currentFocus < 0) currentFocus = (x.length - 1);
                x[currentFocus].classList.add("autocomplete-active");
            }
            
            function removeActive(x) {
                for (let i = 0; i < x.length; i++) {
                    x[i].classList.remove("autocomplete-active");
                }
            }
            
            function closeAllLists(elmnt) {
                let x = document.getElementsByClassName("currency-list");
                for (let i = 0; i < x.length; i++) {
                    if (elmnt != x[i] && elmnt != input) {
                        x[i].style.display = "none";
                    }
                }
            }
            
            input.addEventListener('focus', function() {
                updateList(this.value);
            });

            input.addEventListener('click', function(e) {
                e.stopPropagation();
                updateList(this.value);
            });

            cryptoList.addEventListener('click', function(e) {
                e.stopPropagation();
            });

            document.addEventListener("click", function (e) {
                if (!input.contains(e.target) && !cryptoList.contains(e.target)) {
                    closeAllLists();
                }
            });
        }

        autocomplete(cryptoInput, cryptoNames);
    }).catch(error => {
        console.error('Failed to load and populate cryptocurrencies:', error);
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

