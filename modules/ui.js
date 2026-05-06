/**
 * THE LOST BOX - UI Controller
 * 画面遷移、ダイヤル操作、ヒント表示などのDOM操作を担当します。
 */

class UIController {
    constructor(logic, state) {
        this.logic = logic;
        this.state = state;
        
        // Screens
        this.loadingScreen = document.getElementById('loading-screen');
        this.titleScreen = document.getElementById('title-screen');
        this.gameContainer = document.getElementById('game-container');
        this.clearScreen = document.getElementById('clear-screen');
        this.claude = new ClaudeAPI(); // New
        
        // v2 Elements
        this.header = document.getElementById('game-header');
        this.footer = document.getElementById('game-footer');
        this.stageCountLabel = document.querySelector('.stage-count');
        this.stageNameLabel = document.getElementById('stage-name');
        
        // Feedback
        this.matchRateFill = document.getElementById('match-rate-fill');
        this.matchRateText = document.getElementById('match-rate-text');
        
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

        // 南京錠決定ボタン
        document.getElementById('unlock-btn').addEventListener('click', () => {
            if (this.logic.checkSolution()) {
                this.onUnlock();
            } else {
                alert("コードが正しくありません。");
            }
        });

        // 記号決定ボタン
        document.getElementById('symbol-submit').addEventListener('click', () => {
            alert("記号が一致しません。"); // ステージ3実装時にロジック追加
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
        this.header.classList.remove('hidden');
        this.footer.classList.remove('hidden');
        this.updateStageUI();
    }

    /**
     * 現在のステージに合わせてパネルを切り替える
     */
    updateStageUI() {
        this.stageCountLabel.innerText = `STAGE ${this.state.currentStage}/3`;
        this.stageNameLabel.innerText = this.state.getStageName();

        // 全パネルを一旦非表示
        document.querySelectorAll('.input-panel').forEach(p => p.classList.add('hidden'));

        // 現在のステージのパネルを表示
        switch (this.state.currentStage) {
            case STAGE.SHADOW:
                document.getElementById('panel-shadow').classList.remove('hidden');
                break;
            case STAGE.BLACKLIGHT:
                document.getElementById('panel-padlock').classList.remove('hidden');
                break;
            case STAGE.REVERSE:
                document.getElementById('panel-symbols').classList.remove('hidden');
                break;
        }
    }

    /**
     * ステージ1の一致度ゲージを更新
     */
    updateMatchRate(rate) {
        const percent = Math.floor(rate * 100);
        this.matchRateFill.style.width = `${percent}%`;
        this.matchRateText.innerText = `${percent}%`;
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

    async showNextHint() {
        if (this.state.hintLoading) return;
        this.state.hintLoading = true;
        
        this.hintText.innerText = "思案中...";
        this.hintDisplay.classList.remove('hidden');

        const hint = await this.claude.generateHint(this.state.currentStage, this.state);
        this.hintText.innerText = hint;
        
        this.state.hintLoading = false;
        
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
