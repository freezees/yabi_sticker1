// village.js - 魔法貼紙村莊獨立引擎 (日夜傍晚三時段 + Storm暴風雨升級版 + 龍捲風/哎呀/互動加強 + 氣球與營火晚會 + 每日氣球上限與超級氣球 + 外部商店道具支援)

window.villageAnimFrame = null; 
window.villageCampfireAudio = null; 
window.superBalloonAudio = null; 

// ========== 建立村莊主要畫面 ==========
function buildWallContent() {
    let todayDate = new Date().toDateString();
    if (window.gachaData.balloonDate !== todayDate) {
        window.gachaData.balloonDate = todayDate;
        window.gachaData.normalBalloonCount = 0;
        window.gachaData.superBalloonCount = 0;
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
    }

    let isTest = window.gachaData.coins >= 99999;
    let nCnt = window.gachaData.normalBalloonCount || 0;
    let sCnt = window.gachaData.superBalloonCount || 0;
    let nTrackerText = isTest ? '🎈 普通: ∞' : `🎈 普通: ${nCnt}/10`;
    let sTrackerText = isTest ? '🌟 超級: ∞' : `🌟 超級: ${sCnt}/3`;

    // 🌟 判斷是否擁有加速星星 (移除了現場購買邏輯，改為純展示)
    let starPropHtml = window.gachaData.hasSpeedStar 
        ? `<div id="prop-star" style="width:60px; height:60px; background:#fff; border:3px dashed #f1c40f; border-radius:15px; display:flex; align-items:center; justify-content:center; cursor:grab; box-shadow:0 3px 6px rgba(0,0,0,0.15); transition:transform 0.2s;" title="拖曳給村民搶！">
             <img src="assets/speed_star.png" style="width:80%; pointer-events:none;" onerror="this.outerHTML='<div style=\\'font-size:35px;\\'>⭐</div>'">
           </div>`
        : `<div style="width:60px; height:60px; background:#eee; border:3px solid #ccc; border-radius:15px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:not-allowed; box-shadow:0 3px 6px rgba(0,0,0,0.15); opacity:0.6;" title="🔒 請至「商店」購買解鎖此道具！">
             <div style="font-size:20px;">🔒</div>
           </div>`;

    let html = `
        <div style="font-size:24px; font-weight:bold; text-align:center; margin-bottom:5px; color:#8e44ad;">🏡 魔法貼紙村莊</div>
        
        <div style="display:flex; justify-content:center; gap:15px; margin-bottom:10px;">
            <div id="normal-balloon-tracker" style="background:#f39c12; padding:5px 15px; border-radius:20px; font-weight:bold; color:#fff; box-shadow:0 3px 6px rgba(0,0,0,0.2); font-size:15px;">${nTrackerText}</div>
            <div id="super-balloon-tracker" style="background:#8e44ad; padding:5px 15px; border-radius:20px; font-weight:bold; color:#fff; box-shadow:0 3px 6px rgba(0,0,0,0.2); font-size:15px;">${sTrackerText}</div>
        </div>

        <div id="village-container" style="position:relative; width:100%; height:45vh; background: url('assets/village.png') center/cover, linear-gradient(to bottom, #a1c4fd 0%, #c2e9fb 100%); border-radius:20px; border:4px solid #fff; overflow:hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.2); margin-bottom:10px; user-select:none;">
            </div>
        
        <div style="display:flex; justify-content:center; align-items:center; margin-bottom:15px; gap:10px; background:rgba(255,255,255,0.6); padding:10px; border-radius:15px; flex-wrap:wrap;">
            <div style="font-size:16px; font-weight:bold; color:#d35400; width:100%; text-align:center;">🏕️ 道具箱 (拖曳進村莊)</div>
            
            <div id="prop-campfire" style="width:60px; height:60px; background:#fff; border:3px dashed #d35400; border-radius:15px; display:flex; align-items:center; justify-content:center; cursor:grab; box-shadow:0 3px 6px rgba(0,0,0,0.15); transition:transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'" title="晚上才能開派對喔！">
                <img src="assets/campfire.png" style="width:80%; pointer-events:none;" onerror="this.src='${FALLBACK_IMAGE}'">
            </div>
            
            ${starPropHtml}
        </div>

        <div style="text-align:center; font-size:14px; color:#7f8c8d; margin-bottom:5px;">👇 點擊更換村民，或用滑鼠/手指「抓起」他們看看！ 👇</div>
    `;

    html += '<div class="wall-grid" style="display:flex; flex-wrap:wrap; justify-content:center; gap:15px;">';
    window.gachaData.wall.forEach((slotId, index) => {
        if (slotId !== null && enabledStickers.includes(slotId)) {
            let s = stickerDB.find(x => x.id === slotId);
            if (s) {
                let assets = getStickerAssets(s);
                html += `<div class="wall-slot rarity-${s.rarity}" style="width:65px; height:65px; cursor:pointer;" onclick="editWallSlot(${index})"><img src="${assets.img}" style="width:80%; pointer-events:none;" onerror="this.src='${FALLBACK_IMAGE}'"></div>`;
            }
        } else {
            html += `<div class="wall-slot" style="width:65px; height:65px; cursor:pointer; background:#eee; display:flex; align-items:center; justify-content:center; border-radius:15px; border: 2px dashed #ccc;" onclick="editWallSlot(${index})"><div style="font-size:30px; color:#aaa; pointer-events:none;">+</div></div>`;
        }
    });
    html += '</div>';

    setTimeout(startVillageEngine, 50);
    return html;
}

// ========== 編輯村莊貼紙欄位 ==========
window.editWallSlot = function(index) {
    let pick = prompt("請輸入貼紙編號 (如 SR1, SSR2)，輸入 0 取下");
    if (pick !== null) {
        if (pick.trim() === '0') {
            window.gachaData.wall[index] = null;
        } else {
            let targetS = stickerDB.find(x => getStickerDisplayId(x).toUpperCase() === pick.trim().toUpperCase());
            if (targetS && enabledStickers.includes(targetS.id) && window.gachaData.collection.includes(targetS.id)) {
                window.gachaData.wall[index] = targetS.id;
            } else {
                alert("尚未獲得或編號錯誤！");
            }
        }
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
        document.getElementById('lobby-modal-content').innerHTML = buildWallContent();
        if(typeof updateLobbyUI === 'function') updateLobbyUI();
    }
};

