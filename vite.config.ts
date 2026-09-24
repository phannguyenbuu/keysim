import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

function liveReloadPlugin(): Plugin {
  return {
    name: 'live-reload-all',
    configureServer(server) {
      server.watcher.add([
        'public/keysim/custom_image_engine.js',
        'public/keysim/index.html',
        'public/keysim/static/**',
        'index.html',
        'src/**'
      ]);

      server.watcher.on('change', (file) => {
        if (file.includes('data') || file.endsWith('.json') || file.includes('scratch') || file.endsWith('.log') || file.endsWith('.png')) {
          return;
        }
        console.log('[hot-reload] File changed: ' + file + ' -> Triggering browser reload...');
        server.ws.send({
          type: 'full-reload',
          path: '*'
        });
      });
    },
    handleHotUpdate({ server, file }) {
      if (file.includes('data') || file.endsWith('.json') || file.includes('scratch') || file.endsWith('.log') || file.endsWith('.png')) {
        return [];
      }
      console.log('[hot-update] ' + file);
      server.ws.send({
        type: 'full-reload',
        path: '*'
      });
    }
  };
}

function keysimApiPlugin(): Plugin {
  return {
    name: 'keysim-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const urlWithoutQuery = rawUrl.split('?')[0];

        // 1. GET & PUT /api/render-settings
        if (urlWithoutQuery === '/api/render-settings') {
          const filePath = path.resolve(__dirname, 'public/data/render_settings.json');
          const distPath = path.resolve(__dirname, 'dist/data/render_settings.json');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            if (fs.existsSync(filePath)) {
              return fs.createReadStream(filePath).pipe(res);
            }
            return res.end(JSON.stringify({
              primaryIntensity: 1.00,
              primaryColor: '#fffdf5',
              sunAngle: -60,
              sunHeight: 6.0,
              secIntensity: 0.80,
              secColor: '#dbeafe',
              secAngle: -5,
              secHeight: 7.0,
              ambientIntensity: 0.10,
              ambientColor: '#ffffff',
              lightIntensity: 1.00,
              brightness: 1.00,
              contrast: 1.25,
              hue: 0.0,
              saturation: 1.00,
              lightness: 1.00,
            }));
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const str = JSON.stringify(parsed, null, 2);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, str, 'utf-8');
                if (fs.existsSync(path.dirname(distPath))) {
                  fs.writeFileSync(distPath, str, 'utf-8');
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(str);
              } catch (e: any) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
        }

        // 1b. GET /api/colorways & GET/PUT /api/colorways/:id
        if (urlWithoutQuery === '/api/colorways' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          const filePath = path.resolve(__dirname, 'public/data/colorways.json');
          if (fs.existsSync(filePath)) {
            return fs.createReadStream(filePath).pipe(res);
          }
          return res.end(JSON.stringify([]));
        }

        const cwIdMatch = urlWithoutQuery.match(/^\/api\/colorways\/([a-zA-Z0-9_\-\.]+)$/);
        if (cwIdMatch) {
          const targetId = cwIdMatch[1];
          const filePath = path.resolve(__dirname, 'public/data/colorways.json');
          const distPath = path.resolve(__dirname, 'dist/data/colorways.json');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            if (fs.existsSync(filePath)) {
              try {
                const list = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const found = Array.isArray(list) ? list.find((c: any) => c.id === targetId) : null;
                if (found) {
                  return res.end(JSON.stringify({ id: found.id, label: found.label, data: found }));
                }
              } catch (err) {}
            }
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Colorway not found' }));
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const cwData = JSON.parse(body);
                let list: any[] = [];
                if (fs.existsSync(filePath)) {
                  list = JSON.parse(fs.readFileSync(filePath, 'utf-8')) || [];
                }
                const prevId = cwData.previousId || targetId;
                const idx = list.findIndex((c: any) => c.id === prevId || c.id === targetId);
                delete cwData.previousId;
                if (idx >= 0) {
                  list[idx] = cwData;
                } else {
                  list.push(cwData);
                }
                const str = JSON.stringify(list, null, 2);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, str, 'utf-8');
                if (fs.existsSync(path.dirname(distPath))) {
                  fs.writeFileSync(distPath, str, 'utf-8');
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(JSON.stringify({ status: 'ok', data: cwData }));
              } catch (e: any) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
        }

        // 2. GET /api/colors/:tab
        const colorMatch = urlWithoutQuery.match(/^\/api\/colors\/([a-zA-Z0-9_-]+)$/);
        if (colorMatch && req.method === 'GET') {
          const tab = colorMatch[1].toLowerCase();
          const filePath = path.resolve(__dirname, 'public/data/colors/' + tab + '.json');
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          if (fs.existsSync(filePath)) {
            return fs.createReadStream(filePath).pipe(res);
          }
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Not found' }));
        }

        // 3. PUT /api/:tab/go
        const goMatch = urlWithoutQuery.match(/^\/api\/([a-zA-Z0-9_-]+)\/go$/);
        if (goMatch && req.method === 'PUT') {
          const tab = goMatch[1].toLowerCase();
          const filePath = path.resolve(__dirname, 'public/data/colors/' + tab + '.json');
          const distPath = path.resolve(__dirname, 'dist/data/colors/' + tab + '.json');
          let body = '';
          req.on('data', (chunk) => { body += chunk; });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body) || {};
              let current: Record<string, any> = {};
              if (fs.existsSync(filePath)) {
                current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              }
              const items = payload.items || [];
              const deleted = new Set(payload.deleted || []);
              
              const newData: Record<string, any> = {};
              for (const [k, v] of Object.entries(current)) {
                if (!deleted.has(k)) {
                  newData[k] = v;
                }
              }
              for (const item of items) {
                const oldK = (item.old_key || '').trim();
                const newK = (item.new_key || '').trim();
                if (!newK) continue;
                if (oldK && oldK !== newK && newData[oldK]) {
                  delete newData[oldK];
                }
                newData[newK] = {
                  bg: item.bg_color || item.bg || '#ffffff',
                  text: item.text_color || item.text || '#000000',
                };
              }
              const str = JSON.stringify(newData, null, 2);
              fs.mkdirSync(path.dirname(filePath), { recursive: true });
              fs.writeFileSync(filePath, str, 'utf-8');
              if (fs.existsSync(path.dirname(distPath))) {
                fs.writeFileSync(distPath, str, 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              return res.end(JSON.stringify({ status: 'ok' }));
            } catch (e: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({ error: e.message }));
            }
          });
          return;
        }

        // 4. GET & PUT /api/3d-transforms
        if (urlWithoutQuery === '/api/3d-transforms') {
          const filePath = path.resolve(__dirname, 'public/data/3d_transforms.json');
          const distPath = path.resolve(__dirname, 'dist/data/3d_transforms.json');
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            if (fs.existsSync(filePath)) {
              return fs.createReadStream(filePath).pipe(res);
            }
            return res.end(JSON.stringify({
              base: { x: -0.60, y: -0.35, z: 0.10, rx: 0.10472, rxDeg: 6.0, scaleX: 1.14, scaleZ: 1.14 },
              clusterOffsets: {
                nav_cluster: { x: -0.42, z: 0.00 },
                arrow_cluster: { x: -0.16, z: -0.09 },
                rctl: { x: -0.67, z: 0.00 },
              }
            }));
          } else if (req.method === 'PUT') {
            let body = '';
            req.on('data', (chunk) => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const str = JSON.stringify(parsed, null, 2);
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.writeFileSync(filePath, str, 'utf-8');
                if (fs.existsSync(path.dirname(distPath))) {
                  fs.writeFileSync(distPath, str, 'utf-8');
                }
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.end(JSON.stringify({ status: 'ok', data: parsed }));
              } catch (e: any) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
        }

        next();
      });
    }
  };
}

