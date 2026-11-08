import test from "node:test";
import assert from "node:assert/strict";
import {authorizeLabRequest,checkRateLimit,resetRateLimitsForTests} from "../lib/access";

test("access gate fails closed when token is not configured",()=>{
 const result=authorizeLabRequest("Bearer "+ "x".repeat(40),"");
 assert.equal(result.ok,false);
 if(!result.ok)assert.equal(result.status,503);
});
test("access gate rejects missing and incorrect tokens",()=>{
 assert.equal(authorizeLabRequest(null,"s".repeat(40)).ok,false);
 assert.equal(authorizeLabRequest("Bearer "+"x".repeat(40),"s".repeat(40)).ok,false);
});
test("access gate accepts the configured bearer token",()=>{
 assert.equal(authorizeLabRequest("Bearer "+"s".repeat(40),"s".repeat(40)).ok,true);
});
test("request limiter allows twelve requests then blocks the thirteenth",()=>{
 resetRateLimitsForTests();
 for(let i=0;i<12;i++)assert.equal(checkRateLimit("test-ip",1000+i).ok,true);
 const blocked=checkRateLimit("test-ip",2000);
 assert.equal(blocked.ok,false);
 if(!blocked.ok)assert.equal(blocked.status,429);
 resetRateLimitsForTests();
});
test("request limiter expires requests after one minute",()=>{
 resetRateLimitsForTests();
 for(let i=0;i<12;i++)checkRateLimit("expiry-ip",1000);
 assert.equal(checkRateLimit("expiry-ip",62_000).ok,true);
 resetRateLimitsForTests();
});
test("access gate accepts a token of exactly 32 characters",()=>{
 const token="s".repeat(32);
 assert.equal(authorizeLabRequest("Bearer "+token,token).ok,true);
});
test("access gate rejects a 32-character token when configured token differs",()=>{
 const configured="s".repeat(40);
 const supplied="x".repeat(32);
 const result=authorizeLabRequest("Bearer "+supplied,configured);
 assert.equal(result.ok,false);
 if(!result.ok)assert.equal(result.status,401);
});
