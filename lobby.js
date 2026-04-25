// lobby.js - 精簡彈窗版大廳 (完美修復畫面重疊、音樂流暢與換單字防當機版)

const rarityFolderMap = { 'SSR': 'ssr', 'SR': 'sr', 'R': 'r', 'N': 'normal' };
const FALLBACK_IMAGE = 'assets/meteor.png';

// ★ 統一使用 system.js 的全域概念，確保不會重複產生物件
window.shopBgm = window.shopBgm || new Audio('assets/music/shop_bgm.mp3');
window.shopBgm.loop = true;
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

        // ★ 大廳寵物位置：移到左側腳下，並拉高底盤避開文字
        let petImg = document.getElementById('pet-preview');
        if (!petImg) {
            petImg = document.createElement('img');
            petImg.id = 'pet-preview';
            petImg.style.position = 'absolute';
            petImg.style.bottom = '50px'; 
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
    if (!verifyParent()) return;
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

// ========== 彈窗管理與音樂切換 (完美修復版) ==========
window.closeLobbyModal = function() {
    const modal = document.getElementById('lobby-modal');
    if (modal) modal.style.display = 'none';
    
    // 停止特殊彈窗的音樂
    if (window.gachaBgm) window.gachaBgm.pause();
    if (window.shopBgm) window.shopBgm.pause();
    
    // ★ 恢復大廳音樂 (如果被暫停的話)
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
    
    modalContentBox.style.background = "rgba(255, 255, 255, 0.95)";
    
    if (contentId === 'gacha') {
        modalContentBox.style.background = "url('assets/bg_gacha.png') center/cover no-repeat";
        content.innerHTML = buildGachaContent();
        
        // ★ 進轉蛋機：暫停大廳音樂，播放轉蛋音樂
        if (window.lobbyBgm) window.lobbyBgm.pause();
        if (window.gachaBgm) {
            window.gachaBgm.currentTime = 0;
            window.gachaBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.gachaBgm.play().catch(e => {});
        }
    } else if (contentId === 'shop') {
        modalContentBox.style.background = "url('assets/bg_shop.png') center/cover no-repeat";
        content.innerHTML = buildShopContent();
        
        // ★ 進商店：暫停大廳音樂，播放商店音樂
        if (window.lobbyBgm) window.lobbyBgm.pause();
        if (window.shopBgm) {
            window.shopBgm.currentTime = 0;
            window.shopBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.shopBgm.play().catch(e => {});
        }
    } else {
        // ★ 其他彈窗 (所有貼紙、展示牆、戰報)：維持播放大廳音樂！
        if (window.lobbyBgm && window.lobbyBgm.paused) {
            window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.lobbyBgm.play().catch(e => {});
        }
        
        if (contentId === 'collection') content.innerHTML = buildCollectionContent();
        else if (contentId === 'wall') content.innerHTML = buildWallContent();
        else if (contentId === 'lessons') {
            if (!verifyParent()) return;
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

function buildWallContent() {
    let html = '<div class="wall-grid" style="flex-wrap:wrap; justify-content:center; gap:20px;">';
    window.gachaData.wall.forEach((slotId, index) => {
        if (slotId !== null && enabledStickers.includes(slotId)) {
            let s = stickerDB[slotId];
            let assets = getStickerAssets(s);
            html += `<div class="wall-slot rarity-${s.rarity}" style="width:120px; height:120px;" onclick="editWallSlot(${index})"><img src="${assets.img}" style="width:80%;" onerror="this.src='${FALLBACK_IMAGE}'"></div>`;
        } else {
            html += `<div class="wall-slot" style="width:120px; height:120px;" onclick="editWallSlot(${index})"><div style="font-size:50px; color:#aaa;">+</div></div>`;
        }
    });
    html += '</div>';
    return html;
}

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
            <li>🟨 <b>金色(R)貼紙：</b>每 5 張 +1 提示🪄，滿星再 +1</li>
            <li>⬜ <b>普通(N)貼紙：</b>每 10 張 +1 通關代幣🪙</li>
        </ul>
    `;
}

// ========== 彈窗內的操作函數 (3D 翻牌動畫 + 全音效版) ==========
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
    if (window.gachaData.dust < price) {
        alert("星塵不足！");
        return;
    }
    let s = stickerDB.find(x => x.id === stickerId);
    let stars = window.gachaData.stars[s.id] || 0;
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
    let s = stickerDB[stickerId];
    if (!s || !window.gachaData.collection.includes(stickerId)) return;
    let stars = window.gachaData.stars[stickerId] || 0;
    let assets = getStickerAssets(s);
    let matchedHero = stickerId < 10 ? heroes[stickerId] : null;
    let modal = document.getElementById('sticker-detail-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('detail-img').src = assets.img;
        let starText = `\n\n⭐ 星級：${stars}/5${stars >= 5 ? ' (已解鎖專屬寵物與招式！)' : ''}`;
        if (matchedHero) {
            let is5Star = stars >= 5;
            let s4Text = is5Star ? `4. 被動：${matchedHero.passiveDesc}` : `4. 🔒 招式四被動 (滿五星解鎖)`;
            document.getElementById('detail-title').innerText = `${matchedHero.name} - ${matchedHero.title}`;
            
            document.getElementById('detail-desc').innerText = `✨ ${matchedHero.feature}\n\n💖 生命: ${matchedHero.baseHp} | 🪄 提示: ${matchedHero.baseHints}\n\n⚔️ 招式：\n1. ${matchedHero.skills[0]} (攻擊力: ${matchedHero.baseDmg[0]})\n2. ${matchedHero.skills[1]} (攻擊力: ${matchedHero.baseDmg[1]})\n3. ${matchedHero.skills[2]} (攻擊力: ${matchedHero.baseDmg[2]})\n${s4Text}${starText}`;
        } else {
            document.getElementById('detail-title').innerText = s.name;
            document.getElementById('detail-desc').innerText = (s.desc || "一張魔法貼紙！") + starText;
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

// ★ 核心修復區：切換單字庫時，防當機與防卡死完美版！
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
    
    // ★ 防卡死完美機制：判斷玩家是不是在「戰鬥中」偷改單字
    let gameCont = document.getElementById('game-container');
    if (gameCont && gameCont.classList.contains('game-show')) {
        // 1. 強制鎖死戰鬥，隱藏戰鬥畫面與結算畫面
        if (typeof isWait !== 'undefined') isWait = true;
        gameCont.classList.remove('game-show');
        
        let victScreen = document.getElementById('victory-screen');
        if (victScreen) victScreen.style.display = 'none';
        
        // 2. ★ 核心修復：把「選英雄的開始畫面」叫出來！(不然會卡在無盡虛空)
        let startScreen = document.getElementById('start-screen');
        if(startScreen) {
            startScreen.style.display = 'flex';
            setTimeout(() => startScreen.style.opacity = '1', 10);
        }
        
        // 3. 安全停止戰鬥中的音樂，恢復大廳音樂
        let combatBgm = document.getElementById('my-bgm');
        if (combatBgm && combatBgm.pause) combatBgm.pause();
        if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel();
        
        if (typeof window.lobbyBgm !== 'undefined' && window.lobbyBgm.paused) {
            window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
            window.lobbyBgm.play().catch(e => {});
        }
        
        // 4. 自動幫玩家把設定跟單字本彈窗關乾淨
        if (typeof toggleSettings === 'function') toggleSettings(false);
        closeWordListModal();
        if (typeof closeLobbyModal === 'function') closeLobbyModal();
        
        // 5. 貼心提示阿比
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

// ========== 大廳主畫面 (完美切換背景) ==========
function openLobby() {
    updateLobbyUI();
    
    // ★ 1. 把選英雄畫面隱藏，避免背景疊圖
    let startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'none';
    
    // ★ 2. 顯示魔法大廳
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'flex';
    
    // ★ 3. 確保大廳音樂繼續播放 (如果還沒播的話)
    if (window.lobbyBgm && window.lobbyBgm.paused) {
        window.lobbyBgm.volume = window.audioSettings ? window.audioSettings.bgm : 0.5;
        window.lobbyBgm.play().catch(e => {});
    }
}

function closeLobby() {
    // ★ 1. 隱藏魔法大廳
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'none';
    
    // ★ 2. 顯示選英雄畫面
    let startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'flex';
    
    checkUnlocks();
    changeHeroSelection(0);
    
    // ★ 注意！不要暫停 lobbyBgm，讓它在選英雄畫面繼續播！
}

// ========== 建立大廳畫面 ==========
function createLobbyUI() {
    if (document.getElementById('gacha-lobby')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="gacha-lobby" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:url('assets/bg_lobby.png') center/cover no-repeat; z-index:6000; flex-direction:column; padding:20px; box-sizing:border-box; overflow-y:auto;">
            <div class="lobby-header" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.8); padding:15px 20px; border-radius:30px; margin-bottom:20px;">
                <div style="font-size:24px; font-weight:bold; color:#f06292;">📔 魔法圖鑑大廳</div>
                <div style="display:flex; gap:15px; font-size:20px; font-weight:bold;">
                    <span style="color:#f39c12;">🪙 <span id="lobby-coin-val">0</span></span>
                    <span style="color:#8e44ad;">✨ <span id="lobby-dust-val">0</span></span>
                </div>
                <button class="close-btn" onclick="closeLobby()" style="position:relative;">X</button>
            </div>
            <div id="buff-panel" style="background:rgba(255,255,255,0.9); padding:12px; border-radius:15px; margin-bottom:20px; text-align:center; font-weight:bold; font-size:18px;"></div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:15px;">
                <button class="lobby-btn" onclick="openPoolEditor()" style="background:#e74c3c;">⚙️ 開放設定</button>
                <button class="lobby-btn" onclick="openModal('rules')" style="background:#fff9c4; color:#d35400;">📜 規則</button>
                <button class="lobby-btn" onclick="openModal('shop')" style="background:#a29bfe;">🏪 商店</button>
                <button class="lobby-btn" onclick="openModal('collection')" style="background:#fd79a8;">📚 所有貼紙</button>
                <button class="lobby-btn" onclick="openModal('wall')" style="background:#74b9ff;">🖼️ 展示牆</button>
                <button class="lobby-btn" onclick="openModal('lessons')" style="background:#00cec9;">📖 單字本</button>
                <button class="lobby-btn" onclick="openModal('report')" style="background:#dfe6e9; color:#2d3436;">📊 戰報</button>
                <button class="lobby-btn" onclick="openModal('gacha')" style="background:linear-gradient(135deg,#ffd700,#ff8c00);">🎁 轉蛋機</button>
            </div>
        </div>
        
        <div id="lobby-modal" class="modal-overlay" style="display:none; z-index:9500;">
            <div class="modal-content" style="width:95%; max-width:800px; height:90vh; padding:20px; overflow-y:hidden; position:relative; background:rgba(255,255,255,0.95); border-radius:20px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                <button class="close-btn" onclick="window.closeLobbyModal()" style="position:absolute; right:15px; top:15px; z-index:10000; background:#ff4757; color:white; border:none; border-radius:50%; width:40px; height:40px; font-weight:bold; font-size:22px; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.3);">X</button>
                <div id="lobby-modal-content" style="height:100%; overflow-y:auto; padding-top:10px;"></div>
            </div>
        </div>
    `);

    const style = document.createElement('style');
    style.textContent = `
        .lobby-btn {
            padding: 15px 25px;
            font-size: 20px;
            font-weight: bold;
            border: none;
            border-radius: 40px;
            cursor: pointer;
            color: white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transition: transform 0.1s;
            flex: 0 0 auto;
        }
        .lobby-btn:active { transform: scale(0.95); }
        
        button[onclick*="changeHeroSelection"] {
            font-size: 36px !important;
            padding: 10px 25px !important;
            border-radius: 15px !important;
            background: rgba(255, 255, 255, 0.9) !important;
            color: #8e44ad !important;
            border: 4px solid #ffd700 !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
            cursor: pointer;
            transition: 0.2s;
        }
        button[onclick*="changeHeroSelection"]:hover {
            transform: scale(1.1);
            background: #fff9c4 !important;
        }

        @keyframes breatheAnim {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @media (max-width: 600px) {
            .lobby-btn { padding: 12px 20px; font-size: 16px; }
            button[onclick*="changeHeroSelection"] { font-size: 28px !important; padding: 8px 15px !important; }
        }
    `;
    document.head.appendChild(style);

    let startScreen = document.getElementById('start-screen');
    if (startScreen) {
        let openBtn = document.createElement('button');
        openBtn.innerHTML = "📔 進入大廳";
        openBtn.style.cssText = "background: linear-gradient(180deg, #ffd700, #ff8c00); color: white; padding: 15px 40px; border-radius: 50px; font-size: 24px; font-weight: bold; border: 4px solid white; cursor: pointer; margin-top: 20px;";
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