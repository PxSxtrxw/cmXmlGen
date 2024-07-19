const express = require('express');
const bodyParser = require('body-parser');
const xmlgen = require('facturacionelectronicapy-xmlgen').default || require('facturacionelectronicapy-xmlgen');
const fs = require('fs');
const path = require('path');
const xmlParser = require('xml-js');
const { infoLogger, errorLogger } = require('./logger'); // Importar loggers desde la carpeta 'logs'

const app = express();
const port = 3001;

app.use(bodyParser.json());

// Crear la carpeta de salida si no existe
const outputFolderPath = path.join(__dirname, 'output');
if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
}

// Rutas para los diferentes eventos y generación de XML
const eventos = [
    { path: '/generar', eventType: 'regular', eventName: 'Generación de XML' },
    { path: '/cancelacion', eventType: 'cancelacion', eventName: 'Evento de Cancelación' },
    { path: '/inutilizacion', eventType: 'inutilizacion', eventName: 'Evento de Inutilización' },
    { path: '/conformidad', eventType: 'conformidad', eventName: 'Evento de Conformidad' },
    { path: '/disconformidad', eventType: 'disconformidad', eventName: 'Evento de Disconformidad' },
    { path: '/desconocimiento', eventType: 'desconocimiento', eventName: 'Evento de Desconocimiento' },
    { path: '/notificacion', eventType: 'notificacion', eventName: 'Evento de Notificación' }
];

eventos.forEach(evento => {
    app.post(evento.path, (req, res) => {
        handleEventData(req, res, evento.eventType, evento.eventName);
    });
});