// ========== 輔助：天氣與特效粒子生成器 ==========
function spawnWeatherParticle(type, container, w, h) {
    let p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.pointerEvents = 'none';
    p.style.zIndex = '900'; 
    
    if (type === 'rain') {
        p.style.width = '2px'; p.style.height = '15px'; p.style.background = 'rgba(255,255,255,0.6)';
        p.style.left = (Math.random() * w) + 'px'; p.style.top = '-20px';
        container.appendChild(p);
        let duration = 0.3 + Math.random() * 0.2;
        p.style.transition = `transform ${duration}s linear`;
        setTimeout(() => p.style.transform = `translateY(${h + 50}px) translateX(-20px)`, 10);
        setTimeout(() => p.remove(), duration * 1000);
    } else if (type === 'snow') {
        p.innerText = '❄️'; p.style.fontSize = (8 + Math.random() * 10) + 'px';
        p.style.left = (Math.random() * w) + 'px'; p.style.top = '-20px';
        p.style.opacity = Math.random() * 0.8 + 0.2;
        container.appendChild(p);
        let duration = 3 + Math.random() * 2;
        p.style.transition = `transform ${duration}s linear`;
        setTimeout(() => p.style.transform = `translateY(${h + 50}px) translateX(${Math.random()*60 - 30}px) rotate(${Math.random()*360}deg)`, 10);
        setTimeout(() => p.remove(), duration * 1000);
    } else if (type === 'wind') {
        p.innerText = Math.random() > 0.5 ? '🍃' : '🍂'; 
        p.style.fontSize = (12 + Math.random() * 10) + 'px';
        p.style.left = '-30px'; 
        p.style.top = (Math.random() * h * 0.8) + 'px';
        p.style.opacity = Math.random() * 0.8 + 0.2;
        p.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))';
        container.appendChild(p);
        let duration = 0.8 + Math.random() * 1.2;
        p.style.transition = `transform ${duration}s linear`;
        setTimeout(() => p.style.transform = `translateX(${w + 50}px) translateY(${Math.random()*60 - 30}px) rotate(${Math.random()*720}deg)`, 10);
        setTimeout(() => p.remove(), duration * 1000);
    } else if (type === 'sun') {
        p.style.width = '10px'; p.style.height = '10px'; p.style.background = '#fff9c4';
        p.style.borderRadius = '50%'; p.style.boxShadow = '0 0 20px 10px rgba(255,255,200,0.6)';
        p.style.left = (Math.random() * w) + 'px'; p.style.top = (Math.random() * h) + 'px';
        p.style.opacity = '0';
        container.appendChild(p);
        p.style.animation = 'breatheAnim 3s ease-in-out';
        setTimeout(() => p.remove(), 3000);
    } else if (type === 'firefly') {
        p.style.width = '5px'; p.style.height = '5px'; p.style.background = '#f1c40f';
        p.style.borderRadius = '50%'; p.style.boxShadow = '0 0 10px 3px #f1c40f';
        p.style.left = (Math.random() * w) + 'px'; p.style.top = (h * 0.3 + Math.random() * h * 0.7) + 'px';
        container.appendChild(p);
        let duration = 2 + Math.random() * 3;
        p.style.transition = `all ${duration}s ease-in-out`;
        setTimeout(() => { p.style.transform = `translateY(-30px) translateX(${Math.random()*40-20}px)`; p.style.opacity = '0'; }, 10);
        setTimeout(() => p.remove(), duration * 1000);
    }
}

