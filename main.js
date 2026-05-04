/**
 * THE LOST BOX - Main Application
 * モジュールの初期化、モード選択、ゲームループの管理を行います。
 */



class App {
    constructor() {
        this.logic = new PuzzleLogic();
        this.ui = new UIController(this.logic);
        this.scene = new GameScene('canvas-wrapper');
        this.textures = new TextureGenerator();
        
        this.tracker = null;
        this.isGameOver = false;
        
        this.init();
    }

    async init() {
        // 1. テクスチャの準備
        this.ui.updateLoading(20, "テクスチャを作成中...");
        const faceTextures = {
            front: this.textures.generateFront(),
            back: this.textures.generatePlain(),
            left: this.textures.generateLeft(),
            right: this.textures.generateRight(),
            top: this.textures.generateTop(),
            bottom: this.textures.generatePlain(),
            plain: this.textures.generatePlain()
        };
        
        // 2. 3Dオブジェクトの作成
        this.ui.updateLoading(50, "木箱を組み立て中...");
        this.scene.createBox(faceTextures);
        
        // 3. タイトル画面へ
        this.ui.updateLoading(100, "準備完了");
        setTimeout(() => this.ui.showTitle(), 500);

        // ボタンイベント
        document.getElementById('btn-camera').addEventListener('click', () => this.startMode('camera'));
        document.getElementById('btn-mouse').addEventListener('click', () => this.startMode('mouse'));
        
        // クリア時コールバック
        this.ui.onUnlockCallback = () => this.handleUnlock();
        
        // クリックとマウス移動イベントの登録
        window.addEventListener('click', (e) => this.handleCanvasClick(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    async startMode(mode) {
        this.logic.setMode(mode);
        
        if (mode === 'camera') {
            try {
                this.ui.updateLoading(0, "カメラを起動中...");
                // ローディングを再表示
                document.getElementById('loading-screen').classList.remove('hidden');
                this.tracker = new FaceTracker(document.getElementById('input-video'));
                
                // リセットボタンの表示とイベント登録
                const resetBtn = document.getElementById('reset-pos-btn');
                if (resetBtn) {
                    resetBtn.classList.remove('hidden');
                    resetBtn.addEventListener('click', () => {
                        if (this.tracker && this.tracker.resetPosition) {
                            this.tracker.resetPosition();
                            resetBtn.textContent = "✓ 完了";
                            setTimeout(() => resetBtn.textContent = "🔄 リセット", 1500);
                        }
                    });
                }
                
                // 起動待ち (タイムアウト処理付き)
                let attempts = 0;
                const MAX_ATTEMPTS = 20; // 500ms * 20 = 10秒

                let checkReady = setInterval(() => {
                    attempts++;
                    if (this.tracker && this.tracker.isReady) {
                        clearInterval(checkReady);
                        this.ui.startGame();
                        document.getElementById('loading-screen').classList.add('hidden');
                        this.animate();
                    } else if ((this.tracker && this.tracker.hasError) || attempts >= MAX_ATTEMPTS) {
                        clearInterval(checkReady);
                        document.getElementById('loading-screen').classList.add('hidden');
                        alert("カメラの初期化に失敗、またはタイムアウトしました。マウスモードで開始します。（HTTPS環境やカメラの許可設定をご確認ください）");
                        this.startMode('mouse');
                    }
                }, 500);
            } catch (err) {
                console.error("Camera access failed:", err);
                alert("カメラにアクセスできませんでした。マウスモードに切り替えます。");
                this.startMode('mouse');
            }
        } else {
            this.tracker = new MouseTracker();
            // マウスモード限定の調整：引き出しに「④」の印字を追加
            if (this.scene.addDrawerNumber) {
                this.scene.addDrawerNumber();
            }
            this.ui.startGame();
            this.animate();
        }
    }

    handleUnlock() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.scene.playClearAnimation();
        this.ui.showClear();
    }

    handleCanvasClick(e) {
        if (this.logic.mode !== 'mouse' || this.isGameOver) return;

        // レイキャスティング
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.scene.camera);

        // モダン版の引き出し（メッシュ）に対する判定
        if (this.scene.drawer) {
            // Group内のすべての子メッシュを判定対象にする
            const intersectsDrawer = raycaster.intersectObjects(this.scene.drawer.children, true);
            if (intersectsDrawer.length > 0) {
                if (this.logic.openDrawer()) {
                    this.scene.openDrawerAnimation().then(() => {
                        alert("小さな引き出しが開いた。中に紙切れがある：\n『 IX - V = ? 』");
                    });
                }
                return;
            }
        }

        // アンティーク版（旧デザイン）の互換性維持のためのベース判定
        const intersectsBase = raycaster.intersectObject(this.scene.base);
        if (intersectsBase.length > 0) {
            const point = intersectsBase[0].point;
            // 正面(+Z)で、かつ南京錠の下あたりの座標
            if (point.z > 0.9 && point.y < -0.3) {
                if (this.logic.openDrawer()) {
                    alert("小さな引き出しが開いた。中に紙切れがある：\n『 IX - V = ? 』");
                }
            }
        }
    }

    /**
     * マウス移動時の処理（引き出しのホバー判定）
     */
    handleMouseMove(e) {
        if (this.isGameOver || this.logic.mode !== 'mouse') return;

        // UIの上ではなく、Canvas（3D空間）の上でのみ判定を行う
        if (e.target.tagName.toLowerCase() === 'canvas') {
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            if (this.scene && this.scene.drawer) {
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, this.scene.camera);
                
                // 引き出しのメッシュ群と交差しているかチェック
                const intersects = raycaster.intersectObjects(this.scene.drawer.children, true);
                if (intersects.length > 0) {
                    document.body.style.cursor = 'pointer'; // 指マークに変更
                } else {
                    document.body.style.cursor = 'default'; // 通常の矢印に戻す
                }
            }
        } else {
            // UIにホバーした場合はスタイル設定を解除（UI自体のCSSに従う）
            document.body.style.cursor = '';
        }
    }

    animate() {
        if (this.isGameOver) {
            this.scene.render();
            requestAnimationFrame(() => this.animate());
            return;
        }

        // トラッカーから角度を取得
        if (this.tracker) {
            if (this.logic.mode === 'mouse') this.tracker.update();
            const { yaw, pitch } = this.tracker.getAngles();
            this.scene.updateCamera(yaw, pitch);
        }

        this.scene.render();
        requestAnimationFrame(() => this.animate());
    }
}

new App();
