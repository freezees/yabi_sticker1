// lobby.js - 終極大廳版 (包含：完美貼紙村莊互動系統、滿星防呆、寵物位置調高、規則更新)

const rarityFolderMap = { 'SSR': 'ssr', 'SR': 'sr', 'R': 'r', 'N': 'normal' };
const FALLBACK_IMAGE = 'assets/meteor.png';

// ★ 統一使用 system.js 的全域概念，確保不會重複產生物件
window.shopBgm = window.shopBgm || new Audio('assets/music/shop_bgm.mp3');
window.shopBgm.loop = true;
window.villageBgm = window.villageBgm || new Audio('assets/music/village_bgm.mp3');
window.villageBgm.loop = true;
window.gachaBgm = window.gachaBgm || new Audio('assets/music/gacha_bgm.mp3');
window.gachaBgm.loop = true;

// ========== 貼紙輔助函數 ==========
function getStickerDisplayId(s) {
    let rank = stickerDB.filter(x => x.rarity === s.rarity && x.id <= s.id).length;
    return (s.rarity + rank).toLowerCase();
}

function getStickerAssets(s) {
    let folder = rarityFolderMap[s.rarity] || 'normal';
    let baseName = getStickerDisplayId(s);
    return { img: `sticker/${folder}/${baseName}.png`, vid: `sticker_video/${folder}/intro${baseName}.mp4` };
}

function checkUnlocks() {
    if (!window.gachaData || !window.gachaData.collection) {
        window.gachaData = { coins: 0, dust: 0, collection: [0, 1], wall: [null, null, null, null, null], stars: { 0: 0, 1: 0 } };
    }
    heroes.forEach((h, idx) => {
        h.unlocked = (idx === 0 || idx === 1) ? true : window.gachaData.collection.includes(idx);
    });
}

function changeHeroSelection(dir) {
    checkUnlocks();
    let loopLimit = 0;
    do {
        selectedHeroIdx = (selectedHeroIdx + dir + heroes.length) % heroes.length;
        loopLimit++;
        if (loopLimit > heroes.length) break;
    } while (selectedHeroIdx > 1 && (!enabledStickers || !enabledStickers.includes(selectedHeroIdx)));

    const h = heroes[selectedHeroIdx];
    if (!h) return;

    let stars = window.gachaData.stars[selectedHeroIdx] || 0;
    let isPassiveUnlocked = stars >= 5;

    let preview = document.getElementById('selected-char-preview');
    if (preview) {
        preview.src = `${h.folder}/hero.png`;
        preview.onerror = function () { this.src = FALLBACK_IMAGE; };
        if (h.unlocked && selectedHeroIdx < 10) preview.classList.add('ssr-glow');
        else preview.classList.remove('ssr-glow');

        // ★ 大廳寵物位置調整 (調高到 150px)
        let petImg = document.getElementById('pet-preview');
        if (!petImg) {
            petImg = document.createElement('img');
            petImg.id = 'pet-preview';
            petImg.style.position = 'absolute';
            petImg.style.bottom = '150px';  
            petImg.style.left = '-10px';  
            petImg.style.width = '90px'; 
            petImg.style.filter = 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))';
            petImg.style.animation = 'breatheAnim 2s infinite'; 
            petImg.style.pointerEvents = 'none';
            petImg.style.zIndex = '1';    
            
            preview.style.position = 'relative';
            preview.style.zIndex = '2';   

            if (window.getComputedStyle(preview.parentElement).position === 'static') {
                preview.parentElement.style.position = 'relative';
            }
            preview.parentElement.appendChild(petImg);
        }

        if (h.unlocked && isPassiveUnlocked && h.petImg) {
            petImg.src = h.petImg;
            petImg.style.display = 'block';
        } else {
            petImg.style.display = 'none';
        }
    }

    const status = document.getElementById('char-status-text');
    const startBtn = document.getElementById('central-start-btn');
    if (h.unlocked) {
        if (preview) preview.classList.remove('char-locked');
        if (status) {
            status.innerHTML = `
                <div style="color:#ff1493; font-size:26px; font-weight:900;">${h.name}</div>
                <div style="color:#f06292; font-size:16px; margin-bottom:8px;">⚔️ ${h.title}</div>
                
                <div style="background: rgba(255,255,255,0.9); border: 2px solid #ffb6c1; border-radius: 12px; padding: 10px; font-size: 15px; text-align: left; display: inline-block; color: #333; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 320px; position:relative; z-index:10;">
                    <div style="display: flex; gap: 15px; justify-content: center; margin-bottom: 5px;">
                        <span>💖 生命: <b style="color:#e74c3c; font-size:18px;">${h.baseHp}</b></span>
                        <span>🪄 提示: <b style="color:#3498db; font-size:18px;">${h.baseHints}</b></span>
                    </div>
                    <div style="background: ${isPassiveUnlocked ? '#fdf2e9' : '#f4f6f7'}; padding: 8px 10px; border-radius: 8px; font-size: 13px; color: ${isPassiveUnlocked ? '#8e44ad' : '#7f8c8d'}; text-align: center; font-weight: bold; border: 1px dashed ${isPassiveUnlocked ? '#8e44ad' : '#bdc3c7'}; line-height: 1.4;">
                        ${isPassiveUnlocked ? h.passiveDesc : '🔒 第四招被動 (滿五星解鎖，並召喚專屬寵物)'}
                    </div>
                </div>
            `;
        }
        if (startBtn) startBtn.style.display = "block";
    } else {
        if (preview) preview.classList.add('char-locked');
        if (status) status.innerHTML = `<div style="color:#aaa; font-size:22px; font-weight:bold;">🔒 尚未解鎖</div><div style="color:#ccc; font-size:14px;">在轉蛋屋抽到她的彩色貼紙來喚醒！</div>`;
        if (startBtn) startBtn.style.display = "none";
    }
}

// ========== 開放設定（家長功能）==========
function openPoolEditor() {
    if (typeof verifyParent === 'function' && !verifyParent()) return;
    let m = document.getElementById('pool-edit-modal');
    if (!m) {
        m = document.createElement('div');
        m.id = 'pool-edit-modal';
        m.className = 'modal-overlay';
        m.style.zIndex = '9600';
        document.body.appendChild(m);
    }

    let counts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };
    enabledStickers.forEach(id => { let s = stickerDB.find(x => x.id === id); if (s) counts[s.rarity]++; });

    let totals = {
        'SSR': stickerDB.filter(x => x.rarity === 'SSR').length,
        'SR': stickerDB.filter(x => x.rarity === 'SR').length,
        'R': stickerDB.filter(x => x.rarity === 'R').length,
        'N': stickerDB.filter(x => x.rarity === 'N').length
    };

    m.innerHTML = `
    <div class="modal-content" style="max-width: 500px; width: 90%; text-align: center;">
        <button class="close-btn" onclick="closePoolEditor()">X</button>
        <h2 style="color:#8e44ad; margin-bottom: 20px;">⚙️ 快速開放設定</h2>
        <div style="font-size:16px; color:#666; margin-bottom:20px;">請輸入各稀有度要開放「前幾張」貼紙：</div>
        <div style="display:flex; flex-direction:column; gap:15px; background:#f9f9f9; padding:20px; border-radius:15px; border:2px solid #ddd;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#ff4757; font-weight:bold; font-size:18px;">🌈 彩色 (SSR)</span>
                <div>開放前 <input type="number" id="input-ssr" value="${counts['SSR']}" min="1" max="${totals['SSR']}" style="width:60px; text-align:center;"> / ${totals['SSR']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#8e44ad; font-weight:bold; font-size:18px;">🟪 紫色 (SR)</span>
                <div>開放前 <input type="number" id="input-sr" value="${counts['SR']}" min="0" max="${totals['SR']}" style="width:60px; text-align:center;"> / ${totals['SR']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#f39c12; font-weight:bold; font-size:18px;">🟨 金色 (R)</span>
                <div>開放前 <input type="number" id="input-r" value="${counts['R']}" min="0" max="${totals['R']}" style="width:60px; text-align:center;"> / ${totals['R']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#7f8c8d; font-weight:bold; font-size:18px;">⬜ 普通 (N)</span>
                <div>開放前 <input type="number" id="input-n" value="${counts['N']}" min="0" max="${totals['N']}" style="width:60px; text-align:center;"> / ${totals['N']} 張</div>
            </div>
        </div>
        <button class="big-btn" style="margin-top:25px; background:#3498db;" onclick="savePoolEditorByCount()">💾 儲存設定</button>
    </div>`;
    m.style.display = 'flex';
}

