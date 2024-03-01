import axios from 'axios';

// const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/'

const BASE_URL = 'https://www.googleapis.com/';

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
