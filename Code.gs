
/**
 * KidsHealthyMe - Backend (Code.gs)
 * Version: 3.0 (Fixed Action Not Found & Enhanced Robustness)
 */

const SPREADSHEET_ID = '1Y_qsmBerbRpPQdIo5ct0xni0VLoIQJ-C-r9FfRNM7Q8';

function setupDatabase() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const structures = {
    'users': ['id', 'username', 'password', 'role', 'fullname', 'class', 'room', 'number', 'gender', 'created_at'],
    'health_logs': [
      'id', 'user_id', 'date', 'missions', 'mood', 'water_glasses', 
      'sleep_start', 'sleep_end', 'sleep_hours', 'exercise_activity', 
      'exercise_minutes', 'sickness', 'height', 'weight', 'bmi', 'steps', 'vegetable_score'
    ],
    'avatar': ['id', 'user_id', 'avatar_name', 'level', 'exp', 'coin', 'equipped_item_id', 'streak_count', 'last_log_date', 'base_emoji'],
    'quiz_questions': ['id', 'question', 'option1', 'option2', 'option3', 'option4', 'answer', 'icon'],
    'cards': ['id', 'title', 'description', 'rarity', 'image', 'health_stat', 'brain_stat', 'energy_stat'],
    'user_cards': ['id', 'user_id', 'card_id', 'acquired_at'],
    'box_logs': ['id', 'user_id', 'date', 'item_name'],
    'user_items': ['id', 'user_id', 'item_id', 'is_equipped', 'acquired_at'],
    'shop_rewards': ['id', 'title', 'cost', 'stock', 'icon', 'description'],
    'redemptions': ['id', 'user_id', 'reward_id', 'status', 'claimed_at', 'code'],
    'friends': ['id', 'user_id', 'friend_id', 'created_at'],
    'social_actions': ['id', 'from_user_id', 'to_user_id', 'action_type', 'content', 'is_read', 'created_at']
  };

  for (let sheetName in structures) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(structures[sheetName]);
      sheet.getRange(1, 1, 1, structures[sheetName].length).setFontWeight('bold').setBackground('#f3f4f6');
      sheet.setFrozenRows(1);
    }
  }
  
  // Seed initial card data C1
  const cardSheet = ss.getSheetByName('cards');
  if (cardSheet.getLastRow() === 1) {
    const initialCards = [
      ['C1', 'กัปตันบรอกโคลี', 'ผู้พิทักษ์วิตามิน A', 'Common', 'https://img5.pic.in.th/file/secure-sv1/Set1-83.jpg', 10, 5, 5],
      ['C2', 'อัศวินน้ำใส', 'ช่วยให้ร่างกายสดชื่น', 'Common', 'https://img2.pic.in.th/pic/Set1-82.jpg', 5, 5, 10],
      ['C3', 'เทพเจ้านอนไว', 'พลังแห่งการฟื้นฟู', 'Rare', 'https://img2.pic.in.th/pic/Set1-81.jpg', 15, 20, 10]
    ];
    cardSheet.getRange(2, 1, initialCards.length, initialCards[0].length).setValues(initialCards);
  }
  
  return { success: true, message: "ระบบฐานข้อมูล v3.0 พร้อมใช้งาน" };
}

