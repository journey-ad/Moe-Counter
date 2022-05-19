import settings from '../settings.json';
import { Router } from 'itty-router';
import { genErrorResponse, ResError } from './response';
import { withCORS } from './middlewares';
import * as index from './routes/index';
import * as favicon from './routes/favicon';
import * as robots from './routes/robots';
import * as image from './routes/image';
import * as api from './routes/api';

const router = Router();
router.options('*', withCORS);
router.get('/robots.txt', robots.get);

// enable index page
if (settings.index) {
  router.get('/favicon.ico', favicon.get);
  router.get('/', index.get);
}

// routes
router.get('/:id', image.get);
if (settings.api.get) {
  router.get('/api/:id', api.get);
}
if (settings.api.delete) {
  router.delete('/api/:id', api.del);
}

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