function closePoolEditor() {
    const modal = document.getElementById('pool-edit-modal');
    if (modal) modal.style.display = 'none';
}

function savePoolEditorByCount() {
    let limits = {
        'SSR': parseInt(document.getElementById('input-ssr').value) || 0,
        'SR': parseInt(document.getElementById('input-sr').value) || 0,
        'R': parseInt(document.getElementById('input-r').value) || 0,
        'N': parseInt(document.getElementById('input-n').value) || 0
    };
    let newEnabled = [];
    let currentRarityCounts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };
    stickerDB.forEach(s => {
        currentRarityCounts[s.rarity]++;
        if (currentRarityCounts[s.rarity] <= limits[s.rarity]) newEnabled.push(s.id);
    });
    if (!newEnabled.includes(0)) newEnabled.push(0);
    if (!newEnabled.includes(1)) newEnabled.push(1);
    enabledStickers = newEnabled;
    localStorage.setItem('dragonGameEnabledStickers', JSON.stringify(enabledStickers));
    closePoolEditor();
    updateLobbyUI();
    checkUnlocks();
    changeHeroSelection(0);
    alert("✅ 卡池設定已儲存！");
}

// ========== 貼紙加成計算核心 (依照您的最新規則) ==========
function calcBuffs() {
    if (!window.gachaData || !window.gachaData.collection) return;

    let ssrCount = 0;
    let srCount = 0;
    let rCount = 0;
    let nCount = 0;
    let srMaxCount = 0;

    // 掃描玩家擁有的所有貼紙
    window.gachaData.collection.forEach(id => {
        // 只計算「家長功能」中設定為開放的貼紙
        if (!enabledStickers.includes(id)) return;
        
        let s = stickerDB.find(x => x.id === id);
        if (!s) return;

        let stars = window.gachaData.stars[id] || 0;

        if (s.rarity === 'SSR') ssrCount++;
        if (s.rarity === 'SR') {
            srCount++;
            if (stars >= 5) srMaxCount++; // SR 滿星額外加成
        }
        if (s.rarity === 'R') rCount++;
        if (s.rarity === 'N') nCount++;
    });

    // 依照您的規則設定全域變數
    window.hpBuffAmt = ssrCount;                    // SSR: 每張 +1 血量
    window.critRate = 5 + srCount + srMaxCount;     // SR: 基礎 5% + 每張 1% + 滿星再 1%
    window.hintBuffAmt = Math.floor(rCount / 10);   // R: 每 10 張 +1 提示
    window.extraCoinsBonus = Math.floor(nCount / 10); // N: 每 10 張 +1 代幣
}


// ========== 更新大廳 UI ==========
function updateLobbyUI() {
    if (typeof calcBuffs === 'function') calcBuffs();
    const coinEl = document.getElementById('lobby-coin-val');
    const dustEl = document.getElementById('lobby-dust-val');
    if (coinEl) coinEl.innerText = window.gachaData.coins;
    if (dustEl) dustEl.innerText = window.gachaData.dust;

    const buffPanel = document.getElementById('buff-panel');
    if (buffPanel) {
        buffPanel.innerHTML = `✨ 加成：血量 +${window.hpBuffAmt || 0}💖 | 爆擊率 ${window.critRate || 5}%💥 | 提示 +${window.hintBuffAmt || 0}🪄 | 額外代幣 +${window.extraCoinsBonus || 0}🪙`;
    }
}

// ========== 彈窗管理與音樂切換 ==========
window.closeLobbyModal = function() {
    const modal = document.getElementById('lobby-modal');
    if (modal) modal.style.display = 'none';
    
    // 停止特殊彈窗的音樂
    if (window.gachaBgm) window.gachaBgm.pause();
    if (window.shopBgm) window.shopBgm.pause();
    if (window.villageBgm) window.villageBgm.pause(); 
    
    // 停止村莊遊走引擎動畫
    if (window.villageAnimFrame) {
        cancelAnimationFrame(window.villageAnimFrame);
        window.villageAnimFrame = null;
    }
    
    // ★ 恢復大廳音樂
    if (window.lobbyBgm && window.lobbyBgm.paused) {
        window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
        window.lobbyBgm.play().catch(e => {});
    }
};

function openModal(contentId) {
    const modal = document.getElementById('lobby-modal');
    const content = document.getElementById('lobby-modal-content');
    const modalContentBox = content.parentElement;
    
    if (!modal || !content) return;
    
    // 先把其他音樂暫停，避免打架
    if (window.gachaBgm) window.gachaBgm.pause();
    if (window.shopBgm) window.shopBgm.pause();
    if (window.villageBgm) window.villageBgm.pause(); 
    if (window.villageAnimFrame) {
        cancelAnimationFrame(window.villageAnimFrame);
        window.villageAnimFrame = null;
    }
    
    modalContentBox.style.background = "rgba(255, 255, 255, 0.95)";
    
    if (contentId === 'gacha') {
        modalContentBox.style.background = "url('assets/bg_gacha.png') center/cover no-repeat";
        content.innerHTML = buildGachaContent();
        
        if (window.lobbyBgm) window.lobbyBgm.pause();
        if (window.gachaBgm) {
            window.gachaBgm.currentTime = 0;
            window.gachaBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.gachaBgm.play().catch(e => {});
        }
    } else if (contentId === 'shop') {
        modalContentBox.style.background = "url('assets/bg_shop.png') center/cover no-repeat";
        content.innerHTML = buildShopContent();
        
        if (window.lobbyBgm) window.lobbyBgm.pause();
        if (window.shopBgm) {
            window.shopBgm.currentTime = 0;
            window.shopBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.shopBgm.play().catch(e => {});
        }
    } else if (contentId === 'wall') {
        // ★ 村莊專屬音樂邏輯
        if (window.lobbyBgm) window.lobbyBgm.pause();
        if (window.villageBgm) {
            window.villageBgm.currentTime = 0;
            window.villageBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.villageBgm.play().catch(e => {});
        }
        content.innerHTML = buildWallContent();
    } else {
        // ★ 其他彈窗：維持播放大廳音樂！
        if (window.lobbyBgm && window.lobbyBgm.paused) {
            window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.lobbyBgm.play().catch(e => {});
        }
        
        if (contentId === 'collection') content.innerHTML = buildCollectionContent();
        else if (contentId === 'lessons') {
            if (typeof verifyParent === 'function' && !verifyParent()) return;
            content.innerHTML = buildLessonsContent();
        } 
        else if (contentId === 'report') content.innerHTML = buildReportContent();
        else if (contentId === 'rules') content.innerHTML = buildRulesContent();
    }

    modal.style.display = 'flex';
}

document.addEventListener('click', function(e) {
    const modal = document.getElementById('lobby-modal');
    if (modal && modal.style.display === 'flex') {
        if (e.target === modal) {
            window.closeLobbyModal(); 
        }
    }
});

// ========== 彈窗內容產生器 ==========
function buildGachaContent() {
    updateLobbyUI();
    return `
        <div style="text-align:center;">
            <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.7); padding:10px 20px; border-radius:30px; margin-bottom:20px;">
                <span style="color:#f39c12; font-size:24px;">🪙 ${window.gachaData.coins}</span>
                <span style="color:#8e44ad; font-size:24px;">✨ ${window.gachaData.dust}</span>
            </div>
            <div style="position:relative; width:100%; display:flex; justify-content:center; margin:20px 0;">
                <img src="assets/Gacha.png" style="width:250px; filter:drop-shadow(0 15px 25px rgba(0,0,0,0.5)); animation:breatheAnim 3s infinite;" onerror="this.src='${FALLBACK_IMAGE}'">
            </div>
            <div style="font-size:20px; font-weight:bold; color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-bottom:20px; background:rgba(0,0,0,0.4); display:inline-block; padding:5px 15px; border-radius:20px;">每次抽取消耗 10 枚代幣</div>
            <div style="display:flex; gap:20px; justify-content:center; margin-top:20px;">
                <button class="gacha-pull-btn" style="padding:15px 30px; font-size:20px;" onclick="pullGachaModal(1)">抽 1 次</button>
                <button class="gacha-pull-btn" style="padding:15px 30px; font-size:20px;" onclick="pullGachaModal(5)">抽 5 次</button>
            </div>
        </div>
    `;
}

