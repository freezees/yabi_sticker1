// system.js - 全域變數安全宣告與系統底層

window.gachaData = window.gachaData || { coins: 0, dust: 0, collection: [0, 1], wall: [null, null, null, null, null], stars: {0:0, 1:0} };
try { 
    let localData = JSON.parse(localStorage.getItem('gachaSystemV5'));
    if (localData && localData.collection) window.gachaData = localData;
} catch(e) {}

window.studyLog = window.studyLog || {};
try {
    let localLog = JSON.parse(localStorage.getItem('dragonGameLogV5'));
    if(localLog) window.studyLog = localLog;
} catch(e) {}

let enabledStickers;
try { enabledStickers = JSON.parse(localStorage.getItem('dragonGameEnabledStickers')); } catch(e) { enabledStickers = null; }
if (!Array.isArray(enabledStickers)) enabledStickers = [0, 1];

// ★ 戰鬥 Buff 變數 (安全全域綁定)
window.critRate = 5;       // 基礎爆擊率 5%
window.extraCoinsBonus = 0;
window.hpBuffAmt = 0;
window.hintBuffAmt = 0;
window.dmgBonus = [0, 0, 0]; 
window.maxHints = 3;

function calcBuffs() {
    let counts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };
    let star5Counts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };

    window.gachaData.collection.forEach(id => {
        if(!enabledStickers.includes(id)) return;
        let s = stickerDB.find(x => x.id === id);
        if(s) {
            counts[s.rarity]++;
            if((window.gachaData.stars[id] || 0) >= 5) star5Counts[s.rarity]++;
        }
    });

    // 🟪 紫色 (SR): 1張 +1% 爆擊，五星再 +1%
    window.critRate = 5 + (counts['SR'] * 1) + (star5Counts['SR'] * 1);
    if(window.critRate > 100) window.critRate = 100;

    // 🟨 金色 (R): 5張 +1 提示，五星再 +1
    window.hintBuffAmt = Math.floor(counts['R'] / 5) + (star5Counts['R'] * 1);
    window.maxHints = 3 + window.hintBuffAmt;

    // ⬜ 普通 (N): 10張 +1 代幣
    window.extraCoinsBonus = Math.floor(counts['N'] / 10);

    // 🌈 彩色 (SSR): 1張 +1 血量 (只儲存加成值，不設定 maxPHP)
    window.hpBuffAmt = counts['SSR'];
}

// 根據所選英雄計算實際戰鬥血量
function getHeroMaxHP() {
    const hero = heroes[selectedHeroIdx];
    const baseHp = (hero && hero.baseHp) ? hero.baseHp : 5;
    return baseHp + (window.hpBuffAmt || 0);
}
// 根據所選英雄計算實際提示次數
function getHeroMaxHints() {
    const hero = heroes[selectedHeroIdx];
    const baseHints = (hero && hero.baseHints) ? hero.baseHints : 3;
    return baseHints + (window.hintBuffAmt || 0);
}

