// @ts-nocheck
import { readFileSync } from "fs";
import { setup, teardown } from "@firebase/rules-unit-testing";

// Standard Firebase rules test
describe("Firestore Rules", () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await setup({
      projectId: "shiesty-rules-test",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await teardown();
  });

  it("should deny unauthorized reads", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await expect(unauthedDb.collection("users").get()).rejects.toThrow();
  });
});
