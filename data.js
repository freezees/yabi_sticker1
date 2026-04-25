// data.js
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let isMusicPlaying = false, voiceVolume = 1.0, isWait = false;

// 假設這三個 BGM 是在 HTML 裡的 <audio> 標籤
const bgm = document.getElementById('my-bgm');
const winBgm = document.getElementById('win-bgm');
const failBgm = document.getElementById('fail-bgm');

// ★ 修正 1：移除這裡的 let lobbyBgm，統一交由 system.js 進行全域管理
// ★ 修正 2：將 pendingDamageForFeedback 明確掛載到 window，解決重複宣告與作用域問題
window.pendingDamageForFeedback = 0;

// 單字庫系統
const lessonData = {
    "lesson1": ["apple", "banana", "pear", "bread", "carrot", "mango", "rice", "vegetables", "guava", "papaya", "grape", "cheese", "fruit", "potato", "onion", "arm", "ear", "eye", "finger", "hair", "hand", "head", "leg", "nose", "jacket", "raincoat", "skirt", "socks", "t-shirt", "umbrella", "basketball", "bed", "closet", "computer", "skateboard", "teddy bear", "toy train", "big", "small", "long", "short", "new", "old", "orange", "purple", "friend"],
    "lesson2": ["water", "juice", "coke", "hungry", "thirsty", "soup", "pizza", "pasta", "cake", "ice cream", "hot", "cold", "sunny", "cloudy", "rainy", "draw", "triangle", "circle", "square", "park"],
    "lesson3": ["red", "blue", "green", "yellow", "black", "white"],
    "lesson4": ["one", "two", "three", "four", "five"],
    "lesson5": ["run", "jump", "walk", "sleep", "eat"]
};

// 自動修復單字庫進度
let activeLessons;
try { activeLessons = JSON.parse(localStorage.getItem('activeLessons')); } catch(e) { activeLessons = null; }
if(!Array.isArray(activeLessons) || activeLessons.length === 0) activeLessons = ["lesson1"];

let currentWordList = [];
let wordToLessonMap = {};

function buildCurrentWordList() {
    currentWordList = [];
    wordToLessonMap = {};
    activeLessons.forEach(l => {
        if(lessonData[l]) { lessonData[l].forEach(w => { currentWordList.push(w); wordToLessonMap[w] = l; }); }
    });
}
buildCurrentWordList();

