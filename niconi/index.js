const cors = require('cors');
const express = require('express');
const request = require('request');
const app = express();

app.use(cors({
  origin: '*'
}));

app.get('/niconi-endpoint', (req, res) => {
  const { cardid } = req.query
  const url = 'https://card.niconi.co.ni/cardApi/' + cardid;
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      res.setHeader('Content-Type', 'application/json');
      res.send(body);
    } else {
      res.status(response.statusCode).send(error || '请求失败');
    }
  });
});

app.listen(8089, () => {
  console.log('Server is running on port 8089');
});
