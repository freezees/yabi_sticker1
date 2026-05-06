// system.js - 全域變數安全宣告與系統底層 (單一音樂管理員安全版)

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

// 戰鬥 Buff 變數
window.critRate = 5;       
window.extraCoinsBonus = 0;
window.hpBuffAmt = 0;
window.hintBuffAmt = 0;
window.dmgBonus = [0, 0, 0]; 
window.maxHints = 3;
// 這段通常在 system.js 中
function calcBuffs() {
    let rStickers = stickerDB.filter(s => s.rarity === 'R' && window.gachaData.collection.includes(s.id));
    
    // ★ 修改：從 5 改成 10，且刪除「滿星額外加1提示」的邏輯
    window.hintBuffAmt = Math.floor(rStickers.length / 10); 
    
    // ... 其他加成計算 (SSR, SR, N) ...
}

function getHeroMaxHP() { return (heroes[selectedHeroIdx]?.baseHp || 5) + (window.hpBuffAmt || 0); }
function getHeroMaxHints() { return (heroes[selectedHeroIdx]?.baseHints || 3) + (window.hintBuffAmt || 0); }

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

// ====================================================================
// ★ 音訊與語速管理系統 (單一音樂管理員版)
// ====================================================================

// ★ 修正 3：確保全域只有一個 lobbyBgm，絕對不會因為重複宣告而打架
if (!window.lobbyBgm) {
    window.lobbyBgm = new Audio('assets/music/lobby_bgm.mp3'); 
    window.lobbyBgm.loop = true;
}

window.audioSettings = JSON.parse(localStorage.getItem('dragonAudioSettings')) || {
    bgm: 0.5, sfx: 1.0, voice: 1.0, rate: 1.0
};

window.openSettings = function() {
    document.getElementById('settings-modal').style.display = 'flex';
    let b = document.getElementById('bgm-slider'); if(b) b.value = window.audioSettings.bgm * 100;
    let s = document.getElementById('sfx-slider'); if(s) s.value = window.audioSettings.sfx * 100;
    let v = document.getElementById('voice-slider'); if(v) v.value = window.audioSettings.voice * 100;
    let r = document.getElementById('rate-slider'); if(r) r.value = window.audioSettings.rate * 10;
    window.updateAudioSettingsUI();
};

window.toggleSettings = function(show) {
    if(show) window.openSettings();
    else { let m = document.getElementById('settings-modal'); if(m) m.style.display = 'none'; }
};

window.updateAudioSettings = function() {
    window.audioSettings.bgm = document.getElementById('bgm-slider').value / 100;
    window.audioSettings.sfx = document.getElementById('sfx-slider').value / 100;
    window.audioSettings.voice = document.getElementById('voice-slider').value / 100;
    window.audioSettings.rate = document.getElementById('rate-slider').value / 10;
    
    localStorage.setItem('dragonAudioSettings', JSON.stringify(window.audioSettings));
    window.updateAudioSettingsUI();
    window.applyAudioSettings();
};

window.updateAudioSettingsUI = function() {
    let bVal = document.getElementById('bgm-val'); if(bVal) bVal.innerText = Math.round(window.audioSettings.bgm * 100) + '%';
    let sVal = document.getElementById('sfx-val'); if(sVal) sVal.innerText = Math.round(window.audioSettings.sfx * 100) + '%';
    let vVal = document.getElementById('voice-val'); if(vVal) vVal.innerText = Math.round(window.audioSettings.voice * 100) + '%';
    let rVal = document.getElementById('rate-val');
    if(rVal) {
        let rText = "正常";
        if(window.audioSettings.rate < 1.0) rText = "偏慢 🐢";
        else if(window.audioSettings.rate > 1.0) rText = "偏快 🐇";
        rVal.innerText = `${rText} (${window.audioSettings.rate}x)`;
    }
};

window.applyAudioSettings = function() {
    let bgms = [
        document.getElementById('my-bgm'), 
        document.getElementById('win-bgm'), 
        document.getElementById('fail-bgm'),
        window.lobbyBgm
    ];
    // 安全過濾 null 並套用音量
    bgms.filter(Boolean).forEach(b => { b.volume = window.audioSettings.bgm; });

    const sfxIds = ['hero-atk-sfx', 'hero-atk2-sfx', 'hero-hurt-sfx', 'sfx-hit', 'sfx-hurt', 'sfx-meteor', 'sfx-magic-custom'];
    sfxIds.forEach(id => { let el = document.getElementById(id); if(el) el.volume = window.audioSettings.sfx; });
};

window.testVoiceSpeed = function() {
    try {
        let u = new SpeechSynthesisUtterance("Apple, Banana, Elephant.");
        u.lang = 'en-US'; 
        u.volume = (window.audioSettings && window.audioSettings.voice !== undefined) ? window.audioSettings.voice : 1.0; 
        u.rate = (window.audioSettings && window.audioSettings.rate) ? window.audioSettings.rate : 1.0;
        speechSynthesis.speak(u);
    } catch(e) {}
};

function speak(t, lang) { 
    try {
        if (!t) return;
        const u = new SpeechSynthesisUtterance(t); 
        u.lang = lang === 'zh' ? 'zh-TW' : 'en-US'; 
        
        let cleanText = t.replace(/[\s-]/g, ''); 
        if (cleanText.length === 1) {
            u.rate = 1.8; 
        } else {
            u.rate = (window.audioSettings && window.audioSettings.rate) ? window.audioSettings.rate : 1.0; 
        }
        
        u.volume = (window.audioSettings && window.audioSettings.voice !== undefined) ? window.audioSettings.voice : 1.0; 
        window.speechSynthesis.speak(u); 
    } catch(e) {
        console.error("語音播放發生小錯誤，但不影響遊戲：", e);
    }
}
function speakTargetWord() { if(typeof currentWord !== 'undefined' && currentWord) speak(currentWord, 'en'); }

// ====================================================================

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
        if(confirm("✨ 即遇到【滿星測試模式】！\n\n確定開啟嗎？")) {
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

function safeInitGame() {
    if(window.gameInitialized) return;
    window.gameInitialized = true;
    createLobbyUI(); checkUnlocks(); changeHeroSelection(0);
    let audioBtn = document.getElementById('global-audio-btn');
    if(audioBtn) audioBtn.onclick = speakTargetWord;
    
    setTimeout(window.applyAudioSettings, 500); 
}

document.addEventListener('DOMContentLoaded', safeInitGame);
if (document.readyState === 'complete' || document.readyState === 'interactive') { setTimeout(safeInitGame, 100); }


// ====================================================================
// ★ 大廳背景音樂系統 (安全互動解鎖版)
// ====================================================================

document.addEventListener('click', function unlockAudio(e) {
    if (e.target.id === 'central-start-btn' || e.target.closest('#central-start-btn')) {
        document.removeEventListener('click', unlockAudio);
        return;
    }
    
    let gameCont = document.getElementById('game-container');
    if (gameCont && gameCont.classList.contains('game-show')) {
        document.removeEventListener('click', unlockAudio);
        return;
    }

    if (window.lobbyBgm && window.lobbyBgm.paused) {
        window.lobbyBgm.volume = (window.audioSettings && window.audioSettings.bgm !== undefined) ? window.audioSettings.bgm : 0.5;
        window.lobbyBgm.play().catch(err => console.log("等待玩家互動解鎖音樂..."));
    }

    document.removeEventListener('click', unlockAudio);
});