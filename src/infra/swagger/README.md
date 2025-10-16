# 📚 Documentação Swagger - Circle System API

## 🎯 Visão Geral

Sistema de documentação profissional e robusto para a API do Circle System, construído com Swagger/OpenAPI 3.0.3.

## ✨ Features Implementadas

### 🎨 Visual Profissional

-   **Tema Customizado**: Interface moderna com cores da marca Circle System
-   **Dark Mode**: Tema escuro otimizado para desenvolvimento
-   **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
-   **Tipografia**: Fontes Inter e Fira Code para melhor legibilidade
-   **Animações**: Transições suaves e feedback visual

### 📋 Organização

-   **Tags Organizadas**: Rotas agrupadas por domínio de negócio

    -   Authentication (Autenticação)
    -   Account (Conta do Usuário)
    -   Users (Gestão de Usuários)
    -   Moments (Conteúdo)
    -   Moment Interactions (Interações)
    -   Metrics (Métricas e Analytics)
    -   Search & Discovery (Busca)
    -   Moderation (Moderação)
    -   Admin (Administração)
    -   System (Sistema)

-   **Ordenação Lógica**: Tags e operações ordenadas de forma intuitiva
-   **Descrições Detalhadas**: Cada endpoint com documentação completa
-   **Exemplos Reais**: Requests e responses com exemplos práticos

### 🔐 Segurança

-   **Autenticação JWT**: Sistema completo de autenticação documentado
-   **Persistência de Token**: Authorization persiste entre reloads
-   **Exemplos de Segurança**: Demonstração clara de como usar tokens

### 📊 Schemas Robustos

-   **Schemas Reutilizáveis**: Componentes definidos uma vez, usados em múltiplos lugares
-   **Validação Completa**: Tipos, formatos, ranges e patterns
-   **Exemplos em Schemas**: Cada campo com exemplo relevante
-   **Respostas Padronizadas**: HTTP responses consistentes

### 🚀 Funcionalidades

-   **Try It Out**: Teste endpoints diretamente da documentação
-   **Syntax Highlighting**: Código com destaque de sintaxe (tema Monokai)
-   **Busca**: Filtro rápido de endpoints
-   **Deep Linking**: URLs compartilháveis para endpoints específicos
-   **Request Duration**: Medição de tempo de resposta
-   **Múltiplos Ambientes**: Seleção entre dev, staging e produção

## 📂 Estrutura de Arquivos

```
src/infra/swagger/
├── index.ts                    # Exports principais e setupSwagger()
├── swagger.config.ts           # Configuração principal do Swagger
├── swagger.theme.ts            # CSS customizado e tema visual
├── tags.config.ts              # Definição e organização de tags
├── swagger.integration.ts      # Integração com Fastify
├── README.md                   # Esta documentação
├── schemas/
│   ├── index.ts               # Export de todos os schemas
│   ├── common.schemas.ts      # Schemas comuns (pagination, errors, etc)
│   ├── auth.schemas.ts        # Schemas de autenticação
│   ├── user.schemas.ts        # Schemas de usuários
│   └── moment.schemas.ts      # Schemas de momentos
├── decorators/
│   └── swagger.decorators.ts  # Decorators para rotas
└── generator/
    └── swagger.generator.ts   # Gerador automático de docs
```

## 🎨 Customização Visual

### Cores do Tema

```css
--circle-primary: #6366f1        /* Roxo primário */
--circle-primary-dark: #4f46e5   /* Roxo escuro */
--circle-primary-light: #818cf8  /* Roxo claro */
--circle-secondary: #10b981      /* Verde secundário */
--circle-success: #22c55e        /* Verde sucesso */
--circle-danger: #ef4444         /* Vermelho erro */
--circle-warning: #f59e0b        /* Laranja aviso */
--circle-info: #3b82f6           /* Azul info */
```

### Métodos HTTP

Cada método HTTP tem sua cor característica:

-   🔵 **GET**: Azul (`#3b82f6`)
-   🟢 **POST**: Verde (`#22c55e`)
-   🟠 **PUT/PATCH**: Laranja (`#f59e0b`)
-   🔴 **DELETE**: Vermelho (`#ef4444`)

