// hero_edwin.js
window.HeroRegistry = window.HeroRegistry || {};

window.HeroRegistry['hero1'] = {
    id: 'hero1',
    name: '艾德恩',
    folder: 'hero1',
    
    styles: `
        .hero-front { z-index: 1000 !important; }
        .dragon-front { z-index: 950 !important; }
        .lightning-particle { position: absolute; width: 8px; height: 8px; background: #ffd700; box-shadow: 0 0 5px #ffd700; border-radius: 50%; pointer-events: none; animation: lightningParticle 1.2s ease-out forwards; }
        @keyframes lightningParticle { 0% { transform: translate(0, 0) scale(1); opacity: 1; } 100% { transform: translate(var(--pdx), var(--pdy)) rotate(360deg) scale(0); opacity: 0; } }
        .hero-open-eye { animation: heroOpenEye 0.4s ease-out; }
        @keyframes heroOpenEye { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); filter: brightness(1.5); } }
        .ult-magic-circle { position: absolute; bottom: -50px; left: 50%; transform: translateX(-50%); width: 300px; height: 300px; animation: magicCircleScaleGlow 3s ease-in-out forwards; pointer-events: none; }
        @keyframes magicCircleScaleGlow { 0% { transform: translate(-50%, 0) scale(0.1) rotate(0deg); opacity: 0; filter: brightness(1); } 15% { opacity: 1; transform: translate(-50%, 0) scale(1.1) rotate(180deg); filter: brightness(1.5); } 85% { opacity: 1; transform: translate(-50%, 0) scale(1.1) rotate(1080deg); filter: brightness(2); } 100% { transform: translate(-50%, 0) scale(1.2) rotate(1440deg); opacity: 0; filter: brightness(1); } }
        .gold-lightning { position: absolute; top: 100px; width: 80px; height: 250px; background-size: contain; background-repeat: no-repeat; pointer-events: none; animation: goldLightningStrike 0.6s ease-out forwards; filter: drop-shadow(0 0 10px #ffd700); }
        @keyframes goldLightningStrike { 0% { opacity: 0; } 5%, 15%, 25%, 35% { opacity: 1; filter: brightness(2); } 10%, 20%, 30% { opacity: 0.3; } 50% { opacity: 1; transform: scaleY(1.1); } 100% { opacity: 0; transform: scaleY(0.8) translateY(100px); } }
        .giant-sword-with-effects { position: absolute; bottom: 0px; right: 50px; width: 150px; pointer-events: none; animation: giantSwordFallUpdate 0.8s cubic-bezier(.5,0,1,1) forwards; transform-origin: bottom center; filter: drop-shadow(0 0 15px #ffd700) drop-shadow(0 0 30px #ffffff); }
        @keyframes giantSwordFallUpdate { 0% { transform: translateY(-800px) scale(0.8); opacity: 0; } 20% { opacity: 1; } 90%, 100% { transform: translateY(0) scale(1.2); opacity: 1; } }
        .sword-lightning-wraps { position: absolute; top: -50px; left: -25px; width: 150%; height: 150%; background-size: contain; background-repeat: no-repeat; background-position: center; animation: swordLightningWraps 0.3s ease-in infinite; pointer-events: none; z-index: -1; }
        @keyframes swordLightningWraps { 0% { opacity: 0; } 50% { opacity: 1; filter: brightness(1.5); } 100% { opacity: 0; } }
        .gold-explosion-fx { position: absolute; bottom: 20px; right: 20px; width: 300px; height: 300px; pointer-events: none; animation: goldExplosion 1s ease-out forwards; }
        @keyframes goldExplosion { 0% { transform: scale(0.1); opacity: 0; } 15% { transform: scale(3.5); opacity: 1; filter: brightness(2); } 50% { transform: scale(4.5); opacity: 1; filter: brightness(1.5); } 100% { transform: scale(5); opacity: 0; filter: brightness(1); } }
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

    onPetBlock: function(currentLvl) {
        let stars = (window.gachaData && window.gachaData.stars) ? (window.gachaData.stars[selectedHeroIdx] || 0) : 0;
        let isTestMode = (window.gachaData && window.gachaData.coins >= 99999);
        let effectiveStars = isTestMode ? 5 : stars;
        
        if (effectiveStars < 5) return false;
        
        if (Math.random() > 0.40) return false;

        let combatPet = document.getElementById('combat-pet-img');
        let dragonImg = document.getElementById('dragon-img');
        let heroImg = document.getElementById('hero-img');
        let dFolder = currentLvl === 1 ? 'dragon1' : (currentLvl === 2 ? 'dragon2' : 'dragon3');

        // 確保小馬存在且有顯示在畫面上，才會發動擋刀
        if (combatPet && combatPet.style.display !== 'none') {
            if(window.petReturnTimer) clearTimeout(window.petReturnTimer);

            try {
                let blockAudio = new Audio(`${this.folder}/block.mp3`);
                blockAudio.volume = window.audioSettings ? window.audioSettings.sfx : 0.8;
                blockAudio.play().catch(e => {});
                let dragonAudio = new Audio(`${dFolder}/atk.mp3`);
                dragonAudio.volume = window.audioSettings ? window.audioSettings.sfx : 0.8;
                dragonAudio.play().catch(e => {});
            } catch(e) {}

            let originalSrc = heroes[selectedHeroIdx].petImg || `${this.folder}/pet.png`;
            combatPet.src = `${this.folder}/pet_action.png`;
            combatPet.onerror = function() { this.src = originalSrc; };

            combatPet.style.animation = 'none';
            combatPet.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            combatPet.style.transform = 'translateX(120px) scale(2.2) translateY(-10px)';
            combatPet.style.zIndex = '9999';
            if (heroImg) heroImg.style.zIndex = '0';

            if(dragonImg) {
                dragonImg.src = `${dFolder}/atk.png`;
                dragonImg.style.animation = 'none';
                void dragonImg.offsetWidth; 
                dragonImg.style.animation = 'dragonBlockedAtk 1.5s ease-in-out forwards';
            }

            if (typeof showBattleMsg === 'function') showBattleMsg(`✨ 飛馬發動保護！完美抵擋魔龍的攻擊！`);

            window.petReturnTimer = setTimeout(() => {
                if(dragonImg) {
                    dragonImg.src = `${dFolder}/dragon.png`;
                    dragonImg.style.animation = '';
                }

                if (pHP > 0 && combatPet) {
                    combatPet.style.transform = 'translateX(0) scale(1) translateY(0)';
                    if (heroImg) heroImg.style.zIndex = '2';
                    combatPet.src = originalSrc;
                    setTimeout(() => {
                        if (combatPet && pHP > 0) {
                            combatPet.style.transition = '';
                            combatPet.style.animation = 'breatheAnim 2s infinite';
                            combatPet.style.zIndex = '1';
                        }
                    }, 300);
                }
            }, 1500);
            
            return true; 
        }
        return false;
    },

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

        h.classList.add('hero-front');

        if(skillIdx === 0) {
            playSfx(`${this.folder}/roar.mp3`); h.src = `${this.folder}/hero_atk1_1.png`; 
            setTimeout(() => {
                h.src = `${this.folder}/hero_atk1_2.png`; h.classList.add('atk-dash'); playSfx(`${this.folder}/atk.mp3`); 
                setTimeout(() => { 
                    d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; 
                    playSfx(`${dFolder}/hurt.mp3`); d.classList.add('hurt-shake'); 
                    if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, isCrit); 
                    if(typeof updateHP === 'function') updateHP(); 
                }, 250);
            }, 500);
            setTimeout(() => { h.classList.remove('atk-dash', 'hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${this.folder}/hero.png`; d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; }, 1800);
        } 
        else if (skillIdx === 1) {
            playSfx(`${this.folder}/roar.mp3`); h.src = `${this.folder}/hero_atk2_1.png`; h.style.transition = 'none'; h.style.animation = 'none'; 
            const spawnHurtParticles = (x, y) => { for(let i=0; i<10; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:${x}px; bottom:${y}px; --pdx:${(Math.random()-0.5)*150}px; --pdy:${(Math.random()-0.5)*150}px; animation-delay:${Math.random()*0.1}s;`; battleScene.appendChild(p); setTimeout(()=>p.remove(), 1200); } };
            setTimeout(() => { h.src = `${this.folder}/hero_atk2_2.png`; h.style.transform = 'translate(220px, -20px) scale(1.2)'; playSfx(`${this.folder}/atk2_1.mp3`); d.classList.add('hurt-shake'); spawnHurtParticles(400, 150); setTimeout(()=>d.classList.remove('hurt-shake'), 150); }, 400);
            setTimeout(() => { h.src = `${this.folder}/hero_atk2_3.png`; h.style.transform = 'translate(310px, -20px) scaleX(-1.2) scaleY(1.2)'; playSfx(`${this.folder}/atk2_2.mp3`); d.style.transform = 'translateX(-20px)'; d.classList.add('hurt-shake'); spawnHurtParticles(430, 150); setTimeout(()=> { d.classList.remove('hurt-shake'); d.style.transform = ''; }, 150); }, 800);
            setTimeout(() => { 
                h.src = `${this.folder}/hero_atk2_4.png`; h.style.transform = 'translate(280px, -150px) scale(1.5)'; playSfx(`${this.folder}/atk2_3.mp3`); 
                d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; playSfx(`${dFolder}/hurt.mp3`); 
                d.classList.add('hurt-shake'); spawnHurtParticles(425, 200); 
                if(typeof showDamage === 'function') showDamage(false, dmgValue, 1000, isCrit); 
                if(typeof updateHP === 'function') updateHP(); 
            }, 1200);
            setTimeout(() => { h.style.transform = ''; h.style.transition = '0.3s'; h.style.animation = ''; h.classList.remove('hurt-shake', 'hero-front'); if (pHP > 0) h.src = `${this.folder}/hero.png`; d.classList.remove('hurt-shake', 'dragon-atk'); if (dHP > 0) d.src = `${dFolder}/dragon.png`; }, 2000);
        }
        else if (skillIdx >= 2) {
            h.src = `${this.folder}/hero_atk3_1.png`; h.classList.add('casting-ult'); 
            if(gameContainer) gameContainer.style.position = 'relative'; battleScene.style.position = 'relative'; battleScene.style.zIndex = '900'; 
            let darkBg = document.createElement('div'); darkBg.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0, 0, 0, 0.75); z-index:800; pointer-events:none; transition: opacity 0.5s; opacity: 0; border-radius: 20px;';
            if(gameContainer) gameContainer.appendChild(darkBg); else battleScene.appendChild(darkBg); 
            setTimeout(() => darkBg.style.opacity = '1', 50); 
            playSfx(`${this.folder}/atk3_cast.mp3`); playSfx(`${this.folder}/thunder_roll.mp3`, 0.6); 
            let mc = document.createElement('img'); mc.src = `${this.folder}/magic_circle.png`; mc.className = 'ult-magic-circle'; mc.style.zIndex = '2'; battleScene.appendChild(mc);
            const spawnSkyLightning = (x, delay) => { let l = document.createElement('div'); l.className = 'gold-lightning'; l.style.cssText = `--lx:${x}px; --ldelay:${delay}s; z-index: 5;`; l.style.backgroundImage = `url('${this.folder}/gold_lightning.png')`; battleScene.appendChild(l); setTimeout(()=> l.remove(), 700); };
            spawnSkyLightning(100, 0.2); spawnSkyLightning(250, 0.4); spawnSkyLightning(400, 0.3); spawnSkyLightning(50, 0.6); spawnSkyLightning(450, 0.5);
            let gsGroup = document.createElement('div'); gsGroup.className = 'giant-sword-with-effects'; gsGroup.style.zIndex = '15'; 
            let gs = document.createElement('img'); gs.src = `${this.folder}/giant_sword.png`; gs.style.cssText = 'width:100%; height:auto; object-fit:contain;'; gsGroup.appendChild(gs);
            let swordLightning = document.createElement('div'); swordLightning.className = 'sword-lightning-wraps'; swordLightning.style.backgroundImage = `url('${this.folder}/sword_lightning.png')`; gsGroup.appendChild(swordLightning);
            setTimeout(() => battleScene.appendChild(gsGroup), 800);
            setTimeout(() => { h.src = `${this.folder}/hero_atk3_2.png`; h.classList.add('hero-open-eye'); setTimeout(()=> h.classList.remove('hero-open-eye'), 400); }, 1300);
            setTimeout(() => {
                playSfx(`${this.folder}/atk3_hit.mp3`); playSfx(`${this.folder}/gold_explosion.mp3`, 0.8);
                if(typeof showDamage === 'function') showDamage(false, dmgValue, 3000, isCrit); 
                if(battleScene) battleScene.classList.add('severe-shake');
                let ex = document.createElement('img'); ex.className = 'gold-explosion-fx'; ex.src = `${this.folder}/gold_explosion.png`; ex.style.zIndex = '20'; battleScene.appendChild(ex); setTimeout(()=> ex.remove(), 1000);
                for(let i=0; i<30; i++) { let p = document.createElement('div'); p.className = 'lightning-particle'; p.style.cssText = `left:425px; bottom:150px; --pdx:${(Math.random()-0.5)*250}px; --pdy:${(Math.random()-0.5)*250}px; animation-delay:${Math.random()*0.2}s; z-index:20;`; battleScene.appendChild(p); setTimeout(()=> p.remove(), 1200); }
                d.src = dHP <= 0 ? `${dFolder}/dead.png` : `${dFolder}/hurt.png`; d.classList.add('dragon-shock', 'dragon-front'); playSfx(`${dFolder}/hurt.mp3`); 
                if(typeof updateHP === 'function') updateHP(); 
                setTimeout(() => { if(battleScene) battleScene.classList.remove('severe-shake'); d.classList.remove('dragon-shock', 'dragon-front'); }, 1000);
            }, 1500);
            setTimeout(() => { gsGroup.style.transition = 'opacity 0.5s ease-out'; gsGroup.style.opacity = '0'; darkBg.style.opacity = '0'; }, 3200);
            setTimeout(() => { mc.remove(); gsGroup.remove(); darkBg.remove(); h.style.position = ''; h.style.zIndex = ''; d.style.position = ''; d.style.zIndex = ''; if(battleScene) battleScene.style.zIndex = ''; }, 3700);
            setTimeout(() => { h.classList.remove('casting-ult', 'hero-front'); if (pHP > 0) h.src = `${this.folder}/hero.png`; if (dHP > 0) d.src = `${dFolder}/dragon.png`; }, 4500);
        }
    }
};
window.HeroRegistry['hero1'].init();