# Mini-proyecto 1 · Administrador de eventos (frontend)

React + Vite, desplegado en Vercel. Habla con la API FastAPI (Render) mediante `VITE_API_URL`.

## Rutas

| Ruta | Acceso | Qué muestra |
| --- | --- | --- |
| `/` | pública | Página de inicio |
| `/registro` | pública | Crear cuenta |
| `/ingresar` | pública | Iniciar sesión |
| `/eventos` | solo con sesión | Crear, editar y eliminar eventos propios |
| `/hoy` | solo con sesión | Gestiones vencidas, para hoy y próximas, con filtros |

`vercel.json` redirige todas las rutas a `index.html` para que funcione la navegación directa.

## Vista «Hoy»: regla de prioridad

La misma regla aparece en la interfaz bajo «¿Cómo se ordena esto?» y vive en `src/lib/hoy.js`.

1. Los grupos van en este orden: **Gestiones vencidas**, **Para hoy** y **Próximas**.
2. Dentro de cada grupo se ordena por plazo, de menor a mayor: en Vencidas la más antigua queda arriba y en Próximas la más cercana.
3. Si dos gestiones tienen la misma fecha, va primero la de **menor esfuerzo** (menos horas estimadas).
4. Si aún empatan, se ordenan por nombre y, al final, por id.

El grupo depende solo del plazo frente a la fecha de hoy. «Próximas» incluye todas las que vencen después de hoy.
Se puede filtrar por evento y por estado (vencida, para hoy, próxima) sin alterar el orden.

## Desarrollo

```bash
npm install
npm run dev
```

Variable de entorno: `VITE_API_URL` (ya está en `.env`).