function buildShopContent() {
    updateLobbyUI();
    let html = `<div style="text-align:center; margin-bottom:15px;"><span style="background:rgba(0,0,0,0.7); padding:8px 20px; border-radius:30px; font-size:22px; color:white;">✨ 星塵：${window.gachaData.dust}</span></div>`;
    html += '<div class="sticker-grid" style="height:calc(90vh - 280px); overflow-y:auto; padding:10px;">';
    let shopPriceMap = { 'N': 3, 'R': 9, 'SR': 15, 'SSR': 30 };
    let hasItem = false;

    stickerDB.forEach(s => {
        if (!enabledStickers.includes(s.id)) return;
        if (!window.gachaData.collection.includes(s.id)) return;
        hasItem = true;
        let stars = window.gachaData.stars[s.id] || 0;
        let price = shopPriceMap[s.rarity];
        let isMaxed = stars >= 5;
        let assets = getStickerAssets(s);
        html += `
            <div class="sticker-card rarity-${s.rarity}" style="cursor:pointer;" onclick="buyShopItemModal(${s.id}, ${price})">
                <div class="sticker-id">${getStickerDisplayId(s)}</div>
                <img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">
                ${stars > 0 ? `<div class="card-stars">${'⭐'.repeat(stars)}</div>` : ''}
                <div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>
                ${!isMaxed ? `<div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); background:white; padding:2px 8px; border-radius:10px; font-size:13px; color:black;">✨ ${price}</div>` : '<div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:white; padding:2px 8px; border-radius:10px; font-size:11px;">已滿星</div>'}
            </div>
        `;
    });
    if (!hasItem) html += '<div style="text-align:center; padding:40px; color:white; font-size:20px; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">寶盒空空的！先去轉蛋機解鎖貼紙吧！</div>';
    else html += '</div>';
    
    html += `
        <div style="text-align:center; margin-top:20px;">
            <img id="shop-magic-box" src="assets/shop_box.png" onerror="this.src='${FALLBACK_IMAGE}';" style="width:120px; filter:drop-shadow(0 10px 15px rgba(0,0,0,0.5)); animation:breatheAnim 2.5s infinite; cursor:pointer;" onclick="alert('點擊商店中的貼紙即可升級！✨')">
            <div style="font-size:16px; color:white; text-shadow: 0 2px 4px rgba(0,0,0,0.8); margin-top:5px; font-weight:bold;">✨ 點擊貼紙使用星塵升級 ✨</div>
        </div>
    `;
    return html;
}

function buildCollectionContent() {
    updateLobbyUI();
    let owned = window.gachaData.collection.filter(id => enabledStickers.includes(id)).length;
    let html = `<div style="text-align:center; margin-bottom:15px; font-weight:bold; font-size:22px;">收集進度：${owned} / ${enabledStickers.length}</div>`;
    html += '<div class="sticker-grid" style="height:calc(90vh - 150px); overflow-y:auto; padding:10px;">';
    stickerDB.forEach(s => {
        if (!enabledStickers.includes(s.id)) return;
        let isOwned = window.gachaData.collection.includes(s.id);
        let stars = window.gachaData.stars[s.id] || 0;
        let assets = getStickerAssets(s);
        html += `
            <div class="sticker-card rarity-${s.rarity} ${!isOwned ? 'sticker-locked' : ''}" onclick="${isOwned ? `showStickerDetail(${s.id})` : ''}">
                <div class="sticker-id">${getStickerDisplayId(s)}</div>
                ${isOwned ? `<img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">${stars > 0 ? `<div class="card-stars">${'⭐'.repeat(stars)}</div>` : ''}` : '<div style="font-size:30px; color:#ccc;">?</div>'}
                <div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// ========== 🌟 終極進化：魔法村莊與互動系統 (日夜/天氣/拖曳/寵物版) ==========
window.villageAnimFrame = null; 

function buildWallContent() {
    let html = `
        <div style="font-size:24px; font-weight:bold; text-align:center; margin-bottom:10px; color:#8e44ad;">🏡 魔法貼紙村莊</div>
        <div id="village-container" style="position:relative; width:100%; height:45vh; background: url('assets/village.png') center/cover, linear-gradient(to bottom, #a1c4fd 0%, #c2e9fb 100%); border-radius:20px; border:4px solid #fff; overflow:hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.2); margin-bottom:15px; user-select:none;">
            <!-- 村民、天氣與寶藏會被放進這裡 -->
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

// ========== 輔助：天氣與特效粒子生成器 (5種天氣終極版) ==========
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
        // 颳大風：飛舞的落葉
        p.innerText = Math.random() > 0.5 ? '🍃' : '🍂'; 
        p.style.fontSize = (12 + Math.random() * 10) + 'px';
        p.style.left = '-30px'; 
        p.style.top = (Math.random() * h * 0.8) + 'px';
        p.style.opacity = Math.random() * 0.8 + 0.2;
        p.style.filter = 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))';
        container.appendChild(p);
        let duration = 0.8 + Math.random() * 1.2; // 飛很快
        p.style.transition = `transform ${duration}s linear`;
        setTimeout(() => p.style.transform = `translateX(${w + 50}px) translateY(${Math.random()*60 - 30}px) rotate(${Math.random()*720}deg)`, 10);
        setTimeout(() => p.remove(), duration * 1000);
    } else if (type === 'sun') {
        // 太陽：閃爍的光斑
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

// ========== 🌟 村莊主引擎 (專屬夜景圖 ＋ 取消黑夜濾鏡版) ==========
function startVillageEngine() {
    const container = document.getElementById('village-container');
    if (!container) return; 
    if (window.villageAnimFrame) cancelAnimationFrame(window.villageAnimFrame);

    let villagers = [];
    let contWidth = container.clientWidth || 400;
    let contHeight = container.clientHeight || 300;

    // 🌟 1. 偵測日夜
    let hour = new Date().getHours();
    let isNight = (hour >= 18 || hour <= 5);

    // 🌟 2. 隨機決定天氣 (如果是晚上，就不會出太陽)
    const dayWeathers = ['sun', 'rain', 'snow', 'fog', 'wind'];
    const nightWeathers = ['clear', 'rain', 'snow', 'fog', 'wind']; // 晚上用 clear 取代 sun
    let weathers = isNight ? nightWeathers : dayWeathers;
    let weather = weathers[Math.floor(Math.random() * weathers.length)];
    
    // 🌟 3. 根據日夜與天氣，自動替換背景圖！
    const weatherBgs = {
        'sun': "url('assets/village_sun.png')",
        'rain': "url('assets/village_rain.png')",
        'snow': "url('assets/village_snow.png')",
        'fog': "url('assets/village_fog.png')",
        'wind': "url('assets/village_wind.png')"
    };
    
    // 🌃 關鍵：如果是晚上，強制使用 village_night.png！
    let bgImage = isNight ? "url('assets/village_night.png')" : weatherBgs[weather];
    
    // 套用背景，並且拿掉原本那層醜醜的 nightOverlay 了！
    container.style.background = `${bgImage} center/cover no-repeat, linear-gradient(to bottom, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)`;
    
    // 建立天氣濾鏡層 (白天為了融合特效加一點點透明色，晚上則盡量保持你圖片的原色)
    let weatherOverlay = document.createElement('div');
    weatherOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:800;transition:all 1s;';
    
    if (weather === 'rain') weatherOverlay.style.background = isNight ? 'rgba(0, 0, 50, 0.1)' : 'rgba(20, 30, 50, 0.3)'; 
    else if (weather === 'snow') weatherOverlay.style.background = isNight ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.2)'; 
    else if (weather === 'fog') {
        weatherOverlay.style.background = isNight ? 'rgba(200, 200, 200, 0.15)' : 'rgba(255, 255, 255, 0.4)';
        weatherOverlay.style.backdropFilter = 'blur(3px)'; 
    }
    else if (weather === 'wind') weatherOverlay.style.background = isNight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(200, 180, 150, 0.15)'; 
    else if (weather === 'sun') weatherOverlay.style.background = 'rgba(255, 255, 200, 0.1)'; 
    
    container.appendChild(weatherOverlay);

    // 顯示當前天氣提示
    let weatherLabel = document.createElement('div');
    let labelText = "";
    if (isNight) {
        let nightIcons = { 'clear':'🌃 寧靜夜晚', 'rain':'🌧️ 夜間陣雨', 'snow':'❄️ 浪漫夜雪', 'fog':'🌫️ 迷蹤夜霧', 'wind':'🌪️ 夜晚狂風' };
        labelText = nightIcons[weather];
    } else {
        let dayIcons = { 'sun':'🌞 晴空萬里', 'rain':'🌧️ 魔法陣雨', 'snow':'❄️ 浪漫雪天', 'fog':'🌫️ 迷蹤大霧', 'wind':'🌪️ 狂風大作' };
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
                let img = document.createElement('img');
                img.src = assets.img;
                img.style.cssText = 'width:100%; filter:drop-shadow(0 5px 5px rgba(0,0,0,0.4)); pointer-events:none; transition:transform 0.1s;';
                
                let bubble = document.createElement('div');
                bubble.style.cssText = 'position:absolute; top:-35px; left:50%; transform:translateX(-50%); background:white; border:2px solid #ffb6c1; border-radius:12px; padding:4px 10px; font-size:14px; font-weight:bold; color:#e74c3c; opacity:0; transition:opacity 0.3s; pointer-events:none; white-space:nowrap; box-shadow:0 2px 5px rgba(0,0,0,0.2); z-index:999;';
                
                wrapper.appendChild(img); wrapper.appendChild(bubble);

                let startX = Math.random() * (contWidth - 70);
                let startY = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 70); 
                wrapper.style.left = startX + 'px'; wrapper.style.top = startY + 'px';
                container.appendChild(wrapper);

                // 寵物系統
                let petObj = null;
                if (s.id < 10 && stars >= 5 && typeof heroes !== 'undefined' && heroes[s.id] && heroes[s.id].petImg) {
                    let petImg = document.createElement('img');
                    petImg.src = heroes[s.id].petImg;
                    petImg.style.cssText = 'position:absolute; width:35px; filter:drop-shadow(0 3px 3px rgba(0,0,0,0.4)); pointer-events:none; transition:transform 0.1s;';
                    container.appendChild(petImg);
                    petObj = { el: petImg, x: startX - 40, y: startY + 20, direction: 1 };
                }

                // 天氣影響村民速度
                let baseSpeed = 0.3 + Math.random() * 0.4;
                if (weather === 'rain') baseSpeed *= 1.5; 
                else if (weather === 'snow') baseSpeed *= 0.6; 
                else if (weather === 'wind') baseSpeed *= 1.8; 

                let v = {
                    el: wrapper, imgEl: img, bubble: bubble, rarity: s.rarity, pet: petObj,
                    x: startX, y: startY, targetX: startX, targetY: startY,     
                    speed: baseSpeed, 
                    state: 'idle', timer: Math.random() * 100, direction: 1, fallVelocity: 0, targetFloorY: 0,
                    showBubble: function(text, duration, color = '#e74c3c') {
                        this.bubble.innerText = text; this.bubble.style.color = color; this.bubble.style.opacity = '1';
                        clearTimeout(this.bubbleTimer);
                        this.bubbleTimer = setTimeout(() => { this.bubble.style.opacity = '0'; }, duration);
                    }
                };
                villagers.push(v);

                // 拖曳與點擊系統
                let isDragging = false, startMouseX, startMouseY;
                
                const triggerClick = () => {
                    v.imgEl.style.transform = `translateY(-25px) scaleX(${v.direction}) scaleY(1.1)`;
                    setTimeout(() => { v.imgEl.style.transform = `translateY(0) scaleX(${v.direction}) scaleY(1)`; }, 300);
                    let currentLessons = (typeof activeLessons !== 'undefined' && activeLessons.length > 0) ? activeLessons : JSON.parse(localStorage.getItem('activeLessons') || '[]');
                    if (typeof lessonData !== 'undefined' && currentLessons.length > 0) {
                        let lesson = currentLessons[Math.floor(Math.random() * currentLessons.length)];
                        if (lessonData[lesson] && lessonData[lesson].length > 0) {
                            let word = lessonData[lesson][Math.floor(Math.random() * lessonData[lesson].length)];
                            v.showBubble(word, 2000, '#3498db');
                            if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel(); 
                                let utterance = new SpeechSynthesisUtterance(word); utterance.lang = 'en-US'; window.speechSynthesis.speak(utterance);
                            }
                        }
                    } else v.showBubble("Hello!", 1500, '#e74c3c');
                };

                const startDrag = (cx, cy) => {
                    isDragging = true; startMouseX = cx; startMouseY = cy;
                    let rect = container.getBoundingClientRect();
                    v.dragOffsetX = cx - rect.left - v.x; v.dragOffsetY = cy - rect.top - v.y;
                    v.state = 'drag'; v.el.style.zIndex = 9999; wrapper.style.cursor = 'grabbing';
                    v.imgEl.style.transition = 'none'; 
                    v.imgEl.style.transform = `scaleX(${v.direction}) scaleY(1.1) rotate(10deg)`;
                };

                const doDrag = (cx, cy) => {
                    if (!isDragging) return;
                    let rect = container.getBoundingClientRect();
                    v.x = cx - rect.left - v.dragOffsetX; v.y = cy - rect.top - v.dragOffsetY;
                };

                const endDrag = (cx, cy) => {
                    if (!isDragging) return;
                    isDragging = false; wrapper.style.cursor = 'grab'; v.imgEl.style.transition = 'transform 0.1s';
                    if (Math.hypot(cx - startMouseX, cy - startMouseY) < 10) { v.state = 'idle'; triggerClick(); } 
                    else {
                        v.state = 'fall'; v.fallVelocity = 0; 
                        v.targetFloorY = Math.max(contHeight * 0.6, v.y + 50); 
                        if(v.targetFloorY > contHeight - 70) v.targetFloorY = contHeight - 70;
                    }
                };

                wrapper.onmousedown = (e) => {
                    if (e.button !== 0) return; 
                    startDrag(e.clientX, e.clientY);
                    const onMove = (me) => doDrag(me.clientX, me.clientY);
                    const onUp = (ue) => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); endDrag(ue.clientX, ue.clientY); };
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                };
                
                wrapper.ontouchstart = (e) => {
                    startDrag(e.touches[0].clientX, e.touches[0].clientY);
                    const onMove = (me) => { me.preventDefault(); doDrag(me.touches[0].clientX, me.touches[0].clientY); };
                    const onUp = (ue) => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onUp); endDrag(ue.changedTouches[0].clientX, ue.changedTouches[0].clientY); };
                    document.addEventListener('touchmove', onMove, {passive: false}); document.addEventListener('touchend', onUp);
                };
            }
        }
    });

    // 🌟 5. 遊戲主迴圈
    function update() {
        if (!document.getElementById('village-container')) return; 

        // 依據天氣產生特效粒子
        if (weather === 'rain' && Math.random() < 0.35) spawnWeatherParticle('rain', container, contWidth, contHeight);
        else if (weather === 'snow' && Math.random() < 0.15) spawnWeatherParticle('snow', container, contWidth, contHeight);
        else if (weather === 'wind' && Math.random() < 0.2) spawnWeatherParticle('wind', container, contWidth, contHeight);
        else if (weather === 'sun' && Math.random() < 0.02) spawnWeatherParticle('sun', container, contWidth, contHeight);
        
        // 晚上的專屬螢火蟲特效 (機率稍微調高一點，因為沒有陽光)
        if (isNight && Math.random() < 0.08) spawnWeatherParticle('firefly', container, contWidth, contHeight);

        // 寶藏系統
        let today = new Date().toDateString();
        if (window.gachaData.treasureDate !== today) { window.gachaData.treasureDate = today; window.gachaData.treasureCount = 0; }
        if (window.gachaData.treasureCount < 3 && Math.random() < 0.0003 && !document.getElementById('village-treasure')) {
            let t = document.createElement('div'); t.id = 'village-treasure';
            let isDustBox = Math.random() > 0.5; t.innerHTML = isDustBox ? '🎁' : '🍄';
            t.style.cssText = 'position:absolute; font-size:35px; cursor:pointer; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.4)); animation:breatheAnim 1.5s infinite;';
            let tx = Math.random() * (contWidth - 40); let ty = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 40);
            t.style.left = tx + 'px'; t.style.top = ty + 'px'; t.style.zIndex = Math.floor(ty);
            t.onclick = function() {
                let amt = isDustBox ? (Math.floor(Math.random() * 5) + 1) : 1; 
                if (isDustBox) window.gachaData.dust += amt; else window.gachaData.coins += amt;
                window.gachaData.treasureCount++;
                localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData)); updateLobbyUI();
                let ft = document.createElement('div'); ft.innerHTML = isDustBox ? `+${amt}✨` : `+${amt}🪙`;
                ft.style.cssText = `position:absolute; left:${tx}px; top:${ty}px; color:${isDustBox?'#8e44ad':'#f39c12'}; font-weight:bold; font-size:24px; z-index:9999; text-shadow:1px 1px 2px white,-1px -1px 2px white; transition:all 1s ease-out;`;
                container.appendChild(ft);
                setTimeout(() => { ft.style.top = (ty - 50) + 'px'; ft.style.opacity = '0'; }, 50); setTimeout(() => ft.remove(), 1000);
                t.remove();
            };
            container.appendChild(t);
        }

        villagers.forEach(v => {
            // 迷霧迷路系統
            if (weather === 'fog' && v.state === 'walk' && Math.random() < 0.005) {
                v.state = 'idle';
                v.timer = 80;
                v.showBubble('❓', 1500, '#7f8c8d');
            }

            if (v.state === 'idle' || v.state === 'chat') {
                v.timer--;
                if (v.timer <= 0) {
                    v.state = 'walk';
                    v.targetX = Math.random() * (contWidth - 70);
                    v.targetY = (contHeight * 0.6) + Math.random() * (contHeight * 0.4 - 70);
                    v.direction = v.targetX > v.x ? 1 : -1; 
                }
            } else if (v.state === 'walk') {
                let dx = v.targetX - v.x, dy = v.targetY - v.y, dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 2) { v.state = 'idle'; v.timer = 60 + Math.random() * 120; } 
                else {
                    v.x += (dx / dist) * v.speed; v.y += (dy / dist) * v.speed;
                    if (v.rarity === 'SSR' && Math.random() < 0.1 && typeof spawnParticle === 'function') spawnParticle(v.x, v.y+60, '⭐', '#f1c40f', container);
                    else if (v.rarity === 'SR' && Math.random() < 0.05 && typeof spawnParticle === 'function') spawnParticle(v.x, v.y+60, '✨', '#9b59b6', container);
                }
            } else if (v.state === 'fall') {
                v.fallVelocity += 1.5; v.y += v.fallVelocity;
                if (v.y >= v.targetFloorY) {
                    v.y = v.targetFloorY;
                    if (v.fallVelocity > 5) v.fallVelocity = -v.fallVelocity * 0.4; 
                    else { v.state = 'idle'; v.showBubble('😵', 1500, '#e74c3c'); } 
                }
            }

            v.el.style.left = v.x + 'px'; v.el.style.top = v.y + 'px';
            if (v.state !== 'drag') v.el.style.zIndex = Math.floor(v.y);
            
            if (v.state !== 'drag') {
                // 大風彈跳系統
                let bounceBase = (weather === 'wind') ? 10 : 6;
                let bounce = v.state === 'walk' ? Math.abs(Math.sin(Date.now() / 80)) * bounceBase : 0;
                let breathe = (v.state === 'idle' || v.state === 'chat') ? 1 + Math.sin(Date.now() / 200) * 0.03 : 1;
                let tilt = (weather === 'wind' && v.state === 'walk') ? 'rotate(5deg)' : '';
                v.imgEl.style.transform = `scaleX(${v.direction}) scaleY(${breathe}) translateY(-${bounce}px) ${tilt}`;
            }

            if (v.pet) {
                let pdx = v.x - v.pet.x - (v.direction * 35); 
                let pdy = v.y + 20 - v.pet.y;
                v.pet.x += pdx * 0.08; v.pet.y += pdy * 0.08;
                v.pet.direction = pdx > 0 ? 1 : -1;
                
                let pBounce = v.state === 'walk' ? Math.abs(Math.sin(Date.now() / 60)) * 4 : Math.sin(Date.now()/150)*3;
                v.pet.el.style.left = v.pet.x + 'px'; v.pet.el.style.top = (v.pet.y - pBounce) + 'px';
                v.pet.el.style.transform = `scaleX(${v.pet.direction})`;
                v.pet.el.style.zIndex = Math.floor(v.pet.y);
            }
        });

        window.villageAnimFrame = requestAnimationFrame(update);
    }
    
    update(); 
}


// ========== 其餘大廳彈窗內容 ==========
function buildLessonsContent() {
    let html = '<div style="font-size:24px; font-weight:bold; text-align:center; margin-bottom:20px;">📖 選擇單字庫</div>';
    html += '<div style="display:flex; flex-direction:column; gap:12px; height:calc(90vh - 150px); overflow-y:auto; padding:10px;">';
    Object.keys(lessonData).forEach(lesson => {
        let isChecked = activeLessons.includes(lesson) ? "checked" : "";
        html += `
            <div style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.9); padding:15px 25px; border-radius:15px; border:3px solid #ffb6c1;">
                <input type="checkbox" value="${lesson}" ${isChecked} onchange="updateLessonsModal(this)" style="width:30px; height:30px; cursor:pointer;">
                <div onclick="showLessonWordsModal('${lesson}')" style="cursor:pointer; flex-grow:1;">
                    <span style="font-weight:bold; font-size:22px;">${lesson.toUpperCase()}</span>
                    <span style="color:#666; font-size:16px;">(${lessonData[lesson].length} 字)</span>
                </div>
                <span style="font-size:28px;">🔍</span>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function buildReportContent() {
    let log = window.studyLog || {};
    let arr = Object.keys(log).map(w => {
        let total = log[w].success + log[w].fail;
        let pct = total > 0 ? Math.round((log[w].fail / total) * 100) : 0;
        return { word: w, s: log[w].success, f: log[w].fail, p: pct };
    });
    arr.sort((a, b) => b.f - a.f);
    if (arr.length === 0) return '<div style="text-align:center; padding:40px; font-size:20px;">暫無戰鬥紀錄</div>';
    
    let html = '<div style="height:calc(90vh - 100px); overflow-y:auto; padding:10px;"><table style="width:100%; text-align:center; border-collapse:collapse; font-size:18px;">';
    html += '<tr style="background:#ffb6c1;"><th>單字</th><th>✅</th><th>❌</th><th>錯誤率</th></tr>';
    arr.slice(0, 30).forEach(item => {
        let errColor = item.p >= 50 ? '#e74c3c' : '#555';
        html += `<tr style="border-bottom:1px solid #ffe6f0;"><td style="padding:12px; font-weight:bold;">${item.word}</td><td style="color:#2ecc71;">${item.s}</td><td style="color:${errColor};">${item.f}</td><td style="color:${errColor}; font-weight:bold;">${item.p}%</td></tr>`;
    });
    html += '</table></div>';
    return html;
}

function buildRulesContent() {
    return `
        <h2 style="text-align:center; font-size:26px;">📜 遊戲規則與寶箱</h2>
        <div style="text-align:center; color:#e74c3c; font-size:18px; margin-bottom:15px;">基礎爆擊率：5% (爆擊傷害 2 倍)</div>
        <ul style="line-height:1.8; background:#f9f9f9; padding:15px 25px; border-radius:15px; font-size:16px; text-align:left;">
            <li><b>⚔️ 關卡挑戰：</b><br>第一關(魔法集氣) ➡️ 第二關(看圖拼字) ➡️ 第三關(聽音盲拼)。<br>打贏第二關即保底獲得 1 倍寶箱。若挑戰第三關成功，<span style="color:#e74c3c; font-weight:bold;">寶箱金幣翻倍！</span>若第三關失敗，仍可帶回 1 倍寶箱。</li>
            <hr style="border:0; border-top:2px dashed #bdc3c7; margin:10px 0;">
            <li><b>🎁 寶箱金幣：</b> 彩色(50) / 紫色(25) / 金色(15) / 一般(10)</li>
            <hr style="border:0; border-top:2px dashed #bdc3c7; margin:10px 0;">
            <li>🌈 <b>彩色(SSR)貼紙：</b>每張 +1 血量💖，滿星解鎖專屬招式四</li>
            <li>🟪 <b>紫色(SR)貼紙：</b>每張 +1% 爆擊率💥，滿星再 +1%</li>
            <li>🟨 <b>金色(R)貼紙：</b>每 10 張 +1 提示🪄，滿星解鎖專屬影片</li>
            <li>⬜ <b>普通(N)貼紙：</b>每 10 張 +1 通關代幣🪙</li>
        </ul>
    `;
}

// ========== 彈窗內的操作函數 ==========
function pullGachaModal(times) {
    if (window.gachaData.coins < times * 10) {
        alert("代幣不足！");
        return;
    }
    window.gachaData.coins -= times * 10;
    let results = [], totalDust = 0, gotStar = false;
    let dustMap = { 'N': 1, 'R': 3, 'SR': 5, 'SSR': 10 };
    
    let highestRarityValue = 0; 
    let highestRarity = 'N';
    const rarityValueMap = { 'N': 1, 'R': 2, 'SR': 3, 'SSR': 4 };

    for (let i = 0; i < times; i++) {
        let roll = Math.random();
        let rarity = roll < 0.05 ? 'SSR' : (roll < 0.15 ? 'SR' : (roll < 0.40 ? 'R' : 'N'));
        
        if (rarityValueMap[rarity] > highestRarityValue) {
            highestRarityValue = rarityValueMap[rarity];
            highestRarity = rarity;
        }

        let pool = stickerDB.filter(s => s.rarity === rarity && enabledStickers.includes(s.id));
        if (pool.length === 0) pool = stickerDB.filter(s => enabledStickers.includes(s.id));
        let picked = pool[Math.floor(Math.random() * pool.length)];

        if (window.gachaData.collection.includes(picked.id)) {
            if ((window.gachaData.stars[picked.id] || 0) < 5) {
                window.gachaData.stars[picked.id]++;
                if (i === times - 1) gotStar = true;
            } else {
                totalDust += dustMap[picked.rarity];
            }
        } else {
            window.gachaData.collection.push(picked.id);
            window.gachaData.stars[picked.id] = 0;
        }
        results.push(picked);
    }
    
    window.gachaData.dust += totalDust;
    localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
    updateLobbyUI();

    let resultHtml = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:15px; margin-bottom:20px;">';
    results.forEach(res => {
        let assets = getStickerAssets(res);
        let glowClass = res.rarity === 'SSR' ? 'ssr-glow' : (res.rarity === 'SR' ? 'sr-glow' : (res.rarity === 'R' ? 'r-glow' : ''));
        resultHtml += `<div class="sticker-card rarity-${res.rarity}" style="width:100px; height:100px; cursor:pointer;" onclick="showStickerDetail(${res.id})">
            <div class="sticker-id">${getStickerDisplayId(res)}</div>
            <img src="${assets.img}" class="${glowClass}" style="width:70%;">
            <div class="rarity-badge badge-${res.rarity}">${res.rarity}</div>
        </div>`;
    });
    resultHtml += '</div>';
    let msg = `抽到 ${times} 張貼紙！${gotStar ? '⭐ 星級提升！' : ''}${totalDust > 0 ? `✨ 獲得 ${totalDust} 星塵` : ''}`;

    let preGlowCss = '';
    let openAudioUrl = 'assets/music/gacha_open.mp3';

    if (highestRarity === 'SSR') {
        preGlowCss = 'animation: rainbowGlow 0.5s infinite, severeShake 0.5s infinite; transform: scale(1.1);';
        openAudioUrl = 'assets/music/gacha_epic.mp3'; 
    } else if (highestRarity === 'SR') {
        preGlowCss = 'box-shadow: 0 0 50px #9b59b6, 0 0 100px #8e44ad; animation: severeShake 0.5s infinite;';
    } else if (highestRarity === 'R') {
        preGlowCss = 'box-shadow: 0 0 30px #f1c40f;';
    }

    document.getElementById('lobby-modal-content').innerHTML = `
        <style>
            .flip-container { perspective: 1000px; width: 200px; height: 280px; margin: 40px auto; }
            .flipper { transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform-style: preserve-3d; position: relative; width: 100%; height: 100%; }
            .flip-container.flipped .flipper { transform: rotateY(180deg); }
            .front, .back { backface-visibility: hidden; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 20px; }
            .front { background: linear-gradient(135deg, #ffb6c1 0%, #f06292 100%); border: 8px solid white; box-shadow: 0 10px 20px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 80px; color: white; text-shadow: 0 0 20px rgba(255,255,255,0.8); animation: breatheAnim 1.5s infinite alternate; transition: all 0.3s; }
            .front::before { content: ''; position: absolute; width: 80%; height: 80%; border: 2px dashed rgba(255,255,255,0.5); border-radius: 10px; }
            .back { transform: rotateY(180deg); background: white; box-shadow: 0 0 50px white; }
            @keyframes flashBang { 0% { opacity: 0; transform: scale(0.5); } 50% { opacity: 1; transform: scale(3); background: white; } 100% { opacity: 0; transform: scale(4); } }
            .flash-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: white; z-index: 100; pointer-events: none; opacity: 0; }
        </style>

        <div style="text-align:center; position: relative; height: 100%; display: flex; flex-direction: column; justify-content: center;">
            <div id="gacha-animation-layer">
                <div style="font-size: 24px; color: #ffd700; font-weight: bold; margin-bottom: 20px; text-shadow: 2px 2px 4px black;">魔法陣啟動中...</div>
                <div class="flip-container" id="gacha-flip-box">
                    <div class="flipper">
                        <div class="front" id="gacha-card-back" style="background: url('assets/card_back.png') center/contain no-repeat; border: none; box-shadow: none;"></div>
                        <div class="back"></div>
                    </div>
                </div>
            </div>
            <div id="flash-screen" class="flash-overlay"></div>
            <div id="gacha-result-layer" style="display:none; background:rgba(0,0,0,0.6); padding:20px; border-radius:20px; margin-top: -20px;">
                ${resultHtml}
                <div style="font-size:22px; color:white; font-weight:bold;">${msg}</div>
                <button class="big-btn" style="margin-top:20px; font-size:20px; padding:15px 40px;" onclick="refreshGachaModal()">確認</button>
            </div>
        </div>
    `;

    let chargeAudio = new Audio('assets/music/gacha_charge.mp3');
    chargeAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
    chargeAudio.play().catch(e => {});

    setTimeout(() => {
        let cardBack = document.getElementById('gacha-card-back');
        if (cardBack) cardBack.style.cssText += preGlowCss;

        setTimeout(() => {
            let flipBox = document.getElementById('gacha-flip-box');
            let flash = document.getElementById('flash-screen');
            if (flipBox) flipBox.classList.add('flipped');
            if (flash) flash.style.animation = 'flashBang 1s ease-out forwards';
            
            let openAudio = new Audio(openAudioUrl);
            openAudio.volume = window.audioSettings ? window.audioSettings.sfx : 1.0;
            openAudio.play().catch(e => {});

            setTimeout(() => {
                let animLayer = document.getElementById('gacha-animation-layer');
                let resLayer = document.getElementById('gacha-result-layer');
                if (animLayer) animLayer.style.display = 'none';
                if (resLayer) resLayer.style.display = 'block';
            }, 400); 

        }, 500); 

    }, 1500); 
}

function refreshGachaModal() {
    document.getElementById('lobby-modal-content').innerHTML = buildGachaContent();
}

function buyShopItemModal(stickerId, price) {
    let s = stickerDB.find(x => x.id === stickerId);
    let stars = window.gachaData.stars[s.id] || 0;

    // ★ 修復：最高 5 星防呆檢查
    if (stars >= 5) {
        alert("這張貼紙已經滿星（5星）囉，不需要再升級了！✨");
        return;
    }

    if (window.gachaData.dust < price) {
        alert("星塵不足！");
        return;
    }

    if (confirm(`花費 ${price} 星塵，將【${s.name}】升到 ${stars + 1} 星？`)) {
        window.gachaData.dust -= price;
        window.gachaData.stars[s.id]++;
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
        alert("升級成功！");
        document.getElementById('lobby-modal-content').innerHTML = buildShopContent();
        updateLobbyUI();
        checkUnlocks();
        changeHeroSelection(0);
    }
}

function editWallSlot(index) {
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
        updateLobbyUI();
    }
}

window.showStickerDetail = function(stickerId) {
    let s = stickerDB.find(x => x.id === stickerId);
    if (!s || !window.gachaData.collection.includes(stickerId)) return;
    let stars = window.gachaData.stars[stickerId] || 0;
    let assets = getStickerAssets(s);
    let matchedHero = stickerId < 10 ? heroes[stickerId] : null;
    let modal = document.getElementById('sticker-detail-modal');
    
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('detail-img').src = assets.img;
        
        let bonusText = "";
        if (stars >= 5) {
            if (s.rarity === 'SSR') bonusText = ' (已解鎖專屬寵物與招式！)';
            else if (s.rarity === 'R') bonusText = ' (已解鎖專屬精華影片！)';
            else bonusText = ' (已達到最高星等！)';
        }
        let starText = `\n\n⭐ 星級：${stars}/5${bonusText}`;

        if (matchedHero) {
            let is5Star = stars >= 5;
            let s4Text = is5Star ? `4. 被動：${matchedHero.passiveDesc}` : `4. 🔒 招式四被動 (滿五星解鎖)`;
            document.getElementById('detail-title').innerText = `${matchedHero.name} - ${matchedHero.title}`;
            document.getElementById('detail-desc').innerText = `✨ ${matchedHero.feature}\n\n💖 生命: ${matchedHero.baseHp} | 🪄 提示: ${matchedHero.baseHints}\n\n⚔️ 招式：\n1. ${matchedHero.skills[0]} (攻擊力: ${matchedHero.baseDmg[0]})\n2. ${matchedHero.skills[1]} (攻擊力: ${matchedHero.baseDmg[1]})\n3. ${matchedHero.skills[2]} (攻擊力: ${matchedHero.baseDmg[2]})\n${s4Text}${starText}`;
        } else {
            document.getElementById('detail-title').innerText = s.name;
            let extraDesc = s.rarity === 'R' ? "\n🟨 加成：累積 10 張可增加 1 點提示。" : "";
            document.getElementById('detail-desc').innerText = (s.desc || "一張魔法貼紙！") + extraDesc + starText;
        }

        let playBtn = document.getElementById('play-video-btn');
        let videoContainer = document.getElementById('video-container');
        let detailVideo = document.getElementById('detail-video');
        if (playBtn && videoContainer && detailVideo) {
            detailVideo.pause();
            videoContainer.style.display = 'none';
            if (stars >= 5 && assets.vid) {
                playBtn.style.display = 'inline-block';
                playBtn.onclick = function() {
                    videoContainer.style.display = 'block';
                    detailVideo.querySelector('source').src = assets.vid;
                    detailVideo.load();
                    detailVideo.play();
                };
            } else {
                playBtn.style.display = 'none';
            }
        }
    }
};

