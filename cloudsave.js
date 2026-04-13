// cloudsave.js - 完整修正版

const CLOUD_API_URL = 'https://script.google.com/macros/s/AKfycbyHqMyyHbR2OrTOZ2qQtECKLyJAd29Bgj6ftSC1JomtxzmPBn7TNFSkxl8GlfpoglZE9g/exec';

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
            }
        }, 500);
    }
    return playerId;
}

function showCloudMsg(msg) {
    if (typeof showBattleMsg === 'function') {
        showBattleMsg(msg);
    } else {
        console.log(msg);
    }
}

// JSONP 請求輔助函數
function jsonpRequest(params) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const script = document.createElement('script');
        
        window[callbackName] = (response) => {
            delete window[callbackName];
            document.body.removeChild(script);
            clearTimeout(timeoutId);
            resolve(response);
        };
        
        let url = CLOUD_API_URL + '?callback=' + callbackName;
        for (let key in params) {
            url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        }
        
        const timeoutId = setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                document.body.removeChild(script);
                reject(new Error('請求超時'));
            }
        }, 15000);
        
        script.src = url;
        document.body.appendChild(script);
    });
}

async function syncToCloud() {
    const playerId = getPlayerId();
    
    const saveData = {
        gachaData: window.gachaData,
        studyLog: window.studyLog,
        activeLessons: activeLessons,
        deviceInfo: navigator.userAgent
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

async function syncFromCloud() {
    const playerId = getPlayerId();
    showCloudMsg('☁️ 正在從雲端讀取...');
    
    try {
        const result = await jsonpRequest({
            action: 'load',
            playerId: playerId
        });
        
        if (result && result.success && result.data) {
            if (confirm(`找到雲端存檔！\n最後儲存時間：${result.lastSaveTime}\n\n要覆蓋目前的進度嗎？`)) {
                window.gachaData = result.data.gachaData;
                window.studyLog = result.data.studyLog;
                activeLessons = result.data.activeLessons;
                
                localStorage.setItem('gachaSystemV5', JSON.stringify(window.gachaData));
                localStorage.setItem('dragonGameLogV5', JSON.stringify(window.studyLog));
                localStorage.setItem('activeLessons', JSON.stringify(activeLessons));
                
                showCloudMsg('✅ 雲端讀取成功！請重新整理頁面。');
                setTimeout(() => location.reload(), 1500);
                return true;
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

function addCloudSyncButton() {
    let retryCount = 0;
    const tryAddButton = setInterval(() => {
        const parentZone = document.getElementById('parent-unlocked-zone');
        if (parentZone) {
            clearInterval(tryAddButton);
            if (document.getElementById('cloud-sync-buttons')) return;
            
            const buttonDiv = document.createElement('div');
            buttonDiv.id = 'cloud-sync-buttons';
            buttonDiv.style.cssText = 'display: flex; gap: 10px; margin-top: 10px;';
            buttonDiv.innerHTML = `
                <button class="option-btn" style="background:#3498db; color:white; border:none; flex:1; padding: 10px;" onclick="syncToCloud()">☁️ 儲存到雲端</button>
                <button class="option-btn" style="background:#2ecc71; color:white; border:none; flex:1; padding: 10px;" onclick="syncFromCloud()">🌐 從雲端讀取</button>
            `;
            parentZone.appendChild(buttonDiv);
        }
        retryCount++;
        if (retryCount >= 20) clearInterval(tryAddButton);
    }, 200);
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(addCloudSyncButton, 500);
});