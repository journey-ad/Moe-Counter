import { Router } from 'itty-router';
import { genErrorResponse, ResError } from './response';
import * as index from './routes/index';
import * as favicon from './routes/favicon';
import * as image from './routes/image';
import * as api from './routes/api';

const router = Router();

// routes
router.get('/', index.get);
router.get('/favicon.ico', favicon.get);
router.get('/:id', image.get);
router.get('/api/:id', api.get);
// router.delete('/api/:id', api.del);

// 404
router.all('*', async () => {
  throw new ResError(404, 'Route Not Found');
});

addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    router.handle(req, event).catch((e) => genErrorResponse(req, e))
  );
});
