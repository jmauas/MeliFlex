import { config } from '../../personal/bd/config.js';
import logger from '../../src/auxi/logger.js';
import mssql from 'mssql';
import { formatoFecha } from '../public/js/auxi.js';
import { renovarToken, pedirEnvio, pedirVenta } from './conML.js';

export const select = async (sql) => {
    return mssql.connect(config)
    .then( async (pool) => {
        try {
            const datos = await pool.query(sql)
            let data = {errorConn: false, error: false, datos: datos.recordset}
            return data
        } catch (error) {
            return logErrorSQL(error, false)
        } 
    })
    .catch((error) => {
        return logErrorSQL(error, true)
    });
}

export const execute = async (sql) => {
    return mssql.connect(config)
    .then( async (pool) => {
        try {
            await pool.query(sql)
            let data = {errorConn: false, error: false, datos: true}
            return data
        } catch (error) {
            return logErrorSQL(error, true)
        } 
    })
    .catch((error) => {
        return logErrorSQL(error, true)
    });
}

export const proximoID = async (tabla, campo) => {
    const sql = `SELECT IsNull(MAX(${campo}), 900000000) As ID FROM ${tabla} WHERE ${campo} BETWEEN 900000000 And 999999999`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length > 0) {
            return Number(data.datos[0].ID) + 1;
        } else {
            return 900000000
        }
    }else {
        return 900000000
    }
}

export const nombreCliente = async (id) => {
    const sql = `SELECT Nombre, Apellido FROM Clientes WHERE CodCli=${id}`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length > 0) {
            return `${data.datos[0].Nombre} ${data.datos[0].Apellido}`;
        } else {
            return '';
        }
    }else {
        return '';
    }
}

export const conZonaXCP = async (cp, envio) => {
    const sql = `Select z.IdRZona, z.NomRZona, z.valor, IsNull((SELECT TOP 1 valor_costo FROM ML_envio_zona WHERE idzona=z.IdRZona AND idenvio=${envio}), 0) as costo
    , IsNull((SELECT TOP 1 valor_venta FROM ML_envio_zona WHERE idzona=z.IdRZona AND idenvio=${envio}), 0) as venta From RZona as z INNER JOIN RLocalidades as l 
    ON z.IdRZona=l.ZonaC WHERE l.CP=${cp}`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length > 0) {
            const zona = {id: data.datos[0].IdRZona};
            zona.nombre = data.datos[0].NomRZ
            if (data.datos[0].costo == 0) {
                zona.costo = data.datos[0].valor
            } else{
                zona.costo = data.datos[0].costo
            }
            zona.valor = data.datos[0].venta
            return zona;
        } else {
            return {id: 0, nombre: '', costo: 0, valor: 0, venta: 0};
        }
    }else {
        return {id: 0, nombre: '', costo: 0, valor: 0, venta: 0};
    }
}

export const conSenderId = async (idEntrega) => {
    const data = await select(`SELECT userId FROM Clientes_entregas WHERE idEntrega='${idEntrega}'`);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length > 0) {
            return data.datos[0].userId;
        } else {
            return '';
        }
    }else {
        return '';
    }
}

export const buscarEntrega = async (senderId, idEntrega) => {
    let sql = `SELECT IdCliente, access_token, vto_token, refresh_token FROM Clientes_tokens WHERE user_id='${senderId}'`;
    const token = await select(sql);
    if (token.error == false && token.errorConn == false) {
        if (token.datos.length > 0)  {
            let tk = token.datos[0].access_token;
            const rt = token.datos[0].refresh_token;
            let vto = token.datos[0].vto_token;
            const cliente = token.datos[0].IdCliente;
            let ahora = new Date();
            ahora.setMinutes(ahora.getMinutes() - 30);
            if (vto < ahora) {
                const nuevoToken = await renovarToken(rt);
                if (nuevoToken.status == '401' || nuevoToken.status == '400') {
                    res.status(200).send({rsdo: 'Error al Renovar Token '+nuevoToken.message, ok: 0});
                    return;
                }
                tk = nuevoToken.access_token;
                vto = new Date();
                vto.setHours(vto.getHours() + 6);
                sql = `UPDATE Clientes_tokens SET access_token='${tk}', vto_token='${formatoFecha(vto, 1, true)}' WHERE idCliente='${cliente}' AND refresh_token='${rt}'`;
                execute(sql);
                // const rsdo = await execute(sql);
                // if (rsdo.error || rsdo.errorConn) {
                //     res.status(200).json({rsdo: rsdo.datos, ok: 0});
                //     return;
                // }
            }
            const envio = await pedirEnvio(idEntrega, tk);
            if (envio.status == '401' || envio.status == '400') {
                const rsdo = {error: 'Error al pedir Envio '+envio.message, ok: 0};
                return rsdo;
            }
            const venta = await pedirVenta(envio.order_id, tk);
            if (venta.status == '401' || venta.status == '400') {
                const rsdo = {error: 'Error al pedir Venta '+venta.message, ok: 0};
                return rsdo;
            }
            const rsdo = {error: false, ok: 1, envio: envio, venta: venta, cliente: cliente};
            return rsdo;
        } else {
            const rsdo = {error: 'No se ha encontrado el token', ok: 0};
            return rsdo;
        }
    } else {
        const rsdo = {error: 'Error al buscar token', ok: 0};
        return rsdo;
    }
}

