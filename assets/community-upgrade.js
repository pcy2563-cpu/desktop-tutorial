(function () {
  const U = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const feedTabs = [
    U('\\u65b0\\u53d1'),
    U('\\u6211\\u53d1'),
    U('\\u6211\\u56de'),
    U('\\u6211\\u8d5e'),
    U('\\u7cbe\\u9009'),
    U('\\u901a\\u77e5'),
  ];
  const reasons = [
    ['ad', U('\\u5e7f\\u544a')],
    ['abuse', U('\\u8fb1\\u9a82')],
    ['attack', U('\\u4eba\\u8eab\\u653b\\u51fb')],
    ['privacy', U('\\u9690\\u79c1\\u6cc4\\u9732')],
    ['illegal', U('\\u8fdd\\u6cd5\\u8fdd\\u89c4')],
    ['other', U('\\u5176\\u4ed6')],
  ];

  function currentUser() {
    try {
      return JSON.parse(localStorage.getItem('campus_forum_user') || 'null') || null;
    } catch {
      return null;
    }
  }

  function toast(text) {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;left:50%;bottom:96px;z-index:10000;transform:translateX(-50%);padding:10px 14px;border-radius:999px;background:rgba(15,23,42,.88);color:#fff;font-size:13px;box-shadow:0 12px 28px rgba(15,23,42,.22)';
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity .22s ease';
      setTimeout(() => el.remove(), 260);
    }, 1800);
  }

  function postForm(url, data) {
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => form.append(key, value == null ? '' : String(value)));
    return fetch(url, { method: 'POST', body: form }).then(async (res) => {
      const json = await res.json().catch(() => ({}));
      if (!res.ok || Number(json.code) !== 1) throw new Error(json.msg || U('\\u64cd\\u4f5c\\u5931\\u8d25'));
      return json;
    });
  }

  function showReportModal(targetType, targetId) {
    const user = currentUser();
    if (!user || !user.id || !user.authToken) {
      toast(U('\\u8bf7\\u5148\\u767b\\u5f55\\u540e\\u518d\\u4e3e\\u62a5'));
      return;
    }
    document.querySelector('.community-report-modal')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'community-report-modal';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(15,23,42,.38);backdrop-filter:blur(10px)';
    overlay.innerHTML = `
      <div style="width:min(420px,100%);border-radius:24px;background:rgba(255,255,255,.94);box-shadow:0 24px 70px rgba(15,23,42,.25);padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <strong style="font-size:17px;color:#111827">${U('\\u4e3e\\u62a5\\u5185\\u5bb9')}</strong>
          <button type="button" data-close style="border:0;background:rgba(15,23,42,.06);border-radius:50%;width:32px;height:32px;cursor:pointer">×</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:12px">
          ${reasons.map(([value, label], index) => `<label style="display:flex;align-items:center;gap:7px;border:1px solid rgba(100,116,139,.18);border-radius:14px;padding:10px;font-size:13px;cursor:pointer"><input type="radio" name="reason" value="${value}" ${index === 0 ? 'checked' : ''}>${label}</label>`).join('')}
        </div>
        <textarea maxlength="300" placeholder="${U('\\u8865\\u5145\\u8bf4\\u660e\\uff08\\u53ef\\u9009\\uff09')}" style="width:100%;min-height:84px;resize:vertical;border:1px solid rgba(100,116,139,.22);border-radius:16px;padding:11px;font-size:14px"></textarea>
        <button type="button" data-submit style="margin-top:12px;width:100%;border:0;border-radius:999px;padding:11px 14px;background:#246bfe;color:#fff;font-weight:700;cursor:pointer">${U('\\u63d0\\u4ea4\\u4e3e\\u62a5')}</button>
      </div>
    `;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-close]')) overlay.remove();
    });
    overlay.querySelector('[data-submit]').addEventListener('click', async () => {
      const reason = overlay.querySelector('input[name="reason"]:checked')?.value || 'other';
      const detail = overlay.querySelector('textarea').value.trim();
      try {
        await postForm('/api/reportContent.php', {
          userId: user.id,
          authToken: user.authToken,
          targetType,
          targetId,
          reason,
          detail,
        });
        overlay.remove();
        toast(U('\\u4e3e\\u62a5\\u5df2\\u63d0\\u4ea4'));
      } catch (error) {
        toast(error.message || U('\\u4e3e\\u62a5\\u5931\\u8d25'));
      }
    });
    document.body.appendChild(overlay);
  }

  function visibleFeedButtons() {
    return [...document.querySelectorAll('.feed-tab, .page-container button')].filter((btn) => {
      const text = btn.textContent.trim();
      return feedTabs.includes(text);
    });
  }

  function clickFeed(label) {
    const button = visibleFeedButtons().find((btn) => btn.textContent.trim() === label);
    if (button) button.click();
  }

  function openPublishModal() {
    const publishButton = [...document.querySelectorAll('.bottom-nav button')].find((btn) => btn.textContent.includes(U('\\u53d1\\u5e03')));
    if (publishButton) publishButton.click();
  }

  function ensureDesktopPanels() {
    const isHome = location.pathname.endsWith('/home') || location.pathname.endsWith('/vue-test/') || location.pathname.endsWith('/vue-test');
    if (!isHome) {
      document.querySelectorAll('.community-desktop-panel').forEach((node) => node.remove());
      return;
    }
    if (!document.querySelector('.community-desktop-left')) {
      const left = document.createElement('aside');
      left.className = 'community-desktop-panel community-desktop-left';
      left.innerHTML = `<div class="community-panel-title">${U('\\u793e\\u533a\\u680f\\u76ee')}</div><div class="community-panel-list">${feedTabs.map((label, index) => `<button class="community-panel-btn${index === 0 ? ' active' : ''}" data-feed="${label}">${label}</button>`).join('')}</div>`;
      left.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-feed]');
        if (!btn) return;
        left.querySelectorAll('.community-panel-btn').forEach((item) => item.classList.remove('active'));
        btn.classList.add('active');
        clickFeed(btn.getAttribute('data-feed'));
      });
      document.body.appendChild(left);
    }
    if (!document.querySelector('.community-desktop-right')) {
      const right = document.createElement('aside');
      right.className = 'community-desktop-panel community-desktop-right';
      right.innerHTML = `
        <button class="community-publish-card" type="button">${U('\\u53d1\\u5e03\\u52a8\\u6001')}</button>
        <div class="community-panel-title">${U('\\u7ad9\\u5185\\u6982\\u89c8')}</div>
        <div class="community-panel-card" data-summary>${U('\\u6570\\u636e\\u52a0\\u8f7d\\u4e2d')}</div>
        <div class="community-panel-title" style="margin-top:14px">${U('\\u70ed\\u95e8\\u5185\\u5bb9')}</div>
        <div class="community-panel-list" data-hot></div>
      `;
      right.querySelector('.community-publish-card').addEventListener('click', openPublishModal);
      document.body.appendChild(right);
      fetch('/api/publicDashboardStats.php').then((r) => r.json()).then((json) => {
        const data = json.data || {};
        const summary = data.summary || {};
        const summaryEl = right.querySelector('[data-summary]');
        summaryEl.innerHTML = `${U('\\u5e16\\u5b50')} ${summary.posts || 0}<br>${U('\\u8bc4\\u8bba')} ${summary.comments || 0}<br>${U('\\u4eca\\u65e5\\u65b0\\u53d1')} ${summary.today_posts || 0}`;
        const hot = right.querySelector('[data-hot]');
        hot.innerHTML = (data.hot_posts || []).slice(0, 5).map((item) => {
          const text = String(item.content || item.title || U('\\u672a\\u547d\\u540d\\u5e16\\u5b50')).slice(0, 42);
          return `<div class="community-panel-card">${text}</div>`;
        }).join('') || `<div class="community-panel-card">${U('\\u6682\\u65e0\\u70ed\\u95e8')}</div>`;
      }).catch(() => {});
    }
  }

  function ensureReportButtons() {
    document.querySelectorAll('.post-item[data-post-id]').forEach((card) => {
      if (card.querySelector('.post-action-btn.report, .community-report-btn')) return;
      const stats = card.querySelector('.post-stats') || card;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'community-report-btn';
      btn.textContent = U('\\u4e3e\\u62a5');
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        showReportModal('post', card.getAttribute('data-post-id'));
      });
      stats.appendChild(btn);
    });

    const match = location.pathname.match(/\/post\/(\d+)/);
    const old = document.querySelector('.community-detail-report');
    if (!match) {
      if (old) old.remove();
      return;
    }
    if (!old) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'community-report-btn community-detail-report';
      btn.textContent = U('\\u4e3e\\u62a5\\u5e16\\u5b50');
      btn.style.cssText += ';position:fixed;right:18px;bottom:92px;z-index:999';
      btn.addEventListener('click', () => showReportModal('post', match[1]));
      document.body.appendChild(btn);
    }
  }

  window.addEventListener('community-report', (event) => {
    const detail = event.detail || {};
    if (detail.targetType && detail.targetId) showReportModal(detail.targetType, detail.targetId);
  });

  function tick() {
    ensureDesktopPanels();
    ensureReportButtons();
  }

  document.addEventListener('DOMContentLoaded', tick);
  window.addEventListener('popstate', () => setTimeout(tick, 80));
  setInterval(tick, 900);
})();
