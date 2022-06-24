import express from 'express';
import CargarRoute from "./routes/cargar.route.js";
import RepaRoute from "./routes/repa.route.js";
import RepartidorRoute from "./routes/repartidor.route.js";
import EnRepartoRoute from "./routes/enreparto.route.js";
import SubirRoute from "./routes/subirFile.route.js";
import EnviosRoute from "./routes/envios.route.js";
import InfoRoute from "./routes/info.route.js";
import ConsultaPaqueteRoute from "./routes/consultaPaquete.route.js";
import logger from "./auxi/logger.js";
import bodyParser from 'body-parser';
import fs from 'fs';
import https from 'https';
import http from 'http';
import compression from 'compression';

const app = express();
const privateKey  = fs.readFileSync('./personal/ssl/private.key', 'utf8');
const certificate = fs.readFileSync('./personal/ssl/certificate.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
const httpsSrv = https.createServer(credentials, app);
const httpSrv = http.createServer(app);

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('views', './src/views');
app.set('view engine', 'ejs');

app.use(express.json());
//app.use(express.urlencoded({ extended: true}));
app.use(bodyParser.json({ limit: '1000mb' }));
app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/repa', express.static(path.join(__dirname, 'public')));
app.use('/info', express.static(path.join(__dirname, 'public')));
app.use(compression());

app.use('/', CargarRoute);
app.use("/repa", RepaRoute);
app.use("/repartidor", RepartidorRoute);
app.use("/enreparto", EnRepartoRoute);
app.use("/subir", SubirRoute);
app.use("/envios", EnviosRoute);
app.use("/info", InfoRoute);
app.use("/consultaPaquete", ConsultaPaqueteRoute);

const PORT = 3080;
httpsSrv.listen(PORT, () => {
    logger.info(`Servidor Escuchando Y Listo en https://localhost:${PORT}`)
})
httpSrv.listen(PORT + 1, () => {
    logger.info(`Servidor Escuchando Y Listo en http://localhost:${PORT + 1}`)
})