// 英雄資料
const heroes = [
    { 
        folder: 'hero1', name: '艾德恩', title: '晨曦之劍騎士', feature: '代表勇氣與守護', 
        skills: ["突進斬擊", "三連幻影斬", "金色神雷：巨劍天降", "神聖守護 (🌟五星解鎖)"], 
        passiveDesc: "【被動：神聖守護】在危急時刻有機率觸發聖光護盾，抵擋魔龍的致命一擊！",
        petImg: "hero1/pet.png", 
        baseHp: 8, baseHints: 1, baseDmg: [1, 2, 3], 
        anims: ["atk-dash", "atk-glow", "atk-glow"], magicImg: "assets/meteor.png", magicAnim: "meteor-anim" 
    },
    { 
        folder: 'hero2', name: '米拉', title: '潮汐星願仙子', feature: '代表海洋與夢想', 
        skills: ["泡沫星砂彈", "珊瑚星曜海嘯", "深海巨鯨之歌", "海洋復甦 (🌟五星解鎖)"], 
        passiveDesc: "【被動：海洋復甦】進入第二關時，若拼錯單字，米拉的魔法會自動發動並提示正確字母！",
        petImg: "hero2/pet.png", 
        baseHp: 4, baseHints: 3, baseDmg: [2, 2, 3], 
        anims: ["atk-dash", "atk-spin", "atk-glow"], magicImg: "assets/meteor.png", magicAnim: "meteor-anim", magicAudio: "hero2/whale_ult.mp3" 
    },
// heroes[2] - 露娜（深海治癒使）
	{ 
		folder: 'hero3', 
		name: '露娜', 
		title: '深海治癒使', 
		feature: '代表治癒與歌聲', 
		skills: ["珍珠水彈", "治癒之浪", "深海治癒波", "守護海星 (🌟五星解鎖)"], 
		passiveDesc: "【被動：守護海星】受到攻擊時，有 50% 機率回復 1 點生命值！",
		petImg: "hero3/pet.png", 
		baseHp: 5, 
		baseHints: 3, 
		baseDmg: [1, 1, 3],        // 招式1:1滴、招式2:1滴、招式3:3滴
		anims: ["atk-dash", "atk-glow", "atk-glow"], 
		magicImg: "hero3/heal_wave.png", 
		magicAnim: "meteor-anim", 
		magicAudio: "hero3/atk3_cast.mp3" 
	},
    { 
        folder: 'hero4', name: '諾娃', title: '璀璨銀河精靈', feature: '代表希望與驚喜', 
        skills: ["冰凌突刺", "寒冰迴旋", "星星光波", "星辰爆發 (🌟五星解鎖)"], 
        passiveDesc: "【被動：星辰爆發】魔法爆擊時，造成的傷害會額外提升，並伴隨絢麗星光！",
        petImg: "hero4/pet.png", 
        baseHp: 5, baseHints: 3, baseDmg: [1, 2, 3], 
        anims: ["atk-dash", "atk-spin", "atk-glow"], magicImg: "hero4/star_wave.png", magicAnim: "custom", magicAudio: "hero4/wave.mp3" 
    },
    { 
        folder: 'hero5', name: '黛米', title: '金色豐饒使者', feature: '代表大自然與慷慨', 
        skills: ["飛花葉刃", "狂野藤蔓", "金色麥浪大豐收", "豐收盛宴 (🌟五星解鎖)"], 
        passiveDesc: "【被動：豐收盛宴】戰鬥結束獲得寶箱時，有額外機率讓掉落的金幣翻倍！",
        petImg: "hero5/pet.png", 
        baseHp: 5, baseHints: 3, baseDmg: [1, 2, 3], 
        anims: ["atk-dash", "atk-jump", "atk-glow"], magicImg: "hero5/wheat_wave.png", magicAnim: "custom-nature", magicAudio: "hero5/nature_ult.mp3" 
    }
];
for(let i=6; i<=10; i++) {
    heroes.push({ 
        folder: `hero${i}`, name: `神祕英雄 ${i}`, title: '沉睡中的力量', feature: '等待喚醒中...', 
        skills: ["招式 1", "招式 2", "招式 3", "未知覺醒技"], 
        passiveDesc: "【未知被動】目前英雄仍在沉睡，等待覺醒中...",
        petImg: `hero${i}/pet.png`,
        baseHp: 5, baseHints: 3, baseDmg: [1, 2, 3], 
        anims: ["atk-dash", "atk-glow", "atk-glow"], magicImg: "assets/meteor.png", magicAnim: "meteor-anim" 
    });
}

let selectedHeroIdx = 0;

