// cloudsave.js - 雲端存檔功能 (多存檔槽安全升級版)

const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbyHqMyyHbR2OrTOZ2qQtECKLyJAd29Bgj6ftSC1JomtxzmPBn7TNFSkxl8GlfpoglZE9g/exec';

// ============================================
// 安全同步碼 (Sync Code) 管理
// ============================================
// 自動產生或讀取裝置專屬的 6 碼同步碼，避免存檔被隨意覆蓋，同時方便跨裝置讀取
let deviceSyncCode = localStorage.getItem('rpg_sync_code');
if (!deviceSyncCode) {
    deviceSyncCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('rpg_sync_code', deviceSyncCode);
}

// ============================================
// 存檔槽管理
// ============================================
let currentSlot = 1;

// 取得所有存檔槽的資訊（從 localStorage 讀取快取）
function getSlotInfo(slot) {
    const saved = localStorage.getItem(`slot_${slot}_info`);
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return { name: `存檔 ${slot}`, lastSaveTime: null, hasData: false };
}

// 儲存存檔槽資訊到 localStorage 快取
function saveSlotInfo(slot, info) {
    localStorage.setItem(`slot_${slot}_info`, JSON.stringify(info));
}

// 更新 UI 顯示
function updateSlotUI() {
    for (let i = 1; i <= 3; i++) {
        const info = getSlotInfo(i);
        const nameEl = document.getElementById(`slot${i}-name`);
        const timeEl = document.getElementById(`slot${i}-time`);
        const cardEl = document.getElementById(`slot${i}-card`);
        
        if (nameEl) {
            nameEl.innerText = info.name || `存檔 ${i}`;
            nameEl.style.color = info.hasData ? '#2c3e50' : '#888';
        }
        if (timeEl && info.lastSaveTime) {
            const date = new Date(info.lastSaveTime);
            timeEl.innerText = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
            timeEl.style.color = '#27ae60';
        } else if (timeEl) {
            timeEl.innerText = '未使用';
            timeEl.style.color = '#aaa';
        }
        if (cardEl) {
            if (currentSlot === i) {
                cardEl.style.border = '3px solid #3498db';
                cardEl.style.background = '#ebf5fb';
            } else {
                cardEl.style.border = '2px solid #ddd';
                cardEl.style.background = 'white';
            }
        }
    }
    
    const selectedText = document.getElementById('selected-slot-text');
    if (selectedText) {
        const info = getSlotInfo(currentSlot);
        selectedText.innerText = info.name || `存檔 ${currentSlot}`;
    }
}

// 選擇存檔槽
function selectSlot(slot) {
    if (slot < 1 || slot > 3) return;
    currentSlot = slot;
    updateSlotUI();
    showCloudNotification(`已切換到 ${getSlotInfo(slot).name || `存檔 ${slot}`}`);
}

// 重新命名目前選中的存檔槽
function renameCurrentSlot() {
    const info = getSlotInfo(currentSlot);
    const newName = prompt(`請輸入「${info.name || `存檔 ${currentSlot}`}」的新名稱：`, info.name || `存檔 ${currentSlot}`);
    if (newName && newName.trim()) {
        info.name = newName.trim();
        saveSlotInfo(currentSlot, info);
        updateSlotUI();
        showCloudNotification(`✅ 已更名為「${newName.trim()}」`);
        speakMessage(`已更名為，${newName.trim()}`);
    }
}

// 手動更新同步碼 (用於跨裝置)
function updateSyncCode() {
    const input = document.getElementById('sync-code-input');
    if (input && input.value.trim()) {
        deviceSyncCode = input.value.trim().toUpperCase();
        localStorage.setItem('rpg_sync_code', deviceSyncCode);
        showCloudNotification(`🔗 同步碼已更新為 ${deviceSyncCode}`);
    }
}

