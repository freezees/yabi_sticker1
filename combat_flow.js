// combat_flow.js - 負責關卡推進、拼字邏輯、魔龍大絕與寶箱結算

window.nextTask = function() {
    if (dHP <= 0 || pHP <= 0) return; 
    isWait = false;
    
    const dragonImg = document.getElementById('dragon-img');
    const qImg = document.getElementById('question-img');
    const container = document.getElementById('game-container');
    const lvlTag = document.getElementById('level-tag');
    const optCont = document.getElementById('options-container');
    const spellCont = document.getElementById('spelling-container');
    const testPanel = document.getElementById('test-panel');
    const isTestMode = window.gachaData && window.gachaData.coins >= 99999;

    if (currentLvl === 3) {
        if (lvlTag) lvlTag.innerText = "第三關：聽音盲拼";
        if (container) container.style.backgroundImage = "url('assets/bg_battle3.png')";
        if (dragonImg) { 
            dragonImg.dataset.retried = ""; 
            dragonImg.src = "dragon3/dragon.png"; 
            dragonImg.onerror = function() { 
                if (!this.dataset.retried) { 
                    this.dataset.retried = "true"; 
                    this.src = "dragon3/Dragon.png"; 
                } 
            }; 
            dragonImg.style.width = "180px"; 
        }
        if (optCont) optCont.style.display = 'none'; 
        if (spellCont) spellCont.style.display = 'flex';
        if (testPanel) testPanel.style.display = isTestMode ? 'block' : 'none';
        if (qImg) { 
            qImg.style.transition = "filter 0.5s"; 
            qImg.style.filter = "brightness(0) drop-shadow(0 0 15px rgba(255,255,255,0.8))"; 
        }
    } else if (currentLvl === 2) {
        if (lvlTag) lvlTag.innerText = "第二關：決戰魔龍";
        if (container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle2.png')";
        if (dragonImg) { 
            dragonImg.dataset.retried = ""; 
            dragonImg.src = "dragon2/dragon.png"; 
            dragonImg.onerror = function() { 
                if (!this.dataset.retried) { 
                    this.dataset.retried = "true"; 
                    this.src = "dragon2/Dragon.png"; 
                } 
            }; 
            dragonImg.style.width = "240px"; 
        }
        if (optCont) optCont.style.display = 'none'; 
        if (spellCont) spellCont.style.display = 'flex';
        if (testPanel) testPanel.style.display = isTestMode ? 'block' : 'none';
        if (qImg) qImg.style.filter = "none";
    } else {
        if (lvlTag) lvlTag.innerText = "第一關：魔法集氣";
        if (container) container.style.backgroundImage = "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('assets/bg_battle1.png')";
        if (dragonImg) { 
            dragonImg.dataset.retried = ""; 
            dragonImg.src = "dragon1/dragon.png"; 
            dragonImg.onerror = function() { 
                if (!this.dataset.retried) { 
                    this.dataset.retried = "true"; 
                    this.src = "dragon1/Dragon.png"; 
                } 
            }; 
            dragonImg.style.width = "190px"; 
        }
        if (optCont) optCont.style.display = 'grid'; 
        if (spellCont) spellCont.style.display = 'none'; 
        if (testPanel) testPanel.style.display = 'none';
        if (qImg) qImg.style.filter = "none";
    }
    
    if (typeof updateRageMeterUI === 'function') updateRageMeterUI();

    try {
        if (!window.currentWordList || window.currentWordList.length === 0) {
            window.currentWordList = ["apple", "banana", "cat", "dog"];
        }
        currentWord = currentWordList[Math.floor(Math.random() * currentWordList.length)];
        window.hasLoggedMistake = false;
        let lessonFolder = (typeof wordToLessonMap !== 'undefined' && wordToLessonMap[currentWord]) ? wordToLessonMap[currentWord] : "lesson1";
        
        if (qImg) {
            qImg.dataset.retried = "";
            qImg.src = `wordbank/${lessonFolder}/${currentWord.toLowerCase()}.png`;
            qImg.onerror = function() { 
                if (!this.dataset.retried) { 
                    this.dataset.retried = "true"; 
                    this.src = `wordbank/${lessonFolder}/${currentWord.toUpperCase()}.png`; 
                } 
            };
        }
        
        if (currentLvl === 1) {
            let opts = [currentWord];
            let availableWords = currentWordList.filter(w => w !== currentWord);
            availableWords.sort(() => Math.random() - 0.5);
            opts = opts.concat(availableWords.slice(0, 3));
            opts.sort(() => Math.random() - 0.5);
            
            if (optCont) {
                optCont.innerHTML = "";
                opts.forEach(o => {
                    const b = document.createElement('button');
                    b.className = 'option-btn';
                    b.innerText = o.toLowerCase();
                    b.onclick = () => { 
                        if (!isWait) checkChoice(o === currentWord, o); 
                    };
                    optCont.appendChild(b);
                });
            }
        } else {
            startSpell();
        }
        
        setTimeout(() => { 
            if (typeof speak === 'function') speak(currentWord, 'en'); 
        }, 300);
        
    } catch (error) {
        console.error("nextTask 錯誤：", error);
    }
}

window.forceSkill = function(skillIdx) {
    if (isWait || dHP <= 0 || pHP <= 0 || currentLvl === 1 || skillIdx === 3) return;
    const heroData = heroes[selectedHeroIdx];
    const currentHeroModule = window.HeroRegistry ? window.HeroRegistry[heroData.id] : null;

    isWait = true;
    let finalDmg = heroData.baseDmg[skillIdx] || 1;
    let currentCrit = window.critRate || 5;
    window.pendingIsCrit = (Math.random() * 100) < currentCrit;
    if (window.pendingIsCrit) finalDmg *= 2;

    dHP -= finalDmg;
    window.pendingDamageForFeedback = finalDmg;

    if (window.pendingIsCrit && typeof showBattleMsg === 'function') {
        showBattleMsg("🔥 爆擊！雙倍傷害！");
    } else if (typeof showBattleMsg === 'function') {
        showBattleMsg(`【手動施放】${heroData.name}：${heroData.skills[skillIdx]}！`);
    }

    if (currentHeroModule && currentHeroModule.playAttackAnimation) {
        currentHeroModule.playAttackAnimation(skillIdx, finalDmg, window.pendingIsCrit, currentLvl);
    }

    setTimeout(() => {
        if (dHP <= 0) {
            if (currentLvl === 2) {
                if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ 終極積木魔王降臨！進入第三關！");
                
                window.charmMistakesLeft = 0;

                setTimeout(() => { 
                    currentLvl = 3; 
                    dHP = (window.gachaData && window.gachaData.coins >= 99999) ? 20 : 15; 
                    nextTask(); 
                    updateHP(); 
                }, 2000);
            } else {
                triggerVictory(2, false);
            }
        } else {
            nextTask();
        }
    }, skillIdx >= 2 ? 4500 : 2500);
}

window.startSpell = function() {
    spellingText = ""; 
    advanceSpellingText(); 
    updateWordDisplay();
    const grid = document.getElementById('letters-grid'); 
    if (grid) grid.innerHTML = "";
    
    let lettersToGuess = currentWord.replace(/[\s-]/g, '').split('').sort(() => Math.random() - 0.5);
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
            if (isWait || b.classList.contains('letter-correct')) return;
            
            if (l === currentWord[spellingText.length] || l.toUpperCase() === currentWord[spellingText.length].toUpperCase()) {
                b.classList.add('letter-correct'); 
                spellingText += l; 
                if (typeof speak === 'function') speak(l, 'en'); 
                advanceSpellingText(); 
                updateWordDisplay();
                if (spellingText.length === currentWord.length) {
                    checkChoice(true);
                }
            } else {
                b.style.animation = "wrongLetterShake 0.4s ease";
                setTimeout(() => { 
                    if (b && !b.classList.contains('letter-correct')) {
                        b.style.animation = ""; 
                    }
                }, 400);
                
                if (currentLvl >= 2 && typeof speak === 'function') speak(currentWord, 'en');

                window.studyLog[currentWord] = window.studyLog[currentWord] || {success: 0, fail: 0};
                if (!window.hasLoggedMistake) {
                    window.studyLog[currentWord].fail++;
                    window.hasLoggedMistake = true;
                    localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
                }

                // ==========================================
                // 🌟 魅惑狀態攔截系統 (加入音效與噴愛心特效)
                // ==========================================
                if (window.charmMistakesLeft && window.charmMistakesLeft > 0) {
                    window.charmMistakesLeft--; 
                    
                    if (typeof showBattleMsg === 'function') {
                        showBattleMsg(`😍 龍被魅惑了！攻擊無效！(剩餘 ${window.charmMistakesLeft} 次)`);
                    }

                    // 🌟 答錯時噴出閃爍的大愛心與攻擊音效！
                    let battleScene = document.getElementById('battle-scene');
                    if (battleScene) {
                        try { playSfx(`hero3/atk2.mp3`, 0.8); } catch(e){} // 🌟 播放露娜第二招的攻擊音效

                        let charmBlockHeart = document.createElement('img');
                        charmBlockHeart.src = `hero3/heart.png`; 
                        let pTop = currentLvl === 2 ? '40px' : '20px';
                        let pRight = currentLvl === 2 ? '80px' : '50px';
                        
                        charmBlockHeart.style.cssText = `position:absolute; top:${pTop}; right:${pRight}; width:150px; z-index:115; animation: pulseBigHeart 0.6s infinite; pointer-events:none;`;
                        battleScene.appendChild(charmBlockHeart);

                        setTimeout(() => {
                            charmBlockHeart.style.transition = "all 0.5s ease-out";
                            charmBlockHeart.style.transform = "scale(3)";
                            charmBlockHeart.style.opacity = "0";
                            setTimeout(() => charmBlockHeart.remove(), 500);
                        }, 800); 
                    }
                    
                    if (window.charmMistakesLeft <= 0) {
                        let d = document.getElementById('dragon-img');
                        let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
                        if (d && dHP > 0) {
                            d.src = `${dFolder}/dragon.png`;
                            d.style.animation = "hurt-shake 0.4s ease"; 
                            setTimeout(() => { d.style.animation = ""; }, 400);
                        }
                        if (typeof showBattleMsg === 'function') showBattleMsg(`💔 魅惑解除了！魔龍清醒了！`);
                    }
                    
                    return; 
                }
                // ==========================================
                
                if (currentLvl === 3) {
                    window.dragonRage++;
                    if (typeof updateRageMeterUI === 'function') updateRageMeterUI();
                    if (window.dragonRage >= 3) {
                        if (typeof performLegoStormUlt === 'function') performLegoStormUlt();
                        return;
                    }
                }

                const heroData = heroes[selectedHeroIdx];
                const currentHeroModule = window.HeroRegistry ? window.HeroRegistry[heroData.id] : null;
                const stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
                
                let isBlocked = false;
                if (currentHeroModule && currentHeroModule.onPetBlock) {
                    isBlocked = currentHeroModule.onPetBlock(currentLvl);
                }
                if (isBlocked) return;
                
                if (currentHeroModule && currentHeroModule.onDamagedPassive) {
                    currentHeroModule.onDamagedPassive();
                }

                let dmgAmount = (currentLvl === 2 ? 2 : 1);
                pHP -= dmgAmount;
                
                const correctChar = currentWord[spellingText.length].toLowerCase();
                if (currentHeroModule && currentHeroModule.onWrongSpell) {
                    currentHeroModule.onWrongSpell(correctChar, currentLvl, stars);
                }
                if (typeof feedback === 'function') feedback(false);
                
                let d = document.getElementById('dragon-img');
                let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
                if (d) {
                    d.src = `${dFolder}/atk.png`;
                    try { playSfx(`${dFolder}/atk.mp3`); } catch(e){}
                    d.classList.add('dragon-atk');
                    
                    setTimeout(() => {
                        d.classList.remove('dragon-atk');
                        if (dHP > 0 && window.dragonRage < 3) d.src = `${dFolder}/dragon.png`;
                    }, 1200);
                }

                if (currentHeroModule && currentHeroModule.playHurtAnimation) {
                    currentHeroModule.playHurtAnimation(dmgAmount);
                }
                
                if (typeof updateHP === 'function') updateHP();
                
                if (pHP <= 0 && currentLvl >= 2) {
                    isWait = true;
                    let wd = document.getElementById('word-display');
                    if (wd) {
                        wd.innerText = currentWord.toLowerCase();
                        wd.style.cssText = 'color: #ff4757; font-size: 36px; font-weight: bold; text-shadow: 0 0 10px #ff4757;';
                    }
                    if (typeof showBattleMsg === 'function') showBattleMsg(`正確答案是：${currentWord.toLowerCase()}`);
                }
            }
        };
        if (grid) grid.appendChild(b);
    });
    
    let btnContainer = document.getElementById('spell-btn-container');
    if (!btnContainer) {
        btnContainer = document.createElement('div'); 
        btnContainer.id = 'spell-btn-container'; 
        btnContainer.style.display = 'flex'; 
        btnContainer.style.gap = '15px'; 
        btnContainer.style.marginTop = '20px';
        let sc = document.getElementById('spelling-container'); 
        if (sc) sc.appendChild(btnContainer);
    }
    
    let readBtn = document.getElementById('read-spell-btn');
    if (!readBtn) {
        readBtn = document.createElement('button'); 
        readBtn.id = 'read-spell-btn'; 
        readBtn.innerHTML = '🔊 讀出拼音'; 
        readBtn.style.cssText = 'background: #a29bfe; border: 3px solid #8e44ad; border-radius: 20px; padding: 10px 20px; color: white; font-size: 16px; font-weight: bold; cursor: pointer;';
        readBtn.onclick = () => { 
            let t = spellingText.replace(/[\s-]/g, '').trim(); 
            if (t.length > 0 && typeof speak === 'function') speak(t, 'en'); 
        }; 
        btnContainer.appendChild(readBtn);
    }
    
    let hintBtn = document.getElementById('hint-btn');
    if (!hintBtn) {
        hintBtn = document.createElement('button'); 
        hintBtn.id = 'hint-btn'; 
        hintBtn.style.cssText = 'background: #ffeaa7; border: 3px solid #fdcb6e; border-radius: 20px; padding: 10px 20px; color: #d35400; font-size: 16px; font-weight: bold; cursor: pointer;';
        hintBtn.onclick = showHint; 
        btnContainer.appendChild(hintBtn);
    }
    
    let maxH = (typeof getHeroMaxHints === 'function') ? getHeroMaxHints() : 3;
    hintBtn.innerText = `🪄 提示 (${hintsLeft}/${maxH})`;
    if (hintsLeft > 0) { 
        hintBtn.style.opacity = "1"; 
        hintBtn.style.cursor = "pointer"; 
        hintBtn.disabled = false; 
    } else { 
        hintBtn.style.opacity = "0.5"; 
        hintBtn.style.cursor = "not-allowed"; 
        hintBtn.disabled = true; 
    }
}

