import express  from 'express';
const routerRepartidor = express.Router();
import { conNombreRepa } from '../auxi/conBD.js';


routerRepartidor.get("/", async (req, res) => {
    const repa = req.query.repa;
    const nombre = await conNombreRepa(repa);       
    res.status(200).json({nombre: nombre});                      
});

export default routerRepartidor;