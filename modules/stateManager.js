/**
 * THE LOST BOX v2 - State Manager
 * 全ステージの進行状況、プレイヤーの入力、環境状態を一括管理します。
 */

const BOX_STATE = {
    NORMAL: 'normal',   // 表の世界
    REVERSE: 'reverse'  // 裏の世界
};

const STAGE = {
    SHADOW: 1,      // 影パズル
    BLACKLIGHT: 2,  // ブラックライト
    REVERSE: 3      // 裏世界
};

class StateManager {
    constructor() {
        this.reset();
    }

    reset() {
        // ステージ管理
        this.currentStage = STAGE.SHADOW;
        this.stageCleared = [false, false, false, false]; // インデックス0は未使用

        // 共通状態
        this.inputMode = 'camera'; // 'camera' | 'mouse'
        this.isGameOver = false;

        // Stage 1: 影パズル
        this.shadowMatchRate = 0;
        
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
        if (this.currentStage < 3) {
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
            case STAGE.SHADOW: return "影を探せ";
            case STAGE.BLACKLIGHT: return "ブラックライト";
            case STAGE.REVERSE: return "裏世界";
            default: return "";
        }
    }
}
