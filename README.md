# cmXmlGen (Generación de XML para la SET)

Este repositorio contiene una extensión para la generación de archivos XML necesarios para la comunicación con la SET (Subsecretaría de Estado de Tributación del Ministerio de Hacienda) de Paraguay. El código está diseñado para manejar diferentes tipos de eventos que requieren la generación de XML según las especificaciones técnicas de la SET.

## Requerimientos

Para utilizar este código, es necesario tener instalado:

- Node.js
- npm (Node Package Manager)

## Instalación

Para instalar las dependencias necesarias, ejecute el siguiente comando en la terminal:

```bash
npm install
```
## Configuración

Antes de ejecutar el servidor, asegúrese de configurar adecuadamente los parámetros y datos necesarios según la documentación de la SET. Los datos estáticos del contribuyente emisor (`params`) y los datos variables para cada documento electrónico (`data`) deben estar correctamente estructurados y proporcionados en formato JSON.

## Uso

### Ejecución del Servidor

Para iniciar el servidor de desarrollo, use el siguiente comando:

```bash
npm start
```

