import express  from 'express';
const routerCargar = express.Router();
import { conEnvios } from '../auxi/conBD.js';

routerCargar.get("/", async (req, res) => {
    const envios = await conEnvios();       
    res.render('index', { 
                                ruta: 'root',
                                envios: envios
                            });                   
});

export default routerCargar;