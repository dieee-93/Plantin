Vas a trabajar en el proyecto Plantin (React 19 + Vite + TypeScript + Zustand + Vitest), en este repositorio. Tu tarea es ejecutar el spec `docs/specs/isometric-engine-v2.md`, que mejora la vista isométrica de ubicaciones y prepara un editor de espacios.

Leé el spec completo antes de hacer cualquier cosa. Es la fuente de verdad del alcance; prestá especial atención a la sección 2 (reglas) y la sección 9 (protocolo de ejecución y decisiones abiertas).

Reglas que no se negocian:
- Respondeme en español. Código, identificadores y commits siguen la convención del repo (`feat(isometric): ...`, `perf(isometric): ...`, `refactor(isometric): ...`).
- No levantes un servidor de desarrollo: ya tengo uno corriendo en http://localhost:5173. Para verificar UI, usá esa app real.
- No crees páginas, rutas ni componentes de prueba o demo. Las herramientas de verificación van en `scripts/`.
- Una fase por vez. Al terminar cada fase, detenete y reportá: qué cambió, cómo lo verificaste (lint, tests, build, capturas antes/después si hubo cambios visuales) y qué quedó pendiente. No empieces la siguiente fase hasta que yo la apruebe.
- No agregues alcance que no esté en la fase activa ni dependencias fuera de las permitidas por el spec (`@resvg/resvg-js` y `tsx` como dev deps; `zundo` recién desde la fase E3).
- Si el código real contradice el spec, gana el código existente salvo que el spec diga explícitamente que se cambia. Anotá la diferencia en tu reporte en vez de improvisar.
- No asumas nombres de archivos, funciones, campos o stores que no hayas visto en el código.
- `npm run lint`, `npm test` y `npm run build` tienen que pasar al cerrar cada fase. No modifiques tests existentes sin justificarlo en el reporte.
- No hagas commit ni push hasta que te lo pida.

Contexto útil:
- Los datos actuales son de prueba y viven en localStorage; se pueden reiniciar cuando el spec cambie el modelo.
- Las decisiones abiertas están en la tabla de la sección 9.2. Si llegás a una fase que depende de una decisión que no tomé, usá el valor propuesto y avisame en el reporte.

Empezá por la **Fase 0** (sección 9.1), que es solo de lectura: no modifiques ningún archivo. Leé los archivos que lista y entregame un informe corto con:
1. Un resumen de cómo está armado hoy el módulo isométrico y los stores relacionados, en tus palabras.
2. Qué partes del spec no coinciden con el código real y cómo proponés resolver cada una.
3. Qué son las líneas punteadas azules de la parcela (decisión D1).
4. Riesgos o dudas que veas antes de arrancar la Fase 1.

Después de ese informe, esperá mi aprobación.
