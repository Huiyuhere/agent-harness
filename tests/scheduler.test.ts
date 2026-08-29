import assert from "node:assert/strict";
import test from "node:test";
import { RepositoryScheduler } from "../lib/repository-scheduler";

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 15));

test("allows three readers but never more", async () => {
  const scheduler = new RepositoryScheduler(3);
  let active = 0;
  let peak = 0;
  const jobs = Array.from({ length: 7 }, () => scheduler.schedule("repo", "read", async () => {
    active += 1; peak = Math.max(peak, active); await tick(); active -= 1;
  }));
  await Promise.all(jobs.map((job) => job.promise));
  assert.equal(peak, 3);
});

test("serializes writers for the same repository", async () => {
  const scheduler = new RepositoryScheduler();
  const order: string[] = [];
  const first = scheduler.schedule("repo", "write", async () => { order.push("first:start"); await tick(); order.push("first:end"); });
  const second = scheduler.schedule("repo", "write", async () => { order.push("second:start"); order.push("second:end"); });
  await Promise.all([first.promise, second.promise]);
  assert.deepEqual(order, ["first:start", "first:end", "second:start", "second:end"]);
});
