// cloudsave.js - 雲端存檔功能 (多存檔槽版)

const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbyHqMyyHbR2OrTOZ2qQtECKLyJAd29Bgj6ftSC1JomtxzmPBn7TNFSkxl8GlfpoglZE9g/exec';

// ============================================
// 存檔槽管理
// ============================================

let currentSlot = 1;  // 目前選中的存檔槽 (1, 2, 3)

// 存檔槽的雲端 Key
function getSlotKey(slot) {
    return `slot_${slot}`;
}

// 取得所有存檔槽的資訊（從 localStorage 讀取快取）
function getSlotInfo(slot) {
    const saved = localStorage.getItem(`slot_${slot}_info`);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch(e) {}
    }
    return { name: `存檔 ${slot}`, lastSaveTime: null, hasData: false };
}

// 儲存存檔槽資訊到 localStorage 快取
function saveSlotInfo(slot, info) {
    localStorage.setItem(`slot_${slot}_info`, JSON.stringify(info));
}

// 更新 UI 顯示三個存檔槽的狀態
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

// 清除目前選中的雲端存檔
async function clearCurrentSlot() {
    const info = getSlotInfo(currentSlot);
    if (!info.hasData) {
        showCloudNotification(`「${info.name}」已經是空的`, true);
        return;
    }
    
    if (confirm(`確定要清除「${info.name}」的雲端存檔嗎？\n這個動作無法復原！`)) {
        const playerId = `${getSlotKey(currentSlot)}_${info.name}`;
        
        showCloudNotification(`🗑️ 正在清除「${info.name}」...`);
        
        try {
            // 儲存空的資料到雲端
            const emptyData = {
                gachaData: { coins: 0, dust: 0, collection: [0, 1], stars: {0:0, 1:0} },
                activeLessons: ['lesson1'],
                deviceInfo: navigator.userAgent,
                saveTime: new Date().toISOString()
            };
            
            await jsonpRequest({
                action: 'save',
                playerId: playerId,
                data: JSON.stringify(emptyData)
            });
            
            // 清除本地快取
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
// 語音說出訊息
// ============================================

function speakMessage(message) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.0;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
}

// ============================================
// 顯示通知訊息
// ============================================

function showCloudNotification(message, isError = false) {
    const notificationArea = document.getElementById('cloud-notification-area');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = 'cloud-notification';
    notification.style.backgroundColor = isError ? '#e74c3c' : '#27ae60';
    notification.innerText = message;
    
    while (notificationArea.firstChild) {
        notificationArea.removeChild(notificationArea.firstChild);
    }
    
    notificationArea.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode === notificationArea) {
            notification.remove();
        }
    }, 3000);
}

// ============================================
// JSONP 請求輔助函數
// ============================================

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
// 儲存到雲端（使用目前選中的存檔槽）
// ============================================

async function syncToCloud() {
    const info = getSlotInfo(currentSlot);
    const playerId = `${getSlotKey(currentSlot)}_${info.name}`;
    
    const saveData = {
        gachaData: window.gachaData,
        activeLessons: activeLessons,
        deviceInfo: navigator.userAgent,
        saveTime: new Date().toISOString()
    };
    
    showCloudNotification(`☁️ 正在儲存到「${info.name}」...`);
    
    try {
        const result = await jsonpRequest({
            action: 'save',
            playerId: playerId,
            data: JSON.stringify(saveData)
        });
        
        if (result && result.success) {
            // 更新本地快取
            info.hasData = true;
            info.lastSaveTime = new Date().toISOString();
            saveSlotInfo(currentSlot, info);
            updateSlotUI();
            
            showCloudNotification(`✅ 已儲存到「${info.name}」`);
            speakMessage(`儲存到，${info.name}，成功`);
            return true;
        } else {
            showCloudNotification('⚠️ ' + (result?.error || '儲存失敗'), true);
            speakMessage('儲存失敗');
            return false;
        }
    } catch(error) {
        console.error('雲端存檔失敗:', error);
        showCloudNotification('⚠️ 儲存失敗，請檢查網路', true);
        speakMessage('儲存失敗');
        return false;
    }
}

// ============================================
// 從雲端讀取（使用目前選中的存檔槽）
// ============================================

