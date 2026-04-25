// combat.js - 戰鬥迴圈、防卡死、第三關積木暴風與重構進化版

// 移除原有的 CSS 注入，改由 style.css 統一管理

window.hasUsedUlt = false; 
window.pendingIsCrit = false; 
window.pendingDamageForFeedback = 0; 
window.petReturnTimer = null;
window.hasLoggedMistake = false;
window.dragonRage = 0; 

const battleBgmList = ['assets/music/bgm.mp3', 'assets/music/bgm2.mp3', 'assets/music/bgm3.mp3', 'assets/music/bgm4.mp3', 'assets/music/bgm5.mp3'];
let currentBattleBgmIdx = -1;

function playRandomBattleBgm() {
    let pool = battleBgmList.map((_, i) => i).filter(i => i !== currentBattleBgmIdx);
    currentBattleBgmIdx = pool[Math.floor(Math.random() * pool.length)];
    const newSrc = battleBgmList[currentBattleBgmIdx];
    bgm.pause();
    bgm.src = newSrc;
    bgm.currentTime = 0;
    bgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
    bgm.play().then(() => isMusicPlaying = true).catch(e => null);
}

// ========== 戰鬥共用輔助函數 ==========
// 將原本提示與米拉技能重複的發光邏輯抽離
function highlightNextLetter(correctChar, duration = 3000) {
    const btns = document.querySelectorAll('.letter-btn:not(.letter-correct)');
    for (let btn of btns) {
        if (btn.innerText.toLowerCase() === correctChar) {
            btn.style.animation = "redLightPulse 1.5s infinite";
            btn.style.borderColor = "#ff4757";
            btn.style.background = "#ffcccc";
            
            setTimeout(() => {
                if (!btn.classList.contains('letter-correct')) {
                    btn.style.animation = "";
                    btn.style.borderColor = "#ffb6c1";
                    btn.style.background = "white";
                    btn.style.color = "";
                }
            }, duration);
            break;
        }
    }
}

// ========== 憤怒氣條管理 ==========
function initRageMeter() {
    let meterCont = document.getElementById('dragon-rage-container');
    if (!meterCont) {
        meterCont = document.createElement('div');
        meterCont.id = 'dragon-rage-container';
        meterCont.style.cssText = 'position:absolute; top:65px; right:60px; width:150px; height:12px; background:rgba(0,0,0,0.5); border:2px solid #fff; border-radius:10px; overflow:hidden; display:none; z-index:100; box-shadow:0 2px 4px rgba(0,0,0,0.3);';
        
        let fill = document.createElement('div');
        fill.id = 'dragon-rage-fill';
        fill.style.cssText = 'width:0%; height:100%; background:#8e44ad; transition:width 0.3s ease, background-color 0.3s ease;';
        meterCont.appendChild(fill);
        
        let gameCont = document.getElementById('game-container');
        if (gameCont) gameCont.appendChild(meterCont);
    }
    window.dragonRage = 0;
    updateRageMeterUI();
}
// ========== 補上這個缺失的更新氣條函數 ==========
function updateRageMeterUI() {
    let meterCont = document.getElementById('dragon-rage-container');
    let fill = document.getElementById('dragon-rage-fill');
    
    // 如果畫面還沒準備好，就先不要做事
    if (!meterCont || !fill) return;

    // 只有第三關才顯示憤怒氣條
    if (currentLvl === 3) {
        meterCont.style.display = 'block';
        
        // 滿氣是 3 格，計算百分比 (0%, 33.3%, 66.6%, 100%)
        let percentage = (window.dragonRage / 3) * 100;
        fill.style.width = percentage + '%';
        
        // 根據怒氣值改變顏色，越來越生氣！
        if (window.dragonRage === 0) {
            fill.style.backgroundColor = '#2ecc71'; // 綠色 (安全)
        } else if (window.dragonRage === 1) {
            fill.style.backgroundColor = '#f1c40f'; // 黃色 (警告)
        } else if (window.dragonRage === 2) {
            fill.style.backgroundColor = '#e67e22'; // 橘色 (危險)
        } else {
            fill.style.backgroundColor = '#ff4757'; // 紅色 (要放絕招了！)
        }
    } else {
        // 不是第三關就隱藏
        meterCont.style.display = 'none';
    }
}


function performLegoStormUlt() {
    const d = document.getElementById('dragon-img');
    const battleScene = document.getElementById('battle-scene');
    const meterCont = document.getElementById('dragon-rage-container');
    
    if (!d || !battleScene) return;

    isWait = true; // 鎖定畫面
    let dFolder = 'dragon3';
    
    // 設定你調好的嘴巴座標 (配合 CSS 基準)
    let mouthStartX = 40; 
    let mouthStartY = 20;   

    // ==========================================
    // 💀 階段一：死亡警告 (2秒 - 閃爍 + 跳腳)
    // ==========================================
    if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ ⚠️ ⚠️ 樂高龍暴怒了！警告！⚠️ ⚠️ ⚠️");
    
    if (meterCont) meterCont.style.animation = "rageBlink 0.3s infinite";
    
    // 換上跳腳生氣的圖 (angry_stomp.png)
    d.src = `${dFolder}/angry_stomp.png`; 
    d.classList.add('dragon-stomp-anim');
    
    // 播放生氣跳腳音效
    try { playSfx(`${dFolder}/angry.mp3`, 1.0); } catch(e){} 

    // ==========================================
    // 🔮 階段二：蹲下集氣 (2秒 - 集氣球特效)
    // ==========================================
    setTimeout(() => {
        if (pHP <= 0) return; // 防呆：如果龍死掉就停止
        
        // 1. 換上「蹲下來張大嘴巴準備噴射」的圖片 (💡 沿用 ult_atk.png 或你有專門蹲下的圖可換)
        d.classList.remove('dragon-stomp-anim');
        d.src = `${dFolder}/ult_atk.png`; 
        
        // 稍微把龍往下移一點，模擬「蹲下」的姿勢，並準備放大壓迫感
        d.style.transform = "scale(1.1) translateY(20px) translateX(-10px)";
        d.style.transition = "transform 0.5s ease-out";

        if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ 核心能量集束中... 快閃啊！");

        // 2. ★ 新增：產生集氣光球 DOM 元素
        let chargeBall = document.createElement('img');
        // 💡 記得把你準備好的光球圖片命名為 charge_ball.png，並放在 dragon3 資料夾裡！
        chargeBall.src = `${dFolder}/charge_ball.png`; 
        chargeBall.className = 'lego-charge-ball'; // 套用 CSS 動畫
        chargeBall.style.zIndex = "999";
        // 防破圖，破圖就移除
        chargeBall.onerror = function() { this.remove(); }; 
        battleScene.appendChild(chargeBall);
        
        // 播放集氣音效 (💡 建議找一個有「嗶一一一」上升頻率的音效，命名為 charge.mp3)
        try { playSfx(`${dFolder}/charge.mp3`, 0.8); } catch(e){} 

        // 自動在 2 秒集氣結束後移除光球 DOM
        setTimeout(() => { if(chargeBall) chargeBall.remove(); }, 2000);

        // ==========================================
        // 🌪️ 階段三：正式噴射 (光球縮小後瞬間發動)
        // ==========================================
        setTimeout(() => {
            if (pHP <= 0) return; 

            // 氣條歸零
            if (meterCont) meterCont.style.animation = "";
            window.dragonRage = 0; 
            updateRageMeterUI();

            // 猛烈震動，放大到極致 (1.4倍)
            d.classList.add('severe-shake'); 
            d.style.transform = "scale(1.4) translateX(-20px)";
            d.style.transition = "transform 0.1s ease-out"; // 瞬間彈出

            // 發射大招的音效
            try { playSfx(`${dFolder}/atk.mp3`, 1.0); } catch(e){}

            const legoImgs = ['dragon3/lego1.png', 'dragon3/lego2.png', 'dragon3/lego3.png'];
            let totalLegos = 60, currentLegoCount = 0;

            let stormInterval = setInterval(() => {
                if (currentLegoCount >= totalLegos || pHP <= 0) {
                    clearInterval(stormInterval);
                    try { playSfx(`${dFolder}/explosion.mp3`, 0.8); } catch(e){}
                    battleScene.classList.add('severe-shake'); 
                    
                    setTimeout(() => {
                        battleScene.classList.remove('severe-shake');
                        if (dHP > 0 && currentLvl === 3) {
                            d.src = `${dFolder}/dragon.png`;
                            d.style.transform = ""; // 恢復原本大小姿勢
                        }
                        d.classList.remove('severe-shake');
                        pHP -= 3; // 扣血
                        feedback(false, 0, true); 
                        if (pHP > 0) { isWait = false; } 
                        else {
                            // 死亡處理 (略過，同前版)
                            setTimeout(() => {
                                let wd = document.getElementById('word-display');
                                if(wd) { wd.innerText = currentWord.toLowerCase(); wd.style.color = '#ff4757'; wd.style.fontSize = '36px'; wd.style.fontWeight = 'bold'; wd.style.textShadow = '0 0 10px #ff4757'; }
                                if (typeof showBattleMsg === 'function') showBattleMsg(`正確答案是：${currentWord.toLowerCase()}`);
                                triggerVictory(1, true); 
                            }, 1500); 
                        }
                    }, 800);
                    return;
                }

                // 產生積木 (座標套用 mouthStartX/Y)
                let lego = document.createElement('img');
                lego.src = legoImgs[Math.floor(Math.random() * legoImgs.length)];
                let size = 15 + Math.random() * 45; 
                let burstX = mouthStartX + (Math.random() * 20 - 10); 
                let burstY = mouthStartY + (Math.random() * 20 - 10);
                let burstR = Math.random() * 360;
                let targetX = -1200 - Math.random() * 500; 
                let targetY = -400 + (Math.random() * 900); 
                let duration = 0.4 + Math.random() * 0.3; 

                lego.style.cssText = `
                    position: absolute; top: 150px; right: 200px; width: ${size}px; height: auto;
                    z-index: 200; pointer-events: none;
                    --burstX: ${burstX}px; --burstY: ${burstY}px; --burstR: ${burstR}deg;
                    --ldx: ${targetX}px; --ldy: ${targetY}px; --ls: ${0.6 + Math.random() * 1.0};
                    animation: legoRadialShoot ${duration}s ease-in forwards;
                `;
                battleScene.appendChild(lego);
                if(currentLegoCount % 6 === 0) try { playSfx(`${dFolder}/shoot.mp3`, 0.4); } catch(e){}
                setTimeout(() => lego.remove(), duration * 1000);
                currentLegoCount++;
            }, 15); 
        }, 2000); // 集氣時間：2 秒

    }, 2000); // 警告跳腳時間：2 秒
}

