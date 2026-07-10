import api from './axios';

export const getMyCertificates = () => api.get('/certificates/mine');
export const verifyCertificate = (code) => api.get(`/certificates/verify/${code}`);