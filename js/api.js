/**
 * 与根目录 /api/*.php 对接（表单 POST + JSON 响应）
 */
const API_BASE = `${window.location.origin.replace(/\/$/, '')}/api`;

function parseJsonResponse(text) {
  try {
    // 清理文本：移除BOM头、空白字符等
    let cleanedText = text.trim();
    
    // 移除UTF-8 BOM头 (EF BB BF)
    if (cleanedText.charCodeAt(0) === 0xFEFF) {
      cleanedText = cleanedText.slice(1);
    }
    
    // 尝试解析JSON
    const result = JSON.parse(cleanedText);
    
    // 检查是否有预期的结构
    if (result && typeof result === 'object') {
      return result;
    } else {
      throw new Error('服务器返回的数据结构异常');
    }
  } catch (error) {
    console.error('JSON解析错误:', error);
    console.error('原始响应:', text);
    
    // 尝试从错误响应中提取信息
    if (text.includes('{') && text.includes('}')) {
      try {
        // 尝试提取可能的JSON部分
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}') + 1;
        const jsonStr = text.substring(start, end);
        const parsed = JSON.parse(jsonStr);
        return parsed;
      } catch (e) {
        // 如果还是失败，返回友好的错误信息
        throw new Error(`服务器响应格式异常: ${error.message}`);
      }
    }
    
    throw new Error('服务器返回的数据不是有效的JSON格式');
  }
}

async function formPost(filename, fields) {
  const body = new URLSearchParams();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined && v !== null) body.set(k, String(v));
  });
  const res = await fetch(`${API_BASE}/${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: body.toString(),
  });
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '操作失败');
  }
  return data;
}

async function getJson(filename, query = '') {
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  const res = await fetch(`${API_BASE}/${filename}${q}`);
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '请求失败');
  }
  return data;
}

async function uploadForumImage(userId, file) {
  const fd = new FormData();
  fd.append('userId', String(userId));
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/uploadImage.php`, {
    method: 'POST',
    body: fd,
  });
  const data = parseJsonResponse(await res.text());
  if (data.code !== 1) {
    throw new Error(data.msg || '上传失败');
  }
  return data;
}

const forumAPI = {
  getBanners() {
    return getJson('getBanners.php');
  },

  getSiteBranding() {
    return getJson('getSiteBranding.php');
  },

  getSiteAnnouncement() {
    return getJson('getSiteAnnouncement.php');
  },

  adminBannersList(adminUserId) {
    return formPost('adminBannersList.php', { adminUserId });
  },

  adminBannerSave(adminUserId, fields) {
    return formPost('adminBannerSave.php', { adminUserId, ...fields });
  },

  adminBannerDelete(adminUserId, id) {
    return formPost('adminBannerDelete.php', { adminUserId, id });
  },

  adminSearchUsers(adminUserId, keyword) {
    return formPost('adminUserSearch.php', { adminUserId, keyword });
  },

  adminPostAuthorInfo(adminUserId, postId) {
    return formPost('adminPostAuthorInfo.php', { adminUserId, postId });
  },

  adminMuteUser(adminUserId, fields) {
    return formPost('adminMuteUser.php', { adminUserId, ...fields });
  },

  adminDashboardStats(adminUserId) {
    return formPost('adminDashboardStats.php', { adminUserId });
  },

  adminSaveSiteBranding(adminUserId, fields) {
    return formPost('adminSaveSiteBranding.php', { adminUserId, ...fields });
  },

  adminSaveSiteAnnouncement(adminUserId, fields) {
    return formPost('adminSaveSiteAnnouncement.php', { adminUserId, ...fields });
  },

  getPublicDashboardStats(userId = 0) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    return getJson('publicDashboardStats.php', params.toString());
  },

  getUserBehaviorSummary(userId) {
    return getJson('userBehaviorSummary.php', `userId=${encodeURIComponent(userId)}`);
  },

  getMyCenterSummary(userId) {
    return getJson('myCenterSummary.php', `userId=${encodeURIComponent(userId)}`);
  },

  getMyPosts(userId) {
    return getJson('myPosts.php', `userId=${encodeURIComponent(userId)}`);
  },

  getMyReplies(userId) {
    return getJson('myReplies.php', `userId=${encodeURIComponent(userId)}`);
  },

  getLikedPosts(userId) {
    return getJson('likedPosts.php', `userId=${encodeURIComponent(userId)}`);
  },

  getFeaturedPosts(userId = 0) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    return getJson('featuredPosts.php', params.toString());
  },

  getMyNotifications(userId) {
    return getJson('myNotifications.php', `userId=${encodeURIComponent(userId)}`);
  },

  getRecommendedPosts(userId, limit = 6) {
    const params = new URLSearchParams();
    if (userId > 0) params.set('userId', String(userId));
    if (limit > 0) params.set('limit', String(limit));
    return getJson('recommendPosts.php', params.toString());
  },

  getPosts(options = {}) {
    const params = new URLSearchParams();
    if (options.categoryId > 0) params.set('categoryId', String(options.categoryId));
    if (options.userId > 0) params.set('userId', String(options.userId));
    if (options.page > 0) params.set('page', String(options.page));
    if (options.pageSize > 0) params.set('pageSize', String(options.pageSize));
    if (options.q) params.set('q', String(options.q));
    return getJson('getPosts.php', params.toString());
  },

  getPostDetail(id, options = {}) {
    let q = `id=${encodeURIComponent(id)}`;
    if (options.skipView) q += '&skipView=1';
    if (options.userId > 0) q += `&userId=${encodeURIComponent(options.userId)}`;
    return getJson('getPostDetail.php', q);
  },

  login(phone, password) {
    return formPost('login.php', { phone, password });
  },

  register(phone, password, nickname) {
    return formPost('register.php', { phone, password, nickname });
  },

  addPost(userId, title, content, categoryId, imagesJson, isAnonymous) {
    const payload = {
      userId,
      title,
      content,
      images: imagesJson || '[]',
      isAnonymous: isAnonymous ? 1 : 0,
    };
    if (categoryId !== undefined && categoryId !== null) {
      payload.categoryId = categoryId;
    }
    return formPost('addPost.php', payload);
  },

  addComment(postId, userId, content, imagesJson, isAnonymous) {
    return formPost('addComment.php', {
      postId,
      userId,
      content,
      images: imagesJson || '[]',
      isAnonymous: isAnonymous ? 1 : 0,
    });
  },

  deletePost(id, userId) {
    return formPost('deletePost.php', { id, userId });
  },

  togglePostLike(postId, userId) {
    return formPost('togglePostLike.php', { postId, userId });
  },

  uploadImage(userId, file) {
    return uploadForumImage(userId, file);
  },

  updateUserAvatar(userId, avatar) {
    return formPost('updateUserAvatar.php', { userId, avatar });
  },
};

