/**
 * THE LOST BOX - Puzzle Logic
 * 謎の正解管理、ヒント、クリア判定を行います。
 */

class PuzzleLogic {
    constructor() {
        this.currentCode = [0, 0, 0, 0];
        this.mode = 'camera'; // 'camera' or 'mouse'
        
        this.solutions = {
            drawer: [6, 3, 9, 2], // 引き出しを開けるための番号
            padlock: {
                camera: [7, 7, 5, 9],
                mouse: [7, 7, 5, 9]
            }
        };

        this.hints = [
            "正面に描かれた星の数を数えてみよう。",
            "右側から見ると、何かの数字が浮かび上がらないか？",
            "左側のモザイク。色の境目に注目してほしい。",
            "（カメラモードのみ）箱の『上面』を覗き込んで、不自然な場所を探せ。",
            "（マウスモードのみ）南京錠のすぐ下。何か動く場所はないか？"
        ];
        
        this.hintIndex = 0;
        this.drawerOpened = false;
    }

    setMode(mode) {
        this.mode = mode;
    }

    updateDigit(index, value) {
        this.currentCode[index] = value;
    }

    checkSolution(stage) {
        if (stage === 1) { // STAGE.DRAWER
            return this.currentCode.every((val, i) => val === this.solutions.drawer[i]);
        } else { // STAGE.BLACKLIGHT
            const sol = this.solutions.padlock[this.mode];
            return this.currentCode.every((val, i) => val === sol[i]);
        }
    }

    getNextHint() {
        let hint = this.hints[this.hintIndex];
        // モード依存のヒントフィルタリング
        if (this.mode === 'mouse' && hint.includes('カメラモード')) {
            this.hintIndex++;
            return this.getNextHint();
        }
        if (this.mode === 'camera' && hint.includes('マウスモード')) {
            this.hintIndex = 0; // ループ
            return this.getNextHint();
        }
        
        this.hintIndex = (this.hintIndex + 1) % this.hints.length;
        return hint;
    }

    openDrawer() {
        if (this.mode === 'mouse') {
            this.drawerOpened = true;
            return true;
        }
        return false;
    }
}