// 清除目前選中的雲端存檔
async function clearCurrentSlot() {
    const info = getSlotInfo(currentSlot);
    if (!info.hasData) {
        showCloudNotification(`「${info.name}」已經是空的`, true);
        return;
    }
    
    if (confirm(`確定要清除「${info.name}」的雲端存檔嗎？\n這個動作無法復原！`)) {
        // 使用新的安全 ID
        const securePlayerId = `${deviceSyncCode}_slot_${currentSlot}`;
        
        showCloudNotification(`🗑️ 正在清除「${info.name}」...`);
        
        try {
            // 加入明確的 isEmpty 標記，解決空檔誤判 bug
            const emptyData = {
                isEmpty: true,
                gachaData: { coins: 0, dust: 0, collection: [0, 1], stars: {0:0, 1:0} },
                activeLessons: ['lesson1'],
                deviceInfo: navigator.userAgent,
                saveTime: new Date().toISOString()
            };
            
            await jsonpRequest({
                action: 'save',
                playerId: securePlayerId,
                data: JSON.stringify(emptyData)
            });
            
            info.hasData = false;
            info.lastSaveTime = null;
            saveSlotInfo(currentSlot, info);
            updateSlotUI();
            
            showCloudNotification(`✅ 「${info.name}」已清除`);
            speakMessage(`已清除，${info.name}`);
        } catch(error) {
            showCloudNotification('⚠️ 清除失敗', true);
        }
    }
}

// ============================================
// 語音與通知 UI 輔助
// ============================================
function speakMessage(message) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.0;
    utterance.pitch = 1.2;
    window.speechSynthesis.speak(utterance);
}

function showCloudNotification(message, isError = false) {
    const notificationArea = document.getElementById('cloud-notification-area');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = 'cloud-notification';
    notification.style.cssText = `background-color: ${isError ? '#e74c3c' : '#27ae60'}; color: white; padding: 5px 10px; border-radius: 5px; margin-top: 5px; text-align: center; font-size: 14px;`;
    notification.innerText = message;
    
    notificationArea.innerHTML = ''; // 快速清空舊通知
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode === notificationArea) {
            notification.remove();
        }
    }, 3000);
}

function jsonpRequest(params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const script = document.createElement('script');
        let timeoutId;
        
        window[callbackName] = (response) => {
            delete window[callbackName];
            if (document.body.contains(script)) document.body.removeChild(script);
            clearTimeout(timeoutId);
            resolve(response);
        };
        
        let url = CLOUD_API_URL + '?callback=' + callbackName;
        for (let key in params) {
            url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }
        
        timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (document.body.contains(script)) document.body.removeChild(script);
                reject(new Error('請求超時'));
            }
        }, 15000);
        
        script.src = url;
        document.body.appendChild(script);
    });
}

// ============================================
// 儲存與讀取 (核心邏輯)
// ============================================
async function syncToCloud() {
    const info = getSlotInfo(currentSlot);
    // 統一使用新的安全防護 ID
    const securePlayerId = `${deviceSyncCode}_slot_${currentSlot}`;
    
    const saveData = {
        isEmpty: false, // 明確標記此存檔有資料
        gachaData: window.gachaData || { coins: 0, dust: 0, collection: [], stars: {} },
        activeLessons: typeof activeLessons !== 'undefined' ? activeLessons : ['lesson1'],
        deviceInfo: navigator.userAgent,
        saveTime: new Date().toISOString()
    };
    
    showCloudNotification(`☁️ 正在儲存到「${info.name}」...`);
    
    try {
        const result = await jsonpRequest({
            action: 'save',
            playerId: securePlayerId,
            data: JSON.stringify(saveData)
        });
        
        if (result && result.success) {
            info.hasData = true;
            info.lastSaveTime = saveData.saveTime;
            saveSlotInfo(currentSlot, info);
            updateSlotUI();
            
            showCloudNotification(`✅ 已安全儲存到「${info.name}」`);
            speakMessage(`儲存到，${info.name}，成功`);
        } else {
            showCloudNotification('⚠️ ' + (result?.error || '儲存失敗'), true);
        }
    } catch(error) {
        showCloudNotification('⚠️ 儲存失敗，請檢查網路', true);
    }
}

