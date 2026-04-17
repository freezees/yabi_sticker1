// combat.js - 戰鬥迴圈與爆擊系統 (寶箱互動動畫版) - 修正第二關死亡卡住問題

window.hasUsedUlt = false; 
window.pendingIsCrit = false; 
window.pendingDamageForFeedback = 0; 

// ★ 隨機戰鬥 BGM 系統
const battleBgmList = ['assets/music/bgm.mp3', 'assets/music/bgm2.mp3', 'assets/music/bgm3.mp3', 'assets/music/bgm4.mp3', 'assets/music/bgm5.mp3'];
let currentBattleBgmIdx = -1;

function playRandomBattleBgm() {
    // 隨機選一首，但避免重複播放同一首
    let pool = battleBgmList.map((_, i) => i).filter(i => i !== currentBattleBgmIdx);
    currentBattleBgmIdx = pool[Math.floor(Math.random() * pool.length)];
    const newSrc = battleBgmList[currentBattleBgmIdx];
    bgm.pause();
    bgm.src = newSrc;
    bgm.currentTime = 0;
    bgm.volume = 0.1;
    bgm.play().then(() => isMusicPlaying = true).catch(e => null);
}

function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
    if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];
    buildCurrentWordList();

    calcBuffs(); 
    pHP = getHeroMaxHP();
    hintsLeft = getHeroMaxHints(); 
    currentLvl = 1;
    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 5;
    window.hasUsedUlt = false; 
    
    const hero = heroes[selectedHeroIdx];
    let heroImg = document.getElementById('hero-img'); 
    if(heroImg) {
        heroImg.src = `${hero.folder}/hero.png`;
        heroImg.classList.remove('ssr-glow');
    }
    
    try { document.getElementById('hero-atk-sfx').src = `${hero.folder}/atk.mp3`; } catch(e){}
    try { document.getElementById('hero-atk2-sfx').src = `${hero.folder}/atk2.mp3`; } catch(e){}
    try { document.getElementById('hero-hurt-sfx').src = `${hero.folder}/hurt.mp3`; } catch(e){}
    
    let startScreen = document.getElementById('start-screen'); if(startScreen) startScreen.style.opacity = '0';
    let gameCont = document.getElementById('game-container'); if(gameCont) gameCont.classList.add('game-show');
    playRandomBattleBgm();
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
    }
}

function restartFromFailure() {
    try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
    if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];
    buildCurrentWordList();

    calcBuffs(); 
    pHP = getHeroMaxHP();
    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 1 : 5;
    currentLvl = 1; isWait = false; hintsLeft = getHeroMaxHints();
    window.hasUsedUlt = false; 
    
    failBgm.pause(); failBgm.currentTime = 0; if(isMusicPlaying) playRandomBattleBgm(); else { bgm.src = battleBgmList[Math.floor(Math.random()*battleBgmList.length)]; bgm.currentTime = 0; }
    document.getElementById('game-over-screen').style.display = 'none';
    let heroImg = document.getElementById('hero-img'); 
    if(heroImg) { heroImg.src = `${heroes[selectedHeroIdx].folder}/hero.png`; heroImg.classList.remove('ssr-glow'); }
    updateHP(); nextTask();
}

