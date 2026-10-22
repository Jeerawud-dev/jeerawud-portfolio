// Project Case Study content — editable separately from the main Google Sheets portfolio feed.
// Matches Google Sheets 'Portfolio' titles exactly. Keep real machine screenshots/photos here.
// This is a simplified technology map based on the technologies/descriptions in Portfolio,
// NOT a verified electrical diagram or the machine's exact control architecture.
//
// To add images for a project, add records such as:
// machineImages: [{ url: "image/Coatingmachine.jpg", caption: "Coating machine" }]
// uiImages:      [{ url: "image/coating-ui.png", caption: "Motion path editor" }]
// Image paths can be relative to the repo or absolute HTTPS URLs.
// Unavailable images are not falsely represented as project screenshots.
//
// Note: this file is the case-study data source until the existing Google Apps Script feed
// is extended to return projectDetails. If it later returns projectDetails, those values
// can override these defaults. Keep details factual and do not publish proprietary UI.
window.PORTFOLIO_CASE_STUDIES = {
  "Automation & Semi-Automation Equipment": {
    "role": "PLC, HMI and PC-based control development",
    "scope": "Control software and integration for automotive automation equipment.",
    "diagram": [
      {
        "title": "Field devices",
        "detail": "Sensors · Scanners"
      },
      {
        "title": "Machine control",
        "detail": "PLC · HMI · PC"
      },
      {
        "title": "Motion & automation",
        "detail": "Servo · Robots"
      },
      {
        "title": "Production",
        "detail": "Manufacturing equipment"
      }
    ],
    "highlights": [
      "PLC and HMI machine sequences",
      "Robot and servo integration",
      "PC-based production control software"
    ],
    "machineImages": [],
    "uiImages": []
  },
  "R&D Automation / Innovation Design": {
    "role": "Automation software R&D",
    "scope": "PC- and PLC-based machine software and integration.",
    "diagram": [
      {
        "title": "Machine devices",
        "detail": "Vision · Servo motion"
      },
      {
        "title": "Control layer",
        "detail": "PC · PLC"
      },
      {
        "title": "Application",
        "detail": "C# · WPF"
      },
      {
        "title": "Factory systems",
        "detail": "MES · PQM · CFX+"
      }
    ],
    "highlights": [
      "PC and PLC machine development",
      "Vision and servo motion integration",
      "Connection to factory information systems"
    ],
    "machineImages": [],
    "uiImages": []
  },
  "Smart Screw System": {
    "role": "PC-based machine-control software",
    "scope": "Screw fastening station application and tool integration.",
    "diagram": [
      {
        "title": "Station tools",
        "detail": "Screw fastening equipment"
      },
      {
        "title": "Control application",
        "detail": "C# · WPF"
      },
      {
        "title": "Local records",
        "detail": "SQLite"
      },
      {
        "title": "Factory data",
        "detail": "MES · PQM · CFX+"
      }
    ],
    "highlights": [
      "Tool communication and station sequencing",
      "PC-based operator interface",
      "Production record integration"
    ],
    "machineImages": [],
    "uiImages": []
  },
  "Automated Coating Machine": {
    "role": "Machine control and motion software",
    "scope": "Automated coating sequence and recipe/path handling.",
    "diagram": [
      {
        "title": "Machine signals",
        "detail": "Industrial I/O"
      },
      {
        "title": "Motion control",
        "detail": "Taught paths"
      },
      {
        "title": "PC application",
        "detail": "C# · WPF"
      },
      {
        "title": "Factory links",
        "detail": "MES · PQM · CFX+"
      }
    ],
    "highlights": [
      "Motion path teaching and execution",
      "Industrial I/O integration",
      "Factory-system communications"
    ],
    "machineImages": [],
    "uiImages": []
  },
  "High-Speed Glue Dispensing Machine": {
    "role": "Dispensing and motion-control software",
    "scope": "Control application for programmed glue dispensing paths.",
    "diagram": [
      {
        "title": "Machine signals",
        "detail": "Equipment I/O"
      },
      {
        "title": "Motion sequence",
        "detail": "Dispensing paths"
      },
      {
        "title": "PC application",
        "detail": "C# · WPF"
      },
      {
        "title": "Process data",
        "detail": "SQLite · MES"
      }
    ],
    "highlights": [
      "Configurable dispensing motion paths",
      "Machine control and process parameters",
      "Industrial production data integration"
    ],
    "machineImages": [],
    "uiImages": []
  },
  "Thermal Paste Dispensing Machine": {
    "role": "PC-based dispensing control",
    "scope": "Thermal paste equipment software covering setup, motion and running status.",
    "diagram": [
      {
        "title": "Machine setup",
        "detail": "Parameters · Settings"
      },
      {
        "title": "Dispensing motion",
        "detail": "Motion sequence"
      },
      {
        "title": "Operator UI",
        "detail": "C# · WPF"
      },
      {
        "title": "Run data",
        "detail": "SQLite · MES"
      }
    ],
    "highlights": [
      "Operator setup and machine control",
      "Motion sequence monitoring",
      "Production data handling"
    ],
    "machineImages": [],
    "uiImages": []
  }
};