export const guardarPaquete = async (cliente, envio, venta, entrega, qr) => {
    const nombreCl = await nombreCliente(cliente);
    let observ = '';
    try {
        if (envio.receiver_address.receiver_name != ''){observ = 'Recibe: '+envio.receiver_address.receiver_name+' '}
    } catch {}
    observ += envio.receiver_address.comment;
    const zona = await conZonaXCP(envio.receiver_address.zip_code, entrega);
    const json = JSON.stringify(qr);
    const idEntrega = await proximoID('Clientes_entregas', 'id');
    let sql = `INSERT INTO Clientes_entregas (id, IdCliente,         NomCliente,               idVL,                    idEntrega,        userId,                         fh,          es_entrega, es_fc,  idfc, mensaje, entrega,   cant,       nombre,                             apellido,         tel1, tel2, dni,           domicilio,                                    nro,                                             localidad,                                       cp,                          provincia,                    observ_domi,    etiqueta, repartidor, cobrado, es_cobro,      costo,   es_repa, IdFcC, tablaC,    zona,                  nick,                 venta, jsonML) VALUES (
                                        ${idEntrega}, ${r(cliente)}, '${r(nombreCl)}', '${r(envio.order_id)}', '${r(envio.id)}', '${r(qr.sender_id)}', '${formatoFecha(new Date(), 1, true)}', 0,       0,     0,     '',  ${entrega},   1, '${r(venta.buyer.first_name)}', '${r(venta.buyer.last_name)}', '',   '',  '0', '${r(envio.receiver_address.street_name)}', '${r(envio.receiver_address.street_number)}', '${r(envio.receiver_address.city.name)}', '${envio.receiver_address.zip_code}', '${r(envio.receiver_address.state.name)}', '${r(observ)}',    '',         '0',       0,       0,   ${r(zona.costo)},  0,      0,      0,  ${zona.id}, '${r(venta.buyer.nickname)}', '${r(zona.valor)}', '${json.replaceAll(',', '%coma%')}')`;
    
    let rsdo = await execute(sql);
    sql = `UPDATE Clientes_entregas SET jsonML=REPLACE(jsonML, '%coma%', ',') WHERE id=${idEntrega}`
    execute(sql);
    return {idEntrega: idEntrega, nombreCl: nombreCl, ...rsdo};
}

const estadosML = (es) => {
    switch (es) {  
        case 'pending':
            return 0
        case 'ready_to_ship':
            return 0
        case 'handling':
            return 1
        case 'shipped':
            return 1
        case 'delivered':
            return 2
        case 'not_delivered':
            return 0
        case 'cancelled':
            return 2
        default:
            return 0
    }
}

export const actualizarEstadoPaquete = async (idEntrega, es) => {
    const sql = `UPDATE Clientes_entregas SET es_entrega=${estadosML(es)} WHERE idEntrega='${idEntrega}'`
    execute(sql);
}

const r = (txt) => {
    if (typeof txt==='string') {
        //txt = txt.replaceAll(/\s/g, '');
        txt = txt.replaceAll(',', '');
        txt = txt.replaceAll("'", '');
        return txt;
    } else {
        return txt;
    }
}

export const conEnvios = async () => {
    const sql = `Select IdP, Descrip FROM ML_Envios Order by IdP Asc`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        return data.datos;
    }else {
        return [];
    }
}

export const conNombreRepa = async (id) => {
    const sql = `Select NombreRep, ApellidoRep FROM Repartidores WHERE IdRep='${id}'`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length>0) {
            return data.datos[0].NombreRep+' '+data.datos[0].ApellidoRep;
        } else {
            return '';
        }
    }else {
        return [];
    }
}

export const conNombreEs = (id) => {
    switch (id) {
        case '0':
        case 0:
            return 'Sin Asignar';
        case '1':
        case 1:
            return 'En Camino';
        case '2':
        case 2:
            return 'Entregado';
        case '99':
        case 99:
            return 'Todos';
    }    
}

export const existePaquete = async (id) => {
    const sql = `Select COUNT(id) as cant FROM clientes_entregas WHERE IdEntrega='${id}'`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        if (data.datos.length > 0) {
            if (data.datos[0].cant > 0) {
                return true;
            } else {
                return false;
            };
        } else {
            return false;
        }
    } else {
        return false;
    }
}

const logErrorSQL = (error, conn) => {
    let data = {errorConn: conn, error: !conn}
    if (!error) {
        data.datos = 'Error Indeterminado';
    } else if (!error.originalError) {
        data.datos =  error;
    } else if (!error.originalError.info) {
        data.datos =  error.originalError;
    } else if (!error.originalError.info.message) {
        data.datos =  error.originalError.info;
    } else if (!error.originalError.info.message.info) {
        data.datos = error.originalError.info.message;
    } else {
        data.datos = error.originalError.info.message.info;
    }
    return data;
}

