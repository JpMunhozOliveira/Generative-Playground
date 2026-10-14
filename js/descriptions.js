export const experimentDescriptions = {
    mandala: {
        title: "Mandala Geométrica",
        desc: "Usa trigonometria polar (raio e ângulo) para replicar formas simétricas ao longo de um círculo. O algoritmo divide o espaço em setores iguais e desenha curvas espelhadas em tempo real."
    },
    particles: {
        title: "Sistema de Partículas",
        desc: "Simulação de agentes autônomos em movimento livre que calculam a distância entre si. Quando dois pontos estão próximos o suficiente, uma linha é traçada, formando uma rede neural orgânica."
    },
    noise: {
        title: "Padrão de Ruído Harmônico",
        desc: "Gera um campo contínuo combinando ondas senoidais e cossenoidais em múltiplas frequências (interferência harmônica), mapeando os valores resultantes para tons de cores."
    },
    flowField: {
        title: "Flow Field (Campo de Vetores)",
        desc: "Milhares de partículas navegam por uma grade invisível de direções gerada por funções matemáticas. O rastro acumulado revela correntes fluidas semelhantes a topografias ou fumaça."
    },
    attractor: {
        title: "Atrator Caótico (Clifford)",
        desc: "Aplica equações matemáticas não-lineares e recursivas para calcular milhares de posições. Pequenas variações nos coeficientes geram padrões fractais extremamente complexos e caóticos."
    },
    lissajous: {
        title: "Curvas Lissajous",
        desc: "Visualização matemática da interferência entre oscilações perpendiculares com frequências diferentes. O gráfico forma figuras geométricas harmônicas perfeitas (harmonógrafo)."
    },
    fractalTree: {
        title: "Árvore Fractal",
        desc: "Utiliza recursividade: um tronco se divide repetidamente em galhos menores em ângulos simétricos, simulando crescimento orgânico e reagindo a uma simulação de vento."
    },
    voronoi: {
        title: "Diagrama de Voronoi",
        desc: "Divide o plano em células: cada região contém todos os pontos mais próximos de uma semente do que de qualquer outra. As sementes se movem e as células se reorganizam em tempo real, formando padrões que lembram texturas naturais, como asas de insetos ou espuma."
    },
    reactionDiffusion: {
        title: "Reação-Difusão (Gray-Scott)",
        desc: "Simula dois químicos que se espalham e reagem: V consome U para se replicar, U é reabastecido e V se decompõe. Ajustando só as taxas de alimentação e remoção surgem corais, labirintos e manchas que se dividem como células — o mesmo mecanismo que Alan Turing propôs para explicar padrões na pele de animais."
    },
    physarum: {
        title: "Physarum (Bolor Limoso)",
        desc: "Dezenas de milhares de agentes seguem regras simples: farejam o rastro à frente, viram na direção do mais forte, andam e deixam rastro. O rastro se espalha e evapora. Sem nenhum controle central surgem redes de transporte eficientes, como as do organismo real Physarum polycephalum."
    },
    fractal: {
        title: "Fractais de Julia e Mandelbrot",
        desc: "Itera z → z² + c e colore cada ponto pelo tempo que ele leva para escapar ao infinito. No modo Julia, c percorre um círculo e o conjunto se transforma continuamente. No modo Mandelbrot, a câmera mergulha num zoom infinito rumo a um ponto da fronteira, revelando detalhes autossemelhantes até o limite de precisão numérica."
    },
    boids: {
        title: "Boids (Revoada)",
        desc: "Modelo de Craig Reynolds (1986): cada pássaro só enxerga os vizinhos próximos e segue três regras — separação, alinhamento e coesão. O comportamento de bando surge sem nenhum líder. Uma grade espacial evita comparar todos os pares de pássaros."
    }
};