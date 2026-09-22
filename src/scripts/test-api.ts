import 'dotenv/config';

async function fetchJson(path: string) {
  const res = await fetch(`http://localhost:3001${path}`);
  const json = await res.json();
  return { status: res.status, json };
}

async function main() {
  let res;

  console.log('--- Part T: Automated local API verification ---');
  
  // 1. Agent city filtering
  res = await fetchJson('/api/v1/agents?city=Lagos');
  console.log(`1. Agent city=Lagos -> ${res.status}, records: ${res.json.data?.length}, all match Lagos: ${res.json.data?.every((a: any) => a.city.toLowerCase() === 'lagos')}`);

  // 2. Agent sorting
  res = await fetchJson('/api/v1/agents?sort=name&order=asc');
  console.log(`2. Agent sort=name&order=asc -> ${res.status}, first agent name: ${res.json.data?.[0]?.name}`);

  // 3. Property city filtering
  res = await fetchJson('/api/v1/properties?city=Abuja');
  console.log(`3. Property city=Abuja -> ${res.status}, records: ${res.json.data?.length}`);

  // 4. Property enum filtering
  res = await fetchJson('/api/v1/properties?propertyType=apartment&listingType=rent');
  console.log(`4. Property propertyType=apartment&listingType=rent -> ${res.status}, records: ${res.json.data?.length}`);

  // 5. Property price range
  res = await fetchJson('/api/v1/properties?minPrice=1000000&maxPrice=5000000');
  console.log(`5. Property minPrice/maxPrice -> ${res.status}, records: ${res.json.data?.length}`);

  // 6. Property price ascending
  res = await fetchJson('/api/v1/properties?sort=price&order=asc');
  console.log(`6. Property sort=price asc -> ${res.status}, first price: ${res.json.data?.[0]?.price}`);

  // 7. Property price descending
  res = await fetchJson('/api/v1/properties?sort=price&order=desc');
  console.log(`7. Property sort=price desc -> ${res.status}, first price: ${res.json.data?.[0]?.price}`);

  // 8. Combined Property filtering + pagination
  res = await fetchJson('/api/v1/properties?listingType=sale&limit=5&offset=5');
  console.log(`8. Combined filter+pagination -> ${res.status}, records: ${res.json.data?.length}, hasMore: ${res.json.meta?.hasMore}`);

  // 9. Invalid Property sort field -> 400
  res = await fetchJson('/api/v1/properties?sort=banana');
  console.log(`9. Invalid sort=banana -> ${res.status}, code: ${res.json.error?.code}`);

  // 10. Invalid Property order -> 400
  res = await fetchJson('/api/v1/properties?sort=price&order=sideways');
  console.log(`10. Invalid order=sideways -> ${res.status}, code: ${res.json.error?.code}`);

  // 11. Invalid Property enum -> 400
  res = await fetchJson('/api/v1/properties?propertyType=castle');
  console.log(`11. Invalid propertyType=castle -> ${res.status}, code: ${res.json.error?.code}`);

  // 12. Invalid min/max range -> 400
  res = await fetchJson('/api/v1/properties?minPrice=100000000&maxPrice=10000000');
  console.log(`12. Invalid minPrice > maxPrice -> ${res.status}, code: ${res.json.error?.code}`);

  // Grab an agent ID for nested tests
  const agentRes = await fetchJson('/api/v1/agents');
  const agentId = agentRes.json.data[0].id;

  // 13. Nested Agent Properties filtering
  res = await fetchJson(`/api/v1/agents/${agentId}/properties?listingType=sale`);
  console.log(`13. Nested properties listingType=sale -> ${res.status}, records: ${res.json.data?.length}, total matches: ${res.json.meta?.total}`);

  // 14. Nested Agent Properties sorting
  res = await fetchJson(`/api/v1/agents/${agentId}/properties?sort=price&order=asc`);
  console.log(`14. Nested properties sort=price asc -> ${res.status}, records: ${res.json.data?.length}`);

  // Grab a property ID for viewing tests
  const propRes = await fetchJson('/api/v1/properties');
  const propId = propRes.json.data[0].id;

  // 15. Viewing status filtering
  res = await fetchJson('/api/v1/viewings?status=pending');
  console.log(`15. Viewing status=pending -> ${res.status}, records: ${res.json.data?.length}`);

  // 16. Viewing propertyId filtering
  res = await fetchJson(`/api/v1/viewings?propertyId=${propId}`);
  console.log(`16. Viewing propertyId=${propId} -> ${res.status}, records: ${res.json.data?.length}`);

  // 17. Viewing sorting
  res = await fetchJson('/api/v1/viewings?sort=createdAt&order=asc');
  console.log(`17. Viewing sort=createdAt asc -> ${res.status}, records: ${res.json.data?.length}`);

  // 18. Invalid Viewing status -> 400
  res = await fetchJson('/api/v1/viewings?status=flying');
  console.log(`18. Invalid Viewing status=flying -> ${res.status}, code: ${res.json.error?.code}`);

  // 19. Invalid Viewing date -> 400
  res = await fetchJson('/api/v1/viewings?from=2026-12-31&to=2026-01-01');
  console.log(`19. Invalid Viewing dates from > to -> ${res.status}, code: ${res.json.error?.code}`);

}

main().catch(console.error);
