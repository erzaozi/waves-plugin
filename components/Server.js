import { pluginResources } from '../model/path.js';
import Waves from "./Code.js";
import Config from "./Config.js";
import express from 'express';
import fs from 'fs/promises';

class Server {
    constructor() {
        this.app = express();
        this.data = {};
        this.server = null;
        this.init();
    }

    async init() {
        this.app.use(express.json());
        await this.checkServer();

        setInterval(() => {
            this.checkServer();
        }, 5000);

        this.app.get('/login/:id', async (req, res) => {
            const id = req.params.id;
            const filePath = this.data[id] ? '/server/login.html' : '/server/error.html';

            try {
                let data = await fs.readFile(pluginResources + filePath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                if (this.data[id]) {
                    data = data.replace(/undefined/g, this.data[id].user_id);
                }
                data = data.replace(/background_image/g, await Config.getConfig().background_api);
                res.send(data);
            } catch (error) {
                logger.mark(logger.blue('[WAVES PLUGIN]'), logger.red(`发送登录页失败：\n${error}}`));
                res.status(500).send('Internal Server Error');
            }
        });

        this.app.post('/code/:id', async (req, res) => {
            const id = req.params.id;
            const { mobile, code } = req.body;

            if (!this.data[id]) return res.status(200).json({ code: 400, msg: 'Authorization is required' });
            if (!mobile || !code) return res.status(200).json({ code: 400, msg: 'Unable to retrieve mobile number and verification code' });

            const waves = new Waves();
            const data = await waves.getToken(mobile, code);

            if (!data.status) return res.status(200).json({ code: 400, msg: data.msg });
            this.data[id].token = data.data.token;
            return res.status(200).json({ code: 200, msg: 'Login successful' });
        });

        this.app.use((req, res) => {
            res.redirect('https://github.com/erzaozi/waves-plugin');
        });
    }

    async checkServer() {
        const allowLogin = Config.getConfig().allow_login;

        if (allowLogin && !this.server) {
            const port = await Config.getConfig().server_port;
            this.server = this.app.listen(port, () => {
                logger.mark(logger.blue('[Waves PLUGIN]'), logger.white(`在线登录服务端点`), logger.green(`http://localhost:${port}`));
            });
        }

        if (!allowLogin && this.server) {
            this.server.close((error) => {
                if (error) {
                    logger.mark(logger.blue('[Waves PLUGIN]'), logger.white(`无法关闭登录服务器`), logger.red(error));
                } else {
                    logger.mark(logger.blue('[Waves PLUGIN]'), logger.white(`已关闭登录服务器`));
                }
            });
            this.server = null;
        }
    }
}

export default new Server();