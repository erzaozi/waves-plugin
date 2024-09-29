import { pluginResources } from '../model/path.js';
import Waves from "./Code.js";
import Config from "./Config.js";
import express from 'express';
import fs from 'fs/promises';

class Server {
    constructor() {
        this.data = {};
        this.init();
    }

    async init() {
        const app = express();
        app.use(express.json());
        const port = await Config.getConfig().server_port;

        if (!Config.getConfig().allow_login) return;
        app.listen(port, () => {
            logger.mark(
                logger.blue('[Waves PLUGIN]') +
                ' 登录服务端点：' +
                logger.green(`http://localhost:${port}`)
            );
        });

        app.get('/login/:id', async (req, res) => {
            const id = req.params.id;
            const filePath = this.data[id] ? '/server/login.html' : '/server/error.html';

            try {
                let data = await fs.readFile(pluginResources + filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                if (this.data[id]) {
                    res.setHeader('userId', this.data[id].user_id);
                }
                res.send(data);
            } catch (err) {
                logger.error(err);
                res.status(500).send('Internal Server Error');
            }
        });

        app.post('/code/:id', async (req, res) => {
            const id = req.params.id;
            const { mobile, code } = req.body;

            if (!this.data[id]) return res.status(200).json({ code: 400, msg: 'Authorization is required' });
            if (!mobile || !code) return res.status(200).json({ code: 400, msg: 'Unable to retrieve mobile number and verification code' });

            const waves = new Waves();
            const data = await waves.getToken(mobile, code);

            if (!data.status) return res.status(200).json({ code: 400, msg: data.msg });
            this.data[id].token = data.data.token;
            return res.status(200).json({ code: 200, msg: 'Login successful' });
        })

        app.use((req, res) => {
            res.redirect('https://github.com/erzaozi/waves-plugin');
        });
    }
}

export default new Server();