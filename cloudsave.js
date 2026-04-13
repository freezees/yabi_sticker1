// cloudsave.js - 雲端存檔功能 (語音通知版)

const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbyHqMyyHbR2OrTOZ2qQtECKLyJAd29Bgj6ftSC1JomtxzmPBn7TNFSkxl8GlfpoglZE9g/exec';

// ============================================
// 語音說出訊息（不用音效檔案）
// ============================================

function speakMessage(message) {
    // 停止任何正在進行的語音
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.0;
    utterance.pitch = 1.2;
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

// ============================================
// 在設定選單內顯示通知訊息
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
// 產生或取得玩家唯一 ID
// ============================================

function getPlayerId() {
    let playerId = localStorage.getItem('cloud_playerId');
    
    if (!playerId) {
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('cloud_playerId', playerId);
        
        setTimeout(() => {
            const customName = prompt('✨ 歡迎！請輸入你的名字（用於雲端存檔）：', '勇者');
            if (customName && customName.trim()) {
                playerId = customName.trim() + '_' + Date.now();
                localStorage.setItem('cloud_playerId', playerId);
                showCloudNotification(`✅ 已設定玩家名稱：${customName}`);
                speakMessage(`歡迎，${customName}`);
            }
        }, 500);
    }
    
    return playerId;
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
// 儲存到雲端
// ============================================

async function syncToCloud() {
    const playerId = getPlayerId();
    
    const saveData = {
        gachaData: window.gachaData,
        activeLessons: activeLessons,
        deviceInfo: navigator.userAgent,
        saveTime: new Date().toISOString()
    };
    
    showCloudNotification('☁️ 正在儲存到雲端...');
    
    try {
        const result = await jsonpRequest({
            action: 'save',
            playerId: playerId,
            data: JSON.stringify(saveData)
        });
        
        if (result && result.success) {
            localStorage.setItem('cloud_last_save', Date.now().toString());
            showCloudNotification('✅ 雲端存檔成功！');
            speakMessage('儲存成功');
            return true;
        } else {
            showCloudNotification('⚠️ ' + (result?.error || '雲端存檔失敗'), true);
            speakMessage('儲存失敗');
            return false;
        }
    } catch(error) {
        console.error('雲端存檔失敗:', error);
        showCloudNotification('⚠️ 雲端存檔失敗，請檢查網路', true);
        speakMessage('儲存失敗，請檢查網路');
        return false;
    }
}

// ============================================
// 從雲端讀取
// ============================================

async function syncFromCloud() {
    const playerId = getPlayerId();
    showCloudNotification('☁️ 正在從雲端讀取...');
    
    try {
        const result = await jsonpRequest({
            action: 'load',
            playerId: playerId
        });
        
        if (result && result.success && result.data) {
            const saveTime = result.lastSaveTime ? new Date(result.lastSaveTime).toLocaleString() : '未知';
            
            if (confirm(`找到雲端存檔！\n最後儲存時間：${saveTime}\n\n要覆蓋目前的進度嗎？`)) {
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
                
                showCloudNotification('✅ 雲端讀取成功！請重新整理頁面。');
                speakMessage('讀取成功');
                setTimeout(() => location.reload(), 1500);
                return true;
            } else {
                showCloudNotification('已取消載入雲端存檔');
                return false;
            }
        } else {
            showCloudNotification('⚠️ ' + (result?.error || '沒有找到雲端存檔'), true);
            speakMessage('沒有找到雲端存檔');
            return false;
        }
    } catch(error) {
        console.error('雲端讀取失敗:', error);
        showCloudNotification('⚠️ 雲端讀取失敗', true);
        speakMessage('讀取失敗');
        return false;
    }
}

// ============================================
// 在設定頁面中加入雲端按鈕
// ============================================

function injectCloudButtons() {
    if (document.getElementById('cloud-save-btn') && document.getElementById('cloud-save-btn').onclick) {
        return true;
    }
    
    const settingsContent = document.querySelector('#settings-modal .modal-content');
    if (!settingsContent) {
        return false;
    }
    
    let cloudSection = document.getElementById('cloud-sync-section');
    if (!cloudSection) {
        const musicBtn = document.getElementById('bgm-toggle-settings');
        
        cloudSection = document.createElement('div');
        cloudSection.id = 'cloud-sync-section';
        cloudSection.style.cssText = 'background:#e8f4fd; padding:15px; border-radius:15px; margin-bottom:20px; border:2px solid #3498db;';
        cloudSection.innerHTML = `
            <div style="font-size:18px; color:#2980b9; font-weight:bold; margin-bottom:10px;">☁️ 雲端存檔專區</div>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button id="cloud-save-btn" class="option-btn" style="background:#3498db; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">☁️ 儲存到雲端</button>
                <button id="cloud-load-btn" class="option-btn" style="background:#2ecc71; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">🌐 從雲端讀取</button>
            </div>
            <div id="cloud-notification-area" style="min-height: 40px;"></div>
            <div style="font-size: 12px; color: #555; text-align: center;">💡 雲端存檔讓你可以在不同裝置間同步遊戲進度！</div>
        `;
        
        if (musicBtn && musicBtn.parentNode) {
            musicBtn.parentNode.insertBefore(cloudSection, musicBtn.nextSibling);
        } else {
            settingsContent.insertBefore(cloudSection, settingsContent.firstChild);
        }
    }
    
    const saveBtn = document.getElementById('cloud-save-btn');
    const loadBtn = document.getElementById('cloud-load-btn');
    
    if (saveBtn && loadBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        const newLoadBtn = loadBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        loadBtn.parentNode.replaceChild(newLoadBtn, loadBtn);
        
        newSaveBtn.onclick = (e) => {
            e.stopPropagation();
            syncToCloud();
        };
        newLoadBtn.onclick = (e) => {
            e.stopPropagation();
            syncFromCloud();
        };
        
        return true;
    }
    
    return false;
}

let injectionAttempts = 0;
const MAX_ATTEMPTS = 30;

function waitForSettingsModal() {
    if (injectionAttempts >= MAX_ATTEMPTS) {
        return;
    }
    injectionAttempts++;
    if (injectCloudButtons()) {
        return;
    }
    setTimeout(waitForSettingsModal, 500);
}

function initCloudSave() {
    if (document.querySelector('#settings-modal .modal-content')) {
        injectCloudButtons();
    } else {
        waitForSettingsModal();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSave);
} else {
    initCloudSave();
}