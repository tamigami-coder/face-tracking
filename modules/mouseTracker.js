/**
 * THE LOST BOX - Mouse Tracker Module
 * マウス座標を角度に変換します。マウスモードでは上下回転は制限されます。
 */

class MouseTracker {
    constructor() {
        this.yaw = 0;
        this.pitch = -0.15; // マウスモードでは少し低い視点に固定し、上面を完全に見えなくする
        this.targetYaw = 0;
        
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    }

    onMouseMove(e) {
        // -0.5 〜 +0.5 に正規化
        const normalizedX = (e.clientX / window.innerWidth) - 0.5;
        this.targetYaw = normalizedX * (Math.PI / 2); // ±45度
    }

    update() {
        // スムーズな追従（Lerp）
        this.yaw += (this.targetYaw - this.yaw) * 0.1;
    }

    getAngles() {
        return {
            yaw: this.yaw,
            pitch: this.pitch
        };
    }
}