async function syncFromCloud() {
    const info = getSlotInfo(currentSlot);
    const playerId = `${getSlotKey(currentSlot)}_${info.name}`;
    
    showCloudNotification(`☁️ 正在從「${info.name}」讀取...`);
    
    try {
        const result = await jsonpRequest({
            action: 'load',
            playerId: playerId
        });
        
        if (result && result.success && result.data) {
            const saveTime = result.lastSaveTime ? new Date(result.lastSaveTime).toLocaleString() : '未知';
            
            // 檢查是否是空存檔
            const isEmpty = !result.data.gachaData || 
                           (result.data.gachaData.coins === 0 && 
                            (!result.data.gachaData.collection || result.data.gachaData.collection.length <= 2));
            
            if (isEmpty) {
                showCloudNotification(`「${info.name}」目前沒有存檔資料`, true);
                speakMessage(`${info.name}，沒有存檔資料`);
                return false;
            }
            
            if (confirm(`找到「${info.name}」的雲端存檔！\n最後儲存時間：${saveTime}\n\n要覆蓋目前的進度嗎？`)) {
                if (result.data.gachaData) {
                    window.gachaData = result.data.gachaData;
                    localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
                }
                
                if (result.data.activeLessons) {
                    activeLessons = result.data.activeLessons;
                    localStorage.setItem('activeLessons', JSON.stringify(activeLessons));
                    if (typeof buildCurrentWordList === 'function') {
                        buildCurrentWordList();
                    }
                }
                
                // 更新本地快取
                info.hasData = true;
                info.lastSaveTime = result.lastSaveTime;
                saveSlotInfo(currentSlot, info);
                updateSlotUI();
                
                showCloudNotification(`✅ 已從「${info.name}」讀取成功！請重新整理頁面。`);
                speakMessage(`讀取，${info.name}，成功`);
                setTimeout(() => location.reload(), 1500);
                return true;
            }
        } else {
            showCloudNotification(`「${info.name}」沒有找到雲端存檔`, true);
            speakMessage(`${info.name}，沒有找到存檔`);
            return false;
        }
    } catch(error) {
        console.error('雲端讀取失敗:', error);
        showCloudNotification('⚠️ 讀取失敗', true);
        speakMessage('讀取失敗');
        return false;
    }
}

// ============================================
// 綁定按鈕事件
// ============================================

function bindCloudButtons() {
    const saveBtn = document.getElementById('cloud-save-btn');
    const loadBtn = document.getElementById('cloud-load-btn');
    const renameBtn = document.getElementById('rename-slot-btn');
    const clearBtn = document.getElementById('clear-slot-btn');
    
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.onclick = (e) => { e.stopPropagation(); syncToCloud(); };
    }
    
    if (loadBtn) {
        const newLoadBtn = loadBtn.cloneNode(true);
        loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
        newLoadBtn.onclick = (e) => { e.stopPropagation(); syncFromCloud(); };
    }
    
    if (renameBtn) {
        const newRenameBtn = renameBtn.cloneNode(true);
        renameBtn.parentNode.replaceChild(newRenameBtn, renameBtn);
        newRenameBtn.onclick = (e) => { e.stopPropagation(); renameCurrentSlot(); };
    }
    
    if (clearBtn) {
        const newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
        newClearBtn.onclick = (e) => { e.stopPropagation(); clearCurrentSlot(); };
    }
}

// ============================================
// 注入雲端存檔 UI
// ============================================

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
        <div style="font-size:18px; color:#2980b9; font-weight:bold; margin-bottom:10px;">☁️ 雲端存檔專區</div>
        
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
            <button id="cloud-save-btn" class="option-btn" style="background:#3498db; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">💾 儲存到目前選中的存檔</button>
            <button id="cloud-load-btn" class="option-btn" style="background:#2ecc71; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">📂 從目前選中的存檔讀取</button>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button id="rename-slot-btn" class="option-btn" style="background:#f39c12; color:white; border:none; flex:1; padding: 8px; cursor:pointer; font-size:13px;">✏️ 重新命名存檔</button>
            <button id="clear-slot-btn" class="option-btn" style="background:#e74c3c; color:white; border:none; flex:1; padding: 8px; cursor:pointer; font-size:13px;">🗑️ 清除存檔</button>
        </div>
        
        <div id="cloud-notification-area" style="min-height: 40px;"></div>
        <div style="font-size: 11px; color: #555; text-align: center;">💡 點擊存檔卡片可以切換目前選中的存檔槽</div>
    `;
    
    if (musicBtn && musicBtn.parentNode) {
        musicBtn.parentNode.insertBefore(cloudSection, musicBtn.nextSibling);
    } else {
        settingsContent.insertBefore(cloudSection, settingsContent.firstChild);
    }
    
    // 綁定點擊事件
    document.getElementById('slot1-card')?.addEventListener('click', () => selectSlot(1));
    document.getElementById('slot2-card')?.addEventListener('click', () => selectSlot(2));
    document.getElementById('slot3-card')?.addEventListener('click', () => selectSlot(3));
    
    bindCloudButtons();
    updateSlotUI();
    
    return true;
}

let injectionAttempts = 0;
const MAX_ATTEMPTS = 30;

function waitForSettingsModal() {
    if (injectionAttempts >= MAX_ATTEMPTS) return;
    injectionAttempts++;
    if (injectCloudUI()) return;
    setTimeout(waitForSettingsModal, 500);
}

function initCloudSave() {
    if (document.querySelector('#settings-modal .modal-content')) {
        injectCloudUI();
    } else {
        waitForSettingsModal();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSave);
} else {
    initCloudSave();
}