## 🔧 Configuração

### Opções do Swagger UI

```typescript
{
  docExpansion: "list",              // Exibir lista de endpoints
  deepLinking: true,                 // URLs compartilháveis
  displayRequestDuration: true,      // Mostrar tempo de resposta
  filter: true,                      // Habilitar busca
  persistAuthorization: true,        // Manter token
  syntaxHighlight: {
    theme: "monokai"                 // Tema de código
  },
  tryItOutEnabled: true              // Permitir testes
}
```

## 📝 Como Usar

### 1. Acessar Documentação

Navegue para `http://localhost:3000/docs` em seu navegador.

### 2. Autenticar

1. Clique no botão **Authorize** 🔓 no topo
2. Faça login via endpoint `POST /signin`
3. Copie o token retornado
4. Cole no formato: `Bearer SEU_TOKEN_AQUI`
5. Clique em **Authorize**
6. Agora você pode testar endpoints protegidos ✅

### 3. Testar Endpoints

1. Expanda qualquer endpoint
2. Clique em **Try it out**
3. Preencha os parâmetros necessários
4. Clique em **Execute**
5. Veja a resposta em tempo real

### 4. Explorar Schemas

1. Role até a seção **Schemas** no final
2. Explore os modelos de dados
3. Veja exemplos e validações

## 🎯 Boas Práticas

### Para Desenvolvedores

1. **Sempre documente novos endpoints**

    - Adicione tags apropriadas
    - Forneça descrição detalhada
    - Inclua exemplos de request/response
    - Especifique todos os códigos de status possíveis

2. **Use schemas reutilizáveis**

    ```typescript
    response: {
      200: { $ref: "#/components/schemas/UserResponse" },
      401: { $ref: "#/components/responses/Unauthorized" }
    }
    ```

3. **Mantenha tags organizadas**

    - Use tags existentes quando possível
    - Adicione novas tags em `tags.config.ts`
    - Atualize `TAG_ORDER` para ordenação

4. **Adicione exemplos realistas**
    - Use dados que fazem sentido
    - Mostre casos de sucesso E erro
    - Inclua edge cases importantes

### Para QA/Testers

1. Use o Swagger para entender contratos da API
2. Teste casos de sucesso e erro
3. Valide schemas de resposta
4. Reporte inconsistências na documentação

### Para Product/Stakeholders

1. Use como referência de funcionalidades
2. Entenda fluxos de autenticação
3. Veja métricas e analytics disponíveis
4. Planeje integrações com terceiros

## 🚀 Próximos Passos

### Melhorias Planejadas

-   [ ] Adicionar exemplos de código (cURL, JavaScript, Python)
-   [ ] Documentar webhooks
-   [ ] Adicionar rate limiting documentation
-   [ ] Criar guias de integração
-   [ ] Adicionar changelog de versões
-   [ ] Implementar versionamento da API (v1, v2)
-   [ ] Adicionar métricas de uso dos endpoints
-   [ ] Criar playground interativo

## 📚 Recursos Adicionais

### Links Úteis

-   [OpenAPI Specification](https://swagger.io/specification/)
-   [Fastify Swagger](https://github.com/fastify/fastify-swagger)
-   [Swagger UI](https://swagger.io/tools/swagger-ui/)

### Referências Internas

-   `docs/FLUXO_CRIACAO_MOMENT.md` - Fluxo de criação de momentos
-   `README_USER_SEARCH_ENGINE.md` - Sistema de busca de usuários

## 🤝 Contribuindo

Ao adicionar novos endpoints:

1. Defina schemas em `src/infra/swagger/schemas/`
2. Use tags apropriadas de `tags.config.ts`
3. Adicione descrições detalhadas
4. Inclua exemplos de request/response
5. Documente todos os códigos de status
6. Teste no Swagger UI antes de commit

## 📄 Licença

Proprietary - Internal Use Only

---

**Desenvolvido por Circle System Team** 🚀

Para dúvidas ou sugestões, contate: dev@circle.com
