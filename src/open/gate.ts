export type OpenStart = { queued: true } | { ticket: number };

export function createOpenGate(loaded: boolean) {
  let ticket = 0;
  let ready = loaded;
  let canWrite = loaded;
  const queue: string[] = [];
  return {
    get canWrite() {
      return canWrite;
    },
    push(path: string): OpenStart {
      if (!ready) {
        queue.push(path);
        return { queued: true };
      }
      ticket += 1;
      return { ticket };
    },
    finish(id: number) {
      return id === ticket;
    },
    loaded(write: boolean) {
      ready = true;
      canWrite = write;
      return queue.splice(0);
    },
  };
}