// ========== 寵物系統 ==========
function updateCombatPet(heroImgElem, heroData) {
    if (!heroImgElem) return;
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

    let alertIcon = document.getElementById('pet-alert-icon');
    if (alertIcon) alertIcon.style.display = 'none';
    
    let stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
    if (stars >= 5 && heroData.petImg) {
        combatPet.src = heroData.petImg;
        combatPet.style.display = 'block';
    } else {
        combatPet.style.display = 'none';
    }
}

function tryTriggerHero1PetBlock() {
    let stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
    if (selectedHeroIdx !== 0 || stars < 5) return false;
    if (Math.random() > 0.50) return false;

    let combatPet = document.getElementById('combat-pet-img');
    let dragonImg = document.getElementById('dragon-img');
    let heroImg = document.getElementById('hero-img');
    let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');

    if (combatPet && combatPet.style.display !== 'none') {
        if(window.petReturnTimer) clearTimeout(window.petReturnTimer);

        try {
            let blockAudio = new Audio(`${heroes[selectedHeroIdx].folder}/block.mp3`);
            blockAudio.volume = window.audioSettings ? window.audioSettings.sfx : 0.8; 
            blockAudio.play().catch(e => {});
            let dragonAudio = new Audio(`${dFolder}/atk.mp3`);
            dragonAudio.volume = window.audioSettings ? window.audioSettings.sfx : 0.8; 
            dragonAudio.play().catch(e => {});
        } catch(e) {}

        let originalSrc = heroes[selectedHeroIdx].petImg;
        combatPet.src = `${heroes[selectedHeroIdx].folder}/pet_action.png`;
        combatPet.onerror = function() { this.src = originalSrc; }; 

        combatPet.style.animation = 'none';
        combatPet.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        combatPet.style.transform = 'translateX(120px) scale(2.2) translateY(-10px)'; 
        combatPet.style.zIndex = '9999'; 
        if (heroImg) heroImg.style.zIndex = '0'; 

        if(dragonImg) {
            dragonImg.onerror = function() { 
                this.src = `${dFolder}/dragon.png`; 
                this.onerror = function() { this.src = `${dFolder}/Dragon.png`; };
            };
            dragonImg.src = `${dFolder}/atk.png`; 
            dragonImg.style.animation = 'none';
            dragonImg.offsetHeight; 
            dragonImg.style.animation = 'dragonBlockedAtk 1.5s ease-in-out forwards';
        }

        if (typeof showBattleMsg === 'function') showBattleMsg(`✨ 飛馬發動保護！完美抵擋魔龍的攻擊！`);

        window.petReturnTimer = setTimeout(() => {
            if(dragonImg) {
                dragonImg.src = `${dFolder}/dragon.png`;
                dragonImg.style.animation = ''; 
                dragonImg.onerror = null;
            }

            if (pHP > 0 && combatPet) { 
                combatPet.style.transform = 'translateX(0) scale(1) translateY(0)';
                if (heroImg) heroImg.style.zIndex = '2'; 
                combatPet.src = originalSrc;
                combatPet.onerror = null;
                setTimeout(() => {
                    if (combatPet && pHP > 0) {
                        combatPet.style.transition = '';
                        combatPet.style.animation = 'breatheAnim 2s infinite';
                        combatPet.style.zIndex = '1'; 
                    }
                }, 300);
            }
        }, 1500);
    }
    return true; 
}

// ========== 遊戲流程控制 ==========
function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    let victScreen = document.getElementById('victory-screen');
    if (victScreen) {
        victScreen.style.display = 'none';
        let nsd = document.getElementById('new-sticker-display');
        if (nsd) nsd.innerHTML = ''; 
    }
    
    isWait = false; 
    try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
    if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];
    buildCurrentWordList();

    calcBuffs(); 
    pHP = getHeroMaxHP();
    hintsLeft = getHeroMaxHints(); 
    currentLvl = 1;
    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 5;
    window.hasUsedUlt = false; 
    
    let skill4Btn = document.querySelector('button[onclick="forceSkill(3)"]');
    if (skill4Btn) skill4Btn.style.display = 'none';
    
    const hero = heroes[selectedHeroIdx];
    let heroImg = document.getElementById('hero-img'); 
    if(heroImg) {
        heroImg.src = `${hero.folder}/hero.png`;
        heroImg.classList.remove('ssr-glow');
        updateCombatPet(heroImg, hero);
    }
    
    try { document.getElementById('hero-atk-sfx').src = `${hero.folder}/atk.mp3`; } catch(e){}
    try { document.getElementById('hero-atk2-sfx').src = `${hero.folder}/atk2.mp3`; } catch(e){}
    try { document.getElementById('hero-hurt-sfx').src = `${hero.folder}/hurt.mp3`; } catch(e){}
    
    let startScreen = document.getElementById('start-screen'); if(startScreen) startScreen.style.opacity = '0';
    let gameCont = document.getElementById('game-container'); if(gameCont) gameCont.classList.add('game-show');
    
    if(window.applyAudioSettings) window.applyAudioSettings(); 
    if (window.lobbyBgm) window.lobbyBgm.pause();

    playRandomBattleBgm();
    initRageMeter(); 
    
    setTimeout(() => { updateHP(); nextTask(); if(startScreen) startScreen.style.display = 'none'; }, 1000);
}

