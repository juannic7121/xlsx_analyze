# Análisis Código B

Aplicación web sencilla para comparar el dataset base **Ger** con otro listado (por ejemplo Ra) y generar estadísticas de permutaciones y firmas.

No usa ChatGPT ni ningún servicio de IA. Todo el cálculo es determinista y se ejecuta en el navegador.

## Requisitos

- Node.js 18 o superior
- No se requieren variables de entorno

## Instalación

```bash
npm install
```

## Ejecutar en local

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Compilar para producción

```bash
npm run build
npm start
```

## Cómo usar la aplicación

1. Cargar o pegar **Archivo Ger** (dataset base).
2. Cargar o pegar **Archivo a comparar**.
3. Pulsar **Analizar**.
4. Revisar los resultados en las **5 pestañas** (equivalentes a las hojas del Excel).
5. Pulsar **Limpiar** para iniciar una nueva sesión (o limpiar solo una sección).

### Secciones de resultados (como el Excel)

Tras analizar una vez, puede cambiar entre estas vistas sin volver a procesar:

1. **Resumen**
2. **Firmas Compartidas**
3. **Ranking**
4. **Exclusivas Ger**
5. **Exclusivas Comparación** (hoja Excel «Exclusivas Ra»)

### Entrada admitida

- Archivo `.txt` (un código de 4 dígitos por línea)
- Texto pegado en el área de texto

Ger es siempre la lista base. En cada sesión se compara Ger con **un** segundo dataset.

Volumen orientativo: hasta unos **7.000–8.000 registros** por lista.

## Despliegue

Cualquier hosting compatible con Next.js (por ejemplo Vercel, o un VPS con Node):

```bash
npm run build
npm start
```

Los datos del usuario se procesan en el navegador; no se envían a un servidor de análisis propio.

## Datos de prueba privados

Los archivos de muestra del cliente (si se incluyen) viven solo en `data/samples/` para tests internos.

**No publique esos archivos en un repositorio público.**

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Servir build |
| `npm test` | Tests automatizados |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |

## Documentación de lógica

Ver [`BUSINESS_LOGIC.md`](./BUSINESS_LOGIC.md).