function updateLessonsModal(checkbox) {
    if (checkbox.checked) {
        if (!activeLessons.includes(checkbox.value)) activeLessons.push(checkbox.value);
    } else {
        activeLessons = activeLessons.filter(l => l !== checkbox.value);
        if (activeLessons.length === 0) {
            alert("至少需要一個單字庫！");
            checkbox.checked = true;
            activeLessons.push(checkbox.value);
        }
    }
    localStorage.setItem('activeLessons', JSON.stringify(activeLessons));
    
    if (typeof buildCurrentWordList === 'function') buildCurrentWordList();
    
    let gameCont = document.getElementById('game-container');
    if (gameCont && gameCont.classList.contains('game-show')) {
        if (typeof isWait !== 'undefined') isWait = true;
        gameCont.classList.remove('game-show');
        
        let victScreen = document.getElementById('victory-screen');
        if (victScreen) victScreen.style.display = 'none';
        
        let startScreen = document.getElementById('start-screen');
        if(startScreen) {
            startScreen.style.display = 'flex';
            setTimeout(() => startScreen.style.opacity = '1', 10);
        }
        
        let combatBgm = document.getElementById('my-bgm');
        if (combatBgm && combatBgm.pause) combatBgm.pause();
        if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        
        if (typeof window.lobbyBgm !== 'undefined' && window.lobbyBgm.paused) {
            window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.lobbyBgm.play().catch(e => {});
        }
        
        if (typeof toggleSettings === 'function') toggleSettings(false);
        closeWordListModal();
        if (typeof closeLobbyModal === 'function') closeLobbyModal();
        
        setTimeout(() => {
            alert("🔄 單字本已更換！為了避免魔法衝突，已將您安全送回營地，請重新開始冒險喔！");
        }, 100);
    }
}

