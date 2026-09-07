export const YP_CATEGORIES = [
  'AÇÃO', 'AVENTURA', 'COMÉDIA', 'DANÇA', 'DOCUMENTARIO', 'ESPORTE', 'DRAMA',
  'SCIFY', 'FICÇÃO', 'MISTÉRIO', 'MUSICAL', 'ROMANCE', 'TERROR',
] as const

export type YpTitle = {
  id: string
  name: string
  cat: string
  kind: 'serie' | 'filme'
  duration: string
  episodes?: number
  poster: string
  hue: number
}

const NAME_POOL: Record<string, string[]> = {
  'AÇÃO': ['Operação Q', ' Código Vermelho', 'Missão Tesaka', 'Força QGroup', 'Alvo Móvel', 'Blindados', 'Choque de Frente', 'Última Ordem'],
  'AVENTURA': ['Rota Selvagem', 'Trilha 7', 'Além do Vale', 'Expedição Q', 'Rumo ao Pico', 'Ilhas Perdidas', 'Caminho de Ferro', 'Oryx'],
  'COMÉDIA': ['Riso Q', 'Vizinhos do 7', 'Papo Reto', 'Família Bagunça', 'Stand-Up Q', 'Zona Curiosa', 'Chega Mais', 'Trocadilhos'],
  'DANÇA': ['Passo a Passo', 'Ritmo Q', 'Pista de Prata', 'Battle Kpop', 'Coreografia QG', 'Balança', 'Duelo de Pistas', 'Flash Steps'],
  'DOCUMENTARIO': ['Planeta Aberto', 'Fronteira Humana', 'Máquinas de Q', 'Cidade Vertical', 'Oceanos Profundos', 'Origem Digital', 'Céus de Aço', 'Raízes'],
  'ESPORTE': ['Jogo Bonito Q', 'Velocidade QG', 'Arena 7', 'Olimpo Urbano', 'Radical Total', 'Camp Q', 'Maratona Q', 'Time da Casa'],
  'DRAMA': ['Corações de Q', 'Segunda Chance', 'Vozes do Silêncio', 'Herança', 'Manhãs Cinzas', 'Laços QG', 'Retratos', 'Fim de Tarde'],
  'SCIFY': ['Órbita Q', 'Neon Protocol', 'Estação 7', 'Androides de Prata', 'Hiperespaço', 'Colônia Alpha', 'Reator Zero', 'Singularity BR'],
  'FICÇÃO': ['Contos do Amanhã', 'Espelho Quebrado', 'Cidade Inventada', 'O Sétimo Selo Q', 'Mundos Paralelos', 'Papel e Vapor', 'Fábrica de Sonhos', 'Ilha Nenhuma'],
  'MISTÉRIO': ['Caso Encerrado?', 'Sinais Q', 'O Informante', 'Rua Sem Saída', 'Câmara 7', 'Desaparecidos', 'Interrogatório', 'Tese do Crime'],
  'MUSICAL': ['Palco Q', 'Vozes de Ouro', 'Turnê Infinita', 'Batida 7', 'Coral QG', 'Shows da Meia-Noite', 'Viola e Neon', 'Sarau Elétrico'],
  'ROMANCE': ['Amor em Q', 'Cartas de Verão', 'Dois Trens', 'Café da Meia-Noite', 'Encontro Marcado', 'Praia de Inverno', 'Pétalas', 'Segunda Pessoa'],
  'TERROR': ['Hora do Pesadelo', 'Casa Q', 'O Silêncio Lá Fora', 'Sótão', '13 Andar', 'Bestas de Vidro', 'Eco Noturno', 'Vigília'],
}

