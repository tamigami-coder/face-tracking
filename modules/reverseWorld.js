/**
 * THE LOST BOX v2 - Reverse World Manager
 * ステージ3: 表の世界と裏世界の切り替え、テクスチャの更新を担当します。
 */

class ReverseWorldManager {
    constructor(state, scene, textures) {
        this.state = state;
        this.scene = scene;
        this.textures = textures;
    }

    /**
     * 世界を反転させる
     */
    toggle() {
        const toReverse = this.state.boxState === BOX_STATE.NORMAL;
        this.state.boxState = toReverse ? BOX_STATE.REVERSE : BOX_STATE.NORMAL;
        
        // テクスチャセットの生成
        const newTextures = {
            front: this.textures.generateSet(toReverse),
            back: this.textures.generatePlain(null, toReverse),
            left: this.textures.generateSet(toReverse),
            right: this.textures.generateSet(toReverse),
            top: this.textures.generateSet(toReverse),
            bottom: this.textures.generatePlain(null, toReverse),
            plain: this.textures.generatePlain(null, toReverse)
        };

        // シーンのテクスチャを更新
        this.scene.updateBoxTextures(newTextures);

        // 背景色の微調整（演出）
        if (toReverse) {
            document.body.style.backgroundColor = '#0a0514';
        } else {
            document.body.style.backgroundColor = '#f4f4f7';
        }
    }

    /**
     * 底面の特定のエリアをクリックしたか判定する
     */
    checkTrigger(faceName, point) {
        if (faceName === 'bottom') {
            // 底面の中央付近を判定 (Three.js座標系)
            if (Math.abs(point.x) < 0.2 && Math.abs(point.z) < 0.2) {
                this.toggle();
                return true;
            }
        }
        return false;
    }
}
