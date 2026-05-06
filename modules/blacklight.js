/**
 * THE LOST BOX v2 - Blacklight Logic
 * ステージ2: ブラックライトのギミックと発見判定を担当します。
 */

class BlacklightManager {
    constructor(state) {
        this.state = state;
        this.discoveredCount = 0;
    }

    /**
     * 指定された面がライトで照らされた時の判定
     * @param {string} faceName 'front' | 'left' | 'right' | 'top' | 'back'
     */
    revealDigit(faceName) {
        const faceToIndex = {
            'front': 0,
            'left': 1,
            'top': 2,
            'back': 3
        };

        const index = faceToIndex[faceName];
        if (index !== undefined && !this.state.foundDigits[index]) {
            this.state.foundDigits[index] = true;
            this.discoveredCount++;
            
            console.log(`Hidden digit found on ${faceName}!`);
            
            // 全て発見したかチェック
            if (this.discoveredCount === 4) {
                console.log("All digits found. Ready for input.");
            }
            
            return true;
        }
        return false;
    }

    reset() {
        this.discoveredCount = 0;
        this.state.foundDigits = [false, false, false, false];
    }
}
