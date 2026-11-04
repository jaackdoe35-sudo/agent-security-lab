import { NextResponse } from "next/server";
import { runAgent, type Mode } from "@/lib/agent";
export const runtime = "nodejs";
export async function POST(request:Request){
 try{
  const body:unknown=await request.json();
  if(!body||typeof body!=="object")return NextResponse.json({error:"Invalid request."},{status:400});
  const {message,mode}=body as {message?:unknown;mode?:unknown};
  if(typeof message!=="string"||!message.trim()||message.length>6000)return NextResponse.json({error:"Message must contain 1–6000 characters."},{status:400});
  const selectedMode:Mode=mode==="vulnerable"?"vulnerable":"hardened";
  return NextResponse.json(runAgent(message,selectedMode));
 }catch{return NextResponse.json({error:"Invalid request."},{status:400});}
}
