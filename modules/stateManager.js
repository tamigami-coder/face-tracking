/**
 * THE LOST BOX v2 - State Manager
 * 全ステージの進行状況、プレイヤーの入力、環境状態を一括管理します。
 */

const BOX_STATE = {
    NORMAL: 'normal',   // 表の世界
    REVERSE: 'reverse'  // 裏の世界
};

const STAGE = {
    DRAWER: 1,      // 最初：引き出しを開ける（ブラックライトなし）
    BLACKLIGHT: 2   // 次：ブラックライトで探索
};

class StateManager {
    constructor() {
        this.reset();
    }

    reset() {
        // ステージ管理
        this.currentStage = STAGE.DRAWER;
        this.stageCleared = [false, false, false, false]; // インデックス0は未使用
        
        // アイテム状態
        this.hasBlacklight = false; // 最初は持っていない
        this.inputMode = 'camera'; // 'camera' | 'mouse'
        this.isGameOver = false;
        
        // Stage 2: ブラックライト
        this.lightPos = { x: -1, y: -1 };
        this.foundDigits = [false, false, false, false];
        this.inputCode = ['', '', '', ''];

        // Stage 3: 裏世界
        this.boxState = BOX_STATE.NORMAL;
        this.collectedClues = {};
        this.inputSymbols = [];

        // AI ヒント
        this.hintText = '';
        this.hintLoading = false;
    }

    /**
     * 次のステージへ進む
     */
    nextStage() {
        if (this.currentStage < STAGE.BLACKLIGHT) {
            this.stageCleared[this.currentStage] = true;
            this.currentStage++;
            return true;
        }
        return false;
    }

    /**
     * ステージ名をリターン
     */
    getStageName() {
        switch (this.currentStage) {
            case STAGE.DRAWER: return "閉ざされた引き出し";
            case STAGE.BLACKLIGHT: return "魔法のライト";
            default: return "";
        }
    }
}
