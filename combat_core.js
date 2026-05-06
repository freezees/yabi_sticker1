// combat_core.js - 戰鬥核心系統 (與英雄邏輯完全解耦)

// 自動生成與更新寵物
window.updateCombatPet = function(heroImgElem, heroData) {
    if (!heroImgElem || !heroData) return;
    let combatPet = document.getElementById('combat-pet-img');
    if (!combatPet) {
        combatPet = document.createElement('img');
        combatPet.id = 'combat-pet-img';
        combatPet.style.position = 'absolute';
        combatPet.style.bottom = '10px';
        combatPet.style.left = '-35px';
        combatPet.style.width = '80px';
        combatPet.style.pointerEvents = 'none';
        if (window.getComputedStyle(heroImgElem.parentElement).position === 'static') {
            heroImgElem.parentElement.style.position = 'relative';
        }
        heroImgElem.parentElement.appendChild(combatPet);
    }
    
    if(window.petReturnTimer) clearTimeout(window.petReturnTimer);
    combatPet.style.animation = 'breatheAnim 2s infinite';
    combatPet.style.transform = '';
    combatPet.style.transition = '';
    combatPet.style.zIndex = '1';
    heroImgElem.style.position = 'relative';
    heroImgElem.style.zIndex = '2';

    let stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
    let isTestMode = (window.gachaData && window.gachaData.coins >= 99999);
    let effectiveStars = isTestMode ? 5 : stars; 

    let petSrc = heroData.petImg ? heroData.petImg : `${heroData.folder}/pet.png`;

    if (effectiveStars >= 5) {
        combatPet.src = petSrc;
        combatPet.style.display = 'block';
    } else {
        combatPet.style.display = 'none';
    }
};

if (typeof heroes !== 'undefined') {
    heroes.forEach(hero => { if (!hero.id) hero.id = hero.folder; });
}

window.hasUsedUlt = false; 
window.pendingIsCrit = false; 
window.pendingDamageForFeedback = 0; 
window.hasLoggedMistake = false;
window.dragonRage = 0; 

const battleBgmList = ['assets/music/bgm.mp3', 'assets/music/bgm2.mp3', 'assets/music/bgm3.mp3', 'assets/music/bgm4.mp3', 'assets/music/bgm5.mp3'];
let currentBattleBgmIdx = -1;

function playRandomBattleBgm() {
    let pool = battleBgmList.map((_, i) => i).filter(i => i !== currentBattleBgmIdx);
    currentBattleBgmIdx = pool[Math.floor(Math.random() * pool.length)];
    const newSrc = battleBgmList[currentBattleBgmIdx];
    bgm.pause(); bgm.src = newSrc; bgm.currentTime = 0;
    bgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
    bgm.play().then(() => isMusicPlaying = true).catch(e => null);
}

// ========== 遊戲流程控制 ==========
function startGame() {
    if (typeof audioCtx !== 'undefined' && audioCtx.state === 'suspended') audioCtx.resume();
    isWait = false;
    
    try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
    if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];
    if (typeof buildCurrentWordList === 'function') buildCurrentWordList();

    if(typeof calcBuffs === 'function') calcBuffs();
    pHP = typeof getHeroMaxHP === 'function' ? getHeroMaxHP() : 5;
    hintsLeft = typeof getHeroMaxHints === 'function' ? getHeroMaxHints() : 3;
    currentLvl = 1;
    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 5;
    window.hasUsedUlt = false;
    
    const heroData = heroes[selectedHeroIdx];
    const currentHeroModule = window.HeroRegistry ? window.HeroRegistry[heroData.id] : null;
    if (currentHeroModule && currentHeroModule.onBattleStart) {
        currentHeroModule.onBattleStart(heroData);
    }
    
    let startScreen = document.getElementById('start-screen'); if(startScreen) startScreen.style.opacity = '0';
    let gameCont = document.getElementById('game-container'); if(gameCont) gameCont.classList.add('game-show');
    if(window.applyAudioSettings) window.applyAudioSettings();
    
    // ★ 關鍵修復：正確暫停大廳音樂
    if (window.lobbyBgm && !window.lobbyBgm.paused) {
        window.lobbyBgm.pause();
    }

    if (typeof playRandomBattleBgm === 'function') playRandomBattleBgm();
    if(typeof initRageMeter === 'function') initRageMeter(); 
    
    setTimeout(() => { 
        if (typeof updateHP === 'function') updateHP(); 
        if (typeof nextTask === 'function') nextTask(); 
        if(startScreen) startScreen.style.display = 'none'; 
    }, 1000);
}

