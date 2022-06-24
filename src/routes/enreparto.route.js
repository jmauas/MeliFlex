import express  from 'express';
const routerEnReparto = express.Router();
import { execute, select } from '../auxi/conBD.js';

routerEnReparto.post("/:destino", async (req, res) => {
    const destino = req.params.destino;
    if (destino!=1 && destino!=2) {
        res.status(200).send({rsdo: 'Error en la Ruta.', ok: 0});
        return;
    }
    const data = req.body;
    const idEnvio = data.data.id
    const repartidor = req.query.repa
    if (idEnvio == undefined || idEnvio == null) {
        res.status(200).send({rsdo: 'No se ha recibido el id del envio', ok: 0});
    } else {        
        let sql = ''; 
        switch (destino) {
            case '1':
            case 1:
                //VENTA EN LINEA
                sql = `SELECT ml.repa as repa, IsNull(r.NombreRep+' '+r.ApellidoRep, '') as nombre, ml.estado as es
                    FROM Fact_ML as ml LEFT JOIN Repartidores as r ON ml.repa=r.idRep
                    WHERE ml.identrega='${idEnvio}'`;
                break;
            case '2':
            case 2:
                //LOGISTICA
                sql = `SELECT e.repartidor as repa, IsNull(r.NombreRep+' '+r.ApellidoRep, '') as nombre, es_entrega as es
                    FROM Clientes_entregas as e LEFT JOIN Repartidores as r ON e.repartidor=r.idRep
                    WHERE idEntrega='${idEnvio}'`;
                break;
        }
        const datos = await select(sql);
        if (datos.error == false && datos.errorConn == false) {
            if (datos.datos.length > 0)  {
                const es = datos.datos[0].es;
                const repa = datos.datos[0].repa;
                const nombre = datos.datos[0].nombre;
                if (destino == 1)  {
                    if (Number(es) <= 5) {
                        sql = `UPDATE Fact_ML SET estado='5', repa='${repartidor}' WHERE idEntrega='${idEnvio}'`;
                        const rsdo = await execute(sql);
                        if (rsdo.error == false && rsdo.errorConn == false) {
                            res.status(200).json({rsdo: `Paquete Registrado con Éxito.`, ok: 1});
                        } else {
                            res.status(200).json({rsdo: rsdo.datos, ok: 0});
                        }
                    } else {
                        if (repa==0) {
                            sql = `UPDATE Fact_ML SET repa='${repartidor}' WHERE idEntrega='${idEnvio}'`;
                            const rsdo = await execute(sql);
                            if (rsdo.error == false && rsdo.errorConn == false) {
                                res.status(200).json({rsdo: `Paquete Registrado con Éxito.`, ok: 1});
                            } else {
                                res.status(200).json({rsdo: rsdo.datos, ok: 0});
                            }
                        } else {                  
                            res.status(200).json({rsdo: `Paquete Ya Entregado Por ${repa} - ${nombre}.`, ok: 0});                      
                        }
                    }
                } else {
                    switch (es) {
                        case '0':
                        case 0:
                            sql = `UPDATE Clientes_entregas SET es_entrega='1', repartidor='${repartidor}' WHERE idEntrega='${idEnvio}'`;
                            const rsdo = await execute(sql);
                            if (rsdo.error == false && rsdo.errorConn == false) {
                                res.status(200).json({rsdo: `Paquete Registrado con Éxito.`, ok: 1});
                            } else {
                                res.status(200).json({rsdo: rsdo.datos, ok: 0});
                            }
                            break;
                        case '1':
                        case 1:
                        case '2':
                        case 2:
                            if (repa==0) {
                                sql = `UPDATE Clientes_entregas SET repartidor='${repartidor}' WHERE idEntrega='${idEnvio}'`;
                                const rsdo = await execute(sql);
                                if (rsdo.error == false && rsdo.errorConn == false) {
                                    res.status(200).json({rsdo: `Paquete Registrado con Éxito.`, ok: 1});
                                } else {
                                    res.status(200).json({rsdo: rsdo.datos, ok: 0});
                                }
                            } else {
                                res.status(200).json({rsdo: `Paquete Ya Asignado A ${repa} - ${nombre}.`, ok: 0});
                            }
                            break;                            
                    }
                }
            } else {
                res.status(200).json({rsdo: 'No se ha Encontrado el Paquete.', ok: 0});
            }                      
        }
    }
});

export default routerEnReparto;