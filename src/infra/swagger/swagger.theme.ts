/**
 * Swagger UI Theme - Customização visual profissional
 *
 * Define cores, estilos e layout customizado para o Swagger UI
 *
 * @author Circle System Team
 * @version 1.0.0
 */

/**
 * CSS customizado para o Swagger UI
 * Aplica tema profissional com cores do Circle System
 */
export const SWAGGER_CUSTOM_CSS = `
/* ===== VARIÁVEIS DE CORES ===== */
:root {
    --circle-primary: #6366f1;
    --circle-primary-dark: #4f46e5;
    --circle-primary-light: #818cf8;
    --circle-secondary: #10b981;
    --circle-danger: #ef4444;
    --circle-warning: #f59e0b;
    --circle-info: #3b82f6;
    --circle-success: #22c55e;
    
    --circle-bg-main: #0f172a;
    --circle-bg-secondary: #1e293b;
    --circle-bg-card: #334155;
    --circle-text-primary: #f8fafc;
    --circle-text-secondary: #cbd5e1;
    --circle-text-muted: #94a3b8;
    
    --circle-border: #475569;
    --circle-shadow: rgba(0, 0, 0, 0.3);
}

/* ===== ESTILOS GLOBAIS ===== */
body {
    background: linear-gradient(135deg, var(--circle-bg-main) 0%, var(--circle-bg-secondary) 100%);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.swagger-ui {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
}

/* ===== HEADER/TOPBAR ===== */
.swagger-ui .topbar {
    background: linear-gradient(90deg, var(--circle-primary) 0%, var(--circle-primary-dark) 100%);
    padding: 1.5rem 2rem;
    border-bottom: 3px solid var(--circle-primary-light);
    box-shadow: 0 4px 6px var(--circle-shadow);
}

.swagger-ui .topbar .wrapper {
    max-width: 1400px;
    margin: 0 auto;
}

.swagger-ui .topbar .download-url-wrapper {
    display: none; /* Esconder input de URL */
}

/* ===== INFO SECTION ===== */
.swagger-ui .info {
    background: var(--circle-bg-card);
    border-radius: 12px;
    padding: 2rem;
    margin: 2rem 0;
    border: 1px solid var(--circle-border);
    box-shadow: 0 4px 6px var(--circle-shadow);
}

.swagger-ui .info .title {
    color: var(--circle-text-primary);
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(90deg, var(--circle-primary-light), var(--circle-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.swagger-ui .info .description {
    color: var(--circle-text-secondary);
    line-height: 1.6;
    font-size: 1rem;
}

.swagger-ui .info .description p,
.swagger-ui .info .description ul,
.swagger-ui .info .description h1,
.swagger-ui .info .description h2,
.swagger-ui .info .description h3 {
    color: var(--circle-text-secondary) !important;
}

.swagger-ui .info .description h2 {
    color: var(--circle-primary-light) !important;
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    border-bottom: 2px solid var(--circle-primary);
    padding-bottom: 0.5rem;
}

.swagger-ui .info .description h3 {
    color: var(--circle-text-primary) !important;
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1rem;
}

.swagger-ui .info .description code {
    background: var(--circle-bg-secondary);
    color: var(--circle-primary-light);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-family: 'Fira Code', 'Consolas', monospace;
}

.swagger-ui .info .description pre {
    background: var(--circle-bg-main);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
}

/* ===== SCHEME CONTAINER (SERVERS) ===== */
.swagger-ui .scheme-container {
    background: var(--circle-bg-card);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
    box-shadow: 0 2px 4px var(--circle-shadow);
}

.swagger-ui .scheme-container .schemes > label {
    color: var(--circle-text-primary);
    font-weight: 600;
}

.swagger-ui .scheme-container select {
    background: var(--circle-bg-secondary);
    color: var(--circle-text-primary);
    border: 1px solid var(--circle-border);
    border-radius: 6px;
    padding: 0.5rem;
}

/* ===== OPERATIONS (TAGS E ENDPOINTS) ===== */
.swagger-ui .opblock-tag {
    background: var(--circle-bg-card);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    margin: 1.5rem 0;
    box-shadow: 0 2px 4px var(--circle-shadow);
    transition: all 0.3s ease;
}

.swagger-ui .opblock-tag:hover {
    box-shadow: 0 4px 8px var(--circle-shadow);
    border-color: var(--circle-primary);
}

.swagger-ui .opblock-tag-section {
    padding: 0.5rem;
}

.swagger-ui .opblock-tag .opblock-tag-section h3 {
    color: var(--circle-text-primary);
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    padding: 1rem;
}

.swagger-ui .opblock-tag small {
    color: var(--circle-text-muted);
    font-size: 0.9rem;
}

/* ===== MÉTODOS HTTP ===== */
.swagger-ui .opblock {
    border-radius: 8px;
    margin: 0.75rem 0;
    border: 1px solid var(--circle-border);
    overflow: hidden;
}

/* GET - Azul */
.swagger-ui .opblock.opblock-get {
    background: rgba(59, 130, 246, 0.1);
    border-left: 4px solid var(--circle-info);
}

.swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: var(--circle-info);
}

/* POST - Verde */
.swagger-ui .opblock.opblock-post {
    background: rgba(34, 197, 94, 0.1);
    border-left: 4px solid var(--circle-success);
}

.swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: var(--circle-success);
}

/* PUT/PATCH - Laranja */
.swagger-ui .opblock.opblock-put,
.swagger-ui .opblock.opblock-patch {
    background: rgba(245, 158, 11, 0.1);
    border-left: 4px solid var(--circle-warning);
}

.swagger-ui .opblock.opblock-put .opblock-summary-method,
.swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: var(--circle-warning);
}

/* DELETE - Vermelho */
.swagger-ui .opblock.opblock-delete {
    background: rgba(239, 68, 68, 0.1);
    border-left: 4px solid var(--circle-danger);
}

.swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: var(--circle-danger);
}

/* ===== SUMMARY ===== */
.swagger-ui .opblock-summary {
    padding: 0.75rem 1rem;
    align-items: center;
}

.swagger-ui .opblock-summary-method {
    border-radius: 6px;
    font-weight: 700;
    padding: 0.5rem 1rem;
    min-width: 80px;
    text-align: center;
}

.swagger-ui .opblock-summary-path {
    color: var(--circle-text-primary);
    font-family: 'Fira Code', monospace;
    font-size: 1rem;
    font-weight: 600;
}

.swagger-ui .opblock-summary-description {
    color: var(--circle-text-secondary);
    font-size: 0.9rem;
}

/* ===== BODY/DESCRIPTION ===== */
.swagger-ui .opblock-body {
    background: var(--circle-bg-secondary);
    padding: 1.5rem;
}

.swagger-ui .opblock-description-wrapper {
    color: var(--circle-text-secondary);
    padding: 1rem;
    background: var(--circle-bg-main);
    border-radius: 6px;
    margin-bottom: 1rem;
}

.swagger-ui .opblock-description-wrapper p {
    color: var(--circle-text-secondary);
    line-height: 1.6;
}

/* ===== PARAMETERS/RESPONSES ===== */
.swagger-ui .parameters-col_description,
.swagger-ui .response-col_description {
    color: var(--circle-text-secondary);
}

.swagger-ui .parameters-col_description input,
.swagger-ui .parameters-col_description textarea,
.swagger-ui .parameters-col_description select {
    background: var(--circle-bg-main);
    border: 1px solid var(--circle-border);
    color: var(--circle-text-primary);
    border-radius: 6px;
}

.swagger-ui .parameter__name {
    color: var(--circle-text-primary);
    font-weight: 600;
}

.swagger-ui .parameter__type {
    color: var(--circle-primary-light);
    font-family: 'Fira Code', monospace;
}

/* ===== RESPONSES ===== */
.swagger-ui .responses-wrapper {
    margin-top: 1rem;
}

.swagger-ui .response {
    background: var(--circle-bg-main);
    border: 1px solid var(--circle-border);
    border-radius: 6px;
    margin: 0.5rem 0;
}

.swagger-ui .response-col_status {
    color: var(--circle-text-primary);
    font-weight: 700;
}

/* ===== MODELS ===== */
.swagger-ui .models {
    background: var(--circle-bg-card);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    margin: 2rem 0;
    padding: 1.5rem;
}

.swagger-ui .model-container {
    background: var(--circle-bg-secondary);
    border-radius: 6px;
    margin: 0.5rem 0;
}

.swagger-ui .model-title {
    color: var(--circle-text-primary);
    font-weight: 700;
}

.swagger-ui .model {
    color: var(--circle-text-secondary);
}

/* ===== BUTTONS ===== */
.swagger-ui .btn {
    border-radius: 6px;
    font-weight: 600;
    padding: 0.625rem 1.25rem;
    transition: all 0.3s ease;
    border: none;
}

.swagger-ui .btn.execute {
    background: linear-gradient(90deg, var(--circle-primary), var(--circle-primary-dark));
    color: white;
    box-shadow: 0 2px 4px var(--circle-shadow);
}

.swagger-ui .btn.execute:hover {
    background: linear-gradient(90deg, var(--circle-primary-dark), var(--circle-primary));
    box-shadow: 0 4px 8px var(--circle-shadow);
    transform: translateY(-2px);
}

.swagger-ui .btn.cancel {
    background: var(--circle-danger);
    color: white;
}

.swagger-ui .btn.cancel:hover {
    background: #dc2626;
}

.swagger-ui .btn.authorize {
    background: var(--circle-success);
    color: white;
    border: none;
}

.swagger-ui .btn.authorize:hover {
    background: #16a34a;
}

/* ===== AUTHORIZATION ===== */
.swagger-ui .auth-wrapper {
    background: var(--circle-bg-card);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    padding: 1.5rem;
}

.swagger-ui .auth-container {
    background: var(--circle-bg-secondary);
    border-radius: 6px;
    padding: 1rem;
}

/* ===== SYNTAX HIGHLIGHTING ===== */
.swagger-ui .highlight-code {
    background: var(--circle-bg-main);
    border: 1px solid var(--circle-border);
    border-radius: 6px;
}

.swagger-ui .microlight {
    color: var(--circle-text-primary);
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}

::-webkit-scrollbar-track {
    background: var(--circle-bg-secondary);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb {
    background: var(--circle-primary);
    border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--circle-primary-dark);
}

/* ===== TRY IT OUT ===== */
.swagger-ui .try-out {
    background: var(--circle-bg-secondary);
    border-radius: 6px;
    padding: 1rem;
    margin: 1rem 0;
}

.swagger-ui .try-out__btn {
    background: var(--circle-primary);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-weight: 600;
}

.swagger-ui .try-out__btn:hover {
    background: var(--circle-primary-dark);
}

/* ===== LOADING ===== */
.swagger-ui .loading-container {
    background: var(--circle-bg-card);
    color: var(--circle-text-primary);
}

/* ===== FILTER ===== */
.swagger-ui .filter-container {
    background: var(--circle-bg-card);
    border: 1px solid var(--circle-border);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
}

.swagger-ui .filter-container input {
    background: var(--circle-bg-secondary);
    border: 1px solid var(--circle-border);
    color: var(--circle-text-primary);
    border-radius: 6px;
    padding: 0.75rem;
    width: 100%;
}

.swagger-ui .filter-container input:focus {
    border-color: var(--circle-primary);
    outline: none;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* ===== RESPONSIVIDADE ===== */
@media (max-width: 768px) {
    .swagger-ui {
        padding: 1rem;
    }
    
    .swagger-ui .info .title {
        font-size: 2rem;
    }
    
    .swagger-ui .opblock-summary {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .swagger-ui .opblock-summary-method {
        margin-bottom: 0.5rem;
    }
}
`

/**
 * HTML customizado para o Swagger UI
 * Adiciona favicon, meta tags e outras customizações
 */
export const SWAGGER_CUSTOM_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Circle System API - Documentação</title>
    <meta name="description" content="Documentação completa da API do Circle System">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <div id="swagger-ui"></div>
</body>
</html>
`
