// script.js

document.addEventListener('DOMContentLoaded', () => {
    // ELEMENTOS DO DOM
    const gameBoard = document.getElementById('game-board');
    const keyboardContainer = document.getElementById('keyboard-container');
    const toastContainer = document.getElementById('toast-container');
    const overlay = document.getElementById('overlay');
    const body = document.body;

    const instructionsBtn = document.getElementById('instructions-btn');
    const helpBtn = document.getElementById('help-btn');
    const difficultyBtn = document.getElementById('difficulty-btn');
    const themeBtn = document.getElementById('theme-btn');
    const hintBtn = document.getElementById('hint-btn');

    const helpModal = document.getElementById('help-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions-btn');
    const endGameModal = document.getElementById('end-game-modal');
    const newGameButton = document.getElementById('new-game-button');

    // ESTADO DO JOGO
    const WORD_LENGTH = 5;
    let maxTries = 6;
    const difficulties = ['facil', 'medio', 'dificil'];
    let currentDifficulty = 'medio';
    let secretWord = '';
    let currentRow = 0;
    let isGameOver = false;
    let guessGrid = [];
    let activeTile = null;
    let hintUsed = false;

    // INICIALIZAÇÃO
    function initializeGame() {
        secretWord = LISTA_DE_PALAVRAS[Math.floor(Math.random() * LISTA_DE_PALAVRAS.length)];
        console.log(`Palavra secreta: ${secretWord}`);

        isGameOver = false;
        currentRow = 0;
        activeTile = null;
        guessGrid = Array(maxTries).fill(null).map(() => Array(WORD_LENGTH).fill(''));
        
        createGameBoard();
        createKeyboard();
        
        hintUsed = false;
        hintBtn.classList.remove('disabled');

        setActiveTile(document.getElementById('tile-0-0'));
    }

    function createGameBoard() {
        gameBoard.innerHTML = '';
        gameBoard.style.gridTemplateRows = `repeat(${maxTries}, 1fr)`;
        
        for (let i = 0; i < maxTries; i++) {
            const rowEl = document.createElement('div'); rowEl.className = 'row'; rowEl.id = `row-${i}`;
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tileEl = document.createElement('div'); tileEl.className = 'tile'; tileEl.id = `tile-${i}-${j}`;
                tileEl.addEventListener('click', () => handleTileClick(tileEl));
                rowEl.appendChild(tileEl);
            }
            gameBoard.appendChild(rowEl);
        }
    }

    function createKeyboard() {
      keyboardContainer.innerHTML = `
          <div class="keyboard-row">
              ${'qwertyuiop'.split('').map(key => `<button class="key" data-key="${key}">${key}</button>`).join('')}
          </div>
          <div class="keyboard-row">
              <div class="spacer half"></div>
              ${'asdfghjkl'.split('').map(key => `<button class="key" data-key="${key}">${key}</button>`).join('')}
          </div>
          <div class="keyboard-row">
              <button class="key large" data-key="ENTER">ENTER</button>
              ${'zxcvbnm'.split('').map(key => `<button class="key" data-key="${key}">${key}</button>`).join('')}
              <button class="key large" data-key="⌫">⌫</button>
          </div>
      `;
    }

    // MANIPULAÇÃO DE EVENTOS
    function addEventListeners() {
        document.addEventListener('keydown', handleKeyPress);
        keyboardContainer.addEventListener('click', handleVirtualKeyboard);
        overlay.addEventListener('click', closeAllPopups);
        
        themeBtn.addEventListener('click', toggleTheme);
        difficultyBtn.addEventListener('click', cycleDifficulty);
        instructionsBtn.addEventListener('click', openInstructionsModal);
        helpBtn.addEventListener('click', openHelpModal);
        hintBtn.addEventListener('click', provideHint);

        closeModalBtn.addEventListener('click', closeHelpModal);
        closeInstructionsBtn.addEventListener('click', closeInstructionsModal);
        newGameButton.addEventListener('click', () => {
            closeEndGameModal();
            initializeGame();
        });

        loadTheme();
        loadDifficulty();
    }
    
    // FUNÇÕES DO TEMA E DIFICULDADE
    function toggleTheme() {
        body.classList.toggle('dark-mode');
        updateThemeButton();
        localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') body.classList.add('dark-mode');
        else body.classList.remove('dark-mode');
        updateThemeButton();
    }
    
    function updateThemeButton() {
      if (body.classList.contains('dark-mode')) {
          themeBtn.textContent = '☁️';
      } else {
          themeBtn.textContent = '☀️';
      }
    }

    function cycleDifficulty() {
        const currentIndex = difficulties.indexOf(currentDifficulty);
        const nextIndex = (currentIndex + 1) % difficulties.length;
        const newDifficulty = difficulties[nextIndex];
        setDifficulty(newDifficulty);
        initializeGame();
    }
    
    function setDifficulty(level) {
        currentDifficulty = level;
        
        difficultyBtn.classList.remove('facil', 'medio', 'dificil');
        difficultyBtn.classList.add(level);
        
        if (level === 'facil') maxTries = 7;
        else if (level === 'medio') maxTries = 6;
        else if (level === 'dificil') maxTries = 4;
        
        localStorage.setItem('difficulty', level);
    }

    function loadDifficulty() {
        const savedDifficulty = localStorage.getItem('difficulty') || 'medio';
        setDifficulty(savedDifficulty);
    }

    // LÓGICA DO JOGO
    function handleTileClick(tileEl) { if (isGameOver) return; const tileRow = parseInt(tileEl.id.split('-')[1]); if (tileRow === currentRow) { setActiveTile(tileEl); } }
    
    function handleKeyPress(e) {
      if (e.key === "Enter") {
          e.preventDefault();
      }
      handleInput(e.key); 
    }

    function handleVirtualKeyboard(e) { 
        const key = e.target.closest('[data-key]');
        if (key) {
          handleInput(key.getAttribute('data-key')); 
        }
    }
    function handleInput(key) { 
        if (isGameOver || !activeTile || instructionsModal.classList.contains('show') || endGameModal.classList.contains('show')) return; 
        
        const [row] = activeTile.id.split('-').slice(1).map(Number);
        if (row < currentRow) return;

        if (key.match(/^[a-zç]$/i)) { 
            typeLetter(key); 
        } else if (key === 'Backspace' || key === '⌫') { 
            deleteLetter(); 
        } else if (key === 'Enter' || key === 'ENTER') { 
            submitGuess(); 
        } 
    }
    function setActiveTile(tileEl) { if (activeTile) { activeTile.classList.remove('active'); } activeTile = tileEl; if (activeTile) activeTile.classList.add('active'); }
    function typeLetter(letter) { const [row, col] = activeTile.id.split('-').slice(1).map(Number); guessGrid[row][col] = letter.toLowerCase(); activeTile.textContent = letter; activeTile.classList.add('filled'); if (col < WORD_LENGTH - 1) { const nextTile = document.getElementById(`tile-${row}-${col + 1}`); setActiveTile(nextTile); } }
    function deleteLetter() { const [row, col] = activeTile.id.split('-').slice(1).map(Number); if (activeTile.textContent !== '') { activeTile.textContent = ''; activeTile.classList.remove('filled'); guessGrid[row][col] = ''; } else if (col > 0) { const prevTile = document.getElementById(`tile-${row}-${col - 1}`); setActiveTile(prevTile); prevTile.textContent = ''; prevTile.classList.remove('filled'); guessGrid[row][col - 1] = ''; } }
    function submitGuess() { const guess = guessGrid[currentRow].join(''); if (guess.length < WORD_LENGTH) { showToast("Letras insuficientes"); return; } if (!LISTA_DE_PALAVRAS.includes(guess)) { showToast("Palavra inválida"); const rowEl = document.getElementById(`row-${currentRow}`); rowEl.classList.add('shake'); rowEl.addEventListener('animationend', () => rowEl.classList.remove('shake'), { once: true }); return; } isGameOver = true; if (activeTile) activeTile.classList.remove('active'); revealGuess(guess); }
    function revealGuess(guess) { const secretLetters = secretWord.split(''), guessLetters = guess.split(''), results = Array(WORD_LENGTH).fill(''); guessLetters.forEach((letter, index) => { if (letter === secretLetters[index]) { results[index] = 'correct'; secretLetters[index] = null; } }); guessLetters.forEach((letter, index) => { if (results[index] === '') { if (secretLetters.includes(letter)) { results[index] = 'present'; secretLetters[secretLetters.indexOf(letter)] = null; } else { results[index] = 'absent'; } } }); const rowTiles = document.getElementById(`row-${currentRow}`).children; for (let i = 0; i < WORD_LENGTH; i++) { setTimeout(() => { rowTiles[i].classList.add(results[i], 'reveal'); updateKeyboard(guessLetters[i], results[i]); }, i * 300); } setTimeout(() => checkGameEnd(guess), WORD_LENGTH * 300); }
    function updateKeyboard(letter, state) { const key = document.querySelector(`[data-key="${letter.toLowerCase()}"]`); if (!key) return; const currentState = key.getAttribute('data-state'); if (currentState === 'correct') return; if (currentState === 'present' && state !== 'correct') return; key.setAttribute('data-state', state); }
    function checkGameEnd(guess) { if (guess === secretWord) { showEndGameModal(true); } else if (currentRow === maxTries - 1) { showEndGameModal(false); } else { isGameOver = false; currentRow++; setActiveTile(document.getElementById(`tile-${currentRow}-0`)); } }
    function showToast(message, duration = 1500) { toastContainer.textContent = message; toastContainer.classList.add('show'); setTimeout(() => { toastContainer.classList.remove('show'); }, duration); }

    function provideHint() {
        if (hintUsed || isGameOver) return; 

        let availableLetters = [];
        const secretLettersArray = secretWord.split('');

        for (let i = 0; i < WORD_LENGTH; i++) {
            const letterInSecret = secretLettersArray[i];
            let isRevealedCorrectly = false;
            
            for (let r = 0; r <= currentRow; r++) {
                const tile = document.getElementById(`tile-${r}-${i}`);
                if (tile && tile.classList.contains('correct') && guessGrid[r][i] === letterInSecret) {
                    isRevealedCorrectly = true;
                    break;
                }
            }

            if (!isRevealedCorrectly) {
                availableLetters.push(letterInSecret);
            }
        }
        
        const uniqueAvailableLetters = [...new Set(availableLetters)];

        if (uniqueAvailableLetters.length > 0) {
            const hintLetter = uniqueAvailableLetters[Math.floor(Math.random() * uniqueAvailableLetters.length)];
            showToast(`A palavra contém a letra: "${hintLetter.toUpperCase()}"`);
            hintUsed = true;
            hintBtn.classList.add('disabled');
        } else {
            showToast("Nenhuma dica útil disponível!");
            hintUsed = true;
            hintBtn.classList.add('disabled');
        }
    }

    // --- FUNÇÕES DOS MODAIS ---
    function openHelpModal() { helpModal.classList.add('show'); overlay.classList.add('open'); }
    function closeHelpModal() { helpModal.classList.remove('show'); overlay.classList.remove('open'); }
    function openInstructionsModal() { instructionsModal.classList.add('show'); overlay.classList.add('open'); }
    function closeInstructionsModal() { instructionsModal.classList.remove('show'); overlay.classList.remove('open'); }

    // ======================= INÍCIO DA CORREÇÃO =======================
    function showEndGameModal(didWin) {
        isGameOver = true; // Garante que o jogo está travado

        // CORREÇÃO: Os seletores abaixo foram ajustados para corresponder aos elementos corretos no arquivo index.html.
        // Os IDs e seletores antigos não existiam, o que causava um erro e impedia o modal de aparecer.
        const title = document.querySelector('#end-game-modal h2');
        const word = document.getElementById('final-word'); // O ID correto no HTML é 'final-word'
        const definitionContainer = document.querySelector('#end-game-modal .definition-container'); // Selecionado pela classe, pois não tem ID
        const definition = document.getElementById('word-definition'); // O ID correto no HTML é 'word-definition'
        
        title.textContent = didWin ? "Você Venceu!" : "Fim de Jogo";
        word.textContent = secretWord.toUpperCase();

        // Esta parte da lógica para mostrar a definição já estava correta.
        if (DICIONARIO[secretWord]) {
            definition.textContent = DICIONARIO[secretWord];
            definitionContainer.style.display = 'block';
        } else {
            definitionContainer.style.display = 'none';
        }
        
        endGameModal.classList.add('show');
        overlay.classList.add('open');
    }
    // ======================== FIM DA CORREÇÃO =========================

    function closeEndGameModal() { endGameModal.classList.remove('show'); overlay.classList.remove('open'); }

    // *** LÓGICA DE REINICIALIZAÇÃO ***
    function closeAllPopups() {
        if (helpModal.classList.contains('show')) closeHelpModal();
        if (instructionsModal.classList.contains('show')) closeInstructionsModal();
        
        // Se o modal de fim de jogo estiver aberto, fecha e reinicia o jogo
        if (endGameModal.classList.contains('show')) {
            closeEndGameModal();
            initializeGame();
        }
    }
    
    // INICIAR O JOGO
    addEventListeners();
    openInstructionsModal();
    initializeGame();
});