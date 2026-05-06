/**
 * THE LOST BOX v2 - Shadow Puzzle Logic
 * ステージ1: 影パズルの判定ロジックを担当します。
 */

const SHADOW_ANSWER = {
    targetYaw: 0.5,      // 正解の横角度
    targetPitch: -0.3,   // 正解の縦角度
    tolerance: 0.15       // 許容誤差
};

class ShadowPuzzle {
    constructor(state) {
        this.state = state;
        this.isCleared = false;
    }

    /**
     * 現在の顔の角度から一致度を計算する
     * @param {number} yaw 
     * @param {number} pitch 
     * @returns {number} 0.0 ~ 1.0
     */
    calculateMatchRate(yaw, pitch) {
        if (this.isCleared) return 1.0;

        // ターゲット角度との距離を計算
        const dy = Math.abs(yaw - SHADOW_ANSWER.targetYaw);
        const dp = Math.abs(pitch - SHADOW_ANSWER.targetPitch);
        
        // 距離を0~1のスコアに変換（近いほど1に近い）
        const distance = Math.sqrt(dy * dy + dp * dp);
        const maxDist = 1.5; // 適当な最大距離
        
        let rate = 1.0 - (distance / maxDist);
        rate = Math.max(0, Math.min(1, rate));
        
        // 指数関数的に変化させて、正解に近づくほど急上昇させる
        rate = Math.pow(rate, 3);

        this.state.shadowMatchRate = rate;

        // クリア判定
        if (rate > 0.95 && !this.isCleared) {
            this.isCleared = true;
            return 1.0;
        }

        return rate;
    }
}
