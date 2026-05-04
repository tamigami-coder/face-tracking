/**
 * THE LOST BOX - UI Controller
 * 画面遷移、ダイヤル操作、ヒント表示などのDOM操作を担当します。
 */

class UIController {
    constructor(logic) {
        this.logic = logic;
        
        // Screens
        this.loadingScreen = document.getElementById('loading-screen');
        this.titleScreen = document.getElementById('title-screen');
        this.gameContainer = document.getElementById('game-container');
        this.clearScreen = document.getElementById('clear-screen');
        
        // Elements
        this.loadingText = document.getElementById('loading-text');
        this.progressFill = document.getElementById('progress-fill');
        this.hintText = document.getElementById('hint-text');
        this.hintDisplay = document.getElementById('hint-display');
        
        this.init();
    }

    init() {
        // ダイヤルボタンのイベント登録
        document.querySelectorAll('.dial').forEach(dial => {
            const index = parseInt(dial.dataset.index);
            const valueSpan = dial.querySelector('.dial-value');
            
            dial.querySelector('.dial-up').addEventListener('click', () => {
                this.changeDial(index, 1, valueSpan);
            });
            
            dial.querySelector('.dial-down').addEventListener('click', () => {
                this.changeDial(index, -1, valueSpan);
            });
        });

        // ヒントボタン
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showNextHint();
        });

        // リスタート
        document.getElementById('btn-restart').addEventListener('click', () => {
            window.location.reload();
        });
    }

    updateLoading(progress, text) {
        this.progressFill.style.width = `${progress}%`;
        if (text) this.loadingText.innerText = text;
    }

    showTitle() {
        this.loadingScreen.classList.add('hidden');
        this.titleScreen.classList.remove('hidden');
    }

    startGame() {
        this.titleScreen.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
    }

    showClear() {
        setTimeout(() => {
            this.clearScreen.classList.remove('hidden');
        }, 3000); // 箱が開くアニメーション待ち
    }

    changeDial(index, delta, span) {
        let val = parseInt(span.innerText);
        val = (val + delta + 10) % 10;
        span.innerText = val;
        this.logic.updateDigit(index, val);
        
        // 正解チェック
        if (this.logic.checkSolution()) {
            this.onUnlock();
        }
    }

    showNextHint() {
        const hint = this.logic.getNextHint();
        this.hintText.innerText = hint;
        this.hintDisplay.classList.remove('hidden');
        
        clearTimeout(this.hintTimer);
        this.hintTimer = setTimeout(() => {
            this.hintDisplay.classList.add('hidden');
        }, 8000);
    }

    onUnlock() {
        // main.js側でアニメーションを呼ぶためにイベントを発火させるか、
        // コールバックを登録しておく
        if (this.onUnlockCallback) this.onUnlockCallback();
    }
}
