const axios = require('axios');

async function main() {
  const base = 'http://localhost:3001';

  const login = await axios.post(`${base}/api/auth/login`, {
    email: 'admin@projectmanager.com',
    password: 'admin123'
  });

  const token = login.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  const me = await axios.get(`${base}/api/auth/me`, { headers });
  const projects = await axios.get(`${base}/api/projects`, { headers });
  const myTasks = await axios.get(`${base}/api/tasks/my`, { headers });

  console.log(JSON.stringify({
    loginUser: login.data.user,
    me: me.data,
    projects: projects.data.length,
    myTasks: myTasks.data.length
  }, null, 2));
}

main().catch((e) => {
  console.error(e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
