import axios from 'axios';

// const BASE_URL = https://api-jb2.integrations.ecimanufacturing.com:443/api/v1/

const BASE_URL = 'https://api-jb2.integrations.ecimanufacturing.com:443/api/v1';

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
