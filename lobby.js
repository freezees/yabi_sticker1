// lobby.js - 轉蛋大廳、星塵商店、圖鑑與單字本 UI (完整大廳 + 彈窗模式)

const rarityFolderMap = { 'SSR': 'ssr', 'SR': 'sr', 'R': 'r', 'N': 'normal' };

window.shopBgm = window.shopBgm || new Audio('assets/music/shop_bgm.mp3');
window.shopBgm.loop = true;
window.gachaBgm = window.gachaBgm || new Audio('assets/music/gacha_bgm.mp3');
window.gachaBgm.loop = true;

const FALLBACK_IMAGE = 'assets/meteor.png';

function getStickerDisplayId(s) {
    let rank = stickerDB.filter(x => x.rarity === s.rarity && x.id <= s.id).length;
    return (s.rarity + rank).toLowerCase(); 
}

function getStickerAssets(s) {
    let folder = rarityFolderMap[s.rarity] || 'normal';
    let baseName = getStickerDisplayId(s);
    return { 
        img: `sticker/${folder}/${baseName}.png`, 
        vid: `sticker_video/${folder}/intro${baseName}.mp4` 
    };
}

function checkUnlocks() { 
    if(!window.gachaData || !window.gachaData.collection) {
        window.gachaData = { coins: 0, dust: 0, collection: [0, 1], wall: [], stars: {0:0, 1:0} };
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
    if(preview) { 
        preview.src = `${h.folder}/hero.png`; 
        preview.onerror = function() { this.src = FALLBACK_IMAGE; }; 
        if(h.unlocked && selectedHeroIdx < 10) preview.classList.add('ssr-glow');
        else preview.classList.remove('ssr-glow');
    }
    
    const status = document.getElementById('char-status-text');
    const startBtn = document.getElementById('central-start-btn');
    if(h.unlocked) { 
        if(preview) preview.classList.remove('char-locked'); 
        if(status) status.innerHTML = `<div style="color:#ff1493; font-size:24px; font-weight:900;">${h.name}</div><div style="color:#f06292; font-size:16px;">⚔️ ${h.title}</div>`;
        if(startBtn) startBtn.style.display = "block";
    } else { 
        if(preview) preview.classList.add('char-locked'); 
        if(status) status.innerHTML = `<div style="color:#aaa; font-size:22px; font-weight:bold;">🔒 尚未解鎖</div><div style="color:#ccc; font-size:14px;">在轉蛋屋抽到她的彩色貼紙來喚醒！</div>`;
        if(startBtn) startBtn.style.display = "none";
    }
}

function openPoolEditor() {
    if(!verifyParent()) return; 
    buildPoolEditorUI();
    document.getElementById('pool-edit-modal').style.display = 'flex';
}

function buildPoolEditorUI() {
    let m = document.getElementById('pool-edit-modal');
    if(!m) { m = document.createElement('div'); m.id = 'pool-edit-modal'; m.className = 'modal-overlay'; m.style.zIndex = '9600'; document.body.appendChild(m); }
    
    let counts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };
    enabledStickers.forEach(id => { let s = stickerDB.find(x => x.id === id); if(s) counts[s.rarity]++; });

    let totals = {
        'SSR': stickerDB.filter(x => x.rarity === 'SSR').length,
        'SR': stickerDB.filter(x => x.rarity === 'SR').length,
        'R': stickerDB.filter(x => x.rarity === 'R').length,
        'N': stickerDB.filter(x => x.rarity === 'N').length
    };

    let html = `
    <div class="modal-content" style="max-width: 500px; width: 90%; text-align: center;">
        <button class="close-btn" onclick="document.getElementById('pool-edit-modal').style.display='none'">X</button>
        <h2 style="color:#8e44ad; margin-bottom: 20px;">⚙️ 快速開放設定</h2>
        <div style="font-size:16px; color:#666; margin-bottom:20px;">請輸入各稀有度要開放「前幾張」貼紙：</div>
        
        <div style="display:flex; flex-direction:column; gap:15px; background:#f9f9f9; padding:20px; border-radius:15px; border:2px solid #ddd;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#ff4757; font-weight:bold; font-size:18px;">🌈 彩色 (SSR)</span>
                <div>開放前 <input type="number" id="input-ssr" value="${counts['SSR']}" min="1" max="${totals['SSR']}" style="width:60px; padding:5px; text-align:center; font-weight:bold;"> / ${totals['SSR']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#8e44ad; font-weight:bold; font-size:18px;">🟪 紫色 (SR)</span>
                <div>開放前 <input type="number" id="input-sr" value="${counts['SR']}" min="0" max="${totals['SR']}" style="width:60px; padding:5px; text-align:center; font-weight:bold;"> / ${totals['SR']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#f39c12; font-weight:bold; font-size:18px;">🟨 金色 (R)</span>
                <div>開放前 <input type="number" id="input-r" value="${counts['R']}" min="0" max="${totals['R']}" style="width:60px; padding:5px; text-align:center; font-weight:bold;"> / ${totals['R']} 張</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#7f8c8d; font-weight:bold; font-size:18px;">⬜ 普通 (N)</span>
                <div>開放前 <input type="number" id="input-n" value="${counts['N']}" min="0" max="${totals['N']}" style="width:60px; padding:5px; text-align:center; font-weight:bold;"> / ${totals['N']} 張</div>
            </div>
        </div>

        <button class="big-btn" style="margin-top:25px; width:100%; background:linear-gradient(180deg, #3498db, #2980b9); border:none;" onclick="savePoolEditorByCount()">💾 儲存設定</button>
    </div>`;
    m.innerHTML = html;
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

    if(!newEnabled.includes(0)) newEnabled.push(0);
    if(!newEnabled.includes(1)) newEnabled.push(1);

    enabledStickers = newEnabled;
    localStorage.setItem('dragonGameEnabledStickers', JSON.stringify(enabledStickers));
    document.getElementById('pool-edit-modal').style.display = 'none';
    updateLobbyUI(); checkUnlocks(); changeHeroSelection(0);
    alert("✅ 卡池數量設定已成功儲存！");
}

// ========== 彈窗模式的大廳功能 ==========