// 動態擴充版：使用「稀有度 + 編號」來綁定故事
const customStickers = {
    // === SR 系列 ===
    'SR1': { name: '雙子櫻花精靈', desc: '感情超好的雙胞胎精靈，只要她們抱在一起，周圍就會開滿美麗的粉紅櫻花喔！🌸' },
    'SR2': { name: '晚安星仙子', desc: '總是抱著星星打瞌睡的小仙子。聽說只要乖乖睡覺，她就會把好夢悄悄送進你的被窩裡！🌟' },
    'SR3': { name: '月亮號角兔', desc: '喜歡躺在月亮上吹奏金色的號角。牠的音樂有神奇的魔法，能讓焦躁的心瞬間平靜下來。🌙' },
    'SR4': { name: '銀河大提琴手', desc: '頭髮裡藏著整片星空的音樂家！當她拉奏大提琴時，閃爍的音符會變成流星劃過天際。🌌' },
    'SR5': { name: '甜心棉花糖', desc: '由軟綿綿的棉花糖變成的調皮精靈！最喜歡拿著彩色棒棒糖，到處散播甜甜的香氣。🍭' },
    'SR6': { name: '珍珠海公主', desc: '來自深海的調皮公主！她的裙襬上裝飾著最珍貴的海星與珍珠，最喜歡對你眨眼微笑。🐚' },
    'SR7': { name: '晨曦玫瑰仙子', desc: '掌管森林花朵的仙子。只要她輕輕揮手，就能讓植物充滿活力，綻放出最美麗的玫瑰！🌹' },
    'SR8': { name: '春日櫻小巫女', desc: '搖著鈴鐺祈福的春日小巫女。手中的櫻花枝能招來好運，為你帶來一整天的開心與平安！⛩️' },
    'SR9': { name: '彩虹星願小魔女', desc: '乘著彩虹雲朵降臨，手中的星星法杖能揮灑出七彩的幸運光芒！🌈✨' },
    'SR10': { name: '冰火雙子星', desc: '一半是炙熱的火焰，一半是冷冽的冰霜！隨身帶著一隻小火龍，掌控著極限的魔法。🔥❄️' },
    'SR11': { name: '雷雨牧羊女', desc: '掌管天氣的精靈，身邊跟著一隻軟綿綿的烏雲小羊，生氣時可是會打雷的喔！⛈️🐑' },
    'SR12': { name: '幻彩泡泡仙子', desc: '輕輕一吹就能製造出無數個夢幻泡泡，每個泡泡裡都藏著一個甜蜜的美夢。🫧🦋' },
    'SR13': { name: '幽光森林守護者', desc: '戴著骷髏王冠的神祕精靈，雖然看起來有點嚇人，但其實是守護森林植物的溫柔使者。💀🌿' },
    'SR14': { name: '深海晶藍人魚', desc: '揮舞著海神三叉戟的人魚公主，身邊總有發光的小水母陪伴，守護著海洋的和平。🔱🐙' },
    'SR15': { name: '彩虹愛心聖騎士', desc: '舉起閃耀的愛心盾牌，穿著絢麗的彩虹鎧甲！她會用彩虹的力量擊退所有噩夢與壞蛋！🛡️🌈' },

    // === R 系列 ===
    'R1': { name: '向日葵獅子公主', desc: '頂著像向日葵一樣燦爛的獅子頭套，笑容跟夏天的太陽一樣溫暖！🌻🦁' },
    'R2': { name: '月光酣睡星精靈', desc: '抱著水晶球在月亮上打瞌睡的小男孩，會把好運偷偷塞進你的夢裡。🌙💤' },
    'R3': { name: '紫芋音符女孩', desc: '綁著俏皮雙馬尾，只要她一唱歌，周圍就會飄滿紫色的快樂音符！🎶💜' },
    'R4': { name: '翡翠海音人魚', desc: '吹奏著水晶長笛的綠髮人魚，笛聲能讓暴躁的海洋生物安靜下來。🧜‍♀️🎵' },
    'R5': { name: '鋼琴圓舞曲精靈', desc: '裙襬是黑白琴鍵的優雅指揮家，能讓所有的樂器自動演奏出動聽的交響樂！🎹🎼' },
    'R6': { name: '提線木偶黑魔女', desc: '操控著神祕提線木偶的黑女巫，臉上掛著捉摸不定的調皮微笑。🎭🕸️' },
    'R7': { name: '冰霜雪花扇舞者', desc: '揮動藍色摺扇，就能在炎熱的夏天裡刮起一陣涼爽的雪花冰風暴！❄️🪭' },
    'R8': { name: '閃耀星光麥克風', desc: '夢想成為宇宙大明星的星星精靈，隨時隨地都在準備開演唱會！🎤🌟' },
    'R9': { name: '流星鍵盤滑板', desc: '踩著琴鍵滑板在銀河裡衝浪！留下的軌跡是一串串美妙的合成器音效。🛹🌠' },
    'R10': { name: '月牙琵琶木雕兔', desc: '坐在弦月上彈奏樂器的木雕小兔，琴聲有種讓人感到安心的古老魔力。🐇🪕' },
    'R11': { name: '紙箱吉他機器人', desc: '用回收紙箱做成的環保機器人，彈起吉他來節奏感可是宇宙第一名！📦🤖' },
    'R12': { name: '毒蘑菇小守衛', desc: '頭頂著巨大紅蘑菇的森林小兵，雖然叫毒蘑菇，但其實只會讓人癢得哈哈大笑！🍄😂' },
    'R13': { name: '紫雲雷雨小鬼', desc: '躲在紫色雷雲裡的小精靈，最喜歡在別人沒帶傘的時候偷偷下起糖果雨！☔🍬' },
    'R14': { name: '靈蛇占卜師', desc: '蒙著神祕面紗的占卜師，水晶球和身旁的黑蛇能看見你明天早餐吃什麼！🔮🐍' },
    'R15': { name: '雪海白海豚仙子', desc: '與罕見的白海豚一起在冰海上嬉戲，是冬天海面上最美麗的風景。🐬❄️' },
    'R16': { name: '紫夜靈貓巫女', desc: '披著神祕紫袍，肩膀上站著一隻聰明的小黑貓，精通各種隱形魔法。🐈‍⬛🌙' },
    'R17': { name: '春日花苞園丁', desc: '拿著小水壺的精靈，只要被她澆過水的地方，立刻就會開滿五顏六色的花朵！🌷💧' },
    'R18': { name: '幽靈骨笛手', desc: '吹奏著白骨長笛的哥德風少爺，身邊圍繞著可愛的幽靈小鳥，其實一點都不恐怖！👻🎶' },
    'R19': { name: '幽冥提燈引路人', desc: '提著幽綠色靈火燈籠的溫柔精靈，會在迷霧森林裡為迷路的小動物指引方向。🏮🌲' },
    'R20': { name: '珍珠法杖海妖', desc: '拿著巨大珍珠法杖的海妖仙子，她的歌聲會讓人忍不住想跟著跳舞！🧜‍♀️🐚' },
    'R21': { name: '魔法書見習生', desc: '抱著厚厚魔法書的小魔女，雖然偶爾會念錯咒語把青蛙變成大蛋糕，但非常努力！📚🐸' },
    'R22': { name: '薄荷冰淇淋精靈', desc: '走過的地方都會散發出清涼的薄荷香氣！夏天的最佳消暑夥伴。🍦❄️' },
    'R23': { name: '草莓愛心戰士', desc: '拿著愛心權杖的粉紅戰士，絕招是發射讓人心情瞬間變好的「草莓甜心光波」！🍓💖' },
    'R24': { name: '粉櫻愛心蝴蝶仙子', desc: '擁有美麗粉紅羽翼的仙子，被她灑落的花粉沾到，一整天都會遇到幸運的事喔！🦋🌸' },
    'R25': { name: '棉花糖綿羊女孩', desc: '穿著像雲朵一樣澎澎的綿羊裝，抱著小熊娃娃，是最溫暖的抱抱達人。🐑🧸' },
    'R26': { name: '馬卡龍獨角獸', desc: '踩在甜美馬卡龍塔上的彩色獨角獸，據說只有最純真善良的小孩才能看見牠。🦄🍬' },
    'R27': { name: '齒輪懷錶紳士貓', desc: '充滿蒸氣龐克風格的機械貓咪，不僅會看時間，還會用魔法修理壞掉的玩具！⚙️🐱' },
    'R28': { name: '櫻桃甜點廚師', desc: '拿著超大粉紅湯匙的小廚娘，她做的櫻桃果醬有讓人忘記煩惱的神奇魔力。🍒🥄' },
    'R29': { name: '彩虹流星指揮家', desc: '揮動彩虹魔法棒，就能指揮天上的星星排出各種有趣的形狀！🌈✨' },
    'R30': { name: '海星豎琴人魚', desc: '彈奏著珍珠豎琴的銀髮人魚，音樂聲像海浪一樣輕柔，能哄小寶貝進入夢鄉。🧜‍♀️🌊' },

    // === N 系列 ===
    'N1': { name: '烈日小獅', desc: '體內蘊含烈日之力的調皮小獅，最喜歡在晴天曬太陽，心情好的時候，鬃毛會像火焰一樣燃燒！🔥' },
    'N2': { name: '霹靂雲精靈', desc: '雖然是一朵小小的雷雲，但脾氣可不小！最喜歡在午睡時給你來一記無傷大雅的小閃電，調皮得很！⚡' },
    'N3': { name: '果凍盾衛', desc: '身體像果凍一樣有彈性的粉紅士兵，他的盾牌能反彈所有惡作劇，是森林裡最可靠的果凍守衛！🛡️' },
    'N4': { name: '扇舞狐姬', desc: '穿著華麗和服、手持摺扇的優雅狐精靈。她的一顰一笑都能喚起櫻花瓣飛舞，是魔法祭典上的焦點。👘' },
    'N5': { name: '齒輪蒸汽工匠', desc: '全身由精密齒輪組成的蒸汽小機器人，最喜歡修理壞掉的魔法道具。他的夢想是發明出能自動寫作業的機器！⚙️' },
    'N6': { name: '岩漿岩小怪', desc: '體表流動著炙熱岩漿的小怪物。別看他外表凶猛，其實心地善良，最喜歡用體溫幫你烤棉花糖。🔥🍡' },
    'N7': { name: '聖光金翼天使', desc: '手持聖劍與神盾的小天使。他的任務是守護純真的夢想，用聖光驅散所有惡夢。🛡️✨' },
    'N8': { name: '雷霆騎士', desc: '操控雷電力量的英勇騎士。他的劍能像閃電一樣快速刺擊，在戰鬥時總是最先衝鋒陷陣。⚡⚔️' },
    'N9': { name: '森林精靈長老', desc: '與森林融為一體的神祕精靈。她能聽懂樹木的語言，守護著古老的自然魔法。🌿' },
    'N10': { name: '火焰小紅狐', desc: '體色如烈火般鮮紅的小狐狸。牠的尾巴能燃起溫暖的火焰，是你在寒冷夜晚最好的夥伴。🦊🔥' },
    'N11': { name: '樂譜貓頭鷹音樂家', desc: '頭戴音符飾品、專注彈奏魔法琴的貓頭鷹音樂家。聽說牠的樂曲能讓魔法藥水的藥效翻倍！🦉🎵' },
    'N12': { name: '繽紛馬卡龍小熊', desc: '被彩色馬卡龍塔簇擁的小熊玩偶。別看牠圓滾滾的，牠可是個美食家，能瞬間認出所有口味的馬卡龍！🐻🍬' },
    'N13': { name: '夢幻霓虹海仙子', desc: '散發著霓虹般柔和光芒的夢幻水母。牠在水中翩翩起舞，彷彿在訴說著來自深海的神祕故事。🌊🐙' },
    'N14': { name: '爆米花金色精靈', desc: '像爆米花一樣充滿活力的金色小精靈。只要牠拍手，周圍就會爆出無數顆美味的爆米花，調皮得很！🍿🌽' },
    'N15': { name: '森林藤蔓刺客', desc: '穿著由樹葉與藤蔓織成盔甲的森林劍士。他的劍術刁鑽細膩，像藤蔓一樣難纏。🌿⚔️' },
    'N16': { name: '搖滾電音少女', desc: '手持電吉他、彈奏出充滿魔力電音的電音少女。她的音樂能讓周圍的人情不自禁地跟著搖擺！🎸⚡' },
    'N17': { name: '墨跡畫家精靈', desc: '由墨跡與顏料組成的小畫家精靈。他的畫筆能把夢境變成現實，最喜歡在空白的地方塗鴉。🎨✒️' },
    'N18': { name: '冰晶極光少女', desc: '像極光一樣清冷優雅的冰雪精靈。她輕輕揮手，就能喚起漫天飛雪，美麗卻也帶著幾分調皮。❄️🌈' },
    'N19': { name: '星際宇航探險家', desc: '穿著精密太空服、在無垠銀河中探險的星際探險家。他的目標是收集所有稀有的星星標本。🚀🌌' },
    'N20': { name: '時光守護鐘樓', desc: '像鐘樓一樣可靠的時光守護者。他能調整魔法時鐘，讓你擁有更多快樂的魔法時光。🕰️🔒' },
    'N21': { name: '智慧提燈國王', desc: '手持智慧提燈的優雅國王。他的提燈能照亮未知的路徑，指引你找到藏寶圖上的終點。👑🏮' },
    'N22': { name: '墨荷扇舞仙子', desc: '像墨跡般靈動的扇舞仙子。她揮動扇子，能喚起陣陣水墨般的魔法風暴，調皮又強大。🍃' },
    'N23': { name: '冰霜女巫長老', desc: '操控冰霜魔法的強大冰雪法師。她的法杖能瞬間凍結所有不聽話的怪物，是個嚴厲的調皮法師。❄️' },
    'N24': { name: '時間領主小精靈', desc: '由精密時鐘零件組成的時間小領主。他最喜歡對魔法時鐘動手腳，讓快樂的時間變長，難過的時間變短。🕰️' },
    'N25': { name: '傀儡師黑魔法少女', desc: '能用無形絲線操控傀儡的黑魔法少女。她的臉上總掛著神祕的微笑，是個調皮又讓人摸不透的法師。💀' },
    'N26': { name: '棉花糖甜心雲', desc: '軟綿綿、散發著甜甜香氣的棉花糖精靈。牠最喜歡在彩虹上滑行，把所有經過的地方都變成甜點。🌈' },
    'N27': { name: '智慧占星長老', desc: '滿頭白髮、智慧深邃的占星長老。他能透過水晶球預見未來的調皮事跡，並為你提供實用的魔法建議。🔮' },
    'N28': { name: '星際熊貓小鬼', desc: '由銀河能量變成的可愛小熊貓。牠最喜歡玩耍星星光波，把所有無聊的事情都變成有趣的魔法表演。✨' },
    'N29': { name: '銀河星願鯨魚', desc: '在無垠銀河中暢游的星願鯨魚。牠的夢想是收集所有遺失的夢想碎片，把牠們變成最耀眼的星星。🌌' },
    'N30': { name: '樂器貓精靈', desc: '頭戴小草飾品、專注彈奏魔法樂器的調皮貓咪音樂家。聽說牠的樂曲能讓魔法植物長得更快、更強壯！🎸' },
    'N31': { name: '樂器仙子女孩', desc: '像音符般靈動的樂器仙子。她吹奏樂器，能喚起彩色音符飛舞，讓周圍充滿歡樂的魔法氛圍。🎵' },
    'N32': { name: '墨跡女孩畫家', desc: '由墨跡與顏料組成的小畫家少女。她的畫筆能把所有普通的事情都變成有趣的魔法塗鴉。🎨' },
    'N33': { name: '美食料理小女巫', desc: '穿著廚師服、烹飪出充滿魔力料理的美食女巫。她的料理能瞬間恢復你的魔法體力，讓你精力充沛！🍳' },
    'N34': { name: '金星星星精靈', desc: '像金子般閃耀的星願星星。牠最喜歡收集所有遺失的夢想碎片，把牠們變成最耀眼的星星。✨' },
    'N35': { name: '植物藥草女巫', desc: '與藥草融為一體的神祕女巫。她能用藥草煉製出充滿魔力的藥水，調皮又強大。🌿' },
    'N36': { name: '捲髮電音少女', desc: '手持電吉他、彈奏出充滿魔力電音的電音少女。她的音樂能讓周圍的人情不自禁地跟著搖擺！🎸' },
    'N37': { name: '星際熊貓探險家', desc: '穿著精密太空服、在無垠銀河中探險的星際熊貓宇航員。他的目標是收集所有稀有的星星標本。🚀' },
    'N38': { name: '捲髮樂器少女', desc: '像音符般靈動的樂器仙子。她吹奏樂器，能喚起彩色音符飛舞，讓周圍充滿歡樂的魔法氛圍。🎵' },
    'N39': { name: '音樂笛手海豚', desc: '在海中暢游、吹奏魔法笛子的調皮海豚音樂家。聽說牠的樂曲能讓魔法魚類長得更快、更強壯！🐬' },
    'N40': { name: '捲髮冰霜女巫', desc: '操控冰霜魔法的強大冰雪法師。她的法杖能瞬間凍結所有不聽話的怪物，是個嚴厲的調皮法師。❄️' },
    'N41': { name: '水母霓虹海仙子', desc: '散發著霓虹般柔和光芒的夢幻水母。牠在水中翩翩起舞，彷彿在訴說著來自深海的神祕故事。🐙🌊' }
};

