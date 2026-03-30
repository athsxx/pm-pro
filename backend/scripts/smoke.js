require('dotenv').config();

const axios = require('axios');

async function main() {
  const base = 'http://localhost:3001';

  const smokePassword =
    process.env.SMOKE_PASSWORD ||
    process.env.POC_DEFAULT_PASSWORD ||
    'pocchangeme';

  const login = await axios.post(`${base}/api/auth/login`, {
    email: 'admin1@poc.local',
    password: smokePassword
  });

  const token = login.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  const me = await axios.get(`${base}/api/auth/me`, { headers });
  const projects = await axios.get(`${base}/api/projects`, { headers });
  const myTasks = await axios.get(`${base}/api/tasks/my`, { headers });
  const users = await axios.get(`${base}/api/users`, { headers });

  console.log(JSON.stringify({
    loginUser: login.data.user,
    me: me.data,
    projects: projects.data.length,
    myTasks: myTasks.data.length,
    users: users.data.length
  }, null, 2));
}

main().catch((e) => {
  const msg =
    e.code === 'ECONNREFUSED'
      ? 'ECONNREFUSED — start the API on port 3001 (e.g. cd backend && node src/index.js)'
      : e.response?.data || e.message || String(e);
  console.error(e.response?.status, msg);
  process.exit(1);
});
