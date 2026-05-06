/**
 * THE LOST BOX v2 - Claude API Integration
 * AIによる動的なヒント生成とストーリー演出を担当します。
 */

class ClaudeAPI {
    constructor() {
        this.apiKey = ""; // ユーザーが設定することを想定
        this.baseUrl = "https://api.anthropic.com/v1/messages";
    }

    /**
     * ステージと進行状況に応じたヒントを生成
     */
    async generateHint(stage, state) {
        if (!this.apiKey) {
            return this.getFallbackHint(stage);
        }

        const prompt = `
あなたは謎解きゲーム「THE LOST BOX」のヒントAIです。
現在のステージ: ${stage}
プレイヤーの状態: ${JSON.stringify(state)}

ネタバレしすぎない、詩的で謎めいたヒントを1文（30文字以内）で返してください。
例:「光の届かぬ場所に、真実は隠れている。」
        `;

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 100,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error("Claude API Error:", error);
            return this.getFallbackHint(stage);
        }
    }

    /**
     * APIが利用できない場合の固定ヒント
     */
    getFallbackHint(stage) {
        const fallbacks = {
            1: "影は光の対極にある。視点を変え、完璧な形を探せ。",
            2: "見えないものは光で照らせ。隅々まで覗き込む勇気を。",
            3: "世界は一つではない。足元に隠された真実へ手を伸ばせ。"
        };
        return fallbacks[stage] || "今はまだ、何も語ることはない。";
    }
}
