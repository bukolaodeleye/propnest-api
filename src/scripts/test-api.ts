import 'dotenv/config';

async function fetchJson(path: string) {
  const res = await fetch(`http://localhost:3001${path}`);
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  let res;

  console.log('--- Part P: Manual API verification ---');
  
  // Agents
  res = await fetchJson('/api/v1/agents');
  console.log(`GET /api/v1/agents -> ${res.status}, records: ${res.json.data?.length}, total: ${res.json.meta?.total}`);
  
  res = await fetchJson('/api/v1/agents?limit=5&offset=5');
  console.log(`GET /api/v1/agents?limit=5&offset=5 -> ${res.status}, records: ${res.json.data?.length}, limit: ${res.json.meta?.limit}, offset: ${res.json.meta?.offset}`);
  
  const agentId = res.json.data[0].id;
  res = await fetchJson(`/api/v1/agents/${agentId}`);
  console.log(`GET /api/v1/agents/:id -> ${res.status}, agent name: ${res.json.data?.name}`);
  
  res = await fetchJson(`/api/v1/agents/${agentId}/properties`);
  console.log(`GET /api/v1/agents/:id/properties -> ${res.status}, properties: ${res.json.data?.length}, total: ${res.json.meta?.total}`);

  // Properties
  res = await fetchJson('/api/v1/properties');
  console.log(`GET /api/v1/properties -> ${res.status}, records: ${res.json.data?.length}, total: ${res.json.meta?.total}`);

  res = await fetchJson('/api/v1/properties?limit=10&offset=20');
  console.log(`GET /api/v1/properties?limit=10&offset=20 -> ${res.status}, records: ${res.json.data?.length}`);

  const propertyId = res.json.data[0].id;
  res = await fetchJson(`/api/v1/properties/${propertyId}`);
  console.log(`GET /api/v1/properties/:id -> ${res.status}, property title: ${res.json.data?.title}, agent nested: ${!!res.json.data?.agent}`);

  // Viewings
  res = await fetchJson('/api/v1/viewings');
  console.log(`GET /api/v1/viewings -> ${res.status}, records: ${res.json.data?.length}, total: ${res.json.meta?.total}`);

  const viewingId = res.json.data[0].id;
  res = await fetchJson(`/api/v1/viewings/${viewingId}`);
  console.log(`GET /api/v1/viewings/:id -> ${res.status}, viewing id: ${res.json.data?.id}`);

  console.log('\n--- Part Q: Ugly pagination tests ---');
  res = await fetchJson('/api/v1/properties?limit=5000');
  console.log(`GET /api/v1/properties?limit=5000 -> ${res.status}, limit applied: ${res.json.meta?.limit}, records: ${res.json.data?.length}`);

  res = await fetchJson('/api/v1/properties?offset=-1');
  console.log(`GET /api/v1/properties?offset=-1 -> ${res.status}, code: ${res.json.error?.code}`);

  res = await fetchJson('/api/v1/properties?limit=banana');
  console.log(`GET /api/v1/properties?limit=banana -> ${res.status}, code: ${res.json.error?.code}`);

  res = await fetchJson('/api/v1/properties?limit=20&offset=1000');
  console.log(`GET /api/v1/properties?limit=20&offset=1000 -> ${res.status}, records: ${res.json.data?.length}, hasMore: ${res.json.meta?.hasMore}`);

  console.log('\n--- Part R: ID error tests ---');
  res = await fetchJson('/api/v1/properties/not-a-uuid');
  console.log(`GET /api/v1/properties/not-a-uuid -> ${res.status}, code: ${res.json.error?.code}`);

  res = await fetchJson('/api/v1/properties/00000000-0000-0000-0000-000000000000');
  console.log(`GET /api/v1/properties/<nonexistent-uuid> -> ${res.status}, code: ${res.json.error?.code}`);

  console.log('\n--- Part S: Unknown-route test ---');
  res = await fetchJson('/api/v1/bananas');
  console.log(`GET /api/v1/bananas -> ${res.status}, code: ${res.json.error?.code}`);
}

main().catch(console.error);
