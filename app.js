export default function (express, bodyParser, createReadStream, crypto, http) {
    const app = express();

    app.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,OPTIONS,DELETE');

        if (req.path !== '/' && !req.path.endsWith('/')) {
            const queryIndex = req.originalUrl.indexOf('?');
            const pathname = queryIndex === -1
                ? req.originalUrl
                : req.originalUrl.substring(0, queryIndex);
            const query = queryIndex === -1
                ? ''
                : req.originalUrl.substring(queryIndex);

            return res.redirect(308, pathname + '/' + query);
        }

        next();
    });

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.get('/login/', (req, res) => {
        res.type('text/plain').send('danilaercegovac_3');
    });

    app.get('/code/', (req, res) => {
        res.type('text/plain');

        const filePath = import.meta.url.substring(
            process.platform === 'win32' ? 8 : 7
        );

        const stream = createReadStream(filePath);

        stream.on('error', () => {
            if (!res.headersSent) {
                res.status(500).send('Ошибка чтения файла');
            }
        });

        stream.pipe(res);
    });

    app.get('/sha1/:input/', (req, res) => {
        const hash = crypto
            .createHash('sha1')
            .update(req.params.input)
            .digest('hex');

        res.type('text/plain').send(hash);
    });

    const handleRequest = (req, res) => {
        const addr = req.method === 'POST'
            ? req.body.addr || req.query.addr
            : req.query.addr;

        if (!addr) {
            return res.status(400).type('text/plain').send('Не указан параметр addr');
        }

        let target;

        try {
            target = new URL(addr);

            if (target.protocol !== 'http:') {
                return res.status(400).type('text/plain').send('Поддерживаются только HTTP-адреса');
            }
        } catch {
            return res.status(400).type('text/plain').send('Некорректный адрес');
        }

        http.get(target, (response) => {
            let data = '';

            response.setEncoding('utf8');

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                res.status(response.statusCode || 200)
                    .type('text/plain')
                    .send(data);
            });
        }).on('error', () => {
            if (!res.headersSent) {
                res.status(502).type('text/plain').send('Ошибка получения ресурса');
            }
        });
    };

    app.get('/req/', handleRequest);
    app.post('/req/', handleRequest);

    app.all(/.*/, (req, res) => {
        res.type('text/plain').send('danilaercegovac_3');
    });

    return app;
}