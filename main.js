/**
 * THE LOST BOX - Main Application
 * モジュールの初期化、モード選択、ゲームループの管理を行います。
 */



class App {
    constructor() {
        this.state = new StateManager();
        this.logic = new PuzzleLogic();
        this.ui = new UIController(this.logic, this.state);
        this.scene = new GameScene('canvas-wrapper');
        this.textures = new TextureGenerator();
        this.shadowPuzzle = new ShadowPuzzle(this.state);
        this.blacklight = new BlacklightManager(this.state);
        this.reverseWorld = new ReverseWorldManager(this.state, this.scene, this.textures);
        
        this.tracker = null;
        
        this.init();
    }

    async init() {
        // 1. テクスチャの準備
        this.ui.updateLoading(20, "テクスチャを作成中...");
        const faceTextures = {
            front: this.textures.generateFront(),
            back: this.textures.generatePlain('9'), // 4桁目
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
        
        // v2 追加: リセットボタンとヒントボタン
        document.getElementById('reset-pos-btn').addEventListener('click', () => {
            if (this.tracker && this.tracker.resetPosition) {
                this.tracker.resetPosition();
                const btn = document.getElementById('reset-pos-btn');
                btn.textContent = "✓ 完了";
                setTimeout(() => btn.textContent = "🔄 リセット", 1500);
            }
        });
        
        document.getElementById('btn-restart').addEventListener('click', () => location.reload());
        
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

    /**
     * ステージを変更する
     */
    changeStage(stageNum) {
        this.state.currentStage = stageNum;
        this.ui.updateStageUI();
        
        // ステージ固有の初期化（必要に応じて）
        console.log(`Stage changed to: ${this.state.getStageName()}`);
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

        // ステージ3: 裏世界への反転トリガー判定 (底面)
        if (this.state.currentStage === STAGE.REVERSE) {
            const intersectsBase = raycaster.intersectObject(this.scene.base);
            if (intersectsBase.length > 0) {
                const point = intersectsBase[0].point;
                const index = intersectsBase[0].face.materialIndex;
                const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
                const faceName = faceNames[index];
                
                if (this.reverseWorld.checkTrigger(faceName, point)) {
                    // 反転成功
                    return;
                }
            }
        }

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
        if (this.isGameOver) return;

        // v2: ブラックライトの座標更新 (Stage 2)
        if (this.state.currentStage === STAGE.BLACKLIGHT) {
            this.state.lightPos = { x: e.clientX, y: e.clientY };
            this.scene.updateBlacklight(e.clientX, e.clientY);
            
            // 照らされている面の判定
            this.checkBlacklightCollision(e.clientX, e.clientY);
        }

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

    /**
     * ブラックライトがどの面に当たっているか判定する
     */
    checkBlacklightCollision(x, y) {
        const mouse = new THREE.Vector2();
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.scene.camera);

        const intersects = raycaster.intersectObject(this.scene.base);
        if (intersects.length > 0) {
            const index = intersects[0].face.materialIndex;
            const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
            const faceName = faceNames[index];
            
            if (this.blacklight.revealDigit(faceName)) {
                // 発見演出
                console.log(`Discovered digit on ${faceName}`);
            }
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

            // ステージ1: 影パズルの更新
            if (this.state.currentStage === STAGE.SHADOW) {
                const rate = this.shadowPuzzle.calculateMatchRate(yaw, pitch);
                this.ui.updateMatchRate(rate);
                this.scene.updateShadow(rate);

                if (this.shadowPuzzle.isCleared) {
                    // クリア演出（本来はもっと派手にしたいが、まずは遷移のみ）
                    this.changeStage(STAGE.BLACKLIGHT);
                    alert("影が正解を示した！ステージクリア。");
                }
            }
        }

        this.scene.render();
        requestAnimationFrame(() => this.animate());
    }
}

new App();