function doGet(e) {
  const callback = e.parameter.callback;
  let result = { success: false, message: 'Unknown error' };
  
  try {
    // Normalizing action name (Trim and lowercase for safer matching if needed, 
    // but here we use exact match to align with frontend)
    const action = e.parameter.action ? e.parameter.action.trim() : "";
    const payload = e.parameter.payload ? JSON.parse(e.parameter.payload) : {};
    
    switch(action) {
      case 'ping': result = { success: true }; break;
      case 'setupDatabase': result = setupDatabase(); break;
      case 'registerUser': result = registerUser(payload); break;
      case 'loginUser': result = loginUser(payload.username, payload.password); break;
      case 'saveHealthLog': result = saveHealthLog(payload); break;
      case 'getAvatarData': result = getAvatarData(payload.userId); break;
      case 'getQuizPool': result = { success: true, data: getQuizPool() }; break;
      
      // Card Collection Actions
      case 'getCards': result = { success: true, cards: getCards() }; break;
      case 'getUserCards': result = { success: true, userCards: getUserCards(payload.userId) }; break;
      case 'awardRandomCard': result = awardRandomCard(payload.userId); break;
      case 'saveCard': result = saveCard(payload); break;
      case 'deleteCard': result = deleteCard(payload.id); break;
      
      case 'updateAvatarStats': result = updateAvatarStats(payload.userId, payload.expGain); break;
      case 'getLeaderboardData': result = { success: true, data: getLeaderboardData(payload.className) }; break;
      case 'getShopRewards': result = { success: true, rewards: getShopRewards() }; break;
      case 'redeemReward': result = redeemReward(payload.userId, payload.rewardId, payload.cost); break;
      case 'getRedemptions': result = { success: true, redemptions: getRedemptions(payload.userId) }; break;
      case 'getAllHealthLogs': result = { success: true, data: getAllHealthLogs() }; break;
      case 'openMysteryBox': result = openMysteryBoxOnServer(payload.userId, payload.itemName); break;
      case 'getBoxLogs': result = { success: true, logs: getBoxLogs(payload.userId) }; break;
      case 'getUserItems': result = { success: true, items: getUserItems(payload.userId) }; break;
      case 'equipItem': result = equipItem(payload.userId, payload.itemId); break;
      case 'updateBaseEmoji': result = updateBaseEmoji(payload.userId, payload.emoji); break;
      
      // Social & Friends Actions
      case 'getFriends': result = { success: true, friends: getFriendsWithProfiles(payload.userId) }; break;
      case 'addFriend': result = addFriend(payload.userId, payload.friendId); break;
      case 'sendSocialAction': result = sendSocialAction(payload); break;
      case 'getSocialActions': result = { success: true, actions: getSocialActions(payload.userId) }; break;
      case 'markActionsAsRead': result = markActionsAsRead(payload.userId); break;
      
      // Admin Dashboard Actions
      case 'saveBulkQuiz': result = saveBulkQuiz(payload.questions); break;
      case 'updateRedemptionStatus': result = updateRedemptionStatus(payload.id, payload.status); break;
      case 'deleteShopReward': result = deleteShopReward(payload.id); break;
      case 'saveShopReward': result = saveShopReward(payload); break;
      case 'deleteQuizQuestion': result = deleteQuizQuestion(payload.id); break;
      case 'broadcastReward': result = broadcastReward(payload.exp, payload.coin); break;
      
      default: result = { success: false, message: 'Action not found: ' + action };
    }
  } catch (err) {
    result = { success: false, message: 'Server Error: ' + err.toString() };
  }
  
  const output = callback + "(" + JSON.stringify(result) + ")";
  return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getSheetSafe(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function getCards() {
  const sheet = getSheetSafe('cards');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => ({
    id: String(row[0]), title: String(row[1]), description: String(row[2]), rarity: String(row[3]), image: String(row[4]),
    power_stats: { health: Number(row[5]), brain: Number(row[6]), energy: Number(row[7]) }
  }));
}

function saveCard(card) {
  const sheet = getSheetSafe('cards');
  const data = sheet.getDataRange().getValues();
  let foundIndex = -1;
  const cardId = card.id || 'C-' + Utilities.getUuid().substr(0, 8);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(cardId)) {
      foundIndex = i + 1;
      break;
    }
  }
  
  const rowData = [
    cardId, card.title, card.description, card.rarity, card.image,
    Number(card.power_stats.health || 0), Number(card.power_stats.brain || 0), Number(card.power_stats.energy || 0)
  ];

  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return { success: true };
}

