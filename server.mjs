import { createServer } from 'http';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

console.log('Initialisation du serveur Jël Tix...');

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Serveur Jël Tix prêt sur http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Erreur lors du démarrage du serveur:', err);
});
