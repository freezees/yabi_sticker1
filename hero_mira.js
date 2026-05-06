// hero_mira.js
window.HeroRegistry = window.HeroRegistry || {};

window.HeroRegistry['hero2'] = {
    id: 'hero2',
    name: '米拉',
    folder: 'hero2',
    
    styles: `
        @keyframes bubblePassAnim { 0% { transform: translateX(0) scale(0.5); opacity: 0; } 20% { opacity: 1; transform: translateX(50px) scale(1.5); filter: brightness(1.2); } 50% { opacity: 1; transform: translateX(250px) scale(2.5); filter: brightness(1.5); } 100% { transform: translateX(500px) scale(3); opacity: 0; } }
        @keyframes waveTsunamiAnim { 0% { transform: translateX(0) scale(0.2); opacity: 0; } 20% { opacity: 1; transform: translateX(50px) scale(1); filter: brightness(1.2); } 60% { opacity: 1; transform: translateX(300px) scale(2.5); filter: brightness(1.5); } 100% { transform: translateX(600px) scale(4); opacity: 0; filter: brightness(1); } }
        @keyframes goldPulse { 0%, 100% { filter: drop-shadow(0 0 5px #ffd700); } 50% { filter: drop-shadow(0 0 20px #f1c40f) brightness(1.2); transform: scale(1.05); } }
        @keyframes castAnim { 0% { opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes magicCircleAnim { 0% { transform: scale(0.1) rotate(0deg); opacity: 0; } 15% { opacity: 1; transform: scale(1.5) rotate(180deg); filter: brightness(1.2); } 85% { opacity: 1; transform: scale(2.8) rotate(1080deg); filter: brightness(1.5); } 100% { transform: scale(3.5) rotate(1440deg); opacity: 0; } }
        @keyframes waterBallShoot { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 15% { opacity: 1; transform: translateY(-80px) scale(1); filter: brightness(1.5); } 100% { transform: translateY(-900px) scale(1.5); opacity: 0; } }
    `,

    init: function() {
        if (!document.getElementById(`style-${this.id}`)) {
            let styleTag = document.createElement('style'); styleTag.id = `style-${this.id}`; styleTag.innerHTML = this.styles; document.head.appendChild(styleTag);
        }
    },

    onBattleStart: function(heroData) {
        let heroImg = document.getElementById('hero-img');
        if(heroImg) {
            heroImg.src = `${this.folder}/hero.png`;
            if (typeof window.updateCombatPet === 'function') window.updateCombatPet(heroImg, heroData);
        }
    },

    onWrongSpell: function(correctChar, currentLvl, stars) {
        let isTestMode = (window.gachaData && window.gachaData.coins >= 99999);
        let effectiveStars = isTestMode ? 5 : stars;

        if (currentLvl >= 2 && effectiveStars >= 5) {
            if (typeof showBattleMsg === 'function') showBattleMsg(`✨ 米拉魔法發動！正確字母是「${correctChar.toUpperCase()}」！`);
            
            let combatPet = document.getElementById('combat-pet-img');
            if (combatPet && combatPet.style.display !== 'none') {
                if(window.petReturnTimer) clearTimeout(window.petReturnTimer);
                
                let originalSrc = heroes[selectedHeroIdx].petImg || `${this.folder}/pet.png`;
                combatPet.src = `${this.folder}/pet_action.png`;
                combatPet.onerror = function() { this.src = originalSrc; };
                combatPet.style.animation = 'petBounceInPlace 0.4s infinite';
                
                let alertIcon = document.getElementById('pet-alert-icon');
                if (!alertIcon) {
                    alertIcon = document.createElement('div'); 
                    alertIcon.id = 'pet-alert-icon'; 
                    alertIcon.innerText = '❗';
                    alertIcon.style.cssText = 'position:absolute; font-size:35px; font-weight:bold; color:#ff4757; text-shadow:0 2px 4px rgba(255,255,255,0.8), 0 0 10px #ff4757; z-index:10;';
                    let heroImg = document.getElementById('hero-img');
                    if (heroImg && heroImg.parentElement) heroImg.parentElement.appendChild(alertIcon);
                }
                alertIcon.style.bottom = '85px'; alertIcon.style.left = '-25px'; alertIcon.style.display = 'block'; alertIcon.style.animation = 'bounceIn 0.3s ease-out';

                // ★ 修復：無條件停止跳躍動畫，不再受血量變數影響
                window.petReturnTimer = setTimeout(() => {
                    if (combatPet) {
                        combatPet.style.animation = 'breatheAnim 2s infinite'; 
                        combatPet.src = originalSrc; 
                        combatPet.onerror = null;
                    }
                    if (alertIcon) alertIcon.style.display = 'none';
                }, 3000);
            }
            
            if (typeof highlightNextLetter === 'function') highlightNextLetter(correctChar, 3000);
            return true;
        }
        return false;
    },

// 新增參數：isRangedAttacked，如果為 true，就不要播龍的近戰動畫！
// 英雄現在只接收一個參數：dmgAmount (受到的傷害量)
    playHurtAnimation: function(dmgAmount) {
        let h = document.getElementById('hero-img');
        if(!h) return;

        h.src = `${this.folder}/hurt.png`;

        setTimeout(() => {
            h.classList.add('hurt-shake');
            try { let hs = document.getElementById('hero-hurt-sfx'); hs.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; hs.play().catch(e=>{}); } catch(e){} 
            
            // 🌟 直接顯示外面傳進來的真實傷害數字！不用再自己判斷了！
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
        const battleScene = document.getElementById('battle-scene'), gameContainer = document.getElementById('game-container');
        let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');
        if(!h || !d || !battleScene) return;

        if(skillIdx === 0) { 
            playSfx(`${this.folder}/atk1_1.mp3`); h.src = `${this.folder}/hero_atk1_1.png`; 
            setTimeout(() => {
                h.src = `${this.folder}/hero_atk1_2.png`; playSfx(`${this.folder}/atk1_2.mp3`);
                let b = document.createElement('img'); b.src = `${this.folder}/bubble_stream.png`;
                b.style.cssText = 'position:absolute; top:110px; left:120px; width:200px; z-index:110; animation: bubblePassAnim 1s linear forwards;'; battleScene.appendChild(b);
                setTimeout(() => { 
                    d.src = (typeof dHP !== 'undefined' ? dHP : 1) <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                    if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, isCrit); 
                    if(typeof updateHP === 'function') updateHP(); 
                }, 400); 
                setTimeout(() => b.remove(), 1000);
            }, 300);
            setTimeout(() => { 
                if((typeof pHP !== 'undefined' ? pHP : 1) > 0) h.src = `${this.folder}/hero.png`; 
                d.classList.remove('hurt-shake'); 
                if((typeof dHP !== 'undefined' ? dHP : 1) > 0) d.src = `${dFolder}/dragon.png`; 
            }, 1500);
        } else if(skillIdx === 1) { 
            playSfx(`${this.folder}/atk2_1.mp3`); h.src = `${this.folder}/hero_atk2_1.png`; 
            let c = document.createElement('img'); c.src = `${this.folder}/coral_reef.png`;
            c.style.cssText = 'position:absolute; bottom:10px; right:40px; width:180px; z-index:105; animation: goldPulse 1s forwards;'; battleScene.appendChild(c);
            setTimeout(() => {
                h.src = `${this.folder}/hero_atk2_2.png`; playSfx(`${this.folder}/atk2_2.mp3`);
                let w = document.createElement('img'); w.src = `${this.folder}/wave_crash.png`;
                w.style.cssText = 'position:absolute; bottom:20px; left:80px; width:150px; z-index:115; animation: waveTsunamiAnim 1s ease-in forwards; transform-origin: bottom center;'; 
                battleScene.appendChild(w);
                setTimeout(() => { 
                    d.src = (typeof dHP !== 'undefined' ? dHP : 1) <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                    if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, isCrit); 
                    if(typeof updateHP === 'function') updateHP(); 
                    setTimeout(() => { c.remove(); w.remove(); }, 600); 
                }, 500); 
            }, 600);
            setTimeout(() => { 
                if((typeof pHP !== 'undefined' ? pHP : 1) > 0) h.src = `${this.folder}/hero.png`; 
                d.classList.remove('hurt-shake'); 
                if((typeof dHP !== 'undefined' ? dHP : 1) > 0) d.src = `${dFolder}/dragon.png`; 
            }, 2000);
        } else if(skillIdx >= 2) { 
            const ca = document.getElementById('sfx-magic-custom'); 
            if(ca && heroes[selectedHeroIdx].magicAudio) { ca.src = heroes[selectedHeroIdx].magicAudio; ca.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; ca.play().catch(e => {}); }
            playSfx(`${this.folder}/atk3_1.mp3`);
            
            if(gameContainer) gameContainer.style.position = 'relative'; if(battleScene) { battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; }
            
            // ★ 修復：把英雄本人的圖層拉到最前面 (900)，才不會被黑布蓋住
            h.style.position = 'relative';
            h.style.zIndex = '900';

            let ob = document.createElement('div'); ob.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 30, 80, 0.75); z-index:800; pointer-events:none; animation: castAnim 3s forwards; border-radius: 20px;'; 
            if(gameContainer) gameContainer.appendChild(ob); else battleScene.appendChild(ob);
            h.src = `${this.folder}/hero_atk3_1.png`; h.classList.add('atk-glow'); 
            
            let sd = 0, iv = 110;
            setTimeout(() => { 
                let mc = document.createElement('img'); mc.src = `${this.folder}/magic_circle.png`; mc.id = 'temp-magic-circle'; 
                // ★ 修復：魔法陣圖層設為 850，確保在黑布之上，但英雄之下
                mc.style.cssText = 'position:absolute; bottom:20px; left:20px; width:180px; z-index:850; animation: magicCircleAnim 2.5s ease-in forwards;'; 
                battleScene.appendChild(mc); 
            }, 800);
            
            for(let i = 0; i < 30; i++) { setTimeout(() => { let b = document.createElement('img'); b.src = `${this.folder}/water_ball.png`; b.style.cssText = `position:absolute; bottom:0px; left:${10 + Math.random() * 80}%; width:45px; z-index:15; animation: waterBallShoot 0.8s linear forwards;`; battleScene.appendChild(b); playSfx(`${this.folder}/water_ball.mp3`, 0.5); setTimeout(() => b.remove(), 800); }, sd); sd += iv; iv = Math.max(15, iv - 4); }
            
            setTimeout(() => {
                let wh = document.createElement('img'); wh.src = `${this.folder}/spirit_whale.png`; 
                wh.style.cssText = `position:absolute; bottom: -2000px; left: 50%; transform: translateX(-50%) scale(2.5); width:100%; height: auto; z-index:950; opacity:0.9; transition: transform 2s ease-in-out;`; 
                if(gameContainer) gameContainer.appendChild(wh); else battleScene.appendChild(wh); 
                if(ca) { ca.currentTime = 0; ca.volume = window.audioSettings ? window.audioSettings.sfx : 1.0; ca.play().catch(e => {}); }
                setTimeout(() => {
                    let moveDistance = gameContainer.offsetHeight + 4000; wh.style.transform = `translateY(-${moveDistance}px) translateX(-50%) scale(2.5)`; 
                    setTimeout(() => { 
                        h.classList.remove('atk-glow'); h.src = `${this.folder}/hero_atk3_2.png`; h.classList.add('atk-dash'); 
                        playSfx(`${this.folder}/atk3_2.mp3`); d.src = (typeof dHP !== 'undefined' ? dHP : 1) <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                        if(typeof showDamage === 'function') showDamage(false, dmgValue, 3000, isCrit); 
                        if(typeof updateHP === 'function') updateHP();
                        setTimeout(() => { try { wh.remove(); ob.remove(); let mc = document.getElementById('temp-magic-circle'); if(mc) mc.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; } catch(e){} }, 1000); 
                    }, 1200); 
                }, 50); 
            }, sd + 200); 
            
            setTimeout(() => { 
                h.classList.remove('atk-dash', 'atk-glow'); 
                if ((typeof pHP !== 'undefined' ? pHP : 1) > 0) h.src = `${this.folder}/hero.png`; 
                d.classList.remove('hurt-shake'); 
                if ((typeof dHP !== 'undefined' ? dHP : 1) > 0) d.src = `${dFolder}/dragon.png`; 
            }, 3500);
        }
    }
};
window.HeroRegistry['hero2'].init();