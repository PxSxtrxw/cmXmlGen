# cmXmlGen (Generación de XML para la SET)

Este repositorio contiene una extensión para la generación de archivos XML necesarios para la comunicación con la SET (Subsecretaría de Estado de Tributación del Ministerio de Hacienda) de Paraguay. El código está diseñado para manejar diferentes tipos de eventos que requieren la generación de XML según las especificaciones técnicas de la SET.

## Requerimientos

Para utilizar este código, es necesario tener instalado:

- Node.js
- npm (Node Package Manager)

## Instalación

Para instalar las dependencias necesarias, ejecute el siguiente comando en la terminal:

```bash
npm install facturacionelectronicapy-xmlgen
```
## Configuración

Antes de ejecutar el servidor, asegúrese de configurar adecuadamente los parámetros y datos necesarios según la documentación de la SET. Los datos estáticos del contribuyente emisor (`params`) y los datos variables para cada documento electrónico (`data`) deben estar correctamente estructurados y proporcionados en formato JSON.

## Uso

### Ejecución del Servidor

Para iniciar el servidor de desarrollo, use el siguiente comando:

```bash
node server
```
El servidor se iniciará en http://localhost:3000.

### Endpoints Disponibles

El servidor expone varios endpoints para manejar diferentes eventos que requieren la generación de XML:

- `/generar`: Genera un XML regular para un documento electrónico.
- `/cancelacion`: Genera un XML para un evento de cancelación.
- `/inutilizacion`: Genera un XML para un evento de inutilización.
- `/conformidad`: Genera un XML para un evento de conformidad.
- `/disconformidad`: Genera un XML para un evento de disconformidad.
- `/desconocimiento`: Genera un XML para un evento de desconocimiento.
- `/notificacion`: Genera un XML para un evento de notificación.