function openLobbyModal(contentId, title = "大廳功能") {
    const modal = document.getElementById('lobby-modal');
    const content = document.getElementById('lobby-modal-content');
    if (!modal || !content) return;
    
    // 根據 contentId 產生對應內容
    if (contentId === 'gacha') {
        content.innerHTML = buildGachaContent();
    } else if (contentId === 'shop') {
        content.innerHTML = buildShopContent();
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

function closeLobbyModal() {
    const modal = document.getElementById('lobby-modal');
    if (modal) modal.style.display = 'none';
}

function buildGachaContent() {
    updateLobbyUI();
    return `
        <div style="position: relative; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.7); padding: 10px 20px; border-radius: 30px; margin-bottom: 20px;">
                <span style="color: #f39c12; font-size: 24px; font-weight: bold;">🪙 ${window.gachaData.coins}</span>
                <span style="color: #8e44ad; font-size: 24px; font-weight: bold;">✨ ${window.gachaData.dust}</span>
            </div>
            <div style="text-align: center;">
                <img src="assets/Gacha.png" style="width: 160px; margin: 20px auto; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.5));" onerror="this.src='${FALLBACK_IMAGE}'">
                <div style="font-size: 18px; color: #666; margin-bottom: 20px;">每次抽取消耗 10 枚代幣</div>
                <div style="display: flex; gap: 20px; justify-content: center;">
                    <button class="gacha-pull-btn" onclick="pullGachaModal(1)" style="padding: 10px 25px; font-size: 18px;">抽 1 次</button>
                    <button class="gacha-pull-btn" onclick="pullGachaModal(5)" style="padding: 10px 25px; font-size: 18px;">抽 5 次</button>
                </div>
            </div>
        </div>
    `;
}

function buildShopContent() {
    updateLobbyUI();
    let gridHtml = '<div class="sticker-grid" style="max-height: 450px; overflow-y: auto;">';
    let shopPriceMap = {'N':3, 'R':9, 'SR':15, 'SSR':30};
    let itemsAdded = 0;
    
    stickerDB.forEach(s => {
        if(!enabledStickers.includes(s.id)) return;
        let isOwned = window.gachaData.collection.includes(s.id);
        if(!isOwned) return;
        
        itemsAdded++;
        let stars = window.gachaData.stars[s.id] || 0;
        let price = shopPriceMap[s.rarity];
        let isMaxed = stars >= 5;
        let assets = getStickerAssets(s);
        
        gridHtml += `
            <div class="sticker-card rarity-${s.rarity} ${isMaxed ? 'sticker-locked' : ''}" style="position:relative; cursor:pointer;" onclick="buyShopItemModal(${s.id}, ${price})">
                <div class="sticker-id">${getStickerDisplayId(s)}</div>
                <img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">
                ${stars > 0 ? `<div class="card-stars">${'⭐'.repeat(stars)}</div>` : ''}
                <div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>
                ${!isMaxed ? `<div style="position:absolute; bottom:5px; background:rgba(255,255,255,0.95); color:#d35400; padding:2px 8px; border-radius:10px; font-size:13px; font-weight:bold; left:50%; transform:translateX(-50%); white-space:nowrap;">✨ ${price}</div>` : '<div style="position:absolute; bottom:5px; background:rgba(0,0,0,0.7); color:white; padding:2px 8px; border-radius:10px; font-size:11px; left:50%; transform:translateX(-50%);">已滿星</div>'}
            </div>
        `;
    });
    
    if (itemsAdded === 0) {
        gridHtml = '<div style="text-align:center; padding:40px; color:#666;">寶盒裡空空的喔！先去轉蛋機解鎖一些貼紙吧！</div>';
    } else {
        gridHtml += '</div>';
    }
    
    return `
        <div style="position: relative; width: 100%;">
            <div style="text-align: center; margin-bottom: 15px;">
                <span style="background: rgba(0,0,0,0.7); padding: 8px 20px; border-radius: 30px; color: #8e44ad; font-size: 22px; font-weight: bold;">✨ 星塵：${window.gachaData.dust}</span>
            </div>
            ${gridHtml}
        </div>
    `;
}

function buildCollectionContent() {
    updateLobbyUI();
    let enabledOwned = window.gachaData.collection.filter(id => enabledStickers.includes(id)).length;
    let gridHtml = `<div style="margin-bottom:15px; font-weight:bold; color:#8e44ad; text-align:center;">進度：${enabledOwned} / ${enabledStickers.length}</div>`;
    gridHtml += '<div class="sticker-grid" style="max-height: 500px; overflow-y: auto;">';
    
    stickerDB.forEach(s => {
        if(!enabledStickers.includes(s.id)) return;
        let isOwned = window.gachaData.collection.includes(s.id);
        let stars = window.gachaData.stars[s.id] || 0;
        let assets = getStickerAssets(s);
        
        gridHtml += `
            <div class="sticker-card rarity-${s.rarity} ${!isOwned ? 'sticker-locked' : ''}" onclick="showStickerDetail(${s.id})">
                <div class="sticker-id">${getStickerDisplayId(s)}</div>
                ${isOwned ? `<img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">${stars > 0 ? `<div class="card-stars">${'⭐'.repeat(stars)}</div>` : ''}` : '<div style="font-size:30px; color:#ccc;">?</div>'}
                <div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>
            </div>
        `;
    });
    gridHtml += '</div>';
    return gridHtml;
}

function buildWallContent() {
    let wallGridHtml = '<div class="wall-grid" style="flex-wrap: wrap; justify-content: center;">';
    window.gachaData.wall.forEach((slotId, index) => {
        if(slotId !== null && enabledStickers.includes(slotId)) {
            let s = stickerDB[slotId];
            let assets = getStickerAssets(s);
            wallGridHtml += `
                <div class="wall-slot rarity-${s.rarity}" onclick="editWallSlot(${index})">
                    <img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">
                </div>
            `;
        } else {
            wallGridHtml += `<div class="wall-slot" onclick="editWallSlot(${index})"><div style="font-size:40px; color:#ffc1e3;">+</div></div>`;
        }
    });
    wallGridHtml += '</div>';
    return wallGridHtml;
}

function buildLessonsContent() {
    let html = '<div style="font-size:20px; font-weight:bold; color:#8e44ad; margin-bottom:15px; text-align:center;">📖 選擇要練習的單字庫</div>';
    html += '<div style="display:flex; flex-direction:column; gap:10px;">';
    Object.keys(lessonData).forEach(lesson => {
        let isChecked = activeLessons.includes(lesson) ? "checked" : "";
        html += `
            <div style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.9); padding:10px 20px; border-radius:15px; border:3px solid #ffb6c1;">
                <input type="checkbox" value="${lesson}" ${isChecked} onchange="updateLessonsModal(this)" style="width:25px; height:25px; accent-color:#f06292; cursor:pointer;">
                <div onclick="showLessonWordsModal('${lesson}')" style="cursor:pointer; flex-grow:1;">
                    <span style="font-weight:bold; color:#8e44ad; font-size: 20px;">${lesson.toUpperCase()}</span>
                    <span style="color:#666; font-size:14px;">(${lessonData[lesson].length} 個單字)</span>
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
        return { word: w, s: log[w].success, f: log[w].fail, t: total, p: pct };
    });
    arr.sort((a, b) => b.f !== a.f ? b.f - a.f : b.p - a.p);
    
    if(arr.length === 0) {
        return '<div style="text-align:center; color:#aaa; font-size:18px; padding:40px;">目前還沒有戰鬥紀錄喔！快去打魔龍吧！</div>';
    }
    
    let html = '<div style="max-height: 450px; overflow-y: auto;"><table style="width:100%; text-align:center; border-collapse: collapse; font-size:15px;"><tr style="background:#ffb6c1; color:white;"><th style="padding:8px;">單字</th><th style="padding:8px;">✅</th><th style="padding:8px;">❌</th><th style="padding:8px;">錯誤率</th></tr>';
    arr.slice(0, 30).forEach(item => {
        let errColor = item.p >= 50 || item.f > 3 ? '#e74c3c' : '#555';
        html += `<tr style="border-bottom:1px solid #ffe6f0;"><td style="padding:8px; font-weight:bold; color:#8e44ad;">${item.word}</td><td style="color:#2ecc71;">${item.s}</td><td style="color:${errColor};">${item.f}</td><td style="color:${errColor};">${item.p}%</td></tr>`;
    });
    html += '</table></div>';
    return html;
}

function buildRulesContent() {
    return `
        <h2 style="color:#8e44ad; text-align:center; margin-bottom: 10px;">📜 遊戲規則與加成說明</h2>
        <div style="text-align:center; color:#e74c3c; font-weight:bold; margin-bottom:15px;">基礎爆擊率：5% (爆擊時傷害變為 2 倍💥)</div>
        <ul style="line-height:1.8; font-size:15px; color:#333; text-align: left; background:#f9f9f9; padding: 15px 25px; border-radius: 10px; border: 2px dashed #ccc;">
            <li>🌈 <b style="color:#ff4757;">彩色(SSR)：</b>每收集 1 張，全體英雄血量 <b>+1</b>💖。滿五星解鎖「指定招式四 (每局限一次)」與專屬短片！</li>
            <li>🟪 <b style="color:#8e44ad;">紫色(SR)：</b>每收集 1 張，爆擊率 <b>+1%</b>；該貼紙滿五星再 <b>+1%</b>💥！滿五星解鎖專屬短片！</li>
            <li>🟨 <b style="color:#f39c12;">金色(R)：</b>每收集 5 張，戰鬥提示次數 <b>+1</b>；滿五星再 <b>+1</b>🪄！滿五星解鎖專屬短片！</li>
            <li>⬜ <b style="color:#7f8c8d;">一般(N)：</b>每收集 10 張，通關獲得代幣 <b>+1</b>🪙！滿五星解鎖專屬短片！</li>
        </ul>
        <div style="margin-top:20px; text-align:center; color:#666; font-size:14px;">✨ 收集貼紙提升能力，讓戰鬥更輕鬆！ ✨</div>
    `;
}

// ========== 彈窗模式用的輔助函數 ==========

function showStickerDetail(stickerId) {
    let s = stickerDB[stickerId];
    if(!s) return;
    let isOwned = window.gachaData.collection.includes(stickerId);
    if(!isOwned) return;
    
    let stars = window.gachaData.stars[stickerId] || 0;
    let assets = getStickerAssets(s);
    let matchedHero = (stickerId < 10) ? heroes[stickerId] : null;
    
    let modal = document.getElementById('sticker-detail-modal');
    if(modal) {
        modal.style.display = 'flex';
        let dImg = document.getElementById('detail-img');
        if(dImg) {
            dImg.src = assets.img;
            dImg.onerror = function() { this.src = FALLBACK_IMAGE; };
        }
        let dTitle = document.getElementById('detail-title');
        let dDesc = document.getElementById('detail-desc');
        let starText = stars > 0 ? `\n\n⭐ 目前星級：${stars} / 5` : "\n\n⭐ 目前星級：0 / 5";
        if(stars >= 5) starText += " (已解鎖專屬短片！)";
        
        if(matchedHero) {
            let is5Star = stars >= 5;
            let s4Text = is5Star ? `4. ${matchedHero.skills[3]} (🌟五星解鎖/限一次)` : `4. 🔒 (滿五星解鎖隱藏招式)`;
            let totalHp = matchedHero.baseHp + (window.hpBuffAmt || 0);
            let totalHints = matchedHero.baseHints + (window.hintBuffAmt || 0);
            if(dTitle) dTitle.innerText = `${matchedHero.name} - ${matchedHero.title}`;
            if(dDesc) dDesc.innerText = `✨ 特色：${matchedHero.feature}\n\n📊 最終能力：\n血量：${totalHp}💖\n提示能力：${totalHints}🪄\n基礎爆擊率：${window.critRate || 5}%💥\n\n⚔️ 招式列表：\n1. ${matchedHero.skills[0]} (傷害 ${matchedHero.baseDmg[0]})\n2. ${matchedHero.skills[1]} (傷害 ${matchedHero.baseDmg[1]})\n3. ${matchedHero.skills[2]} (傷害 ${matchedHero.baseDmg[2]})\n${s4Text}` + starText;
        } else {
            if(dTitle) dTitle.innerText = s.name;
            if(dDesc) dDesc.innerText = (s.desc || "這是一張閃耀著魔法光芒的貼紙！") + starText;
        }
        
        const videoBtn = document.getElementById('play-video-btn'), videoCont = document.getElementById('video-container'), videoElement = document.getElementById('detail-video');
        if(videoBtn && videoCont) {
            if(stars >= 5) {
                videoBtn.style.display = 'inline-block';
                videoCont.style.display = 'none';
                if(videoElement) videoElement.src = matchedHero ? `${matchedHero.folder}/intro.mp4` : assets.vid;
                videoBtn.onclick = () => { videoBtn.style.display = 'none'; videoCont.style.display = 'block'; if(videoElement) videoElement.play().catch(e=>null); };
            } else {
                videoBtn.style.display = 'none';
                videoCont.style.display = 'none';
            }
        }
    }
}

function editWallSlot(index) {
    let pick = prompt(`請輸入要展示的貼紙編號 (例如: SR1, SSR2，輸入 0 取下)`);
    if(pick !== null) {
        if (pick.trim() === '0') {
            window.gachaData.wall[index] = null;
        } else {
            let targetS = stickerDB.find(x => getStickerDisplayId(x).toUpperCase() === pick.trim().toUpperCase());
            if (targetS && enabledStickers.includes(targetS.id) && window.gachaData.collection.includes(targetS.id)) {
                window.gachaData.wall[index] = targetS.id;
            } else {
                alert("這張貼紙尚未獲得，或是編號輸入錯誤/尚未開放喔！");
            }
        }
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
        const modalContent = document.getElementById('lobby-modal-content');
        if (modalContent && document.getElementById('lobby-modal').style.display === 'flex') {
            modalContent.innerHTML = buildWallContent();
        }
        updateLobbyUI();
    }
}

function buyShopItemModal(stickerId, price) {
    if(window.gachaData.dust < price) {
        alert("✨ 星塵不足喔！快去抽轉蛋收集重複的滿星貼紙來兌換吧！");
        return;
    }
    let s = stickerDB.find(x => x.id === stickerId);
    if(!s) return;
    let currentStars = window.gachaData.stars[s.id] || 0;
    let msg = `確定要花費 ${price} ✨ 星塵，將【${s.name}】升級為 ${currentStars + 1} 星嗎？`;
    if(confirm(msg)) {
        window.gachaData.dust -= price;
        window.gachaData.stars[s.id]++;
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
        alert("✅ 升級成功！");
        const modalContent = document.getElementById('lobby-modal-content');
        if (modalContent && document.getElementById('lobby-modal').style.display === 'flex') {
            modalContent.innerHTML = buildShopContent();
        }
        updateLobbyUI();
        checkUnlocks();
        changeHeroSelection(0);
    }
}

function pullGachaModal(times) {
    if(window.gachaData.coins < times * 10) {
        alert("代幣不足！快去打倒魔龍賺取吧！");
        return;
    }
    window.gachaData.coins -= times * 10;
    
    let results = [], totalDust = 0, gotStar = false;
    let dustMap = {'N': 1, 'R': 3, 'SR': 5, 'SSR': 10};
    
    for(let i=0; i<times; i++) {
        let roll = Math.random();
        let rarity = roll < 0.05 ? 'SSR' : (roll < 0.15 ? 'SR' : (roll < 0.40 ? 'R' : 'N'));
        let pool = stickerDB.filter(s => s.rarity === rarity && enabledStickers.includes(s.id));
        if(pool.length === 0) pool = stickerDB.filter(s => s.rarity === 'N' && enabledStickers.includes(s.id));
        if(pool.length === 0) pool = stickerDB.filter(s => enabledStickers.includes(s.id));
        let picked = pool[Math.floor(Math.random() * pool.length)];
        
        if(i === times - 1 && typeof playGachaSound === 'function') playGachaSound(picked.rarity === 'SSR');
        
        if(window.gachaData.collection.includes(picked.id)) {
            window.gachaData.stars[picked.id] = window.gachaData.stars[picked.id] || 0;
            if(window.gachaData.stars[picked.id] < 5) {
                window.gachaData.stars[picked.id]++;
                if(i === times - 1) gotStar = true;
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
    
    let resultHtml = '<div style="display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-bottom:20px; max-height: 300px; overflow-y: auto;">';
    results.forEach(res => {
        let assets = getStickerAssets(res);
        let glowClass = '';
        if(res.rarity === 'SSR') glowClass = 'ssr-glow';
        else if(res.rarity === 'SR') glowClass = 'sr-glow';
        else if(res.rarity === 'R') glowClass = 'r-glow';
        resultHtml += `
            <div class="sticker-card rarity-${res.rarity}" style="width:85px; height:85px;">
                <div class="sticker-id" style="font-size:9px;">${getStickerDisplayId(res)}</div>
                <img src="${assets.img}" class="${glowClass}" onerror="this.src='${FALLBACK_IMAGE}'" style="width:70%;">
                <div class="rarity-badge badge-${res.rarity}" style="font-size:10px;">${res.rarity}</div>
            </div>
        `;
    });
    resultHtml += '</div>';
    
    let msg = `<div style="text-align:center;">抽到了 ${times} 張魔法貼紙！<br>`;
    if(gotStar) msg += `<span style="color:#2ecc71;">⭐ 貼紙星級提升了！</span><br>`;
    if(totalDust > 0) msg += `<span style="color:#e056fd;">✨ 獲得 ${totalDust} 星塵</span><br>`;
    msg += `</div>`;
    
    const modalContent = document.getElementById('lobby-modal-content');
    if (modalContent) {
        modalContent.innerHTML = `
            <div style="text-align:center;">
                ${resultHtml}
                ${msg}
                <button class="big-btn" style="margin-top:20px; padding:10px 30px; font-size:18px;" onclick="refreshGachaModal()">確認</button>
            </div>
        `;
    }
}

function refreshGachaModal() {
    const modalContent = document.getElementById('lobby-modal-content');
    if (modalContent) {
        modalContent.innerHTML = buildGachaContent();
    }
}

function updateLessonsModal(checkbox) {
    if(checkbox.checked) { 
        if(!activeLessons.includes(checkbox.value)) activeLessons.push(checkbox.value); 
    } else { 
        activeLessons = activeLessons.filter(l => l !== checkbox.value); 
        if(activeLessons.length === 0) { 
            alert("至少需要選擇一個單字庫！"); 
            checkbox.checked = true; 
            activeLessons.push(checkbox.value); 
        } 
    }
    localStorage.setItem('activeLessons', JSON.stringify(activeLessons)); 
    buildCurrentWordList();
}

function showLessonWordsModal(lesson) {
    let words = lessonData[lesson];
    if (!words) return;

    let modal = document.getElementById('word-list-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'word-list-modal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9700';
        document.body.appendChild(modal);
    }

    let wordsHtml = words.map(w => `<span style="display:inline-block; background:white; padding:8px 15px; margin:5px; border-radius:10px; border:2px solid #a29bfe; font-weight:bold; color:#2c3e50; font-size:16px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">${w}</span>`).join('');

    modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px; width: 90%; text-align: center; max-height: 80vh; display: flex; flex-direction: column;">
        <button class="close-btn" onclick="document.getElementById('word-list-modal').style.display='none'">X</button>
        <h2 style="color:#8e44ad; margin-bottom: 15px;">📖 ${lesson.toUpperCase()} 單字預覽</h2>
        <div style="overflow-y: auto; padding: 15px; background: #f0f3f4; border-radius: 10px; border: inset 3px #ccc; display: flex; flex-wrap: wrap; justify-content: center;">
            ${wordsHtml}
        </div>
        <button class="big-btn" style="margin-top:20px; background:linear-gradient(180deg, #3498db, #2980b9); border:none;" onclick="document.getElementById('word-list-modal').style.display='none'">關閉預覽</button>
    </div>`;

    modal.style.display = 'flex';
}

function updateLobbyUI() {
    if(typeof calcBuffs === 'function') calcBuffs();
    const coinEl = document.getElementById('lobby-coin-val');
    const dustEl = document.getElementById('lobby-dust-val');
    if(coinEl) coinEl.innerText = window.gachaData.coins;
    if(dustEl) dustEl.innerText = window.gachaData.dust;
    
    const buffPanel = document.getElementById('buff-panel');
    if(buffPanel) {
        buffPanel.innerHTML = `✨ 目前全體加成：血量 +${window.hpBuffAmt || 0}💖 | 爆擊率 ${window.critRate || 5}%💥 | 提示 +${window.hintBuffAmt || 0}🪄 | 額外代幣 +${window.extraCoinsBonus || 0}🪙`;
    }
    
    // 更新大廳內的貼紙圖鑑和牆面
    const grid = document.getElementById('main-sticker-grid');
    if(grid) {
        let enabledOwned = window.gachaData.collection.filter(id => enabledStickers.includes(id)).length;
        document.getElementById('col-progress').innerText = `${enabledOwned} / ${enabledStickers.length}`;
        
        grid.innerHTML = "";
        stickerDB.forEach(s => {
            if(!enabledStickers.includes(s.id)) return;
            let isOwned = window.gachaData.collection.includes(s.id);
            let stars = window.gachaData.stars[s.id] || 0;
            let assets = getStickerAssets(s);
            let card = document.createElement('div');
            card.className = `sticker-card rarity-${s.rarity} ${!isOwned ? 'sticker-locked' : ''}`;
            card.innerHTML = `<div class="sticker-id">${getStickerDisplayId(s)}</div>`;
            if(isOwned) {
                card.innerHTML += `<img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">`;
                if(stars > 0) card.innerHTML += `<div class="card-stars">${'⭐'.repeat(stars)}</div>`;
            } else {
                card.innerHTML += `<div style="font-size:30px; color:#ccc;">?</div>`;
            }
            card.innerHTML += `<div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>`;
            card.onclick = () => { if(isOwned) showStickerDetail(s.id); };
            grid.appendChild(card);
        });
    }
    
    const wallGrid = document.getElementById('display-wall-grid');
    if(wallGrid) {
        wallGrid.innerHTML = "";
        window.gachaData.wall.forEach((slotId, index) => {
            let slot = document.createElement('div'); slot.className = "wall-slot";
            if(slotId !== null && enabledStickers.includes(slotId)) {
                let s = stickerDB[slotId];
                let assets = getStickerAssets(s);
                slot.classList.add(`rarity-${s.rarity}`);
                slot.innerHTML = `<img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}'">`;
            } else {
                slot.innerHTML = `<div style="font-size:40px; color:#ffc1e3;">+</div>`;
            }
            slot.onclick = () => editWallSlot(index);
            wallGrid.appendChild(slot);
        });
    }
}