// ========== 🌟 村莊主引擎 ==========
function startVillageEngine() {
    const container = document.getElementById('village-container');
    if (!container) return; 
    
    if (window.villageAnimFrame) cancelAnimationFrame(window.villageAnimFrame);
    if (window.villageCampfireAudio) {
        window.villageCampfireAudio.pause();
        window.villageCampfireAudio.currentTime = 0;
    }
    if (window.superBalloonAudio) {
        window.superBalloonAudio.pause();
        window.superBalloonAudio.currentTime = 0;
    }

    let villagers = [];
    let contWidth = container.clientWidth || 400;
    let contHeight = container.clientHeight || 300;

    // 🌪️ 龍捲風、🎈 氣球與 ⭐ 星星狀態
    let tornado = { el: null, x: -150, active: false };
    let balloon = { el: null, active: false, x: 0, y: 0, isSuper: false };
    let starProp = { el: null, active: false, x: 0, y: 0 }; 

    // 🌟 1. 偵測日夜時段
    let hour = new Date().getHours();
    let timePhase = 'day'; 
    if (hour >= 17 && hour <= 18) {
        timePhase = 'evening'; 
    } else if (hour >= 19 || hour <= 5) {
        timePhase = 'night';   
    }

    // 🌟 2. 隨機決定天氣
    const dayWeathers = ['sun', 'rain', 'snow', 'fog', 'wind'];
    const eveningWeathers = ['sun', 'snow', 'rain', 'fog', 'wind'];
    const nightWeathers = ['clear', 'rain', 'snow', 'fog', 'storm']; 
    
    let weathers = timePhase === 'night' ? nightWeathers : (timePhase === 'evening' ? eveningWeathers : dayWeathers);
    let weather = weathers[Math.floor(Math.random() * weathers.length)];

    // 🌟 3. 背景對應
    const weatherBgs = {
        'day_sun': "url('assets/village_sun.png')", 'day_rain': "url('assets/village_rain.png')", 'day_snow': "url('assets/village_snow.png')", 'day_fog': "url('assets/village_fog.png')", 'day_wind': "url('assets/village_wind.png')",
        'evening_sun': "url('assets/village_evening_sun.png')", 'evening_snow': "url('assets/village_evening_snow.png')", 'evening_rain': "url('assets/village_evening_sun.png')", 'evening_fog': "url('assets/village_evening_sun.png')", 'evening_wind': "url('assets/village_evening_sun.png')",
        'night_clear': "url('assets/village_night.png')", 'night_snow': "url('assets/village_night_snow.png')", 'night_storm': "url('assets/village_night_storm.png')", 'night_rain': "url('assets/village_night.png')", 'night_fog': "url('assets/village_night.png')"
    };

    let bgKey = `${timePhase}_${weather}`;
    let bgImage = weatherBgs[bgKey] || "url('assets/village.png')"; 
    container.style.background = `${bgImage} center/cover no-repeat, linear-gradient(to bottom, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)`;
    
    let weatherOverlay = document.createElement('div');
    weatherOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:800;transition:all 1s;';
    
    if (weather === 'snow') weatherOverlay.style.background = timePhase === 'night' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'; 
    else if (weather === 'wind' || weather === 'storm') weatherOverlay.style.background = timePhase === 'night' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(200, 180, 150, 0.1)'; 
    else if (weather === 'sun') weatherOverlay.style.background = 'rgba(255, 255, 200, 0.1)'; 
    
    container.appendChild(weatherOverlay);

    let weatherLabel = document.createElement('div');
    let labelText = "";
    if (timePhase === 'night') {
        let nightIcons = { 'clear':'🌃 寧靜夜晚', 'rain':'🌧️ 夜間陣雨', 'snow':'❄️ 浪漫夜雪', 'fog':'🌫️ 迷蹤夜霧', 'storm':'⛈️ 狂風暴雨' };
        labelText = nightIcons[weather];
    } else if (timePhase === 'evening') {
        let eveningIcons = { 'sun':'🌇 傍晚夕陽', 'rain':'🌧️ 傍晚陣雨', 'snow':'❄️ 傍晚飄雪', 'fog':'🌫️ 傍晚微霧', 'wind':'🌪️ 傍晚狂風' };
        labelText = eveningIcons[weather];
    } else {
        let dayIcons = { 'sun':'🌞 晴空萬里', 'rain':'魔法陣雨', 'snow':'❄️ 浪漫雪天', 'fog':'🌫️ 迷蹤大霧', 'wind':'🌪️ 狂風大作' };
        labelText = dayIcons[weather];
    }
    
    weatherLabel.innerText = labelText;
    weatherLabel.style.cssText = 'position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); padding:5px 12px; border-radius:20px; font-weight:bold; color:#333; z-index:901; font-size:14px; box-shadow:0 3px 6px rgba(0,0,0,0.3); border:2px solid #fff;';
    container.appendChild(weatherLabel);

    // 🌟 4. 建立村民與寵物
    window.gachaData.wall.forEach((slotId) => {
        if (slotId !== null && enabledStickers.includes(slotId)) {
            let s = stickerDB.find(x => x.id === slotId);
            if (s) {
                let assets = getStickerAssets(s);
                let stars = window.gachaData.stars[s.id] || 0;
                
                let wrapper = document.createElement('div');
                wrapper.style.cssText = 'position:absolute; width:70px; height:70px; cursor:grab;'; 
                
                let umbrella = document.createElement('div');
                umbrella.innerHTML = Math.random() > 0.5 ? '☂️' : '🍃';
                umbrella.style.cssText = 'position:absolute; top:-25px; right:-15px; font-size:35px; display:none; z-index:1000; pointer-events:none; filter:drop-shadow(0 3px 3px rgba(0,0,0,0.4));';
                wrapper.appendChild(umbrella);

                let img = document.createElement('img');
                img.src = assets.img;
                img.style.cssText = 'width:100%; filter:drop-shadow(0 5px 5px rgba(0,0,0,0.4)); pointer-events:none; transition:transform 0.1s, filter 0.3s;';
                
                let bubble = document.createElement('div');
                bubble.style.cssText = 'position:absolute; top:-35px; left:50%; transform:translateX(-50%); background:white; border:2px solid #ffb6c1; border-radius:12px; padding:4px 10px; font-size:14px; font-weight:bold; color:#e74c3c; opacity:0; transition:opacity 0.3s; pointer-events:none; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:999;';
                
                wrapper.appendChild(img); wrapper.appendChild(bubble);

                let startX = Math.random() * (contWidth - 70);
                let startY = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 70); 
                wrapper.style.left = startX + 'px'; wrapper.style.top = startY + 'px';
                container.appendChild(wrapper);

                let petObj = null;
                if (s.id < 10 && stars >= 5 && typeof heroes !== 'undefined' && heroes[s.id] && heroes[s.id].petImg) {
                    let petImg = document.createElement('img');
                    petImg.src = heroes[s.id].petImg;
                    petImg.style.cssText = 'position:absolute; width:35px; filter:drop-shadow(0 3px 3px rgba(0,0,0,0.4)); pointer-events:none; transition:transform 0.1s;';
                    container.appendChild(petImg);
                    petObj = { el: petImg, x: startX - 40, y: startY + 20, direction: 1 };
                }

                let baseSpeed = 0.3 + Math.random() * 0.4;
                if (weather === 'rain') baseSpeed *= 1.5; else if (weather === 'snow') baseSpeed *= 0.6; else if (weather === 'wind') baseSpeed *= 1.8; else if (weather === 'storm') baseSpeed *= 2.5; 

                let v = {
                    el: wrapper, imgEl: img, bubble: bubble, umbrellaEl: umbrella, rarity: s.rarity, pet: petObj,
                    x: startX, y: startY, targetX: startX, targetY: startY,     
                    speed: baseSpeed, state: 'idle', timer: Math.random() * 100, direction: 1, fallVelocity: 0, targetFloorY: 0,
                    hasStar: false, speedMulti: 1, 
                    clickCount: 0, clickTimer: null, angle: Math.random() * Math.PI * 2,
                    showBubble: function(text, duration, color = '#e74c3c') {
                        this.bubble.innerText = text; this.bubble.style.color = color; this.bubble.style.opacity = '1';
                        clearTimeout(this.bubbleTimer);
                        this.bubbleTimer = setTimeout(() => { this.bubble.style.opacity = '0'; }, duration);
                    },
                    playAiya: function() {
                        let aiyaNum = Math.floor(Math.random() * 3) + 1;
                        let audio = new Audio(`assets/music/aiya${aiyaNum}.mp3`);
                        audio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                        audio.play().catch(e => {});
                    }
                };
                villagers.push(v);

                let isDragging = false, startMouseX, startMouseY;
                
                const triggerClick = () => {
                    if (v.state === 'sleep') {
                        v.state = 'idle'; v.timer = 60; v.showBubble('😳', 1500); 
                        v.imgEl.style.transform = `scale(1.2)`; setTimeout(() => { v.imgEl.style.transform = `scale(1)`; }, 200);
                        return; 
                    }

                    v.clickCount++; clearTimeout(v.clickTimer); v.clickTimer = setTimeout(() => { v.clickCount = 0; }, 2000);
                    if (v.clickCount >= 3) {
                        v.clickCount = 0; v.state = 'tickle'; v.timer = 80; v.showBubble('😆哈哈哈', 2000, '#e67e22');
                        if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); let u = new SpeechSynthesisUtterance("hahaha"); window.speechSynthesis.speak(u); }
                        return;
                    }

                    v.imgEl.style.transform = `translateY(-25px) scaleX(${v.direction}) scaleY(1.1)`;
                    setTimeout(() => { v.imgEl.style.transform = `translateY(0) scaleX(${v.direction}) scaleY(1)`; }, 300);
                    let currentLessons = (typeof activeLessons !== 'undefined' && activeLessons.length > 0) ? activeLessons : JSON.parse(localStorage.getItem('activeLessons') || '[]');
                    if (typeof lessonData !== 'undefined' && currentLessons.length > 0) {
                        let lesson = currentLessons[Math.floor(Math.random() * currentLessons.length)];
                        if (lessonData[lesson] && lessonData[lesson].length > 0) {
                            let word = lessonData[lesson][Math.floor(Math.random() * lessonData[lesson].length)];
                            v.showBubble(word, 2000, '#3498db');
                            if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); let utterance = new SpeechSynthesisUtterance(word); utterance.lang = 'en-US'; window.speechSynthesis.speak(utterance); }
                        }
                    } else v.showBubble("Hello!", 1500, '#e74c3c');
                };

                const startDrag = (cx, cy) => {
                    if (v.state === 'sleep') v.showBubble('😳', 1500);
                    isDragging = true; startMouseX = cx; startMouseY = cy;
                    let rect = container.getBoundingClientRect();
                    v.dragOffsetX = cx - rect.left - v.x; v.dragOffsetY = cy - rect.top - v.y;
                    v.state = 'drag'; v.el.style.zIndex = 9999; wrapper.style.cursor = 'grabbing';
                    v.imgEl.style.transition = 'none'; v.imgEl.style.transform = `scaleX(${v.direction}) scaleY(1.1) rotate(10deg)`;
                };

                const doDrag = (cx, cy) => {
                    if (!isDragging) return;
                    let rect = container.getBoundingClientRect();
                    v.x = cx - rect.left - v.dragOffsetX; v.y = cy - rect.top - v.dragOffsetY;
                };

                const endDrag = (cx, cy) => {
                    if (!isDragging) return;
                    isDragging = false; wrapper.style.cursor = 'grab'; v.imgEl.style.transition = 'transform 0.1s, filter 0.3s';
                    if (Math.hypot(cx - startMouseX, cy - startMouseY) < 10) { v.state = 'idle'; triggerClick(); } 
                    else {
                        v.state = 'fall'; v.fallVelocity = 0; v.targetFloorY = Math.max(contHeight * 0.6, v.y + 50); 
                        if(v.targetFloorY > contHeight - 70) v.targetFloorY = contHeight - 70;
                        v.shouldAiya = true;
                    }
                };

                wrapper.onmousedown = (e) => { if (e.button !== 0) return; startDrag(e.clientX, e.clientY);
                    const onMove = (me) => doDrag(me.clientX, me.clientY);
                    const onUp = (ue) => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); endDrag(ue.clientX, ue.clientY); };
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                };
                
                wrapper.ontouchstart = (e) => { startDrag(e.touches[0].clientX, e.touches[0].clientY);
                    const onMove = (me) => { me.preventDefault(); doDrag(me.touches[0].clientX, me.touches[0].clientY); };
                    const onUp = (ue) => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); endDrag(ue.changedTouches[0].clientX, ue.changedTouches[0].clientY); };
                    document.addEventListener('touchmove', onMove, {passive: false}); document.addEventListener('touchend', onUp);
                };
            }
        }
    });

    // 🏕️ 營火派對系統
    let campfire = { el: null, active: false, x: 0, y: 0 };
    let stopCampfire = () => {
        if (!campfire.active) return;
        campfire.active = false;
        if (campfire.el) campfire.el.remove();
        if (window.villageCampfireAudio) {
            window.villageCampfireAudio.pause();
            window.villageCampfireAudio.currentTime = 0;
        }
        villagers.forEach(v => {
            if (v.state === 'go_campfire' || v.state === 'sing') {
                v.state = 'idle'; v.timer = 60 + Math.random() * 60;
                v.showBubble('👋', 1500, '#3498db');
            }
        });
    };

    let propCampfireBtn = document.getElementById('prop-campfire');
    let isDraggingCampfire = false; let ghostCampfire = null;

    if (propCampfireBtn) {
        const startCampfireDrag = (cx, cy) => {
            if (timePhase !== 'night') { alert("🌙 營火晚會只能在晚上點燃喔！"); return; }
            if (campfire.active) { alert("🔥 村莊裡已經有一個營火囉！"); return; }
            isDraggingCampfire = true;
            ghostCampfire = document.createElement('img');
            ghostCampfire.src = 'assets/campfire.png';
            ghostCampfire.style.cssText = 'position:fixed; width:70px; z-index:10000; pointer-events:none; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.5));';
            ghostCampfire.style.left = (cx - 35) + 'px'; ghostCampfire.style.top = (cy - 35) + 'px';
            document.body.appendChild(ghostCampfire);
        };
        const doCampfireDrag = (cx, cy) => {
            if (!isDraggingCampfire || !ghostCampfire) return;
            ghostCampfire.style.left = (cx - 35) + 'px'; ghostCampfire.style.top = (cy - 35) + 'px';
        };
        const endCampfireDrag = (cx, cy) => {
            if (!isDraggingCampfire) return;
            isDraggingCampfire = false;
            if (ghostCampfire) ghostCampfire.remove();
            
            let rect = container.getBoundingClientRect();
            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
                campfire.active = true; campfire.x = cx - rect.left; campfire.y = cy - rect.top;
                let el = document.createElement('img');
                el.src = 'assets/campfire.png';
                el.style.cssText = `position:absolute; width:90px; left:${campfire.x - 45}px; top:${campfire.y - 70}px; z-index:${Math.floor(campfire.y)}; filter: drop-shadow(0 0 15px #f39c12); cursor:grab; pointer-events:auto;`;
                el.onmousedown = (e) => { e.preventDefault(); e.stopPropagation(); stopCampfire(); };
                el.ontouchstart = (e) => { e.preventDefault(); e.stopPropagation(); stopCampfire(); };
                container.appendChild(el); campfire.el = el;
                
                window.villageCampfireAudio.currentTime = 0;
                window.villageCampfireAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                window.villageCampfireAudio.play().catch(e=>{});
                
                villagers.forEach(v => {
                    if (v.state !== 'drag' && v.state !== 'tornado' && v.state !== 'go_star') {
                        v.state = 'go_campfire';
                        if (v.state === 'sleep') { v.showBubble('😳', 1000); v.imgEl.style.transform = `scale(1.2)`; setTimeout(() => { v.imgEl.style.transform = `scale(1)`; }, 200); }
                    }
                });
            }
        };

        propCampfireBtn.onmousedown = (e) => { e.preventDefault(); startCampfireDrag(e.clientX, e.clientY); };
        document.addEventListener('mousemove', (e) => { doCampfireDrag(e.clientX, e.clientY); });
        document.addEventListener('mouseup', (e) => { endCampfireDrag(e.clientX, e.clientY); });
        propCampfireBtn.ontouchstart = (e) => { e.preventDefault(); startCampfireDrag(e.touches[0].clientX, e.touches[0].clientY); };
        document.addEventListener('touchmove', (e) => { if(isDraggingCampfire) e.preventDefault(); doCampfireDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        document.addEventListener('touchend', (e) => { endCampfireDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    }

    // ⭐ 加速星星系統
    let propStarBtn = document.getElementById('prop-star');
    let isDraggingStar = false; let ghostStar = null;

    if (propStarBtn) {
        const startStarDrag = (cx, cy) => {
            if (starProp.active) { alert("⭐ 村莊裡已經有一顆加速星星囉！"); return; }
            isDraggingStar = true;
            ghostStar = document.createElement('img');
            ghostStar.src = 'assets/speed_star.png';
            ghostStar.onerror = function() { this.outerHTML = '<div style="font-size:40px; position:fixed; z-index:10000; pointer-events:none; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.5));">⭐</div>'; };
            ghostStar.style.cssText = 'position:fixed; width:50px; z-index:10000; pointer-events:none; filter:drop-shadow(0 5px 10px rgba(0,0,0,0.5));';
            ghostStar.style.left = (cx - 25) + 'px'; ghostStar.style.top = (cy - 25) + 'px';
            document.body.appendChild(ghostStar);
        };
        const doStarDrag = (cx, cy) => {
            if (!isDraggingStar || !ghostStar) return;
            ghostStar.style.left = (cx - 25) + 'px'; ghostStar.style.top = (cy - 25) + 'px';
        };
        const endStarDrag = (cx, cy) => {
            if (!isDraggingStar) return;
            isDraggingStar = false;
            if (ghostStar) ghostStar.remove();
            
            let rect = container.getBoundingClientRect();
            if (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom) {
                starProp.active = true; starProp.x = cx - rect.left; starProp.y = cy - rect.top;
                
                let el = document.createElement('img');
                el.src = 'assets/speed_star.png';
                el.onerror = function() { this.outerHTML = '<div style="font-size:40px; position:absolute; z-index:850; filter:drop-shadow(0 0 15px #f1c40f); animation:breatheAnim 1s infinite; pointer-events:none;">⭐</div>'; };
                el.style.cssText = `position:absolute; width:50px; left:${starProp.x - 25}px; top:${starProp.y - 25}px; z-index:${Math.floor(starProp.y)}; filter: drop-shadow(0 0 15px #f1c40f); animation: breatheAnim 1s infinite; pointer-events:none;`;
                container.appendChild(el); starProp.el = el;
                
                villagers.forEach(v => {
                    if (v.state !== 'drag' && v.state !== 'tornado' && v.state !== 'sleep') {
                        v.state = 'go_star';
                        v.showBubble('⭐!', 1000, '#f1c40f');
                    }
                });
            }
        };

        propStarBtn.onmousedown = (e) => { e.preventDefault(); startStarDrag(e.clientX, e.clientY); };
        document.addEventListener('mousemove', (e) => { doStarDrag(e.clientX, e.clientY); });
        document.addEventListener('mouseup', (e) => { endStarDrag(e.clientX, e.clientY); });
        propStarBtn.ontouchstart = (e) => { e.preventDefault(); startStarDrag(e.touches[0].clientX, e.touches[0].clientY); };
        document.addEventListener('touchmove', (e) => { if(isDraggingStar) e.preventDefault(); doStarDrag(e.touches[0].clientX, e.touches[0].clientY); }, {passive: false});
        document.addEventListener('touchend', (e) => { endStarDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY); });
    }

    // 🌟 5. 遊戲主迴圈
    function update() {
        if (!document.body.contains(container)) {
            if (window.villageCampfireAudio) { window.villageCampfireAudio.pause(); window.villageCampfireAudio.currentTime = 0; }
            if (window.superBalloonAudio) { window.superBalloonAudio.pause(); window.superBalloonAudio.currentTime = 0; }
            return; 
        }

        if (weather === 'rain' && Math.random() < 0.35) spawnWeatherParticle('rain', container, contWidth, contHeight);
        else if (weather === 'snow' && Math.random() < 0.15) spawnWeatherParticle('snow', container, contWidth, contHeight);
        else if (weather === 'wind' && Math.random() < 0.2) spawnWeatherParticle('wind', container, contWidth, contHeight);
        else if (weather === 'sun' && Math.random() < 0.02) spawnWeatherParticle('sun', container, contWidth, contHeight);
        else if (weather === 'storm') {
            if (Math.random() < 0.6) spawnWeatherParticle('rain', container, contWidth, contHeight); 
            if (Math.random() < 0.25) spawnWeatherParticle('wind', container, contWidth, contHeight); 
        }
        if (timePhase === 'night' && weather !== 'storm' && Math.random() < 0.08) spawnWeatherParticle('firefly', container, contWidth, contHeight);

        // 🌪️ 龍捲風事件
        if ((weather === 'wind' || weather === 'storm') && !tornado.active && Math.random() < 0.005) {
            tornado.active = true; tornado.x = -150;
            tornado.el = document.createElement('div'); tornado.el.innerHTML = '🌪️';
            tornado.el.style.cssText = 'position:absolute; font-size:100px; z-index:950; top:50%; filter:drop-shadow(0 0 15px rgba(255,255,255,0.8)); transition: top 0.5s; pointer-events:none;';
            container.appendChild(tornado.el);
        }
        if (tornado.active) {
            tornado.x += 3; tornado.el.style.left = tornado.x + 'px'; tornado.el.style.top = (45 + Math.sin(Date.now() / 150) * 15) + '%';
            if (tornado.x > contWidth + 150) { tornado.el.remove(); tornado.active = false; }
        }

        // 🎈 氣球送禮系統
        if (!balloon.active && Math.random() < 0.003) { 
            balloon.active = true;
            balloon.x = -60;
            balloon.y = contHeight * 0.2 + Math.random() * (contHeight * 0.4);
            balloon.isSuper = Math.random() < 0.3;
            
            let bel = document.createElement('div');
            bel.style.cssText = `position:absolute; left:${balloon.x}px; top:${balloon.y}px; width:60px; height:80px; cursor:crosshair; z-index:960; transition: transform 0.2s;`;
            
            if (balloon.isSuper) {
                bel.innerHTML = `<img src="assets/super_balloon.png" style="width:120%; filter:drop-shadow(0 0 15px #f1c40f) brightness(1.2); pointer-events:none;" onerror="this.src='${FALLBACK_IMAGE}'">`;
                
                if (window.superBalloonAudio) window.superBalloonAudio.pause();
                window.superBalloonAudio = new Audio('assets/music/super_alert.mp3');
                window.superBalloonAudio.loop = true; 
                window.superBalloonAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                window.superBalloonAudio.play().catch(e => {});
            } else {
                bel.innerHTML = `<img src="assets/balloon.png" style="width:100%; filter:drop-shadow(2px 5px 5px rgba(0,0,0,0.3)); pointer-events:none;" onerror="this.src='${FALLBACK_IMAGE}'">`;
            }
            
            bel.onclick = function() {
                if (!balloon.active) return;
                balloon.active = false; 
                bel.innerHTML = '💥'; bel.style.fontSize = balloon.isSuper ? '60px' : '40px';
                setTimeout(() => bel.remove(), 500);
                
                if (balloon.isSuper && window.superBalloonAudio) {
                    window.superBalloonAudio.pause();
                    window.superBalloonAudio.currentTime = 0;
                }

                let isTestMode = window.gachaData.coins >= 99999;
                let gotReward = false;
                let floatText = '', floatColor = '', popAudioSrc = balloon.isSuper ? 'assets/music/super_pop.mp3' : 'assets/music/balloon_pop.mp3';

                if (balloon.isSuper) {
                    let currentSuper = window.gachaData.superBalloonCount || 0;
                    if (currentSuper < 3 || isTestMode) {
                        window.gachaData.dust += 1; 
                        if (!isTestMode) window.gachaData.superBalloonCount = currentSuper + 1;
                        gotReward = true; floatText = '+1✨'; floatColor = '#8e44ad'; 
                    }
                } else {
                    let currentNormal = window.gachaData.normalBalloonCount || 0;
                    if (currentNormal < 10 || isTestMode) {
                        window.gachaData.coins += 1; 
                        if (!isTestMode) window.gachaData.normalBalloonCount = currentNormal + 1;
                        gotReward = true; floatText = '+1🪙'; floatColor = '#f39c12'; 
                    }
                }

                if (!gotReward) { floatText = '❤️'; floatColor = '#e74c3c'; popAudioSrc = 'assets/music/balloon_pop.mp3'; }

                let popAudio = new Audio(popAudioSrc); 
                popAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                popAudio.play().catch(e => {});

                if (gotReward) {
                    localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
                    if(typeof updateLobbyUI === 'function') updateLobbyUI();
                    
                    let nt = document.getElementById('normal-balloon-tracker'); let st = document.getElementById('super-balloon-tracker');
                    if (nt) nt.innerText = isTestMode ? '🎈 普通: ∞' : `🎈 普通: ${window.gachaData.normalBalloonCount}/10`;
                    if (st) st.innerText = isTestMode ? '🌟 超級: ∞' : `🌟 超級: ${window.gachaData.superBalloonCount}/3`;
                }
                
                let ft = document.createElement('div'); 
                ft.innerHTML = floatText;
                ft.style.cssText = `position:absolute; left:${balloon.x}px; top:${balloon.y}px; color:${floatColor}; font-weight:bold; font-size:30px; z-index:9999; text-shadow:1px 1px 2px white,-1px -1px 2px white; transition:all 1s ease-out;`;
                container.appendChild(ft);
                setTimeout(() => { ft.style.top = (balloon.y - 50) + 'px'; ft.style.opacity = '0'; }, 50); 
                setTimeout(() => ft.remove(), 1000);
            };
            container.appendChild(bel);
            balloon.el = bel;
        }
        
        if (balloon.active && balloon.el) {
            balloon.x += balloon.isSuper ? 3.5 : 1; 
            balloon.y += Math.sin(Date.now() / (balloon.isSuper ? 150 : 300)) * (balloon.isSuper ? 1.5 : 0.6); 
            balloon.el.style.left = balloon.x + 'px'; balloon.el.style.top = balloon.y + 'px';
            
            if (balloon.x > contWidth + 50 || balloon.y < -100) { 
                balloon.el.remove(); balloon.active = false; 
                if (balloon.isSuper && window.superBalloonAudio) { window.superBalloonAudio.pause(); window.superBalloonAudio.currentTime = 0; }
            }
        }

        if (campfire.active && campfire.el) {
            let glowScale = 1 + Math.sin(Date.now()/100) * 0.05;
            campfire.el.style.transform = `scale(${glowScale})`; 
        }

        // 🎁 寶藏系統
        let today = new Date().toDateString();
        if (window.gachaData.treasureCount === undefined) window.gachaData.treasureCount = 0;
        
        if (window.gachaData.treasureCount < 3 && Math.random() < 0.0001 && !document.getElementById('village-treasure')) {
            let t = document.createElement('div'); t.id = 'village-treasure';
            t.innerHTML = '🎁';
            t.style.cssText = 'position:absolute; font-size:35px; cursor:pointer; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4)); animation:breatheAnim 1.5s infinite;';
            let tx = Math.random() * (contWidth - 40); let ty = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 40);
            t.style.left = tx + 'px'; t.style.top = ty + 'px'; t.style.zIndex = Math.floor(ty);
            t.onclick = function() {
                window.gachaData.coins += 1; window.gachaData.treasureCount++;
                localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData)); 
                if(typeof updateLobbyUI === 'function') updateLobbyUI();
                let ft = document.createElement('div'); ft.innerHTML = `+1🪙`;
                ft.style.cssText = `position:absolute; left:${tx}px; top:${ty}px; color:#f39c12; font-weight:bold; font-size:24px; z-index:9999; text-shadow:1px 1px 2px white,-1px -1px 2px white; transition:all 1s ease-out;`;
                container.appendChild(ft); setTimeout(() => { ft.style.top = (ty - 50) + 'px'; ft.style.opacity = '0'; }, 50); setTimeout(() => ft.remove(), 1000);
                t.remove();
            };
            container.appendChild(t);
        }

        // ❤️ 村民社交相遇
        for (let i = 0; i < villagers.length; i++) {
            for (let j = i + 1; j < villagers.length; j++) {
                let v1 = villagers[i], v2 = villagers[j];
                if ((v1.state === 'walk' || v1.state === 'idle') && (v2.state === 'walk' || v2.state === 'idle')) {
                    let dx = v1.x - v2.x, dy = v1.y - v2.y;
                    if (Math.sqrt(dx*dx + dy*dy) < 40 && Math.random() < 0.05) {
                        v1.state = 'chat'; v2.state = 'chat'; v1.timer = 80; v2.timer = 80;
                        v1.direction = v1.x > v2.x ? -1 : 1; v2.direction = v2.x > v1.x ? -1 : 1;
                        v1.showBubble('❤️', 2000, '#e74c3c'); v2.showBubble('❤️', 2000, '#e74c3c');
                    }
                }
            }
        }

        villagers.forEach((v, vIndex) => {
            if ((weather === 'rain' || weather === 'storm') && v.state !== 'drag' && v.state !== 'tornado') v.umbrellaEl.style.display = 'block';
            else v.umbrellaEl.style.display = 'none';

            if (tornado.active && Math.abs(v.x - tornado.x) < 50 && v.state !== 'drag' && v.state !== 'tornado') {
                v.state = 'tornado'; v.timer = 150; v.showBubble('哇啊啊～', 2000);
            }

            // 狀態機判斷
            if (v.state === 'tornado') {
                v.timer--; v.y -= 2.5; v.x = tornado.x + Math.sin(Date.now() / 50) * 40; 
                v.imgEl.style.transform = `rotate(${Date.now()}deg) scale(0.7)`;
                if (v.timer <= 0) { v.state = 'fall'; v.fallVelocity = 0; v.targetFloorY = contHeight - 70; v.shouldAiya = true; }
            } else if (v.state === 'go_star') {
                if (!starProp.active) {
                    v.state = 'idle'; v.timer = 30 + Math.random() * 30; v.showBubble('😩', 1500);
                } else {
                    let dx = starProp.x - v.x, dy = starProp.y - v.y, dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 30) {
                        starProp.active = false;
                        if (starProp.el) starProp.el.remove();
                        v.speedMulti = 3; v.hasStar = true; v.state = 'tickle'; v.timer = 80;
                        v.showBubble('⚡超快！', 2000, '#f1c40f');
                        
                        try { 
                            let eatSfx = new Audio('assets/music/balloon_pop.mp3'); 
                            eatSfx.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
                            eatSfx.play().catch(e=>{});
                        } catch(e){}

                        v.imgEl.style.filter = 'drop-shadow(0 0 15px #f1c40f) brightness(1.2)';

                        villagers.forEach(other => {
                            if (other !== v && other.state === 'go_star') {
                                other.state = 'idle'; other.timer = 60; other.showBubble('😩沒搶到', 1500);
                            }
                        });
                    } else {
                        let currentSpeed = v.speed * 2.5 * (v.hasStar ? v.speedMulti : 1);
                        v.x += (dx / dist) * currentSpeed; v.y += (dy / dist) * currentSpeed;
                        v.direction = dx > 0 ? 1 : -1;
                    }
                }
            } else if (v.state === 'go_campfire') {
                let dx = campfire.x - v.x, dy = (campfire.y - 15) - v.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) { 
                    v.state = 'sing'; v.angle = Math.atan2(dy, dx); 
                } else {
                    let currentSpeed = v.speed * 2 * (v.hasStar ? v.speedMulti : 1);
                    v.x += (dx / dist) * currentSpeed; v.y += (dy / dist) * currentSpeed;
                    v.direction = dx > 0 ? 1 : -1;
                }
            } else if (v.state === 'sing') {
                v.angle += 0.04 * (v.hasStar ? 2 : 1); 
                let radius = 120; 
                v.x = campfire.x + Math.cos(v.angle) * radius - 35; 
                v.y = (campfire.y - 15) + Math.sin(v.angle) * (radius * 0.4) - 35; 
                v.direction = Math.sin(v.angle + Math.PI/2) > 0 ? 1 : -1; 
                if (Math.random() < 0.02) v.showBubble(['🎵', '🎶', '✨', '❤️'][Math.floor(Math.random()*4)], 1000, '#f1c40f');
            } else if (v.state === 'tickle') {
                v.timer--; v.imgEl.style.transform = `scaleX(${v.direction}) rotate(${Math.sin(Date.now() / 30) * 20}deg)`;
                if (v.timer <= 0) v.state = 'idle';
            } else if (v.state === 'sleep') {
                v.timer--; if (v.timer % 80 === 0) v.showBubble('Zzz...', 1500, '#8e44ad');
                v.imgEl.style.transform = `scaleX(${v.direction}) scaleY(${1 + Math.sin(Date.now() / 400) * 0.02})`; 
                if (v.timer <= 0) v.state = 'idle';
            } else if (v.state === 'idle' || v.state === 'chat') {
                v.timer--;
                if (v.timer <= 0) {
                    if (timePhase === 'night' && Math.random() < 0.3 && !v.hasStar) { v.state = 'sleep'; v.timer = 200 + Math.random() * 200; } 
                    else {
                        v.state = 'walk'; v.targetX = Math.random() * (contWidth - 70); v.targetY = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 70);
                        v.direction = v.targetX > v.x ? 1 : -1; 
                    }
                }
            } else if (v.state === 'walk') {
                let dx = v.targetX - v.x, dy = v.targetY - v.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 2) { v.state = 'idle'; v.timer = 60 + Math.random() * 120; } 
                else {
                    let currentSpeed = v.speed * (v.hasStar ? v.speedMulti : 1);
                    v.x += (dx / dist) * currentSpeed; v.y += (dy / dist) * currentSpeed;
                    if (v.rarity === 'SSR' && Math.random() < 0.1 && typeof spawnParticle === 'function') spawnParticle(v.x, v.y+60, '⭐', '#f1c40f', container);
                    else if (v.rarity === 'SR' && Math.random() < 0.05 && typeof spawnParticle === 'function') spawnParticle(v.x, v.y+60, '✨', '#9b59b6', container);
                }
            } else if (v.state === 'fall') {
                v.fallVelocity += 1.5; v.y += v.fallVelocity;
                if (v.y >= v.targetFloorY) {
                    v.y = v.targetFloorY;
                    if (v.fallVelocity > 5) v.fallVelocity = -v.fallVelocity * 0.4; 
                    else { 
                        v.state = 'idle'; 
                        if (v.shouldAiya) { v.playAiya(); v.showBubble('哎呀！', 1500); v.shouldAiya = false; } 
                        else { v.showBubble('😵', 1500, '#e74c3c'); }
                    } 
                }
            }

            v.el.style.left = v.x + 'px'; v.el.style.top = v.y + 'px';
            
            // 更新彈跳和旋轉
            if (v.state !== 'drag' && v.state !== 'tornado' && v.state !== 'tickle' && v.state !== 'sleep') {
                v.el.style.zIndex = Math.floor(v.y);
                let bounceBase = ((weather === 'wind' || weather === 'storm') ? 10 : 6) * (v.hasStar ? 1.5 : 1);
                let bounce = (v.state === 'walk' || v.state === 'go_campfire' || v.state === 'go_star') ? Math.abs(Math.sin(Date.now() / (v.hasStar ? 40 : 80))) * bounceBase : 0;
                
                if (v.state === 'sing') {
                    let jumpCycle = (Date.now() + vIndex * 400) % 2000;
                    if (jumpCycle < 400) bounce = Math.sin((jumpCycle / 400) * Math.PI) * 35; 
                    else bounce = Math.abs(Math.sin(Date.now() / 80)) * 5; 
                }
                
                let breathe = (v.state === 'idle' || v.state === 'chat' || v.state === 'sing') ? 1 + Math.sin(Date.now() / 200) * 0.03 : 1;
                let tilt = ((weather === 'wind' || weather === 'storm') && (v.state === 'walk' || v.state === 'go_campfire' || v.state === 'go_star')) ? 'rotate(5deg)' : '';
                v.imgEl.style.transform = `scaleX(${v.direction}) scaleY(${breathe}) translateY(-${bounce}px) ${tilt}`;
            }

            // 寵物跟隨邏輯
            if (v.pet) {
                let pdx = v.x - v.pet.x - (v.direction * 35); 
                let pdy = v.y + 20 - v.pet.y;
                v.pet.x += pdx * 0.15; v.pet.y += pdy * 0.15; v.pet.direction = pdx > 0 ? 1 : -1;
                let pBounce = (v.state === 'walk' || v.state === 'go_campfire' || v.state === 'go_star') ? Math.abs(Math.sin(Date.now() / (v.hasStar ? 30 : 60))) * 4 : Math.sin(Date.now()/150)*3;
                
                if (v.state === 'sing') {
                    let pJumpCycle = (Date.now() + vIndex * 400 + 100) % 2000; 
                    if (pJumpCycle < 400) pBounce = Math.sin((pJumpCycle / 400) * Math.PI) * 20; 
                    else pBounce = Math.abs(Math.sin(Date.now() / 60)) * 4;
                }
                
                v.pet.el.style.left = v.pet.x + 'px'; v.pet.el.style.top = (v.pet.y - pBounce) + 'px';
                v.pet.el.style.transform = `scaleX(${v.pet.direction})`;
                v.pet.el.style.zIndex = Math.floor(v.pet.y);
            }
        });

        window.villageAnimFrame = requestAnimationFrame(update);
    }
    
    update(); 
}