async function syncFromCloud() {
    const info = getSlotInfo(currentSlot);
    const securePlayerId = `${deviceSyncCode}_slot_${currentSlot}`;
    // ⚠️ 舊存檔繼承機制：這是小朋友原本舊存檔的 ID 格式
    const legacyPlayerId = `slot_${currentSlot}_${info.name}`;
    
    showCloudNotification(`☁️ 正在從「${info.name}」讀取...`);
    
    try {
        // 先嘗試讀取新版安全 ID
        let result = await jsonpRequest({ action: 'load', playerId: securePlayerId });
        let isLegacy = false;

        // 如果新版找不到資料，啟動「舊存檔救援機制」！
        if (!result || !result.success || !result.data) {
            console.log("嘗試尋找舊版存檔...");
            let legacyResult = await jsonpRequest({ action: 'load', playerId: legacyPlayerId });
            if (legacyResult && legacyResult.success && legacyResult.data) {
                result = legacyResult;
                isLegacy = true; // 標記為舊存檔，稍後可以自動轉移
            }
        }
        
        if (result && result.success && result.data) {
            // 使用新版的 isEmpty 標記精準判斷
            if (result.data.isEmpty) {
                showCloudNotification(`「${info.name}」目前是空存檔`, true);
                speakMessage(`${info.name}，沒有存檔資料`);
                return false;
            }
            
            const saveTime = result.lastSaveTime ? new Date(result.lastSaveTime).toLocaleString() : '未知';
            let confirmMsg = `找到「${info.name}」的雲端存檔！\n最後儲存時間：${saveTime}\n\n要覆蓋目前的進度嗎？`;
            if (isLegacy) confirmMsg = `(舊存檔繼承) ` + confirmMsg;

            if (confirm(confirmMsg)) {
                if (result.data.gachaData) {
                    window.gachaData = result.data.gachaData;
                    localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
                }
                if (result.data.activeLessons) {
                    // 若有全域變數 activeLessons 則更新
                    if (typeof activeLessons !== 'undefined') {
                        window.activeLessons = result.data.activeLessons;
                    }
                    localStorage.setItem('activeLessons', JSON.stringify(result.data.activeLessons));
                    if (typeof buildCurrentWordList === 'function') buildCurrentWordList();
                }
                
                info.hasData = true;
                info.lastSaveTime = result.lastSaveTime;
                saveSlotInfo(currentSlot, info);
                updateSlotUI();
                
                showCloudNotification(`✅ 已從「${info.name}」讀取成功！即將重新整理...`);
                speakMessage(`讀取成功`);
                
                // 如果是從舊版繼承來的，順手幫他備份一份到新版安全 ID 裡
                if (isLegacy) {
                    await syncToCloud(); 
                }

                setTimeout(() => location.reload(), 1500);
            }
        } else {
            showCloudNotification(`「${info.name}」沒有找到雲端存檔`, true);
            speakMessage(`${info.name}，沒有找到存檔`);
        }
    } catch(error) {
        showCloudNotification('⚠️ 讀取失敗，請檢查網路', true);
    }
}

// ============================================
// UI 注入與事件綁定 (移除 Polling 輪詢)
// ============================================
function bindCloudButtons() {
    // 拋棄 cloneNode 的反模式，直接用 .onclick 覆寫，乾淨且不會重複觸發
    const saveBtn = document.getElementById('cloud-save-btn');
    if (saveBtn) saveBtn.onclick = (e) => { e.stopPropagation(); syncToCloud(); };
    
    const loadBtn = document.getElementById('cloud-load-btn');
    if (loadBtn) loadBtn.onclick = (e) => { e.stopPropagation(); syncFromCloud(); };
    
    const renameBtn = document.getElementById('rename-slot-btn');
    if (renameBtn) renameBtn.onclick = (e) => { e.stopPropagation(); renameCurrentSlot(); };
    
    const clearBtn = document.getElementById('clear-slot-btn');
    if (clearBtn) clearBtn.onclick = (e) => { e.stopPropagation(); clearCurrentSlot(); };

    const updateSyncBtn = document.getElementById('update-sync-btn');
    if (updateSyncBtn) updateSyncBtn.onclick = (e) => { e.stopPropagation(); updateSyncCode(); };
}

