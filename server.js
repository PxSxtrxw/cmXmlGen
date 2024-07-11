const express = require('express');
const bodyParser = require('body-parser');
const xmlgen = require('facturacionelectronicapy-xmlgen').default || require('facturacionelectronicapy-xmlgen');
const { createLogger, transports, format } = require('winston');

const app = express();
const port = 3001;

app.use(bodyParser.json());

const customFormat = format.printf(info => {
    return `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`;
});

const infoLogger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'info.log', level: 'info', maxsize: 5242880, maxFiles: 5 }) // 5MB max size per file, 5 files max
    ]
});

const errorLogger = createLogger({
    level: 'error',
    format: format.combine(
        format.timestamp(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }) // 5MB max size per file, 5 files max
    ]
});

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
            // Limpiar caracteres con tilde
            const cleanedXml = removeAccents(xml);
            // Mostrar XML generado en la consola
            console.log('-----------------------------------------------------------------------');
            console.log(`${eventName} - ${eventType}`);
            console.log('-----------------------------------------------------------------------');
            console.log('XML generado:\n' + cleanedXml);
            console.log('-----------------------------------------------------------------------');
            // Loggear el evento
            infoLogger.info('-----------------------------------------------------------------------');
            infoLogger.info(`${eventName} - ${eventType}`);
            infoLogger.info('-----------------------------------------------------------------------');
            infoLogger.info('XML generado:\n' + cleanedXml);
            infoLogger.info('-----------------------------------------------------------------------');
            // Enviar la respuesta JSON con XML limpio
            res.json({ message: 'XML generado correctamente', xml: cleanedXml });
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

function removeAccents(text) {
    // Remover caracteres con tilde
    const accents = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    const withoutAccents = [
        'A', 'a', 'E', 'e', 'I', 'i', 'O', 'o', 'U', 'u', 'N', 'n', 'C', 'c'
    ];
    accents.forEach((accent, index) => {
        text = text.replace(accent, withoutAccents[index]);
    });
    return text;
}

// Iniciar el servidor
app.listen(port, () => {
    infoLogger.info(`Servidor escuchando en http://localhost:${port}`);
});
