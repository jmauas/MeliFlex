import express  from 'express';
const routerInfo = express.Router();
import { consultaResumen, conNombreEs, conNombreRepa, nombreCliente as conNombreCliente, consultaResumenCliente } from '../auxi/conBD.js';
import { formatoFecha } from '../public/js/auxi.js';

routerInfo.get("/", async (req, res) => {
    let fecha = req.query.fecha;
    let es = req.query.es;
    let repa = req.query.repa;
    let tipo = req.query.tipo;
    let se = req.query.se;
    if (fecha==undefined) {
        fecha = new Date();
    } else {
        fecha = new Date(fecha);
    }
    if (es==undefined) {
        es = 99;
    }
    if (repa==undefined) {
        repa  = 0;
    }
    if (tipo==undefined) {
        tipo = 0;
    }
    if (se==undefined) {
        se = false;
    }
    fecha.setHours(fecha.getHours()+3);
    const fechaFija = formatoFecha(fecha, 0, false);
    const datos = await consultaResumen(fecha, es, repa, tipo, se);
    let fechaT = req.query.fecha
    if (fechaT==undefined) {
        fechaT = new Date();
        fechaT.setHours(fechaT.getHours()+3);
        fechaT = formatoFecha(fechaT, 0, true);
    }
    const query = `repa=${repa}&fecha=${fechaT}&tipo=${tipo}&es=${es}&se=${se}`;
    const filtros = {repa: repa, fecha: fechaT, tipo: tipo, es: es, se: se};
    res.render('index', { 
        ruta: 'info',
        datos: datos,
        fecha: fechaFija,
        filtros: filtros,
        query: query,
        fechaT: fechaT
    }); 
});

routerInfo.get("/:cliente", async (req, res) => {
    let fecha = new Date(req.query.fecha);
    const es = req.query.es;
    const repa = req.query.repa;
    const tipo = req.query.tipo;
    let se = req.query.se;
    const cliente = req.params.cliente;
    const nombreEs = conNombreEs(es);
    const nombreRepa = await conNombreRepa(repa);
    const nombreCliente = await conNombreCliente(cliente);
    fecha.setHours(fecha.getHours()+3);
    const fechaFija = formatoFecha(fecha, 0, false);
    let datos = await consultaResumenCliente(fecha, es, repa, tipo, cliente, se);
    const query = `repa=${repa}&fecha=${req.query.fecha}&tipo=${tipo}&es=${es}&se=${se}`;
    datos = datos.map(dato => {
        let fh = formatoFecha(new Date(dato.fh), 0, false)
        fh = fh.substring(0, 2);
        return {
            ...dato,
            fh: fh
        }
    })
    res.render('index', { 
        ruta: 'info.cliente',
        datos: datos,
        fecha: fechaFija,
        query: query,
        se: se,
        nombres: {
            cliente: cliente
            , nombreCliente: nombreCliente
            , nombreRepa: nombreRepa
            , nombreEs: nombreEs
        },
        fechaT: req.query.fecha
    }); 
});

export default routerInfo;