const conZonas = async (f1, f2, se) => {
    let sql = `Select DISTINCT(IdRZona) as id, NomRZona as nombre From RZona as z INNER JOIN Clientes_entregas as e ON z.IdRZona=e.zona 
                    WHERE z.tipo=2 `
    if (se != 'true') {sql += `AND e.fh BETWEEN '${f1}' AND '${f2}'`}
    sql += ` Order by IdRZona Asc`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        return data.datos;
    }else {
        return [];
    }
}

const conRepar = async () => {
    const sql = `Select IdRep as id, (NombreRep+' '+ApellidoRep) as nombre From Repartidores WHERE Estado>0 Order By NombreRep Asc `;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        return data.datos;
    }else {
        return [];
    }
}

export const consultaResumen = async (fecha, es, repa, tipo, se) => {
    const f1 = formatoFecha(fecha, 0, true);
    fecha.setDate(fecha.getDate()+1);
    const f2 = formatoFecha(fecha, 0, true);
    const zonas = await conZonas(f1, f2, se);
    const envios = await conEnvios();
    const repar = await conRepar();
    let where = ``;
    if (repa!=0) {where += ` AND e.repartidor=${repa} `};
    if (tipo!=0) {where += ` AND e.entrega=${tipo} `};
    if (se!='true') {
        if (es!=99) {where += ` AND e.es_entrega=${es} `};
        where += ` AND e.fh BETWEEN '${f1}' AND '${f2}'`;
    } else {
        where = ` AND e.es_entrega<2 `;
    }
    let sql = "SELECT DISTINCT(CONVERT(varchar, e.IdCliente)) as Cliente, (SELECT Apellido+' '+Nombre FROM Clientes WHERE CodCli=e.IdCliente) as 'Nombre' ";
    let cant = `IsNull((select SUM(cant) FROM Clientes_entregas WHERE IdCliente=e.IdCliente AND zona=#0 ${where.replaceAll('e.', '')}), 0) as '#1'`;
    zonas.map(z => {
        sql += ', '+cant.replaceAll('#0', z.id).replaceAll('#1', z.nombre);
    });
    sql += ` From Clientes_entregas as e WHERE (SELECT SUM(cant) FROM Clientes_entregas WHERE zona=e.zona ${where.replaceAll('e.', '')})>0
                 ${where} 
            UNION ALL
                SELECT TOP 1 'zzzzzzz' as Cliente, 'TOTAL' as 'Nombre' `;
    zonas.map(z => {
        sql += ', '+cant.replaceAll('#0', z.id).replaceAll('#1', z.nombre).replaceAll('IdCliente=e.IdCliente AND', '');
    });
    sql += ` From Clientes_entregas as e WHERE  (SELECT SUM(cant) FROM Clientes_entregas WHERE zona=e.zona ${where.replaceAll('e.', '')})>0 
                ${where} 
            UNION ALL
                SELECT TOP 1 'zzzzzzzz' as Cliente, 'TOTAL PAQUETES' as 'Nombre' `;
    zonas.map(z => {
        sql += `, IsNull((select SUM(cant) FROM Clientes_entregas WHERE 1=1 ${where.replaceAll('e.', '')}), 0) as '${z.nombre}' `;
    });
    sql += ` From Clientes_entregas as e WHERE (SELECT SUM(cant) FROM Clientes_entregas WHERE zona=e.zona ${where.replaceAll('e.', '')})>0 ${where} `;
    sql += ` ORDER BY Cliente`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        const rsdo = {}
        rsdo.envios = envios;
        rsdo.repar = repar;
        rsdo.zonas = zonas;
        rsdo.entregas = data.datos;
        return rsdo;
    }else {
        return [];
    }    
}

export const consultaResumenCliente = async (fecha, es, repa, tipo, cliente, se) => {
    const f1 = formatoFecha(fecha, 0, true);
    fecha.setDate(fecha.getDate()+1);
    const f2 = formatoFecha(fecha, 0, true);
    let where = ``;
    if (repa!=0) {where += ` AND repartidor=${repa} `};
    if (tipo!=0) {where += ` AND entrega=${tipo} `};
    if (se!='true') {
        if (es!=99) {where += ` AND es_entrega=${es} `};
        where += ` AND fh BETWEEN '${f1}' AND '${f2}'`;
    } else {
        where = ` AND es_entrega<2 `;
    }    
    let sql = "SELECT id, es_entrega as es, nombre, apellido, domicilio, nro, localidad, nick, jsonML, idEntrega, fh FROM Clientes_entregas ";
    sql += `    WHERE IdCliente=${cliente} ${where} ORDER BY es_entrega, fh, nombre`;
    const data = await select(sql);
    if (data.error == false && data.errorConn == false) {
        return data.datos;
    }else {
        return [];
    }    
}

