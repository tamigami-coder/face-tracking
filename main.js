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
            back: this.textures.generatePlain(null), // 背面をプレーンに戻す
            left: this.textures.generateLeft(),
            right: this.textures.generateRight(),
            top: this.textures.generateTop(),
            bottom: this.textures.generatePlain(),
            plain: this.textures.generatePlain()
        };

        // 空間演出用：オリオン座（背景）
        const topResult = this.createTopDigitCanvas();
        this.digitCanvases = {
            front: this.createGeminiDigitCanvas(),
            right: this.createDigitCanvas('7'), // パスコードのヒント「7」を表示
            top: topResult.canvas,
            left: this.createDigitCanvas('5'),
            bg: this.createOrionDigitCanvas(), // 背景用のオリオン座
            back: null
        };
        
        // 南京錠の4桁目（Top）を「9」に更新（※現在は固定ロジック内なので自動で9になる）
        this.logic.solutions.padlock.camera[3] = 9;
        this.logic.solutions.padlock.mouse[3] = 9;
        
        // 直前に照らされていた面を記憶（外れた時にリセットするため）
        this.lastIlluminatedFace = null;
        this.lastIlluminatedIndex = -1;
        
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
                setTimeout(() => btn.textContent = "🔄 顔位置リセット", 1500);
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
                            setTimeout(() => resetBtn.textContent = "🔄 顔位置リセット", 1500);
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
                        this.ui.showNotification("カメラの初期化に失敗しました。マウスモードを開始します。", "error");
                        this.startMode('mouse');
                    }
                }, 500);
            } catch (err) {
                console.error("Camera access failed:", err);
                this.ui.showNotification("カメラにアクセスできませんでした。マウスモードに切り替えます。", "error");
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
        
        if (this.state.currentStage === 1) { // STAGE.DRAWER
            // ステージ1クリア：引き出しが開き、自動的にブラックライトを入手
            this.scene.openDrawer();
            this.state.hasBlacklight = true;
            this.state.nextStage();
            this.ui.updateStageUI();
            this.ui.showNotification("引き出しが開いた！魔法のライトを入手。隠された星を探そう。", "success");
        } else {
            // 最終クリア
            this.isGameOver = true;
            this.scene.playClearAnimation();
            this.ui.showClear();
        }
    }

    handleCanvasClick(e) {
        if (this.isGameOver) return;

        // レイキャスティング
        const mouse = new THREE.Vector2();
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.scene.camera);

        // ステージ3: 裏世界への反転トリガー判定 (底面)
        if (this.state.currentStage === 3) { // STAGE.REVERSE
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
                        this.ui.showNotification("引き出しが開いた！中に紙切れがある：\n『 IX - V = ? 』", "success");
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
                    this.ui.showNotification("引き出しが開いた！中に紙切れがある：\n『 IX - V = ? 』", "success");
                }
            }
        }
    }

    /**
     * マウス移動時の処理（引き出しのホバー判定）
     */
    handleMouseMove(e) {
        if (this.isGameOver) return;

        // v2: ブラックライトの座標更新 (所持している場合のみ)
        if (this.state.hasBlacklight) {
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

    createTopDigitCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 1024);

        const gapX = 140;
        const gapY = 130;
        const btnStartX = 512 - (420 / 2);
        const btnStartY = 512 - (520 / 2);

        let topSolutionDigit = 0;

        ctx.fillStyle = 'rgba(0, 255, 0, 1)'; // 不透明度を最大に
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#000000'; // 黒い縁取りのような効果で視認性アップ
        ctx.font = 'bold 70px "Courier New", Courier, monospace'; // 数字を大きく
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 指定された3x3配置 (8,1,6 / 3,5,7 / 4,9,2)
        const fixedLayout = [
            ['8', '1', '6'],
            ['3', '5', '7'],
            ['4', '9', '2']
        ];

        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 4; col++) {
                // ダミー位置（0の右隣）などはスキップ
                if (row === 4 && col === 1) continue;
                if (row === 4 && col === 2) continue; // 空白
                
                const cx = btnStartX + col * gapX;
                const cy = btnStartY + row * gapY;

                // 黒いボタン（row > 0 かつ col < 3）の時だけ数字を描画
                const isBlackButton = (row > 0 && col < 3);
                if (!isBlackButton) continue;

                // 3x3の数字エリア (row: 1〜3, col: 0〜2) から数字を取得
                let digitStr = '';
                if (row >= 1 && row <= 3 && col <= 2) {
                    digitStr = fixedLayout[row - 1][col];
                } else if (row === 4 && col === 0) {
                    digitStr = '0'; // 0ボタンはそのまま0
                } else {
                    continue; 
                }

                ctx.fillText(digitStr, cx, cy);
            }
        }

        return { canvas, solution: 9 };
    }

    /**
     * 背景空間に浮かび上がるオリオン座（7個の星）
     */
    createOrionDigitCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 1024);

        // オリオン座の座標データ (基準) - 現在の3分の1に縮小
        const getOrionStars = (centerX, centerY) => [
            {x: centerX - 8, y: centerY - 25}, // 肩 左
            {x: centerX + 8, y: centerY - 23}, // 肩 右
            {x: centerX - 1.5, y: centerY + 0},  // 三ツ星 左
            {x: centerX + 0.6, y: centerY + 0.6},// 三ツ星 中
            {x: centerX + 3.3, y: centerY + 1.6},// 三ツ星 右
            {x: centerX - 7, y: centerY + 25}, // 足 左
            {x: centerX + 10, y: centerY + 26}  // 足 右
        ];

        // 正面を北(768)とした時の、東北東 (ENE) -> x = 576
        // 高さは 500 を維持
        const centerX = 576;
        const centerY = 500;

        // 展開図の端で星座が切れないように、左右にずらして描画する関数
        const drawOrionAt = (cx, cy) => {
            const stars = getOrionStars(cx, cy);
            // 棒（線）の描画
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 0.8; // さらに細く
            ctx.beginPath();
            ctx.moveTo(stars[0].x, stars[0].y); ctx.lineTo(stars[1].x, stars[1].y);
            ctx.moveTo(stars[0].x, stars[0].y); ctx.lineTo(stars[2].x, stars[2].y);
            ctx.moveTo(stars[1].x, stars[1].y); ctx.lineTo(stars[4].x, stars[4].y);
            // 三ツ星
            ctx.moveTo(stars[2].x, stars[2].y); ctx.lineTo(stars[3].x, stars[3].y);
            ctx.lineTo(stars[4].x, stars[4].y);
            // 足へ
            ctx.moveTo(stars[2].x, stars[2].y); ctx.lineTo(stars[5].x, stars[5].y);
            ctx.moveTo(stars[4].x, stars[4].y); ctx.lineTo(stars[6].x, stars[6].y);
            ctx.moveTo(stars[5].x, stars[5].y); ctx.lineTo(stars[6].x, stars[6].y);
            ctx.stroke();

            // 星 (☆)
            const drawStar = (sx, sy, r) => {
                ctx.save();
                ctx.beginPath();
                ctx.translate(sx, sy);
                ctx.moveTo(0, -r);
                for (let i = 0; i < 5; i++) {
                    ctx.rotate(Math.PI / 5);
                    ctx.lineTo(0, -(r * 0.45));
                    ctx.rotate(Math.PI / 5);
                    ctx.lineTo(0, -r);
                }
                ctx.fillStyle = 'rgba(0, 255, 0, 1)'; 
                ctx.fill();
                ctx.restore();
            };
            stars.forEach(s => drawStar(s.x, s.y, 3)); // 星のサイズも 7 -> 3 に
        };

        // 描画実行
        drawOrionAt(centerX, centerY);

        return canvas;
    }

    createGeminiDigitCanvas() {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 1024, 1024);

        // textures.js と同じ星の座標
        const stars = [
            {x: 320, y: 180},
            {x: 430, y: 110},
            {x: 500, y: 260},
            {x: 630, y: 210},
            {x: 350, y: 480},
            {x: 570, y: 520}
        ];

        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000000';

        stars.forEach(s => {
            ctx.beginPath();
            ctx.arc(s.x, s.y, 22, 0, Math.PI * 2); // 星より少し大きめの◯
            ctx.fill();
        });

        // ヒントテキストをブラックライトで浮かび上がるように追加 (元の位置に戻す)
        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('星の数を数えて', 950, 512);

        return canvas;
    }

    createDigitCanvas(digit) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        // 完全な透明背景
        ctx.clearRect(0, 0, 1024, 1024);
        
        ctx.fillStyle = 'rgba(0, 255, 0, 1)';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#000000';
        ctx.font = 'bold 400px "Courier New", Courier, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(digit, 512, 512);
        
        return canvas;
    }

    /**
     * 魔法のライトがどの面に当たっているか判定する
     */
    checkBlacklightCollision(x, y) {
        const mouse = new THREE.Vector2();
        mouse.x = (x / window.innerWidth) * 2 - 1;
        mouse.y = -(y / window.innerHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.scene.camera);

        // 本体、フタ、そして背景ドームを判定対象にする
        const targets = [this.scene.base];
        if (this.scene.lid) targets.push(this.scene.lid);
        if (this.scene.bgDome) targets.push(this.scene.bgDome);

        const intersects = raycaster.intersectObjects(targets);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            const object = intersect.object;
            const index = intersect.face.materialIndex;
            
            // オブジェクトごとの面の名前マッピング
            let faceName = '';
            if (object === this.scene.base) {
                const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
                faceName = faceNames[index];
            } else if (object === this.scene.lid) {
                const lidFaceNames = ['plain', 'plain', 'top', 'plain', 'plain', 'plain'];
                faceName = lidFaceNames[index];
            } else if (object === this.scene.bgDome) {
                faceName = 'bg'; // 背景ドーム用
            }
            
            if (faceName === 'plain' || faceName === '') {
                this.resetCurrentIllumination();
                return;
            }
            
            // 別の面に移動した場合は前の面をリセット
            if (this.lastIlluminatedFace && this.lastIlluminatedFace !== faceName) {
                this.scene.resetFaceTexture(this.lastIlluminatedIndex, this.lastIlluminatedFace, this.lastIlluminatedObject);
            }
            
            this.lastIlluminatedFace = faceName;
            this.lastIlluminatedIndex = index;
            this.lastIlluminatedObject = object; // 追加：どのオブジェクトの面か

            // 魔法のライトの投影
            const digitCanvas = this.digitCanvases[faceName];
            this.scene.projectBlacklightOnFace(index, faceName, intersect.uv, digitCanvas, object);

            // ゲーム進行上の「発見」判定
            if (this.blacklight.revealDigit(faceName)) {
                console.log(`Discovered digit on ${faceName}`);
            }
        } else {
            this.resetCurrentIllumination();
        }
    }

    resetCurrentIllumination() {
        if (this.lastIlluminatedFace) {
            this.scene.resetFaceTexture(this.lastIlluminatedIndex, this.lastIlluminatedFace, this.lastIlluminatedObject);
            this.lastIlluminatedFace = null;
            this.lastIlluminatedIndex = -1;
            this.lastIlluminatedObject = null;
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