// ========== 血量與死亡判定 ==========
// ========== 血量與死亡判定 ==========
function updateHP() {
    let pHPText = document.getElementById('prince-hp'); 
    let dHPText = document.getElementById('dragon-hp');
    if(pHPText) pHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, pHP)}`;
    if(dHPText) dHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, dHP)}`;
    
    if(dHP <= 0 && currentLvl === 3) document.getElementById('dragon-img').style.width = "220px";
    
    if (pHP > 0) {
        window.isGameOverTriggered = false;
    } 
    else if(pHP <= 0 && !window.isGameOverTriggered) {
        window.isGameOverTriggered = true; 
        isWait = true;
        
        // 立刻停止一般戰鬥音樂
        if(typeof bgm !== 'undefined') bgm.pause();
        
        // 延遲 600 毫秒，讓「龍的攻擊動畫」跟「英雄受傷動畫」播完，再換成 dead.png
        setTimeout(() => {
            if(typeof failBgm !== 'undefined') failBgm.play().catch(e => {});
            
            let heroImg = document.getElementById('hero-img'); 
            if(heroImg) heroImg.src = `${heroes[selectedHeroIdx].folder}/dead.png`;
            
            let combatPet = document.getElementById('combat-pet-img');
            if (combatPet) combatPet.style.display = 'none';
            let alertIcon = document.getElementById('pet-alert-icon');
            if (alertIcon) alertIcon.style.display = 'none';
        }, 600);

        // 延遲 3 秒才跳結算畫面，讓玩家有時間看清楚英雄死掉的樣子
        setTimeout(() => {
            if (currentLvl === 3) {
                // 第三關死亡，獲得保底寶箱
                if(typeof triggerVictory === 'function') triggerVictory(1, true);
            } else {
                // 第一、二關死亡，Game Over
                let goScreen = document.getElementById('game-over-screen');
                if(goScreen) goScreen.style.display = 'flex';
                let tp = document.getElementById('test-panel');
                if(tp) tp.style.display = 'none';
            }
        }, 3000);
    }
}

