const axios = require('axios');
const config = require('./config');

const api = axios.create({
  baseURL: `${config.backendUrl}/api/print-agent`,
  timeout: 15000,
  headers: { 'x-print-agent-key': config.printAgentKey },
});

/** Catch-up queue: orders confirmed while this agent was offline/disconnected. */
const fetchPendingJobs = async () => {
  const res = await api.get('/jobs');
  return res.data.data.orders;
};

const reportPrintResult = async (orderId, success, error) => {
  await api.post(`/jobs/${orderId}/result`, {
    success,
    error: error ? String(error).slice(0, 500) : undefined,
  });
};

module.exports = { fetchPendingJobs, reportPrintResult };
