/**
 * THE LOST BOX - 3D Scene Module
 * Three.jsを使用したシーン構成、ライト、木箱の作成を担当します。
 */

class GameScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        this.boxGroup = new THREE.Group();
        this.lid = null;
        this.base = null;
        this.padlock = null;
        this.drawer = null;
        this.bgDome = null; // 背景の投影用ドーム（プラネタリウム）
        
        // v2: ブラックライト
        this.blCanvas = document.getElementById('blacklight-canvas');
        this.blCtx = this.blCanvas.getContext('2d');
        
        this.originalTextures = {};
        this.workingCanvases = {};
        this.workingCtxs = {};
        
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // カメラ初期位置
        this.camera.position.set(0, 1.5, 5);
        this.camera.lookAt(0, 0, 0);

        // ライト設定（クールでモダンなスタジオライティング）
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1.5, 20);
        pointLight.position.set(3, 5, 4);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // かすかな環境光（ネオンブルーの照り返しを下から）
        const bottomLight = new THREE.PointLight(0x00f0ff, 0.8, 10);
        bottomLight.position.set(-2, -3, 2);
        this.scene.add(bottomLight);

        // 背景の動的なパーティクル演出を追加
        this.createBackgroundParticles();

        // 床の作成（影を投影するため）
        this.createFloor();

        this.scene.add(this.boxGroup);
        
        // 背景ドーム作成
        this.createBackgroundDome();

        window.addEventListener('resize', () => this.onWindowResize());
        this.onWindowResize(); // 初期サイズ設定
    }

    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        
        // ブラックライトキャンバスのサイズも同期し、DPRスケールを適用
        if (this.blCanvas) {
            this.blCanvas.width = w * dpr;
            this.blCanvas.height = h * dpr;
            
            // CSSサイズを画面サイズに固定
            this.blCanvas.style.width = `${w}px`;
            this.blCanvas.style.height = `${h}px`;
            
            // 変換マトリクスはリセットしておく（描画時に正確な物理ピクセルで計算するため）
            this.blCtx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }

    createFloor() {
        const floorGeom = new THREE.PlaneGeometry(20, 20);
        const floorMat = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeee, 
            roughness: 0.8,
            metalness: 0.1,
            transparent: true,
            opacity: 0.5
        });
        const floor = new THREE.Mesh(floorGeom, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.5;
        this.scene.add(floor);
    }

    createBackgroundParticles() {
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i++) {
            // カメラの周囲広範囲に散りばめる
            positions[i] = (Math.random() - 0.5) * 20;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMaterial = new THREE.PointsMaterial({ 
            color: 0x00aaff, 
            size: 0.08, 
            transparent: true,
            opacity: 0.6
        });
        
        this.bgParticles = new THREE.Points(particles, pMaterial);
        this.scene.add(this.bgParticles);
    }

    /**
     * 木箱の作成
     */
    createBox(textures) {
        // キャッシュ（ブラックライトで動的に描画するため）
        // 既存のテクスチャ（背景など）を保持したまま、木箱のテクスチャを追加
        Object.assign(this.originalTextures, textures);
        this.maskCanvas = null; // マスク用の一時キャンバスキャッシュ

        const createMat = (faceName) => {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');
            
            // 初回描画
            ctx.drawImage(this.originalTextures[faceName], 0, 0);
            
            this.workingCanvases[faceName] = canvas;
            this.workingCtxs[faceName] = ctx;
            
            const tex = new THREE.CanvasTexture(canvas);
            return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.2 });
        };

        const mats = {
            front: createMat('front'),
            back: createMat('back'),
            left: createMat('left'),
            right: createMat('right'),
            top: createMat('top'),
            bottom: createMat('bottom'),
            plain: new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain), roughness: 0.8, metalness: 0.2 })
        };

        // 本体 (5面)
        const baseGeom = new THREE.BoxGeometry(2, 1.8, 2);
        // BoxGeometryのインデックス: 0:右, 1:左, 2:上, 3:下, 4:前, 5:後
        const baseMaterials = [
            mats.right, // +X
            mats.left,  // -X
            mats.top,   // +Y
            mats.bottom, // -Y
            mats.front, // +Z
            mats.back   // -Z
        ];
        this.base = new THREE.Mesh(baseGeom, baseMaterials);
        this.base.position.y = -0.1;
        this.boxGroup.add(this.base);

        // 蓋 (1面 + 厚み)
        const lidGeom = new THREE.BoxGeometry(2.1, 0.2, 2.1);
        const lidMaterials = [
            mats.plain, // +X
            mats.plain, // -X
            mats.top,   // +Y
            mats.plain, // -Y
            mats.plain, // +Z
            mats.plain  // -Z
        ];
        this.lid = new THREE.Mesh(lidGeom, lidMaterials);
        this.lid.position.y = 0.9;
        // 蓋の回転軸を後ろにずらすためのダミー（本体の上面 0.8 に合わせる）
        this.lidAnchor = new THREE.Group();
        this.lidAnchor.position.set(0, 0.8, -1.0);
        this.lid.position.set(0, 0.1, 1.0);
        this.lidAnchor.add(this.lid);
        this.boxGroup.add(this.lidAnchor);

        // 以前の南京錠（緑/茶色の四角）は削除されました

        // 引き出し（横長、取っ手付き）
        this.drawer = new THREE.Group();
        
        const drawerGeom = new THREE.BoxGeometry(1.2, 0.25, 0.1);
        // モダンなパネル風の質感（箱本体のグレーに合わせる）
        const drawerMat = new THREE.MeshStandardMaterial({ color: 0x6c6c75, metalness: 0.6, roughness: 0.5 });
        const drawerMesh = new THREE.Mesh(drawerGeom, drawerMat);
        
        // 取っ手（シルバーの金属風）
        const handleGeom = new THREE.BoxGeometry(0.4, 0.04, 0.08);
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
        const handleMesh = new THREE.Mesh(handleGeom, handleMat);
        handleMesh.position.set(0, 0, 0.05); // 引き出しの前面に配置
        
        this.drawer.add(drawerMesh);
        this.drawer.add(handleMesh);
        
        // ベースの前面下部に配置
        this.drawer.position.set(0, -0.7, 1.05);
        this.boxGroup.add(this.drawer);
    }

    /**
     * 背景の投影用ドーム（プラネタリウム）を作成
     */
    createBackgroundDome() {
        // 箱を完全に包み込む巨大な球体
        const geometry = new THREE.SphereGeometry(15, 64, 32);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        
        // 最初は真っ暗
        ctx.fillStyle = '#050508'; // 漆黒に近い紺色
        ctx.fillRect(0, 0, 1024, 1024);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({ 
            map: tex, 
            side: THREE.BackSide, // 内側を描画
            metalness: 0,
            roughness: 1
        });
        
        this.bgDome = new THREE.Mesh(geometry, mat);
        this.scene.add(this.bgDome);
        
        // テクスチャ管理用の配列に追加
        this.workingCanvases['bg'] = canvas;
        this.workingCtxs['bg'] = ctx;
        // 元データ（真っ暗な状態）を保存
        const origCanvas = document.createElement('canvas');
        origCanvas.width = origCanvas.height = 1024;
        const oCtx = origCanvas.getContext('2d');
        oCtx.fillStyle = '#050508';
        oCtx.fillRect(0, 0, 1024, 1024);
        this.originalTextures['bg'] = origCanvas;
    }

    /**
     * カメラ角度の更新
     * @param {number} yaw - 左右角度 (radian)
     * @param {number} pitch - 上下角度 (radian)
     */
    updateCamera(yaw, pitch) {
        const radius = 5;
        // 球面座標系に変換
        // MediaPipeのYaw/Pitchをカメラの公転に変換
        this.camera.position.x = radius * Math.sin(yaw) * Math.cos(pitch);
        this.camera.position.y = radius * Math.sin(pitch) + 1.0; 
        this.camera.position.z = radius * Math.cos(yaw) * Math.cos(pitch);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 箱のテクスチャを動的に更新する (Stage 3用)
     */
    updateBoxTextures(textures) {
        if (!this.base) return;

        // Base materials
        const mats = [
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.right) }),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.left) }),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.top) }),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.bottom) }),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.front) }),
            new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.back) })
        ];
        this.base.material = mats;

        // Lid materials
        if (this.lid) {
            const lidMats = [
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain) }),
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain) }),
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.top) }),
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain) }),
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain) }),
                new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(textures.plain) })
            ];
            this.lid.material = lidMats;
        }
    }

    /**
     * ステージ2: ブラックライトのエフェクトを描画
     */
    updateBlacklight(clientX, clientY) {
        if (!this.blCtx || !this.blCanvas) return;
        
        // CSS上の表示サイズと実際のキャンバスピクセルサイズの比率から正確な座標を計算
        const rect = this.blCanvas.getBoundingClientRect();
        const scaleX = this.blCanvas.width / rect.width;
        const scaleY = this.blCanvas.height / rect.height;

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // 光源のサイズもスケールに合わせる
        const innerRadius = 20 * ((scaleX + scaleY) / 2);
        const outerRadius = 180 * ((scaleX + scaleY) / 2);

        const ctx = this.blCtx;
        ctx.clearRect(0, 0, this.blCanvas.width, this.blCanvas.height);
        
        // 円形グラデーションでブラックライト（UV光）を表現
        const grad = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
        grad.addColorStop(0, 'rgba(150, 0, 255, 0.5)'); // 中心は紫
        grad.addColorStop(0.5, 'rgba(100, 0, 200, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // 外側は透明
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, outerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * 魔法のライトの照射範囲を描画する
     */
    projectBlacklightOnFace(index, faceName, uv, digitCanvas, targetObject = null) {
        const obj = targetObject || this.base;
        if (!obj || !this.workingCtxs[faceName]) return;

        const ctx = this.workingCtxs[faceName];
        
        // 1. ベーステクスチャを描画（前回の描画をリセット）
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.originalTextures[faceName], 0, 0);

        // 2. UV座標からCanvas上の座標(px, py)を計算
        const px = uv.x * 1024;
        const py = (1.0 - uv.y) * 1024;

        // 3. マスク用のオフスクリーンキャンバスを準備
        if (!this.maskCanvas) {
            this.maskCanvas = document.createElement('canvas');
            this.maskCanvas.width = 1024;
            this.maskCanvas.height = 1024;
            this.maskCtx = this.maskCanvas.getContext('2d');
        }
        
        const mCtx = this.maskCtx;
        
        // --- 演出A: 数字を浮かび上がらせる白い光（数字がある場合のみ） ---
        if (digitCanvas) {
            mCtx.clearRect(0, 0, 1024, 1024);
            // 対象によって半径を切り替える (背景: 60, 箱: 200)
            const radius = (faceName === 'bg') ? 60 : 200;
            const grad = mCtx.createRadialGradient(px, py, 20, px, py, radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            mCtx.globalCompositeOperation = 'source-over';
            mCtx.fillStyle = grad;
            mCtx.fillRect(px - radius, py - radius, radius * 2, radius * 2);

            mCtx.globalCompositeOperation = 'source-in';
            mCtx.drawImage(digitCanvas, 0, 0);

            // 合成モードを source-over にして、明るい背景の上でも数字が見えるようにする
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(this.maskCanvas, 0, 0);
        }

        // --- 演出B: ブラックライト自体の紫色の光（常に表示） ---
        // 対象によって半径を切り替える (背景: 100, 箱: 200)
        const uvRadius = (faceName === 'bg') ? 100 : 200;
        const uvGrad = ctx.createRadialGradient(px, py, 10, px, py, uvRadius);
        uvGrad.addColorStop(0, 'rgba(120, 0, 255, 0.4)'); 
        uvGrad.addColorStop(0.5, 'rgba(60, 0, 120, 0.15)');
        uvGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = uvGrad;
        ctx.beginPath();
        ctx.arc(px, py, uvRadius, 0, Math.PI * 2);
        ctx.fill();

        // マップの更新通知
        if (targetObject) {
            const mat = targetObject.material;
            if (Array.isArray(mat)) {
                if (mat[index] && mat[index].map) mat[index].map.needsUpdate = true;
            } else {
                if (mat.map) mat.map.needsUpdate = true;
            }
        } else {
            this.base.material[index].map.needsUpdate = true;
        }
    }

    /**
     * マウスが外れた時などにテクスチャを元に戻す
     */
    resetFaceTexture(index, faceName, targetObject = null) {
        if (!this.workingCtxs[faceName]) return;
        const ctx = this.workingCtxs[faceName];
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(this.originalTextures[faceName], 0, 0);
        
        if (targetObject) {
            const mat = targetObject.material;
            if (Array.isArray(mat)) {
                if (mat[index] && mat[index].map) mat[index].map.needsUpdate = true;
            } else {
                if (mat.map) mat.map.needsUpdate = true;
            }
        } else {
            this.base.material[index].map.needsUpdate = true;
        }
    }

    /**
     * マウスモード時のみ、引き出しの表面に「④」を印字する
     */
    addDrawerNumber() {
        if (!this.drawer) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 背景色（箱本体のグレーに合わせる）
        ctx.fillStyle = '#6c6c75';
        ctx.fillRect(0, 0, 512, 128);
        
        // 右端に「④」を描画
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 60px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('④', 480, 64);
        
        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshStandardMaterial({ map: tex, metalness: 0.6, roughness: 0.5 });
        
        // 引き出し本体のメッシュ（Groupの最初の子要素）を取得
        const drawerMesh = this.drawer.children[0];
        
        // BoxGeometryの面: 0:右, 1:左, 2:上, 3:下, 4:前, 5:後
        const originalMat = drawerMesh.material;
        drawerMesh.material = [
            originalMat, originalMat, originalMat,
            originalMat, mat, originalMat
        ];
    }

    /**
     * 引き出しを開けるアニメーション
     */
    openDrawer() {
        if (!this.drawer) return;
        
        // TWEENやGSAPがないため、シンプルな線形補間でアニメーション（本来はanimate内で管理すべきだが、まずは簡易的に）
        let startZ = this.drawer.position.z;
        let targetZ = 1.5; // 少し手前に出す
        let startTime = Date.now();
        let duration = 1000;

        const animateOpen = () => {
            let elapsed = Date.now() - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            // イージング（outQuad）
            let ease = progress * (2 - progress);
            
            this.drawer.position.z = startZ + (targetZ - startZ) * ease;
            
            if (progress < 1) {
                requestAnimationFrame(animateOpen);
            }
        };
        
        animateOpen();
    }

    /**
     * 引き出しを開くアニメーション
     */
    async openDrawerAnimation() {
        if (!this.drawer) return;
        // Z軸手前方向にスライド
        for (let i = 0; i < 20; i++) {
            this.drawer.position.z += 0.02;
            await new Promise(r => setTimeout(r, 16));
        }
    }

    /**
     * クリア時のアニメーション
     */
    async playClearAnimation() {
        // 以前の南京錠落下アニメーションは削除されました

        // 蓋が開く
        for(let i=0; i<90; i++) {
            this.lidAnchor.rotation.x -= 0.02;
            await new Promise(r => setTimeout(r, 16));
        }

        // 光の演出
        const light = new THREE.PointLight(0xffffff, 2, 10);
        light.position.set(0, 0.5, 0);
        this.scene.add(light);

        // パーティクル演出
        const particleCount = 100;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 0.5;
        }
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const pMaterial = new THREE.PointsMaterial({ color: 0xffcc88, size: 0.05, transparent: true });
        const pSystem = new THREE.Points(particles, pMaterial);
        pSystem.position.y = 0.5;
        this.scene.add(pSystem);

        // パーティクル上昇
        for (let i = 0; i < 100; i++) {
            const pos = particles.attributes.position.array;
            for (let j = 0; j < particleCount; j++) {
                pos[j * 3 + 1] += 0.02; // Y軸上昇
                pos[j * 3] += (Math.random() - 0.5) * 0.01; // X軸揺らぎ
            }
            particles.attributes.position.needsUpdate = true;
            pMaterial.opacity -= 0.01;
            await new Promise(r => setTimeout(r, 16));
        }
        this.scene.remove(pSystem);
        this.scene.remove(light);
    }

    render() {
        // 背景パーティクルのゆっくりとした回転アニメーション
        if (this.bgParticles) {
            this.bgParticles.rotation.y += 0.001;
            this.bgParticles.rotation.x += 0.0005;
        }
        this.renderer.render(this.scene, this.camera);
    }
}
