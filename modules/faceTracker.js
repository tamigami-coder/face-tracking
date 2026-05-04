/**
 * THE LOST BOX - Face Tracker Module
 * MediaPipe FaceMeshを使用して顔の向き（Yaw/Pitch）を推定します。
 */

class FaceTracker {
    constructor(videoElement) {
        this.video = videoElement;
        this.faceMesh = new window.FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        this.yaw = 0;
        this.pitch = 0;
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.initialPosition = null; // 基準となる初期位置
        this.isReady = false;
        this.hasError = false;
        
        this.init();
    }

    async init() {
        try {
            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.faceMesh.onResults((results) => this.onResults(results));

            const camera = new window.Camera(this.video, {
                onFrame: async () => {
                    await this.faceMesh.send({ image: this.video });
                },
                width: 640,
                height: 480
            });
            
            await camera.start();
            this.isReady = true;
        } catch (error) {
            console.error("FaceTracker initialization error:", error);
            this.hasError = true;
        }
    }

    onResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;

        const landmarks = results.multiFaceLandmarks[0];
        
        // 鼻の頭ではなく、顔の輪郭の左右・上下の端から「頭全体の中心位置」を計算する
        // これにより、顔を横に向けただけでは中心座標があまり動かず、純粋な「体の移動」に反応しやすくなる
        const leftEdge = landmarks[234];
        const rightEdge = landmarks[454];
        const topEdge = landmarks[10];
        const bottomEdge = landmarks[152];
        
        const headCenterX = (leftEdge.x + rightEdge.x) / 2;
        const headCenterY = (topEdge.y + bottomEdge.y) / 2;
        
        // 初回の検出時に顔の位置を「初期位置」として記録する
        if (!this.initialPosition) {
            this.initialPosition = { x: headCenterX, y: headCenterY };
        }

        // 初期位置からの移動量（オフセット）を計算
        const offsetX = headCenterX - this.initialPosition.x;
        const offsetY = headCenterY - this.initialPosition.y;

        // 移動量をカメラの角度に変換する（感度調整）
        const sensitivityX = 3.5;
        const sensitivityY = 3.5;

        // 体を右に移動したとき、現実世界の覗き込みと同じように右側面が見えるように符号を反転
        this.targetYaw = -offsetX * sensitivityX;

        // 体を上に移動したとき（画面の上がY=0なので、上に移動するとoffsetYはマイナスになる）
        // 上面を見るためにはpitchをプラス方向に持っていく必要があるため、符号を反転。
        this.targetPitch = -offsetY * sensitivityY;
        
        // 範囲制限
        this.targetYaw = Math.max(-1.0, Math.min(1.0, this.targetYaw));
        this.targetPitch = Math.max(-0.7, Math.min(0.7, this.targetPitch));

        // 動きを滑らかにするため線形補間（Lerp）を適用
        this.yaw += (this.targetYaw - this.yaw) * 0.15;
        this.pitch += (this.targetPitch - this.pitch) * 0.15;
    }

    /**
     * 顔の基準位置を現在の位置で再キャリブレーションする
     */
    resetPosition() {
        this.initialPosition = null;
    }

    getAngles() {
        return {
            yaw: this.yaw * (Math.PI / 3), // ±60度
            pitch: this.pitch * (Math.PI / 4) // ±45度
        };
    }
}