window.advanceSpellingText = function() { 
    while (spellingText.length < currentWord.length && (currentWord[spellingText.length] === ' ' || currentWord[spellingText.length] === '-')) {
        spellingText += currentWord[spellingText.length]; 
    }
}

window.updateWordDisplay = function() {
    let dHTML = "";
    for (let i = 0; i < currentWord.length; i++) { 
        if (i < spellingText.length || currentWord[i] === ' ' || currentWord[i] === '-') {
            dHTML += currentWord[i].toLowerCase() + " "; 
        } else {
            dHTML += "_ "; 
        }
    }
    let wd = document.getElementById('word-display'); 
    if (wd) wd.innerText = dHTML;
}

window.showHint = function() {
    if (isWait || hintsLeft <= 0) return;
    hintsLeft--;
    
    if (currentLvl === 3) {
        const qImg = document.getElementById('question-img');
        if (qImg) { 
            qImg.style.filter = "none"; 
            if (typeof showBattleMsg === 'function') showBattleMsg("✨ 黑影魔法解解除了！"); 
        }
    }
    
    const hintBtn = document.getElementById('hint-btn'); 
    let maxH = (typeof getHeroMaxHints === 'function') ? getHeroMaxHints() : 3;
    if (hintBtn) hintBtn.innerText = `🪄 提示 (${hintsLeft}/${maxH})`;
    if (hintsLeft === 0 && hintBtn) { 
        hintBtn.style.opacity = "0.5"; 
        hintBtn.style.cursor = "not-allowed"; 
        hintBtn.disabled = true; 
    }
    
    const nextChar = currentWord[spellingText.length].toLowerCase();
    highlightNextLetter(nextChar, 2000);
}

