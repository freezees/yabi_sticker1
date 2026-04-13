// effects.js - 視覺特效與爆擊字體 (最終修復版)

function playGachaSound(isSSR) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'square'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
}

// 傷害顯示器：支援爆擊超大字體特效
function showDamage(isHero, dmgAmount, duration = 1000, isCrit = false) {
    if (dmgAmount <= 0) return;
    let dmg = document.createElement('div'); dmg.className = 'dmg-text'; dmg.innerText = `-${dmgAmount}`;
    dmg.style.bottom = '150px'; if (isHero) dmg.style.left = '20%'; else dmg.style.right = '20%';
    dmg.style.animationDuration = `${duration}ms`;

    // 確保預設文字樣式 (避免被其他 CSS 蓋掉)
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

function showBattleMsg(txt) { 
    const m = document.getElementById('battle-msg'); 
    if(m){ m.innerText = txt; m.style.opacity = 1; setTimeout(() => m.style.opacity = 0, 2000); } 
}

// 核心動畫邏輯回饋
function feedback(isCorrect, skillIdx = 0) {
    const h = document.getElementById('hero-img'), d = document.getElementById('dragon-img'), m = document.getElementById('magic-meteor');
    
    // ★ 修正：去掉 window.，確保能正確抓到你選的角色
    const heroConfig = heroes[selectedHeroIdx]; 
    const battleScene = document.getElementById('battle-scene');
    let dFolder = currentLvl === 1 ? 'dragon1' : 'dragon2'; const targetLvl = currentLvl; 
    let gameContainer = document.getElementById('game-container');
    
    // ★ 安全抓取全域的傷害與爆擊判定 (接軌 combat.js)
    let dmgValue = window.pendingDamageForFeedback || 1;
    let critValue = window.pendingIsCrit || false;

    if(!h || !d || !battleScene || !heroConfig) return; 
    
    if(isCorrect) {
        if(heroConfig.name === '艾德恩') {
            h.classList.add('hero-front');
            if(skillIdx === 0) {
                new Audio(`${heroConfig.folder}/roar.mp3`).play().catch(e => {}); h.src = `${heroConfig.folder}/hero_atk1_1.png`; 
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk1_2.png`; h.classList.add('atk-dash'); new Audio(`${heroConfig.folder}/atk.mp3`).play().catch(e => {}); 
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; 
                        new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); 
                        showDamage(false, dmgValue, 1000, critValue); 
                        updateHP(); 
                    }, 250);
                }, 500);
                setTimeout(() => { h.classList.remove('atk-dash', 'hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 1800);
            } else if(skillIdx === 1) {
                new Audio(`${heroConfig.folder}/roar.mp3`).play().catch(e => {}); h.src = `${heroConfig.folder}/hero_atk2_1.png`; h.style.transition = 'none'; h.style.animation = 'none'; 
                const spawnHurtParticles = (x, y) => { for(let i=0; i<10; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:${x}px; bottom:${y}px; --pdx:${(Math.random()-0.5)*150}px; --pdy:${(Math.random()-0.5)*150}px; animation-delay:${Math.random()*0.1}s;`; battleScene.appendChild(p); setTimeout(()=>p.remove(), 1200); } };
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk2_2.png`; h.style.transform = 'translate(220px, -20px) scale(1.2)'; new Audio(`${heroConfig.folder}/atk2_1.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); spawnHurtParticles(400, 150); setTimeout(()=>d.classList.remove('hurt-shake'), 150); }, 400);
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk2_3.png`; h.style.transform = 'translate(310px, -20px) scaleX(-1.2) scaleY(1.2)'; new Audio(`${heroConfig.folder}/atk2_2.mp3`).play().catch(e => {}); d.style.transform = 'translateX(-20px)'; d.classList.add('hurt-shake'); spawnHurtParticles(430, 150); setTimeout(()=> { d.classList.remove('hurt-shake'); d.style.transform = ''; }, 150); }, 800);
                setTimeout(() => { 
                    h.src = `${heroConfig.folder}/hero_atk2_4.png`; h.style.transform = 'translate(280px, -150px) scale(1.5)'; new Audio(`${heroConfig.folder}/atk2_3.mp3`).play().catch(e => {}); 
                    d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); 
                    d.classList.add('hurt-shake'); spawnHurtParticles(425, 200); 
                    showDamage(false, dmgValue, 1000, critValue); 
                    updateHP(); 
                }, 1200);
                setTimeout(() => { h.style.transform = ''; h.style.transition = '0.3s'; h.style.animation = ''; h.classList.remove('hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 2000);
            } else if(skillIdx >= 2) {
                h.src = `${heroConfig.folder}/hero_atk3_1.png`; h.classList.add('casting-ult'); 
                if(gameContainer) gameContainer.style.position = 'relative'; battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; 
                let darkBg = document.createElement('div'); darkBg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 0, 0, 0.75); z-index:800; pointer-events:none; transition: opacity 0.5s; opacity: 0; border-radius: 20px;';
                if(gameContainer) gameContainer.appendChild(darkBg); else battleScene.appendChild(darkBg); 
                setTimeout(() => darkBg.style.opacity = '1', 50); 
                new Audio(`${heroConfig.folder}/atk3_cast.mp3`).play().catch(e => {}); let thunderSfx = new Audio(`${heroConfig.folder}/thunder_roll.mp3`); thunderSfx.volume=0.6; thunderSfx.play().catch(e => {});
                let mc = document.createElement('img'); mc.src = `${heroConfig.folder}/magic_circle.png`; mc.className = 'ult-magic-circle'; mc.style.zIndex = '2'; battleScene.appendChild(mc);
                const spawnSkyLightning = (x, delay) => { let l = document.createElement('div'); l.className = 'gold-lightning'; l.style.cssText = `--lx:${x}px; --ldelay:${delay}s; z-index: 5;`; l.style.backgroundImage = `url('${heroConfig.folder}/gold_lightning.png')`; battleScene.appendChild(l); setTimeout(()=> l.remove(), 700); };
                spawnSkyLightning(100, 0.2); spawnSkyLightning(250, 0.4); spawnSkyLightning(400, 0.3); spawnSkyLightning(50, 0.6); spawnSkyLightning(450, 0.5);
                let gsGroup = document.createElement('div'); gsGroup.className = 'giant-sword-with-effects'; gsGroup.style.zIndex = '15'; 
                let gs = document.createElement('img'); gs.src = `${heroConfig.folder}/giant_sword.png`; gs.style.cssText = 'width:100%; height:auto; object-fit:contain;'; gsGroup.appendChild(gs);
                let swordLightning = document.createElement('div'); swordLightning.className = 'sword-lightning-wraps'; swordLightning.style.backgroundImage = `url('${heroConfig.folder}/sword_lightning.png')`; gsGroup.appendChild(swordLightning);
                setTimeout(() => battleScene.appendChild(gsGroup), 800);
                setTimeout(() => { h.src = `${heroConfig.folder}/hero_atk3_2.png`; h.classList.add('hero-open-eye'); setTimeout(()=> h.classList.remove('hero-open-eye'), 400); }, 1300);
                setTimeout(() => {
                    new Audio(`${heroConfig.folder}/atk3_hit.mp3`).play().catch(e => {}); let explodeSfx = new Audio(`${heroConfig.folder}/gold_explosion.mp3`); explodeSfx.volume=0.8; explodeSfx.play().catch(e => {});
                    showDamage(false, dmgValue, 3000, critValue); 
                    if(battleScene) battleScene.classList.add('severe-shake');
                    let ex = document.createElement('img'); ex.className = 'gold-explosion-fx'; ex.src = `${heroConfig.folder}/gold_explosion.png`; ex.style.zIndex = '20'; battleScene.appendChild(ex); setTimeout(()=> ex.remove(), 1000);
                    for(let i=0; i<30; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:425px; bottom:150px; --pdx:${(Math.random()-0.5)*250}px; --pdy:${(Math.random()-0.5)*250}px; animation-delay:${Math.random()*0.2}s; z-index:20;`; battleScene.appendChild(p); setTimeout(()=> p.remove(), 1200); }
                    d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; d.classList.add('dragon-shock', 'dragon-front'); new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); 
                    updateHP(); 
                    setTimeout(() => { if(battleScene) battleScene.classList.remove('severe-shake'); d.classList.remove('dragon-shock', 'dragon-front'); }, 1000);
                }, 1500);
                setTimeout(() => { gsGroup.style.transition = 'opacity 0.5s ease-out'; gsGroup.style.opacity = '0'; darkBg.style.opacity = '0'; }, 3200);
                setTimeout(() => { mc.remove(); gsGroup.remove(); darkBg.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; }, 3700);
                setTimeout(() => { h.classList.remove('casting-ult', 'hero-front'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, 4500);
            }
        } 
        else if(heroConfig.name === '米拉') {
            if(skillIdx === 0) { 
                new Audio(`${heroConfig.folder}/atk1_1.mp3`).play().catch(e => {}); h.src = `${heroConfig.folder}/hero_atk1_1.png`; 
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk1_2.png`; new Audio(`${heroConfig.folder}/atk1_2.mp3`).play().catch(e => {});
                    let b = document.createElement('img'); b.src = `${heroConfig.folder}/bubble_stream.png`;
                    b.style.cssText = 'position:absolute; top:110px; left:120px; width:200px; z-index:110; animation: bubblePassAnim 1s linear forwards;'; battleScene.appendChild(b);
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); 
                        showDamage(false, dmgValue, 1000, critValue); 
                        updateHP(); 
                    }, 400); 
                    setTimeout(() => b.remove(), 1000);
                }, 300);
            } else if(skillIdx === 1) { 
                new Audio(`${heroConfig.folder}/atk2_1.mp3`).play().catch(e => {}); h.src = `${heroConfig.folder}/hero_atk2_1.png`; 
                let c = document.createElement('img'); c.src = `${heroConfig.folder}/coral_reef.png`;
                c.style.cssText = 'position:absolute; bottom:10px; right:40px; width:180px; z-index:105; animation: goldPulse 1s forwards;'; battleScene.appendChild(c);
                setTimeout(() => {
                    h.src = `${heroConfig.folder}/hero_atk2_2.png`; new Audio(`${heroConfig.folder}/atk2_2.mp3`).play().catch(e => {});
                    let w = document.createElement('img'); w.src = `${heroConfig.folder}/wave_crash.png`;
                    w.style.cssText = 'position:absolute; bottom:20px; left:80px; width:150px; z-index:115; animation: waveTsunamiAnim 1s ease-in forwards; transform-origin: bottom center;'; 
                    battleScene.appendChild(w);
                    setTimeout(() => { 
                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); 
                        showDamage(false, dmgValue, 1000, critValue); 
                        updateHP(); 
                        setTimeout(() => { c.remove(); w.remove(); }, 600); 
                    }, 500); 
                }, 600);
            } else if(skillIdx >= 2) { 
                const ca = document.getElementById('sfx-magic-custom'); if(ca) { ca.src = heroConfig.magicAudio; ca.play().catch(e => {}); }
                new Audio(`${heroConfig.folder}/atk3_1.mp3`).play().catch(e => {});
                if(gameContainer) gameContainer.style.position = 'relative'; if(battleScene) { battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; }
                let ob = document.createElement('div'); ob.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 30, 80, 0.75); z-index:800; pointer-events:none; animation: castAnim 3s forwards; border-radius: 20px;'; 
                if(gameContainer) gameContainer.appendChild(ob); else battleScene.appendChild(ob);
                h.src = `${heroConfig.folder}/hero_atk3_1.png`; h.classList.add('atk-glow'); 
                let sd = 0, iv = 110;
                setTimeout(() => { let mc = document.createElement('img'); mc.src = `${heroConfig.folder}/magic_circle.png`; mc.id = 'temp-magic-circle'; mc.style.cssText = 'position:absolute; bottom:20px; left:20px; width:180px; z-index:2; animation: magicCircleAnim 2.5s ease-in forwards;'; battleScene.appendChild(mc); }, 800);
                for(let i = 0; i < 30; i++) { setTimeout(() => { let b = document.createElement('img'); b.src = `${heroConfig.folder}/water_ball.png`; b.style.cssText = `position:absolute; bottom:0px; left:${10 + Math.random() * 80}%; width:45px; z-index:15; animation: waterBallShoot 0.8s linear forwards;`; battleScene.appendChild(b); let bs = new Audio(`${heroConfig.folder}/water_ball.mp3`); bs.volume = 0.5; bs.play().catch(e => {}); setTimeout(() => b.remove(), 800); }, sd); sd += iv; iv = Math.max(15, iv - 4); }
                setTimeout(() => {
                    let wh = document.createElement('img'); wh.src = `${heroConfig.folder}/spirit_whale.png`; 
                    wh.style.cssText = `position:absolute; bottom: -2000px; left: 50%; transform: translateX(-50%) scale(2.5); width:100%; height: auto; z-index:950; opacity:0.9; transition: transform 2s ease-in-out;`; 
                    if(gameContainer) gameContainer.appendChild(wh); else battleScene.appendChild(wh); 
                    if(ca) { ca.currentTime = 0; ca.play().catch(e => {}); }
                    setTimeout(() => {
                        let moveDistance = gameContainer.offsetHeight + 4000; wh.style.transform = `translateY(-${moveDistance}px) translateX(-50%) scale(2.5)`; 
                        setTimeout(() => { 
                            h.classList.remove('atk-glow'); h.src = `${heroConfig.folder}/hero_atk3_2.png`; h.classList.add('atk-dash'); 
                            new Audio(`${heroConfig.folder}/atk3_2.mp3`).play().catch(e => {}); d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); 
                            showDamage(false, dmgValue, 3000, critValue); 
                            updateHP();
                            setTimeout(() => { try { wh.remove(); ob.remove(); let mc = document.getElementById('temp-magic-circle'); if(mc) mc.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; } catch(e){} }, 1000); 
                        }, 1200); 
                    }, 50); 
                }, sd + 200); 
            }
            setTimeout(() => { h.classList.remove('atk-dash', 'atk-jump', 'atk-spin', 'atk-glow', 'hurt-shake'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } }, (skillIdx >= 2 ? 3500 : (skillIdx === 1 ? 2500 : 1500)));
        } 
        else {
            h.src = `${heroConfig.folder}/hero_atk${skillIdx > 2 ? 3 : skillIdx + 1}.png`; h.classList.add(heroConfig.anims[skillIdx > 2 ? 2 : skillIdx]);
            if(skillIdx === 0) new Audio(`${heroConfig.folder}/atk.mp3`).play().catch(e => {}); else if(skillIdx === 1) new Audio(`${heroConfig.folder}/atk2.mp3`).play().catch(e => {});
            if(skillIdx >= 2) {
                let ca = document.getElementById('sfx-magic-custom');
                if(heroConfig.magicAudio && ca) { ca.src = heroConfig.magicAudio; ca.play().catch(e => {}); } else { let sm = document.getElementById('sfx-meteor'); if(sm) sm.play().catch(e => {}); }
                if(m) { m.src = heroConfig.magicImg || 'assets/meteor.png'; setTimeout(() => { m.classList.add(heroConfig.magicAnim || 'meteor-anim'); m.dataset.currentAnim = heroConfig.magicAnim || 'meteor-anim'; }, 200); }
            }
            let hitDelay = heroConfig.anims[skillIdx > 2 ? 2 : skillIdx] === 'atk-dash' ? 250 : 800;
            setTimeout(() => { 
                d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; new Audio(`${dFolder}/hurt.mp3`).play().catch(e => {}); d.classList.add('hurt-shake'); 
                showDamage(false, dmgValue, skillIdx >= 2 ? 3000 : 1000, critValue); 
                updateHP(); 
            }, hitDelay);
            setTimeout(() => { h.classList.remove('atk-dash', 'atk-jump', 'atk-spin', 'atk-glow', 'hurt-shake'); if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; if (currentLvl === targetLvl) { d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; } if (m && m.dataset.currentAnim) m.classList.remove(m.dataset.currentAnim); }, 2200);
        }
    } else {
        h.src = pHP <= 0 ? `${heroConfig.folder}/dead.png` : `${heroConfig.folder}/hurt.png`; d.src = `${dFolder}/atk.png`; new Audio(`${dFolder}/atk.mp3`).play().catch(e => {}); d.classList.add('dragon-atk');
        setTimeout(() => { 
            h.classList.add('hurt-shake'); try{document.getElementById('hero-hurt-sfx').play().catch(e=>{});}catch(e){} 
            showDamage(true, currentLvl === 2 ? 2 : 1, 1000, false); 
            updateHP();          
        }, 300);
        setTimeout(() => { h.classList.remove('hurt-shake'); d.classList.remove('dragon-atk'); if (currentLvl === targetLvl && dHP > 0) d.src = `${dFolder}/dragon.png`; if (pHP > 0) h.src = `${heroConfig.folder}/hero.png`; }, 1200);
    }
}