function deleteCard(id) {
  const sheet = getSheetSafe('cards');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function getUserCards(userId) {
  const data = getSheetSafe('user_cards').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(row => String(row[1]) === String(userId)).map(row => ({
    id: String(row[0]), user_id: String(row[1]), card_id: String(row[2]), acquired_at: String(row[3])
  }));
}

function awardRandomCard(userId) {
  const cards = getCards();
  if (cards.length === 0) return { success: false, message: "ไม่มีการ์ดในระบบ" };
  const randomCard = cards[Math.floor(Math.random() * cards.length)];
  const sheet = getSheetSafe('user_cards');
  const newId = 'UC-' + Utilities.getUuid().substr(0, 8);
  sheet.appendRow([newId, userId, randomCard.id, new Date().toISOString()]);
  return { success: true, card: randomCard };
}

function getFriendsWithProfiles(userId) {
  const friendsSheet = getSheetSafe('friends');
  const usersSheet = getSheetSafe('users');
  const avatarSheet = getSheetSafe('avatar');
  
  const friendsData = friendsSheet.getDataRange().getValues();
  const usersData = usersSheet.getDataRange().getValues();
  const avatarData = avatarSheet.getDataRange().getValues();
  
  const friendIds = friendsData.slice(1)
    .filter(row => String(row[1]) === String(userId))
    .map(row => String(row[2]));
    
  return friendIds.map(fid => {
    const userRow = usersData.find(u => String(u[0]) === fid);
    const avatarRow = avatarData.find(a => String(a[1]) === fid);
    return {
      user_id: fid,
      fullname: userRow ? String(userRow[4]) : 'เพื่อนนิรนาม',
      level: avatarRow ? Number(avatarRow[3]) : 1,
      base_emoji: avatarRow ? String(avatarRow[9]) : '🧑‍🚀'
    };
  });
}

function registerUser(data) {
  const sheet = getSheetSafe('users');
  const userId = 'U-' + Utilities.getUuid().substr(0, 8);
  sheet.appendRow([userId, data.username, data.password, 'student', data.fullname, data.class, data.room, data.number, data.gender, new Date().toISOString()]);
  const avatarSheet = getSheetSafe('avatar');
  avatarSheet.appendRow(['AV-' + userId, userId, 'Hero-' + data.fullname, 1, 0, 50, '', 0, '', '🧑‍🚀']);
  return { success: true, userId: userId };
}

function loginUser(username, password) {
  const data = getSheetSafe('users').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(username) && String(data[i][2]) === String(password)) {
      return { success: true, user: { id: String(data[i][0]), username: String(data[i][1]), role: String(data[i][3]), fullname: String(data[i][4]), class: String(data[i][5]) } };
    }
  }
  return { success: false };
}

function getAvatarData(userId) {
  const sheet = getSheetSafe('avatar');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(userId)) {
      return { 
        success: true, avatar_name: String(data[i][2]), level: Number(data[i][3]), 
        exp: Number(data[i][4]), coin: Number(data[i][5]), 
        equipped_item_id: String(data[i][6]), streak_count: Number(data[i][7]), 
        last_log_date: String(data[i][8]), base_emoji: String(data[i][9] || '🧑‍🚀')
      };
    }
  }
  return { success: false };
}

function getQuizPool() {
  const data = getSheetSafe('quiz_questions').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => ({
    id: String(row[0]), question: String(row[1]), option1: String(row[2]), option2: String(row[3]), option3: String(row[4]), option4: String(row[5]), answer: String(row[6]), icon: String(row[7])
  }));
}

function updateAvatarStats(userId, expGain) {
  const sheet = getSheetSafe('avatar');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(userId)) {
      let lv = Number(data[i][3]);
      let exp = Number(data[i][4]) + Number(expGain);
      let coin = Number(data[i][5]) + Math.floor(expGain / 2);
      while (exp >= (lv * 100)) { exp -= (lv * 100); lv++; }
      sheet.getRange(i + 1, 4, 1, 3).setValues([[lv, exp, coin]]);
      return { success: true };
    }
  }
  return { success: false };
}

