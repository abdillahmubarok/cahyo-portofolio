import { test } from 'node:test'
import assert from 'node:assert/strict'
import { uploadAndRegister, validateImageFile } from '../src/lib/media-upload.ts'

test('MIME and size policy matches the Storage migration', () => {
  for (const type of ['image/jpeg','image/png','image/webp','image/avif']) assert.doesNotThrow(()=>validateImageFile({type,size:20971520}))
  for (const file of [{type:'image/svg+xml',size:1},{type:'image/jpeg',size:20971521},{type:'image/png',size:0}]) assert.throws(()=>validateImageFile(file))
})
test('failed registration compensates a successful upload',async()=>{
  const calls=[]
  const result=await uploadAndRegister({upload:async()=>{calls.push('upload')},register:async()=>{calls.push('register');throw Error('DB offline')},compensate:async()=>{calls.push('cleanup');return {registered:false}}})
  assert.deepEqual(calls,['upload','register','cleanup'])
  assert.deepEqual(result,{registered:false,cleanupPending:false,error:'DB offline'})
})
test('cleanup failure returns explicit retry state instead of losing its path',async()=>{
  const result=await uploadAndRegister({upload:async()=>{},register:async()=>{throw Error('DB offline')},compensate:async()=>{throw Error('Storage offline')}})
  assert.equal(result.cleanupPending,true)
})
test('lost registration response preserves a committed row and object',async()=>{
  const result=await uploadAndRegister({upload:async()=>{},register:async()=>{throw Error('Response lost')},compensate:async()=>({registered:true})})
  assert.equal(result.registered,true)
  assert.equal(result.error,undefined)
})
test('upload failure never registers media or removes another asset',async()=>{
  const result=await uploadAndRegister({upload:async()=>{throw Error('Rejected')},register:async()=>assert.fail('should not register'),compensate:async()=>assert.fail('should not remove')})
  assert.equal(result.registered,false)
  assert.equal(result.cleanupPending,false)
})
