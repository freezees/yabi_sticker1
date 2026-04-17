// lobby.js - 精簡彈窗版大廳 (完整修復版)

const rarityFolderMap = { 'SSR': 'ssr', 'SR': 'sr', 'R': 'r', 'N': 'normal' };
const FALLBACK_IMAGE = 'assets/meteor.png';

// 大廳背景音樂
window.lobbyBgm = window.lobbyBgm || new Audio('assets/music/gacha_bgm.mp3');
window.lobbyBgm.loop = true;

window.shopBgm = window.shopBgm || new Audio('assets/music/shop_bgm.mp3');
window.shopBgm.loop = true;
window.gachaBgm = window.gachaBgm || new Audio('assets/music/gacha_bgm.mp3');
window.gachaBgm.loop = true;

// 記錄目前大廳音樂是否正在播放
let isLobbyMusicPlaying = false;

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

    let preview = document.getElementById('selected-char-preview');
    if (preview) {
        preview.src = `${h.folder}/hero.png`;
        preview.onerror = function () { this.src = FALLBACK_IMAGE; };
        if (h.unlocked && selectedHeroIdx < 10) preview.classList.add('ssr-glow');
        else preview.classList.remove('ssr-glow');
    }

    const status = document.getElementById('char-status-text');
    const startBtn = document.getElementById('central-start-btn');
    if (h.unlocked) {
        if (preview) preview.classList.remove('char-locked');
        if (status) status.innerHTML = `<div style="color:#ff1493; font-size:24px; font-weight:900;">${h.name}</div><div style="color:#f06292; font-size:16px;">⚔️ ${h.title}</div>`;
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

// ========== 大廳音樂控制 ==========
function startLobbyMusic() {
    if (window.lobbyBgm) {
        window.lobbyBgm.currentTime = 0;
        window.lobbyBgm.volume = typeof bgm !== 'undefined' ? bgm.volume : 0.1;
        window.lobbyBgm.play().catch(e => console.log('lobby music error'));
        isLobbyMusicPlaying = true;
    }
}

function stopLobbyMusic() {
    if (window.lobbyBgm) {
        window.lobbyBgm.pause();
        isLobbyMusicPlaying = false;
    }
}

// ========== 彈窗管理（修復版）==========
// 將 closeModal 改為專屬名稱 closeLobbyModal，避免與另外 6 個檔案發生命名衝突
window.closeLobbyModal = function() {
    const modal = document.getElementById('lobby-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 停止彈窗的音樂
    if (window.gachaBgm) window.gachaBgm.pause();
    if (window.shopBgm) window.shopBgm.pause();
    
    // 恢復大廳音樂
    if (isLobbyMusicPlaying) {
        startLobbyMusic();
    }
};

function openModal(contentId) {
    const modal = document.getElementById('lobby-modal');
    const content = document.getElementById('lobby-modal-content');
    if (!modal || !content) return;
    
    // 停止大廳音樂
    stopLobbyMusic();
    
    // 停止所有彈窗音樂
    if (window.gachaBgm) window.gachaBgm.pause();
    if (window.shopBgm) window.shopBgm.pause();
    
    // 根據 contentId 產生對應內容
    if (contentId === 'gacha') {
        content.innerHTML = buildGachaContent();
        if (window.gachaBgm) {
            window.gachaBgm.currentTime = 0;
            window.gachaBgm.play().catch(e => console.log('gacha music error'));
        }
    } else if (contentId === 'shop') {
        content.innerHTML = buildShopContent();
        if (window.shopBgm) {
            window.shopBgm.currentTime = 0;
            window.shopBgm.play().catch(e => console.log('shop music error'));
        }
    } else if (contentId === 'collection') {
        content.innerHTML = buildCollectionContent();
    } else if (contentId === 'wall') {
        content.innerHTML = buildWallContent();
    } else if (contentId === 'lessons') {
        if (!verifyParent()) return;
        content.innerHTML = buildLessonsContent();
    } else if (contentId === 'report') {
        content.innerHTML = buildReportContent();
    } else if (contentId === 'rules') {
        content.innerHTML = buildRulesContent();
    }

    modal.style.display = 'flex';
}

// 點擊 modal 背景也可以關閉
document.addEventListener('click', function(e) {
    const modal = document.getElementById('lobby-modal');
    if (modal && modal.style.display === 'flex') {
        if (e.target === modal) {
            window.closeLobbyModal(); // 更新為新的關閉函數
        }
    }
});

// ========== 彈窗內容產生器（加入動畫 class）==========
function buildGachaContent() {
    updateLobbyUI();
    return `
        <div style="text-align:center;">
            <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.7); padding:10px 20px; border-radius:30px; margin-bottom:20px;">
                <span style="color:#f39c12; font-size:24px;">🪙 ${window.gachaData.coins}</span>
                <span style="color:#8e44ad; font-size:24px;">✨ ${window.gachaData.dust}</span>
            </div>
            <div style="position:relative; width:100%; display:flex; justify-content:center; margin:20px 0;">
                <img src="assets/Gacha.png" style="width:180px; filter:drop-shadow(0 15px 25px rgba(0,0,0,0.5)); animation:breatheAnim 3s infinite;" onerror="this.src='${FALLBACK_IMAGE}'">
            </div>
            <div style="font-size:18px; margin-bottom:20px;">每次抽取消耗 10 枚代幣</div>
            <div style="display:flex; gap:20px; justify-content:center;">
                <button class="gacha-pull-btn" onclick="pullGachaModal(1)">抽 1 次</button>
                <button class="gacha-pull-btn" onclick="pullGachaModal(5)">抽 5 次</button>
            </div>
        </div>
    `;
}

function buildShopContent() {
    updateLobbyUI();
    let html = `<div style="text-align:center; margin-bottom:15px;"><span style="background:rgba(0,0,0,0.7); padding:8px 20px; border-radius:30px; font-size:22px;">✨ 星塵：${window.gachaData.dust}</span></div>`;
    html += '<div class="sticker-grid" style="max-height:450px; overflow-y:auto;">';
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
                ${!isMaxed ? `<div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); background:white; padding:2px 8px; border-radius:10px; font-size:13px;">✨ ${price}</div>` : '<div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.7); color:white; padding:2px 8px; border-radius:10px; font-size:11px;">已滿星</div>'}
            </div>
        `;
    });
    if (!hasItem) html += '<div style="text-align:center; padding:40px;">寶盒空空的！先去轉蛋機解鎖貼紙吧！</div>';
    else html += '</div>';
    
    // 加入飄動的寶箱動畫
    html += `
        <div style="text-align:center; margin-top:20px;">
            <img id="shop-magic-box" src="assets/shop_box.png" onerror="this.src='${FALLBACK_IMAGE}';" style="width:150px; filter:drop-shadow(0 10px 15px rgba(0,0,0,0.5)); animation:breatheAnim 2.5s infinite; cursor:pointer;" onclick="alert('點擊商店中的貼紙即可升級！✨')">
            <div style="font-size:14px; color:#888; margin-top:5px;">✨ 點擊貼紙使用星塵升級 ✨</div>
        </div>
    `;
    return html;
}

function buildCollectionContent() {
    updateLobbyUI();
    let owned = window.gachaData.collection.filter(id => enabledStickers.includes(id)).length;
    let html = `<div style="text-align:center; margin-bottom:15px; font-weight:bold;">進度：${owned} / ${enabledStickers.length}</div>`;
    html += '<div class="sticker-grid" style="max-height:500px; overflow-y:auto;">';
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
    let html = '<div class="wall-grid" style="flex-wrap:wrap; justify-content:center;">';
    window.gachaData.wall.forEach((slotId, index) => {
        if (slotId !== null && enabledStickers.includes(slotId)) {
            let s = stickerDB[slotId];
            let assets = getStickerAssets(s);
            html += `<div class="wall-slot rarity-${s.rarity}" onclick="editWallSlot(${index})"><img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'"></div>`;
        } else {
            html += `<div class="wall-slot" onclick="editWallSlot(${index})"><div style="font-size:40px;">+</div></div>`;
        }
    });
    html += '</div>';
    return html;
}

