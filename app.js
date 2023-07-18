const express = require('express');
const redis = require('redis');
const responseTime = require('response-time');
const axios = require('axios');
const { promisify } = require('util');

const app = express();

app.use(responseTime());

const redisClient = redis.createClient({
  host: '127.0.0.1',
  port: 6379,
});

const GET_ASYNC = promisify(redisClient.get).bind(redisClient);
const SET_ASYNC = promisify(redisClient.set).bind(redisClient);

app.get('/rockets', async (req, res, next) => {
  try {
    const reply = await GET_ASYNC('rockets');
    if (reply) {
      console.log('used cached data');
      res.send(JSON.parse(reply));
      return;
    }
    const resp = await axios.get('https://api.spacexdata.com/v3/rockets');
    const saveResult = await SET_ASYNC(
      'rockets',
      JSON.stringify(resp.data),
      'EX',
      5
    );
    console.log('New data has been cached, ', saveResult);
    res.send(resp?.data || []);
  } catch (error) {
    res.send({
      success: false,
      message: error.message || 'Failed to load rockets',
    });
  }
});

app.listen(3000, () => console.log('Server is up and running on port 3000'));
