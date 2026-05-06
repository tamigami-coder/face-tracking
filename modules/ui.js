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
            if (this.logic.checkSolution(this.state.currentStage)) {
                this.onUnlock();
            } else {
                this.showNotification("コードが正しくありません。", "error");
            }
        });

        // 記号決定ボタン
        document.getElementById('symbol-submit').addEventListener('click', () => {
            this.showNotification("記号が一致しません。", "error"); // ステージ3実装時にロジック追加
        });
    }

    /**
     * カスタム通知を表示する
     */
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const div = document.createElement('div');
        div.className = `notification ${type}`;
        div.innerText = message;
        
        container.appendChild(div);
        
        // アニメーションが終わったら削除
        setTimeout(() => {
            div.remove();
        }, 5000);
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
        this.stageCountLabel.innerText = `STAGE ${this.state.currentStage}/2`;
        this.stageNameLabel.innerText = this.state.getStageName();

        // 全パネルを一旦非表示
        document.querySelectorAll('.input-panel').forEach(p => p.classList.add('hidden'));

        // 現在のステージのパネルを表示
        switch (this.state.currentStage) {
            case STAGE.BLACKLIGHT:
                document.getElementById('panel-padlock').classList.remove('hidden');
                break;
            case STAGE.REVERSE:
                document.getElementById('panel-symbols').classList.remove('hidden');
                break;
            case STAGE.DRAWER:
                document.getElementById('panel-padlock').classList.remove('hidden');
                break;
        }
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
    }

    showNextHint() {
        if (this.hintDisplay.classList.contains('visible')) return;
        
        let hint = "";
        // ステージに応じてヒントを切り替え
        if (this.state.currentStage === STAGE.DRAWER) {
            hint = "スマホで見たことあるような…？";
        } else {
            hint = "星は夜空にあるよね！";
        }

        this.hintText.innerText = hint;
        this.hintDisplay.classList.remove('hidden');
        this.hintDisplay.classList.add('visible');

        clearTimeout(this.hintTimer);
        this.hintTimer = setTimeout(() => {
            this.hintDisplay.classList.add('hidden');
            this.hintDisplay.classList.remove('visible');
        }, 5000); // 5秒で消えるように調整
    }

    onUnlock() {
        // main.js側でアニメーションを呼ぶためにイベントを発火させるか、
        // コールバックを登録しておく
        if (this.onUnlockCallback) this.onUnlockCallback();
    }
}
