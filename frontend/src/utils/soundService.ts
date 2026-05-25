import type { NotificationSettings } from "../types";

const notificationSoundUrl = "/sounds/notifSound.mp3";
const minSoundGapMs = 1400;
let lastSoundAt = 0;
let notificationAudio: HTMLAudioElement | null = null;

function getNotificationAudio(): HTMLAudioElement {
  notificationAudio ??= new Audio(notificationSoundUrl);
  notificationAudio.preload = "auto";
  notificationAudio.volume = 0.72;
  return notificationAudio;
}

function playFile(volume: number, playbackRate: number): void {
  const baseAudio = getNotificationAudio();
  const audio = baseAudio.cloneNode(true) as HTMLAudioElement;
  audio.volume = volume;
  audio.playbackRate = playbackRate;
  void audio.play().catch((error) => {
    console.debug("[sound] mp3 playback blocked or failed", error);
  });
}

export function unlockNotificationSound(): void {
  try {
    const audio = getNotificationAudio();
    audio.load();
    console.debug("[sound] notification sound ready", notificationSoundUrl);
  } catch (error) {
    console.debug("[sound] notification sound unavailable", error);
  }
}

export function playNotificationSound(settings: NotificationSettings, activeConversation: boolean): void {
  if (settings.muted) {
    console.debug("[sound] skipped: muted");
    return;
  }
  if (Date.now() - lastSoundAt < minSoundGapMs) {
    console.debug("[sound] skipped: throttled");
    return;
  }
  lastSoundAt = Date.now();
  console.debug("[sound] play mp3", { activeConversation, notificationSoundUrl });
  if (activeConversation) {
    playFile(0.45, 1.08);
    return;
  }
  playFile(0.72, 1);
}
