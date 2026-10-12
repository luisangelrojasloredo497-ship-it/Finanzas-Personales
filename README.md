# Finanzas Personales

Aplicación web sencilla para llevar el control de tus ingresos y gastos.

## Funciones

- Registrar ingresos y gastos con descripción, monto, categoría y fecha.
- Resumen mensual: ingresos, gastos, balance del mes y saldo total.
- Gastos por categoría con barras de progreso.
- Presupuestos mensuales por categoría (se marcan en rojo al excederse).
- Búsqueda de movimientos y navegación entre meses.
- Exportar a CSV, crear un respaldo en JSON y restaurarlo.
- Modo oscuro automático y diseño adaptable a móvil.

Los datos se guardan en el navegador (`localStorage`); no se envían a ningún servidor.
Haz respaldos en JSON de vez en cuando, porque borrar los datos del navegador también borra tus movimientos.

## Uso

No necesita instalación ni dependencias. Abre `index.html` en tu navegador, o sírvelo localmente:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

Para publicarla en internet, activa **GitHub Pages** en la configuración del repositorio (Settings → Pages → rama principal, carpeta raíz).