function autoRepairDOM() {
    let container = document.getElementById('game-container'); if(!container) return;
    if(!document.getElementById('level-tag')) container.insertAdjacentHTML('afterbegin', `<div id="level-tag">第一關：魔法集氣</div>`);
    if(!document.getElementById('options-container')) { let opt = document.createElement('div'); opt.id = 'options-container'; opt.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; padding-bottom: 20px; margin-top: auto; z-index: 2;"; container.appendChild(opt); }
    if(!document.getElementById('spelling-container')) { let spell = document.createElement('div'); spell.id = 'spelling-container'; spell.style.cssText = "display: none; flex-direction: column; align-items: center; width: 100%; padding-bottom: 10px; margin-top: auto; z-index: 10;"; spell.innerHTML = '<div id="word-display"></div><div id="letters-grid"></div>'; container.appendChild(spell); }
    if(!document.getElementById('question-img')) {
        let qBox = document.getElementById('question-box');
        if(!qBox) { let qArea = document.getElementById('question-area'); if(!qArea) { qArea = document.createElement('div'); qArea.id = 'question-area'; container.insertBefore(qArea, document.getElementById('options-container')); } qBox = document.createElement('div'); qBox.id = 'question-box'; qArea.appendChild(qBox); }
        qBox.innerHTML = '<img id="question-img" style="max-width: 90%; max-height: 90%; object-fit: contain;">';
    }
}

function toggleSettings(show) { let m = document.getElementById('settings-modal'); if(m) m.style.display = show ? 'flex' : 'none'; }
function updateBgmVolume(val) { bgm.volume = val; winBgm.volume = val; failBgm.volume = val; let bv = document.getElementById('bgm-vol-val'); if(bv) bv.innerText = Math.round(val * 100) + "%"; }
function updateVoiceVolume(val) { voiceVolume = val; let vv = document.getElementById('voice-vol-val'); if(vv) vv.innerText = Math.round(val * 100) + "%"; }
function toggleMusic() { isMusicPlaying = !isMusicPlaying; isMusicPlaying ? bgm.play() : bgm.pause(); let ts = document.getElementById('bgm-toggle-settings'); if(ts) ts.innerText = isMusicPlaying ? "音樂：播放中" : "音樂：已暫停"; }

function speak(t, lang) { const u = new SpeechSynthesisUtterance(t); u.lang = lang === 'zh' ? 'zh-TW' : 'en-US'; u.rate = 1.0; u.volume = typeof voiceVolume !== 'undefined' ? voiceVolume : 1.0; window.speechSynthesis.speak(u); }
function speakTargetWord() { if(typeof currentWord !== 'undefined' && currentWord) speak(currentWord, 'en'); }

function verifyParent() {
    let divisor = Math.floor(Math.random() * 7) + 6; 
    let answer = Math.floor(Math.random() * 7) + 6;  
    let dividend = divisor * answer; 
    let ans = prompt(`🛡️ 家長驗證\n請輸入 ${dividend} ÷ ${divisor} 的答案：`);
    if (ans === answer.toString()) return true;
    if (ans !== null && ans.trim() !== "") alert("❌ 答錯囉！請找爸爸媽媽來幫忙解鎖。");
    return false;
}

function unlockParentMode() {
    if(verifyParent()) {
        document.getElementById('parent-locked-btn').style.display = 'none';
        document.getElementById('parent-unlocked-zone').style.display = 'flex';
    }
}

function parentAction(action) {
    if (action === 'reset') {
        if(confirm("確定要【清除所有遊戲紀錄與單字進度】嗎？\n(注意：此動作將無法復原！)")) {
            localStorage.removeItem('gachaSystemV5');
            localStorage.removeItem('dragonGameLogV5');
            localStorage.removeItem('gachaBackupV5');
            let defaultData = { coins: 0, dust: 0, collection: [0, 1], wall: [null, null, null, null, null], stars: {0:0, 1:0} };
            localStorage.setItem('gachaSystemV5', JSON.stringify(defaultData));
            alert("✅ 紀錄已全部清除 (為您保留了基礎英雄)。");
            location.reload();
        }
    } else if (action === 'cheat') {
        if(confirm("✨ 即將進入【滿星測試模式】！\n\n確定開啟嗎？")) {
            let currentData = localStorage.getItem('gachaSystemV5');
            if(currentData) {
                let backupObj = { data: currentData, date: new Date().toLocaleString('zh-TW') };
                localStorage.setItem('gachaBackupV5', JSON.stringify(backupObj));
            }
            let fullStars = {}; let fullCollection = [];
            stickerDB.forEach(s => { fullCollection.push(s.id); fullStars[s.id] = 5; });
            let cheatData = { coins: 99999, dust: 9999, collection: fullCollection, wall: [null, null, null, null, null], stars: fullStars };
            localStorage.setItem('gachaSystemV5', JSON.stringify(cheatData));
            alert("✨ 測試模式已開啟！全圖鑑皆為滿星。");
            location.reload();
        }
    } else if (action === 'restore') {
        let backupRaw = localStorage.getItem('gachaBackupV5');
        if (backupRaw) {
            try {
                let backupObj = JSON.parse(backupRaw);
                let restoreData = backupObj.data ? backupObj.data : backupRaw;
                let dateStr = backupObj.date ? `\n存檔時間：${backupObj.date}` : "";
                if(confirm(`⏪ 找到備份存檔！${dateStr}\n\n確定要還原小朋友原本的遊戲進度嗎？`)) {
                    localStorage.setItem('gachaSystemV5', restoreData);
                    alert("✅ 已成功還原原進度！");
                    location.reload();
                }
            } catch(e) {
                if(confirm("⏪ 找到備份存檔！\n\n確定要還原嗎？")) {
                    localStorage.setItem('gachaSystemV5', backupRaw);
                    alert("✅ 已成功還原！");
                    location.reload();
                }
            }
        } else alert("❌ 找不到備份進度！");
    }
}

function ensureSettingsModal() {
    let modal = document.getElementById('settings-modal');
    if(modal) modal.remove(); 
    document.body.insertAdjacentHTML('beforeend', `
    <div id="settings-modal" class="modal-overlay" style="display:none; z-index:9000;">
        <div class="modal-content" style="text-align:center;">
            <button class="close-btn" onclick="toggleSettings(false)">X</button>
            <h2 style="color:#8e44ad; font-size:28px; margin-bottom:15px;">⚙️ 冒險設定</h2>
            
            <div style="margin:20px 0; font-weight:bold; color:#f06292;">
                <label>🎵 背景音樂 (BGM) <span id="bgm-vol-val">10%</span></label><br>
                <input type="range" id="bgm-vol" min="0" max="1" step="0.1" value="0.1" onchange="updateBgmVolume(this.value)" style="width:80%; margin-top:10px;">
            </div>
            <div style="margin:20px 0; font-weight:bold; color:#f06292;">
                <label>🔊 英文發音 (Voice) <span id="voice-vol-val">100%</span></label><br>
                <input type="range" id="voice-vol" min="0" max="1" step="0.1" value="1.0" onchange="updateVoiceVolume(this.value)" style="width:80%; margin-top:10px;">
            </div>
            
            <button id="bgm-toggle-settings" class="option-btn" style="width:100%; margin-bottom:20px; box-shadow:0 4px 0 #d1c4e9;" onclick="toggleMusic()">音樂：已暫停</button>
            
            <div style="background:#f0f3f4; padding:15px; border-radius:15px; margin-bottom:20px; border:2px dashed #bdc3c7;">
                <div style="font-size:18px; color:#2c3e50; font-weight:bold; margin-bottom:10px;">🛡️ 家長管理專區</div>
                <button id="parent-locked-btn" class="option-btn" style="background:#bdc3c7; color:#2c3e50; border:none; width:100%; box-shadow:0 4px 0 #95a5a6;" onclick="unlockParentMode()">🔒 點擊解鎖</button>
                <div id="parent-unlocked-zone" style="display:none; flex-direction:column; gap:10px;">
                    <button class="option-btn" style="background:#f39c12; color:white; border:none; width:100%; box-shadow:0 4px 0 #d35400;" onclick="parentAction('cheat')">✨ 開啟滿星測試</button>
                    <button class="option-btn" style="background:#2ecc71; color:white; border:none; width:100%; box-shadow:0 4px 0 #27ae60;" onclick="parentAction('restore')">⏪ 還原進度</button>
                    <button class="option-btn" style="background:#e74c3c; color:white; border:none; width:100%; box-shadow:0 4px 0 #c0392b;" onclick="parentAction('reset')">🗑️ 清除紀錄</button>
                </div>
            </div>

            <button class="big-btn" style="width:100%; margin-top:15px; font-size:22px; background:linear-gradient(180deg, #ff9a9e, #fecfef); color:#d63031; border:4px solid white;" onclick="quitToMain()">🚪 放棄並回首頁</button>
            <button class="big-btn" style="width:100%; margin-top:15px; font-size:22px; background:linear-gradient(180deg, #ffd700, #ff8c00); border:4px solid white;" onclick="toggleSettings(false); openLobby();">📔 前往大廳</button>
        </div>
        </div>
    </div>`);
}

function safeInitGame() {
    if(window.gameInitialized) return;
    window.gameInitialized = true;
    ensureSettingsModal(); createLobbyUI(); checkUnlocks(); changeHeroSelection(0);
    let audioBtn = document.getElementById('global-audio-btn');
    if(audioBtn) audioBtn.onclick = speakTargetWord;
}
document.addEventListener('DOMContentLoaded', safeInitGame);
if (document.readyState === 'complete' || document.readyState === 'interactive') { setTimeout(safeInitGame, 100); }