function quitToMain() {
    if(confirm("確定要放棄這局遊戲，回到英雄選擇大廳嗎？")) {
        toggleSettings(false);
        isWait = true; 
        bgm.pause(); bgm.currentTime = 0;
        window.speechSynthesis.cancel(); 
        
        let startScreen = document.getElementById('start-screen');
        if(startScreen) { startScreen.style.display = 'flex'; setTimeout(() => startScreen.style.opacity = '1', 10); }
        let gameCont = document.getElementById('game-container');
        if(gameCont) gameCont.classList.remove('game-show');
        changeHeroSelection(0);

        if (window.lobbyBgm) {
            window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.lobbyBgm.play().catch(e => {});
        }
    }
}

function restartFromFailure() {
    let victScreen = document.getElementById('victory-screen');
    if (victScreen) {
        victScreen.style.display = 'none';
        let nsd = document.getElementById('new-sticker-display');
        if (nsd) nsd.innerHTML = ''; 
    }

    try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
    if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];
    buildCurrentWordList();

    calcBuffs(); 
    pHP = getHeroMaxHP();
    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 5;
    currentLvl = 1; isWait = false; hintsLeft = getHeroMaxHints();
    window.hasUsedUlt = false; 
    
    failBgm.pause(); failBgm.currentTime = 0; 
    winBgm.pause(); winBgm.currentTime = 0; 
    if(isMusicPlaying) playRandomBattleBgm(); 
    else { bgm.src = battleBgmList[Math.floor(Math.random()*battleBgmList.length)]; bgm.currentTime = 0; }
    
    document.getElementById('game-over-screen').style.display = 'none';
    
    const hero = heroes[selectedHeroIdx];
    let heroImg = document.getElementById('hero-img'); 
    if(heroImg) { 
        heroImg.src = `${hero.folder}/hero.png`; 
        heroImg.classList.remove('ssr-glow'); 
        updateCombatPet(heroImg, hero); 
    }
    updateHP(); nextTask();
    initRageMeter(); 
}

function updateHP() {
    let pHPText = document.getElementById('prince-hp'); let dHPText = document.getElementById('dragon-hp');
    if(pHPText) pHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, pHP)}`;
    if(dHPText) dHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, dHP)}`;
    if(dHP <= 0 && currentLvl === 3) document.getElementById('dragon-img').style.width = "220px";
    if(pHP <= 0 && !isWait) { 
        isWait = true; 
        
        if (currentLvl === 3) {
            triggerVictory(1, true);
            return;
        }

        bgm.pause(); 
        failBgm.play().catch(e => {}); 
        let heroImg = document.getElementById('hero-img'); if(heroImg) heroImg.src = `${heroes[selectedHeroIdx].folder}/dead.png`; 
        
        let combatPet = document.getElementById('combat-pet-img');
        if (combatPet) combatPet.style.display = 'none';
        let alertIcon = document.getElementById('pet-alert-icon');
        if (alertIcon) alertIcon.style.display = 'none';

        let goDelay = (currentLvl >= 2) ? 2500 : 1500;
        setTimeout(() => { 
            let goScreen = document.getElementById('game-over-screen'); 
            if(goScreen) goScreen.style.display = 'flex'; 
            let tp = document.getElementById('test-panel'); 
            if(tp) tp.style.display = 'none'; 
        }, goDelay); 
    }
}