// ========== 戰鬥判定核心 ==========
function checkChoice(isCorrect, selectedWord = null) {
    const heroData = heroes[selectedHeroIdx];
    const currentHeroModule = window.HeroRegistry ? window.HeroRegistry[heroData.id] : null;

    if (isCorrect) {
        isWait = true; 
        let skillIdx = 0;
        
        if (currentLvl === 3) {
            window.dragonRage = Math.max(0, window.dragonRage - 1);
            if(typeof updateRageMeterUI === 'function') updateRageMeterUI();
            if (typeof showBattleMsg === 'function') showBattleMsg("✨ 答對了！樂高龍的怒氣下降了！");
        }

        if(currentLvl >= 2) {
            const rnd = Math.random(), len = currentWord.replace(/[\s-]/g, '').length;
            if(len <= 5) { if(rnd < 0.7) skillIdx = 0; else if(rnd < 0.9) skillIdx = 1; else skillIdx = 2; }
            else if(len <= 8) { if(rnd < 0.5) skillIdx = 0; else if(rnd < 0.8) skillIdx = 1; else skillIdx = 2; }
            else { if(rnd < 0.1) skillIdx = 0; else if(rnd < 0.3) skillIdx = 1; else skillIdx = 2; }
        }
        
        let dmg = heroData.baseDmg[skillIdx] || 1;
        let currentCrit = window.critRate || 5;
        window.pendingIsCrit = (Math.random() * 100) < currentCrit;
        if(window.pendingIsCrit) dmg *= 2;

        dHP -= dmg;
        window.pendingDamageForFeedback = dmg;

        if (selectedHeroIdx === 2) {
            if (skillIdx === 1) {
                let beforeHP = pHP;
                pHP = Math.min(typeof getHeroMaxHP === 'function' ? getHeroMaxHP() : 5, pHP + 1);
                if (beforeHP < pHP) {
                    if (typeof showBattleMsg === 'function') showBattleMsg("🧜‍♀️ 治癒之浪！回復 1 點生命！");
                    try { playSfx(`${heroData.folder}/heal.mp3`, 0.7); } catch(e){}
                    if(typeof showHealEffect === 'function') showHealEffect(true, 1);
                    updateHP();
                }
            } else if (skillIdx === 2) {
                let beforeHP = pHP;
                pHP = Math.min(typeof getHeroMaxHP === 'function' ? getHeroMaxHP() : 5, pHP + 2);
                if (beforeHP < pHP) {
                    if (typeof showBattleMsg === 'function') showBattleMsg("🌊 海神之怒：深淵十連爆！");
                    try { playSfx(`${heroData.folder}/heal.mp3`, 0.7); } catch(e){}
                    if(typeof showHealEffect === 'function') showHealEffect(true, 2);
                    updateHP();
                }
            }
        }

        window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0};
        if (!window.hasLoggedMistake) window.studyLog[currentWord].success++;
        localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
        
        if(window.pendingIsCrit && typeof showBattleMsg === 'function') showBattleMsg("🔥 爆擊！雙倍傷害！");
        else if (typeof showBattleMsg === 'function') showBattleMsg(`${heroData.name}：${heroData.skills[skillIdx]}！`);
        
        if(typeof speak === 'function') speak(currentWord, 'en');
        if(typeof feedback === 'function') feedback(true, skillIdx);
        
        if (currentHeroModule && currentHeroModule.playAttackAnimation) {
            currentHeroModule.playAttackAnimation(skillIdx, dmg, window.pendingIsCrit, currentLvl);
        }
        
        setTimeout(() => {
            if(dHP <= 0) {
                if(currentLvl === 1) {
                    currentLvl = 2; dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 10; nextTask(); updateHP();
                } else if(currentLvl === 2) {
                    if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ 終極積木魔王降臨！進入第三關！");
                    setTimeout(() => { currentLvl = 3; dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 20 : 15; nextTask(); updateHP(); }, 2000);
                } else {
                    if(typeof triggerVictory === 'function') triggerVictory(2, false);
                }
            } else nextTask();
        }, skillIdx === 2 ? 4500 : 2500);

    } else {
        window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0};
        if (!window.hasLoggedMistake) {
            window.studyLog[currentWord].fail++;
            window.hasLoggedMistake = true;
        }
        localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
        
        if (currentLvl === 3) {
            window.dragonRage++;
            if(typeof updateRageMeterUI === 'function') updateRageMeterUI();
            if (window.dragonRage >= 3) {
                if(typeof performLegoStormUlt === 'function') performLegoStormUlt();
                return;
            }
        }

        isWait = true;

        let isBlocked = false;
        if (currentHeroModule && currentHeroModule.onPetBlock) {
            isBlocked = currentHeroModule.onPetBlock(currentLvl);
        }

        if (isBlocked) {
            if (currentLvl === 1 && selectedWord && typeof speak === 'function') speak(selectedWord, 'en');
            setTimeout(() => { if(pHP > 0) isWait = false; }, 1500);
            return;
        }

        if (currentHeroModule && currentHeroModule.onDamagedPassive) {
            currentHeroModule.onDamagedPassive();
        }

        pHP -= (currentLvl === 2 ? 2 : 1);
        
        if(typeof feedback === 'function') feedback(false);
        if (currentLvl === 1 && selectedWord && typeof speak === 'function') speak(selectedWord, 'en');

        // ==========================================
        // 🌟 新增：讓第一關魔龍播放攻擊動畫與音效！
        // ==========================================
        let d = document.getElementById('dragon-img');
        let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
        if (d) {
            d.src = `${dFolder}/atk.png`;
            try { playSfx(`${dFolder}/atk.mp3`); } catch(e){}
            d.classList.add('dragon-atk');
            
            // 1.2 秒後讓龍恢復原狀
            setTimeout(() => {
                d.classList.remove('dragon-atk');
                if (dHP > 0) d.src = `${dFolder}/dragon.png`;
            }, 1200);
        }
        // ==========================================

        if (currentHeroModule && currentHeroModule.playHurtAnimation) {
            currentHeroModule.playHurtAnimation(currentLvl);
        }

        setTimeout(() => { if (pHP > 0) isWait = false; }, 1200);
    }
}
// ========== 補回遺失的 UI 與寵物特效動畫 ==========
(function injectCombatDynamicStyles() {
    if (document.getElementById('combat-dynamic-styles')) return;
    const style = document.createElement('style');
    style.id = 'combat-dynamic-styles';
    style.innerHTML = `
        @keyframes wrongLetterShake { 
            0%, 100% { transform: translateX(0); } 
            25% { transform: translateX(-5px) rotate(-5deg); background-color: #ff4757; color: white; border-color: #ff4757; } 
            75% { transform: translateX(5px) rotate(5deg); background-color: #ff4757; color: white; border-color: #ff4757; } 
        }
        @keyframes redLightPulse { 
            0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); background-color: #ff4757; color: white; border-color: #ff4757; } 
            70% { box-shadow: 0 0 0 15px rgba(255, 71, 87, 0); background-color: #ff6b81; color: white; border-color: #ff6b81; } 
            100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); background-color: #ff4757; color: white; border-color: #ff4757; } 
        }
        @keyframes petBounceInPlace { 
            0%, 100% { transform: translateY(0) scale(1); } 
            50% { transform: translateY(-20px) scale(1.1); filter: drop-shadow(0 0 10px #ffdf00); } 
        }
        @keyframes bounceIn { 
            0% { transform: scale(0.3); opacity: 0; } 
            50% { transform: scale(1.2); opacity: 1; } 
            70% { transform: scale(0.9); } 
            100% { transform: scale(1); } 
        }
        @keyframes superShakeChest { 
            0%, 100% { transform: translate(0, 0) rotate(0deg); } 
            25% { transform: translate(-5px, 5px) rotate(-5deg); } 
            50% { transform: translate(5px, -5px) rotate(5deg); } 
            75% { transform: translate(-5px, -5px) rotate(-5deg); } 
        }
    `;
    document.head.appendChild(style);
})();