const stickerDB = [];
const nUniversalDescList = [
    "這是一張閃耀著魔法光芒的未知貼紙！快去收集吧！✨",
    "雖然普通，但充滿了調皮的魔法氣息。說不定有些驚喜藏在其中？",
    "出身是墨跡的小畫家精靈。他的畫筆能把夢境變成現實，最喜歡在空白的地方塗鴉。🎨✒️",
    "出身是軟綿綿、散發著甜甜香氣的棉花糖精靈。牠最喜歡在彩虹上滑行，把所有經過的地方都變成甜點。🌈",
    "與森林融為一體的神祕精靈。她能聽懂樹木的語言，守護著古老的自然魔法。🌿",
    "操控雷電力量的英勇騎士。他的劍能像閃電一樣快速刺擊，在戰鬥時總是最先衝鋒陷陣。⚡⚔️",
    "頭戴音符飾品、專注彈奏魔法琴的貓頭鷹音樂家。聽說牠的樂曲能讓魔法藥水的藥效翻倍！🦉🎵",
    "穿著華麗和服、手持摺扇的優雅狐精靈。她的一顰一笑都能喚起櫻花瓣飛舞，是魔法祭典上的焦點。👘",
    "墨跡般靈動的扇舞仙子。她揮動扇子，能喚起陣陣水墨般的魔法風暴，調皮又強大。🍃",
    "雖然是一朵小小的雷雲，但脾氣可不小！最喜歡在午睡時給你來一記無傷大雅的小閃電，調皮得很！⚡"
];

let counts = { 'SSR': 0, 'SR': 0, 'R': 0, 'N': 0 };

for(let i=0; i<200; i++) {
    let r = 'N';
    if(i < 10) r = 'SSR';      
    else if(i < 30) r = 'SR';  
    else if(i < 70) r = 'R';   
    else r = 'N';
    
    counts[r]++;
    let currentRank = counts[r];
    let displayKey = r + currentRank; 

    let n = `魔法貼紙 #${currentRank}`;
    let d = "這是一張閃耀著魔法光芒的未知貼紙！快去收集吧！✨";
    
    if (r === 'N') {
        d = nUniversalDescList[(currentRank - 1) % nUniversalDescList.length]; 
    }

    if (customStickers[displayKey]) {
        n = customStickers[displayKey].name;
        d = customStickers[displayKey].desc;
    }

    stickerDB.push({ id: i, rarity: r, name: n, desc: d });
}

let currentLvl = 1, currentWord = "", spellingText = "";
let pHP = 5, dHP = 5, hintsLeft = 3;