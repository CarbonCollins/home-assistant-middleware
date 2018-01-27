import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import multer from 'multer';
import request from 'request';

const upload = multer({ dest: '/tmp/' });

dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();

app.post('/webhook/plex', upload.single('thumb'), (req, res) => {
  console.log(req);
  if (req && req.query && req.query.key && req.query.key === process.env.WEBHOOK_KEY) {
    if (req.body && req.body.payload && (typeof req.body.payload === 'string')) {
      try {
        const payload = JSON.parse(req.body.payload) || {};
        if (payload.Player && payload.Player.uuid && payload.Player.uuid === process.env.PLEX_PLAYER_UUID && payload.event) {
          let scriptId = '';
          if (payload.event === 'media.resume') {
            scriptId = process.env.PLEX_RESUME_SCRIPT;
          } else if (payload.event === 'media.play') {
            scriptId = process.env.PLEX_PLAY_SCRIPT;
          } else if (payload.event === 'media.pause') {
            scriptId = process.env.PLEX_PAUSE_SCRIPT;
          } else if (payload.event === 'media.stop') {
            scriptId = process.env.PLEX_STOP_SCRIPT;
          }

          if (scriptId !== '') {
            const options = {
              url: `${process.env.HA_PROTOCOL}://${process.env.HA_HOST}:${process.env.HA_PORT}/api/services/script/${scriptId}`,
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              qs: { api_password: process.env.HA_API_KEY },
              rejectUnauthorized: false,
              requestCert: true,
              agent: false
            };

            request(options);
          }
          console.log(payload);
        }
        res.status(200).send();
      } catch (err) {
        console.error(err);
        res.status(400).send();
      }
    } else {
      res.status(400).send();
    }
  } else {
    res.status(403).send();
  }
});

app.listen(3000, () => {
  console.log('started');
});

console.log(process.env.SERVER_PORT);
