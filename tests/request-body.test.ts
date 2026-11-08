import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedJson, RequestBodyTooLargeError } from "../lib/request-body";

const encoder = new TextEncoder();

function streamOf(value: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(value));
      controller.close();
    }
  });
}

test("bounded JSON reader parses a valid body", async () => {
  const result = await readBoundedJson(streamOf('{"message":"hello"}'), 100);
  assert.deepEqual(result, { message: "hello" });
});

test("bounded JSON reader rejects malformed JSON", async () => {
  await assert.rejects(readBoundedJson(streamOf('{"message":'), 100), SyntaxError);
});

test("bounded JSON reader rejects an oversized streamed body", async () => {
  await assert.rejects(
    readBoundedJson(streamOf('{"message":"' + "x".repeat(100) + '"}'), 32),
    RequestBodyTooLargeError
  );
});

test("bounded JSON reader rejects a missing body", async () => {
  await assert.rejects(readBoundedJson(null, 100), SyntaxError);
});
