import 'dotenv/config';

async function main() {
  const maxRequests = 100;
  const attempts = 110;
  let blocked = false;
  let retryAfter: string | null = null;
  let blockedStatus = 0;
  let blockedBody: any = null;
  let acceptedRequests = 0;

  console.log(`--- Part H: Rate Limit Verification ---`);
  console.log(`Sending up to ${attempts} requests to /api/v1/health...`);

  for (let i = 1; i <= attempts; i++) {
    const res = await fetch('http://localhost:3001/api/v1/health');
    if (res.status === 429) {
      blocked = true;
      blockedStatus = res.status;
      retryAfter = res.headers.get('retry-after');
      try {
        blockedBody = await res.json();
      } catch (e) {
        blockedBody = await res.text();
      }
      console.log(`\nBlocked at request #${i}`);
      break;
    } else if (res.status === 200) {
      acceptedRequests++;
      process.stdout.write('.');
    } else {
      console.error(`\nUnexpected status ${res.status} at request #${i}`);
      break;
    }
  }

  if (!blocked) {
    console.error(`\nFAILURE: Did not receive 429 after ${attempts} requests!`);
    process.exit(1);
  }

  console.log(`\nAccepted requests before blocking: ${acceptedRequests}`);
  console.log(`Blocked Status: ${blockedStatus}`);
  console.log(`Retry-After Header: ${retryAfter}`);
  console.log(`Blocked Body: ${JSON.stringify(blockedBody)}`);

  if (!retryAfter) {
    console.error(`\nFAILURE: Retry-After header is missing!`);
    process.exit(1);
  }

  if (blockedBody?.error?.code !== 'RATE_LIMIT_EXCEEDED') {
    console.error(`\nFAILURE: Missing or invalid error envelope on 429 response!`);
    process.exit(1);
  }

  console.log('\nRate Limit verification passed!');
}

main().catch(console.error);