// ========== 5. 離開遊戲返回大廳 ==========
// ========== 5. 離開遊戲返回大廳 ==========
window.quitToMain = function() {
    // 1. 重置戰鬥狀態鎖
    isWait = false;
    window.isGameOverTriggered = false;
    
    // 2. 停止所有戰鬥音樂與音效
    if (typeof bgm !== 'undefined') bgm.pause();
    if (typeof failBgm !== 'undefined') { failBgm.pause(); failBgm.currentTime = 0; }
    if (typeof winBgm !== 'undefined') { winBgm.pause(); winBgm.currentTime = 0; }
    
    // 3. 恢復大廳音樂 (如果有的話)
    if (window.GameAudio && window.GameAudio.lobby) {
        window.GameAudio.lobby.play().catch(e => {});
    }
    
    // 4. 隱藏所有戰鬥相關的介面與【設定視窗】
    const gameCont = document.getElementById('game-container');
    if (gameCont) gameCont.classList.remove('game-show');
    
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.style.display = 'none';
    
    const vsScreen = document.getElementById('victory-screen');
    if (vsScreen) vsScreen.style.display = 'none';
    
    const tp = document.getElementById('test-panel');
    if (tp) tp.style.display = 'none';

    // ★ 關鍵修復：把設定視窗也關起來！
    const settingsModal = document.getElementById('settings-modal'); 
    if (settingsModal) settingsModal.style.display = 'none';
    const settingsPanel = document.getElementById('settings-panel'); 
    if (settingsPanel) settingsPanel.style.display = 'none';
    
    // 5. 重新顯示大廳 (首頁)
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
        startScreen.style.display = 'flex'; 
        setTimeout(() => { startScreen.style.opacity = '1'; }, 50); 
    }
};