// effects.js - 視覺特效與爆擊字體 (極簡精華版)
// 註：核心動畫 feedback 邏輯已全面移交給 combat.js 掌管

function playGachaSound(isSSR) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    let vol = window.audioSettings ? window.audioSettings.sfx : 0.3;
    if (vol <= 0) return; 
    
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3 * vol, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01 * vol, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

// 輔助函數：播放音效並自動套用設定音量
function playSfx(url, customVolumeMultiplier = 1.0) {
    let audio = new Audio(url);
    let baseVol = window.audioSettings ? window.audioSettings.sfx : 1.0;
    audio.volume = Math.max(0, Math.min(1, baseVol * customVolumeMultiplier));
    audio.play().catch(e => {});
    return audio; 
}

// 傷害顯示器：支援爆擊超大字體特效
function showDamage(isHero, dmgAmount, duration = 1000, isCrit = false) {
    if (dmgAmount <= 0) return;
    let dmg = document.createElement('div'); dmg.className = 'dmg-text'; dmg.innerText = `-${dmgAmount}`;
    dmg.style.bottom = '150px'; if (isHero) dmg.style.left = '20%'; else dmg.style.right = '20%';
    dmg.style.animationDuration = `${duration}ms`;

    dmg.style.position = 'absolute';
    dmg.style.color = '#ff6b6b';
    dmg.style.fontWeight = 'bold';
    dmg.style.fontSize = '40px';
    dmg.style.textShadow = '2px 2px 4px #000';
    dmg.style.pointerEvents = 'none';
    dmg.style.zIndex = '800';

    if (isCrit) {
        dmg.style.fontSize = '80px';
        dmg.style.color = '#ff9f43';
        dmg.style.textShadow = '0 0 20px #ee5253, 0 0 30px #ff9f43, 0 0 40px #fff';
        dmg.style.zIndex = '999';
        dmg.style.transform = 'scale(1.5)';
    }

    let bs = document.getElementById('battle-scene');
    if(bs) { bs.appendChild(dmg); setTimeout(() => dmg.remove(), duration); }
}

// 戰鬥訊息顯示器
function showBattleMsg(txt) { 
    const m = document.getElementById('battle-msg'); 
    if(m){ m.innerText = txt; m.style.opacity = 1; setTimeout(() => m.style.opacity = 0, 2000); } 
}

// 顯示治療特效（綠色 +1 / +2）
function showHealEffect(isHero, healAmount) {
    let heal = document.createElement('div');
    heal.className = 'heal-text';
    heal.innerText = `+${healAmount}❤️`;
    heal.style.position = 'absolute';
    heal.style.bottom = '150px';
    heal.style.left = isHero ? '20%' : '70%';
    heal.style.color = '#2ecc71';
    heal.style.fontSize = '40px';
    heal.style.fontWeight = 'bold';
    heal.style.textShadow = '2px 2px 4px #000';
    heal.style.pointerEvents = 'none';
    heal.style.zIndex = '800';
    
    let bs = document.getElementById('battle-scene');
    if (bs) {
        bs.appendChild(heal);
        setTimeout(() => heal.remove(), 1000);
    }
}