function getLeaderboardData(className) {
  const avatars = getSheetSafe('avatar').getDataRange().getValues();
  const users = getSheetSafe('users').getDataRange().getValues();
  let result = avatars.slice(1).map(row => {
    const user = users.find(u => String(u[0]) === String(row[1]));
    if (!user) return null;
    return { user_id: String(row[1]), fullname: String(user[4]), level: Number(row[3]), exp: Number(row[4]), base_emoji: String(row[9] || '🧑‍🚀'), class: String(user[5]) };
  }).filter(u => u !== null);
  if (className) result = result.filter(u => u.class === className);
  return result.sort((a, b) => b.level - a.level || b.exp - a.exp).slice(0, 10);
}

function saveHealthLog(data) {
  const sheet = getSheetSafe('health_logs');
  const logId = 'LOG-' + Utilities.getUuid().substr(0, 8);
  sheet.appendRow([
    logId, data.user_id, new Date().toISOString(), JSON.stringify(data.missions), String(data.mood), Number(data.water_glasses),
    String(data.sleep_start), String(data.sleep_end), Number(data.sleep_hours), String(data.exercise_activity), Number(data.exercise_minutes),
    String(data.sickness), Number(data.height), Number(data.weight), Number(data.bmi), Number(data.steps), Number(data.vegetable_score)
  ]);
  updateAvatarStats(data.user_id, 10);
  return { success: true };
}

function getShopRewards() {
  const data = getSheetSafe('shop_rewards').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => ({ id: String(row[0]), title: String(row[1]), cost: Number(row[2]), stock: Number(row[3]), icon: String(row[4]), description: String(row[5]) }));
}

function redeemReward(userId, rewardId, cost) {
  const avatarSheet = getSheetSafe('avatar');
  const avatars = avatarSheet.getDataRange().getValues();
  for (let i = 1; i < avatars.length; i++) {
    if (String(avatars[i][1]) === String(userId)) {
      if (Number(avatars[i][5]) < cost) return { success: false, message: 'Coin not enough' };
      avatarSheet.getRange(i + 1, 6).setValue(Number(avatars[i][5]) - cost);
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      getSheetSafe('redemptions').appendRow([Utilities.getUuid(), userId, rewardId, 'pending', new Date().toISOString(), code]);
      return { success: true };
    }
  }
  return { success: false };
}

function getRedemptions(userId) {
  const data = getSheetSafe('redemptions').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(row => !userId || String(row[1]) === String(userId)).map(row => ({ id: String(row[0]), user_id: String(row[1]), reward_id: String(row[2]), status: String(row[3]), claimed_at: String(row[4]), code: String(row[5]) }));
}

function getAllHealthLogs() {
  const data = getSheetSafe('health_logs').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).map(row => ({ user_id: String(row[1]), date: String(row[2]), steps: Number(row[15]), mood: String(row[4]), sickness: String(row[11]), bmi: Number(row[14]), sleep_hours: Number(row[8]) }));
}

function openMysteryBoxOnServer(userId, itemName) {
  const avatarSheet = getSheetSafe('avatar');
  const avatars = avatarSheet.getDataRange().getValues();
  for (let i = 1; i < avatars.length; i++) {
    if (String(avatars[i][1]) === String(userId)) {
      if (Number(avatars[i][5]) < 20) return { success: false };
      avatarSheet.getRange(i + 1, 6).setValue(Number(avatars[i][5]) - 20);
      getSheetSafe('box_logs').appendRow([Utilities.getUuid(), userId, new Date().toISOString(), itemName]);
      getSheetSafe('user_items').appendRow([Utilities.getUuid(), userId, itemName, false, new Date().toISOString()]);
      return { success: true };
    }
  }
  return { success: false };
}

function getBoxLogs(userId) { 
  const data = getSheetSafe('box_logs').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => String(r[1]) === String(userId)); 
}