// ========== 大廳主功能 ==========

function openLobby() {
    updateLobbyUI();
    buildLessonUI();
    buildReportUI();
    const lobby = document.getElementById('gacha-lobby');
    if(lobby) lobby.style.display = 'flex';
    if(typeof bgm !== 'undefined') bgm.pause();
    switchTab('gacha');
}

function closeLobby() {
    const lobby = document.getElementById('gacha-lobby');
    if(lobby) lobby.style.display = 'none';
    checkUnlocks();
    changeHeroSelection(0);
    if(window.shopBgm) { window.shopBgm.pause(); window.shopBgm.currentTime = 0; }
    if(window.gachaBgm) { window.gachaBgm.pause(); window.gachaBgm.currentTime = 0; }
    if(typeof isMusicPlaying !== 'undefined' && isMusicPlaying && typeof bgm !== 'undefined') bgm.play();
}

function switchTab(tabId) {
    if (tabId === 'lessons') { 
        if(typeof verifyParent === 'function' && !verifyParent()) return; 
    }
    if (tabId === 'report') buildReportUI();
    
    const currentVol = typeof bgm !== 'undefined' ? bgm.volume : 0.1;
    if(window.shopBgm) window.shopBgm.volume = currentVol;
    if(window.gachaBgm) window.gachaBgm.volume = currentVol;
    
    if (tabId === 'shop') {
        if(window.gachaBgm) window.gachaBgm.pause();
        if(window.shopBgm) window.shopBgm.play().catch(e=>null);
        buildShopUI();
    } else if (tabId === 'gacha') {
        if(window.shopBgm) window.shopBgm.pause();
        if(window.gachaBgm) window.gachaBgm.play().catch(e=>null);
    } else {
        if(window.shopBgm) window.shopBgm.pause();
        if(window.gachaBgm) window.gachaBgm.pause();
    }

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.lobby-content').forEach(c => c.classList.remove('active'));
    const targetBtn = document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`); 
    if(targetBtn) targetBtn.classList.add('active');
    const tab = document.getElementById('tab-' + tabId); 
    if(tab) tab.classList.add('active');
}

function buildLessonUI() {
    const lcc = document.getElementById('lesson-checkbox-container'); 
    if(!lcc) return;
    lcc.innerHTML = "";
    Object.keys(lessonData).forEach(lesson => {
        let isChecked = activeLessons.includes(lesson) ? "checked" : "";
        lcc.insertAdjacentHTML('beforeend', `
        <div style="display:flex; align-items:center; gap:15px; background:rgba(255,255,255,0.8); padding:10px 20px; border-radius:15px; border:3px solid #ffb6c1; margin-bottom:10px;">
            <input type="checkbox" value="${lesson}" ${isChecked} onchange="updateLessons(this)" style="width:25px; height:25px; accent-color:#f06292; cursor:pointer; flex-shrink: 0;">
            <div onclick="showLessonWords('${lesson}')" style="cursor:pointer; display:flex; flex-grow:1; align-items:center; justify-content: space-between; padding: 5px 0;">
                <div>
                    <span style="font-weight:bold; color:#8e44ad; font-size: 22px;">${lesson.toUpperCase()}</span> 
                    <span style="color:#666; font-size:16px;">(${lessonData[lesson].length} 個單字)</span>
                </div>
                <span style="font-size:24px;" title="查看單字">🔍</span>
            </div>
        </div>`);
    });
}

function showLessonWords(lesson) {
    let words = lessonData[lesson];
    if (!words) return;

    let modal = document.getElementById('word-list-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'word-list-modal';
        modal.className = 'modal-overlay';
        modal.style.zIndex = '9700';
        document.body.appendChild(modal);
    }

    let wordsHtml = words.map(w => `<span style="display:inline-block; background:white; padding:8px 15px; margin:5px; border-radius:10px; border:2px solid #a29bfe; font-weight:bold; color:#2c3e50; font-size:18px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">${w}</span>`).join('');

    modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px; width: 90%; text-align: center; max-height: 80vh; display: flex; flex-direction: column;">
        <button class="close-btn" onclick="document.getElementById('word-list-modal').style.display='none'">X</button>
        <h2 style="color:#8e44ad; margin-bottom: 15px;">📖 ${lesson.toUpperCase()} 單字預覽</h2>
        <div style="overflow-y: auto; padding: 15px; background: #f0f3f4; border-radius: 10px; border: inset 3px #ccc; display: flex; flex-wrap: wrap; justify-content: center;">
            ${wordsHtml}
        </div>
        <button class="big-btn" style="margin-top:20px; background:linear-gradient(180deg, #3498db, #2980b9); border:none;" onclick="document.getElementById('word-list-modal').style.display='none'">關閉預覽</button>
    </div>`;

    modal.style.display = 'flex';
}

