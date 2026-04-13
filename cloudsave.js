// cloudsave.js - 雲端存檔功能 (等待設定頁面版)

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
// 在設定頁面中加入雲端按鈕
// ============================================

function injectCloudButtons() {
    // 檢查按鈕是否已經存在
    if (document.getElementById('cloud-save-btn')) {
        console.log('✅ 雲端按鈕已存在');
        return;
    }
    
    // 尋找設定頁面的內容區域
    const settingsContent = document.querySelector('#settings-modal .modal-content');
    if (!settingsContent) {
        console.log('⏳ 設定頁面尚未載入，稍後重試...');
        return false;
    }
    
    // 尋找音樂控制按鈕（作為插入位置的參考）
    const musicBtn = document.getElementById('bgm-toggle-settings');
    
    // 建立雲端按鈕區塊
    const cloudDiv = document.createElement('div');
    cloudDiv.id = 'cloud-sync-section';
    cloudDiv.style.cssText = 'background:#e8f4fd; padding:15px; border-radius:15px; margin-bottom:20px; border:2px solid #3498db;';
    cloudDiv.innerHTML = `
        <div style="font-size:18px; color:#2980b9; font-weight:bold; margin-bottom:10px;">☁️ 雲端存檔專區</div>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
            <button id="cloud-save-btn" class="option-btn" style="background:#3498db; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">☁️ 儲存到雲端</button>
            <button id="cloud-load-btn" class="option-btn" style="background:#2ecc71; color:white; border:none; flex:1; padding: 10px; cursor:pointer;">🌐 從雲端讀取</button>
        </div>
        <div style="font-size: 12px; color: #555; text-align: center;">💡 雲端存檔讓你可以在不同裝置間同步遊戲進度！</div>
    `;
    
    // 插入到音樂按鈕之後
    if (musicBtn && musicBtn.parentNode) {
        musicBtn.parentNode.insertBefore(cloudDiv, musicBtn.nextSibling);
    } else {
        settingsContent.insertBefore(cloudDiv, settingsContent.firstChild);
    }
    
    // 綁定按鈕事件
    const saveBtn = document.getElementById('cloud-save-btn');
    const loadBtn = document.getElementById('cloud-load-btn');
    
    if (saveBtn && loadBtn) {
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            syncToCloud();
        };
        loadBtn.onclick = (e) => {
            e.stopPropagation();
            syncFromCloud();
        };
        console.log('✅ 雲端按鈕已成功加入設定頁面！');
        return true;
    }
    
    return false;
}

// ============================================
// 持續等待設定頁面出現（使用 MutationObserver）
// ============================================

let injectionAttempts = 0;
const MAX_ATTEMPTS = 30;

function waitForSettingsModal() {
    if (injectionAttempts >= MAX_ATTEMPTS) {
        console.warn('⚠️ 超過最大嘗試次數，無法加入雲端按鈕');
        return;
    }
    
    injectionAttempts++;
    
    if (injectCloudButtons()) {
        console.log('✅ 雲端按鈕已成功注入！');
        return;
    }
    
    // 如果設定頁面還沒出現，0.5 秒後再試一次
    setTimeout(waitForSettingsModal, 500);
}

// ============================================
// 初始化：等待 DOM 載入後開始監聽
// ============================================

function initCloudSave() {
    console.log('☁️ 雲端存檔模組初始化');
    
    // 如果設定頁面已經存在，直接注入
    if (document.querySelector('#settings-modal .modal-content')) {
        injectCloudButtons();
    } else {
        // 否則開始等待
        waitForSettingsModal();
    }
}

// 啟動初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCloudSave);
} else {
    initCloudSave();
}