// Teste para maxDistance: 10
const candidatos = [
    {
        id: "1",
        username: "joao123",
        distance: 5.2,
        muted: false,
        blocked: false,
        isYou: false,
        blockYou: false,
        totalFollowers: 1500
    },
    {
        id: "2",
        username: "maria456",
        distance: 15.8,
        muted: false,
        blocked: false,
        isYou: false,
        blockYou: false,
        totalFollowers: 500
    },
    {
        id: "3",
        username: "pedro789",
        distance: 25.0,
        muted: false,
        blocked: false,
        isYou: false,
        blockYou: false,
        totalFollowers: 5000
    },
    {
        id: "4",
        username: "ana012",
        distance: 8.5,
        muted: true,
        blocked: false,
        isYou: false,
        blockYou: false,
        totalFollowers: 200
    }
];

const factors = {
    maxDistance: 10,
    minFollowers: 0,
    maxFollowers: 1000000,
    penalizeBlocked: true,
    penalizeMuted: true
};

const validCandidates = candidatos.filter(candidate => {
    console.log(`Analisando ${candidate.username} (distância: ${candidate.distance}):`);
    
    if (candidate.isYou) {
        console.log(`  - Removido: é o próprio usuário`);
        return false;
    }

    if (factors.penalizeBlocked && candidate.blocked) {
        console.log(`  - Removido: usuário bloqueado`);
        return false;
    }

    if (candidate.blockYou) {
        console.log(`  - Removido: usuário te bloqueou`);
        return false;
    }

    if (factors.penalizeMuted && candidate.muted) {
        console.log(`  - Removido: usuário silenciado`);
        return false;
    }

    if (candidate.distance && candidate.distance > factors.maxDistance) {
        console.log(`  - Removido: distância ${candidate.distance} > ${factors.maxDistance}`);
        return false;
    }

    if (candidate.totalFollowers < factors.minFollowers || 
        candidate.totalFollowers > factors.maxFollowers) {
        console.log(`  - Removido: seguidores fora da faixa`);
        return false;
    }

    console.log(`  - Mantido`);
    return true;
});

console.log(`\nResultado: ${validCandidates.length} usuários válidos`);
console.log('Usuários válidos:', validCandidates.map(u => u.username));