function nextTask() {
    if(dHP <= 0 || pHP <= 0) return; isWait = false;
    if (typeof autoRepairDOM === 'function') autoRepairDOM(); // 防呆安全呼叫
    
    const dragonImg = document.getElementById('dragon-img'), qImg = document.getElementById('question-img'), container = document.getElementById('game-container'), lvlTag = document.getElementById('level-tag');
    const optCont = document.getElementById('options-container'), spellCont = document.getElementById('spelling-container'), testPanel = document.getElementById('test-panel');

    const isTestMode = window.gachaData && window.gachaData.coins >= 99999;

    if(currentLvl === 3) {
        if(lvlTag) lvlTag.innerText = "第三關：聽音盲拼";
        if(container) container.style.backgroundImage = "url('assets/bg_battle3.png')"; // 顯示第三關原圖
        if(dragonImg) { dragonImg.dataset.retried = ""; dragonImg.src = "dragon3/dragon.png"; dragonImg.onerror = function() { if(!this.dataset.retried){ this.dataset.retried="true"; this.src = "dragon3/Dragon.png"; } }; dragonImg.style.width = "180px"; }
        if(optCont) optCont.style.display = 'none'; if(spellCont) spellCont.style.display = 'flex';
        if(testPanel) testPanel.style.display = isTestMode ? 'block' : 'none';
        if(qImg) { qImg.style.transition = "filter 0.5s"; qImg.style.filter = "brightness(0) drop-shadow(0 0 15px rgba(255,255,255,0.8))"; }
    } else if(currentLvl === 2) { 
        if(lvlTag) lvlTag.innerText = "第二關：決戰魔龍";
        if(container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle2.png')";
        if(dragonImg) { dragonImg.dataset.retried = ""; dragonImg.src = "dragon2/dragon.png"; dragonImg.onerror = function() { if(!this.dataset.retried){ this.dataset.retried="true"; this.src = "dragon2/Dragon.png"; } }; dragonImg.style.width = "240px"; }
        if(optCont) optCont.style.display = 'none'; if(spellCont) spellCont.style.display = 'flex';
        if(testPanel) testPanel.style.display = isTestMode ? 'block' : 'none';
        if(qImg) qImg.style.filter = "none"; 
    } else {
        if(lvlTag) lvlTag.innerText = "第一關：魔法集氣";
        if(container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle1.png')";
        if(dragonImg) { dragonImg.dataset.retried = ""; dragonImg.src = "dragon1/dragon.png"; dragonImg.onerror = function() { if(!this.dataset.retried){ this.dataset.retried="true"; this.src = "dragon1/Dragon.png"; } }; dragonImg.style.width = "190px"; }
        if(optCont) optCont.style.display = 'grid'; if(spellCont) spellCont.style.display = 'none'; if(testPanel) testPanel.style.display = 'none';
        if(qImg) qImg.style.filter = "none"; 
    }
    
    updateRageMeterUI(); 

    // ========== ★ 防護罩：攔截所有致命錯誤 ★ ==========
    try {
        // 1. 檢查單字庫是否為空，如果是，嘗試重新建立
        if(!window.currentWordList || window.currentWordList.length === 0) {
            console.warn("⚠️ 警告：單字庫是空的！嘗試重新載入...");
            if(typeof buildCurrentWordList === 'function') buildCurrentWordList();
        }

        // 2. 如果重新建立還是空的，啟用「緊急備用單字」，防止遊戲當機！
        if(!window.currentWordList || window.currentWordList.length === 0) {
            console.error("❌ 嚴重錯誤：真的找不到任何單字！啟用緊急備用單字！");
            window.currentWordList = ["apple", "banana", "cat", "dog"];
        }

        currentWord = currentWordList[Math.floor(Math.random() * currentWordList.length)];

        // 3. 確保抽出來的單字真的是字串，不然 toLowerCase() 會壞掉
        if (typeof currentWord !== 'string') {
             console.error("❌ 嚴重錯誤：抽出的單字格式異常！", currentWord);
             currentWord = "apple";
        }

        window.hasLoggedMistake = false; 
        let lessonFolder = (typeof wordToLessonMap !== 'undefined' && wordToLessonMap[currentWord]) ? wordToLessonMap[currentWord] : "lesson1";
        
        if(qImg) {
            qImg.dataset.retried = ""; 
            qImg.src = `wordbank/${lessonFolder}/${currentWord.toLowerCase()}.png`;
            qImg.onerror = function() { if(!this.dataset.retried) { this.dataset.retried = "true"; this.src = `wordbank/${lessonFolder}/${currentWord.toUpperCase()}.png`; } };
        }
        
        if(currentLvl === 1) {
            let opts = [currentWord]; 
            let availableWords = currentWordList.filter(w => w !== currentWord);
            availableWords.sort(() => Math.random() - 0.5);
            
            // 補足4個選項
            opts = opts.concat(availableWords.slice(0, 3));
            
            // 如果連備用字都不夠湊齊4個，用寫死的陣列補滿
            let fallbacks = ["apple", "banana", "cat", "dog", "egg"];
            let fbIdx = 0;
            while(opts.length < 4 && fbIdx < fallbacks.length) {
                if(!opts.includes(fallbacks[fbIdx])) opts.push(fallbacks[fbIdx]);
                fbIdx++;
            }

            opts.sort(() => Math.random() - 0.5);

            if(optCont) {
                optCont.innerHTML = "";
                opts.forEach(o => { 
                    const b = document.createElement('button'); 
                    b.className = 'option-btn'; 
                    b.innerText = o.toLowerCase(); 
                    b.onclick = () => { if(!isWait) checkChoice(o === currentWord, o); }; 
                    optCont.appendChild(b); 
                });
            }
        } else { 
            startSpell(); 
        }
        
        // 延遲發音，確保前面的程式都跑完
        setTimeout(() => { if(typeof speak === 'function') speak(currentWord, 'en'); }, 300);

    } catch (error) {
        // 如果還是發生預期外的錯誤，把它印出來，但不要讓畫面凍結
        console.error("💀 nextTask 發生致命錯誤：", error);
        alert("遊戲載入題目時發生錯誤！請按鍵盤上的 F12 打開主控台查看紅字。");
    }
}
function forceSkill(skillIdx) {
    if(isWait || dHP <= 0 || pHP <= 0 || currentLvl === 1 || skillIdx === 3) return;

    const hero = heroes[selectedHeroIdx]; 
    let animationSkillIdx = skillIdx; 
    const skillName = hero.skills[skillIdx];

    isWait = true; 
    let finalDmg = hero.baseDmg[skillIdx] || 1;
    
    let currentCrit = window.critRate || 5;
    window.pendingIsCrit = (Math.random() * 100) < currentCrit;
    if(window.pendingIsCrit) finalDmg *= 2;
    
    dHP -= finalDmg; window.pendingDamageForFeedback = finalDmg; 
    
    if(window.pendingIsCrit) showBattleMsg("🔥 爆擊！雙倍傷害！");
    else showBattleMsg(`【手動施放】${hero.name}：${skillName}！`);
    
    feedback(true, animationSkillIdx); 
    setTimeout(() => { 
        if(dHP <= 0) {
            if(currentLvl === 2) { 
                showBattleMsg("⚠️ 終極積木魔王降臨！進入第三關！");
                setTimeout(() => { currentLvl = 3; dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 20 : 15; nextTask(); updateHP(); }, 2000);
            } else {
                triggerVictory(2, false); 
            }
        } else nextTask(); 
    }, animationSkillIdx >= 2 ? 4500 : 2500); 
}

function checkChoice(isCorrect, selectedWord = null) {
    if(isCorrect) {
        isWait = true; let skillIdx = 0; const hero = heroes[selectedHeroIdx];
        
        if (currentLvl === 3) {
            window.dragonRage = Math.max(0, window.dragonRage - 1);
            updateRageMeterUI();
            if (typeof showBattleMsg === 'function') showBattleMsg("✨ 答對了！樂高龍的怒氣下降了！");
        }

        if(currentLvl >= 2) { 
            const rnd = Math.random(), len = currentWord.replace(/[\s-]/g, '').length;
            if(len <= 5) { if(rnd < 0.7) skillIdx = 0; else if(rnd < 0.9) skillIdx = 1; else skillIdx = 2; }
            else if(len <= 8) { if(rnd < 0.5) skillIdx = 0; else if(rnd < 0.8) skillIdx = 1; else skillIdx = 2; }
            else { if(rnd < 0.1) skillIdx = 0; else if(rnd < 0.3) skillIdx = 1; else skillIdx = 2; }
        }
        
        let dmg = hero.baseDmg[skillIdx] || 1;
        let currentCrit = window.critRate || 5;
        window.pendingIsCrit = (Math.random() * 100) < currentCrit;
        if(window.pendingIsCrit) dmg *= 2;

        dHP -= dmg; window.pendingDamageForFeedback = dmg; 
        
        window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0}; 
        if (!window.hasLoggedMistake) window.studyLog[currentWord].success++; 
        localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
        
        if(window.pendingIsCrit) showBattleMsg("🔥 爆擊！雙倍傷害！");
        else showBattleMsg(`${hero.name}：${hero.skills[skillIdx]}！`);
        
        speak(currentWord, 'en'); feedback(true, skillIdx);
        
        setTimeout(() => { 
            if(dHP <= 0) { 
                if(currentLvl === 1) { 
                    currentLvl = 2; dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 10; nextTask(); updateHP(); 
                } else if(currentLvl === 2) {
                    showBattleMsg("⚠️ 終極積木魔王降臨！進入第三關！");
                    setTimeout(() => { currentLvl = 3; dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 20 : 15; nextTask(); updateHP(); }, 2000);
                } else {
                    triggerVictory(2, false); 
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
            updateRageMeterUI();
            if (window.dragonRage >= 3) {
                performLegoStormUlt(); 
                return; 
            }
        }

        // ★ 新增：答錯時暫時鎖定畫面 (防玩家狂點按鈕導致扣血崩潰)
        isWait = true;

        let isBlocked = tryTriggerHero1PetBlock();
        if (isBlocked) {
            if (currentLvl === 1 && selectedWord) speak(selectedWord, 'en');
            setTimeout(() => { if(pHP > 0) isWait = false; }, 1500);
            return;
        }

        pHP -= (currentLvl === 2 ? 2 : 1); 
        feedback(false); 
        if (currentLvl === 1 && selectedWord) speak(selectedWord, 'en');

        // ★ 新增：受傷動畫結束後才解鎖畫面
        setTimeout(() => {
            if (pHP > 0) isWait = false;
        }, 1200); 
    }
}
function startSpell() {
    spellingText = ""; advanceSpellingText(); updateWordDisplay();
    const grid = document.getElementById('letters-grid'); if(grid) grid.innerHTML = "";
    
    let lettersToGuess = currentWord.replace(/[\s-]/g, '').split('').sort(()=>Math.random()-0.5);
    lettersToGuess.forEach(l => {
        const b = document.createElement('button'); 
        b.className = 'letter-btn'; 
        b.innerText = l.toLowerCase(); 
        
        b.style.fontSize = '32px';    
        b.style.fontWeight = 'bold';   
        b.style.padding = '8px 14px'; 
        b.style.margin = '5px';        
        b.style.minWidth = '55px';     
        b.style.borderRadius = '10px';

        b.onclick = () => {
            if(isWait || b.classList.contains('letter-correct')) return;
            
            if(l === currentWord[spellingText.length] || l.toUpperCase() === currentWord[spellingText.length].toUpperCase()) {
                b.classList.add('letter-correct'); spellingText += l; speak(l, 'en'); advanceSpellingText(); updateWordDisplay();
                if(spellingText.length === currentWord.length) checkChoice(true);
            } else { 
                b.style.animation = "wrongLetterShake 0.4s ease";
                setTimeout(() => { if(b && !b.classList.contains('letter-correct')) b.style.animation = ""; }, 400);

                if(currentLvl >= 2) speak(currentWord, 'en');

                window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0}; 
                if (!window.hasLoggedMistake) {
                    window.studyLog[currentWord].fail++; 
                    window.hasLoggedMistake = true;
                    localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
                }
                
                if (currentLvl === 3) {
                    window.dragonRage++;
                    updateRageMeterUI();
                    if (window.dragonRage >= 3) {
                        performLegoStormUlt();
                        return;
                    }
                }

                let isBlocked = tryTriggerHero1PetBlock();
                if (isBlocked) return;

                pHP -= (currentLvl === 2 ? 2 : 1); 
                
                let currentHero = heroes[selectedHeroIdx];
                let stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
                
                if (currentLvl >= 2 && stars >= 5 && (selectedHeroIdx === 1 || (currentHero && currentHero.name && currentHero.name.includes('米拉')))) {
                    const correctChar = currentWord[spellingText.length].toLowerCase();
                    if (typeof showBattleMsg === 'function') {
                        showBattleMsg(`✨ 米拉魔法發動！正確字母是「${correctChar.toUpperCase()}」！`);
                    }
                    
                    let combatPet = document.getElementById('combat-pet-img');
                    if (combatPet && combatPet.style.display !== 'none') {
                        if(window.petReturnTimer) clearTimeout(window.petReturnTimer);
                        
                        let originalSrc = currentHero.petImg;
                        combatPet.src = `${currentHero.folder}/pet_action.png`;
                        combatPet.onerror = function() { this.src = originalSrc; }; 
                        
                        combatPet.style.animation = 'petBounceInPlace 0.4s infinite';
                        
                        let alertIcon = document.getElementById('pet-alert-icon');
                        if (!alertIcon) {
                            alertIcon = document.createElement('div');
                            alertIcon.id = 'pet-alert-icon';
                            alertIcon.innerText = '❗';
                            alertIcon.style.position = 'absolute';
                            alertIcon.style.fontSize = '35px';
                            alertIcon.style.fontWeight = 'bold';
                            alertIcon.style.color = '#ff4757';
                            alertIcon.style.textShadow = '0 2px 4px rgba(255,255,255,0.8), 0 0 10px #ff4757';
                            alertIcon.style.zIndex = '10';
                            let heroImg = document.getElementById('hero-img');
                            if (heroImg && heroImg.parentElement) heroImg.parentElement.appendChild(alertIcon);
                        }
                        
                        alertIcon.style.bottom = '85px'; 
                        alertIcon.style.left = '-25px';
                        alertIcon.style.display = 'block';
                        alertIcon.style.animation = 'bounceIn 0.3s ease-out';

                        window.petReturnTimer = setTimeout(() => {
                            if (pHP > 0 && combatPet) { 
                                combatPet.style.animation = 'breatheAnim 2s infinite';
                                combatPet.src = originalSrc; 
                                combatPet.onerror = null;
                            }
                            if (alertIcon) alertIcon.style.display = 'none';
                        }, 3000);
                    }
                    
                    // 重構：呼叫共用高亮函數
                    highlightNextLetter(correctChar, 3000);
                }
                
                if(pHP <= 0 && currentLvl >= 2) {
                    if(isWait) return;
                    isWait = true;
                    let wd = document.getElementById('word-display');
                    if(wd) { 
                        wd.innerText = currentWord.toLowerCase(); 
                        wd.style.color = '#ff4757'; 
                        wd.style.fontSize = '36px'; 
                        wd.style.fontWeight = 'bold'; 
                        wd.style.textShadow = '0 0 10px #ff4757'; 
                    }
                    if (typeof showBattleMsg === 'function') showBattleMsg(`正確答案是：${currentWord.toLowerCase()}`);
                    feedback(false);
                    
                    setTimeout(() => { 
                        if(pHP <= 0) {
                            if (currentLvl === 3) {
                                triggerVictory(1, true);
                            } else {
                                bgm.pause(); 
                                failBgm.play().catch(e => {});
                                let goScreen = document.getElementById('game-over-screen'); 
                                if(goScreen) goScreen.style.display = 'flex'; 
                                let tp = document.getElementById('test-panel'); 
                                if(tp) tp.style.display = 'none';
                                let heroImg = document.getElementById('hero-img'); 
                                if(heroImg && heroImg.src.indexOf('dead') === -1) {
                                    heroImg.src = `${heroes[selectedHeroIdx].folder}/dead.png`;
                                }
                                
                                let combatPet = document.getElementById('combat-pet-img');
                                if (combatPet) combatPet.style.display = 'none';
                                let alertIcon = document.getElementById('pet-alert-icon');
                                if (alertIcon) alertIcon.style.display = 'none';
                            }
                        }
                    }, 2500);
                } else {
                    feedback(false);
                }
            } 
        };
        if(grid) grid.appendChild(b);
    });
    
    let btnContainer = document.getElementById('spell-btn-container');
    if(!btnContainer) {
        btnContainer = document.createElement('div'); btnContainer.id = 'spell-btn-container'; btnContainer.style.display = 'flex'; btnContainer.style.gap = '15px'; btnContainer.style.marginTop = '20px';
        let sc = document.getElementById('spelling-container'); if(sc) sc.appendChild(btnContainer);
    }
    
    let readBtn = document.getElementById('read-spell-btn');
    if(!readBtn) {
        readBtn = document.createElement('button'); readBtn.id = 'read-spell-btn'; readBtn.innerHTML = '🔊 讀出拼音'; readBtn.style.cssText = 'background: #a29bfe; border: 3px solid #8e44ad; border-radius: 20px; padding: 10px 20px; color: white; font-size: 16px; font-weight: bold; cursor: pointer;';
        readBtn.onclick = () => { let t = spellingText.replace(/[\s-]/g, '').trim(); if(t.length > 0) speak(t, 'en'); }; btnContainer.appendChild(readBtn);
    }
    
    let hintBtn = document.getElementById('hint-btn');
    if(!hintBtn) {
        hintBtn = document.createElement('button'); hintBtn.id = 'hint-btn'; hintBtn.style.cssText = 'background: #ffeaa7; border: 3px solid #fdcb6e; border-radius: 20px; padding: 10px 20px; color: #d35400; font-size: 16px; font-weight: bold; cursor: pointer;';
        hintBtn.onclick = showHint; btnContainer.appendChild(hintBtn);
    }
    hintBtn.innerText = `🪄 提示 (${hintsLeft}/${getHeroMaxHints()})`;
    if(hintsLeft > 0) { hintBtn.style.opacity = "1"; hintBtn.style.cursor = "pointer"; hintBtn.disabled = false; } else { hintBtn.style.opacity = "0.5"; hintBtn.style.cursor = "not-allowed"; hintBtn.disabled = true; }
}

function advanceSpellingText() { while(spellingText.length < currentWord.length && (currentWord[spellingText.length] === ' ' || currentWord[spellingText.length] === '-')) spellingText += currentWord[spellingText.length]; }
function updateWordDisplay() {
    let dHTML = "";
    for(let i=0; i<currentWord.length; i++) { if(i < spellingText.length || currentWord[i] === ' ' || currentWord[i] === '-') dHTML += currentWord[i].toLowerCase() + " "; else dHTML += "_ "; }
    let wd = document.getElementById('word-display'); if(wd) wd.innerText = dHTML;
}

function showHint() {
    if(isWait || hintsLeft <= 0) return;
    hintsLeft--; 
    
    if(currentLvl === 3) {
        const qImg = document.getElementById('question-img');
        if(qImg) {
            qImg.style.filter = "none";
            if (typeof showBattleMsg === 'function') showBattleMsg("✨ 黑影魔法解除了！");
        }
    }
    
    const hintBtn = document.getElementById('hint-btn'); if(hintBtn) hintBtn.innerText = `🪄 提示 (${hintsLeft}/${window.maxHints})`;
    if(hintsLeft === 0 && hintBtn) { hintBtn.style.opacity = "0.5"; hintBtn.style.cursor = "not-allowed"; hintBtn.disabled = true; }
    
    // 重構：呼叫共用高亮函數
    const nextChar = currentWord[spellingText.length].toLowerCase(); 
    highlightNextLetter(nextChar, 2000);
}

// ========== 戰鬥結算系統 (重構版) ==========

// 1. 計算掉落率與獎勵
function calculateChestReward(multiplier) {
    let roll = Math.random() * 100;
    let baseEarn = 0, chestName = '', chestEmoji = '🎁', titleColor = '', glowFx = '', chestImgName = '';
    
    if(roll < 5) { 
        baseEarn = 50; chestName = '彩色寶箱'; titleColor = '#ff4757'; 
        glowFx = 'animation: rainbowGlow 2s linear infinite; padding: 5px; border-radius: 10px; background: rgba(255,255,255,0.8);'; 
        chestEmoji = '🌈'; chestImgName = 'chest_ssr.png'; 
    } else if(roll < 20) { 
        baseEarn = 25; chestName = '紫色寶箱'; titleColor = '#8e44ad'; 
        glowFx = 'text-shadow: 0 0 15px #9b59b6;'; 
        chestEmoji = '🟪'; chestImgName = 'chest_sr.png'; 
    } else if(roll < 50) { 
        baseEarn = 15; chestName = '金色寶箱'; titleColor = '#f39c12'; 
        glowFx = 'text-shadow: 0 0 15px #f1c40f;'; 
        chestEmoji = '🟨'; chestImgName = 'chest_r.png'; 
    } else { 
        baseEarn = 10; chestName = '一般寶箱'; titleColor = '#7f8c8d'; 
        glowFx = 'text-shadow: 1px 1px 2px #fff;'; 
        chestEmoji = '⬜'; chestImgName = 'chest_n.png'; 
    }
    
    let finalBaseEarn = baseEarn * multiplier;
    let finalBonus = (window.extraCoinsBonus || 0) * multiplier;
    
    return {
        chestName, chestEmoji, titleColor, glowFx, chestImgName,
        finalBaseEarn, finalBonus, totalEarn: finalBaseEarn + finalBonus
    };
}

// 2. 渲染 UI 畫面
function renderVictoryScreen(reward, isConsolation, isDouble) {
    let topTitle = isConsolation ? "✨ 戰鬥結束！ ✨" : "✨ 獲得新貼紙！ ✨";
    let mainMsg = isConsolation ? "敗給了第三關，但成功守護了第二關的寶箱！" : (isDouble ? "太神啦！第三關通關，獲得雙倍寶箱！" : "太棒了！快去大廳抽轉蛋吧！");
    
    let coinDisplayHtml = reward.finalBonus > 0 
        ? `🪙 +${reward.finalBaseEarn} <span style="font-size: 45px; color: #2ecc71; text-shadow: 0 0 10px #2ecc71; margin-left: 10px;">(+${reward.finalBonus})</span>`
        : `🪙 +${reward.finalBaseEarn}`;

    let chestInteractiveImgs = isDouble 
        ? `<div style="display:flex; justify-content:center; gap:20px;">
             <img class="chest-img-target" src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span class=\\'chest-img-target\\' style=\\'font-size:100px;\\'>${reward.chestEmoji}</span>'" style="width:180px; height:180px; object-fit:contain; filter:drop-shadow(0 15px 15px rgba(0,0,0,0.6)); animation: breatheAnim 2s infinite; transition: 0.2s;">
             <img class="chest-img-target" src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span class=\\'chest-img-target\\' style=\\'font-size:100px;\\'>${reward.chestEmoji}</span>'" style="width:180px; height:180px; object-fit:contain; filter:drop-shadow(0 15px 15px rgba(0,0,0,0.6)); animation: breatheAnim 2s infinite reverse; transition: 0.2s;">
           </div>`
        : `<img class="chest-img-target" src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span class=\\'chest-img-target\\' style=\\'font-size:150px;\\'>${reward.chestEmoji}</span>'" style="width:250px; height:250px; object-fit:contain; filter:drop-shadow(0 15px 15px rgba(0,0,0,0.6)); animation: breatheAnim 2s infinite; transition: 0.2s;">`;

    let chestResultImgs = isDouble
        ? `<div style="display:flex; gap:15px; margin-right:20px;">
             <img src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span style=\\'font-size:60px;\\'>${reward.chestEmoji}</span>'" style="width:90px; height:90px; object-fit:contain; filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5));">
             <img src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span style=\\'font-size:60px;\\'>${reward.chestEmoji}</span>'" style="width:90px; height:90px; object-fit:contain; filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5));">
           </div>`
        : `<img src="assets/${reward.chestImgName}" onerror="this.outerHTML='<span style=\\'font-size:80px; margin-right:15px;\\'>${reward.chestEmoji}</span>'" style="width:120px; height:120px; object-fit:contain; margin-right:20px; filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5));">`;

    let vsScreen = document.getElementById('victory-screen'); 
    vsScreen.style.display = 'flex'; 
    vsScreen.style.backgroundImage = `url('assets/bg_main.png')`; 
    
    let h1Title = vsScreen.querySelector('h1');
    if(h1Title) h1Title.innerText = topTitle;

    let nsd = document.getElementById('new-sticker-display'); 
    nsd.innerHTML = `
        <div id="chest-interactive" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; transition: transform 0.2s;">
            <div style="font-size:36px; color:white; font-weight:bold; margin-bottom: 30px; text-shadow: 2px 2px 4px #000;">${isDouble ? '發現了兩個未知的寶箱！' : '發現了未知的寶箱！'}</div>
            ${chestInteractiveImgs}
            <div id="chest-click-hint" style="font-size:28px; color:#ffd700; margin-top:20px; animation: goldPulse 1s infinite; font-weight:bold; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;">👇 點擊開啟 👇</div>
        </div>
        
        <div id="chest-result" style="display:none; flex-direction:column; align-items:center;">
            <div style="display:flex; align-items:center; justify-content:center; margin-bottom:15px; ${reward.glowFx}">
                ${chestResultImgs}
                <div style="font-size:42px; color:${reward.titleColor}; font-weight:bold;">${isDouble ? '雙倍' : ''}${reward.chestName}！</div>
            </div>
            
            <div style="font-size:65px; color:#ffd700; text-shadow:0 0 20px #fff; animation:goldPulse 1s infinite; display:flex; align-items:baseline; justify-content:center;">
                ${coinDisplayHtml}
            </div>
            
            ${isDouble ? `<div style="font-size:30px; color:#ff4757; font-weight:bold; margin-top:10px; animation: superShakeChest 1s infinite;">🔥 第三關挑戰成功！寶箱與金幣翻倍！ 🔥</div>` : ''}
            ${reward.finalBonus > 0 ? `<div style="font-size:20px; color:#2ecc71; margin-top:8px; font-weight:bold;">✨ (包含 N卡收集獎勵 +${reward.finalBonus}) ✨</div>` : ''}
            
            <div style="font-size:22px; color:white; margin-top:25px; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px; line-height: 1.5;">${mainMsg}</div>
        </div>
    `; 

    let chestInt = document.getElementById('chest-interactive');
    let chestRes = document.getElementById('chest-result');
    let hintText = document.getElementById('chest-click-hint');
    let targets = document.querySelectorAll('.chest-img-target'); 

    if(chestInt && targets.length > 0) {
        chestInt.onclick = () => {
            chestInt.onclick = null;
            targets.forEach(imgTarget => {
                imgTarget.style.animation = 'superShakeChest 0.15s infinite';
                imgTarget.style.filter = 'drop-shadow(0 0 40px #ffd700) brightness(1.3)';
            });
            if(hintText) hintText.innerText = "✨ 開啟中... ✨";

            setTimeout(() => {
                chestInt.style.display = 'none';
                chestRes.style.display = 'flex';
                chestRes.style.animation = 'bounceIn 0.5s ease-out';
            }, 1500);
        };
    }
}

// 3. 結算主進入點
function triggerVictory(multiplier = 1, isConsolation = false) {
    isWait = true; 
    let tp = document.getElementById('test-panel'); if(tp) tp.style.display = 'none'; 
    bgm.pause(); 
    
    if (isConsolation) failBgm.play().catch(e => {}); 
    else winBgm.play().catch(e => {});
    
    // 計算掉落與獎勵
    const reward = calculateChestReward(multiplier);
    
    // 更新全域金幣資料
    window.gachaData.coins += reward.totalEarn; 
    localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
    
    // 渲染 UI (延遲顯示增加期待感)
    setTimeout(() => { 
        renderVictoryScreen(reward, isConsolation, multiplier > 1);
    }, 1500);
}

// ========== 反饋系統 ==========
window.feedback = function(isCorrect, skillIdx = 0, isDragonUlt = false) {
    const h = document.getElementById('hero-img'), d = document.getElementById('dragon-img'), m = document.getElementById('magic-meteor');
    const heroConfig = heroes[selectedHeroIdx]; 
    const battleScene = document.getElementById('battle-scene');
    
    let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3'); 
    const targetLvl = currentLvl; 
    let gameContainer = document.getElementById('game-container');
    
    let dmgValue = window.pendingDamageForFeedback || 1;
    let critValue = window.pendingIsCrit || false;

    if(!h || !d || !battleScene || !heroConfig) return; 
    
    if(isCorrect) {
        if(heroConfig.name === '艾德恩') {
            h.classList.add('hero-front');
            if(skillIdx === 0) {
                playSfx(`${heroConfig.folder}/roar.mp3`); h.src = `${heroConfig.folder}/hero_atk1_1.png`; 
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk1_2.png`; h.classList.add('atk-dash'); playSfx(`${heroConfig.folder}/atk.mp3`); 
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; 
                        playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                        if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, critValue); 
                        if(typeof updateHP === 'function') updateHP(); 
                    }, 250);
                }, 500);
                setTimeout(() => { h.classList.remove('atk-dash', 'hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 1800);
            } else if(skillIdx === 1) {
                playSfx(`${heroConfig.folder}/roar.mp3`); h.src = `${heroConfig.folder}/hero_atk2_1.png`; h.style.transition = 'none'; h.style.animation = 'none'; 
                const spawnHurtParticles = (x, y) => { for(let i=0; i<10; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:${x}px; bottom:${y}px; --pdx:${(Math.random()-0.5)*150}px; --pdy:${(Math.random()-0.5)*150}px; animation-delay:${Math.random()*0.1}s;`; battleScene.appendChild(p); setTimeout(()=>p.remove(), 1200); } };
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk2_2.png`; h.style.transform = 'translate(220px, -20px) scale(1.2)'; playSfx(`${heroConfig.folder}/atk2_1.mp3`); d.classList.add('hurt-shake'); spawnHurtParticles(400, 150); setTimeout(()=>d.classList.remove('hurt-shake'), 150); }, 400);
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk2_3.png`; h.style.transform = 'translate(310px, -20px) scaleX(-1.2) scaleY(1.2)'; playSfx(`${heroConfig.folder}/atk2_2.mp3`); d.style.transform = 'translateX(-20px)'; d.classList.add('hurt-shake'); spawnHurtParticles(430, 150); setTimeout(()=> { d.classList.remove('hurt-shake'); d.style.transform = ''; }, 150); }, 800);
                setTimeout(() => { 
                    h.src = `${heroConfig.folder}/hero_atk2_4.png`; h.style.transform = 'translate(280px, -150px) scale(1.5)'; playSfx(`${heroConfig.folder}/atk2_3.mp3`); 
                    d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); 
                    d.classList.add('hurt-shake'); spawnHurtParticles(425, 200); 
                    if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, critValue); 
                    if(typeof updateHP === 'function') updateHP(); 
                }, 1200);
                setTimeout(() => { h.style.transform = ''; h.style.transition = '0.3s'; h.style.animation = ''; h.classList.remove('hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 2000);
            } else if(skillIdx >= 2) {
                h.src = `${heroConfig.folder}/hero_atk3_1.png`; h.classList.add('casting-ult'); 
                if(gameContainer) gameContainer.style.position = 'relative'; battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; 
                let darkBg = document.createElement('div'); darkBg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 0, 0, 0.75); z-index:800; pointer-events:none; transition: opacity 0.5s; opacity: 0; border-radius: 20px;';
                if(gameContainer) gameContainer.appendChild(darkBg); else battleScene.appendChild(darkBg); 
                setTimeout(() => darkBg.style.opacity = '1', 50); 
                playSfx(`${heroConfig.folder}/atk3_cast.mp3`); playSfx(`${heroConfig.folder}/thunder_roll.mp3`, 0.6); 
                let mc = document.createElement('img'); mc.src = `${heroConfig.folder}/magic_circle.png`; mc.className = 'ult-magic-circle'; mc.style.zIndex = '2'; battleScene.appendChild(mc);
                const spawnSkyLightning = (x, delay) => { let l = document.createElement('div'); l.className = 'gold-lightning'; l.style.cssText = `--lx:${x}px; --ldelay:${delay}s; z-index: 5;`; l.style.backgroundImage = `url('${heroConfig.folder}/gold_lightning.png')`; battleScene.appendChild(l); setTimeout(()=> l.remove(), 700); };
                spawnSkyLightning(100, 0.2); spawnSkyLightning(250, 0.4); spawnSkyLightning(400, 0.3); spawnSkyLightning(50, 0.6); spawnSkyLightning(450, 0.5);
                let gsGroup = document.createElement('div'); gsGroup.className = 'giant-sword-with-effects'; gsGroup.style.zIndex = '15'; 
                let gs = document.createElement('img'); gs.src = `${heroConfig.folder}/giant_sword.png`; gs.style.cssText = 'width:100%; height:auto; object-fit:contain;'; gsGroup.appendChild(gs);
                let swordLightning = document.createElement('div'); swordLightning.className = 'sword-lightning-wraps'; swordLightning.style.backgroundImage = `url('${heroConfig.folder}/sword_lightning.png')`; gsGroup.appendChild(swordLightning);
                setTimeout(() => battleScene.appendChild(gsGroup), 800);
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk3_2.png`; h.classList.add('hero-open-eye'); setTimeout(()=> h.classList.remove('hero-open-eye'), 400); }, 1300);
                setTimeout(() => {
                    playSfx(`${heroConfig.folder}/atk3_hit.mp3`); playSfx(`${heroConfig.folder}/gold_explosion.mp3`, 0.8);
                    if(typeof showDamage === 'function') showDamage(false, dmgValue, 3000, critValue); 
                    if(battleScene) battleScene.classList.add('severe-shake');
                    let ex = document.createElement('img'); ex.className = 'gold-explosion-fx'; ex.src = `${heroConfig.folder}/gold_explosion.png`; ex.style.zIndex = '20'; battleScene.appendChild(ex); setTimeout(()=> ex.remove(), 1000);
                    for(let i=0; i<30; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:425px; bottom:150px; --pdx:${(Math.random()-0.5)*250}px; --pdy:${(Math.random()-0.5)*250}px; animation-delay:${Math.random()*0.2}s; z-index:20;`; battleScene.appendChild(p); setTimeout(()=> p.remove(), 1200); }
                    d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; d.classList.add('dragon-shock', 'dragon-front'); playSfx(`${dFolder}/hurt.mp3`); 
                    if(typeof updateHP === 'function') updateHP(); 
                    setTimeout(() => { if(battleScene) battleScene.classList.remove('severe-shake'); d.classList.remove('dragon-shock', 'dragon-front'); }, 1000);
                }, 1500);
                setTimeout(() => { gsGroup.style.transition = 'opacity 0.5s ease-out'; gsGroup.style.opacity = '0'; darkBg.style.opacity = '0'; }, 3200);
                setTimeout(() => { mc.remove(); gsGroup.remove(); darkBg.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; }, 3700);
                setTimeout(() => { h.classList.remove('casting-ult', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 4500);
            }
        } 
        else if(heroConfig.name === '米拉') {
            if(skillIdx === 0) { 
                playSfx(`${heroConfig.folder}/atk1_1.mp3`); h.src = `${heroConfig.folder}/hero_atk1_1.png`; 
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk1_2.png`; playSfx(`${heroConfig.folder}/atk1_2.mp3`);
                    let b = document.createElement('img'); b.src = `${heroConfig.folder}/bubble_stream.png`;
                    b.style.cssText = 'position:absolute; top:110px; left:120px; width:200px; z-index:110; animation: bubblePassAnim 1s linear forwards;'; battleScene.appendChild(b);
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                        if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, critValue); 
                        if(typeof updateHP === 'function') updateHP(); 
                    }, 400); 
                    setTimeout(() => b.remove(), 1000);
                }, 300);
            } else if(skillIdx === 1) { 
                playSfx(`${heroConfig.folder}/atk2_1.mp3`); h.src = `${heroConfig.folder}/hero_atk2_1.png`; 
                let c = document.createElement('img'); c.src = `${heroConfig.folder}/coral_reef.png`;
                c.style.cssText = 'position:absolute; bottom:10px; right:40px; width:180px; z-index:105; animation: goldPulse 1s forwards;'; battleScene.appendChild(c);
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk2_2.png`; playSfx(`${heroConfig.folder}/atk2_2.mp3`);
                    let w = document.createElement('img'); w.src = `${heroConfig.folder}/wave_crash.png`;
                    w.style.cssText = 'position:absolute; bottom:20px; left:80px; width:150px; z-index:115; animation: waveTsunamiAnim 1s ease-in forwards; transform-origin: bottom center;'; 
                    battleScene.appendChild(w);
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                        if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, critValue); 
                        if(typeof updateHP === 'function') updateHP(); 
                        setTimeout(() => { c.remove(); w.remove(); }, 600); 
                    }, 500); 
                }, 600);
            } else if(skillIdx >= 2) { 
                const ca = document.getElementById('sfx-magic-custom'); 
                if(ca) { 
                    ca.src = heroConfig.magicAudio; 
                    ca.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; 
                    ca.play().catch(e => {}); 
                }
                playSfx(`${heroConfig.folder}/atk3_1.mp3`);
                if(gameContainer) gameContainer.style.position = 'relative'; if(battleScene) { battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; }
                let ob = document.createElement('div'); ob.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 30, 80, 0.75); z-index:800; pointer-events:none; animation: castAnim 3s forwards; border-radius: 20px;'; 
                if(gameContainer) gameContainer.appendChild(ob); else battleScene.appendChild(ob);
                h.src = `${heroConfig.folder}/hero_atk3_1.png`; h.classList.add('atk-glow'); 
                let sd = 0, iv = 110;
                setTimeout(() => { let mc = document.createElement('img'); mc.src = `${heroConfig.folder}/magic_circle.png`; mc.id = 'temp-magic-circle'; mc.style.cssText = 'position:absolute; bottom:20px; left:20px; width:180px; z-index:2; animation: magicCircleAnim 2.5s ease-in forwards;'; battleScene.appendChild(mc); }, 800);
                for(let i = 0; i < 30; i++) { setTimeout(() => { let b = document.createElement('img'); b.src = `${heroConfig.folder}/water_ball.png`; b.style.cssText = `position:absolute; bottom:0px; left:${10 + Math.random() * 80}%; width:45px; z-index:15; animation: waterBallShoot 0.8s linear forwards;`; battleScene.appendChild(b); playSfx(`${heroConfig.folder}/water_ball.mp3`, 0.5); setTimeout(() => b.remove(), 800); }, sd); sd += iv; iv = Math.max(15, iv - 4); }
                setTimeout(() => {
                    let wh = document.createElement('img'); wh.src = `${heroConfig.folder}/spirit_whale.png`; 
                    wh.style.cssText = `position:absolute; bottom: -2000px; left: 50%; transform: translateX(-50%) scale(2.5); width:100%; height: auto; z-index:950; opacity:0.9; transition: transform 2s ease-in-out;`; 
                    if(gameContainer) gameContainer.appendChild(wh); else battleScene.appendChild(wh); 
                    if(ca) { ca.currentTime = 0; ca.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; ca.play().catch(e => {}); }
                    setTimeout(() => {
                        let moveDistance = gameContainer.offsetHeight + 4000; wh.style.transform = `translateY(-${moveDistance}px) translateX(-50%) scale(2.5)`; 
                        setTimeout(() => { 
                            h.classList.remove('atk-glow'); h.src = `${heroConfig.folder}/hero_atk3_2.png`; h.classList.add('atk-dash'); 
                            playSfx(`${heroConfig.folder}/atk3_2.mp3`); d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                            if(typeof showDamage === 'function') showDamage(false, dmgValue, 3000, critValue); 
                            if(typeof updateHP === 'function') updateHP();
                            setTimeout(() => { try { wh.remove(); ob.remove(); let mc = document.getElementById('temp-magic-circle'); if(mc) mc.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; } catch(e){} }, 1000); 
                        }, 1200); 
                    }, 50); 
                }, sd + 200); 
            }
            setTimeout(() => { h.classList.remove('atk-dash', 'atk-jump', 'atk-spin', 'atk-glow', 'hurt-shake'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, (skillIdx >= 2 ? 3500 : (skillIdx === 1 ? 2500 : 1500)));
        } 
        else {
            h.src = `${heroConfig.folder}/hero_atk${skillIdx > 2 ? 3 : skillIdx + 1}.png`; h.classList.add(heroConfig.anims[skillIdx > 2 ? 2 : skillIdx]);
            if(skillIdx === 0) playSfx(`${heroConfig.folder}/atk.mp3`); else if(skillIdx === 1) playSfx(`${heroConfig.folder}/atk2.mp3`);
            if(skillIdx >= 2) {
                let ca = document.getElementById('sfx-magic-custom');
                if(heroConfig.magicAudio && ca) { ca.src = heroConfig.magicAudio; ca.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; ca.play().catch(e => {}); } 
                else { let sm = document.getElementById('sfx-meteor'); if(sm) { sm.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; sm.play().catch(e => {}); } }
                if(m) { m.src = heroConfig.magicImg || 'assets/meteor.png'; setTimeout(() => { m.classList.add(heroConfig.magicAnim || 'meteor-anim'); m.dataset.currentAnim = heroConfig.magicAnim || 'meteor-anim'; }, 200); }
            }
            let hitDelay = heroConfig.anims[skillIdx > 2 ? 2 : skillIdx] === 'atk-dash' ? 250 : 800;
            setTimeout(() => { 
                d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                if(typeof showDamage === 'function') showDamage(false, dmgValue, skillIdx >= 2 ? 3000 : 1000, critValue); 
                if(typeof updateHP === 'function') updateHP(); 
            }, hitDelay);
            setTimeout(() => { h.classList.remove('atk-dash', 'atk-jump', 'atk-spin', 'atk-glow', 'hurt-shake'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } if (m && m.dataset.currentAnim) m.classList.remove(m.dataset.currentAnim); }, 2200);
        }
    } else {
        h.src = pHP <= 0 ? `${heroConfig.folder}/dead.png` : `${heroConfig.folder}/hurt.png`;
        
        if (!isDragonUlt) {
            d.src = `${dFolder}/atk.png`; 
            try { playSfx(`${dFolder}/atk.mp3`); } catch(e){}
            d.classList.add('dragon-atk');
        }
        
        setTimeout(() => { 
            h.classList.add('hurt-shake'); 
            try {
                let hs = document.getElementById('hero-hurt-sfx');
                hs.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                hs.play().catch(e=>{});
            } catch(e){} 
            
            let damageAmount = isDragonUlt ? 3 : (currentLvl === 2 ? 2 : 1);
            if(typeof showDamage === 'function') showDamage(true, damageAmount, 1000, false); 
            
            if(typeof updateHP === 'function') updateHP();         
        }, 300);
        
        setTimeout(() => { 
            h.classList.remove('hurt-shake'); 
            if (!isDragonUlt) d.classList.remove('dragon-atk'); 
            if (currentLvl === targetLvl && dHP > 0 && window.dragonRage < 3) d.src = `${dFolder}/dragon.png`; 
            if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; 
        }, 1200);
    }
};