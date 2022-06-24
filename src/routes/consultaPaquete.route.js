import express  from 'express';
const routerConsulta = express.Router();
import { conSenderId, buscarEntrega, actualizarEstadoPaquete } from '../auxi/conBD.js';

routerConsulta.get("/:id", async (req, res) => {
    const idEntrega = req.params.id;
    if (idEntrega == undefined || idEntrega == null) {
        res.status(200).send({rsdo: 'No se ha recibido el id del envio', ok: 0});
    } else {
        try {  
            const senderId = await conSenderId(idEntrega);
            if (senderId == '') {
                res.status(200).json({rsdo: 'No se Encontraron Datos del Paquete.', ok: 0});
            } else {
                const paquete = await buscarEntrega(senderId, idEntrega)
                actualizarEstadoPaquete(idEntrega, paquete.envio.status)
                res.status(200).json({rsdo: paquete, ok: 1});
            }
        } catch (error) {
            console.error(error);
            res.status(200).json({rsdo: error, ok: 0});
        }
    }
});

export default routerConsulta;