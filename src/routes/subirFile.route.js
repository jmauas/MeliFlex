import express  from 'express';
const routerSubir = express.Router();
import logger from '../auxi/logger.js';
import { execute, proximoID, buscarEntrega, existePaquete, guardarPaquete } from '../auxi/conBD.js';
import { formatoFecha } from '../public/js/auxi.js';

routerSubir.post("/", async (req, res) => {
    const data = req.body;
    const idEnvio = data.data.id
    if (idEnvio == undefined || idEnvio == null) {
        res.status(200).send({rsdo: 'No se ha recibido el id del envio', ok: 0});
    } else {
        const existe = await existePaquete(idEnvio);
        if (existe) {
            res.status(200).send({rsdo: 'Paquete Ya Registrado', ok: 0});
            logger.info(`---- PAQUETE YA REGISTRADO - ID ${idEnvio} ---------`)
        } else {
            const paquete = await buscarEntrega(data.data.sender_id, idEnvio)
            if (paquete.ok = 0) {
                res.status(200).json({rsdo: paquete.error, ok: 0});
            } else {
                try {                        
                    const rsdo = await guardarPaquete(paquete.cliente, paquete.envio, paquete.venta, data.entrega, data.data);
                    if (rsdo.error || rsdo.errorConn) {
                        res.status(200).json({rsdo: rsdo.datos, ok: 0});
                        return;
                    }
                    const idEntrega = rsdo.idEntrega;
                    const nombreCl = rsdo.nombreCl;
                    logger.info(`---- PAQUETE CON ID ENTREGA ML ${data.data.id} Y ID INTERNO ${idEntrega} REGISTRADO ---------`)
                    const id = await proximoID('Adjuntos', 'IdAdj');
                    let img = data.img;
                    img = img.replace('data:image/png;base64,', '');
                    let sql = `INSERT INTO Adjuntos (IdAdj, NomAdj, ExtAdj, Adj, FH, Imagen) VALUES (
                        ${id}, 'ENVIO ML FLEX ${data.data.id}', 'png', '', '${formatoFecha(new Date(), 1, true)}', '${img}')`;
                    execute(sql);
                    // rsdo = await execute(sql);
                    // if (rsdo.error || rsdo.errorConn) {
                    //     res.status(200).json({rsdo: rsdo.datos, ok: 0});
                    //     return;
                    // }
                    sql = `INSERT INTO AdjuntosXOrPr (IdAdj, IdOrPr, tabla) VALUES (
                        ${id}, ${idEntrega}, 9)`;
                    execute(sql);
                    //rsdo = await execute(sql);
                    // if (rsdo.error || rsdo.errorConn) {
                    //     res.status(200).json({rsdo: rsdo.datos, ok: 0});
                    //     return;
                    // }
                
                    res.status(200).json({rsdo: `Registrado OK Para el Cliente ${nombreCl}`, ok: 1});
                } catch (error) {
                    console.error(error);
                    res.status(200).json({rsdo: error, ok: 0});
                }
            }        
        }
    }
});

export default routerSubir;