function hash(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function titlesForCat(cat: string): YpTitle[] {
  const pool = NAME_POOL[cat] || ['Título Q']
  return pool.map((raw, i) => {
    const name = raw.trim()
    const h = hash(cat + name)
    const kind: 'serie' | 'filme' = i % 3 === 0 ? 'serie' : 'filme'
    return {
      id: `${cat}-${i}`,
      name,
      cat,
      kind,
      duration: kind === 'serie' ? `${30 + (h % 30)}min/ep` : `${90 + (h % 60)}min`,
      episodes: kind === 'serie' ? 6 + (h % 12) : undefined,
      poster: '',
      hue: h % 360,
    }
  })
}

export const TAZ_CAPABILITIES = [
  '📺 Votar no Reality TV Singular — digite: "Taz no Reality — quero meu voto pra programa X" (participação apenas por texto).',
  '✍️ Publicar frase no painel Texts — digite: "Publicar frase (sua frase)".',
  '🎬 Informar a programação atual, novelas e placar do TV Singular.',
  '📍 Mostrar atividades Pontilhismo perto de você, com dias e horários.',
  '💼 Listar as Vagas do QServer.',
  '🔔 Avisar quando canais YouPlay que você assina publicarem vídeo novo.',
  '⭐ Avisar quando contas ESTRELADAS do 7Play publicarem algo novo.',
  '💡 Curiosidades e ajuda sobre 7PLAY, YOUPLAY, BaoID, Pontilhismo e QServer.',
]

export const TV_SINGULAR = {
  programas: ['19:30 — TV Singular Ao Vivo (votação aberta)', '20:10 — Novela "Coração de Neon" — cap. 42', '21:00 — Reality "A Casa Q" — gala semanal', '21:40 — Show Musical convidado', '22:20 — Resumo e resultados'],
  placar: [{ nome: 'Equipe Neon', pts: 1280 }, { nome: 'Equipe Q', pts: 1175 }, { nome: 'Equipe Aurora', pts: 1090 }, { nome: 'Equipe Pontilhismo', pts: 940 }],
  novelas: ['Coração de Neon — cap. 42 amanhã', 'Herança de Vidro — final na sexta', 'Rua 7 — nova temporada'],
}

export const PONTILHISMO_ATIVIDADES = [
  { nome: 'Polo Centro — Oficina de Pontilhismo', quando: 'Terças e quintas, 19h', local: 'Rua das Artes, 77' },
  { nome: 'Polo Zona Sul — Roda de Pintura', quando: 'Sábados, 10h', local: 'Av. Colores, 1200' },
  { nome: 'Polo Norte — Encontro Comunitário', quando: 'Domingos, 16h', local: 'Praça QGroup' },
  { nome: 'Polo Leste — Pontilhismo Kids', quando: 'Sábados, 14h', local: 'Esc. Municipal Q' },
]

export const SEED_POSTS = [
  { id: 'p1', author: 'MARIA.7PLAY', authorName: 'Maria Silva', text: 'Acabei de assistir "Órbita Q" no YouPlay. Que final! 😱', stars: 34, estrelada: true, comments: [{ author: 'LUCAS ALUNO.TezSchool', text: 'Melhor série do ano!' }], createdAt: Date.now() - 3600000 },
  { id: 'p2', author: 'SUBADVANCER.QGROUP', authorName: 'SubAdvancer QGroup', text: 'Novas vagas no QServer — confira a aba Vagas do QGroup!', stars: 12, estrelada: true, comments: [], createdAt: Date.now() - 7200000 },
  { id: 'p3', author: 'CARLA LOBA.mygroup', authorName: 'Carla Lobaite', text: 'Oficina de Pontilhismo no Polo Centro amanhã às 19h 🔵⚪', stars: 21, estrelada: false, comments: [{ author: 'MARIA.7PLAY', text: 'Vou comparecer!' }], createdAt: Date.now() - 10800000 },
]

export const SEED_DEPOIMENTOS = [
  { id: 'd1', author: 'MARIA.7PLAY', authorName: 'Maria Silva', text: 'O 7Play mudou minha forma de compartilhar vídeos. Simples e rápido!', createdAt: Date.now() - 86400000 },
  { id: 'd2', author: 'LUCAS ALUNO.TezSchool', authorName: 'Lucas Aluno', text: 'Uso o Tesaka Study todos os dias para estudar com os quizzes da escola.', createdAt: Date.now() - 172800000 },
]

export const SEED_TOPICOS = [
  { id: 'top1', title: 'Como usar o Tesaka Builder?', body: 'O Builder permite montar telas em blocos no desktop. Arraste blocos, defina propriedades e publique!', author: 'ADVENCER.QGROUP', createdAt: Date.now() - 3600000, replies: [] },
]

export const SEED_VAGAS = [
  { id: 'v1', title: 'Monitor Comunitário — Pontilhismo', area: 'Social', polo: 'Polo Centro', createdAt: Date.now() },
  { id: 'v2', title: 'Editor de Vídeo — YouPlay Creators', area: 'Mídia', polo: 'QGroup Matriz', createdAt: Date.now() },
  { id: 'v3', title: 'Professor Voluntário — Tesaka School', area: 'Educação', polo: 'Escola Tesaka', createdAt: Date.now() },
]

export const SEED_PORTAL = [
  { id: 'pt1', kind: 'USUARIOS' as const, title: 'Censo QGroup 2026', body: 'Levantamento de participação: 12.400 usuários ativos nos polos.', createdBy: 'QGROUP', createdAt: Date.now() },
  { id: 'pt2', kind: 'CASOS' as const, title: 'Caso Ponto de Ônibus', body: 'Resolvido: novo abrigo instalado no Polo Norte após votação comunitária.', createdBy: 'QGROUP', createdAt: Date.now() },
  { id: 'pt3', kind: 'POLITICOS' as const, title: 'Registro de Reunião Pública', body: 'Ata aberta da reunião de orçamento comunitário QGroup — 2026.', createdBy: 'QGROUP', createdAt: Date.now() },
]

export function fmtTime(ts: number) {
  return new Date(ts).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
