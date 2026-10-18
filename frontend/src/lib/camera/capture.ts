/** Preview + pengambilan still dari kamera tablet. */

export interface PreviewOptions {
  facingMode?: 'environment' | 'user';
  width?: number;
  height?: number;
}

export async function startPreview(
  video: HTMLVideoElement,
  options: PreviewOptions = {}
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: options.facingMode ?? 'environment' },
      width: { ideal: options.width ?? 1600 },
      height: { ideal: options.height ?? 900 },
    },
    audio: false,
  });

  video.srcObject = stream;
  await video.play().catch(() => undefined);

  return stream;
}

export function stopPreview(stream: MediaStream | null, video?: HTMLVideoElement | null): void {
  stream?.getTracks().forEach((track) => track.stop());
  if (video) video.srcObject = null;
}

/** Ambil still: full-res lewat ImageCapture bila tersedia, fallback canvas. */
export async function capturePhoto(video: HTMLVideoElement, stream: MediaStream): Promise<Blob> {
  const track = stream.getVideoTracks()[0];

  if (typeof ImageCapture !== 'undefined' && track) {
    try {
      const capture = new ImageCapture(track);
      const blob = await capture.takePhoto();
      if (blob.size > 0) return blob;
    } catch {
      // Beberapa browser menolak takePhoto saat kamera dipakai preview; pakai canvas.
    }
  }

  return canvasGrab(video);
}

function canvasGrab(video: HTMLVideoElement): Promise<Blob> {
  const width = video.videoWidth;
  const height = video.videoHeight;

  if (width === 0 || height === 0) {
    return Promise.reject(new Error('Preview kamera belum siap. Coba lagi.'));
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (context === null) {
    return Promise.reject(new Error('Canvas 2D tidak tersedia di perangkat ini.'));
  }

  context.drawImage(video, 0, 0, width, height);
  context.setTransform(1, 0, 0, 1, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob === null ? reject(new Error('Gagal mengambil gambar.')) : resolve(blob)),
      'image/jpeg',
      0.95
    );
  });
}