function showLessonWordsModal(lesson) {
    let words = lessonData[lesson];
    let modal = document.getElementById('word-list-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'word-list-modal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9700';
        document.body.appendChild(modal);
    }
    let wordsHtml = words.map(w => `<span style="display:inline-block; background:white; padding:10px 18px; margin:5px; border-radius:12px; border:2px solid #a29bfe; font-size:18px;">${w}</span>`).join('');
    modal.innerHTML = `
    <div class="modal-content" style="max-width:600px; width:90%; height:80vh; overflow-y:auto; text-align:center;">
        <button class="close-btn" onclick="closeWordListModal()">X</button>
        <h2 style="font-size:26px;">📖 ${lesson.toUpperCase()}</h2>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">${wordsHtml}</div>
        <button class="big-btn" style="margin-top:20px;" onclick="closeWordListModal()">關閉</button>
    </div>`;
    modal.style.display = 'flex';
}

function closeWordListModal() {
    const modal = document.getElementById('word-list-modal');
    if (modal) modal.style.display = 'none';
}

// ========== 大廳主畫面切換 ==========
function openLobby() {
    updateLobbyUI();
    
    if (typeof bgm !== 'undefined' && !bgm.paused) bgm.pause();
    
    let winBgmElem = document.getElementById('win-bgm');
    if (winBgmElem) winBgmElem.pause();
    let failBgmElem = document.getElementById('fail-bgm');
    if (failBgmElem) failBgmElem.pause();
    
    if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
    
    if (typeof isWait !== 'undefined') isWait = true; 
    
    let startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'flex';
    
    if (window.lobbyBgm && window.lobbyBgm.paused) {
        window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
        window.lobbyBgm.play().catch(e => {});
    }
}

