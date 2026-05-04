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

        // ライト設定
        const ambientLight = new THREE.AmbientLight(0xffd97d, 0.4);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffcc88, 1.5, 20);
        pointLight.position.set(3, 5, 4);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // かすかな環境光（下から）
        const bottomLight = new THREE.PointLight(0x443322, 0.5, 10);
        bottomLight.position.set(-2, -3, 2);
        this.scene.add(bottomLight);

        this.scene.add(this.boxGroup);

        window.addEventListener('resize', () => this.onWindowResize());
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
            mats.plain, mats.plain, mats.top, mats.plain, mats.plain, mats.plain
        ];
        this.lid = new THREE.Mesh(lidGeom, lidMaterials);
        this.lid.position.y = 0.9;
        // 蓋の回転軸を後ろにずらすためのダミー（本体の上面 0.8 に合わせる）
        this.lidAnchor = new THREE.Group();
        this.lidAnchor.position.set(0, 0.8, -1.0);
        this.lid.position.set(0, 0.1, 1.0);
        this.lidAnchor.add(this.lid);
        this.boxGroup.add(this.lidAnchor);

        // 南京錠（簡易的な立方体で表現）
        const lockGeom = new THREE.BoxGeometry(0.3, 0.4, 0.1);
        const lockMat = new THREE.MeshStandardMaterial({ color: 0x887722, metalness: 0.8, roughness: 0.3 });
        this.padlock = new THREE.Mesh(lockGeom, lockMat);
        this.padlock.position.set(0, -0.4, 1.05);
        this.boxGroup.add(this.padlock);
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
        this.camera.position.y = radius * Math.sin(pitch) + 1.0; // 初期状態で上面を見えなくする
        this.camera.position.z = radius * Math.cos(yaw) * Math.cos(pitch);
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * クリア時のアニメーション
     */
    async playClearAnimation() {
        // 南京錠が落ちる
        const startY = this.padlock.position.y;
        for(let i=0; i<30; i++) {
            this.padlock.position.y -= 0.05;
            this.padlock.rotation.x += 0.1;
            this.padlock.position.z += 0.02;
            await new Promise(r => setTimeout(r, 16));
        }
        this.scene.remove(this.padlock);

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
        this.renderer.render(this.scene, this.camera);
    }
}
