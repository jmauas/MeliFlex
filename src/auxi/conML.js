import logger from './logger.js';
import axios from 'axios';

const urlML = 'https://api.mercadolibre.com';
const appId = process.env.ML_APPID;
const key = process.env.ML_KEY;

export const pedirEnvio = async (id, token) => {
    try {
        const res = await axios.get(`${urlML}/shipments/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        return res.data;    
    } catch (err) {
        return logErrorML(err);
    }
}

export const pedirVenta = async (id, token) => {
    try {
        const res = await axios.get(`${urlML}/orders/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        return res.data;    
    } catch (err) {
        return logErrorML(err);
    }
}

export const renovarToken = async (rt) => {
    try {
        const res = await axios.post(`${urlML}/oauth/token?grant_type=refresh_token&client_id=${appId}&client_secret=${key}&refresh_token=${rt}`)
        return res.data;    
    } catch (err) {
        return logErrorML(err); 
    }
}

const logErrorML = (err) => {
    if (err.response.data) {
        logger.error(err.response.data);
        return err.response.data;    
    } else if (err.response) {
        logger.error(err.response);
        return err.response;    
    } else {
        logger.error(err);
        return err;    
    }
}
