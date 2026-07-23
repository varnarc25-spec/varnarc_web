import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const baseUrl = __ENV.BASE_URL ?? 'http://127.0.0.1:4000';

export default function () {
  const health = http.get(`${baseUrl}/api/v1/health`);
  check(health, {
    'health status 200': (r) => r.status === 200,
    'health under 300ms': (r) => r.timings.duration < 300,
  });

  const status = http.get(`${baseUrl}/api/v1/status`);
  check(status, { 'status 200': (r) => r.status === 200 });

  sleep(1);
}