window.highlightNextLetter = function(correctChar, duration = 3000) {
    const btns = document.querySelectorAll('.letter-btn:not(.letter-correct)');
    for (let btn of btns) {
        if (btn.innerText.toLowerCase() === correctChar) {
            btn.style.animation = "redLightPulse 1.5s infinite";
            setTimeout(() => { 
                if (!btn.classList.contains('letter-correct')) {
                    btn.style.animation = ""; 
                }
            }, duration);
            break;
        }
    }
}

window.initRageMeter = function() {
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

window.updateRageMeterUI = function() {
    let meterCont = document.getElementById('dragon-rage-container');
    let fill = document.getElementById('dragon-rage-fill');
    if (!meterCont || !fill) return;

    if (currentLvl === 3) {
        meterCont.style.display = 'block';
        let percentage = (window.dragonRage / 3) * 100;
        fill.style.width = percentage + '%';
        if (window.dragonRage === 0) fill.style.backgroundColor = '#2ecc71';
        else if (window.dragonRage === 1) fill.style.backgroundColor = '#f1c40f';
        else if (window.dragonRage === 2) fill.style.backgroundColor = '#e67e22';
        else fill.style.backgroundColor = '#ff4757';
    } else {
        meterCont.style.display = 'none';
    }
}

window.performLegoStormUlt = function() {
    const d = document.getElementById('dragon-img');
    const battleScene = document.getElementById('battle-scene');
    const meterCont = document.getElementById('dragon-rage-container');
    if (!d || !battleScene) return;

    isWait = true;
    let dFolder = 'dragon3';
    if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ ⚠️ ⚠️ 樂高龍暴怒了！警告！⚠️ ⚠️ ⚠️");
    if (meterCont) meterCont.style.animation = "rageBlink 0.3s infinite";
    
    // 第一階段：生氣踏地
    d.src = `${dFolder}/angry_stomp.png`;
    d.classList.add('dragon-stomp-anim');
    try { playSfx(`${dFolder}/angry.mp3`, 1.0); } catch(e){} 

    setTimeout(() => {
        if (pHP <= 0) return;
        d.classList.remove('dragon-stomp-anim');
        d.src = `${dFolder}/ult_atk.png`;
        if (typeof showBattleMsg === 'function') showBattleMsg("⚠️ 核心能量集束中... 快閃啊！");

        // 第二階段：集氣
        let chargeBall = document.createElement('img');
        chargeBall.src = `${dFolder}/charge_ball.png`;
        chargeBall.className = 'lego-charge-ball';
        battleScene.appendChild(chargeBall);
        try { playSfx(`${dFolder}/charge.mp3`, 0.8); } catch(e){} 

        setTimeout(() => { 
            if (chargeBall) chargeBall.remove(); 
        }, 2000);

        setTimeout(() => {
            if (pHP <= 0) return;
            if (meterCont) meterCont.style.animation = "";
            window.dragonRage = 0; 
            if (typeof updateRageMeterUI === 'function') updateRageMeterUI();

            // 準備施放風暴
            try { playSfx(`${dFolder}/atk.mp3`, 1.0); } catch(e){}

            const legoImgs = ['dragon3/lego1.png', 'dragon3/lego2.png', 'dragon3/lego3.png'];
            let totalLegos = 60, currentLegoCount = 0;

            // 第三階段：樂高風暴發射
            let stormInterval = setInterval(() => {
                if (currentLegoCount >= totalLegos || pHP <= 0) {
                    clearInterval(stormInterval);
                    
                    try { playSfx(`${dFolder}/explosion.mp3`, 0.8); } catch(e){}
                    
                    d.className = 'character-img-dragon';
                    
                    if (dHP > 0 && currentLvl === 3) d.src = `${dFolder}/dragon.png`;
                    
                    let ultDamage = 3; 
                    pHP -= ultDamage;
                    
                    const heroData = heroes[selectedHeroIdx];
                    const currentHeroModule = window.HeroRegistry ? window.HeroRegistry[heroData.id] : null;
                    if (currentHeroModule && currentHeroModule.playHurtAnimation) {
                        currentHeroModule.playHurtAnimation(ultDamage); 
                    }
                    
                    if (typeof updateHP === 'function') updateHP();

                    if (pHP > 0) { 
                        isWait = false; 
                    } else {
                        isWait = true;
                        let wd = document.getElementById('word-display');
                        if (wd) { 
                            wd.innerText = currentWord.toLowerCase(); 
                            wd.style.color = '#ff4757'; 
                        }
                        if (typeof showBattleMsg === 'function') {
                            showBattleMsg(`正確答案是：${currentWord.toLowerCase()}`);
                        }
                    }
                    return;
                }

                // 產生單顆飛出的樂高積木
                let lego = document.createElement('img');
                lego.src = legoImgs[Math.floor(Math.random() * legoImgs.length)];
                let size = 15 + Math.random() * 45;
                let duration = 0.4 + Math.random() * 0.3;
                
                lego.style.cssText = `
                    position: absolute; top: 150px; right: 200px; width: ${size}px; z-index: 9999; pointer-events: none;
                    --burstX: ${(Math.random() * 20 - 10) + 40}px; --burstY: ${(Math.random() * 20 - 10) + 20}px; --burstR: ${Math.random() * 360}deg;
                    --ldx: ${-1200 - Math.random() * 500}px; --ldy: ${-400 + Math.random() * 900}px; --ls: ${0.6 + Math.random() * 1.0};
                    animation: legoRadialShoot ${duration}s ease-in forwards;
                `;
                battleScene.appendChild(lego);
                if (currentLegoCount % 6 === 0) {
                    try { playSfx(`${dFolder}/shoot.mp3`, 0.4); } catch(e){}
                }
                setTimeout(() => lego.remove(), duration * 1000);
                currentLegoCount++;
            }, 15);
        }, 2000);
    }, 2000);
}

window.calculateChestReward = function(multiplier) {
    let roll = Math.random() * 100;
    let baseEarn = 0, chestName = '', chestEmoji = '🎁', titleColor = '', glowFx = '', chestImgName = '';
    
    if (roll < 5) {
        baseEarn = 50; chestName = '彩色寶箱'; titleColor = '#ff4757';
        glowFx = 'animation: rainbowGlow 2s linear infinite; padding: 5px; border-radius: 10px; background: rgba(255,255,255,0.8);';
        chestEmoji = '🌈'; chestImgName = 'chest_ssr.png';
    } else if (roll < 20) {
        baseEarn = 25; chestName = '紫色寶箱'; titleColor = '#8e44ad';
        glowFx = 'text-shadow: 0 0 15px #9b59b6;';
        chestEmoji = '🟪'; chestImgName = 'chest_sr.png';
    } else if (roll < 50) {
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

window.renderVictoryScreen = function(reward, isConsolation, isDouble) {
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

    let vsScreen = document.getElementById('victory-screen');
    vsScreen.style.display = 'flex';
    
    let nsd = document.getElementById('new-sticker-display');
    nsd.innerHTML = `
        <div id="chest-interactive" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; transition: transform 0.2s;">
            <div style="font-size:36px; color:white; font-weight:bold; margin-bottom: 30px; text-shadow: 2px 2px 4px #000;">${isDouble ? '發現了兩個未知的寶箱！' : '發現了未知的寶箱！'}</div>
            ${chestInteractiveImgs}
            <div id="chest-click-hint" style="font-size:28px; color:#ffd700; margin-top:20px; animation: goldPulse 1s infinite; font-weight:bold; background: rgba(0,0,0,0.5); padding: 10px 20px; border-radius: 20px;">👇 點擊開啟 👇</div>
        </div>
        
        <div id="chest-result" style="display:none; flex-direction:column; align-items:center;">
            <div style="font-size:42px; color:${reward.titleColor}; font-weight:bold;">${isDouble ? '雙倍' : ''}${reward.chestName}！</div>
            <div style="font-size:65px; color:#ffd700; text-shadow:0 0 20px #fff; display:flex; align-items:baseline; justify-content:center;">
                ${coinDisplayHtml}
            </div>
            ${isDouble ? `<div style="font-size:30px; color:#ff4757; font-weight:bold; margin-top:10px;">🔥 第三關挑戰成功！ 🔥</div>` : ''}
            <div style="font-size:22px; color:white; margin-top:25px;">${mainMsg}</div>
        </div>
    `;

    let chestInt = document.getElementById('chest-interactive');
    let chestRes = document.getElementById('chest-result');
    let targets = document.querySelectorAll('.chest-img-target');

    if (chestInt && targets.length > 0) {
        chestInt.onclick = () => {
            chestInt.onclick = null;
            targets.forEach(imgTarget => {
                imgTarget.style.animation = 'superShakeChest 0.15s infinite';
                imgTarget.style.filter = 'drop-shadow(0 0 40px #ffd700) brightness(1.3)';
            });
            setTimeout(() => {
                chestInt.style.display = 'none';
                chestRes.style.display = 'flex';
                chestRes.style.animation = 'bounceIn 0.5s ease-out';
            }, 1500);
        };
    }
}

window.triggerVictory = function(multiplier = 1, isConsolation = false) {
    isWait = true;
    let tp = document.getElementById('test-panel'); 
    if (tp) tp.style.display = 'none';
    if (typeof bgm !== 'undefined') bgm.pause();
    
    if (isConsolation && typeof failBgm !== 'undefined') failBgm.play().catch(e => {});
    else if (typeof winBgm !== 'undefined') winBgm.play().catch(e => {});
    
    const reward = calculateChestReward(multiplier);
    
    if (window.gachaData) {
        window.gachaData.coins += reward.totalEarn;
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
    }

    window.charmMistakesLeft = 0;
    
    setTimeout(() => { 
        renderVictoryScreen(reward, isConsolation, multiplier > 1); 
    }, 1500);
}