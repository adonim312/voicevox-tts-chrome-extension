// ============================================================
// content.js - ページ情報の取得
// ============================================================

// background.js からのメッセージを受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 全文テキストの取得リクエスト
  if (message.action === "getBodyText") {
    const text = document.body.innerText || "";
    sendResponse({ text });
    return true;
  }
});