function getUserItems(userId) { 
  const data = getSheetSafe('user_items').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => String(r[1]) === String(userId)).map(r => ({ item_id: String(r[2]) })); 
}

function equipItem(userId, itemId) {
  const data = getSheetSafe('avatar').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (String(data[i][1]) === String(userId)) { getSheetSafe('avatar').getRange(i + 1, 7).setValue(String(itemId)); return { success: true }; } }
  return { success: false };
}

function updateBaseEmoji(userId, emoji) {
  const data = getSheetSafe('avatar').getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (String(data[i][1]) === String(userId)) { getSheetSafe('avatar').getRange(i + 1, 10).setValue(String(emoji)); return { success: true }; } }
  return { success: false };
}

function addFriend(userId, friendId) { 
  const sheet = getSheetSafe('friends');
  const data = sheet.getDataRange().getValues();
  const exists = data.slice(1).some(r => String(r[1]) === String(userId) && String(r[2]) === String(friendId));
  if (exists) return { success: false, message: 'เป็นเพื่อนกันอยู่แล้วจ้า' };
  sheet.appendRow([Utilities.getUuid(), userId, friendId, new Date().toISOString()]); 
  return { success: true }; 
}

function sendSocialAction(p) { 
  getSheetSafe('social_actions').appendRow([Utilities.getUuid(), p.from_user_id, p.to_user_id, p.action_type, p.content, false, new Date().toISOString()]); 
  return { success: true }; 
}

function getSocialActions(userId) { 
  const data = getSheetSafe('social_actions').getDataRange().getValues();
  if (data.length <= 1) return [];
  return data.slice(1).filter(r => String(r[2]) === String(userId)).map(r => ({ 
    id: String(r[0]), 
    from_user_id: String(r[1]), 
    action_type: String(r[3]), 
    content: String(r[4]), 
    is_read: r[5] 
  })); 
}

function markActionsAsRead(userId) {
  const sheet = getSheetSafe('social_actions');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { if (String(data[i][2]) === String(userId)) sheet.getRange(i + 1, 6).setValue(true); }
  return { success: true };
}

function saveBulkQuiz(questions) {
  const sheet = getSheetSafe('quiz_questions');
  questions.forEach(q => {
    sheet.appendRow([Utilities.getUuid().substr(0, 8), q.question, q.option1, q.option2, q.option3, q.option4, q.answer, q.icon]);
  });
  return { success: true };
}

function updateRedemptionStatus(id, status) {
  const sheet = getSheetSafe('redemptions');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 4).setValue(status);
      return { success: true };
    }
  }
  return { success: false };
}

function deleteShopReward(id) {
  const sheet = getSheetSafe('shop_rewards');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function saveShopReward(reward) {
  const sheet = getSheetSafe('shop_rewards');
  const data = sheet.getDataRange().getValues();
  let foundIndex = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(reward.id)) {
      foundIndex = i + 1;
      break;
    }
  }
  
  if (foundIndex !== -1) {
    sheet.getRange(foundIndex, 2, 1, 5).setValues([[reward.title, Number(reward.cost), Number(reward.stock), reward.icon, reward.description]]);
  } else {
    sheet.appendRow([Utilities.getUuid().substr(0, 8), reward.title, Number(reward.cost), Number(reward.stock), reward.icon, reward.description]);
  }
  return { success: true };
}

function deleteQuizQuestion(id) {
  const sheet = getSheetSafe('quiz_questions');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

function broadcastReward(exp, coin) {
  const sheet = getSheetSafe('avatar');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    let lv = Number(data[i][3]);
    let currentExp = Number(data[i][4]) + Number(exp);
    let currentCoin = Number(data[i][5]) + Number(coin);
    while (currentExp >= (lv * 100)) { currentExp -= (lv * 100); lv++; }
    sheet.getRange(i + 1, 4, 1, 3).setValues([[lv, currentExp, currentCoin]]);
  }
  return { success: true };
}