function updateLessons(checkbox) {
    if(checkbox.checked) { if(!activeLessons.includes(checkbox.value)) activeLessons.push(checkbox.value); } 
    else { activeLessons = activeLessons.filter(l => l !== checkbox.value); if(activeLessons.length === 0) { alert("至少需要選擇一個單字庫！"); checkbox.checked = true; activeLessons.push(checkbox.value); } }
    localStorage.setItem('activeLessons', JSON.stringify(activeLessons)); buildCurrentWordList();
}

function buildReportUI() {
    const rc = document.getElementById('report-container');
    if(!rc) return;
    let log = window.studyLog || {};
    let arr = Object.keys(log).map(w => {
        let total = log[w].success + log[w].fail;
        let pct = total > 0 ? Math.round((log[w].fail / total) * 100) : 0;
        return { word: w, s: log[w].success, f: log[w].fail, t: total, p: pct };
    });
    arr.sort((a, b) => b.f !== a.f ? b.f - a.f : b.p - a.p);
    
    if(arr.length === 0) { rc.innerHTML = "<div style='text-align:center; color:#aaa; font-size:18px; padding:20px;'>目前還沒有戰鬥紀錄喔！快去打魔龍吧！</div>"; return; }
    let html = `<table style="width:100%; text-align:center; border-collapse: collapse; font-size:18px;"><tr style="background:#ffb6c1; color:white; font-weight:bold;"><th style="padding:10px; border-radius: 10px 0 0 0;">單字</th><th style="padding:10px;">答對 🟢</th><th style="padding:10px;">答錯 🔴</th><th style="padding:10px; border-radius: 0 10px 0 0;">錯誤率 📉</th></tr>`;
    arr.forEach(item => { let errColor = item.p >= 50 || item.f > 3 ? '#e74c3c' : '#555'; html += `<tr style="border-bottom: 1px solid #ffe6f0;"><td style="padding:12px; font-weight:bold; color:#8e44ad; font-size:20px;">${item.word}</td><td style="color:#2ecc71; font-weight:bold;">${item.s}</td><td style="color:${errColor}; font-weight:bold;">${item.f}</td><td style="color:${errColor}; font-weight:bold;">${item.p}%</td></tr>`; });
    html += `</table>`; rc.innerHTML = html;
}

