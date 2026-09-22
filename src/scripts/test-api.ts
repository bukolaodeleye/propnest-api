import 'dotenv/config';
import { prisma } from '../lib/prisma.js';

async function fetchJson(path: string, options: RequestInit = {}) {
  const res = await fetch(`http://localhost:3001${path}`, options);
  let json;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  return { status: res.status, json };
}

async function main() {
  let res;

  // We keep some basic read tests to verify regressions (Part S)
  console.log('--- Read Regression Tests ---');
  res = await fetchJson('/api/v1/health');
  console.log(`GET /api/v1/health -> ${res.status}`);
  res = await fetchJson('/api/v1/agents');
  console.log(`GET /api/v1/agents -> ${res.status}`);
  res = await fetchJson('/api/v1/properties?limit=5000');
  console.log(`GET /api/v1/properties?limit=5000 -> ${res.status}, limit: ${res.json.meta?.limit}`);

  console.log('\n--- Part S: Automated Write API verification ---');
  
  // 1. Grab a valid Property
  const propRes = await fetchJson('/api/v1/properties');
  const validPropertyId = propRes.json.data[0].id;

  // 1. Valid POST
  const postData = {
    propertyId: validPropertyId,
    customerName: "Ada Okafor",
    customerEmail: "ada@example.com",
    customerPhone: "+2348012345678",
    scheduledAt: "2026-10-10T10:00:00.000Z"
  };
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData)
  });
  console.log(`POST /api/v1/viewings (valid) -> ${res.status}, id: ${res.json.data?.id}`);
  const createdViewingId = res.json.data?.id;

  // 2. Default status is pending
  console.log(`Default status -> ${res.json.data?.status === 'pending'}`);

  // 3. Missing customerEmail -> 422 and field named
  const missingEmailData = { ...postData };
  // @ts-ignore
  delete missingEmailData.customerEmail;
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(missingEmailData)
  });
  console.log(`POST missing customerEmail -> ${res.status}, message: ${res.json.error?.message}`);

  // 4. Invalid email -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, customerEmail: 'not-an-email' })
  });
  console.log(`POST invalid email -> ${res.status}, message: ${res.json.error?.message}`);

  // 5. Invalid propertyId format -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, propertyId: 'banana' })
  });
  console.log(`POST invalid propertyId format -> ${res.status}, message: ${res.json.error?.message}`);

  // 6. Nonexistent Property UUID -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, propertyId: '00000000-0000-0000-0000-000000000000' })
  });
  console.log(`POST nonexistent Property UUID -> ${res.status}, code: ${res.json.error?.code}`);

  // 7. Invalid scheduledAt -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, scheduledAt: 'tomorrow sometime' })
  });
  console.log(`POST invalid scheduledAt -> ${res.status}, message: ${res.json.error?.message}`);

  // 8. Invalid status -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, status: 'waitingForever' })
  });
  console.log(`POST invalid status -> ${res.status}, message: ${res.json.error?.message}`);

  // 9. Unexpected server-owned field -> 422
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...postData, id: 'some-id' })
  });
  console.log(`POST unexpected id -> ${res.status}, message: ${res.json.error?.message}`);

  // 10. Valid PATCH -> 200
  // 11. PATCH changes only supplied field
  res = await fetchJson(`/api/v1/viewings/${createdViewingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' })
  });
  console.log(`PATCH status=confirmed -> ${res.status}, status: ${res.json.data?.status}, name stays: ${res.json.data?.customerName === 'Ada Okafor'}`);

  // 12. Empty PATCH -> 422
  res = await fetchJson(`/api/v1/viewings/${createdViewingId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  console.log(`PATCH empty body -> ${res.status}, message: ${res.json.error?.message}`);

  // 13. PATCH malformed route UUID -> 400
  res = await fetchJson(`/api/v1/viewings/banana`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' })
  });
  console.log(`PATCH malformed UUID -> ${res.status}, code: ${res.json.error?.code}`);

  // 14. PATCH missing Viewing -> 404
  res = await fetchJson(`/api/v1/viewings/00000000-0000-0000-0000-000000000000`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'confirmed' })
  });
  console.log(`PATCH nonexistent viewing -> ${res.status}, code: ${res.json.error?.code}`);

  // Malformed JSON test (Part O)
  res = await fetchJson('/api/v1/viewings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"customerName":'
  });
  console.log(`POST malformed JSON -> ${res.status}, code: ${res.json.error?.code}`);

  // 15. DELETE existing test Viewing -> 200
  res = await fetchJson(`/api/v1/viewings/${createdViewingId}`, {
    method: 'DELETE'
  });
  console.log(`DELETE existing viewing -> ${res.status}, deleted: ${res.json.data?.deleted}`);

  // 16. GET deleted Viewing -> 404
  res = await fetchJson(`/api/v1/viewings/${createdViewingId}`);
  console.log(`GET deleted viewing -> ${res.status}, code: ${res.json.error?.code}`);

  // 17. DELETE already-deleted Viewing -> 404
  res = await fetchJson(`/api/v1/viewings/${createdViewingId}`, {
    method: 'DELETE'
  });
  console.log(`DELETE already-deleted viewing -> ${res.status}, code: ${res.json.error?.code}`);

  // 18. malformed DELETE UUID -> 400
  res = await fetchJson(`/api/v1/viewings/banana`, {
    method: 'DELETE'
  });
  console.log(`DELETE malformed UUID -> ${res.status}, code: ${res.json.error?.code}`);

  console.log('\n--- Part J/K: Explicit Hardening & No-500 assertions ---');
  let failures = 0;
  async function assertNot500(name: string, p: string, m: string = 'GET', b: any = null) {
    const opts: RequestInit = { method: m };
    if (b) {
      opts.headers = { 'Content-Type': 'application/json' };
      opts.body = JSON.stringify(b);
    }
    const rr = await fetchJson(p, opts);
    console.log(`${name} -> ${rr.status}`);
    if (rr.status === 500) {
      console.error(`FAILURE: ${name} returned 500!`);
      failures++;
    }
    return rr;
  }

  // 1. Excessive limit
  const h1 = await assertNot500('1. Excessive limit', '/api/v1/properties?limit=5000');
  console.log(`  -> limit: ${h1.json.meta?.limit}, records: ${h1.json.data?.length}`);

  // 2. Negative offset
  await assertNot500('2. Negative offset', '/api/v1/properties?offset=-1');

  // 3. Invalid offset type
  await assertNot500('3. Invalid offset type', '/api/v1/properties?offset=banana');

  // 4. Unknown sort field
  await assertNot500('4. Unknown sort field', '/api/v1/properties?sort=banana');

  // 5. Invalid sort order
  await assertNot500('5. Invalid sort order', '/api/v1/properties?sort=price&order=sideways');

  // 6. Malformed identifier
  await assertNot500('6. Malformed identifier', '/api/v1/properties/not-a-uuid');

  // 7. Valid but nonexistent identifier
  await assertNot500('7. Valid nonexistent id', '/api/v1/properties/00000000-0000-0000-0000-000000000000');

  // 8. Missing required POST field
  const missingEmailBody = { ...postData };
  // @ts-ignore
  delete missingEmailBody.customerEmail;
  await assertNot500('8. Missing POST field', '/api/v1/viewings', 'POST', missingEmailBody);

  // 9. Invalid enum filter
  await assertNot500('9. Invalid enum filter', '/api/v1/properties?propertyType=castle');

  // 10. Invalid price range
  await assertNot500('10. Invalid price range', '/api/v1/properties?minPrice=100000000&maxPrice=10000000');

  // 11. Invalid Viewing status body
  await assertNot500('11. Invalid status body', '/api/v1/viewings', 'POST', { ...postData, status: 'waitingForever' });

  // 12. Invalid referenced Property
  await assertNot500('12. Invalid referenced Property', '/api/v1/viewings', 'POST', { ...postData, propertyId: '00000000-0000-0000-0000-000000000000' });

  // 13. Malformed JSON
  const rr = await fetchJson('/api/v1/viewings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"customerName":' });
  console.log(`13. Malformed JSON -> ${rr.status}`);
  if (rr.status === 500) failures++;

  // 14. Unknown API route
  await assertNot500('14. Unknown API route', '/api/v1/bananas');

  if (failures > 0) {
    console.error(`\nFound ${failures} instances of HTTP 500 during hardening!`);
    process.exit(1);
  }

  // Final Viewing database count
  const count = await prisma.viewing.count();
  console.log(`\nFinal Viewing database count -> ${count}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
