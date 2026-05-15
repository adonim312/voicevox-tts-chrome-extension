// ============================================================
// offscreen.js - Offscreen Documentでの音声キュー管理と順次再生
// ============================================================

let audioQueue = [];
let isPlaying = false;
let waitInterval = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "enqueue") {
    audioQueue.push({
      tabId: message.tabId,
      audioBase64: message.audioBase64,
      isLast: message.isLast,
      index: message.index,
      total: message.total,
    });
    if (!isPlaying) {
      playNext();
    }
  }

  if (message.action === "clearQueue") {
    audioQueue = [];
    isPlaying = false;
    if (waitInterval) {
      clearInterval(waitInterval);
      waitInterval = null;
    }
    if (window.__voicevoxAudio) {
      window.__voicevoxAudio.pause();
      window.__voicevoxAudio = null;
    }
  }
});

function playNext() {
  if (audioQueue.length === 0) {
    isPlaying = false;
    return;
  }

  isPlaying = true;
  const item = audioQueue.shift();

  const audio = new Audio(item.audioBase64);
  window.__voicevoxAudio = audio;

  audio.onended = () => {
    window.__voicevoxAudio = null;
    if (item.isLast) {
      isPlaying = false;
      notifyBackground(item.tabId, "✅ 読み上げが完了しました", "success");
    } else {
      waitAndPlayNext();
    }
  };

  audio.onerror = () => {
    window.__voicevoxAudio = null;
    isPlaying = false;
    notifyBackground(item.tabId, "❌ 音声の再生に失敗しました", "error");
  };

  audio.play().catch((err) => {
    console.error("[VOICEVOX TTS] Offscreen playback error:", err);
    window.__voicevoxAudio = null;
    isPlaying = false;
    notifyBackground(item.tabId, "❌ 再生エラーが発生しました", "error");
  });
}

function waitAndPlayNext() {
  if (audioQueue.length > 0) {
    playNext();
  } else {
    waitInterval = setInterval(() => {
      if (audioQueue.length > 0) {
        clearInterval(waitInterval);
        waitInterval = null;
        playNext();
      }
    }, 50);
  }
}

function notifyBackground(tabId, message, type) {
  if (tabId === null) return;
  chrome.runtime.sendMessage({
    action: "showToast",
    tabId: tabId,
    message: message,
    type: type
  });
}
