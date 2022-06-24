import express  from 'express';
const routerRepartidor = express.Router();

routerRepartidor.get("/:destino", async (req, res) => {
    const destino = req.params.destino;
    res.render('index', { 
        ruta: 'repa',
        destino: destino,
    });                        
});

export default routerRepartidor;