function updateHP() {
    let pHPText = document.getElementById('prince-hp'); let dHPText = document.getElementById('dragon-hp');
    if(pHPText) pHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, pHP)}`;
    if(dHPText) dHPText.innerHTML = `<span style="color:#ff6b6b">💖</span> ${Math.max(0, dHP)}`;
    if(pHP <= 0 && !isWait) { 
        isWait = true; 
        bgm.pause(); 
        failBgm.play().catch(e => {}); 
        let heroImg = document.getElementById('hero-img'); if(heroImg) heroImg.src = `${heroes[selectedHeroIdx].folder}/dead.png`; 
        let goDelay = (currentLvl === 2) ? 2500 : 1500;
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
    autoRepairDOM();
    
    const dragonImg = document.getElementById('dragon-img'), qImg = document.getElementById('question-img'), container = document.getElementById('game-container'), lvlTag = document.getElementById('level-tag');
    const optCont = document.getElementById('options-container'), spellCont = document.getElementById('spelling-container'), testPanel = document.getElementById('test-panel');

    const isTestMode = window.gachaData && window.gachaData.coins >= 99999;

    if(currentLvl === 2) { 
        if(lvlTag) lvlTag.innerText = "第二關：決戰魔龍";
        if(container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle2.png')";
        if(dragonImg) { dragonImg.dataset.retried = ""; dragonImg.src = "dragon2/dragon.png"; dragonImg.onerror = function() { if(!this.dataset.retried){ this.dataset.retried="true"; this.src = "dragon2/Dragon.png"; } }; dragonImg.style.width = "240px"; }
        if(optCont) optCont.style.display = 'none'; if(spellCont) spellCont.style.display = 'flex';
        if(testPanel) testPanel.style.display = isTestMode ? 'block' : 'none';
    } else {
        if(lvlTag) lvlTag.innerText = "第一關：魔法集氣";
        if(container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle1.png')";
        if(dragonImg) { dragonImg.dataset.retried = ""; dragonImg.src = "dragon1/dragon.png"; dragonImg.onerror = function() { if(!this.dataset.retried){ this.dataset.retried="true"; this.src = "dragon1/Dragon.png"; } }; dragonImg.style.width = "190px"; }
        if(optCont) optCont.style.display = 'grid'; if(spellCont) spellCont.style.display = 'none'; if(testPanel) testPanel.style.display = 'none';
    }
    
    if(currentWordList.length === 0) buildCurrentWordList();
    currentWord = currentWordList[Math.floor(Math.random()*currentWordList.length)];
    let lessonFolder = wordToLessonMap[currentWord] || "lesson1";
    
    if(qImg) {
        qImg.dataset.retried = ""; 
        qImg.src = `wordbank/${lessonFolder}/${currentWord.toLowerCase()}.png`;
        qImg.onerror = function() { if(!this.dataset.retried) { this.dataset.retried = "true"; this.src = `wordbank/${lessonFolder}/${currentWord.toUpperCase()}.png`; } };
    }
    
    if(currentLvl === 1) {
        let opts = [currentWord]; 
        while(opts.length < 4) { let r = currentWordList[Math.floor(Math.random()*currentWordList.length)]; if(!opts.includes(r)) opts.push(r); }
        opts.sort(() => Math.random() - 0.5);
        if(optCont) {
            optCont.innerHTML = "";
            opts.forEach(o => { const b = document.createElement('button'); b.className = 'option-btn'; b.innerText = o.toLowerCase(); b.onclick = () => { if(!isWait) checkChoice(o === currentWord, o); }; optCont.appendChild(b); });
        }
    } else { startSpell(); }
    setTimeout(() => speak(currentWord, 'en'), 300);
}

function forceSkill(skillIdx) {
    if(isWait || dHP <= 0 || pHP <= 0 || currentLvl !== 2) return;
    const hero = heroes[selectedHeroIdx]; let stars = window.gachaData.stars[selectedHeroIdx] || 0;
    let animationSkillIdx = (skillIdx === 3) ? 2 : skillIdx; 
    let damageBaseIndex = (skillIdx === 3) ? 2 : skillIdx;   
    const skillName = (skillIdx === 3) ? hero.skills[3] : hero.skills[skillIdx];

    if(skillIdx === 3) {
        if(stars < 5) { alert("此招式需要該英雄貼紙達到滿星(⭐⭐⭐⭐⭐)才能解鎖喔！"); return; }
        if(window.hasUsedUlt) { alert("⚠️ 招式四(大招)每場戰鬥只能使用一次喔！"); return; }
        window.hasUsedUlt = true; 
    }

    isWait = true; 
    let baseDmg = (skillIdx === 3 && stars >= 5) ? 5 : (hero.baseDmg[damageBaseIndex] || 1); 
    let finalDmg = baseDmg;
    
    let currentCrit = window.critRate || 5;
    window.pendingIsCrit = (Math.random() * 100) < currentCrit;
    if(window.pendingIsCrit) finalDmg *= 2;
    
    dHP -= finalDmg; window.pendingDamageForFeedback = finalDmg; 
    
    if(window.pendingIsCrit) showBattleMsg("🔥 爆擊！雙倍傷害！");
    else showBattleMsg(`【手動施放】${hero.name}：${skillName}！`);
    
    feedback(true, animationSkillIdx); 
    setTimeout(() => { if(dHP <= 0) triggerVictory(); else nextTask(); }, animationSkillIdx >= 2 ? 4500 : 2500); 
}

function checkChoice(isCorrect, selectedWord = null) {
    if(isCorrect) {
        isWait = true; let skillIdx = 0; const hero = heroes[selectedHeroIdx];
        if(currentLvl === 2) { 
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
        window.studyLog[currentWord].success++; 
        localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
        
        if(window.pendingIsCrit) showBattleMsg("🔥 爆擊！雙倍傷害！");
        else showBattleMsg(`${hero.name}：${hero.skills[skillIdx]}！`);
        
        speak(currentWord, 'en'); feedback(true, skillIdx);
        
        setTimeout(() => { if(dHP <= 0) { if(currentLvl === 1) { currentLvl = 2; dHP = 10; nextTask(); updateHP(); } else triggerVictory(); } else nextTask(); }, skillIdx === 2 ? 4500 : 2500);
    } else { 
        window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0}; 
        window.studyLog[currentWord].fail++; 
        localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog)); 
        
        pHP -= (currentLvl === 2 ? 2 : 1); 
        feedback(false); if (currentLvl === 1 && selectedWord) speak(selectedWord, 'en');
    }
}

function startSpell() {
    spellingText = ""; advanceSpellingText(); updateWordDisplay();
    const grid = document.getElementById('letters-grid'); if(grid) grid.innerHTML = "";
    
    let lettersToGuess = currentWord.replace(/[\s-]/g, '').split('').sort(()=>Math.random()-0.5);
    lettersToGuess.forEach(l => {
        const b = document.createElement('button'); b.className = 'letter-btn'; b.innerText = l.toLowerCase(); 
        b.onclick = () => {
            if(isWait || b.classList.contains('letter-correct')) return;
            if(l === currentWord[spellingText.length] || l.toUpperCase() === currentWord[spellingText.length].toUpperCase()) {
                b.classList.add('letter-correct'); spellingText += l; speak(l, 'en'); advanceSpellingText(); updateWordDisplay();
                if(spellingText.length === currentWord.length) checkChoice(true);
            } else { 
                pHP -= (currentLvl === 2 ? 2 : 1); 
                if(currentLvl === 2) speak(currentWord, 'en');
                
                // ★ 修正：第二關死亡時的正確處理流程
                if(pHP <= 0 && currentLvl === 2) {
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
                    showBattleMsg(`正確答案是：${currentWord.toLowerCase()}`);
                    feedback(false);
                    
                    // ★ 直接觸發遊戲結束畫面
                    setTimeout(() => { 
                        if(pHP <= 0) {
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
    hintsLeft--; const hintBtn = document.getElementById('hint-btn'); if(hintBtn) hintBtn.innerText = `🪄 提示 (${hintsLeft}/${window.maxHints})`;
    if(hintsLeft === 0 && hintBtn) { hintBtn.style.opacity = "0.5"; hintBtn.style.cursor = "not-allowed"; hintBtn.disabled = true; }
    const nextChar = currentWord[spellingText.length].toLowerCase(); const btns = document.querySelectorAll('.letter-btn:not(.letter-correct)');
    for(let b of btns) { 
        if(b.innerText.toLowerCase() === nextChar) { 
            b.style.animation = "goldPulse 1s infinite"; b.style.borderColor = "#ffd700"; b.style.background = "#fff9c4"; 
            setTimeout(() => { b.style.animation = ""; b.style.borderColor = "#ffb6c1"; b.style.background = "white"; }, 1500); break; 
        } 
    }
}

function triggerVictory() {
    isWait = true; let tp = document.getElementById('test-panel'); if(tp) tp.style.display = 'none'; bgm.pause(); winBgm.play().catch(e => {});
    
    let roll = Math.random() * 100;
    let earn = 0; let chestName = ''; let chestEmoji = '🎁'; let titleColor = ''; let glowFx = '';
    let chestImgName = ''; 
    
    if(roll < 5) { 
        earn = 50; chestName = '彩色寶箱'; titleColor = '#ff4757'; glowFx = 'animation: rainbowGlow 2s linear infinite; padding: 5px; border-radius: 10px; background: rgba(255,255,255,0.8);'; chestEmoji = '🌈'; 
        chestImgName = 'chest_ssr.png'; 
    } else if(roll < 20) { 
        earn = Math.floor(Math.random()*(30-25+1))+25; chestName = '紫色寶箱'; titleColor = '#8e44ad'; glowFx = 'text-shadow: 0 0 15px #9b59b6;'; chestEmoji = '🟪'; 
        chestImgName = 'chest_sr.png'; 
    } else if(roll < 50) { 
        earn = Math.floor(Math.random()*(20-15+1))+15; chestName = '金色寶箱'; titleColor = '#f39c12'; glowFx = 'text-shadow: 0 0 15px #f1c40f;'; chestEmoji = '🟨'; 
        chestImgName = 'chest_r.png'; 
    } else { 
        earn = Math.floor(Math.random()*(15-10+1))+10; chestName = '一般寶箱'; titleColor = '#7f8c8d'; glowFx = 'text-shadow: 1px 1px 2px #fff;'; chestEmoji = '⬜'; 
        chestImgName = 'chest_n.png'; 
    }
    
    earn += (window.extraCoinsBonus || 0);
    window.gachaData.coins += earn; localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
    
    setTimeout(() => { 
        let vsScreen = document.getElementById('victory-screen'); vsScreen.style.display = 'flex'; 
        vsScreen.style.backgroundImage = `url('assets/bg_main.png')`; 
        let nsd = document.getElementById('new-sticker-display'); 
        
        nsd.innerHTML = `
            <style>
                @keyframes superShake {
                    0%, 100% { transform: translateX(0) scale(1.2); }
                    25% { transform: translateX(-15px) scale(1.2) rotate(-8deg); }
                    50% { transform: translateX(15px) scale(1.2) rotate(8deg); }
                    75% { transform: translateX(-15px) scale(1.2) rotate(-8deg); }
                }
            </style>
            
            <div id="chest-interactive" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; transition: transform 0.2s;">
                <div style="font-size:36px; color:white; font-weight:bold; margin-bottom: 30px; text-shadow: 2px 2px 4px #000;">發現了未知的寶箱！</div>
                <img id="chest-img-target" src="assets/${chestImgName}" onerror="this.outerHTML='<span id=\\'chest-img-target\\' style=\\'font-size:150px;\\'>${chestEmoji}</span>'" style="width:250px; height:250px; object-fit:contain; filter:drop-shadow(0 15px 15px rgba(0,0,0,0.6)); animation: breatheAnim 2s infinite; transition: 0.2s;">
                <div id="chest-click-hint" style="font-size:28px; color:#ffd700; margin-top:20px; animation: goldPulse 1s infinite; font-weight:bold; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;">👇 點擊開啟 👇</div>
            </div>
            
            <div id="chest-result" style="display:none; flex-direction:column; align-items:center;">
                <div style="display:flex; align-items:center; justify-content:center; margin-bottom:15px; ${glowFx}">
                    <img src="assets/${chestImgName}" onerror="this.outerHTML='<span style=\\'font-size:80px; margin-right:15px;\\'>${chestEmoji}</span>'" style="width:120px; height:120px; object-fit:contain; margin-right:20px; filter:drop-shadow(0 10px 10px rgba(0,0,0,0.5));">
                    <div style="font-size:42px; color:${titleColor}; font-weight:bold;">${chestName}！</div>
                </div>
                <div style="font-size:70px; color:#ffd700; text-shadow:0 0 20px #fff; animation:goldPulse 1s infinite;">🪙 +${earn} 代幣</div>
                ${window.extraCoinsBonus > 0 ? `<div style="font-size:24px; color:#2ecc71; margin-top:5px; font-weight:bold;">(包含 N卡加成 +${window.extraCoinsBonus} 🪙)</div>` : ''}
                <div style="font-size:24px; color:white; margin-top:30px; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;">太棒了！快去大廳抽轉蛋吧！</div>
            </div>
        `; 

        let chestInt = document.getElementById('chest-interactive');
        let chestRes = document.getElementById('chest-result');
        let imgTarget = document.getElementById('chest-img-target');
        let hintText = document.getElementById('chest-click-hint');

        if(chestInt && imgTarget) {
            chestInt.onclick = () => {
                chestInt.onclick = null;
                
                imgTarget.style.animation = 'superShake 0.15s infinite';
                imgTarget.style.filter = 'drop-shadow(0 0 40px #ffd700) brightness(1.3)';
                if(hintText) hintText.innerText = "✨ 開啟中... ✨";

                setTimeout(() => {
                    chestInt.style.display = 'none';
                    chestRes.style.display = 'flex';
                    chestRes.style.animation = 'bounceIn 0.5s ease-out';
                }, 1500);
            };
        }
    }, 1500);
}