function injectCloudUI() {
    if (document.getElementById('cloud-sync-section')) {
        bindCloudButtons();
        updateSlotUI();
        return true;
    }
    
    const settingsContent = document.querySelector('#settings-modal .modal-content');
    if (!settingsContent) return false;
    
    const musicBtn = document.getElementById('bgm-toggle-settings');
    
    const cloudSection = document.createElement('div');
    cloudSection.id = 'cloud-sync-section';
    cloudSection.style.cssText = 'background:#e8f4fd; padding:15px; border-radius:15px; margin-bottom:20px; border:2px solid #3498db;';
    cloudSection.innerHTML = `
        <div style="font-size:18px; color:#2980b9; font-weight:bold; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>☁️ 雲端存檔專區</span>
            <div style="font-size:12px; font-weight:normal; background:#fff; padding:3px 8px; border-radius:5px; border:1px solid #bce8f1;">
                🔗 同步碼: <input type="text" id="sync-code-input" value="${deviceSyncCode}" style="width:60px; border:none; font-weight:bold; color:#e67e22; text-transform:uppercase;" maxlength="6">
                <button id="update-sync-btn" style="cursor:pointer; border:none; background:#3498db; color:white; border-radius:3px; padding:2px 5px;">更新</button>
            </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <div id="slot1-card" style="flex:1; background:white; border-radius:10px; padding:8px; text-align:center; border:2px solid #ddd; cursor:pointer;">
                <div style="font-weight:bold;">📁 存檔 1</div>
                <div id="slot1-name" style="font-size:12px; color:#888;">未使用</div>
                <div id="slot1-time" style="font-size:10px; color:#aaa;"></div>
            </div>
            <div id="slot2-card" style="flex:1; background:white; border-radius:10px; padding:8px; text-align:center; border:2px solid #ddd; cursor:pointer;">
                <div style="font-weight:bold;">📁 存檔 2</div>
                <div id="slot2-name" style="font-size:12px; color:#888;">未使用</div>
                <div id="slot2-time" style="font-size:10px; color:#aaa;"></div>
            </div>
            <div id="slot3-card" style="flex:1; background:white; border-radius:10px; padding:8px; text-align:center; border:2px solid #ddd; cursor:pointer;">
                <div style="font-weight:bold;">📁 存檔 3</div>
                <div id="slot3-name" style="font-size:12px; color:#888;">未使用</div>
                <div id="slot3-time" style="font-size:10px; color:#aaa;"></div>
            </div>
        </div>
        
        <div id="selected-slot-display" style="background:#d4e6f1; border-radius:10px; padding:5px 10px; margin-bottom:10px; font-size:13px; text-align:center;">
            📍 目前選中：<span id="selected-slot-text">存檔 1</span>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button id="cloud-save-btn" class="option-btn" style="background:#3498db; color:white; border:none; flex:1; padding: 10px; cursor:pointer; border-radius:5px;">💾 儲存</button>
            <button id="cloud-load-btn" class="option-btn" style="background:#2ecc71; color:white; border:none; flex:1; padding: 10px; cursor:pointer; border-radius:5px;">📂 讀取</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button id="rename-slot-btn" class="option-btn" style="background:#f39c12; color:white; border:none; flex:1; padding: 8px; cursor:pointer; font-size:13px; border-radius:5px;">✏️ 重新命名</button>
            <button id="clear-slot-btn" class="option-btn" style="background:#e74c3c; color:white; border:none; flex:1; padding: 8px; cursor:pointer; font-size:13px; border-radius:5px;">🗑️ 清除存檔</button>
        </div>
        
        <div id="cloud-notification-area" style="min-height: 40px;"></div>
        <div style="font-size: 11px; color: #555; text-align: center;">💡 若要在其他平板遊玩，請輸入相同的「同步碼」再按讀取。</div>
    `;
    
    if (musicBtn && musicBtn.parentNode) {
        musicBtn.parentNode.insertBefore(cloudSection, musicBtn.nextSibling);
    } else {
        settingsContent.insertBefore(cloudSection, settingsContent.firstChild);
    }
    
    // 綁定卡片點擊事件
    document.getElementById('slot1-card')?.addEventListener('click', () => selectSlot(1));
    document.getElementById('slot2-card')?.addEventListener('click', () => selectSlot(2));
    document.getElementById('slot3-card')?.addEventListener('click', () => selectSlot(3));
    
    bindCloudButtons();
    updateSlotUI();
    return true;
}

// 使用 MutationObserver 監聽 DOM，取代耗效能的輪詢 (Polling)
function initCloudSave() {
    if (injectCloudUI()) return; // 若元素已存在則直接注入
    
    // 若設定區塊是由其他 JS 動態生成的，這個觀察者會在它出現的瞬間自動掛載 UI
    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector('#settings-modal .modal-content')) {
            injectCloudUI();
            obs.disconnect(); // 成功注入後就停止監聽，節省效能
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSave);
} else {
    initCloudSave();
}