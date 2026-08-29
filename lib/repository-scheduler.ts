export type JobKind = "read" | "write";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type ScheduledJob<T> = {
  id: string;
  repositoryId: string;
  kind: JobKind;
  status: JobStatus;
  promise: Promise<T>;
  cancel: () => void;
};

export class RepositoryScheduler {
  private readonly readerLimit: number;
  private activeReaders = 0;
  private readerQueue: Array<() => void> = [];
  private writerTails = new Map<string, Promise<unknown>>();

  constructor(readerLimit = 3) {
    if (!Number.isInteger(readerLimit) || readerLimit < 1) throw new Error("Reader limit must be a positive integer.");
    this.readerLimit = readerLimit;
  }

  schedule<T>(repositoryId: string, kind: JobKind, run: (signal: AbortSignal) => Promise<T>): ScheduledJob<T> {
    const controller = new AbortController();
    const job = { id: crypto.randomUUID(), repositoryId, kind, status: "queued" as JobStatus } as ScheduledJob<T>;
    const execute = async () => {
      if (controller.signal.aborted) throw new DOMException("Cancelled", "AbortError");
      job.status = "running";
      try { const result = await run(controller.signal); job.status = "succeeded"; return result; }
      catch (error) { job.status = controller.signal.aborted ? "cancelled" : "failed"; throw error; }
    };
    if (kind === "write") {
      const tail = this.writerTails.get(repositoryId) ?? Promise.resolve();
      job.promise = tail.catch(() => undefined).then(execute);
      this.writerTails.set(repositoryId, job.promise.finally(() => { if (this.writerTails.get(repositoryId) === job.promise) this.writerTails.delete(repositoryId); }));
    } else {
      job.promise = new Promise<T>((resolve, reject) => {
        const start = () => { this.activeReaders += 1; execute().then(resolve, reject).finally(() => { this.activeReaders -= 1; this.readerQueue.shift()?.(); }); };
        if (this.activeReaders < this.readerLimit) start(); else this.readerQueue.push(start);
      });
    }
    job.cancel = () => controller.abort();
    return job;
  }
}
