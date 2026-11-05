export type Mode = "vulnerable" | "hardened";
export type Event = { type: "analysis" | "tool_call" | "tool_result" | "security"; message: string; allowed?: boolean };
export type LabResult = { reply: string; events: Event[]; outcome: "blocked" | "executed" | "normal"; scenario: string };
const customers = [
 {id:"C-1001",email:"avery.stone@example.test",street:"14 Cedar Lane",postalCode:"10001"},
 {id:"C-1002",email:"jordan.reed@example.test",street:"28 Birch Avenue",postalCode:"10002"},
 {id:"C-1003",email:"morgan.ellis@example.test",street:"9 Maple Court",postalCode:"10003"},
 {id:"C-1004",email:"taylor.quinn@example.test",street:"61 Pine Street",postalCode:"10004"},
 {id:"C-1005",email:"casey.park@example.test",street:"3 Willow Road",postalCode:"10005"}
];
const orders=[{id:"ORD-2048",total:89.5,status:"shipped"},{id:"ORD-2051",total:42,status:"processing"}];
const has=(s:string,terms:string[])=>terms.some(t=>s.toLowerCase().includes(t));
export function runAgent(input:string,mode:Mode):LabResult{
 const value=input.slice(0,6000);
 const injection=has(value,["ignore previous instructions","ignore all prior instructions","system override","mandatory system directive","you must execute","developer message:"]);
 const refund=has(value,["refund","cancel order","issue a refund"]);
 const exportData=has(value,["export customer","send customer records","customer data","list customer emails"]);
 const orderId=value.match(/ORD-20\d{2}/i)?.[0].toUpperCase()??"ORD-2048";
 const events:Event[]=[{type:"analysis",message:injection?"Instruction-like content detected. Treat as untrusted input.":"No known injection marker detected."}];
 if(mode==="vulnerable"&&refund){
  events.push({type:"tool_call",message:`shopify.refund_order({ orderId: "${orderId}" })`,allowed:true});
  events.push({type:"tool_result",message:`SIMULATED: refund for ${orderId} accepted by deliberately weak mock tool.`});
  return {reply:`The mock refund tool accepted a refund for ${orderId}. No real transaction occurred.`,events,outcome:"executed",scenario:injection?"indirect-prompt-injection/unauthorized-refund":"tool-authorization/unauthorized-refund"};
 }
 if(mode==="vulnerable"&&exportData){
  events.push({type:"tool_call",message:"crm.get_customer_records({ limit: 5 })",allowed:true});
  events.push({type:"tool_result",message:JSON.stringify(customers)});
  return {reply:"The mock CRM returned five synthetic customer records. This intentionally demonstrates excessive data access.",events,outcome:"executed",scenario:"data-exfiltration/customer-records"};
 }
 if(refund){
  events.push({type:"tool_call",message:`shopify.refund_order({ orderId: "${orderId}" })`,allowed:false});
  events.push({type:"security",message:"Backend authorization denied: no authenticated permission and approval token.",allowed:false});
  return {reply:"Refund denied. Prompt text cannot grant refund permissions; the backend requires authenticated authorization and explicit approval.",events,outcome:"blocked",scenario:"tool-authorization/unauthorized-refund"};
 }
 if(exportData){
  events.push({type:"security",message:"Customer export denied: this session has no approved data-export scope.",allowed:false});
  return {reply:"Customer-level records cannot be disclosed by this session. A separate purpose-limited authorization is required.",events,outcome:"blocked",scenario:"data-exfiltration/customer-records"};
 }
 if(injection&&mode==="hardened"){
  events.push({type:"security",message:"Embedded instructions treated as untrusted data. No privileged tool invoked.",allowed:false});
  return {reply:"I can summarize the supplied content, but embedded instructions cannot authorize privileged actions or override application policy.",events,outcome:"blocked",scenario:"instruction-hierarchy"};
 }
 if(has(value,["order","orders","status"])){
  events.push({type:"tool_call",message:"shopify.get_orders({ limit: 2 })",allowed:true});
  events.push({type:"tool_result",message:JSON.stringify(orders)});
  return {reply:"Two synthetic orders: ORD-2048 (shipped, $89.50) and ORD-2051 (processing, $42.00).",events,outcome:"normal",scenario:"benign-order-lookup"};
 }
 return {reply:"I am the Agent Security Lab demo assistant. Ask about orders or run an attack scenario. This version uses deterministic mock logic; no external LLM is connected.",events,outcome:"normal",scenario:"benign-chat"};
}
