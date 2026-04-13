// cloudsave.js - 雲端存檔功能 (設定頁面版)

const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbyHqMyyHbR2OrTOZ2qQtECKLyJAd29Bgj6ftSC1JomtxzmPBn7TNFSkxl8GlfpoglZE9g/exec';

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
                showCloudMsg(`✅ 已設定玩家名稱：${customName}`);
            }
        }, 500);
    }
    
    return playerId;
}

// ============================================
// 顯示提示訊息
// ============================================

function showCloudMsg(msg) {
    if (typeof showBattleMsg === 'function') {
        showBattleMsg(msg);
    } else {
        console.log(msg);
        const msgDiv = document.getElementById('battle-msg');
        if (msgDiv) {
            msgDiv.innerText = msg;
            msgDiv.style.opacity = 1;
            setTimeout(() => { msgDiv.style.opacity = 0; }, 2000);
        }
    }
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
// 儲存到雲端（不儲存 studyLog）
// ============================================

async function syncToCloud() {
    const playerId = getPlayerId();
    
    const saveData = {
        gachaData: window.gachaData,
        activeLessons: activeLessons,
        deviceInfo: navigator.userAgent,
        saveTime: new Date().toISOString()
    };
    
    showCloudMsg('☁️ 正在儲存到雲端...');
    
    try {
        const result = await jsonpRequest({
            action: 'save',
            playerId: playerId,
            data: JSON.stringify(saveData)
        });
        
        if (result && result.success) {
            localStorage.setItem('cloud_last_save', Date.now().toString());
            showCloudMsg('✅ 雲端存檔成功！');
            return true;
        } else {
            showCloudMsg('⚠️ ' + (result?.error || '雲端存檔失敗'));
            return false;
        }
    } catch(error) {
        console.error('雲端存檔失敗:', error);
        showCloudMsg('⚠️ 雲端存檔失敗，請檢查網路');
        return false;
    }
}

// ============================================
// 從雲端讀取
// ============================================

async function syncFromCloud() {
    const playerId = getPlayerId();
    showCloudMsg('☁️ 正在從雲端讀取...');
    
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
                
                showCloudMsg('✅ 雲端讀取成功！請重新整理頁面。');
                setTimeout(() => location.reload(), 1500);
                return true;
            } else {
                showCloudMsg('已取消載入雲端存檔');
                return false;
            }
        } else {
            showCloudMsg('⚠️ ' + (result?.error || '沒有找到雲端存檔'));
            return false;
        }
    } catch(error) {
        console.error('雲端讀取失敗:', error);
        showCloudMsg('⚠️ 雲端讀取失敗');
        return false;
    }
}

// ============================================
// 綁定雲端按鈕（在設定頁面中）
// ============================================

function setupCloudButtons() {
    // 等待設定頁面的按鈕出現
    let retryCount = 0;
    const maxRetries = 30;
    
    const tryBindButtons = setInterval(() => {
        const saveBtn = document.getElementById('cloud-save-btn');
        const loadBtn = document.getElementById('cloud-load-btn');
        
        if (saveBtn && loadBtn) {
            clearInterval(tryBindButtons);
            
            // 移除舊的事件監聽器（避免重複綁定）
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
            
            console.log('✅ 雲端按鈕已綁定到設定頁面');
        }
        
        retryCount++;
        if (retryCount >= maxRetries) {
            clearInterval(tryBindButtons);
            console.warn('⚠️ 找不到雲端按鈕元素');
        }
    }, 200);
}

// ============================================
// 顯示玩家 ID（選用功能）
// ============================================

function showPlayerId() {
    const playerId = getPlayerId();
    alert(`你的雲端存檔 ID 是：\n\n${playerId}\n\n請記下這個 ID，在其他裝置輸入即可同步進度。`);
}

function setPlayerId() {
    const newId = prompt('請輸入你的雲端存檔 ID：');
    if (newId && newId.trim()) {
        localStorage.setItem('cloud_playerId', newId.trim());
        alert('✅ 已切換 ID，請點擊「從雲端讀取」來載入進度。');
        location.reload();
    }
}

// ============================================
// 初始化
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCloudButtons);
} else {
    setupCloudButtons();
}