function serveKeysimPlugin(): Plugin {
  return {
    name: 'serve-keysim-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const urlWithoutQuery = rawUrl.split('?')[0];
        if (urlWithoutQuery === '/keysim' || urlWithoutQuery.startsWith('/keysim/')) {
          let relPath = urlWithoutQuery.slice('/keysim'.length);
          if (!relPath || relPath === '/') {
            relPath = '/index.html';
          }
          const filePath = path.resolve(__dirname, 'public/keysim', '.' + relPath);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.html': 'text/html; charset=utf-8',
              '.js': 'application/javascript; charset=utf-8',
              '.mjs': 'application/javascript; charset=utf-8',
              '.css': 'text/css; charset=utf-8',
              '.json': 'application/json; charset=utf-8',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.svg': 'image/svg+xml',
              '.glb': 'model/gltf-binary',
              '.fbx': 'application/octet-stream',
              '.woff': 'font/woff',
              '.woff2': 'font/woff2',
              '.ttf': 'font/ttf',
              '.ico': 'image/x-icon',
              '.map': 'application/json'
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-cache');
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), liveReloadPlugin(), keysimApiPlugin(), serveKeysimPlugin()],
  server: {
    port: 5174,
    host: true,
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/scratch/**', '**/*.log', '**/*.png', '**/dist/**']
    },
    headers: {
      'Cache-Control': 'no-store'
    },
    proxy: {
      '/api/store-data': {
        target: 'http://103.163.219.87:8088',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://103.163.219.87:8088',
        changeOrigin: true,
      },
      '/api/upload': {
        target: 'http://103.163.219.87:8088',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://103.163.219.87:8088',
        changeOrigin: true,
      },
    }
  },
  preview: {
    port: 5174,
    host: true
  }
});
