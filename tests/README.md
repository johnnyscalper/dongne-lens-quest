# Automated checks

Run `python3 -m unittest discover -s tests -v` from the repository root. The 66 checks cover market calculations, matched-cohort experiments, official XML parsing and local HTTP integration.

No live API key or external network is needed. HTTP integration starts and closes its own localhost server on an available port.
