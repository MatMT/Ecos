# ECOS Admin Web — Design System

## 1. Dirección visual

El portal combina una presentación minimalista, moderna y clínica: superficies neutrales, jerarquía tipográfica clara y el azul de ECOS como acento funcional. La interfaz debe sentirse profesional, cercana y cuidada, sin decoración innecesaria.

## 2. Principios

- Priorizar jerarquía, espacio en blanco y lectura rápida sobre ornamentación.
- Usar una acción primaria por contexto y tonos semánticos para estados clínicos.
- Mantener controles, bordes, radios y focus visibles de forma consistente.
- No comunicar estados exclusivamente mediante color: acompañarlos con texto o iconografía.

## 3. Colores

Los tokens viven en `src/app/globals.css` y se consumen con utilidades Tailwind semánticas.

- `background` y `foreground`: fondo y contenido general.
- `card`, `popover`, `muted`, `border` e `input`: superficies neutrales.
- `primary`: azul ECOS (`#1a7dbf` en claro y `#2d96dc` en oscuro).
- `destructive`: rojo de atención crítica (`#ef4444`).
- `chart-1` a `chart-5`: azul ECOS, esmeralda, ámbar, rojo y violeta para Recharts.

El navy (`navy-900` y `navy-950`) queda reservado para la identidad de navegación. No se utiliza como superficie general.

## 4. Modo claro y oscuro

El tema se aplica en el elemento `html` mediante la clase `dark`. Los componentes deben preferir `bg-background`, `text-foreground`, `bg-card`, `border-border`, `text-muted-foreground`, `bg-primary` y `focus-visible:ring-ring` en lugar de colores Slate o blanco codificados directamente.

Los colores clínicos pueden usar variantes claras y oscuras explícitas cuando la semántica lo requiera.

## 5. Tipografía y espaciado

- Inter: texto general y controles.
- Plus Jakarta Sans (`font-display`): títulos de página, sección y tarjetas.
- JetBrains Mono (`mono`): métricas y valores biométricos.

Usar `p-4`, `sm:p-6` y `lg:p-8` como padding de página; `gap-4` o `gap-6` entre bloques; `p-4` o `p-6` dentro de tarjetas. Evitar valores arbitrarios.

## 6. Radios, bordes y sombras

`--radius` es `0.75rem`. Inputs y botones usan radio estándar; cards, diálogos y bloques destacados usan `rounded-xl`. Preferir `border-border` y `shadow-sm`; no usar sombras grandes ni tarjetas anidadas sin una separación funcional.

## 7. Iconografía

Lucide es la única librería de iconos. Usar aproximadamente 14–16 px para controles, 17–18 px para navegación y 20–22 px para métricas. Los iconos de acción deben tener texto accesible o `aria-label`.

## 8. Componentes base

Las primitivas de `src/components/ui` provienen de shadcn/ui con Radix:

- `Button`: `default`, `secondary`, `outline`, `ghost` y `destructive`; respeta focus y disabled.
- `Card`: superficie de contenido; usar sus secciones cuando la composición lo requiera.
- `Badge`: `success`, `warning`, `info`, `destructive`, `secondary` y `outline` para estados con etiqueta textual.
- `Input`, `Select`, `Textarea` y `Label`: labels visibles, helper/error junto al campo y sin depender del placeholder.
- `Dialog`, `Tabs` y `Skeleton`: estados de interacción, selección y carga reutilizables.

## 8.1 Componentes comunes

`components/common` contiene patrones de composición sobre estas primitivas:
`PageHeader`, `FilterBar`, `DataTable`, `EmptyState`, `ErrorState`,
`FormError`, `ForbiddenState`, `ConfirmDialog`, `FormSection`, `StatCard` y
`StatusBadge`. No duplican estilos de base ni contienen lógica de dominio.
`FormError` usa `role="alert"`, texto formal y tokens semánticos. `StatusBadge`
exige texto junto al tono semántico; `StatCard` usa `mono` para el valor y
skeleton al cargar.

Sonner proporciona feedback breve para resultados de mutations y observa el
tema existente. Los errores persistentes, vacíos y denegaciones se representan
en el contenido con los estados comunes, no mediante toast.

## 9. Listados, formularios y datos biométricos

Las tablas y listados deben usar encabezados discretos, separadores `border-border`, hover en `muted` y focus visible. Los formularios conservan labels y separación de `space-y-2` o `space-y-4`. Los errores generales se presentan con `FormError`; los de campo se muestran junto al control que los originó. No se usan toasts como sustituto de errores persistentes de formulario.

Una métrica biométrica muestra etiqueta, valor, unidad y contexto breve. El valor usa `mono`; los tonos de alerta se reservan para desviaciones reales. Las gráficas usan `chart-*`, tooltip `popover` y grilla `border`.

## 10. Accesibilidad y qué evitar

- Mantener contraste, foco visible, áreas clicables cómodas y soporte de teclado.
- Respetar `prefers-reduced-motion` para transiciones y animaciones.
- Evitar gradients decorativos, glassmorphism, sombras grandes, colores de acento múltiples, texto demasiado pequeño y cards dentro de cards sin propósito.
