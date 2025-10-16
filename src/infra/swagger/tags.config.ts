/**
 * Tags Configuration - Organização e agrupamento de rotas no Swagger
 *
 * Define a estrutura de navegação e categorização das rotas da API
 *
 * @author Circle System Team
 * @version 1.0.0
 */

export interface SwaggerTag {
    name: string
    description: string
    externalDocs?: {
        description: string
        url: string
    }
}

/**
 * Tags principais da API
 * Organizadas por domínio de negócio
 */
export const API_TAGS: SwaggerTag[] = [
    // ===== AUTENTICAÇÃO E AUTORIZAÇÃO =====
    {
        name: "Authentication",
        description: `
**Autenticação e Gestão de Sessões**

Endpoints para autenticação de usuários, criação de contas e gestão de tokens de acesso.

**Recursos:**
- Login (SignIn) com múltiplos dispositivos
- Registro de novos usuários (SignUp)
- Gestão de tokens JWT
- Logout e invalidação de sessões
- Refresh de tokens expirados

**Segurança:**
- Criptografia de senhas com bcrypt
- Tokens JWT com expiração configurável
- Validação de força de senha
- Rate limiting automático
        `.trim(),
    },
    {
        name: "Authorization",
        description: `
**Sistema de Autorização e Permissões**

Controle de acesso baseado em roles e permissões granulares.

**Features:**
- RBAC (Role-Based Access Control)
- Permissões granulares por recurso
- Hierarquia de roles
- Validação em tempo real
        `.trim(),
    },

    // ===== GESTÃO DE USUÁRIOS =====
    {
        name: "Account",
        description: `
**Gestão de Conta do Usuário Autenticado**

Endpoints para gerenciar dados e configurações da conta do usuário logado.

**Recursos:**
- Visualização de dados da conta
- Atualização de perfil
- Configurações de privacidade
- Gestão de preferências
- Histórico de atividades
        `.trim(),
    },
    {
        name: "Users",
        description: `
**Gestão de Usuários (Admin)**

Operações administrativas para gestão de usuários do sistema.

**Recursos:**
- Listagem e busca de usuários
- Atualização de dados de terceiros
- Moderação de contas
- Estatísticas de usuários
- Gestão de bloqueios e suspensões
        `.trim(),
    },
    {
        name: "User Profile",
        description: `
**Perfis Públicos de Usuários**

Visualização e interação com perfis públicos.

**Recursos:**
- Visualização de perfil público
- Seguir/Deixar de seguir
- Listagem de seguidores
- Histórico de momentos públicos
        `.trim(),
    },

    // ===== MOMENTOS (CONTEÚDO) =====
    {
        name: "Moments",
        description: `
**Sistema de Momentos (Conteúdo Principal)**

CRUD completo para gestão de momentos - o conteúdo principal da plataforma.

**Recursos:**
- Criação de momentos com mídia (imagem/vídeo)
- Edição e atualização de momentos
- Exclusão lógica e física
- Listagem com filtros avançados
- Busca semântica e por tags
- Sistema de visibilidade (público/privado/amigos)

**Features Avançadas:**
- Upload de múltiplas mídias
- Processamento automático de vídeo
- Moderação de conteúdo
- Geolocalização
- Hashtags e menções
        `.trim(),
    },
    {
        name: "Moment Interactions",
        description: `
**Interações com Momentos**

Sistema de engajamento e interações sociais.

**Recursos:**
- Likes e reações
- Sistema de comentários
- Compartilhamentos
- Saves/Favoritos
- Denúncias e moderação
        `.trim(),
    },
    {
        name: "Moment Comments",
        description: `
**Gestão de Comentários**

Sistema completo de comentários em momentos.

**Recursos:**
- Criação de comentários
- Respostas e threads
- Likes em comentários
- Moderação de comentários
- Denúncias
        `.trim(),
    },

    // ===== MÉTRICAS E ANALYTICS =====
    {
        name: "Moment Metrics",
        description: `
**Métricas e Analytics de Momentos**

Sistema avançado de métricas e analytics para momentos.

**Recursos:**
- Visualizações e alcance
- Engajamento (likes, comentários, shares)
- Taxa de retenção
- Audiência e demografia
- Performance temporal
- Comparação de métricas
        `.trim(),
    },
    {
        name: "User Metrics",
        description: `
**Métricas de Usuários**

Analytics e estatísticas de usuários.

**Recursos:**
- Crescimento de seguidores
- Taxa de engajamento
- Alcance total
- Performance de conteúdo
- Relatórios de atividade
        `.trim(),
    },

    // ===== BUSCA E DESCOBERTA =====
    {
        name: "Search",
        description: `
**Sistema de Busca Avançada**

Busca semântica e filtros avançados.

**Recursos:**
- Busca por texto completo
- Filtros múltiplos (tags, localização, data)
- Busca semântica com embeddings
- Sugestões automáticas
- Histórico de buscas
        `.trim(),
    },
    {
        name: "Discovery",
        description: `
**Feed de Descoberta**

Sistema de recomendação de conteúdo.

**Recursos:**
- Feed personalizado
- Trending topics
- Recomendações baseadas em IA
- Explorar por categoria
        `.trim(),
    },

    // ===== MODERAÇÃO =====
    {
        name: "Moderation",
        description: `
**Sistema de Moderação de Conteúdo**

Ferramentas para moderação e controle de qualidade.

**Recursos:**
- Análise automática de conteúdo
- Detecção de conteúdo impróprio
- Sistema de denúncias
- Fila de moderação
- Ações de moderação (aprovar, rejeitar, banir)
        `.trim(),
    },

    // ===== ADMINISTRAÇÃO =====
    {
        name: "Admin",
        description: `
**Painel Administrativo**

Operações administrativas e de gestão do sistema.

**Recursos:**
- Dashboard de estatísticas
- Gestão de usuários
- Configurações do sistema
- Logs e auditoria
- Gerenciamento de permissões
        `.trim(),
    },

    // ===== SISTEMA E HEALTH =====
    {
        name: "System",
        description: `
**Status e Saúde do Sistema**

Endpoints para monitoramento e diagnóstico.

**Recursos:**
- Health check
- Métricas de performance
- Status dos serviços
- Versão da API
        `.trim(),
    },
]

/**
 * Mapeamento de grupos de tags para melhor organização
 */
export const TAG_GROUPS = {
    auth: ["Authentication", "Authorization"],
    users: ["Account", "Users", "User Profile"],
    content: ["Moments", "Moment Interactions", "Moment Comments"],
    analytics: ["Moment Metrics", "User Metrics"],
    discovery: ["Search", "Discovery"],
    admin: ["Moderation", "Admin", "System"],
} as const

/**
 * Ordem de exibição das tags no Swagger UI
 */
export const TAG_ORDER = [
    // Auth primeiro
    "Authentication",
    "Authorization",

    // Depois usuários
    "Account",
    "Users",
    "User Profile",

    // Conteúdo principal
    "Moments",
    "Moment Interactions",
    "Moment Comments",

    // Analytics
    "Moment Metrics",
    "User Metrics",

    // Discovery
    "Search",
    "Discovery",

    // Admin por último
    "Moderation",
    "Admin",
    "System",
]

/**
 * Helper para obter tag por nome
 */
export function getTagByName(name: string): SwaggerTag | undefined {
    return API_TAGS.find((tag) => tag.name === name)
}

/**
 * Helper para validar se uma tag existe
 */
export function isValidTag(name: string): boolean {
    return API_TAGS.some((tag) => tag.name === name)
}
