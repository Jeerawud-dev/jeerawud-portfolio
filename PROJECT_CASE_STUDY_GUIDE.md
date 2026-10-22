# Inline Project Diagram — editing guide

## Current user experience

On **03 / PROJECTS**, click anywhere on a project card (or its **View diagram**
button). The selected project's **interactive circular system diagram** expands
directly **below that project's row**, without a modal, new tab or page.

The compact panel contains:
- Project title and one short description/scope.
- Circular 4–6-stage system / technology diagram with direction arrows.
- One small area showing the title and details of the selected diagram stage.
- **Close** button. Clicking the same project card again also closes the panel.
- Opening another project switches to its diagram. Filtering/searching closes it.

This presentation is conceptual — it is NOT an exact electrical or motion
control wiring diagram.

The site has removed the earlier **full Project Case Study dialog**: no large
hero, extra technology table, lengthy work-area list or image gallery is shown.

## Where the data comes from

| Field | Source |
| --- | --- |
| Project cards, title, description, dates, context, technologies, image | Google Sheets → Portfolio |
| Diagram steps, brief scope | GitHub → `project-cases.js` |
| Interactive chart | `showcase.js` |
| Responsive inline layout | `project-inline.css` and `project-case.css` |

Case study details are matched to a project by **exact project title**, ignoring
capitalization and extra surrounding spaces. Keep the local keys in
`project-cases.js` consistent with Google Sheets project titles.

The existing Google Apps Script feed currently serves the Portfolio card data.
If it later provides a `projectDetails` object, the website can use those
fields as optional overrides for the local case-study definitions.

## Edit a diagram

Find the project entry in `project-cases.js`, then update its diagram array:

```js
diagram: [
  { title: "Machine signals", detail: "Industrial I/O" },
  { title: "Motion control", detail: "Taught paths" },
  { title: "PC application", detail: "C# · WPF" },
  { title: "Factory links", detail: "MES · PQM · CFX+" }
]
```

There should be **up to 6** stages. Clicking a circle updates the selected
component name and its brief description without leaving the page.

## Image data

The existing `machineImages` and `uiImages` arrays are retained for future
use, but **are not currently shown** in the simplified inline UI.
The primary project image can still be shown on the main project card via the
Google Sheets Portfolio tab.

## Accessibility

- All chart stages are real buttons (keyboard Tab, Enter, Space).
- The expanded card controls expose `aria-expanded`.
- The inline diagram is a labeled region; the selected step details announce changes.
- Responsive: on smaller screens the diagram stacks above the detail summary.
- Reduced-motion preferences are honored.
