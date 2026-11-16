/**
 * decodeAudioData that works in every browser. Older Safari only supports the
 * callback form: there the promise form never finishes, so sounds built from
 * recordings stayed silent and the microphone check hung on "Checking…".
 * Uses the callbacks (which every browser supports) and gives up after `ms`.
 */
export function decodeAudio(ctx: BaseAudioContext, data: ArrayBuffer, ms = 10000): Promise<AudioBuffer> {
  return new Promise<AudioBuffer>((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        reject(new Error("decoding the sound took too long"));
      }
    }, ms);
    const ok = (b: AudioBuffer) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(b);
    };
    const fail = (e: unknown) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(e instanceof Error ? e : new Error("this sound couldn't be decoded"));
    };
    try {
      const p = ctx.decodeAudioData(data, ok, fail) as Promise<AudioBuffer> | undefined;
      // Newer browsers also return a promise; use whichever answers first.
      p?.then?.(ok, fail);
    } catch (e) {
      fail(e);
    }
  });
}
