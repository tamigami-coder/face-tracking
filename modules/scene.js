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
        this.shadow = null; // ステージ1の影
        
        // v2: ブラックライト
        this.blCanvas = document.getElementById('blacklight-canvas');
        this.blCtx = this.blCanvas.getContext('2d');
        
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

        window.addEventListener('resize', () => this.onWindowResize());
        this.onWindowResize(); // 初期サイズ設定
    }

    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        
        // ブラックライトキャンバスのサイズも同期
        if (this.blCanvas) {
            this.blCanvas.width = w;
            this.blCanvas.height = h;
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

        // 影パズル用のテクスチャ付きプレーン
        const shadowGeom = new THREE.PlaneGeometry(3, 3);
        const shadowMat = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        this.shadow = new THREE.Mesh(shadowGeom, shadowMat);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.set(1, -1.49, -1); // 箱の斜め後ろに配置
        this.scene.add(this.shadow);
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
        const loader = new THREE.CanvasTexture.prototype.constructor; // Utility to create textures from canvas
        
        const createMat = (canvas) => {
            const tex = new THREE.CanvasTexture(canvas);
            return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.2 });
        };

        const mats = {
            front: createMat(textures.front),
            back: createMat(textures.back),
            left: createMat(textures.left),
            right: createMat(textures.right),
            top: createMat(textures.top),
            bottom: createMat(textures.bottom),
            plain: createMat(textures.plain)
        };

        // 本体 (5面)
        const baseGeom = new THREE.BoxGeometry(2, 1.8, 2);
        // BoxGeometryのインデックス: 0:右, 1:左, 2:上, 3:下, 4:前, 5:後
        const baseMaterials = [
            mats.right, // +X
            mats.left,  // -X
            new THREE.MeshStandardMaterial({ color: 0x221105 }), // +Y (内側が見えるので暗く)
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
     * カメラ角度の更新
     * @param {number} yaw - 左右角度 (radian)
     * @param {number} pitch - 上下角度 (radian)
     */
    updateCamera(yaw, pitch) {
        const radius = 5;
        // 球面座標系に変換
        // MediaPipeのYaw/Pitchをカメラの公転に変換
        // 正面が(0,0,5)になるように調整
        this.camera.position.x = radius * Math.sin(yaw) * Math.cos(pitch);
        this.camera.position.y = radius * Math.sin(pitch) + 1.0; // 1.5から1.0に下げて、初期状態で上面を見えなくする
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
     * ステージ1: 影の形状と透明度を一致度に合わせて更新する
     */
    updateShadow(rate) {
        if (!this.shadow) return;

        // 一致度が高いほど、影を濃くし、形状（スケール）を正解に近づける
        this.shadow.material.opacity = 0.2 + (rate * 0.4);
        
        // 正解に近づくほど、歪みが取れて「4」の比率になるような演出（擬似）
        const scaleX = 1.0 + (1.0 - rate) * 1.5;
        const scaleY = 1.0 + (1.0 - rate) * 0.5;
        this.shadow.scale.set(scaleX, scaleY, 1);
        
        // 回転も少し歪ませる
        this.shadow.rotation.z = (1.0 - rate) * 0.5;
    }

    /**
     * ステージ2: ブラックライトのエフェクトを描画
     */
    updateBlacklight(x, y) {
        if (!this.blCtx) return;
        const ctx = this.blCtx;
        ctx.clearRect(0, 0, this.blCanvas.width, this.blCanvas.height);
        
        // 円形グラデーションでブラックライト（UV光）を表現
        const grad = ctx.createRadialGradient(x, y, 20, x, y, 180);
        grad.addColorStop(0, 'rgba(150, 0, 255, 0.5)'); // 中心は紫
        grad.addColorStop(0.5, 'rgba(100, 0, 200, 0.2)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)'); // 外側は透明
        
        ctx.save();
        // 光が当たっている部分以外をわずかに暗くする（任意）
        // ctx.fillStyle = 'rgba(0,0,0,0.1)';
        // ctx.fillRect(0, 0, this.blCanvas.width, this.blCanvas.height);
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 180, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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
