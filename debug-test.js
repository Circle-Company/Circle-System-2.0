// Teste simples para debugar o filtro
const candidatos = [
    {
        id: "1",
        username: "joao123",
        name: "João Silva",
        verified: true,
        muted: false,
        blocked: false,
        hasProfilePicture: true,
        totalFollowers: 1500,
        distance: 5.2,
        relationWeight: 0.8,
        isYou: false,
        isPremium: true,
        followYou: true,
        youFollow: false,
        blockYou: false
    },
    {
        id: "2",
        username: "maria456",
        name: "Maria Santos",
        verified: false,
        muted: false,
        blocked: false,
        hasProfilePicture: false,
        totalFollowers: 500,
        distance: 15.8,
        relationWeight: 0.3,
        isYou: false,
        isPremium: false,
        followYou: false,
        youFollow: true,
        blockYou: false
    },
    {
        id: "3",
        username: "pedro789",
        name: "Pedro Costa",
        verified: true,
        muted: false,
        blocked: false,
        hasProfilePicture: true,
        totalFollowers: 5000,
        distance: 25.0,
        relationWeight: 0.1,
        isYou: false,
        isPremium: false,
        followYou: true,
        youFollow: true,
        blockYou: false
    },
    {
        id: "4",
        username: "ana012",
        name: "Ana Lima",
        verified: false,
        muted: true,
        blocked: false,
        hasProfilePicture: true,
        totalFollowers: 200,
        distance: 8.5,
        relationWeight: 0.6,
        isYou: false,
        isPremium: false,
        followYou: false,
        youFollow: false,
        blockYou: false
    },
    {
        id: "5",
        username: "eu_mesmo",
        name: "Eu Mesmo",
        verified: true,
        muted: false,
        blocked: false,
        hasProfilePicture: true,
        totalFollowers: 1000,
        distance: 0,
        relationWeight: 1.0,
        isYou: true,
        isPremium: true,
        followYou: false,
        youFollow: false,
        blockYou: false
    }
];

// Fatores padrão
const factors = {
    maxDistance: 50,
    minFollowers: 0,
    maxFollowers: 1000000,
    boostVerified: true,
    boostPremium: true,
    penalizeBlocked: true,
    penalizeMuted: true,
    boostMutualFollow: true,
    boostFollowYou: true,
    penalizeYouFollow: false
};

// Simular o filtro
const validCandidates = candidatos.filter(candidate => {
    console.log(`Analisando ${candidate.username}:`);
    
    // Não incluir o próprio usuário
    if (candidate.isYou) {
        console.log(`  - Removido: é o próprio usuário`);
        return false;
    }

    // Filtrar usuários bloqueados se penalização estiver ativa
    if (factors.penalizeBlocked && candidate.blocked) {
        console.log(`  - Removido: usuário bloqueado`);
        return false;
    }

    // Filtrar usuários bloqueados por você
    if (candidate.blockYou) {
        console.log(`  - Removido: usuário te bloqueou`);
        return false;
    }

    // Filtrar usuários silenciados se penalização estiver ativa
    if (factors.penalizeMuted && candidate.muted) {
        console.log(`  - Removido: usuário silenciado`);
        return false;
    }

    // Filtrar por distância máxima
    if (candidate.distance && candidate.distance > factors.maxDistance) {
        console.log(`  - Removido: distância ${candidate.distance} > ${factors.maxDistance}`);
        return false;
    }

    // Filtrar por número de seguidores
    if (candidate.totalFollowers < factors.minFollowers || 
        candidate.totalFollowers > factors.maxFollowers) {
        console.log(`  - Removido: seguidores ${candidate.totalFollowers} fora da faixa ${factors.minFollowers}-${factors.maxFollowers}`);
        return false;
    }

    console.log(`  - Mantido`);
    return true;
});

console.log(`\nResultado: ${validCandidates.length} usuários válidos de ${candidatos.length}`);
console.log('Usuários válidos:', validCandidates.map(u => u.username));
