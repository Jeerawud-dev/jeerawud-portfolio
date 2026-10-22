# Floating System Diagram — Portfolio project interaction

## Visitor experience

Under **03 / PROJECTS**, select a project card or its **View diagram** action.
A **compact circular system diagram floats over the current Portfolio page**.
The original project cards stay in the same positions — selecting a project
does not insert a new row, expand the grid, navigate to a new page, or open a
large case-study panel.

The floating chart has:
- Project title and one brief, existing project description/scope.
- Circular 4–6-stage system / technology flow with clickable icon buttons.
- Small selected-stage label and description beside the wheel (below on mobile).
- A transparent surrounding surface so the Portfolio remains visible beneath.

Close with the **X**, by clicking the surrounding backdrop, or by pressing
**Escape**. Keyboard focus returns to the original project control.

## Data sources and editing

| Content | Source |
| --- | --- |
| Card images, project title, category, description, dates, technologies | Google Sheets → `Portfolio` |
| Simplified conceptual diagram stages, short scope | GitHub → `project-cases.js` |
| Diagram HTML and interaction | GitHub → `showcase.js` |
| Floating transparent UI | GitHub → `project-float.css` |
| Base circle styles | GitHub → `project-case.css` |

The reference-inspired circular diagram is a conceptual overview, not a
verified electrical, EtherCAT, mechanical, or software design schematic.

Example edit in `project-cases.js`:

```js
diagram: [
  { title: "Machine signals", detail: "Industrial I/O" },
  { title: "Motion control", detail: "Taught paths" },
  { title: "PC application", detail: "C# · WPF" },
  { title: "Factory links", detail: "MES · PQM · CFX+" }
]
```

Use up to **six stages**. Only show components truly used in the project.
A different entry with the same title in Google Sheets receives that entry's
diagram automatically (project matching ignores casing and extra spaces).

## What is intentionally hidden

The former full case study modal (hero panel, long bullet list, technology
table and screenshot gallery) is no longer shown. The floating system wheel
is designed for quickly seeing the workflow without reading a long report.

`machineImages` and `uiImages` remain stored in `project-cases.js` for
potential future use; they are not rendered in this floating view.

## Accessibility and responsive design

- Uses labeled floating overlay, keyboard-friendly icon buttons and close.
- `Escape`, backdrop click and Close all return to the Portfolio.
- Light Theme: transparent pale overlay with subtle frosted stage details.
- Dark Theme: translucent dark overlay with the same chart.
- On smaller screens the detail panel moves below the wheel.
- Motion respects the user's reduced-animation preference.
