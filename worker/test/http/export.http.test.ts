import { describe, test, expect } from "bun:test";
import {
  authenticateWithPin,
  createHttpEnv,
  insertDailyTask,
  insertDailyTaskCompletion,
  insertFeedEntry,
  insertGrowthEntry,
  insertNappyEntry,
  insertPumpEntry,
  insertSleepEntry,
  request,
} from "./helpers";

describe("HTTP /api/export", () => {
  test("requires authentication and the json format", async () => {
    const env = await createHttpEnv();

    expect((await request(env, "/api/export?format=json")).status).toBe(401);

    const token = await authenticateWithPin(env);
    const response = await request(env, "/api/export", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(400);
  });

  test("exports user records without database identifiers", async () => {
    const env = await createHttpEnv();
    const token = await authenticateWithPin(env);
    const task = await insertDailyTask(env, { name: "Vitamin D" });
    await insertDailyTaskCompletion(env, { task_id: task.id });
    await insertSleepEntry(env);
    await insertFeedEntry(env);
    await insertNappyEntry(env);
    await insertPumpEntry(env);
    await insertGrowthEntry(env);

    const response = await request(env, "/api/export?format=json", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await response.json()) as {
      exportedAt: string;
      appVersion: string;
      records: Record<string, Record<string, unknown>[]>;
    };

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain(
      `baby-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    expect(new Date(body.exportedAt).toISOString()).toBe(body.exportedAt);
    expect(body.appVersion).toBe("1.0.0");
    expect(Object.keys(body.records)).toEqual([
      "sleep",
      "feed",
      "nappy",
      "pump",
      "growth",
      "dailyTasks",
      "dailyTaskCompletions",
    ]);
    expect(body.records.sleep).toHaveLength(1);
    expect(body.records.feed).toHaveLength(1);
    expect(body.records.nappy).toHaveLength(1);
    expect(body.records.pump).toHaveLength(1);
    expect(body.records.growth).toHaveLength(1);
    expect(body.records.dailyTasks).toHaveLength(1);
    expect(body.records.dailyTaskCompletions[0]).toMatchObject({
      task_name: "Vitamin D",
    });

    for (const records of Object.values(body.records)) {
      for (const record of records) {
        expect(record).not.toHaveProperty("id");
        expect(record).not.toHaveProperty("task_id");
        expect(record).not.toHaveProperty("token");
        expect(record).not.toHaveProperty("pin_hash");
      }
    }
  });
});
