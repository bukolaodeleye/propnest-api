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

  // 19. Final Viewing database count
  const count = await prisma.viewing.count();
  console.log(`Final Viewing database count -> ${count}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