function buildLessonsContent() {
    let html = '<div style="font-size:20px; font-weight:bold; text-align:center; margin-bottom:15px;">📖 選擇單字庫</div>';
    html += '<div style="display:flex; flex-direction:column; gap:10px;">';
    Object.keys(lessonData).forEach(lesson => {
        let isChecked = activeLessons.includes(lesson) ? "checked" : "";
        html += `
            <div style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.9); padding:10px 20px; border-radius:15px; border:3px solid #ffb6c1;">
                <input type="checkbox" value="${lesson}" ${isChecked} onchange="updateLessonsModal(this)" style="width:25px; height:25px; cursor:pointer;">
                <div onclick="showLessonWordsModal('${lesson}')" style="cursor:pointer; flex-grow:1;">
                    <span style="font-weight:bold; font-size:20px;">${lesson.toUpperCase()}</span>
                    <span style="color:#666; font-size:14px;">(${lessonData[lesson].length} 字)</span>
                </div>
                <span style="font-size:24px;">🔍</span>
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
    if (arr.length === 0) return '<div style="text-align:center; padding:40px;">暫無戰鬥紀錄</div>';
    let html = '<div style="max-height:450px; overflow-y:auto;"><table style="width:100%; text-align:center; border-collapse:collapse;">';
    html += '<tr style="background:#ffb6c1;"><th>單字</th><th>✅</th><th>❌</th><th>錯誤率</th></tr>';
    arr.slice(0, 30).forEach(item => {
        let errColor = item.p >= 50 ? '#e74c3c' : '#555';
        html += `<tr style="border-bottom:1px solid #ffe6f0;"><td style="padding:8px; font-weight:bold;">${item.word}</td><td style="color:#2ecc71;">${item.s}</td><td style="color:${errColor};">${item.f}</td><td style="color:${errColor};">${item.p}%</td></tr>`;
    });
    html += '</table></div>';
    return html;
}

function buildRulesContent() {
    return `
        <h2 style="text-align:center;">📜 遊戲規則</h2>
        <div style="text-align:center; color:#e74c3c;">基礎爆擊率：5% (爆擊傷害 2 倍)</div>
        <ul style="line-height:1.8; background:#f9f9f9; padding:15px 25px; border-radius:10px;">
            <li>🌈 彩色(SSR)：每張 +1 血量💖，滿星解鎖招式四</li>
            <li>🟪 紫色(SR)：每張 +1% 爆擊率💥，滿星再 +1%</li>
            <li>🟨 金色(R)：每 5 張 +1 提示🪄，滿星再 +1</li>
            <li>⬜ 普通(N)：每 10 張 +1 通關代幣🪙</li>
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

    for (let i = 0; i < times; i++) {
        let roll = Math.random();
        let rarity = roll < 0.05 ? 'SSR' : (roll < 0.15 ? 'SR' : (roll < 0.40 ? 'R' : 'N'));
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

    let resultHtml = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-bottom:20px;">';
    results.forEach(res => {
        let assets = getStickerAssets(res);
        let glowClass = res.rarity === 'SSR' ? 'ssr-glow' : (res.rarity === 'SR' ? 'sr-glow' : (res.rarity === 'R' ? 'r-glow' : ''));
        resultHtml += `<div class="sticker-card rarity-${res.rarity}" style="width:85px; height:85px;">
            <div class="sticker-id">${getStickerDisplayId(res)}</div>
            <img src="${assets.img}" class="${glowClass}" style="width:70%;">
            <div class="rarity-badge badge-${res.rarity}">${res.rarity}</div>
        </div>`;
    });
    resultHtml += '</div>';
    let msg = `抽到 ${times} 張貼紙！${gotStar ? '⭐ 星級提升！' : ''}${totalDust > 0 ? `✨ 獲得 ${totalDust} 星塵` : ''}`;
    document.getElementById('lobby-modal-content').innerHTML = `<div style="text-align:center;">${resultHtml}<div style="font-size:18px;">${msg}</div><button class="big-btn" style="margin-top:20px;" onclick="refreshGachaModal()">確認</button></div>`;
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
        let starText = `\n\n⭐ 星級：${stars}/5${stars >= 5 ? ' (已解鎖專屬短片！)' : ''}`;
        if (matchedHero) {
            let is5Star = stars >= 5;
            let s4Text = is5Star ? `4. ${matchedHero.skills[3]} (🌟五星解鎖)` : `4. 🔒 (滿五星解鎖)`;
            document.getElementById('detail-title').innerText = `${matchedHero.name} - ${matchedHero.title}`;
            document.getElementById('detail-desc').innerText = `✨ ${matchedHero.feature}\n\n⚔️ 招式：\n1. ${matchedHero.skills[0]}\n2. ${matchedHero.skills[1]}\n3. ${matchedHero.skills[2]}\n${s4Text}${starText}`;
        } else {
            document.getElementById('detail-title').innerText = s.name;
            document.getElementById('detail-desc').innerText = (s.desc || "一張魔法貼紙！") + starText;
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
    buildCurrentWordList();
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
    let wordsHtml = words.map(w => `<span style="display:inline-block; background:white; padding:8px 15px; margin:5px; border-radius:10px; border:2px solid #a29bfe;">${w}</span>`).join('');
    modal.innerHTML = `
    <div class="modal-content" style="max-width:500px; text-align:center;">
        <button class="close-btn" onclick="closeWordListModal()">X</button>
        <h2>📖 ${lesson.toUpperCase()}</h2>
        <div style="display:flex; flex-wrap:wrap; justify-content:center;">${wordsHtml}</div>
        <button class="big-btn" onclick="closeWordListModal()">關閉</button>
    </div>`;
    modal.style.display = 'flex';
}

function closeWordListModal() {
    const modal = document.getElementById('word-list-modal');
    if (modal) modal.style.display = 'none';
}

// ========== 大廳主畫面 ==========
function openLobby() {
    updateLobbyUI();
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'flex';
    if (typeof bgm !== 'undefined') bgm.pause();
    // 播放大廳音樂
    startLobbyMusic();
}

function closeLobby() {
    const lobby = document.getElementById('gacha-lobby');
    if (lobby) lobby.style.display = 'none';
    checkUnlocks();
    changeHeroSelection(0);
    // 停止大廳音樂
    stopLobbyMusic();
    if (typeof isMusicPlaying !== 'undefined' && isMusicPlaying && typeof bgm !== 'undefined') {
        bgm.play().catch(e => console.log('bgm resume error'));
    }
}

// ========== 建立大廳畫面 ==========
function createLobbyUI() {
    if (document.getElementById('gacha-lobby')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="gacha-lobby" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:url('assets/bg_main.png') center/cover no-repeat; z-index:6000; flex-direction:column; padding:20px; box-sizing:border-box; overflow-y:auto;">
            <div class="lobby-header" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.8); padding:15px 20px; border-radius:30px; margin-bottom:20px;">
                <div style="font-size:24px; font-weight:bold; color:#f06292;">📔 魔法圖鑑大廳</div>
                <div style="display:flex; gap:15px; font-size:20px; font-weight:bold;">
                    <span style="color:#f39c12;">🪙 <span id="lobby-coin-val">0</span></span>
                    <span style="color:#8e44ad;">✨ <span id="lobby-dust-val">0</span></span>
                </div>
                <button class="close-btn" onclick="closeLobby()" style="position:relative;">X</button>
            </div>
            <div id="buff-panel" style="background:rgba(255,255,255,0.9); padding:12px; border-radius:15px; margin-bottom:20px; text-align:center; font-weight:bold;"></div>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px;">
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
            <div class="modal-content" style="max-width:95%; width:500px; padding:20px; max-height:85vh; overflow-y:auto; position: relative;">
                <button class="close-btn" onclick="window.closeLobbyModal()" style="position: absolute; right: 15px; top: 15px; z-index: 10000; background: #ff4757; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; font-weight: bold; font-size: 18px; cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">X</button>
                <div id="lobby-modal-content"></div>
            </div>
        </div>
    `);

    // 加入按鈕樣式
    const style = document.createElement('style');
    style.textContent = `
        .lobby-btn {
            padding: 12px 20px;
            font-size: 18px;
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
        @keyframes breatheAnim {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
        }
        @media (max-width: 600px) {
            .lobby-btn { padding: 8px 16px; font-size: 14px; }
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