function buildShopUI() {
    let grid = document.getElementById('shop-item-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    let shopPriceMap = {'N':3, 'R':9, 'SR':15, 'SSR':30};
    let sdd = document.getElementById('shop-dust-display');
    if(sdd) sdd.innerText = window.gachaData.dust;
    
    let itemsAdded = 0;

    stickerDB.forEach(s => {
        if(!enabledStickers.includes(s.id)) return;
        let isOwned = window.gachaData.collection.includes(s.id);
        if(!isOwned) return;
        
        itemsAdded++;
        let stars = window.gachaData.stars[s.id] || 0;
        let price = shopPriceMap[s.rarity];
        let isMaxed = stars >= 5;
        let assets = getStickerAssets(s);
        
        let card = document.createElement('div');
        card.className = `sticker-card rarity-${s.rarity} ${isMaxed ? 'sticker-locked' : ''}`;
        card.style.position = 'relative';
        card.innerHTML = `<div class="sticker-id" style="width: auto; padding: 2px 6px; border-radius: 10px; font-size: 13px;">${getStickerDisplayId(s)}</div>`;
        card.innerHTML += `<img src="${assets.img}" onerror="this.src='${FALLBACK_IMAGE}';">`;
        if(stars > 0) card.innerHTML += `<div class="card-stars">${'⭐'.repeat(stars)}</div>`;
        card.innerHTML += `<div class="rarity-badge badge-${s.rarity}">${s.rarity}</div>`;
        
        if(isMaxed) {
            card.innerHTML += `<div style="position:absolute; bottom:5px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:10px; font-size:14px; font-weight:bold; left:50%; transform:translateX(-50%); white-space:nowrap;">已滿星</div>`;
        } else {
            card.innerHTML += `<div style="position:absolute; bottom:5px; background:rgba(255,255,255,0.95); color:#d35400; padding:2px 8px; border-radius:10px; font-size:16px; font-weight:bold; border: 2px solid #fdcb6e; left:50%; transform:translateX(-50%); white-space:nowrap; cursor:pointer;">✨ ${price}</div>`;
            card.onclick = () => buyShopItem(s.id, price);
        }
        grid.appendChild(card);
    });

    if (itemsAdded === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; font-size: 20px; color: #fff; padding: 40px; text-align: center; text-shadow: 1px 1px 3px #000;">寶盒裡空空的喔！先去轉蛋機解鎖一些貼紙吧！</div>`;
    }
}

function buyShopItem(stickerId, price) {
    if(window.gachaData.dust < price) {
        alert("✨ 星塵不足喔！快去抽轉蛋收集重複的滿星貼紙來兌換吧！");
        return;
    }
    
    let s = stickerDB.find(x => x.id === stickerId);
    if(!s) return;
    
    let currentStars = window.gachaData.stars[s.id] || 0;
    let msg = `確定要花費 ${price} ✨ 星塵，將【${s.name}】升級為 ${currentStars + 1} 星嗎？`;
    
    if(confirm(msg)) {
        window.gachaData.dust -= price;
        window.gachaData.stars[s.id]++;
        
        localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
        alert("✅ 升級成功！");
        updateLobbyUI();
        buildShopUI(); 
        checkUnlocks(); 
        changeHeroSelection(0);
    }
}

function createLobbyUI() {
    if(document.getElementById('gacha-lobby')) return; 
    document.body.insertAdjacentHTML('beforeend', `
        <div id="gacha-lobby">
            <div id="rules-modal" class="modal-overlay" style="z-index:9500; display:none;">
                <div class="modal-content" style="max-width: 550px;">
                    <button class="close-btn" onclick="document.getElementById('rules-modal').style.display='none'">X</button>
                    <h2 style="color:#8e44ad; text-align:center; margin-bottom: 5px;">📜 遊戲規則與加成說明</h2>
                    <div style="text-align:center; color:#e74c3c; font-weight:bold; margin-bottom:15px;">基礎爆擊率：5% (爆擊時傷害變為 2 倍💥)</div>
                    <ul style="line-height:1.8; font-size:18px; color:#333; text-align: left; background:#f9f9f9; padding: 15px 25px; border-radius: 10px; border: 2px dashed #ccc;">
                        <li>🌈 <b style="color:#ff4757;">彩色(SSR)：</b>每收集 1 張，全體英雄血量 <b>+1</b>💖。滿五星解鎖「指定招式四 (每局限一次)」與專屬短片！</li>
                        <li>🟪 <b style="color:#8e44ad;">紫色(SR)：</b>每收集 1 張，爆擊率 <b>+1%</b>；該貼紙滿五星再 <b>+1%</b>💥！滿五星解鎖專屬短片！</li>
                        <li>🟨 <b style="color:#f39c12;">金色(R)：</b>每收集 5 張，戰鬥提示次數 <b>+1</b>；滿五星再 <b>+1</b>🪄！滿五星解鎖專屬短片！</li>
                        <li>⬜ <b style="color:#7f8c8d;">一般(N)：</b>每收集 10 張，通關獲得代幣 <b>+1</b>🪙！滿五星解鎖專屬短片！</li>
                    </ul>
                </div>
            </div>

            <div class="lobby-header" style="position:relative;">
                <button onclick="openPoolEditor()" style="position:absolute; left:20px; background:#e74c3c; color:white; border:2px solid #c0392b; padding:8px 15px; border-radius:15px; font-weight:bold; cursor:pointer; box-shadow:0 4px rgba(0,0,0,0.2); z-index:10;">⚙️ 開放設定</button>
                <div style="font-size:28px; font-weight:900; color:#f06292; text-align:center; width:100%;">📔 魔法圖鑑大廳</div>
                <div class="currency-box" style="position:absolute; right:30px;">
                    <span class="currency-coin">🪙 <span id="lobby-coin-val">0</span></span>
                    <span class="currency-dust">✨ <span id="lobby-dust-val">0</span></span>
                    <button class="close-btn" onclick="closeLobby()" style="position:relative; top:0; right:0; margin-left:20px;">X</button>
                </div>
            </div>
            <div id="buff-panel"></div>
            
            <div class="lobby-tabs">
                <button class="tab-btn" onclick="document.getElementById('rules-modal').style.display='flex'" style="background:#fff9c4; color:#d35400; border-color:#f1c40f;">📜 規則</button>
                <button class="tab-btn active" onclick="switchTab('gacha')">🎁 轉蛋機</button>
                <button class="tab-btn" onclick="switchTab('shop')">🏪 星塵商店</button>
                <button class="tab-btn" onclick="switchTab('collection')">📚 所有貼紙</button>
                <button class="tab-btn" onclick="switchTab('wall')">🖼️ 我的展示牆</button>
                <button class="tab-btn" onclick="switchTab('lessons')">📖 單字本</button>
                <button class="tab-btn" onclick="switchTab('report')">📊 學習戰報</button>
            </div>
            
            <div id="tab-gacha" class="lobby-content active" style="padding-bottom: 20px;">
                <div style="display: flex; justify-content: center; width: 100%;">
                    <div id="gacha-container" style="position: relative; width: 100%; max-width: 800px; aspect-ratio: 1 / 1; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); background: #1a1a2e;">
                        <img src="assets/gacha_bg.png" onerror="this.src='${FALLBACK_IMAGE}'" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
                        <div id="gacha-machine-area" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">
                            <img src="assets/Gacha.png" style="position: absolute; top: 26%; left: 47%; transform: translate(-50%, -50%); width: 180px; filter: drop-shadow(0 15px 25px rgba(0,0,0,0.8)); animation: breatheAnim 3s infinite;" onerror="this.src='${FALLBACK_IMAGE}'">
                            <div style="position: absolute; bottom: 8%; left: 0; width: 100%; text-align: center;">
                                <div style="font-size:22px; color:#fff; font-weight:bold; margin-bottom:15px; text-shadow: 0 2px 4px #000, 0 0 10px #000;">每次抽取消耗 10 枚代幣</div>
                                <div class="gacha-btn-group" style="display: flex; justify-content: center; gap: 20px;">
                                    <button class="gacha-pull-btn" onclick="pullGacha(1)" style="box-shadow: 0 6px 15px rgba(0,0,0,0.6);">抽 1 次</button>
                                    <button class="gacha-pull-btn" onclick="pullGacha(5)" style="background: linear-gradient(180deg, #ff6b81, #ff4757); box-shadow: 0 6px 15px rgba(0,0,0,0.6);">抽 5 次</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tab-shop" class="lobby-content">
                <div style="display: flex; justify-content: center; width: 100%; padding-bottom: 20px; padding-top: 20px;">
                    <div id="shop-container" style="position: relative; width: 100%; max-width: 800px; aspect-ratio: 1 / 1; margin: 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.4); background: #1a1a2e;">
                        <img src="assets/shop_bg.png" onerror="this.src='${FALLBACK_IMAGE}'" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
                        <div style="position: absolute; top: 20px; right: 20px; z-index: 2; background: rgba(255,255,255,0.9); backdrop-filter: blur(5px); padding: 10px 25px; border-radius: 30px; font-weight: bold; color: #8e44ad; font-size: 22px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 3px solid #ffb6c1;">
                            ✨ 星塵：<span id="shop-dust-display" style="color:#d35400; font-size:28px;">0</span>
                        </div>
                        <div id="shop-magic-box-container" onclick="openShopMenu()" style="position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%); z-index: 3; cursor: pointer; text-align: center; transition: transform 0.2s;">
                            <div style="color: #fff; text-shadow: 0 2px 4px #000, 0 0 15px #f1c40f; font-weight: bold; font-size: 24px; margin-bottom: 5px; animation: goldPulse 1.5s infinite; white-space: nowrap;">👇 點擊打開星塵寶盒 👇</div>
                            <img id="shop-magic-box" src="assets/shop_box.png" onerror="this.src='${FALLBACK_IMAGE}';" style="width: 200px; filter: drop-shadow(0 15px 20px rgba(0,0,0,0.8)); animation: breatheAnim 2.5s infinite;">
                        </div>
                        <div id="shop-menu-wrapper" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 10; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(8px); flex-direction: column; padding: 20px; box-sizing: border-box;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 10px 20px; background: rgba(255,255,255,0.15); border-radius: 15px; border: 1px solid rgba(255,255,255,0.3);">
                                <div style="font-size: 18px; color: #fff; font-weight: bold; text-shadow: 1px 1px 3px #000;">★ 星塵升星專區：僅販售已解鎖的貼紙 ★</div>
                                <button onclick="closeShopMenu()" style="background: #e74c3c; color: white; border: 3px solid #c0392b; padding: 8px 20px; border-radius: 15px; cursor: pointer; font-weight: bold; font-size: 18px; box-shadow: 0 4px 0 #922b21; transition: 0.2s;">❌ 關閉寶盒</button>
                            </div>
                            <div class="sticker-grid" id="shop-item-grid" style="flex-grow: 1; overflow-y: auto; align-content: flex-start; justify-content: center; padding-right: 10px; margin-bottom: 10px;"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="tab-collection" class="lobby-content">
                <div style="margin-bottom:15px; font-weight:bold; color:#8e44ad;">目前開放收集進度：<span id="col-progress"></span></div>
                <div class="sticker-grid" id="main-sticker-grid"></div>
            </div>
            <div id="tab-wall" class="lobby-content">
                <div style="font-size:20px; font-weight:bold; color:#f06292;">點擊空位，掛上你最自豪的貼紙！</div>
                <div class="wall-grid" id="display-wall-grid"></div>
            </div>
            <div id="tab-lessons" class="lobby-content">
                <div style="font-size:24px; font-weight:bold; color:#8e44ad; margin-bottom:15px;">📖 選擇要練習的單字庫</div>
                <div id="lesson-checkbox-container" style="display:flex; flex-direction:column; gap:10px; font-size:20px; width:100%; max-width:400px;"></div>
            </div>
            <div id="tab-report" class="lobby-content">
                <div style="font-size:24px; font-weight:bold; color:#e74c3c; margin-bottom:15px;">📊 錯字排行榜 (從最常錯開始排)</div>
                <div id="report-container" style="width:100%; max-width:600px; background:white; border-radius:15px; border:3px solid #ffc1e3; padding:15px; overflow-y:auto;"></div>
            </div>
        </div>
        <div id="gacha-animation-screen">
            <div id="gacha-result-container"></div>
            <div id="gacha-msg"></div>
            <button class="big-btn" onclick="closeGachaResult()" style="margin-top:40px;">確認</button>
        </div>
    `);
    
    // 添加進入大廳的按鈕到開始畫面
    let startScreen = document.getElementById('start-screen');
    if(startScreen) {
        let openBtn = document.createElement('button');
        openBtn.innerHTML = "📔 進入大廳 (轉蛋/圖鑑)";
        openBtn.style.cssText = "background: linear-gradient(180deg, #ffd700, #ff8c00); color: white; padding: 15px 40px; border-radius: 50px; font-size: 24px; font-weight: bold; border: 4px solid white; cursor: pointer; margin-top: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); transition: 0.3s;";
        openBtn.onclick = openLobby; 
        startScreen.appendChild(openBtn);
    }
}

function openShopMenu() {
    let box = document.getElementById('shop-magic-box-container');
    let menu = document.getElementById('shop-menu-wrapper');
    if(box && menu) {
        box.style.display = 'none';
        menu.style.display = 'flex'; 
        menu.style.animation = 'bounceIn 0.3s ease-out forwards';
    }
}

function closeShopMenu() {
    let box = document.getElementById('shop-magic-box-container');
    let menu = document.getElementById('shop-menu-wrapper');
    if(box && menu) {
        menu.style.display = 'none';
        box.style.display = 'block';
    }
}

function pullGacha(times) {
    if(window.gachaData.coins < times * 10) return alert("代幣不足！快去打倒魔龍賺取吧！");
    window.gachaData.coins -= times * 10;
    
    let results = [], totalDust = 0, gotStar = false;
    let dustMap = {'N': 1, 'R': 3, 'SR': 5, 'SSR': 10}; 
    
    for(let i=0; i<times; i++) {
        let roll = Math.random();
        let rarity = roll < 0.05 ? 'SSR' : (roll < 0.15 ? 'SR' : (roll < 0.40 ? 'R' : 'N'));
        
        let pool = stickerDB.filter(s => s.rarity === rarity && enabledStickers.includes(s.id));
        if(pool.length === 0) pool = stickerDB.filter(s => s.rarity === 'N' && enabledStickers.includes(s.id));
        if(pool.length === 0) pool = stickerDB.filter(s => enabledStickers.includes(s.id));
        
        let picked = pool[Math.floor(Math.random() * pool.length)];
        
        if(i === times - 1 && typeof playGachaSound === 'function') playGachaSound(picked.rarity === 'SSR');
        
        if(window.gachaData.collection.includes(picked.id)) {
            window.gachaData.stars[picked.id] = window.gachaData.stars[picked.id] || 0;
            if(window.gachaData.stars[picked.id] < 5) { 
                window.gachaData.stars[picked.id]++; 
                if(i === times - 1) gotStar = true; 
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
    
    let animScreen = document.getElementById('gacha-animation-screen'), resContainer = document.getElementById('gacha-result-container'), msg = document.getElementById('gacha-msg');
    
    if(animScreen && resContainer && msg) {
        animScreen.style.display = 'flex'; resContainer.innerHTML = ""; 
        results.forEach((res, idx) => {
            let delay = idx * 0.15; 
            let imgSrc = getStickerAssets(res).img; 
            
            let glowClass = '';
            if(res.rarity === 'SSR') glowClass = 'ssr-glow';
            else if(res.rarity === 'SR') glowClass = 'sr-glow';
            else if(res.rarity === 'R') glowClass = 'r-glow';
            
            let cardHTML = `<div class="sticker-card rarity-${res.rarity} gacha-pop-card show-gacha-multi" style="animation-delay: ${delay}s"><div class="sticker-id" style="width: auto; padding: 2px 6px; border-radius: 10px; font-size: 13px;">${getStickerDisplayId(res)}</div><img src="${imgSrc}" class="${glowClass}" onerror="this.src='${FALLBACK_IMAGE}';"><div class="rarity-badge badge-${res.rarity}">${res.rarity}</div></div>`;
            resContainer.insertAdjacentHTML('beforeend', cardHTML);
        });
        
        msg.innerHTML = times > 1 ? `抽到了 ${times} 張魔法貼紙！<br>` : `抽到了 <span style="color:#ffd700;">${results[0].name}</span>！<br>`;
        if(gotStar) msg.innerHTML += `<span style="color:#2ecc71; font-size:20px;">⭐ 貼紙星級提升了！</span><br>`;
        if(totalDust > 0) msg.innerHTML += `<span style="color:#e056fd; font-size:18px;">滿星重複貼紙轉換為 ${totalDust} ✨ 星塵</span>`;
    }
}

function closeGachaResult() { let animScreen = document.getElementById('gacha-animation-screen'); if(animScreen) animScreen.style.display = 'none'; }

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    createLobbyUI();
    checkUnlocks();
    changeHeroSelection(0);
    updateLobbyUI();
});