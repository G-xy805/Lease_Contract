function navigateTo(url, options = {}) {
  const { delay = 0, showToast: showMsg } = options;

  function doNavigate() {
    if (showMsg) {
      wx.showToast({ title: showMsg, icon: 'success' });
      setTimeout(() => {
        wx.navigateTo({ url, fail: () => wx.switchTab({ url }) });
      }, 800);
    } else {
      wx.navigateTo({
        url,
        fail: () => wx.switchTab({ url })
      });
    }
  }

  if (delay > 0) {
    return setTimeout(doNavigate, delay);
  }
  doNavigate();
}

function redirectTo(url, options = {}) {
  const { delay = 0, showToast: showMsg } = options;

  function doRedirect() {
    if (showMsg) {
      wx.showToast({ title: showMsg, icon: 'success' });
      setTimeout(() => { wx.redirectTo({ url }); }, 800);
    } else {
      wx.redirectTo({ url });
    }
  }

  if (delay > 0) {
    return setTimeout(doRedirect, delay);
  }
  doRedirect();
}

module.exports = { navigateTo, redirectTo };
