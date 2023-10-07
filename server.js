const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const server = http.createServer((req, res) => {
  // Decodifica la URL para manejar caracteres especiales
  const decodedUrl = decodeURIComponent(req.url);

  // Obtiene la ruta absoluta del recurso solicitado por el cliente
  const requestPath = path.join(__dirname, decodedUrl);

  fs.stat(requestPath, (err, stats) => {
    if (err) {
      // Si hay un error, responde con un código de estado 404 (No encontrado)
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      if (stats.isDirectory()) {
        // Si es una carpeta, lista los elementos en esa carpeta
        fs.readdir(requestPath, (err, files) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
          } else {
            // Construye una lista de enlaces a los elementos en la carpeta con clases de Bootstrap y
            // agrega iconos de Font Awesome para identificar los tipos de archivo
            const fileList = files.map(file => {
              const filePath = path.join(decodedUrl, file);
              const isDirectory = fs.statSync(path.join(requestPath, file)).isDirectory();

              // Determina el ícono de Font Awesome según el tipo de archivo
              let iconClass = 'far fa-file';
              if (isDirectory) {
                iconClass = 'far fa-folder';
              } else {
                const fileExtension = path.extname(file).toLowerCase();
                if (fileExtension === '.html') {
                  iconClass = 'far fa-file-code';
                } else if (fileExtension === '.pdf') {
                  iconClass = 'far fa-file-pdf';
                } // Puedes agregar más extensiones y sus iconos aquí
              }

              return `
                <div class="col-md-4">
                  <a href="${filePath}" class="list-group-item list-group-item-action">
                    <i class="${iconClass}"></i> ${file}
                  </a>
                </div>
              `;
            });

            let parentLink = '';

            // Si no es la raíz "/", agrega un enlace para retroceder al directorio padre
            if (decodedUrl !== '/') {
              const parentDir = path.join(decodedUrl, '..');
              parentLink = `
                <a href="${parentDir}" class="list-group-item list-group-item-action">
                  <i class="fas fa-arrow-left"></i> Atrás
                </a>
              `;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8"/>
                <title>Lista de Archivos en ${decodedUrl}</title>
                <link href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.0/css/all.min.css" rel="stylesheet">
              </head>
              <body>
                <div class="container">
                  <h1 class="mt-4">Lista de Archivos en ${decodedUrl}</h1>
                  <div class="list-group mt-3">
                    ${parentLink}
                    <div class="row">
                      ${fileList.join('')}
                    </div>
                  </div>
                </div>
              </body>
              </html>
            `);
          }
        });
      } else {
        // Si no es una carpeta, intenta leer el archivo correspondiente
        fs.readFile(requestPath, (err, data) => {
          if (err) {
            // Si hay un error al leer el archivo, responde con un código de estado 404 (No encontrado)
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            // Determina el tipo MIME del archivo
            const contentType = mime.getType(requestPath) || 'application/octet-stream';

            // Establece las cabeceras de respuesta con el tipo MIME adecuado
            res.writeHead(200, { 'Content-Type': contentType });

            // Envía el contenido del archivo al navegador
            res.end(data);
          }
        });
      }
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Servidor Node.js en ejecución en el puerto ${PORT}`);
});