function handleEventData(req, res, eventType, eventName) {
    try {
        const json_data = req.body;
        if (!json_data || !json_data.params || !json_data.data) {
            return res.status(400).json({ error: "El JSON debe contener las claves 'params' y 'data'" });
        }

        let xmlGenerationPromise;
        const options = {}; // Opciones para la generación de XML

        switch (eventType) {
            case 'regular':
                xmlGenerationPromise = xmlgen.generateXMLDE(json_data.params, json_data.data, options);
                break;
            case 'cancelacion':
                xmlGenerationPromise = xmlgen.generateXMLEventoCancelacion(json_data.id, json_data.params, json_data.data);
                break;
            case 'inutilizacion':
                xmlGenerationPromise = xmlgen.generateXMLEventoInutilizacion(json_data.id, json_data.params, json_data.data);
                break;
            case 'conformidad':
                xmlGenerationPromise = xmlgen.generateXMLEventoConformidad(json_data.id, json_data.params, json_data.data);
                break;
            case 'disconformidad':
                xmlGenerationPromise = xmlgen.generateXMLEventoDisconformidad(json_data.id, json_data.params, json_data.data);
                break;
            case 'desconocimiento':
                xmlGenerationPromise = xmlgen.generateXMLEventoDesconocimiento(json_data.id, json_data.params, json_data.data);
                break;
            case 'notificacion':
                xmlGenerationPromise = xmlgen.generateXMLEventoNotificacion(json_data.id, json_data.params, json_data.data);
                break;
            default:
                return res.status(400).json({ error: 'Evento no válido' });
        }

        xmlGenerationPromise
        .then(xml => {
            const xmlDoc = xmlParser.xml2js(xml, { compact: true });
            let idValue;

            switch (eventType) {
                case 'regular':
                    if (xmlDoc.rDE && xmlDoc.rDE.DE && xmlDoc.rDE.DE._attributes && xmlDoc.rDE.DE._attributes.Id) {
                        idValue = xmlDoc.rDE.DE._attributes.Id;
                    }
                    break;

                case 'cancelacion':
                    if (xmlDoc['env:Envelope'] && xmlDoc['env:Envelope']['env:Body'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeCan'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeCan']['Id'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeCan']['Id']._text) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeCan']['Id']._text;
                    }
                    break;

                case 'inutilizacion':
                    if (xmlDoc['env:Envelope'] &&xmlDoc['env:Envelope']['env:Body'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['_attributes'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['_attributes']['Id']) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['_attributes']['Id'];
                    }
                    break;

                case 'conformidad':
                    if (xmlDoc['env:Envelope'] && xmlDoc['env:Envelope']['env:Body'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeConf'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeConf']['Id']) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeConf']['Id']._text;
                    }
                    break;

                 case 'disconformidad':
                    if (xmlDoc['env:Envelope'] && xmlDoc['env:Envelope']['env:Body'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDisconf'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDisconf']['Id']) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDisconf']['Id']._text;
                    }
                    break;
                    
                case 'desconocimiento':
                    if (xmlDoc['env:Envelope'] && xmlDoc['env:Envelope']['env:Body'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDescon'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDescon']['Id']) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeDescon']['Id']._text;
                    }
                    break;
                    
                case 'notificacion':
                    if (xmlDoc['env:Envelope'] && xmlDoc['env:Envelope']['env:Body'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve'] && xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeNotRec'] &&xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeNotRec']['Id']) {
                        idValue = xmlDoc['env:Envelope']['env:Body']['rEnviEventoDe']['dEvReg']['gGroupGesEve']['rGesEve']['rEve']['gGroupTiEvt']['rGeVeNotRec']['Id']._text;
                    }
                    break;
                    
                default:
                    const errorMessage = 'Estructura XML no reconocida para este tipo de evento';
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: errorMessage }));
                    errorLogger.error(errorMessage);
                    return;
            }

            if (!idValue) {
                const errorMessage = 'Missing Id attribute in the XML';
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: errorMessage }));
                errorLogger.error(errorMessage);
                return;
            }

            const filename = `xml-${eventType.slice(0, 4)}-${idValue}.xml`;
            const filePath = path.join(outputFolderPath, filename);

            // Verificar si el archivo ya existe
            fs.access(filePath, fs.constants.F_OK, (err) => {
                if (!err) {
                    // El archivo ya existe
                    console.log("El archivo XML ya existe. Mostrando contenido:");

                    // Mostrar el XML generado anteriormente por consola
                    fs.readFile(filePath, 'utf8', (readErr, existingXml) => {
                        if (readErr) {
                            errorLogger.error('Error al leer el XML existente', { error: readErr });
                            res.status(500).json({ error: 'Error al leer el XML existente' });
                            return;
                        }

                        console.log(existingXml);

                        // Responder al cliente indicando que el archivo ya existe
                        res.status(200).json({ message: 'El XML ya se ha generado', filename });
                    });

                } else {
                    // Guardar el XML generado en la carpeta output con el nombre generado
                    fs.writeFile(filePath, xml, (err) => {
                        if (err) {
                            const errorMessage = 'Error saving XML';
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: errorMessage }));
                            errorLogger.error(errorMessage, { error: err });
                            return;
                        }

                        console.log("XML generado guardado:", filePath);

                        // Loggear el evento usando el logger importado
                        infoLogger.info('-----------------------------------------------------------------------');
                        infoLogger.info(`${eventName} - ${eventType}`);
                        infoLogger.info('-----------------------------------------------------------------------');
                        infoLogger.info('XML generado:\n' + xml);
                        infoLogger.info('-----------------------------------------------------------------------');

                        // Responder con el nombre del archivo generado
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ filename }));
                    });
                }
            });

        })
        .catch(error => {
            // Capturar errores detallados
            if (error.message) {
                // Formatear mensaje de error detallado
                const errorMessage = error.message.split(';').join(';\n');
                errorLogger.error('-----------------------------------------------------------------------');
                errorLogger.error(`Error al generar XML (${eventType}):\n  ${errorMessage}`);
                errorLogger.error('-----------------------------------------------------------------------');
                // Enviar el error detallado en la respuesta JSON
                res.status(500).json({ error: 'Error al generar XML', details: error.message.split(';') });
            } else {
                // Registrar error general
                errorLogger.error(`Error al generar XML (${eventType}): ${error.stack || error.message}`);
                res.status(500).json({ error: 'Error al generar XML', details: [error.stack || error.message] });
            }
        });

    } catch (error) {
        errorLogger.error('Error en el servidor', { error });
        res.status(500).json({ error: 'Error en el servidor', details: [error.message] });
    }
}

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor iniciado en http://localhost:${port}`);
});