function closeLobby() {
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'none';
    
    let gameCont = document.getElementById('game-container');
    let isInBattle = gameCont && gameCont.classList.contains('game-show');
    
    if (isInBattle) {
        if (window.lobbyBgm && !window.lobbyBgm.paused) window.lobbyBgm.pause();
        if (typeof bgm !== 'undefined' && bgm.paused) bgm.play().catch(e => {});
        if (typeof isWait !== 'undefined' && typeof pHP !== 'undefined' && pHP > 0) isWait = false; 
    } else {
        let startScreen = document.getElementById('start-screen');
        if (startScreen) startScreen.style.display = 'flex';
        checkUnlocks();
        changeHeroSelection(0);
    }
}

// ========== 建立大廳畫面 (垂直排列 + 圖片按鈕版) ==========
function createLobbyUI() {
    let oldLobby = document.getElementById('gacha-lobby');
    if (oldLobby) oldLobby.remove();
    let oldModal = document.getElementById('lobby-modal');
    if (oldModal) oldModal.remove();

    if (typeof calcBuffs === 'function') calcBuffs();

    document.body.insertAdjacentHTML('beforeend', `
        <div id="gacha-lobby" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:url('assets/bg_lobby.png') center/cover no-repeat; z-index:6000; flex-direction:column; padding:20px; box-sizing:border-box; overflow-y:auto;">
            
            <!-- 🌟 頂部狀態列 -->
            <div class="lobby-header" style="display:grid; grid-template-columns: 1fr auto 1fr; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:8px 20px; border-radius:40px; margin-bottom:20px; border:2px solid rgba(255,255,255,0.8); box-shadow:0 8px 20px rgba(0,0,0,0.15);">
                <div style="justify-self: start; font-size:22px; font-weight:bold; color:#d81b60; text-shadow:1px 1px 0px #fff; white-space:nowrap;">📔 魔法圖鑑大廳</div>
                <div style="justify-self: center; display:flex; gap:25px; font-size:22px; font-weight:bold;">
                    <span style="color:#e67e22; text-shadow:1px 1px 0px #fff; display:flex; align-items:center; gap:5px;">🪙 <span id="lobby-coin-val">${window.gachaData.coins}</span></span>
                    <span style="color:#8e44ad; text-shadow:1px 1px 0px #fff; display:flex; align-items:center; gap:5px;">✨ <span id="lobby-dust-val">${window.gachaData.dust}</span></span>
                </div>
                <button class="magic-close-btn" onclick="closeLobby()" style="justify-self: end; position:relative; display:flex; justify-content:center; align-items:center; width:40px; height:40px; min-width:40px; min-height:40px; padding:0; margin:0; border-radius:50%; background:linear-gradient(135deg, #ff7675, #d63031); border:3px solid white; cursor:pointer; box-shadow:0 4px 10px rgba(214, 48, 49, 0.4); box-sizing:border-box;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            
            <!-- 🌟 Buff 狀態列 -->
            <div id="buff-panel" style="background:rgba(255,255,255,0.85); backdrop-filter:blur(5px); padding:12px; border-radius:20px; margin-bottom:25px; text-align:center; font-weight:bold; font-size:18px; color:#2c3e50; border:2px dashed rgba(255,182,193,0.8); box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                ✨ 加成：血量 +${window.hpBuffAmt || 0}💖 | 爆擊率 ${window.critRate || 5}%💥 | 提示 +${window.hintBuffAmt || 0}🪄 | 額外代幣 +${window.extraCoinsBonus || 0}🪙
            </div>
            
            <!-- 🌟 按鈕區塊：改為垂直擺設 -->
            <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding: 10px;">
                
                <!-- 1. 圖片化的「貼紙村莊」按鈕 -->
				<div class="rpg-icon-btn" onclick="openModal('wall')">
					<img src="assets/btn_village.png" alt="貼紙村莊" style="width: 250px; height: auto; filter: drop-shadow(0 5px 10px rgba(0,0,0,0.3));">
				</div>

                <!-- 其他按鈕暫時維持水晶風格，但改為垂直排列 -->
                <button class="lobby-btn btn-gacha" onclick="openModal('gacha')">🎁 轉蛋機</button>
                <button class="lobby-btn btn-shop" onclick="openModal('shop')">🏪 商店</button>
                <button class="lobby-btn btn-collection" onclick="openModal('collection')">📚 所有貼紙</button>
                <button class="lobby-btn btn-lessons" onclick="openModal('lessons')">📖 單字本</button>
                <button class="lobby-btn btn-report" onclick="openModal('report')">📊 戰報</button>
                <button class="lobby-btn btn-settings" onclick="openPoolEditor()">⚙️ 開放設定</button>
                <button class="lobby-btn btn-rules" onclick="openModal('rules')">📜 規則</button>
            </div>
        </div>
        
        <div id="lobby-modal" class="modal-overlay" style="display:none; z-index:9500;">
            <div class="modal-content" style="width:95%; max-width:800px; height:90vh; padding:20px; overflow-y:hidden; position:relative; background:rgba(255,255,255,0.95); border-radius:25px; box-shadow:0 10px 40px rgba(0,0,0,0.6); border:4px solid rgba(255,255,255,0.5);">
                <button class="magic-close-btn" onclick="window.closeLobbyModal()" style="position:absolute; right:15px; top:15px; z-index:10000; display:flex; justify-content:center; align-items:center; width:45px; height:45px; padding:0; background:linear-gradient(135deg, #ff7675, #d63031); border:3px solid white; border-radius:50%; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.3);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                <div id="lobby-modal-content" style="height:100%; overflow-y:auto; padding-top:15px;"></div>
            </div>
        </div>
    `);

    // CSS 樣式更新
    const style = document.createElement('style');
    style.textContent = `
        /* 圖片型按鈕樣式 */
        .rpg-icon-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .rpg-icon-btn:hover { transform: scale(1.1) translateY(-5px); }
        .rpg-icon-btn:active { transform: scale(0.95); }
        .rpg-btn-label {
            font-size: 18px;
            font-weight: bold;
            color: #fff;
            text-shadow: 2px 2px 4px #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
            margin-bottom: 5px;
        }

        /* 水晶按鈕垂直寬度統一 */
        .lobby-btn {
            width: 200px; /* 垂直排列時，統一寬度會比較好看 */
            padding: 12px;
            font-size: 18px;
            font-weight: 900;
            border: 2px solid rgba(255, 255, 255, 0.7); 
            border-radius: 30px;
            cursor: pointer;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.4); 
            box-shadow: 0 4px 10px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.4); 
            transition: all 0.2s;
        }
        .btn-settings { background: linear-gradient(135deg, #ff758c, #ff7eb3); }
        .btn-rules { background: linear-gradient(135deg, #f6d365, #fda085); }
        .btn-shop { background: linear-gradient(135deg, #a18cd1, #fbc2eb); }
        .btn-collection { background: linear-gradient(135deg, #ff9a9e, #fecfef); color: #d63031; }
        .btn-lessons { background: linear-gradient(135deg, #43e97b, #38f9d7); color: #1e272e; }
        .btn-report { background: linear-gradient(135deg, #e0c3fc, #8ec5fc); color: #2d3436; }
        .btn-gacha { background: linear-gradient(135deg, #f093fb, #f5576c); animation: pulseGlow 2s infinite alternate; }

        @keyframes pulseGlow { 0% { box-shadow: 0 0 10px rgba(245, 87, 108, 0.4); } 100% { box-shadow: 0 0 20px rgba(245, 87, 108, 0.7); } }
        .magic-close-btn:hover { transform: scale(1.15) rotate(90deg); }
    `;
    document.head.appendChild(style);
	
	
	let startScreen = document.getElementById('start-screen');
    if (startScreen && !document.getElementById('enter-lobby-btn')) {
        let openBtn = document.createElement('button');
        openBtn.id = 'enter-lobby-btn';
        openBtn.innerHTML = "📔 進入大廳";
        openBtn.style.cssText = "background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 40px; border-radius: 50px; font-size: 24px; font-weight: bold; border: 3px solid rgba(255,255,255,0.8); cursor: pointer; margin-top: 20px; box-shadow: 0 8px 20px rgba(0,0,0,0.2), inset 0 3px 6px rgba(255,255,255,0.6); text-shadow: 0 2px 4px rgba(0,0,0,0.4); transition: transform 0.2s;";
        openBtn.onclick = openLobby;
        startScreen.appendChild(openBtn);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function () {
    createLobbyUI();
    checkUnlocks();
    changeHeroSelection(0);
    updateLobbyUI();
});