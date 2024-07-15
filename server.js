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
            // Parsear el string XML para obtener el valor del atributo Id en <DE>
            const xmlDoc = xmlParser.xml2js(xml, { compact: true });
            let idValue;

            if (xmlDoc.rDE && xmlDoc.rDE.DE && xmlDoc.rDE.DE._attributes && xmlDoc.rDE.DE._attributes.Id) {
                idValue = xmlDoc.rDE.DE._attributes.Id;
            } else {
                const errorMessage = 'Missing Id attribute in the <DE> element of the original XML';
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: errorMessage }));
                errorLogger.error(errorMessage);
                return;
            }

            // Construir el nombre del archivo usando Id
            const filename = `xml-${idValue}.xml`; // Ejemplo: "xml-01022197575001001000000122022081410002983981.xml"

            // Guardar el XML generado en la carpeta output con el nombre generado
            const filePath = path.join(outputFolderPath, filename);
            fs.writeFile(filePath, xml, (err) => {
                if (err) {
                    const errorMessage = 'Error saving XML';
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: errorMessage }));
                    errorLogger.error(errorMessage, { error: err });
                    return;
                }

                // Mostrar el XML generado por consola
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
        res.status(500).json({ error: 'Error en el servidor', details: [error.message || error] });
    }
}

// Iniciar el servidor
app.listen(port, () => {
    infoLogger.info(`Servidor escuchando en http://localhost:${port}`);
});
