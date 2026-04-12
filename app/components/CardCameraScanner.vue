<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
    <div class="w-full max-w-md mx-4 rounded-2xl bg-slate-900 border border-white/10 shadow-xl overflow-hidden flex flex-col">
      <div class="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <h2 class="text-sm font-semibold text-white">Card camera scanner</h2>
        <button
          type="button"
          class="text-xs text-white/70 hover:text-white"
          @click="handleClose"
        >
          Close
        </button>
      </div>

      <div class="relative bg-black aspect-[3/4] flex items-center justify-center">
        <video
          ref="videoEl"
          class="w-full h-full object-cover"
          autoplay
          playsinline
          muted
        ></video>

        <div class="pointer-events-none absolute inset-8 border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"></div>
      </div>

      <div class="px-4 py-3 space-y-2 text-xs text-white/80">
        <p>
          Point your card inside the frame. Integrate a detection library or API to automatically
          recognize the card and emit its ID or number.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            class="px-3 py-1 rounded-md text-[11px] font-semibold border border-emerald-400/70 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
            @click="captureAndEmitImage"
          >
            Capture & compare
          </button>
          <input
            v-model="manualValue"
            type="text"
            placeholder="Or enter card id / number manually"
            class="flex-1 rounded-md border border-white/20 bg-black/40 px-2 py-1 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            class="px-3 py-1 rounded-md text-[11px] font-semibold border border-emerald-400/70 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
            @click="emitDetected"
          >
            Mark as detected
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: "close"): void;
  (e: "card-detected", value: string): void;
  (e: "image-captured", value: string): void; // data URL of captured frame
}>();

const videoEl = ref<HTMLVideoElement | null>(null);
const mediaStream = ref<MediaStream | null>(null);
const manualValue = ref("");

const startCamera = async () => {
  if (!process.client) return;
  if (!navigator.mediaDevices?.getUserMedia) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
      },
      audio: false,
    });
    mediaStream.value = stream;
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
    }
  } catch {
    // camera permission denied or unavailable
  }
};

const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach((t) => t.stop());
    mediaStream.value = null;
  }
};

const handleClose = () => {
  stopCamera();
  emit("close");
};

const emitDetected = () => {
  const value = manualValue.value.trim();
  if (!value) return;
  emit("card-detected", value);
};

const captureAndEmitImage = () => {
  if (!process.client) return;
  const video = videoEl.value;
  if (!video || !video.videoWidth || !video.videoHeight) return;

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
  emit("image-captured", dataUrl);
};

onMounted(() => {
  startCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>
