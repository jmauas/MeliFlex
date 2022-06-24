import express  from 'express';
const routerEnvios = express.Router();
import { conEnvios } from '../auxi/conBD.js';

routerEnvios.get("/", async (req, res) => {
    const envios = await conEnvios();       
    res.status(200).json(envios);                    
});

export default routerEnvios;
