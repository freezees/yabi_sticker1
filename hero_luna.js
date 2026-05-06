window.HeroRegistry = window.HeroRegistry || {};

window.HeroRegistry['hero3'] = {
    id: 'hero3',
    name: '露娜',
    folder: 'hero3',
    
    styles: `
        /* ---------------- 第一、二招的動畫 ---------------- */
        @keyframes heartBeamAnim { 0% { transform: scale(0.5); opacity: 0; } 50% { transform: scale(1.5) translateX(80px); opacity: 1; filter: drop-shadow(0 0 15px #ff6b81); } 100% { transform: scale(2) translateX(150px); opacity: 0; } }
        @keyframes bigHeartShoot { 0% { transform: translate(0, 0) scale(1); opacity: 1; filter: drop-shadow(0 0 15px #ff6b81); } 50% { transform: translate(100px, -20px) scale(1.2); filter: drop-shadow(0 0 30px #ff6b81); } 100% { transform: translate(200px, 0) scale(0.5); opacity: 0; } }
        @keyframes pulseBigHeart { 0% { transform: scale(1); filter: drop-shadow(0 0 15px #ff6b81); } 50% { transform: scale(1.3); filter: drop-shadow(0 0 35px #ff6b81); } 100% { transform: scale(1); filter: drop-shadow(0 0 15px #ff6b81); } }
        @keyframes heartArcUp { 0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 50% { transform: translate(80px, -60px) scale(1.2) rotate(20deg); } 100% { transform: translate(180px, 10px) scale(2) rotate(45deg); opacity: 0; filter: drop-shadow(0 0 15px #ff6b81); } }
        @keyframes heartArcMid { 0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 50% { transform: translate(90px, 0px) scale(1.2) rotate(0deg); } 100% { transform: translate(180px, 10px) scale(2) rotate(10deg); opacity: 0; filter: drop-shadow(0 0 15px #ff6b81); } }
        @keyframes heartArcDown { 0% { transform: translate(0, 0) scale(0.5) rotate(0deg); opacity: 0; } 20% { opacity: 1; } 50% { transform: translate(80px, 60px) scale(1.2) rotate(-20deg); } 100% { transform: translate(180px, 10px) scale(2) rotate(-10deg); opacity: 0; filter: drop-shadow(0 0 15px #ff6b81); } }
        @keyframes heartSplashHit { 0% { transform: scale(0.5); opacity: 1; border-radius: 50%; background: rgba(255, 107, 129, 0.8); } 100% { transform: scale(3); opacity: 0; filter: blur(3px); background: rgba(255, 192, 203, 0); } }

        /* ---------------- 第三招：海神十連爆 專屬動畫 ---------------- */
        @keyframes ultLunaFade { 0% {opacity: 1; filter: brightness(1.5) drop-shadow(0 0 20px #3498db);} 100% {opacity: 0; transform: translateY(-30px) scale(1.1); filter: blur(3px);} }
        @keyframes ultWaterSurface { 0% {transform: rotateX(75deg) scale(0); opacity: 0;} 100% {transform: rotateX(75deg) scale(2.5); opacity: 0.9;} }
        @keyframes ultPoseidonRise { 0% {transform: translateY(100px); opacity: 0;} 100% {transform: translateY(0); opacity: 1; filter: drop-shadow(0 0 20px #3498db);} }
        @keyframes ultCircleSpinGrow { 0% {transform: rotate(0deg) scale(0.5); opacity: 0;} 10% {opacity: 0.8; transform: rotate(36deg) scale(1);} 100% {transform: rotate(720deg) scale(12); opacity: 0.8;} }
        @keyframes orbSpin { 100% {transform: rotate(360deg);} }
        @keyframes ultShockwave { 0% {transform: translate(0, 0) scaleX(0.5); opacity: 1;} 100% {transform: translate(250px, 0) scaleX(1.8); opacity: 0;} }
        @keyframes ultExplosion { 0% {transform: scale(0.5) rotate(0deg); opacity: 1; filter: brightness(2);} 100% {transform: scale(2.5) rotate(45deg); opacity: 0;} }
        @keyframes fadeOutAll { 100% {opacity: 0;} }

        /* 🌟 奇蹟復活專屬動畫 🌟 */
        /* [新] 海馬在原地的慌張上下跳跳 */
        @keyframes seahorsePanicJump { 
            0% { transform: translateY(0) rotate(0deg); } 
            25% { transform: translateY(-25px) rotate(-10deg); } 
            50% { transform: translateY(0) rotate(0deg); } 
            75% { transform: translateY(-25px) rotate(10deg); } 
            100% { transform: translateY(0) rotate(0deg); } 
        }
        /* [新] 驚嘆號彈出 */
        @keyframes exclamationPop { 
            0% { transform: scale(0) translateY(10px); opacity: 0; } 
            20% { transform: scale(1.3) translateY(-5px); opacity: 1; } 
            80% { transform: scale(1) translateY(0); opacity: 1; } 
            100% { transform: scale(0.8) translateY(-15px); opacity: 0; } 
        }
        /* 海馬在身上的跳躍動畫 */
        @keyframes seahorseBouncy { 
            0% { transform: translateY(-40px) scale(0.9, 1.1); } 
            100% { transform: translateY(0px) scale(1.15, 0.85); } 
        }
        /* 金色光條 */
        @keyframes shineFlyUp { 
            0% { transform: translateY(0) scaleY(0.8); opacity: 0; } 
            15% { opacity: 1; filter: drop-shadow(0 0 15px gold) brightness(1.5); } 
            100% { transform: translateY(-600px) scaleY(3); opacity: 0; } 
        }
        /* 露娜開心的跳跳跳 */
        @keyframes lunaHappyJump {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
        }
    `,

    init: function() {
        if (!document.getElementById(`style-${this.id}`)) {
            let styleTag = document.createElement('style'); styleTag.id = `style-${this.id}`; styleTag.innerHTML = this.styles; document.head.appendChild(styleTag);
        }

        if (!window.lunaCharmWatcher) {
            window.lunaCharmWatcher = setInterval(() => {
                let d = document.getElementById('dragon-img');
                if (d && window.charmMistakesLeft && window.charmMistakesLeft > 0 && typeof currentLvl !== 'undefined') {
                    let currentSrc = d.getAttribute('src');
                    let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
                    if (currentSrc && currentSrc.includes('dragon.png') && typeof dHP !== 'undefined' && dHP > 0) {
                        d.src = `${dFolder}/heart_eye.png`;
                    }
                }
            }, 50);
        }
    },

    onBattleStart: function() {
        let heroImg = document.getElementById('hero-img');
        if(heroImg) {
            heroImg.src = `${this.folder}/hero.png`;
            if (typeof window.updateCombatPet === 'function') window.updateCombatPet(heroImg, heroes[selectedHeroIdx]);
        }
        window.seahorseRevived = false; 
    },

    onDamagedPassive: function() {
        return false; 
    },

    playHurtAnimation: function(dmgAmount) {
        let h = document.getElementById('hero-img');
        const battleScene = document.getElementById('battle-scene');
        if(!h) return;

        // =====================================
        // 🌟 小海馬奇蹟復活演出 (Panic -> Teleport -> Revive)
        // =====================================
        if (typeof pHP !== 'undefined' && pHP <= 0 && !window.seahorseRevived) {
            window.seahorseRevived = true;
            
            // 🌟 瞬間補滿 3 滴血，穩定遊戲判定
            pHP = 3; 
            if(typeof updateHP === 'function') updateHP(); 

            if(typeof showBattleMsg === 'function') showBattleMsg("😭 露娜倒下了...！");

            h.src = `${this.folder}/dead.png`;
            h.style.animation = ""; 

            if (battleScene) {
                let originalPet = document.getElementById('combat-pet-img');

                // 🌟 階段一：原地慌張跳跳 ＋ 驚嘆號
                if (originalPet) {
                    // 原地上下直跳
                    originalPet.style.animation = "seahorsePanicJump 0.4s 3 ease-in-out"; 
                    
                    // 生出粉紅驚嘆號
                    let exMark = document.createElement('div');
                    exMark.innerText = "！";
                    // 定位在 originalPet 的頭頂
                    exMark.style.cssText = 'position:absolute; bottom:110px; left:20px; font-size:40px; font-weight:bold; color:#ff66b2; text-shadow:0 0 10px #fff, 2px 2px 0 #fff; z-index:900; animation: exclamationPop 1s ease-out forwards; pointer-events:none;';
                    // 必須貼在與 originalPet 同一個父節點下
                    if(originalPet.parentElement) originalPet.parentElement.appendChild(exMark);
                    
                    setTimeout(() => exMark.remove(), 1000); // 1秒後移除驚嘆號
                }

                // 🌟 階段二：延遲 1.5 秒後，順移到主人身上並變大
                setTimeout(() => {
                    // 隱藏原本的原地寵物
                    if (originalPet) originalPet.style.opacity = '0';

                    // 生出變大的跳躍海馬
                    let seahorse = document.createElement('img');
                    seahorse.src = `${this.folder}/seahorse.png`; // Verbatim: image_d27b5d.png -> seahorse.png
                    // 變大到 width: 90px，並定位在露娜身上 (verbatim instructions for pos were top:120px; left:45px)
                    seahorse.style.cssText = 'position:absolute; top:120px; left:45px; width:90px; z-index:910; animation: seahorseBouncy 0.3s infinite alternate ease-in; pointer-events:none; transition: all 0.5s;';
                    battleScene.appendChild(seahorse);

                    // 播放啾啾叫 (移到這邊播放更貼切)
                    try { 
                        let jiuSfx = new Audio(`${this.folder}/jiu.mp3`); 
                        jiuSfx.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; 
                        jiuSfx.play().catch(e=>{}); 
                    } catch(e){}

                    // 🌟 階段三：海馬在身上跳 1 秒鐘後，開始爆發金光
                    setTimeout(() => {
                        if(typeof showBattleMsg === 'function') showBattleMsg("✨ 小海馬燃燒魔力，引發了奇蹟！");
                        
                        seahorse.style.filter = 'drop-shadow(0 0 35px gold) brightness(1.5)';

                        // 播放治癒音效
                        try { 
                            let healSfx = new Audio(`${this.folder}/heal.mp3`); 
                            healSfx.volume = window.audioSettings ? window.audioSettings.sfx : 0.8; 
                            healSfx.play().catch(e=>{}); 
                        } catch(e){}
                        
                        // 金條噴射
                        let shineInterval = setInterval(() => {
                            for(let i=0; i<2; i++) {
                                let s = document.createElement('img');
                                s.src = `${this.folder}/shine.png`;
                                let rLeft = 10 + Math.random() * 140; 
                                let rTop = 130 + Math.random() * 40; 
                                let rDuration = 0.8 + Math.random() * 0.8; 
                                s.style.cssText = `position:absolute; top:${rTop}px; left:${rLeft}px; height:120px; z-index:905; opacity:0; animation: shineFlyUp ${rDuration}s forwards ease-in; pointer-events:none; filter: drop-shadow(0 0 10px gold);`;
                                battleScene.appendChild(s);
                                setTimeout(() => { if(s.parentNode) s.remove(); }, rDuration * 1000);
                            }
                        }, 100);

                        // 🌟 延遲 2.5 秒後，正式復活
                        setTimeout(() => {
                            clearInterval(shineInterval);
                            
                            // 播放謝謝語音
                            try { 
                                let thanksVoice = new Audio(`${this.folder}/thanks.mp3`); 
                                thanksVoice.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; 
                                thanksVoice.play().catch(e=>{}); 
                            } catch(e){}
                            
                            // 露娜復活跳躍
                            h.src = `${this.folder}/happy.png`;
                            h.style.animation = "lunaHappyJump 0.4s 3 ease-in-out";

                            // 海馬本尊歸位，變開心跳躍
                            if (originalPet) {
                                originalPet.src = `${this.folder}/happy_seahorse.png`;
                                originalPet.style.opacity = '1';
                                originalPet.style.animation = "lunaHappyJump 0.4s 3 ease-in-out";
                            }
                            
                            if(typeof showBattleMsg === 'function') showBattleMsg("💖 露娜復活了！生命值回復 3 點！");
                            if(typeof showHealEffect === 'function') showHealEffect(true, 3);
                            
                            // 移除身上跳的海馬
                            seahorse.style.opacity = '0';
                            setTimeout(() => seahorse.remove(), 500);

                            setTimeout(() => {
                                // 全部還原
                                h.src = `${this.folder}/hero.png`;
                                h.style.animation = "";
                                if (originalPet) {
                                    originalPet.src = `${this.folder}/seahorse.png`;
                                    originalPet.style.animation = "";
                                }
                            }, 1500);

                        }, 2500); // 金光噴射時間

                    }, 1000); // 海馬在身上跳的時間

                }, 1500); // 慌張＋驚嘆號的總等待時間
            }
            return; 
        }

        // =====================================
        // 正常的受傷判定
        // =====================================
        h.src = `${this.folder}/hurt.png`;
        setTimeout(() => {
            h.classList.add('hurt-shake');
            try { let hs = document.getElementById('hero-hurt-sfx'); hs.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; hs.play().catch(e=>{}); } catch(e){} 
            if(typeof showDamage === 'function') showDamage(true, dmgAmount, 1000, false);
            if(typeof updateHP === 'function') updateHP();
        }, 300);
        setTimeout(() => {
            h.classList.remove('hurt-shake'); 
            if(pHP > 0) h.src = `${this.folder}/hero.png`;
        }, 1200);
    },

    playAttackAnimation: function(skillIdx, dmgValue, isCrit, currentLvl) {
        const h = document.getElementById('hero-img'), d = document.getElementById('dragon-img');
        const battleScene = document.getElementById('battle-scene');
        let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
        if(!h || !d || !battleScene) return;

        if(skillIdx === 0) {
            try { let hiAudio = new Audio(`${this.folder}/hi.mp3`); hiAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; hiAudio.play().catch(e=>{}); } catch(e){}
            playSfx(`${this.folder}/atk.mp3`); 
            h.src = `${this.folder}/hero_atk1.png`; 

            const shootHeart = (animName, delay, isLast) => {
                setTimeout(() => {
                    let heart = document.createElement('img');
                    heart.src = `${this.folder}/heart.png`;
                    heart.style.cssText = `position:absolute; top:90px; left:160px; width:80px; z-index:110; animation: ${animName} 0.4s ease-in forwards;`;
                    battleScene.appendChild(heart);

                    setTimeout(() => {
                        heart.remove();
                        let splash = document.createElement('div');
                        splash.style.cssText = `position:absolute; top:110px; right:130px; width:90px; height:90px; z-index:115; animation: heartSplashHit 0.3s ease-out forwards; pointer-events:none;`;
                        battleScene.appendChild(splash);
                        setTimeout(() => splash.remove(), 300);

                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`;
                        d.classList.add('hurt-shake');
                        try { playSfx(`${dFolder}/hurt.mp3`, 0.4); } catch(e){}

                        if (isLast) {
                            if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, isCrit);
                            if(typeof updateHP === 'function') updateHP();
                        }
                        setTimeout(() => { d.classList.remove('hurt-shake'); }, 150);
                    }, 400); 
                }, delay);
            };

            shootHeart('heartArcUp', 0, false);
            shootHeart('heartArcDown', 150, false);
            shootHeart('heartArcMid', 300, true);

            setTimeout(() => { 
                h.classList.remove('hurt-shake'); 
                if(pHP > 0) h.src = `${this.folder}/hero.png`; 
                d.classList.remove('hurt-shake'); 
                if(dHP > 0 && window.dragonRage < 3) d.src = (window.charmMistakesLeft > 0) ? `${dFolder}/heart_eye.png` : `${dFolder}/dragon.png`;
            }, 1200);
        }
        else if(skillIdx === 1) {
            try { let laughAudio = new Audio(`${this.folder}/laugh.mp3`); laughAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; laughAudio.play().catch(e=>{}); } catch(e){}
            playSfx(`${this.folder}/atk2.mp3`); 
            h.src = `${this.folder}/hero_atk2.png`; 
            
            let flyingHeart = document.createElement('img'); 
            flyingHeart.src = `${this.folder}/heart.png`; 
            flyingHeart.style.cssText = 'position:absolute; top:90px; left:180px; width:100px; z-index:110; animation: bigHeartShoot 0.5s ease-out forwards;'; 
            battleScene.appendChild(flyingHeart);
            
            setTimeout(() => {
                flyingHeart.remove(); 
                let actualDmg = isCrit ? 4 : 2;
                d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; 
                playSfx(`${dFolder}/hurt.mp3`); 
                d.classList.add('hurt-shake');
                if(typeof showDamage === 'function') showDamage(false, actualDmg, 800, isCrit);

                let pulsingHeart = document.createElement('img');
                pulsingHeart.src = `${this.folder}/heart.png`;
                let pTop = currentLvl === 2 ? '40px' : '20px';
                let pRight = currentLvl === 2 ? '80px' : '50px';
                pulsingHeart.style.cssText = `position:absolute; top:${pTop}; right:${pRight}; width:150px; z-index:115; animation: pulseBigHeart 0.6s infinite; pointer-events:none;`;
                battleScene.appendChild(pulsingHeart);

                setTimeout(() => {
                    pulsingHeart.style.transition = "all 0.5s ease-out";
                    pulsingHeart.style.transform = "scale(3)"; 
                    pulsingHeart.style.opacity = "0";          
                    setTimeout(() => pulsingHeart.remove(), 500);
                }, 2500);

                if (dHP > 0 && currentLvl >= 2) {
                    window.charmMistakesLeft = 3; 
                    if (typeof showBattleMsg === 'function') showBattleMsg("💖 魔龍被魅惑了！接下來 3 次失誤無效！");
                    d.src = `${dFolder}/heart_eye.png`;
                }
                if(typeof updateHP === 'function') updateHP();
            }, 400);

            setTimeout(() => { if(pHP > 0) h.src = `${this.folder}/hero.png`; }, 800);
            setTimeout(() => { 
                d.classList.remove('hurt-shake'); 
                if(dHP > 0 && window.dragonRage < 3) d.src = (window.charmMistakesLeft > 0) ? `${dFolder}/heart_eye.png` : `${dFolder}/dragon.png`;
            }, 1800);
        }
        else if(skillIdx >= 2) {
            // =====================================
            // 🌟 終極大絕：波賽頓蓄力狂吼 10 連爆！
            // =====================================
            
            d.style.position = 'relative';
            d.style.zIndex = '815';

            try { playSfx(`${this.folder}/atk3_cast.mp3`); } catch(e){}
            h.src = `${this.folder}/luna_cast.png`; 
            h.style.animation = "ultLunaFade 1s forwards ease-in";

            let elementsToClean = [];

            setTimeout(() => {
                let water = document.createElement('img');
                water.src = `${this.folder}/water_surface.png`;
                water.style.cssText = 'position:absolute; bottom:-40px; left:5%; width:200px; z-index:805; animation: ultWaterSurface 0.8s forwards; transform-origin: bottom center;';
                battleScene.appendChild(water);
                elementsToClean.push(water);

                setTimeout(() => {
                    let poseidon = document.createElement('img');
                    poseidon.src = `${this.folder}/poseidon.png`;
                    poseidon.style.cssText = 'position:absolute; bottom:50px; left:12%; width:160px; z-index:810; animation: ultPoseidonRise 0.8s ease-out forwards;';
                    battleScene.appendChild(poseidon);
                    elementsToClean.push(poseidon);

                    try { let appearSfx = new Audio(`${this.folder}/poseidon_appear.mp3`); appearSfx.volume = window.audioSettings ? window.audioSettings.sfx : 0.8; appearSfx.play().catch(e=>{}); } catch(e){}

                    let magicCircle = document.createElement('img');
                    magicCircle.src = `${this.folder}/poseidon_magic_circle.png`;
                    magicCircle.style.cssText = 'position:absolute; bottom:-20px; left:-5%; width:300px; z-index:800; transform-origin: center center; animation: ultCircleSpinGrow 6s linear forwards; pointer-events: none;';
                    battleScene.appendChild(magicCircle);
                    elementsToClean.push(magicCircle);

                    setTimeout(() => {
                        let orbWrapper = document.createElement('div');
                        orbWrapper.style.cssText = 'position:absolute; top:85px; left:160px; width:70px; height:70px; z-index:809; display:flex; justify-content:center; align-items:center; opacity:0; transform:scale(0); transition: transform 0.5s ease-out, opacity 0.5s;';
                        battleScene.appendChild(orbWrapper);
                        elementsToClean.push(orbWrapper);

                        let orb = document.createElement('img');
                        orb.src = `${this.folder}/weapon_charge_orb.png`;
                        orb.style.cssText = 'width:70px; animation: orbSpin 2s infinite linear; filter: drop-shadow(0 0 15px #fff);';
                        orbWrapper.appendChild(orb);

                        setTimeout(() => {
                            orbWrapper.style.opacity = '1';
                            orbWrapper.style.transform = 'scale(2.5)';
                            try { 
                                let voice = new Audio(`${this.folder}/poseidon_voice.mp3`); 
                                voice.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; 
                                voice.play().catch(e=>{}); 
                            } catch(e){}
                        }, 50);

                        setTimeout(() => {
                            orbWrapper.style.transform = 'scale(0.8)';
                            orb.style.animation = 'orbSpin 0.15s infinite linear'; 

                            setTimeout(() => {
                                let shotsFired = 0;
                                let shootInterval = setInterval(() => {
                                    if (shotsFired >= 10 || pHP <= 0) {
                                        clearInterval(shootInterval);
                                        setTimeout(() => {
                                            elementsToClean.forEach(el => el.style.animation = "fadeOutAll 0.5s forwards");
                                            h.style.animation = "";
                                            if (pHP > 0) h.src = `${this.folder}/hero.png`;
                                            d.classList.remove('dragon-shock', 'dragon-front');
                                            
                                            d.style.zIndex = '';
                                            
                                            if(dHP > 0) d.src = (window.charmMistakesLeft > 0) ? `${dFolder}/heart_eye.png` : `${dFolder}/dragon.png`;
                                            setTimeout(() => {
                                                elementsToClean.forEach(el => el.remove());
                                            }, 500);
                                        }, 600);
                                        return;
                                    }

                                    let wave = document.createElement('img');
                                    wave.src = `${this.folder}/shockwave_blast.png`;
                                    wave.style.cssText = 'position:absolute; top:85px; left:160px; width:150px; z-index:820; animation: ultShockwave 0.2s forwards;';
                                    battleScene.appendChild(wave);
                                    try { playSfx(`${this.folder}/atk3_hit.mp3`, 0.6); } catch(e){}

                                    let currentShot = shotsFired;

                                    setTimeout(() => {
                                        wave.remove();
                                        let explosion = document.createElement('img');
                                        explosion.src = `${this.folder}/water_explosion.png`;
                                        let randomTop = 60 + (Math.random() * 60 - 30) + 'px';
                                        let randomRight = 80 + (Math.random() * 50 - 25) + 'px';
                                        explosion.style.cssText = `position:absolute; top:${randomTop}; right:${randomRight}; width:160px; z-index:825; animation: ultExplosion 0.25s forwards; pointer-events:none;`;
                                        battleScene.appendChild(explosion);
                                        setTimeout(() => explosion.remove(), 250);

                                        d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; 
                                        d.classList.add('hurt-shake');
                                        try { playSfx(`${dFolder}/hurt.mp3`, 0.4); } catch(e){}
                                        
                                        if (currentShot === 9) {
                                            if(typeof showDamage === 'function') showDamage(false, dmgValue, 1500, isCrit);
                                            if(typeof updateHP === 'function') updateHP();
                                        }

                                        setTimeout(() => { d.classList.remove('hurt-shake'); }, 100);
                                    }, 150); 

                                    shotsFired++;
                                }, 100); 
                            }, 400); 
                        }, 2500); 
                    }, 500);
                }, 500);
            }, 800); 
        }
    }
};
window.HeroRegistry['hero3'].init();